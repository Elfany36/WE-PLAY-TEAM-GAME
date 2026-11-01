import {test} from 'node:test';
import assert from 'node:assert/strict';
import {RoomTransport} from '../lib/room-transport.ts';
import {stateWindow} from '../lib/room-stream.ts';

test('delayed actions retain their exact private base while newer stream frames arrive',async()=>{
 const saved=globalThis.fetch,t=new RoomTransport(),base={code:'ABCDEFGH',youId:'p0',revision:1,serverNow:100,game:{x:1}},init={snapshotId:'base-1',room:base};t.receive(init);let reply!:(r:Response)=>void;
 globalThis.fetch=async(_url,options)=>{assert.equal(new Headers(options?.headers).get('X-Room-Base'),'base-1');return new Promise(resolve=>reply=resolve)};
 try{const pending=t.send('https://example.test/api/casual',{method:'POST',body:'{"action":"ready"}'});for(let i=2;i<=100;i++)t.receive({snapshotId:'stream-'+i,room:{...base,revision:i,serverNow:100+i,game:{x:i}}});reply(Response.json({snapshotId:'response-1',baseSnapshot:'base-1',patch:[1,{revision:[0,101],game:[1,{x:[0,101]}]}]}));const result=await pending;assert.equal(result.room.game.x,101);assert.equal(result.room.youId,'p0')}finally{globalThis.fetch=saved;t.reset()}
});

test('acknowledgement windows cover 3–5 second round trips without an unbounded queue',()=>{
 for(const rtt of [100,400,900,3000,5000]){const window=stateWindow(rtt);assert(window>=4&&window<=64);assert(window*100>=Math.min(rtt+200,6400))}assert.equal(stateWindow(NaN),4);assert.equal(stateWindow(Infinity),4);
});
