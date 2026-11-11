import {passiveRoomProbe,type ProbeSocketFactory} from './passive-room-probe.ts';
import {SEA_GATEWAY,PH_GATEWAY,roomGateway} from './room-gateways.ts';
export type RoomRouteSample={origin:string;transport:'websocket'|'http';rtt:number|null;failure?:'unavailable'|'timeout'|'unsupported'|'identity'};
/** Changing a route never changes the authority. Keep held controls and pen gestures uninterrupted. */
export function roomRouteSwitchSafe(room:any){
 if(!room)return false;
 if(['lobby','paused','finished'].includes(room.phase))return true;
 if(room.phase==='playing')return !['snake','circuit','terra','sumo','tanks','pong','marble','blocks','pool','pirate','sketch','phone'].includes(room.mode);
 return ['blanks','quiz','survival'].includes(room.mode)&&'startedAt'in room;
}
/** Read-only, authenticated timings of the same seat at the same room through both gateways. */
export async function compareRoomRoutes(input:{code:string;playerId:string;token:string;kind:'casual'|'arena';currentOrigin:string},signal?:AbortSignal,fetcher:typeof fetch=fetch,clock=()=>performance.now(),timeout=1200,socketFactory?:ProbeSocketFactory){
 if(!roomGateway(input.currentOrigin)||!/^[A-HJ-NP-Z2-9]{8}$/.test(input.code)||!/^[a-f0-9]{64}$/.test(input.token))throw Error('Use the current dedicated room.');
 const factory=socketFactory||(typeof window!=='undefined'&&typeof WebSocket!=='undefined'?(url:string)=>new WebSocket(url):undefined);
 const samples=await Promise.all([SEA_GATEWAY,PH_GATEWAY].map(async origin=>{
  if(factory){const measured=await passiveRoomProbe(origin,input,factory,signal,clock,timeout);if(measured.rtt!==null||measured.failure==='identity')return measured}
  const times:number[]=[];let failure:RoomRouteSample['failure'];
  for(let i=0;i<4;i++){
   const controller=new AbortController(),abort=()=>controller.abort();signal?.addEventListener('abort',abort,{once:true});if(signal?.aborted)controller.abort();const timer=setTimeout(abort,i===0?Math.max(timeout,2500):timeout),started=clock();
   try{const response=await fetcher(origin+'/api/'+input.kind+'?code='+encodeURIComponent(input.code)+'&probe=1',{headers:{Authorization:'Bearer '+input.token},credentials:'omit',mode:'cors',signal:controller.signal});const data=await response.json() as any;if(!response.ok){failure='unavailable';break}if(!data?.probe||!Number.isSafeInteger(data.probe.version)||data.probe.version<39){failure='unsupported';break}if(data.probe.code!==input.code||data.probe.playerId!==input.playerId){failure='identity';break}if(i)times.push(Math.max(0,clock()-started));}
   catch{failure=controller.signal.aborted?'timeout':'unavailable';break}finally{clearTimeout(timer);signal?.removeEventListener('abort',abort)}
  }
  times.sort((a,b)=>a-b);return{origin,transport:'http',rtt:!failure&&times.length===3?Math.round(times[1]):null,...(failure?{failure}:{})} satisfies RoomRouteSample;
 }));
 if(signal?.aborted)throw new DOMException('Room comparison cancelled.','AbortError');
 const current=samples.find(s=>s.origin===input.currentOrigin)!,other=samples.find(s=>s.origin!==input.currentOrigin)!;
 const origin=current.rtt!==null&&other.rtt!==null&&current.transport===other.transport&&other.rtt+15<current.rtt?other.origin:input.currentOrigin;
 return{origin,samples};
}
