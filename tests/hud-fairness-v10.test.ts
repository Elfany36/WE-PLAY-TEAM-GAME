import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {botRandom,observeCards,recallCard,type FairBrain} from '../lib/casual/bot-fairness.ts';
import {createCasual,applyCasualAction,advanceCasual,publicCasual,type MemoryGame} from '../lib/casual/engine.ts';
import {advanceBots} from '../lib/casual/bots.ts';
import {turnNotice} from '../lib/casual/turn-notice.ts';
import {predictionWindow,renderFrameDue,GameClock} from '../lib/game-motion.ts';
import {cloneActionGame,stepActionPrediction} from '../lib/casual/action-motion.ts';
import type {CircuitGame} from '../lib/casual/circuit.ts';
const now=Date.now();
function state(mode:any,bots=1){const s=createCasual('ABCDEFGH','human','Human','hash',mode,7123,now);s.settings.bots=bots;return applyCasualAction(s,{action:'start'},'human',now)}
test('memory observations are separate, limited, fallible, expire and never read unopened faces',()=>{
 const deck=Array.from({length:40},(_,key)=>({key,matchedBy:null as string|null})),brain:FairBrain={rng:1729};
 for(let i=0;i<40;i++){observeCards(brain,['a','b'],deck,[i],now+i*100);observeCards(brain,['a','b'],deck,[],now+i*100+1)}
 assert(Object.keys(brain.memories!.a.known).length<=16);assert(Object.keys(brain.memories!.b.known).length<=16);assert.notDeepEqual(brain.memories!.a,brain.memories!.b);
 observeCards(brain,['a','b'],deck,[],now+40000);assert.equal(Object.keys(brain.memories!.a.known).length,0);
 const fresh:FairBrain={rng:1729};observeCards(fresh,['a'],deck,[2],now);assert(Object.keys(fresh.memories!.a.known).every(i=>i==='2'));
 let missed=0;for(let seed=1;seed<=100;seed++){const b:FairBrain={rng:seed*7919};observeCards(b,['a'],deck,[2],now);if(!b.memories!.a.known[2])missed++}assert(missed>5&&missed<45);
});
test('polling a visible memory face repeatedly does not refresh its memory forever',()=>{
 const b:FairBrain={rng:1729},deck=[{key:5,matchedBy:null}];observeCards(b,['a'],deck,[0],now);for(let t=1;t<310;t++)observeCards(b,['a'],deck,[0],now+t*100);assert.equal(Object.keys(b.memories!.a.known).length,0);
});
test('unknown memory choices vary without peeking at hidden keys',()=>{
 const deck=Array.from({length:32},()=>({matchedBy:null})),choices=new Set<number>();for(let seed=1;seed<=50;seed++){const b:FairBrain={rng:seed*7919};choices.add(recallCard(b,'bot',deck,[],now))}assert(choices.size>10);
});
test('AI thinking does not consume dice/deck randomness, and its recall stays private',()=>{
 const s=state('memory'),g=s.game as MemoryGame;g.currentId=s.players[1].id;s.ai!.nextAt=0;const rng=s.random;advanceBots(s,now+1000,()=>{});assert.equal(s.random,rng);assert(!JSON.stringify(publicCasual(s,'human',now)).includes('memories'));assert(Number.isFinite(s.ai!.rng));
});
test('ladders turn alert waits for token movement; polls do not change its notice identity',()=>{
 const s=state('ladders'),g=s.game as any;g.currentId='human';g.lockUntil=now+1000;
 const room=publicCasual(s,'human',now);assert.equal(turnNotice(room,now),null);const ready=turnNotice(room,now+1000)!;assert(ready.isYou);assert.equal(turnNotice({...room,serverNow:now+2000},now+2000)!.key,ready.key);
 s.phase='paused';assert.equal(turnNotice(publicCasual(s,'human',now),now+2000),null);
});
test('turn notifications identify human actors across every requested board/card mode',()=>{
 for(const mode of ['uno','chess','dama','scidama','memory'] as const){const s=state(mode);(s.game as any).currentId='human';assert.equal(turnNotice(publicCasual(s,'human',now))?.id,'human');(s.game as any).currentId=s.players[1].id;assert.equal(turnNotice(publicCasual(s,'human',now)),null)}
});
test('slow-link local kart prediction continues between delayed snapshots instead of arriving already frozen',()=>{
 const s=state('circuit',0),raw=s.game as CircuitGame;raw.lastTickAt=raw.startAt;raw.inputs.human={seq:1,at:raw.startAt,throttle:1,steer:0,drift:false};
 for(const rtt of [110,400,800]){const g=cloneActionGame(raw),clock=new GameClock();clock.sample(raw.startAt,0,rtt);const positions:number[]=[];for(const elapsed of [0,50,100,150,200]){const target=Math.min(clock.read(elapsed),raw.lastTickAt+predictionWindow(rtt));while(g.lastTickAt+50<=target)stepActionPrediction(g,['human']);positions.push((g as CircuitGame).drivers[0].x)}assert(new Set(positions).size>=4,'Prediction froze at RTT '+rtt)}
 assert(predictionWindow(10000)<=900);
});
test('144 Hz displays receive approximately 60 paints without dropping to a 48 Hz cadence',()=>{
 let last=0,paints=0;for(let i=1;i<=144;i++){const time=i*1000/144;if(renderFrameDue(time,last,true)){last=time;paints++}}assert(paints>=59&&paints<=61);
});

test('light and dark action and turn palettes maintain readable contrast',()=>{
 const css=readFileSync('app/hud-v10.css','utf8'),blocks=[...css.matchAll(/:root(?:\[data-theme=dark\])?\{([^}]+)\}/g)].map(m=>Object.fromEntries([...m[1].matchAll(/(--[\w-]+):([^;]+)/g)].map(m=>[m[1],m[2]])));
 const luminance=(hex:string)=>{const values=hex.replace('#','').match(/../g)!.map(n=>parseInt(n,16)/255).map(n=>n<=.04045?n/12.92:((n+.055)/1.055)**2.4);return .2126*values[0]+.7152*values[1]+.0722*values[2]};
 for(const colors of blocks)for(const group of ['danger','attention']){const a=luminance(colors['--'+group+'-ink']),b=luminance(colors['--'+group+'-fill']);assert((Math.max(a,b)+.05)/(Math.min(a,b)+.05)>=4.5)}
 assert.equal(blocks.length,2);
});
