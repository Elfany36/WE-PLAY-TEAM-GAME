import {TANK_SHELL_RADIUS,type PartyGame} from '../../lib/casual/party';

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

export function paintTankShell(c:CanvasRenderingContext2D,shell:PartyGame['shots'][number],now:number,effects=true){
 const radius=TANK_SHELL_RADIUS,angle=Math.atan2(shell.vy,shell.vx);
 if(effects&&shell.bounceAt)paintImpact(c,shell.bounceX??shell.x,shell.bounceY??shell.y,now-shell.bounceAt,23,'#b4f5ff');
 c.save();c.translate(shell.x,shell.y);c.rotate(angle);
 const trail=c.createLinearGradient(-64,0,4,0);trail.addColorStop(0,'#ff982c00');trail.addColorStop(.6,'#ff982c88');trail.addColorStop(1,'#fff1a4ee');
 c.fillStyle=trail;c.beginPath();c.moveTo(-64,0);c.lineTo(-7,-radius*.7);c.lineTo(5,0);c.lineTo(-7,radius*.7);c.closePath();c.fill();
 // The bright body matches the shared collision radius. The halo adds contrast on every map.
 c.shadowColor='#ffd34e';c.shadowBlur=effects?17:0;c.fillStyle='#ffc43b';c.strokeStyle='#593522';c.lineWidth=2;
 c.beginPath();c.roundRect(-12,-radius,25,radius*2,radius);c.fill();c.stroke();
 c.shadowBlur=0;c.fillStyle='#fffcec';c.beginPath();c.ellipse(5,0,7,radius*.65,0,0,Math.PI*2);c.fill();
 c.fillStyle='#ff7a31';c.fillRect(-14,-4,6,8);c.restore();
}

export function paintSpeedTrail(c:CanvasRenderingContext2D,x:number,y:number,vx:number,vy:number,color:string){
 const speed=Math.hypot(vx,vy);if(speed<80)return;
 c.save();c.translate(x,y);c.rotate(Math.atan2(vy,vx));
 c.strokeStyle=color;c.lineCap='round';c.lineWidth=2;c.globalAlpha=Math.min(.5,speed/600);
 for(const side of [-1,1]){c.beginPath();c.moveTo(-23,side*17);c.lineTo(-23-Math.min(45,speed*.12),side*17);c.stroke()}
 c.restore();
}
