# Game-specific character collections

The customization picker now uses a separate collection for each of the 17 arcade games: **15 designs per game, 255 designs total**, plus **24 named colors** and the existing custom color control. The twelve default seat colors stay separate from the cosmetic palette.

Kart has a garage, Tanks has hulls/turrets, Sumo has a wrestler stable, Xenzia has snake species, Marble has glass designs, Pong has paddles, and Pool has cues. Chess, Filipino Dama and Water Patrol have their own piece collections. Ladders and Property use separate themed moving tokens. Terra has expedition outfits within the original explorer size and viewport. Memory, UNO, Doodle Relay and Block Drop have game-specific mascots/crests/pilots in their HUD and player list; shared card faces, card rules and tetromino colors remain readable and consistent.

## Corrections

- Collection previews and actual models share allowlisted SVG artwork. Canvas games decode bounded cached images and then blit them; the closed picker mounts no preview collection. No model assets need third-party requests.
- The picker has a scrolling body with a visible header and confirmation footer, readable labels, selected states and named color swatches on desktop and phone.
- Saving one family preserves other game choices in both room state and browser preferences. The selected model is visible above the room settings, in player identities and in the relevant game presentation.
- Changing games or setup clears prior confirmation. Confirmation targets the upcoming round and the selected game; delayed confirmation for another game is rejected. An unrelated model cannot satisfy confirmation. The host still starts separately after every human confirms.
- Choosing a model turns off a portrait override for board tokens so the selected model is shown. Uploaded portraits remain available in the player list. Legacy saved model IDs remain allowlisted/readable without exposing the old universal token/board list in any game picker.
- Model choices do not change controls, speeds, collision dimensions, scoring or hidden information. Both chess sides retain distinct base markers; Dama crowns and Water Patrol chip values remain explicit.

## Verification

- TypeScript and **507 automated tests** passed. All 255 model changes preserve their game simulation; all game collections contain distinct rendered designs. Invalid models, cross-game confirmation, delayed confirmation, SVG markup injection and complete saved preference size are covered.
- [Desktop and phone browser checks](game-customization-v24/game-models.json): **34/34 passed** across all 17 games at 1440 and 390 pixels. Each loaded and rasterized 15 distinct thumbnails, exposed 24 colors, saved/reopened a selected model/color, required separate Start, removed closed previews, displayed the selected art in play, and avoided horizontal overflow. Desktop checks clicked every model and every color.
- [Two-player online persistence](game-customization-v24/online-persistence.json): separate kart and Sumo choices, both-player confirmation, game-switch confirmation reset, and reconnect/reload persistence passed across desktop and phone.
- Hosted and standalone Pages production builds, Worker dry-run and [built artifact browser smoke](game-customization-v24/built-artifacts.json) passed.
- [Two-player WebSocket movement](game-customization-v24/online-motion.json) uses the newly added final design in each of Tanks, Sumo, Marble, Kart and Pong at 400 and 1400 ms simulated RTT. Direction, release, seat isolation, frame rendering and movement continuity are checked.
- [HTTP fallback](game-customization-v24/http-motion.json): Sumo, Kart and Pong passed at 1400 ms simulated RTT. Across the 13 delayed-link cases, measured initial displayed response was 26–90 ms and canvas rendering was 57–60 FPS, with correct direction, neutral releases and no fixture-defined large same-life jumps.
- [Desktop garage](game-customization-v24/kart-garage-desktop.png) and [phone stable](game-customization-v24/sumo-stable-phone.png) screenshots.
- Immutable JS/CSS URLs from Site versions 20 and 21, including their inherited dependency closure, are retained: **472 assets** checked for integrity.

Browser and network measurements use local Chromium and Wrangler with an ordered delay proxy; these do not measure Philippine production latency or guarantee correction-free movement on every connection. The locally installed runtime supports compatibility dates through May 2026, so the dedicated local test service used a May override; the production Worker configuration remains unchanged at October 31, 2026.
