import {DurableObject} from 'cloudflare:workers';
import {createCasualAPI} from './api.ts';
import {RoomStore} from './room-store.ts';
/** One durable authority per room; live polls do not read or write remote D1. */
export class CasualRoom extends DurableObject<Cloudflare.Env>{
 private readonly db:RoomStore;
 constructor(ctx:DurableObjectState,env:Cloudflare.Env){super(ctx,env);this.db=new RoomStore(ctx.storage);ctx.blockConcurrencyWhile(()=>this.db.load())}
 async alarm(){await this.db.expire(Date.now())}
 async fetch(req:Request){
  const code=req.headers.get('X-Room-Key');
  // Old rooms retain their code and token hashes during the D1 → DO transition.
  if(code&&!req.headers.has('X-Room-Code'))await this.db.importLegacy(this.env.DB,code);
  const api=createCasualAPI(this.db,task=>this.ctx.waitUntil(task),req.headers.get('X-Room-Code')||undefined);
  if(req.method==='GET')return api.GET(req);
  if(req.method==='POST')return api.POST(req);
  if(req.method==='OPTIONS')return api.OPTIONS(req);
  return new Response('Method not allowed',{status:405});
 }
}
