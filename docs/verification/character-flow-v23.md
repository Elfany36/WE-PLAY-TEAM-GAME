# Character selection, themes, and website follow-up

GitHub PR #7 (`34caefb94e2239aacbc27cf3df52c9a2405e731b`) was pulled, checked (495 tests), and published first as Site v20. Cloudflare's website build already served that commit; the dedicated room authority was updated to the same source. This follow-up preserves its custom models, portraits, spectators and expanded maps.

## Explicit character selection

Local play opens a setup lobby. Every human confirms a model for the selected game; confirmation leaves the game in the lobby. Only a separate host Start action begins play. New online rooms use the same rule, and API start requests enforce it for existing rooms too. Bots and spectators do not block confirmation. One-device games expose a player selector for separate model choices.

A confirmation targets the upcoming round. Finished rounds require fresh confirmation, including next UNO hands. Delayed confirmations cannot ready a later round; delayed Start packets carry the prior round and are rejected. Request deduplication survives the round start. Readiness cannot bypass model confirmation. Appearance edits during a running match remain cosmetic and cannot confirm a future round.

The character card is above the lobby settings, with a prominent button, selected model, confirmation status and local player selector. Entering a lobby scrolls to the card. Starting scrolls to the board heading, avoiding a retained position at the bottom of a long setup page. Round results link back to character selection. The app does not open or start a round merely because a character was saved.

## Themes and interface

Eight additional palettes bring the collection to 18: Tangerine Sky, Tidal Teal, Plum Velvet, Copper Hearth, Sandstone, Arctic Ice, Slate Blue and Rosewood. All support light and dark appearances and the existing saved-theme startup and storage recovery.

Shared controls have larger targets, readable placeholders, clearer focus outlines and consistent icon spacing. Section headers wrap on narrow screens. Room-header controls wrap rather than overflowing the phone viewport. Custom character text uses a contrast-aware black/white ink choice; 4096 RGB samples meet 4.5:1. Both appearances of all 18 palettes pass the existing core text-contrast contract.

## Rendering and networking

The closed customization dialog no longer mounts its model-preview collection. A browser comparison on the same Kart match measured **8 hidden canvases / 72 hidden descendants before**, and **0 / 0 after**. Avatar context values and portrait components retain stable identities, and unchanged room player/settings/chat/event metadata is shared across world snapshots while new geometry and appearance updates remain current.

A release-specific origin mismatch was found: publication now returns the `kendsfabros.chatgpt.site` frontend while the room origin allowlist only named the old `brightbunch` alias. The canonical frontend, room-service redirect and explicit allowlist now support the current address, legacy alias and Cloudflare website. Unknown and lookalike origins remain rejected. Raw room API tests create, confirm and start a room using the current GPT-site Origin and verify its CORS response headers.

Existing shared collision hulls, visual constraint checks, prediction limits, adaptive control delivery, stopped-stream recovery, Southeast Asia room hints and Singapore Cloudflare website placement are retained. Cosmetic choices do not alter movement statistics or physical hitboxes.

## Validation

- 502 automated tests and TypeScript passed; example syntax validation also passed.
- [All 17 games at desktop and phone widths](character-flow-v23/game-flows.json): 34 passed, with a blocked initial Start, explicit confirmation, no start-on-confirmation, working separate Start, no closed preview collection and no horizontal overflow.
- [Two-human local play and rematches](character-flow-v23/local-rematch.json): both players must confirm again before the next hand.
- [Scroll transitions](character-flow-v23/scroll-transitions.json): six desktop/phone checks passed, including online Doodle Relay.
- [Main website pages](character-flow-v23/site-pages.json): 16 desktop/phone checks passed without overflow or browser errors.
- [WebSocket controls](character-flow-v23/websocket-motion.json): ten two-player cases at 400 and 1400 ms RTT passed. [HTTP fallback](character-flow-v23/http-motion.json): three cases at 1400 ms RTT passed. [Final Sumo/Kart checks](character-flow-v23/final-motion.json) also passed after the round-intent safeguards.
- Initial displayed movement across the 13-case matrix was 24–106 ms, at 58–60 painted FPS, with correct initial direction, neutral releases, seat isolation and no fixture-defined large same-life jumps.
- [Closed preview comparison](character-flow-v23/closed-previews.json) and [phone setup example](character-flow-v23/sumo-phone.png).

Measurements use local Chromium and an ordered delay proxy, not geographic production latency or device-capacity measurements. Prediction cannot remove transit delay or confirm unseen opponent actions. The movement fixture excludes legitimate recovery epochs and long browser frame gaps; it is not a guarantee of zero corrections on every connection. Prior immutable client assets through Site v20 are retained for open tabs.
