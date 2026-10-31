import {DatabaseSync} from 'node:sqlite';
import {createCasualAPI} from '../lib/casual/api.ts';
const report:any[]=[];
for(const mode of ['snake','circuit','terra','memory']){
 const sql=new DatabaseSync(':memory:');sql.exec('CREATE TABLE casual_rooms(code TEXT PRIMARY KEY,state TEXT,revision INTEGER,created_at INTEGER)');let reads=0,writes=0,serial=0;
 const delay=()=>new Promise(r=>setTimeout(r,8));const db:any={prepare(q:string){return{bind(...args:any[]){return{async first(){reads++;await delay();return sql.prepare(q).get(...args)},async run(){writes++;await delay();return{meta:{changes:Number(sql.prepare(q).run(...args).changes)}}}}}}}};
 const api=createCasualAPI(db),post=async(body:any,token?:string)=>{const r=await api.POST(new Request('http://localhost/api/casual',{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify({requestId:'perf-test-'+(++serial),...body})}));return{status:r.status,...await r.json() as any}};
 const h=await post({action:'create',mode,name:'Host',bots:0,snakeSize:64,map:'neon'}),seats=[h];for(let i=1;i<8;i++)seats.push(await post({action:'join',code:h.room.code,name:'Guest '+i}));await post({action:'start',code:h.room.code},h.token);
 reads=writes=0;const times:number[]=[],statuses:number[]=[],bytes:number[]=[];
 for(let burst=0;burst<5;burst++)await Promise.all(seats.map(async(s:any,i:number)=>{const t=performance.now(),r=mode==='circuit'||mode==='terra'?await post({action:mode==='circuit'?'drive':'explore',code:h.room.code,round:1,seq:burst+1,...(mode==='circuit'?{throttle:1,steer:0,drift:false}:{left:false,right:true,jump:false,use:false,slot:0,tx:10,ty:10})},s.token):await(async()=>{const response=await api.GET(new Request('http://localhost/api/casual?code='+h.room.code,{headers:{Authorization:'Bearer '+s.token}}));return{status:response.status,...await response.json() as any}})();times.push(performance.now()-t);statuses.push(r.status);bytes.push(JSON.stringify(r).length)}));
 times.sort((a,b)=>a-b);report.push({mode,requests:times.length,reads,writes,p50Ms:+times[Math.floor(times.length*.5)].toFixed(1),p95Ms:+times[Math.floor(times.length*.95)].toFixed(1),meanBytes:Math.round(bytes.reduce((a,b)=>a+b)/bytes.length),errors:statuses.filter(s=>s>=400).length});sql.close();
}
console.log(JSON.stringify(report,null,2));
