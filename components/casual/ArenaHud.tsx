import {Clock3,Flag,Heart,Shield,Zap} from 'lucide-react';
import type {CasualPublic} from '../../lib/casual/engine';
import type {PartyGame} from '../../lib/casual/party';
import {CLUB_MAPS} from '../../lib/casual/party';
import {playerColor} from '../../lib/casual/appearance';
import {sumoActive,sumoBout} from '../../lib/casual/sumo-bracket';
import {arenaSupply,glacierGust} from '../../lib/casual/arena-events';
import GameMeter from './GameMeter';
export default function ArenaHud({room,actorId}:{room:CasualPublic;actorId:string}){
 const g=room.game as PartyGame,actor=g.actors.find(a=>a.id===actorId)||g.actors[0],player=room.players.find(p=>p.id===actor?.id),color=playerColor(player);
 if(!actor)return null;
 const remaining=Math.max(0,Math.ceil((g.deadline-room.serverNow)/1000)),name=CLUB_MAPS.find(m=>m.id===g.map)?.name||'Arena',bout=sumoBout(g,actor.id),supply=arenaSupply(g);
 return <div className={'club-hud arena-hud hud-'+g.kind}>
  <div className="hud-player"><span className="hud-avatar" style={{background:color.fill,color:color.ink}}>{(player?.color||0)+1}</span><div><strong>{player?.name||'Player'}{player?.isYou&&<small> YOU</small>}</strong><span>{name}{g.kind==='sumo'&&g.bracket?' · Round '+g.bracket.round:''}</span></div></div>
  <div className="hud-vitals">
   {g.kind==='tanks'&&<><GameMeter label="Hull" value={actor.alive?actor.hp:0} max={3} tone="health"/><GameMeter label={(actor.reloadUntil||0)>room.serverNow?'Reloading':'Ammo'} value={actor.ammo??5} max={5} tone="gold"/><span className="hud-chip"><Shield size={15}/> {actor.armor??0} armor</span></>}
   {g.kind==='sumo'&&<><GameMeter label="Stamina" value={actor.stamina??100} max={100}/><span className="hud-chip"><Zap size={15}/>{bout?.winner===actor.id?'Qualified':!sumoActive(g,actor.id)?'Watching':actor.alive?'In the ring':'Ring out'}</span></>}
   {g.kind==='marble'&&<><span className="hud-chip"><Flag size={16}/> Lap {Math.min(g.raceLaps||2,actor.lap+1)} / {g.raceLaps||2}</span><span className="hud-chip"><Heart size={16}/> {actor.deaths} falls</span>{g.map==='glacier'&&g.rules===2&&<span className="hud-chip">{glacierGust(g).active?'Crosswind active':'Wind in '+glacierGust(g).remaining+'s'}</span>}</>}
   {g.kind==='pong'&&<span className="hud-chip">First to {g.winTarget||11} · win by two</span>}
   {g.kind==='tanks'&&supply.enabled&&<span className="hud-chip" title={supply.hint}>{supply.name} · {supply.open?supply.hint+' · '+supply.remaining+'s':supply.remaining+'s'}</span>}
  </div>
  <span className="hud-clock"><Clock3 size={15}/>{Math.floor(remaining/60)}:{String(remaining%60).padStart(2,'0')}</span>
 </div>;
}
