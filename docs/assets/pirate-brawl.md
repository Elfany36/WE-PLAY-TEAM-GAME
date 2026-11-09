# Pirate Bomb Brawl supplied assets

These assets were extracted byte-for-byte from the user-uploaded **Pirate Bomb Brawl_ Arena (3).html**, whose document title is **Pirate Bomb Brawl: Arena**. The user requested its addition to the arcade. The upload has 3,275,711 bytes and SHA-256 `401abc2699cf75a08531e9bb4ed0ad8783e36923c7400f00b60bc02686b24b74`.

The supplied HTML contains no author, copyright or license notice. This record identifies the supplied material; it does not assert a public-domain or third-party license. No remote artwork or font was downloaded. The original HTML and its executable script are not served as an embedded game page.

`public/pirate-brawl/manifest.json` records the exact source identity and each extracted file's MIME type, byte length, SHA-256 and image dimensions. It contains 38 files: 36 PNG images (382,388 bytes total) and two OGG Vorbis tracks (2,017,672 bytes total). The images are suitable for loading only when this game opens; audio should load only when the player enables it.

Extraction strictly parsed the `const A` JSON value and the separately assigned `A.bg`, `A.t` and `A.dc` JSON objects. The HTML script was not evaluated. PNG signatures, complete chunk bounds, CRCs and IEND endings were checked, as were OGG/Vorbis signatures. Every animated sheet's dimensions match its declared frame width, frame height and row/frame counts.

## Manifest contract

The top-level fields are `schema`, `source`, `animationRows`, `characterIds`, `characterNames`, `characterFacing`, `attackFacing`, `assets` and `files`. `assets` preserves the uploaded `A` object's naming and structure, replacing data URIs with root-relative `/pirate-brawl/...` URLs:

| Key | Value |
| --- | --- |
| `ch` | Six character records, each `{src,w,h,n}`; `n` maps animation names to frame counts. |
| `bomb`, `boom`, `heart` | Sprite records `{src,w,h,n}` with numeric frame counts. `boom` is the explosion sheet. |
| `tiles` | The original terrain/legacy tile sheet URL. |
| `fx` | Ten named effect records `{src,w,h,n}`: `fire`, `fireH`, `ice`, `iceH`, `thun`, `thunS`, `holy`, `smoke`, `chest`, `btn`. |
| `mu` | `{t,f}`: menu and battle OGG URLs. |
| `bg` | Nine background URLs: `sky`, `cb`, `cm`, `cs`, `oc`, `sa`, `cas`, `pfb`, `rui`. |
| `t` | Four terrain sheet URLs: `tm`, `ter`, `pf`, `rui`. |
| `dc` | Palm decoration URLs: `palm1`, `palm2`, `palm4`. |

Character sheet rows are **idle, run, jump, fall, attack, hit**, in that order. A frame starts at `(frame * w, row * h)` and measures `w × h`. Different rows have different valid frame counts; never animate against the sheet's maximum width alone. The uploaded renderer's normal facing multipliers are `[1,-1,-1,-1,-1,-1]`, and its attack facing multipliers are `[1,1,-1,1,1,-1]`.

| Index / ID | Name | Frame size | Sheet size | Idle / run / jump / fall / attack / hit |
| --- | --- | --- | --- | --- |
| `0` / `bomb-guy` | Bomb Guy | 58 × 58 | 1508 × 348 | 26 / 14 / 4 / 2 / 3 / 8 |
| `1` / `bald-pirate` | Bald Pirate | 63 × 67 | 2142 × 402 | 34 / 14 / 4 / 2 / 12 / 8 |
| `2` / `cucumber` | Cucumber | 64 × 68 | 2304 × 408 | 36 / 12 / 4 / 2 / 11 / 8 |
| `3` / `big-guy` | Big Guy | 77 × 74 | 2926 × 444 | 38 / 16 / 4 / 2 / 11 / 8 |
| `4` / `captain` | Captain | 80 × 72 | 2560 × 432 | 32 / 14 / 4 / 2 / 7 / 8 |
| `5` / `whale` | Whale | 68 × 46 | 2992 × 276 | 44 / 14 / 4 / 2 / 11 / 7 |

The images preserve transparent pixel-art characters, warm clothing, outlined silhouettes, tropical scenery and distinct character shapes. Bomb Guy and Captain sheets were visually inspected, including their attack and hit rows. Use nearest-neighbor rendering (`imageSmoothingEnabled = false` / `image-rendering: pixelated`) for faithful pixel art.
