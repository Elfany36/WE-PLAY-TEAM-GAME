'use client';
import {useEffect,useRef,useState} from 'react';
import type {RoomTransport} from '../../lib/room-transport';
import {PH_GATEWAY,SEA_GATEWAY,gatewayProbeData} from '../../lib/room-gateways';
export default function ConnectionStats({room,transport,local=false,service}:{room:any;transport:RoomTransport;local?:boolean;service?:string}){
 const panel=useRef<HTMLDetailsElement>(null),[route,setRoute]=useState<{rtt:number;entry:string|null;region:string}|null>(null),[copied,setCopied]=useState('');
 const [view,setView]=useState({fps:0,age:0,ping:0,measuredPing:false,total:0,jitter:0,rate:0,server:0,simulation:0,input:0,canvas:false,live:false,streaming:false,httpState:false,interval:0});
 useEffect(()=>{
  const node=panel.current;if(!node)return;
  let frame=0,count=0,at=performance.now(),timer:ReturnType<typeof setInterval>|undefined;
  const stop=()=>{cancelAnimationFrame(frame);frame=0;clearInterval(timer);timer=undefined};
  const paint=()=>{count++;frame=requestAnimationFrame(paint)};
  const sample=()=>{const time=performance.now(),stats=transport.stats,gameCanvas=node.closest('.casual-arcade')?.querySelector<HTMLCanvasElement>('canvas[data-render-fps]'),canvasFps=Number(gameCanvas?.dataset.renderFps),measuredPing=stats.live&&stats.pingRtt!==null&&time-stats.lastPing<9000;setView({live:stats.live,streaming:stats.streaming,httpState:stats.stateSource==='http',fps:Number.isFinite(canvasFps)?canvasFps:Math.round(count*1000/Math.max(1,time-at)),age:local?0:stats.lastStateReceipt?Math.round(time-stats.lastStateReceipt):0,interval:local?0:Math.round(stats.stateInterval),ping:local?0:measuredPing?stats.pingRtt!:stats.rtt,measuredPing,total:local?0:stats.totalRtt,jitter:local?0:Math.round(measuredPing?stats.pingJitter:stats.jitter),rate:local?0:stats.bytesPerSecond,server:local?0:stats.serverMs,simulation:local?0:stats.simulationLag,input:local?0:stats.inputReceiptMs,canvas:Number.isFinite(canvasFps)});count=0;at=time};
  const sync=()=>{stop();if(!node.open||document.hidden)return;count=0;at=performance.now();sample();frame=requestAnimationFrame(paint);timer=setInterval(sample,1000)};
  node.addEventListener('toggle',sync);document.addEventListener('visibilitychange',sync);sync();
  return()=>{stop();node.removeEventListener('toggle',sync);document.removeEventListener('visibilitychange',sync)};
 },[transport,local]);
 useEffect(()=>{
  const node=panel.current;if(!node||local||!service)return;let generation=0,timer:ReturnType<typeof setTimeout>|undefined,controller:AbortController|undefined;setRoute(null);
  const stop=()=>{generation++;clearTimeout(timer);controller?.abort()};
  const probe=async()=>{if(!node.open||document.hidden)return;const current=++generation;const active=new AbortController();controller=active;const timeout=setTimeout(()=>active.abort(),2500),started=performance.now();try{const response=await fetch(new URL('/api/ping',new URL(service,location.href)),{credentials:'omit',mode:'cors',signal:active.signal}),data=gatewayProbeData(await response.json());if(current===generation&&response.ok&&data)setRoute({rtt:Math.round(performance.now()-started),entry:data.entry,region:data.region})}catch{}finally{clearTimeout(timeout);if(current===generation&&node.open&&!document.hidden)timer=setTimeout(probe,15000)}};
  const sync=()=>{stop();if(node.open&&!document.hidden)void probe()};node.addEventListener('toggle',sync);document.addEventListener('visibilitychange',sync);sync();
  return()=>{stop();node.removeEventListener('toggle',sync);document.removeEventListener('visibilitychange',sync)};
 },[local,service]);
 const g=room?.game,step=g?.kind==='snake'?room.settings.speed:['circuit','terra','sumo','tanks','pong','marble','blocks','pool','pirate'].includes(g?.kind)?50:0;
 const server=service?.startsWith(PH_GATEWAY)?'Hong Kong gateway':service?.startsWith(SEA_GATEWAY)?'Singapore gateway':'Website service';
 async function copy(){try{await navigator.clipboard.writeText(JSON.stringify({client:38,game:room?.mode,service,roomPingMs:view.ping,measuredRoomPing:view.measuredPing,actionRoundTripMs:view.total,inputAcknowledgementMs:view.input,serverWorkMs:view.server,jitterMs:view.jitter,gateway:route},null,2));setCopied('Copied')}catch{setCopied('Copy unavailable')}}
 return <details ref={panel} className="connection-stats"><summary>Connection & rendering</summary><dl>
 {!local&&service&&<div><dt>Room server</dt><dd>{server}</dd></div>}
 <div><dt>Room updates</dt><dd>{local?'On device':view.streaming?(view.httpState?'Live controls · HTTPS snapshots':'Live state & controls'):view.live?'Live notifications':'Polling fallback'}</dd></div>
 <div><dt>{view.measuredPing?'Room ping':'Estimated ping'}</dt><dd>{local?'On device':view.ping+' ms'}</dd></div>
 <div><dt>Action round trip</dt><dd>{view.total} ms</dd></div>
 {!local&&route&&<><div><dt>Gateway round trip</dt><dd>{route.rtt} ms</dd></div>{route.entry&&<div><dt>Cloudflare entry</dt><dd>{route.entry}</dd></div>}</>}
 <div><dt>Jitter</dt><dd>{view.jitter} ms</dd></div><div><dt>{view.canvas?'Game paint':'Display'}</dt><dd>{view.fps} fps</dd></div><div><dt>Server step</dt><dd>{step?Math.round(1000/step)+' Hz':'Events'}</dd></div><div><dt>Last world snapshot</dt><dd>{view.age} ms ago</dd></div><div><dt>World update interval</dt><dd>{view.interval} ms</dd></div><div><dt>Game payload</dt><dd>{(view.rate/1024).toFixed(1)} KB/s</dd></div><div><dt>Input acknowledgement</dt><dd>{view.input} ms</dd></div><div><dt>Simulation behind</dt><dd>{view.simulation} ms</dd></div><div><dt>Server work</dt><dd>{view.server} ms</dd></div></dl>
 <p>Client v38. Room ping measures a WebSocket round trip. Action acknowledgements also include server work. Gateway timing and the Cloudflare entry point help diagnose routing. New rooms choose a regional route; existing rooms keep their authority.</p>
 {!local&&<button className="button outline" onClick={copy}>{copied||'Copy connection details'}</button>}
 </details>
}
