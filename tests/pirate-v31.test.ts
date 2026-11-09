import test from 'node:test';
import assert from 'node:assert/strict';
import {createCasual,applyCasualAction,advanceCasual,publicCasual,canResumeCasual,type CasualSettings} from '../lib/casual/engine.ts';
import {PIRATE_MAPS,PIRATE_MODES,PIRATE_SKILLS} from '../lib/casual/pirate-data.ts';
import {PIRATE_MODELS} from '../lib/casual/pirate-models.ts';
import {createPirateWorld,stepPirateWorld,awardPirateTreasure,type PirateWorld,type PirateControl} from '../lib/casual/pirate-runtime.js';
import {newPirate,pirateAction,publicPirate,type PirateGame} from '../lib/casual/pirate.ts';
import {piratePresentation} from '../lib/casual/pirate-presentation.ts';
import {mergeControlPackets} from '../lib/control-channel.ts';
import {casualTickDelay} from '../lib/casual/room-timing.ts';
import {roomStreamRequest} from '../lib/room-stream.ts';
import {casualBody} from '../lib/casual/api.ts';
import {casualPollPeriod} from '../lib/casual/polling.ts';
import {expectsWorldUpdates,worldRecoveryDelay} from '../lib/casual/world-stream.ts';
import {createLocalLobby} from '../lib/casual/local-play.ts';
import {controlAction} from '../lib/player-controls.ts';
import {chooseCasualEndpoint,CASUAL_SERVICE_ORIGIN} from '../lib/casual/service.ts';
const N=1800000000000;
const seats=[{id:'one',bot:false,character:0,color:'#ff785a',model:'bomb-guy'},{id:'two',bot:false,character:4,color:'#4dbbff',model:'captain'}];
const input=(seq=1,extra:Partial<PirateControl>={}):PirateControl=>({seq,at:N+3100,life:0,dx:0,down:false,jump:false,attack:false,special:false,dash:false,jumpSeq:0,attackSeq:0,specialSeq:0,dashSeq:0,...extra});
function world(){const w=createPirateWorld('galleon-deck','classic',seats,12345);w.fighters[0].x=700;w.fighters[1].x=1000;for(const f of w.fighters){f.y=760;f.inv=0;f.on=1}return w}
function room(settings:Partial<CasualSettings>={}){let s=createCasual('ABCDEFGH','one','One','one-token','pirate',12345,N);s=applyCasualAction(s,{action:'configure',mode:'pirate',...s.settings,bots:1,...settings},'one',N);return applyCasualAction(s,{action:'start'},'one',N)}
function serializable(w:PirateWorld){const data=JSON.stringify(w);assert(!/NaN|Infinity/.test(data));assert(!w.fighters.some(f=>!Number.isFinite(f.x)||!Number.isFinite(f.y)));return JSON.parse(data) as PirateWorld}

test('Pirate has seven independent modes, eight valid maps, fifteen outfits and 44 skills',()=>{
 assert.equal(PIRATE_MODES.length,7);assert.equal(PIRATE_MAPS.length,8);assert.equal(PIRATE_MODELS.length,15);assert.equal(PIRATE_SKILLS.length,44);
 assert.equal(new Set(PIRATE_MODELS.map(m=>m.id)).size,15);assert.equal(new Set(PIRATE_MODELS.map(m=>m.character)).size,6);
 for(const map of PIRATE_MAPS){assert(map.sp.length>=6);assert(map.p.every(p=>p.w>0&&p.y<map.h));assert(map.sp.every(([x,y])=>map.p.some(p=>x>p.x&&x<p.x+p.w&&y===p.y)))}
});
test('Pirate start uses optional defaults, a countdown and the room-authority cadence',()=>{
 const s=room(),g=s.game as PirateGame;assert.equal(g.kind,'pirate');assert.equal(g.world.fighters.length,2);assert.equal(g.startAt,N+3000);assert.equal(casualTickDelay(s,N+4000),50);
 assert.equal(advanceCasual(s,N+2000).changed,false);const advanced=advanceCasual(s,N+3050);assert.equal((advanced.state.game as PirateGame).world.tick,3);assert.equal(g.world.tick,0,'advancing must not mutate its input');
});
test('Pirate uses fast fallback polling and wakes recovery at the countdown boundary',()=>{
 const r=publicCasual(room(),'one',N+1000);assert.equal(casualPollPeriod(r,false),200);assert.equal(casualPollPeriod(r,true,0,true),2000);
 assert.equal(expectsWorldUpdates(r,0),false);assert.equal(expectsWorldUpdates(r,2000),true);assert.equal(worldRecoveryDelay(r,500,5000),1500);
});
test('The API preserves ordered Pirate controls and strips client authority fields',async()=>{
 const data={action:'pirate-input',code:'ABCDEFGH',requestId:'pirate-api-123',round:1,inputEpoch:N+3000,...input(5,{life:1,attackSeq:4}),x:99999,owner:'two',localActor:'two',seed:123};
 const parsed=await casualBody(new Request('https://example.test/api/casual',{method:'POST',body:JSON.stringify(data)}));
 assert.equal(parsed.life,1);assert.equal(parsed.attackSeq,4);assert.equal(parsed.inputEpoch,N+3000);for(const key of ['x','owner','localActor','seed'])assert(!(key in parsed));
 for(const extra of [{pirateMap:'missing'},{pirateMode:'missing'},{pirateStocks:9},{pirateDifficulty:'missing'}])await assert.rejects(()=>casualBody(new Request('https://example.test/api/casual',{method:'POST',body:JSON.stringify({action:'create',mode:'pirate',name:'One',requestId:'pirate-api-123',...extra})})));
});
test('Four local pirates have independent keyboard actions and authority input ledgers',()=>{
 let s=createLocalLobby({mode:'pirate',names:['One','Two','Three','Four'],humans:4,settings:{cards:20,speed:350,bots:0,pirateMap:'galleon-deck'},seed:123,now:N});s=applyCasualAction(s,{action:'start'},s.hostId,N);
 const keys=['KeyD','ArrowLeft','KeyJ','Numpad6'];for(let i=0;i<4;i++){const mode=i?'pirate-local-'+(i+1):'pirate';assert.equal(controlAction({code:keys[i]},mode),i===1||i===2?'left':'right');s=applyCasualAction(s,{action:'pirate-input',round:s.round,...input(i+1,{dx:i%2?-1:1})},'local-'+i,N+3100)}
 s=advanceCasual(s,N+3150).state;const g=s.game as PirateGame;assert.equal(g.world.fighters.length,4);for(let i=0;i<4;i++)assert.equal(g.world.fighters[i].lastSeq,i+1);
});
test('New Pirate rooms use the matching website authority while older games keep theirs',async()=>{
 const old=Object.getOwnPropertyDescriptor(globalThis,'location');
 try{for(const hostname of ['markup-learn-play-together.kendsfabros.chatgpt.site','elfany36.github.io']){Object.defineProperty(globalThis,'location',{configurable:true,value:{hostname,origin:'https://'+hostname,href:'https://'+hostname+'/'}});assert.equal(await chooseCasualEndpoint('pirate'),hostname.endsWith('.github.io')?'https://markup-learn-play-together.kendsfabros.chatgpt.site/api/casual':'/api/casual');assert.equal(await chooseCasualEndpoint('snake'),CASUAL_SERVICE_ORIGIN+'/api/casual')}}
 finally{if(old)Object.defineProperty(globalThis,'location',old);else Reflect.deleteProperty(globalThis,'location')}
});
test('A grounded jump retains the second jump and a held key cannot spend it twice',()=>{
 const w=world(),controls={one:input(1,{jump:true,jumpSeq:1})};stepPirateWorld(w,controls,1,N+3100);assert(w.fighters[0].vy<0);assert.equal(w.fighters[0].dj,1);
 stepPirateWorld(w,controls,3,N+3150);assert.equal(w.fighters[0].dj,1);
 controls.one=input(2,{jump:false,jumpSeq:1});stepPirateWorld(w,controls,1,N+3167);controls.one=input(3,{jump:true,jumpSeq:3});stepPirateWorld(w,controls,1,N+3184);assert.equal(w.fighters[0].dj,0);assert(w.fighters[0].vy<-8);
});
test('A short jump tap survives control coalescing; life changes discard old edge receipts',()=>{
 const press={action:'pirate-input',round:1,inputEpoch:1,...input(10,{jump:true,jumpSeq:10})},release={action:'pirate-input',round:1,inputEpoch:1,...input(11,{jumpSeq:10})};
 const merged=mergeControlPackets(press,release);assert.equal(merged.jump,false);assert.equal(merged.jumpSeq,10);
 const w=world();stepPirateWorld(w,{one:merged as PirateControl},1,N+3100);assert(w.fighters[0].vy<0);
 const fresh={...release,seq:12,life:1,jumpSeq:0};assert.equal(mergeControlPackets(press,fresh).jumpSeq,0);
});
test('Expired or missing human input becomes neutral without moving another player',()=>{
 const w=world(),other=w.fighters[1].x;stepPirateWorld(w,{one:input(1,{dx:1})},6,N+3100);assert(w.fighters[0].x>700);assert.equal(w.fighters[1].x,other);
 const x=w.fighters[0].x;stepPirateWorld(w,{one:input(2,{at:N,dx:-1})},1,N+5000);assert(w.fighters[0].x>=x,'stale reverse input must not be applied');
});
test('Melee has a per-swing hit ledger and knockback grows with damage',()=>{
 const w=world();w.fighters[1].x=740;stepPirateWorld(w,{one:input(1,{attack:true,attackSeq:1})},12,N+3100);assert(w.fighters[1].dmg>0);const damage=w.fighters[1].dmg;
 stepPirateWorld(w,{one:input(1,{attack:true,attackSeq:1})},4,N+3150);assert.equal(w.fighters[1].dmg,damage);assert(w.fighters[1].vx>0);
});
test('Bomb pickup, carried fuse, throw ownership and JSON persistence remain consistent',()=>{
 let w=world();w.bombs.push({id:99,x:700,y:740,vx:0,vy:0,st:0,t:0,h:null,own:null,fl:0});stepPirateWorld(w,{},1,N+3100);assert.equal(w.fighters[0].bomb,99);assert.equal(w.bombs[0].h,'one');assert.equal(w.bombs[0].t,180);
 w=serializable(w);stepPirateWorld(w,{one:input(2,{special:true,specialSeq:2})},1,N+3150);assert.equal(w.fighters[0].bomb,null);assert.equal(w.bombs[0].h,null);assert.equal(w.bombs[0].own,'one');assert(w.bombs[0].vx>0);
 w=serializable(w);stepPirateWorld(w,{},120,N+3200);stepPirateWorld(w,{},80,N+5200);assert(!w.bombs.some(b=>b.id===99));serializable(w);
});
test('Every skill uses the actual treasure/cast path and survives serialization',()=>{
 for(let i=0;i<PIRATE_SKILLS.length;i++){
  let w=world();w.fighters[1].x=820;w.fighters[0].dmg=60;awardPirateTreasure(w,'one',i,N+3100);w=serializable(w);
  if(!PIRATE_SKILLS[i].i){assert.equal(w.fighters[0].sp,i,PIRATE_SKILLS[i].n);stepPirateWorld(w,{one:input(1,{special:true,specialSeq:1})},1,N+3100);assert.equal(w.fighters[0].sp,null,PIRATE_SKILLS[i].n+' must consume its stored skill')}
  for(let step=0;step<8;step++){stepPirateWorld(w,{},3,N+3150+step*50);w=serializable(w)}
 }
});
test('Ghost form resists melee and area attacks even when another shield expires first',()=>{
 const w=world();w.fighters[1].x=740;w.fighters[1].gh=100;w.fighters[1].inv=0;stepPirateWorld(w,{one:input(1,{attack:true,attackSeq:1})},12,N+3100);assert.equal(w.fighters[1].dmg,0);
 const blast=PIRATE_SKILLS.findIndex(s=>s.k==='wave');awardPirateTreasure(w,'one',blast);stepPirateWorld(w,{one:input(20,{special:true,specialSeq:20})},1,N+3300);assert.equal(w.fighters[1].dmg,0);
});
test('Stomp and Hot Potato do not accidentally award forbidden skills or buffs',()=>{
 for(const variant of ['stomp','hot-potato'] as const){const w=createPirateWorld('galleon-deck',variant,seats,123);const stocks=w.fighters[0].st;awardPirateTreasure(w,'one',PIRATE_SKILLS.findIndex(s=>s.k==='life'));assert.equal(w.fighters[0].st,stocks);assert.equal(w.fighters[0].sp,null)}
});
test('An overboard life clears stale input, and respawn clears the old attacker',()=>{
 const w=world(),controls={one:input(1,{dx:1})};w.fighters[0].x=-160;w.fighters[0].la='two';w.fighters[0].lt=120;stepPirateWorld(w,controls,1,N+3100);
 assert.equal(w.fighters[0].life,1);assert.equal(w.fighters[0].st,2);assert.equal(w.fighters[1].ko,1);assert.equal(controls.one,undefined);
 stepPirateWorld(w,{},90,N+4600);assert.equal(w.fighters[0].dead,0);assert.equal(w.fighters[0].la,null);assert.equal(w.fighters[0].lt,0);assert.equal(w.fighters[0].on,1);
});
test('An old-life packet and repeated sequence cannot take over a fresh spawn',()=>{
 const s=room(),g=s.game as PirateGame,f=g.world.fighters[0];f.life=1;pirateAction(s,{action:'pirate-input',...input(1,{dx:1})},'one',N+3100);assert.equal(g.inputs.one,undefined);
 pirateAction(s,{action:'pirate-input',...input(2,{life:1,dx:1})},'one',N+3100);assert.equal((g.inputs.one as PirateControl|undefined)?.dx,1);pirateAction(s,{action:'pirate-input',...input(1,{life:1,dx:-1})},'one',N+3100);assert.equal((g.inputs.one as PirateControl|undefined)?.dx,1);
});
test('Frozen players do not replay released one-shot controls after thawing',()=>{
 const s=room(),g=s.game as PirateGame,f=g.world.fighters[0];f.fz=10;
 pirateAction(s,{action:'pirate-input',...input(4,{attack:false,attackSeq:3,jumpSeq:2,specialSeq:1})},'one',N+3100);
 assert.equal(f.attackSeq,3);assert.equal(f.jumpSeq,2);assert.equal(f.lastSeq,4);
 stepPirateWorld(g.world,g.inputs,12,N+3100);assert.equal(g.world.fighters[0].at,0);assert.equal(g.world.fighters[0].dj,1);
});
test('Non-finite aiming, malformed buttons and forged action receipts are rejected',()=>{
 const s=room();
 for(const extra of [{dx:NaN},{aimX:Infinity,aimY:0},{aimX:0,aimY:NaN},{special:'yes'},{attackSeq:9},{life:-1}])assert.throws(()=>pirateAction(s,{action:'pirate-input',...input(1),...extra},'one',N+3100));
});
test('A retired KO leader cannot turn the active players’ race into a draw',()=>{
 const w=createPirateWorld('galleon-deck','ko-race',[...seats,{...seats[0],id:'three'}],123);
 w.fighters[0].st=0;w.fighters[0].dead=1;w.fighters[0].ko=12;w.fighters[1].ko=8;w.fighters[2].ko=3;
 stepPirateWorld(w,{},1,N+3100);assert(w.ended);assert.deepEqual(w.winnerIds,['two']);
});
test('Spectators cannot control pirates and public snapshots hide seeds and AI internals',()=>{
 let s=room();s=applyCasualAction(s,{action:'join',id:'watcher',name:'Watcher',hash:'watcher-token',role:'spectator'},null,N+3100);
 assert.throws(()=>applyCasualAction(s,{action:'pirate-input',round:1,...input()},'watcher',N+3100),/Spectators/);
 const g=(publicCasual(s,'watcher',N+3100).game as ReturnType<typeof publicPirate>);assert(!('seed'in g.world));assert(!('difficulty'in g.world));assert(!('lv'in g.world.fighters[0]));assert.deepEqual(g.inputs,{});
 const req=roomStreamRequest({id:'1',method:'POST',body:{action:'pirate-input',code:'ABCDEFGH',requestId:'pirate-sequence-1',round:1,...input()}},'ABCDEFGH','casual');assert.equal(req.method,'POST');
});
test('Pause and absent-host spectator resume keep buffs frozen and reset input epochs',()=>{
 let s=room();s=applyCasualAction(s,{action:'join',id:'watcher',name:'Watcher',hash:'watcher-token',role:'spectator'},null,N+3100);s=applyCasualAction(s,{action:'pause'},'one',N+3200);const g=s.game as PirateGame;g.world.fighters[0].sh=100;const epoch=g.startAt;
 assert.equal(advanceCasual(s,N+25000).changed,false);assert(canResumeCasual(s,'watcher',N+25001));s=applyCasualAction(s,{action:'resume'},'watcher',N+25001);assert.equal((s.game as PirateGame).world.fighters[0].sh,100);assert((s.game as PirateGame).startAt>epoch);assert.deepEqual((s.game as PirateGame).inputs,{});
});
test('The remaining pirate wins after a departure, while spectator-only AI play continues',()=>{
 let s=room();s=applyCasualAction(s,{action:'join',id:'watcher',name:'Watcher',hash:'watcher-token',role:'spectator'},null,N+3100);const bot=s.players.find(p=>p.bot)!;
 s=applyCasualAction(s,{action:'leave'},'one',N+3100);assert.equal(s.phase,'finished');assert.deepEqual(s.result?.winnerIds,[bot.id]);
 let watched=createCasual('BCDEFGHJ','watcher','Watcher','watcher-token','pirate',123,N);watched=applyCasualAction(watched,{action:'role',role:'spectator'},'watcher',N);watched=applyCasualAction(watched,{action:'configure',mode:'pirate',...watched.settings,bots:3},'watcher',N);watched=applyCasualAction(watched,{action:'start'},'watcher',N);assert.equal((watched.game as PirateGame).world.fighters.length,3);assert.equal(watched.phase,'playing');
});
test('A hit impact fades instead of leaving permanent white flashes or camera shake',()=>{
 const w=world();w.flash=.2;w.shake=12;stepPirateWorld(w,{},90,N+3100);assert(w.flash<.001);assert(w.shake<.001);
});
test('Local presentation stays bounded, respects solids and never mutates authority',()=>{
 const w=world(),actor=w.fighters[0],before=structuredClone(actor);const predicted=piratePresentation(actor,w.map,{dx:1,jump:false},10000);assert(predicted.x>actor.x);assert(predicted.x-actor.x<30);assert.deepEqual(actor,before);
 const jump=piratePresentation(actor,w.map,{dx:0,jump:true,jumpHeld:true},50);assert(jump.y<actor.y);assert.equal(actor.y,before.y);
});
for(const map of PIRATE_MAPS)test('Pirate '+map.n+' supports every mode with six serialized AI players',()=>{
 for(const variant of PIRATE_MODES){let w=createPirateWorld(map.id,variant.id,Array.from({length:6},(_,i)=>({id:String(i),bot:true,character:i,color:seats[i%2].color,model:PIRATE_MODELS[i].id})),997,3,1);for(let i=0;i<160&&!w.ended;i++){stepPirateWorld(w,{},3,N+3100+i*50);w=serializable(w)}assert(w.tick>0);assert(w.bombs.length<=64);assert(w.projectiles.length<=96);assert(w.zones.length<=24)}
});
