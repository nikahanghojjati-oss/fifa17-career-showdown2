# Club Identity V2.1 — Aggregate Validation + Contact Sheet R1

Status: 98/98 TECHNICAL CATALOG PASS / VISUAL PERCEPTUAL REFINEMENT OPEN / NOT PRODUCTION / NOT OWNER-FINAL

Date: 2026-09-10

## Scope

This is proposal-only authoring evidence. It does not modify production `js/visualIdentity.js`, Firebase, Firestore, Storage, Auth, Shared Journey, saves, provider boundaries, billing, or the Club Assignment reveal authority.

## Aggregate catalog state

Five descriptor drafts exist and were loaded together:

- Premier League: 20 clubs;
- LaLiga: 20 clubs;
- Bundesliga: 18 clubs;
- Serie A: 20 clubs;
- Ligue 1: 20 clubs.

Aggregate: 98 supported 2016-17 clubs.

The authoring inventory now records 98/98 research complete and 98/98 descriptor draft complete.

## Aggregate validator execution

A browser-executed equivalent of the repository aggregate validator loaded the current runtime descriptor contract, authoring inventory, and all five descriptor catalogs from the proposal branch.

Observed result:

`PASS · 98 CLUBS · 98 UNIQUE NORMALIZED SIGNATURES`

Per-league results:

- Premier League 2016-17: 20 · PASS;
- LaLiga 2016-17: 20 · PASS;
- Bundesliga 2016-17: 18 · PASS;
- Serie A 2016-17: 20 · PASS;
- Ligue 1 2016-17: 20 · PASS.

Aggregate safety result:

- network required: FALSE;
- Firebase required: FALSE;
- persisted: FALSE;
- forbidden authoring fields in runtime descriptors: NONE DETECTED;
- aggregate unique normalized visual signatures: 98.

The repository validator was also upgraded so its normal implementation-time mode aggregates the same five catalogs and fails on missing/unexpected clubs, duplicate clubs, duplicate normalized signatures, unsupported enum values, malformed colors, leaked authoring/runtime fields, and external/data resource references.

## Deterministic renderer execution

`assets/club-identity-v2-1-renderer.reference.js` was used to render all 98 descriptor drafts.

The renderer is original deterministic SVG grammar. It consumes only the compact descriptor + club name. It contains no remote image lookup and no official club crest assets.

The first contact sheet rendered every club at:

- large authoring scale around 84-92px wide;
- representative 42-48px UI scale;
- representative 34-38px compact/confirmation scale.

Authoring render asset id:

`01a08dbb-201a-79fd-9891-2d17a376e091`

Aggregate validator proof asset id:

`01a08dbc-1a7a-7396-baa8-6a723768f10b`

These external-render ids are transient authoring evidence only. They are not production dependencies and must not be referenced by runtime code.

## What R1 proved

R1 establishes that:

1. a complete 98-club descriptor catalog is structurally possible;
2. the five league catalogs can be loaded and rendered as one deterministic system;
3. every club currently has a unique normalized descriptor signature;
4. small-scale SVG output remains legible enough for a real perceptual QA pass;
5. the system does not need Firebase, network badge APIs, raster badge generation or persistence;
6. research/history/place richness can remain entirely outside runtime while still influencing compact design choices.

## What R1 did not prove

R1 does not prove that all 98 crests are visually final or legally risk-free.

A unique descriptor string is not sufficient if two marks still feel interchangeable or if a new original mark accidentally lands too close to the broad composition family of the real club crest.

Owner approval is still open.

## Perceptual R1 observations

The system is substantially more differentiated than the current production 5-shape / 6-pattern / 7-motif hash grammar, but several marks deserve a deliberate R2 safety/art-direction pass.

Priority review group:

- Athletic Club: red/white striped tall-shield presentation is too close to the broad official crest family despite using an original center device. Move farther toward Nervión/industrial/river abstraction and away from official shield + stripe composition.
- Bayern Munich: oval/round visual family plus familiar red/blue/white risks reading too close to the broad official roundel family. Move to a clearly non-round silhouette.
- Inter Milan: blue/black + roundel + monogram is unnecessarily close to the broad official circular-monogram family. Keep night/sky and international/metropolitan cues but use a clearly different silhouette and reduce monogram dependence.
- Napoli: sky-blue roundel/monogram language is unnecessarily close to the club's broad circular-letter identity family. Keep Naples/port/wave/lineage cues but move to a non-round silhouette.
- Nice: red/black vertical shield composition is too close to the broad official striped-shield family. Keep Riviera/coast cues but change dominant field/silhouette.
- Paris Saint-Germain: navy/red/light roundel plus initials risks unnecessary proximity to the broad official roundel/initial identity family. Keep modern 1970 dual-origin/capital cues but use a non-round composition and no initials as the primary device.
- Sporting Gijón: red/white striped shield-family treatment should move farther from the broad official striped-shield grammar.

Secondary watch group for R2 comparison:

- Bologna;
- Eintracht Frankfurt;
- Freiburg;
- 1. FC Köln;
- Nancy;
- Genoa;
- Milan;
- Sampdoria.

These are not declared failures. They require side-by-side authoring review because silhouette + palette + monogram can sometimes create familiarity even without copied devices.

## R2 design rule

For a club whose official identity is strongly associated with a roundel, shield+stripes, letter-in-circle, or other broad composition family, V2.1 should deliberately select a different outer silhouette or dominant field construction unless there is a strong independent reason not to.

Recognition should come from several independent cues:

`club-associated color + history/place abstraction + kit rhythm + original geometry + live club name`

not from recreating the official crest's overall layout without its central icon.

## External/free asset policy after R1

No third-party asset is required for the 98 badges.

Original SVG abstraction from factual history/place context is preferred because it is deterministic, light and easy to audit.

If later presentation work finds a genuinely useful public-domain/free place texture, architectural photograph, map fragment or similar asset, it must pass an explicit per-asset license/provenance gate and be packaged locally. Runtime hotlinking remains prohibited. An uncertain license means the asset is not used.

Founding years and historical facts may guide authoring. They are not copyright-protected facts in the abstract, but V2.1 intentionally avoids relying on printed years as recognition shortcuts where club lineage is complex or where the year would make the mark unnecessarily resemble official merchandise.

## Renderer-budget state

The external HTML renderer was used for one consolidated 98-club contact sheet and one aggregate validation proof. The connected tool subsequently reported the included image allowance exhausted and overages disabled.

Do not attempt paid/overage rendering. Continue through local/Playwright/self-contained proposal proof or defer the next external render until the allowance resets.

## Next exact actions

1. create R2 descriptor overrides for the priority perceptual-risk group;
2. keep all history/location/source material authoring-only;
3. consolidate the final 98 descriptors only after R2 review;
4. run the repository aggregate validator in a local/implementation-capable checkout;
5. produce the next contact sheet through local Playwright rather than a paid renderer;
6. only after perceptual uniqueness and owner approval consider Club Identity V2.1 ready for production handoff.
