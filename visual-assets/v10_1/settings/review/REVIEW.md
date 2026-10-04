# Settings independent review · JOB-096

## Verdict

## Scorecard

## Hard gates

## Evidence

### Claude measurements

- H5 · Phone fit: NOT MEASURED (Claude measures).
- H6 · Inputs and contrast: NOT MEASURED (Claude measures).
- H7 · Reduced motion: NOT MEASURED (Claude measures).
- H8 · Keyboard and visible focus: NOT MEASURED (Claude measures).
- H9 · Console errors / failed requests: NOT MEASURED (Claude measures).
- H10 · Mockup-diff gate: NOT MEASURED (Claude measures).
- H11 · First-paint weight / WebP delivery: NOT MEASURED (Claude measures).

Measurement sources checked:
- `project-documents/factory/status/JOB-095.md` has build-worker code/arithmetic checks but no Claude intake measurement block.
- `visual-assets/v10_1/settings/evidence/QA_SUMMARY.md`: not present at review time.
- `visual-assets/v10_1/settings/evidence/scores.json`: not present at review time.

### Mockup differences

Reference scope note: `MOCKUP_CAREER_STATISTICS.png` is a system-style reference only. `settings/TRUTH.md` says no Settings mockup exists, so differences below are descriptive unless product truth or the shared visual language makes them defects.

- Title block · Career Statistics reference: centred around x≈50%, eyebrow near y≈15%, brush title spanning roughly 36–38% of the viewport, tagline directly below; Settings code: `.settingsTitleBlock` top 11.8%, width max 34vw/566px and `.settingsWordmark` 90.3% of that block (≈30.7% viewport), so the Settings lockup is noticeably earlier and narrower.
- Title words/state · Reference: visible `CAREER MODE SHOWDOWN 17` / `CAREER STATISTICS` / `TWO MANAGERS. ONE LEGACY.`; Settings: the same eyebrow/tagline system but the brush image is `TITLE_SETTINGS_V1.webp` and the accessible heading is fixture-driven `SETTINGS`, which is the required Settings truth rather than a copy of the reference words.
- State rail · Reference: no preview/status rail under the title; Settings: `.settingsStateRail` occupies top 24.2%, left/right 7.6%, adding Preview / loading / empty / unavailable / partial state messaging required by the contract.
- Account panel · Reference: no Account panel; its upper row is four equal KPI tiles beginning around y≈26%; Settings: `.settingsPanel--account` occupies grid columns 1–3 at x≈7.6%, y≈30.4%, w≈20.1%, h≈23.5% and uses the same dark-glass/gold-edge material but a different Settings-specific layout.
- Application panel · Reference: no Application panel; upper reference tile rhythm is equal-width stat cards; Settings: `.settingsPanel--application` is wider, x≈29.0%, y≈30.4%, w≈27.4%, h≈23.5%, because it carries version/update/credit product content.
- Motion & Feedback panel · Reference: no tall right-side settings panel; the reference has a Manager Comparison panel below the KPI row; Settings: `.settingsPanel--motion` spans x≈57.8%, y≈30.4%, w≈34.6%, h≈54.2%, a deliberate two-row vertical anchor with the same gold-edged dark-glass family.
- Showdown Data panel · Reference: lower-left Career Table spans about 37% of viewport width with a separate manager panel to its right; Settings: `.settingsPanel--data` spans x≈7.6%, y≈56.0%, w≈48.8%, h≈28.6%, consolidating data actions into one larger panel.
- Panel material · Reference: thin bright gold borders, dark translucent glass, warm stadium spill; Settings: all four `.settingsPanel` variants use 1px gold-tinted borders, black gradient glass and warm radial highlights, so the material language matches even though the composition does not.
- Close button · Reference: no modal close button in the main content; Settings: `#settingsClose` is a real 44×44 minimum control at top right, required by Settings truth.
- Account action buttons · Reference: no sign-in / manager-choice / retry / forget-device controls; Settings: `#accountActions button` are 44px-min secondary controls inside the Account panel, required product actions.
- Application update button · Reference: no application-update control; Settings: `.settingsApplicationUpdateButton` is a 44px-min secondary control inside Application, required by Settings truth.
- Motion choice buttons · Reference: no radio-card controls; Settings: two `.settingsMotionChoice` cards in a 2-column desktop grid, each min-height 86px, because Settings exposes Follow Device / Reduce Motion.
- Menu feedback switch · Reference: no switch; Settings: `.settingsAudioToggle` is min 58×44px and sits at the right of `#feedbackRow`, required by product truth.
- Data action buttons · Reference: bottom navigation has three large horizontal actions, with the middle one solid gold; Settings: `#dataActions button` live inside the Showdown Data panel and include the History route plus the red destructive action when available.
- DONE button · Reference: the main bottom action row sits around y≈84–90% and the primary action is centred; Settings: `.settingsFooter` is right-aligned at 7.6% and bottom 4.4%, with a single solid-gold DONE control min-width 142px.
- Confirmation buttons · Reference: no destructive modal; Settings: `#confirmDialog` adds full-width phone confirmation controls and desktop 44px-min CANCEL / DELETE actions, with the background dimmed/inert in ST3.
- Manager areas · Reference: Daniel is a large left cut-out occupying roughly the left quarter and Nik a large right cut-out occupying roughly the right quarter; Settings: the cutout and light registered layers are intentionally empty and no manager art is present. `settings/TRUTH.md` explicitly says Settings needs no managers, so this is a product-authority difference, not a reversal or missing required character.
- Phone composition · Reference has no phone authority; Settings uses a dedicated portrait plate, title at 12px, an internally scrolling single-column panel area, pinned 44px DONE control and a 56px plus safe-area bottom reserve rather than shrinking the desktop grid.

### Code audit

- PASS · Manager order · `fixtures.json strings.account.actions`, `frames.*.values.viewerRole`, and `strings.dataActions.confirmDanielNik`: wherever both names appear, Daniel precedes Nik; the screen has no left/right manager cut-outs to reverse.
- PASS · No invented football stats · `fixtures.json strings` and `frames`: only account/device state, app version/update, motion/feedback state, contract status and safe data actions are present; no clean sheets, match results, player stats or other dropped career metrics appear.
- PASS · Allowed controls only · `settings.js::renderActions`, `renderMotionChoices`, `applyFrame`: controls are limited to the truth-defined close/DONE, account actions, update, motion choices, menu-feedback switch, History & Backup, safe delete and its confirmation.
- PASS · Current-Showdown summary dropped · `settings.js #dataPanel / #dataNote`: no free-form current Showdown name/status row or local Legacy count is rendered; only the safe action gate and truth-approved explanatory note remain.
- PASS · Honest ready/empty/loading/unavailable/partial states · `fixtures.json frames.ST1–ST7`: all five contract statuses are represented, empty and unavailable are distinct, and ST7 carries the exact interim label rather than inventing all-time coverage.
- PASS · Destructive state honesty · `fixtures.json frames.ST3.values.confirmDialog` + `settings.js #confirmDialog`: delete appears only when `deleteVisible` is true; ST3 uses the exact Daniel-vs-Nik confirmation copy and makes header/content/footer inert while open.
- PASS · Fixture-driven changing text · `settings.js::applyFrame`, `renderActions`, `renderMotionChoices`: manager identity, device state, update label/status, motion state, feedback state, contract status, data notes/actions and confirmation message all come from `fixtures.json`; the hard-coded credit prefix/suffix are invariant legal-copy fragments, not changing state.
- PASS · Accessible close name · `settings.js #settingsClose`: visible glyph comes from `strings.shell.closeGlyph` and `aria-label` comes from `strings.shell.closeAriaLabel` (`Close Settings`).
- PASS · Accessible motion group · `settings.js #motionChoices` / `.settingsMotionChoice`: the radiogroup receives fixture-provided `Application motion preference`; each choice has role `radio`, visible text and stateful `aria-checked`.
- PASS · Accessible feedback switch · `settings.js #feedbackToggle.settingsAudioToggle`: visible ON/OFF and the state-specific accessible name come from the fixture, with `role="switch"` supplied by `index.html` and `aria-checked` set per frame.
- PASS · Button names · `settings.js::makeButton`, `#applicationUpdate`, `#settingsDone`, `#dataActions`: generated/action controls use their visible fixture text as the accessible name; no icon-only generated button lacks a label.
- PASS · Focus order by DOM · `index.html #settingsClose → #accountActions → #applicationUpdate → #motionChoices → #feedbackToggle → #dataActions → #confirmDialog → #settingsDone`: the source order follows the visual task flow; when ST3 opens, header/content/footer are inert so focusable confirmation actions are isolated.
- PASS · Phone touch targets · `settings.css @media (max-width:760px) #accountActions button, #dataActions button, .settingsApplicationUpdateButton, .settingsAudioToggle, #confirmDialog button, .settingsFooter button`: all are explicitly min-height 44px; `#settingsClose` is min 44×44px and motion cards exceed 44px.
- N/A · Input font size · `index.html #settingsDialog`: Settings contains no `input`, `select` or `textarea`; all editable preferences are buttons/radio-button cards/switch controls, so the ≥16px text-input gate has no input element to test.
- PASS · No PNG master loaded · `index.html .settingsWordmark`, `.settingsPhonePlate`, and `ShowdownStage.mount`: title and portrait/stadium assets are `.webp`; no PNG path is referenced by the Settings page or `settings.js`.
- PASS · No live data in images · `settings.js::applyFrame` + `index.html .settingsWordmark/.settingsPhonePlate`: all mutable identity, app, preference and action values are DOM text/ARIA from fixtures; the loaded image assets are static stadium/title art with no names, scores, fees, timers or status values baked into them.
- PASS · Credit requirement · `settings.js::renderCredit` / `#photoCredit`: Settings repeats Tim Reckmann and CC BY 2.0 links and the cropped-display wording while loading no Reus photograph, matching the Settings-specific truth addition.
- NOTE · Native-confirm preview · `index.html #confirmDialog [data-confirm="cancel"]`: the explicit CANCEL control is a preview of the truth-defined native confirmation's cancel path, not a new product workflow; the destructive action still uses the truth-approved delete label.

## Fix list
