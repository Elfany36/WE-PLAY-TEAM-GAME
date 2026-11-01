type Handlers={revision:(revision:number)=>void;status:(live:boolean)=>void;snapshot?:(data:any,bytes?:number)=>void;latency?:(rtt:number)=>void;capabilities?:(streaming:boolean)=>void};
/** Hibernatable authenticated stream; legacy servers keep revision/HTTP fallback. */
export class RoomRevisionFeed{
 private socket:WebSocket|null=null;private retry:ReturnType<typeof setTimeout>|undefined;private heartbeat:ReturnType<typeof setInterval>|undefined;private authTimer:ReturnType<typeof setTimeout>|undefined;private disposed=false;private failures=0;private streaming=false;private active=true;
 private pending=new Map<string,{resolve:(ok:boolean)=>void;reject:(e:Error)=>void;timer:ReturnType<typeof setTimeout>}>();
 constructor(private endpoint:string,private token:string,private handlers:Handlers,private realtime=false){}
 private activity=()=>{if(this.socket?.readyState===WebSocket.OPEN)this.socket.send(JSON.stringify({type:'ping',active:this.active&&!document.hidden,id:performance.now()}))};
 setActive(active:boolean){this.active=active;this.activity()}
 resync(){if(this.socket?.readyState===WebSocket.OPEN)this.socket.send('{"type":"resync"}')}
 sendControl(packet:Record<string,any>):Promise<boolean>{
  const socket=this.socket;if(!this.streaming||!this.active||!socket||socket.readyState!==WebSocket.OPEN||socket.bufferedAmount>32768)return Promise.resolve(false);
  return new Promise((resolve,reject)=>{const id=packet.requestId,timer=setTimeout(()=>{this.pending.delete(id);reject(Object.assign(Error('Live control timed out.'),{status:503}))},1500);this.pending.set(id,{resolve,reject,timer});try{socket.send(JSON.stringify({type:'control',packet}))}catch(e){clearTimeout(timer);this.pending.delete(id);reject(e as Error)}});
 }
 start(){document.addEventListener('visibilitychange',this.activity);this.connect()}
 private connect(){
  if(this.disposed||typeof WebSocket==='undefined')return;
  const url=new URL(this.endpoint,location.href);url.protocol=url.protocol==='https:'?'wss:':'ws:';url.searchParams.set('stream','1');
  let socket:WebSocket;try{socket=new WebSocket(url)}catch{this.handlers.status(false);return}this.socket=socket;
  socket.onopen=()=>{if(this.disposed)return;socket.send(JSON.stringify({type:'auth',token:this.token,active:this.active&&!document.hidden,...(this.realtime?{realtime:true}:{})}));this.authTimer=setTimeout(()=>socket.close(),5000)};
  socket.onmessage=event=>{
   if(this.disposed||this.socket!==socket||typeof event.data!=='string'||event.data.length>524288)return;
   let data:any;try{data=JSON.parse(event.data)}catch{return}if(!data||typeof data!=='object')return;
   if(data.type==='ready'){clearTimeout(this.authTimer);this.failures=0;this.streaming=data.protocol==='state-v1';this.handlers.capabilities?.(this.streaming);this.handlers.status(true);clearInterval(this.heartbeat);this.activity();this.heartbeat=setInterval(()=>{if(!document.hidden)this.activity()},3000)}
   if(data.type==='snapshot'){if(!this.streaming){this.streaming=true;this.handlers.capabilities?.(true)}this.handlers.snapshot?.(data,event.data.length);return}if(data.type==='revision'&&data.http){this.streaming=false;this.handlers.capabilities?.(false)}
   if(data.type==='pong'&&Number.isFinite(data.id)){this.handlers.latency?.(Math.max(0,performance.now()-data.id));return}
   if(data.type==='ack'&&typeof data.id==='string'){const p=this.pending.get(data.id);if(p){clearTimeout(p.timer);this.pending.delete(data.id);if(data.error)p.reject(Object.assign(Error(data.error),{status:data.status||503}));else p.resolve(true)}return}
   if((data.type==='ready'||data.type==='revision')&&Number.isSafeInteger(data.revision)&&data.revision>=0)this.handlers.revision(data.revision);
  };
  socket.onerror=()=>socket.close();
  socket.onclose=event=>{if(this.socket!==socket)return;clearTimeout(this.authTimer);clearInterval(this.heartbeat);this.socket=null;this.streaming=false;this.handlers.capabilities?.(false);this.handlers.status(false);this.rejectPending();if(!this.disposed&&![4001,1008].includes(event.code))this.retry=setTimeout(()=>this.connect(),Math.min(10000,400*2**Math.min(this.failures++,5)))};
 }
 private rejectPending(){for(const p of this.pending.values()){clearTimeout(p.timer);p.reject(Object.assign(Error('Live controls reconnecting.'),{status:503}))}this.pending.clear()}
 stop(){document.removeEventListener('visibilitychange',this.activity);this.disposed=true;clearTimeout(this.retry);clearTimeout(this.authTimer);clearInterval(this.heartbeat);this.handlers.status(false);this.handlers.capabilities?.(false);this.rejectPending();const socket=this.socket;this.socket=null;socket?.close(1000,'Leaving room updates')}
}
