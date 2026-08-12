# Career Mode Showdown v1.1.3 — Official Pre-Merge Candidate

This file freezes the handoff-inclusive v1.1.3 candidate after the complete diagnostic cycle. Once this commit is created, **no further repository edits are permitted on the candidate during official proof**. Any required correction invalidates the freeze and requires a new handoff-inclusive candidate SHA plus fresh proof.

## Owner-requested maintenance scope

v1.1.3 contains exactly the owner-priority maintenance work requested before Candidate C:

1. Fix the League Wheel post-selection same-league visual reroll.
2. Replace James Rodríguez, Marcus Rashford and Anthony Martial with stronger licensed source photographs; never reuse the previously rejected James images.
3. Prefer high-quality, photogenic, dramatic/historic football moments rather than flat interview imagery.
4. Add at least seven additional football photographs to appropriate screens with controlled FIFA-17-inspired UI/UX placement.
5. Preserve all protected gameplay, scoring, persistence, loading-screen and Candidate A/B behavior.

## Frozen product behavior

### League Wheel

The settled wheel is now race-safe:

- CSS transform transition is armed only for an explicit live spin;
- cancel/stale-operation paths disarm the transition;
- after the selected league is persisted, transition is disarmed before the wheel transform is normalized to the mathematically equivalent selected angle;
- the selected league remains confirmation-pending until the user explicitly continues;
- no random-selection or gameplay semantic changed.

This prevents the browser from interpreting post-spin normalization as a second visual rotation to the same selected league.

### Licensed football visual system

Active v1.1.3 licensed derivatives include:

- Create Showdown — James Rodríguez, 2014 FIFA World Cup action/historic source;
- Transfer Challenge — Marcus Rashford, Manchester United vs Chelsea, April 2017;
- Transfer Challenge — Anthony Martial, Manchester United / Champions League 2017 source;
- League Wheel — Cristiano Ronaldo, Euro 2016;
- Club Assignment — Paul Pogba, Manchester United 2016;
- Showdown Home — Zlatan Ibrahimović, Manchester United 2016;
- Season Results — Antoine Griezmann, Champions League 2016;
- Season Summary — Neymar, Rio 2016 Olympic gold final;
- Legacy — Radamel Falcao, 2012 Europa League title celebration;
- Rule Book — Mario Balotelli, Euro 2012 semi-final celebration;
- Career Statistics — protected Lionel Messi derivative;
- Trophy Room — protected Philipp Lahm derivative.

All active football photos are local reproducible derivatives with source/license/provenance metadata. Route-specific visual ownership remains lazy; the football-photo archive does not preload on Home.

The rejected prior James/Rashford/Martial derivatives required by the permanent forbidden-archive validator are absent. The previously rejected James source is not reused.

## Responsive visual proof before freeze

The permanent Licensed Football Visuals gate captured and passed 44 route/viewport screenshots on the final diagnostic head: 11 destination screens across desktop, compact desktop, reduced-motion windowed, and mobile DPR2.

Manual review also found the final compositions acceptable before freeze:

- James reads as a strong historic action image without destructive crop;
- Rashford and Martial retain strong subject prominence without collision with protected copy;
- seven additional screen bands remain subordinate to task content instead of turning the interface into a photo collage;
- mobile DPR2 remains controlled and readable;
- reduced-motion images have no active CSS transition.

## Performance protection

Protected startup ceilings remain unchanged:

- raw eager assets <= 165,000 bytes;
- gzip eager assets <= 37,500 bytes.

The final guarded measurement before freeze is:

- **164,965 raw bytes**;
- **37,006 gzip bytes**.

No threshold was raised.

## Candidate A / Candidate B protection

- Candidate A remains backup format/version 1 with the same checksum and non-mutating export ownership; only its v1.1.3 application provenance fallback was aligned from 1.1.2 to 1.1.3.
- Candidate B remains strictly read-only analysis/migration preview with zero canonical localStorage writes/removals.
- `js/storage.js` remains the sole persistence authority.
- Exactly three canonical storage keys remain protected.

## Diagnostic matrix — COMPLETE 13/13 GREEN

Diagnostic head immediately before this freeze:

`ace5ad1d6bb32ee6c36d8fd35121673f8be139aa`

Permanent family results on that exact head:

1. Final Polish — `31558968377` — SUCCESS
2. Static App — `31558968500` — SUCCESS
3. Transfer Workstream — `31558968394` — SUCCESS
4. Settings Workstream — `31558968290` — SUCCESS
5. League Confirmation — `31558968356` — SUCCESS
6. V1 Visual Immersion — `31558968507` — SUCCESS
7. Home Bootstrap — `31558968252` — SUCCESS
8. Statistics Workstream — `31558968373` — SUCCESS
9. Season Review — `31558968444` — SUCCESS
10. Candidate B Import Analysis — `31558968400` — SUCCESS
11. Licensed Football Visuals — `31558968457` — SUCCESS
    - contracts `93997128977` — SUCCESS
    - responsive browser `93997129057` — SUCCESS
12. v1.1.3 Release Burn-In — `31558968337` — SUCCESS
    - pass 1 `93997118664` — SUCCESS
    - pass 2 `93997118593` — SUCCESS
    - pass 3 `93997118587` — SUCCESS
    - pass 4 `93997118604` — SUCCESS
    - pass 5 `93997118625` — SUCCESS
13. Stability Lane — `31558968309` — SUCCESS
    - contracts `93997125177` — SUCCESS
    - two consecutive complete Chromium cycles `93997174301` — SUCCESS
    - deployed-site smoke skipped as expected on pre-merge PR head.

## Diagnostic failures remain excluded from release proof

All earlier PR failures, false-positive diagnostics and guarded-helper failures are preserved in the active handoff + Diagnostic Log + Addenda 1–5. None is counted as official proof. No failing threshold or contradictory assertion was hidden or weakened.

## Official proof rule

The commit produced by adding this file is the **frozen official v1.1.3 pre-merge candidate SHA**.

Required before merge:

1. official pre-merge pass 1: every one of the 13 permanent families must be green on this exact frozen SHA;
2. official pre-merge pass 2: every family/job must be independently rerun and green on the **same exact frozen SHA**;
3. manually review official screenshot evidence;
4. merge only with expected-head protection against this exact frozen SHA.

Any file edit after this freeze invalidates the candidate and restarts both official passes.

After merge, production must receive the same full 13-family matrix twice on the immutable runtime merge SHA, including the deployed-site Stability smoke.