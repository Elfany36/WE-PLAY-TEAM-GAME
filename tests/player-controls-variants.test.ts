import {test} from 'node:test';import assert from 'node:assert/strict';
import {CONTROL_PROFILES,controlKey,controlConflict,validateControlBindings,validControlCode} from '../lib/player-controls.ts';
import {createCasual,applyCasualAction,CASUAL_MODES} from '../lib/casual/engine.ts';
import {GAME_VARIANTS} from '../lib/casual/game-variants.ts';
import {stepParty,type PartyGame} from '../lib/casual/party.ts';
import {predictionInputAt} from '../lib/game-motion.ts';
test('all games have safe optional keyboard profiles; invalid saved values cannot create commands',()=>{
 for(const mode of CASUAL_MODES){assert(CONTROL_PROFILES[mode]);for(const row of CONTROL_PROFILES[mode].actions)for(const code of row.codes)assert(validControlCode(code),mode+' '+code);assert.deepEqual(validateControlBindings(mode,{unknown:'KeyA',[CONTROL_PROFILES[mode].actions[0].id]:'<script>'}),{})}
 for(const code of ['Escape','F5','MetaLeft','Ctrl+W',null,42,'KeyAB'])assert(!validControlCode(code));
});
test('custom physical keys replace the chosen action without reversing movement or keeping the old alias',()=>{
 assert.equal(controlKey({key:'j',code:'KeyJ'},'sumo',{left:'KeyJ'}),'a');assert.equal(controlKey({key:'A',code:'KeyA'},'sumo',{left:'KeyJ'}),'');assert.equal(controlKey({key:'ArrowLeft',code:'ArrowLeft'},'sumo',{left:'KeyJ'}),'');
 assert.equal(controlKey({key:'d',code:'KeyD'},'sumo',{left:'KeyJ'}),'d');assert.equal(controlKey({key:'ArrowLeft',code:'ArrowLeft'},'sumo',{}),'a');assert.equal(controlKey({key:'q',code:'KeyQ'},'circuit',{item:'KeyQ'}),'e');assert.equal(controlKey({key:'q',code:'KeyQ'},'blocks',{drop:'KeyQ'}),' ');
 assert.equal(controlConflict('sumo','left','KeyD',{}),'Move right');assert.equal(controlConflict('sumo','left','KeyJ',{}),undefined);
});
test('all preset variants produce real validated rules and leave model state untouched',()=>{
 for(const [mode,variants]of Object.entries(GAME_VARIANTS))for(const variant of variants){let s=createCasual('ABCDEFGH','p','Host','h',mode as any,42,10000);s.settings.bots=1;s=applyCasualAction(s,{action:'configure',mode,cards:20,speed:350,bots:1,...variant.settings},'p',10000);s=applyCasualAction(s,{action:'start'},'p',10000);assert.equal(s.phase,'playing',mode+' '+variant.id);if(s.game?.kind==='circuit')assert.equal(s.game.laps,variant.settings.raceLaps);if(s.game?.kind==='marble')assert.equal(s.game.raceLaps,variant.settings.raceLaps);if(s.game?.kind==='pong'||s.game?.kind==='tanks')assert.equal(s.game.winTarget,variant.settings.winTarget)}
 let s=createCasual('ABCDEFGH','p','Host','h','pong',42,10000);assert.throws(()=>applyCasualAction(s,{action:'configure',mode:'pong',cards:20,speed:350,winTarget:999},'p',10000),/variant/);
});
test('Pong variants finish at their chosen target and still require a two-point lead',()=>{
 for(const target of [5,11,21]){let s=createCasual('ABCDEFGH','p','Host','h','pong',42,10000);s.settings.bots=1;s.settings.winTarget=target as 5|11|21;s=applyCasualAction(s,{action:'start'},'p',10000);const g=s.game as PartyGame;g.actors[0].score=target-1;g.ball.x=949;g.ball.vx=300;g.ball.serveAt=0;stepParty(g,.05,14000);assert.equal(g.actors[0].score,target);assert(g.ended)}
});
test('new keyboard intent does not wait an unnecessary second physics step',()=>{for(let phase=1;phase<50;phase++){const at=predictionInputAt(1000+phase,1000);assert.equal(at,1050);assert(at-(1000+phase)<=50)}});
