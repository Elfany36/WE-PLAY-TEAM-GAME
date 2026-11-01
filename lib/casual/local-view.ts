import type {CasualState} from './engine.ts';

/** Pass the device between humans; computer turns never grant a computer seat. */
export function localViewer(state:CasualState,preferred:string|null=null,review:string|null=null){
 const humans=state.players.filter(p=>!p.bot&&!p.retired),game=state.game;
 const fallback=humans.find(p=>p.id===preferred)?.id??humans.find(p=>p.id===state.hostId)?.id??humans[0]?.id??state.hostId;
 if(!game)return fallback;
 let actor=fallback;
 if(game.kind==='property')actor=preferred&&!game.players[preferred]?.bust?preferred:game.debt?.payer||game.currentId;
 else if('currentId'in game)actor=game.kind==='uno'&&review?review:game.currentId;
 return humans.some(p=>p.id===actor)?actor:fallback;
}
