# Transfer War Review · Parts 1–2 of 4

## Verdict

## Scorecard

## Hard gates

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
- Panel A, left large glass — mockup value: blank painted glass around x 17–42%, y 54–82%; code value: the same plate-owned glass is used as the live viewer/own panel and receives heading, guess/signing/verdict content plus an action row, so blank mockup space becomes interactive product UI.
- Panel B, centre large glass — mockup value: blank painted glass around x 50–73%, y 61–85%; code value: the plate-owned region is reused for rival/sealed or revealed verdict content, with `.panel.sealed` adding frost and a seal before reveal; this is an intentional truth-driven privacy state absent from the static mockup.
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

## Fix list
