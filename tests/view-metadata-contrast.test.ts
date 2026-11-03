import {test} from 'node:test';import assert from 'node:assert/strict';
import {shareRoomMetadata} from '../lib/casual/client-room.ts';import {createCasual,publicCasual} from '../lib/casual/engine.ts';import {playerColor} from '../lib/casual/appearance.ts';
test('world snapshots reuse unchanged UI lists but keep new geometry and changed appearance',()=>{
 const room=publicCasual(createCasual('ABCDEFGH','p','Player','hash','snake',42,10000),'p',10000),incoming={...structuredClone(room),serverNow:10100,game:{kind:'snake',tick:1}} as any;
 const shared=shareRoomMetadata(room,incoming);assert.equal(shared.players,room.players);assert.equal(shared.settings,room.settings);assert.equal(shared.chat,room.chat);assert.equal(shared.game,incoming.game);
 const changed=structuredClone(incoming);changed.players[0].appearance={color:'#0088ff'};assert.notEqual(shareRoomMetadata(shared,changed).players,shared.players);
 const other={...incoming,youId:'another'};assert.equal(shareRoomMetadata(shared,other),other);
});
test('custom character colors keep readable text across the RGB color cube',()=>{
 const lum=(hex:string)=>{const c=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return c[0]*.2126+c[1]*.7152+c[2]*.0722};
 for(let r=0;r<=255;r+=17)for(let g=0;g<=255;g+=17)for(let b=0;b<=255;b+=17){const color='#'+[r,g,b].map(v=>v.toString(16).padStart(2,'0')).join(''),result=playerColor({color:0,appearance:{color}}),a=lum(color),ink=lum(result.ink);assert((Math.max(a,ink)+.05)/(Math.min(a,ink)+.05)>=4.5,color)}
});
