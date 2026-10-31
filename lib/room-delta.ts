/** Compact, immutable presentation deltas. Authority always remains in room storage. */
export type RoomDelta=[0,any]|[1,Record<string,RoomDelta>,string[]?]|[2,number,Record<string,RoomDelta>]|[3,number,any[]];
const record=(v:any)=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const cell=(v:any)=>record(v)&&typeof v.x==='number'&&typeof v.y==='number'&&Object.keys(v).length===2;
export function diffRoom(a:any,b:any):RoomDelta|undefined{
 if(a===b)return;
 if(Array.isArray(a)&&Array.isArray(b)){
  // A Snake body is a new head followed by the previous body. Send only new heads.
  if(a.length&&b.length&&cell(a[0])&&cell(b[0]))for(let shift=0;shift<=Math.min(12,b.length);shift++){
   if(b.length-shift>a.length||shift===b.length)continue;let same=true;
   for(let i=shift;i<b.length;i++)if(!b[i]||a[i-shift]?.x!==b[i].x||a[i-shift]?.y!==b[i].y){same=false;break}
   if(same)return shift===0&&a.length===b.length?undefined:[3,b.length,b.slice(0,shift)];
  }
  const changes:Record<string,RoomDelta>={};let count=0;
  for(let i=0;i<b.length;i++){const d=diffRoom(a[i],b[i]);if(d){changes[i]=d;count++}}
  if(!count&&a.length===b.length)return;
  // Dense changes cost less as a replacement than as indexed operations.
  return count>b.length*.6&&Object.values(changes).every(d=>d[0]===0)?[0,b]:[2,b.length,changes];
 }
 if(record(a)&&record(b)){
  const changes:Record<string,RoomDelta>={},removed:string[]=[];let count=0;
  for(const key of Object.keys(b)){const d=diffRoom(a[key],b[key]);if(d){changes[key]=d;count++}}
  for(const key of Object.keys(a))if(!(key in b))removed.push(key);
  if(!count&&!removed.length)return;return removed.length?[1,changes,removed]:[1,changes];
 }
 return[0,b];
}
export function applyRoomDelta(base:any,delta:RoomDelta):any{
 if(delta[0]===0)return delta[1];
 if(delta[0]===3)return[...delta[2],...base].slice(0,delta[1]);
 if(delta[0]===2){const result=Array.isArray(base)?base.slice(0,delta[1]):[];result.length=delta[1];for(const key of Object.keys(delta[2]))result[Number(key)]=applyRoomDelta(base?.[key],delta[2][key]);return result}
 const result={...base};for(const key of delta[2]||[])delete result[key];for(const key of Object.keys(delta[1]))if(!['__proto__','constructor','prototype'].includes(key))result[key]=applyRoomDelta(base?.[key],delta[1][key]);return result;
}
/** Quantize presentation coordinates only; stored physics and rule values stay exact. */
export function wireRoom(value:any,key=''):any{if(typeof value==='number'&&['x','y','vx','vy','speed','angle','steering','drifting'].includes(key))return Math.round(value*1000)/1000;if(Array.isArray(value))return value.map(v=>wireRoom(v));if(record(value)){const result:Record<string,any>={};for(const k of Object.keys(value))if(value[k]!==undefined)result[k]=wireRoom(value[k],k);return result}return value}
