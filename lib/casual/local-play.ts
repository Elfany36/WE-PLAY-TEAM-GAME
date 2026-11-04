import {createCasual,applyCasualAction,casualCapacity,casualMinimum,type CasualMode,type CasualSettings,type CasualState} from './engine.ts';
import {CasualError} from './error.ts';
import type {Appearance} from './appearance.ts';

export type PlayRole='player'|'spectator';
export const computerLimit=(mode:string,role:PlayRole='player')=>Math.min(8,casualCapacity(mode)-(role==='spectator'?0:1));
export function spectatorComputerCount(mode:string,count=0){return Math.min(computerLimit(mode,'spectator'),Math.max(2,casualMinimum(mode),count))}
export function createLocalLobby({mode,settings,names,humans=1,role='player',appearance={},seed,now}:{mode:CasualMode;settings:CasualSettings;names:string[];humans?:number;role?:PlayRole;appearance?:Appearance;seed:number;now:number}){
 if(mode==='phone'&&role!=='spectator')throw new CasualError('Private drawing tasks need separate devices. Choose Watch AI for a local relay.');
 if(mode==='sketch'&&role!=='spectator'&&humans>1)throw new CasualError('Use separate devices for private drawing prompts, or play against AI.');
 let s=createCasual('ONDEVICE','local-0',names[0]?.trim()||(role==='spectator'?'Spectator':'Player 1'),'local',mode,seed,now);
 if(role==='spectator')s=applyCasualAction(s,{action:'role',role},s.hostId,now);
 else for(let i=1;i<Math.min(casualCapacity(mode),humans);i++)s=applyCasualAction(s,{action:'join',id:'local-'+i,name:names[i]?.trim()||'Player '+(i+1),hash:'local-'+i},null,now);
 s=applyCasualAction(s,{action:'configure',mode,...settings,bots:role==='spectator'?spectatorComputerCount(mode,settings.bots):Math.min(computerLimit(mode),settings.bots||0)},s.hostId,now);
 if(role!=='spectator')s=applyCasualAction(s,{action:'appearance',appearance},s.hostId,now);
 s.settings.characterSelection=false;return s;
}
/** The host's role is distinct from the human whose shared-device turn is visible. */
export function changeLocalRole(s:CasualState,role:PlayRole,now:number){
 if(role==='spectator'&&s.players.filter(p=>!p.bot&&!p.retired&&p.role!=='spectator').length>1)throw new CasualError('Start Watch AI from the arcade to spectate locally. Shared-device players keep their own turns.');
 let next=applyCasualAction(s,{action:'role',role},s.hostId,now);
 const bots=role==='spectator'?spectatorComputerCount(s.mode,s.settings.bots):Math.min(computerLimit(s.mode),s.settings.bots||0);
 if(bots!==next.settings.bots)next=applyCasualAction(next,{action:'configure',mode:next.mode,...next.settings,bots},next.hostId,now);
 return next;
}
