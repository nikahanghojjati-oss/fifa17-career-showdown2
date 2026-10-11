# JOB-1629 Home sideways (844x390), re-run
- Left 40%: header chips, FULL Daniel (left) and Nik (right) cutouts and the wordmark. Right 60%: CONTINUE CAREER hero, 3x2 tile grid, soundtrack card. Tab bar along the bottom.
- Fixed from 1084: real 3x2 grid (three columns, two rows), art on the right inside each tile; managers shown whole, not a strip.
- Everything fits in one view at 844x390 and 740x360; the page would scroll once (vertically) only on an even shorter window, and the hero stays at the top of the controls.
- Labels (START A SHOWDOWN, TROPHY ROOM, RULE BOOK, STATISTICS...) never cut; they wrap whole words when the tile is narrow.
- Same elements, text and tap order as the live screen; subtitle and meta lines are visually hidden as on the phone Home.
- Own art only (v10_1 home assets, home tile art, league-title trophy art). No JavaScript.
- Browser check (headless Chromium, file://): 844x390 and 740x360 pass: no overflow, no overlap, no clipped label, hero visible.
- Not done: header gear is decorative here (as in the picture); no real tap behaviour.
