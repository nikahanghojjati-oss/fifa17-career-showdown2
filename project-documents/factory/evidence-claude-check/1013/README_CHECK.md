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
