# Runtime reliability and Snake rendering

2 November 2026. Implementation started from GitHub `main` at `cf6e69ce7813aaff5c8e08942bfa1b7827168620`, checked again before resuming. That includes the latest v18 movement and layout changes. This report covers the fixes in this change; it does not assert that every possible repository issue has been eliminated.

## Snake movement

Three related defects were identified. Remote heads extrapolated straight ahead before receiving another player's turn, and route reconciliation then faded the whole snake to zero opacity. Separately, the presentation smoother could cross a corner in one frame by connecting its endpoints diagonally, losing the intermediate corner. The first input after a countdown also discarded the negative offset of a delayed countdown snapshot, overestimating its scheduled tick; the server clamped that hint and the local prediction followed the wrong route.

- Remote movement now plays confirmed snapshots on a receipt-based clock with a bounded jitter buffer. It never extrapolates an unknown turn. Duplicate packets cannot reset the clock or push playback backwards. Ordinary playback speed correction is bounded to 0.8–1.2 times simulation speed.
- Presentation walks every crossed corner and retains it in the body ribbon. Catch-up is limited to 1.25 times simulation speed, replacing the previous 1.8 multiplier. Large authority corrections remain explicit resynchronizations but no longer blank a live snake.
- Room, round, start epoch, context recovery and long suspension reset disposable motion state. The playing area clips the model rendering to its boundary. Reduced-motion users receive a steady spawn-opacity indicator.
- Countdown input scheduling now retains the signed snapshot offset until receipt age and both transit legs have been added. The predicted boundary stays inside the server’s accepted tick window.
- Local input prediction, server collision checks, turn acknowledgements and respawn epochs remain authoritative. A prolonged missing stream holds remote movement at the latest confirmed state; this is preferable to inventing movement through an unknown turn.

The networking approach was checked against [Snapshot Interpolation](https://gafferongames.com/post/snapshot_interpolation/), particularly its discussion of jitter buffers and the failure of extrapolation around collisions. The implementation uses grid paths rather than applying curved interpolation across Snake's collision cells.

In the same 400 ms RTT fixture, the earlier visible maximum step was 0.514 cells. The final run measured 0.107 for the local snake and 0.106 for the remote snake, with zero large corrections, zero stationary local frames, full presentation opacity and 60 FPS. These are local Chromium measurements, not guarantees for every device or network.

Two separate browsers completed 16 turns at 400 ms RTT with ±80 ms jitter. Across both views, all four local/remote traces had full opacity, zero out-of-bounds heads and zero steps above 0.65 cells (largest: 0.337). [Two-browser evidence](performance-v19/snake-two-player-400.json).

| Simulated RTT | Local maximum step | Remote maximum step | Large corrections / blanking |
| --- | ---: | ---: | --- |
| 400 ms | 0.107 cells | 0.106 cells | 0 / 0 |
| 3000 ms | 0.107 cells | 0.106 cells | 0 / 0 |
| 5000 ms | 0.216 cells | 0.206 cells | 0 / 0 |

The three-second fixture first exposed a 2.18-cell correction before the countdown calculation was repaired. Final runs measured 60 FPS, no stationary local frames and live-state gaps below 330 ms after warm-up. Initial countdown delivery still takes network transit time. These tests cannot make input arrive faster than the connection. [400 ms](performance-v19/snake-400ms.json), [3000 ms](performance-v19/snake-3000ms.json), [5000 ms](performance-v19/snake-5000ms.json).

## Shared server, transport and background work

- Durable Objects reuse a parsed committed state for authentication, scheduling and fanout. Mutation batches keep independent state copies. Successful commits invalidate the cache; failed durable writes cannot replace the cached revision. Expired authorities close sockets and cancel remaining tick/notification timers.
- A failed WebSocket request path is briefly bypassed even when pongs or state pushes still work. A lost acknowledgement can be retried once over HTTP with the same deduplication key. Create/join and other non-idempotent requests are not automatically replayed. Resetting a room or cancelling a request also cancels its retry delay.
- Routing failures return retryable JSON with CORS/no-store headers. Unsupported methods return 405.
- Snake, Tank/Marble/Sumo/Pong, Blocks and Pool canvas loops cancel their animation callbacks while hidden, offscreen or context-lost. Recovery schedules one loop. Collapsed connection diagnostics no longer run a frame counter or sampling interval.
- Coding games run their UI clock only during an active round, use the seat's live-feed ownership and record measured socket latency. Finished live rooms reduce fallback refresh frequency.
- Playground previews debounce typing by 180 ms; saves batch at 350 ms and flush on page hide. Storage failures now show the actual unsaved status.

The question cache holds at most 256 deterministic results and returns a copy to each caller. Five samples of 1,000 repeated calls on the same host measured:

| CPU fixture | Before median | After median | Relative speed |
| --- | ---: | ---: | ---: |
| Unchanged quiz question | 0.06258 ms | 0.00653 ms | 9.6× |
| Private quiz projection | 0.08798 ms | 0.01902 ms | 4.6× |

Both output SHA-256 digests match the baseline. These figures measure CPU in these fixtures, not Internet latency or total production capacity. [Before](performance-v19/runtime-before.json), [after](performance-v19/runtime-after.json), reproducible script: `scripts/benchmark-runtime.ts`.

## Other games and presentation

- Marble previously charged Sumo stamina on each jump but never regenerated it, disabling jumping after two uses. Marble now uses its existing 1.1-second jump cooldown without that unintended stamina charge. A continuous-jump simulation verifies recovery throughout the match.
- Expired Kart projectiles and oil no longer hit on their expiry tick. Kart recovery clears stored drift charge, preventing a stationary drift release from awarding a turbo. Successful weapon effects now record impact timestamps.
- Tank treads advance with actual hull travel, including reverse and rest. Models show frontal armor, reload progress and a stable spawn shield instead of flashing the entire hull. Foundry supply pads show opening progress; Glacier Marble gives a directional wind warning. Legacy-rule rooms do not advertise unavailable map events.
- Kart chicanes have reflective direction markings. Pickup pedestals show availability and cooldown progress. Reduced motion disables decorative pickup rotation, flame oscillation and drift sparks. Effects use bounded geometry and existing cached model art.
- Phone fullscreen UNO keeps large hands, Wild color choices and draw-penalty actions reachable. The existing map themes, paced tactical board-game bots, scoreboards and chat GIF/gift/emoji support from v17/v18 are retained.

## Verification

| Check | Result |
| --- | --- |
| TypeScript and full unit/regression suite | 454 passed, 0 failed |
| Framework and static Pages production builds | Both pass; 194 prior immutable assets retained |
| Example syntax checks | 327 CSS documents parsed |
| All casual games at 1440 and 390 px | 34 layouts pass; no page overflow, browser errors or clipped checked fullscreen actions |
| All three coding modes at desktop and phone widths | 6 pass |
| Keyboard input, seat isolation and neutral release | 8 live modes pass, including Terraria; Pong reconnects after silent incoming-frame loss |
| UNO decision fixtures at phone width | 40-card hand, color choice and penalty actions pass |
| State stream stalls while pongs continue | HTTP state recovery in 946 ms; simulation continues and live pushes resume |
| Lost acknowledgement | 2 browser sizes; one HTTP replay, one revealed card, original acknowledgement retained |
| Background canvas work | 4 local renderers: 0 animation callbacks offscreen; visible/context recovery resumes |
| Playground typing and persistence | 2 sizes: one batched write, at most two iframe loads, quota error visible and page-hide flush verified |

Six four-participant render samples (Tank, Marble, Kart × two widths) measured 60 FPS. Warm Tank and Kart samples allocated no new gradients during the 1.8-second measurement; Marble retained four animated bumper gradients per frame. A preliminary Kart sample overlapped lint work and measured 44 FPS; the isolated repeat measured 60. [Renderer measurements](performance-v19/render-performance.json).

Evidence: [game layouts](performance-v19/game-layouts.json), [coding layouts](performance-v19/coding-layouts.json), [live controls](performance-v19/browser-input.json), [request recovery](performance-v19/browser-recovery.json), [stalled stream](performance-v19/stale-stream.json), [background/editor](performance-v19/background-editor.json), [UNO](performance-v19/uno-decisions.json).

The new pull-request workflow checks types, tests, examples and both builds before merging. Lint's multi-minute hook analysis of the private Kart helper named `use` was resolved by renaming it to `activateKartItem`; generated Pages assets are also excluded from source lint. The final source lint still reports 520 errors and 132 warnings, largely existing explicit-`any`, render-ref and effect patterns. This debt is not suppressed or described as passing. Protected Terraria gameplay, terrain, shared ActionWorld and original viewport files remain unchanged.

Tests use local Chromium and local Wrangler, with browser-emulated phone dimensions. Physical phones, other browser engines and geographically separated production load were not measured. No manual Cloudflare deployment is part of this change.
