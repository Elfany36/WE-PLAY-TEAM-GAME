/** Canvas scene adapted from the user upload. HUD, inputs and settings live in React. */
import {PIRATE_CHARACTERS as ST,PIRATE_SKILLS as SP,PIRATE_MODES,PIRATE_MAPS} from './pirate-data.ts';
import {pirateModel} from './pirate-models.ts';
import {hydratePirateWorld} from './pirate-runtime.js';
import manifest from '../../public/pirate-brawl/manifest.json' with {type:'json'};
let artPromise;
export function loadPirateArt(){if(artPromise)return artPromise;artPromise=(async()=>{const A=structuredClone(manifest.assets),load=async src=>{const im=new Image;im.decoding='async';im.src=src.replace(/^\//,'');await im.decode();return im};await Promise.all([load(A.tiles).then(im=>A.tiles=im),...A.ch.map(async c=>c.im=await load(c.src)),...['bomb','boom','heart'].map(async k=>A[k].im=await load(A[k].src)),...Object.values(A.fx).map(async v=>v.im=await load(v.src)),...['t','bg','dc'].flatMap(group=>Object.entries(A[group]).map(async([key,path])=>A[group][key]=await load(path)))]);return A})().catch(error=>{artPromise=null;throw error});return artPromise}
export function createPirateRenderer(canvas,A){
 let W=960,H=540;
 const g=canvas.getContext('2d',{alpha:false}),AN=manifest.animationRows,FL=manifest.characterFacing,FLA=manifest.attackFacing,TS=A.tiles,RC=['#c8d7ee','#4aa8ff','#c77dff','#ffd24a'],cl=(n,a,b)=>Math.max(a,Math.min(b,n)),GLC={},AMC={'Seaside Cove':'255,255,255','Castle Keep':'225,225,245','Meadow Run':'255,240,150','Sunken Ruins':'255,225,185'};
 let MP=null,P=[],F=[],B=[],X=[],M=[],Q=[],PJ=[],SK=[],V=[],TX=[],O=[],RG=[],IP=[],AR=[],BM=[],ZN=[],T=0,tm=0,lg=0,gv=1,GM=PIRATE_MODES[0],EV={t:0,s:''},COL=[],mode='play',pz=0,intro=0,over=0,win=null,ts=0,flash=0,shake=0,fps=60,sf=0,lf='',BGP=null,rs=1,MS={t:-99999,x:0,y:0},view={effects:true,shake:false,camera:'follow',focusId:''};
 const cam={x:1000,y:500,z:.65},maps=new Map;
 const R=()=>Math.random(),pt=()=>{},jpl=()=>MP?.jpo||[],FT=(s,c,x,y,t)=>{g.font='700 '+s+'px system-ui';g.textAlign='center';g.lineJoin='round';g.lineWidth=Math.max(2,s/7);g.strokeStyle='#142039';g.strokeText(String(t),x,y);g.fillStyle=c;g.fillText(String(t),x,y)},SN=[],HK=[];
 function tag(f,scale){const k=cl(1.0/Math.max(.4,cam.z),1,2.5),label=f.id===view.ownId?'YOU':String(f.i+1);g.save();g.translate(f.x,f.y-f.s.h*scale-(f.bomb?32:8));g.scale(k,k);g.fillStyle='#142039e8';g.strokeStyle=COL[f.i];g.lineWidth=1.5;rr(-15,-15,30,15,4);g.fill();g.stroke();g.fillStyle='#fff9e8';g.font='800 10px system-ui';g.textAlign='center';g.fillText(label,0,-4);if(f.bomb)FT(12,f.bomb.t<60?'#ff9f81':'#fff9e8',0,-21,Math.ceil(f.bomb.t/60));g.restore()}
 function paintCostume(f,scale){const m=pirateModel(f.model);g.save();g.translate(f.x,f.y);g.scale(scale,scale);g.fillStyle=f.color;g.strokeStyle='#18253a';g.lineWidth=1;g.fillRect(-f.s.w*.3,-f.s.h*.35,f.s.w*.6,4);if(m.id!==['bomb-guy','bald-pirate','cucumber','big-guy','captain','whale'][m.character]){const y=-f.s.h-6;if(m.gear==='goggles'){g.fillStyle='#1b2a3d';g.fillRect(-13,y+7,26,5);g.fillStyle='#a9e8f1';g.fillRect(-10,y+6,7,6);g.fillRect(4,y+6,7,6)}else if(m.gear==='crown'){g.fillStyle='#efc568';g.beginPath();g.moveTo(-13,y+3);g.lineTo(-14,y-7);g.lineTo(-5,y);g.lineTo(0,y-10);g.lineTo(6,y);g.lineTo(14,y-7);g.lineTo(13,y+3);g.fill()}else if(m.gear==='helmet'){g.fillStyle='#a9b9bc';rr(-14,y-3,28,12,6);g.fill();g.fillStyle=f.color;g.fillRect(-2,y-7,4,16)}else if(m.gear==='feather'){g.fillStyle=f.color;g.beginPath();g.ellipse(-9,y-3,5,14,-.6,0,7);g.fill()}else if(m.gear==='hood'||m.gear==='mask'){g.fillStyle=f.color;g.fillRect(-13,y+8,26,7)}else{g.fillStyle=m.gear==='storm'?f.color:'#243147';g.beginPath();g.moveTo(-18,y+4);g.lineTo(-11,y-7);g.lineTo(0,y-1);g.lineTo(12,y-7);g.lineTo(18,y+4);g.closePath();g.fill();g.stroke();g.fillStyle=f.color;g.fillRect(-6,y-2,12,3)}}g.restore()}
const rr=(x,y,w,h,r)=>{g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath()};
function spr(c,ch,an,f,x,y,fl,sc,a=1,b=1){const m=A.ch[ch],n=m.n[an];c.save();c.translate(x,y);c.scale(fl*(an=='attack'?FLA[ch]:FL[ch])*sc*a,sc*b);c.drawImage(oc(ch),(f%n|0)*m.w,AN.indexOf(an)*m.h,m.w,m.h,-m.w/2,-m.h,m.w,m.h);c.restore()}
const ob=(o,f,x,y,sc)=>g.drawImage(o.im,(f%o.n|0)*o.w,0,o.w,o.h,x-o.w*sc/2,y-o.h*sc/2,o.w*sc,o.h*sc);
function bgp(){if(!BGP&&TS.complete&&TS.naturalWidth){const c=document.createElement('canvas');c.width=192;c.height=190;c.getContext('2d').drawImage(TS,192,0,192,190,0,0,192,190);BGP=g.createPattern(c,'repeat')}return BGP}
const rgb=c=>{const n=parseInt(c.slice(1),16);return(n>>16)+','+(n>>8&255)+','+(n&255)};
function glow(c){if(GLC[c])return GLC[c];const e=document.createElement('canvas');e.width=e.height=128;const q=e.getContext('2d'),r=q.createRadialGradient(64,64,0,64,64,64);r.addColorStop(0,'rgba('+rgb(c)+',.9)');r.addColorStop(1,'rgba('+rgb(c)+',0)');q.fillStyle=r;q.fillRect(0,0,128,128);return GLC[c]=e}
const gl=(c,x,y,r,a)=>{if(!view.effects)return;g.globalCompositeOperation='lighter';g.globalAlpha=Math.max(0,Math.min(1,a));g.drawImage(glow(c),x-r,y-r,r*2,r*2);g.globalAlpha=1;g.globalCompositeOperation='source-over'};
function oc(ch){const m=A.ch[ch];if(m.oc)return m.oc;if(!m.im.complete||!m.im.naturalWidth)return m.im;
 const w=m.im.naturalWidth,h=m.im.naturalHeight,c=document.createElement('canvas');c.width=w;c.height=h;const q=c.getContext('2d');q.imageSmoothingEnabled=false;
 const t=document.createElement('canvas');t.width=w;t.height=h;const u=t.getContext('2d');
 for(const[dx,dy]of[[-2,0],[2,0],[0,-2],[0,2],[-1,-1],[1,1],[-1,1],[1,-1]])u.drawImage(m.im,dx,dy);
 u.globalCompositeOperation='source-in';u.fillStyle='#14111f';u.fillRect(0,0,w,h);q.drawImage(t,0,0);q.drawImage(m.im,0,0);return m.oc=c}
function amb(){const c=AMC[MP.n];if(!c)return;for(let i=0;i<34;i++){const sp=.25+i%5*.12,x=(i*173+T*sp+Math.sin(T/60+i)*14)%W,y=(i*91+T*(.12+i%3*.07))%H;g.fillStyle='rgba('+c+','+(.25+.35*Math.abs(Math.sin(T/30+i)))+')';g.fillRect(x|0,y|0,2+i%2,2+i%2)}}
function slash(f,sc){const p=Math.max(0,Math.min(1,(16-f.at)/10)),dir=f.face,ad=f.ad,B=ad<0?-1.5708:ad>0?1.5708:dir>0?0:3.1416,th=q=>ad<0?B+dir*(1.1-2.2*q):ad>0?B+dir*(-1.1+2.2*q):B+dir*(-1+2*q),
 cx=f.x+(ad?0:dir*6),cy=f.y-f.s.h*.5*sc,R=((ad?30:36)+8*p)*sc,a1=th(p),C=COL[f.i],fd=f.at<8?f.at/8:1;
 g.save();g.lineCap='round';
 for(let k=0;k<3;k++){const a0=th(Math.max(0,p-.6+k*.2));g.globalAlpha=(.28+.27*k)*fd;g.strokeStyle=k==2?'#fff':C;g.lineWidth=(15-k*4)*sc;g.beginPath();g.arc(cx,cy,R,a0,a1,a1<a0);g.stroke()}
 g.restore();gl(C,cx+Math.cos(a1)*R,cy+Math.sin(a1)*R,28*sc,.8*fd)}
function bgl(){for(const L of MP.bg){const o=A.bg[L.k];if(!o.complete||!o.naturalWidth)continue;const sc=H/o.naturalHeight*(L.z||1),dw=o.naturalWidth*sc,dh=o.naturalHeight*sc,y=-(dh-H)*(L.ay??.5)-(cam.y-MP.h/2)*(L.py||0);let x=-(cam.x*L.px)%dw;if(x>0)x-=dw;for(;x<W;x+=dw)g.drawImage(o,x,y,dw,dh)}g.fillStyle='rgba(12,10,28,'+(MP.dm??.36)+')';g.fillRect(0,0,W,H);if(MP.g0){const gr=g.createLinearGradient(0,0,0,H);gr.addColorStop(0,MP.g0);gr.addColorStop(1,MP.g1);g.fillStyle=gr;g.fillRect(0,0,W,H)}}
function tiles(q,t,sh,p,ox,oy){const s=t.s,n=Math.max(2,Math.round(p.w/s)),dr=(tr,i,x,y)=>{const e=tr[i==0?0:i==n-1?2:1];q.drawImage(sh,e[0]*s,e[1]*s,s,s,x,y,s,s)};
 if(p.s){const r=Math.max(2,Math.round(p.h/s));for(let j=0;j<r;j++)for(let i=0;i<n;i++)dr(j==0?t.top:j==r-1&&t.bot?t.bot:t.body,i,ox+i*s,oy+j*s)}else t.thin.forEach((tr,j)=>{for(let i=0;i<n;i++)dr(tr,i,ox+i*s,oy+j*s)})}
function outl(c,b,oy){const o=document.createElement('canvas');o.width=c.width;o.height=c.height;const u=o.getContext('2d');u.imageSmoothingEnabled=false;u.shadowColor='rgba(0,0,0,.5)';u.shadowBlur=b;u.shadowOffsetY=oy;for(const[dx,dy]of[[-2,0],[2,0],[0,-2],[0,2]])u.drawImage(c,dx,dy);u.shadowColor='transparent';u.shadowBlur=0;u.shadowOffsetY=0;u.globalCompositeOperation='source-in';u.fillStyle='#1a1426';u.fillRect(0,0,o.width,o.height);u.globalCompositeOperation='source-over';u.drawImage(c,0,0);return o}
const hsh=i=>{const v=Math.sin(i*127.1+311.7)*43758.5453;return v-Math.floor(v)};
function plt(m){const t=m.th,sh=A.t[t.k];if([sh,...(m.dec||[]).map(d=>A.dc[d[0]])].some(i=>!i.complete||!i.naturalWidth))return null;
 const c=document.createElement('canvas');c.width=m.w;c.height=m.h;const q=c.getContext('2d');q.imageSmoothingEnabled=false;
 for(const p of m.p)if(!p.mv)tiles(q,t,sh,p,p.x,p.y);
 const o=outl(c,14,9),u=o.getContext('2d');u.imageSmoothingEnabled=false;
 for(const p of m.p){if(p.mv)continue;const n=Math.floor(p.w/20),by=p.y+(p.s?p.h:t.s*t.thin.length);for(let i=0;i<n;i++){const r=hsh(p.x*.13+i*7.7+p.y*.07),x=p.x+8+r*(p.w-16),y=p.y;
  if(t.k=='pf'){if(r>.5){u.fillStyle='#5fb04a';u.fillRect(x,y-4,1,4);u.fillRect(x+2,y-6,1,6);u.fillRect(x+4,y-3,1,3)}else if(r>.25){u.fillStyle='#3d8a3a';u.fillRect(x,y-5,1,5);u.fillStyle=['#ff6b9d','#ffd24a','#ffffff'][(r*40|0)%3];u.fillRect(x-1,y-8,3,3)}}
  else if(t.k=='tm'){if(r>.55){u.fillStyle=['#ffb3c8','#ff7a5a','#fff2d0'][(r*30|0)%3];u.fillRect(x,y-3,4,3)}else if(r>.3){u.fillStyle='#6aa8d8';u.fillRect(x,y-2,5,2)}}
  else if(t.k=='ter'){if(r>.55){u.fillStyle='#6b8e3a';u.fillRect(x,y-3,3,3);u.fillRect(x+2,y-5,2,5)}else if(r>.4){u.fillStyle='#7fd8ff';u.fillRect(x,y-4,2,4);u.fillRect(x+1,y-6,1,2)}}
  else if(r>.35){u.fillStyle='#8a9a3a';const L=5+(r*30|0)%9;u.fillRect(x,by-2,1,L);u.fillRect(x+2,by-2,1,L-3)}}}
 for(const d of m.dec||[]){const e=A.dc[d[0]],z=d[3]||1,w=e.naturalWidth*z,h=e.naturalHeight*z;u.drawImage(e,d[1]-w/2,d[2]-h,w,h)}
 return m.pc=o}
function mvc(p,m){if(p.cv)return p.cv;const t=m.th,sh=A.t[t.k];if(!sh.complete||!sh.naturalWidth)return null;const c=document.createElement('canvas');c.width=p.w+24;c.height=(p.s?p.h:t.s*t.thin.length)+32;const q=c.getContext('2d');q.imageSmoothingEnabled=false;tiles(q,t,sh,p,12,12);return p.cv=outl(c,6,4)}
const FXS={
 gulls(){g.strokeStyle='rgba(255,255,255,.85)';g.lineWidth=2;for(let i=0;i<5;i++){const x=((T*.5*(1+i*.12)+i*230)%(W+80))-40,y=70+i*30+Math.sin(T/40+i)*6,f=Math.sin(T/6+i*2)*4;g.beginPath();g.moveTo(x-8,y-f);g.lineTo(x,y);g.lineTo(x+8,y-f);g.stroke()}},
 birds(){g.strokeStyle='rgba(30,30,44,.7)';g.lineWidth=2;for(let i=0;i<4;i++){const x=((T*.7*(1+i*.1)+i*300)%(W+80))-40,y=60+i*34+Math.sin(T/30+i)*8,f=Math.sin(T/5+i*2)*3;g.beginPath();g.moveTo(x-6,y-f);g.lineTo(x,y+1);g.lineTo(x+6,y-f);g.stroke()}},
 mist(){for(let i=0;i<4;i++)gl('#dfe8ff',((T*.25+i*420)%1500)-250,H*(.62+.07*i),230,.07)},
 rays(){g.save();g.globalCompositeOperation='lighter';for(let i=0;i<3;i++){const x=120+i*340+Math.sin(T/260+i)*40;g.fillStyle='rgba(255,240,190,'+(.05+.02*Math.sin(T/90+i))+')';g.beginPath();g.moveTo(x,0);g.lineTo(x+110,0);g.lineTo(x-170,H);g.lineTo(x-280,H);g.fill()}g.restore()}};
function mfx(){if(view.effects&&MP.fx)for(const k of MP.fx)FXS[k]()}
function plc(m){if(m.pc)return m.pc;if(m.th)return plt(m);if(!TS.complete||!TS.naturalWidth)return null;const c=document.createElement('canvas');c.width=m.w;c.height=m.h;const q=c.getContext('2d');q.imageSmoothingEnabled=false;
 for(const p of m.p){if(p.s){for(let x=0;x<p.w;x+=192){const w=Math.min(192,p.w-x);q.drawImage(TS,0,0,w,11,p.x+x,p.y,w,11);for(let y=11;y<p.h;y+=48){const h=Math.min(48,p.h-y);q.drawImage(TS,0,11,w,h,p.x+x,p.y+y,w,h)}}}
  else for(let x=0;x<p.w;x+=127){const w=Math.min(127,p.w-x);q.drawImage(TS,257,192,w,12,p.x+x,p.y,w,12)}}
 return m.pc=c}
const fxd=(k,f,x,y,sc,bot,fl)=>{const o=A.fx[k];f=(f|0)%o.n;g.save();g.translate(x,y);g.scale(fl||1,1);g.drawImage(o.im,f*o.w,0,o.w,o.h,-o.w*sc/2,-o.h*sc*(bot?1:.5),o.w*sc,o.h*sc);g.restore()};
function draw(){
 const z=cam.z,hw=W/2/z,hh=H/2/z,x0=cam.x-hw,y0=cam.y-hh,x1=cam.x+hw,y1=cam.y+hh;
 g.setTransform(rs,0,0,rs,0,0);g.save();lf='';g.fillStyle='#14111f';g.fillRect(0,0,W,H);if(MP.bg){bgl();mfx();amb()}
 if(view.shake&&view.effects&&shake>.5){g.translate((R()-.5)*shake,(R()-.5)*shake);shake*=.88}
 g.translate(W/2,H/2);g.scale(z,z);g.translate(-cam.x,-cam.y);
 if(MP.bg){if(lg>0){g.fillStyle='rgba(70,40,120,.4)';g.fillRect(x0,y0,hw*2,hh*2)}}else{const bp=bgp();if(bp){g.fillStyle=bp;g.fillRect(x0,y0,hw*2,hh*2)}
 g.fillStyle=lg>0?'rgba(70,40,120,.6)':MP.tint;g.fillRect(x0,y0,hw*2,hh*2)}
 const pc=plc(MP);if(pc)g.drawImage(pc,0,0);for(const p of P)if(p.mv){const c=mvc(p,MP);if(c)g.drawImage(c,p.x-12,p.y-12)}
 for(const j of jpl(MP)){const h=j.sq>0?4:11;g.fillStyle='#4a4660';rr(j.x-20,j.y-4,40,5,2);g.fill();g.strokeStyle='#c8d7ee';g.lineWidth=2;g.beginPath();g.moveTo(j.x-10,j.y-4);for(let k=0;k<4;k++)g.lineTo(j.x+(k%2?10:-10),j.y-4-h*(k+1)/4);g.stroke();g.fillStyle='#7dff9b';rr(j.x-18,j.y-5-h,36,5,2);g.fill();if(j.sq>0)gl('#7dff9b',j.x,j.y-14,40,.5)}
 for(const l of MP.lt||[]){const i=l[0]*.01;g.fillStyle='#5a3b2a';g.fillRect(l[0]-2,l[1]-26,4,26);g.fillStyle='#3a2a22';rr(l[0]-6,l[1]-32,12,8,2);g.fill();fxd('fireH',T/3+i,l[0],l[1]-36,1.3,1);gl(l[2],l[0],l[1]-40,70,.45+.12*Math.sin(T/5+i))}
 for(const o of O){if(o.k=='c'){fxd('chest',Math.min(A.fx.chest.n-1,o.op?o.f/3:0),o.x,o.y,2,1);if(!o.op){gl('#ffd24a',o.x,o.y-24,40,.3+.12*Math.sin(T/10));FT(10,'#ffd24a',o.x,o.y-72+Math.sin(T/10)*4,'?')}}else{if(o.cd<=0){g.fillStyle='rgba(255,90,70,'+(.25+.15*Math.sin(T/6))+')';g.beginPath();g.arc(o.x,o.y-14,26,0,7);g.fill()}fxd('btn',o.cd>0?1:0,o.x,o.y,2,1);if(o.cd<=0)FT(10,'#ff7a6a',o.x,o.y-62+Math.sin(T/10)*4,'!')}}
 for(const f of F)if(!f.dead&&f.st>0){let q=1e9;for(const p of P)if(f.x>p.x&&f.x<p.x+p.w&&p.y>=f.y-4&&p.y<q)q=p.y;if(q<1e9){g.fillStyle='rgba(0,0,0,'+.3*Math.max(0,1-(q-f.y)/220)+')';g.beginPath();g.ellipse(f.x,q+1,f.s.w*.55,4,0,0,7);g.fill();g.strokeStyle=COL[f.i];g.globalAlpha=.55;g.lineWidth=1.5;g.stroke();g.globalAlpha=1}}
 for(const b of B){if(b.st&&b.t<50)gl('#ff5a4a',b.x,b.y,30,.5+.3*Math.sin(T));if(b.mine)gl('#ff9f43',b.x,b.y,26,.35+.2*Math.sin(T/6));if(b.pot)gl('#ff5a4a',b.x,b.y,34,.5+.3*Math.sin(T/4));ob(A.bomb,b.st?1+T/3%10:0,b.x,b.y,1)}
 for(const f of F){if(f.dead||f.st<=0)continue;
  if(f.x<x0||f.x>x1||f.y<y0||f.y>y1){g.fillStyle=COL[f.i];g.beginPath();g.arc(cl(f.x,x0+14,x1-14),cl(f.y-20,y0+14,y1-14),8/z,0,7);g.fill();continue}
  if(f.inv>0&&!f.sh&&!f.gh&&T%6<3)continue;
  const an=f.hs>0?'hit':f.at>0?'attack':!f.on?(f.vy<0?'jump':'fall'):Math.abs(f.vx)>.8?'run':'idle',n=A.ch[f.ch].n[an],sc=f.gi>0?1.4:1;
  if(f.dsh>0){for(let k=1;k<4;k++){g.globalAlpha=.28/k;spr(g,f.ch,an,0,f.x-f.vx*k*1.3,f.y+2,f.face,sc)}g.globalAlpha=1}if(f.gh>0)g.globalAlpha=.4;spr(g,f.ch,an,an=='attack'?(1-f.at/22)*n:an=='run'?T/3:an=='idle'?T/6:T/4,f.x,f.y+2,f.face,sc,f.sq>0?1+.18*f.sq/7:!f.on&&f.vy<-5?.9:!f.on&&f.vy>8?.94:1,f.sq>0?1-.2*f.sq/7:!f.on&&f.vy<-5?1.12:!f.on&&f.vy>8?1.08:1);
  paintCostume(f,sc);g.globalAlpha=1;if(f.fz>0){g.fillStyle='rgba(140,220,255,.55)';g.fillRect(f.x-f.s.w*sc/2,f.y-f.s.h*sc,f.s.w*sc,f.s.h*sc)}
  if(f.sp!=null)gl(RC[SP[f.sp].r],f.x,f.y-f.s.h/2,38,.22+.08*Math.sin(T/8));if(f.rf>0){g.strokeStyle='rgba(127,232,255,.8)';g.lineWidth=3;g.beginPath();g.arc(f.x,f.y-f.s.h/2,30,0,7);g.stroke();gl('#7fe8ff',f.x,f.y-f.s.h/2,40,.2)}if(f.ra>0)gl('#ff4040',f.x,f.y-f.s.h/2,34,.25);if(f.vp>0)gl('#ff3b6b',f.x,f.y-f.s.h/2,34,.22);if(f.gi>0)gl('#ff6bd6',f.x,f.y-f.s.h/2,40,.2);if(f.sh>0){gl('#ffe08a',f.x,f.y-f.s.h/2,46,.35);fxd('holy',T/4,f.x,f.y-f.s.h/2,2.4)}
  if(f.at>5&&f.at<18)slash(f,sc);tag(f,sc)}
 for(const p of PJ){if(p.k=='cyc'){g.save();g.translate(p.x,p.y);g.rotate(T*.5);g.strokeStyle='#8fffd0';g.lineWidth=5;g.lineCap='round';for(let i=0;i<3;i++){g.beginPath();g.arc(0,0,16,i*2.09,i*2.09+1.2);g.stroke()}g.restore();gl('#8fffd0',p.x,p.y,30,.6)}
  else if(p.k=='dag'){g.save();g.translate(p.x,p.y);g.rotate(Math.atan2(p.vy,p.vx));g.fillStyle='#fff';g.fillRect(-10,-1.5,20,3);g.restore();gl('#dfe8ff',p.x,p.y,14,.5)}
  else if(p.k=='hook'||p.k=='stun'){const c=p.k=='hook'?'#c9b38a':'#fff06a';gl(c,p.x,p.y,28,.8);g.fillStyle=c;g.beginPath();g.arc(p.x,p.y,6,0,7);g.fill();if(p.k=='hook'){g.strokeStyle=c;g.lineWidth=2;g.beginPath();g.moveTo(p.x,p.y);g.lineTo(p.own.x,p.own.y-p.own.s.h/2);g.stroke()}}
  else{gl(p.k=='ice'?'#7fd8ff':'#ff7a3d',p.x,p.y,p.k=='mis'?26:34,.9);g.save();g.translate(p.x,p.y);g.rotate(Math.atan2(p.vy||0,p.vx));fxd(p.k=='mis'?'fire':p.k,p.f/2,0,0,p.k=='mis'?1:1.4,0,1);g.restore()}}
 for(const e of X){gl('#ffb347',e.x,e.y,100*(1-e.f/27)+20,.8);ob(A.boom,e.f/3,e.x,e.y,1.7)}
 for(const v of V)fxd(v.k,v.f,v.x,v.y,v.sc);
 for(const s of SK){if(s.t>0){g.strokeStyle='rgba(255,255,170,.8)';g.lineWidth=3;g.beginPath();g.ellipse(s.x,s.y,s.big?60:30,s.big?14:8,0,0,7);g.stroke()}
  else{if(s.f<6){g.fillStyle='rgba(255,255,255,.85)';g.fillRect(s.x-10,s.y-900,20,900)}{if(s.f<10)gl('#fff06a',s.x,s.y,130,1-s.f/10);fxd('thun',s.f/2,s.x,s.y,s.big?5:3,1)}}}
 for(const p of Q){g.globalAlpha=Math.min(1,p.l/14);g.fillStyle=p.c;g.fillRect(p.x|0,p.y|0,3,3)}g.globalAlpha=1;
 for(const r of RG){g.globalAlpha=Math.min(1,r.l/12);g.strokeStyle=r.c;g.lineWidth=4;g.beginPath();g.arc(r.x,r.y,r.r,0,7);g.stroke()}g.globalAlpha=1;
 for(const e of IP){const t=1-e.l/16,r0=6+16*t*e.sz,r1=r0+14*e.sz*(1-t*.5);g.globalAlpha=Math.min(1,e.l/7);g.strokeStyle='#fff';g.lineWidth=3.5*e.sz*(1-t*.6);g.beginPath();for(let k=0;k<8;k++){const a=e.a+k*.785+(k&1?.22:0);g.moveTo(e.x+Math.cos(a)*r0,e.y+Math.sin(a)*r0);g.lineTo(e.x+Math.cos(a)*r1,e.y+Math.sin(a)*r1)}g.stroke();gl('#ffe08a',e.x,e.y,(26+20*t)*e.sz,.9*(1-t))}g.globalAlpha=1;
 for(const z of ZN){const a=Math.min(1,z.l/20,(z.m-z.l)/10+.2);
  if(z.k=='well'){gl('#b06bff',z.x,z.y,z.r,.45*a);g.save();g.translate(z.x,z.y);g.rotate(T*.12);g.strokeStyle='rgba(206,160,255,'+.8*a+')';g.lineWidth=3;for(let i=0;i<4;i++){g.rotate(1.5708);g.beginPath();g.arc(0,0,40+i*3,0,2.2);g.stroke();g.beginPath();g.arc(0,0,70+i*5,.5,2.4);g.stroke();g.beginPath();g.arc(0,0,100+i*6,1,2.5);g.stroke()}g.restore();g.fillStyle='rgba(20,0,40,'+.85*a+')';g.beginPath();g.arc(z.x,z.y,16,0,7);g.fill()}
  else if(z.k=='fire'){gl('#ff7a3d',z.x,z.y,z.r*1.5,.35*a);for(let i=0;i<7;i++)fxd('fireH',T/3+i*2,z.x-z.r+i*z.r/3,z.y+16,2.3*a+.3,1)}
  else if(z.k=='bliz'){gl('#bfefff',z.x,z.y,z.r*1.2,.22*a);g.fillStyle='rgba(235,248,255,'+.8*a+')';for(let i=0;i<28;i++){const sx=z.x+Math.sin(i*7.3+T*.02*(1+i%3))*z.r,sy=z.y-z.r+((T*(2+i%3)+i*37)%(z.r*2));g.fillRect(sx|0,sy|0,3,3)}}
  else if(z.k=='tor'){gl('#dfe8ff',z.x,z.y,z.r*1.5,.25*a);g.strokeStyle='rgba(225,238,255,'+.7*a+')';g.lineWidth=3;for(let i=0;i<7;i++){g.beginPath();g.ellipse(z.x+Math.sin(T/5+i)*6,z.y+70-i*24,18+i*9,7,0,0,7);g.stroke()}}
  else{for(let i=0;i<6;i++){const an=i*1.05+T*.01,r2=z.r*.55*(.6+.4*Math.sin(T/20+i));g.fillStyle='rgba(120,210,60,'+.16*a+')';g.beginPath();g.arc(z.x+Math.cos(an)*z.r*.5,z.y+Math.sin(an)*z.r*.3,r2,0,7);g.fill()}gl('#8be04a',z.x,z.y,z.r*1.1,.25*a);if(T%5==0)pt(z.x+(R()-.5)*z.r*1.4,z.y+z.r*.3,'#b6f06a',.3)}}
 for(const a of AR){g.globalAlpha=Math.min(1,a.l/6);g.lineJoin='round';g.lineCap='round';const c=a.c||'#ffe94a';for(const[w,cc]of[[a.st?14:8,'rgba('+rgb(c)+',.35)'],[a.st?5:3,'#fff']]){g.strokeStyle=cc;g.lineWidth=w;g.beginPath();for(let i=0;i<a.pts.length-1;i++){const p=a.pts[i],q=a.pts[i+1];g.moveTo(p.x,p.y);if(a.st)g.lineTo(q.x,q.y);else{for(let k=1;k<6;k++){const t=k/6;g.lineTo(p.x+(q.x-p.x)*t+(R()-.5)*14,p.y+(q.y-p.y)*t+(R()-.5)*14)}g.lineTo(q.x,q.y)}}g.stroke()}}g.globalAlpha=1;
 for(const e of BM){const a=e.l/40,gr=g.createLinearGradient(0,e.y-420,0,e.y),w=10+16*(1-a);gr.addColorStop(0,'rgba('+rgb(e.c)+',0)');gr.addColorStop(1,'rgba('+rgb(e.c)+','+.75*a+')');g.fillStyle=gr;g.fillRect(e.x-w/2,e.y-420,w,420)}
 if(mode=='play'&&!pz&&T-MS.t<300&&F.some(f=>f.i==0&&!f.t&&f.st>0)){const mx=cam.x+(MS.x-W/2)/z,my=cam.y+(MS.y-H/2)/z;g.strokeStyle='#fff';g.lineWidth=2/z;g.beginPath();g.arc(mx,my,10/z,0,7);g.moveTo(mx-16/z,my);g.lineTo(mx+16/z,my);g.moveTo(mx,my-16/z);g.lineTo(mx,my+16/z);g.stroke()}
 const wy=MP.h-60,x2=Math.floor(x0/24)*24-24,wg=g.createLinearGradient(0,wy-10,0,wy+170);wg.addColorStop(0,MP.wc||'rgba(36,64,107,.82)');wg.addColorStop(1,'rgba(8,10,24,.95)');
 for(const[ph,al,amp]of[[0,1,6],[1.7,.55,4]]){g.globalAlpha=al;g.fillStyle=wg;g.beginPath();g.moveTo(x0-40,y1+40);for(let x=x2;x<=x1+24;x+=24)g.lineTo(x,wy+Math.sin((x+T*(2+ph))/38+ph)*amp+ph*4);g.lineTo(x1+40,y1+40);g.fill()}g.globalAlpha=1;
 g.fillStyle=MP.wf||'rgba(180,220,255,.5)';for(let x=x2;x<x1;x+=24)g.fillRect(x,wy+Math.sin((x+T*2)/38)*6,14,2);
 for(const m of M)FT(16,m.c,m.x,m.y-(60-m.l)*.6,'KO!');
 for(const t of TX)FT(9,t.c,t.x,t.y-(80-t.l)*.5,t.s);
 g.restore();lf='';
 if(ts>0){g.fillStyle='rgba(120,170,255,'+Math.min(.2,ts/180)+')';g.fillRect(0,0,W,H)}
 if(flash>.02){g.fillStyle='rgba(255,255,255,'+flash+')';g.fillRect(0,0,W,H);flash*=.88}
 for(const o of O){if(o.k=='c'&&o.op||o.k=='b'&&o.cd>0)continue;const sx=W/2+(o.x-cam.x)*z,sy=H/2+(o.y-30-cam.y)*z;if(sx>14&&sx<W-14&&sy>44&&sy<H-20)continue;g.fillStyle=o.k=='c'?'#ffd24a':'#ff5a4a';g.save();g.translate(cl(sx,24,W-24),cl(sy,48,H-20));g.rotate(Math.atan2(sy-H/2,sx-W/2));g.beginPath();g.moveTo(10,0);g.lineTo(-6,-7);g.lineTo(-6,7);g.fill();g.restore()}

 if(EV.t>0&&view.effects)FT(18,'#ffd24a',W/2,42,EV.s);
 if(intro>0){g.fillStyle='#11233caa';g.fillRect(0,0,W,H);FT(48,'#fff6db',W/2,H/2+14,String(Math.ceil(intro/60)))}
 if(pz){g.fillStyle='#11233caa';g.fillRect(0,0,W,H);FT(32,'#fff6db',W/2,H/2,'Paused')}
 if(over&&win)FT(24,COL[win.i],W/2,H/2,'Round complete');
}

 function setScene(world){if(!MP||MP.id!==world.map){maps.clear();const base=PIRATE_MAPS.find(m=>m.id===world.map)||PIRATE_MAPS[0];MP={...base,p:base.p.map(p=>({...p,mv:p.mv?{...p.mv}:undefined,bx:p.x,by:p.y})),jpo:world.jumpPads};P=MP.p;cam.x=MP.w/2;cam.y=MP.h/2;cam.z=.6}MP.jpo=world.jumpPads;for(const p of P)if(p.mv){const a=world.elapsed*p.mv.sp+p.mv.ph;p.x=p.bx+Math.sin(a)*(p.mv.ax||0);p.y=p.by+Math.cos(a)*(p.mv.ay||0)}}
 return{
 resize(width,pixelRatio=1,height){H=Number.isFinite(height)&&height>0?Math.round(W*height/Math.max(1,width)):540;rs=Math.min(2,pixelRatio)*Math.max(260,Math.min(1440,width))/W;const widthPx=Math.round(W*rs),heightPx=Math.round(H*rs);if(canvas.width!==widthPx||canvas.height!==heightPx){canvas.width=widthPx;canvas.height=heightPx}g.imageSmoothingEnabled=false},
 point(clientX,clientY){const r=canvas.getBoundingClientRect();return{x:cam.x+((clientX-r.left)/r.width*W-W/2)/cam.z,y:cam.y+((clientY-r.top)/r.height*H-H/2)/cam.z}},
 render(world,options,dt=16){view={...view,...options};setScene(world);const hydrated=hydratePirateWorld(world);F=hydrated.F;M=world.knockouts||[];B=hydrated.B;PJ=hydrated.PJ;SK=hydrated.SK;ZN=hydrated.ZN;O=world.objects;X=world.explosions;V=world.effects;TX=world.texts;RG=world.rings;IP=world.impacts;AR=world.arcs;BM=world.beams||[];T=world.tick;tm=world.elapsed;lg=world.lg;EV=world.event;COL=F.map(f=>f.color);GM=PIRATE_MODES.find(m=>m.id===world.variant)||PIRATE_MODES[0];intro=options.countdown||0;pz=options.paused?1:0;over=options.finished?1:0;win=F.find(f=>world.winnerIds.includes(f.id));flash=view.effects?Math.min(.12,world.flash):0;shake=view.shake?world.shake:0;
 const alive=F.filter(f=>f.st>0&&!f.dead),focus=alive.find(f=>f.id===view.focusId),actors=view.camera==='arena'?alive:view.camera==='follow'&&focus?[focus,...alive.filter(f=>f!==focus&&Math.abs(f.x-focus.x)<380&&Math.abs(f.y-focus.y)<240).slice(0,1)]:alive;
 const a=actors.length?actors:[{x:MP.w/2,y:MP.h/2}],minX=Math.min(...a.map(f=>f.x)),maxX=Math.max(...a.map(f=>f.x)),minY=Math.min(...a.map(f=>f.y-60)),maxY=Math.max(...a.map(f=>f.y));
 const z=view.camera==='arena'?Math.min(W/(MP.w+160),H/(MP.h+120)):cl(Math.min(W/(maxX-minX+530),H/(maxY-minY+420)),Math.min(W/(MP.w+200),H/(MP.h+200)),H>W?1.8:1.1),mix=1-Math.exp(-Math.max(1,dt)/100);cam.z+=(z-cam.z)*mix;cam.x+=((minX+maxX)/2-cam.x)*mix;cam.y+=((minY+maxY)/2+35-cam.y)*mix;
 draw();},
 dispose(){maps.clear();MP=null;BGP=null;for(const character of A.ch)delete character.oc;for(const key of Object.keys(GLC))delete GLC[key]}
 };
}
