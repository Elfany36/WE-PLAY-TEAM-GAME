/** Stop painting hidden/offscreen arenas and rebuild disposable art after context recovery. */
export function watchCanvas(canvas:HTMLCanvasElement,restore:()=>void,changed:()=>void=()=>{}){
 let visible=true,lost=false;
 const observer=typeof IntersectionObserver==='undefined'?null:new IntersectionObserver(entries=>{visible=entries.some(e=>e.isIntersecting);changed()},{rootMargin:'160px'});
 observer?.observe(canvas);
 const onLost=(event:Event)=>{event.preventDefault();lost=true;changed()};
 const onRestore=()=>{lost=false;restore();changed()};
 canvas.addEventListener('contextlost',onLost);canvas.addEventListener('contextrestored',onRestore);
 document.addEventListener('visibilitychange',changed);
 return{ready:()=>visible&&!lost&&!document.hidden,dispose:()=>{observer?.disconnect();canvas.removeEventListener('contextlost',onLost);canvas.removeEventListener('contextrestored',onRestore);document.removeEventListener('visibilitychange',changed)}};
}

/** Suspend the loop itself, so an offscreen canvas consumes no animation callbacks. */
export function animateCanvas(canvas:HTMLCanvasElement,paint:FrameRequestCallback,restore:()=>void){
 let frame:number|null=null,disposed=false;
 const sync=()=>{
  if(disposed)return;
  if(!visibility.ready()){if(frame!==null)cancelAnimationFrame(frame);frame=null;return}
  if(frame===null)frame=requestAnimationFrame(draw);
 };
 const draw=(time:number)=>{frame=null;if(disposed||!visibility.ready())return;paint(time);sync()};
 const visibility=watchCanvas(canvas,restore,sync);
 sync();
 return{dispose:()=>{disposed=true;if(frame!==null)cancelAnimationFrame(frame);frame=null;visibility.dispose()}};
}
