import {DurableObject} from 'cloudflare:workers';
import {createArenaAPI} from '../arena-api.ts';
import {createCasualAPI} from './api.ts';
import {RoomStore} from './room-store.ts';
import {roomBatch} from '../room-batch.ts';
import {advanceCasual,publicCasual,type CasualState} from './engine.ts';
import {casualTickDelay} from './room-timing.ts';
import {continuousRoom,roomFanoutScene} from './fanout-timing.ts';
import {publicArena,type ArenaState} from '../arena-engine.ts';
import {roomSnapshot} from '../room-snapshots.ts';
import {roomStreamRequest,STATE_INTERVAL,MAX_STATE_WINDOW} from '../room-stream.ts';
type AuthorityState={players:{id:string;tokenHash:string;retired?:boolean}[]};
type Subscription={playerId:string;tokenHash:string;expiresAt:number;revision:number;activeAt?:number;protocol?:number;base?:string;windowAt?:number;requests?:number;stateAck?:boolean;pending?:number[];stateWindow?:number};
/** Durable authority: private live snapshots and validated actions share the HTTP rule engine. */
class RoomAuthority extends DurableObject<Cloudflare.Env>{
 private readonly db:RoomStore;
 private authentication=new Map<WebSocket,{timer:ReturnType<typeof setTimeout>;done:()=>void}>();
 private notificationTimer:ReturnType<typeof setTimeout>|undefined;
 private lastNotificationAt=0;
 private lastNotificationScene='';
 private kind:'casual'|'arena';
 private tickTimer:ReturnType<typeof setTimeout>|undefined;
 private tickAt=0;
 private tickRunning=false;
 private tickFailures=0;
 constructor(ctx:DurableObjectState,env:Cloudflare.Env,kind:'casual'|'arena'){
  super(ctx,env);this.kind=kind;this.db=new RoomStore(ctx.storage,()=>{this.scheduleNotification();this.armTick()},kind==='arena'?'arena_rooms':'casual_rooms');
  ctx.blockConcurrencyWhile(async()=>{await this.db.load();this.armTick()});
 }
 private foreground(now:number,state:AuthorityState){return this.ctx.getWebSockets().map(socket=>socket.deserializeAttachment() as Subscription|null).filter((s):s is Subscription=>!!s&&s.expiresAt>now&&!!s.activeAt&&now-s.activeAt<10000&&state.players.some(p=>!p.retired&&p.id===s.playerId&&p.tokenHash===s.tokenHash))}
 private armTick(){
  if(this.tickRunning||this.kind!=='casual')return;
  const row=this.db.snapshot();if(!row)return;const state=this.db.inspectState<CasualState>()!;
  const now=Date.now();
  if(state.phase!=='playing'||!state.game||!this.foreground(now,state).length){if(this.tickTimer)clearTimeout(this.tickTimer);this.tickTimer=undefined;this.tickAt=0;return}
  const delay=Math.min(4000,casualTickDelay(state,now)*2**this.tickFailures);
  // A newly committed human move may need to wake an otherwise idle table sooner.
  if(this.tickTimer&&this.tickAt<=now+delay)return;
  if(this.tickTimer)clearTimeout(this.tickTimer);
  this.tickAt=now+delay;
  this.tickTimer=setTimeout(()=>{this.tickTimer=undefined;this.tickAt=0;this.ctx.waitUntil(this.tick())},delay);
 }
 private async releaseInput(socket:WebSocket,session:Subscription){
  if(this.kind!=='casual')return;
  const row=this.db.snapshot();if(!row)return;
  const state=this.db.inspectState<CasualState>()!;
  if(!state.game||!['circuit','sumo','tanks','pong','marble','blocks','pirate'].includes(state.game.kind)||!('inputs'in state.game)||!state.game.inputs[session.playerId])return;
  if(this.ctx.getWebSockets().some(other=>{if(other===socket)return false;const s=other.deserializeAttachment() as Subscription|null;return s?.playerId===session.playerId&&s.tokenHash===session.tokenHash&&!!s.activeAt&&Date.now()-s.activeAt<10000}))return;
  await roomBatch<CasualState>(this.db,'casual:'+row.code,async()=>{const current=this.db.snapshot();if(!current)throw Error('Room expired');return{state:JSON.parse(current.state),revision:current.revision}},async(next,revision)=>!!(await this.db.prepare('UPDATE casual_rooms SET state=?, revision=revision+1 WHERE code=? AND revision=?').bind(JSON.stringify(next),row.code,revision).run()).meta.changes,()=>Error('Room busy'),task=>this.ctx.waitUntil(task),true).run((next)=>{
   const game=next.game,player=next.players.find(p=>!p.retired&&p.id===session.playerId&&p.tokenHash===session.tokenHash);if(!player||!game||!['circuit','sumo','tanks','pong','marble','blocks','pirate'].includes(game.kind)||!('inputs'in game)||!game.inputs[session.playerId])return{state:next,changed:false,result:()=>undefined};
   delete game.inputs[session.playerId];return{state:next,changed:true,result:()=>undefined};
  });
 }
 private async tick(){
  if(this.tickRunning)return;this.tickRunning=true;
  try{
   const row=this.db.snapshot();if(!row)return;
   await roomBatch<CasualState>(this.db,'casual:'+row.code,async()=>{const current=this.db.snapshot();if(!current)throw Error('Room expired');return{state:JSON.parse(current.state),revision:current.revision}},async(state,revision)=>!!(await this.db.prepare('UPDATE casual_rooms SET state=?, revision=revision+1 WHERE code=? AND revision=?').bind(JSON.stringify(state),row.code,revision).run()).meta.changes,()=>Error('Room busy'),task=>this.ctx.waitUntil(task),true).run((state,now)=>{
    const active=this.foreground(now,state);if(!active.length)return{state,changed:false,result:()=>undefined};
    const next=advanceCasual(state,now);for(const session of active){const player=next.state.players.find(p=>p.id===session.playerId);if(player&&now-player.lastSeen>5000){player.lastSeen=now;next.changed=true}}
    return{state:next.state,changed:next.changed,result:()=>undefined};
   });this.tickFailures=0;
  }catch{this.tickFailures=Math.min(5,this.tickFailures+1)}finally{
   // Fan out the just-committed tick without adding a second 50 ms timer.
   if(!this.tickFailures){clearTimeout(this.notificationTimer);this.notificationTimer=undefined;this.notify()}
   this.tickRunning=false;this.armTick();
  }
 }
 async alarm(){
  await this.db.expire(Date.now());
  if(!this.db.snapshot()){
   clearTimeout(this.tickTimer);clearTimeout(this.notificationTimer);this.tickTimer=undefined;this.tickAt=0;this.notificationTimer=undefined;
   for(const socket of this.ctx.getWebSockets())try{socket.close(4001,'Room expired')}catch{}
  }
 }
 private scheduleNotification(){
  if(this.notificationTimer||!this.ctx.getWebSockets().length)return;
  if(this.kind==='casual'){
   const state=this.db.inspectState<CasualState>(),now=Date.now();
   // Held-input commits need not fill the pipe with a pose from the previous tick.
   // Phase/round changes and countdowns still publish immediately.
   if(state&&continuousRoom(state,now)&&!this.tickFailures&&(this.tickRunning||this.tickTimer)&&this.lastNotificationScene===roomFanoutScene(state))return;
  }
  const delay=Math.max(0,this.lastNotificationAt+STATE_INTERVAL-Date.now());
  this.notificationTimer=setTimeout(()=>{this.notificationTimer=undefined;this.notify()},delay);
 }
 private notify(){
  const row=this.db.snapshot();if(!row)return;
  const state=this.db.inspectState<AuthorityState>()!,now=Date.now();
  this.lastNotificationAt=now;
  if(this.kind==='casual')this.lastNotificationScene=roomFanoutScene(state as CasualState);
  for(const socket of this.ctx.getWebSockets()){
   const session=socket.deserializeAttachment() as Subscription|null;
   if(!session?.playerId)continue;
   const player=state.players.find(p=>p.id===session.playerId&&!p.retired&&p.tokenHash===session.tokenHash);
   if(!player||now>=session.expiresAt){socket.close(4001,'Room session ended');continue}
   if(session.revision>=row.revision)continue;
   try{
    if(session.protocol===2&&!(this.kind==='casual'&&(state as CasualState).mode==='phone')){
     if(!session.activeAt||now-session.activeAt>=10000)continue;
     // Bound reliable-stream backlog. Slow clients receive the newest committed
     // state after acknowledging a slot, rather than a queue of obsolete poses.
     if(session.stateAck&&(session.pending?.length||0)>=(session.stateWindow||4))continue;
     const room=this.kind==='casual'?publicCasual(state as CasualState,session.playerId,now):publicArena(state as ArenaState,session.playerId,now);
     const url=new URL('https://room.internal/api/'+this.kind);url.searchParams.set('wire','1');if(session.base)url.searchParams.set('base',session.base);
     const data=roomSnapshot(new Request(url),{room:{...room,revision:row.revision},clock:{receivedAt:now,sentAt:now,stateInterval:STATE_INTERVAL}});
     socket.send(JSON.stringify({type:'state',data}));socket.serializeAttachment({...session,revision:row.revision,base:data.snapshotId,...(session.stateAck?{pending:[...(session.pending||[]),row.revision]}:{})});
    }else{socket.send(JSON.stringify({type:'revision',revision:row.revision}));socket.serializeAttachment({...session,revision:row.revision})}
   }catch{socket.close(1011,'Reconnect room updates')}
  }
 }
 async fetch(req:Request){
  const code=req.headers.get('X-Room-Key');
  // Cross-service joins must fall back to the original authority, not copy it.
  if(code&&req.headers.get('X-Room-Legacy')!=='deny'&&!req.headers.has('X-Room-Code'))await this.db.importLegacy(this.env.DB,code);
  if(req.method==='GET'&&new URL(req.url).searchParams.get('stream')==='1'&&req.headers.get('Upgrade')?.toLowerCase()==='websocket'){
   if(!this.db.snapshot())return Response.json({error:'Room not found.'},{status:404});
   if(this.ctx.getWebSockets().length>=32)return Response.json({error:'Room update connections are busy.'},{status:429});
   const pair=new WebSocketPair(),[client,server]=Object.values(pair);this.ctx.acceptWebSocket(server);
   // Authentication is the first encrypted frame; no bearer goes into a URL or log.
   server.serializeAttachment(null);
   this.ctx.waitUntil(new Promise<void>(done=>{const timer=setTimeout(()=>{this.authentication.delete(server);server.close(4001,'Authenticate room updates');done()},8000);this.authentication.set(server,{timer,done})}));
   return new Response(null,{status:101,webSocket:client});
  }
  const api=(this.kind==='arena'?createArenaAPI:createCasualAPI)(this.db,task=>this.ctx.waitUntil(task),req.headers.get('X-Room-Code')||undefined);
  if(req.method==='GET')return api.GET(req);
  if(req.method==='POST')return api.POST(req);
  if(req.method==='OPTIONS')return api.OPTIONS(req);
  return new Response('Method not allowed',{status:405});
 }
 async webSocketMessage(socket:WebSocket,message:string|ArrayBuffer){
  if(typeof message!=='string'||message.length>8192){socket.close(1008,'Invalid room update message');return}
  let value:any;try{value=JSON.parse(message)}catch{socket.close(1008,'Invalid room update message');return}
  if(!value||typeof value!=='object'||Array.isArray(value)){socket.close(1008,'Invalid room update message');return}
  const row=this.db.snapshot();if(!row){socket.close(4001,'Room expired');return}
  const prior=socket.deserializeAttachment() as Subscription|null;
  if(prior){
   const now=Date.now();if(now>=prior.expiresAt){socket.close(4001,'Room session ended');return}
   if(value.type==='ack'&&prior.stateAck){
    if(Number.isSafeInteger(value.revision)&&prior.pending?.includes(value.revision)){socket.serializeAttachment({...prior,pending:prior.pending.filter(revision=>revision>value.revision),...(Number.isInteger(value.stateWindow)&&value.stateWindow>=4&&value.stateWindow<=MAX_STATE_WINDOW?{stateWindow:value.stateWindow}:{})});this.scheduleNotification()}return;
   }
   const state=this.db.inspectState<AuthorityState>()!;
   if(!state.players.some(p=>!p.retired&&p.id===prior.playerId&&p.tokenHash===prior.tokenHash)){socket.close(4001,'Room session ended');return}
   if(value.type==='ping'){
    const fresh=value.active===true&&(!prior.activeAt||now-prior.activeAt>=10000||value.resync===true);
    socket.serializeAttachment({...prior,activeAt:value.active===true?now:0,...(fresh?{revision:-1,base:undefined,pending:[]}:{})});this.armTick();socket.send(JSON.stringify({type:'pong',...(Number.isSafeInteger(value.id)?{id:value.id}:{})}));if(value.active!==true)await this.releaseInput(socket,prior);if(fresh)this.notify();return;
   }

   if(value.type==='request'&&prior.protocol===2){
    const requests=now-(prior.windowAt||0)>=1000?1:(prior.requests||0)+1;
    socket.serializeAttachment({...prior,requests,windowAt:requests===1?now:prior.windowAt});
    if(requests>60){socket.send(JSON.stringify({type:'response',id:value.id,status:429,data:{error:'Too many room requests.'}}));return}
    try{
     const request=roomStreamRequest(value,row.code,this.kind),api=(this.kind==='arena'?createArenaAPI:createCasualAPI)(this.db,task=>this.ctx.waitUntil(task),undefined,prior.tokenHash);
     const response=await(request.method==='GET'?api.GET(request):api.POST(request));
     socket.send(JSON.stringify({type:'response',id:value.id,status:response.status,data:await response.json()}));
    }catch(error){socket.send(JSON.stringify({type:'response',id:value.id,status:(error as any)?.status||503,data:{error:(error as any)?.status?(error as Error).message:'Reconnect and try again.'}}))}
    return;
   }
   socket.close(1008,'Invalid room update message');return;
  }
  if(value.type!=='auth'||typeof value.token!=='string'||!/^[a-f0-9]{64}$/.test(value.token)){socket.close(4001,'Join the room first');return}
  const tokenHash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value.token))),n=>n.toString(16).padStart(2,'0')).join(''),current=this.db.snapshot();if(!current){socket.close(4001,'Room expired');return}const state=this.db.inspectState<AuthorityState>()!,player=state.players.find(p=>!p.retired&&p.tokenHash===tokenHash);
  if(!player){socket.close(4001,'Room session ended');return}
  const auth=this.authentication.get(socket);if(auth){clearTimeout(auth.timer);auth.done();this.authentication.delete(socket)}
  const protocol=value.protocol===2?2:1;
  socket.serializeAttachment({playerId:player.id,tokenHash,expiresAt:current.created_at+86400000,revision:protocol===2?-1:current.revision,activeAt:value.active===true?Date.now():0,protocol,stateAck:protocol===2&&value.stateAck===true,pending:[],stateWindow:Number.isInteger(value.stateWindow)&&value.stateWindow>=4&&value.stateWindow<=MAX_STATE_WINDOW?value.stateWindow:4} satisfies Subscription);this.armTick();
  socket.send(JSON.stringify({type:'ready',revision:current.revision,protocol,receipts:true,autonomous:this.kind==='casual'}));if(protocol===2)this.notify();
 }
 webSocketClose(socket:WebSocket,code:number,reason:string){const session=socket.deserializeAttachment() as Subscription|null;if(session)this.ctx.waitUntil(this.releaseInput(socket,session).catch(()=>{}));const auth=this.authentication.get(socket);if(auth){clearTimeout(auth.timer);auth.done();this.authentication.delete(socket)}try{socket.close(code===1000||code>=3000&&code<=4999?code:1000,'Room updates closed')}catch{}}
 webSocketError(socket:WebSocket){socket.close(1011,'Reconnect room updates')}
}

export class CasualRoom extends RoomAuthority{constructor(ctx:DurableObjectState,env:Cloudflare.Env){super(ctx,env,'casual')}}
export class ArenaRoom extends RoomAuthority{constructor(ctx:DurableObjectState,env:Cloudflare.Env){super(ctx,env,'arena')}}
