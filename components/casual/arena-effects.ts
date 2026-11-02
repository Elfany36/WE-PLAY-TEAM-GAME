import {TANK_SHELL_RADIUS,type PartyGame} from '../../lib/casual/party';

/** A readable skill/cooldown arc; constant geometry and no particle allocations. */
export function paintAbilityRing(c:CanvasRenderingContext2D,x:number,y:number,radius:number,progress:number,color:string){
 c.save();c.translate(x,y);c.lineWidth=3;c.strokeStyle='#0b243bab';c.beginPath();c.arc(0,0,radius,0,Math.PI*2);c.stroke();
 c.strokeStyle=color;c.lineCap='round';c.beginPath();c.arc(0,0,radius,-Math.PI/2,-Math.PI/2+Math.PI*2*Math.max(0,Math.min(1,progress)));c.stroke();c.restore();
}

/** Bounded, deterministic effects: no particle arrays or per-frame random state. */
export function paintImpact(c:CanvasRenderingContext2D,x:number,y:number,age:number,radius=38,color='#ffe4a0'){
 if(age<0||age>320)return;
 const life=1-age/320;
 c.save();c.translate(x,y);c.globalAlpha=life;c.strokeStyle=color;c.lineWidth=2+life*2;
 c.beginPath();c.arc(0,0,radius*(.45+(1-life)*.9),0,Math.PI*2);c.stroke();
 for(let i=0;i<8;i++){
  const angle=i*Math.PI/4+.18,inner=radius*(.3+(1-life)*.5),outer=inner+7*life;
  c.beginPath();c.moveTo(Math.cos(angle)*inner,Math.sin(angle)*inner);c.lineTo(Math.cos(angle)*outer,Math.sin(angle)*outer);c.stroke();
 }
 c.restore();
}

const shellSprites=new Map<string,HTMLCanvasElement>();
function shellSprite(own:boolean,effects:boolean){const key=String(own)+effects,known=shellSprites.get(key);if(known)return known;const art=document.createElement('canvas');art.width=224;art.height=128;const c=art.getContext('2d')!,radius=TANK_SHELL_RADIUS;c.scale(2,2);
 c.save();c.translate(80,32);
 const trail=c.createLinearGradient(-64,0,4,0);trail.addColorStop(0,own?'#35e8d000':'#ff682c00');trail.addColorStop(.6,own?'#35e8d0aa':'#ff682cbb');trail.addColorStop(1,'#fff1a4ee');
 c.fillStyle=trail;c.beginPath();c.moveTo(-64,0);c.lineTo(-7,-radius*.7);c.lineTo(5,0);c.lineTo(-7,radius*.7);c.closePath();c.fill();
 // The bright body matches the shared collision radius. The halo adds contrast on every map.
 c.shadowColor=own?'#62ffdf':'#ffd34e';c.shadowBlur=effects?17:0;c.fillStyle=own?'#55f0cb':'#ffad30';c.strokeStyle='#15273b';c.lineWidth=3;
 c.beginPath();c.moveTo(15,0);c.quadraticCurveTo(7,-radius,-9,-radius);c.lineTo(-13,-radius-3);c.lineTo(-12,radius+3);c.lineTo(-9,radius);c.quadraticCurveTo(7,radius,15,0);c.closePath();c.fill();c.stroke();
 c.shadowBlur=0;c.fillStyle='#fffcec';c.beginPath();c.ellipse(5,0,7,radius*.65,0,0,Math.PI*2);c.fill();
 c.fillStyle='#ff7a31';c.fillRect(-14,-4,6,8);c.restore();
 shellSprites.set(key,art);return art;
}

export function paintTankShell(c:CanvasRenderingContext2D,shell:PartyGame['shots'][number],now:number,effects=true,own=false){
 const radius=TANK_SHELL_RADIUS,angle=Math.atan2(shell.vy,shell.vx);
 if(effects&&shell.bounceAt)paintImpact(c,shell.bounceX??shell.x,shell.bounceY??shell.y,now-shell.bounceAt,23,'#b4f5ff');
 c.save();c.translate(shell.x,shell.y);c.rotate(angle);c.drawImage(shellSprite(own,effects),-80,-32,112,64);c.restore();
}

export function paintSpeedTrail(c:CanvasRenderingContext2D,x:number,y:number,vx:number,vy:number,color:string){
 const speed=Math.hypot(vx,vy);if(speed<80)return;
 c.save();c.translate(x,y);c.rotate(Math.atan2(vy,vx));
 c.strokeStyle=color;c.lineCap='round';c.lineWidth=2;c.globalAlpha=Math.min(.5,speed/600);
 for(const side of [-1,1]){c.beginPath();c.moveTo(-23,side*17);c.lineTo(-23-Math.min(45,speed*.12),side*17);c.stroke()}
 c.restore();
}
