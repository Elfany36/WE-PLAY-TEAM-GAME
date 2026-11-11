# Philippines and Southeast Asia routing — v38

The reported problem is a steady 200–300+ ms ping from the Philippines. The prior deployed release was `cfe37f0`. A lower round trip is the goal; this release does not assert that every Philippine ISP or existing room now meets 60 ms.

## Routing change

A stateless Hong Kong gateway (`markup-arcade-ph`, targeted near `aws:ap-east-1`) joins the Singapore gateway (`markup-arcade`, now explicitly targeted near `aws:ap-southeast-1`). Both bind the **same existing** CasualRoom and ArenaRoom namespaces owned by `markup-arcade`. No room, token, SQLite data or leaderboard is copied to another authority. The Hong Kong entry exports no room classes and declares no migrations.

When hosting a new production room, the browser compares two small uncached gateway requests per region. The first warms the connection; the second is compared. Each request has an 800 ms timeout, and the two regions are probed in parallel. Hong Kong wins when its warm measurement is at least 5 ms better or Singapore is unavailable. Ties and total probe failure retain the established dedicated service; they never downgrade to a website proxy. The choice is cached in the page for one minute. Custom API configuration and local development retain their configured service.

New objects reached through the Hong Kong gateway use the default near-caller creation behavior. Singapore retains the `apac-se` location hint. Cloudflare hints and targeted placement are best effort. A room records its creating gateway, so joins through the other gateway return the same room and pin new clients to its canonical route. Hong Kong invitation links are understood explicitly. Existing sessions retain their origins, and existing objects are never renamed, reset or moved.

The official Cloudflare website previously skipped the dedicated-service selection used by the main Site and GitHub Pages. It now participates. Existing website rooms also reach their existing room routers directly from the Worker entry, avoiding the framework dispatch path while retaining authentication, CORS, legacy storage behavior and idempotency.

## Accurate measurements

Authenticated WebSocket ping/pong measurements are stored separately from authentication and action receipts. A probe is sent immediately after authentication, then on the existing heartbeat. The panel labels an estimate when no fresh measured probe exists. It displays real high latency without a clamp, and keeps action round trips, input acknowledgements and server work separate.

`/api/ping` is a small public, uncached gateway probe with the same frontend CORS restrictions. It does not create a room or query D1. Its entry code identifies the request's Cloudflare ingress, not the physical location of an existing Durable Object. The connection panel measures this route only while open and visible, aborts on closure, and offers user-initiated copying of diagnostics without tokens.

## Production evidence before this change

A small sampled log query for the existing dedicated service found these ingress groups. These are service invocation durations, **not player round trips** or a controlled route comparison.

| Cloudflare ingress | Median wall time | Median CPU time |
| --- | ---: | ---: |
| CGY | 148 ms | 1 ms |
| CEB | 65 ms | 1 ms |
| MNL | 45 ms | 1 ms |

Each group represented a weighted count of 20 at sample interval 10, roughly two sampled events. This supports investigating routing and waiting time rather than assuming high CPU, but is insufficient to attribute every reported delay. No player IPs or tokens are included in the report.

## Verification

- All 686 tests and TypeScript pass, including regional timeouts, malformed/old probes, warm connection selection, trusted origins, canonical gateway persistence in both room APIs, CORS, unchanged object identities and independent ping measurements.
- Two real local Workers with cross-script Durable Object bindings share the same room, players, private streams, chat, host actions and controls for both Casual and coding Arena rooms.
- Browser tests with simulated production origins and injected probe timings choose Hong Kong for 230/38 ms and Singapore for 28/140 ms. New Cloudflare-website rooms bypass its website API; diagnostics open and close without page errors. These timings are injected and are not measurements of Philippine networks.
- Real browser/DO WebSocket tests with 50 ms and 250 ms injected round trips displayed 56 ms and 257 ms respectively. The high-latency case confirms there is no artificial 60 ms cap.
- Nine modes pass reconnect/state backpressure checks, and nine pass control-generation revocation, same-seat preservation and stale in-flight packet rejection through the website Worker's direct route.
- Snake, Blocks, UNO and drawing pass desktop/phone normal and fullscreen layout checks (eight cases). Prior game mechanics are unchanged.
- Hosted and Pages builds, both minified gateway dry runs and generated binding types pass. The local bundled runtime supports May 2026, so local gateway tests override only the local compatibility date; the production gateway date stays October 31, 2026. Geographical placement is not simulated locally.
- The asset compatibility pack retains 1,400 immutable files through Site version 36, including previous Sites and Pages dependency graphs.

Raw check results are in [arcade-v38](arcade-v38/). Reusable checks: `check-regional-gateways.mjs`, `check-regional-browser.mjs` and `check-ping-display.mjs`.

Publication keeps the existing namespace IDs, database, cache settings and website placement. The new stateless gateway enables sampled logs and 1% traces for routing diagnosis. Native deployment checks verify the two regional placements, shared bindings and exact uploaded code. The current environment restricts direct public game-host access, so the final Philippine ISP round trip must be measured in the player's browser. Reload the updated client and host a new room to exercise new-object placement; old rooms cannot be relocated by adding a new hint.

References: [Durable Object data location](https://developers.cloudflare.com/durable-objects/reference/data-location/), [cross-Worker bindings](https://developers.cloudflare.com/durable-objects/reference/environments/), and [Worker placement](https://developers.cloudflare.com/workers/configuration/placement/).
