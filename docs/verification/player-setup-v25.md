# Optional setup, saved controls and live movement

This release supersedes the mandatory character-confirmation flow in the v23/v24 reports. Players may start with default characters and controls. Selecting a model or color saves immediately; the optional **Use selected character** button closes the picker. Selection does not start the game.

## Player setup

- Character choices stay in the current lobby across map changes and rounds. Changing games clears character choices for everyone; leaving and rejoining starts with defaults. Reloading or reconnecting the same seat preserves the current lobby choice. Delayed appearance requests for another game are rejected.
- The character and controls stage appears before opening a lobby and above lobby settings. Character, controls, role, opponent count and game selectors have distinct colors, visible borders and larger targets. Defaults never require opening either dialog.
- Keyboard preferences are saved on this computer separately for each game. Key capture rejects conflicts and reserved browser combinations. Changes save automatically; **Save preferences** and **Reset controls** remain available. Online movement, key release and supported game shortcuts use these preferences. Pointer and touch controls remain available. Two-human shared-keyboard Party Arena play retains its separate fixed seat controls.
- All 17 game-specific collections, 255 designs and 24 named colors remain available. Uploaded portraits stay separate from game models.
- There are 32 named rule presets across 11 games, including configurable race lengths, score targets, timed battles and drawing stages. These include combinations of existing rules as well as new targets. All games retain their other setup controls.
- Three saved interface styles—Studio, Arcade and Notebook—combine with the existing 18 color themes. The standalone build now restores all 18 palettes before rendering.

## Multiplayer changes

The room authority uses the synchronous SQLite API for its hot state row instead of awaiting an asynchronous KV write on each input/tick. Existing KV rows migrate on load. The existing Durable Object namespaces, room identities and expiry behavior are preserved. SQLite failures do not publish a new cached revision. Cloudflare output gates continue to hold outgoing acknowledgements and snapshots until pending writes are durable; state is not stored only in memory.

Live snapshots are scheduled every 50 ms. The server advertises this cadence so playback does not assume an extra 100 ms interval. Full/patch bases, bounded acknowledgement windows and HTTP recovery remain in place. New predicted intent applies at the next physics boundary without an additional tick. Terra movement now receives compact authenticated receipts; crafting retains its full response path. Diagnostics distinguish input acknowledgement, world delivery and simulation age. The brief duplicate-tab warning during lease discovery is suppressed.

The SQL hot row is authoritative after migration. Rolling back to an older release that reads only the legacy KV row could restore stale room state; rollback code must retain the SQL reader. No namespace migration or data deletion is part of this release.

## Verification

- **519/519 automated tests**, TypeScript, hosted build, standalone Pages build and dedicated Worker dry-run passed. SQL tests cover migration, compare-and-swap, failed writes, expiry/recreation and 120 hot updates without KV room writes.
- [All-game desktop/phone checks](player-setup-v25/all-games.json): **34/34** default starts across all 17 games at 1440 and 390 pixels, without mandatory dialogs, browser exceptions or horizontal overflow.
- [Online setup](player-setup-v25/online-setup.json): separate browser players, immediate selection, rapid close/map change, game reset, rejoin reset, saved key reload/reset and actual one-lap race settings passed.
- [Style checks](player-setup-v25/styles.json): all three styles and reload persistence passed at both widths. [Built artifact smoke](player-setup-v25/built-artifacts.json) passed for the hosted build and standalone build, including pre-lobby selection carried into the game.
- [Controlled WebSocket movement](player-setup-v25/online-motion.json): **20/20 scenarios**, Tanks/Sumo/Marble/Kart/Pong at simulated 60, 90, 400 and 1400 ms RTT with remapped I/J/K/L. Direction, neutral release, seat isolation and no fixture-defined large same-life jumps passed in both views. Measured initial displayed response was 1.2–35.4 ms; this is local prediction, not server round-trip time. Observed median world delivery at 60/90 ms was 35–77 ms. Rendering ranged from 31–60 FPS under the shared test workload.
- [Snake](player-setup-v25/snake-motion.json): two human browser seats at 60 and 90 ms RTT, remapped controls and 12 turns passed with no fixture-defined jumps above 0.65 cells in either view.
- [Terra](player-setup-v25/terra-motion.json): two human browser seats at 90 ms RTT passed custom movement/jump, key release, compact receipts and original viewport preservation.
- **524 retained immutable client assets** through Site version 22 passed integrity checks. Old hashed URLs remain available during refreshes and deployments.
- [Phone setup](player-setup-v25/sumo-setup-phone.png) and [Notebook desktop](player-setup-v25/notebook-desktop.png) screenshots.

These are local Chromium/Wrangler tests with an ordered latency proxy and separate browser contexts. They do not measure actual computer-to-computer Philippine Internet routing or prove that all freezes, collisions or lag are eliminated. The installed local runtime uses a May compatibility override; the dedicated production configuration retains its October compatibility date. Existing Southeast Asia location hints and Singapore website placement remain best effort, not a measured latency guarantee.

See [hosting and transport research](player-setup-v25-hosting.md) for official sources and the hosting decision.
