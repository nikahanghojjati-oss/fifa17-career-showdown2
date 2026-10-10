# League product truth

Authority: `project-documents/factory/PRODUCT_TRUTH.md` only. Product behaviour on `main` wins later at integration if it conflicts.

## Ids and routes

League is a wheel step, not a hub. Navigation is locked until this step is finished; the phone hub bar is hidden.

## Buttons and strings

The wheel shows exactly five original league marks: PL Crown, LaLiga Bull, Bundesliga Schale, Serie A Shield, and Ligue 1 numeral “1”. The actions are Spin and Back.

## Data contract

Use original Showdown league marks only; never ship real league logos. Any changing league choice remains live DOM state, never baked into imagery.

## Screen states and preview frames

The wheel must support the active selection/spin flow without exposing any rival private input or progress. No additional product state is specified by Product Truth.

## Mockup element decisions

KEEP: five marks inside the wheel, Spin, Back. DROP: real league branding, extra buttons without live behaviour, and any baked live selection data.

## Phone

The bottom hub bar is hidden on the League wheel. 393×660 and 360×640 must not page-scroll; the primary action remains visible at 375×553.

## Open questions

None. Daniel remains left and Nik right anywhere manager identity is shown.
