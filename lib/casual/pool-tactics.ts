import {POCKETS,poolRemaining,poolBallRadius,validCuePosition,type PoolGame} from './pool.ts';
import {poolPowerForSpeed} from './pool-power.ts';
import {botProfile,botRandom,type FairBrain} from './bot-fairness.ts';
type Point={x:number;y:number};
const distance=(a:Point,b:Point)=>Math.hypot(a.x-b.x,a.y-b.y);
function clearance(g:PoolGame,a:Point,b:Point,ignore:number){
 const dx=b.x-a.x,dy=b.y-a.y,length=dx*dx+dy*dy,diameter=poolBallRadius(g)*2+.5;
 if(length<.001)return false;
 return !g.balls.some(o=>{if(o.pocketed||o.number===0||o.number===ignore)return false;const t=Math.max(0,Math.min(1,((o.x-a.x)*dx+(o.y-a.y)*dy)/length));return Math.hypot(o.x-a.x-t*dx,o.y-a.y-t*dy)<diameter});
}
function targets(g:PoolGame,id:string){const group=g.groups[id],remaining=poolRemaining(g,id);return g.balls.filter(b=>!b.pocketed&&b.number>0&&(b.number===8?!!group&&!remaining:!group||group==='solids'&&b.number<8||group==='stripes'&&b.number>8))}

/** Public table geometry, clear ghost-ball paths and one-rail escapes; bounded to 16 balls. */
export function choosePoolAction(g:PoolGame,id:string,brain:FairBrain):Record<string,any>|null{
 if(g.currentId!==id||g.moving)return null;
 const cue=g.balls[0],legal=targets(g,id),profile=botProfile(brain,id),radius=poolBallRadius(g),diameter=radius*2;
 if(g.inHand&&!validCuePosition(g,cue.x,cue.y)){
  let best=Infinity,place:Point|null=null;
  for(let y=85;y<=475;y+=65)for(let x=85;x<=915;x+=65){if(g.breaking&&x>275||!validCuePosition(g,x,y))continue;const p={x,y},cost=Math.min(...legal.map(b=>distance(p,b)+(clearance(g,p,b,b.number)?0:1500)));if(cost<best){best=cost;place=p}}
  return place?{action:'pool-place',...place}:null;
 }
 if(g.breaking)return{action:'pool-shot',angle:Math.atan2(280-cue.y,690-cue.x),power:.97,pocket:0};
 let best=Infinity,shot:Record<string,any>|null=null;
 for(const ball of legal)for(let pocket=0;pocket<POCKETS.length;pocket++){
  const hole=POCKETS[pocket],travel=distance(ball,hole);if(travel<1||!clearance(g,ball,hole,ball.number))continue;
  const nx=(hole.x-ball.x)/travel,ny=(hole.y-ball.y)/travel,ghost={x:ball.x-nx*diameter,y:ball.y-ny*diameter};
  if(ghost.x<50+radius||ghost.x>950-radius||ghost.y<50+radius||ghost.y>510-radius)continue;
  const routes:Point[][]=[[cue,ghost]];
  // A single reflected rail is enough to escape many blocked direct approaches.
  for(const axis of ['x','y'] as const)for(const rail of axis==='x'?[50+radius,950-radius]:[50+radius,510-radius]){
   const mirror={...ghost,[axis]:2*rail-ghost[axis]},den=mirror[axis]-cue[axis];if(Math.abs(den)<1)continue;
   const t=(rail-cue[axis])/den;if(t<=0||t>=1)continue;
   const bank={x:cue.x+(mirror.x-cue.x)*t,y:cue.y+(mirror.y-cue.y)*t};
   if(bank.x<50+radius||bank.x>950-radius||bank.y<50+radius||bank.y>510-radius||POCKETS.some(p=>distance(p,bank)<40))continue;
   routes.push([cue,bank,ghost]);
  }
  for(const route of routes){
   const before=route.at(-2)!,last=distance(before,ghost);if(last<1)continue;
   const ix=(ghost.x-before.x)/last,iy=(ghost.y-before.y)/last,alignment=ix*nx+iy*ny;if(alignment<.22)continue;
   if(route.slice(1).some((to,i)=>!clearance(g,route[i],to,i===route.length-2?ball.number:-1)))continue;
   const cueTravel=route.slice(1).reduce((sum,to,i)=>sum+distance(route[i],to),0),bank=route.length>2;
   // Rolling deceleration is 95 units/s². Preserve energy for the object path.
   const speed=Math.sqrt(190*cueTravel+190*(travel+25)/(alignment*alignment))/(bank?.91:1),power=poolPowerForSpeed(speed);
   const tx=ix-alignment*nx,ty=iy-alignment*ny,tangent=Math.hypot(tx,ty);
   const scratch=tangent>.05&&POCKETS.some(p=>{const dx=p.x-ghost.x,dy=p.y-ghost.y,along=(dx*tx+dy*ty)/tangent;return along>0&&along<250&&Math.abs(dx*ty-dy*tx)/tangent<35});
   const cost=cueTravel+travel+(1-alignment)*350+(bank?420:0)+(scratch?profile.style==='guardian'?450:250:0)+botRandom(brain)*12;
   if(cost<best){best=cost;shot={action:'pool-shot',angle:Math.atan2(route[1].y-cue.y,route[1].x-cue.x),power,pocket}}
  }
 }
 if(shot)return shot;
 // A legal first contact is better than firing through an obstructing rival ball.
 const safe=legal.filter(b=>clearance(g,cue,b,b.number)).sort((a,b)=>distance(cue,a)-distance(cue,b))[0]||legal.sort((a,b)=>distance(cue,a)-distance(cue,b))[0];
 return safe?{action:'pool-shot',angle:Math.atan2(safe.y-cue.y,safe.x-cue.x),power:poolPowerForSpeed(Math.sqrt(190*(distance(cue,safe)+70))),pocket:0}:null;
}
