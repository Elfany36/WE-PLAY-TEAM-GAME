# Arcade v33: proportions, game windows, rounds and audio

This update keeps game artwork proportional in both website and fullscreen layouts, restores the supplied Pirate game's portrait/percent/stock/item HUD, fits its camera around every live fighter, and adds the same outlined mouse reticle to Tank Battle. Shared window panels start hidden in fullscreen, remain movable/resizable, and restore the website layout on exit.

## Layout and controls

The audit covered every one of the 22 arcade games at 1440×900, 390×844 and 844×390, in both layouts. It checked canvas backing/display ratios, square board cells and memory cards, UNO face proportions, viewport bounds, leaderboard flow, chat composer bounds, HUD/panel toggles and normal-layout restoration. All 66 final production cases passed. The largest ratio rounding error was 0.51%; geometric changes are uniform scaling rather than stretched artwork. The Pirate check waits until its sprite renderer finishes loading before measuring the canvas.

Observed problems fixed during the audit:

- Memory cards use one calm frame and remain square in both layouts. Decks of 12, 32, 64, 128 and 200 cards retain at least 44px fullscreen targets; oversized decks scroll from the first row through the last row. All 15 size/viewport cases passed.
- Block Drop fits the actual solo/duel/multiplayer composition. A fixed 3:2 fullscreen rule had stretched the two-player scene horizontally. The renderer now supplies its current aspect ratio.
- Chess, Dama and Sci-Dama center their boards without reserving a hidden sidebar. Optional export/draw/resign actions move into the fullscreen menu; promotion and incoming draw responses remain available on the board. The Generals deployment footer has reserved space below the last rank.
- UNO places larger shared cards above a centered, scrollable private hand. Hand cards no longer overlap narrow grid tracks. Color choices, challenges and device handoff stay reachable. The ineffective single-human Hide hand button is removed.
- Property Parks reserves a separate action row or landscape column. The dice/actions no longer cover the board or extend beyond a narrow column.
- Sketch & Guess keeps brush colors visible on narrow screens. The drawing canvas retains 1000:650 proportions.
- Terra's hotbar and inventory float over the game instead of shrinking its canvas grid row. Export moves into the menu in fullscreen. The pack remains reachable from its hotbar, and spectators retain a clean view.
- Resized player lists retain card height; chat bodies no longer inherit padding that clips the composer, including locked drawing chat in short landscape windows. Fullscreen score panels have readable colors independent of the selected website theme.
- The three coding games share the same window and panels. Stack Survival's stack stays inside fullscreen; phone layout puts a compact stack below the question instead of placing the question below the fold.

Pirate's default **All fighters** camera accounts for complete sprite extents, names, the clock and measured HUD height. It zooms out immediately for a dash/respawn and eases back in. Follow selected and Whole arena remain explicit alternatives. Pointer aim is derived from the current camera even when the mouse is stationary. Tank aiming is normalized to the displayed canvas; mouse fire and keyboard fire remain independent, and opening the menu releases held inputs.

## Match rounds

All arcade setup screens offer Unlimited, 1–6, 10 and a custom 1–1000 rounds. The server validates the count and settles each completed game once, including bot, timeout and disconnect finishes. A draw counts as a round without a win; tied winners each gain one win; host-cancelled rounds award nothing and do not consume a round. Final tied leaders share the match. New matches or changed participant groups reset the series. Stable bot IDs preserve scores between rounds and spectator joins.

UNO retains its own first-to-500 rules: a hand continues that match; one series round is a complete 500-point match. Controls label the next action as Next hand, Next round or New match accordingly.

New rooms requiring v33 round features use the matching website authority on Sites/Pages. Saved seats and invitations remain pinned to their original service; an existing older-service lobby disables unsupported fixed-round controls. No health-probe fallback silently moves a live room. Bindings, migrations, D1 and the configured region are unchanged.

## Audio and assets

Music and effects default off. One lazy media element and one lazy Web Audio context serve a foreground game view; hidden/paused scenes stop playback, leaving releases resources, and effect voices are capped at eight. Cues derive from public counters, without traversing hidden cards, words, pieces or terrain. Both arcade and coding games have audio settings in the normal layout and fullscreen menu. A local music picker uses a revocable browser-only URL and does not upload a recording.

The included music comes from the two tracks already in the supplied Pirate HTML. **None of the three later music ZIPs could be transferred: each exceeds the execution environment's 32 MiB attachment limit.** Their exact recordings are not included. Asset provenance and the pixel font license are recorded in [arcade audio and HUD assets](../assets/arcade-audio-and-hud.md).

## Verification

- TypeScript check passed; **642/642** tests passed; 327 CSS example documents parsed.
- Hosted Worker and GitHub Pages builds passed, including integrity/import closure for 1159 retained immutable assets through Site 30. The dedicated room Worker minified dry run passed; it is not a remote deployment.
- 66 all-game AI simulations, three seeds per game, passed through 180 simulated seconds with serialization checks and no rejected bot actions or unintended pauses.
- All 66 production geometry/window cases and nine production coding-game cases passed. Six additional 1920×1080 visual cases covered the reported card/board layouts.
- All 16 Solitaire mouse/touch variant cases passed, covering hint, selection/destination, drag, undo, keyboard activation where applicable, and stock/waste moves.
- Four production Generals/Fleet mouse/touch deployment cases passed, including moving models and rejecting invalid placements.
- A separate artist and guesser confirmed private prompts, live canvas rendering, chat scoring and the solved-player global-chat lock.
- Three Tank/round/audio browser cases passed on desktop, phone and landscape: custom server round counts, normalized pointer aiming, independent mouse/Space firing, menu release, zero default audio requests, opt-in music/effects, volumes, media-element reuse, local files and hidden/disabled cleanup.
- Pirate online controls passed with 0, 90 and 400ms injected round-trip delay. A mobile spectator could resume an absent host's paused arena, while forged player inputs were rejected.
- Three window interaction cases passed: native/fallback fullscreen, stream reconnect, HTTP fallback, chat delivery, panel drag/resize/rotation clamping, pause/resume, settings, seat preservation and website restoration.

Raw results and representative images are in [arcade-v33](arcade-v33/). Browser scripts accept `BASE`, `API_ORIGIN` where applicable, `PLAYWRIGHT_MODULE`, `CHROMIUM_PATH` and `RESULTS`. Use `verify-arcade-layouts.mjs`, `verify-memory-proportions.mjs`, `verify-coding-window.mjs` and `verify-arcade-v33.mjs` against an already-running preview. Tests create isolated rooms and leave them when done.

## Bounded performance sample

The same local production workload ran before/after: six Pirate fighters, fullscreen 1440×1000, Auto graphics, 4× Chromium CPU throttling, approximately eight seconds of controls. This is a machine/workload sample, not an Internet-latency guarantee.

| Measurement | Before | After |
| --- | ---: | ---: |
| Median frame interval | 16.7ms | 16.7ms |
| 95th percentile frame interval | 33.4ms | 33.4ms |
| Style work per second (throttled) | 41.5ms | 16.7ms |
| Layout work per second (throttled) | 8.6ms | 7.3ms |
| Main-thread work per second (throttled) | 962ms | 985ms |
| Input to authoritative pose, median | 80ms | 82ms |
| Input to authoritative pose, p95 | 131ms | 113ms |
| Room bytes per second | 23,208 | 23,218 |

A separate run with music and effects selected also measured a 16.7ms median and 33.4ms p95 frame interval; main-thread work was 984ms/s under the same 4× throttle. These short runs do not establish a universal audio overhead.

The landing-page LCP sample varied from 712ms to 920ms; CSS transfer grew from 127,407 to 133,240 bytes for the added layouts. No loading-speed improvement is claimed from that single sample. The new font loads only when Pirate uses it, and media makes no requests before opt-in. The frame median meets a 20ms rendering target in this workload; authoritative simulation uses 50ms steps and real network latency cannot be promised below 20ms.

## Publication limits

GitHub and the configured public Site can be synchronized through their working connections. The separate Cloudflare connector still returns `UNAUTHORIZED: This app connection requires reauthentication`; direct deployment and verification of the two `workers.dev` services remain blocked. A successful local dry run does not establish those remote versions. The pending Word Factory stash is preserved and is outside this release.
