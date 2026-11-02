import {roomStub} from '../room-placement.ts';
import {createCasualAPI,casualBody,casualFailure} from './api.ts';
import {roomOriginAllowed} from '../room-origin.ts';
import {CasualError} from './error.ts';

type RoomEnv={CASUAL_ROOMS?:DurableObjectNamespace;DB?:D1Database};
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
export async function routeCasual(req:Request,env:RoomEnv,keepAlive?:(task:Promise<unknown>)=>void,options:{legacyImport?:boolean}={}):Promise<Response>{
 if(!['GET','POST','OPTIONS'].includes(req.method))return casualFailure(req,new CasualError('Method not allowed.',405));
 let request=req;
 const direct=(db?:D1Database)=>{const api=createCasualAPI(db,keepAlive);return request.method==='GET'?api.GET(request):request.method==='POST'?api.POST(request):api.OPTIONS(request)};
 const rooms=env.CASUAL_ROOMS;
 if(!rooms)return direct(env.DB);
 if(req.method==='OPTIONS')return direct();
 if(req.headers.has('Origin')&&!roomOriginAllowed(req))return casualFailure(req,new CasualError('This frontend is not allowed to use these rooms.',403));
 let code:string|undefined,create=false,text:string|undefined;
 if(req.method==='GET')code=normalize(new URL(req.url).searchParams.get('code'));
 else if(req.method==='POST'){
  let body:Record<string,unknown>;try{body=await casualBody(req);text=JSON.stringify(body)}catch(error){return casualFailure(req,error)}
  request=new Request(req.url,{method:req.method,headers:req.headers,body:text});
  if(body&&typeof body==='object'&&body.action==='create'){create=true;code=newRoomCode()}else code=normalize(body?.code);
 }
 if(!code)return direct();
 const headers=new Headers(req.headers);headers.delete('X-Room-Code');headers.set('X-Room-Key',code);headers.set('X-Room-Legacy',options.legacyImport===false?'deny':'allow');if(create)headers.set('X-Room-Code',code);
 // Rebuilt from parts: the framework's request object is not a native Request.
 let res:Response;
 try{res=await roomStub(rooms,'casual:'+code).fetch(new Request(req.url,{method:req.method,headers,body:req.method==='POST'?text:undefined}))}
 catch{return casualFailure(req,new CasualError('The room service is reconnecting. Please try again.',503))}
 if(res.status===101&&res.webSocket)return new Response(null,{status:101,headers:new Headers(res.headers),webSocket:res.webSocket});
 // Stub responses have immutable headers, which the framework still edits.
 return new Response(res.body,{status:res.status,statusText:res.statusText,headers:new Headers(res.headers)});
}
