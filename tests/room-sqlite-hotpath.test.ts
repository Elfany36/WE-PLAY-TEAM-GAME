import {test} from 'node:test';import assert from 'node:assert/strict';import {DatabaseSync} from 'node:sqlite';
import {RoomStore,type StoredRoom} from '../lib/casual/room-store.ts';
function storage(){const db=new DatabaseSync(':memory:'),kv=new Map<string,unknown>();let writes=0,fail=false;const sql={exec(query:string,...args:any[]){if(fail&&/^(INSERT|UPDATE)/.test(query))throw Error('Disk unavailable');const stmt=db.prepare(query);if(/^SELECT/.test(query)){const rows=stmt.all(...args);return{toArray:()=>rows,rowsWritten:0}}const result=stmt.run(...args);return{toArray:()=>[],rowsWritten:Number(result.changes)}}};return{db,kv,sql,fail:(next:boolean)=>{fail=next},get writes(){return writes},async get<T>(key:string){return kv.get(key) as T},async put(key:string,value:unknown){writes++;kv.set(key,structuredClone(value))},async deleteAll(){kv.clear();db.exec('DROP TABLE IF EXISTS room_runtime_v25')},async setAlarm(){}}}
const insert=(store:RoomStore,state='{}')=>store.prepare('INSERT INTO casual_rooms(code,state,revision,created_at) VALUES(?,?,0,?)').bind('ABCDEFGH',state,10000).run();
const update=(store:RoomStore,state:string,revision:number)=>store.prepare('UPDATE casual_rooms SET state=?, revision=revision+1 WHERE code=? AND revision=?').bind(state,'ABCDEFGH',revision).run();
test('SQLite room state migrates the existing KV row and survives another authority instance',async()=>{
 const st=storage();try{const old:StoredRoom={code:'ABCDEFGH',state:'{"round":4}',revision:99,created_at:10000};st.kv.set('row',old);const first=new RoomStore(st as any);await first.load();assert.deepEqual(first.snapshot(),old);assert.equal(st.writes,0);
  assert.equal((await update(first,'{"round":5}',99)).meta.changes,1);const second=new RoomStore(st as any);await second.load();assert.equal(second.snapshot()?.revision,100);assert.equal(second.snapshot()?.state,'{"round":5}');assert.equal(st.writes,0);assert.deepEqual(st.kv.get('row'),old);
 }finally{st.db.close()}
});
test('live SQLite updates avoid KV writes, preserve CAS, and never publish a failed commit',async()=>{
 const st=storage();try{const store=new RoomStore(st as any);await store.load();await insert(store);for(let revision=0;revision<120;revision++)assert.equal((await update(store,JSON.stringify({tick:revision+1}),revision)).meta.changes,1);assert.equal(st.writes,0);assert.equal(store.snapshot()?.revision,120);
  assert.equal((await update(store,'stale',0)).meta.changes,0);const prior=store.snapshot();st.fail(true);await assert.rejects(update(store,'failed',120),/Disk unavailable/);assert.deepEqual(store.snapshot(),prior);st.fail(false);assert.equal((await update(store,'{"tick":121}',120)).meta.changes,1);
 }finally{st.db.close()}
});
test('expiry removes SQL and avatar state, and schema is recreated before another insert',async()=>{
 const st=storage();try{const store=new RoomStore(st as any);await store.load();await insert(store);await store.putAvatar('p',{hash:'one',data:'portrait'});await store.expire(10000+86400001);assert.equal(store.snapshot(),null);assert.equal(st.kv.size,0);await insert(store,'{"fresh":true}');assert.equal(store.snapshot()?.state,'{"fresh":true}');assert.equal(store.snapshot()?.revision,0)}finally{st.db.close()}
});
