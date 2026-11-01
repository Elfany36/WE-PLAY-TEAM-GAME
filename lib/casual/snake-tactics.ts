import type {Direction,SnakeGame} from './engine.ts';
import {botProfile,botRandom,type FairBrain} from './bot-fairness.ts';
const moves:{direction:Direction;x:number;y:number}[]=[{direction:'up',x:0,y:-1},{direction:'right',x:1,y:0},{direction:'down',x:0,y:1},{direction:'left',x:-1,y:0}];

/** Bounded flood search favors reachable food, escape space and safe head approaches. */
export function chooseSnakeDirection(g:SnakeGame,id:string,brain:FairBrain):Direction|undefined{
 const w=g.worms.find(w=>w.id===id);if(!w?.alive||w.queue.length||!w.body.length)return;
 const size=g.size||32,total=size*size,blocked=new Uint8Array(total),danger=new Uint8Array(total),food=new Uint8Array(total),head=w.body[0],prior=moves.find(d=>d.direction===w.direction)!,profile=botProfile(brain,id);
 for(const p of g.obstacles||[])blocked[p.y*size+p.x]=1;
 for(const worm of g.worms){if(!worm.alive||!worm.body.length)continue;
  const protectedOpponent=worm.id!==id&&((worm.protectedUntil||0)>g.lastTickAt||(w.protectedUntil||0)>g.lastTickAt);
  if(!protectedOpponent)for(let i=0;i<worm.body.length-1;i++){const p=worm.body[i];blocked[p.y*size+p.x]=1}
  if(worm.id!==id&&!protectedOpponent){const direction=moves.find(d=>d.direction===worm.direction)!;for(const d of moves){if(d.x===-direction.x&&d.y===-direction.y)continue;const x=worm.body[0].x+d.x,y=worm.body[0].y+d.y;if(x>=0&&y>=0&&x<size&&y<size)danger[y*size+x]=1}}
 }
 for(const p of g.food)food[p.y*size+p.x]=1;
 const queue=new Int32Array(total),depth=new Uint16Array(total),seen=new Uint8Array(total),limit=Math.min(total,1024),tail=w.body.at(-1)!;let best=-Infinity,choice:Direction|undefined;
 for(const d of moves){
  if(d.x===-prior.x&&d.y===-prior.y)continue;const x=head.x+d.x,y=head.y+d.y,index=y*size+x;
  if(x<0||y<0||x>=size||y>=size||blocked[index])continue;
  seen.fill(0);let read=0,write=1,nearest=Infinity,tailReach=false,exits=0;queue[0]=index;depth[index]=0;seen[index]=1;
  while(read<write&&read<limit){const at=queue[read++],px=at%size,py=Math.floor(at/size),distance=depth[at];if(food[at])nearest=Math.min(nearest,distance);if(px===tail.x&&py===tail.y)tailReach=true;
   for(const n of moves){const nx=px+n.x,ny=py+n.y,next=ny*size+nx;if(nx<0||ny<0||nx>=size||ny>=size||blocked[next])continue;if(at===index)exits++;if(!seen[next]&&write<limit){seen[next]=1;depth[next]=distance+1;queue[write++]=next}}
  }
  if(!Number.isFinite(nearest))nearest=Math.min(size*2,...g.food.map(p=>Math.abs(p.x-x)+Math.abs(p.y-y)))+size;
  const trapped=write<Math.min(w.body.length+5,limit),score=Math.min(write,Math.max(64,w.body.length*3))*.6-nearest*2+exits*5+(tailReach?10:0)-(trapped?240:0)-(danger[index]?180+profile.risk*100:0)+(d.direction===w.direction?.6:0)+botRandom(brain)*.3;
  if(score>best){best=score;choice=d.direction}
 }
 return choice;
}
