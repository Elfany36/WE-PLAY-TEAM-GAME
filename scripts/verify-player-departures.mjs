/** Verify a departed Snakes & Ladders player disappears from the rendered board. */
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {dirname} from 'node:path';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.BASE||'http://127.0.0.1:5173',origin=process.env.API_ORIGIN||base,output=process.env.RESULTS||'work/player-departures.json';
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']}),row={game:'ladders',check:'departed board tokens'};
const sessions=[];let context;
async function post(body,token){const r=await fetch(origin+'/api/casual',{method:'POST',headers:{'content-type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify({...body,requestId:crypto.randomUUID()})});const d=await r.json();assert(r.ok,d.error);return d}
try{
 const host=await post({action:'create',mode:'ladders',name:'Host QA',bots:0});sessions.push(host);
 const leaver=await post({action:'join',code:host.room.code,name:'Departing QA'});sessions.push(leaver);
 sessions.push(await post({action:'join',code:host.room.code,name:'Remaining QA'}));await post({action:'start',code:host.room.code},host.token);
 context=await browser.newContext({viewport:{width:390,height:1050}});await context.addInitScript(s=>sessionStorage.setItem('markup-casual-session',JSON.stringify(s)),{code:host.room.code,token:host.token,apiOrigin:origin});const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'/#casual-arcade');await page.locator('.ladder-board .sculpted-token').first().waitFor();assert.equal(await page.locator('.ladder-board .sculpted-token').count(),3);
 await post({action:'leave',code:host.room.code},leaver.token);sessions.splice(1,1);
 await page.waitForFunction(()=>!Array.from(document.querySelectorAll('.ladder-board .sculpted-token title')).some(t=>t.textContent.startsWith('Departing QA:')),{},{timeout:5000});
 assert.equal(await page.locator('.ladder-board .sculpted-token').count(),2);assert.deepEqual(errors,[]);row.status='passed';
}catch(error){row.status='failed';row.error=error.message}
finally{await context?.close();for(const s of sessions.reverse())await post({action:'leave',code:s.room.code},s.token).catch(()=>{});await browser.close()}
await mkdir(dirname(output),{recursive:true});await writeFile(output,JSON.stringify(row,null,2));console.log(JSON.stringify(row));if(row.status!=='passed')process.exitCode=1;
