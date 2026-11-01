'use client';
import {useEffect,useRef,useState} from 'react';
import {ArrowRight,BellRing} from 'lucide-react';
import {turnNotice} from '../../lib/casual/turn-notice';
import type {CasualPublic} from '../../lib/casual/engine';
export default function TurnNotification({room,local,now}:{room:CasualPublic;local:boolean;now:number}){
 const notice=turnNotice(room,now),seen=useRef(''),[message,setMessage]=useState('');
 useEffect(()=>{setMessage('');if(!notice||notice.key===seen.current)return;seen.current=notice.key;if(!local&&!notice.isYou)return;setMessage(local?notice.name+', your turn':'Your turn');const timer=setTimeout(()=>setMessage(''),4500);return()=>clearTimeout(timer)},[notice?.key,local]);
 useEffect(()=>{if(room.phase!=='playing')setMessage('')},[room.phase]);
 return <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">{message&&message+'. Your controls are ready.'}</div>;
}
