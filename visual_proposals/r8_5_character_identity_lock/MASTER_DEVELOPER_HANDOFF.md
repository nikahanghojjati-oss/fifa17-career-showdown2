# Master Developer Handoff — R8.5 Character Identity Recovery

Classification: VISUAL PROPOSAL ONLY

Do not merge automatically. Do not deploy automatically. Do not wire assets into production until the master development lane reviews the proposal against the then-current live `main`.

## What was recovered

The previously approved AI identities were located in the Showdown visual Library and reconciled against the R8.5 handoff. They are the recurring characters visible in the accepted Home/Create/League/Club/Season/Legacy visual proofs.

The visual lane generated a later replacement character sheet with materially different faces. That later sheet is rejected and blacklisted by hash in `APPROVED_CHARACTER_IDENTITY_LOCK.json`.

## New durable Library references

Two deterministic reference sheets were produced only by cropping exact pixels from accepted generated composites. No generative model was used to redraw these sheets.

- Nik identity sheet
  - Library path: `/Showdown visual/R8_5_APPROVED_CHARACTER_IDENTITY_LOCK/NIK_APPROVED_IDENTITY_REFERENCE_SHEET.webp`
  - Library file id: `file_0000000062c881fd9655002535c8db5b`
  - Library stable id: `libfile_13da4663cfe08191b45b66a073acbce1`
  - full reference sheet SHA256: `bc206840730ba4713459cff8acb3a7fae18e3dee6ea3cd18648a2bd7cc72df2c`

- Daniel identity sheet
  - Library path: `/Showdown visual/R8_5_APPROVED_CHARACTER_IDENTITY_LOCK/DANIEL_APPROVED_IDENTITY_REFERENCE_SHEET.webp`
  - Library file id: `file_00000000f97481f5827aec4d9674b0bc`
  - Library stable id: `libfile_fd49af84b9348191a24a2be4a8ebe595`
  - full reference sheet SHA256: `22d5826e409eb751506dad11283982bfe0e23c0d233d1a3cfc837c9766f91794`

The original accepted 1672x941 composites remain the higher-resolution identity evidence and are enumerated in `APPROVED_CHARACTER_IDENTITY_LOCK.json`.

## Required master-generation workflow

1. Resolve current live `main` again before any integration.
2. Do not modify product/runtime code while creating character assets.
3. Load the exact approved Nik or Daniel reference sheet plus at least one original accepted composite.
4. Generate one isolated character only, never both at once during master creation.
5. Preserve identity first; pose and wardrobe are secondary.
6. Preferred output: transparent PNG/WebP, full or three-quarter body, generous edge padding, no text/UI/trophy/stadium baked in.
7. Compare the new face against all three views in the reference sheet. Reject on meaningful identity drift.
8. Only after neutral/confident masters pass should pose variants be made.
9. Required pose families from R8.5:
   - Nik neutral/confident suit
   - Nik tie/lapel adjustment
   - Nik competitive stance
   - Nik celebration
   - Daniel neutral/confident open-white-shirt suit
   - Daniel lapel/relaxed stance
   - Daniel competitive stance
   - Daniel celebration
10. Mirroring for screen placement must not regenerate the face. Mirror/composite the approved asset at the presentation layer where appropriate.

## Exact website landing architecture

After approved isolated assets exist, integration remains additive:

1. existing `css/app.css`
2. R8.5 black/gold presentation CSS
3. R8.5 final-art layer CSS
4. existing runtime JavaScript
5. R8.5 final-art layer JS
6. release-owned asset config after approval

The art layer must remain non-interactive and must not duplicate or replace real DOM controls.

## First integration surfaces after master approval

1. Home
2. Create Showdown
3. League Wheel
4. Club Assignment
5. Trophy Room

For two-manager screens preserve both:

- Nik-left / Daniel-right
- Daniel-left / Nik-right

Use R8.5 safe zones. In particular, the League Wheel CTA remains below the wheel and cannot be covered by character art.

## Non-interference rule

This proposal branch is not a product branch. It owns no SSJR/MDP/RJR credit, Firebase changes, storage changes, rules changes, runtime feature behavior, or deployment state. If the main development lane advances, rebase/reconcile this proposal only when the master developer chooses to consume it.
