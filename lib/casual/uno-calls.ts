import {CasualError} from './error.ts';
import type {UnoGame} from './uno.ts';
/** Calls are out-of-turn actions; bind them to the displayed window, not the next seat's turn. */
export function unoCall(g:UnoGame,a:Record<string,any>,id:string,draw:(id:string,count:number)=>unknown,announce:(text:string)=>void,name:(id:string)=>string){
 if(a.action!=='call-uno'&&a.action!=='catch-uno')return false;
 const w=g.unoWindow;
 if(!w||a.unoTurn!==undefined&&a.unoTurn!==w.turn||g.hands[w.playerId]?.length!==1)throw new CasualError('The UNO call window has closed.',409);
 if(a.action==='call-uno'){
  if(w.playerId!==id)throw new CasualError('Only that player can call UNO.',403);
  announce(name(id)+' calls UNO!');
 }else{
  if(w.playerId!==a.playerId||w.playerId===id)throw new CasualError('That UNO catch window has closed.',409);
  draw(w.playerId,2);announce(name(id)+' caught '+name(w.playerId)+' without UNO: draw two.');
 }
 g.unoWindow=null;return true;
}
