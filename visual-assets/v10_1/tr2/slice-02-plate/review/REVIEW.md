# Transfer War Review · Parts 1–3 of 4

## Verdict

## Scorecard

| Criterion | Score | Evidence |
| --- | ---: | --- |
| 1. Mockup fidelity | 4/5 | Desktop keeps the Plate G scene registration and character placement intact while putting product-required live content into the three glass regions; the added HUD rail and missing truth-required desktop top bar keep it short of an indistinguishable match. |
| 2. Characters stand out of the menu | 4/5 | Daniel and Nik remain plate-owned on desktop, phone uses dedicated hero cut-outs, and Nik has a separate fingertip overlay above the UI, giving the source the correct plate → panels → character-overlap architecture even though seam/rim quality is not runtime-measured here. |
| 3. Hands and contact | 4/5 | Plate G preserves the approved hands and the explicit Nik fingertip overlay places the pointing contact above the centre UI; no audited selector inserts a panel through either manager's hands, while pixel-edge quality still awaits Claude's render check. |
| 4. Lighting and grade | 4/5 | The gold/black stadium grade and painted glass lighting stay in the approved Plate G art and the audited source adds no competing flat scene treatment; final colour drift and edge-light polish are not measured in this source-only review. |
| 5. Typography and title treatment | 4/5 | Desktop preserves the brush “TRANSFER WAR” treatment in the plate and phone uses a dedicated wordmark while live UI copy remains DOM text in the Showdown type system; the title implementation is coherent but not visually remeasured here. |
| 6. Panel craft | 4/5 | The three Plate G glass zones remain the visual surfaces, with live product UI layered into them, one solid-gold lock action and dark gold-outline secondary actions; the source avoids generic replacement cards and keeps panel ownership aligned. |
| 7. Information clarity and honesty | 3/5 | Rival inputs stay sealed until reveal and only real Transfer War data/actions are shown, but #transferChallengeTitle hardcodes Season 1 and this slice omits the truth-required locked desktop top navigation, creating two visible honesty/navigation defects. |
| 9. Phone composition | 4/5 | Phone has a separate composition with Daniel left, Nik right, dedicated hero cut-outs, a recentred wordmark and a bottom-pinned action rail rather than a squeezed desktop; exact no-scroll/primary-action fit remains a Claude-measured gate. |
| 10. Polish and finish | 3/5 | WebP-first picture sources, accessible controls and consistent shared classes are present, but the hardcoded season title and missing desktop top bar leave obvious production-finish work, and console/network/render polish is not yet measured. |

Static-review average: **3.78 / 5** across criteria 1–7, 9 and 10.  
Pass line: **FAIL** — average is below 4.2, and H5–H11 are not yet measured PASS.

## Hard gates

| Gate | Result | Evidence |
| --- | --- | --- |
| H1 · Daniel left, Nik right, never mirrored | PASS | The code audit binds playerOne/Daniel to left panel B and playerTwo/Nik to right panel A; the plate is never mirrored, and phone cut-outs keep Daniel left and Nik right. |
| H2 · rights-safe imagery | PASS | The audited renderer introduces only Daniel/Nik, the original Transfer War plate, decorative title art and Nik fingertip overlay; no real crest, league logo, trophy, player or EA/FIFA art is introduced. |
| H3 · no live/private data baked into images | PASS | Timer, names, clubs, guesses, signings, verdicts and status copy are DOM; rival guesses/signings stay sealed before reveal. |
| H4 · product truth | PASS | Every exposed action maps to a Transfer War product hook, the screen shows only Transfer War records/verdicts, and no editable/computed season-score UI is invented. The separate hardcoded season-title defect is listed for correction below. |
| H5 · phone fit | NOT MEASURED (Claude measures) | 393 × 660 scroll, 360 × 640 scroll and 375 × 553 primary-action visibility have no published per-size Claude measurements yet; the carried 84/84 runtime note is aggregate only. |
| H6 · input size / contrast | NOT MEASURED (Claude measures) | JOB-050 carries the ≥44 px touch-target and 16 px input-text implementation contract, but no Claude contrast ratio is published. |
| H7 · reduced motion | NOT MEASURED (Claude measures) | No Claude reduced-motion measurement is present in the Evidence section. |
| H8 · keyboard / focus | NOT MEASURED (Claude measures) | No Claude Tab-through/focus-ring measurement is present in the Evidence section. |
| H9 · console / failed requests | NOT MEASURED (Claude measures) | No Claude browser-log measurement is present in the Evidence section. |
| H10 · mockup diff | NOT MEASURED (Claude measures) | No Claude mockup-diff scores are present; the named scores.json was absent during the carried review. |
| H11 · first-paint weight | NOT MEASURED (Claude measures) | JOB-050 carries a worker-side phone-hero worst case of 356,788 bytes, but no Claude network-log measurement is present, so it is not promoted to a gate result. |

## Evidence

Source inspection for this part is limited to the files named by JOB-051. No browser QA, screenshots, mockup-diff run or remeasurement was performed in this chat.

| Gate | Carried evidence | Source |
| --- | --- | --- |
| H5 · phone fit | 393 × 660 scroll: NOT MEASURED (Claude measures). 360 × 640 scroll: NOT MEASURED (Claude measures). 375 × 553 primary-action visibility: NOT MEASURED (Claude measures). Claude's prior runtime note reports the overall Transfer War QA suite at 84/84, but it does not publish the requested per-size scroll/button numbers. | `project-documents/factory/status/JOB-049.md` |
| H6 · input size / contrast | Contrast: NOT MEASURED (Claude measures). JOB-050 records ≥44 px touched inputs/buttons and 16 px input text as the implementation contract, but no Claude contrast ratio is present. | `project-documents/factory/status/JOB-050.md` |
| H7 · reduced motion | NOT MEASURED (Claude measures). | `visual-assets/v10_1/tr2/slice-02-plate/evidence/QA_SUMMARY.md` — file absent on the reviewed branch |
| H8 · keyboard / focus | NOT MEASURED (Claude measures). | `visual-assets/v10_1/tr2/slice-02-plate/evidence/QA_SUMMARY.md` — file absent on the reviewed branch |
| H9 · console / failed requests | NOT MEASURED (Claude measures). | `visual-assets/v10_1/tr2/slice-02-plate/evidence/QA_SUMMARY.md` — file absent on the reviewed branch |
| H10 · mockup diff | NOT MEASURED (Claude measures). `scores.json` is not present at the path named by JOB-051. | `visual-assets/v10_1/tr2/slice-02-plate/evidence/scores.json` — file absent on the reviewed branch |
| H11 · first-paint weight | NOT MEASURED (Claude measures). JOB-050 records a worker-side phone-hero worst case of 356,788 bytes (348.43 KiB), but no Claude network-log measurement is present, so that number is not promoted to an H11 gate result. | `project-documents/factory/status/JOB-050.md` |

Additional carried Claude evidence: `project-documents/factory/status/JOB-049.md` records “Runtime QA 84 of 84 on a real server; HUD footer kept; desktop and phone fit.” This is retained as aggregate evidence only; it is not substituted for the missing per-gate measurements required above.


### Mockup differences

Reference geometry below is measured from the 1672 × 941 Plate G mockup. This part is source-reading only: the named HTML/CSS do not publish per-panel desktop `--x/--y/--w/--h` values, so where the desktop art is plate-owned the code value is the registration method rather than an invented coordinate.

- Title block — mockup value: brush “TRANSFER WAR” occupies about x 2–24%, y 3–21%, with the tagline directly below around x 6–19%, y 21–30%; code value: desktop `.transfer-wordmark` is `display:none` and the title is therefore plate-owned, while portrait phone intentionally recentres a live wordmark at `min(68vw, 286px)` (54vw/220px on short phones), so phone title placement is not the mockup’s left-side composition.
- Hanging transfer sign — mockup value: sign occupies about x 42–57%, y 3–18% and reads “TRANSFER WINDOW”; code value: the painted sign remains in the plate but `.sign-screen` / `.sign-status` overlay live state text, including open/closed/timer/status variants, so its words change by Transfer War state instead of remaining the mockup’s static label.
- Panel B, left large glass — mockup value: blank painted glass around x 18–42%, y 55–82%; code value: `platemap.json` owns it as `playerOne` / Daniel and `plate.js` uses it for Daniel's own or verdict content, so blank mockup space becomes interactive product UI without changing Daniel's left-side ownership.
- Panel A, centre-right large glass — mockup value: blank painted glass around x 50–74%, y 62–84%; code value: `platemap.json` owns it as `playerTwo` / Nik and `plate.js` uses it for Nik's own, sealed-rival or verdict content; `.panel.sealed` adds frost and a seal before reveal, an intentional truth-driven privacy state absent from the static mockup.
- Panel C, right small glass — mockup value: blank painted glass around x 76–90%, y 58–76%; code value: the region becomes the rules/summary/continuation panel, so the build adds live explanatory text and state-dependent continuation controls that the mockup does not show.
- Own-panel primary button — mockup value: no button is drawn inside the blank glasses; code value: `.btn-lock` is a solid-gold primary action inside the own panel, 40 plate px high on desktop and at least 44 px on phone, matching the product need to lock guesses/signings rather than the mockup’s empty state.
- Transfer-window action button — mockup value: no action button; code value: `.btn-end` is a dark gold-outlined secondary action, 40 plate px high on desktop and fixed full-width near the phone bottom, adding a real control not represented in Plate G.
- Continuation button — mockup value: no continuation control; code value: `.btn-continue` occupies the rules card at full width and is visually disabled until its state allows continuation, adding state feedback absent from the mockup.
- HUD HOME/REFRESH controls — mockup value: no screen-aligned footer or hint buttons; code value: `.hud-footer` overlays a 36 px desktop rail and a 44 px phone rail with screen controls, so the build deliberately covers part of the desk edge that is pure scenery in Plate G.
- Daniel manager area — mockup value: Daniel occupies the left hero zone at roughly x 11–45%, y 5–60%, with face and hands fully visible; code value: desktop Daniel is not independently moved by CSS because he is part of the full-plate image, while phone uses a separate Daniel cut-out at `left:22%`, `top:1.5svh`, `height:58svh`; left-side ownership remains correct.
- Nik manager area — mockup value: Nik occupies the right hero zone at roughly x 48–80%, y 6–63%, with the pointing hand crossing into the centre glass area; code value: desktop Nik is plate-owned, while phone uses a separate cut-out at `left:78%`, `top:1.5svh`, `height:58svh`; right-side ownership remains correct and is not mirrored.
- Manager name/tag areas — mockup value: decorative Daniel script/tag sits left of Daniel and Nik script/tag sits right of Nik; code value: desktop keeps those marks in the plate rather than rebuilding them as live data, so they stay decorative and do not become private/live values.
- Rival privacy state — mockup value: all three glasses are visually open/blank and reveal no state; code value: `.panel.sealed` adds a physical frost/seal treatment and keeps rival inputs concealed until reveal, which differs visually from the mockup but is required by PRODUCT_TRUTH privacy.
- Desktop top navigation — mockup value: Plate G is full-bleed and has no app top bar; truth value: desktop hub chrome requires a 52 px HOME / CAREER / STANDINGS / STATS / RULES bar plus Settings, locked with “Finish this step first” during Transfer War; code value: the named `index.html` contains only `#stage-root` and no top-bar DOM, so this source slice does not itself satisfy that desktop truth requirement.
- Rights/data treatment — mockup value: only Daniel, Nik, original CM17/crown decoration and empty glasses are visible; code value: the named HTML/CSS add no real club crest, league logo, trophy or player image, and live names/guesses/signings are DOM content rather than image pixels, so the source keeps the mockup’s rights-safe art while moving mutable data out of imagery.

### Code audit

Part 3 is a source audit against `TRUTH.md`, `fixtures.json`, `plate.js`, and the plate ownership coordinates in `platemap.json`. No browser measurements were added; runtime-only gates remain for Claude.

- PASS — manager ownership and side order — `plate.js · render() / [data-panel="B"] / [data-panel="A"]`: playerOne/Daniel is bound to panel B and playerTwo/Nik to panel A; `platemap.json · panels.B.owner / panels.A.owner` places B at x 296–700 on the left and A at x 842–1232 on the right, and the character plate itself is never mirrored.
- PASS — viewer frames do not swap identities — `plate.js · render() / buildVerdictPanel()`: Nik-view frames use panel A for playerTwo and Daniel-view frames use panel B for playerOne; completed frames bind `#transferResultsOne` to Daniel/playerOne and `#transferResultsTwo` to Nik/playerTwo.
- PASS — only product controls are exposed — `plate.js · #endTransferTimer / #completeTransferChallenge / #continueFromTransfers / #backToShowdownHome / #refreshSharedTransferChallenge`: every button corresponds to a hook named by Transfer War truth or the truth-preserved screen footer; no mockup-only action was invented.
- PASS — no invented recorded statistics — `plate.js · .transferRulesLine / .verdict-rows / .guess-reveal`: the UI shows challenge rules, the three signing/guess slots, and provider verdicts only; it does not introduce career stats, match results, clean sheets, totals, or other unrecorded data.
- PASS — rival privacy is constant before reveal — `plate.js · buildSealedPanel() / .panel.sealed`: the sealed rival panel receives only the rival name, SEALED chip and decorative seal and never reads rival guesses, signings, lock progress or verdict data before `COMPLETED`.
- PASS — empty-state wording is honest for the states this screen owns — `plate.js · buildVerdictPanel() / .verdict-empty`: F4E/F4DE render `S.verdictEmpty` only for an empty verdict list; `TRUTH.md · Data contract` explicitly says Transfer War has no career-history loading/partial/unavailable states, so those history states do not apply here.
- FAIL — one changing value bypasses fixtures — `plate.js · buildFooter() / #transferChallengeTitle`: the title uses `S.title.replace("{season}", "1")` instead of `fixtures.json.seasonNumber`, so seasons after Season 1 would show the wrong live season number even though the fixture provides the changing value.
- PASS — visible mutable Transfer War words otherwise come from fixtures — `plate.js · buildStatus() / buildGuessPanel() / buildSigningPanel() / buildVerdictPanel() / buildRulesCard()`: phase copy, privacy copy, buttons, verdict text, clubs, signing values and guesses are read from `S` or `fx` rather than baked into the plate.
- PASS — accessible names are present — `plate.js · #transferTimerDisplay / #transferPhaseStatus / .sd-select / .sd-input / .panel.sealed / #transferPhaseNavigator`: timer/status roles, labelled form controls, labelled sections and the progress-rail aria label are explicitly created; decorative wordmark and fingertip imagery are hidden from assistive technology.
- PASS — focus order is coherent in source — `plate.js · render() / buildGuessColumn() / buildSigningPanel() / buildRulesCard() / buildFooter()`: the sealed panel has no focusable descendants; editable own-panel fields/actions precede the shared continuation control, and HOME then REFRESH follow in the footer, with no hidden rival inputs inserted into the tab sequence.
- PASS with carried size evidence — `plate.js · .sd-select / .sd-input / .sd-btn`: all interactive fields use the shared input/button classes; Part 1–2 evidence records the job-050 phone contract of touch targets ≥44 px and input text 16 px. Runtime pixel measurement remains a Claude gate rather than a new claim in this source-only part.
- PASS by source selection, runtime still unmeasured — `plate.js · picture.plate`: AVIF and WebP `source` elements precede the PNG fallback, and the explicit `webpOnly` path uses WebP; whether a PNG fallback request occurred is a network-log H11 check for Claude.
- PASS — live/private data is not image-baked — `plate.js · picture.plate / .transfer-wordmark / .overlay-fingertip`: images are the static environment, decorative title and Nik fingertip overlay, while timer, names, clubs, guesses, signings, verdicts and status text are DOM; no real crest, league logo, trophy or player photo is introduced by this renderer.

## Fix list
