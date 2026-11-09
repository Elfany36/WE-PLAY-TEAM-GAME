'use client';
import {useEffect,useRef,useState,useCallback} from 'react';
import {ArcadeAudio,audioPreferences,AUDIO_DEFAULTS,type AudioPreferences} from '../../lib/arcade-audio';
import {gameAudioSignal,gameAudioCue,type AudioSignal,type GameCue} from '../../lib/casual/audio-signals';
import type {CasualPublic} from '../../lib/casual/engine';
import {readStored,writeStored} from '../../lib/client-state';
const key='markup-game-audio-v33';
export function useAudioScene(room:{code:string;mode:string;phase:string}|null,connected=true){
 const [preferences,setPreferences]=useState<AudioPreferences>(AUDIO_DEFAULTS),[localName,setLocalName]=useState(''),controller=useRef<ArcadeAudio|null>(null),save=useRef<ReturnType<typeof setTimeout>|null>(null),current=useRef(preferences);current.current=preferences;
 const ensure=()=>controller.current??(controller.current=new ArcadeAudio());
 const persist=useCallback((prefs:AudioPreferences)=>{if(save.current)clearTimeout(save.current);save.current=setTimeout(()=>{writeStored(key,{...prefs,music:prefs.music==='local'?'off':prefs.music});save.current=null},150)},[]);
 const configure=useCallback((patch:Partial<AudioPreferences>)=>{const c=ensure();c.configure(patch);const next={...c.preferences};current.current=next;setPreferences(next);persist(next)},[persist]);
 const loadFile=useCallback((file:File)=>{const c=ensure();c.setLocalFile(file);setLocalName(c.localName);const next={...c.preferences};current.current=next;setPreferences(next);persist(next)},[persist]);
 const cue=useCallback((cue:GameCue)=>controller.current?.cue(cue),[]);
 useEffect(()=>{
  const c=ensure(),stored=readStored(key),prefs=audioPreferences(stored||{effects:readStored('markup-party-muted',true)===false});c.configure(prefs);current.current=prefs;setPreferences(prefs);
  const visible=()=>c.setHidden(document.hidden),unlock=()=>c.unlock();visible();document.addEventListener('visibilitychange',visible);window.addEventListener('pointerdown',unlock,{passive:true});window.addEventListener('keydown',unlock);
  return()=>{document.removeEventListener('visibilitychange',visible);window.removeEventListener('pointerdown',unlock);window.removeEventListener('keydown',unlock);if(save.current){clearTimeout(save.current);writeStored(key,{...current.current,music:current.current.music==='local'?'off':current.current.music})}c.dispose();if(controller.current===c)controller.current=null};
 },[]);
 useEffect(()=>{ensure().setScene(room?{code:room.code,mode:room.mode,phase:connected?room.phase:'paused'}:null)},[room?.code,room?.mode,room?.phase,connected]);

 return{preferences,configure,localName,loadFile,cue};
}
export function useGameAudio(room:CasualPublic|null,connected=true){
 const audio=useAudioScene(room,connected),last=useRef<AudioSignal|null>(null);
 useEffect(()=>{if(!room||!connected||!audio.preferences.effects){last.current=null;return}const next=gameAudioSignal(room),sound=gameAudioCue(last.current,next);last.current=next;if(sound)audio.cue(sound)},[room,connected,audio.preferences.effects,audio.cue]);
 return audio;
}
export type GameAudio=ReturnType<typeof useAudioScene>;
