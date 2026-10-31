import {env,waitUntil} from 'cloudflare:workers';
import {routeCasual} from '../../../lib/casual/room-route';
export const dynamic='force-dynamic';
export function GET(req:Request){return routeCasual(req,env,waitUntil)}
export function POST(req:Request){return routeCasual(req,env,waitUntil)}
export function OPTIONS(req:Request){return routeCasual(req,env,waitUntil)}
