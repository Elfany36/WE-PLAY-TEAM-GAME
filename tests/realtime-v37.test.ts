import {nextControlSequence} from '../lib/control-sequence.ts';
import test from 'node:test';import assert from 'node:assert/strict';
import {createCasual,applyCasualAction,publicCasual,type CasualMode} from '../lib/casual/engine.ts';
import {casualBody,createCasualAPI} from '../lib/casual/api.ts';
import {RoomStore} from '../lib/casual/room-store.ts';
import {RoomTransport} from '../lib/room-transport.ts';
import {roomHeaders} from '../lib/room-origin.ts';

function fixture(mode:CasualMode){let s=createCasual('ABCDEFGH','a','Alice','hash-a',mode,19,10000);s=applyCasualAction(s,{action:'join',id:'b',name:'Bob',hash:'hash-b'},null,10000);s=applyCasualAction(s,{action:'start'},'a',10000);return s}
const packet=(s:ReturnType<typeof fixture>,seq:number)=>{const g:any=s.game,mode=s.mode;return{round:s.round,inputEpoch:g.startAt,controlEpoch:0,seq,...(mode==='circuit'?{action:'drive',throttle:1,steer:0}:mode==='terra'?{action:'explore',right:true,tx:5,ty:5,slot:0}:mode==='snake'?{action:'direction',direction:'down'}:mode==='blocks'?{action:'block-input',moves:[{seq,move:'left'}]}:mode==='pirate'?{action:'pirate-input',life:g.world.fighters[0].life,dx:1,down:false,jump:false,attack:false,special:false,dash:false,jumpSeq:0,attackSeq:0,specialSeq:0,dashSeq:0}:{action:'party-control',dx:1,dy:0,aim:0,fire:false,dash:false,brake:false})}}

test('every continuous mode rejects a newer delayed packet from a revoked view and accepts the new view',()=>{
 for(const mode of['snake','terra','circuit','tanks','sumo','pong','marble','blocks','pirate'] as CasualMode[]){let s=fixture(mode);s.players[0].controlEpoch=1;const before=structuredClone(s),p=packet(s,200),now=(s.game as any).startAt+1;
  assert.throws(()=>applyCasualAction(s,p,'a',now),/older control view/);assert.deepEqual(s,before);
  s=applyCasualAction(s,{...p,controlEpoch:1},'a',now);assert(s.game);assert.doesNotThrow(()=>applyCasualAction(s,{...packet(s,201),controlEpoch:undefined},'a',now));
  const own=publicCasual(s,'a',now),other=publicCasual(s,'b',now);assert.equal(own.controlEpoch,1);assert.equal(other.controlEpoch,0);assert(!own.players.some(p=>'controlEpoch'in p));
 }
});
test('control generations are strictly parsed before reaching the engine',async()=>{
 const req=(controlEpoch:unknown)=>new Request('https://example.test/api/casual',{method:'POST',body:JSON.stringify({action:'drive',code:'ABCDEFGH',requestId:'test-epoch-1',round:1,seq:1,throttle:1,steer:0,controlEpoch})});
 assert.equal((await casualBody(req(7))).controlEpoch,7);for(const bad of[-1,1.5,'7',Number.MAX_SAFE_INTEGER+1])await assert.rejects(casualBody(req(bad)),/current control view/);
});

test('HTTP receipt optimization requires a capable, healthy live stream and a control POST',async t=>{
 const requests:{receipt?:boolean;headers:string[];requestId:string}[]=[];t.mock.method(globalThis,'fetch',async(_url:unknown,init:RequestInit)=>{const body=JSON.parse(init.body as string);requests.push({receipt:body.controlReceipt,headers:[...new Headers(init.headers).keys()],requestId:body.requestId});return Response.json({ack:'done',revision:2,serverNow:1000})});
 const make=(version:number,autonomous=true)=>{const transport=new RoomTransport();transport.attachLive({streaming:true,autonomous,request:()=>null} as any);transport.receive({room:{serverVersion:version,code:'ABCDEFGH',mode:'terra',round:1,revision:1,serverNow:1000},snapshotId:'initial'});return transport};
 const send=(tr:RoomTransport,action='explore')=>tr.send('https://example.test/api/casual',{method:'POST',headers:{Authorization:'Bearer token'},body:JSON.stringify({action,code:'ABCDEFGH',requestId:'dedupe-input'})});
 await send(make(37));assert.equal(requests.at(-1)!.receipt,true);
 await send(make(36));assert.deepEqual(requests[0].headers,requests[1].headers);assert.equal(requests[0].requestId,requests[1].requestId);assert.equal(requests.at(-1)!.receipt,undefined);
 await send(make(37,false));assert.equal(requests.at(-1)!.receipt,undefined);
 const stalled=make(37);stalled.stats.lastLiveStateReceipt=performance.now()-2000;await send(stalled);assert.equal(requests.at(-1)!.receipt,undefined);
 await send(make(37),'chat');assert.equal(requests.at(-1)!.receipt,undefined);
});

test('HTTP control receipts retain authentication, deduplication, full-state reads and private caching',async()=>{
 const values=new Map<string,any>(),store=new RoomStore({get:async(k:string)=>values.get(k),put:async(k:string,v:any)=>values.set(k,structuredClone(v)),setAlarm:async()=>{}} as any);await store.load();
 const api=createCasualAPI(store),origin='https://example.test/api/casual',post=(body:any,token?:string,small=false)=>api.POST(new Request(origin,{method:'POST',headers:{'content-type':'application/json',...(token?{Authorization:'Bearer '+token}:{}),...(small?{'X-Room-Control-Receipt':'1'}:{})},body:JSON.stringify({...body,...(small?{controlReceipt:true}:{}),requestId:body.requestId||crypto.randomUUID()})}));
 const created=await(await post({action:'create',mode:'terra',name:'Host',bots:0})).json() as any,code=created.room.code,token=created.token;await post({action:'join',code,name:'Peer'});const start=await(await post({action:'start',code},token)).json() as any;
 const input={action:'explore',code,round:start.room.round,seq:1,tx:5,ty:5,slot:0,right:true,requestId:'receipt-input-1'};
 const denied=await post(input,undefined,true);assert.equal(denied.status,401);
 const receipt=await post(input,token,true),body=await receipt.json() as any;assert.equal(receipt.status,200);assert.equal(body.ack,input.requestId);assert(!body.room&&!body.patch&&!body.snapshotId);assert.equal(receipt.headers.get('Cache-Control'),'no-store');
 const again=await(await post(input,token,true)).json() as any;assert.equal(again.ack,input.requestId);
 const full=await(await api.GET(new Request(origin+'?code='+code,{headers:{Authorization:'Bearer '+token}}))).json() as any;assert(full.room);assert.equal(full.room.game.inputs[full.room.youId].seq,1);
 const cors=roomHeaders(new Request(origin,{headers:{Origin:'https://elfany36.github.io'}}));assert(!cors['Access-Control-Allow-Headers']?.includes('X-Room-Control-Receipt'));
});

test('control sequences recover after clock correction, reload and delayed authority receipts',()=>{
 const now=1800000000000,future=now+3600000;assert.equal(nextControlSequence(0,future,now),future+1);
 assert.equal(nextControlSequence(future+5,future,now),future+6);assert.equal(nextControlSequence(0,0,now),now);
 assert.equal(nextControlSequence(100,50,2),101);assert.equal(nextControlSequence(0,0,-100),1);
});
