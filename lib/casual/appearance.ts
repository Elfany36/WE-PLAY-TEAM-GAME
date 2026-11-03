import {ARCADE_COLORS} from './arcade-colors.ts';
import {CasualError} from './error.ts';
export const MODEL_SETS={
 token:['pawn','rocket','fox','leaf','boat','cat','crown','gem'],
 kart:['classic','formula','buggy','mini','van','hover','hotrod'],
 tank:['classic','scout','bulwark','twin'],
 snake:['classic','coral','dragon','robot'],
 sumo:['classic','masked','robot','bear'],
 marble:['classic','orbit','star','prism'],
 board:['classic','crystal','wood','neon'],
} as const;
export type ModelFamily=keyof typeof MODEL_SETS;
export type Appearance={color?:string;models?:Partial<Record<ModelFamily,string>>;avatar?:string;useAvatar?:boolean};
export const MODEL_LABELS:Record<string,string>={pawn:'Classic pawn',rocket:'Rocket',fox:'Fox',leaf:'Sprout',boat:'Sailboat',cat:'Cat',crown:'Crown',gem:'Gem',classic:'Club classic',formula:'Formula',buggy:'Dune buggy',mini:'Mini coupe',van:'Camper van',hover:'Hover pod',hotrod:'Hot rod',scout:'Scout',bulwark:'Bulwark',twin:'Twin barrel',coral:'Coral stripes',dragon:'Dragon',robot:'Robot',masked:'Masked hero',bear:'Bear',orbit:'Orbit',star:'Star',prism:'Prism',crystal:'Crystal',wood:'Carved wood',neon:'Neon'};
export function modelFamily(mode:string):ModelFamily{return mode==='circuit'?'kart':mode==='tanks'?'tank':['chess','dama','scidama'].includes(mode)?'board':mode==='snake'?'snake':mode==='sumo'?'sumo':mode==='marble'?'marble':'token'}
/** Allowlisted cosmetics only. Avatar versions can only be assigned by the upload API. */
export function validateAppearance(value:unknown):Appearance{
 if(!value||typeof value!=='object'||Array.isArray(value))throw new CasualError('Choose a valid character appearance.');
 const v=value as Record<string,unknown>,out:Appearance={};
 if(v.color!==undefined){if(typeof v.color!=='string'||!/^#[a-f\d]{6}$/i.test(v.color))throw new CasualError('Choose a six-digit color.');out.color=v.color.toLowerCase()}
 if(v.useAvatar!==undefined){if(typeof v.useAvatar!=='boolean')throw new CasualError('Choose a valid image setting.');out.useAvatar=v.useAvatar}
 if(v.models!==undefined){if(!v.models||typeof v.models!=='object'||Array.isArray(v.models))throw new CasualError('Choose a valid model.');out.models={};for(const [key,id]of Object.entries(v.models)){if(!Object.hasOwn(MODEL_SETS,key)||typeof id!=='string'||!(MODEL_SETS[key as ModelFamily] as readonly string[]).includes(id))throw new CasualError('Choose a model from the collection.');out.models[key as ModelFamily]=id}}
 return out;
}
export function playerColor(p?:{color:number;appearance?:Appearance}){const fallback=ARCADE_COLORS[(p?.color||0)%ARCADE_COLORS.length],fill=p?.appearance?.color;if(!fill)return fallback;const [r,g,b]=fill.slice(1).match(/../g)!.map(x=>parseInt(x,16)/255);return{fill,ink:r*.2126+g*.7152+b*.0722>.48?'#142536':'#f4f6ea'}}
export function playerModel(p:{color:number;appearance?:Appearance}|undefined,family:ModelFamily){return p?.appearance?.models?.[family]||(family==='token'?MODEL_SETS.token[(p?.color||0)%8]:'classic')}
