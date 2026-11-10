import {applyBlockMove,stepBlocks,type BlocksGame,type BlockMove} from './blocks.ts';
export type PendingBlockMove={seq:number;move:BlockMove;at:number;pieceSerial?:number};
/** Gravity can approach the floor, but only authority or an explicit drop commits a stack. */
export function predictBlocks(m:BlocksGame,id:string,pending:PendingBlockMove[],now:number,limit:number){
 const applyUntil=(at:number)=>{const b=m.boards.find(b=>b.id===id);if(!b)return;for(const p of pending)if(p.seq>b.seq&&p.at<=at){b.seq=p.seq;if(p.pieceSerial===undefined||p.pieceSerial===(b.pieceSerial||0))applyBlockMove(m,b,p.move,Math.max(p.at,m.lastTickAt))}};
 while(m.lastTickAt+50<=Math.min(now,limit)){applyUntil(m.lastTickAt+50);m.lastTickAt+=50;stepBlocks(m,m.lastTickAt,false)}applyUntil(now);
 return m;
}
