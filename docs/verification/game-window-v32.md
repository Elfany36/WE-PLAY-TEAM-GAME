# Fullscreen play and room performance

The game now owns the fullscreen window. The existing canvas, room, seat and round stay mounted; the compact HUD, chat, scores and game information float above it. Each overlay can be hidden. Panels move, resize and clamp back into the window after rotation. Fullscreen layout changes do not overwrite the normal website dock preferences. Browsers that refuse native fullscreen use a window-filling fallback. Leaving fullscreen restores the website controls and focus.

Pirate uses the supplied game's visual language: character portraits, damage, stocks, dash readiness and optional touch controls. Its camera adapts to portrait and landscape dimensions. View, audio and key preferences are accessible from the game menu. Solitaire's table and card preferences move into the menu; essential card actions remain reachable, including on short landscape screens. Its drag preview now stays inside the native fullscreen element. Drawing retains the canvas aspect ratio, prompt, timer, brush tools and guess input. The drawing canvas and card piles have their own constrained areas instead of extending below the window.

Other corrections include Generals/Fleet deployment fit, Property board placement, Memory deck fit, Phone studio sizing, Blocks/Terra aspect constraints and correct turn labels for simultaneous games. The standalone Pages app now imports the Pirate styling that the hosted app already included. Coding games also use the shared fullscreen window.

## Performance changes

Continuous rooms publish the newly committed simulation tick directly instead of waiting through an additional notification timer. Input-only commits wait for the armed tick rather than filling the stream with the preceding pose. Countdown, phase, round and resume transitions still publish promptly. Storage commits, authoritative 20 Hz simulation, private per-seat projections, acknowledgement backpressure and HTTP fallback are retained.

Snapshot encoding shares already-quantized Terra tiles and Snake obstacles only within the same authenticated seat, room, mode and round, with matching authoritative terrain/map versions. Terrain edits, map changes, new rounds and other seats cannot inherit that data. Cache bounds and full-state recovery remain intact. Pirate input receipt timing now appears in connection telemetry.

Pirate Auto graphics starts with a 600,000-pixel raster budget, then adjusts gradually between 250,000 and 2,000,000 pixels using sustained frame timings. Hidden-tab gaps are ignored and adjustments have a two-second cooldown. This changes rendering resolution only; physics, input coordinates, art, effects and the game state remain intact. High detail retains its existing density setting. Lightweight mode caps raster work and retains its existing paint-rate limit.

All measurements below are bounded local comparisons on this execution machine. Gameplay abilities and snapshot sizes vary between deals; the results are not public Internet RTT or a cross-device frame-rate guarantee.

| Workload | Before | After |
| --- | ---: | ---: |
| Raw Pirate stream, median input → authoritative pose | 92 ms | 53 ms |
| Raw Pirate stream, p95 input → authoritative pose | 137 ms | 88 ms |
| Raw Pirate stream, median snapshot age | 57 ms | 27 ms |
| Terra snapshot encoding, mean of 600 projections across six seats | 0.456 ms | 0.176 ms |
| Fullscreen Pirate, 4× CPU throttle, median frame interval | 50.1 ms | 16.7 ms |
| Fullscreen Pirate, 4× CPU throttle, p95 frame interval | 99.9 ms | 33.4 ms |
| Fullscreen Pirate, 4× CPU throttle, median input → authoritative pose | 188 ms | 78 ms |

The stream baseline is source `78dcf98`; both stream runs stay around 20 Hz. The fullscreen comparison uses the first fullscreen candidate and the final Auto implementation at 1440 × 1000, six fighters and Chaos mode. The ordinary website browser comparison also improves median input-to-pose timing from 111 ms to 80 ms; its p95 frame interval varies from 33.4 to 49.9 ms, so this is not evidence of a universal rendering improvement. Loading, frames, CPU and payload measurements are retained alongside the stream and snapshot data in [the evidence directory](game-window-v32).

## Validation

- TypeScript passes. All 632 automated checks pass, including panel bounds, raster budgets/recovery, snapshot isolation, terrain changes, fanout transitions and input receipt telemetry. All 327 example CSS documents parse.
- [44 production-build browser cases](game-window-v32/catalog-production.json) cover all 22 arcade games at 390/1440 px, native fullscreen and the embedded-browser fallback, board bounds, hidden controls, HUD/panel toggles and normal layout restoration. [Seven short-landscape cases](game-window-v32/landscape-production.json) cover Pirate, Snake, Tanks, Solitaire, drawing, Generals and Fleet.
- [Three interaction cases](game-window-v32/interactions-production.json) cover desktop, phone fallback and forced HTTP fallback: same canvas/round, movable/resizable chat, focus, rotation, live delivery, settings, pause/resume, stream reconnect and preference restoration.
- [Five Pirate cases](game-window-v32/pirate-production.json) exercise keyboard taps and remapping at 0/90/400 ms injected round trip, movement release, pause/resume, absent-host spectator resume, rejected spectator controls, simultaneous touch inputs and a second gamepad.
- [16 Solitaire cases](game-window-v32/solitaire-production.json) exercise all eight variants with mouse/keyboard and touch, including Hint, moves, blank-column targets, stock/waste cards, undo and a drag preview inside native fullscreen. [Four tactical cases](game-window-v32/tactical-production.json) exercise Generals and Fleet mouse/touch deployment and placement bounds.
- [Live drawing](game-window-v32/drawing-production.json) uses three authenticated players and verifies private prompts, artist pointer input, stroke display on another player's live canvas, chat scoring and the answered player's chat lock while others continue. [Six coding cases](game-window-v32/coding-production.json) cover fullscreen and restoration in all three coding modes on desktop and phone.
- Hosted and Pages production builds pass. The dedicated Worker minified dry run passes at 730.38 KiB / 197.41 KiB gzip, retaining its existing bindings. The compatibility pack verifies 1,085 immutable assets and their complete lazy-import graphs through Site v29; old open tabs retain those URLs.

Reproduce browser checks with `scripts/verify-game-window.mjs`, `verify-game-window-interactions.mjs`, `verify-solitaire-controls.mjs` (`FULLSCREEN=1`), `verify-pirate-brawl.mjs` (`FULLSCREEN=1`) and `verify-sketch-window.mjs`. Set `BASE`, `API_ORIGIN`, `PLAYWRIGHT_MODULE` and `CHROMIUM_PATH` for the local runtime. The three `scripts/profile-*-*.mjs` tools record the bounded performance workloads.

The native Cloudflare connector returned unauthorized during this session, so no direct dedicated-Worker deployment was performed. Its source is ready, but deploying and verifying that separate service requires connector reauthentication. The Site publication includes its own room service. Existing room bindings, D1, Singapore placement and room-origin pinning remain unchanged.
