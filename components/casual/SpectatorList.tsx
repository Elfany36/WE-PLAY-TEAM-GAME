'use client';
import {Eye,WifiOff} from 'lucide-react';
import type {CasualPublic} from '../../lib/casual/engine';
import CharacterModel from './CharacterModel';
export default function SpectatorList({room}:{room:CasualPublic}){
 const viewers=room.players.filter(p=>!p.retired&&p.role==='spectator');
 if(!viewers.length)return null;
 return <section className="watcher-list" aria-label="Spectators"><header><Eye size={15}/><strong>Watching</strong><span>{viewers.length}</span></header><ul>{viewers.map(player=><li key={player.id} className={'watcher-person '+(player.isYou?'is-you ':'')+(!player.online?'is-offline':'')}><span className="watcher-avatar" aria-hidden="true"><CharacterModel mode={room.mode} fleetStyle={room.settings.fleetStyle} player={player} size={40}/><i><Eye size={11}/></i></span><span className="watcher-identity"><strong>{player.name}{player.isYou&&<b>You</b>}</strong><small>{!player.online?<><WifiOff size={11}/>Reconnecting</>:player.isHost?'Host · spectator':'Spectator'}</small></span></li>)}</ul></section>;
}
