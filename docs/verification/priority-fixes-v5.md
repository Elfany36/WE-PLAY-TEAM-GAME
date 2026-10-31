# Priority implementation — 31 October 2026

The recording follow-up takes priority over new games. This commit implements clock-rate correction instead of clock holds; issue-time input replay for kart/mining prediction; bounded position reconciliation with explicit respawn/recovery epochs; stable kart command identifiers across retries; receipt timestamps separating server processing from network transit; earlier Snake turn scheduling; bundled inline SVG memory faces; smaller backing buffers; recovery for failed game chunks; and fullscreen/touch layout repairs.

These initial priority changes were built for syntax/import bundling only. No test suite or game/browser checks were run for this implementation, as requested at the time. Previous version-four results in `recorded-fixes-v4.md` describe that older release only. They do not certify these changes. The latest large recording could not be transferred because it exceeds the file tool's 32 MiB limit.

Following the subsequent supplied request, changes are kept in local commits. Nothing from this work is pushed or published without a new request. Doodle Relay will receive targeted source-traced changes without launching or testing it; other games may be debugged under the updated instructions. New games are deferred until Phase 1 commits are complete.
