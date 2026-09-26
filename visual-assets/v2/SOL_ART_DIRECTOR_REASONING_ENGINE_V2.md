# SOL ART DIRECTOR REASONING ENGINE V2

## Purpose

This is the internal reasoning workflow Sol uses before Luna or image generation is involved.

It is deliberately stronger than a simple asset lookup.

## Phase 1 — Resolve screen truth

For the target screen, record:

- screen id / family
- user goal
- product state
- live controls
- privacy boundary
- what changes visually across states
- what must NEVER be baked into imagery

Output:
`PRODUCT_TRUTH_CARD`

## Phase 2 — Build the screen intent

Describe the experience without describing components.

Required fields:
- emotional beat
- narrative metaphor
- dominant object
- player attention path
- Daniel role
- Nik role
- environment energy
- typography energy
- density target
- mobile transformation

Example:
Transfer Guess Entry = "private war-room prediction after the deadline closes."

Output:
`SCREEN_INTENT_CARD`

## Phase 3 — Retrieve reference pack

Choose 2–5 references only.

For each reference record:
- what to learn
- what to ignore
- why it is relevant

Never dump the whole archive into Luna or an image generator.

Output:
`REFERENCE_PACK`

## Phase 4 — Asset sufficiency test

For each desired visual element, ask in order:

A. Does an APPROVED_FOR_ROLE asset already exist?
B. Does an OWNER_ACCEPTED asset exist that can be promoted?
C. Can the desired effect be achieved by recomposing an approved base?
D. Is CSS/SVG/DOM better than generating an image?
E. Is a new image genuinely required?

If A–D solve it, do not generate.

## Phase 5 — Counterfactual check

Before generating a new asset, test:

- If we reuse the existing asset, does the screen lose narrative specificity?
- If we generate a whole screenshot, do we bake incorrect product truth?
- If we generate an isolated asset, can it remain reusable?
- If we change lighting only, can the existing environment work?
- Does a new asset create future value beyond one screenshot?

This prevents both over-generation and lazy reuse.

## Phase 6 — Asset demand decision

Every need receives one disposition:

`REUSE_EXACT`
`REUSE_WITH_GRADE`
`RECOMPOSE`
`CSS_SVG`
`LIVE_DOM`
`GENERATE_ISOLATED_CHARACTER`
`GENERATE_ENVIRONMENT`
`GENERATE_OBJECT`
`BLOCKED_OWNER_DECISION`

Each generated item gets:
- stable asset id
- screen family
- target reuse scope
- source identity anchors
- reference pack
- pose / camera / crop
- light direction
- safe zones
- forbidden content
- output format
- acceptance criteria

## Phase 7 — Generation quality loop

Generate one high-risk identity-bearing asset at a time.

For people:
1. identity fidelity
2. anatomy/hands
3. pose semantics
4. lighting match
5. clean compositing edge
6. crop flexibility
7. screen-safe geometry

Do not proceed to the paired character until the first passes.

For environments:
1. camera geometry
2. UI safe zones
3. lighting direction
4. visual-family match
5. absence of live product truth
6. desktop/mobile crop viability

## Phase 8 — Composition simulation

Before Luna builds, Sol mentally/visually assembles:

background -> lighting -> character anchors -> dominant object -> live control safe zone -> CTA -> secondary modules

Ask:
- Is the dominant object obvious in 2 seconds?
- Do the characters point attention inward?
- Is the live UI competing with the artwork?
- Are there dead zones or collisions?
- Does mobile have a separate composition?

If not, fix asset/blueprint planning first.

## Phase 9 — Luna compilation

Luna receives only:
- exact asset IDs
- exact geometry
- exact state variants
- exact product constraints
- exact reference pack
- exact QA matrix

No broad project archaeology.

## Phase 10 — Art-director critique

Review render in this order:
1. visual-family belonging
2. emotional/narrative read
3. dominant hierarchy
4. character identity/pose
5. environment mood
6. material/typography
7. product truth
8. responsive
9. accessibility
10. polish

A candidate that fails 1–4 does not proceed to deep behavioral review.

## Phase 11 — Learn

After approval:
- promote asset status
- update reuse rules
- update screen intent if owner feedback changed it
- record one or two durable lessons
- retire superseded candidates
- update future demand map

The system should become smaller and smarter over time, not accumulate endless prose.