# Website themes and controlled-player identity — priority release

The requested priority batch includes the [standings, billiards and event redesign](clubhouse-v20.md), integrated with GitHub main `c4fb580a5dedc955ac935c25d6d1eb27d45d16f6`.

## Ten website themes

Indigo Studio, Pink Blossom, Cobalt Club, Mint Arcade, Golden Hour, Lavender Dream, Cherry Pop, Ocean Dive, Forest Retreat and Graphite each support light and dark appearances. The Themes button opens a keyboard-accessible native dialog with previews. Selection updates the page, sidebar, room panels and controls, persists in browser storage, and synchronizes across tabs. A startup script applies saved choices before rendering on both production targets. Storage failure leaves the selection usable and reports that it may not persist.

Two tests cover all 20 appearance/palette combinations at 4.5:1 core text contrast, early initialization, and invalid/blocked-storage recovery. Browser checks selected every palette at 1440 px and 390 px with no page/dialog overflow or errors, then verified Pink in dark appearance survived reload. See [theme evidence](themes-identity-v21/themes.json).

## Glowing player markers

The controlled Sumo wrestler, Tank, Marble, Pong paddle, Kart and Snake head use a player-colored ground glow with a contrasting rim and side chevrons. Floating name/“YOU” text is removed from these game models; readable identity and scores remain in the HUD and docked board. Local seat switching continues to identify the seat actually controlled. The glow is a cached sprite with a bounded 48-color cache, with no continuous pulse or per-frame blur construction. It does not change collision geometry.

The latest GitHub collision and slow-link improvements remain intact. Terraria gameplay files and its viewport were not changed by this priority release. The subsequent customization, uploaded-avatar, spectator and map-expansion work is intentionally a later commit, as requested.

## Checks

483 tests, TypeScript, 327 CSS example parses and both production builds pass. All new components/helpers and their new tests pass targeted lint. The full integrated 34-layout audit and fresh event/dock fixtures pass. Performance and delayed multiplayer evidence are linked in the clubhouse report.
