import {CasualError} from './error.ts';
import {SOLITAIRE_VARIANTS,type SolitaireVariant,type SolPlace} from './solitaire.ts';
import {SKETCH_CATEGORIES} from './sketch-words.ts';
import {SKETCH_COLORS} from './sketch.ts';
export type NewGameSettings={solitaireVariant?:SolitaireVariant;sketchSeconds?:30|60|90|120;sketchRounds?:1|2|3|5;sketchCategory?:string};
export const NEW_GAME_ACTIONS=['sol-move','sol-draw','sol-remove','sol-undo','sol-restart','sol-concede','sketch-choose','sketch-stroke','sketch-clear','sketch-undo'];
export function newGameSettings(v:Record<string,unknown>):NewGameSettings{
 const out:NewGameSettings={};
 if(v.solitaireVariant!==undefined){if(!SOLITAIRE_VARIANTS.includes(v.solitaireVariant as SolitaireVariant))throw new CasualError('Choose a Solitaire variant.');out.solitaireVariant=v.solitaireVariant as SolitaireVariant}
 if(v.sketchSeconds!==undefined){if(![30,60,90,120].includes(v.sketchSeconds as number))throw new CasualError('Choose a drawing time.');out.sketchSeconds=v.sketchSeconds as NewGameSettings['sketchSeconds']}
 if(v.sketchRounds!==undefined){if(![1,2,3,5].includes(v.sketchRounds as number))throw new CasualError('Choose the number of drawing rounds.');out.sketchRounds=v.sketchRounds as NewGameSettings['sketchRounds']}
 if(v.sketchCategory!==undefined){if(!SKETCH_CATEGORIES.some(c=>c===v.sketchCategory))throw new CasualError('Choose a word collection.');out.sketchCategory=v.sketchCategory as string}return out;
}
function place(v:unknown):SolPlace{const p=v as SolPlace|null;if(!p||!['tableau','foundation','waste','cell'].includes(p.zone)||!Number.isInteger(p.index)||p.index<0||p.index>27||p.offset!==undefined&&(!Number.isInteger(p.offset)||p.offset<0||p.offset>103))throw new CasualError('Choose a card or pile.');return{zone:p.zone,index:p.index,...(p.offset!==undefined?{offset:p.offset}:{})}}
export function newGameActionFields(v:Record<string,unknown>):Record<string,unknown>{
 const action=String(v.action);if(!NEW_GAME_ACTIONS.includes(action))return{};
 if(!Number.isSafeInteger(v.round)||(v.round as number)<1)throw new CasualError('Choose the current round.');const out:Record<string,unknown>={round:v.round};
 if(action.startsWith('sol-')){if(!Number.isSafeInteger(v.boardVersion)||(v.boardVersion as number)<0)throw new CasualError('Use the current card layout.');out.boardVersion=v.boardVersion;if(action==='sol-move'){out.from=place(v.from);out.to=place(v.to)}if(action==='sol-remove'){if(!Array.isArray(v.cards)||v.cards.length<1||v.cards.length>2)throw new CasualError('Choose one or two exposed cards.');out.cards=v.cards.map(place)}return out}
 if(!Number.isSafeInteger(v.turn)||(v.turn as number)<1)throw new CasualError('Use the current drawing turn.');out.turn=v.turn;
 if(action==='sketch-choose'){if(!Number.isInteger(v.choice)||(v.choice as number)<0||(v.choice as number)>2)throw new CasualError('Choose a word.');out.choice=v.choice;return out}
 if(!Number.isSafeInteger(v.canvasEpoch)||(v.canvasEpoch as number)<0)throw new CasualError('Use the current canvas.');out.canvasEpoch=v.canvasEpoch;
 if(action==='sketch-stroke'){
  if(typeof v.strokeId!=='string'||!/^[a-zA-Z0-9-]{8,64}$/.test(v.strokeId)||!Number.isSafeInteger(v.seq)||(v.seq as number)<1||(v.seq as number)>1000)throw new CasualError('Use an ordered drawing segment.');
  if(!SKETCH_COLORS.some(c=>c===v.color)||!Number.isInteger(v.size)||(v.size as number)<2||(v.size as number)>32||typeof v.closed!=='boolean')throw new CasualError('Choose a valid brush.');
  if(!Array.isArray(v.points)||v.points.length>128||v.points.length%2||(!v.points.length&&!v.closed)||v.points.some((p,i)=>!Number.isInteger(p)||p<0||p>(i%2?650:1000)))throw new CasualError('Send a small, normalized drawing segment.');Object.assign(out,{strokeId:v.strokeId,seq:v.seq,color:v.color,size:v.size,points:v.points,closed:v.closed});
 }return out;
}
