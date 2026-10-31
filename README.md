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

Doodle Relay includes round, marker, pencil, soft, calligraphy, eraser and tolerant bucket-fill tools; 1–64 px sizes; 5–100% opacity; custom colors; two-color gradients; normal, multiply and screen blending; and undo/redo. The relay, album and PNG export use the same drawing renderer. Deadline drafts, retries, stage assignments and fixed backing resolution address lost/blank art. These current Doodle changes are source-traced and typechecked only; the game has deliberately not been launched or tested under the supplied instruction.

The shared transport uses private exact-base deltas, full-state recovery, stale-revision rejection, retry acknowledgements, per-player budgets and resumable seats. Real-time clients buffer remote poses and replay local inputs at their issue times with bounded correction. Fixed physics steps are 50 ms, while Snake follows its configured grid cadence. Games pause after an eight-second room update gap; resuming preserves remaining effects and releases stale held controls. Canvas backgrounds, symbols, grid layers and model buffers are reused; canvas DPR and extrapolation are bounded. Hidden arenas stop painting. Memory's 100 faces are bundled SVG artwork, avoiding face-image network/decode stalls.

The transport remains authenticated HTTPS polling with D1 storage. This hosting configuration has no durable WebSocket broadcast binding; a 20 Hz simulation step is not a 20 Hz network broadcast. Measurements in the phase reports are bounded local samples, not universal frame-rate or Internet-latency guarantees.

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

New rooms can use `https://markup-arcade.kendsfabros.workers.dev` after its public health check confirms Durable Objects. The frontend remembers a session’s original service so an existing room does not switch servers mid-round. The dedicated Worker is built from `worker/arcade-service.ts` and `wrangler.arcade.jsonc`; its initial rollout follows the GPT Site publication. It uses the account’s existing D1 database for legacy import, while each active arcade room owns local durable state. Transport remains authenticated HTTP with receipts, deltas, input coalescing and bounded prediction.

This release fixes capped request reading before routing, durable cache state after failed writes, and one-time legacy D1 room import. Expiry and legacy player lookups now have indexes. Chess validates from the current FEN rather than replaying the full history. Memory symbols load with the memory board instead of every arcade visit.

Pool has a longer tapered cue, power-dependent preparation and strike animation, aiming preview and keyboard fine adjustment. New tank maps have 2.25× the playable area, independent hull/turret models, moving treads, projectile trails, recoil and five-shell reloads. New sumo rings have 1.69× the area. Existing rooms retain their original scale. Block Drop has a portrait mobile well, bounded lock-delay adjustments and row flashes. Arcade scoreboards, touch controls, phone layouts, UNO actions and board surfaces received readability changes.

See [the v6 verification ledger](docs/verification/optimization-v6.md). Its local CPU, HTTP and browser measurements are not claims about every visitor’s device or Internet connection. Publication receipts are recorded in the release report supplied with the update.
