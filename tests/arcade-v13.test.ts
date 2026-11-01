import {test} from 'node:test';
import assert from 'node:assert/strict';
import {ControlChannel} from '../lib/control-channel.ts';
import {createCasual,applyCasualAction} from '../lib/casual/engine.ts';
import {stepParty,tankWalls,TANK_RADIUS,TANK_SHELL_RADIUS,type PartyGame} from '../lib/casual/party.ts';
import {stepCircuit,trackPoints,KART_RADIUS,type CircuitGame} from '../lib/casual/circuit.ts';

function room(mode:'tanks'|'circuit'){
 let s=createCasual('ABCDEFGH','p0','Host','hash0',mode,13,10_000);
 s.settings.arcadeV2=true;
 s=applyCasualAction(s,{action:'join',id:'p1',hash:'hash1',name:'Friend'},null,10_000);
 return applyCasualAction(s,{action:'start'},'p0',10_000);
}
const flush=()=>new Promise(r=>setTimeout(r,10));

test('kart item and recovery receipts allow a fresh neutral input through the spare slot',async()=>{
 for(const action of ['use','recover']){
  let reject!:(error:Error)=>void,attempts=0;
  const sent:any[]=[],channel=new ControlChannel(packet=>{
   sent.push(packet);
   return ++attempts===1?new Promise<void>((_,r)=>reject=r):Promise.resolve();
  },()=>{},()=>0,2);
  channel.enqueue({action:'drive',round:1,seq:10,throttle:1,steer:1,[action]:true,[action+'Seq']:10});
  channel.enqueue({action:'drive',round:1,seq:11,throttle:0,steer:0});
  assert.deepEqual(sent.map(p=>p.seq),[10,11]);
  assert.equal(sent[1].throttle,0);
  assert.equal(sent[1][action],undefined);
  reject(new TypeError('Response lost after server applied the command'));
  for(let i=0;i<10&&sent.length<3;i++)await flush();
  assert.equal(sent.length,3);
  assert.equal(sent[2][action+'Seq'],10);
  channel.reset();
 }
});

test('a late retried kart command cannot overwrite newer steering or apply recovery twice',()=>{
 let s=room('circuit');
 const recovery={action:'drive',round:1,seq:10,throttle:1,steer:1,recover:true,recoverSeq:10};
 s=applyCasualAction(s,recovery,'p0',14_000);
 const recovered=(s.game as CircuitGame).drivers[0].lastRecover;
 s=applyCasualAction(s,{action:'drive',round:1,seq:11,throttle:0,steer:0},'p0',14_050);
 s=applyCasualAction(s,recovery,'p0',17_000);
 const g=s.game as CircuitGame;
 assert.equal(g.inputs.p0.seq,11);
 assert.equal(g.inputs.p0.throttle,0);
 assert.equal(g.inputs.p0.steer,0);
 assert.equal(g.drivers[0].lastRecover,recovered);
});

test('tank shells hit at their visible radius and miss beyond that radius',()=>{
 for(const inside of [true,false]){
  const g=room('tanks').game as PartyGame,target=g.actors[1];
  target.x=250;target.y=150;target.shieldUntil=0;
  g.shots=[{x:target.x-TANK_RADIUS-TANK_SHELL_RADIUS+(inside?1:-2),y:target.y,vx:10,vy:0,owner:'p0',bounces:0,until:g.startAt+1000}];
  stepParty(g,.01,g.startAt+10);
  assert.equal(target.hp,inside?2:3);
  assert.equal(g.shots.length,inside?0:1);
 }
});

test('shells ricochet off the expanded wall edge, including a muzzle already inside that edge',()=>{
 for(const offset of [10,5]){
  const g=room('tanks').game as PartyGame,wall=tankWalls(g.map,g.worldScale)[0];
  g.shots=[{x:wall.x-offset,y:wall.y+50,vx:460,vy:0,owner:'p0',bounces:0,until:g.startAt+1000}];
  stepParty(g,.01,g.startAt+10);
  assert.equal(g.shots.length,1);
  assert(g.shots[0].vx<0);
  assert.equal(g.shots[0].bounces,1);
  assert.equal(g.shots[0].bounceAt,g.startAt+10);
 }
});

test('a kart contact separates the bodies and dissipates a closing collision',()=>{
 const g=room('circuit').game as CircuitGame,[a,b]=g.drivers,p=trackPoints(g.track,192,g.worldScale)[0];
 a.x=p.x-35;a.y=p.y;a.angle=0;a.speed=100;a.vx=100;a.vy=0;
 b.x=p.x+35;b.y=p.y;b.angle=Math.PI;b.speed=100;b.vx=-100;b.vy=0;
 stepCircuit(g,['p0','p1'],.01,g.startAt+10);
 assert(Math.hypot(a.x-b.x,a.y-b.y)>=KART_RADIUS*2-.001);
 assert(Math.abs(a.speed)<80&&Math.abs(b.speed)<80);
 assert.equal(a.hitAt,g.startAt+10);
 assert.equal(b.hitAt,g.startAt+10);
 assert([a.x,a.y,a.vx,a.vy,b.x,b.y,b.vx,b.vy].every(Number.isFinite));
});
