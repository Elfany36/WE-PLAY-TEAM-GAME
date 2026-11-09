# Solitaire card controls

This priority fix is isolated from the stashed Word Factory work and the later bot audit.

Selecting a face-up card now offers legal destinations and a compact Place button. Empty space in a destination column also accepts the selected run. Hint selects its source, so its highlighted destination immediately works. The former implementation highlighted the source without setting the selection, and blank column space had no click handler.

Pointer release handles card taps and game buttons, including touch browsers that suppress a compatibility click after dragging. Button presses capture the pointer, cancel when released outside, and preserve keyboard/assistive-technology activation. Coarse touches retain the browser's small adjusted hit area. Enter and Space activate the focused card or button; Space no longer also draws stock while a button has focus. Escape clears a selection or drag.

Dragging shows the actual card/run under the pointer. Position updates write the preview transform directly; only target-cell changes cause React drag renders. Visible moves remain optimistic and hidden reveals remain authoritative. A drop waits until the next animation frame before reparenting the captured card. Spectator and covered-card restrictions remain enforced.

Validation:

- TypeScript and all 591 existing automated checks pass.
- All eight Solitaire variants pass online UI checks at 390 px with real touch events and 1440 px with a mouse: 16 cases. Checks cover Hint, legal card/run movement, blank column targets, the drag preview/drop, stock-to-waste moves, Undo, and Enter/Space where applicable. Pyramid/TriPeaks use their exposed-card removal rules.
- All eight variants also pass local touch play, including legal moves and Undo.
- Generals and Hidden Fleet deployment dragging still passes mouse and touch: four shared-hook regression cases.
- The saved v29 browser baseline fails the new Hint/destination regression; the fixed UI passes it.

The reusable online browser runner is `scripts/verify-solitaire-controls.mjs`; its header documents the command and configurable Playwright/browser paths. Sanitized results are in [solitaire-v30](solitaire-v30/). The compatibility pack retains 950 immutable assets through Site version 27 so open tabs can continue loading their earlier chunks.
