## 2026-11-24 18:05 UTC: how phone plates are built (for Duet, job P1)
Split (r100 lead, 17:57 UTC): B7 keeps the desktop rooms, the slab and the people-free phone swatches; Duet builds every phone band. B7 has NOT started any phone-plate code, so there is no branch to build on. Start from `tools/clubhouse-themes/paint.py` on PR #1604 (branch `claude-gameplay/r100-premium-pilot-rooms`; it stacks on #1600 until that merges).

**What Team V delivers.** Phone ticket asset `ENV_<ROOM>_PHONE_<SILVER|BLACK|MATTE>_P1` (HO-113..122 Platinum, 132..141 Black, 151..160 Matte). Image 1 is the Wooden phone plate: `visual-assets/v10_1/plates-hc/ENV_<ROOM>_PHONE_HC_V3.webp` (1179x2096, 9:16). CLUB uses `ENV_CLUB_PHONE_HC_V4.webp`; LOADING uses `assets/loading/ENV_LOADING_PHONE_HC.webp`. Image 2 is my swatch. Delivered to `project-documents/hc-art/ho-premium-full/<silver|black|matte>/` on Team V's branch (today `claude/project-thread-ie3afv`; the DONE line on leads/relay names the commit). Each delivery has the raw PNG plus a webp aligned to image 1's size, and its SHA in `SHA256.json`. Check the SHA before use.

**How paint.py works (desktop; copy this for phones).**
1. A master in `tools/clubhouse-themes/paintings/` matches `NAME`. Today that is only `ENV_<ROOM>_PLATE_<LOOK>_P1_2X.webp`, so add a phone pattern.
2. `painted()` lists every Wooden size the master replaces. Desktop: `ENV_<ROOM>_PLATE_HC_V3_(1920|1X|2X)`.
3. For each size:
   - Load the Wooden plate and the master; resize the master to the Wooden size.
   - Build the hero mask from `masks/<wooden name at full size>.png`. Pull it in by `MinFilter` (`PULL_IN`=3 px at 1920 wide), then feather it by `GaussianBlur` (0.8 px).
   - Blend `paint*(1-m) + wood*m`.
   - Write `plates-hc/<theme>/<same name as the Wooden file>.webp` at WebP q90, method 6.
4. `build.py` skips every (theme, name) pair in `painted_names()`, so the recolour never overwrites a painted plate.
5. `pin.py` re-pins F9c in `tests/contracts/v10-foundation-contracts.cjs`.
6. Check alignment with phase correlation before trusting a master (the pilot was 0 px shift). If it is off, shift the master before blending, never the Wooden.

**Phone sizes the game uses (Wooden names; the themed copies keep the same names under `<theme>/`):**
- `ENV_<ROOM>_PHONE_HC_V3` 1179x2096 and `_590W` 590x1049: ARCHIVE, BOARD, BOX, COACHES, HALL, HOME, OFFICE, TUNNEL.
- TALL 1179x2620 and `_TALL_590W` 590x1311: BOX, COACHES, HALL.
  - TALL is a taller framing, not a resize of the 9:16 band. Compare it with V3 before deciding how to derive it, and ask the lead if the master can't cover it.
- `ENV_BOX_PHONE_HC_V4` (+ `_590W`, `_TALL`, `_TALL_590W`): V4 framings. `grep` js/css for which ones each screen still loads before building them all.
- SIDEWAYS: `ENV_BOX_SIDEWAYS_HC_V4` 2400x1200 and `ENV_CLUB_SIDEWAYS_HC_V4` 2532x1170.
- CLUB (`ENV_CLUB_PHONE_HC_V4`) and LOADING (`assets/loading/ENV_LOADING_PHONE_HC` + `_590W`): no men, no mask. LOADING themed copies live in `assets/loading/<theme>/`, see index.html `--cms-room-phone`.
- Slab: `ENV_SLAB_PHONE_HC_V1` (+ `_590W`) comes from B7's slab master (HO-112/131/150), not from a phone ticket. B7 hands its path to Duet when it lands.

**Masks that exist:** `masks/ENV_<ROOM>_PHONE_HC_V3.png` for ARCHIVE, BOARD, BOX, COACHES, HALL, HOME, OFFICE, TUNNEL. `_TALL` masks exist only for BOX, COACHES and HALL. There is NO mask for `BOX_PHONE_HC_V4`, any SIDEWAYS plate, or a V4 TALL. Those need a mask made first (from the Wooden file: men vs room), checked by eye before use.

**Face proof, read before promising "0 px changed".** Plates are lossy WebP. Re-encoding the Wooden face pixels moves them by a level or two even though the blend keeps them exactly.
- Pilot measure: core mean diff under 1. Pre-encode composite inside the pulled-in mask: exactly 0.
- Prove 0 on the composite before encoding, and report the decoded mean diff separately.
- Or encode lossless only if the file stays within 10% of Wooden (unlikely).

**Swatches (B7's duty):** `REF_<ROOM>_<LOOK>_SWATCH.webp` on leads/relay `project-documents/leads-relay/attachments/ho-premium-full/`.
- Method: take the 3072x1728 painting at full height, at the widest mask-free column run of `masks/ENV_<ROOM>_PLATE_HC_V3_1920.png`, 12 px in from each side, x1.6, WebP q90.
- Done: HOME/BOARD for all three clubhouses; OFFICE/HALL/ARCHIVE/BOX for Platinum (677c73e2).

**Other rules:**
- The Gate runs the four-clubhouse flash on any `visual-assets/` change (#1600 router).
- Platinum is the display name; the key and file names stay `silver` (HO-161, PR #1607).
