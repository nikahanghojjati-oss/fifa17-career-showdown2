# A03 Reference Isolation + First Generation Rejection

Status: FIRST GENERATED A03 ATTEMPT REJECTED — REFERENCE ISOLATION CONTRACT ACTIVE

Date: 2026-09-10

Scope: proposal-only visual evidence. This file creates no production runtime, Firebase, storage, scoring, sync or provider authority.

## Decision

The first successor-session generation intended for `A03_NIK_CONFIDENT_PRESENTATION` is REJECTED.

It is not:

- A03;
- an internal candidate;
- an approved character master;
- eligible for the final contact sheet;
- eligible for page composition;
- eligible for `ASSET_MANIFEST.json` promotion.

The body silhouette/stride was potentially usable as pose-language evidence, but the face-resemblance gate failed first. Under the active Character Pose Library contract, that is sufficient for immediate rejection.

No generated binary from this failed attempt is committed to the proposal.

## Failure analysis

The failure was caused by orchestration/reference selection, not by a change to the owner-approved character direction.

The generation request mixed too many semantically different references in one call:

1. a wide two-manager presentation/style composition;
2. a Nik stylized AI close portrait;
3. a Daniel stylized AI close portrait;
4. multiple private real-photo resemblance references for Nik;
5. multiple private real-photo resemblance references for Daniel.

That bundle violated the spirit of the existing one-manager/one-role protocol. It asked the image model to infer which faces were identity authority, which were secondary resemblance checks, and which belonged only to the other manager. The output therefore drifted toward a generic blended male face instead of remaining recognizably within Nik's approved AI identity family.

The error was upstream of generation: the main reasoning/orchestration layer should have reduced the reference set before invoking image generation.

## Driver-seat rule

For all remaining A03-A12 character production, the main GPT reasoning layer owns:

- exact role selection;
- exact manager selection;
- reference hierarchy;
- pose/body-language definition;
- wardrobe rules;
- crop/resolution/background rules;
- pre-generation acceptance criteria;
- post-generation face-first QA;
- reject/retry/promote decision.

Image generation is an execution component only. It does not decide the asset role, identity hierarchy, product placement or acceptance status.

A user upload that supplies reference material is not, by itself, authorization to skip the reasoning/QA stage and immediately generate.

## Privacy boundary

Private real photographs supplied for resemblance study are QA/reference inputs only.

Do not:

- commit those photographs to this public repository;
- copy social-media screenshots into proposal assets;
- expose their private filenames, local paths or metadata in public evidence;
- use a raw photograph as final character art.

Final character assets remain stylized AI characters.

## A03 reference hierarchy

Role: `A03_NIK_CONFIDENT_PRESENTATION`.

For the next A03 attempt:

### Tier 1 — Nik stylized identity

Use only Nik's strongest approved/owner-liked stylized AI identity material as the primary face target.

Current-conversation priority:

- clean Nik AI close portrait in black formal wardrobe: primary resemblance guide;
- existing frozen A01 authority: immutable comparison target and preferred identity anchor whenever available to the generation workflow.

### Tier 2 — Nik real-photo geometry checks

Use a minimal subset of clear Nik photographs only as secondary constraints for stable facial geometry: eye spacing, brow shape, nose proportions, jaw width, hairline and beard pattern.

They must not control rendering style, clothing or background.

Do not pass every available real photograph simply because it exists.

### Tier 3 — style/body-language reference

The wide black/gold walking composition may guide:

- premium R8 lighting;
- confident manager energy;
- body posture/stride language;
- black/charcoal/gold presentation tone.

It is not the primary face source.

### Excluded from A03 generation

Exclude all Daniel references from the A03 generation call.

Daniel material remains reserved for Daniel roles A04/A06/A08/A10/A12.

## A03 role lock before retry

The next A03 candidate must be a calm confident presentation asset, not another generic poster hero.

Required presentation:

- Nik only;
- recognizable Nik face before all other criteria;
- composed/confident expression rather than smirk-heavy fashion-model expression;
- formal black/charcoal Career Mode wardrobe consistent with R8;
- clean stable silhouette suitable for dashboard/setup support;
- confident presentation body language; stride is allowed only if it still reads as a reusable presentation pose rather than duplicating the Home hero;
- full useful resolution;
- isolated/transparent or cleanly maskable background;
- no baked UI copy;
- no EA/FIFA/league/club logo;
- no generated proprietary-looking crest;
- believable hands/anatomy.

## Face-first acceptance gate

Before judging lighting, wardrobe or pose, compare the generated face against Nik's primary stylized reference and frozen A01 identity family.

Reject if any of these drift materially:

- overall head/face shape;
- eye spacing/eye shape;
- brow geometry;
- nose proportions;
- jaw/chin proportions;
- hairline/hair mass;
- beard/stubble pattern;
- apparent age;
- recognizable overall likeness.

A visually polished or anatomically strong body cannot rescue a failed identity gate.

## Retry budget

Retry only A03 until one candidate passes face-first QA.

Do not generate A04 in parallel merely to maintain momentum.

Do not create a multi-pose sheet.

Do not regenerate A01/A02.

Do not promote a failed A03 attempt to the manifest merely because generation cost/time was spent.

## Owner finality

Even a future internally accepted A03 remains an internal candidate until the owner explicitly approves it in the final character review package.

Current result:

`A03 OPEN — FIRST GENERATION REJECTED / REFERENCE ISOLATION LOCKED / NEXT ATTEMPT MUST USE NIK-ONLY IDENTITY LANE`
