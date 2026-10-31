# Shared room transport implementation

Existing casual and coding rooms now use `RoomTransport` for JSON requests, timing receipts, bounded retries, compact snapshots and traffic counters. Each server reply may carry a private snapshot id. A client returns the id it actually has; the server sends an immutable delta only when that exact base is available for that player, room and round. Cache misses/restarts send a full state. The client keeps a bounded set of bases for concurrent responses and requests a full resync after a miss. Existing revision ordering still discards stale game state. Doodle keeps full responses and its targeted draft/submission data path.

Snake body updates can carry only new heads plus the resulting length. Coordinates are quantized for presentation; stored simulation values are unchanged. Turn-based deltas preserve unrevealed cards and private hands because they are generated from the already redacted per-player view. Terrain and scene reuse remain version-scoped.

Requests that time out retain their request id on retry. Casual replay acknowledgements return the current authoritative view. Coding acknowledgements retain the original answer feedback without scoring twice. Per-player token budgets are stored under the existing revision-checked write, so switching Worker isolates does not reset a successful action's budget. Budgets are not applied to on-device games. Private budget/receipt fields do not appear in public views.

Navigation/reload marks a seat disconnected rather than retiring it. Its session token and player id can resume; explicit Leave still retires the player. Disconnect/leave clears chat as requested. A BroadcastChannel lease prevents duplicated tabs on the same origin from sending conflicting controls for one seat. It does not coordinate copies on different origins/devices.

The shared diagnostics report measured receipt ping, jitter, successful payload traffic, server processing, browser/canvas frame rate and configured simulation cadence. Idle painting and browser frame rate are distinguished. Measurements vary by connection and device.

Validation: 20 targeted network/prediction/API tests passed, including eight long Snake bodies compacted to less than 20% of their full body state, private-base isolation, interrupted-request retries, clock advancement under negative corrections, no duplicate kart recovery, concurrent idempotent card reveal and disconnect/resume. TypeScript passed. These tests do not run Doodle Relay. Browser performance targets and real Internet ping/bandwidth have not been certified by these unit/in-process checks.

Hosting limit: the retained public Site supplies a Cloudflare Worker and D1 database. It has no Durable Object/WebSocket broadcast binding. This implementation continues authenticated HTTPS polling; it does not claim 20 Hz WebSocket broadcast, region affinity, TCP/Nagle configuration or a guaranteed few-KB/s Internet service. Circuit/Terra use fixed 50 ms authority steps on room requests; Snake retains its configured grid cadence. Remote extrapolation is bounded and reconciliation is smoothed. Supporting persistent broadcast with the same authority across isolates requires a durable room service, rather than an in-memory socket map that could split the room.

All changes are local commits under the latest no-push instruction.
