import type {RoomRouteSample} from './room-route-probes.ts';
export type ProbeSocketFactory=(url:string)=>WebSocket;
/** A protocol-1 observer can only echo timing packets; it never owns controls or receives a world. */
export function passiveRoomProbe(origin:string,input:{code:string;playerId:string;token:string;kind:'casual'|'arena'},factory:ProbeSocketFactory,signal?:AbortSignal,clock=()=>performance.now(),timeout=1200):Promise<RoomRouteSample>{
 return new Promise(resolve=>{
  let socket:WebSocket|undefined,timer:ReturnType<typeof setTimeout>|undefined,finished=false,ready=false,id=0,sent=0;const samples:number[]=[];
  const finish=(failure?:RoomRouteSample['failure'])=>{if(finished)return;finished=true;clearTimeout(timer);signal?.removeEventListener('abort',abort);try{socket?.close(1000,'Timing probe complete')}catch{}samples.sort((a,b)=>a-b);resolve({origin,transport:'websocket',rtt:!failure&&samples.length===3?Math.round(samples[1]):null,...(failure?{failure}:{})})};
  const arm=(ms:number)=>{clearTimeout(timer);timer=setTimeout(()=>finish('timeout'),ms)},abort=()=>finish('unavailable');
  const ping=()=>{if(finished)return;id++;sent=clock();arm(timeout);try{socket!.send(JSON.stringify({type:'ping',id,active:false}))}catch{finish('unavailable')}};
  if(signal?.aborted){finish('unavailable');return}signal?.addEventListener('abort',abort,{once:true});arm(Math.max(2500,timeout));
  try{socket=factory(origin.replace(/^http/,'ws')+'/api/'+input.kind+'?code='+input.code+'&stream=1')}catch{finish('unavailable');return}
  socket.onopen=()=>{if(finished){try{socket?.close(1000,'Timing probe cancelled')}catch{}return;}try{socket!.send(JSON.stringify({type:'auth',token:input.token,protocol:1,probe:true,active:false}))}catch{finish('unavailable')}};
  socket.onmessage=event=>{if(finished||typeof event.data!=='string'||event.data.length>8192)return;let data:any;try{data=JSON.parse(event.data)}catch{finish('unsupported');return}
   if(data.type==='ready'&&!ready){if(!data.probe||data.probe.version<39){finish('unsupported');return}if(data.probe.code!==input.code||data.probe.playerId!==input.playerId){finish('identity');return}ready=true;ping();return}
   if(ready&&data.type==='pong'&&data.id===id){if(id>1)samples.push(Math.max(0,clock()-sent));if(samples.length===3)finish();else ping()}
  };
  socket.onerror=()=>finish('unavailable');socket.onclose=()=>finish('unavailable');
 });
}
