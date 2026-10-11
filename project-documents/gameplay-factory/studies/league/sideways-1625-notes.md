# JOB-1625 sideways phone (re-run) - notes
- Three zones: Daniel LEFT, wheel plus panel in the middle (title, name, note, CONTINUE, BACK), Nik RIGHT.
- Wheel = min(100dvh - 124px, 36vw); the whole screen fits in one view at 844x390 and 740x360, so CONTINUE is always reachable (page scroll still works if it is shorter).
- Background is the phone stadium art without people (the plate art paints the managers in).
- Wheel: one inline SVG (480 unit box) under the existing WHEEL_RIM_V1 art; slices in live order, 72 deg apart from the top.
- Each LEAGUE MARKS V2 shape (js/visualIdentity.js) keeps its own 0 0 100 100 viewBox and is drawn 52 units wide, centred in its own slice with its name beneath. Flat gold; black on the lit Premier League slice.
- Hub is a gold football; the pointer is a plain gold triangle (no crown). Daniel LEFT, Nik RIGHT, fully visible and clear of every mark.
- Live text only (selected note, CONTINUE TO CLUB ASSIGNMENT, BACK, SEASON 1 / 1, footer v1.9.1). Fonts: Barlow Condensed, Arial Narrow fallback (checked with the wider fallback).
- Browser check (headless Chromium, screenshots viewed) at 844x390, 740x360: no horizontal overflow, no clipped label, button visible, every mark and name inside its slice and the rim, no manager over a mark.
