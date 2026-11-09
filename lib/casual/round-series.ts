import type {CasualState} from './engine.ts';
import {CasualError} from './error.ts';
export const ROUND_CHOICES=[1,2,3,4,5,6,10] as const;
export const MAX_MATCH_ROUNDS=1000;
export type RoundSeries={mode:string;limit:number;roster:string;completed:number;lastRecordedRound:number;finished:boolean;winnerIds:string[];players:{id:string;name:string;color:number;bot:boolean;wins:number}[]};
export function matchRoundSettings(value:Record<string,unknown>){
 if(value.matchRounds===undefined)return{};
 if(!Number.isSafeInteger(value.matchRounds)||(value.matchRounds as number)<0||(value.matchRounds as number)>MAX_MATCH_ROUNDS)throw new CasualError('Choose Unlimited or 1–1000 rounds.');
 return{matchRounds:value.matchRounds as number};
}
const roster=(s:CasualState)=>s.players.filter(p=>!p.retired&&!p.bot&&p.role!=='spectator').map(p=>p.id).sort().join(',')+'|'+(s.settings.bots||0);
export function continuesSeries(s:CasualState){return !!s.series&&!s.series.finished&&s.series.mode===s.mode&&s.series.limit===(s.settings.matchRounds??0)&&s.series.roster===roster(s)}
export function beginSeries(s:CasualState){
 if(continuesSeries(s))return;
 s.series={mode:s.mode,limit:s.settings.matchRounds??0,roster:roster(s),completed:0,lastRecordedRound:s.round-1,finished:false,winnerIds:[],players:s.players.filter(p=>!p.retired&&p.role!=='spectator').map(p=>({id:p.id,name:p.name,color:p.color,bot:!!p.bot,wins:0}))};
}
/** All finish paths pass here once, including a bot action, timeout or disconnect. */
export function settleSeries(s:CasualState){
 const series=s.series;if(!series||series.finished||s.phase!=='finished'||!s.result||series.lastRecordedRound>=s.round)return false;
 series.lastRecordedRound=s.round;
 // UNO's native 500-point match remains intact; a hand is not a complete match.
 if(s.result.voidRound||s.game?.kind==='uno'&&!s.game.matchWinner)return true;
 series.completed++;
 for(const player of series.players)if(s.result.winnerIds.includes(player.id))player.wins++;
 if(series.limit>0&&series.completed>=series.limit){series.finished=true;const best=Math.max(0,...series.players.map(p=>p.wins));series.winnerIds=best?series.players.filter(p=>p.wins===best).map(p=>p.id):[]}
 return true;
}
export function seriesRoundLabel(series:RoundSeries|undefined,phase:string,round:number){
 if(!series?.limit)return 'Round '+round;
 return 'Round '+Math.min(series.limit,Math.max(1,series.completed+(phase==='finished'?0:1)))+' / '+series.limit;
}
