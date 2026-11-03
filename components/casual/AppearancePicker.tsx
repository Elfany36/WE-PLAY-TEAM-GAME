'use client';
import {useEffect,useId,useRef,useState} from 'react';
import {Palette,X,Check,Upload} from 'lucide-react';
import {MODEL_COLLECTIONS,CUSTOM_COLORS,modelFamily,modelLabel,playerModel,playerColor,type Appearance,type GameModelFamily} from '../../lib/casual/appearance';
import {modelDataUrl} from '../../lib/casual/model-visuals';
import {cropAvatar,useAvatar} from './AvatarImages';

type Person={id:string;color:number;appearance?:Appearance};
export default function AppearancePicker({mode,player,busy,onSave,onUpload,savedPortrait,allowUpload=true}:{mode:string;player:Person;busy:boolean;savedPortrait?:string;allowUpload?:boolean;onSave:(a:Appearance)=>Promise<boolean>;onUpload:(data:string)=>Promise<void>}) {
 const dialog=useRef<HTMLDialogElement>(null),title=useId(),[draft,setDraft]=useState<Appearance>({}),[working,setWorking]=useState(false),[error,setError]=useState(''),[opened,setOpened]=useState(false),[saveStatus,setSaveStatus]=useState(''),avatar=useAvatar(player.id);
 const family=modelFamily(mode) as GameModelFamily,collection=MODEL_COLLECTIONS[family],color=playerColor({...player,appearance:draft}).fill,chosen=playerModel({...player,appearance:draft},family);
 const queued=useRef<Appearance|null>(null),saving=useRef<Promise<boolean>|null>(null),timer=useRef<ReturnType<typeof setTimeout>|null>(null),draftRef=useRef(draft),saveRef=useRef(onSave),mounted=useRef(true);saveRef.current=onSave;
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;if(timer.current)clearTimeout(timer.current);queued.current=null}},[]);
 async function flush(){if(timer.current)clearTimeout(timer.current);timer.current=null;if(saving.current)return saving.current;const work=(async()=>{let ok=true;while(queued.current&&mounted.current){const next=queued.current;queued.current=null;try{ok=await saveRef.current(next)}catch(e){ok=false;if(mounted.current)setError((e as Error).message)}if(mounted.current)setSaveStatus(ok?'Selected · saved automatically':'Could not save. Use the save button to retry.');if(!ok){if(!queued.current)queued.current=next;break}}return ok})();saving.current=work;try{return await work}finally{saving.current=null}}
 function updateDraft(update:(previous:Appearance)=>Appearance){const next=update(draftRef.current);draftRef.current=next;setDraft(next);setError('');setSaveStatus('Saving your selection…');queued.current={...next,models:{...next.models,[family]:playerModel({...player,appearance:next},family)}};if(timer.current)clearTimeout(timer.current);if(!saving.current)void flush()}
 function open(){draftRef.current=player.appearance||{};setDraft(draftRef.current);setError('');setSaveStatus('Defaults are ready. Changes save automatically.');setOpened(true);requestAnimationFrame(()=>dialog.current?.showModal());window.dispatchEvent(new Event('blur'))}
 async function save(){if(!queued.current)queued.current={...draftRef.current,models:{...draftRef.current.models,[family]:chosen}};if(await flush())dialog.current?.close()}
 async function upload(data:()=>Promise<string>){setWorking(true);setError('');try{await onUpload(await data());updateDraft(p=>({...p,useAvatar:true}))}catch(e){setError((e as Error).message)}finally{setWorking(false)}}
 return <>
  <button type="button" className="button character-customize-button" onClick={open}><Palette size={16}/> Customize character</button>
  <dialog ref={dialog} onClose={()=>setOpened(false)} className="appearance-dialog" aria-labelledby={title} onKeyDown={e=>e.stopPropagation()} onKeyUp={e=>e.stopPropagation()} onCancel={e=>{if(working)e.preventDefault()}}>
   {opened&&<>
    <header><div><small>YOUR GAME · YOUR COLLECTION</small><h2 id={title}>{collection.title}</h2></div><button type="button" disabled={working} aria-label="Close character customization" onClick={()=>dialog.current?.close()}><X size={21}/></button></header>
    <div className="appearance-body">
     <div className="appearance-hero" style={{'--model-color':color} as React.CSSProperties}>
      <img className="model-preview" data-family={family} data-model={chosen} src={modelDataUrl(family,chosen,color)} alt={modelLabel(family,chosen)+' preview'} width={110} height={110}/>
      <div><small>{collection.models.length} GAME DESIGNS · {CUSTOM_COLORS.length} COLORS</small><strong>{modelLabel(family,chosen)}</strong><span>{collection.note}</span></div>
     </div>
     <fieldset disabled={working}>
      <legend>Choose your {collection.subject}</legend>
      <div className="appearance-models">{collection.models.map(({id,label})=><button type="button" key={id} className={chosen===id?'selected':''} aria-pressed={chosen===id} data-model={id} onClick={()=>updateDraft(p=>({...p,models:{...p.models,[family]:id},useAvatar:false}))}>
       <img src={modelDataUrl(family,id,color)} alt="" width={100} height={100} decoding="async"/><span>{label}{chosen===id&&<Check size={14}/>}</span>
      </button>)}</div>
      <h3 className="appearance-color-label">Signature color <small>{CUSTOM_COLORS.length} choices</small></h3>
      <div className="appearance-colors">{CUSTOM_COLORS.map(c=><button type="button" key={c.fill} style={{background:c.fill}} aria-label={c.name+' ('+c.fill+')'} title={c.name} aria-pressed={color===c.fill} onClick={()=>updateDraft(p=>({...p,color:c.fill}))}>{color===c.fill&&<Check color={playerColor({color:0,appearance:{color:c.fill}}).ink} size={19}/>}</button>)}</div>
      <div className="appearance-custom-color"><label>Custom color<input aria-label="Custom character color" type="color" value={color} onChange={e=>updateDraft(p=>({...p,color:e.target.value}))}/><code>{color.toUpperCase()}</code></label><button type="button" className="text-link" onClick={()=>updateDraft(p=>({...p,color:undefined}))}>Reset to seat color</button></div>
      {allowUpload&&<div className="appearance-upload">
       {avatar&&<img src={avatar} alt="Your uploaded portrait" width={48} height={48}/>}
       <label className="button outline"><Upload size={15}/>{avatar?'Replace portrait':'Upload portrait'}<input type="file" aria-label="Upload player portrait" accept="image/png,image/jpeg,image/webp" onChange={e=>{const file=e.target.files?.[0];e.target.value='';if(file)void upload(()=>cropAvatar(file))}}/></label>
       {!avatar&&savedPortrait&&<button type="button" className="button outline" onClick={()=>void upload(async()=>savedPortrait)}>Use saved portrait</button>}
       {avatar&&['ladders','property'].includes(mode)&&<label><input type="checkbox" checked={!!draft.useAvatar} onChange={e=>updateDraft(p=>({...p,useAvatar:e.target.checked}))}/> Use portrait instead of board model</label>}
       {avatar&&!['ladders','property'].includes(mode)&&<small>Your portrait appears in the player list. Your game model stays visible in play.</small>}
       <small>PNG, JPEG or WebP · centered square crop · up to 8 MB</small>
      </div>}
     </fieldset>
     {error&&<p role="alert">{error}</p>}
    </div>
    <footer><small>{working?'Uploading…':saveStatus}</small><button type="button" className="button dark" disabled={working} onClick={()=>void save()}>Use selected character <Check size={16}/></button></footer>
   </>}
  </dialog>
 </>;
}
