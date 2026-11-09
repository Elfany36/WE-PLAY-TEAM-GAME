import type {CasualState} from './engine.ts';
import {botDecision} from './bot-pacing.ts';
/** Keep live physics at 20Hz; idle tables wake for a deadline or a bot decision. */
export function casualTickDelay(s:CasualState,now:number){
 const g=s.game;if(!g)return 1000;
 if(['snake','circuit','terra','sumo','tanks','pong','marble','blocks','pirate'].includes(g.kind)||g.kind==='pool'&&g.moving)return 50;
 let delay=Math.max(25,Math.min(1000,g.deadline-now));
 if(g.kind==='sketch'&&g.stage==='draw')delay=Math.min(delay,Math.max(25,g.hintAt-now));
 if(g.kind==='memory'&&g.resolveAt!==null)delay=Math.min(delay,Math.max(25,g.resolveAt-now));
 if(g.kind==='ladders'&&now<g.lockUntil)delay=Math.min(delay,Math.max(25,g.lockUntil-now));
 if(g.kind==='property'&&now<(g.motionUntil||0))delay=Math.min(delay,Math.max(25,(g.motionUntil||now)-now));
 if(g.kind==='pool')delay=Math.min(delay,Math.max(25,g.turnDeadline-now));
 const decision=botDecision(s,now);
 if(decision)delay=Math.min(delay,s.ai?.wait?.key===decision.key?Math.max(25,s.ai.wait.readyAt-now):25);
 return delay;
}
