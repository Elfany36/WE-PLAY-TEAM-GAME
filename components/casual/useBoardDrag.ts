'use client';
import {useEffect,useRef,useState} from 'react';
import type {PointerEvent} from 'react';

/** Pointer capture supports mouse, pen and touch; only cell changes cause renders. */
export function useBoardDrag<T>(selector:string,onDrop:(data:T,cell:number)=>void,onTap?:(data:T)=>void){
 const active=useRef<{id:number;x:number;y:number;data:T;started:boolean;cell:number|null}|null>(null),suppress=useRef(0);
 const [drag,setDrag]=useState<{data:T;cell:number|null}|null>(null);
 useEffect(()=>{const reset=()=>{active.current=null;setDrag(null)};window.addEventListener('blur',reset);return()=>window.removeEventListener('blur',reset)},[]);
 function cancel(){active.current=null;setDrag(null)}
 function start(e:PointerEvent<HTMLElement>,data:T){if(e.button!==0||!e.isPrimary||active.current)return;e.currentTarget.setPointerCapture(e.pointerId);active.current={id:e.pointerId,x:e.clientX,y:e.clientY,data,started:false,cell:null}}
 function move(e:PointerEvent<HTMLElement>){const a=active.current;if(!a||a.id!==e.pointerId)return;if(!a.started&&Math.hypot(e.clientX-a.x,e.clientY-a.y)<6)return;e.preventDefault();const target=document.elementFromPoint(e.clientX,e.clientY)?.closest<HTMLElement>(selector),cell=target&&e.currentTarget.contains(target)?Number(target.dataset.cell??target.dataset.square):null;if(!a.started||a.cell!==cell){a.started=true;a.cell=cell;setDrag({data:a.data,cell})}}
 function end(e:PointerEvent<HTMLElement>){const a=active.current;if(!a||a.id!==e.pointerId)return;if(a.started){suppress.current=performance.now()+400;if(a.cell!==null)onDrop(a.data,a.cell)}else if(onTap){suppress.current=performance.now()+400;onTap(a.data)}cancel()}
 return{drag,start,handlers:{onPointerDownCapture:()=>{suppress.current=0},onPointerMove:move,onPointerUp:end,onPointerCancel:cancel,onLostPointerCapture:cancel,onClickCapture:(e:React.MouseEvent)=>{if(e.detail!==0&&performance.now()<suppress.current){e.preventDefault();e.stopPropagation()}},onKeyDownCapture:(e:React.KeyboardEvent)=>{if(e.key==='Escape'&&active.current){suppress.current=performance.now()+400;cancel();e.preventDefault();e.stopPropagation()}}}};
}
