# Standard playing-card artwork

The 52 face SVGs in `public/playing-cards/` use the traditional Anglo-American/French-suited pattern: black Spades/Clubs, red Hearts/Diamonds, standard numeric pip arrangements, mirrored corner indices, ornate two-ended court figures and a decorative Ace of Spades. They preserve the complete card face rather than drawing new emoji or cartoon courts.

## Source and permission

- Repository: <https://github.com/AustinGabriel/Public-Domain-and-CC0-Playing-Cards>
- Pinned source commit: `3765067c32fcef42a30e87022332db729658e7cd` (repository HEAD retrieved 2026-11-04).
- Original location: `svg cards/card fronts/{suit}/{rank} of {suit}.svg`.
- The repository README explicitly states that **all assets and modifications are public domain / CC0**, permitting copying, modification, distribution and commercial use. Its complete CC0 1.0 Universal text is preserved in `public/playing-cards/LICENSE-CC0.txt`.
- Primary permission statement: <https://github.com/AustinGabriel/Public-Domain-and-CC0-Playing-Cards/blob/3765067c32fcef42a30e87022332db729658e7cd/README.md>.
- License: <https://github.com/AustinGabriel/Public-Domain-and-CC0-Playing-Cards/blob/3765067c32fcef42a30e87022332db729658e7cd/LICENSE>.

The collection traces its traditional court art to the public-domain vector-playing-cards project. No artwork was copied from the user's reference photograph, a commercial deck logo or the photo's publisher. The chosen files contain no external images, fonts, scripts, event handlers or foreign objects.

## Preparation and validation

The SVGs retain their `0 0 1500 2100` viewBox and exact **5:7** poker-card proportions. Filenames are normalized to `spades-ace.svg`, `hearts-10.svg`, `diamonds-queen.svg`, etc. The unnecessary XML declaration and external DTD declaration were removed. SVG paths were optimized using **SVGO 4.0.0**, the default preset and multipass, preserving viewBoxes and all face artwork. No raster conversion, card cropping, recoloring, suit replacement or pip rearrangement was performed.

The complete set decreased from **6,138,650** source bytes to **4,551,730** SVG bytes (approximately **1,982,598** bytes when individually gzipped). Detailed courts account for most of the size; clients should request visible card faces as needed and let immutable browser/edge caching reuse each distinct face. Keep these as external images rather than injecting all detailed paths into React's element tree.

`public/playing-cards/manifest.json` records every optimized filename, byte count and SHA-256. All 52 files were parsed and verified as self-contained path-based SVG, and all 52 decoded successfully in Chromium. A browser-rendered contact sheet is retained locally at `work/card-assets-contact.png` for visual inspection.

## Other design research

- Adrian Kennard's primary publisher page confirms the standard English-pattern Goodall-derived deck tradition and releases his separate designs under CC0: <https://www.me.uk/cards/>. These were a comparison reference; the bundled files come from the pinned repository above.
- Traditional layout reference: <https://bicyclecards.com/how-to-play/klondike>.

Table surfaces should be authored separately: textile/felt, restrained wood grain, linen and modern desk treatments can vary without changing suit identification or standard card dimensions. Face imagery should remain untinted by a player's model/accent color.
