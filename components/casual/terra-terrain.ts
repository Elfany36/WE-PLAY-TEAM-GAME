import {terraTile,type TerraGame} from '../../lib/casual/terra.ts';

const ART=['','ground','dirt','stone','wood','leaf','copper','iron','crystal','workbench','furnace','torch','wood','','bedrock','stone','crystal'];
const CELLS=16,TILE=32;
type Chunk={canvas:HTMLCanvasElement;tiles:number[];hash:number;art:number};
/** Cache visible terrain in bounded chunks. Mining invalidates changed chunks, not every frame. */
export class TerraTerrain{
 private chunks=new Map<string,Chunk>();private art=0;
 invalidate(){this.art++}
 clear(){this.chunks.clear()}
 draw(ctx:CanvasRenderingContext2D,g:TerraGame,images:Map<string,HTMLImageElement>,camera:{x:number;y:number}){
  const minX=Math.max(0,Math.floor(camera.x/CELLS)),minY=Math.max(0,Math.floor(camera.y/CELLS));
  const maxX=Math.min(Math.ceil(g.width/CELLS),Math.ceil((camera.x+32)/CELLS)),maxY=Math.min(Math.ceil(g.height/CELLS),Math.ceil((camera.y+20)/CELLS));
  for(let cy=minY;cy<maxY;cy++)for(let cx=minX;cx<maxX;cx++){
   const key=cx+':'+cy;let chunk=this.chunks.get(key);
   if(!chunk){chunk={canvas:document.createElement('canvas'),tiles:[],hash:0,art:-1};chunk.canvas.width=chunk.canvas.height=CELLS*TILE;this.chunks.set(key,chunk)}
   if(chunk.tiles!==g.tiles||chunk.art!==this.art){
    let hash=2166136261;for(let y=cy*CELLS;y<Math.min(g.height,(cy+1)*CELLS);y++)for(let x=cx*CELLS;x<Math.min(g.width,(cx+1)*CELLS);x++)hash=Math.imul(hash^terraTile(g,x,y),16777619);
    if(chunk.hash!==hash||chunk.art!==this.art){
     const c=chunk.canvas.getContext('2d')!;c.clearRect(0,0,chunk.canvas.width,chunk.canvas.height);
     for(let y=cy*CELLS;y<Math.min(g.height,(cy+1)*CELLS);y++)for(let x=cx*CELLS;x<Math.min(g.width,(cx+1)*CELLS);x++){
      const kind=terraTile(g,x,y);if(!kind)continue;const px=(x-cx*CELLS)*TILE,py=(y-cy*CELLS)*TILE,img=images.get('tile-'+ART[kind]);
      if(img?.complete&&img.naturalWidth)c.drawImage(img,px,py,TILE,TILE);
      else if(kind===13){c.fillStyle='#a86a47';c.fillRect(px,py+17,32,12);c.fillStyle='#edcbb7';c.fillRect(px+3,py+12,26,10)}
      else{c.fillStyle=['','#729e68','#8a604b','#637080','#9b7054','#4d855c'][kind]||'#594e74';c.fillRect(px,py,TILE,TILE)}
      if(kind===15){c.fillStyle='#263642';c.fillRect(px+6,py+9,8,8);c.fillRect(px+18,py+18,7,6)}
      if(kind===12){c.strokeStyle='#594a3c66';c.lineWidth=1;c.strokeRect(px,py,32,16)}
     }
     chunk.hash=hash;chunk.art=this.art;
    }
    chunk.tiles=g.tiles;
   }
   ctx.drawImage(chunk.canvas,cx*CELLS*TILE,cy*CELLS*TILE);
   this.chunks.delete(key);this.chunks.set(key,chunk);
  }
  while(this.chunks.size>12)this.chunks.delete(this.chunks.keys().next().value!);
 }
}
const lightStamps=new Map<number,HTMLCanvasElement>();
export function lightStamp(radius:number){
 let stamp=lightStamps.get(radius);if(stamp)return stamp;
 stamp=document.createElement('canvas');stamp.width=stamp.height=radius*2;const c=stamp.getContext('2d')!,gradient=c.createRadialGradient(radius,radius,15,radius,radius,radius);gradient.addColorStop(0,'#000');gradient.addColorStop(1,'#0000');c.fillStyle=gradient;c.fillRect(0,0,stamp.width,stamp.height);lightStamps.set(radius,stamp);return stamp;
}
