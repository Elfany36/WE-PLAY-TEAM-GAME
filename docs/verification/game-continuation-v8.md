# Game continuation v8: verification tracker

Date: 1 November 2026, Singapore. Baseline: urgent network commit `a6c896d`, GPT Site v7.

## Completed and verified locally

| Workstream | Result and evidence |
| --- | --- |
| Urgent multiplayer update | Published before this continuation. [v7 investigation, measurements and exact publication receipts](network-receipts-v7.md). Dedicated room Worker restored; both room authorities bound; native deployment verified at 100%. |
| UNO / Flip match continuity | Bot seat IDs, scores and dealer rotation survive successive hands. A completed match starts fresh. Two regression fixtures pass. |
| AI legality and scoring | Flip bot avoids a penalty Wild while holding another uncolored card. Sci-Dama selects the lower signed consumption difference in the recorded capture fixture. |
| Turn visibility | One serial bot action per think, at least 700 ms apart. Simultaneous action bots retain their bounded cadence. |
| Local human views | Existing AI-seat protection consolidated and tested. Human turns, private reviews and property selection keep human controls. Solo UNO opens the human hand; multiple humans retain the privacy screen. |
| Sumo models and animation | Cached shaded bodies, moving limbs, dash trails and readiness meter. Eight-seat desktop/390 px scenes checked; active-scene samples observed 60 FPS. |
| Chess / Dama / Sci-Dama | Shaded pieces, beveled board, readable values and crowns. Received snapshot age and bounded half-RTT determine animation progress, including the castling rook; completed moves do not replay. Reduced motion skips movement. |
| Ladders / property | Shaded tiles, ladder shadows, striped snakes, isometric buildings and ownership bands. All 40 property labels fit their cells. |
| UNO layout | 12 seats and 20-card hands checked at 1440/390 px. Large hands scroll inside the hand panel. |
| Memory rendering | Memoized board and owner lookup; stable flip callback; four-column phone deck. Gameplay and full 200-card rendering checked. |
| Regression suite | 316 passed, 0 failed, including nine new regressions in `tests/game-continuation-v8.test.ts`. |
| TypeScript | `pnpm run check` passed. |
| Build gates | Sites and Pages builds passed. Dedicated Worker dry run passed: 580.03 KiB / gzip 142.67 KiB, both room authority bindings. The retained documentation chunk warning remains recorded below. |
| Local real Workers APIs | All 17 arcade modes passed create with AI, start, authenticated poll, end and leave. [Results](game-continuation-v8-api.json). |
| Browser gameplay | 12 gameplay flows, four human-view checks and two active-sumo checks passed without runtime errors or page overflow. [Results](game-continuation-v8-browser.json). |
| Large-model browser fixtures | Six desktop/mobile cases passed: 12-player UNO, developed property map, 200-card memory. [Results](game-continuation-v8-models.json). |

Sites/Pages builds and the dedicated Worker dry run are release gates. Publication order is GitHub main → GPT Site → Cloudflare. Sites version metadata retains the exact source commit; the dedicated Worker retains the matching `source:<commit SHA>` tag. Native publication receipts are reported only after successful operations. A local build alone is not a production verification.

## Measurement limits and remaining work

- The enforced network allowlist blocks both production hosts from this execution environment. Production Internet ping, geographic receipt percentiles and real-user device performance remain **unverified**. Timings in v7 are explicitly local measurements.
- Existing sessions keep their authority. Finish an older room, then create a new room to select the dedicated service. New invitations carry the service hint. No live room is copied between independent backends.
- Notifications announce revisions; authenticated HTTP still carries actions and private snapshots. This is not a full binary, WebSocket-only game protocol or a universal sub-100 ms Internet guarantee.
- All 17 modes have bounded heuristic AI. Drawing relay uses templates/generic descriptions; Terra follows/mines. Neither provides arbitrary drawing understanding or full campaign planning.
- The separately loaded documentation chunk still triggers the Pages size warning; it is not the initial arcade bundle. The warning remains visible.
- The existing full-site Cloudflare Worker `we-play-team-game` is preserved. GPT Site rooms target the dedicated `markup-arcade` API. This release does not replace that separate full-site frontend's assets.
- Art and mechanics improve incrementally. These checks do not establish exhaustive art replacement, expert AI strength, full accessibility certification or coverage of every map/device.

## Research references

Current Cloudflare [DO WebSocket guidance](https://developers.cloudflare.com/durable-objects/best-practices/websockets/), [DO state API](https://developers.cloudflare.com/durable-objects/api/state/), Workers upload/settings schemas and the local rule engines informed the changes. Hibernation, per-socket attachments, coalesced notifications and local durable storage are used. No external AI inference requests run in the game loop.
