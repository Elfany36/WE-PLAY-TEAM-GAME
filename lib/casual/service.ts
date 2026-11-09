import {HOSTED_ORIGIN,HOSTED_ORIGINS,multiplayerEndpoint} from '../multiplayer-config.ts';
export const CASUAL_SERVICE_ORIGIN='https://markup-arcade.kendsfabros.workers.dev';
export function legacyCasualEndpoint(){return(typeof location!=='undefined'&&location.hostname.endsWith('.github.io')?HOSTED_ORIGIN:'')+'/api/casual'}
export function trustedCasualOrigin(origin:unknown):origin is string{return typeof origin==='string'&&[CASUAL_SERVICE_ORIGIN,...HOSTED_ORIGINS,typeof location!=='undefined'?location.origin:'',typeof location!=='undefined'?new URL(multiplayerEndpoint('casual'),location.href).origin:''].includes(origin)}
export function sessionCasualEndpoint(origin:unknown){return trustedCasualOrigin(origin)?origin+'/api/casual':legacyCasualEndpoint()}
export function invitationService(origin:unknown){return origin===CASUAL_SERVICE_ORIGIN?'arcade':HOSTED_ORIGINS.includes(origin as string)||typeof location!=='undefined'&&origin===location.origin?'site':undefined}
export function invitationEndpoint(value:unknown){return value==='arcade'?CASUAL_SERVICE_ORIGIN+'/api/casual':value==='site'?legacyCasualEndpoint():undefined}
export function joinCandidates(primary:string,allowDedicated=true){return[...new Set([primary,legacyCasualEndpoint(),...(allowDedicated?[CASUAL_SERVICE_ORIGIN+'/api/casual']:[])])]}
/** Known dedicated service is the default for new production rooms. No health-probe downgrade. */
export async function chooseCasualEndpoint(mode?:string,features?:{matchRounds?:number}){
 const configured=multiplayerEndpoint('casual');
 if(typeof location==='undefined'||!(/\.chatgpt\.site$|\.github\.io$/.test(location.hostname)))return configured;
 const origin=new URL(configured,location.href).origin;
 if(origin!==location.origin&&!HOSTED_ORIGINS.includes(origin))return configured;
 // Games requiring current round controls use the matching website authority.
 // Saved sessions and invitations remain pinned to their original service.
 if(mode==='pirate'||features?.matchRounds!==undefined)return legacyCasualEndpoint();
 return CASUAL_SERVICE_ORIGIN+'/api/casual';
}

export function arenaSessionEndpoint(origin:unknown){return sessionCasualEndpoint(origin).replace(/\/casual$/,'/arena')}
export async function chooseArenaEndpoint(){return(await chooseCasualEndpoint()).replace(/\/casual$/,'/arena')}
export function arenaJoinCandidates(primary:string,allowDedicated=true){return joinCandidates(primary.replace(/\/arena$/,'/casual'),allowDedicated).map(url=>url.replace(/\/casual$/,'/arena'))}
