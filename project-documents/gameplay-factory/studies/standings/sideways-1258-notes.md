# JOB-1258 · Standings sideways phone study
- This is a static This Showdown view, not an interactive standings implementation.
- The exact labels and seven statistic names come from `visual-assets/v10_1/standings/app-strings.json` in the order used by `standings.js`.
- Daniel stays left; Nik stays right; the approved manager overlay art is linked without mirroring.
- No real club crest or unverified results appear: shield shapes reserve crest space, and em dashes mark dynamic scores and metrics.
- At 844×390, a left hero rail and right scoreboard show the two view tabs, score, and seven records without overlap; one document scroll remains available.
- Portrait 393×660 and 360×640 use a compact full-height card; 375×553 keeps both view actions and bottom navigation visible.
- The five-tab hub bar appears only at widths ≤900px, with STANDINGS selected.
- `PHONE_STANDINGS.png` was verified in GitHub by blob SHA but its image preview returned no bytes; Team V should compare visual proportions.
- No JavaScript, runtime wiring, rule changes, or new player-visible strings were introduced.
