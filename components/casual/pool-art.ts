import {POCKETS} from '../../lib/casual/pool';
import {tableScene} from '../../lib/casual/scenes';

const colors=['#fff8e7','#ffc62b','#2879e3','#ee405d','#884ad2','#ff922f','#19a887','#962d55','#101d30','#ffc62b','#2879e3','#ee405d','#884ad2','#ff922f','#19a887','#962d55'];
let light:HTMLCanvasElement|null=null,cueArt:HTMLCanvasElement|null=null;
function sphereLight(){
 if(light)return light;light=document.createElement('canvas');light.width=96;light.height=96;const c=light.getContext('2d')!;c.translate(48,48);c.beginPath();c.arc(0,0,40,0,Math.PI*2);c.clip();
 const shade=c.createRadialGradient(-15,-19,2,3,5,47);shade.addColorStop(0,'#ffffff99');shade.addColorStop(.36,'#ffffff08');shade.addColorStop(.7,'#06162c12');shade.addColorStop(1,'#031025c9');c.fillStyle=shade;c.fillRect(-48,-48,96,96);
 c.fillStyle='#ffffffa8';c.beginPath();c.ellipse(-12,-21,10,4,-.45,0,Math.PI*2);c.fill();c.fillStyle='#ffffff55';c.beginPath();c.ellipse(19,21,6,2,-.6,0,Math.PI*2);c.fill();return light;
}
export function paintPoolBall(c:CanvasRenderingContext2D,n:number,x:number,y:number,radius:number,phase=0,axis=0){
 c.save();c.translate(x,y);c.scale(radius/20,radius/20);
 c.fillStyle='#041b2b45';c.beginPath();c.ellipse(2,5,20,17,0,0,Math.PI*2);c.fill();
 c.save();c.beginPath();c.arc(0,0,20,0,Math.PI*2);c.clip();c.fillStyle=n>8?'#fff8e7':colors[n];c.fillRect(-21,-21,42,42);
 c.save();c.rotate(axis);const shift=Math.sin(phase)*12,face=Math.max(.12,Math.abs(Math.cos(phase)));
 if(n>8){c.fillStyle=colors[n];c.beginPath();c.ellipse(shift,0,Math.max(6,face*14),28,0,0,Math.PI*2);c.fill()}
 if(n){c.translate(shift,0);c.scale(face,1);c.fillStyle='#fffdf0';c.beginPath();c.arc(0,0,8.2,0,Math.PI*2);c.fill();c.fillStyle='#132238';c.font='850 11px system-ui';c.textAlign='center';c.textBaseline='middle';c.fillText(String(n),0,.5)}else{c.fillStyle='#d5ae8666';for(const a of [0,2.1,4.2]){c.beginPath();c.arc(Math.cos(a+phase)*6,Math.sin(a+phase)*6,1.1,0,Math.PI*2);c.fill()}}
 c.restore();c.drawImage(sphereLight(),-24,-24,48,48);c.restore();c.strokeStyle='#07182d70';c.lineWidth=.65;c.beginPath();c.arc(0,0,20,0,Math.PI*2);c.stroke();c.restore();
}
export function paintPoolCue(c:CanvasRenderingContext2D,x:number,y:number,angle:number,pull:number,opacity=1){
 if(!cueArt){cueArt=document.createElement('canvas');cueArt.width=640;cueArt.height=40;const b=cueArt.getContext('2d')!;b.scale(2,2);b.translate(310,10);const wood=b.createLinearGradient(-300,0,0,0);wood.addColorStop(0,'#152437');wood.addColorStop(.13,'#234354');wood.addColorStop(.34,'#32282b');wood.addColorStop(.36,'#dbb070');wood.addColorStop(.8,'#f4d7a0');wood.addColorStop(1,'#fff0c6');b.fillStyle=wood;b.beginPath();b.moveTo(0,-2.5);b.lineTo(-298,-6);b.quadraticCurveTo(-307,0,-298,6);b.lineTo(0,2.5);b.closePath();b.fill();b.strokeStyle='#101d2f';b.lineWidth=.6;b.stroke();b.fillStyle='#fff7de88';b.fillRect(-205,-3.2,190,.7);b.strokeStyle='#bdcaaf66';for(let x=-295;x<-222;x+=3){b.beginPath();b.moveTo(x,-5.5);b.lineTo(x+4,5.5);b.stroke()}for(const x of [-300,-220,-213,-8]){b.fillStyle='#d4dbe1';b.fillRect(x,-4,2,8)}b.fillStyle='#f5f2df';b.fillRect(-8,-2.8,7,5.6);b.fillStyle='#38a9c6';b.fillRect(-1,-2.9,3,5.8)}
 c.save();c.translate(x,y);c.rotate(angle);c.globalAlpha=opacity;c.drawImage(cueArt,-pull-310,-10,320,20);c.restore();
}
export function makePoolTable(sceneId?:string){
 const scene=tableScene(sceneId),canvas=document.createElement('canvas');canvas.width=1000;canvas.height=560;const c=canvas.getContext('2d')!;
 c.fillStyle='#0b1929';c.fillRect(0,0,1000,560);const wood=c.createLinearGradient(0,0,1000,560);wood.addColorStop(0,scene.wood);wood.addColorStop(.45,'#352a30');wood.addColorStop(1,scene.wood);c.fillStyle=wood;c.beginPath();c.roundRect(11,11,978,538,36);c.fill();c.strokeStyle='#d7b779';c.lineWidth=2;c.stroke();c.strokeStyle='#ffffff20';c.lineWidth=1;c.beginPath();c.roundRect(19,19,962,522,30);c.stroke();
 c.fillStyle=scene.felt;c.beginPath();c.roundRect(39,39,922,482,18);c.fill();const felt=c.createRadialGradient(440,220,30,500,280,550);felt.addColorStop(0,scene.feltLight);felt.addColorStop(1,scene.felt);c.fillStyle=felt;c.fillRect(50,50,900,460);
 c.fillStyle='#efffe908';for(let y=52;y<508;y+=3)c.fillRect(52,y,896,1);c.fillStyle='#04192710';for(let x=53;x<948;x+=6)c.fillRect(x,52,1,456);
 c.strokeStyle='#071c3166';c.lineWidth=8;c.strokeRect(49,49,902,462);c.strokeStyle='#ffffff22';c.lineWidth=2;c.strokeRect(57,57,886,446);
 c.strokeStyle='#e9f6da45';c.lineWidth=1;c.beginPath();c.moveTo(275,62);c.lineTo(275,498);c.stroke();for(const[x,y]of [[275,280],[690,280]]){c.fillStyle='#f4efcfbb';c.beginPath();c.arc(x,y,2,0,Math.PI*2);c.fill()}
 for(const p of POCKETS){c.fillStyle='#c1a177';c.beginPath();c.arc(p.x,p.y,34,0,Math.PI*2);c.fill();c.fillStyle='#111824';c.beginPath();c.arc(p.x,p.y,29,0,Math.PI*2);c.fill();c.strokeStyle='#000b16';c.lineWidth=4;c.stroke();c.strokeStyle='#c8b29222';c.lineWidth=1;for(let i=-16;i<=16;i+=8){c.beginPath();c.moveTo(p.x-19,p.y+i);c.lineTo(p.x+19,p.y+i+9);c.stroke()}}
 c.fillStyle='#f8dfac';for(let i=1;i<8;i++)for(const y of [28,532]){const x=50+i*112.5;c.beginPath();c.moveTo(x,y-3);c.lineTo(x+5,y);c.lineTo(x,y+3);c.lineTo(x-5,y);c.closePath();c.fill()}c.textAlign='center';c.font='700 9px system-ui';c.letterSpacing='3px';c.fillText('THE EIGHT BALL CLUB',500,552);return canvas;
}
