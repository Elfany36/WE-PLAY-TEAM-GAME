import {roomReceipt} from './network-clock.ts';
import {applyRoomDelta} from './room-delta.ts';
export type TransportStats={rtt:number;totalRtt:number;serverMs:number;jitter:number;bytesPerSecond:number;lastReceipt:number;receivedBytes:number;sentBytes:number;failures:number};
type Options={timeout?:number;retries?:number};
/** One authenticated HTTP/receipt/delta path for every room game. */
export class RoomTransport{
 private bases=new Map<string,any>();private latest:{id:string;room:any}|null=null;
 private samples:{at:number;bytes:number}[]=[];
 readonly stats:TransportStats={rtt:0,totalRtt:0,serverMs:0,jitter:0,bytesPerSecond:0,lastReceipt:0,receivedBytes:0,sentBytes:0,failures:0};
 reset(){this.bases.clear();this.latest=null;this.samples=[];Object.assign(this.stats,{rtt:0,totalRtt:0,serverMs:0,jitter:0,bytesPerSecond:0,lastReceipt:0,receivedBytes:0,sentBytes:0,failures:0})}
 async send(endpoint:string,init:RequestInit={},options:Options={}):Promise<any>{
  const max=options.retries||0;
  for(let attempt=0;;attempt++){
   const url=new URL(endpoint,typeof location==='undefined'?'http://localhost':location.href);url.searchParams.set('wire','1');if(this.latest)url.searchParams.set('base',this.latest.id);
   const controller=new AbortController(),abort=()=>controller.abort(),started=performance.now(),timeout=setTimeout(abort,options.timeout||8000);init.signal?.addEventListener('abort',abort,{once:true});
   try{
    if(init.signal?.aborted)controller.abort();const response=await fetch(url,{...init,credentials:'omit',mode:'cors',cache:'no-store',signal:controller.signal}),raw=await response.text(),elapsed=performance.now()-started;
    if(!response.headers.get('content-type')?.includes('application/json'))throw Error('The room service returned an unexpected page. Reload the view to reconnect.');
    const data=JSON.parse(raw);if(!response.ok)throw Object.assign(Error(data.error||'The room request could not be completed.'),{status:response.status});
    if(data.patch){const base=this.bases.get(data.baseSnapshot);if(!base){this.latest=null;throw Object.assign(Error('Refreshing the complete room snapshot.'),{status:409,resync:true})}data.room=applyRoomDelta(base,data.patch);delete data.patch}
    if(data.snapshotId&&data.room){this.bases.set(data.snapshotId,data.room);while(this.bases.size>32)this.bases.delete(this.bases.keys().next().value!);const r=data.room,previous=this.latest?.room;if(!previous||r.code!==previous.code||(r.revision??0)>(previous.revision??0)||r.revision===previous.revision&&r.serverNow>=previous.serverNow)this.latest={id:data.snapshotId,room:r}}
    const receipt=roomReceipt(data,elapsed),rx=new TextEncoder().encode(raw).byteLength,tx=typeof init.body==='string'?new TextEncoder().encode(init.body).byteLength:0,time=performance.now();
    this.stats.jitter=this.stats.lastReceipt?this.stats.jitter*.8+Math.abs(receipt.network.rtt-this.stats.rtt)*.2:0;Object.assign(this.stats,receipt.network,{lastReceipt:time,failures:0});this.stats.receivedBytes+=rx;this.stats.sentBytes+=tx;this.samples.push({at:time,bytes:rx+tx});this.samples=this.samples.filter(s=>time-s.at<5000);this.stats.bytesPerSecond=this.samples.reduce((n,s)=>n+s.bytes,0)/Math.max(1,(time-this.samples[0].at)/1000);
    if(data.room)data.room={...data.room,...receipt};if(data.unchanged)Object.assign(data,receipt);return data;
   }catch(error){this.stats.failures++;const status=(error as any)?.status,retry=(error as any)?.resync||!status||status>=500||status===429;if(attempt>=max||!retry||init.signal?.aborted)throw error;await new Promise(resolve=>setTimeout(resolve,Math.min(1600,200*2**attempt)))}
   finally{clearTimeout(timeout);init.signal?.removeEventListener('abort',abort)}
  }
 }
}
