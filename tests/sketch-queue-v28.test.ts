import {test} from 'node:test';import assert from 'node:assert/strict';
import {SketchQueue,type StrokeSegment} from '../lib/casual/sketch-queue.ts';
const packet=(points:number[],closed=false):StrokeSegment=>({strokeId:'stroke-first',color:'#243346',size:8,points,closed,round:1,turn:1,canvasEpoch:1});
test('a slow stroke receipt never replaces earlier points and coalesces queued segments in order',async()=>{
 const sent:(StrokeSegment&{seq:number;requestId:string})[]=[],releases:(()=>void)[]=[];const q=new SketchQueue(async p=>{sent.push(p);await new Promise<void>(r=>releases.push(r))});q.enqueue(packet([1,1]));q.enqueue(packet([2,2]));q.enqueue(packet([3,3],true));assert.equal(sent.length,1);assert.equal(q.pending,2);releases.shift()!();await new Promise(resolve=>setTimeout(resolve,0));assert.equal(sent.length,2);assert.deepEqual(sent[1].points,[2,2,3,3]);assert.equal(sent[1].seq,2);assert(sent[1].closed);releases.shift()!();await q.idle();assert.equal(q.pending,0);
});
test('transient retries reuse a single request identifier while permanent errors stop queued writes',async()=>{
 const ids:string[]=[];let attempts=0;const q=new SketchQueue(async p=>{ids.push(p.requestId);if(attempts++<1)throw Error('connection interrupted')});q.enqueue(packet([1,1],true));await q.idle();assert.equal(ids.length,2);assert.equal(new Set(ids).size,1);
 const errors:string[]=[];const fail=new SketchQueue(async()=>{throw Object.assign(Error('not artist'),{status:403})},e=>errors.push((e as Error).message));fail.enqueue(packet([1,1]));fail.enqueue(packet([2,2],true));await fail.idle();assert.deepEqual(errors,['not artist']);assert.equal(fail.pending,0);
});
test('a new turn cannot merge with a prior canvas and reset releases pending waiters',async()=>{
 let done!:()=>void;const sent:StrokeSegment[]=[],q=new SketchQueue(async p=>{sent.push(p);if(sent.length===1)await new Promise<void>(r=>done=r)});q.enqueue(packet([1,1]));const waiting=q.idle();q.reset();await waiting;q.enqueue({...packet([2,2],true),turn:2});await q.idle();done();assert.equal(sent[1].turn,2);assert.deepEqual(sent[1].points,[2,2]);assert.equal(q.pending,0);
});
