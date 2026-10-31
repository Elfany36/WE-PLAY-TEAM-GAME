import {ArenaError} from './arena-engine.ts';
const actions=new Set(['chat','create','join','heartbeat','leave','ready','configure','start','answer','claim-host','remove-inactive']);
export function roomCode(value:unknown){if(typeof value!=='string'||!/^[A-HJ-NP-Z2-9]{8}$/.test(value.trim().toUpperCase()))throw new ArenaError('Use the 8-character room code.');return value.trim().toUpperCase();}
export function validateArenaRequest(value:unknown){
 if(!value||typeof value!=='object'||Array.isArray(value))throw new ArenaError('Send a JSON object.');
 const b=value as Record<string,any>;
 if(typeof b.action!=='string'||!actions.has(b.action))throw new ArenaError('Choose a valid room action.');
 const out={...b};if(b.action==='chat'&&(typeof b.text!=='string'||!b.text.trim()||b.text.length>280||typeof b.messageId!=='string'||b.messageId.length<8||b.messageId.length>80))throw new ArenaError('Send a chat message of 1–280 characters with an identifier.');
 if(b.action==='create'||b.action==='join'){
  if(typeof b.name!=='string'||b.name.trim().length<2||b.name.trim().length>20)throw new ArenaError('Choose a display name of 2–20 characters.');out.name=b.name.trim();
 }
 if(b.action!=='create')out.code=roomCode(b.code);
 if(b.action==='configure'||b.action==='create'){
  out.mode=b.mode??'blanks';out.topic=b.topic??'All';
  if(!['blanks','survival','quiz'].includes(out.mode)||!['All','HTML','CSS'].includes(out.topic))throw new ArenaError('Choose a valid mode and topic.');
 }
 if(b.action==='answer'){
  if(typeof b.questionId!=='string'||b.questionId.length>240)throw new ArenaError('Choose the current question.');
  if(!(typeof b.answer==='string'&&b.answer.length<=160||Array.isArray(b.answer)&&b.answer.length===4&&b.answer.every(x=>typeof x==='string'&&x.length<=160)))throw new ArenaError('Send a short answer or four matching identifiers.');
 }
 if(b.action==='remove-inactive'&&(typeof b.playerId!=='string'||b.playerId.length>80))throw new ArenaError('Choose an inactive player.');
 return out;
}
export async function readArenaBody(req:Request){
 if(Number(req.headers.get('Content-Length'))>12000)throw new ArenaError('Keep requests under 12,000 bytes.',413);
 if(!req.body)throw new ArenaError('Send a JSON request.');
 const reader=req.body.getReader(),chunks:Uint8Array[]=[];let size=0;
 while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>12000){await reader.cancel();throw new ArenaError('Keep requests under 12,000 bytes.',413);}chunks.push(value);}
 const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
 let value:unknown;try{value=JSON.parse(new TextDecoder().decode(bytes));}catch{throw new ArenaError('Send a valid JSON request.');}return validateArenaRequest(value);
}
