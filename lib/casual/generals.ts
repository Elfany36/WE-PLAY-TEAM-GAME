import type {CasualState} from './engine.ts';
import {CasualError} from './error.ts';
import {DEPLOYMENT_MS,tacticalDeadline,battleEvent,battlePlayer,finishBattle,requireBattleTurn,battleCourtesy} from './hidden-battle.ts';

export const GENERAL_RANKS=[
 {rank:13,name:'Five-star General',short:'5★',count:1},
 {rank:12,name:'Four-star General',short:'4★',count:1},
 {rank:11,name:'Three-star General',short:'3★',count:1},
 {rank:10,name:'Two-star General',short:'2★',count:1},
 {rank:9,name:'One-star General',short:'1★',count:1},
 {rank:8,name:'Colonel',short:'COL',count:1},
 {rank:7,name:'Lieutenant Colonel',short:'LTC',count:1},
 {rank:6,name:'Major',short:'MAJ',count:1},
 {rank:5,name:'Captain',short:'CPT',count:1},
 {rank:4,name:'First Lieutenant',short:'1LT',count:1},
 {rank:3,name:'Second Lieutenant',short:'2LT',count:1},
 {rank:2,name:'Sergeant',short:'SGT',count:1},
 {rank:1,name:'Private',short:'PVT',count:6},
 {rank:14,name:'Spy',short:'SPY',count:2},
 {rank:0,name:'Flag',short:'FLAG',count:1},
] as const;
export type GeneralUnit={id:string;owner:string;rank:number;square:number};
export type GeneralMove={from:number;to:number;owner:string;outcome:'move'|'attacker'|'defender'|'both';at:number};
export type GeneralsGame={kind:'generals';stage:'deploy'|'battle';ids:string[];pieces:GeneralUnit[];ready:Record<string,boolean>;currentId:string;turn:number;deadline:number;turnSeconds:number;captures:Record<string,number>;moves:number;clashes:number;lastMove:GeneralMove|null;offerBy:string|null;pendingFlag:{owner:string;pieceId:string}|null};
export const generalRank=(rank:number)=>GENERAL_RANKS.find(r=>r.rank===rank)!;
export const generalSquare=(n:unknown):n is number=>Number.isInteger(n)&&Number(n)>=0&&Number(n)<72;
export const generalAdjacent=(a:number,b:number)=>Math.abs(a%9-b%9)+Math.abs(Math.floor(a/9)-Math.floor(b/9))===1;
export function generalHome(g:Pick<GeneralsGame,'ids'>,id:string,n:number){return generalSquare(n)&&(g.ids[0]===id?Math.floor(n/9)>=5:Math.floor(n/9)<3)}
function random(s:CasualState){let x=s.random||1;x^=x<<13;x^=x>>>17;x^=x<<5;s.random=x>>>0;return s.random/4294967296}
function shuffle<T>(s:CasualState,values:T[]){const a=[...values];for(let i=a.length-1;i>0;i--){const j=Math.floor(random(s)*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function army(s:CasualState,g:Pick<GeneralsGame,'ids'>,id:string){
 const ranks=shuffle(s,GENERAL_RANKS.flatMap(r=>Array.from({length:r.count},()=>r.rank))),squares=shuffle(s,Array.from({length:72},(_,i)=>i).filter(i=>generalHome(g,id,i)));
 // IDs are assigned after shuffling ranks. Neither identifiers nor ordering encode rank.
 return ranks.map((rank,i)=>({id:'unit-'+g.ids.indexOf(id)+'-'+i,owner:id,rank,square:squares[i]}));
}
export function newGenerals(s:CasualState,now:number):GeneralsGame{
 const ids=s.players.filter(p=>!p.retired&&p.role!=='spectator').map(p=>p.id),g:GeneralsGame={kind:'generals',stage:'deploy',ids,pieces:[],ready:Object.fromEntries(ids.map(id=>[id,false])),currentId:ids[(s.round-1)%2],turn:0,deadline:now+DEPLOYMENT_MS,turnSeconds:s.settings.tacticalSeconds??0,captures:Object.fromEntries(ids.map(id=>[id,0])),moves:0,clashes:0,lastMove:null,offerBy:null,pendingFlag:null};
 g.pieces=ids.flatMap(id=>army(s,g,id));return g;
}
/** Positive = attacker survives, negative = defender survives; zero removes both. */
export function generalChallenge(attacker:number,defender:number){
 if(attacker===0&&defender===0)return 1;
 if(attacker===defender)return 0;
 if(attacker===14)return defender===1?-1:1;
 if(defender===14)return attacker===1?1:-1;
 return attacker>defender?1:-1;
}
export function generalMoves(g:Pick<GeneralsGame,'pieces'>,id:string){return g.pieces.filter(p=>p.owner===id).flatMap(p=>[p.square-9,p.square+9,p.square-1,p.square+1].filter(to=>generalSquare(to)&&generalAdjacent(p.square,to)&&!g.pieces.some(q=>q.square===to&&q.owner===id)).map(to=>({from:p.square,to})))}
export function generalsAction(s:CasualState,a:Record<string,any>,id:string,now:number){
 const g=s.game as GeneralsGame;if(battleCourtesy(s,g,a,id,now))return;
 if(g.stage==='deploy'){
  if(g.ready[id])throw new CasualError('Your army is deployed. Wait for the other commander.',409);
  if(a.action==='shuffle-generals'){g.pieces=[...g.pieces.filter(p=>p.owner!==id),...army(s,g,id)];return}
  if(a.action==='place-generals'){
   if(!generalHome(g,id,a.from)||!generalHome(g,id,a.to))throw new CasualError('Deploy within your three home rows.');
   const piece=g.pieces.find(p=>p.owner===id&&p.square===a.from),other=g.pieces.find(p=>p.square===a.to);if(!piece)throw new CasualError('Select one of your pieces.');if(other&&other.owner!==id)throw new CasualError('Choose your own deployment square.');if(other)other.square=a.from;piece.square=a.to;return;
  }
  if(a.action!=='deploy-generals')throw new CasualError('Arrange your army, then deploy it.');
  if(g.pieces.filter(p=>p.owner===id).length!==21||g.pieces.some(p=>p.owner===id&&!generalHome(g,id,p.square)))throw new CasualError('Deploy all 21 pieces in your home rows.');
  g.ready[id]=true;g.currentId=g.ids.find(p=>!g.ready[p])||g.ids[(s.round-1)%2];
  if(g.ids.every(p=>g.ready[p])){g.stage='battle';g.turn=1;g.currentId=g.ids[(s.round-1)%2];g.deadline=tacticalDeadline(now,g.turnSeconds);battleEvent(s,'Both armies are deployed. The arbiter is ready.',now)}return;
 }
 if(a.action!=='move-generals')throw new CasualError('Select a piece and an adjacent square.');requireBattleTurn(g,a,id);
 if(!generalSquare(a.from)||!generalSquare(a.to)||!generalMoves(g,id).some(m=>m.from===a.from&&m.to===a.to))throw new CasualError('Move one square horizontally or vertically to a free or enemy square.');
 const piece=g.pieces.find(p=>p.square===a.from)!,defender=g.pieces.find(p=>p.square===a.to),other=g.ids.find(p=>p!==id)!;
 let outcome:GeneralMove['outcome']='move';g.offerBy=null;
 if(defender){
  g.clashes++;const verdict=generalChallenge(piece.rank,defender.rank);outcome=verdict>0?'attacker':verdict<0?'defender':'both';
  const removed=verdict===0?[piece,defender]:[verdict>0?defender:piece];
  g.pieces=g.pieces.filter(p=>!removed.includes(p));for(const victim of removed)g.captures[victim.owner===id?other:id]++;
  if(verdict>=0)piece.square=a.to;
  if(removed.some(p=>p.rank===0)){const flag=removed.find(p=>p.rank===0)!;finishBattle(s,[flag.owner===id?other:id],'The enemy Flag was captured.',now)}
 }else piece.square=a.to;
 g.moves++;g.lastMove={from:a.from,to:a.to,owner:id,outcome,at:now};
 battleEvent(s,battlePlayer(s,id)+(defender?outcome==='both'?' challenged: both pieces were removed.':outcome==='attacker'?' challenged: the attacking piece survived.':' challenged: the defending piece survived.':' moved to '+String.fromCharCode(65+a.to%9)+(8-Math.floor(a.to/9))+'.'),now);
 if(s.phase==='finished')return;
 if(g.pendingFlag&&g.pendingFlag.owner!==id&&g.pieces.some(p=>p.id===g.pendingFlag!.pieceId)){finishBattle(s,[g.pendingFlag.owner],'A Flag reached the far row and survived the opponent’s reply.',now);return}
 if(piece.rank===0&&g.pieces.includes(piece)&&Math.floor(piece.square/9)===(g.ids[0]===id?0:7))g.pendingFlag={owner:id,pieceId:piece.id};
 g.currentId=other;g.turn++;g.deadline=tacticalDeadline(now,g.turnSeconds);
 if(!generalMoves(g,other).length)finishBattle(s,[id],'The opponent has no legal move.',now);
}
export function advanceGenerals(s:CasualState,now:number){const g=s.game as GeneralsGame;if(now<g.deadline)return false;finishBattle(s,g.stage==='deploy'?g.ids.filter(id=>g.ready[id]):g.ids.filter(id=>id!==g.currentId),g.stage==='deploy'?'Deployment time expired. Ready commanders win; neither ready is a draw.':'The move clock expired. The opposing commander wins.',now);return true}
/** Explicit projection: ranks, pending Flag and formation seeds never enter enemy snapshots. */
export function publicGenerals(g:GeneralsGame,id:string,reveal=false){return{kind:g.kind,stage:g.stage,ids:g.ids,ready:g.ready,currentId:g.currentId,turn:g.turn,deadline:g.deadline,turnSeconds:g.turnSeconds,captures:g.captures,moves:g.moves,clashes:g.clashes,lastMove:g.lastMove,offerBy:g.offerBy,pieces:g.stage==='deploy'&&!reveal?g.pieces.filter(p=>p.owner===id).map(p=>({...p})):g.pieces.map(({rank,...p})=>({...p,...(p.owner===id||reveal?{rank}:{})})),legalMoves:g.stage==='battle'&&g.currentId===id?generalMoves(g,id):[]}}
