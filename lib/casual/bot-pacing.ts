import type {CasualState} from './engine.ts';
import {botRandom,type FairBrain} from './bot-fairness.ts';

export type BotWait={key:string;playerId:string;readyAt:number};
export const PACED_BOT_MODES=['memory','uno','chess','dama','scidama','pool','ladders','property'];
/** A new decision gets a new clock, including draws, second flips and repeat shots. */
export function botDecision(s:CasualState,now:number){
 const g=s.game;if(s.phase!=='playing'||!g||!PACED_BOT_MODES.includes(g.kind)||!('currentId'in g))return null;
 if(g.kind==='memory'&&g.resolveAt!==null||g.kind==='pool'&&(g.moving||now<g.startAt)||g.kind==='ladders'&&now<g.lockUntil)return null;
 let id=g.currentId,key=g.kind+':'+s.round+':'+g.currentId+':'+('turn'in g?g.turn:0);
 if(g.kind==='memory')key+=':'+g.revealed.join(',')+':'+g.moves;
 if(g.kind==='uno')key+=':'+g.drawnId+':'+g.initialWild+':'+(g.pending?.offenderId||'')+':'+g.discard.at(-1)?.id;
 if(g.kind==='pool')key+=':'+g.inHand+':'+g.balls[0].x+':'+g.balls[0].y;
 if(g.kind==='property'){
  if(g.debt)id=g.debt.payer;
  else if(g.offer)id=g.offer.to;
  else if(g.auction){const eligible=s.players.find(p=>p.bot&&!p.retired&&!g.auction!.passed.includes(p.id)&&g.auction!.bidder!==p.id);if(!eligible)return null;id=eligible.id}
  else if(now<(g.motionUntil||0))return null;
  key+=':'+id+':'+g.stage+':'+g.auction?.bid+':'+g.debt?.amount+':'+g.offer?.from;
 }
 return s.players.some(p=>p.id===id&&p.bot&&!p.retired)?{playerId:id,key}:null;
}
export function botDelay(brain:FairBrain){return 1000+Math.floor(botRandom(brain)*1801)}
