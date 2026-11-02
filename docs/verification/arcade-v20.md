# Arcade v20 — online movement and world recovery

This release continues from `80ec6f79ce105149d39ef52583e0c77a1bb98e4e`, including the user's GitHub PR #5 and the published v19 layout and Snake fixes. The six supplied recordings show Snake turns, kart turns and scenery contacts, Marble falls, Sumo identification, and tank movement. The changes below address shared networking and presentation paths rather than changing the games' win conditions.

## World state and control timing

The client now tracks actual live world snapshots separately from HTTP snapshots and control acknowledgements. Healthy pings cannot conceal a stopped state stream. Missing continuous state triggers an HTTP read and a live resynchronization request; fallback reads use elapsed request time instead of adding another quiet interval after every reply. The polling deadline is recalculated from the latest adopted room, including when a request crosses the start countdown. Event-based and paused games do not require continuous snapshots. Connection diagnostics identify the mixed state: live controls with HTTPS snapshots.

Slow HTTP tests exposed a second problem: the previous 900 ms prediction ceiling expired before the next snapshot arrived. The budget now covers a complete request interval, its return leg, and a small polling allowance, with a five-second upper bound. It advances incrementally and retains authoritative server corrections. Held-input heartbeats adapt up to 500 ms, below the 950 ms authority expiration, and HTTP controls can use four requests concurrently while snapshots retain room to proceed. WebSocket control windows retain their existing adaptive limits.

New kart and arena inputs start on a physics segment that has not yet been displayed. Recomputing a partially displayed segment after a key reversal previously moved a paddle or chassis backward within that frame. This scheduling adds at most one 50 ms segment before local motion begins. Terraria retains its existing input and terrain presentation.

## Movement and identification

Remote arena actors and karts play confirmed position history with a monotonic receipt clock. Large corrections within the same life remain speed limited instead of taking the old hard-teleport branch. Explicit authoritative respawn/recovery changes still reset history. Client arena prediction can no longer respawn a character before authority confirms the new life.

Tank and kart visual corrections use the same solid-scene hull constraints as their simulation. Constraint feedback also corrects the smoothing offset, preventing a permanent visual offset inside cover. These checks do not mutate the authoritative snapshot.

Sumo, Tanks, Marble and Paddle show a persistent colored identity strip, a high-contrast ring and an upright `YOU` badge on the controlled character. Other actors have player names/numbers or CPU identification. Sumo's watched duel is separate from the controlled seat, including guest and local seat selection. Snake has a matching head marker in addition to its existing player strip. Markers scale for narrow screens.

## Verification and limits

The release retains the 306 immutable client assets through published Site v16, including inherited dependencies, so existing tabs can still load their previous lazy chunks. Both production builds verify that pack.

Validation passed: **474 automated tests**, TypeScript checking, and syntax parsing for 327 CSS examples. [Measured results](arcade-v20/summary.json).

| Local browser fixture | Result |
| --- | --- |
| Two-player WebSocket controls, 5 games × 0/400/1400 ms RTT | 15 passed |
| Two-player HTTP fallback controls, 5 games × 400/1400 ms RTT | 10 passed |
| Displayed initial response across those 25 cases | 9.5–113.4 ms |
| Correct initial direction, released controls, and seat isolation | 25/25 each |
| World interval median across WebSocket cases | 67–143 ms |
| Largest individual WebSocket world gap | 259 ms |
| Canvas paint rate | 59–60 fps |
| Large same-life movement discontinuities in the fixture | 0 |
| Stalled pushes with live pongs, steady play and countdown | Both recovered |
| HTTPS interval during a push outage at 400 ms RTT | 411 ms median; 424 ms maximum |
| First post-countdown world snapshot during the outage | 453 ms after start |
| Guest character identification at desktop and phone widths | 10 passed |
| All 17 games at 1440 and 390 pixels, controls and fit-screen | 34 passed |

At 1400 ms HTTP RTT, initial displayed control response changed from 875 to 67 ms in Tanks, 971 to 38 ms in Sumo, 857 to 55 ms in Marble, 921 to 105 ms in Kart, and 784 to 28 ms in Paddle. These are before/after fixtures on the same local proxy, not production measurements. [Before prediction fix](arcade-v20/http-prediction-before.json), [final HTTP results](arcade-v20/http-motion.json), [WebSocket results](arcade-v20/websocket-motion.json), [outage recovery](arcade-v20/stalled-world.json), [identity checks](arcade-v20/player-identity.json), [responsive layouts](arcade-v20/layouts.json).

Phone examples: [Sumo](arcade-v20/sumo-phone.png), [Snake](arcade-v20/snake-phone.png), [Tanks](arcade-v20/tanks-phone.png). Browser measurements use local Chromium, a local Durable Object service, and an ordered delay proxy with two independent authenticated browser contexts. They measure displayed entity positions and actual world delivery, not just requestAnimationFrame frequency. The large-jump check excludes explicit recovery epochs and frame gaps over 100 ms; it flags a displacement over 40 world units between otherwise adjacent frames. This is a regression threshold, not a claim that every smaller correction is imperceptible.

Network transit remains real. Remote players on slow HTTP fallback can display older confirmed positions, and rapid commands can be coalesced while requests are occupied. Prediction makes local controls responsive; it cannot make an unreceived opponent action authoritative. Collisions, ring-outs and checkpoint recovery can legitimately change movement. These fixtures do not establish production geographic latency, device capacity, or zero corrections under every network condition.
