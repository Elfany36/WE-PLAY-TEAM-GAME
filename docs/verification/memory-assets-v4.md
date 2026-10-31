# Memory SVG asset validation — recordings fix baseline

Audited directory: `/workspace/sites/markup-fixes/public/game-art/memory`.

**All 68 MEMORY_ART references passed.** The referenced name set contains 68 unique names and exactly matches the 68 SVG files on disk.

Checks performed for every file:

- Exists and parses as XML with an SVG root.
- Has a finite, positive viewBox and drawable shape content.
- Contains no external image, font, stylesheet or URL dependency, unresolved local resource reference, script, foreignObject, filter or SVG animation.
- Successfully decodes in Chromium's SVG image decoder and draws to a transparent 128 × 128 canvas.
- Produces visible, non-white pixels; no file renders empty or all-white.
- Has unique file content (no identical-file duplicate groups).

ViewBox inventory: `{'0 0 96 96': 68}`. Root size inventory: `{('96', '96'): 68}`.

All 68 files passed, 0 failed, and there were 0 warnings. The smallest measured non-white fraction was 67.2% of the 128 × 128 canvas.

The previous white-face symptom is consistent with reveal-time lazy loading/decoding and 3D/card presentation, not a missing or all-white source SVG. This audit validates the actual asset bytes and Chromium rendering; it does not independently validate production HTTP delivery, caching, CSP or every browser engine.

Per-file hashes, element counts, dimensions, dependency checks and raster measurements are saved in `memory-asset-validation-v4.json`. The reproducible script is `validate_memory_assets.py`, both under `/workspace/work`.

No application files were edited and nothing was published by this audit.
