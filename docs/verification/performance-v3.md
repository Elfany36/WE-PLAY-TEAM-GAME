# Performance release — 31 October 2026

This release addresses shared causes of stuttering, delayed controls, missing graphics and unnecessary work across the coding and casual games. It preserves the existing game rules and public Site identity.

## Changes

- Both room APIs coalesce overlapping operations inside a Worker isolate. A batch reads fresh D1 state and commits with the existing optimistic revision condition. It keeps no persistent in-memory authority. A conflict from another isolate replays the batch against a fresh read. Authentication, private projections, sequence checks, turn checks and replay protection remain active. Individual invalid actions do not abort other valid requests.
- Worker events retain their batch lifetime with `waitUntil`. Each caller waits and builds its response within its own request context. Stress testing caught and corrected an intermediate implementation that could be canceled by workerd as a hung request; that implementation is not the release candidate.
- Unchanged casual-room polls return a small revision/time acknowledgment. Acknowledged Snake geometry is omitted and restored only for the matching room, round, map and arena size. Coding rooms use unchanged acknowledgments in the lobby only: active coding games still project time-based pressure and elimination state.
- Polling uses bounded requests, error backoff and immediate wake-up after the page becomes visible or the connection returns. Inactive tabs poll less often. Local game projection no longer runs on every interface clock tick; stable callbacks and memoized views avoid reconstructing unchanged boards, hands and drawing studios.
- Remote action movement extrapolates on the requested display timeline. It no longer jumps from buffered history to a prediction at a different time when one receipt is late. Extrapolation slows and remains bounded. The local action prediction window is 1.2 seconds; fresh locally predicted inputs use an estimated current server time, rather than an old snapshot's timestamp. Lag-dependent correction limits preserve explicit recovery epochs.
- Hidden/offscreen action and Snake canvases skip painting. Arena canvases rebuild disposable graphics after context-restored events. Mining characters have a visible fallback while artwork is unavailable. Kart racing no longer downloads unrelated mining artwork. Drawing canvases avoid redundant backing-store resets.
- Doodle's live editor caches completed strokes and redraws the active stroke. Undo, redo, resize and clear rebuild that layer as needed. Drawing previews/editor restore their contents after context recovery. Chess public projections use the current FEN once instead of replaying the entire move history twice on each projection; rule validation and PGN export retain the history.

## Verification

- 208 individual automated tests passed, including new batching, failed-action isolation, external revision conflicts, storage recovery, caller context/lifetime, unchanged-room deadlines, eight-owner controls, scene restoration and continuous bounded extrapolation tests. TypeScript, 325 CSS syntax checks and the hosted/Pages builds passed.
- Ten local casual modes and all eleven online startup/read flows passed again. Party modes used eight participants; strategy boards used their two-player rule capacity.
- One rendered Chromium client with eight participants passed Kart, Terra and Snake checks with an added **300 ms response delay**. Sampled 95th-percentile frame intervals were **20.9, 22.8 and 18.2 ms**, respectively. No sampled long tasks over 50 ms or uncaught exceptions were recorded. Motion samples changed throughout the sampled interval.
- Kart and Snake also passed an added **600 ms response delay**, with sampled 95th-percentile frame intervals of **24.7 and 17.5 ms**. These checks overlapped a separate control burst on the same local executor.
- **640 real local Worker/D1 control requests** completed without HTTP errors, using eight participants with two concurrent inputs each. All eight owners retained sequence 80 and the final released controls. The room revision increased by 82, including the concluding read, rather than once per control. The measured 95th-percentile request time under this concurrent local load was 184 ms.
- The **built production Worker** also completed a separate 640-request local control burst with zero errors and all latest sequences/releases retained. Its room revision increased by 111 and its measured 95th-percentile request time was 65.4 ms. This verifies the bundled Worker runtime locally, rather than only the development framework.
- The built Worker/frontend repeated the three eight-participant browser flows with 300 ms added response delay. Kart, Terra and Snake recorded sampled 95th-percentile frame intervals of **18.9, 18.4 and 17.0 ms**, respectively, with no sampled long tasks or uncaught exceptions. Resize, fullscreen and synthetic canvas recovery checks also passed in this build.
- Resizing to 390 px, fullscreen entry/exit, positive backing-store dimensions, document overflow checks and synthetic context-lost/context-restored events passed for all three action canvases. Synthetic events exercise application lifecycle handling; they do not force an actual GPU process failure.
- The two-player Doodle relay and album/PNG equality checks passed. Separately, **28 pixel-exact comparisons** matched the cached live editor against the full renderer for all six brushes, opacity, gradients, multiply/screen blending, undo/redo, resize and clear.

## Controlled database-work comparison

`room-batches-before.json` and `room-batches-after.json` use the same Node/SQLite harness with an artificial **8 ms delay per database operation**, five bursts of eight requests and no network. Reproduce the current implementation with `node --experimental-strip-types scripts/benchmark-room-batches.ts`. The before version is hosted source commit `cdd755ac0b6bb14e7a04eb01f452324abeeae75a`.

| Mode / operation | Before reads / writes | After reads / writes | Before / after p95 |
| --- | ---: | ---: | ---: |
| Kart controls, 40 requests | 180 / 180 | 5 / 5 | 138.3 / 19.6 ms |
| Terra controls, 40 requests | 180 / 180 | 5 / 5 | 146.5 / 27.8 ms |
| Snake unchanged reads, 40 requests | 40 / 0 | 5 / 0 | 12.2 / 10.3 ms |
| Memory unchanged reads, 40 requests | 40 / 0 | 5 / 0 | 10.5 / 9.6 ms |

These numbers measure this harness, not Internet latency or production D1 performance. They demonstrate reduced duplicated work, not a universal speedup factor.

## Limits

The service still uses authenticated HTTP polling and D1 storage. Batching covers requests that meet in the same isolate; other isolates still coordinate through revision checks and can retry. This is not a WebSocket/Durable Object server. No zero-latency, zero-stutter or exhaustive bug-free guarantee is made.

Browser checks used local Chromium, one rendered client and synthetic response delay. Hardware, browser, packet loss, geographic distance and production service behavior can differ. These are short samples, not a sustained multi-device or multi-region load test. Direct browsing of the production origin is blocked by this environment's outbound policy; successful native Sites publication establishes deployment, not an end-to-end production multiplayer test.

Detailed data files alongside this report retain the measured values. The previous release's arcade-v2 evidence is historical and is not relabeled as new performance testing.
