# SHOWDOWN VISUAL ASSET INTELLIGENCE SYSTEM V2

Status: ACTIVE
Owner: Nik
Art director / reasoning authority: Sol
Front-end implementation worker: Luna
Canonical binary store: /Showdown Visual Asset Library/
Versioned system mirror: GitHub branch visual/asset-library-v2
Production main: untouched

## Mission

V2 turns the asset library from a folder of files into an art-direction reasoning system.

The system must answer, before any generation or implementation:

1. What is this screen trying to make the player feel?
2. What product truth must remain live DOM rather than baked art?
3. What visual references best express the intended screen culture?
4. Which existing assets already satisfy the need?
5. Which assets are visually beautiful but wrong for this screen?
6. What is actually missing?
7. Should the missing thing be generated, drawn as SVG/CSS, or built as live UI?
8. If generated, what exact identity, pose, crop, lighting, safe-zone, and reuse contract should it have?
9. Does the generated asset preserve identity and the Showdown visual family?
10. Can Luna integrate it without having to invent design decisions?
11. Has Luna actually demonstrated that her implementation role adds more value than correction burden?

## Core architecture

V2 has eight layers:

A. PRODUCT TRUTH FIREWALL
Live product source defines behavior, data, state, privacy, controls and routes.

B. SCREEN INTENT MODEL
Each screen gets a purpose, emotion, dominant object, information density, narrative beat and interaction priority.

C. VISUAL KNOWLEDGE GRAPH
Assets, identities, poses, environments, references and screens are related explicitly rather than remembered informally.

D. ASSET DEMAND PLANNER
Sol decides REUSE / RECOMPOSE / GENERATE / CSS-SVG / DOM for every visual need.

E. PROMPT COMPILER
Generation prompts are assembled from identity + role + screen intent + style DNA + safe zones + negative constraints.

F. ART-DIRECTOR CRITIC
Every generated or implemented candidate is reviewed visually before behavioral approval.

G. LEARNING LOOP
Accepted assets and lessons update the registry and screen plans so future sessions start smarter.

H. WORKER QUALIFICATION
Luna's delivered candidate is measured with hard gates, a 100-point weighted rubric, P0-P3 defect severity, correction burden, and a role decision. Luna's self-rating cannot approve her own work.

## Important boundary

Luna does NOT manage this system.

Luna receives a compiled implementation packet containing:
- exact asset IDs
- exact screen blueprint
- exact viewport rules
- exact state list
- exact forbidden substitutions
- exact output paths

Sol owns the reasoning and qualification above that interface.

## Qualification authority

For Luna role decisions, use:

- qualification/LUNA_VISUAL_QUALIFICATION_STANDARD_V1.md
- qualification/LUNA_QUALIFICATION_SCORE_SCHEMA_V1.json
- qualification/LUNA_ROLE_DECISION_POLICY_V1.md
- qualification/SV01_LUNA_QUALIFICATION_RUN_Q1.md for the current qualification run

FULL PASS keeps Luna as primary front-end builder.
CONDITIONAL PASS narrows Luna to a restricted builder role.
MIDDLE GROUND moves Luna to secondary implementation/QA.
FAIL removes Luna from primary screen construction.

## Future-session start

Every future Sol visual session should open:

1. README_START_HERE_V2.md
2. SCREEN_INTENT_GRAPH_V2.json
3. ASSET_DEMAND_MAP_V2.json
4. ASSET_REGISTRY_V2.json
5. the current screen's reference pack
6. the qualification standard when Luna is the builder

Do not ask Nik to repeat known references until the curated library and legacy archive have both been checked.
