import {CasualError} from './error.ts';
export const AVATAR_SIZE=128,AVATAR_MAX_BYTES=70000;
/** Only a small, static PNG produced by the client's cropper is accepted. */
export function avatarBytes(value:unknown):Uint8Array{
 if(typeof value!=='string'||value.length>AVATAR_MAX_BYTES*4/3+32||!/^data:image\/png;base64,[A-Za-z0-9+/]+=*$/.test(value))throw new CasualError('Upload a PNG portrait cropped to 128 × 128.');
 let raw:string;try{raw=atob(value.slice(22))}catch{throw new CasualError('This image could not be read.')}
 const b=Uint8Array.from(raw,c=>c.charCodeAt(0));if(b.length>AVATAR_MAX_BYTES||b.length<45||[137,80,78,71,13,10,26,10].some((v,i)=>b[i]!==v))throw new CasualError('This PNG is invalid or too large.');
 const v=new DataView(b.buffer);let offset=8,header=false,data=false,end=false;
 while(offset+12<=b.length){const size=v.getUint32(offset),type=String.fromCharCode(...b.slice(offset+4,offset+8));if(size>b.length-offset-12)throw new CasualError('This PNG is incomplete.');
  if(type==='IHDR'){if(header||offset!==8||size!==13||v.getUint32(offset+8)!==128||v.getUint32(offset+12)!==128||b[offset+16]!==8||![2,6].includes(b[offset+17])||b[offset+18]||b[offset+19]||b[offset+20])throw new CasualError('Use a static 128 × 128 RGB portrait.');header=true}
  else if(type==='IDAT')data=true;
  else if(type==='IEND'){if(size||offset+12!==b.length)throw new CasualError('This PNG has trailing data.');end=true}
  else if(!['sRGB','gAMA','cHRM','pHYs'].includes(type))throw new CasualError('Upload a static portrait without embedded metadata.');
  offset+=size+12;
 }
 if(!header||!data||!end||offset!==b.length)throw new CasualError('This PNG is incomplete.');return b;
}
export async function avatarHash(bytes:Uint8Array){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes as Uint8Array<ArrayBuffer>)),b=>b.toString(16).padStart(2,'0')).join('')}
