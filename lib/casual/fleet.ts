import type {CasualState} from './engine.ts';
import {CasualError} from './error.ts';
import {DEPLOYMENT_MS,tacticalDeadline,battleEvent,battlePlayer,finishBattle,requireBattleTurn,battleCourtesy} from './hidden-battle.ts';

export const FLEET_STYLES=['naval','air','road','island'] as const;
export type FleetStyle=typeof FLEET_STYLES[number];
export const FLEET_UNITS=[{id:'carrier',length:5},{id:'cruiser',length:4},{id:'frigate',length:3},{id:'submarine',length:3},{id:'patrol',length:2}] as const;
export const FLEET_NAMES:Record<FleetStyle,string[]>={naval:['Aircraft carrier','Battleship','Destroyer','Submarine','Patrol boat'],air:['Sky fortress','Transport plane','Falcon jet','Swift glider','Scout drone'],road:['Command convoy','Armored train','Rally transporter','Rescue truck','Scout car'],island:['Emerald atoll','Coral island','Palm island','Volcanic isle','Hidden cay']};
export type FleetUnit={id:string;x:number;y:number;vertical:boolean;hits:number[]};
export type FleetShot={by:string;target:string;cell:number;hit:boolean;sunk:string|null;at:number};
export type FleetGame={kind:'fleet';stage:'deploy'|'battle';ids:string[];size:number;style:FleetStyle;chain:boolean;fleets:Record<string,FleetUnit[]>;ready:Record<string,boolean>;shots:FleetShot[];currentId:string;turn:number;deadline:number;turnSeconds:number;offerBy:string|null};
export function fleetCells(unit:Pick<FleetUnit,'id'|'x'|'y'|'vertical'>,size:number){const length=FLEET_UNITS.find(v=>v.id===unit.id)?.length||0;return Array.from({length},(_,i)=>({x:unit.x+(unit.vertical?0:i),y:unit.y+(unit.vertical?i:0)})).map(p=>p.y*size+p.x)}
export function fleetFits(unit:Pick<FleetUnit,'id'|'x'|'y'|'vertical'>,fleet:FleetUnit[],size:number){const length=FLEET_UNITS.find(v=>v.id===unit.id)?.length;if(!length||!Number.isInteger(unit.x)||!Number.isInteger(unit.y)||typeof unit.vertical!=='boolean'||unit.x<0||unit.y<0||unit.x+(unit.vertical?1:length)>size||unit.y+(unit.vertical?length:1)>size)return false;const occupied=new Set(fleet.filter(p=>p.id!==unit.id).flatMap(p=>fleetCells(p,size)));return fleetCells(unit,size).every(n=>!occupied.has(n))}
function random(s:CasualState){let x=s.random||1;x^=x<<13;x^=x>>>17;x^=x<<5;s.random=x>>>0;return s.random/4294967296}
export function randomFleet(s:CasualState,size:number){const result:FleetUnit[]=[];for(const definition of FLEET_UNITS){const candidates:FleetUnit[]=[];for(let y=0;y<size;y++)for(let x=0;x<size;x++)for(const vertical of [false,true]){const unit={id:definition.id,x,y,vertical,hits:[]};if(fleetFits(unit,result,size))candidates.push(unit)}if(!candidates.length)throw new Error('No fleet placement available.');result.push(candidates[Math.floor(random(s)*candidates.length)])}return result}
export function newFleet(s:CasualState,now:number):FleetGame{const ids=s.players.filter(p=>!p.retired&&p.role!=='spectator').map(p=>p.id),size=s.settings.fleetSize||10;return{kind:'fleet',stage:'deploy',ids,size,style:s.settings.fleetStyle||'naval',chain:s.settings.fleetTurn!=='alternate',fleets:Object.fromEntries(ids.map(id=>[id,randomFleet(s,size)])),ready:Object.fromEntries(ids.map(id=>[id,false])),shots:[],currentId:ids[(s.round-1)%2],turn:0,deadline:now+DEPLOYMENT_MS,turnSeconds:s.settings.tacticalSeconds??60,offerBy:null}}
export function fleetAction(s:CasualState,a:Record<string,any>,id:string,now:number){
 const g=s.game as FleetGame;if(battleCourtesy(s,g,a,id,now))return;
 if(g.stage==='deploy'){
  if(g.ready[id])throw new CasualError('Your fleet is locked. Wait for the other commander.',409);
  if(a.action==='shuffle-fleet'){g.fleets[id]=randomFleet(s,g.size);return}
  if(a.action==='clear-fleet'){g.fleets[id]=[];return}
  if(a.action==='place-fleet'){
   const unit:FleetUnit={id:a.unit,x:a.x,y:a.y,vertical:a.vertical,hits:[]};if(!fleetFits(unit,g.fleets[id],g.size))throw new CasualError('Place the entire model inside the grid without overlapping another model.');
   g.fleets[id]=[...g.fleets[id].filter(p=>p.id!==unit.id),unit];return;
  }
  if(a.action!=='deploy-fleet')throw new CasualError('Arrange your models, then deploy your fleet.');
  if(g.fleets[id].length!==5||FLEET_UNITS.some(d=>!g.fleets[id].some(p=>p.id===d.id))||g.fleets[id].some(p=>!fleetFits(p,g.fleets[id],g.size)))throw new CasualError('Place all five models before deployment.');
  g.ready[id]=true;g.currentId=g.ids.find(p=>!g.ready[p])||g.ids[(s.round-1)%2];
  if(g.ids.every(p=>g.ready[p])){g.stage='battle';g.turn=1;g.currentId=g.ids[(s.round-1)%2];g.deadline=tacticalDeadline(now,g.turnSeconds);battleEvent(s,'Both fleets are concealed. Search the enemy grid.',now)}return;
 }
 if(a.action!=='fire-fleet')throw new CasualError('Choose an unsearched tile on the target grid.');requireBattleTurn(g,a,id);
 if(!Number.isInteger(a.cell)||a.cell<0||a.cell>=g.size*g.size)throw new CasualError('Choose a tile on the grid.');if(g.shots.some(shot=>shot.by===id&&shot.cell===a.cell))throw new CasualError('You already searched that tile.',409);
 const target=g.ids.find(p=>p!==id)!,unit=g.fleets[target].find(p=>fleetCells(p,g.size).includes(a.cell));let sunk:string|null=null;
 if(unit){unit.hits.push(a.cell);if(unit.hits.length===FLEET_UNITS.find(p=>p.id===unit.id)!.length)sunk=unit.id}
 g.shots.push({by:id,target,cell:a.cell,hit:!!unit,sunk,at:now});g.offerBy=null;g.turn++;
 const coord=String.fromCharCode(65+a.cell%g.size)+(Math.floor(a.cell/g.size)+1);
 battleEvent(s,battlePlayer(s,id)+' · '+coord+(sunk?' · model destroyed!':unit?' · hit!':' · clear water.'),now);
 if(g.fleets[target].every(p=>p.hits.length===FLEET_UNITS.find(d=>d.id===p.id)!.length)){finishBattle(s,[id],'Every enemy model was destroyed. The fleet is yours!',now);return}
 if(!unit||!g.chain)g.currentId=target;g.deadline=tacticalDeadline(now,g.turnSeconds);
}
export function advanceFleet(s:CasualState,now:number){const g=s.game as FleetGame;if(now<g.deadline)return false;if(g.stage==='deploy')finishBattle(s,g.ids.filter(id=>g.ready[id]),'Deployment time expired. Ready commanders win; neither ready is a draw.',now);else{g.currentId=g.ids.find(id=>id!==g.currentId)!;g.turn++;g.deadline=tacticalDeadline(now,g.turnSeconds);battleEvent(s,'The search clock expired. The turn passed to the other commander.',now)}return true}
/** Only own and fully destroyed models are disclosed. Hits do not disclose an intact footprint. */
export function publicFleet(g:FleetGame,id:string,reveal=false){return{kind:g.kind,stage:g.stage,ids:g.ids,size:g.size,style:g.style,chain:g.chain,ready:g.ready,currentId:g.currentId,turn:g.turn,deadline:g.deadline,turnSeconds:g.turnSeconds,offerBy:g.offerBy,shots:g.shots,fleets:Object.fromEntries(g.ids.map(owner=>[owner,g.fleets[owner].filter(p=>owner===id||reveal||g.shots.some(shot=>shot.target===owner&&shot.sunk===p.id)).map(p=>({...p,hits:[...p.hits]}))])),remaining:Object.fromEntries(g.ids.map(owner=>[owner,5-g.shots.filter(shot=>shot.target===owner&&shot.sunk).length]))}}
