# Philippines network and movement update — v9

Baseline: `159ae0a` / GPT Site v8. User reports approximately 110 ms ping, shaky movement, off-grid movement and multi-tile jumps. The screenshot shows a 404 JSON response at the dedicated API's root.

## Changes and checks

| Item | Implementation and acceptance evidence |
| --- | --- |
| Placement near the Philippines | Both arcade and coding room stubs request Cloudflare's `apac-se` Southeast Asia hint. Original room names and namespaces remain unchanged. Routing regression and all 17 local API flows pass. |
| Browser request protocol | Snapshot base, revision and world hints travel in headers; polling URLs stay stable. Request-side `no-store` was also bypassing Chromium preflight caching. Responses retain `Cache-Control: no-store`, protecting private state. Header names remain stable and are explicitly allowed by CORS. Old query-based clients remain supported. |
| Measured preflight reduction | Real Chromium + workerd, eight sequential polls: old query format = 8 OPTIONS; stable headers = 1 OPTIONS. Synthetic CDP latency = 110 ms. [Protocol evidence](network-visual-v9-protocol.json). This proves preflight reuse, not a geographic ping reduction. |
| Snake grid motion | Received head trails reconstruct corner movement on grid edges. Missing trails are held instead of inventing diagonal routes. Remote extrapolation is limited to one tile; own prediction to at most two ticks. The extra Cartesian display smoothing that cut corners is removed. |
| Action movement and corrections | Kart, Terra and party prediction stops after 300 ms without authority. Large corrections use finite warp thresholds instead of dragging across the map. Terra rejects displayed correction positions inside solid terrain. Input and simulation state reset on resume epochs. |
| Camera stability | Terra camera uses bounded following and a small dead zone for receipt fluctuations; respawn and large displacement reset it. Existing kart camera and recovery epochs remain. |
| Cloudflare root URL | GET/HEAD `/` redirects to the arcade, replacing the API-only error. Actual local runtime check: HTTP 302 to the existing GPT Site. Health reports requested placement and ingress edge colo, and requires both authority bindings. |
| Regression tests | 323 passed, 0 failed, including seven new network/grid/camera regressions. Existing slow-Snake assertion updated to require bounded speculation rather than up to 12 guessed cells. TypeScript passes. |
| Runtime and rendering | All 17 arcade modes pass local real-workerd create/start/poll/end/leave. Seven canvas modes receive browser movement/keyboard checks, including 390 px Terra. [API evidence](network-visual-v9-api.json), [browser evidence](network-visual-v9-browser.json). |
| Remote turn / fallback | Two local browser clients show a memory flip with notifications enabled and with both sockets blocked. No runtime errors. [Evidence](network-visual-v9-remote.json). |
| Multiplayer input and rendering | Two real browser clients per mode, synthetic 110 ms latency: Snake, Kart and Terra acknowledge controls and advance authoritative positions without runtime errors. Observed 60 FPS for Snake/Kart and 48–49 FPS for two concurrent Terra views on this cloud executor. [Evidence](network-visual-v9-multiplayer.json). |
| Build gates | Sites and Pages builds passed; dedicated Worker dry run passed with both room classes. The existing separately loaded documentation chunk size warning remains visible. |

## Limits and rollout

- **Location hints are best effort.** `apac-se` targets Southeast Asia, including Singapore/Indonesia; it cannot force Manila or relocate an already placed Durable Object. After the current round, create a new room to obtain the new placement request. Existing rooms keep their state and authority.
- Cloudflare Workers execute on its network; changing a Worker setting is not equivalent to moving every existing room. No namespace reset, copied live room or database relocation is performed.
- The environment's enforced outbound policy still blocks the production game hosts. Actual Philippines ISP ping, production receipt percentiles and precise physical DO location remain **unverified**. The local runtime's `cf` fields are placeholders; health's edge colo describes ingress in production, not the room's physical location.
- The synthetic browser run measured P50 121.9 ms with old URLs and 116.8 ms with stable URLs. CDP throttling is not a full two-way Internet model; the reliable conclusion is the observed OPTIONS reduction. No percentage Internet-speed claim is made.
- During a prolonged outage, the renderers deliberately stop guessing and wait for authority. Real deaths, recoveries and respawns still change position. These tests do not establish zero visual bugs on every game/device.
- Final release gates: Sites/Pages builds and dedicated Worker dry run. Publication order: GitHub → GPT Site → Cloudflare, with identical source provenance and existing DO namespaces preserved. Native returned version/deployment IDs are recorded after success.

Research: Cloudflare's [Southeast Asia placement announcement](https://developers.cloudflare.com/changelog/post/2026-06-19-apac-ne-apac-se-location-hints/) and [data location guide](https://developers.cloudflare.com/durable-objects/reference/data-location/), browser CORS behavior tested directly, and the shared authoritative movement/rules suites.
