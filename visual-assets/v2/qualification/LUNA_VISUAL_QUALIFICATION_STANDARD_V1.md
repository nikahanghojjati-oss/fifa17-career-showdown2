# LUNA VISUAL QUALIFICATION STANDARD V1

Status: ACTIVE
Owner: Nik
Evaluator: Sol
Candidate builder under qualification: Luna
Scope: Showdown Visual front-end implementation role
Applies first to: SV01 Transfer Challenge / Guess Entry Revision 1

## Purpose

This qualification determines whether Luna should remain the primary front-end production builder, be narrowed to a restricted implementation role, or be removed from full-screen construction.

The test measures delivered output, not confidence, self-rating, eloquence, or speed claims.

Luna's own self-rating is evidence only and never affects the score.

## Evidence order

Sol evaluates: exact candidate fingerprint; rendered desktop/mobile output when available; DOM/CSS/JS; required asset identity; Luna QA evidence; then owner reaction.

Do not read Luna's self-rating before the first visual assessment when avoidable.

## Hard gates

H1 EXACT ASSET COMPLIANCE — candidate uses every required approved asset ID.
H2 NO FORBIDDEN SUBSTITUTION — no Home hero, generic portrait, invented stadium, or alternate component system replaces a locked asset.
H3 VISUAL-FAMILY BELONGING — first impression belongs beside approved Home, League and Club Assignment rather than SaaS/admin/form UI.
H4 PRODUCT-TRUTH FIREWALL — no route, timer, scoring, privacy, reveal, backend action, or state transition is invented.
H5 SCREEN-SPECIFIC STORY — composition clearly reads as this screen, not a generic reusable template.
H6 DESKTOP COMPOSITION — no catastrophic overflow, hidden CTA, broken hero/UI collision, or composition collapse at the required desktop target.
H7 MOBILE RECOMPOSITION — at 390x844 there is no horizontal overflow and mobile is task-first rather than a shrunken desktop.
H8 REVIEW-TOOL ISOLATION — review controls stay outside the product canvas and add no product behavior.

All hard gates must pass for FULL PASS. H1-H4 failure is a critical qualification failure.

## Weighted score — 100

A. Visual family fidelity — 20
B. Screen specificity / narrative — 15
C. Composition / hierarchy — 15
D. Asset fidelity / integration — 10
E. Typography / material / geometry — 10
F. Responsive / mobile — 10
G. Product fidelity / privacy — 10
H. Implementation robustness / accessibility — 5
I. Instruction compliance / delivery discipline — 5

## Severity labels

P0 — disqualifying: product/privacy corruption, unusable candidate, or unauthorized broad change.
P1 — major: architecture/visual-family failure, wrong required assets, major responsive failure, hierarchy failure, or rebuild-level correction.
P2 — moderate: localized but meaningful typography, spacing, component, state-presentation, or responsive correction.
P3 — polish: minor alignment, spacing, or visual refinement.

## Correction burden

LOW — no P0/P1, at most two localized P2/P3 deltas, no architectural rewrite.
MEDIUM — no P0, at most one P1, three to five bounded deltas, main composition remains salvageable.
HIGH — two or more P1 findings, wrong asset strategy, generic architecture, or major desktop/mobile rebuild.
EXTREME — P0, product/privacy corruption, unusable candidate, or Sol must replace most implementation.

## Qualification outcomes

FULL PASS — PRIMARY BUILDER
- all hard gates pass
- score >= 88
- no P0 or P1
- correction burden LOW

CONDITIONAL PASS — RESTRICTED BUILDER
- H1-H4 pass
- score 76-87 or correction burden MEDIUM
- no P0
- at most one P1

MIDDLE GROUND — SECONDARY IMPLEMENTATION / QA
- score 60-75 or correction burden HIGH
- Luna stops owning full-screen builds
- use Luna for responsive conversion, state variants, accessibility, isolated CSS, implementation suggestions, and QA

FAIL — REMOVE FROM PRIMARY BUILD
- score < 60, or any P0, or critical H1-H4 failure, or repeated major visual drift despite exact assets and geometry
- Sol becomes primary implementation owner; Luna is limited to QA/support tasks

## Anti-gaming rules

- Do not award points for Luna's self-score.
- Do not award points for explaining what should have been built.
- Score only the delivered frozen candidate.
- A technically valid but visually generic page cannot FULL PASS.
- A beautiful page that invents product behavior cannot FULL PASS.
- Average score cannot cancel a failed hard gate.

## Certification durability

A FULL PASS certifies Luna for the next three bounded visual slices under the same Sol-led workflow. A later P0 or repeated P1 drift reopens qualification. CONDITIONAL or MIDDLE-GROUND changes the role immediately; promotion requires targeted requalification.