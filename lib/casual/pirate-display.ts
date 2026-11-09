export type PirateDisplay={camera:'follow'|'action'|'arena';quality:'auto'|'high'|'low';effects:boolean;shake:boolean;touch:boolean};
export const PIRATE_DISPLAY: PirateDisplay={camera:'follow',quality:'auto',effects:true,shake:false,touch:true};
export function pirateDisplay(value:unknown):PirateDisplay{const v=value as Partial<PirateDisplay>|null;return{camera:['follow','action','arena'].includes(v?.camera||'')?v!.camera!:PIRATE_DISPLAY.camera,quality:['auto','high','low'].includes(v?.quality||'')?v!.quality!:PIRATE_DISPLAY.quality,effects:typeof v?.effects==='boolean'?v.effects:true,shake:v?.shake===true,touch:v?.touch!==false}}

/** Keep raster work within a pixel budget without changing world or pointer coordinates. */
export function piratePixelRatio(width:number,height:number,dpr:number,quality:PirateDisplay['quality'],budget=600_000){
 const ratio=quality==='low'?1:Math.min(Math.max(.5,dpr||1),quality==='high'?2:1.5);
 const w=Math.max(260,Math.min(1440,width)),h=w*Math.max(1,height)/Math.max(1,width);
 const limit=quality==='auto'?budget:quality==='low'?400_000:Infinity;
 return Math.min(ratio,Math.sqrt(limit/(w*h)));
}

/** Hysteresis prevents repeated resolution changes during isolated long frames. */
export class PirateAutoQuality{
 pixels=600_000;
 private average=16.7;
 private adjustedAt:number|null=null;
 observe(frameMs:number,now:number){
  if(!Number.isFinite(frameMs)||frameMs<=0||frameMs>250)return false;
  this.average=this.average*.94+frameMs*.06;
  if(this.adjustedAt===null){this.adjustedAt=now;return false}
  if(now-this.adjustedAt<2000)return false;
  const next=this.average>24?Math.max(250_000,this.pixels*.75):this.average<18.5?Math.min(2_000_000,this.pixels*1.25):this.pixels;
  if(next===this.pixels)return false;
  this.pixels=Math.round(next);this.adjustedAt=now;this.average=20;
  return true;
 }
}
