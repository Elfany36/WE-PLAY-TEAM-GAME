import test from 'node:test';
import assert from 'node:assert/strict';
import {routeCasual} from '../lib/casual/room-route.ts';

function fakeRooms(){
 const calls:{name:string;url:string;method:string;code:string|null;body:string}[]=[];
 const rooms={
  idFromName:(name:string)=>name as any,
  get:(id:any)=>({fetch:async(req:Request)=>{calls.push({name:String(id),url:req.url,method:req.method,code:req.headers.get('X-Room-Code'),body:await req.text()});return new Response('{"ok":true}',{status:201,headers:{'content-type':'application/json'}})}}),
 } as any;
 return {rooms,calls};
}
const post=(body:unknown,headers:Record<string,string>={})=>new Request('https://example.test/api/casual',{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(body)});

test('requests are routed to the Durable Object named after the normalized room code',async()=>{
 const {rooms,calls}=fakeRooms();
 const get=await routeCasual(new Request('https://example.test/api/casual?code=abcdefgh'),{CASUAL_ROOMS:rooms});
 assert.equal(get.status,201);assert.equal(calls[0].name,'casual:ABCDEFGH');
 await routeCasual(post({action:'chat',code:'abcd2345',text:'hi',messageId:'message-123',requestId:'request-123'}),{CASUAL_ROOMS:rooms});
 assert.equal(calls[1].name,'casual:ABCD2345');assert.equal(JSON.parse(calls[1].body).text,'hi');assert.equal(calls[1].code,null);
});

test('create picks a fresh code for the Worker and ignores any client-supplied X-Room-Code',async()=>{
 const {rooms,calls}=fakeRooms();
 await routeCasual(post({action:'create',name:'Host',mode:'snake'},{'X-Room-Code':'ZZZZZZZZ'}),{CASUAL_ROOMS:rooms});
 assert.match(calls[0].code||'',/^[A-HJ-NP-Z2-9]{8}$/);assert.notEqual(calls[0].code,'ZZZZZZZZ');assert.equal(calls[0].name,'casual:'+calls[0].code);
 const mutable=await routeCasual(post({action:'create',name:'Host',mode:'snake'}),{CASUAL_ROOMS:rooms});
 mutable.headers.set('x-test','1');assert.equal(mutable.headers.get('x-test'),'1');
});

test('unreadable codes never reach a Durable Object and keep the original validation errors',async()=>{
 const {rooms,calls}=fakeRooms();
 const bad=await routeCasual(new Request('https://example.test/api/casual?code=nope'),{CASUAL_ROOMS:rooms});
 assert.equal(bad.status,400);assert.match(((await bad.json()) as {error:string}).error,/8-character/);
 const junk=await routeCasual(new Request('https://example.test/api/casual',{method:'POST',body:'not json'}),{CASUAL_ROOMS:rooms});
 assert.equal(junk.status,400);assert.equal(calls.length,0);
 const options=await routeCasual(new Request('https://example.test/api/casual',{method:'OPTIONS'}),{CASUAL_ROOMS:rooms});
 assert.equal(options.status,204);assert.equal(calls.length,0);
});

test('without a Durable Object binding the original storage path is used',async()=>{
 const res=await routeCasual(new Request('https://example.test/api/casual?code=ABCDEFGH',{headers:{Authorization:'Bearer '+'a'.repeat(64)}}),{});
 assert.equal(res.status,503);
});
