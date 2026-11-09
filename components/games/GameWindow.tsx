'use client';
import {createContext,useCallback,useContext,useEffect,useId,useMemo,useRef,useState,type CSSProperties,type ReactNode} from 'react';
import {ArrowLeft,Eye,EyeOff,Gamepad2,MessageCircle,Settings2,Trophy,X,BookOpen} from 'lucide-react';
import {clampGamePanel,type GamePanelBox} from '../../lib/game-window';
type Panel='players'|'chat'|'guide';
type Panels=Record<Panel,boolean>;
type WindowView={
 active:boolean;menu:boolean;hud:boolean;controls:boolean;panels:Panels;boxes:Partial<Record<Panel,GamePanelBox>>;settingsTarget:HTMLDivElement|null;
 enter:()=>void;exit:()=>void;showPanel:(id:Panel,show:boolean)=>void;movePanel:(id:Panel,box:GamePanelBox)=>void;
};
const GameWindowContext=createContext<WindowView|null>(null);
export const useGameWindow=()=>useContext(GameWindowContext);

/** Fullscreen changes presentation only: the game, seat and normal layout stay mounted. */
export default function GameWindow({children,label='Game',status,actions,menuContent,panels=false,available=true,scopeKey='',className='',style}: {
 children:ReactNode;label?:string;status?:ReactNode;actions?:ReactNode;menuContent?:ReactNode;panels?:boolean;available?:boolean;scopeKey?:string;className?:string;style?:CSSProperties;
}){
 const root=useRef<HTMLDivElement>(null),native=useRef(false),activeRef=useRef(false),menuRef=useRef(false),previousFocus=useRef<HTMLElement|null>(null),title=useId();
 const [active,setActive]=useState(false),[menu,setMenu]=useState(false),[hud,setHud]=useState(true),[controls,setControls]=useState(false),[visible,setVisible]=useState<Panels>({players:false,chat:false,guide:false}),[boxes,setBoxes]=useState<Partial<Record<Panel,GamePanelBox>>>({}),[settingsTarget,setSettingsTarget]=useState<HTMLDivElement|null>(null);
 activeRef.current=active;
 menuRef.current=menu;
 const focusGame=useCallback(()=>{const node=root.current;if(!node)return;const target=node.querySelector<HTMLElement>('canvas[tabindex],.sol-playfield button,.generals-cell[tabindex="0"],.fleet-tile[tabindex="0"],.memory-tile:not(:disabled),.answer-card input:not(:disabled),button[data-game-action]');(target||node).focus({preventScroll:true})},[]);
 const exit=useCallback(()=>{
  activeRef.current=false;setActive(false);setMenu(false);window.dispatchEvent(new Event('blur'));
  if(document.fullscreenElement===root.current)void document.exitFullscreen().catch(()=>{});
 },[]);
 const enter=useCallback(()=>{
  const node=root.current;if(!node||activeRef.current||!available)return;
  previousFocus.current=document.activeElement instanceof HTMLElement?document.activeElement:null;
  window.dispatchEvent(new Event('blur'));activeRef.current=true;setActive(true);setMenu(false);setHud(true);setControls(false);
  setVisible({players:panels&&innerWidth>=1000,chat:panels&&innerWidth>=1200,guide:false});
  // Embedded browsers can decline native fullscreen; the same window still fills its viewport.
  if(node.requestFullscreen)void node.requestFullscreen({navigationUI:'hide'}).then(()=>{
   if(!activeRef.current&&document.fullscreenElement===node)void document.exitFullscreen().catch(()=>{});
  }).catch(()=>{});
 },[available,panels]);
 const showPanel=useCallback((id:Panel,show:boolean)=>{setVisible(p=>({...p,[id]:show}));requestAnimationFrame(()=>{const input=id==='chat'&&show?root.current?.querySelector<HTMLElement>('.dock-panel-chat textarea,.dock-panel-chat input:not([type=range])'):null;if(input)input.focus({preventScroll:true});else focusGame()})},[focusGame]);
 const movePanel=useCallback((id:Panel,box:GamePanelBox)=>{const node=root.current;if(node)setBoxes(p=>({...p,[id]:clampGamePanel(box,node.clientWidth,node.clientHeight)}))},[]);
 useEffect(()=>{const changed=()=>{if(document.fullscreenElement===root.current)native.current=true;else if(native.current){native.current=false;activeRef.current=false;setActive(false);setMenu(false)}};document.addEventListener('fullscreenchange',changed);return()=>{document.removeEventListener('fullscreenchange',changed);if(document.fullscreenElement===root.current)void document.exitFullscreen().catch(()=>{})}},[]);
 useEffect(()=>{if(!available)exit()},[available,exit]);
 useEffect(()=>{exit()},[scopeKey,exit]);
 useEffect(()=>{
  if(!active)return;const node=root.current!;const scroll={x:scrollX,y:scrollY},overflow=document.body.style.overflow,prior=document.body.dataset.gameWindow,priorRoot=document.documentElement.dataset.gameWindow;
  document.body.dataset.gameWindow='open';document.documentElement.dataset.gameWindow='open';document.body.style.overflow='hidden';
  const outside=new Map<HTMLElement,boolean>();for(let branch:HTMLElement|null=node;branch?.parentElement&&branch!==document.body;branch=branch.parentElement)for(const sibling of branch.parentElement.children)if(sibling!==branch&&sibling instanceof HTMLElement&&!['SCRIPT','STYLE','LINK'].includes(sibling.tagName)){outside.set(sibling,sibling.inert);sibling.inert=true}
  const frame=requestAnimationFrame(focusGame);
  const key=(event:KeyboardEvent)=>{
   if(event.defaultPrevented||event.isComposing||document.querySelector('dialog[open]'))return;
   if(event.key==='Escape'){event.preventDefault();if(menuRef.current)setMenu(false);else exit();return}
   if(event.key!=='Tab')return;
   const items=Array.from(node.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],input:not(:disabled),textarea:not(:disabled),select:not(:disabled),[tabindex="0"]')).filter(el=>!el.closest('[inert],[hidden]')&&el.getClientRects().length>0);
   if(!items.length){event.preventDefault();node.focus();return}const first=items[0],last=items.at(-1)!;
   if(event.shiftKey&&(document.activeElement===first||document.activeElement===node)){event.preventDefault();last.focus()}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}
  };
  const resize=()=>setBoxes(old=>Object.fromEntries(Object.entries(old).map(([id,box])=>[id,clampGamePanel(box!,node.clientWidth,node.clientHeight)])));
  document.addEventListener('keydown',key);window.addEventListener('resize',resize);window.visualViewport?.addEventListener('resize',resize);
  return()=>{cancelAnimationFrame(frame);document.removeEventListener('keydown',key);window.removeEventListener('resize',resize);window.visualViewport?.removeEventListener('resize',resize);document.body.style.overflow=overflow;if(prior===undefined)delete document.body.dataset.gameWindow;else document.body.dataset.gameWindow=prior;if(priorRoot===undefined)delete document.documentElement.dataset.gameWindow;else document.documentElement.dataset.gameWindow=priorRoot;for(const [el,inert]of outside)el.inert=inert;requestAnimationFrame(()=>{if(activeRef.current||!node.isConnected)return;if(previousFocus.current?.isConnected)previousFocus.current.focus({preventScroll:true});window.scrollTo(scroll.x,scroll.y)})};
 },[active,exit,focusGame]);
 useEffect(()=>{if(!active)return;if(menu)root.current?.querySelector<HTMLElement>('.game-window-menu header button')?.focus({preventScroll:true});else focusGame()},[active,menu,focusGame]);
 const value=useMemo<WindowView>(()=>({active,menu,hud,controls,panels:visible,boxes,settingsTarget,enter,exit,showPanel,movePanel}),[active,menu,hud,controls,visible,boxes,settingsTarget,enter,exit,showPanel,movePanel]);
 return <GameWindowContext.Provider value={value}><div ref={root} className={className+(active?' is-immersive':'')} style={style} tabIndex={active?-1:undefined} role={active?'dialog':undefined} aria-modal={active?true:undefined} aria-labelledby={active?title:undefined} data-game-hud={hud?'shown':'hidden'} data-game-controls={controls?'shown':'hidden'} data-game-panels={panels?'available':undefined}>
  {active&&<><div className="game-window-bar"><div className="game-window-title"><Gamepad2 size={19}/><div><strong id={title}>{label}</strong>{hud&&status&&<span className="game-window-status" role="status">{status}</span>}</div></div><div className="game-window-actions" onPointerDown={e=>{if((e.target as HTMLElement).closest('button'))e.preventDefault()}}>
   {actions}<button type="button" onClick={()=>{setHud(v=>!v);focusGame()}} aria-label={hud?'Hide HUD':'Show HUD'} aria-pressed={hud} title={hud?'Hide HUD':'Show HUD'}>{hud?<Eye size={18}/>:<EyeOff size={18}/>}</button>
   {panels&&<><button type="button" onClick={()=>showPanel('players',!visible.players)} aria-label={visible.players?'Hide leaderboard':'Show leaderboard'} aria-pressed={visible.players} title="Leaderboard"><Trophy size={18}/></button><button type="button" onClick={()=>showPanel('chat',!visible.chat)} aria-label={visible.chat?'Hide chat':'Show chat'} aria-pressed={visible.chat} title="Chat"><MessageCircle size={18}/></button></>}
   <button type="button" onClick={()=>{window.dispatchEvent(new Event('blur'));setMenu(v=>!v)}} aria-label={menu?'Hide game menu':'Open game menu'} aria-expanded={menu} title="Game menu"><Settings2 size={18}/></button><button type="button" onClick={exit} aria-label="Exit fullscreen" title="Return to website"><X size={20}/></button>
  </div></div>{menu&&<section className="game-window-menu" aria-label="Game menu" onKeyDown={e=>{if(e.key!=='Escape')e.stopPropagation()}}><header><h2>Game menu</h2><button type="button" aria-label="Close game menu" onClick={()=>setMenu(false)}><X size={18}/></button></header><label><input type="checkbox" checked={hud} onChange={e=>setHud(e.target.checked)}/>Show HUD</label><label><input type="checkbox" checked={controls} onChange={e=>setControls(e.target.checked)}/>Show game controls</label>{panels&&<button type="button" onClick={()=>{showPanel('guide',!visible.guide);setMenu(false)}}><BookOpen size={17}/>Rules & controls</button>}<button type="button" onClick={()=>{setHud(false);setVisible({players:false,chat:false,guide:false});setMenu(false)}}><EyeOff size={17}/>Hide all overlays</button>{menuContent&&<div className="game-window-room-options">{menuContent}</div>}<div ref={setSettingsTarget} className="game-window-settings-slot"/><button type="button" onClick={exit}><ArrowLeft size={17}/>Return to website</button></section>}</>}
  {children}
 </div></GameWindowContext.Provider>;
}
