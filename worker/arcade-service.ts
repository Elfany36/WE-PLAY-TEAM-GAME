import {CASUAL_MODES} from '../lib/casual/engine';
import {HOSTED_ORIGIN} from '../lib/multiplayer-config.ts';
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
  if(path==='/'&&(req.method==='GET'||req.method==='HEAD'))return new Response(null,{status:302,headers:{Location:HOSTED_ORIGIN+'/#casual-arcade','Cache-Control':'no-store'}});
  if(path==='/api/arena')return routeArena(req,env,task=>ctx.waitUntil(task),{legacyImport:false});
  if(path==='/api/casual')return routeCasual(req,env,task=>ctx.waitUntil(task),{legacyImport:false});
  if(path==='/api/health')return Response.json({ok:!!env.CASUAL_ROOMS&&!!env.ARENA_ROOMS,service:'markup-arcade',version:32,content:{games:CASUAL_MODES,maps:SNAKE_MAP_IDS,arenas:CLUB_MAPS.map(m=>m.id),tracks:TRACKS.map(t=>t.id),scenes:TABLE_SCENE_IDS},arcadeSimulation:'foreground-20hz',ai:'paced-space-and-shot-tactics-v4',mechanics:'arcade-v27',placementHint:'apac-se',snapshotIntervalMs:50,roomPersistence:'sqlite-sync',characterSetup:'optional-autosave',hiddenInformation:'seat-projected-generals-fleet',edgeColo:req.cf?.colo??null,notifications:'websocket-state-v2',roomStorage:env.CASUAL_ROOMS?'durable-object':'unavailable'},{status:env.CASUAL_ROOMS&&env.ARENA_ROOMS?200:503,headers:roomHeaders(req)});
  return Response.json({error:'Use /api/casual for arcade rooms.'},{status:404,headers:roomHeaders(req)});
 }
};
