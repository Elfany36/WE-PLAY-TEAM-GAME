/** Browser regression against an already-running UI and room API; isolated QA rooms only.
 * BASE=http://127.0.0.1:5173 API_ORIGIN=http://127.0.0.1:8787 \
 * PLAYWRIGHT_MODULE=/path/to/playwright/index.mjs CHROMIUM_PATH=/usr/bin/chromium \
 * node scripts/verify-pirate-brawl.mjs
 */
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {dirname} from 'node:path';

const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.BASE||'http://127.0.0.1:5173',origin=process.env.API_ORIGIN||'http://127.0.0.1:8787',api=origin+'/api/casual';
const output=process.env.RESULTS||'work/pirate-browser.json',rows=[];
await mkdir(dirname(output),{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function post(body,token,expected=200){
 const r=await fetch(api,{method:'POST',headers:{'content-type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify({...body,requestId:crypto.randomUUID()})});
 const d=await r.json();assert.equal(r.status,expected,d.error||JSON.stringify({status:r.status}));return d;
}
async function get(session){const r=await fetch(api+'?code='+session.room.code,{headers:{Authorization:'Bearer '+session.token}});assert(r.ok);return(await r.json()).room}
async function until(fn,message,timeout=7000){const end=Date.now()+timeout;while(Date.now()<end){const value=await fn();if(value)return value;await wait(45)}throw Error(message)}
async function open(session,{width=1440,latency=0}={}){
 const context=await browser.newContext({viewport:{width,height:1100},hasTouch:width<600});
 await context.addInitScript(s=>sessionStorage.setItem('markup-casual-session',JSON.stringify(s)),{token:session.token,code:session.room.code,apiOrigin:origin});
 const page=await context.newPage(),errors=[],packets=[],media=[],latencies=[];
 page.setDefaultTimeout(12000);page.on('pageerror',e=>errors.push(e.message));
 const record=payload=>{try{const outer=JSON.parse(payload),p=outer.body||outer.payload||outer;if(p.action==='pirate-input')packets.push({seq:p.seq,life:p.life,dx:p.dx,jump:p.jump,jumpSeq:p.jumpSeq,attackSeq:p.attackSeq,specialSeq:p.specialSeq,dashSeq:p.dashSeq})}catch{}};
 page.on('request',r=>{if(r.url().endsWith('.ogg'))media.push(r.url());if(r.method()==='POST'&&r.url().includes('/api/casual'))record(r.postData())});
 page.on('websocket',s=>s.on('framesent',f=>record(f.payload.toString())));
 if(latency){
  await page.route('**/api/casual**',async route=>{const started=Date.now();await wait(latency/2);const response=await route.fetch();await wait(latency/2);latencies.push(Date.now()-started);await route.fulfill({response})});
  await page.routeWebSocket('**/api/casual**',ws=>{
   const server=ws.connectToServer();const delayed=send=>{let last=0;return message=>{last=Math.max(last+1,Date.now()+latency/2+Math.random()*12);setTimeout(()=>send(message),Math.max(0,last-Date.now()))}};
   ws.onMessage(delayed(m=>server.send(m)));server.onMessage(delayed(m=>ws.send(m)));
  });
 }
 await page.goto(base+'/#casual-arcade');await page.locator('.pirate-canvas').waitFor();
 await page.locator('.pirate-loading').waitFor({state:'detached'});
 return{context,page,errors,packets,media,latencies};
}
async function close(session){if(session)await post({action:'leave',code:session.room.code},session.token).catch(()=>{})}
async function caseRun(name,fn){if(process.env.CASES&&!new RegExp(process.env.CASES).test(name))return;const row={name,checks:[]};try{await fn(row);row.status='passed'}catch(e){row.status='failed';row.error=e.message}rows.push(row);console.log(JSON.stringify(row));await writeFile(output,JSON.stringify(rows,null,2))}

try{
 for(const latency of [0,90,400])await caseRun('Online controls · '+latency+' ms injected round trip',async row=>{
  let host,guest,view;
  try{
   host=await post({action:'create',mode:'pirate',name:'Pirate controls QA',bots:0,pirateMap:'galleon-deck',pirateStocks:5},undefined,201);
   guest=await post({action:'join',code:host.room.code,name:'Second pirate QA'});
   await post({action:'start',code:host.room.code},host.token);view=await open(host,{latency});const {page,packets}=view;
   await until(async()=>{const r=await get(host);return r.serverNow>r.game.startAt+1000&&r},'Countdown did not finish');
   const arena=page.locator('.pirate-canvas'),actor=r=>r.game.world.fighters.find(f=>f.id===r.youId);
   await arena.focus();const before=actor(await get(host));await page.keyboard.down('KeyD');await wait(420);await page.keyboard.up('KeyD');
   await until(async()=>actor(await get(host)).x>before.x+20,'Keyboard movement did not reach the authority');
   const tap=async(code,edge)=>{await arena.focus();const count=packets.length;await page.keyboard.press(code,{delay:10});await until(()=>packets.slice(count).some(p=>p[edge]>0),'No '+edge+' packet');const receipt=Math.max(...packets.slice(count).map(p=>p[edge]||0));await until(async()=>actor(await get(host))[edge]>=receipt,edge+' was lost before simulation');};
   await tap('Space','jumpSeq');await tap('KeyF','attackSeq');await tap('KeyG','specialSeq');await tap('ShiftLeft','dashSeq');row.checks.push('movement and four short-tap receipts reach room authority');
   await page.getByRole('button',{name:'Customize controls',exact:true}).first().click();const dialog=page.locator('.controls-dialog[open]');
   await dialog.getByRole('button',{name:'Change Melee attack key'}).click();await page.keyboard.press('KeyB');await dialog.getByRole('button',{name:'Done',exact:false}).click();
   await tap('KeyB','attackSeq');row.checks.push('saved remapping controls the online pirate');
   await arena.focus();await page.keyboard.down('KeyD');await wait(150);await page.getByRole('button',{name:'Customize controls',exact:true}).first().click();await page.keyboard.up('KeyD');
   await until(()=>packets.at(-1)?.dx===0,'Opening settings did not release movement');await wait(latency+500);const stopped=actor(await get(host)).x;await wait(250);assert(Math.abs(actor(await get(host)).x-stopped)<3,'Movement stayed held after opening settings');
   await dialog.getByRole('button',{name:'Reset controls',exact:false}).click();await dialog.getByRole('button',{name:'Save preferences',exact:false}).click();await dialog.getByRole('button',{name:'Done',exact:false}).click();row.checks.push('settings release held controls; reset and save work');
   await arena.focus();await page.keyboard.press('KeyP');await until(async()=>(await get(host)).phase==='paused','Host pause shortcut failed');
   await page.locator('.pirate-board').getByRole('button',{name:'Resume',exact:true}).click();await until(async()=>(await get(host)).phase==='playing','Resume failed');row.checks.push('native pause and resume');
   assert.equal(view.media.length,0,'Music should not download before opt-in');assert.deepEqual(view.errors,[]);assert(!await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1));
   row.packets=packets.length;row.mediaRequests=view.media.length;if(view.latencies.length)row.httpRoundTripMs={min:Math.min(...view.latencies),max:Math.max(...view.latencies)};
  }finally{await view?.context.close();await close(guest);await close(host)}
 });

 await caseRun('Spectator cannot control; can resume when host disconnects',async row=>{
  let host,guest,watcher,view;
  try{
   host=await post({action:'create',mode:'pirate',name:'Host QA',bots:0},undefined,201);guest=await post({action:'join',code:host.room.code,name:'Guest QA'});watcher=await post({action:'join',code:host.room.code,name:'Spectator QA',role:'spectator'});
   await post({action:'start',code:host.room.code},host.token);await post({action:'pause',code:host.room.code},host.token);await post({action:'disconnect',code:host.room.code},host.token);view=await open(watcher,{width:390});
   assert.equal(await view.page.locator('.pirate-touch-controls').count(),0);await view.page.locator('.pirate-board').getByRole('button',{name:'Resume',exact:true}).click();await until(async()=>(await get(watcher)).phase==='playing','Spectator could not resume an absent host’s arena');
   const r=await get(watcher);await post({action:'pirate-input',code:r.code,round:r.round,seq:Date.now(),life:0,dx:1,down:false,jump:false,attack:false,special:false,dash:false,jumpSeq:0,attackSeq:0,specialSeq:0,dashSeq:0},watcher.token,403);
   assert.deepEqual(view.errors,[]);row.checks.push('mobile spectator has no controls','absent-host resume is visible and works','forged controls rejected');
  }finally{await view?.context.close();await close(watcher);await close(guest);await close(host)}
 });

 await caseRun('Touch multi-input and a gamepad connected as controller two',async row=>{
  let host,guest,view;
  try{
   host=await post({action:'create',mode:'pirate',name:'Touch QA',bots:0,pirateMap:'galleon-deck',pirateStocks:5},undefined,201);guest=await post({action:'join',code:host.room.code,name:'Guest QA'});await post({action:'start',code:host.room.code},host.token);view=await open(host,{width:390});
   const {page,packets}=view,arena=page.locator('.pirate-canvas'),actor=r=>r.game.world.fighters.find(f=>f.id===r.youId);
   await until(async()=>{const r=await get(host);return r.serverNow>r.game.startAt+1000},'Countdown did not finish');
   const right=await page.getByRole('button',{name:'Pirate move right',exact:true}).boundingBox(),jump=await page.getByRole('button',{name:'Pirate jump',exact:true}).boundingBox(),cdp=await view.context.newCDPSession(page),center=(box,id)=>({x:box.x+box.width/2,y:box.y+box.height/2,id});
   const count=packets.length;await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[center(right,1),center(jump,2)]});await wait(250);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
   await until(()=>packets.slice(count).some(p=>p.dx===1&&p.jumpSeq>0),'Touch direction and jump could not be held together');await until(()=>packets.at(-1)?.dx===0,'Touch release did not clear movement');row.checks.push('two touch pointers hold direction and jump independently');
   await page.evaluate(()=>{window.pirateTestPad={axes:[1,0],buttons:Array.from({length:16},()=>({pressed:false,value:0})),index:1,id:'QA controller',connected:true,mapping:'standard'};Object.defineProperty(navigator,'getGamepads',{value:()=>[null,window.pirateTestPad],configurable:true})});
   await arena.focus();const before=actor(await get(host)).x;await until(async()=>actor(await get(host)).x>before+10,'Controller two was not assigned to the first human seat');
   await page.evaluate(()=>window.pirateTestPad.axes[0]=0);await until(()=>packets.at(-1)?.dx===0,'Neutral gamepad did not release movement');
   await page.evaluate(()=>window.pirateTestPad=null);row.checks.push('controller index one can drive player one','neutral/disconnected gamepad releases movement');assert.deepEqual(view.errors,[]);
  }finally{await view?.context.close();await close(guest);await close(host)}
 });

 await caseRun('Four local players have independent optional customization and controls',async row=>{
  const context=await browser.newContext({viewport:{width:1440,height:1100}}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  try{
   await page.goto(base+'/#casual-arcade');await page.getByLabel('Search arcade games').fill('pirate');await page.locator('.party-game-card').click();await page.getByLabel('Computer opponent count').selectOption('0');await page.getByLabel('Local player count').selectOption('4');await page.getByRole('button',{name:'Play locally',exact:true}).click();
   const crew=page.locator('.pirate-lobby-crew');assert.equal(await crew.getByRole('button',{name:'Customize character',exact:true}).count(),3);await crew.getByRole('button',{name:'Customize character',exact:true}).first().click();const dialog=page.locator('.appearance-dialog[open]');assert.equal(await dialog.locator('.appearance-models button').count(),15);assert.equal(await dialog.locator('.appearance-colors button').count(),24);await dialog.locator('.appearance-models button').last().click();await dialog.getByRole('button',{name:'Close character customization'}).click();
   await crew.getByRole('button',{name:'Customize controls',exact:true}).first().click();const controls=page.locator('.controls-dialog[open]');await controls.getByRole('button',{name:'Change Melee attack key'}).click();await page.keyboard.press('KeyB');await controls.getByRole('button',{name:'Done',exact:false}).click();
   const preferences=await page.evaluate(()=>JSON.parse(localStorage.getItem('markup-controls-v25')));assert.equal(preferences['pirate-local-2'].attack,'KeyB');assert(!preferences.pirate);row.checks.push('15 models / 24 colors for a guest','guest remapping is saved separately');
   await page.getByRole('button',{name:'Start game',exact:false}).click();await page.locator('.pirate-canvas').waitFor();await page.locator('.pirate-loading').waitFor({state:'detached'});assert.equal(await page.locator('.pirate-crew-card').count(),4);await wait(3200);await page.locator('.pirate-canvas').focus();
   for(const code of ['KeyD','ArrowLeft','KeyJ','Numpad6']){await page.keyboard.down(code);await wait(90);await page.keyboard.up(code)}
   assert.equal(await page.locator('[role=search]').filter({visible:true}).count(),0);await page.locator('.pirate-settings summary').click();assert.equal(await page.getByLabel('Pirate touch player').locator('option').count(),4);assert.deepEqual(errors,[]);row.checks.push('default start with four human seats','four keyboard profiles and per-player touch selector');
  }finally{await context.close()}
 });

 const maps=['seaside-cove','castle-keep','meadow-run','sunken-ruins','galleon-deck','twin-islands','ice-floes','thunder-reef'],modes=['classic','spells','bomb-party','stomp','ko-race','hot-potato','chaos'];
 for(const width of [390,1440])for(let i=0;i<maps.length;i++)await caseRun('Arena render · '+maps[i]+' · '+modes[i%modes.length]+' · '+width,async row=>{
  let session,view;
  try{
   session=await post({action:'create',mode:'pirate',name:'Map QA',pirateMap:maps[i],pirateMode:modes[i%modes.length],bots:2},undefined,201);await post({action:'start',code:session.room.code},session.token);view=await open(session,{width});
   await view.page.locator('.pirate-settings summary').click();await view.page.getByLabel('Pirate graphics quality').selectOption(i%2?'low':'high');await view.page.locator('.pirate-settings summary').click();await wait(100);
   assert.equal(await view.page.locator('.pirate-crew-card').count(),3);assert(!await view.page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1));assert.deepEqual(view.errors,[]);assert.equal(view.media.length,0);
   if(i===0){await wait(3200);await view.page.locator('.pirate-board').screenshot({path:output.replace(/\.json$/,'')+'-'+width+'.png'})}
   row.checks.push('decoded sprites and map','native HUD/settings','no page overflow or runtime errors','audio remains lazy');
  }finally{await view?.context.close();await close(session)}
 });
}finally{await browser.close()}
if(rows.some(row=>row.status!=='passed'))process.exitCode=1;
