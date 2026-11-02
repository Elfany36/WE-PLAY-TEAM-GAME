type Point={x:number;y:number};
type Segment={a:Point;dx:number;dy:number;invLength2:number;x0:number;x1:number;y0:number;y1:number};
const geometry=new WeakMap<readonly Point[],{segments:Segment[];buckets:Map<string,Segment[]>}>(),CELL=256;
/** Cached immutable segment geometry; no player or request state is retained. */
function index(points:readonly Point[]){let result=geometry.get(points);if(result)return result;
 const segments=points.map((a,i)=>{const b=points[(i+1)%points.length],dx=b.x-a.x,dy=b.y-a.y;return{a,dx,dy,invLength2:1/(dx*dx+dy*dy||1),x0:Math.min(a.x,b.x),x1:Math.max(a.x,b.x),y0:Math.min(a.y,b.y),y1:Math.max(a.y,b.y)}}),buckets=new Map<string,Segment[]>();
 for(const s of segments)for(let x=Math.floor((s.x0-CELL)/CELL);x<=Math.floor((s.x1+CELL)/CELL);x++)for(let y=Math.floor((s.y0-CELL)/CELL);y<=Math.floor((s.y1+CELL)/CELL);y++){const key=x+','+y,items=buckets.get(key)||[];items.push(s);buckets.set(key,items)}
 result={segments,buckets};geometry.set(points,result);return result;
}
export function nearestOnPath(points:readonly Point[],x:number,y:number){
 const data=index(points),candidates=data.buckets.get(Math.floor(x/CELL)+','+Math.floor(y/CELL));let best=Infinity,px=x,py=y;
 const scan=(segments:Segment[])=>{for(const s of segments){const ax=Math.max(s.x0-x,0,x-s.x1),ay=Math.max(s.y0-y,0,y-s.y1);if(ax*ax+ay*ay>=best)continue;const t=Math.max(0,Math.min(1,((x-s.a.x)*s.dx+(y-s.a.y)*s.dy)*s.invLength2)),qx=s.a.x+s.dx*t,qy=s.a.y+s.dy*t,d2=(x-qx)**2+(y-qy)**2;if(d2<best){best=d2;px=qx;py=qy}}};
 if(candidates)scan(candidates);
 // A segment outside this bucket is at least CELL units away. Far off track
 // positions still receive an exact answer, including checkpoint recovery.
 if(best>CELL*CELL)scan(data.segments);
 return{x:px,y:py,distance:Math.sqrt(best)};
}
