# Further verification — v37

This pass starts from published source `22f545d` and its exact Site v35 production archive. GitHub main and both active Cloudflare versions matched that release before work. The website Worker's placement now uses the explicit `aws:ap-southeast-1` representation of Singapore; its deployed code version and room namespaces were unchanged. No remote code conflict was found.

## Newly reproduced input race

Sequence guards reject older commands, but cannot reject a **newer command already in flight when control is released**. The v36 comparison accepted such a packet after its authenticated tab became inactive in mining, racing, Tanks and Pirate. It could restart movement despite the release.

Each seat now has a persisted control generation, exposed only in that seat's private room view. An active-to-inactive transition or socket closure revokes the prior generation even when the first input has not arrived. Delayed commands from it receive a conflict response. Existing held input expires while retaining its sequence watermark. Repeated inactive pings do not repeatedly revoke controls, and another active tab for the same seat prevents revocation; that condition is checked again inside the queued commit.

The client stamps requests with the current generation and can retry a current-view intent after a fresh snapshot without presenting a routine generation refresh as a lost connection. The visibility handling from v36 clears requests belonging to the abandoned view. Snake and Blocks participate too, so delayed turns, rotations and drops cannot cross that boundary. Round/start-time guards remain independent.

These optional fields preserve old protocol compatibility. Older open clients continue working; loading the new client enables their generation protection. No Durable Object namespace or SQL schema migration is required.

## Less duplicate fallback traffic

A control request can time out on a live socket while autonomous world snapshots remain healthy. The previous HTTP retry also returned a full world or delta, duplicating the live authority feed.

For a capable v37 service and a healthy autonomous stream, those fallback control writes now request only an authenticated acknowledgement. A stale stream, HTTP-only play, older service, ordinary read or non-control action keeps the normal state response. The quiet-state watchdog and complete-state recovery continue to work. Receipt requests still authenticate, validate, commit and deduplicate actions; private responses retain `no-store`. The option travels in the existing JSON envelope, keeping request header names unchanged and avoiding an additional CORS preflight.

In the six-seat mining comparison, 30 HTTP control replies fell from 21,402 to 4,375 bytes: about 80% less response traffic, averaging 713 versus 146 bytes. Autonomous snapshots continued. A real browser test deliberately lost ten live input receipts: all 34 HTTP fallback controls received compact acknowledgements while 217 autonomous states arrived, with no page errors. Timing fields in these traffic runs are local observations, not a controlled CPU comparison.

## Respawn and piece-boundary fixes

The published client reproduced two uncaught drawing errors when a remote Snake respawned. Its delayed playback sampled an empty death snapshot after the latest state already contained the new life. Canvas error recovery then cleared the whole scene. Playback now stays within the latest confirmed life, and the renderer safely skips an empty body. Player and spectator browser reproductions complete the same death/respawn with no errors or canvas resets after initial layout.

Snake prediction previously checked only its own body. It now forecasts known routes together using the same simultaneous collision resolver as the authority: opposing bodies, head-on collisions, head swaps, growing tails and vacating tails follow identical rules for bots and humans. It stops at the last safe predicted position while awaiting confirmation; it does not invent a death. Unknown future opponent turns still require authoritative updates.

Blocks previously applied a delayed action to whichever piece was current when it arrived. A reproduced delayed drop placed eight cells instead of four. Each piece now has a persisted serial; an old-piece input acknowledges its sequence without moving the next piece. Prediction binds rapid hold/drop sequences to their predicted piece, and cosmetic transitions reset between pieces. Gravity previews wait for authoritative locking, preventing speculative stacks from appearing and then disappearing. Explicit hard drops still respond immediately. A browser test with a 750 ms outbound delay leaves four cells and then correctly moves the new piece. Legacy moves without a serial remain compatible; reloading enables the new protection.

## Clock correction and held controls

Control sequences now advance beyond both the local sequence and the server's acknowledged watermark. A corrected device clock or reloaded client cannot strand controls below a prior future timestamp. Independent dash/jump/item/recovery watermarks are included. Held-input heartbeats and socket quiet detection use monotonic time, so moving the device clock backward does not stop controls or conceal a dead socket. Real browser checks pass both reload and pause/resume recovery after seeding a sequence one hour ahead, then moving the wall clock backward while holding a control.

## Verification

- TypeScript and all 678 tests pass. Focused cases cover every continuous mode, private generation projection, malformed fields, legacy compatibility, healthy/stalled/absent streams, HTTP authentication, deduplication, full reads and CORS.
- Nine real local Durable Object modes pass first-packet/held-input revocation, later higher-sequence rejection, fresh-view recovery, repeated inactive pings, socket closure and another active tab for the same seat.
- Nine modes also pass state-acknowledgement backpressure, reconnect and legacy control replay checks. Mining additionally passes missing-delta-base recovery.
- Strict browser suspension checks pass WebSocket and HTTP returns, held old responses, drawing focus loss, coalesced pen input, Undo races and hidden local timers.
- The final Snake/Blocks changes additionally pass both layouts at all three sizes, plus delayed-piece and respawn browser reproductions. All 22 games pass three simulation seeds with state reloads: 66 cases with no rejected AI actions. All 22 pass normal/fullscreen desktop, phone and landscape layout checks: 66 cases covering clipping, proportions, HUD, chat and leaderboard controls.
- Two-human Memory/Chess actions, reload recovery and stale-turn guards pass with 200 ms injected round-trip delay. Pirate HTTP-only controls still pass with 1,600 ms injected round-trip delay; the recorded release arrival was 807 ms, consistent with the injected 800 ms outbound leg.
- An unthrottled local profile of Snake, Tanks, Blocks, racing and mining recorded roughly 16.7 ms median browser frame intervals. Median local input receipts were 11–17 ms; p95 ranged from 14 to 47 ms. Main-thread activity was 83–188 ms per second across those workloads. These figures describe this machine, not public Internet latency or every GPU/device; mining's profile has no independent canvas-motion trace.
- A separate final before/after run recorded Snake main-thread activity of 73/76 ms per second and Blocks 97/101 ms per second, with 16.7 ms median paint intervals and no errors. Final median input receipts were 12/14 ms; p95 was 37/26 ms. These short local observations are not a universal latency guarantee.
- Hosted/Pages builds, the minified dedicated Worker dry run, 327 documentation CSS syntax examples, and retained-asset integrity/import closure pass. The compatibility pack retains 1,338 immutable files through Site v35 and inherited publication graphs.

Raw comparisons are in [arcade-v37](arcade-v37/). Reusable probes include `check-control-generations.mjs`, `check-live-http-receipts.mjs`, `check-control-receipt-fallback.mjs`, `check-clock-reload.mjs`, `check-snake-respawn.mjs` and `check-block-piece-race.mjs`.

The linked [Cloudflare example](https://github.com/cloudflare/realtime-examples/tree/main/cloud-gaming) is explicitly experimental, streams Container-rendered Freedoom through SFU, and supports one controlling tab. Its controller-generation concept is relevant; adding its video pipeline would not replace this website's multi-player room authority. These browser-rendered games retain SQLite-backed Durable Objects, authenticated WebSockets, bounded state windows, deltas and local presentation.

Deployment preserves existing room namespaces, D1, observability, compatibility dates, cache settings and regional placement. The execution environment restricts public game-host access: native hosting APIs verify publication, while browser/DO gameplay checks run locally. User-device and ISP-specific delays still require measurements from that network; no universal sub-20 ms round trip is claimed.
