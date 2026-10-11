# JOB-1626 upright tablet (re-run) - notes
- A real tablet layout: large title and league name, managers beside a large wheel, wide note panel, CONTINUE (2/3) and BACK (1/3) in one row.
- Wheel = min(56vw, 100dvh - 560px), up to 540px; larger type than the phone versions.
- The pointer has its own gap above the wheel so it never covers the league name.
- Wheel: one inline SVG (480 unit box) under the existing WHEEL_RIM_V1 art; slices in live order, 72 deg apart from the top.
- Each LEAGUE MARKS V2 shape (js/visualIdentity.js) keeps its own 0 0 100 100 viewBox and is drawn 52 units wide, centred in its own slice with its name beneath. Flat gold; black on the lit Premier League slice.
- Hub is a gold football; the pointer is a plain gold triangle (no crown). Daniel LEFT, Nik RIGHT, fully visible and clear of every mark.
- Live text only (selected note, CONTINUE TO CLUB ASSIGNMENT, BACK, SEASON 1 / 1, footer v1.9.1). Fonts: Barlow Condensed, Arial Narrow fallback (checked with the wider fallback).
- Browser check (headless Chromium, screenshots viewed) at 768x1024, 820x1180: no horizontal overflow, no clipped label, button visible, every mark and name inside its slice and the rim, no manager over a mark.
