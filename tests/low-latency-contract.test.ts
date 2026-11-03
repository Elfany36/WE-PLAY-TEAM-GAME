import {test} from 'node:test';import assert from 'node:assert/strict';
import {STATE_INTERVAL,stateWindow,roomStreamRequest} from '../lib/room-stream.ts';
import {RoomTransport} from '../lib/room-transport.ts';
import {SnapshotPlaybackClock} from '../lib/snapshot-playback.ts';
test('live world cadence covers normal and delayed links without an extra 100ms-only playback buffer',()=>{
 assert.equal(STATE_INTERVAL,50);for(const rtt of [60,90,400,1400])assert(stateWindow(rtt)*STATE_INTERVAL>=rtt);
 const fast=new SnapshotPlaybackClock(),legacy=new SnapshotPlaybackClock();fast.sample(1000,0,50);legacy.sample(1000,0,100);assert.equal(fast.read(0,50),937.5);assert.equal(legacy.read(0,100),875);
});
test('the advertised world interval survives receipts and HTTP fallback, then resets with the session',async()=>{
 const transport=new RoomTransport(),room={code:'ABCDEFGH',youId:'p',mode:'sumo',phase:'playing',round:1,revision:1,serverNow:1000,game:{startAt:500,lastTickAt:980}};
 let result=transport.receive({snapshotId:'interval-base',room,clock:{receivedAt:1000,sentAt:1000,stateInterval:50}});assert.equal(result.room.network.snapshotInterval,50);assert.equal(transport.stats.simulationLag,20);
 const original=globalThis.fetch;globalThis.fetch=async()=>Response.json({room:{...room,revision:2,serverNow:1050},snapshotId:'http-interval',clock:{receivedAt:1050,sentAt:1050}});
 try{result=await transport.send('https://example.com/api/casual');assert.equal(result.room.network.snapshotInterval,50)}finally{globalThis.fetch=original}
 transport.reset();result=transport.receive({room,clock:{receivedAt:1000,sentAt:1000}});assert.equal(result.room.network.snapshotInterval,100);assert.equal(transport.stats.inputReceiptMs,0);
});
test('mining movement uses compact authenticated receipts; crafting stays on the full action path',()=>{
 const input={id:'1',method:'POST',receiptOnly:true,body:{code:'ABCDEFGH',action:'explore',round:1,seq:1,left:true,right:false,jump:false,use:false,tx:1,ty:1,slot:0}};
 assert.equal(roomStreamRequest(input,'ABCDEFGH','casual').headers.get('X-Room-Control-Receipt'),'1');
 assert.equal(roomStreamRequest({...input,body:{...input.body,action:'craft-terra'}},'ABCDEFGH','casual').headers.get('X-Room-Control-Receipt'),null);
});
