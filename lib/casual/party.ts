import type {CasualState} from './engine.ts';
import {CasualError} from './error.ts';
import {livePlayers,finish} from './shared.ts';
import {trackPoints,distanceToTrack} from './circuit.ts';
export const PARTY_MODES=['sumo','tanks','pong','marble'] as const;
export type PartyKind=typeof PARTY_MODES[number];
export const isParty=(mode:string):mode is PartyKind=>PARTY_MODES.includes(mode as PartyKind);
export type ClubMap='garden'|'canyon'|'neon';
export const CLUB_MAPS=[{id:'garden',name:'Clover Gardens',ground:'#bad4ad',road:'#dbe7cf',ink:'#426a57'},{id:'canyon',name:'Copper Canyon',ground:'#deb791',road:'#f2dabb',ink:'#93634d'},{id:'neon',name:'Midnight Arcade',ground:'#182c42',road:'#415a72',ink:'#91d8cb'}] as const;
export type ClubInput={seq:number;at:number;dx:number;dy:number;aim:number;fire:boolean;dash:boolean;brake:boolean;fireSeq?:number;dashSeq?:number;targetY?:number;tx?:number;ty?:number};
export type ClubActor={id:string;x:number;y:number;vx:number;vy:number;angle:number;alive:boolean;hp:number;score:number;deaths:number;cooldown:number;respawnAt:number;shieldUntil:number;checkpoint:number;lap:number;z:number;vz:number;finishedAt:number|null;hullAngle?:number;lastShotAt?:number;ammo?:number;reloadUntil?:number;lastFireSeq?:number;lastDashSeq?:number;spawnedAt?:number;eliminatedAt?:number};
export type PartyGame={kind:PartyKind;worldScale?:number;map:ClubMap;actors:ClubActor[];inputs:Record<string,ClubInput>;startAt:number;lastTickAt:number;deadline:number;pausedAt:number|null;tick:number;shots:{x:number;y:number;vx:number;vy:number;owner:string;bounces:number;until:number}[];ball:{x:number;y:number;vx:number;vy:number;serveAt:number};winnerIds:string[];ended:boolean;scores:Record<string,number>};
export const TANK_RADIUS=34;
const tankWallCache=new Map<string,{x:number;y:number;w:number;h:number}[]>();
const clamp=(n:number,a:number,b:number)=>Math.max(a,Math.min(b,n));
export function clubTrack(map:ClubMap,count=192){return trackPoints(map==='canyon'?'coast':map==='neon'?'night':'meadow',count,3)}
export const partyScale=(g:PartyGame)=>g.worldScale||1;
export function tankWalls(map:ClubMap,scale=1){const key=map+scale,known=tankWallCache.get(key);if(known)return known;const walls=[{x:250,y:135,w:44,h:125},{x:666,y:360,w:44,h:125},{x:420,y:255,w:120,h:42},{x:200,y:430,w:150,h:32},{x:610,y:135,w:150,h:32}];if(map==='canyon')walls.push({x:440,y:80,w:40,h:90},{x:450,y:440,w:40,h:90});if(map==='neon')walls.push({x:90,y:280,w:90,h:30},{x:780,y:280,w:90,h:30});const result=scale===1?walls:walls.map(w=>({x:w.x*scale,y:w.y*scale,w:w.w*scale,h:w.h*scale}));tankWallCache.set(key,result);return result}
const starts=[[100,100],[860,500],[860,100],[100,500],[520,100],[520,500],[100,300],[860,300]];
export function newParty(s:CasualState,now:number):PartyGame{
 const kind=s.mode as PartyKind,worldScale=kind==='tanks'?1.5:kind==='sumo'?1.3:1,map=s.settings.arena||'garden',ps=livePlayers(s),pts=clubTrack(map,32),a=pts[0],b=pts[1],angle=Math.atan2(b.y-a.y,b.x-a.x);
 const actors=ps.map((p,i)=>{const theta=i/ps.length*Math.PI*2;let x=480+Math.cos(theta)*155,y=310+Math.sin(theta)*155;if(kind==='tanks')[x,y]=starts[i];if(kind==='pong'){x=i?896:64;y=300}if(kind==='marble'){x=a.x-Math.cos(angle)*Math.floor(i/2)*56-Math.sin(angle)*(i%2?20:-20);y=a.y-Math.sin(angle)*Math.floor(i/2)*56+Math.cos(angle)*(i%2?20:-20)}x*=worldScale;y*=worldScale;return{id:p.id,x,y,ammo:5,reloadUntil:0,hullAngle:0,vx:0,vy:0,angle:kind==='marble'?angle:Math.atan2(310*worldScale-y,480*worldScale-x),alive:true,hp:3,score:0,deaths:0,cooldown:0,respawnAt:0,shieldUntil:now+4200,checkpoint:1,lap:0,z:0,vz:0,finishedAt:null}});
 return{kind,worldScale,map,actors,inputs:{},startAt:now+3000,lastTickAt:now+3000,deadline:now+(kind==='marble'?243000:kind==='pong'?183000:123000),pausedAt:null,tick:0,shots:[],ball:{x:480,y:300,vx:280,vy:130,serveAt:now+3500},winnerIds:[],ended:false,scores:Object.fromEntries(ps.map(p=>[p.id,0]))};
}
function moveCircle(a:ClubActor,dt:number,walls:ReturnType<typeof tankWalls>,radius=21,scale=1){a.x=clamp(a.x+a.vx*dt,45*scale+radius,915*scale-radius);a.y=clamp(a.y+a.vy*dt,55*scale+radius,565*scale-radius);for(const r of walls){const x=clamp(a.x,r.x,r.x+r.w),y=clamp(a.y,r.y,r.y+r.h),dx=a.x-x,dy=a.y-y,d=Math.hypot(dx,dy);if(d<radius){if(d>0){a.x+=dx/d*(radius-d);a.y+=dy/d*(radius-d)}else{const sides=[{d:a.x-r.x,x:r.x-radius,y:a.y},{d:r.x+r.w-a.x,x:r.x+r.w+radius,y:a.y},{d:a.y-r.y,x:a.x,y:r.y-radius},{d:r.y+r.h-a.y,x:a.x,y:r.y+r.h+radius}].sort((a,b)=>a.d-b.d);a.x=sides[0].x;a.y=sides[0].y}}}}
export function sumoRadius(g:PartyGame,now:number){return (238-Math.max(0,g.tick*50-45000)/75000*60)*partyScale(g)}
function collideActors(g:PartyGame,radius:number,push:number){for(let i=0;i<g.actors.length;i++)for(let j=i+1;j<g.actors.length;j++){const a=g.actors[i],b=g.actors[j];if(!a.alive||!b.alive||a.z>12||b.z>12)continue;const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);if(d>=radius*2)continue;const nx=d?dx/d:Math.cos((i+j)*2.4),ny=d?dy/d:Math.sin((i+j)*2.4),overlap=(radius*2-d)/2;a.x-=nx*overlap;a.y-=ny*overlap;b.x+=nx*overlap;b.y+=ny*overlap;const speed=(a.vx-b.vx)*nx+(a.vy-b.vy)*ny;if(speed>0){a.vx-=nx*(speed*.65+push);a.vy-=ny*(speed*.65+push);b.vx+=nx*(speed*.65+push);b.vy+=ny*(speed*.65+push)}}}
/** Small, bounded substeps keep fast projectiles and circle collisions stable. */
export function stepParty(g:PartyGame,dt:number,now:number){
 if(now<g.startAt||g.ended)return;const steps=Math.ceil(dt/.01),h=dt/steps,scale=partyScale(g),walls=g.kind==='tanks'?tankWalls(g.map,scale):[];
 for(let sub=0;sub<steps;sub++){
  const at=now-dt*1000+(sub+1)*h*1000;
  for(const a of g.actors){
   if(a.finishedAt!==null)continue;
   if(!a.alive){if(a.respawnAt&&at>=a.respawnAt){a.alive=true;a.spawnedAt=at;a.hp=3;a.vx=a.vy=a.z=a.vz=0;a.cooldown=at;a.shieldUntil=at+1300;if(g.kind==='marble'){const path=clubTrack(g.map),cps=clubTrack(g.map,32);let index=(a.checkpoint+31)%32;for(let attempt=0;attempt<32&&[30,92,145].some(i=>Math.hypot(cps[index].x-path[i].x,cps[index].y-path[i].y)<85);attempt++)index=(index+31)%32;const p=cps[index];a.x=p.x;a.y=p.y}else{const p=starts[g.actors.indexOf(a)];a.x=p[0]*scale;a.y=p[1]*scale;a.ammo=5;a.reloadUntil=0}}else continue}
   const raw=g.inputs[a.id],input=raw&&at-raw.at<950?raw:null,dx=input?.dx||0,dy=input?.dy||0;
   if(g.kind==='pong'){const dyTarget=input?.targetY!==undefined?clamp((input.targetY-a.y)/30,-1,1):dy;a.y=clamp(a.y+dyTarget*430*h,120,480);continue}
   const norm=Math.max(1,Math.hypot(dx,dy)),speed=g.kind==='tanks'?155:g.kind==='marble'?180:190;
   a.vx+=dx/norm*(g.kind==='marble'?360:850)*h;a.vy+=dy/norm*(g.kind==='marble'?360:850)*h;
   const damp=Math.exp(-h*(g.kind==='marble'?(input?.brake?10:1.3):4));a.vx*=damp;a.vy*=damp;
   const v=Math.hypot(a.vx,a.vy),cap=g.kind==='sumo'&&a.cooldown-at>1650?580:speed;if(v>cap){a.vx*=cap/v;a.vy*=cap/v}
   if(input)a.angle=g.kind==='tanks'&&input.tx!==undefined&&input.ty!==undefined?Math.atan2(input.ty-a.y,input.tx-a.x):input.aim;
   if(g.kind==='sumo'){
    if((input?.dash||(input?.dashSeq||0)>(a.lastDashSeq||0))&&at>=a.cooldown){a.lastDashSeq=input?.dashSeq||input?.seq||0;a.vx+=Math.cos(a.angle)*440;a.vy+=Math.sin(a.angle)*440;a.cooldown=at+2100}
    a.x+=a.vx*h;a.y+=a.vy*h;if(Math.hypot(a.x-480*partyScale(g),a.y-310*partyScale(g))>sumoRadius(g,at)+9){a.alive=false;a.eliminatedAt=at;a.deaths++;a.vx=a.vy=0}
   }else if(g.kind==='tanks'){
    moveCircle(a,h,walls,TANK_RADIUS,scale);
    if(Math.hypot(a.vx,a.vy)>4)a.hullAngle=Math.atan2(a.vy,a.vx);
    if(a.reloadUntil&&at>=a.reloadUntil){a.ammo=5;a.reloadUntil=0}
    if((input?.fire||(input?.fireSeq||0)>(a.lastFireSeq||0))&&at>=a.cooldown&&!a.reloadUntil){a.lastFireSeq=input?.fireSeq||input?.seq||0;g.shots.push({x:a.x+Math.cos(a.angle)*29,y:a.y+Math.sin(a.angle)*29,vx:Math.cos(a.angle)*450,vy:Math.sin(a.angle)*450,owner:a.id,bounces:0,until:at+2500});a.lastShotAt=at;a.ammo=(a.ammo??5)-1;if(a.ammo<=0)a.reloadUntil=at+1800;a.vx-=Math.cos(a.angle)*35;a.vy-=Math.sin(a.angle)*35;a.cooldown=at+650}
   }else{
    if((input?.dash||(input?.dashSeq||0)>(a.lastDashSeq||0))&&a.z===0&&at>=a.cooldown){a.lastDashSeq=input?.dashSeq||input?.seq||0;a.vz=205;a.cooldown=at+1100}a.vz-=520*h;a.z=Math.max(0,a.z+a.vz*h);if(!a.z)a.vz=0;
    a.x+=a.vx*h;a.y+=a.vy*h;const pts=clubTrack(g.map),cp=clubTrack(g.map,32)[a.checkpoint],pit=[30,92,145].some(i=>Math.hypot(a.x-pts[i].x,a.y-pts[i].y)<34);
    if(a.z<6&&at>a.shieldUntil&&(distanceToTrack(g.map==='canyon'?'coast':g.map==='neon'?'night':'meadow',a.x,a.y,3)>64||pit)){a.alive=false;a.respawnAt=at+900;a.deaths++;a.vx=a.vy=0;continue}
    if(Math.hypot(a.x-cp.x,a.y-cp.y)<85){a.checkpoint=(a.checkpoint+1)%32;if(a.checkpoint===1){a.lap++;if(a.lap===2)a.finishedAt=at}a.score=a.lap*32+(a.checkpoint+31)%32}
   }
  }
  if(g.kind==='sumo'||g.kind==='marble')collideActors(g,g.kind==='sumo'?26:20,g.kind==='sumo'?30:0);
  if(g.kind==='tanks')for(let pass=0;pass<2;pass++){collideActors(g,TANK_RADIUS,0);for(const actor of g.actors)if(actor.alive)moveCircle(actor,0,walls,TANK_RADIUS,scale)}
  if(g.kind==='sumo')for(const a of g.actors)if(a.alive&&Math.hypot(a.x-480*partyScale(g),a.y-310*partyScale(g))>sumoRadius(g,at)+9){a.alive=false;a.eliminatedAt=at;a.deaths++;a.vx=a.vy=0}
  if(g.kind==='tanks'){
   const retained:PartyGame['shots']=[];
   for(const shot of g.shots){if(shot.until<at)continue;const px=shot.x,py=shot.y;shot.x+=shot.vx*h;shot.y+=shot.vy*h;let hit=false;
    const wall=walls.find(r=>shot.x>=r.x-3&&shot.x<=r.x+r.w+3&&shot.y>=r.y-3&&shot.y<=r.y+r.h+3),edgeX=shot.x<48*scale||shot.x>912*scale,edgeY=shot.y<58*scale||shot.y>562*scale;
    if(wall||edgeX||edgeY){if(shot.bounces++)continue;if(edgeX||wall&&(px<wall.x||px>wall.x+wall.w))shot.vx*=-1;else shot.vy*=-1;shot.x=px;shot.y=py}
    for(const a of g.actors)if(a.alive&&a.id!==shot.owner&&at>a.shieldUntil&&Math.hypot(a.x-shot.x,a.y-shot.y)<TANK_RADIUS+5){a.hp--;hit=true;if(a.hp<=0){a.alive=false;a.deaths++;a.respawnAt=at+1800;const owner=g.actors.find(p=>p.id===shot.owner);if(owner)owner.score++}break}
    if(!hit)retained.push(shot)
   }g.shots=retained.slice(-40);
  }
  if(g.kind==='pong'&&at>=g.ball.serveAt){const b=g.ball;b.x+=b.vx*h;b.y+=b.vy*h;if(b.y<65){b.y=65;b.vy=Math.abs(b.vy)}if(b.y>535){b.y=535;b.vy=-Math.abs(b.vy)}
   for(const [i,a]of g.actors.entries())if((i===0?b.vx<0:b.vx>0)&&Math.abs(b.x-a.x)<20&&Math.abs(b.y-a.y)<65){b.x=a.x+(i===0?21:-21);const angle=clamp((b.y-a.y)/60,-1,1)*1.03,speed=Math.min(570,Math.hypot(b.vx,b.vy)+18);b.vx=Math.cos(angle)*speed*(i===0?1:-1);b.vy=clamp(Math.sin(angle)*speed+(g.inputs[a.id]?.dy||0)*45,-520,520)}
   if(b.x<15||b.x>945){const winner=g.actors[b.x<15?1:0];if(winner)winner.score++;b.x=480;b.y=300;b.vx=(winner===g.actors[0]?1:-1)*290;b.vy=(g.tick%2?1:-1)*130;b.serveAt=at+900}
  }
 }
 for(const a of g.actors)g.scores[a.id]=a.score;g.tick++;
 if(g.kind==='sumo'&&g.actors.filter(a=>a.alive).length<=1){g.winnerIds=g.actors.filter(a=>a.alive).map(a=>a.id);g.ended=true}
 if(g.kind==='pong'&&g.actors.some(a=>a.score>=11&&a.score-Math.min(...g.actors.map(p=>p.score))>=2)){g.winnerIds=g.actors.filter(a=>a.score===Math.max(...g.actors.map(a=>a.score))).map(a=>a.id);g.ended=true}
 if(g.kind==='marble'&&g.actors.some(a=>a.finishedAt!==null)){g.winnerIds=g.actors.filter(a=>a.finishedAt===Math.min(...g.actors.map(a=>a.finishedAt??Infinity))).map(a=>a.id);g.ended=true}
}
export function partyRank(g:PartyGame){const distance=(a:ClubActor)=>g.kind==='marble'?Math.hypot(a.x-clubTrack(g.map,32)[a.checkpoint].x,a.y-clubTrack(g.map,32)[a.checkpoint].y):Math.hypot(a.x-480*partyScale(g),a.y-310*partyScale(g));return[...g.actors].sort((a,b)=>g.kind==='sumo'?Number(b.alive)-Number(a.alive)||distance(a)-distance(b):g.kind==='marble'?(a.finishedAt??Infinity)-(b.finishedAt??Infinity)||b.score-a.score||distance(a)-distance(b):b.score-a.score)}
export function advanceParty(s:CasualState,now:number){const g=s.game as PartyGame;if(now<g.startAt)return false;if(now-g.lastTickAt>8000){s.phase='paused';g.pausedAt=now;s.pauseReason='The room paused after a connection gap. Resume when your crew returns.';return true}let changed=false;while(g.lastTickAt+50<=Math.min(now,g.deadline)&&!g.ended){g.lastTickAt+=50;stepParty(g,.05,g.lastTickAt);changed=true}if(now>=g.deadline||g.ended){if(!g.ended){const score=(a:ClubActor)=>g.kind==='sumo'?(a.alive?100000:0)-Math.hypot(a.x-480*partyScale(g),a.y-310*partyScale(g)):a.score,max=Math.max(...g.actors.map(score));g.winnerIds=g.actors.filter(a=>score(a)===max).map(a=>a.id);if(g.kind==='marble'){const rank=partyRank(g),first=rank[0],next=clubTrack(g.map,32)[first.checkpoint],distance=Math.hypot(first.x-next.x,first.y-next.y);g.winnerIds=rank.filter(a=>a.score===first.score&&Math.abs(Math.hypot(a.x-next.x,a.y-next.y)-distance)<.001).map(a=>a.id)}}finish(s,g.winnerIds,g.kind==='sumo'?'Ring complete. Last standing, or closest to the center at time, wins.':g.kind==='marble'?'Race complete. First through two validated laps wins.':'Match complete. Highest score wins.',now);changed=true}return changed}
export function partyAction(s:CasualState,a:Record<string,any>,id:string,now:number){const g=s.game as PartyGame,actor=g.actors.find(p=>p.id===id);if(a.action!=='party-control')throw new CasualError('Use the arena controls.');if(!actor)throw new CasualError('Your arena seat is unavailable.',403);if(!actor.alive||actor.finishedAt!==null)throw new CasualError('This actor is not accepting inputs.',409);if(!Number.isSafeInteger(a.seq)||a.seq<1||![a.dx,a.dy,a.aim].every(Number.isFinite)||Math.abs(a.dx)>1||Math.abs(a.dy)>1||Math.abs(a.aim)>Math.PI*4||(a.targetY!==undefined&&(!Number.isFinite(a.targetY)||a.targetY<0||a.targetY>600)))throw new CasualError('Invalid arena controls.');for(const key of ['fireSeq','dashSeq'])if(a[key]!==undefined&&(!Number.isSafeInteger(a[key])||a[key]<0||a[key]>a.seq))throw new CasualError('Invalid action sequence.');if(actor&&now<actor.cooldown){if(a.fireSeq)actor.lastFireSeq=Math.max(actor.lastFireSeq||0,a.fireSeq);if(a.dashSeq)actor.lastDashSeq=Math.max(actor.lastDashSeq||0,a.dashSeq)}if((a.tx!==undefined||a.ty!==undefined)&&(!Number.isFinite(a.tx)||!Number.isFinite(a.ty)||a.tx<0||a.tx>960*partyScale(g)||a.ty<0||a.ty>600*partyScale(g)))throw new CasualError('Aim inside the arena.');if((g.inputs[id]?.seq||0)>=a.seq)return;g.inputs[id]={seq:a.seq,at:now,dx:a.dx,dy:a.dy,aim:a.aim,fire:a.fire===true,dash:a.dash===true,brake:a.brake===true,fireSeq:a.fireSeq||0,dashSeq:a.dashSeq||0,...(a.tx!==undefined?{tx:a.tx,ty:a.ty}:{}),...(a.targetY!==undefined?{targetY:a.targetY}:{})}}
