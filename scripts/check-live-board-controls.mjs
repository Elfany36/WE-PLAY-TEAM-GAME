/** Human board actions in two browsers, including lobby module warmup and reload.
 * Run against local Workers/DOs. BASE, RESULTS, DELAY and PLAYWRIGHT_MODULE are optional.
 */
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.BASE || 'http://127.0.0.1:4204', out = process.env.RESULTS || 'work/realtime-v35/live-boards.json', lag = Number(process.env.DELAY || 200), rows = [], wait = ms => new Promise(r => setTimeout(r, ms));
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox'] });
async function post(body, token) { const r = await fetch(base + '/api/casual', { method: 'POST', headers: { 'content-type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) }, body: JSON.stringify({ requestId: crypto.randomUUID(), ...body }) }); return { status: r.status, ...await r.json() }; }
async function until(check) { const end = Date.now() + 10000; while (!await check()) {
    assert(Date.now() < end, 'Timed out waiting for a board update');
    await wait(20);
} }
for (const mode of ['memory', 'chess']) {
    const sessions = [], contexts = [], errors = [], row = { game: mode, roundTripDelayMs: lag };
    try {
        const host = await post({ action: 'create', mode, name: 'Board host QA', bots: 0, cards: 20 });
        assert.equal(host.status, 201);
        sessions.push(host);
        const peer = await post({ action: 'join', code: host.room.code, name: 'Board friend QA' });
        assert.equal(peer.status, 200);
        sessions.push(peer);
        const pages = [];
        for (const s of sessions) {
            const c = await browser.newContext({ viewport: { width: 1440, height: 950 } });
            contexts.push(c);
            await c.addInitScript(v => sessionStorage.setItem('markup-casual-session', JSON.stringify(v)), { token: s.token, code: host.room.code, apiOrigin: base });
            const p = await c.newPage(), loaded = [];
            p.on('pageerror', e => errors.push(e.message));
            p.on('response', r => { if (r.status() === 200 && /\/(MemoryBoard|StrategyBoard|PartyArena|ActionWorld|PirateArena)-/.test(r.url()))
                loaded.push(r.url().split('/').at(-1)); });
            await p.routeWebSocket('**/api/casual**', socket => { const server = socket.connectToServer(); const pipe = target => { let at = 0; return m => { at = Math.max(at + 1, Date.now() + lag / 2); setTimeout(() => { try {
                target.send(m);
            }
            catch { } }, Math.max(0, at - Date.now())); }; }; socket.onMessage(pipe(server)); server.onMessage(pipe(socket)); });
            await p.goto(base + '/#casual-arcade');
            await until(() => loaded.some(n => n.startsWith(mode === 'memory' ? 'MemoryBoard-' : 'StrategyBoard-')));
            assert(!loaded.some(n => /^(PartyArena|ActionWorld|PirateArena)-/.test(n)), 'The lobby warmed an unrelated game');
            pages.push(p);
        }
        row.lobbyPreloadedSelectedGame = true;
        const started = await post({ action: 'start', code: host.room.code }, host.token);
        assert.equal(started.status, 200);
        const game = started.room.game, actorId = mode === 'chess' ? game.whiteId : game.currentId, index = sessions.findIndex(s => s.room.youId === actorId);
        assert(index >= 0);
        const actor = pages[index], viewer = pages[1 - index], selector = mode === 'memory' ? '.memory-deck' : '.strategy-board';
        await actor.locator(selector).waitFor();
        await viewer.locator(selector).waitFor();
        if (mode === 'memory') {
            const began = Date.now();
            await actor.locator('.memory-tile').first().click();
            await viewer.locator('.memory-tile.face-up').first().waitFor();
            row.clickToViewerMs = Date.now() - began;
            assert.equal(await viewer.locator('.memory-tile.face-up').count(), 1);
            await viewer.reload();
            await viewer.locator('.memory-tile.face-up').first().waitFor();
            row.revealSurvivesReload = true;
        }
        else {
            const began = Date.now();
            await actor.getByRole('button', { name: /^e2 ·/ }).click();
            await actor.getByRole('button', { name: /^e4 ·/ }).click();
            await viewer.getByRole('button', { name: /^e4 · white pawn/i }).waitFor();
            row.clickToViewerMs = Date.now() - began;
            assert(await viewer.getByRole('button', { name: /^e2 · empty/ }).count());
            await viewer.getByRole('button', { name: /^e7 ·/ }).click();
            await viewer.getByRole('button', { name: /^e5 ·/ }).click();
            await actor.getByRole('button', { name: /^e5 · black pawn/i }).waitFor();
            const active = sessions[index], invalid = await post({ action: 'move-board', code: host.room.code, round: 1, turn: 1, from: 'e2', to: 'e4' }, active.token);
            assert.equal(invalid.status, 409);
            row.staleTurnRejected = true;
            await actor.reload();
            await actor.getByRole('button', { name: /^e4 · white pawn/i }).waitFor();
            await actor.getByRole('button', { name: /^e5 · black pawn/i }).waitFor();
            row.positionSurvivesReload = true;
        }
        assert.deepEqual(errors, []);
        row.status = 'passed';
    }
    catch (e) {
        row.status = 'failed';
        row.error = e.message;
        process.exitCode = 1;
    }
    finally {
        for (const c of contexts)
            await c.close();
        for (const s of sessions)
            await post({ action: 'leave', code: s.room.code }, s.token).catch(() => { });
    }
    rows.push(row);
    console.log(JSON.stringify(row));
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, JSON.stringify(rows, null, 2));
}
await browser.close();
