import {env} from 'cloudflare:workers';
import {createCasualAPI} from '../../../lib/casual/api';
export const dynamic='force-dynamic';
export function GET(req:Request){return createCasualAPI(env.DB).GET(req)}
export function POST(req:Request){return createCasualAPI(env.DB).POST(req)}
export function OPTIONS(req:Request){return createCasualAPI(env.DB).OPTIONS(req)}
