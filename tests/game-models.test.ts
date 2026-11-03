import {test} from 'node:test';
import assert from 'node:assert/strict';
import {MODEL_COLLECTIONS,MODEL_SETS,CUSTOM_COLORS,modelFamily,modelLabel,playerModel,validateAppearance} from '../lib/casual/appearance.ts';
import {modelSvg,modelDataUrl} from '../lib/casual/model-visuals.ts';
import {createCasual,applyCasualAction,CASUAL_MODES} from '../lib/casual/engine.ts';
import {casualBody} from '../lib/casual/api.ts';

test('every game owns at least fifteen named, visually distinct and allowlisted designs',()=>{
 const families=new Set(CASUAL_MODES.map(modelFamily));assert.equal(families.size,CASUAL_MODES.length);
 for(const mode of CASUAL_MODES){const family=modelFamily(mode),ids=MODEL_SETS[family];assert(ids.length>=15,mode);assert(family!=='token'&&family!=='board');
  const art=new Set<string>();for(const id of ids){assert.match(id,/^[a-z0-9-]+$/);assert(modelLabel(family,id).length>2);assert.deepEqual(validateAppearance({models:{[family]:id}}),{models:{[family]:id}});art.add(modelSvg(family,id,'#56e98b'))}
  assert.equal(art.size,ids.length,mode+' has duplicate art');
 }
 assert.equal(Object.keys(MODEL_COLLECTIONS).length,CASUAL_MODES.length);assert.equal(CUSTOM_COLORS.length,24);assert.equal(new Set(CUSTOM_COLORS.map(c=>c.fill)).size,24);
});
test('all game models are cosmetic, preserve simulations, and retain other game selections',()=>{
 for(const mode of CASUAL_MODES){let room=createCasual('MODELS24','p','Player','hash',mode,42,10000);room.settings.bots=1;room=applyCasualAction(room,{action:'start'},'p',10000);const before=structuredClone(room.game),family=modelFamily(mode);
  for(const model of MODEL_SETS[family]){room=applyCasualAction(room,{action:'appearance',appearance:{color:'#315cc7',models:{[family]:model}}},'p',10000);assert.deepEqual(room.game,before,mode+' / '+model);assert.equal(playerModel(room.players[0],family),model)}
 }
 let room=createCasual('MODELS24','p','Player','hash','circuit',42,10000);room=applyCasualAction(room,{action:'appearance',appearance:{models:{kart:'solar',sumo:'panda',pool:'jade'}}},'p',10000);
 room=applyCasualAction(room,{action:'appearance',appearance:{models:{kart:'rally'}}},'p',10000);assert.deepEqual(room.players[0].appearance?.models,{kart:'rally',sumo:'panda',pool:'jade'});
 assert.equal(playerModel({color:0,appearance:{models:{board:'wood'}}},'chess'),'wood');assert.equal(playerModel({color:0,appearance:{models:{kart:'invalid'}}},'kart'),'classic');
});
test('changing games clears confirmation and rejects delayed confirmation for another mode',()=>{
 let room=createCasual('MODELS24','p','Player','hash','circuit',42,10000);room.settings.characterSelection=true;room.settings.bots=1;
 const appearance={models:{kart:'solar',sumo:'panda'}};room=applyCasualAction(room,{action:'appearance',appearance,confirmCharacter:true,confirmForRound:1,confirmForMode:'circuit'},'p',10000);
 room=applyCasualAction(room,{action:'configure',mode:'sumo',cards:20,speed:350,bots:1},'p',10000);
 assert.equal(room.players[0].characterRound,undefined);assert.equal(applyCasualAction(room,{action:'ready'},'p',10000).players[0].ready,true);
 assert.throws(()=>applyCasualAction(room,{action:'appearance',appearance,confirmCharacter:true,confirmForRound:1,confirmForMode:'circuit'},'p',10000),/upcoming round/);
 assert.throws(()=>applyCasualAction(room,{action:'appearance',appearance:{models:{kart:'solar'}},confirmCharacter:true,confirmForRound:1,confirmForMode:'sumo'},'p',10000),/model/);
 room=applyCasualAction(room,{action:'appearance',appearance,confirmCharacter:true,confirmForRound:1,confirmForMode:'sumo'},'p',10000);assert.equal(applyCasualAction(room,{action:'start'},'p',10000).game?.kind,'sumo');
});
test('model SVGs cannot inject markup or external resources through saved values',()=>{
 const safe=modelSvg('kart','classic','#56e98b');assert.equal(modelSvg('kart','<script>','#56e98b'),safe);assert.equal(modelSvg('kart','classic','red" onload="alert(1)'),safe);
 for(const [family,c]of Object.entries(MODEL_COLLECTIONS))for(const {id}of c.models){const art=modelSvg(family as keyof typeof MODEL_COLLECTIONS,id,'#315cc7');assert(!/script|foreignObject|onload|href=|https?:/i.test(art.replace('http://www.w3.org/2000/svg','')));assert(art.startsWith('<svg '));assert(art.endsWith('</svg>'));assert.equal(decodeURIComponent(modelDataUrl(family as keyof typeof MODEL_COLLECTIONS,id,'#315cc7').split(',')[1]),art)}
});
test('API retains the intended game on character confirmation and bounds the complete saved collection',async()=>{
 const appearance={color:'#283546',models:Object.fromEntries(Object.entries(MODEL_SETS).map(([family,ids])=>[family,ids.at(-1)]))};
 const body={action:'appearance',code:'ABCDEFGH',requestId:'model-confirm-24',appearance,confirmCharacter:true,confirmForRound:1,confirmForMode:'circuit'};
 assert(JSON.stringify(body).length<4000);const request=(b:unknown)=>new Request('https://example.com/api/casual',{method:'POST',body:JSON.stringify(b)});
 assert.equal((await casualBody(request(body))).confirmForMode,'circuit');await assert.rejects(casualBody(request({...body,confirmForMode:'unknown'})),/current game/);
});
