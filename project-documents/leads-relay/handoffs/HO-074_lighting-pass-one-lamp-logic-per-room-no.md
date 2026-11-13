# HO-074 · Team G → Team V · Lighting pass: one lamp logic per room, no rim without a source

```ticket
{
 "id": "HO-074",
 "from": "G",
 "to": "V",
 "title": "Lighting pass: one lamp logic per room, no rim without a source",
 "kind": "design",
 "priority": "normal",
 "worker": "images",
 "parent": null,
 "job": "1404",
 "status": "DONE",
 "steps": [],
 "evidence": ["https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1404", "PR #1404 merged into gameplay/r91 at f30e9e77"],
 "log": [{"at": "2026-11-11T19:24:07Z", "by": "G", "status": "SENT", "note": ""}, {"at": "2026-11-11T19:28:53Z", "by": "V", "status": "RECEIVED", "note": "V lighting thread starting now: room relights, brass wheel rim, glow removal"}, {"at": "2026-11-11T19:47:41Z", "by": "V", "status": "WORKING", "note": "PR #1404 into gameplay/r91: rooms relit V3 (7 rooms incl. Start hall), brass wheel rim V2, glows removed; waiting Nik OK on the relit faces"}, {"at": "2026-11-12T06:10:34Z", "by": "V", "status": "DONE", "note": "Nik OK 12 Nov 12:44 a.m. Eastern. PR #1404 into gameplay/r91 at a011c9a23: (1) 8 HC rooms relit as *_HC_V3* in visual-assets/v10_1/plates-hc (tunnel, box, office, board, archive, home, Start hall, Squad room; desktop 1X/2X, phone, 590W, TALL) - hair rim only on the lamp side, nothing faded or greyed, faces untouched (check_nofade 19/19 PASS); swap _HC_V2 -> _HC_V3. (2) WHEEL_RIM_V2.webp brushed brass: point css/v10Setup.css (2 urls) at it + contract hashes; pointer/hub brass stops #D6B07A/#A57E4E/#5C4128. (3) Gold glows removed in tr2 plate.css + .sd-title. Checks: L1-L5 green on a011c9a23, L6 still running (all 8 green on previous head). Notes: project-documents/factory/reviews/HO-074/README.md. Home crowd HO-073 builds on Home V3; Start+Squad V3 go with HO-069."}, {"at": "2026-11-12T06:31:01Z", "by": "G", "status": "DONE", "note": "G: #1404 merged into gameplay/r91 (f30e9e77). Team G is now swapping every room to HC V3, the brushed-brass wheel and the HO-073 Home crowd."}],
 "from_session": "session_01GU43Q6fz93sbyL17jn1YF1",
 "sessions": {"G": "session_01GU43Q6fz93sbyL17jn1YF1", "V": "session_01GU43Q71xfnDSxaqjUqMrmr"}
}
```

# TV-D · Lighting pass: one lamp logic per room, no rim without a source (kind: design, worker: images, priority: normal)

Nik (11 Nov 12:36 Eastern): "the lighting should look logical professional and handcrafted on heroes and other elements of screen".

### Found (2X plates, crops in the shots folder)
1. Hair rim. Every room draws a warm copper outline round the managers' hair on all sides.
   - Tunnel: the wall lamp is on the right; the rim also runs round the left of Daniel's hair (`tunnel_daniel_hair_2x.jpg`).
   - Box: the only lights behind the glass are cool white floodlights; the rim is copper, all round (`rim_box_office.jpg`, left).
   - Office: the lamp is far right; the rim is on the left back of Daniel's head (`rim_box_office.jpg`, right).
   - Board, archive, home: same outline with no lamp on that side.
2. League wheel. `WHEEL_RIM_V1.webp` is the old mirror-gold riveted rim, shown in the brushed-brass box room; pointer and hub are code gradients in another gold.
3. Transfer War cards. In your bundle (`tr2/slice-02-plate/plate.css`) the cards, clock and labels carry gold glows up to 30 px, so they read as lit screens on the desk instead of objects in the room. Team G is removing the same kind of glow from its own files in one small PR; please match in your bundle, or say "go" and Team G will do it there too.
4. Shared title style (`shared/showdown-type.css` line 39) adds `drop-shadow(0 0 12px rgba(242,196,91,.25))` to every title. Team G will override it until you drop it.

### Ask
- One relight per room: rim only on the side facing a lamp, in that lamp's colour and strength; no outline on the far side. Faces, hair shape, poses, clothes and room stay exactly as Nik picked them (HO-068).
- League wheel rim in brushed brass matching the box room rail, same size and centre as today (alpha WebP), plus pointer and hub if you prefer them drawn.
- Drop the glow terms in the Transfer War bundle and the shared title style.

### Accept when
- For each room, a viewer can point at the lamp that makes every highlight on the two managers.
- At 1920 x 866 no card, clock or label looks like it emits light.


Source: Team G art ledger gameplay/r91/art/ART_LEDGER.md (shared project files), gallery https://claude.ai/artifact/B36Gj4iHoAighBW3zDQ9AX. Nik's bar (2026-11-11): no AI look, fully handcrafted, looks like a team of 30 senior UI/UX designers built it; not overly shiny; logical lighting.

## Scope note from Team G (r91 lead, 2026-11-11 19:47 UTC) — avoid double work
Team G PR #1400 (art thread) already removes the CODE-side glow: glow terms in panel box-shadows and title CSS filters on 9 screens (css/connectPlayersV10.css, css/r78-type.css, css/rivalryLegacyV10.css, css/v10Setup.css, css/v10Transfer.css, js/careerScreensV10.js, js/seasonFinalV10.js). HO-074 is for what is BAKED INTO the images: room relights, rim light without a source on heroes, the brass wheel rim, glow painted into plates/props. If you need to touch any of those 7 files, say so on this ticket first. Your HO-070 PR #1394 (css/v10Gazette.css) does not overlap.

## Addendum from Team G art director (2026-11-12 00:00 UTC): glow still inside Team V bundle files
Team G removed its own resting glows in PR #1400. The same kind of glow remains in these bundle files (count of box-shadow, text-shadow or filter lines with a gold "0 0 Npx" term, hover and selected states excluded): tr2/slice-02-plate/plate.css 14, club/club.css 9 (title, league line, VS), career-statistics/career-statistics.css 6 (title, four headline icons), rule-book/rule-book.css 4 (number circles), legacy/legacy.css 4, home/home.css 3, trophy-room/trophy-room.css 2 (the blurred blob behind each cup), final-winner/final-winner.css (cup picture 22 px halo and the resting .winnerTrophyGlow; keep the fwDrum and fwShine motion beats), shared/showdown-ui.css 2, content/content.css 2, standings, stage, rivalry-statistics 1 each. Ask: remove the gold glow term at rest in each, keep dark contact shadows, keep motion beats and state changes. Team G will not override these with stronger selectors unless you say "go".
