import {fastControls} from './room-stream.ts';
import {worldQuietLimit} from './casual/world-stream.ts';
import {stableRoomRequest} from './room-params.ts';
import {roomReceipt} from './network-clock.ts';
import {applyRoomDelta} from './room-delta.ts';
import type {RoomRevisionFeed} from './room-revisions.ts';
export type TransportStats={live:boolean;streaming:boolean;rtt:number;totalRtt:number;serverMs:number;jitter:number;bytesPerSecond:number;lastReceipt:number;lastStateReceipt:number;lastLiveStateReceipt:number;simulationLag:number;inputReceiptMs:number;stateSource:'live'|'http';stateInterval:number;receivedBytes:number;sentBytes:number;failures:number};
type Options={timeout?:number;retries?:number;forceHttp?:boolean}; // forceHttp refreshes reads; writes use the normal receipt path.
const aborted=()=>new DOMException('Room session changed or request aborted.','AbortError');
function retryDelay(ms:number,signal:AbortSignal){
 return new Promise<void>((resolve,reject)=>{
  const abort=()=>{clearTimeout(timer);reject(aborted())};
  const timer=setTimeout(()=>{signal.removeEventListener('abort',abort);resolve()},ms);
  if(signal.aborted)abort();else signal.addEventListener('abort',abort,{once:true});
 });
}
function replayable(init:RequestInit){
 if((init.method||'GET').toUpperCase()==='GET')return true;
 if((init.method||'GET').toUpperCase()!=='POST'||typeof init.body!=='string')return false;
 try{const body=JSON.parse(init.body);return typeof body.requestId==='string'&&body.requestId.length>0&&!['create','join'].includes(body.action)}catch{return false}
}
/** One private snapshot/receipt path for WebSocket and HTTP fallback. */
export class RoomTransport{
 private bases=new Map<string,any>();private pins=new Map<string,number>();private latest:{id:string;room:any}|null=null;
 private samples:{at:number;bytes:number}[]=[];private generation=0;private roomMode:string|undefined;private roomVersion=0;
 private controllers=new Set<AbortController>();private live:RoomRevisionFeed|null=null;
 private liveRetryAt=0;private snapshotInterval=100;
 readonly stats:TransportStats={live:false,streaming:false,rtt:0,totalRtt:0,serverMs:0,jitter:0,bytesPerSecond:0,lastReceipt:0,lastStateReceipt:0,lastLiveStateReceipt:0,simulationLag:0,inputReceiptMs:0,stateSource:'http',stateInterval:0,receivedBytes:0,sentBytes:0,failures:0};
 get autonomous(){return this.stats.streaming&&!!this.live?.autonomous}
 observeLatency(elapsed:number){if(!Number.isFinite(elapsed)||elapsed<0)return;const value=Math.round(elapsed);this.stats.jitter=this.stats.jitter*.8+Math.abs(value-this.stats.rtt)*.2;this.stats.rtt=value;this.stats.totalRtt=value;this.stats.serverMs=0}
 attachLive(feed:RoomRevisionFeed|null){this.live=feed;this.stats.streaming=!!feed?.streaming&&this.roomMode!=='phone'}
 reset(){this.generation++;for(const controller of this.controllers)controller.abort();this.controllers.clear();this.live=null;this.liveRetryAt=0;this.snapshotInterval=100;this.roomMode=undefined;this.roomVersion=0;this.bases.clear();this.pins.clear();this.latest=null;this.samples=[];Object.assign(this.stats,{live:false,streaming:false,rtt:0,totalRtt:0,serverMs:0,jitter:0,bytesPerSecond:0,lastReceipt:0,lastStateReceipt:0,lastLiveStateReceipt:0,simulationLag:0,inputReceiptMs:0,stateSource:'http',stateInterval:0,receivedBytes:0,sentBytes:0,failures:0})}
 private trimBases(){let disposable=this.bases.size-this.pins.size;for(const id of this.bases.keys()){if(disposable<=48)break;if(this.pins.has(id)||id===this.latest?.id)continue;this.bases.delete(id);disposable--}}
 private decode(data:any,raw:string|number,elapsed:number,tx=0,source:'live'|'http'='http'){
  const interval=data.clock?.stateInterval;if(Number.isFinite(interval)&&interval>=25&&interval<=1000)this.snapshotInterval=interval;
  if(data.patch){const base=this.bases.get(data.baseSnapshot);if(!base){this.latest=null;throw Object.assign(Error('Refreshing the complete room snapshot.'),{status:409,resync:true})}data.room=applyRoomDelta(base,data.patch);delete data.patch}
  if(data.room){this.roomVersion=Number.isSafeInteger(data.room.serverVersion)?data.room.serverVersion:0;this.roomMode=data.room.mode;this.stats.streaming=!!this.live?.streaming&&this.roomMode!=='phone'}
  if(data.snapshotId&&data.room){this.bases.set(data.snapshotId,data.room);const r=data.room,previous=this.latest?.room;if(!previous||r.code!==previous.code||(r.revision??0)>(previous.revision??0)||r.revision===previous.revision&&r.serverNow>=previous.serverNow){this.latest={id:data.snapshotId,room:r};const now=performance.now(),gap=this.stats.lastStateReceipt?now-this.stats.lastStateReceipt:0;if(gap)this.stats.stateInterval=this.stats.stateInterval?this.stats.stateInterval*.8+gap*.2:gap;this.stats.lastStateReceipt=now;this.stats.stateSource=source;if(source==='live')this.stats.lastLiveStateReceipt=now}this.trimBases()}
  if(data.room?.phase==='playing'&&data.room.game?.lastTickAt){this.stats.simulationLag=Math.max(0,Math.round((data.clock?.sentAt||data.room.serverNow)-Math.max(data.room.game.lastTickAt,data.room.game.startAt||0)))}
  const receipt=roomReceipt(data,elapsed),rx=typeof raw==='number'?raw:new TextEncoder().encode(raw).byteLength,time=performance.now();
  this.stats.jitter=this.stats.lastReceipt?this.stats.jitter*.8+Math.abs(receipt.network.rtt-this.stats.rtt)*.2:0;Object.assign(this.stats,receipt.network,{lastReceipt:time,failures:0});this.stats.receivedBytes+=rx;this.stats.sentBytes+=tx;this.samples.push({at:time,bytes:rx+tx});this.samples=this.samples.filter(s=>time-s.at<5000);this.stats.bytesPerSecond=this.samples.reduce((n,s)=>n+s.bytes,0)/Math.max(1,(time-this.samples[0].at)/1000);
  if(data.room)data.room={...data.room,...receipt,network:{...receipt.network,snapshotInterval:this.snapshotInterval}};if(data.unchanged)Object.assign(data,receipt);return data;
 }
 /** Push transit is estimated from the last measured request RTT, never treated as zero. */
 receive(data:any,wireBytes?:number){const measured=typeof wireBytes==='number'&&Number.isSafeInteger(wireBytes)&&wireBytes>=0&&wireBytes<=2_000_000;return this.decode(data,measured?wireBytes:JSON.stringify(data),this.stats.totalRtt,0,'live')}
 async send(endpoint:string,init:RequestInit={},options:Options={}):Promise<any>{
  const max=options.retries||0,generation=this.generation;let recovered=false,fellBack=false;
  for(let attempt=0;;attempt++){
   if(generation!==this.generation||init.signal?.aborted)throw aborted();
   const url=new URL(endpoint,typeof location==='undefined'?'http://localhost':location.href);url.searchParams.set('wire','1');const baseId=this.latest?.id,stable=stableRoomRequest(url,init,baseId);if(baseId)this.pins.set(baseId,(this.pins.get(baseId)||0)+1);
   const controller=new AbortController(),abort=()=>controller.abort(),started=performance.now(),timeout=setTimeout(abort,options.timeout||8000);this.controllers.add(controller);init.signal?.addEventListener('abort',abort,{once:true});
   let usedLive=false,delay:number|undefined;
   try{
    const liveRequest=this.roomMode==='phone'||options.forceHttp&&(init.method||'GET').toUpperCase()==='GET'||performance.now()<this.liveRetryAt?null:this.live?.request(url,{...stable,signal:controller.signal});usedLive=!!liveRequest;
    // A healthy autonomous stream already delivers authority. A fallback control
    // receipt need not duplicate that world; stale/HTTP-only streams keep full state.
    if(!usedLive&&this.roomVersion>=37&&this.autonomous&&this.stats.lastLiveStateReceipt>0&&performance.now()-this.stats.lastLiveStateReceipt<worldQuietLimit(this.snapshotInterval)&&(init.method||'GET').toUpperCase()==='POST'&&typeof init.body==='string'){
     try{const body=JSON.parse(init.body);if(fastControls.has(body.action))stable.body=JSON.stringify({...body,controlReceipt:true})}catch{}
    }
    // Response no-store preserves CORS preflight reuse without caching private state.
    const response=await(liveRequest||fetch(url,{...stable,credentials:'omit',mode:'cors',cache:'default',signal:controller.signal})),raw=await response.text(),elapsed=performance.now()-started;
    if(generation!==this.generation||controller.signal.aborted)throw aborted();
    if(!response.headers.get('content-type')?.includes('application/json'))throw Error('The room service returned an unexpected page. Reload the view to reconnect.');
    const data=JSON.parse(raw);if(!response.ok)throw Object.assign(Error(data.error||'The room request could not be completed.'),{status:response.status});
    if(typeof init.body==='string')try{if(['direction','drive','party-control','block-input','explore','pirate-input'].includes(JSON.parse(init.body).action))this.stats.inputReceiptMs=Math.round(elapsed)}catch{}
    return this.decode(data,raw,elapsed,typeof stable.body==='string'?new TextEncoder().encode(stable.body).byteLength:0,usedLive?'live':'http');
   }catch(error){
    if(generation!==this.generation||init.signal?.aborted)throw aborted();this.stats.failures++;
    const status=(error as any)?.status,resync=(error as any)?.resync,retry=resync||!status||status>=500||status===429;
    if(usedLive&&!resync&&(!status||status>=500)){
     // Pongs and pushed state can remain healthy while request receipts stall.
     // Quarantine that request path briefly; replay only deduplicated actions.
     this.liveRetryAt=performance.now()+Math.max(3000,Math.min(12000,this.stats.totalRtt*2));
     if(!fellBack&&replayable(init)){fellBack=true;attempt--;continue}
    }
    // An evicted delta base gets one immediate full GET, even without ordinary retries.
    if(resync&&!recovered&&(init.method||'GET').toUpperCase()==='GET'){recovered=true;attempt--;continue}
    if(attempt>=max||!retry||!replayable(init))throw error;delay=Math.min(1600,200*2**attempt);
   }finally{clearTimeout(timeout);this.controllers.delete(controller);init.signal?.removeEventListener('abort',abort);if(baseId&&generation===this.generation){const count=(this.pins.get(baseId)||1)-1;if(count)this.pins.set(baseId,count);else this.pins.delete(baseId);this.trimBases()}}
   if(delay!==undefined){
    const waiting=new AbortController(),cancel=()=>waiting.abort();this.controllers.add(waiting);init.signal?.addEventListener('abort',cancel,{once:true});
    try{if(generation!==this.generation||init.signal?.aborted)throw aborted();await retryDelay(delay,waiting.signal)}finally{this.controllers.delete(waiting);init.signal?.removeEventListener('abort',cancel)}
   }
  }
 }
}
