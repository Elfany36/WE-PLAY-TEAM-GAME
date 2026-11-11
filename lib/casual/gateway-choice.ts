import {SEA_GATEWAY,PH_GATEWAY,gatewayProbeData} from '../room-gateways.ts';
export type GatewaySample={origin:string;rtt:number|null};
/** Compare warm gateway requests, never a cached page or a different game's authority. */
export async function selectRoomGateway(fetcher:typeof fetch=fetch,clock=()=>performance.now(),timeout=800){
 const samples=await Promise.all([SEA_GATEWAY,PH_GATEWAY].map(async origin=>{
  let rtt:number|null=null;
  // First request warms DNS/TLS; use the second request for a fair comparison.
  for(let i=0;i<2;i++){
   const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeout),start=clock();
   try{const response=await fetcher(origin+'/api/ping',{credentials:'omit',mode:'cors',signal:controller.signal});const data=gatewayProbeData(await response.json());if(!response.ok||!data)break;if(i===1)rtt=Math.max(0,clock()-start)}catch{break}finally{clearTimeout(timer)}
  }
  return{origin,rtt} satisfies GatewaySample;
 }));
 const sea=samples[0],ph=samples[1];
 // Keep the established service on ties/failure; never downgrade to a website proxy.
 return{origin:ph.rtt!==null&&(sea.rtt===null||ph.rtt+5<sea.rtt)?ph.origin:sea.origin,samples};
}
