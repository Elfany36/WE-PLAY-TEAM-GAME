import {stableRoomRequest} from './room-params.ts';
import {roomReceipt} from './network-clock.ts';
import {applyRoomDelta} from './room-delta.ts';
export type TransportStats={live:boolean;rtt:number;totalRtt:number;serverMs:number;jitter:number;bytesPerSecond:number;lastReceipt:number;receivedBytes:number;sentBytes:number;failures:number};
type Options={timeout?:number;retries?:number};
/** One authenticated HTTP/receipt/delta path for every room game. */
export class RoomTransport{
 private bases=new Map<string,any>();private latest:{id:string;room:any}|null=null;
 private samples:{at:number;bytes:number}[]=[];
 readonly stats:TransportStats={live:false,rtt:0,totalRtt:0,serverMs:0,jitter:0,bytesPerSecond:0,lastReceipt:0,receivedBytes:0,sentBytes:0,failures:0};
 reset(){this.bases.clear();this.latest=null;this.samples=[];Object.assign(this.stats,{live:false,rtt:0,totalRtt:0,serverMs:0,jitter:0,bytesPerSecond:0,lastReceipt:0,receivedBytes:0,sentBytes:0,failures:0})}
 private snapshot(data:any){if(data.patch){const base=this.bases.get(data.baseSnapshot);if(!base)throw Object.assign(Error('Refreshing the complete room snapshot.'),{status:409,resync:true});data.room=applyRoomDelta(base,data.patch);delete data.patch}if(data.snapshotId&&data.room){this.bases.set(data.snapshotId,data.room);while(this.bases.size>64)this.bases.delete(this.bases.keys().next().value!);const r=data.room,prior=this.latest?.room;if(!prior||r.code!==prior.code||(r.revision??0)>(prior.revision??0)||r.revision===prior.revision&&r.serverNow>=prior.serverNow)this.latest={id:data.snapshotId,room:r}}return data}
 receive(data:any,bytes=JSON.stringify(data).length){this.snapshot(data);this.stats.lastReceipt=performance.now();this.stats.failures=0;this.stats.receivedBytes+=bytes;const now=performance.now();this.samples.push({at:now,bytes});this.samples=this.samples.filter(s=>now-s.at<5000);this.stats.bytesPerSecond=this.samples.reduce((n,s)=>n+s.bytes,0)/Math.max(1,(now-this.samples[0].at)/1000);if(data.room)data.room={...data.room,network:{rtt:this.stats.rtt,totalRtt:this.stats.totalRtt,serverMs:0}};return data}
 async send(endpoint:string,init:RequestInit={},options:Options={}):Promise<any>{
  const max=options.retries||0;
  for(let attempt=0;;attempt++){
   const url=new URL(endpoint,typeof location==='undefined'?'http://localhost':location.href);url.searchParams.set('wire','1');const stable=stableRoomRequest(url,init,this.latest?.id);
   const controller=new AbortController(),abort=()=>controller.abort(),started=performance.now(),timeout=setTimeout(abort,options.timeout||8000);init.signal?.addEventListener('abort',abort,{once:true});
   try{
    // Responses carry Cache-Control: no-store. Request-side no-store also bypasses
    // Chromium's preflight cache, adding OPTIONS even when the URL is stable.
    if(init.signal?.aborted)controller.abort();const response=await fetch(url,{...stable,credentials:'omit',mode:'cors',cache:'default',signal:controller.signal}),raw=await response.text(),elapsed=performance.now()-started;
    if(!response.headers.get('content-type')?.includes('application/json'))throw Error('The room service returned an unexpected page. Reload the view to reconnect.');
    const data=JSON.parse(raw);if(!response.ok)throw Object.assign(Error(data.error||'The room request could not be completed.'),{status:response.status});
    this.snapshot(data);
    const receipt=roomReceipt(data,elapsed),rx=new TextEncoder().encode(raw).byteLength,tx=typeof init.body==='string'?new TextEncoder().encode(init.body).byteLength:0,time=performance.now();
    this.stats.jitter=this.stats.lastReceipt?this.stats.jitter*.8+Math.abs(receipt.network.rtt-this.stats.rtt)*.2:0;Object.assign(this.stats,receipt.network,{lastReceipt:time,failures:0});this.stats.receivedBytes+=rx;this.stats.sentBytes+=tx;this.samples.push({at:time,bytes:rx+tx});this.samples=this.samples.filter(s=>time-s.at<5000);this.stats.bytesPerSecond=this.samples.reduce((n,s)=>n+s.bytes,0)/Math.max(1,(time-this.samples[0].at)/1000);
    if(data.room)data.room={...data.room,...receipt};if(data.unchanged)Object.assign(data,receipt);return data;
   }catch(error){this.stats.failures++;const status=(error as any)?.status,retry=(error as any)?.resync||!status||status>=500||status===429;if(attempt>=max||!retry||init.signal?.aborted)throw error;await new Promise(resolve=>setTimeout(resolve,Math.min(1600,200*2**attempt)))}
   finally{clearTimeout(timeout);init.signal?.removeEventListener('abort',abort)}
  }
 }
}
