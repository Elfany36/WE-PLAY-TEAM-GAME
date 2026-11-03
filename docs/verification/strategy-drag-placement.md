# Generals and Hidden Fleet: direct placement

Based on GitHub main `e6191960627435aa443ff99208c2aba7ecfcba1d`.

Players can drag their own Generals to rearrange or swap home tiles, then drag to legal destinations during battle. Hidden Fleet supports dragging a roster model or an already placed ship; grabbing a middle segment preserves that segment's offset. Valid placements show the model's footprint and preview, while overlaps and out-of-grid positions are rejected locally and still validated by the server. Tap/select and keyboard placement remain supported.

Pointer capture handles mouse, pen and touch. Movement under six pixels remains a click; completed drags suppress the following synthetic click. Escape, pointer cancellation, lost capture and window blur clear the gesture. Locked armies, spectators and opposing units cannot be dragged. Only a completed valid drop sends an action; movement previews update on tile changes rather than on every pointer pixel. No new simulation loop or dependency is introduced.

Fleet spectator views now follow the selected commander without exposing private placements. Keyboard firing is restricted to the target grid, fixing accidental enemy shots from the own-waters view. Ship art distinguishes carrier flight decks, twin gun turrets and submarine hulls. Generals receive brief arrival/clash effects and lifted selection feedback. Effects respect reduced motion; collision and occupancy rules are unchanged.

Validation: 540 tests passed, TypeScript and both production builds passed, including 584 retained-asset checks. Targeted lint has zero errors and one existing native-image warning. Chromium mouse (1440 px) and real touch input (390 px) passed for both games: deployment, invalid-drop rejection, cancellation, ship grab offsets, and live Generals movement. No page exceptions or horizontal overflow occurred. A separate Fleet keyboard check verifies own-waters Space does not shoot and target-grid Space does. Measurements use a local multiplayer server; they do not establish production network latency.
