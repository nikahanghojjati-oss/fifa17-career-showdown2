# Career Mode Showdown — v1.1.4 Candidate C Atomic Restore + Recovery UX

Release tag: `v1.1.4`
Runtime asset revision: `1.1.4-r1`
Status: PRE-MERGE VALIDATION IN PROGRESS
Owner acceptance: PENDING PUBLIC BUILD REVIEW

## Release purpose

v1.1.4 closes the v1.1 Data Safety and Recovery milestone with Candidate C — Atomic Restore + Recovery UX. Candidate A remains the non-mutating backup/export authority and Candidate B remains the read-only analysis/migration/conflict-preview authority. Candidate C is the first stage permitted to commit imported canonical state, and it does so only after a fresh revalidation and explicit user choices.

This release does not change competition rules, scoring, the exactly-two-manager model, League/Club assignment semantics, Transfer Challenge, Season Review scoring/persistence boundaries, Statistics calculations, licensed football-photo source authority or the accepted Marco Reus loading presentation.

## Atomic restore transaction

Candidate C treats active Showdown, Legacy and application preferences as one restore transaction boundary:

1. pending canonical writes are flushed before restore;
2. the selected backup is revalidated immediately before Apply, including format, checksum, schema/migrations and unresolved conflicts;
3. exact raw pre-restore bytes/absence are snapshotted for every affected canonical key;
4. active replacement, Legacy conflict handling and preference restoration remain explicit user decisions;
5. all final candidate values are computed in memory before the first mutation;
6. canonical mutation remains under the existing storage authority rather than introducing a second persistence owner;
7. affected keys commit in deterministic active → Legacy → preferences order;
8. every written key/value is read back and verified;
9. any write or post-write mismatch triggers full affected-key rollback to the exact raw snapshot;
10. rollback itself is verified byte-for-byte;
11. a rollback that cannot be proven enters a locked critical recovery state rather than pretending recovery succeeded;
12. in-memory/runtime state is synchronized only after the complete transaction verifies.

Repeated import of an already-restored backup is deterministic. Corrupt pre-existing raw data is preserved and never silently erased merely to make restore easier.

## Recovery UX

Restore remains inside the existing lazy Legacy / Data Management surface. The UI separates:

- current local state;
- analyzed backup state;
- explicit resolution choices;
- the exact planned active/Legacy/preferences effects;
- destructive confirmation;
- restore-in-progress state;
- successful completion;
- verified rollback with deliberate retry available;
- critical rollback failure with Candidate C controls locked until refresh.

Export Backup remains available above the destructive restore surface so recovery guidance is available before replacement. The restore file control has a 44 px minimum touch target, responsive/mobile layouts are overflow-protected, and the Apply/recovery controls must remain scrollable above the fixed footer.

## Failure-injection evidence

Candidate C deterministic and real-browser gates deliberately cover more than the happy path, including:

- first-key write failure;
- middle-key write failure after an earlier key changed;
- final-key write failure;
- quota/storage exception;
- post-write verification mismatch;
- rollback write failure / unverified rollback;
- exact raw absence semantics;
- corrupt pre-existing raw bytes;
- same-ID Legacy conflict choices;
- stale analysis / local state changed after review;
- rapid/double Apply activation;
- page lifecycle interruption before the synchronous transaction boundary;
- repeated import/idempotence;
- keyboard/focus behavior;
- Chromebook/windowed desktop;
- mobile 390×844 DPR2;
- reduced motion;
- footer-safe scrolling and minimum touch targets.

The dedicated Candidate C browser lane executes eight isolated destructive/recovery scenarios per pass and runs the complete set twice. Isolation is intentional: a deliberately destabilized storage-failure browser process cannot contaminate a later scenario.

## Defects found by the strengthened gates

The release gates were treated as bug finders rather than pass/fail decoration. They exposed and led to fixes for four concrete defects during Candidate C development:

1. Apply performed a live `refreshPlan()` before confirmation, which could silently disable Apply after local state changed and bypass the explicit stale-state message. Apply now validates the reviewed choices against the reviewed snapshot and lets the authoritative post-flush stale-state guard decide whether the transaction may proceed.
2. After a safe rollback, `finally { refreshPlan(); }` immediately erased the visible `RESTORE ROLLED BACK` recovery proof. Verified rollback now remains visible and permits a deliberate retry; unverified rollback enters a locked critical state.
3. The destructive browser audit reused one Chromium process after injected storage failures; the process could terminate before the next scenario. Each destructive failure scenario now uses an isolated browser process.
4. The mobile restore file input measured only 40 px high at 390×844 DPR2. It now has an explicit 44 px minimum height with border-box sizing.

Permanent static hardening also protects the stale-state bypass, recovery-message persistence, critical-control lock, touch-target floor and destructive-scenario coverage classes so later refactors cannot silently undo these fixes.

## Permanent release gates

Candidate C is no longer protected only by its dedicated workflow:

- `Validate Candidate C Atomic Restore` runs deterministic transaction/planning/failure contracts plus the full real-browser recovery audit twice;
- the Stability Lane now includes Candidate C restore/recovery inside both consecutive local Chromium cycles and the deployed-site smoke path;
- the five-pass Release Burn-In now exercises Candidate C recovery in every complete pass;
- Static App release validation is being moved from version-fragile inline hardcodes to repository-owned dynamic contracts that derive the current v1.1.x identity from source/package metadata while retaining startup, scoring, routing, club identity, storage authority, budget and lazy-loading protections.

Before the v1.1.4 identity freeze, the fully implemented Candidate C head `cf231ec99399837369a53fc5a703f93aec99dcb6` passed all permanent feature/workstream families, the dedicated Candidate C lane, the expanded two-cycle Stability Lane and a 5/5 Candidate C-inclusive Burn-In. The release identity/documentation freeze is intentionally isolated from PR #24 until its coherence work is complete.

## Release identity and performance boundary

Application identity: `v1.1.4`
Runtime/cache identity: `1.1.4-r1`

Protected startup ceilings remain:

- 165,000 raw eager code bytes;
- 37,500 gzip eager code bytes;
- 95,000 bytes for the startup Marco Reus portrait;
- 260,000 combined first-party startup bytes.

Candidate C remains lazy and must not enter the eager startup dependency set.

## Release evidence still required before status can become DEPLOYED / PROVEN

1. finish v1.1.4 package/cache/fallback/document authority coherence without changing proven Candidate C semantics;
2. freeze one exact PR #24 head SHA;
3. pass every permanent workflow family on that exact frozen SHA without weakening thresholds;
4. execute a second independent permanent-family matrix on that same SHA where the release protocol requires duplicate proof;
5. manually inspect final Candidate C responsive/recovery screenshot artifacts;
6. merge PR #24 with expected-head protection;
7. wait for GitHub Pages to serve `1.1.4-r1`;
8. pass exact deployed runtime-byte verification plus runtime provenance, Home/Reus, licensed football visuals, Candidate A export, Candidate B analysis, Candidate C restore/recovery and the complete public journey;
9. repeat the required production proof on the same runtime authority;
10. align final authority/handoff records with the immutable runtime merge SHA without creating a recursive release-document loop.

Until those steps complete, this document is a release-candidate record and does not claim that v1.1.4 is deployed or proven.

## Next dependency boundary

v1.2.0 remains reserved for the Installable Offline App milestone. PWA/offline installation, profiles/save registry, cloud/accounts, QR pairing and two-device work remain blocked until Candidate C is merged, deployed and proven.
