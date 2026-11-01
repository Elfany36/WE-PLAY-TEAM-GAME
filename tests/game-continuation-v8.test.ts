import test from 'node:test';
import assert from 'node:assert/strict';
import {createCasual,applyCasualAction,advanceCasual,type CasualMode} from '../lib/casual/engine.ts';
import {advanceBots} from '../lib/casual/bots.ts';
import {flipDeck} from '../lib/casual/flip.ts';
import {unoDeck,type UnoGame} from '../lib/casual/uno.ts';
import {squarePoint,type BoardPiece,type StrategyGame} from '../lib/casual/strategy.ts';
import {strategyMotionPath,strategyMotionTiming} from '../lib/casual/board-animation.ts';
import {localViewer} from '../lib/casual/local-view.ts';

const now=Date.now();
function room(mode:CasualMode,bots=1,flip=false){
 let state=createCasual('ABCDEFGH','human','Human','hash',mode,7123,now);
 state.settings.bots=bots;state.settings.unoFlip=flip;
 return applyCasualAction(state,{action:'start'},'human',now);
}

for(const flip of [false,true])test(`${flip?'Flip':'Classic UNO'} retains bot seats, scores and dealer rotation between hands`,()=>{
 let state=room('uno',2,flip),game=state.game as UnoGame;
 const bots=state.players.filter(p=>p.bot).map(p=>p.id);
 game.scores={human:110,[bots[0]]:240,[bots[1]]:90};
 game.dealerId=bots[0];state.phase='finished';
 state=applyCasualAction(state,{action:'start'},'human',now+1000);
 game=state.game as UnoGame;
 assert.deepEqual(state.players.filter(p=>p.bot).map(p=>p.id),bots);
 assert.deepEqual(game.scores,{human:110,[bots[0]]:240,[bots[1]]:90});
 assert.equal(game.dealerId,bots[1]);assert.equal(game.handNumber,2);
 game.matchWinner=bots[0];state.phase='finished';
 state=applyCasualAction(state,{action:'start'},'human',now+2000);
 game=state.game as UnoGame;
 assert.equal(game.handNumber,1);assert(Object.values(game.scores).every(n=>n===0));
});

test('Flip bot plays a legal number instead of a penalty Wild while holding another uncolored card',()=>{
 const state=room('uno',1,true),game=state.game as UnoGame,id=state.players.find(p=>p.bot)!.id;
 const deck=flipDeck(),penalties=deck.filter(c=>c.face==='wild2'),blue=deck.find(c=>c.face==='5'&&c.color==='blue')!,top=deck.find(c=>c.face==='5'&&c.color==='red')!;
 game.currentId=id;game.hands[id]=[penalties[0],penalties[1],blue];game.discard=[top];game.color='red';
 game.initialWild=false;game.pending=null;game.drawnId=null;state.ai!.nextAt=0;
 let chosen='';advanceBots(state,now+1000,(player,action)=>{
  chosen=action.cardId;applyCasualAction(state,action,player,now+1000,true);
 });
 assert.equal(chosen,blue.id);assert.equal(game.pending,null);
 assert.equal(game.lastPlay?.card.id,blue.id);assert.equal(state.ai?.rejected||0,0);
});

test('Sci-Dama bot minimizes its signed consumption difference',()=>{
 const state=room('scidama'),game=state.game as StrategyGame;
 state.players.find(p=>p.id===game.whiteId)!.bot=true;
 const piece=(square:string,owner:string,value:number):BoardPiece=>({id:square,owner,...squarePoint(square),type:'man',king:false,value});
 game.pieces=[piece('g4',game.whiteId,5),piece('c4',game.whiteId,5),piece('b5',game.blackId,110),piece('d5',game.blackId,5),piece('g6',game.blackId,25),piece('e2',game.blackId,110)];
 game.currentId=game.whiteId;state.ai!.nextAt=0;
 advanceBots(state,now+1000,(id,action)=>{applyCasualAction(state,action,id,now+1000,true)});
 assert.deepEqual(game.lastMove?.path,['c4','e6']);
 assert.equal(game.lastMove?.calculations[0].points,10);
 assert.equal(state.ai?.rejected||0,0);
});

test('adjacent UNO bots expose one turn per think instead of skipping three turns in one update',()=>{
 let state=room('uno',3),game=state.game as UnoGame;
 const bots=state.players.filter(p=>p.bot).map(p=>p.id),deck=unoDeck();
 for(const [index,id]of bots.entries())game.hands[id]=[1,2,3].map(n=>deck.find(c=>c.id===`red-${index*3+n}-0`)!);
 game.discard=[deck.find(c=>c.id==='red-0')!];game.color='red';game.direction=1;game.currentId=bots[0];game.initialWild=false;game.pending=null;game.drawnId=null;state.ai!.nextAt=0;
 state=advanceCasual(state,now+1000).state;game=state.game as UnoGame;
 assert.equal(game.turn,2);assert.equal(game.lastPlay?.playerId,bots[0]);assert.equal(state.ai!.cursor,1);
 const nextThink=state.ai!.nextAt;assert(nextThink>=now+1900&&nextThink<now+2400);const unchanged=advanceCasual(state,nextThink-1);assert.equal(unchanged.changed,false);
 state=advanceCasual(state,nextThink).state;game=state.game as UnoGame;
 assert.equal(game.turn,3);assert.equal(game.lastPlay?.playerId,bots[1]);assert.equal(state.ai!.cursor,2);
});

test('local turns and review state never expose or grant controls for a computer seat',()=>{
 for(const mode of ['uno','memory','ladders','chess','dama','scidama','property'] as const){
  const state=room(mode),game=state.game!,bot=state.players.find(p=>p.bot)!.id;
  assert('currentId'in game);game.currentId=bot;
  assert.equal(localViewer(state),'human',mode);
  assert.equal(localViewer(state,bot,bot),'human',mode);
  game.currentId='human';assert.equal(localViewer(state),'human',mode);
 }
});

test('local pass-and-play retains human turn, property view and private review selection',()=>{
 let state=createCasual('ABCDEFGH','human','Human','hash','uno',7123,now);
 state=applyCasualAction(state,{action:'join',id:'friend',name:'Friend',hash:'friend-hash'},null,now);
 state=applyCasualAction(state,{action:'start'},'human',now);
 (state.game as UnoGame).currentId='friend';assert.equal(localViewer(state),'friend');
 assert.equal(localViewer(state,null,'human'),'human');
 state.mode='property';state.phase='finished';state=applyCasualAction(state,{action:'start'},'human',now+1000);
 assert.equal(localViewer(state,'friend'),'friend');
});

test('strategy snapshots start partway through a move and never replay completed movement',()=>{
 assert.deepEqual(strategyMotionTiming(1000,1080,2,100),{duration:320,age:130,complete:false});
 assert.equal(strategyMotionTiming(1000,1400,2).complete,true);
 assert.equal(strategyMotionTiming(1000,1000,13).duration,680);
 assert.equal(strategyMotionTiming(1000,1000,2,2000).age,400);
 assert.equal(strategyMotionTiming(1000,900,2,-100).age,0);
});

test('strategy animation includes the castling rook on either side and leaves unrelated pieces still',()=>{
 const piece=(id:string,type:string,square:string,owner='white'):BoardPiece=>({id,type,...squarePoint(square),owner,king:false,value:0});
 const move:NonNullable<StrategyGame['lastMove']>={path:['e1','g1'],pieceId:'king',captures:[],at:1000,notation:'O-O',calculations:[]};
 const king=piece('king','k','g1');
 assert.deepEqual(strategyMotionPath(king,move,king),['e1','g1']);
 assert.deepEqual(strategyMotionPath(piece('rook','r','f1'),move,king),['h1','f1']);
 assert.equal(strategyMotionPath(piece('other','r','d1'),move,king),null);
 assert.equal(strategyMotionPath(piece('opponent','r','f1','black'),move,king),null);
 const black=piece('king','k','c8','black'),queenSide={...move,path:['e8','c8']};
 assert.deepEqual(strategyMotionPath(piece('rook','r','d8','black'),queenSide,black),['a8','d8']);
});
