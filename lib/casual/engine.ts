import {newPirate,advancePirate,pirateAction,leavePirate,publicPirate,pirateSettings,type PirateGame,type PirateSettings} from './pirate.ts';
import {newSolitaire,solitaireAction,advanceSolitaire,publicSolitaire,leaveSolitaire,type SolitaireGame} from './solitaire.ts';
import {newSketch,sketchAction,advanceSketch,sketchChat,leaveSketch,publicSketch,type SketchGame} from './sketch.ts';
import {newGameSettings,newGameActionFields,type NewGameSettings} from './new-game-settings.ts';
import {newGenerals,generalsAction,advanceGenerals,publicGenerals,type GeneralsGame} from './generals.ts';
import {newFleet,fleetAction,advanceFleet,publicFleet,type FleetGame} from './fleet.ts';
import {hiddenSettings,type HiddenSettings} from './hidden-settings.ts';
import {finishBattle} from './hidden-battle.ts';
import {validateAppearance,modelFamily,type Appearance} from './appearance.ts';
import {TABLE_SCENE_IDS,type TableScene} from './scenes.ts';
import {advanceBots,botsDue,type BotBrain} from './bots.ts';
import {compareSnake} from './snake-rank.ts';
import {resumeTimeline} from './pause.ts';
import type {RoomTraffic} from '../room-budget.ts';
import {newParty,advanceParty,partyAction,isParty,CLUB_MAPS,type PartyGame} from './party.ts';
import {newBlocks,advanceBlocks,blocksAction,publicBlocks,type BlocksGame} from './blocks.ts';
import {newPool,advancePool,poolAction,type PoolGame} from './pool.ts';
import {newStrategy,strategyAction,advanceStrategy,leaveStrategy,publicStrategy,isStrategy,type StrategyGame} from './strategy.ts';
import {DICE_ROLL_MS,LADDER_STEP_MS,LADDER_JUMP_MS,ladderMoveDuration} from './motion.ts';
import {appendChat,activeChat,ChatError,type ChatMessage} from '../room-chat.ts';
import {newProperty,propertyAction,advanceProperty,bankruptEstate,type PropertyGame} from './property.ts';
import {newPhone,phoneAction,advancePhone,leavePhone,publicPhone,type PhoneGame} from './phone.ts';
import {newCircuit,circuitAction,advanceCircuit,TRACKS,type CircuitGame} from './circuit.ts';
import {newTerra,terraAction,advanceTerra,type TerraGame} from './terra.ts';
import {newUno,unoAction,advanceUno,leaveUno,publicUno,type UnoGame} from './uno.ts';
import {snakeMap,SNAKE_MAP_IDS,snakeStarts,SNAKE_SIZES,type SnakeMapId} from './maps.ts';
import {CasualError} from './error.ts';
export {CasualError} from './error.ts';
export type CasualMode='ladders'|'memory'|'snake'|'uno'|'property'|'phone'|'circuit'|'terra'|'chess'|'dama'|'scidama'|'sumo'|'tanks'|'pong'|'marble'|'blocks'|'pool'|'generals'|'fleet'|'solitaire'|'sketch'|'pirate';
export const CASUAL_MODES=['ladders','memory','snake','uno','property','phone','circuit','terra','chess','dama','scidama','sumo','tanks','pong','marble','blocks','pool','generals','fleet','solitaire','sketch','pirate'] as const;
export const casualCapacity=(mode:string)=>isStrategy(mode)||['pong','pool','generals','fleet'].includes(mode)?2:mode==='uno'?12:mode==='pirate'?6:8;
export const casualMinimum=(mode:string)=>isStrategy(mode)||['uno','property','phone','sketch','sumo','tanks','pong','pool','generals','fleet','pirate'].includes(mode)?2:1;
export type CasualSettings=PirateSettings&NewGameSettings&HiddenSettings&{roundSeconds?:60|120|180|300|600;winTarget?:5|10|11|20|21;raceLaps?:1|2|3|5;scene?:TableScene;characterSelection?:boolean;arcadeV2?:boolean;unoSameColor?:boolean;sumoFormat?:'bracket'|'classic';blockPace?:'arcade'|'expert'|'blitz';cards:number;speed:number;map?:SnakeMapId;snakeSize?:32|48|64;battle?:boolean;difficulty?:'cozy'|'standard'|'expert';unoFlip?:boolean;track?:string;bots?:number;relayRounds?:number;relaySeconds?:number;arena?:'garden'|'canyon'|'neon'|'harbor'|'foundry'|'glacier'|'bamboo'|'relay'};
export type Direction='up'|'right'|'down'|'left';
export type Point={x:number;y:number};
export type CasualPlayer={id:string;name:string;tokenHash:string;joinedAt:number;lastSeen:number;color:number;ready:boolean;characterRound?:number;retired:boolean;requests:string[];role?:'player'|'spectator';appearance?:Appearance;traffic?:RoomTraffic;bot?:boolean};
export type LadderGame={kind:'ladders';positions:Record<string,number>;currentId:string;turn:number;deadline:number;lockUntil:number;lastRoll:null|{playerId:string;die:number;from:number;landing:number;to:number;jump:'ladder'|'snake'|null;overshoot:boolean;at:number}};
export type MemoryGame={kind:'memory';deck:{key:number;matchedBy:string|null}[];revealed:number[];currentId:string;turn:number;deadline:number;resolveAt:number|null;scores:Record<string,number>;moves:number};
export type Worm={id:string;body:Point[];trail?:Point[];previous?:Point[];direction:Direction;queue:Direction[];queueTicks?:number[];alive:boolean;score:number;lastSeq:number;deathAt:number|null;deathPoint:Point|null;reason:string;respawnAt?:number;kills?:number;deaths?:number;best?:number;protectedUntil?:number};
export type SnakeGame={kind:'snake';size?:number;mapId?:SnakeMapId;obstacles?:Point[];worms:Worm[];food:Point[];tick:number;lastTickAt:number;startAt:number;deadline:number;pausedAt:number|null;participants:number};
export type CasualState={schema:1;ai?:BotBrain;chat?:ChatMessage[];chatEpoch?:number;code:string;hostId:string;mode:CasualMode;phase:'lobby'|'playing'|'paused'|'finished';createdAt:number;round:number;random:number;settings:CasualSettings;players:CasualPlayer[];game:LadderGame|MemoryGame|SnakeGame|UnoGame|PropertyGame|PhoneGame|CircuitGame|TerraGame|StrategyGame|PartyGame|BlocksGame|PoolGame|GeneralsGame|FleetGame|SolitaireGame|SketchGame|PirateGame|null;result:null|{winnerIds:string[];reason:string};events:{id:number;text:string;at:number}[];eventId:number;pauseReason:string};
export const GRID_SIZE=32,TURN_MS=45000,HOST_TIMEOUT=45000,ROOM_TTL=86400000;
export const LADDERS:Record<number,number>={2:23,8:34,20:39,32:51,41:79,54:72,64:87,76:94,89:99};
export const SLIDES:Record<number,number>={17:6,30:9,47:26,59:38,66:45,75:53,83:62,91:71,98:80};
export const DIRECTIONS:Record<Direction,Point>={up:{x:0,y:-1},right:{x:1,y:0},down:{x:0,y:1},left:{x:-1,y:0}};
export const opposite=(a:Direction,b:Direction)=>DIRECTIONS[a].x+DIRECTIONS[b].x===0&&DIRECTIONS[a].y+DIRECTIONS[b].y===0;
export const samePoint=(a:Point,b:Point)=>a.x===b.x&&a.y===b.y;
export const activePlayers=(s:CasualState)=>s.players.filter(p=>!p.retired&&p.role!=='spectator');
/** An absent host must not strand a paused arena; this grants resume only. */
export function canResumeCasual(s:CasualState,id:string,now:number){
 if(s.phase!=='paused'||!s.game||!['snake','circuit','terra','sumo','tanks','pong','marble','blocks','pool','pirate'].includes(s.game.kind))return false;
 const viewer=s.players.find(p=>p.id===id&&!p.retired&&!p.bot),host=s.players.find(p=>p.id===s.hostId&&!p.retired);
 return !!viewer&&(id===s.hostId||!host||now-host.lastSeen>=20000);
}
function event(s:CasualState,text:string,at:number){s.events=[...s.events.slice(-11),{id:++s.eventId,text,at}]}
function random(s:CasualState){let x=s.random||1;x^=x<<13;x^=x>>>17;x^=x<<5;s.random=x>>>0;return s.random/4294967296}
function shuffled<T>(s:CasualState,input:T[]){const a=[...input];for(let i=a.length-1;i>0;i--){const j=Math.floor(random(s)*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function newPlayer(id:string,name:string,tokenHash:string,now:number,color:number):CasualPlayer{return{id,name,tokenHash,joinedAt:now,lastSeen:now,color,ready:false,retired:false,requests:[]}}
export function createCasual(code:string,id:string,name:string,tokenHash:string,mode:CasualMode,seed:number,now:number):CasualState{return{schema:1,code,hostId:id,mode,phase:'lobby',createdAt:now,round:0,random:seed||1,settings:{cards:20,speed:350,map:'classic',snakeSize:48},players:[newPlayer(id,name,tokenHash,now,0)],game:null,result:null,events:[{id:1,text:name+' opened the room.',at:now}],eventId:1,pauseReason:''}}
export function boardPoint(square:number){const row=Math.floor((square-1)/10),col=(square-1)%10;return{x:(row%2?9-col:col)*100+50,y:950-row*100}}
function nextId(s:CasualState,id:string){const list=activePlayers(s);if(!list.length)return '';const old=s.players.findIndex(p=>p.id===id);for(let j=1;j<=s.players.length;j++){const p=s.players[(old+j+s.players.length)%s.players.length];if(!p.retired&&p.role!=='spectator')return p.id}return list[0].id}
function finish(s:CasualState,winnerIds:string[],reason:string,now:number){s.phase='finished';s.result={winnerIds,reason};event(s,reason,now)}
function moveTurn(s:CasualState,g:LadderGame|MemoryGame,now:number){g.currentId=nextId(s,g.currentId);g.turn++;g.deadline=now+(g.kind==='memory'?memoryTurn(s):TURN_MS);}
const memoryTurn=(s:CasualState)=>s.settings.difficulty==='expert'?15000:s.settings.difficulty==='standard'?30000:45000;
const memoryReveal=(s:CasualState)=>s.settings.difficulty==='expert'?1200:s.settings.difficulty==='standard'?1600:s.settings.difficulty==='cozy'?2200:1500;
function memoryFinished(s:CasualState,now:number){const g=s.game as MemoryGame;if(g.deck.some(c=>!c.matchedBy))return;const candidates=activePlayers(s),best=Math.max(0,...candidates.map(p=>g.scores[p.id]||0));finish(s,candidates.filter(p=>(g.scores[p.id]||0)===best).map(p=>p.id),'All pairs found. Most pairs wins; tied leaders share the win.',now)}
function spawnFood(s:CasualState,g:SnakeGame){const target=Math.min(s.settings.battle?24:12,Math.max(s.settings.battle?12:4,g.participants*2));if(g.food.length>=target)return;const size=g.size||32,occupied=new Set([...g.worms.filter(w=>w.alive).flatMap(w=>w.body),...g.food,...(g.obstacles||[])].map(p=>p.x+','+p.y));let attempts=0;while(g.food.length<target&&attempts++<target*8){const x=Math.floor(random(s)*size),y=Math.floor(random(s)*size),key=x+','+y;if(!occupied.has(key)){g.food.push({x,y});occupied.add(key)}}if(g.food.length>=target)return;const free:Point[]=[];for(let y=0;y<size;y++)for(let x=0;x<size;x++)if(!occupied.has(x+','+y))free.push({x,y});while(g.food.length<target&&free.length){const i=Math.floor(random(s)*free.length);g.food.push(free.splice(i,1)[0])}}

function newSnake(s:CasualState,now:number):SnakeGame{
 const size=s.settings.snakeSize||48,starts=snakeStarts(size);
 const worms=activePlayers(s).map((p,i)=>{const[x,y,direction]=starts[i],delta=DIRECTIONS[direction];return{id:p.id,body:(s.settings.battle?[0,1,2,3]:[0,1,2]).map(j=>({x:x-delta.x*j,y:y-delta.y*j})),direction,queue:[],alive:true,score:0,lastSeq:0,deathAt:null,deathPoint:null,reason:'',kills:0,deaths:0,best:0,respawnAt:0,protectedUntil:0} as Worm});
 const map=snakeMap(s.settings.map,size);const g:SnakeGame={kind:'snake',size,mapId:map.id,obstacles:map.obstacles.map(p=>({...p})),worms,food:[],tick:0,lastTickAt:now+3000,startAt:now+3000,deadline:now+3000+(s.settings.roundSeconds?s.settings.roundSeconds*1000:s.settings.battle?300000:180000),pausedAt:null,participants:worms.length};spawnFood(s,g);return g;
}
function respawnWorm(s:CasualState,g:SnakeGame,w:Worm,now:number){const occupied=new Set([...g.worms.filter(v=>v.alive).flatMap(v=>v.body),...(g.obstacles||[])].map(p=>p.x+','+p.y));for(const other of g.worms)if(other.alive&&other.body.length)for(const delta of Object.values(DIRECTIONS)){const head=other.body[0];occupied.add((head.x+delta.x)+','+(head.y+delta.y))}const size=g.size||32,candidates=[...snakeStarts(size)];for(let y=4;y<size-4;y+=4)for(let x=4;x<size-4;x+=4)candidates.push([x,y,'right']);for(const [x,y,direction]of candidates){const d=DIRECTIONS[direction],body=[0,1,2,3].map(i=>({x:x-d.x*i,y:y-d.y*i}));if([...body,{x:x+d.x,y:y+d.y},{x:x+2*d.x,y:y+2*d.y}].some(p=>p.x<0||p.y<0||p.x>=size||p.y>=size||occupied.has(p.x+','+p.y)))continue;w.body=body;w.trail=body.map(p=>({...p}));w.previous=body.map(p=>({...p}));w.direction=direction;w.queue=[];w.queueTicks=[];w.alive=true;w.score=0;w.respawnAt=0;w.protectedUntil=0;w.reason='';return}w.respawnAt=now+500}
/** Simultaneous proposals make head-on and head-swap outcomes independent of player order. */
export function stepSnake(s:CasualState,now:number){
 const g=s.game as SnakeGame;if(s.settings.battle)for(const w of g.worms)if(!w.alive&&w.respawnAt&&now>=w.respawnAt&&!s.players.find(p=>p.id===w.id)?.retired)respawnWorm(s,g,w,now);const alive=g.worms.filter(w=>w.alive);for(const w of alive)w.previous=w.body.map(p=>({...p}));const heads=new Map<string,Point>(),growing=new Set<string>();
 for(const w of alive){if(w.queue.length&&(!w.queueTicks?.length||w.queueTicks[0]<=g.tick+1)){w.direction=w.queue.shift()!;w.queueTicks?.shift();}const d=DIRECTIONS[w.direction],head={x:w.body[0].x+d.x,y:w.body[0].y+d.y};heads.set(w.id,head);if(g.food.some(f=>samePoint(f,head)))growing.add(w.id)}
 const dead=new Map<string,string>(),killers=new Map<string,string>();
 for(const w of alive){const head=heads.get(w.id)!;if(head.x<0||head.y<0||head.x>=(g.size||32)||head.y>=(g.size||32)){dead.set(w.id,'Hit a wall');continue}
  if(g.obstacles?.some(p=>samePoint(p,head))){dead.set(w.id,'Hit an obstacle');continue}
  for(const other of alive){const otherHead=heads.get(other.id)!;
   if(other.id!==w.id&&samePoint(head,otherHead)){dead.set(w.id,'Head-on collision');break}
   if(other.id!==w.id&&samePoint(head,other.body[0])&&samePoint(otherHead,w.body[0])){dead.set(w.id,'Head-swap collision');break}
   const body=growing.has(other.id)?other.body:other.body.slice(0,-1);
   if(body.some(part=>samePoint(part,head))){dead.set(w.id,other.id===w.id?'Hit your own body':'Hit another snake');if(other.id!==w.id)killers.set(w.id,other.id);break}
  }
 }
 for(const w of alive){const head=heads.get(w.id)!;if(dead.has(w.id)){w.alive=false;w.deathAt=now;w.deathPoint=w.body[0];w.reason=dead.get(w.id)!;w.body=[];w.queue=[];w.queueTicks=[];if(s.settings.battle){w.deaths=(w.deaths||0)+1;w.respawnAt=now+2000;w.score=0;const killer=g.worms.find(v=>v.id===killers.get(w.id));if(killer)killer.kills=(killer.kills||0)+1}event(s,(s.players.find(p=>p.id===w.id)?.name||'A player')+' is out: '+w.reason.toLowerCase()+'.',now)}else{w.trail=[head,...(w.trail||w.body)].slice(0,32);w.body.unshift(head);if(growing.has(w.id)){w.score++;w.best=Math.max(w.best||0,w.score);g.food=g.food.filter(f=>!samePoint(f,head))}else w.body.pop()}}
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
 if(g.kind==='pool')due=due||(g.moving?g.lastTickAt+50<=now||now-g.lastTickAt>8000:now>=g.turnDeadline);
 if('lastTickAt'in g&&'startAt'in g&&g.kind!=='pool')due=now>=g.startAt&&(due||now-g.lastTickAt>8000||g.lastTickAt+(g.kind==='snake'?input.settings.speed:50)<=now);
 else if(g.kind==='chess'||g.kind==='dama')due=false;
 else if(g.kind==='phone'&&g.revealing)due=false;
 else if(g.kind==='sketch'&&now>=g.hintAt)due=true;
 else if(g.kind==='memory'&&g.resolveAt!==null&&now>=g.resolveAt)due=true;
 if(botsDue(input,now))due=true;
 if(!due)return{state:input,changed:false};
 return advanceOwned(structuredClone(input),now);
}
function advanceOwned(s:CasualState,now:number):{state:CasualState;changed:boolean}{
 const advanced=advanceGame(s,now);const aiChanged=advanceBots(s,now,(id,a)=>{applyCasualAction(s,a,id,now,true)});return{state:s,changed:advanced.changed||aiChanged};
}
function advanceGame(s:CasualState,now:number):{state:CasualState;changed:boolean}{
 if(now-s.createdAt>ROOM_TTL)throw new CasualError('This room expired after 24 hours. Create a fresh room.',410);let changed=false;const g=s.game;
 if(s.phase!=='playing'||!g)return{state:s,changed};
 if(isParty(g.kind))return{state:s,changed:advanceParty(s,now)};
 if(g.kind==='pirate')return{state:s,changed:advancePirate(s,now)};
 if(g.kind==='solitaire')return{state:s,changed:advanceSolitaire(s,now)};
 if(g.kind==='sketch')return{state:s,changed:advanceSketch(s,now)};
 if(g.kind==='generals')return{state:s,changed:advanceGenerals(s,now)};
 if(g.kind==='fleet')return{state:s,changed:advanceFleet(s,now)};
 if(g.kind==='blocks')return{state:s,changed:advanceBlocks(s,now)};
 if(g.kind==='pool')return{state:s,changed:advancePool(s,now)};
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
  if(s.phase==='playing'&&now>=g.deadline){const survivors=g.worms.filter(w=>s.settings.battle?!s.players.find(p=>p.id===w.id)?.retired:w.alive).sort((a,b)=>compareSnake(a,b,!!s.settings.battle)),best=survivors[0];finish(s,best?survivors.filter(w=>compareSnake(w,best,!!s.settings.battle)===0).map(w=>w.id):[],s.settings.battle?'Battle complete. Most eliminations wins, then best growth.':'Time is up. Surviving snakes with the most food share the win.',now);changed=true}
 }else if(g.kind==='ladders'||g.kind==='memory'){
  if(g.kind==='memory'&&g.resolveAt!==null&&now>=g.resolveAt){g.revealed=[];g.resolveAt=null;moveTurn(s,g,now);changed=true}
  if(now>=g.deadline){const name=s.players.find(p=>p.id===g.currentId)?.name||'Player';if(g.kind==='memory'){g.revealed=[];g.resolveAt=null}moveTurn(s,g,now);event(s,name+'’s turn timed out. Play moved to the next player.',now);changed=true}
 }
 return{state:s,changed};
}
export function applyCasualAction(input:CasualState,a:Record<string,any>,id:string|null,now:number,internal=false):CasualState{
 const s=internal?input:advanceOwned(structuredClone(input),now).state;s.chat=activeChat(s.chat,now);
 if(a.action==='join'){
  if(s.phase==='lobby'||s.phase==='finished')s.players=s.players.filter(p=>!p.bot&&!p.retired);
  if(a.role!=='spectator'&&(s.phase==='playing'||s.phase==='paused'))throw new CasualError('This round is running. Join after the host opens the next lobby.',409);
  if(a.role!=='spectator'&&activePlayers(s).length>=casualCapacity(s.mode))throw new CasualError('This room is full. Up to '+casualCapacity(s.mode)+' players can join.',409);
  if(s.players.length>=64)throw new CasualError('This room has reached its membership limit. Open the next lobby before inviting more people.',409);
  if(s.players.some(p=>p.id===a.id))throw new CasualError('You already joined this room.',409);
  if(a.role!==undefined&&!['player','spectator'].includes(a.role))throw new CasualError('Choose player or spectator.');
  if(a.role==='spectator'&&s.players.filter(p=>!p.retired&&p.role==='spectator').length>=12)throw new CasualError('The 12 spectator seats are full.',409);
  const empty=!s.players.some(p=>!p.retired&&!p.bot);if(s.phase==='lobby'||s.phase==='finished')s.players=s.players.filter(p=>!p.retired);const used=new Set(s.players.map(p=>p.color));let color=0;while(used.has(color))color++;
  s.players.push({...newPlayer(a.id,a.name,a.hash,now,color),...(a.appearance?{appearance:validateAppearance(a.appearance)}:{}),...(a.role==='spectator'?{role:'spectator' as const}:{})});if(empty){s.hostId=a.id;s.phase='lobby';s.game=null;s.result=null}event(s,a.name+' joined the room.',now);return s;
 }
 const p=s.players.find(p=>p.id===id&&!p.retired);if(!p)throw new CasualError('Your session ended. Join the room again.',401);p.lastSeen=now;
 if(a.requestId){if(p.requests.includes(a.requestId))throw new CasualError('That action was already applied. The room has been refreshed.',409);p.requests=[...p.requests.slice(-23),a.requestId]}
 if(a.action==='disconnect'){p.lastSeen=now-HOST_TIMEOUT-1;s.chat=[];s.chatEpoch=(s.chatEpoch||0)+1;return s}
 if(a.action==='heartbeat')return s;
 if(a.action==='appearance'){
  if(a.appearanceForMode!==undefined&&a.appearanceForMode!==s.mode)throw new CasualError('Your appearance selection belongs to another game.',409);
  if(a.confirmCharacter&&(!['lobby','finished'].includes(s.phase)||a.confirmForRound!==s.round+1||a.confirmForMode!==undefined&&a.confirmForMode!==s.mode))throw new CasualError('Confirm your character for the upcoming round.',409);
  const chosen=validateAppearance(a.appearance);
  if(a.confirmCharacter&&(!chosen.models?.[modelFamily(s.mode)]))throw new CasualError('Choose a model for this game before confirming.',409);
  p.appearance={...chosen,models:{...p.appearance?.models,...chosen.models},...(p.appearance?.avatar?{avatar:p.appearance.avatar}:{})};
  if(a.confirmCharacter&&['lobby','finished'].includes(s.phase)&&p.role!=='spectator'){p.characterRound=s.round+1;p.ready=true}
  return s;
 }
 if(a.action==='chat'){if(s.game?.kind==='sketch'){if(s.phase==='playing'&&(a.round!==s.round||a.turn!==s.game.turn))throw new CasualError('That drawing turn has ended.',409);sketchChat(s,p.id,a.text,a.messageId,now);return s}try{s.chat=appendChat(s.chat,p.id,p.name,a.text,a.messageId,now,a.giftId,s.mode==='terra'?{}:{gifId:a.gifId,effect:a.effect})}catch(e){if(e instanceof ChatError)throw new CasualError(e.message,e.status);throw e}return s}
 if(a.action==='leave'||a.action==='remove-inactive'){
  const target=a.action==='leave'?p:s.players.find(x=>x.id===a.playerId&&!x.retired);
  if(a.action==='remove-inactive'){
   if(p.id!==s.hostId)throw new CasualError('Only the host can free a seat.',403);
   if(s.phase==='playing'||s.phase==='paused')throw new CasualError('Finish this round before freeing a seat.',409);
   if(!target||target.id===p.id||now-target.lastSeen<HOST_TIMEOUT)throw new CasualError('Only a player inactive for 45 seconds can be removed.',409);
  }
  if(!target)throw new CasualError('That player is no longer here.',409);s.chat=[];s.chatEpoch=(s.chatEpoch||0)+1;target.retired=true;
  if(s.hostId===target.id)s.hostId=s.players.filter(p=>!p.retired&&!p.bot).sort((a,b)=>a.joinedAt-b.joinedAt)[0]?.id||'';
  const g=s.game;if(target.role!=='spectator'&&g&&(s.phase==='playing'||s.phase==='paused')){
   if(g.kind==='uno')leaveUno(s,target.id,now);
   else if(g.kind==='property')bankruptEstate(s,g,target.id,now);
   else if(g.kind==='phone')leavePhone(s,target.id,now);
   else if(g.kind==='sketch')leaveSketch(s,target.id,now);
   else if(g.kind==='solitaire')leaveSolitaire(s,target.id,now);
   else if(g.kind==='pirate')leavePirate(s,target.id,now);
   else if((g.kind==='chess'||g.kind==='dama'||g.kind==='scidama'))leaveStrategy(s,target.id,now);
   else if(g.kind==='generals'||g.kind==='fleet'){finishBattle(s,g.ids.filter(id=>id!==target.id),'A commander left. Their opponent wins by forfeit.',now)}
   else if(g.kind==='pool'){finish(s,activePlayers(s).map(p=>p.id),'A player left the table. The remaining player wins.',now)}
   else if(isParty(g.kind)){const pg=g as PartyGame;delete pg.inputs[target.id];pg.shots=pg.shots.filter(shot=>shot.owner!==target.id);const actor=pg.actors.find(a=>a.id===target.id);if(actor){actor.alive=false;actor.respawnAt=0;actor.finishedAt=now}if(!pg.bracket)pg.actors=pg.actors.filter(a=>a.id!==target.id);if(pg.actors.filter(a=>a.finishedAt===null).length<2&&pg.kind!=='marble')finish(s,pg.actors.filter(a=>a.finishedAt===null).map(a=>a.id),'The remaining player wins after a departure.',now)}
   else if(g.kind==='blocks'){const board=g.boards.find(b=>b.id===target.id);if(board)board.alive=false}
   else if(g.kind==='circuit'||g.kind==='terra'){}
   else if(g.kind==='snake'){const worm=g.worms.find(w=>w.id===target.id);if(worm){worm.alive=false;worm.body=[];worm.reason='Left the round';worm.deathAt=now}const alive=g.worms.filter(w=>w.alive);if(!s.settings.battle&&alive.length<=1)finish(s,alive.map(w=>w.id),'A player left. The remaining snake wins.',now)}
   else if((g.kind==='ladders'||g.kind==='memory')&&g.currentId===target.id){if(g.kind==='memory'){g.revealed=[];g.resolveAt=null}moveTurn(s,g,now)}
  }
  if((s.phase==='playing'||s.phase==='paused')&&!activePlayers(s).length)finish(s,[],'All players left the round.',now);
  if(!s.players.some(p=>!p.retired&&!p.bot)){s.players=s.players.filter(p=>!p.bot);s.phase='lobby';s.game=null;s.result=null;s.ai=undefined}
  event(s,target.name+' left the room.',now);return s;
 }
 if(a.action==='claim-host'){
  const host=s.players.find(x=>x.id===s.hostId&&!x.retired);if(host&&now-host.lastSeen<HOST_TIMEOUT)throw new CasualError('The host is still connected.',409);
  s.hostId=p.id;event(s,p.name+' became the host.',now);return s;
 }
 if(a.action==='role'){
  if(!['lobby','finished'].includes(s.phase))throw new CasualError('Change your role in the lobby after this round.',409);
  if(!['player','spectator'].includes(a.role))throw new CasualError('Choose player or spectator.');
  if(a.role!==p.role&&!(a.role==='player'&&!p.role)){
   if(a.role==='player'&&activePlayers(s).filter(x=>!x.bot).length>=casualCapacity(s.mode))throw new CasualError('All player seats are occupied.',409);
   if(a.role==='spectator'&&s.players.filter(x=>!x.retired&&x.role==='spectator').length>=12)throw new CasualError('The 12 spectator seats are full.',409);
   s.players=s.players.filter(x=>!x.bot);p.role=a.role;p.ready=false;delete p.characterRound;
  }return s;
 }
 if(p.role==='spectator'&&!['configure','start','lobby','pause','resume','end',...(p.id===s.hostId&&s.game?.kind==='phone'&&s.game.revealing?['reveal-phone']:[])].includes(a.action))throw new CasualError('Spectators can watch and chat. Choose Player in the next lobby to play.',403);
 if(a.action==='ready'){if(s.phase!=='lobby')throw new CasualError('Ready controls are available in the lobby.',409);p.ready=!p.ready;return s}
 if(['configure','start','lobby','pause','resume'].includes(a.action)&&p.id!==s.hostId&&!(a.action==='resume'&&canResumeCasual(s,p.id,now)))throw new CasualError('Only the room host can do that while connected.',403);
 if(a.action==='configure'){
  if(s.phase==='lobby'||s.phase==='finished')s.players=s.players.filter(p=>!p.bot);
  if(s.phase==='playing'||s.phase==='paused')throw new CasualError('Finish the round before changing the game.',409);
  if(!CASUAL_MODES.includes(a.mode))throw new CasualError('Choose a valid game.');for(const [key,values]of [['roundSeconds',[60,120,180,300,600]],['winTarget',[5,10,11,20,21]],['raceLaps',[1,2,3,5]]] as const)if(a[key]!==undefined&&!(values as readonly number[]).includes(a[key]))throw new CasualError('Choose a valid game variant.');
  if(activePlayers(s).length>casualCapacity(a.mode))throw new CasualError('This game has '+casualCapacity(a.mode)+' seats. Ask extra players to leave before switching.',409);
  if(!Number.isInteger(a.cards)||a.cards<12||a.cards>200||a.cards%2)throw new CasualError('Choose an even deck size from 12 to 200 cards.');
  if(![125,175,250,350,500].includes(a.speed))throw new CasualError('Choose a valid snake speed.');for(const k of ['battle','unoFlip','arcadeV2','unoSameColor'])if(a[k]!==undefined&&typeof a[k]!=='boolean')throw new CasualError('Invalid game option.');if(a.arena!==undefined&&!CLUB_MAPS.some(m=>m.id===a.arena))throw new CasualError('Choose a valid arena.');if(a.difficulty&&!['cozy','standard','expert'].includes(a.difficulty))throw new CasualError('Choose a valid difficulty.');if(a.track&&!TRACKS.some(t=>t.id===a.track))throw new CasualError('Choose a track.');for(const [k,min,max]of [['bots',0,8],['relayRounds',3,9],['relaySeconds',20,180]] as const)if(a[k]!==undefined&&(!Number.isInteger(a[k])||a[k]<min||a[k]>max))throw new CasualError('Invalid '+k+' setting.');if(s.mode!==a.mode){delete s.settings.tacticalSeconds;delete s.settings.fleetSize;delete s.settings.fleetStyle;delete s.settings.fleetTurn;delete s.settings.roundSeconds;delete s.settings.winTarget;delete s.settings.raceLaps;s.chat=[];s.chatEpoch=(s.chatEpoch||0)+1;for(const player of s.players){player.appearance=player.appearance?.avatar?{avatar:player.appearance.avatar,useAvatar:false}:undefined;delete player.characterRound;}}s.mode=a.mode;if(a.snakeSize!==undefined&&!SNAKE_SIZES.includes(a.snakeSize))throw new CasualError('Choose a 32, 48 or 64 square arena.');if(a.map!==undefined&&!SNAKE_MAP_IDS.includes(a.map))throw new CasualError('Choose a valid map.');if(a.blockPace!==undefined&&!['arcade','expert','blitz'].includes(a.blockPace)||a.sumoFormat!==undefined&&!['bracket','classic'].includes(a.sumoFormat))throw new CasualError('Choose a valid match format.');if(a.scene!==undefined&&!TABLE_SCENE_IDS.includes(a.scene))throw new CasualError('Choose a valid table scene.');s.settings={...s.settings,...newGameSettings(a),...pirateSettings(a),...hiddenSettings(a),...(a.roundSeconds!==undefined?{roundSeconds:a.roundSeconds}:{}),...(a.winTarget!==undefined?{winTarget:a.winTarget}:{}),...(a.raceLaps!==undefined?{raceLaps:a.raceLaps}:{}),...(a.scene&&s.mode!=='terra'?{scene:a.scene}:{}),...(a.arcadeV2!==undefined?{arcadeV2:a.arcadeV2}:{}),...(a.unoSameColor!==undefined?{unoSameColor:a.unoSameColor}:{}),...(a.blockPace?{blockPace:a.blockPace}:{}),...(a.sumoFormat?{sumoFormat:a.sumoFormat}:{}),...(a.arena?{arena:a.arena}:{}),cards:a.cards,speed:a.speed,snakeSize:a.snakeSize||s.settings.snakeSize||48,map:a.map||s.settings.map||'classic',...(a.battle!==undefined?{battle:a.battle===true}:{}),...(a.difficulty?{difficulty:a.difficulty}:{}),...(a.unoFlip!==undefined?{unoFlip:a.unoFlip===true}:{}),...(a.track?{track:a.track}:{}),...(a.bots!==undefined?{bots:a.bots}:{}),...(a.relayRounds?{relayRounds:a.relayRounds}:{}),...(a.relaySeconds?{relaySeconds:a.relaySeconds}:{})};s.phase='lobby';s.game=null;s.result=null;activePlayers(s).forEach(p=>{p.ready=false;delete p.characterRound});return s;
 }
 if(a.action==='lobby'){
  if(s.phase==='playing'||s.phase==='paused')throw new CasualError('Finish or end the current round first.',409);
  s.phase='lobby';s.game=null;s.result=null;s.players=s.players.filter(p=>!p.retired&&!p.bot);s.players.forEach(p=>{p.ready=false;delete p.characterRound});return s;
 }
 if(a.action==='start'){
  if(a.round!==undefined&&a.round!==s.round)throw new CasualError('This start request belongs to an older round.',409);
  if(s.phase==='playing'||s.phase==='paused')throw new CasualError('A round is already running.',409);if(!activePlayers(s).filter(p=>!p.bot).length&&!s.settings.bots)throw new CasualError('Add a player or computer opponent first.');
  // Appearance and key bindings are optional. Untouched players use the defaults.
  const priorUno=s.game?.kind==='uno'?s.game:null,priorBotIds=s.players.filter(p=>p.bot&&!p.retired).map(p=>p.id);
  s.players=s.players.filter(p=>!p.bot&&!p.retired);
  for(let i=0;i<(s.settings.bots||0)&&activePlayers(s).length<casualCapacity(s.mode);i++){const botId=s.mode==='uno'&&priorUno&&!priorUno.matchWinner&&priorBotIds[i]?priorBotIds[i]:'bot-'+(s.round+1)+'-'+i;let botColor=0;while(s.players.some(p=>p.color===botColor))botColor++;s.players.push({...newPlayer(botId,['Pip','Coco','Sunny','Moss','Luna','Ash','Nova','Rio'][i], '',now,botColor),bot:true})}
  if(activePlayers(s).length<casualMinimum(s.mode))throw new CasualError('Add another player or a computer opponent.',409);
  s.ai=s.players.some(p=>p.bot)?{nextAt:now+1000,cursor:0}:undefined;
  s.round++;s.phase='playing';s.result=null;s.pauseReason='';s.players=s.players.filter(p=>!p.retired);s.players.forEach(p=>{p.ready=false});const first=activePlayers(s)[0].id;
  if(isParty(s.mode))s.game=newParty(s,now);
  else if(s.mode==='pirate')s.game=newPirate(s,now);
  else if(s.mode==='solitaire')s.game=newSolitaire(s,now);
  else if(s.mode==='sketch')s.game=newSketch(s,now);
  else if(s.mode==='generals')s.game=newGenerals(s,now);
  else if(s.mode==='fleet')s.game=newFleet(s,now);
  else if(s.mode==='blocks')s.game=newBlocks(s,now);
  else if(s.mode==='pool')s.game=newPool(s,now);
  else if(isStrategy(s.mode))s.game=newStrategy(s,now);
  else if(s.mode==='uno')s.game=newUno(s,now,priorUno);
  else if(s.mode==='property')s.game=newProperty(s,now);
  else if(s.mode==='phone')s.game=newPhone(s,now);
  else if(s.mode==='circuit')s.game=newCircuit(s,now);
  else if(s.mode==='terra')s.game=newTerra(s,now);
  else if(s.mode==='ladders')s.game={kind:'ladders',positions:Object.fromEntries(activePlayers(s).map(p=>[p.id,0])),currentId:first,turn:1,deadline:now+TURN_MS,lockUntil:now,lastRoll:null};
  else if(s.mode==='memory'){const keys=shuffled(s,Array.from({length:100},(_,i)=>i)).slice(0,s.settings.cards/2);s.game={kind:'memory',deck:shuffled(s,[...keys,...keys]).map(key=>({key,matchedBy:null})),revealed:[],currentId:first,turn:1,deadline:now+memoryTurn(s),resolveAt:null,scores:Object.fromEntries(activePlayers(s).map(p=>[p.id,0])),moves:0}}
  else s.game=newSnake(s,now);event(s,'Round '+s.round+' started.',now);return s;
 }
 if(a.action==='pause'||a.action==='resume'){
  if(!s.game||!['snake','circuit','terra','sumo','tanks','pong','marble','blocks','pool','pirate'].includes(s.game.kind))throw new CasualError('Only simultaneous action games can be paused.');const g=s.game as SnakeGame|CircuitGame|TerraGame|PartyGame|BlocksGame|PoolGame|PirateGame;
  if(a.action==='pause'){if(s.phase!=='playing')throw new CasualError('This arena is not running.',409);s.phase='paused';g.pausedAt=now;s.pauseReason='Paused by the host.';event(s,'The host paused the arena.',now)}
  else{if(s.phase!=='paused')throw new CasualError('This arena is not paused.',409);resumeTimeline(g,now);s.phase='playing';s.pauseReason='';event(s,'The arena resumes after a 3-second countdown.',now)}return s;
 }
 if(a.action==='end'){
  if(p.id!==s.hostId)throw new CasualError('Only the host can end a round.',403);if(s.phase!=='playing'&&s.phase!=='paused')throw new CasualError('There is no running round.',409);finish(s,[],'The host ended this round. No winner was declared.',now);return s;
 }
 if(p.role==='spectator'&&!(a.action==='reveal-phone'&&p.id===s.hostId&&s.game?.kind==='phone'&&s.game.revealing))throw new CasualError('Spectators cannot send game actions.',403);
 if(s.phase!=='playing'||!s.game)throw new CasualError('Wait for the host to start a round.',409);
 if(a.round!==s.round)throw new CasualError('This action belongs to an older round.',409);
 const g=s.game;
 if(a.inputEpoch!==undefined&&'startAt'in g&&a.inputEpoch!==g.startAt)throw new CasualError('This control belongs to an older round timeline.',409);
 if('actors'in g){partyAction(s,a,p.id,now);return s}
 if(g.kind==='pirate'){pirateAction(s,a,p.id,now);return s}
 if(g.kind==='solitaire'){solitaireAction(s,{...a,...newGameActionFields(a)},p.id,now);return s}
 if(g.kind==='sketch'){sketchAction(s,{...a,...newGameActionFields(a)},p.id,now);return s}
 if(g.kind==='generals'){generalsAction(s,a,p.id,now);return s}
 if(g.kind==='fleet'){fleetAction(s,a,p.id,now);return s}
 if(g.kind==='blocks'){blocksAction(s,a,p.id,now);return s}
 if(g.kind==='pool'){poolAction(s,a,p.id,now);return s}
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
  g.positions[p.id]=to;g.lastRoll={playerId:p.id,die,from,landing,to,jump,overshoot,at:now};g.lockUntil=now+DICE_ROLL_MS+(overshoot?0:ladderMoveDuration(die,!!jump));
  event(s,p.name+' rolled '+die+(overshoot?' and stayed on '+from+'.':jump?' · '+(jump==='ladder'?'climbed ':'slid ')+landing+' → '+to+'.':' · moved to '+to+'.'),now);
  if(to===100)finish(s,[p.id],p.name+' reached 100!',now);else{moveTurn(s,g,now);g.deadline=g.lockUntil+TURN_MS}return s;
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
 if(s.game?.kind==='pirate')game=publicPirate(s.game);
 if(s.game?.kind==='solitaire')game=publicSolitaire(s.game,id);
 else if(s.game?.kind==='sketch')game=publicSketch(s.game,id,now);
 else if(s.game?.kind==='generals')game=publicGenerals(s.game,id,s.phase==='finished');
 else if(s.game?.kind==='fleet')game=publicFleet(s.game,id,s.phase==='finished');
 else if(s.game&&isStrategy(s.game.kind))game=publicStrategy(s.game as StrategyGame);
 else if(s.game?.kind==='blocks')game=publicBlocks(s.game);
 else if(s.game?.kind==='uno')game=publicUno(s.game,id);
 else if(s.game?.kind==='phone')game=publicPhone(s.game,id);
 else if(s.game?.kind==='property')game={...s.game,chance:undefined,chest:undefined};
 else if(s.game?.kind==='memory'){const g=s.game;game={...g,deck:g.deck.map((c,index)=>({index,matchedBy:c.matchedBy,...(c.matchedBy||g.revealed.includes(index)?{key:c.key}:{})}))}}
 else if(s.game?.kind==='snake')game={...s.game,worms:s.game.worms.map(({queue,queueTicks,lastSeq,...w})=>({...w,...(w.id===id?{pendingTurns:queue,pendingTicks:queueTicks,inputAck:lastSeq}:{})}))};
 return{serverVersion:31,code:s.code,hostId:s.hostId,mode:s.mode,phase:s.phase,round:s.round,serverNow:now,...(s.mode!=='terra'&&s.phase==='playing'&&s.ai?.wait&&s.ai.wait.readyAt>now?{botThinking:{playerId:s.ai.wait.playerId,until:s.ai.wait.readyAt}}:{}),chat:activeChat(s.chat,now),chatEpoch:s.chatEpoch||0,settings:s.settings,game,result:s.result,pauseReason:s.pauseReason,events:s.events,isHost:id===s.hostId,youId:id,canResume:canResumeCasual(s,id,now),canClaimHost:id!==s.hostId&&(!host||now-host.lastSeen>=HOST_TIMEOUT),players:s.players.map(({tokenHash,requests,lastSeen,traffic,...p})=>({...p,isYou:p.id===id,isHost:p.id===s.hostId,online:!p.retired&&(p.bot||now-lastSeen<20000),canRemove:!p.retired&&now-lastSeen>=HOST_TIMEOUT}))};
}
export type CasualPublic=ReturnType<typeof publicCasual>&{viewingId?:string;revision?:number;network?:{rtt:number;totalRtt?:number;serverMs?:number;snapshotInterval?:number}};
