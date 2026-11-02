# we-play-team-game regional settings

On 2026-11-02 the production Worker settings were updated through the Cloudflare settings API:

- Targeted Worker placement: `aws:ap-southeast-1` (Singapore). The service API resolves this to target 30. This is a nearby Cloudflare execution location, not an AWS deployment or a guaranteed Philippine data center.
- Request-log sampling: 10%, previously 100%, with persisted invocation logs retained. Query strings are redacted. Tracing remains disabled.
- Static assets remain attached and served with the existing asset-first configuration. Private game snapshots retain their no-store behavior. No broad response cache was enabled.
- Existing compatibility date/flags, standard usage model, D1 binding, both Durable Object namespaces and `room-authorities-v2` migration tag are preserved. Raising CPU limits would not allocate a faster CPU, so limits were not inflated.

The specific `we-play-team-game` build trigger now supplies `WE_PLAY_REGIONAL_DEPLOY=1`. `vite.config.ts` persists these settings when that flag is present; local previews and Sites builds retain their default placement. Manual builds for this Worker should use `WE_PLAY_REGIONAL_DEPLOY=1 pnpm run build` before the normal deployment. Build caching was already enabled and remains enabled.

Both room routing paths already request `apac-se` for newly created Durable Objects. Cloudflare location hints are best effort and do not relocate existing objects. The separate `markup-arcade` Worker keeps its existing edge placement and Southeast Asia room hint.

TypeScript checking and a production build with the flag passed. The generated configuration contains the Singapore target, 10% sampling and the original static asset configuration. The live settings were read back, and the settings deployment serves 100% of traffic. This verifies configuration, not a measured latency improvement from the Philippines.

References: https://developers.cloudflare.com/workers/configuration/placement/ and https://developers.cloudflare.com/durable-objects/reference/data-location/.
