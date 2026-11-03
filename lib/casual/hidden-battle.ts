import type {CasualState} from './engine.ts';
import {CasualError} from './error.ts';

export const DEPLOYMENT_MS=600_000;
export const tacticalDeadline=(now:number,seconds:number)=>seconds?now+seconds*1000:Number.MAX_SAFE_INTEGER;
export function battleEvent(s:CasualState,text:string,at:number){s.events=[...s.events.slice(-11),{id:++s.eventId,text,at}]}
export function finishBattle(s:CasualState,winnerIds:string[],reason:string,now:number){s.phase='finished';s.result={winnerIds,reason};battleEvent(s,reason,now)}
export function battlePlayer(s:CasualState,id:string){return s.players.find(p=>p.id===id)?.name||'Player'}
export function requireBattleTurn(g:{currentId:string;turn:number},a:Record<string,any>,id:string){if(g.currentId!==id)throw new CasualError('It is your opponent’s turn.',403);if(a.turn!==g.turn)throw new CasualError('The turn changed. Select your move again.',409)}
export function battleCourtesy(s:CasualState,g:{ids:string[];offerBy:string|null},a:Record<string,any>,id:string,now:number){
 if(!g.ids.includes(id))throw new CasualError('This seat is watching the match.',403);
 if(a.action==='resign-hidden'){finishBattle(s,g.ids.filter(p=>p!==id),battlePlayer(s,id)+' resigned. Their opponent wins.',now);return true}
 if(a.action==='draw-hidden'){if(g.offerBy&&g.offerBy!==id)finishBattle(s,[],'Both commanders agreed to a draw.',now);else{g.offerBy=id;battleEvent(s,battlePlayer(s,id)+' offered a draw.',now)}return true}
 if(a.action==='decline-hidden'){if(g.offerBy!==id)g.offerBy=null;return true}
 return false;
}
