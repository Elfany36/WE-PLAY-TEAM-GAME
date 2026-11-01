import {diffRoom,wireRoom} from './room-delta.ts';
export type StreamBase={id:string;room:any};
/** Per-recipient immutable deltas. Never reuse a base across seats or sockets. */
export function streamFrame(room:any,previous?:StreamBase){
 const terrain=room.game?.tiles,obstacles=room.game?.obstacles;
 let projected=wireRoom({...room,...(room.game?{game:{...room.game,tiles:undefined,obstacles:undefined}}:{})});
 const same=previous?.room.code===room.code&&previous!.room.youId===room.youId&&previous!.room.round===room.round&&previous!.room.mode===room.mode;
 if(terrain)projected.game.tiles=same&&previous!.room.game?.version===room.game.version?previous!.room.game.tiles:terrain;
 if(obstacles)projected.game.obstacles=same&&previous!.room.game?.mapId===room.game.mapId&&previous!.room.game?.size===room.game.size?previous!.room.game.obstacles:obstacles;
 const id=crypto.randomUUID(),delta=same?diffRoom(previous!.room,projected):undefined;
 const packet=delta&&JSON.stringify(delta).length+100<JSON.stringify(projected).length?{type:'snapshot',snapshotId:id,baseSnapshot:previous!.id,patch:delta,revision:room.revision,serverNow:room.serverNow}:{type:'snapshot',snapshotId:id,room:projected,revision:room.revision,serverNow:room.serverNow};
 return{packet,base:{id,room:projected}};
}
