type Color={fill:string;ink:string};
const sprites=new Map<string,HTMLCanvasElement>();
function rect(c:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,r:number,fill:string|CanvasGradient){c.fillStyle=fill;c.beginPath();c.roundRect(x,y,w,h,r);c.fill()}
function sprite(key:string,paint:(c:CanvasRenderingContext2D)=>void){let image=sprites.get(key);if(!image){image=document.createElement('canvas');image.width=104;image.height=128;const c=image.getContext('2d')!;c.translate(52,64);paint(c);sprites.set(key,image)}return image}
export function paintMarbleModel(c:CanvasRenderingContext2D,color:Color){
 c.drawImage(sprite('marble:'+color.fill,b=>{const gradient=b.createRadialGradient(-7,-9,1,0,0,22);gradient.addColorStop(0,'#ffffff');gradient.addColorStop(.2,color.fill);gradient.addColorStop(.75,color.fill);gradient.addColorStop(1,color.ink);b.fillStyle=gradient;b.beginPath();b.arc(0,0,20,0,7);b.fill();b.strokeStyle='#ffffff99';b.lineWidth=1.5;b.stroke();b.fillStyle='#fff9';b.beginPath();b.ellipse(-6,-9,6,3,-.5,0,7);b.fill()}),-52,-64);
}
export function paintTankTurret(c:CanvasRenderingContext2D,color:Color){
 c.drawImage(sprite('turret:'+color.fill,b=>{const gradient=b.createLinearGradient(-15,-16,17,16);gradient.addColorStop(0,'#efffdf');gradient.addColorStop(.22,color.fill);gradient.addColorStop(.75,color.ink);gradient.addColorStop(1,'#0b2b3c');rect(b,-18,-16,36,32,11,gradient);b.strokeStyle='#dcfff0';b.lineWidth=1;b.stroke();rect(b,-9,-9,15,18,5,'#193b48');rect(b,-6,-6,9,12,3,color.fill);rect(b,8,-10,3,20,1,'#fff6c1');for(const y of [-11,11]){b.fillStyle='#dcf3e5';b.beginPath();b.arc(-12,y,1.8,0,7);b.fill()}}),-52,-64);
}
export function paintPaddleModel(c:CanvasRenderingContext2D,color:string){
 c.drawImage(sprite('paddle:'+color,b=>{rect(b,-15,-58,30,116,13,'#0b1a30');const gradient=b.createLinearGradient(-12,0,12,0);gradient.addColorStop(0,'#f1ffee');gradient.addColorStop(.3,color);gradient.addColorStop(.75,color);gradient.addColorStop(1,'#1c546a');rect(b,-11,-55,22,110,9,gradient);rect(b,-7,-45,3,90,2,'#ffffff99');for(let y=-28;y<=28;y+=9)rect(b,1,y,6,2,1,'#173c5855');rect(b,-8,-52,16,5,2,'#ffffff7a');rect(b,-7,47,14,5,2,'#ffffff7a')}),-52,-64);
}
export function paintKartBody(c:CanvasRenderingContext2D,color:Color){
 c.drawImage(sprite('kart:'+color.fill,b=>{
  const metal=b.createLinearGradient(-22,0,22,0);metal.addColorStop(0,color.ink);metal.addColorStop(.25,color.fill);metal.addColorStop(.65,color.fill);metal.addColorStop(1,color.ink);
  b.fillStyle=metal;b.beginPath();b.moveTo(-17,-32);b.quadraticCurveTo(0,-43,17,-32);b.lineTo(22,20);b.quadraticCurveTo(0,37,-22,20);b.closePath();b.fill();b.strokeStyle='#fff6df9a';b.lineWidth=1;b.stroke();
  rect(b,-15,-33,30,23,8,color.fill);rect(b,-4,-35,8,23,2,'#fff2cc');rect(b,-18,-10,9,30,4,color.fill);rect(b,9,-10,9,30,4,color.fill);rect(b,-11,-8,22,29,7,'#133044');
  rect(b,-26,-30,52,5,2,color.ink);rect(b,-26,-30,52,2,1,'#ffffff7a');rect(b,-29,27,58,8,3,color.fill);rect(b,-27,27,54,2,1,'#fff6df99');rect(b,-16,23,32,4,2,'#123447');
  for(const x of [-14,11])for(let y=3;y<15;y+=4)rect(b,x,y,3,2,1,color.ink);
  b.fillStyle='#fff2d2';b.beginPath();b.arc(0,3,11,0,7);b.fill();b.fillStyle=color.fill;b.beginPath();b.arc(0,1,11,Math.PI,Math.PI*2);b.fill();rect(b,-9,-4,18,7,3,'#12354c');rect(b,-6,-3,10,2,1,'#a5efff');b.strokeStyle='#ffffffbf';b.lineWidth=1;b.beginPath();b.arc(0,1,10,Math.PI*1.1,Math.PI*1.7);b.stroke();
  for(const x of [-11,11]){rect(b,x-3,-32,6,3,1,'#fff6b3');rect(b,x-3,22,6,3,1,'#ff5b85')}
 }),-52,-64);
}
