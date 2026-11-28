# JOB-1586 · Club screen measurements

Measured 2026-10-10T16:19:58.227Z on gameplay/bug-list-1 source fae4d9c7c3b5e93697f000355f8fa9b87f04f893. Chromium 149.0.7827.0; Node v24.19.0.

Captured 330 screen/window states at all ten requested CSS-pixel viewports. The script reuses the fixture from tests/browser/shared-showdown-polished-presentation-audit.cjs, boots the real app, activates its real shared presentation, and routes through League Wheel. Synthetic in-memory provider data isolates layout; it is not production/two-account proof. No game or existing audit file changed.

Measurements cover club content and the shared app header where visible. Touch checks apply to the first six sizes (phones in either orientation and 768×1024 tablet); desktop rows say N/A. DPR 1, default CSS motion for shared reveal stages; the reproducible fixture holds the shared 650/1750/3000 ms phase callbacks until each capture completes. Earlier accepted phone/landscape captures used natural phase timers; all stage labels are verified against the actual DOM stage. Tablet uses a desktop viewport with touch enabled to keep the requested CSS dimensions; portrait phones use mobile emulation. Desktop sizes have touch disabled. Stable states wait 350 ms, timed reveal stages 90 ms plus two animation frames. Long-name stress uses reduced motion and two catalog names from different leagues to stress width only; this pair is synthetic, not a legal league draw. Local stages invoke the real local renderer without drawing/persisting a career. Fonts and the V10 club mount are awaited. Stable-state screenshots and raw geometry are external artifacts; timed stages omit screenshots so screenshot latency cannot skip the next reveal phase. Supplementary confirmation-overlap-detail captures use reduced motion and check the primary button against club names, status and confirmation text.

Reproduce: start `node tests/support/static-server.cjs`, then run `CMS_CHROMIUM_MULTI_CONTEXT=1 node project-documents/gameplay-factory/queue/results/measure-club.cjs`. Optional: CMS_BASE_URL, CMS_CLUB_EVIDENCE (default /tmp/cms-job-1586). CMS_CLUB_RERUN_SIZES is an optional comma-separated list (e.g. 768x1024,1280x650) that replaces those sizes in the existing JSON and refreshes all overlap-detail captures. CMS_CLUB_KEEP_DETAILS=1 keeps previously completed overlap-detail captures at other sizes. CMS_CLUB_REPORT_ONLY=1 regenerates the report from existing JSON without opening a browser. Only this report is overwritten. Raw JSON and viewport screenshots go to CMS_CLUB_EVIDENCE.

Coverage: both roles’ sealed/waiting packs, opening/one-pack/two-pack reveal, locked clubs waiting for season authority, confirmation, failed confirmation, waiting for rival, reconnect, Career Start ready, season mismatch, and long catalog names; host also provider-working and pack-write-failure; local renderer ready/opening/one-pack/two-pack/versus/confirmation. Shared flow has no separate versus stage. The Career Start panel is stubbed exactly as the source audit does; its screen is outside club scope.

Measurement rules: visible controls include disabled waiting/working buttons. Each dimension must be ≥44 px. Text candidates have direct nonempty text nodes and scrollWidth > clientWidth. The table also records whether DOM Range glyph bounds escape the text element: hidden-overflow + escaping glyphs is a clipping finding; other candidates need pseudo-element inspection. Numeric scrollWidth overflow alone is not proof of clipped text. Semantic-only hidden text is excluded. Oversized aria-hidden scenery is recorded separately as decoration. First-screenful requires the full primary-button rectangle within the viewport and no overflow-hidden/clip ancestor cutting it. Center hit-testing is recorded separately for occlusion; it does not affect geometric containment. A missing primary action is N/A (e.g. local versus). Key independent cards, season panel, lock note, status and primary button are checked for rectangle overlap. Horizontal scrollbar yes/no considers document extent and html/body overflow policy; hidden overflow can cut content without a scrollbar.

## Most important five

1. **Tablet crops core content and the opening action.** At 768×1024 the confirmation-stage #clubNameOne rectangle is -212.8…128px horizontally; the other manager/club row also escapes the right edge. In the host sealed and pack-write-failure states, #openClubPack starts at -29.1px, so its left edge is cut off even though its vertical position fits. Overflow-hidden prevents a horizontal scrollbar.
2. **Landscape controls are too short for touch.** #continueClubAssignment is 27.7px high at 844×390 and 30.6px at 932×430. Open Packs and local Back share those heights; the visible identity badge at 932×430 is 28px high. These fail the 44px threshold.
3. **Landscape confirmation crosses the club names.** Reduced-motion confirmation detail: 844x390 #clubNameOne / #continueClubAssignment: 140×14.7px; 844x390 #clubNameTwo / #continueClubAssignment: 56.6×14.7px; 932x430 #clubNameOne / #continueClubAssignment: 110.3×12.4px; 932x430 #clubNameTwo / #continueClubAssignment: 41.4×12.4px; 1280x650 #clubNameOne / #continueClubAssignment: 35×2.5px. The 844×390 screenshot visibly shows the action covering part of the club-name row. These are rectangle intersections, not a claim that every pixel of both words is hidden.
4. **The smallest phone's lock note runs behind the action.** At 360×640 .clubRivalryLockNote intersects #continueClubAssignment by 278×21px and also touches the season panel. This repeats through confirmation, waiting/reconnect and recovery states; the main button itself fits.
5. **Long-name stress clips on the smallest phone.** At 360×640 #clubNameTwo (Borussia Mönchengladbach) measures 211>176px, with hidden overflow and escaping glyph bounds. The cross-league fixture tests width only. By contrast, ordinary Osasuna/Espanyol width flags come from the animated brush pseudo-element: their glyphs fit. Decorative progress-dot flags also need visual inspection.

Horizontal scrollbars: 0 captures. Primary action outside/cropped from the first screenful: 2 captures. Application page errors: 0. Unreached scheduled sequences: 0.

## Measurements

| Size | Screen | Problem / check | Selector | Measured value |
| --- | --- | --- | --- | --- |
| 360x640 | playerOne-sealed | Horizontal scrollbar | html / body | no; scroll/client 360/360px; overflow hidden/hidden |
| 360x640 | playerOne-sealed | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 360x640 | playerOne-sealed | Touch control <44px | #clubWheelScreen | 0 of 1 visible controls |
| 360x640 | playerOne-sealed | Text scrollWidth > clientWidth | #clubWheelScreen | 0 candidates |
| 360x640 | playerOne-sealed | Primary action in first screenful | #openClubPack | yes; 286×52px; top/bottom 580/632px; OPEN SHOWDOWN PACKS; center unobscured yes |
| 360x640 | playerOne-provider-working | Horizontal scrollbar | html / body | no; scroll/client 360/360px; overflow hidden/hidden |
| 360x640 | playerOne-provider-working | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 360x640 | playerOne-provider-working | Touch control <44px | #clubWheelScreen | 0 of 1 visible controls |
| 360x640 | playerOne-provider-working | Text scrollWidth > clientWidth | #clubWheelScreen | 5 candidates |
| 360x640 | playerOne-provider-working | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span:nth-of-type(1) | 15>14px; overflow-x visible; glyph range outside no; 01 DRAW |
| 360x640 | playerOne-provider-working | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span:nth-of-type(2) | 15>14px; overflow-x visible; glyph range outside no; 02 PACK 1 |
| 360x640 | playerOne-provider-working | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span:nth-of-type(3) | 15>14px; overflow-x visible; glyph range outside no; 03 PACK 2 |
| 360x640 | playerOne-provider-working | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span:nth-of-type(4) | 15>14px; overflow-x visible; glyph range outside no; 04 VS |
| 360x640 | playerOne-provider-working | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span:nth-of-type(5) | 15>14px; overflow-x visible; glyph range outside no; 05 LOCK |
| 360x640 | playerOne-provider-working | Primary action in first screenful | #openClubPack | yes; 286×52px; top/bottom 580/632px; WORKING…; disabled; center unobscured yes |
| 360x640 | playerOne-pack-write-failure | Horizontal scrollbar | html / body | no; scroll/client 360/360px; overflow hidden/hidden |
| 360x640 | playerOne-pack-write-failure | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 360x640 | playerOne-pack-write-failure | Touch control <44px | #clubWheelScreen | 0 of 1 visible controls |
| 360x640 | playerOne-pack-write-failure | Text scrollWidth > clientWidth | #clubWheelScreen | 5 candidates |
| 360x640 | playerOne-pack-write-failure | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span:nth-of-type(1) | 15>14px; overflow-x visible; glyph range outside no; 01 DRAW |
| 360x640 | playerOne-pack-write-failure | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span:nth-of-type(2) | 15>14px; overflow-x visible; glyph range outside no; 02 PACK 1 |
| 360x640 | playerOne-pack-write-failure | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span:nth-of-type(3) | 15>14px; overflow-x visible; glyph range outside no; 03 PACK 2 |
| 360x640 | playerOne-pack-write-failure | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span:nth-of-type(4) | 15>14px; overflow-x visible; glyph range outside no; 04 VS |
| 360x640 | playerOne-pack-write-failure | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span:nth-of-type(5) | 15>14px; overflow-x visible; glyph range outside no; 05 LOCK |
| 360x640 | playerOne-pack-write-failure | Primary action in first screenful | #openClubPack | yes; 286×52px; top/bottom 579/631px; OPEN SHOWDOWN PACKS; center unobscured yes |
| 360x640 | playerOne-opening | Horizontal scrollbar | html / body | no; scroll/client 360/360px; overflow hidden/hidden |
| 360x640 | playerOne-opening | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 360x640 | playerOne-opening | Touch control <44px | #clubWheelScreen | 0 of 0 visible controls |
| 360x640 | playerOne-opening | Text scrollWidth > clientWidth | #clubWheelScreen | 6 candidates |
| 360x640 | playerOne-opening | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.active:nth-of-type(1) | 21>14px; overflow-x visible; glyph range outside no; 01 DRAW |
| 360x640 | playerOne-opening | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span:nth-of-type(2) | 15>14px; overflow-x visible; glyph range outside no; 02 PACK 1 |
| 360x640 | playerOne-opening | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span:nth-of-type(3) | 15>14px; overflow-x visible; glyph range outside no; 03 PACK 2 |
| 360x640 | playerOne-opening | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span:nth-of-type(4) | 15>14px; overflow-x visible; glyph range outside no; 04 VS |
| 360x640 | playerOne-opening | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span:nth-of-type(5) | 15>14px; overflow-x visible; glyph range outside no; 05 LOCK |
| 360x640 | playerOne-opening | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span | 98>73px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 360x640 | playerOne-opening | Primary action in first screenful | none | N/A no visible action |
| 360x640 | playerOne-manager-one | Horizontal scrollbar | html / body | no; scroll/client 360/360px; overflow hidden/hidden |
| 360x640 | playerOne-manager-one | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 360x640 | playerOne-manager-one | Touch control <44px | #clubWheelScreen | 0 of 0 visible controls |
| 360x640 | playerOne-manager-one | Text scrollWidth > clientWidth | #clubWheelScreen | 6 candidates |
| 360x640 | playerOne-manager-one | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(1) | 15>14px; overflow-x visible; glyph range outside no; 01 DRAW |
| 360x640 | playerOne-manager-one | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.active:nth-of-type(2) | 24>14px; overflow-x visible; glyph range outside no; 02 PACK 1 |
| 360x640 | playerOne-manager-one | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span:nth-of-type(3) | 15>14px; overflow-x visible; glyph range outside no; 03 PACK 2 |
| 360x640 | playerOne-manager-one | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span:nth-of-type(4) | 15>14px; overflow-x visible; glyph range outside no; 04 VS |
| 360x640 | playerOne-manager-one | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span:nth-of-type(5) | 15>14px; overflow-x visible; glyph range outside no; 05 LOCK |
| 360x640 | playerOne-manager-one | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span | 98>73px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 360x640 | playerOne-manager-one | Primary action in first screenful | none | N/A no visible action |
| 360x640 | playerOne-manager-two | Horizontal scrollbar | html / body | no; scroll/client 360/360px; overflow hidden/hidden |
| 360x640 | playerOne-manager-two | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 360x640 | playerOne-manager-two | Touch control <44px | #clubWheelScreen | 0 of 0 visible controls |
| 360x640 | playerOne-manager-two | Text scrollWidth > clientWidth | #clubWheelScreen | 7 candidates |
| 360x640 | playerOne-manager-two | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(1) | 15>14px; overflow-x visible; glyph range outside no; 01 DRAW |
| 360x640 | playerOne-manager-two | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(2) | 15>14px; overflow-x visible; glyph range outside no; 02 PACK 1 |
| 360x640 | playerOne-manager-two | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.active:nth-of-type(3) | 25>14px; overflow-x visible; glyph range outside no; 03 PACK 2 |
| 360x640 | playerOne-manager-two | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span:nth-of-type(4) | 15>14px; overflow-x visible; glyph range outside no; 04 VS |
| 360x640 | playerOne-manager-two | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span:nth-of-type(5) | 15>14px; overflow-x visible; glyph range outside no; 05 LOCK |
| 360x640 | playerOne-manager-two | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 213>178px; overflow-x hidden; glyph range outside no; Osasuna |
| 360x640 | playerOne-manager-two | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span | 98>73px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 360x640 | playerOne-manager-two | Primary action in first screenful | none | N/A no visible action |
| 360x640 | playerOne-confirm | Horizontal scrollbar | html / body | no; scroll/client 360/360px; overflow hidden/hidden |
| 360x640 | playerOne-confirm | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 360x640 | playerOne-confirm | Touch control <44px | #clubWheelScreen | 0 of 1 visible controls |
| 360x640 | playerOne-confirm | Text scrollWidth > clientWidth | #clubWheelScreen | 8 candidates |
| 360x640 | playerOne-confirm | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(1) | 15>14px; overflow-x visible; glyph range outside no; 01 DRAW |
| 360x640 | playerOne-confirm | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(2) | 15>14px; overflow-x visible; glyph range outside no; 02 PACK 1 |
| 360x640 | playerOne-confirm | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(3) | 15>14px; overflow-x visible; glyph range outside no; 03 PACK 2 |
| 360x640 | playerOne-confirm | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(4) | 15>14px; overflow-x visible; glyph range outside no; 04 VS |
| 360x640 | playerOne-confirm | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.active:nth-of-type(5) | 20>14px; overflow-x visible; glyph range outside no; 05 LOCK |
| 360x640 | playerOne-confirm | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 213>178px; overflow-x hidden; glyph range outside no; Osasuna |
| 360x640 | playerOne-confirm | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 211>176px; overflow-x hidden; glyph range outside no; Espanyol |
| 360x640 | playerOne-confirm | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 78>73px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 360x640 | playerOne-confirm | Overlap | .clubRivalryLockNote / #continueClubAssignment | 278×21px intersection |
| 360x640 | playerOne-confirm | Overlap | .clubRivalryLockNote / #sharedShowdownSeasonChoice | 320×2.6px intersection |
| 360x640 | playerOne-confirm | Primary action in first screenful | #continueClubAssignment | yes; 286×52px; top/bottom 579/631px; CONFIRM SHARED SHOWDOWN; center unobscured yes |
| 360x640 | playerOne-confirm-write-failure | Horizontal scrollbar | html / body | no; scroll/client 360/360px; overflow hidden/hidden |
| 360x640 | playerOne-confirm-write-failure | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 360x640 | playerOne-confirm-write-failure | Touch control <44px | #clubWheelScreen | 0 of 1 visible controls |
| 360x640 | playerOne-confirm-write-failure | Text scrollWidth > clientWidth | #clubWheelScreen | 8 candidates |
| 360x640 | playerOne-confirm-write-failure | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(1) | 15>14px; overflow-x visible; glyph range outside no; 01 DRAW |
| 360x640 | playerOne-confirm-write-failure | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(2) | 15>14px; overflow-x visible; glyph range outside no; 02 PACK 1 |
| 360x640 | playerOne-confirm-write-failure | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(3) | 15>14px; overflow-x visible; glyph range outside no; 03 PACK 2 |
| 360x640 | playerOne-confirm-write-failure | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(4) | 15>14px; overflow-x visible; glyph range outside no; 04 VS |
| 360x640 | playerOne-confirm-write-failure | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.active:nth-of-type(5) | 20>14px; overflow-x visible; glyph range outside no; 05 LOCK |
| 360x640 | playerOne-confirm-write-failure | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 213>178px; overflow-x hidden; glyph range outside no; Osasuna |
| 360x640 | playerOne-confirm-write-failure | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 211>176px; overflow-x hidden; glyph range outside no; Espanyol |
| 360x640 | playerOne-confirm-write-failure | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 78>73px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 360x640 | playerOne-confirm-write-failure | Overlap | .clubRivalryLockNote / #continueClubAssignment | 278×21px intersection |
| 360x640 | playerOne-confirm-write-failure | Overlap | .clubRivalryLockNote / #sharedShowdownSeasonChoice | 320×2.6px intersection |
| 360x640 | playerOne-confirm-write-failure | Primary action in first screenful | #continueClubAssignment | yes; 286×52px; top/bottom 579/631px; CONFIRM SHARED SHOWDOWN; center unobscured yes |
| 360x640 | playerOne-waiting-rival | Horizontal scrollbar | html / body | no; scroll/client 360/360px; overflow hidden/hidden |
| 360x640 | playerOne-waiting-rival | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 360x640 | playerOne-waiting-rival | Touch control <44px | #clubWheelScreen | 0 of 1 visible controls |
| 360x640 | playerOne-waiting-rival | Text scrollWidth > clientWidth | #clubWheelScreen | 8 candidates |
| 360x640 | playerOne-waiting-rival | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(1) | 15>14px; overflow-x visible; glyph range outside no; 01 DRAW |
| 360x640 | playerOne-waiting-rival | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(2) | 15>14px; overflow-x visible; glyph range outside no; 02 PACK 1 |
| 360x640 | playerOne-waiting-rival | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(3) | 15>14px; overflow-x visible; glyph range outside no; 03 PACK 2 |
| 360x640 | playerOne-waiting-rival | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(4) | 15>14px; overflow-x visible; glyph range outside no; 04 VS |
| 360x640 | playerOne-waiting-rival | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.active:nth-of-type(5) | 20>14px; overflow-x visible; glyph range outside no; 05 LOCK |
| 360x640 | playerOne-waiting-rival | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 213>178px; overflow-x hidden; glyph range outside no; Osasuna |
| 360x640 | playerOne-waiting-rival | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 211>176px; overflow-x hidden; glyph range outside no; Espanyol |
| 360x640 | playerOne-waiting-rival | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 78>73px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 360x640 | playerOne-waiting-rival | Overlap | .clubRivalryLockNote / #continueClubAssignment | 278×20px intersection |
| 360x640 | playerOne-waiting-rival | Overlap | .clubRivalryLockNote / #sharedShowdownSeasonChoice | 320×2.6px intersection |
| 360x640 | playerOne-waiting-rival | Primary action in first screenful | #continueClubAssignment | yes; 286×52px; top/bottom 580/632px; CONFIRMED · WAITING FOR RIVAL; disabled; center unobscured yes |
| 360x640 | playerOne-reconnect | Horizontal scrollbar | html / body | no; scroll/client 360/360px; overflow hidden/hidden |
| 360x640 | playerOne-reconnect | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 360x640 | playerOne-reconnect | Touch control <44px | #clubWheelScreen | 0 of 1 visible controls |
| 360x640 | playerOne-reconnect | Text scrollWidth > clientWidth | #clubWheelScreen | 8 candidates |
| 360x640 | playerOne-reconnect | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(1) | 15>14px; overflow-x visible; glyph range outside no; 01 DRAW |
| 360x640 | playerOne-reconnect | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(2) | 15>14px; overflow-x visible; glyph range outside no; 02 PACK 1 |
| 360x640 | playerOne-reconnect | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(3) | 15>14px; overflow-x visible; glyph range outside no; 03 PACK 2 |
| 360x640 | playerOne-reconnect | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(4) | 15>14px; overflow-x visible; glyph range outside no; 04 VS |
| 360x640 | playerOne-reconnect | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.active:nth-of-type(5) | 20>14px; overflow-x visible; glyph range outside no; 05 LOCK |
| 360x640 | playerOne-reconnect | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 213>178px; overflow-x hidden; glyph range outside no; Osasuna |
| 360x640 | playerOne-reconnect | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 211>176px; overflow-x hidden; glyph range outside no; Espanyol |
| 360x640 | playerOne-reconnect | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 78>73px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 360x640 | playerOne-reconnect | Overlap | .clubRivalryLockNote / #continueClubAssignment | 278×20px intersection |
| 360x640 | playerOne-reconnect | Overlap | .clubRivalryLockNote / #sharedShowdownSeasonChoice | 320×2.6px intersection |
| 360x640 | playerOne-reconnect | Primary action in first screenful | #continueClubAssignment | yes; 286×52px; top/bottom 580/632px; RECONNECT PLAYERS TO CONTINUE; disabled; center unobscured yes |
| 360x640 | playerOne-career-start-ready | Horizontal scrollbar | html / body | no; scroll/client 360/360px; overflow hidden/hidden |
| 360x640 | playerOne-career-start-ready | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 360x640 | playerOne-career-start-ready | Touch control <44px | #clubWheelScreen | 0 of 1 visible controls |
| 360x640 | playerOne-career-start-ready | Text scrollWidth > clientWidth | #clubWheelScreen | 8 candidates |
| 360x640 | playerOne-career-start-ready | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(1) | 15>14px; overflow-x visible; glyph range outside no; 01 DRAW |
| 360x640 | playerOne-career-start-ready | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(2) | 15>14px; overflow-x visible; glyph range outside no; 02 PACK 1 |
| 360x640 | playerOne-career-start-ready | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(3) | 15>14px; overflow-x visible; glyph range outside no; 03 PACK 2 |
| 360x640 | playerOne-career-start-ready | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(4) | 15>14px; overflow-x visible; glyph range outside no; 04 VS |
| 360x640 | playerOne-career-start-ready | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.active:nth-of-type(5) | 20>14px; overflow-x visible; glyph range outside no; 05 LOCK |
| 360x640 | playerOne-career-start-ready | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 213>178px; overflow-x hidden; glyph range outside no; Osasuna |
| 360x640 | playerOne-career-start-ready | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 211>176px; overflow-x hidden; glyph range outside no; Espanyol |
| 360x640 | playerOne-career-start-ready | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 78>73px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 360x640 | playerOne-career-start-ready | Overlap | .clubRivalryLockNote / #continueClubAssignment | 278×21px intersection |
| 360x640 | playerOne-career-start-ready | Overlap | .clubRivalryLockNote / #sharedShowdownSeasonChoice | 320×2.6px intersection |
| 360x640 | playerOne-career-start-ready | Primary action in first screenful | #continueClubAssignment | yes; 286×52px; top/bottom 579/631px; CONTINUE TO CAREER START; center unobscured yes |
| 360x640 | playerOne-season-mismatch | Horizontal scrollbar | html / body | no; scroll/client 360/360px; overflow hidden/hidden |
| 360x640 | playerOne-season-mismatch | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 360x640 | playerOne-season-mismatch | Touch control <44px | #clubWheelScreen | 0 of 1 visible controls |
| 360x640 | playerOne-season-mismatch | Text scrollWidth > clientWidth | #clubWheelScreen | 8 candidates |
| 360x640 | playerOne-season-mismatch | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(1) | 15>14px; overflow-x visible; glyph range outside no; 01 DRAW |
| 360x640 | playerOne-season-mismatch | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(2) | 15>14px; overflow-x visible; glyph range outside no; 02 PACK 1 |
| 360x640 | playerOne-season-mismatch | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(3) | 15>14px; overflow-x visible; glyph range outside no; 03 PACK 2 |
| 360x640 | playerOne-season-mismatch | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(4) | 15>14px; overflow-x visible; glyph range outside no; 04 VS |
| 360x640 | playerOne-season-mismatch | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.active:nth-of-type(5) | 20>14px; overflow-x visible; glyph range outside no; 05 LOCK |
| 360x640 | playerOne-season-mismatch | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 213>178px; overflow-x hidden; glyph range outside no; Osasuna |
| 360x640 | playerOne-season-mismatch | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 211>176px; overflow-x hidden; glyph range outside no; Espanyol |
| 360x640 | playerOne-season-mismatch | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 78>73px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 360x640 | playerOne-season-mismatch | Overlap | .clubRivalryLockNote / #continueClubAssignment | 278×20px intersection |
| 360x640 | playerOne-season-mismatch | Overlap | .clubRivalryLockNote / #sharedShowdownSeasonChoice | 320×2.6px intersection |
| 360x640 | playerOne-season-mismatch | Primary action in first screenful | #continueClubAssignment | yes; 286×52px; top/bottom 580/632px; SEASON PLAN MISMATCH · RECOVERY REQUIRED; disabled; center unobscured yes |
| 360x640 | playerOne-long-club-names | Horizontal scrollbar | html / body | no; scroll/client 360/360px; overflow hidden/hidden |
| 360x640 | playerOne-long-club-names | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 360x640 | playerOne-long-club-names | Touch control <44px | #clubWheelScreen | 0 of 1 visible controls |
| 360x640 | playerOne-long-club-names | Text scrollWidth > clientWidth | #clubWheelScreen | 8 candidates |
| 360x640 | playerOne-long-club-names | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(1) | 15>14px; overflow-x visible; glyph range outside no; 01 DRAW |
| 360x640 | playerOne-long-club-names | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(2) | 15>14px; overflow-x visible; glyph range outside no; 02 PACK 1 |
| 360x640 | playerOne-long-club-names | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(3) | 15>14px; overflow-x visible; glyph range outside no; 03 PACK 2 |
| 360x640 | playerOne-long-club-names | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(4) | 15>14px; overflow-x visible; glyph range outside no; 04 VS |
| 360x640 | playerOne-long-club-names | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.active:nth-of-type(5) | 20>14px; overflow-x visible; glyph range outside no; 05 LOCK |
| 360x640 | playerOne-long-club-names | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 213>178px; overflow-x hidden; glyph range outside no; Deportivo La Coruña |
| 360x640 | playerOne-long-club-names | Text clipped (glyph range) | #clubNameTwo | 211>176px; overflow-x hidden; glyph range outside yes; Borussia Mönchengladbach |
| 360x640 | playerOne-long-club-names | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 78>73px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 360x640 | playerOne-long-club-names | Overlap | .clubRivalryLockNote / #continueClubAssignment | 278×21px intersection |
| 360x640 | playerOne-long-club-names | Overlap | .clubRivalryLockNote / #sharedShowdownSeasonChoice | 320×2.6px intersection |
| 360x640 | playerOne-long-club-names | Primary action in first screenful | #continueClubAssignment | yes; 286×52px; top/bottom 579/631px; CONFIRM SHARED SHOWDOWN; center unobscured yes |
| 360x640 | playerOne-local-ready | Horizontal scrollbar | html / body | no; scroll/client 360/360px; overflow hidden/hidden |
| 360x640 | playerOne-local-ready | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 360x640 | playerOne-local-ready | Touch control <44px | #clubWheelScreen | 0 of 2 visible controls |
| 360x640 | playerOne-local-ready | Text scrollWidth > clientWidth | #clubWheelScreen | 7 candidates |
| 360x640 | playerOne-local-ready | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span:nth-of-type(1) | 15>14px; overflow-x visible; glyph range outside no; 01 DRAW |
| 360x640 | playerOne-local-ready | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span:nth-of-type(2) | 15>14px; overflow-x visible; glyph range outside no; 02 PACK 1 |
| 360x640 | playerOne-local-ready | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span:nth-of-type(3) | 15>14px; overflow-x visible; glyph range outside no; 03 PACK 2 |
| 360x640 | playerOne-local-ready | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span:nth-of-type(4) | 15>14px; overflow-x visible; glyph range outside no; 04 VS |
| 360x640 | playerOne-local-ready | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span:nth-of-type(5) | 15>14px; overflow-x visible; glyph range outside no; 05 LOCK |
| 360x640 | playerOne-local-ready | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 213>178px; overflow-x hidden; glyph range outside no; ? |
| 360x640 | playerOne-local-ready | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 211>176px; overflow-x hidden; glyph range outside no; ? |
| 360x640 | playerOne-local-ready | Primary action in first screenful | #openClubPack | yes; 286×52px; top/bottom 580/632px; OPEN SHOWDOWN PACKS; disabled; center unobscured yes |
| 360x640 | playerOne-local-opening | Horizontal scrollbar | html / body | no; scroll/client 360/360px; overflow hidden/hidden |
| 360x640 | playerOne-local-opening | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 360x640 | playerOne-local-opening | Touch control <44px | #clubWheelScreen | 0 of 1 visible controls |
| 360x640 | playerOne-local-opening | Text scrollWidth > clientWidth | #clubWheelScreen | 7 candidates |
| 360x640 | playerOne-local-opening | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.active:nth-of-type(1) | 21>14px; overflow-x visible; glyph range outside no; 01 DRAW |
| 360x640 | playerOne-local-opening | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span:nth-of-type(2) | 15>14px; overflow-x visible; glyph range outside no; 02 PACK 1 |
| 360x640 | playerOne-local-opening | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span:nth-of-type(3) | 15>14px; overflow-x visible; glyph range outside no; 03 PACK 2 |
| 360x640 | playerOne-local-opening | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span:nth-of-type(4) | 15>14px; overflow-x visible; glyph range outside no; 04 VS |
| 360x640 | playerOne-local-opening | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span:nth-of-type(5) | 15>14px; overflow-x visible; glyph range outside no; 05 LOCK |
| 360x640 | playerOne-local-opening | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 213>178px; overflow-x hidden; glyph range outside no; ? |
| 360x640 | playerOne-local-opening | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 211>176px; overflow-x hidden; glyph range outside no; ? |
| 360x640 | playerOne-local-opening | Primary action in first screenful | #openClubPack | yes; 286×52px; top/bottom 580/632px; DRAW LOCKED...; disabled; center unobscured yes |
| 360x640 | playerOne-local-manager-one | Horizontal scrollbar | html / body | no; scroll/client 360/360px; overflow hidden/hidden |
| 360x640 | playerOne-local-manager-one | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 360x640 | playerOne-local-manager-one | Touch control <44px | #clubWheelScreen | 0 of 1 visible controls |
| 360x640 | playerOne-local-manager-one | Text scrollWidth > clientWidth | #clubWheelScreen | 7 candidates |
| 360x640 | playerOne-local-manager-one | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(1) | 15>14px; overflow-x visible; glyph range outside no; 01 DRAW |
| 360x640 | playerOne-local-manager-one | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.active:nth-of-type(2) | 24>14px; overflow-x visible; glyph range outside no; 02 PACK 1 |
| 360x640 | playerOne-local-manager-one | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span:nth-of-type(3) | 15>14px; overflow-x visible; glyph range outside no; 03 PACK 2 |
| 360x640 | playerOne-local-manager-one | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span:nth-of-type(4) | 15>14px; overflow-x visible; glyph range outside no; 04 VS |
| 360x640 | playerOne-local-manager-one | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span:nth-of-type(5) | 15>14px; overflow-x visible; glyph range outside no; 05 LOCK |
| 360x640 | playerOne-local-manager-one | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 213>178px; overflow-x hidden; glyph range outside no; Osasuna |
| 360x640 | playerOne-local-manager-one | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 211>176px; overflow-x hidden; glyph range outside no; ? |
| 360x640 | playerOne-local-manager-one | Primary action in first screenful | #openClubPack | yes; 286×52px; top/bottom 580/632px; DRAW LOCKED...; disabled; center unobscured yes |
| 360x640 | playerOne-local-manager-two | Horizontal scrollbar | html / body | no; scroll/client 360/360px; overflow hidden/hidden |
| 360x640 | playerOne-local-manager-two | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 360x640 | playerOne-local-manager-two | Touch control <44px | #clubWheelScreen | 0 of 1 visible controls |
| 360x640 | playerOne-local-manager-two | Text scrollWidth > clientWidth | #clubWheelScreen | 7 candidates |
| 360x640 | playerOne-local-manager-two | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(1) | 15>14px; overflow-x visible; glyph range outside no; 01 DRAW |
| 360x640 | playerOne-local-manager-two | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(2) | 15>14px; overflow-x visible; glyph range outside no; 02 PACK 1 |
| 360x640 | playerOne-local-manager-two | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.active:nth-of-type(3) | 25>14px; overflow-x visible; glyph range outside no; 03 PACK 2 |
| 360x640 | playerOne-local-manager-two | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span:nth-of-type(4) | 15>14px; overflow-x visible; glyph range outside no; 04 VS |
| 360x640 | playerOne-local-manager-two | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span:nth-of-type(5) | 15>14px; overflow-x visible; glyph range outside no; 05 LOCK |
| 360x640 | playerOne-local-manager-two | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 213>178px; overflow-x hidden; glyph range outside no; Osasuna |
| 360x640 | playerOne-local-manager-two | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 211>176px; overflow-x hidden; glyph range outside no; Espanyol |
| 360x640 | playerOne-local-manager-two | Primary action in first screenful | #openClubPack | yes; 286×52px; top/bottom 580/632px; DRAW LOCKED...; disabled; center unobscured yes |
| 360x640 | playerOne-local-versus | Horizontal scrollbar | html / body | no; scroll/client 360/360px; overflow hidden/hidden |
| 360x640 | playerOne-local-versus | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 360x640 | playerOne-local-versus | Touch control <44px | #clubWheelScreen | 0 of 0 visible controls |
| 360x640 | playerOne-local-versus | Text scrollWidth > clientWidth | #clubWheelScreen | 8 candidates |
| 360x640 | playerOne-local-versus | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(1) | 15>14px; overflow-x visible; glyph range outside no; 01 DRAW |
| 360x640 | playerOne-local-versus | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(2) | 15>14px; overflow-x visible; glyph range outside no; 02 PACK 1 |
| 360x640 | playerOne-local-versus | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(3) | 15>14px; overflow-x visible; glyph range outside no; 03 PACK 2 |
| 360x640 | playerOne-local-versus | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.active:nth-of-type(4) | 15>14px; overflow-x visible; glyph range outside no; 04 VS |
| 360x640 | playerOne-local-versus | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span:nth-of-type(5) | 15>14px; overflow-x visible; glyph range outside no; 05 LOCK |
| 360x640 | playerOne-local-versus | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 213>178px; overflow-x hidden; glyph range outside no; Osasuna |
| 360x640 | playerOne-local-versus | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 211>176px; overflow-x hidden; glyph range outside no; Espanyol |
| 360x640 | playerOne-local-versus | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 78>73px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 360x640 | playerOne-local-versus | Primary action in first screenful | none | N/A no visible action |
| 360x640 | playerOne-local-confirmation | Horizontal scrollbar | html / body | no; scroll/client 360/360px; overflow hidden/hidden |
| 360x640 | playerOne-local-confirmation | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 360x640 | playerOne-local-confirmation | Touch control <44px | #clubWheelScreen | 0 of 1 visible controls |
| 360x640 | playerOne-local-confirmation | Text scrollWidth > clientWidth | #clubWheelScreen | 8 candidates |
| 360x640 | playerOne-local-confirmation | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(1) | 15>14px; overflow-x visible; glyph range outside no; 01 DRAW |
| 360x640 | playerOne-local-confirmation | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(2) | 15>14px; overflow-x visible; glyph range outside no; 02 PACK 1 |
| 360x640 | playerOne-local-confirmation | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(3) | 15>14px; overflow-x visible; glyph range outside no; 03 PACK 2 |
| 360x640 | playerOne-local-confirmation | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(4) | 15>14px; overflow-x visible; glyph range outside no; 04 VS |
| 360x640 | playerOne-local-confirmation | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.active:nth-of-type(5) | 20>14px; overflow-x visible; glyph range outside no; 05 LOCK |
| 360x640 | playerOne-local-confirmation | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 213>178px; overflow-x hidden; glyph range outside no; Osasuna |
| 360x640 | playerOne-local-confirmation | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 211>176px; overflow-x hidden; glyph range outside no; Espanyol |
| 360x640 | playerOne-local-confirmation | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 78>73px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 360x640 | playerOne-local-confirmation | Overlap | .clubRivalryLockNote / #continueClubAssignment | 278×21px intersection |
| 360x640 | playerOne-local-confirmation | Primary action in first screenful | #continueClubAssignment | yes; 286×52px; top/bottom 579/631px; CONFIRM RIVALRY & START SHOWDOWN; center unobscured yes |
| 360x640 | playerTwo-sealed | Horizontal scrollbar | html / body | no; scroll/client 360/360px; overflow hidden/hidden |
| 360x640 | playerTwo-sealed | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 360x640 | playerTwo-sealed | Touch control <44px | #clubWheelScreen | 0 of 1 visible controls |
| 360x640 | playerTwo-sealed | Text scrollWidth > clientWidth | #clubWheelScreen | 5 candidates |
| 360x640 | playerTwo-sealed | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-is-animating:nth-of-type(2) > span:nth-of-type(1) | 15>14px; overflow-x visible; glyph range outside no; 01 DRAW |
| 360x640 | playerTwo-sealed | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-is-animating:nth-of-type(2) > span:nth-of-type(2) | 15>14px; overflow-x visible; glyph range outside no; 02 PACK 1 |
| 360x640 | playerTwo-sealed | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-is-animating:nth-of-type(2) > span:nth-of-type(3) | 15>14px; overflow-x visible; glyph range outside no; 03 PACK 2 |
| 360x640 | playerTwo-sealed | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-is-animating:nth-of-type(2) > span:nth-of-type(4) | 15>14px; overflow-x visible; glyph range outside no; 04 VS |
| 360x640 | playerTwo-sealed | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-is-animating:nth-of-type(2) > span:nth-of-type(5) | 15>14px; overflow-x visible; glyph range outside no; 05 LOCK |
| 360x640 | playerTwo-sealed | Primary action in first screenful | #openClubPack | yes; 286×52px; top/bottom 580/632px; WAITING FOR HOST PACK REVEAL; disabled; center unobscured yes |
| 360x640 | playerTwo-opening | Horizontal scrollbar | html / body | no; scroll/client 360/360px; overflow hidden/hidden |
| 360x640 | playerTwo-opening | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 360x640 | playerTwo-opening | Touch control <44px | #clubWheelScreen | 0 of 0 visible controls |
| 360x640 | playerTwo-opening | Text scrollWidth > clientWidth | #clubWheelScreen | 5 candidates |
| 360x640 | playerTwo-opening | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-is-animating:nth-of-type(2) > span.active:nth-of-type(1) | 21>14px; overflow-x visible; glyph range outside no; 01 DRAW |
| 360x640 | playerTwo-opening | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-is-animating:nth-of-type(2) > span:nth-of-type(2) | 15>14px; overflow-x visible; glyph range outside no; 02 PACK 1 |
| 360x640 | playerTwo-opening | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-is-animating:nth-of-type(2) > span:nth-of-type(3) | 15>14px; overflow-x visible; glyph range outside no; 03 PACK 2 |
| 360x640 | playerTwo-opening | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-is-animating:nth-of-type(2) > span:nth-of-type(4) | 15>14px; overflow-x visible; glyph range outside no; 04 VS |
| 360x640 | playerTwo-opening | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-is-animating:nth-of-type(2) > span:nth-of-type(5) | 15>14px; overflow-x visible; glyph range outside no; 05 LOCK |
| 360x640 | playerTwo-opening | Primary action in first screenful | none | N/A no visible action |
| 360x640 | playerTwo-manager-one | Horizontal scrollbar | html / body | no; scroll/client 360/360px; overflow hidden/hidden |
| 360x640 | playerTwo-manager-one | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 360x640 | playerTwo-manager-one | Touch control <44px | #clubWheelScreen | 0 of 0 visible controls |
| 360x640 | playerTwo-manager-one | Text scrollWidth > clientWidth | #clubWheelScreen | 6 candidates |
| 360x640 | playerTwo-manager-one | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(1) | 15>14px; overflow-x visible; glyph range outside no; 01 DRAW |
| 360x640 | playerTwo-manager-one | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.active:nth-of-type(2) | 24>14px; overflow-x visible; glyph range outside no; 02 PACK 1 |
| 360x640 | playerTwo-manager-one | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span:nth-of-type(3) | 15>14px; overflow-x visible; glyph range outside no; 03 PACK 2 |
| 360x640 | playerTwo-manager-one | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span:nth-of-type(4) | 15>14px; overflow-x visible; glyph range outside no; 04 VS |
| 360x640 | playerTwo-manager-one | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span:nth-of-type(5) | 15>14px; overflow-x visible; glyph range outside no; 05 LOCK |
| 360x640 | playerTwo-manager-one | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span | 98>73px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 360x640 | playerTwo-manager-one | Primary action in first screenful | none | N/A no visible action |
| 360x640 | playerTwo-manager-two | Horizontal scrollbar | html / body | no; scroll/client 360/360px; overflow hidden/hidden |
| 360x640 | playerTwo-manager-two | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 360x640 | playerTwo-manager-two | Touch control <44px | #clubWheelScreen | 0 of 0 visible controls |
| 360x640 | playerTwo-manager-two | Text scrollWidth > clientWidth | #clubWheelScreen | 7 candidates |
| 360x640 | playerTwo-manager-two | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(1) | 15>14px; overflow-x visible; glyph range outside no; 01 DRAW |
| 360x640 | playerTwo-manager-two | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(2) | 15>14px; overflow-x visible; glyph range outside no; 02 PACK 1 |
| 360x640 | playerTwo-manager-two | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.active:nth-of-type(3) | 25>14px; overflow-x visible; glyph range outside no; 03 PACK 2 |
| 360x640 | playerTwo-manager-two | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span:nth-of-type(4) | 15>14px; overflow-x visible; glyph range outside no; 04 VS |
| 360x640 | playerTwo-manager-two | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span:nth-of-type(5) | 15>14px; overflow-x visible; glyph range outside no; 05 LOCK |
| 360x640 | playerTwo-manager-two | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 213>178px; overflow-x hidden; glyph range outside no; Osasuna |
| 360x640 | playerTwo-manager-two | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span | 98>73px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 360x640 | playerTwo-manager-two | Primary action in first screenful | none | N/A no visible action |
| 360x640 | playerTwo-clubs-locked-awaiting-season | Horizontal scrollbar | html / body | no; scroll/client 360/360px; overflow hidden/hidden |
| 360x640 | playerTwo-clubs-locked-awaiting-season | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 360x640 | playerTwo-clubs-locked-awaiting-season | Touch control <44px | #clubWheelScreen | 0 of 0 visible controls |
| 360x640 | playerTwo-clubs-locked-awaiting-season | Text scrollWidth > clientWidth | #clubWheelScreen | 8 candidates |
| 360x640 | playerTwo-clubs-locked-awaiting-season | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(1) | 15>14px; overflow-x visible; glyph range outside no; 01 DRAW |
| 360x640 | playerTwo-clubs-locked-awaiting-season | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(2) | 15>14px; overflow-x visible; glyph range outside no; 02 PACK 1 |
| 360x640 | playerTwo-clubs-locked-awaiting-season | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(3) | 15>14px; overflow-x visible; glyph range outside no; 03 PACK 2 |
| 360x640 | playerTwo-clubs-locked-awaiting-season | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(4) | 15>14px; overflow-x visible; glyph range outside no; 04 VS |
| 360x640 | playerTwo-clubs-locked-awaiting-season | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.active:nth-of-type(5) | 20>14px; overflow-x visible; glyph range outside no; 05 LOCK |
| 360x640 | playerTwo-clubs-locked-awaiting-season | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 213>178px; overflow-x hidden; glyph range outside no; Osasuna |
| 360x640 | playerTwo-clubs-locked-awaiting-season | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 211>176px; overflow-x hidden; glyph range outside no; Espanyol |
| 360x640 | playerTwo-clubs-locked-awaiting-season | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 78>73px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 360x640 | playerTwo-clubs-locked-awaiting-season | Overlap | .clubRivalryLockNote / #sharedShowdownSeasonChoice | 320×2.6px intersection |
| 360x640 | playerTwo-clubs-locked-awaiting-season | Primary action in first screenful | none | N/A no visible action |
| 360x640 | playerTwo-confirm | Horizontal scrollbar | html / body | no; scroll/client 360/360px; overflow hidden/hidden |
| 360x640 | playerTwo-confirm | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 360x640 | playerTwo-confirm | Touch control <44px | #clubWheelScreen | 0 of 1 visible controls |
| 360x640 | playerTwo-confirm | Text scrollWidth > clientWidth | #clubWheelScreen | 8 candidates |
| 360x640 | playerTwo-confirm | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(1) | 15>14px; overflow-x visible; glyph range outside no; 01 DRAW |
| 360x640 | playerTwo-confirm | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(2) | 15>14px; overflow-x visible; glyph range outside no; 02 PACK 1 |
| 360x640 | playerTwo-confirm | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(3) | 15>14px; overflow-x visible; glyph range outside no; 03 PACK 2 |
| 360x640 | playerTwo-confirm | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(4) | 15>14px; overflow-x visible; glyph range outside no; 04 VS |
| 360x640 | playerTwo-confirm | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.active:nth-of-type(5) | 20>14px; overflow-x visible; glyph range outside no; 05 LOCK |
| 360x640 | playerTwo-confirm | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 213>178px; overflow-x hidden; glyph range outside no; Osasuna |
| 360x640 | playerTwo-confirm | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 211>176px; overflow-x hidden; glyph range outside no; Espanyol |
| 360x640 | playerTwo-confirm | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 78>73px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 360x640 | playerTwo-confirm | Overlap | .clubRivalryLockNote / #continueClubAssignment | 278×20px intersection |
| 360x640 | playerTwo-confirm | Overlap | .clubRivalryLockNote / #sharedShowdownSeasonChoice | 320×2.6px intersection |
| 360x640 | playerTwo-confirm | Primary action in first screenful | #continueClubAssignment | yes; 286×52px; top/bottom 580/632px; CONFIRM SHARED SHOWDOWN; center unobscured yes |
| 360x640 | playerTwo-confirm-write-failure | Horizontal scrollbar | html / body | no; scroll/client 360/360px; overflow hidden/hidden |
| 360x640 | playerTwo-confirm-write-failure | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 360x640 | playerTwo-confirm-write-failure | Touch control <44px | #clubWheelScreen | 0 of 1 visible controls |
| 360x640 | playerTwo-confirm-write-failure | Text scrollWidth > clientWidth | #clubWheelScreen | 8 candidates |
| 360x640 | playerTwo-confirm-write-failure | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(1) | 15>14px; overflow-x visible; glyph range outside no; 01 DRAW |
| 360x640 | playerTwo-confirm-write-failure | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(2) | 15>14px; overflow-x visible; glyph range outside no; 02 PACK 1 |
| 360x640 | playerTwo-confirm-write-failure | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(3) | 15>14px; overflow-x visible; glyph range outside no; 03 PACK 2 |
| 360x640 | playerTwo-confirm-write-failure | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(4) | 15>14px; overflow-x visible; glyph range outside no; 04 VS |
| 360x640 | playerTwo-confirm-write-failure | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.active:nth-of-type(5) | 20>14px; overflow-x visible; glyph range outside no; 05 LOCK |
| 360x640 | playerTwo-confirm-write-failure | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 213>178px; overflow-x hidden; glyph range outside no; Osasuna |
| 360x640 | playerTwo-confirm-write-failure | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 211>176px; overflow-x hidden; glyph range outside no; Espanyol |
| 360x640 | playerTwo-confirm-write-failure | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 78>73px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 360x640 | playerTwo-confirm-write-failure | Overlap | .clubRivalryLockNote / #continueClubAssignment | 278×21px intersection |
| 360x640 | playerTwo-confirm-write-failure | Overlap | .clubRivalryLockNote / #sharedShowdownSeasonChoice | 320×2.6px intersection |
| 360x640 | playerTwo-confirm-write-failure | Primary action in first screenful | #continueClubAssignment | yes; 286×52px; top/bottom 579/631px; CONFIRM SHARED SHOWDOWN; center unobscured yes |
| 360x640 | playerTwo-waiting-rival | Horizontal scrollbar | html / body | no; scroll/client 360/360px; overflow hidden/hidden |
| 360x640 | playerTwo-waiting-rival | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 360x640 | playerTwo-waiting-rival | Touch control <44px | #clubWheelScreen | 0 of 1 visible controls |
| 360x640 | playerTwo-waiting-rival | Text scrollWidth > clientWidth | #clubWheelScreen | 8 candidates |
| 360x640 | playerTwo-waiting-rival | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(1) | 15>14px; overflow-x visible; glyph range outside no; 01 DRAW |
| 360x640 | playerTwo-waiting-rival | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(2) | 15>14px; overflow-x visible; glyph range outside no; 02 PACK 1 |
| 360x640 | playerTwo-waiting-rival | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(3) | 15>14px; overflow-x visible; glyph range outside no; 03 PACK 2 |
| 360x640 | playerTwo-waiting-rival | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(4) | 15>14px; overflow-x visible; glyph range outside no; 04 VS |
| 360x640 | playerTwo-waiting-rival | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.active:nth-of-type(5) | 20>14px; overflow-x visible; glyph range outside no; 05 LOCK |
| 360x640 | playerTwo-waiting-rival | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 213>178px; overflow-x hidden; glyph range outside no; Osasuna |
| 360x640 | playerTwo-waiting-rival | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 211>176px; overflow-x hidden; glyph range outside no; Espanyol |
| 360x640 | playerTwo-waiting-rival | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 78>73px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 360x640 | playerTwo-waiting-rival | Overlap | .clubRivalryLockNote / #continueClubAssignment | 278×20px intersection |
| 360x640 | playerTwo-waiting-rival | Overlap | .clubRivalryLockNote / #sharedShowdownSeasonChoice | 320×2.6px intersection |
| 360x640 | playerTwo-waiting-rival | Primary action in first screenful | #continueClubAssignment | yes; 286×52px; top/bottom 580/632px; CONFIRMED · WAITING FOR RIVAL; disabled; center unobscured yes |
| 360x640 | playerTwo-reconnect | Horizontal scrollbar | html / body | no; scroll/client 360/360px; overflow hidden/hidden |
| 360x640 | playerTwo-reconnect | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 360x640 | playerTwo-reconnect | Touch control <44px | #clubWheelScreen | 0 of 1 visible controls |
| 360x640 | playerTwo-reconnect | Text scrollWidth > clientWidth | #clubWheelScreen | 8 candidates |
| 360x640 | playerTwo-reconnect | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(1) | 15>14px; overflow-x visible; glyph range outside no; 01 DRAW |
| 360x640 | playerTwo-reconnect | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(2) | 15>14px; overflow-x visible; glyph range outside no; 02 PACK 1 |
| 360x640 | playerTwo-reconnect | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(3) | 15>14px; overflow-x visible; glyph range outside no; 03 PACK 2 |
| 360x640 | playerTwo-reconnect | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(4) | 15>14px; overflow-x visible; glyph range outside no; 04 VS |
| 360x640 | playerTwo-reconnect | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.active:nth-of-type(5) | 20>14px; overflow-x visible; glyph range outside no; 05 LOCK |
| 360x640 | playerTwo-reconnect | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 213>178px; overflow-x hidden; glyph range outside no; Osasuna |
| 360x640 | playerTwo-reconnect | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 211>176px; overflow-x hidden; glyph range outside no; Espanyol |
| 360x640 | playerTwo-reconnect | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 78>73px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 360x640 | playerTwo-reconnect | Overlap | .clubRivalryLockNote / #continueClubAssignment | 278×20px intersection |
| 360x640 | playerTwo-reconnect | Overlap | .clubRivalryLockNote / #sharedShowdownSeasonChoice | 320×2.6px intersection |
| 360x640 | playerTwo-reconnect | Primary action in first screenful | #continueClubAssignment | yes; 286×52px; top/bottom 580/632px; RECONNECT PLAYERS TO CONTINUE; disabled; center unobscured yes |
| 360x640 | playerTwo-career-start-ready | Horizontal scrollbar | html / body | no; scroll/client 360/360px; overflow hidden/hidden |
| 360x640 | playerTwo-career-start-ready | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 360x640 | playerTwo-career-start-ready | Touch control <44px | #clubWheelScreen | 0 of 1 visible controls |
| 360x640 | playerTwo-career-start-ready | Text scrollWidth > clientWidth | #clubWheelScreen | 8 candidates |
| 360x640 | playerTwo-career-start-ready | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(1) | 15>14px; overflow-x visible; glyph range outside no; 01 DRAW |
| 360x640 | playerTwo-career-start-ready | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(2) | 15>14px; overflow-x visible; glyph range outside no; 02 PACK 1 |
| 360x640 | playerTwo-career-start-ready | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(3) | 15>14px; overflow-x visible; glyph range outside no; 03 PACK 2 |
| 360x640 | playerTwo-career-start-ready | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(4) | 15>14px; overflow-x visible; glyph range outside no; 04 VS |
| 360x640 | playerTwo-career-start-ready | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.active:nth-of-type(5) | 20>14px; overflow-x visible; glyph range outside no; 05 LOCK |
| 360x640 | playerTwo-career-start-ready | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 213>178px; overflow-x hidden; glyph range outside no; Osasuna |
| 360x640 | playerTwo-career-start-ready | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 211>176px; overflow-x hidden; glyph range outside no; Espanyol |
| 360x640 | playerTwo-career-start-ready | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 78>73px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 360x640 | playerTwo-career-start-ready | Overlap | .clubRivalryLockNote / #continueClubAssignment | 278×21px intersection |
| 360x640 | playerTwo-career-start-ready | Overlap | .clubRivalryLockNote / #sharedShowdownSeasonChoice | 320×2.6px intersection |
| 360x640 | playerTwo-career-start-ready | Primary action in first screenful | #continueClubAssignment | yes; 286×52px; top/bottom 579/631px; CONTINUE TO CAREER START; center unobscured yes |
| 360x640 | playerTwo-season-mismatch | Horizontal scrollbar | html / body | no; scroll/client 360/360px; overflow hidden/hidden |
| 360x640 | playerTwo-season-mismatch | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 360x640 | playerTwo-season-mismatch | Touch control <44px | #clubWheelScreen | 0 of 1 visible controls |
| 360x640 | playerTwo-season-mismatch | Text scrollWidth > clientWidth | #clubWheelScreen | 8 candidates |
| 360x640 | playerTwo-season-mismatch | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(1) | 15>14px; overflow-x visible; glyph range outside no; 01 DRAW |
| 360x640 | playerTwo-season-mismatch | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(2) | 15>14px; overflow-x visible; glyph range outside no; 02 PACK 1 |
| 360x640 | playerTwo-season-mismatch | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(3) | 15>14px; overflow-x visible; glyph range outside no; 03 PACK 2 |
| 360x640 | playerTwo-season-mismatch | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(4) | 15>14px; overflow-x visible; glyph range outside no; 04 VS |
| 360x640 | playerTwo-season-mismatch | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.active:nth-of-type(5) | 20>14px; overflow-x visible; glyph range outside no; 05 LOCK |
| 360x640 | playerTwo-season-mismatch | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 213>178px; overflow-x hidden; glyph range outside no; Osasuna |
| 360x640 | playerTwo-season-mismatch | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 211>176px; overflow-x hidden; glyph range outside no; Espanyol |
| 360x640 | playerTwo-season-mismatch | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 78>73px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 360x640 | playerTwo-season-mismatch | Overlap | .clubRivalryLockNote / #continueClubAssignment | 278×20px intersection |
| 360x640 | playerTwo-season-mismatch | Overlap | .clubRivalryLockNote / #sharedShowdownSeasonChoice | 320×2.6px intersection |
| 360x640 | playerTwo-season-mismatch | Primary action in first screenful | #continueClubAssignment | yes; 286×52px; top/bottom 580/632px; SEASON PLAN MISMATCH · RECOVERY REQUIRED; disabled; center unobscured yes |
| 360x640 | playerTwo-long-club-names | Horizontal scrollbar | html / body | no; scroll/client 360/360px; overflow hidden/hidden |
| 360x640 | playerTwo-long-club-names | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 360x640 | playerTwo-long-club-names | Touch control <44px | #clubWheelScreen | 0 of 1 visible controls |
| 360x640 | playerTwo-long-club-names | Text scrollWidth > clientWidth | #clubWheelScreen | 8 candidates |
| 360x640 | playerTwo-long-club-names | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(1) | 15>14px; overflow-x visible; glyph range outside no; 01 DRAW |
| 360x640 | playerTwo-long-club-names | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(2) | 15>14px; overflow-x visible; glyph range outside no; 02 PACK 1 |
| 360x640 | playerTwo-long-club-names | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(3) | 15>14px; overflow-x visible; glyph range outside no; 03 PACK 2 |
| 360x640 | playerTwo-long-club-names | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(4) | 15>14px; overflow-x visible; glyph range outside no; 04 VS |
| 360x640 | playerTwo-long-club-names | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.active:nth-of-type(5) | 20>14px; overflow-x visible; glyph range outside no; 05 LOCK |
| 360x640 | playerTwo-long-club-names | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 213>178px; overflow-x hidden; glyph range outside no; Deportivo La Coruña |
| 360x640 | playerTwo-long-club-names | Text clipped (glyph range) | #clubNameTwo | 211>176px; overflow-x hidden; glyph range outside yes; Borussia Mönchengladbach |
| 360x640 | playerTwo-long-club-names | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 78>73px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 360x640 | playerTwo-long-club-names | Overlap | .clubRivalryLockNote / #continueClubAssignment | 278×21px intersection |
| 360x640 | playerTwo-long-club-names | Overlap | .clubRivalryLockNote / #sharedShowdownSeasonChoice | 320×2.6px intersection |
| 360x640 | playerTwo-long-club-names | Primary action in first screenful | #continueClubAssignment | yes; 286×52px; top/bottom 579/631px; CONFIRM SHARED SHOWDOWN; center unobscured yes |
| 360x640 | playerOne-confirmation-overlap-detail | Horizontal scrollbar | html / body | no; scroll/client 360/360px; overflow hidden/hidden |
| 360x640 | playerOne-confirmation-overlap-detail | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 360x640 | playerOne-confirmation-overlap-detail | Touch control <44px | #clubWheelScreen | 0 of 1 visible controls |
| 360x640 | playerOne-confirmation-overlap-detail | Text scrollWidth > clientWidth | #clubWheelScreen | 8 candidates |
| 360x640 | playerOne-confirmation-overlap-detail | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(1) | 15>14px; overflow-x visible; glyph range outside no; 01 DRAW |
| 360x640 | playerOne-confirmation-overlap-detail | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(2) | 15>14px; overflow-x visible; glyph range outside no; 02 PACK 1 |
| 360x640 | playerOne-confirmation-overlap-detail | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(3) | 15>14px; overflow-x visible; glyph range outside no; 03 PACK 2 |
| 360x640 | playerOne-confirmation-overlap-detail | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(4) | 15>14px; overflow-x visible; glyph range outside no; 04 VS |
| 360x640 | playerOne-confirmation-overlap-detail | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.active:nth-of-type(5) | 20>14px; overflow-x visible; glyph range outside no; 05 LOCK |
| 360x640 | playerOne-confirmation-overlap-detail | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 213>178px; overflow-x hidden; glyph range outside no; Osasuna |
| 360x640 | playerOne-confirmation-overlap-detail | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 211>176px; overflow-x hidden; glyph range outside no; Espanyol |
| 360x640 | playerOne-confirmation-overlap-detail | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 78>73px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 360x640 | playerOne-confirmation-overlap-detail | Overlap | .clubRivalryLockNote / #continueClubAssignment | 278×20px intersection |
| 360x640 | playerOne-confirmation-overlap-detail | Overlap | .clubRivalryLockNote / #sharedShowdownSeasonChoice | 320×2.6px intersection |
| 360x640 | playerOne-confirmation-overlap-detail | Primary action in first screenful | #continueClubAssignment | yes; 286×52px; top/bottom 580/632px; CONFIRM SHARED SHOWDOWN; center unobscured yes |
| 360x640 | playerTwo-confirmation-overlap-detail | Horizontal scrollbar | html / body | no; scroll/client 360/360px; overflow hidden/hidden |
| 360x640 | playerTwo-confirmation-overlap-detail | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 360x640 | playerTwo-confirmation-overlap-detail | Touch control <44px | #clubWheelScreen | 0 of 1 visible controls |
| 360x640 | playerTwo-confirmation-overlap-detail | Text scrollWidth > clientWidth | #clubWheelScreen | 8 candidates |
| 360x640 | playerTwo-confirmation-overlap-detail | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(1) | 15>14px; overflow-x visible; glyph range outside no; 01 DRAW |
| 360x640 | playerTwo-confirmation-overlap-detail | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(2) | 15>14px; overflow-x visible; glyph range outside no; 02 PACK 1 |
| 360x640 | playerTwo-confirmation-overlap-detail | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(3) | 15>14px; overflow-x visible; glyph range outside no; 03 PACK 2 |
| 360x640 | playerTwo-confirmation-overlap-detail | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(4) | 15>14px; overflow-x visible; glyph range outside no; 04 VS |
| 360x640 | playerTwo-confirmation-overlap-detail | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.active:nth-of-type(5) | 20>14px; overflow-x visible; glyph range outside no; 05 LOCK |
| 360x640 | playerTwo-confirmation-overlap-detail | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 213>178px; overflow-x hidden; glyph range outside no; Osasuna |
| 360x640 | playerTwo-confirmation-overlap-detail | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 211>176px; overflow-x hidden; glyph range outside no; Espanyol |
| 360x640 | playerTwo-confirmation-overlap-detail | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 78>73px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 360x640 | playerTwo-confirmation-overlap-detail | Overlap | .clubRivalryLockNote / #continueClubAssignment | 278×20px intersection |
| 360x640 | playerTwo-confirmation-overlap-detail | Overlap | .clubRivalryLockNote / #sharedShowdownSeasonChoice | 320×2.6px intersection |
| 360x640 | playerTwo-confirmation-overlap-detail | Primary action in first screenful | #continueClubAssignment | yes; 286×52px; top/bottom 580/632px; CONFIRM SHARED SHOWDOWN; center unobscured yes |
| 390x844 | playerOne-sealed | Horizontal scrollbar | html / body | no; scroll/client 390/390px; overflow hidden/hidden |
| 390x844 | playerOne-sealed | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 390x844 | playerOne-sealed | Touch control <44px | #clubWheelScreen | 0 of 1 visible controls |
| 390x844 | playerOne-sealed | Text scrollWidth > clientWidth | #clubWheelScreen | 0 candidates |
| 390x844 | playerOne-sealed | Primary action in first screenful | #openClubPack | yes; 316×52px; top/bottom 784/836px; OPEN SHOWDOWN PACKS; center unobscured yes |
| 390x844 | playerOne-provider-working | Horizontal scrollbar | html / body | no; scroll/client 390/390px; overflow hidden/hidden |
| 390x844 | playerOne-provider-working | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 390x844 | playerOne-provider-working | Touch control <44px | #clubWheelScreen | 0 of 1 visible controls |
| 390x844 | playerOne-provider-working | Text scrollWidth > clientWidth | #clubWheelScreen | 5 candidates |
| 390x844 | playerOne-provider-working | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span:nth-of-type(1) | 15>14px; overflow-x visible; glyph range outside no; 01 DRAW |
| 390x844 | playerOne-provider-working | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span:nth-of-type(2) | 15>14px; overflow-x visible; glyph range outside no; 02 PACK 1 |
| 390x844 | playerOne-provider-working | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span:nth-of-type(3) | 15>14px; overflow-x visible; glyph range outside no; 03 PACK 2 |
| 390x844 | playerOne-provider-working | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span:nth-of-type(4) | 15>14px; overflow-x visible; glyph range outside no; 04 VS |
| 390x844 | playerOne-provider-working | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span:nth-of-type(5) | 15>14px; overflow-x visible; glyph range outside no; 05 LOCK |
| 390x844 | playerOne-provider-working | Primary action in first screenful | #openClubPack | yes; 316×52px; top/bottom 784/836px; WORKING…; disabled; center unobscured yes |
| 390x844 | playerOne-pack-write-failure | Horizontal scrollbar | html / body | no; scroll/client 390/390px; overflow hidden/hidden |
| 390x844 | playerOne-pack-write-failure | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 390x844 | playerOne-pack-write-failure | Touch control <44px | #clubWheelScreen | 0 of 1 visible controls |
| 390x844 | playerOne-pack-write-failure | Text scrollWidth > clientWidth | #clubWheelScreen | 5 candidates |
| 390x844 | playerOne-pack-write-failure | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span:nth-of-type(1) | 15>14px; overflow-x visible; glyph range outside no; 01 DRAW |
| 390x844 | playerOne-pack-write-failure | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span:nth-of-type(2) | 15>14px; overflow-x visible; glyph range outside no; 02 PACK 1 |
| 390x844 | playerOne-pack-write-failure | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span:nth-of-type(3) | 15>14px; overflow-x visible; glyph range outside no; 03 PACK 2 |
| 390x844 | playerOne-pack-write-failure | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span:nth-of-type(4) | 15>14px; overflow-x visible; glyph range outside no; 04 VS |
| 390x844 | playerOne-pack-write-failure | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span:nth-of-type(5) | 15>14px; overflow-x visible; glyph range outside no; 05 LOCK |
| 390x844 | playerOne-pack-write-failure | Primary action in first screenful | #openClubPack | yes; 316×52px; top/bottom 783/835px; OPEN SHOWDOWN PACKS; center unobscured yes |
| 390x844 | playerOne-opening | Horizontal scrollbar | html / body | no; scroll/client 390/390px; overflow hidden/hidden |
| 390x844 | playerOne-opening | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 390x844 | playerOne-opening | Touch control <44px | #clubWheelScreen | 0 of 0 visible controls |
| 390x844 | playerOne-opening | Text scrollWidth > clientWidth | #clubWheelScreen | 6 candidates |
| 390x844 | playerOne-opening | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.active:nth-of-type(1) | 21>14px; overflow-x visible; glyph range outside no; 01 DRAW |
| 390x844 | playerOne-opening | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span:nth-of-type(2) | 15>14px; overflow-x visible; glyph range outside no; 02 PACK 1 |
| 390x844 | playerOne-opening | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span:nth-of-type(3) | 15>14px; overflow-x visible; glyph range outside no; 03 PACK 2 |
| 390x844 | playerOne-opening | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span:nth-of-type(4) | 15>14px; overflow-x visible; glyph range outside no; 04 VS |
| 390x844 | playerOne-opening | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span:nth-of-type(5) | 15>14px; overflow-x visible; glyph range outside no; 05 LOCK |
| 390x844 | playerOne-opening | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span | 98>73px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 390x844 | playerOne-opening | Primary action in first screenful | none | N/A no visible action |
| 390x844 | playerOne-manager-one | Horizontal scrollbar | html / body | no; scroll/client 390/390px; overflow hidden/hidden |
| 390x844 | playerOne-manager-one | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 390x844 | playerOne-manager-one | Touch control <44px | #clubWheelScreen | 0 of 0 visible controls |
| 390x844 | playerOne-manager-one | Text scrollWidth > clientWidth | #clubWheelScreen | 6 candidates |
| 390x844 | playerOne-manager-one | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(1) | 15>14px; overflow-x visible; glyph range outside no; 01 DRAW |
| 390x844 | playerOne-manager-one | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.active:nth-of-type(2) | 24>14px; overflow-x visible; glyph range outside no; 02 PACK 1 |
| 390x844 | playerOne-manager-one | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span:nth-of-type(3) | 15>14px; overflow-x visible; glyph range outside no; 03 PACK 2 |
| 390x844 | playerOne-manager-one | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span:nth-of-type(4) | 15>14px; overflow-x visible; glyph range outside no; 04 VS |
| 390x844 | playerOne-manager-one | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span:nth-of-type(5) | 15>14px; overflow-x visible; glyph range outside no; 05 LOCK |
| 390x844 | playerOne-manager-one | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span | 98>73px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 390x844 | playerOne-manager-one | Primary action in first screenful | none | N/A no visible action |
| 390x844 | playerOne-manager-two | Horizontal scrollbar | html / body | no; scroll/client 390/390px; overflow hidden/hidden |
| 390x844 | playerOne-manager-two | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 390x844 | playerOne-manager-two | Touch control <44px | #clubWheelScreen | 0 of 0 visible controls |
| 390x844 | playerOne-manager-two | Text scrollWidth > clientWidth | #clubWheelScreen | 7 candidates |
| 390x844 | playerOne-manager-two | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(1) | 15>14px; overflow-x visible; glyph range outside no; 01 DRAW |
| 390x844 | playerOne-manager-two | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(2) | 15>14px; overflow-x visible; glyph range outside no; 02 PACK 1 |
| 390x844 | playerOne-manager-two | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.active:nth-of-type(3) | 25>14px; overflow-x visible; glyph range outside no; 03 PACK 2 |
| 390x844 | playerOne-manager-two | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span:nth-of-type(4) | 15>14px; overflow-x visible; glyph range outside no; 04 VS |
| 390x844 | playerOne-manager-two | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span:nth-of-type(5) | 15>14px; overflow-x visible; glyph range outside no; 05 LOCK |
| 390x844 | playerOne-manager-two | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 248>208px; overflow-x hidden; glyph range outside no; Osasuna |
| 390x844 | playerOne-manager-two | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span | 98>73px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 390x844 | playerOne-manager-two | Primary action in first screenful | none | N/A no visible action |
| 390x844 | playerOne-confirm | Horizontal scrollbar | html / body | no; scroll/client 390/390px; overflow hidden/hidden |
| 390x844 | playerOne-confirm | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 390x844 | playerOne-confirm | Touch control <44px | #clubWheelScreen | 0 of 1 visible controls |
| 390x844 | playerOne-confirm | Text scrollWidth > clientWidth | #clubWheelScreen | 8 candidates |
| 390x844 | playerOne-confirm | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(1) | 15>14px; overflow-x visible; glyph range outside no; 01 DRAW |
| 390x844 | playerOne-confirm | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(2) | 15>14px; overflow-x visible; glyph range outside no; 02 PACK 1 |
| 390x844 | playerOne-confirm | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(3) | 15>14px; overflow-x visible; glyph range outside no; 03 PACK 2 |
| 390x844 | playerOne-confirm | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(4) | 15>14px; overflow-x visible; glyph range outside no; 04 VS |
| 390x844 | playerOne-confirm | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.active:nth-of-type(5) | 20>14px; overflow-x visible; glyph range outside no; 05 LOCK |
| 390x844 | playerOne-confirm | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 248>208px; overflow-x hidden; glyph range outside no; Osasuna |
| 390x844 | playerOne-confirm | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 246>206px; overflow-x hidden; glyph range outside no; Espanyol |
| 390x844 | playerOne-confirm | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 78>73px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 390x844 | playerOne-confirm | Primary action in first screenful | #continueClubAssignment | yes; 316×52px; top/bottom 783/835px; CONFIRM SHARED SHOWDOWN; center unobscured yes |
| 390x844 | playerOne-confirm-write-failure | Horizontal scrollbar | html / body | no; scroll/client 390/390px; overflow hidden/hidden |
| 390x844 | playerOne-confirm-write-failure | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 390x844 | playerOne-confirm-write-failure | Touch control <44px | #clubWheelScreen | 0 of 1 visible controls |
| 390x844 | playerOne-confirm-write-failure | Text scrollWidth > clientWidth | #clubWheelScreen | 8 candidates |
| 390x844 | playerOne-confirm-write-failure | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(1) | 15>14px; overflow-x visible; glyph range outside no; 01 DRAW |
| 390x844 | playerOne-confirm-write-failure | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(2) | 15>14px; overflow-x visible; glyph range outside no; 02 PACK 1 |
| 390x844 | playerOne-confirm-write-failure | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(3) | 15>14px; overflow-x visible; glyph range outside no; 03 PACK 2 |
| 390x844 | playerOne-confirm-write-failure | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(4) | 15>14px; overflow-x visible; glyph range outside no; 04 VS |
| 390x844 | playerOne-confirm-write-failure | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.active:nth-of-type(5) | 20>14px; overflow-x visible; glyph range outside no; 05 LOCK |
| 390x844 | playerOne-confirm-write-failure | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 248>208px; overflow-x hidden; glyph range outside no; Osasuna |
| 390x844 | playerOne-confirm-write-failure | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 246>206px; overflow-x hidden; glyph range outside no; Espanyol |
| 390x844 | playerOne-confirm-write-failure | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 78>73px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 390x844 | playerOne-confirm-write-failure | Primary action in first screenful | #continueClubAssignment | yes; 316×52px; top/bottom 783/835px; CONFIRM SHARED SHOWDOWN; center unobscured yes |
| 390x844 | playerOne-waiting-rival | Horizontal scrollbar | html / body | no; scroll/client 390/390px; overflow hidden/hidden |
| 390x844 | playerOne-waiting-rival | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 390x844 | playerOne-waiting-rival | Touch control <44px | #clubWheelScreen | 0 of 1 visible controls |
| 390x844 | playerOne-waiting-rival | Text scrollWidth > clientWidth | #clubWheelScreen | 8 candidates |
| 390x844 | playerOne-waiting-rival | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(1) | 15>14px; overflow-x visible; glyph range outside no; 01 DRAW |
| 390x844 | playerOne-waiting-rival | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(2) | 15>14px; overflow-x visible; glyph range outside no; 02 PACK 1 |
| 390x844 | playerOne-waiting-rival | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(3) | 15>14px; overflow-x visible; glyph range outside no; 03 PACK 2 |
| 390x844 | playerOne-waiting-rival | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(4) | 15>14px; overflow-x visible; glyph range outside no; 04 VS |
| 390x844 | playerOne-waiting-rival | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.active:nth-of-type(5) | 20>14px; overflow-x visible; glyph range outside no; 05 LOCK |
| 390x844 | playerOne-waiting-rival | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 248>208px; overflow-x hidden; glyph range outside no; Osasuna |
| 390x844 | playerOne-waiting-rival | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 246>206px; overflow-x hidden; glyph range outside no; Espanyol |
| 390x844 | playerOne-waiting-rival | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 78>73px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 390x844 | playerOne-waiting-rival | Primary action in first screenful | #continueClubAssignment | yes; 316×52px; top/bottom 784/836px; CONFIRMED · WAITING FOR RIVAL; disabled; center unobscured yes |
| 390x844 | playerOne-reconnect | Horizontal scrollbar | html / body | no; scroll/client 390/390px; overflow hidden/hidden |
| 390x844 | playerOne-reconnect | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 390x844 | playerOne-reconnect | Touch control <44px | #clubWheelScreen | 0 of 1 visible controls |
| 390x844 | playerOne-reconnect | Text scrollWidth > clientWidth | #clubWheelScreen | 8 candidates |
| 390x844 | playerOne-reconnect | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(1) | 15>14px; overflow-x visible; glyph range outside no; 01 DRAW |
| 390x844 | playerOne-reconnect | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(2) | 15>14px; overflow-x visible; glyph range outside no; 02 PACK 1 |
| 390x844 | playerOne-reconnect | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(3) | 15>14px; overflow-x visible; glyph range outside no; 03 PACK 2 |
| 390x844 | playerOne-reconnect | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(4) | 15>14px; overflow-x visible; glyph range outside no; 04 VS |
| 390x844 | playerOne-reconnect | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.active:nth-of-type(5) | 20>14px; overflow-x visible; glyph range outside no; 05 LOCK |
| 390x844 | playerOne-reconnect | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 248>208px; overflow-x hidden; glyph range outside no; Osasuna |
| 390x844 | playerOne-reconnect | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 246>206px; overflow-x hidden; glyph range outside no; Espanyol |
| 390x844 | playerOne-reconnect | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 78>73px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 390x844 | playerOne-reconnect | Primary action in first screenful | #continueClubAssignment | yes; 316×52px; top/bottom 784/836px; RECONNECT PLAYERS TO CONTINUE; disabled; center unobscured yes |
| 390x844 | playerOne-career-start-ready | Horizontal scrollbar | html / body | no; scroll/client 390/390px; overflow hidden/hidden |
| 390x844 | playerOne-career-start-ready | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 390x844 | playerOne-career-start-ready | Touch control <44px | #clubWheelScreen | 0 of 1 visible controls |
| 390x844 | playerOne-career-start-ready | Text scrollWidth > clientWidth | #clubWheelScreen | 8 candidates |
| 390x844 | playerOne-career-start-ready | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(1) | 15>14px; overflow-x visible; glyph range outside no; 01 DRAW |
| 390x844 | playerOne-career-start-ready | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(2) | 15>14px; overflow-x visible; glyph range outside no; 02 PACK 1 |
| 390x844 | playerOne-career-start-ready | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(3) | 15>14px; overflow-x visible; glyph range outside no; 03 PACK 2 |
| 390x844 | playerOne-career-start-ready | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(4) | 15>14px; overflow-x visible; glyph range outside no; 04 VS |
| 390x844 | playerOne-career-start-ready | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.active:nth-of-type(5) | 20>14px; overflow-x visible; glyph range outside no; 05 LOCK |
| 390x844 | playerOne-career-start-ready | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 248>208px; overflow-x hidden; glyph range outside no; Osasuna |
| 390x844 | playerOne-career-start-ready | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 246>206px; overflow-x hidden; glyph range outside no; Espanyol |
| 390x844 | playerOne-career-start-ready | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 78>73px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 390x844 | playerOne-career-start-ready | Primary action in first screenful | #continueClubAssignment | yes; 316×52px; top/bottom 783/835px; CONTINUE TO CAREER START; center unobscured yes |
| 390x844 | playerOne-season-mismatch | Horizontal scrollbar | html / body | no; scroll/client 390/390px; overflow hidden/hidden |
| 390x844 | playerOne-season-mismatch | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 390x844 | playerOne-season-mismatch | Touch control <44px | #clubWheelScreen | 0 of 1 visible controls |
| 390x844 | playerOne-season-mismatch | Text scrollWidth > clientWidth | #clubWheelScreen | 8 candidates |
| 390x844 | playerOne-season-mismatch | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(1) | 15>14px; overflow-x visible; glyph range outside no; 01 DRAW |
| 390x844 | playerOne-season-mismatch | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(2) | 15>14px; overflow-x visible; glyph range outside no; 02 PACK 1 |
| 390x844 | playerOne-season-mismatch | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(3) | 15>14px; overflow-x visible; glyph range outside no; 03 PACK 2 |
| 390x844 | playerOne-season-mismatch | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(4) | 15>14px; overflow-x visible; glyph range outside no; 04 VS |
| 390x844 | playerOne-season-mismatch | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.active:nth-of-type(5) | 20>14px; overflow-x visible; glyph range outside no; 05 LOCK |
| 390x844 | playerOne-season-mismatch | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 248>208px; overflow-x hidden; glyph range outside no; Osasuna |
| 390x844 | playerOne-season-mismatch | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 246>206px; overflow-x hidden; glyph range outside no; Espanyol |
| 390x844 | playerOne-season-mismatch | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 78>73px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 390x844 | playerOne-season-mismatch | Primary action in first screenful | #continueClubAssignment | yes; 316×52px; top/bottom 784/836px; SEASON PLAN MISMATCH · RECOVERY REQUIRED; disabled; center unobscured yes |
| 390x844 | playerOne-long-club-names | Horizontal scrollbar | html / body | no; scroll/client 390/390px; overflow hidden/hidden |
| 390x844 | playerOne-long-club-names | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 390x844 | playerOne-long-club-names | Touch control <44px | #clubWheelScreen | 0 of 1 visible controls |
| 390x844 | playerOne-long-club-names | Text scrollWidth > clientWidth | #clubWheelScreen | 8 candidates |
| 390x844 | playerOne-long-club-names | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(1) | 15>14px; overflow-x visible; glyph range outside no; 01 DRAW |
| 390x844 | playerOne-long-club-names | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(2) | 15>14px; overflow-x visible; glyph range outside no; 02 PACK 1 |
| 390x844 | playerOne-long-club-names | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(3) | 15>14px; overflow-x visible; glyph range outside no; 03 PACK 2 |
| 390x844 | playerOne-long-club-names | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(4) | 15>14px; overflow-x visible; glyph range outside no; 04 VS |
| 390x844 | playerOne-long-club-names | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.active:nth-of-type(5) | 20>14px; overflow-x visible; glyph range outside no; 05 LOCK |
| 390x844 | playerOne-long-club-names | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 248>208px; overflow-x hidden; glyph range outside no; Deportivo La Coruña |
| 390x844 | playerOne-long-club-names | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 246>206px; overflow-x hidden; glyph range outside no; Borussia Mönchengladbach |
| 390x844 | playerOne-long-club-names | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 78>73px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 390x844 | playerOne-long-club-names | Primary action in first screenful | #continueClubAssignment | yes; 316×52px; top/bottom 783/835px; CONFIRM SHARED SHOWDOWN; center unobscured yes |
| 390x844 | playerOne-local-ready | Horizontal scrollbar | html / body | no; scroll/client 390/390px; overflow hidden/hidden |
| 390x844 | playerOne-local-ready | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 390x844 | playerOne-local-ready | Touch control <44px | #clubWheelScreen | 0 of 2 visible controls |
| 390x844 | playerOne-local-ready | Text scrollWidth > clientWidth | #clubWheelScreen | 7 candidates |
| 390x844 | playerOne-local-ready | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span:nth-of-type(1) | 15>14px; overflow-x visible; glyph range outside no; 01 DRAW |
| 390x844 | playerOne-local-ready | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span:nth-of-type(2) | 15>14px; overflow-x visible; glyph range outside no; 02 PACK 1 |
| 390x844 | playerOne-local-ready | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span:nth-of-type(3) | 15>14px; overflow-x visible; glyph range outside no; 03 PACK 2 |
| 390x844 | playerOne-local-ready | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span:nth-of-type(4) | 15>14px; overflow-x visible; glyph range outside no; 04 VS |
| 390x844 | playerOne-local-ready | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span:nth-of-type(5) | 15>14px; overflow-x visible; glyph range outside no; 05 LOCK |
| 390x844 | playerOne-local-ready | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 248>208px; overflow-x hidden; glyph range outside no; ? |
| 390x844 | playerOne-local-ready | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 246>206px; overflow-x hidden; glyph range outside no; ? |
| 390x844 | playerOne-local-ready | Primary action in first screenful | #openClubPack | yes; 316×52px; top/bottom 784/836px; OPEN SHOWDOWN PACKS; disabled; center unobscured yes |
| 390x844 | playerOne-local-opening | Horizontal scrollbar | html / body | no; scroll/client 390/390px; overflow hidden/hidden |
| 390x844 | playerOne-local-opening | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 390x844 | playerOne-local-opening | Touch control <44px | #clubWheelScreen | 0 of 1 visible controls |
| 390x844 | playerOne-local-opening | Text scrollWidth > clientWidth | #clubWheelScreen | 7 candidates |
| 390x844 | playerOne-local-opening | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.active:nth-of-type(1) | 21>14px; overflow-x visible; glyph range outside no; 01 DRAW |
| 390x844 | playerOne-local-opening | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span:nth-of-type(2) | 15>14px; overflow-x visible; glyph range outside no; 02 PACK 1 |
| 390x844 | playerOne-local-opening | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span:nth-of-type(3) | 15>14px; overflow-x visible; glyph range outside no; 03 PACK 2 |
| 390x844 | playerOne-local-opening | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span:nth-of-type(4) | 15>14px; overflow-x visible; glyph range outside no; 04 VS |
| 390x844 | playerOne-local-opening | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span:nth-of-type(5) | 15>14px; overflow-x visible; glyph range outside no; 05 LOCK |
| 390x844 | playerOne-local-opening | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 248>208px; overflow-x hidden; glyph range outside no; ? |
| 390x844 | playerOne-local-opening | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 246>206px; overflow-x hidden; glyph range outside no; ? |
| 390x844 | playerOne-local-opening | Primary action in first screenful | #openClubPack | yes; 316×52px; top/bottom 784/836px; DRAW LOCKED...; disabled; center unobscured yes |
| 390x844 | playerOne-local-manager-one | Horizontal scrollbar | html / body | no; scroll/client 390/390px; overflow hidden/hidden |
| 390x844 | playerOne-local-manager-one | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 390x844 | playerOne-local-manager-one | Touch control <44px | #clubWheelScreen | 0 of 1 visible controls |
| 390x844 | playerOne-local-manager-one | Text scrollWidth > clientWidth | #clubWheelScreen | 7 candidates |
| 390x844 | playerOne-local-manager-one | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(1) | 15>14px; overflow-x visible; glyph range outside no; 01 DRAW |
| 390x844 | playerOne-local-manager-one | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.active:nth-of-type(2) | 24>14px; overflow-x visible; glyph range outside no; 02 PACK 1 |
| 390x844 | playerOne-local-manager-one | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span:nth-of-type(3) | 15>14px; overflow-x visible; glyph range outside no; 03 PACK 2 |
| 390x844 | playerOne-local-manager-one | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span:nth-of-type(4) | 15>14px; overflow-x visible; glyph range outside no; 04 VS |
| 390x844 | playerOne-local-manager-one | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span:nth-of-type(5) | 15>14px; overflow-x visible; glyph range outside no; 05 LOCK |
| 390x844 | playerOne-local-manager-one | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 248>208px; overflow-x hidden; glyph range outside no; Osasuna |
| 390x844 | playerOne-local-manager-one | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 246>206px; overflow-x hidden; glyph range outside no; ? |
| 390x844 | playerOne-local-manager-one | Primary action in first screenful | #openClubPack | yes; 316×52px; top/bottom 784/836px; DRAW LOCKED...; disabled; center unobscured yes |
| 390x844 | playerOne-local-manager-two | Horizontal scrollbar | html / body | no; scroll/client 390/390px; overflow hidden/hidden |
| 390x844 | playerOne-local-manager-two | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 390x844 | playerOne-local-manager-two | Touch control <44px | #clubWheelScreen | 0 of 1 visible controls |
| 390x844 | playerOne-local-manager-two | Text scrollWidth > clientWidth | #clubWheelScreen | 7 candidates |
| 390x844 | playerOne-local-manager-two | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(1) | 15>14px; overflow-x visible; glyph range outside no; 01 DRAW |
| 390x844 | playerOne-local-manager-two | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(2) | 15>14px; overflow-x visible; glyph range outside no; 02 PACK 1 |
| 390x844 | playerOne-local-manager-two | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.active:nth-of-type(3) | 25>14px; overflow-x visible; glyph range outside no; 03 PACK 2 |
| 390x844 | playerOne-local-manager-two | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span:nth-of-type(4) | 15>14px; overflow-x visible; glyph range outside no; 04 VS |
| 390x844 | playerOne-local-manager-two | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span:nth-of-type(5) | 15>14px; overflow-x visible; glyph range outside no; 05 LOCK |
| 390x844 | playerOne-local-manager-two | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 248>208px; overflow-x hidden; glyph range outside no; Osasuna |
| 390x844 | playerOne-local-manager-two | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 246>206px; overflow-x hidden; glyph range outside no; Espanyol |
| 390x844 | playerOne-local-manager-two | Primary action in first screenful | #openClubPack | yes; 316×52px; top/bottom 784/836px; DRAW LOCKED...; disabled; center unobscured yes |
| 390x844 | playerOne-local-versus | Horizontal scrollbar | html / body | no; scroll/client 390/390px; overflow hidden/hidden |
| 390x844 | playerOne-local-versus | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 390x844 | playerOne-local-versus | Touch control <44px | #clubWheelScreen | 0 of 0 visible controls |
| 390x844 | playerOne-local-versus | Text scrollWidth > clientWidth | #clubWheelScreen | 8 candidates |
| 390x844 | playerOne-local-versus | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(1) | 15>14px; overflow-x visible; glyph range outside no; 01 DRAW |
| 390x844 | playerOne-local-versus | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(2) | 15>14px; overflow-x visible; glyph range outside no; 02 PACK 1 |
| 390x844 | playerOne-local-versus | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(3) | 15>14px; overflow-x visible; glyph range outside no; 03 PACK 2 |
| 390x844 | playerOne-local-versus | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.active:nth-of-type(4) | 15>14px; overflow-x visible; glyph range outside no; 04 VS |
| 390x844 | playerOne-local-versus | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span:nth-of-type(5) | 15>14px; overflow-x visible; glyph range outside no; 05 LOCK |
| 390x844 | playerOne-local-versus | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 248>208px; overflow-x hidden; glyph range outside no; Osasuna |
| 390x844 | playerOne-local-versus | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 246>206px; overflow-x hidden; glyph range outside no; Espanyol |
| 390x844 | playerOne-local-versus | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 78>73px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 390x844 | playerOne-local-versus | Primary action in first screenful | none | N/A no visible action |
| 390x844 | playerOne-local-confirmation | Horizontal scrollbar | html / body | no; scroll/client 390/390px; overflow hidden/hidden |
| 390x844 | playerOne-local-confirmation | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 390x844 | playerOne-local-confirmation | Touch control <44px | #clubWheelScreen | 0 of 1 visible controls |
| 390x844 | playerOne-local-confirmation | Text scrollWidth > clientWidth | #clubWheelScreen | 8 candidates |
| 390x844 | playerOne-local-confirmation | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(1) | 15>14px; overflow-x visible; glyph range outside no; 01 DRAW |
| 390x844 | playerOne-local-confirmation | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(2) | 15>14px; overflow-x visible; glyph range outside no; 02 PACK 1 |
| 390x844 | playerOne-local-confirmation | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(3) | 15>14px; overflow-x visible; glyph range outside no; 03 PACK 2 |
| 390x844 | playerOne-local-confirmation | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(4) | 15>14px; overflow-x visible; glyph range outside no; 04 VS |
| 390x844 | playerOne-local-confirmation | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.active:nth-of-type(5) | 20>14px; overflow-x visible; glyph range outside no; 05 LOCK |
| 390x844 | playerOne-local-confirmation | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 248>208px; overflow-x hidden; glyph range outside no; Osasuna |
| 390x844 | playerOne-local-confirmation | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 246>206px; overflow-x hidden; glyph range outside no; Espanyol |
| 390x844 | playerOne-local-confirmation | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 78>73px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 390x844 | playerOne-local-confirmation | Primary action in first screenful | #continueClubAssignment | yes; 316×52px; top/bottom 783/835px; CONFIRM RIVALRY & START SHOWDOWN; center unobscured yes |
| 390x844 | playerTwo-sealed | Horizontal scrollbar | html / body | no; scroll/client 390/390px; overflow hidden/hidden |
| 390x844 | playerTwo-sealed | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 390x844 | playerTwo-sealed | Touch control <44px | #clubWheelScreen | 0 of 1 visible controls |
| 390x844 | playerTwo-sealed | Text scrollWidth > clientWidth | #clubWheelScreen | 5 candidates |
| 390x844 | playerTwo-sealed | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-is-animating:nth-of-type(2) > span:nth-of-type(1) | 15>14px; overflow-x visible; glyph range outside no; 01 DRAW |
| 390x844 | playerTwo-sealed | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-is-animating:nth-of-type(2) > span:nth-of-type(2) | 15>14px; overflow-x visible; glyph range outside no; 02 PACK 1 |
| 390x844 | playerTwo-sealed | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-is-animating:nth-of-type(2) > span:nth-of-type(3) | 15>14px; overflow-x visible; glyph range outside no; 03 PACK 2 |
| 390x844 | playerTwo-sealed | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-is-animating:nth-of-type(2) > span:nth-of-type(4) | 15>14px; overflow-x visible; glyph range outside no; 04 VS |
| 390x844 | playerTwo-sealed | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-is-animating:nth-of-type(2) > span:nth-of-type(5) | 15>14px; overflow-x visible; glyph range outside no; 05 LOCK |
| 390x844 | playerTwo-sealed | Primary action in first screenful | #openClubPack | yes; 316×52px; top/bottom 784/836px; WAITING FOR HOST PACK REVEAL; disabled; center unobscured yes |
| 390x844 | playerTwo-opening | Horizontal scrollbar | html / body | no; scroll/client 390/390px; overflow hidden/hidden |
| 390x844 | playerTwo-opening | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 390x844 | playerTwo-opening | Touch control <44px | #clubWheelScreen | 0 of 0 visible controls |
| 390x844 | playerTwo-opening | Text scrollWidth > clientWidth | #clubWheelScreen | 5 candidates |
| 390x844 | playerTwo-opening | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.active:nth-of-type(1) | 21>14px; overflow-x visible; glyph range outside no; 01 DRAW |
| 390x844 | playerTwo-opening | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span:nth-of-type(2) | 15>14px; overflow-x visible; glyph range outside no; 02 PACK 1 |
| 390x844 | playerTwo-opening | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span:nth-of-type(3) | 15>14px; overflow-x visible; glyph range outside no; 03 PACK 2 |
| 390x844 | playerTwo-opening | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span:nth-of-type(4) | 15>14px; overflow-x visible; glyph range outside no; 04 VS |
| 390x844 | playerTwo-opening | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span:nth-of-type(5) | 15>14px; overflow-x visible; glyph range outside no; 05 LOCK |
| 390x844 | playerTwo-opening | Primary action in first screenful | none | N/A no visible action |
| 390x844 | playerTwo-manager-one | Horizontal scrollbar | html / body | no; scroll/client 390/390px; overflow hidden/hidden |
| 390x844 | playerTwo-manager-one | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 390x844 | playerTwo-manager-one | Touch control <44px | #clubWheelScreen | 0 of 0 visible controls |
| 390x844 | playerTwo-manager-one | Text scrollWidth > clientWidth | #clubWheelScreen | 6 candidates |
| 390x844 | playerTwo-manager-one | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(1) | 15>14px; overflow-x visible; glyph range outside no; 01 DRAW |
| 390x844 | playerTwo-manager-one | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.active:nth-of-type(2) | 24>14px; overflow-x visible; glyph range outside no; 02 PACK 1 |
| 390x844 | playerTwo-manager-one | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span:nth-of-type(3) | 15>14px; overflow-x visible; glyph range outside no; 03 PACK 2 |
| 390x844 | playerTwo-manager-one | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span:nth-of-type(4) | 15>14px; overflow-x visible; glyph range outside no; 04 VS |
| 390x844 | playerTwo-manager-one | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span:nth-of-type(5) | 15>14px; overflow-x visible; glyph range outside no; 05 LOCK |
| 390x844 | playerTwo-manager-one | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span | 98>73px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 390x844 | playerTwo-manager-one | Primary action in first screenful | none | N/A no visible action |
| 390x844 | playerTwo-manager-two | Horizontal scrollbar | html / body | no; scroll/client 390/390px; overflow hidden/hidden |
| 390x844 | playerTwo-manager-two | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 390x844 | playerTwo-manager-two | Touch control <44px | #clubWheelScreen | 0 of 0 visible controls |
| 390x844 | playerTwo-manager-two | Text scrollWidth > clientWidth | #clubWheelScreen | 7 candidates |
| 390x844 | playerTwo-manager-two | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(1) | 15>14px; overflow-x visible; glyph range outside no; 01 DRAW |
| 390x844 | playerTwo-manager-two | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(2) | 15>14px; overflow-x visible; glyph range outside no; 02 PACK 1 |
| 390x844 | playerTwo-manager-two | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.active:nth-of-type(3) | 25>14px; overflow-x visible; glyph range outside no; 03 PACK 2 |
| 390x844 | playerTwo-manager-two | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span:nth-of-type(4) | 15>14px; overflow-x visible; glyph range outside no; 04 VS |
| 390x844 | playerTwo-manager-two | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span:nth-of-type(5) | 15>14px; overflow-x visible; glyph range outside no; 05 LOCK |
| 390x844 | playerTwo-manager-two | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 248>208px; overflow-x hidden; glyph range outside no; Osasuna |
| 390x844 | playerTwo-manager-two | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span | 98>73px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 390x844 | playerTwo-manager-two | Primary action in first screenful | none | N/A no visible action |
| 390x844 | playerTwo-clubs-locked-awaiting-season | Horizontal scrollbar | html / body | no; scroll/client 390/390px; overflow hidden/hidden |
| 390x844 | playerTwo-clubs-locked-awaiting-season | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 390x844 | playerTwo-clubs-locked-awaiting-season | Touch control <44px | #clubWheelScreen | 0 of 0 visible controls |
| 390x844 | playerTwo-clubs-locked-awaiting-season | Text scrollWidth > clientWidth | #clubWheelScreen | 8 candidates |
| 390x844 | playerTwo-clubs-locked-awaiting-season | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(1) | 15>14px; overflow-x visible; glyph range outside no; 01 DRAW |
| 390x844 | playerTwo-clubs-locked-awaiting-season | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(2) | 15>14px; overflow-x visible; glyph range outside no; 02 PACK 1 |
| 390x844 | playerTwo-clubs-locked-awaiting-season | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(3) | 15>14px; overflow-x visible; glyph range outside no; 03 PACK 2 |
| 390x844 | playerTwo-clubs-locked-awaiting-season | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(4) | 15>14px; overflow-x visible; glyph range outside no; 04 VS |
| 390x844 | playerTwo-clubs-locked-awaiting-season | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.active:nth-of-type(5) | 20>14px; overflow-x visible; glyph range outside no; 05 LOCK |
| 390x844 | playerTwo-clubs-locked-awaiting-season | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 248>208px; overflow-x hidden; glyph range outside no; Osasuna |
| 390x844 | playerTwo-clubs-locked-awaiting-season | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 246>206px; overflow-x hidden; glyph range outside no; Espanyol |
| 390x844 | playerTwo-clubs-locked-awaiting-season | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 78>73px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 390x844 | playerTwo-clubs-locked-awaiting-season | Primary action in first screenful | none | N/A no visible action |
| 390x844 | playerTwo-confirm | Horizontal scrollbar | html / body | no; scroll/client 390/390px; overflow hidden/hidden |
| 390x844 | playerTwo-confirm | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 390x844 | playerTwo-confirm | Touch control <44px | #clubWheelScreen | 0 of 1 visible controls |
| 390x844 | playerTwo-confirm | Text scrollWidth > clientWidth | #clubWheelScreen | 8 candidates |
| 390x844 | playerTwo-confirm | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(1) | 15>14px; overflow-x visible; glyph range outside no; 01 DRAW |
| 390x844 | playerTwo-confirm | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(2) | 15>14px; overflow-x visible; glyph range outside no; 02 PACK 1 |
| 390x844 | playerTwo-confirm | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(3) | 15>14px; overflow-x visible; glyph range outside no; 03 PACK 2 |
| 390x844 | playerTwo-confirm | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(4) | 15>14px; overflow-x visible; glyph range outside no; 04 VS |
| 390x844 | playerTwo-confirm | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.active:nth-of-type(5) | 20>14px; overflow-x visible; glyph range outside no; 05 LOCK |
| 390x844 | playerTwo-confirm | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 248>208px; overflow-x hidden; glyph range outside no; Osasuna |
| 390x844 | playerTwo-confirm | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 246>206px; overflow-x hidden; glyph range outside no; Espanyol |
| 390x844 | playerTwo-confirm | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 78>73px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 390x844 | playerTwo-confirm | Primary action in first screenful | #continueClubAssignment | yes; 316×52px; top/bottom 784/836px; CONFIRM SHARED SHOWDOWN; center unobscured yes |
| 390x844 | playerTwo-confirm-write-failure | Horizontal scrollbar | html / body | no; scroll/client 390/390px; overflow hidden/hidden |
| 390x844 | playerTwo-confirm-write-failure | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 390x844 | playerTwo-confirm-write-failure | Touch control <44px | #clubWheelScreen | 0 of 1 visible controls |
| 390x844 | playerTwo-confirm-write-failure | Text scrollWidth > clientWidth | #clubWheelScreen | 8 candidates |
| 390x844 | playerTwo-confirm-write-failure | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(1) | 15>14px; overflow-x visible; glyph range outside no; 01 DRAW |
| 390x844 | playerTwo-confirm-write-failure | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(2) | 15>14px; overflow-x visible; glyph range outside no; 02 PACK 1 |
| 390x844 | playerTwo-confirm-write-failure | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(3) | 15>14px; overflow-x visible; glyph range outside no; 03 PACK 2 |
| 390x844 | playerTwo-confirm-write-failure | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(4) | 15>14px; overflow-x visible; glyph range outside no; 04 VS |
| 390x844 | playerTwo-confirm-write-failure | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.active:nth-of-type(5) | 20>14px; overflow-x visible; glyph range outside no; 05 LOCK |
| 390x844 | playerTwo-confirm-write-failure | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 248>208px; overflow-x hidden; glyph range outside no; Osasuna |
| 390x844 | playerTwo-confirm-write-failure | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 246>206px; overflow-x hidden; glyph range outside no; Espanyol |
| 390x844 | playerTwo-confirm-write-failure | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 78>73px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 390x844 | playerTwo-confirm-write-failure | Primary action in first screenful | #continueClubAssignment | yes; 316×52px; top/bottom 783/835px; CONFIRM SHARED SHOWDOWN; center unobscured yes |
| 390x844 | playerTwo-waiting-rival | Horizontal scrollbar | html / body | no; scroll/client 390/390px; overflow hidden/hidden |
| 390x844 | playerTwo-waiting-rival | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 390x844 | playerTwo-waiting-rival | Touch control <44px | #clubWheelScreen | 0 of 1 visible controls |
| 390x844 | playerTwo-waiting-rival | Text scrollWidth > clientWidth | #clubWheelScreen | 8 candidates |
| 390x844 | playerTwo-waiting-rival | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(1) | 15>14px; overflow-x visible; glyph range outside no; 01 DRAW |
| 390x844 | playerTwo-waiting-rival | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(2) | 15>14px; overflow-x visible; glyph range outside no; 02 PACK 1 |
| 390x844 | playerTwo-waiting-rival | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(3) | 15>14px; overflow-x visible; glyph range outside no; 03 PACK 2 |
| 390x844 | playerTwo-waiting-rival | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(4) | 15>14px; overflow-x visible; glyph range outside no; 04 VS |
| 390x844 | playerTwo-waiting-rival | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.active:nth-of-type(5) | 20>14px; overflow-x visible; glyph range outside no; 05 LOCK |
| 390x844 | playerTwo-waiting-rival | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 248>208px; overflow-x hidden; glyph range outside no; Osasuna |
| 390x844 | playerTwo-waiting-rival | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 246>206px; overflow-x hidden; glyph range outside no; Espanyol |
| 390x844 | playerTwo-waiting-rival | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 78>73px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 390x844 | playerTwo-waiting-rival | Primary action in first screenful | #continueClubAssignment | yes; 316×52px; top/bottom 784/836px; CONFIRMED · WAITING FOR RIVAL; disabled; center unobscured yes |
| 390x844 | playerTwo-reconnect | Horizontal scrollbar | html / body | no; scroll/client 390/390px; overflow hidden/hidden |
| 390x844 | playerTwo-reconnect | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 390x844 | playerTwo-reconnect | Touch control <44px | #clubWheelScreen | 0 of 1 visible controls |
| 390x844 | playerTwo-reconnect | Text scrollWidth > clientWidth | #clubWheelScreen | 8 candidates |
| 390x844 | playerTwo-reconnect | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(1) | 15>14px; overflow-x visible; glyph range outside no; 01 DRAW |
| 390x844 | playerTwo-reconnect | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(2) | 15>14px; overflow-x visible; glyph range outside no; 02 PACK 1 |
| 390x844 | playerTwo-reconnect | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(3) | 15>14px; overflow-x visible; glyph range outside no; 03 PACK 2 |
| 390x844 | playerTwo-reconnect | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(4) | 15>14px; overflow-x visible; glyph range outside no; 04 VS |
| 390x844 | playerTwo-reconnect | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.active:nth-of-type(5) | 20>14px; overflow-x visible; glyph range outside no; 05 LOCK |
| 390x844 | playerTwo-reconnect | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 248>208px; overflow-x hidden; glyph range outside no; Osasuna |
| 390x844 | playerTwo-reconnect | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 246>206px; overflow-x hidden; glyph range outside no; Espanyol |
| 390x844 | playerTwo-reconnect | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 78>73px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 390x844 | playerTwo-reconnect | Primary action in first screenful | #continueClubAssignment | yes; 316×52px; top/bottom 784/836px; RECONNECT PLAYERS TO CONTINUE; disabled; center unobscured yes |
| 390x844 | playerTwo-career-start-ready | Horizontal scrollbar | html / body | no; scroll/client 390/390px; overflow hidden/hidden |
| 390x844 | playerTwo-career-start-ready | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 390x844 | playerTwo-career-start-ready | Touch control <44px | #clubWheelScreen | 0 of 1 visible controls |
| 390x844 | playerTwo-career-start-ready | Text scrollWidth > clientWidth | #clubWheelScreen | 8 candidates |
| 390x844 | playerTwo-career-start-ready | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(1) | 15>14px; overflow-x visible; glyph range outside no; 01 DRAW |
| 390x844 | playerTwo-career-start-ready | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(2) | 15>14px; overflow-x visible; glyph range outside no; 02 PACK 1 |
| 390x844 | playerTwo-career-start-ready | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(3) | 15>14px; overflow-x visible; glyph range outside no; 03 PACK 2 |
| 390x844 | playerTwo-career-start-ready | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(4) | 15>14px; overflow-x visible; glyph range outside no; 04 VS |
| 390x844 | playerTwo-career-start-ready | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.active:nth-of-type(5) | 20>14px; overflow-x visible; glyph range outside no; 05 LOCK |
| 390x844 | playerTwo-career-start-ready | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 248>208px; overflow-x hidden; glyph range outside no; Osasuna |
| 390x844 | playerTwo-career-start-ready | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 246>206px; overflow-x hidden; glyph range outside no; Espanyol |
| 390x844 | playerTwo-career-start-ready | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 78>73px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 390x844 | playerTwo-career-start-ready | Primary action in first screenful | #continueClubAssignment | yes; 316×52px; top/bottom 783/835px; CONTINUE TO CAREER START; center unobscured yes |
| 390x844 | playerTwo-season-mismatch | Horizontal scrollbar | html / body | no; scroll/client 390/390px; overflow hidden/hidden |
| 390x844 | playerTwo-season-mismatch | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 390x844 | playerTwo-season-mismatch | Touch control <44px | #clubWheelScreen | 0 of 1 visible controls |
| 390x844 | playerTwo-season-mismatch | Text scrollWidth > clientWidth | #clubWheelScreen | 8 candidates |
| 390x844 | playerTwo-season-mismatch | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(1) | 15>14px; overflow-x visible; glyph range outside no; 01 DRAW |
| 390x844 | playerTwo-season-mismatch | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(2) | 15>14px; overflow-x visible; glyph range outside no; 02 PACK 1 |
| 390x844 | playerTwo-season-mismatch | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(3) | 15>14px; overflow-x visible; glyph range outside no; 03 PACK 2 |
| 390x844 | playerTwo-season-mismatch | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(4) | 15>14px; overflow-x visible; glyph range outside no; 04 VS |
| 390x844 | playerTwo-season-mismatch | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.active:nth-of-type(5) | 20>14px; overflow-x visible; glyph range outside no; 05 LOCK |
| 390x844 | playerTwo-season-mismatch | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 248>208px; overflow-x hidden; glyph range outside no; Osasuna |
| 390x844 | playerTwo-season-mismatch | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 246>206px; overflow-x hidden; glyph range outside no; Espanyol |
| 390x844 | playerTwo-season-mismatch | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 78>73px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 390x844 | playerTwo-season-mismatch | Primary action in first screenful | #continueClubAssignment | yes; 316×52px; top/bottom 784/836px; SEASON PLAN MISMATCH · RECOVERY REQUIRED; disabled; center unobscured yes |
| 390x844 | playerTwo-long-club-names | Horizontal scrollbar | html / body | no; scroll/client 390/390px; overflow hidden/hidden |
| 390x844 | playerTwo-long-club-names | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 390x844 | playerTwo-long-club-names | Touch control <44px | #clubWheelScreen | 0 of 1 visible controls |
| 390x844 | playerTwo-long-club-names | Text scrollWidth > clientWidth | #clubWheelScreen | 8 candidates |
| 390x844 | playerTwo-long-club-names | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(1) | 15>14px; overflow-x visible; glyph range outside no; 01 DRAW |
| 390x844 | playerTwo-long-club-names | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(2) | 15>14px; overflow-x visible; glyph range outside no; 02 PACK 1 |
| 390x844 | playerTwo-long-club-names | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(3) | 15>14px; overflow-x visible; glyph range outside no; 03 PACK 2 |
| 390x844 | playerTwo-long-club-names | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(4) | 15>14px; overflow-x visible; glyph range outside no; 04 VS |
| 390x844 | playerTwo-long-club-names | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.active:nth-of-type(5) | 20>14px; overflow-x visible; glyph range outside no; 05 LOCK |
| 390x844 | playerTwo-long-club-names | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 248>208px; overflow-x hidden; glyph range outside no; Deportivo La Coruña |
| 390x844 | playerTwo-long-club-names | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 246>206px; overflow-x hidden; glyph range outside no; Borussia Mönchengladbach |
| 390x844 | playerTwo-long-club-names | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 78>73px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 390x844 | playerTwo-long-club-names | Primary action in first screenful | #continueClubAssignment | yes; 316×52px; top/bottom 783/835px; CONFIRM SHARED SHOWDOWN; center unobscured yes |
| 390x844 | playerOne-confirmation-overlap-detail | Horizontal scrollbar | html / body | no; scroll/client 390/390px; overflow hidden/hidden |
| 390x844 | playerOne-confirmation-overlap-detail | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 390x844 | playerOne-confirmation-overlap-detail | Touch control <44px | #clubWheelScreen | 0 of 1 visible controls |
| 390x844 | playerOne-confirmation-overlap-detail | Text scrollWidth > clientWidth | #clubWheelScreen | 8 candidates |
| 390x844 | playerOne-confirmation-overlap-detail | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(1) | 15>14px; overflow-x visible; glyph range outside no; 01 DRAW |
| 390x844 | playerOne-confirmation-overlap-detail | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(2) | 15>14px; overflow-x visible; glyph range outside no; 02 PACK 1 |
| 390x844 | playerOne-confirmation-overlap-detail | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(3) | 15>14px; overflow-x visible; glyph range outside no; 03 PACK 2 |
| 390x844 | playerOne-confirmation-overlap-detail | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(4) | 15>14px; overflow-x visible; glyph range outside no; 04 VS |
| 390x844 | playerOne-confirmation-overlap-detail | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.active:nth-of-type(5) | 20>14px; overflow-x visible; glyph range outside no; 05 LOCK |
| 390x844 | playerOne-confirmation-overlap-detail | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 248>208px; overflow-x hidden; glyph range outside no; Osasuna |
| 390x844 | playerOne-confirmation-overlap-detail | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 246>206px; overflow-x hidden; glyph range outside no; Espanyol |
| 390x844 | playerOne-confirmation-overlap-detail | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 78>73px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 390x844 | playerOne-confirmation-overlap-detail | Primary action in first screenful | #continueClubAssignment | yes; 316×52px; top/bottom 784/836px; CONFIRM SHARED SHOWDOWN; center unobscured yes |
| 390x844 | playerTwo-confirmation-overlap-detail | Horizontal scrollbar | html / body | no; scroll/client 390/390px; overflow hidden/hidden |
| 390x844 | playerTwo-confirmation-overlap-detail | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 390x844 | playerTwo-confirmation-overlap-detail | Touch control <44px | #clubWheelScreen | 0 of 1 visible controls |
| 390x844 | playerTwo-confirmation-overlap-detail | Text scrollWidth > clientWidth | #clubWheelScreen | 8 candidates |
| 390x844 | playerTwo-confirmation-overlap-detail | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(1) | 15>14px; overflow-x visible; glyph range outside no; 01 DRAW |
| 390x844 | playerTwo-confirmation-overlap-detail | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(2) | 15>14px; overflow-x visible; glyph range outside no; 02 PACK 1 |
| 390x844 | playerTwo-confirmation-overlap-detail | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(3) | 15>14px; overflow-x visible; glyph range outside no; 03 PACK 2 |
| 390x844 | playerTwo-confirmation-overlap-detail | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(4) | 15>14px; overflow-x visible; glyph range outside no; 04 VS |
| 390x844 | playerTwo-confirmation-overlap-detail | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.active:nth-of-type(5) | 20>14px; overflow-x visible; glyph range outside no; 05 LOCK |
| 390x844 | playerTwo-confirmation-overlap-detail | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 248>208px; overflow-x hidden; glyph range outside no; Osasuna |
| 390x844 | playerTwo-confirmation-overlap-detail | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 246>206px; overflow-x hidden; glyph range outside no; Espanyol |
| 390x844 | playerTwo-confirmation-overlap-detail | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 78>73px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 390x844 | playerTwo-confirmation-overlap-detail | Primary action in first screenful | #continueClubAssignment | yes; 316×52px; top/bottom 784/836px; CONFIRM SHARED SHOWDOWN; center unobscured yes |
| 430x932 | playerOne-sealed | Horizontal scrollbar | html / body | no; scroll/client 430/430px; overflow hidden/hidden |
| 430x932 | playerOne-sealed | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 430x932 | playerOne-sealed | Touch control <44px | #clubWheelScreen | 0 of 1 visible controls |
| 430x932 | playerOne-sealed | Text scrollWidth > clientWidth | #clubWheelScreen | 0 candidates |
| 430x932 | playerOne-sealed | Primary action in first screenful | #openClubPack | yes; 356×52px; top/bottom 872/924px; OPEN SHOWDOWN PACKS; center unobscured yes |
| 430x932 | playerOne-provider-working | Horizontal scrollbar | html / body | no; scroll/client 430/430px; overflow hidden/hidden |
| 430x932 | playerOne-provider-working | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 430x932 | playerOne-provider-working | Touch control <44px | #clubWheelScreen | 0 of 1 visible controls |
| 430x932 | playerOne-provider-working | Text scrollWidth > clientWidth | #clubWheelScreen | 5 candidates |
| 430x932 | playerOne-provider-working | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span:nth-of-type(1) | 15>14px; overflow-x visible; glyph range outside no; 01 DRAW |
| 430x932 | playerOne-provider-working | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span:nth-of-type(2) | 15>14px; overflow-x visible; glyph range outside no; 02 PACK 1 |
| 430x932 | playerOne-provider-working | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span:nth-of-type(3) | 15>14px; overflow-x visible; glyph range outside no; 03 PACK 2 |
| 430x932 | playerOne-provider-working | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span:nth-of-type(4) | 15>14px; overflow-x visible; glyph range outside no; 04 VS |
| 430x932 | playerOne-provider-working | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span:nth-of-type(5) | 15>14px; overflow-x visible; glyph range outside no; 05 LOCK |
| 430x932 | playerOne-provider-working | Primary action in first screenful | #openClubPack | yes; 355.6×51.9px; top/bottom 872/924px; WORKING…; disabled; center unobscured yes |
| 430x932 | playerOne-pack-write-failure | Horizontal scrollbar | html / body | no; scroll/client 430/430px; overflow hidden/hidden |
| 430x932 | playerOne-pack-write-failure | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 430x932 | playerOne-pack-write-failure | Touch control <44px | #clubWheelScreen | 0 of 1 visible controls |
| 430x932 | playerOne-pack-write-failure | Text scrollWidth > clientWidth | #clubWheelScreen | 5 candidates |
| 430x932 | playerOne-pack-write-failure | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span:nth-of-type(1) | 15>14px; overflow-x visible; glyph range outside no; 01 DRAW |
| 430x932 | playerOne-pack-write-failure | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span:nth-of-type(2) | 15>14px; overflow-x visible; glyph range outside no; 02 PACK 1 |
| 430x932 | playerOne-pack-write-failure | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span:nth-of-type(3) | 15>14px; overflow-x visible; glyph range outside no; 03 PACK 2 |
| 430x932 | playerOne-pack-write-failure | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span:nth-of-type(4) | 15>14px; overflow-x visible; glyph range outside no; 04 VS |
| 430x932 | playerOne-pack-write-failure | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span:nth-of-type(5) | 15>14px; overflow-x visible; glyph range outside no; 05 LOCK |
| 430x932 | playerOne-pack-write-failure | Primary action in first screenful | #openClubPack | yes; 356×52px; top/bottom 871/923px; OPEN SHOWDOWN PACKS; center unobscured yes |
| 430x932 | playerOne-opening | Horizontal scrollbar | html / body | no; scroll/client 430/430px; overflow hidden/hidden |
| 430x932 | playerOne-opening | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 430x932 | playerOne-opening | Touch control <44px | #clubWheelScreen | 0 of 0 visible controls |
| 430x932 | playerOne-opening | Text scrollWidth > clientWidth | #clubWheelScreen | 6 candidates |
| 430x932 | playerOne-opening | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.active:nth-of-type(1) | 21>14px; overflow-x visible; glyph range outside no; 01 DRAW |
| 430x932 | playerOne-opening | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span:nth-of-type(2) | 15>14px; overflow-x visible; glyph range outside no; 02 PACK 1 |
| 430x932 | playerOne-opening | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span:nth-of-type(3) | 15>14px; overflow-x visible; glyph range outside no; 03 PACK 2 |
| 430x932 | playerOne-opening | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span:nth-of-type(4) | 15>14px; overflow-x visible; glyph range outside no; 04 VS |
| 430x932 | playerOne-opening | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span:nth-of-type(5) | 15>14px; overflow-x visible; glyph range outside no; 05 LOCK |
| 430x932 | playerOne-opening | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span | 98>73px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 430x932 | playerOne-opening | Primary action in first screenful | none | N/A no visible action |
| 430x932 | playerOne-manager-one | Horizontal scrollbar | html / body | no; scroll/client 430/430px; overflow hidden/hidden |
| 430x932 | playerOne-manager-one | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 430x932 | playerOne-manager-one | Touch control <44px | #clubWheelScreen | 0 of 0 visible controls |
| 430x932 | playerOne-manager-one | Text scrollWidth > clientWidth | #clubWheelScreen | 6 candidates |
| 430x932 | playerOne-manager-one | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(1) | 15>14px; overflow-x visible; glyph range outside no; 01 DRAW |
| 430x932 | playerOne-manager-one | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.active:nth-of-type(2) | 24>14px; overflow-x visible; glyph range outside no; 02 PACK 1 |
| 430x932 | playerOne-manager-one | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span:nth-of-type(3) | 15>14px; overflow-x visible; glyph range outside no; 03 PACK 2 |
| 430x932 | playerOne-manager-one | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span:nth-of-type(4) | 15>14px; overflow-x visible; glyph range outside no; 04 VS |
| 430x932 | playerOne-manager-one | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span:nth-of-type(5) | 15>14px; overflow-x visible; glyph range outside no; 05 LOCK |
| 430x932 | playerOne-manager-one | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span | 98>73px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 430x932 | playerOne-manager-one | Primary action in first screenful | none | N/A no visible action |
| 430x932 | playerOne-manager-two | Horizontal scrollbar | html / body | no; scroll/client 430/430px; overflow hidden/hidden |
| 430x932 | playerOne-manager-two | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 430x932 | playerOne-manager-two | Touch control <44px | #clubWheelScreen | 0 of 0 visible controls |
| 430x932 | playerOne-manager-two | Text scrollWidth > clientWidth | #clubWheelScreen | 7 candidates |
| 430x932 | playerOne-manager-two | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(1) | 15>14px; overflow-x visible; glyph range outside no; 01 DRAW |
| 430x932 | playerOne-manager-two | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(2) | 15>14px; overflow-x visible; glyph range outside no; 02 PACK 1 |
| 430x932 | playerOne-manager-two | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.active:nth-of-type(3) | 25>14px; overflow-x visible; glyph range outside no; 03 PACK 2 |
| 430x932 | playerOne-manager-two | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span:nth-of-type(4) | 15>14px; overflow-x visible; glyph range outside no; 04 VS |
| 430x932 | playerOne-manager-two | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span:nth-of-type(5) | 15>14px; overflow-x visible; glyph range outside no; 05 LOCK |
| 430x932 | playerOne-manager-two | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 296>248px; overflow-x hidden; glyph range outside no; Osasuna |
| 430x932 | playerOne-manager-two | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span | 98>73px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 430x932 | playerOne-manager-two | Primary action in first screenful | none | N/A no visible action |
| 430x932 | playerOne-confirm | Horizontal scrollbar | html / body | no; scroll/client 430/430px; overflow hidden/hidden |
| 430x932 | playerOne-confirm | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 430x932 | playerOne-confirm | Touch control <44px | #clubWheelScreen | 0 of 1 visible controls |
| 430x932 | playerOne-confirm | Text scrollWidth > clientWidth | #clubWheelScreen | 8 candidates |
| 430x932 | playerOne-confirm | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(1) | 15>14px; overflow-x visible; glyph range outside no; 01 DRAW |
| 430x932 | playerOne-confirm | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(2) | 15>14px; overflow-x visible; glyph range outside no; 02 PACK 1 |
| 430x932 | playerOne-confirm | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(3) | 15>14px; overflow-x visible; glyph range outside no; 03 PACK 2 |
| 430x932 | playerOne-confirm | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(4) | 15>14px; overflow-x visible; glyph range outside no; 04 VS |
| 430x932 | playerOne-confirm | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.active:nth-of-type(5) | 20>14px; overflow-x visible; glyph range outside no; 05 LOCK |
| 430x932 | playerOne-confirm | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 296>248px; overflow-x hidden; glyph range outside no; Osasuna |
| 430x932 | playerOne-confirm | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 294>246px; overflow-x hidden; glyph range outside no; Espanyol |
| 430x932 | playerOne-confirm | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 78>73px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 430x932 | playerOne-confirm | Primary action in first screenful | #continueClubAssignment | yes; 356×52px; top/bottom 871/923px; CONFIRM SHARED SHOWDOWN; center unobscured yes |
| 430x932 | playerOne-confirm-write-failure | Horizontal scrollbar | html / body | no; scroll/client 430/430px; overflow hidden/hidden |
| 430x932 | playerOne-confirm-write-failure | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 430x932 | playerOne-confirm-write-failure | Touch control <44px | #clubWheelScreen | 0 of 1 visible controls |
| 430x932 | playerOne-confirm-write-failure | Text scrollWidth > clientWidth | #clubWheelScreen | 8 candidates |
| 430x932 | playerOne-confirm-write-failure | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(1) | 15>14px; overflow-x visible; glyph range outside no; 01 DRAW |
| 430x932 | playerOne-confirm-write-failure | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(2) | 15>14px; overflow-x visible; glyph range outside no; 02 PACK 1 |
| 430x932 | playerOne-confirm-write-failure | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(3) | 15>14px; overflow-x visible; glyph range outside no; 03 PACK 2 |
| 430x932 | playerOne-confirm-write-failure | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(4) | 15>14px; overflow-x visible; glyph range outside no; 04 VS |
| 430x932 | playerOne-confirm-write-failure | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.active:nth-of-type(5) | 20>14px; overflow-x visible; glyph range outside no; 05 LOCK |
| 430x932 | playerOne-confirm-write-failure | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 296>248px; overflow-x hidden; glyph range outside no; Osasuna |
| 430x932 | playerOne-confirm-write-failure | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 294>246px; overflow-x hidden; glyph range outside no; Espanyol |
| 430x932 | playerOne-confirm-write-failure | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 78>73px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 430x932 | playerOne-confirm-write-failure | Primary action in first screenful | #continueClubAssignment | yes; 356×52px; top/bottom 871/923px; CONFIRM SHARED SHOWDOWN; center unobscured yes |
| 430x932 | playerOne-waiting-rival | Horizontal scrollbar | html / body | no; scroll/client 430/430px; overflow hidden/hidden |
| 430x932 | playerOne-waiting-rival | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 430x932 | playerOne-waiting-rival | Touch control <44px | #clubWheelScreen | 0 of 1 visible controls |
| 430x932 | playerOne-waiting-rival | Text scrollWidth > clientWidth | #clubWheelScreen | 8 candidates |
| 430x932 | playerOne-waiting-rival | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(1) | 15>14px; overflow-x visible; glyph range outside no; 01 DRAW |
| 430x932 | playerOne-waiting-rival | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(2) | 15>14px; overflow-x visible; glyph range outside no; 02 PACK 1 |
| 430x932 | playerOne-waiting-rival | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(3) | 15>14px; overflow-x visible; glyph range outside no; 03 PACK 2 |
| 430x932 | playerOne-waiting-rival | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(4) | 15>14px; overflow-x visible; glyph range outside no; 04 VS |
| 430x932 | playerOne-waiting-rival | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.active:nth-of-type(5) | 20>14px; overflow-x visible; glyph range outside no; 05 LOCK |
| 430x932 | playerOne-waiting-rival | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 296>248px; overflow-x hidden; glyph range outside no; Osasuna |
| 430x932 | playerOne-waiting-rival | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 294>246px; overflow-x hidden; glyph range outside no; Espanyol |
| 430x932 | playerOne-waiting-rival | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 78>73px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 430x932 | playerOne-waiting-rival | Primary action in first screenful | #continueClubAssignment | yes; 356×52px; top/bottom 872/924px; CONFIRMED · WAITING FOR RIVAL; disabled; center unobscured yes |
| 430x932 | playerOne-reconnect | Horizontal scrollbar | html / body | no; scroll/client 430/430px; overflow hidden/hidden |
| 430x932 | playerOne-reconnect | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 430x932 | playerOne-reconnect | Touch control <44px | #clubWheelScreen | 0 of 1 visible controls |
| 430x932 | playerOne-reconnect | Text scrollWidth > clientWidth | #clubWheelScreen | 8 candidates |
| 430x932 | playerOne-reconnect | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(1) | 15>14px; overflow-x visible; glyph range outside no; 01 DRAW |
| 430x932 | playerOne-reconnect | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(2) | 15>14px; overflow-x visible; glyph range outside no; 02 PACK 1 |
| 430x932 | playerOne-reconnect | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(3) | 15>14px; overflow-x visible; glyph range outside no; 03 PACK 2 |
| 430x932 | playerOne-reconnect | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(4) | 15>14px; overflow-x visible; glyph range outside no; 04 VS |
| 430x932 | playerOne-reconnect | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.active:nth-of-type(5) | 20>14px; overflow-x visible; glyph range outside no; 05 LOCK |
| 430x932 | playerOne-reconnect | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 296>248px; overflow-x hidden; glyph range outside no; Osasuna |
| 430x932 | playerOne-reconnect | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 294>246px; overflow-x hidden; glyph range outside no; Espanyol |
| 430x932 | playerOne-reconnect | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 78>73px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 430x932 | playerOne-reconnect | Primary action in first screenful | #continueClubAssignment | yes; 356×52px; top/bottom 872/924px; RECONNECT PLAYERS TO CONTINUE; disabled; center unobscured yes |
| 430x932 | playerOne-career-start-ready | Horizontal scrollbar | html / body | no; scroll/client 430/430px; overflow hidden/hidden |
| 430x932 | playerOne-career-start-ready | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 430x932 | playerOne-career-start-ready | Touch control <44px | #clubWheelScreen | 0 of 1 visible controls |
| 430x932 | playerOne-career-start-ready | Text scrollWidth > clientWidth | #clubWheelScreen | 8 candidates |
| 430x932 | playerOne-career-start-ready | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(1) | 15>14px; overflow-x visible; glyph range outside no; 01 DRAW |
| 430x932 | playerOne-career-start-ready | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(2) | 15>14px; overflow-x visible; glyph range outside no; 02 PACK 1 |
| 430x932 | playerOne-career-start-ready | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(3) | 15>14px; overflow-x visible; glyph range outside no; 03 PACK 2 |
| 430x932 | playerOne-career-start-ready | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(4) | 15>14px; overflow-x visible; glyph range outside no; 04 VS |
| 430x932 | playerOne-career-start-ready | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.active:nth-of-type(5) | 20>14px; overflow-x visible; glyph range outside no; 05 LOCK |
| 430x932 | playerOne-career-start-ready | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 296>248px; overflow-x hidden; glyph range outside no; Osasuna |
| 430x932 | playerOne-career-start-ready | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 294>246px; overflow-x hidden; glyph range outside no; Espanyol |
| 430x932 | playerOne-career-start-ready | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 78>73px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 430x932 | playerOne-career-start-ready | Primary action in first screenful | #continueClubAssignment | yes; 356×52px; top/bottom 871/923px; CONTINUE TO CAREER START; center unobscured yes |
| 430x932 | playerOne-season-mismatch | Horizontal scrollbar | html / body | no; scroll/client 430/430px; overflow hidden/hidden |
| 430x932 | playerOne-season-mismatch | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 430x932 | playerOne-season-mismatch | Touch control <44px | #clubWheelScreen | 0 of 1 visible controls |
| 430x932 | playerOne-season-mismatch | Text scrollWidth > clientWidth | #clubWheelScreen | 8 candidates |
| 430x932 | playerOne-season-mismatch | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(1) | 15>14px; overflow-x visible; glyph range outside no; 01 DRAW |
| 430x932 | playerOne-season-mismatch | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(2) | 15>14px; overflow-x visible; glyph range outside no; 02 PACK 1 |
| 430x932 | playerOne-season-mismatch | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(3) | 15>14px; overflow-x visible; glyph range outside no; 03 PACK 2 |
| 430x932 | playerOne-season-mismatch | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(4) | 15>14px; overflow-x visible; glyph range outside no; 04 VS |
| 430x932 | playerOne-season-mismatch | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.active:nth-of-type(5) | 20>14px; overflow-x visible; glyph range outside no; 05 LOCK |
| 430x932 | playerOne-season-mismatch | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 296>248px; overflow-x hidden; glyph range outside no; Osasuna |
| 430x932 | playerOne-season-mismatch | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 294>246px; overflow-x hidden; glyph range outside no; Espanyol |
| 430x932 | playerOne-season-mismatch | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 78>73px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 430x932 | playerOne-season-mismatch | Primary action in first screenful | #continueClubAssignment | yes; 356×52px; top/bottom 872/924px; SEASON PLAN MISMATCH · RECOVERY REQUIRED; disabled; center unobscured yes |
| 430x932 | playerOne-long-club-names | Horizontal scrollbar | html / body | no; scroll/client 430/430px; overflow hidden/hidden |
| 430x932 | playerOne-long-club-names | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 430x932 | playerOne-long-club-names | Touch control <44px | #clubWheelScreen | 0 of 1 visible controls |
| 430x932 | playerOne-long-club-names | Text scrollWidth > clientWidth | #clubWheelScreen | 8 candidates |
| 430x932 | playerOne-long-club-names | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(1) | 15>14px; overflow-x visible; glyph range outside no; 01 DRAW |
| 430x932 | playerOne-long-club-names | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(2) | 15>14px; overflow-x visible; glyph range outside no; 02 PACK 1 |
| 430x932 | playerOne-long-club-names | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(3) | 15>14px; overflow-x visible; glyph range outside no; 03 PACK 2 |
| 430x932 | playerOne-long-club-names | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(4) | 15>14px; overflow-x visible; glyph range outside no; 04 VS |
| 430x932 | playerOne-long-club-names | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.active:nth-of-type(5) | 20>14px; overflow-x visible; glyph range outside no; 05 LOCK |
| 430x932 | playerOne-long-club-names | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 296>248px; overflow-x hidden; glyph range outside no; Deportivo La Coruña |
| 430x932 | playerOne-long-club-names | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 294>246px; overflow-x hidden; glyph range outside no; Borussia Mönchengladbach |
| 430x932 | playerOne-long-club-names | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 78>73px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 430x932 | playerOne-long-club-names | Primary action in first screenful | #continueClubAssignment | yes; 356×52px; top/bottom 871/923px; CONFIRM SHARED SHOWDOWN; center unobscured yes |
| 430x932 | playerOne-local-ready | Horizontal scrollbar | html / body | no; scroll/client 430/430px; overflow hidden/hidden |
| 430x932 | playerOne-local-ready | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 430x932 | playerOne-local-ready | Touch control <44px | #clubWheelScreen | 0 of 2 visible controls |
| 430x932 | playerOne-local-ready | Text scrollWidth > clientWidth | #clubWheelScreen | 7 candidates |
| 430x932 | playerOne-local-ready | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span:nth-of-type(1) | 15>14px; overflow-x visible; glyph range outside no; 01 DRAW |
| 430x932 | playerOne-local-ready | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span:nth-of-type(2) | 15>14px; overflow-x visible; glyph range outside no; 02 PACK 1 |
| 430x932 | playerOne-local-ready | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span:nth-of-type(3) | 15>14px; overflow-x visible; glyph range outside no; 03 PACK 2 |
| 430x932 | playerOne-local-ready | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span:nth-of-type(4) | 15>14px; overflow-x visible; glyph range outside no; 04 VS |
| 430x932 | playerOne-local-ready | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span:nth-of-type(5) | 15>14px; overflow-x visible; glyph range outside no; 05 LOCK |
| 430x932 | playerOne-local-ready | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 296>248px; overflow-x hidden; glyph range outside no; ? |
| 430x932 | playerOne-local-ready | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 294>246px; overflow-x hidden; glyph range outside no; ? |
| 430x932 | playerOne-local-ready | Primary action in first screenful | #openClubPack | yes; 356×52px; top/bottom 872/924px; OPEN SHOWDOWN PACKS; disabled; center unobscured yes |
| 430x932 | playerOne-local-opening | Horizontal scrollbar | html / body | no; scroll/client 430/430px; overflow hidden/hidden |
| 430x932 | playerOne-local-opening | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 430x932 | playerOne-local-opening | Touch control <44px | #clubWheelScreen | 0 of 1 visible controls |
| 430x932 | playerOne-local-opening | Text scrollWidth > clientWidth | #clubWheelScreen | 7 candidates |
| 430x932 | playerOne-local-opening | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.active:nth-of-type(1) | 21>14px; overflow-x visible; glyph range outside no; 01 DRAW |
| 430x932 | playerOne-local-opening | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span:nth-of-type(2) | 15>14px; overflow-x visible; glyph range outside no; 02 PACK 1 |
| 430x932 | playerOne-local-opening | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span:nth-of-type(3) | 15>14px; overflow-x visible; glyph range outside no; 03 PACK 2 |
| 430x932 | playerOne-local-opening | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span:nth-of-type(4) | 15>14px; overflow-x visible; glyph range outside no; 04 VS |
| 430x932 | playerOne-local-opening | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span:nth-of-type(5) | 15>14px; overflow-x visible; glyph range outside no; 05 LOCK |
| 430x932 | playerOne-local-opening | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 296>248px; overflow-x hidden; glyph range outside no; ? |
| 430x932 | playerOne-local-opening | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 294>246px; overflow-x hidden; glyph range outside no; ? |
| 430x932 | playerOne-local-opening | Primary action in first screenful | #openClubPack | yes; 356×52px; top/bottom 872/924px; DRAW LOCKED...; disabled; center unobscured yes |
| 430x932 | playerOne-local-manager-one | Horizontal scrollbar | html / body | no; scroll/client 430/430px; overflow hidden/hidden |
| 430x932 | playerOne-local-manager-one | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 430x932 | playerOne-local-manager-one | Touch control <44px | #clubWheelScreen | 0 of 1 visible controls |
| 430x932 | playerOne-local-manager-one | Text scrollWidth > clientWidth | #clubWheelScreen | 7 candidates |
| 430x932 | playerOne-local-manager-one | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(1) | 15>14px; overflow-x visible; glyph range outside no; 01 DRAW |
| 430x932 | playerOne-local-manager-one | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.active:nth-of-type(2) | 24>14px; overflow-x visible; glyph range outside no; 02 PACK 1 |
| 430x932 | playerOne-local-manager-one | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span:nth-of-type(3) | 15>14px; overflow-x visible; glyph range outside no; 03 PACK 2 |
| 430x932 | playerOne-local-manager-one | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span:nth-of-type(4) | 15>14px; overflow-x visible; glyph range outside no; 04 VS |
| 430x932 | playerOne-local-manager-one | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span:nth-of-type(5) | 15>14px; overflow-x visible; glyph range outside no; 05 LOCK |
| 430x932 | playerOne-local-manager-one | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 296>248px; overflow-x hidden; glyph range outside no; Osasuna |
| 430x932 | playerOne-local-manager-one | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 294>246px; overflow-x hidden; glyph range outside no; ? |
| 430x932 | playerOne-local-manager-one | Primary action in first screenful | #openClubPack | yes; 356×52px; top/bottom 872/924px; DRAW LOCKED...; disabled; center unobscured yes |
| 430x932 | playerOne-local-manager-two | Horizontal scrollbar | html / body | no; scroll/client 430/430px; overflow hidden/hidden |
| 430x932 | playerOne-local-manager-two | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 430x932 | playerOne-local-manager-two | Touch control <44px | #clubWheelScreen | 0 of 1 visible controls |
| 430x932 | playerOne-local-manager-two | Text scrollWidth > clientWidth | #clubWheelScreen | 7 candidates |
| 430x932 | playerOne-local-manager-two | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(1) | 15>14px; overflow-x visible; glyph range outside no; 01 DRAW |
| 430x932 | playerOne-local-manager-two | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(2) | 15>14px; overflow-x visible; glyph range outside no; 02 PACK 1 |
| 430x932 | playerOne-local-manager-two | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.active:nth-of-type(3) | 25>14px; overflow-x visible; glyph range outside no; 03 PACK 2 |
| 430x932 | playerOne-local-manager-two | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span:nth-of-type(4) | 15>14px; overflow-x visible; glyph range outside no; 04 VS |
| 430x932 | playerOne-local-manager-two | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span:nth-of-type(5) | 15>14px; overflow-x visible; glyph range outside no; 05 LOCK |
| 430x932 | playerOne-local-manager-two | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 296>248px; overflow-x hidden; glyph range outside no; Osasuna |
| 430x932 | playerOne-local-manager-two | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 294>246px; overflow-x hidden; glyph range outside no; Espanyol |
| 430x932 | playerOne-local-manager-two | Primary action in first screenful | #openClubPack | yes; 356×52px; top/bottom 872/924px; DRAW LOCKED...; disabled; center unobscured yes |
| 430x932 | playerOne-local-versus | Horizontal scrollbar | html / body | no; scroll/client 430/430px; overflow hidden/hidden |
| 430x932 | playerOne-local-versus | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 430x932 | playerOne-local-versus | Touch control <44px | #clubWheelScreen | 0 of 0 visible controls |
| 430x932 | playerOne-local-versus | Text scrollWidth > clientWidth | #clubWheelScreen | 8 candidates |
| 430x932 | playerOne-local-versus | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(1) | 15>14px; overflow-x visible; glyph range outside no; 01 DRAW |
| 430x932 | playerOne-local-versus | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(2) | 15>14px; overflow-x visible; glyph range outside no; 02 PACK 1 |
| 430x932 | playerOne-local-versus | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(3) | 15>14px; overflow-x visible; glyph range outside no; 03 PACK 2 |
| 430x932 | playerOne-local-versus | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.active:nth-of-type(4) | 15>14px; overflow-x visible; glyph range outside no; 04 VS |
| 430x932 | playerOne-local-versus | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span:nth-of-type(5) | 15>14px; overflow-x visible; glyph range outside no; 05 LOCK |
| 430x932 | playerOne-local-versus | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 296>248px; overflow-x hidden; glyph range outside no; Osasuna |
| 430x932 | playerOne-local-versus | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 294>246px; overflow-x hidden; glyph range outside no; Espanyol |
| 430x932 | playerOne-local-versus | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 78>73px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 430x932 | playerOne-local-versus | Primary action in first screenful | none | N/A no visible action |
| 430x932 | playerOne-local-confirmation | Horizontal scrollbar | html / body | no; scroll/client 430/430px; overflow hidden/hidden |
| 430x932 | playerOne-local-confirmation | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 430x932 | playerOne-local-confirmation | Touch control <44px | #clubWheelScreen | 0 of 1 visible controls |
| 430x932 | playerOne-local-confirmation | Text scrollWidth > clientWidth | #clubWheelScreen | 8 candidates |
| 430x932 | playerOne-local-confirmation | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(1) | 15>14px; overflow-x visible; glyph range outside no; 01 DRAW |
| 430x932 | playerOne-local-confirmation | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(2) | 15>14px; overflow-x visible; glyph range outside no; 02 PACK 1 |
| 430x932 | playerOne-local-confirmation | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(3) | 15>14px; overflow-x visible; glyph range outside no; 03 PACK 2 |
| 430x932 | playerOne-local-confirmation | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(4) | 15>14px; overflow-x visible; glyph range outside no; 04 VS |
| 430x932 | playerOne-local-confirmation | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.active:nth-of-type(5) | 20>14px; overflow-x visible; glyph range outside no; 05 LOCK |
| 430x932 | playerOne-local-confirmation | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 296>248px; overflow-x hidden; glyph range outside no; Osasuna |
| 430x932 | playerOne-local-confirmation | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 294>246px; overflow-x hidden; glyph range outside no; Espanyol |
| 430x932 | playerOne-local-confirmation | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 78>73px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 430x932 | playerOne-local-confirmation | Primary action in first screenful | #continueClubAssignment | yes; 356×52px; top/bottom 871/923px; CONFIRM RIVALRY & START SHOWDOWN; center unobscured yes |
| 430x932 | playerTwo-sealed | Horizontal scrollbar | html / body | no; scroll/client 430/430px; overflow hidden/hidden |
| 430x932 | playerTwo-sealed | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 430x932 | playerTwo-sealed | Touch control <44px | #clubWheelScreen | 0 of 1 visible controls |
| 430x932 | playerTwo-sealed | Text scrollWidth > clientWidth | #clubWheelScreen | 0 candidates |
| 430x932 | playerTwo-sealed | Primary action in first screenful | #openClubPack | yes; 356×52px; top/bottom 872/924px; WAITING FOR HOST PACK REVEAL; disabled; center unobscured yes |
| 430x932 | playerTwo-opening | Horizontal scrollbar | html / body | no; scroll/client 430/430px; overflow hidden/hidden |
| 430x932 | playerTwo-opening | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 430x932 | playerTwo-opening | Touch control <44px | #clubWheelScreen | 0 of 0 visible controls |
| 430x932 | playerTwo-opening | Text scrollWidth > clientWidth | #clubWheelScreen | 5 candidates |
| 430x932 | playerTwo-opening | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-is-animating:nth-of-type(2) > span.active:nth-of-type(1) | 21>14px; overflow-x visible; glyph range outside no; 01 DRAW |
| 430x932 | playerTwo-opening | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-is-animating:nth-of-type(2) > span:nth-of-type(2) | 15>14px; overflow-x visible; glyph range outside no; 02 PACK 1 |
| 430x932 | playerTwo-opening | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-is-animating:nth-of-type(2) > span:nth-of-type(3) | 15>14px; overflow-x visible; glyph range outside no; 03 PACK 2 |
| 430x932 | playerTwo-opening | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-is-animating:nth-of-type(2) > span:nth-of-type(4) | 15>14px; overflow-x visible; glyph range outside no; 04 VS |
| 430x932 | playerTwo-opening | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-is-animating:nth-of-type(2) > span:nth-of-type(5) | 15>14px; overflow-x visible; glyph range outside no; 05 LOCK |
| 430x932 | playerTwo-opening | Primary action in first screenful | none | N/A no visible action |
| 430x932 | playerTwo-manager-one | Horizontal scrollbar | html / body | no; scroll/client 430/430px; overflow hidden/hidden |
| 430x932 | playerTwo-manager-one | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 430x932 | playerTwo-manager-one | Touch control <44px | #clubWheelScreen | 0 of 0 visible controls |
| 430x932 | playerTwo-manager-one | Text scrollWidth > clientWidth | #clubWheelScreen | 6 candidates |
| 430x932 | playerTwo-manager-one | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(1) | 15>14px; overflow-x visible; glyph range outside no; 01 DRAW |
| 430x932 | playerTwo-manager-one | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.active:nth-of-type(2) | 24>14px; overflow-x visible; glyph range outside no; 02 PACK 1 |
| 430x932 | playerTwo-manager-one | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span:nth-of-type(3) | 15>14px; overflow-x visible; glyph range outside no; 03 PACK 2 |
| 430x932 | playerTwo-manager-one | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span:nth-of-type(4) | 15>14px; overflow-x visible; glyph range outside no; 04 VS |
| 430x932 | playerTwo-manager-one | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span:nth-of-type(5) | 15>14px; overflow-x visible; glyph range outside no; 05 LOCK |
| 430x932 | playerTwo-manager-one | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span | 98>73px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 430x932 | playerTwo-manager-one | Primary action in first screenful | none | N/A no visible action |
| 430x932 | playerTwo-manager-two | Horizontal scrollbar | html / body | no; scroll/client 430/430px; overflow hidden/hidden |
| 430x932 | playerTwo-manager-two | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 430x932 | playerTwo-manager-two | Touch control <44px | #clubWheelScreen | 0 of 0 visible controls |
| 430x932 | playerTwo-manager-two | Text scrollWidth > clientWidth | #clubWheelScreen | 7 candidates |
| 430x932 | playerTwo-manager-two | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(1) | 15>14px; overflow-x visible; glyph range outside no; 01 DRAW |
| 430x932 | playerTwo-manager-two | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(2) | 15>14px; overflow-x visible; glyph range outside no; 02 PACK 1 |
| 430x932 | playerTwo-manager-two | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.active:nth-of-type(3) | 25>14px; overflow-x visible; glyph range outside no; 03 PACK 2 |
| 430x932 | playerTwo-manager-two | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span:nth-of-type(4) | 15>14px; overflow-x visible; glyph range outside no; 04 VS |
| 430x932 | playerTwo-manager-two | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span:nth-of-type(5) | 15>14px; overflow-x visible; glyph range outside no; 05 LOCK |
| 430x932 | playerTwo-manager-two | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 296>248px; overflow-x hidden; glyph range outside no; Osasuna |
| 430x932 | playerTwo-manager-two | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span | 98>73px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 430x932 | playerTwo-manager-two | Primary action in first screenful | none | N/A no visible action |
| 430x932 | playerTwo-clubs-locked-awaiting-season | Horizontal scrollbar | html / body | no; scroll/client 430/430px; overflow hidden/hidden |
| 430x932 | playerTwo-clubs-locked-awaiting-season | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 430x932 | playerTwo-clubs-locked-awaiting-season | Touch control <44px | #clubWheelScreen | 0 of 0 visible controls |
| 430x932 | playerTwo-clubs-locked-awaiting-season | Text scrollWidth > clientWidth | #clubWheelScreen | 8 candidates |
| 430x932 | playerTwo-clubs-locked-awaiting-season | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(1) | 15>14px; overflow-x visible; glyph range outside no; 01 DRAW |
| 430x932 | playerTwo-clubs-locked-awaiting-season | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(2) | 15>14px; overflow-x visible; glyph range outside no; 02 PACK 1 |
| 430x932 | playerTwo-clubs-locked-awaiting-season | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(3) | 15>14px; overflow-x visible; glyph range outside no; 03 PACK 2 |
| 430x932 | playerTwo-clubs-locked-awaiting-season | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(4) | 15>14px; overflow-x visible; glyph range outside no; 04 VS |
| 430x932 | playerTwo-clubs-locked-awaiting-season | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.active:nth-of-type(5) | 20>14px; overflow-x visible; glyph range outside no; 05 LOCK |
| 430x932 | playerTwo-clubs-locked-awaiting-season | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 296>248px; overflow-x hidden; glyph range outside no; Osasuna |
| 430x932 | playerTwo-clubs-locked-awaiting-season | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 294>246px; overflow-x hidden; glyph range outside no; Espanyol |
| 430x932 | playerTwo-clubs-locked-awaiting-season | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 78>73px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 430x932 | playerTwo-clubs-locked-awaiting-season | Primary action in first screenful | none | N/A no visible action |
| 430x932 | playerTwo-confirm | Horizontal scrollbar | html / body | no; scroll/client 430/430px; overflow hidden/hidden |
| 430x932 | playerTwo-confirm | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 430x932 | playerTwo-confirm | Touch control <44px | #clubWheelScreen | 0 of 1 visible controls |
| 430x932 | playerTwo-confirm | Text scrollWidth > clientWidth | #clubWheelScreen | 8 candidates |
| 430x932 | playerTwo-confirm | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(1) | 15>14px; overflow-x visible; glyph range outside no; 01 DRAW |
| 430x932 | playerTwo-confirm | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(2) | 15>14px; overflow-x visible; glyph range outside no; 02 PACK 1 |
| 430x932 | playerTwo-confirm | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(3) | 15>14px; overflow-x visible; glyph range outside no; 03 PACK 2 |
| 430x932 | playerTwo-confirm | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(4) | 15>14px; overflow-x visible; glyph range outside no; 04 VS |
| 430x932 | playerTwo-confirm | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.active:nth-of-type(5) | 20>14px; overflow-x visible; glyph range outside no; 05 LOCK |
| 430x932 | playerTwo-confirm | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 296>248px; overflow-x hidden; glyph range outside no; Osasuna |
| 430x932 | playerTwo-confirm | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 294>246px; overflow-x hidden; glyph range outside no; Espanyol |
| 430x932 | playerTwo-confirm | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 78>73px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 430x932 | playerTwo-confirm | Primary action in first screenful | #continueClubAssignment | yes; 356×52px; top/bottom 872/924px; CONFIRM SHARED SHOWDOWN; center unobscured yes |
| 430x932 | playerTwo-confirm-write-failure | Horizontal scrollbar | html / body | no; scroll/client 430/430px; overflow hidden/hidden |
| 430x932 | playerTwo-confirm-write-failure | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 430x932 | playerTwo-confirm-write-failure | Touch control <44px | #clubWheelScreen | 0 of 1 visible controls |
| 430x932 | playerTwo-confirm-write-failure | Text scrollWidth > clientWidth | #clubWheelScreen | 8 candidates |
| 430x932 | playerTwo-confirm-write-failure | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(1) | 15>14px; overflow-x visible; glyph range outside no; 01 DRAW |
| 430x932 | playerTwo-confirm-write-failure | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(2) | 15>14px; overflow-x visible; glyph range outside no; 02 PACK 1 |
| 430x932 | playerTwo-confirm-write-failure | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(3) | 15>14px; overflow-x visible; glyph range outside no; 03 PACK 2 |
| 430x932 | playerTwo-confirm-write-failure | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(4) | 15>14px; overflow-x visible; glyph range outside no; 04 VS |
| 430x932 | playerTwo-confirm-write-failure | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.active:nth-of-type(5) | 20>14px; overflow-x visible; glyph range outside no; 05 LOCK |
| 430x932 | playerTwo-confirm-write-failure | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 296>248px; overflow-x hidden; glyph range outside no; Osasuna |
| 430x932 | playerTwo-confirm-write-failure | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 294>246px; overflow-x hidden; glyph range outside no; Espanyol |
| 430x932 | playerTwo-confirm-write-failure | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 78>73px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 430x932 | playerTwo-confirm-write-failure | Primary action in first screenful | #continueClubAssignment | yes; 356×52px; top/bottom 871/923px; CONFIRM SHARED SHOWDOWN; center unobscured yes |
| 430x932 | playerTwo-waiting-rival | Horizontal scrollbar | html / body | no; scroll/client 430/430px; overflow hidden/hidden |
| 430x932 | playerTwo-waiting-rival | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 430x932 | playerTwo-waiting-rival | Touch control <44px | #clubWheelScreen | 0 of 1 visible controls |
| 430x932 | playerTwo-waiting-rival | Text scrollWidth > clientWidth | #clubWheelScreen | 8 candidates |
| 430x932 | playerTwo-waiting-rival | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(1) | 15>14px; overflow-x visible; glyph range outside no; 01 DRAW |
| 430x932 | playerTwo-waiting-rival | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(2) | 15>14px; overflow-x visible; glyph range outside no; 02 PACK 1 |
| 430x932 | playerTwo-waiting-rival | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(3) | 15>14px; overflow-x visible; glyph range outside no; 03 PACK 2 |
| 430x932 | playerTwo-waiting-rival | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(4) | 15>14px; overflow-x visible; glyph range outside no; 04 VS |
| 430x932 | playerTwo-waiting-rival | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.active:nth-of-type(5) | 20>14px; overflow-x visible; glyph range outside no; 05 LOCK |
| 430x932 | playerTwo-waiting-rival | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 296>248px; overflow-x hidden; glyph range outside no; Osasuna |
| 430x932 | playerTwo-waiting-rival | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 294>246px; overflow-x hidden; glyph range outside no; Espanyol |
| 430x932 | playerTwo-waiting-rival | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 78>73px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 430x932 | playerTwo-waiting-rival | Primary action in first screenful | #continueClubAssignment | yes; 356×52px; top/bottom 872/924px; CONFIRMED · WAITING FOR RIVAL; disabled; center unobscured yes |
| 430x932 | playerTwo-reconnect | Horizontal scrollbar | html / body | no; scroll/client 430/430px; overflow hidden/hidden |
| 430x932 | playerTwo-reconnect | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 430x932 | playerTwo-reconnect | Touch control <44px | #clubWheelScreen | 0 of 1 visible controls |
| 430x932 | playerTwo-reconnect | Text scrollWidth > clientWidth | #clubWheelScreen | 8 candidates |
| 430x932 | playerTwo-reconnect | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(1) | 15>14px; overflow-x visible; glyph range outside no; 01 DRAW |
| 430x932 | playerTwo-reconnect | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(2) | 15>14px; overflow-x visible; glyph range outside no; 02 PACK 1 |
| 430x932 | playerTwo-reconnect | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(3) | 15>14px; overflow-x visible; glyph range outside no; 03 PACK 2 |
| 430x932 | playerTwo-reconnect | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(4) | 15>14px; overflow-x visible; glyph range outside no; 04 VS |
| 430x932 | playerTwo-reconnect | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.active:nth-of-type(5) | 20>14px; overflow-x visible; glyph range outside no; 05 LOCK |
| 430x932 | playerTwo-reconnect | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 296>248px; overflow-x hidden; glyph range outside no; Osasuna |
| 430x932 | playerTwo-reconnect | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 294>246px; overflow-x hidden; glyph range outside no; Espanyol |
| 430x932 | playerTwo-reconnect | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 78>73px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 430x932 | playerTwo-reconnect | Primary action in first screenful | #continueClubAssignment | yes; 356×52px; top/bottom 872/924px; RECONNECT PLAYERS TO CONTINUE; disabled; center unobscured yes |
| 430x932 | playerTwo-career-start-ready | Horizontal scrollbar | html / body | no; scroll/client 430/430px; overflow hidden/hidden |
| 430x932 | playerTwo-career-start-ready | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 430x932 | playerTwo-career-start-ready | Touch control <44px | #clubWheelScreen | 0 of 1 visible controls |
| 430x932 | playerTwo-career-start-ready | Text scrollWidth > clientWidth | #clubWheelScreen | 8 candidates |
| 430x932 | playerTwo-career-start-ready | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(1) | 15>14px; overflow-x visible; glyph range outside no; 01 DRAW |
| 430x932 | playerTwo-career-start-ready | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(2) | 15>14px; overflow-x visible; glyph range outside no; 02 PACK 1 |
| 430x932 | playerTwo-career-start-ready | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(3) | 15>14px; overflow-x visible; glyph range outside no; 03 PACK 2 |
| 430x932 | playerTwo-career-start-ready | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(4) | 15>14px; overflow-x visible; glyph range outside no; 04 VS |
| 430x932 | playerTwo-career-start-ready | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.active:nth-of-type(5) | 20>14px; overflow-x visible; glyph range outside no; 05 LOCK |
| 430x932 | playerTwo-career-start-ready | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 296>248px; overflow-x hidden; glyph range outside no; Osasuna |
| 430x932 | playerTwo-career-start-ready | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 294>246px; overflow-x hidden; glyph range outside no; Espanyol |
| 430x932 | playerTwo-career-start-ready | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 78>73px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 430x932 | playerTwo-career-start-ready | Primary action in first screenful | #continueClubAssignment | yes; 356×52px; top/bottom 871/923px; CONTINUE TO CAREER START; center unobscured yes |
| 430x932 | playerTwo-season-mismatch | Horizontal scrollbar | html / body | no; scroll/client 430/430px; overflow hidden/hidden |
| 430x932 | playerTwo-season-mismatch | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 430x932 | playerTwo-season-mismatch | Touch control <44px | #clubWheelScreen | 0 of 1 visible controls |
| 430x932 | playerTwo-season-mismatch | Text scrollWidth > clientWidth | #clubWheelScreen | 8 candidates |
| 430x932 | playerTwo-season-mismatch | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(1) | 15>14px; overflow-x visible; glyph range outside no; 01 DRAW |
| 430x932 | playerTwo-season-mismatch | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(2) | 15>14px; overflow-x visible; glyph range outside no; 02 PACK 1 |
| 430x932 | playerTwo-season-mismatch | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(3) | 15>14px; overflow-x visible; glyph range outside no; 03 PACK 2 |
| 430x932 | playerTwo-season-mismatch | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(4) | 15>14px; overflow-x visible; glyph range outside no; 04 VS |
| 430x932 | playerTwo-season-mismatch | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.active:nth-of-type(5) | 20>14px; overflow-x visible; glyph range outside no; 05 LOCK |
| 430x932 | playerTwo-season-mismatch | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 296>248px; overflow-x hidden; glyph range outside no; Osasuna |
| 430x932 | playerTwo-season-mismatch | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 294>246px; overflow-x hidden; glyph range outside no; Espanyol |
| 430x932 | playerTwo-season-mismatch | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 78>73px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 430x932 | playerTwo-season-mismatch | Primary action in first screenful | #continueClubAssignment | yes; 356×52px; top/bottom 872/924px; SEASON PLAN MISMATCH · RECOVERY REQUIRED; disabled; center unobscured yes |
| 430x932 | playerTwo-long-club-names | Horizontal scrollbar | html / body | no; scroll/client 430/430px; overflow hidden/hidden |
| 430x932 | playerTwo-long-club-names | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 430x932 | playerTwo-long-club-names | Touch control <44px | #clubWheelScreen | 0 of 1 visible controls |
| 430x932 | playerTwo-long-club-names | Text scrollWidth > clientWidth | #clubWheelScreen | 8 candidates |
| 430x932 | playerTwo-long-club-names | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(1) | 15>14px; overflow-x visible; glyph range outside no; 01 DRAW |
| 430x932 | playerTwo-long-club-names | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(2) | 15>14px; overflow-x visible; glyph range outside no; 02 PACK 1 |
| 430x932 | playerTwo-long-club-names | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(3) | 15>14px; overflow-x visible; glyph range outside no; 03 PACK 2 |
| 430x932 | playerTwo-long-club-names | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(4) | 15>14px; overflow-x visible; glyph range outside no; 04 VS |
| 430x932 | playerTwo-long-club-names | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.active:nth-of-type(5) | 20>14px; overflow-x visible; glyph range outside no; 05 LOCK |
| 430x932 | playerTwo-long-club-names | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 296>248px; overflow-x hidden; glyph range outside no; Deportivo La Coruña |
| 430x932 | playerTwo-long-club-names | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 294>246px; overflow-x hidden; glyph range outside no; Borussia Mönchengladbach |
| 430x932 | playerTwo-long-club-names | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 78>73px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 430x932 | playerTwo-long-club-names | Primary action in first screenful | #continueClubAssignment | yes; 356×52px; top/bottom 871/923px; CONFIRM SHARED SHOWDOWN; center unobscured yes |
| 430x932 | playerOne-confirmation-overlap-detail | Horizontal scrollbar | html / body | no; scroll/client 430/430px; overflow hidden/hidden |
| 430x932 | playerOne-confirmation-overlap-detail | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 430x932 | playerOne-confirmation-overlap-detail | Touch control <44px | #clubWheelScreen | 0 of 1 visible controls |
| 430x932 | playerOne-confirmation-overlap-detail | Text scrollWidth > clientWidth | #clubWheelScreen | 8 candidates |
| 430x932 | playerOne-confirmation-overlap-detail | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(1) | 15>14px; overflow-x visible; glyph range outside no; 01 DRAW |
| 430x932 | playerOne-confirmation-overlap-detail | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(2) | 15>14px; overflow-x visible; glyph range outside no; 02 PACK 1 |
| 430x932 | playerOne-confirmation-overlap-detail | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(3) | 15>14px; overflow-x visible; glyph range outside no; 03 PACK 2 |
| 430x932 | playerOne-confirmation-overlap-detail | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(4) | 15>14px; overflow-x visible; glyph range outside no; 04 VS |
| 430x932 | playerOne-confirmation-overlap-detail | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.active:nth-of-type(5) | 20>14px; overflow-x visible; glyph range outside no; 05 LOCK |
| 430x932 | playerOne-confirmation-overlap-detail | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 296>248px; overflow-x hidden; glyph range outside no; Osasuna |
| 430x932 | playerOne-confirmation-overlap-detail | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 294>246px; overflow-x hidden; glyph range outside no; Espanyol |
| 430x932 | playerOne-confirmation-overlap-detail | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 78>73px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 430x932 | playerOne-confirmation-overlap-detail | Primary action in first screenful | #continueClubAssignment | yes; 356×52px; top/bottom 872/924px; CONFIRM SHARED SHOWDOWN; center unobscured yes |
| 430x932 | playerTwo-confirmation-overlap-detail | Horizontal scrollbar | html / body | no; scroll/client 430/430px; overflow hidden/hidden |
| 430x932 | playerTwo-confirmation-overlap-detail | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 430x932 | playerTwo-confirmation-overlap-detail | Touch control <44px | #clubWheelScreen | 0 of 1 visible controls |
| 430x932 | playerTwo-confirmation-overlap-detail | Text scrollWidth > clientWidth | #clubWheelScreen | 8 candidates |
| 430x932 | playerTwo-confirmation-overlap-detail | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(1) | 15>14px; overflow-x visible; glyph range outside no; 01 DRAW |
| 430x932 | playerTwo-confirmation-overlap-detail | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(2) | 15>14px; overflow-x visible; glyph range outside no; 02 PACK 1 |
| 430x932 | playerTwo-confirmation-overlap-detail | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(3) | 15>14px; overflow-x visible; glyph range outside no; 03 PACK 2 |
| 430x932 | playerTwo-confirmation-overlap-detail | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.done:nth-of-type(4) | 15>14px; overflow-x visible; glyph range outside no; 04 VS |
| 430x932 | playerTwo-confirmation-overlap-detail | Decorative text width overflow | #clubWheelScreen > div.clubAssignmentShell:nth-of-type(4) > div.clubRevealProgress.sd-entered:nth-of-type(2) > span.active:nth-of-type(5) | 20>14px; overflow-x visible; glyph range outside no; 05 LOCK |
| 430x932 | playerTwo-confirmation-overlap-detail | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 296>248px; overflow-x hidden; glyph range outside no; Osasuna |
| 430x932 | playerTwo-confirmation-overlap-detail | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 294>246px; overflow-x hidden; glyph range outside no; Espanyol |
| 430x932 | playerTwo-confirmation-overlap-detail | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 78>73px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 430x932 | playerTwo-confirmation-overlap-detail | Primary action in first screenful | #continueClubAssignment | yes; 356×52px; top/bottom 872/924px; CONFIRM SHARED SHOWDOWN; center unobscured yes |
| 844x390 | playerOne-sealed | Horizontal scrollbar | html / body | no; scroll/client 844/844px; overflow visible/hidden |
| 844x390 | playerOne-sealed | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 844x390 | playerOne-sealed | Touch control <44px | #clubWheelScreen | 1 of 1 visible controls |
| 844x390 | playerOne-sealed | Touch target <44px | #openClubPack | 300×27.7px |
| 844x390 | playerOne-sealed | Text scrollWidth > clientWidth | #clubWheelScreen | 0 candidates |
| 844x390 | playerOne-sealed | Primary action in first screenful | #openClubPack | yes; 300×27.7px; top/bottom 354/381.7px; OPEN SHOWDOWN PACKS; center unobscured yes |
| 844x390 | playerOne-provider-working | Horizontal scrollbar | html / body | no; scroll/client 844/844px; overflow visible/hidden |
| 844x390 | playerOne-provider-working | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 844x390 | playerOne-provider-working | Touch control <44px | #clubWheelScreen | 1 of 1 visible controls |
| 844x390 | playerOne-provider-working | Touch target <44px | #openClubPack | 300×27.7px; disabled |
| 844x390 | playerOne-provider-working | Text scrollWidth > clientWidth | #clubWheelScreen | 0 candidates |
| 844x390 | playerOne-provider-working | Primary action in first screenful | #openClubPack | yes; 300×27.7px; top/bottom 354/381.7px; WORKING…; disabled; center unobscured yes |
| 844x390 | playerOne-pack-write-failure | Horizontal scrollbar | html / body | no; scroll/client 844/844px; overflow visible/hidden |
| 844x390 | playerOne-pack-write-failure | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 844x390 | playerOne-pack-write-failure | Touch control <44px | #clubWheelScreen | 1 of 1 visible controls |
| 844x390 | playerOne-pack-write-failure | Touch target <44px | #openClubPack | 300×27.7px |
| 844x390 | playerOne-pack-write-failure | Text scrollWidth > clientWidth | #clubWheelScreen | 0 candidates |
| 844x390 | playerOne-pack-write-failure | Primary action in first screenful | #openClubPack | yes; 300×27.7px; top/bottom 353/380.7px; OPEN SHOWDOWN PACKS; center unobscured yes |
| 844x390 | playerOne-opening | Horizontal scrollbar | html / body | no; scroll/client 844/844px; overflow visible/hidden |
| 844x390 | playerOne-opening | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 844x390 | playerOne-opening | Touch control <44px | #clubWheelScreen | 0 of 0 visible controls |
| 844x390 | playerOne-opening | Text scrollWidth > clientWidth | #clubWheelScreen | 1 candidates |
| 844x390 | playerOne-opening | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span | 139>105px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 844x390 | playerOne-opening | Primary action in first screenful | none | N/A no visible action |
| 844x390 | playerOne-manager-one | Horizontal scrollbar | html / body | no; scroll/client 844/844px; overflow visible/hidden |
| 844x390 | playerOne-manager-one | Element wider than window | #clubWheelScreen | 0 content; 1 decoration |
| 844x390 | playerOne-manager-one | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > div.rvFlap.plateDup:nth-of-type(5) | 849.3px; left/right -2.2/847.1px |
| 844x390 | playerOne-manager-one | Touch control <44px | #clubWheelScreen | 0 of 0 visible controls |
| 844x390 | playerOne-manager-one | Text scrollWidth > clientWidth | #clubWheelScreen | 1 candidates |
| 844x390 | playerOne-manager-one | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span | 139>105px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 844x390 | playerOne-manager-one | Primary action in first screenful | none | N/A no visible action |
| 844x390 | playerOne-manager-two | Horizontal scrollbar | html / body | no; scroll/client 844/844px; overflow visible/hidden |
| 844x390 | playerOne-manager-two | Element wider than window | #clubWheelScreen | 0 content; 1 decoration |
| 844x390 | playerOne-manager-two | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > div.rvFlap.plateDup:nth-of-type(5) | 861.2px; left/right -10.6/850.5px |
| 844x390 | playerOne-manager-two | Touch control <44px | #clubWheelScreen | 0 of 0 visible controls |
| 844x390 | playerOne-manager-two | Text scrollWidth > clientWidth | #clubWheelScreen | 2 candidates |
| 844x390 | playerOne-manager-two | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 244>204px; overflow-x visible; glyph range outside no; Osasuna |
| 844x390 | playerOne-manager-two | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span | 139>105px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 844x390 | playerOne-manager-two | Primary action in first screenful | none | N/A no visible action |
| 844x390 | playerOne-confirm | Horizontal scrollbar | html / body | no; scroll/client 844/844px; overflow visible/hidden |
| 844x390 | playerOne-confirm | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 844x390 | playerOne-confirm | Touch control <44px | #clubWheelScreen | 1 of 1 visible controls |
| 844x390 | playerOne-confirm | Touch target <44px | #continueClubAssignment | 430×27.7px |
| 844x390 | playerOne-confirm | Text scrollWidth > clientWidth | #clubWheelScreen | 3 candidates |
| 844x390 | playerOne-confirm | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 244>204px; overflow-x visible; glyph range outside no; Osasuna |
| 844x390 | playerOne-confirm | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 244>204px; overflow-x visible; glyph range outside no; Espanyol |
| 844x390 | playerOne-confirm | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 114>105px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 844x390 | playerOne-confirm | Primary action in first screenful | #continueClubAssignment | yes; 430×27.7px; top/bottom 353/380.7px; CONFIRM SHARED SHOWDOWN; center unobscured yes |
| 844x390 | playerOne-confirm-write-failure | Horizontal scrollbar | html / body | no; scroll/client 844/844px; overflow visible/hidden |
| 844x390 | playerOne-confirm-write-failure | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 844x390 | playerOne-confirm-write-failure | Touch control <44px | #clubWheelScreen | 1 of 1 visible controls |
| 844x390 | playerOne-confirm-write-failure | Touch target <44px | #continueClubAssignment | 430×27.7px |
| 844x390 | playerOne-confirm-write-failure | Text scrollWidth > clientWidth | #clubWheelScreen | 3 candidates |
| 844x390 | playerOne-confirm-write-failure | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 244>204px; overflow-x visible; glyph range outside no; Osasuna |
| 844x390 | playerOne-confirm-write-failure | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 244>204px; overflow-x visible; glyph range outside no; Espanyol |
| 844x390 | playerOne-confirm-write-failure | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 111>105px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 844x390 | playerOne-confirm-write-failure | Primary action in first screenful | #continueClubAssignment | yes; 430×27.7px; top/bottom 353/380.7px; CONFIRM SHARED SHOWDOWN; center unobscured yes |
| 844x390 | playerOne-waiting-rival | Horizontal scrollbar | html / body | no; scroll/client 844/844px; overflow visible/hidden |
| 844x390 | playerOne-waiting-rival | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 844x390 | playerOne-waiting-rival | Touch control <44px | #clubWheelScreen | 1 of 1 visible controls |
| 844x390 | playerOne-waiting-rival | Touch target <44px | #continueClubAssignment | 430×27.7px; disabled |
| 844x390 | playerOne-waiting-rival | Text scrollWidth > clientWidth | #clubWheelScreen | 3 candidates |
| 844x390 | playerOne-waiting-rival | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 244>204px; overflow-x visible; glyph range outside no; Osasuna |
| 844x390 | playerOne-waiting-rival | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 244>204px; overflow-x visible; glyph range outside no; Espanyol |
| 844x390 | playerOne-waiting-rival | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 111>105px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 844x390 | playerOne-waiting-rival | Primary action in first screenful | #continueClubAssignment | yes; 430×27.7px; top/bottom 354/381.7px; CONFIRMED · WAITING FOR RIVAL; disabled; center unobscured yes |
| 844x390 | playerOne-reconnect | Horizontal scrollbar | html / body | no; scroll/client 844/844px; overflow visible/hidden |
| 844x390 | playerOne-reconnect | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 844x390 | playerOne-reconnect | Touch control <44px | #clubWheelScreen | 1 of 1 visible controls |
| 844x390 | playerOne-reconnect | Touch target <44px | #continueClubAssignment | 430×27.7px; disabled |
| 844x390 | playerOne-reconnect | Text scrollWidth > clientWidth | #clubWheelScreen | 3 candidates |
| 844x390 | playerOne-reconnect | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 244>204px; overflow-x visible; glyph range outside no; Osasuna |
| 844x390 | playerOne-reconnect | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 244>204px; overflow-x visible; glyph range outside no; Espanyol |
| 844x390 | playerOne-reconnect | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 111>105px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 844x390 | playerOne-reconnect | Primary action in first screenful | #continueClubAssignment | yes; 430×27.7px; top/bottom 354/381.7px; RECONNECT PLAYERS TO CONTINUE; disabled; center unobscured yes |
| 844x390 | playerOne-career-start-ready | Horizontal scrollbar | html / body | no; scroll/client 844/844px; overflow visible/hidden |
| 844x390 | playerOne-career-start-ready | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 844x390 | playerOne-career-start-ready | Touch control <44px | #clubWheelScreen | 1 of 1 visible controls |
| 844x390 | playerOne-career-start-ready | Touch target <44px | #continueClubAssignment | 430×27.7px |
| 844x390 | playerOne-career-start-ready | Text scrollWidth > clientWidth | #clubWheelScreen | 3 candidates |
| 844x390 | playerOne-career-start-ready | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 244>204px; overflow-x visible; glyph range outside no; Osasuna |
| 844x390 | playerOne-career-start-ready | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 244>204px; overflow-x visible; glyph range outside no; Espanyol |
| 844x390 | playerOne-career-start-ready | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 111>105px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 844x390 | playerOne-career-start-ready | Primary action in first screenful | #continueClubAssignment | yes; 430×27.7px; top/bottom 353/380.7px; CONTINUE TO CAREER START; center unobscured yes |
| 844x390 | playerOne-season-mismatch | Horizontal scrollbar | html / body | no; scroll/client 844/844px; overflow visible/hidden |
| 844x390 | playerOne-season-mismatch | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 844x390 | playerOne-season-mismatch | Touch control <44px | #clubWheelScreen | 1 of 1 visible controls |
| 844x390 | playerOne-season-mismatch | Touch target <44px | #continueClubAssignment | 430×27.7px; disabled |
| 844x390 | playerOne-season-mismatch | Text scrollWidth > clientWidth | #clubWheelScreen | 3 candidates |
| 844x390 | playerOne-season-mismatch | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 244>204px; overflow-x visible; glyph range outside no; Osasuna |
| 844x390 | playerOne-season-mismatch | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 244>204px; overflow-x visible; glyph range outside no; Espanyol |
| 844x390 | playerOne-season-mismatch | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 111>105px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 844x390 | playerOne-season-mismatch | Primary action in first screenful | #continueClubAssignment | yes; 430×27.7px; top/bottom 354/381.7px; SEASON PLAN MISMATCH · RECOVERY REQUIRED; disabled; center unobscured yes |
| 844x390 | playerOne-long-club-names | Horizontal scrollbar | html / body | no; scroll/client 844/844px; overflow visible/hidden |
| 844x390 | playerOne-long-club-names | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 844x390 | playerOne-long-club-names | Touch control <44px | #clubWheelScreen | 1 of 1 visible controls |
| 844x390 | playerOne-long-club-names | Touch target <44px | #continueClubAssignment | 430×27.7px |
| 844x390 | playerOne-long-club-names | Text scrollWidth > clientWidth | #clubWheelScreen | 3 candidates |
| 844x390 | playerOne-long-club-names | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 244>204px; overflow-x visible; glyph range outside no; Deportivo La Coruña |
| 844x390 | playerOne-long-club-names | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 244>204px; overflow-x visible; glyph range outside yes; Borussia Mönchengladbach |
| 844x390 | playerOne-long-club-names | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 111>105px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 844x390 | playerOne-long-club-names | Primary action in first screenful | #continueClubAssignment | yes; 430×27.7px; top/bottom 353/380.7px; CONFIRM SHARED SHOWDOWN; center unobscured yes |
| 844x390 | playerOne-local-ready | Horizontal scrollbar | html / body | no; scroll/client 844/844px; overflow visible/hidden |
| 844x390 | playerOne-local-ready | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 844x390 | playerOne-local-ready | Touch control <44px | #clubWheelScreen | 2 of 2 visible controls |
| 844x390 | playerOne-local-ready | Touch target <44px | #openClubPack | 300×27.7px; disabled |
| 844x390 | playerOne-local-ready | Touch target <44px | #clubAssignmentBack | 120×27.7px |
| 844x390 | playerOne-local-ready | Text scrollWidth > clientWidth | #clubWheelScreen | 2 candidates |
| 844x390 | playerOne-local-ready | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 244>204px; overflow-x visible; glyph range outside no; ? |
| 844x390 | playerOne-local-ready | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 244>204px; overflow-x visible; glyph range outside no; ? |
| 844x390 | playerOne-local-ready | Primary action in first screenful | #openClubPack | yes; 300×27.7px; top/bottom 354/381.7px; OPEN SHOWDOWN PACKS; disabled; center unobscured yes |
| 844x390 | playerOne-local-opening | Horizontal scrollbar | html / body | no; scroll/client 844/844px; overflow visible/hidden |
| 844x390 | playerOne-local-opening | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 844x390 | playerOne-local-opening | Touch control <44px | #clubWheelScreen | 1 of 1 visible controls |
| 844x390 | playerOne-local-opening | Touch target <44px | #openClubPack | 300×27.7px; disabled |
| 844x390 | playerOne-local-opening | Text scrollWidth > clientWidth | #clubWheelScreen | 2 candidates |
| 844x390 | playerOne-local-opening | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 244>204px; overflow-x visible; glyph range outside no; ? |
| 844x390 | playerOne-local-opening | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 244>204px; overflow-x visible; glyph range outside no; ? |
| 844x390 | playerOne-local-opening | Primary action in first screenful | #openClubPack | yes; 300×27.7px; top/bottom 354/381.7px; DRAW LOCKED...; disabled; center unobscured yes |
| 844x390 | playerOne-local-manager-one | Horizontal scrollbar | html / body | no; scroll/client 844/844px; overflow visible/hidden |
| 844x390 | playerOne-local-manager-one | Element wider than window | #clubWheelScreen | 0 content; 3 decoration |
| 844x390 | playerOne-local-manager-one | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > svg.rvBurst:nth-of-type(4) | 877.3px; left/right -10/867.3px |
| 844x390 | playerOne-local-manager-one | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > div.rvHalf.rvHalfLeft.plateDup:nth-of-type(2) | 894.8px; left/right -35/859.9px |
| 844x390 | playerOne-local-manager-one | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > div.rvHalf.rvHalfRight.plateDup:nth-of-type(3) | 894.8px; left/right -18.7/876.2px |
| 844x390 | playerOne-local-manager-one | Touch control <44px | #clubWheelScreen | 1 of 1 visible controls |
| 844x390 | playerOne-local-manager-one | Touch target <44px | #openClubPack | 300×27.7px; disabled |
| 844x390 | playerOne-local-manager-one | Text scrollWidth > clientWidth | #clubWheelScreen | 2 candidates |
| 844x390 | playerOne-local-manager-one | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 244>204px; overflow-x visible; glyph range outside no; Osasuna |
| 844x390 | playerOne-local-manager-one | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 244>204px; overflow-x visible; glyph range outside no; ? |
| 844x390 | playerOne-local-manager-one | Primary action in first screenful | #openClubPack | yes; 300×27.7px; top/bottom 354/381.7px; DRAW LOCKED...; disabled; center unobscured yes |
| 844x390 | playerOne-local-manager-two | Horizontal scrollbar | html / body | no; scroll/client 844/844px; overflow visible/hidden |
| 844x390 | playerOne-local-manager-two | Element wider than window | #clubWheelScreen | 0 content; 3 decoration |
| 844x390 | playerOne-local-manager-two | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > svg.rvBurst:nth-of-type(4) | 873.2px; left/right -20.3/852.9px |
| 844x390 | playerOne-local-manager-two | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > div.rvHalf.rvHalfLeft.plateDup:nth-of-type(2) | 903.6px; left/right -37.4/866.2px |
| 844x390 | playerOne-local-manager-two | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > div.rvHalf.rvHalfRight.plateDup:nth-of-type(3) | 903.6px; left/right -18.1/885.5px |
| 844x390 | playerOne-local-manager-two | Touch control <44px | #clubWheelScreen | 1 of 1 visible controls |
| 844x390 | playerOne-local-manager-two | Touch target <44px | #openClubPack | 300×27.7px; disabled |
| 844x390 | playerOne-local-manager-two | Text scrollWidth > clientWidth | #clubWheelScreen | 2 candidates |
| 844x390 | playerOne-local-manager-two | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 244>204px; overflow-x visible; glyph range outside no; Osasuna |
| 844x390 | playerOne-local-manager-two | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 244>204px; overflow-x visible; glyph range outside no; Espanyol |
| 844x390 | playerOne-local-manager-two | Primary action in first screenful | #openClubPack | yes; 300×27.7px; top/bottom 354/381.7px; DRAW LOCKED...; disabled; center unobscured yes |
| 844x390 | playerOne-local-versus | Horizontal scrollbar | html / body | no; scroll/client 844/844px; overflow visible/hidden |
| 844x390 | playerOne-local-versus | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 844x390 | playerOne-local-versus | Touch control <44px | #clubWheelScreen | 0 of 0 visible controls |
| 844x390 | playerOne-local-versus | Text scrollWidth > clientWidth | #clubWheelScreen | 3 candidates |
| 844x390 | playerOne-local-versus | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 244>204px; overflow-x visible; glyph range outside no; Osasuna |
| 844x390 | playerOne-local-versus | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 244>204px; overflow-x visible; glyph range outside no; Espanyol |
| 844x390 | playerOne-local-versus | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 111>105px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 844x390 | playerOne-local-versus | Primary action in first screenful | none | N/A no visible action |
| 844x390 | playerOne-local-confirmation | Horizontal scrollbar | html / body | no; scroll/client 844/844px; overflow visible/hidden |
| 844x390 | playerOne-local-confirmation | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 844x390 | playerOne-local-confirmation | Touch control <44px | #clubWheelScreen | 1 of 1 visible controls |
| 844x390 | playerOne-local-confirmation | Touch target <44px | #continueClubAssignment | 430×27.7px |
| 844x390 | playerOne-local-confirmation | Text scrollWidth > clientWidth | #clubWheelScreen | 3 candidates |
| 844x390 | playerOne-local-confirmation | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 244>204px; overflow-x visible; glyph range outside no; Osasuna |
| 844x390 | playerOne-local-confirmation | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 244>204px; overflow-x visible; glyph range outside no; Espanyol |
| 844x390 | playerOne-local-confirmation | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 111>105px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 844x390 | playerOne-local-confirmation | Primary action in first screenful | #continueClubAssignment | yes; 430×27.7px; top/bottom 353/380.7px; CONFIRM RIVALRY & START SHOWDOWN; center unobscured yes |
| 844x390 | playerTwo-sealed | Horizontal scrollbar | html / body | no; scroll/client 844/844px; overflow visible/hidden |
| 844x390 | playerTwo-sealed | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 844x390 | playerTwo-sealed | Touch control <44px | #clubWheelScreen | 1 of 1 visible controls |
| 844x390 | playerTwo-sealed | Touch target <44px | #openClubPack | 300×27.7px; disabled |
| 844x390 | playerTwo-sealed | Text scrollWidth > clientWidth | #clubWheelScreen | 0 candidates |
| 844x390 | playerTwo-sealed | Primary action in first screenful | #openClubPack | yes; 300×27.7px; top/bottom 354/381.7px; WAITING FOR HOST PACK REVEAL; disabled; center unobscured yes |
| 844x390 | playerTwo-opening | Horizontal scrollbar | html / body | no; scroll/client 844/844px; overflow visible/hidden |
| 844x390 | playerTwo-opening | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 844x390 | playerTwo-opening | Touch control <44px | #clubWheelScreen | 0 of 0 visible controls |
| 844x390 | playerTwo-opening | Text scrollWidth > clientWidth | #clubWheelScreen | 0 candidates |
| 844x390 | playerTwo-opening | Primary action in first screenful | none | N/A no visible action |
| 844x390 | playerTwo-manager-one | Horizontal scrollbar | html / body | no; scroll/client 844/844px; overflow visible/hidden |
| 844x390 | playerTwo-manager-one | Element wider than window | #clubWheelScreen | 0 content; 1 decoration |
| 844x390 | playerTwo-manager-one | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > div.rvFlap.plateDup:nth-of-type(5) | 845.7px; left/right -0.7/845px |
| 844x390 | playerTwo-manager-one | Touch control <44px | #clubWheelScreen | 0 of 0 visible controls |
| 844x390 | playerTwo-manager-one | Text scrollWidth > clientWidth | #clubWheelScreen | 1 candidates |
| 844x390 | playerTwo-manager-one | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span | 139>105px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 844x390 | playerTwo-manager-one | Primary action in first screenful | none | N/A no visible action |
| 844x390 | playerTwo-manager-two | Horizontal scrollbar | html / body | no; scroll/client 844/844px; overflow visible/hidden |
| 844x390 | playerTwo-manager-two | Element wider than window | #clubWheelScreen | 0 content; 1 decoration |
| 844x390 | playerTwo-manager-two | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > div.rvFlap.plateDup:nth-of-type(5) | 861.2px; left/right -10.6/850.5px |
| 844x390 | playerTwo-manager-two | Touch control <44px | #clubWheelScreen | 0 of 0 visible controls |
| 844x390 | playerTwo-manager-two | Text scrollWidth > clientWidth | #clubWheelScreen | 2 candidates |
| 844x390 | playerTwo-manager-two | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 244>204px; overflow-x visible; glyph range outside no; Osasuna |
| 844x390 | playerTwo-manager-two | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span | 139>105px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 844x390 | playerTwo-manager-two | Primary action in first screenful | none | N/A no visible action |
| 844x390 | playerTwo-clubs-locked-awaiting-season | Horizontal scrollbar | html / body | no; scroll/client 844/844px; overflow visible/hidden |
| 844x390 | playerTwo-clubs-locked-awaiting-season | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 844x390 | playerTwo-clubs-locked-awaiting-season | Touch control <44px | #clubWheelScreen | 0 of 0 visible controls |
| 844x390 | playerTwo-clubs-locked-awaiting-season | Text scrollWidth > clientWidth | #clubWheelScreen | 3 candidates |
| 844x390 | playerTwo-clubs-locked-awaiting-season | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 244>204px; overflow-x visible; glyph range outside no; Osasuna |
| 844x390 | playerTwo-clubs-locked-awaiting-season | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 244>204px; overflow-x visible; glyph range outside no; Espanyol |
| 844x390 | playerTwo-clubs-locked-awaiting-season | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 113>105px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 844x390 | playerTwo-clubs-locked-awaiting-season | Primary action in first screenful | none | N/A no visible action |
| 844x390 | playerTwo-confirm | Horizontal scrollbar | html / body | no; scroll/client 844/844px; overflow visible/hidden |
| 844x390 | playerTwo-confirm | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 844x390 | playerTwo-confirm | Touch control <44px | #clubWheelScreen | 1 of 1 visible controls |
| 844x390 | playerTwo-confirm | Touch target <44px | #continueClubAssignment | 430×27.7px |
| 844x390 | playerTwo-confirm | Text scrollWidth > clientWidth | #clubWheelScreen | 3 candidates |
| 844x390 | playerTwo-confirm | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 244>204px; overflow-x visible; glyph range outside no; Osasuna |
| 844x390 | playerTwo-confirm | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 244>204px; overflow-x visible; glyph range outside no; Espanyol |
| 844x390 | playerTwo-confirm | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 111>105px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 844x390 | playerTwo-confirm | Primary action in first screenful | #continueClubAssignment | yes; 430×27.7px; top/bottom 354/381.7px; CONFIRM SHARED SHOWDOWN; center unobscured yes |
| 844x390 | playerTwo-confirm-write-failure | Horizontal scrollbar | html / body | no; scroll/client 844/844px; overflow visible/hidden |
| 844x390 | playerTwo-confirm-write-failure | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 844x390 | playerTwo-confirm-write-failure | Touch control <44px | #clubWheelScreen | 1 of 1 visible controls |
| 844x390 | playerTwo-confirm-write-failure | Touch target <44px | #continueClubAssignment | 430×27.7px |
| 844x390 | playerTwo-confirm-write-failure | Text scrollWidth > clientWidth | #clubWheelScreen | 3 candidates |
| 844x390 | playerTwo-confirm-write-failure | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 244>204px; overflow-x visible; glyph range outside no; Osasuna |
| 844x390 | playerTwo-confirm-write-failure | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 244>204px; overflow-x visible; glyph range outside no; Espanyol |
| 844x390 | playerTwo-confirm-write-failure | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 111>105px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 844x390 | playerTwo-confirm-write-failure | Primary action in first screenful | #continueClubAssignment | yes; 430×27.7px; top/bottom 353/380.7px; CONFIRM SHARED SHOWDOWN; center unobscured yes |
| 844x390 | playerTwo-waiting-rival | Horizontal scrollbar | html / body | no; scroll/client 844/844px; overflow visible/hidden |
| 844x390 | playerTwo-waiting-rival | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 844x390 | playerTwo-waiting-rival | Touch control <44px | #clubWheelScreen | 1 of 1 visible controls |
| 844x390 | playerTwo-waiting-rival | Touch target <44px | #continueClubAssignment | 430×27.7px; disabled |
| 844x390 | playerTwo-waiting-rival | Text scrollWidth > clientWidth | #clubWheelScreen | 3 candidates |
| 844x390 | playerTwo-waiting-rival | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 244>204px; overflow-x visible; glyph range outside no; Osasuna |
| 844x390 | playerTwo-waiting-rival | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 244>204px; overflow-x visible; glyph range outside no; Espanyol |
| 844x390 | playerTwo-waiting-rival | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 111>105px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 844x390 | playerTwo-waiting-rival | Primary action in first screenful | #continueClubAssignment | yes; 430×27.7px; top/bottom 354/381.7px; CONFIRMED · WAITING FOR RIVAL; disabled; center unobscured yes |
| 844x390 | playerTwo-reconnect | Horizontal scrollbar | html / body | no; scroll/client 844/844px; overflow visible/hidden |
| 844x390 | playerTwo-reconnect | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 844x390 | playerTwo-reconnect | Touch control <44px | #clubWheelScreen | 1 of 1 visible controls |
| 844x390 | playerTwo-reconnect | Touch target <44px | #continueClubAssignment | 430×27.7px; disabled |
| 844x390 | playerTwo-reconnect | Text scrollWidth > clientWidth | #clubWheelScreen | 3 candidates |
| 844x390 | playerTwo-reconnect | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 244>204px; overflow-x visible; glyph range outside no; Osasuna |
| 844x390 | playerTwo-reconnect | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 244>204px; overflow-x visible; glyph range outside no; Espanyol |
| 844x390 | playerTwo-reconnect | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 111>105px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 844x390 | playerTwo-reconnect | Primary action in first screenful | #continueClubAssignment | yes; 430×27.7px; top/bottom 354/381.7px; RECONNECT PLAYERS TO CONTINUE; disabled; center unobscured yes |
| 844x390 | playerTwo-career-start-ready | Horizontal scrollbar | html / body | no; scroll/client 844/844px; overflow visible/hidden |
| 844x390 | playerTwo-career-start-ready | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 844x390 | playerTwo-career-start-ready | Touch control <44px | #clubWheelScreen | 1 of 1 visible controls |
| 844x390 | playerTwo-career-start-ready | Touch target <44px | #continueClubAssignment | 430×27.7px |
| 844x390 | playerTwo-career-start-ready | Text scrollWidth > clientWidth | #clubWheelScreen | 3 candidates |
| 844x390 | playerTwo-career-start-ready | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 244>204px; overflow-x visible; glyph range outside no; Osasuna |
| 844x390 | playerTwo-career-start-ready | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 244>204px; overflow-x visible; glyph range outside no; Espanyol |
| 844x390 | playerTwo-career-start-ready | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 111>105px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 844x390 | playerTwo-career-start-ready | Primary action in first screenful | #continueClubAssignment | yes; 430×27.7px; top/bottom 353/380.7px; CONTINUE TO CAREER START; center unobscured yes |
| 844x390 | playerTwo-season-mismatch | Horizontal scrollbar | html / body | no; scroll/client 844/844px; overflow visible/hidden |
| 844x390 | playerTwo-season-mismatch | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 844x390 | playerTwo-season-mismatch | Touch control <44px | #clubWheelScreen | 1 of 1 visible controls |
| 844x390 | playerTwo-season-mismatch | Touch target <44px | #continueClubAssignment | 430×27.7px; disabled |
| 844x390 | playerTwo-season-mismatch | Text scrollWidth > clientWidth | #clubWheelScreen | 3 candidates |
| 844x390 | playerTwo-season-mismatch | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 244>204px; overflow-x visible; glyph range outside no; Osasuna |
| 844x390 | playerTwo-season-mismatch | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 244>204px; overflow-x visible; glyph range outside no; Espanyol |
| 844x390 | playerTwo-season-mismatch | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 111>105px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 844x390 | playerTwo-season-mismatch | Primary action in first screenful | #continueClubAssignment | yes; 430×27.7px; top/bottom 354/381.7px; SEASON PLAN MISMATCH · RECOVERY REQUIRED; disabled; center unobscured yes |
| 844x390 | playerTwo-long-club-names | Horizontal scrollbar | html / body | no; scroll/client 844/844px; overflow visible/hidden |
| 844x390 | playerTwo-long-club-names | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 844x390 | playerTwo-long-club-names | Touch control <44px | #clubWheelScreen | 1 of 1 visible controls |
| 844x390 | playerTwo-long-club-names | Touch target <44px | #continueClubAssignment | 430×27.7px |
| 844x390 | playerTwo-long-club-names | Text scrollWidth > clientWidth | #clubWheelScreen | 3 candidates |
| 844x390 | playerTwo-long-club-names | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 244>204px; overflow-x visible; glyph range outside no; Deportivo La Coruña |
| 844x390 | playerTwo-long-club-names | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 244>204px; overflow-x visible; glyph range outside yes; Borussia Mönchengladbach |
| 844x390 | playerTwo-long-club-names | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 111>105px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 844x390 | playerTwo-long-club-names | Primary action in first screenful | #continueClubAssignment | yes; 430×27.7px; top/bottom 353/380.7px; CONFIRM SHARED SHOWDOWN; center unobscured yes |
| 844x390 | playerOne-confirmation-overlap-detail | Horizontal scrollbar | html / body | no; scroll/client 844/844px; overflow visible/hidden |
| 844x390 | playerOne-confirmation-overlap-detail | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 844x390 | playerOne-confirmation-overlap-detail | Touch control <44px | #clubWheelScreen | 1 of 1 visible controls |
| 844x390 | playerOne-confirmation-overlap-detail | Touch target <44px | #continueClubAssignment | 430×27.7px |
| 844x390 | playerOne-confirmation-overlap-detail | Text scrollWidth > clientWidth | #clubWheelScreen | 3 candidates |
| 844x390 | playerOne-confirmation-overlap-detail | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 244>204px; overflow-x visible; glyph range outside no; Osasuna |
| 844x390 | playerOne-confirmation-overlap-detail | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 244>204px; overflow-x visible; glyph range outside no; Espanyol |
| 844x390 | playerOne-confirmation-overlap-detail | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 113>105px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 844x390 | playerOne-confirmation-overlap-detail | Overlap | #clubNameOne / #continueClubAssignment | 140×14.7px intersection |
| 844x390 | playerOne-confirmation-overlap-detail | Overlap | #clubNameTwo / #continueClubAssignment | 56.6×14.7px intersection |
| 844x390 | playerOne-confirmation-overlap-detail | Primary action in first screenful | #continueClubAssignment | yes; 430×27.7px; top/bottom 354/381.7px; CONFIRM SHARED SHOWDOWN; center unobscured yes |
| 844x390 | playerTwo-confirmation-overlap-detail | Horizontal scrollbar | html / body | no; scroll/client 844/844px; overflow visible/hidden |
| 844x390 | playerTwo-confirmation-overlap-detail | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 844x390 | playerTwo-confirmation-overlap-detail | Touch control <44px | #clubWheelScreen | 1 of 1 visible controls |
| 844x390 | playerTwo-confirmation-overlap-detail | Touch target <44px | #continueClubAssignment | 430×27.7px |
| 844x390 | playerTwo-confirmation-overlap-detail | Text scrollWidth > clientWidth | #clubWheelScreen | 3 candidates |
| 844x390 | playerTwo-confirmation-overlap-detail | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 244>204px; overflow-x visible; glyph range outside no; Osasuna |
| 844x390 | playerTwo-confirmation-overlap-detail | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 244>204px; overflow-x visible; glyph range outside no; Espanyol |
| 844x390 | playerTwo-confirmation-overlap-detail | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 113>105px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 844x390 | playerTwo-confirmation-overlap-detail | Overlap | #clubNameOne / #continueClubAssignment | 140×14.7px intersection |
| 844x390 | playerTwo-confirmation-overlap-detail | Overlap | #clubNameTwo / #continueClubAssignment | 56.6×14.7px intersection |
| 844x390 | playerTwo-confirmation-overlap-detail | Primary action in first screenful | #continueClubAssignment | yes; 430×27.7px; top/bottom 354/381.7px; CONFIRM SHARED SHOWDOWN; center unobscured yes |
| 932x430 | playerOne-sealed | Horizontal scrollbar | html / body | no; scroll/client 932/932px; overflow visible/hidden |
| 932x430 | playerOne-sealed | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 932x430 | playerOne-sealed | Touch control <44px | #clubWheelScreen | 2 of 2 visible controls |
| 932x430 | playerOne-sealed | Touch target <44px | #openClubPack | 300×30.6px |
| 932x430 | playerOne-sealed | Touch target <44px | #onlinePlayerIdentityBadge | 61.1×28px |
| 932x430 | playerOne-sealed | Text scrollWidth > clientWidth | #clubWheelScreen | 0 candidates |
| 932x430 | playerOne-sealed | Primary action in first screenful | #openClubPack | yes; 300×30.6px; top/bottom 391/421.6px; OPEN SHOWDOWN PACKS; center unobscured yes |
| 932x430 | playerOne-provider-working | Horizontal scrollbar | html / body | no; scroll/client 932/932px; overflow visible/hidden |
| 932x430 | playerOne-provider-working | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 932x430 | playerOne-provider-working | Touch control <44px | #clubWheelScreen | 2 of 2 visible controls |
| 932x430 | playerOne-provider-working | Touch target <44px | #openClubPack | 300×30.6px; disabled |
| 932x430 | playerOne-provider-working | Touch target <44px | #onlinePlayerIdentityBadge | 61.1×28px |
| 932x430 | playerOne-provider-working | Text scrollWidth > clientWidth | #clubWheelScreen | 0 candidates |
| 932x430 | playerOne-provider-working | Primary action in first screenful | #openClubPack | yes; 300×30.6px; top/bottom 391/421.6px; WORKING…; disabled; center unobscured yes |
| 932x430 | playerOne-pack-write-failure | Horizontal scrollbar | html / body | no; scroll/client 932/932px; overflow visible/hidden |
| 932x430 | playerOne-pack-write-failure | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 932x430 | playerOne-pack-write-failure | Touch control <44px | #clubWheelScreen | 2 of 2 visible controls |
| 932x430 | playerOne-pack-write-failure | Touch target <44px | #openClubPack | 300×30.6px |
| 932x430 | playerOne-pack-write-failure | Touch target <44px | #onlinePlayerIdentityBadge | 61.1×28px |
| 932x430 | playerOne-pack-write-failure | Text scrollWidth > clientWidth | #clubWheelScreen | 0 candidates |
| 932x430 | playerOne-pack-write-failure | Primary action in first screenful | #openClubPack | yes; 300×30.6px; top/bottom 390/420.6px; OPEN SHOWDOWN PACKS; center unobscured yes |
| 932x430 | playerOne-opening | Horizontal scrollbar | html / body | no; scroll/client 932/932px; overflow visible/hidden |
| 932x430 | playerOne-opening | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 932x430 | playerOne-opening | Touch control <44px | #clubWheelScreen | 1 of 1 visible controls |
| 932x430 | playerOne-opening | Touch target <44px | #onlinePlayerIdentityBadge | 61.1×28px |
| 932x430 | playerOne-opening | Text scrollWidth > clientWidth | #clubWheelScreen | 1 candidates |
| 932x430 | playerOne-opening | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span | 139>105px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 932x430 | playerOne-opening | Primary action in first screenful | none | N/A no visible action |
| 932x430 | playerOne-manager-one | Horizontal scrollbar | html / body | no; scroll/client 932/932px; overflow visible/hidden |
| 932x430 | playerOne-manager-one | Element wider than window | #clubWheelScreen | 0 content; 1 decoration |
| 932x430 | playerOne-manager-one | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > div.rvFlap.plateDup:nth-of-type(5) | 941.6px; left/right -3.8/937.8px |
| 932x430 | playerOne-manager-one | Touch control <44px | #clubWheelScreen | 1 of 1 visible controls |
| 932x430 | playerOne-manager-one | Touch target <44px | #onlinePlayerIdentityBadge | 61.1×28px |
| 932x430 | playerOne-manager-one | Text scrollWidth > clientWidth | #clubWheelScreen | 1 candidates |
| 932x430 | playerOne-manager-one | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span | 139>105px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 932x430 | playerOne-manager-one | Primary action in first screenful | none | N/A no visible action |
| 932x430 | playerOne-manager-two | Horizontal scrollbar | html / body | no; scroll/client 932/932px; overflow visible/hidden |
| 932x430 | playerOne-manager-two | Element wider than window | #clubWheelScreen | 0 content; 1 decoration |
| 932x430 | playerOne-manager-two | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > div.rvFlap.plateDup:nth-of-type(5) | 951px; left/right -11.8/939.2px |
| 932x430 | playerOne-manager-two | Touch control <44px | #clubWheelScreen | 1 of 1 visible controls |
| 932x430 | playerOne-manager-two | Touch target <44px | #onlinePlayerIdentityBadge | 61.1×28px |
| 932x430 | playerOne-manager-two | Text scrollWidth > clientWidth | #clubWheelScreen | 2 candidates |
| 932x430 | playerOne-manager-two | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 245>205px; overflow-x visible; glyph range outside no; Osasuna |
| 932x430 | playerOne-manager-two | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span | 139>105px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 932x430 | playerOne-manager-two | Primary action in first screenful | none | N/A no visible action |
| 932x430 | playerOne-confirm | Horizontal scrollbar | html / body | no; scroll/client 932/932px; overflow visible/hidden |
| 932x430 | playerOne-confirm | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 932x430 | playerOne-confirm | Touch control <44px | #clubWheelScreen | 2 of 2 visible controls |
| 932x430 | playerOne-confirm | Touch target <44px | #continueClubAssignment | 430×30.6px |
| 932x430 | playerOne-confirm | Touch target <44px | #onlinePlayerIdentityBadge | 61.1×28px |
| 932x430 | playerOne-confirm | Text scrollWidth > clientWidth | #clubWheelScreen | 3 candidates |
| 932x430 | playerOne-confirm | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 245>205px; overflow-x visible; glyph range outside no; Osasuna |
| 932x430 | playerOne-confirm | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 245>205px; overflow-x visible; glyph range outside no; Espanyol |
| 932x430 | playerOne-confirm | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 112>105px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 932x430 | playerOne-confirm | Primary action in first screenful | #continueClubAssignment | yes; 430×30.6px; top/bottom 390/420.6px; CONFIRM SHARED SHOWDOWN; center unobscured yes |
| 932x430 | playerOne-confirm-write-failure | Horizontal scrollbar | html / body | no; scroll/client 932/932px; overflow visible/hidden |
| 932x430 | playerOne-confirm-write-failure | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 932x430 | playerOne-confirm-write-failure | Touch control <44px | #clubWheelScreen | 2 of 2 visible controls |
| 932x430 | playerOne-confirm-write-failure | Touch target <44px | #continueClubAssignment | 430×30.6px |
| 932x430 | playerOne-confirm-write-failure | Touch target <44px | #onlinePlayerIdentityBadge | 61.1×28px |
| 932x430 | playerOne-confirm-write-failure | Text scrollWidth > clientWidth | #clubWheelScreen | 3 candidates |
| 932x430 | playerOne-confirm-write-failure | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 245>205px; overflow-x visible; glyph range outside no; Osasuna |
| 932x430 | playerOne-confirm-write-failure | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 245>205px; overflow-x visible; glyph range outside no; Espanyol |
| 932x430 | playerOne-confirm-write-failure | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 111>105px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 932x430 | playerOne-confirm-write-failure | Primary action in first screenful | #continueClubAssignment | yes; 430×30.6px; top/bottom 390/420.6px; CONFIRM SHARED SHOWDOWN; center unobscured yes |
| 932x430 | playerOne-waiting-rival | Horizontal scrollbar | html / body | no; scroll/client 932/932px; overflow visible/hidden |
| 932x430 | playerOne-waiting-rival | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 932x430 | playerOne-waiting-rival | Touch control <44px | #clubWheelScreen | 2 of 2 visible controls |
| 932x430 | playerOne-waiting-rival | Touch target <44px | #continueClubAssignment | 430×30.6px; disabled |
| 932x430 | playerOne-waiting-rival | Touch target <44px | #onlinePlayerIdentityBadge | 61.1×28px |
| 932x430 | playerOne-waiting-rival | Text scrollWidth > clientWidth | #clubWheelScreen | 3 candidates |
| 932x430 | playerOne-waiting-rival | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 245>205px; overflow-x visible; glyph range outside no; Osasuna |
| 932x430 | playerOne-waiting-rival | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 245>205px; overflow-x visible; glyph range outside no; Espanyol |
| 932x430 | playerOne-waiting-rival | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 111>105px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 932x430 | playerOne-waiting-rival | Primary action in first screenful | #continueClubAssignment | yes; 430×30.6px; top/bottom 391/421.6px; CONFIRMED · WAITING FOR RIVAL; disabled; center unobscured yes |
| 932x430 | playerOne-reconnect | Horizontal scrollbar | html / body | no; scroll/client 932/932px; overflow visible/hidden |
| 932x430 | playerOne-reconnect | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 932x430 | playerOne-reconnect | Touch control <44px | #clubWheelScreen | 2 of 2 visible controls |
| 932x430 | playerOne-reconnect | Touch target <44px | #continueClubAssignment | 430×30.6px; disabled |
| 932x430 | playerOne-reconnect | Touch target <44px | #onlinePlayerIdentityBadge | 61.1×28px |
| 932x430 | playerOne-reconnect | Text scrollWidth > clientWidth | #clubWheelScreen | 3 candidates |
| 932x430 | playerOne-reconnect | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 245>205px; overflow-x visible; glyph range outside no; Osasuna |
| 932x430 | playerOne-reconnect | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 245>205px; overflow-x visible; glyph range outside no; Espanyol |
| 932x430 | playerOne-reconnect | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 111>105px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 932x430 | playerOne-reconnect | Primary action in first screenful | #continueClubAssignment | yes; 430×30.6px; top/bottom 391/421.6px; RECONNECT PLAYERS TO CONTINUE; disabled; center unobscured yes |
| 932x430 | playerOne-career-start-ready | Horizontal scrollbar | html / body | no; scroll/client 932/932px; overflow visible/hidden |
| 932x430 | playerOne-career-start-ready | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 932x430 | playerOne-career-start-ready | Touch control <44px | #clubWheelScreen | 2 of 2 visible controls |
| 932x430 | playerOne-career-start-ready | Touch target <44px | #continueClubAssignment | 430×30.6px |
| 932x430 | playerOne-career-start-ready | Touch target <44px | #onlinePlayerIdentityBadge | 61.1×28px |
| 932x430 | playerOne-career-start-ready | Text scrollWidth > clientWidth | #clubWheelScreen | 3 candidates |
| 932x430 | playerOne-career-start-ready | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 245>205px; overflow-x visible; glyph range outside no; Osasuna |
| 932x430 | playerOne-career-start-ready | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 245>205px; overflow-x visible; glyph range outside no; Espanyol |
| 932x430 | playerOne-career-start-ready | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 111>105px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 932x430 | playerOne-career-start-ready | Primary action in first screenful | #continueClubAssignment | yes; 430×30.6px; top/bottom 390/420.6px; CONTINUE TO CAREER START; center unobscured yes |
| 932x430 | playerOne-season-mismatch | Horizontal scrollbar | html / body | no; scroll/client 932/932px; overflow visible/hidden |
| 932x430 | playerOne-season-mismatch | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 932x430 | playerOne-season-mismatch | Touch control <44px | #clubWheelScreen | 2 of 2 visible controls |
| 932x430 | playerOne-season-mismatch | Touch target <44px | #continueClubAssignment | 430×30.6px; disabled |
| 932x430 | playerOne-season-mismatch | Touch target <44px | #onlinePlayerIdentityBadge | 61.1×28px |
| 932x430 | playerOne-season-mismatch | Text scrollWidth > clientWidth | #clubWheelScreen | 3 candidates |
| 932x430 | playerOne-season-mismatch | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 245>205px; overflow-x visible; glyph range outside no; Osasuna |
| 932x430 | playerOne-season-mismatch | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 245>205px; overflow-x visible; glyph range outside no; Espanyol |
| 932x430 | playerOne-season-mismatch | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 111>105px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 932x430 | playerOne-season-mismatch | Primary action in first screenful | #continueClubAssignment | yes; 430×30.6px; top/bottom 391/421.6px; SEASON PLAN MISMATCH · RECOVERY REQUIRED; disabled; center unobscured yes |
| 932x430 | playerOne-long-club-names | Horizontal scrollbar | html / body | no; scroll/client 932/932px; overflow visible/hidden |
| 932x430 | playerOne-long-club-names | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 932x430 | playerOne-long-club-names | Touch control <44px | #clubWheelScreen | 2 of 2 visible controls |
| 932x430 | playerOne-long-club-names | Touch target <44px | #continueClubAssignment | 430×30.6px |
| 932x430 | playerOne-long-club-names | Touch target <44px | #onlinePlayerIdentityBadge | 61.1×28px |
| 932x430 | playerOne-long-club-names | Text scrollWidth > clientWidth | #clubWheelScreen | 3 candidates |
| 932x430 | playerOne-long-club-names | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 245>205px; overflow-x visible; glyph range outside no; Deportivo La Coruña |
| 932x430 | playerOne-long-club-names | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 245>205px; overflow-x visible; glyph range outside yes; Borussia Mönchengladbach |
| 932x430 | playerOne-long-club-names | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 111>105px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 932x430 | playerOne-long-club-names | Primary action in first screenful | #continueClubAssignment | yes; 430×30.6px; top/bottom 390/420.6px; CONFIRM SHARED SHOWDOWN; center unobscured yes |
| 932x430 | playerOne-local-ready | Horizontal scrollbar | html / body | no; scroll/client 932/932px; overflow visible/hidden |
| 932x430 | playerOne-local-ready | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 932x430 | playerOne-local-ready | Touch control <44px | #clubWheelScreen | 3 of 3 visible controls |
| 932x430 | playerOne-local-ready | Touch target <44px | #openClubPack | 300×30.6px; disabled |
| 932x430 | playerOne-local-ready | Touch target <44px | #clubAssignmentBack | 120×30.6px |
| 932x430 | playerOne-local-ready | Touch target <44px | #onlinePlayerIdentityBadge | 61.1×28px |
| 932x430 | playerOne-local-ready | Text scrollWidth > clientWidth | #clubWheelScreen | 2 candidates |
| 932x430 | playerOne-local-ready | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 245>205px; overflow-x visible; glyph range outside no; ? |
| 932x430 | playerOne-local-ready | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 245>205px; overflow-x visible; glyph range outside no; ? |
| 932x430 | playerOne-local-ready | Primary action in first screenful | #openClubPack | yes; 300×30.6px; top/bottom 391/421.6px; OPEN SHOWDOWN PACKS; disabled; center unobscured yes |
| 932x430 | playerOne-local-opening | Horizontal scrollbar | html / body | no; scroll/client 932/932px; overflow visible/hidden |
| 932x430 | playerOne-local-opening | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 932x430 | playerOne-local-opening | Touch control <44px | #clubWheelScreen | 2 of 2 visible controls |
| 932x430 | playerOne-local-opening | Touch target <44px | #openClubPack | 300×30.6px; disabled |
| 932x430 | playerOne-local-opening | Touch target <44px | #onlinePlayerIdentityBadge | 61.1×28px |
| 932x430 | playerOne-local-opening | Text scrollWidth > clientWidth | #clubWheelScreen | 2 candidates |
| 932x430 | playerOne-local-opening | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 245>205px; overflow-x visible; glyph range outside no; ? |
| 932x430 | playerOne-local-opening | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 245>205px; overflow-x visible; glyph range outside no; ? |
| 932x430 | playerOne-local-opening | Primary action in first screenful | #openClubPack | yes; 300×30.6px; top/bottom 391/421.6px; DRAW LOCKED...; disabled; center unobscured yes |
| 932x430 | playerOne-local-manager-one | Horizontal scrollbar | html / body | no; scroll/client 932/932px; overflow visible/hidden |
| 932x430 | playerOne-local-manager-one | Element wider than window | #clubWheelScreen | 0 content; 2 decoration |
| 932x430 | playerOne-local-manager-one | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > div.rvHalf.rvHalfLeft.plateDup:nth-of-type(2) | 977.9px; left/right -31.1/946.8px |
| 932x430 | playerOne-local-manager-one | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > div.rvHalf.rvHalfRight.plateDup:nth-of-type(3) | 977.9px; left/right -16.8/961.2px |
| 932x430 | playerOne-local-manager-one | Touch control <44px | #clubWheelScreen | 2 of 2 visible controls |
| 932x430 | playerOne-local-manager-one | Touch target <44px | #openClubPack | 300×30.6px; disabled |
| 932x430 | playerOne-local-manager-one | Touch target <44px | #onlinePlayerIdentityBadge | 61.1×28px |
| 932x430 | playerOne-local-manager-one | Text scrollWidth > clientWidth | #clubWheelScreen | 2 candidates |
| 932x430 | playerOne-local-manager-one | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 245>205px; overflow-x visible; glyph range outside no; Osasuna |
| 932x430 | playerOne-local-manager-one | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 245>205px; overflow-x visible; glyph range outside no; ? |
| 932x430 | playerOne-local-manager-one | Primary action in first screenful | #openClubPack | yes; 300×30.6px; top/bottom 391/421.6px; DRAW LOCKED...; disabled; center unobscured yes |
| 932x430 | playerOne-local-manager-two | Horizontal scrollbar | html / body | no; scroll/client 932/932px; overflow visible/hidden |
| 932x430 | playerOne-local-manager-two | Element wider than window | #clubWheelScreen | 0 content; 3 decoration |
| 932x430 | playerOne-local-manager-two | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > svg.rvBurst:nth-of-type(4) | 961.9px; left/right -20.8/941.1px |
| 932x430 | playerOne-local-manager-two | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > div.rvHalf.rvHalfLeft.plateDup:nth-of-type(2) | 1002.4px; left/right -44/958.3px |
| 932x430 | playerOne-local-manager-two | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > div.rvHalf.rvHalfRight.plateDup:nth-of-type(3) | 1002.4px; left/right -21/981.4px |
| 932x430 | playerOne-local-manager-two | Touch control <44px | #clubWheelScreen | 2 of 2 visible controls |
| 932x430 | playerOne-local-manager-two | Touch target <44px | #openClubPack | 300×30.6px; disabled |
| 932x430 | playerOne-local-manager-two | Touch target <44px | #onlinePlayerIdentityBadge | 61.1×28px |
| 932x430 | playerOne-local-manager-two | Text scrollWidth > clientWidth | #clubWheelScreen | 2 candidates |
| 932x430 | playerOne-local-manager-two | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 245>205px; overflow-x visible; glyph range outside no; Osasuna |
| 932x430 | playerOne-local-manager-two | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 245>205px; overflow-x visible; glyph range outside no; Espanyol |
| 932x430 | playerOne-local-manager-two | Primary action in first screenful | #openClubPack | yes; 300×30.6px; top/bottom 391/421.6px; DRAW LOCKED...; disabled; center unobscured yes |
| 932x430 | playerOne-local-versus | Horizontal scrollbar | html / body | no; scroll/client 932/932px; overflow visible/hidden |
| 932x430 | playerOne-local-versus | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 932x430 | playerOne-local-versus | Touch control <44px | #clubWheelScreen | 1 of 1 visible controls |
| 932x430 | playerOne-local-versus | Touch target <44px | #onlinePlayerIdentityBadge | 61.1×28px |
| 932x430 | playerOne-local-versus | Text scrollWidth > clientWidth | #clubWheelScreen | 3 candidates |
| 932x430 | playerOne-local-versus | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 245>205px; overflow-x visible; glyph range outside no; Osasuna |
| 932x430 | playerOne-local-versus | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 245>205px; overflow-x visible; glyph range outside no; Espanyol |
| 932x430 | playerOne-local-versus | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 112>105px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 932x430 | playerOne-local-versus | Primary action in first screenful | none | N/A no visible action |
| 932x430 | playerOne-local-confirmation | Horizontal scrollbar | html / body | no; scroll/client 932/932px; overflow visible/hidden |
| 932x430 | playerOne-local-confirmation | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 932x430 | playerOne-local-confirmation | Touch control <44px | #clubWheelScreen | 2 of 2 visible controls |
| 932x430 | playerOne-local-confirmation | Touch target <44px | #continueClubAssignment | 430×30.6px |
| 932x430 | playerOne-local-confirmation | Touch target <44px | #onlinePlayerIdentityBadge | 61.1×28px |
| 932x430 | playerOne-local-confirmation | Text scrollWidth > clientWidth | #clubWheelScreen | 3 candidates |
| 932x430 | playerOne-local-confirmation | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 245>205px; overflow-x visible; glyph range outside no; Osasuna |
| 932x430 | playerOne-local-confirmation | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 245>205px; overflow-x visible; glyph range outside no; Espanyol |
| 932x430 | playerOne-local-confirmation | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 111>105px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 932x430 | playerOne-local-confirmation | Primary action in first screenful | #continueClubAssignment | yes; 430×30.6px; top/bottom 390/420.6px; CONFIRM RIVALRY & START SHOWDOWN; center unobscured yes |
| 932x430 | playerTwo-sealed | Horizontal scrollbar | html / body | no; scroll/client 932/932px; overflow visible/hidden |
| 932x430 | playerTwo-sealed | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 932x430 | playerTwo-sealed | Touch control <44px | #clubWheelScreen | 2 of 2 visible controls |
| 932x430 | playerTwo-sealed | Touch target <44px | #openClubPack | 300×30.6px; disabled |
| 932x430 | playerTwo-sealed | Touch target <44px | #onlinePlayerIdentityBadge | 61.1×28px |
| 932x430 | playerTwo-sealed | Text scrollWidth > clientWidth | #clubWheelScreen | 0 candidates |
| 932x430 | playerTwo-sealed | Primary action in first screenful | #openClubPack | yes; 300×30.6px; top/bottom 391/421.6px; WAITING FOR HOST PACK REVEAL; disabled; center unobscured yes |
| 932x430 | playerTwo-opening | Horizontal scrollbar | html / body | no; scroll/client 932/932px; overflow visible/hidden |
| 932x430 | playerTwo-opening | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 932x430 | playerTwo-opening | Touch control <44px | #clubWheelScreen | 1 of 1 visible controls |
| 932x430 | playerTwo-opening | Touch target <44px | #onlinePlayerIdentityBadge | 61.1×28px |
| 932x430 | playerTwo-opening | Text scrollWidth > clientWidth | #clubWheelScreen | 1 candidates |
| 932x430 | playerTwo-opening | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span | 139>105px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 932x430 | playerTwo-opening | Primary action in first screenful | none | N/A no visible action |
| 932x430 | playerTwo-manager-one | Horizontal scrollbar | html / body | no; scroll/client 932/932px; overflow visible/hidden |
| 932x430 | playerTwo-manager-one | Element wider than window | #clubWheelScreen | 0 content; 1 decoration |
| 932x430 | playerTwo-manager-one | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > div.rvFlap.plateDup:nth-of-type(5) | 933.9px; left/right -0.8/933.1px |
| 932x430 | playerTwo-manager-one | Touch control <44px | #clubWheelScreen | 1 of 1 visible controls |
| 932x430 | playerTwo-manager-one | Touch target <44px | #onlinePlayerIdentityBadge | 61.1×28px |
| 932x430 | playerTwo-manager-one | Text scrollWidth > clientWidth | #clubWheelScreen | 1 candidates |
| 932x430 | playerTwo-manager-one | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span | 139>105px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 932x430 | playerTwo-manager-one | Primary action in first screenful | none | N/A no visible action |
| 932x430 | playerTwo-manager-two | Horizontal scrollbar | html / body | no; scroll/client 932/932px; overflow visible/hidden |
| 932x430 | playerTwo-manager-two | Element wider than window | #clubWheelScreen | 0 content; 1 decoration |
| 932x430 | playerTwo-manager-two | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > div.rvFlap.plateDup:nth-of-type(5) | 951px; left/right -11.8/939.2px |
| 932x430 | playerTwo-manager-two | Touch control <44px | #clubWheelScreen | 1 of 1 visible controls |
| 932x430 | playerTwo-manager-two | Touch target <44px | #onlinePlayerIdentityBadge | 61.1×28px |
| 932x430 | playerTwo-manager-two | Text scrollWidth > clientWidth | #clubWheelScreen | 2 candidates |
| 932x430 | playerTwo-manager-two | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 245>205px; overflow-x visible; glyph range outside no; Osasuna |
| 932x430 | playerTwo-manager-two | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span | 139>105px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 932x430 | playerTwo-manager-two | Primary action in first screenful | none | N/A no visible action |
| 932x430 | playerTwo-clubs-locked-awaiting-season | Horizontal scrollbar | html / body | no; scroll/client 932/932px; overflow visible/hidden |
| 932x430 | playerTwo-clubs-locked-awaiting-season | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 932x430 | playerTwo-clubs-locked-awaiting-season | Touch control <44px | #clubWheelScreen | 1 of 1 visible controls |
| 932x430 | playerTwo-clubs-locked-awaiting-season | Touch target <44px | #onlinePlayerIdentityBadge | 61.1×28px |
| 932x430 | playerTwo-clubs-locked-awaiting-season | Text scrollWidth > clientWidth | #clubWheelScreen | 3 candidates |
| 932x430 | playerTwo-clubs-locked-awaiting-season | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 245>205px; overflow-x visible; glyph range outside no; Osasuna |
| 932x430 | playerTwo-clubs-locked-awaiting-season | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 245>205px; overflow-x visible; glyph range outside no; Espanyol |
| 932x430 | playerTwo-clubs-locked-awaiting-season | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 113>105px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 932x430 | playerTwo-clubs-locked-awaiting-season | Primary action in first screenful | none | N/A no visible action |
| 932x430 | playerTwo-confirm | Horizontal scrollbar | html / body | no; scroll/client 932/932px; overflow visible/hidden |
| 932x430 | playerTwo-confirm | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 932x430 | playerTwo-confirm | Touch control <44px | #clubWheelScreen | 2 of 2 visible controls |
| 932x430 | playerTwo-confirm | Touch target <44px | #continueClubAssignment | 430×30.6px |
| 932x430 | playerTwo-confirm | Touch target <44px | #onlinePlayerIdentityBadge | 61.1×28px |
| 932x430 | playerTwo-confirm | Text scrollWidth > clientWidth | #clubWheelScreen | 3 candidates |
| 932x430 | playerTwo-confirm | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 245>205px; overflow-x visible; glyph range outside no; Osasuna |
| 932x430 | playerTwo-confirm | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 245>205px; overflow-x visible; glyph range outside no; Espanyol |
| 932x430 | playerTwo-confirm | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 111>105px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 932x430 | playerTwo-confirm | Primary action in first screenful | #continueClubAssignment | yes; 430×30.6px; top/bottom 391/421.6px; CONFIRM SHARED SHOWDOWN; center unobscured yes |
| 932x430 | playerTwo-confirm-write-failure | Horizontal scrollbar | html / body | no; scroll/client 932/932px; overflow visible/hidden |
| 932x430 | playerTwo-confirm-write-failure | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 932x430 | playerTwo-confirm-write-failure | Touch control <44px | #clubWheelScreen | 2 of 2 visible controls |
| 932x430 | playerTwo-confirm-write-failure | Touch target <44px | #continueClubAssignment | 430×30.6px |
| 932x430 | playerTwo-confirm-write-failure | Touch target <44px | #onlinePlayerIdentityBadge | 61.1×28px |
| 932x430 | playerTwo-confirm-write-failure | Text scrollWidth > clientWidth | #clubWheelScreen | 3 candidates |
| 932x430 | playerTwo-confirm-write-failure | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 245>205px; overflow-x visible; glyph range outside no; Osasuna |
| 932x430 | playerTwo-confirm-write-failure | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 245>205px; overflow-x visible; glyph range outside no; Espanyol |
| 932x430 | playerTwo-confirm-write-failure | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 111>105px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 932x430 | playerTwo-confirm-write-failure | Primary action in first screenful | #continueClubAssignment | yes; 430×30.6px; top/bottom 390/420.6px; CONFIRM SHARED SHOWDOWN; center unobscured yes |
| 932x430 | playerTwo-waiting-rival | Horizontal scrollbar | html / body | no; scroll/client 932/932px; overflow visible/hidden |
| 932x430 | playerTwo-waiting-rival | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 932x430 | playerTwo-waiting-rival | Touch control <44px | #clubWheelScreen | 2 of 2 visible controls |
| 932x430 | playerTwo-waiting-rival | Touch target <44px | #continueClubAssignment | 430×30.6px; disabled |
| 932x430 | playerTwo-waiting-rival | Touch target <44px | #onlinePlayerIdentityBadge | 61.1×28px |
| 932x430 | playerTwo-waiting-rival | Text scrollWidth > clientWidth | #clubWheelScreen | 3 candidates |
| 932x430 | playerTwo-waiting-rival | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 245>205px; overflow-x visible; glyph range outside no; Osasuna |
| 932x430 | playerTwo-waiting-rival | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 245>205px; overflow-x visible; glyph range outside no; Espanyol |
| 932x430 | playerTwo-waiting-rival | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 111>105px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 932x430 | playerTwo-waiting-rival | Primary action in first screenful | #continueClubAssignment | yes; 430×30.6px; top/bottom 391/421.6px; CONFIRMED · WAITING FOR RIVAL; disabled; center unobscured yes |
| 932x430 | playerTwo-reconnect | Horizontal scrollbar | html / body | no; scroll/client 932/932px; overflow visible/hidden |
| 932x430 | playerTwo-reconnect | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 932x430 | playerTwo-reconnect | Touch control <44px | #clubWheelScreen | 2 of 2 visible controls |
| 932x430 | playerTwo-reconnect | Touch target <44px | #continueClubAssignment | 430×30.6px; disabled |
| 932x430 | playerTwo-reconnect | Touch target <44px | #onlinePlayerIdentityBadge | 61.1×28px |
| 932x430 | playerTwo-reconnect | Text scrollWidth > clientWidth | #clubWheelScreen | 3 candidates |
| 932x430 | playerTwo-reconnect | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 245>205px; overflow-x visible; glyph range outside no; Osasuna |
| 932x430 | playerTwo-reconnect | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 245>205px; overflow-x visible; glyph range outside no; Espanyol |
| 932x430 | playerTwo-reconnect | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 111>105px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 932x430 | playerTwo-reconnect | Primary action in first screenful | #continueClubAssignment | yes; 430×30.6px; top/bottom 391/421.6px; RECONNECT PLAYERS TO CONTINUE; disabled; center unobscured yes |
| 932x430 | playerTwo-career-start-ready | Horizontal scrollbar | html / body | no; scroll/client 932/932px; overflow visible/hidden |
| 932x430 | playerTwo-career-start-ready | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 932x430 | playerTwo-career-start-ready | Touch control <44px | #clubWheelScreen | 2 of 2 visible controls |
| 932x430 | playerTwo-career-start-ready | Touch target <44px | #continueClubAssignment | 430×30.6px |
| 932x430 | playerTwo-career-start-ready | Touch target <44px | #onlinePlayerIdentityBadge | 61.1×28px |
| 932x430 | playerTwo-career-start-ready | Text scrollWidth > clientWidth | #clubWheelScreen | 3 candidates |
| 932x430 | playerTwo-career-start-ready | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 245>205px; overflow-x visible; glyph range outside no; Osasuna |
| 932x430 | playerTwo-career-start-ready | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 245>205px; overflow-x visible; glyph range outside no; Espanyol |
| 932x430 | playerTwo-career-start-ready | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 111>105px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 932x430 | playerTwo-career-start-ready | Primary action in first screenful | #continueClubAssignment | yes; 430×30.6px; top/bottom 390/420.6px; CONTINUE TO CAREER START; center unobscured yes |
| 932x430 | playerTwo-season-mismatch | Horizontal scrollbar | html / body | no; scroll/client 932/932px; overflow visible/hidden |
| 932x430 | playerTwo-season-mismatch | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 932x430 | playerTwo-season-mismatch | Touch control <44px | #clubWheelScreen | 2 of 2 visible controls |
| 932x430 | playerTwo-season-mismatch | Touch target <44px | #continueClubAssignment | 430×30.6px; disabled |
| 932x430 | playerTwo-season-mismatch | Touch target <44px | #onlinePlayerIdentityBadge | 61.1×28px |
| 932x430 | playerTwo-season-mismatch | Text scrollWidth > clientWidth | #clubWheelScreen | 3 candidates |
| 932x430 | playerTwo-season-mismatch | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 245>205px; overflow-x visible; glyph range outside no; Osasuna |
| 932x430 | playerTwo-season-mismatch | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 245>205px; overflow-x visible; glyph range outside no; Espanyol |
| 932x430 | playerTwo-season-mismatch | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 111>105px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 932x430 | playerTwo-season-mismatch | Primary action in first screenful | #continueClubAssignment | yes; 430×30.6px; top/bottom 391/421.6px; SEASON PLAN MISMATCH · RECOVERY REQUIRED; disabled; center unobscured yes |
| 932x430 | playerTwo-long-club-names | Horizontal scrollbar | html / body | no; scroll/client 932/932px; overflow visible/hidden |
| 932x430 | playerTwo-long-club-names | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 932x430 | playerTwo-long-club-names | Touch control <44px | #clubWheelScreen | 2 of 2 visible controls |
| 932x430 | playerTwo-long-club-names | Touch target <44px | #continueClubAssignment | 430×30.6px |
| 932x430 | playerTwo-long-club-names | Touch target <44px | #onlinePlayerIdentityBadge | 61.1×28px |
| 932x430 | playerTwo-long-club-names | Text scrollWidth > clientWidth | #clubWheelScreen | 3 candidates |
| 932x430 | playerTwo-long-club-names | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 245>205px; overflow-x visible; glyph range outside no; Deportivo La Coruña |
| 932x430 | playerTwo-long-club-names | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 245>205px; overflow-x visible; glyph range outside yes; Borussia Mönchengladbach |
| 932x430 | playerTwo-long-club-names | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 111>105px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 932x430 | playerTwo-long-club-names | Primary action in first screenful | #continueClubAssignment | yes; 430×30.6px; top/bottom 390/420.6px; CONFIRM SHARED SHOWDOWN; center unobscured yes |
| 932x430 | playerOne-confirmation-overlap-detail | Horizontal scrollbar | html / body | no; scroll/client 932/932px; overflow visible/hidden |
| 932x430 | playerOne-confirmation-overlap-detail | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 932x430 | playerOne-confirmation-overlap-detail | Touch control <44px | #clubWheelScreen | 2 of 2 visible controls |
| 932x430 | playerOne-confirmation-overlap-detail | Touch target <44px | #continueClubAssignment | 430×30.6px |
| 932x430 | playerOne-confirmation-overlap-detail | Touch target <44px | #onlinePlayerIdentityBadge | 61.1×28px |
| 932x430 | playerOne-confirmation-overlap-detail | Text scrollWidth > clientWidth | #clubWheelScreen | 3 candidates |
| 932x430 | playerOne-confirmation-overlap-detail | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 245>205px; overflow-x visible; glyph range outside no; Osasuna |
| 932x430 | playerOne-confirmation-overlap-detail | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 245>205px; overflow-x visible; glyph range outside no; Espanyol |
| 932x430 | playerOne-confirmation-overlap-detail | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 113>105px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 932x430 | playerOne-confirmation-overlap-detail | Overlap | #clubNameOne / #continueClubAssignment | 110.3×12.4px intersection |
| 932x430 | playerOne-confirmation-overlap-detail | Overlap | #clubNameTwo / #continueClubAssignment | 41.4×12.4px intersection |
| 932x430 | playerOne-confirmation-overlap-detail | Primary action in first screenful | #continueClubAssignment | yes; 430×30.6px; top/bottom 391/421.6px; CONFIRM SHARED SHOWDOWN; center unobscured yes |
| 932x430 | playerTwo-confirmation-overlap-detail | Horizontal scrollbar | html / body | no; scroll/client 932/932px; overflow visible/hidden |
| 932x430 | playerTwo-confirmation-overlap-detail | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 932x430 | playerTwo-confirmation-overlap-detail | Touch control <44px | #clubWheelScreen | 2 of 2 visible controls |
| 932x430 | playerTwo-confirmation-overlap-detail | Touch target <44px | #continueClubAssignment | 430×30.6px |
| 932x430 | playerTwo-confirmation-overlap-detail | Touch target <44px | #onlinePlayerIdentityBadge | 61.1×28px |
| 932x430 | playerTwo-confirmation-overlap-detail | Text scrollWidth > clientWidth | #clubWheelScreen | 3 candidates |
| 932x430 | playerTwo-confirmation-overlap-detail | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 245>205px; overflow-x visible; glyph range outside no; Osasuna |
| 932x430 | playerTwo-confirmation-overlap-detail | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 245>205px; overflow-x visible; glyph range outside no; Espanyol |
| 932x430 | playerTwo-confirmation-overlap-detail | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 113>105px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 932x430 | playerTwo-confirmation-overlap-detail | Overlap | #clubNameOne / #continueClubAssignment | 110.3×12.4px intersection |
| 932x430 | playerTwo-confirmation-overlap-detail | Overlap | #clubNameTwo / #continueClubAssignment | 41.4×12.4px intersection |
| 932x430 | playerTwo-confirmation-overlap-detail | Primary action in first screenful | #continueClubAssignment | yes; 430×30.6px; top/bottom 391/421.6px; CONFIRM SHARED SHOWDOWN; center unobscured yes |
| 768x1024 | playerOne-sealed | Horizontal scrollbar | html / body | no; scroll/client 768/768px; overflow visible/hidden |
| 768x1024 | playerOne-sealed | Element wider than window | #clubWheelScreen | 1 content; 13 decoration |
| 768x1024 | playerOne-sealed | Oversized decoration (crop candidate) | #world | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-sealed | Oversized decoration (crop candidate) | #world > div.plateBase:nth-of-type(1) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-sealed | Oversized decoration (crop candidate) | #world > div.seamMend.plateDup:nth-of-type(2) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-sealed | Oversized decoration (crop candidate) | #covers | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-sealed | Oversized decoration (crop candidate) | #covers > polygon:nth-of-type(1) | 1526.5px; left/right -379.3/1147.3px |
| 768x1024 | playerOne-sealed | Oversized decoration (crop candidate) | #covers > polygon:nth-of-type(2) | 1526.5px; left/right -379.3/1147.3px |
| 768x1024 | playerOne-sealed | Oversized decoration (crop candidate) | #covers > polyline | 1526.5px; left/right -379.3/1147.3px |
| 768x1024 | playerOne-sealed | Oversized decoration (crop candidate) | #world > div.handContact.plateDup:nth-of-type(6) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-sealed | Oversized decoration (crop candidate) | #world > div.handCore.plateDup:nth-of-type(7) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-sealed | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(8) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-sealed | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(9) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-sealed | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(10) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-sealed | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(11) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-sealed | Wider than window | #clubWheelScreenScreenTitle | 778.3px; left/right -28.9/749.5px |
| 768x1024 | playerOne-sealed | Touch control <44px | #clubWheelScreen | 0 of 1 visible controls |
| 768x1024 | playerOne-sealed | Text scrollWidth > clientWidth | #clubWheelScreen | 0 candidates |
| 768x1024 | playerOne-sealed | Content outside viewport / ancestor crop | #openClubPack | top/bottom 890.1/964.7; left/right -29.1/504px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-sealed | Primary action in first screenful | #openClubPack | no; 533.1×74.6px; top/bottom 890.1/964.7px; OPEN SHOWDOWN PACKS; center unobscured yes |
| 768x1024 | playerOne-provider-working | Horizontal scrollbar | html / body | no; scroll/client 768/768px; overflow visible/hidden |
| 768x1024 | playerOne-provider-working | Element wider than window | #clubWheelScreen | 1 content; 13 decoration |
| 768x1024 | playerOne-provider-working | Oversized decoration (crop candidate) | #world | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-provider-working | Oversized decoration (crop candidate) | #world > div.plateBase:nth-of-type(1) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-provider-working | Oversized decoration (crop candidate) | #world > div.seamMend.plateDup:nth-of-type(2) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-provider-working | Oversized decoration (crop candidate) | #covers | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-provider-working | Oversized decoration (crop candidate) | #covers > polygon:nth-of-type(1) | 1526.5px; left/right -379.3/1147.3px |
| 768x1024 | playerOne-provider-working | Oversized decoration (crop candidate) | #covers > polygon:nth-of-type(2) | 1526.5px; left/right -379.3/1147.3px |
| 768x1024 | playerOne-provider-working | Oversized decoration (crop candidate) | #covers > polyline | 1526.5px; left/right -379.3/1147.3px |
| 768x1024 | playerOne-provider-working | Oversized decoration (crop candidate) | #world > div.handContact.plateDup:nth-of-type(6) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-provider-working | Oversized decoration (crop candidate) | #world > div.handCore.plateDup:nth-of-type(7) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-provider-working | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(8) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-provider-working | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(9) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-provider-working | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(10) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-provider-working | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(11) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-provider-working | Wider than window | #clubWheelScreenScreenTitle | 778.3px; left/right -28.9/749.5px |
| 768x1024 | playerOne-provider-working | Touch control <44px | #clubWheelScreen | 0 of 1 visible controls |
| 768x1024 | playerOne-provider-working | Text scrollWidth > clientWidth | #clubWheelScreen | 0 candidates |
| 768x1024 | playerOne-provider-working | Content outside viewport / ancestor crop | #clubCardOne > span.clubRevealIndex | top/bottom 738.1/766; left/right -212.8/-185.1px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-provider-working | Content outside viewport / ancestor crop | #clubPlayerOne | top/bottom 732.7/769.4; left/right -172.8/-100.3px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-provider-working | Content outside viewport / ancestor crop | #clubCardOne > div.clubPackStage:nth-of-type(2) > div.clubCardFace:nth-of-type(2) > span.clubCardEyebrow:nth-of-type(2) | top/bottom 770/789.2; left/right -212.8/-106.5px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-provider-working | Content outside viewport / ancestor crop | #clubCardOne > div.clubPackStage:nth-of-type(2) > div.clubCardFace:nth-of-type(2) > span.clubCardLabel:nth-of-type(3) | top/bottom 770/789.2; left/right -90.5/51.1px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-provider-working | Content outside viewport / ancestor crop | #clubNameOne | top/bottom 789.2/832.5; left/right -212.8/128px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-provider-working | Content outside viewport / ancestor crop | #clubCardStateOne | top/bottom 832.5/851.7; left/right -212.8/128px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-provider-working | Content outside viewport / ancestor crop | #clubPlayerTwo | top/bottom 732.7/769.4; left/right 770.6/808.8px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-provider-working | Content outside viewport / ancestor crop | #clubCardTwo > div.clubPackStage:nth-of-type(2) > div.clubCardFace:nth-of-type(2) > span.clubCardEyebrow:nth-of-type(2) | top/bottom 770/789.2; left/right 730.6/836.9px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-provider-working | Content outside viewport / ancestor crop | #clubCardTwo > div.clubPackStage:nth-of-type(2) > div.clubCardFace:nth-of-type(2) > span.clubCardLabel:nth-of-type(3) | top/bottom 770/789.2; left/right 852.9/994.5px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-provider-working | Content outside viewport / ancestor crop | #clubNameTwo | top/bottom 789.2/832.5; left/right 730.6/1071.4px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-provider-working | Content outside viewport / ancestor crop | #clubCardStateTwo | top/bottom 832.5/851.7; left/right 730.6/1071.4px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-provider-working | Primary action in first screenful | #openClubPack | yes; 533.1×74.6px; top/bottom 890.1/964.7px; WORKING…; disabled; center unobscured yes |
| 768x1024 | playerOne-pack-write-failure | Horizontal scrollbar | html / body | no; scroll/client 768/768px; overflow visible/hidden |
| 768x1024 | playerOne-pack-write-failure | Element wider than window | #clubWheelScreen | 1 content; 13 decoration |
| 768x1024 | playerOne-pack-write-failure | Oversized decoration (crop candidate) | #world | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-pack-write-failure | Oversized decoration (crop candidate) | #world > div.plateBase:nth-of-type(1) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-pack-write-failure | Oversized decoration (crop candidate) | #world > div.seamMend.plateDup:nth-of-type(2) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-pack-write-failure | Oversized decoration (crop candidate) | #covers | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-pack-write-failure | Oversized decoration (crop candidate) | #covers > polygon:nth-of-type(1) | 1526.5px; left/right -379.3/1147.3px |
| 768x1024 | playerOne-pack-write-failure | Oversized decoration (crop candidate) | #covers > polygon:nth-of-type(2) | 1526.5px; left/right -379.3/1147.3px |
| 768x1024 | playerOne-pack-write-failure | Oversized decoration (crop candidate) | #covers > polyline | 1526.5px; left/right -379.3/1147.3px |
| 768x1024 | playerOne-pack-write-failure | Oversized decoration (crop candidate) | #world > div.handContact.plateDup:nth-of-type(6) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-pack-write-failure | Oversized decoration (crop candidate) | #world > div.handCore.plateDup:nth-of-type(7) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-pack-write-failure | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(8) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-pack-write-failure | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(9) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-pack-write-failure | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(10) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-pack-write-failure | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(11) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-pack-write-failure | Wider than window | #clubWheelScreenScreenTitle | 778.3px; left/right -28.9/749.5px |
| 768x1024 | playerOne-pack-write-failure | Touch control <44px | #clubWheelScreen | 0 of 1 visible controls |
| 768x1024 | playerOne-pack-write-failure | Text scrollWidth > clientWidth | #clubWheelScreen | 0 candidates |
| 768x1024 | playerOne-pack-write-failure | Content outside viewport / ancestor crop | #clubCardOne > span.clubRevealIndex | top/bottom 738.1/766; left/right -212.8/-185.1px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-pack-write-failure | Content outside viewport / ancestor crop | #clubPlayerOne | top/bottom 732.7/769.4; left/right -172.8/-100.3px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-pack-write-failure | Content outside viewport / ancestor crop | #clubCardOne > div.clubPackStage:nth-of-type(2) > div.clubCardFace:nth-of-type(2) > span.clubCardEyebrow:nth-of-type(2) | top/bottom 770/789.2; left/right -212.8/-106.5px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-pack-write-failure | Content outside viewport / ancestor crop | #clubCardOne > div.clubPackStage:nth-of-type(2) > div.clubCardFace:nth-of-type(2) > span.clubCardLabel:nth-of-type(3) | top/bottom 770/789.2; left/right -90.5/51.1px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-pack-write-failure | Content outside viewport / ancestor crop | #clubNameOne | top/bottom 789.2/832.5; left/right -212.8/128px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-pack-write-failure | Content outside viewport / ancestor crop | #clubCardStateOne | top/bottom 832.5/851.7; left/right -212.8/128px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-pack-write-failure | Content outside viewport / ancestor crop | #clubPlayerTwo | top/bottom 732.7/769.4; left/right 770.6/808.8px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-pack-write-failure | Content outside viewport / ancestor crop | #clubCardTwo > div.clubPackStage:nth-of-type(2) > div.clubCardFace:nth-of-type(2) > span.clubCardEyebrow:nth-of-type(2) | top/bottom 770/789.2; left/right 730.6/836.9px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-pack-write-failure | Content outside viewport / ancestor crop | #clubCardTwo > div.clubPackStage:nth-of-type(2) > div.clubCardFace:nth-of-type(2) > span.clubCardLabel:nth-of-type(3) | top/bottom 770/789.2; left/right 852.9/994.5px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-pack-write-failure | Content outside viewport / ancestor crop | #clubNameTwo | top/bottom 789.2/832.5; left/right 730.6/1071.4px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-pack-write-failure | Content outside viewport / ancestor crop | #clubCardStateTwo | top/bottom 832.5/851.7; left/right 730.6/1071.4px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-pack-write-failure | Content outside viewport / ancestor crop | #openClubPack | top/bottom 889.1/963.7; left/right -29.1/504px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-pack-write-failure | Primary action in first screenful | #openClubPack | no; 533.1×74.6px; top/bottom 889.1/963.7px; OPEN SHOWDOWN PACKS; center unobscured yes |
| 768x1024 | playerOne-opening | Horizontal scrollbar | html / body | no; scroll/client 768/768px; overflow visible/hidden |
| 768x1024 | playerOne-opening | Element wider than window | #clubWheelScreen | 1 content; 13 decoration |
| 768x1024 | playerOne-opening | Oversized decoration (crop candidate) | #world | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-opening | Oversized decoration (crop candidate) | #world > div.plateBase:nth-of-type(1) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-opening | Oversized decoration (crop candidate) | #world > div.seamMend.plateDup:nth-of-type(2) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-opening | Oversized decoration (crop candidate) | #covers | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-opening | Oversized decoration (crop candidate) | #covers > polygon:nth-of-type(5) | 1526.5px; left/right -379.3/1147.3px |
| 768x1024 | playerOne-opening | Oversized decoration (crop candidate) | #covers > polygon:nth-of-type(6) | 1526.5px; left/right -379.3/1147.3px |
| 768x1024 | playerOne-opening | Oversized decoration (crop candidate) | #covers > polyline | 1526.5px; left/right -379.3/1147.3px |
| 768x1024 | playerOne-opening | Oversized decoration (crop candidate) | #world > div.handContact.plateDup:nth-of-type(6) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-opening | Oversized decoration (crop candidate) | #world > div.handCore.plateDup:nth-of-type(7) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-opening | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(8) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-opening | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(9) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-opening | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(10) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-opening | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(11) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-opening | Wider than window | #clubWheelScreenScreenTitle | 778.3px; left/right -28.9/749.5px |
| 768x1024 | playerOne-opening | Touch control <44px | #clubWheelScreen | 0 of 0 visible controls |
| 768x1024 | playerOne-opening | Text scrollWidth > clientWidth | #clubWheelScreen | 1 candidates |
| 768x1024 | playerOne-opening | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span | 184>140px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 768x1024 | playerOne-opening | Content outside viewport / ancestor crop | #clubCardOne > span.clubRevealIndex | top/bottom 738.1/766; left/right -212.8/-185.1px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-opening | Content outside viewport / ancestor crop | #clubPlayerOne | top/bottom 732.7/769.4; left/right -172.8/-100.3px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-opening | Content outside viewport / ancestor crop | #clubCardOne > div.clubPackStage.is-anticipating:nth-of-type(2) > div.clubCardFace:nth-of-type(2) > span.clubCardEyebrow:nth-of-type(2) | top/bottom 770/789.2; left/right -212.8/-106.5px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-opening | Content outside viewport / ancestor crop | #clubCardOne > div.clubPackStage.is-anticipating:nth-of-type(2) > div.clubCardFace:nth-of-type(2) > span.clubCardLabel:nth-of-type(3) | top/bottom 770/789.2; left/right -90.5/51.1px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-opening | Content outside viewport / ancestor crop | #clubNameOne | top/bottom 789.2/832.5; left/right -212.8/128px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-opening | Content outside viewport / ancestor crop | #clubCardStateOne | top/bottom 832.5/851.7; left/right -212.8/128px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-opening | Content outside viewport / ancestor crop | #clubPlayerTwo | top/bottom 732.7/769.4; left/right 770.6/808.8px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-opening | Content outside viewport / ancestor crop | #clubCardTwo > div.clubPackStage:nth-of-type(2) > div.clubCardFace:nth-of-type(2) > span.clubCardEyebrow:nth-of-type(2) | top/bottom 770/789.2; left/right 730.6/836.9px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-opening | Content outside viewport / ancestor crop | #clubCardTwo > div.clubPackStage:nth-of-type(2) > div.clubCardFace:nth-of-type(2) > span.clubCardLabel:nth-of-type(3) | top/bottom 770/789.2; left/right 852.9/994.5px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-opening | Content outside viewport / ancestor crop | #clubNameTwo | top/bottom 789.2/832.5; left/right 730.6/1071.4px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-opening | Content outside viewport / ancestor crop | #clubCardStateTwo | top/bottom 832.5/851.7; left/right 730.6/1071.4px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-opening | Primary action in first screenful | none | N/A no visible action |
| 768x1024 | playerOne-manager-one | Horizontal scrollbar | html / body | no; scroll/client 768/768px; overflow visible/hidden |
| 768x1024 | playerOne-manager-one | Element wider than window | #clubWheelScreen | 1 content; 18 decoration |
| 768x1024 | playerOne-manager-one | Oversized decoration (crop candidate) | #world | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-manager-one | Oversized decoration (crop candidate) | #world > div.plateBase:nth-of-type(1) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-manager-one | Oversized decoration (crop candidate) | #world > div.seamMend.plateDup:nth-of-type(2) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-manager-one | Oversized decoration (crop candidate) | #covers | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-manager-one | Oversized decoration (crop candidate) | #covers > polygon:nth-of-type(1) | 1526.5px; left/right -379.3/1147.3px |
| 768x1024 | playerOne-manager-one | Oversized decoration (crop candidate) | #covers > polygon:nth-of-type(2) | 1526.5px; left/right -379.3/1147.3px |
| 768x1024 | playerOne-manager-one | Oversized decoration (crop candidate) | #covers > polyline | 1526.5px; left/right -379.3/1147.3px |
| 768x1024 | playerOne-manager-one | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-manager-one | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > svg.rvHole:nth-of-type(2) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-manager-one | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > div.rvHalf.rvHalfLeft.plateDup:nth-of-type(2) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-manager-one | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > div.rvHalf.rvHalfRight.plateDup:nth-of-type(3) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-manager-one | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > div.rvFlap.plateDup:nth-of-type(5) | 1857.6px; left/right -540.5/1317.2px |
| 768x1024 | playerOne-manager-one | Oversized decoration (crop candidate) | #world > div.handContact.plateDup:nth-of-type(6) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-manager-one | Oversized decoration (crop candidate) | #world > div.handCore.plateDup:nth-of-type(7) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-manager-one | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(8) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-manager-one | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(9) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-manager-one | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(10) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-manager-one | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(11) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-manager-one | Wider than window | #clubWheelScreenScreenTitle | 778.3px; left/right -28.9/749.5px |
| 768x1024 | playerOne-manager-one | Touch control <44px | #clubWheelScreen | 0 of 0 visible controls |
| 768x1024 | playerOne-manager-one | Text scrollWidth > clientWidth | #clubWheelScreen | 1 candidates |
| 768x1024 | playerOne-manager-one | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span | 184>140px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 768x1024 | playerOne-manager-one | Content outside viewport / ancestor crop | #clubCardOne > span.clubRevealIndex | top/bottom 738.1/766; left/right -212.8/-185.1px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-manager-one | Content outside viewport / ancestor crop | #clubPlayerOne | top/bottom 732.7/769.4; left/right -172.8/-100.3px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-manager-one | Content outside viewport / ancestor crop | #clubCardOne > div.clubPackStage:nth-of-type(2) > div.clubCardFace:nth-of-type(2) > span.clubCardEyebrow:nth-of-type(2) | top/bottom 770/789.2; left/right -212.8/-106.5px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-manager-one | Content outside viewport / ancestor crop | #clubCardOne > div.clubPackStage:nth-of-type(2) > div.clubCardFace:nth-of-type(2) > span.clubCardLabel:nth-of-type(3) | top/bottom 770/789.2; left/right -90.5/51.1px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-manager-one | Content outside viewport / ancestor crop | #clubCardStateOne | top/bottom 832.5/851.7; left/right -212.8/128px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-manager-one | Content outside viewport / ancestor crop | #clubPlayerTwo | top/bottom 732.7/769.4; left/right 770.6/808.8px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-manager-one | Content outside viewport / ancestor crop | #clubCardTwo > div.clubPackStage.is-anticipating:nth-of-type(2) > div.clubCardFace:nth-of-type(2) > span.clubCardEyebrow:nth-of-type(2) | top/bottom 770/789.2; left/right 730.6/836.9px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-manager-one | Content outside viewport / ancestor crop | #clubCardTwo > div.clubPackStage.is-anticipating:nth-of-type(2) > div.clubCardFace:nth-of-type(2) > span.clubCardLabel:nth-of-type(3) | top/bottom 770/789.2; left/right 852.9/994.5px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-manager-one | Content outside viewport / ancestor crop | #clubNameTwo | top/bottom 789.2/832.5; left/right 730.6/1071.4px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-manager-one | Content outside viewport / ancestor crop | #clubCardStateTwo | top/bottom 832.5/851.7; left/right 730.6/1071.4px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-manager-one | Primary action in first screenful | none | N/A no visible action |
| 768x1024 | playerOne-manager-two | Horizontal scrollbar | html / body | no; scroll/client 768/768px; overflow visible/hidden |
| 768x1024 | playerOne-manager-two | Element wider than window | #clubWheelScreen | 1 content; 23 decoration |
| 768x1024 | playerOne-manager-two | Oversized decoration (crop candidate) | #world | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-manager-two | Oversized decoration (crop candidate) | #world > div.plateBase:nth-of-type(1) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-manager-two | Oversized decoration (crop candidate) | #world > div.seamMend.plateDup:nth-of-type(2) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-manager-two | Oversized decoration (crop candidate) | #covers | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-manager-two | Oversized decoration (crop candidate) | #covers > polygon:nth-of-type(1) | 1526.5px; left/right -379.3/1147.3px |
| 768x1024 | playerOne-manager-two | Oversized decoration (crop candidate) | #covers > polygon:nth-of-type(2) | 1526.5px; left/right -379.3/1147.3px |
| 768x1024 | playerOne-manager-two | Oversized decoration (crop candidate) | #covers > polyline | 1526.5px; left/right -379.3/1147.3px |
| 768x1024 | playerOne-manager-two | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-manager-two | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > svg.rvDark:nth-of-type(1) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-manager-two | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > svg.rvHole:nth-of-type(2) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-manager-two | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > svg.rvEdge:nth-of-type(3) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-manager-two | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > svg.rvBurst:nth-of-type(4) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-manager-two | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > svg.rvVoid:nth-of-type(5) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-manager-two | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-manager-two | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > div.rvHalf.rvHalfLeft.plateDup:nth-of-type(2) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-manager-two | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > div.rvHalf.rvHalfRight.plateDup:nth-of-type(3) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-manager-two | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > div.rvFlap.plateDup:nth-of-type(5) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-manager-two | Oversized decoration (crop candidate) | #world > div.handContact.plateDup:nth-of-type(6) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-manager-two | Oversized decoration (crop candidate) | #world > div.handCore.plateDup:nth-of-type(7) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-manager-two | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(8) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-manager-two | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(9) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-manager-two | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(10) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-manager-two | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(11) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-manager-two | Wider than window | #clubWheelScreenScreenTitle | 778.3px; left/right -28.9/749.5px |
| 768x1024 | playerOne-manager-two | Touch control <44px | #clubWheelScreen | 0 of 0 visible controls |
| 768x1024 | playerOne-manager-two | Text scrollWidth > clientWidth | #clubWheelScreen | 1 candidates |
| 768x1024 | playerOne-manager-two | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span | 184>140px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 768x1024 | playerOne-manager-two | Content outside viewport / ancestor crop | #clubCardOne > span.clubRevealIndex | top/bottom 738.1/766; left/right -212.8/-185.1px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-manager-two | Content outside viewport / ancestor crop | #clubPlayerOne | top/bottom 732.7/769.4; left/right -172.8/-100.3px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-manager-two | Content outside viewport / ancestor crop | #clubCardOne > div.clubPackStage:nth-of-type(2) > div.clubCardFace:nth-of-type(2) > span.clubCardEyebrow:nth-of-type(2) | top/bottom 770/789.2; left/right -212.8/-106.5px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-manager-two | Content outside viewport / ancestor crop | #clubCardOne > div.clubPackStage:nth-of-type(2) > div.clubCardFace:nth-of-type(2) > span.clubCardLabel:nth-of-type(3) | top/bottom 770/789.2; left/right -90.5/51.1px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-manager-two | Content outside viewport / ancestor crop | #clubNameOne | top/bottom 789.2/832.5; left/right -212.8/128px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-manager-two | Content outside viewport / ancestor crop | #clubCardStateOne | top/bottom 832.5/851.7; left/right -212.8/128px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-manager-two | Content outside viewport / ancestor crop | #clubPlayerTwo | top/bottom 732.7/769.4; left/right 770.6/808.8px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-manager-two | Content outside viewport / ancestor crop | #clubCardTwo > div.clubPackStage:nth-of-type(2) > div.clubCardFace:nth-of-type(2) > span.clubCardEyebrow:nth-of-type(2) | top/bottom 770/789.2; left/right 730.6/836.9px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-manager-two | Content outside viewport / ancestor crop | #clubCardTwo > div.clubPackStage:nth-of-type(2) > div.clubCardFace:nth-of-type(2) > span.clubCardLabel:nth-of-type(3) | top/bottom 770/789.2; left/right 852.9/994.5px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-manager-two | Content outside viewport / ancestor crop | #clubCardStateTwo | top/bottom 832.5/851.7; left/right 730.6/1071.4px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-manager-two | Primary action in first screenful | none | N/A no visible action |
| 768x1024 | playerOne-confirm | Horizontal scrollbar | html / body | no; scroll/client 768/768px; overflow visible/hidden |
| 768x1024 | playerOne-confirm | Element wider than window | #clubWheelScreen | 1 content; 25 decoration |
| 768x1024 | playerOne-confirm | Oversized decoration (crop candidate) | #world | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-confirm | Oversized decoration (crop candidate) | #world > div.plateBase:nth-of-type(1) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-confirm | Oversized decoration (crop candidate) | #world > div.seamMend.plateDup:nth-of-type(2) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-confirm | Oversized decoration (crop candidate) | #covers | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-confirm | Oversized decoration (crop candidate) | #covers > polygon:nth-of-type(1) | 1526.5px; left/right -379.3/1147.3px |
| 768x1024 | playerOne-confirm | Oversized decoration (crop candidate) | #covers > polygon:nth-of-type(2) | 1526.5px; left/right -379.3/1147.3px |
| 768x1024 | playerOne-confirm | Oversized decoration (crop candidate) | #covers > polyline | 1526.5px; left/right -379.3/1147.3px |
| 768x1024 | playerOne-confirm | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-confirm | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > svg.rvDark:nth-of-type(1) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-confirm | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > svg.rvHole:nth-of-type(2) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-confirm | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > svg.rvEdge:nth-of-type(3) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-confirm | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > svg.rvBurst:nth-of-type(4) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-confirm | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > svg.rvVoid:nth-of-type(5) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-confirm | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-confirm | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > svg.rvDark:nth-of-type(1) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-confirm | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > svg.rvHole:nth-of-type(2) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-confirm | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > svg.rvEdge:nth-of-type(3) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-confirm | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > svg.rvBurst:nth-of-type(4) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-confirm | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > svg.rvVoid:nth-of-type(5) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-confirm | Oversized decoration (crop candidate) | #world > div.handContact.plateDup:nth-of-type(6) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-confirm | Oversized decoration (crop candidate) | #world > div.handCore.plateDup:nth-of-type(7) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-confirm | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(8) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-confirm | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(9) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-confirm | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(10) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-confirm | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(11) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-confirm | Wider than window | #clubWheelScreenScreenTitle | 778.3px; left/right -28.9/749.5px |
| 768x1024 | playerOne-confirm | Touch control <44px | #clubWheelScreen | 0 of 1 visible controls |
| 768x1024 | playerOne-confirm | Text scrollWidth > clientWidth | #clubWheelScreen | 2 candidates |
| 768x1024 | playerOne-confirm | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 408>341px; overflow-x visible; glyph range outside no; Osasuna |
| 768x1024 | playerOne-confirm | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 151>140px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 768x1024 | playerOne-confirm | Content outside viewport / ancestor crop | #clubCardOne > span.clubRevealIndex | top/bottom 738.1/766; left/right -212.8/-185.1px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-confirm | Content outside viewport / ancestor crop | #clubPlayerOne | top/bottom 732.7/769.4; left/right -172.8/-100.3px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-confirm | Content outside viewport / ancestor crop | #clubCardOne > div.clubPackStage:nth-of-type(2) > div.clubCardFace:nth-of-type(2) > span.clubCardEyebrow:nth-of-type(2) | top/bottom 770/789.2; left/right -212.8/-106.5px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-confirm | Content outside viewport / ancestor crop | #clubCardOne > div.clubPackStage:nth-of-type(2) > div.clubCardFace:nth-of-type(2) > span.clubCardLabel:nth-of-type(3) | top/bottom 770/789.2; left/right -90.5/51.1px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-confirm | Content outside viewport / ancestor crop | #clubNameOne | top/bottom 789.2/832.5; left/right -212.8/128px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-confirm | Content outside viewport / ancestor crop | #clubCardStateOne | top/bottom 832.5/851.7; left/right -212.8/128px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-confirm | Content outside viewport / ancestor crop | #clubPlayerTwo | top/bottom 732.7/769.4; left/right 770.6/808.8px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-confirm | Content outside viewport / ancestor crop | #clubCardTwo > div.clubPackStage:nth-of-type(2) > div.clubCardFace:nth-of-type(2) > span.clubCardEyebrow:nth-of-type(2) | top/bottom 770/789.2; left/right 730.6/836.9px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-confirm | Content outside viewport / ancestor crop | #clubCardTwo > div.clubPackStage:nth-of-type(2) > div.clubCardFace:nth-of-type(2) > span.clubCardLabel:nth-of-type(3) | top/bottom 770/789.2; left/right 852.9/994.5px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-confirm | Content outside viewport / ancestor crop | #clubNameTwo | top/bottom 789.2/832.5; left/right 730.6/1071.4px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-confirm | Content outside viewport / ancestor crop | #clubCardStateTwo | top/bottom 832.5/851.7; left/right 730.6/1071.4px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-confirm | Primary action in first screenful | #continueClubAssignment | yes; 693×74.6px; top/bottom 889.1/963.7px; CONFIRM SHARED SHOWDOWN; center unobscured yes |
| 768x1024 | playerOne-confirm-write-failure | Horizontal scrollbar | html / body | no; scroll/client 768/768px; overflow visible/hidden |
| 768x1024 | playerOne-confirm-write-failure | Element wider than window | #clubWheelScreen | 1 content; 25 decoration |
| 768x1024 | playerOne-confirm-write-failure | Oversized decoration (crop candidate) | #world | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-confirm-write-failure | Oversized decoration (crop candidate) | #world > div.plateBase:nth-of-type(1) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-confirm-write-failure | Oversized decoration (crop candidate) | #world > div.seamMend.plateDup:nth-of-type(2) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-confirm-write-failure | Oversized decoration (crop candidate) | #covers | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-confirm-write-failure | Oversized decoration (crop candidate) | #covers > polygon:nth-of-type(1) | 1526.5px; left/right -379.3/1147.3px |
| 768x1024 | playerOne-confirm-write-failure | Oversized decoration (crop candidate) | #covers > polygon:nth-of-type(2) | 1526.5px; left/right -379.3/1147.3px |
| 768x1024 | playerOne-confirm-write-failure | Oversized decoration (crop candidate) | #covers > polyline | 1526.5px; left/right -379.3/1147.3px |
| 768x1024 | playerOne-confirm-write-failure | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-confirm-write-failure | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > svg.rvDark:nth-of-type(1) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-confirm-write-failure | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > svg.rvHole:nth-of-type(2) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-confirm-write-failure | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > svg.rvEdge:nth-of-type(3) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-confirm-write-failure | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > svg.rvBurst:nth-of-type(4) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-confirm-write-failure | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > svg.rvVoid:nth-of-type(5) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-confirm-write-failure | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-confirm-write-failure | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > svg.rvDark:nth-of-type(1) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-confirm-write-failure | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > svg.rvHole:nth-of-type(2) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-confirm-write-failure | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > svg.rvEdge:nth-of-type(3) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-confirm-write-failure | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > svg.rvBurst:nth-of-type(4) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-confirm-write-failure | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > svg.rvVoid:nth-of-type(5) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-confirm-write-failure | Oversized decoration (crop candidate) | #world > div.handContact.plateDup:nth-of-type(6) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-confirm-write-failure | Oversized decoration (crop candidate) | #world > div.handCore.plateDup:nth-of-type(7) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-confirm-write-failure | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(8) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-confirm-write-failure | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(9) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-confirm-write-failure | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(10) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-confirm-write-failure | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(11) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-confirm-write-failure | Wider than window | #clubWheelScreenScreenTitle | 778.3px; left/right -28.9/749.5px |
| 768x1024 | playerOne-confirm-write-failure | Touch control <44px | #clubWheelScreen | 0 of 1 visible controls |
| 768x1024 | playerOne-confirm-write-failure | Text scrollWidth > clientWidth | #clubWheelScreen | 2 candidates |
| 768x1024 | playerOne-confirm-write-failure | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 408>341px; overflow-x visible; glyph range outside no; Osasuna |
| 768x1024 | playerOne-confirm-write-failure | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 148>140px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 768x1024 | playerOne-confirm-write-failure | Content outside viewport / ancestor crop | #clubCardOne > span.clubRevealIndex | top/bottom 738.1/766; left/right -212.8/-185.1px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-confirm-write-failure | Content outside viewport / ancestor crop | #clubPlayerOne | top/bottom 732.7/769.4; left/right -172.8/-100.3px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-confirm-write-failure | Content outside viewport / ancestor crop | #clubCardOne > div.clubPackStage:nth-of-type(2) > div.clubCardFace:nth-of-type(2) > span.clubCardEyebrow:nth-of-type(2) | top/bottom 770/789.2; left/right -212.8/-106.5px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-confirm-write-failure | Content outside viewport / ancestor crop | #clubCardOne > div.clubPackStage:nth-of-type(2) > div.clubCardFace:nth-of-type(2) > span.clubCardLabel:nth-of-type(3) | top/bottom 770/789.2; left/right -90.5/51.1px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-confirm-write-failure | Content outside viewport / ancestor crop | #clubNameOne | top/bottom 789.2/832.5; left/right -212.8/128px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-confirm-write-failure | Content outside viewport / ancestor crop | #clubCardStateOne | top/bottom 832.5/851.7; left/right -212.8/128px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-confirm-write-failure | Content outside viewport / ancestor crop | #clubPlayerTwo | top/bottom 732.7/769.4; left/right 770.6/808.8px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-confirm-write-failure | Content outside viewport / ancestor crop | #clubCardTwo > div.clubPackStage:nth-of-type(2) > div.clubCardFace:nth-of-type(2) > span.clubCardEyebrow:nth-of-type(2) | top/bottom 770/789.2; left/right 730.6/836.9px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-confirm-write-failure | Content outside viewport / ancestor crop | #clubCardTwo > div.clubPackStage:nth-of-type(2) > div.clubCardFace:nth-of-type(2) > span.clubCardLabel:nth-of-type(3) | top/bottom 770/789.2; left/right 852.9/994.5px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-confirm-write-failure | Content outside viewport / ancestor crop | #clubNameTwo | top/bottom 789.2/832.5; left/right 730.6/1071.4px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-confirm-write-failure | Content outside viewport / ancestor crop | #clubCardStateTwo | top/bottom 832.5/851.7; left/right 730.6/1071.4px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-confirm-write-failure | Primary action in first screenful | #continueClubAssignment | yes; 693×74.6px; top/bottom 889.1/963.7px; CONFIRM SHARED SHOWDOWN; center unobscured yes |
| 768x1024 | playerOne-waiting-rival | Horizontal scrollbar | html / body | no; scroll/client 768/768px; overflow visible/hidden |
| 768x1024 | playerOne-waiting-rival | Element wider than window | #clubWheelScreen | 1 content; 25 decoration |
| 768x1024 | playerOne-waiting-rival | Oversized decoration (crop candidate) | #world | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-waiting-rival | Oversized decoration (crop candidate) | #world > div.plateBase:nth-of-type(1) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-waiting-rival | Oversized decoration (crop candidate) | #world > div.seamMend.plateDup:nth-of-type(2) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-waiting-rival | Oversized decoration (crop candidate) | #covers | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-waiting-rival | Oversized decoration (crop candidate) | #covers > polygon:nth-of-type(1) | 1526.5px; left/right -379.3/1147.3px |
| 768x1024 | playerOne-waiting-rival | Oversized decoration (crop candidate) | #covers > polygon:nth-of-type(2) | 1526.5px; left/right -379.3/1147.3px |
| 768x1024 | playerOne-waiting-rival | Oversized decoration (crop candidate) | #covers > polyline | 1526.5px; left/right -379.3/1147.3px |
| 768x1024 | playerOne-waiting-rival | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-waiting-rival | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > svg.rvDark:nth-of-type(1) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-waiting-rival | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > svg.rvHole:nth-of-type(2) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-waiting-rival | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > svg.rvEdge:nth-of-type(3) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-waiting-rival | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > svg.rvBurst:nth-of-type(4) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-waiting-rival | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > svg.rvVoid:nth-of-type(5) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-waiting-rival | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-waiting-rival | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > svg.rvDark:nth-of-type(1) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-waiting-rival | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > svg.rvHole:nth-of-type(2) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-waiting-rival | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > svg.rvEdge:nth-of-type(3) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-waiting-rival | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > svg.rvBurst:nth-of-type(4) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-waiting-rival | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > svg.rvVoid:nth-of-type(5) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-waiting-rival | Oversized decoration (crop candidate) | #world > div.handContact.plateDup:nth-of-type(6) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-waiting-rival | Oversized decoration (crop candidate) | #world > div.handCore.plateDup:nth-of-type(7) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-waiting-rival | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(8) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-waiting-rival | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(9) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-waiting-rival | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(10) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-waiting-rival | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(11) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-waiting-rival | Wider than window | #clubWheelScreenScreenTitle | 778.3px; left/right -28.9/749.5px |
| 768x1024 | playerOne-waiting-rival | Touch control <44px | #clubWheelScreen | 0 of 1 visible controls |
| 768x1024 | playerOne-waiting-rival | Text scrollWidth > clientWidth | #clubWheelScreen | 2 candidates |
| 768x1024 | playerOne-waiting-rival | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 408>341px; overflow-x visible; glyph range outside no; Osasuna |
| 768x1024 | playerOne-waiting-rival | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 148>140px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 768x1024 | playerOne-waiting-rival | Content outside viewport / ancestor crop | #clubCardOne > span.clubRevealIndex | top/bottom 738.1/766; left/right -212.8/-185.1px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-waiting-rival | Content outside viewport / ancestor crop | #clubPlayerOne | top/bottom 732.7/769.4; left/right -172.8/-100.3px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-waiting-rival | Content outside viewport / ancestor crop | #clubCardOne > div.clubPackStage:nth-of-type(2) > div.clubCardFace:nth-of-type(2) > span.clubCardEyebrow:nth-of-type(2) | top/bottom 770/789.2; left/right -212.8/-106.5px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-waiting-rival | Content outside viewport / ancestor crop | #clubCardOne > div.clubPackStage:nth-of-type(2) > div.clubCardFace:nth-of-type(2) > span.clubCardLabel:nth-of-type(3) | top/bottom 770/789.2; left/right -90.5/51.1px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-waiting-rival | Content outside viewport / ancestor crop | #clubNameOne | top/bottom 789.2/832.5; left/right -212.8/128px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-waiting-rival | Content outside viewport / ancestor crop | #clubCardStateOne | top/bottom 832.5/851.7; left/right -212.8/128px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-waiting-rival | Content outside viewport / ancestor crop | #clubPlayerTwo | top/bottom 732.7/769.4; left/right 770.6/808.8px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-waiting-rival | Content outside viewport / ancestor crop | #clubCardTwo > div.clubPackStage:nth-of-type(2) > div.clubCardFace:nth-of-type(2) > span.clubCardEyebrow:nth-of-type(2) | top/bottom 770/789.2; left/right 730.6/836.9px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-waiting-rival | Content outside viewport / ancestor crop | #clubCardTwo > div.clubPackStage:nth-of-type(2) > div.clubCardFace:nth-of-type(2) > span.clubCardLabel:nth-of-type(3) | top/bottom 770/789.2; left/right 852.9/994.5px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-waiting-rival | Content outside viewport / ancestor crop | #clubNameTwo | top/bottom 789.2/832.5; left/right 730.6/1071.4px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-waiting-rival | Content outside viewport / ancestor crop | #clubCardStateTwo | top/bottom 832.5/851.7; left/right 730.6/1071.4px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-waiting-rival | Primary action in first screenful | #continueClubAssignment | yes; 693×74.6px; top/bottom 890.1/964.7px; CONFIRMED · WAITING FOR RIVAL; disabled; center unobscured yes |
| 768x1024 | playerOne-reconnect | Horizontal scrollbar | html / body | no; scroll/client 768/768px; overflow visible/hidden |
| 768x1024 | playerOne-reconnect | Element wider than window | #clubWheelScreen | 1 content; 25 decoration |
| 768x1024 | playerOne-reconnect | Oversized decoration (crop candidate) | #world | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-reconnect | Oversized decoration (crop candidate) | #world > div.plateBase:nth-of-type(1) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-reconnect | Oversized decoration (crop candidate) | #world > div.seamMend.plateDup:nth-of-type(2) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-reconnect | Oversized decoration (crop candidate) | #covers | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-reconnect | Oversized decoration (crop candidate) | #covers > polygon:nth-of-type(1) | 1526.5px; left/right -379.3/1147.3px |
| 768x1024 | playerOne-reconnect | Oversized decoration (crop candidate) | #covers > polygon:nth-of-type(2) | 1526.5px; left/right -379.3/1147.3px |
| 768x1024 | playerOne-reconnect | Oversized decoration (crop candidate) | #covers > polyline | 1526.5px; left/right -379.3/1147.3px |
| 768x1024 | playerOne-reconnect | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-reconnect | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > svg.rvDark:nth-of-type(1) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-reconnect | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > svg.rvHole:nth-of-type(2) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-reconnect | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > svg.rvEdge:nth-of-type(3) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-reconnect | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > svg.rvBurst:nth-of-type(4) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-reconnect | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > svg.rvVoid:nth-of-type(5) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-reconnect | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-reconnect | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > svg.rvDark:nth-of-type(1) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-reconnect | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > svg.rvHole:nth-of-type(2) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-reconnect | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > svg.rvEdge:nth-of-type(3) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-reconnect | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > svg.rvBurst:nth-of-type(4) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-reconnect | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > svg.rvVoid:nth-of-type(5) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-reconnect | Oversized decoration (crop candidate) | #world > div.handContact.plateDup:nth-of-type(6) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-reconnect | Oversized decoration (crop candidate) | #world > div.handCore.plateDup:nth-of-type(7) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-reconnect | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(8) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-reconnect | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(9) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-reconnect | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(10) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-reconnect | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(11) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-reconnect | Wider than window | #clubWheelScreenScreenTitle | 778.3px; left/right -28.9/749.5px |
| 768x1024 | playerOne-reconnect | Touch control <44px | #clubWheelScreen | 0 of 1 visible controls |
| 768x1024 | playerOne-reconnect | Text scrollWidth > clientWidth | #clubWheelScreen | 2 candidates |
| 768x1024 | playerOne-reconnect | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 408>341px; overflow-x visible; glyph range outside no; Osasuna |
| 768x1024 | playerOne-reconnect | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 148>140px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 768x1024 | playerOne-reconnect | Content outside viewport / ancestor crop | #clubCardOne > span.clubRevealIndex | top/bottom 738.1/766; left/right -212.8/-185.1px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-reconnect | Content outside viewport / ancestor crop | #clubPlayerOne | top/bottom 732.7/769.4; left/right -172.8/-100.3px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-reconnect | Content outside viewport / ancestor crop | #clubCardOne > div.clubPackStage:nth-of-type(2) > div.clubCardFace:nth-of-type(2) > span.clubCardEyebrow:nth-of-type(2) | top/bottom 770/789.2; left/right -212.8/-106.5px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-reconnect | Content outside viewport / ancestor crop | #clubCardOne > div.clubPackStage:nth-of-type(2) > div.clubCardFace:nth-of-type(2) > span.clubCardLabel:nth-of-type(3) | top/bottom 770/789.2; left/right -90.5/51.1px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-reconnect | Content outside viewport / ancestor crop | #clubNameOne | top/bottom 789.2/832.5; left/right -212.8/128px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-reconnect | Content outside viewport / ancestor crop | #clubCardStateOne | top/bottom 832.5/851.7; left/right -212.8/128px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-reconnect | Content outside viewport / ancestor crop | #clubPlayerTwo | top/bottom 732.7/769.4; left/right 770.6/808.8px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-reconnect | Content outside viewport / ancestor crop | #clubCardTwo > div.clubPackStage:nth-of-type(2) > div.clubCardFace:nth-of-type(2) > span.clubCardEyebrow:nth-of-type(2) | top/bottom 770/789.2; left/right 730.6/836.9px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-reconnect | Content outside viewport / ancestor crop | #clubCardTwo > div.clubPackStage:nth-of-type(2) > div.clubCardFace:nth-of-type(2) > span.clubCardLabel:nth-of-type(3) | top/bottom 770/789.2; left/right 852.9/994.5px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-reconnect | Content outside viewport / ancestor crop | #clubNameTwo | top/bottom 789.2/832.5; left/right 730.6/1071.4px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-reconnect | Content outside viewport / ancestor crop | #clubCardStateTwo | top/bottom 832.5/851.7; left/right 730.6/1071.4px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-reconnect | Primary action in first screenful | #continueClubAssignment | yes; 693×74.6px; top/bottom 890.1/964.7px; RECONNECT PLAYERS TO CONTINUE; disabled; center unobscured yes |
| 768x1024 | playerOne-career-start-ready | Horizontal scrollbar | html / body | no; scroll/client 768/768px; overflow visible/hidden |
| 768x1024 | playerOne-career-start-ready | Element wider than window | #clubWheelScreen | 1 content; 25 decoration |
| 768x1024 | playerOne-career-start-ready | Oversized decoration (crop candidate) | #world | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-career-start-ready | Oversized decoration (crop candidate) | #world > div.plateBase:nth-of-type(1) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-career-start-ready | Oversized decoration (crop candidate) | #world > div.seamMend.plateDup:nth-of-type(2) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-career-start-ready | Oversized decoration (crop candidate) | #covers | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-career-start-ready | Oversized decoration (crop candidate) | #covers > polygon:nth-of-type(1) | 1526.5px; left/right -379.3/1147.3px |
| 768x1024 | playerOne-career-start-ready | Oversized decoration (crop candidate) | #covers > polygon:nth-of-type(2) | 1526.5px; left/right -379.3/1147.3px |
| 768x1024 | playerOne-career-start-ready | Oversized decoration (crop candidate) | #covers > polyline | 1526.5px; left/right -379.3/1147.3px |
| 768x1024 | playerOne-career-start-ready | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-career-start-ready | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > svg.rvDark:nth-of-type(1) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-career-start-ready | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > svg.rvHole:nth-of-type(2) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-career-start-ready | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > svg.rvEdge:nth-of-type(3) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-career-start-ready | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > svg.rvBurst:nth-of-type(4) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-career-start-ready | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > svg.rvVoid:nth-of-type(5) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-career-start-ready | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-career-start-ready | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > svg.rvDark:nth-of-type(1) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-career-start-ready | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > svg.rvHole:nth-of-type(2) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-career-start-ready | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > svg.rvEdge:nth-of-type(3) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-career-start-ready | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > svg.rvBurst:nth-of-type(4) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-career-start-ready | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > svg.rvVoid:nth-of-type(5) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-career-start-ready | Oversized decoration (crop candidate) | #world > div.handContact.plateDup:nth-of-type(6) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-career-start-ready | Oversized decoration (crop candidate) | #world > div.handCore.plateDup:nth-of-type(7) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-career-start-ready | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(8) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-career-start-ready | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(9) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-career-start-ready | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(10) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-career-start-ready | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(11) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-career-start-ready | Wider than window | #clubWheelScreenScreenTitle | 778.3px; left/right -28.9/749.5px |
| 768x1024 | playerOne-career-start-ready | Touch control <44px | #clubWheelScreen | 0 of 1 visible controls |
| 768x1024 | playerOne-career-start-ready | Text scrollWidth > clientWidth | #clubWheelScreen | 2 candidates |
| 768x1024 | playerOne-career-start-ready | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 408>341px; overflow-x visible; glyph range outside no; Osasuna |
| 768x1024 | playerOne-career-start-ready | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 148>140px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 768x1024 | playerOne-career-start-ready | Content outside viewport / ancestor crop | #clubCardOne > span.clubRevealIndex | top/bottom 738.1/766; left/right -212.8/-185.1px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-career-start-ready | Content outside viewport / ancestor crop | #clubPlayerOne | top/bottom 732.7/769.4; left/right -172.8/-100.3px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-career-start-ready | Content outside viewport / ancestor crop | #clubCardOne > div.clubPackStage:nth-of-type(2) > div.clubCardFace:nth-of-type(2) > span.clubCardEyebrow:nth-of-type(2) | top/bottom 770/789.2; left/right -212.8/-106.5px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-career-start-ready | Content outside viewport / ancestor crop | #clubCardOne > div.clubPackStage:nth-of-type(2) > div.clubCardFace:nth-of-type(2) > span.clubCardLabel:nth-of-type(3) | top/bottom 770/789.2; left/right -90.5/51.1px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-career-start-ready | Content outside viewport / ancestor crop | #clubNameOne | top/bottom 789.2/832.5; left/right -212.8/128px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-career-start-ready | Content outside viewport / ancestor crop | #clubCardStateOne | top/bottom 832.5/851.7; left/right -212.8/128px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-career-start-ready | Content outside viewport / ancestor crop | #clubPlayerTwo | top/bottom 732.7/769.4; left/right 770.6/808.8px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-career-start-ready | Content outside viewport / ancestor crop | #clubCardTwo > div.clubPackStage:nth-of-type(2) > div.clubCardFace:nth-of-type(2) > span.clubCardEyebrow:nth-of-type(2) | top/bottom 770/789.2; left/right 730.6/836.9px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-career-start-ready | Content outside viewport / ancestor crop | #clubCardTwo > div.clubPackStage:nth-of-type(2) > div.clubCardFace:nth-of-type(2) > span.clubCardLabel:nth-of-type(3) | top/bottom 770/789.2; left/right 852.9/994.5px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-career-start-ready | Content outside viewport / ancestor crop | #clubNameTwo | top/bottom 789.2/832.5; left/right 730.6/1071.4px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-career-start-ready | Content outside viewport / ancestor crop | #clubCardStateTwo | top/bottom 832.5/851.7; left/right 730.6/1071.4px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-career-start-ready | Primary action in first screenful | #continueClubAssignment | yes; 693×74.6px; top/bottom 889.1/963.7px; CONTINUE TO CAREER START; center unobscured yes |
| 768x1024 | playerOne-season-mismatch | Horizontal scrollbar | html / body | no; scroll/client 768/768px; overflow visible/hidden |
| 768x1024 | playerOne-season-mismatch | Element wider than window | #clubWheelScreen | 1 content; 25 decoration |
| 768x1024 | playerOne-season-mismatch | Oversized decoration (crop candidate) | #world | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-season-mismatch | Oversized decoration (crop candidate) | #world > div.plateBase:nth-of-type(1) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-season-mismatch | Oversized decoration (crop candidate) | #world > div.seamMend.plateDup:nth-of-type(2) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-season-mismatch | Oversized decoration (crop candidate) | #covers | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-season-mismatch | Oversized decoration (crop candidate) | #covers > polygon:nth-of-type(1) | 1526.5px; left/right -379.3/1147.3px |
| 768x1024 | playerOne-season-mismatch | Oversized decoration (crop candidate) | #covers > polygon:nth-of-type(2) | 1526.5px; left/right -379.3/1147.3px |
| 768x1024 | playerOne-season-mismatch | Oversized decoration (crop candidate) | #covers > polyline | 1526.5px; left/right -379.3/1147.3px |
| 768x1024 | playerOne-season-mismatch | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-season-mismatch | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > svg.rvDark:nth-of-type(1) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-season-mismatch | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > svg.rvHole:nth-of-type(2) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-season-mismatch | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > svg.rvEdge:nth-of-type(3) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-season-mismatch | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > svg.rvBurst:nth-of-type(4) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-season-mismatch | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > svg.rvVoid:nth-of-type(5) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-season-mismatch | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-season-mismatch | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > svg.rvDark:nth-of-type(1) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-season-mismatch | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > svg.rvHole:nth-of-type(2) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-season-mismatch | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > svg.rvEdge:nth-of-type(3) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-season-mismatch | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > svg.rvBurst:nth-of-type(4) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-season-mismatch | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > svg.rvVoid:nth-of-type(5) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-season-mismatch | Oversized decoration (crop candidate) | #world > div.handContact.plateDup:nth-of-type(6) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-season-mismatch | Oversized decoration (crop candidate) | #world > div.handCore.plateDup:nth-of-type(7) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-season-mismatch | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(8) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-season-mismatch | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(9) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-season-mismatch | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(10) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-season-mismatch | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(11) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-season-mismatch | Wider than window | #clubWheelScreenScreenTitle | 778.3px; left/right -28.9/749.5px |
| 768x1024 | playerOne-season-mismatch | Touch control <44px | #clubWheelScreen | 0 of 1 visible controls |
| 768x1024 | playerOne-season-mismatch | Text scrollWidth > clientWidth | #clubWheelScreen | 2 candidates |
| 768x1024 | playerOne-season-mismatch | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 408>341px; overflow-x visible; glyph range outside no; Osasuna |
| 768x1024 | playerOne-season-mismatch | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 148>140px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 768x1024 | playerOne-season-mismatch | Content outside viewport / ancestor crop | #clubCardOne > span.clubRevealIndex | top/bottom 738.1/766; left/right -212.8/-185.1px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-season-mismatch | Content outside viewport / ancestor crop | #clubPlayerOne | top/bottom 732.7/769.4; left/right -172.8/-100.3px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-season-mismatch | Content outside viewport / ancestor crop | #clubCardOne > div.clubPackStage:nth-of-type(2) > div.clubCardFace:nth-of-type(2) > span.clubCardEyebrow:nth-of-type(2) | top/bottom 770/789.2; left/right -212.8/-106.5px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-season-mismatch | Content outside viewport / ancestor crop | #clubCardOne > div.clubPackStage:nth-of-type(2) > div.clubCardFace:nth-of-type(2) > span.clubCardLabel:nth-of-type(3) | top/bottom 770/789.2; left/right -90.5/51.1px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-season-mismatch | Content outside viewport / ancestor crop | #clubNameOne | top/bottom 789.2/832.5; left/right -212.8/128px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-season-mismatch | Content outside viewport / ancestor crop | #clubCardStateOne | top/bottom 832.5/851.7; left/right -212.8/128px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-season-mismatch | Content outside viewport / ancestor crop | #clubPlayerTwo | top/bottom 732.7/769.4; left/right 770.6/808.8px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-season-mismatch | Content outside viewport / ancestor crop | #clubCardTwo > div.clubPackStage:nth-of-type(2) > div.clubCardFace:nth-of-type(2) > span.clubCardEyebrow:nth-of-type(2) | top/bottom 770/789.2; left/right 730.6/836.9px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-season-mismatch | Content outside viewport / ancestor crop | #clubCardTwo > div.clubPackStage:nth-of-type(2) > div.clubCardFace:nth-of-type(2) > span.clubCardLabel:nth-of-type(3) | top/bottom 770/789.2; left/right 852.9/994.5px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-season-mismatch | Content outside viewport / ancestor crop | #clubNameTwo | top/bottom 789.2/832.5; left/right 730.6/1071.4px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-season-mismatch | Content outside viewport / ancestor crop | #clubCardStateTwo | top/bottom 832.5/851.7; left/right 730.6/1071.4px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-season-mismatch | Primary action in first screenful | #continueClubAssignment | yes; 693×74.6px; top/bottom 890.1/964.7px; SEASON PLAN MISMATCH · RECOVERY REQUIRED; disabled; center unobscured yes |
| 768x1024 | playerOne-long-club-names | Horizontal scrollbar | html / body | no; scroll/client 768/768px; overflow visible/hidden |
| 768x1024 | playerOne-long-club-names | Element wider than window | #clubWheelScreen | 1 content; 25 decoration |
| 768x1024 | playerOne-long-club-names | Oversized decoration (crop candidate) | #world | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-long-club-names | Oversized decoration (crop candidate) | #world > div.plateBase:nth-of-type(1) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-long-club-names | Oversized decoration (crop candidate) | #world > div.seamMend.plateDup:nth-of-type(2) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-long-club-names | Oversized decoration (crop candidate) | #covers | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-long-club-names | Oversized decoration (crop candidate) | #covers > polygon:nth-of-type(1) | 1526.5px; left/right -379.3/1147.3px |
| 768x1024 | playerOne-long-club-names | Oversized decoration (crop candidate) | #covers > polygon:nth-of-type(2) | 1526.5px; left/right -379.3/1147.3px |
| 768x1024 | playerOne-long-club-names | Oversized decoration (crop candidate) | #covers > polyline | 1526.5px; left/right -379.3/1147.3px |
| 768x1024 | playerOne-long-club-names | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-long-club-names | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > svg.rvDark:nth-of-type(1) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-long-club-names | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > svg.rvHole:nth-of-type(2) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-long-club-names | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > svg.rvEdge:nth-of-type(3) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-long-club-names | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > svg.rvBurst:nth-of-type(4) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-long-club-names | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > svg.rvVoid:nth-of-type(5) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-long-club-names | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-long-club-names | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > svg.rvDark:nth-of-type(1) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-long-club-names | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > svg.rvHole:nth-of-type(2) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-long-club-names | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > svg.rvEdge:nth-of-type(3) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-long-club-names | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > svg.rvBurst:nth-of-type(4) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-long-club-names | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > svg.rvVoid:nth-of-type(5) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-long-club-names | Oversized decoration (crop candidate) | #world > div.handContact.plateDup:nth-of-type(6) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-long-club-names | Oversized decoration (crop candidate) | #world > div.handCore.plateDup:nth-of-type(7) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-long-club-names | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(8) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-long-club-names | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(9) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-long-club-names | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(10) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-long-club-names | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(11) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-long-club-names | Wider than window | #clubWheelScreenScreenTitle | 778.3px; left/right -28.9/749.5px |
| 768x1024 | playerOne-long-club-names | Touch control <44px | #clubWheelScreen | 0 of 1 visible controls |
| 768x1024 | playerOne-long-club-names | Text scrollWidth > clientWidth | #clubWheelScreen | 3 candidates |
| 768x1024 | playerOne-long-club-names | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 408>341px; overflow-x visible; glyph range outside no; Deportivo La Coruña |
| 768x1024 | playerOne-long-club-names | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 408>341px; overflow-x visible; glyph range outside yes; Borussia Mönchengladbach |
| 768x1024 | playerOne-long-club-names | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 148>140px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 768x1024 | playerOne-long-club-names | Content outside viewport / ancestor crop | #clubCardOne > span.clubRevealIndex | top/bottom 738.1/766; left/right -212.8/-185.1px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-long-club-names | Content outside viewport / ancestor crop | #clubPlayerOne | top/bottom 732.7/769.4; left/right -172.8/-100.3px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-long-club-names | Content outside viewport / ancestor crop | #clubCardOne > div.clubPackStage:nth-of-type(2) > div.clubCardFace:nth-of-type(2) > span.clubCardEyebrow:nth-of-type(2) | top/bottom 770/789.2; left/right -212.8/-106.5px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-long-club-names | Content outside viewport / ancestor crop | #clubCardOne > div.clubPackStage:nth-of-type(2) > div.clubCardFace:nth-of-type(2) > span.clubCardLabel:nth-of-type(3) | top/bottom 770/789.2; left/right -90.5/51.1px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-long-club-names | Content outside viewport / ancestor crop | #clubNameOne | top/bottom 789.2/832.5; left/right -212.8/128px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-long-club-names | Content outside viewport / ancestor crop | #clubCardStateOne | top/bottom 832.5/851.7; left/right -212.8/128px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-long-club-names | Content outside viewport / ancestor crop | #clubPlayerTwo | top/bottom 732.7/769.4; left/right 770.6/808.8px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-long-club-names | Content outside viewport / ancestor crop | #clubCardTwo > div.clubPackStage:nth-of-type(2) > div.clubCardFace:nth-of-type(2) > span.clubCardEyebrow:nth-of-type(2) | top/bottom 770/789.2; left/right 730.6/836.9px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-long-club-names | Content outside viewport / ancestor crop | #clubCardTwo > div.clubPackStage:nth-of-type(2) > div.clubCardFace:nth-of-type(2) > span.clubCardLabel:nth-of-type(3) | top/bottom 770/789.2; left/right 852.9/994.5px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-long-club-names | Content outside viewport / ancestor crop | #clubNameTwo | top/bottom 789.2/832.5; left/right 730.6/1071.4px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-long-club-names | Content outside viewport / ancestor crop | #clubCardStateTwo | top/bottom 832.5/851.7; left/right 730.6/1071.4px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-long-club-names | Overlap | .clubRivalryLockNote / #continueClubAssignment | 493×26px intersection |
| 768x1024 | playerOne-long-club-names | Primary action in first screenful | #continueClubAssignment | yes; 693×74.6px; top/bottom 889.1/963.7px; CONFIRM SHARED SHOWDOWN; center unobscured yes |
| 768x1024 | playerOne-local-ready | Horizontal scrollbar | html / body | no; scroll/client 768/768px; overflow visible/hidden |
| 768x1024 | playerOne-local-ready | Element wider than window | #clubWheelScreen | 1 content; 13 decoration |
| 768x1024 | playerOne-local-ready | Oversized decoration (crop candidate) | #world | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-local-ready | Oversized decoration (crop candidate) | #world > div.plateBase:nth-of-type(1) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-local-ready | Oversized decoration (crop candidate) | #world > div.seamMend.plateDup:nth-of-type(2) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-local-ready | Oversized decoration (crop candidate) | #covers | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-local-ready | Oversized decoration (crop candidate) | #covers > polygon:nth-of-type(1) | 1526.5px; left/right -379.3/1147.3px |
| 768x1024 | playerOne-local-ready | Oversized decoration (crop candidate) | #covers > polygon:nth-of-type(2) | 1526.5px; left/right -379.3/1147.3px |
| 768x1024 | playerOne-local-ready | Oversized decoration (crop candidate) | #covers > polyline | 1526.5px; left/right -379.3/1147.3px |
| 768x1024 | playerOne-local-ready | Oversized decoration (crop candidate) | #world > div.handContact.plateDup:nth-of-type(6) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-local-ready | Oversized decoration (crop candidate) | #world > div.handCore.plateDup:nth-of-type(7) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-local-ready | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(8) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-local-ready | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(9) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-local-ready | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(10) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-local-ready | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(11) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-local-ready | Wider than window | #clubWheelScreenScreenTitle | 778.3px; left/right -28.9/749.5px |
| 768x1024 | playerOne-local-ready | Touch control <44px | #clubWheelScreen | 0 of 2 visible controls |
| 768x1024 | playerOne-local-ready | Text scrollWidth > clientWidth | #clubWheelScreen | 2 candidates |
| 768x1024 | playerOne-local-ready | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 408>341px; overflow-x visible; glyph range outside no; ? |
| 768x1024 | playerOne-local-ready | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 408>341px; overflow-x visible; glyph range outside no; ? |
| 768x1024 | playerOne-local-ready | Content outside viewport / ancestor crop | #clubCardOne > span.clubRevealIndex | top/bottom 738.1/766; left/right -212.8/-185.1px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-local-ready | Content outside viewport / ancestor crop | #clubPlayerOne | top/bottom 732.7/769.4; left/right -172.8/-100.3px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-local-ready | Content outside viewport / ancestor crop | #clubCardOne > div.clubPackStage:nth-of-type(2) > div.clubCardFace:nth-of-type(2) > span.clubCardEyebrow:nth-of-type(2) | top/bottom 770/789.2; left/right -212.8/-106.5px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-local-ready | Content outside viewport / ancestor crop | #clubCardOne > div.clubPackStage:nth-of-type(2) > div.clubCardFace:nth-of-type(2) > span.clubCardLabel:nth-of-type(3) | top/bottom 770/789.2; left/right -90.5/51.1px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-local-ready | Content outside viewport / ancestor crop | #clubNameOne | top/bottom 789.2/832.5; left/right -212.8/128px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-local-ready | Content outside viewport / ancestor crop | #clubCardStateOne | top/bottom 832.5/851.7; left/right -212.8/128px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-local-ready | Content outside viewport / ancestor crop | #clubPlayerTwo | top/bottom 732.7/769.4; left/right 770.6/808.8px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-local-ready | Content outside viewport / ancestor crop | #clubCardTwo > div.clubPackStage:nth-of-type(2) > div.clubCardFace:nth-of-type(2) > span.clubCardEyebrow:nth-of-type(2) | top/bottom 770/789.2; left/right 730.6/836.9px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-local-ready | Content outside viewport / ancestor crop | #clubCardTwo > div.clubPackStage:nth-of-type(2) > div.clubCardFace:nth-of-type(2) > span.clubCardLabel:nth-of-type(3) | top/bottom 770/789.2; left/right 852.9/994.5px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-local-ready | Content outside viewport / ancestor crop | #clubNameTwo | top/bottom 789.2/832.5; left/right 730.6/1071.4px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-local-ready | Content outside viewport / ancestor crop | #clubCardStateTwo | top/bottom 832.5/851.7; left/right 730.6/1071.4px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-local-ready | Content outside viewport / ancestor crop | #clubAssignmentBack | top/bottom 890.1/964.7; left/right 530.6/797.1px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-local-ready | Primary action in first screenful | #openClubPack | yes; 533.1×74.6px; top/bottom 890.1/964.7px; OPEN SHOWDOWN PACKS; disabled; center unobscured yes |
| 768x1024 | playerOne-local-opening | Horizontal scrollbar | html / body | no; scroll/client 768/768px; overflow visible/hidden |
| 768x1024 | playerOne-local-opening | Element wider than window | #clubWheelScreen | 1 content; 13 decoration |
| 768x1024 | playerOne-local-opening | Oversized decoration (crop candidate) | #world | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-local-opening | Oversized decoration (crop candidate) | #world > div.plateBase:nth-of-type(1) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-local-opening | Oversized decoration (crop candidate) | #world > div.seamMend.plateDup:nth-of-type(2) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-local-opening | Oversized decoration (crop candidate) | #covers | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-local-opening | Oversized decoration (crop candidate) | #covers > polygon:nth-of-type(5) | 1526.5px; left/right -379.3/1147.3px |
| 768x1024 | playerOne-local-opening | Oversized decoration (crop candidate) | #covers > polygon:nth-of-type(6) | 1526.5px; left/right -379.3/1147.3px |
| 768x1024 | playerOne-local-opening | Oversized decoration (crop candidate) | #covers > polyline | 1526.5px; left/right -379.3/1147.3px |
| 768x1024 | playerOne-local-opening | Oversized decoration (crop candidate) | #world > div.handContact.plateDup:nth-of-type(6) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-local-opening | Oversized decoration (crop candidate) | #world > div.handCore.plateDup:nth-of-type(7) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-local-opening | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(8) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-local-opening | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(9) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-local-opening | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(10) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-local-opening | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(11) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-local-opening | Wider than window | #clubWheelScreenScreenTitle | 778.3px; left/right -28.9/749.5px |
| 768x1024 | playerOne-local-opening | Touch control <44px | #clubWheelScreen | 0 of 1 visible controls |
| 768x1024 | playerOne-local-opening | Text scrollWidth > clientWidth | #clubWheelScreen | 2 candidates |
| 768x1024 | playerOne-local-opening | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 408>341px; overflow-x visible; glyph range outside no; ? |
| 768x1024 | playerOne-local-opening | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 408>341px; overflow-x visible; glyph range outside no; ? |
| 768x1024 | playerOne-local-opening | Content outside viewport / ancestor crop | #clubCardOne > span.clubRevealIndex | top/bottom 738.1/766; left/right -212.8/-185.1px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-local-opening | Content outside viewport / ancestor crop | #clubPlayerOne | top/bottom 732.7/769.4; left/right -172.8/-100.3px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-local-opening | Content outside viewport / ancestor crop | #clubCardOne > div.clubPackStage.is-anticipating:nth-of-type(2) > div.clubCardFace:nth-of-type(2) > span.clubCardEyebrow:nth-of-type(2) | top/bottom 770/789.2; left/right -212.8/-106.5px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-local-opening | Content outside viewport / ancestor crop | #clubCardOne > div.clubPackStage.is-anticipating:nth-of-type(2) > div.clubCardFace:nth-of-type(2) > span.clubCardLabel:nth-of-type(3) | top/bottom 770/789.2; left/right -90.5/51.1px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-local-opening | Content outside viewport / ancestor crop | #clubNameOne | top/bottom 789.2/832.5; left/right -212.8/128px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-local-opening | Content outside viewport / ancestor crop | #clubCardStateOne | top/bottom 832.5/851.7; left/right -212.8/128px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-local-opening | Content outside viewport / ancestor crop | #clubPlayerTwo | top/bottom 732.7/769.4; left/right 770.6/808.8px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-local-opening | Content outside viewport / ancestor crop | #clubCardTwo > div.clubPackStage:nth-of-type(2) > div.clubCardFace:nth-of-type(2) > span.clubCardEyebrow:nth-of-type(2) | top/bottom 770/789.2; left/right 730.6/836.9px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-local-opening | Content outside viewport / ancestor crop | #clubCardTwo > div.clubPackStage:nth-of-type(2) > div.clubCardFace:nth-of-type(2) > span.clubCardLabel:nth-of-type(3) | top/bottom 770/789.2; left/right 852.9/994.5px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-local-opening | Content outside viewport / ancestor crop | #clubNameTwo | top/bottom 789.2/832.5; left/right 730.6/1071.4px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-local-opening | Content outside viewport / ancestor crop | #clubCardStateTwo | top/bottom 832.5/851.7; left/right 730.6/1071.4px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-local-opening | Primary action in first screenful | #openClubPack | yes; 533.1×74.6px; top/bottom 890.1/964.7px; DRAW LOCKED...; disabled; center unobscured yes |
| 768x1024 | playerOne-local-manager-one | Horizontal scrollbar | html / body | no; scroll/client 768/768px; overflow visible/hidden |
| 768x1024 | playerOne-local-manager-one | Element wider than window | #clubWheelScreen | 1 content; 22 decoration |
| 768x1024 | playerOne-local-manager-one | Oversized decoration (crop candidate) | #world | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-local-manager-one | Oversized decoration (crop candidate) | #world > div.plateBase:nth-of-type(1) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-local-manager-one | Oversized decoration (crop candidate) | #world > div.seamMend.plateDup:nth-of-type(2) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-local-manager-one | Oversized decoration (crop candidate) | #covers | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-local-manager-one | Oversized decoration (crop candidate) | #covers > polygon:nth-of-type(1) | 1526.5px; left/right -379.3/1147.3px |
| 768x1024 | playerOne-local-manager-one | Oversized decoration (crop candidate) | #covers > polygon:nth-of-type(2) | 1526.5px; left/right -379.3/1147.3px |
| 768x1024 | playerOne-local-manager-one | Oversized decoration (crop candidate) | #covers > polyline | 1526.5px; left/right -379.3/1147.3px |
| 768x1024 | playerOne-local-manager-one | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-local-manager-one | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > svg.rvDark:nth-of-type(1) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-local-manager-one | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > svg.rvHole:nth-of-type(2) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-local-manager-one | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > svg.rvEdge:nth-of-type(3) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-local-manager-one | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > svg.rvBurst:nth-of-type(4) | 1887.9px; left/right -546.5/1341.4px |
| 768x1024 | playerOne-local-manager-one | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > svg.rvVoid:nth-of-type(5) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-local-manager-one | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > div.rvHalf.rvHalfLeft.plateDup:nth-of-type(2) | 1939.6px; left/right -608.8/1330.8px |
| 768x1024 | playerOne-local-manager-one | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > div.rvHalf.rvHalfRight.plateDup:nth-of-type(3) | 1939.6px; left/right -570.1/1369.5px |
| 768x1024 | playerOne-local-manager-one | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > div.rvFlap.plateDup:nth-of-type(5) | 1474.8px; left/right -414.3/1060.5px |
| 768x1024 | playerOne-local-manager-one | Oversized decoration (crop candidate) | #world > div.handContact.plateDup:nth-of-type(6) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-local-manager-one | Oversized decoration (crop candidate) | #world > div.handCore.plateDup:nth-of-type(7) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-local-manager-one | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(8) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-local-manager-one | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(9) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-local-manager-one | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(10) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-local-manager-one | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(11) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-local-manager-one | Wider than window | #clubWheelScreenScreenTitle | 778.3px; left/right -28.9/749.5px |
| 768x1024 | playerOne-local-manager-one | Touch control <44px | #clubWheelScreen | 0 of 1 visible controls |
| 768x1024 | playerOne-local-manager-one | Text scrollWidth > clientWidth | #clubWheelScreen | 2 candidates |
| 768x1024 | playerOne-local-manager-one | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 408>341px; overflow-x visible; glyph range outside no; Osasuna |
| 768x1024 | playerOne-local-manager-one | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 408>341px; overflow-x visible; glyph range outside no; ? |
| 768x1024 | playerOne-local-manager-one | Content outside viewport / ancestor crop | #clubCardOne > span.clubRevealIndex | top/bottom 738.1/766; left/right -212.8/-185.1px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-local-manager-one | Content outside viewport / ancestor crop | #clubPlayerOne | top/bottom 732.7/769.4; left/right -172.8/-100.3px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-local-manager-one | Content outside viewport / ancestor crop | #clubCardOne > div.clubPackStage:nth-of-type(2) > div.clubCardFace:nth-of-type(2) > span.clubCardEyebrow:nth-of-type(2) | top/bottom 770/789.2; left/right -212.8/-106.5px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-local-manager-one | Content outside viewport / ancestor crop | #clubCardOne > div.clubPackStage:nth-of-type(2) > div.clubCardFace:nth-of-type(2) > span.clubCardLabel:nth-of-type(3) | top/bottom 770/789.2; left/right -90.5/51.1px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-local-manager-one | Content outside viewport / ancestor crop | #clubNameOne | top/bottom 789.2/832.6; left/right -213.1/128.3px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-local-manager-one | Content outside viewport / ancestor crop | #clubCardStateOne | top/bottom 832.5/851.7; left/right -212.8/128px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-local-manager-one | Content outside viewport / ancestor crop | #clubPlayerTwo | top/bottom 732.7/769.4; left/right 770.6/808.8px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-local-manager-one | Content outside viewport / ancestor crop | #clubCardTwo > div.clubPackStage.is-anticipating:nth-of-type(2) > div.clubCardFace:nth-of-type(2) > span.clubCardEyebrow:nth-of-type(2) | top/bottom 770/789.2; left/right 730.6/836.9px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-local-manager-one | Content outside viewport / ancestor crop | #clubCardTwo > div.clubPackStage.is-anticipating:nth-of-type(2) > div.clubCardFace:nth-of-type(2) > span.clubCardLabel:nth-of-type(3) | top/bottom 770/789.2; left/right 852.9/994.5px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-local-manager-one | Content outside viewport / ancestor crop | #clubNameTwo | top/bottom 789.2/832.5; left/right 730.6/1071.4px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-local-manager-one | Content outside viewport / ancestor crop | #clubCardStateTwo | top/bottom 832.5/851.7; left/right 730.6/1071.4px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-local-manager-one | Primary action in first screenful | #openClubPack | yes; 533.1×74.6px; top/bottom 890.1/964.7px; DRAW LOCKED...; disabled; center unobscured yes |
| 768x1024 | playerOne-local-manager-two | Horizontal scrollbar | html / body | no; scroll/client 768/768px; overflow visible/hidden |
| 768x1024 | playerOne-local-manager-two | Element wider than window | #clubWheelScreen | 1 content; 28 decoration |
| 768x1024 | playerOne-local-manager-two | Oversized decoration (crop candidate) | #world | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-local-manager-two | Oversized decoration (crop candidate) | #world > div.plateBase:nth-of-type(1) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-local-manager-two | Oversized decoration (crop candidate) | #world > div.seamMend.plateDup:nth-of-type(2) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-local-manager-two | Oversized decoration (crop candidate) | #covers | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-local-manager-two | Oversized decoration (crop candidate) | #covers > polygon:nth-of-type(1) | 1526.5px; left/right -379.3/1147.3px |
| 768x1024 | playerOne-local-manager-two | Oversized decoration (crop candidate) | #covers > polygon:nth-of-type(2) | 1526.5px; left/right -379.3/1147.3px |
| 768x1024 | playerOne-local-manager-two | Oversized decoration (crop candidate) | #covers > polyline | 1526.5px; left/right -379.3/1147.3px |
| 768x1024 | playerOne-local-manager-two | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-local-manager-two | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > svg.rvDark:nth-of-type(1) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-local-manager-two | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > svg.rvHole:nth-of-type(2) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-local-manager-two | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > svg.rvEdge:nth-of-type(3) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-local-manager-two | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > svg.rvBurst:nth-of-type(4) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-local-manager-two | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > svg.rvVoid:nth-of-type(5) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-local-manager-two | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-local-manager-two | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > svg.rvDark:nth-of-type(1) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-local-manager-two | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > svg.rvHole:nth-of-type(2) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-local-manager-two | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > svg.rvEdge:nth-of-type(3) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-local-manager-two | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > svg.rvBurst:nth-of-type(4) | 1883.4px; left/right -570.1/1313.3px |
| 768x1024 | playerOne-local-manager-two | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > svg.rvVoid:nth-of-type(5) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-local-manager-two | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > div.rvHalf.rvHalfLeft.plateDup:nth-of-type(2) | 1948.9px; left/right -606.8/1342.1px |
| 768x1024 | playerOne-local-manager-two | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > div.rvHalf.rvHalfRight.plateDup:nth-of-type(3) | 1948.9px; left/right -565.2/1383.6px |
| 768x1024 | playerOne-local-manager-two | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > div.rvFlap.plateDup:nth-of-type(5) | 1320.4px; left/right -210.9/1109.6px |
| 768x1024 | playerOne-local-manager-two | Oversized decoration (crop candidate) | #world > div.handContact.plateDup:nth-of-type(6) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-local-manager-two | Oversized decoration (crop candidate) | #world > div.handCore.plateDup:nth-of-type(7) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-local-manager-two | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(8) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-local-manager-two | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(9) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-local-manager-two | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(10) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-local-manager-two | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(11) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-local-manager-two | Wider than window | #clubWheelScreenScreenTitle | 778.3px; left/right -28.9/749.5px |
| 768x1024 | playerOne-local-manager-two | Touch control <44px | #clubWheelScreen | 0 of 1 visible controls |
| 768x1024 | playerOne-local-manager-two | Text scrollWidth > clientWidth | #clubWheelScreen | 2 candidates |
| 768x1024 | playerOne-local-manager-two | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 408>341px; overflow-x visible; glyph range outside no; Osasuna |
| 768x1024 | playerOne-local-manager-two | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 408>341px; overflow-x visible; glyph range outside no; Espanyol |
| 768x1024 | playerOne-local-manager-two | Content outside viewport / ancestor crop | #clubCardOne > span.clubRevealIndex | top/bottom 738.1/766; left/right -212.8/-185.1px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-local-manager-two | Content outside viewport / ancestor crop | #clubPlayerOne | top/bottom 732.7/769.4; left/right -172.8/-100.3px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-local-manager-two | Content outside viewport / ancestor crop | #clubCardOne > div.clubPackStage:nth-of-type(2) > div.clubCardFace:nth-of-type(2) > span.clubCardEyebrow:nth-of-type(2) | top/bottom 770/789.2; left/right -212.8/-106.5px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-local-manager-two | Content outside viewport / ancestor crop | #clubCardOne > div.clubPackStage:nth-of-type(2) > div.clubCardFace:nth-of-type(2) > span.clubCardLabel:nth-of-type(3) | top/bottom 770/789.2; left/right -90.5/51.1px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-local-manager-two | Content outside viewport / ancestor crop | #clubNameOne | top/bottom 789.2/832.5; left/right -212.8/128px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-local-manager-two | Content outside viewport / ancestor crop | #clubCardStateOne | top/bottom 832.5/851.7; left/right -212.8/128px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-local-manager-two | Content outside viewport / ancestor crop | #clubPlayerTwo | top/bottom 732.7/769.4; left/right 770.6/808.8px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-local-manager-two | Content outside viewport / ancestor crop | #clubCardTwo > div.clubPackStage:nth-of-type(2) > div.clubCardFace:nth-of-type(2) > span.clubCardEyebrow:nth-of-type(2) | top/bottom 770/789.2; left/right 730.6/836.9px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-local-manager-two | Content outside viewport / ancestor crop | #clubCardTwo > div.clubPackStage:nth-of-type(2) > div.clubCardFace:nth-of-type(2) > span.clubCardLabel:nth-of-type(3) | top/bottom 770/789.2; left/right 852.9/994.5px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-local-manager-two | Content outside viewport / ancestor crop | #clubNameTwo | top/bottom 789.2/832.5; left/right 730.5/1071.5px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-local-manager-two | Content outside viewport / ancestor crop | #clubCardStateTwo | top/bottom 832.5/851.7; left/right 730.6/1071.4px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-local-manager-two | Primary action in first screenful | #openClubPack | yes; 533.1×74.6px; top/bottom 890.1/964.7px; DRAW LOCKED...; disabled; center unobscured yes |
| 768x1024 | playerOne-local-versus | Horizontal scrollbar | html / body | no; scroll/client 768/768px; overflow visible/hidden |
| 768x1024 | playerOne-local-versus | Element wider than window | #clubWheelScreen | 1 content; 25 decoration |
| 768x1024 | playerOne-local-versus | Oversized decoration (crop candidate) | #world | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-local-versus | Oversized decoration (crop candidate) | #world > div.plateBase:nth-of-type(1) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-local-versus | Oversized decoration (crop candidate) | #world > div.seamMend.plateDup:nth-of-type(2) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-local-versus | Oversized decoration (crop candidate) | #covers | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-local-versus | Oversized decoration (crop candidate) | #covers > polygon:nth-of-type(1) | 1526.5px; left/right -379.3/1147.3px |
| 768x1024 | playerOne-local-versus | Oversized decoration (crop candidate) | #covers > polygon:nth-of-type(2) | 1526.5px; left/right -379.3/1147.3px |
| 768x1024 | playerOne-local-versus | Oversized decoration (crop candidate) | #covers > polyline | 1526.5px; left/right -379.3/1147.3px |
| 768x1024 | playerOne-local-versus | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-local-versus | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > svg.rvDark:nth-of-type(1) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-local-versus | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > svg.rvHole:nth-of-type(2) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-local-versus | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > svg.rvEdge:nth-of-type(3) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-local-versus | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > svg.rvBurst:nth-of-type(4) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-local-versus | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > svg.rvVoid:nth-of-type(5) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-local-versus | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-local-versus | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > svg.rvDark:nth-of-type(1) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-local-versus | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > svg.rvHole:nth-of-type(2) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-local-versus | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > svg.rvEdge:nth-of-type(3) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-local-versus | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > svg.rvBurst:nth-of-type(4) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-local-versus | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > svg.rvVoid:nth-of-type(5) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-local-versus | Oversized decoration (crop candidate) | #world > div.handContact.plateDup:nth-of-type(6) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-local-versus | Oversized decoration (crop candidate) | #world > div.handCore.plateDup:nth-of-type(7) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-local-versus | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(8) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-local-versus | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(9) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-local-versus | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(10) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-local-versus | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(11) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-local-versus | Wider than window | #clubWheelScreenScreenTitle | 778.3px; left/right -28.9/749.5px |
| 768x1024 | playerOne-local-versus | Touch control <44px | #clubWheelScreen | 0 of 0 visible controls |
| 768x1024 | playerOne-local-versus | Text scrollWidth > clientWidth | #clubWheelScreen | 3 candidates |
| 768x1024 | playerOne-local-versus | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 408>341px; overflow-x visible; glyph range outside no; Osasuna |
| 768x1024 | playerOne-local-versus | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 408>341px; overflow-x visible; glyph range outside no; Espanyol |
| 768x1024 | playerOne-local-versus | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 148>140px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 768x1024 | playerOne-local-versus | Content outside viewport / ancestor crop | #clubCardOne > span.clubRevealIndex | top/bottom 738.1/766; left/right -212.8/-185.1px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-local-versus | Content outside viewport / ancestor crop | #clubPlayerOne | top/bottom 732.7/769.4; left/right -172.8/-100.3px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-local-versus | Content outside viewport / ancestor crop | #clubCardOne > div.clubPackStage:nth-of-type(2) > div.clubCardFace:nth-of-type(2) > span.clubCardEyebrow:nth-of-type(2) | top/bottom 770/789.2; left/right -212.8/-106.5px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-local-versus | Content outside viewport / ancestor crop | #clubCardOne > div.clubPackStage:nth-of-type(2) > div.clubCardFace:nth-of-type(2) > span.clubCardLabel:nth-of-type(3) | top/bottom 770/789.2; left/right -90.5/51.1px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-local-versus | Content outside viewport / ancestor crop | #clubNameOne | top/bottom 789.2/832.5; left/right -212.8/128px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-local-versus | Content outside viewport / ancestor crop | #clubCardStateOne | top/bottom 832.5/851.7; left/right -212.8/128px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-local-versus | Content outside viewport / ancestor crop | #clubPlayerTwo | top/bottom 732.7/769.4; left/right 770.6/808.8px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-local-versus | Content outside viewport / ancestor crop | #clubCardTwo > div.clubPackStage:nth-of-type(2) > div.clubCardFace:nth-of-type(2) > span.clubCardEyebrow:nth-of-type(2) | top/bottom 770/789.2; left/right 730.6/836.9px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-local-versus | Content outside viewport / ancestor crop | #clubCardTwo > div.clubPackStage:nth-of-type(2) > div.clubCardFace:nth-of-type(2) > span.clubCardLabel:nth-of-type(3) | top/bottom 770/789.2; left/right 852.9/994.5px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-local-versus | Content outside viewport / ancestor crop | #clubNameTwo | top/bottom 789.2/832.5; left/right 730.6/1071.4px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-local-versus | Content outside viewport / ancestor crop | #clubCardStateTwo | top/bottom 832.5/851.7; left/right 730.6/1071.4px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-local-versus | Primary action in first screenful | none | N/A no visible action |
| 768x1024 | playerOne-local-confirmation | Horizontal scrollbar | html / body | no; scroll/client 768/768px; overflow visible/hidden |
| 768x1024 | playerOne-local-confirmation | Element wider than window | #clubWheelScreen | 1 content; 25 decoration |
| 768x1024 | playerOne-local-confirmation | Oversized decoration (crop candidate) | #world | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-local-confirmation | Oversized decoration (crop candidate) | #world > div.plateBase:nth-of-type(1) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-local-confirmation | Oversized decoration (crop candidate) | #world > div.seamMend.plateDup:nth-of-type(2) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-local-confirmation | Oversized decoration (crop candidate) | #covers | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-local-confirmation | Oversized decoration (crop candidate) | #covers > polygon:nth-of-type(1) | 1526.5px; left/right -379.3/1147.3px |
| 768x1024 | playerOne-local-confirmation | Oversized decoration (crop candidate) | #covers > polygon:nth-of-type(2) | 1526.5px; left/right -379.3/1147.3px |
| 768x1024 | playerOne-local-confirmation | Oversized decoration (crop candidate) | #covers > polyline | 1526.5px; left/right -379.3/1147.3px |
| 768x1024 | playerOne-local-confirmation | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-local-confirmation | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > svg.rvDark:nth-of-type(1) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-local-confirmation | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > svg.rvHole:nth-of-type(2) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-local-confirmation | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > svg.rvEdge:nth-of-type(3) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-local-confirmation | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > svg.rvBurst:nth-of-type(4) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-local-confirmation | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > svg.rvVoid:nth-of-type(5) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-local-confirmation | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-local-confirmation | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > svg.rvDark:nth-of-type(1) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-local-confirmation | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > svg.rvHole:nth-of-type(2) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-local-confirmation | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > svg.rvEdge:nth-of-type(3) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-local-confirmation | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > svg.rvBurst:nth-of-type(4) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-local-confirmation | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > svg.rvVoid:nth-of-type(5) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-local-confirmation | Oversized decoration (crop candidate) | #world > div.handContact.plateDup:nth-of-type(6) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-local-confirmation | Oversized decoration (crop candidate) | #world > div.handCore.plateDup:nth-of-type(7) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-local-confirmation | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(8) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-local-confirmation | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(9) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-local-confirmation | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(10) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-local-confirmation | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(11) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-local-confirmation | Wider than window | #clubWheelScreenScreenTitle | 778.3px; left/right -28.9/749.5px |
| 768x1024 | playerOne-local-confirmation | Touch control <44px | #clubWheelScreen | 0 of 1 visible controls |
| 768x1024 | playerOne-local-confirmation | Text scrollWidth > clientWidth | #clubWheelScreen | 3 candidates |
| 768x1024 | playerOne-local-confirmation | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 408>341px; overflow-x visible; glyph range outside no; Osasuna |
| 768x1024 | playerOne-local-confirmation | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 408>341px; overflow-x visible; glyph range outside no; Espanyol |
| 768x1024 | playerOne-local-confirmation | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 148>140px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 768x1024 | playerOne-local-confirmation | Content outside viewport / ancestor crop | #clubCardOne > span.clubRevealIndex | top/bottom 738.1/766; left/right -212.8/-185.1px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-local-confirmation | Content outside viewport / ancestor crop | #clubPlayerOne | top/bottom 732.7/769.4; left/right -172.8/-100.3px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-local-confirmation | Content outside viewport / ancestor crop | #clubCardOne > div.clubPackStage:nth-of-type(2) > div.clubCardFace:nth-of-type(2) > span.clubCardEyebrow:nth-of-type(2) | top/bottom 770/789.2; left/right -212.8/-106.5px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-local-confirmation | Content outside viewport / ancestor crop | #clubCardOne > div.clubPackStage:nth-of-type(2) > div.clubCardFace:nth-of-type(2) > span.clubCardLabel:nth-of-type(3) | top/bottom 770/789.2; left/right -90.5/51.1px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-local-confirmation | Content outside viewport / ancestor crop | #clubNameOne | top/bottom 789.2/832.5; left/right -212.8/128px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-local-confirmation | Content outside viewport / ancestor crop | #clubCardStateOne | top/bottom 832.5/851.7; left/right -212.8/128px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-local-confirmation | Content outside viewport / ancestor crop | #clubPlayerTwo | top/bottom 732.7/769.4; left/right 770.6/808.8px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-local-confirmation | Content outside viewport / ancestor crop | #clubCardTwo > div.clubPackStage:nth-of-type(2) > div.clubCardFace:nth-of-type(2) > span.clubCardEyebrow:nth-of-type(2) | top/bottom 770/789.2; left/right 730.6/836.9px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-local-confirmation | Content outside viewport / ancestor crop | #clubCardTwo > div.clubPackStage:nth-of-type(2) > div.clubCardFace:nth-of-type(2) > span.clubCardLabel:nth-of-type(3) | top/bottom 770/789.2; left/right 852.9/994.5px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-local-confirmation | Content outside viewport / ancestor crop | #clubNameTwo | top/bottom 789.2/832.5; left/right 730.6/1071.4px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-local-confirmation | Content outside viewport / ancestor crop | #clubCardStateTwo | top/bottom 832.5/851.7; left/right 730.6/1071.4px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-local-confirmation | Primary action in first screenful | #continueClubAssignment | yes; 693×74.6px; top/bottom 889.1/963.7px; CONFIRM RIVALRY & START SHOWDOWN; center unobscured yes |
| 768x1024 | playerTwo-sealed | Horizontal scrollbar | html / body | no; scroll/client 768/768px; overflow visible/hidden |
| 768x1024 | playerTwo-sealed | Element wider than window | #clubWheelScreen | 1 content; 13 decoration |
| 768x1024 | playerTwo-sealed | Oversized decoration (crop candidate) | #world | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-sealed | Oversized decoration (crop candidate) | #world > div.plateBase:nth-of-type(1) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-sealed | Oversized decoration (crop candidate) | #world > div.seamMend.plateDup:nth-of-type(2) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-sealed | Oversized decoration (crop candidate) | #covers | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-sealed | Oversized decoration (crop candidate) | #covers > polygon:nth-of-type(1) | 1526.5px; left/right -379.3/1147.3px |
| 768x1024 | playerTwo-sealed | Oversized decoration (crop candidate) | #covers > polygon:nth-of-type(2) | 1526.5px; left/right -379.3/1147.3px |
| 768x1024 | playerTwo-sealed | Oversized decoration (crop candidate) | #covers > polyline | 1526.5px; left/right -379.3/1147.3px |
| 768x1024 | playerTwo-sealed | Oversized decoration (crop candidate) | #world > div.handContact.plateDup:nth-of-type(6) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-sealed | Oversized decoration (crop candidate) | #world > div.handCore.plateDup:nth-of-type(7) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-sealed | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(8) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-sealed | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(9) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-sealed | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(10) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-sealed | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(11) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-sealed | Wider than window | #clubWheelScreenScreenTitle | 778.3px; left/right -28.9/749.5px |
| 768x1024 | playerTwo-sealed | Touch control <44px | #clubWheelScreen | 0 of 1 visible controls |
| 768x1024 | playerTwo-sealed | Text scrollWidth > clientWidth | #clubWheelScreen | 0 candidates |
| 768x1024 | playerTwo-sealed | Content outside viewport / ancestor crop | #clubPackStatus | top/bottom 314.4/339.3; left/right 394.9/918.7px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerTwo-sealed | Primary action in first screenful | #openClubPack | yes; 533.1×74.6px; top/bottom 890.1/964.7px; WAITING FOR HOST PACK REVEAL; disabled; center unobscured yes |
| 768x1024 | playerTwo-opening | Horizontal scrollbar | html / body | no; scroll/client 768/768px; overflow visible/hidden |
| 768x1024 | playerTwo-opening | Element wider than window | #clubWheelScreen | 1 content; 13 decoration |
| 768x1024 | playerTwo-opening | Oversized decoration (crop candidate) | #world | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-opening | Oversized decoration (crop candidate) | #world > div.plateBase:nth-of-type(1) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-opening | Oversized decoration (crop candidate) | #world > div.seamMend.plateDup:nth-of-type(2) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-opening | Oversized decoration (crop candidate) | #covers | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-opening | Oversized decoration (crop candidate) | #covers > polygon:nth-of-type(5) | 1526.5px; left/right -379.3/1147.3px |
| 768x1024 | playerTwo-opening | Oversized decoration (crop candidate) | #covers > polygon:nth-of-type(6) | 1526.5px; left/right -379.3/1147.3px |
| 768x1024 | playerTwo-opening | Oversized decoration (crop candidate) | #covers > polyline | 1526.5px; left/right -379.3/1147.3px |
| 768x1024 | playerTwo-opening | Oversized decoration (crop candidate) | #world > div.handContact.plateDup:nth-of-type(6) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-opening | Oversized decoration (crop candidate) | #world > div.handCore.plateDup:nth-of-type(7) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-opening | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(8) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-opening | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(9) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-opening | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(10) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-opening | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(11) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-opening | Wider than window | #clubWheelScreenScreenTitle | 778.3px; left/right -28.9/749.5px |
| 768x1024 | playerTwo-opening | Touch control <44px | #clubWheelScreen | 0 of 0 visible controls |
| 768x1024 | playerTwo-opening | Text scrollWidth > clientWidth | #clubWheelScreen | 0 candidates |
| 768x1024 | playerTwo-opening | Content outside viewport / ancestor crop | #clubCardOne > span.clubRevealIndex | top/bottom 738.1/766; left/right -212.8/-185.1px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerTwo-opening | Content outside viewport / ancestor crop | #clubPlayerOne | top/bottom 732.7/769.4; left/right -172.8/-100.3px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerTwo-opening | Content outside viewport / ancestor crop | #clubCardOne > div.clubPackStage.is-anticipating:nth-of-type(2) > div.clubCardFace:nth-of-type(2) > span.clubCardEyebrow:nth-of-type(2) | top/bottom 770/789.2; left/right -212.8/-106.5px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerTwo-opening | Content outside viewport / ancestor crop | #clubCardOne > div.clubPackStage.is-anticipating:nth-of-type(2) > div.clubCardFace:nth-of-type(2) > span.clubCardLabel:nth-of-type(3) | top/bottom 770/789.2; left/right -90.5/51.1px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerTwo-opening | Content outside viewport / ancestor crop | #clubNameOne | top/bottom 789.2/832.5; left/right -212.8/128px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerTwo-opening | Content outside viewport / ancestor crop | #clubCardStateOne | top/bottom 832.5/851.7; left/right -212.8/128px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerTwo-opening | Content outside viewport / ancestor crop | #clubPlayerTwo | top/bottom 732.7/769.4; left/right 770.6/808.8px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerTwo-opening | Content outside viewport / ancestor crop | #clubCardTwo > div.clubPackStage:nth-of-type(2) > div.clubCardFace:nth-of-type(2) > span.clubCardEyebrow:nth-of-type(2) | top/bottom 770/789.2; left/right 730.6/836.9px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerTwo-opening | Content outside viewport / ancestor crop | #clubCardTwo > div.clubPackStage:nth-of-type(2) > div.clubCardFace:nth-of-type(2) > span.clubCardLabel:nth-of-type(3) | top/bottom 770/789.2; left/right 852.9/994.5px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerTwo-opening | Content outside viewport / ancestor crop | #clubNameTwo | top/bottom 789.2/832.5; left/right 730.6/1071.4px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerTwo-opening | Content outside viewport / ancestor crop | #clubCardStateTwo | top/bottom 832.5/851.7; left/right 730.6/1071.4px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerTwo-opening | Primary action in first screenful | none | N/A no visible action |
| 768x1024 | playerTwo-manager-one | Horizontal scrollbar | html / body | no; scroll/client 768/768px; overflow visible/hidden |
| 768x1024 | playerTwo-manager-one | Element wider than window | #clubWheelScreen | 1 content; 17 decoration |
| 768x1024 | playerTwo-manager-one | Oversized decoration (crop candidate) | #world | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-manager-one | Oversized decoration (crop candidate) | #world > div.plateBase:nth-of-type(1) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-manager-one | Oversized decoration (crop candidate) | #world > div.seamMend.plateDup:nth-of-type(2) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-manager-one | Oversized decoration (crop candidate) | #covers | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-manager-one | Oversized decoration (crop candidate) | #covers > polygon:nth-of-type(1) | 1526.5px; left/right -379.3/1147.3px |
| 768x1024 | playerTwo-manager-one | Oversized decoration (crop candidate) | #covers > polygon:nth-of-type(2) | 1526.5px; left/right -379.3/1147.3px |
| 768x1024 | playerTwo-manager-one | Oversized decoration (crop candidate) | #covers > polyline | 1526.5px; left/right -379.3/1147.3px |
| 768x1024 | playerTwo-manager-one | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-manager-one | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > div.rvHalf.rvHalfLeft.plateDup:nth-of-type(2) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-manager-one | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > div.rvHalf.rvHalfRight.plateDup:nth-of-type(3) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-manager-one | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > div.rvFlap.plateDup:nth-of-type(5) | 1846.4px; left/right -536.3/1310.1px |
| 768x1024 | playerTwo-manager-one | Oversized decoration (crop candidate) | #world > div.handContact.plateDup:nth-of-type(6) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-manager-one | Oversized decoration (crop candidate) | #world > div.handCore.plateDup:nth-of-type(7) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-manager-one | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(8) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-manager-one | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(9) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-manager-one | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(10) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-manager-one | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(11) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-manager-one | Wider than window | #clubWheelScreenScreenTitle | 778.3px; left/right -28.9/749.5px |
| 768x1024 | playerTwo-manager-one | Touch control <44px | #clubWheelScreen | 0 of 0 visible controls |
| 768x1024 | playerTwo-manager-one | Text scrollWidth > clientWidth | #clubWheelScreen | 1 candidates |
| 768x1024 | playerTwo-manager-one | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span | 184>140px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 768x1024 | playerTwo-manager-one | Content outside viewport / ancestor crop | #clubCardOne > span.clubRevealIndex | top/bottom 738.1/766; left/right -212.8/-185.1px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerTwo-manager-one | Content outside viewport / ancestor crop | #clubPlayerOne | top/bottom 732.7/769.4; left/right -172.8/-100.3px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerTwo-manager-one | Content outside viewport / ancestor crop | #clubCardOne > div.clubPackStage:nth-of-type(2) > div.clubCardFace:nth-of-type(2) > span.clubCardEyebrow:nth-of-type(2) | top/bottom 770/789.2; left/right -212.8/-106.5px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerTwo-manager-one | Content outside viewport / ancestor crop | #clubCardOne > div.clubPackStage:nth-of-type(2) > div.clubCardFace:nth-of-type(2) > span.clubCardLabel:nth-of-type(3) | top/bottom 770/789.2; left/right -90.5/51.1px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerTwo-manager-one | Content outside viewport / ancestor crop | #clubCardStateOne | top/bottom 832.5/851.7; left/right -212.8/128px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerTwo-manager-one | Content outside viewport / ancestor crop | #clubPlayerTwo | top/bottom 732.7/769.4; left/right 770.6/808.8px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerTwo-manager-one | Content outside viewport / ancestor crop | #clubCardTwo > div.clubPackStage.is-anticipating:nth-of-type(2) > div.clubCardFace:nth-of-type(2) > span.clubCardEyebrow:nth-of-type(2) | top/bottom 770/789.2; left/right 730.6/836.9px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerTwo-manager-one | Content outside viewport / ancestor crop | #clubCardTwo > div.clubPackStage.is-anticipating:nth-of-type(2) > div.clubCardFace:nth-of-type(2) > span.clubCardLabel:nth-of-type(3) | top/bottom 770/789.2; left/right 852.9/994.5px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerTwo-manager-one | Content outside viewport / ancestor crop | #clubNameTwo | top/bottom 789.2/832.5; left/right 730.6/1071.4px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerTwo-manager-one | Content outside viewport / ancestor crop | #clubCardStateTwo | top/bottom 832.5/851.7; left/right 730.6/1071.4px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerTwo-manager-one | Primary action in first screenful | none | N/A no visible action |
| 768x1024 | playerTwo-manager-two | Horizontal scrollbar | html / body | no; scroll/client 768/768px; overflow visible/hidden |
| 768x1024 | playerTwo-manager-two | Element wider than window | #clubWheelScreen | 1 content; 23 decoration |
| 768x1024 | playerTwo-manager-two | Oversized decoration (crop candidate) | #world | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-manager-two | Oversized decoration (crop candidate) | #world > div.plateBase:nth-of-type(1) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-manager-two | Oversized decoration (crop candidate) | #world > div.seamMend.plateDup:nth-of-type(2) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-manager-two | Oversized decoration (crop candidate) | #covers | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-manager-two | Oversized decoration (crop candidate) | #covers > polygon:nth-of-type(1) | 1526.5px; left/right -379.3/1147.3px |
| 768x1024 | playerTwo-manager-two | Oversized decoration (crop candidate) | #covers > polygon:nth-of-type(2) | 1526.5px; left/right -379.3/1147.3px |
| 768x1024 | playerTwo-manager-two | Oversized decoration (crop candidate) | #covers > polyline | 1526.5px; left/right -379.3/1147.3px |
| 768x1024 | playerTwo-manager-two | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-manager-two | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > svg.rvDark:nth-of-type(1) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-manager-two | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > svg.rvHole:nth-of-type(2) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-manager-two | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > svg.rvEdge:nth-of-type(3) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-manager-two | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > svg.rvBurst:nth-of-type(4) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-manager-two | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > svg.rvVoid:nth-of-type(5) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-manager-two | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-manager-two | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > div.rvHalf.rvHalfLeft.plateDup:nth-of-type(2) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-manager-two | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > div.rvHalf.rvHalfRight.plateDup:nth-of-type(3) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-manager-two | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > div.rvFlap.plateDup:nth-of-type(5) | 1831.9px; left/right -533/1299px |
| 768x1024 | playerTwo-manager-two | Oversized decoration (crop candidate) | #world > div.handContact.plateDup:nth-of-type(6) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-manager-two | Oversized decoration (crop candidate) | #world > div.handCore.plateDup:nth-of-type(7) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-manager-two | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(8) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-manager-two | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(9) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-manager-two | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(10) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-manager-two | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(11) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-manager-two | Wider than window | #clubWheelScreenScreenTitle | 778.3px; left/right -28.9/749.5px |
| 768x1024 | playerTwo-manager-two | Touch control <44px | #clubWheelScreen | 0 of 0 visible controls |
| 768x1024 | playerTwo-manager-two | Text scrollWidth > clientWidth | #clubWheelScreen | 1 candidates |
| 768x1024 | playerTwo-manager-two | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span | 184>140px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 768x1024 | playerTwo-manager-two | Content outside viewport / ancestor crop | #clubCardOne > span.clubRevealIndex | top/bottom 738.1/766; left/right -212.8/-185.1px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerTwo-manager-two | Content outside viewport / ancestor crop | #clubPlayerOne | top/bottom 732.7/769.4; left/right -172.8/-100.3px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerTwo-manager-two | Content outside viewport / ancestor crop | #clubCardOne > div.clubPackStage:nth-of-type(2) > div.clubCardFace:nth-of-type(2) > span.clubCardEyebrow:nth-of-type(2) | top/bottom 770/789.2; left/right -212.8/-106.5px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerTwo-manager-two | Content outside viewport / ancestor crop | #clubCardOne > div.clubPackStage:nth-of-type(2) > div.clubCardFace:nth-of-type(2) > span.clubCardLabel:nth-of-type(3) | top/bottom 770/789.2; left/right -90.5/51.1px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerTwo-manager-two | Content outside viewport / ancestor crop | #clubNameOne | top/bottom 789.2/832.5; left/right -212.8/128px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerTwo-manager-two | Content outside viewport / ancestor crop | #clubCardStateOne | top/bottom 832.5/851.7; left/right -212.8/128px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerTwo-manager-two | Content outside viewport / ancestor crop | #clubPlayerTwo | top/bottom 732.7/769.4; left/right 770.6/808.8px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerTwo-manager-two | Content outside viewport / ancestor crop | #clubCardTwo > div.clubPackStage:nth-of-type(2) > div.clubCardFace:nth-of-type(2) > span.clubCardEyebrow:nth-of-type(2) | top/bottom 770/789.2; left/right 730.6/836.9px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerTwo-manager-two | Content outside viewport / ancestor crop | #clubCardTwo > div.clubPackStage:nth-of-type(2) > div.clubCardFace:nth-of-type(2) > span.clubCardLabel:nth-of-type(3) | top/bottom 770/789.2; left/right 852.9/994.5px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerTwo-manager-two | Content outside viewport / ancestor crop | #clubCardStateTwo | top/bottom 832.5/851.7; left/right 730.6/1071.4px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerTwo-manager-two | Primary action in first screenful | none | N/A no visible action |
| 768x1024 | playerTwo-clubs-locked-awaiting-season | Horizontal scrollbar | html / body | no; scroll/client 768/768px; overflow visible/hidden |
| 768x1024 | playerTwo-clubs-locked-awaiting-season | Element wider than window | #clubWheelScreen | 1 content; 25 decoration |
| 768x1024 | playerTwo-clubs-locked-awaiting-season | Oversized decoration (crop candidate) | #world | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-clubs-locked-awaiting-season | Oversized decoration (crop candidate) | #world > div.plateBase:nth-of-type(1) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-clubs-locked-awaiting-season | Oversized decoration (crop candidate) | #world > div.seamMend.plateDup:nth-of-type(2) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-clubs-locked-awaiting-season | Oversized decoration (crop candidate) | #covers | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-clubs-locked-awaiting-season | Oversized decoration (crop candidate) | #covers > polygon:nth-of-type(1) | 1526.5px; left/right -379.3/1147.3px |
| 768x1024 | playerTwo-clubs-locked-awaiting-season | Oversized decoration (crop candidate) | #covers > polygon:nth-of-type(2) | 1526.5px; left/right -379.3/1147.3px |
| 768x1024 | playerTwo-clubs-locked-awaiting-season | Oversized decoration (crop candidate) | #covers > polyline | 1526.5px; left/right -379.3/1147.3px |
| 768x1024 | playerTwo-clubs-locked-awaiting-season | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-clubs-locked-awaiting-season | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > svg.rvDark:nth-of-type(1) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-clubs-locked-awaiting-season | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > svg.rvHole:nth-of-type(2) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-clubs-locked-awaiting-season | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > svg.rvEdge:nth-of-type(3) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-clubs-locked-awaiting-season | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > svg.rvBurst:nth-of-type(4) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-clubs-locked-awaiting-season | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > svg.rvVoid:nth-of-type(5) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-clubs-locked-awaiting-season | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-clubs-locked-awaiting-season | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > svg.rvDark:nth-of-type(1) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-clubs-locked-awaiting-season | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > svg.rvHole:nth-of-type(2) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-clubs-locked-awaiting-season | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > svg.rvEdge:nth-of-type(3) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-clubs-locked-awaiting-season | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > svg.rvBurst:nth-of-type(4) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-clubs-locked-awaiting-season | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > svg.rvVoid:nth-of-type(5) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-clubs-locked-awaiting-season | Oversized decoration (crop candidate) | #world > div.handContact.plateDup:nth-of-type(6) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-clubs-locked-awaiting-season | Oversized decoration (crop candidate) | #world > div.handCore.plateDup:nth-of-type(7) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-clubs-locked-awaiting-season | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(8) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-clubs-locked-awaiting-season | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(9) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-clubs-locked-awaiting-season | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(10) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-clubs-locked-awaiting-season | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(11) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-clubs-locked-awaiting-season | Wider than window | #clubWheelScreenScreenTitle | 778.3px; left/right -28.9/749.5px |
| 768x1024 | playerTwo-clubs-locked-awaiting-season | Touch control <44px | #clubWheelScreen | 0 of 0 visible controls |
| 768x1024 | playerTwo-clubs-locked-awaiting-season | Text scrollWidth > clientWidth | #clubWheelScreen | 2 candidates |
| 768x1024 | playerTwo-clubs-locked-awaiting-season | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 408>341px; overflow-x visible; glyph range outside no; Osasuna |
| 768x1024 | playerTwo-clubs-locked-awaiting-season | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 151>140px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 768x1024 | playerTwo-clubs-locked-awaiting-season | Content outside viewport / ancestor crop | #clubCardOne > span.clubRevealIndex | top/bottom 738.1/766; left/right -212.8/-185.1px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerTwo-clubs-locked-awaiting-season | Content outside viewport / ancestor crop | #clubPlayerOne | top/bottom 732.7/769.4; left/right -172.8/-100.3px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerTwo-clubs-locked-awaiting-season | Content outside viewport / ancestor crop | #clubCardOne > div.clubPackStage:nth-of-type(2) > div.clubCardFace:nth-of-type(2) > span.clubCardEyebrow:nth-of-type(2) | top/bottom 770/789.2; left/right -212.8/-106.5px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerTwo-clubs-locked-awaiting-season | Content outside viewport / ancestor crop | #clubCardOne > div.clubPackStage:nth-of-type(2) > div.clubCardFace:nth-of-type(2) > span.clubCardLabel:nth-of-type(3) | top/bottom 770/789.2; left/right -90.5/51.1px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerTwo-clubs-locked-awaiting-season | Content outside viewport / ancestor crop | #clubNameOne | top/bottom 789.2/832.5; left/right -212.8/128px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerTwo-clubs-locked-awaiting-season | Content outside viewport / ancestor crop | #clubCardStateOne | top/bottom 832.5/851.7; left/right -212.8/128px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerTwo-clubs-locked-awaiting-season | Content outside viewport / ancestor crop | #clubPlayerTwo | top/bottom 732.7/769.4; left/right 770.6/808.8px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerTwo-clubs-locked-awaiting-season | Content outside viewport / ancestor crop | #clubCardTwo > div.clubPackStage:nth-of-type(2) > div.clubCardFace:nth-of-type(2) > span.clubCardEyebrow:nth-of-type(2) | top/bottom 770/789.2; left/right 730.6/836.9px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerTwo-clubs-locked-awaiting-season | Content outside viewport / ancestor crop | #clubCardTwo > div.clubPackStage:nth-of-type(2) > div.clubCardFace:nth-of-type(2) > span.clubCardLabel:nth-of-type(3) | top/bottom 770/789.2; left/right 852.9/994.5px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerTwo-clubs-locked-awaiting-season | Content outside viewport / ancestor crop | #clubNameTwo | top/bottom 789.2/832.5; left/right 730.6/1071.4px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerTwo-clubs-locked-awaiting-season | Content outside viewport / ancestor crop | #clubCardStateTwo | top/bottom 832.5/851.7; left/right 730.6/1071.4px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerTwo-clubs-locked-awaiting-season | Primary action in first screenful | none | N/A no visible action |
| 768x1024 | playerTwo-confirm | Horizontal scrollbar | html / body | no; scroll/client 768/768px; overflow visible/hidden |
| 768x1024 | playerTwo-confirm | Element wider than window | #clubWheelScreen | 1 content; 25 decoration |
| 768x1024 | playerTwo-confirm | Oversized decoration (crop candidate) | #world | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-confirm | Oversized decoration (crop candidate) | #world > div.plateBase:nth-of-type(1) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-confirm | Oversized decoration (crop candidate) | #world > div.seamMend.plateDup:nth-of-type(2) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-confirm | Oversized decoration (crop candidate) | #covers | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-confirm | Oversized decoration (crop candidate) | #covers > polygon:nth-of-type(1) | 1526.5px; left/right -379.3/1147.3px |
| 768x1024 | playerTwo-confirm | Oversized decoration (crop candidate) | #covers > polygon:nth-of-type(2) | 1526.5px; left/right -379.3/1147.3px |
| 768x1024 | playerTwo-confirm | Oversized decoration (crop candidate) | #covers > polyline | 1526.5px; left/right -379.3/1147.3px |
| 768x1024 | playerTwo-confirm | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-confirm | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > svg.rvDark:nth-of-type(1) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-confirm | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > svg.rvHole:nth-of-type(2) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-confirm | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > svg.rvEdge:nth-of-type(3) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-confirm | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > svg.rvBurst:nth-of-type(4) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-confirm | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > svg.rvVoid:nth-of-type(5) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-confirm | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-confirm | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > svg.rvDark:nth-of-type(1) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-confirm | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > svg.rvHole:nth-of-type(2) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-confirm | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > svg.rvEdge:nth-of-type(3) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-confirm | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > svg.rvBurst:nth-of-type(4) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-confirm | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > svg.rvVoid:nth-of-type(5) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-confirm | Oversized decoration (crop candidate) | #world > div.handContact.plateDup:nth-of-type(6) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-confirm | Oversized decoration (crop candidate) | #world > div.handCore.plateDup:nth-of-type(7) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-confirm | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(8) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-confirm | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(9) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-confirm | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(10) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-confirm | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(11) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-confirm | Wider than window | #clubWheelScreenScreenTitle | 778.3px; left/right -28.9/749.5px |
| 768x1024 | playerTwo-confirm | Touch control <44px | #clubWheelScreen | 0 of 1 visible controls |
| 768x1024 | playerTwo-confirm | Text scrollWidth > clientWidth | #clubWheelScreen | 2 candidates |
| 768x1024 | playerTwo-confirm | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 408>341px; overflow-x visible; glyph range outside no; Osasuna |
| 768x1024 | playerTwo-confirm | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 148>140px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 768x1024 | playerTwo-confirm | Content outside viewport / ancestor crop | #clubCardOne > span.clubRevealIndex | top/bottom 738.1/766; left/right -212.8/-185.1px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerTwo-confirm | Content outside viewport / ancestor crop | #clubPlayerOne | top/bottom 732.7/769.4; left/right -172.8/-100.3px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerTwo-confirm | Content outside viewport / ancestor crop | #clubCardOne > div.clubPackStage:nth-of-type(2) > div.clubCardFace:nth-of-type(2) > span.clubCardEyebrow:nth-of-type(2) | top/bottom 770/789.2; left/right -212.8/-106.5px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerTwo-confirm | Content outside viewport / ancestor crop | #clubCardOne > div.clubPackStage:nth-of-type(2) > div.clubCardFace:nth-of-type(2) > span.clubCardLabel:nth-of-type(3) | top/bottom 770/789.2; left/right -90.5/51.1px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerTwo-confirm | Content outside viewport / ancestor crop | #clubNameOne | top/bottom 789.2/832.5; left/right -212.8/128px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerTwo-confirm | Content outside viewport / ancestor crop | #clubCardStateOne | top/bottom 832.5/851.7; left/right -212.8/128px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerTwo-confirm | Content outside viewport / ancestor crop | #clubPlayerTwo | top/bottom 732.7/769.4; left/right 770.6/808.8px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerTwo-confirm | Content outside viewport / ancestor crop | #clubCardTwo > div.clubPackStage:nth-of-type(2) > div.clubCardFace:nth-of-type(2) > span.clubCardEyebrow:nth-of-type(2) | top/bottom 770/789.2; left/right 730.6/836.9px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerTwo-confirm | Content outside viewport / ancestor crop | #clubCardTwo > div.clubPackStage:nth-of-type(2) > div.clubCardFace:nth-of-type(2) > span.clubCardLabel:nth-of-type(3) | top/bottom 770/789.2; left/right 852.9/994.5px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerTwo-confirm | Content outside viewport / ancestor crop | #clubNameTwo | top/bottom 789.2/832.5; left/right 730.6/1071.4px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerTwo-confirm | Content outside viewport / ancestor crop | #clubCardStateTwo | top/bottom 832.5/851.7; left/right 730.6/1071.4px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerTwo-confirm | Primary action in first screenful | #continueClubAssignment | yes; 693×74.6px; top/bottom 890.1/964.7px; CONFIRM SHARED SHOWDOWN; center unobscured yes |
| 768x1024 | playerTwo-confirm-write-failure | Horizontal scrollbar | html / body | no; scroll/client 768/768px; overflow visible/hidden |
| 768x1024 | playerTwo-confirm-write-failure | Element wider than window | #clubWheelScreen | 1 content; 25 decoration |
| 768x1024 | playerTwo-confirm-write-failure | Oversized decoration (crop candidate) | #world | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-confirm-write-failure | Oversized decoration (crop candidate) | #world > div.plateBase:nth-of-type(1) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-confirm-write-failure | Oversized decoration (crop candidate) | #world > div.seamMend.plateDup:nth-of-type(2) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-confirm-write-failure | Oversized decoration (crop candidate) | #covers | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-confirm-write-failure | Oversized decoration (crop candidate) | #covers > polygon:nth-of-type(1) | 1526.5px; left/right -379.3/1147.3px |
| 768x1024 | playerTwo-confirm-write-failure | Oversized decoration (crop candidate) | #covers > polygon:nth-of-type(2) | 1526.5px; left/right -379.3/1147.3px |
| 768x1024 | playerTwo-confirm-write-failure | Oversized decoration (crop candidate) | #covers > polyline | 1526.5px; left/right -379.3/1147.3px |
| 768x1024 | playerTwo-confirm-write-failure | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-confirm-write-failure | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > svg.rvDark:nth-of-type(1) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-confirm-write-failure | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > svg.rvHole:nth-of-type(2) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-confirm-write-failure | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > svg.rvEdge:nth-of-type(3) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-confirm-write-failure | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > svg.rvBurst:nth-of-type(4) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-confirm-write-failure | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > svg.rvVoid:nth-of-type(5) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-confirm-write-failure | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-confirm-write-failure | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > svg.rvDark:nth-of-type(1) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-confirm-write-failure | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > svg.rvHole:nth-of-type(2) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-confirm-write-failure | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > svg.rvEdge:nth-of-type(3) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-confirm-write-failure | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > svg.rvBurst:nth-of-type(4) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-confirm-write-failure | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > svg.rvVoid:nth-of-type(5) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-confirm-write-failure | Oversized decoration (crop candidate) | #world > div.handContact.plateDup:nth-of-type(6) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-confirm-write-failure | Oversized decoration (crop candidate) | #world > div.handCore.plateDup:nth-of-type(7) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-confirm-write-failure | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(8) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-confirm-write-failure | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(9) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-confirm-write-failure | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(10) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-confirm-write-failure | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(11) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-confirm-write-failure | Wider than window | #clubWheelScreenScreenTitle | 778.3px; left/right -28.9/749.5px |
| 768x1024 | playerTwo-confirm-write-failure | Touch control <44px | #clubWheelScreen | 0 of 1 visible controls |
| 768x1024 | playerTwo-confirm-write-failure | Text scrollWidth > clientWidth | #clubWheelScreen | 2 candidates |
| 768x1024 | playerTwo-confirm-write-failure | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 408>341px; overflow-x visible; glyph range outside no; Osasuna |
| 768x1024 | playerTwo-confirm-write-failure | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 148>140px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 768x1024 | playerTwo-confirm-write-failure | Content outside viewport / ancestor crop | #clubCardOne > span.clubRevealIndex | top/bottom 738.1/766; left/right -212.8/-185.1px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerTwo-confirm-write-failure | Content outside viewport / ancestor crop | #clubPlayerOne | top/bottom 732.7/769.4; left/right -172.8/-100.3px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerTwo-confirm-write-failure | Content outside viewport / ancestor crop | #clubCardOne > div.clubPackStage:nth-of-type(2) > div.clubCardFace:nth-of-type(2) > span.clubCardEyebrow:nth-of-type(2) | top/bottom 770/789.2; left/right -212.8/-106.5px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerTwo-confirm-write-failure | Content outside viewport / ancestor crop | #clubCardOne > div.clubPackStage:nth-of-type(2) > div.clubCardFace:nth-of-type(2) > span.clubCardLabel:nth-of-type(3) | top/bottom 770/789.2; left/right -90.5/51.1px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerTwo-confirm-write-failure | Content outside viewport / ancestor crop | #clubNameOne | top/bottom 789.2/832.5; left/right -212.8/128px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerTwo-confirm-write-failure | Content outside viewport / ancestor crop | #clubCardStateOne | top/bottom 832.5/851.7; left/right -212.8/128px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerTwo-confirm-write-failure | Content outside viewport / ancestor crop | #clubPlayerTwo | top/bottom 732.7/769.4; left/right 770.6/808.8px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerTwo-confirm-write-failure | Content outside viewport / ancestor crop | #clubCardTwo > div.clubPackStage:nth-of-type(2) > div.clubCardFace:nth-of-type(2) > span.clubCardEyebrow:nth-of-type(2) | top/bottom 770/789.2; left/right 730.6/836.9px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerTwo-confirm-write-failure | Content outside viewport / ancestor crop | #clubCardTwo > div.clubPackStage:nth-of-type(2) > div.clubCardFace:nth-of-type(2) > span.clubCardLabel:nth-of-type(3) | top/bottom 770/789.2; left/right 852.9/994.5px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerTwo-confirm-write-failure | Content outside viewport / ancestor crop | #clubNameTwo | top/bottom 789.2/832.5; left/right 730.6/1071.4px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerTwo-confirm-write-failure | Content outside viewport / ancestor crop | #clubCardStateTwo | top/bottom 832.5/851.7; left/right 730.6/1071.4px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerTwo-confirm-write-failure | Primary action in first screenful | #continueClubAssignment | yes; 693×74.6px; top/bottom 889.1/963.7px; CONFIRM SHARED SHOWDOWN; center unobscured yes |
| 768x1024 | playerTwo-waiting-rival | Horizontal scrollbar | html / body | no; scroll/client 768/768px; overflow visible/hidden |
| 768x1024 | playerTwo-waiting-rival | Element wider than window | #clubWheelScreen | 1 content; 25 decoration |
| 768x1024 | playerTwo-waiting-rival | Oversized decoration (crop candidate) | #world | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-waiting-rival | Oversized decoration (crop candidate) | #world > div.plateBase:nth-of-type(1) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-waiting-rival | Oversized decoration (crop candidate) | #world > div.seamMend.plateDup:nth-of-type(2) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-waiting-rival | Oversized decoration (crop candidate) | #covers | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-waiting-rival | Oversized decoration (crop candidate) | #covers > polygon:nth-of-type(1) | 1526.5px; left/right -379.3/1147.3px |
| 768x1024 | playerTwo-waiting-rival | Oversized decoration (crop candidate) | #covers > polygon:nth-of-type(2) | 1526.5px; left/right -379.3/1147.3px |
| 768x1024 | playerTwo-waiting-rival | Oversized decoration (crop candidate) | #covers > polyline | 1526.5px; left/right -379.3/1147.3px |
| 768x1024 | playerTwo-waiting-rival | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-waiting-rival | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > svg.rvDark:nth-of-type(1) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-waiting-rival | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > svg.rvHole:nth-of-type(2) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-waiting-rival | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > svg.rvEdge:nth-of-type(3) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-waiting-rival | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > svg.rvBurst:nth-of-type(4) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-waiting-rival | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > svg.rvVoid:nth-of-type(5) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-waiting-rival | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-waiting-rival | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > svg.rvDark:nth-of-type(1) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-waiting-rival | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > svg.rvHole:nth-of-type(2) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-waiting-rival | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > svg.rvEdge:nth-of-type(3) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-waiting-rival | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > svg.rvBurst:nth-of-type(4) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-waiting-rival | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > svg.rvVoid:nth-of-type(5) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-waiting-rival | Oversized decoration (crop candidate) | #world > div.handContact.plateDup:nth-of-type(6) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-waiting-rival | Oversized decoration (crop candidate) | #world > div.handCore.plateDup:nth-of-type(7) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-waiting-rival | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(8) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-waiting-rival | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(9) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-waiting-rival | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(10) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-waiting-rival | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(11) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-waiting-rival | Wider than window | #clubWheelScreenScreenTitle | 778.3px; left/right -28.9/749.5px |
| 768x1024 | playerTwo-waiting-rival | Touch control <44px | #clubWheelScreen | 0 of 1 visible controls |
| 768x1024 | playerTwo-waiting-rival | Text scrollWidth > clientWidth | #clubWheelScreen | 2 candidates |
| 768x1024 | playerTwo-waiting-rival | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 408>341px; overflow-x visible; glyph range outside no; Osasuna |
| 768x1024 | playerTwo-waiting-rival | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 148>140px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 768x1024 | playerTwo-waiting-rival | Content outside viewport / ancestor crop | #clubCardOne > span.clubRevealIndex | top/bottom 738.1/766; left/right -212.8/-185.1px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerTwo-waiting-rival | Content outside viewport / ancestor crop | #clubPlayerOne | top/bottom 732.7/769.4; left/right -172.8/-100.3px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerTwo-waiting-rival | Content outside viewport / ancestor crop | #clubCardOne > div.clubPackStage:nth-of-type(2) > div.clubCardFace:nth-of-type(2) > span.clubCardEyebrow:nth-of-type(2) | top/bottom 770/789.2; left/right -212.8/-106.5px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerTwo-waiting-rival | Content outside viewport / ancestor crop | #clubCardOne > div.clubPackStage:nth-of-type(2) > div.clubCardFace:nth-of-type(2) > span.clubCardLabel:nth-of-type(3) | top/bottom 770/789.2; left/right -90.5/51.1px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerTwo-waiting-rival | Content outside viewport / ancestor crop | #clubNameOne | top/bottom 789.2/832.5; left/right -212.8/128px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerTwo-waiting-rival | Content outside viewport / ancestor crop | #clubCardStateOne | top/bottom 832.5/851.7; left/right -212.8/128px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerTwo-waiting-rival | Content outside viewport / ancestor crop | #clubPlayerTwo | top/bottom 732.7/769.4; left/right 770.6/808.8px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerTwo-waiting-rival | Content outside viewport / ancestor crop | #clubCardTwo > div.clubPackStage:nth-of-type(2) > div.clubCardFace:nth-of-type(2) > span.clubCardEyebrow:nth-of-type(2) | top/bottom 770/789.2; left/right 730.6/836.9px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerTwo-waiting-rival | Content outside viewport / ancestor crop | #clubCardTwo > div.clubPackStage:nth-of-type(2) > div.clubCardFace:nth-of-type(2) > span.clubCardLabel:nth-of-type(3) | top/bottom 770/789.2; left/right 852.9/994.5px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerTwo-waiting-rival | Content outside viewport / ancestor crop | #clubNameTwo | top/bottom 789.2/832.5; left/right 730.6/1071.4px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerTwo-waiting-rival | Content outside viewport / ancestor crop | #clubCardStateTwo | top/bottom 832.5/851.7; left/right 730.6/1071.4px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerTwo-waiting-rival | Primary action in first screenful | #continueClubAssignment | yes; 693×74.6px; top/bottom 890.1/964.7px; CONFIRMED · WAITING FOR RIVAL; disabled; center unobscured yes |
| 768x1024 | playerTwo-reconnect | Horizontal scrollbar | html / body | no; scroll/client 768/768px; overflow visible/hidden |
| 768x1024 | playerTwo-reconnect | Element wider than window | #clubWheelScreen | 1 content; 25 decoration |
| 768x1024 | playerTwo-reconnect | Oversized decoration (crop candidate) | #world | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-reconnect | Oversized decoration (crop candidate) | #world > div.plateBase:nth-of-type(1) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-reconnect | Oversized decoration (crop candidate) | #world > div.seamMend.plateDup:nth-of-type(2) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-reconnect | Oversized decoration (crop candidate) | #covers | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-reconnect | Oversized decoration (crop candidate) | #covers > polygon:nth-of-type(1) | 1526.5px; left/right -379.3/1147.3px |
| 768x1024 | playerTwo-reconnect | Oversized decoration (crop candidate) | #covers > polygon:nth-of-type(2) | 1526.5px; left/right -379.3/1147.3px |
| 768x1024 | playerTwo-reconnect | Oversized decoration (crop candidate) | #covers > polyline | 1526.5px; left/right -379.3/1147.3px |
| 768x1024 | playerTwo-reconnect | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-reconnect | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > svg.rvDark:nth-of-type(1) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-reconnect | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > svg.rvHole:nth-of-type(2) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-reconnect | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > svg.rvEdge:nth-of-type(3) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-reconnect | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > svg.rvBurst:nth-of-type(4) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-reconnect | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > svg.rvVoid:nth-of-type(5) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-reconnect | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-reconnect | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > svg.rvDark:nth-of-type(1) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-reconnect | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > svg.rvHole:nth-of-type(2) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-reconnect | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > svg.rvEdge:nth-of-type(3) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-reconnect | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > svg.rvBurst:nth-of-type(4) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-reconnect | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > svg.rvVoid:nth-of-type(5) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-reconnect | Oversized decoration (crop candidate) | #world > div.handContact.plateDup:nth-of-type(6) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-reconnect | Oversized decoration (crop candidate) | #world > div.handCore.plateDup:nth-of-type(7) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-reconnect | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(8) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-reconnect | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(9) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-reconnect | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(10) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-reconnect | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(11) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-reconnect | Wider than window | #clubWheelScreenScreenTitle | 778.3px; left/right -28.9/749.5px |
| 768x1024 | playerTwo-reconnect | Touch control <44px | #clubWheelScreen | 0 of 1 visible controls |
| 768x1024 | playerTwo-reconnect | Text scrollWidth > clientWidth | #clubWheelScreen | 2 candidates |
| 768x1024 | playerTwo-reconnect | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 408>341px; overflow-x visible; glyph range outside no; Osasuna |
| 768x1024 | playerTwo-reconnect | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 148>140px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 768x1024 | playerTwo-reconnect | Content outside viewport / ancestor crop | #clubCardOne > span.clubRevealIndex | top/bottom 738.1/766; left/right -212.8/-185.1px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerTwo-reconnect | Content outside viewport / ancestor crop | #clubPlayerOne | top/bottom 732.7/769.4; left/right -172.8/-100.3px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerTwo-reconnect | Content outside viewport / ancestor crop | #clubCardOne > div.clubPackStage:nth-of-type(2) > div.clubCardFace:nth-of-type(2) > span.clubCardEyebrow:nth-of-type(2) | top/bottom 770/789.2; left/right -212.8/-106.5px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerTwo-reconnect | Content outside viewport / ancestor crop | #clubCardOne > div.clubPackStage:nth-of-type(2) > div.clubCardFace:nth-of-type(2) > span.clubCardLabel:nth-of-type(3) | top/bottom 770/789.2; left/right -90.5/51.1px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerTwo-reconnect | Content outside viewport / ancestor crop | #clubNameOne | top/bottom 789.2/832.5; left/right -212.8/128px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerTwo-reconnect | Content outside viewport / ancestor crop | #clubCardStateOne | top/bottom 832.5/851.7; left/right -212.8/128px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerTwo-reconnect | Content outside viewport / ancestor crop | #clubPlayerTwo | top/bottom 732.7/769.4; left/right 770.6/808.8px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerTwo-reconnect | Content outside viewport / ancestor crop | #clubCardTwo > div.clubPackStage:nth-of-type(2) > div.clubCardFace:nth-of-type(2) > span.clubCardEyebrow:nth-of-type(2) | top/bottom 770/789.2; left/right 730.6/836.9px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerTwo-reconnect | Content outside viewport / ancestor crop | #clubCardTwo > div.clubPackStage:nth-of-type(2) > div.clubCardFace:nth-of-type(2) > span.clubCardLabel:nth-of-type(3) | top/bottom 770/789.2; left/right 852.9/994.5px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerTwo-reconnect | Content outside viewport / ancestor crop | #clubNameTwo | top/bottom 789.2/832.5; left/right 730.6/1071.4px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerTwo-reconnect | Content outside viewport / ancestor crop | #clubCardStateTwo | top/bottom 832.5/851.7; left/right 730.6/1071.4px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerTwo-reconnect | Primary action in first screenful | #continueClubAssignment | yes; 693×74.6px; top/bottom 890.1/964.7px; RECONNECT PLAYERS TO CONTINUE; disabled; center unobscured yes |
| 768x1024 | playerTwo-career-start-ready | Horizontal scrollbar | html / body | no; scroll/client 768/768px; overflow visible/hidden |
| 768x1024 | playerTwo-career-start-ready | Element wider than window | #clubWheelScreen | 1 content; 25 decoration |
| 768x1024 | playerTwo-career-start-ready | Oversized decoration (crop candidate) | #world | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-career-start-ready | Oversized decoration (crop candidate) | #world > div.plateBase:nth-of-type(1) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-career-start-ready | Oversized decoration (crop candidate) | #world > div.seamMend.plateDup:nth-of-type(2) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-career-start-ready | Oversized decoration (crop candidate) | #covers | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-career-start-ready | Oversized decoration (crop candidate) | #covers > polygon:nth-of-type(1) | 1526.5px; left/right -379.3/1147.3px |
| 768x1024 | playerTwo-career-start-ready | Oversized decoration (crop candidate) | #covers > polygon:nth-of-type(2) | 1526.5px; left/right -379.3/1147.3px |
| 768x1024 | playerTwo-career-start-ready | Oversized decoration (crop candidate) | #covers > polyline | 1526.5px; left/right -379.3/1147.3px |
| 768x1024 | playerTwo-career-start-ready | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-career-start-ready | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > svg.rvDark:nth-of-type(1) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-career-start-ready | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > svg.rvHole:nth-of-type(2) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-career-start-ready | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > svg.rvEdge:nth-of-type(3) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-career-start-ready | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > svg.rvBurst:nth-of-type(4) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-career-start-ready | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > svg.rvVoid:nth-of-type(5) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-career-start-ready | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-career-start-ready | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > svg.rvDark:nth-of-type(1) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-career-start-ready | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > svg.rvHole:nth-of-type(2) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-career-start-ready | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > svg.rvEdge:nth-of-type(3) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-career-start-ready | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > svg.rvBurst:nth-of-type(4) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-career-start-ready | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > svg.rvVoid:nth-of-type(5) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-career-start-ready | Oversized decoration (crop candidate) | #world > div.handContact.plateDup:nth-of-type(6) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-career-start-ready | Oversized decoration (crop candidate) | #world > div.handCore.plateDup:nth-of-type(7) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-career-start-ready | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(8) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-career-start-ready | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(9) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-career-start-ready | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(10) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-career-start-ready | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(11) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-career-start-ready | Wider than window | #clubWheelScreenScreenTitle | 778.3px; left/right -28.9/749.5px |
| 768x1024 | playerTwo-career-start-ready | Touch control <44px | #clubWheelScreen | 0 of 1 visible controls |
| 768x1024 | playerTwo-career-start-ready | Text scrollWidth > clientWidth | #clubWheelScreen | 2 candidates |
| 768x1024 | playerTwo-career-start-ready | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 408>341px; overflow-x visible; glyph range outside no; Osasuna |
| 768x1024 | playerTwo-career-start-ready | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 148>140px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 768x1024 | playerTwo-career-start-ready | Content outside viewport / ancestor crop | #clubCardOne > span.clubRevealIndex | top/bottom 738.1/766; left/right -212.8/-185.1px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerTwo-career-start-ready | Content outside viewport / ancestor crop | #clubPlayerOne | top/bottom 732.7/769.4; left/right -172.8/-100.3px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerTwo-career-start-ready | Content outside viewport / ancestor crop | #clubCardOne > div.clubPackStage:nth-of-type(2) > div.clubCardFace:nth-of-type(2) > span.clubCardEyebrow:nth-of-type(2) | top/bottom 770/789.2; left/right -212.8/-106.5px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerTwo-career-start-ready | Content outside viewport / ancestor crop | #clubCardOne > div.clubPackStage:nth-of-type(2) > div.clubCardFace:nth-of-type(2) > span.clubCardLabel:nth-of-type(3) | top/bottom 770/789.2; left/right -90.5/51.1px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerTwo-career-start-ready | Content outside viewport / ancestor crop | #clubNameOne | top/bottom 789.2/832.5; left/right -212.8/128px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerTwo-career-start-ready | Content outside viewport / ancestor crop | #clubCardStateOne | top/bottom 832.5/851.7; left/right -212.8/128px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerTwo-career-start-ready | Content outside viewport / ancestor crop | #clubPlayerTwo | top/bottom 732.7/769.4; left/right 770.6/808.8px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerTwo-career-start-ready | Content outside viewport / ancestor crop | #clubCardTwo > div.clubPackStage:nth-of-type(2) > div.clubCardFace:nth-of-type(2) > span.clubCardEyebrow:nth-of-type(2) | top/bottom 770/789.2; left/right 730.6/836.9px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerTwo-career-start-ready | Content outside viewport / ancestor crop | #clubCardTwo > div.clubPackStage:nth-of-type(2) > div.clubCardFace:nth-of-type(2) > span.clubCardLabel:nth-of-type(3) | top/bottom 770/789.2; left/right 852.9/994.5px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerTwo-career-start-ready | Content outside viewport / ancestor crop | #clubNameTwo | top/bottom 789.2/832.5; left/right 730.6/1071.4px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerTwo-career-start-ready | Content outside viewport / ancestor crop | #clubCardStateTwo | top/bottom 832.5/851.7; left/right 730.6/1071.4px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerTwo-career-start-ready | Primary action in first screenful | #continueClubAssignment | yes; 693×74.6px; top/bottom 889.1/963.7px; CONTINUE TO CAREER START; center unobscured yes |
| 768x1024 | playerTwo-season-mismatch | Horizontal scrollbar | html / body | no; scroll/client 768/768px; overflow visible/hidden |
| 768x1024 | playerTwo-season-mismatch | Element wider than window | #clubWheelScreen | 1 content; 25 decoration |
| 768x1024 | playerTwo-season-mismatch | Oversized decoration (crop candidate) | #world | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-season-mismatch | Oversized decoration (crop candidate) | #world > div.plateBase:nth-of-type(1) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-season-mismatch | Oversized decoration (crop candidate) | #world > div.seamMend.plateDup:nth-of-type(2) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-season-mismatch | Oversized decoration (crop candidate) | #covers | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-season-mismatch | Oversized decoration (crop candidate) | #covers > polygon:nth-of-type(1) | 1526.5px; left/right -379.3/1147.3px |
| 768x1024 | playerTwo-season-mismatch | Oversized decoration (crop candidate) | #covers > polygon:nth-of-type(2) | 1526.5px; left/right -379.3/1147.3px |
| 768x1024 | playerTwo-season-mismatch | Oversized decoration (crop candidate) | #covers > polyline | 1526.5px; left/right -379.3/1147.3px |
| 768x1024 | playerTwo-season-mismatch | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-season-mismatch | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > svg.rvDark:nth-of-type(1) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-season-mismatch | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > svg.rvHole:nth-of-type(2) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-season-mismatch | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > svg.rvEdge:nth-of-type(3) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-season-mismatch | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > svg.rvBurst:nth-of-type(4) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-season-mismatch | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > svg.rvVoid:nth-of-type(5) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-season-mismatch | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-season-mismatch | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > svg.rvDark:nth-of-type(1) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-season-mismatch | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > svg.rvHole:nth-of-type(2) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-season-mismatch | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > svg.rvEdge:nth-of-type(3) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-season-mismatch | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > svg.rvBurst:nth-of-type(4) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-season-mismatch | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > svg.rvVoid:nth-of-type(5) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-season-mismatch | Oversized decoration (crop candidate) | #world > div.handContact.plateDup:nth-of-type(6) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-season-mismatch | Oversized decoration (crop candidate) | #world > div.handCore.plateDup:nth-of-type(7) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-season-mismatch | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(8) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-season-mismatch | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(9) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-season-mismatch | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(10) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-season-mismatch | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(11) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-season-mismatch | Wider than window | #clubWheelScreenScreenTitle | 778.3px; left/right -28.9/749.5px |
| 768x1024 | playerTwo-season-mismatch | Touch control <44px | #clubWheelScreen | 0 of 1 visible controls |
| 768x1024 | playerTwo-season-mismatch | Text scrollWidth > clientWidth | #clubWheelScreen | 2 candidates |
| 768x1024 | playerTwo-season-mismatch | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 408>341px; overflow-x visible; glyph range outside no; Osasuna |
| 768x1024 | playerTwo-season-mismatch | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 148>140px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 768x1024 | playerTwo-season-mismatch | Content outside viewport / ancestor crop | #clubCardOne > span.clubRevealIndex | top/bottom 738.1/766; left/right -212.8/-185.1px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerTwo-season-mismatch | Content outside viewport / ancestor crop | #clubPlayerOne | top/bottom 732.7/769.4; left/right -172.8/-100.3px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerTwo-season-mismatch | Content outside viewport / ancestor crop | #clubCardOne > div.clubPackStage:nth-of-type(2) > div.clubCardFace:nth-of-type(2) > span.clubCardEyebrow:nth-of-type(2) | top/bottom 770/789.2; left/right -212.8/-106.5px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerTwo-season-mismatch | Content outside viewport / ancestor crop | #clubCardOne > div.clubPackStage:nth-of-type(2) > div.clubCardFace:nth-of-type(2) > span.clubCardLabel:nth-of-type(3) | top/bottom 770/789.2; left/right -90.5/51.1px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerTwo-season-mismatch | Content outside viewport / ancestor crop | #clubNameOne | top/bottom 789.2/832.5; left/right -212.8/128px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerTwo-season-mismatch | Content outside viewport / ancestor crop | #clubCardStateOne | top/bottom 832.5/851.7; left/right -212.8/128px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerTwo-season-mismatch | Content outside viewport / ancestor crop | #clubPlayerTwo | top/bottom 732.7/769.4; left/right 770.6/808.8px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerTwo-season-mismatch | Content outside viewport / ancestor crop | #clubCardTwo > div.clubPackStage:nth-of-type(2) > div.clubCardFace:nth-of-type(2) > span.clubCardEyebrow:nth-of-type(2) | top/bottom 770/789.2; left/right 730.6/836.9px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerTwo-season-mismatch | Content outside viewport / ancestor crop | #clubCardTwo > div.clubPackStage:nth-of-type(2) > div.clubCardFace:nth-of-type(2) > span.clubCardLabel:nth-of-type(3) | top/bottom 770/789.2; left/right 852.9/994.5px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerTwo-season-mismatch | Content outside viewport / ancestor crop | #clubNameTwo | top/bottom 789.2/832.5; left/right 730.6/1071.4px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerTwo-season-mismatch | Content outside viewport / ancestor crop | #clubCardStateTwo | top/bottom 832.5/851.7; left/right 730.6/1071.4px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerTwo-season-mismatch | Primary action in first screenful | #continueClubAssignment | yes; 693×74.6px; top/bottom 890.1/964.7px; SEASON PLAN MISMATCH · RECOVERY REQUIRED; disabled; center unobscured yes |
| 768x1024 | playerTwo-long-club-names | Horizontal scrollbar | html / body | no; scroll/client 768/768px; overflow visible/hidden |
| 768x1024 | playerTwo-long-club-names | Element wider than window | #clubWheelScreen | 1 content; 25 decoration |
| 768x1024 | playerTwo-long-club-names | Oversized decoration (crop candidate) | #world | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-long-club-names | Oversized decoration (crop candidate) | #world > div.plateBase:nth-of-type(1) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-long-club-names | Oversized decoration (crop candidate) | #world > div.seamMend.plateDup:nth-of-type(2) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-long-club-names | Oversized decoration (crop candidate) | #covers | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-long-club-names | Oversized decoration (crop candidate) | #covers > polygon:nth-of-type(1) | 1526.5px; left/right -379.3/1147.3px |
| 768x1024 | playerTwo-long-club-names | Oversized decoration (crop candidate) | #covers > polygon:nth-of-type(2) | 1526.5px; left/right -379.3/1147.3px |
| 768x1024 | playerTwo-long-club-names | Oversized decoration (crop candidate) | #covers > polyline | 1526.5px; left/right -379.3/1147.3px |
| 768x1024 | playerTwo-long-club-names | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-long-club-names | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > svg.rvDark:nth-of-type(1) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-long-club-names | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > svg.rvHole:nth-of-type(2) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-long-club-names | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > svg.rvEdge:nth-of-type(3) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-long-club-names | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > svg.rvBurst:nth-of-type(4) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-long-club-names | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > svg.rvVoid:nth-of-type(5) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-long-club-names | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-long-club-names | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > svg.rvDark:nth-of-type(1) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-long-club-names | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > svg.rvHole:nth-of-type(2) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-long-club-names | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > svg.rvEdge:nth-of-type(3) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-long-club-names | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > svg.rvBurst:nth-of-type(4) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-long-club-names | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > svg.rvVoid:nth-of-type(5) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-long-club-names | Oversized decoration (crop candidate) | #world > div.handContact.plateDup:nth-of-type(6) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-long-club-names | Oversized decoration (crop candidate) | #world > div.handCore.plateDup:nth-of-type(7) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-long-club-names | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(8) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-long-club-names | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(9) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-long-club-names | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(10) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-long-club-names | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(11) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-long-club-names | Wider than window | #clubWheelScreenScreenTitle | 778.3px; left/right -28.9/749.5px |
| 768x1024 | playerTwo-long-club-names | Touch control <44px | #clubWheelScreen | 0 of 1 visible controls |
| 768x1024 | playerTwo-long-club-names | Text scrollWidth > clientWidth | #clubWheelScreen | 3 candidates |
| 768x1024 | playerTwo-long-club-names | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 408>341px; overflow-x visible; glyph range outside no; Deportivo La Coruña |
| 768x1024 | playerTwo-long-club-names | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 408>341px; overflow-x visible; glyph range outside yes; Borussia Mönchengladbach |
| 768x1024 | playerTwo-long-club-names | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 148>140px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 768x1024 | playerTwo-long-club-names | Content outside viewport / ancestor crop | #clubCardOne > span.clubRevealIndex | top/bottom 738.1/766; left/right -212.8/-185.1px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerTwo-long-club-names | Content outside viewport / ancestor crop | #clubPlayerOne | top/bottom 732.7/769.4; left/right -172.8/-100.3px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerTwo-long-club-names | Content outside viewport / ancestor crop | #clubCardOne > div.clubPackStage:nth-of-type(2) > div.clubCardFace:nth-of-type(2) > span.clubCardEyebrow:nth-of-type(2) | top/bottom 770/789.2; left/right -212.8/-106.5px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerTwo-long-club-names | Content outside viewport / ancestor crop | #clubCardOne > div.clubPackStage:nth-of-type(2) > div.clubCardFace:nth-of-type(2) > span.clubCardLabel:nth-of-type(3) | top/bottom 770/789.2; left/right -90.5/51.1px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerTwo-long-club-names | Content outside viewport / ancestor crop | #clubNameOne | top/bottom 789.2/832.5; left/right -212.8/128px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerTwo-long-club-names | Content outside viewport / ancestor crop | #clubCardStateOne | top/bottom 832.5/851.7; left/right -212.8/128px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerTwo-long-club-names | Content outside viewport / ancestor crop | #clubPlayerTwo | top/bottom 732.7/769.4; left/right 770.6/808.8px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerTwo-long-club-names | Content outside viewport / ancestor crop | #clubCardTwo > div.clubPackStage:nth-of-type(2) > div.clubCardFace:nth-of-type(2) > span.clubCardEyebrow:nth-of-type(2) | top/bottom 770/789.2; left/right 730.6/836.9px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerTwo-long-club-names | Content outside viewport / ancestor crop | #clubCardTwo > div.clubPackStage:nth-of-type(2) > div.clubCardFace:nth-of-type(2) > span.clubCardLabel:nth-of-type(3) | top/bottom 770/789.2; left/right 852.9/994.5px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerTwo-long-club-names | Content outside viewport / ancestor crop | #clubNameTwo | top/bottom 789.2/832.5; left/right 730.6/1071.4px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerTwo-long-club-names | Content outside viewport / ancestor crop | #clubCardStateTwo | top/bottom 832.5/851.7; left/right 730.6/1071.4px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerTwo-long-club-names | Overlap | .clubRivalryLockNote / #continueClubAssignment | 493×26px intersection |
| 768x1024 | playerTwo-long-club-names | Primary action in first screenful | #continueClubAssignment | yes; 693×74.6px; top/bottom 889.1/963.7px; CONFIRM SHARED SHOWDOWN; center unobscured yes |
| 768x1024 | playerOne-confirmation-overlap-detail | Horizontal scrollbar | html / body | no; scroll/client 768/768px; overflow visible/hidden |
| 768x1024 | playerOne-confirmation-overlap-detail | Element wider than window | #clubWheelScreen | 1 content; 25 decoration |
| 768x1024 | playerOne-confirmation-overlap-detail | Oversized decoration (crop candidate) | #world | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-confirmation-overlap-detail | Oversized decoration (crop candidate) | #world > div.plateBase:nth-of-type(1) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-confirmation-overlap-detail | Oversized decoration (crop candidate) | #world > div.seamMend.plateDup:nth-of-type(2) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-confirmation-overlap-detail | Oversized decoration (crop candidate) | #covers | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-confirmation-overlap-detail | Oversized decoration (crop candidate) | #covers > polygon:nth-of-type(1) | 1526.5px; left/right -379.3/1147.3px |
| 768x1024 | playerOne-confirmation-overlap-detail | Oversized decoration (crop candidate) | #covers > polygon:nth-of-type(2) | 1526.5px; left/right -379.3/1147.3px |
| 768x1024 | playerOne-confirmation-overlap-detail | Oversized decoration (crop candidate) | #covers > polyline | 1526.5px; left/right -379.3/1147.3px |
| 768x1024 | playerOne-confirmation-overlap-detail | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-confirmation-overlap-detail | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > svg.rvDark:nth-of-type(1) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-confirmation-overlap-detail | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > svg.rvHole:nth-of-type(2) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-confirmation-overlap-detail | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > svg.rvEdge:nth-of-type(3) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-confirmation-overlap-detail | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > svg.rvBurst:nth-of-type(4) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-confirmation-overlap-detail | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > svg.rvVoid:nth-of-type(5) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-confirmation-overlap-detail | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-confirmation-overlap-detail | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > svg.rvDark:nth-of-type(1) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-confirmation-overlap-detail | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > svg.rvHole:nth-of-type(2) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-confirmation-overlap-detail | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > svg.rvEdge:nth-of-type(3) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-confirmation-overlap-detail | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > svg.rvBurst:nth-of-type(4) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-confirmation-overlap-detail | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > svg.rvVoid:nth-of-type(5) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-confirmation-overlap-detail | Oversized decoration (crop candidate) | #world > div.handContact.plateDup:nth-of-type(6) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-confirmation-overlap-detail | Oversized decoration (crop candidate) | #world > div.handCore.plateDup:nth-of-type(7) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-confirmation-overlap-detail | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(8) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-confirmation-overlap-detail | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(9) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-confirmation-overlap-detail | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(10) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-confirmation-overlap-detail | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(11) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerOne-confirmation-overlap-detail | Wider than window | #clubWheelScreenScreenTitle | 778.3px; left/right -28.9/749.5px |
| 768x1024 | playerOne-confirmation-overlap-detail | Touch control <44px | #clubWheelScreen | 0 of 1 visible controls |
| 768x1024 | playerOne-confirmation-overlap-detail | Text scrollWidth > clientWidth | #clubWheelScreen | 2 candidates |
| 768x1024 | playerOne-confirmation-overlap-detail | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 408>341px; overflow-x visible; glyph range outside no; Espanyol |
| 768x1024 | playerOne-confirmation-overlap-detail | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 149>140px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 768x1024 | playerOne-confirmation-overlap-detail | Content outside viewport / ancestor crop | #clubCardOne > span.clubRevealIndex | top/bottom 738.1/766; left/right -212.8/-185.1px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-confirmation-overlap-detail | Content outside viewport / ancestor crop | #clubPlayerOne | top/bottom 732.7/769.4; left/right -172.8/-100.3px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-confirmation-overlap-detail | Content outside viewport / ancestor crop | #clubCardOne > div.clubPackStage:nth-of-type(2) > div.clubCardFace:nth-of-type(2) > span.clubCardEyebrow:nth-of-type(2) | top/bottom 770/789.2; left/right -212.8/-106.5px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-confirmation-overlap-detail | Content outside viewport / ancestor crop | #clubCardOne > div.clubPackStage:nth-of-type(2) > div.clubCardFace:nth-of-type(2) > span.clubCardLabel:nth-of-type(3) | top/bottom 770/789.2; left/right -90.5/51.1px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-confirmation-overlap-detail | Content outside viewport / ancestor crop | #clubNameOne | top/bottom 789.2/832.5; left/right -212.8/128px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-confirmation-overlap-detail | Content outside viewport / ancestor crop | #clubCardStateOne | top/bottom 832.5/851.7; left/right -212.8/128px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-confirmation-overlap-detail | Content outside viewport / ancestor crop | #clubPlayerTwo | top/bottom 732.7/769.4; left/right 770.6/808.8px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-confirmation-overlap-detail | Content outside viewport / ancestor crop | #clubCardTwo > div.clubPackStage:nth-of-type(2) > div.clubCardFace:nth-of-type(2) > span.clubCardEyebrow:nth-of-type(2) | top/bottom 770/789.2; left/right 730.6/836.9px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-confirmation-overlap-detail | Content outside viewport / ancestor crop | #clubCardTwo > div.clubPackStage:nth-of-type(2) > div.clubCardFace:nth-of-type(2) > span.clubCardLabel:nth-of-type(3) | top/bottom 770/789.2; left/right 852.9/994.5px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-confirmation-overlap-detail | Content outside viewport / ancestor crop | #clubNameTwo | top/bottom 789.2/832.5; left/right 730.6/1071.4px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-confirmation-overlap-detail | Content outside viewport / ancestor crop | #clubCardStateTwo | top/bottom 832.5/851.7; left/right 730.6/1071.4px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerOne-confirmation-overlap-detail | Primary action in first screenful | #continueClubAssignment | yes; 693×74.6px; top/bottom 890.1/964.7px; CONFIRM SHARED SHOWDOWN; center unobscured yes |
| 768x1024 | playerTwo-confirmation-overlap-detail | Horizontal scrollbar | html / body | no; scroll/client 768/768px; overflow visible/hidden |
| 768x1024 | playerTwo-confirmation-overlap-detail | Element wider than window | #clubWheelScreen | 1 content; 25 decoration |
| 768x1024 | playerTwo-confirmation-overlap-detail | Oversized decoration (crop candidate) | #world | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-confirmation-overlap-detail | Oversized decoration (crop candidate) | #world > div.plateBase:nth-of-type(1) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-confirmation-overlap-detail | Oversized decoration (crop candidate) | #world > div.seamMend.plateDup:nth-of-type(2) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-confirmation-overlap-detail | Oversized decoration (crop candidate) | #covers | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-confirmation-overlap-detail | Oversized decoration (crop candidate) | #covers > polygon:nth-of-type(1) | 1526.5px; left/right -379.3/1147.3px |
| 768x1024 | playerTwo-confirmation-overlap-detail | Oversized decoration (crop candidate) | #covers > polygon:nth-of-type(2) | 1526.5px; left/right -379.3/1147.3px |
| 768x1024 | playerTwo-confirmation-overlap-detail | Oversized decoration (crop candidate) | #covers > polyline | 1526.5px; left/right -379.3/1147.3px |
| 768x1024 | playerTwo-confirmation-overlap-detail | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-confirmation-overlap-detail | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > svg.rvDark:nth-of-type(1) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-confirmation-overlap-detail | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > svg.rvHole:nth-of-type(2) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-confirmation-overlap-detail | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > svg.rvEdge:nth-of-type(3) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-confirmation-overlap-detail | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > svg.rvBurst:nth-of-type(4) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-confirmation-overlap-detail | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > svg.rvVoid:nth-of-type(5) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-confirmation-overlap-detail | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-confirmation-overlap-detail | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > svg.rvDark:nth-of-type(1) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-confirmation-overlap-detail | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > svg.rvHole:nth-of-type(2) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-confirmation-overlap-detail | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > svg.rvEdge:nth-of-type(3) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-confirmation-overlap-detail | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > svg.rvBurst:nth-of-type(4) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-confirmation-overlap-detail | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > svg.rvVoid:nth-of-type(5) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-confirmation-overlap-detail | Oversized decoration (crop candidate) | #world > div.handContact.plateDup:nth-of-type(6) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-confirmation-overlap-detail | Oversized decoration (crop candidate) | #world > div.handCore.plateDup:nth-of-type(7) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-confirmation-overlap-detail | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(8) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-confirmation-overlap-detail | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(9) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-confirmation-overlap-detail | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(10) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-confirmation-overlap-detail | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(11) | 1820.4px; left/right -526.2/1294.2px |
| 768x1024 | playerTwo-confirmation-overlap-detail | Wider than window | #clubWheelScreenScreenTitle | 778.3px; left/right -28.9/749.5px |
| 768x1024 | playerTwo-confirmation-overlap-detail | Touch control <44px | #clubWheelScreen | 0 of 1 visible controls |
| 768x1024 | playerTwo-confirmation-overlap-detail | Text scrollWidth > clientWidth | #clubWheelScreen | 3 candidates |
| 768x1024 | playerTwo-confirmation-overlap-detail | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 408>341px; overflow-x visible; glyph range outside no; Osasuna |
| 768x1024 | playerTwo-confirmation-overlap-detail | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 408>341px; overflow-x visible; glyph range outside no; Espanyol |
| 768x1024 | playerTwo-confirmation-overlap-detail | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 151>140px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 768x1024 | playerTwo-confirmation-overlap-detail | Content outside viewport / ancestor crop | #clubCardOne > span.clubRevealIndex | top/bottom 738.1/766; left/right -212.8/-185.1px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerTwo-confirmation-overlap-detail | Content outside viewport / ancestor crop | #clubPlayerOne | top/bottom 732.7/769.4; left/right -172.8/-100.3px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerTwo-confirmation-overlap-detail | Content outside viewport / ancestor crop | #clubCardOne > div.clubPackStage:nth-of-type(2) > div.clubCardFace:nth-of-type(2) > span.clubCardEyebrow:nth-of-type(2) | top/bottom 770/789.2; left/right -212.8/-106.5px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerTwo-confirmation-overlap-detail | Content outside viewport / ancestor crop | #clubCardOne > div.clubPackStage:nth-of-type(2) > div.clubCardFace:nth-of-type(2) > span.clubCardLabel:nth-of-type(3) | top/bottom 770/789.2; left/right -90.5/51.1px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerTwo-confirmation-overlap-detail | Content outside viewport / ancestor crop | #clubNameOne | top/bottom 789.2/832.5; left/right -212.8/128px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerTwo-confirmation-overlap-detail | Content outside viewport / ancestor crop | #clubCardStateOne | top/bottom 832.5/851.7; left/right -212.8/128px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerTwo-confirmation-overlap-detail | Content outside viewport / ancestor crop | #clubPlayerTwo | top/bottom 732.7/769.4; left/right 770.6/808.8px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerTwo-confirmation-overlap-detail | Content outside viewport / ancestor crop | #clubCardTwo > div.clubPackStage:nth-of-type(2) > div.clubCardFace:nth-of-type(2) > span.clubCardEyebrow:nth-of-type(2) | top/bottom 770/789.2; left/right 730.6/836.9px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerTwo-confirmation-overlap-detail | Content outside viewport / ancestor crop | #clubCardTwo > div.clubPackStage:nth-of-type(2) > div.clubCardFace:nth-of-type(2) > span.clubCardLabel:nth-of-type(3) | top/bottom 770/789.2; left/right 852.9/994.5px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerTwo-confirmation-overlap-detail | Content outside viewport / ancestor crop | #clubNameTwo | top/bottom 789.2/832.5; left/right 730.6/1071.4px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerTwo-confirmation-overlap-detail | Content outside viewport / ancestor crop | #clubCardStateTwo | top/bottom 832.5/851.7; left/right 730.6/1071.4px; outside first viewport; x clipped by #clubWheelScreen; x clipped by #app > main; x clipped by body |
| 768x1024 | playerTwo-confirmation-overlap-detail | Primary action in first screenful | #continueClubAssignment | yes; 693×74.6px; top/bottom 890.1/964.7px; CONFIRM SHARED SHOWDOWN; center unobscured yes |
| 1280x650 | playerOne-sealed | Horizontal scrollbar | html / body | no; scroll/client 1280/1280px; overflow visible/hidden |
| 1280x650 | playerOne-sealed | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 1280x650 | playerOne-sealed | Touch control <44px | #clubWheelScreen | N/A desktop |
| 1280x650 | playerOne-sealed | Text scrollWidth > clientWidth | #clubWheelScreen | 0 candidates |
| 1280x650 | playerOne-sealed | Primary action in first screenful | #openClubPack | yes; 300×44.4px; top/bottom 597/641.4px; OPEN SHOWDOWN PACKS; center unobscured yes |
| 1280x650 | playerOne-provider-working | Horizontal scrollbar | html / body | no; scroll/client 1280/1280px; overflow visible/hidden |
| 1280x650 | playerOne-provider-working | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 1280x650 | playerOne-provider-working | Touch control <44px | #clubWheelScreen | N/A desktop |
| 1280x650 | playerOne-provider-working | Text scrollWidth > clientWidth | #clubWheelScreen | 0 candidates |
| 1280x650 | playerOne-provider-working | Primary action in first screenful | #openClubPack | yes; 300×44.4px; top/bottom 597/641.4px; WORKING…; disabled; center unobscured yes |
| 1280x650 | playerOne-pack-write-failure | Horizontal scrollbar | html / body | no; scroll/client 1280/1280px; overflow visible/hidden |
| 1280x650 | playerOne-pack-write-failure | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 1280x650 | playerOne-pack-write-failure | Touch control <44px | #clubWheelScreen | N/A desktop |
| 1280x650 | playerOne-pack-write-failure | Text scrollWidth > clientWidth | #clubWheelScreen | 0 candidates |
| 1280x650 | playerOne-pack-write-failure | Primary action in first screenful | #openClubPack | yes; 300×44.4px; top/bottom 596/640.4px; OPEN SHOWDOWN PACKS; center unobscured yes |
| 1280x650 | playerOne-opening | Horizontal scrollbar | html / body | no; scroll/client 1280/1280px; overflow visible/hidden |
| 1280x650 | playerOne-opening | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 1280x650 | playerOne-opening | Touch control <44px | #clubWheelScreen | N/A desktop |
| 1280x650 | playerOne-opening | Text scrollWidth > clientWidth | #clubWheelScreen | 1 candidates |
| 1280x650 | playerOne-opening | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span | 139>105px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 1280x650 | playerOne-opening | Primary action in first screenful | none | N/A no visible action |
| 1280x650 | playerOne-manager-one | Horizontal scrollbar | html / body | no; scroll/client 1280/1280px; overflow visible/hidden |
| 1280x650 | playerOne-manager-one | Element wider than window | #clubWheelScreen | 0 content; 18 decoration |
| 1280x650 | playerOne-manager-one | Oversized decoration (crop candidate) | #world | 1289.7px; left/right -4.8/1284.8px |
| 1280x650 | playerOne-manager-one | Oversized decoration (crop candidate) | #world > div.plateBase:nth-of-type(1) | 1289.7px; left/right -4.8/1284.8px |
| 1280x650 | playerOne-manager-one | Oversized decoration (crop candidate) | #world > div.seamMend.plateDup:nth-of-type(2) | 1289.7px; left/right -4.8/1284.8px |
| 1280x650 | playerOne-manager-one | Oversized decoration (crop candidate) | #covers | 1289.7px; left/right -4.8/1284.8px |
| 1280x650 | playerOne-manager-one | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) | 1289.7px; left/right -4.8/1284.8px |
| 1280x650 | playerOne-manager-one | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > svg.rvDark:nth-of-type(1) | 1289.7px; left/right -4.8/1284.8px |
| 1280x650 | playerOne-manager-one | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > svg.rvHole:nth-of-type(2) | 1289.7px; left/right -4.8/1284.8px |
| 1280x650 | playerOne-manager-one | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > svg.rvEdge:nth-of-type(3) | 1289.7px; left/right -4.8/1284.8px |
| 1280x650 | playerOne-manager-one | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > svg.rvVoid:nth-of-type(5) | 1289.7px; left/right -4.8/1284.8px |
| 1280x650 | playerOne-manager-one | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > div.rvHalf.rvHalfLeft.plateDup:nth-of-type(2) | 1330.6px; left/right -32/1298.6px |
| 1280x650 | playerOne-manager-one | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > div.rvHalf.rvHalfRight.plateDup:nth-of-type(3) | 1330.6px; left/right -19.7/1311px |
| 1280x650 | playerOne-manager-one | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > div.rvFlap.plateDup:nth-of-type(5) | 1383.1px; left/right -67.6/1315.6px |
| 1280x650 | playerOne-manager-one | Oversized decoration (crop candidate) | #world > div.handContact.plateDup:nth-of-type(6) | 1289.7px; left/right -4.8/1284.8px |
| 1280x650 | playerOne-manager-one | Oversized decoration (crop candidate) | #world > div.handCore.plateDup:nth-of-type(7) | 1289.7px; left/right -4.8/1284.8px |
| 1280x650 | playerOne-manager-one | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(8) | 1289.7px; left/right -4.8/1284.8px |
| 1280x650 | playerOne-manager-one | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(9) | 1289.7px; left/right -4.8/1284.8px |
| 1280x650 | playerOne-manager-one | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(10) | 1289.7px; left/right -4.8/1284.8px |
| 1280x650 | playerOne-manager-one | Oversized decoration (crop candidate) | #world > div.handOv.plateDup:nth-of-type(11) | 1289.7px; left/right -4.8/1284.8px |
| 1280x650 | playerOne-manager-one | Touch control <44px | #clubWheelScreen | N/A desktop |
| 1280x650 | playerOne-manager-one | Text scrollWidth > clientWidth | #clubWheelScreen | 1 candidates |
| 1280x650 | playerOne-manager-one | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span | 139>105px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 1280x650 | playerOne-manager-one | Primary action in first screenful | none | N/A no visible action |
| 1280x650 | playerOne-manager-two | Horizontal scrollbar | html / body | no; scroll/client 1280/1280px; overflow visible/hidden |
| 1280x650 | playerOne-manager-two | Element wider than window | #clubWheelScreen | 0 content; 1 decoration |
| 1280x650 | playerOne-manager-two | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > div.rvFlap.plateDup:nth-of-type(5) | 1329.8px; left/right -32.7/1297.1px |
| 1280x650 | playerOne-manager-two | Touch control <44px | #clubWheelScreen | N/A desktop |
| 1280x650 | playerOne-manager-two | Text scrollWidth > clientWidth | #clubWheelScreen | 1 candidates |
| 1280x650 | playerOne-manager-two | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span | 139>105px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 1280x650 | playerOne-manager-two | Primary action in first screenful | none | N/A no visible action |
| 1280x650 | playerOne-confirm | Horizontal scrollbar | html / body | no; scroll/client 1280/1280px; overflow visible/hidden |
| 1280x650 | playerOne-confirm | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 1280x650 | playerOne-confirm | Touch control <44px | #clubWheelScreen | N/A desktop |
| 1280x650 | playerOne-confirm | Text scrollWidth > clientWidth | #clubWheelScreen | 2 candidates |
| 1280x650 | playerOne-confirm | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 295>247px; overflow-x visible; glyph range outside no; Espanyol |
| 1280x650 | playerOne-confirm | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 107>105px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 1280x650 | playerOne-confirm | Primary action in first screenful | #continueClubAssignment | yes; 430×44.4px; top/bottom 596/640.4px; CONFIRM SHARED SHOWDOWN; center unobscured yes |
| 1280x650 | playerOne-confirm-write-failure | Horizontal scrollbar | html / body | no; scroll/client 1280/1280px; overflow visible/hidden |
| 1280x650 | playerOne-confirm-write-failure | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 1280x650 | playerOne-confirm-write-failure | Touch control <44px | #clubWheelScreen | N/A desktop |
| 1280x650 | playerOne-confirm-write-failure | Text scrollWidth > clientWidth | #clubWheelScreen | 2 candidates |
| 1280x650 | playerOne-confirm-write-failure | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 295>247px; overflow-x visible; glyph range outside no; Espanyol |
| 1280x650 | playerOne-confirm-write-failure | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 111>105px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 1280x650 | playerOne-confirm-write-failure | Primary action in first screenful | #continueClubAssignment | yes; 430×44.4px; top/bottom 596/640.4px; CONFIRM SHARED SHOWDOWN; center unobscured yes |
| 1280x650 | playerOne-waiting-rival | Horizontal scrollbar | html / body | no; scroll/client 1280/1280px; overflow visible/hidden |
| 1280x650 | playerOne-waiting-rival | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 1280x650 | playerOne-waiting-rival | Touch control <44px | #clubWheelScreen | N/A desktop |
| 1280x650 | playerOne-waiting-rival | Text scrollWidth > clientWidth | #clubWheelScreen | 2 candidates |
| 1280x650 | playerOne-waiting-rival | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 295>247px; overflow-x visible; glyph range outside no; Espanyol |
| 1280x650 | playerOne-waiting-rival | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 111>105px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 1280x650 | playerOne-waiting-rival | Primary action in first screenful | #continueClubAssignment | yes; 430×44.4px; top/bottom 597/641.4px; CONFIRMED · WAITING FOR RIVAL; disabled; center unobscured yes |
| 1280x650 | playerOne-reconnect | Horizontal scrollbar | html / body | no; scroll/client 1280/1280px; overflow visible/hidden |
| 1280x650 | playerOne-reconnect | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 1280x650 | playerOne-reconnect | Touch control <44px | #clubWheelScreen | N/A desktop |
| 1280x650 | playerOne-reconnect | Text scrollWidth > clientWidth | #clubWheelScreen | 2 candidates |
| 1280x650 | playerOne-reconnect | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 295>247px; overflow-x visible; glyph range outside no; Espanyol |
| 1280x650 | playerOne-reconnect | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 111>105px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 1280x650 | playerOne-reconnect | Primary action in first screenful | #continueClubAssignment | yes; 430×44.4px; top/bottom 597/641.4px; RECONNECT PLAYERS TO CONTINUE; disabled; center unobscured yes |
| 1280x650 | playerOne-career-start-ready | Horizontal scrollbar | html / body | no; scroll/client 1280/1280px; overflow visible/hidden |
| 1280x650 | playerOne-career-start-ready | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 1280x650 | playerOne-career-start-ready | Touch control <44px | #clubWheelScreen | N/A desktop |
| 1280x650 | playerOne-career-start-ready | Text scrollWidth > clientWidth | #clubWheelScreen | 2 candidates |
| 1280x650 | playerOne-career-start-ready | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 295>247px; overflow-x visible; glyph range outside no; Espanyol |
| 1280x650 | playerOne-career-start-ready | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 111>105px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 1280x650 | playerOne-career-start-ready | Primary action in first screenful | #continueClubAssignment | yes; 430×44.4px; top/bottom 596/640.4px; CONTINUE TO CAREER START; center unobscured yes |
| 1280x650 | playerOne-season-mismatch | Horizontal scrollbar | html / body | no; scroll/client 1280/1280px; overflow visible/hidden |
| 1280x650 | playerOne-season-mismatch | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 1280x650 | playerOne-season-mismatch | Touch control <44px | #clubWheelScreen | N/A desktop |
| 1280x650 | playerOne-season-mismatch | Text scrollWidth > clientWidth | #clubWheelScreen | 2 candidates |
| 1280x650 | playerOne-season-mismatch | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 295>247px; overflow-x visible; glyph range outside no; Espanyol |
| 1280x650 | playerOne-season-mismatch | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 111>105px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 1280x650 | playerOne-season-mismatch | Primary action in first screenful | #continueClubAssignment | yes; 430×44.4px; top/bottom 597/641.4px; SEASON PLAN MISMATCH · RECOVERY REQUIRED; disabled; center unobscured yes |
| 1280x650 | playerOne-long-club-names | Horizontal scrollbar | html / body | no; scroll/client 1280/1280px; overflow visible/hidden |
| 1280x650 | playerOne-long-club-names | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 1280x650 | playerOne-long-club-names | Touch control <44px | #clubWheelScreen | N/A desktop |
| 1280x650 | playerOne-long-club-names | Text scrollWidth > clientWidth | #clubWheelScreen | 3 candidates |
| 1280x650 | playerOne-long-club-names | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 295>247px; overflow-x visible; glyph range outside no; Deportivo La Coruña |
| 1280x650 | playerOne-long-club-names | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 295>247px; overflow-x visible; glyph range outside no; Borussia Mönchengladbach |
| 1280x650 | playerOne-long-club-names | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 111>105px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 1280x650 | playerOne-long-club-names | Primary action in first screenful | #continueClubAssignment | yes; 430×44.4px; top/bottom 596/640.4px; CONFIRM SHARED SHOWDOWN; center unobscured yes |
| 1280x650 | playerOne-local-ready | Horizontal scrollbar | html / body | no; scroll/client 1280/1280px; overflow visible/hidden |
| 1280x650 | playerOne-local-ready | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 1280x650 | playerOne-local-ready | Touch control <44px | #clubWheelScreen | N/A desktop |
| 1280x650 | playerOne-local-ready | Text scrollWidth > clientWidth | #clubWheelScreen | 2 candidates |
| 1280x650 | playerOne-local-ready | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 295>247px; overflow-x visible; glyph range outside no; ? |
| 1280x650 | playerOne-local-ready | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 295>247px; overflow-x visible; glyph range outside no; ? |
| 1280x650 | playerOne-local-ready | Primary action in first screenful | #openClubPack | yes; 300×44.4px; top/bottom 597/641.4px; OPEN SHOWDOWN PACKS; disabled; center unobscured yes |
| 1280x650 | playerOne-local-opening | Horizontal scrollbar | html / body | no; scroll/client 1280/1280px; overflow visible/hidden |
| 1280x650 | playerOne-local-opening | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 1280x650 | playerOne-local-opening | Touch control <44px | #clubWheelScreen | N/A desktop |
| 1280x650 | playerOne-local-opening | Text scrollWidth > clientWidth | #clubWheelScreen | 2 candidates |
| 1280x650 | playerOne-local-opening | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 295>247px; overflow-x visible; glyph range outside no; ? |
| 1280x650 | playerOne-local-opening | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 295>247px; overflow-x visible; glyph range outside no; ? |
| 1280x650 | playerOne-local-opening | Primary action in first screenful | #openClubPack | yes; 300×44.4px; top/bottom 597/641.4px; DRAW LOCKED...; disabled; center unobscured yes |
| 1280x650 | playerOne-local-manager-one | Horizontal scrollbar | html / body | no; scroll/client 1280/1280px; overflow visible/hidden |
| 1280x650 | playerOne-local-manager-one | Element wider than window | #clubWheelScreen | 0 content; 3 decoration |
| 1280x650 | playerOne-local-manager-one | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > svg.rvBurst:nth-of-type(4) | 1308.4px; left/right -8.6/1299.9px |
| 1280x650 | playerOne-local-manager-one | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > div.rvHalf.rvHalfLeft.plateDup:nth-of-type(2) | 1404.5px; left/right -91.5/1313px |
| 1280x650 | playerOne-local-manager-one | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > div.rvHalf.rvHalfRight.plateDup:nth-of-type(3) | 1404.5px; left/right -46.6/1357.9px |
| 1280x650 | playerOne-local-manager-one | Touch control <44px | #clubWheelScreen | N/A desktop |
| 1280x650 | playerOne-local-manager-one | Text scrollWidth > clientWidth | #clubWheelScreen | 2 candidates |
| 1280x650 | playerOne-local-manager-one | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 295>247px; overflow-x visible; glyph range outside no; Osasuna |
| 1280x650 | playerOne-local-manager-one | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 295>247px; overflow-x visible; glyph range outside no; ? |
| 1280x650 | playerOne-local-manager-one | Primary action in first screenful | #openClubPack | yes; 300×44.4px; top/bottom 597/641.4px; DRAW LOCKED...; disabled; center unobscured yes |
| 1280x650 | playerOne-local-manager-two | Horizontal scrollbar | html / body | no; scroll/client 1280/1280px; overflow visible/hidden |
| 1280x650 | playerOne-local-manager-two | Element wider than window | #clubWheelScreen | 0 content; 3 decoration |
| 1280x650 | playerOne-local-manager-two | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > svg.rvBurst:nth-of-type(4) | 1324.2px; left/right -30.8/1293.4px |
| 1280x650 | playerOne-local-manager-two | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > div.rvHalf.rvHalfLeft.plateDup:nth-of-type(2) | 1370.3px; left/right -56.6/1313.7px |
| 1280x650 | playerOne-local-manager-two | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > div.rvHalf.rvHalfRight.plateDup:nth-of-type(3) | 1370.3px; left/right -27.4/1342.9px |
| 1280x650 | playerOne-local-manager-two | Touch control <44px | #clubWheelScreen | N/A desktop |
| 1280x650 | playerOne-local-manager-two | Text scrollWidth > clientWidth | #clubWheelScreen | 2 candidates |
| 1280x650 | playerOne-local-manager-two | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 295>247px; overflow-x visible; glyph range outside no; Osasuna |
| 1280x650 | playerOne-local-manager-two | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 295>247px; overflow-x visible; glyph range outside no; Espanyol |
| 1280x650 | playerOne-local-manager-two | Primary action in first screenful | #openClubPack | yes; 300×44.4px; top/bottom 597/641.4px; DRAW LOCKED...; disabled; center unobscured yes |
| 1280x650 | playerOne-local-versus | Horizontal scrollbar | html / body | no; scroll/client 1280/1280px; overflow visible/hidden |
| 1280x650 | playerOne-local-versus | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 1280x650 | playerOne-local-versus | Touch control <44px | #clubWheelScreen | N/A desktop |
| 1280x650 | playerOne-local-versus | Text scrollWidth > clientWidth | #clubWheelScreen | 3 candidates |
| 1280x650 | playerOne-local-versus | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 295>247px; overflow-x visible; glyph range outside no; Osasuna |
| 1280x650 | playerOne-local-versus | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 295>247px; overflow-x visible; glyph range outside no; Espanyol |
| 1280x650 | playerOne-local-versus | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 113>105px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 1280x650 | playerOne-local-versus | Primary action in first screenful | none | N/A no visible action |
| 1280x650 | playerOne-local-confirmation | Horizontal scrollbar | html / body | no; scroll/client 1280/1280px; overflow visible/hidden |
| 1280x650 | playerOne-local-confirmation | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 1280x650 | playerOne-local-confirmation | Touch control <44px | #clubWheelScreen | N/A desktop |
| 1280x650 | playerOne-local-confirmation | Text scrollWidth > clientWidth | #clubWheelScreen | 3 candidates |
| 1280x650 | playerOne-local-confirmation | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 295>247px; overflow-x visible; glyph range outside no; Osasuna |
| 1280x650 | playerOne-local-confirmation | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 295>247px; overflow-x visible; glyph range outside no; Espanyol |
| 1280x650 | playerOne-local-confirmation | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 111>105px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 1280x650 | playerOne-local-confirmation | Primary action in first screenful | #continueClubAssignment | yes; 430×44.4px; top/bottom 596/640.4px; CONFIRM RIVALRY & START SHOWDOWN; center unobscured yes |
| 1280x650 | playerTwo-sealed | Horizontal scrollbar | html / body | no; scroll/client 1280/1280px; overflow visible/hidden |
| 1280x650 | playerTwo-sealed | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 1280x650 | playerTwo-sealed | Touch control <44px | #clubWheelScreen | N/A desktop |
| 1280x650 | playerTwo-sealed | Text scrollWidth > clientWidth | #clubWheelScreen | 0 candidates |
| 1280x650 | playerTwo-sealed | Primary action in first screenful | #openClubPack | yes; 300×44.4px; top/bottom 597/641.4px; WAITING FOR HOST PACK REVEAL; disabled; center unobscured yes |
| 1280x650 | playerTwo-opening | Horizontal scrollbar | html / body | no; scroll/client 1280/1280px; overflow visible/hidden |
| 1280x650 | playerTwo-opening | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 1280x650 | playerTwo-opening | Touch control <44px | #clubWheelScreen | N/A desktop |
| 1280x650 | playerTwo-opening | Text scrollWidth > clientWidth | #clubWheelScreen | 1 candidates |
| 1280x650 | playerTwo-opening | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span | 139>105px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 1280x650 | playerTwo-opening | Primary action in first screenful | none | N/A no visible action |
| 1280x650 | playerTwo-manager-one | Horizontal scrollbar | html / body | no; scroll/client 1280/1280px; overflow visible/hidden |
| 1280x650 | playerTwo-manager-one | Element wider than window | #clubWheelScreen | 0 content; 1 decoration |
| 1280x650 | playerTwo-manager-one | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > div.rvFlap.plateDup:nth-of-type(5) | 1338.5px; left/right -22.3/1316.2px |
| 1280x650 | playerTwo-manager-one | Touch control <44px | #clubWheelScreen | N/A desktop |
| 1280x650 | playerTwo-manager-one | Text scrollWidth > clientWidth | #clubWheelScreen | 1 candidates |
| 1280x650 | playerTwo-manager-one | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span | 139>105px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 1280x650 | playerTwo-manager-one | Primary action in first screenful | none | N/A no visible action |
| 1280x650 | playerTwo-manager-two | Horizontal scrollbar | html / body | no; scroll/client 1280/1280px; overflow visible/hidden |
| 1280x650 | playerTwo-manager-two | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 1280x650 | playerTwo-manager-two | Touch control <44px | #clubWheelScreen | N/A desktop |
| 1280x650 | playerTwo-manager-two | Text scrollWidth > clientWidth | #clubWheelScreen | 2 candidates |
| 1280x650 | playerTwo-manager-two | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 295>247px; overflow-x visible; glyph range outside no; Osasuna |
| 1280x650 | playerTwo-manager-two | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span | 139>105px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 1280x650 | playerTwo-manager-two | Primary action in first screenful | none | N/A no visible action |
| 1280x650 | playerTwo-clubs-locked-awaiting-season | Horizontal scrollbar | html / body | no; scroll/client 1280/1280px; overflow visible/hidden |
| 1280x650 | playerTwo-clubs-locked-awaiting-season | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 1280x650 | playerTwo-clubs-locked-awaiting-season | Touch control <44px | #clubWheelScreen | N/A desktop |
| 1280x650 | playerTwo-clubs-locked-awaiting-season | Text scrollWidth > clientWidth | #clubWheelScreen | 2 candidates |
| 1280x650 | playerTwo-clubs-locked-awaiting-season | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 295>247px; overflow-x visible; glyph range outside no; Osasuna |
| 1280x650 | playerTwo-clubs-locked-awaiting-season | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 106>105px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 1280x650 | playerTwo-clubs-locked-awaiting-season | Primary action in first screenful | none | N/A no visible action |
| 1280x650 | playerTwo-confirm | Horizontal scrollbar | html / body | no; scroll/client 1280/1280px; overflow visible/hidden |
| 1280x650 | playerTwo-confirm | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 1280x650 | playerTwo-confirm | Touch control <44px | #clubWheelScreen | N/A desktop |
| 1280x650 | playerTwo-confirm | Text scrollWidth > clientWidth | #clubWheelScreen | 2 candidates |
| 1280x650 | playerTwo-confirm | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 295>247px; overflow-x visible; glyph range outside no; Osasuna |
| 1280x650 | playerTwo-confirm | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 111>105px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 1280x650 | playerTwo-confirm | Primary action in first screenful | #continueClubAssignment | yes; 430×44.4px; top/bottom 596.7/641.1px; CONFIRM SHARED SHOWDOWN; center unobscured yes |
| 1280x650 | playerTwo-confirm-write-failure | Horizontal scrollbar | html / body | no; scroll/client 1280/1280px; overflow visible/hidden |
| 1280x650 | playerTwo-confirm-write-failure | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 1280x650 | playerTwo-confirm-write-failure | Touch control <44px | #clubWheelScreen | N/A desktop |
| 1280x650 | playerTwo-confirm-write-failure | Text scrollWidth > clientWidth | #clubWheelScreen | 2 candidates |
| 1280x650 | playerTwo-confirm-write-failure | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 295>247px; overflow-x visible; glyph range outside no; Osasuna |
| 1280x650 | playerTwo-confirm-write-failure | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 111>105px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 1280x650 | playerTwo-confirm-write-failure | Primary action in first screenful | #continueClubAssignment | yes; 430×44.4px; top/bottom 596/640.4px; CONFIRM SHARED SHOWDOWN; center unobscured yes |
| 1280x650 | playerTwo-waiting-rival | Horizontal scrollbar | html / body | no; scroll/client 1280/1280px; overflow visible/hidden |
| 1280x650 | playerTwo-waiting-rival | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 1280x650 | playerTwo-waiting-rival | Touch control <44px | #clubWheelScreen | N/A desktop |
| 1280x650 | playerTwo-waiting-rival | Text scrollWidth > clientWidth | #clubWheelScreen | 2 candidates |
| 1280x650 | playerTwo-waiting-rival | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 295>247px; overflow-x visible; glyph range outside no; Osasuna |
| 1280x650 | playerTwo-waiting-rival | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 111>105px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 1280x650 | playerTwo-waiting-rival | Primary action in first screenful | #continueClubAssignment | yes; 430×44.4px; top/bottom 597/641.4px; CONFIRMED · WAITING FOR RIVAL; disabled; center unobscured yes |
| 1280x650 | playerTwo-reconnect | Horizontal scrollbar | html / body | no; scroll/client 1280/1280px; overflow visible/hidden |
| 1280x650 | playerTwo-reconnect | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 1280x650 | playerTwo-reconnect | Touch control <44px | #clubWheelScreen | N/A desktop |
| 1280x650 | playerTwo-reconnect | Text scrollWidth > clientWidth | #clubWheelScreen | 2 candidates |
| 1280x650 | playerTwo-reconnect | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 295>247px; overflow-x visible; glyph range outside no; Osasuna |
| 1280x650 | playerTwo-reconnect | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 111>105px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 1280x650 | playerTwo-reconnect | Primary action in first screenful | #continueClubAssignment | yes; 430×44.4px; top/bottom 597/641.4px; RECONNECT PLAYERS TO CONTINUE; disabled; center unobscured yes |
| 1280x650 | playerTwo-career-start-ready | Horizontal scrollbar | html / body | no; scroll/client 1280/1280px; overflow visible/hidden |
| 1280x650 | playerTwo-career-start-ready | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 1280x650 | playerTwo-career-start-ready | Touch control <44px | #clubWheelScreen | N/A desktop |
| 1280x650 | playerTwo-career-start-ready | Text scrollWidth > clientWidth | #clubWheelScreen | 2 candidates |
| 1280x650 | playerTwo-career-start-ready | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 295>247px; overflow-x visible; glyph range outside no; Osasuna |
| 1280x650 | playerTwo-career-start-ready | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 111>105px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 1280x650 | playerTwo-career-start-ready | Primary action in first screenful | #continueClubAssignment | yes; 430×44.4px; top/bottom 596/640.4px; CONTINUE TO CAREER START; center unobscured yes |
| 1280x650 | playerTwo-season-mismatch | Horizontal scrollbar | html / body | no; scroll/client 1280/1280px; overflow visible/hidden |
| 1280x650 | playerTwo-season-mismatch | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 1280x650 | playerTwo-season-mismatch | Touch control <44px | #clubWheelScreen | N/A desktop |
| 1280x650 | playerTwo-season-mismatch | Text scrollWidth > clientWidth | #clubWheelScreen | 2 candidates |
| 1280x650 | playerTwo-season-mismatch | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 295>247px; overflow-x visible; glyph range outside no; Osasuna |
| 1280x650 | playerTwo-season-mismatch | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 111>105px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 1280x650 | playerTwo-season-mismatch | Primary action in first screenful | #continueClubAssignment | yes; 430×44.4px; top/bottom 597/641.4px; SEASON PLAN MISMATCH · RECOVERY REQUIRED; disabled; center unobscured yes |
| 1280x650 | playerTwo-long-club-names | Horizontal scrollbar | html / body | no; scroll/client 1280/1280px; overflow visible/hidden |
| 1280x650 | playerTwo-long-club-names | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 1280x650 | playerTwo-long-club-names | Touch control <44px | #clubWheelScreen | N/A desktop |
| 1280x650 | playerTwo-long-club-names | Text scrollWidth > clientWidth | #clubWheelScreen | 3 candidates |
| 1280x650 | playerTwo-long-club-names | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 295>247px; overflow-x visible; glyph range outside no; Deportivo La Coruña |
| 1280x650 | playerTwo-long-club-names | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 295>247px; overflow-x visible; glyph range outside no; Borussia Mönchengladbach |
| 1280x650 | playerTwo-long-club-names | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 111>105px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 1280x650 | playerTwo-long-club-names | Primary action in first screenful | #continueClubAssignment | yes; 430×44.4px; top/bottom 596/640.4px; CONFIRM SHARED SHOWDOWN; center unobscured yes |
| 1280x650 | playerOne-confirmation-overlap-detail | Horizontal scrollbar | html / body | no; scroll/client 1280/1280px; overflow visible/hidden |
| 1280x650 | playerOne-confirmation-overlap-detail | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 1280x650 | playerOne-confirmation-overlap-detail | Touch control <44px | #clubWheelScreen | N/A desktop |
| 1280x650 | playerOne-confirmation-overlap-detail | Text scrollWidth > clientWidth | #clubWheelScreen | 3 candidates |
| 1280x650 | playerOne-confirmation-overlap-detail | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 295>247px; overflow-x visible; glyph range outside no; Osasuna |
| 1280x650 | playerOne-confirmation-overlap-detail | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 295>247px; overflow-x visible; glyph range outside no; Espanyol |
| 1280x650 | playerOne-confirmation-overlap-detail | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 112>105px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 1280x650 | playerOne-confirmation-overlap-detail | Overlap | #clubNameOne / #continueClubAssignment | 35×2.5px intersection |
| 1280x650 | playerOne-confirmation-overlap-detail | Primary action in first screenful | #continueClubAssignment | yes; 430×44.4px; top/bottom 596/640.4px; CONFIRM SHARED SHOWDOWN; center unobscured yes |
| 1280x650 | playerTwo-confirmation-overlap-detail | Horizontal scrollbar | html / body | no; scroll/client 1280/1280px; overflow visible/hidden |
| 1280x650 | playerTwo-confirmation-overlap-detail | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 1280x650 | playerTwo-confirmation-overlap-detail | Touch control <44px | #clubWheelScreen | N/A desktop |
| 1280x650 | playerTwo-confirmation-overlap-detail | Text scrollWidth > clientWidth | #clubWheelScreen | 2 candidates |
| 1280x650 | playerTwo-confirmation-overlap-detail | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 295>247px; overflow-x visible; glyph range outside no; Espanyol |
| 1280x650 | playerTwo-confirmation-overlap-detail | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 113>105px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 1280x650 | playerTwo-confirmation-overlap-detail | Overlap | #clubNameOne / #continueClubAssignment | 35×2.5px intersection |
| 1280x650 | playerTwo-confirmation-overlap-detail | Primary action in first screenful | #continueClubAssignment | yes; 430×44.4px; top/bottom 596/640.4px; CONFIRM SHARED SHOWDOWN; center unobscured yes |
| 1366x768 | playerOne-sealed | Horizontal scrollbar | html / body | no; scroll/client 1366/1366px; overflow visible/hidden |
| 1366x768 | playerOne-sealed | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 1366x768 | playerOne-sealed | Touch control <44px | #clubWheelScreen | N/A desktop |
| 1366x768 | playerOne-sealed | Text scrollWidth > clientWidth | #clubWheelScreen | 0 candidates |
| 1366x768 | playerOne-sealed | Primary action in first screenful | #openClubPack | yes; 400×56px; top/bottom 667.7/723.7px; OPEN SHOWDOWN PACKS; center unobscured yes |
| 1366x768 | playerOne-provider-working | Horizontal scrollbar | html / body | no; scroll/client 1366/1366px; overflow visible/hidden |
| 1366x768 | playerOne-provider-working | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 1366x768 | playerOne-provider-working | Touch control <44px | #clubWheelScreen | N/A desktop |
| 1366x768 | playerOne-provider-working | Text scrollWidth > clientWidth | #clubWheelScreen | 0 candidates |
| 1366x768 | playerOne-provider-working | Primary action in first screenful | #openClubPack | yes; 400×56px; top/bottom 667.7/723.7px; WORKING…; disabled; center unobscured yes |
| 1366x768 | playerOne-pack-write-failure | Horizontal scrollbar | html / body | no; scroll/client 1366/1366px; overflow visible/hidden |
| 1366x768 | playerOne-pack-write-failure | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 1366x768 | playerOne-pack-write-failure | Touch control <44px | #clubWheelScreen | N/A desktop |
| 1366x768 | playerOne-pack-write-failure | Text scrollWidth > clientWidth | #clubWheelScreen | 0 candidates |
| 1366x768 | playerOne-pack-write-failure | Primary action in first screenful | #openClubPack | yes; 400×56px; top/bottom 666.7/722.7px; OPEN SHOWDOWN PACKS; center unobscured yes |
| 1366x768 | playerOne-opening | Horizontal scrollbar | html / body | no; scroll/client 1366/1366px; overflow visible/hidden |
| 1366x768 | playerOne-opening | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 1366x768 | playerOne-opening | Touch control <44px | #clubWheelScreen | N/A desktop |
| 1366x768 | playerOne-opening | Text scrollWidth > clientWidth | #clubWheelScreen | 1 candidates |
| 1366x768 | playerOne-opening | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span | 139>105px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 1366x768 | playerOne-opening | Primary action in first screenful | none | N/A no visible action |
| 1366x768 | playerOne-manager-one | Horizontal scrollbar | html / body | no; scroll/client 1366/1366px; overflow visible/hidden |
| 1366x768 | playerOne-manager-one | Element wider than window | #clubWheelScreen | 0 content; 1 decoration |
| 1366x768 | playerOne-manager-one | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > div.rvFlap.plateDup:nth-of-type(5) | 1419.3px; left/right -18.5/1400.8px |
| 1366x768 | playerOne-manager-one | Touch control <44px | #clubWheelScreen | N/A desktop |
| 1366x768 | playerOne-manager-one | Text scrollWidth > clientWidth | #clubWheelScreen | 1 candidates |
| 1366x768 | playerOne-manager-one | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span | 139>105px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 1366x768 | playerOne-manager-one | Primary action in first screenful | none | N/A no visible action |
| 1366x768 | playerOne-manager-two | Horizontal scrollbar | html / body | no; scroll/client 1366/1366px; overflow visible/hidden |
| 1366x768 | playerOne-manager-two | Element wider than window | #clubWheelScreen | 0 content; 1 decoration |
| 1366x768 | playerOne-manager-two | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > div.rvFlap.plateDup:nth-of-type(5) | 1393.8px; left/right -17.2/1376.6px |
| 1366x768 | playerOne-manager-two | Touch control <44px | #clubWheelScreen | N/A desktop |
| 1366x768 | playerOne-manager-two | Text scrollWidth > clientWidth | #clubWheelScreen | 2 candidates |
| 1366x768 | playerOne-manager-two | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 287>256px; overflow-x visible; glyph range outside no; Osasuna |
| 1366x768 | playerOne-manager-two | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span | 139>105px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 1366x768 | playerOne-manager-two | Primary action in first screenful | none | N/A no visible action |
| 1366x768 | playerOne-confirm | Horizontal scrollbar | html / body | no; scroll/client 1366/1366px; overflow visible/hidden |
| 1366x768 | playerOne-confirm | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 1366x768 | playerOne-confirm | Touch control <44px | #clubWheelScreen | N/A desktop |
| 1366x768 | playerOne-confirm | Text scrollWidth > clientWidth | #clubWheelScreen | 3 candidates |
| 1366x768 | playerOne-confirm | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 306>256px; overflow-x visible; glyph range outside no; Osasuna |
| 1366x768 | playerOne-confirm | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 306>256px; overflow-x visible; glyph range outside no; Espanyol |
| 1366x768 | playerOne-confirm | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 111>105px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 1366x768 | playerOne-confirm | Primary action in first screenful | #continueClubAssignment | yes; 520×56px; top/bottom 666.7/722.7px; CONFIRM SHARED SHOWDOWN; center unobscured yes |
| 1366x768 | playerOne-confirm-write-failure | Horizontal scrollbar | html / body | no; scroll/client 1366/1366px; overflow visible/hidden |
| 1366x768 | playerOne-confirm-write-failure | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 1366x768 | playerOne-confirm-write-failure | Touch control <44px | #clubWheelScreen | N/A desktop |
| 1366x768 | playerOne-confirm-write-failure | Text scrollWidth > clientWidth | #clubWheelScreen | 3 candidates |
| 1366x768 | playerOne-confirm-write-failure | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 306>256px; overflow-x visible; glyph range outside no; Osasuna |
| 1366x768 | playerOne-confirm-write-failure | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 306>256px; overflow-x visible; glyph range outside no; Espanyol |
| 1366x768 | playerOne-confirm-write-failure | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 111>105px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 1366x768 | playerOne-confirm-write-failure | Primary action in first screenful | #continueClubAssignment | yes; 520×56px; top/bottom 666.7/722.7px; CONFIRM SHARED SHOWDOWN; center unobscured yes |
| 1366x768 | playerOne-waiting-rival | Horizontal scrollbar | html / body | no; scroll/client 1366/1366px; overflow visible/hidden |
| 1366x768 | playerOne-waiting-rival | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 1366x768 | playerOne-waiting-rival | Touch control <44px | #clubWheelScreen | N/A desktop |
| 1366x768 | playerOne-waiting-rival | Text scrollWidth > clientWidth | #clubWheelScreen | 3 candidates |
| 1366x768 | playerOne-waiting-rival | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 306>256px; overflow-x visible; glyph range outside no; Osasuna |
| 1366x768 | playerOne-waiting-rival | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 306>256px; overflow-x visible; glyph range outside no; Espanyol |
| 1366x768 | playerOne-waiting-rival | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 111>105px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 1366x768 | playerOne-waiting-rival | Primary action in first screenful | #continueClubAssignment | yes; 520×56px; top/bottom 667.7/723.7px; CONFIRMED · WAITING FOR RIVAL; disabled; center unobscured yes |
| 1366x768 | playerOne-reconnect | Horizontal scrollbar | html / body | no; scroll/client 1366/1366px; overflow visible/hidden |
| 1366x768 | playerOne-reconnect | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 1366x768 | playerOne-reconnect | Touch control <44px | #clubWheelScreen | N/A desktop |
| 1366x768 | playerOne-reconnect | Text scrollWidth > clientWidth | #clubWheelScreen | 3 candidates |
| 1366x768 | playerOne-reconnect | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 306>256px; overflow-x visible; glyph range outside no; Osasuna |
| 1366x768 | playerOne-reconnect | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 306>256px; overflow-x visible; glyph range outside no; Espanyol |
| 1366x768 | playerOne-reconnect | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 111>105px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 1366x768 | playerOne-reconnect | Primary action in first screenful | #continueClubAssignment | yes; 520×56px; top/bottom 667.7/723.7px; RECONNECT PLAYERS TO CONTINUE; disabled; center unobscured yes |
| 1366x768 | playerOne-career-start-ready | Horizontal scrollbar | html / body | no; scroll/client 1366/1366px; overflow visible/hidden |
| 1366x768 | playerOne-career-start-ready | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 1366x768 | playerOne-career-start-ready | Touch control <44px | #clubWheelScreen | N/A desktop |
| 1366x768 | playerOne-career-start-ready | Text scrollWidth > clientWidth | #clubWheelScreen | 3 candidates |
| 1366x768 | playerOne-career-start-ready | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 306>256px; overflow-x visible; glyph range outside no; Osasuna |
| 1366x768 | playerOne-career-start-ready | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 306>256px; overflow-x visible; glyph range outside no; Espanyol |
| 1366x768 | playerOne-career-start-ready | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 111>105px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 1366x768 | playerOne-career-start-ready | Primary action in first screenful | #continueClubAssignment | yes; 520×56px; top/bottom 666.7/722.7px; CONTINUE TO CAREER START; center unobscured yes |
| 1366x768 | playerOne-season-mismatch | Horizontal scrollbar | html / body | no; scroll/client 1366/1366px; overflow visible/hidden |
| 1366x768 | playerOne-season-mismatch | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 1366x768 | playerOne-season-mismatch | Touch control <44px | #clubWheelScreen | N/A desktop |
| 1366x768 | playerOne-season-mismatch | Text scrollWidth > clientWidth | #clubWheelScreen | 3 candidates |
| 1366x768 | playerOne-season-mismatch | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 306>256px; overflow-x visible; glyph range outside no; Osasuna |
| 1366x768 | playerOne-season-mismatch | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 306>256px; overflow-x visible; glyph range outside no; Espanyol |
| 1366x768 | playerOne-season-mismatch | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 111>105px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 1366x768 | playerOne-season-mismatch | Primary action in first screenful | #continueClubAssignment | yes; 520×56px; top/bottom 667.7/723.7px; SEASON PLAN MISMATCH · RECOVERY REQUIRED; disabled; center unobscured yes |
| 1366x768 | playerOne-long-club-names | Horizontal scrollbar | html / body | no; scroll/client 1366/1366px; overflow visible/hidden |
| 1366x768 | playerOne-long-club-names | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 1366x768 | playerOne-long-club-names | Touch control <44px | #clubWheelScreen | N/A desktop |
| 1366x768 | playerOne-long-club-names | Text scrollWidth > clientWidth | #clubWheelScreen | 3 candidates |
| 1366x768 | playerOne-long-club-names | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 306>256px; overflow-x visible; glyph range outside no; Deportivo La Coruña |
| 1366x768 | playerOne-long-club-names | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 306>256px; overflow-x visible; glyph range outside yes; Borussia Mönchengladbach |
| 1366x768 | playerOne-long-club-names | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 111>105px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 1366x768 | playerOne-long-club-names | Overlap | .clubRivalryLockNote / #continueClubAssignment | 370×21.8px intersection |
| 1366x768 | playerOne-long-club-names | Primary action in first screenful | #continueClubAssignment | yes; 520×56px; top/bottom 666.7/722.7px; CONFIRM SHARED SHOWDOWN; center unobscured yes |
| 1366x768 | playerOne-local-ready | Horizontal scrollbar | html / body | no; scroll/client 1366/1366px; overflow visible/hidden |
| 1366x768 | playerOne-local-ready | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 1366x768 | playerOne-local-ready | Touch control <44px | #clubWheelScreen | N/A desktop |
| 1366x768 | playerOne-local-ready | Text scrollWidth > clientWidth | #clubWheelScreen | 2 candidates |
| 1366x768 | playerOne-local-ready | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 306>256px; overflow-x visible; glyph range outside no; ? |
| 1366x768 | playerOne-local-ready | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 306>256px; overflow-x visible; glyph range outside no; ? |
| 1366x768 | playerOne-local-ready | Primary action in first screenful | #openClubPack | yes; 400×56px; top/bottom 667.7/723.7px; OPEN SHOWDOWN PACKS; disabled; center unobscured yes |
| 1366x768 | playerOne-local-opening | Horizontal scrollbar | html / body | no; scroll/client 1366/1366px; overflow visible/hidden |
| 1366x768 | playerOne-local-opening | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 1366x768 | playerOne-local-opening | Touch control <44px | #clubWheelScreen | N/A desktop |
| 1366x768 | playerOne-local-opening | Text scrollWidth > clientWidth | #clubWheelScreen | 2 candidates |
| 1366x768 | playerOne-local-opening | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 306>256px; overflow-x visible; glyph range outside no; ? |
| 1366x768 | playerOne-local-opening | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 306>256px; overflow-x visible; glyph range outside no; ? |
| 1366x768 | playerOne-local-opening | Primary action in first screenful | #openClubPack | yes; 400×56px; top/bottom 667.7/723.7px; DRAW LOCKED...; disabled; center unobscured yes |
| 1366x768 | playerOne-local-manager-one | Horizontal scrollbar | html / body | no; scroll/client 1366/1366px; overflow visible/hidden |
| 1366x768 | playerOne-local-manager-one | Element wider than window | #clubWheelScreen | 0 content; 3 decoration |
| 1366x768 | playerOne-local-manager-one | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > svg.rvBurst:nth-of-type(4) | 1369.4px; left/right -1/1368.4px |
| 1366x768 | playerOne-local-manager-one | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > div.rvHalf.rvHalfLeft.plateDup:nth-of-type(2) | 1511.3px; left/right -109.4/1401.8px |
| 1366x768 | playerOne-local-manager-one | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > div.rvHalf.rvHalfRight.plateDup:nth-of-type(3) | 1511.3px; left/right -54.4/1456.9px |
| 1366x768 | playerOne-local-manager-one | Touch control <44px | #clubWheelScreen | N/A desktop |
| 1366x768 | playerOne-local-manager-one | Text scrollWidth > clientWidth | #clubWheelScreen | 2 candidates |
| 1366x768 | playerOne-local-manager-one | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 306>256px; overflow-x visible; glyph range outside no; Osasuna |
| 1366x768 | playerOne-local-manager-one | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 306>256px; overflow-x visible; glyph range outside no; ? |
| 1366x768 | playerOne-local-manager-one | Primary action in first screenful | #openClubPack | yes; 400×56px; top/bottom 667.7/723.7px; DRAW LOCKED...; disabled; center unobscured yes |
| 1366x768 | playerOne-local-manager-two | Horizontal scrollbar | html / body | no; scroll/client 1366/1366px; overflow visible/hidden |
| 1366x768 | playerOne-local-manager-two | Element wider than window | #clubWheelScreen | 0 content; 3 decoration |
| 1366x768 | playerOne-local-manager-two | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > svg.rvBurst:nth-of-type(4) | 1413.2px; left/right -32.9/1380.3px |
| 1366x768 | playerOne-local-manager-two | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > div.rvHalf.rvHalfLeft.plateDup:nth-of-type(2) | 1462.4px; left/right -60.5/1401.9px |
| 1366x768 | playerOne-local-manager-two | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > div.rvHalf.rvHalfRight.plateDup:nth-of-type(3) | 1462.4px; left/right -29.3/1433.1px |
| 1366x768 | playerOne-local-manager-two | Touch control <44px | #clubWheelScreen | N/A desktop |
| 1366x768 | playerOne-local-manager-two | Text scrollWidth > clientWidth | #clubWheelScreen | 2 candidates |
| 1366x768 | playerOne-local-manager-two | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 306>256px; overflow-x visible; glyph range outside no; Osasuna |
| 1366x768 | playerOne-local-manager-two | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 306>256px; overflow-x visible; glyph range outside no; Espanyol |
| 1366x768 | playerOne-local-manager-two | Primary action in first screenful | #openClubPack | yes; 400×56px; top/bottom 667.7/723.7px; DRAW LOCKED...; disabled; center unobscured yes |
| 1366x768 | playerOne-local-versus | Horizontal scrollbar | html / body | no; scroll/client 1366/1366px; overflow visible/hidden |
| 1366x768 | playerOne-local-versus | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 1366x768 | playerOne-local-versus | Touch control <44px | #clubWheelScreen | N/A desktop |
| 1366x768 | playerOne-local-versus | Text scrollWidth > clientWidth | #clubWheelScreen | 3 candidates |
| 1366x768 | playerOne-local-versus | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 306>256px; overflow-x visible; glyph range outside no; Osasuna |
| 1366x768 | playerOne-local-versus | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 306>256px; overflow-x visible; glyph range outside no; Espanyol |
| 1366x768 | playerOne-local-versus | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 111>105px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 1366x768 | playerOne-local-versus | Primary action in first screenful | none | N/A no visible action |
| 1366x768 | playerOne-local-confirmation | Horizontal scrollbar | html / body | no; scroll/client 1366/1366px; overflow visible/hidden |
| 1366x768 | playerOne-local-confirmation | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 1366x768 | playerOne-local-confirmation | Touch control <44px | #clubWheelScreen | N/A desktop |
| 1366x768 | playerOne-local-confirmation | Text scrollWidth > clientWidth | #clubWheelScreen | 3 candidates |
| 1366x768 | playerOne-local-confirmation | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 306>256px; overflow-x visible; glyph range outside no; Osasuna |
| 1366x768 | playerOne-local-confirmation | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 306>256px; overflow-x visible; glyph range outside no; Espanyol |
| 1366x768 | playerOne-local-confirmation | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 111>105px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 1366x768 | playerOne-local-confirmation | Primary action in first screenful | #continueClubAssignment | yes; 520×56px; top/bottom 666.7/722.7px; CONFIRM RIVALRY & START SHOWDOWN; center unobscured yes |
| 1366x768 | playerTwo-sealed | Horizontal scrollbar | html / body | no; scroll/client 1366/1366px; overflow visible/hidden |
| 1366x768 | playerTwo-sealed | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 1366x768 | playerTwo-sealed | Touch control <44px | #clubWheelScreen | N/A desktop |
| 1366x768 | playerTwo-sealed | Text scrollWidth > clientWidth | #clubWheelScreen | 0 candidates |
| 1366x768 | playerTwo-sealed | Primary action in first screenful | #openClubPack | yes; 400×56px; top/bottom 667.7/723.7px; WAITING FOR HOST PACK REVEAL; disabled; center unobscured yes |
| 1366x768 | playerTwo-opening | Horizontal scrollbar | html / body | no; scroll/client 1366/1366px; overflow visible/hidden |
| 1366x768 | playerTwo-opening | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 1366x768 | playerTwo-opening | Touch control <44px | #clubWheelScreen | N/A desktop |
| 1366x768 | playerTwo-opening | Text scrollWidth > clientWidth | #clubWheelScreen | 1 candidates |
| 1366x768 | playerTwo-opening | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span | 139>105px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 1366x768 | playerTwo-opening | Primary action in first screenful | none | N/A no visible action |
| 1366x768 | playerTwo-manager-one | Horizontal scrollbar | html / body | no; scroll/client 1366/1366px; overflow visible/hidden |
| 1366x768 | playerTwo-manager-one | Element wider than window | #clubWheelScreen | 0 content; 1 decoration |
| 1366x768 | playerTwo-manager-one | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > div.rvFlap.plateDup:nth-of-type(5) | 1368.8px; left/right -1.2/1367.6px |
| 1366x768 | playerTwo-manager-one | Touch control <44px | #clubWheelScreen | N/A desktop |
| 1366x768 | playerTwo-manager-one | Text scrollWidth > clientWidth | #clubWheelScreen | 1 candidates |
| 1366x768 | playerTwo-manager-one | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span | 139>105px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 1366x768 | playerTwo-manager-one | Primary action in first screenful | none | N/A no visible action |
| 1366x768 | playerTwo-manager-two | Horizontal scrollbar | html / body | no; scroll/client 1366/1366px; overflow visible/hidden |
| 1366x768 | playerTwo-manager-two | Element wider than window | #clubWheelScreen | 0 content; 1 decoration |
| 1366x768 | playerTwo-manager-two | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > div.rvFlap.plateDup:nth-of-type(5) | 1368.8px; left/right -1.6/1367.2px |
| 1366x768 | playerTwo-manager-two | Touch control <44px | #clubWheelScreen | N/A desktop |
| 1366x768 | playerTwo-manager-two | Text scrollWidth > clientWidth | #clubWheelScreen | 1 candidates |
| 1366x768 | playerTwo-manager-two | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span | 139>105px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 1366x768 | playerTwo-manager-two | Primary action in first screenful | none | N/A no visible action |
| 1366x768 | playerTwo-clubs-locked-awaiting-season | Horizontal scrollbar | html / body | no; scroll/client 1366/1366px; overflow visible/hidden |
| 1366x768 | playerTwo-clubs-locked-awaiting-season | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 1366x768 | playerTwo-clubs-locked-awaiting-season | Touch control <44px | #clubWheelScreen | N/A desktop |
| 1366x768 | playerTwo-clubs-locked-awaiting-season | Text scrollWidth > clientWidth | #clubWheelScreen | 1 candidates |
| 1366x768 | playerTwo-clubs-locked-awaiting-season | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 106>105px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 1366x768 | playerTwo-clubs-locked-awaiting-season | Primary action in first screenful | none | N/A no visible action |
| 1366x768 | playerTwo-confirm | Horizontal scrollbar | html / body | no; scroll/client 1366/1366px; overflow visible/hidden |
| 1366x768 | playerTwo-confirm | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 1366x768 | playerTwo-confirm | Touch control <44px | #clubWheelScreen | N/A desktop |
| 1366x768 | playerTwo-confirm | Text scrollWidth > clientWidth | #clubWheelScreen | 1 candidates |
| 1366x768 | playerTwo-confirm | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 111>105px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 1366x768 | playerTwo-confirm | Primary action in first screenful | #continueClubAssignment | yes; 520×56px; top/bottom 667.7/723.7px; CONFIRM SHARED SHOWDOWN; center unobscured yes |
| 1366x768 | playerTwo-confirm-write-failure | Horizontal scrollbar | html / body | no; scroll/client 1366/1366px; overflow visible/hidden |
| 1366x768 | playerTwo-confirm-write-failure | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 1366x768 | playerTwo-confirm-write-failure | Touch control <44px | #clubWheelScreen | N/A desktop |
| 1366x768 | playerTwo-confirm-write-failure | Text scrollWidth > clientWidth | #clubWheelScreen | 1 candidates |
| 1366x768 | playerTwo-confirm-write-failure | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 111>105px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 1366x768 | playerTwo-confirm-write-failure | Primary action in first screenful | #continueClubAssignment | yes; 520×56px; top/bottom 666.7/722.7px; CONFIRM SHARED SHOWDOWN; center unobscured yes |
| 1366x768 | playerTwo-waiting-rival | Horizontal scrollbar | html / body | no; scroll/client 1366/1366px; overflow visible/hidden |
| 1366x768 | playerTwo-waiting-rival | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 1366x768 | playerTwo-waiting-rival | Touch control <44px | #clubWheelScreen | N/A desktop |
| 1366x768 | playerTwo-waiting-rival | Text scrollWidth > clientWidth | #clubWheelScreen | 1 candidates |
| 1366x768 | playerTwo-waiting-rival | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 111>105px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 1366x768 | playerTwo-waiting-rival | Primary action in first screenful | #continueClubAssignment | yes; 520×56px; top/bottom 667.7/723.7px; CONFIRMED · WAITING FOR RIVAL; disabled; center unobscured yes |
| 1366x768 | playerTwo-reconnect | Horizontal scrollbar | html / body | no; scroll/client 1366/1366px; overflow visible/hidden |
| 1366x768 | playerTwo-reconnect | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 1366x768 | playerTwo-reconnect | Touch control <44px | #clubWheelScreen | N/A desktop |
| 1366x768 | playerTwo-reconnect | Text scrollWidth > clientWidth | #clubWheelScreen | 1 candidates |
| 1366x768 | playerTwo-reconnect | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 111>105px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 1366x768 | playerTwo-reconnect | Primary action in first screenful | #continueClubAssignment | yes; 520×56px; top/bottom 667.7/723.7px; RECONNECT PLAYERS TO CONTINUE; disabled; center unobscured yes |
| 1366x768 | playerTwo-career-start-ready | Horizontal scrollbar | html / body | no; scroll/client 1366/1366px; overflow visible/hidden |
| 1366x768 | playerTwo-career-start-ready | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 1366x768 | playerTwo-career-start-ready | Touch control <44px | #clubWheelScreen | N/A desktop |
| 1366x768 | playerTwo-career-start-ready | Text scrollWidth > clientWidth | #clubWheelScreen | 1 candidates |
| 1366x768 | playerTwo-career-start-ready | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 111>105px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 1366x768 | playerTwo-career-start-ready | Primary action in first screenful | #continueClubAssignment | yes; 520×56px; top/bottom 666.7/722.7px; CONTINUE TO CAREER START; center unobscured yes |
| 1366x768 | playerTwo-season-mismatch | Horizontal scrollbar | html / body | no; scroll/client 1366/1366px; overflow visible/hidden |
| 1366x768 | playerTwo-season-mismatch | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 1366x768 | playerTwo-season-mismatch | Touch control <44px | #clubWheelScreen | N/A desktop |
| 1366x768 | playerTwo-season-mismatch | Text scrollWidth > clientWidth | #clubWheelScreen | 1 candidates |
| 1366x768 | playerTwo-season-mismatch | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 111>105px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 1366x768 | playerTwo-season-mismatch | Primary action in first screenful | #continueClubAssignment | yes; 520×56px; top/bottom 667.7/723.7px; SEASON PLAN MISMATCH · RECOVERY REQUIRED; disabled; center unobscured yes |
| 1366x768 | playerTwo-long-club-names | Horizontal scrollbar | html / body | no; scroll/client 1366/1366px; overflow visible/hidden |
| 1366x768 | playerTwo-long-club-names | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 1366x768 | playerTwo-long-club-names | Touch control <44px | #clubWheelScreen | N/A desktop |
| 1366x768 | playerTwo-long-club-names | Text scrollWidth > clientWidth | #clubWheelScreen | 3 candidates |
| 1366x768 | playerTwo-long-club-names | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 306>256px; overflow-x visible; glyph range outside no; Deportivo La Coruña |
| 1366x768 | playerTwo-long-club-names | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 306>256px; overflow-x visible; glyph range outside yes; Borussia Mönchengladbach |
| 1366x768 | playerTwo-long-club-names | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 111>105px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 1366x768 | playerTwo-long-club-names | Overlap | .clubRivalryLockNote / #continueClubAssignment | 370×21.8px intersection |
| 1366x768 | playerTwo-long-club-names | Primary action in first screenful | #continueClubAssignment | yes; 520×56px; top/bottom 666.7/722.7px; CONFIRM SHARED SHOWDOWN; center unobscured yes |
| 1366x768 | playerOne-confirmation-overlap-detail | Horizontal scrollbar | html / body | no; scroll/client 1366/1366px; overflow visible/hidden |
| 1366x768 | playerOne-confirmation-overlap-detail | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 1366x768 | playerOne-confirmation-overlap-detail | Touch control <44px | #clubWheelScreen | N/A desktop |
| 1366x768 | playerOne-confirmation-overlap-detail | Text scrollWidth > clientWidth | #clubWheelScreen | 3 candidates |
| 1366x768 | playerOne-confirmation-overlap-detail | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 306>256px; overflow-x visible; glyph range outside no; Osasuna |
| 1366x768 | playerOne-confirmation-overlap-detail | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 306>256px; overflow-x visible; glyph range outside no; Espanyol |
| 1366x768 | playerOne-confirmation-overlap-detail | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 113>105px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 1366x768 | playerOne-confirmation-overlap-detail | Primary action in first screenful | #continueClubAssignment | yes; 520×56px; top/bottom 667.7/723.7px; CONFIRM SHARED SHOWDOWN; center unobscured yes |
| 1366x768 | playerTwo-confirmation-overlap-detail | Horizontal scrollbar | html / body | no; scroll/client 1366/1366px; overflow visible/hidden |
| 1366x768 | playerTwo-confirmation-overlap-detail | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 1366x768 | playerTwo-confirmation-overlap-detail | Touch control <44px | #clubWheelScreen | N/A desktop |
| 1366x768 | playerTwo-confirmation-overlap-detail | Text scrollWidth > clientWidth | #clubWheelScreen | 2 candidates |
| 1366x768 | playerTwo-confirmation-overlap-detail | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 306>256px; overflow-x visible; glyph range outside no; Espanyol |
| 1366x768 | playerTwo-confirmation-overlap-detail | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 114>105px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 1366x768 | playerTwo-confirmation-overlap-detail | Primary action in first screenful | #continueClubAssignment | yes; 520×56px; top/bottom 667.7/723.7px; CONFIRM SHARED SHOWDOWN; center unobscured yes |
| 1920x1080 | playerOne-sealed | Horizontal scrollbar | html / body | no; scroll/client 1920/1920px; overflow visible/hidden |
| 1920x1080 | playerOne-sealed | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 1920x1080 | playerOne-sealed | Touch control <44px | #clubWheelScreen | N/A desktop |
| 1920x1080 | playerOne-sealed | Text scrollWidth > clientWidth | #clubWheelScreen | 0 candidates |
| 1920x1080 | playerOne-sealed | Primary action in first screenful | #openClubPack | yes; 562.2×78.7px; top/bottom 938.8/1017.5px; OPEN SHOWDOWN PACKS; center unobscured yes |
| 1920x1080 | playerOne-provider-working | Horizontal scrollbar | html / body | no; scroll/client 1920/1920px; overflow visible/hidden |
| 1920x1080 | playerOne-provider-working | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 1920x1080 | playerOne-provider-working | Touch control <44px | #clubWheelScreen | N/A desktop |
| 1920x1080 | playerOne-provider-working | Text scrollWidth > clientWidth | #clubWheelScreen | 0 candidates |
| 1920x1080 | playerOne-provider-working | Primary action in first screenful | #openClubPack | yes; 562.2×78.7px; top/bottom 938.8/1017.5px; WORKING…; disabled; center unobscured yes |
| 1920x1080 | playerOne-pack-write-failure | Horizontal scrollbar | html / body | no; scroll/client 1920/1920px; overflow visible/hidden |
| 1920x1080 | playerOne-pack-write-failure | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 1920x1080 | playerOne-pack-write-failure | Touch control <44px | #clubWheelScreen | N/A desktop |
| 1920x1080 | playerOne-pack-write-failure | Text scrollWidth > clientWidth | #clubWheelScreen | 0 candidates |
| 1920x1080 | playerOne-pack-write-failure | Primary action in first screenful | #openClubPack | yes; 562.2×78.7px; top/bottom 937.8/1016.5px; OPEN SHOWDOWN PACKS; center unobscured yes |
| 1920x1080 | playerOne-opening | Horizontal scrollbar | html / body | no; scroll/client 1920/1920px; overflow visible/hidden |
| 1920x1080 | playerOne-opening | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 1920x1080 | playerOne-opening | Touch control <44px | #clubWheelScreen | N/A desktop |
| 1920x1080 | playerOne-opening | Text scrollWidth > clientWidth | #clubWheelScreen | 1 candidates |
| 1920x1080 | playerOne-opening | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span | 194>148px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 1920x1080 | playerOne-opening | Primary action in first screenful | none | N/A no visible action |
| 1920x1080 | playerOne-manager-one | Horizontal scrollbar | html / body | no; scroll/client 1920/1920px; overflow visible/hidden |
| 1920x1080 | playerOne-manager-one | Element wider than window | #clubWheelScreen | 0 content; 1 decoration |
| 1920x1080 | playerOne-manager-one | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > div.rvFlap.plateDup:nth-of-type(5) | 2007.9px; left/right -33.5/1974.4px |
| 1920x1080 | playerOne-manager-one | Touch control <44px | #clubWheelScreen | N/A desktop |
| 1920x1080 | playerOne-manager-one | Text scrollWidth > clientWidth | #clubWheelScreen | 1 candidates |
| 1920x1080 | playerOne-manager-one | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span | 194>148px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 1920x1080 | playerOne-manager-one | Primary action in first screenful | none | N/A no visible action |
| 1920x1080 | playerOne-manager-two | Horizontal scrollbar | html / body | no; scroll/client 1920/1920px; overflow visible/hidden |
| 1920x1080 | playerOne-manager-two | Element wider than window | #clubWheelScreen | 0 content; 1 decoration |
| 1920x1080 | playerOne-manager-two | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > div.rvFlap.plateDup:nth-of-type(5) | 1923.9px; left/right -2.3/1921.6px |
| 1920x1080 | playerOne-manager-two | Touch control <44px | #clubWheelScreen | N/A desktop |
| 1920x1080 | playerOne-manager-two | Text scrollWidth > clientWidth | #clubWheelScreen | 2 candidates |
| 1920x1080 | playerOne-manager-two | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 430>359px; overflow-x visible; glyph range outside no; Osasuna |
| 1920x1080 | playerOne-manager-two | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span | 194>148px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 1920x1080 | playerOne-manager-two | Primary action in first screenful | none | N/A no visible action |
| 1920x1080 | playerOne-confirm | Horizontal scrollbar | html / body | no; scroll/client 1920/1920px; overflow visible/hidden |
| 1920x1080 | playerOne-confirm | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 1920x1080 | playerOne-confirm | Touch control <44px | #clubWheelScreen | N/A desktop |
| 1920x1080 | playerOne-confirm | Text scrollWidth > clientWidth | #clubWheelScreen | 3 candidates |
| 1920x1080 | playerOne-confirm | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 430>359px; overflow-x visible; glyph range outside no; Osasuna |
| 1920x1080 | playerOne-confirm | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 430>359px; overflow-x visible; glyph range outside no; Espanyol |
| 1920x1080 | playerOne-confirm | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 156>148px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 1920x1080 | playerOne-confirm | Primary action in first screenful | #continueClubAssignment | yes; 730.9×78.7px; top/bottom 937.8/1016.5px; CONFIRM SHARED SHOWDOWN; center unobscured yes |
| 1920x1080 | playerOne-confirm-write-failure | Horizontal scrollbar | html / body | no; scroll/client 1920/1920px; overflow visible/hidden |
| 1920x1080 | playerOne-confirm-write-failure | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 1920x1080 | playerOne-confirm-write-failure | Touch control <44px | #clubWheelScreen | N/A desktop |
| 1920x1080 | playerOne-confirm-write-failure | Text scrollWidth > clientWidth | #clubWheelScreen | 3 candidates |
| 1920x1080 | playerOne-confirm-write-failure | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 430>359px; overflow-x visible; glyph range outside no; Osasuna |
| 1920x1080 | playerOne-confirm-write-failure | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 430>359px; overflow-x visible; glyph range outside no; Espanyol |
| 1920x1080 | playerOne-confirm-write-failure | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 156>148px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 1920x1080 | playerOne-confirm-write-failure | Primary action in first screenful | #continueClubAssignment | yes; 730.9×78.7px; top/bottom 937.8/1016.5px; CONFIRM SHARED SHOWDOWN; center unobscured yes |
| 1920x1080 | playerOne-waiting-rival | Horizontal scrollbar | html / body | no; scroll/client 1920/1920px; overflow visible/hidden |
| 1920x1080 | playerOne-waiting-rival | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 1920x1080 | playerOne-waiting-rival | Touch control <44px | #clubWheelScreen | N/A desktop |
| 1920x1080 | playerOne-waiting-rival | Text scrollWidth > clientWidth | #clubWheelScreen | 3 candidates |
| 1920x1080 | playerOne-waiting-rival | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 430>359px; overflow-x visible; glyph range outside no; Osasuna |
| 1920x1080 | playerOne-waiting-rival | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 430>359px; overflow-x visible; glyph range outside no; Espanyol |
| 1920x1080 | playerOne-waiting-rival | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 156>148px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 1920x1080 | playerOne-waiting-rival | Primary action in first screenful | #continueClubAssignment | yes; 730.9×78.7px; top/bottom 938.8/1017.5px; CONFIRMED · WAITING FOR RIVAL; disabled; center unobscured yes |
| 1920x1080 | playerOne-reconnect | Horizontal scrollbar | html / body | no; scroll/client 1920/1920px; overflow visible/hidden |
| 1920x1080 | playerOne-reconnect | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 1920x1080 | playerOne-reconnect | Touch control <44px | #clubWheelScreen | N/A desktop |
| 1920x1080 | playerOne-reconnect | Text scrollWidth > clientWidth | #clubWheelScreen | 3 candidates |
| 1920x1080 | playerOne-reconnect | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 430>359px; overflow-x visible; glyph range outside no; Osasuna |
| 1920x1080 | playerOne-reconnect | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 430>359px; overflow-x visible; glyph range outside no; Espanyol |
| 1920x1080 | playerOne-reconnect | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 156>148px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 1920x1080 | playerOne-reconnect | Primary action in first screenful | #continueClubAssignment | yes; 730.9×78.7px; top/bottom 938.8/1017.5px; RECONNECT PLAYERS TO CONTINUE; disabled; center unobscured yes |
| 1920x1080 | playerOne-career-start-ready | Horizontal scrollbar | html / body | no; scroll/client 1920/1920px; overflow visible/hidden |
| 1920x1080 | playerOne-career-start-ready | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 1920x1080 | playerOne-career-start-ready | Touch control <44px | #clubWheelScreen | N/A desktop |
| 1920x1080 | playerOne-career-start-ready | Text scrollWidth > clientWidth | #clubWheelScreen | 3 candidates |
| 1920x1080 | playerOne-career-start-ready | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 430>359px; overflow-x visible; glyph range outside no; Osasuna |
| 1920x1080 | playerOne-career-start-ready | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 430>359px; overflow-x visible; glyph range outside no; Espanyol |
| 1920x1080 | playerOne-career-start-ready | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 156>148px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 1920x1080 | playerOne-career-start-ready | Primary action in first screenful | #continueClubAssignment | yes; 730.9×78.7px; top/bottom 937.8/1016.5px; CONTINUE TO CAREER START; center unobscured yes |
| 1920x1080 | playerOne-season-mismatch | Horizontal scrollbar | html / body | no; scroll/client 1920/1920px; overflow visible/hidden |
| 1920x1080 | playerOne-season-mismatch | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 1920x1080 | playerOne-season-mismatch | Touch control <44px | #clubWheelScreen | N/A desktop |
| 1920x1080 | playerOne-season-mismatch | Text scrollWidth > clientWidth | #clubWheelScreen | 3 candidates |
| 1920x1080 | playerOne-season-mismatch | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 430>359px; overflow-x visible; glyph range outside no; Osasuna |
| 1920x1080 | playerOne-season-mismatch | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 430>359px; overflow-x visible; glyph range outside no; Espanyol |
| 1920x1080 | playerOne-season-mismatch | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 156>148px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 1920x1080 | playerOne-season-mismatch | Primary action in first screenful | #continueClubAssignment | yes; 730.9×78.7px; top/bottom 938.8/1017.5px; SEASON PLAN MISMATCH · RECOVERY REQUIRED; disabled; center unobscured yes |
| 1920x1080 | playerOne-long-club-names | Horizontal scrollbar | html / body | no; scroll/client 1920/1920px; overflow visible/hidden |
| 1920x1080 | playerOne-long-club-names | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 1920x1080 | playerOne-long-club-names | Touch control <44px | #clubWheelScreen | N/A desktop |
| 1920x1080 | playerOne-long-club-names | Text scrollWidth > clientWidth | #clubWheelScreen | 3 candidates |
| 1920x1080 | playerOne-long-club-names | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 430>359px; overflow-x visible; glyph range outside no; Deportivo La Coruña |
| 1920x1080 | playerOne-long-club-names | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 430>359px; overflow-x visible; glyph range outside yes; Borussia Mönchengladbach |
| 1920x1080 | playerOne-long-club-names | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 156>148px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 1920x1080 | playerOne-long-club-names | Overlap | .clubRivalryLockNote / #continueClubAssignment | 520×27.2px intersection |
| 1920x1080 | playerOne-long-club-names | Primary action in first screenful | #continueClubAssignment | yes; 730.9×78.7px; top/bottom 937.8/1016.5px; CONFIRM SHARED SHOWDOWN; center unobscured yes |
| 1920x1080 | playerOne-local-ready | Horizontal scrollbar | html / body | no; scroll/client 1920/1920px; overflow visible/hidden |
| 1920x1080 | playerOne-local-ready | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 1920x1080 | playerOne-local-ready | Touch control <44px | #clubWheelScreen | N/A desktop |
| 1920x1080 | playerOne-local-ready | Text scrollWidth > clientWidth | #clubWheelScreen | 2 candidates |
| 1920x1080 | playerOne-local-ready | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 430>359px; overflow-x visible; glyph range outside no; ? |
| 1920x1080 | playerOne-local-ready | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 430>359px; overflow-x visible; glyph range outside no; ? |
| 1920x1080 | playerOne-local-ready | Primary action in first screenful | #openClubPack | yes; 562.2×78.7px; top/bottom 938.8/1017.5px; OPEN SHOWDOWN PACKS; disabled; center unobscured yes |
| 1920x1080 | playerOne-local-opening | Horizontal scrollbar | html / body | no; scroll/client 1920/1920px; overflow visible/hidden |
| 1920x1080 | playerOne-local-opening | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 1920x1080 | playerOne-local-opening | Touch control <44px | #clubWheelScreen | N/A desktop |
| 1920x1080 | playerOne-local-opening | Text scrollWidth > clientWidth | #clubWheelScreen | 2 candidates |
| 1920x1080 | playerOne-local-opening | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 430>359px; overflow-x visible; glyph range outside no; ? |
| 1920x1080 | playerOne-local-opening | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 430>359px; overflow-x visible; glyph range outside no; ? |
| 1920x1080 | playerOne-local-opening | Primary action in first screenful | #openClubPack | yes; 562.2×78.7px; top/bottom 938.8/1017.5px; DRAW LOCKED...; disabled; center unobscured yes |
| 1920x1080 | playerOne-local-manager-one | Horizontal scrollbar | html / body | no; scroll/client 1920/1920px; overflow visible/hidden |
| 1920x1080 | playerOne-local-manager-one | Element wider than window | #clubWheelScreen | 0 content; 3 decoration |
| 1920x1080 | playerOne-local-manager-one | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > svg.rvBurst:nth-of-type(4) | 1972.2px; left/right -15.7/1956.5px |
| 1920x1080 | playerOne-local-manager-one | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > div.rvHalf.rvHalfLeft.plateDup:nth-of-type(2) | 2082.9px; left/right -116.5/1966.4px |
| 1920x1080 | playerOne-local-manager-one | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > div.rvHalf.rvHalfRight.plateDup:nth-of-type(3) | 2082.9px; left/right -60.7/2022.2px |
| 1920x1080 | playerOne-local-manager-one | Touch control <44px | #clubWheelScreen | N/A desktop |
| 1920x1080 | playerOne-local-manager-one | Text scrollWidth > clientWidth | #clubWheelScreen | 2 candidates |
| 1920x1080 | playerOne-local-manager-one | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 430>359px; overflow-x visible; glyph range outside no; Osasuna |
| 1920x1080 | playerOne-local-manager-one | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 430>359px; overflow-x visible; glyph range outside no; ? |
| 1920x1080 | playerOne-local-manager-one | Primary action in first screenful | #openClubPack | yes; 562.2×78.7px; top/bottom 938.8/1017.5px; DRAW LOCKED...; disabled; center unobscured yes |
| 1920x1080 | playerOne-local-manager-two | Horizontal scrollbar | html / body | no; scroll/client 1920/1920px; overflow visible/hidden |
| 1920x1080 | playerOne-local-manager-two | Element wider than window | #clubWheelScreen | 0 content; 3 decoration |
| 1920x1080 | playerOne-local-manager-two | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > svg.rvBurst:nth-of-type(4) | 1976.9px; left/right -39.6/1937.3px |
| 1920x1080 | playerOne-local-manager-two | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > div.rvHalf.rvHalfLeft.plateDup:nth-of-type(2) | 2074.1px; left/right -96.3/1977.8px |
| 1920x1080 | playerOne-local-manager-two | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > div.rvHalf.rvHalfRight.plateDup:nth-of-type(3) | 2074.1px; left/right -45.1/2029px |
| 1920x1080 | playerOne-local-manager-two | Touch control <44px | #clubWheelScreen | N/A desktop |
| 1920x1080 | playerOne-local-manager-two | Text scrollWidth > clientWidth | #clubWheelScreen | 2 candidates |
| 1920x1080 | playerOne-local-manager-two | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 430>359px; overflow-x visible; glyph range outside no; Osasuna |
| 1920x1080 | playerOne-local-manager-two | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 430>359px; overflow-x visible; glyph range outside no; Espanyol |
| 1920x1080 | playerOne-local-manager-two | Primary action in first screenful | #openClubPack | yes; 562.2×78.7px; top/bottom 938.8/1017.5px; DRAW LOCKED...; disabled; center unobscured yes |
| 1920x1080 | playerOne-local-versus | Horizontal scrollbar | html / body | no; scroll/client 1920/1920px; overflow visible/hidden |
| 1920x1080 | playerOne-local-versus | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 1920x1080 | playerOne-local-versus | Touch control <44px | #clubWheelScreen | N/A desktop |
| 1920x1080 | playerOne-local-versus | Text scrollWidth > clientWidth | #clubWheelScreen | 3 candidates |
| 1920x1080 | playerOne-local-versus | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 430>359px; overflow-x visible; glyph range outside no; Osasuna |
| 1920x1080 | playerOne-local-versus | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 430>359px; overflow-x visible; glyph range outside no; Espanyol |
| 1920x1080 | playerOne-local-versus | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 157>148px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 1920x1080 | playerOne-local-versus | Primary action in first screenful | none | N/A no visible action |
| 1920x1080 | playerOne-local-confirmation | Horizontal scrollbar | html / body | no; scroll/client 1920/1920px; overflow visible/hidden |
| 1920x1080 | playerOne-local-confirmation | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 1920x1080 | playerOne-local-confirmation | Touch control <44px | #clubWheelScreen | N/A desktop |
| 1920x1080 | playerOne-local-confirmation | Text scrollWidth > clientWidth | #clubWheelScreen | 3 candidates |
| 1920x1080 | playerOne-local-confirmation | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 430>359px; overflow-x visible; glyph range outside no; Osasuna |
| 1920x1080 | playerOne-local-confirmation | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 430>359px; overflow-x visible; glyph range outside no; Espanyol |
| 1920x1080 | playerOne-local-confirmation | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 156>148px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 1920x1080 | playerOne-local-confirmation | Primary action in first screenful | #continueClubAssignment | yes; 730.9×78.7px; top/bottom 937.8/1016.5px; CONFIRM RIVALRY & START SHOWDOWN; center unobscured yes |
| 1920x1080 | playerTwo-sealed | Horizontal scrollbar | html / body | no; scroll/client 1920/1920px; overflow visible/hidden |
| 1920x1080 | playerTwo-sealed | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 1920x1080 | playerTwo-sealed | Touch control <44px | #clubWheelScreen | N/A desktop |
| 1920x1080 | playerTwo-sealed | Text scrollWidth > clientWidth | #clubWheelScreen | 0 candidates |
| 1920x1080 | playerTwo-sealed | Primary action in first screenful | #openClubPack | yes; 562.2×78.7px; top/bottom 938.8/1017.5px; WAITING FOR HOST PACK REVEAL; disabled; center unobscured yes |
| 1920x1080 | playerTwo-opening | Horizontal scrollbar | html / body | no; scroll/client 1920/1920px; overflow visible/hidden |
| 1920x1080 | playerTwo-opening | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 1920x1080 | playerTwo-opening | Touch control <44px | #clubWheelScreen | N/A desktop |
| 1920x1080 | playerTwo-opening | Text scrollWidth > clientWidth | #clubWheelScreen | 1 candidates |
| 1920x1080 | playerTwo-opening | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span | 194>148px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 1920x1080 | playerTwo-opening | Primary action in first screenful | none | N/A no visible action |
| 1920x1080 | playerTwo-manager-one | Horizontal scrollbar | html / body | no; scroll/client 1920/1920px; overflow visible/hidden |
| 1920x1080 | playerTwo-manager-one | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 1920x1080 | playerTwo-manager-one | Touch control <44px | #clubWheelScreen | N/A desktop |
| 1920x1080 | playerTwo-manager-one | Text scrollWidth > clientWidth | #clubWheelScreen | 1 candidates |
| 1920x1080 | playerTwo-manager-one | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span | 194>148px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 1920x1080 | playerTwo-manager-one | Primary action in first screenful | none | N/A no visible action |
| 1920x1080 | playerTwo-manager-two | Horizontal scrollbar | html / body | no; scroll/client 1920/1920px; overflow visible/hidden |
| 1920x1080 | playerTwo-manager-two | Element wider than window | #clubWheelScreen | 0 content; 1 decoration |
| 1920x1080 | playerTwo-manager-two | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > div.rvFlap.plateDup:nth-of-type(5) | 1923.9px; left/right -2.3/1921.6px |
| 1920x1080 | playerTwo-manager-two | Touch control <44px | #clubWheelScreen | N/A desktop |
| 1920x1080 | playerTwo-manager-two | Text scrollWidth > clientWidth | #clubWheelScreen | 1 candidates |
| 1920x1080 | playerTwo-manager-two | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span | 194>148px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 1920x1080 | playerTwo-manager-two | Primary action in first screenful | none | N/A no visible action |
| 1920x1080 | playerTwo-clubs-locked-awaiting-season | Horizontal scrollbar | html / body | no; scroll/client 1920/1920px; overflow visible/hidden |
| 1920x1080 | playerTwo-clubs-locked-awaiting-season | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 1920x1080 | playerTwo-clubs-locked-awaiting-season | Touch control <44px | #clubWheelScreen | N/A desktop |
| 1920x1080 | playerTwo-clubs-locked-awaiting-season | Text scrollWidth > clientWidth | #clubWheelScreen | 1 candidates |
| 1920x1080 | playerTwo-clubs-locked-awaiting-season | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 157>148px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 1920x1080 | playerTwo-clubs-locked-awaiting-season | Primary action in first screenful | none | N/A no visible action |
| 1920x1080 | playerTwo-confirm | Horizontal scrollbar | html / body | no; scroll/client 1920/1920px; overflow visible/hidden |
| 1920x1080 | playerTwo-confirm | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 1920x1080 | playerTwo-confirm | Touch control <44px | #clubWheelScreen | N/A desktop |
| 1920x1080 | playerTwo-confirm | Text scrollWidth > clientWidth | #clubWheelScreen | 1 candidates |
| 1920x1080 | playerTwo-confirm | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 156>148px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 1920x1080 | playerTwo-confirm | Primary action in first screenful | #continueClubAssignment | yes; 730.9×78.7px; top/bottom 938.8/1017.5px; CONFIRM SHARED SHOWDOWN; center unobscured yes |
| 1920x1080 | playerTwo-confirm-write-failure | Horizontal scrollbar | html / body | no; scroll/client 1920/1920px; overflow visible/hidden |
| 1920x1080 | playerTwo-confirm-write-failure | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 1920x1080 | playerTwo-confirm-write-failure | Touch control <44px | #clubWheelScreen | N/A desktop |
| 1920x1080 | playerTwo-confirm-write-failure | Text scrollWidth > clientWidth | #clubWheelScreen | 1 candidates |
| 1920x1080 | playerTwo-confirm-write-failure | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 156>148px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 1920x1080 | playerTwo-confirm-write-failure | Primary action in first screenful | #continueClubAssignment | yes; 730.9×78.7px; top/bottom 937.8/1016.5px; CONFIRM SHARED SHOWDOWN; center unobscured yes |
| 1920x1080 | playerTwo-waiting-rival | Horizontal scrollbar | html / body | no; scroll/client 1920/1920px; overflow visible/hidden |
| 1920x1080 | playerTwo-waiting-rival | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 1920x1080 | playerTwo-waiting-rival | Touch control <44px | #clubWheelScreen | N/A desktop |
| 1920x1080 | playerTwo-waiting-rival | Text scrollWidth > clientWidth | #clubWheelScreen | 1 candidates |
| 1920x1080 | playerTwo-waiting-rival | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 156>148px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 1920x1080 | playerTwo-waiting-rival | Primary action in first screenful | #continueClubAssignment | yes; 730.9×78.7px; top/bottom 938.8/1017.5px; CONFIRMED · WAITING FOR RIVAL; disabled; center unobscured yes |
| 1920x1080 | playerTwo-reconnect | Horizontal scrollbar | html / body | no; scroll/client 1920/1920px; overflow visible/hidden |
| 1920x1080 | playerTwo-reconnect | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 1920x1080 | playerTwo-reconnect | Touch control <44px | #clubWheelScreen | N/A desktop |
| 1920x1080 | playerTwo-reconnect | Text scrollWidth > clientWidth | #clubWheelScreen | 1 candidates |
| 1920x1080 | playerTwo-reconnect | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 156>148px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 1920x1080 | playerTwo-reconnect | Primary action in first screenful | #continueClubAssignment | yes; 730.9×78.7px; top/bottom 938.8/1017.5px; RECONNECT PLAYERS TO CONTINUE; disabled; center unobscured yes |
| 1920x1080 | playerTwo-career-start-ready | Horizontal scrollbar | html / body | no; scroll/client 1920/1920px; overflow visible/hidden |
| 1920x1080 | playerTwo-career-start-ready | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 1920x1080 | playerTwo-career-start-ready | Touch control <44px | #clubWheelScreen | N/A desktop |
| 1920x1080 | playerTwo-career-start-ready | Text scrollWidth > clientWidth | #clubWheelScreen | 1 candidates |
| 1920x1080 | playerTwo-career-start-ready | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 156>148px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 1920x1080 | playerTwo-career-start-ready | Primary action in first screenful | #continueClubAssignment | yes; 730.9×78.7px; top/bottom 937.8/1016.5px; CONTINUE TO CAREER START; center unobscured yes |
| 1920x1080 | playerTwo-season-mismatch | Horizontal scrollbar | html / body | no; scroll/client 1920/1920px; overflow visible/hidden |
| 1920x1080 | playerTwo-season-mismatch | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 1920x1080 | playerTwo-season-mismatch | Touch control <44px | #clubWheelScreen | N/A desktop |
| 1920x1080 | playerTwo-season-mismatch | Text scrollWidth > clientWidth | #clubWheelScreen | 1 candidates |
| 1920x1080 | playerTwo-season-mismatch | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 156>148px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 1920x1080 | playerTwo-season-mismatch | Primary action in first screenful | #continueClubAssignment | yes; 730.9×78.7px; top/bottom 938.8/1017.5px; SEASON PLAN MISMATCH · RECOVERY REQUIRED; disabled; center unobscured yes |
| 1920x1080 | playerTwo-long-club-names | Horizontal scrollbar | html / body | no; scroll/client 1920/1920px; overflow visible/hidden |
| 1920x1080 | playerTwo-long-club-names | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 1920x1080 | playerTwo-long-club-names | Touch control <44px | #clubWheelScreen | N/A desktop |
| 1920x1080 | playerTwo-long-club-names | Text scrollWidth > clientWidth | #clubWheelScreen | 3 candidates |
| 1920x1080 | playerTwo-long-club-names | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 430>359px; overflow-x visible; glyph range outside no; Deportivo La Coruña |
| 1920x1080 | playerTwo-long-club-names | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 430>359px; overflow-x visible; glyph range outside yes; Borussia Mönchengladbach |
| 1920x1080 | playerTwo-long-club-names | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 156>148px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 1920x1080 | playerTwo-long-club-names | Overlap | .clubRivalryLockNote / #continueClubAssignment | 520×27.2px intersection |
| 1920x1080 | playerTwo-long-club-names | Primary action in first screenful | #continueClubAssignment | yes; 730.9×78.7px; top/bottom 937.8/1016.5px; CONFIRM SHARED SHOWDOWN; center unobscured yes |
| 1920x1080 | playerOne-confirmation-overlap-detail | Horizontal scrollbar | html / body | no; scroll/client 1920/1920px; overflow visible/hidden |
| 1920x1080 | playerOne-confirmation-overlap-detail | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 1920x1080 | playerOne-confirmation-overlap-detail | Touch control <44px | #clubWheelScreen | N/A desktop |
| 1920x1080 | playerOne-confirmation-overlap-detail | Text scrollWidth > clientWidth | #clubWheelScreen | 2 candidates |
| 1920x1080 | playerOne-confirmation-overlap-detail | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 430>359px; overflow-x visible; glyph range outside no; Osasuna |
| 1920x1080 | playerOne-confirmation-overlap-detail | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 159>148px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 1920x1080 | playerOne-confirmation-overlap-detail | Primary action in first screenful | #continueClubAssignment | yes; 730.9×78.7px; top/bottom 938.8/1017.5px; CONFIRM SHARED SHOWDOWN; center unobscured yes |
| 1920x1080 | playerTwo-confirmation-overlap-detail | Horizontal scrollbar | html / body | no; scroll/client 1920/1920px; overflow visible/hidden |
| 1920x1080 | playerTwo-confirmation-overlap-detail | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 1920x1080 | playerTwo-confirmation-overlap-detail | Touch control <44px | #clubWheelScreen | N/A desktop |
| 1920x1080 | playerTwo-confirmation-overlap-detail | Text scrollWidth > clientWidth | #clubWheelScreen | 2 candidates |
| 1920x1080 | playerTwo-confirmation-overlap-detail | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 430>359px; overflow-x visible; glyph range outside no; Espanyol |
| 1920x1080 | playerTwo-confirmation-overlap-detail | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 159>148px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 1920x1080 | playerTwo-confirmation-overlap-detail | Primary action in first screenful | #continueClubAssignment | yes; 730.9×78.7px; top/bottom 938.8/1017.5px; CONFIRM SHARED SHOWDOWN; center unobscured yes |
| 2560x1080 | playerOne-sealed | Horizontal scrollbar | html / body | no; scroll/client 2560/2560px; overflow visible/hidden |
| 2560x1080 | playerOne-sealed | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 2560x1080 | playerOne-sealed | Touch control <44px | #clubWheelScreen | N/A desktop |
| 2560x1080 | playerOne-sealed | Text scrollWidth > clientWidth | #clubWheelScreen | 0 candidates |
| 2560x1080 | playerOne-sealed | Primary action in first screenful | #openClubPack | yes; 300×104.9px; top/bottom 967/1071.9px; OPEN SHOWDOWN PACKS; center unobscured yes |
| 2560x1080 | playerOne-provider-working | Horizontal scrollbar | html / body | no; scroll/client 2560/2560px; overflow visible/hidden |
| 2560x1080 | playerOne-provider-working | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 2560x1080 | playerOne-provider-working | Touch control <44px | #clubWheelScreen | N/A desktop |
| 2560x1080 | playerOne-provider-working | Text scrollWidth > clientWidth | #clubWheelScreen | 0 candidates |
| 2560x1080 | playerOne-provider-working | Primary action in first screenful | #openClubPack | yes; 300×104.9px; top/bottom 967/1071.9px; WORKING…; disabled; center unobscured yes |
| 2560x1080 | playerOne-pack-write-failure | Horizontal scrollbar | html / body | no; scroll/client 2560/2560px; overflow visible/hidden |
| 2560x1080 | playerOne-pack-write-failure | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 2560x1080 | playerOne-pack-write-failure | Touch control <44px | #clubWheelScreen | N/A desktop |
| 2560x1080 | playerOne-pack-write-failure | Text scrollWidth > clientWidth | #clubWheelScreen | 0 candidates |
| 2560x1080 | playerOne-pack-write-failure | Primary action in first screenful | #openClubPack | yes; 300×104.9px; top/bottom 966/1070.9px; OPEN SHOWDOWN PACKS; center unobscured yes |
| 2560x1080 | playerOne-opening | Horizontal scrollbar | html / body | no; scroll/client 2560/2560px; overflow visible/hidden |
| 2560x1080 | playerOne-opening | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 2560x1080 | playerOne-opening | Touch control <44px | #clubWheelScreen | N/A desktop |
| 2560x1080 | playerOne-opening | Text scrollWidth > clientWidth | #clubWheelScreen | 1 candidates |
| 2560x1080 | playerOne-opening | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span | 259>197px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 2560x1080 | playerOne-opening | Primary action in first screenful | none | N/A no visible action |
| 2560x1080 | playerOne-manager-one | Horizontal scrollbar | html / body | no; scroll/client 2560/2560px; overflow visible/hidden |
| 2560x1080 | playerOne-manager-one | Element wider than window | #clubWheelScreen | 0 content; 1 decoration |
| 2560x1080 | playerOne-manager-one | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > div.rvFlap.plateDup:nth-of-type(5) | 2570.4px; left/right -4.4/2566px |
| 2560x1080 | playerOne-manager-one | Touch control <44px | #clubWheelScreen | N/A desktop |
| 2560x1080 | playerOne-manager-one | Text scrollWidth > clientWidth | #clubWheelScreen | 1 candidates |
| 2560x1080 | playerOne-manager-one | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span | 259>197px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 2560x1080 | playerOne-manager-one | Primary action in first screenful | none | N/A no visible action |
| 2560x1080 | playerOne-manager-two | Horizontal scrollbar | html / body | no; scroll/client 2560/2560px; overflow visible/hidden |
| 2560x1080 | playerOne-manager-two | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 2560x1080 | playerOne-manager-two | Touch control <44px | #clubWheelScreen | N/A desktop |
| 2560x1080 | playerOne-manager-two | Text scrollWidth > clientWidth | #clubWheelScreen | 1 candidates |
| 2560x1080 | playerOne-manager-two | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span | 259>197px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 2560x1080 | playerOne-manager-two | Primary action in first screenful | none | N/A no visible action |
| 2560x1080 | playerOne-confirm | Horizontal scrollbar | html / body | no; scroll/client 2560/2560px; overflow visible/hidden |
| 2560x1080 | playerOne-confirm | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 2560x1080 | playerOne-confirm | Touch control <44px | #clubWheelScreen | N/A desktop |
| 2560x1080 | playerOne-confirm | Text scrollWidth > clientWidth | #clubWheelScreen | 1 candidates |
| 2560x1080 | playerOne-confirm | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 259>197px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 2560x1080 | playerOne-confirm | Primary action in first screenful | #continueClubAssignment | yes; 430×104.9px; top/bottom 966/1070.9px; CONFIRM SHARED SHOWDOWN; center unobscured yes |
| 2560x1080 | playerOne-confirm-write-failure | Horizontal scrollbar | html / body | no; scroll/client 2560/2560px; overflow visible/hidden |
| 2560x1080 | playerOne-confirm-write-failure | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 2560x1080 | playerOne-confirm-write-failure | Touch control <44px | #clubWheelScreen | N/A desktop |
| 2560x1080 | playerOne-confirm-write-failure | Text scrollWidth > clientWidth | #clubWheelScreen | 1 candidates |
| 2560x1080 | playerOne-confirm-write-failure | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 208>197px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 2560x1080 | playerOne-confirm-write-failure | Primary action in first screenful | #continueClubAssignment | yes; 430×104.9px; top/bottom 966/1070.9px; CONFIRM SHARED SHOWDOWN; center unobscured yes |
| 2560x1080 | playerOne-waiting-rival | Horizontal scrollbar | html / body | no; scroll/client 2560/2560px; overflow visible/hidden |
| 2560x1080 | playerOne-waiting-rival | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 2560x1080 | playerOne-waiting-rival | Touch control <44px | #clubWheelScreen | N/A desktop |
| 2560x1080 | playerOne-waiting-rival | Text scrollWidth > clientWidth | #clubWheelScreen | 1 candidates |
| 2560x1080 | playerOne-waiting-rival | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 208>197px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 2560x1080 | playerOne-waiting-rival | Primary action in first screenful | #continueClubAssignment | yes; 430×104.9px; top/bottom 967/1071.9px; CONFIRMED · WAITING FOR RIVAL; disabled; center unobscured yes |
| 2560x1080 | playerOne-reconnect | Horizontal scrollbar | html / body | no; scroll/client 2560/2560px; overflow visible/hidden |
| 2560x1080 | playerOne-reconnect | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 2560x1080 | playerOne-reconnect | Touch control <44px | #clubWheelScreen | N/A desktop |
| 2560x1080 | playerOne-reconnect | Text scrollWidth > clientWidth | #clubWheelScreen | 1 candidates |
| 2560x1080 | playerOne-reconnect | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 208>197px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 2560x1080 | playerOne-reconnect | Primary action in first screenful | #continueClubAssignment | yes; 430×104.9px; top/bottom 967/1071.9px; RECONNECT PLAYERS TO CONTINUE; disabled; center unobscured yes |
| 2560x1080 | playerOne-career-start-ready | Horizontal scrollbar | html / body | no; scroll/client 2560/2560px; overflow visible/hidden |
| 2560x1080 | playerOne-career-start-ready | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 2560x1080 | playerOne-career-start-ready | Touch control <44px | #clubWheelScreen | N/A desktop |
| 2560x1080 | playerOne-career-start-ready | Text scrollWidth > clientWidth | #clubWheelScreen | 1 candidates |
| 2560x1080 | playerOne-career-start-ready | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 208>197px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 2560x1080 | playerOne-career-start-ready | Primary action in first screenful | #continueClubAssignment | yes; 430×104.9px; top/bottom 966/1070.9px; CONTINUE TO CAREER START; center unobscured yes |
| 2560x1080 | playerOne-season-mismatch | Horizontal scrollbar | html / body | no; scroll/client 2560/2560px; overflow visible/hidden |
| 2560x1080 | playerOne-season-mismatch | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 2560x1080 | playerOne-season-mismatch | Touch control <44px | #clubWheelScreen | N/A desktop |
| 2560x1080 | playerOne-season-mismatch | Text scrollWidth > clientWidth | #clubWheelScreen | 1 candidates |
| 2560x1080 | playerOne-season-mismatch | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 208>197px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 2560x1080 | playerOne-season-mismatch | Primary action in first screenful | #continueClubAssignment | yes; 430×104.9px; top/bottom 967/1071.9px; SEASON PLAN MISMATCH · RECOVERY REQUIRED; disabled; center unobscured yes |
| 2560x1080 | playerOne-long-club-names | Horizontal scrollbar | html / body | no; scroll/client 2560/2560px; overflow visible/hidden |
| 2560x1080 | playerOne-long-club-names | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 2560x1080 | playerOne-long-club-names | Touch control <44px | #clubWheelScreen | N/A desktop |
| 2560x1080 | playerOne-long-club-names | Text scrollWidth > clientWidth | #clubWheelScreen | 3 candidates |
| 2560x1080 | playerOne-long-club-names | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 569>479px; overflow-x visible; glyph range outside no; Deportivo La Coruña |
| 2560x1080 | playerOne-long-club-names | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 569>479px; overflow-x visible; glyph range outside no; Borussia Mönchengladbach |
| 2560x1080 | playerOne-long-club-names | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 208>197px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 2560x1080 | playerOne-long-club-names | Primary action in first screenful | #continueClubAssignment | yes; 430×104.9px; top/bottom 966/1070.9px; CONFIRM SHARED SHOWDOWN; center unobscured yes |
| 2560x1080 | playerOne-local-ready | Horizontal scrollbar | html / body | no; scroll/client 2560/2560px; overflow visible/hidden |
| 2560x1080 | playerOne-local-ready | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 2560x1080 | playerOne-local-ready | Touch control <44px | #clubWheelScreen | N/A desktop |
| 2560x1080 | playerOne-local-ready | Text scrollWidth > clientWidth | #clubWheelScreen | 2 candidates |
| 2560x1080 | playerOne-local-ready | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 569>479px; overflow-x visible; glyph range outside no; ? |
| 2560x1080 | playerOne-local-ready | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 569>479px; overflow-x visible; glyph range outside no; ? |
| 2560x1080 | playerOne-local-ready | Primary action in first screenful | #openClubPack | yes; 300×104.9px; top/bottom 967/1071.9px; OPEN SHOWDOWN PACKS; disabled; center unobscured yes |
| 2560x1080 | playerOne-local-opening | Horizontal scrollbar | html / body | no; scroll/client 2560/2560px; overflow visible/hidden |
| 2560x1080 | playerOne-local-opening | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 2560x1080 | playerOne-local-opening | Touch control <44px | #clubWheelScreen | N/A desktop |
| 2560x1080 | playerOne-local-opening | Text scrollWidth > clientWidth | #clubWheelScreen | 2 candidates |
| 2560x1080 | playerOne-local-opening | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 569>479px; overflow-x visible; glyph range outside no; ? |
| 2560x1080 | playerOne-local-opening | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 569>479px; overflow-x visible; glyph range outside no; ? |
| 2560x1080 | playerOne-local-opening | Primary action in first screenful | #openClubPack | yes; 300×104.9px; top/bottom 967/1071.9px; DRAW LOCKED...; disabled; center unobscured yes |
| 2560x1080 | playerOne-local-manager-one | Horizontal scrollbar | html / body | no; scroll/client 2560/2560px; overflow visible/hidden |
| 2560x1080 | playerOne-local-manager-one | Element wider than window | #clubWheelScreen | 0 content; 3 decoration |
| 2560x1080 | playerOne-local-manager-one | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > div.rvHalf.rvHalfLeft.plateDup:nth-of-type(2) | 2609.4px; left/right -32.3/2577.1px |
| 2560x1080 | playerOne-local-manager-one | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > div.rvHalf.rvHalfRight.plateDup:nth-of-type(3) | 2609.4px; left/right -17.8/2591.6px |
| 2560x1080 | playerOne-local-manager-one | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > div.rvFlap.plateDup:nth-of-type(5) | 2770px; left/right -119.9/2650.1px |
| 2560x1080 | playerOne-local-manager-one | Touch control <44px | #clubWheelScreen | N/A desktop |
| 2560x1080 | playerOne-local-manager-one | Text scrollWidth > clientWidth | #clubWheelScreen | 2 candidates |
| 2560x1080 | playerOne-local-manager-one | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 569>479px; overflow-x visible; glyph range outside no; Osasuna |
| 2560x1080 | playerOne-local-manager-one | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 569>479px; overflow-x visible; glyph range outside no; ? |
| 2560x1080 | playerOne-local-manager-one | Primary action in first screenful | #openClubPack | yes; 300×104.9px; top/bottom 967/1071.9px; DRAW LOCKED...; disabled; center unobscured yes |
| 2560x1080 | playerOne-local-manager-two | Horizontal scrollbar | html / body | no; scroll/client 2560/2560px; overflow visible/hidden |
| 2560x1080 | playerOne-local-manager-two | Element wider than window | #clubWheelScreen | 0 content; 2 decoration |
| 2560x1080 | playerOne-local-manager-two | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > div.rvHalf.rvHalfLeft.plateDup:nth-of-type(2) | 2686.3px; left/right -79.8/2606.5px |
| 2560x1080 | playerOne-local-manager-two | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(5) > div.rvInner:nth-of-type(1) > div.rvHalf.rvHalfRight.plateDup:nth-of-type(3) | 2686.3px; left/right -41/2645.3px |
| 2560x1080 | playerOne-local-manager-two | Touch control <44px | #clubWheelScreen | N/A desktop |
| 2560x1080 | playerOne-local-manager-two | Text scrollWidth > clientWidth | #clubWheelScreen | 2 candidates |
| 2560x1080 | playerOne-local-manager-two | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 569>479px; overflow-x visible; glyph range outside no; Osasuna |
| 2560x1080 | playerOne-local-manager-two | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 569>479px; overflow-x visible; glyph range outside no; Espanyol |
| 2560x1080 | playerOne-local-manager-two | Primary action in first screenful | #openClubPack | yes; 300×104.9px; top/bottom 967/1071.9px; DRAW LOCKED...; disabled; center unobscured yes |
| 2560x1080 | playerOne-local-versus | Horizontal scrollbar | html / body | no; scroll/client 2560/2560px; overflow visible/hidden |
| 2560x1080 | playerOne-local-versus | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 2560x1080 | playerOne-local-versus | Touch control <44px | #clubWheelScreen | N/A desktop |
| 2560x1080 | playerOne-local-versus | Text scrollWidth > clientWidth | #clubWheelScreen | 3 candidates |
| 2560x1080 | playerOne-local-versus | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 569>479px; overflow-x visible; glyph range outside no; Osasuna |
| 2560x1080 | playerOne-local-versus | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 569>479px; overflow-x visible; glyph range outside no; Espanyol |
| 2560x1080 | playerOne-local-versus | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 213>197px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 2560x1080 | playerOne-local-versus | Primary action in first screenful | none | N/A no visible action |
| 2560x1080 | playerOne-local-confirmation | Horizontal scrollbar | html / body | no; scroll/client 2560/2560px; overflow visible/hidden |
| 2560x1080 | playerOne-local-confirmation | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 2560x1080 | playerOne-local-confirmation | Touch control <44px | #clubWheelScreen | N/A desktop |
| 2560x1080 | playerOne-local-confirmation | Text scrollWidth > clientWidth | #clubWheelScreen | 3 candidates |
| 2560x1080 | playerOne-local-confirmation | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 569>479px; overflow-x visible; glyph range outside no; Osasuna |
| 2560x1080 | playerOne-local-confirmation | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 569>479px; overflow-x visible; glyph range outside no; Espanyol |
| 2560x1080 | playerOne-local-confirmation | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 208>197px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 2560x1080 | playerOne-local-confirmation | Primary action in first screenful | #continueClubAssignment | yes; 430×104.9px; top/bottom 966/1070.9px; CONFIRM RIVALRY & START SHOWDOWN; center unobscured yes |
| 2560x1080 | playerTwo-sealed | Horizontal scrollbar | html / body | no; scroll/client 2560/2560px; overflow visible/hidden |
| 2560x1080 | playerTwo-sealed | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 2560x1080 | playerTwo-sealed | Touch control <44px | #clubWheelScreen | N/A desktop |
| 2560x1080 | playerTwo-sealed | Text scrollWidth > clientWidth | #clubWheelScreen | 0 candidates |
| 2560x1080 | playerTwo-sealed | Primary action in first screenful | #openClubPack | yes; 300×104.9px; top/bottom 967/1071.9px; WAITING FOR HOST PACK REVEAL; disabled; center unobscured yes |
| 2560x1080 | playerTwo-opening | Horizontal scrollbar | html / body | no; scroll/client 2560/2560px; overflow visible/hidden |
| 2560x1080 | playerTwo-opening | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 2560x1080 | playerTwo-opening | Touch control <44px | #clubWheelScreen | N/A desktop |
| 2560x1080 | playerTwo-opening | Text scrollWidth > clientWidth | #clubWheelScreen | 1 candidates |
| 2560x1080 | playerTwo-opening | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span | 259>197px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 2560x1080 | playerTwo-opening | Primary action in first screenful | none | N/A no visible action |
| 2560x1080 | playerTwo-manager-one | Horizontal scrollbar | html / body | no; scroll/client 2560/2560px; overflow visible/hidden |
| 2560x1080 | playerTwo-manager-one | Element wider than window | #clubWheelScreen | 0 content; 1 decoration |
| 2560x1080 | playerTwo-manager-one | Oversized decoration (crop candidate) | #world > div.reveal.on:nth-of-type(4) > div.rvInner:nth-of-type(1) > div.rvFlap.plateDup:nth-of-type(5) | 2659.4px; left/right -34.4/2625px |
| 2560x1080 | playerTwo-manager-one | Touch control <44px | #clubWheelScreen | N/A desktop |
| 2560x1080 | playerTwo-manager-one | Text scrollWidth > clientWidth | #clubWheelScreen | 1 candidates |
| 2560x1080 | playerTwo-manager-one | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span | 259>197px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 2560x1080 | playerTwo-manager-one | Primary action in first screenful | none | N/A no visible action |
| 2560x1080 | playerTwo-manager-two | Horizontal scrollbar | html / body | no; scroll/client 2560/2560px; overflow visible/hidden |
| 2560x1080 | playerTwo-manager-two | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 2560x1080 | playerTwo-manager-two | Touch control <44px | #clubWheelScreen | N/A desktop |
| 2560x1080 | playerTwo-manager-two | Text scrollWidth > clientWidth | #clubWheelScreen | 2 candidates |
| 2560x1080 | playerTwo-manager-two | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 569>479px; overflow-x visible; glyph range outside no; Osasuna |
| 2560x1080 | playerTwo-manager-two | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span | 259>197px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 2560x1080 | playerTwo-manager-two | Primary action in first screenful | none | N/A no visible action |
| 2560x1080 | playerTwo-clubs-locked-awaiting-season | Horizontal scrollbar | html / body | no; scroll/client 2560/2560px; overflow visible/hidden |
| 2560x1080 | playerTwo-clubs-locked-awaiting-season | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 2560x1080 | playerTwo-clubs-locked-awaiting-season | Touch control <44px | #clubWheelScreen | N/A desktop |
| 2560x1080 | playerTwo-clubs-locked-awaiting-season | Text scrollWidth > clientWidth | #clubWheelScreen | 2 candidates |
| 2560x1080 | playerTwo-clubs-locked-awaiting-season | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 569>479px; overflow-x visible; glyph range outside no; Osasuna |
| 2560x1080 | playerTwo-clubs-locked-awaiting-season | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 259>197px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 2560x1080 | playerTwo-clubs-locked-awaiting-season | Primary action in first screenful | none | N/A no visible action |
| 2560x1080 | playerTwo-confirm | Horizontal scrollbar | html / body | no; scroll/client 2560/2560px; overflow visible/hidden |
| 2560x1080 | playerTwo-confirm | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 2560x1080 | playerTwo-confirm | Touch control <44px | #clubWheelScreen | N/A desktop |
| 2560x1080 | playerTwo-confirm | Text scrollWidth > clientWidth | #clubWheelScreen | 2 candidates |
| 2560x1080 | playerTwo-confirm | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 569>479px; overflow-x visible; glyph range outside no; Osasuna |
| 2560x1080 | playerTwo-confirm | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 208>197px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 2560x1080 | playerTwo-confirm | Primary action in first screenful | #continueClubAssignment | yes; 430×104.9px; top/bottom 967/1071.9px; CONFIRM SHARED SHOWDOWN; center unobscured yes |
| 2560x1080 | playerTwo-confirm-write-failure | Horizontal scrollbar | html / body | no; scroll/client 2560/2560px; overflow visible/hidden |
| 2560x1080 | playerTwo-confirm-write-failure | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 2560x1080 | playerTwo-confirm-write-failure | Touch control <44px | #clubWheelScreen | N/A desktop |
| 2560x1080 | playerTwo-confirm-write-failure | Text scrollWidth > clientWidth | #clubWheelScreen | 2 candidates |
| 2560x1080 | playerTwo-confirm-write-failure | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 569>479px; overflow-x visible; glyph range outside no; Osasuna |
| 2560x1080 | playerTwo-confirm-write-failure | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 208>197px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 2560x1080 | playerTwo-confirm-write-failure | Primary action in first screenful | #continueClubAssignment | yes; 430×104.9px; top/bottom 966/1070.9px; CONFIRM SHARED SHOWDOWN; center unobscured yes |
| 2560x1080 | playerTwo-waiting-rival | Horizontal scrollbar | html / body | no; scroll/client 2560/2560px; overflow visible/hidden |
| 2560x1080 | playerTwo-waiting-rival | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 2560x1080 | playerTwo-waiting-rival | Touch control <44px | #clubWheelScreen | N/A desktop |
| 2560x1080 | playerTwo-waiting-rival | Text scrollWidth > clientWidth | #clubWheelScreen | 2 candidates |
| 2560x1080 | playerTwo-waiting-rival | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 569>479px; overflow-x visible; glyph range outside no; Osasuna |
| 2560x1080 | playerTwo-waiting-rival | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 208>197px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 2560x1080 | playerTwo-waiting-rival | Primary action in first screenful | #continueClubAssignment | yes; 430×104.9px; top/bottom 967/1071.9px; CONFIRMED · WAITING FOR RIVAL; disabled; center unobscured yes |
| 2560x1080 | playerTwo-reconnect | Horizontal scrollbar | html / body | no; scroll/client 2560/2560px; overflow visible/hidden |
| 2560x1080 | playerTwo-reconnect | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 2560x1080 | playerTwo-reconnect | Touch control <44px | #clubWheelScreen | N/A desktop |
| 2560x1080 | playerTwo-reconnect | Text scrollWidth > clientWidth | #clubWheelScreen | 2 candidates |
| 2560x1080 | playerTwo-reconnect | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 569>479px; overflow-x visible; glyph range outside no; Osasuna |
| 2560x1080 | playerTwo-reconnect | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 208>197px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 2560x1080 | playerTwo-reconnect | Primary action in first screenful | #continueClubAssignment | yes; 430×104.9px; top/bottom 967/1071.9px; RECONNECT PLAYERS TO CONTINUE; disabled; center unobscured yes |
| 2560x1080 | playerTwo-career-start-ready | Horizontal scrollbar | html / body | no; scroll/client 2560/2560px; overflow visible/hidden |
| 2560x1080 | playerTwo-career-start-ready | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 2560x1080 | playerTwo-career-start-ready | Touch control <44px | #clubWheelScreen | N/A desktop |
| 2560x1080 | playerTwo-career-start-ready | Text scrollWidth > clientWidth | #clubWheelScreen | 2 candidates |
| 2560x1080 | playerTwo-career-start-ready | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 569>479px; overflow-x visible; glyph range outside no; Osasuna |
| 2560x1080 | playerTwo-career-start-ready | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 208>197px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 2560x1080 | playerTwo-career-start-ready | Primary action in first screenful | #continueClubAssignment | yes; 430×104.9px; top/bottom 966/1070.9px; CONTINUE TO CAREER START; center unobscured yes |
| 2560x1080 | playerTwo-season-mismatch | Horizontal scrollbar | html / body | no; scroll/client 2560/2560px; overflow visible/hidden |
| 2560x1080 | playerTwo-season-mismatch | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 2560x1080 | playerTwo-season-mismatch | Touch control <44px | #clubWheelScreen | N/A desktop |
| 2560x1080 | playerTwo-season-mismatch | Text scrollWidth > clientWidth | #clubWheelScreen | 2 candidates |
| 2560x1080 | playerTwo-season-mismatch | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 569>479px; overflow-x visible; glyph range outside no; Osasuna |
| 2560x1080 | playerTwo-season-mismatch | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 208>197px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 2560x1080 | playerTwo-season-mismatch | Primary action in first screenful | #continueClubAssignment | yes; 430×104.9px; top/bottom 967/1071.9px; SEASON PLAN MISMATCH · RECOVERY REQUIRED; disabled; center unobscured yes |
| 2560x1080 | playerTwo-long-club-names | Horizontal scrollbar | html / body | no; scroll/client 2560/2560px; overflow visible/hidden |
| 2560x1080 | playerTwo-long-club-names | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 2560x1080 | playerTwo-long-club-names | Touch control <44px | #clubWheelScreen | N/A desktop |
| 2560x1080 | playerTwo-long-club-names | Text scrollWidth > clientWidth | #clubWheelScreen | 3 candidates |
| 2560x1080 | playerTwo-long-club-names | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 569>479px; overflow-x visible; glyph range outside no; Deportivo La Coruña |
| 2560x1080 | playerTwo-long-club-names | Text width flag (verify glyphs/pseudo-elements) | #clubNameTwo | 569>479px; overflow-x visible; glyph range outside no; Borussia Mönchengladbach |
| 2560x1080 | playerTwo-long-club-names | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 208>197px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 2560x1080 | playerTwo-long-club-names | Primary action in first screenful | #continueClubAssignment | yes; 430×104.9px; top/bottom 966/1070.9px; CONFIRM SHARED SHOWDOWN; center unobscured yes |
| 2560x1080 | playerOne-confirmation-overlap-detail | Horizontal scrollbar | html / body | no; scroll/client 2560/2560px; overflow visible/hidden |
| 2560x1080 | playerOne-confirmation-overlap-detail | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 2560x1080 | playerOne-confirmation-overlap-detail | Touch control <44px | #clubWheelScreen | N/A desktop |
| 2560x1080 | playerOne-confirmation-overlap-detail | Text scrollWidth > clientWidth | #clubWheelScreen | 2 candidates |
| 2560x1080 | playerOne-confirmation-overlap-detail | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 569>479px; overflow-x visible; glyph range outside no; Osasuna |
| 2560x1080 | playerOne-confirmation-overlap-detail | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 202>197px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 2560x1080 | playerOne-confirmation-overlap-detail | Primary action in first screenful | #continueClubAssignment | yes; 430×104.9px; top/bottom 967/1071.9px; CONFIRM SHARED SHOWDOWN; center unobscured yes |
| 2560x1080 | playerTwo-confirmation-overlap-detail | Horizontal scrollbar | html / body | no; scroll/client 2560/2560px; overflow visible/hidden |
| 2560x1080 | playerTwo-confirmation-overlap-detail | Element wider than window | #clubWheelScreen | 0 content; 0 decoration |
| 2560x1080 | playerTwo-confirmation-overlap-detail | Touch control <44px | #clubWheelScreen | N/A desktop |
| 2560x1080 | playerTwo-confirmation-overlap-detail | Text scrollWidth > clientWidth | #clubWheelScreen | 2 candidates |
| 2560x1080 | playerTwo-confirmation-overlap-detail | Text width flag (verify glyphs/pseudo-elements) | #clubNameOne | 569>479px; overflow-x visible; glyph range outside no; Osasuna |
| 2560x1080 | playerTwo-confirmation-overlap-detail | Text width flag (verify glyphs/pseudo-elements) | #clubRivalryConfirmation > div.clubRivalryHeadline:nth-of-type(1) > span.is-lock-stamping | 200>197px; overflow-x visible; glyph range outside no; CLUBS LOCKED |
| 2560x1080 | playerTwo-confirmation-overlap-detail | Primary action in first screenful | #continueClubAssignment | yes; 430×104.9px; top/bottom 967/1071.9px; CONFIRM SHARED SHOWDOWN; center unobscured yes |
