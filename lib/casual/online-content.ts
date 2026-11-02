import type {CasualSettings} from './engine.ts';
import {SNAKE_MAP_IDS} from './maps.ts';
import {CLUB_MAPS} from './party.ts';
import {TRACKS} from './circuit.ts';
import {TABLE_SCENE_IDS} from './scenes.ts';
import {hasTableScene} from './scenes.ts';
export type OnlineContent={maps:string[];arenas:string[];tracks:string[];scenes:string[]};
/** A health timeout must never remove valid choices from the current release. */
export const BASE_ONLINE_CONTENT:OnlineContent={maps:[...SNAKE_MAP_IDS],arenas:CLUB_MAPS.map(m=>m.id),tracks:TRACKS.map(t=>t.id),scenes:[...TABLE_SCENE_IDS]};
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
