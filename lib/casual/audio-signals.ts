import type {CasualPublic} from './engine.ts';
export type GameCue='card'|'move'|'dice'|'shot'|'hit'|'jump'|'dash'|'pickup'|'score'|'win'|'finish'|'draw'|'blast';
export type AudioSignal={scope:string;kind:string;phase:string;won:boolean;turn:number;action:number;reward:number;harm:number;life:number;item:string;extra:number;jump:number;special:number;dash:number};
const n=(value:unknown)=>typeof value==='number'&&Number.isFinite(value)?value:0;
/** Read small public counters, never hidden cards, ranks, prompts or the terrain array. */
export function gameAudioSignal(room:CasualPublic):AudioSignal{
 const g=room.game,id=room.viewingId||room.youId,s:AudioSignal={scope:room.code+':'+room.round+':'+id,kind:room.mode,phase:room.phase,won:!!(room.series?.finished?room.series.winnerIds:room.result?.winnerIds)?.includes(id),turn:n(g?.turn),action:0,reward:0,harm:0,life:0,item:'',extra:0,jump:0,special:0,dash:0};
 if(!g)return s;
 if(g.kind==='pirate'){const p=g.world.fighters.find((p:{id:string})=>p.id===id);if(p){s.action=n(p.attackSeq);s.reward=n(p.ko);s.harm=n(p.dmg);s.life=n(p.st);s.item=String(p.sp??'');s.jump=n(p.jumpSeq);s.special=n(p.specialSeq);s.dash=n(p.dashSeq);s.extra=g.world.explosions.length}}
 else if(g.kind==='snake'){const p=g.worms.find((p:{id:string})=>p.id===id);if(p){s.reward=n(p.score)+n(p.kills)*10;s.life=p.alive?1:0;s.harm=n(p.deaths)}}
 else if(g.kind==='memory'){s.action=g.revealed.length;s.reward=g.deck.filter((c:{matchedBy?:string})=>c.matchedBy).length}
 else if(g.kind==='ladders'){s.action=n(g.lastRoll?.at)}
 else if(g.kind==='solitaire'){const b=g.boards[id];s.action=n(b?.version);s.reward=n(b?.removed)+(b?.foundations||[]).reduce((total:number,pile:unknown[])=>total+pile.length,0)}
 else if(g.kind==='sketch'){s.reward=g.guessed[id]?1:0;s.action=n(g.canvasEpoch);s.item=g.stage}
 else if(g.kind==='fleet'){s.action=g.shots.length;s.reward=g.shots.filter((shot:{hit?:boolean})=>shot.hit).length}
 else if(g.kind==='generals'){s.action=n(g.moves);s.extra=n(g.clashes)}
 else if(g.kind==='pool'){s.action=g.moving?1:0;s.reward=g.balls.filter((b:{pocketed:boolean})=>b.pocketed).length}
 else if(g.kind==='circuit'){const p=g.drivers.find((p:{id:string})=>p.id===id);s.reward=n(p?.lap);s.item=String(p?.item||'');s.harm=n(p?.hitAt);s.action=g.shots.filter((shot:{owner:string})=>shot.owner===id).reduce((last:number,shot:{id:number})=>Math.max(last,shot.id),0)}
 else if(g.kind==='terra'){const p=g.explorers.find((p:{id:string})=>p.id===id);s.reward=Object.values(p?.inventory||{}).reduce<number>((sum,v)=>sum+n(v),0)+n(p?.kills)*10;s.harm=100-n(p?.hp);s.action=n(p?.lastUse)}
 else if(g.kind==='blocks'){const p=g.boards.find((p:{id:string})=>p.id===id);s.reward=n(p?.lines);s.action=n(p?.score);s.life=p?.alive?1:0}
 else if(['sumo','tanks','pong','marble'].includes(g.kind)){const p=g.actors.find((p:{id:string})=>p.id===id);s.reward=n(p?.score)+n(p?.lap)*100;s.harm=3-n(p?.hp);s.life=p?.alive?1:0;s.action=g.kind==='pong'?n(g.ball.hitAt):n(p?.lastShotAt);s.extra=n(p?.deaths)}
 else if(g.kind==='phone'){s.action=n(g.stage);s.reward=g.submitted[id]?1:0}
 return s;
}
export function gameAudioCue(before:AudioSignal|null,next:AudioSignal):GameCue|null{
 if(!before||before.scope!==next.scope||before.kind!==next.kind)return null;
 if(next.phase==='finished'&&before.phase!=='finished')return next.won?'win':'finish';
 if(next.phase!=='playing')return null;
 if(next.life<before.life||next.harm>before.harm)return'hit';
 if(next.reward>before.reward)return next.kind==='snake'||next.kind==='terra'?'pickup':'score';
 if(next.kind==='pirate'&&next.extra>before.extra)return'blast';
 if(next.special>before.special)return'shot';if(next.jump>before.jump)return'jump';if(next.dash>before.dash)return'dash';
 if(next.item!==before.item&&next.item&&['pirate','circuit'].includes(next.kind))return'pickup';
 if(next.extra>before.extra&&next.kind==='generals')return'hit';
 if(next.action!==before.action){if(next.kind==='ladders')return'dice';if(next.kind==='pool')return next.action?'shot':null;if(['tanks','pirate','circuit'].includes(next.kind))return'shot';if(next.kind==='pong')return'hit';if(['memory','solitaire','sketch','phone'].includes(next.kind))return'card';if(['generals','fleet','blocks','terra'].includes(next.kind))return'move'}
 if(next.turn!==before.turn&&['uno','chess','dama','scidama','property'].includes(next.kind))return next.kind==='property'?'dice':'move';
 return null;
}
