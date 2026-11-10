# Arcade v34: UNO calls, scene retention, editor readability and delayed controls

UNO now exposes a reachable UNO button beside a two-card hand. Click it or use the saved U shortcut to declare with the next play; selecting a Wild color retains that declaration. A missed declaration can still be called out of turn while its catch window is open. Shared-device play keeps a recovery button for the previous human after the private handoff. Opponent catches draw two once. Classic Draw Two and Flip Draw One/Draw Five no longer erase the digital call window as part of an automatic penalty. The next actual draw, play or penalty decision closes it. Completed hands clear it too.

Calls and catches share one server validator, including ownership, one-card hand and an optional observed-window receipt. New clients send that receipt so a delayed action cannot affect a later window; older clients remain compatible. Wild Draw Four/Flip challenges retain their captured private evidence and existing rules. Action errors and connection feedback now live inside the game window, with dismissal available in native fullscreen.

The window follows the existing [Mattel Classic rules](https://service.mattel.com/instruction_sheets/K5847.pdf): declare when playing the second-last card; a missed call caught before the next actionable drawing/playing step costs two cards. Automatic digital penalty resolution retains an opportunity to interact with that window.

## Scenes and proportions

The fullscreen window had a fixed navy background and UNO had a fixed green felt. The window now inherits scene tokens while its panels retain their readable palette. UNO felt, Memory backs and strategy squares inherit the selected scene. Solitaire keeps its selected felt color and texture, including light painted wood and linen. This changes presentation colors, without changing map geometry, game physics or scaling.

The production audit passed all 22 arcade games at desktop, phone and landscape sizes: 66 cases across both website and fullscreen layouts. Canvas backing/display proportions, square memory cards and board cells, UNO faces, viewport bounds, HUD/panel toggles, leaderboard rows, chat composer bounds and layout restoration were checked. The 84 scene-retention cases cover all ten scenes for UNO, Memory, Chess, Dama, Sci-Dama and Solitaire, plus three scenes each for eight other table games. Color checks wait for finite CSS transitions before comparing, so they do not compare an intermediate animated color with its settled value.

## Playground and lesson editor

An opaque textarea was covering the separate highlight layer while the editable text itself was transparent. The editor now paints readable native text at 14px with a consistent dark surface, selection and caret colors. Its line-number gutter is one text node, shares the exact line height and scroll position, and reserves width for four-digit line numbers. Indent/outdent retain native undo and restore selection during the React commit, avoiding a race with a second shortcut before the next animation frame. Tab keeps normal focus navigation.

HTML/CSS tabs, draft persistence, export, reset, mobile/desktop preview and lesson grading use the same working editor. Preview CSS follows existing head styles so the CSS tab can override them. A low-specificity light preview canvas prevents inherited dark-on-dark content while preserving the user's styling; scripts remain sandboxed and preview-only defaults do not leak into exported documents.

The browser checks cover 18 palettes × two appearances × three interface styles on desktop and phone, plus editing, undo, indentation, a real clipboard paste of 3,000 lines, aligned scrolling, reload persistence, export/reset and a completed/reset lesson. A synthetic Chromium `insertText` operation generated thousands of input events and stalled on the large sample; the large-file test uses an actual clipboard paste, matching the user action.

## Multiplayer and movement

Three observed control problems were repaired:

- Continuous Terra mining was classified as a one-shot command, blocking newer movement and allowing a failed old request to be retried after a completed key release. Only Kart's independently acknowledged one-shot use/recovery commands retain that retry behavior.
- Pirate heartbeat spacing could reach 500ms while server inputs expire after 400ms. Its heartbeat ceiling is now 300ms, preserving the existing server expiry on disconnection.
- Four outstanding fallback HTTP requests could leave a gap longer than that expiry on slow links. The HTTP pipeline now adapts between four and eight outstanding requests without increasing the input send rate. The existing live-stream bound remains unchanged. At 1,600ms injected round trip, the held-input arrival gap fell from 670ms to 337ms in the development reproduction; release still arrived after its unavoidable one-way transit.

Pirate's local movement preview used to stop at 100ms. It now replays timestamped local intent for at most 300ms, with receipt corrections that respect solid geometry. Walking, short jumps, dash, drop-through, ice, slow/frozen/stunned movement, ceilings and moving platforms are compared against room physics for 18 consecutive frames. Completed preview frames are reused between authority receipts; new snapshots, late intent and clock reversal invalidate that cache. Only the owning seat receives its extra movement-reconciliation fields. Opponents, hits, deaths, rewards, random events and winners remain authoritative; preview state never mutates the room. Respawns, stock loss and room/input-epoch changes reset prediction.

A separate routing error made `matchRounds: 0` select the website authority for every new room. The dedicated service has now been upgraded from v29 to the reviewed v34 server bundle, with its original Durable Object namespaces and D1 binding preserved. All new Sites/Pages arcade rooms, including UNO, Pirate and positive finite-round matches, now use that live authority. Saved sessions and invitations stay pinned to their original service; no live room is copied or silently moved, and no health probe is added to the control path.

## Verification and publication boundary

TypeScript passed; 653 tests passed; 327 CSS example documents parsed. Both hosted Worker and GitHub Pages builds passed. The dedicated Worker minified dry run passed with both existing room bindings. The compatibility pack retains 1,259 immutable client URLs through Site 31, with SHA-256 checks and full inherited import closure, preventing lazy-load failures in older open tabs.

Production browser results and representative screenshots are retained in [arcade-v34](arcade-v34/). The new scripts are `verify-uno-v34.mjs`, `verify-fullscreen-themes.mjs`, `verify-playground-v34.mjs` and `verify-slow-http-controls.mjs`; existing all-game geometry, coding-window and delayed Pirate checks remain reusable.

Cloudflare authentication was restored during validation. The dedicated `markup-arcade` Worker was uploaded from source `3bb135db875f7443a7ad5e31e99ff262baece0d2`; its downloaded module SHA-256 matched `f03edd417825a398a22b4234e0b0f6e1f9beb49c3cbec1c705283f026997b978` and deployment `e9434109-76a8-427f-afcd-8a53c7d7f1c5` serves version `29c07579-f9a9-492d-bf5c-65499ccec8ca` at 100%. Both original namespaces, D1, compatibility date and log settings were read back unchanged. The full website retains its existing GitHub build trigger, asset pipeline and Singapore placement target. Public game-host requests remain blocked by the execution network policy, so remote end-to-end play and Philippine ISP latency are not claimed from the deployment API checks. Local Durable Object preview results alone do not prove broadcast on Sites Worker/D1 hosting. No sub-20ms Internet-latency guarantee is made.

The final local six-fighter fullscreen sample used 4× Chromium CPU throttling. Median/p95 frame intervals were 16.7/33.4ms, matching the baseline sample. Median/p95 input-to-authority receipts were 75/101ms, compared with 73/123ms before. Landing LCP was 796ms versus 788ms before; no landing-load improvement is claimed from these short runs. Gameplay payload averaged 24.5KB/s versus 23.2KB/s; the samples include different random combat effects and the owning seat's additional reconciliation fields. These are workload samples, not production ISP measurements. Real 3,000-line clipboard pastes completed in 84–155ms in the production editor checks.
