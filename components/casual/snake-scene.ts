import type {SnakeGame} from '../../lib/casual/engine';
import {snakeMap,wallEdges} from '../../lib/casual/maps';
/** A scene is rasterized once per map/size; the animation loop only blits it. */
export function makeSnakeScene(g:SnakeGame){
 const scene=document.createElement('canvas');scene.width=960;scene.height=960;const c=scene.getContext('2d',{alpha:false})!,size=g.size||32,cell=864/size,m=snakeMap(g.mapId,size),night=['neon','orbit','tidepool','lotus','canopy','voltage'].includes(m.id),ice=m.id==='frost',water=m.id==='tidepool'||m.id==='islands',stone=m.id==='sunspire'||m.id==='crossroads';
 const outer=c.createLinearGradient(0,0,960,960);outer.addColorStop(0,night?'#243656':ice?'#4b82a8':'#336959');outer.addColorStop(1,night?'#0b1632':'#152f3e');c.fillStyle=outer;c.fillRect(0,0,960,960);
 for(let i=0;i<48;i++){const x=(i*137+19)%960,y=(i*97+23)%960;if(x>26&&x<934&&y>26&&y<934)continue;c.fillStyle=m.accent;c.globalAlpha=.45;c.beginPath();if(night){c.moveTo(x-3,y);c.lineTo(x,y-8);c.lineTo(x+3,y);c.lineTo(x,y+8)}else c.ellipse(x,y,5+i%5,3+i%3,i,0,7);c.fill()}c.globalAlpha=1;
 c.save();c.translate(48,48);c.fillStyle='#071a2b88';c.beginPath();c.roundRect(-19,-11,902,902,24);c.fill();c.fillStyle=night?'#405d7f':ice?'#a0d9e7':'#83a98a';c.beginPath();c.roundRect(-17,-21,898,898,24);c.fill();c.strokeStyle=night?m.accent:'#e8f0cd';c.lineWidth=3;c.stroke();const floor=c.createLinearGradient(0,0,864,864);floor.addColorStop(0,m.ground[0]);floor.addColorStop(1,m.ground[1]);c.fillStyle=floor;c.fillRect(0,0,864,864);
 const occupied=new Set((g.obstacles||[]).map(p=>p.x+','+p.y));
 c.fillStyle=night?'#defdff08':'#fffde310';for(let y=0;y<size;y++)for(let x=0;x<size;x++)if((x+y)%2===0)c.fillRect(x*cell,y*cell,cell,cell);
 c.strokeStyle=night?'#b5e3ff16':'#375d4a15';c.lineWidth=.7;for(let i=1;i<size;i++){c.beginPath();c.moveTo(i*cell,0);c.lineTo(i*cell,864);c.moveTo(0,i*cell);c.lineTo(864,i*cell);c.stroke()}
 for(let i=0;i<180;i++){
  const x=(i*173+47)%size,y=(i*83+11)%size;if(occupied.has(x+','+y))continue;c.save();c.translate((x+.5)*cell,(y+.5)*cell);c.strokeStyle=night?m.accent+'32':ice?'#3b8bb942':stone?'#a77e4640':'#3d855440';c.lineWidth=Math.max(1,cell*.045);c.beginPath();
  if(water){c.moveTo(-cell*.25,0);c.quadraticCurveTo(0,-cell*.15,cell*.25,0)}else if(ice||night){c.moveTo(-cell*.1,0);c.lineTo(cell*.1,0);c.moveTo(0,-cell*.1);c.lineTo(0,cell*.1)}else {c.moveTo(-cell*.12,cell*.1);c.quadraticCurveTo(-cell*.25,-cell*.16,0,0);c.quadraticCurveTo(cell*.2,-cell*.2,cell*.13,cell*.12)}c.stroke();
  if(!night&&!ice&&!stone&&i%9===0){c.fillStyle=i%2?'#f78bad':'#ffe497';c.beginPath();c.arc(cell*.17,-cell*.13,cell*.09,0,7);c.fill()}c.restore();
 }
 const solid=new Path2D(),outline=new Path2D();for(const p of g.obstacles||[])solid.rect(p.x*cell,p.y*cell,cell,cell);for(const[x,y,a,b]of wallEdges(g.obstacles||[])){outline.moveTo(x*cell,y*cell);outline.lineTo(a*cell,b*cell)}
 c.fillStyle=m.wall;c.fill(solid);
 for(const p of g.obstacles||[]){
  const x=p.x*cell,y=p.y*cell,bevel=cell*.17;c.fillStyle=night?'#0b244780':'#142d354f';c.fillRect(x,y+cell-bevel,cell,bevel);c.fillStyle=night?m.accent+'5c':'#fff5d74f';c.fillRect(x+1,y+1,cell-2,bevel);c.fillStyle='#fff7df1a';c.fillRect(x+1,y+bevel,bevel,cell-bevel*2);
  if(ice){c.strokeStyle='#e1ffffb0';c.lineWidth=1;c.beginPath();c.moveTo(x+bevel,y+cell*.75);c.lineTo(x+cell*.7,y+bevel);c.lineTo(x+cell*.85,y+cell*.6);c.stroke()}else if((p.x+p.y)%3===0){c.fillStyle=night?m.accent+'80':'#e2efb35a';c.beginPath();c.moveTo(x+cell*.35,y+cell*.3);c.lineTo(x+cell*.6,y+cell*.45);c.lineTo(x+cell*.45,y+cell*.65);c.lineTo(x+cell*.25,y+cell*.45);c.fill()}
 }
 c.lineJoin='round';c.strokeStyle=night?m.accent:'#ecf2ce';c.lineWidth=night?1.7:2;c.stroke(outline);c.strokeStyle=night?m.accent+'55':'#102f3b66';c.lineWidth=1;c.strokeRect(0,0,864,864);
 for(const[x,y]of [[-8,-8],[872,-8],[-8,872],[872,872]]){c.fillStyle=m.accent;c.beginPath();c.arc(x,y,5,0,7);c.fill();c.fillStyle='#fff8df';c.beginPath();c.arc(x-1,y-1,2,0,7);c.fill()}
 c.restore();return scene;
}
