# Markup — learn, code & play together

A responsive HTML/CSS learning studio with light/dark themes, a sandboxed playground, source-linked documentation and multiplayer games.

## What is included

- 46 detailed guides: meaning, context, implementation steps, complete examples and pitfalls.
- A searchable 3,149-entry reference inventory pinned to the requested 29 October 2026 cutoff, including formal grammars, recorded values and available compatibility metadata.
- 24 lessons, 9 projects, 16 visual practices and 127 authored reference recipes.
- Code Sprint, Stack Survival and Quiz Cards for up to 8 players, plus timed and untimed solo practice.
- 849 definition facts, 2,547 question-format variants and 100 code-completion tasks. Seeded question and option shuffling gives every player the same order at the same progress index.
- Eleven retained casual games, including simultaneous Snake, memory, ladders, cards, drawing relay, kart racing, a shared mining world and strategy boards. Capacity follows each game's rules: most support 8; UNO supports up to 12; the three strategy boards use 2 seats.
- Emoji chat and six free virtual gifts. Shared history clears when someone leaves or the host changes games, caps at 50 messages, and expires after 15 minutes.

## Arcade update

Pocket Kart now uses longer Meadow, Coast and Night tracks, new top-down kart artwork, a smooth chase camera, a non-overlapping starting grid and corrected keyboard controls. Deterministic baseline laps measured 58–62 seconds; driving, items and collisions change an actual lap time. Arrow keys or WASD drive, Space drifts, E uses an item and R recovers. The enlarged tracks apply to new races; an already-running older room retains its existing track geometry.

Snake Xenzia has boundary-scheduled predicted turns, a bounded adaptive snapshot buffer, fewer redundant requests and cached arena backgrounds. All six map themes have refreshed graphics. Network and device performance still affect responsiveness.

Property Parks and Snakes & Ladders roll animated dice and hop through each traversed tile. The larger chess, dama and sci-dama boards, memory cards and default Auto layout improve readability; Fit screen, Resize and fullscreen remain available.

Doodle Relay includes round, marker, pencil, soft, calligraphy and eraser tools; 1–64 px sizes; 5–100% opacity; custom colors; two-color gradients; normal, multiply and screen blending; and undo/redo. The relay, album and PNG export use the same drawing renderer.

The performance update batches overlapping room work within each Worker isolate, preserves revision checks across isolates, returns small acknowledgments for unchanged casual rooms and reuses acknowledged Snake scenery. Stable game views avoid repeated board reconstruction; drawing caches completed strokes. Action-game prediction tolerates longer response gaps, remote movement stays on one display timeline, and hidden/offscreen arenas stop painting. Canvas recovery rebuilds disposable graphics. The transport remains authenticated HTTP polling with D1 storage; connection/device delay still matters. See `docs/verification/performance-v3.md` for measured results and limits.

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
corepack pnpm test
node --experimental-strip-types scripts/verify-examples.mjs
corepack pnpm run build
corepack pnpm run build:pages
```

`npm test` uses `--test-isolation=none` so this environment executes and reports the individual TypeScript tests. CSS example checks are syntax parsing; they do not certify semantics or cross-browser rendering.

## Hosting

The Sites build is a Cloudflare Worker with D1-backed authenticated room state. `.openai/hosting.json` records its existing Site identity. Preserve that ID for future updates.

The GitHub Pages build is `dist-pages/`, with relative asset URLs so repository subpaths work. The included workflow builds, checks, uploads the Pages artifact and deploys it after GitHub Pages is enabled for the repository. See [GITHUB_PAGES_SETUP.md](GITHUB_PAGES_SETUP.md).

GitHub Pages is static hosting. Shared rooms call the separately hosted service configured in `lib/multiplayer-config.ts`; optional build variable `VITE_ROOM_API_ORIGIN` overrides that public URL. The service must permit the frontend origin and be accessible to its visitors. A private hosted service cannot supply unauthenticated rooms to public GitHub Pages visitors. No bearer session tokens or service secrets belong in the repository.

## Room behavior and limits

Answers and casual game actions are checked by the server, with revision-based writes and replay protection. Controls coalesce pending inputs, use bounded retries, and reconcile predicted motion with server snapshots. Actual delay depends on device, connection and service response; zero latency is not a supportable guarantee.

Explicit departure deletes the room's entire chat history. Navigation and tab closing send a best-effort keepalive leave request; a closed or offline browser cannot guarantee delivery. Expired messages are hidden immediately on the next read and removed on room activity. Expired rooms are pruned when a new room is created.

Learning progress, bookmarks and theme are device-local. Chat is transient. Games are for friendly learning and play; this is not a cheat-proof competitive service.

## Evidence

See [AUDIT_REPORT.md](AUDIT_REPORT.md) and `docs/verification/` for the actual automated checks, Chromium flows, source integrity checks, and remaining deployment/browser limits. Dataset attributions and licenses are retained under `public/sources/`. The latest authored corrections preserve the pinned upstream files and apply to both documentation and the playable bank.

The recording fixes replace memory's 3D backface flips with lightweight 2D transitions, preload/decode the small artwork set, and show a readable fallback or immediate pending face. Mismatches remain readable for 2.2 seconds on Cozy, 1.6 on Standard and 1.2 on Expert. Memory polls more frequently, and ordinary polls no longer throttle themselves after a response. Snake uses solid player colors without names over the bodies, with a bounded latency-adaptive prediction window. Kart's default camera keeps north up; Change camera restores the heading-following view. See `docs/verification/recorded-fixes-v4.md`.
