import test from 'node:test';import assert from 'node:assert/strict';
import {selectRoomGateway} from '../lib/casual/gateway-choice.ts';
import {PH_GATEWAY,SEA_GATEWAY,roomGateway,gatewayProbeData} from '../lib/room-gateways.ts';
import {roomProbe} from '../lib/room-probe.ts';
import {routeCasual} from '../lib/casual/room-route.ts';
import {routeArena} from '../lib/arena-route.ts';
import {RoomStore} from '../lib/casual/room-store.ts';
import {createCasualAPI} from '../lib/casual/api.ts';
import {createArenaAPI} from '../lib/arena-api.ts';
import {RoomTransport} from '../lib/room-transport.ts';
import {chooseCasualEndpoint,chooseArenaEndpoint,sessionCasualEndpoint,invitationEndpoint,invitationService} from '../lib/casual/service.ts';
const payload={ok:true,service:'markup-arcade',version:38,gatewayRegion:'Hong Kong',entryColo:'MNL'};
test('regional selection compares warm requests instead of penalizing an initial TLS connection',async()=>{
 const calls:Record<string,number>={};const result=await selectRoomGateway(async(url:any,init)=>{const origin=new URL(url).origin,index=calls[origin]||0;calls[origin]=index+1;assert.equal(new URL(url).pathname,'/api/ping');assert(!new Headers(init?.headers).has('Authorization'));await new Promise(resolve=>setTimeout(resolve,origin===SEA_GATEWAY?(index?80:50):(index?15:200)));return Response.json(payload)},()=>performance.now(),500);
 assert.equal(result.origin,PH_GATEWAY);assert.equal(calls[SEA_GATEWAY],2);assert.equal(calls[PH_GATEWAY],2);
});
test('Philippines-like route timings choose Hong Kong; Singapore stays preferred when faster',async()=>{
 for(const[sea,ph,wanted]of[[220,18,PH_GATEWAY],[12,80,SEA_GATEWAY],[18,20,SEA_GATEWAY]] as const){const r=await selectRoomGateway(async(url:any)=>{await new Promise(resolve=>setTimeout(resolve,new URL(url).origin===SEA_GATEWAY?sea:ph));return Response.json(payload)},()=>performance.now(),500);assert.equal(r.origin,wanted);assert(r.samples.every(s=>s.rtt!==null));}
});
test('failed, stale and malformed regional probes retain the established authority, never a website fallback',async()=>{
 for(const bad of[{...payload,version:37},{...payload,service:'other'},null]){const r=await selectRoomGateway(async()=>Response.json(bad));assert.equal(r.origin,SEA_GATEWAY);assert(r.samples.every(s=>s.rtt===null))}
 const phOnly=await selectRoomGateway(async(url:any)=>{if(new URL(url).origin===SEA_GATEWAY)throw Error('temporary unavailable');return Response.json(payload)});assert.equal(phOnly.origin,PH_GATEWAY);
 const timeout=await selectRoomGateway(async(_url,init)=>new Promise((_resolve,reject)=>init?.signal?.addEventListener('abort',()=>reject(new DOMException('Timeout','AbortError')))),()=>performance.now(),5);assert.equal(timeout.origin,SEA_GATEWAY);
});
test('public route probe is uncached, CORS restricted and independent of room/database availability',async()=>{
 const request=new Request(PH_GATEWAY+'/api/ping',{headers:{Origin:'https://we-play-team-game.kendsfabros.workers.dev'}});Object.defineProperty(request,'cf',{value:{colo:'CGY'}});const response=roomProbe(request),data=await response.json() as any;assert.equal(response.status,200);assert.equal(response.headers.get('Cache-Control'),'no-store');assert.equal(data.entryColo,'CGY');assert.equal(data.gatewayRegion,'Hong Kong');assert(gatewayProbeData(data));assert(!('token'in data));
 assert.equal(roomProbe(new Request(SEA_GATEWAY+'/api/ping',{headers:{Origin:'https://evil.test'}})).status,403);assert.equal(roomProbe(new Request(PH_GATEWAY+'/api/ping',{method:'POST'})).status,405);assert.equal(roomProbe(new Request(PH_GATEWAY+'/api/ping',{method:'OPTIONS'})).status,204);
});
test('both room routers keep their object identity and use the creating gateway for Hong Kong placement',async()=>{
 const calls:any[]=[],rooms={idFromName:(name:string)=>name,get:(name:string,options:any)=>({fetch:async()=>{calls.push({name,options});return Response.json({ok:true})}})} as any;
 for(const route of[routeCasual,routeArena])for(const origin of[PH_GATEWAY,SEA_GATEWAY])await route(new Request(origin+'/api/casual?code=ABCDEFGH'),{CASUAL_ROOMS:rooms,ARENA_ROOMS:rooms} as any);
 assert.deepEqual(calls.map(c=>c.name),['casual:ABCDEFGH','casual:ABCDEFGH','arena:ABCDEFGH','arena:ABCDEFGH']);assert.equal(calls[0].options,undefined);assert.equal(calls[2].options,undefined);assert.equal(calls[1].options.locationHint,'apac-se');assert.equal(calls[3].options.locationHint,'apac-se');
});
test('the creating gateway stays canonical across joins from the other gateway for both room systems',async()=>{
 for(const kind of['casual','arena'] as const){const values=new Map<string,any>(),store=new RoomStore({get:async(k:string)=>values.get(k),put:async(k:string,v:any)=>{values.set(k,structuredClone(v))},deleteAll:async()=>values.clear(),setAlarm:async()=>{}} as any,undefined,kind==='casual'?'casual_rooms':'arena_rooms');await store.load();const api=(kind==='casual'?createCasualAPI:createArenaAPI)(store);const post=async(origin:string,body:any)=>api.POST(new Request(origin+'/api/'+kind,{method:'POST',body:JSON.stringify({...body,requestId:crypto.randomUUID()})}));const created=await(await post(PH_GATEWAY,{action:'create',mode:kind==='casual'?'snake':'blanks',name:'Host',gatewayOrigin:'https://evil.test'})).json() as any;assert.equal(created.room.gatewayOrigin,PH_GATEWAY);const joined=await(await post(SEA_GATEWAY,{action:'join',name:'Friend',code:created.room.code})).json() as any;assert.equal(joined.room.gatewayOrigin,PH_GATEWAY);assert.equal(joined.room.players.length,2);assert(!JSON.stringify(joined.room).includes('tokenHash'));}
});
test('real socket probes are kept separate from queued action and pushed snapshot timings',async()=>{
 const transport=new RoomTransport();transport.observeLatency(48,'ping');transport.observeLatency(280,'request');assert.equal(transport.stats.pingRtt,48);assert.equal(transport.stats.totalRtt,280);transport.receive({room:{code:'ABCDEFGH',serverVersion:38,serverNow:1000}});assert.equal(transport.stats.pingRtt,48);transport.reset();assert.equal(transport.stats.pingRtt,null);
});
test('Cloudflare website uses the direct authority and Hong Kong invitations keep a trusted origin',async t=>{
 const original=Object.getOwnPropertyDescriptor(globalThis,'location');Object.defineProperty(globalThis,'location',{configurable:true,value:new URL('https://we-play-team-game.kendsfabros.workers.dev/')});t.after(()=>{if(original)Object.defineProperty(globalThis,'location',original);else delete(globalThis as any).location});assert.equal(await chooseCasualEndpoint(),SEA_GATEWAY+'/api/casual');assert.equal(await chooseArenaEndpoint(),SEA_GATEWAY+'/api/arena');assert.equal(sessionCasualEndpoint(PH_GATEWAY),PH_GATEWAY+'/api/casual');assert.equal(invitationService(PH_GATEWAY),'ph');assert.equal(invitationEndpoint('ph'),PH_GATEWAY+'/api/casual');assert.equal(roomGateway('https://evil.test'),undefined);
});
