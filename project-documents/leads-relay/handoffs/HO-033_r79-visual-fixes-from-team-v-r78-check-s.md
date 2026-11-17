# HO-033 · Team V → Team G · r79 visual fixes from Team V r78 check (scrims, see-through panels, Season Results no-scroll)

```ticket
{
 "id": "HO-033",
 "from": "V",
 "to": "G",
 "title": "r79 visual fixes from Team V r78 check (scrims, see-through panels, Season Results no-scroll)",
 "kind": "bug",
 "priority": "normal",
 "worker": "",
 "parent": null,
 "job": null,
 "status": "DONE",
 "steps": [{"name": "owner-rule breaks fixed (1-5)", "done": true}, {"name": "readability and polish (6-9)", "done": true}],
 "evidence": ["PR #902 merged into gameplay/r79 as 1940d43d (CI 8/8 green, Codex clean on 7857c68). Shots: /mnt/project-files/gameplay/r79/ho033-shots/. Club phone emblem done in CSS per V's coordinates. Open for V: TITLE_CONNECT_PLAYERS_V1 wordmark (ticket 1847)."],
 "log": [{"at": "2026-10-17T22:19:44Z", "by": "V", "status": "SENT", "note": ""}, {"at": "2026-10-17T22:21:26Z", "by": "G", "status": "RECEIVED", "note": "r79 lead: starting now in a helper, branch claude-gameplay/r79-visual-fixes into gameplay/r79"}, {"at": "2026-10-17T22:21:26Z", "by": "G", "status": "WORKING", "note": "items 1-9 in one PR; render check per changed screen"}, {"at": "2026-10-17T23:33:44Z", "by": "G", "status": "WORKING", "note": "Fixed in PR #902 (claude-gameplay/r79-visual-fixes): scrims/vignette removed, opaque panels, phone buttons docked, faces clear, fonts, red DELETE. Desktop see-through panels follow-up in progress. Art needed from V: gold brush CONNECT PLAYERS wordmark; Club phone blank black bags."}, {"at": "2026-10-18T00:24:27Z", "by": "G", "status": "DONE", "note": ""}]
}
```

# r79 visual fixes from the Team V r78 check (main f15f54f9)

Full report with screenshots, per-screen scores and file pointers: project-documents/factory/reviews/R78_VISUAL_CHECK/REPORT.md on factory/v1-wtt5ye (commit 427554c5). Overall closeness to the approved pictures 76/100 (desktop 82, phone 70). Phone face check passes on all 12 screens at 4 sizes.

Owner-rule breaks first (HO-027 "no dim/overlay/see-through", phone no-scroll):
1. Rule Book: full-screen black scrim 48-74% darkens the library. visual-assets/v10_1/rule-book/rule-book.css .ruleBookScrim (lines 18-24 and 333-337), created in js/rulesSettingsV10.js:38. Remove it; text panels are already opaque marble (HO-028).
2. Shared stage vignette up to 62% black at the edges on every shared-stage screen: visual-assets/v10_1/shared/stage.css:128-134 (.sd-stage__vignette). Settings adds a 12-28% scrim. Remove (lighting must look like the signed-in Home reference, project-documents/factory/reviews/LIGHTING_REFERENCE_LIVE_HOME_DESKTOP.png).
3. Final Winner phone SUMMARY/HONOURS panel is see-through (93->82%): final-winner.css:348-356. Make it opaque marble like HO-029.
4. Season Results phone: REVIEW SEASON and BACK below the fold at 393x660 and 360x640; on the review stage CONFIRM & SAVE SEASON is ~1100-1300 px down. Desktop 1920x1080 review: CONFIRM & SAVE / EDIT RESULTS off screen. visual-assets/v10_1/season-results/app.css. Primary actions must be visible without scroll.
5. Sideways phone 852x393: Final Winner pushes both managers below the panel (only head tops show, final-winner.css landscape block); Career Statistics puts Nik's face behind the semi-transparent Career Table panel.

Then readability and polish:
6. Career Statistics phone: 6-7 px labels and table text (raise to the HO-028 tokens: 15 px secondary, labels 12 px+).
7. Settings phone: DELETE CURRENT SHOWDOWN is still the old pale pink button; the red marble style only applies on wide landscape (css/app.css .dangerButton, css/rulesSettingsV10.css:1119/1154).
8. Rule Book: at 1440x900 cards 05-06 and BACK need a 537 px scroll; on phone sections 03-06 scroll. Accepted trade-off of the bigger HO-028 text, but please check BACK stays reachable (sticky or in view).
9. Smaller items in the report: Connect Players title is a smooth gradient instead of the gold brush lettering; Transfer title clipped at 1440; Club phone packs show blank black bags; League phone keeps the old header and shows the version footer.

Known and not in scope: League on taller phones (412x915, 360x800), already on your r79 list. Ask for any picture help through a new ticket.
