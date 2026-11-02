/** A readable identity badge stays upright while the character rotates. */
export function paintPlayerMarker(c:CanvasRenderingContext2D,x:number,y:number,label:string,color:string,own:boolean,scale=1){
 c.save();c.translate(x,y);c.scale(scale,scale);
 c.font=(own?'800 ':'600 ')+'12px system-ui';c.textAlign='center';c.textBaseline='middle';
 const text=own?'YOU · '+label:label,width=Math.min(150,Math.max(36,c.measureText(text).width+18));
 c.fillStyle='#101827f2';c.strokeStyle=own?'#ffffff':color;c.lineWidth=own?2:1;
 c.beginPath();c.roundRect(-width/2,-12,width,24,7);c.fill();c.stroke();
 c.fillStyle=own?'#ffffff':'#e3eaf4';c.fillText(text,0,0,width-14);
 if(own){c.fillStyle=color;c.beginPath();c.moveTo(-5,15);c.lineTo(5,15);c.lineTo(0,22);c.closePath();c.fill();c.strokeStyle='#101827';c.lineWidth=1;c.stroke()}
 c.restore();
}

export function paintControlledRing(c:CanvasRenderingContext2D,x:number,y:number,radius:number,color:string,scale=1){
 c.save();c.beginPath();c.ellipse(x,y,radius,radius*.8,0,0,Math.PI*2);
 c.strokeStyle='#101827';c.lineWidth=7*scale;c.stroke();
 c.strokeStyle='#fff';c.lineWidth=4*scale;c.stroke();
 c.strokeStyle=color;c.lineWidth=2*scale;c.stroke();c.restore();
}
