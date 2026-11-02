/** Physical chassis, in world units. Wheels and bumpers are inside these hulls. */
export const KART_HULL={halfLength:39,halfWidth:33} as const;
export const TANK_HULL={halfLength:34,halfWidth:33} as const;
export const MARBLE_RADIUS=20,SUMO_BODY_RADIUS=26;
export type Hull={x:number;y:number;c:number;s:number;halfLength:number;halfWidth:number};
export type Contact={nx:number;ny:number;depth:number};
export function hullAt(a:{x:number;y:number;angle:number},size:{halfLength:number;halfWidth:number},angle=a.angle):Hull{return{x:a.x,y:a.y,c:Math.cos(angle),s:Math.sin(angle),...size}}
export function hullSupport(h:Hull,nx:number,ny:number){return Math.abs(nx*h.c+ny*h.s)*h.halfLength+Math.abs(-nx*h.s+ny*h.c)*h.halfWidth}
/** Minimum separating vector points from b to a. Four SAT axes, with an AABB broad phase. */
export function hullContact(a:Hull,b:Hull):Contact|null{
 const dx=a.x-b.x,dy=a.y-b.y;
 if(Math.abs(dx)>=Math.abs(a.c)*a.halfLength+Math.abs(a.s)*a.halfWidth+Math.abs(b.c)*b.halfLength+Math.abs(b.s)*b.halfWidth||Math.abs(dy)>=Math.abs(a.s)*a.halfLength+Math.abs(a.c)*a.halfWidth+Math.abs(b.s)*b.halfLength+Math.abs(b.c)*b.halfWidth)return null;
 let depth=Infinity,nx=0,ny=0;
 for(const [x,y] of [[a.c,a.s],[-a.s,a.c],[b.c,b.s],[-b.s,b.c]]){const signed=dx*x+dy*y,overlap=hullSupport(a,x,y)+hullSupport(b,x,y)-Math.abs(signed);if(overlap<=1e-7)return null;if(overlap<depth){depth=overlap;const sign=signed<0?-1:1;nx=x*sign;ny=y*sign}}
 return {nx,ny,depth};
}
export function hullCircleContact(h:Hull,p:{x:number;y:number},radius:number):Contact|null{
 const dx=p.x-h.x,dy=p.y-h.y,lx=dx*h.c+dy*h.s,ly=-dx*h.s+dy*h.c;
 if(Math.abs(lx)>h.halfLength+radius||Math.abs(ly)>h.halfWidth+radius)return null;
 const qx=Math.max(-h.halfLength,Math.min(h.halfLength,lx)),qy=Math.max(-h.halfWidth,Math.min(h.halfWidth,ly)),ox=qx-lx,oy=qy-ly,d2=ox*ox+oy*oy;
 let nx:number,ny:number,depth:number;
 if(d2>0){if(d2>=radius*radius)return null;const distance=Math.sqrt(d2);nx=ox/distance;ny=oy/distance;depth=radius-distance}
 else if(h.halfLength-Math.abs(lx)<h.halfWidth-Math.abs(ly)){nx=lx>=0?-1:1;ny=0;depth=h.halfLength-Math.abs(lx)+radius}
 else{nx=0;ny=ly>=0?-1:1;depth=h.halfWidth-Math.abs(ly)+radius}
 return {nx:nx*h.c-ny*h.s,ny:nx*h.s+ny*h.c,depth};
}
export function wallHull(w:{x:number;y:number;w:number;h:number}):Hull{return{x:w.x+w.w/2,y:w.y+w.h/2,c:1,s:0,halfLength:w.w/2,halfWidth:w.h/2}}
