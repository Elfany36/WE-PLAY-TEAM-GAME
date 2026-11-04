import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createCasual,applyCasualAction,publicCasual,type CasualState} from '../lib/casual/engine.ts';
import {SOLITAIRE_VARIANTS,canSolMove,solPairOptions,solCards,solitaireProgress,solSuit,type SolitaireGame,type SolBoard,type SolitaireVariant} from '../lib/casual/solitaire.ts';
const N=100000,c=(rank:number,suit=0)=>rank+suit*13;
function start(variant:SolitaireVariant='klondike',players=1){let s=createCasual('ABCDEFGH','one','One','one-hash','solitaire',91,N);s.settings.solitaireVariant=variant;for(let i=1;i<players;i++)s=applyCasualAction(s,{action:'join',id:'p'+i,name:'Player '+i,hash:'hash'+i},null,N);return applyCasualAction(s,{action:'start'},'one',N)}
function board(columns=7):SolBoard{return{columns:Array.from({length:columns},()=>[]),stock:[],waste:[],foundations:Array.from({length:4},()=>[]),cells:[null,null,null,null],removed:0,passes:1,moves:0,version:0,status:'playing',history:[]}}
function act(s:CasualState,action:string,extra:Record<string,unknown>={},id='one'){const g=s.game as SolitaireGame;return applyCasualAction(s,{action,round:s.round,boardVersion:g.boards[id]?.version,...extra},id,N+10)}
test('all eight Solitaire variants deal complete unique decks with their correct face-up and stock counts',()=>{
 for(const variant of SOLITAIRE_VARIANTS){const s=start(variant),g=s.game as SolitaireGame,b=g.boards.one,all=[...b.columns.flat(),...b.stock,...b.waste].map(Math.abs);assert.equal(all.length,variant.startsWith('spider')?104:52);assert.equal(new Set(all).size,all.length);assert.equal(b.columns.flat().filter(c=>c<0).length,variant.startsWith('spider')?44:variant==='freecell'||variant==='pyramid'?0:variant==='tripeaks'?18:21);assert.equal(b.stock.length,variant.startsWith('spider')?50:variant==='freecell'?0:variant==='tripeaks'?23:24);assert.equal(g.deadline,Number.MAX_SAFE_INTEGER)}
 assert.equal(solSuit(14,'spider-two'),1);assert.equal(solSuit(104,'spider-one'),0);
});
test('same-deal races keep boards independent and never expose stock order, hidden identities or undo history',()=>{
 let s=start('klondike',2),g=s.game as SolitaireGame;assert.deepEqual(g.boards.one.columns,g.boards.p1.columns);const other=structuredClone(g.boards.p1);s=act(s,'sol-draw');g=s.game as SolitaireGame;assert.deepEqual(g.boards.p1,other);assert.equal(g.boards.one.waste.length,1);
 const p=publicCasual(s,'one',N).game;assert(!('deal'in p));for(const b of Object.values(p.boards) as {stock:number[];columns:number[][];history?:unknown}[]){assert(b.stock.every(c=>c===0));assert(b.columns.flat().every(c=>c>=0));assert(!('history'in b))}assert.equal(p.boards.p1.undoCount,0);
});
test('Klondike enforces alternating descending runs, King-only empty columns and ascending suited foundations',()=>{
 const b=board();b.columns[0]=[c(13),c(12,1),c(11,3)];b.columns[1]=[c(13,2)];b.columns[2]=[c(12)];b.waste=[c(1,1)];
 assert(canSolMove(b,'klondike',{from:{zone:'tableau',index:0,offset:0},to:{zone:'tableau',index:3}}));assert(!canSolMove(b,'klondike',{from:{zone:'tableau',index:0,offset:1},to:{zone:'tableau',index:3}}));assert(canSolMove(b,'klondike',{from:{zone:'tableau',index:2},to:{zone:'tableau',index:1}}));assert(!canSolMove(b,'klondike',{from:{zone:'tableau',index:0,offset:1},to:{zone:'tableau',index:1}}));assert(canSolMove(b,'klondike',{from:{zone:'waste',index:0},to:{zone:'foundation',index:1}}));assert(!canSolMove(b,'klondike',{from:{zone:'waste',index:0},to:{zone:'foundation',index:0}}));
});
test('pair removal cannot bypass tableau and foundation rules in Klondike, FreeCell or Spider',()=>{
 for(const variant of ['klondike','freecell','spider-one'] as const){const s=start(variant),g=s.game as SolitaireGame;g.boards.one=board();g.boards.one.columns[0]=[13];const before=structuredClone(g.boards.one);assert.throws(()=>act(s,'sol-remove',{cards:[{zone:'tableau',index:0}]}),/only in Pyramid/);assert.deepEqual(g.boards.one,before)}
});
test('draw-three, waste recycling and undo preserve exact order without shuffling or stale replay',()=>{
 let s=start('klondike-three'),g=s.game as SolitaireGame;g.boards.one.stock=[1,2,3,4];g.boards.one.waste=[];s=act(s,'sol-draw');g=s.game as SolitaireGame;assert.deepEqual(g.boards.one.waste,[4,3,2]);s=act(s,'sol-draw');s=act(s,'sol-draw');g=s.game as SolitaireGame;assert.deepEqual(g.boards.one.stock,[1,2,3,4]);assert.deepEqual(g.boards.one.waste,[]);s=act(s,'sol-undo');g=s.game as SolitaireGame;assert.deepEqual(g.boards.one.waste,[4,3,2,1]);assert.equal(g.boards.one.stock.length,0);assert.throws(()=>act(s,'sol-draw',{boardVersion:0}),/changed/);
});
test('exposing a hidden card and undo restore the complete previous position',()=>{
 let s=start(),g=s.game as SolitaireGame;g.boards.one=board();g.boards.one.columns[0]=[-c(8,1),c(13)];s=act(s,'sol-move',{from:{zone:'tableau',index:0,offset:1},to:{zone:'tableau',index:1}});g=s.game as SolitaireGame;assert.deepEqual(g.boards.one.columns[0],[c(8,1)]);s=act(s,'sol-undo');g=s.game as SolitaireGame;assert.deepEqual(g.boards.one.columns[0],[-c(8,1),c(13)]);assert.deepEqual(g.boards.one.columns[1],[]);
});
test('FreeCell supermoves exclude an empty destination from helper columns',()=>{
 const b=board(8);b.columns[0]=Array.from({length:10},(_,i)=>c(10-i,i%2));b.columns[1]=[c(11,1)];for(let i=3;i<8;i++)b.columns[i]=[c(13,i%4)];
 const from={zone:'tableau' as const,index:0,offset:0};assert(canSolMove(b,'freecell',{from,to:{zone:'tableau',index:1}}));assert(!canSolMove(b,'freecell',{from,to:{zone:'tableau',index:2}}));b.cells[0]=c(2,3);assert(!canSolMove(b,'freecell',{from,to:{zone:'tableau',index:1}}));
});
test('Spider transfers same-suit runs only, allows single cards across suits, and forbids stock deals into empty columns',()=>{
 const b=board(10);b.columns[0]=[c(13),c(12,1)];b.columns[1]=[c(13,2)];assert(!canSolMove(b,'spider-four',{from:{zone:'tableau',index:0,offset:0},to:{zone:'tableau',index:2}}));assert(canSolMove(b,'spider-four',{from:{zone:'tableau',index:0,offset:1},to:{zone:'tableau',index:1}}));let s=start('spider-one');(s.game as SolitaireGame).boards.one.columns[0]=[];assert.throws(()=>act(s,'sol-draw'),/Fill every/);
});
test('Spider automatically removes a complete suited King-to-Ace run',()=>{
 let s=start('spider-one'),g=s.game as SolitaireGame;g.boards.one=board(10);g.boards.one.columns[0]=Array.from({length:12},(_,i)=>13-i);g.boards.one.columns[1]=[1];s=act(s,'sol-move',{from:{zone:'tableau',index:1},to:{zone:'tableau',index:0}});g=s.game as SolitaireGame;assert.equal(g.boards.one.removed,13);assert.equal(g.boards.one.columns[0].length,0);assert.equal(solitaireProgress(g.boards.one,g.variant),13);
});
test('Pyramid requires both cards to be uncovered before a pair and clears Kings singly',()=>{
 let s=start('pyramid'),g=s.game as SolitaireGame;g.boards.one=board(28);g.boards.one.columns[0]=[5];g.boards.one.columns[1]=[8];assert(!solPairOptions(g.boards.one,'pyramid').some(p=>p.some(v=>v.index===0)));assert.throws(()=>act(s,'sol-remove',{cards:[{zone:'tableau',index:0},{zone:'tableau',index:1}]}),/uncovered/);g.boards.one.columns=Array.from({length:28},()=>[]);g.boards.one.columns[27]=[13];s=act(s,'sol-remove',{cards:[{zone:'tableau',index:27}]});assert.equal(s.phase,'finished');assert.deepEqual(s.result?.winnerIds,['one']);
});
test('Pyramid permits three passes, while TriPeaks wraps Ace/King without redeals',()=>{
 let s=start('pyramid'),g=s.game as SolitaireGame;g.boards.one.stock=[];g.boards.one.waste=[2,4,8];g.boards.one.passes=2;s=act(s,'sol-draw');assert.equal((s.game as SolitaireGame).boards.one.passes,3);g=s.game as SolitaireGame;g.boards.one.stock=[];g.boards.one.waste=[2,4,8];assert.throws(()=>act(s,'sol-draw'),/No cards/);
 s=start('tripeaks');g=s.game as SolitaireGame;g.boards.one=board(28);g.boards.one.waste=[1];g.boards.one.columns[18]=[13];assert.equal(solPairOptions(g.boards.one,'tripeaks').length,1);s=act(s,'sol-remove',{cards:[{zone:'tableau',index:18}]});assert.equal(s.phase,'finished');
});
test('a blocked solo deal remains undoable/restartable, and observers cannot move cards',()=>{
 let s=start('tripeaks'),g=s.game as SolitaireGame;g.boards.one=board(28);g.boards.one.columns[18]=[3];g.boards.one.columns[19]=[9];g.boards.one.waste=[2];s=act(s,'sol-remove',{cards:[{zone:'tableau',index:18}]});assert.equal((s.game as SolitaireGame).boards.one.status,'stuck');assert.equal(s.phase,'playing');s=act(s,'sol-undo');assert.equal((s.game as SolitaireGame).boards.one.status,'playing');s=act(s,'sol-restart');assert.equal((s.game as SolitaireGame).boards.one.stock.length,23);
 s=applyCasualAction(s,{action:'join',id:'watcher',name:'Watcher',hash:'watcher-hash',role:'spectator'},null,N+20);assert.throws(()=>act(s,'sol-draw',{boardVersion:0},'watcher'),/Spectators/);
});
test('the last player leaving an untimed Solitaire deal finishes it for remaining spectators',()=>{
 let s=start();s=applyCasualAction(s,{action:'join',id:'watcher',name:'Watcher',hash:'watcher-hash',role:'spectator'},null,N+20);s=applyCasualAction(s,{action:'leave'},'one',N+30);assert.equal(s.phase,'finished');assert.equal(s.hostId,'watcher');assert.deepEqual(s.result?.winnerIds,[]);
 s=start('tripeaks',2);const g=s.game as SolitaireGame;g.boards.p1.status='stuck';s=applyCasualAction(s,{action:'leave'},'one',N+30);assert.equal(s.phase,'playing');assert.equal((s.game as SolitaireGame).boards.p1.status,'stuck');s=act(s,'sol-restart',{},'p1');assert.equal((s.game as SolitaireGame).boards.p1.status,'playing');
});
test('forged shape offsets cannot corrupt a TriPeaks waste card or remove a Pyramid card',()=>{
 for(const variant of ['tripeaks','pyramid'] as const){let s=start(variant);const g=s.game as SolitaireGame,b=g.boards.one;b.columns=Array.from({length:28},()=>[]);b.columns[21]=[variant==='pyramid'?13:7];b.waste=[6];const before=structuredClone(b);assert.throws(()=>act(s,'sol-remove',{cards:[{zone:'tableau',index:21,offset:1}]}),/without a stack offset/);assert.deepEqual(b,before);s=act(s,'sol-remove',{cards:[{zone:'tableau',index:21}]});assert((s.game as SolitaireGame).boards.one.waste.every(Number.isFinite))}
});
test('the first completed race board wins and cannot be modified by another player',()=>{
 let s=start('freecell',2),g=s.game as SolitaireGame,b=g.boards.one;b.columns=Array.from({length:8},()=>[]);b.stock=[];b.waste=[];b.cells.fill(null);b.foundations=Array.from({length:4},(_,suit)=>Array.from({length:suit===0?12:13},(_,i)=>c(i+1,suit)));b.columns[0]=[13];s=act(s,'sol-move',{from:{zone:'tableau',index:0},to:{zone:'foundation',index:0}});assert.equal(s.phase,'finished');assert.deepEqual(s.result?.winnerIds,['one']);assert.equal((s.game as SolitaireGame).boards.p1.version,0);assert.equal(solCards((s.game as SolitaireGame).boards.one,{zone:'foundation',index:0})[0],13);
});
