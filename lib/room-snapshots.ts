import {roomHint} from './room-params.ts';
import {diffRoom,wireRoom} from './room-delta.ts';
type Snapshot={scope:string;room:any;bytes:number;at:number};
const snapshots=new Map<string,Snapshot>();let bytes=0;
/** This disposable cache can miss after any Worker restart; a miss always sends a full state. */
export function roomSnapshot(request:Request,data:any){
 if(!data.room||new URL(request.url).searchParams.get('wire')!=='1'||data.room.mode==='phone')return data;
 const room=wireRoom(data.room),scope=room.code+':'+room.youId,baseId=roomHint(request,'base'),base=baseId?snapshots.get(baseId):undefined,id=crypto.randomUUID(),now=Date.now();
 const full=JSON.stringify(room),delta=base?.scope===scope&&base.room.round===room.round&&base.room.mode===room.mode&&now-base.at<30000?diffRoom(base.room,room):undefined,patch=delta?JSON.stringify(delta):'';
 const entry={scope,room,bytes:full.length*2,at:now};snapshots.set(id,entry);bytes+=entry.bytes;
 while(snapshots.size>256||bytes>6_000_000){const first=snapshots.keys().next().value;if(first===undefined)break;bytes-=snapshots.get(first)!.bytes;snapshots.delete(first)}
 if(delta&&patch.length+100<full.length){const{room:ignored,...rest}=data;return{...rest,snapshotId:id,baseSnapshot:baseId,patch:delta,revision:room.revision}}
 return{...data,room,snapshotId:id};
}
