# Rule Book review · JOB-093

## Verdict

## Scorecard

## Hard gates

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
- Section index: reference has no six-button vertical index; code `#ruleBookIndex` adds six 44 px numbered anchors at `left: 6.2%; top: 29.4%; width: 4.6%`. This extra navigation is not prohibited by `TRUTH.md` because it is in-page navigation rather than a new product action, but it is not present in the style reference.
- Lower action zone: reference has three large lower actions, with a solid-gold primary in the centre and two dark outlined secondary actions; code `.ruleBookActions` has only one centred secondary `#ruleBookBack`, `min-width: 210px; min-height: 44px; bottom: 5.2%`. This differs from the reference but correctly follows `TRUTH.md`, which allows only `BACK TO MAIN MENU`.
- Visible words: reference contains Career Statistics labels, manager totals and leader labels; code leaves all Rule Book hero, section, scoring and Back copy to JS/fixtures rather than hard-coding those reference words. This is required by `TRUTH.md`.
- State treatment: reference is a populated career-statistics state; code hides `#ruleBookFrameStatus` and `#ruleBookFrameNote` and always shows the same six rule sections for RB1/RB2. That matches `TRUTH.md`, which defines Rule Book as static `ready` content with no empty/partial/unavailable body states.
- Manager areas: reference reserves large full-height portrait zones for Daniel on the left and Nik on the right; code has no manager portrait areas or cut-outs at all. `TRUTH.md` says Daniel-left/Nik-right applies if portraits are used, so this is a visual-style difference, not a side-order violation.
- Phone composition: reference is desktop-only; code replaces the desktop grid with a portrait stadium, 76%-wide title block, horizontal 44 px section index, internally scrolling rule stack and pinned Back action. There is no direct phone mockup value to compare, so this is governed by the factory phone rules rather than the Career Statistics reference.

## Fix list
