/** Keep polling URLs stable so the browser can reuse its CORS preflight cache. */
export const ROOM_HINT_HEADERS={base:'X-Room-Base',revision:'X-Room-Revision',scene:'X-Room-Scene',worldRound:'X-Room-World-Round',worldVersion:'X-Room-World-Version'} as const;
export function roomHint(req:Request,key:keyof typeof ROOM_HINT_HEADERS){return req.headers.get(ROOM_HINT_HEADERS[key])??new URL(req.url).searchParams.get(key)}
export function stableRoomRequest(url:URL,init:RequestInit,base?:string){
 const headers=new Headers(init.headers);
 for(const [key,header]of Object.entries(ROOM_HINT_HEADERS)){
  const value=key==='base'?base??url.searchParams.get(key):url.searchParams.get(key);
  // Always send the same header names; values do not fragment preflight entries.
  headers.set(header,value??'');url.searchParams.delete(key);
 }
 return {...init,headers};
}
