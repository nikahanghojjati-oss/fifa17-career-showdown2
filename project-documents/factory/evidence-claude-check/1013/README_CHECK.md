# Lead check · Team G PR #397 (job 1015 · G, head f9c1145) · 2026-10-06 02:45 UTC
Functional PASS:
- Home has no pair box before or after connecting.
- All four states render.
- Phone 393x660 and 360x640 have no page scroll, and the code and its buttons are visible.
- Back returns Home.

Design FIX, compared with Team V's SJ frames:
- Desktop 1440 shows Nik twice: the separate cut-out `.connectPlayersNik` is misaligned over the plate's own painted Nik.
- The title is plain, not the brush CONNECT PLAYERS.
- On phone, BACK floats at the bottom centre instead of the tab row, and the bottom nav is hidden.
- The main buttons are outlined, not solid yellow.

Sheet: `team_g_pr397_check.jpg`, with the references in the bottom rows.

# Re-check · Team G PR #405 (job 1022 · G, head 201471b) · 2026-10-06 03:05 UTC
PASS on all four design items:
- Desktop 1440 and 1920 show Nik once (the plate only). Daniel's pointing hand is the plate's own, so the OVL_SJ_DANIEL_HAND overlay isn't needed.
- On phone 393x660 and 360x640, the brush title sits below the faces, BACK is in the tab row, and the bottom nav is visible. There's no page scroll.
- Primary buttons are solid yellow and secondary buttons are outlined.

Minor, not blocking: the phone title uses a thinner gold script than the bold SJ brush, and on 360 the kicker and subtitle are dropped.

Sheets: `team_g_pr405_phone.jpg`, `team_g_pr405_desktop.jpg`.
