import {test} from 'node:test';
import assert from 'node:assert/strict';
import {KART_HULL,TANK_HULL,hullAt,hullContact,hullCircleContact,wallHull} from '../lib/casual/collision.ts';
import {nearestOnPath} from '../lib/casual/path-geometry.ts';
import {TRACKS,trackPoints,circuitProps,circuitObstacles,circuitPropHull,constrainKart,stepCircuit,type CircuitGame} from '../lib/casual/circuit.ts';
import {CLUB_MAPS,tankWalls,tankSpawn,constrainTank,stepParty,type PartyGame} from '../lib/casual/party.ts';
import {createCasual,applyCasualAction,advanceCasual,publicCasual} from '../lib/casual/engine.ts';
import {defaultPanelLayout,panelGrid,readPanelLayout} from '../lib/casual/panel-layout.ts';
import {BASE_ONLINE_CONTENT,onlineContentAvailable} from '../lib/casual/online-content.ts';
import {SNAKE_MAP_IDS} from '../lib/casual/maps.ts';
import {TABLE_SCENE_IDS} from '../lib/casual/scenes.ts';
import {existsSync,readFileSync} from 'node:fs';
function room(mode:'circuit'|'tanks'){let s=createCasual('ABCDEFGH','p0','Host','hash',mode,42,1000);s=applyCasualAction(s,{action:'join',id:'p1',name:'Guest',hash:'h1'},null,1000);s.settings.arcadeV2=true;return applyCasualAction(s,{action:'start'},'p0',1000)}
test('visible kart wheels and bumper corners contact objects before their centers do',()=>{
 const h=hullAt({x:0,y:0,angle:0},KART_HULL);
 assert(hullCircleContact(h,{x:37,y:31},2));assert(hullCircleContact(h,{x:43,y:0},5));
 assert(!hullCircleContact(h,{x:0,y:40},5));
 const b=hullAt({x:60,y:60,angle:Math.PI/4},KART_HULL);assert(hullContact(h,b));
 const hit=hullContact(h,b)!;h.x+=hit.nx*(hit.depth+.001);h.y+=hit.ny*(hit.depth+.001);assert(!hullContact(h,b));
});
test('rotated hull contact resolves on the correct side, including an enclosed obstacle',()=>{
 for(let i=0;i<48;i++){const angle=i*Math.PI/24,h=hullAt({x:0,y:0,angle},TANK_HULL),p={x:Math.cos(angle)*33,y:Math.sin(angle)*33},hit=hullCircleContact(h,p,9)!;assert(hit);h.x+=hit.nx*(hit.depth+.001);h.y+=hit.ny*(hit.depth+.001);assert(!hullCircleContact(h,p,9))}
});
test('all arena starts and rotating tank treads stay outside solid cover',()=>{
 for(const m of CLUB_MAPS)for(let index=0;index<8;index++)for(const angle of [0,.4,.9,1.5,2.2]){const p=tankSpawn(m.id,index,1.5),h=hullAt({...p,angle},TANK_HULL);for(const w of tankWalls(m.id,1.5))assert(!hullContact(h,wallHull(w)),m.id+':'+index)}
 const g=room('tanks').game as PartyGame,a=g.actors[0],w=tankWalls(g.map,1.5)[0];Object.assign(a,{x:w.x-40,y:w.y+40,hullAngle:Math.PI/4});constrainTank(a,[w],1.5);assert(!hullContact(hullAt(a,TANK_HULL,a.hullAngle),wallHull(w)));
});
test('track index matches an exhaustive segment search near and far from every route',()=>{
 for(const t of TRACKS)for(const scale of [1,3,6.6]){const ps=trackPoints(t.id,192,scale);for(let i=0;i<120;i++){const x=(Math.sin(i*13.7)*1100+1000)*scale,y=(Math.cos(i*3.1)*800+700)*scale;let best=Infinity;for(let j=0;j<ps.length;j++){const a=ps[j],b=ps[(j+1)%ps.length],dx=b.x-a.x,dy=b.y-a.y,f=Math.max(0,Math.min(1,((x-a.x)*dx+(y-a.y)*dy)/(dx*dx+dy*dy)));best=Math.min(best,Math.hypot(x-a.x-dx*f,y-a.y-dy*f))}assert(Math.abs(nearestOnPath(ps,x,y).distance-best)<1e-8)}}
});
test('barrier corners share rectangular rendering geometry and constrain the racing chassis',()=>{
 const g=room('circuit').game as CircuitGame,d=g.drivers[0];for(const p of circuitObstacles(g)){const box=circuitPropHull(p,g.track)!;assert(box);Object.assign(d,{x:p.x,y:p.y,angle:p.angle+.4,speed:500});constrainKart(g,d);assert(!hullContact(hullAt(d,KART_HULL),box))}
});
test('road-edge constraints cannot push wheels back through any scenery footprint',()=>{
 for(const t of TRACKS){const state=room('circuit'),g=state.game as CircuitGame;g.track=t.id;const d=g.drivers[0];for(const p of [...circuitProps(g),...circuitObstacles(g)])for(const angle of [0,.5,1.4,2.4]){Object.assign(d,{x:p.x,y:p.y,angle});constrainKart(g,d);const box=circuitPropHull(p,g.track),hit=box?hullContact(hullAt(d,KART_HULL),box):hullCircleContact(hullAt(d,KART_HULL),p,p.radius);assert(!hit||hit.depth<.001,t.id+':'+p.kind)}}
});
test('public-state prediction agrees with authoritative room advancement through collisions',()=>{
 for(const mode of ['circuit','tanks'] as const){let state=room(mode);const initial=state.game as CircuitGame|PartyGame,start=initial.startAt;
  for(const p of state.players)state=applyCasualAction(state,mode==='circuit'?{action:'drive',seq:1,round:1,throttle:1,steer:.2,drift:false}:{action:'party-control',seq:1,round:1,dx:1,dy:1,aim:0,fire:false,dash:false},p.id,start);
  const predicted=structuredClone(publicCasual(state,'p0',start).game);
  for(let i=1;i<=12;i++){const now=start+i*50;if(mode==='circuit')stepCircuit(predicted,['p0','p1'],.05,now);else stepParty(predicted,.05,now,false);predicted.lastTickAt=now;state=advanceCasual(state,now).state}
  assert.deepEqual(mode==='circuit'?predicted.drivers:predicted.actors,mode==='circuit'?(state.game as CircuitGame).drivers:(state.game as PartyGame).actors);
 }
});
test('panel grids occupy only requested columns and stack without losing either panel',()=>{
 assert.equal(panelGrid(defaultPanelLayout,1400).gridTemplateAreas,'"game players" "game chat"');
 assert.equal(panelGrid(defaultPanelLayout,390).gridTemplateAreas,'"game" "players" "chat"');
 for(const a of ['left','right','above','below'] as const)for(const b of ['left','right','above','below'] as const){const layout=readPanelLayout({players:{...defaultPanelLayout.players,side:a},chat:{...defaultPanelLayout.chat,side:b}}),grid=panelGrid(layout,1600);assert(grid.gridTemplateAreas.includes('game'));assert(grid.gridTemplateAreas.includes('players'));assert(grid.gridTemplateAreas.includes('chat'));if(![a,b].includes('left')&&![a,b].includes('right'))assert.equal(grid.gridTemplateColumns,'minmax(0,1fr)')}
 assert.equal(readPanelLayout({chat:{side:'bad',width:1e9,height:-2}}).chat.height,220);
 assert(panelGrid(defaultPanelLayout,1400,{players:true}).gridTemplateRows.startsWith('60px'));
});
test('every current choice remains available online after a missing health response',()=>{
 for(const map of SNAKE_MAP_IDS)assert(onlineContentAvailable('snake',{cards:32,speed:175,map},BASE_ONLINE_CONTENT));
 for(const scene of TABLE_SCENE_IDS)assert(onlineContentAvailable('uno',{cards:32,speed:175,scene},BASE_ONLINE_CONTENT));
 for(const m of CLUB_MAPS)assert(onlineContentAvailable('tanks',{cards:32,speed:175,arena:m.id},BASE_ONLINE_CONTENT));
 for(const t of TRACKS)assert(onlineContentAvailable('circuit',{cards:32,speed:175,track:t.id},BASE_ONLINE_CONTENT));
});
test('every map image exists for each supported snake size and table palette',()=>{
 for(const map of SNAKE_MAP_IDS)for(const size of [32,48,64])assert(existsSync(`public/map-previews/v19/snake-${map}-${size}.svg`));
 for(const scene of TABLE_SCENE_IDS)for(const kind of ['board','cards','pool'])assert(existsSync(`public/map-previews/v19/table-${scene}-${kind}.svg`));
 const art=readFileSync('components/casual/Art.tsx','utf8');assert(!art.includes('<MapPreview'));assert(!readFileSync('components/casual/BlocksArena.tsx','utf8').includes('clear full rows'));
});
