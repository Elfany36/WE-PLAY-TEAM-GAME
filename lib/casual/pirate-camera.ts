export type PirateCamera={x:number;y:number;z:number};
export type CameraFighter={id:string;x:number;y:number;st:number;dead?:boolean;s?:{w:number;h:number}};
export type CameraInsets={top:number;right:number;bottom:number;left:number};
const clamp=(n:number,a:number,b:number)=>Math.max(a,Math.min(b,n));

/** Zoom out before a fighter leaves the safe area; ease the return to a closer view. */
export function pirateCamera(current:PirateCamera,actors:CameraFighter[],map:{w:number;h:number},width:number,height:number,mode:'action'|'follow'|'arena',focusId:string,insets:Partial<CameraInsets>={},dt=16):PirateCamera{
 const pad={left:16,right:16,top:24,bottom:24,...insets},safe={left:pad.left+16,right:width-pad.right-16,top:pad.top+16,bottom:height-pad.bottom-16};
 const availableW=Math.max(80,safe.right-safe.left),availableH=Math.max(80,safe.bottom-safe.top),alive=actors.filter(f=>f.st>0&&!f.dead),focus=alive.find(f=>f.id===focusId);
 const selected=mode==='follow'&&focus?[focus]:alive;
 let left=Infinity,right=-Infinity,top=Infinity,bottom=-Infinity;
 for(const f of selected){left=Math.min(left,f.x-(f.s?.w||64)/2);right=Math.max(right,f.x+(f.s?.w||64)/2);top=Math.min(top,f.y-(f.s?.h||74)-28);bottom=Math.max(bottom,f.y+12)}
 if(mode==='arena'||!selected.length){left=-40;right=map.w+40;top=-80;bottom=map.h+40}
 const zoom=Math.max(.02,Math.min(availableW/(right-left+96),availableH/(bottom-top+110),mode==='follow'?1.8:1.12));
 const z=zoom<current.z?zoom:current.z+(zoom-current.z)*(1-Math.exp(-Math.max(1,dt)/320));
 const centerX=(safe.left+safe.right)/2,centerY=(safe.top+safe.bottom)/2,targetX=(left+right)/2+(width/2-centerX)/z,targetY=(top+bottom)/2+(height/2-centerY)/z,mix=1-Math.exp(-Math.max(1,dt)/110);
 let x=current.x+(targetX-current.x)*mix,y=current.y+(targetY-current.y)*mix;
 // A fast dash, jump or respawn must not outrun camera smoothing.
 x=clamp(x,right-(safe.right-width/2)/z,left-(safe.left-width/2)/z);
 y=clamp(y,bottom-(safe.bottom-height/2)/z,top-(safe.top-height/2)/z);
 return{x,y,z};
}
