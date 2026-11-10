/** Two real browser clients against local Workers/DOs, with optional WAN delay.
 * BASE, RESULTS, DELAY (round-trip milliseconds), BASELINE=1 and FAULT=1.
 * Prints measurements and assertions only; room credentials stay in memory.
 */
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { applyRoomDelta } from '../lib/room-delta.ts';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.BASE || 'http://127.0.0.1:4203', lag = Number(process.env.DELAY || 200), out = process.env.RESULTS || 'work/realtime-v35/drawing-live.json';
const wait = ms => new Promise(resolve => setTimeout(resolve, ms)), sessions = [], contexts = [], errors = [], report = { roundTripDelayMs: lag, baseline: !!process.env.BASELINE };
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox'] });
async function post(body, token) { const r = await fetch(base + '/api/casual', { method: 'POST', headers: { 'content-type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) }, body: JSON.stringify({ requestId: crypto.randomUUID(), ...body }) }); return { status: r.status, ...await r.json() }; }
async function until(check, timeout = 10000) { const start = Date.now(); while (!await check()) {
    assert(Date.now() - start < timeout, 'Timed out waiting for committed drawing state');
    await wait(10);
} }
async function client(session, artist = false) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 950 } });
    contexts.push(context);
    await context.addInitScript(s => sessionStorage.setItem('markup-casual-session', JSON.stringify(s)), { token: session.token, code: session.room.code, apiOrigin: base });
    const page = await context.newPage(), stream = { room: null, requests: [], errors: [], bases: new Map(), injected: 0, httpFallbacks: 0 };
    page.on('pageerror', e => errors.push(e.message));
    const actions = new Map();
    const receive = message => {
        let value;
        try {
            value = JSON.parse(message.toString());
        }
        catch {
            return;
        }
        if (value.type === 'response' && value.status >= 400)
            stream.errors.push({ action: actions.get(value.id), status: value.status, error: value.data?.error });
        const data = value.data;
        if (!data)
            return;
        let room = data.room;
        if (data.patch) {
            const prior = stream.bases.get(data.baseSnapshot);
            if (!prior)
                return;
            room = applyRoomDelta(prior, data.patch);
        }
        if (!room)
            return;
        if (data.snapshotId)
            stream.bases.set(data.snapshotId, room);
        while (stream.bases.size > 128)
            stream.bases.delete(stream.bases.keys().next().value);
        if (!stream.room || (room.revision || 0) >= (stream.room.revision || 0))
            stream.room = room;
    };
    await page.routeWebSocket('**/api/casual**', socket => {
        const server = socket.connectToServer();
        let sendAt = 0, receiveAt = 0;
        socket.onMessage(message => { let value; try {
            value = JSON.parse(message.toString());
        }
        catch { } if (value?.type === 'request') {
            actions.set(value.id, value.body?.action);
            if (value.body?.action?.startsWith('sketch-stroke'))
                stream.requests.push({ action: value.body.action, segments: value.body.segments?.length || 1, at: Date.now() });
        } sendAt = Math.max(sendAt + 1, Date.now() + lag / 2); setTimeout(() => { try {
            server.send(message);
        }
        catch { } }, Math.max(0, sendAt - Date.now())); });
        server.onMessage(message => {
            let value;
            try {
                value = JSON.parse(message.toString());
            }
            catch { }
            if (artist && process.env.FAULT && !stream.injected && value?.type === 'response' && actions.get(value.id) === 'sketch-strokes' && value.status === 200) {
                stream.injected++;
                message = JSON.stringify({ type: 'response', id: value.id, status: 503, data: { error: 'Injected lost receipt after commit' } });
            }
            receiveAt = Math.max(receiveAt + 1, Date.now() + lag / 2);
            setTimeout(() => { receive(message); try {
                socket.send(message);
            }
            catch { } }, Math.max(0, receiveAt - Date.now()));
        });
    });
    await page.route('**/api/casual**', async (route) => { if (route.request().method() === 'POST') {
        try {
            if (route.request().postDataJSON()?.action === 'sketch-strokes')
                stream.httpFallbacks++;
        }
        catch { }
    } await wait(lag / 2); const response = await route.fetch(); await wait(lag / 2); await route.fulfill({ response }); });
    await page.goto(base + '/#casual-arcade');
    await page.locator('.sketch-canvas').waitFor();
    await page.getByRole('button', { name: 'Fullscreen', exact: true }).click();
    await until(() => stream.room?.game?.stage === 'draw');
    return { page, stream };
}
try {
    const host = await post({ action: 'create', mode: 'sketch', name: 'Drawing QA', bots: 0 });
    assert.equal(host.status, 201);
    sessions.push(host);
    const friend = await post({ action: 'join', code: host.room.code, name: 'Viewer QA' });
    assert.equal(friend.status, 200);
    sessions.push(friend);
    const other = await post({ action: 'join', code: host.room.code, name: 'Next guesser QA' });
    assert.equal(other.status, 200);
    sessions.push(other);
    const start = await post({ action: 'start', code: host.room.code }, host.token);
    assert.equal(start.status, 200);
    const chosen = await post({ action: 'sketch-choose', code: host.room.code, round: start.room.round, turn: start.room.game.turn, choice: 0 }, host.token);
    assert.equal(chosen.status, 200);
    const artist = await client(host, true), viewer = await client(friend);
    assert.equal(viewer.stream.room.game.word, undefined);
    const canvas = artist.page.locator('.sketch-canvas'), box = await canvas.boundingBox(), begin = Date.now();
    for (let i = 0; i < 14; i++) {
        const x = box.x + box.width * (.15 + i * .035), y = box.y + box.height * .25;
        await artist.page.mouse.move(x, y);
        await artist.page.mouse.down();
        await artist.page.mouse.move(x + 10, y + 12);
        await artist.page.mouse.up();
    }
    const released = Date.now();
    await until(() => viewer.stream.room.game.strokes.length === 14 && viewer.stream.room.game.strokes.every(s => s.closed));
    Object.assign(report, { rapidStrokes: 14, drawDurationMs: released - begin, lastReleaseToViewerMs: Date.now() - released, strokeRequests: artist.stream.requests.length, batchSizes: artist.stream.requests.map(r => r.segments), injectedReceipts: artist.stream.injected, httpFallbacks: artist.stream.httpFallbacks });
    await artist.page.evaluate(() => { PointerEvent.prototype.getCoalescedEvents = () => []; });
    const y = box.y + box.height * .75;
    await artist.page.mouse.move(box.x + box.width * .25, y);
    await artist.page.mouse.down();
    await artist.page.mouse.move(box.x + box.width * .6, y, { steps: 12 });
    await artist.page.mouse.up();
    await until(() => viewer.stream.room.game.strokes.length === 15 && viewer.stream.room.game.strokes.at(-1).closed);
    report.emptyCoalescedPointCount = viewer.stream.room.game.strokes.at(-1).points.length / 2;
    if (!process.env.BASELINE)
        assert(report.emptyCoalescedPointCount > 2, 'Empty coalesced events lost the actual pointer movement');
    const finalPoint = viewer.stream.room.game.strokes.at(-1).points.slice(-2);
    const committed = Date.now();
    await until(() => viewer.page.locator('.sketch-canvas').evaluate((c, p) => { const [r, g, b] = c.getContext('2d').getImageData(Math.round(p[0] * c.width / 1000), Math.round(p[1] * c.height / 650), 1, 1).data; return Math.min(r, g, b) < 200; }, finalPoint));
    report.stateToPaintMs = Date.now() - committed;
    report.viewerPainted = true;
    const epoch = viewer.stream.room.game.canvasEpoch;
    await artist.page.getByRole('button', { name: 'Undo stroke', exact: true }).click();
    await until(() => viewer.stream.room.game.canvasEpoch > epoch && viewer.stream.room.game.strokes.length === 14);
    report.undoSynchronized = true;
    const guess = await post({ action: 'chat', code: host.room.code, round: 1, turn: 1, text: chosen.room.game.word, messageId: crypto.randomUUID() }, friend.token);
    assert.equal(guess.status, 200);
    assert(guess.room.game.chatLocked);
    const locked = await post({ action: 'chat', code: host.room.code, round: 1, turn: 1, text: 'No answer spoilers', messageId: crypto.randomUUID() }, friend.token);
    assert.equal(locked.status, 403);
    report.correctGuesserLocked = true;
    const hidden = await fetch(base + '/api/casual?code=' + host.room.code, { headers: { Authorization: 'Bearer ' + other.token } }).then(r => r.json());
    assert.equal(hidden.room.game.word, undefined);
    report.answerPrivate = true;
    assert.deepEqual(errors, []);
    assert(artist.stream.errors.every(e => e.status === 503 && process.env.FAULT));
    assert.deepEqual(viewer.stream.errors, []);
    if (process.env.FAULT)
        assert.equal(artist.stream.injected, 1);
    report.status = 'passed';
}
catch (e) {
    report.status = 'failed';
    report.error = e.message;
    process.exitCode = 1;
    throw e;
}
finally {
    for (const c of contexts)
        await c.close();
    await browser.close();
    for (const s of sessions)
        await post({ action: 'leave', code: s.room.code }, s.token).catch(() => { });
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report));
}
