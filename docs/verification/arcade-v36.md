# Second verification — v36

The second pass reproduced faults that a clean start or normal-network game sweep had missed. It uses the published v35 production archive and the first v36 candidate as frozen comparison builds, isolated local Durable Objects, real browser clients, and deliberately delayed or interrupted connections.

## Repairs

- Returning canvases now wait for fresh moving-world authority before resuming prediction and discard their old motion history. This applies to Snake, racing, mining, Tanks, Sumo, Pong, Marble, Blocks, Pool and Pirate. Static boards and paused games can paint immediately. A racing tab returned after 9.5 seconds away with 400 ms injected round-trip delay: the v35 comparison rendered a false excursion about 305 pixels from the actual authority; v36 stayed within 0.001 pixels. The test compares against authority, since legitimate in-flight movement can occur after the last visible frame. Game assets and pending player inputs survive the presentation reset. Visibility changes separately clear control requests from the old view.
- Mining now participates in server-side held-input release when its tab becomes inactive or its socket closes. Across held-input games, release expires the input while preserving its sequence number. Previously, deleting it allowed an older HTTP control arriving after socket loss to restart movement. Fresh later controls still work, and closing one tab does not stop another active tab controlling the same seat. An already-expired input does not cause another release write.
- Local mining no longer owns physics or UI clock intervals while hidden, paused or in a lobby. Other local simulation intervals, control repeat timers and Pirate clocks/heartbeats suspend while hidden too. The hidden mining comparison recorded 18 physics, nine control-heartbeat and three UI-clock callbacks in 900 ms before the fix; the fixed case recorded none.
- Drawing finishes its active gesture on focus loss or hiding and releases pointer capture. Dense coalesced pen input samples the whole path with at most 32 samples rather than throwing away its beginning. Empty coalesced events retain their normal pointer fallback.
- Undo and Clear finish and flush the active drawing, await queued strokes and briefly block new gestures until their authoritative response arrives. A held Undo receipt reproduced the previous canvas-epoch error; no new stroke packets or errors occur during that operation after the fix. Ordinary drawing remains optimistic and keeps the ordered v35 batching.
- Failed avatar downloads can recover without changing the avatar or reloading the page. Only missing assets retry, with increasing delay capped at 30 seconds and foreground/online recovery. Terminal authorization/expiry responses stop retries. Completed assets remain cached; removed assets and navigation revoke their object URLs.

## Verification

- TypeScript, all 664 tests, 327 documentation CSS syntax examples, both hosted/Pages production builds and the minified dedicated Worker dry run pass.
- All 22 games pass three simulation seeds with state serialization/reloads: 66 cases without rejected AI actions.
- All 22 games pass desktop, phone and landscape checks in normal and fullscreen layouts: 66 cases including board/card proportions, viewport clipping, HUD/panel controls, chat inputs and leaderboard placement.
- Switching through all 22 games in one browser tab leaves no game intervals or animation frames running after exit.
- Nine continuous multiplayer modes pass state-acknowledgement backpressure and private full-snapshot reconnection. Holding acknowledgements caps outstanding states at the requested four frames and resumes with the newest state after acknowledgement. Six publicly inspectable held-input modes reject replayed older controls after socket closure and accept fresh controls after reconnection. Pirate confirms its own input through its private fighter acknowledgement; its raw inputs remain private. Mining also recovers from a deliberately missing delta base and preserves input in another active tab for the same seat.
- The lifecycle browser checks pass focus-loss drawing, 256 coalesced pen samples, a held Undo response, a lost neutral control packet, hidden local timers and delayed tab return with a visible Resume button over both WebSockets and HTTP fallback. The harness suspends every animation callback while hidden, matching a browser that retains pending callbacks.
- Two-client drawing passes viewer pixels, ordered delivery, Undo, private answers and correct-guesser chat locking with 200 ms injected round-trip delay. The run delivered 14 rapid strokes in three requests and reached the viewer 230 ms after the final release.
- Slow HTTP fallback with 1,600 ms injected round-trip delay keeps held Pirate input alive and delivers release without waiting behind earlier receipts. The recorded maximum held-input arrival gap was 321 ms; release arrived after 805 ms, consistent with the injected 800 ms outbound leg.
- All eight Solitaire variants pass fullscreen pointer/touch controls, applicable keyboard moves, drag/drop, hints, stock moves and Undo at desktop and phone widths. The normal-layout sweep also passes all 16 cases.
- Memory passes 12/32/64/128/200-card decks at desktop, phone and landscape widths. UNO passes 11 declaration, Wild/penalty-card, late-call, catch-window and local hotseat cases. Playground text remains readable across 18 palettes, two tones and three styles at desktop/phone widths; editing, 3,000-line paste/scroll, preview, saved drafts, export, reset and lesson grading pass.
- The Solitaire browser check now selects a deal with a reachable stock move through the actual game API, then restarts that deal. A valid random draw-three deal can have no immediate waste move; that is no longer reported as a controls defect.
- The immutable compatibility pack retains 1,330 files through published Site v33, the Cloudflare/GitHub publication `6ea6e16`, and inherited dependency graphs. Integrity and import-closure checks pass; older published lazy chunks remain available.

Machine-readable comparisons and checks are retained in [arcade-v36](arcade-v36/). Reusable new checks are `check-realtime-lifecycle.mjs`, `check-room-recovery.mjs`, `check-avatar-recovery.mjs` and `check-game-switching.mjs`.

## Final browser-suspension refinement

A stricter final probe froze all animation callbacks during the hidden interval, rather than only stopping the canvas loop. The first v36 candidate could then consume an old queued React view on return and stamp it as newly received; the comparison still showed about 249 pixels of false movement. A held old HTTP response showed about 344 pixels against v35.

The final client cancels queued view callbacks at visibility changes, decodes and acknowledges hidden snapshots without scheduling their views, and aborts obsolete reads. A per-view generation prevents cancelled reads from applying later or producing a false connection error. Existing control generations also clear at the visibility boundary. Fresh wake reads resume immediately. Both strict WebSocket and HTTP cases now remain within 0.001 pixels of authority in the recorded run. Private snapshot decoding/backpressure and normal foreground delivery remain intact; two-browser Memory/Chess actions and reload checks pass.

The initial v36 source remains in GitHub history. Site version 34 was saved but was held before publication when this extra case was found. The final source is a follow-up commit; the dedicated Worker module has no additional code change, and the final website receives the refinement.

## Hosting and limits

GitHub main and the Sites source were checked against the v35 source before release work. The active dedicated Worker module also matched the reviewed v35 SHA-256. No conflicting remote change was found. Deployment preserves existing Durable Object namespaces, D1 bindings, the dedicated Worker's dashboard cache setting, observability, compatibility dates and the regional website placement. No room migration or reset is required.

The [Cloudflare cloud-gaming example](https://github.com/cloudflare/realtime-examples/tree/main/cloud-gaming) streams a Container's rendered video. These games render locally and already coordinate through one SQLite-backed Durable Object per room, authenticated WebSockets, bounded acknowledgements, deltas and ordered input receipts. A video/SFU hop does not replace that state/input path.

A native Cloudflare Observability query found sparse sampled invocations for `markup-arcade`: median CPU 1 ms, p95/max CPU 3 ms and p95 wall time 47 ms. Both checked Workers reported zero active observability issues. This is neither a multiplayer load test nor proof of end-to-end latency; a repeated analytics query timed out. Infrastructure choices were not changed on this sparse sample.

Public game-host access is restricted by this execution environment. Local browser/DO tests and native deployment APIs verify the implementation and publication; they do not establish Philippine ISP latency, every device's frame rate, every long-match outcome or a universal sub-20 ms round trip. The optional request for a repeatable browser/device example remains useful for diagnosing any remaining user-specific lag.
