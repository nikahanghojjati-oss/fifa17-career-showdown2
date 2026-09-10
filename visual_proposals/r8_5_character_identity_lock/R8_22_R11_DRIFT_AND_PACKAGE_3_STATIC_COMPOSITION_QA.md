# R8.22 r11 drift reconciliation and Package 3 static composition QA

Date: 2026-09-09
Lane: independent visual proposal
Controller: GPT-5.6 Sol reasoning
Production mutation: none
Firebase mutation: none
Billing: permanently off

## 1. Authority reconciliation

The R8.21 successor started from visual head `faf217265a21a374c8c41f529fb806e915d4832a` and expected production main `1d0c9f9d6542cd020a4aae53998cb6daeba380e4` / `1.9.1-r10`.

Before Package 3 static QA began, live main advanced by one development commit to:

- main SHA: `be5289cdbfcc8285ab8ddd33cd9fe9f1b3b7198e`
- runtime / asset revision: `1.9.1-r11`
- release change: Canonical Shared Scoring

The drift was inspected before visual implementation. It is material to Package 3 outcome presentation but bounded: Transfer Challenge, Shared Results privacy, and the pre-scoring Shared Season Commit hierarchy remain structurally valid. The new visual authority is a read-only shared canonical scoring projection on the existing season review surface.

## 2. r11 Canonical Shared Scoring visual authority

`js/productionSharedCanonicalScoring.js` adds `#sharedCanonicalScoringPanel` inside the existing `#seasonReviewPanel` only when all required runtime conditions are true.

The production presentation is eligible only when:

- the Showdown is in shared mode
- the current shared season context matches
- the Season Commit is committed and `ACKNOWLEDGED`
- the scoring projection reports `authoritative === true`
- the scoring phase is `SCORING_RECONCILED`

The adapter declares:

- `authoritativeScoring:true`
- `providerEnforcedSource:true`
- `readOnlyDerivedProjection:true`
- `canonicalStorageMutation:false`
- `billingRequired:false`
- `blazeRequired:false`
- `cloudRunRequired:false`
- `cloudFunctionsRequired:false`

It renders provider-derived Player One and Player Two totals, breakdown, and `view.winner`, where the visible result is either a draw or the mapped manager role.

### Visual consequence

R8.21's rule remains correct but now has a live shared authority source:

- before `SCORING_RECONCILED`, Shared Results and Shared Season Commit remain neutral and must not use winner / loser art
- at authoritative `SCORING_RECONCILED`, the visual layer may derive winner / loser / draw emphasis from `view.winner`
- this is presentation-only; no visual state is written to Firebase or canonical storage

No new character asset is required by this drift.

## 3. Frozen-master integrity used for QA

The exact owner-frozen source files were recovered from the project Library and checked before rendering.

A01 Nik core thinking hero:

- source dimensions: `1086x1448`
- source mode: RGBA
- source SHA-256: `17972b8afb73b90483c8f874c4bd964ac1bda196daa76e134a6030676bbd4219`
- deterministic QA derivative: `543x724`
- derivative SHA-256: `b7ab81132d66e890ba298775f3580b36f0ad78ac90653bce873ae6a44822bfca`

A02 Daniel core pointing hero:

- source dimensions: `1086x1448`
- source mode: RGBA
- source SHA-256: `9b1545b52a5d96a240c92b9901dcd8a4558148dde05a0331882df7bd988177cc`
- deterministic QA derivative: `543x724`
- derivative SHA-256: `2b2fbe5617abb7038aed5cd4c2999f52415f70ff7df6399108dac508e61237d3`

The QA derivatives are deterministic size reductions only. No face, hair, pose, clothing, gesture, lighting, or identity repaint was performed.

The source masters remain the authority. No new generated image was used.

## 4. QA method

A local static proof harness was built from the real r10/r11 Package 3 DOM hierarchy and protected interaction geometry. It used the actual deterministic A01/A02 derivatives rather than newly generated stand-ins.

The harness marked real-data and real-control regions as protected and checked:

1. character rail versus protected-DOM intersection
2. visible character image versus central stage intersection after the rail's clipping boundary
3. horizontal viewport overflow
4. required large-character omission at compact and mobile widths

An initial proof-harness role alignment error was caught visually before acceptance: Daniel's art appeared beside Nik's card and Nik's art beside Daniel's card. The harness was corrected so art follows manager-role mapping, not a fixed person-to-screen-side assumption, and the complete matrix was rerun in fresh browser contexts.

That correction is proof-harness QA only. No production defect is implied.

## 5. Test matrix

22 distinct presentation states were tested at three viewport classes, for 66 total cases.

### Transfer Challenge

- `transfer_window`
- `transfer_guess`
- `transfer_signing`
- `transfer_completed`
- `transfer_shared_replay`
- `transfer_private_ownonly`

Protected areas included phase navigation, status copy, timer, timer actions, private guess/signing fields, manager cards, privacy/lock messages, verdicts, and real actions.

### Season Entry / Shared Results

- `season_local_entry`
- `season_local_review`
- `season_shared_ownonly`
- `season_shared_waiting`
- `season_shared_revealed`

The own-only and waiting states preserve the hidden rival result region. No rival result or winner state is visually inferred before runtime reveal authority.

### Shared Season Commit

- `commit_coordinator`
- `commit_waiting`
- `commit_ack_required`
- `commit_own_ack_waiting`
- `commit_both_ack`

These states use neutral manager identity presentation. Coordinator status never receives winner treatment.

### r11 Shared Canonical Scoring

- `shared_score_p1`
- `shared_score_p2`
- `shared_score_draw`

Winner emphasis is applied only after authoritative `SCORING_RECONCILED`; draw remains symmetric.

### Local Season Summary

- `summary_p1`
- `summary_p2`
- `summary_draw`

Winner emphasis is derived from completed `roundRecord.winner`; draw remains symmetric.

### Viewports

- wide desktop: `1600x900`
- compact desktop/tablet: `1024x768`
- mobile: `390x844`

## 6. Automated obstruction result

Result: `66 / 66 PASS`.

Across all cases:

- horizontal-overflow failures: `0`
- character-to-protected-DOM intersections: `0`
- visible character-to-central-stage intersections after rail clipping: `0`
- wide desktop cases with both character rails visible: `22 / 22`
- compact 1024 cases with large character rails visible: `0 / 22`
- mobile cases with large character rails visible: `0 / 22`

The compact layouts may vertically scroll in dense states. That is expected and preferable to horizontal compression or character obstruction. Mobile Transfer forms become one-column content and preserve action access after normal vertical scrolling.

Machine-readable case evidence is stored in `R8_22_PACKAGE_3_STATIC_QA_RESULTS.json`.

## 7. Visual inspection result

Representative rendered states were visually inspected in addition to geometry checks.

Wide Transfer Challenge:

- A01/A02 work as cropped outer-rail identity anchors
- the central 1100px form/timer/action plane remains dominant and unobstructed
- no tactical pose is necessary to explain phase, ownership, or action state

Shared Results / Commit:

- neutral character treatment is enough
- state copy and action hierarchy communicate publication, waiting, commit, and acknowledgement more clearly than pose changes would

r11 Shared Canonical Scoring and local Season Summary:

- A01/A02 reuse supports readable winner emphasis through opacity, luminance / halo, and role-aligned prominence
- the losing manager remains visible but dignified
- draw is clear with symmetric treatment
- score/result data remains the visual authority

Compact and mobile:

- omitting large characters materially improves scanability
- no responsive regeneration is justified

## 8. Asset gate decision

Generation state remains `CLOSED`.

A03 Nik focused tactical: `HOLD_GATE_CLOSED`.

A04 Daniel focused tactical: `HOLD_GATE_CLOSED`.

Reason: all Transfer Challenge states passed with A01/A02 reuse and no expression or hierarchy deficit that affects comprehension or premium composition.

A05 Nik celebration resolve: `HOLD_GATE_CLOSED`.

A06 Daniel celebration resolve: `HOLD_GATE_CLOSED`.

Reason: both local and r11 shared authoritative outcomes can be expressed with the frozen masters plus presentation-only winner/draw treatment without obstructing score authority. The static proof does not establish a necessary celebration-pose gap.

This does not delete these planned slots. It keeps them behind their evidence gate.

## 9. Package 3 implementation contract earned by this QA

For a future implementation against current main:

- wide desktop may mount role-aligned A01/A02 character rails outside the central interaction plane
- the character layer must be `pointer-events:none`
- central real DOM must always sit above character art
- dense editable Transfer states may further crop or omit art if real browser measurements demand it
- <=1280px should omit large Package 3 character rails by default
- mobile omits large character figures
- Shared Results and Shared Commit remain outcome-neutral before canonical scoring authority
- r11 shared winner/draw presentation is derived only from `CareerModeProductionSharedCanonicalScoring.getState()` when `authoritative===true` and `phase==='SCORING_RECONCILED'`
- local Season Summary winner/draw presentation is derived only from completed `roundRecord.winner`
- no visual-state persistence, Firebase write, scoring mutation, Save Library mutation, or new remote schema field is permitted

## 10. Tiebreak

Repository search against r11 still finds no live `tiebreak` runtime symbol or dedicated Tiebreak route/DOM.

Tiebreak remains `DEFERRED_NO_LIVE_RUNTIME_AUTHORITY`.

Do not invent it in the visual proposal.

## 11. Progress accounting

Formal visual production progress advances from `75%` to `78%`.

Earned change:

- responsive safe-zone and obstruction QA: `4/10 -> 7/10`

Why three points are earned:

- Package 3 exact states are now tested
- the mandatory wide / compact / mobile behavior is proven
- r11 drift was reconciled before acceptance
- actual frozen A01/A02 derivatives were used in the local render proof

Why the remaining three responsive/QA points are not earned yet:

- full linked-browser QA against the final integrated visual layer is still deferred to Package 5
- accessibility/focus/contrast and final runtime linkage remain final implementation proof tasks

No state-expression / pose-variant credit is awarded for CSS-only emphasis.

## 12. Next roadmap gate

Package 3 static composition / obstruction QA is complete.

The next roadmap package is Package 4: records, utility, recovery, Connected Rivalry, and global notices. Its first task must be exact live-DOM/runtime mapping before any visual change.

Generation begins Package 4 `CLOSED` by default. Data/readability and CSS/SVG/procedural treatment outrank raster generation.

Because the current visual environment entered at 80% handoff proximity and has now completed its single bounded successor task plus a material r11 drift reconciliation, do not open Package 4 in this same environment. Prepare the next successor starter from current authority.

## 13. Safety seal

This milestone changed only the independent visual proposal lane.

It did not modify or deploy:

- production main
- Firebase data or rules
- shared scoring logic
- Remote Joining
- Save Library authority
- local scoring
- billing

Firebase remains Spark only. Billing remains permanently off. Zero-dollar operation remains mandatory.
