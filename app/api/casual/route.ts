import {env,waitUntil} from 'cloudflare:workers';
import {createCasualAPI} from '../../../lib/casual/api';
export const dynamic='force-dynamic';
export function GET(req:Request){return createCasualAPI(env.DB,waitUntil).GET(req)}
export function POST(req:Request){return createCasualAPI(env.DB,waitUntil).POST(req)}
export function OPTIONS(req:Request){return createCasualAPI(env.DB,waitUntil).OPTIONS(req)}
