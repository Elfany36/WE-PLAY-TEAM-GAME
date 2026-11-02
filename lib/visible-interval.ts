/** Foreground UI work should own no ticking timer while its document is hidden. */
export function visibleInterval(update:()=>void,ms:number){
 let timer:ReturnType<typeof setInterval>|undefined;
 const sync=()=>{
  clearInterval(timer);timer=undefined;
  if(!document.hidden){update();timer=setInterval(update,ms)}
 };
 document.addEventListener('visibilitychange',sync);sync();
 return()=>{clearInterval(timer);document.removeEventListener('visibilitychange',sync)};
}
