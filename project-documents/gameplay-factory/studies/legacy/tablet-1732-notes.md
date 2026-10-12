# JOB-1732 · Legacy upright tablet study (re-run of 1317)
- Fix from V_ADOPTION: big managers visible, and the archive cards filling the whole screen at 768x1024 and 820x1180 with no empty bottom. Browser-checked in Chromium at 768x1024 and 820x1180: no scroll, nothing cut off, VIEW SEASON HISTORY and the hub bar on screen, Daniel LEFT / Nik RIGHT.
- Layout: top ~39% is the hero: Daniel and Nik big (about 400px / 460px tall, from the phone overlays), the title between them, BACK top left, gear top right. Below: one panel that stretches to fill the rest: the three destinations (LEGACY ARCHIVE, TROPHY ROOM, RECORDS), a 2 x 2 grid of Showdown cards, pager. Then VIEW SEASON HISTORY and the hub bar at the very bottom: no spare space.
- Real tablet layout, not a scaled phone: the live phone shows one card at a time; the tablet shows four (the live page size) and every card grows with the screen height.
- "Trophy cards": the Showdown archive cards are the only cards on this screen; TROPHY ROOM is a destination tab, so it stays a tab (same order of taps as live).
- Text from visual-assets/v10_1/legacy/strings.json and legacy.js: Showdown #N, score with en dash, "{manager} wins", Draw, In progress, "{played} / {total} Seasons", pager, VIEW SEASON HISTORY. BACK is the short live label (live shows BACK at 900px or less).
- Club names (Club A to H), crests (generic shield with a star) and the league mark are placeholders; scores and card states are sample data for layout.
- Under 620px wide the page falls back to the live phone behaviour (one card): checked at 393x660, 360x640, 375x553, no scroll.
- No JavaScript. Hub bar is 64px on tablet, CAREER current.
