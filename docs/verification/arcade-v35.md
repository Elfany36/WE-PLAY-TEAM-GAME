# Realtime performance repair — v35

Rapid drawing used one receipt per segment, so short strokes accumulated behind network round trips. With two real browser clients and 200 ms of injected round-trip delay, fourteen quick strokes took 2,556 ms after the final pointer release to reach the viewer. Ordered batches reduced that to 406 ms in the comparison run. An injected failure after a committed batch recovered through HTTP without duplicating strokes. A separate pointer bug discarded movement when `getCoalescedEvents()` returned an empty list; that case now retains the actual event and paints the full line.

Drawing batches contain at most eight segments and stay within the existing small-request limit. They apply atomically, retain request identity on retries, and cannot cross a round, turn or canvas epoch. Old services advertise no batch capability and continue receiving individual segments. Artist receipts no longer duplicate the complete canvas already delivered by the live state stream. Undo, answer privacy, correct-guess chat restrictions and reconnect behavior remain authoritative.

Snapshot fanout now quantizes common public world branches once per synchronous broadcast. Each seat still passes through its private projection. Unchanged terrain and completed ink reuse immutable presentation data and cached encoded lengths. A changed world version, canvas epoch or drawing turn invalidates that reuse. The disposable snapshot cache retains its 256-entry/6 MB bounds and full-state recovery on a miss; no stored game physics is rounded or rewritten.

In paired Node measurements of the same six-seat state, median fanout preparation fell from 0.777 to 0.371 ms for mining. A canvas with 160 strokes and initially 4,800 points fell from 2.778 to 0.421 ms. Encoded output sizes were identical between implementations. These measurements cover projection/delta preparation, not storage or Internet transit.

Visible game canvases request low-latency presentation where supported. Racing and mining also reduce extra backing pixels after sustained frames slower than 40 ms, keep desktop canvases at or above their native 960 px width and smaller viewports at their original resolution, preserve aspect ratio, and restore detail gradually after recovery. Normal rendering and a steady 30 Hz display keep their original detail. This trades excess backing resolution for responsiveness on slower devices; rules, input, camera coordinates and network cadence remain unchanged. In the throttled Chromium sample, racing/mining improved from roughly 67 ms to 33 ms between frames and control receipt times fell substantially. Repeated throttled profiles varied: the final sweep recorded 50 ms median frames in racing and 33 ms in mining. Without CPU throttling both held 16.7 ms median/p95 frames at full detail; median local control receipts were 17/18 ms. These are local workload results, not Internet-latency guarantees.

The lobby now warms its actual game module before the match, including joined rooms and host game changes. Pirate artwork can decode while its lobby is open. Unrelated game modules and music remain lazy. The compatibility pack retains 1,285 immutable client files through Site v32 and inherited dependency graphs, preventing missing lazy chunks in older open tabs.

The linked [Cloudflare cloud-gaming example](https://github.com/cloudflare/realtime-examples/tree/main/cloud-gaming) streams Freedoom video from a Container through Realtime SFU and supports one controlling tab. These games render in each browser and coordinate several independent players. They retain one Durable Object per room, synchronous SQLite persistence, authenticated WebSockets, bounded state backpressure, and reliable ordered commands. No video encoder, Container or SFU was added to the control path.

Validation:

- TypeScript and all 660 tests passed; 327 documentation CSS examples parsed.
- All 22 games passed desktop, phone and landscape layout checks: 66 cases covering both normal and fullscreen layouts, proportions, HUD, chat and leaderboard placement.
- All 22 games passed three simulation seeds with state reloads: 66 cases and no rejected AI actions.
- Two-client drawing passed normal and failed-receipt delivery, pointer fallback, viewer pixels, undo, private answers and chat locking.
- Two-human Memory and Chess actions reached the other browser, survived reload, and rejected stale turns under 200 ms of injected WebSocket round-trip delay. Both warmed the correct module in the lobby.
- Pirate passed 23 cases, including 0/90/400 ms input delay, absent-host spectator resume, forged-control rejection, touch, a second gamepad, four local players, all eight maps at phone/desktop sizes, and graphics settings in the fullscreen menu.
- Tank aiming, independent keyboard/mouse firing, menu releases, round choices and audio opt-in passed at three viewport sizes.
- Hosted and Pages production builds and the dedicated Worker dry run passed. Prior immutable imports restored with integrity and dependency checks.

Reports are retained in [arcade-v35](arcade-v35/). Reusable checks include `check-drawing-live.mjs`, `check-live-board-controls.mjs`, `check-game-simulations.mjs` and `profile-realtime-games.mjs`. Browser timing profiles distinguish render cadence, control receipts, authoritative state age and server work; idle Memory/Chess timing samples are separate from their two-player action checks.

GitHub and Sites source heads matched before publication. A Cloudflare dashboard version had enabled its global cache option, but its downloaded game module still matched the reviewed v34 SHA-256. Publication preserves that cache setting, the existing Durable Object namespaces and D1 binding, observability, compatibility dates and regional website placement. Private room responses retain `no-store`.

Public game-host requests are restricted by this execution environment. Deployment/version and module-integrity checks use the native hosting APIs; public-network end-to-end gameplay and Philippine ISP latency are not inferred from the local results.
