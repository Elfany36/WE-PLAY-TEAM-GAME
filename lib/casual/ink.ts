export const BRUSHES=['round','marker','pencil','soft','calligraphy','eraser'] as const;
export type Brush=typeof BRUSHES[number];
export type InkStroke={color:string;size:number;points:[number,number][];brush?:Brush;opacity?:number;color2?:string;gradient?:boolean;blend?:'normal'|'multiply'|'screen'};
/** Normalize the permitted drawing controls at the server boundary. */
export function inkStyle(line:Record<string,any>){
 if(!/^#[a-fA-F0-9]{6}$/.test(line.color)||!Number.isFinite(line.size)||line.size<1||line.size>64)throw Error('Choose a hex color and a brush width from 1 to 64.');
 if(line.brush!==undefined&&!BRUSHES.includes(line.brush))throw Error('Choose a brush from the toolbar.');
 if(line.opacity!==undefined&&(!Number.isFinite(line.opacity)||line.opacity<.05||line.opacity>1))throw Error('Brush opacity must be 5–100%.');
 if(line.color2!==undefined&&!/^#[a-fA-F0-9]{6}$/.test(line.color2))throw Error('Choose a valid second color.');
 if(line.gradient!==undefined&&typeof line.gradient!=='boolean')throw Error('Choose a valid color mode.');
 if(line.blend!==undefined&&!['normal','multiply','screen'].includes(line.blend))throw Error('Choose a supported blending mode.');
 return {color:line.color,size:line.size,...(line.brush?{brush:line.brush as Brush}:{}),...(line.opacity!==undefined?{opacity:Math.round(line.opacity*1000)/1000}:{}),...(line.color2?{color2:line.color2}:{}),...(line.gradient!==undefined?{gradient:line.gradient}:{}),...(line.blend?{blend:line.blend as InkStroke['blend']}:{})};
}
/** The editor, received drawings, albums and PNG export use this exact renderer. */
export function paintStroke(c:CanvasRenderingContext2D,s:InkStroke){
 if(!s.points.length)return;c.save();const brush=s.brush||'round',erase=brush==='eraser';
 c.globalAlpha=(s.opacity??1)*(brush==='pencil'?.75:1);c.globalCompositeOperation=erase?'source-over':s.blend==='multiply'?'multiply':s.blend==='screen'?'screen':'source-over';
 c.lineCap=brush==='marker'||brush==='calligraphy'?'square':'round';c.lineJoin='round';c.lineWidth=brush==='pencil'?Math.max(1,s.size*.5):s.size;c.strokeStyle=erase?'#ffffff':s.color;
 if(!erase&&s.gradient&&s.color2){const a=s.points[0],b=s.points.at(-1)!,end=Math.hypot(a[0]-b[0],a[1]-b[1])>.001?b:[Math.min(1,a[0]+.12),Math.min(1,a[1]+.12)];const gradient=c.createLinearGradient(a[0]*640,a[1]*480,end[0]*640,end[1]*480);gradient.addColorStop(0,s.color);gradient.addColorStop(1,s.color2);c.strokeStyle=gradient}
 if(brush==='soft')c.filter='blur('+Math.max(.5,s.size*.13)+'px)';
 if(brush==='calligraphy'){
  c.fillStyle=c.strokeStyle;const dx=s.size*.4,dy=s.size*.16;c.beginPath();
  if(s.points.length===1){const p=s.points[0];c.moveTo(p[0]*640-dx,p[1]*480-dy);c.lineTo(p[0]*640+dx,p[1]*480-dy);c.lineTo(p[0]*640+dx,p[1]*480+dy);c.lineTo(p[0]*640-dx,p[1]*480+dy)}
  else{for(let i=0;i<s.points.length;i++){const p=s.points[i];i?c.lineTo(p[0]*640-dx,p[1]*480-dy):c.moveTo(p[0]*640-dx,p[1]*480-dy)}for(let i=s.points.length-1;i>=0;i--){const p=s.points[i];c.lineTo(p[0]*640+dx,p[1]*480+dy)}}c.closePath();c.fill();
 }
 else{c.beginPath();s.points.forEach((p,i)=>i?c.lineTo(p[0]*640,p[1]*480):c.moveTo(p[0]*640,p[1]*480));if(s.points.length===1)c.lineTo(s.points[0][0]*640+.01,s.points[0][1]*480);c.stroke()}
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
