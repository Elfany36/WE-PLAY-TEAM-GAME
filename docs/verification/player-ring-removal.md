# Player highlight rings — Sumo duels and Kart

Continues GitHub main e0273d6, preserving its themes, match boards and billiards updates.

The controlled-player ground ring is removed from Kart and Sumo 1v1. Sumo duels include two-player classic matches and each 1v1 bout in a tournament. Classic free-for-all Sumo, Tanks, Marble, Paddle and Snake retain their current markers. Sumo duel help text now identifies the wrestler by the player's color rather than referring to a removed ring. Gameplay and item-effect graphics remain intact.

TypeScript checking and 485 automated tests passed. Eight browser fixtures inspect actual ground-halo draws: three Sumo duel/tournament cases and Kart draw none; four-player free-for-all Sumo, Tanks, Marble and Paddle still draw their marker. No browser errors occurred. See [browser results](player-ring-removal/browser.json).

The published build retains prior Site asset URLs through Site v18. Both the GPT Site and Cloudflare web application publish the same source. The dedicated room service is also aligned with the integrated GitHub source so the newly integrated event mechanics share their server implementation.
