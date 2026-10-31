import {roomBatch} from './room-batch.ts';
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
export function createArenaAPI(DB:D1Database|undefined,keepAlive?:((task:Promise<unknown>)=>void)){
async function read(code:string){if(!DB)throw new ArenaError('Room storage is temporarily unavailable.',503);const row=await DB.prepare('SELECT state,revision,created_at FROM arena_rooms WHERE code=?').bind(code).first<any>();if(!row)throw new ArenaError('Room not found. Check the invitation code.',404);if(Date.now()-row.created_at>ttl)throw new ArenaError('This room expired. Create a new one.',410);return {state:JSON.parse(row.state) as ArenaState,revision:row.revision}}
async function credential(req:Request){const token=(req.headers.get('Authorization')||'').match(/^Bearer ([a-f0-9]{64})$/);return token?hash(token[1]):null}
function authenticate(tokenHash:string|null,state:ArenaState){if(!tokenHash)throw new ArenaError('Join the room to play.',401);const p=state.players.find(p=>p.tokenHash===tokenHash);if(!p)throw new ArenaError('Your session ended. Join the room again.',401);return p.id}
async function save(code:string,state:ArenaState,revision:number){const result=await DB!.prepare('UPDATE arena_rooms SET state=?, revision=revision+1 WHERE code=? AND revision=?').bind(JSON.stringify(state),code,revision).run();return!!result.meta.changes}
function batch(code:string){if(!DB)throw new ArenaError('Room storage is unavailable.',503);return roomBatch(DB,'arena:'+code,()=>read(code),(state:ArenaState,revision:number)=>save(code,state,revision),()=>new ArenaError('The room is busy. Reconnecting…',409),keepAlive)}
async function OPTIONS(req:Request){return new Response(null,{status:204,headers:cors(req)})}
async function GET(req:Request){try{
 checkOrigin(req);const url=new URL(req.url),code=roomCode(url.searchParams.get('code')),tokenHash=await credential(req);
 return await batch(code).run((state,now)=>{
  const id=authenticate(tokenHash,state),player=state.players.find(p=>p.id===id)!;
  const messages=activeChat(state.chat,now),changed=now-player.lastSeen>=5000||messages.length!==(state.chat||[]).length;
  if(changed){player.lastSeen=now;state.chat=messages}
  return{state,changed,result:(final,revision,time)=>final.startedAt===null&&url.searchParams.get('revision')===String(revision)?reply(req,{unchanged:true,revision,serverNow:time}):reply(req,{room:{...publicArena(final,id,time),revision}})};
 });
}catch(e){return error(req,e)}}
function error(req:Request,e:unknown){return reply(req,{error:e instanceof ArenaError?e.message:'Could not complete the request. Please reconnect and try again.'},e instanceof ArenaError?e.status:503)}
async function POST(req:Request){try{checkOrigin(req);let b=await readArenaBody(req);if(!DB)throw new ArenaError('Room storage is unavailable.',503);
if(b.action==='create'){
const name=b.name;if(name.length<2||name.length>20)throw new ArenaError('Choose a display name of 2–20 characters.');const token=secret(),id=crypto.randomUUID(),tokenHash=await hash(token);const now=Date.now();let code=randomCode(),s=createArena(code,id,tokenHash,name,now);if(b.mode||b.topic)s=applyAction(s,{action:'configure',mode:b.mode||'blanks',topic:b.topic||'All'},id,now).state;
await DB.prepare('DELETE FROM arena_rooms WHERE created_at < ?').bind(now-ttl).run();
await DB.prepare('INSERT INTO arena_rooms(code,state,revision,created_at) VALUES (?,?,0,?)').bind(code,JSON.stringify(s),now).run();return reply(req,{token,room:{...publicArena(s,id,now),revision:0}},201);
}
const code=b.code;if(!/^[A-HJ-NP-Z2-9]{8}$/.test(code))throw new ArenaError('Use the 8-character room code.');const token=b.action==='join'?secret():null,id=b.action==='join'?crypto.randomUUID():null,tokenHash=token?await hash(token):await credential(req);
const action={...b,...(b.action==='join'?{id,hash:tokenHash}:{}),...(b.action==='start'?{seed:crypto.getRandomValues(new Uint32Array(1))[0]}:{})};
return await batch(code).run((state,now)=>{
 const playerId=id||authenticate(tokenHash,state),result=applyAction(state,action,playerId,now);
 return{state:result.state,changed:true,result:(final,revision,time)=>b.action==='leave'?reply(req,{ok:true}):reply(req,{...(token?{token}:{}),room:{...publicArena(final,playerId!,time),revision},...(result.result?{feedback:result.result}:{})})};
});
}catch(e){return error(req,e)}}

return {GET,POST,OPTIONS};
}
