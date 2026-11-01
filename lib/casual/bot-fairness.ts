export type Recall={known:Record<number,{key:number;at:number}>};
export type FairBrain={rng?:number;memories?:Record<string,Recall>;visible?:string;reactionAt?:Record<string,number>};
/** Private AI randomness never consumes the game's dice, deck or item stream. */
export function botRandom(brain:FairBrain){let x=brain.rng??0x61c88647;x^=x<<13;x^=x>>>17;x^=x<<5;brain.rng=x>>>0;return brain.rng/4294967296}
export function observeCards(brain:FairBrain,bots:string[],deck:{key:number;matchedBy:string|null}[],revealed:number[],now:number){
 const visible=revealed.filter(i=>!deck[i]?.matchedBy),signature=visible.join(',');brain.memories??={};
 for(const id of bots){const recall=brain.memories[id]??={known:{}};
  for(const index of Object.keys(recall.known).map(Number))if(deck[index]?.matchedBy||now-recall.known[index].at>30000)delete recall.known[index];
  if(signature!==brain.visible){for(const index of visible)if(botRandom(brain)<.82)recall.known[index]={key:deck[index].key,at:now};
   const entries=Object.keys(recall.known).map(Number).sort((a,b)=>recall.known[a].at-recall.known[b].at);while(entries.length>16)delete recall.known[entries.shift()!];
  }
 }
 brain.visible=signature;
}
export function recallCard(brain:FairBrain,id:string,deck:{matchedBy:string|null}[],revealed:number[],now:number){
 const recall=brain.memories?.[id]?.known??{},available=deck.map((_,i)=>i).filter(i=>!deck[i].matchedBy&&!revealed.includes(i));
 // Recall reliability falls with age. A forgotten face may be learned again later.
 const known:Record<number,number>={};for(const [index,value]of Object.entries(recall)){if(botRandom(brain)<Math.max(.15,1-(now-value.at)/35000))known[Number(index)]=value.key}
 if(botRandom(brain)<.88){if(revealed.length){const key=known[revealed[0]],pair=available.find(i=>key!==undefined&&known[i]===key);if(pair!==undefined)return pair}else{const pairs=available.filter(i=>known[i]!==undefined&&available.some(j=>i!==j&&known[i]===known[j]));if(pairs.length)return pairs[Math.floor(botRandom(brain)*pairs.length)]}}
 const unknown=available.filter(i=>known[i]===undefined),choices=unknown.length?unknown:available;return choices[Math.floor(botRandom(brain)*choices.length)];
}
