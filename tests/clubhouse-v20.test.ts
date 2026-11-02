import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createCasual,applyCasualAction,publicCasual,type CasualMode} from '../lib/casual/engine.ts';
import {arenaSupply,collectFoundrySupply} from '../lib/casual/arena-events.ts';
import {CLUB_MAPS,tankWalls,TANK_RADIUS,type PartyGame} from '../lib/casual/party.ts';
import {raceEvent,collectRaceEvent} from '../lib/casual/race-events.ts';
import {TRACKS,distanceToTrack,type CircuitGame} from '../lib/casual/circuit.ts';
import {PoolRoll,poolCuePose,poolAim} from '../lib/casual/pool-visuals.ts';
import {poolBallRadius,type PoolGame} from '../lib/casual/pool.ts';
import {matchStat} from '../lib/casual/match-stats.ts';
import {resumeTimeline} from '../lib/casual/pause.ts';
function start(mode:CasualMode){const s=createCasual('ABCDEFGH','human','Player','hash',mode,29,10000);s.settings.bots=1;s.settings.arcadeV2=true;return applyCasualAction(s,{action:'start'},'human',10000)}

test('each tank map has clear, alternating supply locations and bounded rewards once per cycle',()=>{
 for(const map of CLUB_MAPS){const g=start('tanks').game as PartyGame;g.map=map.id;const a=g.actors[0],scale=g.worldScale||1;g.tick=320;
  const event=arenaSupply(g);assert(event.enabled&&event.open);
  for(const p of event.pads){const x=p.x*scale,y=p.y*scale;for(const w of tankWalls(map.id,scale))assert(Math.hypot(x-Math.max(w.x,Math.min(x,w.x+w.w)),y-Math.max(w.y,Math.min(y,w.y+w.h)))>=TANK_RADIUS,map.id)}
  a.x=event.pads[0].x*scale;a.y=event.pads[0].y*scale;a.hp=1;a.ammo=0;a.armor=0;
  assert(collectFoundrySupply(g,a,30000));const rewarded=structuredClone(a);assert(!collectFoundrySupply(g,a,30050));assert.deepEqual(a,rewarded);assert(a.hp<=3&&(a.ammo||0)<=5&&(a.armor||0)<=2);assert(a.hp>1||(a.ammo||0)>0||(a.armor||0)>0);
  g.tick=720;if(map.id!=='foundry')assert.notDeepEqual(arenaSupply(g).pads,event.pads);
 }
});
test('older tank rooms retain Foundry supplies without acquiring unsupported map events',()=>{
 const g=start('tanks').game as PartyGame;delete g.mapEvents;g.tick=320;
 for(const map of CLUB_MAPS){g.map=map.id;assert.equal(arenaSupply(g).enabled,map.id==='foundry')}
});
test('race gates are on the road, rotate each cycle and award one bounded boost per driver',()=>{
 for(const track of TRACKS){const g=start('circuit').game as CircuitGame;g.track=track.id;g.tick=280;
  const e=raceEvent(g)!;assert(e.open);assert(distanceToTrack(g.track,e.x,e.y,g.worldScale)<1);
  const d=g.drivers[0];d.x=e.x;d.y=e.y;assert(collectRaceEvent(g,d,30000));assert.equal(d.boostUntil,31400);assert(!collectRaceEvent(g,d,30050));
  g.tick+=480;const next=raceEvent(g)!;assert(next.open);assert(Math.hypot(e.x-next.x,e.y-next.y)>100);
  delete g.mapEvents;assert.equal(raceEvent(g),null);assert(!collectRaceEvent(g,d,30000));
 }
});
test('map event schedules survive a pause without consuming their open window',()=>{
 const g=start('circuit').game as CircuitGame;g.tick=290;g.lastTickAt=g.startAt+14500;g.pausedAt=g.lastTickAt;const before=raceEvent(g);g.drivers[0].gateAt=g.lastTickAt-100;const offset=g.drivers[0].gateAt-g.lastTickAt;
 resumeTimeline(g,g.lastTickAt+100000);assert.deepEqual(raceEvent(g),before);assert.equal(g.drivers[0].gateAt!-g.lastTickAt,offset);
});
test('pool roll advances by distance at every frame rate, freezes at rest and resets placements',()=>{
 const end=(hz:number)=>{const roll=new PoolRoll();roll.sample(1,0,0,20);for(let i=1;i<=hz;i++)roll.sample(1,i*120/hz,0,20);return roll.sample(1,120,0,20).phase};assert(Math.abs(end(30)-end(120))<.00001);
 const roll=new PoolRoll();roll.sample(1,0,0,20);const moving={...roll.sample(1,20,0,20)};assert.equal(roll.sample(1,20,0,20).phase,moving.phase);assert.equal(roll.sample(1,600,0,20).phase,0);roll.forget(1);assert.equal(roll.sample(1,0,0,20).phase,0);
});
test('pool aim ghosts remain within the cushions and stop at the nearest object ball',()=>{
 const g=start('pool').game as PoolGame,r=poolBallRadius(g);for(let angle=-Math.PI;angle<Math.PI;angle+=.05){const p=poolAim(g,angle);assert(p.x>=50+r-.001&&p.x<=950-r+.001&&p.y>=50+r-.001&&p.y<=510-r+.001)}
 const target=poolAim(g,0);assert.equal(target.target,1);assert(Math.abs(target.x-(g.balls[1].x-r*2))<.001);
 assert.equal(poolCuePose(0,.7,r).offset,r);assert(poolCuePose(70,.7,r).offset<r);assert(poolCuePose(239,.7,r).opacity<.02);
});
test('match boards expose finite public standings in every game and no hidden UNO faces',()=>{
 for(const mode of ['snake','memory','uno','ladders','chess','dama','scidama','pool','property','blocks','tanks','sumo','marble','pong','circuit','phone'] as CasualMode[]){const s=start(mode),room=publicCasual(s,'human',10000);for(const p of room.players){const stat=matchStat(room,p.id);assert(!/undefined|NaN|Infinity/.test(JSON.stringify(stat)),mode);if(stat.progress!==undefined)assert(stat.progress>=0&&stat.progress<=1)}if(mode==='uno'){const opponent=room.players.find(p=>p.id!=='human')!;assert.equal(matchStat(room,opponent.id).value,room.game.handCounts[opponent.id]);assert(!('hand'in matchStat(room,opponent.id)))}}
});
