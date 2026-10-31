import type {CasualState} from './engine.ts';
export const livePlayers=(s:CasualState)=>s.players.filter(p=>!p.retired);
export function random(s:CasualState){let x=s.random||1;x^=x<<13;x^=x>>>17;x^=x<<5;s.random=x>>>0;return s.random/4294967296}
export function shuffle<T>(s:CasualState,input:T[]){const a=[...input];for(let i=a.length-1;i>0;i--){const j=Math.floor(random(s)*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
export function record(s:CasualState,text:string,at:number){s.events=[...s.events.slice(-15),{id:++s.eventId,text,at}]}
export function finish(s:CasualState,winnerIds:string[],reason:string,now:number){s.phase='finished';s.result={winnerIds,reason};record(s,reason,now)}
export function nextPlayer(s:CasualState,id:string){const i=s.players.findIndex(p=>p.id===id);for(let j=1;j<=s.players.length;j++){const p=s.players[(i+j+s.players.length)%s.players.length];if(!p.retired)return p.id}return id}
