import {HOSTED_ORIGIN,HOSTED_ORIGINS,CLOUDFLARE_WEBSITE_ORIGIN,multiplayerEndpoint} from '../multiplayer-config.ts';
import {SEA_GATEWAY,PH_GATEWAY,roomGateway} from '../room-gateways.ts';
import {selectRoomGateway} from './gateway-choice.ts';
export const CASUAL_SERVICE_ORIGIN=SEA_GATEWAY;
export const PH_SERVICE_ORIGIN=PH_GATEWAY;
let selectedGateway:{key:string;until:number;choice:Promise<string>}|undefined;
export function legacyCasualEndpoint(){return(typeof location!=='undefined'&&location.hostname.endsWith('.github.io')?HOSTED_ORIGIN:'')+'/api/casual'}
export function trustedCasualOrigin(origin:unknown):origin is string{return typeof origin==='string'&&[CASUAL_SERVICE_ORIGIN,PH_SERVICE_ORIGIN,...HOSTED_ORIGINS,typeof location!=='undefined'?location.origin:'',typeof location!=='undefined'?new URL(multiplayerEndpoint('casual'),location.href).origin:''].includes(origin)}
export function sessionCasualEndpoint(origin:unknown){return trustedCasualOrigin(origin)?origin+'/api/casual':legacyCasualEndpoint()}
export function invitationService(origin:unknown){return origin===PH_SERVICE_ORIGIN?'ph':origin===CASUAL_SERVICE_ORIGIN?'arcade':HOSTED_ORIGINS.includes(origin as string)||typeof location!=='undefined'&&origin===location.origin?'site':undefined}
export function invitationEndpoint(value:unknown){return value==='ph'?PH_SERVICE_ORIGIN+'/api/casual':value==='arcade'?CASUAL_SERVICE_ORIGIN+'/api/casual':value==='site'?legacyCasualEndpoint():undefined}
export function joinCandidates(primary:string,allowDedicated=true){return[...new Set([primary,legacyCasualEndpoint(),...(allowDedicated?[CASUAL_SERVICE_ORIGIN+'/api/casual',PH_SERVICE_ORIGIN+'/api/casual']:[])])]}
/** Production rooms choose the faster regional gateway; existing rooms stay pinned. */
export async function chooseCasualEndpoint(_mode?:string,_features?:{matchRounds?:number}){
 const configured=multiplayerEndpoint('casual');
 if(typeof location==='undefined'||!(/\.chatgpt\.site$|\.github\.io$/.test(location.hostname)||location.origin===CLOUDFLARE_WEBSITE_ORIGIN))return configured;
 const origin=new URL(configured,location.href).origin;
 if(origin!==location.origin&&!HOSTED_ORIGINS.includes(origin)&&!roomGateway(origin))return configured;
 if(typeof document==='undefined')return CASUAL_SERVICE_ORIGIN+'/api/casual';
 const key=location.origin,now=performance.now();if(!selectedGateway||selectedGateway.key!==key||selectedGateway.until<now)selectedGateway={key,until:now+60000,choice:selectRoomGateway().then(r=>r.origin)};
 return(await selectedGateway.choice)+'/api/casual';
}

export function arenaSessionEndpoint(origin:unknown){return sessionCasualEndpoint(origin).replace(/\/casual$/,'/arena')}
export async function chooseArenaEndpoint(){return(await chooseCasualEndpoint()).replace(/\/casual$/,'/arena')}
export function arenaJoinCandidates(primary:string,allowDedicated=true){return joinCandidates(primary.replace(/\/arena$/,'/casual'),allowDedicated).map(url=>url.replace(/\/casual$/,'/arena'))}
