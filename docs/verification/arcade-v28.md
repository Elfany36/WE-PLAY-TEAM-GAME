# Solitaire, live drawing, readable game panels and spectator recovery

Built on GitHub main `beaae86e4c0a34756a6f92d8088a1b051fe34acb`, including the Generals/Fleet models and placement from PRs #8 and #9. GitHub was checked again before publication. Existing character, control, scene, theme, local watch and online room behavior is preserved.

## Games

**Solitaire** adds Classic Klondike draw one, Klondike draw three, FreeCell, Spider one/two/four suits, relaxed Pyramid and TriPeaks. Each mode has its own layout, legal moves and stock rules. Play with clicks, pointer dragging or saved shortcuts; use Hint, Undo and Restart deal. Customization supplies 15 original deck crests and 24 colors. Cards use original vector pips/court illustrations, readable ranks, immediate prediction of visible moves and short motion that respects reduced-motion preferences. Hidden card reveals remain authoritative. Solo deals are untimed; up to eight online players race on independent copies of the same deal. First completion wins; at a race deadline, most cleared cards wins and ties share the result.

The Pyramid edition clears the 28 pyramid cards, pairs exposed values totaling 13, removes Kings singly and permits three stock passes. TriPeaks permits Ace/King wrap and no redeals. FreeCell supermoves account for usable empty cells/columns and exclude an empty destination as a helper. Spider uses the modern 54-card initial tableau and 50-card stock, requires occupied columns before dealing and removes suited King-to-Ace runs. Undo history is bounded. A blocked solo Pyramid/TriPeaks board remains undoable/restartable. Forged pair removal is rejected in Klondike, FreeCell and Spider.

**Sketch & Guess** adds a live artist/guessing game for 2–8 participants, including fair computers and spectators. The English bank contains 240 unique words in 12 categories. Each artist privately chooses one of three randomized words; selected words are avoided until the applicable pool is exhausted. Artists rotate over 1/2/3/5 cycles with 30/60/90/120-second drawing turns. A turn ends when everyone eligible solves it or time expires, followed by a five-second reveal. Hints reveal a bounded number of letters. Correct guesses earn 100–500 points based on remaining time; the artist earns up to 300 for the fraction who solve it. This is an original scoring formula, not a claim to reproduce a proprietary formula.

Guess in Chat. The server prevents artists, spectators and already-correct guessers from posting global messages during drawing/choice, including through a forged generic chat action. Correct answer text is replaced with a success notice. Chat reopens at reveal. Private choices/answers are never sent to an unsolved player or spectator. Local play supports one human and AI or Watch AI; multiple humans need separate online devices to keep prompts private. Each game has its own 15 studio mascots and 24 colors.

Drawing paints immediately on a bounded high-DPI canvas and transmits ordered, coalesced vector segments. A brush preview updates locally without React state updates for pointer movement. The reliable queue preserves intermediate points, retries idempotently and stops at turn/epoch changes. Clear/Undo are authoritative. Storage is bounded at 6,000 points and 256 strokes per turn. Reconnection rebuilds the canvas without exposing the answer. Computer artists use original vector templates; computer guessers receive public hints and drawing information rather than the secret answer.

## Interface and bug fixes

Every game now has a separate **Game info** dock with Rules, Controls, Mechanics and Tips. It can be moved, resized, hidden and restored. It starts collapsed; on small screens it stacks below play. Saved bindings appear in Controls. Long Fleet, Generals and action-game guides move into this panel. The view-tools restore button takes only its required space. Setup remains optional and defaults never prevent Start.

Game text uses clearer sizes and line spacing, including player names, labels, tactical controls and coordinate marks. Solitaire felt retains explicit high-contrast caption/hint colors in light and dark appearances. Card ranks have a 15 px minimum and overlapped tableau headers place rank/suit side by side. Each card has its own stacking context so upper-card labels cannot intercept lower-card clicks in Pyramid. Pointer focus preserves scroll position. Existing theme contrast checks cover every website palette in both appearances.

The Watching roster displays each spectator's selected, game-specific character with a gray fade and an eye badge. Names retain full contrast; You, Host and Reconnecting labels are separate from the model.

Paused real-time arenas always display **Resume game**. The host can resume immediately; another active human, including a spectator, can resume after the host has been offline for 20 seconds. The server enforces this permission, preserves the remaining timeline and applies a three-second countdown. This grants no host ownership or configuration powers. A connected host's heartbeat keeps Resume restricted. Intentional host departure still uses the existing host succession.

Snake no longer treats a respawning snake or its opponent as non-solid. AI and human bodies use identical wall, body, head-on, head-swap and growing-tail collision rules. Respawn positions avoid nearby active heads. AI pathfinding treats bodies and growing tails as occupied. The old protection field remains readable for existing snapshots but no longer bypasses collisions. The Generals shared-device privacy gate no longer blocks spectators.

## Validation

Results and selected screenshots are stored beside this report. Controlled links are injected locally; these are not measurements between computers across the public Internet.

| Check | Result |
| --- | --- |
| TypeScript and full automated suite | 583 tests passed; TypeScript passed |
| Customization: all 21 games at 390/1440 px | 42 passed; 15 models and 24 colors each |
| Local AI spectator sessions | 21 passed |
| New games, mobile/desktop layout, Game info tabs/resize/hide | 4 passed |
| All eight Solitaire layouts and stock/hint/undo/restart | 16 passed at 390/1440 px; built Pyramid pairing also passed mouse/touch |
| New games online, injected 90/400 ms RTT | 4 passed |
| Private word/answer projections, correct-answer chat lock, reload, live strokes, HTTP fallback | Passed |
| Generals/Fleet deployment dragging, mouse and real touch | 4 passed |
| Offline host spectator Resume and gray character model in a browser | Passed |
| Retained immutable client URLs and import closure | 822 assets verified |
| Hosted and static production layout/controls smoke checks | 8 passed |
| Hosted build, static build and dedicated Worker dry run | Passed |

The new automated cases cover complete deals, exact stock order, transfer limits, hidden projections, independent races, undo, blocked-board recovery, word-bank uniqueness, scoring/timeouts, artist/solved/spectator chat rejection, ordered stroke retries and budgets, Resume authorization and Snake collision symmetry. Browser checks report page exceptions and document overflow, rather than relying on screenshots alone.

The local eight-socket drawing load used 6,000 points across 94 ordered segments, producing 96 projected frames for each of eight authenticated clients. Server processing measured p50 **1 ms**, p95 **2 ms**, maximum **3 ms**. Full loopback request RTT measured p50 **10.56 ms**, p95 **14.27 ms**, maximum **21.91 ms**. These are bounded samples, not guarantees. A 60–90 ms Internet round trip cannot become a sub-20 ms round trip through a website setting. Immediate local feedback, ordered transport and bounded rendering address perceived response while preserving server authority.

## Rules and platform references

- [Bicycle: Klondike](https://bicyclecards.com/how-to-play/klondike) and [Brainium: draw three](https://brainium.helpshift.com/hc/en/3-solitaire/faq/541-what-is-draw-3-in-solitaire/).
- [Goodsol: FreeCell](https://www.goodsol.com/games/freecell.html).
- [MobilityWare: modern Spider](https://mobilityware.helpshift.com/hc/en/11-spider/faq/586-how-do-i-play-spider-solitaire/).
- [Brainium: Pyramid](https://brainium.helpshift.com/hc/en/9-pyramid-solitaire/faq/269-how-do-i-play-pyramid/); the strict all-52-card edition differs from this labeled relaxed edition.
- [Semicolon: TriPeaks](https://www.semicolon.com/Solitaire/Rules/TriPeaks.html) and [PySolFC: no-redeal Three Peaks](https://pysolfc.sourceforge.io/doc/rules/threepeaks.html).
- [skribbl.io](https://skribbl.io/) and [Literacy Minnesota's mechanics guide](https://www.literacymn.org/skribblio) informed rotating artists, private word selection, timed guessing and solved-player chat behavior. Our artwork, word bank, game implementation and score formula are original.
- [Cloudflare Durable Objects WebSockets](https://developers.cloudflare.com/durable-objects/best-practices/websockets/) informed bounded room broadcasts and connection management. Existing room authorities are preserved during deployment; active older rooms can retain their code until Cloudflare upgrades them.

Publication preserves the existing three services: the complete Cloudflare website, the dedicated multiplayer Worker with its existing room namespaces, and the GPT Site. The complete website retains its Singapore placement and 10% sampled operational logs. The compatibility pack retains the exact Site 24/25 immutable client files and their inherited dependency graph so open tabs can still load their older game modules.
