'use client';
import type {CasualPublic} from '../../lib/casual/engine';
import AppearancePicker from './AppearancePicker';
import ControlsPicker from './ControlsPicker';
import CharacterModel from './CharacterModel';
/** Shared-device guests have their own optional outfit and key preferences. */
export default function PirateLobbyCrew({room,busy,onAction}:{room:CasualPublic;busy:boolean;onAction:(action:string,extra:Record<string,unknown>)=>Promise<boolean>}){
 const players=room.players.filter(p=>!p.bot&&!p.retired&&p.role!=='spectator').slice(1,4);
 if(!players.length)return null;
 return <div className="pirate-lobby-crew" aria-label="Local pirate crew customization">{players.map((player,i)=><div key={player.id}><header><CharacterModel mode="pirate" player={player} size={42}/><strong>{player.name}</strong><small>Player {i+2}</small></header><div><AppearancePicker mode="pirate" player={player} busy={busy} allowUpload={false} onSave={appearance=>onAction('appearance',{appearance,appearanceForMode:'pirate',localActor:player.id})} onUpload={async()=>{}}/><ControlsPicker mode={'pirate-local-'+(i+2)}/></div></div>)}</div>;
}
