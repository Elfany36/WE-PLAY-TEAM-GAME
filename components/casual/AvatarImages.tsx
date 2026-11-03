'use client';
import {createContext,useContext,useEffect,useState,useRef,type ReactNode} from 'react';
import type {CasualPublic} from '../../lib/casual/engine';
const Avatars=createContext<Record<string,string>>({});
export function useAvatar(id?:string){return useContext(Avatars)[id||'']}
/** Image data stays out of world snapshots; fetch once per version and revoke on replacement. */
export default function AvatarImages({room,endpoint,token,localImage,localPortraits,children}:{room:CasualPublic|null;endpoint:string;token?:string;localImage?:string;localPortraits?:Record<string,string>;children:ReactNode}){
 const [images,setImages]=useState<Record<string,string>>({}),cache=useRef(new Map<string,{url?:string;controller:AbortController;request?:Promise<string|undefined>}>());
 const roomCode=room?.code;
 const versions=JSON.stringify(room?.players.filter(p=>!p.retired&&p.appearance?.avatar).map(p=>[p.id,p.appearance!.avatar])||[]);
 useEffect(()=>{const entries=cache.current;return()=>{for(const entry of entries.values()){entry.controller.abort();if(entry.url)URL.revokeObjectURL(entry.url)}entries.clear()}},[roomCode,endpoint,token]);
 useEffect(()=>{
  if(!roomCode||!token)return;let stopped=false;const pairs=JSON.parse(versions) as [string,string][],wanted=new Set(pairs.map(([,hash])=>hash));
  for(const [hash,entry]of cache.current)if(!wanted.has(hash)){entry.controller.abort();if(entry.url)URL.revokeObjectURL(entry.url);cache.current.delete(hash)}
  void Promise.all(pairs.map(async([id,hash])=>{
   let entry=cache.current.get(hash);if(!entry){entry={controller:new AbortController()};cache.current.set(hash,entry);const current=entry;
    current.request=(async()=>{for(let attempt=0;attempt<3;attempt++){try{const response=await fetch(endpoint+'?code='+roomCode+'&avatar='+hash,{headers:{Authorization:'Bearer '+token},signal:current.controller.signal});if(response.ok){const blob=await response.blob();if(current.controller.signal.aborted)return;current.url=URL.createObjectURL(blob);return current.url}if(response.status===401||response.status===410)return}catch{if(current.controller.signal.aborted)return}await new Promise(resolve=>setTimeout(resolve,300*(attempt+1)))}return undefined})();
   }const url=entry.url||await entry.request;return url?[id,url] as const:null;
  })).then(rows=>{if(!stopped)setImages(Object.fromEntries(rows.filter((r):r is readonly [string,string]=>!!r)))});
  return()=>{stopped=true};
 },[roomCode,endpoint,token,versions]);
 const local=room?.code==='ONDEVICE'&&localImage?{...images,'local-0':localImage,...localPortraits}:room?.code==='ONDEVICE'?{...images,...localPortraits}:images;
 return <Avatars.Provider value={local}>{children}</Avatars.Provider>;
}
export async function cropAvatar(file:File){
 if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>8*1024*1024)throw Error('Choose a PNG, JPEG or WebP image under 8 MB.');
 const image=await createImageBitmap(file);try{const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const c=canvas.getContext('2d')!,side=Math.min(image.width,image.height);if(!side)throw Error('This image could not be read.');c.drawImage(image,(image.width-side)/2,(image.height-side)/2,side,side,0,0,128,128);return canvas.toDataURL('image/png')}finally{image.close()}
}
