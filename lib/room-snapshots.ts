import {roomHint} from './room-params.ts';
import {diffRoom,wireRoom} from './room-delta.ts';
type Snapshot={scope:string;room:any;bytes:number;at:number};
const snapshots=new Map<string,Snapshot>();let bytes=0;
/** This disposable cache can miss after any Worker restart; a miss always sends a full state. */
export function roomSnapshot(request:Request,data:any){
 if(!data.room||new URL(request.url).searchParams.get('wire')!=='1'||data.room.mode==='phone')return data;
 const raw=data.room,scope=raw.code+':'+raw.youId,baseId=roomHint(request,'base'),base=baseId?snapshots.get(baseId):undefined,id=crypto.randomUUID(),now=Date.now();
 const eligible=base?.scope===scope&&base.room.round===raw.round&&base.room.mode===raw.mode&&now-base.at<30000;
 const oldGame=eligible?base.room.game:null,game=raw.game;
 // Terrain versions are authoritative. Sharing the already-quantized immutable
 // array avoids walking thousands of unchanged tiles for every seat and tick.
 const terrain=game?.kind==='terra'&&oldGame?.kind==='terra'&&Number.isSafeInteger(game.version)&&game.version===oldGame.version&&game.width>0&&game.height>0&&game.width===oldGame.width&&game.height===oldGame.height?'tiles':game?.kind==='snake'&&oldGame?.kind==='snake'&&typeof game.mapId==='string'&&Number.isSafeInteger(game.size)&&game.mapId===oldGame.mapId&&game.size===oldGame.size?'obstacles':null;
 const shared=terrain&&Array.isArray(oldGame?.[terrain])&&Array.isArray(game?.[terrain]);
 const room=wireRoom(shared?{...raw,game:{...game,[terrain!]:undefined}}:raw);if(shared)room.game[terrain!]=oldGame[terrain!];
 const full=JSON.stringify(room),delta=base?.scope===scope&&base.room.round===room.round&&base.room.mode===room.mode&&now-base.at<30000?diffRoom(base.room,room):undefined,patch=delta?JSON.stringify(delta):'';
 const entry={scope,room,bytes:full.length*2,at:now};snapshots.set(id,entry);bytes+=entry.bytes;
 while(snapshots.size>256||bytes>6_000_000){const first=snapshots.keys().next().value;if(first===undefined)break;bytes-=snapshots.get(first)!.bytes;snapshots.delete(first)}
 if(delta&&patch.length+100<full.length){const{room:ignored,...rest}=data;return{...rest,snapshotId:id,baseSnapshot:baseId,patch:delta,revision:room.revision}}
 return{...data,room,snapshotId:id};
}
