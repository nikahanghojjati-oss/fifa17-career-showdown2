# A01 / A02 Frozen Authority Verification

Status: VERIFIED SOURCE BYTES — PROPOSAL BINARY COPY STILL OPEN

Verification date: 2026-09-10

This evidence exists to prevent identity drift and accidental regeneration while the final proposal package is being assembled.

## Source recovery

The persistent Showdown visual Library contains:

- `/Showdown visual/R8_5_APPROVED_CHARACTER_IDENTITY_LOCK/A01_NIK_CORE_THINKING_HERO_OWNER_APPROVED_V1.png`
- `/Showdown visual/R8_5_APPROVED_CHARACTER_IDENTITY_LOCK/A02_DANIEL_CORE_POINTING_HERO_OWNER_APPROVED_V1.png`
- `/Showdown visual/R8_25_BINARY_DROP.zip`

The binary drop contains canonical copies named:

- `assets/visual/r8/a01-nik-core-thinking-hero.png`
- `assets/visual/r8/a02-daniel-core-pointing-hero.png`

## Exact verification results

### A01 Nik

Stable ID: `A01_NIK_CORE_THINKING_HERO`

Verified dimensions: `1086 x 1448`

Verified mode: `RGBA`

Verified byte size: `1,426,297`

Verified SHA-256:

`17972b8afb73b90483c8f874c4bd964ac1bda196daa76e134a6030676bbd4219`

Result: exact match to R8.26 authority.

### A02 Daniel

Stable ID: `A02_DANIEL_CORE_POINTING_HERO`

Verified dimensions: `1086 x 1448`

Verified mode: `RGBA`

Verified byte size: `1,628,938`

Verified SHA-256:

`9b1545b52a5d96a240c92b9901dcd8a4558148dde05a0331882df7bd988177cc`

Result: exact match to R8.26 authority.

## Cross-check against R8.25 binary drop

The A01 and A02 files inside `R8_25_BINARY_DROP.zip` produce the same SHA-256 values as the owner-approved Library masters. Therefore the binary drop is a valid transfer package for the frozen character authorities.

Binary-drop ZIP SHA-256 at verification:

`598007e2fe317a338031dabdf7790c139d63bbd3f5addacf7b397a7e4e8ea797`

## Manager mapping lock

Manager 1 = Daniel = A02

Manager 2 = Nik = A01

This mapping must remain fixed in every promotional/reference composition that uses these authorities.

## No-regeneration decision

Image generation is not justified for A01 or A02. They are accepted immutable masters and must never be regenerated, recompressed or silently replaced.

## Remaining packaging action

The proposal still requires byte-for-byte copies under `visual-proposal/r8-complete-product/assets/masters/` before final senior handoff.

The current GitHub text connector cannot safely transfer multi-megabyte local PNG bytes without converting them through a text/base64 call. Because the R8.26 contract requires exact-byte preservation, this session records the verified authority instead of risking recompression or truncation.

Until exact-byte copies are present and re-hashed inside the proposal folder, the A01/A02 packaging rows remain OPEN even though source authority is VERIFIED.