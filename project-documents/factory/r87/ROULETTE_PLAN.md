# Roster Russian Roulette · Team V plan (HO-040, r87)

Thu 29 Oct 2026, Team V thread "Make Roster Russian Roulette screen".

## Look
Red Dead Redemption 2 game quality, a small 1899 **cowboy cafe, not a saloon**. Nik's room reference: `NIK_REF_COWBOY_CAFE_TABLE.jpg` (round green-felt table, lantern, warm sun through wooden windows, painting of riders). An original older cowboy dealer sits at the far side with a seven-shot revolver pointed at the wall. Daniel LEFT, Nik RIGHT, standing, in Western clothes in their usual colours, each holding a wooden board with brass corners. No dimming on anyone (HO-027).

## Picture tickets (Nik runs each in a normal new ChatGPT chat)
| Ticket | Result | Attach |
| --- | --- | --- |
| 1851-1 | NEXT_ROULETTE.png (desktop mockup) | GUIDE_1851_1_NEXT_ROULETTE.jpg |
| 1851-2 | PHONE_ROULETTE.png (phone mockup) | GUIDE_1851_2_PHONE_ROULETTE.jpg |
| 1851-3 | RR_CYLINDER.png (7 chambers, straight on) | none |
| 1851-4 | RR_FLASH.png (muzzle flash on black) | none |

The guides carry the approved golden anchors (POSE_TRANSFER_DANIEL_FOCUSED_V1 / POSE_TRANSFER_NIK_TACTICAL_V1). On return Claude runs a likeness lock on both faces.

## After Nik approves the mockups (Claude)
1. Draw sample squads on the boards in code so the approved mockups show the real FIFA 17 squad-screen look (XI on the pitch: shirt, rating, name; one row of 4 subs).
2. Plates: RR_PLATE_DESKTOP / RR_PLATE_PHONE 1X/2X webp = the approved mockup with all UI removed (one edit ticket each, then likeness lock), boards left empty.
3. Layers: board frames held in hands (cut from the plate, so code can shake them on a hit), RR_CYLINDER (cut out; empty/loaded/spin-blur), RR_FLASH (screen-blend webp), bullet trail + board hole decal (code-drawn SVG, no gore).
4. Platemap JSON with the exact pitch and subs rectangles per board, then the pack goes to Team G.

## Layout (CSS px; full numbers in ROULETTE_LAYOUT_V1.json)
Desktop 1536 × 864:
- Top bar 0-40 (CM17 + five tabs + chips + gear). Title 46-100, centred.
- Daniel's board 60-520 × 300-742, Nik's board 1016-1476 × 300-742. Each: pitch inset 12 px, subs strip 68 px tall at the bottom.
- Cylinder dial centre (768, 520), radius 78.
- Result line 548-988 × 612-646 (one line, like the commentary strip). SPIN THE CYLINDER button 588-948 × 656-708.
- Bottom panel 40-1496 × 768-840 (01 DANIEL + state / 02 NIK + state). Music dock stays where live code puts it; nothing in the art sits under it.

Phone 393 × 659 (Safari view, no scroll):
- Chips 8-186 × 8-34, gear 352-386 × 6-40. Title 46-92.
- Boards side by side: Daniel 6-192 × 256-502, Nik 201-387 × 256-502 (upright pitch, subs strip 40 px).
- Cylinder dial centre (196, 222), radius 26.
- Result line 20-373 × 508-532. Button 40-353 × 538-582. Bottom tab bar 594-659.
- At 360 × 640 and 375 × 553 the boards shrink (scale the board block), the button stays visible.
