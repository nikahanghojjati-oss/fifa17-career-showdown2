# HO-069 · Team G → Team V · HC art for screens still on old art: Start room, Squad Management, Career Leaders faces, Transfer War wide bands, tablet crops

```ticket
{
 "id": "HO-069",
 "from": "G",
 "to": "V",
 "title": "HC art for screens still on old art: Start room, Squad Management, Career Leaders faces, Transfer War wide bands, tablet crops",
 "kind": "design",
 "priority": "top",
 "worker": "images",
 "parent": null,
 "job": null,
 "status": "SENT",
 "steps": [],
 "evidence": [],
 "log": [{"at": "2026-11-11T15:03:45Z", "by": "G", "status": "SENT", "note": ""}, {"at": "2026-11-11T15:04:25Z", "by": "G", "status": "SENT", "note": "Update: items 3 (Career Leaders faces) and 4 (Transfer War wide bands) are now fixed in code from existing HC art (board room plate, office room). Drop them unless you want dedicated tiles. Still needed: 1 Start room, 2 Squad Management room, 5 crops (list follows)."}],
 "from_session": "session_01GU43Q6fz93sbyL17jn1YF1",
 "sessions": {"G": "session_01GU43Q6fz93sbyL17jn1YF1"}
}
```

## What
Team G's old-art sweep (r91, 2026-11-11, 18 screens x 98 window shapes; table: Team G project file gameplay/r91/old-art/OLD_ART_SWEEP.md) found screens with no handcrafted (HC V2) art. Nik (11 Nov 10:03 Eastern): "Team V ticket for a new room for Start" and "any screen missing an art, Team V ticket for it". Same no-AI-look bar, house style and rules as HO-061/HO-068.

## Art needed
1. **Start (pick 1/3/5/10 seasons)** — NEW ROOM. Today it shows the V1 start-join plate (ENV_SJ_PLATE_V1, ENV_SJ_PHONE_V1, OVL_SJ_*) at every size. Both managers painted in (Daniel LEFT, Nik right), a lip for the four season choices + START button, desktop 1536x864 1X / 3072x1728 2X, phone 1179x2556 (+ _590W), and a 9:20 tall phone variant like ENV_BOX_PHONE_HC_V2_TALL. Lip line in rooms_v2_set.json.
2. **Squad Management (new 2.4.0 screen, after Chamber Men and after Transfer War)** — a room for a FIFA 17-style squad screen: pitch board with XI + subs + reserves takes most of the space, so managers small or at the edges, nothing behind the pitch board busy. Desktop 1X/2X + phone. Prototype: https://claude.ai/artifact/2mNx2dkqbbjveunP9SDihW
3. **Career Statistics, Career Leaders cards** — the small manager faces are still cut from the retired plates-v2 statistics plate (old faces at 1920x866 and 1920x1035). Need HC face/bust tiles for Daniel and Nik matching the board room, alpha WebP 256 + 512.
4. **Transfer War side bands at 2.1:1 and wider (Nik's Chromebook 1920x866 included)** — the bands beside the office plate are a blurred copy of the old TR2 locked plate (set in Team V's plate.js). Need an office-room extension or band texture (HC) so wide windows never show the old plate; or a plate.js change on your side.
5. **Tablets and sideways phones (crops)** — upright tablets (820x1180, 768x1024, 744x1133, 800x1280, 1024x1366, 912x1368) and sideways phones (844x390, 932x430, 640x360) for archive (Legacy/Trophy Room), board (Season Results/Final Winner/Career Stats) and tunnel (Rivalry/Standings): Team G will first try the existing desktop/phone HC plates with re-framing; any room where faces can't stay clear will be listed in a follow-up note on this ticket with exact sizes (likely a 4:3/3:4 crop per room).

## Not in yet
Prime Pack page, Chamber Men page, Gazette, 2D fallbacks of RRR/SP are in the next sweep; anything found gets added here.

## Rules
No dim layers, scrims, slogans or AI look; managers always present on manager rooms; faces never covered; within existing caps.
