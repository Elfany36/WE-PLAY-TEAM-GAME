import test from 'node:test';
import assert from 'node:assert/strict';
import {RoomRevisionFeed} from '../lib/room-revisions.ts';
import {RoomTransport} from '../lib/room-transport.ts';
import {roomStreamRequest} from '../lib/room-stream.ts';

const token='a'.repeat(64),endpoint='https://example.test/api/casual?code=ABCDEFGH';
function environment(t:any){
 class Socket{
  static OPEN=1;static instances:Socket[]=[];static fail=false;
  readyState=0;bufferedAmount=0;sent:any[]=[];url:string;
  onopen:any;onmessage:any;onclose:any;onerror:any;
  constructor(url:string){if(Socket.fail){Socket.fail=false;throw Error('temporary construction failure')}this.url=String(url);Socket.instances.push(this)}
  send(text:string){this.sent.push(JSON.parse(text))}
  open(){this.readyState=1;this.onopen?.()}
  message(data:any){this.onmessage?.({data:JSON.stringify(data)})}
  close(code=1000){this.readyState=3;this.onclose?.({code})}
 }
 const document=Object.assign(new EventTarget(),{hidden:false}),window=new EventTarget(),saved=new Map<string,PropertyDescriptor|undefined>();
 for(const [key,value]of Object.entries({document,window,location:new URL('https://example.test/'),WebSocket:Socket})){saved.set(key,Object.getOwnPropertyDescriptor(globalThis,key));Object.defineProperty(globalThis,key,{configurable:true,writable:true,value})}
 t.mock.timers.enable({apis:['Date','setTimeout','setInterval'],now:10000});t.mock.method(performance,'now',Date.now.bind(Date));
 const statuses:boolean[]=[],revisions:number[]=[],states:any[]=[],feed=new RoomRevisionFeed(endpoint,token,{status:v=>statuses.push(v),revision:v=>revisions.push(v),state:v=>{states.push(v)}});
 t.after(()=>{feed.stop();t.mock.timers.reset();for(const [key,descriptor]of saved){if(descriptor)Object.defineProperty(globalThis,key,descriptor);else Reflect.deleteProperty(globalThis,key)}});
 const open=(protocol=2)=>{const socket=Socket.instances.at(-1)!;socket.open();socket.message({type:'ready',revision:0,protocol});return socket};
 return{Socket,document,window,feed,statuses,revisions,states,open,tick:(n:number)=>t.mock.timers.tick(n)};
}
test('live authentication stays in encrypted frames; start is idempotent and older servers retain HTTP',t=>{
 const e=environment(t);e.feed.start();e.feed.start();assert.equal(e.Socket.instances.length,1);
 const socket=e.open(1);assert(!socket.url.includes(token));assert.equal(socket.sent[0].token,token);assert.equal(e.feed.streaming,false);
 assert.equal(e.feed.request(new URL(endpoint),{headers:{Authorization:'Bearer '+token}}),null);
 socket.message({type:'revision',revision:2});assert.deepEqual(e.revisions,[0,2]);
});
test('an opening socket that hangs and a constructor failure both retry',t=>{
 const e=environment(t);e.Socket.fail=true;e.feed.start();e.tick(1000);assert.equal(e.Socket.instances.length,1);e.tick(8000);assert.equal(e.statuses.at(-1),false);e.tick(2000);assert.equal(e.Socket.instances.length,2);
});
test('a silently dead live socket stops being live and reconnects without waiting for close',t=>{
 const e=environment(t);e.feed.start();const socket=e.open();e.tick(3000);assert.equal(socket.sent.at(-1).type,'ping');e.tick(6000);assert.equal(e.statuses.at(-1),false);assert.equal(e.feed.streaming,false);e.tick(1000);assert.equal(e.Socket.instances.length,2);
});
test('foreground return replaces a stale socket immediately and terminal auth failures stay closed',t=>{
 const e=environment(t);e.feed.start();e.open();e.document.hidden=true;e.document.dispatchEvent(new Event('visibilitychange'));e.tick(20000);e.document.hidden=false;e.document.dispatchEvent(new Event('visibilitychange'));assert.equal(e.Socket.instances.length,2);
 const current=e.open();current.close(4001);e.window.dispatchEvent(new Event('online'));e.tick(60000);assert.equal(e.Socket.instances.length,2);
});
test('only matching authenticated room requests use the stream and receipts match their request',async t=>{
 const e=environment(t);e.feed.start();const socket=e.open(),url=new URL(endpoint);
 assert.equal(e.feed.request(new URL(endpoint.replace('ABCDEFGH','HGFEDCBA')),{headers:{Authorization:'Bearer '+token}}),null);
 const response=e.feed.request(url,{headers:{Authorization:'Bearer '+token}})!;
 const request=socket.sent.at(-1);assert.equal(request.type,'request');assert(!JSON.stringify(request).includes(token));
 socket.message({type:'response',id:request.id,status:200,data:{room:{code:'ABCDEFGH'}}});assert.equal(((await(await response).json()) as any).room.code,'ABCDEFGH');
 socket.message({type:'state',data:{snapshotId:'private',room:{youId:'own-seat'}}});assert.equal(e.states.length,1);
});
test('closing a stream rejects pending controls; aborted receipts cannot linger or resolve later',async t=>{
 const e=environment(t);e.feed.start();const socket=e.open(),controller=new AbortController();
 const first=e.feed.request(new URL(endpoint),{signal:controller.signal,headers:{Authorization:'Bearer '+token}})!;
 const rejected=assert.rejects(first,{name:'AbortError'});controller.abort();await rejected;
 const second=e.feed.request(new URL(endpoint),{headers:{Authorization:'Bearer '+token}})!;
 const closed=assert.rejects(second,/Reconnecting/);socket.onerror();await closed;
});
test('reset aborts old requests and a late response cannot seed another session’s delta cache',async()=>{
 const original=globalThis.fetch;let finish!:(response:Response)=>void,signal:AbortSignal|undefined;const transport=new RoomTransport();
 globalThis.fetch=async(_url,init)=>{signal=init?.signal as AbortSignal;return new Promise(resolve=>finish=resolve)};
 try{
  const old=transport.send(endpoint);transport.reset();assert(signal?.aborted);finish(Response.json({snapshotId:'old',room:{code:'ABCDEFGH',revision:99,serverNow:1000}}));await assert.rejects(old,{name:'AbortError'});assert.equal(transport.stats.receivedBytes,0);
  globalThis.fetch=async(_url,init)=>{assert.equal(new Headers(init?.headers).get('X-Room-Base'),'');return Response.json({room:{code:'HGFEDCBA',revision:0,serverNow:2000}})};
  assert.equal((await transport.send(endpoint)).room.code,'HGFEDCBA');
 }finally{globalThis.fetch=original}
});
test('a missing delta base recovers a full GET once without replaying non-idempotent work',async()=>{
 const original=globalThis.fetch;let calls=0;globalThis.fetch=async()=>Response.json(++calls===1?{patch:[0,{}],baseSnapshot:'evicted'}:{room:{code:'ABCDEFGH',revision:3,serverNow:2000}});
 try{const transport=new RoomTransport();assert.equal((await transport.send(endpoint)).room.revision,3);assert.equal(calls,2)}finally{globalThis.fetch=original}
});
test('stream envelopes cannot create seats, change rooms, inject paths or exceed input bounds',()=>{
 const valid={id:'1',method:'POST',body:{code:'ABCDEFGH',action:'ready',requestId:'request-1'},hints:{base:'private-base'}};
 const request=roomStreamRequest(valid,'ABCDEFGH','casual');assert.equal(request.method,'POST');assert.equal(request.headers.get('X-Room-Base'),'private-base');
 for(const change of [{id:'../../1'},{method:'DELETE'},{body:{...valid.body,code:'HGFEDCBA'}},{body:{...valid.body,action:'join'}},{body:{...valid.body,action:'create'}},{hints:{base:'x'.repeat(129)}}])assert.throws(()=>roomStreamRequest({...valid,...change},'ABCDEFGH','casual'));
});

test('applied live states acknowledge their revision so a slow stream can coalesce obsolete snapshots',t=>{
 const e=environment(t);e.feed.start();const socket=e.open();assert.equal(socket.sent[0].stateAck,true);
 socket.message({type:'state',data:{snapshotId:'state-1',room:{revision:7}}});assert.deepEqual(socket.sent.at(-1),{type:'ack',revision:7,stateWindow:4});
 socket.message({type:'state',data:{snapshotId:'state-2',revision:8,patch:[0,{}]}});assert.deepEqual(socket.sent.at(-1),{type:'ack',revision:8,stateWindow:4});
});

test('seat ownership controls foreground presence and socket latency stays a real measurement',t=>{
 const e=environment(t);e.feed.start();const socket=e.open();e.feed.setActive(false);assert.equal(socket.sent.at(-1).active,false);e.feed.setActive(true);assert.equal(socket.sent.at(-1).active,true);assert(Number.isSafeInteger(socket.sent.at(-1).id));
 const transport=new RoomTransport();transport.observeLatency(438.2);assert.equal(transport.stats.rtt,438);assert.equal(transport.stats.totalRtt,438);transport.observeLatency(NaN);assert.equal(transport.stats.rtt,438);
});

test('clock correction cannot postpone silent-socket recovery',t=>{
 const e=environment(t);e.feed.start();const socket=e.open();
 const steady=Date.now.bind(Date);t.mock.method(Date,'now',()=>steady()-3600000);
 e.tick(3000);assert.equal(socket.sent.at(-1).type,'ping');
 e.tick(6000);assert.equal(e.statuses.at(-1),false);e.tick(1000);assert.equal(e.Socket.instances.length,2);
});
