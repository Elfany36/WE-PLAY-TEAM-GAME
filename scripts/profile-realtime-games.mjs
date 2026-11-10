/** Bounded browser/DO measurement. Keep loading, frame, input receipt and simulation age separate. */
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { applyRoomDelta } from '../lib/room-delta.ts';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright'), base = process.env.BASE || 'http://127.0.0.1:4180', origin = process.env.API_ORIGIN || base, api = origin + '/api/casual', out = process.env.RESULTS || 'work/realtime-v35/browser-before.json', rows = [], wait = ms => new Promise(r => setTimeout(r, ms)), stats = a => { a = a.filter(Number.isFinite).sort((a, b) => a - b); return { samples: a.length, p50: a[Math.floor(a.length * .5)] ?? null, p95: a[Math.floor(a.length * .95)] ?? null, max: a.at(-1) ?? null }; }, browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox'] });
mkdirSync(dirname(out), { recursive: true });
const selectors = { snake: '.snake-stadium canvas', tanks: '.club-arena canvas', sumo: '.club-arena canvas', pong: '.club-arena canvas', marble: '.club-arena canvas', blocks: '.blocks-arena canvas', circuit: '.action-world canvas', terra: '.action-world canvas', memory: '.memory-deck', chess: '.strategy-board', sketch: '.sketch-board' }, controlKinds = new Set(['direction', 'drive', 'explore', 'party-control', 'block-input', 'pirate-input', 'sketch-stroke', 'sketch-strokes']);
async function post(body, token) { const r = await fetch(api, { method: 'POST', headers: { 'content-type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) }, body: JSON.stringify({ ...body, requestId: crypto.randomUUID() }) }); const d = await r.json(); assert(r.ok, d.error); return d; }
for (const mode of (process.env.GAMES || 'snake,tanks,sumo,blocks,circuit,terra,sketch,memory,chess').split(',')) {
    let host, peer, c;
    const row = { game: mode, cpuThrottle: Number(process.env.CPU || 4), injectedRoundTripMs: Number(process.env.DELAY || 0) };
    try {
        host = await post({ action: 'create', mode, name: 'Realtime QA', bots: mode === 'sumo' ? 0 : mode === 'chess' ? 1 : 3, speed: 175, battle: true, arcadeV2: true, matchRounds: 0, blockPace: 'expert', sumoFormat: 'classic', cards: 32, arena: 'garden' });
        if (mode === 'sumo')
            peer = await post({ action: 'join', code: host.room.code, name: 'Second wrestler QA' });
        let started = await post({ action: 'start', code: host.room.code }, host.token);
        if (mode === 'sketch' && started.room.game.artistId === started.room.youId)
            await post({ action: 'sketch-choose', code: host.room.code, round: started.room.round, turn: started.room.game.turn, choice: 0 }, host.token);
        c = await browser.newContext({ viewport: { width: 1440, height: 950 } });
        await c.addInitScript(s => {
            sessionStorage.setItem('markup-casual-session', JSON.stringify(s));
            localStorage.setItem('markup-motion-debug', '1');
            window.profileFrames = [];
            let prior = 0;
            requestAnimationFrame(function tick(t) {
                if (prior)
                    window.profileFrames.push(t - prior);
                prior = t;
                requestAnimationFrame(tick);
            });
        }, { token: host.token, code: host.room.code, apiOrigin: origin });
        if (process.env.CANVAS)
            await c.addInitScript(option => { const get = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function (type, options) { return get.call(this, type, type === '2d' ? { ...options, ...(option === 'desync' ? { desynchronized: true } : { willReadFrequently: true }) } : options); }; }, process.env.CANVAS);
        const p = await c.newPage(), cdp = await c.newCDPSession(p), errors = [], sizes = [], ages = [], ack = [], server = [], bases = new Map(), sent = new Map(), poseAck = [], seqAt = new Map();
        let measuring = false, room, lastSeq = 0;
        p.setDefaultTimeout(20000);
        p.on('pageerror', e => errors.push(e.message));
        await cdp.send('Performance.enable');
        await cdp.send('Emulation.setCPUThrottlingRate', { rate: row.cpuThrottle });
        const capture = text => {
            let v;
            try {
                v = JSON.parse(text);
            }
            catch {
                return;
            }
            const body = v.body || v;
            if (v.type === 'request')
                sent.set(v.id, { at: Date.now(), body });
            if (controlKinds.has(body.action) && measuring)
                seqAt.set(body.seq, Date.now());
        };
        p.on('websocket', ws => {
            ws.on('framesent', f => capture(f.payload.toString()));
            ws.on('framereceived', f => {
                let v;
                try {
                    v = JSON.parse(f.payload.toString());
                }
                catch {
                    return;
                }
                if (v.type === 'response' && sent.has(v.id)) {
                    const a = sent.get(v.id);
                    sent.delete(v.id);
                    if (measuring && controlKinds.has(a.body.action)) {
                        ack.push(Date.now() - a.at);
                        server.push(v.data?.clock?.sentAt - v.data?.clock?.receivedAt);
                    }
                }
                const d = v.data;
                if (!d || !d.room && !d.patch)
                    return;
                let r = d.room;
                if (d.patch) {
                    const b = bases.get(d.baseSnapshot);
                    if (!b)
                        return;
                    r = applyRoomDelta(b, d.patch);
                }
                if (d.snapshotId)
                    bases.set(d.snapshotId, r);
                while (bases.size > 128)
                    bases.delete(bases.keys().next().value);
                room = r;
                if (!measuring || v.type !== 'state')
                    return;
                sizes.push(f.payload.length);
                if (r.game?.lastTickAt)
                    ages.push(Date.now() - r.game.lastTickAt);
                const g = r.game, seq = mode === 'snake' ? g.worms.find(w => w.id === r.youId)?.inputAck : mode === 'blocks' ? g.boards.find(b => b.id === r.youId)?.seq : g.inputs?.[r.youId]?.seq;
                if (seq > lastSeq && seqAt.has(seq)) {
                    poseAck.push(Date.now() - seqAt.get(seq));
                    lastSeq = seq;
                }
            });
        });
        const delay = row.injectedRoundTripMs;
        if (delay) {
            await p.routeWebSocket('**/api/casual**', ws => { const s = ws.connectToServer(); const pipe = target => { let due = 0; return m => { due = Math.max(due + 1, Date.now() + delay / 2); setTimeout(() => target.send(m), Math.max(0, due - Date.now())); }; }; ws.onMessage(pipe(s)); s.onMessage(pipe(ws)); });
            await p.route('**/api/casual**', async (route) => { await wait(delay / 2); const r = await route.fetch(); await wait(delay / 2); await route.fulfill({ response: r }); });
        }
        await p.goto(base + '/#casual-arcade');
        await p.locator(selectors[mode]).first().waitFor();
        await p.getByRole('button', { name: 'Fullscreen', exact: true }).click();
        if (process.env.LAYER)
            await p.addStyleTag({ content: 'canvas{transform:translateZ(0);backface-visibility:hidden}' });
        await wait(3300);
        if (mode === 'sketch')
            await p.locator('.sketch-canvas').waitFor();
        const canvas = p.locator('canvas[tabindex]').first();
        if (await canvas.count())
            await canvas.focus();
        await p.evaluate(() => {
            window.profileFrames = [];
            for (const c of document.querySelectorAll('canvas'))
                if (c.motionTrace)
                    c.motionTrace = [];
        });
        const before = Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(m => [m.name, m.value]));
        const start = Date.now();
        measuring = true;
        const traceEvents = [];
        if (process.env.TRACE) {
            cdp.on('Tracing.dataCollected', e => traceEvents.push(...e.value));
            await cdp.send('Tracing.start', { categories: 'devtools.timeline,blink,cc,disabled-by-default-devtools.timeline', transferMode: 'ReportEvents' });
        }
        if (process.env.PROFILE) {
            await cdp.send('Profiler.enable');
            await cdp.send('Profiler.start');
        }
        for (let i = 0; i < 8; i++) {
            if (mode === 'snake') {
                const w = room?.game.worms.find(w => w.id === room.youId), next = { up: 'ArrowRight', right: 'ArrowDown', down: 'ArrowLeft', left: 'ArrowUp' }[w?.direction || 'right'];
                await p.keyboard.press(next);
                await wait(650);
            }
            else if (['tanks', 'sumo', 'pong', 'marble', 'circuit', 'terra'].includes(mode)) {
                const key = mode === 'pong' ? (i % 2 ? 'KeyW' : 'KeyS') : i % 2 ? 'KeyA' : 'KeyD';
                await p.keyboard.down(key);
                if (mode === 'circuit')
                    await p.keyboard.down('KeyW');
                await wait(260);
                await p.keyboard.up(key);
                if (mode === 'circuit')
                    await p.keyboard.up('KeyW');
                await wait(370);
            }
            else if (mode === 'blocks') {
                await p.keyboard.press(i % 2 ? 'ArrowRight' : 'ArrowLeft');
                if (i % 3 === 2)
                    await p.keyboard.press('ArrowUp');
                await wait(630);
            }
            else if (mode === 'sketch' && await p.locator('.sketch-canvas.can-draw').count()) {
                const b = await p.locator('.sketch-canvas').boundingBox();
                await p.mouse.move(b.x + b.width * .25, b.y + b.height * .3 + i * 4);
                await p.mouse.down();
                await p.mouse.move(b.x + b.width * .65, b.y + b.height * .6 - i * 4, { steps: 12 });
                await p.mouse.up();
                await wait(600);
            }
            else
                await wait(630);
        }
        measuring = false;
        if (room?.game?.actors) {
            const own = room.game.actors.find(a => a.id === room.youId);
            row.actor = { phase: room.phase, format: room.settings.sumoFormat, alive: own?.alive, finishedAt: own?.finishedAt, x: own?.x, y: own?.y };
        }
        if (process.env.TRACE) {
            const done = new Promise(r => cdp.once('Tracing.tracingComplete', r));
            await cdp.send('Tracing.end');
            await done;
            const totals = new Map();
            for (const e of traceEvents)
                if (e.ph === 'X' && e.dur) {
                    const k = e.name + ' ' + e.tid;
                    totals.set(k, (totals.get(k) || 0) + e.dur);
                }
            row.traceTotals = [...totals.entries()].sort((a, b) => b[1] - a[1]).slice(0, 30);
            writeFileSync(out + '.trace.json', JSON.stringify(traceEvents));
        }
        if (process.env.PROFILE) {
            const { profile } = await cdp.send('Profiler.stop'), counts = new Map(), nodes = new Map(profile.nodes.map(n => [n.id, n]));
            for (const id of profile.samples || []) {
                const n = nodes.get(id), key = n.callFrame.functionName + ' ' + n.callFrame.url.split('/').at(-1) + ':' + n.callFrame.lineNumber;
                counts.set(key, (counts.get(key) || 0) + 1);
            }
            row.cpuSamples = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15);
        }
        const sec = (Date.now() - start) / 1000, after = Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(m => [m.name, m.value])), traces = await p.evaluate(() => Array.from(document.querySelectorAll('canvas')).filter(c => c.motionTrace?.length).map(c => ({ frames: c.motionTrace, renderMs: c.dataset.renderMs, fps: c.dataset.renderFps }))), frameTimes = await p.evaluate(() => window.profileFrames);
        const trace = traces[0]?.frames;
        row.canvas = await p.locator(selectors[mode]).first().evaluate(n => n.tagName === 'CANVAS' ? { width: n.width, height: n.height, displayWidth: n.clientWidth, displayHeight: n.clientHeight, renderScale: n.dataset.renderScale, attributes: n.getContext('2d').getContextAttributes?.() } : undefined);
        Object.assign(row, { seconds: sec, mainThreadMsPerSecond: 1000 * (after.TaskDuration - before.TaskDuration) / sec, scriptMsPerSecond: 1000 * (after.ScriptDuration - before.ScriptDuration) / sec, layoutMsPerSecond: 1000 * (after.LayoutDuration - before.LayoutDuration) / sec, otherTaskMsPerSecond: 1000 * (after.TaskOtherDuration - before.TaskOtherDuration) / sec, heapMB: after.JSHeapUsedSize / 1048576, displayFrameMs: stats(frameTimes), paintFrameMs: stats(trace ? trace.slice(1).map((f, i) => f.at - trace[i].at) : []), inputReceiptMs: stats(ack), inputToAuthorityMs: stats(poseAck), serverWorkMs: stats(server), stateAgeMs: stats(ages), payloadBytesPerSecond: sizes.reduce((a, b) => a + b, 0) / sec, paintMs: traces[0]?.renderMs, errors, status: 'passed' });
        assert.deepEqual(errors, []);
    }
    catch (e) {
        row.status = 'failed';
        row.error = e.message.slice(0, 600);
    }
    finally {
        await c?.close();
        if (peer)
            await post({ action: 'leave', code: host.room.code }, peer.token).catch(() => { });
        if (host)
            await post({ action: 'leave', code: host.room.code }, host.token).catch(() => { });
    }
    rows.push(row);
    console.log(JSON.stringify(row));
    writeFileSync(out, JSON.stringify(rows, null, 2));
}
await browser.close();
if (rows.some(r => r.status === 'failed'))
    process.exitCode = 1;
