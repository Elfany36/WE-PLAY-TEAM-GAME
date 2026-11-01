# Urgent multiplayer receipt fix — v7

Requested 1 November 2026 (Singapore), after reported 700–900 ms receipts across games. Baseline: `c574663` / GPT Site v6.

## Confirmed findings

- At the start of this investigation, the connected Cloudflare account listed `we-play-team-game`, while GET settings for the frontend's dedicated `markup-arcade` address returned Worker-not-found. The missing dedicated service was restored after GPT Site v7 succeeded; the existing full-site Worker was preserved.
- v6 caches one failed health probe for the page lifetime and can silently select the Sites/D1 path. New production rooms now select the dedicated authority directly; a temporary health failure cannot pin them to the older backend.
- Coding rooms still used remote D1. Both arcade and coding APIs now have one SQLite-backed Durable Object per room. The active room request path uses local durable state.
- The shared batching loop deliberately waited in 4 ms increments for D1 request ownership. Durable Objects now use direct completion wake-up; the D1 fallback retains its existing behavior.
- Cross-service legacy import can fork an existing room. The dedicated service now refuses to copy a legacy room on join; bounded join lookup and allowlisted invitation hints preserve the original authority.

## Implemented controls and transport

- Hibernating WebSockets announce committed revision numbers only. Bearers are sent in the first encrypted frame, never in URLs. Private UNO hands, memory faces, drawing tasks and question data remain on authenticated HTTP.
- Notifications coalesce at 50 ms. Clients keep one GET in flight and a minimum fetch interval. Live-action games retain the 200 ms polling cadence; notifications cannot turn eight players' inputs into unbounded GET traffic.
- Idle turn-based rooms can wait for a notification. AI turns, memory reveals, deadlines and blocked sockets retain explicit polling. A closed or unsupported socket falls back to HTTP.
- Both room families remember their service origin. Bare codes use bounded lookup on trusted backends; new invitation links carry an allowlisted service identifier.
- Pause/resume epochs now clear pending controls and cannot merge an old shot, recovery or block drop into a new timeline.
- Storage alarm failures cannot leave a persisted room invisible to the cache.
- The diagnostics panel distinguishes total round trip from game-state age and reports the selected service. Existing rooms keep their original authority; creating a new room after the current round selects the dedicated service.

## Verification

| Check | Result |
| --- | --- |
| Full suite | 307 passed, 0 failed |
| TypeScript | Passed |
| Sites and Pages builds | Passed |
| Dedicated Worker dry run | Passed; both room classes exported/bound; minified 579.84 KiB / gzip 142.61 KiB |
| Eight authenticated clients | 400 local workerd HTTP requests, 0 failures; P50 17.98 ms, P95 27.05 ms |
| Previous local run | P50 22.15 ms, P95 32.86 ms; separate run, not a controlled production comparison |
| Local committed revision delivery | Arcade 76.87 ms; coding 55.22 ms |
| Browser remote memory flip | 144 ms with live revisions; 223 ms with sockets blocked on both clients |
| Idle browser GET count over 2.6 seconds | 0 with live revisions; 3 with blocked sockets |
| Privacy and revocation | Notification messages contained revision metadata only; invalid bearer rejected with 4001; removed player disconnected |
| Coding mode runtime checks | Blanks, Survival and Quiz create/join/start/leave passed |

Evidence: `network-receipts-v7-live.json`, `network-receipts-v7-load.json`, `network-receipts-v7-browser.json`, and `tests/network-receipts-v7.test.ts`.

These are local runtime/browser measurements. The enforced environment network policy still blocks both production hosts, so no Internet ping target or production gameplay success is claimed. Native publishing, namespaces and bindings are checked separately. GitHub → GPT Site → Cloudflare publication receipts are reported in the conversation after successful operations.

## Published receipts

- GitHub and Sites source commit: `a6c896d4263630f2063a35a462830d3693f0d73a`.
- GPT Site version 7: `appgprj_6ae54f10b294819194c241daad869803~appgver_1551b545f8988191af806c973e50a38c`.
- Site deployment `appgdep_6ae694246a608191ad31c04cd9e94f69`: succeeded.
- Subsequent Cloudflare `markup-arcade` version `9e14e21b-f545-4dc8-be05-9ffb5e84e29a`: 100% deployed, public workers.dev route enabled.
- Migration `room-authorities-v2`; native settings confirmed both `CASUAL_ROOMS` and `ARENA_ROOMS`, plus the existing D1 binding. No production game latency was measured.

The interrupted visual/AI work resumes in [the v8 tracker](game-continuation-v8.md).
