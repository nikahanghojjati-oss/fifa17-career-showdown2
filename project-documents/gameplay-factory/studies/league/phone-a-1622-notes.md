# JOB-1622 phone A (faithful re-run) - notes
- Follows PHONE_LEAGUE.png: header, brush title, league name between the managers, wheel, note, CONTINUE, BACK, footer.
- Managers sit above the Ligue 1 and LaLiga slices so no mark or name is covered.
- Wheel = min(76vw, 100dvh - 392px): no scroll at 393x660 and 360x640; it shrinks at 375x553.
- Wheel: one inline SVG (480 unit box) under the existing WHEEL_RIM_V1 art; slices in live order, 72 deg apart from the top.
- Each LEAGUE MARKS V2 shape (js/visualIdentity.js) keeps its own 0 0 100 100 viewBox and is drawn 52 units wide, centred in its own slice with its name beneath. Flat gold; black on the lit Premier League slice.
- Hub is a gold football; the pointer is a plain gold triangle (no crown). Daniel LEFT, Nik RIGHT, fully visible and clear of every mark.
- Live text only (selected note, CONTINUE TO CLUB ASSIGNMENT, BACK, SEASON 1 / 1, footer v1.9.1). Fonts: Barlow Condensed, Arial Narrow fallback (checked with the wider fallback).
- Browser check (headless Chromium, screenshots viewed) at 393x660, 360x640, 375x553: no horizontal overflow, no clipped label, button visible, every mark and name inside its slice and the rim, no manager over a mark.
