import {CASUAL_MODES} from '../../lib/casual/engine.ts';
import {modelFamily,MODEL_SETS} from '../../lib/casual/appearance.ts';
type API={POST:(req:Request)=>Promise<Response>;GET?:(req:Request)=>Promise<Response>};
const sessions=new WeakMap<API,Map<string,Map<string,string>>>();let serial=0;
/** Gameplay fixtures follow the same explicit character-confirmation step as the UI.
 * Readiness-denial tests use the raw API instead. */
export async function postWithCharacters(api:API,request:Request){
 const body:any=await request.clone().json().catch(()=>null),get=api.GET;
 if(body?.action==='start'&&get){
  for(const [id,token]of sessions.get(api)?.get(body.code)||[]){
   const headers=new Headers(request.headers);headers.set('Authorization','Bearer '+token);headers.delete('X-Room-Control-Receipt');
   const read=await get(new Request(request.url.split('?')[0]+'?code='+body.code,{headers}));const {room}=await read.json() as any;
   if(!room||!CASUAL_MODES.includes(room.mode))continue;
   const player=room?.players.find((p:any)=>p.id===id);if(!player||player.retired||player.role==='spectator')continue;
   const family=modelFamily(room.mode),appearance={...player.appearance,models:{...player.appearance?.models,[family]:player.appearance?.models?.[family]||MODEL_SETS[family][0]}};
   const confirmation=await api.POST(new Request(request.url,{method:'POST',headers,body:JSON.stringify({action:'appearance',code:body.code,appearance,confirmCharacter:true,confirmForRound:room.round+1,requestId:'fixture-confirm-'+ ++serial})}));
   if(!confirmation.ok)throw Error('Fixture character confirmation failed: '+await confirmation.text());
  }
 }
 const response=await api.POST(request);
 if(response.ok&&['create','join'].includes(body?.action)){const data=await response.clone().json() as any;if(data.token&&data.room){let rooms=sessions.get(api);if(!rooms){rooms=new Map();sessions.set(api,rooms)}let members=rooms.get(data.room.code);if(!members){members=new Map();rooms.set(data.room.code,members)}members.set(data.room.youId,data.token)}}
 return response;
}
