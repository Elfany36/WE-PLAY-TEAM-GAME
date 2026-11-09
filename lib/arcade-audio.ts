import type {GameCue} from './casual/audio-signals';
export type MusicChoice='off'|'auto'|'clubhouse'|'arena'|'local';
export type AudioPreferences={music:MusicChoice;musicVolume:number;effects:boolean;effectsVolume:number};
export const AUDIO_DEFAULTS:AudioPreferences={music:'off',musicVolume:.3,effects:false,effectsVolume:.5};
export const MUSIC_TRACKS={clubhouse:{name:'Clubhouse',src:'pirate-brawl/audio/menu.ogg'},arena:{name:'Arena',src:'pirate-brawl/audio/battle.ogg'}};
const clamp=(value:unknown,fallback:number)=>typeof value==='number'&&Number.isFinite(value)?Math.max(0,Math.min(1,value)):fallback;
export function audioPreferences(value:unknown):AudioPreferences{const p=value as Partial<AudioPreferences>|null;return{music:['off','auto','clubhouse','arena','local'].includes(p?.music||'')?p!.music!:AUDIO_DEFAULTS.music,musicVolume:clamp(p?.musicVolume,AUDIO_DEFAULTS.musicVolume),effects:p?.effects===true,effectsVolume:clamp(p?.effectsVolume,AUDIO_DEFAULTS.effectsVolume)}}
export function musicForGame(mode:string){return ['pirate','circuit','tanks','sumo','pong','marble','snake','blocks','terra'].includes(mode)?MUSIC_TRACKS.arena:MUSIC_TRACKS.clubhouse}
type Scene={mode:string;phase:string;code:string}|null;
type Voice={source:AudioScheduledSourceNode;gain:GainNode};
type AudioAdapters={music:()=>HTMLAudioElement;context:()=>AudioContext;now:()=>number;url:(f:Blob)=>string;revoke:(url:string)=>void};
/** One streaming music element and one lazy effects context for the whole arcade. */
export class ArcadeAudio{
 preferences=audioPreferences(null);
 private scene:Scene=null;
 private music:HTMLAudioElement|null=null;
 private context:AudioContext|null=null;
 private voices=new Set<Voice>();
 private noise:AudioBuffer|null=null;
 private localURL='';
 private lastCue=-Infinity;
 private disposed=false;
 hidden=false;
 localName='';
 private adapters:AudioAdapters;
 constructor(adapters:AudioAdapters={music:()=>new Audio(),context:()=>new AudioContext(),now:()=>performance.now(),url:(f:Blob)=>URL.createObjectURL(f),revoke:(url:string)=>URL.revokeObjectURL(url)}){this.adapters=adapters}
 configure(patch:Partial<AudioPreferences>){this.preferences=audioPreferences({...this.preferences,...patch});if(!this.preferences.effects||this.preferences.effectsVolume<=0){this.stopEffects();void this.context?.suspend().catch(()=>{})}this.syncMusic();this.unlock()}
 setScene(scene:Scene){this.scene=scene;this.syncMusic();if(!scene||scene.phase==='paused'||scene.phase==='lobby'){this.stopEffects();void this.context?.suspend().catch(()=>{})}else if(scene.phase==='playing')this.unlock()}
 setHidden(hidden:boolean){this.hidden=hidden;if(hidden){this.stopEffects();void this.context?.suspend().catch(()=>{})}this.syncMusic();if(!hidden)this.unlock()}
 setLocalFile(file:File){if(!/\.(mp3|ogg|wav|m4a|aac|flac|opus)$/i.test(file.name)||file.size>25*1024*1024)throw Error('Choose an audio file up to 25 MB.');const previous=this.localURL;this.localURL=this.adapters.url(file);this.localName=file.name;this.configure({music:'local'});if(previous)this.adapters.revoke(previous)}
 unlock(){if(this.disposed)return;if(this.scene&&['playing','finished'].includes(this.scene.phase)&&this.preferences.effects&&this.preferences.effectsVolume>0){try{this.context??=this.adapters.context();if(!this.hidden&&this.context.state==='suspended')void this.context.resume().catch(()=>{})}catch{}}if(this.music?.paused&&!this.hidden&&this.scene?.phase==='playing'&&this.preferences.music!=='off'&&this.preferences.musicVolume>0)void this.music.play().catch(()=>{})}
 private syncMusic(){
  if(this.disposed)return;const p=this.preferences,track=p.music==='auto'?musicForGame(this.scene?.mode||''):p.music==='local'?null:p.music==='off'?null:MUSIC_TRACKS[p.music];
  const src=p.music==='local'?this.localURL:track?.src;
  if(!this.scene||!src){if(this.music){this.music.pause();if(this.music.getAttribute('src')){this.music.removeAttribute('src');this.music.load()}}return}
  if(!this.music&&p.musicVolume===0)return;
  if(!this.music){this.music=this.adapters.music();this.music.loop=true;this.music.preload='none'}
  if(this.music.getAttribute('src')!==src)this.music.src=src;
  this.music.volume=p.musicVolume;
  if(this.hidden||p.musicVolume===0||this.scene.phase!=='playing')this.music.pause();else if(this.music.paused)void this.music.play().catch(()=>{});
 }
 cue(cue:GameCue){
  if(this.disposed||this.hidden||!this.scene||['paused','lobby'].includes(this.scene.phase)||!this.preferences.effects||this.preferences.effectsVolume<=0)return;
  const now=this.adapters.now();if(now-this.lastCue<(cue==='draw'?120:65))return;this.lastCue=now;
  try{this.unlock();const c=this.context;if(!c||c.state!=='running')return;
   if(cue==='win'||cue==='score'||cue==='pickup'||cue==='finish'){const notes=cue==='finish'?[392,330]:cue==='win'?[523.25,659.25,783.99,1046.5]:cue==='score'?[523.25,659.25,783.99]:[659.25,880];notes.forEach((f,i)=>this.tone(f,f,.12,'sine',i*.055,.09));return}
   if(cue==='blast'){this.noiseCue(.2,.08);this.tone(105,38,.22,'sine',0,.12);return}
   if(cue==='draw'||cue==='dice'){this.noiseCue(cue==='draw'?.07:.2,cue==='draw'?.018:.075);return}
   const sound:Record<Exclude<GameCue,'win'|'score'|'pickup'|'finish'|'draw'|'dice'|'blast'>,[number,number,number,OscillatorType]>={card:[620,400,.045,'sine'],move:[420,320,.06,'sine'],shot:[260,75,.09,'triangle'],hit:[130,45,.13,'triangle'],jump:[280,710,.13,'sine'],dash:[800,180,.1,'triangle']};this.tone(...sound[cue],0,.1);
  }catch{}
 }
 private tone(from:number,to:number,duration:number,type:OscillatorType,delay:number,volume:number){const c=this.context!;if(this.voices.size>=8)return;const source=c.createOscillator(),gain=c.createGain(),at=c.currentTime+delay;source.type=type;source.frequency.setValueAtTime(from,at);source.frequency.exponentialRampToValueAtTime(Math.max(1,to),at+duration);this.startVoice(source,gain,at,duration,volume)}
 private noiseCue(duration:number,volume:number){const c=this.context!;if(this.voices.size>=8)return;if(!this.noise){this.noise=c.createBuffer(1,Math.ceil(c.sampleRate*.25),c.sampleRate);const samples=this.noise.getChannelData(0);for(let i=0;i<samples.length;i++)samples[i]=(Math.random()*2-1)*.4}const source=c.createBufferSource(),gain=c.createGain();source.buffer=this.noise;this.startVoice(source,gain,c.currentTime,duration,volume)}
 private startVoice(source:AudioScheduledSourceNode,gain:GainNode,at:number,duration:number,volume:number){const voice={source,gain};this.voices.add(voice);gain.gain.setValueAtTime(.0001,at);gain.gain.exponentialRampToValueAtTime(Math.max(.0001,volume*this.preferences.effectsVolume),at+.006);gain.gain.exponentialRampToValueAtTime(.0001,at+duration);source.connect(gain);gain.connect(this.context!.destination);source.onended=()=>{source.disconnect();gain.disconnect();this.voices.delete(voice)};source.start(at);source.stop(at+duration+.015)}
 private stopEffects(){for(const v of this.voices){try{v.source.stop();v.source.disconnect();v.gain.disconnect()}catch{}}this.voices.clear()}
 dispose(){this.disposed=true;this.stopEffects();if(this.music){this.music.pause();this.music.removeAttribute('src');this.music.load();this.music=null}void this.context?.close().catch(()=>{});this.context=null;this.noise=null;if(this.localURL)this.adapters.revoke(this.localURL);this.localURL=''}
}
