type Color={fill:string;ink:string};
const sprites=new Map<string,HTMLCanvasElement>();
function rect(c:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,r:number,fill:string|CanvasGradient){c.fillStyle=fill;c.beginPath();c.roundRect(x,y,w,h,r);c.fill()}
function sprite(key:string,paint:(c:CanvasRenderingContext2D)=>void){let image=sprites.get(key);if(!image){image=document.createElement('canvas');image.width=104;image.height=128;const c=image.getContext('2d')!;c.translate(52,64);paint(c);if(sprites.size>=128)sprites.delete(sprites.keys().next().value!);sprites.set(key,image)}return image}
export function paintMarbleModel(c:CanvasRenderingContext2D,color:Color){
 c.drawImage(sprite('marble:'+color.fill,b=>{const gradient=b.createRadialGradient(-7,-9,1,0,0,22);gradient.addColorStop(0,'#ffffff');gradient.addColorStop(.2,color.fill);gradient.addColorStop(.75,color.fill);gradient.addColorStop(1,color.ink);b.fillStyle=gradient;b.beginPath();b.arc(0,0,20,0,7);b.fill();b.strokeStyle='#ffffff99';b.lineWidth=1.5;b.stroke();b.fillStyle='#fff9';b.beginPath();b.ellipse(-6,-9,6,3,-.5,0,7);b.fill()}),-52,-64);
}
export function paintTankTurret(c:CanvasRenderingContext2D,color:Color){
 c.drawImage(sprite('turret:'+color.fill,b=>{const gradient=b.createLinearGradient(-15,-16,17,16);gradient.addColorStop(0,'#efffdf');gradient.addColorStop(.22,color.fill);gradient.addColorStop(.75,color.ink);gradient.addColorStop(1,'#0b2b3c');rect(b,-18,-16,36,32,11,gradient);b.strokeStyle='#dcfff0';b.lineWidth=1;b.stroke();rect(b,-9,-9,15,18,5,'#193b48');rect(b,-6,-6,9,12,3,color.fill);rect(b,8,-10,3,20,1,'#fff6c1');for(const y of [-11,11]){b.fillStyle='#dcf3e5';b.beginPath();b.arc(-12,y,1.8,0,7);b.fill()}}),-52,-64);
}
export function paintPaddleModel(c:CanvasRenderingContext2D,color:string){
 c.drawImage(sprite('paddle:'+color,b=>{rect(b,-15,-58,30,116,13,'#0b1a30');const gradient=b.createLinearGradient(-12,0,12,0);gradient.addColorStop(0,'#f1ffee');gradient.addColorStop(.3,color);gradient.addColorStop(.75,color);gradient.addColorStop(1,'#1c546a');rect(b,-11,-55,22,110,9,gradient);rect(b,-7,-45,3,90,2,'#ffffff99');for(let y=-28;y<=28;y+=9)rect(b,1,y,6,2,1,'#173c5855');rect(b,-8,-52,16,5,2,'#ffffff7a');rect(b,-7,47,14,5,2,'#ffffff7a')}),-52,-64);
}
export function paintKartBody(c:CanvasRenderingContext2D,color:Color,model='classic'){
 c.drawImage(sprite('kart:'+model+':'+color.fill,b=>{
  if(model!=='classic'){paintCustomKart(b,color,model);return}
  const metal=b.createLinearGradient(-22,0,22,0);metal.addColorStop(0,color.ink);metal.addColorStop(.25,color.fill);metal.addColorStop(.65,color.fill);metal.addColorStop(1,color.ink);
  b.fillStyle=metal;b.beginPath();b.moveTo(-17,-32);b.quadraticCurveTo(0,-43,17,-32);b.lineTo(22,20);b.quadraticCurveTo(0,37,-22,20);b.closePath();b.fill();b.strokeStyle='#fff6df9a';b.lineWidth=1;b.stroke();
  rect(b,-15,-33,30,23,8,color.fill);rect(b,-4,-35,8,23,2,'#fff2cc');rect(b,-18,-10,9,30,4,color.fill);rect(b,9,-10,9,30,4,color.fill);rect(b,-11,-8,22,29,7,'#133044');
  rect(b,-26,-30,52,5,2,color.ink);rect(b,-26,-30,52,2,1,'#ffffff7a');rect(b,-29,27,58,8,3,color.fill);rect(b,-27,27,54,2,1,'#fff6df99');rect(b,-16,23,32,4,2,'#123447');
  for(const x of [-14,11])for(let y=3;y<15;y+=4)rect(b,x,y,3,2,1,color.ink);
  b.fillStyle='#fff2d2';b.beginPath();b.arc(0,3,11,0,7);b.fill();b.fillStyle=color.fill;b.beginPath();b.arc(0,1,11,Math.PI,Math.PI*2);b.fill();rect(b,-9,-4,18,7,3,'#12354c');rect(b,-6,-3,10,2,1,'#a5efff');b.strokeStyle='#ffffffbf';b.lineWidth=1;b.beginPath();b.arc(0,1,10,Math.PI*1.1,Math.PI*1.7);b.stroke();
  for(const x of [-11,11]){rect(b,x-3,-32,6,3,1,'#fff6b3');rect(b,x-3,22,6,3,1,'#ff5b85')}
 }),-52,-64);
}

/** The bumper moves, but its lighting and bevel do not need rebuilding each frame. */
export function paintMarbleBumper(c:CanvasRenderingContext2D,x:number,y:number){
 c.drawImage(sprite('marble-bumper',b=>{
  rect(b,-19,-14,38,36,9,'#102a4055');
  b.fillStyle='#183544';b.beginPath();b.arc(0,0,20,0,Math.PI*2);b.fill();
  const metal=b.createRadialGradient(-6,-8,2,0,0,20);metal.addColorStop(0,'#fff1bd');metal.addColorStop(.55,'#e4ab62');metal.addColorStop(1,'#ac684c');b.fillStyle=metal;b.beginPath();b.arc(0,0,17,0,Math.PI*2);b.fill();
  b.strokeStyle='#ffe6aa';b.lineWidth=1.5;b.stroke();b.strokeStyle='#8c503e';b.lineWidth=3;b.beginPath();b.moveTo(-9,-5);b.lineTo(9,5);b.stroke();
  for(const a of [0,Math.PI/2,Math.PI,Math.PI*1.5]){b.fillStyle='#e7eee3';b.beginPath();b.arc(Math.cos(a)*13,Math.sin(a)*13,1.5,0,Math.PI*2);b.fill()}
 }),x-52,y-64);
}

/** All bodies fit the same wheelbase and collider; height is a painted roof profile. */
function paintCustomKart(b:CanvasRenderingContext2D,color:Color,model:string){
 const panel=(x:number,y:number,w:number,h:number,r=5)=>{rect(b,x,y,w,h,r,color.fill);b.strokeStyle=color.ink;b.lineWidth=1.5;b.stroke()};
 const glass=(x:number,y:number,w:number,h:number)=>{rect(b,x,y,w,h,4,'#153648');rect(b,x+3,y+3,w-6,3,1,'#9de8f3')};
 const helmet=()=>{b.fillStyle='#ffe4b4';b.beginPath();b.arc(0,2,9,0,7);b.fill();rect(b,-8,-3,16,7,3,'#183e50')};
 if(model==='formula'){
  panel(-10,-35,20,63,6);panel(-26,-32,52,7,2);panel(-28,26,56,8,2);panel(-22,-7,12,25);panel(10,-7,12,25);glass(-8,-10,16,26);helmet();rect(b,-2,-31,4,17,1,'#fff4c4');
 }else if(model==='buggy'){
  panel(-22,-27,44,53,8);glass(-16,-18,32,35);b.strokeStyle='#f5e7c0';b.lineWidth=4;b.strokeRect(-17,-19,34,37);b.beginPath();b.moveTo(-16,-19);b.lineTo(16,18);b.moveTo(16,-19);b.lineTo(-16,18);b.stroke();rect(b,-12,20,24,12,5,'#152733');helmet();
 }else if(model==='mini'){
  panel(-24,-32,48,63,14);glass(-18,-17,36,33);panel(-17,-4,34,19,7);rect(b,-4,-29,8,12,2,'#ffedc0');rect(b,-4,18,8,10,2,'#ffedc0');
 }else if(model==='van'){
  panel(-24,-34,48,67,8);rect(b,-21,-28,42,54,6,'#fff1cf');glass(-18,-24,36,15);panel(-17,-3,34,27,5);rect(b,-13,2,26,4,1,'#ffffff8a');rect(b,-13,10,26,4,1,'#ffffff8a');
 }else if(model==='hover'){
  b.fillStyle=color.ink;b.beginPath();b.ellipse(0,0,30,36,0,0,7);b.fill();b.fillStyle=color.fill;b.beginPath();b.ellipse(0,-3,25,31,0,0,7);b.fill();glass(-16,-20,32,39);b.strokeStyle='#b6fff4';b.lineWidth=3;b.beginPath();b.ellipse(0,0,28,34,0,.2,Math.PI-.2);b.stroke();rect(b,-19,23,10,7,3,'#8bfff0');rect(b,9,23,10,7,3,'#8bfff0');
 }else{
  panel(-15,-36,30,35,7);panel(-23,-1,46,32,9);glass(-17,2,34,23);for(const x of [-26,22])rect(b,x,-20,4,42,2,'#deebdf');rect(b,-8,-28,16,25,3,'#233c45');for(let y=-24;y<-4;y+=6)rect(b,-10,y,20,3,1,'#e9dfba');
 }
 for(const x of [-17,12]){rect(b,x,-30,5,4,2,'#fff4b4');rect(b,x,25,5,4,2,'#ff6484')}
}
export function paintModelAccent(c:CanvasRenderingContext2D,model:string,color:Color,radius=20){
 if(model==='classic')return;
 c.strokeStyle=color.ink;c.fillStyle='#fff0bf';c.lineWidth=2;
 if(model==='star'||model==='prism'){c.beginPath();for(let i=0;i<10;i++){const a=i*Math.PI/5-Math.PI/2,r=i%2?radius*.3:radius*.65;c.lineTo(Math.cos(a)*r,Math.sin(a)*r)}c.closePath();c.fill();c.stroke()}
 else if(model==='orbit'){c.beginPath();c.ellipse(0,0,radius*.95,radius*.34,-.5,0,7);c.stroke()}
}
