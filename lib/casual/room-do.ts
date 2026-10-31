import {DurableObject} from 'cloudflare:workers';
import {createCasualAPI} from './api.ts';
import {ROOM_TTL} from './engine.ts';

type Row={code:string;state:string;revision:number;created_at:number};

/**
 * One Durable Object per casual room. It owns the room state in memory, so a
 * poll is a memory read plus a local storage write instead of two D1 round
 * trips. The existing room API runs unchanged on top of a tiny D1-compatible
 * adapter that understands only the four statements it issues.
 */
export class CasualRoom extends DurableObject<Cloudflare.Env>{
 private row:Row|null=null;
 private readonly db:D1Database;
 constructor(ctx:DurableObjectState,env:Cloudflare.Env){
  super(ctx,env);
  ctx.blockConcurrencyWhile(async()=>{this.row=(await ctx.storage.get<Row>('row'))??null});
  // One adapter object per room: roomBatch coalesces work keyed on this identity.
  this.db={prepare:(sql:string)=>({bind:(...a:any[])=>({
   first:async()=>this.first(sql,a),
   run:async()=>this.run(sql,a),
  })})} as unknown as D1Database;
 }
 private async first(sql:string,a:any[]){
  if(/^SELECT state,revision,created_at FROM casual_rooms WHERE code=\?/.test(sql)){
   const r=this.row;return r&&r.code===a[0]?{state:r.state,revision:r.revision,created_at:r.created_at}:null;
  }
  throw new Error('Unsupported room query.');
 }
 private async run(sql:string,a:any[]){
  const r=this.row;
  if(/^UPDATE casual_rooms SET state=\?, revision=revision\+1 WHERE code=\? AND revision=\?/.test(sql)){
   if(!r||r.code!==a[1]||r.revision!==a[2])return{meta:{changes:0}};
   this.row={...r,state:a[0],revision:r.revision+1};await this.ctx.storage.put('row',this.row);return{meta:{changes:1}};
  }
  if(/^INSERT INTO casual_rooms/.test(sql)){
   if(r)throw new Error('UNIQUE constraint failed: casual_rooms.code');
   this.row={code:a[0],state:a[1],revision:0,created_at:a[2]};await this.ctx.storage.put('row',this.row);
   await this.ctx.storage.setAlarm(a[2]+ROOM_TTL+60_000);return{meta:{changes:1}};
  }
  if(/^DELETE FROM casual_rooms WHERE created_at < \?/.test(sql)){
   if(r&&r.created_at<a[0]){this.row=null;await this.ctx.storage.deleteAll();return{meta:{changes:1}}}
   return{meta:{changes:0}};
  }
  throw new Error('Unsupported room statement.');
 }
 /** Expired rooms remove their own storage; nothing else ever cleans them up. */
 async alarm(){
  if(this.row&&Date.now()-this.row.created_at<ROOM_TTL)return;
  this.row=null;await this.ctx.storage.deleteAll();
 }
 async fetch(req:Request){
  // The Worker is the only caller and always sets or clears this header.
  const api=createCasualAPI(this.db,task=>this.ctx.waitUntil(task),req.headers.get('X-Room-Code')||undefined);
  if(req.method==='GET')return api.GET(req);
  if(req.method==='POST')return api.POST(req);
  if(req.method==='OPTIONS')return api.OPTIONS(req);
  return new Response('Method not allowed',{status:405});
 }
}
