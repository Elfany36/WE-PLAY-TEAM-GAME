import {test} from 'node:test';
import assert from 'node:assert/strict';
import {appendChat,activeChat,CHAT_TTL,CHAT_GIFTS} from '../lib/room-chat.ts';
import {createArena,applyAction,publicArena} from '../lib/arena-engine.ts';
import {createCasual,applyCasualAction,publicCasual} from '../lib/casual/engine.ts';
import {roomOriginAllowed,roomHeaders} from '../lib/room-origin.ts';
import {ControlChannel} from '../lib/control-channel.ts';
import {buildFacts} from '../lib/build-facts.ts';
import {reference} from '../lib/reference-snapshot.ts';
import {facts} from '../lib/question-bank.ts';
const now=1_000_000;
test('the small playable fact bank exactly matches the corrected reference projection',()=>{assert.deepEqual(facts,buildFacts(reference))});
test('chat preserves emoji, derives gift text from a closed catalog, expires, and rejects unknown gifts',()=>{
 let history=appendChat(undefined,'a','Alice','👋🏽 Hello 🌻','emoji-message',now);
 assert.equal(history[0].text,'👋🏽 Hello 🌻');
 history=appendChat(history,'a','Alice','spoofed gift text','gift-message',now+1000,'star');
 assert.equal(history[1].giftId,'star');assert.equal(history[1].text,CHAT_GIFTS[0].text);
 assert.throws(()=>appendChat(history,'a','Alice','oops','bad-gift-id',now+2000,'<img>'));
 assert.equal(activeChat(history,now+CHAT_TTL+1000).length,0);
});
test('coding rooms clear all chat and advance its reset epoch on departures and game changes',()=>{
 let s=createArena('ABCDEFGH','a','hash-a','Alice',now);
 s=applyAction(s,{action:'join',id:'b',hash:'hash-b',name:'Bob'},null,now).state;
 s=applyAction(s,{action:'chat',text:'Hello',messageId:'first-message'},'a',now).state;
 s=applyAction(s,{action:'configure',mode:'quiz',topic:'All'},'a',now+1).state;
 assert.equal(s.chat!.length,0);assert.equal(s.chatEpoch,1);
 s=applyAction(s,{action:'chat',text:'New game',messageId:'second-message'},'a',now+2).state;
 s=applyAction(s,{action:'leave'},'b',now+3).state;
 assert.equal(s.chat!.length,0);assert.equal(s.chatEpoch,2);assert.equal(publicArena(s,'a',now+4).chat.length,0);
});
test('casual rooms clear chat when a seat leaves or the host changes mode, retaining game state on chat',()=>{
 let s=createCasual('ABCDEFGH','a','Alice','hash-a','memory',1,now);
 s=applyCasualAction(s,{action:'join',id:'b',hash:'hash-b',name:'Bob'},null,now);
 s=applyCasualAction(s,{action:'chat',text:'Hi',messageId:'first-message',giftId:'flower'},'a',now);
 s=applyCasualAction(s,{action:'configure',mode:'snake',cards:32,speed:175},'a',now+1);
 assert.equal(s.chat!.length,0);assert.equal(s.chatEpoch,1);
 s=applyCasualAction(s,{action:'chat',text:'Ready',messageId:'next-message'},'a',now+2);
 s=applyCasualAction(s,{action:'leave'},'b',now+3);
 assert.equal(s.chat!.length,0);assert.equal(s.chatEpoch,2);assert.equal(publicCasual(s,'a',now+4).chat.length,0);
});
test('CORS accepts the published site and the selected GitHub Pages owner, rejecting other origins',()=>{
 const url='https://markup-learn-play-together.brightbunch.chatgpt.site/api/arena';
 for(const origin of ['https://markup-learn-play-together.brightbunch.chatgpt.site','https://elfany36.github.io']){
  const req=new Request(url,{headers:{Origin:origin}});assert(roomOriginAllowed(req));assert.equal(roomHeaders(req)['Access-Control-Allow-Origin'],origin);
 }
 const req=new Request(url,{headers:{Origin:'https://unrelated.example'}});assert(!roomOriginAllowed(req));assert.equal(roomHeaders(req)['Access-Control-Allow-Origin'],undefined);
});
test('control retry stops after seven attempts and a fresh input can recover',async()=>{
 let calls=0,fail=true;const channel=new ControlChannel(async()=>{calls++;if(fail)throw Error('offline')},()=>{},()=>0);
 channel.enqueue({action:'drive',round:1,seq:1});await new Promise(r=>setTimeout(r,100));assert.equal(calls,7);
 await new Promise(r=>setTimeout(r,30));assert.equal(calls,7);fail=false;channel.enqueue({action:'drive',round:1,seq:2});await new Promise(r=>setTimeout(r,20));assert.equal(calls,8);channel.reset();
});
