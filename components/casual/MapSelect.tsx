'use client';
import {SNAKE_MAPS} from '../../lib/casual/maps';
import MapPreview from './MapPreview';
export default function MapSelect({value,onChange,disabled=false,label='Battle map',size=48}:{value:string;onChange:(id:string)=>void;disabled?:boolean;label?:string;size?:number}){
 return <fieldset className="map-picker"><legend>{label}</legend><div>{SNAKE_MAPS.map(m=><button key={m.id} type="button" disabled={disabled} aria-pressed={value===m.id} onClick={()=>onChange(m.id)}><MapPreview theme={m.id} kind="snake" size={size}/><strong>{m.name}</strong><small>{m.description}</small></button>)}</div></fieldset>;
}
