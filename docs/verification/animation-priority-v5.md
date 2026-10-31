# Board motion fixes

Dice settle on the authoritative value over a server-timed 1,000 ms roll. Token movement uses a single 350 ms per-tile constant with a 4,000 ms movement cap. Snakes & Ladders pauses briefly at a ladder/snake before following its drawn curve; slide segments do not repeatedly hop or ease at every short segment. Property cards and jail movement follow numbered board paths, including GO/corners, rather than cutting across the centre.

The server stores the final rule state immediately, but next-turn/landing controls wait for `lockUntil`/`motionUntil`; turn deadlines include that time. No client acknowledgement can stall the room. Clients derive progress from the event time and keep timelines across resize/polling. A first observation/reconnect displays the current destination instead of replaying old rolls. Reduced motion skips the visual playback. Crowd offsets and model sizes account for up to eight pieces on a tile.

Validation: 14 board-motion/map checks passed, covering capped durations, crowded footprints, paths, the dice/turn lock, server progress and reconnect/reduced-motion behavior. The slide precision assertion uses a numeric tolerance. Doodle Relay was not exercised.
