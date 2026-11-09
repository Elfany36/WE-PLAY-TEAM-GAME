import type {CasualPublic} from '../../lib/casual/engine';
export function roundResultTitle(room:CasualPublic){
 const complete=!!room.series?.finished,ids=complete?room.series!.winnerIds:room.result?.winnerIds||[],names=ids.map(id=>room.players.find(p=>p.id===id)?.name||room.series?.players.find(p=>p.id===id)?.name||'Player');
 return names.length?names.join(' & ')+(complete?(names.length>1?' share the match!':' wins the match!'):(names.length>1?' share the win!':' wins!')):complete?'Match complete.':'Round complete.';
}
export function nextRoundText(room:CasualPublic){return room.mode==='uno'&&!room.game?.matchWinner?'Next hand':room.series?.limit?room.series.finished?'New match':'Next round':'Play again'}
export default function RoundSeriesSummary({room}:{room:CasualPublic}){
 const series=room.series;if(!series?.limit)return null;
 return <div className="round-series-summary"><strong>{series.completed} / {series.limit} {room.mode==='uno'?'matches':'rounds'} complete</strong><div>{series.players.map(p=><span key={p.id}>{p.name}<b>{p.wins} {p.wins===1?'win':'wins'}</b></span>)}</div></div>;
}
