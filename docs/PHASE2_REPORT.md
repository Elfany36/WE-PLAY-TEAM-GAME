# Phase 2: six games and release integration

This release retains the existing learning studio and games, adds the six requested arcade editions, and integrates them with the shared room transport. Phase 1 was committed at `1d6ee25` before expansion work. Deployment targets the existing public Site: https://markup-learn-play-together.brightbunch.chatgpt.site . GitHub Pages still needs its repository source enabled separately.

## Per-game implementation

| Game | Implementation and causes addressed | Local refinement commit |
|---|---|---|
| Sumo Circle | Eight-seat ring with time-based shrinking, dash cooldowns, deterministic overlap separation, immediate ring exits and correct last-standing/draw resolution. Short action taps survive coalesced releases and cannot execute twice. | `598b505` |
| Tank Courtyard | Eight-seat arena with shared wall/body footprints, pointer aiming, acknowledged fire pulses, projectile bounce/expiry, three-hit damage, respawn protection and departure cleanup. | `887ad84` |
| Paddle Rally | Two-seat paddle arena with bounded paddle speed, persistent touch target, serve epochs, bounded ball correction, eleven-point/win-by-two rules and authoritative scoring. | `be165a0` |
| Marble Trail | Eight-seat parkour race with two laps, 32 ordered checkpoints, jump/brake controls, safe checkpoint respawns on three themes and progress/distance ranking at the deadline. | `bd838e1` |
| Block Drop | Up to eight wells with a shared seven-piece bag, hold, ghost piece, rotations, row clears and garbage cancellation. Ordered acknowledged input history avoids losing moves; clients never fabricate unseen random pieces. Cached grids/ghosts reduce paint work. | `9596579` |
| Pocket Billiards | Two-seat 8-ball edition with 16 balls, fixed substeps, equal-mass contacts, scratch/foul handling, groups, called eight-ball pocket, ball-in-hand and break-eight respotting. Cue placement waits for acknowledgement; idle painting and physics previews are throttled. | `409f3b8` |

The common foundations are in `eb41011`. Sumo, tanks and paddles also support two people on one keyboard; marble and blocks support one-player local practice; pool supports passing the device. The displayed rules identify original arcade adaptations and link to their sources rather than claiming official tournament equivalence.

## Shared fixes and website

- `5cd6671` rejects controls from an older resume timeline, preserves effect/respawn/cooldown/lap timestamps while paused, clears held inputs and ranks Snake battles by eliminations before growth. The old weighted score let sufficiently large growth outweigh an extra elimination. New-game rosters now follow authoritative progress. Room text preserves international characters and emoji while stripping hidden control/bidi overrides; React escapes displayed markup.
- `7c572e2` moves new canvas backing-size writes out of ResizeObserver callbacks and cancels scheduled work on unmount. Fit/Resize had triggered notification loops that opened the development error overlay and blocked pointer controls. The same reproduction no longer opens the overlay.
- Discovery keeps the existing artwork and adds search aliases, category filters, readable capacity labels, selection summaries and an empty-result reset. Searching “pool” previously missed Pocket Billiards because its familiar name was absent from the indexed fields.
- Players/scores and collapsible chat are docked beside the games, including coding rooms. Fullscreen includes the casual room sidebar. Emoji/gift delivery and history clearing on departure/game change are retained.
- Controls wait for the duplicate-tab ownership handshake instead of appearing enabled while writes are temporarily blocked. A browser check found that an immediate coding-room Start click could be discarded during that handshake.
- Existing DM Sans and Manrope fonts are bundled locally (61,768 bytes total for the two Latin variable WOFF2 files), with licenses, package versions and SHA-256 hashes in `public/fonts/`. CSS no longer waits for the external Google Fonts stylesheet. Other scripts, game artwork and the reference inventory retain their existing lazy boundaries.

## Verification

- **225 non-Doodle tests passed**, including game rules, private views, capacities, idempotent actions, input epochs, collisions, pause timelines, question banks and reference checks. `npm run test:non-relay` reproduces the allowed scope; the four historical mixed suites that execute Doodle remain intact and excluded.
- TypeScript passed. The Worker and GitHub Pages production builds passed. CSS parsing passed for **327 documents**; this is syntax evidence, not cross-browser semantic certification.
- Six online browser samples used one rendered Chromium client, eight authoritative seats for sumo/tanks/marble/blocks and two for paddles/pool, with 100 ms added response delay. Active samples reported 60 game paints/s, 16.7–16.8 ms p95 browser frame intervals, zero sampled long tasks and no uncaught errors. Successful payload traffic in these short samples was 1.7–2.6 KB/s, excluding HTTP headers. Idle pool painting falls below 60 intentionally. See `verification/club-browser-v5.json`.
- Website browser checks passed for all 17 discovery cards, filters/search, dark mode, all six local games, Fit/Resize/Auto layout, desktop and 390 px overflow, two-client chat/gifts, cleanup, duplicate-tab takeover, same-seat reload and coding answer acknowledgement. No uncaught errors occurred in the final flow. See `verification/website-browser-v5.json`.
- Doodle Relay was **not launched or tested**. Its targeted implementation remains source-traced and typechecked only, as requested; see `verification/relay-source-trace.md`.

## Limits

These are short local measurements, not certification on a mid-range laptop, physical 144 Hz display, eight simultaneously rendering remote devices or real Internet jitter. Runtime behavior still depends on the device and connection.

The deployed architecture remains Worker/D1 HTTPS polling. Physics advances at fixed steps when room requests arrive; this is not a persistent 20 Hz WebSocket broadcast. A durable room service is required for that architecture change. No region-affinity, TCP/Nagle or universal latency guarantee is claimed.

GitHub Pages is static and requires the matching public room service plus the repository's one-time Pages setting. A successful Sites deployment does not enable GitHub Pages. Previously discarded Doodle art cannot be reconstructed, and current Doodle runtime/export/deadline behavior remains deliberately unverified.
