# HO-044 · tall phone League plate (ENV_LEAGUE_PHONE_TALL_V5)

Plate: `visual-assets/v10_1/plates-v5/ENV_LEAGUE_PHONE_TALL_V5.webp` (1179x2620, 9:20, WebP q84 method 6, 377,496 B,
sha256 `ba95dad70a228f546bc8…`). For upright phones below 59/128 wide-to-tall (412x915, 384x854, 360x800, 340x960 and
anything taller than 9:19.5), which today fall back to the old stadium art. Team G adds the media query (HO-044).

## Inputs
- `source/GPT_1852_LEAGUE_TALL.png`: picture ticket 1852 result as Nik delivered it (841x1870, aspect 0.4497).
  ChatGPT was given the exact V5 plate scaled 0.879 on a 1179x2620 canvas with a magenta border (71 px sides, 389 px
  top and bottom) and asked to paint only the border (`project-documents/factory/tickets/attach/LEAGUE_PHONE_V5_TALL_FOR_GPT.png`).
- `visual-assets/v10_1/plates-v5/ENV_LEAGUE_PHONE_V5.webp` (the approved phone plate, HO-032 V5).

## What was done (`tools/build_tall.py`, shift 340)
1. Lanczos scale of the GPT picture to 1179x2620.
2. Position lock: the exact V5 plate (Lanczos 0.879, 1036x1842) pasted back at (71,389) with a blend band of 30 px at the
   sides and 16 px top/bottom (Gaussian 10) so the joins fade; both men, the plinth and the stadium between them are
   therefore V5 pixels (the face zones start 165 px in, well inside the blend band). Only the border comes from GPT.
3. The scene is moved up 340 px (the sky band shrinks to 49 px) and the GPT floor band (389 px) is stretched to 729 px to
   fill the foot. Reason: with the men at the canvas centre their faces landed on the wheel's top corners on every tall
   phone; moved up they sit where V5 puts them on an iPhone. The floor is smooth reflections, so the stretch is not visible.
4. Face zones `PHONE_FACE_ZONES_TALL_V5.json` = V5 LEAGUE zones through the same transform:
   Daniel [0.1396, 0.1509, 0.2833, 0.2363], Nik [0.7158, 0.1495, 0.8589, 0.2345] (14.0 % in from each side, as asked).

## Swap check (`tools/swapcheck_tall.cjs`, the HO-032 tool with `H31_SIZES` / `H31_IH`, wheel at 0.85 as a circle)
Run from the gameplay/r87 worktree (44e35f15), plate served in place of the old art:

| size    | result | circle margin Daniel / Nik | pixels over faces |
|---------|--------|----------------------------|-------------------|
| 412x915 | OK     | 32.6 / 33.8 px             | 0 / 0 |
| 384x854 | OK     | 37.6 / 38.7 px             | 0 / 0 |
| 360x800 | OK     | 41.6 / 42.7 px             | 0 / 0 |
| 340x960 | OK     | 18.5 / 19.5 px             | 0 / 0 |

(V5 on an iPhone 393x852 has 18.3 / 19.6 px, so 340x960 matches the accepted floor.) Pictures: `shots/`.
The box round SELECT LEAGUE in the pictures is the HO-045 focus-ring bug, not part of this plate.
