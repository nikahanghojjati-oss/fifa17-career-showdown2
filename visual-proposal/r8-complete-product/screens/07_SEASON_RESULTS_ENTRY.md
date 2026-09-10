# Screen 07 — Season Results Entry / `seasonEntry`

Status: ACTIVE SCREEN CONTRACT

Source anchor: current `main` at `cef2e101f23fd8cb777f71950bac8f0f8d9f2c7b`.

## Purpose

Season Results is the most information-sensitive competition screen. It must make raw inputs, canonical scoring, shared publication/reveal and final commit state understandable without decorative distraction.

## Exact local-entry DOM

Preserve the existing real controls for both managers:

- League Position;
- League Points;
- League Goals;
- Domestic Cup Winner;
- Champions League Winner;
- Top Scorer;
- Top Assist;
- scoring hint including maximum season score 11;
- Review Season;
- Back to Showdown Home;
- validation/error live region.

The scoring hint reflects product authority and R8 must not implement or restate a second scoring engine.

## Product scoring locks visible in presentation

The visual layer must accurately present, without re-computing independently:

- Champions League +5;
- league title +3;
- main domestic cup +1;
- 100 league points and/or 100 league goals combined maximum +1;
- Top Scorer and/or Top Assist combined maximum +1;
- maximum season score 11;
- 0–0-only tiebreak behavior remains product authority.

## Layout

Use two equal manager result cards with a compact scoring-reference strip above or between them.

Numeric fields group separately from trophy/award toggles so users can scan raw league performance versus achievement bonuses.

Manager 1 and Manager 2 cards remain equal before product-authoritative scoring. Canonical proposal examples preserve Manager 1 = Daniel and Manager 2 = Nik.

Review Season becomes the dominant action only when current product validation permits review.

## Shared publication and review phases

The same screen must visually support the established shared workflow rather than creating a second shared-results page:

- review own result;
- not published;
- own result published / waiting for rival;
- both managers published / opponent side revealed;
- result snapshot ready;
- coordinator commit available;
- peer waiting for coordinator;
- own acknowledgement available;
- acknowledged / waiting for rival;
- both acknowledgements complete;
- Shared Canonical Score visible;
- Shared History Converged visible.

Use explicit phase badges and action labels. Do not infer provider state from styling.

## Shared Canonical Score panel

After provider-authoritative scoring exists, show a distinct gold authority panel containing the real canonical output:

- Manager 1 total vs Manager 2 total;
- Champions League contribution;
- league-title contribution;
- domestic-cup contribution;
- Performance Bonus;
- Awards Bonus;
- season winner or draw.

No winner/celebration styling appears before this state exists.

## Shared History Convergence panel

This is quieter and ledger-like. It is read-only and must not visually resemble a write action.

Present accepted seasons/total, shared league, fixed clubs, W/D/L, Showdown points and trophy attribution using current provider-authoritative data.

## Asset resolution

Required roles are solved without raster generation:

- dual-manager entry/review cards: DOM/CSS;
- waiting/published/both-revealed status layer: DOM/CSS;
- coordinator commit/acknowledgement treatment: DOM/CSS;
- canonical score projection: DOM/CSS;
- history-convergence panel: DOM/CSS/procedural dividers.

No A01/A02 artwork and no new image generation.

## Responsive contract

Wide desktop uses equal side-by-side manager cards with shared authority panels spanning both columns.

Chromebook/tablet may stack cards but retains Manager 1 then Manager 2 ordering and keeps scoring hint readable.

Mobile stacks all fields; checkbox labels remain at least 44px touchable where possible. Shared phase/status panels appear before the current actionable control.

## Accessibility and QA

- inputs and achievement checkboxes remain native and labeled;
- state and winner/draw are not communicated by color alone;
- canonical score values are real DOM text;
- hidden opponent results remain truly absent/withheld according to product authority rather than visually blurred;
- focus order follows the logical review/publish/commit/acknowledge flow;
- reduced motion never delays provider state;
- no decorative character art obscures data;
- shared panels remain readable in stale/reconnecting/error states.

## Final-main reconciliation

This screen has high drift risk because shared-play development can add states. Before senior handoff, re-inventory every local and provider-authoritative state against final main and update this contract without changing product semantics.