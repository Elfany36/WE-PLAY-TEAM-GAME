import {createCasualAPI} from './api.ts';

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
export async function routeCasual(req:Request,env:RoomEnv,keepAlive?:(task:Promise<unknown>)=>void):Promise<Response>{
 const direct=(db?:D1Database)=>{const api=createCasualAPI(db,keepAlive);return req.method==='GET'?api.GET(req):req.method==='POST'?api.POST(req):api.OPTIONS(req)};
 const rooms=env.CASUAL_ROOMS;
 if(!rooms)return direct(env.DB);
 if(req.method==='OPTIONS')return direct();
 let code:string|undefined,create=false,text:string|undefined;
 if(req.method==='GET')code=normalize(new URL(req.url).searchParams.get('code'));
 else if(req.method==='POST'){
  if(Number(req.headers.get('Content-Length'))>160000)return direct();
  let body:any;try{text=await req.clone().text();if(text.length>160000)return direct();body=JSON.parse(text)}catch{return direct()}
  if(body&&typeof body==='object'&&body.action==='create'){create=true;code=newRoomCode()}else code=normalize(body?.code);
 }
 if(!code)return direct();
 const headers=new Headers(req.headers);headers.delete('X-Room-Code');if(create)headers.set('X-Room-Code',code);
 // Rebuilt from parts: the framework's request object is not a native Request.
 const res=await rooms.get(rooms.idFromName('casual:'+code)).fetch(new Request(req.url,{method:req.method,headers,body:req.method==='POST'?text:undefined}));
 // Stub responses have immutable headers, which the framework still edits.
 return new Response(res.body,{status:res.status,statusText:res.statusText,headers:new Headers(res.headers)});
}
