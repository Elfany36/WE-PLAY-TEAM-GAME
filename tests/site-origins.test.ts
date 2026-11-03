import {test} from 'node:test';import assert from 'node:assert/strict';
import {HOSTED_ORIGIN,HOSTED_ORIGINS} from '../lib/multiplayer-config.ts';import {roomOriginAllowed,roomHeaders} from '../lib/room-origin.ts';import {trustedCasualOrigin} from '../lib/casual/service.ts';
test('current GPT site, legacy alias, and Cloudflare frontend can reach online room service',()=>{
 assert.equal(HOSTED_ORIGIN,'https://markup-learn-play-together.kendsfabros.chatgpt.site');
 for(const origin of [...HOSTED_ORIGINS,'https://we-play-team-game.kendsfabros.workers.dev'])for(const method of ['GET','POST','OPTIONS']){const req=new Request('https://markup-arcade.kendsfabros.workers.dev/api/casual',{method,headers:{Origin:origin}});assert(roomOriginAllowed(req));assert.equal(roomHeaders(req)['Access-Control-Allow-Origin'],origin)}
 for(const origin of HOSTED_ORIGINS)assert(trustedCasualOrigin(origin));
 for(const origin of ['https://markup-learn-play-together.kendsfabros.chatgpt.site.attacker.test','https://unknown.chatgpt.site','https://attacker.test']){const req=new Request('https://markup-arcade.kendsfabros.workers.dev/api/casual',{headers:{Origin:origin}});assert(!roomOriginAllowed(req));assert(!roomHeaders(req)['Access-Control-Allow-Origin']);assert(!trustedCasualOrigin(origin))}
});
