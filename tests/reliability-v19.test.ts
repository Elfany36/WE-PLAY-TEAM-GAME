import test, {type TestContext} from 'node:test';
import type {RoomRevisionFeed} from '../lib/room-revisions.ts';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {RoomTransport} from '../lib/room-transport.ts';
import {RoomStore} from '../lib/casual/room-store.ts';
import {routeCasual} from '../lib/casual/room-route.ts';
import {routeArena} from '../lib/arena-route.ts';
import {animateCanvas} from '../lib/canvas-visibility.ts';
import {visibleInterval} from '../lib/visible-interval.ts';
import {questionAt} from '../lib/question-bank.ts';

const endpoint='https://example.test/api/casual?code=ABCDEFGH';
test('a lost live receipt retries once through HTTP with the same deduplication key',async t=>{
 const client=new RoomTransport(),body=JSON.stringify({action:'flip',requestId:'same-flip',code:'ABCDEFGH'});
 let live=0,http=0;
 client.attachLive({streaming:true,request:(_url:URL,init:RequestInit)=>{
  live++;assert.equal(init.body,body);
  return new Promise((_resolve,reject)=>init.signal!.addEventListener('abort',()=>reject(new DOMException('Timed out','AbortError')),{once:true}));
 }} as unknown as RoomRevisionFeed);
 t.mock.method(globalThis,'fetch',async(_url:unknown,init:RequestInit)=>{http++;assert.equal(init.body,body);return Response.json({ack:'same-flip'})});
 const response=await client.send(endpoint,{method:'POST',body},{timeout:10});
 assert.equal(response.ack,'same-flip');assert.equal(live,1);assert.equal(http,1);
 await client.send(endpoint,{method:'POST',body});assert.equal(live,1);assert.equal(http,2);
});
test('non-idempotent requests are never replayed, even when retries are configured',async t=>{
 const client=new RoomTransport();let live=0,http=0;
 client.attachLive({streaming:true,request:()=>{live++;return Promise.reject(Error('broken stream'))}} as unknown as RoomRevisionFeed);
 t.mock.method(globalThis,'fetch',async()=>{http++;return Response.json({ok:true})});
 await assert.rejects(client.send(endpoint,{method:'POST',body:'{"action":"create"}'},{retries:2}),/broken stream/);
 assert.equal(live,1);assert.equal(http,0);
});
test('reset cancels retry backoff immediately and never sends an obsolete request',async t=>{
 const client=new RoomTransport();let calls=0;
 t.mock.method(globalThis,'fetch',async()=>{calls++;throw TypeError('offline')});
 const pending=client.send(endpoint,{}, {retries:4});
 const rejected=assert.rejects(pending,{name:'AbortError'});
 await new Promise<void>(resolve=>setImmediate(resolve));client.reset();await rejected;
 assert.equal(calls,1);assert.equal(client.stats.failures,0);
});
test('caller cancellation stops a timed-out live action before HTTP replay',async t=>{
 const client=new RoomTransport(),controller=new AbortController();let http=0;
 client.attachLive({streaming:true,request:(_url:URL,init:RequestInit)=>new Promise((_resolve,reject)=>init.signal!.addEventListener('abort',()=>reject(new DOMException('aborted','AbortError')),{once:true}))} as unknown as RoomRevisionFeed);
 t.mock.method(globalThis,'fetch',async()=>{http++;return Response.json({ok:true})});
 const pending=client.send(endpoint,{signal:controller.signal});const rejected=assert.rejects(pending,{name:'AbortError'});controller.abort();await rejected;assert.equal(http,0);
});

test('committed state parsing is reused and a failed durable write cannot replace it',async()=>{
 let disk:unknown,fail=false;
 const storage={get:async<T>()=>disk as T|undefined,put:async(_key:string,value:unknown)=>{if(fail)throw Error('disk failed');disk=structuredClone(value)},deleteAll:async()=>{disk=undefined},setAlarm:async()=>{}};
 const db=new RoomStore(storage);await db.load();assert.equal(db.inspectState(),null);
 await db.prepare('INSERT INTO casual_rooms').bind('ABCDEFGH','{"value":1}',1000).run();
 const first=db.inspectState<{value:number}>();assert.equal(first!.value,1);assert.equal(first,db.inspectState());
 const mutation=JSON.parse(db.snapshot()!.state);mutation.value=9;assert.equal(first!.value,1);
 fail=true;await assert.rejects(db.prepare('UPDATE casual_rooms SET state=?, revision=revision+1 WHERE code=? AND revision=?').bind('{"value":2}','ABCDEFGH',0).run());
 assert.equal(db.inspectState(),first);fail=false;
 await db.prepare('UPDATE casual_rooms SET state=?, revision=revision+1 WHERE code=? AND revision=?').bind('{"value":2}','ABCDEFGH',0).run();
 assert.notEqual(db.inspectState(),first);assert.equal(db.inspectState<{value:number}>()!.value,2);
 const restored=new RoomStore(storage);await restored.load();assert.deepEqual(restored.inspectState(),{value:2});
 await db.expire(86401001);assert.equal(db.inspectState(),null);
});
test('authority routing failures return retryable JSON with CORS instead of an unreadable error page',async()=>{
 for(const kind of ['casual','arena'] as const){
  const rooms={idFromName:()=> 'id',get:()=>({fetch:async()=>{throw Error('internal private diagnostic')}})} as unknown as DurableObjectNamespace;
  const req=new Request('https://example.test/api/'+kind+'?code=ABCDEFGH',{headers:{Origin:'http://localhost:5173'}});
  const res=kind==='casual'?await routeCasual(req,{CASUAL_ROOMS:rooms}):await routeArena(req,{ARENA_ROOMS:rooms});
  assert.equal(res.status,503);assert.equal(res.headers.get('Access-Control-Allow-Origin'),'http://localhost:5173');assert.equal(res.headers.get('Cache-Control'),'no-store');
  const body=await res.json() as {error:string};assert.match(body.error,/reconnecting/);assert(!body.error.includes('private'));
 }
});
test('unsupported room methods return 405 without touching storage',async()=>{
 for(const method of ['DELETE','PUT','PATCH'])for(const route of [routeCasual,routeArena])assert.equal((await route(new Request(endpoint,{method}),{})).status,405);
});
test('cached quiz questions keep the existing seeded content and cannot leak caller mutations',()=>{
 const q=questionAt(73519,17,'quiz','All');
 assert.equal(createHash('sha256').update(JSON.stringify(q)).digest('hex'),'9366347f722772c102148fb03b7e3006f3ab215d5feb85b7919de92e15851070');
 const original=structuredClone(q);q.prompt='changed';if(q.choices)q.choices[0].label='changed';if(Array.isArray(q.answer))q.answer[0]='changed';
 assert.deepEqual(questionAt(73519,17,'quiz','All'),original);
 for(let i=0;i<270;i++)questionAt(i,0,'quiz','HTML');
 assert.deepEqual(questionAt(73519,17,'quiz','All'),original);
 assert.notDeepEqual(questionAt(73519,18,'quiz','All'),original);
});

function visibleDocument(t:TestContext){
 const doc=new EventTarget() as EventTarget&{hidden:boolean};doc.hidden=false;
 const prior=Object.getOwnPropertyDescriptor(globalThis,'document');Object.defineProperty(globalThis,'document',{configurable:true,value:doc});
 t.after(()=>{if(prior)Object.defineProperty(globalThis,'document',prior);else Reflect.deleteProperty(globalThis,'document')});
 return doc;
}
test('offscreen/context-lost canvases schedule no frames and resume exactly one loop',t=>{
 const doc=visibleDocument(t),canvas=new EventTarget() as HTMLCanvasElement,frames=new Map<number,FrameRequestCallback>();let sequence=0,painted=0,restored=0,failPaint=false,notify!:(entries:{isIntersecting:boolean}[])=>void;
 const saved=['requestAnimationFrame','cancelAnimationFrame','IntersectionObserver'].map(key=>[key,Object.getOwnPropertyDescriptor(globalThis,key)] as const);
 Object.defineProperty(globalThis,'requestAnimationFrame',{configurable:true,value:(fn:FrameRequestCallback)=>{frames.set(++sequence,fn);return sequence}});
 Object.defineProperty(globalThis,'cancelAnimationFrame',{configurable:true,value:(id:number)=>frames.delete(id)});
 Object.defineProperty(globalThis,'IntersectionObserver',{configurable:true,value:class{constructor(fn:typeof notify){notify=fn}observe(){}disconnect(){}}});
 t.after(()=>{for(const [key,value]of saved)if(value)Object.defineProperty(globalThis,key,value);else Reflect.deleteProperty(globalThis,key)});
 const run=()=>{const pending=[...frames.values()];frames.clear();for(const fn of pending)fn(100)};
 const loop=animateCanvas(canvas,()=>{if(failPaint){failPaint=false;throw Error('transient draw failure')}painted++},()=>{restored++});assert.equal(frames.size,1);run();assert.equal(painted,1);assert.equal(frames.size,1);
 notify([{isIntersecting:false}]);assert.equal(frames.size,0);run();assert.equal(painted,1);
 notify([{isIntersecting:true}]);notify([{isIntersecting:true}]);assert.equal(frames.size,1);
 doc.hidden=true;doc.dispatchEvent(new Event('visibilitychange'));assert.equal(frames.size,0);
 doc.hidden=false;doc.dispatchEvent(new Event('visibilitychange'));assert.equal(frames.size,1);
 canvas.dispatchEvent(new Event('contextlost',{cancelable:true}));assert.equal(frames.size,0);
 canvas.dispatchEvent(new Event('contextrestored'));assert.equal(restored,1);assert.equal(frames.size,1);
 failPaint=true;assert.throws(run,/transient draw failure/);assert.equal(frames.size,1);run();assert.equal(frames.size,1);assert.equal(restored,2);
 loop.dispose();assert.equal(frames.size,0);doc.dispatchEvent(new Event('visibilitychange'));notify([{isIntersecting:true}]);assert.equal(frames.size,0);
});
test('visible UI intervals have no background ticks and refresh immediately on return',t=>{
 const doc=visibleDocument(t);t.mock.timers.enable({apis:['setInterval']});let ticks=0;
 const stop=visibleInterval(()=>{ticks++},250);assert.equal(ticks,1);t.mock.timers.tick(250);assert.equal(ticks,2);
 doc.hidden=true;doc.dispatchEvent(new Event('visibilitychange'));t.mock.timers.tick(10000);assert.equal(ticks,2);
 doc.hidden=false;doc.dispatchEvent(new Event('visibilitychange'));assert.equal(ticks,3);t.mock.timers.tick(250);assert.equal(ticks,4);
 stop();t.mock.timers.tick(1000);assert.equal(ticks,4);
});
