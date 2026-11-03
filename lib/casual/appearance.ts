import {ARCADE_COLORS} from './arcade-colors.ts';
import {CasualError} from './error.ts';
import {MODEL_SETS,type ModelFamily} from './model-catalog.ts';
export {MODEL_SETS,MODEL_COLLECTIONS,CUSTOM_COLORS,modelFamily,modelLabel,type ModelFamily,type GameModelFamily} from './model-catalog.ts';
export type Appearance={color?:string;models?:Partial<Record<ModelFamily,string>>;avatar?:string;useAvatar?:boolean};
/** Allowlisted cosmetics only. Avatar versions can only be assigned by the upload API. */
export function validateAppearance(value:unknown):Appearance{
 if(!value||typeof value!=='object'||Array.isArray(value))throw new CasualError('Choose a valid character appearance.');
 const v=value as Record<string,unknown>,out:Appearance={};
 if(v.color!==undefined){if(typeof v.color!=='string'||!/^#[a-f\d]{6}$/i.test(v.color))throw new CasualError('Choose a six-digit color.');out.color=v.color.toLowerCase()}
 if(v.useAvatar!==undefined){if(typeof v.useAvatar!=='boolean')throw new CasualError('Choose a valid image setting.');out.useAvatar=v.useAvatar}
 if(v.models!==undefined){if(!v.models||typeof v.models!=='object'||Array.isArray(v.models))throw new CasualError('Choose a valid model.');out.models={};for(const [key,id]of Object.entries(v.models)){if(!Object.hasOwn(MODEL_SETS,key)||typeof id!=='string'||!(MODEL_SETS[key as ModelFamily] as readonly string[]).includes(id))throw new CasualError('Choose a model from the collection.');out.models[key as ModelFamily]=id}}
 return out;
}
export function playerColor(p?:{color:number;appearance?:Appearance}){const fallback=ARCADE_COLORS[(p?.color||0)%ARCADE_COLORS.length],fill=p?.appearance?.color;if(!fill)return fallback;const [r,g,b]=fill.slice(1).match(/../g)!.map(x=>parseInt(x,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4),luminance=r*.2126+g*.7152+b*.0722;return{fill,ink:1.05/(luminance+.05)>=4.5?'#ffffff':'#000000'}}
export function playerModel(p:{color:number;appearance?:Appearance}|undefined,family:ModelFamily){
 const saved=p?.appearance?.models?.[family];if(saved&&MODEL_SETS[family].includes(saved))return saved;
 const legacy=['chess','dama','scidama'].includes(family)?p?.appearance?.models?.board:undefined;
 if(legacy&&MODEL_SETS[family].includes(legacy))return legacy;
 return family==='token'?MODEL_SETS.token[(p?.color||0)%MODEL_SETS.token.length]:MODEL_SETS[family][0];
}
