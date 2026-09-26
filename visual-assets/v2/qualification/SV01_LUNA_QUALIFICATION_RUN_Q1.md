# SV01 LUNA QUALIFICATION RUN Q1

Qualification ID: LUNA-VISUAL-Q1
Evaluator: Sol
Builder: Luna
Target: SV01 Transfer Challenge / Guess Entry Revision 1

## Why this is a fair test

SV01 is difficult enough to test real front-end ability but bounded enough that Luna should not need art-direction freedom. The visual system, approved Transfer-specific characters, environment base, reference pack, desktop geometry, mobile behavior, product-state rules and forbidden substitutions are already defined.

This therefore measures implementation competence rather than Luna's ability to invent art direction.

## Luna input

Luna receives only the normal worker task from /Showdown Visual Relay/LUNA_NEXT.md and the blueprint/assets named there. Luna does not need the scoring rubric.

## Required candidate evidence

- /Showdown Visual Relay/SV01_CANDIDATE.html
- /Showdown Visual Relay/LUNA_REPORT.md
- /Showdown Visual Relay/design-qa.md

## Required QA cases

1. 1366x768 — Nik editable
2. 1366x768 — Daniel editable
3. 1366x768 — Nik locked/waiting
4. 390x844 — Nik editable
5. 390x844 — Daniel replay
6. 390x844 — Nik error/recovery

## Sol evaluation procedure

1. Freeze candidate and compute/verify SHA-256.
2. Blind visual review before reading Luna self-rating.
3. Evaluate hard gates H1-H8.
4. Score the nine weighted dimensions.
5. Assign P0-P3 to every concrete defect.
6. Classify correction burden LOW / MEDIUM / HIGH / EXTREME.
7. Apply LUNA_VISUAL_QUALIFICATION_STANDARD_V1.md.
8. Show Nik the score, evidence, role recommendation, and actual candidate.

## Special SV01 evidence checks

Required assets:
- POSE_TRANSFER_DANIEL_FOCUSED_V1
- POSE_TRANSFER_NIK_TACTICAL_V1
- ENV_STADIUM_WARM_BASE_V1

Forbidden substitutions:
- Home Daniel pointing
- Home Nik chin-thinking
- Club Assignment pack poses
- unregistered generated substitutes

Required visual story: PRIVATE GUESS WAR ROOM.

Required hierarchy: Transfer Challenge title; Window Closed / Guess Entry status; four-stage rail; acting-manager three-row guess board; sealed/private opponent module; LOCK MY GUESSES CTA.

Mobile: large desktop hero art is intentionally hidden unless the blueprint explicitly allows a shallow crop.

Product firewall: no active timer during Guess Entry and no invented reveal, route, scoring, retry, backend, or privacy behavior.

## Decision meaning

FULL PASS means Luna has demonstrated that, under a Sol-authored system, she can act as primary front-end builder without creating more correction work than implementation value.

CONDITIONAL / MIDDLE GROUND means Luna remains useful but responsibilities narrow immediately.

FAIL means Luna leaves primary full-screen construction and becomes a secondary QA/implementation assistant.