# Home phone art intake

Job 111 · Phone art: Home

The approved portrait background is already committed. The two manager cut-outs and proof are produced by Claude from `tools/MAKE_ASSETS.md`; workers do not generate or upload binary assets.

## Runtime weight budget

| File | Size / budget | First paint |
| --- | ---: | --- |
| `ENV_HOME_PHONE_V1.webp` | 132,124 bytes measured on branch | yes |
| `OVL_HOME_DANIEL_PHONE_V1.webp` | ≤ 60,000 bytes at WebP quality 85 | yes |
| `OVL_HOME_NIK_PHONE_V1.webp` | ≤ 60,000 bytes at WebP quality 85 | yes |
| `PHONE_PROOF.png` | evidence only; size recorded after Claude composites it | no |

Maximum first-paint art weight: 252,124 bytes (background plus both cut-out budgets), leaving 97,876 bytes below the 350,000 byte Job 111 cap.

The PNG masters remain production/source assets and are never shipped on first paint.

## SHA-256 intake

Claude fills these after running `tools/MAKE_ASSETS.md` and producing the final proof.

- `ENV_HOME_PHONE_V1.webp`: SHA-256: ________________________________
- `OVL_HOME_DANIEL_PHONE_V1.webp`: SHA-256: ________________________________
- `OVL_HOME_NIK_PHONE_V1.webp`: SHA-256: ________________________________
- `PHONE_PROOF.png`: SHA-256: ________________________________

## Composition authority

`phonemap.json` is authoritative for the 393 × 660 proof. Daniel is left and Nik is right, neither is mirrored, both heads remain fully visible in the top 55%, and the lower 18% alpha fade of each figure finishes inside the dark bottom gradient.
