# HO-014 · Team V → Team G · Create code / Join on its own Connect Players screen, never on top of Home

```ticket
{
 "id": "HO-014",
 "from": "V",
 "to": "G",
 "title": "Create code / Join on its own Connect Players screen, never on top of Home",
 "kind": "bug",
 "priority": "top",
 "worker": "opus",
 "parent": null,
 "job": null,
 "status": "RECEIVED",
 "steps": [],
 "evidence": [],
 "log": [{"at": "2026-10-06T01:31:04Z", "by": "V", "status": "SENT", "note": ""}, {"at": "2026-10-06T01:32:16Z", "by": "G", "status": "RECEIVED", "note": "bug factory: job 1015 · G (GPT green; Sonnet if green fails), lead runs pairing contracts + audits, Team V 1013 visual check"}]
}
```

# Create code / Join goes on its own Connect Players screen, never on top of Home

**Nik (2026-10-06 01:26 UTC, phone screenshot of Home):** "create a code / join ... needs to have its own screen, like how Host a private session and Join a private session have their own screen ... instead of being on the home screen. That's very, very important." Today a CAREER READY / CREATE CODE FOR NIK / JOIN DANIEL'S SHOWDOWN box sits on top of Home, above the logo and tiles, and crowds Continue Career.

## Why it happens (main bc77a0b9)
- `js/productionSharedJourneyEntry.js:179-189` `openPersistentPairControls()` navigates to `mainMenu` (Home) and calls `pair.render()`.
- `js/persistentNikDanielPair.js:319` `pairRender()` inserts `#persistentNikDanielPairPanel` into `#mainMenu .fifaMenuShell` before `.fifaMenuGrid`, with inline styles. Once paired it stays there as "CAREER READY · Career ready. · CONTINUE CAREER · Nik", which repeats the Continue Career tile right below it.

## The design already exists (Team V, factory/v1-wtt5ye)
Team V's Start / Join screen is titled **CONNECT PLAYERS**: `visual-assets/v10_1/start-join/` (index.html, start-join.css, start-join.js, fixtures.json, TRUTH.md).
- Frames: SJ1 nothing hosted, SJ2 Daniel's code created (big code field + copy, NEW CODE, CHECK STATUS), SJ3 Nik joining (Paste Daniel's code + JOIN DANIEL'S SHOWDOWN), SJ5 connected (START CAREER).
- On phone it has three tabs: DANIEL · START / NIK · JOIN / CONNECTION.
- TRUTH.md maps every pairing state and button to `pairStartPairing`, `pairJoinPairing`, `pairCopyText`, `pairInitialize({force:true})` and `pairRetryPairLink`.
- Main already loads part of it: `js/v10Setup.js:23`, `js/v10Screens.js:32` (startJoinViewModel), `css/v10Setup.css`.

## Wanted (Team G decides how)
1. Every way into create/join opens the Connect Players screen: Home's Start/Join tile, the entry overlay's CONNECT PLAYERS / REVIEW CONNECTION, and Settings. The pair actions render there in Team V's SJ layout, not on Home.
2. Home never shows the pair panel. When paired, Home's own Continue Career tile is the only Continue.
3. Back from Connect Players returns Home. Daniel left, Nik right on desktop. On phone 393x660 there is no page scroll and the code plus its buttons are visible.
4. Your G-F22 pairing calls (restore backup first, cancel code, masked email, and the others) land on this same screen when Nik decides them.

Team V's 1013 is the visual check: when your PR is up, send the link and the lead renders SJ-equivalent states at 393x660, 360x640, 1440 and 1920, then answers PASS or exact fixes.
