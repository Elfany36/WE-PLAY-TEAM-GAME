import {DurableObject} from 'cloudflare:workers';
import {createArenaAPI} from '../arena-api.ts';
import {casualBody,createCasualAPI} from './api.ts';
import {RoomStore} from './room-store.ts';
import {roomBatch} from '../room-batch.ts';
import {streamFrame,type StreamBase} from '../room-stream-frame.ts';
import {takeRoomBudget} from '../room-budget.ts';
import {CasualError} from './error.ts';
import {advanceCasual,applyCasualAction,publicCasual,type CasualState} from './engine.ts';
type AuthorityState={players:{id:string;tokenHash:string;retired?:boolean}[]};
type Subscription={playerId:string;tokenHash:string;expiresAt:number;revision:number;activeAt?:number;realtime?:boolean};
/** Durable authority. Opt-in socket snapshots are projected separately for each authenticated seat. */
class RoomAuthority extends DurableObject<Cloudflare.Env>{
 private readonly db:RoomStore;
 private authentication=new Map<WebSocket,{timer:ReturnType<typeof setTimeout>;done:()=>void}>();
 private notificationTimer:ReturnType<typeof setTimeout>|undefined;
 private kind:'casual'|'arena';
 private tickTimer:ReturnType<typeof setTimeout>|undefined;
 private tickRunning=false;
 private tickFailures=0;
 private frames=new WeakMap<WebSocket,StreamBase>();
 constructor(ctx:DurableObjectState,env:Cloudflare.Env,kind:'casual'|'arena'){
  super(ctx,env);this.kind=kind;this.db=new RoomStore(ctx.storage,()=>{this.scheduleNotification();this.armTick()},kind==='arena'?'arena_rooms':'casual_rooms');
  ctx.blockConcurrencyWhile(async()=>{await this.db.load();this.armTick()});
 }
 private foreground(now:number,state:AuthorityState){return this.ctx.getWebSockets().map(socket=>socket.deserializeAttachment() as Subscription|null).filter((s):s is Subscription=>!!s&&s.expiresAt>now&&!!s.activeAt&&now-s.activeAt<10000&&state.players.some(p=>!p.retired&&p.id===s.playerId&&p.tokenHash===s.tokenHash))}
 private armTick(){
  if(this.tickTimer||this.tickRunning||this.kind!=='casual')return;
  const row=this.db.snapshot();if(!row)return;const state=JSON.parse(row.state) as CasualState;
  if(state.phase!=='playing'||!state.game||!('lastTickAt'in state.game)||!this.foreground(Date.now(),state).length)return;
  this.tickTimer=setTimeout(()=>{this.tickTimer=undefined;this.ctx.waitUntil(this.tick())},Math.min(2000,100*2**this.tickFailures));
 }
 private casualBatch(){
  const row=this.db.snapshot();if(!row)throw new CasualError('Room expired',410);
  return roomBatch<CasualState>(this.db,'casual:'+row.code,async()=>{const current=this.db.snapshot();if(!current)throw new CasualError('Room expired',410);return{state:JSON.parse(current.state),revision:current.revision}},async(state,revision)=>!!(await this.db.prepare('UPDATE casual_rooms SET state=?, revision=revision+1 WHERE code=? AND revision=?').bind(JSON.stringify(state),row.code,revision).run()).meta.changes,()=>new CasualError('Room busy',409),task=>this.ctx.waitUntil(task),true);
 }
 private async tick(){
  if(this.tickRunning)return;this.tickRunning=true;
  try{await this.casualBatch().run((state,now)=>{const active=this.foreground(now,state);if(!active.length)return{state,changed:false,result:()=>undefined};const next=advanceCasual(state,now);for(const session of active){const player=next.state.players.find(p=>p.id===session.playerId);if(player&&now-player.lastSeen>5000){player.lastSeen=now;next.changed=true}}return{state:next.state,changed:next.changed,result:()=>undefined}});this.tickFailures=0;
  }catch{this.tickFailures=Math.min(5,this.tickFailures+1)}finally{this.tickRunning=false;this.armTick()}
 }
 private async stopInput(socket:WebSocket,session:Subscription){
  const row=this.db.snapshot();if(!row||this.kind!=='casual')return;
  const state=JSON.parse(row.state) as CasualState;
  const another=this.ctx.getWebSockets().some(s=>s!==socket&&(()=>{const a=s.deserializeAttachment() as Subscription|null;return a?.playerId===session.playerId&&!!a.activeAt&&Date.now()-a.activeAt<10000})());
  if(another||!state.game||!('inputs'in state.game)||!state.game.inputs[session.playerId])return;
  await this.casualBatch().run((state,now)=>{const next=structuredClone(state);if(next.game&&'inputs'in next.game)delete next.game.inputs[session.playerId];return{state:next,changed:true,result:()=>undefined}});
 }
 async alarm(){await this.db.expire(Date.now())}
 private scheduleNotification(){
  if(this.notificationTimer||!this.ctx.getWebSockets().length)return;
  this.notificationTimer=setTimeout(()=>{this.notificationTimer=undefined;this.notify()},50);
 }
 private notify(){
  const row=this.db.snapshot();if(!row)return;
  const state=JSON.parse(row.state) as AuthorityState,now=Date.now();
  for(const socket of this.ctx.getWebSockets()){
   const session=socket.deserializeAttachment() as Subscription|null;
   if(!session?.playerId)continue;
   const player=state.players.find(p=>p.id===session.playerId&&!p.retired&&p.tokenHash===session.tokenHash);
   if(!player||now>=session.expiresAt){socket.close(4001,'Room session ended');continue}
   if(session.revision>=row.revision)continue;
   try{if(session.realtime&&this.kind==='casual'&&session.activeAt&&now-session.activeAt<10000){
    if(socket.bufferedAmount>65536)continue;
    const room={...publicCasual(state as CasualState,session.playerId,now),revision:row.revision},frame=streamFrame(room,this.frames.get(socket)),encoded=JSON.stringify(frame.packet);if(encoded.length>400000)socket.send(JSON.stringify({type:'revision',revision:row.revision,http:true}));else{socket.send(encoded);this.frames.set(socket,frame.base);}
   }else socket.send(JSON.stringify({type:'revision',revision:row.revision}));socket.serializeAttachment({...session,revision:row.revision})}catch{socket.close(1011,'Reconnect room updates')}
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
  let value:{type?:string;token?:string;active?:boolean;realtime?:boolean;id?:number;packet?:Record<string,any>};try{value=JSON.parse(message)}catch{socket.close(1008,'Invalid room update message');return}
  if(!value||typeof value!=='object'||Array.isArray(value)){socket.close(1008,'Invalid room update message');return}
  const row=this.db.snapshot();if(!row){socket.close(4001,'Room expired');return}
  const prior=socket.deserializeAttachment() as Subscription|null;
  if(prior){
   const member=(JSON.parse(row.state) as AuthorityState).players.some(p=>p.id===prior.playerId&&!p.retired&&p.tokenHash===prior.tokenHash);
   if(Date.now()>=prior.expiresAt||!member){socket.close(4001,'Room expired');return}
   if(value.type==='ping'){socket.serializeAttachment({...prior,activeAt:value.active===true?Date.now():0});if(value.active!==true)await this.stopInput(socket,prior);this.armTick();socket.send(JSON.stringify({type:'pong',...(Number.isFinite(value.id)?{id:value.id}:{})}));if(value.active&&prior.realtime){socket.serializeAttachment({...socket.deserializeAttachment() as Subscription,revision:-1});this.scheduleNotification()}return}
   if(prior.realtime&&value.type==='resync'){this.frames.delete(socket);socket.serializeAttachment({...prior,revision:-1});this.scheduleNotification();return}
   if(prior.realtime&&value.type==='control'&&this.kind==='casual'){
    const packet=value.packet,id=packet?.requestId;
    try{
     if(!packet||!['direction','drive','explore','party-control','block-input'].includes(packet.action))throw new CasualError('Use a live game control.',400);
     if(!prior.activeAt||Date.now()-prior.activeAt>=10000)throw new CasualError('Controls are inactive.',409);
     const b=await casualBody(new Request('https://room.internal/api/casual',{method:'POST',body:JSON.stringify({...packet,code:row.code})}));
     const revision=await this.casualBatch().run((state,now)=>{const player=state.players.find(p=>p.id===prior.playerId&&!p.retired&&p.tokenHash===prior.tokenHash);if(!player)throw new CasualError('Room session ended',401);
      if(player.requests.includes(b.requestId))return{state,changed:false,result:(_s,rev)=>rev};
      const budget={traffic:player.traffic};if(!takeRoomBudget(budget,now,1))throw new CasualError('Too many controls.',429);
      const next=applyCasualAction(state,b,player.id,now),p=next.players.find(p=>p.id===player.id)!;p.traffic=budget.traffic;return{state:next,changed:true,result:(_s,rev)=>rev};
     });socket.send(JSON.stringify({type:'ack',id,revision}));
    }catch(e){socket.send(JSON.stringify({type:'ack',id,error:e instanceof CasualError?e.message:'Control could not be applied.',status:e instanceof CasualError?e.status:503}))}return;
   }
   socket.close(1008,'Unsupported room update message');return;
  }
  if(value.type!=='auth'||typeof value.token!=='string'||!/^[a-f0-9]{64}$/.test(value.token)){socket.close(4001,'Join the room first');return}
  const tokenHash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value.token))),n=>n.toString(16).padStart(2,'0')).join(''),current=this.db.snapshot();if(!current){socket.close(4001,'Room expired');return}const state=JSON.parse(current.state) as AuthorityState,player=state.players.find(p=>!p.retired&&p.tokenHash===tokenHash);
  if(!player){socket.close(4001,'Room session ended');return}
  const auth=this.authentication.get(socket);if(auth){clearTimeout(auth.timer);auth.done();this.authentication.delete(socket)}
  socket.serializeAttachment({playerId:player.id,tokenHash,expiresAt:current.created_at+86400000,revision:current.revision,activeAt:value.active===true?Date.now():0,...(this.kind==='casual'&&value.realtime===true?{realtime:true}:{})} satisfies Subscription);this.armTick();
  socket.send(JSON.stringify({type:'ready',revision:current.revision,...(this.kind==='casual'&&value.realtime===true?{protocol:'state-v1'}:{})}));if(this.kind==='casual'&&value.realtime===true){const session=socket.deserializeAttachment() as Subscription;socket.serializeAttachment({...session,revision:-1});this.scheduleNotification()}
 }
 webSocketClose(socket:WebSocket,code:number,reason:string){const session=socket.deserializeAttachment() as Subscription|null;if(session)this.ctx.waitUntil(this.stopInput(socket,session).catch(()=>{}));const auth=this.authentication.get(socket);if(auth){clearTimeout(auth.timer);auth.done();this.authentication.delete(socket)}try{socket.close(code===1000||code>=3000&&code<=4999?code:1000,'Room updates closed')}catch{}}
 webSocketError(socket:WebSocket){socket.close(1011,'Reconnect room updates')}
}

export class CasualRoom extends RoomAuthority{constructor(ctx:DurableObjectState,env:Cloudflare.Env){super(ctx,env,'casual')}}
export class ArenaRoom extends RoomAuthority{constructor(ctx:DurableObjectState,env:Cloudflare.Env){super(ctx,env,'arena')}}
