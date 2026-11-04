'use client';
import {memo,useId} from 'react';
import {MODEL_SETS} from '../../lib/casual/model-catalog';
import {modelDataUrl} from '../../lib/casual/model-visuals';
export default memo(function PlayingCardBack({model,color}:{model:string;color:string}){
 const id=useId().replace(/:/g,''),index=Math.max(0,(MODEL_SETS.solitaire as readonly string[]).indexOf(model)),variant=index%5;
 return <svg className="sol-card-back-art" viewBox="0 0 100 140" aria-hidden="true" focusable="false"><defs>
  <pattern id={id} width={variant===1?12:8} height={variant===1?12:8} patternUnits="userSpaceOnUse">
   {variant===0?<><path d="m0 4 4-4 4 4-4 4Z" fill="none" stroke="#f5f0d7" strokeWidth=".65"/><circle cx="4" cy="4" r=".8" fill="#f5f0d7"/></>:variant===1?<><circle cx="6" cy="6" r="4.5" fill="none" stroke="#f5f0d7" strokeWidth=".7"/><path d="M0 6h12M6 0v12" stroke="#f5f0d7" strokeWidth=".5"/></>:variant===2?<path d="M0 0l8 8m0-8L0 8M0 4h8M4 0v8" stroke="#f5f0d7" strokeWidth=".55"/>:variant===3?<><path d="m4 0 1 3 3 1-3 1-1 3-1-3-3-1 3-1Z" fill="#f5f0d7" opacity=".8"/><circle cx="0" cy="0" r="1" fill="#f5f0d7"/></>:<path d="M0 0q8 0 8 8M0 8Q0 0 8 0M0 4q4 0 4 4M4 0q0 4 4 4" fill="none" stroke="#f5f0d7" strokeWidth=".7"/>}
  </pattern></defs><rect x=".8" y=".8" width="98.4" height="138.4" rx="5" fill="#fffdf4"/><rect x="5" y="5" width="90" height="130" rx="3" fill={color}/><rect x="8" y="8" width="84" height="124" rx="2" fill={'url(#'+id+')'}/><rect x="11" y="11" width="78" height="118" rx="2" fill="none" stroke="#fff9df" strokeWidth=".8"/>
  {[0,180].map(angle=><g key={angle} transform={'rotate('+angle+' 50 70)'}><path d="M18 20q32 14 64 0M18 23q32 14 64 0" stroke="#fff9df" fill="none" strokeWidth=".8"/><path d="m50 31-5 7 5 7 5-7Z" fill="#fff9df"/></g>)}
  <ellipse cx="50" cy="70" rx="22" ry="27" fill={color} stroke="#fff9df" strokeWidth="1.5"/><ellipse cx="50" cy="70" rx="18.5" ry="23.5" fill="none" stroke="#fff9df" strokeWidth=".7"/><image href={modelDataUrl('solitaire',model,'#e5d4a3')} x="34" y="49" width="32" height="42"/>
 </svg>;
});
