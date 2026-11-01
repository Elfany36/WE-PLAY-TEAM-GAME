export const BRUSHES=['round','marker','pencil','soft','calligraphy','eraser','fill'] as const;
export type Brush=typeof BRUSHES[number];
export type InkStroke={color:string;size:number;points:[number,number][];brush?:Brush;opacity?:number;color2?:string;gradient?:boolean;blend?:'normal'|'multiply'|'screen';tolerance?:number};
/** Normalize the permitted drawing controls at the server boundary. */
export function inkStyle(line:Record<string,any>){
 if(!/^#[a-fA-F0-9]{6}$/.test(line.color)||!Number.isFinite(line.size)||line.size<1||line.size>64)throw Error('Choose a hex color and a brush width from 1 to 64.');
 if(line.brush!==undefined&&!BRUSHES.includes(line.brush))throw Error('Choose a brush from the toolbar.');
 if(line.opacity!==undefined&&(!Number.isFinite(line.opacity)||line.opacity<.05||line.opacity>1))throw Error('Brush opacity must be 5–100%.');
 if(line.color2!==undefined&&!/^#[a-fA-F0-9]{6}$/.test(line.color2))throw Error('Choose a valid second color.');
 if(line.gradient!==undefined&&typeof line.gradient!=='boolean')throw Error('Choose a valid color mode.');
 if(line.blend!==undefined&&!['normal','multiply','screen'].includes(line.blend))throw Error('Choose a supported blending mode.');
 if(line.tolerance!==undefined&&(!Number.isInteger(line.tolerance)||line.tolerance<0||line.tolerance>120))throw Error('Fill tolerance must be 0–120.');
 return {color:line.color,size:line.size,...(line.brush?{brush:line.brush as Brush}:{}),...(line.opacity!==undefined?{opacity:Math.round(line.opacity*1000)/1000}:{}),...(line.color2?{color2:line.color2}:{}),...(line.gradient!==undefined?{gradient:line.gradient}:{}),...(line.blend?{blend:line.blend as InkStroke['blend']}:{}),...(line.tolerance!==undefined?{tolerance:line.tolerance}:{})};
}
/** A fill is a replayable operation in the same ordered vector history as strokes. */
function paintFill(c:CanvasRenderingContext2D,s:InkStroke){
 const w=c.canvas.width,h=c.canvas.height;if(!w||!h)return;const image=c.getImageData(0,0,w,h),data=image.data,seed=Math.min(w-1,Math.floor(s.points[0][0]*w))+Math.min(h-1,Math.floor(s.points[0][1]*h))*w,at=seed*4,target=[data[at],data[at+1],data[at+2],data[at+3]],tolerance=s.tolerance??38,visited=new Uint8Array(w*h),queue=new Uint32Array(w*h),parse=(hex:string)=>[parseInt(hex.slice(1,3),16),parseInt(hex.slice(3,5),16),parseInt(hex.slice(5,7),16)],a=parse(s.color),b=parse(s.gradient&&s.color2?s.color2:s.color),alpha=s.opacity??1;let head=0,tail=1;queue[0]=seed;visited[seed]=1;
 const enqueue=(pixel:number)=>{if(visited[pixel])return;visited[pixel]=1;const i=pixel*4;if(Math.max(Math.abs(data[i]-target[0]),Math.abs(data[i+1]-target[1]),Math.abs(data[i+2]-target[2]),Math.abs(data[i+3]-target[3]))<=tolerance)queue[tail++]=pixel};
 while(head<tail){const pixel=queue[head++],i=pixel*4,x=pixel%w,t=s.gradient?x/Math.max(1,w-1):0;for(let channel=0;channel<3;channel++){const color=a[channel]+(b[channel]-a[channel])*t,old=data[i+channel],mixed=s.blend==='multiply'?old*color/255:s.blend==='screen'?255-(255-old)*(255-color)/255:color;data[i+channel]=Math.round(old+(mixed-old)*alpha)}data[i+3]=255;if(x>0)enqueue(pixel-1);if(x<w-1)enqueue(pixel+1);if(pixel>=w)enqueue(pixel-w);if(pixel<w*(h-1))enqueue(pixel+w)}
 c.putImageData(image,0,0);
}
/** The editor, received drawings, albums and PNG export use this exact renderer. */
export function paintStroke(c:CanvasRenderingContext2D,s:InkStroke){
 if(!s.points.length)return;if(s.brush==='fill'){paintFill(c,s);return}c.save();const brush=s.brush||'round',erase=brush==='eraser';
 c.globalAlpha=(s.opacity??1)*(brush==='pencil'?.75:1);c.globalCompositeOperation=erase?'source-over':s.blend==='multiply'?'multiply':s.blend==='screen'?'screen':'source-over';
 c.lineCap=brush==='marker'||brush==='calligraphy'?'square':'round';c.lineJoin='round';c.lineWidth=brush==='pencil'?Math.max(1,s.size*.5):s.size;c.strokeStyle=erase?'#ffffff':s.color;
 if(!erase&&s.gradient&&s.color2){const a=s.points[0],b=s.points.at(-1)!,end=Math.hypot(a[0]-b[0],a[1]-b[1])>.001?b:[Math.min(1,a[0]+.12),Math.min(1,a[1]+.12)];const gradient=c.createLinearGradient(a[0]*640,a[1]*480,end[0]*640,end[1]*480);gradient.addColorStop(0,s.color);gradient.addColorStop(1,s.color2);c.strokeStyle=gradient}
 if(brush==='soft')c.filter='blur('+Math.max(.5,s.size*.13)+'px)';
 if(brush==='calligraphy'){
  c.fillStyle=c.strokeStyle;const dx=s.size*.4,dy=s.size*.16;c.beginPath();
  if(s.points.length===1){const p=s.points[0];c.moveTo(p[0]*640-dx,p[1]*480-dy);c.lineTo(p[0]*640+dx,p[1]*480-dy);c.lineTo(p[0]*640+dx,p[1]*480+dy);c.lineTo(p[0]*640-dx,p[1]*480+dy)}
  else{for(let i=0;i<s.points.length;i++){const p=s.points[i];i?c.lineTo(p[0]*640-dx,p[1]*480-dy):c.moveTo(p[0]*640-dx,p[1]*480-dy)}for(let i=s.points.length-1;i>=0;i--){const p=s.points[i];c.lineTo(p[0]*640+dx,p[1]*480+dy)}}c.closePath();c.fill();
 }
 else{c.beginPath();const first=s.points[0];c.moveTo(first[0]*640,first[1]*480);if(s.points.length>2&&['round','pencil','soft'].includes(brush)){for(let i=1;i<s.points.length-1;i++){const p=s.points[i],next=s.points[i+1];c.quadraticCurveTo(p[0]*640,p[1]*480,(p[0]+next[0])*320,(p[1]+next[1])*240)}const end=s.points.at(-1)!;c.lineTo(end[0]*640,end[1]*480)}else for(let i=1;i<s.points.length;i++)c.lineTo(s.points[i][0]*640,s.points[i][1]*480);if(s.points.length===1)c.lineTo(first[0]*640+.01,first[1]*480);c.stroke()}
 c.restore();
}
export function paintDrawing(canvas:HTMLCanvasElement,strokes:InkStroke[]){const c=canvas.getContext('2d');if(!c)return;c.setTransform(canvas.width/640,0,0,canvas.height/480,0,0);c.clearRect(0,0,640,480);c.fillStyle='#ffffff';c.fillRect(0,0,640,480);for(const s of strokes)paintStroke(c,s)}
export type DrawingLayer={canvas:HTMLCanvasElement;completed:InkStroke[]};
/** Repaint the active stroke only; completed soft/blended strokes stay cached. */
export function paintLiveDrawing(canvas:HTMLCanvasElement,strokes:InkStroke[],active:boolean,layer:DrawingLayer){
 const base=layer.canvas,count=Math.max(0,strokes.length-(active?1:0));
 if(base.width!==canvas.width||base.height!==canvas.height||layer.completed.length>count||layer.completed.some((s,i)=>s!==strokes[i])){
  base.width=canvas.width;base.height=canvas.height;layer.completed=[];paintDrawing(base,[]);
 }
 const b=base.getContext('2d')!,c=canvas.getContext('2d')!;
 if(!layer.completed.length)paintDrawing(base,[]);
 b.setTransform(base.width/640,0,0,base.height/480,0,0);
 for(let i=layer.completed.length;i<count;i++){paintStroke(b,strokes[i]);layer.completed.push(strokes[i])}
 c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,canvas.width,canvas.height);c.drawImage(base,0,0);
 if(active&&strokes.length){c.setTransform(canvas.width/640,0,0,canvas.height/480,0,0);paintStroke(c,strokes.at(-1)!)}
}
