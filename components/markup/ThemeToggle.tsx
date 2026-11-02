'use client';
import {useEffect,useRef,useState,type CSSProperties} from 'react';
import {Sun,Moon,Palette,Check,X} from 'lucide-react';
import {readStored,writeStored} from '../../lib/client-state';
import {WEBSITE_THEMES,websiteTheme,type WebsiteTheme} from '../../lib/website-themes';
export default function ThemeToggle(){
 const [theme,setTheme]=useState<'light'|'dark'>('light'),[palette,setPalette]=useState<WebsiteTheme>('indigo'),[notice,setNotice]=useState(''),dialog=useRef<HTMLDialogElement>(null);
 useEffect(()=>{
  const sync=()=>{const saved=readStored('markup-theme'),tone=saved==='dark'||saved==='light'?saved:matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light',next=websiteTheme(readStored('markup-site-theme'));setTheme(tone);setPalette(next);document.documentElement.dataset.theme=tone;document.documentElement.setAttribute('data-site-theme',next)};
  sync();const update=(e:StorageEvent)=>{if(e.key==='markup-theme'||e.key==='markup-site-theme'||e.key===null)sync()};window.addEventListener('storage',update);return()=>window.removeEventListener('storage',update);
 },[]);
 function choose(next:WebsiteTheme){setPalette(next);document.documentElement.setAttribute('data-site-theme',next);setNotice(writeStored('markup-site-theme',next)?'Theme saved on this device.':'Theme applied. Browser storage is unavailable, so it may reset after reloading.')}
 function toggle(){const next=theme==='light'?'dark':'light';setTheme(next);document.documentElement.setAttribute('data-theme',next);writeStored('markup-theme',next)}
 return <div className="theme-controls"><button className="theme-toggle" aria-label={theme==='light'?'Switch to dark mode':'Switch to light mode'} aria-pressed={theme==='dark'} onClick={toggle}>{theme==='light'?<Moon size={18}/>:<Sun size={18}/>}<span>{theme==='light'?'Dark':'Light'}</span></button><button className="theme-toggle theme-picker-open" aria-label="Choose website theme" onClick={()=>dialog.current?.showModal()}><Palette size={18}/><span>Themes</span></button>
  <dialog ref={dialog} className="website-theme-dialog" aria-labelledby="website-theme-title" onClick={e=>{if(e.target===dialog.current){const r=e.currentTarget.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.current?.close()}}}>
   <header><div><small>MAKE IT YOURS</small><h2 id="website-theme-title">Choose your atmosphere</h2><p>Ten palettes. Your choice stays with this browser.</p></div><button className="theme-dialog-close" aria-label="Close themes" onClick={()=>dialog.current?.close()}><X size={20}/></button></header>
   <div className="website-theme-grid">{WEBSITE_THEMES.map(item=><button key={item.id} className={'website-theme-card '+(palette===item.id?'is-selected':'')} aria-pressed={palette===item.id} onClick={()=>choose(item.id)} style={{'--preview-accent':item.accent,'--preview-bg':item.background} as CSSProperties}><span className="website-theme-preview" aria-hidden="true"><i/><b/><em/><span>{palette===item.id&&<Check size={18}/>}</span></span><strong>{item.name}</strong><small>{item.description}</small></button>)}</div>
   <footer><button className="button outline" onClick={toggle}>{theme==='dark'?<Sun size={17}/>:<Moon size={17}/>}Use {theme==='dark'?'light':'dark'} appearance</button><button className="button dark" onClick={()=>dialog.current?.close()}>Done</button></footer><p className="theme-save-note" role="status">{notice}</p>
  </dialog></div>;
}
