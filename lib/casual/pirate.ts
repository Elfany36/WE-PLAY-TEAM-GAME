import type {CasualState} from './engine.ts';
import {CasualError} from './error.ts';
import {finish,livePlayers,random} from './shared.ts';
import {playerColor,playerModel} from './appearance.ts';
import {PIRATE_MODELS,pirateModel} from './pirate-models.ts';
import {PIRATE_MAPS,PIRATE_MODES,type PirateVariant} from './pirate-data.ts';
import {createPirateWorld,stepPirateWorld,type PirateWorld,type PirateControl} from './pirate-runtime.js';
export type PirateSettings={pirateMap?:string;pirateMode?:PirateVariant;pirateStocks?:1|3|5;pirateDifficulty?:'relaxed'|'standard'|'veteran'};
export type PirateGame={kind:'pirate';world:PirateWorld;inputs:Record<string,PirateControl>;startAt:number;lastTickAt:number;deadline:number;pausedAt:number|null;tick:number;scores:Record<string,number>;currentId:string};
export function pirateSettings(v:Record<string,unknown>):PirateSettings{
 const out:PirateSettings={};
 if(v.pirateMap!==undefined){if(!PIRATE_MAPS.some(m=>m.id===v.pirateMap))throw new CasualError('Choose a pirate arena.');out.pirateMap=v.pirateMap as string}
 if(v.pirateMode!==undefined){if(!PIRATE_MODES.some(m=>m.id===v.pirateMode))throw new CasualError('Choose a pirate game mode.');out.pirateMode=v.pirateMode as PirateVariant}
 if(v.pirateStocks!==undefined){if(![1,3,5].includes(v.pirateStocks as number))throw new CasualError('Choose one, three or five stocks.');out.pirateStocks=v.pirateStocks as 1|3|5}
 if(v.pirateDifficulty!==undefined){if(!['relaxed','standard','veteran'].includes(v.pirateDifficulty as string))throw new CasualError('Choose a pirate AI level.');out.pirateDifficulty=v.pirateDifficulty as PirateSettings['pirateDifficulty']}
 return out;
}
export function newPirate(s:CasualState,now:number):PirateGame{
 const ps=livePlayers(s),mode=s.settings.pirateMode||'classic',startAt=now+3000;
 for(const [i,p]of ps.entries())if(p.bot&&!p.appearance?.models?.pirate)p.appearance={...p.appearance,models:{...p.appearance?.models,pirate:PIRATE_MODELS[i%PIRATE_MODELS.length].id}};
 const world=createPirateWorld(s.settings.pirateMap||PIRATE_MAPS[0].id,mode,ps.map(p=>{const model=pirateModel(playerModel(p,'pirate'));return{id:p.id,bot:!!p.bot,character:model.character,model:model.id,color:playerColor(p).fill}}),Math.floor(random(s)*4294967295)||1,s.settings.pirateStocks||3,({relaxed:.65,standard:1,veteran:1.35})[s.settings.pirateDifficulty||'standard']);
 return{kind:'pirate',world,inputs:{},startAt,lastTickAt:startAt,deadline:startAt+(mode==='ko-race'?180:s.settings.roundSeconds||300)*1000,pausedAt:null,tick:0,scores:Object.fromEntries(ps.map(p=>[p.id,0])),currentId:ps[0].id};
}
function complete(s:CasualState,now:number){
 const g=s.game as PirateGame,world=g.world,active=world.fighters.filter(f=>s.players.some(p=>p.id===f.id&&!p.retired&&p.role!=='spectator'));
 let winners=world.winnerIds.filter(id=>active.some(f=>f.id===id));
 if(!world.ended){const ranked=active.slice().sort((a,b)=>world.variant==='ko-race'?b.ko-a.ko||a.dmg-b.dmg:b.st-a.st||b.ko-a.ko||a.dmg-b.dmg),best=ranked[0];winners=best?ranked.filter(f=>world.variant==='ko-race'?f.ko===best.ko&&f.dmg===best.dmg:f.st===best.st&&f.ko===best.ko&&f.dmg===best.dmg).map(f=>f.id):[];world.ended=true;world.winnerIds=winners}
 finish(s,winners,winners.length===1?(s.players.find(p=>p.id===winners[0])?.name||'A pirate')+' wins the brawl.':winners.length?'The leading pirates share the win.':'Every pirate went overboard. This round is a draw.',now);
}
export function advancePirate(s:CasualState,now:number){
 const g=s.game as PirateGame;if(now<g.startAt)return false;
 if(now-g.lastTickAt>8000){s.phase='paused';g.pausedAt=now;s.pauseReason='The pirate arena paused after a connection gap.';return true}
 let changed=false;
 while(g.lastTickAt+50<=Math.min(now,g.deadline)&&!g.world.ended){g.lastTickAt+=50;stepPirateWorld(g.world,g.inputs,3,g.lastTickAt);changed=true}
 g.tick=g.world.tick;for(const f of g.world.fighters)g.scores[f.id]=f.ko;
 if(g.world.ended||now>=g.deadline){complete(s,now);changed=true}return changed;
}
export function pirateAction(s:CasualState,a:Record<string,unknown>,id:string,now:number){
 const g=s.game as PirateGame,f=g.world.fighters.find(f=>f.id===id);
 if(a.action!=='pirate-input'||!f||f.st<=0)throw new CasualError('Use your pirate controls.');
 if(!Number.isSafeInteger(a.seq)||(a.seq as number)<1||!Number.isFinite(a.dx)||(a.dx as number)<-1||(a.dx as number)>1)throw new CasualError('Send valid pirate controls.');
 for(const key of ['jumpSeq','attackSeq','specialSeq','dashSeq'])if(!Number.isSafeInteger(a[key])||(a[key] as number)<0||(a[key] as number)>(a.seq as number))throw new CasualError('Send ordered pirate actions.');
 for(const key of ['down','jump','attack','special','dash'])if(typeof a[key]!=='boolean')throw new CasualError('Send valid pirate buttons.');
 const map=PIRATE_MAPS.find(m=>m.id===g.world.map)!;
 if(a.aimX!==undefined||a.aimY!==undefined){if(!Number.isFinite(a.aimX)||!Number.isFinite(a.aimY)||(a.aimX as number)<-200||(a.aimX as number)>map.w+200||(a.aimY as number)<-400||(a.aimY as number)>map.h+200)throw new CasualError('Aim inside the pirate arena.')}
 if(!Number.isSafeInteger(a.life)||(a.life as number)<0)throw new CasualError('Use the current pirate life.');
 if(now<g.startAt||f.dead||a.life!==f.life||Math.max(g.inputs[id]?.seq||0,f.lastSeq)>=(a.seq as number))return;
 if(f.fz>0){for(const key of ['jumpSeq','attackSeq','specialSeq','dashSeq'] as const)f[key]=Math.max(f[key],a[key] as number);f.lastSeq=a.seq as number}
 g.inputs[id]={seq:a.seq as number,at:now,life:a.life as number,dx:a.dx as number,down:a.down as boolean,jump:a.jump as boolean,attack:a.attack as boolean,special:a.special as boolean,dash:a.dash as boolean,jumpSeq:a.jumpSeq as number,attackSeq:a.attackSeq as number,specialSeq:a.specialSeq as number,dashSeq:a.dashSeq as number,...(a.aimX!==undefined?{aimX:a.aimX as number,aimY:a.aimY as number}:{})};
}
export function leavePirate(s:CasualState,id:string,now:number){const g=s.game as PirateGame,f=g.world.fighters.find(f=>f.id===id);if(f){f.st=0;f.dead=1;f.bomb=null}delete g.inputs[id];g.world.bombs=g.world.bombs.filter(b=>b.h!==id&&b.own!==id);g.world.projectiles=g.world.projectiles.filter(p=>p.own!==id);g.world.strikes=g.world.strikes.filter(p=>p.own!==id);g.world.zones=g.world.zones.filter(p=>p.own!==id);for(const other of g.world.fighters)if(other.la===id){other.la=null;other.lt=0}const active=g.world.fighters.filter(f=>f.st>0);if(active.length<2){g.world.ended=true;g.world.winnerIds=active.map(f=>f.id);complete(s,now)}}
export function publicPirate(g:PirateGame,viewerId?:string){
 const {seed,difficulty,nextBombId,nb,ct,sk,potT,...world}=g.world;
 return{...g,inputs:{},world:{...world,fighters:world.fighters.map(f=>{const{h,lv,la,lt,pp,pu,pa,pb,ps,pj,jb,jh,ba,cy,dd,sc,dk,sg,pl,sl,kt,ks,sw,mx,my,...visible}=f;return{...visible,...(f.id===viewerId?{pp,ps,pj,jb,jh,cy,dd,dk,pl,sl}:{})}})}};
}
