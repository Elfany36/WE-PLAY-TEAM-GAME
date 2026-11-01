import type {BoardPiece,StrategyGame} from './strategy.ts';
import {squareName,squarePoint} from './strategy.ts';
export function strategyMotionPath(piece:BoardPiece,move:StrategyGame['lastMove'],mover?:BoardPiece){
 if(!move)return null;if(move.pieceId===piece.id)return move.path;
 if(mover?.type!=='k'||mover.owner!==piece.owner||piece.type!=='r'||move.path.length!==2)return null;
 const from=squarePoint(move.path[0]),to=squarePoint(move.path[1]);if(from.y!==to.y||Math.abs(from.x-to.x)!==2||piece.y!==to.y||piece.x!==(to.x>from.x?5:3))return null;
 return[squareName(to.x>from.x?7:0,to.y),squareName(piece.x,piece.y)];
}
export function strategyMotionTiming(at:number,serverNow:number,length:number,rtt=0){const duration=Math.min(680,Math.max(320,(length-1)*170)),age=Math.max(0,serverNow-at+Math.min(400,Math.max(0,rtt)/2));return{duration,age,complete:age>=duration}}
