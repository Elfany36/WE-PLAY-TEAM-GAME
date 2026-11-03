import {ROOM_HINT_HEADERS} from './room-params.ts';
import {HOSTED_ORIGINS} from './multiplayer-config.ts';
const frontends=new Set([...HOSTED_ORIGINS,'https://we-play-team-game.kendsfabros.workers.dev','https://elfany36.github.io','http://localhost:5173','http://127.0.0.1:5173','http://localhost:4173','http://127.0.0.1:4173','http://terminal.local:4173']);
export function roomOriginAllowed(req:Request){const origin=req.headers.get('Origin');return !origin||origin===new URL(req.url).origin||frontends.has(origin)}
export function roomHeaders(req:Request){const origin=req.headers.get('Origin');return {'Cache-Control':'no-store','Vary':'Origin',...(origin&&roomOriginAllowed(req)?{'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':['Content-Type','Authorization',...Object.values(ROOM_HINT_HEADERS)].join(','),'Access-Control-Max-Age':'600'}:{})}}
