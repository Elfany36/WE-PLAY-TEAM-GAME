import {WEBSITE_THEME_IDS} from './website-themes.ts';
export type Progress = {name:string;done:string[];days:string[]};
export const emptyProgress: Progress = {name:'Builder',done:[],days:[]};
function validDay(value:string){if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;const parsed=new Date(value+'T00:00:00Z');return Number.isFinite(parsed.valueOf())&&parsed.toISOString().slice(0,10)===value;}
export function validateProgress(value: unknown): Progress {
  const v=(value&&typeof value==='object'?value:{}) as Partial<Progress>;
  return {name:typeof v.name==='string'&&v.name.trim().length>=2?v.name.trim().slice(0,20):'Builder',done:Array.isArray(v.done)?[...new Set(v.done.filter((x):x is string=>typeof x==='string'&&x.length<160))].slice(-5000):[],days:Array.isArray(v.days)?[...new Set(v.days.filter((x):x is string=>typeof x==='string'&&validDay(x)))]:[]};
}
export function readStored(key:string,fallback:any=null,session=false):any {try{if(typeof window==='undefined')return fallback;const raw=(session?sessionStorage:localStorage).getItem(key);return raw===null?fallback:JSON.parse(raw);}catch{return fallback}}
export function writeStored(key:string,value:unknown,session=false):boolean {try{(session?sessionStorage:localStorage).setItem(key,JSON.stringify(value));return true;}catch{return false}}
export function removeStored(key:string,session=false){try{(session?sessionStorage:localStorage).removeItem(key)}catch{}}
export function localDate(date=new Date()){return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;}
export function progressXP(p:Progress){return [...new Set(p.done)].reduce((total,id)=>total+(/^(?:html|css)-(?:[1-9]|1[0-2])$/.test(id)?100:/^challenge-[0-8]$/.test(id)?150:/^practice-(?:[0-9]|1[0-5])$/.test(id)?50:id==='arena-practice'||id==='arena-win'?100:0),0)}
export const themeInitScript="try{var t=JSON.parse(localStorage.getItem('markup-theme')||'null'),p=JSON.parse(localStorage.getItem('markup-site-theme')||'null');document.documentElement.dataset.theme=t==='light'||t==='dark'?t:(matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light');document.documentElement.dataset.siteTheme="+JSON.stringify(WEBSITE_THEME_IDS)+".includes(p)?p:'indigo'}catch(e){document.documentElement.dataset.theme='light';document.documentElement.dataset.siteTheme='indigo'}";
