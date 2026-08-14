# NEXT TASK — Career Mode Showdown

Last updated: 2026-08-13 ET

## Production milestone

v1.3.0 — Recovery & Device Resilience Hardening

Production identity: `v1.3.0` / `1.3.0-r1`
Immediate previous known-good whole shell: `1.2.0-r2`
Production proof: `V1.3.0_PRODUCTION_PROOF.md`
Runtime release merge: `094401b649954656e27e4a92d027e9532e84ccbf`

The shipped Installable Offline App baseline remains protected throughout Local Profiles / Save Library work.

## Active development direction

Local Profiles / Save Library — feature release version intentionally unassigned.

Completed dependency order:

1. Identity foundation PR #46 merged at `b76baf3be8107a57c5898f691d5178ae1d8a8547`.
2. Canonical persistence integration PR #48 merged at `d62ea1f62ec92af4a90de04a6ef182ed1bf44692`.
3. Save Library runtime authority cutover implementation in PR #51 is technically complete and green.

Do not reimplement those completed layers.

## Immediate task — close PR #51 safely

Active PR:

#51 — Cut over runtime authority to Save Library

Active branch:

`agent/save-library-runtime-authority-cutover`

Exact runtime/test implementation head:

`46d3e9d10d849b82e9d7d301fb6646404dec82bf`

That head passed all 13 normal PR workflow families.

First documentation-closure head:

`89fa6c185d9829269f6516feb80eccaa49060383`

That head changed only `SAVE_LIBRARY_RUNTIME_AUTHORITY_CUTOVER_ACTIVE_HANDOFF.md` relative to the green implementation head and also passed all 13 normal PR workflow families.

The runtime implementation is complete. The immediate work is documentation closure, fresh exact-head validation, expected-head merge and post-merge proof.

Do not modify runtime/test implementation merely because documentation advances the PR head. Reopen runtime architecture only if fresh exact-head validation exposes a genuine defect.

Do not say production `main` has been cut over until PR #51 is actually merged and independently proven after merge.

## Required closure procedure

1. Re-fetch the live PR #51 head before every consequential branch/merge action.
2. Preserve `SAVE_LIBRARY_RUNTIME_AUTHORITY_CUTOVER_ACTIVE_HANDOFF.md` as the detailed runtime architecture and failure/correction ledger unless newer repository authority requires a change.
3. Keep documentation consistent that implementation is complete and technically green while PR #51 remains in documentation closure / final exact-head validation.
4. Verify no runtime, test, workflow, service-worker, gameplay, scoring or protected visual source changes during documentation closure.
5. Observe a fresh validation generation on the exact final PR head and require every applicable workflow to succeed.
6. Never weaken a test and never raise a performance ceiling to get green.
7. Confirm PR #51 is mergeable and clean.
8. Re-fetch current `main` immediately before merge.
9. Merge with expected-head protection.
10. Re-fetch `main` after merge and verify the exact merge.
11. Verify every applicable permanent push-triggered workflow.
12. If Release Integration Burn-In is automatically/main triggered, verify it too.
13. Record exact merge SHA and post-merge proof in the public handoff/state authority if the established documentation process requires a separate closure.
14. Stop at the clean boundary. Do not start the visible Save Library UI candidate in this context-heavy PR/session.

## Final runtime authority model protected by PR #51

Before explicit Save Library activation, the compatibility-facing public canonical model remains exactly:

1. `careerModeShowdown.activeShowdown`
2. `careerModeShowdown.legacyShowdowns`
3. `careerModeShowdown.preferences`

After successful Save Library runtime cutover, the public canonical model becomes exactly:

1. `careerModeShowdown.saveLibrary`
2. `careerModeShowdown.legacyShowdowns`
3. `careerModeShowdown.preferences`

`careerModeShowdown.activeShowdown` is not a fourth permanent canonical key after cutover. It is only a transitional migration/recovery slot.

Normal gameplay must never recreate singleton active-save authority after successful migration.

`js/storage.js` remains sole public raw localStorage authority. Save Library runtime and cutover orchestration do not access localStorage directly.

Start and Continue may initiate migration only on confirmed action. Predictive hover/focus warm-up remains non-mutating. Settings and Legacy remain non-mutating on an unmigrated singleton device.

New Showdowns must receive stable `save_*` and `profile_*` identity before first authoritative persistence. Completed Seasons must receive stable `season_*` identity before synchronous persistence. Display-name equality is never identity authority.

## Candidate A / B / C locks

Candidate A remains non-mutating export and backup format remains v1.

Candidate B remains strictly read-only analysis.

Candidate C remains the only import stage allowed to mutate canonical restore state.

Candidate C destructive Apply still requires `captureCareerModeRawRestoreSnapshot()`.

This strict exact raw snapshot authority remains non-negotiable.

Never substitute `captureCareerModeRawBackupInputs()` as destructive snapshot authority.

The established three-slot Candidate C path remains mandatory for unmigrated singleton state. Save Library devices additionally guard exact Save Library bytes. Dual authority fails closed.

Preserve transaction-owned mutation, exact preconditions, last-moment raw guards, ownership-scoped reverse rollback, anti-clobber checks, exact post-write verification, corrupt-byte preservation, retry/idempotence and critical recovery on uncertainty.

## Performance locks

Final implementation proof on `46d3e9d10d849b82e9d7d301fb6646404dec82bf`:

- eager raw: `162935` bytes;
- eager gzip: `37475` bytes;
- lazy feedback: `4845` bytes.

Locked ceilings:

- eager raw <= `165000`;
- eager gzip <= `37500`;
- Reus startup portrait <= `95000`;
- combined first-party startup <= `260000`;
- normal loading minimum `2700 ms`;
- reduced-motion loading `220 ms`.

Do not raise budgets to make CI green.

## Permanent product locks

Exactly two managers.

Showdown lengths 1 / 3 / 5 / 10.

Same selected league.

Different permanent clubs.

Champions League +5.

League +3.

Domestic Cup +1.

100 League Points and/or 100 League Goals combined maximum +1.

Top Scorer and/or Top Assist combined maximum +1.

Maximum Season score 11.

Equal non-zero scores are Draw.

Only 0–0 invokes league position then league points.

Preserve Smart Back ownership, installed iOS loading composition, Settings-only install/update presentation and protected football visual behavior.

## PWA locks

Current whole shell remains `1.3.0-r1`.

Previous whole shell remains `1.2.0-r2`.

`CMS_ACTIVATE_UPDATE` must verify the complete candidate shell, await successful `skipWaiting()`, then and only then acknowledge activation.

Never assemble mixed runtimes.

Service Worker and Cache Storage remain application-byte authorities only and may never become canonical user-data storage.

## Validation authority

There are 14 permanent workflow families and 27 protected multiline executable blocks. Normal PRs run 13; Release Integration Burn-In remains `main`/manual release authority.

Do not weaken product assertions, recovery checks, visual geometry gates or performance ceilings to obtain green CI. Classify failures before editing implementation.

## Next substantial candidate after PR #51 merges

Do not begin this inside PR #51.

After PR #51 merges, independently re-fetch current `main` and complete post-merge proof first.

Then, in a fresh development session, the next dependency-ordered candidate is a separately bounded visible Local Profiles / Save Library product-UI candidate.

That future session must reconstruct exact owner/repository UI scope before implementation. Do not assume the visible product shape from old planning documents.

Do not automatically include:

- historical manager auto-linking by display-name equality or normalized spelling;
- cloud;
- accounts;
- QR pairing;
- synchronization;
- remote transport;
- backup/import envelope redesign;
- gameplay or scoring changes;
- protected visual redesign;
- feature release-version assignment.

Historical ambiguous manager identities remain explicit future mapping work.

PR #37 / `agent/v13-hardening` remains untrusted historical work and must not be merged or revived.