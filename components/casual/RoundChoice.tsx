'use client';
import {useState,useEffect} from 'react';
import {Check} from 'lucide-react';
import {ROUND_CHOICES,MAX_MATCH_ROUNDS} from '../../lib/casual/round-series';
export default function RoundChoice({value=0,onChange,disabled=false,autoApply=true}:{value?:number;onChange:(value:number)=>void;disabled?:boolean;autoApply?:boolean}){
 const preset=value===0||ROUND_CHOICES.some(n=>n===value),[custom,setCustom]=useState(!preset),[draft,setDraft]=useState(String(value||7));
 useEffect(()=>{setDraft(String(value||7));if(!preset)setCustom(true)},[value,preset]);
 const parsed=Number(draft),valid=Number.isSafeInteger(parsed)&&parsed>=1&&parsed<=MAX_MATCH_ROUNDS,changed=valid&&parsed!==value;
 const apply=()=>{if(changed)onChange(parsed)};
 return <label className="setup-round-count">Match length<select aria-label="Match rounds" disabled={disabled} value={custom?'custom':String(value)} onChange={e=>{if(e.target.value==='custom'){setCustom(true);if(preset){setDraft('7');onChange(7)}}else{setCustom(false);onChange(Number(e.target.value))}}}><option value="0">Unlimited</option>{ROUND_CHOICES.map(n=><option key={n} value={n}>{n} {n===1?'round':'rounds'}</option>)}<option value="custom">Custom…</option></select>{custom&&<span className="custom-round-input"><input type="number" aria-label="Custom match rounds" min={1} max={MAX_MATCH_ROUNDS} step={1} value={draft} disabled={disabled} aria-invalid={!valid} onChange={e=>{setDraft(e.target.value);const n=Number(e.target.value);if(autoApply&&Number.isSafeInteger(n)&&n>=1&&n<=MAX_MATCH_ROUNDS)onChange(n)}} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();apply()}}}/><button type="button" aria-label="Apply custom rounds" title="Apply rounds" disabled={disabled||!changed} onClick={apply}><Check size={17}/><span>Set</span></button></span>}</label>;
}
