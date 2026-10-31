import {HOSTED_ORIGIN,multiplayerEndpoint} from '../multiplayer-config.ts';
export const CASUAL_SERVICE_ORIGIN='https://markup-arcade.kendsfabros.workers.dev';
let readiness:Promise<boolean>|undefined;
export function legacyCasualEndpoint(){return(typeof location!=='undefined'&&location.hostname.endsWith('.github.io')?HOSTED_ORIGIN:'')+'/api/casual'}
export function trustedCasualOrigin(origin:unknown):origin is string{return typeof origin==='string'&&[CASUAL_SERVICE_ORIGIN,HOSTED_ORIGIN,typeof location!=='undefined'?location.origin:'',typeof location!=='undefined'?new URL(multiplayerEndpoint('casual'),location.href).origin:''].includes(origin)}
export function sessionCasualEndpoint(origin:unknown){return trustedCasualOrigin(origin)?origin+'/api/casual':legacyCasualEndpoint()}
/** Probe once per page, with no session credential; keep old room routes stable. */
export async function chooseCasualEndpoint(){
 const configured=multiplayerEndpoint('casual');if(typeof location==='undefined'||!(/\.chatgpt\.site$|\.github\.io$/.test(location.hostname)))return configured;
 readiness??=(async()=>{const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),1200);try{const res=await fetch(CASUAL_SERVICE_ORIGIN+'/api/health',{credentials:'omit',mode:'cors',cache:'no-store',signal:controller.signal});if(!res.ok)return false;const data=await res.json() as {ok?:boolean;roomStorage?:string};return data.ok===true&&data.roomStorage==='durable-object'}catch{return false}finally{clearTimeout(timeout)}})();
 return await readiness?CASUAL_SERVICE_ORIGIN+'/api/casual':configured;
}
