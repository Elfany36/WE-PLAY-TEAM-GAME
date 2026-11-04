'use client';
import {RotateCcw,Sun,Moon,Grid2X2} from 'lucide-react';
export type PreviewState={piece:string;dark:boolean;king:boolean;value:number;part:string;angle:number;background:'light'|'dark'|'grid'};
export const DEFAULT_PREVIEW:PreviewState={piece:'k',dark:false,king:false,value:90,part:'whole',angle:0,background:'grid'};
export default function ModelPreviewTools({family,value,onChange,onReset}:{family:string;value:PreviewState;onChange:(value:PreviewState)=>void;onReset?:()=>void}){
 const set=(patch:Partial<PreviewState>)=>onChange({...value,...patch});
 return <details className="model-preview-tools"><summary>Preview options <small>View only · your game stays the same</small></summary><div className="model-preview-fields">
 {family==='chess'&&<label>Preview piece<select aria-label="Preview chess piece" value={value.piece} onChange={e=>set({piece:e.target.value})}>{[['k','King'],['q','Queen'],['r','Rook'],['b','Bishop'],['n','Knight'],['p','Pawn']].map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label>}
 {['chess','dama','scidama'].includes(family)&&<label>Board side<select aria-label="Preview board side" value={value.dark?'dark':'light'} onChange={e=>set({dark:e.target.value==='dark'})}><option value="light">Light side</option><option value="dark">Dark side</option></select></label>}
 {['dama','scidama'].includes(family)&&<label>Piece status<select aria-label="Preview piece status" value={value.king?'king':'regular'} onChange={e=>set({king:e.target.value==='king'})}><option value="regular">Regular piece</option><option value="king">Crowned piece</option></select></label>}
 {family==='scidama'&&<label>Water value<select aria-label="Preview water value" value={value.value} onChange={e=>set({value:+e.target.value})}>{[5,10,25,30,45,50,65,70,85,90,105,110].map(n=><option key={n} value={n}>{n} m³</option>)}</select></label>}
 {family==='snake'&&<label>Snake view<select aria-label="Preview snake view" value={value.part} onChange={e=>set({part:e.target.value})}><option value="whole">Whole snake</option><option value="head">Head detail</option></select></label>}
 {family==='tank'&&<label>Tank view<select aria-label="Preview tank view" value={value.part} onChange={e=>set({part:e.target.value})}><option value="whole">Complete tank</option><option value="hull">Hull detail</option><option value="turret">Turret detail</option></select></label>}
 <label className="preview-angle">View angle <span>{value.angle}°</span><input aria-label="Model preview rotation" type="range" min="0" max="360" step="15" value={value.angle} onChange={e=>set({angle:+e.target.value})}/></label>
 <div className="preview-background-picker" role="group" aria-label="Model preview background">{([['light','Light',Sun],['dark','Dark',Moon],['grid','Grid',Grid2X2]] as const).map(([id,label,Icon])=><button type="button" key={id} aria-pressed={value.background===id} onClick={()=>set({background:id})}><Icon size={14}/>{label}</button>)}</div>
 <button type="button" className="preview-reset" onClick={()=>{onChange({...DEFAULT_PREVIEW});onReset?.()}}><RotateCcw size={14}/> Reset view</button></div></details>;
}
