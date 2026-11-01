import type {CasualPublic} from './engine.ts';
export function turnNotice(room:CasualPublic,now=room.serverNow){
 const g=room.game;if(room.phase!=='playing'||!g||!['ladders','memory','uno','chess','dama','scidama','pool','property'].includes(g.kind))return null;
 const id=g.kind==='property'&&g.debt?g.debt.payer:g.currentId,player=room.players.find(p=>p.id===id);
 if(!player||player.bot)return null;
 if(g.kind==='ladders'&&now<g.lockUntil||g.kind==='memory'&&g.resolveAt!==null||g.kind==='pool'&&g.moving)return null;
 return {key:[room.code,room.round,g.kind,g.turn,id].join(':'),id,name:player.name,isYou:id===room.youId,color:player.color};
}
