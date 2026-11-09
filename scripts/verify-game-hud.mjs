/** The shared HUD toggle hides secondary information while retaining play controls. */
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {dirname} from 'node:path';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']}),base=process.env.BASE||'http://127.0.0.1:5173',output=process.env.RESULTS||'work/game-hud.json',rows=[];
await mkdir(dirname(output),{recursive:true});
for(const width of [320,390])for(const [game,selector,essential]of [['pirate','.pirate-crew-hud','.pirate-settings summary'],['solitaire','.solitaire-heading','.sol-playfield'],['generals','.tactical-board-legend','.generals-board'],['fleet','.tactical-board-legend','[data-grid="own"]'],['sketch','.sketch-artist','.sketch-word']]){
 const context=await browser.newContext({viewport:{width,height:1050}}),page=await context.newPage(),errors=[],row={game,width,checks:[]};page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(15000);
 try{
  await page.goto(base+'/#casual-arcade');await page.getByLabel('Search arcade games').fill(game);await page.locator('.party-game-card').first().click();await page.getByRole('button',{name:'Watch AI',exact:true}).click();await page.getByRole('button',{name:'Watch locally',exact:true}).click();await page.getByRole('button',{name:'Start game',exact:false}).click();await page.locator(selector).first().waitFor();
  await page.getByRole('button',{name:'Hide HUD',exact:true}).click();assert(!await page.locator(selector).first().isVisible());assert(await page.locator(essential).first().isVisible());row.checks.push('secondary HUD hides; essential controls stay visible');
  await page.getByRole('button',{name:'Show HUD',exact:true}).click();assert(await page.locator(selector).first().isVisible());row.checks.push('HUD restores');assert.deepEqual(errors,[]);assert(!await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1));row.status='passed';
 }catch(e){row.status='failed';row.error=e.message;row.errors=errors}
 finally{await context.close()}
 rows.push(row);console.log(JSON.stringify(row));await writeFile(output,JSON.stringify(rows,null,2));
}
await browser.close();if(rows.some(r=>r.status!=='passed'))process.exitCode=1;
