/**
 * Pure 60 Hz platform-fighter simulation adapted from the user-provided
 * Pirate Bomb Brawl upload. No DOM, network, audio, or wall-clock access.
 * References are hydrated only inside this call, then encoded as stable IDs.
 * Cosmetic particles never enter durable storage or multiplayer snapshots.
 */
import {PIRATE_CHARACTERS as ST,PIRATE_SKILLS as SP,PIRATE_MODES,PIRATE_MAPS,PIRATE_FX_FRAMES} from './pirate-data.ts';
const cl=(v,a,b)=>Math.max(a,Math.min(b,v));
const RC=['#c8d7ee','#4aa8ff','#c77dff','#ffd24a'];
const CAST=SP.map((q,i)=>q.i?-1:i).filter(i=>i>=0);
export function createPirateWorld(map,variant,seats,seed,stocks=3,difficulty=1){
 const MP=PIRATE_MAPS.find(m=>m.id===map)||PIRATE_MAPS[0],GM=PIRATE_MODES.find(m=>m.id===variant)||PIRATE_MODES[0];
 const fighters=seats.map((p,i)=>{const q=MP.sp[i%MP.sp.length];return{id:p.id,i,t:p.bot?1:0,ch:p.character,color:p.color,model:p.model,x:q[0],y:q[1],vx:0,vy:0,face:q[0]<MP.w/2?1:-1,dmg:0,life:0,st:GM.st||stocks,dead:0,rt:0,inv:60,at:0,cd:0,hs:0,on:1,cy:6,dj:1,dd:0,pu:0,pa:0,pb:0,bomb:null,h:{},sp:null,fz:0,sh:0,gi:0,hz:0,mj:0,lv:.8,jb:0,jh:0,ba:0,ad:0,sc:0,dsh:0,dc:0,dk:0,ps:0,pj:0,ko:0,la:null,lt:0,ra:0,mx:null,my:null,pp:null,sg:0,sq:0,vp:0,gh:0,pl:0,sl:0,kt:0,rf:0,dd2:0,jp:0,slm:0,ks:0,sw:0,lastSeq:0,jumpSeq:0,attackSeq:0,specialSeq:0,dashSeq:0}});
 const objects=GM.chest===0?[]:[{k:'b',x:MP.bt[0],y:MP.bt[1],cd:0},...MP.ch.slice(0,2).map(q=>({k:'c',x:q[0],y:q[1],op:0,f:0}))];
 return{map:MP.id,variant:GM.id,seed:seed>>>0||1,difficulty,tick:0,elapsed:0,fighters,bombs:[],projectiles:[],strikes:[],zones:[],objects,explosions:[],effects:[],texts:[],rings:[],impacts:[],arcs:[],beams:[],rewards:[],knockouts:[],event:{t:0,s:''},jumpPads:(MP.jp||[]).map(q=>({x:q[0],y:q[1],sq:0})),nb:200,ct:420,sk:240,lg:0,ice:0,potT:60,ended:false,winnerIds:[],flash:0,shake:0};
}
export function hydratePirateWorld(world){
 const base=PIRATE_MAPS.find(m=>m.id===world.map)||PIRATE_MAPS[0],MP={...base,p:base.p.map(p=>({...p,mv:p.mv?{...p.mv}:undefined,bx:p.x,by:p.y,dx:0,dy:0})),jp:base.jp?.map(p=>[...p])},F=world.fighters.map(f=>({...f,h:{...f.h},s:ST[f.ch]})),byId=new Map(F.map(f=>[f.id,f])),B=world.bombs.filter(b=>!b.dead).map(b=>({...b})),byBomb=new Map(B.map(b=>[b.id,b]));
 for(const f of F){f.la=byId.get(f.la)||null;f.bomb=byBomb.get(f.bomb)||null;f.pp=Number.isInteger(f.pp)?MP.p[f.pp]||null:null}
 for(const b of B){b.h=byId.get(b.h)||null;b.own=byId.get(b.own)||null}
 const owned=items=>items.map(q=>({...q,own:byId.get(q.own)||null,...(q.ht?{ht:{...q.ht}}:{})}));
 return{MP,F,B,PJ:owned(world.projectiles),SK:owned(world.strikes),ZN:owned(world.zones)};
}
export function stepPirateWorld(world,inputs,steps,now,reward){
 if(world.ended)return;
 let {MP,F,B,PJ,SK,ZN}=hydratePirateWorld(world),P=MP.p,GM=PIRATE_MODES.find(m=>m.id===world.variant)||PIRATE_MODES[0],T=world.tick,tm=world.elapsed,nb=world.nb,ct=world.ct,sk=world.sk,lg=world.lg,ice=world.ice,potT=world.potT,EV={...world.event},dif=world.difficulty,gv=lg>0?.45:1,intro=0,over=0,win=null,shake=world.shake,flash=world.flash,frz=0,ts=0;
 let O=world.objects.map(o=>({...o})),X=world.explosions.map(e=>({...e})),V=world.effects.map(v=>({...v})),TX=world.texts.map(t=>({...t})),RG=world.rings.map(r=>({...r})),IP=world.impacts.map(p=>({...p})),AR=world.arcs.map(a=>({...a})),BM=world.beams.map(b=>({...b})),RW=[],Q=[],M=(world.knockouts||[]).map(m=>({...m})),TO=[],fps=60;
 const A={fx:Object.fromEntries(Object.entries(PIRATE_FX_FRAMES).map(([k,n])=>[k,{n}]))},COL=F.map(f=>f.color),KH=F.map(()=> 'Special'),W=960,H=540,cam={x:MP.w/2,y:MP.h/2,z:.6};
 const R=()=>{let x=world.seed||1;x^=x<<13;x^=x>>>17;x^=x<<5;world.seed=x>>>0;return world.seed/4294967296};
 const gy=x=>Math.min(MP.h-60,...P.filter(p=>x>p.x&&x<p.x+p.w).map(p=>p.y));
 const pt=()=>{},dust=()=>{},imp=(x,y,vx,vy,sz)=>IP.push({x,y,a:Math.atan2(vy,vx),l:16,sz}),tx=(x,y,s,c)=>TX.push({x,y,l:80,c,s}),toast=()=>{},camUpd=()=>{};
 const pads=world.jumpPads.map(p=>({...p})),jpl=()=>pads;
 function movP(t){for(const p of P)if(p.mv){const m=p.mv,a=t*m.sp+m.ph,ox=p.x,oy=p.y;p.x=p.bx+Math.sin(a)*(m.ax||0);p.y=p.by+Math.cos(a)*(m.ay||0);p.dx=p.x-ox;p.dy=p.y-oy}}
 movP(tm);for(const p of P)p.dx=p.dy=0;
 function respawn(f){const alive=F.filter(o=>o!==f&&!o.dead&&o.st>0);return MP.sp.map((p,i)=>({p,i,score:Math.min(9999,...alive.map(o=>Math.abs(o.x-p[0])+Math.abs(o.y-p[1])))})).sort((a,b)=>b.score-a.score||a.i-b.i)[0].p}
 function inp(index){const f=F[index],input=inputs[f.id];if(!input||now-input.at>400)return{};const k={l:input.dx<0,r:input.dx>0,d:input.down,u:input.jump,a:input.attack,b:input.special,s:input.dash,m:Number.isFinite(input.aimX),mx:input.aimX,my:input.aimY};for(const [key,flag,prior]of[['jumpSeq','u','pj'],['attackSeq','a','pa'],['specialSeq','b','pb'],['dashSeq','s','ps']])if(input[key]>f[key]){f[key]=input[key];f[prior]=0;k[flag]=true}f.lastSeq=Math.max(f.lastSeq,input.seq);return k}
 function end(){world.ended=true;const eligible=F.filter(f=>f.st>0);if(GM.inf){const best=eligible.slice().sort((a,b)=>b.ko-a.ko||a.dmg-b.dmg)[0];world.winnerIds=best?eligible.filter(f=>f.ko===best.ko&&f.dmg===best.dmg).map(f=>f.id):[]}else world.winnerIds=eligible.length===1?[eligible[0].id]:[]}
function chaos(){const e=R()*7|0;EV.s=['LOW GRAVITY','BOMB RAIN','LIGHTNING STORM','SKILL RAIN','SLIPPERY FLOOR','GIANT SURPRISE','SPEED RUSH'][e];EV.t=170;shake=8;
 if(e==0)lg=720;else if(e==1){for(let i=0;i<8;i++)B.push({x:80+R()*(MP.w-160),y:-40-i*70,vx:0,vy:0,st:1,t:100+R()*80|0,h:null,own:null,fl:0})}
 else if(e==2){for(let i=0;i<5;i++)strike(null,null,i*25)}
 else if(e==3){for(let i=0;i<3;i++){const q=MP.ch[R()*MP.ch.length|0];if(!O.some(o=>o.k=='c'&&!o.op&&o.x==q[0]&&o.y==q[1])){O.push({k:'c',x:q[0],y:q[1],op:0,f:0});V.push({k:'smoke',x:q[0],y:q[1]-30,f:0,sc:1.2})}}}
 else if(e==4)ice=480;else if(e==5){const a=F.filter(f=>!f.dead&&f.st>0),h=a[R()*a.length|0];if(h){h.gi=600;h.hz=300;RG.push({x:h.x,y:h.y-20,r:8,m:120,c:'#ff6bd6',l:20})}}
 else for(const f of F)f.hz=420}
function hit(o,vx,vy,src){if(o.fz>0){o.fz=0;o.dmg+=6}o.vx=vx;o.vy=vy;o.jh=0;o.dsh=0;o.slm=0;if(src&&src!=o){o.la=src;o.lt=240}o.hs=14+Math.hypot(vx,vy)*.8|0;o.on=0;o.at=0;o.face=vx>0?-1:1;
 if(o.bomb&&!o.bomb.pot){o.bomb.h=null;o.bomb.own=null;o.bomb.vx=vx*.5;o.bomb.vy=-4;o.bomb=null}
 frz=Math.max(frz,3);shake=Math.max(shake,Math.min(14,Math.hypot(vx,vy)*.5));{const hx=o.x,hy=o.y-o.s.h/2,m=Math.hypot(vx,vy);imp(hx,hy,vx,vy,Math.min(1.8,.7+m/14));for(let i=0;i<10;i++)Q.length<(fps<45?160:400)&&Q.push({x:hx,y:hy,vx:vx*.5+(R()-.5)*9,vy:vy*.3+(R()-.5)*9,l:14+R()*10,c:i%2?'#fff4c8':'#ffd24a'})}}
function give(f,bo,forced){if(!f||GM.skl===0||GM.pot)return;let r=(u=>u<.55?0:u<.83?1:u<.96?2:3)(R());if(bo&&r<3&&R()<.6)r++;if(forced!==undefined)r=SP[forced].r;
 const pool=SP.map((q,i)=>q.r==r?i:-1).filter(i=>i>=0),n=forced??pool[R()*pool.length|0],s=SP[n],k=s.k,C=RC[r];
 if(s.i){if(k=='holy')f.sh=f.inv=360;if(k=='giant')f.gi=600;if(k=='haste')f.hz=600;if(k=='moon')f.mj=600;if(k=='heal')f.dmg=Math.max(0,f.dmg-40);if(k=='rage')f.ra=600;if(k=='vamp')f.vp=600;if(k=='ghost'){f.gh=480;f.inv=Math.max(f.inv,480)};
  if(k=='jet')f.jp=300;if(k=='refl')f.rf=360;if(k=='dd')f.dd2=480;
  if(k=='loot'){for(let i=0;i<3;i++){const q=MP.ch[R()*MP.ch.length|0];if(!O.some(o=>o.k=='c'&&!o.op&&o.x==q[0]&&o.y==q[1])){O.push({k:'c',x:q[0],y:q[1],op:0,f:0});V.push({k:'smoke',x:q[0],y:q[1]-30,f:0,sc:1.2})}}}
  if(k=='thief'){let v=null;for(const o of F)if(o!=f&&!o.dead&&o.st>0&&o.sp!=null&&(!v||SP[o.sp].r>SP[v.sp].r))v=o;if(v){const m=f.sp;f.sp=v.sp;v.sp=m;RG.push({x:v.x,y:v.y-20,r:6,m:60,c:'#b0ffb0',l:16})}else f.dmg=Math.max(0,f.dmg-25)}
  if(k=='arma'){for(let i=0;i<9;i++){const x=60+R()*(MP.w-120);SK.push({x,y:gy(x),t:30+i*14,f:-1,own:f,big:i%3==0})}flash=Math.max(flash,.3)}
  if(k=='life')f.st=Math.min(5,f.st+1);if(k=='stop'){ts=110;for(const o of F)if(o!=f&&!o.dead&&o.st>0&&!(o.gh>0)){o.fz=100;o.vx=o.vy=0}RG.push({x:f.x,y:f.y-20,r:10,m:520,c:'#aef0ff',l:30})}}else f.sp=n;
 imp(f.x,f.y-24,0,-1,1+r*.4);BM.push({x:f.x,y:f.y,l:40,c:C});RG.push({x:f.x,y:f.y-f.s.h/2,r:6,m:50+r*20,c:C,l:20});for(let i=0;i<8+r*8;i++)pt(f.x,f.y-20,C,1.5);if(r>2){flash=Math.max(flash,.25);shake=Math.max(shake,12)}
 tx(f.x,f.y-80,s.n+'!',C);if(!f.t||r>2)RW.push({t:170,n,i:f.i})}
function opn(o,f){if(o.op||!f)return;o.op=1;o.f=0;shake=Math.max(shake,5);give(f,R()<.25)}
function strike(own,x,d){const a=F.filter(o=>!o.dead&&o.st>0),t=a[R()*a.length|0];x=x??(t&&R()<.6?t.x:R()*MP.w);SK.push({x,y:gy(x),t:40+(d||0),f:-1,own})}
function press(o,f){if(o.cd>0||!f)return;o.cd=900;shake=Math.max(shake,8);const e=R()*3|0;
 if(e==0){tx(o.x,o.y-90,'BOMB RAIN','#ff9f43');for(let i=0;i<8;i++)B.push({x:80+R()*(MP.w-160),y:-40-i*70,vx:0,vy:0,st:1,t:100+R()*80|0,h:null,own:null,fl:0})}
 else if(e==1){tx(o.x,o.y-90,'LOW GRAVITY','#c9a6ff');lg=720}
 else{tx(o.x,o.y-90,'STORM','#fff4a0');for(let i=0;i<4;i++)strike(null,null,i*30)}}
function cast(f){const s=SP[f.sp],k=s.k,cy=f.y-f.s.h/2,fc=f.face;f.sp=null;f.sg=GM.spam?60:0;RG.push({x:f.x,y:cy,r:6,m:46,c:s.c,l:16});tx(f.x,f.y-f.s.h-30,s.n.toUpperCase(),s.c);
 const foe=()=>{let t=null,bd=1e9;for(const o of F)if(o!=f&&!o.dead&&o.st>0&&!(o.gh>0)){const d=Math.abs(o.x-f.x)+Math.abs(o.y-f.y);if(d<bd){bd=d;t=o}}return t},
 near=(r,fn)=>{for(const o of F)if(o!=f&&!o.dead&&o.st>0&&o.inv<=0&&!(o.gh>0)&&Math.hypot(o.x-f.x,o.y-o.s.h/2-cy)<r)fn(o)};
 if(k=='fire'||k=='ice'||k=='hook'||k=='stun'){const dx=f.mx!=null?f.mx-f.x:f.face,sp={fire:10,ice:7,hook:14,stun:8}[k],sg=dx>0?1:-1;f.face=sg;PJ.push({x:f.x+sg*26,y:cy,vx:sg*sp,vy:f.mx!=null?cl((f.my-cy)/Math.max(60,Math.abs(dx)),-.6,.6)*sp:0,k,own:f,l:k=='hook'?36:90,f:0})}
 else if(k=='thun'){const t=foe();if(t)SK.push({x:t.x,y:t.y,t:34,f:-1,own:f})}
 else if(k=='wave'){RG.push({x:f.x,y:cy,r:10,m:170,c:'#fff',l:22});shake=10;near(170,o=>{o.dmg+=6;const kb=8+o.dmg*.12;hit(o,(o.x>=f.x?1:-1)*kb,-kb*.5-3,f)})}
 else if(k=='nova'){RG.push({x:f.x,y:cy,r:10,m:170,c:'#bfefff',l:24},{x:f.x,y:cy,r:4,m:110,c:'#fff',l:18});shake=8;for(let i=0;i<20;i++)pt(f.x,cy,'#bfefff',2.2);near(165,o=>{o.fz=75;o.vx=o.vy=0;o.dmg+=4;V.push({k:'iceH',x:o.x,y:o.y-o.s.h/2,f:0,sc:2.5})})}
 else if(k=='dash'){f.dsh=14;f.dk=1;f.h={};f.inv=Math.max(f.inv,16)}
 else if(k=='bombs'){for(let i=-1;i<2;i++)B.push({x:f.x+fc*20,y:f.y-f.s.h-6,vx:fc*(5+i*1.5)+i,vy:-6-Math.abs(i)*1.5,st:1,t:70+i*10,h:null,own:f,fl:50})}
 else if(k=='mine'){B.push({x:f.x+fc*14,y:f.y-8,vx:fc*2,vy:-3,st:1,t:720,h:null,own:f,fl:720,mine:1})}
 else if(k=='storm'){const a=F.filter(o=>o!=f&&!o.dead&&o.st>0);for(let i=0;i<3&&a.length;i++){const t=a[R()*a.length|0];SK.push({x:t.x+(R()-.5)*80,y:gy(t.x),t:30+i*22,f:-1,own:f})}}
 else if(k=='blink'){const dx=f.mx!=null?f.mx-f.x:fc*260,sg=dx>0?1:-1;let nx=f.x+sg*Math.min(Math.abs(dx),280),ny=f.y;const pl=P.filter(p=>nx>p.x-8&&nx<p.x+p.w+8&&p.y>f.y-230&&p.y<f.y+250).sort((a,b)=>Math.abs(a.y-f.y)-Math.abs(b.y-f.y))[0];
  if(pl){nx=cl(nx,pl.x+8,pl.x+pl.w-8);ny=pl.y}else nx=f.x+sg*110;
  V.push({k:'smoke',x:f.x,y:f.y-24,f:0,sc:1});f.x=nx;f.y=ny;f.vx=sg*5;f.vy=0;f.face=sg;f.inv=Math.max(f.inv,20);RG.push({x:nx,y:ny-20,r:6,m:60,c:s.c,l:16});V.push({k:'smoke',x:nx,y:ny-24,f:0,sc:1})}
 else if(k=='cyc'){PJ.push({x:f.x+fc*20,y:cy,vx:fc*9,vy:0,k:'cyc',own:f,l:70,f:0,ht:{}})}
 else if(k=='pois'){ZN.push({k:'pois',x:f.x+fc*70,y:f.y-24,r:95,l:300,m:300,own:f})}
 else if(k=='well'){ZN.push({k:'well',x:f.x+fc*150,y:f.y-60,r:210,l:110,m:110,own:f})}
 else if(k=='chain'){let c=f;const pts=[{x:f.x,y:cy}],seen=[f];for(let i=0;i<4;i++){let t=null,bd=i?260:420;for(const o of F)if(!seen.includes(o)&&!o.dead&&o.st>0&&!(o.gh>0)){const d=Math.hypot(o.x-c.x,o.y-c.y);if(d<bd){bd=d;t=o}}if(!t)break;seen.push(t);c=t;pts.push({x:t.x,y:t.y-t.s.h/2});if(t.inv<=0){t.dmg+=8;const kb=3+t.dmg*.05;hit(t,(t.x>f.x?1:-1)*kb,-kb-2,f)}}AR.push({pts,l:16});shake=6}
 else if(k=='homing'){for(let i=0;i<3;i++){const a=-1.57+(i-1)*.65;PJ.push({x:f.x,y:cy-6,vx:Math.cos(a)*6,vy:Math.sin(a)*6,k:'mis',own:f,l:160,f:0})}}
 else if(k=='slam'){f.slm=1;f.vy=-13;f.on=0;f.inv=Math.max(f.inv,14);dust(f.x,f.y)}
 else if(k=='swap'){const t=foe();if(t){RG.push({x:f.x,y:cy,r:6,m:60,c:s.c,l:16},{x:t.x,y:t.y-t.s.h/2,r:6,m:60,c:s.c,l:16});[f.x,t.x]=[t.x,f.x];[f.y,t.y]=[t.y,f.y];f.vx=f.vy=t.vx=t.vy=0;f.inv=Math.max(f.inv,18);t.inv=Math.max(t.inv,10)}}
 else if(k=='dag'){const a0=f.mx!=null?Math.atan2(f.my-cy,f.mx-f.x):(fc>0?0:Math.PI);for(let i=-2;i<3;i++){const a=a0+i*.13;PJ.push({x:f.x+Math.cos(a)*20,y:cy+Math.sin(a)*20,vx:Math.cos(a)*13,vy:Math.sin(a)*13,k:'dag',own:f,l:42,f:0})}}
 else if(k=='fwall'){ZN.push({k:'fire',x:f.x+fc*90,y:f.y-16,r:62,l:200,m:200,own:f})}
 else if(k=='bliz'){ZN.push({k:'bliz',x:f.x+fc*120,y:f.y-60,r:150,l:260,m:260,own:f})}
 else if(k=='tor'){ZN.push({k:'tor',x:f.x+fc*40,y:f.y-40,r:66,l:200,m:200,own:f,vx:fc*2.2})}
 else if(k=='laser'){const a=f.mx!=null?Math.atan2(f.my-cy,f.mx-f.x):(fc>0?0:Math.PI),ex=f.x+Math.cos(a)*640,ey=cy+Math.sin(a)*640;
  for(const o of F)if(o!=f&&!o.dead&&o.st>0&&o.inv<=0&&!(o.gh>0)&&!(o.gh>0)){const px=o.x-f.x,py=o.y-o.s.h/2-cy,tl=Math.max(0,Math.min(640,px*Math.cos(a)+py*Math.sin(a))),dd=Math.hypot(px-Math.cos(a)*tl,py-Math.sin(a)*tl);if(dd<28){o.dmg+=11;const kb=7+o.dmg*.1;hit(o,Math.cos(a)*kb,Math.sin(a)*kb-3,f)}}
  AR.push({pts:[{x:f.x,y:cy},{x:ex,y:ey}],l:14,st:1,c:s.c});shake=8;flash=Math.max(flash,.06)}
 else if(k=='comet'){const t=foe();if(t)SK.push({x:t.x,y:t.y,t:55,f:-1,own:f,big:1})}
 else if(k=='quake'){shake=26;flash=Math.max(flash,.14);RG.push({x:f.x,y:f.y-6,r:10,m:320,c:'#d9b38c',l:26});for(const p of P)for(let i=0;i<6;i++)pt(p.x+R()*p.w,p.y,'#d9b38c',1.5);near(9999,o=>{if(o.on){o.dmg+=7;const kb=6+o.dmg*.08;hit(o,(o.x>=f.x?1:-1)*3,-kb-6,f)}})}
 else if(k=='fate'){const t=foe();if(t){RG.push({x:f.x,y:cy,r:6,m:60,c:s.c,l:16},{x:t.x,y:t.y-t.s.h/2,r:6,m:60,c:s.c,l:16});const d=f.dmg;f.dmg=t.dmg;t.dmg=d}}
 else if(k=='dice'){const c=SP.map((q,i)=>q.i||q.k=='dice'?-1:i).filter(i=>i>=0);f.sp=c[R()*c.length|0];cast(f)}}
function slam(f){shake=20;flash=Math.max(flash,.12);imp(f.x,f.y-4,0,-1,2.2);RG.push({x:f.x,y:f.y-6,r:8,m:230,c:'#d9b38c',l:22},{x:f.x,y:f.y-6,r:4,m:130,c:'#fff',l:16});for(let i=0;i<26;i++)pt(f.x,f.y,'#d9b38c',2.4);
 for(const o of F)if(o!=f&&!o.dead&&o.st>0&&o.inv<=0&&!(o.gh>0)&&Math.abs(o.x-f.x)<240&&Math.abs(o.y-f.y)<80){o.dmg+=10;const kb=8+o.dmg*.12;hit(o,(o.x>=f.x?1:-1)*kb*.7,-kb-5,f)}}
function boom(b){b.dead=1;X.push({x:b.x,y:b.y,f:0});shake=16;frz=4;if(b.h)b.h.bomb=null;if(b.pot){const h=b.h;if(h){h.inv=0;h.sh=0;hit(h,(R()-.5)*16,-80);h.la=null;flash=.35;RG.push({x:h.x,y:h.y-20,r:10,m:200,c:'#ff5a4a',l:26})}return}
 for(const o of F)if(!o.dead&&o.st>0&&o.inv<=0&&!(o.gh>0)){const dx=o.x-b.x,dy=o.y-o.s.h/2-b.y;if(Math.hypot(dx,dy)<(GM.big?140:95)){o.dmg+=(GM.big?20:14);const kb=9+o.dmg*.14,a=Math.atan2(dy,dx);hit(o,Math.cos(a)*kb,Math.sin(a)*kb-4,b.own)}}
 const w=b.own||F.find(f=>!f.dead&&f.st>0);for(const o of O)if(Math.hypot(o.x-b.x,o.y-16-b.y)<95){if(o.k=='c')opn(o,w);else press(o,w)}}
function bstep(b){
 if(b.h){const h=b.h;b.x=h.x+h.face*10;b.y=h.y-h.s.h-12;if(--b.t<=0)boom(b);return}
 b.vy+=.4*gv;b.x+=b.vx;const py=b.y;b.y+=b.vy;b.vx*=.99;
 for(const p of P)if(b.x>p.x&&b.x<p.x+p.w&&b.vy>=0&&py+10<=p.y+2&&b.y+10>=p.y){b.y=p.y-10;b.vy*=-.35;b.vx*=.7}
 if(b.y>MP.h+200){b.dead=1;return}
 for(const o of F){if(o.dead||o.st<=0)continue;const near=Math.abs(o.x-b.x)<o.s.w/2+12&&Math.abs(o.y-o.s.h/2-b.y)<o.s.h/2+12;
  if(!b.st&&near&&!o.bomb&&o.hs<=0){b.st=1;b.t=180;b.h=o;o.bomb=b;toast(o,'Bomb! '+KH[o.i]+' to throw');return}
  if(b.st&&b.fl>0&&near&&o!=b.own&&o.inv<=0&&!(o.gh>0)){boom(b);return}}
 if(b.st){b.fl>0&&b.fl--;if(--b.t<=0)boom(b)}}
function pstep(p){const w=p.own;
 if(p.k=='cyc'){if(p.l==35)p.ht={};if(p.l<=35){const dx=w.x-p.x;p.vx=cl(p.vx+(dx>0?.9:-.9),-9,9);p.y+=(w.y-w.s.h/2-p.y)*.08;if(Math.abs(dx)<22&&p.l<30)p.l=0}}
 else if(p.k=='mis'){let t=null,bd=1e9;for(const o of F)if(o!=w&&!o.dead&&o.st>0&&!(o.gh>0)){const d=Math.hypot(o.x-p.x,o.y-o.s.h/2-p.y);if(d<bd){bd=d;t=o}}
  if(t){const a=Math.atan2(t.y-t.s.h/2-p.y,t.x-p.x),c=Math.atan2(p.vy,p.vx),n=c+cl(Math.atan2(Math.sin(a-c),Math.cos(a-c)),-.12,.12);p.vx=Math.cos(n)*7.5;p.vy=Math.sin(n)*7.5}if(T%2==0)pt(p.x,p.y,'#ffb347',.2)}
 p.x+=p.vx;p.y+=p.vy||0;p.f++;if(--p.l<=0||p.x<-200||p.x>MP.w+200||p.y<-500||p.y>MP.h+200){p.l=0;return}
 for(const o of F)if(o!=w&&!o.dead&&o.st>0&&o.inv<=0&&!(o.gh>0)&&!(o.gh>0)&&Math.abs(o.x-p.x)<o.s.w/2+18&&Math.abs(o.y-o.s.h/2-p.y)<o.s.h/2+18){
  if(p.k=='cyc'){if(!p.ht[o.i]){p.ht[o.i]=1;o.dmg+=7;const kb=6+o.dmg*.1;hit(o,(p.vx>=0?1:-1)*kb,-kb*.4-2,w)}continue}
  if(o.rf>0){p.own=o;p.vx*=-1.2;p.vy=-(p.vy||0)*1.2;p.l=60;RG.push({x:p.x,y:p.y,r:4,m:40,c:'#7fe8ff',l:12});continue}
  p.l=0;
  if(p.k=='ice'){o.fz=110;o.vx=o.vy=0;o.dmg+=6;V.push({k:'iceH',x:o.x,y:o.y-o.s.h/2,f:0,sc:2.5})}
  else if(p.k=='hook'){o.dmg+=4;o.vx=(w.x-o.x)*.15;o.vy=-6;o.hs=12;AR.push({pts:[{x:w.x,y:w.y-w.s.h/2},{x:o.x,y:o.y-o.s.h/2}],l:12,st:1,c:'#c9b38a'})}
  else if(p.k=='stun'){o.dmg+=5;o.hs=75;o.vx=o.vy=0;o.la=w;o.lt=240;V.push({k:'thunS',x:o.x,y:o.y-o.s.h/2,f:0,sc:2})}
  else{const m=p.k=='mis',d=p.k=='dag';o.dmg+=d?5:m?9:12;const kb=(d?4:m?6:8)+o.dmg*.12;hit(o,(p.vx>=0?1:-1)*kb,-kb*.4-3,w);if(d)imp(o.x,o.y-o.s.h/2,p.vx,p.vy,.8);else V.push({k:'fireH',x:o.x,y:o.y-o.s.h/2,f:0,sc:1.6})}
  return}}
function sstep(s){if(s.t>0){if(--s.t==0){s.f=0;shake=s.big?22:12;for(const o of F)if(!o.dead&&o.st>0&&o.inv<=0&&!(o.gh>0)&&o!=s.own&&Math.abs(o.x-s.x)<(s.big?95:48)&&Math.abs(o.y-s.y)<300){o.dmg+=(s.big?26:16);const kb=9+o.dmg*.13;hit(o,(o.x>s.x?1:-1)*kb*.6,-kb-3,s.own)}V.push({k:'thunS',x:s.x,y:s.y-20,f:0,sc:s.big?5:3})}}else s.f++}
function fstep(f){
 if(f.st<=0)return;
 if(f.dead){if(--f.rt<=0){f.dead=0;const spawn=respawn(f);f.x=spawn[0];f.y=spawn[1];f.la=null;f.lt=0;f.pp=null;f.on=1;f.cy=6;f.vx=f.vy=0;f.inv=140;f.dmg=0;f.hs=f.at=f.ba=0;f.dj=1;f.fz=f.gi=f.hz=f.mj=f.sh=f.ra=f.dsh=f.vp=f.gh=f.slm=f.rf=f.jp=f.dd2=0;f.sp=null}return}
 const s=f.s,k=f.fz>0?{}:f.t?ai(f):inp(f.i);if(GM.nm){k.b=GM.skl===0?0:(k.b||k.a);k.a=0}
 f.inv>0&&f.inv--;f.sh>0&&f.sh--;f.cd>0&&f.cd--;f.dd>0&&f.dd--;f.fz>0&&f.fz--;f.gi>0&&f.gi--;f.hz>0&&f.hz--;f.mj>0&&f.mj--;f.sc>0&&f.sc--;f.ba>0&&f.ba--;f.dc>0&&f.dc--;f.lt>0&&f.lt--;f.ra>0&&f.ra--;f.sq>0&&f.sq--;f.vp>0&&f.vp--;f.gh>0&&f.gh--;f.pl>0&&f.pl--;f.sl>0&&f.sl--;f.kt>0&&f.kt--;f.rf>0&&f.rf--;f.dd2>0&&f.dd2--;if(f.jp>0){f.jp--;f.dj=Math.max(f.dj,1);if(T%2==0)pt(f.x,f.y,'#ffb347',.5)}if(GM.spam&&f.sp==null){if(f.sg>0)f.sg--;else{f.sp=CAST[R()*CAST.length|0];RG.push({x:f.x,y:f.y-f.s.h/2,r:4,m:34,c:SP[f.sp].c,l:12})}}
 const spd=s.sp*(f.hz>0?1.45:1)*(f.sl>0?.55:1),jp=s.jp*(f.mj>0?1.2:1),pw=s.pw*(f.gi>0?1.6:1)*(f.ra>0?1.25:1)*(f.dd2>0?1.5:1);
 if(f.fz>0)f.vx*=.9;
 else if(f.hs>0){f.hs--;f.vx*=.94}else{
  const dx=(k.r?1:0)-(k.l?1:0);if(dx&&f.at<=0)f.face=dx;
  f.vx+=(dx*spd*(f.at>0?.5:1)-f.vx)*(f.on?(ice>0?.035:MP.gr):.12)*(f.pl>0?.2:1);
  const ju=k.u||k.j;if(ju&&!f.pj)f.jb=6;else f.jb>0&&f.jb--;
  if(f.jb>0){if(f.on||f.cy>0){f.vy=-jp;f.on=0;f.cy=0;f.jb=0;f.jh=1;dust(f.x,f.y)}else if(f.jb==6&&f.dj>0){f.dj--;f.vy=-jp*.9;f.jb=0;f.jh=1;dust(f.x,f.y);V.push({k:'smoke',x:f.x,y:f.y-8,f:0,sc:.7})}}
  if(f.jh){if(f.vy>=0)f.jh=0;else if(!ju&&!f.t&&f.vy<-4)f.vy*=.6}
  if(k.d){if(f.on)f.dd=12;else if(f.vy>0)f.vy+=.4}
  if(k.s&&!f.ps&&f.dc<=0&&!f.dsh){f.dsh=10;f.dc=45;f.dk=0;f.inv=Math.max(f.inv,12);if(dx)f.face=dx;RG.push({x:f.x,y:f.y-s.h/2,r:6,m:44,c:'#fff',l:12})}
  if(f.dsh>0){f.dsh--;f.vx=f.face*(f.dk?15:12);f.vy=Math.min(f.vy,0)-.2;if(T%2==0)pt(f.x,f.y-s.h/2,f.dk?'#ffb347':'#fff',.4);
   if(f.dk)for(const o of F)if(o!=f&&!o.dead&&o.st>0&&o.inv<=0&&!(o.gh>0)&&!f.h[o.i]&&Math.abs(o.x-f.x)<30+o.s.w/2&&Math.abs(o.y-f.y)<44){f.h[o.i]=1;o.dmg+=9;const kb=7+o.dmg*.12;hit(o,f.face*kb,-kb*.4-2,f)}}
  if(k.a&&(!f.pa||f.cd<=0))f.ba=8;
  if(f.ba>0&&f.at<=0&&f.cd<=0){f.ba=0;f.at=22;f.cd=f.ra>0?14:26;f.h={};f.ad=k.u?-1:k.d&&!f.on?1:0;if(k.m){const ax=k.mx-f.x,ay=k.my-f.y+s.h/2;if(Math.abs(ax)>8)f.face=ax>0?1:-1;if(Math.abs(ax)<110){if(ay<-70)f.ad=-1;else if(ay>70&&!f.on)f.ad=1}}}
  f.mx=k.m?k.mx:null;f.my=k.my;if(k.m&&k.b&&!f.pb){const ax=k.mx-f.x;if(Math.abs(ax)>8)f.face=ax>0?1:-1}
  if(k.b&&!f.pb){if(f.bomb&&f.bomb.pot){}else if(f.bomb){const b=f.bomb;f.bomb=null;b.h=null;b.own=f;b.vx=f.face*7+f.vx*.4;b.vy=-5;b.fl=60}else if(f.sp!=null)cast(f)}}
 f.pj=k.u||k.j;f.ps=k.s;f.pu=k.u;f.pa=k.a;f.pb=k.b;
 if(f.at>0){f.at--;if(f.at<16&&f.at>7){
  const ad=f.ad,ax=ad?f.x:f.x+f.face*24,ay=ad<0?f.y-s.h-6:ad>0?f.y+8:f.y-s.h/2;
  for(const o of F)if(o!=f&&!o.dead&&o.st>0&&o.inv<=0&&!(o.gh>0)&&!f.h[o.i]&&Math.abs(o.x-ax)<(ad?30:34)+o.s.w/2&&Math.abs(o.y-o.s.h/2-ay)<(ad?44:36)){
   f.h[o.i]=1;o.dmg+=Math.round((5+4*pw)*(GM.dm||1))+(ad?1:0);if(f.vp>0){f.dmg=Math.max(0,f.dmg-4);RG.push({x:f.x,y:f.y-20,r:4,m:26,c:'#ff3b6b',l:12})}const kb=(6+o.dmg*.13)*pw;
   hit(o,ad?f.face*kb*.3:f.face*kb,ad<0?-kb*1.05-3:ad>0?kb*.9+2:-kb*.45-3,f);if(f.bomb&&f.bomb.pot&&!o.bomb){const b=f.bomb;f.bomb=null;o.bomb=b;b.h=o;b.t=Math.max(b.t,200);tx(o.x,o.y-80,'POTATO!','#ff5a4a')}}
  for(const o of O)if(!o.op&&!(o.cd>0)&&Math.abs(o.x-ax)<50&&Math.abs(o.y-16-ay)<50){if(o.k=='c')opn(o,f);else press(o,f)}}}
 f.vy=Math.min(f.vy+.55*gv*(f.mj>0?.6:1),14);if(f.slm&&f.vy>-3)f.vy=14;const hw=s.w/2,land=f.vy>3;f.x+=f.vx;
 for(const p of P)if(p.s&&f.y>p.y+6&&f.y-s.h<p.y+p.h&&f.x+hw>p.x&&f.x-hw<p.x+p.w){f.x=f.x<p.x+p.w/2?p.x-hw:p.x+p.w+hw;f.vx=0}
 if(f.on&&f.pp&&f.pp.mv){f.x+=f.pp.dx;f.y+=f.pp.dy}const py=f.y;f.y+=f.vy;f.on=0;
 for(const p of P)if(f.x+hw>p.x&&f.x-hw<p.x+p.w){
  if(f.vy>=0&&py<=p.y+1&&f.y>=p.y&&!(f.dd>0&&!p.s)){f.y=p.y;f.vy=0;f.on=1;f.pp=p}
  else if(p.s&&f.vy<0&&py-s.h>=p.y+p.h-2&&f.y-s.h<p.y+p.h){f.y=p.y+p.h+s.h;f.vy=0}}
 if(f.vy>2&&f.sc<=0&&f.hs<=0)for(const o of F)if(o!=f&&!o.dead&&o.st>0&&o.inv<=0&&!(o.gh>0)&&Math.abs(o.x-f.x)<(s.w+o.s.w)/2-4&&py<=o.y-o.s.h+8&&f.y>=o.y-o.s.h-2&&f.y<=o.y-o.s.h+18){
  f.sc=14;f.vy=GM.stomp?-12:-9.5;f.y=o.y-o.s.h;f.dj=1;o.dmg+=GM.stomp?16:8;hit(o,(o.x>=f.x?1:-1)*(GM.stomp?3+o.dmg*.06:2.5),GM.stomp?6:3.5,f);V.push({k:'smoke',x:o.x,y:o.y-o.s.h,f:0,sc:.8});break}
 if(f.on&&land)for(const o of O)if(o.k=='b'&&o.cd<=0&&Math.abs(f.x-o.x)<24&&Math.abs(f.y-o.y)<8)press(o,f);
 if(f.on&&land){dust(f.x,f.y);f.sq=7;if(f.slm){f.slm=0;slam(f)}}
 if(f.on)for(const j of jpl(MP))if(j.sq<=0&&Math.abs(f.x-j.x)<26&&Math.abs(f.y-j.y)<10){f.vy=-21;f.on=0;f.cy=0;f.dj=1;f.pp=null;j.sq=12;RG.push({x:j.x,y:j.y-6,r:6,m:60,c:'#7dff9b',l:14});for(let i=0;i<8;i++)pt(j.x,j.y-6,'#7dff9b',1.2)}if((f.hs>0||Math.hypot(f.vx,f.vy)>11)&&T%2==0)pt(f.x,f.y-s.h/2,COL[f.i],.3);if(f.hz>0&&Math.abs(f.vx)>2&&T%3==0)pt(f.x,f.y-s.h/2,'#7dff9b',.2);
 if(f.on){f.cy=6;f.dj=1}else f.cy>0&&f.cy--;
 if(f.y>MP.h-60&&!f.sw&&f.vy>2){f.sw=1;for(let i=0;i<14;i++)Q.length<400&&Q.push({x:f.x,y:MP.h-60,vx:(R()-.5)*7,vy:-R()*9-3,l:26,c:'#bfe3ff'});RG.push({x:f.x,y:MP.h-60,r:6,m:70,c:'#bfe3ff',l:18})}else if(f.y<MP.h-90)f.sw=0;
 if(f.x<-150||f.x>MP.w+150||f.y>MP.h+120||f.y<-330){f.dead=1;f.life=(f.life||0)+1;delete inputs[f.id];f.rt=GM.inf?60:90;if(!GM.inf)f.st--;shake=14;const hw2=W/2/cam.z,hh=H/2/cam.z,x=cl(f.x,cam.x-hw2+30,cam.x+hw2-30),y=cl(f.y,cam.y-hh+30,cam.y+hh-30);
  for(let i=0;i<26;i++)pt(x,y,COL[f.i],2);M.push({x,y,l:60,c:COL[f.i]});if(f.la&&f.lt>0&&f.la!=f){const a=f.la;a.ko++;a.ks=(a.kt>0?a.ks:0)+1;a.kt=480;a.dmg=Math.max(0,a.dmg-20);tx(a.x,a.y-a.s.h-30,a.ks>1?'KO x'+a.ks+'!':'KO +1',COL[a.i]);if(a.sp==null&&a.st>0)give(a,1)}RG.push({x,y,r:10,m:140,c:COL[f.i],l:30});flash=.4;if(f.bomb){f.bomb.dead=1;f.bomb=null}}}
function ai(f){const k={},lv=f.lv*dif;let t=null,bd=1e9;
 for(const o of F)if(o!=f&&!o.dead&&o.st>0&&!(o.gh>0)){const d=Math.abs(o.x-f.x)+Math.abs(o.y-f.y)*.7-o.dmg*.8;if(d<bd){bd=d;t=o}}
 if(!t)return k;
 if(!P.some(p=>f.x>p.x-20&&f.x<p.x+p.w+20&&p.y>=f.y-10)||f.y>MP.by){
  let q=null,bq=1e9;for(const p of P){const x=cl(f.x,p.x+16,p.x+p.w-16),d=Math.abs(x-f.x)+Math.abs(p.y-f.y)*.6;if(d<bq){bq=d;q={x,y:p.y}}}
  k[q.x>f.x+6?'r':'l']=1;if(f.vy>1&&f.y>q.y-30&&(f.dj>0||f.cy>0)&&T%10<2)k.u=1;if(f.dc<=0&&Math.abs(q.x-f.x)>120&&f.vy>0)k.s=1;if(f.sp!=null&&SP[f.sp].k=='blink'&&f.vy>0&&f.y>q.y+20)k.b=1;return k}
 const bm=B.find(b=>b.st&&!b.h&&Math.hypot(b.x-f.x,b.y-f.y+20)<120);
 if(bm&&R()<.9){k[bm.x>f.x?'l':'r']=1;if(f.on&&R()<.08)k.u=1;return k}
 const pj=PJ.find(p=>p.own!=f&&Math.abs(p.y-(f.y-18))<44&&Math.abs(p.x-f.x)<170&&p.vx*(f.x-p.x)>0);
 if(pj&&R()<.25*lv){if(f.on||f.dj>0)k.u=1;return k}
 const th=SK.find(q=>q.t>0&&Math.abs(q.x-f.x)<70);if(th){k[th.x>f.x?'l':'r']=1;return k}
 if(GM.pot){const hp=F.find(o=>o.bomb&&o.bomb.pot);if(hp&&hp!=f&&Math.abs(hp.x-f.x)<300){k[hp.x>f.x?'l':'r']=1;if(f.on&&R()<.06)k.u=1;if(f.dc<=0&&Math.abs(hp.x-f.x)<120&&R()<.05)k.s=1;return k}}
 let tx=t.x,ty=t.y;const it=!f.bomb&&B.find(b=>!b.st&&!b.dead),ob=f.sp==null&&O.find(o=>o.k=='c'&&!o.op||o.k=='b'&&o.cd<=0);
 if(it&&bd>140){tx=it.x;ty=it.y}
 if(ob&&bd>180){tx=ob.x;ty=ob.y-16}
 const dx=tx-f.x,dy=ty-f.y,dir=dx>0?1:-1,ad=Math.abs(dx);
 if(ad>34||f.face!=dir)k[dir>0?'r':'l']=1;
 if(f.on&&ad>34&&!P.some(p=>f.x+dir*34>p.x&&f.x+dir*34<p.x+p.w&&p.y>=f.y-6&&p.y<f.y+170)&&dy<60){
  const jx=f.x+dir*200;if(P.some(p=>p.x<jx+60&&p.x+p.w>jx-60&&p.y>f.y-170&&p.y<f.y+90)){if(R()<.5)k.u=1}else k.r=k.l=0}
 if(f.on&&dy<-60&&R()<.08)k.u=1;
 if(!f.on&&f.vy>3&&dy<-40&&f.dj>0&&R()<.1)k.u=1;
 if(f.on&&dy>60&&R()<.05)k.d=1;if(GM.stomp&&f.on&&ad<110&&R()<.05)k.u=1;
 if(ad<58&&Math.abs(dy)<44&&f.face==dir&&R()<(f.bomb&&f.bomb.pot?.5:.12*lv+.03))k.a=1;
 if(ad<34&&dy<-34&&f.on&&R()<.1*lv){k.u=1;k.a=1}
 if(!f.on&&ad<30&&dy>30&&R()<.2*lv){k.d=1;k.a=1}
 if(f.bomb&&(f.bomb.t<50||(ad<320&&f.face==dir&&R()<.05*lv+.01)))k.b=1;
 if(f.sp!=null&&!f.bomb){const q=SP[f.sp].k,fc=f.face==dir,ok=q=='wave'||q=='nova'||q=='slam'?ad<150&&Math.abs(dy)<90:q=='quake'?bd<260:q=='thun'||q=='storm'||q=='chain'||q=='dice'||q=='swap'||q=='comet'?bd<600:q=='fate'?f.dmg>t.dmg+30:q=='blink'?ad>240&&fc:q=='well'||q=='pois'||q=='mine'||q=='fwall'||q=='tor'||q=='bliz'?fc&&bd<340:q=='laser'?fc&&bd<560:fc&&bd<(q=='dash'?300:480);if(ok&&R()<.06*lv+.02)k.b=1}
 return k}
function upd(){T++;if(intro>0){intro--;camUpd();return}tm++;if(tm==7200&&!GM.time)tx(MP.w/2,MP.h/2-240,'SUDDEN DEATH','#ff5a4a');if(tm>7200&&tm%200==0&&!GM.time)strike(null);
 lg>0&&lg--;gv=lg>0?.45:1;
 if(--nb<=0){nb=GM.rain?70:300+R()*240|0;const p=P[R()*P.length|0];if(GM.bombs!==0)B.push({x:p.x+R()*p.w,y:p.y-420,vx:0,vy:0,st:0,t:0,h:null,own:null,fl:0})}
 if(--ct<=0){ct=GM.chaos?200:420+R()*300|0;if(GM.chest!==0&&O.filter(o=>o.k=='c').length<(GM.chaos?6:3)){const q=MP.ch[R()*MP.ch.length|0];if(!O.some(o=>o.k=='c'&&o.x==q[0]&&o.y==q[1])){O.push({k:'c',x:q[0],y:q[1],op:0,f:0});V.push({k:'smoke',x:q[0],y:q[1]-30,f:0,sc:1.2});tx(q[0],q[1]-70,'CHEST!','#ffd24a')}}}
 if(MP.hz&&--sk<=0){sk=140+R()*140|0;strike(null)}
 if(GM.chaos&&tm>240&&tm%420==0)chaos();EV.t>0&&EV.t--;ice>0&&ice--;
 if(GM.rain&&tm%540==270){tx(MP.w/2,MP.h/2-200,'BOMB RAIN!','#ff9f43');for(let i=0;i<8;i++)B.push({x:80+R()*(MP.w-160),y:-40-i*70,vx:0,vy:0,st:1,t:100+R()*80|0,h:null,own:null,fl:0})}
 if(GM.pot){if(!B.some(b=>b.pot)){if(--potT<=0){const a=F.filter(f=>!f.dead&&f.st>0);if(a.length>1){const h=a[R()*a.length|0],b={x:h.x,y:h.y-40,vx:0,vy:0,st:1,t:600,h,own:null,fl:0,pot:1};B.push(b);h.bomb=b;tx(h.x,h.y-80,'HOT POTATO!','#ff5a4a');flash=Math.max(flash,.15)}potT=60}}else potT=60}
 movP(tm);jpl(MP).forEach(j=>j.sq>0&&j.sq--);
 F.forEach(fstep);B.forEach(bstep);B=B.filter(b=>!b.dead);
 PJ.forEach(pstep);PJ=PJ.filter(p=>p.l>0);SK.forEach(sstep);SK=SK.filter(s=>s.t>0||s.f<26);
 O.forEach(o=>{o.op&&o.f++;o.cd>0&&o.cd--});O=O.filter(o=>!(o.op&&o.f>50));
 V.forEach(v=>v.f+=.5);V=V.filter(v=>v.f<A.fx[v.k].n);for(let i=RG.length;i--;){const r=RG[i];r.r+=(r.m-r.r)*.25;if(--r.l<=0)RG.splice(i,1)}for(let i=TO.length;i--;)if(--TO[i].t<=0)TO.splice(i,1);for(let i=IP.length;i--;)if(--IP[i].l<=0)IP.splice(i,1);
 for(const a of AR)a.l--;for(let i=AR.length;i--;)if(AR[i].l<=0)AR.splice(i,1);for(let i=BM.length;i--;)if(--BM[i].l<=0)BM.splice(i,1);for(let i=RW.length;i--;)if(--RW[i].t<=0)RW.splice(i,1);ts>0&&ts--;
 for(let i=ZN.length;i--;){const z=ZN[i];z.l--;if(z.vx)z.x+=z.vx;
  for(const o of F)if(!o.dead&&o.st>0&&o!=z.own&&Math.hypot(o.x-z.x,o.y-o.s.h/2-z.y)<z.r){
   if(z.k=='well'){o.pl=3;if(o.inv<=0&&!(o.gh>0)){o.vx+=(z.x-o.x)*.014;o.vy+=(z.y-o.y+o.s.h/2)*.007;o.vx*=.96}}
   else if(z.k=='fire'){if(z.l%14==0&&o.inv<=0&&!(o.gh>0)){o.dmg+=3;o.vy=Math.min(o.vy,-6);o.la=z.own;o.lt=240;pt(o.x,o.y-o.s.h/2,'#ffb347',.8)}}
   else if(z.k=='bliz'){o.sl=8;if(z.l%40==0&&o.inv<=0&&!(o.gh>0)){o.dmg+=2;o.la=z.own;o.lt=240;if(R()<.35)o.fz=50}}
   else if(z.k=='tor'){o.pl=3;o.vy=Math.min(o.vy,0)-1.1;o.vx+=(R()-.5)*3+Math.sign(z.vx)*.4;if(z.l%18==0&&o.inv<=0&&!(o.gh>0)){o.dmg+=2;o.la=z.own;o.lt=240}}
   else{o.sl=8;if(z.l%22==0&&o.inv<=0&&!(o.gh>0)){o.dmg+=2;o.la=z.own;o.lt=240;pt(o.x,o.y-o.s.h/2,'#8be04a',.8)}}}
  if(z.l<=0){if(z.k=='well'){imp(z.x,z.y,0,-1,2);shake=12;RG.push({x:z.x,y:z.y,r:8,m:z.r,c:'#b06bff',l:20});for(const o of F)if(!o.dead&&o.st>0&&o!=z.own&&o.inv<=0&&!(o.gh>0)&&Math.hypot(o.x-z.x,o.y-o.s.h/2-z.y)<z.r){o.dmg+=8;const kb=9+o.dmg*.1,a=Math.atan2(o.y-o.s.h/2-z.y,o.x-z.x);hit(o,Math.cos(a)*kb,Math.sin(a)*kb-3,z.own)}}ZN.splice(i,1)}}
TX.forEach(t=>t.l--);TX=TX.filter(t=>t.l>0);
 Q.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=.25;p.l--});Q=Q.filter(p=>p.l>0);
 X.forEach(e=>e.f++);X=X.filter(e=>e.f<27);M.forEach(m=>m.l--);M=M.filter(m=>m.l>0);
 camUpd();
 const al=F.filter(f=>f.st>0);if(al.length<2&&!over){over=170;win=al[0]}if(!over&&GM.time&&(tm>=GM.time||F.some(f=>f.ko>=GM.kos))){const r=F.slice().sort((a,b)=>b.ko-a.ko||a.dmg-b.dmg);win=r[0];over=170}
 if(over)end()}
 if(reward)give(F.find(f=>f.id===reward.id),false,reward.skill);
 for(let i=0;i<Math.max(0,Math.min(120,steps))&&!world.ended;i++){upd();flash*=.88;shake*=.88;B=B.filter(b=>!b.dead);if(B.length>64)B=B.filter(b=>b.h).concat(B.filter(b=>!b.h).slice(-(64-B.filter(b=>b.h).length)));PJ=PJ.slice(-96);SK=SK.slice(-32);ZN=ZN.slice(-24);O=O.slice(-24);for(const f of F)if(f.bomb&&!B.includes(f.bomb))f.bomb=null;}
 const owned=items=>items.map(q=>({...q,own:q.own?.id||null}));
 world.fighters=F.map(f=>{const{s,...plain}=f;return{...plain,la:f.la?.id||null,bomb:f.bomb?.id||null,pp:f.pp?P.indexOf(f.pp):null}});
 let next=world.nextBombId||1;for(const b of B)if(!b.id)b.id=next++;world.nextBombId=next;for(const f of world.fighters){const runtime=F.find(o=>o.id===f.id);f.bomb=runtime.bomb?.id||null}
 world.bombs=B.map(b=>({...b,h:b.h?.id||null,own:b.own?.id||null}));world.projectiles=owned(PJ);world.strikes=owned(SK);world.zones=owned(ZN);world.objects=O;world.explosions=X.slice(-24);world.effects=V.slice(-24);world.texts=TX.slice(-12);world.rings=RG.slice(-16);world.impacts=IP.slice(-12);world.arcs=AR.slice(-12);world.beams=BM.slice(-8);world.rewards=[];world.knockouts=M.slice(-8);world.jumpPads=pads;Object.assign(world,{tick:T,elapsed:tm,nb,ct,sk,lg,ice,potT,event:EV,flash:Math.min(.22,flash),shake:Math.min(12,shake)});
 return world;
}
/** Test/debug hook executes one actual skill through the same simulation. */

/** Apply a server-chosen treasure drop; never exposed as a client action. */
export function awardPirateTreasure(world,id,skill,now=0){if(!Number.isInteger(skill)||skill<0||skill>=SP.length)throw RangeError('Invalid pirate treasure');stepPirateWorld(world,{},0,now,{id,skill});return world}
