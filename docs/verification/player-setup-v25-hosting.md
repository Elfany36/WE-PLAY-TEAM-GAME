# Multiplayer hosting and transport research

Reviewed 3 November 2026. A 60–90 ms ping does not include simulation backlog, storage waits, snapshot delivery cadence or the client's playback buffer. Moving hosting without addressing those costs can leave controls slow.

| Option | Official findings | Decision for this release |
| --- | --- | --- |
| Existing Cloudflare Workers + Durable Objects | SQLite offers synchronous state writes and automatic output gates. New objects may request Southeast Asia placement; hints are best effort and do not relocate existing objects. Free plans have usage limits. | Keep server authority, existing namespaces and account plan. Use synchronous SQLite, compact movement receipts and 50 ms live snapshots. Preserve Singapore website placement and `apac-se` room hints. |
| Railway | Free plan has $1/month usage credit, with limited resources. A continuously active game service is not guaranteed to remain within that allowance. | No migration: a small credit is not a guarantee of free always-on hosting or lower latency. |
| Fly.io | Current free trial ends after 2 total VM hours or 7 days. Trial machines automatically stop after 5 minutes. | Not a permanent free game server option. |
| WebRTC data channels | Peer data is encrypted using DTLS and may avoid an application-server data hop. Signaling, NAT traversal and potentially TURN relays are still needed. Peer hosting also requires disconnect/host migration and fairness handling. | A possible future transport, not a reliable free replacement that can simply be enabled on the existing authoritative service. No untested peer transport was deployed. |

The practical next measurement is two computers on the intended Internet connections in fresh Southeast Asia rooms, recording input acknowledgement, world interval, simulation age and FPS separately. This distinguishes routing/relay delay from rendering load and simulation backlog. Local controlled-link evidence is in the [release report](player-setup-v25.md).

Official references:

- [Cloudflare Durable Object rules and output gates](https://developers.cloudflare.com/durable-objects/best-practices/rules-of-durable-objects/)
- [Cloudflare SQLite storage API](https://developers.cloudflare.com/durable-objects/api/sqlite-storage-api/)
- [Cloudflare object location](https://developers.cloudflare.com/durable-objects/reference/data-location/)
- [Cloudflare Durable Objects pricing](https://developers.cloudflare.com/durable-objects/platform/pricing/)
- [Railway plans, official documentation source](https://github.com/railwayapp/docs/blob/main/content/docs/pricing/plans.md)
- [Fly.io free trial](https://fly.io/docs/about/free-trial/)
- [MDN WebRTC data channels](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Using_data_channels)
