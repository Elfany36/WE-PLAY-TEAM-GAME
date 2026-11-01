type Handlers={revision:(revision:number)=>void;status:(live:boolean)=>void};
/** Read-only revision channel. Game state and actions keep the authenticated HTTP path. */
export class RoomRevisionFeed{
 private socket:WebSocket|null=null;private retry:ReturnType<typeof setTimeout>|undefined;private heartbeat:ReturnType<typeof setInterval>|undefined;private authTimer:ReturnType<typeof setTimeout>|undefined;private disposed=false;private failures=0;
 constructor(privateEndpoint:string,privateToken:string,handlers:Handlers){this.endpoint=privateEndpoint;this.token=privateToken;this.handlers=handlers}
 private endpoint:string;private token:string;private handlers:Handlers;
 private activity=()=>{if(this.socket?.readyState===WebSocket.OPEN)this.socket.send(JSON.stringify({type:'ping',active:!document.hidden}))};
 start(){document.addEventListener('visibilitychange',this.activity);this.connect()}
 private connect(){
  if(this.disposed||typeof WebSocket==='undefined')return;
  const url=new URL(this.endpoint,location.href);url.protocol=url.protocol==='https:'?'wss:':'ws:';url.searchParams.set('stream','1');
  let socket:WebSocket;try{socket=new WebSocket(url)}catch{this.handlers.status(false);return}this.socket=socket;
  socket.onopen=()=>{if(this.disposed)return;socket.send(JSON.stringify({type:'auth',token:this.token,active:!document.hidden}));this.authTimer=setTimeout(()=>socket.close(),5000)};
  socket.onmessage=event=>{
   if(this.disposed||this.socket!==socket||typeof event.data!=='string'||event.data.length>256)return;
   let data:{type?:string;revision?:number};try{data=JSON.parse(event.data)}catch{return}
   if(!data||typeof data!=='object')return;
   if(data.type==='ready'){clearTimeout(this.authTimer);this.failures=0;this.handlers.status(true);clearInterval(this.heartbeat);this.heartbeat=setInterval(()=>{if(!document.hidden)this.activity()},3000)}
   if((data.type==='ready'||data.type==='revision')&&Number.isSafeInteger(data.revision)&&data.revision!>=0)this.handlers.revision(data.revision!);
  };
  socket.onerror=()=>socket.close();
  socket.onclose=event=>{if(this.socket!==socket)return;clearTimeout(this.authTimer);clearInterval(this.heartbeat);this.socket=null;this.handlers.status(false);if(!this.disposed&&![4001,1008].includes(event.code))this.retry=setTimeout(()=>this.connect(),Math.min(30000,1000*2**Math.min(this.failures++,5)))};
 }
 stop(){document.removeEventListener('visibilitychange',this.activity);this.disposed=true;clearTimeout(this.retry);clearTimeout(this.authTimer);clearInterval(this.heartbeat);this.handlers.status(false);const socket=this.socket;this.socket=null;socket?.close(1000,'Leaving room updates')}
}
