import {newStrategy,strategyAction,advanceStrategy,leaveStrategy,publicStrategy,isStrategy,type StrategyGame} from './strategy.ts';
import {DICE_ROLL_MS,LADDER_STEP_MS,LADDER_JUMP_MS} from './motion.ts';
import {appendChat,activeChat,ChatError,type ChatMessage} from '../room-chat.ts';
import {newProperty,propertyAction,advanceProperty,bankruptEstate,type PropertyGame} from './property.ts';
import {newPhone,phoneAction,advancePhone,leavePhone,publicPhone,type PhoneGame} from './phone.ts';
import {newCircuit,circuitAction,advanceCircuit,type CircuitGame} from './circuit.ts';
import {newTerra,terraAction,advanceTerra,type TerraGame} from './terra.ts';
import {newUno,unoAction,advanceUno,leaveUno,publicUno,type UnoGame} from './uno.ts';
import {snakeMap,SNAKE_MAP_IDS,snakeStarts,SNAKE_SIZES,type SnakeMapId} from './maps.ts';
import {CasualError} from './error.ts';
export {CasualError} from './error.ts';
export type CasualMode='ladders'|'memory'|'snake'|'uno'|'property'|'phone'|'circuit'|'terra'|'chess'|'dama'|'scidama';
export const CASUAL_MODES=['ladders','memory','snake','uno','property','phone','circuit','terra','chess','dama','scidama'] as const;
export const casualCapacity=(mode:string)=>isStrategy(mode)?2:mode==='uno'?12:8;
export const casualMinimum=(mode:string)=>isStrategy(mode)||['uno','property','phone'].includes(mode)?2:1;
export type CasualSettings={cards:number;speed:number;map?:SnakeMapId;snakeSize?:32|48|64;battle?:boolean;difficulty?:'cozy'|'standard'|'expert';unoFlip?:boolean;track?:string;bots?:number;relayRounds?:number;relaySeconds?:number};
export type Direction='up'|'right'|'down'|'left';
export type Point={x:number;y:number};
export type CasualPlayer={id:string;name:string;tokenHash:string;joinedAt:number;lastSeen:number;color:number;ready:boolean;retired:boolean;requests:string[];bot?:boolean};
export type LadderGame={kind:'ladders';positions:Record<string,number>;currentId:string;turn:number;deadline:number;lockUntil:number;lastRoll:null|{playerId:string;die:number;from:number;landing:number;to:number;jump:'ladder'|'snake'|null;overshoot:boolean;at:number}};
export type MemoryGame={kind:'memory';deck:{key:number;matchedBy:string|null}[];revealed:number[];currentId:string;turn:number;deadline:number;resolveAt:number|null;scores:Record<string,number>;moves:number};
export type Worm={id:string;body:Point[];previous?:Point[];direction:Direction;queue:Direction[];queueTicks?:number[];alive:boolean;score:number;lastSeq:number;deathAt:number|null;deathPoint:Point|null;reason:string;respawnAt?:number;kills?:number;deaths?:number;best?:number;protectedUntil?:number};
export type SnakeGame={kind:'snake';size?:number;mapId?:SnakeMapId;obstacles?:Point[];worms:Worm[];food:Point[];tick:number;lastTickAt:number;startAt:number;deadline:number;pausedAt:number|null;participants:number};
export type CasualState={schema:1;chat?:ChatMessage[];chatEpoch?:number;code:string;hostId:string;mode:CasualMode;phase:'lobby'|'playing'|'paused'|'finished';createdAt:number;round:number;random:number;settings:CasualSettings;players:CasualPlayer[];game:LadderGame|MemoryGame|SnakeGame|UnoGame|PropertyGame|PhoneGame|CircuitGame|TerraGame|StrategyGame|null;result:null|{winnerIds:string[];reason:string};events:{id:number;text:string;at:number}[];eventId:number;pauseReason:string};
export const GRID_SIZE=32,TURN_MS=45000,HOST_TIMEOUT=45000,ROOM_TTL=86400000;
export const LADDERS:Record<number,number>={2:23,8:34,20:39,32:51,41:79,54:72,64:87,76:94,89:99};
export const SLIDES:Record<number,number>={17:6,30:9,47:26,59:38,66:45,75:53,83:62,91:71,98:80};
export const DIRECTIONS:Record<Direction,Point>={up:{x:0,y:-1},right:{x:1,y:0},down:{x:0,y:1},left:{x:-1,y:0}};
export const opposite=(a:Direction,b:Direction)=>DIRECTIONS[a].x+DIRECTIONS[b].x===0&&DIRECTIONS[a].y+DIRECTIONS[b].y===0;
export const samePoint=(a:Point,b:Point)=>a.x===b.x&&a.y===b.y;
export const activePlayers=(s:CasualState)=>s.players.filter(p=>!p.retired);
function event(s:CasualState,text:string,at:number){s.events=[...s.events.slice(-11),{id:++s.eventId,text,at}]}
function random(s:CasualState){let x=s.random||1;x^=x<<13;x^=x>>>17;x^=x<<5;s.random=x>>>0;return s.random/4294967296}
function shuffled<T>(s:CasualState,input:T[]){const a=[...input];for(let i=a.length-1;i>0;i--){const j=Math.floor(random(s)*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function newPlayer(id:string,name:string,tokenHash:string,now:number,color:number):CasualPlayer{return{id,name,tokenHash,joinedAt:now,lastSeen:now,color,ready:false,retired:false,requests:[]}}
export function createCasual(code:string,id:string,name:string,tokenHash:string,mode:CasualMode,seed:number,now:number):CasualState{return{schema:1,code,hostId:id,mode,phase:'lobby',createdAt:now,round:0,random:seed||1,settings:{cards:20,speed:350,map:'classic',snakeSize:48},players:[newPlayer(id,name,tokenHash,now,0)],game:null,result:null,events:[{id:1,text:name+' opened the room.',at:now}],eventId:1,pauseReason:''}}
export function boardPoint(square:number){const row=Math.floor((square-1)/10),col=(square-1)%10;return{x:(row%2?9-col:col)*100+50,y:950-row*100}}
function nextId(s:CasualState,id:string){const list=activePlayers(s);if(!list.length)return '';const old=s.players.findIndex(p=>p.id===id);for(let j=1;j<=s.players.length;j++){const p=s.players[(old+j+s.players.length)%s.players.length];if(!p.retired)return p.id}return list[0].id}
function finish(s:CasualState,winnerIds:string[],reason:string,now:number){s.phase='finished';s.result={winnerIds,reason};event(s,reason,now)}
function moveTurn(s:CasualState,g:LadderGame|MemoryGame,now:number){g.currentId=nextId(s,g.currentId);g.turn++;g.deadline=now+(g.kind==='memory'?memoryTurn(s):TURN_MS);}
const memoryTurn=(s:CasualState)=>s.settings.difficulty==='expert'?15000:s.settings.difficulty==='standard'?30000:45000;
const memoryReveal=(s:CasualState)=>s.settings.difficulty==='expert'?550:s.settings.difficulty==='standard'?1000:s.settings.difficulty==='cozy'?1800:1500;
function memoryFinished(s:CasualState,now:number){const g=s.game as MemoryGame;if(g.deck.some(c=>!c.matchedBy))return;const candidates=activePlayers(s),best=Math.max(0,...candidates.map(p=>g.scores[p.id]||0));finish(s,candidates.filter(p=>(g.scores[p.id]||0)===best).map(p=>p.id),'All pairs found. Most pairs wins; tied leaders share the win.',now)}
function spawnFood(s:CasualState,g:SnakeGame){const target=Math.min(s.settings.battle?24:12,Math.max(s.settings.battle?12:4,g.participants*2));if(g.food.length>=target)return;const size=g.size||32,occupied=new Set([...g.worms.filter(w=>w.alive).flatMap(w=>w.body),...g.food,...(g.obstacles||[])].map(p=>p.x+','+p.y));let attempts=0;while(g.food.length<target&&attempts++<target*8){const x=Math.floor(random(s)*size),y=Math.floor(random(s)*size),key=x+','+y;if(!occupied.has(key)){g.food.push({x,y});occupied.add(key)}}if(g.food.length>=target)return;const free:Point[]=[];for(let y=0;y<size;y++)for(let x=0;x<size;x++)if(!occupied.has(x+','+y))free.push({x,y});while(g.food.length<target&&free.length){const i=Math.floor(random(s)*free.length);g.food.push(free.splice(i,1)[0])}}

function newSnake(s:CasualState,now:number):SnakeGame{
 const size=s.settings.snakeSize||48,starts=snakeStarts(size);
 const worms=activePlayers(s).map((p,i)=>{const[x,y,direction]=starts[i],delta=DIRECTIONS[direction];return{id:p.id,body:(s.settings.battle?[0,1,2,3]:[0,1,2]).map(j=>({x:x-delta.x*j,y:y-delta.y*j})),direction,queue:[],alive:true,score:0,lastSeq:0,deathAt:null,deathPoint:null,reason:'',kills:0,deaths:0,best:0,respawnAt:0,protectedUntil:0} as Worm});
 const map=snakeMap(s.settings.map,size);const g:SnakeGame={kind:'snake',size,mapId:map.id,obstacles:map.obstacles.map(p=>({...p})),worms,food:[],tick:0,lastTickAt:now+3000,startAt:now+3000,deadline:now+(s.settings.battle?303000:183000),pausedAt:null,participants:worms.length};spawnFood(s,g);return g;
}
function respawnWorm(s:CasualState,g:SnakeGame,w:Worm,now:number){const occupied=new Set([...g.worms.filter(v=>v.alive).flatMap(v=>v.body),...(g.obstacles||[])].map(p=>p.x+','+p.y));const size=g.size||32,candidates=[...snakeStarts(size)];for(let y=4;y<size-4;y+=4)for(let x=4;x<size-4;x+=4)candidates.push([x,y,'right']);for(const [x,y,direction]of candidates){const d=DIRECTIONS[direction],body=[0,1,2,3].map(i=>({x:x-d.x*i,y:y-d.y*i}));if([...body,{x:x+d.x,y:y+d.y},{x:x+2*d.x,y:y+2*d.y}].some(p=>p.x<0||p.y<0||p.x>=size||p.y>=size||occupied.has(p.x+','+p.y)))continue;w.body=body;w.previous=body.map(p=>({...p}));w.direction=direction;w.queue=[];w.queueTicks=[];w.alive=true;w.score=0;w.respawnAt=0;w.protectedUntil=now+1200;w.reason='';return}w.respawnAt=now+500}
/** Simultaneous proposals make head-on and head-swap outcomes independent of player order. */
export function stepSnake(s:CasualState,now:number){
 const g=s.game as SnakeGame;if(s.settings.battle)for(const w of g.worms)if(!w.alive&&w.respawnAt&&now>=w.respawnAt&&!s.players.find(p=>p.id===w.id)?.retired)respawnWorm(s,g,w,now);const alive=g.worms.filter(w=>w.alive);for(const w of alive)w.previous=w.body.map(p=>({...p}));const heads=new Map<string,Point>(),growing=new Set<string>();
 for(const w of alive){if(w.queue.length&&(!w.queueTicks?.length||w.queueTicks[0]<=g.tick+1)){w.direction=w.queue.shift()!;w.queueTicks?.shift();}const d=DIRECTIONS[w.direction],head={x:w.body[0].x+d.x,y:w.body[0].y+d.y};heads.set(w.id,head);if(g.food.some(f=>samePoint(f,head)))growing.add(w.id)}
 const dead=new Map<string,string>(),killers=new Map<string,string>();
 for(const w of alive){const head=heads.get(w.id)!;if(head.x<0||head.y<0||head.x>=(g.size||32)||head.y>=(g.size||32)){dead.set(w.id,'Hit a wall');continue}
  if(g.obstacles?.some(p=>samePoint(p,head))){dead.set(w.id,'Hit an obstacle');continue}
  for(const other of alive){if(s.settings.battle&&other.id!==w.id&&((other.protectedUntil||0)>now||(w.protectedUntil||0)>now))continue;const otherHead=heads.get(other.id)!;
   if(other.id!==w.id&&samePoint(head,otherHead)){dead.set(w.id,'Head-on collision');break}
   if(other.id!==w.id&&samePoint(head,other.body[0])&&samePoint(otherHead,w.body[0])){dead.set(w.id,'Head-swap collision');break}
   const body=growing.has(other.id)?other.body:other.body.slice(0,-1);
   if(body.some(part=>samePoint(part,head))){dead.set(w.id,other.id===w.id?'Hit your own body':'Hit another snake');if(other.id!==w.id)killers.set(w.id,other.id);break}
  }
 }
 for(const w of alive){const head=heads.get(w.id)!;if(dead.has(w.id)){w.alive=false;w.deathAt=now;w.deathPoint=w.body[0];w.reason=dead.get(w.id)!;w.body=[];w.queue=[];w.queueTicks=[];if(s.settings.battle){w.deaths=(w.deaths||0)+1;w.respawnAt=now+2000;w.score=0;const killer=g.worms.find(v=>v.id===killers.get(w.id));if(killer)killer.kills=(killer.kills||0)+1}event(s,(s.players.find(p=>p.id===w.id)?.name||'A player')+' is out: '+w.reason.toLowerCase()+'.',now)}else{w.body.unshift(head);if(growing.has(w.id)){w.score++;w.best=Math.max(w.best||0,w.score);g.food=g.food.filter(f=>!samePoint(f,head))}else w.body.pop()}}
 g.tick++;spawnFood(s,g);const remaining=g.worms.filter(w=>w.alive);
 if(s.settings.battle)return;
 if(g.participants>1&&remaining.length<=1)finish(s,remaining.map(w=>w.id),remaining.length?'Last snake moving wins.':'The final snakes crashed together. This round is a draw.',now);
 else if(g.participants===1&&!remaining.length)finish(s,[],'Your run ended. Try a new route next time.',now);
 else if(remaining.length===1&&remaining[0].body.length===(g.size||32)*(g.size||32)-(g.obstacles?.length||0))finish(s,[remaining[0].id],'The board is full. A perfect run!',now);
}
/** Advance only from server time. No client can supply positions, food, die values or scores. */
export function advanceCasual(input:CasualState,now:number):{state:CasualState;changed:boolean}{
 if(now-input.createdAt>ROOM_TTL)throw new CasualError('This room expired after 24 hours. Create a fresh room.',410);
 const g=input.game;
 if(input.phase!=='playing'||!g)return{state:input,changed:false};
 let due=now>=g.deadline;
 if(g.kind==='snake'||g.kind==='circuit'||g.kind==='terra')due=now>=g.startAt&&(due||now-g.lastTickAt>8000||g.lastTickAt+(g.kind==='snake'?input.settings.speed:50)<=now);
 else if(g.kind==='chess'||g.kind==='dama')due=false;
 else if(g.kind==='phone'&&g.revealing)due=false;
 else if(g.kind==='memory'&&g.resolveAt!==null&&now>=g.resolveAt)due=true;
 if(!due)return{state:input,changed:false};
 return advanceOwned(structuredClone(input),now);
}
function advanceOwned(s:CasualState,now:number):{state:CasualState;changed:boolean}{
 if(now-s.createdAt>ROOM_TTL)throw new CasualError('This room expired after 24 hours. Create a fresh room.',410);let changed=false;const g=s.game;
 if(s.phase!=='playing'||!g)return{state:s,changed};
 if(g.kind==='uno')return{state:s,changed:advanceUno(s,now)};
 if(g.kind==='property')return{state:s,changed:advanceProperty(s,now)};
 if(g.kind==='phone')return{state:s,changed:advancePhone(s,now)};
 if(g.kind==='circuit')return{state:s,changed:advanceCircuit(s,now)};
 if(g.kind==='terra')return{state:s,changed:advanceTerra(s,now)};
 if((g.kind==='chess'||g.kind==='dama'||g.kind==='scidama'))return{state:s,changed:advanceStrategy(s,now)};
 if(g.kind==='snake'){
  if(now<g.startAt)return{state:s,changed};
  if(now-g.lastTickAt>8000){s.phase='paused';g.pausedAt=now;s.pauseReason='No room updates for 8 seconds. The host can resume when everyone reconnects.';event(s,'The arena paused after a connection gap.',now);return{state:s,changed:true}}
  while(g.lastTickAt+s.settings.speed<=Math.min(now,g.deadline)&&s.phase==='playing'){g.lastTickAt+=s.settings.speed;stepSnake(s,g.lastTickAt);changed=true}
  if(s.phase==='playing'&&now>=g.deadline){const survivors=g.worms.filter(w=>s.settings.battle?!s.players.find(p=>p.id===w.id)?.retired:w.alive),points=(w:Worm)=>s.settings.battle?(w.kills||0)*100+(w.best||0):w.score,best=Math.max(0,...survivors.map(points));finish(s,survivors.filter(w=>points(w)===best).map(w=>w.id),s.settings.battle?'Battle complete. Most eliminations wins, then best growth.':'Time is up. Surviving snakes with the most food share the win.',now);changed=true}
 }else if(g.kind==='ladders'||g.kind==='memory'){
  if(g.kind==='memory'&&g.resolveAt!==null&&now>=g.resolveAt){g.revealed=[];g.resolveAt=null;moveTurn(s,g,now);changed=true}
  if(now>=g.deadline){const name=s.players.find(p=>p.id===g.currentId)?.name||'Player';if(g.kind==='memory'){g.revealed=[];g.resolveAt=null}moveTurn(s,g,now);event(s,name+'’s turn timed out. Play moved to the next player.',now);changed=true}
 }
 return{state:s,changed};
}
export function applyCasualAction(input:CasualState,a:Record<string,any>,id:string|null,now:number):CasualState{
 const s=advanceOwned(structuredClone(input),now).state;s.chat=activeChat(s.chat,now);
 if(a.action==='join'){
  if(s.phase==='playing'||s.phase==='paused')throw new CasualError('This round is running. Join after the host opens the next lobby.',409);
  if(activePlayers(s).length>=casualCapacity(s.mode))throw new CasualError('This room is full. Up to '+casualCapacity(s.mode)+' players can join.',409);
  if(s.players.some(p=>p.id===a.id))throw new CasualError('You already joined this room.',409);
  const empty=activePlayers(s).length===0;s.players=s.players.filter(p=>!p.retired);const used=new Set(s.players.map(p=>p.color));let color=0;while(used.has(color))color++;
  s.players.push(newPlayer(a.id,a.name,a.hash,now,color));if(empty){s.hostId=a.id;s.phase='lobby';s.game=null;s.result=null}event(s,a.name+' joined the room.',now);return s;
 }
 const p=s.players.find(p=>p.id===id&&!p.retired);if(!p)throw new CasualError('Your session ended. Join the room again.',401);p.lastSeen=now;
 if(a.requestId){if(p.requests.includes(a.requestId))throw new CasualError('That action was already applied. The room has been refreshed.',409);p.requests=[...p.requests.slice(-23),a.requestId]}
 if(a.action==='heartbeat')return s;
 if(a.action==='chat'){try{s.chat=appendChat(s.chat,p.id,p.name,a.text,a.messageId,now,a.giftId)}catch(e){if(e instanceof ChatError)throw new CasualError(e.message,e.status);throw e}return s}
 if(a.action==='leave'||a.action==='remove-inactive'){
  const target=a.action==='leave'?p:s.players.find(x=>x.id===a.playerId&&!x.retired);
  if(a.action==='remove-inactive'){
   if(p.id!==s.hostId)throw new CasualError('Only the host can free a seat.',403);
   if(s.phase==='playing'||s.phase==='paused')throw new CasualError('Finish this round before freeing a seat.',409);
   if(!target||target.id===p.id||now-target.lastSeen<HOST_TIMEOUT)throw new CasualError('Only a player inactive for 45 seconds can be removed.',409);
  }
  if(!target)throw new CasualError('That player is no longer here.',409);s.chat=[];s.chatEpoch=(s.chatEpoch||0)+1;target.retired=true;
  if(s.hostId===target.id)s.hostId=activePlayers(s).sort((a,b)=>a.joinedAt-b.joinedAt)[0]?.id||'';
  const g=s.game;if(g&&(s.phase==='playing'||s.phase==='paused')){
   if(g.kind==='uno')leaveUno(s,target.id,now);
   else if(g.kind==='property')bankruptEstate(s,g,target.id,now);
   else if(g.kind==='phone')leavePhone(s,target.id,now);
   else if((g.kind==='chess'||g.kind==='dama'||g.kind==='scidama'))leaveStrategy(s,target.id,now);
   else if(g.kind==='circuit'||g.kind==='terra'){}
   else if(g.kind==='snake'){const worm=g.worms.find(w=>w.id===target.id);if(worm){worm.alive=false;worm.body=[];worm.reason='Left the round';worm.deathAt=now}const alive=g.worms.filter(w=>w.alive);if(!s.settings.battle&&alive.length<=1)finish(s,alive.map(w=>w.id),'A player left. The remaining snake wins.',now)}
   else if((g.kind==='ladders'||g.kind==='memory')&&g.currentId===target.id){if(g.kind==='memory'){g.revealed=[];g.resolveAt=null}moveTurn(s,g,now)}
  }
  if(!activePlayers(s).length){s.phase='lobby';s.game=null;s.result=null}
  event(s,target.name+' left the room.',now);return s;
 }
 if(a.action==='claim-host'){
  const host=s.players.find(x=>x.id===s.hostId&&!x.retired);if(host&&now-host.lastSeen<HOST_TIMEOUT)throw new CasualError('The host is still connected.',409);
  s.hostId=p.id;event(s,p.name+' became the host.',now);return s;
 }
 if(a.action==='ready'){if(s.phase!=='lobby')throw new CasualError('Ready controls are available in the lobby.',409);p.ready=!p.ready;return s}
 if(['configure','start','lobby','pause','resume'].includes(a.action)&&p.id!==s.hostId)throw new CasualError('Only the room host can do that.',403);
 if(a.action==='configure'){
  if(s.phase==='playing'||s.phase==='paused')throw new CasualError('Finish the round before changing the game.',409);
  if(!CASUAL_MODES.includes(a.mode))throw new CasualError('Choose a valid game.');
  if(activePlayers(s).length>casualCapacity(a.mode))throw new CasualError('This game has '+casualCapacity(a.mode)+' seats. Ask extra players to leave before switching.',409);
  if(!Number.isInteger(a.cards)||a.cards<12||a.cards>200||a.cards%2)throw new CasualError('Choose an even deck size from 12 to 200 cards.');
  if(![125,175,250,350,500].includes(a.speed))throw new CasualError('Choose a valid snake speed.');for(const k of ['battle','unoFlip'])if(a[k]!==undefined&&typeof a[k]!=='boolean')throw new CasualError('Invalid game option.');if(a.difficulty&&!['cozy','standard','expert'].includes(a.difficulty))throw new CasualError('Choose a valid difficulty.');if(a.track&&!['meadow','coast','night'].includes(a.track))throw new CasualError('Choose a track.');for(const [k,min,max]of [['bots',0,7],['relayRounds',3,9],['relaySeconds',20,180]] as const)if(a[k]!==undefined&&(!Number.isInteger(a[k])||a[k]<min||a[k]>max))throw new CasualError('Invalid '+k+' setting.');if(s.mode!==a.mode){s.chat=[];s.chatEpoch=(s.chatEpoch||0)+1;}s.mode=a.mode;if(a.snakeSize!==undefined&&!SNAKE_SIZES.includes(a.snakeSize))throw new CasualError('Choose a 32, 48 or 64 square arena.');if(a.map!==undefined&&!SNAKE_MAP_IDS.includes(a.map))throw new CasualError('Choose a valid map.');s.settings={...s.settings,cards:a.cards,speed:a.speed,snakeSize:a.snakeSize||s.settings.snakeSize||48,map:a.map||s.settings.map||'classic',...(a.battle!==undefined?{battle:a.battle===true}:{}),...(a.difficulty?{difficulty:a.difficulty}:{}),...(a.unoFlip!==undefined?{unoFlip:a.unoFlip===true}:{}),...(a.track?{track:a.track}:{}),...(a.bots!==undefined?{bots:a.bots}:{}),...(a.relayRounds?{relayRounds:a.relayRounds}:{}),...(a.relaySeconds?{relaySeconds:a.relaySeconds}:{})};s.phase='lobby';s.game=null;s.result=null;activePlayers(s).forEach(p=>p.ready=false);return s;
 }
 if(a.action==='lobby'){
  if(s.phase==='playing'||s.phase==='paused')throw new CasualError('Finish or end the current round first.',409);
  s.phase='lobby';s.game=null;s.result=null;s.players=s.players.filter(p=>!p.retired&&!p.bot);s.players.forEach(p=>p.ready=false);return s;
 }
 if(a.action==='start'){
  if(s.phase==='playing'||s.phase==='paused')throw new CasualError('A round is already running.',409);if(!activePlayers(s).length)throw new CasualError('Add a player first.');
  const priorUno=s.game?.kind==='uno'?s.game:null;if(s.mode==='uno'&&activePlayers(s).length<2)throw new CasualError('UNO needs 2–12 players.',409);
  if(casualMinimum(s.mode)===2&&activePlayers(s).length<2)throw new CasualError('This game needs at least two players.',409);
  s.players=s.players.filter(p=>!p.bot&&!p.retired);
  if(s.mode==='circuit')for(let i=0;i<(s.settings.bots||0)&&activePlayers(s).length<8;i++){const botId='bot-'+(s.round+1)+'-'+i;let botColor=0;while(s.players.some(p=>p.color===botColor))botColor++;s.players.push({...newPlayer(botId,['Pip','Coco','Sunny','Moss','Luna','Ash','Nova'][i], '',now,botColor),bot:true})}
  s.round++;s.phase='playing';s.result=null;s.pauseReason='';s.players=s.players.filter(p=>!p.retired);s.players.forEach(p=>{p.ready=false;p.requests=[]});const first=s.players[0].id;
  if(isStrategy(s.mode))s.game=newStrategy(s,now);
  else if(s.mode==='uno')s.game=newUno(s,now,priorUno);
  else if(s.mode==='property')s.game=newProperty(s,now);
  else if(s.mode==='phone')s.game=newPhone(s,now);
  else if(s.mode==='circuit')s.game=newCircuit(s,now);
  else if(s.mode==='terra')s.game=newTerra(s,now);
  else if(s.mode==='ladders')s.game={kind:'ladders',positions:Object.fromEntries(s.players.map(p=>[p.id,0])),currentId:first,turn:1,deadline:now+TURN_MS,lockUntil:now,lastRoll:null};
  else if(s.mode==='memory'){const keys=shuffled(s,Array.from({length:100},(_,i)=>i)).slice(0,s.settings.cards/2);s.game={kind:'memory',deck:shuffled(s,[...keys,...keys]).map(key=>({key,matchedBy:null})),revealed:[],currentId:first,turn:1,deadline:now+memoryTurn(s),resolveAt:null,scores:Object.fromEntries(s.players.map(p=>[p.id,0])),moves:0}}
  else s.game=newSnake(s,now);event(s,'Round '+s.round+' started.',now);return s;
 }
 if(a.action==='pause'||a.action==='resume'){
  if(!s.game||!['snake','circuit','terra'].includes(s.game.kind))throw new CasualError('Only simultaneous action games can be paused.');const g=s.game as SnakeGame|CircuitGame|TerraGame;
  if(a.action==='pause'){if(s.phase!=='playing')throw new CasualError('This arena is not running.',409);s.phase='paused';g.pausedAt=now;s.pauseReason='Paused by the host.';event(s,'The host paused the arena.',now)}
  else{if(s.phase!=='paused')throw new CasualError('This arena is not paused.',409);const remaining=Math.max(0,g.deadline-Math.max(g.pausedAt??now,g.startAt));g.startAt=now+3000;g.deadline=g.startAt+remaining;g.lastTickAt=g.startAt;g.pausedAt=null;s.phase='playing';s.pauseReason='';event(s,'The arena resumes after a 3-second countdown.',now)}return s;
 }
 if(a.action==='end'){
  if(p.id!==s.hostId)throw new CasualError('Only the host can end a round.',403);if(s.phase!=='playing'&&s.phase!=='paused')throw new CasualError('There is no running round.',409);finish(s,[],'The host ended this round. No winner was declared.',now);return s;
 }
 if(s.phase!=='playing'||!s.game)throw new CasualError('Wait for the host to start a round.',409);
 if(a.round!==s.round)throw new CasualError('This action belongs to an older round.',409);
 const g=s.game;
 if((g.kind==='chess'||g.kind==='dama'||g.kind==='scidama')){strategyAction(s,a,p.id,now);return s}
 if(g.kind==='uno'){unoAction(s,a,p.id,now);return s}
 if(g.kind==='property'){propertyAction(s,a,p.id,now);return s}
 if(g.kind==='phone'){phoneAction(s,a,p.id,now);return s}
 if(g.kind==='circuit'){circuitAction(s,a,p.id,now);return s}
 if(g.kind==='terra'){terraAction(s,a,p.id,now);return s}
 if(a.action==='direction'){
  if(g.kind!=='snake'||!['up','right','down','left'].includes(a.direction))throw new CasualError('Choose a valid direction.');
  const worm=g.worms.find(w=>w.id===p.id);if(!worm?.alive)throw new CasualError('Your snake is out. You can watch the round.',409);
  const turns=a.turns||[{direction:a.direction,seq:a.seq}];if(!Array.isArray(turns)||turns.length<1||turns.length>2)throw new CasualError('Send up to two ordered turns.');for(const t of turns){if(!Number.isSafeInteger(t.seq)||t.seq<1||!['up','right','down','left'].includes(t.direction))throw new CasualError('A valid input sequence is required.');if(t.seq<=worm.lastSeq)continue;if(worm.queue.length>=2)break;worm.lastSeq=t.seq;const prior=worm.queue.at(-1)||worm.direction;if(t.direction!==prior&&!opposite(t.direction,prior)){worm.queueTicks??=worm.queue.map((_,i)=>g.tick+i+1);const hinted=Number.isSafeInteger(t.tick)?Math.max(g.tick+1,Math.min(g.tick+3,t.tick)):g.tick+1;worm.queueTicks.push(Math.max(hinted,(worm.queueTicks.at(-1)||g.tick)+1));worm.queue.push(t.direction)}}return s;
 }
 if(g.kind==='snake')throw new CasualError('Use the direction controls for this game.');
 if(g.currentId!==p.id)throw new CasualError('It is another player’s turn.',403);
 if(a.turn!==g.turn)throw new CasualError('The turn changed. Your board has been refreshed.',409);
 if(a.action==='roll'){
  if(g.kind!=='ladders')throw new CasualError('Roll controls belong to Snakes & Ladders.');if(now<g.lockUntil)throw new CasualError('Wait for the pieces to finish moving.',409);
  const die=Math.floor(random(s)*6)+1,from=g.positions[p.id]||0,overshoot=from+die>100,landing=overshoot?from:from+die,to=overshoot?from:LADDERS[landing]??SLIDES[landing]??landing,jump=overshoot?null:LADDERS[landing]?'ladder':SLIDES[landing]?'snake':null;
  g.positions[p.id]=to;g.lastRoll={playerId:p.id,die,from,landing,to,jump,overshoot,at:now};g.lockUntil=now+DICE_ROLL_MS+die*LADDER_STEP_MS+(jump?LADDER_JUMP_MS:0);
  event(s,p.name+' rolled '+die+(overshoot?' and stayed on '+from+'.':jump?' · '+(jump==='ladder'?'climbed ':'slid ')+landing+' → '+to+'.':' · moved to '+to+'.'),now);
  if(to===100)finish(s,[p.id],p.name+' reached 100!',now);else moveTurn(s,g,now);return s;
 }
 if(a.action==='flip'){
  if(g.kind!=='memory')throw new CasualError('Card controls belong to Memory Garden.');if(g.resolveAt!==null)throw new CasualError('Let everyone see these two cards first.',409);
  if(!Number.isInteger(a.card)||a.card<0||a.card>=g.deck.length)throw new CasualError('Choose a card in this deck.');if(g.deck[a.card].matchedBy||g.revealed.includes(a.card))throw new CasualError('Choose a different face-down card.',409);
  g.revealed.push(a.card);if(g.revealed.length===2){g.moves++;const[first,second]=g.revealed;if(g.deck[first].key===g.deck[second].key){g.deck[first].matchedBy=p.id;g.deck[second].matchedBy=p.id;g.scores[p.id]=(g.scores[p.id]||0)+1;g.revealed=[];g.turn++;g.deadline=now+memoryTurn(s);event(s,p.name+' found a pair and keeps the turn.',now);memoryFinished(s,now)}else{g.resolveAt=now+memoryReveal(s);g.deadline=g.resolveAt+memoryTurn(s)}}
  return s;
 }
 throw new CasualError('Unknown game action.');
}
export function publicCasual(s:CasualState,id:string,now:number){
 const me=s.players.find(p=>p.id===id&&!p.retired);if(!me)throw new CasualError('Your session ended. Join again.',401);
 const host=s.players.find(p=>p.id===s.hostId&&!p.retired);let game:any=s.game;
 if(s.game&&isStrategy(s.game.kind))game=publicStrategy(s.game as StrategyGame);
 else if(s.game?.kind==='uno')game=publicUno(s.game,id);
 else if(s.game?.kind==='phone')game=publicPhone(s.game,id);
 else if(s.game?.kind==='property')game={...s.game,chance:undefined,chest:undefined};
 else if(s.game?.kind==='memory'){const g=s.game;game={...g,deck:g.deck.map((c,index)=>({index,matchedBy:c.matchedBy,...(c.matchedBy||g.revealed.includes(index)?{key:c.key}:{})}))}}
 else if(s.game?.kind==='snake')game={...s.game,worms:s.game.worms.map(({queue,queueTicks,lastSeq,...w})=>({...w,...(w.id===id?{pendingTurns:queue,pendingTicks:queueTicks,inputAck:lastSeq}:{})}))};
 return{code:s.code,hostId:s.hostId,mode:s.mode,phase:s.phase,round:s.round,serverNow:now,chat:activeChat(s.chat,now),chatEpoch:s.chatEpoch||0,settings:s.settings,game,result:s.result,pauseReason:s.pauseReason,events:s.events,isHost:id===s.hostId,youId:id,canClaimHost:id!==s.hostId&&(!host||now-host.lastSeen>=HOST_TIMEOUT),players:s.players.map(({tokenHash,requests,lastSeen,...p})=>({...p,isYou:p.id===id,isHost:p.id===s.hostId,online:!p.retired&&now-lastSeen<20000,canRemove:!p.retired&&now-lastSeen>=HOST_TIMEOUT}))};
}
export type CasualPublic=ReturnType<typeof publicCasual>&{revision?:number;network?:{rtt:number}};
