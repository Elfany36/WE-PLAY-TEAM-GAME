import {poolBallRadius,type PoolGame} from './pool.ts';
/** Cosmetic roll follows displayed travel, never wall-clock time or authority mutation. */
export class PoolRoll {
 private balls=new Map<number,{x:number;y:number;phase:number;axis:number}>();
 reset(){this.balls.clear()}
 forget(number:number){this.balls.delete(number)}
 sample(number:number,x:number,y:number,radius:number){
  const prior=this.balls.get(number);
  if(!prior){const state={x,y,phase:0,axis:0};this.balls.set(number,state);return state}
  const dx=x-prior.x,dy=y-prior.y,distance=Math.hypot(dx,dy);
  if(distance>radius*5){prior.phase=0;prior.axis=0}
  else if(distance>.001){prior.phase=(prior.phase+distance/radius)%(Math.PI*2);const target=Math.atan2(dy,dx);prior.axis+=Math.atan2(Math.sin(target-prior.axis),Math.cos(target-prior.axis))*.25}
  prior.x=x;prior.y=y;return prior;
 }
}
export function poolCuePose(age:number,power:number,radius:number){
 if(!Number.isFinite(age)||age<0||age>240)return{offset:radius+14+power*38,opacity:1};
 return{offset:age<70?radius-10*Math.sin(age/70*Math.PI/2):radius-10+(age-70)/170*75,opacity:Math.max(0,Math.min(1,(240-age)/100))};
}

/** The aiming ghost stops at the first ball or cushion, inside the real footprint. */
export function poolAim(g:PoolGame,angle:number){
 const cue=g.balls[0],radius=poolBallRadius(g),dx=Math.cos(angle),dy=Math.sin(angle);
 let reach=660,target:number|null=null;
 if(dx>.00001)reach=Math.min(reach,(950-radius-cue.x)/dx);else if(dx<-.00001)reach=Math.min(reach,(50+radius-cue.x)/dx);
 if(dy>.00001)reach=Math.min(reach,(510-radius-cue.y)/dy);else if(dy<-.00001)reach=Math.min(reach,(50+radius-cue.y)/dy);
 for(const ball of g.balls){if(!ball.number||ball.pocketed)continue;const x=ball.x-cue.x,y=ball.y-cue.y,along=x*dx+y*dy,across=Math.abs(x*dy-y*dx);if(along>0&&across<radius*2){const hit=along-Math.sqrt(radius*radius*4-across*across);if(hit>=0&&hit<reach){reach=hit;target=ball.number}}}
 return{x:cue.x+dx*Math.max(0,reach),y:cue.y+dy*Math.max(0,reach),target};
}
