import {activeChat} from '../room-chat.ts';
import {roomHeaders,roomOriginAllowed} from '../room-origin.ts';
import {SNAKE_MAP_IDS,SNAKE_SIZES} from './maps.ts';
import {createCasual,applyCasualAction,advanceCasual,publicCasual,CasualError,ROOM_TTL,type CasualState,type CasualMode,CASUAL_MODES} from './engine.ts';
function headers(req:Request){return roomHeaders(req)}
function reply(req:Request,data:unknown,status=200){return Response.json(data,{status,headers:headers(req)})}
function originCheck(req:Request){const o=req.headers.get('Origin');if(o&&!roomOriginAllowed(req))throw new CasualError('This frontend is not allowed to use these rooms.',403)}
function error(req:Request,e:unknown){return reply(req,{error:e instanceof CasualError?e.message:'The room service could not complete this request. Please reconnect.'},e instanceof CasualError?e.status:503)}
async function hash(token:string){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token))),n=>n.toString(16).padStart(2,'0')).join('')}
function secret(){return Array.from(crypto.getRandomValues(new Uint8Array(32)),n=>n.toString(16).padStart(2,'0')).join('')}
function roomCode(value:unknown){if(typeof value!=='string'||!/^[A-HJ-NP-Z2-9]{8}$/.test(value.trim().toUpperCase()))throw new CasualError('Use the 8-character room code.');return value.trim().toUpperCase()}
const actions=new Set(['move-board','resign-board','offer-draw','decline-draw','claim-draw','chat','create','join','configure','start','lobby','ready','heartbeat','leave','remove-inactive','claim-host','roll','flip','direction','pause','resume','end','play-uno','draw-uno','pass-uno','call-uno','catch-uno','choose-uno-color','accept-four','challenge-four','roll-property','buy-property','auction-property','end-property','pay-jail','use-jail-card','bid-property','pass-auction','build-property','sell-property','sell-set','mortgage-property','redeem-property','offer-trade','accept-trade','reject-trade','settle-property','bankrupt-property','submit-phone','reveal-phone','drive','explore','craft-terra','spawn-terra','beacon-terra']);
export async function casualBody(req:Request){
 if(Number(req.headers.get('Content-Length'))>160000)throw new CasualError('The request is too large.',413);if(!req.body)throw new CasualError('Send a JSON request.');
 const reader=req.body.getReader();let size=0;const chunks:Uint8Array[]=[];
 while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>160000){await reader.cancel();throw new CasualError('The request is too large.',413)}chunks.push(value)}
 const bytes=new Uint8Array(size);let offset=0;for(const part of chunks){bytes.set(part,offset);offset+=part.byteLength}
 let b:Record<string,any>;try{b=JSON.parse(new TextDecoder().decode(bytes))}catch{throw new CasualError(size>4000?'The request is too large.':'Send valid JSON.',size>4000?413:400)}
 if(size>4000&&b?.action!=='submit-phone')throw new CasualError('The request is too large.',413);
 if(!b||typeof b!=='object'||Array.isArray(b)||!actions.has(b.action))throw new CasualError('Choose a valid game action.');
 const out:Record<string,any>={action:b.action};if(b.action==='chat'){if(typeof b.text!=='string'||!b.text.trim()||b.text.length>280||typeof b.messageId!=='string'||b.messageId.length<8||b.messageId.length>80)throw new CasualError('Send a chat message of 1–280 characters with an identifier.');out.text=b.text;out.messageId=b.messageId;out.giftId=b.giftId}
 if(b.action==='create'||b.action==='join'){if(typeof b.name!=='string'||b.name.trim().length<2||b.name.trim().length>20)throw new CasualError('Use a display name of 2–20 characters.');out.name=b.name.trim()}
 if(b.action!=='create')out.code=roomCode(b.code);
 if(b.action==='create'||b.action==='configure'){if(!CASUAL_MODES.includes(b.mode))throw new CasualError('Choose a valid game.');out.mode=b.mode;out.map=b.map??'classic';if(!SNAKE_MAP_IDS.includes(out.map))throw new CasualError('Choose a valid map.');out.cards=b.cards??20;out.speed=b.speed??350;out.snakeSize=b.snakeSize??48;if(!SNAKE_SIZES.includes(out.snakeSize))throw new CasualError('Choose an arena size of 32, 48 or 64.');if(!Number.isInteger(out.cards)||out.cards<12||out.cards>200||out.cards%2)throw new CasualError('Choose an even deck size from 12 to 200 cards.');if(![125,175,250,350,500].includes(out.speed))throw new CasualError('Choose a valid snake speed.');for(const k of ['battle','unoFlip'])if(b[k]!==undefined){if(typeof b[k]!=='boolean')throw new CasualError('Invalid game option.');out[k]=b[k]}if(b.difficulty!==undefined){if(!['cozy','standard','expert'].includes(b.difficulty))throw new CasualError('Choose a memory difficulty.');out.difficulty=b.difficulty}if(b.track!==undefined){if(!['meadow','coast','night'].includes(b.track))throw new CasualError('Choose a race track.');out.track=b.track}for(const [k,min,max]of [['bots',0,7],['relayRounds',3,9],['relaySeconds',20,180]] as const)if(b[k]!==undefined){if(!Number.isInteger(b[k])||b[k]<min||b[k]>max)throw new CasualError('Invalid '+k+' setting.');out[k]=b[k]}}
 if(!['create','join'].includes(b.action)){if(typeof b.requestId!=='string'||b.requestId.length<8||b.requestId.length>80)throw new CasualError('A request identifier is required.');out.requestId=b.requestId}
 if((['roll','flip','direction','roll-property','buy-property','auction-property','end-property','pay-jail','use-jail-card','bid-property','pass-auction','build-property','sell-property','sell-set','mortgage-property','redeem-property','offer-trade','accept-trade','reject-trade','settle-property','bankrupt-property','submit-phone','reveal-phone','drive','explore','craft-terra','spawn-terra','beacon-terra'].includes(b.action)||b.action.includes('uno')||['accept-four','challenge-four'].includes(b.action))){if(!Number.isSafeInteger(b.round)||b.round<1)throw new CasualError('Choose the current round.');out.round=b.round}
 if(b.action==='roll'||b.action==='flip'||['play-uno','draw-uno','pass-uno','choose-uno-color','accept-four','challenge-four'].includes(b.action)){if(!Number.isSafeInteger(b.turn)||b.turn<1)throw new CasualError('Choose the current turn.');out.turn=b.turn}
 if(['move-board','resign-board','offer-draw','decline-draw','claim-draw'].includes(b.action)){if(!Number.isSafeInteger(b.round)||b.round<1||!Number.isSafeInteger(b.turn)||b.turn<1)throw new CasualError('Use the current board and turn.');out.round=b.round;out.turn=b.turn;for(const k of ['from','to','promotion'])if(b[k]!==undefined){if(typeof b[k]!=='string'||b[k].length>2)throw new CasualError('Invalid board move.');out[k]=b[k]}if(b.path!==undefined){if(!Array.isArray(b.path)||b.path.length>13||!b.path.every((x:any)=>typeof x==='string'&&/^[a-h][1-8]$/.test(x)))throw new CasualError('Invalid capture route.');out.path=b.path}}
 if(b.action==='flip'){if(!Number.isInteger(b.card)||b.card<0||b.card>=200)throw new CasualError('Choose a card in the deck.');out.card=b.card}
 if(b.action==='direction'){if(!['up','right','down','left'].includes(b.direction)||!Number.isSafeInteger(b.seq)||b.seq<1)throw new CasualError('Choose a valid direction.');out.direction=b.direction;out.seq=b.seq;if(b.turns!==undefined){if(!Array.isArray(b.turns)||b.turns.length<1||b.turns.length>2||b.turns.some((t:any,i:number)=>!t||!['up','right','down','left'].includes(t.direction)||!Number.isSafeInteger(t.seq)||t.seq<1||(t.tick!==undefined&&(!Number.isSafeInteger(t.tick)||t.tick<1))||(i>0&&t.seq<=b.turns[i-1].seq)))throw new CasualError('Send up to two ordered turns.');out.turns=b.turns.map((t:any)=>({direction:t.direction,seq:t.seq,...(t.tick!==undefined?{tick:t.tick}:{})}))}}
 if(b.action==='play-uno'){if(typeof b.cardId!=='string'||b.cardId.length>80)throw new CasualError('Choose your card.');out.cardId=b.cardId;out.callUno=b.callUno===true;}
 if(b.action==='play-uno'||b.action==='choose-uno-color'){if(b.color!==undefined&&!['red','yellow','green','blue','pink','orange','teal','purple'].includes(b.color))throw new CasualError('Choose a valid color.');out.color=b.color;}
 if(b.action==='remove-inactive'||b.action==='catch-uno'){if(typeof b.playerId!=='string'||b.playerId.length>80)throw new CasualError('Choose an inactive player.');out.playerId=b.playerId}
 if(b.action.endsWith('-property')||['pass-auction','pay-jail','use-jail-card','sell-set','offer-trade','accept-trade','reject-trade'].includes(b.action)){for(const k of ['space','amount','turn','give','take','giveCash','takeCash','giveJail','takeJail','to'])if(b[k]!==undefined)out[k]=b[k]}
 if(b.action==='submit-phone'){if(!Number.isInteger(b.stage)||b.stage<0||b.stage>8)throw new CasualError('Choose the current relay task.');out.stage=b.stage;out.text=b.text;out.strokes=b.strokes}
 if(b.action==='drive'||b.action==='explore'){out.seq=b.seq;for(const k of b.action==='drive'?['throttle','steer','drift','use','recover']:['left','right','jump','use','tx','ty','slot'])out[k]=b[k]}
 if(b.action==='craft-terra')out.recipe=b.recipe;
 if(b.action==='spawn-terra'){out.x=b.x;out.y=b.y}
 if(b.worldVersion!==undefined&&Number.isSafeInteger(b.worldVersion)&&Number.isSafeInteger(b.worldRound)){out.worldVersion=b.worldVersion;out.worldRound=b.worldRound}
 return out;
}
export function createCasualAPI(DB:D1Database|undefined){
 async function read(code:string){if(!DB)throw new CasualError('Room storage is unavailable.',503);const row=await DB.prepare('SELECT state,revision,created_at FROM casual_rooms WHERE code=?').bind(code).first<{state:string;revision:number;created_at:number}>();if(!row)throw new CasualError('Room not found. Check the code.',404);if(Date.now()-row.created_at>ROOM_TTL)throw new CasualError('This room expired after 24 hours.',410);return{state:JSON.parse(row.state) as CasualState,revision:row.revision}}
 async function authenticate(req:Request,s:CasualState){const bearer=(req.headers.get('Authorization')||'').match(/^Bearer ([a-f0-9]{64})$/);if(!bearer)throw new CasualError('Join a room to play.',401);const tokenHash=await hash(bearer[1]),p=s.players.find(p=>p.tokenHash===tokenHash&&!p.retired);if(!p)throw new CasualError('Your session ended. Join the room again.',401);return p.id}
 async function save(code:string,state:CasualState,revision:number){const r=await DB!.prepare('UPDATE casual_rooms SET state=?, revision=revision+1 WHERE code=? AND revision=?').bind(JSON.stringify(state),code,revision).run();return!!r.meta.changes}
 function project(s:CasualState,id:string,now:number,revision:number,round?:number,worldVersion?:number){const room={...publicCasual(s,id,now),revision};if(room.mode==='terra'&&room.round===round&&room.game?.version===worldVersion)room.game={...room.game,tiles:undefined};return room}
 async function GET(req:Request){try{originCheck(req);const code=roomCode(new URL(req.url).searchParams.get('code'));for(let i=0;i<16;i++){
  const row=await read(code),id=await authenticate(req,row.state),now=Date.now(),advanced=advanceCasual(row.state,now),p=advanced.state.players.find(p=>p.id===id)!;let changed=advanced.changed;const messages=activeChat(advanced.state.chat,now);if(messages.length!==(advanced.state.chat||[]).length){advanced.state.chat=messages;changed=true}
  if(now-p.lastSeen>5000){p.lastSeen=now;changed=true}
  if(changed&&!await save(code,advanced.state,row.revision))continue;
  return reply(req,{room:project(advanced.state,id,now,row.revision+(changed?1:0),Number(new URL(req.url).searchParams.get('worldRound')),Number(new URL(req.url).searchParams.get('worldVersion')))})
 }throw new CasualError('The room is busy. Reconnecting…',409)}catch(e){return error(req,e)}}
 async function POST(req:Request){try{originCheck(req);const b=await casualBody(req);if(!DB)throw new CasualError('Room storage is unavailable.',503);
  if(b.action==='create'){
   const token=secret(),id=crypto.randomUUID(),tokenHash=await hash(token),now=Date.now();let code='';for(let i=0;i<8;i++)code+='ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[crypto.getRandomValues(new Uint8Array(1))[0]%32];
   let s=createCasual(code,id,b.name,tokenHash,b.mode as CasualMode,crypto.getRandomValues(new Uint32Array(1))[0],now);s=applyCasualAction(s,{...b,action:'configure'},id,now);
   await DB.prepare('DELETE FROM casual_rooms WHERE created_at < ?').bind(now-ROOM_TTL).run();
   await DB.prepare('INSERT INTO casual_rooms(code,state,revision,created_at) VALUES(?,?,0,?)').bind(code,JSON.stringify(s),now).run();return reply(req,{token,room:{...publicCasual(s,id,now),revision:0}},201)
  }
  const token=b.action==='join'?secret():null,joinId=token?crypto.randomUUID():null,tokenHash=token?await hash(token):null;
  for(let i=0;i<16;i++){
   const row=await read(b.code),now=Date.now(),id=joinId||await authenticate(req,row.state);
   const s=applyCasualAction(row.state,b.action==='join'?{...b,id,hash:tokenHash}:b,id,now);
   if(!await save(b.code,s,row.revision))continue;
   if(b.action==='leave')return reply(req,{ok:true});return reply(req,{...(token?{token}:{}),room:project(s,id,now,row.revision+1,b.worldRound,b.worldVersion)})
  }throw new CasualError('The room is busy. Please try again.',409)
 }catch(e){return error(req,e)}}
 async function OPTIONS(req:Request){return new Response(null,{status:204,headers:headers(req)})}
 return{GET,POST,OPTIONS};
}
