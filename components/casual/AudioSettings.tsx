'use client';
import {useRef,useState} from 'react';
import {Volume2,VolumeX,X,FolderOpen} from 'lucide-react';
import type {GameAudio} from './useGameAudio';
import type {MusicChoice} from '../../lib/arcade-audio';
export default function AudioSettings({audio}:{audio:GameAudio}){
 const [error,setError]=useState(''),p=audio.preferences;
 return <section className="game-audio-settings" aria-label="Game audio settings"><label>Music<select aria-label="Game music" value={p.music} onChange={e=>audio.configure({music:e.target.value as MusicChoice})}><option value="off">Off</option><option value="auto">Game theme</option><option value="clubhouse">Clubhouse</option><option value="arena">Arena</option>{audio.localName&&<option value="local">{audio.localName}</option>}</select></label>{p.music!=='off'&&<label>Music volume<input aria-label="Music volume" type="range" min={0} max={100} value={Math.round(p.musicVolume*100)} onChange={e=>audio.configure({musicVolume:Number(e.target.value)/100})}/></label>}<label className="audio-effect-toggle"><input type="checkbox" checked={p.effects} onChange={e=>audio.configure({effects:e.target.checked})}/>Sound effects</label>{p.effects&&<label>Effects volume<input aria-label="Effects volume" type="range" min={0} max={100} value={Math.round(p.effectsVolume*100)} onChange={e=>audio.configure({effectsVolume:Number(e.target.value)/100})}/></label>}<label className="audio-file-button"><FolderOpen size={16}/><span>Add my music</span><input aria-label="Add local music" type="file" accept="audio/*,.ogg,.mp3,.wav,.m4a,.flac,.opus" onChange={e=>{const file=e.target.files?.[0];if(file){try{audio.loadFile(file);setError('')}catch(error){setError((error as Error).message)}}e.target.value=''}}/></label>{error&&<p role="alert">{error}</p>}</section>;
}
export function AudioButton({audio}:{audio:GameAudio}){
 const dialog=useRef<HTMLDialogElement>(null),on=audio.preferences.effects||audio.preferences.music!=='off';
 return <><button type="button" className="button outline" aria-label="Game audio" title="Game audio" onClick={()=>dialog.current?.showModal()}>{on?<Volume2 size={17}/>:<VolumeX size={17}/>}</button><dialog ref={dialog} className="game-audio-dialog" aria-label="Game audio"><header><h2>Game audio</h2><button type="button" aria-label="Close game audio" onClick={()=>dialog.current?.close()}><X size={20}/></button></header><AudioSettings audio={audio}/></dialog></>;
}
