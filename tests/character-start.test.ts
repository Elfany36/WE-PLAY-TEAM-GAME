import {test} from 'node:test';import assert from 'node:assert/strict';
import {createCasual,applyCasualAction,CASUAL_MODES} from '../lib/casual/engine.ts';
import {MODEL_SETS,modelFamily} from '../lib/casual/appearance.ts';
import {RoomStore} from '../lib/casual/room-store.ts';import {createCasualAPI} from '../lib/casual/api.ts';
const choice=(mode:string,round=1)=>({action:'appearance',confirmCharacter:true,confirmForRound:round,appearance:{models:{[modelFamily(mode)]:MODEL_SETS[modelFamily(mode)][0]}}});
test('all games start with defaults without opening character or controls setup, including rematches',()=>{
 for(const mode of CASUAL_MODES){let s=createCasual('ABCDEFGH','p','Player','hash',mode,42,10000);s.settings.characterSelection=true;s.settings.bots=1;
  assert.equal(s.players[0].appearance,undefined);s=applyCasualAction(s,{action:'start'},'p',10000);assert.equal(s.phase,'playing',mode);assert(s.game);
  s.phase='finished';s=applyCasualAction(s,{action:'start'},'p',10000);assert.equal(s.round,2);assert.equal(s.phase,'playing');
 }
});
test('optional character choices stay selected without starting the game and default humans do not block start',()=>{
 let s=createCasual('ABCDEFGH','p','Player','hash','sumo',42,10000);
 s=applyCasualAction(s,{action:'join',id:'g',name:'Guest',hash:'guest'},null,10000);s=applyCasualAction(s,{action:'join',id:'v',name:'Viewer',hash:'view',role:'spectator'},null,10000);
 s=applyCasualAction(s,{action:'appearance',appearance:{models:{sumo:'panda'}},appearanceForMode:'sumo'},'p',10000);assert.equal(s.phase,'lobby');assert.equal(s.players[0].appearance?.models?.sumo,'panda');
 assert.equal(s.players[1].appearance,undefined);const started=applyCasualAction(s,{action:'start'},'p',10000);assert.equal(started.game?.kind,'sumo');if(started.game?.kind==='sumo')assert.equal(started.game.actors.length,2);
});
test('public API uses optional setup and permits default starts without automatically starting on appearance edits',async()=>{
 const data=new Map<string,any>(),store=new RoomStore({async get<T>(key:string){return data.get(key) as T},async put(key,value){data.set(key,structuredClone(value))},async deleteAll(){data.clear()},async setAlarm(){}}),api=createCasualAPI(store);
 let sequence=0;const post=async(body:any,token?:string)=>{const r=await api.POST(new Request('https://example.com/api/casual',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://markup-learn-play-together.kendsfabros.chatgpt.site',...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify({...body,requestId:'optional-character-'+ ++sequence})}));return{status:r.status,data:await r.json() as any}};
 const h=await post({action:'create',mode:'tanks',bots:1,name:'Host'}),code=h.data.room.code,token=h.data.token;assert.equal(h.data.room.settings.characterSelection,false);
 assert.equal((await post({action:'start',code},token)).data.room.phase,'playing');
 await post({action:'end',code},token);await post({action:'lobby',code},token);const selected=await post({action:'appearance',code,appearanceForMode:'tanks',appearance:{models:{tank:'rail'}}},token);assert.equal(selected.data.room.phase,'lobby');assert.equal(selected.data.room.players[0].appearance.models.tank,'rail');
});
test('delayed confirmation and start packets cannot prepare or start a later round',()=>{
 let s=createCasual('ABCDEFGH','p','Player','hash','tanks',42,10000);s.settings.bots=1;s=applyCasualAction(s,choice('tanks'),'p',10000);s=applyCasualAction(s,{action:'start',round:0},'p',10000);s.phase='finished';
 assert.throws(()=>applyCasualAction(s,choice('tanks',1),'p',10000),/upcoming round/);assert.throws(()=>applyCasualAction(s,{action:'start',round:0},'p',10000),/older round/);assert.equal(applyCasualAction(s,{action:'start',round:1},'p',10000).round,2);
});
test('maps retain character choices; game switches and a fresh seat reset them',()=>{
 let s=createCasual('ABCDEFGH','p','Player','hash','sumo',42,10000);const appearance={color:'#315cc7',models:{sumo:'panda'}};s=applyCasualAction(s,{action:'appearance',appearance},'p',10000);
 s=applyCasualAction(s,{action:'configure',mode:'sumo',cards:20,speed:350,arena:'glacier'},'p',10000);assert.deepEqual(s.players[0].appearance,appearance);
 s=applyCasualAction(s,{action:'configure',mode:'circuit',cards:20,speed:350},'p',10000);assert.equal(s.players[0].appearance,undefined);
 assert.throws(()=>applyCasualAction(s,{action:'appearance',appearanceForMode:'sumo',appearance},'p',10000),/another game/);
 s=applyCasualAction(s,{action:'join',id:'fresh',name:'Fresh player',hash:'fresh'},null,10000);assert.equal(s.players.find(p=>p.id==='fresh')!.appearance,undefined);
});
