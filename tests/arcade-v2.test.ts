import {test} from 'node:test';
import assert from 'node:assert/strict';
import {driveInput} from '../lib/casual/drive-controls.ts';
import {createCasual,applyCasualAction,type SnakeGame} from '../lib/casual/engine.ts';
import {stepCircuit,trackPoints,trackLength,distanceToTrack,CIRCUIT_SCALE,circuitWorld,type CircuitGame} from '../lib/casual/circuit.ts';
import {TokenTimeline} from '../lib/casual/motion.ts';
import {ControlChannel} from '../lib/control-channel.ts';
import {inkStyle,BRUSHES} from '../lib/casual/ink.ts';
import {predictSnake,snakeBuffer} from '../lib/casual/snake-motion.ts';
const now=10_000;
function race(track='meadow',players=1){let s=createCasual('ABCDEFGH','p0','Host','h','circuit',1,now);s.settings.track=track;for(let i=1;i<players;i++)s=applyCasualAction(s,{action:'join',id:'p'+i,hash:'h'+i,name:'P'+i},null,now);return applyCasualAction(s,{action:'start'},'p0',now)}
test('kart input remains finite for idle, every individual key, opposing keys and release',()=>{
 for(const key of ['','up','down','left','right','space','w','a','s','d']){const input=driveInput(key?{[key]:true}:{});assert(Number.isFinite(input.throttle),key);assert(Number.isFinite(input.steer),key);const packet=JSON.parse(JSON.stringify(input));assert.equal(typeof packet.steer,'number');assert.equal(typeof packet.throttle,'number')}
 assert.deepEqual(driveInput({up:true,down:true,left:true,right:true}),{action:'drive',throttle:0,steer:0,drift:false});assert.equal(driveInput({up:false}).throttle,0);
});
test('each enlarged track has a measured approximately one-minute lap and continuous road detection',()=>{
 for(const track of ['meadow','coast','night']){const s=race(track),g=s.game as CircuitGame,d=g.drivers[0];d.bot=true;const lengths=trackLength(track);assert(lengths>24000&&lengths<28000,track);const points=trackPoints(track,192,CIRCUIT_SCALE);for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length];assert(distanceToTrack(track,(a.x+b.x)/2,(a.y+b.y)/2,CIRCUIT_SCALE)<.001)}
  for(let tick=0;tick<1700&&d.lap===0;tick++)stepCircuit(g,['p0'],.05,g.startAt+tick*50,()=>.99);
  assert.equal(d.lap,1,track);assert(d.lastLapMs!>=55_000&&d.lastLapMs!<=68_000,track+': '+d.lastLapMs);assert(Number.isFinite(d.x)&&Number.isFinite(d.angle));
 }
});
test('stationary steering does not rotate the kart and eight starting positions do not overlap',()=>{
 const g=race('meadow',8).game as CircuitGame,d=g.drivers[0],angle=d.angle;g.inputs.p0={throttle:0,steer:1,drift:false,at:g.startAt,seq:1};stepCircuit(g,g.drivers.map(d=>d.id),.05,g.startAt);assert(Math.abs(d.angle-angle)<1e-12);
 for(let i=0;i<8;i++)for(let j=i+1;j<8;j++)assert(Math.hypot(g.drivers[i].x-g.drivers[j].x,g.drivers[i].y-g.drivers[j].y)>=40);
 const bounds=circuitWorld(g);assert(bounds.width>10000&&bounds.height>7000);
});
test('fresh control can pass one stalled request; stale failure does not retry over the newer state',async()=>{
 let reject!:((e:Error)=>void);const sent:number[]=[];const c=new ControlChannel(p=>{sent.push(p.seq);return p.seq===1?new Promise((_,r)=>reject=r):Promise.resolve()},()=>{},()=>0,2);
 c.enqueue({action:'drive',round:1,seq:1,throttle:1});c.enqueue({action:'drive',round:1,seq:2,throttle:0});assert.deepEqual(sent,[1,2]);reject(Error('old request failed'));await new Promise(r=>setTimeout(r,15));assert.deepEqual(sent,[1,2]);c.reset();
});
test('a delayed board observer follows server progress and settles at the destination',()=>{
 const path=[{x:0,y:0},{x:100,y:0},{x:200,y:0},{x:300,y:0}],t=new TokenTimeline(path[0]);t.update(path[0],undefined,undefined,0,now,0,720,900);
 t.update(path[3],path,undefined,now,now+1400,100,720,900);assert(t.sample(100).x>200&&t.sample(100).x<300);assert.equal(t.sample(1100).x,300);assert.equal(t.sample(2000).x,300);
});
test('drawing styles accept six brushes, gradients and mixing while rejecting malformed controls',()=>{
 for(const brush of BRUSHES){const s=inkStyle({color:'#123456',color2:'#abcdef',size:64,opacity:.4,gradient:true,blend:'multiply',brush});assert.equal(s.brush,brush);assert.equal(s.opacity,.4);assert.equal(s.color2,'#abcdef')}
 for(const bad of [{size:65},{opacity:0},{opacity:NaN},{brush:'eval()'},{color2:'url(x)'},{blend:'unknown'},{gradient:'yes'}])assert.throws(()=>inkStyle({color:'#123456',size:8,...bad}));
});
test('drawing-relay storage preserves brush, alpha, width, gradient and blend for the next player',()=>{
 let s=createCasual('ABCDEFGH','p0','Host','h','phone',13,now);s=applyCasualAction(s,{action:'join',id:'p1',hash:'h1',name:'Friend'},null,now);s=applyCasualAction(s,{action:'start'},'p0',now);
 for(const id of ['p0','p1'])s=applyCasualAction(s,{action:'submit-phone',round:1,stage:0,text:'A star'},id,now+1);
 const stroke={color:'#ee3344',color2:'#3344ee',size:48,opacity:.35,brush:'soft',gradient:true,blend:'screen',points:[[.1,.2],[.4,.8]]};s=applyCasualAction(s,{action:'submit-phone',round:1,stage:1,strokes:[stroke]},'p0',now+2);
 const entry=(s.game as any).chains.flatMap((c:any)=>c.entries).find((e:any)=>e.by==='p0'&&e.kind==='drawing');assert.deepEqual(entry.strokes[0],stroke);
});
test('property rolls always have a dice event, and card movement retains the complete walked path',()=>{
 let original=createCasual('ABCDEFGH','p0','Host','h','property',1,now);original=applyCasualAction(original,{action:'join',id:'p1',hash:'h1',name:'Friend'},null,now);original=applyCasualAction(original,{action:'start'},'p0',now);
 const probe=applyCasualAction(original,{action:'roll-property',round:1,turn:1},'p0',now+1),dice=(probe.game as any).dice,total=dice[0]+dice[1],g=original.game as any;g.players.p0.position=(7-total+40)%40;g.chance=[0];const start=g.players.p0.position;
 const result=applyCasualAction(original,{action:'roll-property',round:1,turn:1},'p0',now+1).game as any;assert.equal(result.diceAt,now+1);assert.equal(result.lastMove.from,start);assert.equal(result.lastMove.path[0],(start+1)%40);assert.equal(result.lastMove.to,0);assert(result.lastMove.path.includes(7));
});
test('Snake has a bounded adaptive remote buffer, predicts growth and keeps its authority state immutable',()=>{
 let s=createCasual('ABCDEFGH','p0','Host','h','snake',3,now);s=applyCasualAction(s,{action:'start'},'p0',now);const g=s.game as SnakeGame,w=g.worms[0],before=JSON.stringify(g);g.food=[{x:w.body[0].x+1,y:w.body[0].y}];const snapshot=JSON.stringify(g),body=predictSnake(g,w,g.lastTickAt+175,175);assert.equal(body.length,w.body.length+1);assert.equal(JSON.stringify(g),snapshot);assert(snakeBuffer(30)<220);assert(snakeBuffer(2000)<=700);assert(before);
});
test('Snake schedules fresh turns at a visible grid boundary instead of rewriting an already predicted segment',()=>{
 let s=createCasual('ABCDEFGH','p0','Host','h','snake',3,now);s=applyCasualAction(s,{action:'start'},'p0',now);const g=s.game as SnakeGame,w=g.worms[0],head={...w.body[0]},tick=g.tick+2;
 const halfway=predictSnake(g,w,g.lastTickAt+87.5,175,[{direction:'down',tick}]);assert.equal(halfway[0].x,head.x+.5);assert.equal(halfway[0].y,head.y);
 const turning=predictSnake(g,w,g.lastTickAt+262.5,175,[{direction:'down',tick}]);assert.equal(turning[0].x,head.x+1);assert.equal(turning[0].y,head.y+.5);
 s=applyCasualAction(s,{action:'direction',round:1,seq:1,direction:'down',turns:[{seq:1,direction:'down',tick}]},'p0',g.startAt);assert.equal((s.game as SnakeGame).worms[0].queueTicks?.[0],tick);
});
