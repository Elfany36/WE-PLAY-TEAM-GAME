import type {FleetStyle} from './fleet.ts';

// Each finish has a material trim; the player's chosen color remains the main body.
const trims=['#efd9a3','#dcb570','#b9d8ed','#9aebc9','#b9b6e5','#fff2df','#e1b081','#def5ff','#cbb8ff','#f5b38d','#f6edda','#9ef5ef','#a1b9ee','#ffd89b','#f4cb70'];
const ink='#142b40';
const path=(d:string,fill:string,stroke=ink,width=2)=>`<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${width}" stroke-linejoin="round"/>`;
const rect=(x:number,y:number,w:number,h:number,fill:string,rx=3,stroke=ink)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;
const circle=(x:number,y:number,r:number,fill:string,stroke=ink)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;
const caps=[
 'M19 29 28 18H40L50 9 60 18H72L81 29V78H19Z',
 'M19 24 30 13H70L81 24V78H19Z',
 'M20 28Q50 2 80 28V78H20Z',
 'M18 33 27 18 50 10 73 18 82 33V78H18Z',
 'M21 18 50 8 79 18 84 68 73 80H27L16 68Z',
 'M20 30Q20 12 36 18Q50 2 64 18Q80 12 80 30V78H20Z',
 'M19 24 27 14H73L81 24V78H19Z',
 'M18 25 30 12H70L82 25V69L72 80H28L18 69Z',
 'M16 37 32 12H68L84 37 73 80H27Z',
 'M19 27 35 10H65L81 27V78H19Z',
 'M20 31Q20 12 50 12Q80 12 80 31V78H20Z',
 'M18 31 33 11 50 18 67 11 82 31V78H18Z',
 'M22 21 50 10 78 21V78H22Z',
 'M18 32 27 20 40 20 50 8 60 20 73 20 82 32V78H18Z',
 'M18 27 27 13 39 21 50 7 61 21 73 13 82 27V78H18Z',
];
/** The back is independent of rank, including silhouette, ornaments and base. */
export function generalArt(index:number,color:string,rank=13,back=false){
 const rim=trims[index%15],cap=caps[index%15];
 const marks=back?'<path d="M50 35 64 42V56Q60 64 50 69 40 64 36 56V42Z" fill="none" stroke="'+rim+'" stroke-width="3"/><path d="M50 44v15m-6-8h12" stroke="'+rim+'" stroke-width="2"/>':rank===0?'<path d="M39 64V33h28L59 44l8 10H39" fill="'+rim+'" stroke="#162738" stroke-width="2"/>':rank===14?'<path d="M29 48q21-18 42 0-21 18-42 0" fill="'+rim+'" stroke="#162738" stroke-width="2"/><circle cx="50" cy="48" r="7" fill="#162738"/><path d="M30 33h40" stroke="'+rim+'" stroke-width="4"/>':rank>=9?Array.from({length:rank-8},(_,i)=>{const x=50+((i%3)-Math.min(2,rank-9)/2)*15,y=rank>11&&i>2?57:43;return'<path d="m'+x+' '+(y-6)+' 2 4 5 1-4 3 1 5-4-2-4 2 1-5-4-3 5-1Z" fill="'+rim+'"/>'}).join(''):rank===1||rank===2?Array.from({length:rank===1?1:3},(_,i)=>'<path d="m34 '+(39+i*9)+' 16 9 16-9" fill="none" stroke="'+rim+'" stroke-width="4"/>').join(''):'<text x="50" y="55" text-anchor="middle" font-family="system-ui,sans-serif" font-size="19" font-weight="900" fill="'+rim+'">'+(['','','','2LT','1LT','CPT','MAJ','LTC','COL'][rank]||'')+'</text>';
 const sides=index%3===0?path('M23 37v30m54-30v30','none',rim,3):index%3===1?path('m22 36 5 6-5 6 5 6-5 6m56-24-5 6 5 6-5 6 5 6','none',rim,2):path('M23 35v30l5 7m49-37v30l-5 7','none',rim,2);
 const crest=index%5===0?path('m45 23 5-7 5 7-5 4Z',rim):index%5===1?circle(50,23,4,rim):index%5===2?path('M39 25 50 19 61 25','none',rim,3):index%5===3?path('M39 23h22m-16-4v8m10-8v8','none',rim,2):path('m42 24 8-7 8 7','none',rim,3);
 return '<ellipse cx="50" cy="90" rx="37" ry="7" fill="#08182744"/>'+path('M15 78h70l7 11-7 5H15l-7-5Z',ink,rim)+rect(20,78,60,9,color,3,rim)+path(cap,'url(#body)',ink,3)+path('M24 30 29 24V71l-5 5Z','#ffffff45','none')+rect(29,30,42,42,ink,6,rim)+sides+crest+marks+path('M32 80h36','none',rim,3);
}

/** Five distinct classes in each theme; artwork remains inside the logical footprint. */
function drawFleet(style:FleetStyle,index:number,color:string,length:number,variant:number){
 const w=length*100,c=w/2,trim=trims[index%15],hull=ink,bow=18+index%5*4;
 const seams=Array.from({length:length-1},(_,i)=>path(`M${(i+1)*100} 29v42`,'none',trim,1)).join('');
 const badge=path(`M${c-12} 48h24m-18-5v10m12-10v10`,'none',trim,2);
 let body='';
 if(style==='naval'){
  if(variant===3){ // Submarine: rounded pressure hull, sail and stern fins.
   body=`<ellipse cx="${c}" cy="50" rx="${c-13}" ry="27" fill="${hull}" stroke="${trim}" stroke-width="2"/>`+rect(30,32,w-65,36,color,18,trim)+path('M28 22v56M18 50h23','none',trim,5)+rect(c-23,33,46,27,hull,9,trim)+path(`M${c+5} 33V19h17`,'none',trim,4)+circle(w-36,50,6,trim);
  }else{
   const wide=variant===0?35:variant===4?22:29;
   const architecture=index%5;
   const outline=architecture===2?`M12 50 49 12H${w-82}L${w-9} 50 ${w-82} 88H49Z`:architecture===3?`M12 50Q20 15 52 15H${w-75}Q${w-38} 17 ${w-10} 50Q${w-38} 83 ${w-75} 85H52Q20 85 12 50Z`:`M12 50 ${bow+14} ${50-wide}H${w-58}L${w-10} 50 ${w-58} ${50+wide}H${bow+14}Z`;
   body=path(outline,hull,trim,2)+path(`M24 50 ${bow+20} ${55-wide}H${w-64}L${w-26} 50 ${w-64} ${45+wide}H${bow+20}Z`,color,trim,2)+seams;
   if(architecture===1||architecture===4){
    body=path(`M${w*.3} 14v72M${w*.7} 14v72`,'none',trim,5)+rect(27,7,w-64,12,color,architecture===1?6:1,trim)+rect(27,81,w-64,12,color,architecture===1?6:1,trim)+body;
   }
   if(variant===0){
    body+=rect(47,28,w-118,44,hull,3,trim)+path(`M55 35H${w-82}M55 65H${w-82}`,'none',trim,2)+`<path d="M56 50H${w-85}" stroke="${trim}" stroke-width="2" stroke-dasharray="12 8"/>`+rect(c-20,19,58,15,color,3,trim);
    for(let j=0;j<(index%3===1?2:3);j++)body+=path(`M${75+j*65} 38l10-7 10 7-8-1v6h-4v-6Z`,trim,'none');
    if(index%3===1)body+=circle(w-108,50,14,'none',trim)+path(`M${w-114} 43v14m12-14v14m-12-7h12`,'none',trim,2);
    if(index%3===2)body+=rect(c-65,68,38,12,color,2,trim)+rect(c+30,20,38,12,color,2,trim);
   }else{
    body+=rect(c-25,33,48,34,hull,6,trim)+rect(c-12,38,27,24,color,4,trim)+path(`M${c} 33V21m-10 5h20`,'none',trim,3);
    for(const x of (variant===1?[65,w-76]:variant===2?[w-73]:[w-58]))body+=circle(x,50,variant===4?9:13,color,trim)+path(`M${x} 46h26m-26 8h26`,'none',trim,3);
    if(variant===2)body+=rect(42,35,40,30,hull,2,trim)+path('M49 42h26m-26 8h26m-26 8h26','none',trim,2);
   }
  }
 }else if(style==='air'){
  const wing=variant===0?43:variant===1?38:variant===2?32:variant===3?40:28,root=c+(index%3-1)*12;
  body=path(`M12 50 ${c-35} 39 ${root-60} ${50-wing} ${root-15} ${50-wing} ${root+42} 38 ${w-30} 41 ${w-9} 50 ${w-30} 59 ${root+42} 62 ${root-15} ${50+wing} ${root-60} ${50+wing} ${c-35} 61Z`,color,trim,3)+path(`M30 50H${w-30}`,'none',hull,5)+rect(w-67,42,25,16,trim,7)+path('M29 31v38m-13-10 24-18','none',trim,3);
  if(variant===0||variant===1)for(const x of [c-30,c+14])for(const y of [22,66])body+=rect(x,y,14,12,hull,5,trim);
  if(variant===2)body+=path(`M${c-27} 20 ${c+32} 50 ${c-27} 80`,'none',trim,3);
  if(variant===4)for(const x of [c-24,c+24])for(const y of [21,79])body+=circle(x,y,12,'none',trim)+path(`M${x-7} ${y}h14`,'none',trim,2);
 }else if(style==='road'){
  body=rect(14,21,w-28,58,hull,12,trim);
  for(let j=0;j<length;j++)for(const y of [14,77])body+=rect(28+j*(w-65)/length,y,22,10,hull,3,trim);
  if(variant===1){for(let j=0;j<3;j++)body+=rect(24+j*(w-50)/3,29,(w-65)/3,42,color,6,trim)+rect(32+j*(w-50)/3,37,22,26,trim,3);}
  else{body+=rect(23,28,w-94,44,color,6,trim)+rect(w-68,27,41,46,color,7,trim)+rect(w-57,33,20,34,'#a7e9ed',4);if(variant===0)body+=circle(c-20,50,17,hull,trim)+path(`M${c-20} 50h35`,'none',trim,5);else if(variant===3)body+=path(`M${c-30} 37v26m-13-13h26`,'none','#fff2dc',7);else body+=path(`M35 36H${w-83}M35 64H${w-83}`,'none',trim,3);}
 }else{
  body=path(`M12 50Q24 14 ${c-36} 25Q${c+25} 5 ${w-25} 30Q${w+1} 50 ${w-24} 72Q${c+20} 96 ${c-29} 77Q17 89 12 50Z`,'#efd1a0','#80d7df',4)+path(`M29 51Q${c-15} 15 ${w-36} 43Q${w-12} 66 ${c+13} 70Q${c-30} 86 29 51Z`,color,'#297661',2);
  if(variant===0)body+=`<ellipse cx="${c}" cy="50" rx="${w*.22}" ry="16" fill="#398ea8" stroke="${trim}" stroke-width="3"/>`;
  else if(variant===3)body+=path(`M${c-46} 73 ${c-5} 21 ${c+38} 72Z`,'#514953',trim,2)+path(`M${c-17} 37 ${c-5} 21 ${c+9} 39 ${c-3} 34Z`,'#ffb078','none');
  else if(variant===1)for(let j=0;j<4;j++)body+=circle(48+j*(w-96)/3,50+(j%2?10:-10),9,'#efb6ad','#b86b89');
  for(const x of variant===0?[45,w-48]:variant===3?[43,w-44]:[c-24,c+24])body+=path(`M${x} 69q8-15 3-29m0 0-18 4 16-12 19 8-17-1 10 12-13-10`,'#285f46','#163e35',2);
 }
 // Finish details are geometric (no filters or externally loaded textures).
 const finish=index%3===0?path(`M${c-16} 82h32`,'none',trim,3):index%3===1?path(`m${c-14} 83 7-4 7 4 7-4 7 4`,'none',trim,2):circle(c,83,4,trim);
 return body+finish+(style==='naval'&&variant===3?badge:'');
}
const fleetCache=new Map<string,string>();
export function fleetDrawing(style:FleetStyle,index:number,color:string,length=5,variant=0){
 const key=[style,index,color,length,variant].join(':');let art=fleetCache.get(key);
 if(!art){art=drawFleet(style,index,color,length,variant);if(fleetCache.size>=256)fleetCache.delete(fleetCache.keys().next().value!);fleetCache.set(key,art)}return art;
}
