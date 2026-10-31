const RELOAD_KEY='markup-room-view-reload';
/** Keep online membership when recovering a failed/stale game download. */
export function reloadRoomView(){try{sessionStorage.setItem(RELOAD_KEY,String(Date.now()+10000))}catch{}location.reload()}
/** Disconnect on navigation/tab close; only the explicit Leave action retires a seat. */
export function leaveRoomOnExit(endpoint:()=>string,session:()=>{code:string;token:string}|null,storageKey:string,canDisconnect:()=>boolean=()=>true){
 try{sessionStorage.removeItem(RELOAD_KEY)}catch{}
 let sent=false;
 const leave=()=>{try{if(Number(sessionStorage.getItem(RELOAD_KEY))>Date.now())return}catch{}const s=session();if(!s||sent||!canDisconnect())return;sent=true;
  void fetch(endpoint(),{method:'POST',credentials:'omit',mode:'cors',keepalive:true,headers:{'Content-Type':'application/json',Authorization:'Bearer '+s.token},body:JSON.stringify({action:'disconnect',code:s.code,requestId:crypto.randomUUID()})}).catch(()=>{});
 };
 const pageHide=(event:PageTransitionEvent)=>{if(!event.persisted)leave()};
 window.addEventListener('pagehide',pageHide);
 return()=>{window.removeEventListener('pagehide',pageHide);leave()};
}
