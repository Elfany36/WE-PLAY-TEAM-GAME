/** Both gateways use the same room namespaces; this is routing, never replication. */
export const SEA_GATEWAY='https://markup-arcade.kendsfabros.workers.dev';
export const PH_GATEWAY='https://markup-arcade-ph.kendsfabros.workers.dev';
export function roomGateway(origin:unknown){return origin===SEA_GATEWAY||origin===PH_GATEWAY?origin:undefined}
export function requestGateway(request:Request){return roomGateway(new URL(request.url).origin)}
export function gatewayProbeData(value:unknown){
 if(!value||typeof value!=='object'||Array.isArray(value))return null;
 const data=value as Record<string,unknown>;
 if(data.ok!==true||data.service!=='markup-arcade'||!Number.isSafeInteger(data.version)||Number(data.version)<38)return null;
 return{version:Number(data.version),region:data.gatewayRegion==='Hong Kong'?'Hong Kong':data.gatewayRegion==='Singapore'?'Singapore':'Website',entry:typeof data.entryColo==='string'&&/^[A-Z0-9]{3,6}$/.test(data.entryColo)?data.entryColo:null};
}
