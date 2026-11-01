'use client';
import {useEffect,useRef,useState} from 'react';
import {BellRing} from 'lucide-react';
import {turnNotice} from '../../lib/casual/turn-notice';
import type {CasualPublic} from '../../lib/casual/engine';
export default function TurnNotification({room,local,now}:{room:CasualPublic;local:boolean;now:number}){
 const notice=turnNotice(room,now),seen=useRef(''),[message,setMessage]=useState('');
 useEffect(()=>{setMessage('');if(!notice||notice.key===seen.current)return;seen.current=notice.key;if(!local&&!notice.isYou)return;setMessage(local?notice.name+', your turn':'Your turn');const timer=setTimeout(()=>setMessage(''),4500);return()=>clearTimeout(timer)},[notice?.key,local]);
 useEffect(()=>{if(room.phase!=='playing')setMessage('')},[room.phase]);
 return <span className={'turn-arrival'+(message?' visible':'')} role="status" aria-live="polite" aria-atomic="true">{message&&<><BellRing size={16}/><strong>{message}</strong></>}</span>;
}
