import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createCasual,applyCasualAction} from '../lib/casual/engine.ts';
import {stepCircuit,recoverKart,type CircuitGame} from '../lib/casual/circuit.ts';
import {treadPhase} from '../lib/casual/visual-motion.ts';
import {stepParty,type PartyGame} from '../lib/casual/party.ts';

function race(){
 const s=createCasual('ABCDEFGH','human','Driver','hash','circuit',42,10000);s.settings.arcadeV2=true;
 return applyCasualAction(s,{action:'start'},'human',10000).game as CircuitGame;
}
test('expired kart projectiles and oil cannot hit a driver on their final tick',()=>{
 for(const expired of [true,false])for(const kind of ['shot','oil']){
  const g=race(),d=g.drivers[0],now=g.startAt+1000;d.shieldUntil=now;
  const effect={id:1,x:d.x,y:d.y,owner:'opponent',until:now+(expired?0:1000)};
  if(kind==='shot')g.shots=[{...effect,vx:0,vy:0}];else g.hazards=[effect];
  stepCircuit(g,[d.id],.05,now);
  assert.equal(d.stunnedUntil>now,!expired);assert.equal(d.hitAt===now,!expired);
  assert.equal(g.shots.length+g.hazards.length,0);
 }
});
test('recovering a kart clears stored drift charge so a stationary release cannot award turbo',()=>{
 const g=race(),d=g.drivers[0],now=g.startAt+3000;d.drifting=2;d.lastDrift=true;d.steering=1;
 assert(recoverKart(g,d,now));assert.equal(d.drifting,0);assert.equal(d.steering,0);
 stepCircuit(g,[d.id],.05,now+50);assert.equal(d.boostUntil,0);
});
test('treads travel the same distance at 30 and 120 FPS, reverse direction and stop at rest',()=>{
 const integrate=(hz:number)=>{let phase=0;for(let i=0;i<hz;i++)phase=treadPhase(phase,100,1000/hz);return phase};
 assert(Math.abs(integrate(30)-integrate(120))<.00001);
 assert.equal(treadPhase(4,0,16),4);assert.equal(treadPhase(4,-100,10),3);assert.equal(treadPhase(0,-100,10),6);
});

test('Marble jumping remains available after two jumps; only Sumo spends stamina',()=>{
 const s=createCasual('ABCDEFGH','human','Jumper','hash','marble',42,10000);s.settings.arcadeV2=true;s.settings.bots=0;
 const g=applyCasualAction(s,{action:'start'},'human',10000).game as PartyGame,a=g.actors[0];let jumps=0;
 for(let i=1;i<=240;i++){
  const now=g.startAt+i*50,grounded=a.z===0;
  g.inputs[a.id]={seq:i,at:now,dx:0,dy:0,aim:0,fire:false,dash:true,brake:false};g.lastTickAt=now;
  stepParty(g,.05,now);if(grounded&&a.z>0)jumps++;
 }
 assert(a.alive);assert(jumps>=8,'jump must recover throughout the match');
});
