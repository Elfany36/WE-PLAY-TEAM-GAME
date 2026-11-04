import {test} from 'node:test';import assert from 'node:assert/strict';
import {createCasual,applyCasualAction,advanceCasual,activePlayers,type CasualMode} from '../lib/casual/engine.ts';
import type {UnoGame} from '../lib/casual/uno.ts';
const N=100000;
function join(s:ReturnType<typeof createCasual>,id:string,spectator=false){return applyCasualAction(s,{action:'join',id,name:id,hash:'h-'+id,...(spectator?{role:'spectator'}:{})},null,N)}
test('UNO and Flip skip interleaved spectators and retired seats when the current player leaves in either direction',()=>{
 for(const flip of [false,true])for(const direction of [1,-1] as const){let s=createCasual('ABCDEFGH','a','A','ha','uno',1,N);s=join(s,'b');s=join(s,'watch',true);s=join(s,'c');s=applyCasualAction(s,{action:'configure',mode:'uno',cards:20,speed:350,unoFlip:flip},'a',N);s=applyCasualAction(s,{action:'start'},'a',N);const g=s.game as UnoGame;g.currentId='b';g.direction=direction;g.pending=null;g.initialWild=false;s=applyCasualAction(s,{action:'leave'},'b',N+1);assert.equal((s.game as UnoGame).currentId,direction===1?'c':'a');assert.notEqual((s.game as UnoGame).currentId,'watch');s=advanceCasual(s,(s.game as UnoGame).deadline+1).state;assert.equal(s.phase,'playing');assert(activePlayers(s).some(p=>p.id===(s.game as UnoGame).currentId))}
});
test('empty solo rounds finish for observers while AI-only rounds keep their active participants',()=>{
 for(const mode of ['memory','ladders','snake','circuit','terra','blocks'] as CasualMode[]){let s=createCasual('ABCDEFGH','a','A','ha',mode,1,N);s=join(s,'watch',true);s=applyCasualAction(s,{action:'start'},'a',N);s=applyCasualAction(s,{action:'leave'},'a',N+1);assert.equal(s.phase,'finished',mode);assert.equal(s.hostId,'watch');assert.equal(advanceCasual(s,N+100000).state.phase,'finished')}
 let s=createCasual('ABCDEFGH','a','A','ha','memory',1,N);s=join(s,'watch',true);s=applyCasualAction(s,{action:'configure',mode:'memory',cards:20,speed:350,bots:2},'a',N);s=applyCasualAction(s,{action:'start'},'a',N);s=applyCasualAction(s,{action:'leave'},'a',N+1);assert.equal(s.phase,'playing');assert.equal(activePlayers(s).length,2);assert(activePlayers(s).every(p=>p.bot));
});
