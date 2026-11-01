import type {PartyGame,ClubActor} from './party.ts';
export const FOUNDRY_PADS=[{x:480,y:90},{x:480,y:510}] as const;
/** Match ticks keep the schedule deterministic and pause-safe. */
export function foundrySupply(g:PartyGame){const elapsed=g.tick*50%20000;return{cycle:Math.floor(g.tick*50/20000),open:elapsed>=16000,remaining:Math.ceil(((elapsed>=16000?20000:16000)-elapsed)/1000)}}
export function collectFoundrySupply(g:PartyGame,a:ClubActor,now:number){
 if(g.kind!=='tanks'||g.map!=='foundry'||g.rules!==2||!a.alive)return false;const event=foundrySupply(g),scale=g.worldScale||1;if(!event.open||a.supplyCycle===event.cycle||!FOUNDRY_PADS.some(p=>Math.hypot(a.x-p.x*scale,a.y-p.y*scale)<36))return false;
 a.supplyCycle=event.cycle;a.supplyAt=now;a.ammo=5;a.reloadUntil=0;a.armor=Math.min(2,(a.armor||0)+1);return true;
}
