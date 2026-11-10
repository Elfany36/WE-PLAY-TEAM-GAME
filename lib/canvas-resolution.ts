/** Reduce backing pixels only after sustained slow frames, keeping logical
 * geometry and native art resolution. Recover detail slowly to avoid oscillation.
 */
export class CanvasResolution{
 private scale=1;private last=0;private total=0;private count=0;private adjustedAt=0;
 width(ideal:number){return Math.round(Math.max(Math.min(960,ideal),ideal*this.scale))}
 frame(now:number,playing:boolean){
  const gap=now-this.last;this.last=now;
  // Ignore inactivity, tab returns and individual long tasks.
  if(!playing||gap<=0||gap>250){this.total=0;this.count=0;return false}
  this.total+=gap;this.count++;if(this.total<1500)return false;
  const average=this.total/this.count;this.total=0;this.count=0;
  const previous=this.scale;
  if(average>40)this.scale=Math.max(.6,this.scale*.8);
  else if(average<22&&now-this.adjustedAt>=10000)this.scale=Math.min(1,this.scale+.1);
  if(previous===this.scale)return false;this.adjustedAt=now;return true;
 }
}
