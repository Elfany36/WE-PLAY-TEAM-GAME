import test from 'node:test';
import assert from 'node:assert/strict';
import {animateCanvas} from '../lib/canvas-visibility.ts';
import {sketchSamples} from '../lib/casual/sketch-input.ts';
import {worldFrameReady} from '../lib/casual/world-stream.ts';
import {PiratePrediction} from '../lib/casual/pirate-prediction.ts';
import {createPirateWorld} from '../lib/casual/pirate-runtime.js';

test('pen backlog sampling keeps the entire gesture and actual empty-coalesced events',()=>{
 const points=Array.from({length:256},(_,x)=>({x,y:x<128?0:x-128})),actual={x:999,y:900};
 const sampled=sketchSamples(points,actual);
 assert.equal(sampled.length,32);assert.strictEqual(sampled[0],points[0]);assert.strictEqual(sampled.at(-1),points.at(-1));
 assert(sampled.some(p=>p.x>=80&&p.x<100));assert(sampled.some(p=>p.x>=160&&p.x<180));
 assert(sampled.every((p,i)=>!i||p.x>sampled[i-1].x));assert.deepEqual(sketchSamples([],actual),[actual]);assert.deepEqual(sketchSamples(undefined,actual),[actual]);
 const short=points.slice(0,8);assert.strictEqual(sketchSamples(short,actual),short);
});

test('tab return waits for fresh moving state, including expired countdowns, but never blocks a static board',()=>{
 const room:any={phase:'playing',mode:'circuit',serverNow:10000,game:{startAt:9000}};
 assert.equal(worldFrameReady(room,100,10100),false);assert.equal(worldFrameReady(room,10101,10100),true);
 assert.equal(worldFrameReady({...room,phase:'paused'},100,10100),true);
 assert.equal(worldFrameReady({...room,phase:'finished'},100,10100),true);
 assert.equal(worldFrameReady({...room,mode:'chess'},100,10100),true);
 assert.equal(worldFrameReady({...room,mode:'pool',game:{moving:false}},100,10100),true);
 assert.equal(worldFrameReady({...room,mode:'pool',game:{moving:true}},100,10100),false);
 assert.equal(worldFrameReady({...room,game:{startAt:11000}},100,200),true);
 assert.equal(worldFrameReady({...room,game:{startAt:11000}},100,2100),false);
});

test('a suspended canvas retains its last image until fresh authority and resets presentation once',t=>{
 const document=Object.assign(new EventTarget(),{hidden:false}),canvas=new EventTarget() as HTMLCanvasElement,frames=new Map<number,FrameRequestCallback>();
 let now=0,sequence=0,receipt=0,resets=0,restores=0,intersect!:(entries:{isIntersecting:boolean}[])=>void;const painted:number[]=[],saved=new Map<string,PropertyDescriptor|undefined>();
 for(const [key,value]of Object.entries({document,requestAnimationFrame:(callback:FrameRequestCallback)=>{frames.set(++sequence,callback);return sequence},cancelAnimationFrame:(id:number)=>frames.delete(id),IntersectionObserver:class{constructor(callback:typeof intersect){intersect=callback}observe(){}disconnect(){}}})){
  saved.set(key,Object.getOwnPropertyDescriptor(globalThis,key));Object.defineProperty(globalThis,key,{configurable:true,value});
 }
 t.mock.method(performance,'now',()=>now);t.after(()=>{for(const[key,descriptor]of saved)if(descriptor)Object.defineProperty(globalThis,key,descriptor);else Reflect.deleteProperty(globalThis,key)});
 const run=(time:number)=>{now=time;const callbacks=[...frames.values()];frames.clear();for(const fn of callbacks)fn(time)};
 const loop=animateCanvas(canvas,time=>painted.push(time),()=>restores++,{ready:woke=>receipt>=woke,reset:()=>resets++});
 run(16);assert.deepEqual(painted,[16]);now=32;document.hidden=true;document.dispatchEvent(new Event('visibilitychange'));assert.equal(frames.size,0);
 now=10000;document.hidden=false;document.dispatchEvent(new Event('visibilitychange'));run(10016);run(10032);assert.deepEqual(painted,[16]);assert.equal(resets,0);
 receipt=10040;run(10048);run(10064);assert.deepEqual(painted,[16,10048,10064]);assert.equal(resets,1);
 intersect([{isIntersecting:false}]);assert.equal(frames.size,0);now=12000;intersect([{isIntersecting:true}]);run(12016);assert.equal(painted.at(-1),10064);
 receipt=12020;run(12032);assert.equal(painted.at(-1),12032);assert.equal(resets,2);
 canvas.dispatchEvent(new Event('contextlost',{cancelable:true}));now=14000;canvas.dispatchEvent(new Event('contextrestored'));assert.equal(restores,1);run(14016);assert.equal(painted.at(-1),12032);
 receipt=14020;run(14032);assert.equal(painted.at(-1),14032);assert.equal(resets,3);
 loop.dispose();assert.equal(frames.size,0);document.dispatchEvent(new Event('visibilitychange'));assert.equal(frames.size,0);
});

test('Pirate presentation rebase preserves pending inputs and discards old extrapolation',()=>{
 const world=createPirateWorld('seaside-cove','classic',[{id:'a',bot:false,character:0,color:'#fff',model:'bomb-guy'},{id:'b',bot:false,character:1,color:'#aaa',model:'bald-pirate'}],19),actor=world.fighters[0],before=structuredClone(world),prediction=new PiratePrediction(),fresh=new PiratePrediction();
 const input={seq:1,at:1000,dx:1,jumpHeld:false,jumpSeq:0};prediction.record('a',input);fresh.record('a',input);prediction.pose(actor,world,1000,1300);prediction.rebase();
 assert.deepEqual(prediction.pose(actor,world,1000,1100),fresh.pose(actor,world,1000,1100));assert(prediction.pose(actor,world,1000,1100).x>actor.x);assert.deepEqual(world,before);
});
