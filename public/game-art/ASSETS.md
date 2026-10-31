# Original arcade artwork

All artwork in this directory was drawn as original SVG vector code for this project on 2026-10-30. No stock assets, commercial characters, game logos, tracing, external image sources, or AI-generated bitmap sources were used. The shared visual language is a handcrafted toy/pixel-fantasy world with warm highlights, slate outlines, softly dimensional forms, and clearly readable silhouettes.

## Racing

Use the six 128 × 128 transparent sprites at about 44–80 CSS pixels. All face the same lower-right diagonal and share the same dimensions, baseline, and silhouette. For a top-down race, rotate the complete image around its center; for avatar choice, render without rotation.

- `kart-coral.svg`
- `kart-mint.svg`
- `kart-cobalt.svg`
- `kart-gold.svg`
- `kart-violet.svg`
- `kart-tangerine.svg`

## Mining landscape

Every background is 1600 × 900. Stack in the following order with identical sizing and positioning. Sky is opaque; the other layers have transparent upper areas. Translate layers at different speeds for parallax. `mining-backdrop.svg` combines all four for a single-image fallback.

1. `mining-sky.svg` — dusk gradient, original moon and tiny stars.
2. `mining-mountains.svg` — three distant ridgelines with angular summit highlights.
3. `mining-forest-far.svg` — muted repeating fir silhouettes.
4. `mining-forest-near.svg` — dark foreground firs and rolling undergrowth.

## Mining tiles and props

64 × 64 SVG tiles. Terrain fills the complete viewBox and meets neighboring tiles cleanly. Render at 24–48 CSS pixels for the game grid. Props have transparent surroundings and fit inside one tile. Use `image-rendering: pixelated` if rasterizing to an atlas, and preserve the square aspect ratio.

- `tile-ground.svg` — grass capped earth.
- `tile-dirt.svg` — uncovered earth.
- `tile-stone.svg` — slate with faceted cracks.
- `tile-copper.svg` — copper ore embedded in stone.
- `tile-iron.svg` — pale iron ore embedded in stone.
- `tile-crystal.svg` — amethyst crystals embedded in stone.
- `tile-wood.svg` — ridged timber.
- `tile-leaf.svg` — dappled canopy.
- `tile-bedrock.svg` — deep indigo bedrock.
- `tile-torch.svg` — transparent ember torch prop.
- `tile-workbench.svg` — transparent timber workbench prop.
- `tile-furnace.svg` — transparent lit stone furnace prop.

## Mining characters

Three 48 × 64 transparent original adventurers; use at 24 × 32 or 36 × 48 CSS pixels. Both 48 × 40 slimes can render at 24 × 20 or 36 × 30 CSS pixels. They have a ground shadow and matching visual baseline within each category. They are standing sprites, suitable for procedural bob/walk transforms; no pre-baked animation frames.

- `player-ranger.svg` — green hood, feather, gold scarf.
- `player-miner.svg` — gold hardhat with lamp, teal scarf.
- `player-explorer.svg` — soft brim hat, blue coat, coral scarf.
- `slime-moss.svg` — green friendly slime.
- `slime-lilac.svg` — lavender friendly slime.

## Board tokens and dice

The eight transparent 96 × 104 tokens share a common dimensional pedestal and baseline. Render at 36–64 CSS pixels high. The silhouettes and colors remain distinct on pale boards.

- `token-pawn.svg`
- `token-rocket.svg`
- `token-fox.svg`
- `token-leaf.svg`
- `token-boat.svg`
- `token-cat.svg`
- `token-crown.svg`
- `token-gem.svg`

`die-1.svg` through `die-6.svg` are transparent 64 × 64 rounded ivory dice with high contrast slate pips. Recommended display size: 36–60 CSS pixels.

## Provenance and reuse

Source: original vector paths, geometry, palettes, and compositions authored directly for this repository. External sources: none. These project-created assets may be used and modified with the rest of the project; no third-party asset attribution is required. This manifest is provenance documentation, not an assertion that external project dependencies have no separate licenses.

## Memory card faces

68 different original subjects; all are 96 × 96 vector faces with a soft circular background and warm dimensional fills. Use at 52–76 CSS pixels, preserving the square aspect ratio. These are different subjects, never color-only variants. All files below are relative to this directory.

- `memory/acorn.svg` — acorn. 
- `memory/hot-air-balloon.svg` — hot air balloon. 
- `memory/beehive.svg` — beehive. 
- `memory/turtle.svg` — turtle. 
- `memory/cactus.svg` — cactus. 
- `memory/penguin.svg` — penguin. 
- `memory/castle.svg` — castle. 
- `memory/hedgehog.svg` — hedgehog. 
- `memory/kite.svg` — kite. 
- `memory/cupcake.svg` — cupcake. 
- `memory/firefly.svg` — firefly. 
- `memory/frog.svg` — frog. 
- `memory/guitar.svg` — guitar. 
- `memory/ice-cream.svg` — ice cream. 
- `memory/jellyfish.svg` — jellyfish. 
- `memory/lantern.svg` — lantern. 
- `memory/lighthouse.svg` — lighthouse. 
- `memory/mushroom.svg` — mushroom. 
- `memory/octopus.svg` — octopus. 
- `memory/owl.svg` — owl. 
- `memory/pineapple.svg` — pineapple. 
- `memory/watering-can.svg` — watering can. 
- `memory/sailboat.svg` — sailboat. 
- `memory/dragonfly.svg` — dragonfly. 
- `memory/snail.svg` — snail. 
- `memory/snowglobe.svg` — snowglobe. 
- `memory/strawberry.svg` — strawberry. 
- `memory/teapot.svg` — teapot. 
- `memory/telescope.svg` — telescope. 
- `memory/treasure-chest.svg` — treasure chest. 
- `memory/volcano.svg` — volcano. 
- `memory/whale.svg` — whale. 

Source and reuse terms: same original project-created vector provenance described above. No external sources or third-party asset licenses.

### Additional 36 memory faces

These additional subjects extend the 32 SVG faces above to 68. Together with the 32 existing code-drawn card subjects, the game can use 100 unique pair designs. Each additional filename and subject was checked against `CARD_NAMES`, the prior `MEMORY_ART` entries, and existing memory files before creation.

- `memory/avocado.svg` — avocado. 
- `memory/beetle.svg` — beetle. 
- `memory/bell.svg` — bell. 
- `memory/binoculars.svg` — binoculars. 
- `memory/broccoli.svg` — broccoli. 
- `memory/campfire.svg` — campfire. 
- `memory/candle.svg` — candle. 
- `memory/carrot.svg` — carrot. 
- `memory/chocolate.svg` — chocolate. 
- `memory/clover.svg` — clover. 
- `memory/cookie.svg` — cookie. 
- `memory/crocodile.svg` — crocodile. 
- `memory/drum.svg` — drum. 
- `memory/duck.svg` — duck. 
- `memory/elephant.svg` — elephant. 
- `memory/flamingo.svg` — flamingo. 
- `memory/fox.svg` — fox. 
- `memory/giraffe.svg` — giraffe. 
- `memory/grapes.svg` — grapes. 
- `memory/ladybird.svg` — ladybird. 
- `memory/lemon.svg` — lemon. 
- `memory/lobster.svg` — lobster. 
- `memory/magnet.svg` — magnet. 
- `memory/map.svg` — map. 
- `memory/panda.svg` — panda. 
- `memory/peach.svg` — peach. 
- `memory/pear.svg` — pear. 
- `memory/raccoon.svg` — raccoon. 
- `memory/robot.svg` — robot. 
- `memory/scarf.svg` — scarf. 
- `memory/seahorse.svg` — seahorse. 
- `memory/seal.svg` — seal. 
- `memory/skateboard.svg` — skateboard. 
- `memory/sunflower.svg` — sunflower. 
- `memory/train.svg` — train. 
- `memory/watermelon.svg` — watermelon. 

Provenance: original vector illustrations authored for this project. External sources: none. Same reuse terms as the rest of this collection.

Release 9: Chess, Filipino Dama and Water Patrol illustrations, board textures, sculpted SVG chess pieces, checker models, continuous arena-wall rendering and 3D CSS dice are original code-native artwork created for this project. They do not reproduce commercial game assets.

Rules engine: chess.js 1.4.0, Jeff Hlywa and other contributors, BSD-2-Clause. Full notice is preserved in `public/chess-js-LICENSE.txt` and shipped with the static export.
