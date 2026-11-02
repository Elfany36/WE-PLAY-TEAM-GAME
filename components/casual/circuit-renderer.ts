import {paintKartBody} from './model-art';
import {raceTerrain} from './race-terrain';
import type {CasualPublic} from '../../lib/casual/engine';
import {circuitObstacles,trackPoints,circuitWorld,circuitProps,CIRCUIT_SHOULDER,KART_RADIUS,TRACKS,type CircuitGame,type CircuitProp} from '../../lib/casual/circuit';
import {ARCADE_COLORS as PLAYER_COLORS} from '../../lib/casual/arcade-colors';
import {shortestAngle} from '../../lib/game-motion';
import {paintImpact,paintSpeedTrail,paintAbilityRing} from './arena-effects';
let motionPreference:MediaQueryList|null=null;
export type RaceCamera={x:number;y:number;angle?:number;initialized?:boolean;northUp?:boolean};
type Prop=CircuitProp;
const scenes=new Map<string,{road:Path2D;props:Prop[]}>();
function scene(g:CircuitGame){
 const key=g.track+':'+(g.worldScale||1)+':'+g.rules,known=scenes.get(key);if(known)return known;
 const p=trackPoints(g.track,192,g.worldScale||1),road=new Path2D();p.forEach((v,i)=>i?road.lineTo(v.x,v.y):road.moveTo(v.x,v.y));road.closePath();
 const props=[...circuitProps(g),...circuitObstacles(g)];
 const result={road,props};scenes.set(key,result);return result;
}
function rounded(c:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,r:number,fill:string){c.fillStyle=fill;c.beginPath();c.roundRect(x,y,w,h,r);c.fill()}
function paintProp(c:CanvasRenderingContext2D,p:Prop,track:string){
 c.save();c.translate(p.x,p.y);c.fillStyle='#071c2945';c.beginPath();c.ellipse(5,12,29,17,0,0,7);c.fill();
 if(p.kind===7){c.rotate(p.angle);rounded(c,-20,-24,40,48,7,'#142a35');rounded(c,-17,-22,34,42,5,'#b97043');c.strokeStyle='#ffe3a0';c.lineWidth=5;c.beginPath();c.moveTo(-12,-14);c.lineTo(12,10);c.moveTo(-12,2);c.lineTo(4,18);c.stroke();rounded(c,-25,-5,50,10,3,'#192e40');c.fillStyle='#fff3a1';for(const x of [-15,0,15]){c.beginPath();c.moveTo(x-4,-3);c.lineTo(x+1,0);c.lineTo(x-4,3);c.lineTo(x,3);c.lineTo(x+5,0);c.lineTo(x,-3);c.closePath();c.fill()}}else if(track==='night'&&p.kind<5){const h=40+p.kind*11;rounded(c,-26,-h,52,h+14,5,'#152e44');rounded(c,-23,-h-5,46,h,5,['#23405c','#33475e','#204c58'][p.kind%3]);c.fillStyle=['#8fe2d3','#d5a3ff','#ffdf93'][p.kind%3];for(let y=-h+9;y<-2;y+=13)for(let x=-16;x<20;x+=13)c.fillRect(x,y,5,6);c.strokeStyle='#7fe2d155';c.lineWidth=2;c.strokeRect(-23,-h-5,46,h)}
 else if(track==='coast'&&p.kind<3){c.rotate(p.angle);rounded(c,-22,-30,44,60,8,'#fff1d3');rounded(c,-15,-21,30,38,9,['#d96764','#609eac','#e0ad57'][p.kind]);c.fillStyle='#24485b';c.fillRect(-11,-8,22,14);c.strokeStyle='#735f4c';c.lineWidth=3;c.beginPath();c.moveTo(0,-40);c.lineTo(0,38);c.stroke()}
 else if(track==='cinder'&&p.kind<5){c.fillStyle='#664766';c.beginPath();c.moveTo(-27,12);c.lineTo(-20,-20);c.lineTo(0,-47);c.lineTo(25,-17);c.lineTo(28,12);c.closePath();c.fill();c.fillStyle='#eac186';c.beginPath();c.moveTo(0,-47);c.lineTo(25,-17);c.lineTo(7,-8);c.closePath();c.fill();c.strokeStyle='#ffce9155';c.lineWidth=2;c.beginPath();c.moveTo(0,-47);c.lineTo(7,-8);c.lineTo(0,8);c.stroke()}
 else if(track==='ridge'&&p.kind<5){c.fillStyle='#806e62';c.fillRect(-4,-5,8,31);for(let i=2;i>=0;i--){c.fillStyle=['#43988f','#56b09d','#74ceba'][i];c.beginPath();c.moveTo(-24+i*5,8-i*17);c.lineTo(0,-32-i*14);c.lineTo(24-i*5,8-i*17);c.fill()}c.fillStyle='#e7ffed';c.beginPath();c.moveTo(-6,-44);c.lineTo(0,-60);c.lineTo(7,-44);c.fill()}
 else if(p.kind===5){c.rotate(p.angle);rounded(c,-8,-9,16,18,4,'#44565a');c.strokeStyle='#e6dcb8';c.lineWidth=4;c.beginPath();c.moveTo(0,0);c.lineTo(0,-47);c.stroke();c.fillStyle=track==='night'?'#9cf4e0':'#fff4c5';c.shadowColor=c.fillStyle;c.shadowBlur=track==='night'?14:0;c.beginPath();c.arc(0,-48,9,0,7);c.fill()}
 else {const green=track==='night'?['#2d6170','#407882']:track==='coast'?['#557d6b','#7a9c72']:['#3f795f','#72a671'];c.fillStyle='#6d6247';c.fillRect(-5,0,10,25);for(const [x,y,r]of [[-15,-14,22],[15,-17,24],[0,-35,28]]){const gr=c.createRadialGradient(x-6,y-7,3,x,y,r);gr.addColorStop(0,green[1]);gr.addColorStop(1,green[0]);c.fillStyle=gr;c.beginPath();c.arc(x,y,r,0,7);c.fill()}c.fillStyle='#e4eeb160';c.beginPath();c.arc(-8,-43,8,0,7);c.fill()}
 c.restore();
}
const propSprites=new Map<string,HTMLCanvasElement>();
function prop(c:CanvasRenderingContext2D,p:Prop,track:string){const key=track+':'+p.kind;let sprite=propSprites.get(key);if(!sprite){sprite=document.createElement('canvas');sprite.width=128;sprite.height=160;const ctx=sprite.getContext('2d')!;ctx.translate(64,112);paintProp(ctx,{...p,x:0,y:0,angle:0},track);propSprites.set(key,sprite)}c.save();c.translate(p.x,p.y);if(track==='coast'&&p.kind<3||p.kind===7)c.rotate(p.angle);c.drawImage(sprite,-64,-112);c.restore()}
const depthOrder:(Prop|CircuitGame['drivers'][number])[]=[];

function kart(c:CanvasRenderingContext2D,d:CircuitGame['drivers'][number],color:string,ink:string,time:number,effects=true){
 c.save();c.translate(d.x,d.y);c.rotate(d.angle+Math.PI/2);
 c.fillStyle='#061a2c66';c.beginPath();c.ellipse(3,7,27,37,0,0,7);c.fill();
 if(d.boostUntil>time){const flame=45+(effects?Math.sin(time*.04)*9:0);c.fillStyle='#f59c53';c.beginPath();c.moveTo(-12,27);c.quadraticCurveTo(-4,flame,0,flame+13);c.quadraticCurveTo(4,flame,12,27);c.fill();c.fillStyle='#fff4a9';c.beginPath();c.moveTo(-6,27);c.lineTo(0,flame);c.lineTo(6,27);c.fill()}
 for(const x of [-23,23])for(const y of [-20,21]){c.save();c.translate(x,y);if(y<0)c.rotate((d.steering||0)*.38);rounded(c,-6,-11,12,22,4,'#142735');rounded(c,-5,-8,3,16,1,'#51606b');c.restore()}
 paintKartBody(c,{fill:color,ink});
 if(effects&&d.drifting>.15){c.strokeStyle=d.drifting>.65?'#8edbff':'#f7cf7d';c.lineWidth=2;for(const x of [-26,26]){c.beginPath();c.moveTo(x,23);c.lineTo(x+Math.sin(time*.03)*7,37);c.stroke()}}
 if((d.magnetUntil||0)>time){c.strokeStyle='#ceb4ff';c.lineWidth=2;c.setLineDash([4,6]);c.beginPath();c.arc(0,0,54,0,7);c.stroke();c.setLineDash([])}if(effects&&time-(d.pulseAt||0)<450){c.strokeStyle='#a8e9f3';c.globalAlpha=1-(time-d.pulseAt!)/450;c.lineWidth=4;c.beginPath();c.arc(0,0,(time-d.pulseAt!)*.6,0,7);c.stroke();c.globalAlpha=1}
 if(d.shieldUntil>time){c.strokeStyle='#a5edff';c.lineWidth=2.5;c.shadowBlur=effects?12:0;c.shadowColor='#99ddeb';c.beginPath();c.ellipse(0,0,37,46,0,0,7);c.stroke()}
 c.restore();
}
export function drawRace(c:CanvasRenderingContext2D,g:CircuitGame,r:CasualPublic,time:number,camera:RaceCamera,dt:number){
 const own=g.drivers.find(d=>d.id===r.youId)||g.drivers[0];if(!own)return;motionPreference??=matchMedia('(prefers-reduced-motion: reduce)');const effects=!motionPreference.matches;const track=TRACKS.find(t=>t.id===g.track)||TRACKS[0],world=circuitWorld(g),art=scene(g),follow=1-Math.exp(-Math.min(50,dt)/90);
 if(!camera.initialized||Math.hypot(camera.x-own.x,camera.y-own.y)>650){camera.x=own.x;camera.y=own.y;camera.angle=camera.northUp!==false?-Math.PI/2:own.angle;camera.initialized=true}else{camera.x+=(own.x-camera.x)*follow;camera.y+=(own.y-camera.y)*follow;camera.angle=camera.northUp!==false?-Math.PI/2:(camera.angle||0)+shortestAngle(own.angle-(camera.angle||0))*follow}
 c.fillStyle=track.ground;c.fillRect(0,0,960,600);c.save();c.translate(480,390);c.rotate(-(camera.angle||0)-Math.PI/2);const zoom=c.canvas.clientWidth<600?1.12:.9;c.scale(zoom,zoom);c.translate(-camera.x,-camera.y);
 c.fillStyle=raceTerrain(c,g.track);c.fillRect(0,0,world.width,world.height);
 c.lineJoin=c.lineCap='round';if(g.track==='coast'){c.strokeStyle='#e7cf9c';c.lineWidth=560;c.stroke(art.road);c.strokeStyle='#f7e6ba';c.lineWidth=440;c.stroke(art.road)}c.strokeStyle=g.track==='night'?'#7191ac':'#526951';c.lineWidth=(CIRCUIT_SHOULDER+KART_RADIUS)*2+6;c.stroke(art.road);c.strokeStyle=track.ground;c.lineWidth=(CIRCUIT_SHOULDER+KART_RADIUS)*2;c.stroke(art.road);c.strokeStyle='#0e293d45';c.lineWidth=238;c.stroke(art.road);c.strokeStyle=g.track==='night'?'#5d8cba':'#f5e7c2';c.lineWidth=216;c.stroke(art.road);c.setLineDash([30,27]);c.strokeStyle=g.track==='night'?'#82e7d7':'#d47769';c.lineWidth=207;c.stroke(art.road);c.setLineDash([]);c.strokeStyle=track.road;c.lineWidth=184;c.stroke(art.road);c.strokeStyle=g.track==='night'?'#e6dfaf77':'#fff8d377';c.lineWidth=3;c.setLineDash([40,34]);c.stroke(art.road);c.setLineDash([]);
 depthOrder.length=0;for(const p of art.props)if(Math.abs(p.x-camera.x)<1000&&Math.abs(p.y-camera.y)<1000)depthOrder.push(p);
 const points=trackPoints(g.track,192,g.worldScale||1),first=points[0],angle=Math.atan2(points[1].y-first.y,points[1].x-first.x);c.save();c.translate(first.x,first.y);c.rotate(angle);for(let y=-90;y<90;y+=18)for(let x=-18;x<18;x+=18){c.fillStyle=((x/18+y/18)%2+2)%2?'#fff6db':'#273749';c.fillRect(x,y,18,18)}c.restore();
 for(const b of g.boxes){if(Math.hypot(b.x-camera.x,b.y-camera.y)>1000)continue;const ready=b.readyAt<=time;paintAbilityRing(c,b.x,b.y,30,ready?1:1-(b.readyAt-time)/4500,ready?'#9dffe1':'#edc887');if(!ready)continue;c.save();c.translate(b.x,b.y);c.rotate(effects?Math.sin(time*.002)*.18:0);rounded(c,-21,-21,42,42,8,'#d4f0ed');c.strokeStyle='#75a7aa';c.lineWidth=3;c.strokeRect(-17,-17,34,34);c.fillStyle='#385c79';c.font='900 28px system-ui';c.textAlign='center';c.fillText('?',0,10);c.restore()}
 for(const h of g.hazards){c.fillStyle='#15263f';c.beginPath();c.ellipse(h.x,h.y,25,17,.2,0,7);c.fill();c.strokeStyle='#ae91d5';c.lineWidth=2;c.stroke()}
 for(const s of g.shots){c.save();c.translate(s.x,s.y);c.rotate(Math.atan2(s.vy,s.vx));const tail=c.createLinearGradient(-60,0,8,0);tail.addColorStop(0,'#f3a44400');tail.addColorStop(1,'#fff9b7dd');c.fillStyle=tail;c.beginPath();c.moveTo(-60,0);c.lineTo(0,-8);c.lineTo(14,0);c.lineTo(0,8);c.closePath();c.fill();c.fillStyle='#fff9d4';c.beginPath();c.arc(0,0,10,0,7);c.fill();c.restore()}
 for(const d of g.drivers)if(!r.players.find(p=>p.id===d.id)?.retired&&Math.abs(d.x-camera.x)<1200&&Math.abs(d.y-camera.y)<1200)depthOrder.push(d);depthOrder.sort((a,b)=>a.y-b.y);for(const item of depthOrder){if('speed'in item){const player=r.players.find(p=>p.id===item.id);if(player){const color=PLAYER_COLORS[player.color%12];if(effects){if(item.hitAt)paintImpact(c,item.x,item.y,time-item.hitAt,42);if(item.boostUntil>time||item.drifting>.15)paintSpeedTrail(c,item.x,item.y,item.vx??Math.cos(item.angle)*item.speed,item.vy??Math.sin(item.angle)*item.speed,'#ffe3a4')}kart(c,item,color.fill,color.ink,time,effects)}}else prop(c,item,g.track)}
 for(const d of g.drivers){const p=r.players.find(p=>p.id===d.id);if(!p||p.retired||Math.hypot(d.x-camera.x,d.y-camera.y)>1200)continue;c.save();c.translate(d.x,d.y-52);c.rotate((camera.angle||0)+Math.PI/2);c.font='700 13px system-ui';c.textAlign='center';const label=p.isYou?'YOU':p.name+(d.bot?' · BOT':''),w=c.measureText(label).width;rounded(c,-w/2-8,-15,w+16,23,7,'#153340e8');c.fillStyle='#fff5df';c.fillText(label,0,1);c.restore()}
 c.restore();
 if(c.canvas.dataset?.hideHud==='true')return;
 rounded(c,18,18,210,58,12,'#122c3de8');c.fillStyle='#d3e8dd';c.font='700 11px system-ui';c.textAlign='left';c.fillText('POCKET KART · '+track.name.toUpperCase(),30,39);c.fillStyle='#fff7dc';c.font='700 16px system-ui';c.fillText('LAP '+Math.min(g.laps,own.lap+1)+' / '+g.laps+'   ·   ~1 MIN / LAP',30,62);
 rounded(c,18,516,137,64,13,'#122c3de8');c.fillStyle='#fff4ce';c.font='900 30px system-ui';c.fillText(String(Math.round(Math.abs(own.speed)*.22)).padStart(2,'0'),31,552);c.font='11px system-ui';c.fillText('km/h',92,550);c.fillStyle='#b4d7ca';c.fillText(own.speed<0?'REVERSE':own.drifting>.1?'DRIFTING':own.boostUntil>time?'BOOST':'KEEP YOUR LINE',31,570);
 rounded(c,340,536,240,44,10,'#122c3de8');c.fillStyle='#8acfe7';c.fillRect(352,564,Math.min(216,own.drifting/2*216),4);c.fillStyle='#fff0cf';c.font='700 12px system-ui';c.fillText(own.drifting>.65?'TURBO READY · RELEASE DRIFT':'HOLD DRIFT TO CHARGE TURBO',352,554);
 if(own.lastLapMs){rounded(c,173,531,150,47,10,'#122c3de8');c.fillStyle='#fff5dc';c.font='700 12px system-ui';c.fillText('LAST LAP  '+(own.lastLapMs/1000).toFixed(2)+'s',186,559)}
 c.save();c.translate(780,18);rounded(c,0,0,162,122,12,'#122c3de8');const scale=Math.min(144/world.width,104/world.height);c.translate((162-world.width*scale)/2,(122-world.height*scale)/2);c.scale(scale,scale);c.strokeStyle='#d4dcb9';c.lineWidth=3/scale;c.stroke(art.road);for(const d of g.drivers){const p=r.players.find(p=>p.id===d.id);if(p?.retired)continue;c.fillStyle=p?.isYou?'#fff7d9':PLAYER_COLORS[(p?.color||0)%12].fill;c.beginPath();c.arc(d.x,d.y,(p?.isYou?3.5:2.5)/scale,0,7);c.fill()}c.restore();
}
