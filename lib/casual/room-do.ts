import {DurableObject} from 'cloudflare:workers';
import {createArenaAPI} from '../arena-api.ts';
import {createCasualAPI} from './api.ts';
import {RoomStore} from './room-store.ts';
type AuthorityState={players:{id:string;tokenHash:string;retired?:boolean}[]};
type Subscription={playerId:string;tokenHash:string;expiresAt:number;revision:number};
/** Durable authority; sockets only announce committed revisions, never private game state. */
class RoomAuthority extends DurableObject<Cloudflare.Env>{
 private readonly db:RoomStore;
 private authentication=new Map<WebSocket,{timer:ReturnType<typeof setTimeout>;done:()=>void}>();
 private notificationTimer:ReturnType<typeof setTimeout>|undefined;
 private kind:'casual'|'arena';
 constructor(ctx:DurableObjectState,env:Cloudflare.Env,kind:'casual'|'arena'){
  super(ctx,env);this.kind=kind;this.db=new RoomStore(ctx.storage,()=>this.scheduleNotification(),kind==='arena'?'arena_rooms':'casual_rooms');
  ctx.blockConcurrencyWhile(()=>this.db.load());
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
   try{socket.send(JSON.stringify({type:'revision',revision:row.revision}));socket.serializeAttachment({...session,revision:row.revision})}catch{socket.close(1011,'Reconnect room updates')}
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
  if(typeof message!=='string'||message.length>256){socket.close(1008,'Invalid room update message');return}
  let value:{type?:string;token?:string};try{value=JSON.parse(message)}catch{socket.close(1008,'Invalid room update message');return}
  if(!value||typeof value!=='object'||Array.isArray(value)){socket.close(1008,'Invalid room update message');return}
  const row=this.db.snapshot();if(!row){socket.close(4001,'Room expired');return}
  const prior=socket.deserializeAttachment() as Subscription|null;
  if(prior){if(Date.now()>=prior.expiresAt){socket.close(4001,'Room expired');return}if(value.type==='ping'){socket.send('{"type":"pong"}');return}socket.close(1008,'Read-only room updates');return}
  if(value.type!=='auth'||typeof value.token!=='string'||!/^[a-f0-9]{64}$/.test(value.token)){socket.close(4001,'Join the room first');return}
  const tokenHash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value.token))),n=>n.toString(16).padStart(2,'0')).join(''),current=this.db.snapshot();if(!current){socket.close(4001,'Room expired');return}const state=JSON.parse(current.state) as AuthorityState,player=state.players.find(p=>!p.retired&&p.tokenHash===tokenHash);
  if(!player){socket.close(4001,'Room session ended');return}
  const auth=this.authentication.get(socket);if(auth){clearTimeout(auth.timer);auth.done();this.authentication.delete(socket)}
  socket.serializeAttachment({playerId:player.id,tokenHash,expiresAt:current.created_at+86400000,revision:current.revision} satisfies Subscription);
  socket.send(JSON.stringify({type:'ready',revision:current.revision}));
 }
 webSocketClose(socket:WebSocket,code:number,reason:string){const auth=this.authentication.get(socket);if(auth){clearTimeout(auth.timer);auth.done();this.authentication.delete(socket)}try{socket.close(code===1000||code>=3000&&code<=4999?code:1000,'Room updates closed')}catch{}}
 webSocketError(socket:WebSocket){socket.close(1011,'Reconnect room updates')}
}

export class CasualRoom extends RoomAuthority{constructor(ctx:DurableObjectState,env:Cloudflare.Env){super(ctx,env,'casual')}}
export class ArenaRoom extends RoomAuthority{constructor(ctx:DurableObjectState,env:Cloudflare.Env){super(ctx,env,'arena')}}
