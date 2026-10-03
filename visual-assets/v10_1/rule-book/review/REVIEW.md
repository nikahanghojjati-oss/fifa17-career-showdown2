# Rule Book review · JOB-093

## Verdict

## Scorecard

| Criterion | Score | Evidence |
| --- | ---: | --- |
| 1 · Mockup fidelity | 4/5 | There is no dedicated Rule Book mockup; against the Career Statistics style reference, the code preserves the centred gold-brush title hierarchy and gold-on-black panel language, but the Rule Book title is materially narrower and the six-panel composition is necessarily different. |
| 2 · Characters stand out | 5/5 | No manager art is rendered on this screen by design, so there is no pasted-behind-UI, halo, seam or depth-order defect to penalize. |
| 3 · Hands and contact | 5/5 | No people or hands are present on the Rule Book screen, so there is no hand/contact compositing defect. |
| 4 · Lighting and grade | 4/5 | `.ruleBookScrim`, `.ruleSection` and `.scoringRuleSection` use black depth, warm gold edge light and layered gradients rather than flat grey panels; no contradictory light treatment is evident in authored CSS. |
| 5 · Typography and title | 4/5 | The screen uses the approved Rule Book brush wordmark with a visually hidden real H1, eyebrow and tagline, but the lockup is narrower than the style reference and scoring values are only modestly emphasized. |
| 6 · Panel craft | 4/5 | Six consistent gold-edged glass panels use corner cuts, warm inset highlights, aligned two-column geometry and a stronger scoring treatment; the layout is coherent but highly uniform compared with the richer asymmetric reference. |
| 7 · Information clarity and honesty | 3/5 | All six rule sections and scoring values are truthful and fixture-driven, but six interactive section anchors add controls that `TRUTH.md` explicitly does not authorize, making the screen less product-honest. |
| 9 · Phone composition | 4/5 | Authored CSS creates a dedicated portrait composition with a resized title, horizontal 44 px index, internal rule scroll region and pinned Back action; actual no-scroll/viewport fit remains unmeasured by Claude. |
| 10 · Polish and finish | 4/5 | The screen uses shared tokens, type, stage and motion systems, WebP display assets, explicit focus styling and fixture-driven text, with no placeholder/debug copy; runtime errors and first-paint measurements are still unverified. |

Static-review average: 4.11/5 across criteria 1–7, 9 and 10. Static pass line requires ≥ 4.2, no criterion below 3 and every hard gate PASS.

## Hard gates

| Gate | Result | Evidence |
| --- | --- | --- |
| H1 · Daniel left, Nik right | PASS | `fixtures.json#managerOrder` is `["daniel","nik"]`; no manager portraits or rows render, so no frame can mirror or swap them. |
| H2 · Rights-safe visuals | PASS | `index.html` references only Showdown system stadium/wordmark WebP assets; no real crest, league logo, trophy, player or EA/FIFA art is loaded. |
| H3 · No live/private data baked into images | PASS | Stadium and title wordmark are static art; all rules, scores, states and button copy render as DOM text from `fixtures.json`. |
| H4 · Product truth | FAIL | `rule-book.js#buildSections` invents six interactive section-anchor controls although `TRUTH.md` says the Rule Book itself has only the Back action and says not to invent Rule Book actions. Scoring values themselves are correct. |
| H5 · Phone fit | NOT MEASURED (Claude measures) | No `evidence/QA_SUMMARY.md` exists. |
| H6 · Input size / contrast | NOT MEASURED (Claude measures) | No `evidence/QA_SUMMARY.md` exists. |
| H7 · Reduced motion | NOT MEASURED (Claude measures) | No `evidence/QA_SUMMARY.md` exists. |
| H8 · Keyboard / focus | NOT MEASURED (Claude measures) | No `evidence/QA_SUMMARY.md` exists. |
| H9 · Console / failed requests | NOT MEASURED (Claude measures) | No `evidence/QA_SUMMARY.md` exists. |
| H10 · Mockup diff | NOT MEASURED (Claude measures) | No `evidence/scores.json` exists. |
| H11 · First-paint weight | NOT MEASURED (Claude measures) | No `evidence/QA_SUMMARY.md` exists. |

## Evidence

### Claude measurements

Source checked: `project-documents/factory/status/JOB-092.md`. The file contains the build worker's code-only checks, but no Claude intake measurement block for H5–H11.

- H5 phone fit: NOT MEASURED (Claude measures). `visual-assets/v10_1/rule-book/evidence/QA_SUMMARY.md` does not exist on the branch.
- H6 input size / contrast: NOT MEASURED (Claude measures). `visual-assets/v10_1/rule-book/evidence/QA_SUMMARY.md` does not exist on the branch.
- H7 reduced motion: NOT MEASURED (Claude measures). `visual-assets/v10_1/rule-book/evidence/QA_SUMMARY.md` does not exist on the branch.
- H8 keyboard / focus: NOT MEASURED (Claude measures). `visual-assets/v10_1/rule-book/evidence/QA_SUMMARY.md` does not exist on the branch.
- H9 console / requests: NOT MEASURED (Claude measures). `visual-assets/v10_1/rule-book/evidence/QA_SUMMARY.md` does not exist on the branch.
- H10 mockup diff: NOT MEASURED (Claude measures). `visual-assets/v10_1/rule-book/evidence/scores.json` does not exist on the branch.
- H11 first-paint weight: NOT MEASURED (Claude measures). `visual-assets/v10_1/rule-book/evidence/QA_SUMMARY.md` does not exist on the branch.

### Mockup differences

Reference: `MOCKUP_CAREER_STATISTICS.png` is style-only for this screen because `TRUTH.md` states that no Rule Book mockup exists.

- Title block: reference Career Statistics title is a broad gold brush lockup centred high over the content field at roughly the upper 12–25% of the frame; code `.ruleBookHero` is centred at `left: 34.7%; top: 10.8%; width: 29.6%`, using the approved Rule Book brush wordmark plus eyebrow, tagline and summary. The hierarchy matches, but the Rule Book lockup is materially narrower than the Career Statistics reference.
- Panel field / sections 01–06: reference uses four compact KPI cards across the upper content band, then asymmetric table/comparison panels and a wide leaders strip; code `.ruleBookGrid` uses six equal gold-edged glass panels in a symmetric 2 × 3 grid from `left: 12.4%` to `right: 5.9%`, `top: 29.4%` to `bottom: 13.3%`. This is a deliberate content-layout difference, not a truth violation, because Rule Book has six static rule sections and no dedicated mockup.
- Panel material: reference panels are dark smoked glass with thin bright gold borders, warm inset highlights and black depth; code `.ruleSection` and `.scoringRuleSection` use the same dark/glass/gold family, including gold edge light and shadow. The code is visually consistent with the reference material language.
- Scoring panel: reference's data panels make numeric values larger and more dominant than labels; code `.ruleScoreRow strong` raises the score values only to `1.18em`, so the Rule Book scoring numbers are less heroic than the reference's stat-number treatment.
- Section index: reference has no six-button vertical index; code `#ruleBookIndex` adds six 44 px numbered anchors at `left: 6.2%; top: 29.4%; width: 4.6%`. `TRUTH.md` says to keep only the real Back action plus shared factory navigation and not invent Rule Book actions, so these interactive section anchors are a product-truth difference that needs removal or conversion to non-interactive decoration.
- Lower action zone: reference has three large lower actions, with a solid-gold primary in the centre and two dark outlined secondary actions; code `.ruleBookActions` has only one centred secondary `#ruleBookBack`, `min-width: 210px; min-height: 44px; bottom: 5.2%`. This differs from the reference but correctly follows `TRUTH.md`, which allows only `BACK TO MAIN MENU`.
- Visible words: reference contains Career Statistics labels, manager totals and leader labels; code leaves all Rule Book hero, section, scoring and Back copy to JS/fixtures rather than hard-coding those reference words. This is required by `TRUTH.md`.
- State treatment: reference is a populated career-statistics state; code hides `#ruleBookFrameStatus` and `#ruleBookFrameNote` and always shows the same six rule sections for RB1/RB2. That matches `TRUTH.md`, which defines Rule Book as static `ready` content with no empty/partial/unavailable body states.
- Manager areas: reference reserves large full-height portrait zones for Daniel on the left and Nik on the right; code has no manager portrait areas or cut-outs at all. `TRUTH.md` says Daniel-left/Nik-right applies if portraits are used, so this is a visual-style difference, not a side-order violation.
- Phone composition: reference is desktop-only; code replaces the desktop grid with a portrait stadium, 76%-wide title block, horizontal 44 px section index, internally scrolling rule stack and pinned Back action. There is no direct phone mockup value to compare, so this is governed by the factory phone rules rather than the Career Statistics reference.

### Code audit

- PASS · side order / manager ordering — `fixtures.json#managerOrder` is exactly `["daniel","nik"]`; `rule-book.js#buildSections` renders no manager rows or portraits, so no frame can place Nik left of Daniel.
- PASS · recorded content only — `fixtures.json#strings.sections` contains only the six approved rule sections and fixed scoring table from `TRUTH.md`; `rule-book.js#buildSections` renders only those fixture sections, with no invented statistics.
- FAIL · invented interactive controls — `rule-book.js#buildSections .ruleBookIndexChip` creates six focusable `<a>` controls that jump to section anchors; `TRUTH.md` says the Rule Book itself has one button/action, `.backButton[data-smart-back]`, and says not to invent Rule Book actions. These six interactive section controls are not present in the live product.
- PASS · Back action — `index.html #ruleBookBack.backButton[data-smart-back]` is the sole button, and `rule-book.js#applyFrame` supplies its visible label from `fixtures.json#strings.buttons.back`; this matches the approved `BACK TO MAIN MENU` action.
- PASS · state honesty — `fixtures.json#frames.RB1` and `RB2` are both `ready`; `rule-book.js#applyFrame` changes only preview metadata/stress styling. `TRUTH.md` declares empty, partial and unavailable body states not applicable to this static screen, so the absence of invented body-state cards is correct.
- PASS · changing DOM copy — `rule-book.js#applyFrame`, `#buildSections`, `#ruleList` and `#scoringTable` assign hero text, section titles/rules, scoring labels/values, preview copy and Back text from `fixtures.json` with `textContent`; no changing competition value is hard-coded into HTML.
- PASS · accessible screen name — `index.html main#ruleBook[aria-labelledby="ruleBookHeading"]` points to the visually-hidden H1, and `rule-book.js#applyFrame` fills `#ruleBookHeading` from `fixtures.json#strings.heading`.
- PASS · section-region naming — `index.html #ruleBookSections[aria-label="Competition rules"]` and `#ruleBookIndex[aria-label="Rule Book sections"]` expose names for the content and index regions.
- PASS · control accessible names — `rule-book.js#buildSections .ruleBookIndexChip` assigns an explicit `aria-label` such as `01 SHOWDOWN FORMAT`; `#ruleBookBack` gets its accessible name from visible fixture-driven button text.
- PASS · focus order — DOM order in `index.html` is `#ruleBookIndex` before `#ruleBookSections` and then `#ruleBookBack`; `rule-book.js#buildSections` appends chips 01→06, producing a predictable 01→06→Back tab order with no positive `tabindex`.
- PASS · phone targets — `rule-book.css @media(max-width:760px) #ruleBookIndex a` sets `min-width:44px; min-height:44px`; `#ruleBookBack` also keeps `min-height:44px`. Both interactive control families meet the 44 px target rule by code reading.
- PASS · input font rule not applicable — `index.html` contains no `input`, `select`, or `textarea`; therefore the ≥16 px input-text requirement has no Rule Book control to assess.
- PASS · focus indication in authored CSS — `rule-book.css #ruleBookIndex a:focus-visible` defines a 2 px gold outline plus glow. The Back button uses shared `.sd-btn` focus styling; browser measurement remains Claude's H8 responsibility.
- PASS · no PNG master shipped — `index.html .ruleBookWordmark`, `.ruleBookPhonePlate` and ShowdownStage sources reference only `.webp`; no PNG master path appears in the screen HTML.
- PASS · no live data baked into images — `index.html` image assets are the static system stadium and static Rule Book title wordmark only; all rules, scoring values, states and button copy are DOM text from `fixtures.json`.
- NOTE · preview-only fetch failure — `rule-book.js#loadFixtures/.catch` creates the internal error string `Rule Book fixtures could not be loaded.`, but `#ruleBookFrameStatus` is CSS-hidden. It is not a visible invented product state; `TRUTH.md` keeps real module-open failure at app level.

## Fix list
