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

## Fix list
