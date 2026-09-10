# R8 Character Pose Library Plan — Six-Pose Target Per Manager

Status: ACTIVE OWNER-DIRECTED ASSET CONTRACT — PRODUCT-FIT GATE + ONE-ASSET-AT-A-TIME GENERATION / APPROVAL OPEN

Owner direction captured and reconciled 2026-09-10.

The character system exists to support the real product, not to create disconnected promotional art.

Core invariants:

- Manager 1 = Daniel;
- Manager 2 = Nik;
- characters remain stylized AI characters closely resembling Nik and Daniel, never raw photographs;
- A01/A02 are immutable identity anchors;
- final pose assets are generated one at a time at useful resolution;
- no multi-pose generation sheet becomes final authority;
- character art is optional on information-heavy or utility pages;
- no character pose may create Firebase, storage, scoring, Shared Journey, provider or synchronization state;
- every pose must fit an actual live product surface before generation is justified.

## 1. Immutable identity anchors

### A01 — Nik core thinking hero

Stable ID: `A01_NIK_CORE_THINKING_HERO`

SHA-256: `17972b8afb73b90483c8f874c4bd964ac1bda196daa76e134a6030676bbd4219`

Role: Nik identity authority + Home wide hero source.

### A02 — Daniel core pointing hero

Stable ID: `A02_DANIEL_CORE_POINTING_HERO`

SHA-256: `9b1545b52a5d96a240c92b9901dcd8a4558148dde05a0331882df7bd988177cc`

Role: Daniel identity authority + Home wide hero source.

A01/A02 must never be regenerated, silently replaced or recompressed as part of variant production.

## 2. Identity reference hierarchy

For every new role, use one manager identity lane only.

Primary references:

- accepted stylized AI identity anchor / strongest owner-liked stylized rendering for that manager.

Secondary references:

- a minimal subset of real photographs may be used only to check stable facial geometry such as eye spacing, brow shape, nose, jaw, hairline and facial-hair pattern.

Style references:

- wide promotional compositions may inform lighting, silhouette language and black/charcoal/gold atmosphere, but do not become competing face authorities.

Never pass Daniel identity material into a Nik generation or Nik identity material into a Daniel generation.

Reference uploads never trigger generation by themselves. The GPT reasoning/orchestration layer must first define the exact role, screen use, safe zone and acceptance gate.

## 3. Product-fit gate — required before image generation

Before generating or editing any A03-A12 role, inspect the actual current product surface where the asset is intended to appear.

The role must answer all of these questions first:

1. Which exact live screen or state uses this pose?
2. What DOM element remains the interaction/content authority?
3. Where can the character exist without obscuring controls or live text?
4. Does the pose imply a physical object or action that the product cannot actually support?
5. Can the pose disappear cleanly at smaller breakpoints?
6. Is a dedicated new pose genuinely better than reusing an existing accepted pose?

If any answer is unresolved, do not generate yet.

A visually attractive image that fails product fit is rejected before asset promotion.

## 4. Six-role target

The role library remains six roles per manager, but each role is implementation-aware.

### Nik

1. `A01_NIK_CORE_THINKING_HERO`
   Existing frozen authority. Strategic/thinking Home hero.

2. `A03_NIK_CONFIDENT_PRESENTATION`
   Calm, confident, direct presentation. Intended for Dashboard/Create Showdown support only where safe.

3. `A05_NIK_CLUB_PACK_OPENING`
   Legacy stable ID retained, but semantic role is now CLUB ASSIGNMENT PRESENTATION.
   Nik may gesture toward, frame or appear to grip the outer edge of the live DOM pack stage on wide desktop.
   Nik never owns a self-contained raster pack whose contents reveal the club.

4. `A07_NIK_FOCUSED_DETERMINED`
   Restrained competitive focus for League Wheel, Transfer Challenge or season-build tension where the real controls remain dominant.

5. `A09_NIK_VICTORY_CELEBRATION`
   Believable happy/victory response derived only from already-authoritative outcomes.

6. `A11_NIK_SETBACK_REACTION`
   Natural reflective disappointment; presentation-only state derived from authoritative outcomes.

### Daniel

1. `A02_DANIEL_CORE_POINTING_HERO`
   Existing frozen authority. Challenger/Home hero.

2. `A04_DANIEL_CONFIDENT_PRESENTATION`
   Composed/confident stable silhouette, preferably distinct from Nik A03.

3. `A06_DANIEL_CLUB_PACK_OPENING`
   Legacy stable ID retained, semantic role CLUB ASSIGNMENT PRESENTATION.
   Daniel may gesture toward, frame or appear to grip the decorative outer edge around the live DOM pack stage.
   Daniel never owns a self-contained raster pack whose contents reveal the club.

4. `A08_DANIEL_FOCUSED_DETERMINED`
   Competitive focus/determined response.

5. `A10_DANIEL_VICTORY_CELEBRATION`
   Natural happy/victory response with a silhouette distinct from Nik.

6. `A12_DANIEL_SETBACK_REACTION`
   Believable reflective setback, not humiliation or slapstick.

## 5. Club Assignment special contract for A05/A06

The live website already owns the Club Assignment object through real `.clubPackStage`, `.clubPackDoor` and `.clubCardFace` DOM.

Therefore A05/A06 are supporting character assets only.

Allowed:

- character flank adjacent to own pack;
- open-hand presentation toward own pack;
- hands visually approaching decorative pack edges;
- advanced wide-desktop illusion where hands appear to grip the outer frame while the real DOM pack remains centered in a safe aperture;
- warm gold edge light that visually connects character and pack stage.

Not allowed:

- generated club result inside character artwork;
- raster pack that replaces the real DOM pack;
- baked manager name, club name, pack state or reveal copy;
- club appearing to emerge from a manager's hand;
- character art covering interactive or semantic DOM content;
- character art changing the reveal timing or state machine.

The owner-provided pack-holding references are useful pose/composition evidence, not implementation authority.

The earlier generated glowing mystery-box A05/A06 attempts are rejected for final use because they create a second false pack object. Their face-quality lessons may inform identity QA only.

Preferred implementation order:

1. prove character-free live pack stage;
2. prove Mode A flank presentation;
3. only then evaluate Mode B held-live-pack illusion with layered DOM/raster compositing;
4. if Mode B becomes brittle, Mode A remains canonical.

## 6. Character visual contract

Every new candidate must:

- preserve recognizable face proportions, hair, facial-hair pattern, skin rendering and age read;
- stay visibly stylized/illustrated rather than becoming a raw photo cutout;
- remain within the R8 black/charcoal/gold formal wardrobe family unless a screen contract proves otherwise;
- have clean high-resolution edges suitable for compositing;
- avoid malformed hands, duplicated limbs, floating props or impossible anatomy;
- contain no baked UI copy, club crest, league logo, EA/FIFA logo or proprietary trophy shape;
- use transparent or cleanly maskable background;
- pass side-by-side identity QA against A01/A02 or the strongest accepted manager identity reference.

Face resemblance is evaluated before pose polish.

## 7. One-asset-at-a-time protocol

For each A03-A12 role:

1. resolve the current live product surface;
2. pass the product-fit gate;
3. select exactly one manager and one role;
4. isolate that manager's identity reference lane;
5. define body language, safe zone, wardrobe, crop and background;
6. generate or edit exactly one candidate;
7. inspect face resemblance first;
8. reject immediately if identity falls materially below the accepted family;
9. inspect hair, beard, age read and skin style;
10. inspect hands, arms, shoulders and any prop geometry;
11. inspect whether the pose still fits the real DOM use case;
12. retain/isolate only after all gates pass;
13. record provenance, dimensions and hash;
14. then move to the next role.

If a role fails, retry only that role.

The final contact sheet is assembled from independently accepted candidate assets and is never itself a generation source.

## 8. Dynamic victory/setback use

Victory and setback variants are presentation-only selections.

Do not add `characterMood`, `winnerPose`, `loserPose` or any equivalent Firebase/local-storage field.

Selection derives from existing authoritative outcome data:

- winner may receive victory variant;
- loser may receive setback variant;
- draw uses neutral/confident/focused variants;
- unresolved outcome never displays victory/setback art;
- information density can suppress character art entirely.

No presentation choice writes back into canonical saves or provider state.

## 9. Recommended page distribution

| Surface | Preferred role | Policy |
| --- | --- | --- |
| Home wide | A02 Daniel + A01 Nik | REQUIRED wide composition; omit <=1179px |
| Create Showdown | A03/A04 | OPTIONAL |
| League Wheel | A07/A08 | OPTIONAL; wheel is hero |
| Club Assignment | A05/A06 | OPTIONAL wide presentation only; live pack DOM is hero |
| Showdown Dashboard | A03/A04 or A07/A08 | OPTIONAL |
| Transfer Challenge | A07/A08 | OPTIONAL; controls/privacy/timer win |
| Season Results Entry | none by default | OMIT unless proven safe |
| Season Summary | A09/A10 + A11/A12 or neutral draw | PREFERRED wide when outcome authoritative |
| Rivalry Statistics | none/small neutral crop | usually OMIT |
| Career Statistics | none/small neutral crop | usually OMIT |
| Trophy Room | A09/A10 optional | OPTIONAL |
| Legacy | neutral/reflective optional | OPTIONAL |
| Rule Book / Settings / Save / Connected / Restore | none | OMIT |

No screen receives character art merely to fill empty space.

## 10. Approval workflow

Internal visual quality is not owner finality.

For each accepted internal candidate:

- record dimensions/hash/provenance;
- composite only into the screen(s) allowed by this plan;
- perform responsive and state QA;
- include the asset in the final character contact sheet only after internal acceptance;
- obtain explicit owner approval before marking it final.

The complete visual proposal remains non-final until Nik explicitly approves the required final screenshot/contact-sheet/media package.

## 11. Current execution status

Verified immutable:

- A01 Nik;
- A02 Daniel.

Internally promising identity work:

- A03 Nik confident presentation direction has reached good resemblance but still requires formal internal QA/provenance before final candidate status;
- A04 Daniel confident presentation direction has reached good resemblance but still requires formal internal QA/provenance before final candidate status.

Club Assignment correction:

- recovered and newly generated literal pack-holding images are reference/identity evidence only;
- they are not final A05/A06 implementation assets;
- A05/A06 must be redesigned around the real DOM pack safe-zone before another render.

Still open:

- formal A03/A04 QA and packaging decision;
- A05/A06 implementation-aware redesign after DOM composition proof;
- A07-A12 production one role at a time;
- contact sheet;
- responsive/state screenshots;
- Audius real-device proof;
- owner approval.
