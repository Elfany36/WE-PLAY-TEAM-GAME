import {generalArt,fleetDrawing} from './tactical-visuals.ts';
import {MODEL_SETS,MODEL_COLLECTIONS,type ModelFamily} from './model-catalog.ts';

type Options={part?:'head'|'hull'|'turret';piece?:string;dark?:boolean;king?:boolean;value?:number};
const edge='#183442',paper='#fff3d2',glass='#a7e9ed';
const r=(x:number,y:number,w:number,h:number,fill:string,rx=4,stroke=edge)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;
const circle=(x:number,y:number,rad:number,fill:string,stroke=edge)=>`<circle cx="${x}" cy="${y}" r="${rad}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;
const path=(d:string,fill='none',stroke=edge,width=3)=>`<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${width}" stroke-linejoin="round" stroke-linecap="round"/>`;
const motifs=[
 '<path d="m0-13 4 8 9 1-7 6 2 9-8-5-8 5 2-9-7-6 9-1Z"/>',
 '<path d="M5-13A14 14 0 1 0 13 7 15 15 0 0 1 5-13Z"/>',
 '<circle r="7"/><path d="M0-15v4M0 11v4M-15 0h4M11 0h4M-11-11l3 3M8 8l3 3M-11 11l3-3M8-8l3-3" fill="none"/>',
 '<path d="m2-15-12 17h10l-2 13L12-4H2Z"/>',
 '<path d="M-10 11Q-15-9 12-13Q15 10-10 11ZM-8 9 6-5"/>',
 '<path d="M-14-5q7-8 14 0t14 0M-14 5q7-8 14 0t14 0" fill="none"/>',
 '<path d="M-10-10h8v8h-8Zm12 0h8v8H2ZM-10 2h8v8h-8Zm12 0h8v8H2Z"/>',
 '<path d="m0-14 12 7V7L0 14-12 7V-7Z"/><path d="M0-8v16M-7-4l14 8M7-4-7 4" fill="none"/>',
 '<path d="M0 0C-25-5-8-25 0-6 8-25 25-5 6 0 25 8 8 25 0 6-8 25-25 8-6 0Z"/>',
 '<circle cx="-7" cy="-7" r="4"/><circle cx="7" cy="-7" r="4"/><circle cx="-7" cy="7" r="4"/><circle cx="7" cy="7" r="4"/>',
 '<path d="m-13-7 7 5 6-11 6 11 7-5-4 17H-9Z"/>',
 '<path d="M0-15 5-5 15 0 5 5 0 15-5 5-15 0-5-5Z"/><circle r="3"/>',
 '<path d="M-12 0c0-15 24-15 24 0S-12 15-12 0Zm4 0c0-8 16-8 16 0S-8 8-8 0Z"/>',
 '<path d="m0-14 12 14L0 14-12 0Zm0 0v28M-12 0h24"/>',
 '<path d="m-15 11 10-23 8 15 5-12 8 20ZM-8-5l3-7 4 8"/>',
];
function emblem(index:number,x=50,y=50,size=1,fill=paper,stroke=edge){return `<g transform="translate(${x} ${y}) scale(${size})" fill="${fill}" stroke="${stroke}" stroke-width="1.5" stroke-linejoin="round">${motifs[index%motifs.length]}</g>`}
function eyes(x=50,y=36){return circle(x-7,y,4,'#fff')+circle(x+7,y,4,'#fff')+circle(x-6,y,1.4,edge)+circle(x+8,y,1.4,edge)}

function kart(id:string,i:number,fill:string){
 let body='';const panel=(x:number,y:number,w:number,h:number,rx=5)=>r(x,y,w,h,fill,rx),window=(x:number,y:number,w:number,h:number)=>r(x,y,w,h,edge,4)+r(x+3,y+3,w-6,3,glass,1,'none');
 if(id==='formula'||id==='classic'){body=panel(39,13,22,69,8)+panel(23,15,54,8,2)+panel(22,77,56,9,2)+panel(27,37,12,29)+panel(61,37,12,29)+window(40,37,20,29)+circle(50,48,8,paper)+r(43,43,14,5,edge,2)+r(47,17,6,17,paper,1)}
 else if(id==='buggy'){body=panel(27,19,46,62,9)+window(33,28,34,35)+path('M33 28 67 63M67 28 33 63',undefined,paper,4)+r(37,68,26,12,edge,6)}
 else if(id==='van'){body=panel(27,12,46,76,8)+r(30,17,40,65,paper,5)+window(33,21,34,17)+panel(34,44,32,32,4)+path('M38 51h24M38 60h24',undefined,paper)}
 else if(id==='hover'){body=`<ellipse cx="50" cy="50" rx="29" ry="39" fill="${edge}"/><ellipse cx="50" cy="47" rx="25" ry="33" fill="${fill}"/>`+window(35,25,30,40)+path('M25 61q25 32 50 0',undefined,'#a8fff0',4)+r(31,71,11,8,glass)+r(58,71,11,8,glass)}
 else if(id==='pickup'){body=panel(27,15,46,70)+window(32,26,36,24)+r(33,53,34,25,edge,2)+path('M38 56v18M45 56v18M52 56v18M59 56v18',undefined,fill,2)}
 else if(id==='prototype'){body=path('M50 11 69 23 76 74 66 86H34L24 74l7-51Z',fill)+window(40,33,20,37)+panel(20,77,60,8,2)+r(47,15,6,16,paper,1)}
 else if(id==='hotrod'){body=panel(36,12,28,36)+panel(27,45,46,38,9)+window(34,48,32,24)+r(40,16,20,28,edge,2)+path('M39 22h22M39 29h22M39 36h22',undefined,paper)+r(24,28,4,39,paper,1)+r(72,28,4,39,paper,1)}
 else if(id==='roadster'){body=panel(28,14,44,72,13)+window(33,36,34,34)+circle(50,53,9,paper)+r(42,48,16,5,edge,2)+r(46,18,8,17,paper,1)}
 else if(id==='solar'){body=panel(25,15,50,71,14)+r(30,21,40,56,edge)+path('M30 33h40M30 45h40M30 57h40M40 21v56M50 21v56M60 21v56',undefined,glass,1.5)+window(42,47,16,22)}
 else {const round=id==='kawaii'?19:id==='mini'?14:8;body=panel(27,14,46,72,round)+window(33,30,34,37)+panel(34,43,32,21,5);if(id==='rally')body+=r(38,17,24,7,paper,2)+path('M37 23v55M63 23v55',undefined,paper,3);if(id==='muscle')body+=r(38,18,7,15,edge,1)+r(55,18,7,15,edge,1)+panel(24,77,52,7,2);if(id==='taxi')body+=r(39,44,22,10,paper,2)+path('M40 48h20',undefined,edge,3);if(id==='kawaii')body+=circle(37,23,4,paper)+circle(63,23,4,paper)+emblem(8,50,54,.5);if(id==='mini')body+=r(46,17,8,14,paper,1)+r(46,70,8,12,paper,1)}
 if(id==='classic')body+=r(27,67,46,10,fill,4)+r(36,70,28,4,paper,1);
 return body+([31,64].map(x=>r(x,17,5,4,paper,1)+r(x,78,5,4,'#ff6481',1)).join(''));
}
function tank(id:string,i:number,fill:string,part?:string){
 const armor=['bulwark','siege','crusader'].includes(id),round=['scout','ranger','amphibious'].includes(id)?14:4;
 const tracks=r(14,18,67,16,edge,5)+r(14,66,67,16,edge,5)+Array.from({length:8},(_,n)=>r(17+n*8,21,4,10,'#73958f',1)+r(17+n*8,69,4,10,'#73958f',1)).join('');
 let hull=tracks+(id==='stealth'?path('M17 42 34 31H67L80 50 67 69H34L17 58Z',fill):r(19,30,57,40,'url(#body)',round));
 hull+=r(23,36,13,28,edge,3)+emblem(i,46,50,.65);
 if(armor)hull+=r(20,29,56,7,paper,2)+r(20,64,56,7,paper,2);
 if(['desert','arctic','ranger'].includes(id))hull+=path('M24 33 43 43 59 31M37 67 59 54 74 65',undefined,i%2?paper:'#395e4b',6);
 if(id==='amphibious')hull+=r(19,20,62,10,fill,5)+r(19,70,62,10,fill,5);
 if(part==='hull')return hull;
 let turret=r(45,45,id==='rail'?46:40,10,'#94b6b4',3)+r(76,42,14,16,edge,2)+r(35,35,31,30,fill,round)+r(39,40,18,20,edge,4)+emblem(i,48,50,.4);
 if(id==='twin')turret+=r(48,34,39,5,paper,1)+r(48,61,39,5,paper,1);
 if(id==='rescue')turret+=path('M47 42v16M40 50h14',undefined,paper,5);
 if(id==='neon')turret+=path('M37 36h26v27',undefined,glass,2);
 return part==='turret'?turret:hull+turret;
}
function snakeHead(id:string,i:number,fill:string){
 let head=`<ellipse cx="50" cy="50" rx="35" ry="29" fill="url(#body)" stroke="${edge}" stroke-width="2"/>`;
 if(id==='cobra')head=path('M62 29Q25 3 16 30v40Q25 97 62 71Z',fill)+head;
 if(['dragon','flame','ice'].includes(id))head+=path('M32 27 13 18 25 40M32 73 13 82 25 60',paper);
 if(id==='robot')head=r(23,26,55,48,fill,10)+r(33,31,39,38,edge,5)+r(61,33,8,34,glass,2);
 else if(id==='pixel')head=r(18,27,62,46,fill,2)+path('M24 32h45v9',undefined,paper,4);
 else if(id==='leaf'||id==='lotus')head+=path('M33 30Q7 7 14 32L32 45',fill)+emblem(id==='leaf'?4:8,38,50,.65);
 else head+=emblem(i,37,50,.55,id==='sea'?glass:paper);
 return head+circle(63,33,8,'#fff')+circle(63,67,8,'#fff')+circle(66,33,4,edge)+circle(66,67,4,edge);
}
function sumo(id:string,i:number,fill:string){
 const fur:Record<string,string>={bear:'#b88359',panda:'#f6f3e8',tiger:'#eca15a',lion:'#d9ad65',fox:'#de8e5a',bull:'#9b7262',tanuki:'#a67c64',penguin:'#274753',kappa:'#8dbd89',dragon:'#77aa8d',oni:'#c37468'};
 const skin=fur[id]||'#f1c39f',robot=id==='robot';
 let body=`<ellipse cx="42" cy="50" rx="30" ry="29" fill="${robot?fill:skin}" stroke="${edge}" stroke-width="2"/>`+r(29,22,11,56,fill,3)+r(32,24,5,52,paper,1,'none')+circle(67,50,16,robot?edge:skin);
 if(['bear','panda','tiger','lion','fox','bull','tanuki','dragon'].includes(id)){
  const pointed=['fox','tiger','dragon'].includes(id);body+=(pointed?path('M59 39 51 23 69 33M59 61 51 77 69 67',skin):circle(56,34,7,edge)+circle(56,66,7,edge));
 }
 if(id==='lion')body+=`<ellipse cx="62" cy="50" rx="19" ry="22" fill="#a37143"/>`+circle(68,50,14,skin);
 if(id==='panda'||id==='tanuki')body+=r(64,36,13,28,edge,6)+r(75,45,8,10,paper,3);
 if(id==='tiger')body+=path('M18 38 31 42M16 54l14-1M20 64l12-5M63 37l5 6M63 63l5-6',undefined,edge,4);
 if(id==='bull'||id==='oni'||id==='dragon')body+=path('M65 34 61 22 75 35M65 66 61 78 75 65',paper);
 if(id==='masked'||id==='samurai')body+=r(61,34,20,32,fill,6)+r(74,39,7,22,edge,2);
 if(id==='samurai')body+=path('M57 33 62 25 71 32 81 24 85 35',paper)+r(18,28,15,44,fill,3);
 if(id==='kappa')body+=`<ellipse cx="65" cy="50" rx="14" ry="10" fill="${paper}" stroke="${edge}" stroke-width="3"/>`;
 if(id==='penguin')body+=`<ellipse cx="44" cy="50" rx="18" ry="23" fill="${paper}"/>`+path('M76 44 86 50 76 56','#edb447');
 if(robot)body+=r(19,29,35,42,fill,7)+r(66,37,12,26,glass,3)+emblem(6,38,50,.55);
 else body+=circle(76,43,1.8,edge)+circle(76,57,1.8,edge)+path('M79 48v4',undefined,edge,2);
 return body;
}
function marble(id:string,i:number,fill:string){
 let body=circle(50,50,33,'url(#orb)');
 if(id==='orbit')body+=`<ellipse cx="50" cy="50" rx="31" ry="12" transform="rotate(-30 50 50)" fill="none" stroke="${paper}" stroke-width="4"/>`;
 else if(id==='cat-eye')body+=path('M30 27Q72 43 51 80Q53 53 30 27Z',paper);
 else if(id==='tide')body+=path('M24 40q13-16 26 0t26 0M22 53q14-16 28 0t28 0M29 66q10-12 21 0t21 0',undefined,paper,4);
 else if(['swirl','lava'].includes(id))body+=path('M26 34Q81 12 65 47T34 72Q14 57 52 53T74 70',undefined,id==='lava'?'#ffb663':paper,6);
 else if(id==='earth')body+=path('M37 23 54 29 53 41 67 45 59 61 47 60 42 78 32 65 37 50 26 44Z','#79a986');
 else if(id==='confetti'||id==='galaxy')body+=Array.from({length:9},(_,n)=>emblem((i+n)%15,31+n%3*19,30+Math.floor(n/3)*19,.22,[paper,glass,'#ffbca4'][n%3])).join('');
 else if(id!=='classic')body+=emblem(i,50,50,1.45);
 return body+`<ellipse cx="38" cy="29" rx="11" ry="5" transform="rotate(-25 38 29)" fill="#ffffffb3"/>`;
}
function paddle(id:string,i:number,fill:string){
 return r(38,4,24,92,edge,9)+r(41,7,18,86,'url(#body)',7)+path('M44 13v74',undefined,'#ffffff99',2)+Array.from({length:3},(_,n)=>emblem(i,50,26+n*24,.36,id==='wood'?'#a47652':paper)).join('')+(id==='neon'?path('M42 15v71M58 15v71',undefined,glass,2):'');
}
function board(family:string,id:string,i:number,fill:string,o:Options){
 const material:Record<string,string>={wood:'#b78050',narra:'#ad6a45',bamboo:'#c5ba79',obsidian:'#4a4561',basalt:'#515e67',jade:'#82bb9c',copper:'#ca916d',royal:'#d9b46e',brass:'#d9b46e',pearl:'#f4e8da',porcelain:'#f4ede4',slate:'#8392a3'};
 const base=material[id]||fill,side=o.dark?'#294a8e':paper,stroke=o.dark?'#101e49':edge;
 if(family==='chess'){
  const shapes:Record<string,string>={p:circle(50,29,14,base)+path('M39 43h22l-4 18 14 15H29l14-15Z',base),r:path('M25 17h12v12h9V17h9v12h9V17h12v23L65 49v25H35V49L25 40Z',base)+path('M36 48h28M35 65h30'),n:path('M30 75V63l13-21-16 7-7-12 18-18 4-12 10 8c20 2 28 17 26 32l-8 28Z',base)+path('M48 18 36 37M56 29h1',undefined,edge,4),b:path('M50 9c-27 25-28 38-10 42l-4 20h28l-4-20c18-4 17-17-10-42Z',base)+path('M55 22 43 39M34 51h32'),q:path('m25 29 14 13 11-22 11 22 14-13-10 33H35Z',base)+circle(24,25,5,paper)+circle(50,16,6,paper)+circle(76,25,5,paper)+r(35,63,30,12,base,1),k:path('M50 8v21M40 17h20',undefined,stroke,6)+path('M32 32h36l-9 18 5 23H36l5-23Z',base)+path('M34 49h32')};
  return (shapes[o.piece||'n']||shapes.n)+emblem(i,50,64,.3,paper)+path('M29 75h42l7 10H22Z',base)+r(23,85,54,6,side,1,stroke)+path('M30 81h40',undefined,paper,2);
 }
 const chip=`<ellipse cx="50" cy="58" rx="34" ry="27" fill="${side}" stroke="${stroke}" stroke-width="3"/><ellipse cx="50" cy="48" rx="34" ry="27" fill="${base}" stroke="${stroke}" stroke-width="3"/><ellipse cx="50" cy="48" rx="27" ry="20" fill="none" stroke="${paper}" stroke-width="2"/>`;
 const art=family==='scidama'?emblem(i,50,36,.45,paper):emblem(i,50,48,1,paper);
 const value=family==='scidama'&&o.value!==undefined?`<rect x="30" y="40" width="40" height="23" rx="5" fill="${paper}"/><text x="50" y="57" font-size="17" font-family="system-ui,sans-serif" font-weight="900" text-anchor="middle" fill="${edge}">${Number.isFinite(o.value)?o.value:0}</text>`:'';
 return chip+art+value+(o.king?emblem(10,50,22,.9,paper):'');
}
function token(family:string,id:string,i:number,fill:string){
 const base=`<ellipse cx="50" cy="86" rx="28" ry="6" fill="#18344222"/>`;
 if(family==='memory'&&id==='moon')return base+path('M49 43Q13 2 12 37q-4 27 30 20-23 31 5 27l4-30m1-11Q87 2 88 37q4 27-30 20 23 31-5 27l-4-30',fill)+path('M50 24v47M48 27l-8-9M52 27l8-9',undefined,edge,4)+emblem(1,70,38,.6,paper);
 if(family==='memory'&&id==='sun')return base+emblem(2,50,46,2.5,fill)+circle(50,46,21,fill)+eyes(50,42)+path('M42 54q8 7 16 0');
 if(family==='memory'&&id==='book')return base+path('M50 25Q29 14 15 24v53q17-10 35 0 18-10 35 0V24Q69 14 50 25Z',paper)+path('M50 25v52M23 34q11-5 20 1M23 44q11-5 20 1M23 54q11-5 20 1')+emblem(4,67,49,.9,fill);
 const animals=['snail','frog','ladybird','butterfly','bee','tortoise','hedgehog','firefly','owl','fox','fawn'];
 if(animals.includes(id)){
  let shape='';
  if(id==='snail')shape=path('M17 73h63l3-35',fill)+circle(47,54,24,'url(#body)')+path('M45 45q18-5 15 11-3 11-14 5-9-6 1-12',undefined,paper)+eyes(76,35);
  else if(id==='butterfly'||id==='bee'||id==='firefly')shape=`<ellipse cx="31" cy="44" rx="19" ry="25" transform="rotate(-28 31 44)" fill="${paper}" stroke="${edge}" stroke-width="2"/><ellipse cx="69" cy="44" rx="19" ry="25" transform="rotate(28 69 44)" fill="${paper}" stroke="${edge}" stroke-width="2"/>`+r(38,30,24,47,fill,12)+path('M39 49h22M40 60h20',undefined,edge,4)+circle(50,28,12,fill)+eyes(50,26);
  else if(id==='ladybird'||id==='tortoise')shape=`<ellipse cx="50" cy="58" rx="29" ry="25" fill="${fill}" stroke="${edge}" stroke-width="2"/>`+emblem(id==='ladybird'?9:7,50,58,1.3)+circle(50,28,14,id==='ladybird'?edge:fill)+eyes(50,25);
  else if(id==='hedgehog')shape=path('M17 71 12 49 25 51 23 30 39 36 47 20 57 37 73 29 74 49 88 56 80 74Z',fill)+r(28,50,48,28,paper,14)+eyes(53,60);
  else {shape=r(25,42,50,38,fill,17)+circle(50,35,25,'url(#body)');if(id==='frog')shape+=circle(33,17,10,fill)+circle(67,17,10,fill);else if(['fox','fawn','owl'].includes(id))shape+=path('M26 31 25 9 42 17M59 17 75 9 74 31',fill);shape+=eyes(50,33)+path('M43 46q7 7 14 0',undefined,edge,2)}
  if(id==='butterfly')shape+=emblem(8,26,42,.55,fill)+emblem(8,74,42,.55,fill);
  if(id==='firefly')shape+=circle(50,68,10,'#fff092')+path('M30 80l-5 6M70 80l5 6',undefined,'#e7ce52',3);
  if(id==='owl')shape+=circle(37,32,11,paper)+circle(63,32,11,paper)+circle(39,32,4,edge)+circle(65,32,4,edge)+path('M45 43 50 51 55 43','#d7a453');
  if(id==='fox')shape+=path('M28 40 46 51 50 46 54 51 72 40Q64 66 50 57 36 66 28 40Z',paper)+circle(50,46,4,edge);
  if(id==='fawn')shape+=path('M30 17 23 6M27 11 17 13M70 17 77 6M73 11l10 2',undefined,edge,4)+circle(50,47,4,edge)+circle(31,64,3,paper)+circle(68,64,3,paper);
  return base+shape;
 }
 if(['sprout','fern','sunflower','daisy','lotus','mushroom','acorn','berry'].includes(id)){
  let shape=r(33,63,34,20,fill,4)+path('M50 69V37M49 57Q18 59 24 40q21-3 26 17M51 51q28-25 30-6-10 17-30 6',fill);
  if(id==='mushroom')shape=r(40,41,20,36,paper)+path('M17 44Q21 2 50 16q29-14 33 28Z',fill)+circle(34,32,5,paper)+circle(59,26,5,paper);
  else if(id==='acorn')shape=path('M29 39h42v19Q50 98 29 58Z',fill)+r(25,31,50,17,paper,8)+path('M49 31q-8-16 10-19');
  else if(id==='lotus')shape+=path('M50 8Q20 29 50 47 80 29 50 8ZM50 45Q10 43 17 20q27 1 33 25Zm0 0Q90 43 83 20 56 21 50 45Z',fill)+circle(50,33,5,paper);
  else if(['sunflower','daisy'].includes(id))shape+=emblem(8,50,30,1.5,fill)+circle(50,30,9,paper);
  else if(id==='berry')shape+=circle(36,39,10,fill)+circle(52,29,10,fill)+circle(64,43,10,fill);
  return base+shape;
 }
 if(family==='property'){
  if(id==='bike')return base+circle(25,66,17,paper)+circle(75,66,17,paper)+path('M25 66 42 40 58 66H25L54 45M58 66 68 32h-9M33 39h17',undefined,fill,5);
  if(id==='tree')return base+r(44,49,12,34,'#ba895b',2)+circle(34,41,19,fill)+circle(59,32,23,fill)+circle(68,52,17,fill)+path('M50 76V40M50 61 34 50',undefined,edge,3);
  if(id==='fountain')return base+path('M17 63h66q-3 20-33 20T17 63Zm16-22h34q-1 13-17 13T33 41Z',fill)+r(46,28,8,43,paper,2)+path('M50 28Q28 5 22 32M50 28Q72 5 78 32M50 20V9',undefined,glass,4);
  if(id==='briefcase')return base+r(17,35,66,44,fill,6)+path('M37 35V24h26v11',undefined,edge,5)+path('M20 52h60',undefined,paper,3)+r(44,47,12,13,paper,2);
  if(['house','bakery','hotel','lighthouse','windmill'].includes(id))return base+r(id==='lighthouse'?38:26,35,id==='lighthouse'?24:48,45,fill,3)+path('M19 37 50 12 81 37Z',paper)+r(44,60,13,20,edge,1)+r(32,44,9,10,glass,1)+r(59,44,9,10,glass,1)+(id==='windmill'?path('M50 27 23 9M50 27 77 9M50 27 25 54M50 27 77 54',undefined,edge,5):id==='hotel'?r(39,15,22,10,fill,1):id==='bakery'?r(20,37,60,14,paper,2)+path('M28 39v10M40 39v10M52 39v10M64 39v10',undefined,fill,6):'');
  if(['tram','train','taxi','bike','airship'].includes(id))return base+r(19,34,62,36,fill,12)+r(30,39,17,14,glass)+r(54,39,17,14,glass)+circle(33,73,9,edge)+circle(67,73,9,edge)+(id==='airship'?`<ellipse cx="50" cy="27" rx="34" ry="17" fill="${paper}" stroke="${edge}" stroke-width="2"/>`:id==='bike'?path('M33 73 47 49 67 73 33 73 53 55',undefined,paper,4):emblem(i,50,62,.42));
  if(id==='sailboat')return base+path('M17 65h66L68 82H33Z',fill)+path('M49 17v45H22Zm5 6v39h26Z',paper);
 }
 if(family==='phone'){
  if(id==='megaphone')return base+path('M20 43h19L77 19v55L39 56H20Z',fill)+path('M36 57 46 82H32L25 57',paper)+path('M85 28l7-6M86 46h10M85 65l7 6',undefined,edge,3);
  if(id==='eraser')return base+path('M18 60 53 19 84 45 49 83H37Z',fill)+path('M18 60 36 39 67 65 49 83H37Z',paper)+path('M48 84h39');
  if(id==='stamp')return base+r(20,63,60,17,fill,3)+r(28,53,44,12,paper)+path('M42 53V38q-17-26 8-26t8 26v15Z',fill)+path('M17 85h66',undefined,edge,3);
  if(id==='spray')return base+r(32,33,36,50,fill,7)+r(38,23,24,13,paper,2)+r(47,14,13,12,edge,2)+path('M68 18l12-6M68 22h19M68 26l12 6',undefined,fill,3)+emblem(6,50,58,.7);
  if(['pencil','brush','marker','crayon','pen','quill','chalk'].includes(id)){
   let tool=r(40,24,20,51,'url(#body)',4)+path('M40 25 50 9 60 25Z',id==='brush'?edge:paper)+r(40,69,20,10,paper,2)+path('M47 31v29',undefined,paper,2);
   if(id==='marker')tool=r(37,32,26,47,fill,5)+r(40,16,20,17,edge,2)+r(43,9,14,10,fill,2)+r(36,33,28,6,paper,1);
   if(id==='crayon')tool=r(38,34,24,43,fill,3)+path('M38 34 50 13 62 34Z',fill)+r(37,45,26,19,paper,1)+path('M40 51h20M40 57h20',undefined,fill,3);
   if(id==='pen')tool+=path('M42 24 50 6 58 24 50 31Z','#c1d5d3')+path('M50 10v15',undefined,edge,1.5);
   if(id==='chalk')tool=r(38,18,24,62,paper,2)+path('M41 23v49M59 25v43',undefined,fill,3);
   return base+`<g transform="rotate(24 50 50)">${tool}</g>`+(id==='quill'?path('M55 38Q49 2 80 12q5 25-25 26Z',fill):'');
  }
  if(id==='palette')return base+path('M28 20C4 30 8 77 39 84q37 9 45-25-2-14-17-10C52 59 64 23 45 18Z',fill)+circle(31,37,6,'#ffcf3d')+circle(28,59,6,'#ff785a')+circle(46,72,6,'#4dbbff')+circle(63,68,5,paper);
  if(id==='camera'||id==='tablet'||id==='notebook')return base+r(18,30,64,46,fill,7)+r(28,36,44,32,paper)+ (id==='camera'?circle(50,53,17,edge)+circle(50,53,11,glass):emblem(i,50,51,1,fill));
 }
 if(family==='blocks'){
  const layouts=[[[0,0],[-1,0],[1,0],[0,-1]],[[0,-1],[0,0],[0,1],[0,2]],[[0,0],[1,0],[0,1],[1,1]],[[0,-1],[0,0],[0,1],[1,1]],[[0,-1],[0,0],[0,1],[-1,1]],[[0,0],[1,0],[-1,1],[0,1]],[[0,0],[-1,0],[0,1],[1,1]]];
  return base+layouts[i%7].map(([x,y])=>r(39+x*17,34+y*17,17,17,'url(#body)',3)).join('')+eyes(48,42)+(i>=7?emblem(i,69,68,.6):'');
 }
 if(family==='uno')return base+`<g transform="rotate(-12 50 50)">`+r(24,13,52,72,fill,9)+`<ellipse cx="50" cy="49" rx="19" ry="28" fill="${paper}" transform="rotate(22 50 49)"/>`+emblem(i,50,49,1,fill)+`</g>`;
 if(id==='boot')return base+path('M28 22h32v35l24 12v13H21V57h7Z',fill)+path('M27 76h51M39 40h16M39 48h16',undefined,paper);
 if(id==='watering-can')return base+r(24,40,44,37,fill,6)+path('M68 44 88 28 91 35 67 62',fill)+path('M24 45Q4 42 13 61h11',undefined,edge,5);
 if(id==='compass')return base+circle(50,50,32,'url(#body)')+circle(50,50,25,paper)+emblem(11,50,50,1.4,fill);
 if(id==='key')return base+circle(38,32,18,fill)+circle(38,32,8,paper)+path('M45 47 75 77l7-7-7-7-6 6-6-6 6-6',fill,edge,8);
 return base+r(24,20,52,61,'url(#body)',10)+emblem(i,50,49,1.5)+eyes(50,68);
}
function explorer(id:string,i:number,fill:string){
 const helmet=['miner','spelunker','engineer','crystal','iron','astral'].includes(id),skin='#efc69c';
 return r(28,42,14,32,fill,3)+r(38,42,27,34,fill,3)+r(36,76,12,16,edge,2)+r(56,76,12,16,edge,2)+r(65,46,10,24,skin,3)+r(37,21,31,25,skin,5)+r(36,13,33,14,fill,helmet?8:3)+r(29,25,46,5,paper,1)+r(60,30,4,4,edge,1)+emblem(i,51,60,.65)+(helmet?circle(57,20,5,paper):path('M34 18h37',undefined,paper,3))+(id==='medic'?path('M47 48v15M40 56h15',undefined,paper,4):'');
}
function cue(id:string,i:number,fill:string){
 const woods=['#d4aa71','#242b39','#eee2c4','#985643','#bf8b67','#465660','#579882','#ddd2ce','#ce815b','#619bb5','#b99957','#577d91','#735e59','#658a6a','#847db5'];
 return path('M9 53 89 48v5L9 56Z',paper)+r(5,51,5,6,glass,1)+path('M37 52 91 48v6L37 55Z',woods[i])+path('M40 52 54 49 54 55Z',fill)+r(66,49,24,6,edge,1)+Array.from({length:5},(_,n)=>path(`M${68+n*4} 49v6`,undefined,id==='ebony'?'#a27659':fill,2)).join('')+emblem(i,55,52,.21,paper);
}
const urls=new Map<string,string>();
/** Pure, allowlisted SVGs shared by collection thumbnails, identity badges and world renderers. */
export function modelSvg(family:ModelFamily,model:string,color:string,options:Options={}){
 const ids=MODEL_SETS[family],id=ids.includes(model)?model:ids[0],index=ids.indexOf(id),fill=/^#[a-f\d]{6}$/i.test(color)?color:'#56e98b';
 let art='';
 if(family==='generals')art=generalArt(index,fill,Number.isInteger(options.value)&&options.value!>=0&&options.value!<=14?options.value:13,options.piece==='back');
 else if(family==='fleet')art='<g transform="translate(0 22) scale(.2 .55)">'+fleetDrawing('naval',index,fill,5)+'</g>';
 else if(family==='kart')art=kart(id,index,fill);
 else if(family==='tank')art=tank(id,index,fill,options.part);
 else if(family==='sumo')art=sumo(id,index,fill);
 else if(family==='snake')art=options.part==='head'?snakeHead(id,index,fill):path('M21 78Q78 94 70 55T32 29',undefined,edge,22)+path('M21 78Q78 94 70 55T32 29',undefined,fill,18)+`<g transform="translate(8 -6) scale(.65)">${snakeHead(id,index,fill)}</g>`+emblem(index,65,68,.45);
 else if(family==='marble')art=marble(id,index,fill);
 else if(family==='pong')art=paddle(id,index,fill);
 else if(['chess','dama','scidama','board'].includes(family))art=board(family,id,index,fill,options);
 else if(family==='terra')art=explorer(id,index,fill);
 else if(family==='pool')art=cue(id,index,fill);
 else art=token(family,id,index,fill);
 return `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><defs><linearGradient id="body" x2=".9" y2="1"><stop stop-color="${paper}"/><stop offset=".28" stop-color="${fill}"/><stop offset="1" stop-color="${fill}"/></linearGradient><radialGradient id="orb" cx=".3" cy=".25" r=".8"><stop stop-color="#fff"/><stop offset=".25" stop-color="${fill}"/><stop offset=".8" stop-color="${fill}"/><stop offset="1" stop-color="${edge}"/></radialGradient></defs>${art}</svg>`;
}
export function modelDataUrl(family:ModelFamily,model:string,color:string,options:Options={}){
 const key=[family,model,color,options.part,options.piece,options.dark,options.king,options.value].join(':');let url=urls.get(key);
 if(!url){url='data:image/svg+xml,'+encodeURIComponent(modelSvg(family,model,color,options));if(urls.size>=384)urls.delete(urls.keys().next().value!);urls.set(key,url)}return url;
}
/** Body decoration never changes the server's snake ribbon or collision cell. */
export function snakePattern(model:string){const i=MODEL_COLLECTIONS.snake.models.findIndex(m=>m.id===model);return {dash:i<=0?[]:[[.16,.75],[.12,.3],[.45,.3],[.7,.2],[.2,.2],[.08,.4],[.8,.13]][(i-1)%7],width:.17+(i%3)*.055,light:i>6&&i%2===0}}
