import test from 'node:test';import assert from 'node:assert/strict';
import {createCasual,applyCasualAction,publicCasual,type SnakeGame,type CasualMode} from '../lib/casual/engine.ts';
import {SnakeMotionBuffer,sampledSnake,predictSnake} from '../lib/casual/snake-motion.ts';
import {blocksAction,applyBlockMove,stepBlocks,blockCells,type BlocksGame} from '../lib/casual/blocks.ts';
import {predictBlocks,type PendingBlockMove} from '../lib/casual/block-prediction.ts';
function fixture(mode:CasualMode){let s=createCasual('ABCDEFGH','a','Human','hash',mode,73,10000);s=applyCasualAction(s,{action:'join',id:'b',name:'Opponent',hash:'hash-b'},null,10000);return applyCasualAction(s,{action:'start'},'a',10000)}
test('remote playback cannot sample a dead or previous-life body after a confirmed respawn',()=>{
 const start=fixture('snake').game as SnakeGame,dead=structuredClone(start),dead2=structuredClone(start),respawn=structuredClone(start);dead.worms[1].alive=false;dead.worms[1].body=[];dead.worms[1].deathAt=14000;dead2.worms[1]=structuredClone(dead.worms[1]);respawn.worms[1].body=[{x:20,y:20},{x:19,y:20},{x:18,y:20}];respawn.worms[1].deathAt=14000;
 const history=[{game:start,at:13000},{game:dead,at:14000},{game:dead2,at:15000},{game:respawn,at:16000}],buffer=new SnakeMotionBuffer();
 for(const at of[13001,14500,15500,16000])for(const sample of[sampledSnake(history,'b',at,175),buffer.sample(history,'b',at,175)])assert.deepEqual(sample,respawn.worms[1].body);
 assert.deepEqual(buffer.sample(history.slice(0,-1),'b',13500,175),[]);
});
test('human and AI prediction stop at foreign bodies, head-on and head-swap collisions',()=>{
 for(const size of[32,48,64])for(const ai of[false,true])for(const collision of['body','head','swap']){
  const s=fixture('snake'),g=s.game as SnakeGame;g.size=size;s.players[1].bot=ai;g.food=[];g.obstacles=[];
  const a=g.worms[0],b=g.worms[1];a.body=[{x:10,y:10},{x:9,y:10},{x:8,y:10}];a.direction='right';a.queue=[];
  b.body=collision==='body'?[{x:11,y:9},{x:11,y:10},{x:11,y:11}]:collision==='head'?[{x:12,y:10},{x:13,y:10},{x:14,y:10}]:[{x:11,y:10},{x:12,y:10},{x:13,y:10}];b.direction=collision==='body'?'up':'left';b.queue=[];
  assert.deepEqual(predictSnake(g,a,g.lastTickAt+175,175),a.body,collision);assert.deepEqual(new SnakeMotionBuffer().predict(g,a,g.lastTickAt+175,175,[]),a.body,collision);
 }
});
test('prediction follows vacating foreign tails but blocks a growing tail',()=>{
 const g=fixture('snake').game as SnakeGame;g.obstacles=[];g.food=[];const[a,b]=g.worms;a.body=[{x:10,y:10},{x:9,y:10},{x:8,y:10}];a.direction='right';a.queue=[];b.body=[{x:13,y:10},{x:12,y:10},{x:11,y:10}];b.direction='right';b.queue=[];
 assert.deepEqual(predictSnake(g,a,g.lastTickAt+175,175)[0],{x:11,y:10});g.food=[{x:14,y:10}];assert.deepEqual(predictSnake(g,a,g.lastTickAt+175,175),a.body);
});
test('delayed drops and rotations acknowledge their sequence without changing a newer piece',()=>{
 const s=fixture('blocks'),g=s.game as BlocksGame,b=g.boards[0],at=g.startAt+1,serial=b.pieceSerial!;applyBlockMove(g,b,'drop',at);const stack=structuredClone(b.grid),piece=structuredClone(b.piece),next=b.pieceSerial;
 blocksAction(s,{action:'block-input',seq:3,moves:[{seq:1,move:'drop',pieceSerial:serial},{seq:2,move:'rotate',pieceSerial:serial},{seq:3,move:'right',pieceSerial:serial}]},b.id,at+1);
 assert.equal(b.seq,3);assert.equal(b.pieceSerial,next);assert.deepEqual(b.grid,stack);assert.deepEqual(b.piece,piece);
 blocksAction(s,{action:'block-input',seq:4,moves:[{seq:4,move:'right',pieceSerial:next}]},b.id,at+2);assert.equal(b.piece.x,piece.x+1);
});
test('rapid hold/drop/new-piece controls predict exactly the ordered server result',()=>{
 const s=fixture('blocks'),g=s.game as BlocksGame,b=g.boards[0],m=structuredClone(g),pending:PendingBlockMove[]=[],at=g.startAt+1;
 for(const move of['hold','right','rotate','drop','left','rotate','drop','right'] as const){predictBlocks(m,b.id,pending,at,m.lastTickAt);const own=m.boards[0];pending.push({seq:pending.length+1,move,at,pieceSerial:own.pieceSerial||0})}
 predictBlocks(m,b.id,pending,at,m.lastTickAt);blocksAction(s,{action:'block-input',seq:pending.length,moves:pending},b.id,at);
 for(const key of['grid','piece','pieceSerial','held','queue','score','seq'] as const)assert.deepEqual(m.boards[0][key],b[key],key);
});
test('gravity prediction waits for authority before placing a stack or spawning a random next piece',()=>{
 const g=fixture('blocks').game as BlocksGame,b=g.boards[0];while(blockCells({...b.piece,y:b.piece.y+1}).every(p=>p.y<20))b.piece.y++;b.lockAt=g.startAt;b.fallAt=g.startAt;
 const serial=b.pieceSerial,stack=structuredClone(b.grid);predictBlocks(g,b.id,[],g.startAt+1000,g.startAt+1000);assert.deepEqual(b.grid,stack);assert.equal(b.pieceSerial,serial);
 stepBlocks(g,g.startAt+1001);assert.equal(b.pieceSerial,serial!+1);assert(b.grid.some(row=>row.some(Boolean)));
});
test('invalid piece identities are rejected atomically and legacy controls remain supported',()=>{
 const s=fixture('blocks'),g=s.game as BlocksGame,b=g.boards[0],at=g.startAt+1;
 for(const pieceSerial of[-1,1.5,'1',Number.MAX_SAFE_INTEGER+1]){const old=structuredClone(s);assert.throws(()=>blocksAction(s,{action:'block-input',seq:1,moves:[{seq:1,move:'left',pieceSerial}]},b.id,at),/Invalid ordered/);assert.deepEqual(s,old)}
 const x=b.piece.x;blocksAction(s,{action:'block-input',seq:1,moves:[{seq:1,move:'left'}]},b.id,at);assert.equal(b.piece.x,x-1);
});

test('snake forecasting accepts private wire views with remote turn queues omitted',()=>{const s=fixture('snake'),g=publicCasual(s,'a',14000).game as SnakeGame,w=g.worms[0];assert(!('queue' in w));assert.doesNotThrow(()=>new SnakeMotionBuffer().predict(g,w,g.lastTickAt+175,175,[]));assert.doesNotThrow(()=>predictSnake(g,w,g.lastTickAt+175,175))});
