'use client';
import {memo,type CSSProperties} from 'react';
import {Crown,ChevronDown,BrainCircuit,Shield} from 'lucide-react';
import {casualCapacity,type CasualPublic} from '../../lib/casual/engine';
import {casualLeaderboard} from '../../lib/casual/leaderboard';
import {matchStat} from '../../lib/casual/match-stats';
import {ARCADE_COLORS} from '../../lib/casual/arcade-colors';
import CharacterModel from './CharacterModel';
import {playerColor} from '../../lib/casual/appearance';
import {useAvatar} from './AvatarImages';
import PoolBallBadge from './PoolBallBadge';

type Props={embedded?:boolean;room:CasualPublic;open:boolean;setOpen:(open:boolean)=>void;busy:boolean;local:boolean;onAction:(action:string,extra?:{playerId:string})=>void};
const colors:Record<string,string>={red:'#db3456',yellow:'#bd880b',green:'#27866c',blue:'#356cca',pink:'#b62b82',orange:'#c96620',teal:'#157b7b',purple:'#7b42b6'};
const Portrait=memo(function Portrait({player,mode}:{player:CasualPublic['players'][number];mode:string}){const image=useAvatar(player.id);return image?<img src={image} alt="" width={34} height={38}/>:<CharacterModel mode={mode} player={player} size={38}/>});
export default function MatchBoard({embedded=false,room,open,setOpen,busy,local,onAction}:Props){
 const players=casualLeaderboard(room).filter(p=>!p.retired),g=room.game,playing=room.phase!=='lobby';
 const Heading=embedded?'header':'summary';
 const content=<>
  <Heading><span className="match-board-mark"><Crown size={20}/></span><span className="match-board-heading"><small>{playing?'ROUND '+room.round:'THE CREW'}</small><strong>{playing?'Match standings':'Player lobby'}</strong></span><span className="match-board-count">{players.length}<small>/{casualCapacity(room.mode)}</small></span>{!embedded&&<ChevronDown size={16}/>}</Heading>
  <ol className="match-board-list">{players.map((p,index)=>{
   const color=playerColor(p),stat=matchStat(room,p.id),turn=g?.currentId===p.id,thinking=room.botThinking?.playerId===p.id;
   const actor=g?.kind==='tanks'?g.actors.find((a:{id:string})=>a.id===p.id):null;
   const balls=g?.kind==='pool'&&g.groups[p.id]?g.balls.filter((b:{number:number;pocketed:boolean})=>!b.pocketed&&b.number>0&&b.number!==8&&(g.groups[p.id]==='solids'?b.number<8:b.number>8)):null;
   const backs=g?.kind==='uno'&&!p.isYou?g.opponentBacks?.[p.id]:null;
   return <li key={p.id} className={(p.isYou?'is-you ':'')+(turn?'is-current ':'')+(index===0&&playing?'is-leading':'')} style={{'--player-color':color.fill,'--player-ink':color.ink} as CSSProperties}>
    <span className="match-place" aria-label={'Rank '+(index+1)}>{index===0&&playing?<Crown size={15}/>:String(index+1).padStart(2,'0')}</span>
    <span className="match-avatar" aria-hidden="true"><Portrait player={p} mode={room.mode}/><i className={p.online?'online':'offline'}/></span>
    <div className="match-identity"><strong title={p.name}>{p.name}</strong><div className="match-tags">{p.isYou&&!local&&<b>YOU</b>}{p.bot&&<span>BOT</span>}{p.isHost&&room.phase==='lobby'&&<span>HOST</span>}{thinking?<span className="is-thinking"><BrainCircuit size={11}/>Thinking</span>:turn&&playing?<span className="is-turn">Playing</span>:!p.online?<span>Reconnecting</span>:!playing&&<span>{p.ready?'Ready':'In lobby'}</span>}</div></div>
    {playing&&<div className="match-score"><strong>{stat.value}</strong><small>{stat.label}</small></div>}
    {playing&&<div className="match-detail">{stat.detail}</div>}
    {stat.progress!==undefined&&playing&&<div className="match-progress" aria-label={p.name+' progress'}><i style={{width:stat.progress*100+'%'}}/></div>}
    {actor&&<div className="match-tank-vitals"><span aria-label={actor.hp+' of 3 hull points'}>{[0,1,2].map(i=><i key={i} className={actor.alive&&i<actor.hp?'filled':''}/>)}</span><small><Shield size={11}/>{actor.armor??0}</small><small>{actor.reloadUntil>room.serverNow?'Reloading':(actor.ammo??5)+'/5 ammo'}</small></div>}
    {balls&&<div className="match-balls" aria-label={p.name+' remaining balls'}>{(balls.length?balls:[{number:8}]).map((b:{number:number})=><PoolBallBadge key={b.number} number={b.number}/>)}</div>}
    {backs?.length>0&&<div className="match-backs" aria-label={p.name+' visible reverse card faces'}>{backs.map((card:{color:string;face:string},i:number)=><span key={i} title={card.color+' '+card.face} style={{background:colors[card.color]||'#333c59'}}>{/^\d$/.test(card.face)?card.face:card.face==='reverse'?'↔':card.face==='skip'?'⊘':'★'}</span>)}</div>}
    {room.isHost&&p.canRemove&&room.phase!=='playing'&&room.phase!=='paused'&&<button className="text-link match-free-seat" disabled={busy} onClick={()=>onAction('remove-inactive',{playerId:p.id})}>Free seat</button>}
   </li>;
  })}</ol>
  {room.players.some(p=>!p.retired&&p.role==='spectator')&&<div className="watcher-list"><small>WATCHING</small>{room.players.filter(p=>!p.retired&&p.role==='spectator').map(p=><span key={p.id}>{p.name}{p.isYou?' · you':''}</span>)}</div>}
  {room.phase==='lobby'&&!local&&room.players.find(p=>p.isYou)?.role!=='spectator'&&<button className="button outline match-ready" disabled={busy} onClick={()=>onAction('ready')}>{room.players.find(p=>p.isYou)?.ready?'Unready':'Ready to play'}</button>}
 </>;
 return embedded?<section className="match-board is-embedded">{content}</section>:<details className="match-board" open={open} onToggle={e=>setOpen(e.currentTarget.open)}>{content}</details>;
}
