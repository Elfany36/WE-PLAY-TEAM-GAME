import {pirateSettings} from './pirate.ts';
import {newGameSettings,newGameActionFields,NEW_GAME_ACTIONS} from './new-game-settings.ts';
import {hiddenSettings,hiddenActionFields,HIDDEN_ACTIONS} from './hidden-settings.ts';
import {avatarBytes,avatarHash} from './avatar.ts';
const avatarUploads=new WeakMap<object,Set<string>>();
import {validateAppearance} from './appearance.ts';
import {TRACKS} from './circuit.ts';
import {CLUB_MAPS} from './party.ts';
import {TABLE_SCENE_IDS,type TableScene} from './scenes.ts';
import {roomHint} from '../room-params.ts';
import type {CasualDatabase} from './room-store.ts';
import {cleanRoomText} from '../room-text.ts';
import {takeRoomBudget} from '../room-budget.ts';
import {roomSnapshot} from '../room-snapshots.ts';
import {beginRoomRequest,stampRoomReply} from '../request-clock.ts';
import {roomBatch} from '../room-batch.ts';
import {roomScene} from './client-room.ts';
import {activeChat} from '../room-chat.ts';
import {roomHeaders,roomOriginAllowed} from '../room-origin.ts';
import {SNAKE_MAP_IDS,SNAKE_SIZES} from './maps.ts';
import {createCasual,applyCasualAction,advanceCasual,publicCasual,CasualError,ROOM_TTL,type CasualState,type CasualMode,CASUAL_MODES} from './engine.ts';
function headers(req:Request){return roomHeaders(req)}
function reply(req:Request,data:unknown,status=200){return Response.json(stampRoomReply(req,roomSnapshot(req,data)),{status,headers:headers(req)})}
function originCheck(req:Request){const o=req.headers.get('Origin');if(o&&!roomOriginAllowed(req))throw new CasualError('This frontend is not allowed to use these rooms.',403)}
export function casualFailure(req:Request,e:unknown){return reply(req,{error:e instanceof CasualError?e.message:'The room service could not complete this request. Please reconnect.'},e instanceof CasualError?e.status:503)}
async function hash(token:string){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token))),n=>n.toString(16).padStart(2,'0')).join('')}
function secret(){return Array.from(crypto.getRandomValues(new Uint8Array(32)),n=>n.toString(16).padStart(2,'0')).join('')}
function roomCode(value:unknown){if(typeof value!=='string'||!/^[A-HJ-NP-Z2-9]{8}$/.test(value.trim().toUpperCase()))throw new CasualError('Use the 8-character room code.');return value.trim().toUpperCase()}
const actions=new Set(['pirate-input',...NEW_GAME_ACTIONS,...HIDDEN_ACTIONS,'upload-avatar','appearance','role','party-control','block-input','pool-shot','pool-place','move-board','resign-board','offer-draw','decline-draw','claim-draw','chat','create','join','configure','start','lobby','ready','heartbeat','disconnect','leave','remove-inactive','claim-host','roll','flip','direction','pause','resume','end','play-uno','draw-uno','pass-uno','call-uno','catch-uno','choose-uno-color','accept-four','challenge-four','roll-property','buy-property','auction-property','end-property','pay-jail','use-jail-card','bid-property','pass-auction','build-property','sell-property','sell-set','mortgage-property','redeem-property','offer-trade','accept-trade','reject-trade','settle-property','bankrupt-property','submit-phone','draft-phone','reveal-phone','drive','explore','craft-terra','spawn-terra','beacon-terra']);
export async function readCasualText(req:Request){
 if(Number(req.headers.get('Content-Length'))>160000)throw new CasualError('The request is too large.',413);if(!req.body)throw new CasualError('Send a JSON request.');
 const reader=req.body.getReader();let size=0;const chunks:Uint8Array[]=[];
 while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>160000){await reader.cancel();throw new CasualError('The request is too large.',413)}chunks.push(value)}
 const bytes=new Uint8Array(size);let offset=0;for(const part of chunks){bytes.set(part,offset);offset+=part.byteLength}
 return new TextDecoder().decode(bytes);
}
export async function casualBody(req:Request){
 const text=await readCasualText(req),size=new TextEncoder().encode(text).byteLength;
 let b:Record<string,any>;try{b=JSON.parse(text)}catch{throw new CasualError(size>4000?'The request is too large.':'Send valid JSON.',size>4000?413:400)}
 if(size>4000&&!['submit-phone','draft-phone','upload-avatar'].includes(b?.action))throw new CasualError('The request is too large.',413);
 if(!b||typeof b!=='object'||Array.isArray(b)||!actions.has(b.action))throw new CasualError('Choose a valid game action.');
 const out:Record<string,any>={action:b.action,...hiddenActionFields(b),...newGameActionFields(b)};if(b.appearanceForMode!==undefined){if(!CASUAL_MODES.includes(b.appearanceForMode))throw new CasualError('Choose the current game for your appearance.');out.appearanceForMode=b.appearanceForMode;}if(b.confirmForMode!==undefined){if(!CASUAL_MODES.includes(b.confirmForMode))throw new CasualError('Choose the current game for character confirmation.');out.confirmForMode=b.confirmForMode;}if(b.action==='start'&&b.round!==undefined){if(!Number.isSafeInteger(b.round)||b.round<0)throw new CasualError('Use the current setup round.');out.round=b.round;}if(b.confirmCharacter!==undefined){if(typeof b.confirmCharacter!=='boolean')throw new CasualError('Confirm a valid character choice.');out.confirmCharacter=b.confirmCharacter;if(b.confirmCharacter){if(!Number.isSafeInteger(b.confirmForRound)||b.confirmForRound<1)throw new CasualError('Choose the upcoming character round.');out.confirmForRound=b.confirmForRound;}}if(b.action==='upload-avatar'){avatarBytes(b.image);out.image=b.image}if(b.action==='appearance'||['create','join'].includes(b.action)&&b.appearance!==undefined)out.appearance=validateAppearance(b.appearance);if(b.action==='role'||b.action==='join'&&b.role!==undefined){if(!['player','spectator'].includes(b.role))throw new CasualError('Choose player or spectator.');out.role=b.role}if(b.action==='chat'){for(const key of ['round','turn'])if(b[key]!==undefined){if(!Number.isSafeInteger(b[key])||b[key]<1)throw new CasualError('Use the current drawing turn.');out[key]=b[key]}if(typeof b.text!=='string'||!b.text.trim()||b.text.length>280||typeof b.messageId!=='string'||b.messageId.length<8||b.messageId.length>80)throw new CasualError('Send a chat message of 1–280 characters with an identifier.');out.text=b.text;out.messageId=b.messageId;out.giftId=b.giftId;out.gifId=b.gifId;out.effect=b.effect}
 if(b.action==='create'||b.action==='join'){if(typeof b.name!=='string'||b.name.trim().length<2||b.name.trim().length>20)throw new CasualError('Use a display name of 2–20 characters.');out.name=cleanRoomText(b.name);if(out.name.length<2)throw new CasualError('Use at least two visible characters in your display name.')}
 if(b.action!=='create')out.code=roomCode(b.code);
 if(b.action==='create'||b.action==='configure'){Object.assign(out,newGameSettings(b),hiddenSettings(b),pirateSettings(b));for(const [key,values]of [['roundSeconds',[60,120,180,300,600]],['winTarget',[5,10,11,20,21]],['raceLaps',[1,2,3,5]]] as const)if(b[key]!==undefined){if(!(values as readonly number[]).includes(b[key]))throw new CasualError('Choose a valid game variant.');out[key]=b[key];}if(b.scene!==undefined){if(!TABLE_SCENE_IDS.includes(b.scene))throw new CasualError('Choose a valid table scene.');out.scene=b.scene}if(b.arena!==undefined){if(!CLUB_MAPS.some(m=>m.id===b.arena))throw new CasualError('Choose a valid arena.');out.arena=b.arena}if(!CASUAL_MODES.includes(b.mode))throw new CasualError('Choose a valid game.');out.mode=b.mode;for(const [key,allowed]of [['blockPace',['arcade','expert','blitz']],['sumoFormat',['bracket','classic']]] as const)if(b[key]!==undefined){if(!allowed.some(x=>x===b[key]))throw new CasualError('Choose a valid match format.');out[key]=b[key]}out.map=b.map??'classic';if(!SNAKE_MAP_IDS.includes(out.map))throw new CasualError('Choose a valid map.');out.cards=b.cards??20;out.speed=b.speed??350;out.snakeSize=b.snakeSize??48;if(!SNAKE_SIZES.includes(out.snakeSize))throw new CasualError('Choose an arena size of 32, 48 or 64.');if(!Number.isInteger(out.cards)||out.cards<12||out.cards>200||out.cards%2)throw new CasualError('Choose an even deck size from 12 to 200 cards.');if(![125,175,250,350,500].includes(out.speed))throw new CasualError('Choose a valid snake speed.');for(const k of ['battle','unoFlip','arcadeV2','unoSameColor'])if(b[k]!==undefined){if(typeof b[k]!=='boolean')throw new CasualError('Invalid game option.');out[k]=b[k]}if(b.difficulty!==undefined){if(!['cozy','standard','expert'].includes(b.difficulty))throw new CasualError('Choose a memory difficulty.');out.difficulty=b.difficulty}if(b.track!==undefined){if(!TRACKS.some(t=>t.id===b.track))throw new CasualError('Choose a race track.');out.track=b.track}for(const [k,min,max]of [['bots',0,8],['relayRounds',3,9],['relaySeconds',20,180]] as const)if(b[k]!==undefined){if(!Number.isInteger(b[k])||b[k]<min||b[k]>max)throw new CasualError('Invalid '+k+' setting.');out[k]=b[k]}}
 if(HIDDEN_ACTIONS.includes(b.action)){if(!Number.isSafeInteger(b.round)||b.round<1)throw new CasualError('Choose the current round.');out.round=b.round;if(b.turn!==undefined){if(!Number.isSafeInteger(b.turn)||b.turn<0)throw new CasualError('Choose the current tactical turn.');out.turn=b.turn;}if(['move-generals','fire-fleet'].includes(b.action)&&(!Number.isSafeInteger(b.turn)||b.turn<1))throw new CasualError('Choose the current tactical turn.');}
 if(!['create','join'].includes(b.action)){if(typeof b.requestId!=='string'||b.requestId.length<8||b.requestId.length>80)throw new CasualError('A request identifier is required.');out.requestId=b.requestId}
 if((['pirate-input','party-control','block-input','pool-shot','pool-place','roll','flip','direction','roll-property','buy-property','auction-property','end-property','pay-jail','use-jail-card','bid-property','pass-auction','build-property','sell-property','sell-set','mortgage-property','redeem-property','offer-trade','accept-trade','reject-trade','settle-property','bankrupt-property','submit-phone','draft-phone','reveal-phone','drive','explore','craft-terra','spawn-terra','beacon-terra'].includes(b.action)||b.action.includes('uno')||['accept-four','challenge-four'].includes(b.action))){if(!Number.isSafeInteger(b.round)||b.round<1)throw new CasualError('Choose the current round.');out.round=b.round}
 if(b.action==='pool-shot'||b.action==='pool-place'||b.action==='roll'||b.action==='flip'||['play-uno','draw-uno','pass-uno','choose-uno-color','accept-four','challenge-four'].includes(b.action)){if(!Number.isSafeInteger(b.turn)||b.turn<1)throw new CasualError('Choose the current turn.');out.turn=b.turn}
 if(['move-board','resign-board','offer-draw','decline-draw','claim-draw'].includes(b.action)){if(!Number.isSafeInteger(b.round)||b.round<1||!Number.isSafeInteger(b.turn)||b.turn<1)throw new CasualError('Use the current board and turn.');out.round=b.round;out.turn=b.turn;for(const k of ['from','to','promotion'])if(b[k]!==undefined){if(typeof b[k]!=='string'||b[k].length>2)throw new CasualError('Invalid board move.');out[k]=b[k]}if(b.path!==undefined){if(!Array.isArray(b.path)||b.path.length>13||!b.path.every((x:any)=>typeof x==='string'&&/^[a-h][1-8]$/.test(x)))throw new CasualError('Invalid capture route.');out.path=b.path}}
 if(b.action==='flip'){if(!Number.isInteger(b.card)||b.card<0||b.card>=200)throw new CasualError('Choose a card in the deck.');out.card=b.card}
 if(b.action==='direction'){if(!['up','right','down','left'].includes(b.direction)||!Number.isSafeInteger(b.seq)||b.seq<1)throw new CasualError('Choose a valid direction.');out.direction=b.direction;out.seq=b.seq;if(b.turns!==undefined){if(!Array.isArray(b.turns)||b.turns.length<1||b.turns.length>2||b.turns.some((t:any,i:number)=>!t||!['up','right','down','left'].includes(t.direction)||!Number.isSafeInteger(t.seq)||t.seq<1||(t.tick!==undefined&&(!Number.isSafeInteger(t.tick)||t.tick<1))||(i>0&&t.seq<=b.turns[i-1].seq)))throw new CasualError('Send up to two ordered turns.');out.turns=b.turns.map((t:any)=>({direction:t.direction,seq:t.seq,...(t.tick!==undefined?{tick:t.tick}:{})}))}}
 if(b.action==='play-uno'){if(typeof b.cardId!=='string'||b.cardId.length>80)throw new CasualError('Choose your card.');out.cardId=b.cardId;out.callUno=b.callUno===true;}
 if(b.action==='play-uno'||b.action==='choose-uno-color'){if(b.color!==undefined&&!['red','yellow','green','blue','pink','orange','teal','purple'].includes(b.color))throw new CasualError('Choose a valid color.');out.color=b.color;}
 if(b.action==='remove-inactive'||b.action==='catch-uno'){if(typeof b.playerId!=='string'||b.playerId.length>80)throw new CasualError('Choose an inactive player.');out.playerId=b.playerId}
 if(b.action.endsWith('-property')||['pass-auction','pay-jail','use-jail-card','sell-set','offer-trade','accept-trade','reject-trade'].includes(b.action)){for(const k of ['space','amount','turn','give','take','giveCash','takeCash','giveJail','takeJail','to'])if(b[k]!==undefined)out[k]=b[k]}
 if(b.action==='submit-phone'||b.action==='draft-phone'){if(!Number.isInteger(b.stage)||b.stage<0||b.stage>8)throw new CasualError('Choose the current relay task.');out.stage=b.stage;out.text=b.text;out.strokes=b.strokes;if(b.action==='draft-phone'){if(!Number.isSafeInteger(b.draftSeq)||b.draftSeq<1)throw new CasualError('Invalid draft sequence.');out.draftSeq=b.draftSeq}}
 if(b.action==='drive'||b.action==='explore'){out.seq=b.seq;for(const k of b.action==='drive'?['throttle','steer','drift','use','recover','useSeq','recoverSeq']:['left','right','jump','use','tx','ty','slot'])out[k]=b[k]}
 for(const k of ['useSeq','recoverSeq'])if(out[k]!==undefined&&(!Number.isSafeInteger(out[k])||out[k]<1||out[k]>out.seq))throw new CasualError('Invalid command identifier.');
 if(b.action==='pirate-input'){for(const k of ['seq','life','dx','down','jump','attack','special','dash','jumpSeq','attackSeq','specialSeq','dashSeq','aimX','aimY'])out[k]=b[k]}
 if(b.action==='party-control'){for(const k of ['seq','dx','dy','aim','fire','dash','brake','fireSeq','dashSeq','targetY','tx','ty'])out[k]=b[k]}
 if(b.action==='block-input'){out.seq=b.seq;out.moves=b.moves}
 if(b.action==='pool-shot'){out.angle=b.angle;out.power=b.power;out.pocket=b.pocket}
 if(b.action==='pool-place'){out.x=b.x;out.y=b.y}
 if(b.inputEpoch!==undefined){if(!Number.isSafeInteger(b.inputEpoch)||b.inputEpoch<0)throw new CasualError('Invalid arena start.');out.inputEpoch=b.inputEpoch}
 if(b.action==='craft-terra')out.recipe=b.recipe;
 if(b.action==='spawn-terra'){out.x=b.x;out.y=b.y}
 if(b.worldVersion!==undefined&&Number.isSafeInteger(b.worldVersion)&&Number.isSafeInteger(b.worldRound)){out.worldVersion=b.worldVersion;out.worldRound=b.worldRound}
 if(typeof b.scene==='string'&&b.scene.length<=128)out.scene=b.scene;
 return out;
}
export function createCasualAPI(DB:CasualDatabase|undefined,keepAlive?:((task:Promise<unknown>)=>void),newCode?:string,authenticatedHash?:string){
 async function read(code:string){if(!DB)throw new CasualError('Room storage is unavailable.',503);const row=await DB.prepare('SELECT state,revision,created_at FROM casual_rooms WHERE code=?').bind(code).first<{state:string;revision:number;created_at:number}>();if(!row)throw new CasualError('Room not found. Check the code.',404);if(Date.now()-row.created_at>ROOM_TTL)throw new CasualError('This room expired after 24 hours.',410);return{state:JSON.parse(row.state) as CasualState,revision:row.revision}}
 async function credential(req:Request){if(authenticatedHash)return authenticatedHash;const bearer=(req.headers.get('Authorization')||'').match(/^Bearer ([a-f0-9]{64})$/);return bearer?hash(bearer[1]):null}
 function authenticate(tokenHash:string|null,s:CasualState){if(!tokenHash)throw new CasualError('Join a room to play.',401);const p=s.players.find(p=>p.tokenHash===tokenHash&&!p.retired);if(!p)throw new CasualError('Your session ended. Join the room again.',401);return p.id}
 async function save(code:string,state:CasualState,revision:number){const r=await DB!.prepare('UPDATE casual_rooms SET state=?, revision=revision+1 WHERE code=? AND revision=?').bind(JSON.stringify(state),code,revision).run();return!!r.meta.changes}
 function project(s:CasualState,id:string,now:number,revision:number,round?:number,worldVersion?:number,scene?:string|null){const room={...publicCasual(s,id,now),revision};if(room.mode==='terra'&&room.round===round&&room.game?.version===worldVersion)room.game={...room.game,tiles:undefined};if(scene&&scene===roomScene(room))room.game={...room.game,obstacles:undefined};return room}
 function batch(code:string){if(!DB)throw new CasualError('Room storage is unavailable.',503);return roomBatch(DB,'casual:'+code,()=>read(code),(state:CasualState,revision:number)=>save(code,state,revision),()=>new CasualError('The room is busy. Reconnecting…',409),keepAlive,DB.roomScheduling==='durable-object')}
 async function GET(req:Request){beginRoomRequest(req);try{
  originCheck(req);const url=new URL(req.url),code=roomCode(url.searchParams.get('code')),tokenHash=await credential(req);
  if(url.searchParams.has('avatar')){const {state}=await read(code);authenticate(tokenHash,state);const version=url.searchParams.get('avatar'),owner=state.players.find(p=>!p.retired&&p.appearance?.avatar===version);if(!owner||!DB?.getAvatar)throw new CasualError('Portrait not found.',404);const stored=await DB.getAvatar(owner.id,version!);if(!stored||stored.hash!==version)throw new CasualError('Portrait changed. Refresh the room.',404);return new Response(avatarBytes(stored.data) as Uint8Array<ArrayBuffer>,{headers:{...headers(req),'Content-Type':'image/png','Cache-Control':'private, max-age=3600','X-Content-Type-Options':'nosniff'}})}
  return await batch(code).run((state,now)=>{
   const id=authenticate(tokenHash,state),advanced=advanceCasual(state,now),p=advanced.state.players.find(p=>p.id===id)!;let changed=advanced.changed;
   const messages=activeChat(advanced.state.chat,now);if(messages.length!==(advanced.state.chat||[]).length){advanced.state.chat=messages;changed=true}
   if(now-p.lastSeen>5000){p.lastSeen=now;changed=true}
   return{state:advanced.state,changed,result:(final,revision,time)=>roomHint(req,'revision')===String(revision)?reply(req,{unchanged:true,revision,serverNow:time}):reply(req,{room:project(final,id,time,revision,Number(roomHint(req,'worldRound')),Number(roomHint(req,'worldVersion')),roomHint(req,'scene'))})};
  });
 }catch(e){return casualFailure(req,e)}}
 async function POST(req:Request){beginRoomRequest(req);try{originCheck(req);const b=await casualBody(req);if(!DB)throw new CasualError('Room storage is unavailable.',503);
  if(b.action==='create'){
   const token=secret(),id=crypto.randomUUID(),tokenHash=await hash(token),now=Date.now();let code=newCode&&/^[A-HJ-NP-Z2-9]{8}$/.test(newCode)?newCode:'';if(!code)for(let i=0;i<8;i++)code+='ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[crypto.getRandomValues(new Uint8Array(1))[0]%32];
   let s=createCasual(code,id,b.name,tokenHash,b.mode as CasualMode,crypto.getRandomValues(new Uint32Array(1))[0],now);s=applyCasualAction(s,{...b,action:'configure'},id,now);s.settings.characterSelection=false;if(b.appearance)s=applyCasualAction(s,{action:'appearance',appearance:b.appearance},id,now);
   await DB.prepare('DELETE FROM casual_rooms WHERE created_at < ?').bind(now-ROOM_TTL).run();
   await DB.prepare('INSERT INTO casual_rooms(code,state,revision,created_at) VALUES(?,?,0,?)').bind(code,JSON.stringify(s),now).run();return reply(req,{token,room:{...publicCasual(s,id,now),revision:0}},201)
  }
  const token=b.action==='join'?secret():null,joinId=token?crypto.randomUUID():null,tokenHash=token?await hash(token):await credential(req);
  if(b.action==='upload-avatar'){
   if(!DB.getAvatar||!DB.putAvatar)throw new CasualError('Portrait uploads need the current room service.',503);
   const {state,revision:initialRevision}=await read(b.code),id=authenticate(tokenHash,state);let locks=avatarUploads.get(DB);if(!locks){locks=new Set();avatarUploads.set(DB,locks)}if(locks.has(id))throw new CasualError('A portrait is already uploading. Wait a moment.',429);locks.add(id);
   try{
    if(state.players.find(p=>p.id===id)?.requests.includes(b.requestId))return reply(req,{room:project(state,id,Date.now(),initialRevision)});
    const bytes=avatarBytes(b.image),version=await avatarHash(bytes);
    await batch(b.code).run((current,now)=>{authenticate(tokenHash,current);const next=structuredClone(current),p=next.players.find(p=>p.id===id)!;if(!takeRoomBudget(p,now,20))throw new CasualError('Please wait a moment before uploading another portrait.',429);return{state:next,changed:true,result:()=>null}});
    await DB.putAvatar(id,{hash:version,data:b.image},state.players.find(p=>p.id===id)?.appearance?.avatar);
    return await batch(b.code).run((current,now)=>{authenticate(tokenHash,current);const next=structuredClone(current),p=next.players.find(p=>p.id===id)!;p.appearance={...p.appearance,avatar:version,useAvatar:true};p.requests=[...p.requests.slice(-23),b.requestId];return{state:next,changed:true,result:(final,revision,time)=>reply(req,{room:project(final,id,time,revision)})}});
   }finally{locks.delete(id)}
  }
  const receiptOnly=!!authenticatedHash&&req.headers.get('X-Room-Control-Receipt')==='1'&&['direction','drive','explore','party-control','block-input','pirate-input'].includes(b.action);
  const result=(final:CasualState,id:string,revision:number,time:number,duplicate=false)=>receiptOnly?reply(req,{ack:b.requestId,revision,serverNow:time}):reply(req,{...(token?{token}:{}),...(duplicate?{ack:b.requestId}:{}),room:project(final,id,time,revision,b.worldRound,b.worldVersion,b.scene)});
  return await batch(b.code).run<Response|Promise<Response>>((state,now)=>{
   const id=joinId||authenticate(tokenHash,state);if(!joinId&&b.requestId&&state.players.find(p=>p.id===id)?.requests.includes(b.requestId)){const advanced=advanceCasual(state,now);return{state:advanced.state,changed:advanced.changed,result:(final:CasualState,revision:number,time:number)=>result(final,id,revision,time,true)}}const budget={traffic:state.players.find(p=>p.id===id)?.traffic};if(!takeRoomBudget(budget,now,b.action==='draft-phone'?10:1))throw new CasualError('Too many actions. Give the room a moment to catch up.',429);const prepared=b.action==='start'?{...state,settings:{...state.settings,characterSelection:false}}:state;const next=applyCasualAction(prepared,b.action==='join'?{...b,id,hash:tokenHash}:b,id,now),player=next.players.find(p=>p.id===id);if(player)player.traffic=budget.traffic;
   return{state:next,changed:true,result:async(final,revision,time)=>{if(b.action==='leave'||b.action==='remove-inactive'){await DB?.deleteAvatar?.(b.action==='leave'?id:b.playerId).catch(()=>{})}return b.action==='leave'?reply(req,{ok:true}):result(final,id,revision,time)}};
  });
 }catch(e){return casualFailure(req,e)}}
 async function OPTIONS(req:Request){return new Response(null,{status:204,headers:headers(req)})}
 return{GET,POST,OPTIONS};
}
