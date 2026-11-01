import test from 'node:test';
import assert from 'node:assert/strict';
import {stableRoomRequest,roomHint,ROOM_HINT_HEADERS} from '../lib/room-params.ts';
import {roomHeaders} from '../lib/room-origin.ts';
import {RoomTransport} from '../lib/room-transport.ts';
import {routeCasual} from '../lib/casual/room-route.ts';
import {routeArena} from '../lib/arena-route.ts';
import {snakePathBody,snakeHorizon,SnakeMotionBuffer} from '../lib/casual/snake-motion.ts';
import {followCamera,PoseReconciler} from '../lib/game-motion.ts';
import {createCasual,applyCasualAction,type SnakeGame} from '../lib/casual/engine.ts';

test('changing snapshot hints leave a stable URL, method and header-name set for preflight reuse',()=>{
 const urls:string[]=[],names:string[]=[];
 for(let revision=1;revision<10;revision++){
  const url=new URL(`https://example.test/api/casual?code=ABCDEFGH&revision=${revision}&scene=map-${revision}`);
  const init=stableRoomRequest(url,{headers:{Authorization:'Bearer test'}},'snapshot-'+revision);
  const req=new Request(url,init);urls.push(url.href);names.push([...req.headers.keys()].join(','));
  assert.equal(roomHint(req,'revision'),String(revision));assert.equal(roomHint(req,'base'),'snapshot-'+revision);
 }
 assert.equal(new Set(urls).size,1);assert.equal(new Set(names).size,1);
 const allow=roomHeaders(new Request('https://example.test',{headers:{Origin:'http://127.0.0.1:5173'}}))['Access-Control-Allow-Headers'];
 for(const header of Object.values(ROOM_HINT_HEADERS))assert(allow?.includes(header));
 assert.equal(roomHeaders(new Request('https://example.test'))['Cache-Control'],'no-store');
 assert.equal(roomHint(new Request('https://example.test?revision=7'),'revision'),'7');
});

test('transport keeps subsequent polling URLs stable while using fresh snapshot bases',async()=>{
 const original=globalThis.fetch,calls:{url:string;base:string|null}[]=[];
 globalThis.fetch=async(input,init)=>{const req=new Request(String(input),init);calls.push({url:req.url,base:req.headers.get('X-Room-Base')});return Response.json({room:{code:'ABCDEFGH',revision:calls.length,serverNow:100+calls.length},snapshotId:'snapshot-'+calls.length})};
 try{const transport=new RoomTransport();await transport.send('https://example.test/api/casual?code=ABCDEFGH&revision=1');await transport.send('https://example.test/api/casual?code=ABCDEFGH&revision=2');assert.equal(calls[0].url,calls[1].url);assert.equal(calls[1].base,'snapshot-1')}finally{globalThis.fetch=original}
});

test('both room families request Southeast Asia without changing existing room identities',async()=>{
 const calls:{name:string;hint:string}[]=[],rooms={idFromName:(name:string)=>name,get:(name:string,options:any)=>{calls.push({name,hint:options.locationHint});return{fetch:async()=>Response.json({ok:true})}}} as any;
 await routeCasual(new Request('https://example.test/api/casual?code=ABCDEFGH'),{CASUAL_ROOMS:rooms});
 await routeArena(new Request('https://example.test/api/arena?code=ABCDEFGH'),{ARENA_ROOMS:rooms});
 assert.deepEqual(calls,[{name:'casual:ABCDEFGH',hint:'apac-se'},{name:'arena:ABCDEFGH',hint:'apac-se'}]);
});

test('a two-tick corner stays on the received grid trail instead of crossing a diagonal tile',()=>{
 const a=[{x:2,y:2},{x:1,y:2},{x:0,y:2}],b=[{x:3,y:3},{x:3,y:2},{x:2,y:2}];
 assert.deepEqual(snakePathBody(a,b,2,.5)[0],{x:3,y:2});
 for(let t=0;t<=1;t+=.025){for(const p of snakePathBody(a,b,2,t))assert(Number.isInteger(p.x)||Number.isInteger(p.y),'A segment cut diagonally across a tile')}
 assert.deepEqual(snakePathBody(a,b,2,1),b);
});

test('missing grid trails are held rather than inventing a five-tile path',()=>{
 const a=[{x:2,y:2}],b=[{x:7,y:2}];assert.deepEqual(snakePathBody(a,b,5,.5),a);assert.deepEqual(snakePathBody(a,b,5,1),b);
 assert(snakeHorizon(900,125)>=575&&snakeHorizon(900,125)<=1000);
 let s=createCasual('ABCDEFGH','human','Human','hash','snake',1,10000);s=applyCasualAction(s,{action:'start'},'human',10000);
 const g=s.game as SnakeGame;g.obstacles=[];g.food=[];g.worms[0].direction='right';g.worms[0].body=[{x:10,y:10},{x:9,y:10}];
 const motion=new SnakeMotionBuffer(),body=motion.sample([{game:g,at:g.lastTickAt}],'human',g.lastTickAt+5000,125,1500);
 assert.equal(body[0].x,11,'Unknown remote turns are predicted by at most one tile');
});

test('camera dead zone rejects subpixel jitter and follows movement without overshoot',()=>{
 let camera={x:10,y:10};for(let i=0;i<100;i++)camera=followCamera(camera,{x:10+(i%2?.01:-.01),y:10},16);assert.deepEqual(camera,{x:10,y:10});
 let previous=camera.x;for(let i=0;i<100;i++){camera=followCamera(camera,{x:15,y:10},16);assert(camera.x>=previous&&camera.x<=15);previous=camera.x}assert(Math.abs(camera.x-15)<.03);
 assert.deepEqual(followCamera(camera,{x:100,y:50},16),{x:100,y:50});
});

test('large prediction corrections do not drag an actor slowly across five tiles',()=>{
 const reconcile=new PoseReconciler();reconcile.resolve('actor',{x:2,y:2},16,false,1.25,9);
 assert.deepEqual(reconcile.resolve('actor',{x:7,y:2},16,true,1.25,9),{x:7,y:2,angle:undefined});
});
