import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createCasual,applyCasualAction,advanceCasual,type SnakeGame} from '../lib/casual/engine.ts';
import {predictSnake,sampledSnake,snakeHorizon} from '../lib/casual/snake-motion.ts';
test('Snake local prediction covers transit time while remote guesses remain limited to one tile',()=>{
 let s=createCasual('ABCDEFGH','p','Player','hash','snake',1,10000);s.settings.snakeSize=64;s=applyCasualAction(s,{action:'start'},'p',10000);const g=s.game as SnakeGame,w=g.worms[0];g.obstacles=[];g.food=[];w.direction='right';w.body=[{x:10,y:10},{x:9,y:10},{x:8,y:10}];const horizon=snakeHorizon(600,125);assert(horizon>=425&&horizon<=1000);
 const a=predictSnake(g,w,g.lastTickAt+650,125),b=predictSnake(g,w,g.lastTickAt+1000,125);assert(b[0].x>a[0].x);assert.equal(b[0].x,18);
 assert.deepEqual(sampledSnake([{game:g,at:g.lastTickAt}],'p',g.lastTickAt+100000,125,horizon),predictSnake(g,w,g.lastTickAt+125,125));assert(snakeHorizon(100000,125)<=1000);
});
test('a predicted Snake consumes a known apple once when its route circles back',()=>{
 let s=createCasual('ABCDEFGH','p','Player','hash','snake',1,10000);s=applyCasualAction(s,{action:'start'},'p',10000);const g=s.game as SnakeGame,w=g.worms[0];g.tick=0;g.obstacles=[];g.food=[{x:3,y:2}];w.direction='right';w.body=[{x:2,y:2},{x:1,y:2}];const original=JSON.stringify(g),body=predictSnake(g,w,g.lastTickAt+875,175,[{direction:'down',tick:2},{direction:'left',tick:3},{direction:'up',tick:4},{direction:'right',tick:5}]);assert.equal(body.length,3);assert.deepEqual(body[0],{x:3,y:2});assert.equal(JSON.stringify(g),original);
});
test('memory difficulty leaves readable time after a flip and preserves the mismatch turn lock',()=>{
 for(const[difficulty,duration]of [['cozy',2200],['standard',1600],['expert',1200]] as const){let s=createCasual('ABCDEFGH','p','Player','hash','memory',4,10000);s.settings.difficulty=difficulty;s=applyCasualAction(s,{action:'start'},'p',10000);const other=(s.game as any).deck.findIndex((c:any)=>c.key!==(s.game as any).deck[0].key);s=applyCasualAction(s,{action:'flip',round:1,turn:1,card:0},'p',10010);s=applyCasualAction(s,{action:'flip',round:1,turn:1,card:other},'p',10020);assert.equal((s.game as any).resolveAt,10020+duration);assert.equal((advanceCasual(s,10020+duration-1).state.game as any).revealed.length,2);assert.equal((advanceCasual(s,10020+duration).state.game as any).revealed.length,0)}
});
