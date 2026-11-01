import type {PartyGame} from './party.ts';
export type SumoBout={a:string;b:string|null;winner:string|null;tieBreak?:boolean};
export type SumoBracket={round:number;bouts:SumoBout[];history:{round:number;bouts:SumoBout[]}[];startedAt:number;champion?:string};
export function sumoBouts(ids:string[]):SumoBout[]{
 let size=2;while(size<ids.length)size*=2;const byes=size-ids.length,out:SumoBout[]=[];let i=0;
 for(let bye=0;bye<byes;bye++){const a=ids[i++];out.push({a,b:null,winner:a})}
 while(i<ids.length)out.push({a:ids[i++],b:ids[i++],winner:null});return out;
}
export const sumoBout=(g:PartyGame,id:string)=>g.bracket?.bouts.find(b=>b.a===id||b.b===id);
export function sumoActive(g:PartyGame,id:string){const b=sumoBout(g,id);return !g.bracket||!!b&&!b.winner&&!!b.b}
export function sameSumoBout(g:PartyGame,a:string,b:string){const bout=sumoBout(g,a);return !g.bracket||!!bout&&((bout.a===a&&bout.b===b)||(bout.a===b&&bout.b===a))&&!bout.winner}
export function placeSumoRound(g:PartyGame,now:number){
 g.inputs={};g.tick=0;g.startAt=now+2500;g.lastTickAt=g.startAt;g.deadline=g.startAt+60000;
 for(const actor of g.actors){const bout=sumoBout(g,actor.id),left=bout?.a===actor.id;actor.alive=!!bout&&actor.finishedAt===null;actor.x=480*(g.worldScale||1)+(left?-112:112);actor.y=310*(g.worldScale||1);actor.vx=actor.vy=0;actor.angle=left?0:Math.PI;actor.stamina=100;actor.cooldown=g.startAt;actor.spawnedAt=now;actor.eliminatedAt=0;actor.lastDashSeq=0}
 if(g.bracket)g.bracket.startedAt=g.startAt;
}
export function stepSumoBracket(g:PartyGame,now:number){
 const bracket=g.bracket;if(!bracket||g.ended)return;
 for(const bout of bracket.bouts){if(bout.winner&&g.actors.find(a=>a.id===bout.winner)?.finishedAt!==null&&bout.b)bout.winner=null;if(bout.winner||!bout.b)continue;const a=g.actors.find(p=>p.id===bout.a)!,b=g.actors.find(p=>p.id===bout.b)!;
  if(!a.alive||!b.alive||now>=g.deadline){
   const distance=(p:typeof a)=>Math.hypot(p.x-480*(g.worldScale||1),p.y-310*(g.worldScale||1));
   if(a.alive===b.alive&&Math.abs(distance(a)-distance(b))<.01){ // Replay exact simultaneous draws with swapped starts.
    if(!bout.tieBreak){bout.tieBreak=true;a.alive=b.alive=true;a.x=480*(g.worldScale||1)+90;b.x=480*(g.worldScale||1)-90;a.y=b.y=310*(g.worldScale||1);a.vx=a.vy=b.vx=b.vy=0;a.stamina=b.stamina=100;g.deadline=now+20000;continue}
    // Exact repeat ties are resolved by the independently shuffled seed, equally likely for every entrant.
    bout.winner=bout.a;
   }else bout.winner=a.alive&&!b.alive?a.id:b.alive&&!a.alive?b.id:distance(a)<distance(b)?a.id:b.id;
   a.vx=a.vy=b.vx=b.vy=0;g.scores[bout.winner]=(g.scores[bout.winner]||0)+1;
  }
 }
 if(!bracket.bouts.every(b=>b.winner))return;
 const winners=bracket.bouts.map(b=>b.winner!).filter(id=>g.actors.find(a=>a.id===id)?.finishedAt===null);bracket.history.push({round:bracket.round,bouts:bracket.bouts.map(b=>({...b}))});
 if(winners.length<=1){bracket.champion=winners[0];g.winnerIds=winners;g.ended=true;return}
 bracket.round++;bracket.bouts=sumoBouts(winners);placeSumoRound(g,now);
}
