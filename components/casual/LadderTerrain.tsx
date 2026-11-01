'use client';
import {memo,useId} from 'react';
import {boardPoint,LADDERS,SLIDES} from '../../lib/casual/engine';
import {tableScene} from '../../lib/casual/scenes';
export default memo(function LadderTerrain({theme}:{theme?:string}){
 const id=useId().replaceAll(':',''),s=tableScene(theme),night=['midnight','royal','cobalt'].includes(s.id),water=s.id==='lagoon'||s.id==='aurora';
 return <g className="ladder-terrain"><defs><linearGradient id={id+'-tile'} x2=".4" y2="1"><stop stopColor={s.light}/><stop offset="1" stopColor={s.dark}/></linearGradient><pattern id={id+'-stars'} width="70" height="70" patternUnits="userSpaceOnUse"><path d={water?'M0 30q18-15 35 0t35 0':night?'M35 23v24m-12-12h24':'M23 40q-5-24 18-27 6 22-18 27Z'} stroke={s.accent} fill="none" opacity=".15" strokeWidth="2"/></pattern></defs>
  <rect width="1000" height="1000" rx="24" fill={s.felt} stroke={s.wood} strokeWidth="12"/>
  {Array.from({length:100},(_,i)=>{const n=i+1,p=boardPoint(n),ladder=!!LADDERS[n],slide=!!SLIDES[n];return <g key={n}><rect x={p.x-47} y={p.y-44} width="94" height="94" rx="13" fill={s.ink} opacity=".4"/><rect x={p.x-47} y={p.y-48} width="94" height="94" rx="13" stroke={s.light} strokeWidth="2" fill={n===100?s.accent:(i+Math.floor(i/10))%2===0?s.light:'url(#'+id+'-tile)'}/><path d={'M'+(p.x-33)+' '+(p.y-42)+'h64'} stroke="#fff9" strokeWidth="2"/><text x={p.x-35} y={p.y-22} fontSize="29" fontWeight="800" fill={s.ink}>{n}</text>{ladder&&<g transform={'translate('+(p.x+25)+' '+(p.y-26)+')'}><circle r="12" fill={s.feltLight}/><path d="m-5 2 5-5 5 5M0-3v9" stroke={s.accent} strokeWidth="3" fill="none"/></g>}{slide&&<g transform={'translate('+(p.x+25)+' '+(p.y-26)+')'}><circle r="12" fill="#a84465"/><path d="m-5-2 5 5 5-5M0-6v9" stroke="#fff0ca" strokeWidth="3" fill="none"/></g>}{n===100&&<path d={'M'+(p.x-16)+' '+(p.y+18)+'l4 13h24l4-13-9 5-7-10-7 10Z'} fill={s.ink}/>}</g>})}
  <rect x="8" y="8" width="984" height="984" rx="20" fill={'url(#'+id+'-stars)'} pointerEvents="none"/>
 </g>;
});
