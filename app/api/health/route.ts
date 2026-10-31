import {env} from 'cloudflare:workers';
export const dynamic='force-dynamic';
export async function GET(){try{if(!env.DB)return Response.json({ok:false},{status:503});await env.DB.prepare('SELECT code FROM arena_rooms LIMIT 1').first();await env.DB.prepare('SELECT code FROM casual_rooms LIMIT 1').first();return Response.json({ok:true,service:'markup-arena',version:10},{headers:{'Cache-Control':'no-store'}});}catch{return Response.json({ok:false},{status:503})}}
