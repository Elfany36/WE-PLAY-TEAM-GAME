export type Pose={x:number;y:number;angle?:number};
export const shortestAngle=(n:number)=>Math.atan2(Math.sin(n),Math.cos(n));
/** Smooth only the correction introduced by a new authority snapshot; keep input prediction immediate. */
export class PoseReconciler{private poses=new Map<string,Pose>();private offsets=new Map<string,Pose>();reset(){this.poses.clear();this.offsets.clear()}forget(id:string){this.poses.delete(id);this.offsets.delete(id)}
 resolve(id:string,target:Pose,dt:number,newSnapshot:boolean,warpDistance:number,correctionSpeed=Infinity){dt=Math.max(0,Math.min(dt,100));const previous=this.poses.get(id);let offset=this.offsets.get(id)||{x:0,y:0,angle:0};if(newSnapshot&&previous){const distance=Math.hypot(previous.x-target.x,previous.y-target.y);offset=distance>warpDistance?{x:0,y:0,angle:0}:{x:previous.x-target.x,y:previous.y-target.y,angle:shortestAngle((previous.angle||0)-(target.angle||0))}}const fade=Math.exp(-dt/110),dx=offset.x*(1-fade),dy=offset.y*(1-fade),distance=Math.hypot(dx,dy),ratio=distance?Math.min(1,correctionSpeed*dt/1000/distance):1;offset={x:offset.x-dx*ratio,y:offset.y-dy*ratio,angle:(offset.angle||0)*fade};const result={x:target.x+offset.x,y:target.y+offset.y,angle:target.angle===undefined?undefined:target.angle+(offset.angle||0)};this.offsets.set(id,offset);this.poses.set(id,result);return result}
}
/** A monotonic display clock avoids reversing a moving entity when HTTP receipts jitter. */
export class GameClock{private value=0;private at=0;private error=0;private initialized=false;get ready(){return this.initialized}
 sample(serverNow:number,receivedAt:number,rtt=0){const target=serverNow+Math.min(450,Math.max(0,rtt/2));if(!this.initialized){this.value=target;this.at=receivedAt;this.error=0;this.initialized=true;return}const current=this.read(receivedAt);this.error=Math.max(-1500,Math.min(1500,target-current))}
 read(time:number){if(!this.initialized)return 0;const elapsed=Math.max(0,time-this.at),correction=Math.max(-elapsed*.12,Math.min(elapsed*.12,this.error));this.value+=elapsed+correction;this.error-=correction;this.at=Math.max(this.at,time);return this.value}
 reset(){this.initialized=false;this.value=0;this.error=0;this.at=0}
}
export type TimedPose={at:number;pose:Pose;epoch?:number};
export function interpolatePose(frames:TimedPose[],time:number,fallback:Pose,warpDistance=100){if(!frames.length)return fallback;let a=frames[0];for(let i=1;i<frames.length;i++){const b=frames[i];if(time<=b.at){if(a.epoch!==b.epoch||Math.hypot(a.pose.x-b.pose.x,a.pose.y-b.pose.y)>warpDistance)return b.pose;const t=Math.max(0,Math.min(1,(time-a.at)/Math.max(1,b.at-a.at)));return{x:a.pose.x+(b.pose.x-a.pose.x)*t,y:a.pose.y+(b.pose.y-a.pose.y)*t,angle:a.pose.angle===undefined?undefined:a.pose.angle+shortestAngle((b.pose.angle||0)-a.pose.angle)*t}}a=b}
 // Continue on the requested display timeline. Jumping to a prediction at "now"
 // here used to skip the interpolation buffer whenever one response was late.
 const prior=frames.at(-2);if(!prior||prior.epoch!==a.epoch||Math.hypot(a.pose.x-prior.pose.x,a.pose.y-prior.pose.y)>warpDistance)return a.pose;
 const gap=Math.max(0,time-a.at),extra=gap<=200?gap:200+150*(1-Math.exp(-(gap-200)/150)),t=extra/Math.max(1,a.at-prior.at);
 return{x:a.pose.x+(a.pose.x-prior.pose.x)*t,y:a.pose.y+(a.pose.y-prior.pose.y)*t,angle:a.pose.angle===undefined?undefined:a.pose.angle+shortestAngle(a.pose.angle-(prior.pose.angle||0))*t};
}
