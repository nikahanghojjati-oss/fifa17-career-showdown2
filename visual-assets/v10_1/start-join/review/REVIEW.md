# Start / Join independent review

## Verdict

FAIL

Static score 35 / 45 = 3.9 average (criteria 1-7, 9, 10); the pass line is 4.2. No criterion is below 3. H1-H4 pass by reading. H5-H11 are mostly not measured (Claude measures), so the hard-gate requirement is open too. The fix list below targets the defects seen on a real render (overlapping privacy line, repeated copy in the Nik card, preview chip touching the eyebrow).

## Scorecard

| Criterion | Score | Evidence |
| --- | ---: | --- |
| 1 · Mockup fidelity | 4 | Main panel x 23.7-75.0% vs the mockup's 24.2-75.8%, two role cards over a current-connection card, managers left and right; words follow TRUTH.md (CONNECT PLAYERS), not the mockup's Private Remote Joining. |
| 2 · Characters stand out | 4 | Daniel's pointing hand is a registered cut-out with soft contact shadow; the bright rim was removed after Claude's check (JOB-087 fix 3). |
| 3 · Hands and contact | 4 | Hand sits at the left panel edge with a contact shadow; no UI cuts through it. |
| 4 · Lighting and grade | 4 | Warm plate, dark gold-edged glass; no flat grey boxes. |
| 5 · Typography and title | 3 | Title is the display-font fallback with a TODO-WORDMARK comment until the brush wordmark picture lands; the tagline is a long sentence rather than the mockup's short spaced line. |
| 6 · Panel craft | 4 | Real role cards, code field with copy button, status badge; the privacy line collides with the action row at 1366x768. |
| 7 · Information clarity and honesty | 4 | Contract states (empty, loading, partial, unavailable, paired) have designed copy; the Nik card repeats Daniel's "Send this code to Nik" text in the waiting frame. |
| 9 · Phone composition | 4 | Separate portrait composition with DANIEL · START / NIK · JOIN / CONNECTION tabs, 44 px targets, primary action visible at 375x553 (JOB-088, JOB-185). |
| 10 · Polish and finish | 4 | Clean render at 1366x768, 1366x640 and 393x660 with no scroll or errors; small overlaps remain. |

Total 35 / 45 = 3.9 average.

## Hard gates

| Gate | Result | Evidence |
| --- | --- | --- |
| H1 · Daniel left, Nik right | PASS | DOM order, DANIEL tab first, hero band Daniel left, `managerOrder` in every frame. |
| H2 · Rights-safe assets | PASS | Only Showdown scene, hand cut-out and original glyphs; no real crests, logos or players. |
| H3 · No live/private data baked into images | PASS | Codes, roles and status are DOM text from `fixtures.json`. |
| H4 · Product truth | PASS | Buttons are Start, Join, Copy, New Code, Check Status, Start Career, Retry and the confirmed More actions only. |
| H5 · Phone fit | PASS by arithmetic (Claude measures) | JOB-088: scrollHeight equals viewport at 393x660, 360x640, 375x553; JOB-185: primary action and code field visible at 375x553. |
| H6 · Input size / contrast | PARTIAL (Claude measures) | JOB-185: input 18 px, tabs and buttons 44 px; contrast not measured. |
| H7 · Reduced motion | NOT MEASURED (Claude measures) | Nothing recorded. |
| H8 · Keyboard / focus | PARTIAL (Claude measures) | Tabs with arrow keys per JOB-088; not tested on a device. |
| H9 · Console / requests | PASS (Claude measures) | Real-server renders in this review: no console errors. |
| H10 · Mockup diff | NOT MEASURED (Claude measures) | No scores.json. |
| H11 · First-paint weight / WebP | PARTIAL (Claude measures) | JOB-087 estimate: 2X plate 537,232 B, under the 900 KB budget; no network measurement. |

## Evidence

### Claude measurements

- `project-documents/factory/status/JOB-087.md`: Claude check PASS 4.2 (2026-10-04 01:00 UTC); five fixes landed (cards whole, title clear, body font, rim removed).
- `project-documents/factory/status/JOB-088.md` and `JOB-185.md`: phone no scroll at three sizes, 44 px tabs and buttons, 18 px input.
- No `evidence/QA_SUMMARY.md` or `scores.json` exists for this screen.

### Mockup differences

Mockup measured at 1672x941 from `MOCKUP_START_JOIN.png`; code values from `start-join.css`.

- Title block · mockup: eyebrow y~12%, brush title "PRIVATE REMOTE JOINING" y 14-24%, spaced tagline "PRIVATE SESSION • EXACT CAPABILITY ONLY"; code: eyebrow top 10.2%, title top 14.4% width 42% reading CONNECT PLAYERS (TRUTH.md wins), tagline top 23.7% "Daniel and Nik must both be connected before the career begins." in capitals.
- Main panel · mockup: x 24.2-75.8%, y 29.5-86.9% with a close X at its top right corner; code: `.sj-main-panel` left 23.7%, top 28.9%, width 51.3%, height 61% (ends 89.9%); a BACK tab at the top right instead of an X.
- Host and Join cards · mockup: two equal cards, icon, heading, one line of copy, big gold action (Host) and dimmer gold action (Join) with a `session_...` field; code: DANIEL · PLAYER ONE START A SHOWDOWN card with a season count row and primary action, NIK · PLAYER TWO JOIN DANIEL'S SHOWDOWN card with a code field and Join button; same structure, words from TRUTH.md.
- Current connection card · mockup: code field with copy icon, OPEN status with green dot, five small action buttons (Copy Code, Refresh/Read, Revoke Open Session, Close Session, Forget Code); code: code field with gold copy button, status badge (WAITING FOR NIK), actions NEW CODE and CHECK STATUS; revoke, close and forget sit behind a confirmed More menu per DATA_CONTRACT_V1.
- Privacy line · mockup: lock icon and "Private exact-capability session. No public discovery." centred below the card; code: `.sj-lock-slot` with "Only someone with this code can join." (TRUTH.md override); at 1366x768 it is overlapped by the action row.
- Preview chip · mockup: none; code: `.sj-preview` top 6.4%, touches the eyebrow at 1366x768.
- Managers' areas · mockup: Daniel pointing at the viewer on the left, Nik on the right, script captions; code: same from the plate and the hand cut-out; Daniel left, Nik right.
- Side banners, footer strip · mockup: banners, ball plinth and footer; code: banners are plate art, no footer strip.

### Code audit

- PASS · Manager order · `index.html`: Daniel card and tab before Nik; `fixtures.json` managerOrder.
- PASS · Buttons from truth · `fixtures.json strings.buttons`; More menu actions confirmed each.
- PASS · Honest states · `fixtures.json` SJ1 to SJ8 cover empty, ready, loading, partial, unavailable with contract copy.
- PASS · Accessible tabs · `index.html` role tab, aria-selected, aria-controls, roving tabindex; status copy has `role="status"` and `aria-live`.
- PASS · Input size · `#joinCodeMain` 18 px on phone per JOB-185.
- PASS · No PNG master on phone · phone art is WebP via `<picture>`.
- NOTE · Wrong copy · `start-join.js` line 224-228: `nikRoleCopy` falls back to the same message as Daniel's card when `viewer` is daniel, so the Nik card repeats "Send this code to Nik. It is needed only once."
- NOTE · Fixture-only DOM · `index.html` lines 119-136 keep hidden fixture-control sections in the page (state, fixture controls, frame values dump); harmless but shipped.
- NOTE · Title is a display-font fallback until `TITLE_CONNECT_PLAYERS_V1.webp` exists (ticket 124 part 6).
- N/A · Contrast numbers not measured.

## Fix list

1. `visual-assets/v10_1/start-join/start-join.css` selector `.sj-main-panel`: change `top: 28.9%; height: 61%` to `top: 27.6%; height: 63.5%`; target: the privacy line and lock icon sit fully below the action buttons with at least 8 px clear at 1366x768 and 1366x640.
2. `visual-assets/v10_1/start-join/start-join.js` the `setText("nikRoleCopy", ...)` call (about line 224): replace the fallback `fallbackMessage` with `strings.liveStatus.needConnect` when `frame.viewer !== "nik"`; target: the Nik card never repeats the host's "Send this code to Nik" text.
3. `visual-assets/v10_1/start-join/start-join.css` selector `.sj-preview`: change `top: 6.4%` to `top: 4.8%`; target: at least 6 px between the preview chip and the eyebrow at 1366x768.
4. `visual-assets/v10_1/start-join/start-join.css` selector `.sj-tagline` (desktop rule): add `letter-spacing: .3em; font-size: clamp(10px, .75vw, 13px)` so the long sentence reads as a spaced tagline on one line; target: one line, no wrap at 1366 wide.
