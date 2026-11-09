export type GamePanelBox={x:number;y:number;width:number;height:number};
/** A floating panel always leaves its title and close controls reachable. */
export function clampGamePanel(box:GamePanelBox,width:number,height:number):GamePanelBox{
 const finite=(value:number,fallback:number)=>Number.isFinite(value)?value:fallback;
 const margin=8,maxW=Math.max(180,width-margin*2),maxH=Math.max(120,height-72-margin);
 const w=Math.min(maxW,Math.max(220,finite(box.width,280))),h=Math.min(maxH,Math.max(160,finite(box.height,260)));
 return{width:w,height:h,x:Math.max(margin,Math.min(Math.max(margin,width-w-margin),finite(box.x,margin))),y:Math.max(64,Math.min(Math.max(64,height-h-margin),finite(box.y,72)))};
}
