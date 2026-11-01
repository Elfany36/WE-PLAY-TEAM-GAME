const tiles=new Map<string,HTMLCanvasElement>(),patterns=new WeakMap<CanvasRenderingContext2D,Map<string,CanvasPattern>>();
/** A 96px repeating terrain tile replaces dozens of grid strokes per frame. */
export function raceTerrain(c:CanvasRenderingContext2D,track:string){
 let byTrack=patterns.get(c);if(!byTrack){byTrack=new Map();patterns.set(c,byTrack)}const old=byTrack.get(track);if(old)return old;
 let tile=tiles.get(track);if(!tile){tile=document.createElement('canvas');tile.width=tile.height=96;const b=tile.getContext('2d',{alpha:false})!,night=track==='night',water=track==='coast',ice=track==='ridge',sand=track==='cinder';b.fillStyle=night?'#14344d':water?'#44a5bb':ice?'#397c79':sand?'#bd865a':'#79b779';b.fillRect(0,0,96,96);
  for(let i=0;i<16;i++){const x=i*37%96,y=i*53%96;b.strokeStyle=night?'#6fe8db1a':water?'#b9f5df44':ice?'#bdedd929':sand?'#ffe1a43d':'#edf2b933';b.lineWidth=1;b.beginPath();if(water){b.moveTo(x-8,y);b.quadraticCurveTo(x,y-4,x+8,y)}else if(night){b.moveTo(x-8,y);b.lineTo(x,y);b.lineTo(x,y+8)}else {b.moveTo(x-3,y+3);b.lineTo(x,y-2);b.lineTo(x+3,y+3)}b.stroke();if(!night&&!water&&i%5===0){b.fillStyle=sand?'#804d5d':ice?'#85c3a6':'#e9da8e';b.fillRect(x+5,y+4,2,2)}}tiles.set(track,tile)}
 const result=c.createPattern(tile,'repeat')!;byTrack.set(track,result);return result;
}
