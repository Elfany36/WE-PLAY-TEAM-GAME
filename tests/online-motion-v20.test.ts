import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createCasual,applyCasualAction} from '../lib/casual/engine.ts';
import {expectsWorldUpdates,worldQuietLimit,worldRecoveryDelay} from '../lib/casual/world-stream.ts';
import {PoseReconciler,predictionInputAt,predictionWindow} from '../lib/game-motion.ts';
import {kartPresentationPose,tankPresentationPose} from '../lib/casual/presentation-constraints.ts';
import {circuitObstacles,CIRCUIT_BARRIER,CIRCUIT_BOAT,type CircuitGame} from '../lib/casual/circuit.ts';
import {tankWalls,partyScale,stepParty,type PartyGame} from '../lib/casual/party.ts';
import {hullAt,hullContact,hullCircleContact,TANK_HULL,KART_HULL} from '../lib/casual/collision.ts';

function room(mode:'tanks'|'circuit'|'snake'){
 const s=createCasual('ABCDEFGH','p','Host','hash',mode,42,10000);s.settings.arcadeV2=true;s.settings.bots=1;
 return applyCasualAction(s,{action:'start'},'p',10000);
}

test('a stopped stream after the countdown requires recovery without a new snapshot',()=>{
 const s=room('snake'),r={...s,serverNow:10000} as any;
 assert.equal(worldRecoveryDelay({...r,game:{...r.game,startAt:11500}},1000,2000),500);assert(!expectsWorldUpdates(r,0));assert(expectsWorldUpdates(r,4000));
 assert(!expectsWorldUpdates({...r,phase:'paused'},5000));
 assert(!expectsWorldUpdates({...r,mode:'uno'},5000));
 assert(!expectsWorldUpdates({...r,mode:'pool',game:{...r.game,moving:false}},5000));
 assert(expectsWorldUpdates({...r,mode:'pool',game:{...r.game,moving:true}},5000));
 for(const interval of [0,100,200,2000,NaN])assert(worldQuietLimit(interval)<=650);
});

test('large same-life authority corrections remain bounded, and explicit recovery resets cleanly',()=>{
 const smoother=new PoseReconciler();
 smoother.resolve('p',{x:0,y:0},16,true,Infinity,350);
 let previous={x:0,y:0};
 for(let frame=0;frame<200;frame++){
  const next=smoother.resolve('p',{x:600,y:0},16,frame%6===0,Infinity,350);
  assert(Math.hypot(next.x-previous.x,next.y-previous.y)<=350*.016+.001);
  assert(next.x>=previous.x);previous=next;
 }
 assert(previous.x>590);
 smoother.forget('p');assert.equal(smoother.resolve('p',{x:20,y:30},16,true,Infinity,350).x,20);
});

test('visual tank correction cannot place its treads inside cover and leaves authority unchanged',()=>{
 const g=room('tanks').game as PartyGame,a=g.actors[0],before=JSON.stringify(g),scale=partyScale(g);
 for(const wall of tankWalls(g.map,scale))for(const angle of [0,.6,1.57,2.4]){
  const actor={...a,hullAngle:angle},pose=tankPresentationPose(g,actor,{x:wall.x+wall.w/2,y:wall.y+wall.h/2,angle});
  for(const w of tankWalls(g.map,scale))assert(!hullContact(hullAt({...pose,angle},TANK_HULL,angle),hullAt({x:w.x+w.w/2,y:w.y+w.h/2,angle:0},{halfLength:w.w/2,halfWidth:w.h/2})));
 }
 assert.equal(JSON.stringify(g),before);
});

test('visual kart correction clears the same scenery hulls as authoritative movement',()=>{
 const g=room('circuit').game as CircuitGame,a=g.drivers[0],before=JSON.stringify(g);
 for(const prop of circuitObstacles(g)){
  const pose=kartPresentationPose(g,a,{x:prop.x,y:prop.y,angle:a.angle}),hull=hullAt({...pose,angle:pose.angle??a.angle},KART_HULL);
  const box=prop.kind===7?CIRCUIT_BARRIER:g.track==='coast'&&prop.kind<3?CIRCUIT_BOAT:null;
  assert(!(box?hullContact(hull,hullAt(prop,box)):hullCircleContact(hull,prop,prop.radius)));
 }
 assert.equal(JSON.stringify(g),before);
});

test('a legal visual correction feeds back into smoothing instead of accumulating wall penetration',()=>{
 const smoother=new PoseReconciler(),limit=(p:{x:number;y:number;angle?:number})=>({...p,x:Math.min(10,p.x)});
 for(let i=0;i<100;i++){
  const p=smoother.resolve('p',{x:100,y:0},16,i%6===0,Infinity,350,undefined,limit);
  assert.equal(p.x,10);
 }
 const away=smoother.resolve('p',{x:5,y:0},16,true,Infinity,350,undefined,limit);
 assert(away.x<10&&away.x>=5);
});

test('HTTP snapshots and control acknowledgements cannot refresh live world health',async()=>{
 const {RoomTransport}=await import('../lib/room-transport.ts'),transport=new RoomTransport(),original=globalThis.fetch;
 const base={code:'ABCDEFGH',revision:1,serverNow:100,game:{x:1}};
 transport.receive({snapshotId:'live-1',room:base});
 const liveAt=transport.stats.lastLiveStateReceipt;assert(liveAt>0);assert.equal(transport.stats.stateSource,'live');
 transport.receive({ack:true,clock:{receivedAt:101,sentAt:101}});assert.equal(transport.stats.lastLiveStateReceipt,liveAt);
 globalThis.fetch=async()=>Response.json({snapshotId:'http-2',room:{...base,revision:2,serverNow:200}});
 try{await transport.send('https://example.test/api/casual',{}, {forceHttp:true});assert.equal(transport.stats.stateSource,'http');assert.equal(transport.stats.lastLiveStateReceipt,liveAt);assert(transport.stats.lastStateReceipt>=liveAt)}finally{globalThis.fetch=original}
 transport.receive({snapshotId:'live-3',room:{...base,revision:3,serverNow:300}});assert.equal(transport.stats.stateSource,'live');assert(transport.stats.lastLiveStateReceipt>=liveAt);
 transport.reset();assert.equal(transport.stats.lastLiveStateReceipt,0);
});


test('a newly pressed or released control cannot rewrite the in-flight physics segment',()=>{
 for(const base of [1000,1003,174253.25])for(let phase=1;phase<50;phase++){
  const at=predictionInputAt(base+phase,base);
  assert(at>base+50,'current segment was rewritten');assert.equal(at,base+100);
  assert(at-50-(base+phase)<50,'input waited longer than the next segment');
 }
 assert.equal(predictionInputAt(1000,1000),1050);
});

test('prediction covers snapshot age through the next HTTP return without unbounded work',()=>{
 for(const rtt of [400,1400,1800,3000])assert(predictionWindow(rtt)>=rtt*1.5+200);
 assert(predictionWindow(100000)<=5000);
});


test('a predicted death cannot teleport back to spawn before authority confirms the new life',()=>{
 const g=room('tanks').game as PartyGame,a=g.actors[0];Object.assign(a,{alive:false,x:500,y:500,respawnAt:g.startAt+100});
 stepParty(g,.05,g.startAt+2000,false);assert.equal(a.alive,false);assert.equal(a.x,500);assert.equal(a.y,500);assert(!a.spawnedAt);
 stepParty(g,.05,g.startAt+2050,true);assert(a.alive);assert(a.spawnedAt);assert(Math.hypot(a.x-500,a.y-500)>100);
});
