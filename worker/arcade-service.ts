import {SNAKE_MAP_IDS} from '../lib/casual/maps';
import {CLUB_MAPS} from '../lib/casual/party';
import {TRACKS} from '../lib/casual/circuit';
import {TABLE_SCENE_IDS} from '../lib/casual/scenes';
import {routeArena} from '../lib/arena-route';
import {routeCasual} from '../lib/casual/room-route';
import {roomHeaders} from '../lib/room-origin';
export {CasualRoom,ArenaRoom} from '../lib/casual/room-do';
/** Dedicated arcade service. Frontends talk directly to the room's authority. */
export default {
 async fetch(req:Request,env:Cloudflare.Env,ctx:ExecutionContext){
  const path=new URL(req.url).pathname;
  if(path==='/'&&(req.method==='GET'||req.method==='HEAD'))return new Response(null,{status:302,headers:{Location:'https://markup-learn-play-together.brightbunch.chatgpt.site/#casual-arcade','Cache-Control':'no-store'}});
  if(path==='/api/arena')return routeArena(req,env,task=>ctx.waitUntil(task),{legacyImport:false});
  if(path==='/api/casual')return routeCasual(req,env,task=>ctx.waitUntil(task),{legacyImport:false});
  if(path==='/api/health')return Response.json({ok:!!env.CASUAL_ROOMS&&!!env.ARENA_ROOMS,service:'markup-arcade',version:19,content:{maps:SNAKE_MAP_IDS,arenas:CLUB_MAPS.map(m=>m.id),tracks:TRACKS.map(t=>t.id),scenes:TABLE_SCENE_IDS},arcadeSimulation:'foreground-20hz',ai:'paced-personalities-v3',mechanics:'arcade-v17',placementHint:'apac-se',edgeColo:req.cf?.colo??null,notifications:'websocket-state-v2',roomStorage:env.CASUAL_ROOMS?'durable-object':'unavailable'},{status:env.CASUAL_ROOMS&&env.ARENA_ROOMS?200:503,headers:roomHeaders(req)});
  return Response.json({error:'Use /api/casual for arcade rooms.'},{status:404,headers:roomHeaders(req)});
 }
};
