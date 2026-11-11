import {requestGateway,PH_GATEWAY} from './room-gateways.ts';
import {roomHeaders,roomOriginAllowed} from './room-origin.ts';
/** Small, uncached gateway measurement. It never opens a room or queries D1. */
export function roomProbe(request:Request){
 const headers=roomHeaders(request);
 if(!roomOriginAllowed(request))return Response.json({error:'This frontend is not allowed.'},{status:403,headers});
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
 if(!['GET','HEAD'].includes(request.method))return Response.json({error:'Method not allowed.'},{status:405,headers:{...headers,Allow:'GET, HEAD, OPTIONS'}});
 const colo=(request as Request&{cf?:{colo?:unknown}}).cf?.colo;
 const data={ok:true,service:'markup-arcade',version:38,gatewayRegion:requestGateway(request)===PH_GATEWAY?'Hong Kong':requestGateway(request)?'Singapore':null,entryColo:typeof colo==='string'&&/^[A-Z0-9]{3,6}$/.test(colo)?colo:null,roomLocationHint:requestGateway(request)===PH_GATEWAY?'near-gateway':'apac-se'};
 return request.method==='HEAD'?new Response(null,{headers}):Response.json(data,{headers});
}
