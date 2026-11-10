import test from 'node:test';
import assert from 'node:assert/strict';
import {pirateCamera} from '../lib/casual/pirate-camera.ts';
import {PIRATE_MAPS} from '../lib/casual/pirate-data.ts';
import {pirateDisplay} from '../lib/casual/pirate-display.ts';
import {createCasual,applyCasualAction,publicCasual,type CasualState} from '../lib/casual/engine.ts';
import {matchRoundSettings} from '../lib/casual/round-series.ts';
import {finish} from '../lib/casual/shared.ts';
import type {UnoGame} from '../lib/casual/uno.ts';
import {ArcadeAudio,audioPreferences,musicForGame} from '../lib/arcade-audio.ts';
import {gameAudioSignal,gameAudioCue} from '../lib/casual/audio-signals.ts';
import {chooseCasualEndpoint,CASUAL_SERVICE_ORIGIN,sessionCasualEndpoint} from '../lib/casual/service.ts';
const N=1800000000000;
test('default Pirate camera frames every live fighter above the HUD on all maps and both layouts',()=>{
 assert.equal(pirateDisplay(null).camera,'action');
 for(const map of PIRATE_MAPS)for(const [width,height,full]of [[1440,900,true],[390,844,true],[320,844,true],[844,390,true],[390,292.5,false],[960,540,false]] as const){
  const scale=960/width,H=height*scale,insets={top:(full?width<360?140:width<760?90:64:64)*scale,bottom:(full?width<760?172:108:12)*scale,left:12*scale,right:12*scale},fighters=map.sp.map(([x,y],i)=>({id:'f'+i,x,y,st:3,s:{w:80,h:74}}));
  let camera={x:-500,y:3000,z:1.8};
  for(let frame=0;frame<12;frame++){
   if(frame===5){fighters[0].x=-150;fighters[0].y=-100;fighters.at(-1)!.x=map.w+170}
   camera=pirateCamera(camera,fighters,map,960,H,'action','f0',insets,16.7);
   for(const f of fighters){const l=480+(f.x-40-camera.x)*camera.z,r=480+(f.x+40-camera.x)*camera.z,t=H/2+(f.y-102-camera.y)*camera.z,b=H/2+(f.y+12-camera.y)*camera.z;assert(l>=insets.left&&r<=960-insets.right,map.id+' horizontal clipping');assert(t>=insets.top&&b<=H-insets.bottom,map.id+' vertical clipping')}
   assert(Object.values(camera).every(Number.isFinite));assert(camera.z>0);
  }
 }
});
test('whole-arena camera includes the map while close follow is an explicit preference',()=>{
 const map=PIRATE_MAPS[0],actors=[{id:'one',x:500,y:600,st:3},{id:'two',x:1800,y:300,st:3}],c={x:1000,y:500,z:.8},full=pirateCamera(c,actors,map,960,540,'arena','one',{},16),follow=pirateCamera(c,actors,map,960,540,'follow','one',{},1000);
 assert(480+(map.w-full.x)*full.z<960);assert(480-full.x*full.z>0);assert(follow.z>full.z);
});
function lobby(mode='ladders',rounds=2){let s=createCasual('SERIES33','one','One','hash','ladders',1,N);s=applyCasualAction(s,{action:'join',id:'two',name:'Two',hash:'hash2'},null,N);s=applyCasualAction(s,{action:'configure',mode,cards:12,speed:350,matchRounds:rounds},'one',N);return applyCasualAction(s,{action:'start'},'one',N)}
function winLadders(s:CasualState,id='one'){const g=s.game as any;g.positions[id]=99;g.currentId=id;g.lockUntil=0;s.random=1;return applyCasualAction(s,{action:'roll',round:s.round,turn:g.turn},id,N+100)}
test('fixed rounds count authoritative finishes once, carry wins, declare ties and reset for a new match',()=>{
 let s=winLadders(lobby());assert.equal(s.series!.completed,1);assert(!s.series!.finished);assert.equal(s.series!.players[0].wins,1);
 s=applyCasualAction(s,{action:'heartbeat'},'one',N+101);assert.equal(s.series!.completed,1);
 s=applyCasualAction(JSON.parse(JSON.stringify(s)),{action:'start',round:s.round},'one',N+110);s=winLadders(s,'two');assert.equal(s.series!.completed,2);assert(s.series!.finished);assert.deepEqual(s.series!.winnerIds,['one','two']);
 const oldRound=s.round;s=applyCasualAction(s,{action:'start',round:oldRound},'one',N+120);assert.equal(s.series!.completed,0);assert(!s.series!.finished);assert(s.series!.players.every(p=>!p.wins));assert.throws(()=>applyCasualAction(s,{action:'start',round:oldRound},'one',N+121),/older round/);
});
test('Unlimited is bounded in memory, cancelled rounds award nothing, and spectator changes do not break bot identities',()=>{
 let s=lobby('ladders',0);s=applyCasualAction(s,{action:'end'},'one',N+100);assert.equal(s.series!.completed,0);assert(s.series!.players.every(p=>p.wins===0));
 s=applyCasualAction(s,{action:'start'},'one',N+110);s=winLadders(s);assert(!s.series!.finished);assert.equal(s.series!.completed,1);
 s=applyCasualAction(s,{action:'configure',mode:'ladders',cards:12,speed:350,bots:1,matchRounds:3},'one',N+120);s=applyCasualAction(s,{action:'start'},'one',N+121);const bot=s.players.find(p=>p.bot)!.id;s=winLadders(s);
 s=applyCasualAction(s,{action:'join',id:'watch','name':'Watcher',hash:'watch',role:'spectator'},null,N+130);s=applyCasualAction(s,{action:'start'},'one',N+131);assert.equal(s.players.find(p=>p.bot)!.id,bot);assert.equal(s.series!.completed,1);assert.equal(s.series!.players.length,3);
});
test('round choices validate server-side and game changes begin a new series',()=>{
 for(const n of [0,1,2,3,4,5,6,7,10,83,1000])assert.equal(matchRoundSettings({matchRounds:n}).matchRounds,n);
 for(const n of [-1,1001,.5,NaN,Infinity,'10',null])assert.throws(()=>matchRoundSettings({matchRounds:n}),/rounds/);
 let s=winLadders(lobby());s=applyCasualAction(s,{action:'configure',mode:'memory',cards:12,speed:350,matchRounds:2},'one',N+120);s=applyCasualAction(s,{action:'start'},'one',N+121);assert.equal(s.series!.mode,'memory');assert.equal(s.series!.completed,0);
});
test('a selected round in UNO is a complete 500-point match, never one hand',()=>{
 let s=lobby('uno',1),g=s.game as UnoGame;g.scores.one=120;finish(s,['one'],'Hand complete.',N+1);s=applyCasualAction(s,{action:'heartbeat'},'one',N+2);assert.equal(s.series!.completed,0);assert(!s.series!.finished);
 s=applyCasualAction(s,{action:'start'},'one',N+3);g=s.game as UnoGame;assert.equal(g.scores.one,120);g.scores.one=520;g.matchWinner='one';finish(s,['one'],'500 points reached.',N+4);s=applyCasualAction(s,{action:'heartbeat'},'one',N+5);assert.equal(s.series!.completed,1);assert(s.series!.finished);
 s=applyCasualAction(s,{action:'start'},'one',N+6);assert.equal((s.game as UnoGame).scores.one,0);
});
test('sound signals ignore initial/private snapshots and react to visible game events',()=>{
 const room=publicCasual(lobby('memory'), 'one',N),before=gameAudioSignal(room);assert.equal(gameAudioCue(null,before),null);(room.game as any).revealed=[0];const after=gameAudioSignal(room);assert.equal(gameAudioCue(before,after),'card');assert(!JSON.stringify(after).includes('deck'));
 (room.game as any).deck[0].matchedBy='one';(room.game as any).deck[1].matchedBy='one';assert.equal(gameAudioCue(after,gameAudioSignal(room)),'score');
 const changed={...gameAudioSignal(room),scope:'another-room'};assert.equal(gameAudioCue(before,changed),null);
});
class FakeMusic{
 attrs:Record<string,string>={};paused=true;loop=false;preload='';volume=0;plays=0;stops=0;currentTime=37;
 set src(v:string){this.attrs.src=v}getAttribute(k:string){return this.attrs[k]||null}removeAttribute(k:string){delete this.attrs[k]}load(){}play(){this.paused=false;this.plays++;return Promise.resolve()}pause(){this.paused=true;this.stops++}
}
test('audio stays unloaded by default, streams one selected track, pauses in background and cleans up',()=>{
 const elements:FakeMusic[]=[],revoked:string[]=[],audio=new ArcadeAudio({music:()=>{const a=new FakeMusic();elements.push(a);return a as unknown as HTMLAudioElement},context:()=>{throw Error('effects must be lazy')},now:()=>1000,url:()=> 'blob:local-track',revoke:u=>revoked.push(u)});
 audio.setScene({code:'A',mode:'solitaire',phase:'playing'});assert.equal(elements.length,0);audio.configure({music:'auto'});assert.equal(elements.length,1);assert.equal(elements[0].attrs.src,musicForGame('solitaire').src);assert.equal(elements[0].plays,1);
 for(let i=0;i<100;i++)audio.setScene({code:'A',mode:'solitaire',phase:'playing'});assert.equal(elements[0].plays,1);assert.equal(elements[0].currentTime,37);
 audio.setHidden(true);assert(elements[0].paused);audio.setHidden(false);assert.equal(elements[0].plays,2);audio.setScene({code:'A',mode:'pirate',phase:'playing'});assert.equal(elements.length,1);assert.equal(elements[0].attrs.src,musicForGame('pirate').src);
 audio.setLocalFile(new File(['audio'],'my-track.mp3',{type:'audio/mpeg'}));assert.equal(elements[0].attrs.src,'blob:local-track');audio.dispose();assert(elements[0].paused);assert(!elements[0].getAttribute('src'));assert.deepEqual(revoked,['blob:local-track']);
 assert.equal(audioPreferences({music:'surprise',musicVolume:100,effectsVolume:NaN}).music,'off');assert.equal(audioPreferences({musicVolume:100}).musicVolume,1);
});
test('effects have a bounded voice budget and release their audio graph when disabled',()=>{
 const sources:{stopped:boolean;onended:null|(()=>void);disconnects:number}[]=[],param={setValueAtTime(){},exponentialRampToValueAtTime(){}},context={state:'running',sampleRate:8000,currentTime:0,destination:{},suspend(){this.state='suspended';return Promise.resolve()},resume(){this.state='running';return Promise.resolve()},close(){this.state='closed';return Promise.resolve()},createGain(){return{gain:param,connect(){},disconnect(){}}},createOscillator(){const source={frequency:param,type:'sine',stopped:false,onended:null as null|(()=>void),disconnects:0,connect(){},disconnect(){this.disconnects++},start(){},stop(at?:number){if(at!==undefined)return;if(!this.stopped){this.stopped=true;this.onended?.()}}};sources.push(source);return source}};
 let now=1000,contexts=0;const audio=new ArcadeAudio({music:()=>{throw Error('no music requested')},context:()=>{contexts++;return context as unknown as AudioContext},now:()=>now,url:()=>'',revoke:()=>{}});
 audio.setScene({code:'A',mode:'pirate',phase:'playing'});audio.cue('win');assert.equal(contexts,0);audio.configure({effects:true});for(let i=0;i<20;i++){now+=100;audio.cue('win')}assert.equal(contexts,1);assert.equal(sources.length,8);
 audio.configure({effects:false});assert(sources.every(s=>s.stopped&&s.disconnects>0));assert.equal(context.state,'suspended');audio.dispose();assert.equal(context.state,'closed');
});
test('new round-capable rooms use their matching authority; existing room origins stay pinned',async()=>{
 const descriptor=Object.getOwnPropertyDescriptor(globalThis,'location');
 try{const origin='https://markup-learn-play-together.kendsfabros.chatgpt.site';Object.defineProperty(globalThis,'location',{configurable:true,value:{hostname:new URL(origin).hostname,origin,href:origin+'/'}});assert.equal(await chooseCasualEndpoint('snake'),CASUAL_SERVICE_ORIGIN+'/api/casual');assert.equal(await chooseCasualEndpoint('snake',{matchRounds:0}),CASUAL_SERVICE_ORIGIN+'/api/casual');assert.equal(await chooseCasualEndpoint('uno',{matchRounds:0}),'/api/casual');assert.equal(await chooseCasualEndpoint('fleet',{matchRounds:6}),'/api/casual');assert.equal(sessionCasualEndpoint(CASUAL_SERVICE_ORIGIN),CASUAL_SERVICE_ORIGIN+'/api/casual')}
 finally{if(descriptor)Object.defineProperty(globalThis,'location',descriptor);else delete(globalThis as any).location}
});
