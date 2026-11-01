import {env,waitUntil} from 'cloudflare:workers';
import {routeArena} from '../../../lib/arena-route';
export const dynamic='force-dynamic';
export function GET(req:Request){return routeArena(req,env,waitUntil)}
export function POST(req:Request){return routeArena(req,env,waitUntil)}
export function OPTIONS(req:Request){return routeArena(req,env,waitUntil)}
