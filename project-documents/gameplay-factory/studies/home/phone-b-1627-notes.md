# JOB-1627 Home phone B (bold hierarchy), re-run
- Layout follows PHONE_HOME: header chips, FULL Daniel (left) and Nik (right) cutouts, wordmark, hero, 3x2 tile grid, soundtrack card, tab bar.
- Fixed from 1082: real 3x2 grid (three columns, two rows), art on the right inside each tile; managers shown whole (object-fit contain), not a strip.
- Bold choice: CONTINUE CAREER is the biggest, brightest element, glowing and placed right under the wordmark; the six tiles sit in one framed block; the soundtrack card is its own dashed band.
- Labels (START A SHOWDOWN, TROPHY ROOM, RULE BOOK, STATISTICS...) wrap whole words, never cut.
- Same elements, text and tap order as the live screen; subtitle and meta lines are visually hidden as on the phone Home.
- Own art only (v10_1 home assets, home tile art, league-title trophy art). No JavaScript.
- Browser check (headless Chromium, file://): 393x660, 360x640, 375x553 all pass: no scroll, no overflow, no clipped label, hero visible.
- Not done: header gear is decorative here (as in the picture); no real tap behaviour.
