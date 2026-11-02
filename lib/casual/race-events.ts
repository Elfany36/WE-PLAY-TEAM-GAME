import {trackPoints,type CircuitGame,type Driver} from './circuit.ts';
const themes:Record<string,{name:string;color:string}>={meadow:{name:'Firefly sprint',color:'#bafa83'},coast:{name:'Harbor tailwind',color:'#a7f5f5'},night:{name:'Neon surge',color:'#dcacff'},ridge:{name:'Aurora draft',color:'#94ffe1'},cinder:{name:'Solar burst',color:'#ffd085'}};
/** One announced gate rotates around the course. Match ticks make pauses deterministic. */
export function raceEvent(g:CircuitGame){
 if(g.rules!==2||g.mapEvents!==1)return null;
 const elapsed=g.tick*50%24000,cycle=Math.floor(g.tick*50/24000),points=trackPoints(g.track,96,g.worldScale||1),index=(18+cycle*29)%96,point=points[index],next=points[(index+1)%96];
 return{...themes[g.track],cycle,open:elapsed>=14000&&elapsed<20000,warning:elapsed>=11000&&elapsed<14000,remaining:Math.ceil(((elapsed<14000?14000:elapsed<20000?20000:38000)-elapsed)/1000),x:point.x,y:point.y,angle:Math.atan2(next.y-point.y,next.x-point.x)};
}
export function collectRaceEvent(g:CircuitGame,d:Driver,now:number){
 const event=raceEvent(g);if(!event?.open||d.finishedAt!==null||d.gateCycle===event.cycle||Math.hypot(d.x-event.x,d.y-event.y)>78)return false;
 d.gateCycle=event.cycle;d.gateAt=now;d.boostUntil=Math.max(d.boostUntil,now+1400);if(g.track==='night')d.shieldUntil=Math.max(d.shieldUntil,now+1800);return true;
}
