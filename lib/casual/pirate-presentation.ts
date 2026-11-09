import {PIRATE_CHARACTERS,PIRATE_MAPS} from './pirate-data.ts';
type Pose={ch:number;x:number;y:number;vx:number;vy:number;face:number;on:number;dead:number;st:number;hs:number;fz:number;hz:number;dj?:number};
/** Small, disposable local movement preview. Authoritative positions never change. */
export function piratePresentation<T extends Pose>(actor:T,mapId:string,input:{dx:number;jump:boolean;jumpHeld?:boolean},milliseconds:number):T{
 if(actor.dead||actor.st<=0||actor.hs>0||actor.fz>0)return actor;
 const steps=Math.max(0,Math.min(6,Math.floor(milliseconds/(1000/60))));if(!steps)return actor;
 const map=PIRATE_MAPS.find(m=>m.id===mapId)||PIRATE_MAPS[0],stats=PIRATE_CHARACTERS[actor.ch],p={...actor};
 for(let i=0;i<steps;i++){
  const speed=stats.sp*(p.hz>0?1.45:1);p.vx+=(input.dx*speed-p.vx)*(p.on?map.gr:.12);if(input.dx)p.face=Math.sign(input.dx);
  const oldY=p.y;if(i===0&&input.jump&&(p.on||(p.dj||0)>0)){p.vy=-stats.jp*(p.on?1:.9);if(!p.on)p.dj=Math.max(0,(p.dj||0)-1);p.on=0}if(input.jumpHeld===false&&p.vy<-4)p.vy*=.6;
  p.vy=Math.min(14,p.vy+.55);p.x+=p.vx;p.y+=p.vy;
  const half=stats.w/2;
  for(const platform of map.p){if(platform.mv)continue;if(platform.s&&p.y>platform.y+6&&p.y-stats.h<platform.y+(platform.h||0)&&p.x+half>platform.x&&p.x-half<platform.x+platform.w){p.x=p.x<platform.x+platform.w/2?platform.x-half:platform.x+platform.w+half;p.vx=0}if(p.vy>=0&&oldY<=platform.y+1&&p.y>=platform.y&&p.x+half>platform.x&&p.x-half<platform.x+platform.w){p.y=platform.y;p.vy=0;p.on=1}}
 }
 return p;
}
