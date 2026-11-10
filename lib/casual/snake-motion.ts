import {snakeCollisions} from './snake-collision.ts';
import {predictionWindow} from '../game-motion.ts';
import type {Point,Direction,SnakeGame,Worm} from './engine.ts';
const delta:Record<Direction,Point>={up:{x:0,y:-1},right:{x:1,y:0},down:{x:0,y:1},left:{x:-1,y:0}};
export type SnakeSnapshot={game:SnakeGame;at:number};
export type SnakeInput={direction:Direction;seq:number;tick?:number};
export type PredictedTurn=Direction|{direction:Direction;tick?:number};
function predictionWorld(g:SnakeGame){return g.worms.filter(w=>w.alive&&w.body.length).map(w=>({...w,body:w.body,queue:[...(w.queue||[])],queueTicks:[...(w.queueTicks||[])]}))}
/** Forecast known routes together; never draw through a confirmed body or head swap. */
function forecastStep(g:SnakeGame,world:ReturnType<typeof predictionWorld>,id:string,direction:Direction,tick:number,food:Set<string>){
 const alive=world.filter(w=>w.alive),heads=new Map<string,Point>(),growing=new Set<string>();
 for(const w of alive){if(w.id===id)w.direction=direction;else if(w.queue.length&&(!w.queueTicks.length||w.queueTicks[0]<=tick)){w.direction=w.queue.shift()!;w.queueTicks.shift()}const d=delta[w.direction],head={x:w.body[0].x+d.x,y:w.body[0].y+d.y};heads.set(w.id,head);if(food.has(head.x+','+head.y))growing.add(w.id)}
 const {dead}=snakeCollisions(alive,heads,growing,g.size||32,g.obstacles);let own:Point[]|undefined;
 for(const w of alive){if(dead.has(w.id)){w.alive=false;continue}const head=heads.get(w.id)!;w.body=[head,...(growing.has(w.id)?w.body:w.body.slice(0,-1))];if(growing.has(w.id))food.delete(head.x+','+head.y);if(w.id===id)own=w.body}
 return own;
}
export function blendBodies(a:Point[],b:Point[],t:number){return b.map((p,i)=>{const from=a[Math.min(i,a.length-1)]||p;return{x:from.x+(p.x-from.x)*t,y:from.y+(p.y-from.y)*t}})}
/** Follow the received head trail around corners instead of cutting diagonally through tiles. */
export function snakePathBody(a:Point[],b:Point[],steps:number,t:number,out:Point[]=[],trail:Point[]=b){
 if(!a.length||!b.length||steps<1)return b;
 let prior=a[0],valid=steps<=trail.length;
 for(let i=steps-1;valid&&i>=0;i--){const p=trail[i];valid=Math.abs(p.x-prior.x)+Math.abs(p.y-prior.y)===1;prior=p}
 if(!valid)return t>=1?b:a; // A missing trail cannot safely be guessed.
 const point=(i:number)=>i<a.length?a[a.length-1-Math.max(0,i)]:trail[steps-1-(i-a.length)];
 out.length=b.length;const progress=steps*Math.max(0,Math.min(1,t));
 for(let i=0;i<b.length;i++){const at=Math.max(0,a.length-1-i+progress),index=Math.floor(at),f=at-index,from=point(index),to=f?point(index+1):from,p=out[i]||(out[i]={x:0,y:0});p.x=from.x+(to.x-from.x)*f;p.y=from.y+(to.y-from.y)*f}
 return out;
}
/** Advance complete grid steps first, then interpolate one fractional step, including turns and growth. */
export function predictSnake(g:SnakeGame,w:Worm,clock:number,speed:number,turns:PredictedTurn[]=[]){
 let body=w.body.map(p=>({...p})),direction=w.direction,turnIndex=0;if(!w.alive||clock<g.startAt||!body.length)return body;
 const world=predictionWorld(g),food=new Set(g.food.map(p=>p.x+','+p.y)),steps=Math.min(40,Math.max(0,(clock-g.lastTickAt)/speed));
 for(let i=0;i<Math.ceil(steps);i++){
  const turn=turns[turnIndex];if(turn&&(typeof turn==='string'||turn.tick===undefined||turn.tick<=g.tick+i+1)){const proposed=typeof turn==='string'?turn:turn.direction;turnIndex++;if(delta[proposed].x!==-delta[direction].x||delta[proposed].y!==-delta[direction].y)direction=proposed}
  const next=forecastStep(g,world,w.id,direction,g.tick+i+1,food);if(!next)break;
  const fraction=Math.min(1,steps-i);body=fraction===1?next:blendBodies(body,next,fraction);
 }
 return body;
}
export function sampledSnake(history:SnakeSnapshot[],id:string,clock:number,speed:number,horizon=650){
 if(!history.length)return[];const latest=history.at(-1)!.game.worms.find(w=>w.id===id);if(!latest?.alive||!latest.body.length)return[];let a=history[0];
 for(let i=1;i<history.length;i++){const b=history[i];if(clock<=b.at){const wa=a.game.worms.find(w=>w.id===id),wb=b.game.worms.find(w=>w.id===id);if(!wb)return latest.body;if(!wa||!wa.alive||!wb.alive||wa.deathAt!==latest.deathAt||wb.deathAt!==latest.deathAt||wa.protectedUntil!==latest.protectedUntil||wb.protectedUntil!==latest.protectedUntil||wa.deathAt!==wb.deathAt||wa.protectedUntil!==wb.protectedUntil||Math.hypot((wa.body[0]?.x||0)-(wb.body[0]?.x||0),(wa.body[0]?.y||0)-(wb.body[0]?.y||0))>6)return latest.body;return snakePathBody(wa.body,wb.body,b.game.tick-a.game.tick,(clock-a.at)/Math.max(1,b.at-a.at),[],wb.trail||wb.body)}a=b}
 const w=a.game.worms.find(w=>w.id===id);return w?predictSnake(a.game,w,Math.min(clock,a.at+Math.min(speed,horizon)),speed):[];
}
export function snakeBuffer(rtt:number){return Math.min(700,Math.max(100,Math.max(0,rtt)*.5+100))}
export function snakeHorizon(rtt:number,speed:number){return Math.max(speed*2,predictionWindow(rtt,speed))}
/** Schedule the boundary the input can actually reach at the room authority. */
export function snakeTurnTick(g:{tick:number;lastTickAt:number},serverNow:number,speed:number,age:number,rtt:number,previousTick=g.tick){
 // The snapshot has already spent half an RTT in transit. The input needs the
 // other half to reach the authority; predicting the earlier boundary folds the
 // snake back when the server confirms the actual turn.
 // Even a local or fast connection can receive input halfway through a drawn
 // cell. Keep that step's direction: turning it retroactively moves the head
 // sideways and forces presentation to replace its route. Reserve the next
 // untouched boundary on every connection, including zero-latency local play.
 const margin=speed;
 // A countdown snapshot's lastTickAt is still in the future. Preserve that
 // negative offset until transit and receipt age have been added; clamping it
 // early schedules the first turn several cells too late on a slow link.
 const phase=Math.max(0,serverNow-g.lastTickAt+Math.max(0,age)+Math.max(0,rtt))+margin;
 return Math.max(g.tick+Math.max(1,Math.ceil(phase/Math.max(40,speed))),previousTick+1);
}

/** The wire keeps only recent heads; a long body is the rest of the same path. */
export function snakeRecordedTrail(w:{body:Point[];trail?:Point[]}){
 const trail=w.trail?.length?w.trail:w.body;
 if(!trail.length||trail.length>=w.body.length)return trail;
 const tail=trail.at(-1)!,at=w.body.findIndex(p=>p.x===tail.x&&p.y===tail.y);
 return at<0?w.body:[...trail,...w.body.slice(at+1)];
}

type Prediction={world:ReturnType<typeof predictionWorld>;body:Point[];tick:number;startAt:number;turns:PredictedTurn[];direction:Direction;turnIndex:number;frames:Point[][];food:Set<string>;walls:Point[]|undefined;stopped:boolean;sampleAt?:number;sampleFraction?:number};
/** Build grid steps once per snapshot/input, then interpolate into reusable point buffers. */
export class SnakeMotionBuffer{
 private predictions=new Map<string,Prediction>();private outputs=new Map<string,Point[]>();private trails=new Map<string,Point[]>();
 reset(){this.predictions.clear();this.outputs.clear();this.trails.clear()}
 private blend(id:string,a:Point[],b:Point[],t:number){let out=this.outputs.get(id);if(!out){out=[];this.outputs.set(id,out)}out.length=b.length;for(let i=0;i<b.length;i++){const from=a[Math.min(i,a.length-1)]||b[i],point=out[i]||(out[i]={x:0,y:0});point.x=from.x+(b[i].x-from.x)*t;point.y=from.y+(b[i].y-from.y)*t}return out}
 predict(g:SnakeGame,w:Worm,clock:number,speed:number,turns:PredictedTurn[]){
  if(!w.alive||clock<g.startAt||!w.body.length)return w.body;
  let state=this.predictions.get(w.id);if(!state||state.body!==w.body||state.tick!==g.tick||state.startAt!==g.startAt||state.turns!==turns||state.walls!==g.obstacles){state={world:predictionWorld(g),body:w.body,tick:g.tick,startAt:g.startAt,turns,direction:w.direction,turnIndex:0,frames:[w.body],food:new Set(g.food.map(p=>p.x+','+p.y)),walls:g.obstacles,stopped:false};this.predictions.set(w.id,state)}
  const steps=Math.min(40,Math.max(0,(clock-g.lastTickAt)/speed));
  while(state.frames.length<=Math.ceil(steps)&&!state.stopped){const i=state.frames.length-1,turn=turns[state.turnIndex];if(turn&&(typeof turn==='string'||turn.tick===undefined||turn.tick<=g.tick+i+1)){const proposed=typeof turn==='string'?turn:turn.direction;state.turnIndex++;if(delta[proposed].x!==-delta[state.direction].x||delta[proposed].y!==-delta[state.direction].y)state.direction=proposed}const next=forecastStep(g,state.world,w.id,state.direction,g.tick+i+1,state.food);if(!next){state.stopped=true;break}state.frames.push(next)}
  const at=Math.min(Math.floor(steps),state.frames.length-1),a=state.frames[at],b=state.frames[Math.min(at+1,state.frames.length-1)];state.sampleAt=at;state.sampleFraction=steps-Math.floor(steps);return this.blend(w.id,a,b,state.sampleFraction);
 }
 /** Reuse the predicted head trail so display reconciliation follows every corner. */
 trail(id:string,recorded:Point[]){const state=this.predictions.get(id),head=this.outputs.get(id)?.[0];let out=this.trails.get(id);if(!out){out=[];this.trails.set(id,out)}out.length=0;if(!state||!head)return recorded;out.push(head);for(let i=state.sampleAt??0;i>=0;i--){const p=state.frames[i][0],last=out.at(-1)!;if(Math.hypot(last.x-p.x,last.y-p.y)>.00001)out.push(p)}for(let i=1;i<recorded.length;i++)out.push(recorded[i]);return out}
 sample(history:SnakeSnapshot[],id:string,clock:number,speed:number,horizon=200){if(!history.length)return[];const latest=history.at(-1)!.game.worms.find(w=>w.id===id);if(!latest?.alive||!latest.body.length)return[];let a=history[0];for(let i=1;i<history.length;i++){const b=history[i];if(clock<=b.at){const wa=a.game.worms.find(w=>w.id===id),wb=b.game.worms.find(w=>w.id===id);if(!wb)return latest.body;if(!wa||!wa.alive||!wb.alive||wa.deathAt!==latest.deathAt||wb.deathAt!==latest.deathAt||wa.protectedUntil!==latest.protectedUntil||wb.protectedUntil!==latest.protectedUntil||wa.deathAt!==wb.deathAt||wa.protectedUntil!==wb.protectedUntil)return latest.body;let out=this.outputs.get(id);if(!out){out=[];this.outputs.set(id,out)}return snakePathBody(wa.body,wb.body,b.game.tick-a.game.tick,(clock-a.at)/Math.max(1,b.at-a.at),out,wb.trail||wb.body)}a=b}const w=a.game.worms.find(w=>w.id===id);return w?this.predict(a.game,w,Math.min(clock,a.at+Math.min(speed,horizon)),speed,NO_TURNS):[]}
}
const NO_TURNS:PredictedTurn[]=[];
