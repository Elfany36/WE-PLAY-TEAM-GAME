'use client';
import {memo} from 'react';
const pipPositions:Record<number,[number,number][]>= {
 1:[[50,70]],2:[[50,42],[50,98]],3:[[50,38],[50,70],[50,102]],
 4:[[34,42],[66,42],[34,98],[66,98]],5:[[34,38],[66,38],[50,70],[34,102],[66,102]],
 6:[[34,36],[66,36],[34,70],[66,70],[34,104],[66,104]],
 7:[[34,36],[66,36],[50,53],[34,70],[66,70],[34,104],[66,104]],
 8:[[34,36],[66,36],[50,53],[34,70],[66,70],[50,87],[34,104],[66,104]],
 9:[[34,30],[66,30],[34,56],[66,56],[50,70],[34,84],[66,84],[34,110],[66,110]],
 10:[[34,30],[66,30],[50,43],[34,56],[66,56],[34,84],[66,84],[50,97],[34,110],[66,110]],
};
export default memo(function PlayingCardFace({rank,suit}:{rank:number;suit:string}){
 return <svg className={'sol-card-art '+(rank>10?'court-card':'number-card')} viewBox="0 0 100 140" aria-hidden="true" focusable="false">
  {rank<=10?(pipPositions[rank]||[]).map(([x,y],i)=><text key={i} x={x} y={y+7} textAnchor="middle" fontFamily="Georgia,serif" fontSize={rank===1?48:21} fill="currentColor" transform={y>70?'rotate(180 '+x+' '+y+')':undefined}>{suit}</text>):<>
   <rect x="24" y="25" width="52" height="90" rx="7" fill="#eee8d6" stroke="currentColor" strokeWidth="1.3"/>
   <path d="M27 108V84Q50 65 73 84v24Z" fill="var(--sol-accent,#91baad)" stroke="currentColor" strokeWidth="1.8"/>
   <path d="m34 83 16 25 16-25M50 82v27M29 98h42" fill="none" stroke="currentColor" strokeWidth="1.3"/>
   {rank===12&&<path d="M35 51Q25 60 33 82l9-6h17l8 6q10-23-3-32Z" fill="currentColor"/>}
   <path d="M35 53q15-12 30 0v15q-2 14-15 15-13-1-15-15Z" fill="#f8e5bf" stroke="currentColor" strokeWidth="1.6"/>
   <path d="M41 62h3m12 0h3M45 72q5 4 10 0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
   {rank===13?<><path d="m33 51-3-19 12 8 8-14 8 14 12-8-3 19Z" fill="#dfbf68" stroke="currentColor" strokeWidth="1.8"/><path d="m37 70 13 11 13-11-3 15-10 6-10-6Z" fill="currentColor"/></>:rank===12?<path d="m33 51 2-15 9 5 6-15 6 15 9-5 2 15Z" fill="#e4bd75" stroke="currentColor" strokeWidth="1.8"/>:<><path d="M32 52q4-24 29-14l8 14Z" fill="var(--sol-accent,#91baad)" stroke="currentColor" strokeWidth="1.8"/><path d="M58 43q3-18 15-16-2 12-15 16Z" fill="#e4bd75" stroke="currentColor" strokeWidth="1.5"/></>}
   <text x="50" y="104" textAnchor="middle" fontFamily="Georgia,serif" fontSize="17" fill="currentColor">{suit}</text>
  </>}
 </svg>;
});
