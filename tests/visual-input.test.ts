import test from 'node:test';
import assert from 'node:assert/strict';
import {PieceMotion,rollingAngle} from '../lib/casual/visual-motion.ts';
import {predictionWindow,interpolatePose} from '../lib/game-motion.ts';
import {createCasual,applyCasualAction,advanceCasual,type CasualMode} from '../lib/casual/engine.ts';
import {driveInput} from '../lib/casual/drive-controls.ts';

test('piece presentation eases adjacent cells, snaps a new piece, and leaves the collision grid exact',()=>{
 const motion=new PieceMotion();assert.equal(motion.resolve('human','T:0:queue1',3,1,16).x,3);
 const moved=motion.resolve('human','T:0:queue1',4,1,16);assert(moved.x>3&&moved.x<4);
 for(let i=0;i<30;i++)motion.resolve('human','T:0:queue1',4,1,16);
 assert(Math.abs(moved.x-4)<.0001);assert.equal(motion.resolve('human','T:0:queue2',3,-1,16).y,-1);
 assert.equal(motion.resolve('human','T:0:queue2',3,19,16).y,19);motion.reset();assert.equal(motion.resolve('human','T:0:queue2',1,2,16).x,1);
});
test('marble seams integrate travel continuously through speed changes and stop at rest',()=>{
 let angle=0;for(let n=0;n<60;n++)angle=rollingAngle(angle,100,1000/60);assert(Math.abs(angle-5)<.0001);
 const changed=rollingAngle(angle,180,16);assert(Math.abs(changed-angle)<.15);assert.equal(rollingAngle(changed,0,16),changed);
});
test('speculation stays bounded during stalled updates and remote recovery never crosses the map',()=>{
 assert(predictionWindow(10000)<=900);assert(predictionWindow(100)>=300);
 const frames=[{at:0,pose:{x:0,y:0},epoch:1},{at:100,pose:{x:1000,y:500},epoch:2}];
 assert.deepEqual(interpolatePose(frames,50,{x:0,y:0},180),{x:1000,y:500});
});
test('untouched and opposing kart controls stay neutral',()=>{
 assert.deepEqual(driveInput({}),{action:'drive',throttle:0,steer:0,drift:false});
 assert.equal(driveInput({up:true,down:true,left:true,right:true}).throttle,0);assert.equal(driveInput({up:true,down:true,left:true,right:true}).steer,0);
 assert.equal(driveInput({left:true}).steer,-1);assert.equal(driveInput({right:true}).steer,1);
});
function start(mode:CasualMode){let state=createCasual('ABCDEFGH','human','Human','hash',mode,1719,10000);state.settings.bots=1;state.settings.sumoFormat='classic';return applyCasualAction(state,{action:'start'},'human',10000)}
test('computer decisions never assign held controls to an untouched human seat',()=>{
 for(const mode of ['circuit','sumo','tanks','pong','marble'] as const){let state=start(mode);const game=state.game as any;
  for(let ms=50;ms<=1000;ms+=50)state=advanceCasual(state,game.startAt+ms).state;
  assert.equal((state.game as any).inputs.human,undefined,mode+' injected human input');
  if(mode==='circuit'){const driver=(state.game as any).drivers.find((p:any)=>p.id==='human');assert.equal(driver.bot,false);assert.equal(driver.speed,0)}
 }
});

test('terrain chunks reuse identical snapshots and redraw the mined chunk or newly loaded art',async()=>{
 const {TerraTerrain}=await import('../components/casual/terra-terrain.ts');
 const original=Object.getOwnPropertyDescriptor(globalThis,'document');let clears=0,draws=0;
 const context={clearRect:()=>clears++,fillRect:()=>{},strokeRect:()=>{},drawImage:()=>{},fillStyle:'',strokeStyle:'',lineWidth:1};
 Object.defineProperty(globalThis,'document',{configurable:true,value:{createElement:()=>({width:0,height:0,getContext:()=>({...context})})}});
 try{
  const terrain=new TerraTerrain(),game:any={width:64,height:48,tiles:Array(64*48).fill(3)},images=new Map(),canvas={drawImage:()=>draws++} as any;
  terrain.draw(canvas,game,images,{x:0,y:0});const initial=clears;assert(initial>0&&draws>0);
  terrain.draw(canvas,{...game,tiles:game.tiles.slice()},images,{x:0,y:0});assert.equal(clears,initial,'identical snapshots repainted the terrain');
  const next={...game,tiles:game.tiles.slice()};next.tiles[0]=0;terrain.draw(canvas,next,images,{x:0,y:0});assert.equal(clears,initial+1,'mining must invalidate only its chunk');
  terrain.invalidate();terrain.draw(canvas,next,images,{x:0,y:0});assert.equal(clears,initial*2+1,'loaded art must replace fallback tiles');
 }finally{if(original)Object.defineProperty(globalThis,'document',original);else Reflect.deleteProperty(globalThis,'document')}
});
