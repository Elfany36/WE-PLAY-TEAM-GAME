'use client';
import {Eye,ChevronLeft,ChevronRight,Radio,LockKeyhole,RotateCcw} from 'lucide-react';
import type {CasualPublic} from '../../lib/casual/engine';
import {spectatorPlayers,spectatorFollowId} from '../../lib/casual/spectator-view';
import {playerStanding} from '../../lib/casual/scoreboard';
import CharacterModel from './CharacterModel';

export default function SpectatorBar({room,preference,onFollow,local}:{room:CasualPublic;preference:string;onFollow:(id:string)=>void;local:boolean}){
 const players=spectatorPlayers(room),id=spectatorFollowId(room,preference),selected=players.find(p=>p.id===id),manual=players.some(p=>p.id===preference),privateGame=['uno','phone','generals','fleet'].includes(room.mode),index=players.findIndex(p=>p.id===id);
 function step(direction:number){if(players.length)onFollow(players[(index+direction+players.length)%players.length].id)}
 return <section className="spectator-bar" aria-label="Spectator controls"><div className="spectator-heading"><span className="spectator-mark">{selected?<CharacterModel mode={room.mode} player={selected} fleetStyle={room.settings.fleetStyle} size={40}/>:<Eye size={20}/>}</span><div><span className="eyebrow">{local?'LOCAL WATCH MODE':'LIVE SPECTATOR'}</span><h2>{room.phase==='lobby'?'A front-row seat.':selected?'Watching '+selected.name:'Watching the match'}</h2><p>{room.phase==='lobby'?'Choose the match settings, then start when ready.':selected?playerStanding(room,selected.id):'The next round is taking shape.'}</p></div><span className={'spectator-live-state '+room.phase}><Radio size={13}/>{room.phase==='playing'?'Live':room.phase==='paused'?'Paused':room.phase==='finished'?'Finished':'Lobby'}</span></div>
 <div className="spectator-follow-controls"><button type="button" className={'watch-auto '+(!manual?'selected':'')} aria-pressed={!manual} onClick={()=>onFollow('')}><RotateCcw size={14}/> Auto follow</button><div className="watch-player-select"><button type="button" aria-label="Watch previous player" disabled={players.length<2} onClick={()=>step(-1)}><ChevronLeft size={17}/></button><label><span>Follow player</span><select aria-label="Watch player perspective" value={manual?preference:''} disabled={!players.length} onChange={e=>onFollow(e.target.value)}><option value="">Automatic · current turn or leader</option>{players.map(p=><option key={p.id} value={p.id}>{p.name}{p.bot?' · AI':''}</option>)}</select></label><button type="button" aria-label="Watch next player" disabled={players.length<2} onClick={()=>step(1)}><ChevronRight size={17}/></button></div><small>{privateGame?<><LockKeyhole size={13}/> Private information stays concealed.</>:<>Watch freely. Game controls are disabled.</>}</small></div>
 </section>;
}
