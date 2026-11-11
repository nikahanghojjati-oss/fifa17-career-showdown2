# HO-073 · Home crowd and stands, higher quality (Team V)

Base: `gameplay/r91` ec357470d, plates `ENV_HOME_PLATE_HC_V2_{1X,2X}.webp`, `ENV_HOME_PHONE_HC_V2{,_590W}.webp`.

## What was found
- The stands behind the glass are soft blobs: heads are ~4 px at 2X with no shoulders or seat rows, the upper tier is empty black, and there is one big dark empty block of seats.
- The phone plate's window view is a scaled copy of the desktop view (template match 0.98, scale 0.491); its right pane repeats desktop pane C. So one new crowd feeds desktop and phone.

## Method (one crowd, nothing else moves)
1. Three ChatGPT stand edits, one per window pane, from guide crops at 1.9x supersampling, managers painted magenta so the stand is painted straight through: `tickets/IMAGE_TICKET_{1,2,3}_OF_3_HOME_STANDS_{A,B,C}.md`, guides in `guides/`.
2. Intake `tools/ho073_intake.py intake` (Nik's results go in `in/HOME_STANDS_{A,B,C}_V1.png`):
   - ECC-aligns each result onto the original crop (magenta ignored);
   - changes only rows y 625-852 (2X) inside the three panes: under the roof steel, down to the pitch rail;
   - the two managers keep their original pixels (people mask in `masks/`, 5 px dilation, 2 px soft edge);
   - 1X and 590W keep their own original pixels wherever alpha is 0; phone panes get the same new stands through `zones.json` `phone_map`.
   - Report: ECC scores, sizes, SHA-256, and `max_change_outside_*` (must be 0.0), plus `BEFORE_AFTER_STANDS_1920.png`, `BEFORE_AFTER_FULL_1920.jpg`, `BEFORE_AFTER_PHONE.png` (Team G's accept check).
3. Self-test with the original plate as input: `evidence/selftest/` shows max_change_outside 0.0 desktop and phone.

## Accept (from HO-073)
- At 1920 x 866 side by side, the stands read as people in seats, not texture.
- Managers and menu still win the first glance; stands stay darker than the room; no shine, no readable faces, no repeated figures.

## Other rooms
Box room passes (Team G). Office (empty distant seats) and Tunnel (tiny crowd at the far end) are too small to read as texture at 1920; no change proposed unless Nik asks.

## Weights
Re-encoded at WebP q86-88: 2X ~290 KB, 1X ~110 KB, phone ~112 KB, 590W ~41 KB (all at or under the current files).

## Build on HO-074 (head relight), 11 Nov
HO-074 finished first: branch `claude/project-thread-maabxq` c30d8843a (PR #1404), files `ENV_HOME_*_HC_V3*`. Final intake runs on those:
`HO073_BASE=<dir with the four V3 files> HO073_TAG=V3 python3 -I tools/ho073_intake.py intake`
Every pixel HO-074 changed (difference to V2 above 10, within 40 px of a manager) is protected, so its hair rim light survives. Self-test on V3: 0 relit pixels under the crowd alpha, 0.0 change outside. If Nik rejects the relight, run with the default (V2).
