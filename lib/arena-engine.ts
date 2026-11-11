import type {RoomTraffic} from './room-budget.ts';
import {appendChat,activeChat,ChatError,type ChatMessage} from './room-chat.ts';
import {questionAt,isCorrect,publicQuestion,type GameMode} from './question-bank.ts';
export type ArenaPlayer={id:string;name:string;tokenHash:string;joinedAt:number;lastSeen:number;index:number;score:number;correct:number;wrong:number;clears:number;eliminatedAt:number|null;ready:boolean;answeredIds:string[];traffic?:RoomTraffic;receipts?:{id:string;feedback?:any}[]};
export type ArenaState={version:2;gatewayOrigin?:string;chat?:ChatMessage[];chatEpoch?:number;code:string;hostId:string;mode:GameMode;topic:string;seed:number;round:number;createdAt:number;startedAt:number|null;duration:number;players:ArenaPlayer[];events:{text:string;at:number}[]};
export const CARD_LIMIT=100, HOST_TIMEOUT=45000;
export class ArenaError extends Error{status:number;constructor(message:string,status=400){super(message);this.status=status;}}
export function createArena(code:string,id:string,hash:string,name:string,now:number):ArenaState{return {version:2,code,hostId:id,mode:'blanks',topic:'All',seed:0,round:0,createdAt:now,startedAt:null,duration:90000,players:[newPlayer(id,hash,name,now)],events:[{text:name+' opened the room.',at:now}]};}
function newPlayer(id:string,tokenHash:string,name:string,now:number):ArenaPlayer{return {id,tokenHash,name,joinedAt:now,lastSeen:now,index:0,score:0,correct:0,wrong:0,clears:0,eliminatedAt:null,ready:false,answeredIds:[]}}
export function pressure(player:ArenaPlayer,s:ArenaState,now:number){if(s.startedAt===null)return 0;const seconds=Math.max(0,(Math.min(now,s.startedAt+s.duration)-s.startedAt)/1000);return Math.max(0,Math.floor(seconds/10)+Math.floor(Math.max(0,seconds-45)/10)+Math.floor(Math.max(0,seconds-90)/10)+player.wrong*2-player.clears);}
export function updateDeaths(s:ArenaState,now:number){if(s.mode==='survival'&&s.startedAt!==null){for(const p of s.players){if(p.eliminatedAt===null&&p.index<CARD_LIMIT&&pressure(p,s,now)>=12)p.eliminatedAt=now;}}}
export function finished(s:ArenaState,now:number){return s.startedAt!==null&&(now>=s.startedAt+s.duration||(s.players.length>0&&s.players.every(p=>p.index>=CARD_LIMIT||s.mode==='survival'&&p.eliminatedAt!==null)));}
function addEvent(s:ArenaState,text:string,now:number){s.events=[...s.events.slice(-14),{text,at:now}]}
export function roundQuestion(s:ArenaState,index:number){const q=questionAt(s.seed,index,s.mode,s.topic);return {...q,id:q.id+':round:'+s.round};}
export function playerRank(players:{score:number;wrong:number}[],index:number){return 1+players.filter(p=>p.score>players[index].score||p.score===players[index].score&&p.wrong<players[index].wrong).length;}
export function applyAction(state:ArenaState,action:any,playerId:string|null,now:number):{state:ArenaState;result?:any}{
 const s=structuredClone(state);s.chat=activeChat(s.chat,now);
 if(now-s.createdAt>86400000)throw new ArenaError('This room expired after 24 hours. Create a new room.',410);
 updateDeaths(s,now);
 if(action.action==='join'){
  if(s.startedAt!==null&&!finished(s,now))throw new ArenaError('A round is running. Join when the next lobby opens.',409);
  if(s.players.length>=8)throw new ArenaError('This room is full. A maximum of 8 players can join.',409);
  if(s.players.some(p=>p.id===action.id))throw new ArenaError('You already joined this room.',409);
  const wasEmpty=s.players.length===0;s.players.push(newPlayer(action.id,action.hash,action.name,now));if(wasEmpty)s.hostId=action.id;
  addEvent(s,action.name+' joined the crew.',now);return {state:s};
 }
 const p=s.players.find(p=>p.id===playerId);
 if(!p)throw new ArenaError('Your player session is unavailable. Join the room again.',401);
 p.lastSeen=now;
 if(action.action==='disconnect'){p.lastSeen=now-HOST_TIMEOUT-1;s.chat=[];s.chatEpoch=(s.chatEpoch||0)+1;return{state:s}}
 if(action.action==='heartbeat')return {state:s};
 if(action.action==='chat'){try{s.chat=appendChat(s.chat,p.id,p.name,action.text,action.messageId,now,action.giftId,{gifId:action.gifId,effect:action.effect})}catch(e){if(e instanceof ChatError)throw new ArenaError(e.message,e.status);throw e}return {state:s}}
 if(action.action==='leave'){
  s.chat=[];s.chatEpoch=(s.chatEpoch||0)+1;
  s.players=s.players.filter(x=>x.id!==p.id);if(!s.players.length)s.startedAt=null;
  if(s.hostId===p.id)s.hostId=[...s.players].sort((a,b)=>a.joinedAt-b.joinedAt)[0]?.id||'';
  addEvent(s,p.name+' left the room.',now);return {state:s};
 }
 if(action.action==='claim-host'){
  const host=s.players.find(x=>x.id===s.hostId);
  if(host&&now-host.lastSeen<HOST_TIMEOUT)throw new ArenaError('The current host is still connected.',409);
  s.hostId=p.id;addEvent(s,p.name+' took over as room host.',now);return {state:s};
 }
 if(action.action==='remove-inactive'){
  if(s.hostId!==p.id)throw new ArenaError('Only the host can free an inactive seat.',403);
  if(s.startedAt!==null&&!finished(s,now))throw new ArenaError('Wait until the round ends to free a seat.',409);
  const target=s.players.find(x=>x.id===action.playerId);
  if(!target||target.id===p.id||now-target.lastSeen<HOST_TIMEOUT)throw new ArenaError('Only players inactive for at least 45 seconds can be removed.',409);
  s.chat=[];s.chatEpoch=(s.chatEpoch||0)+1;s.players=s.players.filter(x=>x.id!==target.id);addEvent(s,target.name+'’s inactive seat was freed.',now);return {state:s};
 }
 if(action.action==='ready'){
  if(s.startedAt!==null&&!finished(s,now))throw new ArenaError('Readiness can change in the lobby.',409);
  p.ready=!p.ready;return {state:s};
 }
 if(action.action==='configure'){
  if(s.hostId!==p.id)throw new ArenaError('Only the room host can change the game.',403);
  if(s.startedAt!==null&&!finished(s,now))throw new ArenaError('Finish this round before changing the game.',409);
  if(!['blanks','survival','quiz'].includes(action.mode)||!['All','HTML','CSS'].includes(action.topic))throw new ArenaError('Choose a valid mode and topic.');
  if(s.mode!==action.mode||s.topic!==action.topic){s.chat=[];s.chatEpoch=(s.chatEpoch||0)+1;}s.mode=action.mode;s.topic=action.topic;s.startedAt=null;s.players.forEach(p=>{p.ready=false});return {state:s};
 }
 if(action.action==='start'){
  if(s.hostId!==p.id)throw new ArenaError('Only the room host can start a round.',403);
  if(s.startedAt!==null&&!finished(s,now))throw new ArenaError('This round is already running.',409);
  if(!Number.isInteger(action.seed)||action.seed<0||action.seed>0xffffffff)throw new ArenaError('A valid round seed is required.');
  s.startedAt=now;s.round++;s.seed=action.seed;s.duration=s.mode==='blanks'?90000:s.mode==='quiz'?240000:180000;
  s.players.forEach(p=>Object.assign(p,{index:0,score:0,correct:0,wrong:0,clears:0,eliminatedAt:null,answeredIds:[],ready:false}));
  addEvent(s,'Round '+s.round+' started. '+s.mode+' · '+s.topic,now);return {state:s};
 }
 if(action.action==='answer'){
  if(s.startedAt===null)throw new ArenaError('Wait for the host to start the round.',409);
  if(finished(s,now))throw new ArenaError('This round has ended.',409);
  if(p.eliminatedAt!==null)throw new ArenaError('Your stack is full. You can watch the rest of the round.',409);
  if(p.index>=CARD_LIMIT)throw new ArenaError('You completed this round’s 100 cards. Watch your crew finish.',409);
  const q=roundQuestion(s,p.index);
  if(action.questionId!==q.id)throw new ArenaError('This answer belongs to an older question. Your progress has been refreshed.',409);
  if(p.answeredIds.includes(q.id))throw new ArenaError('This question was already scored.',409);
  const correct=isCorrect(q,action.answer);p.index++;p.answeredIds.push(q.id);
  if(correct){p.correct++;p.score+=100;p.clears+=Math.min(2,pressure(p,s,now));}else p.wrong++;
  updateDeaths(s,now);
  return {state:s,result:{correct,answer:q.answer,explanation:q.explanation,source:q.source,sources:q.sources,solutionCode:q.code&&typeof q.answer==='string'?q.code.replace('____',q.answer):undefined,points:correct?100:0}};
 }
 throw new ArenaError('Unknown room action.');
}
export function publicArena(state:ArenaState,playerId:string,now:number){
 const s=structuredClone(state);s.chat=activeChat(s.chat,now);updateDeaths(s,now);const me=s.players.find(p=>p.id===playerId);
 if(!me)throw new ArenaError('Join the room to see the game.',401);
 const ended=finished(s,now),host=s.players.find(p=>p.id===s.hostId);
 return {code:s.code,gatewayOrigin:s.gatewayOrigin,mode:s.mode,topic:s.topic,round:s.round,hostId:s.hostId,serverNow:now,startedAt:s.startedAt,duration:s.duration,ended,isHost:s.hostId===playerId,youId:playerId,canClaimHost:s.hostId!==playerId&&(!host||now-host.lastSeen>=HOST_TIMEOUT),completed:me.index>=CARD_LIMIT,
 players:s.players.map(p=>({id:p.id,name:p.name,score:p.score,correct:p.correct,wrong:p.wrong,index:p.index,ready:p.ready,online:now-p.lastSeen<35000,canRemove:now-p.lastSeen>=HOST_TIMEOUT,isHost:p.id===s.hostId,isYou:p.id===playerId,rows:Math.min(12,pressure(p,s,now)),completed:p.index>=CARD_LIMIT,eliminated:p.eliminatedAt!==null,eliminatedAt:p.eliminatedAt})).sort((a,b)=>b.score-a.score||a.wrong-b.wrong||a.id.localeCompare(b.id)),
 chat:activeChat(s.chat,now),chatEpoch:s.chatEpoch||0,question:s.startedAt!==null&&!ended&&me.eliminatedAt===null&&me.index<CARD_LIMIT?publicQuestion(roundQuestion(s,me.index)):null,events:s.events};
}
