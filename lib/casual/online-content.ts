import type {CasualSettings} from './engine.ts';
import {hasTableScene} from './scenes.ts';
export type OnlineContent={maps:string[];arenas:string[];tracks:string[];scenes:string[]};
/** Baseline content remains usable while the frontend and room server update separately. */
export const BASE_ONLINE_CONTENT:OnlineContent={maps:['classic','ruins','crossroads','islands','switchback','neon','citadel','orbit'],arenas:['garden','canyon','neon','harbor','foundry'],tracks:['meadow','coast','night','ridge'],scenes:['garden','midnight','sunset','aurora']};
export function readOnlineContent(value:unknown):OnlineContent{
 const data=value as {content?:OnlineContent}|null,content=data?.content;
 if(!content||!(['maps','arenas','tracks','scenes'] as const).every(k=>Array.isArray(content[k])&&content[k].length<=64&&content[k].every(id=>typeof id==='string'&&/^[a-z-]{1,24}$/.test(id))))return BASE_ONLINE_CONTENT;
 return content;
}
export function onlineContentAvailable(mode:string,settings:CasualSettings,content:OnlineContent){
 if(mode==='terra')return true;
 if(mode==='snake'&&!content.maps.includes(settings.map||'classic'))return false;
 if(mode==='circuit'&&!content.tracks.includes(settings.track||'meadow'))return false;
 if(['sumo','tanks','pong','marble'].includes(mode)&&!content.arenas.includes(settings.arena||'garden'))return false;
 return !hasTableScene(mode)||content.scenes.includes(settings.scene||'garden');
}
