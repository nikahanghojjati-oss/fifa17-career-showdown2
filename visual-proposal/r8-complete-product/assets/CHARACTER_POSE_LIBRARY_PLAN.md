# R8 Character Pose Library Plan — Six-Pose Target Per Manager

Status: ACTIVE OWNER-DIRECTED ASSET CONTRACT — GENERATION / ISOLATION / APPROVAL OPEN

Owner direction captured 2026-09-10:

- character art is optional on information-dense or utility pages;
- repeated reuse of only A01/A02 across the product is not acceptable;
- target at least four to five distinct high-quality expressions/poses per manager;
- a sixth natural setback/losing pose is desirable when it can remain believable and identity-consistent;
- the characters must remain stylized AI characters that closely resemble Nik and Daniel, not raw photographs;
- Manager 1 = Daniel; Manager 2 = Nik;
- character presentation must not change Firebase, Spark, storage, scoring, shared-state, provider or synchronization authority.

## 1. Recovered character evidence

The visual Library contains a prior R8.5/R8.6 character reference sheet with the approved identity direction and these visible expression/pose families:

Daniel expression references:

- neutral;
- confident;
- smirk;
- thinking;
- happy;
- determined.

Daniel pose references:

- pointing;
- arms crossed;
- open hands;
- side look;
- looking down;
- back view.

Nik expression references:

- neutral;
- confident;
- thinking;
- slight smile;
- determined;
- happy.

Nik pose references:

- thinking;
- arms crossed;
- pointing;
- open hands;
- side look;
- back view.

Recovered source:

`CANDIDATE_R8_6_EXPRESSION_REFINEMENT_01.png`

This sheet is a design/identity reference, not a substitute for final isolated high-resolution assets.

Recovered pack-opening references also exist:

- `C01_NIK_CLUB_PACK_HOLDING_OWNER_LIKED_CANDIDATE_V1.png` — owner-liked Nik pack-holding candidate;
- `CLUB_PACK_HOLDING_OWNER_LIKED_COMPOSITE_REFERENCE_R8_19.jpeg` — two-manager pack-holding composition reference;
- `REF_08_CLUB_ASSIGNMENT.png` and `REF_02_CLUB_PACK_FORMAL.jpeg` — composition/pose references for Club Assignment.

The proposal must not falsely promote those references to final isolated authorities without an explicit per-asset QA/approval record.

## 2. Immutable identity anchors

### A01 — Nik core thinking hero

`A01_NIK_CORE_THINKING_HERO`

SHA-256:

`17972b8afb73b90483c8f874c4bd964ac1bda196daa76e134a6030676bbd4219`

Role: identity anchor + Home wide hero source.

### A02 — Daniel core pointing hero

`A02_DANIEL_CORE_POINTING_HERO`

SHA-256:

`9b1545b52a5d96a240c92b9901dcd8a4558148dde05a0331882df7bd988177cc`

Role: identity anchor + Home wide hero source.

A01/A02 remain immutable. New variants are separate assets; they never overwrite or silently replace the anchors.

## 3. Final six-pose target

The pose library is role-based rather than “one face everywhere.” Each final asset must preserve the approved face geometry, hair, age read, wardrobe family and overall R8 illustration style while changing body language naturally.

### Nik

1. `A01_NIK_CORE_THINKING_HERO` — strategic/thinking hero — EXISTING FROZEN AUTHORITY.
2. `A03_NIK_CONFIDENT_PRESENTATION` — confident, calm, direct presentation; suitable for dashboard/setup support.
3. `A05_NIK_CLUB_PACK_OPENING` — dynamic pack-holding/opening anticipation; based on recovered owner-liked C01 direction, but rebuilt/isolation-QA'd at final quality if necessary.
4. `A07_NIK_FOCUSED_DETERMINED` — competitive focus, restrained intensity; suitable for wheel/transfer/season-build tension when art is justified.
5. `A09_NIK_VICTORY_CELEBRATION` — believable happy/victory response, energetic but not exaggerated or meme-like.
6. `A11_NIK_SETBACK_REACTION` — natural losing/setback reaction: disappointed/reflective rather than theatrical despair; shoulders/body language carry most of the emotion.

### Daniel

1. `A02_DANIEL_CORE_POINTING_HERO` — challenger/pointing hero — EXISTING FROZEN AUTHORITY.
2. `A04_DANIEL_CONFIDENT_PRESENTATION` — composed/confident pose; preferably arms-crossed or similarly stable silhouette.
3. `A06_DANIEL_CLUB_PACK_OPENING` — dynamic pack-holding/opening anticipation matching A05's visual family without mirroring the exact body pose.
4. `A08_DANIEL_FOCUSED_DETERMINED` — competitive focus/determined response.
5. `A10_DANIEL_VICTORY_CELEBRATION` — natural happy/victory response distinct from Nik's silhouette.
6. `A12_DANIEL_SETBACK_REACTION` — believable disappointment/reflective setback pose, not humiliation or slapstick.

## 4. Identity-generation contract

Every new character variant must:

- use the approved stylized AI character identity as the primary visual reference;
- preserve recognizable face proportions, hair, beard/facial-hair pattern, skin rendering and age read;
- stay visibly illustrated/stylized rather than turning into a raw photographic portrait;
- maintain consistent black formal/career-mode wardrobe unless the screen contract proves another outfit is required;
- use clean high-resolution edges suitable for transparent-background compositing;
- avoid malformed hands, duplicated limbs, floating props, mirrored text, impossible anatomy or congested facial geometry;
- contain no baked UI copy, club crest, league logo, EA/FIFA logo or proprietary trophy shape;
- keep pack props generic/original and text-free in the isolated master;
- provide transparent or cleanly maskable background for final isolated assets;
- pass side-by-side identity QA against A01/A02 before owner review.

Raw user photographs may inform resemblance only through the already-approved identity development process. The final production asset is the AI character, not the photograph.

## 5. Dynamic outcome use without infrastructure change

The victory/setback variants are presentation-only selections.

Do not add a Firestore field such as `characterMood`, `winnerPose`, `loserPose` or any new synchronization state.

The UI derives the presentation from already-authoritative outcome data:

- if manager A is the authoritative winner, manager A may use the victory variant and manager B may use the setback variant;
- if the authoritative result is a draw, use neutral/confident/focused variants for both;
- if outcome authority is pending/unresolved, never display victory or setback art;
- if a page is information-dense or the art would crowd controls, omit characters even when an outcome exists.

This selection is deterministic presentation logic only. It must not write back to canonical saves or provider state.

## 6. Recommended page distribution

Characters are deliberately sparse.

| Surface | Preferred pose role | Character requirement |
| --- | --- | --- |
| Home wide | A02 Daniel hero + A01 Nik hero | REQUIRED on wide final composition; omitted <=1179 |
| Create Showdown | confident/presentation optional | OPTIONAL; default may remain character-free |
| League Wheel | focused/determined optional | OPTIONAL; wheel remains hero |
| Club Assignment | A05/A06 pack-opening | PREFERRED where safe; pack UI remains interaction authority |
| Showdown Dashboard | confident/focused | OPTIONAL; score/history remains hero |
| Transfer Challenge | focused/determined | OPTIONAL; privacy/timer/input density has priority |
| Season Results Entry | none by default | OMIT unless final layout proves safe |
| Season Summary | victory/setback or neutral draw | PREFERRED on wide when outcome is authoritative |
| Rivalry Statistics | none or small neutral crop | OPTIONAL / usually omit |
| Career Statistics | none or small neutral crop | OPTIONAL / usually omit |
| Trophy Room | victory/happy optional | OPTIONAL; cabinet/trophies remain hero |
| Legacy | neutral/reflective optional | OPTIONAL; archive readability first |
| Rule Book / Settings / Save / Connected / Restore | none | OMIT |

No page gets character art merely to fill empty space.

## 7. Generation and approval workflow

For each planned A03–A12 asset:

1. choose one exact role from this matrix;
2. use the correct approved manager identity reference;
3. generate one bounded candidate family, not random whole-page art;
4. reject identity drift before composition;
5. reject anatomy/hand/prop defects;
6. isolate the selected transparent character master;
7. record dimensions, hash and provenance in `ASSET_MANIFEST.json`;
8. composite only on the pages listed here where safe;
9. capture character QA sheet and affected page screenshots;
10. obtain explicit owner approval before marking the asset final.

A candidate can be visually strong and still be rejected if resemblance is weaker than A01/A02.

## 8. Current execution status

Existing immutable assets:

- A01 Nik hero — verified;
- A02 Daniel hero — verified.

Recovered prior references:

- expression/pose sheet — verified as reference;
- Nik pack-holding owner-liked candidate — recovered;
- two-manager pack-opening composition references — recovered.

Still open:

- isolate or generate final high-resolution A03–A12 assets;
- per-asset identity/anatomy QA;
- character contact-sheet review;
- page-level composition QA;
- owner approval.

The R8 proposal is not character-complete until at least five distinct approved roles per manager exist; target is six per manager including the natural setback role.
