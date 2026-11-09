/**
 * Browser regression against an already-running UI and room API.
 * Run: BASE=http://127.0.0.1:5173 API_ORIGIN=http://127.0.0.1:8890 \
 *   PLAYWRIGHT_MODULE=/path/to/playwright/index.mjs CHROMIUM_PATH=/usr/bin/chromium \
 *   node --experimental-strip-types scripts/verify-solitaire-controls.mjs
 * Rooms are isolated and left on completion; no production room is touched.
 */
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {dirname} from 'node:path';
import {SOLITAIRE_VARIANTS,legalSolitaireMoves,solCards,solPairOptions} from '../lib/casual/solitaire.ts';

const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.BASE||'http://127.0.0.1:5173';
const origin=process.env.API_ORIGIN||base,api=origin+'/api/casual';
const output=process.env.RESULTS||'work/solitaire-controls.json';
const browser=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
const rows=[],fullscreen=process.env.FULLSCREEN==='1';
await mkdir(dirname(output),{recursive:true});
async function post(body,token){
 const response=await fetch(api,{method:'POST',headers:{'content-type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify({...body,requestId:crypto.randomUUID()})});
 const data=await response.json();assert(response.ok,data.error||String(response.status));return data;
}
async function get(session){const r=await fetch(api+'?code='+session.room.code,{headers:{Authorization:'Bearer '+session.token}});assert(r.ok);return(await r.json()).room}
const position=board=>JSON.stringify([board.columns,board.foundations,board.cells,board.stock,board.waste]);
const cell=to=>to.index+(to.zone==='foundation'?100:to.zone==='cell'?200:0);
const widths=(process.env.WIDTHS||'390,1440').split(',').map(Number);
const variants=(process.env.VARIANTS||SOLITAIRE_VARIANTS.join(',')).split(',');
for(const width of widths)for(const variant of variants){
 const touch=width<600,context=await browser.newContext({viewport:{width,height:fullscreen?(width<600?844:900):1100},hasTouch:touch});
 const page=await context.newPage(),errors=[],actions=[],row={variant,width,input:touch?'touch':'mouse',fullscreen,checks:[]};
 const touchSession=touch?await context.newCDPSession(page):null;
 let session;
 page.setDefaultTimeout(10000);page.on('pageerror',error=>errors.push(error.message));
 const record=payload=>{try{const outer=JSON.parse(payload),data=outer.body||outer.payload||outer;if(data.action?.startsWith('sol-'))actions.push({action:data.action,from:data.from,to:data.to,boardVersion:data.boardVersion})}catch{}};
 page.on('request',request=>{if(request.method()==='POST'&&request.url().includes('/api/casual'))record(request.postData())});
 page.on('websocket',socket=>socket.on('framesent',frame=>record(frame.payload.toString())));
 const card=ref=>page.locator('.sol-card[data-sol-zone="'+ref.zone+'"][data-sol-index="'+ref.index+'"]'+(ref.offset===undefined?'':'[data-sol-offset="'+ref.offset+'"]')).last();
 const destination=to=>page.locator('[data-sol-destination][data-cell="'+cell(to)+'"]');
 const click=async(locator,options={})=>touch?locator.tap(options):locator.click(options);
 const idle=()=>page.waitForFunction(()=>!Array.from(document.querySelectorAll('.solitaire-tools button')).find(b=>b.textContent==='Restart deal')?.disabled);
 async function changed(version){
  for(let n=0;n<100;n++){const room=await get(session),board=room.game.boards[room.youId];if(board.version>version){await page.waitForFunction(v=>Number(document.querySelector('.solitaire-table')?.getAttribute('data-board-version'))>v,version);await idle();return board}await page.waitForTimeout(50)}
  throw Error('Card action did not reach the authority after board version '+version);
 }
 async function undo(before){
  const room=await get(session),version=room.game.boards[room.youId].version;
  await click(page.getByRole('button',{name:'Undo',exact:true}));
  assert.equal(position(await changed(version)),position(before),'Undo must restore every pile');
 }
 async function target(to){
  const node=destination(to),place=node.locator('.sol-destination-button');
  await click(await place.count()?place:node.locator('button').last(),{position:{x:8,y:6}});
 }
 try{
  const shape=['pyramid','tripeaks'].includes(variant);
  let board;
  for(let n=0;n<20;n++){
   session=await post({action:'create',mode:'solitaire',name:'Card controls QA',solitaireVariant:variant,bots:0});
   const start=await post({action:'start',code:session.room.code},session.token);board=start.room.game.boards[start.room.youId];
   if(shape?solPairOptions(board,variant).length:legalSolitaireMoves(board,variant).some(m=>m.to.zone==='tableau'&&Math.abs(m.from.index-m.to.index)<=3))break;
   await post({action:'leave',code:session.room.code},session.token);session=null;
  }
  assert(session,'Could not find a playable test deal');
  await context.addInitScript(s=>{if(location.protocol==='http:'||location.protocol==='https:')sessionStorage.setItem('markup-casual-session',JSON.stringify(s))},{token:session.token,code:session.room.code,apiOrigin:origin});
  if(process.env.TRACE)await context.addInitScript(()=>{window.solitaireTrace=[];for(const type of ['pointerdown','pointerup','pointercancel','lostpointercapture','click','touchstart','touchend'])window.addEventListener(type,event=>{const button=event.target instanceof Element?event.target.closest('button'):null;window.solitaireTrace.push({type,target:button?.getAttribute('aria-label')||button?.textContent,disabled:button?.disabled,prevented:event.defaultPrevented,time:performance.now(),x:event.clientX,y:event.clientY,rect:button?.getBoundingClientRect().toJSON()});if(type==='pointerup'&&button?.textContent==='Undo')setTimeout(()=>window.solitaireTrace.push({type:'after-undo-tap',connected:button.isConnected,disabled:button.disabled,rect:button.getBoundingClientRect().toJSON(),hit:document.elementFromPoint(event.clientX,event.clientY)?.closest('button')?.textContent}),100)},true)});
  await page.goto(base+'/#casual-arcade');await page.locator('.solitaire-table').waitFor();await idle();await page.waitForTimeout(700);
  if(fullscreen){await page.getByRole('button',{name:'Fullscreen',exact:true}).click();await page.locator('.is-immersive').waitFor();await page.waitForTimeout(250)}
  await click(page.getByRole('button',{name:'Hint',exact:true}));
  if(shape){
   const pair=solPairOptions(board,variant)[0];assert(pair);
   assert.equal(await card(pair[0]).getAttribute('aria-pressed'),'true','Hint must select its card');
   await click(card(pair.at(-1)),{position:{x:8,y:6}});
   await changed(board.version);await undo(board);row.checks.push('hint + exposed-card removal + undo');
  }else{
   const moves=legalSolitaireMoves(board,variant),hint=moves.find(m=>m.to.zone==='foundation')||moves.find(m=>m.from.zone==='waste')||moves[0];
   assert.equal(await card(hint.from).getAttribute('aria-pressed'),'true','Hint must select its source card');
   assert(await destination(hint.to).evaluate(e=>e.classList.contains('move-target')),'Hint destination must accept the selected card');
   await target(hint.to);await changed(board.version);await undo(board);row.checks.push('hint selects a playable move');
   const move=moves.find(m=>m.to.zone==='tableau'&&Math.abs(m.from.index-m.to.index)<=3);assert(move);
   let room=await get(session);board=room.game.boards[room.youId];
   await click(card(move.from),{position:{x:8,y:6}});
   assert.equal(await card(move.from).getAttribute('aria-pressed'),'true');
   const column=destination(move.to);await column.scrollIntoViewIfNeeded();
   const box=await column.boundingBox(),blank={x:box.width/2,y:box.height-38};
   assert(await column.evaluate((e,point)=>{const r=e.getBoundingClientRect();return document.elementFromPoint(r.x+point.x,r.y+point.y)===e},blank),'Regression click must hit blank column space');
   await click(column,{position:blank});await changed(board.version);await undo(board);row.checks.push('select + blank column target + undo');

   // Enter and Space remain native card activations, never a stock draw.
   if(!touch){
    for(const key of ['Enter','Space']){
     room=await get(session);const before=room.game.boards[room.youId];
     await card(move.from).focus();await page.keyboard.press(key);
     assert.equal(await card(move.from).getAttribute('aria-pressed'),'true',key+' must select the focused card');
     assert.equal((await get(session)).game.boards[room.youId].version,before.version,key+' must not also draw stock');
     await destination(move.to).locator('.sol-destination-button').focus();await page.keyboard.press(key);
     await changed(before.version);await undo(before);
    }
    row.checks.push('Enter/Space card and destination controls');
   }
   room=await get(session);board=room.game.boards[room.youId];
   const source=card(move.from),dest=destination(move.to);
   await source.scrollIntoViewIfNeeded();
   // Keep both endpoints inside the playfield's clipping rectangle.
   await dest.evaluate((node,ref)=>{
    const field=node.closest('.sol-playfield'),source=document.querySelector('.sol-card[data-sol-zone="'+ref.zone+'"][data-sol-index="'+ref.index+'"][data-sol-offset="'+ref.offset+'"]');
    const f=field.getBoundingClientRect(),a=source.getBoundingClientRect(),z=node.getBoundingClientRect();
    const low=Math.max(a.right,z.right)-f.right+field.scrollLeft+3,high=Math.min(a.left,z.left)-f.left+field.scrollLeft-3;
    field.scrollLeft=Math.max(0,(low+high)/2);
   },move.from);
   const a=await source.boundingBox(),z=await dest.boundingBox();
   const start={x:a.x+a.width/2,y:a.y+6},end={x:z.x+z.width/2,y:z.y+Math.min(z.height/2,40)};
   const inside=await source.evaluate((node,point)=>document.elementFromPoint(point.x,point.y)?.closest('.sol-card')===node,start);
   assert(inside,'Drag must start on a visible source card');
   if(touch)await touchSession.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[start]});
   else{await page.mouse.move(start.x,start.y);await page.mouse.down()}
   for(let n=1;n<=12;n++){
    const point={x:start.x+(end.x-start.x)*n/12,y:start.y+(end.y-start.y)*n/12};
    if(touch)await touchSession.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[point]});else await page.mouse.move(point.x,point.y);
   }
   await page.locator('.sol-drag-preview').waitFor({state:'visible'});
   if(fullscreen)assert(await page.locator('.sol-drag-preview').evaluate(el=>!!el.closest('.is-immersive')),'Drag preview must remain inside the native fullscreen window');
   assert.equal(await page.locator('.sol-drag-preview img').count(),solCards(board,move.from).length,'Preview must show the whole moved run');
   if(touch)await touchSession.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});else await page.mouse.up();
   const after=await changed(board.version),cards=solCards(board,move.from);
   assert.deepEqual(after.columns[move.to.index].slice(-cards.length),cards);
   await undo(board);row.checks.push('visible drag preview + drop + undo');

   if(variant.startsWith('klondike')){
    let wasteMove;
    for(let n=0;n<28;n++){
     room=await get(session);board=room.game.boards[room.youId];wasteMove=legalSolitaireMoves(board,variant).find(m=>m.from.zone==='waste');
     if(wasteMove)break;
     await click(page.locator('.sol-stock'));await changed(board.version);
    }
    assert(wasteMove,'Expected at least one playable stock card');
    await click(card(wasteMove.from),{position:{x:8,y:6}});await target(wasteMove.to);
    await changed(board.version);await undo(board);row.checks.push('draw + move a waste card + undo');
   }
  }
  await click(page.getByRole('button',{name:'Restart deal',exact:true}));await idle();
  assert.equal(errors.length,0,errors.join('; '));
  assert(!await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),'Board must not overflow the page');
  row.status='passed';
 }catch(error){row.status='failed';row.error=error.message;row.errors=errors;row.actions=actions;row.alerts=await page.locator('[role=alert]').allTextContents();if(process.env.TRACE)row.trace=await page.evaluate(()=>window.solitaireTrace);await page.screenshot({path:output.replace(/\.json$/,'')+'-'+variant+'-'+width+'.png'}).catch(()=>{})}
 finally{await context.close();if(session)await post({action:'leave',code:session.room.code},session.token).catch(()=>{})}
 rows.push(row);console.log(JSON.stringify(row));await writeFile(output,JSON.stringify(rows,null,2));
}
await browser.close();if(rows.some(row=>row.status!=='passed'))process.exitCode=1;
