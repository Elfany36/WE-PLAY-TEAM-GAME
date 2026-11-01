import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createCasual,applyCasualAction,advanceCasual,publicCasual,type CasualMode,type MemoryGame} from '../lib/casual/engine.ts';
import {advanceBots} from '../lib/casual/bots.ts';
import {botDelay} from '../lib/casual/bot-pacing.ts';
import {chooseBoardMove,chooseUnoMove} from '../lib/casual/board-bot-tactics.ts';
import {botProfile} from '../lib/casual/bot-fairness.ts';
import {strategyMoves,type StrategyGame} from '../lib/casual/strategy.ts';
import {type UnoGame,unoDeck} from '../lib/casual/uno.ts';
import {type PoolGame} from '../lib/casual/pool.ts';
import {appendChat} from '../lib/room-chat.ts';
import {CHAT_GIFS} from '../lib/chat-media.ts';
import {casualTickDelay} from '../lib/casual/room-timing.ts';
import {nameInitial,chatDraft} from '../lib/text-presentation.ts';
const N=10000;
test('chat limits and player initials preserve whole emoji and joined graphemes',()=>{assert.equal(nameInitial('🌟 Nova'),'🌟');assert.equal(nameInitial('👩‍🚀 Captain'),'👩‍🚀');assert.equal(chatDraft('a'.repeat(279)+'🔥'),'a'.repeat(279));assert.equal(chatDraft('a'.repeat(278)+'🔥'),'a'.repeat(278)+'🔥');assert.equal(chatDraft('a'.repeat(277)+'👩‍🚀'),'a'.repeat(277))});
function start(mode:CasualMode){const s=createCasual('ABCDEFGH','human','Human','hash',mode,71991,N);s.settings.bots=1;return applyCasualAction(s,{action:'start'},'human',N)}

test('idle tables sleep between decisions while moving simulations retain their 50ms step',()=>{
 const pool=start('pool');assert.equal(casualTickDelay(pool,N),1000);(pool.game as PoolGame).moving=true;assert.equal(casualTickDelay(pool,N),50);
 for(const mode of ['snake','circuit','terra','tanks','sumo','marble','pong','blocks'] as const)assert.equal(casualTickDelay(start(mode),N),50);
 let memory=start('memory');(memory.game as MemoryGame).currentId=memory.players[1].id;assert(casualTickDelay(memory,N)<=50);memory=advanceCasual(memory,N).state;assert.equal(casualTickDelay(memory,N),1000);assert(casualTickDelay(memory,memory.ai!.wait!.readyAt-70)<=70);
});

for(const mode of ['memory','uno','chess','dama','scidama','pool'] as const)test(mode+' waits at least one second for a fresh bot decision even when its old timer expired',()=>{
 let s=start(mode),g=s.game!;if(!('currentId'in g))throw Error('turn game required');
 if(mode==='chess'||mode==='dama'||mode==='scidama')s.players.find(p=>p.id===g.currentId)!.bot=true;
 else g.currentId=s.players.find(p=>p.bot)!.id;
 s.ai!.nextAt=1;const began=N+5000,before=JSON.stringify(g);
 s=advanceCasual(s,began).state;
 assert.equal(JSON.stringify(s.game),before);assert.equal(s.ai!.cursor,0);
 const deadline=s.ai!.wait!.readyAt;assert(deadline>=began+1000&&deadline<=began+3000);
 assert.equal(advanceCasual(s,deadline-1).changed,false);assert.equal(advanceCasual(s,deadline-1).state,s);
 const view=publicCasual(s,'human',began);assert.equal(view.botThinking?.playerId,g.currentId);assert(!JSON.stringify(view).includes('profiles'));
 s=advanceCasual(s,deadline).state;assert.equal(s.ai!.cursor,1);assert.equal(s.ai?.rejected||0,0,s.ai?.lastError);
});

test('a human chess move starts its own bot wait instead of reusing a stale room clock',()=>{
 let s=start('chess');const at=N+5000;
 s=applyCasualAction(s,{action:'move-board',from:'e2',to:'e4',turn:1,round:s.round},'human',at);
 s=advanceCasual(s,at+25).state;assert.equal((s.game as StrategyGame).turn,2);
 const deadline=s.ai!.wait!.readyAt;assert(deadline>=at+1000);
 for(let t=at+50;t<deadline;t+=50){const update=advanceCasual(s,t);assert.equal(update.changed,false);assert.equal((update.state.game as StrategyGame).turn,2)}
 s=advanceCasual(s,deadline).state;assert.equal((s.game as StrategyGame).turn,3);
});

test('Memory pauses again between its two flips and after a matched pair',()=>{
 const s=start('memory'),g=s.game as MemoryGame;g.currentId=s.players[1].id;
 const dispatch=(id:string,a:any)=>applyCasualAction(s,a,id,clock,true);let clock=N+5000;
 advanceBots(s,clock,dispatch);clock=s.ai!.wait!.readyAt;advanceBots(s,clock,dispatch);assert.equal(g.revealed.length,1);
 const firstAt=clock;clock+=50;advanceBots(s,clock,dispatch);assert(s.ai!.wait!.readyAt>=firstAt+1000);
 clock=s.ai!.wait!.readyAt;advanceBots(s,clock,dispatch);assert.equal(g.moves,1);
 // A keep-turn match also needs a fresh wait, regardless of the old polling clock.
 g.resolveAt=null;g.revealed=[];g.turn++;delete s.ai!.wait;clock+=50;const cursor=s.ai!.cursor;advanceBots(s,clock,dispatch);assert.equal(s.ai!.cursor,cursor);assert(s.ai!.wait!.readyAt>=clock+1000);
});

test('pool waits for all balls to settle before starting its thinking time',()=>{
 let s=start('pool');const g=s.game as PoolGame;g.currentId=s.players[1].id;
 g.moving=true;g.shot={by:g.currentId,at:N,first:1,potted:[{number:1,pocket:0}],rails:[1],called:0,break:true,eightEligible:false};g.lastTickAt=N;g.balls.forEach(b=>b.vx=b.vy=0);g.balls.find(b=>b.number===1)!.pocketed=true;assert.equal(advanceCasual(s,N+49).changed,false);
 s=advanceCasual(s,N+50).state;assert.equal((s.game as PoolGame).moving,false);assert.equal(s.ai!.cursor,0);
 assert(s.ai!.wait);assert(s.ai!.wait.readyAt>=N+1050);
});

test('pacing varies in the requested range and tactics vary without consuming the game RNG',()=>{
 const delays=new Set<number>(),styles=new Set<string>(),moves=new Set<string>();
 const s=start('chess'),g=s.game as StrategyGame,random=s.random;
 for(let seed=1;seed<=24;seed++){const brain={rng:seed*7919};delays.add(botDelay(brain));styles.add(botProfile(brain,'bot-'+seed).style);const move=chooseBoardMove(g,brain);assert(move);assert(strategyMoves(g).some(m=>m.from===move.from&&m.to===move.to));moves.add(move.from+move.to)}
 assert([...delays].every(n=>n>=1000&&n<=3000));assert(delays.size>15);assert(styles.size>=3);assert(moves.size>=3);assert.equal(s.random,random);
});

test('UNO tactical choices depend on its own hand and public opponent counts, never unseen faces',()=>{
 const a=start('uno'),g=a.game as UnoGame,id=a.players[1].id,deck=unoDeck();g.currentId=id;g.initialWild=false;g.pending=null;g.drawnId=null;g.color='red';g.discard=[deck.find(c=>c.id==='red-0')!];g.hands[id]=[deck.find(c=>c.id==='red-2-0')!,deck.find(c=>c.id==='red-skip-0')!,deck.find(c=>c.id==='blue-3-0')!];a.ai!.rng=99123;
 const b=structuredClone(a);(b.game as UnoGame).hands.human=(b.game as UnoGame).hands.human.map((c,i)=>({...c,color:i%2?'blue':'green',face:'9'}));
 assert.deepEqual(chooseUnoMove(a,g,id),chooseUnoMove(b,b.game as UnoGame,id));
});

test('chat decorations are bounded identifiers and safe text while legacy messages keep their format',()=>{
 const normal=appendChat([], 'p','Player','<img onerror=alert(1)> **hello**','normal-id',N)[0];assert.equal(normal.text,'<img onerror=alert(1)> **hello**');assert.equal(normal.gifId,undefined);
 const animated=appendChat([], 'p','Player','Great move','animated-id',N,undefined,{gifId:'star',effect:'gold'})[0];assert.equal(animated.gifId,'star');assert.equal(animated.effect,'gold');
 assert.throws(()=>appendChat([], 'p','Player','x','invalid-id',N,undefined,{gifId:'https://evil.test/x.gif'}));assert.throws(()=>appendChat([], 'p','Player','x','invalid-id',N,undefined,{effect:'<script>'}));assert.throws(()=>appendChat([], 'p','Player','x','invalid-id',N,'star',{gifId:'star'}));
 for(const gif of CHAT_GIFS){const bytes=readFileSync('public/chat-art/'+gif.id+'.gif');assert.equal(bytes.subarray(0,6).toString(),'GIF89a');assert(bytes.length<25000);assert(readFileSync('public/chat-art/'+gif.id+'.png').length<20000)}
});
