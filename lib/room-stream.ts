import {ROOM_HINT_HEADERS} from './room-params.ts';

export const STATE_INTERVAL=50,MAX_STATE_WINDOW=64;
/** Keep the reliable pipe full over slow round trips, with a hard memory bound. */
export function stateWindow(rtt:number){return Number.isFinite(rtt)?Math.max(4,Math.min(MAX_STATE_WINDOW,Math.ceil(Math.max(0,rtt)/STATE_INTERVAL)+3)):4}
export const fastControls=new Set(['direction','drive','explore','party-control','block-input','pirate-input']);

/** Rebuild a room-scoped request; sockets cannot select another room or mint seats. */
export function roomStreamRequest(value:any,code:string,kind:'casual'|'arena'){
 const fail=(message:string)=>{throw Object.assign(Error(message),{status:400})};
 if(typeof value.id!=='string'||!/^[0-9]{1,16}$/.test(value.id)||!['GET','POST'].includes(value.method))fail('Invalid room request.');
 const url=new URL('https://room.internal/api/'+kind);url.searchParams.set('code',code);url.searchParams.set('wire','1');
 const headers=new Headers();
 for(const [key,header]of Object.entries(ROOM_HINT_HEADERS)){
  const hint=value.hints?.[key];if(hint!==undefined&&(typeof hint!=='string'||hint.length>128))fail('Invalid snapshot hint.');if(hint)headers.set(header,hint);
 }
 if(value.method==='GET')return new Request(url,{headers});
 const body=value.body;
 if(!body||typeof body!=='object'||Array.isArray(body)||body.code!==code||['create','join','leave','disconnect','draft-phone','submit-phone'].includes(body.action))fail('Use your current room and seat.');
 const text=JSON.stringify(body);if(new TextEncoder().encode(text).length>4000)fail('The room request is too large.');
 headers.set('Content-Type','application/json');if(value.receiptOnly===true&&kind==='casual'&&fastControls.has(body.action))headers.set('X-Room-Control-Receipt','1');return new Request(url,{method:'POST',headers,body:text});
}
