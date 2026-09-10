# R8 A05 / A06 recovered club-pack candidate QA

Status: INTERNAL CANDIDATE QA COMPLETE — FINAL MASTER APPROVAL OPEN

This record evaluates the recovered owner-liked pack-holding candidates without silently promoting them to final A05/A06 authority.

## Candidate inputs

Nik candidate:

`/Showdown visual/R8_5_APPROVED_CHARACTER_IDENTITY_LOCK/C01_NIK_CLUB_PACK_HOLDING_OWNER_LIKED_CANDIDATE_V1.png`

Measured local verification:

- 1086 × 1448;
- RGBA;
- alpha present;
- SHA-256 `7014a5165330e321928c30baf426c86c51bc909dc0122942945d6ec32789500d`.

Daniel candidate:

`/Showdown visual/R8_5_APPROVED_CHARACTER_IDENTITY_LOCK/C02_DANIEL_CLUB_PACK_HOLDING_OWNER_LIKED_CANDIDATE_V1.png`

Measured local verification:

- 1086 × 1448;
- RGBA;
- alpha present;
- SHA-256 `049654d7360a1c9fd70c4bed836a13b3ae7f797d125a19d1a0395e848f34f368`.

## Identity / presentation QA

Both recovered candidates preserve the intended R8 black formal wardrobe and warm gold edge-light family. At proposal-review scale their face/hair/facial-hair direction remains materially consistent with the corresponding frozen identity anchors and prior owner-approved visual direction.

The two silhouettes are related but not exact mirrors, which is desirable for the paired Club Assignment composition.

## Anatomy / prop QA

No obvious duplicated limb, impossible shoulder connection or floating hand is visible in the recovered candidates at review scale. The pack grip is readable and the transparent-background geometry is useful for compositing.

However, both candidates bake generated text into the pack prop (`CLUB PACK` / `CM17`). That conflicts with the final isolated-master contract in `CHARACTER_POSE_LIBRARY_PLAN.md`, which requires generic/original text-free pack props and keeps meaningful interface copy in the DOM.

Therefore these files are not promoted to final A05/A06 masters.

## Resolution decision

- A05 Nik: `STRONG RECOVERED CANDIDATE — PROP CLEANUP / FINAL ISOLATION REQUIRED`.
- A06 Daniel: `STRONG RECOVERED CANDIDATE — PROP CLEANUP / FINAL ISOLATION REQUIRED`.
- Owner approval: not requested yet; final asset does not yet exist.
- A01/A02: untouched and immutable.

The preferred next step is a one-asset-at-a-time rebuild/edit preserving each candidate's approved pose and face direction while replacing the baked pack text with a clean original black/gold pack surface. Each resulting asset must be independently re-QA'd, hashed and owner-reviewed.

## Product boundary

This is visual asset QA only. It changes no scoring, storage, Firebase, Shared Journey, Candidate B/C or Remote Joining authority.
