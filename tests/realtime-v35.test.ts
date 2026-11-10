import test from 'node:test';
import assert from 'node:assert/strict';
import {applyRoomDelta,wireRoom} from '../lib/room-delta.ts';
import {roomSnapshot} from '../lib/room-snapshots.ts';
import {createCasual,applyCasualAction,publicCasual} from '../lib/casual/engine.ts';
import {casualBody} from '../lib/casual/api.ts';
import type {SketchGame} from '../lib/casual/sketch.ts';
import {SketchQueue,type OrderedSegment} from '../lib/casual/sketch-queue.ts';
import {roomStreamRequest} from '../lib/room-stream.ts';
import {CanvasResolution} from '../lib/canvas-resolution.ts';

test('heavy world rendering adapts after sustained slow frames and keeps native geometry',()=>{
 const quality=new CanvasResolution();assert.equal(quality.width(1600),1600);
 for(let at=16;at<1600;at+=16)quality.frame(at,true);assert.equal(quality.width(1600),1600);
 quality.frame(5000,true);assert.equal(quality.width(1600),1600,'A tab return must not lower detail');
 for(let at=5066;at<10000;at+=66)quality.frame(at,true);assert(quality.width(1600)<1600);assert(quality.width(1600)>=960);assert.equal(quality.width(480),480);
 const reduced=quality.width(1600);for(let at=10016;at<16000;at+=16)quality.frame(at,true);assert.equal(quality.width(1600),reduced,'Detail must not oscillate after a brief recovery');
 for(let at=16016;at<24000;at+=16)quality.frame(at,true);assert(quality.width(1600)>reduced);
 const steady=new CanvasResolution();for(let at=33;at<20000;at+=33)steady.frame(at,true);assert.equal(steady.width(1600),1600,'A steady 30 Hz display retains detail');
});

test('one fanout shares public coordinates while private projections remain separate',()=>{
 let state=createCasual('ABCDEFGH','artist','Artist','hash','sketch',91,10000);
 state=applyCasualAction(state,{action:'join',id:'friend',name:'Friend',hash:'friend-hash'},null,10000);
 state=applyCasualAction(state,{action:'start'},'artist',10000);
 state=applyCasualAction(state,{action:'sketch-choose',round:1,turn:1,choice:0},'artist',10100);
 const cache=new WeakMap(),request=new Request('https://example.test/api/casual?wire=1');
 const artist=roomSnapshot(request,{room:publicCasual(state,'artist',10200)},cache).room;
 const friend=roomSnapshot(request,{room:publicCasual(state,'friend',10200)},cache).room;
 assert(artist.game.word);assert.equal(friend.game.word,undefined);assert.deepEqual(friend.game.choices,[]);
 assert.strictEqual(artist.game.strokes,friend.game.strokes);
 const raw={x:1.123456,y:2.123456};const first=wireRoom({actor:raw},'',new WeakMap());raw.x=8.765432;
 const next=wireRoom({actor:raw},'',new WeakMap());assert.equal(first.actor.x,1.123);assert.equal(next.actor.x,8.765);
});

test('unchanged terrain uses small exact deltas and world edits cannot reuse an old terrain version',()=>{
 const raw:any={code:'TERRA234',youId:'me',mode:'terra',round:1,revision:1,game:{kind:'terra',width:120,height:80,version:1,tiles:Array(9600).fill(3),explorers:[{id:'me',x:4.123456,y:5}]}},request=(base?:string)=>new Request('https://example.test/api/casual?wire=1'+(base?'&base='+base:''));
 const first=roomSnapshot(request(),{room:raw});const copy=structuredClone(first.room);
 raw.revision++;raw.game.explorers[0].x=5.123456;
 const second=roomSnapshot(request(first.snapshotId),{room:raw});assert(second.patch);assert(JSON.stringify(second).length<1000);
 const restored=applyRoomDelta(first.room,second.patch);assert.deepEqual(restored,wireRoom(raw));assert.deepEqual(first.room,copy);
 raw.revision++;raw.game.version++;raw.game.tiles[50]=0;
 const third=roomSnapshot(request(second.snapshotId),{room:raw});const edited=third.room||applyRoomDelta(restored,third.patch);
 assert.equal(edited.game.tiles[50],0);assert.equal(first.room.game.tiles[50],3);assert.deepEqual(edited,wireRoom(raw));
});

test('ink deltas retain exact appended points and canvas resets never restore removed strokes',()=>{
 const raw:any={code:'SKETCH35',youId:'viewer',mode:'sketch',round:1,revision:1,game:{kind:'sketch',turn:1,canvasEpoch:1,strokes:Array.from({length:100},(_,i)=>({id:'stroke-'+i,seq:1,color:'#243346',size:8,closed:true,points:Array.from({length:60},(_,p)=>p)}))}};
 raw.game.strokes.at(-1).closed=false;const request=(base?:string)=>new Request('https://example.test/api/casual?wire=1'+(base?'&base='+base:'')),first=roomSnapshot(request(),{room:raw}),original=structuredClone(first.room);
 raw.revision++;raw.game.strokes.at(-1).seq++;raw.game.strokes.at(-1).points.push(80,90);
 const second=roomSnapshot(request(first.snapshotId),{room:raw});assert(second.patch);assert(JSON.stringify(second).length<1000);
 const restored=applyRoomDelta(first.room,second.patch);assert.deepEqual(restored,wireRoom(raw));assert.deepEqual(first.room,original);
 raw.revision++;raw.game.canvasEpoch++;raw.game.strokes=[{...raw.game.strokes[0],points:[700,500],seq:1}];
 const cleared=roomSnapshot(request(second.snapshotId),{room:raw}),next=cleared.room||applyRoomDelta(restored,cleared.patch);assert.deepEqual(next,wireRoom(raw));assert.deepEqual(next.game.strokes[0].points,[700,500]);
});

const segment=(strokeId:string,points=[10,10],closed=true)=>({strokeId,points,closed,color:'#243346',size:8,round:1,turn:1,canvasEpoch:1});

test('many short strokes behind one slow receipt drain in bounded ordered batches',async()=>{
 let release!:()=>void;const sent:OrderedSegment[][]=[],q=new SketchQueue(async p=>{sent.push([p]);if(sent.length===1)await new Promise<void>(r=>release=r)},error=>assert.fail(String(error)),{limit:()=>8,send:async packets=>{sent.push(packets)}});
 for(let i=0;i<14;i++)q.enqueue(segment('stroke-number-'+i));assert.equal(sent.length,1);release();await q.idle();
 assert.deepEqual(sent.map(p=>p.length),[1,8,5]);assert.deepEqual(sent.flat().map(p=>p.strokeId),Array.from({length:14},(_,i)=>'stroke-number-'+i));
 assert(sent.flat().every(p=>p.seq===1));assert.equal(new Set(sent.flat().map(p=>p.requestId)).size,14);
});
test('a batch preserves per-stroke sequences, byte bounds, retry identity and old-server compatibility',async()=>{
 let release!:()=>void,attempt=0;const sent:OrderedSegment[][]=[],q=new SketchQueue(async p=>{sent.push([p]);if(sent.length===1)await new Promise<void>(r=>release=r)},error=>assert.fail(String(error)),{limit:()=>8,send:async packets=>{sent.push(packets);if(attempt++===0)throw Error('lost receipt')}});
 q.enqueue(segment('stroke-continuous',[1,1],false));for(let i=0;i<8;i++)q.enqueue(segment('stroke-continuous',Array(128).fill(i+2),i===7));release();await q.idle();
 const unique=sent.filter((p,i)=>!i||p!==sent[i-1]);assert.deepEqual(unique.flat().map(p=>p.seq),Array.from({length:9},(_,i)=>i+1));
 assert.strictEqual(sent[1],sent[2]);assert(sent.every(p=>JSON.stringify(p).length<4000));
 let last!:()=>void,count=0;const legacy=new SketchQueue(async()=>{if(++count===1)await new Promise<void>(r=>last=r)},error=>assert.fail(String(error)),{limit:()=>1,send:async()=>assert.fail('Old servers must receive single segments')});
 legacy.enqueue(segment('stroke-legacy-1'));legacy.enqueue(segment('stroke-legacy-2'));last();await legacy.idle();assert.equal(count,2);
});

test('drawing batches apply atomically and produce the same canvas as individual segments',async()=>{
 let state=createCasual('ABCDEFGH','artist','Artist','hash','sketch',91,10000);state.settings.bots=1;state=applyCasualAction(state,{action:'start'},'artist',10000);state=applyCasualAction(state,{action:'sketch-choose',round:1,turn:1,choice:0},'artist',10100);
 const segments=[{...segment('stroke-first',[1,2,3,4],false),seq:1},{...segment('stroke-first',[5,6]),seq:2},{...segment('stroke-second',[8,9]),seq:1}],body={action:'sketch-strokes',requestId:'batch-request-v35',code:state.code,round:1,turn:1,canvasEpoch:(state.game as SketchGame).canvasEpoch,segments};
 const parse=(v:any)=>casualBody(new Request('https://example.test/api/casual',{method:'POST',body:JSON.stringify(v)}));
 const parsed=await parse(body),batched=applyCasualAction(state,parsed,'artist',10200);let serial=state;
 for(const p of segments)serial=applyCasualAction(serial,{...p,action:'sketch-stroke',canvasEpoch:body.canvasEpoch},'artist',10200);
 assert.deepEqual(batched.game,serial.game);assert.equal((state.game as SketchGame).strokes.length,0);
 assert.throws(()=>applyCasualAction(state,{...parsed,segments:[segments[0],{...segments[1],seq:4}]},'artist',10200),/stroke changed/);assert.equal((state.game as SketchGame).strokes.length,0);
 for(const bad of [{segments:Array(9).fill(segments[0])},{segments:[{...segments[0],points:[1,999]}]},{segments:[null]}])await assert.rejects(parse({...body,...bad}));
 const receipt=roomStreamRequest({id:'1',method:'POST',body:{...body,requestId:'drawing-request'},receiptOnly:true},state.code,'casual');assert.equal(receipt.headers.get('X-Room-Control-Receipt'),'1');
 const forged=roomStreamRequest({id:'2',method:'POST',body:{action:'chat',code:state.code},receiptOnly:true},state.code,'casual');assert.equal(forged.headers.get('X-Room-Control-Receipt'),null);
});
