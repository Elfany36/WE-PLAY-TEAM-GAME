import type {CasualPublic} from './engine.ts';
import {compareSnake} from './snake-rank.ts';
import {partyRank} from './party.ts';
import {circuitRank} from './circuit.ts';
/** Use the same progress order as each authoritative game, including an empty lobby. */
export function casualLeaderboard(room:CasualPublic|null){
 if(!room)return[];
 const game=room.game,players=room.players.filter(p=>p.role!=='spectator');
 if(!game)return players;
 const ordered=game.kind==='circuit'?circuitRank(game):'actors'in game?partyRank(game):null;
 if(ordered){const places=new Map(ordered.map((p:{id:string},i:number)=>[p.id,i]));return players.sort((a,b)=>(places.get(a.id)??Infinity)-(places.get(b.id)??Infinity));}
 if(game.kind==='snake'){
  const worms=new Map<string,any>(game.worms.map((w:any)=>[w.id,w]));
  const absent={alive:false,score:0};
  return players.sort((a,b)=>compareSnake(worms.get(a.id)||absent,worms.get(b.id)||absent,!!room.settings.battle));
 }
 if(game.kind==='blocks'){
  const boards=new Map<string,any>(game.boards.map((b:any)=>[b.id,b]));
  return players.sort((a,b)=>Number(boards.get(b.id)?.alive)-Number(boards.get(a.id)?.alive)||(boards.get(b.id)?.score||0)-(boards.get(a.id)?.score||0));
 }
 return players.sort((a,b)=>game.kind==='ladders'?(game.positions[b.id]||0)-(game.positions[a.id]||0):['memory','uno','pool'].includes(game.kind)?(game.scores[b.id]||0)-(game.scores[a.id]||0):0);
}
