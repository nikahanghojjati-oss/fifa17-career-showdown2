# HO-043 · Team G → Team V · Polish pass: 7 look/layout items from the full-game screen audit (dimming, covering panels, Legacy space, phone titles, faded buttons)

```ticket
{
 "id": "HO-043",
 "from": "G",
 "to": "V",
 "title": "Polish pass: 7 look/layout items from the full-game screen audit (dimming, covering panels, Legacy space, phone titles, faded buttons)",
 "kind": "design",
 "priority": "normal",
 "worker": "",
 "parent": null,
 "job": "1052",
 "status": "DONE",
 "steps": [],
 "evidence": ["claude-visual/r87-polish-ho043 @ 7024fa91 - PR #1052 into gameplay/r87; before/after pairs attachments/HO-043/v-after/", "claude-visual/r87-polish-ho043 @ 6fff3165 - PR #1052 all 8 gate checks green (seal passed 14:14 UTC); two gate rounds fixed on the way: Legacy list compact in its pane, bigger review text laptop-only"],
 "log": [{"at": "2026-10-29T08:16:10Z", "by": "G", "status": "SENT", "note": ""}, {"at": "2026-10-29T08:20:08Z", "by": "V", "status": "RECEIVED", "note": "Team V: received; asking the coordinator for a dedicated Team V thread"}, {"at": "2026-10-29T13:23:23Z", "by": "V", "status": "DONE", "note": "Team V: PR #1052 into gameplay/r87, CSS only. Fixed: 2 (dialogs = one low strip under the League buttons / over the Club button row, since Club has no free band), 3 (history inside the empty Legacy pane above the pager), 5 (waiting buttons solid black/gold, no see-through), 6b (review text 14px), 4c (phone lock note on marble panel), 7 (phone Standings title same height on both tabs), 1 (only dim found on phone Home = music sheet backdrop, now clear; the Join panel itself does not dim). Reported back without change: 4a/4b (phone titles match approved PHONE_*_MARBLE mockups, faces clear - Nik's call), 6a (Settings 75% is the largest zoom that fits the approved NEXT_SETTINGS layout at 1440x900). Flash audit 0 problems, face check PASS, r80 short screens no new findings."}, {"at": "2026-10-29T14:15:01Z", "by": "V", "status": "DONE", "note": "Team V: PR #1052 is green on the full gate at 6fff3165, ready for the r87 lead to merge."}],
 "from_session": "session_01GU43Q8hTVduogfPa3QEm4Z"
}
```

# Polish pass: seven look and layout items from a full-game screen audit (Nik: "full polish and huge UI improvement of all game menus, buttons, text")

Nik asked (2026-10-29 04:32 UTC) for a full polish and a big UI improvement across every game menu, button and piece of text. Team G played a full 3-season Showdown as both managers on the r87 build (gameplay/r87 @beb34d1; Daniel 1440x900 laptop, Nik 393x660 phone, emulator) and saved all 246 screens. Team G is fixing the wording, button-state and empty-state items itself (branch claude-gameplay/r87-polish-wording, into gameplay/r87). The look and layout items below are yours.

Findings page with pictures: https://claude.ai/artifact/Mz52LiuD65MYgyuGCezrH2
Screenshots: project-documents/leads-relay/attachments/HO-043/ on leads/relay.

## The seven items
1. **Phone Home dims behind the Join/Connect panel** (attachments 1). When Nik opens Join from Home, the Home picture and tiles go dark behind the panel. That breaks HO-027 (no dimming, ever). Show the panel without darkening what is behind it.
2. **Panels cover the game on the laptop** (2a, 2b). "Waiting for Nik" sits on top of the league wheel; the Career Start panel covers both club cards on Club Assignment. Nik's rule: nothing covers anything at any size. Place them so the wheel and the cards stay visible.
3. **Laptop Legacy has a big empty frame** (3). The Showdown card fills about a fifth of the Legacy frame; the rest is blank marble. VIEW SEASON HISTORY opens the season list below the screen, out of sight ("CLOSE SEASON HISTORY" sits under the fold).
4. **Phone titles across the managers' faces** (4a, 4b; also Standings). The big brush titles (SEASON RESULTS, LEGACY, STANDINGS) sit across Daniel and Nik. On phone Club Assignment (4c) the "These clubs stay for the whole Showdown…" text runs over the photo and is hard to read.
5. **Waiting buttons look faded** (5, 2b). Buttons that wait for the other manager (WAITING FOR HOST/Daniel on the league wheel, I STARTED AT <club> while busy, VIEW SEASON HISTORY before data, SPIN WHEEL for Nik) are greyed and see-through. They need a clear "waiting" look that is not dim (HO-027).
6. **Laptop Settings and tiny text** (6a, 6b). Settings is a small panel in the lower left of a large empty lounge with DONE far off in the bottom-right corner. The Season Results panel on a 1440 laptop uses very small text (labels around 9-10 px).
7. **Phone Standings and Career Statistics sit low** (7). The photo takes the top half and the table starts below it, so most numbers need a scroll on a 393x660 phone.

## Keep
Marble black-and-gold look; one target per screen (desktop NEXT_*, phone PHONE_*); no dimming; no flash (never touch anti-flash rules, preload, decode or startup order); don't move elements to new places Nik did not pick without asking him; Team G owns the gameplay JS and the wording.

## Done when / proof back
Each item fixed on its screen, one desktop (1440x900 or 1920x1080) and one phone (393x660 or 393x852) shot per changed screen, and a flash check of the changed screens. Reply on this ticket with the PR; Team G merges into gameplay/r87 through the r87 lead and adds the shots to the release gallery.
