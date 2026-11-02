'use client';
import type {ChatDecoration} from '../../lib/chat-media';
import {memo,lazy,Suspense,type ReactNode} from 'react';
import type {CasualPublic} from '../../lib/casual/engine';
import {Crown,BrainCircuit,Wifi,WifiOff,MessageCircle} from 'lucide-react';
import {nameInitial} from '../../lib/text-presentation';
import {ARCADE_COLORS} from '../../lib/casual/arcade-colors';
import GameMeter from './GameMeter';
import PoolBallBadge from './PoolBallBadge';
import {casualCapacity} from '../../lib/casual/engine';
import {PlayerToken} from './Art';
import {casualLeaderboard} from '../../lib/casual/leaderboard';
import {playerStanding} from '../../lib/casual/scoreboard';
import type {ChatMessage} from '../../lib/room-chat';
import {DockPanel} from './RoomWorkspace';
const cardColors:Record<string,string>={red:'#db3456',yellow:'#bd880b',green:'#27866c',blue:'#356cca',pink:'#b62b82',orange:'#c96620',teal:'#157b7b',purple:'#7b42b6'};
const GameChat=lazy(()=>import('../games/GameChat'));
type Props={room:CasualPublic;guide?:ReactNode;busy:boolean;local:boolean;connected:boolean;onAction:(action:string,extra?:Record<string,any>)=>void;onSend:(text:string,giftId?:string,decoration?:ChatDecoration)=>Promise<void>};
function RoomSidebar({room,busy,local,connected,onAction,onSend,guide}:Props){
 const turnBased=['memory','ladders','uno','property','pool','chess','dama','scidama'].includes(room.mode);
 return <><DockPanel id="players" title="Players & scores" icon={<Crown size={18}/>}>
  <div className="roster-capacity">{room.players.filter(p=>!p.retired).length} / {casualCapacity(room.mode)} seats</div>
   <div className="room-roster-list">{casualLeaderboard(room).map((p,index)=>{
    const actor=room.mode==='tanks'?room.game?.actors?.find((a:any)=>a.id===p.id):null;
    const pool=room.mode==='pool'?room.game:null;
    const poolBalls=pool?.groups[p.id]?pool.balls.filter((b:any)=>!b.pocketed&&b.number>0&&b.number!==8&&(pool.groups[p.id]==='solids'?b.number<8:b.number>8)):null;
    const backs=room.mode==='uno'&&!p.isYou?room.game?.opponentBacks?.[p.id]:null;
    return <div className={'room-roster-player '+(p.isYou?'is-you ':'')+(turnBased&&room.game?.currentId===p.id?'is-current':'')} key={p.id}>
     {room.mode!=='terra'&&<b className={'roster-rank '+(index===0?'is-first':'')}>{String(index+1).padStart(2,'0')}</b>}
     {room.mode==='terra'?<PlayerToken color={p.color} index={p.color} size={31}/>:<span className="roster-portrait" style={{'--seat-color':ARCADE_COLORS[p.color%12].fill,'--seat-ink':ARCADE_COLORS[p.color%12].ink} as React.CSSProperties}><b>{nameInitial(p.name)}</b><i>{p.bot?'AI':String(p.color+1).padStart(2,'0')}</i></span>}
     <div><strong>{p.name}{p.isYou&&!local&&(room.mode==='terra'?' · you':<em className="roster-you">YOU</em>)}</strong>
      {room.mode!=='terra'&&room.botThinking?.playerId===p.id&&<span className="roster-thinking"><BrainCircuit size={12}/> Thinking…</span>}
      <small>{p.retired?'Left the room':room.phase==='lobby'?p.ready?'Ready':p.isHost?'Host':p.online?'Here':'Reconnecting':(p.online?'':'Reconnecting · ')+playerStanding(room,p.id)}</small>
      {actor&&<><GameMeter label={actor.alive?'Hull':'Respawning'} value={actor.alive?actor.hp:0} max={3} tone="health"/><small className="roster-armor">{actor.armor??0} armor · {actor.ammo??5}/5 shells</small></>}
      {poolBalls&&<div className="roster-pool-balls" aria-label={p.name+' remaining balls'}>{(poolBalls.length?poolBalls:[{number:8}]).map((b:any)=><PoolBallBadge key={b.number} number={b.number}/>)}</div>}
      {backs?.length>0&&<div className="roster-flip-backs" aria-label={p.name+' visible reverse card faces'}>{backs.map((card:any,i:number)=><span key={i} title={(card.color||'Wild')+' '+card.face} style={{background:cardColors[card.color]||'#333c59'}}>{/^\d$/.test(card.face)?card.face:card.face==='reverse'?'↔':card.face==='skip'?'⊘':'★'}</span>)}</div>}
     </div>
     {room.mode!=='terra'&&<span className={'roster-presence '+(p.online?'online':'offline')} aria-label={p.online?'Online':'Reconnecting'}>{p.online?<Wifi size={13}/>:<WifiOff size={13}/>}</span>}
     {room.isHost&&p.canRemove&&!p.retired&&room.phase!=='playing'&&room.phase!=='paused'&&<button className="text-link" disabled={busy} onClick={()=>onAction('remove-inactive',{playerId:p.id})}>Free seat</button>}
    </div>;
   })}</div>
   {room.phase==='lobby'&&!local&&<button className="button outline roster-ready" disabled={busy} onClick={()=>onAction('ready')}>{room.players.find(p=>p.isYou)?.ready?'Unready':'Ready to play'}</button>}
  {guide}</DockPanel>
  <DockPanel id="chat" title="Chat" icon={<MessageCircle size={18}/>}><Suspense fallback={<p className="chat-loading" role="status">Opening room chat…</p>}><GameChat embedded docked roomCode={room.code} resetKey={room.mode+':'+room.chatEpoch} youId={room.youId} messages={(room.chat||[]) as ChatMessage[]} local={local} disabled={!local&&!connected} onSend={onSend}/></Suspense></DockPanel>
 </>;
}

function rosterKey(room:CasualPublic){const g=room.game;return JSON.stringify([room.code,room.mode,room.phase,room.youId,room.isHost,room.chatEpoch,room.botThinking?.playerId,casualLeaderboard(room).map(p=>[p.id,p.name,p.color,p.ready,p.retired,p.online,p.canRemove,p.bot,p.isHost,p.isYou,playerStanding(room,p.id),g?.currentId===p.id,room.mode==='tanks'?g?.actors?.filter((a:any)=>a.id===p.id).map((a:any)=>[a.alive,a.hp,a.armor,a.ammo]):null,room.mode==='pool'?g?.balls?.filter((b:any)=>!b.pocketed).map((b:any)=>b.number):null,room.mode==='uno'?g?.opponentBacks?.[p.id]:null])])}
export default memo(RoomSidebar,(a,b)=>a.busy===b.busy&&a.local===b.local&&a.connected===b.connected&&a.guide===b.guide&&a.onAction===b.onAction&&a.onSend===b.onSend&&a.room.chat?.length===b.room.chat?.length&&a.room.chat?.at(-1)?.clientId===b.room.chat?.at(-1)?.clientId&&rosterKey(a.room)===rosterKey(b.room));
