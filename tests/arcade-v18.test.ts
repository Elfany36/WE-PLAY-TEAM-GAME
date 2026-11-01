import {test} from 'node:test';
import assert from 'node:assert/strict';
import {SnakePresentation} from '../lib/casual/snake-presentation.ts';
import {snakeRecordedTrail,snakeTurnTick} from '../lib/casual/snake-motion.ts';
import {chooseSnakeDirection} from '../lib/casual/snake-tactics.ts';
import {choosePoolAction} from '../lib/casual/pool-tactics.ts';
import {poolPowerForSpeed,poolShotSpeed} from '../lib/casual/pool-power.ts';
import {createCasual,applyCasualAction,advanceCasual,publicCasual,type CasualMode,type SnakeGame} from '../lib/casual/engine.ts';
import {validCuePosition,type PoolGame} from '../lib/casual/pool.ts';
import {playerStanding} from '../lib/casual/scoreboard.ts';
import {botsDue} from '../lib/casual/bots.ts';
const N=10000;
function start(mode:CasualMode){const s=createCasual('ABCDEFGH','human','Human','hash',mode,179,N);s.settings.bots=1;return applyCasualAction(s,{action:'start'},'human',N)}

test('short wire trails preserve every segment of a long Snake body',()=>{
 const body=Array.from({length:90},(_,i)=>({x:100-i,y:4})),p=new SnakePresentation(),trail=body.slice(0,32),original=JSON.stringify(body);
 assert.equal(snakeRecordedTrail({body,trail}).length,90);
 p.sample('p',body,trail,16,175,'round');const out=p.sample('p',body,trail,16,175,'round');
 assert.equal(out.length,90);assert.equal(out.at(-1)!.x,11);assert.equal(new Set(out.map(p=>p.x+','+p.y)).size,90);assert.equal(JSON.stringify(body),original);
});

test('a Snake ribbon retains true corner vertices and exact traveled body length',()=>{
 const body=[{x:3,y:3},{x:3,y:2},{x:2,y:2},{x:1,y:2}],p=new SnakePresentation();p.sample('p',body,body,16,175,'a');
 for(let f=0;f<20;f++){
  const trail=[{x:3,y:3+f*.05},{x:3,y:3},{x:3,y:2},{x:2,y:2},{x:1,y:2},{x:0,y:2}];p.sample('p',body,trail,16,175,'a');const ribbon=p.ribbon('p');
  let length=0;for(let i=1;i<ribbon.length;i++){const a=ribbon[i-1],b=ribbon[i];assert(a.x===b.x||a.y===b.y);length+=Math.hypot(a.x-b.x,a.y-b.y)}assert(Math.abs(length-3)<.00001);
 }
});

test('a corrected Snake route never animates backwards down its own body',()=>{
 const p=new SnakePresentation(),body=[{x:6,y:2},{x:5,y:2},{x:4,y:2},{x:3,y:2}];p.sample('p',body,body,16,175,'r');
 const corrected=[{x:4,y:4},{x:4,y:3},{x:4,y:2},{x:3,y:2}];const out=p.sample('p',corrected,corrected,16,175,'r');assert.deepEqual(out[0],corrected[0]);assert.equal(p.opacity('p'),0);assert.equal(p.ribbon('p').length,3);
});

test('predicted online turns reach the same boundary as an input after both transit legs',()=>{
 for(const rtt of [0,100,400,900,3000]){
  const g={tick:10,lastTickAt:1000},snapshot=1070,age=30,speed=175,arrives=snapshot+age+rtt;
  const tick=snakeTurnTick(g,snapshot,speed,age,rtt),scheduled=1000+(tick-g.tick)*speed;
  assert(scheduled>=arrives);assert(scheduled-arrives<=speed*2);
  if(rtt>=400)assert(scheduled>=arrives+80,'ordinary jitter must not miss the requested boundary');
 }
});

test('Snake bots choose reachable food rather than a short route into a sealed chamber',()=>{
 const s=start('snake'),g=s.game as SnakeGame;g.size=16;g.worms=[{...g.worms[0],body:[{x:5,y:5},{x:4,y:5},{x:3,y:5}],direction:'right',queue:[]}];g.obstacles=[{x:6,y:4},{x:7,y:5},{x:6,y:6}];g.food=[{x:6,y:5},{x:5,y:1}];
 assert.equal(chooseSnakeDirection(g,'human',{rng:14}),'up');
});

test('Snake bots avoid an opposing head approach and only decide once per grid tick',()=>{
 const s=start('snake'),g=s.game as SnakeGame;g.obstacles=[];g.food=[{x:6,y:5}];g.worms[0].body=[{x:5,y:5},{x:4,y:5},{x:3,y:5}];g.worms[0].direction='right';g.worms[1].body=[{x:7,y:5},{x:8,y:5},{x:9,y:5}];g.worms[1].direction='left';assert.notEqual(chooseSnakeDirection(g,'human',{rng:7}),'right');
 s.ai!.snakeTick=g.tick;s.ai!.snakeEpoch=g.startAt;assert(!botsDue(s,N));g.tick++;assert(botsDue(s,N));s.ai!.snakeTick=g.tick;g.startAt+=1000;assert(botsDue(s,N));
});

test('pool power is monotone, has finer low shots and preserves the maximum speed',()=>{
 let prior=0;for(let i=10;i<=100;i++){const power=i/100,v=poolShotSpeed(power);assert(v>prior);assert(Math.abs(poolPowerForSpeed(v)-power)<.00001);prior=v}assert(poolShotSpeed(.1)<120);assert.equal(poolShotSpeed(1),800);
});

test('pool bots find a valid cue placement when the old hard-coded spot is occupied',()=>{
 const s=start('pool'),g=s.game as PoolGame;g.inHand=true;g.breaking=false;Object.assign(g.balls[0],{x:230,y:280});Object.assign(g.balls[1],{x:230,y:280});const action=choosePoolAction(g,g.currentId,{rng:51})!;assert.equal(action.action,'pool-place');assert(validCuePosition(g,action.x,action.y));
 g.breaking=true;const opening=choosePoolAction(g,g.currentId,{rng:51})!;assert.equal(opening.action,'pool-place');assert(opening.x<=275);assert(validCuePosition(g,opening.x,opening.y));
});

test('pool bots choose the clear ghost-ball route and use a legal called pocket',()=>{
 const s=start('pool'),g=s.game as PoolGame;g.breaking=false;g.inHand=false;g.groups[g.currentId]='solids';g.balls.forEach(b=>{b.pocketed=b.number>1});Object.assign(g.balls[0],{x:500,y:350});Object.assign(g.balls[1],{x:500,y:170});const action=choosePoolAction(g,g.currentId,{rng:51})!;assert.equal(action.action,'pool-shot');assert.equal(action.pocket,1);assert(Math.abs(action.angle+Math.PI/2)<.001);assert(action.power>=.1&&action.power<=1);
});

test('all public standings are finite, useful and never expose hidden UNO faces',()=>{
 for(const mode of ['snake','memory','uno','ladders','chess','dama','scidama','pool','property','blocks','tanks','sumo','marble','pong','circuit','phone','terra'] as CasualMode[]){
  const s=start(mode),room=publicCasual(s,'human',N);for(const p of room.players){const text=playerStanding(room,p.id);assert(text.length>0,mode);assert(!/undefined|NaN|Infinity/.test(text),text)}
 }
});
