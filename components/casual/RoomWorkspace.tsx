'use client';
import {createContext,useContext,useEffect,useMemo,useRef,useState,type ReactNode,type PointerEvent as ReactPointerEvent} from 'react';
import {Eye,EyeOff,Move,Maximize2,RotateCcw} from 'lucide-react';
import {readStored,writeStored} from '../../lib/client-state';
import {defaultPanelLayout,readPanelLayout,panelGrid,type PanelLayout,type PanelId,type DockSide} from '../../lib/casual/panel-layout';
const DockContext=createContext({layout:defaultPanelLayout,collapsed:{} as Partial<Record<PanelId,boolean>>,collapse:(_id:PanelId,_hidden:boolean)=>{},update:(_id:PanelId,_patch:Partial<PanelLayout[PanelId]>)=>{}});
export default function RoomWorkspace({children}:{children:ReactNode}){
 const [layout,setLayout]=useState(defaultPanelLayout),[collapsed,setCollapsed]=useState<Partial<Record<PanelId,boolean>>>({guide:true}),[width,setWidth]=useState(0),root=useRef<HTMLDivElement>(null);
 useEffect(()=>{setLayout(readPanelLayout(readStored('markup-panel-layout-v19',null)));const node=root.current!;const observer=new ResizeObserver(([e])=>setWidth(w=>Math.abs(w-e.contentRect.width)>1?e.contentRect.width:w));observer.observe(node);return()=>observer.disconnect()},[]);
 const value=useMemo(()=>({layout,collapsed,collapse:(id:PanelId,hidden:boolean)=>setCollapsed(p=>({...p,[id]:hidden})),update:(id:PanelId,patch:Partial<PanelLayout[PanelId]>)=>setLayout(previous=>{const next=readPanelLayout({...previous,[id]:{...previous[id],...patch}});writeStored('markup-panel-layout-v19',next);return next})}),[layout,collapsed]);
 return <DockContext.Provider value={value}><div ref={root} className="room-shell room-workspace" style={{...panelGrid(layout,width,collapsed),'--dock-columns':panelGrid(layout,width,collapsed).gridTemplateColumns} as React.CSSProperties}>{children}</div></DockContext.Provider>;
}
export function DockPanel({id,title,icon,children}:{id:PanelId;title:string;icon:ReactNode;children:ReactNode}){
 const {layout,update,collapsed,collapse}=useContext(DockContext),p=layout[id],hidden=!!collapsed[id],[tools,setTools]=useState(false),root=useRef<HTMLElement>(null),cleanup=useRef(()=>{});
 useEffect(()=>()=>cleanup.current(),[]);
 function resize(e:ReactPointerEvent<HTMLButtonElement>){
  e.preventDefault();cleanup.current();const box=root.current!.getBoundingClientRect(),start={x:e.clientX,y:e.clientY,width:box.width,height:box.height};let frame=0,next={width:p.width,height:p.height};
  const apply=()=>{frame=0;update(id,next)};
  const move=(event:PointerEvent)=>{next={width:start.width+(p.side==='right'?-1:1)*(event.clientX-start.x),height:start.height+event.clientY-start.y};if(!frame)frame=requestAnimationFrame(apply)};
  const stop=()=>{if(frame){cancelAnimationFrame(frame);apply()}window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',stop);window.removeEventListener('pointercancel',stop)};
  window.addEventListener('pointermove',move);window.addEventListener('pointerup',stop);window.addEventListener('pointercancel',stop);cleanup.current=stop;
 }
 return <aside ref={root} className={'dock-panel dock-panel-'+id+(hidden?' is-collapsed':'')} aria-label={title+' panel'} data-dock={p.side} style={{gridArea:id,height:hidden?'auto':p.height,width:p.side==='above'||p.side==='below'?p.width:'100%'}} onKeyDown={e=>e.stopPropagation()}>
  <header className="dock-panel-header"><strong>{icon}{title}</strong><div><button aria-label={'Move or resize '+title.toLowerCase()} aria-expanded={tools} onClick={()=>{if(hidden)collapse(id,false);setTools(!tools)}}><Move size={15}/></button><button aria-label={(hidden?'Show ':'Hide ')+title.toLowerCase()} aria-expanded={!hidden} onClick={()=>{collapse(id,!hidden);setTools(false)}}>{hidden?<Eye size={15}/>:<EyeOff size={15}/>}<span>{hidden?'Show':'Hide'}</span></button></div></header>
  {tools&&<div className="dock-panel-tools"><label>Position<select aria-label={title+' position'} value={p.side} onChange={e=>update(id,{side:e.target.value as DockSide})}>{(['right','left','above','below'] as const).map(side=><option key={side} value={side}>{side[0].toUpperCase()+side.slice(1)} game</option>)}</select></label><label>Width<input aria-label={title+' width'} type="range" min={260} max={480} step={10} value={p.width} onChange={e=>update(id,{width:+e.target.value})}/></label><label>Height<input aria-label={title+' height'} type="range" min={220} max={800} step={10} value={p.height} onChange={e=>update(id,{height:+e.target.value})}/></label><button aria-label={'Reset '+title.toLowerCase()+' panel'} onClick={()=>update(id,defaultPanelLayout[id])}><RotateCcw size={14}/>Reset</button></div>}
  <div className="dock-panel-content" hidden={hidden}>{children}</div>
  {!hidden&&<button className="dock-resize" aria-label={'Resize '+title.toLowerCase()+' panel'} onPointerDown={resize} onKeyDown={e=>{if(!e.key.startsWith('Arrow'))return;e.preventDefault();update(id,{width:p.width+(e.key==='ArrowRight'?20:e.key==='ArrowLeft'?-20:0),height:p.height+(e.key==='ArrowDown'?20:e.key==='ArrowUp'?-20:0)})}}><Maximize2 size={14}/></button>}
 </aside>;
}
