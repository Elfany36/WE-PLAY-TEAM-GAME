# Optimization v6 verification ledger

Baseline: GitHub `c5cf68c` (synced before editing). Date: 1 November 2026, Singapore.

Statuses are evidence-based: pending, implemented, verified, blocked. A source change is not a live performance measurement.

| Workstream | Status | Evidence / acceptance |
| --- | --- | --- |
| Baseline tests | verified | Baseline: 275 pass / 1 fail plus one test type error. Final: 301 pass / 0 fail. The obsolete hop assertion now checks server progress, as the newer regression test already requires. |
| Bounded room bodies / request validation | verified | 160,000-byte streaming cap and origin/action validation before selecting a room object; chunked-body regression passes. |
| Durable storage consistency | verified | RoomStore persists before cache updates; rejected write, restart and expiry tests pass. |
| Existing D1 room migration | verified locally | Eight concurrent imports perform one legacy read and preserve revision/token state; each browser keeps its original service origin. |
| Shared controls / sync | verified locally | Existing regression suites pass; 8 authenticated clients, 400 real local workerd HTTP requests, 0 failures. P50 22.15 ms, P95 32.86 ms. No Internet latency claim. |
| Bounded AI for all 17 arcade modes | verified locally | All 17 modes start with AI through real workerd APIs; deterministic 10-second rule tests pass, including private information and host cleanup. No LLM or bot HTTP calls. Think cadence ≤5 Hz; Block Drop plans are cached. Template relay and Terra companions have the limits described below. |
| Pool | verified locally | 285 px tapered cue plus ferrule/chalk/wrap, backswing/strike, collision aim preview, keyboard fine adjustment and shot dashboard; browser shot flow passes. |
| Tank Battle / Sumo | verified locally | New tank scale 1.5 (2.25× area), sumo scale 1.3 (1.69× area). Old rooms default to scale 1. Hull/turret, treads, recoil/trails, reloads and actor HUD tested; original collision and pause suites pass. |
| Block Drop | verified locally | 390 px browser viewport uses 480×790 logical layout and a 320 CSS px canvas; observed 58–60 FPS. Bounded 15 lock resets and clear-row flashes. Held-key and input replay tests pass. |
| Snake / Memory / UNO / Kart | verified locally | Shared transport and legal AI coverage retained; all five browser flows pass without runtime errors. Memory’s 153.52 kB board/symbol chunk is deferred. Existing UNO seeded conservation tests and Snake prediction/input tests pass. |
| Ladders / Property / strategy boards | verified locally | Current server progress drives tokens; cached board surfaces and focus/selection styles retained/improved. Chess reads current FEN. Legal Dama/Sci-Dama AI uses compulsory moves and arithmetic scoring. Existing movement/rules tests pass; chess browser smoke check passes. |
| Paddle Rally / Marble Trail | verified locally | Shared bounded simulation, paddle motion spin and ball trail, marble roll stripe and jump/checkpoint visuals, AI controls and readable score strip; browser flows and physics tests pass. |
| Website visibility / responsive UI | verified locally | 11 browser flows report no runtime errors; mobile game content now precedes sidebar. Focus and touch sizes improved. Core theme contrast tests pass. This is not a full accessibility certification. |
| Typecheck / tests / both builds | verified | TypeScript passes with pinned and latest Workers types (5.20261031.1); 301 tests pass; 327 CSS documents parse; Worker/Sites and Pages builds pass; standalone arcade dry-run: 308.21 KiB / gzip 77.01 KiB. |
| GitHub commit | publication phase | Exact pushed SHA is recorded in the final release report; working tree and build inputs are checked before publishing. |
| GPT Site | publication phase | Save/deploy native receipts are recorded in the final release report. Existing project ID and public audience are preserved. |
| Cloudflare | publication phase | Target: new `markup-arcade` Worker in account `ad5e0678ef8fa101846cfe82265d3db1`, with the existing `site-creator-d1` database. Native upload, D1 query plan and route receipts are recorded in the final release report after the GPT Site update. |

## Measurement limits and retained work

- `optimization-v6-local-network.json`: a real local Workers runtime, 8 clients, 400 requests, no simulated Internet delay. It cannot establish real-world geographic latency or prove a percentage improvement over the previous production service.
- `optimization-v6-cpu.json`: 1,200 deterministic room advance samples per action mode (up to 8 seats), including rule-based AI. Maxima include shared cloud executor scheduling. This is not Workers billing CPU or a device FPS guarantee. The chess CPU row is an idle human-turn measurement; chess AI legality is exercised separately by the rule test.
- `optimization-v6-browser.json`: 11 local Chromium gameplay flows, including pool shooting and a 390 px Block Drop viewport. Observed 58–60 FPS for the canvas scenes sampled. It is not exhaustive testing of every map, camera, browser or device. All 17 modes also passed real local workerd create/start/poll/end/leave flows in `optimization-v6-api.json`.
- Lightweight AI uses legal heuristic decisions. Memory learns only visible faces; UNO uses its own hand and public table. Drawing relay uses templates/generic descriptions, and Terra companions follow/mine; neither is a general reasoning/vision agent. AI is not advertised as championship-strength.
- Transport remains HTTP polling. WebSocket broadcasting, geographic load tests, production percentile monitoring and real-user device measurements remain future work. A dedicated room Worker removes framework rendering from its hot request path; the local persistence adapter avoids remote D1 round trips for established DO rooms.
- The documentation reference is still a large (4.14 MB before gzip), separately loaded chunk. It is not part of the initial arcade bundle. The Pages build reports this retained warning; it was not suppressed.
- Games whose existing models already passed their retained suites received shared network/AI/readability improvements, not complete art replacements. This release does not claim every original requested visual overhaul is exhaustive.

## Cloudflare research

Current Cloudflare documentation consulted: [Durable Object storage](https://developers.cloudflare.com/durable-objects/best-practices/access-durable-objects-storage/), [Rules of Durable Objects](https://developers.cloudflare.com/durable-objects/best-practices/rules-of-durable-objects/) and Workers/Wrangler API schemas. Latest available Workers types were fetched separately for validation; dependency pins were preserved. Local workerd supports dates through 2026-05-22, so local service QA uses that CLI override. Production config uses 2026-10-31.

Final mobile layout receipt: `{ order: '2', top: 1255.59375 } { width: 320, height: 528, fps: '60' }`.
