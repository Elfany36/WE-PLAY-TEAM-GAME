import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createCasual,applyCasualAction,publicCasual,canResumeCasual,stepSnake,type CasualMode,type CasualState,type SnakeGame} from '../lib/casual/engine.ts';
import {chooseSnakeDirection} from '../lib/casual/snake-tactics.ts';
const N=100_000;
function room(mode:CasualMode='snake',settings:Record<string,unknown>={}){
 let s=createCasual('ABCDEFGH','host','Host','h',mode,42,N);
 s=applyCasualAction(s,{action:'join',id:'friend',name:'Friend',hash:'f'},null,N);
 s=applyCasualAction(s,{action:'join',id:'watcher',name:'Watcher',hash:'w',role:'spectator'},null,N);
 s=applyCasualAction(s,{action:'configure',mode,cards:20,speed:175,...settings},'host',N);
 return applyCasualAction(s,{action:'start'},'host',N);
}
function act(s:CasualState,action:string,id:string,now:number){return applyCasualAction(s,{action,round:s.round},id,now)}
test('every paused arena permits a spectator to resume after the host is offline, without granting host powers',()=>{
 for(const mode of ['snake','circuit','terra','sumo','tanks','pong','marble','blocks','pool'] as const){
  let s=act(room(mode),'pause','host',N+4000);const g=s.game as SnakeGame,remaining=g.deadline-Math.max(g.pausedAt!,g.startAt);
  assert.equal(publicCasual(s,'watcher',N+23999).canResume,false,mode);
  assert.throws(()=>act(s,'resume','watcher',N+23999),(e:any)=>e.status===403);
  assert.equal(publicCasual(s,'watcher',N+24000).canResume,true,mode);
  s=act(s,'resume','watcher',N+24000);assert.equal(s.phase,'playing');assert.equal(s.hostId,'host');
  assert.equal((s.game as SnakeGame).startAt,N+27000);assert.equal((s.game as SnakeGame).deadline,N+27000+remaining);
  assert.equal(canResumeCasual(s,'watcher',N+24000),false);
  assert.throws(()=>act(s,'pause','watcher',N+24000),(e:any)=>e.status===403);
  assert.throws(()=>applyCasualAction(s,{action:'configure',mode,cards:20,speed:175},'watcher',N+24000),(e:any)=>e.status===403);
 }
});
test('a host heartbeat keeps Resume restricted; retired, bot and unknown viewers never gain Resume',()=>{
 let s=act(room(),'pause','host',N+4000);s=act(s,'heartbeat','host',N+23500);
 assert.equal(canResumeCasual(s,'watcher',N+24000),false);assert.equal(canResumeCasual(s,'host',N+24000),true);
 assert.equal(canResumeCasual(s,'stranger',N+90000),false);
 const observer=s.players.find(p=>p.id==='watcher')!;observer.retired=true;assert.equal(canResumeCasual(s,'watcher',N+90000),false);
 observer.retired=false;observer.bot=true;assert.equal(canResumeCasual(s,'watcher',N+90000),false);
 s.players.find(p=>p.id==='host')!.retired=true;assert.equal(canResumeCasual(s,'friend',N+24000),true);
});
function collisionRoom(battle:boolean,size:number,bot:boolean){const s=room('snake',{battle,snakeSize:size}),g=s.game as SnakeGame;g.obstacles=[];g.food=[];s.players.find(p=>p.id==='friend')!.bot=bot;
 g.worms[0].body=[{x:6,y:4},{x:6,y:5},{x:6,y:6}];g.worms[0].direction='up';
 g.worms[1].body=[{x:5,y:5},{x:4,y:5},{x:3,y:5}];g.worms[1].direction='right';
 for(const w of g.worms){w.queue=[];w.protectedUntil=N+99999}return s;
}
test('human and AI snakes both die on an opponent body in classic and battle at every arena size, including legacy protection timers',()=>{
 for(const battle of [false,true])for(const size of [32,48,64])for(const bot of [false,true]){
  const s=collisionRoom(battle,size,bot),g=s.game as SnakeGame;stepSnake(s,N+4000);
  assert.equal(g.worms[1].alive,false,JSON.stringify({battle,size,bot}));assert.equal(g.worms[1].reason,'Hit another snake');assert.equal(g.worms[0].alive,true);
  if(battle){assert.equal(g.worms[0].kills,1);stepSnake(s,N+6000);assert(g.worms[1].alive);assert.equal(g.worms[1].protectedUntil,0)}
 }
});
test('simultaneous head collisions and swaps eliminate both snakes regardless of bot status or protection',()=>{
 for(const swap of [false,true]){const s=collisionRoom(true,48,true),g=s.game as SnakeGame;
  g.worms[0].body=[{x:5,y:5},{x:4,y:5},{x:3,y:5}];g.worms[0].direction='right';
  g.worms[1].body=[{x:swap?6:7,y:5},{x:swap?7:8,y:5},{x:swap?8:9,y:5}];g.worms[1].direction='left';
  stepSnake(s,N+4000);assert(g.worms.every(w=>!w.alive));assert(g.worms.every(w=>w.reason===(swap?'Head-swap collision':'Head-on collision')));
 }
});
test('vacating tails are traversable, growing tails stay solid, and AI route planning agrees with collision rules',()=>{
 for(const growing of [false,true]){const s=collisionRoom(true,48,true),g=s.game as SnakeGame;g.worms[1].body=[{x:5,y:6},{x:4,y:6},{x:3,y:6}];
  if(growing)g.food=[{x:6,y:3}];
  const brain={seed:42,profiles:{}} as any;assert.notEqual(chooseSnakeDirection(g,'friend',brain),growing?'right':undefined);
  stepSnake(s,N+4000);assert.equal(g.worms[1].alive,!growing);
 }
});
