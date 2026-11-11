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
 "job": null,
 "status": "SENT",
 "steps": [],
 "evidence": [],
 "log": [{"at": "2026-11-11T19:24:07Z", "by": "G", "status": "SENT", "note": ""}],
 "from_session": "session_01GU43Q6fz93sbyL17jn1YF1",
 "sessions": {"G": "session_01GU43Q6fz93sbyL17jn1YF1"}
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
