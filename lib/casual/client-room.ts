import type {CasualPublic} from './engine.ts';
export function sameGameView(a:CasualPublic,b:CasualPublic){return a.code===b.code&&a.round===b.round&&a.phase===b.phase&&a.youId===b.youId&&a.viewingId===b.viewingId&&a.isHost===b.isHost&&a.game===b.game&&a.players===b.players}
export function roomScene(room:CasualPublic|null){return room?.mode==='snake'&&room.game?.obstacles?room.code+':'+room.round+':'+room.game.mapId+':'+room.game.size:undefined}
/** Reuse terrain only for the exact world revision acknowledged by the server. */
export function restoreRoomTerrain(previous:CasualPublic|null,next:CasualPublic):CasualPublic|null{
 if(next.mode==='snake'&&next.game&&!next.game.obstacles){
  if(previous?.code===next.code&&previous.round===next.round&&previous.mode===next.mode&&previous.game?.mapId===next.game.mapId&&previous.game?.size===next.game.size&&previous.game.obstacles)return{...next,game:{...next.game,obstacles:previous.game.obstacles}};
  return null;
 }
 if(next.mode!=='terra'||!next.game||next.game.tiles)return next;
 if(previous?.code===next.code&&previous.round===next.round&&previous.game?.version===next.game.version&&previous.game.tiles)return{...next,game:{...next.game,tiles:previous.game.tiles}};
 return null;
}

/** Keep stable UI metadata out of the rendering work caused by world movement. */
export function shareRoomMetadata(previous:CasualPublic|null,next:CasualPublic):CasualPublic{
 if(!previous||previous.code!==next.code||previous.youId!==next.youId)return next;
 const share=<T>(before:T,after:T):T=>JSON.stringify(before)===JSON.stringify(after)?before:after;
 return {...next,players:share(previous.players,next.players),settings:share(previous.settings,next.settings),chat:share(previous.chat,next.chat),events:share(previous.events,next.events)};
}
