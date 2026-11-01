'use client';
import {useEffect,useRef,useState,useCallback} from 'react';
/** Duplicated tabs may observe one seat, but only the foreground owner writes inputs. */
export function useRoomLease(key:string|null){
 const [owns,setOwns]=useState(true),channel=useRef<BroadcastChannel|null>(null),identity=useRef(''),current=useRef({id:'',at:0}),owned=useRef(true);
 const claim=useCallback(()=>{if(!channel.current)return;const owner={id:identity.current,at:Math.max(Date.now(),current.current.at+1)};current.current=owner;owned.current=true;setOwns(true);channel.current.postMessage({type:'owner',...owner})},[]);
 useEffect(()=>{owned.current=true;setOwns(true);if(!key||typeof BroadcastChannel==='undefined')return;identity.current=crypto.randomUUID();current.current={id:'',at:0};owned.current=false;setOwns(false);const c=new BroadcastChannel('markup-seat:'+key);channel.current=c;let timer:ReturnType<typeof setTimeout>;
  c.onmessage=e=>{const m=e.data;if(m?.type==='hello'&&owned.current&&!document.hidden)c.postMessage({type:'owner',...current.current});if(m?.type==='owner'&&typeof m.id==='string'&&Number.isFinite(m.at)&&(m.at>current.current.at||m.at===current.current.at&&m.id>current.current.id)){current.current={id:m.id,at:m.at};owned.current=m.id===identity.current;setOwns(owned.current)}if(m?.type==='released'&&m.id===current.current.id){current.current={id:'',at:0};if(document.hasFocus())claim()}};
  c.postMessage({type:'hello'});timer=setTimeout(()=>{if(!current.current.id||document.hasFocus()&&!document.hidden)claim()},150);const focus=()=>{if(!document.hidden)claim()},release=()=>{if(owned.current)c.postMessage({type:'released',id:identity.current})};const hidden=()=>{if(document.hidden&&owned.current){release();owned.current=false;setOwns(false)}else if(document.hasFocus())claim()};document.addEventListener('visibilitychange',hidden);window.addEventListener('focus',focus);window.addEventListener('pagehide',release);
  return()=>{clearTimeout(timer);release();document.removeEventListener('visibilitychange',hidden);window.removeEventListener('focus',focus);window.removeEventListener('pagehide',release);c.close();if(channel.current===c)channel.current=null};
 },[key,claim]);return{owns:!key||owns,claim};
}
