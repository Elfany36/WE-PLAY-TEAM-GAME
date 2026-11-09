import test from 'node:test';
import assert from 'node:assert/strict';
import {clampGamePanel} from '../lib/game-window.ts';
import {roomSnapshot} from '../lib/room-snapshots.ts';
import {applyRoomDelta} from '../lib/room-delta.ts';
import {createCasual,applyCasualAction} from '../lib/casual/engine.ts';
import {continuousRoom,roomFanoutScene} from '../lib/casual/fanout-timing.ts';
import {RoomTransport} from '../lib/room-transport.ts';
import {piratePixelRatio,PirateAutoQuality} from '../lib/casual/pirate-display.ts';
const N=1800000000000;
test('floating game windows keep their complete controls reachable after drag, resize and rotation',()=>{
 for(const [width,height]of [[320,844],[390,844],[844,390],[1440,900],[2560,1440]])for(const box of [{x:-1000,y:-500,width:9999,height:9999},{x:9000,y:9000,width:260,height:240},{x:20,y:70,width:NaN,height:Infinity}]){
  const b=clampGamePanel(box,width,height);assert(b.x>=8&&b.y>=64);assert(b.width>=220&&b.height>=160);assert(b.x+b.width<=width-8);assert(b.y+b.height<=height-8);assert(Object.values(b).every(Number.isFinite));
 }
});
test('Pirate Auto bounds raster pixels on dense portrait and fullscreen displays; High preserves detail',()=>{
 for(const [width,height,dpr]of [[390,844,3],[1440,1000,1],[2560,1440,2]]){
  const ratio=piratePixelRatio(width,height,dpr,'auto'),w=Math.max(260,Math.min(1440,width)),h=w*height/width;
  assert(w*h*ratio*ratio<=600_001);assert(ratio>0);assert.equal(piratePixelRatio(width,height,dpr,'high'),Math.min(2,dpr));
  assert(w*h*piratePixelRatio(width,height,dpr,'low')**2<=400_001);
  // Scaling both axes equally keeps canvas-to-world pointer coordinates unchanged.
  assert(Math.abs((w*ratio)/(h*ratio)-width/height)<.000001);
 }
});
test('Pirate Auto reduces sustained slow raster load, recovers detail and ignores hidden-tab gaps',()=>{
 const quality=new PirateAutoQuality();let now=0,changes=0;
 for(let n=0;n<240;n++){now+=33.4;if(quality.observe(33.4,now))changes++}
 assert(quality.pixels<600_000&&quality.pixels>=250_000);assert(changes>=2&&changes<=4);
 const low=quality.pixels;assert(!quality.observe(9000,now+9000));assert.equal(quality.pixels,low);
 for(let n=0;n<600;n++){now+=16.7;quality.observe(16.7,now)}
 assert(quality.pixels>low&&quality.pixels<=2_000_000);
});
const request=(base?:string)=>new Request('https://example.test/api/casual?wire=1'+(base?'&base='+base:''));
const unpack=(a:any,b:any)=>b.room||applyRoomDelta(a.room,b.patch);
test('same-version terrain shares immutable snapshot data while entities still advance',()=>{
 const before={code:'STATIC32',youId:'one',round:1,mode:'terra',revision:1,game:{kind:'terra',version:0,width:100,height:100,tiles:Array(10000).fill(1),explorers:[{x:1.12345,y:2}]}};
 const a=roomSnapshot(request(),{room:before}),after=structuredClone(before);after.revision=2;after.game.explorers[0].x=9.98765;
 const b=roomSnapshot(request(a.snapshotId),{room:after}),merged=unpack(a,b);assert.equal(merged.game.explorers[0].x,9.988);assert.deepEqual(merged.game.tiles,before.game.tiles);assert(b.patch);assert.equal(merged.game.tiles,a.room.game.tiles);assert.equal(before.game.explorers[0].x,1.12345);
});
test('terrain edits and new rounds send the new world and never reuse another seat’s private base',()=>{
 const before={code:'STATIC33',youId:'one',round:1,mode:'terra',revision:1,game:{kind:'terra',version:0,width:20,height:20,tiles:Array(400).fill(1),secret:'own'}};
 const a=roomSnapshot(request(),{room:before});
 for(const extra of [{version:1},{version:0,round:2},{version:0,youId:'two'}]){
  const after=structuredClone(before);after.revision++;after.game.version=extra.version;after.game.tiles[29]=7;after.game.secret='changed';if('round'in extra)after.round=extra.round!;if('youId'in extra)after.youId=extra.youId!;
  const b=roomSnapshot(request(a.snapshotId),{room:after}),merged=unpack(a,b);assert.equal(merged.game.tiles[29],7);assert.equal(a.room.game.tiles[29],1);if(after.youId!=='one')assert(!b.patch);
 }
});
test('Snake map changes cannot inherit an obstacle grid from another map or size',()=>{
 const before={code:'STATIC34',youId:'one',round:1,mode:'snake',game:{kind:'snake',mapId:'classic',size:48,obstacles:[{x:4,y:5}],tick:1}};
 const a=roomSnapshot(request(),{room:before}),after=structuredClone(before);after.game.tick=2;const b=roomSnapshot(request(a.snapshotId),{room:after});assert.equal(unpack(a,b).game.obstacles,a.room.game.obstacles);
 for(const [mapId,size]of [['ruins',48],['classic',64]] as const){after.game.mapId=mapId;after.game.size=size;after.game.obstacles=[{x:17,y:23}];const c=roomSnapshot(request(a.snapshotId),{room:after});assert.deepEqual(unpack(a,c).game.obstacles,[{x:17,y:23}])}
});
test('fanout follows committed physics only during active continuous play; transitions change its scene',()=>{
 let s=createCasual('ABCDEFGH','host','Host','h','pirate',1,N);s.settings.bots=1;s=applyCasualAction(s,{action:'start'},'host',N);assert(!continuousRoom(s,N+1000));assert(continuousRoom(s,N+4000));const scene=roomFanoutScene(s);
 s=applyCasualAction(s,{action:'pause'},'host',N+5000);assert(!continuousRoom(s,N+6000));assert.notEqual(roomFanoutScene(s),scene);s=applyCasualAction(s,{action:'resume'},'host',N+8000);assert.notEqual(roomFanoutScene(s),scene);assert(!continuousRoom(s,N+8000));
 const board=createCasual('HGFEDCBA','host','Host','h','ladders',1,N);assert(!continuousRoom(board,N+4000));
});
test('Pirate control receipts populate latency telemetry through the normal transport path',async()=>{
 const original=globalThis.fetch;globalThis.fetch=async()=>{await new Promise(resolve=>setTimeout(resolve,12));return Response.json({ack:'one',serverNow:N,clock:{receivedAt:N,sentAt:N}})};
 try{const t=new RoomTransport();await t.send('https://example.test/api/casual',{method:'POST',body:JSON.stringify({action:'pirate-input',requestId:'latency-32'})});assert(t.stats.inputReceiptMs>=10);assert.equal(t.stats.inputReceiptMs,t.stats.totalRtt)}finally{globalThis.fetch=original}
});
