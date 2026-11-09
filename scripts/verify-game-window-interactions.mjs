/** Uses isolated online rooms against an already-running UI and API.
 * BASE=http://127.0.0.1:5173 API_ORIGIN=http://127.0.0.1:8787 \
 * PLAYWRIGHT_MODULE=/path/to/playwright/index.mjs CHROMIUM_PATH=/usr/bin/chromium \
 * node scripts/verify-game-window-interactions.mjs
 */
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {dirname} from 'node:path';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.BASE||'http://127.0.0.1:5173',origin=process.env.API_ORIGIN||base,api=origin+'/api/casual',output=process.env.RESULTS||'work/game-window-interactions.json',rows=[];
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
await mkdir(dirname(output),{recursive:true});
async function post(body,token){const r=await fetch(api,{method:'POST',headers:{'content-type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify({...body,requestId:crypto.randomUUID()})});const d=await r.json();assert(r.ok,d.error);return d}
async function get(s){const r=await fetch(api+'?code='+s.room.code,{headers:{Authorization:'Bearer '+s.token}});assert(r.ok);return(await r.json()).room}
async function until(fn,message){const end=Date.now()+10000;while(Date.now()<end){if(await fn())return;await new Promise(r=>setTimeout(r,50))}throw Error(message)}
const actor=r=>r.game.world.fighters.find(f=>f.id===r.youId);
for(const [width,http]of [[1440,false],[390,false],[1440,true]]){
 const height=width<600?844:900,c=await browser.newContext({viewport:{width,height},hasTouch:width<600}),p=await c.newPage(),errors=[],row={width,http,checks:[]};let host,guest;
 p.setDefaultTimeout(10000);p.on('pageerror',e=>errors.push(e.message));
 try{
  host=await post({action:'create',mode:'pirate',name:'Fullscreen QA',bots:0,pirateStocks:5,pirateMap:'galleon-deck'});guest=await post({action:'join',code:host.room.code,name:'Second seat QA'});await post({action:'start',code:host.room.code},host.token);
  await c.addInitScript(({session,fallback,http})=>{
   sessionStorage.setItem('markup-casual-session',JSON.stringify(session));
   if(fallback)Element.prototype.requestFullscreen=()=>Promise.reject(new DOMException('QA embedded browser','NotAllowedError'));
   const NativeSocket=WebSocket;window.qaSockets=[];
   window.WebSocket=class extends NativeSocket{constructor(...args){if(http&&String(args[0]).includes('/api/casual'))throw new DOMException('QA HTTP fallback','NetworkError');super(...args);if(String(args[0]).includes('/api/casual'))window.qaSockets.push(this)}};
  },{session:{token:host.token,code:host.room.code,apiOrigin:origin},fallback:width<600,http});
  await p.goto(base+'/#casual-arcade');const canvas=p.locator('.pirate-canvas');await canvas.waitFor();await p.locator('.pirate-loading').waitFor({state:'detached'});
  const normal=await p.locator('.room-shell').getAttribute('style'),stored=await p.evaluate(()=>localStorage.getItem('markup-panel-layout-v19')),round=(await get(host)).round;
  await p.evaluate(()=>window.qaCanvas=document.querySelector('.pirate-canvas'));
  await p.getByRole('button',{name:'Fullscreen',exact:true}).click();await p.locator('.is-immersive').waitFor();
  assert(await p.evaluate(()=>window.qaCanvas===document.querySelector('.pirate-canvas')));
  assert.equal(await p.evaluate(()=>!!document.fullscreenElement),width>=600);
  assert(!await p.locator('.pirate-touch-controls').isVisible());
  row.checks.push('native/fallback fullscreen retains the same canvas and round; controls start hidden');
  const actions=p.locator('.game-window-actions'),menu=()=>p.getByRole('button',{name:'Open game menu',exact:true}).click(),closeMenu=()=>p.getByRole('button',{name:'Close game menu',exact:true}).click();
  for(const name of ['leaderboard','chat']){const hide=actions.getByRole('button',{name:'Hide '+name,exact:true});if(await hide.isVisible())await hide.click()}
  await menu();await p.getByLabel('Pirate camera',{exact:true}).selectOption('arena');await p.getByLabel('Pirate graphics quality',{exact:true}).selectOption('low');await p.getByRole('checkbox',{name:'Show game controls',exact:true}).check();await closeMenu();
  assert(await p.locator('.pirate-touch-controls').isVisible());await menu();await p.getByRole('checkbox',{name:'Show game controls',exact:true}).uncheck();await closeMenu();
  await actions.getByRole('button',{name:'Show chat',exact:true}).click();const panel=p.getByLabel('Chat panel',{exact:true});await panel.waitFor({state:'visible'});
  assert(await p.getByLabel('Chat message',{exact:true}).evaluate(el=>el===document.activeElement));
  const before=await panel.boundingBox(),title=await panel.locator('.dock-panel-header strong').boundingBox();
  await p.mouse.move(title.x+title.width/2,title.y+title.height/2);await p.mouse.down();await p.mouse.move(Math.max(50,title.x-200),155,{steps:8});await p.mouse.up();
  const moved=await panel.boundingBox();assert(Math.abs(moved.x-before.x)+Math.abs(moved.y-before.y)>30);
  const move=panel.getByRole('button',{name:'Move or resize chat',exact:true});await move.focus();await p.keyboard.press('ArrowRight');
  const resize=panel.getByRole('button',{name:'Resize chat panel',exact:true});await resize.focus();await p.keyboard.press('ArrowDown');
  const resized=await panel.boundingBox();assert(resized.height>=moved.height);
  await p.setViewportSize({width:844,height:390});await p.waitForTimeout(120);const rotated=await panel.boundingBox();assert(rotated.x>=8&&rotated.y>=64&&rotated.x+rotated.width<=836&&rotated.y+rotated.height<=382);
  await p.setViewportSize({width,height});await p.getByLabel('Chat message',{exact:true}).fill('Fullscreen chat QA');await p.getByRole('button',{name:'Send chat message',exact:true}).click();await panel.getByText('Fullscreen chat QA',{exact:true}).waitFor();
  await actions.getByRole('button',{name:'Hide chat',exact:true}).click();row.checks.push('chat drag, keyboard move/resize, rotation clamping, focus and delivery');
  await menu();await p.locator('.game-window-menu').getByRole('button',{name:'Customize controls',exact:true}).click();const dialog=p.locator('.controls-dialog[open]');await dialog.waitFor();await p.keyboard.press('Escape');await dialog.waitFor({state:'hidden'});assert(await p.locator('.is-immersive').isVisible());await closeMenu();
  await actions.getByRole('button',{name:'Pause game',exact:true}).click();await actions.getByRole('button',{name:'Resume game',exact:true}).click();await until(async()=>{const r=await get(host);return r.phase==='playing'&&r.serverNow>r.game.startAt+100},'Resume countdown did not finish');
  if(!http){await p.evaluate(()=>window.qaSockets.forEach(s=>s.close()));await until(()=>p.evaluate(()=>window.qaSockets.some(s=>s.readyState===WebSocket.OPEN)),'Room stream did not reconnect');row.checks.push('room stream reconnects without leaving fullscreen')}
  await canvas.focus();const x=actor(await get(host)).x;await p.keyboard.down('KeyD');await p.waitForTimeout(400);await p.keyboard.up('KeyD');await until(async()=>actor(await get(host)).x>x+12,'Fullscreen movement did not reach the room');
  row.checks.push('native settings dialog, pause/resume and authoritative controls'+(http?' over HTTP fallback':''));
  await actions.getByRole('button',{name:'Exit fullscreen',exact:true}).click();await p.locator('.is-immersive').waitFor({state:'detached'});await p.locator('.surface-toolbar').waitFor({state:'visible'});
  assert.equal(await p.locator('.room-shell').getAttribute('style'),normal);assert.equal(await p.evaluate(()=>localStorage.getItem('markup-panel-layout-v19')),stored);assert(await p.evaluate(()=>window.qaCanvas===document.querySelector('.pirate-canvas')));assert.equal((await get(host)).round,round);
  await p.locator('.pirate-settings summary').click();assert.equal(await p.getByLabel('Pirate camera',{exact:true}).inputValue(),'arena');assert.equal(await p.getByLabel('Pirate graphics quality',{exact:true}).inputValue(),'low');assert(await p.locator('.pirate-touch-controls').isVisible());assert.deepEqual(errors,[]);
  row.checks.push('exit restores website controls and normal dock layout; saved preferences survive');row.status='passed';
 }catch(e){row.status='failed';row.error=e.message;row.errors=errors;await p.screenshot({path:output.replace(/\.json$/,'')+'-'+width+(http?'-http':'')+'.png'}).catch(()=>{})}
 finally{await c.close();for(const s of [guest,host])if(s)await post({action:'leave',code:s.room.code},s.token).catch(()=>{})}
 rows.push(row);console.log(JSON.stringify(row));await writeFile(output,JSON.stringify(rows,null,2));
}
await browser.close();if(rows.some(r=>r.status!=='passed'))process.exitCode=1;
