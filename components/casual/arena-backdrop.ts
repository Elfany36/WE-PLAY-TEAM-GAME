import {tankWalls,partyScale,CLUB_MAPS,type PartyGame} from '../../lib/casual/party';
const cache=new Map<string,HTMLCanvasElement>();
/** Keep three small backdrops, never a full marble/kart world texture. */
export function tankBackdrop(g:PartyGame){
 const scale=partyScale(g),key=g.map+':'+scale,known=cache.get(key);if(known)return known;
 const canvas=document.createElement('canvas');canvas.width=960*scale;canvas.height=600*scale;const c=canvas.getContext('2d',{alpha:false})!,m=CLUB_MAPS.find(m=>m.id===g.map)||CLUB_MAPS[0],night=['neon','harbor','foundry'].includes(g.map),ice=g.map==='glacier';
 c.scale(scale,scale);c.fillStyle=night?'#10283b':ice?'#4c789b':'#28584d';c.fillRect(0,0,960,600);c.fillStyle=m.ink;c.beginPath();c.roundRect(33,35,894,540,22);c.fill();const floor=c.createLinearGradient(40,50,920,560);floor.addColorStop(0,night?m.ground:ice?'#b4eaff':'#86bda0');floor.addColorStop(1,night?'#253f52':ice?'#6fa9c3':'#4c907c');c.fillStyle=floor;c.beginPath();c.roundRect(43,45,874,520,16);c.fill();
 for(let y=50;y<560;y+=40)for(let x=50;x<910;x+=40){c.fillStyle=(x+y)%80?'#f1fcdd08':'#0c273815';c.fillRect(x,y,38,38);if((x/10+y/10)%5===0){c.strokeStyle=ice?'#dcffff44':m.ink+'42';c.lineWidth=1;c.beginPath();c.moveTo(x+6,y+18);c.lineTo(x+16,y+11);c.lineTo(x+26,y+18);c.stroke()}}
 c.strokeStyle=night?m.ink+'60':'#e1f2ce66';c.lineWidth=2;c.strokeRect(64,65,832,480);
 for(let i=0;i<8;i++){const x=80+i*114;c.fillStyle=i%2?m.ink:'#ffe4a4';c.fillRect(x,33,24,5);c.fillRect(936-x,568,24,5)}
 c.save();c.scale(1/scale,1/scale);
 for(const w of tankWalls(g.map,scale)){
  c.fillStyle='#071d3650';c.beginPath();c.roundRect(w.x+4,w.y+6,w.w,w.h,6);c.fill();c.fillStyle=night?'#142b40':ice?'#346c8b':'#24584e';c.beginPath();c.roundRect(w.x,w.y,w.w,w.h,5);c.fill();
  const top=c.createLinearGradient(w.x,w.y,w.x+w.w,w.y+w.h);top.addColorStop(0,night?m.ink:ice?'#b8f4ff':'#b6e4a4');top.addColorStop(1,night?m.ground:ice?'#65b1d3':'#529f86');c.fillStyle=top;c.beginPath();c.roundRect(w.x+3,w.y+3,w.w-6,w.h-10,3);c.fill();c.strokeStyle=night?m.ink:'#e7f9d6';c.lineWidth=2;c.stroke();
  c.strokeStyle='#102d3e60';c.lineWidth=1;for(let x=w.x+20;x<w.x+w.w-4;x+=24){c.beginPath();c.moveTo(x,w.y+4);c.lineTo(x,w.y+w.h-8);c.stroke()}
  if(g.map==='foundry'){c.strokeStyle='#ffd580';c.lineWidth=3;for(let x=w.x+6;x<w.x+w.w-6;x+=16){c.beginPath();c.moveTo(x,w.y+w.h-5);c.lineTo(Math.min(x+7,w.x+w.w-4),w.y+w.h-11);c.stroke()}}
 }
 c.restore();if(cache.size>=3)cache.delete(cache.keys().next().value!);cache.set(key,canvas);return canvas;
}
