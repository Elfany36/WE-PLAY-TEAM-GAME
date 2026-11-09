'use client';
import {memo,type CSSProperties,type Ref} from 'react';
import type {CasualPublic} from '../../lib/casual/engine';
import type {publicPirate} from '../../lib/casual/pirate';
import {PIRATE_SKILLS,PIRATE_MODES,PIRATE_MAPS} from '../../lib/casual/pirate-data';
import {seriesRoundLabel} from '../../lib/casual/round-series';
import manifest from '../../public/pirate-brawl/manifest.json';
const rarity=['#c8d7ee','#4aa8ff','#c77dff','#ffd24a'];
const Portrait=memo(function Portrait({character}:{character:number}){
 const sprite=manifest.assets.ch[character]||manifest.assets.ch[0],scale=Math.min(44/sprite.w,58/sprite.h);
 return <span className="pirate-native-portrait" aria-hidden="true"><span style={{width:sprite.w*scale,height:sprite.h*scale,backgroundImage:`url(${sprite.src.replace(/^\//,'')})`,backgroundSize:Math.max(...Object.values(sprite.n))*sprite.w*scale+'px '+sprite.h*6*scale+'px'}}/></span>;
});
/** Original portrait / percent / hearts / item / dash layout, without the control banner. */
export default function PirateHud({room,hudRef}:{room:CasualPublic;hudRef?:Ref<HTMLDivElement>}){
 const game=room.game as ReturnType<typeof publicPirate>,variant=PIRATE_MODES.find(v=>v.id===game.world.variant)!;
 return <div ref={hudRef} className="pirate-crew-hud pirate-native-crew" aria-label="Pirate standings" style={{'--pirate-crew-count':game.world.fighters.length,'--pirate-mobile-columns':Math.min(3,game.world.fighters.length)} as CSSProperties}>{game.world.fighters.map(f=>{
  const player=room.players.find(p=>p.id===f.id),bomb=game.world.bombs.find(b=>b.id===f.bomb),skill=f.sp===null?null:PIRATE_SKILLS[f.sp],item=bomb?(bomb.pot?'Hot Potato':'Bomb')+' · '+Math.ceil(bomb.t/60)+'s':skill?.n||'Empty item slot',color=bomb?'#e0edf7':skill?rarity[skill.r]:'#79718e';
  return <div key={f.id} className={'pirate-crew-card pirate-native-card '+(f.st<=0?'is-out ':'')+(f.id===room.youId?'is-you':'')} style={{'--crew-color':f.color} as CSSProperties}>
   <Portrait character={f.ch}/><strong className="pirate-native-name" title={player?.name}>{player?.bot?'CPU ':''}{player?.name||'Pirate'}</strong><div className="pirate-native-vitals"><span className="pirate-damage" style={{color:f.st<=0?'#b5adbf':`hsl(${Math.max(0,50-f.dmg*.35)} 95% ${f.dmg>0?72:94}%)`}}>{f.st<=0?'OUT':f.dead?'…':Math.round(f.dmg)+'%'}</span><span className="pirate-native-hearts" aria-label={variant.inf?'Unlimited stocks':f.st+' stocks'}>{variant.inf?<span>∞</span>:Array.from({length:Math.min(5,f.st)},(_,i)=><img key={i} src="pirate-brawl/sprites/heart.png" alt="" width={13} height={12}/>)}</span></div>
   <div className="pirate-native-item"><span className={'pirate-native-slot '+(bomb?'has-bomb':'')} style={{borderColor:color}} role="img" aria-label={item} title={bomb?item:skill?.d||item}>{bomb?<><i className="pirate-native-bomb"/><small>{Math.ceil(bomb.t/60)}</small></>:skill?<b style={{background:skill.c}}>{skill.n.slice(0,2).toUpperCase()}</b>:<i className="pirate-native-empty"/>}</span><progress className="pirate-dash-meter" max={1} value={f.st>0?Math.max(0,Math.min(1,1-f.dc/45)):0} aria-label={(player?.name||'Pirate')+' dash readiness'} title={f.dc<=0?'Dash ready':'Dash recharging'}/><small className="pirate-native-kos">KO {f.ko}</small></div>
  </div>;
 })}</div>;
}
export function PirateClock({room,now}:{room:CasualPublic;now:number}){
 const game=room.game as ReturnType<typeof publicPirate>,seconds=Math.max(0,Math.ceil((game.deadline-now)/1000)),map=PIRATE_MAPS.find(m=>m.id===game.world.map),variant=PIRATE_MODES.find(v=>v.id===game.world.variant);
 return <div className="pirate-native-clock"><time aria-label={seconds+' seconds remaining'}>{Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0')}</time><span>{room.series?.limit?seriesRoundLabel(room.series,room.phase,room.round)+' · ':''}{variant?.n} · {map?.n}</span></div>;
}
