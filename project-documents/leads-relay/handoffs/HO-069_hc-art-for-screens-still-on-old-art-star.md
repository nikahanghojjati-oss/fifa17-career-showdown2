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
 "status": "DONE",
 "steps": [],
 "evidence": ["claude/project-thread-maabxq @ a011c9a23 - Start + Squad HC V3 rooms (in PR #1404)", "items 1+2 in PR #1404; item 5 answered by HO-075 (one 640x360 board-room crop, nothing else)", "PR #1417 merged into gameplay/r91 at 2210e327"],
 "log": [{"at": "2026-11-11T15:03:45Z", "by": "G", "status": "SENT", "note": ""}, {"at": "2026-11-11T15:04:25Z", "by": "G", "status": "SENT", "note": "Update: items 3 (Career Leaders faces) and 4 (Transfer War wide bands) are now fixed in code from existing HC art (board room plate, office room). Drop them unless you want dedicated tiles. Still needed: 1 Start room, 2 Squad Management room, 5 crops (list follows)."}, {"at": "2026-11-11T15:06:39Z", "by": "V", "status": "RECEIVED", "note": "Team V HC art thread started. Items 3+4 dropped per G update (fixed in code). Working: 1 Start room, 2 Squad Management room; 5 crops wait for G's size list."}, {"at": "2026-11-11T15:16:07Z", "by": "V", "status": "WORKING", "note": "Ticket for Nik: Start = front hall (HC 21/22), Squad = coaches' room, men small at edges (HC 23/24): claude/project-thread-0anobb 546aa4a2 TICKET-HANDCRAFTED_HO069.md. Phone squad reading: men small in top band, plain oak below; tell V if your phone layout differs. Item 5 waits for your size list."}, {"at": "2026-11-12T05:43:13Z", "by": "V", "status": "DONE", "note": "Items 1+2 DONE (Nik OK on the lighting; hair fix redone at a011c9a23). Files in PR #1404 (claude/project-thread-maabxq @a011c9a23), visual-assets/v10_1/plates-hc/: START = ENV_HALL_PLATE_HC_V3_1X/2X (men cut line y 776 of 864) + ENV_HALL_PHONE_HC_V3 (1179x2096, line 1411) + _590W + _TALL (1179x2620, line 1411). SQUAD MANAGEMENT = ENV_COACHES_PLATE_HC_V3_1X/2X (line 542 of 864; pitch board x 16-61%, club panel x 62-84% sit on oak/window, men at the side edges) + ENV_COACHES_PHONE_HC_V3 (line 819 of 2096: men in the top band, plain marble below for the board) + _590W + _TALL (line 819). Sources and set.json: claude/project-thread-0anobb @12b5cf879 project-documents/hc-art/{hall,coaches}/. GAZETTE BACKGROUND (Nik: unified art): no new picture needed; js/touchlineGazette.js (~line 675 r91) still uses plates-v2/ENV_SEASON_RESULTS|FINAL_WINNER; point it at the HC board room the Season Results/Final Winner screens already show (plates-hc ENV_BOARD_*_HC_V3, or V2 if not relit) and recheck the phone face-safe lines 168/258 (board phone men cut at 52.4%). ALSO: r91 css/v10Setup.css ~line 51 lays a dark radial gradient over the Start background: a dim layer against NO DIM FILTERS, please drop it. Items 3+4 done by G in code; item 5 (tablet/sideways crops) waits for G's size list."}, {"at": "2026-11-12T06:13:47Z", "by": "G", "status": "DONE", "note": "G: item 5 size list sent as HO-075. Only one crop is needed (board room, sideways 640x360); every tablet and the larger sideways phones pass with today's files. HO-069 can close."}, {"at": "2026-11-12T06:31:22Z", "by": "V", "status": "DONE", "note": "Item 5 delivered as HO-075 DONE. All HO-069 items closed."}, {"at": "2026-11-12T10:47:34Z", "by": "G", "status": "DONE", "note": "G: wired in #1417 (all rooms on HC V3, Start hall, Squad coaches room, Home crowd, brass wheel)."}],
 "from_session": "session_01GU43Q6fz93sbyL17jn1YF1",
 "sessions": {"G": "session_01GU43Q6fz93sbyL17jn1YF1", "V": "session_01GU43Q7DGKBkW2AjMf6jJyd"}
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
