/** Static halo artwork is cached; only its position changes with the controlled model. */
const halos=new Map<string,HTMLCanvasElement>();
function halo(color:string){
 let art=halos.get(color);if(art)return art;
 art=document.createElement('canvas');art.width=256;art.height=216;const c=art.getContext('2d')!;c.translate(128,108);
 c.strokeStyle=color;c.lineWidth=7;c.shadowColor=color;c.shadowBlur=20;c.beginPath();c.ellipse(0,0,82,66,0,0,Math.PI*2);c.stroke();c.stroke();c.shadowBlur=0;
 c.strokeStyle='#071226d9';c.lineWidth=9;c.stroke();c.strokeStyle='#ffffffdf';c.lineWidth=5;c.stroke();c.strokeStyle=color;c.lineWidth=3;c.stroke();
 c.fillStyle=color;for(const sign of [-1,1]){c.beginPath();c.moveTo(sign*97,0);c.lineTo(sign*108,-6);c.lineTo(sign*108,6);c.closePath();c.fill()}
 if(halos.size>=48)halos.delete(halos.keys().next().value!);halos.set(color,art);return art;
}
export function paintControlledRing(c:CanvasRenderingContext2D,x:number,y:number,radius:number,color:string,scale=1){
 const r=radius+Math.max(0,Math.min(3,(scale-1)*2)),factor=r/82;c.drawImage(halo(color),x-128*factor,y-108*factor,256*factor,216*factor);
}
