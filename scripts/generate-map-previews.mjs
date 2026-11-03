/** Immutable, lazy image previews: the same geometry as local and online games. */
import {mkdirSync,writeFileSync} from 'node:fs';
import {SNAKE_MAPS,SNAKE_SIZES,snakeMap,snakeStarts} from '../lib/casual/maps.ts';
import {TRACKS,trackPoints} from '../lib/casual/circuit.ts';
import {CLUB_MAPS,tankWalls,clubTrack} from '../lib/casual/party.ts';
import {TABLE_SCENES} from '../lib/casual/scenes.ts';
const root='public/map-previews/v19';mkdirSync(root,{recursive:true});
const rect=(x,y,w,h,fill,r=0,extra='')=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" ${extra}/>`;
const circle=(x,y,r,fill,extra='')=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" ${extra}/>`;
const path=(d,stroke,width,extra='')=>`<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${width}" stroke-linejoin="round" stroke-linecap="round" ${extra}/>`;
function save(name,body,bg){writeFileSync(`${root}/${name}.svg`,`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 216">${rect(0,0,320,216,bg,16)}${body}</svg>\n`)}
for(const map of SNAKE_MAPS)for(const size of SNAKE_SIZES){const m=snakeMap(map.id,size),s=184/size;let body=rect(68,16,184,184,m.ground[1],5,'stroke="'+m.accent+'" stroke-opacity=".6"');body+=`<g transform="translate(68 16) scale(${s})">`;
 body+=path(Array.from({length:size-1},(_,i)=>`M${i+1} 0V${size}M0 ${i+1}H${size}`).join(''),'#fff',.08,'opacity=".2"');
 body+=`<path d="${m.obstacles.map(p=>`M${p.x} ${p.y}h1v1h-1Z`).join('')}" fill="${m.wall}" stroke="${m.accent}" stroke-width=".07"/>`;
 const [x,y]=snakeStarts(size)[0];body+=path(`M${x-2+.5} ${y+.5}h3`,'#142d39',1.35)+path(`M${x-2+.5} ${y+.5}h3`,'#63f3a7',1.05)+circle(x+1.5,y+.5,.65,'#a9ffd0')+circle(x+1.65,y+.2,.1,'#18363e');
 for(const [fx,fy] of [[.28,.7],[.78,.45]]){const x=Math.floor(fx*size),y=Math.floor(fy*size);if(!m.obstacles.some(p=>p.x===x&&p.y===y))body+=circle(x+.5,y+.5,.42,'#ff677d')}
 body+='</g>';body+=path('M29 36v22M18 47h22',m.accent,1.3,'opacity=".5"')+circle(285,177,8,m.accent,'opacity=".4"');save(`snake-${map.id}-${size}`,body,m.ground[0]);
}
function route(points,color,road){const minX=Math.min(...points.map(p=>p.x)),maxX=Math.max(...points.map(p=>p.x)),minY=Math.min(...points.map(p=>p.y)),maxY=Math.max(...points.map(p=>p.y)),s=Math.min(255/(maxX-minX),150/(maxY-minY));const ps=points.map(p=>({x:160+(p.x-(minX+maxX)/2)*s,y:108+(p.y-(minY+maxY)/2)*s})),d=ps.map((p,i)=>(i?'L':'M')+p.x.toFixed(2)+' '+p.y.toFixed(2)).join('')+'Z';return path(d,'#182537',27)+path(d,color,25)+path(d,road,20)+path(d,'#fff4dc',1,'stroke-dasharray="4 8"')+rect(ps[0].x-4,ps[0].y-12,8,24,'#fff4dc')+rect(ps[0].x-4,ps[0].y-12,4,8,'#283449')+rect(ps[0].x,ps[0].y-4,4,8,'#283449')}
for(const t of TRACKS)save('circuit-'+t.id,route(trackPoints(t.id), '#f2dca5',t.road),t.ground);
for(const m of CLUB_MAPS)for(const kind of ['tanks','sumo','marble','pong']){let body='';if(kind==='marble')body=route(clubTrack(m.id),m.ink,m.road);else if(kind==='tanks'){
 body=rect(16,18,288,180,m.road,8,'stroke="'+m.ink+'" stroke-width="2"');body+='<g transform="translate(16 18) scale(.3)">';for(const w of tankWalls(m.id))body+=rect(w.x,w.y,w.w,w.h,m.ground,4,'stroke="'+m.ink+'" stroke-width="4"');for(const [x,y,color] of [[100,100,'#765aff'],[860,500,'#ff756b']])body+=rect(x-30,y-25,60,50,'#21364b',10)+rect(x-22,y-18,44,36,color,8)+path(`M${x} ${y}h43`,'#21364b',9);body+='</g>';
 }else if(kind==='sumo'){body=circle(160,108,85,m.ink)+circle(160,108,79,'#f5dca9')+circle(160,108,68,'#efd096','stroke="#b08b59" stroke-width="2"')+path('M148 98v20M172 98v20','#a98454',3);for(const [x,color] of [[126,'#8266f0'],[194,'#ed797b']])body+=circle(x,108,18,color)+path(`M${x-13} 115h26`,'#31374f',6)+circle(x-4,101,4,'#fff6cb');
 }else{body=rect(18,20,284,176,'#17283e',10,'stroke="'+m.ink+'" stroke-width="3"')+path('M160 28v160',m.ink,2,'stroke-dasharray="5 8"')+circle(160,108,36,'none','stroke="'+m.ink+'" stroke-width="1"')+rect(38,65,10,60,'#9578ff',5)+rect(272,100,10,58,'#ff8da3',5)+circle(208,76,7,'#fff1bd')}
 save(kind+'-'+m.id,body,m.ground);
}
for(const s of TABLE_SCENES)for(const kind of ['board','cards','pool']){let body=rect(20,20,280,176,s.wood,14)+rect(26,26,268,164,s.feltLight,10,'stroke="'+s.accent+'" stroke-width="1.5"');
 if(kind==='board'){for(let y=0;y<8;y++)for(let x=0;x<8;x++)body+=rect(84+x*19,32+y*19,19,19,(x+y)%2?s.dark:s.light);for(const [x,y,c]of [[112,60,s.felt],[188,136,s.accent],[150,98,s.accent]])body+=circle(x,y,8,c,'stroke="'+s.ink+'" stroke-width="1"')}
 else if(kind==='pool'){for(const x of [34,160,286])for(const y of [34,182])body+=circle(x,y,8,'#101a2c');for(const [x,y,c]of [[95,120,'#fff6dc'],[218,93,'#f9c34f'],[232,108,'#3b71df'],[218,123,'#ff6d87']])body+=circle(x,y,7,c)}
 else for(let i=0;i<3;i++)body+=rect(83+i*50,57+(i%2)*14,50,77,'#fff5da',7)+rect(88+i*50,62+(i%2)*14,40,67,['#ff6288','#42bcd7','#9a74e7'][i],4)+circle(108+i*50,95+(i%2)*14,12,'#fff1dc');
 save(`table-${s.id}-${kind}`,body,s.felt);
}
console.log('Generated '+(SNAKE_MAPS.length*SNAKE_SIZES.length+TRACKS.length+CLUB_MAPS.length*4+TABLE_SCENES.length*3)+' map and table previews from shared game geometry.');
