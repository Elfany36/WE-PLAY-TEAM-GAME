import type {CasualPublic} from './engine.ts';
import {sumoBout} from './sumo-bracket.ts';
import {poolRemaining} from './pool.ts';

/** One concise public standing per player; private hands and AI state stay private. */
export function playerStanding(room:CasualPublic,id:string){
 const g=room.game as any;if(!g)return'';
 if(g.kind==='snake'){const w=g.worms.find((w:any)=>w.id===id);return w?(w.alive?w.score+' apples · '+w.body.length+' long':room.settings.battle?'Respawning':'Out')+(room.settings.battle?' · '+(w.kills||0)+' KOs':''):''}
 if(g.kind==='uno')return(g.handCounts[id]||0)+' cards · '+(g.scores[id]||0)+' points';
 if(g.kind==='memory')return(g.scores[id]||0)+' pairs';
 if(g.kind==='ladders')return'Square '+(g.positions[id]||0)+' / 100';
 if(g.kind==='property')return g.players[id]?.bust?'Bankrupt':'$'+(g.players[id]?.cash||0).toLocaleString()+' · '+Object.values(g.owner).filter(owner=>owner===id).length+' deeds';
 if(g.kind==='circuit'){const d=g.drivers.find((d:any)=>d.id===id);return d?.finishedAt?'Finished':'Lap '+Math.min(3,(d?.lap||0)+1)+' / 3'}
 if(g.kind==='phone')return g.revealing?'Album reveal':g.submitted[id]?'Submitted':'Creating…';
 if(g.kind==='terra')return Math.ceil(g.explorers.find((p:any)=>p.id===id)?.hp||0)+' HP';
 if(g.kind==='blocks'){const b=g.boards.find((b:any)=>b.id===id);return b?(b.alive?'':'Out · ')+b.score+' pts · '+b.lines+' rows':''}
 if(g.kind==='pool')return g.groups[id]?g.groups[id]+' · '+poolRemaining(g,id)+' left':'Open table · '+(g.scores[id]||0)+' wins';
 if(['chess','dama','scidama'].includes(g.kind))return(id===g.whiteId?'White':'Black')+' · '+g.pieces.filter((p:any)=>p.owner===id).length+' pieces'+(g.scores?.[id]!==undefined?' · '+g.scores[id]+' pts':'');
 if(g.actors){const a=g.actors.find((a:any)=>a.id===id);if(!a)return'';
  if(g.kind==='sumo')return(g.bracket?(g.bracket.champion===id?'Champion':sumoBout(g,id)?.winner===id?'Advanced · waiting':sumoBout(g,id)&&a.alive?'In a duel':'Eliminated'):a.alive?'In the ring':'Out')+' · '+(g.scores[id]||0)+' wins';
  if(g.kind==='marble')return'Lap '+Math.min(2,a.lap+1)+' / 2 · '+a.deaths+' falls';
  return a.score+(g.kind==='tanks'?' KOs':' points');
 }
 return(g.scores?.[id]||0)+' points';
}
