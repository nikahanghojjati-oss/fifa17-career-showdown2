# Club Assignment phone art intake

Factory job 113. Claude runs the recipes in `visual-assets/v10_1/club/tools/MAKE_ASSETS.md`, exports the two transparent hero WebPs from the approved plate masks, composites the QA proof from `phonemap.json > phone_frame`, and fills the SHA-256 values below.

## Runtime weight budget

The committed portrait background is 240,506 bytes. To keep the runtime phone art at or below the job's 350,000-byte cap, each hero WebP has a hard cap of 54,000 bytes. Aim for about 50,000 bytes each at WebP quality 85; if either file exceeds 54,000 bytes, lower export quality only as much as needed without softening the face or hair edge.

| File | Role | Size / budget | SHA-256 |
| --- | --- | ---: | --- |
| `ENV_CLUB_PHONE_V1.webp` | portrait stadium background | 240,506 bytes measured | Claude fill |
| `OVL_CLUB_DANIEL_PHONE_V1.webp` | Daniel phone hero, left | target ~50,000 bytes; hard cap ≤54,000 bytes | Claude fill |
| `OVL_CLUB_NIK_PHONE_V1.webp` | Nik phone hero, right | target ~50,000 bytes; hard cap ≤54,000 bytes | Claude fill |
| `PHONE_PROOF.png` | 393 × 660 composition proof rendered at 3× | QA only; not part of runtime first paint; target ≤1,500,000 bytes | Claude fill |

Hard-cap runtime total: 240,506 + 54,000 + 54,000 = 348,506 bytes, leaving 1,494 bytes below the 350,000-byte job cap.

## Claude intake checks

Run both cut-out commands exactly from MAKE_ASSETS.md, crop each transparent result to its alpha bbox for the phone proof, preserve aspect ratio, and never mirror. Inspect hair, beard, suit and hand edges at 400% on black, warm glass and neutral light backgrounds. Reject halos, colour fringe, jagged tips or hard internal cuts.

Composite `PHONE_PROOF.png` from `phone_frame`: background cover, Daniel left, Nik right, both heads fully visible, large in the top hero zone, and both figures extending slightly into the lower UI zone. The proof is QA evidence only and is not loaded by the runtime screen.
