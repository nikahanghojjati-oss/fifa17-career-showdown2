# Club Identity V2.1 — Safe Context Architecture for History, Place and Club Character

Status: PROPOSAL APPROVED DIRECTION / PRODUCTION ISOLATION REQUIRED

Date: 2026-09-10

Production authority observed at planning time: `main` `4c4975c1d3982ce6b2d8d4b37c0a6a15d94b625a`.

This is a proposal-only design and implementation contract. It changes no production HTML, CSS, JavaScript, Firebase, Firestore Rules, Authentication, Shared Journey, Candidate B/C, save schema, storage schema, provider, billing, scoring, or gameplay authority.

## Owner direction captured

Club Identity V2 should become more authentic and less generic by incorporating factual club context such as place, local character and history into the design process, while remaining an original Showdown visual system rather than a near-copy of official crests.

The system must be safe for the existing static site, Firebase Spark / zero-dollar architecture and current product authority. Badge rendering must not create new remote dependencies or add meaningful runtime infrastructure load.

## Core architecture ruling

Use a two-layer system.

### Layer A — authoring/research metadata

This layer exists only to help the designer or build process decide what an original club identity should feel like.

Recommended fields per supported club:

- canonical club name used by the game;
- city;
- broader region where useful;
- country;
- founded year where verified;
- founded-era bucket such as late-19th-century, early-20th-century or post-war;
- broad historical home-kit language such as stripes, hoops, solid field, two-tone or sash;
- broad local geography such as river, coast, port, hills, industrial corridor, capital-city grid or island context;
- broad local architectural/cultural texture where it can be abstracted safely;
- club-era competitive character expressed as generic design adjectives rather than copied slogans;
- source/provenance notes;
- explicit near-copy exclusions for any locally distinctive symbol that would make the result too close to an official mark.

This rich metadata is an authoring aid. It is not product state.

It must not be written to Firebase, Firestore, localStorage, Shared Journey records, save files, account state or provider payloads.

### Layer B — compact runtime visual descriptor

The runtime receives only a small curated descriptor derived from Layer A.

Example fields:

- `primary`;
- `secondary`;
- `accent`;
- `silhouetteFamily`;
- `outerContourVariant`;
- `fieldLayout`;
- `fieldVariant`;
- `centerDevice`;
- `centerDeviceVariant`;
- `monogramStyle`;
- `borderSystem`;
- `textureLanguage`;
- `heritageAccent`;
- `placeAccent`;
- `visualSignature`.

Do not ship research prose, source URLs, coordinates, historical essays or large per-club data objects merely to draw a 42px badge.

This split is deliberate: rich context improves art direction while the live app keeps a very small presentation-only identity contract.

## How history may influence a badge

History should shape visual language indirectly rather than reproducing official heritage marks.

Examples of safe design influence:

- older clubs may receive a more traditional shield/roundel proportion or restrained serif-like geometric monogram treatment;
- a club with a long striped home-kit tradition may receive an original stripe-based field, but with original stripe count, spacing, border and center-device composition;
- a club associated with a long industrial city history may receive abstract rivet, rail, grid or engineered-line language without copying a civic coat of arms;
- a club with a port/coastal setting may receive an abstract wave, horizon or segmented-ring rhythm without reproducing a protected ship, lighthouse or city emblem;
- a club from a hill/mountain region may receive stepped or angular geometry without tracing a local landmark;
- a club founded in a particular era may receive era-informed geometry and texture rather than literal historical seals.

Founding year can inform the authoring decision, but it does not need to be rendered as text in the badge.

## How location may influence a badge

Location is an art-direction input, not a mandate to copy civic heraldry.

Allowed source categories include broad factual geography and transformed local visual language.

Examples:

- coast -> abstract wave/ring rhythm;
- river city -> flowing divider or curved field split;
- industrial city -> grid/rivet/beam language;
- capital/metropolitan center -> structured radial/grid composition;
- island -> isolated ring/edge geometry;
- hills/mountains -> stepped angular field;
- historic masonry/brick city -> block/rib texture;
- modernist cityscape -> cleaner geometric paneling.

The resulting symbol must still be an original Showdown mark.

Do not lift a city's coat of arms, official municipal logo, monument silhouette or other distinctive protected emblem into the club badge merely because it is geographically relevant.

## Authenticity without near-copy behavior

The design target is:

`club context + factual colours + broad football language + local/history abstraction -> original Showdown identity`

The design target is not:

`official crest -> remove/alter a few elements -> call it original`.

A badge should feel appropriate for the club even when viewed by a football fan who never sees the official crest beside it.

At least three independent identity inputs should drive a curated supported-club badge where practical:

1. club-associated colour balance;
2. broad historical kit/football design language;
3. history/place-derived abstract design cue.

The designer should not rely on one highly distinctive official emblem as the recognition mechanism.

## Safe versioning

If implementation needs an explicit version, use a presentation-only renderer/version constant such as:

`CLUB_IDENTITY_RENDERER_VERSION = "2.1.0"`

This is not a save schema version.

Do not increment:

- save-library schema merely for crest appearance;
- Shared Journey schema;
- Firebase document schema;
- remote provider protocol;
- Candidate B/C schema;
- account/auth schema.

A visual renderer version may be used for tests, cache invalidation inside the in-memory identity cache or debugging only.

## Zero-billing / Firebase isolation contract

Club Identity V2.1 must be able to render with the network completely unavailable.

Hard requirements:

- zero Firestore reads for crest rendering;
- zero Firestore writes;
- zero Firebase Storage reads;
- zero Firebase Storage writes;
- zero Cloud Functions calls;
- zero Auth dependency;
- zero third-party badge API calls;
- zero external image-host dependency;
- zero per-badge analytics/telemetry requirement;
- no new paid service;
- no billing enablement;
- no remote feature flag required to choose a crest.

The only canonical input should remain the already-known club name.

If V2 cannot draw a supported identity offline from static application assets/code, the implementation is architecturally wrong.

## Recommended runtime implementation

Keep the public presentation boundary already used by production:

- `getClubIdentity(clubName)`;
- `applyClubIdentity(element, clubName)`;
- CSS custom properties for palette/crest presentation.

Preferred implementation shape:

1. curated static descriptor table for the 98 supported 2016-17 clubs;
2. deterministic SVG builder using the compact descriptor;
3. existing in-memory cache retained;
4. existing deterministic fallback retained for unknown/custom clubs;
5. no fetch/XHR/import-from-CDN path;
6. no database query.

This means the UI cost of showing a crest remains local computation plus a cached data URI, broadly similar to the current system.

## Why AI image generation is not recommended for the 98 badges

Club badges are geometry-heavy, small-scale interface assets that benefit from determinism, exact consistency, testability and tiny payloads.

Therefore the 98 production badge identities should be generated from curated SVG descriptors by code, not by an image-generation model.

GPT-5.6 Sol may research, design and author the descriptors. The badge renderer should then produce all 98 deterministically.

This avoids:

- model-to-model visual drift;
- inconsistent line weight;
- baked text errors;
- random anatomy/object artifacts irrelevant to badges;
- 98 separate raster downloads;
- hard-to-test near-duplicate images;
- unnecessary image-generation quota use.

Image generation remains appropriate for character artwork and selected cinematic art, not for this deterministic crest system.

## Safe fallback / rollback

During first production integration, preserve a V1 fallback path behind the same identity interface.

Recommended behavior:

- supported club with valid V2.1 descriptor -> V2.1 crest;
- supported club with malformed/missing descriptor -> fail the contract test before release, and optionally use V1 only in non-release/debug fallback;
- unknown/custom club -> deterministic generic fallback;
- runtime exception in V2 renderer -> safe generic crest rather than product-state failure.

The badge renderer must never block club assignment, save/load, Shared Journey or navigation.

A crest failure is a presentation degradation, not a gameplay failure.

## Performance budget philosophy

Do not optimize by adding remote infrastructure.

Instead:

- keep descriptors compact;
- build SVG only when a club identity is requested;
- cache the result in memory as production already does;
- avoid embedding research metadata in runtime payloads;
- avoid 98 raster files when equivalent vector descriptors are sufficient;
- measure actual production bundle delta before promotion;
- reject any implementation that creates a network request per crest.

The final measured cost, not an arbitrary estimate, should be recorded before production promotion.

## Source / research ledger

The authoring layer should maintain a non-runtime ledger for each club that records where factual place/history cues came from.

Minimum provenance fields:

- club;
- factual cue;
- source title/domain;
- source date/access date where useful;
- transformed design interpretation;
- why the interpretation is broad/original rather than a crest copy;
- excluded official-mark elements.

Prefer authoritative club history pages, league/association records, reputable historical sources and municipal/geographic sources for factual context.

The runtime build must not need those sources to render.

## Uniqueness + near-copy review

V2.1 keeps the V2 uniqueness requirements and adds a context-origin review.

For every supported club require:

- unique normalized visual signature;
- at least two strong perceptual differentiators from same-colour neighbors;
- a documented history/place influence or a documented reason not to use one;
- no copied official wordmark;
- no traced official crest contour/internal arrangement;
- no copied city/municipal heraldry;
- no sponsor/league/EA/FIFA/FC mark;
- readable 42-48px presentation;
- deterministic output.

Contact-sheet review remains mandatory.

## Infrastructure regression proof

Add focused tests that prove presentation isolation.

Recommended checks:

### Identity contracts

- 98 supported descriptors present;
- no duplicate visual signatures;
- deterministic SVG output;
- unknown fallback deterministic;
- existing identity API preserved;
- generated SVG contains no external URL references.

### Network isolation

In a browser test, render all 98 identities while network routing is blocked or intercepted.

Assert:

- no crest-related network requests;
- no Firebase request caused by crest rendering;
- all 98 render locally.

### Storage isolation

Snapshot relevant localStorage/Firebase-facing state before and after rendering all identities.

Assert no identity rendering changes product state.

### Failure containment

Deliberately provide one invalid descriptor in a test-only fixture and prove that the fallback renders without breaking Club Assignment or navigation.

## Production integration order

1. independently resolve current `main` at implementation time;
2. freeze the V2.1 descriptor schema;
3. build authoring/research ledger outside runtime code;
4. research factual location/history cues for all supported clubs;
5. convert those cues into compact original descriptors;
6. implement deterministic SVG grammar behind existing identity API;
7. run uniqueness contracts;
8. render 98-club contact sheets;
9. review confusion groups and near-copy risk;
10. run network/storage isolation tests;
11. integrate into Club Assignment and existing identity surfaces;
12. run focused browser audit;
13. run full product regression at final integration gate;
14. retain rollback/fallback until owner approval and production proof are complete.

## Final architecture verdict

`CLUB IDENTITY V2.1: RECOMMENDED`

`HISTORY + LOCATION: AUTHORING INPUTS, NOT PRODUCT STATE`

`RUNTIME: COMPACT STATIC DESCRIPTORS + DETERMINISTIC SVG`

`BADGE AI IMAGE GENERATION: NOT RECOMMENDED`

`FIREBASE / FIRESTORE / STORAGE / AUTH DEPENDENCY: NONE`

`NETWORK DEPENDENCY: NONE`

`SAVE / SHARED JOURNEY / PROVIDER MIGRATION: NONE`

`ZERO-DOLLAR RULE: PRESERVED`

`OFFICIAL CREST COPYING: OUT OF SCOPE / PROHIBITED BY DESIGN CONTRACT`
