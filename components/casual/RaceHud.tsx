import {Flag,Navigation,Zap,Shield,Magnet,Flame,Droplets,Radio} from 'lucide-react';
import type {CasualPublic} from '../../lib/casual/engine';
import {raceEvent} from '../../lib/casual/race-events';
import {circuitRank,TRACKS,type CircuitGame} from '../../lib/casual/circuit';
const items={boost:{name:'Turbo boost',Icon:Flame},oil:{name:'Oil slick',Icon:Droplets},spark:{name:'Spark shot',Icon:Zap},shield:{name:'Shield',Icon:Shield},pulse:{name:'Pulse wave',Icon:Radio},magnet:{name:'Pickup magnet',Icon:Magnet}};
export default function RaceHud({room}:{room:CasualPublic}){
 const g=room.game as CircuitGame,own=g.drivers.find(d=>d.id===room.youId);if(!own)return null;
 const event=raceEvent(g),position=circuitRank(g).findIndex(d=>d.id===own.id)+1,item=own.item?items[own.item]:null,Icon=item?.Icon||Zap;
 return <div className="action-hud race-command" aria-label="Race information"><div className="race-title"><Navigation size={18}/><span><small>POCKET KART</small><strong>{TRACKS.find(t=>t.id===g.track)?.name}</strong></span></div><div className="race-stat"><small>POSITION</small><strong>{position}<span> / {g.drivers.length}</span></strong></div><div className="race-stat"><small><Flag size={11}/> LAP</small><strong>{Math.min(g.laps,own.lap+1)}<span> / {g.laps}</span></strong></div><div className={'race-item '+(item?'is-loaded':'')}><Icon size={23}/><span><strong>{item?.name||'Find a pickup'}</strong><small>{item?'E or ⚡ to activate':'Drive through a glowing box'}</small></span></div><div className="race-drift"><span>{own.drifting>.65?'Turbo ready':'Drift charge'}</span><div><i style={{width:Math.min(100,own.drifting/.65*100)+'%'}}/></div><small>{own.drifting>.65?'Release drift':'Hold Space through a turn'}</small></div>{event&&(event.open||event.warning)&&<div className="race-event"><span/>{event.name} · {event.open?'Turbo gate · '+event.remaining+'s left':'Opens in '+event.remaining+'s'} · ◆ on the minimap</div>}</div>;
}
