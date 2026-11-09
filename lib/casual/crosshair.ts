/** Screen-space reticle shared by the platform brawler and Tank Battle. */
export function paintCrosshair(c:CanvasRenderingContext2D,x:number,y:number,scale=1){
 c.save();c.globalAlpha=1;c.globalCompositeOperation='source-over';c.setLineDash([]);
 for(let pass=0;pass<2;pass++){c.strokeStyle=pass?'#fff':'#132338';c.lineWidth=(pass?1.8:4)*scale;c.beginPath();c.arc(x,y,9*scale,0,Math.PI*2);c.moveTo(x-15*scale,y);c.lineTo(x+15*scale,y);c.moveTo(x,y-15*scale);c.lineTo(x,y+15*scale);c.stroke()}
 c.restore();
}
