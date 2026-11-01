import {test} from 'node:test';import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {createCasual,applyCasualAction,type CasualMode} from '../lib/casual/engine.ts';
import {createCasualAPI} from '../lib/casual/api.ts';
import {CLUB_MAPS,tankWalls,partyScale,stepParty,type PartyGame} from '../lib/casual/party.ts';
import {FOUNDRY_PADS,foundrySupply,collectFoundrySupply} from '../lib/casual/arena-events.ts';
import {TABLE_SCENES,tableScene} from '../lib/casual/scenes.ts';
import {advanceBots} from '../lib/casual/bots.ts';
import {roomStreamRequest} from '../lib/room-stream.ts';
const N=10000;
function room(mode:CasualMode='tanks',extra={}){let s=createCasual('ABCDEFGH','p0','Player','hash',mode,32,N);s=applyCasualAction(s,{action:'configure',mode,cards:20,speed:175,bots:1,arcadeV2:true,arena:'foundry',...extra},'p0',N);return applyCasualAction(s,{action:'start'},'p0',N)}

test('Foundry supply uses match ticks, stays closed before its signal and pauses without drifting',()=>{const g=room().game as PartyGame;g.tick=319;assert(!foundrySupply(g).open);g.tick=320;assert(foundrySupply(g).open);assert.equal(foundrySupply(g).remaining,4);const a=g.actors[0],p=FOUNDRY_PADS[0],scale=partyScale(g);Object.assign(a,{x:p.x*scale,y:p.y*scale,ammo:1,armor:0,reloadUntil:99999});assert(collectFoundrySupply(g,a,N+16000));assert.equal(a.ammo,5);assert.equal(a.armor,1);assert.equal(a.reloadUntil,0);a.ammo=0;assert(!collectFoundrySupply(g,a,N+16010));assert.equal(a.ammo,0);assert.deepEqual(foundrySupply(g),{cycle:0,open:true,remaining:4});g.tick=720;assert(collectFoundrySupply(g,a,N+36000));assert.equal(a.armor,2)});

test('supply cannot heal dead actors, trigger at a distance, or appear in original rooms',()=>{for(const change of [{alive:false},{map:'garden'},{rules:undefined}]){const g=room().game as PartyGame,a=g.actors[0],p=FOUNDRY_PADS[0];g.tick=320;Object.assign(a,{x:p.x*partyScale(g),y:p.y*partyScale(g),ammo:1});if('alive'in change)Object.assign(a,change);else Object.assign(g,change);assert(!collectFoundrySupply(g,a,N))}const g=room().game as PartyGame;g.tick=320;assert(!collectFoundrySupply(g,g.actors[0],N))});

test('client speculation cannot grant supply ammunition or armor',()=>{const g=room().game as PartyGame,a=g.actors[0],p=FOUNDRY_PADS[0];g.tick=320;Object.assign(a,{x:p.x*partyScale(g),y:p.y*partyScale(g),ammo:1,armor:0});stepParty(g,.05,g.startAt+16000,false);assert.equal(a.ammo,1);assert.equal(a.armor,0);stepParty(g,.05,g.startAt+16050);assert.equal(a.ammo,5);assert.equal(a.armor,1)});

test('all five tank arenas have distinct cover, safe starts and reachable supply centers',()=>{assert.equal(CLUB_MAPS.length,5);const signatures=new Set();for(const map of CLUB_MAPS){let s=room('tanks',{bots:7,arena:map.id});const g=s.game as PartyGame,walls=tankWalls(map.id,partyScale(g));signatures.add(JSON.stringify(walls));for(const a of [...g.actors,...(map.id==='foundry'?FOUNDRY_PADS.map(p=>({x:p.x*partyScale(g),y:p.y*partyScale(g)})):[])])for(const w of walls){const x=Math.max(w.x,Math.min(a.x,w.x+w.w)),y=Math.max(w.y,Math.min(a.y,w.y+w.h));assert(Math.hypot(a.x-x,a.y-y)>=34,map.id)}}assert.equal(signatures.size,5)});

test('table scenes remain cosmetic validated choices and unknown render values recover safely',()=>{for(const scene of TABLE_SCENES){const s=room('pool',{scene:scene.id});assert.equal(s.settings.scene,scene.id);assert.equal((s.game as any).ballRadius,16)}assert.equal(tableScene('old-theme').id,'garden');assert.throws(()=>room('uno',{scene:'invalid'}))});

test('only continuous casual controls may request a compact socket receipt',()=>{const envelope={id:'1',method:'POST',body:{code:'ABCDEFGH',action:'party-control'},receiptOnly:true};assert.equal(roomStreamRequest(envelope,'ABCDEFGH','casual').headers.get('X-Room-Control-Receipt'),'1');for(const action of ['play-uno','pool-shot','explore'])assert(!roomStreamRequest({...envelope,body:{...envelope.body,action}},'ABCDEFGH','casual').headers.has('X-Room-Control-Receipt'));assert(!roomStreamRequest(envelope,'ABCDEFGH','arena').headers.has('X-Room-Control-Receipt'))});

test('authenticated compact receipts still validate and commit input, without exposing duplicate worlds',async()=>{
 const sql=new DatabaseSync(':memory:');sql.exec('CREATE TABLE casual_rooms(code TEXT PRIMARY KEY,state TEXT,revision INTEGER,created_at INTEGER)');
 const db={
  prepare(query:string){
   return {bind(...args:any[]){
    const stmt=sql.prepare(query);
    return {
     async first(){return stmt.get(...args)},
     async run(){const result=stmt.run(...args);return {success:true,meta:{changes:Number(result.changes)}}},
    };
   }};
  },
 };
 const http=createCasualAPI(db as any),send=(api:ReturnType<typeof createCasualAPI>,body:any,token?:string,receipt=false)=>api.POST(new Request('http://localhost/api/casual',{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{}),...(receipt?{'X-Room-Control-Receipt':'1'}:{})},body:JSON.stringify(body)}));
 try{const created=await(await send(http,{action:'create',mode:'tanks',name:'Host',bots:1,arcadeV2:true})).json() as any,token=created.token,code=created.room.code,started=await(await send(http,{action:'start',code,requestId:'start-001'},token)).json() as any;const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token)),hash=Array.from(new Uint8Array(bytes),n=>n.toString(16).padStart(2,'0')).join(''),live=createCasualAPI(db as any,undefined,undefined,hash),packet={action:'party-control',code,round:started.room.round,inputEpoch:started.room.game.startAt,seq:1,dx:1,dy:0,aim:0,requestId:'control-1'};
  for(let i=0;i<2;i++){const response=await send(live,packet,undefined,true),d=await response.json() as any;assert.equal(response.status,200);assert.equal(d.ack,'control-1');assert(Number.isSafeInteger(d.revision));assert(!d.room);assert(!d.snapshotId)}
  const response=await send(http,{...packet,seq:2,requestId:'control-2'},token,true),d=await response.json() as any;assert(d.room);assert.equal(d.room.game.inputs[d.room.youId].seq,2);const bad=await send(http,{...packet,seq:3,requestId:'control-3'},'a'.repeat(64),true);assert.equal(bad.status,401);
 }finally{sql.close()}
});

test('tank respawns also recover to clear ground on the eight-seat neon map',()=>{const g=room('tanks',{bots:7,arena:'neon'}).game as PartyGame,a=g.actors[6];Object.assign(a,{alive:false,respawnAt:g.startAt+1,x:150,y:450});stepParty(g,.05,g.startAt+50);assert(a.alive);for(const w of tankWalls('neon',partyScale(g))){const x=Math.max(w.x,Math.min(a.x,w.x+w.w)),y=Math.max(w.y,Math.min(a.y,w.y+w.h));assert(Math.hypot(a.x-x,a.y-y)>=34)}});

test('low-supply bots can seek open pads, then return to their duel after collecting',()=>{const s=room(),g=s.game as PartyGame,bot=s.players.find(p=>p.bot)!,a=g.actors.find(a=>a.id===bot.id)!;g.tick=320;a.ammo=1;a.armor=0;s.ai!.nextAt=0;let input:any;advanceBots(s,g.startAt+16000,(_id,p)=>input=p);assert(input&&input.dy>0);a.supplyCycle=foundrySupply(g).cycle;s.ai!.nextAt=0;advanceBots(s,g.startAt+16250,(_id,p)=>input=p);assert(input.dy<0)});
