# Arcade follow-up audit

This follows the separate Pirate feature commit `f1cf6c4`.

Departed Snakes & Ladders players no longer leave character tokens on the board or affect token spacing. An authenticated three-player browser case reproduced the stale token before the fix and verifies that only the two remaining participants are rendered afterward.

The five newest games now expose the shared Hide/Show HUD control. It hides secondary standings, portraits or legends, while retaining the board, drawing prompt/timer, Pirate settings and pause/resume. Previously the shared CSS hid the toggle for these games. The toolbar keeps its compact layout without a duplicate title.

Pirate touch controls wrap into two rows on 320 px screens. Previously the action group overlapped and clipped buttons despite the document itself reporting no horizontal overflow. Browser checks now measure all seven targets: each is at least 44 × 44 px, inside the board, reachable at its center and separate from every other target. Compact action buttons are also at least 44 px tall on larger phones.

The AI count selector displays a valid count after changing game capacity or switching between Play and Watch AI. It previously retained an out-of-range controlled value, which could make the native select display Friends only while AI seats were actually configured. Requested companions still fill only available seats.

Validation:

- TypeScript passes; the 624-check automated suite passes. All 327 CSS example documents parse. Hosted and Pages production builds pass; the dedicated API dry run also passes.
- [66 seeded AI simulations](arcade-audit-v31/ai-simulation.json): all 22 games, three seeds each, up to three virtual minutes, repeated JSON persistence/projection and zero rejected bot actions. This checks progress and stability; it does not require every long or open-ended game to finish in three minutes.
- [44 catalog browser cases](arcade-audit-v31/catalog-browser.json): all 22 games at 390/1440 px, local spectator identity, manual/automatic follow, private information, all four Game info tabs, exceptions and page overflow.
- [16 Solitaire control cases](arcade-audit-v31/solitaire-controls.json): every variant online with desktop mouse/keyboard and phone touch, including legal moves, Hint, undo, visible drag previews, blank-column targets and stock cards.
- [Four tactical drag cases](arcade-audit-v31/tactical-drag.json): Generals placement swaps and Fleet placement/movement/bounds/overlap on desktop and phone.
- [Setup count cases](arcade-audit-v31/setup-ai-count.json): eight-AI Snake watch setup transitions to two-seat Fleet and six-seat Pirate, then back to Play without an invalid count.
- Production browser checks cover [HUD hide/restore at 320/390 px](arcade-audit-v31/hud-production.json), [departed tokens](arcade-audit-v31/departures-production.json) and [Pirate touch target geometry](arcade-audit-v31/pirate-narrow-production.json).

The [320 px Pirate HUD](arcade-audit-v31/pirate-320.png) shows the revised controls. These bounded checks do not claim that every possible game state is free of bugs or that public Internet latency can be held below 20 ms.
