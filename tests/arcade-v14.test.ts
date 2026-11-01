import {test} from 'node:test';
import assert from 'node:assert/strict';
import {ControlChannel} from '../lib/control-channel.ts';
import {PoseReconciler} from '../lib/game-motion.ts';
import {createCasual,applyCasualAction,advanceCasual,type CasualState} from '../lib/casual/engine.ts';
import {stepParty,tankWalls,clubTrack,distanceToClubTrack,CLUB_MAPS,type PartyGame} from '../lib/casual/party.ts';
import {sumoActive} from '../lib/casual/sumo-bracket.ts';
import {poolBallRadius,stepPool,validCuePosition,type PoolGame} from '../lib/casual/pool.ts';
const N=10000;
function room(mode:'sumo'|'pool'|'tanks',bots=1,seed=73){let s=createCasual('ABCDEFGH','p0','Human','hash',mode,seed,N);s=applyCasualAction(s,{action:'configure',mode,cards:20,speed:175,bots,arcadeV2:true,sumoFormat:'bracket',arena:'harbor'},'p0',N);return applyCasualAction(s,{action:'start'},'p0',N)}

test('fresh continuous socket inputs and neutral release pass delayed receipts; HTTP retains two slots',async()=>{
 const sent:any[]=[],pending:(()=>void)[]=[];let streaming=true;
 const channel=new ControlChannel(packet=>{sent.push(packet);return new Promise<void>(resolve=>pending.push(resolve))},()=>{},undefined,()=>streaming?8:2);
 for(let seq=1;seq<=7;seq++)channel.enqueue({action:'party-control',seq,dx:1});
 channel.enqueue({action:'party-control',seq:8,dx:0});assert.equal(sent.length,8);assert.equal(sent.at(-1).dx,0);
 streaming=false;channel.enqueue({action:'party-control',seq:9,dx:-1});
 for(const resolve of pending.splice(0))resolve();await new Promise(r=>setImmediate(r));assert.equal(sent.at(-1).seq,9);pending.splice(0).forEach(resolve=>resolve());channel.reset();
});

test('authority correction does not reverse held movement and still permits a real reversal or recovery warp',()=>{
 const smooth=new PoseReconciler();let prior=smooth.resolve('a',{x:100,y:20},16,true,100,350,{x:100,y:0});
 for(let i=0;i<10;i++){const next=smooth.resolve('a',{x:95+i*.1,y:20},16,i===0,100,350,{x:100,y:0});assert(next.x>=prior.x);prior=next}
 const reverse=smooth.resolve('a',{x:90,y:20},16,true,100,350,{x:-100,y:0});assert(reverse.x<prior.x);
 const warp=smooth.resolve('a',{x:1000,y:20},16,true,100,350,{x:100,y:0});assert.equal(warp.x,1000);
});

test('client prediction cannot advance a Sumo bracket or start its next countdown',()=>{
 const g=room('sumo',3).game as PartyGame,first=g.bracket!.bouts[0],start=g.startAt;
 g.actors.find(a=>a.id===first.b)!.alive=false;const before=structuredClone(g.bracket);
 for(let i=1;i<=15;i++)stepParty(g,.05,start+i*50,false);
 assert.deepEqual(g.bracket,before);assert.equal(g.startAt,start);assert(!g.ended);
 stepParty(g,.05,start+800);assert.equal(g.bracket!.bouts[0].winner,first.a);
});

test('complete seeded AI Sumo tournaments continue after every win and crown one champion',()=>{
 for(const [bots,seed] of [[2,31],[7,73],[7,129]] as const){let s=room('sumo',bots,seed);s.players[0].bot=true;const rounds=new Set<number>(),movement=new Map<number,Set<string>>();
  for(let at=N+250;s.phase==='playing'&&at<N+360000;at+=250){s=advanceCasual(s,at).state;const g=s.game as PartyGame;rounds.add(g.bracket!.round);const moving=movement.get(g.bracket!.round)||new Set<string>();for(const a of g.actors)if(sumoActive(g,a.id)&&Math.hypot(a.vx,a.vy)>1)moving.add(a.id);movement.set(g.bracket!.round,moving)}
  const g=s.game as PartyGame;assert.equal(s.phase,'finished');assert.equal(g.bracket!.champion,s.result!.winnerIds[0]);assert.equal(s.result!.winnerIds.length,1);assert.equal(rounds.size,Math.ceil(Math.log2(bots+1)));assert([...movement.values()].every(ids=>ids.size>0));
 }
});

test('new pool tables use larger separated balls, matching contacts and cue placement; legacy tables retain their radius',()=>{
 const g=room('pool').game as PoolGame;assert.equal(poolBallRadius(g),16);
 for(let i=0;i<g.balls.length;i++)for(let j=i+1;j<g.balls.length;j++)assert(Math.hypot(g.balls[i].x-g.balls[j].x,g.balls[i].y-g.balls[j].y)>=32);
 for(const b of g.balls)b.pocketed=b.number>1;Object.assign(g.balls[0],{x:300,y:280,vx:0,vy:0});Object.assign(g.balls[1],{x:324,y:280,vx:0,vy:0});
 assert(!validCuePosition(g,300,280));const legacy=structuredClone(g);delete legacy.ballRadius;assert.equal(poolBallRadius(legacy),10);assert(validCuePosition(legacy,300,280));
 stepPool(g,.05);assert(Math.hypot(g.balls[0].x-g.balls[1].x,g.balls[0].y-g.balls[1].y)>=32);stepPool(legacy,.05);assert.equal(legacy.balls[0].x,300);
});

test('Moonlit Harbor has distinct bounded cover and every tank spawn is clear',()=>{
 assert(CLUB_MAPS.length>=4);for(const p of clubTrack('harbor',32))assert(distanceToClubTrack('harbor',p.x,p.y)<.001);assert.equal(clubTrack('harbor'),clubTrack('harbor'));const g=room('tanks',7).game as PartyGame,walls=tankWalls('harbor',g.worldScale);assert.equal(g.map,'harbor');assert.notDeepEqual(walls,tankWalls('garden',g.worldScale));assert(walls.length<=10);
 for(const a of g.actors)for(const w of walls){const x=Math.max(w.x,Math.min(a.x,w.x+w.w)),y=Math.max(w.y,Math.min(a.y,w.y+w.h));assert(Math.hypot(a.x-x,a.y-y)>=34)}
});
