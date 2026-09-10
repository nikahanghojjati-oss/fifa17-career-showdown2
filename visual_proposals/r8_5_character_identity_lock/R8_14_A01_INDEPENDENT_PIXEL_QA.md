# R8.14 A01 Independent Pixel QA

Status: PASS FOR DETERMINISTIC SOURCE PRESERVATION / OWNER VISUAL APPROVAL STILL REQUIRED

Runtime authority checked during QA: `1d0c9f9d6542cd020a4aae53998cb6daeba380e4` / `1.9.1-r10`.

Visual proposal branch: `visual/r8-5-approved-character-identity-lock`.

Asset: `A01_NIK_CORE_THINKING_HERO_CANDIDATE_R8_13_V1.png`.

This proof independently validates the R8.14 A01 status claim. It does not freeze the asset and does not replace owner review.

## Source

`NIK_OWNER_LIKED_AI_STYLE_REFERENCE_C.jpeg`

- Library file ID: `file_00000000125881f7b67a4f1bdca4714f`
- dimensions: `707 x 1536`
- mode: RGB
- SHA-256: `7bcdcfd002002d2eef726fed637d31a4870091b542f733adfac79c30a2c7628a`

## Candidate

`A01_NIK_CORE_THINKING_HERO_CANDIDATE_R8_13_V1.png`

- Library file ID: `file_0000000073c881f7990d6190a51af31a`
- dimensions: `900 x 1200`
- mode: RGBA
- SHA-256: `71803aacaeca06d17208ca035b4c3f357b82d1c0e608077c059decb7f1d43c68`

## Deterministic pixel test

The candidate foreground was compared programmatically against the decoded Reference C source.

Observed source-to-candidate translation:

- source X = candidate X - 58
- source Y = candidate Y + 187

No scale transform is required for the correspondence.

Results across every nontransparent candidate pixel:

- nontransparent pixels tested: `306,918`
- exact RGB equality across all three channels: `100%`
- mean absolute RGB difference: `0.0`
- maximum RGB difference: `0`
- fully opaque pixels: `289,208`
- partially transparent antialias/mask-edge pixels: `17,710`
- distinct alpha levels: `249`

Conclusion: the candidate reuses the exact Reference C RGB character pixels. The face, hair, beard, expression, suit, watch, pose, source lighting and body geometry were not regenerated, repainted, rescaled or color-shifted.

## Transparency and padding test

Candidate alpha foreground bounding box:

- left: `170`
- top: `174`
- right: `730`
- bottom: `1025`

Transparent canvas margins:

- left: `170 px`
- top: `174 px`
- right: `170 px`
- bottom: `175 px`

Foreground bounding size: `560 x 851`.

Connected-component test over all nonzero-alpha foreground pixels:

- foreground connected components: `1`

Conclusion: the master has generous, nearly symmetrical transparent padding and one contiguous subject rather than stray detached background islands.

## Sealed A01 brief checks supported by deterministic proof

- one Nik only: PASS
- Reference C identity preserved without facial generation: PASS
- hair/beard/expression preserved: PASS
- black suit/watch/body language preserved: PASS
- stadium and outer black padding removed from the reusable canvas: PASS
- transparent/maskable reusable character master: PASS
- no Daniel, webpage, UI, text, logo, trophy, wheel or expression board: PASS
- source character not scaled: PASS
- generous crop margin around head/hand/shoulders/torso: PASS

## Remaining non-automated gate

Owner visual review remains mandatory for mask-edge preference. Pixel identity preservation proves that the candidate is the approved Reference C character rather than a generated reinterpretation, but only the owner may decide whether the mask edge and body extent are visually acceptable for freeze.

If the owner rejects only edge quality or padding, revise only the mask/padding deterministically. Do not regenerate Nik.

If the owner approves, update A01 to `OWNER_APPROVED_FROZEN`, preserve this exact Library file ID and SHA-256, and proceed to A02 Daniel according to the R8.13 sequence.

No production runtime, `main`, Firebase, billing, scoring, storage, pairing or session authority was modified by this QA.
