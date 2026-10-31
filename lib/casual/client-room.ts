import type {CasualPublic} from './engine.ts';
/** Reuse terrain only for the exact world revision acknowledged by the server. */
export function restoreRoomTerrain(previous:CasualPublic|null,next:CasualPublic):CasualPublic|null{
 if(next.mode!=='terra'||!next.game||next.game.tiles)return next;
 if(previous?.code===next.code&&previous.round===next.round&&previous.game?.version===next.game.version&&previous.game.tiles)return{...next,game:{...next.game,tiles:previous.game.tiles}};
 return null;
}
