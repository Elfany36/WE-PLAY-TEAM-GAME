import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createCasual,applyCasualAction,advanceCasual,publicCasual,casualCapacity,casualMinimum,type CasualState,type CasualMode} from '../lib/casual/engine.ts';
import {GENERAL_RANKS,generalChallenge,generalMoves,generalHome,publicGenerals,type GeneralsGame} from '../lib/casual/generals.ts';
import {FLEET_UNITS,fleetFits,fleetCells,publicFleet,type FleetGame} from '../lib/casual/fleet.ts';
import {chooseGeneralMove,chooseFleetShot} from '../lib/casual/hidden-bot-tactics.ts';
import {botDecision} from '../lib/casual/bot-pacing.ts';
import {casualBody} from '../lib/casual/api.ts';
import {localViewer} from '../lib/casual/local-view.ts';

const at=10000;
function setup(mode:CasualMode,options:Record<string,any>={}){let s=createCasual('ABCDEFGH','a','Alpha','hash-a',mode,42,at);s=applyCasualAction(s,{action:'join',id:'b',name:'Bravo',hash:'hash-b'},null,at);Object.assign(s.settings,options);return applyCasualAction(s,{action:'start'},'a',at)}
const act=(s:CasualState,id:string,action:string,extra:Record<string,any>={},now=at)=>applyCasualAction(s,{action,round:s.round,turn:(s.game as any).turn,...extra},id,now);
function deployed(mode:CasualMode,options:Record<string,any>={}){let s=setup(mode,options);for(const id of ['a','b'])s=act(s,id,mode==='generals'?'deploy-generals':'deploy-fleet');return s}

test('both hidden games have exactly two player seats, optional defaults, and private simultaneous deployment',()=>{
 for(const mode of ['generals','fleet'] as const){assert.equal(casualCapacity(mode),2);assert.equal(casualMinimum(mode),2);const s=setup(mode);assert.equal(s.game!.kind,mode);assert.equal((s.game as any).stage,'deploy');assert.equal(s.players[0].appearance,undefined);assert.throws(()=>act(s,'a',mode==='generals'?'move-generals':'fire-fleet',{from:60,to:51,cell:0}),/deploy|Arrange/)}
});
test('Generals generates all 21 ranks in valid, distinct home squares with opaque identities',()=>{
 const s=setup('generals'),g=s.game as GeneralsGame;assert.equal(g.pieces.length,42);
 for(const id of g.ids){const army=g.pieces.filter(p=>p.owner===id);assert.equal(new Set(army.map(p=>p.square)).size,21);assert(army.every(p=>generalHome(g,id,p.square)));for(const rank of GENERAL_RANKS)assert.equal(army.filter(p=>p.rank===rank.rank).length,rank.count)}
 const a=publicGenerals(g,'a'),b=publicGenerals(g,'b'),watch=publicGenerals(g,'watcher');assert.equal(a.pieces.length,21);assert.equal(b.pieces.length,21);assert.equal(watch.pieces.length,0);assert(!('pendingFlag'in a));assert(!('random'in a));
});
test('Generals arbiter implements rank order, Spy/Private, equal rank and attacking Flag exceptions',()=>{
 for(const a of GENERAL_RANKS)for(const b of GENERAL_RANKS){const expected=a.rank===0&&b.rank===0?1:a.rank===b.rank?0:a.rank===14?b.rank===1?-1:1:b.rank===14?a.rank===1?1:-1:a.rank>b.rank?1:-1;assert.equal(generalChallenge(a.rank,b.rank),expected,a.name+' versus '+b.name)}
 assert.equal(generalChallenge(14,13),1);assert.equal(generalChallenge(1,14),1);assert.equal(generalChallenge(0,0),1);assert.equal(generalChallenge(13,13),0);
});
test('Generals allows own setup swaps, locks deployment and validates orthogonal moves and stale turns',()=>{
 let s=setup('generals');const g=s.game as GeneralsGame,own=g.pieces.filter(p=>p.owner==='a'),first=own[0],second=own[1];s=act(s,'a','place-generals',{from:first.square,to:second.square});assert.equal((s.game as GeneralsGame).pieces.find(p=>p.id===first.id)!.square,second.square);assert.throws(()=>act(s,'a','place-generals',{from:second.square,to:0}),/home/);
 s=act(s,'a','deploy-generals');assert.throws(()=>act(s,'a','shuffle-generals'),/deployed/);assert.equal(localViewer(s),'b');s=act(s,'b','deploy-generals');let board=s.game as GeneralsGame;assert.equal(board.stage,'battle');assert(generalMoves(board,'a').length);const move=generalMoves(board,'a')[0];assert.throws(()=>act(s,'a','move-generals',{...move,turn:0}),/turn changed/);assert.throws(()=>act(s,'a','move-generals',{...move,to:move.from-10}),/one square/);s=act(s,'a','move-generals',move);assert.equal((s.game as GeneralsGame).currentId,'b');assert.throws(()=>act(s,'a','move-generals',move),/opponent/);
});
test('Generals challenge projection reveals neither winning nor removed enemy ranks',()=>{
 let s=deployed('generals'),g=s.game as GeneralsGame;g.pieces=[{id:'own',owner:'a',rank:1,square:40},{id:'secret',owner:'b',rank:14,square:31},{id:'own-flag',owner:'a',rank:0,square:70},{id:'enemy-flag',owner:'b',rank:0,square:1}];
 s=act(s,'a','move-generals',{from:40,to:31});g=s.game as GeneralsGame;assert(!g.pieces.some(p=>p.id==='secret'));assert.equal(g.captures.a,1);assert.equal(g.lastMove!.outcome,'attacker');const view=publicGenerals(g,'b');assert(view.pieces.filter(p=>p.owner==='a').every(p=>!('rank'in p)));assert(!JSON.stringify(s.events).includes('Spy'));assert(!JSON.stringify(s.events).includes('Private'));
});
test('Generals far-row Flag stays secret and must survive exactly the next opposing move',()=>{
 let s=deployed('generals'),g=s.game as GeneralsGame;g.pieces=[{id:'af',owner:'a',rank:0,square:9},{id:'ap',owner:'a',rank:1,square:60},{id:'bf',owner:'b',rank:0,square:8},{id:'bp',owner:'b',rank:1,square:20}];s=act(s,'a','move-generals',{from:9,to:0});g=s.game as GeneralsGame;assert.equal(s.phase,'playing');assert.equal(g.pendingFlag?.pieceId,'af');assert(!('pendingFlag'in publicGenerals(g,'b')));assert.equal(publicGenerals(g,'b').pieces.find(p=>p.id==='af')!.rank,undefined);s=act(s,'b','move-generals',{from:20,to:21});assert.equal(s.phase,'finished');assert.deepEqual(s.result!.winnerIds,['a']);
 let intercepted=deployed('generals'),ig=intercepted.game as GeneralsGame;ig.pieces=[{id:'af',owner:'a',rank:0,square:9},{id:'ap',owner:'a',rank:1,square:60},{id:'bf',owner:'b',rank:0,square:8},{id:'bp',owner:'b',rank:1,square:1}];intercepted=act(intercepted,'a','move-generals',{from:9,to:0});intercepted=act(intercepted,'b','move-generals',{from:1,to:0});assert.deepEqual(intercepted.result!.winnerIds,['b']);
});
test('an attacking Flag captures the defending Flag; equal officers both leave the board',()=>{
 for(const [a,b]of [[0,0],[8,8]]){let s=deployed('generals'),g=s.game as GeneralsGame;g.pieces=[{id:'one',owner:'a',rank:a,square:40},{id:'two',owner:'b',rank:b,square:31},{id:'safe-a',owner:'a',rank:1,square:60},{id:'safe-b',owner:'b',rank:1,square:3}];s=act(s,'a','move-generals',{from:40,to:31});assert.equal((s.game as GeneralsGame).pieces.some(p=>p.id==='two'),false);assert.equal((s.game as GeneralsGame).pieces.some(p=>p.id==='one'),a===0);if(a===0)assert.deepEqual(s.result!.winnerIds,['a'])}
});
test('Generals enemy rank permutations cannot affect own/spectator projections or fair AI decisions',()=>{
 const s=deployed('generals'),a=s.game as GeneralsGame,b=structuredClone(a),enemy=b.pieces.filter(p=>p.owner==='b'),ranks=enemy.map(p=>p.rank).reverse();enemy.forEach((p,i)=>p.rank=ranks[i]);
 for(const id of ['a','watcher'])assert.deepEqual(publicGenerals(a,id),publicGenerals(b,id));assert.deepEqual(chooseGeneralMove(publicGenerals(a,'a'),'a',{rng:13} as any),chooseGeneralMove(publicGenerals(b,'a'),'a',{rng:13} as any));
});
test('all fleet grid sizes generate five legal models with exactly 17 occupied tiles',()=>{
 for(const size of [8,10,12])for(let seed=1;seed<=40;seed++){const s=setup('fleet',{fleetSize:size});s.random=seed;const shuffled=act(s,'a','shuffle-fleet'),g=shuffled.game as FleetGame;for(const id of g.ids){const units=g.fleets[id];assert.equal(units.length,5);assert(units.every(p=>fleetFits(p,units,size)));assert.equal(new Set(units.flatMap(p=>fleetCells(p,size))).size,17)}}
});
test('fleet placement validates bounds, overlap, complete deployment and immutable ready fleets',()=>{
 let s=setup('fleet'),g=s.game as FleetGame;assert.throws(()=>act(s,'a','place-fleet',{unit:'carrier',x:9,y:9,vertical:false}),/grid/);const other=g.fleets.a.find(p=>p.id==='cruiser')!;assert.throws(()=>act(s,'a','place-fleet',{unit:'patrol',x:other.x,y:other.y,vertical:other.vertical}),/overlapping/);s=act(s,'a','clear-fleet');assert.throws(()=>act(s,'a','deploy-fleet'),/five/);s=act(s,'a','shuffle-fleet');s=act(s,'a','deploy-fleet');assert.throws(()=>act(s,'a','clear-fleet'),/locked/);assert.equal(localViewer(s),'b');
});
test('fleet hit keeps the turn, partial hits reveal no intact model, misses pass, and repeats fail',()=>{
 let s=deployed('fleet'),g=s.game as FleetGame,unit=g.fleets.b[0],cells=fleetCells(unit,g.size);s=act(s,'a','fire-fleet',{cell:cells[0]});g=s.game as FleetGame;assert.equal(g.currentId,'a');assert.equal(g.shots[0].hit,true);assert.equal(publicFleet(g,'a').fleets.b.length,0);assert.throws(()=>act(s,'a','fire-fleet',{cell:cells[0]}),/already searched/);for(const cell of cells.slice(1))s=act(s,'a','fire-fleet',{cell});g=s.game as FleetGame;assert.equal(g.shots.at(-1)!.sunk,'carrier');assert.equal(publicFleet(g,'a').fleets.b.length,1);assert.equal(publicFleet(g,'a').remaining.b,4);
 const all=new Set(g.fleets.b.flatMap(p=>fleetCells(p,g.size))),miss=Array.from({length:g.size*g.size},(_,i)=>i).find(n=>!all.has(n))!;s=act(s,'a','fire-fleet',{cell:miss});assert.equal((s.game as FleetGame).currentId,'b');assert.throws(()=>act(s,'a','fire-fleet',{cell:miss+1}),/opponent/);
});
test('classic alternating fleet fire passes after a hit, while destroying all five ends Streak',()=>{
 let classic=deployed('fleet',{fleetTurn:'alternate'});classic=act(classic,'a','fire-fleet',{cell:fleetCells((classic.game as FleetGame).fleets.b[0],10)[0]});assert.equal((classic.game as FleetGame).currentId,'b');
 let s=deployed('fleet');const g=s.game as FleetGame;for(const cell of g.fleets.b.flatMap(p=>fleetCells(p,g.size)))s=act(s,'a','fire-fleet',{cell});assert.equal(s.phase,'finished');assert.deepEqual(s.result!.winnerIds,['a']);assert.equal((s.game as FleetGame).shots.length,17);assert.equal(publicFleet(s.game as FleetGame,'a').remaining.b,0);
});
test('fleet hidden placements cannot affect own/spectator projection or fair target selection',()=>{
 const s=deployed('fleet'),a=s.game as FleetGame,b=structuredClone(a),fresh=setup('fleet');fresh.random=712;const changed=act(fresh,'b','shuffle-fleet');b.fleets.b=(changed.game as FleetGame).fleets.b;
 for(const id of ['a','watcher'])assert.deepEqual(publicFleet(a,id),publicFleet(b,id));assert.deepEqual(chooseFleetShot(publicFleet(a,'a'),'a',{rng:88} as any),chooseFleetShot(publicFleet(b,'a'),'a',{rng:88} as any));
});
test('deployment AI prepares even while a human is current, then pacing follows battle turns',()=>{
 for(const mode of ['generals','fleet'] as const){let s=createCasual('ABCDEFGH','a','Alpha','h',mode,42,at);s.settings.bots=1;s=applyCasualAction(s,{action:'start'},'a',at);const bot=s.players.find(p=>p.bot)!.id;assert.equal(botDecision(s,at)?.playerId,bot);for(let n=1;n<=5;n++)s=advanceCasual(s,at+n*1000).state;assert((s.game as any).ready[bot],mode+' bot did not deploy');s=act(s,'a',mode==='generals'?'deploy-generals':'deploy-fleet',{},at+6000);assert.equal((s.game as any).stage,'battle');}
});
test('a spectator host can run two fair AI commanders without a deployment deadlock',()=>{
 for(const mode of ['generals','fleet'] as const){let s=createCasual('ABCDEFGH','watch','Watcher','h',mode,77,at);s=applyCasualAction(s,{action:'role',role:'spectator'},'watch',at);s.settings.bots=2;s=applyCasualAction(s,{action:'start'},'watch',at);for(let n=1;n<=12;n++)s=advanceCasual(s,at+n*1000).state;assert.equal((s.game as any).stage,'battle');assert.equal(s.players.filter(p=>p.bot).length,2);assert.equal(s.ai?.rejected||0,0);const view=publicCasual(s,'watch',at+12000);if(mode==='generals')assert(view.game.pieces.every((p:any)=>p.rank===undefined));else assert(Object.values(view.game.fleets).every((units:any)=>units.length===0))}
});
test('timed Generals forfeits, fleet clocks pass, and courtesy, leave and spectators are guarded',()=>{
 let generals=deployed('generals',{tacticalSeconds:30});generals=advanceCasual(generals,at+30001).state;assert.deepEqual(generals.result!.winnerIds,['b']);let fleet=deployed('fleet',{tacticalSeconds:30});fleet=advanceCasual(fleet,at+30001).state;assert.equal((fleet.game as FleetGame).currentId,'b');assert.equal(fleet.phase,'playing');
 for(const mode of ['generals','fleet'] as const){let s=setup(mode);s=act(s,'a','draw-hidden');s=act(s,'b','draw-hidden');assert.equal(s.phase,'finished');assert.deepEqual(s.result!.winnerIds,[]);s=setup(mode);s=act(s,'a','leave');assert.deepEqual(s.result!.winnerIds,['b']);s=setup(mode);s=applyCasualAction(s,{action:'join',id:'w',name:'Watcher',hash:'h',role:'spectator'},null,at);assert.throws(()=>act(s,'w',mode==='generals'?'deploy-generals':'deploy-fleet'),/Spectators/);const view=publicCasual(s,'w',at);assert.equal(mode==='generals'?view.game.pieces.length:view.game.fleets.a.length,0)}
});
test('tactical HTTP bodies preserve bounded fields and current round/turn guards',async()=>{
 const read=(body:Record<string,any>)=>casualBody(new Request('https://example.com/api/casual',{method:'POST',body:JSON.stringify({code:'ABCDEFGH',requestId:'hidden-test-request',round:1,turn:1,...body})}));
 assert.equal((await read({action:'move-generals',from:40,to:31})).to,31);assert.equal((await read({action:'fire-fleet',cell:99})).cell,99);assert.equal((await read({action:'place-fleet',unit:'carrier',x:2,y:3,vertical:true})).vertical,true);assert.equal((await read({action:'deploy-generals',turn:0})).round,1);
 await assert.rejects(read({action:'fire-fleet',cell:144}),/tile/);await assert.rejects(read({action:'move-generals',from:10,to:20,turn:0}),/turn/);await assert.rejects(read({action:'place-fleet',unit:'fake',x:0,y:0,vertical:false}),/model/);await assert.rejects(read({action:'create',mode:'fleet',name:'Captain',fleetSize:99}),/setting/);
});
