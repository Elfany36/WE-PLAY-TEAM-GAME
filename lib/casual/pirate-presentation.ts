import {PIRATE_CHARACTERS,PIRATE_MAPS,type PiratePlatform} from './pirate-data.ts';
type Pose={ch:number;x:number;y:number;vx:number;vy:number;face:number;on:number;dead:number;st:number;hs:number;fz:number;hz:number;dj?:number;cy?:number;jb?:number;jh?:number;pj?:number|boolean;ps?:number|boolean;dd?:number;pp?:number|null;dsh?:number;dc?:number;dk?:number;at?:number;mj?:number;pl?:number;sl?:number;slm?:number};
type Input={dx:number;jump:boolean;jumpHeld?:boolean;down?:boolean;dash?:boolean;dashHeld?:boolean};
type Context={elapsed?:number;lg?:number;ice?:number;jumpPads?:{x:number;y:number;sq:number}[]};
function platformAt(p:PiratePlatform,frame:number){if(!p.mv)return p;const a=frame*p.mv.sp+p.mv.ph;return{...p,x:p.x+Math.sin(a)*(p.mv.ax||0),y:p.y+Math.cos(a)*(p.mv.ay||0)}}
/** A receipt correction must not slide the rendered fighter through a floor or wall. */
export function constrainPiratePose(actor:Pose,mapId:string,point:{x:number;y:number},elapsed:number){
 const map=PIRATE_MAPS.find(m=>m.id===mapId)||PIRATE_MAPS[0],stats=PIRATE_CHARACTERS[actor.ch],half=stats.w/2,p={...point};
 for(const base of map.p){const q=platformAt(base,elapsed);if(actor.x+half>q.x&&actor.x-half<q.x+q.w&&p.x+half>q.x&&p.x-half<q.x+q.w&&actor.y<=q.y+1&&p.y>q.y)p.y=actor.y;
  if(!q.s)continue;const bottom=q.y+(q.h||0);if(p.y<=q.y||p.y-stats.h>=bottom)continue;
  if(actor.x+half<=q.x&&p.x+half>q.x)p.x=q.x-half;else if(actor.x-half>=q.x+q.w&&p.x-half<q.x+q.w)p.x=q.x+q.w+half;
  if(actor.y-stats.h>=bottom&&p.y-stats.h<bottom&&p.x+half>q.x&&p.x-half<q.x+q.w)p.y=bottom+stats.h;
 }
 return p;
}
/** Disposable movement only. Collisions, moving platforms and buffs match room physics;
 * hits, powerups, deaths and winners always come from the room. Each call stays bounded. */
export function piratePresentation<T extends Pose>(actor:T,mapId:string,input:Input,milliseconds:number,context:Context={}):T{
 if(actor.dead||actor.st<=0)return actor;
 const steps=Math.max(0,Math.min(6,Math.floor(milliseconds/(1000/60))));if(!steps)return actor;
 const map=PIRATE_MAPS.find(m=>m.id===mapId)||PIRATE_MAPS[0],stats=PIRATE_CHARACTERS[actor.ch],p={...actor},half=stats.w/2;
 for(let i=0;i<steps;i++){
  const frame=(context.elapsed||0)+i+1,platforms=map.p.map(q=>platformAt(q,frame)),beforePlatforms=map.p.map(q=>platformAt(q,frame-1)),frozen=p.fz>0,dx=frozen?0:input.dx;
  for(const key of ['dd','fz','hz','mj','dc','pl','sl'] as const)if((p[key]||0)>0)p[key]=(p[key]||0)-1;
  const speed=stats.sp*(p.hz>0?1.45:1)*((p.sl||0)>0?.55:1),jumpSpeed=stats.jp*((p.mj||0)>0?1.2:1),held=!frozen&&(input.jumpHeld??input.jump);
  if(p.fz>0)p.vx*=.9;
  else if(p.hs>0){p.hs--;p.vx*=.94}
  else{
   if(dx&&!(p.at!>0))p.face=Math.sign(dx);
   p.vx+=(dx*speed*((p.at||0)>0?.5:1)-p.vx)*(p.on?(context.ice!>i+1?.035:map.gr):.12)*((p.pl||0)>0?.2:1);
   if(!frozen&&(i===0&&input.jump||held&&!p.pj))p.jb=6;else if((p.jb||0)>0)p.jb!--;
   if((p.jb||0)>0){if(p.on||(p.cy||0)>0){p.vy=-jumpSpeed;p.on=0;p.cy=0;p.jb=0;p.jh=1}else if(p.jb===6&&(p.dj||0)>0){p.dj!--;p.vy=-jumpSpeed*.9;p.jb=0;p.jh=1}}
   if(p.jh){if(p.vy>=0)p.jh=0;else if(!held&&p.vy<-4)p.vy*=.6}
   if(!frozen&&input.down){if(p.on)p.dd=12;else if(p.vy>0)p.vy+=.4}
   if(!frozen&&(i===0&&input.dash||input.dashHeld&&!p.ps)&&!(p.dc!>0)&&!(p.dsh!>0)){p.dsh=10;p.dc=45;p.dk=0;if(dx)p.face=Math.sign(dx)}
   if((p.dsh||0)>0){p.dsh!--;p.vx=p.face*(p.dk?15:12);p.vy=Math.min(p.vy,0)-.2}
  }
  p.pj=held;p.ps=!frozen&&!!input.dashHeld;if((p.at||0)>0)p.at!--;
  p.vy=Math.min(14,p.vy+.55*(context.lg!>i+1?.45:1)*((p.mj||0)>0?.6:1));if(p.slm&&p.vy>-3)p.vy=14;p.x+=p.vx;
  for(const q of platforms)if(q.s&&p.y>q.y+6&&p.y-stats.h<q.y+(q.h||0)&&p.x+half>q.x&&p.x-half<q.x+q.w){p.x=p.x<q.x+q.w/2?q.x-half:q.x+q.w+half;p.vx=0}
  const supporting=p.pp==null?beforePlatforms.findIndex(q=>p.on&&Math.abs(p.y-q.y)<1&&p.x+half>q.x&&p.x-half<q.x+q.w):p.pp;
  if(p.on&&supporting>=0&&map.p[supporting]?.mv){p.x+=platforms[supporting].x-beforePlatforms[supporting].x;p.y+=platforms[supporting].y-beforePlatforms[supporting].y}
  const oldY=p.y;p.y+=p.vy;p.on=0;
  for(let j=0;j<platforms.length;j++){const q=platforms[j];if(p.x+half<=q.x||p.x-half>=q.x+q.w)continue;
   if(p.vy>=0&&oldY<=q.y+1&&p.y>=q.y&&!((p.dd||0)>0&&!q.s)){p.y=q.y;p.vy=0;p.on=1;p.pp=j}
   else if(q.s&&p.vy<0&&oldY-stats.h>=q.y+(q.h||0)-2&&p.y-stats.h<q.y+(q.h||0)){p.y=q.y+(q.h||0)+stats.h;p.vy=0}
  }
  if(p.on)for(const pad of context.jumpPads||[])if(pad.sq<=i&&Math.abs(p.x-pad.x)<26&&Math.abs(p.y-pad.y)<10){p.vy=-21;p.on=0;p.cy=0;p.dj=1;p.pp=null}
  if(p.on){p.cy=6;p.dj=1}else if((p.cy||0)>0)p.cy!--;
 }
 return p;
}
