import {MEMORY_ART} from './casual/rules';
const decoded=new Map<string,Promise<boolean>>();
export const memoryArtUrl=(kind:number)=>'game-art/memory/'+MEMORY_ART[(kind-32)%MEMORY_ART.length]+'.svg';
export function decodeMemoryArt(src:string){let ready=decoded.get(src);if(!ready){ready=new Promise<boolean>(resolve=>{const image=new Image();image.onload=()=>{void image.decode().catch(()=>{}).then(()=>resolve(image.naturalWidth>0))};image.onerror=()=>resolve(false);image.src=src});decoded.set(src,ready)}return ready}
let warming=false;
/** Four small decodes at a time; loading art never reveals hidden deck positions. */
export function warmMemoryArt(){if(typeof Image==='undefined'||warming)return;warming=true;let index=0;const work=async()=>{while(index<MEMORY_ART.length){const i=index++;await decodeMemoryArt(memoryArtUrl(i+32));await new Promise(resolve=>setTimeout(resolve,12))}};void Promise.all(Array.from({length:4},work))}
