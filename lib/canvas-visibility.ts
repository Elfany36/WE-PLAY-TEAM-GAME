/** Stop painting hidden/offscreen arenas and rebuild disposable art after context recovery. */
export function watchCanvas(canvas:HTMLCanvasElement,restore:()=>void){
 let visible=true,lost=false;
 const observer=typeof IntersectionObserver==='undefined'?null:new IntersectionObserver(entries=>{visible=entries.some(e=>e.isIntersecting)},{rootMargin:'160px'});
 observer?.observe(canvas);
 const onLost=(event:Event)=>{event.preventDefault();lost=true};
 const onRestore=()=>{lost=false;restore()};
 canvas.addEventListener('contextlost',onLost);canvas.addEventListener('contextrestored',onRestore);
 return{ready:()=>visible&&!lost&&!document.hidden,dispose:()=>{observer?.disconnect();canvas.removeEventListener('contextlost',onLost);canvas.removeEventListener('contextrestored',onRestore)}};
}
