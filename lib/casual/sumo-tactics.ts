import type {ClubActor,PartyGame} from './party.ts';
import {partyScale,sumoRadius} from './party.ts';

/** Equal capabilities, individual timing: bots create openings instead of mirrored pushing. */
export function sumoTactics(g:PartyGame,a:ClubActor,other:ClubActor,now:number){
 const scale=partyScale(g),cx=480*scale,cy=310*scale,ax=a.x-cx,ay=a.y-cy,ownRadius=Math.hypot(ax,ay),enemyRadius=Math.hypot(other.x-cx,other.y-cy),distance=Math.max(1,Math.hypot(other.x-a.x,other.y-a.y));
 const nx=(other.x-a.x)/distance,ny=(other.y-a.y)/distance;
 let profile=2166136261;for(const letter of a.id)profile=Math.imul(profile^letter.charCodeAt(0),16777619);profile>>>=0;
 const side=profile&1?1:-1,phase=(g.tick*50+profile%2400)%2400,edge=sumoRadius(g,now),nearEdge=ownRadius>edge-65;
 let dx=nx,dy=ny,dash=false;
 if(nearEdge){
  // Recover toward the center with a sideways escape from a body blocking that route.
  const inwardX=-ax/Math.max(1,ownRadius),inwardY=-ay/Math.max(1,ownRadius),blocked=distance<90&&nx*inwardX+ny*inwardY>.35;
  dx=inwardX+(blocked?-ny*side*.9:0);dy=inwardY+(blocked?nx*side*.9:0);
 }else{
  const attack=phase<1000,flank=distance<170&&!attack?side*(distance<75?1.1:.65):0;
  dx=nx*(attack?1:.45)-ny*flank;dy=ny*(attack?1:.45)+nx*flank;
  // An offset approach to the inside shoulder produces an outward push at contact.
  if(distance>85&&enemyRadius>65){const inwardX=-(other.x-cx)/enemyRadius,inwardY=-(other.y-cy)/enemyRadius;dx+=(other.x+inwardX*55-a.x)/distance*.45;dy+=(other.y+inwardY*55-a.y)/distance*.45}
  dash=distance<145&&(a.stamina??100)>=35&&now>=a.cooldown&&(enemyRadius>ownRadius+12||attack&&distance<80);
 }
 const length=Math.max(1,Math.hypot(dx,dy));
 return{dx:dx/length,dy:dy/length,aim:dash?Math.atan2(ny,nx):Math.atan2(dy,dx),dash};
}
