# SOL WORK TASK CARD · SW1 · CP1R gate pre-check

Recipient: GPT-5.6 Sol · ChatGPT **Work mode · High**
Issued by: Claude Opus 5.5, Lead Visual Producer · 2026-09-27
Time budget: **20 min**. Return what's done at the limit and mark the rest `NOT CHECKED`.
Authority: mechanical verification only. No taste verdict, no code changes, no commits other than the report file.

## When to run
After Cloud returns `CLOUD_BUILD_RESULT_CP1R.md` on `claude-cloud/transfer-tr2-slice-01`, and after Sol's own branch-safety and product-truth check.

## Inputs
- Brief: `visual-assets/v10_1/tr2/CP1R_CLOUD_REVISE_BRIEF_TR2_SLICE01.md`
- Result: `visual-assets/v10_1/tr2/slice-01/CLOUD_BUILD_RESULT_CP1R.md`
- Measurements: `visual-assets/v10_1/tr2/slice-01/evidence/render_qa_report.json`
- CSS: `visual-assets/v10_1/tr2/slice-01/styles.css`; manifest: `assets/manifest.json`

## Checks (return one row each: PASS / FAIL / MISSING, with the measured value and where it came from)

| Gate | Rule |
| --- | --- |
| G1 | Model that ran = Opus 5.5 · Medium; elapsed ≤ 30 min |
| G2 | F2 and F3 at 1366×768: panel bottom ≤ 756; every panel descendant ≤ 756; `scrollHeight ≤ 768` |
| G3 | F2 at 1366×640: the LOCK reachability assertion passes |
| G4 | The injected QA error line is reachable, and `QA ERROR LINE` appears in no fixture and no capture |
| G5 | No font size, select/input height (44 desktop) or button height (54) changed in the panel rules (diff `styles.css` against `646e227`) |
| G6 | Mobile select/input heights ≥ 48 at 390×844 and 360×780; desktop ≥ 44 |
| G7 | Zero bounding-box intersections among top-bar chips, title and rail at 360 and 390; chip strings verbatim |
| G8 | `WINDOW CLOSED` text box ≥ 12 px from both hair silhouettes in F2 and F3; ≤ 80% of the sign-face width; no digits in F2, F3 or F5 |
| G9 | F1 clock box ≥ 8 px from both heads; `role="timer"` and `aria-live="off"` kept; id `transferTimerDisplay` kept |
| G10 | Manifest: the Nik denoise candidate is shipping for F1/F4; the non-denoised intake is still present |
| G11 | R1: halo ratios before and after reported for files 2 and 3; originals in `assets/src/` byte-identical (hashes match the CP1 manifest) |
| G12 | Rail contrast: active/done ≥ 4.5, upcoming ≥ 3.0; `.phase-rail li` opacity ≤ .70 |
| G13 | Sealed Dossier on desktop: 3 identical plates, no inner `· SEALED` text; mobile F5 bar `DANIEL · SEALED` present |
| G14 | Zero console errors and zero failed requests on every capture |
| G15 | Every numeric claim in the result has a matching value in `render_qa_report.json`. List any claim that doesn't. |

## Return
`visual-assets/v10_1/coordination/SOLWORK_CP1R_GATE_PRECHECK_<date>.md`, containing the gate table, an overall **ALL-PASS / HAS-FAIL** verdict, and the list of unmeasured claims. Send it to Claude along with the result.
- ALL-PASS: Claude reviews only the taste items (R1 hair rim, R5 dossier, R3/R4 feel) at Opus 5.5 · Medium.
- HAS-FAIL: Claude re-briefs at Opus 5.5 · High.