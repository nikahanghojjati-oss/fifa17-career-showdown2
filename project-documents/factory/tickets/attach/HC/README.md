# Attachments for TICKET-HANDCRAFTED_V1 (claude/handcrafted-prompts-v1)

- RC_LOUNGE.png: room card (no people) of the approved HC 01 lounge, from the same ChatGPT run as HC 01 try 4. Unlocks HC 03, HC 04, HC 07, HC 11.
- GUIDE_HC02_LOUNGE_P.png: phone guide, 1024x1536: the men with their real room around them, cut as one box from approved HC 01 (x 470-1525, y 160-886), scaled so hair starts at 16% and the counter lip sits at 50%; cyan everywhere else. Made by tools/hc/guide_from_room.py (the cut-out method in guide_phone.py left hard edges, Nik 8 Nov).
- reviews/HC/HC01_LOUNGE_D_RAW.png: Nik's approved HC 01 (Gate A, 8 Nov 2026 2:14 p.m. Eastern), try 4 of 6.
- HC01_LOUNGE_D_LOCK.png (V2 ticket, 9 Nov 2026): the approved HC 01 as it is. The men in it are the ones Nik approved at Gate A, so no lock step was run; the name matches the V2 ticket links.
- HC04_BOARD_D_TRY_A_LOCK.png (V2 ticket): V1 board-room try A (no lamps) as it is, same reason.
- V2 (9 Nov 2026): Nik picked RICH; Claude picked try 1 of 7 (chairs face each other across the table, round laced ball). Raw: reviews/HC/HC01_LOUNGE_D_V2R_PICK.png.
- GUIDE_HC02_LOUNGE_P_V2.png: same box as V1 (x 470-1525, y 160-886) from the V2 pick, lip at 50%, guide_from_room.py.
- RC_LOUNGE_V2.png: room card with no people: the left lounge (x 0-470) and the right pier with its lamp (x 1240-1536) side by side.
- HC 04 V2 (board room) try 2 accepted 9 Nov (reviews/HC/HC04_BOARD_D_V2_TRY2.png; lamp further from Daniel than try 1); the Rich chair and tray did not appear (they sit at the cut-off far left, only visible at 16:9).
- GUIDE_HC05_BOARD_P.png: one box per man from HC 04 V2 try 2 (Daniel x 130-560, Nik x 970-1440, y 130-740), scale 0.8, side by side with a 36 px gap, lip at 50%, the half-cut wall lamp painted cyan; guide_two_boxes.py.
- RC_BOARD_V2.png: room card with no people: the bare centre oak panel with lip and counter, the wall lamp, and the right marble pilaster.
- HC 07 V2 (tunnel) try 1 accepted 9 Nov (reviews/HC/HC07_TUNNEL_D_V2_TRY1.png); the Rich ball net did not appear (Daniel covers that panel).
- GUIDE_HC08_TUNNEL_P.png: one box per man from HC 07 V2 (Daniel x 40-530, Nik x 1000-1536, y 120-900), scale 0.71, the bulkhead lamp painted cyan (the phone shows no lamp); guide_two_boxes.py.
- RC_GROUND_V2.png: the tunnel centre with the mouth onto the ground (x 535-1000), no people.

## Office (HC 11 V2 picked: try 2B, 9 Nov 2026)
- RC_OFFICE_V2.png: left x0-175 (oak, ball, cup, folders) + right x1320-1536 (olive tree, desk lamp) of reviews/HC/HC11_OFFICE_D_V2_TRY2B_PICK.png, side by side, full height.
- GUIDE_HC12_OFFICE_P.png (+ .json): one box x170-1330 / y150-665 of the pick at 0.70 scale, x 106-918, hair at ~16%, table top at y 559 (36.4%); cup fragment at the lower-left corner painted cyan. The men fill x 10-90%, so the phone ball and desk lamp have no room beside them: the phone shows the room through the windows, mast and oak only (prompt add-on line given to Nik).

## Box (HC 09 V2 picked: try 2B, 9 Nov 2026; grey scarf + plaid as the ticket says)
- RC_BOX_V2.png: left x0-105 (oak, coat hook) + centre glass x580-960 (stand, empty block, thin pitch, table front with lip) of reviews/HC/HC09_BOX_D_V2_TRY2B_PICK.png.
- GUIDE_HC10_BOX_P.png (+ .json): guide_two_boxes.py (now takes LIP from env) with LIP=891 (58%), scale 0.8, Daniel 105,172,580,752 / Nik 960,180,1475,752; plaid, cabinet and the two roof lamp banks above the heads painted cyan first. Faces at about 22% and 64-74% of the width.
- Desktop lip at y ~752 (73.4%). Roof lamp banks at ~16% sit just above both heads (small and dim; accepted).
