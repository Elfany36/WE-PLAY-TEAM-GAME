import {ROOM_HINT_HEADERS} from './room-params.ts';

type Handlers={revision:(revision:number)=>void;status:(live:boolean)=>void;state?:(data:any)=>boolean|void};
type Pending={resolve:(response:Response)=>void;reject:(error:Error)=>void;cleanup:()=>void};
const HEARTBEAT=3000,STALE_AFTER=9000;
const unavailable=()=>Object.assign(Error('Reconnecting live room updates.'),{status:503});

/** Authenticated live state and receipts, compatible with revision-only servers. */
export class RoomRevisionFeed{
 private socket:WebSocket|null=null;
 private retry:ReturnType<typeof setTimeout>|undefined;
 private heartbeat:ReturnType<typeof setInterval>|undefined;
 private handshake:ReturnType<typeof setTimeout>|undefined;
 private disposed=false;private started=false;private ended=false;private failures=0;
 private ready=false;private protocol=1;private lastMessage=0;private sequence=0;
 private pending=new Map<string,Pending>();
 private endpoint:string;private token:string;private handlers:Handlers;
 constructor(endpoint:string,token:string,handlers:Handlers){this.endpoint=endpoint;this.token=token;this.handlers=handlers}
 get streaming(){return this.ready&&this.protocol===2}
 start(){
  if(this.started||this.disposed)return;this.started=true;
  document.addEventListener('visibilitychange',this.wake);window.addEventListener('online',this.wake);this.connect();
 }
 private wake=()=>{
  if(this.disposed||this.ended)return;
  if(document.hidden){this.ping();return}
  if(this.socket&&Date.now()-this.lastMessage>=STALE_AFTER)this.disconnect(this.socket,true);
  if(!this.socket){clearTimeout(this.retry);this.connect()}else this.ping();
 };
 private ping(){
  if(this.socket?.readyState!==WebSocket.OPEN||!this.ready)return;
  try{this.socket.send(JSON.stringify({type:'ping',active:!document.hidden}))}catch{this.disconnect(this.socket,true)}
 }
 resync(){if(this.socket?.readyState===WebSocket.OPEN&&this.streaming)try{this.socket.send(JSON.stringify({type:'ping',active:!document.hidden,resync:true}))}catch{this.disconnect(this.socket,true)}}
 private reconnect(){
  if(this.disposed||this.ended)return;clearTimeout(this.retry);
  const delay=Math.min(30000,1000*2**Math.min(this.failures++,5))*(.8+Math.random()*.2);
  this.retry=setTimeout(()=>this.connect(),delay);
 }
 private disconnect(socket:WebSocket,retry:boolean){
  if(this.socket!==socket)return;this.socket=null;this.ready=false;this.protocol=1;
  clearTimeout(this.handshake);clearInterval(this.heartbeat);this.handlers.status(false);
  for(const entry of this.pending.values()){entry.cleanup();entry.reject(unavailable())}this.pending.clear();
  try{socket.close(1000,'Reconnect room updates')}catch{}
  if(retry)this.reconnect();
 }
 private connect(){
  if(this.disposed||this.ended||this.socket||typeof WebSocket==='undefined')return;
  const url=new URL(this.endpoint,location.href);url.protocol=url.protocol==='https:'?'wss:':'ws:';url.searchParams.set('stream','1');
  let socket:WebSocket;try{socket=new WebSocket(url)}catch{this.handlers.status(false);this.reconnect();return}
  this.socket=socket;this.lastMessage=Date.now();
  // A connection that never opens must recover too.
  this.handshake=setTimeout(()=>this.disconnect(socket,true),8000);
  socket.onopen=()=>{if(this.disposed||this.socket!==socket)return;try{socket.send(JSON.stringify({type:'auth',token:this.token,active:!document.hidden,protocol:2,stateAck:true}))}catch{this.disconnect(socket,true)}};
  socket.onmessage=event=>{
   if(this.disposed||this.socket!==socket||typeof event.data!=='string'||event.data.length>2_000_000)return;
   let data:any;try{data=JSON.parse(event.data)}catch{return}
   if(!data||typeof data!=='object'||Array.isArray(data))return;
   const revision=Number.isSafeInteger(data.revision)&&data.revision>=0;
   if(data.type==='ready'&&revision){
    this.lastMessage=Date.now();this.ready=true;this.protocol=data.protocol===2?2:1;clearTimeout(this.handshake);this.failures=0;
    this.handlers.status(true);clearInterval(this.heartbeat);
    this.heartbeat=setInterval(()=>{if(document.hidden)return;if(Date.now()-this.lastMessage>=STALE_AFTER)this.disconnect(socket,true);else this.ping()},HEARTBEAT);
   }
   if(!this.ready)return;
   if(data.type==='pong'){this.lastMessage=Date.now();return}
   if((data.type==='ready'||data.type==='revision')&&revision){this.lastMessage=Date.now();this.handlers.revision(data.revision)}
   if(data.type==='state'&&this.protocol===2&&data.data&&typeof data.data==='object'){
    this.lastMessage=Date.now();const accepted=this.handlers.state?.(data.data),revision=data.data.room?.revision??data.data.revision;
    if(accepted!==false&&Number.isSafeInteger(revision)&&revision>=0)try{socket.send(JSON.stringify({type:'ack',revision}))}catch{this.disconnect(socket,true)}
   }
   if(data.type==='response'&&typeof data.id==='string'&&Number.isInteger(data.status)&&data.status>=200&&data.status<=599){
    this.lastMessage=Date.now();const entry=this.pending.get(data.id);if(!entry)return;this.pending.delete(data.id);entry.cleanup();entry.resolve(Response.json(data.data,{status:data.status}));
   }
  };
  socket.onerror=()=>this.disconnect(socket,true);
  socket.onclose=event=>{if(this.socket!==socket)return;this.ended=[4001,1008].includes(event.code);this.disconnect(socket,!this.ended)};
 }
 /** Return null when HTTP is needed. Uncertain actions keep their original request ID. */
 request(url:URL,init:RequestInit):Promise<Response>|null{
  const socket=this.socket,method=(init.method||'GET').toUpperCase(),own=new URL(this.endpoint,location.href),headers=new Headers(init.headers);
  if(!socket||!this.streaming||socket.readyState!==WebSocket.OPEN||socket.bufferedAmount>65536||this.pending.size>=16||url.origin!==own.origin||url.pathname!==own.pathname||headers.get('Authorization')!=='Bearer '+this.token||!['GET','POST'].includes(method))return null;
  let body:any;if(method==='POST'){if(typeof init.body!=='string'||new TextEncoder().encode(init.body).length>4000)return null;try{body=JSON.parse(init.body)}catch{return null}if(!body||['create','join','leave','disconnect','draft-phone','submit-phone'].includes(body.action))return null;}
  if((body?.code??url.searchParams.get('code'))!==own.searchParams.get('code'))return null;
  const id=String(++this.sequence),hints=Object.fromEntries(Object.entries(ROOM_HINT_HEADERS).map(([key,header])=>[key,headers.get(header)||'']));
  return new Promise((resolve,reject)=>{
   const abort=()=>{this.pending.delete(id);reject(new DOMException('Room request aborted.','AbortError'))},cleanup=()=>init.signal?.removeEventListener('abort',abort);
   if(init.signal?.aborted){abort();return}
   this.pending.set(id,{resolve,reject,cleanup});init.signal?.addEventListener('abort',abort,{once:true});
   try{socket.send(JSON.stringify({type:'request',id,method,body,hints}))}catch{cleanup();this.pending.delete(id);reject(unavailable());this.disconnect(socket,true)}
  });
 }
 stop(){
  if(this.disposed)return;this.disposed=true;document.removeEventListener('visibilitychange',this.wake);window.removeEventListener('online',this.wake);
  clearTimeout(this.retry);clearTimeout(this.handshake);clearInterval(this.heartbeat);
  if(this.socket)this.disconnect(this.socket,false);else this.handlers.status(false);
 }
}
