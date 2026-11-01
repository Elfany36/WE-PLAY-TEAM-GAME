import {roomStub} from './room-placement.ts';
import {createArenaAPI} from './arena-api.ts';
import {readArenaBody} from './arena-request.ts';
import {roomHeaders} from './room-origin.ts';
function failure(req:Request,e:unknown){const error=e as {status?:number;message?:string};return Response.json({error:error.message||'Could not route this room.'},{status:error.status||503,headers:roomHeaders(req)})}
import {roomOriginAllowed} from './room-origin.ts';
import {ArenaError} from './arena-engine.ts';

type RoomEnv={ARENA_ROOMS?:DurableObjectNamespace;DB?:D1Database};
const CODE=/^[A-HJ-NP-Z2-9]{8}$/;
const ALPHABET='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const normalize=(value:unknown)=>typeof value==='string'&&CODE.test(value.trim().toUpperCase())?value.trim().toUpperCase():undefined;
function newRoomCode(){let code='';for(let i=0;i<8;i++)code+=ALPHABET[crypto.getRandomValues(new Uint8Array(1))[0]%32];return code}

/**
 * Send each request to the Durable Object that owns its room. Requests whose
 * code cannot be read are answered by the room API without storage, which
 * returns the same validation errors as before. With no Durable Object binding
 * (local tooling) the original D1 path is used.
 */
export async function routeArena(req:Request,env:RoomEnv,keepAlive?:(task:Promise<unknown>)=>void,options:{legacyImport?:boolean}={}):Promise<Response>{
 let request=req;
 const direct=(db?:D1Database)=>{const api=createArenaAPI(db,keepAlive);return request.method==='GET'?api.GET(request):request.method==='POST'?api.POST(request):api.OPTIONS(request)};
 const rooms=env.ARENA_ROOMS;
 if(!rooms)return direct(env.DB);
 if(req.method==='OPTIONS')return direct();
 if(req.headers.has('Origin')&&!roomOriginAllowed(req))return failure(req,new ArenaError('This frontend is not allowed to use these rooms.',403));
 let code:string|undefined,create=false,text:string|undefined;
 if(req.method==='GET')code=normalize(new URL(req.url).searchParams.get('code'));
 else if(req.method==='POST'){
  let body:Record<string,unknown>;try{body=await readArenaBody(req);text=JSON.stringify(body)}catch(error){return failure(req,error)}
  request=new Request(req.url,{method:req.method,headers:req.headers,body:text});
  if(body&&typeof body==='object'&&body.action==='create'){create=true;code=newRoomCode()}else code=normalize(body?.code);
 }
 if(!code)return direct();
 const headers=new Headers(req.headers);headers.delete('X-Room-Code');headers.set('X-Room-Key',code);headers.set('X-Room-Legacy',options.legacyImport===false?'deny':'allow');if(create)headers.set('X-Room-Code',code);
 // Rebuilt from parts: the framework's request object is not a native Request.
 const res=await roomStub(rooms,'arena:'+code).fetch(new Request(req.url,{method:req.method,headers,body:req.method==='POST'?text:undefined}));
 if(res.status===101&&res.webSocket)return new Response(null,{status:101,headers:new Headers(res.headers),webSocket:res.webSocket});
 // Stub responses have immutable headers, which the framework still edits.
 return new Response(res.body,{status:res.status,statusText:res.statusText,headers:new Headers(res.headers)});
}
