# R8.24 Package 5 Responsive, Accessibility and Noninterference QA

Status: STATIC PROPOSAL PASS WITH IMPLEMENTATION GUARDS / LINKED SHIPPING BROWSER ACCEPTANCE PENDING

Controller: GPT-5.6 Sol reasoning

Image generation: CLOSED

## 1. Authority

Package 5 source/static acceptance is pinned to:

- live main: `61e16bb0357352a5c38c02aa072233e851226caf`
- runtime / asset revision: `1.9.1-r11`
- visual branch before this QA write batch: `e67c3b58636b52d692ced063763d56c7dd2b57b2`
- Package 4 decision: `R8_23_PACKAGE_4_EXACT_DOM_PRESENTATION_ASSET_DECISION.md`
- machine-readable result: `R8_24_PACKAGE_5_STATIC_ACCESSIBILITY_QA_RESULTS.json`

This document does not claim that the proposed visual layer has already shipped or that full linked-browser acceptance has occurred. The current visual branch remains a proposal lane and must not deploy production.

## 2. Overall verdict

The R8.5 black/gold proposal is structurally safe to hand to the master developer for selective implementation.

Result:

`STATIC_PROPOSAL_PASS_WITH_IMPLEMENTATION_GUARDS`

No static/source-level blocker was found that requires redesign or new raster generation.

What remains after this visual package is not more concept generation. It is selective implementation against then-current `main`, followed by real-browser acceptance of the integrated result.

## 3. Responsive acceptance

### Package 1 and 2

R8.20 remains valid:

- 1600x900: Home/Create/League/Club pass with their recorded per-screen constraints;
- 1024x768: crop or omit before any UI compromise;
- approximately 390x844: omit large character art;
- Club Assignment optional pack-holder candidates are omitted outside wide-desktop bounded cinematic use.

The proposal presentation stylesheet already enforces the core rule that character art loses before the UI. It reduces art on narrower screens and hides `.r8CharacterLayer` below 760px.

### Package 3

The sealed R8.22 matrix remains authoritative:

- 22 states;
- 3 viewport classes;
- 66 total cases;
- 66 passed;
- 0 horizontal overflow failures;
- 0 character/protected-DOM intersections;
- 0 visible character/central-stage intersections after rail clipping.

Package 3 wide desktop may use role-aligned A01/A02 outer rails. The proof hides those large rails at and below 1280px. No new tactical or celebration master is required.

### Package 4

Package 4 deliberately uses no character art, so responsive risk comes from live data/control density rather than image placement.

Current live CSS already provides bounded responsive behavior:

- Statistics and Trophy Room: multi-column analytics collapse at current 900/650px breakpoints; wide standings retain intentional horizontal scrolling rather than shrinking data into illegibility.
- Legacy: archive cards, season rows and data-management controls collapse around 800px, with further small-screen tightening.
- Rule Book: two-column reading grid becomes one column below 760px.
- Settings: 900px-class modal becomes a full-screen one-column utility view below 700px.
- Save Library: save/profile grids and identity-link rows become one column below 760px.
- Restore/Recovery: three-column review/choice structures become one column below 800px.
- Remote Joining: host/join cards become one column below 680px and the action grid becomes two columns.

Implementation rule: preserve these real breakpoints first. Do not force a decorative R8.5 layout that causes a live utility surface to fight its existing responsive contract.

## 4. Keyboard and modal-focus acceptance

The live Settings implementation has a materially complete modal keyboard model:

- role `dialog`;
- `aria-modal=true`;
- labelled by the Settings heading;
- application background receives `inert` and `aria-hidden=true` while open;
- Escape closes the dialog;
- Tab wraps from last focusable element to first;
- Shift+Tab wraps from first to last;
- if no focusable element exists, focus returns to the dialog;
- previous focus is restored when the dialog closes;
- motion choices implement radio semantics and Arrow/Home/End keyboard movement;
- re-rendered settings controls have targeted focus restoration.

The visual layer must preserve all of this. No artwork node may enter the tab order.

## 5. Focus visibility

The current application and proposal already provide explicit high-contrast focus treatment for major controls, including menu buttons, Settings close, motion controls, inputs/selects, Rule Book/Legacy controls and Restore fields.

One implementation guard is required:

`#appRuntimeNotice` has an accessible dismiss button but no explicit application-level `:focus-visible` selector in the current r11 CSS.

Final integration should add an explicit high-contrast focus-visible treatment for that dismiss control rather than depending on browser defaults.

Second focus guard:

The current yellow token has poor contrast against pure white when used alone as a thin outline. Static token check gives approximately `1.44:1` for `#f0d900` against white.

Therefore:

- do not use yellow alone to indicate focus on white/light controls;
- retain the existing blue/dark border or another high-contrast component;
- on the black R8.5 surfaces, gold focus treatment is strong and may remain.

## 6. Static contrast spot checks

These are WCAG relative-luminance token checks, not a substitute for rendered accessibility scanning.

R8.5 dark system:

- cream `#f5f0e4` on ink `#10151a`: about 16.14:1;
- gold `#f3cc4f` on ink: about 11.85:1;
- muted `#bdb49a` on ink: about 8.88:1;
- danger `#dc6f6f` on ink: about 5.72:1;
- warning `#f0bd45` on ink: about 10.55:1;
- dark text on gold: about 12.57:1;
- cream on dark button: about 14.95:1;
- placeholder `#968f7e` on dark input `#06090b`: about 6.21:1.

Current utility system representative checks:

- white on runtime-notice dark: about 11.90:1;
- white on panel dark: about 12.49:1;
- ink on yellow: about 10.53:1;
- ink on cyan: about 6.61:1;
- danger text on pale-danger background: about 6.78:1;
- blue-deep on white: about 9.05:1;
- common muted text on white: about 5.66:1;
- status text on light status panel: about 6.44:1;
- blue focus border against white: about 5.22:1.

These checks support the proposed token direction while preserving the yellow-on-light focus guard above.

## 7. Art-layer noninterference acceptance

The proposal architecture already defines:

- `.r8FinalArtLayer`;
- `.r8CharacterLayer`;
- `.r8AtmosphereLayer`.

Required final implementation contract:

- `pointer-events:none !important`;
- `user-select:none !important`;
- `aria-hidden=true` on decorative wrappers;
- no links, buttons, inputs or any other focusable descendants;
- absolute/contained positioning so art never participates in live grid/flex sizing;
- real controls/status/result data remain at higher stacking authority;
- no horizontal document expansion;
- crop, fade or omit art before moving/resizing a functional control;
- Package 4 contains no character art at all.

This is a hard acceptance condition, not an aesthetic preference.

## 8. Reduced-motion acceptance

The existing/proposed system already contains reduced-motion handling across major surfaces:

- R8.5 proposal disables startup, route and pulse animation/transition under `prefers-reduced-motion:reduce`;
- Settings disables its dialog animation under application/system reduced-motion conditions;
- Remote Joining removes its backdrop-filter in reduced-motion mode;
- Save Library removes its progress transition and normalizes scrolling behavior;
- Restore/Recovery normalizes scrolling behavior.

Final-art motion, if any, is decorative only. Removing it must never change a reveal, scoring, pairing, publishing, restore, save or session state.

## 9. Authority-isolation acceptance

The proposed visual integration may read existing state to choose presentation, but it owns no domain authority.

It may not:

- write storage;
- write visual state to Firestore;
- add Firebase fields for art;
- change scoring;
- change Save Library records/profile links;
- change pairing or Remote Joining;
- create a second result/winner authority;
- change provider authorization/rules;
- enable billing;
- require Blaze, Cloud Functions or Cloud Run.

Firebase stays Spark-only and billing remains permanently off.

## 10. Character and asset acceptance

Current required frozen masters remain only:

- A01 Nik core thinking hero;
- A02 Daniel core pointing hero.

A03/A04 tactical and A05/A06 celebration remain planned hold slots, not implementation requirements.

Approved broad use:

- Package 1 wide desktop where mapped safe zones exist;
- Package 3 wide desktop outer rails where mapped state/privacy rules permit;
- compact/mobile omission per existing proofs.

Not approved:

- generic Save Library profile art;
- Package 4 utility character decoration;
- a character as Connected Rivalry/Remote Joining state indicator;
- character art in Restore/Recovery;
- character art in Rule Book;
- arbitrary manager cabinets in Trophy Room.

Trophy Room remains CSS/SVG/procedural-first. Its raster-atmosphere fallback remains closed.

## 11. Package 5 result

Static/source visual acceptance: PASS WITH IMPLEMENTATION GUARDS.

Blocking static findings: 0.

Required implementation guards:

1. add explicit high-contrast `:focus-visible` styling to the global runtime-notice dismiss button;
2. never rely on yellow-only focus indication against white/light surfaces;
3. keep all decorative final art `aria-hidden`, noninteractive and outside layout sizing;
4. preserve live Package 4 responsive breakpoints and authority states;
5. perform real linked-browser keyboard, mouse/touch, responsive, accessibility and obstruction acceptance after selective implementation against then-current main.

## 12. What Package 5 does not claim

This visual lane did not link its proposed stylesheet/art layer into production and did not deploy it.

Therefore this document does not claim:

- actual shipping-browser screenshots from integrated final art;
- automated accessibility scan of an integrated production candidate;
- live touch/keyboard acceptance of a production visual PR;
- final public Pages deployment match.

Those are implementation acceptance responsibilities after the master development lane selectively integrates the proposal.

## 13. Generation decision

Image generation remains CLOSED.

There is no current mapped missing asset that justifies a new generation call.

## 14. Next task

The visual proposal is sufficiently mature to update the master-developer handoff and produce a current R8.24 implementation prompt.

Those handoff files must supersede stale instructions that still imply multiple tactical/celebration pose families are required or that Trophy Room should receive owner-character artwork by default.
