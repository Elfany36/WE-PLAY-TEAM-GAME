import {env} from 'cloudflare:workers';
import {createArenaAPI} from '../../../lib/arena-api';
export const dynamic='force-dynamic';
export function GET(req:Request){return createArenaAPI(env.DB).GET(req)}
export function POST(req:Request){return createArenaAPI(env.DB).POST(req)}
export function OPTIONS(req:Request){return createArenaAPI(env.DB).OPTIONS(req)}
