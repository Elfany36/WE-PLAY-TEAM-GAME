# Same-room route selection and truthful diagnostics — v39

The Philippine player still measured 114 ms room ping and 142 ms gateway timing after v38 (`4636d32`), entering Cloudflare at MNL. The report affects fresh rooms across games. A 60 ms round trip remains the target; local checks cannot establish the player's real ISP latency.

## Changes

The primary dedicated gateway no longer forces its compute to Singapore. It uses normal Cloudflare ingress placement. Hong Kong remains a targeted alternative, and both continue to bind the same existing room namespaces. New rooms reached through either dedicated gateway use the default near-caller object placement instead of a forced Southeast Asia hint. Existing objects keep their identities and location; no room state is moved or reset.

Public gateway timing does not measure the extra hop to the room authority. The client now compares the **same authenticated room and seat** through both gateways. Each passive WebSocket connection warms once, then measures the median of three ping/pong round trips. Credentials travel in the encrypted authentication frame, never in the URL. The probe is forced to protocol 1 with no active-control ownership, cannot submit game commands, and receives no private world snapshots. Closing it cannot revoke a player's held input. Read-only authenticated HTTP probes are the fallback when WebSockets are unavailable.

A route switches only when both samples succeed over the same transport and the alternative is more than 15 ms faster. A healthy live stream cannot be replaced based on HTTP fallback timing. Automatic comparison runs once per room when idle and above the target or not yet measured. The panel also offers **Compare room routes**. Route changes wait for a lobby, pause, completed round, or an idle action-based game; active steering and drawing are not interrupted. The code, token and authoritative state stay the same. First-party configured gateway URLs now participate in selection; custom services retain their override.

The connection panel distinguishes the last request from socket ping and measures acknowledgements for board, card and drawing actions as well as continuous controls. A pong cannot overwrite an action measurement. Missing measurements say “No input yet” or “Not measured”. Event-based games show **On action** and **Last game update**: a several-second-old update while waiting for a turn does not by itself mean a stalled real-time stream. Copied diagnostics include the client/server version, game, phase and both measured routes without credentials.

## Verification

- All **692 tests** and TypeScript pass. New coverage includes route identity/authentication, passive WebSocket preference, read-only probes in both APIs, cancellation, safe switching, and independent action timing.
- Two real local Workers with cross-script bindings pass passive WebSocket checks for Casual Tanks and coding Arena: no private snapshots, no control ownership, no control-generation changes, and existing held input preserved after probe closure.
- A browser case deliberately gives the public gateway and actual room opposite route preferences. It first selects Hong Kong, then changes to the faster room route while preserving the same room code and token. No website-proxy room is created and no page errors occur.
- A real two-player Memory action with an injected 200 ms round trip reports a 218 ms acknowledgement and last request timing, with **On action** cadence and no token in copied diagnostics. Injected timing verifies the measurement, not geographical performance.
- Nine real-time modes pass reconnect/backpressure checks and nine pass stale input, control-generation and same-seat recovery checks: Snake, Terra, Circuit, Tanks, Sumo, Pong, Marble, Blocks and Pirate.
- The compatibility pack retains **1,421 immutable assets through Site version 37**, including prior Sites and Pages dependencies.

Raw results are in [arcade-v39](arcade-v39/). Browser and Worker checks use the local runtime's May compatibility override; production gateway compatibility remains October 31, 2026. Production publication verifies exact module hashes, preserved namespace/database bindings and 100% active versions. The primary gateway placement must be cleared, Hong Kong must retain its target, and the full website must retain its existing placement and issue monitoring.

The execution environment cannot reach the public game hosts directly. A Philippine browser measurement after deployment is still required. Reload for client v39, host a new room to test new-object placement, then compare both routes in Connection & rendering. Existing objects cannot be relocated by changing a hint.

References: [Durable Object data location](https://developers.cloudflare.com/durable-objects/reference/data-location/), [cross-Worker bindings](https://developers.cloudflare.com/durable-objects/reference/environments/) and [Worker placement](https://developers.cloudflare.com/workers/configuration/placement/).
