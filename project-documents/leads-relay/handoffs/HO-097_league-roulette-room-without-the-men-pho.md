# HO-097 · Team G → Team V · League Roulette room without the men (phone upright, tall, sideways)

```ticket
{
 "id": "HO-097",
 "from": "G",
 "to": "V",
 "title": "League Roulette room without the men (phone upright, tall, sideways)",
 "kind": "design",
 "priority": "top",
 "worker": "images",
 "parent": null,
 "job": null,
 "status": "SENT",
 "steps": [],
 "evidence": [],
 "log": [{"at": "2026-11-22T02:24:41Z", "by": "G", "status": "SENT", "note": ""}],
 "from_session": "session_01GU43Q7tkNNiwFECumxKomV",
 "sessions": {"G": "session_01GU43Q7tkNNiwFECumxKomV"}
}
```

### Why
Nik, 2026-11-22 02:17-02:21 UTC (R98-01 League Roulette thread), in short: the league screen is now "League Roulette", a 3D casino roulette board. On phones, upright and sideways, the heroes are removed: the screen is only a very big roulette (60-80% of the screen) over the room background, which must match the current desktop room (the clubhouse "box room") with the men removed. "If we need new pictures, we can ask Team V."

### Assets (one asset = one image ticket = one new chat)
1. **ENV_BOX_PHONE_HC_V4** (phone upright): edit of `project-documents/hc-art/box/ENV_BOX_PHONE_HC_V3.webp`, 1179x2096 WebP + 590W.
2. **ENV_BOX_PHONE_HC_V4_TALL** (tall phones): edit of `ENV_BOX_PHONE_HC_V3_TALL.webp`, 1179x2620 WebP + 590W.
3. **ENV_BOX_SIDEWAYS_HC_V4** (phone sideways, about 2:1, e.g. 2400x1200): same room, crop/compose from `ENV_BOX_PLATE_HC_V3_2X.webp` with the men removed.

### What changes (scene edit, no faces generated)
- Remove Daniel and Nik completely (bodies, hands, shadows). Repaint behind them as the same room: stadium window, wall, counter, lighting, continuous and in place.
- Keep everything else as it is: house look, warm calm light, marble and gold, the window and counter. No people, no readable text, no added objects.
- The middle of each picture will hold a big 3D roulette (60-80% of the screen): keep the middle calm, the edges rich.

### Accept when
- Nik OKs each at a glance; no trace of a person; room looks like nothing was ever there; outside the edited zones matches V3 pixels.
- WebP + SHA256.json in project-documents/hc-art/ho097/.

### Possible part 2 (only if Nik picks it on the R98-01 builder's card)
**ENV_BOX_PLATE_HC_V4** desktop (1536x864 1X + 2X): the men moved a bit further apart so there is about 30% more window between Daniel's fingertip and Nik's arm (for a 20-30% bigger board at 1920x866). Faces, hooks and the cabinet stay. Team G will confirm before V starts this part.

### After DONE
Team G (R98-01 builder, branch claude-gameplay/r98-league-roulette-3-look) wires the phone plates into League Roulette; until then phones use the empty middle of the desktop plate. V3 files stay; nothing is deleted.
