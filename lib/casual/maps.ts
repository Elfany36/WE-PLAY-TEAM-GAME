export const SNAKE_STARTS:[number,number,'up'|'down'|'left'|'right'][]=[[4,4,'right'],[27,4,'down'],[27,27,'left'],[4,27,'up'],[15,3,'down'],[28,15,'left'],[16,28,'up'],[3,16,'right']];
export const SNAKE_MAP_IDS=['classic','ruins','crossroads','islands','switchback','neon','citadel','orbit'] as const;
export type SnakeMapId=typeof SNAKE_MAP_IDS[number];
const delta={up:[0,-1],right:[1,0],down:[0,1],left:[-1,0]};
const safe=new Set<string>();for(const[x,y,d]of SNAKE_STARTS){const[dx,dy]=delta[d];for(let i=-2;i<=5;i++)for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++)safe.add((x+dx*i+a)+','+(y+dy*i+b));}
function baseObstacles(id:SnakeMapId){const cells=new Map<string,{x:number;y:number}>();const add=(x:number,y:number)=>{if(!safe.has(x+','+y))cells.set(x+','+y,{x,y})};const rect=(x:number,y:number,w:number,h:number)=>{for(let a=x;a<x+w;a++)for(let b=y;b<y+h;b++)add(a,b)};
 if(id==='ruins'){for(const[x,y]of [[9,9],[21,9],[9,21],[21,21]])rect(x,y,3,3)}
 if(id==='crossroads'){rect(15,8,2,5);rect(15,19,2,5);rect(8,15,5,2);rect(19,15,5,2)}
 if(id==='islands'){for(const[x,y]of [[10,10],[21,10],[10,21],[21,21],[15,15]])for(let a=-2;a<=2;a++)for(let b=-2;b<=2;b++)if(Math.abs(a)+Math.abs(b)<=2)add(x+a,y+b)}
 if(id==='switchback'){rect(8,10,12,1);rect(13,16,11,1);rect(8,22,12,1);rect(8,11,1,3);rect(23,17,1,3)}
 if(id==='neon'){for(const[x,y]of [[8,8],[22,8],[8,22],[22,22]])rect(x,y,2,2);rect(12,12,3,1);rect(18,12,2,1);rect(12,19,2,1);rect(17,19,3,1);rect(12,13,1,3);rect(19,16,1,3)}
 if(id==='citadel'){for(const [x,y,w,h]of [[9,8,5,1],[18,8,5,1],[8,9,1,5],[23,9,1,5],[8,18,1,5],[23,18,1,5],[9,23,5,1],[18,23,5,1],[14,14,4,1],[14,17,4,1]])rect(x,y,w,h)}
 if(id==='orbit'){for(let i=0;i<32;i++){const a=i/32*Math.PI*2;if(i%8<3)continue;add(Math.round(15.5+Math.cos(a)*7),Math.round(15.5+Math.sin(a)*7))}for(const [x,y]of [[7,7],[23,7],[7,23],[23,23]])rect(x,y,2,2)}
 return [...cells.values()];
}
export const SNAKE_MAPS=SNAKE_MAP_IDS.map((id,i)=>({id,name:['Classic Orchard','Garden Ruins','Crossroads','Pebble Islands','Switchback Valley','Neon Circuit','Jade Citadel','Orbital Garden'][i],description:['Open space. Pure survival.','Ancient stone islands, wide paths.','Four walls. One central meeting point.','Five islands with routes between them.','Broken lanes and sharp decisions.','Midnight pillars and glowing gates.','Broken castle walls with four open gates.','An open ring with wide radial crossings.'][i],ground:[['#d3e1bc','#bbd1a8'],['#cedbc7','#b1c7ad'],['#eddbb5','#d9bd90'],['#b8ded1','#94c7bb'],['#d1ccdf','#b4b6cf'],['#162f43','#203b51'],['#c2dfcf','#9bc5b4'],['#252846','#32385c']][i],wall:['#537332','#63715c','#ae7953','#4c8f88','#71658d','#5f6ed7','#4e8079','#ad87d4'][i],accent:['#6c64fa','#336d5a','#b84840','#644ed4','#c14e7e','#6af0ce','#9558cf','#7bf4de'][i],obstacles:baseObstacles(id)}));
export const SNAKE_SIZES=[32,48,64] as const;
export type SnakeSize=typeof SNAKE_SIZES[number];
export function snakeStarts(size=48){return SNAKE_STARTS.map(([x,y,d])=>[Math.round(x*(size-1)/31),Math.round(y*(size-1)/31),d] as [number,number,typeof d])}
const cache=new Map<string,typeof SNAKE_MAPS[number]&{size:number}>();
export function snakeMap(id:unknown,size=48){size=SNAKE_SIZES.includes(size as SnakeSize)?size:48;const base=SNAKE_MAPS.find(m=>m.id===id)||SNAKE_MAPS[0],key=base.id+':'+size;const old=cache.get(key);if(old)return old;const cells=new Map<string,{x:number;y:number}>();for(const p of base.obstacles){const x0=Math.floor(p.x*size/32),x1=Math.floor((p.x+1)*size/32),y0=Math.floor(p.y*size/32),y1=Math.floor((p.y+1)*size/32);for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)cells.set(x+','+y,{x,y})}const safe=new Set<string>();for(const[x,y,d]of snakeStarts(size)){const[dx,dy]=delta[d];for(let i=-4;i<=6;i++)for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++)safe.add((x+dx*i+a)+','+(y+dy*i+b))}const result={...base,size,obstacles:[...cells.values()].filter(p=>!safe.has(p.x+','+p.y))};cache.set(key,result);return result}
/** Only exposed edges: neighboring wall cells share a single painted surface. */
export function wallEdges(cells:{x:number;y:number}[]){const set=new Set(cells.map(p=>p.x+','+p.y)),edges:number[][]=[];for(const{x,y}of cells){if(!set.has(x+','+(y-1)))edges.push([x,y,x+1,y]);if(!set.has((x+1)+','+y))edges.push([x+1,y,x+1,y+1]);if(!set.has(x+','+(y+1)))edges.push([x+1,y+1,x,y+1]);if(!set.has((x-1)+','+y))edges.push([x,y+1,x,y])}return edges}
