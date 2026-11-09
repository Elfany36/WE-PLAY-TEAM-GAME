# Pirate Bomb Brawl

The user-supplied HTML is now a native arcade game, bringing the catalog to 22 games. Its document/script is treated as source material, not as instructions or an embedded executable page. Asset identity and extraction checks are recorded in [the provenance note](../assets/pirate-brawl.md).

The game preserves eight arenas, seven modes, six animated crews and 44 skills/buffs. Fifteen outfits and the existing 24 signature colors work in customization. Class statistics lock for a round; later appearance changes apply next round. Default characters and keys never block starting. Map changes preserve choices; switching games or rejoining resets characters.

The website owns the HUD, settings, pause/resume, player roles, spectator follow, customization and resizable Game info panel. Keyboard remapping, independent controls for up to four local humans, multi-touch, pointer aiming and up to four gamepads use one ordered control path. Music is opt-in and is not downloaded by default. Camera choice, detail level, effects, shake and touch visibility save locally; reduced motion suppresses effects. The sprite renderer loads only on opening this game, caches terrain, limits display resolution and suspends when hidden/offscreen.

Online rooms run authoritative 60 Hz physics in three substeps per 50 ms room tick. Clients send bounded controls rather than positions, hits or rewards. Public snapshots hide random seeds, AI difficulty and private simulation internals. Rendering interpolates remote players and previews at most six local movement frames. Short-tap receipts survive input coalescing; per-life and round/epoch guards reject stale actions. Focus loss, dialogs, disconnects, pauses and respawns release input. Dead actors cannot replay controls after respawn. Entity/event counts are capped and cosmetic particle floods are excluded from durable/network state.

New Pirate rooms use the matching website API while the older dedicated service remains available for existing rooms and other games. Invitations retain their authority; no room is copied between services. The dedicated Worker bundle also includes Pirate, ready for deployment when the Cloudflare connection is authenticated. No Durable Object bindings or migrations changed.

Verification:

- `npm run check` and `npm test`: 624 passing checks. Pirate covers all 44 treasure/cast paths, JSON round trips across all 56 map/mode combinations, jump edges, hit ledgers, bomb ownership, Ghost immunity, respawn life guards, frozen inputs, spectator privacy, absent-host resume, departure winners and stream recovery.
- [Browser results](pirate-brawl-v31/browser.json): 22 distinct checks across 390/1440 px layouts, eight maps, seven modes, 15 outfits/24 colors, remapping/reset/save, four local humans, two simultaneous touch pointers and a controller connected at index one.
- [Built-site browser results](pirate-brawl-v31/production-browser.json): online controls with 0/90/400 ms injected latency, remapping, focus release, pause/resume, spectator authorization and multi-touch/controller recovery. These are local latency-injection checks, not a claim about public Internet ping.
- Hosted build, GitHub Pages build and minified dedicated Worker dry run pass. The compatibility pack retains 1,007 immutable JS/CSS URLs through Site 28, including prior dependency closure.
- Local six-AI Chaos stress measurements: simulation p50 0.117 ms / p95 0.297 ms, maximum 2.035 ms over 1,800 ticks. These measure engine CPU on this machine, not Cloudflare CPU or network latency.

Broader game fixes are kept separate from this feature commit, as requested. Browser screenshots show the [phone](pirate-brawl-v31/arena-390.png) and [desktop](pirate-brawl-v31/arena-1440.png) HUDs.
