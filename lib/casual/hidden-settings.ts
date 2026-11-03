import {CasualError} from './error.ts';
export type HiddenSettings={tacticalSeconds?:0|30|60|120;fleetSize?:8|10|12;fleetStyle?:'naval'|'air'|'road'|'island';fleetTurn?:'chain'|'alternate'};
export function hiddenSettings(value:Record<string,any>):HiddenSettings{const out:Record<string,any>={};for(const [key,choices]of Object.entries({tacticalSeconds:[0,30,60,120],fleetSize:[8,10,12],fleetStyle:['naval','air','road','island'],fleetTurn:['chain','alternate']}))if(value[key]!==undefined){if(!(choices as any[]).includes(value[key]))throw new CasualError('Choose a valid tactical game setting.');out[key]=value[key]}return out}
export const HIDDEN_ACTIONS=['place-generals','shuffle-generals','deploy-generals','move-generals','place-fleet','shuffle-fleet','clear-fleet','deploy-fleet','fire-fleet','resign-hidden','draw-hidden','decline-hidden'];
export function hiddenActionFields(value:Record<string,any>){
 if(['place-generals','move-generals'].includes(value.action)){if(![value.from,value.to].every(n=>Number.isInteger(n)&&n>=0&&n<72))throw new CasualError('Choose a square on the Generals board.');return{from:value.from,to:value.to}}
 if(value.action==='place-fleet'){if(!['carrier','cruiser','frigate','submarine','patrol'].includes(value.unit)||![value.x,value.y].every(n=>Number.isInteger(n)&&n>=0&&n<12)||typeof value.vertical!=='boolean')throw new CasualError('Choose a model, grid location and orientation.');return{unit:value.unit,x:value.x,y:value.y,vertical:value.vertical}}
 if(value.action==='fire-fleet'){if(!Number.isInteger(value.cell)||value.cell<0||value.cell>=144)throw new CasualError('Choose a target tile.');return{cell:value.cell}}return{};
}
