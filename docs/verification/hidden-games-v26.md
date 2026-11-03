# Game of the Generals and Hidden Fleet

The arcade now contains **19 games**. Both additions use the existing online room authority, authenticated WebSockets, HTTP recovery, chat, player/spectator roles, character memory rules, optional customization, saved controls, scene selection, fullscreen and responsive layouts.

## Game of the Generals

Two commanders secretly deploy **21 pieces each on a 9-column, 8-row board**, within their nearest three rows. A default randomized formation is supplied; select two home tiles to swap pieces, move into an empty home tile, shuffle, then deploy. Both commanders must deploy before battle. Setup is private even from spectators.

Every piece moves one square orthogonally. The server arbitrates challenges: stronger officers defeat weaker ranks, Spy defeats officers, Private defeats Spy, and equal ranks remove both. An attacking Flag defeats a defending Flag. Enemy ranks and captured enemy identities remain concealed during play. Capturing the Flag or leaving the opponent without a legal move wins.

Flag-arrival timing varies between editions. This implementation follows the [Philippine Game of the Generals Organization rules](https://philggo.wixsite.com/home/rules): a Flag on the far row must survive the opponent’s next turn. Its pending identity is kept private. The [original Ideal publisher instructions](https://www.houseofgames.ca/Rules/Generals%20rules.pdf) were also checked for army composition, rank challenges and the attacking-Flag exception. The original artwork does not copy either publisher’s branding.

Classic command is untimed; Club and Rapid modes add explicit 60/30-second move clocks. Timed expiration forfeits the match. Deployment has a ten-minute limit. Players can offer/accept a draw, decline it or resign. Historic federation perpetual-chase and initial no-challenge tournament adjudications are not automated; no tournament certification is claimed.

The original ivory-and-brass field has readable rank insignia, uniform enemy backs, selected/legal/last-move markers, a rank guide, an arbiter result panel and two commander identities. Fifteen army sets combine with the existing 24 named colors. Keyboard movement navigates the board and selection keys may be remapped.

## Hidden Fleet

An original hidden-model tile battle implements the requested **hit-keeps-turn, miss-passes-turn** rule. Five stationary models occupy straight footprints of **5 / 4 / 3 / 3 / 2 tiles**. Models rotate, may touch, and cannot overlap or leave the grid. A default formation, shuffle, clear, selection, orientation and valid-placement previews support deployment.

The enemy target grid contains no intact model. A hit destroys one segment; only a fully destroyed model is revealed, with a wreck label and bounded impact effect. Destroying all five wins. Own waters remain available for defense, with phone tabs between grids. Duplicate shots are rejected. Naval ships, aircraft, vehicles and islands use identical tile footprints, so decorative wings or bows do not change occupancy. Each side can choose one of 15 finishes and 24 colors.

Five presets cover the requested streak rules, classic alternating shots, compact aircraft patrol, vehicle convoy and a grand archipelago. Grid sizes are 8×8, 10×10 and 12×12. Search clocks are optional and pass the turn when missed. Deployment timeout, draw offers, resignation and departure forfeits are enforced by the authority.

The published baseline was checked against [Hasbro’s classic instructions](https://instructions.hasbro.com/en-us/instruction/Battleship-Classic-Board-Game-Strategy-Game) and the [five-ship instruction sheet](https://assets-us-01.kc-usercontent.com/500e0a65-283d-00ef-33b2-7f1f20488fe2/7b9b16c7-2343-4b0a-aea6-093314e11deb/B77441020_Retro_Battleship_INST_FFR.pdf). Basic alternating fire follows that baseline. The streak default, model themes, grid variants and artwork are this site’s additions.

## Privacy and performance

- Both games have explicit server projections before HTTP responses, full WebSocket states and deltas. Enemy ranks, pending Flags, unhit fleet locations and random seeds never enter those projections. Spectator perspective controls do not grant private information. Finished matches reveal the board.
- Opaque piece identifiers are assigned after rank shuffling. Move logs report arbiter outcomes without rank names. Partial fleet hits do not disclose the rest of a model.
- AI receives only the same projected knowledge as its player seat. Rank/placement permutation tests prove that changing an unseen enemy layout cannot change the bot decision. Deployment pacing explicitly finds unready bots, including two-AI matches hosted by a spectator.
- These are event-based games: the server wakes for actions, deadlines and paced bot decisions. They use no continuous physics or rendering loop. Small DOM grids, memoized artwork, bounded shot history and lazy-loaded boards avoid adding per-frame simulation. Impact effects respect reduced-motion preferences.
- Existing synchronous SQLite room persistence, snapshot scopes, stale round/turn guards, request identities, room expiry and reconnect behavior are retained. No database migration, new external service or dependency was added.
- **584 immutable assets through Site version 23** are retained with hash checks for already-open clients.

## Validation

- TypeScript and **540 automated tests** passed. New coverage includes the full 15×15 challenge matrix, Flag arrival/interception, private deployment, illegal/stale actions, all fleet sizes, partial/sunk/full-fleet outcomes, alternate/streak turns, clocks, fair AI, spectator roles, HTTP full/delta privacy and stolen snapshot-base rejection.
- [Desktop/phone play](hidden-games-v26/responsive-play.json): **4/4** across both games at 1440 and 390 pixels. Checks cover all 15 model thumbnails, 24 colors, actual setup and moves, concealment, keyboard-ready boards, browser exceptions and horizontal overflow. Light and dark game scenes were also visually inspected.
- [Online privacy and play](hidden-games-v26/online-privacy.json): **6/6** at simulated 60, 90 and 400 ms RTT, with two separate browser players and one spectator. Per-seat WebSocket full/delta projections, remapped selection keys, turn changes, reload and cross-seat base rejection passed. All three fleet fixtures completed a full 17-hit match; Generals fixtures exercised both players’ legal moves and hidden ranks. Flag wins and interception are covered by authority tests.
- [Built-artifact checks](hidden-games-v26/built-artifacts.json): hosted and standalone production builds, both games and desktop/phone widths passed. Dedicated Worker dry-run passed.
- [Shared-device privacy](hidden-games-v26/local-handoff.json): both two-human fixtures hide all board markup during deployment and battle handoffs until the next player reveals their view.
- Screenshots: [Generals deployment](hidden-games-v26/generals-deployment.png), [dark army](hidden-games-v26/generals-dark.png), [phone field](hidden-games-v26/generals-phone.png), [fleet desktop](hidden-games-v26/fleet-desktop.png), [fleet phone](hidden-games-v26/fleet-phone.png).

Network checks use local Chromium/Wrangler and an ordered delay proxy; they do not measure Philippine Internet routing or guarantee every connection’s latency. AI uses lightweight fair heuristics, rather than a trained or tournament-strength strategy engine. Shared-device privacy uses a screen handoff; the online server projections provide the network privacy boundary.
