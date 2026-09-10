# R8 Complete Product Asset Resolution Ledger

Status: CHARACTER VARIATION REOPENED BY OWNER — A01/A02 FROZEN / A03–A12 PLANNED / SUPPORTING ASSETS RESOLVED

This ledger closes the distinction between “visual role required” and “new image required.” It is the working resolution companion to `ASSET_MANIFEST.json` and `CHARACTER_POSE_LIBRARY_PLAN.md`.

## Character authority

### A01 Nik

Role: wide Home right-flank identity/hero anchor.

Resolution: REQUIRED EXISTING MASTER.

Source authority is recovered and hash-verified:

`17972b8afb73b90483c8f874c4bd964ac1bda196daa76e134a6030676bbd4219`

No regeneration or replacement is permitted.

### A02 Daniel

Role: wide Home left-flank identity/hero anchor.

Resolution: REQUIRED EXISTING MASTER.

Source authority is recovered and hash-verified:

`9b1545b52a5d96a240c92b9901dcd8a4558148dde05a0331882df7bd988177cc`

No regeneration or replacement is permitted.

Manager mapping remains immutable:

Manager 1 = Daniel

Manager 2 = Nik

## Owner-directed character expansion

The previous “A01/A02 only” generation closure is superseded by owner direction dated 2026-09-10.

The final proposal now targets six distinct approved roles per manager:

- core hero;
- confident/presentation;
- club-pack opening;
- focused/determined;
- victory/happy;
- natural setback/losing reaction.

Planned IDs:

- Nik: A01, A03, A05, A07, A09, A11;
- Daniel: A02, A04, A06, A08, A10, A12.

See `CHARACTER_POSE_LIBRARY_PLAN.md` for the identity, anatomy, dynamic-outcome and page-placement rules.

Recovered prior reference evidence includes:

- `CANDIDATE_R8_6_EXPRESSION_REFINEMENT_01.png` — identity/expression/pose reference sheet;
- `C01_NIK_CLUB_PACK_HOLDING_OWNER_LIKED_CANDIDATE_V1.png` — owner-liked Nik pack pose candidate;
- `CLUB_PACK_HOLDING_OWNER_LIKED_COMPOSITE_REFERENCE_R8_19.jpeg`;
- `REF_08_CLUB_ASSIGNMENT.png`;
- `REF_02_CLUB_PACK_FORMAL.jpeg`.

These references do not become final isolated production assets merely because they were recovered.

## Routed screens

| Screen | Asset role resolution | New raster generation? | Status |
| --- | --- | --- | --- |
| Home | A01/A02 exact masters + H01 original stadium atmosphere + DOM/CSS safe-zone geometry | No for hero identity anchors | composition exists; final owner capture later |
| Create Showdown | S02 divider + DOM/CSS season tiles; character optional and usually omitted | No required | RESOLVED |
| League Wheel | S03 halo + existing real wheel; A07/A08 focused variants optional only if safe | Optional | wheel remains primary; no generation dependency |
| Club Assignment | S04 original pack frame + live DOM labels + A05/A06 pack-opening variants | Yes, preferred final character role | FINAL CHARACTER ASSETS OPEN |
| Showdown Home | DOM/CSS score/progression; A03/A04 or A07/A08 optional | Optional | no character dependency |
| Transfer Challenge | DOM/CSS board/timer/privacy; A07/A08 optional | Optional | no character dependency |
| Season Results | DOM/CSS publication/commit/canonical/history states | No required | RESOLVED |
| Season Summary | DOM/CSS ceremony + optional I01 + A09/A10 winner and A11/A12 setback presentation | Yes for preferred wide emotional variant | FINAL CHARACTER ASSETS OPEN |
| Rivalry Statistics | DOM/CSS/native comparisons | No required | RESOLVED |
| Career Statistics | DOM/CSS tables/cards | No required | RESOLVED |
| Trophy Room | I01 original trophy symbols; A09/A10 optional | Optional | no character dependency |
| Legacy | DOM/CSS archive/data geometry; neutral/reflection crop optional | Optional | contrast defect addressed |
| Rule Book | DOM/CSS editorial rail/table | No | RESOLVED |

## Non-route surfaces

| Surface | Asset resolution | New raster generation? | Status |
| --- | --- | --- | --- |
| Startup/loading | existing protected loading visual + R8 frame/light | No | RESOLVED |
| Global header / runtime | DOM/CSS | No | RESOLVED |
| Showdown Radio | custom DOM/CSS + one HTML audio authority | No | AUDIUS FUNCTIONAL PROOF OPEN |
| Settings / Save Library / Profiles | DOM/CSS + I02 optional | No | RESOLVED |
| Connected Account / Pairing / Rivalry / Remote Joining | DOM/CSS + I02 optional | No | RESOLVED |
| Backup / Import / Restore / Recovery | DOM/CSS + I02 optional | No | RESOLVED |
| Shared / Multi Season / Journey Reconnect / Journey Conflicts | DOM/CSS status surfaces | No | RESOLVED THROUGH r15 |
| Offline/update/error/reduced motion | shared DOM/CSS grammar | No | RESOLVED AT DESIGN LEVEL |

## Packaged original supporting assets

- `H01_HOME_STADIUM_ATMOSPHERE`
- `S02_TWO_MANAGER_RIVALRY_DIVIDER`
- `S03_WHEEL_STAGE_HALO`
- `S04_CLUB_PACK_FRAME`
- `I01_TROPHY_SYMBOL_FAMILY`
- `I02_SYSTEM_STATE_SYMBOL_FAMILY`

Each is recorded in `ASSET_MANIFEST.json` with provenance, target surfaces, rights status and hash.

## Image-generation gate

Current decision: OPEN, BOUNDED TO THE OWNER-APPROVED CHARACTER MATRIX.

Generation is not open-ended decoration. The only currently justified new raster roles are A03–A12 from `CHARACTER_POSE_LIBRARY_PLAN.md`.

Rules:

- use approved stylized identity anchors/references;
- one specific pose role per generation task;
- no whole-page screenshot generation;
- no raw user photo as final asset;
- no new infrastructure or state authority;
- no character variant receives final status before identity/anatomy QA and owner approval;
- pages that do not benefit from character art remain character-free.

## Dynamic victory/setback rule

Victory and setback art is presentation-only and derives from existing authoritative outcome data.

It must not add or persist `characterMood`, `winnerPose`, `loserPose` or similar state in local storage or Firestore.

Pending/unresolved outcome = no victory/setback art.

Draw = neutral/focused presentation only.

## Remaining asset blockers

1. Keep A01/A02 immutable and hash-identical in final packaging.
2. Recover/produce final isolated A03–A12 masters at high quality.
3. Record each accepted master in `ASSET_MANIFEST.json` with hash, dimensions and provenance.
4. Build one character contact sheet containing all final Nik and Daniel variants.
5. Composite only the relevant variants into affected page references.
6. Re-run desktop/mobile visual QA.
7. Obtain explicit owner approval of the character sheet and final affected page screenshots.

Supporting SVG/UI asset resolution is otherwise complete. Character variety, not decorative asset proliferation, is the remaining image-asset lane.
