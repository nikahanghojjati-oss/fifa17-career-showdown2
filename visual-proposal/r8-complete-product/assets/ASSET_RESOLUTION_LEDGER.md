# R8 Complete Product Asset Resolution Ledger

Status: CHARACTER VARIATION REOPENED BY OWNER — A01/A02 FROZEN / A05/A06 STRONG RECOVERED CANDIDATES / A03–A12 FINALIZATION OPEN / SUPPORTING ASSETS RESOLVED THROUGH r16

This ledger closes the distinction between “visual role required” and “new image required.” It is the working resolution companion to `ASSET_MANIFEST.json` and `CHARACTER_POSE_LIBRARY_PLAN.md`.

## Character authority

### A01 Nik

Role: wide Home right-flank identity/hero anchor.

Resolution: REQUIRED EXISTING MASTER.

Source authority is recovered and hash-verified:

`17972b8afb73b90483c8f874c4bd964ac1bda196daa76e134a6030676bbd4219`

Current-session binary verification also confirms 1086 × 1448 RGBA from `/Showdown visual/A01_A02_FROZEN_MASTERS_EXACT_R8_26.zip`.

No regeneration or replacement is permitted.

### A02 Daniel

Role: wide Home left-flank identity/hero anchor.

Resolution: REQUIRED EXISTING MASTER.

Source authority is recovered and hash-verified:

`9b1545b52a5d96a240c92b9901dcd8a4558148dde05a0331882df7bd988177cc`

Current-session binary verification also confirms 1086 × 1448 RGBA from `/Showdown visual/A01_A02_FROZEN_MASTERS_EXACT_R8_26.zip`.

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
- `C02_DANIEL_CLUB_PACK_HOLDING_OWNER_LIKED_CANDIDATE_V1.png` — owner-liked Daniel pack pose candidate;
- `CLUB_PACK_HOLDING_OWNER_LIKED_COMPOSITE_REFERENCE_R8_19.jpeg`;
- `REF_08_CLUB_ASSIGNMENT.png`;
- `REF_02_CLUB_PACK_FORMAL.jpeg`.

These references do not become final isolated production assets merely because they were recovered.

### A05/A06 recovered candidate resolution

A bounded per-asset QA pass was completed on the two recovered pack-holding candidates.

A05 Nik candidate:

- source: `C01_NIK_CLUB_PACK_HOLDING_OWNER_LIKED_CANDIDATE_V1.png`;
- 1086 × 1448 RGBA;
- SHA-256 `7014a5165330e321928c30baf426c86c51bc909dc0122942945d6ec32789500d`;
- alpha present;
- pose/identity/wardrobe/anatomy direction strong enough to retain as the preferred A05 source candidate.

A06 Daniel candidate:

- source: `C02_DANIEL_CLUB_PACK_HOLDING_OWNER_LIKED_CANDIDATE_V1.png`;
- 1086 × 1448 RGBA;
- SHA-256 `049654d7360a1c9fd70c4bed836a13b3ae7f797d125a19d1a0395e848f34f368`;
- alpha present;
- pose/identity/wardrobe/anatomy direction strong enough to retain as the preferred A06 source candidate.

Both candidates fail the final isolated-master prop contract because their generated pack surfaces contain baked `CLUB PACK / CM17` text. They therefore remain internal candidates and require one-asset-at-a-time prop cleanup/rebuild plus fresh identity/anatomy QA before final A05/A06 acceptance.

Evidence:

`evidence/A05_A06_RECOVERED_PACK_CANDIDATE_QA_2026-09-10.md`

## Routed screens

| Screen | Asset role resolution | New raster generation? | Status |
| --- | --- | --- | --- |
| Home | A01/A02 exact masters + H01 original stadium atmosphere + DOM/CSS safe-zone geometry | No for hero identity anchors | composition exists; final owner capture later |
| Create Showdown | S02 divider + DOM/CSS season tiles; character optional and usually omitted | No required | RESOLVED |
| League Wheel | S03 halo + existing real wheel; A07/A08 focused variants optional only if safe | Optional | wheel remains primary; no generation dependency |
| Club Assignment | S04 original pack frame + live DOM labels + A05/A06 pack-opening variants | Yes, preferred final character role | A05/A06 STRONG CANDIDATES; TEXT-FREE PROP FINALIZATION OPEN |
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
| Connected Account / Pairing / Rivalry / Remote Joining | DOM/CSS + I02 optional | No | RESOLVED THROUGH r16 LOCAL RECONCILIATION |
| Backup / Import / Restore / Recovery | DOM/CSS + I02 optional | No | RESOLVED; Candidate C remains Apply authority |
| Shared / Multi Season / Journey Reconnect / Journey Conflicts / Local Reconciliation | DOM/CSS status surfaces | No | RESOLVED THROUGH r16 |
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

Generation is not open-ended decoration. The only currently justified new raster roles are A03–A12 from `CHARACTER_POSE_LIBRARY_PLAN.md`, with A05/A06 allowed to use their recovered candidates as one-asset-at-a-time edit/rebuild sources.

Rules:

- use approved stylized identity anchors/references;
- one specific pose role per generation task;
- no whole-page screenshot generation;
- no raw user photo as final asset;
- no new infrastructure or state authority;
- no character variant receives final status before identity/anatomy QA and owner approval;
- pack props in final isolated masters remain generic/original and text-free;
- pages that do not benefit from character art remain character-free.

## Dynamic victory/setback rule

Victory and setback art is presentation-only and derives from existing authoritative outcome data.

It must not add or persist `characterMood`, `winnerPose`, `loserPose` or similar state in local storage or Firestore.

Pending/unresolved outcome = no victory/setback art.

Draw = neutral/focused presentation only.

## Remaining asset blockers

1. Keep A01/A02 immutable and hash-identical in final packaging.
2. Complete one-asset-at-a-time A05/A06 text-free prop finalization and fresh QA.
3. Produce final isolated A03/A04/A07/A08/A09/A10/A11/A12 masters one at a time at high quality.
4. Record each accepted master in `ASSET_MANIFEST.json` with hash, dimensions and provenance.
5. Build character contact sheets only after independent assets pass.
6. Composite only the relevant variants into affected page references.
7. Re-run desktop/mobile visual QA.
8. Obtain explicit owner approval of the character sheets and final affected page screenshots.

Supporting SVG/UI asset resolution is otherwise complete. Character variety, not decorative asset proliferation, is the remaining image-asset lane.
