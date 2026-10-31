/** Leave on navigation or tab close. Keepalive is best effort when the network is offline. */
export function leaveRoomOnExit(endpoint:()=>string,session:()=>{code:string;token:string}|null,storageKey:string){
 let sent=false;
 const leave=()=>{const s=session();if(!s||sent)return;sent=true;try{sessionStorage.removeItem(storageKey)}catch{}
  void fetch(endpoint(),{method:'POST',credentials:'omit',mode:'cors',keepalive:true,headers:{'Content-Type':'application/json',Authorization:'Bearer '+s.token},body:JSON.stringify({action:'leave',code:s.code,requestId:crypto.randomUUID()})}).catch(()=>{});
 };
 const pageHide=(event:PageTransitionEvent)=>{if(!event.persisted)leave()};
 window.addEventListener('pagehide',pageHide);
 return()=>{window.removeEventListener('pagehide',pageHide);leave()};
}
