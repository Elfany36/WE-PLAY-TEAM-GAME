# Phase 1: implementation report

All changes are local. No push, source publication, GitHub upload or Site deployment was performed for this phase. The latest supplied video exceeded the transfer tool's 32 MiB limit; the written report and earlier three recordings were available.

| Area/game | Cause addressed and implementation | Verification |
|---|---|---|
| Pocket Kart | Clock holds and incorrectly timed prediction inputs; repeated recovery commands; models larger than collision radii; scenery had no physical collisions; gradients rebuilt per frame. Added issue-time replay, bounded correction, command identities, shared scenery footprints, separated grids, shoulder collisions, cached/depth-ordered art. | Shared fixed-step prediction/collision checks; eight-bot average laps 58.1/60.7/62.1 s. Eight-participant browser sample with 100 ms added response delay: 60 game-paint fps, 16.8 ms p95 frame interval, no sampled long tasks or uncaught errors. |
| Snake Xenzia / Switchback Valley | Per-frame full-body prediction/allocation, late touch release, extra turn lead and hard corrections. Added incremental step/output buffers, bounded correction, immediate touch-down/swipe intent, 200 ms remote extrapolation cap and life epochs. | Buffer identity/equivalence, grid collision/respawn/map/ranking checks. Eight-participant browser sample: 60 game-paint fps, 16.7 ms p95, no sampled long tasks or uncaught errors. |
| Memory Garden | Image/decode requests delayed faces; old 3D backfaces could disappear; duplicate HTTP retry returned an error. Bundled the 68 external illustrations as namespaced symbols alongside 32 inline faces; retained authoritative hidden cards and 2D flips; repeated actions now acknowledge the same reveal. | 200-card eight-participant browser sample showed the face, all 68 symbols, no external face images and no document horizontal overflow on desktop/390 px; rule/API privacy/scoring checks. |
| Snakes & Ladders | Dice and token clocks restarted independently; model crowds overlapped; slide microsegments hopped and eased repeatedly. Shared 1 s dice timing, 350 ms tiles/4 s movement cap, landing pause, continuous drawn-curve slides, crowd sizing and server lock/deadline. | Motion, eight-piece footprint, server locks, exact square/overshoot, map and reduced-motion/reconnect checks. |
| Property Parks | Server accepted next actions while local movement was playing; jail routes cut across the board; model crowds overlapped. Added a bounded server motion lock/deadline, numbered routes around corners and GO, synchronized dice/tokens and crowd footprints. | Targeted rule-state/motion-lock checks. Full browser playthrough is not claimed. |
| UNO Classic / Flip | Shared retries/snapshot churn and possible stale view receipts. Uses the common immutable delta/ack transport; hand/stock/privacy/turn state remain authoritative. | Existing non-Doodle classic UNO/core/API conservation, penalties, challenge, score and privacy checks passed. No new Flip browser certification is claimed. |
| Chess / Dama / Sci-Dama | Shared full snapshot churn and layout constraints. Common deltas preserve unchanged pieces/legal moves; view recovery/layout fixes apply. | Existing rule/API checks passed for legal moves, capture routes, castling, promotion, draw rules, scoring and stable identities. |
| Code Sprint / Stack Survival / Quiz Cards | Duplicated fetch/poll code, slow reconnect, no retry acknowledgement for scored answers. Common transport, receipts retaining original feedback, bounded reconnect/backoff, diagnostics and resumable disconnect. | Core eight-player API/scoring/replay/authentication/question checks passed. |
| Doodle Relay | Missing server drafts became empty timeout drawings; canvas resized its backing buffer on layout changes; assignment could read the current entry as its own previous step. Added private local/server drafts, deadline promotion, bounded submit acknowledgements/late entry replacement, explicit chain stage indices, fixed 1280 × 960 rendering, saved-version art identities and replayable tolerant bucket fills. | **Not launched or tested, by request.** Data path was reread/traced and TypeScript passed. See `verification/relay-source-trace.md`. |
| All rooms / website | Shared HTTP/delta transport, private snapshot bases, fallback full resync, sequence/revision ordering, receipt clock timing, per-player API budgets, duplicate-tab leases, non-retiring disconnect/resume, chat cleanup and common diagnostics. Round entry focuses the play panel; viewport-sized canvases keep the controlled character visible. | Targeted network/API checks plus desktop/mobile browser samples. Builds/TypeScript are compilation evidence, not universal device certification. |

The final Phase 1 run passed **142 non-Doodle tests**, with TypeScript and the GitHub Pages client build also passing.

Non-Doodle checks are enumerated in the test files and verification notes. The initial correction build preceded the later request that permitted testing other games; Doodle remained excluded throughout. The historical 211-test report is not reused as verification of current changes.

## Remaining limits and uncertainties

- The current host is a Worker/D1 polling service, without a durable WebSocket room binding. It does not provide a 20 Hz cross-isolate broadcast, configurable Nagle/sticky sessions or a certified few-KB/s Internet service. The optional in-isolate snapshot cache is disposable; database revision checks remain the authority. A durable room service is needed to meet the persistent-broadcast target.
- Local synthetic response delay is not a real mobile/Internet jitter test or a mid-range laptop/physical 144 Hz certification. Frame samples were short. Browser checks used one rendered participant with eight authoritative seats.
- Previously discarded art cannot be reconstructed if it never reached storage. Doodle runtime behavior, bucket edges, pen/touch behavior, reconnect/export and deadline timings remain deliberately unverified. Saving drafts cannot transmit new ink while the browser has no connection; local session storage retains it for retry.
- GitHub Pages was not enabled on the earlier publication path. No attempt to change hosting or push was made in this phase.

## Local commits

- `9e9256d` room clocks, timestamped replay and retried kart commands.
- `caafddc` bundled memory art, recovery and fullscreen layout.
- `939452e` Doodle drafts, deadlines, stage indexing and bucket.
- `7a74b7e` shared deltas, acknowledgements, resumable seats and diagnostics.
- `4dc899f` server-timed dice and capped board paths.
- `392c9f5` kart scenery collision and Snake buffer reuse.
- The following viewport/touch/report commit completes Phase 1 before integrating the six-game working changes.
