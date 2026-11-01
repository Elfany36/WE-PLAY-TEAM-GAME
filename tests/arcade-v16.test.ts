import {test} from 'node:test';
import assert from 'node:assert/strict';
import {SnakePresentation,snakeTrailAt} from '../lib/casual/snake-presentation.ts';
import {snakeTurnTick} from '../lib/casual/snake-motion.ts';
import {RoomTransport} from '../lib/room-transport.ts';
import type {RoomRevisionFeed} from '../lib/room-revisions.ts';
import {createCasual,applyCasualAction,advanceCasual} from '../lib/casual/engine.ts';
import type {PartyGame} from '../lib/casual/party.ts';
import {stepParty,clubTrack,distanceToClubTrack} from '../lib/casual/party.ts';
import {glacierGust} from '../lib/casual/arena-events.ts';
import {stepCircuit,type CircuitGame} from '../lib/casual/circuit.ts';
import {BASE_ONLINE_CONTENT,readOnlineContent,onlineContentAvailable} from '../lib/casual/online-content.ts';

test('Snake display travels through a late full-cell correction rather than snapping',()=>{
 const presentation=new SnakePresentation(),body=[{x:4,y:5},{x:3,y:5},{x:2,y:5},{x:1,y:5}];
 let previous={...presentation.sample('p',body,body,16,175,'round1')[0]};
 for(let i=0;i<30;i++){
  const head=5+i*16/175,path=[{x:head,y:5},{x:4,y:5},{x:3,y:5},{x:2,y:5},{x:1,y:5}];
  const points=presentation.sample('p',path.slice(0,4),path,16,175,'round1');
  assert(points[0].x>=previous.x);assert(points[0].x-previous.x<=16/175*1.8+.0001);
  assert(points.every(p=>p.y===5));previous={...points[0]};
 }
 assert(previous.x>7);
});

test('Snake presentation follows the corner and preserves body spacing without diagonal wall cuts',()=>{
 const p=new SnakePresentation(),body=[{x:3,y:2},{x:2,y:2},{x:1,y:2},{x:0,y:2}];p.sample('p',body,body,16,175,'a');let previous={...body[0]};
 for(let frame=1;frame<=35;frame++){
  const y=2+Math.min(3,frame*16/175),path=[{x:3,y},{x:3,y:2},{x:2,y:2},{x:1,y:2},{x:0,y:2}],out=p.sample('p',path.slice(0,4),path,16,175,'a');
  assert(Math.hypot(out[0].x-previous.x,out[0].y-previous.y)<=16/175*1.8+.0001);
  for(const point of out)assert(point.x===3||point.y===2);
  for(let i=1;i<out.length;i++)assert(Math.hypot(out[i].x-out[i-1].x,out[i].y-out[i-1].y)<=1.00001);
  previous={...out[0]};
 }
});

test('an older Snake head is held without a backwards jump; a respawn resets presentation immediately',()=>{
 const p=new SnakePresentation(),body=[{x:4,y:5},{x:3,y:5},{x:2,y:5}];p.sample('p',body,body,16,175,'a');
 const older=[{x:3.7,y:5},{x:3,y:5},{x:2,y:5}];assert.equal(p.sample('p',older,older,16,175,'a')[0].x,4);
 const fresh=[{x:20,y:20},{x:19,y:20},{x:18,y:20}];assert.equal(p.sample('p',fresh,fresh,16,175,'respawn')[0].x,20);
});

test('remote Snake trails start at the interpolated point, not a newer future head',()=>{
 const recorded=[{x:5,y:3},{x:5,y:2},{x:4,y:2},{x:3,y:2}],head={x:4.5,y:2};
 assert.deepEqual(snakeTrailAt(head,recorded,[head,{x:4,y:2}]),[head,{x:4,y:2},{x:3,y:2}]);
});

test('online Snake turns allow for snapshot transit and input delivery at the same server boundary',()=>{
 const g={tick:10,lastTickAt:1000},tick=snakeTurnTick(g,1070,175,30,400);
 assert.equal(tick,14);assert.equal(snakeTurnTick(g,1070,175,30,400,tick),tick+1);
 assert.equal(snakeTurnTick(g,1000,175,0,0),11);
});

test('a stale world GET can bypass a responsive socket while mutations retain that socket',async()=>{
 const oldFetch=globalThis.fetch,t=new RoomTransport();let http=0,live=0;
 t.attachLive({streaming:true,request:()=>{live++;return Promise.resolve(Response.json({ack:'live'}))}} as unknown as RoomRevisionFeed);
 globalThis.fetch=async()=>{http++;return Response.json({room:{code:'ABCDEFGH',revision:3,serverNow:10},snapshotId:'fresh'})};
 try{await t.send('https://example.test/api/casual',{},{forceHttp:true});assert.equal(http,1);assert.equal(live,0);await t.send('https://example.test/api/casual',{method:'POST',body:'{"action":"ready"}'},{forceHttp:true});assert.equal(live,1);assert.equal(http,1)}finally{t.reset();globalThis.fetch=oldFetch}
});

test('Sumo AI duels resolve by ring-out and continue across rounds with varied champions',()=>{
 const winners=new Set<string>();
 for(let seed=1;seed<=12;seed++){
  let s=createCasual('ABCDEFGH','human','Host','hash','sumo',seed,10000);
  s=applyCasualAction(s,{action:'configure',mode:'sumo',cards:20,speed:175,bots:7,arcadeV2:true,sumoFormat:'bracket'},'human',10000);
  s=applyCasualAction(s,{action:'start'},'human',10000);s.players[0].bot=true;
  for(let now=10250;s.phase==='playing'&&now<100000;now+=250)s=advanceCasual(s,now).state;
  const g=s.game as PartyGame;assert.equal(s.phase,'finished');assert.equal(g.bracket?.history.length,3);assert.equal(s.result?.winnerIds.length,1);assert(g.actors.some(a=>a.deaths>0));
  assert(g.bracket!.history.every(round=>round.bouts.every(b=>!b.tieBreak)));winners.add(g.bracket!.champion!);
 }
 assert(winners.size>=4);
});

test('Crystal Rink wind is tick-based, signaled, bounded and shared by prediction',()=>{
 let s=createCasual('ABCDEFGH','p0','Player','hash','marble',18,10000);
 s=applyCasualAction(s,{action:'configure',mode:'marble',cards:20,speed:175,bots:1,arcadeV2:true,arena:'glacier'},'p0',10000);
 s=applyCasualAction(s,{action:'start'},'p0',10000);const g=s.game as PartyGame;
 for(const point of clubTrack('glacier',32))assert(distanceToClubTrack('glacier',point.x,point.y)<.001);
 g.tick=319;assert(!glacierGust(g).active);g.tick=320;assert(glacierGust(g).active);assert.equal(glacierGust(g).remaining,4);
 const first=g.actors[0],p=clubTrack('glacier')[0];Object.assign(first,{x:p.x,y:p.y,vx:0,vy:0,shieldUntil:100000});
 const predicted=structuredClone(g);stepParty(g,.05,g.startAt+16000);stepParty(predicted,.05,predicted.startAt+16000,false);
 assert(first.vx>0&&first.vx<2);assert(Math.abs(first.vx-predicted.actors[0].vx)<.00001);assert.equal(first.x,predicted.actors[0].x);
 g.tick=720;assert.equal(glacierGust(g).direction,-1);const before=glacierGust(g);assert.deepEqual(glacierGust(g),before);
});

test('Solar Speedway can be completed by ordinary bot controls with finite collision positions',()=>{
 let s=createCasual('ABCDEFGH','p0','Player','hash','circuit',31,10000);
 s=applyCasualAction(s,{action:'configure',mode:'circuit',cards:20,speed:175,bots:1,track:'cinder',arcadeV2:true},'p0',10000);
 s=applyCasualAction(s,{action:'start'},'p0',10000);const g=s.game as CircuitGame;g.drivers.forEach(d=>d.bot=true);
 for(let i=0;i<2500&&!g.drivers.every(d=>d.lap>0);i++)stepCircuit(g,g.drivers.map(d=>d.id),.05,g.startAt+i*50);
 assert(g.drivers.every(d=>d.lap>0));assert(g.drivers.every(d=>[d.x,d.y,d.angle,d.speed].every(Number.isFinite)));
});

test('a newer frontend preserves online choices when the room server is still an older release',()=>{
 const settings={cards:20,speed:175,arena:'glacier' as const,scene:'cherry' as const,track:'cinder',map:'sunspire' as const};
 assert.equal(readOnlineContent({version:17}),BASE_ONLINE_CONTENT);
 for(const mode of ['tanks','circuit','snake','uno'])assert(!onlineContentAvailable(mode,settings,BASE_ONLINE_CONTENT));
 const current=readOnlineContent({content:{maps:['classic','sunspire'],arenas:['garden','glacier'],tracks:['meadow','cinder'],scenes:['garden','cherry']}});
 for(const mode of ['tanks','circuit','snake','uno','terra'])assert(onlineContentAvailable(mode,settings,current));
 assert.equal(readOnlineContent({content:{maps:['<script>']}}),BASE_ONLINE_CONTENT);
});

test('long Snake bodies reuse their traveled path without mutating authoritative points',()=>{
 const body=[{x:10,y:10}];for(let x=9;x>=0;x--)body.push({x,y:10});for(let y=11;body.length<200;y++)for(let i=0;i<32&&body.length<200;i++)body.push({x:y%2?i:31-i,y});
 const original=JSON.stringify(body),p=new SnakePresentation();p.sample('long',body,body,16,175,'a');
 for(let i=1;i<=100;i++){const path=[{x:10+i*.1,y:10},...body],out=p.sample('long',body,path,16,175,'a');assert.equal(out.length,200);assert(out.every(point=>Number.isFinite(point.x)&&Number.isFinite(point.y)));assert(out.slice(1).every((point,j)=>Math.hypot(point.x-out[j].x,point.y-out[j].y)<=1.00001))}
 assert.equal(JSON.stringify(body),original);
});
