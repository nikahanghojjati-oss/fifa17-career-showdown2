# HO-095 · Team G → Team V · Club Assignment lounge phone crops (upright + sideways)

```ticket
{
 "id": "HO-095",
 "from": "G",
 "to": "V",
 "title": "Club Assignment lounge phone crops (upright + sideways)",
 "kind": "design",
 "priority": "top",
 "worker": "images",
 "parent": "HO-094",
 "job": null,
 "status": "SENT",
 "steps": [],
 "evidence": [],
 "log": [{"at": "2026-11-16T23:47:23Z", "by": "G", "status": "SENT", "note": ""}],
 "from_session": "session_01GU43Q5bagqLyredN5q4Pwh",
 "sessions": {"G": "session_01GU43Q5bagqLyredN5q4Pwh"}
}
```

### Why
Nik, 2026-11-16 23:46 UTC (decision card, Team G lead thread): "New phone crops from Team V". HO-094's new club lounge works on desktop (box narrowed, side walls with lamps, banners and trophies fully beside it). On phones the side walls end up BEHIND the 3D box and tiles, so only lamp edges show. Nik wants phone versions where the room details sit in the free space instead.

### Assets (two; one asset = one image ticket = one new chat), same room as HO-094 (HC V3: walnut, dark stone, wall lamps, stadium window, banners, trophies, armchairs), no people, no words
1. **ENV_CLUB_PHONE_HC_V4** (upright phone), 1179x2096 WebP. Layout on screen (see guides): title in the top ~12%; the 3D box covers about 4%-96% of width and 13%-72% of height; manager tiles + STOP 73%-82%; BACK 85%-90%; free floor 90%-100%. Put the two wall lamps and the banner tops in the top band beside the title (left and right of the centre), a trophy shelf/marble ledge in the bottom 10%, and keep everything behind the box calm (window and dark wall).
2. **ENV_CLUB_SIDEWAYS_HC_V4** (sideways phone), 2532x1170 WebP (works for 568x320 to 932x430 by cover crop). Layout: title top-left ~10%; the 3D box covers about 1%-68% of width and 12%-88% of height (left); tiles + STOP on the right 70%-98%, from 18% to 72% of height. Free space: the top strip (lamps here, both sides), the right column above and below the tiles (a banner top above, a trophy below), and the bottom strip. Calm behind the box.

Guides on leads/relay: project-documents/leads-relay/attachments/HO-095/ (screenshots of the current HO-094 plate under the real layout at each size): gameplay/r94/club-assignment-3d/ho095/ in Team G's project files (390x844, 568x320, 740x360, 844x390, 932x430); box-only guides in gameplay/r94/club-assignment-3d/plate-guides/. Nik cannot open those paths; Team G can push them to leads/relay attachments on request.

### Accept when
Nik OKs each; same room and light as HO-094 desktop so the set matches; details visible in the free zones at the listed sizes; no text, no people. SHA256.json in hc-art/ho095/.

### After DONE
Team G wires them into the Club Assignment plate slot (portrait + landscape media rules); ENV_CLUB_PHONE_HC_V3 stays as fallback.
