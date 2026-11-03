# Character customization, spectators and map expansion

Integrated with GitHub main `96be21b10b09369beaa473041d3489d4241e53b9`. The upstream removal of highlight rings from Kart and Sumo duels is preserved. This batch adds cosmetic choices without changing their collision footprints.

## Shipped behavior

- Seven kart bodies (six additional designs), premade board tokens, Snake, Tank, Sumo, Marble and strategy-piece styles, plus saved custom colors. Character choices can be changed between moves and during a round. The HUD and standings use the selected color.
- Uploaded PNG/JPEG/WebP images are cropped client-side to static 128×128 PNG portraits. Authenticated uploads are bounded and validated; room snapshots carry only a hash. Portraits are fetched separately with bounded client caches and server storage, and removed when the seat or room is removed.
- Spectators can join during a match, chat and select a player perspective. The server excludes watchers from game actors, turns and private hands, and rejects gameplay actions. Players can change role between rounds. Host room administration remains available.
- Two Snake layouts, two kart tracks, two shared arena layouts, and two board/card table themes; 22 generated preview images. Tank arenas include timed supply events. Existing themes, chat, standings and billiards changes remain included from the earlier releases.
- Spectator rendering fixes for Blocks, Property, Doodle Relay and Terra; automatic Kart HUD fallback and selected-player arena HUDs. Terra gameplay and its viewport are preserved.

## Verification — 2026-11-03 UTC

- `npm test`: **495 passed**, zero failures. Map regressions cover connected Snake paths, protected starts, safe tank spawns/supply pads, and bots completing all seven kart tracks. New tests cover validated appearance, bounded/authenticated images and spectator authorization across all 17 games.
- `npm run check`: passed. CSS examples: 327 parsed.
- `npm run build:pages` and `npm run build`: passed, including prebuild generators and postbuild retention of older immutable client assets (345 checked). Existing large-reference-chunk and framework route-classification notices remain.
- New-file lint: zero errors, two native-image warnings. This does not claim the entire legacy repository is lint-clean.
- [All-game browser checks](customization-spectators-v22/all-game-spectators.json): 17 games × desktop/mobile, no page errors, blank canvases, recovery screens or horizontal overflow. [Eight targeted checks](customization-spectators-v22/spectator-hud-final.json) passed again after the final HUD adjustment.
- [Two-browser customization flow](customization-spectators-v22/customization.json): seven kart choices, saved color/model, mid-round spectator perspective, replicated uploaded portrait, hash-only snapshots, denied anonymous portrait reads, post-round role switch and mobile dialog fit.
- [Performance sample](customization-spectators-v22/render-performance.json): four actors in Tanks, Marble and Kart on desktop/mobile, 59–60 FPS with zero newly constructed gradients in each 1.8-second warmed sample, no errors or overflow.
- [Snake delayed-network trace](customization-spectators-v22/snake-1400ms.json): 1,400 ms injected RTT, dragon appearance, 60 FPS, player survived, zero stationary frames, full opacity and no same-life step over 0.65 cells for either snake. Maximum own step was 0.146 cells. Initial connection warmup reached 2.25 seconds; subsequent state gaps peaked at 317 ms. A separate Canopy-map trace also had full opacity and no large steps, but ended in a collision and is not evidence of uninterrupted survival.

Browser figures are local headless Chromium measurements, not guarantees for every device or network. Publication uses GitHub main and its existing Pages/Cloudflare integrations. The recorded GPT Sites project is unavailable to this connected account; no new Site or manual Cloudflare deployment is created. Online portraits, spectator authorization and new maps require the matching room-server code; a successful frontend build alone does not verify the dedicated production API.
