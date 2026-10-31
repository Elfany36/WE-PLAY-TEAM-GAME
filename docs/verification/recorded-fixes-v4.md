# Historical version-four verification — 31 October 2026

These results apply to the version-four commit only. Later implementation changes are documented separately and do not inherit these verification claims.

Three supplied recordings were reviewed privately. They showed blank memory-card faces, a rotating kart camera and intervals of near-static Snake imagery. The files and players' names are not included in this public source delivery. The recordings do not contain input-event timestamps, so they cannot establish precise key-to-screen latency.

## Changes

- Removed lazy image loading from revealed memory faces. The small 68-image set warms four decodes at a time, without exposing hidden deck positions. Revealed images load eagerly, with a distinct numbered/named fallback until decode completes or after a loading failure. No card becomes an empty white face while it waits.
- Replaced perspective/backface card flips with lightweight 2D transitions. The authoritative turn, hidden faces and matching rules remain on the server. A pending click immediately shows a Turning face, then displays the actual answer only after it arrives. A single disabled fieldset handles busy state, avoiding reconstruction of all 200 tiles for each request.
- Increased mismatch dwell to Cozy 2.2 s, Standard 1.6 s and Expert 1.2 s. The picker and rules state these timings. Memory uses the faster polling cadence so a short reveal is less likely to pass between observations.
- Fixed shared polling so a GET receipt no longer suppresses the next GET as if it were a fresh control response. Actual recent control responses still prevent redundant reads. A slow response is followed by the intended bounded polling delay, rather than an extra series of freshness skips.
- Snake uses a latency-adaptive prediction horizon, bounded at 1.5 seconds and 12 grid steps, for owner and remote presentation. Longer receipt gaps no longer meet an unconditional 650 ms presentation limit. Predicted food is consumed once even if a path circles back, and occupancy uses a set instead of repeated full-body collision scans. The server still owns collisions and scores.
- Removed names drawn over Snake bodies and their gradient/highlight fills. Body/head colors match the roster's solid player colors. Names remain in the roster and accessibility description.
- Kart now defaults to a north-up view so the entire track does not spin as the kart turns. Change camera preserves the optional heading-following view. Driving physics, enlarged tracks and validated lap checkpoints are retained.

## Verification

- 211 automated tests passed, TypeScript passed, and 326 CSS documents/snippets parsed. Parsing is not browser certification.
- All 68 referenced memory SVGs exist, parse, have sensible 96 × 96 geometry, have no external dependencies and visibly decode/rasterize in Chromium. None were empty or all-white. Results are in `memory-assets-v4.json`.
- Local 200-card Expert play showed visible faces using the 2D presentation. In an eight-participant room, with a 600 ms added response delay and delayed artwork, the pending feedback frame appeared 45.1 ms after the pointer event in the measured run. The 125.2 ms Playwright action/feedback duration includes automation overhead. This is a local sample, not a device-wide latency guarantee.
- Kart, Terra and Snake each passed eight-participant browser flows with 300 ms added response delay; sampled p95 frame intervals were 21.0, 22.5 and 19.9 ms. No sampled long tasks over 50 ms or uncaught exceptions were recorded. Mobile resize, fullscreen and synthetic canvas-recovery checks passed.
- All ten existing local casual modes and all eleven existing online startup/read flows were repeated at their appropriate capacities. Rule/privacy/sequence/concurrency tests remain in the automated suite.

Native production logs for 100 sampled API invocations showed no failed invocations in the inspected window; wall times were 198 ms median, 417 ms p95 and 600 ms maximum. These logs do not measure client rendering or the complete Internet round trip. They help explain why fixed presentation windows and short reveal timings were insufficient.

This priority release contains fixes to existing games. The six requested additional games remain in a separate unpublished working checkout until their implementation and checks finish. Direct browser access to the public production origin is blocked by the execution environment; local browser checks and native publication status are reported separately. Real-world latency and other devices/browsers remain variable.
