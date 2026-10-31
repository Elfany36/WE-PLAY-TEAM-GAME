import type {SnakeGame} from './engine.ts';
import type {CircuitGame} from './circuit.ts';
import type {TerraGame} from './terra.ts';
import type {PartyGame} from './party.ts';
import type {BlocksGame} from './blocks.ts';
import type {PoolGame} from './pool.ts';
type TimedGame=SnakeGame|CircuitGame|TerraGame|PartyGame|BlocksGame|PoolGame;
/** Move simulation timestamps together. Zero remains the "no effect" sentinel. */
export function resumeTimeline(g:TimedGame,now:number){
 const oldTick=g.lastTickAt,oldStart=g.startAt,oldPause=g.pausedAt??now;
 const remaining=Math.max(0,g.deadline-Math.max(oldPause,oldStart));
 g.startAt=now+3000;g.deadline=g.startAt+remaining;g.lastTickAt=g.startAt;
 const shift=g.startAt-oldTick,stamp=(value:number)=>value?value+shift:0;
 if('inputs'in g)g.inputs={};
 if(g.kind==='snake'){
  for(const w of g.worms){w.queue=[];w.queueTicks=[];w.respawnAt=stamp(w.respawnAt||0);w.protectedUntil=stamp(w.protectedUntil||0);if(w.deathAt!==null)w.deathAt+=shift;}
 }else if(g.kind==='circuit'){
  g.raceStartedAt=(g.raceStartedAt??oldStart)+shift;
  if(g.firstFinish!==null)g.firstFinish+=shift;
  for(const d of g.drivers){d.boostUntil=stamp(d.boostUntil);d.shieldUntil=stamp(d.shieldUntil);d.stunnedUntil=stamp(d.stunnedUntil);d.lastRecover=stamp(d.lastRecover);if(d.lapStartedAt!==undefined)d.lapStartedAt+=shift;if(d.finishedAt!==null)d.finishedAt+=shift;}
  for(const b of g.boxes)b.readyAt=stamp(b.readyAt);
  for(const h of g.hazards)h.until=stamp(h.until);
  for(const s of g.shots)s.until=stamp(s.until);
 }else if(g.kind==='terra'){
  for(const p of g.explorers){p.deadUntil=stamp(p.deadUntil);p.hurtUntil=stamp(p.hurtUntil);p.lastDamage=stamp(p.lastDamage);p.lastUse=stamp(p.lastUse);p.mining=null;}
  for(const e of g.enemies)e.hurtUntil=stamp(e.hurtUntil);
 }else if('actors'in g){
  g.ball.serveAt=stamp(g.ball.serveAt);
  for(const s of g.shots)s.until=stamp(s.until);
  for(const a of g.actors){a.cooldown=stamp(a.cooldown);a.reloadUntil=stamp(a.reloadUntil||0);a.lastShotAt=stamp(a.lastShotAt||0);a.shieldUntil=stamp(a.shieldUntil);a.respawnAt=stamp(a.respawnAt);if(a.finishedAt!==null)a.finishedAt+=shift;if(a.spawnedAt!==undefined)a.spawnedAt=stamp(a.spawnedAt);if(a.eliminatedAt!==undefined)a.eliminatedAt=stamp(a.eliminatedAt);}
 }else if(g.kind==='blocks'){
  for(const b of g.boards){b.fallAt+=shift;b.lockAt=stamp(b.lockAt);b.flashAt=stamp(b.flashAt);}
 }else if(g.kind==='pool'){
  g.turnDeadline+=g.startAt-Math.max(oldPause,oldStart);
  if(g.shot)g.shot.at+=shift;
 }
 g.pausedAt=null;
}
