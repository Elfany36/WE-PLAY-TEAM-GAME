import {CASUAL_MODES} from '../../../lib/casual/engine';
import {BASE_ONLINE_CONTENT} from '../../../lib/casual/online-content';
import {env} from 'cloudflare:workers';
export const dynamic='force-dynamic';
export async function GET(){try{if(!env.DB)return Response.json({ok:false},{status:503});await env.DB.prepare('SELECT code FROM arena_rooms LIMIT 1').first();await env.DB.prepare('SELECT code FROM casual_rooms LIMIT 1').first();return Response.json({ok:true,service:'markup-arena',version:33,content:{...BASE_ONLINE_CONTENT,games:CASUAL_MODES},arenaStorage:env.ARENA_ROOMS?'durable-object':'d1',roomStorage:env.CASUAL_ROOMS?'durable-object':'d1'},{headers:{'Cache-Control':'no-store'}});}catch{return Response.json({ok:false},{status:503})}}
