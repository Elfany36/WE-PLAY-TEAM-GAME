import type {CasualPublic} from './engine.ts';
import {playerStanding} from './scoreboard.ts';
import {checkpointCount} from './circuit.ts';
import {poolRemaining} from './pool.ts';

/** Presentation uses public progress only, including opponent UNO card counts. */
export function matchStat(room:CasualPublic,id:string){
 const g=room.game;
 let value:string|number='—',label='Waiting',progress:number|undefined;
 if(g?.kind==='snake'){const w=g.worms.find((w:{id:string})=>w.id===id);value=room.settings.battle?w?.kills||0:w?.score||0;label=room.settings.battle?'KOs':'Apples'}
 else if(g?.kind==='circuit'){const d=g.drivers.find((d:{id:string})=>d.id===id);value=d?.finishedAt?'✓':Math.min(g.laps,(d?.lap||0)+1)+'/'+g.laps;label='Laps';const count=checkpointCount(g);progress=d?.finishedAt?1:((d?.lap||0)+((d?.checkpoint||1)+count-1)%count/count)/g.laps}
 else if(g?.kind==='uno'){value=g.handCounts[id]||0;label='Cards left'}
 else if(g?.kind==='memory'){value=g.scores[id]||0;label='Pairs';progress=Number(value)/(g.deck.length/2)}
 else if(g?.kind==='ladders'){value=g.positions[id]||0;label='Square';progress=Number(value)/100}
 else if(g?.kind==='pool'){value=g.groups[id]?poolRemaining(g,id):'—';label=g.groups[id]?'To pocket':'Open table';progress=g.groups[id]?1-Number(value)/7:undefined}
 else if(g?.kind==='blocks'){const b=g.boards.find((b:{id:string})=>b.id===id);value=b?.score||0;label='Points'}
 else if(g?.kind==='property'){value='$'+(g.players[id]?.cash||0).toLocaleString();label='Cash'}
 else if(g&&['chess','dama','scidama'].includes(g.kind)){value=g.pieces.filter((p:{owner:string})=>p.owner===id).length;label='Pieces'}
 else if(g?.actors){const a=g.actors.find((a:{id:string})=>a.id===id);value=g.kind==='marble'?Math.min(g.raceLaps||2,(a?.lap||0)+1)+'/'+(g.raceLaps||2):g.kind==='sumo'?g.scores[id]||0:a?.score||0;label=g.kind==='marble'?'Laps':g.kind==='sumo'?'Wins':g.kind==='tanks'?'KOs':'Points'}
 else if(g?.kind==='phone'){value=g.submitted[id]?'✓':'…';label=g.submitted[id]?'Ready':'Creating'}
 return{value,label,detail:playerStanding(room,id),progress:progress===undefined?undefined:Math.max(0,Math.min(1,progress))};
}
