# Reference data attribution

This reference combines separately licensed datasets. It is an inventory of pinned source data, not a claim of comprehensive current browser implementation.

- **Microsoft VS Code custom data**, copyright Microsoft Corporation, MIT license. Source: https://github.com/microsoft/vscode-custom-data. Original dataset descriptions are preserved, with data reorganized by feature and combined with specification/compatibility records. MIT text: vscode-LICENSE.txt.
- **W3C Webref**, copyright 2020 World Wide Web Consortium, MIT license. Source: https://github.com/w3c/webref. Curated CSS/element extracts retain specification links. MIT text: webref-LICENSE.txt.
- **MDN data** and **MDN browser compatibility data**, CC0-1.0. Sources: https://github.com/mdn/data and https://github.com/mdn/browser-compat-data. License texts: mdn-LICENSE.txt and bcd-LICENSE.txt.
- **MDN-derived documentation prose** by **Mozilla Contributors**, **CC BY-SA 2.5 or later**, where applicable. Source titles and page links are retained in individual reference entries. Modifications: prose has been reformatted and combined with formal syntax and status metadata. Adapted prose remains available under the same license. License: https://creativecommons.org/licenses/by-sa/2.5/. Official policy: https://developer.mozilla.org/en-US/docs/MDN/Writing_guidelines/Attrib_copyright_license.

Pinned repository SHAs, dates, exact dataset URLs, checksums and sizes are in source-manifest.json and pins.json. Missing explanations are identified instead of inventing normative definitions. Formal syntax is not a complete tutorial. A feature's presence in a specification is not proof that every browser implements it.

## Casual arcade expansion — reviewed 30 October 2026

Snakes & Ladders, Memory Garden, and Snake Meadow use original SVG illustrations and original application code. No publisher game-board or card artwork is included. Rules are explained in original wording. Published Hasbro ladder-game instructions, Ravensburger matching-game instructions, and a Nokia-authored Snake user guide inform the traditional mechanics. Eight-player/digital rule variations are explicitly identified in each game's rule panel. Source URLs and the implemented rules are listed in `casual-rules.json`.

New learning guides and exercises are original explanations/examples linked to WHATWG, W3C, MDN, and official documentation. The expansion review date does not change the pinned 29 October 2026 reference-inventory cutoff.

## Game design update and reference correction — 30 October 2026

UNO is an unofficial digital implementation informed by Mattel's linked classic 108-card, Deluxe timing, and two-player instruction sheets. Card SVGs are newly drawn in the recognizable classic layout; they are not scans, licensed publisher assets, or pixel-identical replicas. The classic rules cover 2–10 players; 11–12 seats, timed turns, and departure/exhaustion handling are identified digital extensions. No stacking or jump-in house rules are applied.

The snake maps, continuous SVG body rendering, backgrounds, and animations are original code. Memory Garden samples from 32 designs, including original illustrations and Lucide icon geometry distributed with the project's lucide-react dependency under its ISC license, with the included Feather-derived icons under MIT; full notices are preserved in `lucide-LICENSE.txt`. The UI links the official game-rule sources; `casual-rules.json` describes the exact implementation.

Pinned upstream files and inventory IDs remain intact. `lib/reference-corrections.ts` applies an authored correction to older `:not` editor prose, checked against the published January 2026 Selectors Level 4 draft. `editorial-corrections.json` records the change. The question bank collapses function spellings with/without empty parentheses into one scored identity; all inventory records remain visible.
