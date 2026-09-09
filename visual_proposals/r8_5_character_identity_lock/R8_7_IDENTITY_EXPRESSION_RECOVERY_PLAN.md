# R8.7 Identity Expression Recovery Plan

Status: ACTIVE VISUAL PROPOSAL / NON-OPERATIONAL / DO NOT MERGE AUTONOMOUSLY

## Problem now understood

The base Nik and Daniel likenesses are strong. The recurring failure happens when the image model is asked to create many expressions, poses, lighting states, and small face thumbnails inside one large reference board. Each small face becomes a fresh synthesis opportunity, so expression changes can accidentally change identity.

This is not an instruction-quality problem alone. It is a generation-format problem.

## Permanent workflow change

The multi-expression board is retired as a production-generation format.

From R8.7 onward:

1. Generate only ONE character at a time.
2. Generate only ONE expression or pose at a time.
3. Work at large face resolution, not thumbnail resolution.
4. Use exact owner-approved AI face anchors as the primary identity source.
5. Optional real-photo or additional AI references may be used only as auxiliary geometry/expression evidence. They are never shipping website assets.
6. Keep the approved AI rendering style, hair, beard, age, face proportions, and overall casting fixed.
7. Change expression by facial muscle state, eye direction, head angle, and pose only.
8. Once owner-approved, freeze that expression asset. Never regenerate it during later board construction.
9. Build presentation boards by compositing already-approved expression assets, not by asking the image model to redraw the board.

## Canonical anchors

Highest-priority owner truth remains the two owner-supplied CM17 main-menu references. Deterministic face crops have been preserved in the Showdown visual Library under:

`/Showdown visual/R8_7_IDENTITY_EXPRESSION_RECOVERY/`

- `NIK_OWNER_TRUTH_A_FACE.png`
- `NIK_OWNER_TRUTH_B_FACE.png`
- `DANIEL_OWNER_TRUTH_A_FACE.png`
- `DANIEL_OWNER_TRUTH_B_FACE.png`

These are crops of exact approved pixels, not regenerated images.

## Expression anchors

Owner-established strongest historical anchors:

- Nik: main hero / thinking face is the strongest expression likeness anchor.
- Daniel: main hero / pointing face is the strongest expression likeness anchor.

These anchor expressions are not style inspiration. They are identity references.

## Next production order

Nik first because his expression drift is materially larger:

1. neutral
2. confident
3. thinking refined toward owner truth
4. slight smile
5. happy
6. determined
7. arms crossed
8. pointing
9. open hands
10. side look

Daniel second:

1. playful smirk
2. happy
3. arms crossed
4. open hands
5. side look
6. looking down

Daniel pointing remains frozen unless owner requests otherwise.

## Additional references

Additional owner-supplied photos or AI references are useful, especially for:

- front neutral
- slight smile
- genuine happy smile
- three-quarter view
- side profile
- looking down

They should be treated as auxiliary identity/expression evidence. The final character remains the already-approved CM17 AI character style.

## QA rule

A candidate fails immediately if the viewer's first reaction is 'different person.' Expression quality is evaluated only after identity passes.

Owner visual approval is final authority.

## Infrastructure boundary

This is intentionally lightweight. Do not replicate SSJR/POS/MDP testing infrastructure. Do not change `main`, runtime behavior, Firebase, billing, pairing, save logic, or production deployment.
