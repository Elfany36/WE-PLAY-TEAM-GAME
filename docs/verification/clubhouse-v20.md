# Clubhouse boards, billiards and map events — v20

This update follows the merged [v19 runtime and Snake reliability work](performance-v19.md). GitHub main was checked before publication; the implementation was then rebased onto `c4fb580a5dedc955ac935c25d6d1eb27d45d16f6`, retaining the newer dockable panels, collision hulls, world recovery, input timing and visual constraints. The new standings board is embedded in the upstream dock panel. Existing board AI delays/tactics, chat GIFs/gift stickers and resizing, and table/Snake themes are retained.

## Player boards and information hierarchy

All casual games except the protected Terraria surface use a new shared standings board. Ranked rows separate player identity from the primary score and quieter game-specific detail. Player colors, a leader crown, turn/thinking status, reconnect state, progress bars, Tank hull/ammo/armor, and remaining pool balls provide useful information without repeating the old stacked cards. UNO Flip displays only the already-public reverse faces. Names wrap to two lines; the player count stays together; larger rooms scroll inside the board. Lobby readiness and inactive-seat removal remain available.

Pocket Kart has a new compact match HUD with prominent position and lap counts, a named item and activation hint, drift charge, and event notices. The HUD toggle hides the new panel as well as canvas overlays. Table-game HUD colors and typography now use the same slate, ivory and gold palette.

## Billiards

The table has cached wood, woven felt, cushion trim, pocket liners and sight diamonds across the eight existing scenes. Resin balls have colored/striped surfaces and number markings that roll with displayed travel; their lighting remains fixed. The cue has a grip, ferrule and tip, and a brief follow-through/retraction after a shot. These are original Canvas drawings, with no new downloaded assets or runtime dependencies.

The aim guide stops at the nearest ball or cushion, shows the contact position and a short object-ball direction, and is clipped to the playing surface. Cosmetic motion does not change authoritative ball positions, radii, collisions, or shot rules. Reduced-motion preference freezes the decorative roll. Keyboard aim/power/shot controls and pointer placement remain available. The optional motion trace now records displayed pool poses instead of simulation-only positions.

## Map events and models

New enhanced Tank rooms have themed supply pads on all six maps: Garden hull repair, Canyon ammunition, Neon armor/ammo, Harbor repair/ammo, Foundry supplies, and Glacier armor. Non-Foundry locations alternate each cycle. Pads are clear of cover, signaled before opening, bounded in reward, and collectible once per actor per cycle. Bots seek the relevant supply when damaged or depleted. The server awards Tank rewards; client speculation cannot grant them.

New enhanced Kart rooms have one rotating turbo gate per 24-second cycle, with a three-second warning and six-second open window. The five tracks use distinct names and colors. Road chevrons, a diamond on the minimap and a HUD notice identify the gate. Each driver receives at most one short boost per cycle; the night track also gives a brief shield. Event phase derives from match ticks, so pausing preserves the remaining window. A room-version flag prevents a newer frontend from showing events unsupported by an older server.

Marble bumpers now use a cached beveled metal model instead of reconstructing four radial gradients per frame. Their movement and collision footprint stay the same.

## Verification

- TypeScript, all 483 tests, 327 CSS example parses, and both production builds pass.
- Seven new tests cover event locations/rewards/compatibility/pause timing, distance-based pool roll, aim/cue geometry, and public standings across modes. The older no-Garden-event test now explicitly represents an older room without the event capability flag.
- [34 browser layouts](clubhouse-v20/browser-games.json): 17 casual modes at 1440 px and 390 px; no browser errors, page overflow, or tested hidden fullscreen controls.
- [Event/standings fixtures](clubhouse-v20/event-layouts.json): desktop/phone Kart gates, Tank supplies, long player names, eight-player UNO Flip, and HUD toggle. Screenshot review confirmed the design and event markers.
- [Live pool shots](clubhouse-v20/pool-play.json): both screen sizes, keyboard aiming and power, exactly one request per shot, 16 rolling balls after impact, 60 FPS moving / 13 FPS idle, and zero gradient construction after warm-up.

[Active renderer measurements](clubhouse-v20/render-performance.json) show 60 FPS for Tanks and Marble at both widths, 51 FPS for desktop Kart and 60 FPS for phone Kart. All sampled Tank/Marble/Kart loops created zero gradients after warm-up. Marble previously rebuilt 432 radial gradients during the same 1.8-second sample.

Snake was rechecked after integration at [400 ms](clubhouse-v20/snake-400ms.json), [3 seconds](clubhouse-v20/snake-3000ms.json), and [5 seconds](clubhouse-v20/snake-5000ms.json) RTT. Every trace retained full opacity; no same-life step exceeded 0.65 cells, and the own snake had no stationary frames. These fixtures measured 60 FPS. The [fastest 125 ms step setting](clubhouse-v20/snake-400ms-speed125.json) also passed at 400 ms RTT; maximum displayed step was 0.324 cells. Two separate browsers also completed 16 turns at 400 ms RTT with ±80 ms jitter: all four local/remote traces retained opacity, stayed in bounds and had no large jumps (maximum 0.174 cells). See [two-player evidence](clubhouse-v20/snake-two-player-400.json). These checks preserve the latest GitHub movement fixes rather than replacing them. Local headless Chromium figures describe these fixtures, not every device or real-world network. Before integration, lint remained at 520 errors and 131 warnings (mostly pre-existing `any`, render-ref and effect findings); no extra lint errors were introduced by that stage. This is not a clean repository lint claim. Terraria gameplay/rendering files and its original viewport are preserved. No manual Cloudflare deployment is performed; online event mechanics require the updated room server, while offline rooms use the bundled engine.

## Design research

The visual implementation is original. Research checked [Miniclip's aim and power-control guidance](https://support.miniclip.com/hc/en-us/articles/35451942766865-Basic-Controls-Improving-your-skills-8-Ball-Pool), [Forza's HUD accessibility options](https://support.forza.net/hc/en-us/articles/20964254277267-Forza-Motorsport-Accessibility-Support), and [Game Accessibility Guidelines on readable text](https://gameaccessibilityguidelines.com/use-simple-clear-text-formatting/). The resulting choices emphasize an unobstructed playfield, clear score hierarchy, quiet backgrounds, visible interaction hints, and controllable HUDs; no third-party game artwork is copied.
