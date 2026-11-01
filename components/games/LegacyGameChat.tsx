'use client';
import {memo,useEffect,useRef,useState} from 'react';
import {MessageCircle,Send,ChevronDown,Smile,Gift,X} from 'lucide-react';
import {CHAT_GIFTS,type ChatMessage} from '../../lib/room-chat';
type Props={messages:ChatMessage[];youId:string;roomCode:string;resetKey?:string;onSend:(text:string,giftId?:string)=>Promise<void>;local?:boolean;disabled?:boolean;docked?:boolean};
const emojis=['👋','😊','💚','🔥','🎉','👏','😂','🤔','💻','🚀','✨','👍'];
function GameChat({messages,youId,roomCode,resetKey,onSend,local=false,disabled=false,docked=false}:Props){
 const [open,setOpen]=useState(false),[text,setText]=useState(''),[sending,setSending]=useState(false),[error,setError]=useState(''),[seen,setSeen]=useState(0),[tray,setTray]=useState<'emoji'|'gift'|null>(null);
 const bottom=useRef<HTMLDivElement>(null),list=useRef<HTMLDivElement>(null),input=useRef<HTMLInputElement>(null),stick=useRef(true),generation=useRef(0);
 const last=messages.at(-1)?.id||0,unread=messages.filter(m=>m.id>seen&&m.playerId!==youId).length;
 useEffect(()=>{generation.current++;setText('');setError('');setSeen(0);setTray(null);setSending(false)},[roomCode,resetKey]);
 useEffect(()=>{if(!messages.length)setSeen(0);if(open){setSeen(last);if(stick.current)list.current&&(list.current.scrollTop=list.current.scrollHeight)}},[last,open,messages.length]);
 useEffect(()=>()=>{generation.current++},[]);
 async function deliver(message:string,giftId?:string){
  if(!message.trim()||sending||disabled)return;const epoch=generation.current;setSending(true);setError('');
  try{await onSend(message,giftId);if(epoch===generation.current){if(!giftId)setText('');setTray(null);stick.current=true;input.current?.focus()}}
  catch(e){if(epoch===generation.current)setError((e as Error).message)}finally{if(epoch===generation.current)setSending(false)}
 }
 return <section className={'game-chat '+(open?'is-open ':'')+(docked?'is-docked':'')} aria-label="Game room chat">
  <button className="chat-toggle" aria-expanded={open} aria-controls={'chat-'+roomCode} onClick={()=>{setOpen(!open);if(!open){setSeen(last);stick.current=true}}}><span><MessageCircle size={18}/><strong>{local?'Table chat':'Room chat'}</strong>{unread>0&&!open&&<b aria-label={unread+' unread messages'}>{unread}</b>}</span><span>{open?'Hide chat':'Show chat'}<ChevronDown size={16}/></span></button>
  {open&&<div id={'chat-'+roomCode} className="chat-body">
   <div className="chat-messages" ref={list} role="log" aria-live="polite" aria-relevant="additions" onScroll={()=>{const el=list.current;stick.current=!el||el.scrollHeight-el.scrollTop-el.clientHeight<60}}>
    {messages.length?messages.map(m=>{const gift=CHAT_GIFTS.find(g=>g.id===m.giftId);return <article key={m.clientId} className={(m.playerId===youId?'own ':'')+(gift?'chat-gift-message':'')}><header><strong>{m.name}{m.playerId===youId?' · you':''}</strong><time dateTime={new Date(m.at).toISOString()}>{new Date(m.at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</time></header>{gift?<p><span aria-hidden="true">{gift.emoji}</span><span>Sent <strong>{gift.name}</strong> to the room</span></p>:<p>{m.text}</p>}</article>}):<p className="chat-empty">Your next teammate starts with a hello. 👋</p>}
    <div ref={bottom}/>
   </div>
   <div className="chat-tools"><button type="button" aria-expanded={tray==='emoji'} onClick={()=>setTray(tray==='emoji'?null:'emoji')}><Smile size={17}/> Emoji</button><button type="button" aria-expanded={tray==='gift'} onClick={()=>setTray(tray==='gift'?null:'gift')}><Gift size={17}/> Send a gift</button><small>Free virtual gifts</small></div>
   {tray&&<div className={'chat-tray '+tray}><div className="chat-tray-title"><strong>{tray==='emoji'?'A little expression':'Make someone’s day'}</strong><button className="icon-button" type="button" aria-label="Close chat tray" onClick={()=>setTray(null)}><X size={16}/></button></div>{tray==='emoji'?<div className="emoji-grid">{emojis.map(e=><button type="button" key={e} aria-label={'Add '+e+' emoji'} onClick={()=>{setText(t=>(t+e).slice(0,280));input.current?.focus()}}>{e}</button>)}</div>:<div className="gift-grid">{CHAT_GIFTS.map(g=><button type="button" key={g.id} disabled={sending||disabled} aria-label={'Send '+g.name+' gift'} onClick={()=>void deliver(g.text,g.id)}><span>{g.emoji}</span>{g.name}</button>)}</div>}</div>}
   <form onSubmit={e=>{e.preventDefault();void deliver(text)}}><label className="sr-only" htmlFor={'chat-input-'+roomCode}>Chat message</label><input ref={input} id={'chat-input-'+roomCode} aria-label="Chat message" value={text} maxLength={280} placeholder={disabled?'Reconnecting…':'Message your room…'} disabled={disabled||sending} onChange={e=>setText(e.target.value)}/><button className="button dark" type="submit" disabled={disabled||sending||!text.trim()} aria-label="Send chat message"><Send size={16}/>{sending?'Sending…':'Send'}</button></form>
   <div className="chat-caption"><span>{text.length} / 280 · Clears when someone leaves or the game changes. Expires after 15 minutes.</span>{error&&<span role="alert">{error}</span>}</div>
  </div>}
 </section>;
}
export default memo(GameChat);
