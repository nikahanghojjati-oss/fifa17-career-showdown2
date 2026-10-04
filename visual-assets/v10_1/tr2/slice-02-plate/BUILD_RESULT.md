# TW-PLATE-G: Transfer Window (F1) + Guess Entry on the locked plate, desktop and phone

Method: "paint the stage, place the live text" (Sol TW-RESET R2, S1–S7). Built by Claude (Opus 5.5), 2026-09-28.

## Run
```
cd visual-assets/v10_1/tr2/slice-02-plate
python3 -m http.server 8765
# open http://127.0.0.1:8765/index.html?frame=F1   (Window, Nik viewing; F1D = Daniel viewing)
#      ...?frame=F1R / F1DR                          (Window, own early-end request locked)
#      ...?frame=G2 / G3                             (Guess Entry, Nik / Daniel viewing)
#      ...?frame=S0 plate only · &grid=1 plate map · &freeze=1 stops the demo clock
# Phone layout: any portrait viewport up to 760 px wide (same URL)
NODE_PATH=$(npm root -g) node tools/render-qa.cjs http://127.0.0.1:8765/ evidence
```

## Plate
1. Source: `assets/src/ENV_TR2_PLATE_G_EDIT_V1.png`, Nik's ChatGPT edit. **Nik accepted its likeness (2026-09-28)**, so it is the likeness authority, and the restore against the 1536×864 original is retired for this plate.
2. Cleanup (`tools/lock_and_clean.py`) changes pixels only inside two approved edit zones:
   - sign screen: the baked `05:27` timer is removed; the "TRANSFER WINDOW" header is kept;
   - tall standing card: an AI face becomes empty dark glass.
   Lock proof: **0 px changed outside the zones**. The script reproduces the committed 1672 plate byte-for-byte.
3. DPR2: Lanczos ×2 plus edge-aware light sharpening (3344×1882). No model upscaler could run in the build session (package registries were blocked; OpenCV 4.13 can't load EDSR/FSRCNN). It can be swapped later; re-record the SHA.
4. SHA-256 values: see `../ASSET_LEDGER.md` and `platemap.json`.

## Live layer (DOM only, no CSS frames)
| Plate element | Live content |
| --- | --- |
| Sign screen | `WINDOW CLOSED` (#transferTimerDisplay) + `GUESS ENTRY` (#transferPhaseStatus, role=status) |
| Viewer's panel (A = Nik, under his finger; B = Daniel) | title bar: heading + PRIVATE. Body: 3 guess columns (type select, value input disabled until a type is chosen), privacy note, LOCK GUESSES |
| Rival panel | title bar: rival name + SEALED. Body: constant frost + CM17 seal (identical markup for both viewers, never reads rival data) |
| Rules card C | rule note |
| Painted script name of the viewer | YOU chip (the name itself is sr-only text) |
| Footer HUD bar | HOME · title · phase rail (Guesses active) · REFRESH |

All in-world sizes are plate px × k (k = world width / 1672). The camera is cover-fit, with a vertical bias that keeps the sign, both panels and the footer in view down to 1366×640.

## QA (evidence/qa_report.json; 9 shots)
- Strings: all match the approved S2 deck. `#transferPhaseIntro` is absent (S2: removed).
- Fit: 0 overflows and 0 clipped text in any panel, sign or card at 1366×768, 1366×640, 1440×900, 1920×1080 and @2x.
- Privacy: the sealed panel has 0 focusable elements. Only the viewer's own prefix IDs exist (G2 p1*, G3 p2*). Frost markup is identical G2↔G3 and unchanged by typing.
- Interaction: the type select enables the value input with a League/Nationality placeholder; clearing it re-disables the input, empties the value and restores `Pick a type first`.
- Tab order: guess 1–3 type → LOCK → HOME → REFRESH (= visual order, top to bottom).
- Layout: no page scroll; the footer clears the panels; the sign is in view (1366×640 offY = 44).
- Control sizes at 1366×768: controls 31 px, LOCK 33 px, control font 13.1 px, smallest text 12 px. At 1920×1080: 44/46 px.

## Known limits (see handoff)
- Desktop controls are 31 px at 1366 (the painted panel is 152 plate px tall). Mobile recomposition keeps the 44 px / 16 px rules.
- The sign board is tilted ~7°. The live sign text is screen-aligned per the fixed rule, so there is a slight mismatch.
- At 1366×640 the top ~14 px of the painted "TRANSFER" brush title is cropped.
- `guessHeadingDanielViewer` / `privacyNoteDanielViewer` mirror the approved Nik-viewer strings.

## R2 (owner look, Nik 2026-09-28 00:53 ET)
Nik: 3 guesses correct · readable · easy to use · finger on own panel with Daniel's sealed = YES. Finger touched the top of "signings"; "painted into glass" and the sign "can be better, don't overdo it".
- Nik's fingertip is cut from the plate (`assets/OVL_NIK_FINGERTIP_V1_{1672,3344}.png`, `tools/make_finger_overlay.py`) and layered above the live text, so the finger is in front of the glass. The heading is bottom-aligned in the title bar, clear of the fingertip (tip ends at y≈600; heading glyphs start below it).
- Glass integration: fields are recessed into the glass (inner shadow, hairline, lit bottom edge), live text emits a soft gold glow, and a faint constant scanline sheen covers the live panel body.
- Sign: `WINDOW CLOSED` now uses the painted lettering's gold gradient and glow.
- `tools/build_preview.py` + `tools/preview_template.html` rebuild the single-file claude.ai preview (inline CSS/JS/JSON; the iframe version rendered black in the artifact viewer).
- QA re-run: 0 fit or clip issues in 9 shots; frost identical G2↔G3; no page errors.

## R3: F1 Transfer Window + phone recomposition (Sol TW-PLATE-G R2 decisions, 2026-09-28)
Commit `85cb40b` (+ docs follow-up). No new images were generated. The only new raster is a crop of the locked plate.

### F1 on the plate (desktop)
| Plate element | Live content |
| --- | --- |
| Sign screen, rotated 7.5° to the board (TWG-S7: read-only text only) | `#transferTimerDisplay` (role=timer, live clock) + `#transferPhaseStatus` `WINDOW OPEN · BUILD YOUR SQUAD` on two lines |
| Viewer's panel (A = Nik, B = Daniel) | Title: own nameplate. Body: `Ends early only if you both agree.` + `END EARLY` |
| Rival panel | The same constant sealed frost + CM17 seal as Guess Entry (TWG-S10) |
| Rules card C | `15 MIN · 3 SIGNINGS · 3 GUESSES` as a stat row + the rule note |
| Footer HUD | Rail with Window active |

Wiring: `END EARLY` keeps production's id `#endTransferTimer`. Production's capture handler maps that id to `requestEndWindow` (`js/productionSharedTransferChallenge.js`). The prototype only emits a `transfer:intent` event and echoes the requested state: disabled, label `EARLY END REQUESTED ✓`, which is production's existing label.

The G frames' sign text (`WINDOW CLOSED` / `GUESS ENTRY`) is also rotated with the board.

### Short height (TWG-S11)
Below 700 px of viewport height:
- the HUD slims to 30 px;
- the HUD may overlap the panels' painted bottom glow, but never their glass content;
- the camera drops accordingly.

At 1366×640 the painted title loses **9 px** at the top (it was ~27 px). Shrinking the world instead would take panel controls under 31 px, which TWG-S6 forbids. That leaves this documented fallback.

### Phone (portrait ≤ 760 px, CSS media query; same DOM, ids and actions)
Top to bottom:
1. **Scene:** a crop of Plate G (plate x 396–1316, y 34–670). It keeps both managers, the sign with the live clock, and Nik's fingertip contact. No live UI covers faces or the fingertip.
2. **Status caption band** under the scene. The sign is too small for it at phone scale.
3. **Viewer's glass** with the YOU chip in its title.
4. **Sealed rival.**
5. **Rules card.**
6. **Fixed HUD:** HOME, title, rail (label shown on the active step only), REFRESH. The content scrolls inside the stage.

The glass is a 9-slice of the plate's own rules card C: `assets/DER_TR2_PLATE_G_GLASS_C_V1.png`, made byte-reproducibly by `tools/make_glass_slice.py` and recorded in the ledger.

On phone:
- Guess Entry puts one guess per row: type select + value input, 44 px tall, 16 px text;
- LOCK GUESSES and END EARLY are 48 px and full width.

### QA (`tools/render-qa.cjs` → `evidence/qa_report.json`): 29 shots, 0 failures
- **Desktop:** F1, F1D, F1R, F1DR, G2, G3 and S0 at 1366×768, 1366×640, 1440×900, 1920×1080, @2x and grid.
- **Phone:** F1, F1D, F1R, F1DR, G2 and G3 at 390×844, 375×667, 360×780 and 430×932.
- **Checks:**
  - approved strings per phase;
  - fit and control-text clipping;
  - sign lines don't collide;
  - rotation: the sign is at 7.5° and no interactive element is rotated;
  - privacy: the sealed panel has no focusable elements, its markup and size are identical across F1/F1R/G frames for each viewer and across both viewers, and it is unchanged after END EARLY or typing;
  - live UI never covers faces or the fingertip;
  - tab order with visible focus;
  - END EARLY emits exactly one `requestEndWindow` and disables itself;
  - the clock ticks;
  - desktop panel controls are at least 31 px;
  - phone targets are at least 44 px and inputs at least 16 px;
  - the fixed HUD doesn't overlap and the last content clears it;
  - no page scroll, and no page errors.
- **Measured:**
  - desktop F1 controls are 32.7 px at 1366 (38.3 at 1440, 45.9 at 1920);
  - the smallest text is 11.5 px (phone HUD title) and 12 px elsewhere.

### Review page
`tools/build_preview.py tools/preview_template.html <out.html> <sha>` builds a single-file page with a Desktop/Phone switch. It re-scopes the portrait CSS to `.stage.pv-mobile`, so the phone layout can be shown at 390×844 on any screen. Publish it together with `assets/`.

## R3.1: phone fits on one screen (owner note, Nik 2026-09-28 09:34 ET)
Nik: on phone, everything must fit on the screen with no scrolling to reach a button. Plate only must also work on phone.
- **Layout:** the live UI keeps its natural height, and the scene takes the rest (CSS flex). `plate.js` then picks the crop for that box:
  - zoom between 720 and 1300 plate px wide, centred at x 885;
  - prefer plate y 34–640 (sign → below the fingertip);
  - fall back to y 50–560 (sign, faces and hands) on very short screens;
  - never show past the plate's bottom.
- **Compaction:**
  - status + rules become a caption under the scene, with no card;
  - the sealed rival is one constant 64 px strip (name · seal · SEALED);
  - Guess Entry puts the privacy note beside LOCK;
  - the HUD is 56 px.
- **Plate only on phone:** shows the scene crop centred.
- **Sealed constancy:** the seal glow is fixed in px on phone, so the rival strip is pixel-identical in every phase.
- **Signage:** on phone, the sign's `WINDOW CLOSED` is scene-scale (8–12 px). The phase is carried by the `GUESS ENTRY` caption at 13 px.
- **QA:** 37 shots, 0 failures.
  - No scrolling at 390×664, 390×844, 430×740, 430×932, 360×640 and 375×667, in all F1 and Guess frames.
  - At 375×553 (iPhone SE browser) there is no scrolling either, and the primary button is visible. On Guess Entry the fingertip leaves the crop there.
  - Both faces and the sign are always inside the scene.

## R3.2: phone scene keeps both managers whole; no painted desktop panels (owner note, Nik 2026-09-28 09:56 ET)
Nik's notes:
- The phone Window crop cut Daniel in half.
- The painted desktop panels showing in the phone scene look like unused extras.

Fix:
- The phone crop never gets narrower than plate x 330–1390, so both managers stay whole on every screen.
- The plate is masked out before y 528, where the painted panels start.
- Spare height shows a dark, blurred extension of the same plate above the scene. No new art.
- The scene sits directly on the caption.
- Plate only on phone is centred.

QA adds `managersWhole` and `paintedPanelsHidden` checks. The fingertip is masked out on phone by design. Result: 37 shots, 0 failures, still with no scrolling at every phone size.

## Owner look: PASSED (Nik, 2026-09-28 10:06 ET)
"The pages are ok." F1 Window and Guess Entry are approved on desktop and phone, as of commit `d5e45d4`.

## R4: F3 Signing Entry + F4 Verdicts (Sol TWF decisions + F3/F4 brief R2, 2026-09-29)
Built by Claude (Opus 5.5), 2026-09-30, on top of `18db080` (F1 + Guess Entry owner PASS, untouched). Text only: no images generated, no player pictures. Strings = Sol brief §3–4 (production truth at main@2de2373). Clubs, player rows and guesses are fixtures; verdicts are fixture authority (`fixtures.json` → `results`), never computed in the visual layer.

Frames: `F3` / `F3D` (Signing Entry, Nik / Daniel viewing, editable) · `F3L` / `F3DL` (own signings locked, waiting) · `F4` / `F4D` (Verdicts) · `F4E` / `F4DE` (Verdicts, Daniel entered no signings).

| Surface | F3 Signing Entry | F4 Verdicts |
| --- | --- | --- |
| Sign (desktop, rotated 7.5°) | full status: `SIGNING ENTRY` in board lettering + `RECORD YOUR COMPLETED FIFA 17 TRANSFERS`; locked: `YOUR SIGNINGS ARE LOCKED · WAITING FOR YOUR RIVAL` | `SHARED TRANSFER CHALLENGE COMPLETE · VERDICTS REVEALED TO BOTH MANAGERS` (4 short lines) |
| Viewer glass | nameplate + PRIVATE; 3 rows × (Player name, Previous league, Nationality) with production ids (`p2Signing{i}*` Nik, `p1Signing{i}*` Daniel); privacy note + `LOCK MY SIGNINGS` (`#completeTransferChallenge`). Locked: rows read back as text, no button | `#transferResultsTwo/One`, heading `{MANAGER} · {CLUB}`, per signing: name, league · nationality, verdict `KEEP · NO RIVAL GUESS MATCH` (gold) or `RELEASE · MATCHED BY RIVAL GUESS` (ember); `No signings were entered.`; rival's guesses revealed read-only |
| Rival glass | the constant sealed panel (identical markup/size to F1/G) | revealed read-only verdict glass |
| Card C | `#transferPhaseLockSummary` (production lock summary) | rule note + disabled `SHARED SEASON RESULTS COMING NEXT` (`#continueFromTransfers`) |
| Phone | status in a 2-line caption band (TWF-S3), lock summary caption, 44 px / 16 px rows, sealed strip | own verdicts, rival verdicts, disabled continuation; rule note hidden on phone |

LOCK MY SIGNINGS validates like production (a partly filled row → `Complete signing {n} with player name, previous league and nationality.`) and otherwise emits one `transfer:intent` `lockSignings`.

Desktop: panel A's F3/F4 content uses the painted glass down to the inner frame line (`platemap.json` `signingContent` / `verdictContent`) so 3 rows + LOCK fit at 31 px (TWG-S6). In the short (<700 px) camera this lowers the view by ~4 px: at 1366×640 the painted title loses 13 px on F3 and 11 px on F4 (9 px on F1/G).

QA (`tools/render-qa.cjs` → `evidence/qa_report.json`): **81 shots, 0 failures** (37 carried F1/G + 44 new). New checks: F3/F4 strings, own-only private ids, signing validation + intent, placeholder/value clipping, board status fit, verdict text overlap, no fields in F4, verdict authority identical for both viewers (`verdictAuthorityShared`), sealed constancy now includes F3/F3L. Phone: no scroll at 390×664, 390×844, 430×740, 430×932, 360×640, 375×667; at 375×553 action visible (F3 has 3 px inner scroll there, F4 none).

### R4.1: gate pre-check follow-up (QA only, no visual change; 2026-09-30)
Closes the gaps in `F3_F4_GATE_PRECHECK_2026-09-30.md` (Sonnet 5.5):
- Tab order is asserted against `expectedTabOrder(frame)` on every shot (fail `tab order`), not only recorded.
- New shots: `F3L` and `F3DL` at 375×553, `F3DL` at 360×640 → **84 shots, 0 failures**; all three have no scroll and the locked glass in view.
- F4 revealed guesses asserted per card: heading `{Guesser} guesses {Owner}'s signings`, each `League|Nationality value`, no control inside the block.
- `tools/baseline-diff.cjs`: F1, F1D, F1R, F1DR, G2, G3, S0 rendered from `18db080` and from this head at 1366×768, 1366×640, 1920×1080, phone 390×664, 360×640, 375×553 → `evidence/baseline_diff_18db080.json`: **42/42 DOM identical and pixel identical**. The approved build itself is not raster-deterministic for G2 (two renders of `18db080` at 1366×640 once differed by 1006 px, at 360×640 by 66 px), so on a pixel diff the tool re-samples the baseline up to 4 times and passes only on an exact match with a sample; in the committed run no re-sample was needed.
- Phase-intro strings (§3/§4) remain unrendered by design (S2 deck); raised to GPT-5.6 Sol as TWF3-S4.

### JOB-049: polish to the key art (finished by Claude, 2026-10-03)
Steps 1-3 by GPT-5.6 Sol (shared Showdown token/type/UI sheets, cut-corner buttons, physical sealed dossier with clasp and wax seal, gold dust and lamp atmosphere, fingertip contact shadow, phone TRANSFER WAR wordmark). Gaps list: `evidence/polish/GAPS.md`.
Claude fixes after QA:
- The HUD footer (HOME + REFRESH) is kept; the worker had hidden it. Product truth hides the app's phone nav bar on Transfer War, not this screen's own controls.
- Desktop: the shared kit's 44 px minimum on `.sd-btn` / `.sd-input` / `.sd-select` is reset to 0 inside the plate, so the registered `calc(var(--k) * 38-40px)` heights stay and the G2/G3/F3 action row and error line fit their panels again.
- Phone: the wordmark sits out the verdict phase (no spare height with the footer back); on phones 600 px tall or less the timer is 18 px.

QA (`tools/render-qa.cjs` → `evidence/polish/qa/qa_report.json`, key shots beside it): **84 of 84 shots pass** (baseline 846a2fe: 84 of 84).


## JOB-050 · Phone polish

### Phone

The phone contract is CSS-only at the same URL: portrait viewports at or below 760 px use a locked `100dvh` stage with no page scroll. The phone-specific stadium and manager cut-outs fill the upper cinematic band; live status stays DOM text. The own surface comes first, the rival surface is a compact Sealed Dossier until reveal, and the frame's primary action is fixed to the bottom safe-area slot. HOME / REFRESH remain a 44 px screen HUD rail above that action; they are not the app bottom navigation hidden by V2G-003. No tabs or `.sd-sheet` are needed because F1–F4 are mutually exclusive phases.

Phone assets referenced by the build are `assets/ENV_TRANSFER_PHONE_V1.webp`, `assets/OVL_TRANSFER_DANIEL_PHONE_V1.webp`, and `assets/OVL_TRANSFER_NIK_PHONE_V1.webp`. The background is 233,908 bytes and the two cut-outs are budgeted at 60 KiB each, so the worst-case first-paint phone art is 356,788 bytes (348.43 KiB), below the 450 KB JOB-050 ceiling. Claude must run the existing `tools/MAKE_ASSETS.md` cut-out recipes if either overlay is absent and then use JOB-114's accepted phonemap placement when regenerating the proof.

#### Height budget

Method: read `plate.css` only, as required by step 5. The table counts the fixed/minimum screen reservations. The title/wordmark, own panel and compact rule/caption are auto-height flex content and therefore consume the residual column rather than pretending to have a CSS-fixed pixel height. There are no phone tabs. Safe-area insets are separately reserved by `env(safe-area-inset-*)`; values below show the CSS viewport budget before a device-specific inset is added.

| Viewport | Top pad | Hero min | Dossier min | Primary | HUD | Action gaps | Layout gaps | Fixed/min total | Residual for title + own panel + caption |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 393 × 660 | 4 | 112 | 52 | 48 | 44 | 12 | 20 | 292 | 368 |
| 360 × 640 | 4 | 112 | 52 | 48 | 44 | 12 | 20 | 292 | 348 |
| 375 × 553 | 4 | 112 | 52 | 44 | 44 | 8 | 20 | 284 | 269 |
| 390 × 844 | 4 | 262 | 56 | 48 | 44 | 12 | 32 | 458 | 386 |
| 430 × 932 | 4 | 289 | 56 | 48 | 44 | 12 | 32 | 485 | 447 |

At the 375 × 553 floor the primary action is independent of document flow: `--phone-action-h: 44px`, `--phone-action-gap: 4px`, fixed at `bottom: max(env(safe-area-inset-bottom), 4px)`. The 44 px HUD is fixed immediately above it. Thus the action remains visible even while the residual 269 px is allocated among the wordmark, own surface and compact caption. F4 removes the sealed-dossier minimum and uses two compact verdict surfaces; its short-height rule lowers the completed hero minimum to 104 px, giving 8 px more content room than the conservative floor shown above.

At 390 × 844 and 430 × 932 the hero minimum itself grows from `31svh` (262/289 px) and can flex upward toward `56svh`; the additional viewport height therefore grows the composition rather than leaving the content floating in a fixed short-phone stack.


#### Final read check

- H1 / manager order: PASS. Runtime phone CSS places Daniel at 22% left and Nik at 78% right, both at 58svh with 1.5svh top, matching JOB-114's final accepted separation while keeping both faces in their own thirds.
- H5 / phone fit by reading: PASS. `.stage` and `.world` are locked to `100dvh` with `overflow: hidden`; the arithmetic table above is nonnegative at 393×660, 360×640 and 375×553, and larger phones add residual/hero space.
- H6 / input legibility: PASS. Guess and signing inputs are `min-height: 44px` with `font-size: 16px` in the phone media query.
- Touch targets: PASS. Primary frame actions and HOME / REFRESH are at least 44px; the primary action is fixed inside the safe-area slot.
- Asset loading: PASS. `index.html` loads the phone background and both manager overlays as WebP through `<picture>`; no PNG master is referenced by the phone hero markup.
- Phone content policy: own content stays first; the sealed rival dossier follows until reveal; F4 rule prose is omitted on short phone layouts; no extra tabs or sheets were invented.

## Fix round

JOB-052 / JOB-143 / JOB-144 close the Transfer War review fix list.

- Item 1 — DONE in JOB-052: `plate.js · buildFooter() / #transferChallengeTitle` now binds the season token to `String(fx.seasonNumber)` instead of hardcoding Season 1.
- Item 2 — DONE in JOB-052: `index.html · before #stage-root` mounts the shared locked desktop top navigation with HOME / CAREER / STANDINGS / STATS / RULES plus Settings; Transfer War keeps the app navigation hidden on phone.
- Item 3 — no review item exists.
- Items 4–6 — no review items exist; JOB-143 made no screen-file changes.
- Items 7–9 — no review items exist; JOB-144 made no screen-file changes.
- Blocked items — none.

Claude re-measure at intake: H5 phone fit at 393 × 660 and 360 × 640 plus primary-action visibility at 375 × 553; H6 contrast/input size; H7 reduced motion; H8 keyboard/focus; H9 console and failed requests; H10 mockup diff; H11 first-paint/network weight. Also re-check the carried 1366 × 640 desktop title-top crop after the locked 52 px navigation was mounted.



## Motion · JOB-053 part 1

The Transfer War uses the shared pack-rip entrance without changing layout, privacy, or the locked plate. The shared runtime owns all timing and reduced-motion behavior; this screen only declares roles.

| Order | Moment | Target selector | Shared role | Target timing |
| --- | --- | --- | --- | --- |
| 1 | Stadium / locked Transfer War scene | `.phone-hero-art`, `.scene` | `scene` | 0–400 ms |
| 2 | Daniel portrait enters from the left on portrait layouts | `.phone-hero-daniel` | `character-left` | 150–600 ms |
| 3 | Nik portrait enters from the right on portrait layouts | `.phone-hero-nik` | `character-right` | 150–600 ms |
| 4 | TRANSFER WAR wordmark wipe + one glint | `.transfer-wordmark` | `title` | 250–700 ms |
| 5 | In-world sign readout | `.sign-screen` | `panel` | from 400 ms |
| 6 | Phase/status caption | `#transferPhaseStatus` | `panel` | +60 ms stagger |
| 7 | Manager glass panels, kept in stable DOM/spatial order | `.panel` | `panel` | +60 ms each |
| 8 | Rules card | `.rules-card` | `panel` | next +60 ms |
| 9 | Footer HUD / phase rail | `.hud-footer` | `panel` | next +60 ms |
| 10 | Current primary action payoff | `#endTransferTimer`, `#completeTransferChallenge`, or `#continueFromTransfers` | `button` | 760–1080 ms |

Screen-specific rule for this part: the sealed rival panel may move only as a constant sealed surface; its contents never change or hint at rival progress. No additional reveal/count-up/burst moment is listed in JOB-053 part 1, so none is invented here. Desktop manager likeness is baked into the locked plate and therefore rides with the scene; the separate left/right character roles apply to the existing portrait cut-outs only.

The shared kit assigns panel `--i` values at runtime, caps the stagger after the sixth panel, keeps useful controls available by 600 ms, cleans up by 1.2 s, and collapses the choreography to a 150 ms fade when either reduced-motion source is active.

Evidence target for Claude intake: `evidence/motion/` frame strips covering normal and reduced-motion entrances.


## Motion · JOB-145 part 2

Transfer War now has three signature action/reveal moments on top of JOB-053's shared entrance. All durations and easing live in the `SIGNATURE_MOTION` constant in `plate.js`; the effects are presentation-only and never delay, rewrite or infer private product state.

| Moment | Trigger / target | Timeline | Easing / shared primitive |
| --- | --- | --- | --- |
| Window clock hand | Each displayed second while `WINDOW_OPEN`; decorative hand beside `#transferTimerDisplay` | 260 ms tick/pulse each second | `cubic-bezier(.22,1,.36,1)`; transform + opacity only |
| Guess into dossier | Click on Guess Entry `#completeTransferChallenge`; data-free card flies from own panel to the constant sealed rival dossier | 0–480 ms card travel; 480–840 ms wax stamp | travel `cubic-bezier(.65,0,.35,1)`; stamp reuses shared `sd-slam-in` keyframe at 360 ms |
| Verdict anticipation | F4/F4D/F4E/F4DE dossier cover | 0–810 ms | shared `sdReveal` |
| Seal crack + page fan | F4 dossier cover | crack starts 170 ms for 260 ms; pages fan from 170 ms for 360 ms | `cubic-bezier(.22,1,.36,1)`; transform + opacity only |
| Verdict brush wipe + row markers | `.vr-verdict` and decorative 01/02/03 markers | begins 430 ms; wipe 420 ms with ≤275 ms stagger; count-up 280 ms with ≤225 ms stagger | shared `sd-title-wipe-cover` keyframe + `sdCountUp` |
| Successful-guess payoff | First revealed `RELEASE` verdict, after both sides are public | 700–1120 ms | shared `sdBurst`, 42 particles, 420 ms |
| Reduced motion | Either app reduced-motion flag or `prefers-reduced-motion` | 150 ms fade only; clock hand stays static; no card flight or particle burst | shared reduced-motion contract |

DEFAULT: Transfer War has no recorded overall winner in product truth. The burst therefore marks the first revealed `RELEASE` row, which is an already-authoritative successful rival guess; it never invents or stores an overall Transfer War winner. Frames with no `RELEASE` verdict get no burst.

Privacy / logic guard: the travelling guess card contains no values or text, the sealed rival DOM remains constant, rival guesses appear only in the existing COMPLETED verdict state, and the real timer stays DOM text. The click handler does not prevent, await or replace the product action. Verdict rows still render provider-authoritative results only.

Timing ceiling: the latest normal-motion endpoint is the final staggered verdict wipe at about 1.125 s; the burst ends at 1.120 s. This stays under the 1.2 s Criterion 8 ceiling. Shared entrance usability and cleanup remain owned by JOB-053's motion kit.

Evidence target for Claude intake: `evidence/motion/` frame strips for the clock pulse, guess-to-dossier + stamp, normal verdict reveal, and reduced-motion verdict reveal. Per the factory handbook, Claude records these binary frames at intake.
