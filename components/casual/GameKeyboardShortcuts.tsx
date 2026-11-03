'use client';
import {useEffect,useRef} from 'react';
import type {CasualPublic} from '../../lib/casual/engine';
import {controlKey} from '../../lib/player-controls';
export default function GameKeyboardShortcuts({room}:{room:CasualPublic}){
 const latest=useRef(room);latest.current=room;
 useEffect(()=>{function key(event:KeyboardEvent){const r=latest.current,target=event.target as HTMLElement;if(r.phase!=='playing'||r.players.find(p=>p.isYou)?.role==='spectator'||event.ctrlKey||event.metaKey||event.altKey||target?.closest('input,textarea,select,[contenteditable=true],dialog'))return;
  const root=target?.closest('.casual-arcade')||document.querySelector('.casual-arcade');if(!root)return;const k=controlKey(event,r.mode);
  if(['memory','chess','dama','scidama'].includes(r.mode)){
   const board=root.querySelector(r.mode==='memory'?'.memory-deck':'.strategy-board'),buttons=board?[...board.querySelectorAll<HTMLButtonElement>('button:not([disabled])')]:[];if(!buttons.length)return;
   if(k==='ArrowLeft'||k==='ArrowRight'){event.preventDefault();const index=buttons.indexOf(document.activeElement as HTMLButtonElement);buttons[(index+(k==='ArrowLeft'?-1:1)+buttons.length)%buttons.length].focus()}
   else if(k===' '&&!event.repeat&&buttons.includes(document.activeElement as HTMLButtonElement)){event.preventDefault();(document.activeElement as HTMLButtonElement).click()}return;
  }
  const actions:Record<string,Record<string,string>>={ladders:{r:'roll'},uno:{d:'draw',p:'pass',u:'uno'},property:{r:'roll',e:'end'},phone:{e:'eraser',z:'undo',y:'redo',f:'fill'}};
  const action=actions[r.mode]?.[k];if(!action||event.repeat)return;const button=root.querySelector<HTMLButtonElement>('button[data-game-action="'+action+'"]:not([disabled])');if(button){event.preventDefault();button.click()}
 }window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key)},[]);return null;
}
