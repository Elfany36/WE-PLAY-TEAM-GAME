import type {PartyGame,ClubActor} from './party.ts';
/** A small, signaled crosswind, derived from match ticks so pause and prediction agree. */
export function glacierGust(g:PartyGame){const elapsed=g.tick*50%20000,cycle=Math.floor(g.tick*50/20000);return{active:g.kind==='marble'&&g.map==='glacier'&&g.rules===2&&elapsed>=16000,direction:cycle%2?-1:1,remaining:Math.ceil(((elapsed>=16000?20000:16000)-elapsed)/1000)}}
export const FOUNDRY_PADS=[{x:480,y:90},{x:480,y:510}] as const;
const SUPPLIES={
 garden:{name:'Garden med bay',hint:'Restore one hull point',color:'#9dffba',pads:FOUNDRY_PADS},
 canyon:{name:'Canyon ammo drop',hint:'Refill five shells',color:'#ffcd85',pads:[{x:530,y:90},{x:400,y:510}]},
 neon:{name:'Neon charge',hint:'Gain armor and two shells',color:'#c5b4ff',pads:FOUNDRY_PADS},
 harbor:{name:'Harbor rescue',hint:'Restore hull and three shells',color:'#9deeff',pads:[{x:480,y:90},{x:480,y:530}]},
 foundry:{name:'Foundry supplies',hint:'Refill shells and restore armor',color:'#ffe09a',pads:FOUNDRY_PADS},
 glacier:{name:'Crystal armor',hint:'Restore both armor plates',color:'#9ffff2',pads:FOUNDRY_PADS},
} as const;
export function arenaSupply(g:PartyGame){
 const schedule=foundrySupply(g),config=SUPPLIES[g.map],enabled=g.kind==='tanks'&&g.rules===2&&(g.map==='foundry'||g.mapEvents===1);
 return{...schedule,...config,enabled,pads:g.map==='foundry'?config.pads:[config.pads[schedule.cycle%2]]};
}
/** Match ticks keep the schedule deterministic and pause-safe. */
export function foundrySupply(g:PartyGame){const elapsed=g.tick*50%20000;return{cycle:Math.floor(g.tick*50/20000),open:elapsed>=16000,remaining:Math.ceil(((elapsed>=16000?20000:16000)-elapsed)/1000)}}
export function collectFoundrySupply(g:PartyGame,a:ClubActor,now:number){
 const event=arenaSupply(g),scale=g.worldScale||1;if(!event.enabled||!a.alive||!event.open||a.supplyCycle===event.cycle||!event.pads.some(p=>Math.hypot(a.x-p.x*scale,a.y-p.y*scale)<36))return false;
 a.supplyCycle=event.cycle;a.supplyAt=now;
 if(g.map==='garden'||g.map==='harbor')a.hp=Math.min(3,a.hp+1);
 if(g.map==='canyon'||g.map==='foundry'){a.ammo=5;a.reloadUntil=0}
 if(g.map==='neon'||g.map==='harbor'){a.ammo=Math.min(5,(a.ammo??0)+(g.map==='neon'?2:3));a.reloadUntil=0}
 if(g.map==='glacier')a.armor=2;
 else if(g.map==='neon'||g.map==='foundry')a.armor=Math.min(2,(a.armor||0)+1);
 return true;
}
