import type {SnakeGame} from '../../lib/casual/engine';
import {snakeMap,wallEdges} from '../../lib/casual/maps';
export function makeSnakeScene(g:SnakeGame){
 const scene=document.createElement('canvas');scene.width=960;scene.height=960;const c=scene.getContext('2d')!,size=g.size||32,cell=864/size,m=snakeMap(g.mapId,size),night=m.id==='neon';
 const outer=c.createLinearGradient(0,0,960,960);outer.addColorStop(0,night?'#254056':'#516f5d');outer.addColorStop(1,night?'#0a1b2e':'#213f38');c.fillStyle=outer;c.fillRect(0,0,960,960);
 for(let i=0;i<100;i++){const x=(i*137+31)%960,y=(i*97+27)%960;if(x>26&&x<934&&y>26&&y<934)continue;c.fillStyle=night?'#a6e6ed77':i%3?'#bdcda563':'#e1c98677';c.beginPath();c.ellipse(x,y,4+i%5,2+i%3,i,0,7);c.fill()}
 c.save();c.translate(48,48);c.shadowColor='#071b2977';c.shadowBlur=24;c.shadowOffsetY=9;c.fillStyle=night?'#6091ad':'#9caf82';c.beginPath();c.roundRect(-17,-17,898,898,24);c.fill();c.shadowBlur=0;c.shadowOffsetY=0;
 c.strokeStyle=night?'#9bd3dc':'#dfebca';c.lineWidth=3;c.stroke();const floor=c.createLinearGradient(0,0,864,864);floor.addColorStop(0,m.ground[0]);floor.addColorStop(1,m.ground[1]);c.fillStyle=floor;c.fillRect(0,0,864,864);
 c.fillStyle=night?'#d3edfc07':'#fffae00c';for(let y=0;y<size;y++)for(let x=0;x<size;x++)if((x+y)%2===0)c.fillRect(x*cell,y*cell,cell,cell);
 c.strokeStyle=night?'#7cd5e213':'#425f4111';c.lineWidth=.7;for(let i=1;i<size;i++){c.beginPath();c.moveTo(i*cell,0);c.lineTo(i*cell,864);c.moveTo(0,i*cell);c.lineTo(864,i*cell);c.stroke()}
 const wallSet=new Set((g.obstacles||[]).map(p=>p.x+','+p.y));for(let i=0;i<145;i++){const x=(i*173+47)%size,y=(i*83+11)%size;if(wallSet.has(x+','+y))continue;c.save();c.translate((x+.5)*cell,(y+.5)*cell);c.strokeStyle=night?'#8cdfd71a':m.id==='crossroads'?'#b98b5833':'#507d5630';c.lineWidth=1;const blade=cell*.12;c.beginPath();c.moveTo(-blade,blade);c.quadraticCurveTo(-blade*1.7,-blade,0,0);c.quadraticCurveTo(blade*1.5,-blade,blade,blade);c.stroke();c.restore()}
 const solid=new Path2D(),outline=new Path2D();for(const p of g.obstacles||[])solid.rect(p.x*cell,p.y*cell,cell,cell);for(const[x,y,a,b]of wallEdges(g.obstacles||[])){outline.moveTo(x*cell,y*cell);outline.lineTo(a*cell,b*cell)}
 c.shadowColor=night?'#54c5d877':'#1d382a66';c.shadowBlur=night?12:5;c.shadowOffsetY=4;const stone=c.createLinearGradient(0,0,864,864);stone.addColorStop(0,night?'#7f88c4':m.id==='crossroads'?'#b88e65':m.id==='islands'?'#76a59a':'#94a790');stone.addColorStop(1,m.wall);c.fillStyle=stone;c.fill(solid);c.shadowBlur=0;c.shadowOffsetY=0;c.lineJoin='round';c.strokeStyle=night?'#b1c1fb':'#dae3c7';c.lineWidth=2.4;c.stroke(outline);
 for(let i=0;i<(g.obstacles||[]).length;i+=4){const p=(g.obstacles||[])[i];c.fillStyle=night?'#b1d1ed16':'#eff3d61f';c.beginPath();c.moveTo(p.x*cell+2,p.y*cell+2);c.lineTo((p.x+1)*cell-2,p.y*cell+2);c.lineTo(p.x*cell+2,(p.y+1)*cell-2);c.fill()}
 c.restore();return scene;
}
