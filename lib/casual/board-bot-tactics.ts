import {Chess} from 'chess.js';
import {botProfile,botRandom,type FairBrain} from './bot-fairness.ts';
import {strategyMoves,damaMoves,captureCalculation,squarePoint,type StrategyGame,type BoardMove} from './strategy.ts';
import {unoPlayable,unoValue,type UnoGame,type UnoColor} from './uno.ts';
import type {CasualState} from './engine.ts';
const value:Record<string,number>={p:100,n:320,b:330,r:500,q:900,k:20000,man:100};

export function chooseUnoMove(s:CasualState,g:UnoGame,id:string){
 if(g.currentId!==id)return null;
 const brain=s.ai!,profile=botProfile(brain,id),hand=g.hands[id],colors:UnoColor[]=g.variant==='flip'&&g.flipSide&&!g.sameColors?['pink','orange','teal','purple']:['red','yellow','green','blue'];
 const color=colors.map(color=>({color,score:hand.filter(c=>c.color===color).reduce((n,c)=>n+1+unoValue(c)/50,0)+botRandom(brain)*.4})).sort((a,b)=>b.score-a.score)[0].color;
 if(g.initialWild)return{action:'choose-uno-color',color};
 // Challenge evidence is private to its owner; bots never inspect that evidence.
 if(g.pending)return{action:profile.style==='attacker'&&botRandom(brain)<.14?'challenge-four':'accept-four'};
 const order=s.players.filter(p=>!p.retired),next=order[(order.findIndex(p=>p.id===id)+g.direction+order.length)%order.length],pressure=(g.hands[next?.id]?.length??7)<=2;
 const legal=hand.filter(c=>unoPlayable(c,g)&&(!g.drawnId||c.id===g.drawnId)&&(!['wild4','wild2','wildcolor'].includes(c.face)||!hand.some(other=>other.id!==c.id&&(other.color===g.color||g.variant==='flip'&&!other.color))));
 const ranked=legal.map(card=>({card,score:unoValue(card)*.6+(card.color===color?12:0)+(!card.color&&hand.length>3?-22:0)+(['skip','draw2','draw5','reverse','skipall'].includes(card.face)?(pressure?35:profile.style==='attacker'?12:0):0)+botRandom(brain)*(profile.style==='explorer'?12:6)})).sort((a,b)=>b.score-a.score);
 const card=ranked[0]?.card;
 return card?{action:'play-uno',cardId:card.id,...(!card.color?{color}:{}),callUno:true}:{action:g.drawnId?'pass-uno':'draw-uno'};
}

/** At most eight public positions and their legal replies; no unbounded search. */
export function chooseBoardMove(g:StrategyGame,brain:FairBrain){
 const profile=botProfile(brain,g.currentId),moves=strategyMoves(g);
 const score=(m:BoardMove)=>{
  const to=squarePoint(m.to),from=squarePoint(m.from),piece=g.pieces.find(p=>p.owner===g.currentId&&p.x===from.x&&p.y===from.y)!;
  if(g.kind==='scidama'){
   let delta=0;for(let i=0;i<m.captures.length;i++){const victim=g.pieces.find(p=>p.id===m.captures[i])!;delta-=victim.value*(victim.king?2:1)+captureCalculation(piece,victim,m.path[i+1]).points}
   if(!piece.king&&to.y===(piece.owner===g.whiteId?0:7))delta-=piece.value;
   return delta;
  }
  let points=m.captures.reduce((n,id)=>{const at=squarePoint(id),p=g.pieces.find(p=>p.id===id||p.owner!==g.currentId&&p.x===at.x&&p.y===at.y);return n+(p?(value[p.type]||100)*(p.king?2:1):100)},0);
  points+=(m.promotion?value[m.promotion]-100:0)+(3.5-Math.abs(to.x-3.5))*5+(3.5-Math.abs(to.y-3.5))*3;
  if(g.kind==='chess'){
   if(m.san?.endsWith('#'))return 100000;
   if(m.san?.includes('+'))points+=profile.style==='attacker'?22:10;
   if(m.san?.startsWith('O-O'))points+=35;
   if(['n','b'].includes(piece.type)&&(piece.owner===g.whiteId?from.y===7:from.y===0))points+=25;
   if(piece.type==='q'&&g.turn<8)points-=15;
  }else{
   if(!piece.king&&to.y===(piece.owner===g.whiteId?0:7))points+=180;
   if(profile.style==='guardian'&&(to.x===0||to.x===7))points+=8;
  }
  return points;
 };
 const ranked=moves.map(move=>({move,score:score(move)+botRandom(brain)*3})).sort((a,b)=>b.score-a.score).slice(0,8);
 for(const candidate of ranked){
  if(g.kind==='chess'&&candidate.score<90000){
   const c=new Chess(g.fen);c.move({from:candidate.move.from,to:candidate.move.to,promotion:candidate.move.promotion});
   const replies=c.moves({verbose:true});
   if(!replies.length&&!c.isCheck())candidate.score-=300;
   const threat=Math.max(0,...replies.map(r=>r.san.endsWith('#')?100000:r.captured?(value[r.captured]||100)+(r.promotion?700:0):0));
   candidate.score-=threat*(profile.style==='guardian'?1.05:.72+profile.risk*.2);
  }else if(g.kind==='dama'){
   const moved=structuredClone(g),from=squarePoint(candidate.move.from),to=squarePoint(candidate.move.to),piece=moved.pieces.find(p=>p.owner===g.currentId&&p.x===from.x&&p.y===from.y)!;
   moved.pieces=moved.pieces.filter(p=>!candidate.move.captures.includes(p.id));Object.assign(piece,to);piece.king||=to.y===(piece.owner===g.whiteId?0:7);moved.currentId=g.currentId===g.whiteId?g.blackId:g.whiteId;
   const replies=damaMoves(moved),threat=Math.max(0,...replies.map(m=>m.captures.reduce((n,id)=>n+(moved.pieces.find(p=>p.id===id)?.king?200:100),0)));
   candidate.score-=threat*(.7+profile.risk*.25);
  }
 }
 ranked.sort((a,b)=>b.score-a.score);
 const margin=g.kind==='scidama'?1:profile.style==='explorer'?14:7,choices=ranked.filter(c=>c.score>=ranked[0].score-margin),move=choices[Math.floor(botRandom(brain)*choices.length)]?.move;
 return move?{action:'move-board',from:move.from,to:move.to,path:move.path,...(move.promotion?{promotion:move.promotion}:{})}:null;
}
