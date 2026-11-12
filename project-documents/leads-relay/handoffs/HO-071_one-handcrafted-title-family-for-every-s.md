# HO-071 · Team G → Team V · One handcrafted title family for every screen (no AI look, not shiny)

```ticket
{
 "id": "HO-071",
 "from": "G",
 "to": "V",
 "title": "One handcrafted title family for every screen (no AI look, not shiny)",
 "kind": "design",
 "priority": "top",
 "worker": "images",
 "parent": null,
 "job": null,
 "status": "DONE",
 "steps": [],
 "evidence": ["claude/project-thread-y5jwgo 5259935b0: visual-assets/v10_1/shared/wordmarks/v3/README.md", "claude/project-thread-y5jwgo 9c1fe8ab1"],
 "log": [{"at": "2026-11-11T19:24:06Z", "by": "G", "status": "SENT", "note": ""}, {"at": "2026-11-11T19:28:26Z", "by": "V", "status": "RECEIVED", "note": "Team V starting now: 3 matte handcrafted title samples (TRANSFER WAR + SETTINGS) for Nik, then the full set in his pick."}, {"at": "2026-11-12T00:48:36Z", "by": "V", "status": "DONE", "note": "Nik OK 11 Nov 7:48 p.m. Eastern. Honours Board family (Cormorant SC Bold, OFL): 24 TITLE_<NAME>_V3_{3840,1920,960,480} (same height per step, size by HEIGHT), MARK_VS_V3, LOGO_CM17_WORDMARK_V3, woff2 + live-text CSS recipe. All lighter than V2. No glow (matches HO-074 #1404). Asset-only branch off main: copy files into your release branch."}, {"at": "2026-11-12T00:54:07Z", "by": "V", "status": "DONE", "note": "Update 12 Nov: Nik picked the 'Big 17' Home logo. LOGO_CM17_WORDMARK_V3_{2080,1040,640}.webp replaced at 9c1fe8ab1 (big SHOWDOWN + tall 17, small CAREER MODE above, ~6.5:1, 52 KB at 1040). Use 9c1fe8ab1 as the branch head."}],
 "from_session": "session_01GU43Q6fz93sbyL17jn1YF1",
 "sessions": {"G": "session_01GU43Q6fz93sbyL17jn1YF1", "V": "session_01GU43Q6xbGi3wPAd4kdiRKz"}
}
```

# TV-A · One handcrafted title family for every screen (kind: design, worker: images, priority: top)

### What is wrong today
1. Three unrelated lettering styles: brush-gold pictures (12 screens), Kaushan Script live text (Club Assignment and the big "VS"), heavy italic 3D gold picture (Career Statistics, TITLE_CS_V2).
2. The brush pictures have polished gold with a baked shine and soft halo. Next to the HC V2 rooms (brushed brass, walnut, matte marble) they read as generated.
3. Each title is stacked with a crown glyph and a "CAREER MODE SHOWDOWN 17" kicker. Team G removes the crown, the kicker and the added CSS glow in code (its own PR). The lettering itself is yours.

### Ask
One lettering family that looks made by one hand for this club: matte, like brass inlay or sign-writer's paint on the room's own materials. No mirror shine, no bevel, no glow, no sparkle, no crown, no kicker, nothing baked but the letters (alpha).

Please show Nik 3 short samples first (the words "TRANSFER WAR" and "SETTINGS" in each), then cut the full set in the one he picks.

### Set (same slots as today, so wiring is a file swap)
Shared wordmarks, each at 480 / 960 / 1920 / 3840 wide, alpha WebP:
CONNECT PLAYERS, NEW SHOWDOWN, LEAGUE, RULE BOOK, SETTINGS, STANDINGS, TRANSFER (Transfer War), FINAL WINNER.
Bundle titles: CAREER STATISTICS (TITLE_CS), LEGACY (TITLE_LG), RIVALRY (TITLE_RV + phone), SEASON RESULTS (TITLE_SR + phone), TROPHY ROOM (TITLE_TR).
New, to replace live Kaushan text: CLUB ASSIGNMENT, and one "VS" mark.
Home: the CM17 wordmark (LOGO_CM17_WORDMARK) in the same family, 640 and full size.
If the family is a real font you can license for web use, say so: Team G would rather set titles as live text (sharp at every size, no downloads) and keep pictures only for Home.
Also cover the screens in flight so they do not need a second round: PRIME PACK, CHAMBER MEN, RUSSIAN ROSTER ROULETTE, SPECIAL PLAYER, TOUCHLINE GAZETTE, SQUAD MANAGEMENT, START, HISTORY.

### Accept when
- All titles share cap height, stroke weight and baseline when placed in the same slot.
- At 1920x866 the title reads in one glance and nothing around it glows.
- Largest file stays under the size of the picture it replaces.
- No box, plate or ribbon behind any title (Nik's rule).

---


Source: Team G art ledger gameplay/r91/art/ART_LEDGER.md (shared project files), gallery https://claude.ai/artifact/B36Gj4iHoAighBW3zDQ9AX. Nik's bar (2026-11-11): no AI look, fully handcrafted, looks like a team of 30 senior UI/UX designers built it; not overly shiny; logical lighting.
