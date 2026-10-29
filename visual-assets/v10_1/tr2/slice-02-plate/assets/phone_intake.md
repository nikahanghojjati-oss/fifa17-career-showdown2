# Transfer War phone art intake

Job 114 · Phone art: Transfer War

## Runtime weight budget

Phone-art runtime cap: 350 KiB (358,400 bytes).

| File | Role | Actual / budget | SHA-256 |
| --- | --- | ---: | --- |
| `ENV_TRANSFER_PHONE_V1.webp` | Portrait stadium background | 233,908 bytes (228.43 KiB) actual | Claude: fill after asset pass |
| `OVL_TRANSFER_DANIEL_PHONE_V1.webp` | Daniel cut-out, left | ≤ 60 KiB at WebP quality 85 | Claude: fill after MAKE_ASSETS.md |
| `OVL_TRANSFER_NIK_PHONE_V1.webp` | Nik cut-out, right | ≤ 60 KiB at WebP quality 85 | Claude: fill after MAKE_ASSETS.md |
| `PHONE_PROOF.png` | 393 × 660 at 3× composition proof; evidence only, not runtime | Claude: fill after composition | Claude: fill after MAKE_ASSETS.md |

Worst-case runtime total at the two 60 KiB cut-out caps:

`233,908 + 61,440 + 61,440 = 356,788 bytes = 348.43 KiB`

Margin to the 350 KiB cap: 1.57 KiB (1,612 bytes).

## Generation / intake requirements

- Run the two cut-out commands in `../tools/MAKE_ASSETS.md` from the repository root.
- Export the two runtime cut-outs as transparent WebP at about 1000 px tall, quality 85, each no larger than 60 KiB.
- Preserve the PNG masters produced by the shared cut-out recipe; runtime uses the WebP exports.
- Composite `PHONE_PROOF.png` from `phonemap.json > phone_frame`: Daniel left, Nik right, both heads fully visible, with the portrait stadium behind them.
- Inspect both cut-outs at 400% before accepting: no halo, no matte ring, soft hair edges, no clipped fingers or suit edges.
- Fill the SHA-256 cells above after the generated assets are committed.

The proof PNG is QA evidence and is excluded from the 350 KiB runtime total.
