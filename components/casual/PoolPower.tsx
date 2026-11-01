'use client';
import {useId,useRef,useState,type CSSProperties} from 'react';
type Props={value:number;disabled:boolean;onChange:(value:number)=>void;onShoot:(value:number)=>void};
/** Native keyboard range plus a large visual pull control; a tap never fires. */
export default function PoolPower({value,disabled,onChange,onShoot}:Props){
 const id=useId(),gesture=useRef<{id:number;x:number;y:number;dragged:boolean}|null>(null),[pulling,setPulling]=useState(false);
 function cancel(){gesture.current=null;setPulling(false)}
 return <aside className={'pool-power-control'+(pulling?' is-pulling':'')+(disabled?' is-disabled':'')} style={{'--shot-power':value*100+'%'} as CSSProperties}>
  <label htmlFor={id}><span>SHOT POWER</span><strong>{Math.round(value*100)}<small>%</small></strong></label>
  <div className="pool-power-track"><div className="pool-power-fill"/><span className="pool-power-thumb" aria-hidden="true"><i/><i/><i/></span>
   <input id={id} aria-label="Pool shot power" aria-describedby={id+'-help'} aria-valuetext={Math.round(value*100)+' percent power'} type="range" min={10} max={100} step={1} value={Math.round(value*100)} disabled={disabled}
    onChange={e=>onChange(+e.target.value/100)}
    onPointerDown={e=>{if(disabled||e.button!==0)return;e.currentTarget.setPointerCapture(e.pointerId);gesture.current={id:e.pointerId,x:e.clientX,y:e.clientY,dragged:false}}}
    onPointerMove={e=>{const g=gesture.current;if(!g||g.id!==e.pointerId)return;if(Math.hypot(e.clientX-g.x,e.clientY-g.y)>=5){g.dragged=true;setPulling(true)}}}
    onPointerUp={e=>{const g=gesture.current;if(!g||g.id!==e.pointerId)return;const fire=g.dragged,power=+e.currentTarget.value/100;cancel();if(fire&&!disabled)onShoot(power)}}
    onPointerCancel={cancel} onLostPointerCapture={cancel} onBlur={cancel}
    onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();if(!disabled)onShoot(+e.currentTarget.value/100)}}}/>
  </div>
  <small id={id+'-help'}>{pulling?'Release to shoot':'Pull to power · release to shoot'}<span>Arrows adjust · Enter shoots</span></small>
 </aside>;
}
