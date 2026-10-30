# CLAUDE -> TEAM G (and GPT-5.6 Sol) HANDOFF - HO-040 DONE
Russian Roster Roulette: the real 3D screen, approved by Nik (final)

## Header
| | |
|---|---|
| Task ID | HO-040 (Team G -> Team V, r87) |
| Claude model | Fable 5.1, thread "Build Russian Roster Roulette screen" (Team V) |
| Role | Visual lead: built the screen, Nik rated each build |
| Date | 2026-10-30 (Nik approved 29 Oct 8:16 p.m. Eastern: "I approve") |
| Source anchor | origin/main ac2f021d1 (read only for Team V; SOURCE_DRIFT not relevant, nothing here touches main) |
| Visual branch | `claude/project-thread-6rq94x`, folder `visual-assets/v10_1/roulette/` (this file's commit is the package) |
| Write operations | repo: yes, on that branch only; images: Nik ran picture tickets 1851-5 (room) and 1854 (hand); implementation: yes |
| Verdict status | FINAL: ready for Team G to wire into r87 |

Files reviewed: `index.html` (137 KB, 42 KB gzip), `platemap.json`, `assets/RR_ROOM.jpg` 1672x941, `assets/RR_HAND.png`, `assets/squads.json` (98 clubs, FIFA 17 launch XI + 4 subs), `assets/sfx/*.wav` (Team G, HO-047), `evidence/`.

## Work performed
- Branch `claude/project-thread-6rq94x` (from factory/v1-wtt5ye). Build log with every step: `BUILD_RESULT.md` sections CC-011 to CC-016.
- The screen is a self-contained page: three.js r128 (cdnjs), one HTML file, four assets, sounds. No build step.
- Nik's approvals: name (29 Oct), content look, CC-016 continuous shot (29 Oct 8:16 p.m. Eastern).
- Evidence: `evidence/SHEET_DESKTOP.jpg`, `evidence/SHEET_PHONE.jpg` (8 beats each), `evidence/TURN_DESKTOP_1536x864.mp4`, `evidence/TURN_PHONE_393x660.mp4` (23.4 s, one full turn with a shot).
- Checks run: headless Chromium at 1536x864 and 393x660, no page errors, no scroll on the phone, the button stays above the fold. Sound files load through the `sfx` map; I could not listen in the cloud, Nik judges the mix.

## 1. Verdict
READY. Nik approved the screen as built. Team G wires it as the r87 roulette step; nothing in the look needs another picture ticket.

## 2. How Team G wires it (the integration contract)
1. Serve the folder as is: `visual-assets/v10_1/roulette/index.html` plus `platemap.json` and `assets/`. Paths are relative, so it works at any URL. Lazy-load it (iframe or a route that loads the page) so the main bundle keeps its gzip budget; three.js r128 comes from cdnjs (self-host it if the live site blocks cdnjs).
2. URL parameters: `d=<club>` Daniel's club, `n=<club>` Nik's club (names exactly as in `assets/squads.json`), `seed=<int>` repeatable random, `fire=1|0` force the outcome (test only), `tools=1` shows the club pickers.
3. Script API, `window.__rr` (ready when `window.__rrReady === true`):
   - `__rr.setBoards(danielClub, nikClub)` redraws both boards.
   - `__rr.play({ fire: true|false, target: "W. Rooney" })` starts the current manager's turn (Daniel first, then Nik). `fire` is the outcome Team G's logic decided; `target` is the player to release (a name from that club's XI or subs in squads.json; if missing or unknown the screen picks a free bubble at random).
   - Event `rr:end` on window at the end of every turn: `detail = { who: "D"|"N", name: "Daniel"|"Nik", fire, lost: "<player>"|null, turn }`.
   - `__rr.state` for debugging (turn, playing, fire, target, done, fps).
   - The on-screen button calls the same `startTurn` with the screen's own random outcome. If Team G decides outcomes server-side, hide the button (`#cta`) and call `play` instead, or keep the button and listen for `rr:end`.
4. Squads: `assets/squads.json` = FIFA 17 launch data (Team G research r87-squads), XI as [position, name, rating] plus 4 subs. Replace the file with the live save's squads (same shape) when the real rosters exist; the boards redraw from it.
5. Timing: one turn is 22.0 s (desktop) from `play` to `rr:end`; reduced-motion users get 5.2 s. Beats: spin 0.35-3.0, drum close-up 3.3-11.4 (the long showcase spin), camera glide behind the shooter 11.4-13.6, cock 13.6, shot 15.0, bullet flight 15.0-17.4 (slow motion), impact 17.4, back at the table 22.0.
6. Sounds: `platemap.json` `sfx` lists the WAVs (Team G, HO-047). Sound is off until the user presses the Sound button (browser autoplay rules). `handUp` plays when the hand rises, `roomTone` loops while sound is on.
7. Top bar and phone bottom bar are the screen's own mock of the site chrome. In the site, remove the mock chrome (`.top`, `.pbar`) and let the real nav wrap the page, or keep the page full-screen under the real bars.

## 3. MUST FIX (HO040-M1..)
NONE for the look. One wiring point for Team G:
- **HO040-M1** Outcome authority. Observation: the page can decide the outcome itself (random chamber). Evidence: `startTurn` in `index.html` picks `chamber` from the seed. Proposed delta: Team G's logic decides `fire` and `target` and passes them to `__rr.play`; the on-screen random stays only as the demo path. Product-truth impact: HIGH if the screen's random were used in a real season (two devices would disagree). Resolver: Team G. Confidence: high.

## 4. SHOULD REFINE (HO040-R1..)
- **HO040-R1** The "FIRES HERE" label can sit partly behind the title on some desktop sizes during the drum close-up. Cosmetic. Resolver: Team V on request.
- **HO040-R2** iPhone frame rate not measured on a real device (cloud only). If the drum close-up stutters on an older phone, lower `renderer.setPixelRatio` cap (now 2) to 1.5. Resolver: Team G on the live site, Nik checks.

## 5. Already strong (keep)
Long drum showcase spin with the red live round and the gold FIRES HERE mark; the gloved hand from the shooter's view; the continuous no-cut camera that rides the bullet; FIFA 17 squad boards in moulded frames on walnut easels; the marble cafe with Nik's room picture; no dim filters anywhere (HO-027).

## 6. Asset fit and blockers
NONE. All assets are original or Nik-approved pictures: `RR_ROOM.jpg` (ticket 1851-5), `RR_HAND.png` (ticket 1854), procedural everything else. No real logos, no faces.

## 7. Conflicts found
- Ticket HO-040 asked for a seated dealer and the two managers holding boards. Nik changed this on 29 Oct: no people or faces anywhere, only a gloved hand; boards stand on easels. The screen follows Nik's later words.
- Name: "Russian Roster Roulette" (full), "Roster Roulette" (short). The ticket's "Roster Russian Roulette" is retired (Nik, 29 Oct 15:19 UTC).

## 8. Questions for Astra
NONE.

## 9. Questions for Nik
NONE open. Nik approved on 29 Oct.

## 10. Evidence appendix
- Commits on the branch: 184b03801 (CC-016 shot + sounds wired), 972eb0406 (videos), then this file's commit (play target + rr:end event).
- Headless test: `__rr.play({fire:true,target:"W. Rooney"})` then 23 s advanced: `rr:end` fired with `{"who":"D","fire":true,"lost":"W. Rooney","turn":0}`, no page errors.
- Sizes: index.html 137,114 B (42,383 B gzip); assets 3.3 MB of which sounds 1.8 MB (room_tone.wav 1.0 MB; Team G may re-encode it to a 96 kbps loop if size matters).

## 11. Recommended next actions (Team G)
1. Merge or cherry-pick `visual-assets/v10_1/roulette/` from `claude/project-thread-6rq94x` into the r87 branch.
2. Add the route and the season step (after Career Start, before the transfer window), decide outcomes in the game logic, call `__rr.play`, listen for `rr:end`, write the released player to the save.
3. Replace `assets/squads.json` with live squads when ready.
4. Check on Nik's iPhone once on the live site; report frame rate.

## 12. What to send back to Claude (Team V) for the next task
Any look change Nik asks for after seeing it live, with a screenshot; sound retune notes; the live URL for the phone check.

CLAUDE HANDOFF COMPLETE - RETURN TO TEAM G (r87 lead) AND GPT-5.6 SOL FOR RECONCILIATION
