# Traditional cards, table designs and studio presentation

The first requested pass is committed separately, before the wider game audit and Word Factory work. It builds on `fcdd8c3`.

Solitaire now uses a complete traditional 52-card CC0 vector deck with accurate pip arrangements, mirrored indices, detailed double-ended courts and an ornate spade ace. [Provenance, license, pinned source and checksums](../assets/playing-cards.md) accompany the files. Faces are external, cached images loaded only when visible, rather than large inline React trees.

All piles share measured 5:7 card dimensions. Previously full-width tableau columns and a fixed maximum height distorted the cards. Card heights and overlap spacing now match the stock/foundations, and the playfield contains horizontal scrolling on narrow screens. Fit and Large card options are personal preferences; they never change a shared deal.

Ten table designs include classic green/blue felt, blue painted wood inspired by the supplied real-card reference, walnut, ivory linen, Bordeaux leather, rose, plum and slate. The setup preview matches the actual table. Table/card settings can also be changed during play and reset to the room's table. The player's deck model and color appear in patterned double-ended card backs. Moves, stock draws and initial deals have short, reduced-motion-aware animations.

The drawing studio gains original paper/pencil artwork, clearer private word choices, a round progress clock, letter hints, a cleaner palette and framed paper. Its incremental canvas preserves unacknowledged local strokes during resize; authoritative Clear/Undo/turn changes still remove them. Viewport tools are compact and recognize Solitaire, drawing and tactical boards. Tactical commander labels and round-footer controls use more consistent spacing.

The four-game rule review fixed three confirmed defects: leaving the last untimed Solitaire board no longer strands spectators in a running round; a departing correct guesser cannot inflate the artist's award above 300; forged TriPeaks/Pyramid stack offsets cannot corrupt the waste or remove an invalid card. Recoverable solo stuck deals retain Undo/Restart.

Validation: TypeScript and **589 automated checks** pass. Browser checks cover all eight Solitaire modes at 390/1440 px (16 cases), all ten table designs at both widths, card proportions, table preferences and viewport resizing, plus mobile/desktop drawing and information panels. Four online cases passed at injected 90/400 ms RTT, including private words, chat locks, artist reload, live strokes and HTTP fallback. The 400 ms drawing case also preserved unacknowledged ink during resize. Generals/Fleet deployment dragging passed mouse and real touch (four cases).

Research: [Adrian Kennard's public-domain card designs](https://www.me.uk/cards/), [the CC0 source deck](https://github.com/AustinGabriel/Public-Domain-and-CC0-Playing-Cards), [the international/English card pattern archive](https://atlasofplayingcards.org/international.html), [classic layout](https://solitaire.com/blog/solitaire-setup/) and modern customizable felt/card presentations informed the work. The photographed reference is inspiration; its publisher's photo is not redistributed.
