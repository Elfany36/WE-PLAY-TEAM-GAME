import {botRandom,type FairBrain} from './bot-fairness.ts';
import {generalAdjacent,type publicGenerals} from './generals.ts';
import type {publicFleet} from './fleet.ts';

/** Decisions accept only the same private projection available to this human seat. */
export function chooseGeneralMove(g:ReturnType<typeof publicGenerals>,id:string,brain:FairBrain){
 if(g.stage==='deploy')return !g.ready[id]?{action:'deploy-generals'}:null;
 if(g.currentId!==id||!g.legalMoves.length)return null;
 const own=g.pieces.filter(p=>p.owner===id),enemy=g.pieces.filter(p=>p.owner!==id),north=g.ids[0]===id;
 const scored=g.legalMoves.map(move=>{const piece=own.find(p=>p.square===move.from)!,capture=enemy.some(p=>p.square===move.to),advance=(Math.floor(move.from/9)-Math.floor(move.to/9))*(north?1:-1),danger=enemy.filter(p=>generalAdjacent(p.square,move.to)).length;return{move,score:(capture?(piece.rank===0?-20:5):0)+advance*(piece.rank===0?3:1.5)-danger*(piece.rank===0?5:.2)+botRandom(brain)*3}}).sort((a,b)=>b.score-a.score);
 return{action:'move-generals',...scored[0].move};
}
export function chooseFleetShot(g:ReturnType<typeof publicFleet>,id:string,brain:FairBrain){
 if(g.stage==='deploy')return !g.ready[id]?{action:'deploy-fleet'}:null;
 if(g.currentId!==id)return null;
 const shots=g.shots.filter(s=>s.by===id),tried=new Set(shots.map(s=>s.cell)),other=g.ids.find(p=>p!==id)!,destroyed=new Set(g.fleets[other].flatMap(p=>p.hits)),hits=shots.filter(s=>s.hit&&!destroyed.has(s.cell)),candidates:{cell:number;score:number}[]=[];
 for(let cell=0;cell<g.size*g.size;cell++)if(!tried.has(cell)){const neighbors=hits.filter(s=>Math.abs(s.cell%g.size-cell%g.size)+Math.abs(Math.floor(s.cell/g.size)-Math.floor(cell/g.size))===1).length;candidates.push({cell,score:neighbors*10+((cell%g.size+Math.floor(cell/g.size))%2===0?1:0)+botRandom(brain)})}
 candidates.sort((a,b)=>b.score-a.score);return candidates.length?{action:'fire-fleet',cell:candidates[0].cell}:null;
}
