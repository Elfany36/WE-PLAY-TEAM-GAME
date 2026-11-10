import type {Point} from './engine.ts';
/** Resolve all heads against the same grid before any body moves, for every seat. */
export function snakeCollisions(alive:{id:string;body:Point[]}[],heads:Map<string,Point>,growing:Set<string>,size:number,obstacles:Point[]=[]){
 const dead=new Map<string,string>(),killers=new Map<string,string>(),walls=new Set(obstacles.map(p=>p.x+','+p.y));
 for(const w of alive){const head=heads.get(w.id)!;
  if(head.x<0||head.y<0||head.x>=size||head.y>=size){dead.set(w.id,'Hit a wall');continue}
  if(walls.has(head.x+','+head.y)){dead.set(w.id,'Hit an obstacle');continue}
  for(const other of alive){const otherHead=heads.get(other.id)!;
   if(other.id!==w.id&&head.x===otherHead.x&&head.y===otherHead.y){dead.set(w.id,'Head-on collision');break}
   if(other.id!==w.id&&head.x===other.body[0].x&&head.y===other.body[0].y&&otherHead.x===w.body[0].x&&otherHead.y===w.body[0].y){dead.set(w.id,'Head-swap collision');break}
   const length=other.body.length-(growing.has(other.id)?0:1);
   if(other.body.some((p,i)=>i<length&&p.x===head.x&&p.y===head.y)){dead.set(w.id,other.id===w.id?'Hit your own body':'Hit another snake');if(other.id!==w.id)killers.set(w.id,other.id);break}
  }
 }
 return{dead,killers};
}
