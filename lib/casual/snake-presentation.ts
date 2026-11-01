import type {Point} from './engine.ts';
import {snakeRecordedTrail} from './snake-motion.ts';
const distance=(a:Point,b:Point)=>Math.hypot(a.x-b.x,a.y-b.y);
type Projection={distance:number;along:number;x:number;y:number;segment:number};
function project(path:Point[],p:Point):Projection{
 let result={distance:Infinity,along:0,x:path[0].x,y:path[0].y,segment:0},travel=0;
 for(let i=0;i<path.length-1;i++){
  const a=path[i],b=path[i+1],dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy);
  if(length<.00001)continue;
  const t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(length*length))),x=a.x+dx*t,y=a.y+dy*t,d=Math.hypot(p.x-x,p.y-y);
  if(d<result.distance-.00001)result={distance:d,along:travel+length*t,x,y,segment:i};
  travel+=length;
 }
 return result;
}
function atDistance(path:Point[],amount:number,out:Point){
 for(let i=0;i<path.length-1;i++){
  const a=path[i],b=path[i+1],length=distance(a,b);if(length<.00001)continue;
  if(amount<=length){const t=Math.max(0,amount/length);out.x=a.x+(b.x-a.x)*t;out.y=a.y+(b.y-a.y)*t;return out}amount-=length;
 }
 const tail=path.at(-1)!;out.x=tail.x;out.y=tail.y;return out;
}

/** Trim recorded future segments to the current interpolated head. */
export function snakeTrailAt(head:Point,recorded:Point[],fallback:Point[],out:Point[]=[]){
 out.length=0;out.push(head);
 if(recorded.length>1){const p=project(recorded,head);if(p.distance<.025){for(let i=p.segment+1;i<recorded.length;i++)if(distance(out.at(-1)!,recorded[i])>.0001)out.push(recorded[i]);return out}}
 for(let i=1;i<fallback.length;i++)out.push(fallback[i]);return out;
}
type State={epoch:string;path:Point[];out:Point[];ribbon:Point[];opacity:number};

/**
 * Advance a visible head along known grid paths, then sample the whole body from
 * its traveled path. A receipt can alter the target without teleporting every
 * segment or easing diagonally through a corner. Collision state stays exact.
 */
export class SnakePresentation{
 private states=new Map<string,State>();
 reset(){this.states.clear()}
 forget(id:string){this.states.delete(id)}
 opacity(id:string){return this.states.get(id)?.opacity??1}
 /** Preserve the actual corner vertices instead of joining segment centers diagonally. */
 ribbon(id:string){
  const state=this.states.get(id);if(!state)return[];const out=state.ribbon;out.length=0;
  let remaining=Math.max(0,state.out.length-1);
  for(let i=0;i<state.path.length;i++){
   const p=state.path[i];if(!i){out.push(p);continue}
   const a=state.path[i-1],length=distance(a,p);if(length<.00001)continue;
   if(length>=remaining){const t=remaining/length;out.push({x:a.x+(p.x-a.x)*t,y:a.y+(p.y-a.y)*t});break}
   out.push(p);remaining-=length;
  }
  return out;
 }
 private create(id:string,body:Point[],trail:Point[],epoch:string,opacity=1){
  const path:Point[]=[];
  for(const p of snakeRecordedTrail({body,trail})){
   const a=path.at(-2),b=path.at(-1);
   if(a&&b&&Math.abs((b.x-a.x)*(p.y-b.y)-(b.y-a.y)*(p.x-b.x))<.00001&&(b.x-a.x)*(p.x-b.x)+(b.y-a.y)*(p.y-b.y)>=0){b.x=p.x;b.y=p.y}else path.push({...p});
  }
  const state:State={epoch,path,out:body.map(p=>({...p})),ribbon:[],opacity};this.states.set(id,state);return state;
 }
 sample(id:string,body:Point[],trail:Point[],dt:number,speed:number,epoch:string){
  if(!body.length)return body;
  let state=this.states.get(id);
  if(!state||state.epoch!==epoch){state=this.create(id,body,trail,epoch);return state.out}
  if(trail.length<2)return state.out;
  const elapsed=Math.max(0,Math.min(50,dt)),budget=elapsed/Math.max(40,speed)*1.8,head=state.path[0],target=trail[0],projection=project(trail,head),next={...head};
  state.opacity=Math.min(1,state.opacity+elapsed/150);
  if(projection.distance<=.025){
   atDistance(trail,Math.max(0,projection.along-budget),next);
  }else{
   const recent=state.path[1]||head,tx=target.x-trail[1].x,ty=target.y-trail[1].y,length=Math.max(.001,Math.hypot(tx,ty)),dx=head.x-target.x,dy=head.y-target.y;
   const ahead=(dx*tx+dy*ty)/length,side=Math.abs(dx*ty-dy*tx)/length,sameDirection=(head.x-recent.x)*tx+(head.y-recent.y)*ty>=0;
   // A slightly older receipt must not make a straight-moving snake step backward.
   if(!(ahead>0&&ahead<3&&side<.025&&sameDirection)){
    // A confirmed different route is a resync. Rewinding down our own body to
    // reach an old intersection makes the model fold into itself. Replace that
    // route with a short fade; ordinary matching paths keep continuous motion.
    state=this.create(id,body,trail,epoch,0);return state.out;
   }
  }
  if(distance(head,next)>.00001){
   const prior=state.path[1],ax=next.x-head.x,ay=next.y-head.y,bx=prior?head.x-prior.x:0,by=prior?head.y-prior.y:0;
   if(prior&&Math.abs(ax*by-ay*bx)<.00001&&ax*bx+ay*by>=0){head.x=next.x;head.y=next.y}else state.path.unshift(next);
  }
  state.out.length=body.length;
  // Walk the trail once, even for a long snake with many corners.
  let segment=0,traveled=0,length=state.path.length>1?distance(state.path[0],state.path[1]):0;
  for(let i=0;i<body.length;i++){
   while(segment<state.path.length-1&&(length<.00001||traveled+length<i)){traveled+=length;segment++;length=segment<state.path.length-1?distance(state.path[segment],state.path[segment+1]):0}
   const point=state.out[i]||(state.out[i]={x:0,y:0}),a=state.path[segment],b=state.path[Math.min(segment+1,state.path.length-1)],fraction=length?Math.max(0,Math.min(1,(i-traveled)/length)):0;
   point.x=a.x+(b.x-a.x)*fraction;point.y=a.y+(b.y-a.y)*fraction;
  }
  // Collinear points collapse above; retain enough corners for every visible segment.
  let walked=0,keep=state.path.length;for(let i=1;i<state.path.length;i++){walked+=distance(state.path[i-1],state.path[i]);if(walked>body.length+3){keep=i+1;break}}
  state.path.length=Math.min(8192,keep);
  return state.out;
 }
}
