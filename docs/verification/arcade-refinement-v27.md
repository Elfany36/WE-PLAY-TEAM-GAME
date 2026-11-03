# Arcade layout, customization and spectators

Built on GitHub main `46593de7fa81789329cb49324bee0bb14fee0fbc`, preserving the tactical collections and mouse/touch placement from PRs #8 and #9.

## Behavior

The arcade uses quiet surfaces, one button boundary, consistent card artwork, and padded section headers. Character setup now groups the model, its name and its actions together instead of leaving a large empty toolbar. Library/settings toggles, player/AI selectors, room panels, and tactical placement tools have consistent spacing. Keyboard focus remains visible. Fleet legends and instructions wrap at readable sizes.

The color grid reserves a genuine 44 px minimum for each swatch. Previously its columns could shrink below a button's inherited minimum, clipping the last swatch at tablet widths. The refinement stylesheet also explicitly supersedes older `!important` section-padding resets.

All 19 games retain their own 15 designs and 24 named colors. Larger preview stages include rotation, three backgrounds and reset. Chess, Dama, SciDama, Snake and Tanks have game-specific preview states; the latest Generals ranks and Fleet theme/unit/orientation previews are preserved. Preview parameters are scoped to the current family. Color rendering uses a deferred value while selection/save state updates immediately. Material chess/checker designs now show their selected accent without losing side identification.

Selecting a model or color saves immediately, including the first click before creating a lobby. Reset character restores that game's default design and seat color. Surprise me chooses within the game's own collection. Defaults remain playable without opening either customization dialog. Model choices survive map/scene changes, and reset on game changes or leaving/rejoining. Control preferences and reset/save behavior remain unchanged.

## Watching

Every game offers **Watch AI → Watch locally**, followed by an explicit Start game button. The observer hosts the round without becoming a player. AI fills the active seats, including both seats in a duel and up to eight seats where supported. Local drawing-relay watching is supported; human private drawing tasks still require separate online devices.

Online and local spectators share a persistent bar with automatic follow, previous/next player and a named player selector. Follow preference resets for a new room, game or round. It changes only `viewingId`; the authenticated `youId` and private game projection remain untouched. UNO hands, relay tasks, Generals ranks and intact Fleet models stay concealed. Spectators cannot send game inputs. Host administration and chat remain available.

Watched-player HUDs replace misleading personal labels in Sumo, Kart, Blocks, Pool and Property. Snake hides personal controls. Fleet and board orientation use the selected public perspective. Shared-device human games retain their turn handoff and privacy gate; start a separate Watch AI session for local spectating rather than abandoning another human seat.

## Validation

| Check | Result |
| --- | --- |
| TypeScript | Passed |
| Automated rules, privacy, controls, movement and rendering tests | 551 passed |
| Customization across every game, 390/1440 px | 38 passed |
| Local spectator sessions across every game | 19 passed |
| Layout at 390/680/1440 px, light/dark, Studio/Arcade/Notebook | 18 passed |
| Online two-observer sessions, all games at simulated 90 ms RTT; Generals/Fleet at 400 ms | 21 passed |
| New-round follow reset, Generals/relay/Snake online | 3 passed |
| Hosted and static production smoke checks plus mouse/real-touch tactical dragging | 20 passed |
| Hosted build, static build, dedicated Worker dry run | Passed |

Online checks inspect private HTTP/WebSocket snapshots, reject a forged spectator input with HTTP 403, switch public perspectives and reload the viewer. The drawing relay intentionally uses private HTTP snapshots with revision notifications; the other tested modes use projected WebSocket snapshots. Drag checks cover deployment, grabbing a middle ship segment and rejecting an out-of-bounds footprint. Browser checks report no page exceptions or horizontal overflow.

The modified legacy files have 116 lint errors already present at GitHub main; the comparison adds no lint errors. New production modules pass lint. Full lint is not claimed clean.

The compatibility pack retains 755 immutable client assets and complete lazy-import dependencies from the two preceding Site publications, inherited releases, and a local reconstruction of GitHub main. Exact Site publication archives are retained; deployment-generated manifest identifiers from the reconstructed Cloudflare build can differ. These assets reduce missing-chunk failures in older open tabs without loading old code into a fresh page.

These are controlled Chromium/local-server measurements, including injected network delay. They do not establish real Internet latency or prove every device/browser issue resolved. Cloudflare room placement remains a best-effort Southeast Asia hint; existing rooms retain their authority.

Evidence: [browser results](arcade-refinement-v27.json), [tablet setup](arcade-refinement-v27-setup.png), [color picker](arcade-refinement-v27-colors.png), [local spectator controls](arcade-refinement-v27-watch.png).
