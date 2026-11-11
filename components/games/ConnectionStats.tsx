'use client';
import {useEffect,useRef,useState} from 'react';
import type {RoomTransport} from '../../lib/room-transport';
import {compareRoomRoutes,roomRouteSwitchSafe,type RoomRouteSample} from '../../lib/room-route-probes';
import {expectsWorldUpdates} from '../../lib/casual/world-stream';
import {roomGateway,PH_GATEWAY,SEA_GATEWAY,gatewayProbeData} from '../../lib/room-gateways';
export default function ConnectionStats({room,transport,local=false,service,token,onRouteChange}:{room:any;token?:string;onRouteChange?:(origin:string)=>boolean;transport:RoomTransport;local?:boolean;service?:string}){
 const current=useRef({room,token,service,onRouteChange});current.current={room,token,service,onRouteChange};const attempted=useRef(''),comparison=useRef<AbortController|null>(null),[routes,setRoutes]=useState<RoomRouteSample[]>([]),[comparing,setComparing]=useState(false);
 const panel=useRef<HTMLDetailsElement>(null),[route,setRoute]=useState<{rtt:number;entry:string|null;region:string}|null>(null),[copied,setCopied]=useState('');
 const [view,setView]=useState({fps:0,age:0,ping:0,measuredPing:false,total:null as number|null,jitter:0,rate:0,server:null as number|null,simulation:0,input:null as number|null,canvas:false,live:false,streaming:false,httpState:false,interval:0});
 useEffect(()=>{
  const node=panel.current;if(!node)return;
  let frame=0,count=0,at=performance.now(),timer:ReturnType<typeof setInterval>|undefined;
  const stop=()=>{cancelAnimationFrame(frame);frame=0;clearInterval(timer);timer=undefined};
  const paint=()=>{count++;frame=requestAnimationFrame(paint)};
  const sample=()=>{const time=performance.now(),stats=transport.stats,gameCanvas=node.closest('.casual-arcade')?.querySelector<HTMLCanvasElement>('canvas[data-render-fps]'),canvasFps=Number(gameCanvas?.dataset.renderFps),measuredPing=stats.live&&stats.pingRtt!==null&&time-stats.lastPing<9000;setView({live:stats.live,streaming:stats.streaming,httpState:stats.stateSource==='http',fps:Number.isFinite(canvasFps)?canvasFps:Math.round(count*1000/Math.max(1,time-at)),age:local?0:stats.lastStateReceipt?Math.round(time-stats.lastStateReceipt):0,interval:local?0:Math.round(stats.stateInterval),ping:local?0:measuredPing?stats.pingRtt!:stats.rtt,measuredPing,total:local?0:stats.lastRequest?.rtt??null,jitter:local?0:Math.round(measuredPing?stats.pingJitter:stats.jitter),rate:local?0:stats.bytesPerSecond,server:local?0:stats.lastInput?.serverMs??null,simulation:local?0:stats.simulationLag,input:local?0:stats.lastInput?.rtt??null,canvas:Number.isFinite(canvasFps)});count=0;at=time};
  const sync=()=>{stop();if(!node.open||document.hidden)return;count=0;at=performance.now();sample();frame=requestAnimationFrame(paint);timer=setInterval(sample,1000)};
  node.addEventListener('toggle',sync);document.addEventListener('visibilitychange',sync);sync();
  return()=>{stop();node.removeEventListener('toggle',sync);document.removeEventListener('visibilitychange',sync)};
 },[transport,local]);
 useEffect(()=>{
  const node=panel.current;if(!node||local||!service)return;let generation=0,timer:ReturnType<typeof setTimeout>|undefined,controller:AbortController|undefined;setRoute(null);setCopied('');
  const stop=()=>{generation++;clearTimeout(timer);controller?.abort()};
  const probe=async()=>{if(!node.open||document.hidden)return;const current=++generation;const active=new AbortController();controller=active;const timeout=setTimeout(()=>active.abort(),2500),started=performance.now();try{const response=await fetch(new URL('/api/ping',new URL(service,location.href)),{credentials:'omit',mode:'cors',signal:active.signal}),data=gatewayProbeData(await response.json());if(current===generation&&response.ok&&data)setRoute({rtt:Math.round(performance.now()-started),entry:data.entry,region:data.region})}catch{}finally{clearTimeout(timeout);if(current===generation&&node.open&&!document.hidden)timer=setTimeout(probe,15000)}};
  const sync=()=>{stop();if(node.open&&!document.hidden)void probe()};node.addEventListener('toggle',sync);document.addEventListener('visibilitychange',sync);sync();
  return()=>{stop();node.removeEventListener('toggle',sync);document.removeEventListener('visibilitychange',sync)};
 },[local,service]);
 async function compare(){
  const c=current.current;if(!c.room||!c.token||!c.service||local)return;const origin=new URL(c.service,location.href).origin;if(!roomGateway(origin))return;
  comparison.current?.abort();const controller=new AbortController();comparison.current=controller;setComparing(true);
  try{const result=await compareRoomRoutes({code:c.room.code,playerId:c.room.youId,token:c.token,kind:new URL(c.service,location.href).pathname.endsWith('/arena')?'arena':'casual',currentOrigin:origin},controller.signal);const latest=current.current;if(controller.signal.aborted||document.hidden||latest.token!==c.token||latest.room?.code!==c.room.code)return;setRoutes(result.samples);if(result.origin!==origin&&roomRouteSwitchSafe(latest.room)&&(!transport.stats.streaming||result.samples.every(s=>s.transport==='websocket'&&s.rtt!==null)))latest.onRouteChange?.(result.origin)}catch{}finally{if(comparison.current===controller)setComparing(false)}
 }
 useEffect(()=>{setRoutes([]);setCopied('');return()=>comparison.current?.abort()},[room?.code,token]);
 useEffect(()=>()=>comparison.current?.abort(),[service]);
 useEffect(()=>{const hidden=()=>{if(document.hidden)comparison.current?.abort()};document.addEventListener('visibilitychange',hidden);return()=>document.removeEventListener('visibilitychange',hidden)},[]);
 const safe=roomRouteSwitchSafe(room);
 useEffect(()=>{if(local||!token||!service||!safe)return;const key=room?.code+':'+token;if(attempted.current===key)return;const timer=setTimeout(()=>{if(document.hidden)return;attempted.current=key;if(transport.stats.pingRtt!==null&&transport.stats.pingRtt<=60)return;void compare()},500);return()=>clearTimeout(timer)},[local,token,service,safe,room?.code,transport]);
 const g=room?.game,continuous=expectsWorldUpdates(room,view.age),step=continuous?(g?.kind==='snake'?room.settings.speed:50):0;
 const server=service?.startsWith(PH_GATEWAY)?'Hong Kong gateway':service?.startsWith(SEA_GATEWAY)?'Automatic edge gateway':'Website service';
 async function copy(){try{await navigator.clipboard.writeText(JSON.stringify({client:39,serverVersion:room?.serverVersion,phase:room?.phase,game:room?.mode,service,roomPingMs:view.ping,measuredRoomPing:view.measuredPing,lastRequestRoundTripMs:view.total,inputAcknowledgementMs:view.input,serverWorkMs:view.server,jitterMs:view.jitter,gateway:route,roomRoutes:routes},null,2));setCopied('Copied')}catch{setCopied('Copy unavailable')}}
 return <details ref={panel} className="connection-stats"><summary>Connection & rendering</summary><dl>
 {!local&&service&&<div><dt>Room server</dt><dd>{server}</dd></div>}
 <div><dt>Room updates</dt><dd>{local?'On device':view.streaming?(view.httpState?'Live controls · HTTPS snapshots':'Live state & controls'):view.live?'Live notifications':'Polling fallback'}</dd></div>
 <div><dt>{view.measuredPing?'Room ping':'Estimated ping'}</dt><dd>{local?'On device':view.ping+' ms'}</dd></div>
 <div><dt>Last request round trip</dt><dd>{view.total===null?'Not measured':view.total+' ms'}</dd></div>
 {!local&&route&&<><div><dt>Gateway round trip</dt><dd>{route.rtt} ms</dd></div>{route.entry&&<div><dt>Cloudflare entry</dt><dd>{route.entry}</dd></div>}</>}
 <div><dt>Jitter</dt><dd>{view.jitter} ms</dd></div><div><dt>{view.canvas?'Game paint':'Display'}</dt><dd>{view.fps} fps</dd></div><div><dt>Server step</dt><dd>{step?Math.round(1000/step)+' Hz':'Events'}</dd></div><div><dt>{continuous?'Last world snapshot':'Last game update'}</dt><dd>{view.age} ms ago</dd></div><div><dt>Update cadence</dt><dd>{continuous?view.interval+' ms':'On action'}</dd></div><div><dt>Game payload</dt><dd>{(view.rate/1024).toFixed(1)} KB/s</dd></div><div><dt>Input acknowledgement</dt><dd>{view.input===null?'No input yet':view.input+' ms'}</dd></div><div><dt>Simulation behind</dt><dd>{view.simulation} ms</dd></div><div><dt>Last input server work</dt><dd>{view.server===null?'No input yet':view.server+' ms'}</dd></div></dl>
 <p>Client v39. Event-based games update when an action occurs; an older update is normal while waiting. Room ping measures a WebSocket round trip. Action acknowledgements also include server work. Gateway timing and the Cloudflare entry point help diagnose routing. Room-route comparisons measure the same authenticated seat. A faster route can be applied while controls are idle; the room itself stays unchanged.</p>
 {!local&&token&&service&&roomGateway(new URL(service,typeof location==='undefined'?'http://localhost':location.href).origin)&&<><button className="button outline" disabled={comparing} onClick={()=>void compare()}>{comparing?'Comparing room routes…':'Compare room routes'}</button>{routes.map(route=><div key={route.origin}><strong>{route.origin===PH_GATEWAY?'Hong Kong':'Automatic edge'}</strong>: {route.rtt===null?(route.failure==='unsupported'?'Server update needed':route.failure==='identity'?'Room did not match':route.failure==='timeout'?'Timed out':'Unavailable'):route.rtt+' ms · '+(route.transport==='websocket'?'WebSocket':'HTTPS fallback')}</div>)}{!safe&&routes.length>0&&<p>Pause the round or return to the lobby to apply a faster route.</p>}</>}
 {!local&&<button className="button outline" onClick={copy}>{copied||'Copy connection details'}</button>}
 </details>
}
