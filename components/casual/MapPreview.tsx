'use client';
import {memo,useId} from 'react';
import {trackPoints} from '../../lib/casual/circuit';
import {clubTrack,tankWalls,type ClubMap} from '../../lib/casual/party';

/** Map cards use the same route and cover geometry as the playable arena. */
export default memo(function MapPreview({theme,kind}:{theme:string;kind:string}){
 const id=useId().replaceAll(':',''),dark=theme==='neon'||theme==='night'||theme==='harbor'||theme==='foundry',sand=theme==='canyon'||theme==='coast';
 const ground=dark?'#122638':sand?'#b77e57':'#316454',road=dark?'#52617e':sand?'#ebc795':'#98b998',ink=dark?'#8fe0ed':sand?'#563e39':'#d9e6c0';
 const track=kind==='circuit'?trackPoints(theme,192,1):kind==='marble'?clubTrack(theme as ClubMap):[];
 const bounds=track.length?{minX:Math.min(...track.map(p=>p.x)),maxX:Math.max(...track.map(p=>p.x)),minY:Math.min(...track.map(p=>p.y)),maxY:Math.max(...track.map(p=>p.y))}:null;
 const scale=bounds?Math.min(198/(bounds.maxX-bounds.minX),79/(bounds.maxY-bounds.minY)):1;
 const points=track.map(p=>({x:120+(p.x-(bounds!.maxX+bounds!.minX)/2)*scale,y:60+(p.y-(bounds!.maxY+bounds!.minY)/2)*scale}));
 const route=points.map((p,i)=>(i?'L':'M')+p.x.toFixed(1)+' '+p.y.toFixed(1)).join(' ')+'Z';
 return <svg className="map-preview" viewBox="0 0 240 120" aria-hidden="true">
  <defs><pattern id={'terrain-'+id} width="20" height="20" patternUnits="userSpaceOnUse"><path d="M0 20L20 0M10 20L20 10" stroke={ink} opacity=".09"/></pattern></defs>
  <rect width="240" height="120" fill={ground}/><rect width="240" height="120" fill={'url(#terrain-'+id+')'}/>
  {kind==='sumo'?<><ellipse cx="120" cy="65" rx="65" ry="44" fill="#152d36"/><ellipse cx="120" cy="59" rx="61" ry="41" fill="#e7cf9f" stroke={ink} strokeWidth="5"/><path d="M111 48v20m18-20v20" stroke="#9a754d" strokeWidth="3"/><circle cx="93" cy="60" r="9" fill="#8ad6bc"/><circle cx="147" cy="60" r="9" fill="#ffae98"/><circle cx="90" cy="57" r="3" fill="#fff6cf66"/><circle cx="144" cy="57" r="3" fill="#fff6cf66"/></>
  :kind==='pong'?<><rect x="28" y="16" width="184" height="88" rx="12" fill="#112b41" stroke={ink} strokeWidth="3"/><path d="M120 20v80" stroke={ink} strokeDasharray="4 5"/><rect x="39" y="40" width="7" height="34" rx="3" fill="#90e5c8"/><rect x="194" y="64" width="7" height="27" rx="3" fill="#ffb3a2"/><path d="M142 64l13-8" stroke="#fff3c366" strokeWidth="3"/><circle cx="155" cy="56" r="4" fill="#fff3c3"/></>
  :kind==='tanks'?<><rect x="25" y="14" width="190" height="92" rx="9" fill={road} stroke={ink} strokeWidth="3"/>{tankWalls(theme as ClubMap).map((wall,i)=><rect key={i} x={25+wall.x/960*190} y={14+wall.y/600*92} width={wall.w/960*190} height={wall.h/600*92} rx="2" fill={ground} stroke={ink}/>)}<path d="M43 32l14 10m150 48l-14-10" stroke="#fff0bd" strokeWidth="4"/><rect x="37" y="26" width="14" height="11" rx="3" fill="#3a705d"/><rect x="196" y="85" width="14" height="11" rx="3" fill="#b26754"/></>
  :<><path d={route} fill="none" stroke="#132f38" strokeWidth="18" strokeLinejoin="round"/><path d={route} fill="none" stroke={road} strokeWidth="13" strokeLinejoin="round"/><path d={route} fill="none" stroke={ink} strokeDasharray="3 5" strokeWidth="1"/>{points[0]&&<g transform={'translate('+points[0].x+' '+points[0].y+')'}><rect x="-4" y="-7" width="8" height="14" fill="#fff5d9"/><path d="M-4-7h4v4h4v4H0v4h-4" fill="#1b3037"/></g>}{[48,112].map((index,i)=>points[index]&&<circle key={index} cx={points[index].x} cy={points[index].y} r="3.5" fill={i?'#a2d8f4':'#f0af66'} stroke="#173d42" strokeWidth="1"/>)}</>}
  <rect x="4" y="4" width="232" height="112" rx="7" fill="none" stroke={ink} opacity=".35"/>
 </svg>;
});
