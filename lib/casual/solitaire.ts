import type {CasualState} from './engine.ts';
import {CasualError} from './error.ts';
import {finishBattle} from './hidden-battle.ts';

export const SOLITAIRE_VARIANTS=['klondike','klondike-three','freecell','spider-one','spider-two','spider-four','pyramid','tripeaks'] as const;
export type SolitaireVariant=typeof SOLITAIRE_VARIANTS[number];
export const SOLITAIRE_NAMES:Record<SolitaireVariant,string>={klondike:'Classic · draw one','klondike-three':'Klondike · draw three',freecell:'FreeCell','spider-one':'Spider · one suit','spider-two':'Spider · two suits','spider-four':'Spider · four suits',pyramid:'Pyramid · relaxed',tripeaks:'TriPeaks'};
export type SolPlace={zone:'tableau'|'waste'|'foundation'|'cell';index:number;offset?:number};
export type SolMove={from:SolPlace;to:SolPlace};
type SolPosition={columns:number[][];stock:number[];waste:number[];foundations:number[][];cells:(number|null)[];removed:number;passes:number};
export type SolBoard=SolPosition&{version:number;moves:number;status:'playing'|'won'|'stuck'|'conceded';history:SolPosition[]};
export type SolitaireGame={kind:'solitaire';variant:SolitaireVariant;currentId:string;turn:number;deadline:number;startedAt:number;deal:number[];boards:Record<string,SolBoard>;scores:Record<string,number>};
export const solRank=(card:number)=>(Math.abs(card)-1)%13+1;
export function solSuit(card:number,variant:SolitaireVariant){const suits=variant==='spider-one'?1:variant==='spider-two'?2:4;return Math.floor((Math.abs(card)-1)/13)%suits}
export const solRed=(card:number,v:SolitaireVariant)=>solSuit(card,v)===1||solSuit(card,v)===2;
export const solSpider=(v:SolitaireVariant)=>v.startsWith('spider-');
export function solCovers(index:number,variant:SolitaireVariant):number[]{
 if(variant==='pyramid'){let row=0;while((row+1)*(row+2)/2<=index)row++;if(row===6)return[];const col=index-row*(row+1)/2,start=(row+1)*(row+2)/2;return[start+col,start+col+1]}
 if(variant==='tripeaks'){if(index<3)return[3+index*2,4+index*2];if(index<9){const i=index-3,start=9+i+Math.floor(i/2);return[start,start+1]}if(index<18)return[index+9,index+10]}
 return[];
}
export function solExposed(b:Pick<SolBoard,'columns'>,index:number,v:SolitaireVariant){return !!b.columns[index]?.length&&solCovers(index,v).every(i=>!b.columns[i]?.length)}
function position(b:SolPosition):SolPosition{return{columns:b.columns.map(p=>[...p]),stock:[...b.stock],waste:[...b.waste],foundations:b.foundations.map(p=>[...p]),cells:[...b.cells],removed:b.removed,passes:b.passes}}
export function dealSolitaire(deal:number[],variant:SolitaireVariant):SolBoard{
 const stock=[...deal],columns:number[][]=[],b:SolBoard={columns,stock,waste:[],foundations:Array.from({length:4},()=>[]),cells:Array(4).fill(null),removed:0,passes:1,moves:0,version:0,status:'playing',history:[]};
 if(variant==='freecell'){for(let i=0;i<8;i++)columns.push([]);while(stock.length)for(const col of columns)if(stock.length)col.push(stock.pop()!)}
 else if(solSpider(variant)){for(let i=0;i<10;i++){const col=Array.from({length:i<4?6:5},()=>-stock.pop()!);col[col.length-1]*=-1;columns.push(col)}}
 else if(variant==='pyramid'||variant==='tripeaks'){for(let i=0;i<28;i++)columns.push([stock.pop()!*(variant==='tripeaks'&&i<18?-1:1)]);if(variant==='tripeaks')b.waste.push(stock.pop()!)}
 else for(let i=1;i<=7;i++){const col=Array.from({length:i},()=>-stock.pop()!);col[i-1]*=-1;columns.push(col)}
 return b;
}
export function newSolitaire(s:CasualState,now:number):SolitaireGame{
 const variant=s.settings.solitaireVariant||'klondike',deal=Array.from({length:solSpider(variant)?104:52},(_,i)=>i+1);
 for(let i=deal.length-1;i>0;i--){let x=s.random||1;x^=x<<13;x^=x>>>17;x^=x<<5;s.random=x>>>0;const j=Math.floor(s.random/4294967296*(i+1));[deal[i],deal[j]]=[deal[j],deal[i]]}
 const players=s.players.filter(p=>!p.retired&&p.role!=='spectator');return{kind:'solitaire',variant,deal,boards:Object.fromEntries(players.map(p=>[p.id,dealSolitaire(deal,variant)])),scores:Object.fromEntries(players.map(p=>[p.id,0])),currentId:players[0].id,turn:1,startedAt:now,deadline:players.length>1?now+(s.settings.roundSeconds||600)*1000:Number.MAX_SAFE_INTEGER};
}
export function solCards(b:SolPosition,ref:SolPlace){
 const pile=ref.zone==='tableau'?b.columns[ref.index]:ref.zone==='foundation'?b.foundations[ref.index]:ref.zone==='waste'?ref.index===0?b.waste:undefined:ref.zone==='cell'&&ref.index<4?[b.cells[ref.index]].filter((v):v is number=>v!==null):undefined;
 if(!pile?.length)return[];const offset=ref.zone==='tableau'?(ref.offset??pile.length-1):pile.length-1;return offset>=0&&offset<pile.length?pile.slice(offset):[];
}
function run(cards:number[],v:SolitaireVariant){return !!cards.length&&cards.every((c,i)=>c>0&&(!i||solRank(cards[i-1])===solRank(c)+1&&(solSpider(v)?solSuit(cards[i-1],v)===solSuit(c,v):solRed(cards[i-1],v)!==solRed(c,v))))}
export function canSolMove(b:SolPosition,variant:SolitaireVariant,{from,to}:SolMove){
 if(['pyramid','tripeaks'].includes(variant)||from.zone===to.zone&&from.index===to.index)return false;
 const cards=solCards(b,from);if(!run(cards,variant))return false;
 if(from.zone==='foundation'&&(variant==='freecell'||solSpider(variant)))return false;
 if(to.zone==='foundation')return !solSpider(variant)&&cards.length===1&&to.index>=0&&to.index<4&&solSuit(cards[0],variant)===to.index&&solRank(cards[0])===b.foundations[to.index].length+1;
 if(to.zone==='cell')return variant==='freecell'&&cards.length===1&&to.index>=0&&to.index<4&&b.cells[to.index]===null;
 if(to.zone!=='tableau'||!b.columns[to.index])return false;
 const dest=b.columns[to.index],top=dest.at(-1);
 if(variant==='freecell'&&cards.length>1){const cells=b.cells.filter(v=>v===null).length,empty=b.columns.filter((p,i)=>!p.length&&i!==to.index).length;if(cards.length>(cells+1)*2**empty)return false}
 return top?top>0&&solRank(top)===solRank(cards[0])+1&&(solSpider(variant)||solRed(top,variant)!==solRed(cards[0],variant)):variant==='freecell'||solSpider(variant)||solRank(cards[0])===13;
}
export function legalSolitaireMoves(b:SolPosition,v:SolitaireVariant,limit=80){
 const moves:SolMove[]=[],sources:SolPlace[]=[];
 for(let i=0;i<b.columns.length;i++)for(let j=0;j<b.columns[i].length;j++)if(b.columns[i][j]>0)sources.push({zone:'tableau',index:i,offset:j});
 if(b.waste.length)sources.push({zone:'waste',index:0});if(v==='freecell')for(let i=0;i<4;i++)if(b.cells[i]!==null)sources.push({zone:'cell',index:i});
 const targets:SolPlace[]=[...Array.from({length:4},(_,index)=>({zone:'foundation' as const,index})),...b.columns.map((_,index)=>({zone:'tableau' as const,index})),...(v==='freecell'?Array.from({length:4},(_,index)=>({zone:'cell' as const,index})):[])];
 for(const from of sources)for(const to of targets)if(canSolMove(b,v,{from,to})){moves.push({from,to});if(moves.length>=limit)return moves}return moves;
}
function removeSource(b:SolPosition,ref:SolPlace,count=1){if(ref.zone==='tableau')b.columns[ref.index].splice(b.columns[ref.index].length-count,count);else if(ref.zone==='foundation')b.foundations[ref.index].pop();else if(ref.zone==='waste')b.waste.pop();else b.cells[ref.index]=null}
function reveal(b:SolBoard,v:SolitaireVariant){
 if(v==='tripeaks')for(let i=0;i<28;i++){if(solExposed(b,i,v)&&b.columns[i][0]<0)b.columns[i][0]*=-1}
 else for(const col of b.columns)if(col.at(-1)!<0)col[col.length-1]*=-1;
 if(solSpider(v))for(const col of b.columns){const tail=col.slice(-13);if(tail.length===13&&solRank(tail[0])===13&&run(tail,v)){col.splice(-13);b.removed+=13;if(col.at(-1)!<0)col[col.length-1]*=-1}}
}
function canDraw(b:SolPosition,v:SolitaireVariant){return v!=='freecell'&&(!!b.stock.length&&(!solSpider(v)||b.columns.every(p=>p.length>0))||!b.stock.length&&!!b.waste.length&&(v==='pyramid'?b.passes<3:v.startsWith('klondike')))}
export const solCanDraw=canDraw;
export function solPairOptions(b:SolPosition,v:SolitaireVariant):SolPlace[][]{
 const candidates:SolPlace[]=b.columns.map((_,index)=>({zone:'tableau' as const,index})).filter(p=>solExposed(b,p.index,v));if(v==='pyramid'&&b.waste.length)candidates.push({zone:'waste',index:0});
 if(v==='tripeaks')return candidates.filter(p=>{const a=solRank(solCards(b,p)[0]),z=solRank(b.waste.at(-1)!);return Math.abs(a-z)===1||Math.abs(a-z)===12}).map(p=>[p]);
 const pairs:SolPlace[][]=[];for(let i=0;i<candidates.length;i++){const a=candidates[i],rank=solRank(solCards(b,a)[0]);if(rank===13)pairs.push([a]);else for(let j=i+1;j<candidates.length;j++)if(rank+solRank(solCards(b,candidates[j])[0])===13)pairs.push([a,candidates[j]])}return pairs;
}
export function solitaireProgress(b:SolPosition,v:SolitaireVariant){return v==='pyramid'||v==='tripeaks'?b.columns.filter(p=>!p.length).length:solSpider(v)?b.removed:b.foundations.reduce((n,p)=>n+p.length,0)}
function settle(s:CasualState,id:string,now:number){
 const g=s.game as SolitaireGame,b=g.boards[id],progress=solitaireProgress(b,g.variant),target=['pyramid','tripeaks'].includes(g.variant)?28:solSpider(g.variant)?104:52;g.scores[id]=progress*10;
 if(progress===target){b.status='won';finishBattle(s,[id],s.players.find(p=>p.id===id)?.name+' completed '+SOLITAIRE_NAMES[g.variant]+'.',now);return}
 if(['pyramid','tripeaks'].includes(g.variant)&&!canDraw(b,g.variant)&&!solPairOptions(b,g.variant).length)b.status='stuck';
 const remaining=s.players.filter(p=>!p.retired&&p.role!=='spectator'&&g.boards[p.id]);if(remaining.length===1&&b.status==='stuck')return;if(remaining.every(p=>g.boards[p.id].status!=='playing')){const best=Math.max(...remaining.map(p=>g.scores[p.id]||0));finishBattle(s,remaining.length>1?remaining.filter(p=>g.scores[p.id]===best).map(p=>p.id):[],remaining.length>1?'Every board finished. Most cleared cards wins.':'This deal ended. Choose a new deal from the lobby.',now)}
}
export function solitaireAction(s:CasualState,a:Record<string,unknown>,id:string,now:number){
 const g=s.game as SolitaireGame,b=g.boards[id];if(!b)throw new CasualError('Watch this board without moving its cards.',403);
 if(a.boardVersion!==b.version)throw new CasualError('The board changed. Select your card again.',409);
 if(a.action==='sol-restart'){g.boards[id]={...dealSolitaire(g.deal,g.variant),version:b.version+1};g.scores[id]=0;g.turn++;return}
 if(a.action==='sol-concede'){b.status='conceded';b.version++;settle(s,id,now);return}
 if(a.action==='sol-undo'){const previous=b.history.pop();if(!previous)throw new CasualError('No move to undo.');Object.assign(b,position(previous));b.status='playing';b.moves++;b.version++;g.turn++;settle(s,id,now);return}
 if(b.status!=='playing')throw new CasualError('This board has finished.',409);
 const before=position(b);
 if(a.action==='sol-move'){
  const move={from:a.from as SolPlace,to:a.to as SolPlace};if(!canSolMove(b,g.variant,move))throw new CasualError('That card sequence cannot move there.');const cards=solCards(b,move.from);removeSource(b,move.from,cards.length);const target=move.to;
  if(target.zone==='cell')b.cells[target.index]=cards[0];else(target.zone==='tableau'?b.columns[target.index]:b.foundations[target.index]).push(...cards);
 }else if(a.action==='sol-draw'){
  if(!canDraw(b,g.variant))throw new CasualError(solSpider(g.variant)?'Fill every empty column before dealing.':'No cards left to draw.');
  if(!b.stock.length){b.stock=b.waste.reverse();b.waste=[];b.passes++}
  else if(solSpider(g.variant)){for(const col of b.columns)col.push(b.stock.pop()!)}else for(let i=0;i<(g.variant==='klondike-three'?3:1)&&b.stock.length;i++)b.waste.push(b.stock.pop()!);
 }else if(a.action==='sol-remove'){
  if(g.variant!=='pyramid'&&g.variant!=='tripeaks')throw new CasualError('Remove pairs only in Pyramid or single cards in TriPeaks.');
  const cards=a.cards as SolPlace[];const valid=solPairOptions(b,g.variant).some(pair=>pair.length===cards.length&&pair.every(ref=>cards.some(c=>c.zone===ref.zone&&c.index===ref.index)));
  if(!valid)throw new CasualError(g.variant==='tripeaks'?'Choose an uncovered card one rank away.':'Choose uncovered cards totaling thirteen.');
  const last=solCards(b,cards[0])[0];for(const ref of cards)removeSource(b,ref);if(g.variant==='tripeaks')b.waste.push(last);b.removed+=cards.length;
 }else throw new CasualError('Choose a Solitaire action.');
 b.history.push(before);if(b.history.length>12)b.history.shift();b.moves++;b.version++;g.turn++;reveal(b,g.variant);settle(s,id,now);
}
export function advanceSolitaire(s:CasualState,now:number){const g=s.game as SolitaireGame;if(now<g.deadline)return false;const players=s.players.filter(p=>!p.retired&&p.role!=='spectator'),best=Math.max(...players.map(p=>g.scores[p.id]||0));finishBattle(s,players.filter(p=>(g.scores[p.id]||0)===best).map(p=>p.id),'Time. Most cleared cards wins; ties share the win.',now);return true}
export function publicSolitaire(g:SolitaireGame,id:string){return{kind:g.kind,variant:g.variant,currentId:g.currentId,turn:g.turn,deadline:g.deadline,startedAt:g.startedAt,scores:g.scores,boards:Object.fromEntries(Object.entries(g.boards).map(([owner,b])=>[owner,{...position(b),columns:b.columns.map(p=>p.map(c=>c<0?0:c)),stock:b.stock.map(()=>0),version:b.version,moves:b.moves,status:b.status,undoCount:owner===id?b.history.length:0}]))}}
export function chooseSolitaireMove(g:ReturnType<typeof publicSolitaire>,id:string):Record<string,unknown>|null{
 const b=g.boards[id];if(!b||b.status!=='playing')return null;const base={boardVersion:b.version};
 if(b.moves>=600)return{action:'sol-concede',...base};
 if(g.variant==='pyramid'||g.variant==='tripeaks'){const options=solPairOptions(b,g.variant);if(options.length)return{action:'sol-remove',cards:options[0],...base}}
 else{const moves=legalSolitaireMoves(b,g.variant);const best=moves.find(m=>m.to.zone==='foundation')||moves.find(m=>m.from.zone==='tableau'&&m.from.offset!>0&&b.columns[m.from.index][m.from.offset!-1]===0)||moves.find(m=>m.from.zone==='waste')||moves.find(m=>m.to.zone==='tableau'&&b.columns[m.to.index].length>0&&m.from.zone!=='cell');if(best)return{action:'sol-move',...best,...base}}
 return canDraw(b,g.variant)?{action:'sol-draw',...base}:{action:'sol-concede',...base};
}
