# JOB-1497 · visualIdentity.js first half audit

no findings

Read: `js/visualIdentity.js` lines 1 to 376 (the first half of 753 lines). The first half is club palette data and the crest engine. The file holds no scores, counts, saves or screen flow.

Riskiest places checked, none of which showed a real bug:

1. Lines 319-331 (`buildCrestMotifs`): a motif name that is not in `CREST_MOTIFS` is skipped without a message (line 324). That can drop a crest element, but only if a recipe has a typo. The recipe names visible in this half (cannon, bee, fox, eagleR, tower, cat, knot, halo, and others) all exist in the dictionaries.
2. Lines 176-187 (`parseCrestTokens`): a missing colour falls back to the secondary colour for the first colour and to the primary colour for the second. That is a design choice, not a bug.
3. Lines 333-339 (`buildCrestSvgMarkup`): an unknown shape falls back to `heater`, and a leading `field` layer is removed and used as the base colour. Both paths produce a valid crest.

No game file was edited. This job adds one audit file only.
