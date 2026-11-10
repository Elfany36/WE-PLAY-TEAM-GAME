import {roomHint} from './room-params.ts';
import {diffRoom,wireRoom} from './room-delta.ts';
type Snapshot={scope:string;room:any;bytes:number;at:number};
const snapshots=new Map<string,Snapshot>();let bytes=0;
const terrainLengths=new WeakMap<object,number>();
const strokeLengths=new WeakMap<object,number>();
/** This disposable cache can miss after any Worker restart; a miss always sends a full state. */
export function roomSnapshot(request:Request,data:any,fanout?:WeakMap<object,any>){
 if(!data.room||new URL(request.url).searchParams.get('wire')!=='1'||data.room.mode==='phone')return data;
 const raw=data.room,scope=raw.code+':'+raw.youId,baseId=roomHint(request,'base'),base=baseId?snapshots.get(baseId):undefined,id=crypto.randomUUID(),now=Date.now();
 const eligible=base?.scope===scope&&base.room.round===raw.round&&base.room.mode===raw.mode&&now-base.at<30000;
 const oldGame=eligible?base.room.game:null,game=raw.game;
 // Terrain versions are authoritative. Sharing the already-quantized immutable
 // array avoids walking thousands of unchanged tiles for every seat and tick.
 const terrain=game?.kind==='terra'&&oldGame?.kind==='terra'&&Number.isSafeInteger(game.version)&&game.version===oldGame.version&&game.width>0&&game.height>0&&game.width===oldGame.width&&game.height===oldGame.height?'tiles':game?.kind==='snake'&&oldGame?.kind==='snake'&&typeof game.mapId==='string'&&Number.isSafeInteger(game.size)&&game.mapId===oldGame.mapId&&game.size===oldGame.size?'obstacles':null;
 const shared=terrain&&Array.isArray(oldGame?.[terrain])&&Array.isArray(game?.[terrain]);
 // Strokes are append-only within a canvas epoch; unchanged sequence/length
 // identifies immutable ink. Never carry this across an undo, clear or turn.
 const ink=game?.kind==='sketch'&&oldGame?.kind==='sketch'&&game.turn===oldGame.turn&&game.canvasEpoch===oldGame.canvasEpoch&&Array.isArray(game.strokes)&&Array.isArray(oldGame.strokes);
 const room=wireRoom(shared?{...raw,game:{...game,[terrain!]:undefined}}:ink?{...raw,game:{...game,strokes:undefined}}:raw,'',fanout);
 // Size the small envelope separately. An unchanged world need not be serialized
 // again merely to decide whether its delta is smaller than a full snapshot.
 let fullLength=JSON.stringify(room).length;
 if(shared){const tiles=oldGame[terrain!];let length=terrainLengths.get(tiles);if(length===undefined){length=JSON.stringify(tiles).length;terrainLengths.set(tiles,length)}fullLength+=JSON.stringify(terrain).length+2+length;room.game[terrain!]=tiles}
 if(ink){
  const previous=new Map<string,any>(oldGame.strokes.map((stroke:any)=>[stroke.id,stroke]));
  const strokes=game.strokes.map((stroke:any)=>{const old=previous.get(stroke.id);return old&&Number.isSafeInteger(stroke.seq)&&stroke.seq===old.seq&&stroke.closed===old.closed&&stroke.color===old.color&&stroke.size===old.size&&stroke.points.length===old.points.length?old:wireRoom(stroke,'',fanout)});
  let length=2+Math.max(0,strokes.length-1);for(const stroke of strokes){let size=strokeLengths.get(stroke);if(size===undefined){size=JSON.stringify(stroke).length;strokeLengths.set(stroke,size)}length+=size}
  fullLength+='"strokes"'.length+2+length;room.game.strokes=strokes;
 }
 const delta=eligible?diffRoom(base.room,room):undefined,patch=delta?JSON.stringify(delta):'';
 const entry={scope,room,bytes:fullLength*2,at:now};snapshots.set(id,entry);bytes+=entry.bytes;
 while(snapshots.size>256||bytes>6_000_000){const first=snapshots.keys().next().value;if(first===undefined)break;bytes-=snapshots.get(first)!.bytes;snapshots.delete(first)}
 if(delta&&patch.length+100<fullLength){const{room:ignored,...rest}=data;return{...rest,snapshotId:id,baseSnapshot:baseId,patch:delta,revision:room.revision}}
 return{...data,room,snapshotId:id};
}
