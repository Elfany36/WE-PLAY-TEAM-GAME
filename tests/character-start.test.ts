import {test} from 'node:test';import assert from 'node:assert/strict';
import {createCasual,applyCasualAction,CASUAL_MODES} from '../lib/casual/engine.ts';
import {MODEL_SETS,modelFamily} from '../lib/casual/appearance.ts';
import {RoomStore} from '../lib/casual/room-store.ts';import {createCasualAPI} from '../lib/casual/api.ts';
const choice=(mode:string,round=1)=>({action:'appearance',confirmCharacter:true,confirmForRound:round,appearance:{models:{[modelFamily(mode)]:MODEL_SETS[modelFamily(mode)][0]}}});
test('all games require an explicit model confirmation and a separate start for every round',()=>{
 for(const mode of CASUAL_MODES){let s=createCasual('ABCDEFGH','p','Player','hash',mode,42,10000);s.settings.characterSelection=true;s.settings.bots=1;
  assert.throws(()=>applyCasualAction(s,{action:'start'},'p',10000),/character/);
  assert.throws(()=>applyCasualAction(s,{action:'appearance',appearance:{},confirmCharacter:true,confirmForRound:1},'p',10000),/model/);
  s=applyCasualAction(s,choice(mode,s.round+1),'p',10000);assert.equal(s.phase,'lobby');assert.equal(s.game,null);assert(s.players[0].ready);
  s=applyCasualAction(s,{action:'start'},'p',10000);assert.equal(s.phase,'playing',mode);s.phase='finished';
  assert.throws(()=>applyCasualAction(s,{action:'start'},'p',10000),/character/);s=applyCasualAction(s,choice(mode,s.round+1),'p',10000);assert.equal(s.phase,'finished');
  assert.equal(applyCasualAction(s,{action:'start'},'p',10000).round,2);
 }
});
test('every human must confirm, ready cannot bypass selection, and spectators do not block start',()=>{
 let s=createCasual('ABCDEFGH','p','Player','hash','sumo',42,10000);s.settings.characterSelection=true;
 s=applyCasualAction(s,{action:'join',id:'g',name:'Guest',hash:'guest'},null,10000);
 s=applyCasualAction(s,{action:'join',id:'v',name:'Viewer',hash:'view',role:'spectator'},null,10000);
 assert.throws(()=>applyCasualAction(s,{action:'ready'},'g',10000),/character/);s=applyCasualAction(s,choice('sumo'),'p',10000);
 assert.throws(()=>applyCasualAction(s,{action:'start'},'p',10000),/Every player/);s=applyCasualAction(s,choice('sumo'),'g',10000);
 const next=applyCasualAction(s,{action:'start'},'p',10000);assert.equal(next.game?.kind,'sumo');assert.equal(next.game?.actors.length,2);
});
test('public API creates strict rooms and does not start on model selection or ready',async()=>{
 const data=new Map<string,any>(),store=new RoomStore({async get<T>(key:string){return data.get(key) as T},async put(key,value){data.set(key,structuredClone(value))},async deleteAll(){data.clear()},async setAlarm(){}}),api=createCasualAPI(store);
 let sequence=0;const post=async(body:any,token?:string)=>{const r=await api.POST(new Request('https://example.com/api/casual',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://markup-learn-play-together.kendsfabros.chatgpt.site',...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify({...body,requestId:'strict-character-'+ ++sequence})}));assert.equal(r.headers.get('Access-Control-Allow-Origin'),'https://markup-learn-play-together.kendsfabros.chatgpt.site');return{status:r.status,data:await r.json() as any}};
 const h=await post({action:'create',mode:'tanks',bots:1,name:'Host'}),code=h.data.room.code,token=h.data.token;assert(h.data.room.settings.characterSelection);
 assert.equal((await post({action:'start',code},token)).status,409);assert.equal((await post({action:'ready',code},token)).status,409);
 const selected=await post({...choice('tanks'),code},token);assert.equal(selected.status,200);assert.equal(selected.data.room.phase,'lobby');assert.equal(selected.data.room.game,null);
 assert.equal((await post({action:'start',code},token)).data.room.phase,'playing');
});

test('delayed confirmation and start packets cannot prepare or start a later round',()=>{
 let s=createCasual('ABCDEFGH','p','Player','hash','tanks',42,10000);s.settings.characterSelection=true;s.settings.bots=1;
 s=applyCasualAction(s,choice('tanks'),'p',10000);s=applyCasualAction(s,{action:'start',round:0},'p',10000);s.phase='finished';
 assert.throws(()=>applyCasualAction(s,choice('tanks',1),'p',10000),/upcoming round/);s=applyCasualAction(s,choice('tanks',2),'p',10000);
 assert.throws(()=>applyCasualAction(s,{action:'start',round:0},'p',10000),/older round/);assert.equal(applyCasualAction(s,{action:'start',round:1},'p',10000).round,2);
});
