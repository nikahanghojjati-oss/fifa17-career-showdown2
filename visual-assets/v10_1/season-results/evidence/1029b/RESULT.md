# JOB-1029b: Season Results on short desktop windows

Branch `v-1029b-season-results-short-desktop`. CSS only, tested on pr/415 (head 84a8bf5 = gameplay/bug-list-1 plus the 1029 block). Nothing was changed in production text, ids or buttons.

## Files
- `added-rules.css`: only the new rules. Append after the JOB-1029 block in `visual-assets/v10_1/season-results/app.css` as the last rules (61 lines, braces balanced).
- `proposed-app.css`: pr/415's app.css (byte-identical prefix) plus those rules.
- `shots/{before,after}-<size>-<state>.jpg` (1366x650, 1280x620, 1536x730, 1440x900, 1920x1080) and `sheet_<size>_before_after.jpg` (before left, after right).
- `render1029b.cjs`: the Playwright harness (stubs the review DOM, measures with getBoundingClientRect; networkidle, document.fonts.ready, then 2.5 s before every shot).

## What the rules do
Everything sits in media queries that need `min-width:901px` (the 1029 block's own rules start there; 761-900 px windows keep their old layout).
1. **Review, `max-height:1000px`** (covers 1440x900; 1920x1080 is outside):
   - the static scoring panel is `display:none` while the review box is open (the entry screen still shows it, nothing is removed from the DOM);
   - the review box moves up onto the scoring panel's own column (x 27.73%, width 44.47%, top 31.2%, or 28.4% on windows 2.05:1 and wider where the plate is cropped and the title ends higher). That column sits between the two faces, so Daniel's and Nik's faces stay uncovered by construction (face boxes checked, see below);
   - paddings, card, line and chip sizes are tightened; the projected-score bar becomes one line; the empty action row is hidden; the reconciliation panel becomes text left plus button right (about 100 px instead of 235 px);
   - the action row of the box (publish/edit/commit/continue) is `position:sticky;bottom:0` with an opaque background. It is in the flow, so it never covers a card, and it only sticks in the worst stack where content must scroll;
   - width fixes: the overall bar, warnings, error and action row had widths wider than the box (620/900/650 px in a 539 px box) and spilled over the right edge; they are `width:auto` now;
   - the review error (`.seasonReviewError`) gets the same black-and-gold error look as the entry error (it was pale-pink bar with pale text, unreadable).
2. **Entry, `max-height:760px`**: scoring panel compacted (smaller padding, heading, grid gap, trophy), cards at top 49% (or 51% on windows narrower than 2.05:1) with fixed height 33-33.5%, action row at 84.5% (86%), and the error line follows the row (`top: row top + row height + 6px`) so it ends inside the window (it ended at 633/620 and 660/650 before).
3. The Back row stays where 1029 puts it in review (92%) and the box ends above it.

## Measurements (getBoundingClientRect; "in view" = the action is inside the review box's visible area, inside the window and hit-testable at its centre)
Overlap = any visible block pair intersecting (scoring panel, review box, cards, Back row, error line), plus any of them intersecting a face box (Daniel plate x 10-27%, Nik x 73-91%, y 9-45% of the 16:9 plate, below the app header). Error column: bottom of the entry error (#seasonEntryError) or of the review error (#seasonReviewError) / window height; it must be below 1.0.

**1366x650**

| state | before: main action bottom / window height | before overlap | after: main action bottom / window height | after overlap | error line bottom before -> after |
|---|---|---|---|---|---|
| Entry (own card): REVIEW SEASON | 616/650 in view | no | 593/650 in view | no |  |
| Entry both cards + error line | 616/650 in view | no | 593/650 in view | no | 660/650 -> 627/650 |
| Review, publish: PUBLISH MY SEASON RESULT | 689/650 NOT visible | no | 479/650 in view | no |  |
| Review, publish + review error | 719/650 NOT visible | no | 505/650 in view | no | 663/650 -> 451/650 |
| Review, published, waiting (PUBLISHED, disabled) | 658/650 NOT visible | no | 453/650 in view | no |  |
| Review, commit: SEASON COMMIT ACKNOWLEDGED | 745/650 NOT visible | no | 508/650 in view | no |  |
| Review, commit + review error | 775/650 NOT visible | no | 534/650 in view | no | 689/650 -> 456/650 |
| Review, multi-season: SEASON PLAN COMPLETE | 745/650 NOT visible | no | 508/650 in view | no |  |
| Review, reconciliation: PREVIEW LOCAL RECONCILIATION | 818/650 NOT visible | no | 514/650 in view | no |  |
| Review, commit + multi + reconciliation all present | 775/650 NOT visible | no | 532/650 in view | no |  |

**1280x620**

| state | before: main action bottom / window height | before overlap | after: main action bottom / window height | after overlap | error line bottom before -> after |
|---|---|---|---|---|---|
| Entry (own card): REVIEW SEASON | 590/620 in view | yes | 568/620 in view | no |  |
| Entry both cards + error line | 590/620 in view | yes | 568/620 in view | no | 633/620 -> 601/620 |
| Review, publish: PUBLISH MY SEASON RESULT | 673/620 NOT visible | yes | 470/620 in view | no |  |
| Review, publish + review error | 703/620 NOT visible | yes | 497/620 in view | no | 647/620 -> 443/620 |
| Review, published, waiting (PUBLISHED, disabled) | 642/620 NOT visible | yes | 445/620 in view | no |  |
| Review, commit: SEASON COMMIT ACKNOWLEDGED | 729/620 NOT visible | yes | 499/620 in view | no |  |
| Review, commit + review error | 758/620 NOT visible | yes | 526/620 in view | no | 673/620 -> 447/620 |
| Review, multi-season: SEASON PLAN COMPLETE | 729/620 NOT visible | yes | 499/620 in view | no |  |
| Review, reconciliation: PREVIEW LOCAL RECONCILIATION | 801/620 NOT visible | yes | 506/620 in view | no |  |
| Review, commit + multi + reconciliation all present | 758/620 NOT visible | yes | 524/620 in view | no |  |

**1536x730**

| state | before: main action bottom / window height | before overlap | after: main action bottom / window height | after overlap | error line bottom before -> after |
|---|---|---|---|---|---|
| Entry (own card): REVIEW SEASON | 691/730 in view | no | 666/730 in view | no |  |
| Entry both cards + error line | 691/730 in view | no | 666/730 in view | no | 734/730 -> 698/730 |
| Review, publish: PUBLISH MY SEASON RESULT | 737/730 NOT visible | no | 494/730 in view | no |  |
| Review, publish + review error | 767/730 NOT visible | no | 520/730 in view | no | 709/730 -> 464/730 |
| Review, published, waiting (PUBLISHED, disabled) | 706/730 NOT visible | no | 468/730 in view | no |  |
| Review, commit: SEASON COMMIT ACKNOWLEDGED | 793/730 NOT visible | no | 522/730 in view | no |  |
| Review, commit + review error | 823/730 NOT visible | no | 549/730 in view | no | 735/730 -> 468/730 |
| Review, multi-season: SEASON PLAN COMPLETE | 793/730 NOT visible | no | 522/730 in view | no |  |
| Review, reconciliation: PREVIEW LOCAL RECONCILIATION | 849/730 NOT visible | no | 528/730 in view | no |  |
| Review, commit + multi + reconciliation all present | 823/730 NOT visible | no | 547/730 in view | no |  |

**1440x900**

| state | before: main action bottom / window height | before overlap | after: main action bottom / window height | after overlap | error line bottom before -> after |
|---|---|---|---|---|---|
| Entry (own card): REVIEW SEASON | 808/900 in view | no | 808/900 in view | no |  |
| Entry both cards + error line | 808/900 in view | no | 808/900 in view | no | 846/900 -> 846/900 |
| Review, publish: PUBLISH MY SEASON RESULT | 820/900 NOT visible | no | 594/900 in view | no |  |
| Review, publish + review error | 850/900 NOT visible | no | 620/900 in view | no | 794/900 -> 566/900 |
| Review, published, waiting (PUBLISHED, disabled) | 789/900 NOT visible | no | 568/900 in view | no |  |
| Review, commit: SEASON COMMIT ACKNOWLEDGED | 876/900 NOT visible | no | 623/900 in view | no |  |
| Review, commit + review error | 906/900 NOT visible | no | 649/900 in view | no | 820/900 -> 571/900 |
| Review, multi-season: SEASON PLAN COMPLETE | 876/900 NOT visible | no | 623/900 in view | no |  |
| Review, reconciliation: PREVIEW LOCAL RECONCILIATION | 932/900 NOT visible | no | 629/900 in view | no |  |
| Review, commit + multi + reconciliation all present | 906/900 NOT visible | no | 647/900 in view | no |  |

**1920x1080**

| state | before: main action bottom / window height | before overlap | after: main action bottom / window height | after overlap | error line bottom before -> after |
|---|---|---|---|---|---|
| Entry (own card): REVIEW SEASON | 1017/1080 in view | no | 1017/1080 in view | no |  |
| Entry both cards + error line | 1017/1080 in view | no | 1017/1080 in view | no | 1057/1080 -> 1057/1080 |
| Review, publish: PUBLISH MY SEASON RESULT | 961/1080 in view | no | 961/1080 in view | no |  |
| Review, publish + review error | 994/1080 NOT visible | no | 994/1080 NOT visible | no | 926/1080 -> 926/1080 |
| Review, published, waiting (PUBLISHED, disabled) | 927/1080 in view | no | 927/1080 in view | no |  |
| Review, commit: SEASON COMMIT ACKNOWLEDGED | 1017/1080 NOT visible | no | 1017/1080 NOT visible | no |  |
| Review, commit + review error | 1050/1080 NOT visible | no | 1050/1080 NOT visible | no | 949/1080 -> 949/1080 |
| Review, multi-season: SEASON PLAN COMPLETE | 1017/1080 NOT visible | no | 1017/1080 NOT visible | no |  |
| Review, reconciliation: PREVIEW LOCAL RECONCILIATION | 1069/1080 NOT visible | no | 1069/1080 NOT visible | no |  |
| Review, commit + multi + reconciliation all present | 1121/1080 NOT visible | no | 1121/1080 NOT visible | no |  |

**1280x720**

| state | before: main action bottom / window height | before overlap | after: main action bottom / window height | after overlap | error line bottom before -> after |
|---|---|---|---|---|---|
| Entry (own card): REVIEW SEASON | 680/720 in view | no | 666/720 in view | no |  |
| Entry both cards + error line | 680/720 in view | no | 666/720 in view | no | 721/720 -> 697/720 |
| Review, publish: PUBLISH MY SEASON RESULT | 726/720 NOT visible | no | 519/720 in view | no |  |
| Review, publish + review error | 755/720 NOT visible | no | 545/720 in view | no | 699/720 -> 491/720 |
| Review, published, waiting (PUBLISHED, disabled) | 694/720 NOT visible | no | 493/720 in view | no |  |
| Review, commit: SEASON COMMIT ACKNOWLEDGED | 782/720 NOT visible | no | 548/720 in view | no |  |
| Review, commit + review error | 811/720 NOT visible | no | 574/720 in view | no | 726/720 -> 496/720 |
| Review, multi-season: SEASON PLAN COMPLETE | 782/720 NOT visible | no | 548/720 in view | no |  |
| Review, reconciliation: PREVIEW LOCAL RECONCILIATION | 854/720 NOT visible | no | 554/720 in view | no |  |
| Review, commit + multi + reconciliation all present | 811/720 NOT visible | no | 572/720 in view | no |  |

**1366x768**

| state | before: main action bottom / window height | before overlap | after: main action bottom / window height | after overlap | error line bottom before -> after |
|---|---|---|---|---|---|
| Entry (own card): REVIEW SEASON | 724/768 in view | no | 724/768 in view | no |  |
| Entry both cards + error line | 724/768 in view | no | 724/768 in view | no | 763/768 -> 763/768 |
| Review, publish: PUBLISH MY SEASON RESULT | 751/768 NOT visible | no | 534/768 in view | no |  |
| Review, publish + review error | 781/768 NOT visible | no | 560/768 in view | no | 725/768 -> 506/768 |
| Review, published, waiting (PUBLISHED, disabled) | 720/768 NOT visible | no | 508/768 in view | no |  |
| Review, commit: SEASON COMMIT ACKNOWLEDGED | 807/768 NOT visible | no | 563/768 in view | no |  |
| Review, commit + review error | 837/768 NOT visible | no | 589/768 in view | no | 751/768 -> 511/768 |
| Review, multi-season: SEASON PLAN COMPLETE | 807/768 NOT visible | no | 563/768 in view | no |  |
| Review, reconciliation: PREVIEW LOCAL RECONCILIATION | 880/768 NOT visible | no | 569/768 in view | no |  |
| Review, commit + multi + reconciliation all present | 837/768 NOT visible | no | 587/768 in view | no |  |

## Notes and limits
- 1920x1080: all 12 states re-rendered before and after are pixel-identical (PIL difference bbox None). Phone 393x660 (entry, review publish, review commit): pixel-identical, and the new rules are all inside `min-width:901px` media queries.
- The 1920x1080 rows above show a problem that already exists in the 1029 layout and that this job does not touch: the commit / continue / reconciliation action sits 23-75 px below the bottom of the review box (box ends at 994 px, the actions end at 1017-1069 px), so it needs an in-box scroll there too. Raising the review `max-height` bound from 1000px to 1100px would fix it, but it would change 1920x1080.
- All-actions-at-once state (row `all present`: commit + continue + reconciliation together, the worst stack): at 1366x650 and 1280x620 the commit/continue buttons are in view (sticky), the reconciliation preview button is reachable after 40-58 px of in-box scroll. At 1536x730 and taller it fits without scrolling. Alone, the reconciliation state fits without scrolling at all five sizes.
- Entry on a 1024x600 window (not asked for) still overlaps the scoring panel by 5 px (was 17 px before the final tuning; 1200x720 and 1280x720 have none).
- 761-900 px wide windows are unchanged on purpose.
- The review harness stubs the DOM like render399 (same text and ids); `.seasonReviewError` text is a made-up message. Real production states were not driven (no live shared run).
