import {test} from 'node:test';
import assert from 'node:assert/strict';
import {SnakePlaybackClock} from '../lib/casual/snake-playback.ts';
import {SnakePresentation} from '../lib/casual/snake-presentation.ts';
import {SnakeMotionBuffer,snakeTurnTick} from '../lib/casual/snake-motion.ts';
import {createCasual,applyCasualAction,type SnakeGame} from '../lib/casual/engine.ts';

test('a single frame crossing a corner retains the corner instead of clipping diagonally',()=>{
 const p=new SnakePresentation(),body=[{x:3,y:2.95},{x:3,y:1.95},{x:3,y:.95}];
 p.sample('a',body,body,16,175,'life');
 const target=[{x:3.3,y:3},{x:3,y:3},{x:3,y:2},{x:3,y:1},{x:3,y:0}];
 p.sample('a',target.slice(0,3),target,50,175,'life');
 const ribbon=p.ribbon('a');assert(ribbon.some(v=>v.x===3&&v.y===3));
 for(let i=1;i<ribbon.length;i++)assert(ribbon[i].x===ribbon[i-1].x||ribbon[i].y===ribbon[i-1].y);
 assert.equal(p.opacity('a'),1);
});

test('confirmed remote playback never speculates into a wall or unannounced turn',()=>{
 const s=createCasual('ABCDEFGH','p','Host','hash','snake',42,10000);
 const g=applyCasualAction(s,{action:'start'},'p',10000).game as SnakeGame,w=g.worms[0],motion=new SnakeMotionBuffer();
 const initial=structuredClone(w.body);
 for(const age of [0,16,175,1000,5000])assert.deepEqual(motion.sample([{game:g,at:g.lastTickAt}],w.id,g.lastTickAt+age,175,0),initial);
});

test('a delayed countdown snapshot schedules the first turn at its actual arrival boundary',()=>{
 const g={tick:0,lastTickAt:10000},step=175;
 for(const rtt of [400,3000,5000]){
  const snapshot=10000-rtt/2,age=1200,arrives=snapshot+age+rtt;
  const tick=snakeTurnTick(g,snapshot,step,age,rtt),serverTick=Math.floor((arrives-g.lastTickAt)/step);
  assert(tick>serverTick);assert(tick<=serverTick+3,'the server must not clamp the predicted turn to another boundary');
  assert(g.lastTickAt+tick*step-arrives<=step*2);
 }
});

test('remote playback handles jitter, duplicate packets and transit latency without reversing or skipping time',()=>{
 for(const latency of [0,200,1500,2500]){
  const clock=new SnakePlaybackClock(),step=175,start=10000;
  let previous=start-step*1.25,lastReceived=start,next=0;
  for(let frame=0;frame<600;frame++){
   const time=latency+frame*16;
   if(time>=latency+next*step+(next%3)*24){lastReceived=start+next*step;clock.sample(lastReceived,time,step);next++}
   clock.sample(lastReceived,time,step); // Duplicate publication must not stall playback.
   const at=clock.read(time,step);
   assert(at>=previous);assert(at<=lastReceived);assert(at-previous<=16*1.2+.00001);
   previous=at;
  }
  assert(lastReceived-previous<step*4);
  clock.reset();clock.sample(40000,20000,step);assert.equal(clock.read(20000,step),40000-step*1.25);
 }
});

test('an authority correction keeps a live snake visible and bounded presentation speed catches up gently',()=>{
 const p=new SnakePresentation(),body=[{x:6,y:2},{x:5,y:2},{x:4,y:2},{x:3,y:2}];
 p.sample('p',body,body,16,175,'life');
 const corrected=[{x:4,y:4},{x:4,y:3},{x:4,y:2},{x:3,y:2}];
 p.sample('p',corrected,corrected,16,175,'life');assert.equal(p.opacity('p'),1);
 let previous={...corrected[0]};
 for(let frame=1;frame<=30;frame++){
  const trail=[{x:4,y:4+frame*.1},{x:4,y:4},{x:4,y:3},{x:4,y:2},{x:3,y:2}];
  const current=p.sample('p',corrected,trail,16,175,'life')[0];
  assert(Math.hypot(current.x-previous.x,current.y-previous.y)<=16/175*1.25+.00001);previous={...current};
 }
});
