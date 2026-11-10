# Markup — learn, code & play together

A responsive HTML/CSS learning studio with light/dark themes, a sandboxed playground, source-linked documentation and multiplayer games.

This release contains the recording fixes and six-game expansion. See [Phase 1](docs/PHASE1_REPORT.md) and [Phase 2](docs/PHASE2_REPORT.md) for implementation, evidence and remaining limits.

## What is included

- 46 detailed guides: meaning, context, implementation steps, complete examples and pitfalls.
- A searchable 3,149-entry reference inventory pinned to the requested 29 October 2026 cutoff, including formal grammars, recorded values and available compatibility metadata.
- 24 lessons, 9 projects, 16 visual practices and 127 authored reference recipes.
- Code Sprint, Stack Survival and Quiz Cards for up to 8 players, plus timed and untimed solo practice.
- 849 definition facts, 2,547 question-format variants and 100 code-completion tasks. Seeded question and option shuffling gives every player the same order at the same progress index.
- Seventeen casual games, including simultaneous Snake, memory, ladders, cards, drawing relay, kart racing, a shared mining world, strategy boards, sumo, tanks, paddle rally, marble racing, falling blocks and 8-ball pool. Most support 8 players; UNO supports up to 12; chess/dama/sci-dama, Paddle Rally and Pocket Billiards use 2 seats.
- Emoji chat and six free virtual gifts. Shared history clears when someone leaves or the host changes games, caps at 50 messages, and expires after 15 minutes.

## Arcade update

Six original arcade editions join the existing games: Sumo Circle, Tank Courtyard, Paddle Rally, Marble Trail, Block Drop and Pocket Billiards. Sumo, tanks and paddles support two people on one keyboard; marble and blocks support solo practice; pool supports passing the device. Online modes share the authenticated room transport, diagnostics and input acknowledgements. Search accepts familiar names such as “pool”, “ping pong” and “tetris”. Players/scores and collapsible chat sit beside the game and remain available in room fullscreen.

Pocket Kart now uses longer Meadow, Coast and Night tracks, new top-down kart artwork, a smooth chase camera, a non-overlapping starting grid and corrected keyboard controls. Deterministic baseline laps measured 58–62 seconds; driving, items and collisions change an actual lap time. Arrow keys or WASD drive, Space drifts, E uses an item and R recovers. The enlarged tracks apply to new races; an already-running older room retains its existing track geometry.

Snake Xenzia has boundary-scheduled predicted turns, a bounded adaptive snapshot buffer, fewer redundant requests and cached arena backgrounds. All six map themes have refreshed graphics. Network and device performance still affect responsiveness.

Property Parks and Snakes & Ladders roll animated dice and hop through each traversed tile. The larger chess, dama and sci-dama boards, memory cards and default Auto layout improve readability; Fit screen, Resize and fullscreen remain available.

Doodle Relay includes round, marker, pencil, soft, calligraphy, eraser and tolerant bucket-fill tools; 1–64 px sizes; 5–100% opacity; custom colors; two-color gradients; normal, multiply and screen blending; and undo/redo. The relay, album and PNG export use the same drawing renderer. Deadline drafts, retries, stage assignments and fixed backing resolution address lost/blank art. The current all-game viewport and AI checks, including Doodle Relay, are recorded in the v33 verification report below; they do not constitute exhaustive browser testing of every drawing tool.

The shared transport uses private exact-base deltas, full-state recovery, stale-revision rejection, retry acknowledgements, per-player budgets and resumable seats. Real-time clients buffer remote poses and replay local inputs at their issue times with bounded correction. Fixed physics steps are 50 ms, while Snake follows its configured grid cadence. Games pause after an eight-second room update gap; resuming preserves remaining effects and releases stale held controls. Canvas backgrounds, symbols, grid layers and model buffers are reused; canvas DPR and extrapolation are bounded. Hidden arenas stop painting. Memory's 100 faces are bundled SVG artwork, avoiding face-image network/decode stalls.

The original service supports authenticated HTTPS polling. The dedicated room service now also supports authenticated WebSocket state and control receipts; see the v12 update below. Measurements in the phase reports are bounded local samples, not universal frame-rate or Internet-latency guarantees.

The inventory is not an exhaustive tutorial for every possible HTML/CSS expression. It includes 1,333 records without upstream explanatory prose. These are explicitly labeled. CSS value spaces include unlimited numbers, URLs and author-defined names; formal grammar describes those spaces. An upstream status or compatibility record is not certification of every browser behavior.

## Run locally

Use Node 24 and pnpm 11.25.0:

```sh
corepack pnpm install --frozen-lockfile
corepack pnpm run dev
```

The dev server prints its local URL. Online rooms need the local D1 schema; ordinary browser-only learning and solo play do not. The existing Drizzle migrations are under `drizzle/`. Apply these to the preview's local D1 database using Wrangler before testing online rooms. Production Sites applies the bundled migrations to its separately provisioned D1 database.

```sh
corepack pnpm run check
corepack pnpm run test:non-relay
node --experimental-strip-types scripts/verify-examples.mjs
corepack pnpm run build
corepack pnpm run build:pages
```

`test:non-relay` executes the current non-Doodle suites with `--test-isolation=none`. It leaves the four historical mixed suites intact but excludes them because they execute Doodle. The original `test` command includes those suites and has not been run for this update. CSS example checks are syntax parsing; they do not certify semantics or cross-browser rendering.

## Hosting

The Sites build is a Cloudflare Worker with D1-backed authenticated room state. `.openai/hosting.json` records its existing Site identity. Preserve that ID for future updates.

The GitHub Pages build is `dist-pages/`, with relative asset URLs so repository subpaths work. The included workflow builds, checks, uploads the Pages artifact and deploys it after GitHub Pages is enabled for the repository. See [GITHUB_PAGES_SETUP.md](GITHUB_PAGES_SETUP.md).

**Use a matching backend for online play.** The six new game identifiers require the Worker source from this release. GitHub Pages needs its one-time repository enablement; the hosted Site uses the same authenticated room service for its own visitors and the configured Pages origin.

GitHub Pages is static hosting. Shared rooms call the separately hosted service configured in `lib/multiplayer-config.ts`; optional build variable `VITE_ROOM_API_ORIGIN` overrides that public URL. The service must permit the frontend origin and be accessible to its visitors. A private hosted service cannot supply unauthenticated rooms to public GitHub Pages visitors. No bearer session tokens or service secrets belong in the repository.

## Room behavior and limits

Answers and casual game actions are checked by the server, with revision-based writes and replay protection. Controls coalesce pending inputs, use bounded retries, and reconcile predicted motion with server snapshots. Actual delay depends on device, connection and service response; zero latency is not a supportable guarantee.

Explicit departure deletes the room's entire chat history. Navigation and tab closing send a best-effort keepalive disconnect request, preserving the seat for rejoin; a closed or offline browser cannot guarantee delivery. Expired messages are hidden immediately on the next read and removed on room activity. Expired rooms are pruned when a new room is created.

Learning progress, bookmarks and theme are device-local. Chat is transient. Games are for friendly learning and play; this is not a cheat-proof competitive service.

## Evidence

See [AUDIT_REPORT.md](AUDIT_REPORT.md) and `docs/verification/` for the actual automated checks, Chromium flows, source integrity checks, and remaining deployment/browser limits. Dataset attributions and licenses are retained under `public/sources/`. The latest authored corrections preserve the pinned upstream files and apply to both documentation and the playable bank.

The recording fixes replace memory's 3D backface flips with lightweight 2D transitions, bundle every face as SVG symbols, and show immediate pending feedback until the authoritative reveal arrives. Mismatches remain readable for 2.2 seconds on Cozy, 1.6 on Standard and 1.2 on Expert. Memory polls more frequently, and ordinary polls no longer throttle themselves after a response. Snake uses solid player colors without names over the bodies, with a bounded latency-adaptive prediction window. Kart's default camera keeps north up; Change camera restores the heading-following view. See `docs/verification/recorded-fixes-v4.md`.

## Verified arcade optimization release (v6)

All 17 arcade modes support computer seats using bounded, rule-based decisions. Hosts choose the AI count; friends keep their own seats and bots cannot inherit room ownership. The drawing relay companion uses simple templates and a generic description; it does not interpret arbitrary drawings. Terra companions follow and mine rather than plan an entire campaign.

The v6 health-probe selection was superseded by v7 below. The frontend remembers a session’s original service so an existing room does not switch servers mid-round. The dedicated Worker is built from `worker/arcade-service.ts` and `wrangler.arcade.jsonc`. Active rooms own local durable state. Authenticated HTTP carries receipts, deltas and coalesced inputs; v7 adds live revision notifications.

This release fixes capped request reading before routing, durable cache state after failed writes, and one-time legacy D1 room import. Expiry and legacy player lookups now have indexes. Chess validates from the current FEN rather than replaying the full history. Memory symbols load with the memory board instead of every arcade visit.

Pool has a longer tapered cue, power-dependent preparation and strike animation, aiming preview and keyboard fine adjustment. New tank maps have 2.25× the playable area, independent hull/turret models, moving treads, projectile trails, recoil and five-shell reloads. New sumo rings have 1.69× the area. Existing rooms retain their original scale. Block Drop has a portrait mobile well, bounded lock-delay adjustments and row flashes. Arcade scoreboards, touch controls, phone layouts, UNO actions and board surfaces received readability changes.

See [the v6 verification ledger](docs/verification/optimization-v6.md). Its local CPU, HTTP and browser measurements are not claims about every visitor’s device or Internet connection. Publication receipts are recorded in the release report supplied with the update.

## Urgent room receipt update (v7)

New production rooms use the dedicated Durable Object service directly for both arcade and coding games. Live revision notifications reduce idle polling and the wait for another player's turn, while authenticated HTTP still carries actions and private game state. Existing rooms retain their original authority; create a new room after the current round to select the current dedicated service. The connection panel now separates round trip, server work and game-state age. See [the receipt fix evidence](docs/verification/network-receipts-v7.md) for measured results and production verification limits.

## Game continuation (v8)

UNO/Flip bot scores now carry between hands, penalty Wild choices obey challenge rules, Sci-Dama bots minimize signed consumption, and serial AI turns remain visible. Local views stay on human seats during AI turns. Solo UNO opens your hand automatically; pass-and-play between humans retains its privacy screen.

Sumo has cached shaded wrestlers, animated limbs, dash trails and readiness meters. Strategy pieces have shaded models and movement that starts at the received server timeline, including the castling rook. Ladder boards, property buildings and ownership markers have more depth. Long property labels fit their spaces; large UNO hands scroll inside the hand panel and large tables use compact player bands. Memory reuses unchanged boards and owner lookups.

See [the current verification and publication tracker](docs/verification/game-continuation-v8.md). Historical ledgers describe their own release, and all timing results are labeled by measurement environment.

## Philippines network and movement update (v9)

New rooms request Southeast Asia placement using `apac-se`; this is best effort and does not relocate existing rooms. Stable polling URLs and header-based snapshot hints allow browser preflight reuse, while game responses remain uncacheable. Snake follows received grid trails with short prediction; other action games cap speculation at 300 ms, use finite correction thresholds, and reset on resume. Terra also checks corrections against terrain and filters camera jitter. The dedicated service root opens the arcade.

See [the v9 verification tracker](docs/verification/network-visual-v9.md) for tests, browser preflight counts and explicit production/geographic measurement limits.

## HUD, fair AI and simulation update (v10)

Turn-based games now show clear turn-arrival notices and persistent contrasting status, including fullscreen. Leave, End round and Resume controls have distinct colors and larger touch targets in both themes. Bots have varied reactions and legal choices; memory bots learn separately, forget faces and can miss pairs without inspecting hidden cards.

Active action rooms have a foreground-only server simulation heartbeat. Rendering compensates for transit time before applying its bounded prediction allowance, high-refresh devices avoid excessive whole-world paints, and selected game scenes warm during setup. See [the v10 verification tracker](docs/verification/hud-fairness-v10.md) for the 332 tests, all-game HUD checks, multiplayer evidence and remaining production measurement limits.

## Live play and stable game views (v12)

The dedicated room service negotiates private WebSocket snapshots, exact-base deltas and authoritative action receipts. Foreground action rooms advance at 50 ms steps. Each client may have four unacknowledged state frames; slower links receive the newest committed state when space becomes available. Handshake timeouts, heartbeat checks, bounded reconnection and full-state recovery keep HTTP fallback available. Old clients and revision-only servers remain compatible. Drawing Relay keeps its large artwork transfers on HTTPS and receives live revision notifications.

Game status and turn notices now occupy their own layout space. They do not follow the viewport over the board. Fullscreen reserves room for controls, and exiting restores the selected layout. Private UNO hands scroll separately from Draw, penalty and Wild-color controls. Guides and rule sources live behind **Guides & controls** beside the game; detailed scene tips and edition notes have their own toggles. Setup controls and documentation tabs also fit narrow phones.

Movement presentation uses finite recovery thresholds, stable marble rolling, eased block movement and a camera initialized to the controlled actor. Focusing a form or opening inventory releases held controls. Terra reuses terrain chunks and light stamps instead of repainting every tile; map cards use the playable track and cover geometry. The static Pages entry now imports the same current arcade styles as the hosted entry.

Browsers and this Worker deployment do not expose raw UDP game sockets. This implementation uses encrypted WebSockets and HTTPS. A UDP-based WebRTC or WebTransport service would require additional supported infrastructure.

See [v12 verification and deployment notes](docs/verification/live-play-v12.md) for the actual local checks, screenshots, measured limits and the deployment status.

## Multiplayer and viewport completion (v14)

The latest GitHub redesign is integrated with bounded live control delivery, measured socket round trips, stable movement corrections and Sumo tournament viewing. Auto layout is the default; website, room and viewport tools can be hidden independently. UNO cards stay straight and readable, pool balls are larger with matching physics, and Moonlit Harbor adds a fourth arena. Terraria gameplay is unchanged.

See [v14 verification](docs/verification/live-play-v14.md) for the 389 tests, all-game layouts, eight-player sockets, delayed-transport measurements and publication checks. These release notes supersede the deployment-pending statements in the older v12/v13 reports.

## Game studio and slow-network update (v15)

Adaptive live-state windows prevent multi-second acknowledgement stalls, movement receipts are smaller, pending delta bases remain available, and casual bots advance without browser polling. Separate website, room, game-details and viewport toggles keep Auto layout spacious. Four table scenes, eight Snake maps, four kart tracks and five action arenas add variety; Foundry tank supplies, collision-safe tank starts, brighter shells, larger pool balls and larger Block Drop rival wells improve play. Terraria's game and original viewport are preserved.

See [v15 verification](docs/verification/game-studio-v15.md) for 400 passing tests, desktop/phone checks and measured continuous delivery at 3000–5000 ms RTT. Network transit time remains visible in the diagnostics.

## Recording fixes and cleaner game views (v18)

The latest GitHub updates are integrated with complete Snake ribbons, safer online turn deadlines, bounded route-finding bots, a dedicated score panel and independent chat. Pool has a larger responsive power control, gentler low shots and clearer shot planning for bots. Website spacing, hand controls, tank health and Playground tabs are corrected; recent room activity is removed. Hidden chat loads on demand, and live receipts avoid redundant world serialization.

See [v18 verification](docs/verification/arcade-v18.md) for 435 passing tests, all-game desktop/phone checks, 18 delayed Snake turns and controlled multiplayer measurements. Terraria gameplay and its original viewport are preserved.


### Arcade v19

The slate and indigo interface restores the illustrated game library and adds flat map previews, clearer room setup, visible dockable player/chat panels, player-colored turn feedback, shared chassis collision hulls, and indexed simulation geometry. See [v19 verification](docs/verification/arcade-v19.md) for 465 tests, 145 local/online catalog combinations, responsive layouts and measured performance.

The v20 recording follow-up repairs stale-world recovery and slow-fallback prediction, constrains visual reconciliation, and adds clear controlled-character markers. See [v20 verification](docs/verification/arcade-v20.md) for network, movement, identity and responsive checks.

GitHub PR #5 runtime improvements are integrated. The Snake recording follow-up also prevents a new turn from rewriting a partially drawn cell on local and fast connections; see the replay evidence and network limits in the v19 report.

The [desktop online follow-up](docs/verification/arcade-v21.md) documents Snake prediction, canvas recovery, playback resume and board placement fixes, including the remaining very-slow-link correction.

The [character-flow and website follow-up](docs/verification/character-flow-v23.md) adds explicit per-round model confirmation, 18 saved themes, visible setup transitions, origin compatibility and reduced hidden rendering work.

The [game customization follow-up](docs/verification/game-customization-v24.md) adds 15 game-specific designs for each of 17 arcade games, 24 named colors, matching live artwork, persistent per-game selections and game-aware character confirmation.

The [optional setup and live movement update](docs/verification/player-setup-v25.md) replaces mandatory confirmation with automatic selection and ready-to-use defaults. Characters persist across map changes and reset on game changes or rejoining. Per-game saved controls, clearer setup, 32 named rule presets, three interface styles, synchronous room storage and 50 ms live snapshots are verified with 519 tests and controlled two-browser multiplayer checks. See the [hosting research](docs/verification/player-setup-v25-hosting.md) for free hosting limits and measurement scope.

The [hidden strategy games update](docs/verification/hidden-games-v26.md) adds Game of the Generals and Hidden Fleet, bringing the arcade to 19 games. Both support private online play, fair AI, spectators, original miniature artwork, 15 model sets each, saved controls and responsive boards. Generals uses a server arbiter and the PhilGGO Flag-survival convention; Hidden Fleet implements hit-keeps-turn tile battles with ships, aircraft, vehicles and islands. Rules, house modes, privacy and controlled-link verification are documented in the report.

The [arcade refinement update](docs/verification/arcade-refinement-v27.md) removes heavy setup glows, repairs spacing and clipped color swatches, adds larger game-specific customization previews and reset/randomize tools, and brings public camera-follow controls to online spectators and local AI watching across all 19 games. Character/control customization stays optional; private information remains concealed.

The [Solitaire and live drawing update](docs/verification/arcade-v28.md) brings the arcade to **21 games**. Solitaire includes eight rulesets and independent same-deal online races; Sketch & Guess includes 240 randomized words, live drawing, private prompts and server-enforced solved-player chat locks. A separate dockable Game info panel keeps rules and tips off the board. Spectators have faded gray character models and can resume paused arenas when the host is offline; Snake bodies remain solid for AI and human players.

[Pirate Bomb Brawl](docs/verification/pirate-brawl-v31.md) adds the 22nd game with eight arenas, seven modes, six animated crews, fifteen outfits and 44 skills. Its native HUD supports online authority, local multiplayer, spectators, saved controls, multi-touch, gamepads and optional music.

The [v33 window, proportion and audio update](docs/verification/arcade-v33.md) audits all 22 arcade games and the three coding games in both layouts, locks card/board/canvas proportions, restores Pirate's pixel HUD and all-fighter camera, adds Tank's reticle, introduces configurable match rounds, and shares optional music/effects with bounded resource use. Rules stay in a separate hideable panel; fullscreen room panels start hidden. The report records the exact verification and remaining upload/Cloudflare connection limits.

The [UNO, scene, editor and delayed-control repairs](docs/verification/arcade-v34.md) add a clear UNO declaration/catch flow, preserve selected fullscreen boards, restore readable Playground/lesson code and correct held-input queuing on slow links. The updated v34 dedicated live service handles all new Sites/Pages arcade rooms, including UNO, Pirate and finite rounds. Existing room origins stay pinned. The report records local production checks and Cloudflare deployment verification.
