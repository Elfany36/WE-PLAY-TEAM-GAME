import {routeCasual} from '../lib/casual/room-route';
import {roomHeaders} from '../lib/room-origin';
export {CasualRoom} from '../lib/casual/room-do';
/** Dedicated arcade service. Frontends talk directly to the room's authority. */
export default {
 async fetch(req:Request,env:Cloudflare.Env,ctx:ExecutionContext){
  const path=new URL(req.url).pathname;
  if(path==='/api/casual')return routeCasual(req,env,task=>ctx.waitUntil(task));
  if(path==='/api/health')return Response.json({ok:!!env.CASUAL_ROOMS,service:'markup-arcade',version:11,roomStorage:env.CASUAL_ROOMS?'durable-object':'unavailable'},{status:env.CASUAL_ROOMS?200:503,headers:roomHeaders(req)});
  return Response.json({error:'Use /api/casual for arcade rooms.'},{status:404,headers:roomHeaders(req)});
 }
};
