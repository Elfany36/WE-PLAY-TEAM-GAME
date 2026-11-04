# Shared game departure and control audit

This follow-up is separate from visual commit `f655f2a`, as requested.

UNO (classic and Flip) now skips observers, retired seats and missing hands when finding the next player after a departure. Previously membership order A/B/observer/C could make the observer current after B left, causing the next timeout to push into an undefined hand and freeze the room.

Running games now finish when the final active participant leaves. Previously an observer could keep empty Memory or Snakes & Ladders rounds running forever with an empty current player. AI participants count as players, so an observer watching computers remains supported. Tests also cover empty Snake, Kart, Terra and Blocks rounds.

The website search shortcut now yields to game rooms, handled keyboard events, composition, modified shortcuts and editable content. This prevents `/` from stealing focus when a player saves Slash as a game control. A browser check remaps Solitaire Draw to Slash, draws successfully and verifies search does not receive focus. Stale hard-coded game counts were removed from page metadata.

The catalog review exercised all 21 games in local spectator mode, including manual/automatic follow, privacy, all four information tabs, hidden player inputs, page exceptions and document overflow. The Memory follow check waits for React to commit the selected value before asserting it. Regression tests cover both UNO directions and variants with interleaved observers, empty human rounds, and ongoing AI watch sessions. This is a bounded audit and does not assert that every possible game state is bug-free.
