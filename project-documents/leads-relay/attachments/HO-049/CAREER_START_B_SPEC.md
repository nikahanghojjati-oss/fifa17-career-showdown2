# HO-049 item 4 · Career Start, option B (Nik picked B, 31 Oct 2026 5:23 a.m. Eastern)

Picture: `HO-049_CAREER_START_OPTION_B.jpg` (this folder). Reference mock (screenshot-only, injected over the Club screen): `career_start_B_mock.js`.
Team G builds it (product wiring stays yours); Team V reviews the shots.

## Look
- Career Start is its own stage on the Club Assignment plate (Daniel LEFT, Nik RIGHT). No dialog box over the wordmark or faces. No dim, no scrim, no flash.
- Title "CAREER START" (gold gradient, kicker "CAREER MODE SHOWDOWN 17") where the Club title sits.
- **Each manager holds his club's crest where the pack is:** crest (`getClubCrestSvg(club)`) + club name in the pack face, replacing the pack emblem / "CLUB PACK CM17".
- Desktop: a narrow black-marble pillar (r78 marble tile, gold edge) between the two men: kicker "START YOUR FIFA 17 CAREER", chips League + Seasons, the product's own message, "Rival: Nik · Bologna" line. The two buttons (I STARTED AT <CLUB> gold, REFRESH gold outline) sit centred on the lower deck.
- Phone: crests on the painted packs; one marble panel below holds kicker, chips, message, (rival line only when ≥290px is left), buttons.

## NIK'S RULE: the crest ALWAYS fits inside the pack frame, never overflows
- Frame = the pack face. Inner box = frame inset 10% each side. Crest + name live inside that box; `overflow: hidden` on the box as a safety net.
- Name label size `clamp(11px, innerH × 0.16, 22px)`, one line, no wrap. Crest = square `floor(min(innerW, innerH − 1.5 × label))`, contain fit.
- Desktop frame = the `.clubPackStage` rect. Phone frame = the painted pack in `ENV_CLUB_PHONE_V2.webp` (1179×2096) mapped through the plate's `center top / max(100vw, 100svh×1179/2096)`: left pack x 236–556, right 668–996, y 584–924 (plate px).
- Phone: the marble panel starts at `max(scene bottom, pack bottom + 6px)`, so nothing covers the packs.
- Checked by assertion at 1366×768, 1440×900, 1920×1080, 393×660, 375×553, 360×640, 412×915: crest and name inside the frame at all 7 (`fits`). Please keep the same assertion in your audit.
