# R8.5 Approved Character Identity Lock

Status: PROPOSAL ONLY / NON OPERATIONAL / NOT FOR LIVE ACTIVATION

This folder is the independent visual production lane. It must not be merged or activated autonomously. The main/master development lane must explicitly review any implementation.

## Current source boundary

The proposal branch was created from:

- original source main: `7f6432213871fb4cb5fb414999e08ac44e0fb318`
- original asset revision: `1.9.1-r8`

During visual work, live main advanced and was independently re-resolved as:

- latest observed main: `d56b5179be76d05b98a801a4de7c0f4a42262b4f`
- latest observed asset revision: `1.9.1-r9`
- publication: Shared Season Results (#228)

The relevant Home/Create/League/Club shell structure was re-read at r9 before continuing. The visual branch is intentionally not rebased or merged into main merely because main moved. The master developer must always re-resolve live main before implementation.

Proposal branch: `visual/r8-5-approved-character-identity-lock`

Production files changed by this proposal: NONE.

Firebase/billing changes: NONE.

Zero-dollar rule: REQUIRED.

## Permanent face truth

The owner re-uploaded and explicitly reapproved the Nik and Daniel AI face resemblance. Those two images are now Tier 0 visual identity authority and are preserved in the Showdown visual Library:

- `/Showdown visual/R8_5_APPROVED_CHARACTER_IDENTITY_LOCK/OWNER_APPROVED_FACE_TRUTH_A.png`
- `/Showdown visual/R8_5_APPROVED_CHARACTER_IDENTITY_LOCK/OWNER_APPROVED_FACE_TRUTH_B.png`

Exact Library IDs and SHA256 values are stored in `APPROVED_CHARACTER_IDENTITY_LOCK.json`.

The previous accepted composites remain supporting identity and expression evidence.

## Crucial clarification: expression is not identity

The owner approved the resemblance, not one frozen facial expression.

Nik and Daniel may show natural context-appropriate expressions such as focused, thoughtful, confident, competitive, surprised, celebratory, disappointed, relieved or determined. They may change gaze and pose. They must remain recognizably the exact approved AI characters.

Read `IDENTITY_EXPRESSION_CONTRACT.md` before generating any character asset.

The operating rule is:

SAME PERSON, DIFFERENT MOMENT.

## Why this lock exists

A later generation interpreted R8.5's future character-master IDs as permission to recreate Nik and Daniel from prose. That produced new unrelated faces. The output is rejected.

Never regenerate Nik or Daniel from prose alone. Never substitute literal photographs as shipping character art. If the approved references cannot be loaded, stop character generation rather than inventing a replacement.

## Visual architecture

- runtime authority: exact live production DOM and JavaScript
- presentation: R8.5 black/gold layer
- character art: isolated replaceable visual assets
- controls: real DOM controls above art
- final-art layer: non-interactive; `pointer-events:none`
- no visual code owns save, Firebase, pairing, session, transfer, results, scoring or mutation authority
- support both Daniel-left/Nik-right and Nik-left/Daniel-right when required
- keep live control safe zones unobstructed
- preserve the real league `SPIN WHEEL` control below the wheel
- use responsive fade/crop/omission rules instead of covering controls

## Rejected identity source

The drifted 1536x1024 `CHARACTER MASTERS R8.5 VISUAL SYSTEM` image is permanently rejected.

SHA256:

`ff8ebde5c2b81a902c5fd330147284761f5c36d53944452551f28223c30e69e6`

Do not promote, trace, interpolate from or use those faces.

## Lightweight continuity

This lane deliberately does not reproduce the main project's heavy test/process infrastructure.

Use only:

- `APPROVED_CHARACTER_IDENTITY_LOCK.json` for identity authority
- `IDENTITY_EXPRESSION_CONTRACT.md` for expression/pose rules
- `VISUAL_TRACK_STATUS.json` for progress and visual handoff proximity
- `START_NEXT_VISUAL_SESSION_R8_6.md` for successor continuity once present
- the master-developer handoff/prompt for eventual implementation

## Next safe visual action

Create isolated character assets from the Tier 0 owner-approved references, one manager at a time. First milestone: identity-preserving neutral/confident and focused/thinking masters, then natural celebration and disappointment/resolve expressions. Do not begin with another generated whole webpage.
