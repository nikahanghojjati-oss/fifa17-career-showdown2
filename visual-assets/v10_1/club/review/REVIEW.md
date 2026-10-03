# Club review · JOB-046

## Verdict

## Scorecard

## Hard gates

## Evidence

### Claude measurements carried forward

| Gate | Result | Source |
| --- | --- | --- |
| H5 · phone fit / scroll | NOT MEASURED (Claude measures) | `visual-assets/v10_1/club/evidence/QA_SUMMARY.md` does not exist; JOB-045 records arithmetic only and explicitly defers browser geometry to Claude. |
| H6 · input size / contrast | NOT MEASURED (Claude measures) | `visual-assets/v10_1/club/evidence/QA_SUMMARY.md` does not exist; JOB-045 records a static target-size check but no measured contrast result. |
| H7 · reduced motion | NOT MEASURED (Claude measures) | No Claude measurement in `status/JOB-044.md`, `status/JOB-045.md`, or Club evidence files. |
| H8 · keyboard / focus | NOT MEASURED (Claude measures) | No Claude tab-through measurement in `status/JOB-044.md`, `status/JOB-045.md`, or Club evidence files. |
| H9 · console / failed requests | NOT MEASURED (Claude measures) | No browser log measurement in `status/JOB-044.md`, `status/JOB-045.md`, or Club evidence files. |
| H10 · mockup-diff | NOT MEASURED (Claude measures) | `visual-assets/v10_1/club/evidence/scores.json` does not exist; JOB-044 notes fresh browser screenshots were not fabricated. |
| H11 · first-paint weight | NOT MEASURED (Claude measures) | No network measurement exists; JOB-045 records only a 348,506-byte planned phone-art ceiling before CSS/font overhead. |

Claude's prior `3.9` in `project-documents/factory/status/JOB-044.md` is a quality-check score with a three-item fix list, not an H5–H11 gate measurement, so it is not reused as one.

### Mockup differences

- Title block — mockup: gold hand-painted CLUB ASSIGNMENT wordmark centred across roughly the middle third of the 16:9 frame, with the CAREER MODE SHOWDOWN 17 eyebrow above; code: `#clubWheelScreen h2` renders a live Kaushan Script fallback at 64 px scale with a `TODO-WORDMARK`, while `.clubKicker` supplies the eyebrow. The semantic words are correct, but the final brush asset is not present.
- Desktop top bar — mockup: CM17 badge, HOME / CAREER / STANDINGS / STATS / RULES / ABOUT plus search, settings and profile controls; PRODUCT_TRUTH §7: only HOME / CAREER / STANDINGS / STATS / RULES plus settings; code: `#topHeader` instead shows CM17, a CAREER MODE / SHOWDOWN // 17 brand block, SIGN IN, season text and More Than A Game. This intentionally cannot match the mockup nav because product truth overrides it, but the current code also does not yet match the required shared bar.
- Assignment status block — mockup: LEAGUE CONFIRMED then TWO SEALED CLUB PACKS READY immediately below the title; code: `.clubAssignmentHeader` inserts a live `#clubAssignmentLeague` row between those two lines. The extra league value is live DOM data rather than baked art, but it changes the mockup's vertical stack.
- Five-step progress panel — mockup: DRAW / PACK 1 / PACK 2 / VS / LOCK, five circular nodes on one horizontal rail centred below the status; code: `.clubRevealProgress` has exactly those five states and 44 px `.ring` circles with a single horizontal rule. Wording and count match; active/done states are live rather than fixed to the mockup's initial visual.
- Manager/pack areas — mockup: Daniel occupies the full left hero with his hand over the left black/gold pack and Nik occupies the full right hero with his hand over the right pack; code: desktop keeps the manager, pack and stadium scene inside `.plateClip > .world` from the accepted Club plate, while phone deliberately swaps to separate `.phoneHeroDaniel` at 31% and `.phoneHeroNik` at 69%. Left/right order matches truth; the phone composition intentionally differs from the desktop mockup.
- Pack surfaces — mockup: each held pack visibly carries decorative CLUB PACK / CM17 branding; code: `.clubPackDoor > span` hides its semantic pack strings because the painted packs are owned by the plate. No live manager, club or score value is baked into those pack surfaces.
- Rivalry / VS block — mockup: RIVALRY label and a large painted gold VS centered between the managers; code: `.clubVs` keeps RIVALRY plus a live Kaushan fallback for VS and marks it `TODO-WORDMARK`. Hierarchy matches, but the final brush asset is absent and the fallback cannot be visually identical to the painted reference.
- Club assignment panel — mockup: one wide bottom trapezoid headed CLUBS LOCKED SHOWDOWN, with Daniel's club slot on the left, Nik's on the right, and a centre VS divider; code: normal reveal uses two independent `.clubCardFace` regions and keeps `#clubRivalryConfirmation` hidden until confirmation. The confirmation markup contains the locked-showdown headline and matchup, but the initial-state panel structure is deliberately stateful rather than the mockup's single static panel.
- Daniel club row — mockup: left unknown shield, DANIEL CLUB and TO BE REVEALED; code: `#clubCardOne` exposes Daniel plus CAREER DRAW / ASSIGNED CLUB / `#clubNameOne` / `#clubCardStateOne`. The data meaning is equivalent, but the labels are not verbatim mockup copy.
- Nik club row — mockup: right unknown shield, NIK CLUB and TO BE REVEALED; code: `#clubCardTwo` exposes Nik plus CAREER DRAW / ASSIGNED CLUB / `#clubNameTwo` / `#clubCardStateTwo`. The data meaning is equivalent, but the labels are not verbatim mockup copy.
- Permanence note — mockup: ONCE REVEALED, THESE CLUBS ARE PERMANENT FOR THE FULL SHOWDOWN; code: `.clubRivalryLockNote` says “These clubs are permanent for the full showdown. Confirmation starts the rivalry and never rerolls either club.” Same rule, expanded wording and only visible in the confirmation state.
- Primary button — mockup: OPEN SHOWDOWN PACKS, wide gold button near the lower centre; code: `#openClubPack` uses the exact label and a 400 px scaled gold primary button on desktop. A second real-state primary, `#continueClubAssignment`, is hidden until needed and reads CONFIRM RIVALRY & START SHOWDOWN.
- Back button — mockup: BACK, dark outlined button immediately right of the primary; code: `#clubAssignmentBack` uses BACK, a dark outlined style and a 200 px scaled desktop width. On phone it intentionally becomes a 44 px icon-like secondary control.
- Footer — mockup: thin CM17 / CAREER MODE SHOWDOWN 17 footer on the left and FOOTBALL BRINGS US TOGETHER with crown on the right; code: `footer` keeps the slogan/crown but shows “Career Mode Showdown / v1.9.1” on the left, so the left footer copy differs.
- Phone panels — mockup: no portrait-phone reference; code: `.phoneControlDeck`, two stacked 50 px manager rows, compact status block and pinned controls form the required independent phone composition. This is a PRODUCT_TRUTH §7 override, not a desktop-mockup fidelity defect.

## Fix list
