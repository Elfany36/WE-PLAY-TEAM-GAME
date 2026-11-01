import {ROOM_TTL} from './engine.ts';
export type StoredRoom={code:string;state:string;revision:number;created_at:number};
export type CasualDatabase={roomScheduling?:'durable-object';prepare(sql:string):{bind(...values:any[]):{first<T>():Promise<T|null>;run():Promise<{meta:{changes?:number}}>}}};
type Storage={get<T>(key:string):Promise<T|undefined>;put(key:string,value:unknown):Promise<void>;deleteAll():Promise<void>;setAlarm(at:number):Promise<void>};
/** Local authority adapter. Failed durable writes never change the cached revision. */
export class RoomStore implements CasualDatabase{
 private row:StoredRoom|null=null;
 private migration:Promise<void>|null=null;
 readonly roomScheduling='durable-object' as const;
 private storage:Storage;
 private onCommit?:()=>void;
 private table:'casual_rooms'|'arena_rooms';
 constructor(storage:Storage,onCommit?:()=>void,table:'casual_rooms'|'arena_rooms'='casual_rooms'){this.storage=storage;this.onCommit=onCommit;this.table=table}
 snapshot(){return this.row?{...this.row}:null}
 private committed(next:StoredRoom){this.row=next;this.onCommit?.()}
 async load(){this.row=(await this.storage.get<StoredRoom>('row'))??null}
 async importLegacy(db:CasualDatabase|undefined,code:string){
  if(this.row||!db)return;
  this.migration??=(async()=>{const old=await db.prepare('SELECT state,revision,created_at FROM '+this.table+' WHERE code=?').bind(code).first<Omit<StoredRoom,'code'>>();if(!old||Date.now()-old.created_at>ROOM_TTL)return;const next={code,...old};await this.storage.setAlarm(next.created_at+ROOM_TTL+60_000);await this.storage.put('row',next);this.committed(next)})();
  try{await this.migration}catch(error){this.migration=null;throw error}
 }
 prepare(sql:string){return{bind:(...a:any[])=>({first:async<T>()=>this.first(sql,a) as T|null,run:()=>this.run(sql,a)})}}
 private first(sql:string,a:any[]){if(sql.startsWith('SELECT state,revision,created_at FROM '+this.table+' WHERE code=?')){const r=this.row;return r&&r.code===a[0]?{state:r.state,revision:r.revision,created_at:r.created_at}:null}throw new Error('Unsupported room query.')}
 private async run(sql:string,a:any[]){const r=this.row;
  if(sql.startsWith('UPDATE '+this.table+' SET state=?, revision=revision+1 WHERE code=? AND revision=?')){if(!r||r.code!==a[1]||r.revision!==a[2])return{meta:{changes:0}};const next={...r,state:a[0],revision:r.revision+1};await this.storage.put('row',next);this.committed(next);return{meta:{changes:1}}}
  if(sql.startsWith('INSERT INTO '+this.table)){if(r)throw new Error('UNIQUE constraint failed: casual_rooms.code');const next={code:a[0],state:a[1],revision:0,created_at:a[2]};await this.storage.setAlarm(next.created_at+ROOM_TTL+60_000);await this.storage.put('row',next);this.committed(next);return{meta:{changes:1}}}
  if(sql.startsWith('DELETE FROM '+this.table+' WHERE created_at < ?')){if(r&&r.created_at<a[0]){await this.storage.deleteAll();this.row=null;return{meta:{changes:1}}}return{meta:{changes:0}}}
  throw new Error('Unsupported room statement.');
 }
 async expire(now:number){if(this.row&&now-this.row.created_at<ROOM_TTL){await this.storage.setAlarm(this.row.created_at+ROOM_TTL+60_000);return}await this.storage.deleteAll();this.row=null}
}
