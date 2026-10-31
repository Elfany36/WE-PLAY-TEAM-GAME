# Current implementation status

The report below is historical version-four evidence. Current Phase 1 and Phase 2 changes and their verification limits are recorded in `docs/PHASE1_REPORT.md`, `docs/PHASE2_REPORT.md` and the v5 verification files. Doodle Relay changes are source-traced and TypeScript-checked only; Doodle was deliberately not launched or tested. The phase reports describe the current implementation; the remainder of this file records the earlier release.

# Markup improvement and verification report

Reviewed 31 October 2026. Reference inventory cutoff: 29 October 2026, 23:59:59 UTC.

## Delivered changes

- Preserved all three coding games and eleven casual games from the uploaded source.
- Added six catalog-controlled free virtual gifts, emoji controls and readable responsive chat bubbles. The server derives gift text rather than trusting client-supplied gift descriptions.
- Room chat clears when any player explicitly leaves, an inactive seat is removed, or the host switches games. A reset epoch synchronizes the client tray, draft and unread state. Messages cap at 50, expire after 15 minutes and are removed from stored state on subsequent room activity. New-room creation prunes expired 24-hour rooms.
- Navigation and tab closing issue a best-effort keepalive departure. Offline or terminated browsers cannot guarantee delivery.
- Centralized the multiplayer service URL and CORS origin policy. The published Site accepts its own origin and the selected GitHub Pages origin.
- Removed redundant coding-room heartbeat requests; authenticated reads refresh presence on a bounded interval. Preserved optimistic revision checks and answer replay protection.
- Limited failed control retries to seven attempts, while allowing new input to recover. Preserved coalescing, prediction, authoritative reconciliation and monotonic display clocks.
- Cached a bounded set of seeded question orders. Split the playable facts from the full reference inventory: coding games no longer need to fetch the roughly 4.1 MB uncompressed reference module. The playable Arena module is approximately 442 kB uncompressed / 88 kB gzip in the measured Pages build. The full inventory remains lazy-loaded for reference browsing.
- Added custom coding-game illustrations, larger readable UI text, code line-wrap controls, mobile cards, reduced-motion handling and scrollable fitted/resized surfaces. Fit-screen height accounts for the panel's screen position and its controls.
- Added five detailed, source-linked guides: attribute value kinds, document metadata, CSS value stages, subgrid, and scoped styles. There are now 46 guides.
- Corrected reference prose for @charset, @media and @property, retaining the existing :not() correction and preserving upstream pinned data. Authored corrections apply to both the reader and generated playable facts.

## Source integrity and content scope

All 11 original pinned dataset input hashes and byte lengths were re-fetched and matched. All four bundled dataset license hashes matched. Exact source commit dates were independently checked and fall before the cutoff. See `docs/verification/reference-hashes.json` and `reference-audit.md`.

The UI has 3,149 inventory entries; 1,333 lack upstream explanatory prose and 1,455 have compatibility metadata. The bank has 849 definition facts, 2,547 format variants and 100 original completion tasks. These counts are not thousands of independently researched questions. The new generated playable fact file is checked against the corrected reference projection.

The historical source pins support the inventory date. Live WHATWG/MDN links can change after that date. CSS accepts unbounded numbers, author-defined identifiers, URLs and combinations; formal grammar, rather than an enumeration of every concrete value, describes them. Missing-prose entries remain labeled as grammar/metadata records. This is not a complete authored tutorial or independent standards certification for every indexed entry.

## Automated verification

- 211 individual Node tests passed, with zero failures. The test command explicitly uses `--test-isolation=none`; the environment's default isolated runner had reported file wrappers instead of individual test results.
- TypeScript checking passed.
- 326 CSS documents/snippets parsed, including the new guides and arcade stylesheet. This is syntax parsing, not semantic or browser-behavior certification.
- Hosted Worker and GitHub Pages builds completed successfully.
- Tests cover game rules, answer correctness/normalization, seeded formats, all 100 code tasks, private data projection, authentication, seat caps, concurrent revision writes, replay protection, time limits, motion recovery, terrain reuse, chat cleanup/expiry/gifts, CORS, exercise grading and core theme contrast.

## Chromium browser verification

Local QA used Chromium with the actual Worker/D1 preview. Evidence is in `docs/verification/browser-results.json` and `casual-results.json`.

- Eight separate browser contexts joined Code Sprint, submitted the same correct task and synchronized eight scores. A ninth player was rejected.
- Stack Survival and Quiz Cards each synchronized eight authenticated HTTP players. The sampled quiz used matching cards; deterministic tests cover all three quiz formats.
- Emoji text and catalog gifts synchronized between browser clients. A departure cleared the shared history.
- Dark mode, fullscreen entry/exit and resizing with an inner scroll area passed.
- Seven main views were inspected at a 390 px viewport with no document-level horizontal overflow. Desktop checks used a 1440 px viewport.
- All ten locally playable casual modes rendered and started. Movement controls were exercised for the three simultaneous action modes.
- All eleven casual models started through the online HTTP API and accepted authenticated reads at their tested capacities: eight seats for party games and two for strategy boards.
- No uncaught browser exceptions were observed in these flows.

These checks are not a complete playthrough of every casual-game state. Browser QA used Chromium emulation; Safari, Firefox, physical phones and adverse real-world network conditions remain unverified. Internet/device latency cannot be eliminated or guaranteed to be zero. The remaining large reference chunk is loaded when reference browsing needs it.

## Arcade controls, motion and graphics update

- Fixed a keyboard-control error where untouched kart keys could produce `NaN` and serialize as invalid `null` controls. Input is now finite for idle, individual, opposing and released keys. Stationary steering no longer rotates the kart; the eight-position starting grid has proper clearance.
- Enlarged all three new-race circuits by 6.6, added 96 ordered progress checkpoints and continuous road-distance detection. Fixed-step baseline bots measured first laps of 58.15 s (Meadow), 60.75 s (Coast) and 62.15 s (Night). These are baseline timings, not a guaranteed duration for every driver. Existing older active races keep their original world scale.
- Added original top-down kart artwork, steered wheels, helmets, drift/boost effects, smoother camera motion, themed scenery, coastline water and a readable minimap. Cached road/scenery paths reduce repeated geometry work.
- Snake schedules turns at a future visible grid boundary so a new input does not rewrite an already-predicted segment. Local growth prediction, bounded extrapolation, a smaller adaptive remote buffer, cached obstacle lookups/backgrounds and direct numeric canvas paths reduce unnecessary work. A second fresh control request can pass a stalled request; stale failures cannot retry over a newer sequence. One-shot controls retain ordering barriers.
- Dice tumble before movement; property and ladder tokens visibly hop tile by tile. A fresh delayed roll still animates its complete path for an existing observer. Property card movement retains the combined route. Action panels sit below the board and wait for the local movement presentation to finish.
- Added six Doodle tools, 24 swatches/custom colors, gradients, opacity, width, blending and undo/redo. Validated styles survive server storage and relay transfer. Editor, incoming drawings, albums and export share one renderer.
- Refreshed all six Snake map themes, enlarged strategy boards and memory cards, improved pieces and card backs, and made content-based Auto layout the default. Explicit fit, resize and fullscreen options are retained. Game controls no longer stick across the middle of tall boards.

Additional Chromium evidence is in `docs/verification/arcade-v2-results.json`, `doodle-v2-results.json`, `snake-v2-single-view-results.json` and `snake-v2-eight-view-results.json`. All three kart tracks accepted real held/released keyboard input without invalid HTTP requests. Dice animation and distinct token positions during travel were observed for both dice games. Strategy and memory layouts passed at desktop, 768 px and 390 px without document-level horizontal overflow. All ten local casual modes and all eleven online mode starts/read flows were repeated.

Two Doodle clients completed a relay with six tools, gradient, opacity and blending; the next player's drawing contained the styled strokes. The revealed album canvas and downloaded PNG matched byte-for-byte when encoded as PNG.

An eight-participant Snake check with one rendered Chromium client and an added 40 ms per request recorded 82 active-frame samples, a 22.4 ms 95th-percentile frame interval and a largest sampled move of 1.59 cells. Eight simultaneously rendered browsers on the same executor also completed the turn/synchronization checks, but their 131 ms 95th-percentile frame interval shows local rendering contention. These short synthetic samples are not production latency benchmarks or a guarantee of smooth rendering on every device. No uncaught JavaScript exceptions occurred in the Doodle or Snake test flows.

## Hosting and access

The subsequent performance release is detailed in `docs/verification/performance-v3.md`, including the unchanged-room protocol, Worker request lifetimes, cross-isolate revision protection, delayed-response browser checks, 640-request control burst and drawing-cache pixel comparisons. Earlier arcade-v2 measurements above describe the preceding graphics release; they are retained as historical evidence.

The source includes a Sites Worker deployment with D1 migrations and a ready-built GitHub Pages distribution. Current returned publication state, source commit and deployment URL are recorded in the delivery message; a build or expected URL alone is not proof that a site is live.

The owner explicitly approved public multiplayer access in this conversation. This update preserves that existing public audience. Public GitHub Pages visitors use the separately hosted room service.

GitHub Pages requires the selected repository's Pages source to be enabled. The connected GitHub connector supports source publication but does not expose that administration operation; the normal workflow token cannot enable it automatically. Setup is documented in `GITHUB_PAGES_SETUP.md`. A successful build artifact is not proof of a completed Pages deployment.

## Primary references

- HTML: https://html.spec.whatwg.org/multipage/
- CSS inventory and specification stability: https://www.w3.org/TR/2026/NOTE-css-2026-20260622/
- CSS byte decoding: https://www.w3.org/TR/2026/CRD-css-syntax-3-20261001/#input-byte-stream
- Conditional CSS: https://www.w3.org/TR/2024/CRD-css-conditional-3-20240815/#at-ruledef-media
- CSS value stages: https://www.w3.org/TR/2022/CR-css-cascade-5-20220113/#value-stages
- Subgrid: https://www.w3.org/TR/2025/CRD-css-grid-2-20250326/#subgrids
- Scoping: https://www.w3.org/TR/2024/WD-css-cascade-6-20240906/#scoped-styles
- GitHub Pages: https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages
- Pages enablement permissions: https://github.com/actions/configure-pages/blob/v5/action.yml

## Recording fixes

The subsequent priority fixes are documented in `docs/verification/recorded-fixes-v4.md`. Previous version measurements remain historical evidence.


## Arcade optimization v6

The current verification is tracked in `docs/verification/optimization-v6.md` and its JSON evidence. Older phase reports describe historical scope and architectures; the v6 ledger supersedes them for this release. The full test suite, including drawing relay suites, now runs in GitHub Pages CI. Production Internet latency and a complete arbitrary-device visual audit remain outside the local measurements.
