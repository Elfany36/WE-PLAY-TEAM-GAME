import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createCasual,applyCasualAction,advanceCasual,publicCasual,type CasualMode,type SnakeGame} from '../lib/casual/engine.ts';
import type {CircuitGame} from '../lib/casual/circuit.ts';
import type {TerraGame} from '../lib/casual/terra.ts';
import type {PartyGame} from '../lib/casual/party.ts';
import {casualLeaderboard} from '../lib/casual/leaderboard.ts';
import {cleanRoomText} from '../lib/room-text.ts';
function start(mode:CasualMode){let s=createCasual('ABCDEFGH','p0','Host','h0',mode,83,10000);s=applyCasualAction(s,{action:'join',id:'p1',name:'Friend',hash:'h1'},null,10000);return applyCasualAction(s,{action:'start'},'p0',10000);}
test('Snake battle compares eliminations before any amount of growth, in the result and roster',()=>{
 const s=start('snake');s.settings.battle=true;const g=s.game as SnakeGame;
 Object.assign(g.worms[0],{kills:2,best:1});Object.assign(g.worms[1],{kills:1,best:200});g.lastTickAt=g.deadline;
 const result=advanceCasual(s,g.deadline).state;
 assert.deepEqual(result.result!.winnerIds,['p0']);assert.equal(casualLeaderboard(publicCasual(result,'p0',g.deadline))[0].id,'p0');
});
test('Kart pause preserves effects, item lifetimes and elapsed lap time while releasing held input',()=>{
 let s=start('circuit'),g=s.game as CircuitGame;s.phase='paused';g.lastTickAt=g.pausedAt=15000;
 Object.assign(g.drivers[0],{boostUntil:16500,shieldUntil:18000,stunnedUntil:15400,lastRecover:14500,lapStartedAt:13000});
 g.inputs.p0={throttle:1,steer:1,drift:true,seq:1,at:15000};g.boxes[0].readyAt=16000;g.hazards=[{id:1,x:10,y:10,owner:'p0',until:19000}];
 s=applyCasualAction(s,{action:'resume'},'p0',20000);g=s.game as CircuitGame;
 assert.equal(g.drivers[0].boostUntil-g.startAt,1500);assert.equal(g.drivers[0].shieldUntil-g.startAt,3000);assert.equal(g.drivers[0].stunnedUntil-g.startAt,400);
 assert.equal(g.startAt-g.drivers[0].lapStartedAt!,2000);assert.equal(g.startAt-g.raceStartedAt!,2000);assert.equal(g.startAt-g.drivers[0].lastRecover,500);
 assert.equal(g.boxes[0].readyAt-g.startAt,1000);assert.equal(g.hazards[0].until-g.startAt,4000);assert.deepEqual(g.inputs,{});assert.equal(g.drivers[1].boostUntil,0);
});
test('Snake and Terra respawn/protection timers retain their remaining time across a pause',()=>{
 for(const mode of ['snake','terra'] as const){let s=start(mode);s.phase='paused';const g=s.game as SnakeGame|TerraGame;g.lastTickAt=g.pausedAt=15000;
  if(g.kind==='snake'){g.worms[0].respawnAt=16500;g.worms[0].protectedUntil=18000;g.worms[0].queue=['up'];}else{g.explorers[0].deadUntil=16500;g.explorers[0].hurtUntil=18000;g.explorers[0].lastDamage=14500;}
  s=applyCasualAction(s,{action:'resume'},'p0',20000);const next=s.game as SnakeGame|TerraGame;
  if(next.kind==='snake'){assert.equal(next.worms[0].respawnAt!-next.startAt,1500);assert.equal(next.worms[0].protectedUntil!-next.startAt,3000);assert.deepEqual(next.worms[0].queue,[]);}else{assert.equal(next.explorers[0].deadUntil-next.startAt,1500);assert.equal(next.explorers[0].hurtUntil-next.startAt,3000);assert.equal(next.startAt-next.explorers[0].lastDamage,500);}
 }
});
test('Party pause retains respawns, serve delays and cosmetic epochs without replaying input',()=>{
 let s=start('tanks'),g=s.game as PartyGame;s.phase='paused';g.lastTickAt=g.pausedAt=15000;
 Object.assign(g.actors[0],{cooldown:15400,respawnAt:16500,spawnedAt:14000});g.ball.serveAt=16000;
 g.inputs.p0={seq:1,at:15000,dx:1,dy:0,aim:0,fire:true,dash:true,brake:false};
 s=applyCasualAction(s,{action:'resume'},'p0',20000);g=s.game as PartyGame;
 assert.equal(g.actors[0].cooldown-g.startAt,400);assert.equal(g.actors[0].respawnAt-g.startAt,1500);assert.equal(g.startAt-g.actors[0].spawnedAt!,1000);assert.equal(g.ball.serveAt-g.startAt,1000);assert.deepEqual(g.inputs,{});
});
test('new game rosters reflect authoritative progress instead of the order players joined',()=>{
 for(const mode of ['tanks','pong','marble','blocks','pool','circuit'] as const){const s=start(mode),g=s.game as any;
  if(g.actors)g.actors[1].score=5;else if(g.boards)g.boards[1].score=500;else if(g.drivers)g.drivers[1].lap=1;else g.scores.p1=3;
  assert.equal(casualLeaderboard(publicCasual(s,'p0',13000))[0].id,'p1',mode);
 }
});
test('room text preserves international names and emoji while removing hidden control overrides',()=>{
 assert.equal(cleanRoomText('  José\u202E\u0000 👋\n友達  '),'José 👋 友達');
});
