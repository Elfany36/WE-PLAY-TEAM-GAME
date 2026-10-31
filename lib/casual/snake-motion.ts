import type {Point,Direction,SnakeGame,Worm} from './engine.ts';
const delta:Record<Direction,Point>={up:{x:0,y:-1},right:{x:1,y:0},down:{x:0,y:1},left:{x:-1,y:0}};
export type SnakeSnapshot={game:SnakeGame;at:number};
export type SnakeInput={direction:Direction;seq:number;tick?:number};
export type PredictedTurn=Direction|{direction:Direction;tick?:number};
const wallCache=new WeakMap<Point[],Set<string>>();
function blocked(g:SnakeGame){const cells=g.obstacles||[];let set=wallCache.get(cells);if(!set){set=new Set(cells.map(p=>p.x+','+p.y));wallCache.set(cells,set)}return set}
export function blendBodies(a:Point[],b:Point[],t:number){return b.map((p,i)=>{const from=a[Math.min(i,a.length-1)]||p;return{x:from.x+(p.x-from.x)*t,y:from.y+(p.y-from.y)*t}})}
/** Advance complete grid steps first, then interpolate one fractional step, including turns and growth. */
export function predictSnake(g:SnakeGame,w:Worm,clock:number,speed:number,turns:PredictedTurn[]=[]){
 let body=w.body.map(p=>({...p})),direction=w.direction,turnIndex=0;if(!w.alive||clock<g.startAt||!body.length)return body;
 const steps=Math.min(12,Math.max(0,(clock-g.lastTickAt)/speed)),walls=blocked(g),size=g.size||32,occupied=new Set(body.map(p=>p.x+','+p.y)),food=new Set(g.food.map(p=>p.x+','+p.y));
 for(let i=0;i<Math.ceil(steps);i++){
  const turn=turns[turnIndex];if(turn&&(typeof turn==='string'||turn.tick===undefined||turn.tick<=g.tick+i+1)){const proposed=typeof turn==='string'?turn:turn.direction;turnIndex++;if(delta[proposed].x!==-delta[direction].x||delta[proposed].y!==-delta[direction].y)direction=proposed;}
  const d=delta[direction],head={x:body[0].x+d.x,y:body[0].y+d.y},key=head.x+','+head.y,eats=food.has(key);if(!eats){const tail=body.at(-1)!;occupied.delete(tail.x+','+tail.y)}
  if(head.x<0||head.y<0||head.x>=size||head.y>=size||walls.has(key)||occupied.has(key))break;
  occupied.add(key);if(eats)food.delete(key);
  const next=[head,...(eats?body:body.slice(0,-1))],fraction=Math.min(1,steps-i);body=fraction===1?next:blendBodies(body,next,fraction);
 }
 return body;
}
export function sampledSnake(history:SnakeSnapshot[],id:string,clock:number,speed:number,horizon=650){
 if(!history.length)return[];let a=history[0];
 for(let i=1;i<history.length;i++){const b=history[i];if(clock<=b.at){const wa=a.game.worms.find(w=>w.id===id),wb=b.game.worms.find(w=>w.id===id);if(!wb)return[];if(!wa||!wa.alive||!wb.alive||wa.deathAt!==wb.deathAt||wa.protectedUntil!==wb.protectedUntil||Math.hypot((wa.body[0]?.x||0)-(wb.body[0]?.x||0),(wa.body[0]?.y||0)-(wb.body[0]?.y||0))>6)return wb.body;return blendBodies(wa.body,wb.body,Math.max(0,Math.min(1,(clock-a.at)/Math.max(1,b.at-a.at))))}a=b}
 const w=a.game.worms.find(w=>w.id===id);return w?predictSnake(a.game,w,Math.min(clock,a.at+horizon),speed):[];
}
export function snakeBuffer(rtt:number){return Math.min(170,Math.max(85,45+Math.max(0,rtt)*.35))}
export function snakeHorizon(rtt:number,speed:number){return Math.min(1500,Math.max(650,speed*3,Math.max(0,rtt)*1.7+200))}
