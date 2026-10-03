# League phone art intake

Factory job 112 · Phone art: League

## Runtime weight budget

The committed portrait background is 65,618 bytes (64.08 KiB). The two phone cut-outs use the job default of no more than 60 KB each at WebP quality 85.

| File | Role | Actual / budget | SHA-256 |
| --- | --- | ---: | --- |
| `ENV_LEAGUE_PHONE_V1.webp` | portrait stadium background | 65,618 bytes actual | Claude to fill |
| `OVL_LEAGUE_DANIEL_PHONE_V1.webp` | Daniel phone cut-out | ≤ 60 KB budget | Claude to fill after MAKE_ASSETS.md |
| `OVL_LEAGUE_NIK_PHONE_V1.webp` | Nik phone cut-out | ≤ 60 KB budget | Claude to fill after MAKE_ASSETS.md |
| `PHONE_PROOF.png` | 393 × 660 @ 3× QA proof, not runtime | QA-only; excluded from runtime budget | Claude to fill after MAKE_ASSETS.md |

Runtime total budget for background + two cut-outs: at most 185,618 bytes using decimal 60 KB caps, comfortably below the 350 KB job limit.

## Composition authority

`phonemap.json > phone_frame` is the placement authority. Daniel remains left, Nik remains right, both use source-plate pixels without mirroring, and the bottom gradient begins at 48% of the 393 × 660 frame.

## Claude intake

After running `tools/MAKE_ASSETS.md`, fill the three generated asset SHA-256 values above, generate `PHONE_PROOF.png`, and confirm the two cut-outs each meet their ≤ 60 KB WebP budget.
