# JOB-1622 phone A (faithful re-run) - notes
- Layout follows PHONE_LEAGUE.png: header, brush title, league name, wheel with Daniel LEFT / Nik RIGHT, note, CONTINUE, BACK, footer.
- Wheel is one inline SVG (480 unit box) under the existing WHEEL_RIM_V1 art. Slices follow the live order, 72 deg apart from the top.
- Each LEAGUE MARKS V2 shape (js/visualIdentity.js) sits in its own 0 0 100 100 viewBox and is drawn 52 units wide inside the 480 wheel,
  centred in its slice with the name beneath. Flat gold; black on the lit Premier League slice. Nothing exceeds its slice or the rim.
- Hub is a gold football and the pointer is a plain gold triangle (no crown), as the picture fixes.
- Managers are placed above the Ligue 1 and LaLiga slices so no mark or name is covered.
- Text is the live text only: selected-league note and CONTINUE TO CLUB ASSIGNMENT, BACK, SEASON 1 / 1, footer v1.9.1.
- Wheel size is min(76vw, 100dvh - 392px), so there is no scroll at 393x660 or 360x640; the wheel shrinks at 375x553.
- Browser check (headless Chromium): 393x660, 360x640, 375x553 all pass: no horizontal overflow, no clipped label, button visible,
  every mark and name inside its slice and rim, no manager over a mark.
- Fonts: Barlow Condensed with Arial Narrow fallback (checked with the wider fallback).
