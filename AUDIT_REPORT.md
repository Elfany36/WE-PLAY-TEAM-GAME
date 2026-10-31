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

- 188 individual Node tests passed, with zero failures. The test command explicitly uses `--test-isolation=none`; the environment's default isolated runner had reported file wrappers instead of individual test results.
- TypeScript checking passed.
- 324 CSS documents/snippets parsed, including the new guides and refinements stylesheet. This is syntax parsing, not semantic or browser-behavior certification.
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

## Hosting and access

The source includes a Sites Worker deployment with D1 migrations and a ready-built GitHub Pages distribution. Current returned publication state, source commit and deployment URL are recorded in the delivery message; a build or expected URL alone is not proof that a site is live.

Sites creates new sites private. Public visitors and a public GitHub Pages frontend need an accessible room service; the audience must be changed by the owner if public access is desired. No site audience is silently widened.

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
