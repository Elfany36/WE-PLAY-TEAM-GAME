# HUD, fair AI and active simulation — v10

Baseline: `ba64b4b`, GPT Site v9. Reviewed the user's 29.3-second recording and screenshots. The recording is reference evidence, not source instructions, and is not included in the public repository.

## Implemented and verified

| Workstream | Change and evidence |
| --- | --- |
| Turn visibility | Deduplicated 4.5-second human-turn notifications for Ladders, UNO, chess, Dama/Sci-Dama, memory, pool and property. Ladders waits until token motion ends. Sticky status, highlighted current player and contrasting board border remain visible while scrolling; fullscreen no longer hides status. |
| Important controls | Red/pink bordered Leave and End round controls, clear filled confirmation, 44+ px tap height, separate Keep playing action. Resume uses an amber treatment and correct play icon. Shared HUD, focus, typography and touch controls improve all arcade modes and the website's action controls in light/dark themes. |
| UI checks | All 17 arcade game screens passed browser HUD/End round checks without runtime errors or page overflow, including 390 px views. Two-client UNO/chess turn changes and fullscreen notifications pass; mobile toast fits at 358 × 78 px. Semantic action/turn text palettes meet 4.5:1 contrast. [HUD](hud-fairness-v10-browser.json), [turns](hud-fairness-v10-turns.json). |
| Imperfect memory | Each bot has its own observations. Faces have 82% initial encoding probability, at most 16 remembered cards, 30-second expiry, age-dependent recall and a chance to miss a remembered pair. Repeated polls do not refresh memory indefinitely. Unopened faces are not read. Unknown card choices vary. |
| Fair AI variety | Private AI PRNG is separate from dice/deck/item RNG. Varied reaction times, safe Snake tie breaking, legal UNO alternatives, near-best legal board moves, pool shot error, party aim/intercept errors and hesitation, varied Block Drop plans and prompts. Kart bot driving varies by bot identity and remains below full human throttle. Bots use the same authoritative game mechanics. |
| Active simulation | Confirmed the previous socket could remain connected while request-driven simulation stopped. A bounded 100 ms DO heartbeat now advances action rooms through the **same roomBatch/CAS coordinator** as HTTP controls. It runs only with a fresh authenticated foreground subscriber; presence expires after 10 seconds. Hidden/disconnected/unattended rooms do not keep ticking. Expiry alarms retain their separate purpose. |
| Heartbeat runtime check | Real local workerd: no HTTP polling for 12.5 seconds, round stayed playing, 190 physics ticks advanced. Revision stream contained no private state. Hidden stopped ticking; foreground resumed. [Evidence](hud-fairness-v10-heartbeat.json). |
| Delayed-link rendering | A fixed 300 ms cap was already exhausted at receipt on 800 ms RTT. Prediction now separates transit time from a short continuation allowance and remains capped at 900 ms. Collision checks, epochs and authoritative corrections remain. A deterministic 110/400/800 ms test verifies movement between receipts. |
| Rendering workload and controls | Expensive canvas worlds target 60 paints/sec instead of 144 full paints/sec on high-refresh screens; the scheduler avoids the naive 48 Hz cadence. Selected game chunks warm during setup. Duplicate-tab leases yield hidden owners. Fresh action snapshots can defer redundant polling when no newer revision is wanted. |
| Multiplayer runtime checks | Two local browser clients each for Snake, Kart and Block Drop under synthetic 110 ms latency: authoritative controls acknowledged, movement advanced, no runtime errors, sampled 60 FPS. This is not a production Internet or all-device guarantee. [Evidence](hud-fairness-v10-multiplayer.json). |
| Gates | 332 tests pass, TypeScript passes, all 17 real local API create/start/poll/end/leave flows pass. Sites/Pages builds pass; standalone Worker dry run passes. [API evidence](hud-fairness-v10-api.json). |

## Limits and publication tracking

- Production game hosts remain blocked by this environment's enforced network policy. Actual Philippines ISP latency, production percentile improvement and universal elimination of stutter remain **unverified**.
- The heartbeat does not turn revision sockets into private-state or input sockets. Actions and private projections retain authenticated HTTP and polling fallback. Only active action rooms incur simulation ticks; it deliberately does not run abandoned games forever.
- A real loss of all active players can still pause a game after a connection gap. Existing rooms and both DO namespaces retain their data. Southeast Asia remains a best-effort placement request for newly created rooms.
- AI is heuristic and intentionally fallible. Phone drawing/description templates and Terra follow/mine behavior retain their previously documented limitations; this is not an expert game-solving model.
- Browser checks cover the listed flows. They do not establish that every device, browser, map and long session is free of visual issues. The separately loaded documentation chunk still produces the retained Pages size warning.
- Publish in the requested order: GitHub source → GPT Site → Cloudflare. Exact source is retained in Sites version metadata and the Cloudflare `source:<SHA>` tag; native receipts are reported only after success.

Cloudflare's current Durable Object lifecycle/concurrency guidance informed the timer implementation. Authenticated sockets report foreground activity every three seconds while visible; one hidden update stops eligibility. The existing durable commit happens before revision notification.
