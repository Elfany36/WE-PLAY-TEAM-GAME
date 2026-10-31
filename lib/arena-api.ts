import {activeChat} from './room-chat.ts';
import {roomHeaders,roomOriginAllowed} from './room-origin.ts';
import {createArena,applyAction,publicArena,ArenaError,type ArenaState} from './arena-engine.ts';
import {readArenaBody,roomCode} from './arena-request.ts';
const ttl=86400000;
function cors(req:Request){return roomHeaders(req)}
function reply(req:Request,data:unknown,status=200){return Response.json(data,{status,headers:cors(req)})}
async function hash(token:string){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token))),x=>x.toString(16).padStart(2,'0')).join('')}
function randomCode(){return Array.from(crypto.getRandomValues(new Uint8Array(8)),n=>'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[n%32]).join('')}
function secret(){return Array.from(crypto.getRandomValues(new Uint8Array(32)),x=>x.toString(16).padStart(2,'0')).join('')}
function checkOrigin(req:Request){const origin=req.headers.get('Origin');if(origin&&!roomOriginAllowed(req))throw new ArenaError('This frontend is not allowed to use these rooms.',403)}
export function createArenaAPI(DB:D1Database|undefined){
async function read(code:string){if(!DB)throw new ArenaError('Room storage is temporarily unavailable.',503);const row=await DB.prepare('SELECT state,revision,created_at FROM arena_rooms WHERE code=?').bind(code).first<any>();if(!row)throw new ArenaError('Room not found. Check the invitation code.',404);if(Date.now()-row.created_at>ttl)throw new ArenaError('This room expired. Create a new one.',410);return {state:JSON.parse(row.state) as ArenaState,revision:row.revision}}
async function authenticate(req:Request,state:ArenaState){const token=(req.headers.get('Authorization')||'').replace(/^Bearer /,'');if(token.length!==64)throw new ArenaError('Join the room to play.',401);const tokenHash=await hash(token);const p=state.players.find(p=>p.tokenHash===tokenHash);if(!p)throw new ArenaError('Your session ended. Join the room again.',401);return p.id;}
async function OPTIONS(req:Request){return new Response(null,{status:204,headers:cors(req)})}
async function GET(req:Request){try{checkOrigin(req);const code=roomCode(new URL(req.url).searchParams.get('code'));
 for(let attempt=0;attempt<12;attempt++){
  const row=await read(code),id=await authenticate(req,row.state),now=Date.now(),player=row.state.players.find(p=>p.id===id)!;
  const messages=activeChat(row.state.chat,now),changed=now-player.lastSeen>=5000||messages.length!==(row.state.chat||[]).length;
  if(changed){player.lastSeen=now;row.state.chat=messages;const result=await DB!.prepare('UPDATE arena_rooms SET state=?, revision=revision+1 WHERE code=? AND revision=?').bind(JSON.stringify(row.state),code,row.revision).run();if(!result.meta.changes)continue;}
  return reply(req,{room:{...publicArena(row.state,id,now),revision:row.revision+(changed?1:0)}});
 }throw new ArenaError('The room is busy. Reconnecting…',409);
}catch(e){return error(req,e)}}
function error(req:Request,e:unknown){return reply(req,{error:e instanceof ArenaError?e.message:'Could not complete the request. Please reconnect and try again.'},e instanceof ArenaError?e.status:503)}
async function POST(req:Request){try{checkOrigin(req);let b=await readArenaBody(req);if(!DB)throw new ArenaError('Room storage is unavailable.',503);
if(b.action==='create'){
const name=b.name;if(name.length<2||name.length>20)throw new ArenaError('Choose a display name of 2–20 characters.');const token=secret(),id=crypto.randomUUID(),tokenHash=await hash(token);const now=Date.now();let code=randomCode(),s=createArena(code,id,tokenHash,name,now);if(b.mode||b.topic)s=applyAction(s,{action:'configure',mode:b.mode||'blanks',topic:b.topic||'All'},id,now).state;
await DB.prepare('DELETE FROM arena_rooms WHERE created_at < ?').bind(now-ttl).run();
await DB.prepare('INSERT INTO arena_rooms(code,state,revision,created_at) VALUES (?,?,0,?)').bind(code,JSON.stringify(s),now).run();return reply(req,{token,room:{...publicArena(s,id,now),revision:0}},201);
}
const code=b.code;if(!/^[A-HJ-NP-Z2-9]{8}$/.test(code))throw new ArenaError('Use the 8-character room code.');const token=b.action==='join'?secret():null,id=b.action==='join'?crypto.randomUUID():null,tokenHash=token?await hash(token):null;
for(let attempt=0;attempt<12;attempt++){
 const row=await read(code),now=Date.now();let playerId=id;
 if(b.action==='join'){const name=b.name;if(name.length<2||name.length>20)throw new ArenaError('Choose a display name of 2–20 characters.');b={...b,id,hash:tokenHash,name};}else playerId=await authenticate(req,row.state);
 const action={...b,...(b.action==='start'?{seed:crypto.getRandomValues(new Uint32Array(1))[0]}:{})};
 const result=applyAction(row.state,action,playerId,now);
 const updated=await DB.prepare('UPDATE arena_rooms SET state=?, revision=revision+1 WHERE code=? AND revision=?').bind(JSON.stringify(result.state),code,row.revision).run();
 if(!updated.meta.changes)continue;
 if(b.action==='leave')return reply(req,{ok:true});return reply(req,{...(token?{token}:{}),room:{...publicArena(result.state,playerId!,now),revision:row.revision+1},...(result.result?{feedback:result.result}:{})});
}
throw new ArenaError('The room is busy. Please try that action again.',409);
}catch(e){return error(req,e)}}

return {GET,POST,OPTIONS};
}
