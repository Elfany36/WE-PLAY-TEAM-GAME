/** Integrate rolling by distance; absolute time × changing speed makes textures jump. */
export function rollingAngle(angle:number,speed:number,dt:number,radius=20){
 return(angle+Math.max(0,speed)*Math.max(0,Math.min(100,dt))/1000/radius)%(Math.PI*2);
}
/** Tank tread links travel with the hull, including reverse, and stop at rest. */
export function treadPhase(phase:number,speed:number,dt:number){
 return((phase+speed*Math.max(0,Math.min(100,dt))/1000)%7+7)%7;
}
/** Cosmetic tile transitions never change collision cells, ghost targets or input acknowledgements. */
export class PieceMotion{
 private poses=new Map<string,{key:string;x:number;y:number}>();
 reset(){this.poses.clear()}
 resolve(id:string,key:string,x:number,y:number,dt:number){
  const prior=this.poses.get(id);
  const pose=!prior||prior.key!==key||Math.abs(prior.x-x)>1.5||Math.abs(prior.y-y)>1.5?{key,x,y}:prior;
  const gain=1-Math.exp(-Math.max(0,Math.min(100,dt))/28);pose.x+=(x-pose.x)*gain;pose.y+=(y-pose.y)*gain;this.poses.set(id,pose);return pose;
 }
}
