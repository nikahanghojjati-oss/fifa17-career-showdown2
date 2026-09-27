# CLAUDE -> SOL HANDOFF - CLOUD-SV01-01
SV01 Transfer Guess Entry: V10.1 C2 Decision Desk provisional build (ASTRA_CONSTRAINED, provisional)

## Header
- **Task ID:** CLOUD-SV01-01
- **Executor:** Claude Code Cloud Session. Claude is the model; Cloud Session is the hosted execution environment.
- **Role:** technical executor for the provisional build. Not a taste authority. Does not self-promote this build to golden frame.
- **Date:** 2026-09-27
- **Source anchor:** `main@f077b9c5be5e4d5bf5ef17b2d219983dbf142962`, re-resolved live. **SOURCE_DRIFT: no.**
- **Visual authority:** `visual/cinematic-system-v10@ddb5a2544e9680cbc3194a55f797c3c8fc9cf6d5`
- **Task branch:** `claude-cloud/sv01-v10-1-c2-provisional-build`
  - base `adc13cf` (hard asset gate)
  - `4c1f33a` asset import
  - `43572fd` candidate + QA
  - this handoff in the following commit
- **Write operations:**
  - repo: task branch only, under `visual-assets/v10_1/cloud-session/`;
  - images: none generated;
  - production source: none changed (`git diff adc13cf -- js css index.html data` is empty);
  - no merge, no PR.
- **Verdict status:** `PROVISIONAL_ASTRA_REVIEW_PENDING`
- **Files read:**
  - task file
  - `V10_STATE.md`, `V10_NEXT.md`
  - `SHOWDOWN_VISUAL_V10_1_CINEMATIC_AUTHORITY.md`, `SV01_C2_DECISION_DESK_SPEC.md`, `SV01_C2_BLOCKING_ADDENDUM.md`
  - `SV01_TRANSFER_GUESS_PRODUCT_TRUTH_CARD_V10.md`, `ASSET_REGISTRY_V1.json`
  - `js/productionSharedTransferChallenge.js`, `js/transferChallenge.js`, `index.html` (`#transferChallenge`), `data/transferOptions.js`
- **Images inspected:**
  - `POSE_TRANSFER_DANIEL_FOCUSED_V1.png` (1122×1402 RGBA)
  - `POSE_TRANSFER_NIK_TACTICAL_V1.png` (1122×1402 RGBA)
  - `ENV_STADIUM_WARM_BASE_V1.webp` (1536×864)
  - `sv01-v10-desktop-final.png` (1366×768)
  - `sv01-v10-mobile-final.png` (390×844)

## Work performed
1. **Asset gate.** The approved binaries were not in any repo branch. The build stopped before any candidate was written (no placeholder file was ever created or committed). After the owner supplied `SV01_CLOUD_SESSION_EXACT_ASSET_IMPORT.zip`, all 6 files were verified against `SHA256_MANIFEST.json` (bytes + SHA-256) and committed unchanged to `visual-assets/v10_1/cloud-session/assets/` (`4c1f33a`).
2. **Candidate.** `visual-assets/v10_1/cloud-session/candidate/SV01_C2_PROVISIONAL_CANDIDATE.html`
   - **SHA-256 `f1a5a27dd65e83bf5cef946111cd9ee3e18bbc3585ca22514411fd1c45c7462b`**
   - Browser-openable from the repo checkout. It loads the three approved assets by relative path.
   - States via `?state=`: `nik-editable` (primary), `nik-one-row`, `daniel-editable`, `nik-locked`, `replay`, `error`, `busy`.
3. **QA tooling.** `candidate/tools/render-and-qa.cjs` (Playwright, Chromium 1194). **159/159 checks pass.** Output is in `candidate/evidence/qa-results.json`.
4. **Evidence rendered in this Cloud Session** (real browser renders, DPR 1): 19 PNGs in `candidate/evidence/`.
   - Every state at 1366×768 and 390×844.
   - Mobile full page.
   - Baseline-vs-candidate at matching viewport, desktop and mobile.
   - 8 px squint blur.
   - Grayscale still frame.
5. **Report.** Full build/QA report: `candidate/SV01_C2_PROVISIONAL_BUILD_REPORT.md`.

**Not done:**
- No Astra or Nik review. Reviewing is outside this build task.
- No motion or parallax (the static frame is the gate).
- Combobox search is not loaded (see L6).
- Promo-credit burn was not visible from inside the session. Nik should check the balance.

## 1. Verdict
`PROVISIONAL_ASTRA_REVIEW_PENDING`: one coherent candidate that implements the C2 blocking addendum.

Every measurable M1–M7 / R1–R7 anchor passes the automated checks:
- horizon y 330;
- VP (700, 330);
- eye delta 0 px;
- heads 124.1 / 120.6 px (ratio 1.029);
- display x 560–1320 (UI share 55.6%);
- Nik tablet gap 39.3 px;
- mobile heads 78 / 76 px, task start y 251.

The main residual risks are asset-intrinsic: the baked warm halo on both poses, and the stadium plate's short pitch band. Both are handled with room design, not asset edits. Owner comparison against the exact 7/10 baseline is prepared, and Nik's judgment overrides every number here.

## 2. Sol decision table
| ID | Finding | Severity | Product-truth risk | Resolver | Confidence | Sol decision |
|---|---|---|---|---|---|---|
| CLOUD-SV01-01-M1 | Production shows an inert `00:00` timer and the `15 MINUTES · MAX 3 SIGNINGS EACH · 3 OPPONENT GUESSES` line during GUESS_ENTRY. The candidate omits both. | Must confirm | MEDIUM | Sol | High | |
| CLOUD-SV01-01-M2 | Production renders validation failures as the code `TRANSFER_GUESSES_INVALID`, not the human message. The candidate reproduces this faithfully. | Must confirm | LOW | Sol | High | |
| CLOUD-SV01-01-R1 | `REFRESH SHARED CHALLENGE` moved to the display header (production appends it after the timer actions). | Refine | LOW | Sol | High | |
| CLOUD-SV01-01-R2 | Baked warm halo on both poses, reduced only by a shared filter. | Refine | NONE | Astra / Nik | High | |
| CLOUD-SV01-01-R3 | Stadium plate's lower band (wet track, black/gold fabric corners) hidden behind frosted lower glass under a low transom. | Refine | NONE | Astra | Medium | |
| CLOUD-SV01-01-R4 | Console front face (y 655–768) is a large dark band. | Refine | NONE | Astra / Nik | Medium | |
| CLOUD-SV01-01-R5 | On mobile, REFRESH under the title pushes the rail down about 54 px. Rail label "01 Transfer Window" wraps to 3 lines. | Refine | NONE | Sol | High | |
| CLOUD-SV01-01-R6 | Nik's sleeve overlaps the corner of Daniel's clipboard. Daniel's left shoulder is cropped by the frame edge. | Refine | NONE | Astra | Medium | |

## 3. MUST FIX
**CLOUD-SV01-01-M1: inert timer and rules line in GUESS_ENTRY**
- **Observation:** `index.html` `.transferHero` contains `<div id="transferTimerDisplay" class="transferTimer" role="timer">` and `<p class="transferRulesLine">15 MINUTES · MAX 3 SIGNINGS EACH · 3 OPPONENT GUESSES</p>`. In GUESS_ENTRY, `pstcRenderTimer` sets the text to `"00:00"` (state exists, phase is not WINDOW_OPEN). Nothing hides the hero in that phase.
- **Evidence:** `js/productionSharedTransferChallenge.js`, `pstcRenderTimer`: `if(!state||state.phase!=="WINDOW_OPEN"){timer.textContent=state?"00:00":"15:00";return;}`
- **Proposed delta:** keep the candidate's omission as presentation, and confirm that "No active 15-minute timer in Guess Entry" covers hiding the inert element and the rules line in this phase. The rule note (`A guess is either a league or nationality…`) is kept.
- **Product-truth impact:** MEDIUM. It is display-only, but it differs from what production shows.
- **Resolver:** Sol. **Confidence:** High.

**CLOUD-SV01-01-M2: error copy is the code**
- **Observation:**
  1. `pstcHandleAction` calls `pstcBuildGuesses`, which throws via `pstcFail("TRANSFER_GUESSES_INVALID","Complete guess N with a FIFA 17 league or nationality.")`.
  2. `pstcCapture` catches the error and calls `pstcSetError(error.code||error.message||…)`.
  3. So the user sees `TRANSFER_GUESSES_INVALID`.
- **Proposed delta:** none in this visual build. The candidate shows the code as production does. If a human-readable error is wanted, that is a separate product ticket.
- **Product-truth impact:** LOW. **Resolver:** Sol. **Confidence:** High.

## 4. SHOULD REFINE
- **R1:**
  - REFRESH now sits beside the title as a 36 px utility button, which frees the action row for the privacy note beside LOCK MY GUESSES.
  - Same id, same copy, same disabled rules: busy or replay.
- **R2:**
  - Both PNGs carry a baked golden rim, strongest on Daniel's hair. It is mitigated with one shared filter (`saturate(.86) brightness(.95) contrast(1.03)`) plus a soft-light overlay (cool from the left, warm from the right).
  - The luminance and squint checks still pass: LOCK fill 172.3 vs stadium max 124.1, and the squint peak falls inside LOCK.
  - A clean fix requires an owner-authorized asset revision.
- **R3:**
  - Plate mapping: scale 1.0; plate row 685 (pitch far edge, placed by eye) → y 330; plate centre x 768 → x 700.
  - The plate has only about 75 px of pitch, so a pitch-level room would otherwise show the wet track and fabric corners through the glass.
  - The fix is a low transom at y 398–408 with acid-etched frosted glass below it: the same plate, `blur(7px)`, darkened. The managers' bodies cover most of it.
- **R4:** reviewers may read the dark front face of the standing console as empty. It could be reduced by lowering the console, but M2 fixes the top edge at about 600–660.
- **R5:** mobile tidy-ups (utility row placement, rail label wrapping). They do not affect the M7 anchors.
- **R6:** Nik's face renders larger, so he is layered in front. Nudging Daniel further left would crop more shoulder.

## 5. Already strong (keep)
- The characters' natural screen-right gazes need no mirroring. Each manager looks down at his own device: clipboard for Daniel, tablet for Nik, with no readable device content. Neither gaze ends on the display, which gives parallel private work (M3).
- Both eyes sit exactly on the horizon at y 330 on desktop and y 148 on mobile.
- The glass is directly behind both silhouettes. The zone behind the display is dark and low contrast (max luminance within 48 px of the display edge: 47.5).
- The camera-facing monitor has a neck, a VP-converging foot and a contact shadow on a graphite console with a 3 px brushed-brass edge.
- Manager geometry is identical in all 7 states. Acting emphasis is only the header chip plus a +8% lift.
- Mobile keeps both faces in one continuous crop, with names next to the faces, a mullion/transom and console-edge cue, and the task at y 251. There is no scenic tail and no sticky UI.

## 6. Asset fit and blockers
- **POSE_TRANSFER_DANIEL_FOCUSED_V1.** Fits the C2 camera at ×0.286 (desktop) and ×0.18 (mobile).
  - Measured image rows: eyes 340, crown 38, chin 472, belt ≈1180.
  - The console hides the figure below y 604 (belt ≈ y 570).
  - Limitation: baked warm halo (R2). No blocker.
- **POSE_TRANSFER_NIK_TACTICAL_V1.** Fits at ×0.26 (desktop) and ×0.164 (mobile).
  - Measured image rows: eyes 335, crown 36, chin 500.
  - Tablet right edge: image x 1095, screen x 520.7.
  - Limitation: baked halo. No blocker.
- **ENV_STADIUM_WARM_BASE_V1.** Usable only through glass, with the lower band hidden (R3).
  - The plate is graded `saturate(.7) brightness(.56)` behind the glass.
  - The roof floodlights sit above the visible crop, so none show.
  - No blocker. A plate with a deeper pitch band would remove the frosted-glass workaround. That would be a new-asset request only if Nik wants it.

## 7. Conflicts found
- M1: production's inert timer display vs. the task rule that forbids a timer in Guess Entry. Flagged, not silently resolved.
- M2: production shows the error code while the error message stays unused. Flagged, not changed.
- M2 (addendum) vs. anatomy: the "console top edge approximately y 600–660" range is consistent with belt-line occlusion at these scales. No conflict.

## 8. Questions for Astra
- **CLOUD-SV01-01-A1:** Does the frosted lower-glass band (R3) read as a credible pitch-level operations room, or does it flatten the threshold?
- **CLOUD-SV01-01-A2:** Nik is layered in front of Daniel (R6), with slight overlap. Keep it, or separate the pair and accept more crop on Daniel?

## 9. Questions for Nik
- **CLOUD-SV01-01-N1:** Compare `evidence/compare-desktop-baseline-vs-candidate.png` and `evidence/compare-mobile-baseline-vs-candidate.png`. Does the shared-room staging beat the 7/10 baseline?
- **CLOUD-SV01-01-N2:** Is the baked warm halo on both poses acceptable for now (R2)?

## 10. Evidence appendix
- **Reproduce:**
  ```
  cd visual-assets/v10_1/cloud-session/candidate/tools
  NODE_PATH=$(npm root -g) node render-and-qa.cjs [FONT_CACHE_DIR]
  ```
- **Fonts:** Barlow Condensed and Barlow from Google Fonts. They were served to headless Chromium from a proxy-fetched local cache, with TLS verification intact.
- **Measurements:**
  - Desktop: Daniel eye 330.0, Nik eye 330.0; heads 124.1 / 120.6; ratio 1.029; Nik device → display gap 39.3 px; display 560–1320 × 72–628; top bar 60.
  - Desktop content clearance inside the display: 19–55 px across states.
  - Mobile: top bar 56; scene 56–236; heads 78.1 / 76.1; eyes 148 / 148; title y 251; page end 20 px below actions.
- **Quoted production strings** (`js/productionSharedTransferChallenge.js`, pstcRender GUESS_ENTRY branch):
  - `"GUESS ENTRY · YOUR RIVAL CANNOT SEE THESE BEFORE COMPLETION"`
  - `"YOUR GUESSES ARE LOCKED · WAITING FOR YOUR RIVAL"`
  - `"HISTORICAL REPLAY · PRIVATE GUESS ENTRY"`
  - `"Shared privacy: enter only your guesses. Your rival cannot read them until both managers complete the challenge."`
  - `"Historical replay: this read-only screen does not reveal any opponent payload that provider authority has not already made available."`
  - `"LOCK MY GUESSES"`
  - `"Choose League or Nationality first"`, `"Search FIFA 17 league"`, `"Search nationality"`
  - `"REFRESH SHARED CHALLENGE"`
  - `` `CONTINUE REPLAY · ${phase.replaceAll("_"," ")}` ``
  - Phase intro: `"Private Guess Entry · enter only your guesses; your rival cannot read them yet."`
- **Fixture values** for the locked, replay and busy states are the acting manager's own guesses only, using canonical ids from `data/transferOptions.js`: `england-premier-league` / Premier League, `brazil`, `france`.

## 11. Recommended Sol next actions
1. Decide M1 and M2 as product-truth items.
2. Send the frozen candidate (SHA `f1a5a27d…462b`) and its evidence to Claude Chat Project for RT-01 red team.
3. Give Nik the two baseline-vs-candidate comparisons (N1, N2).
4. After RT-01, pack the accepted and rejected deltas into a compact Astra re-entry packet (A1, A2).
5. Record promo-credit burn for this Cloud Session before starting another.

## 12. What to send back to Claude for the next task
- Sol's decisions on M1, M2 and R1–R6.
- RT-01 findings with stable IDs.
- Nik's verdict on N1 and N2.
- Any owner-authorized asset revision (for example, a halo-free pose pass or a deeper-pitch plate). That would call for a new candidate fingerprint rather than mutating `f1a5a27d…`.

CLAUDE HANDOFF COMPLETE - RETURN TO GPT-5.6 SOL FOR RECONCILIATION
