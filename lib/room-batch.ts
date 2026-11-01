/**
 * Coalesce overlapping work in one Worker isolate, without keeping an authority
 * cache. Every batch reads storage and commits with the existing revision check.
 * Requests arriving in other isolates are still protected by that check.
 */
type Row<S>={state:S;revision:number};
export type RoomChange<S,T>={state:S;changed:boolean;result:(state:S,revision:number,now:number)=>T};
type Job<S>={apply:(state:S,now:number)=>RoomChange<S,unknown>;resolve:(value:()=>unknown)=>void;reject:(error:unknown)=>void};
class RoomBatch<S>{
 private queue:Job<S>[]=[];private running=false;
 private read:()=>Promise<Row<S>>;private save:(state:S,revision:number)=>Promise<boolean>;private busy:()=>Error;private idle:()=>void;
 private keepAlive?:((task:Promise<unknown>)=>void);private directWake:boolean;
 constructor(read:()=>Promise<Row<S>>,save:(state:S,revision:number)=>Promise<boolean>,busy:()=>Error,idle:()=>void,keepAlive?:((task:Promise<unknown>)=>void),directWake=false){this.directWake=directWake;this.read=read;this.save=save;this.busy=busy;this.idle=idle;this.keepAlive=keepAlive}
 async run<T>(apply:(state:S,now:number)=>RoomChange<S,T>):Promise<T>{
  if(this.queue.length>=128)throw this.busy();
  if(this.directWake){
   // Durable Object requests share one object context; D1 keeps its own-I/O wait below.
   const completion=new Promise<()=>unknown>((resolve,reject)=>{this.queue.push({apply,resolve,reject})});
   if(!this.running){const task=this.flush();this.keepAlive?.(task)}
   const finish=await completion;return finish() as T;
  }
  let done=false,failed=false,value:(()=>unknown)|undefined,error:unknown;
  this.queue.push({apply,resolve:finish=>{value=finish;done=true},reject:reason=>{error=reason;failed=true;done=true}});
  if(!this.running){const task=this.flush();this.keepAlive?.(task)}
  // A Worker request must wait on its own I/O context. Awaiting another
  // request's unresolved promise can be canceled as a hung event by workerd.
  const deadline=Date.now()+8000;
  while(!done){if(Date.now()>deadline)throw this.busy();await new Promise(resolve=>setTimeout(resolve,4))}
  if(failed)throw error;return value!() as T;
 }
 private async flush(){
  this.running=true;
  try{while(this.queue.length){
   let jobs:Job<S>[]|null=null;
   try{
    for(let attempt=0;attempt<12;attempt++){
     const row=await this.read();
     // Collect arrivals during the storage read, with no extra batching delay.
     jobs??=this.queue.splice(0,16);
     const now=Date.now();let state=row.state,changed=false;
     const results=jobs.map(job=>{try{const next=job.apply(state,now);state=next.state;changed||=next.changed;return{job,result:next.result}}catch(error){return{job,error}}});
     if(changed&&!await this.save(state,row.revision))continue;
     // Build each response back in its own request context. Keep the originating
     // Worker event alive while subsequent queued batches finish their D1 I/O.
     const final=state,revision=row.revision+(changed?1:0);
     for(const entry of results){if('error'in entry)entry.job.reject(entry.error);else entry.job.resolve(()=>entry.result!(final,revision,now))}
     jobs=null;break;
    }
    if(jobs)for(const job of jobs)job.reject(this.busy());
   }catch(error){for(const job of jobs||this.queue.splice(0))job.reject(error)}
  }}finally{this.running=false;this.idle()}
 }
}
const databases=new WeakMap<object,Map<string,RoomBatch<any>>>();
export function roomBatch<S>(database:object,key:string,read:()=>Promise<Row<S>>,save:(state:S,revision:number)=>Promise<boolean>,busy:()=>Error,keepAlive?:((task:Promise<unknown>)=>void),directWake=false){
 let rooms=databases.get(database);if(!rooms){rooms=new Map();databases.set(database,rooms)}
 let batch=rooms.get(key) as RoomBatch<S>|undefined;
 if(!batch){batch=new RoomBatch(read,save,busy,()=>rooms!.delete(key),keepAlive,directWake);rooms.set(key,batch)}
 return batch;
}
