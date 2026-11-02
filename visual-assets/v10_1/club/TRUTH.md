# Club product truth

Authority: `project-documents/factory/PRODUCT_TRUTH.md` only. Product behaviour on `main` wins later at integration if it conflicts.

## Ids and routes

Club is a wheel/assignment step, not a hub. Navigation is locked until this step is finished; the phone hub bar is hidden.

## Buttons and strings

Show two sealed club packs. Daniel is Manager 1 and always LEFT; Nik is Manager 2 and always RIGHT. Never mirror either character.

## Data contract

Club identity uses Showdown’s original code-drawn crests when a club is revealed. Names, clubs, selections, scores, codes, timers, and other changing values remain live DOM data and are never baked into imagery.

## Screen states and preview frames

Before reveal, both club packs remain sealed. Nothing may show or hint at the rival’s private inputs or progress.

## Mockup element decisions

KEEP: two sealed club packs, Daniel left, Nik right. DROP: real club crests, mirrored character art, extra buttons without live behaviour, and baked live club data.

## Phone

The bottom hub bar is hidden on the Club wheel. 393×660 and 360×640 must not page-scroll; the primary action remains visible at 375×553.

## Open questions

None. Product Truth governs any later integration details not specified here.
