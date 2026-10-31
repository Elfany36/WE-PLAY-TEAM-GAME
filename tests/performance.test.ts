import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {AsyncLocalStorage} from 'node:async_hooks';
import {roomBatch} from '../lib/room-batch.ts';
import {interpolatePose} from '../lib/game-motion.ts';
import {createCasual,advanceCasual,applyCasualAction,publicCasual} from '../lib/casual/engine.ts';
import {roomScene,restoreRoomTerrain} from '../lib/casual/client-room.ts';
import {createCasualAPI} from '../lib/casual/api.ts';
import {createArenaAPI} from '../lib/arena-api.ts';
const wait=()=>new Promise(r=>setTimeout(r,3));
test('batched responses finish in each caller context and retain the originating work lifetime',async()=>{
 const context=new AsyncLocalStorage<string>(),db={},tasks:Promise<unknown>[]=[],read=async()=>{await wait();return{state:0,revision:0}},save=async()=>true,busy=()=>Error('busy');
 const call=(name:string)=>context.run(name,()=>roomBatch(db,'contexts',read,save,busy,task=>tasks.push(task)).run(s=>({state:s,changed:false,result:()=>context.getStore()})));
 assert.deepEqual(await Promise.all([call('first'),call('second')]),['first','second']);assert.equal(tasks.length,1);await tasks[0];
});
test('overlapping room operations share a storage read/commit and isolate an invalid action',async()=>{
 const db={},busy=()=>Error('busy');let value=0,revision=0,reads=0,writes=0;
 const read=async()=>{reads++;await wait();return{state:{value},revision}},save=async(s:{value:number},rev:number)=>{writes++;assert.equal(rev,revision);value=s.value;revision++;return true};
 const jobs=Array.from({length:8},(_,i)=>roomBatch(db,'room',read,save,busy).run((s)=>({state:{value:s.value+1},changed:true,result:(final,rev)=>({value:final.value,rev,player:i})})));
 const invalid=roomBatch(db,'room',read,save,busy).run(()=>{throw Error('invalid')});
 const outcomes=await Promise.allSettled([...jobs,invalid]);assert(outcomes.slice(0,8).every(r=>r.status==='fulfilled'));assert.equal(outcomes[8].status,'rejected');assert.equal(value,8);assert.equal(reads,1);assert.equal(writes,1);
 // An idle coordinator cannot retain a stale authority snapshot.
 value=20;revision=2;const next=await roomBatch(db,'room',read,save,busy).run(s=>({state:{value:s.value+1},changed:true,result:s=>s.value}));assert.equal(next,21);assert.equal(reads,2);
});
test('a conflicting external revision retries the full batch against the fresh state',async()=>{
 const db={};let state={value:0},revision=0,writes=0;
 const read=async()=>{await wait();return{state:{...state},revision}},save=async(s:{value:number},rev:number)=>{if(++writes===1){state={value:100};revision++;return false}assert.equal(rev,revision);state=s;revision++;return true};
 const results=await Promise.all(Array.from({length:8},()=>roomBatch(db,'conflict',read,save,()=>Error('busy')).run(s=>({state:{value:s.value+1},changed:true,result:(s,rev)=>({value:s.value,rev})}))));
 assert.equal(state.value,108);assert.equal(writes,2);assert(results.every(r=>r.value===108&&r.rev===2));
});
test('room storage errors reject queued work and do not poison a subsequent request',async()=>{
 const db={};let fail=true;const read=async()=>{await wait();if(fail)throw Error('offline');return{state:1,revision:0}},save=async()=>true,busy=()=>Error('busy');
 const first=await Promise.allSettled(Array.from({length:4},()=>roomBatch(db,'recovery',read,save,busy).run(s=>({state:s,changed:false,result:s=>s}))));assert(first.every(r=>r.status==='rejected'));
 fail=false;assert.equal(await roomBatch(db,'recovery',read,save,busy).run(s=>({state:s,changed:false,result:s=>s})),1);
});
test('idle simulation preserves game identity while actions and due deadlines remain immutable',()=>{
 const start=10000,room=createCasual('ABCDEFGH','host','Host','hash','ladders',1,start),playing=applyCasualAction(room,{action:'start'},'host',start);
 assert.equal(advanceCasual(playing,start+20).state,playing);const before=JSON.stringify(playing),next=applyCasualAction(playing,{action:'roll',round:1,turn:1},'host',start+50);assert.equal(JSON.stringify(playing),before);assert.notEqual(next,playing);
 const timed=advanceCasual(playing,(playing.game as any).deadline);assert(timed.changed);assert.equal(JSON.stringify(playing),before);
});
test('remote display extrapolation stays continuous across a missing receipt and remains bounded',()=>{
 const frames=[{at:0,pose:{x:0,y:0,angle:3.1},epoch:0},{at:100,pose:{x:10,y:0,angle:-3.1},epoch:0}],fallback={x:999,y:999};
 assert.equal(interpolatePose(frames,100,fallback).x,10);assert.equal(interpolatePose(frames,101,fallback).x,10.1);assert.equal(interpolatePose(frames,200,fallback).x,20);const old=interpolatePose(frames,10000,fallback);assert(old.x<=45&&old.x>30);assert.equal(old.y,0);
 assert.equal(interpolatePose([{...frames[0],epoch:1},frames[1]],200,fallback).x,10);
});
test('Snake scene acknowledgments restore only a matching room, map and round',()=>{
 let s=createCasual('ABCDEFGH','host','Host','hash','snake',1,10000);s=applyCasualAction(s,{action:'start'},'host',10000);const full=publicCasual(s,'host',10000),key=roomScene(full);assert(key);
 const partial={...full,game:{...full.game,obstacles:undefined}};assert.equal(restoreRoomTerrain(full,partial)!.game.obstacles,full.game.obstacles);assert.equal(restoreRoomTerrain({...full,round:2},partial),null);assert.equal(roomScene(null),undefined);
});
function apiFixture(){const sql=new DatabaseSync(':memory:');sql.exec('CREATE TABLE casual_rooms(code TEXT PRIMARY KEY,state TEXT,revision INTEGER,created_at INTEGER);CREATE TABLE arena_rooms(code TEXT PRIMARY KEY,state TEXT,revision INTEGER,created_at INTEGER)');const db:any={prepare(q:string){return{bind(...args:any[]){return{async first(){await wait();return sql.prepare(q).get(...args)},async run(){await wait();return{meta:{changes:Number(sql.prepare(q).run(...args).changes)}}}}}}}};return{sql,casual:createCasualAPI(db),arena:createArenaAPI(db)}}
let seq=0;
async function post(api:{POST:(r:Request)=>Promise<Response>},body:any,token?:string){const response=await api.POST(new Request('http://localhost/api',{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify({requestId:'perf-request-'+(++seq),...body})}));return{status:response.status,...await response.json() as any}}
test('unchanged casual polls use a small response and cannot skip a due turn deadline',async()=>{
 const {sql,casual}=apiFixture();try{const h=await post(casual,{action:'create',mode:'ladders',name:'Host'});let r=await post(casual,{action:'start',code:h.room.code},h.token);const get=async()=>{const response=await casual.GET(new Request('http://localhost/api?code='+h.room.code+'&revision='+r.room.revision,{headers:{Authorization:'Bearer '+h.token}}));return await response.json() as any};assert.equal((await get()).unchanged,true);
 const row=sql.prepare('SELECT state FROM casual_rooms WHERE code=?').get(h.room.code) as any,state=JSON.parse(row.state);state.game.deadline=Date.now()-1;sql.prepare('UPDATE casual_rooms SET state=? WHERE code=?').run(JSON.stringify(state),h.room.code);const updated=await get();assert(updated.room);assert.equal(updated.room.game.turn,2);assert(!updated.unchanged);
 }finally{sql.close()}
});
test('batched multiplayer controls retain all eight owners and reject invalid controls independently',async()=>{
 const {sql,casual}=apiFixture();try{const h=await post(casual,{action:'create',mode:'circuit',name:'Host',bots:0}),seats=[h];const guests=await Promise.all(Array.from({length:7},(_,i)=>post(casual,{action:'join',code:h.room.code,name:'Guest '+i})));seats.push(...guests);assert(guests.every(g=>g.status===200));await post(casual,{action:'start',code:h.room.code},h.token);
 const responses=await Promise.all([...seats.map((s,i)=>post(casual,{action:'drive',round:1,code:h.room.code,seq:1,throttle:1,steer:0,drift:false},s.token)),post(casual,{action:'drive',round:1,code:h.room.code,seq:2,throttle:'invalid',steer:0,drift:false},h.token)]);assert(responses.slice(0,8).every(r=>r.status===200));assert.equal(responses[8].status,400);assert(responses.slice(0,8).every((r,i)=>r.room.youId===seats[i].room.youId));assert(responses.slice(0,8).every(r=>!JSON.stringify(r).includes('tokenHash')));
 const state=JSON.parse((sql.prepare('SELECT state FROM casual_rooms WHERE code=?').get(h.room.code) as any).state);assert.equal(Object.keys(state.game.inputs).length,8);assert(Object.values(state.game.inputs).every((i:any)=>i.seq===1&&i.throttle===1));
 }finally{sql.close()}
});
test('coding-room conditional reads never suppress time-derived active game state',async()=>{
 const {sql,arena}=apiFixture();try{const h=await post(arena,{action:'create',name:'Host',mode:'survival'});const get=async(revision:number)=>{const response=await arena.GET(new Request('http://localhost/api?code='+h.room.code+'&revision='+revision,{headers:{Authorization:'Bearer '+h.token}}));return await response.json() as any};assert.equal((await get(h.room.revision)).unchanged,true);
 const active=await post(arena,{action:'start',code:h.room.code},h.token);assert.equal(active.status,200);assert((await get(active.room.revision)).room);
 }finally{sql.close()}
});
