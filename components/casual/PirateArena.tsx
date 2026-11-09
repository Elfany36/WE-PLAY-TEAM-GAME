'use client';
import {useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {useGameWindow} from '../games/GameWindow';
import {ArrowLeft,ArrowRight,ArrowDown,ArrowUp,Bomb,Swords,Zap,Heart,SlidersHorizontal,RotateCcw,Volume2,VolumeX,Pause,Play,Gamepad2} from 'lucide-react';
import type {CasualPublic} from '../../lib/casual/engine';
import type {publicPirate} from '../../lib/casual/pirate';
import {PIRATE_MAPS,PIRATE_MODES,PIRATE_SKILLS} from '../../lib/casual/pirate-data';
import {pirateDisplay,piratePixelRatio,PirateAutoQuality,type PirateDisplay} from '../../lib/casual/pirate-display';
import {createPirateRenderer,loadPirateArt} from '../../lib/casual/pirate-renderer.js';
import {piratePresentation} from '../../lib/casual/pirate-presentation';
import {controlAction,controlBindings,controlHint} from '../../lib/player-controls';
import {readStored,writeStored} from '../../lib/client-state';
import {animateCanvas} from '../../lib/canvas-visibility';
import {controlHeartbeat} from '../../lib/control-channel';
import CharacterModel from './CharacterModel';
import ControlsPicker from './ControlsPicker';
type Game=ReturnType<typeof publicPirate>;
type Action='left'|'right'|'down'|'jump'|'attack'|'special'|'dash';
type Held=Partial<Record<Action,Set<string>>>;
const edgeNames={jump:'jumpSeq',attack:'attackSeq',special:'specialSeq',dash:'dashSeq'} as const;
const frameKeys=['left','right','down','jump','attack','special','dash'] as const;
const preferenceKey='markup-pirate-display-v31';
export default function PirateArena({room,local,enabled=true,onControl,onAction,muted,onMute}:{room:CasualPublic;local:boolean;enabled?:boolean;onControl:(packet:Record<string,unknown>)=>void;onAction:(action:string)=>unknown;muted:boolean;onMute:()=>void}){
 const gameWindow=useGameWindow(),immersiveRef=useRef(false);immersiveRef.current=!!gameWindow?.active;
 const game=room.game as Game,spectating=room.players.some(p=>p.isYou&&p.role==='spectator'),humans=room.players.filter(p=>!p.bot&&!p.retired&&p.role!=='spectator');
 const previous=useRef<Game['world']|null>(null),snapshotSpan=useRef(50);
 const canvas=useRef<HTMLCanvasElement>(null),painter=useRef<ReturnType<typeof createPirateRenderer>|null>(null),latest=useRef({room,enabled,onControl,local,received:performance.now()}),held=useRef(new Map<string,Held>()),edges=useRef(new Map<string,Record<string,number>>()),sequence=useRef(0),sent=useRef(new Map<string,number>()),aim=useRef<{id:string;x:number;y:number}|null>(null),pressedKeys=useRef(new Map<string,{id:string;action:Action}>()),padAssignments=useRef(new Map<string,number>());
 const [display,setDisplay]=useState<PirateDisplay>(()=>pirateDisplay({camera:spectating||local&&humans.length>1?'action':'follow'})),displayRef=useRef(display),[seat,setSeat]=useState(humans[0]?.id||room.youId),seatRef=useRef(seat),[loaded,setLoaded]=useState(false),[failure,setFailure]=useState(''),[retry,setRetry]=useState(0),[now,setNow]=useState(room.serverNow),[focused,setFocused]=useState(false),[gamepads,setGamepads]=useState(0);
 if((latest.current.room.game as Game)?.world.tick!==game.world.tick){const prior=latest.current.room.game as Game;previous.current=prior.world;snapshotSpan.current=Math.max(16,Math.min(150,game.lastTickAt-prior.lastTickAt));latest.current.received=performance.now()}
 latest.current={...latest.current,room,enabled,onControl,local};displayRef.current=display;seatRef.current=seat;
 const active=room.phase==='playing'&&enabled&&!spectating,own=game.world.fighters.find(f=>f.id===(local?seat:room.youId)),map=PIRATE_MAPS.find(m=>m.id===game.world.map)!,variant=PIRATE_MODES.find(m=>m.id===game.world.variant)!,canResume=(room as {canResume?:boolean}).canResume||room.hostId===room.youId;
 useEffect(()=>{const saved=readStored(preferenceKey);if(saved)setDisplay(pirateDisplay(saved));const clock=setInterval(()=>setNow(latest.current.room.serverNow+Math.max(0,performance.now()-latest.current.received)),250);return()=>clearInterval(clock)},[]);
 function preference(patch:Partial<PirateDisplay>){setDisplay(old=>{const next=pirateDisplay({...old,...patch});writeStored(preferenceKey,next);return next})}
 function controls(id:string){let value=held.current.get(id);if(!value){value={};held.current.set(id,value)}return value}
 function button(id:string,action:Action){return !!controls(id)[action]?.size}
 function send(id:string){
  const {room:r,enabled,onControl,local}=latest.current,g=r.game as Game,f=g.world.fighters.find(f=>f.id===id);
  if(!enabled||r.phase!=='playing'||!f||f.st<=0||f.dead||r.players.find(p=>p.id===id)?.bot)return;
  const seq=Math.max(Date.now(),sequence.current+1);sequence.current=seq;const edge=edges.current.get(id)||{},point=aim.current?.id===id?aim.current:null;
  sent.current.set(id,performance.now());onControl({action:'pirate-input',seq,life:f.life??0,dx:Number(button(id,'right'))-Number(button(id,'left')),down:button(id,'down'),jump:button(id,'jump'),attack:button(id,'attack'),special:button(id,'special'),dash:button(id,'dash'),jumpSeq:edge.jumpSeq||0,attackSeq:edge.attackSeq||0,specialSeq:edge.specialSeq||0,dashSeq:edge.dashSeq||0,...(point?{aimX:Math.max(-200,Math.min(map.w+200,point.x)),aimY:Math.max(-400,Math.min(map.h+200,point.y))}:{}),...(local?{localActor:id}:{})});
 }
 function press(id:string,action:Action,source:string,on:boolean){
  const r=latest.current.room,g=r.game as Game,f=g.world.fighters.find(f=>f.id===id);if(on&&(!latest.current.enabled||r.phase!=='playing'||!f||f.dead||f.st<=0))return;
  const keys=controls(id),set=keys[action]||(keys[action]=new Set()),before=set.size>0;if(on)set.add(source);else set.delete(source);if(before===!!set.size)return;
  if(on&&action in edgeNames){const next=Math.max(Date.now(),sequence.current+1);sequence.current=next;const prior=edges.current.get(id)||{};prior[edgeNames[action as keyof typeof edgeNames]]=next;edges.current.set(id,prior)}
  send(id);
 }
 function clear(){const ids=[...held.current.keys()];held.current.clear();pressedKeys.current.clear();aim.current=null;for(const id of ids)send(id)}
 useEffect(()=>{clear();edges.current.clear();padAssignments.current.clear();},[room.code,room.round,game.startAt,room.phase,enabled]);
 const lives=game.world.fighters.map(f=>f.id+':'+f.life+':'+f.dead+':'+f.st).join('|');
 useEffect(()=>{for(const f of game.world.fighters)if(f.dead||f.st<=0){held.current.delete(f.id);edges.current.delete(f.id);sent.current.delete(f.id);for(const [key,value]of pressedKeys.current)if(value.id===f.id)pressedKeys.current.delete(key)}},[lives]);
 useEffect(()=>{
  const down=(event:KeyboardEvent)=>{
   if(event.repeat||event.ctrlKey||event.metaKey||event.altKey||(event.target as HTMLElement)?.closest('input,textarea,select,button,a,dialog,[contenteditable=true]'))return;
   if(!(document.activeElement as HTMLElement)?.closest('.pirate-board'))return;
   const r=latest.current.room;if(controlAction(event,'pirate')==='pause'&&(r.phase==='playing'&&r.isHost||r.phase==='paused'&&r.canResume)){event.preventDefault();clear();onAction(r.phase==='paused'?'resume':'pause');return}const seats=local?r.players.filter(p=>!p.bot&&!p.retired&&p.role!=='spectator'):r.players.filter(p=>p.isYou&&p.role!=='spectator');
   for(let i=0;i<seats.length&&i<4;i++){
    const mode=i?'pirate-local-'+(i+1):'pirate';
    if(i===0&&local&&seats.length>1&&event.code.startsWith('Arrow')&&!Object.values(controlBindings(mode)).includes(event.code))continue;
    const action=controlAction(event,mode) as Action;if(!frameKeys.includes(action))continue;
    event.preventDefault();const key=event.code+':'+seats[i].id;pressedKeys.current.set(key,{id:seats[i].id,action});press(seats[i].id,action,'key:'+event.code,true);
   }
  };
  const up=(event:KeyboardEvent)=>{for(const [key,value]of pressedKeys.current)if(key.startsWith(event.code+':')){press(value.id,value.action,'key:'+event.code,false);pressedKeys.current.delete(key)}};
  const blur=()=>{clear();setFocused(false)},focus=(event:FocusEvent)=>{const target=event.target as HTMLElement;if(target.closest('input,textarea,select,dialog,[contenteditable=true]')||!target.closest('.pirate-board'))blur();else setFocused(true)},visibility=()=>{if(document.hidden)blur()};
  window.addEventListener('keydown',down);window.addEventListener('keyup',up);window.addEventListener('blur',blur);window.addEventListener('focusin',focus);document.addEventListener('visibilitychange',visibility);
  const heartbeat=setInterval(()=>{if(document.hidden)return;for(const [id,keys]of held.current)if(Object.values(keys).some(set=>set.size)&&performance.now()-(sent.current.get(id)||0)>=controlHeartbeat(latest.current.room.network?.totalRtt))send(id)},80);
  return()=>{clear();clearInterval(heartbeat);window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',blur);window.removeEventListener('focusin',focus);document.removeEventListener('visibilitychange',visibility)};
 },[room.code,room.round,game.startAt,local]);
 useEffect(()=>{
  let canceled=false,loop:ReturnType<typeof animateCanvas>|null=null,observer:ResizeObserver|null=null,last=0,lastPaint=0,lastGamepadCount=0;setLoaded(false);setFailure('');
  const element=canvas.current!;
  void loadPirateArt().then(art=>{
   if(canceled)return;const renderer=createPirateRenderer(element,art);painter.current=renderer;
   const automatic=new PirateAutoQuality();
   const resize=()=>{const width=element.clientWidth,height=immersiveRef.current?element.clientHeight:width*9/16;renderer.resize(width,piratePixelRatio(width,height,devicePixelRatio||1,displayRef.current.quality,automatic.pixels),immersiveRef.current?height:undefined)};resize();observer=new ResizeObserver(resize);observer.observe(element);setLoaded(true);
   if(document.activeElement===document.body&&!spectating)element.focus({preventScroll:true});
   let quality=displayRef.current.quality;
   loop=animateCanvas(element,time=>{
    const {room:r,received}=latest.current,g=r.game as Game,prefs=displayRef.current;
    const elapsed=Math.max(0,Math.min(1000,time-received)),server=r.serverNow+elapsed,frameMs=time-(last||time-16),dt=Math.min(80,frameMs);last=time;
    if(prefs.quality==='auto'&&r.phase==='playing'&&server>=g.startAt&&automatic.observe(frameMs,time))resize();
    if(quality!==prefs.quality){quality=prefs.quality;resize()}
    if((prefs.quality==='low'&&time-lastPaint<33)||r.phase!=='playing'&&time-lastPaint<250)return;lastPaint=time;
    const pads=navigator.getGamepads?.()||[],count=Array.from(pads).filter(Boolean).length;if(count!==lastGamepadCount){lastGamepadCount=count;setGamepads(count)}
    const seats=local?r.players.filter(p=>!p.bot&&!p.retired&&p.role!=='spectator'):r.players.filter(p=>p.isYou&&p.role!=='spectator');
    if(document.hasFocus()&&(document.activeElement as HTMLElement)?.closest('.pirate-board')&&!document.querySelector('dialog[open]'))for(let i=0;i<Math.min(4,seats.length);i++){
     const id=seats[i].id;let assigned=padAssignments.current.get(id);if(assigned===undefined||!pads[assigned]){const occupied=new Set(padAssignments.current.values()),next=Array.from(pads).findIndex((pad,index)=>!!pad&&!occupied.has(index));if(next>=0){assigned=next;padAssignments.current.set(id,next)}}const pad=assigned===undefined?null:pads[assigned],values:Record<Action,boolean>={left:!!pad&&(pad.axes[0]<-.35||!!pad.buttons[14]?.pressed),right:!!pad&&(pad.axes[0]>.35||!!pad.buttons[15]?.pressed),down:!!pad&&(pad.axes[1]>.6||!!pad.buttons[13]?.pressed),jump:!!pad&&(!!pad.buttons[0]?.pressed||!!pad.buttons[12]?.pressed),attack:!!pad&&(!!pad.buttons[2]?.pressed||!!pad.buttons[1]?.pressed),special:!!pad&&(!!pad.buttons[3]?.pressed||!!pad.buttons[5]?.pressed||!!pad.buttons[7]?.pressed),dash:!!pad&&(!!pad.buttons[4]?.pressed||!!pad.buttons[6]?.pressed)};
     for(const action of frameKeys)press(id,action,'pad:'+id,values[action]);
    }
    const focus=spectating?r.viewingId||g.currentId:local?seatRef.current:r.youId;
    const mix=Math.min(1,elapsed/snapshotSpan.current),prior=previous.current;
    let world={...g.world,fighters:g.world.fighters.map(f=>{const old=prior?.fighters.find(p=>p.id===f.id);if(!old||f.dead||old.dead||old.life!==f.life||Math.hypot(f.x-old.x,f.y-old.y)>180)return f;return{...f,x:old.x+(f.x-old.x)*mix,y:old.y+(f.y-old.y)*mix}})};
    if(latest.current.enabled&&r.phase==='playing'&&server>=g.startAt){
     const ids=new Set(local?seats.map(p=>p.id):[r.youId]);
     world={...world,fighters:world.fighters.map(f=>{if(!ids.has(f.id))return f;const actor=g.world.fighters.find(a=>a.id===f.id)!,edge=edges.current.get(f.id)||{},age=Math.min(local?50:100,elapsed+(local?0:Math.max(0,(r.network?.rtt||0)/2)));const predicted=piratePresentation(actor,world.map,{dx:Number(button(actor.id,'right'))-Number(button(actor.id,'left')),jump:(edge.jumpSeq||0)>(actor.jumpSeq||0),jumpHeld:button(actor.id,'jump')},age);return !variant.nm&&(edge.attackSeq||0)>(actor.attackSeq||0)?{...predicted,at:Math.max(predicted.at,20)}:predicted})};
    }
    try{renderer.render(world,{effects:prefs.effects&&!matchMedia('(prefers-reduced-motion: reduce)').matches,shake:prefs.shake,camera:prefs.camera,focusId:focus,ownId:spectating?'':r.youId,countdown:Math.max(0,(g.startAt-server)/(1000/60)),paused:r.phase==='paused',finished:r.phase==='finished'},dt)}catch(error){loop?.dispose();setFailure(error instanceof Error?error.message:'The arena could not draw.')} 
   },()=>{renderer.dispose();resize()});
  }).catch(error=>{if(!canceled)setFailure(error instanceof Error?error.message:'The crew art could not load.')});
  return()=>{canceled=true;loop?.dispose();observer?.disconnect();painter.current?.dispose();painter.current=null};
 },[room.code,room.round,retry,local,spectating]);
 useEffect(()=>{
  if(muted||room.phase!=='playing')return;const audio=new Audio('pirate-brawl/audio/battle.ogg');audio.loop=true;audio.volume=.3;
  const sync=()=>{if(document.hidden)audio.pause();else void audio.play().catch(()=>{})};sync();document.addEventListener('visibilitychange',sync);
  return()=>{document.removeEventListener('visibilitychange',sync);audio.pause();audio.removeAttribute('src');audio.load()};
 },[muted,room.phase,room.code]);
 function pointer(event:React.PointerEvent<HTMLCanvasElement>,down?:boolean){
  if(event.pointerType==='touch'||!active)return;const id=local?seatRef.current:room.youId,point=painter.current?.point(event.clientX,event.clientY);if(point)aim.current={id,...point};
  if(down!==undefined){event.preventDefault();event.currentTarget.focus({preventScroll:true});if(down)event.currentTarget.setPointerCapture(event.pointerId);press(id,event.button===2?'special':'attack','pointer:'+event.button,down)}
 }
 function touch(action:Action){const id=local?seat:room.youId;return{onPointerDown:(e:React.PointerEvent<HTMLButtonElement>)=>{e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);canvas.current?.focus({preventScroll:true});press(id,action,'touch:'+action+':'+e.pointerId,true)},onPointerUp:(e:React.PointerEvent)=>press(id,action,'touch:'+action+':'+e.pointerId,false),onPointerCancel:(e:React.PointerEvent)=>press(id,action,'touch:'+action+':'+e.pointerId,false),onLostPointerCapture:(e:React.PointerEvent)=>press(id,action,'touch:'+action+':'+e.pointerId,false),onClick:(e:React.MouseEvent)=>{if(e.detail===0){press(id,action,'accessible',true);press(id,action,'accessible',false)}}}}
 const settings=<details className="pirate-settings" open={gameWindow?.active?true:undefined}><summary><SlidersHorizontal size={16}/>View & audio<span>{gamepads>0?<><Gamepad2 size={14}/>{gamepads}</>:null}</span></summary><div className="pirate-settings-grid"><label>Camera<select aria-label="Pirate camera" value={display.camera} onChange={e=>preference({camera:e.target.value as PirateDisplay['camera']})}><option value="follow">Follow selected player</option><option value="action">Follow the action</option><option value="arena">Whole arena</option></select></label><label>Graphics<select aria-label="Pirate graphics quality" value={display.quality} onChange={e=>preference({quality:e.target.value as PirateDisplay['quality']})}><option value="auto">Auto</option><option value="high">High detail</option><option value="low">Lightweight</option></select></label><label className="pirate-check"><input type="checkbox" checked={display.effects} onChange={e=>preference({effects:e.target.checked})}/>Magic effects</label><label className="pirate-check"><input type="checkbox" checked={display.shake} onChange={e=>preference({shake:e.target.checked})}/>Camera shake</label><label className="pirate-check"><input type="checkbox" checked={display.touch} onChange={e=>preference({touch:e.target.checked})}/>On-screen controls</label><button type="button" className="button outline" onClick={onMute}>{muted?<VolumeX size={16}/>:<Volume2 size={16}/>}Music {muted?'off':'on'}</button><button type="button" className="button outline" onClick={()=>{clear();setDisplay(pirateDisplay({camera:spectating||local&&humans.length>1?'action':'follow'}));writeStored(preferenceKey,null)}}><RotateCcw size={15}/>Reset view</button></div>{local&&humans.length>1&&<div className="pirate-local-settings"><label>Touch player<select aria-label="Pirate touch player" value={seat} onChange={e=>{clear();setSeat(e.target.value)}}>{humans.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>{humans.slice(1,4).map((p,i)=><div key={p.id}><span>{p.name}</span><ControlsPicker mode={'pirate-local-'+(i+2)}/></div>)}</div>}</details>;
 const status=room.phase==='paused'?'Paused':room.phase==='finished'?'Round complete':now<game.startAt?'Ready in '+Math.max(1,Math.ceil((game.startAt-now)/1000)):spectating?'Watching':own?.st===0?'Out · keep watching':own?.dead?'Respawning':'In the brawl';
 return <><section className="pirate-board" aria-label="Pirate Bomb Brawl arena">
  <header className="pirate-heading"><div><small>{map.n}</small><h2>{variant.n}</h2></div><span className={'pirate-state '+(room.phase==='paused'?'is-paused':'')} role="status">{status}</span><div className="pirate-heading-actions">{room.hostId===room.youId&&room.phase==='playing'&&<button type="button" className="button outline" onClick={()=>onAction('pause')} aria-label="Pause pirate arena"><Pause size={16}/></button>}{room.phase==='paused'&&canResume&&<button type="button" className="button outline" onClick={()=>onAction('resume')}><Play size={16}/>Resume</button>}</div></header>
  <div className="pirate-crew-hud" aria-label="Pirate standings">{game.world.fighters.map(f=>{const player=room.players.find(p=>p.id===f.id),skill=f.sp===null?null:PIRATE_SKILLS[f.sp],bomb=game.world.bombs.find(b=>b.id===f.bomb);return <div key={f.id} className={'pirate-crew-card '+(f.st<=0?'is-out ':'')+(f.id===room.youId&&!spectating?'is-you':'')} style={{'--crew-color':f.color} as React.CSSProperties}><CharacterModel mode="pirate" player={{color:player?.color||f.i,appearance:{color:f.color,models:{pirate:f.model}}}} size={39}/><div><strong>{player?.name||'Pirate'}{player?.bot&&<small>AI</small>}</strong><span className="pirate-damage">{f.st<=0?'Out':f.dead?'Respawn':Math.round(f.dmg)+'%'}<small>{f.ko} KOs</small></span><span className="pirate-stocks">{variant.inf?<>∞ stocks</>:<><Heart size={11}/>{f.st} {f.st===1?'stock':'stocks'}</>}</span><progress className="pirate-dash-meter" max={1} value={f.st>0?Math.max(0,Math.min(1,1-f.dc/45)):0} aria-label={(player?.name||'Pirate')+' dash readiness'} title={f.dc<=0?'Dash ready':'Dash recharging'}/></div><span className={'pirate-item '+(bomb?'has-bomb':'')} title={bomb?(bomb.pot?'Hot Potato · attack a rival to pass it':'Held bomb · '+Math.ceil(bomb.t/60)+' seconds'):skill?.d||'No item'}>{bomb?<><Bomb size={14}/>{Math.ceil(bomb.t/60)}s</>:skill?<><Zap size={13}/>{skill.n}</>:<span>—</span>}</span></div>})}</div>
  {!gameWindow?.active&&settings}

  <div className="pirate-canvas-frame"><canvas ref={canvas} className="pirate-canvas" width={960} height={540} tabIndex={0} aria-label="Pirate platform arena. Move, jump, attack, throw or cast, and dash." onFocus={()=>setFocused(true)} onBlur={()=>{clear();setFocused(false)}} onPointerMove={e=>pointer(e)} onPointerDown={e=>pointer(e,true)} onPointerUp={e=>pointer(e,false)} onPointerCancel={()=>clear()} onLostPointerCapture={()=>{const id=local?seat:room.youId;press(id,'attack','pointer:0',false);press(id,'special','pointer:2',false)}} onContextMenu={e=>e.preventDefault()}/>{!loaded&&!failure&&<div className="pirate-loading" role="status">Preparing the crew…</div>}{failure&&<div className="pirate-loading" role="alert"><strong>The crew art could not load.</strong><button type="button" className="button outline" onClick={()=>setRetry(r=>r+1)}>Try again</button></div>}{loaded&&!spectating&&!focused&&room.phase==='playing'&&<button className="pirate-focus" type="button" onClick={()=>canvas.current?.focus()}>Click the arena to play</button>}</div>
  {!spectating&&(display.touch||gameWindow?.active&&gameWindow.controls)&&<div className="pirate-touch-controls" aria-label="Pirate on-screen controls"><div className="pirate-movement-controls"><button type="button" aria-label="Pirate move left" disabled={!active||!!own?.dead||!own?.st} {...touch('left')}><ArrowLeft/></button><button type="button" aria-label="Pirate drop through platform" disabled={!active||!!own?.dead||!own?.st} {...touch('down')}><ArrowDown/></button><button type="button" aria-label="Pirate move right" disabled={!active||!!own?.dead||!own?.st} {...touch('right')}><ArrowRight/></button></div><div className="pirate-action-controls">{([['jump','Jump',ArrowUp],['attack','Attack',Swords],['special','Item',Bomb],['dash','Dash',Zap]] as const).map(([action,label,Icon])=><button type="button" key={action} className={'pirate-action-'+action} aria-label={'Pirate '+label.toLowerCase()} disabled={!active||!!own?.dead||!own?.st||!!variant.stomp&&(action==='attack'||action==='special')||!!variant.pot&&action==='special'} {...touch(action)}><Icon size={19}/><span>{label}</span></button>)}</div></div>}
  <div className="pirate-footnote"><span>{spectating?'Spectator view':local&&humans.length>1?'Shared arena · independent controls':variant.pot?'Attack a rival to pass the potato.':variant.stomp?'Land on rivals’ heads to attack.':<>Jump {controlHint('pirate','jump')} · Attack {controlHint('pirate','attack')} · Item {controlHint('pirate','special')}</>}</span><small>{Math.max(0,Math.ceil((game.deadline-now)/1000))}s left</small></div>
 </section>{gameWindow?.active&&gameWindow.settingsTarget&&createPortal(settings,gameWindow.settingsTarget)}</>;
}
