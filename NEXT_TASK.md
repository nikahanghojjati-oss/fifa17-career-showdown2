# NEXT TASK — Career Mode Showdown

Last updated: 2026-08-14 ET

## Production milestone

v1.3.0 — Recovery & Device Resilience Hardening

Production identity label: `v1.3.0` / `1.3.0-r1`
Immediate previous known-good whole shell: `1.2.0-r2`
Original production proof: `V1.3.0_PRODUCTION_PROOF.md`
Original v1.3 runtime release merge: `094401b649954656e27e4a92d027e9532e84ccbf`

Save Library runtime authority cutover PR #51 is now merged and post-merge proven on `main` at:

`7c970c2fa425c9ae6ab8ddf215c8ee88305125a2`

The application/runtime release label was intentionally not changed by this technical cutover.

The shipped Installable Offline App baseline remains protected throughout future Local Profiles / Save Library work.

## Completed Local Profiles / Save Library dependency chain

Feature release version remains intentionally unassigned.

Completed technical layers:

1. Identity foundation PR #46 merged at `b76baf3be8107a57c5898f691d5178ae1d8a8547`.
2. Canonical persistence integration PR #48 merged at `d62ea1f62ec92af4a90de04a6ef182ed1bf44692`.
3. Save Library runtime authority cutover PR #51 merged at `7c970c2fa425c9ae6ab8ddf215c8ee88305125a2` and is production-proven.

Do not reimplement or reopen those layers unless a newly reproduced defect on current `main` provides concrete evidence that the established contracts are wrong.

## PR #51 closure proof

Exact runtime/test implementation head:

`46d3e9d10d849b82e9d7d301fb6646404dec82bf`

Exact final PR head:

`bda19f8181598d880c7b1eb7f4e9446464d015e6`

The final PR head passed all 13 normal PR workflow families without test weakening or budget increases.

Immediately before merge, `main` was independently verified at:

`98b37a4ec77b3da3da55f6f621a6a0cf2a340fa2`

PR #51 was merged using expected-head protection. Exact merge:

`7c970c2fa425c9ae6ab8ddf215c8ee88305125a2`

Its parents are exactly the pre-merge `main` SHA and the exact green final PR head.

All 14 permanent push-triggered workflow families passed on the exact merge.

Release Integration Burn-In run `31768712755` passed both complete stateful integration jobs.

Stability Lane run `31768712798` passed all three jobs, including deployed-site smoke. The deployed-site smoke verified exact Pages runtime bytes and passed runtime provenance, Home visual, football-photo crop, Candidate A, Candidate B, Candidate C, install/offline and complete journey audits.

## Immediate engineering task

Do not continue feature implementation in the PR #51 closure context.

The next substantial dependency-ordered candidate is a separately bounded visible Local Profiles / Save Library product-UI candidate.

It must begin in a fresh development session.

The first responsibility of that session is to independently re-fetch current `main`, read the active handoffs and reconstruct the exact owner/repository UI scope before implementation. Do not infer the visible product shape from old planning documents alone.

The future candidate may build user-facing Save Library / Local Profiles surfaces on top of the now-proven identity, persistence and runtime authority layers, but its exact UI scope must be established from current repository authority and owner requirements.

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

No visible Save Library UI is implemented yet.

## Final runtime authority model

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

Current whole shell label remains `1.3.0-r1`.

Previous whole shell remains `1.2.0-r2`.

`CMS_ACTIVATE_UPDATE` must verify the complete candidate shell, await successful `skipWaiting()`, then and only then acknowledge activation.

Never assemble mixed runtimes.

Service Worker and Cache Storage remain application-byte authorities only and may never become canonical user-data storage.

## Validation authority

There are 14 permanent workflow families and 27 protected multiline executable blocks. Normal PRs run 13; Release Integration Burn-In remains `main`/manual release authority.

Do not weaken product assertions, recovery checks, visual geometry gates or performance ceilings to obtain green CI. Classify failures before editing implementation.

## Historical warning

PR #37 / `agent/v13-hardening` remains untrusted historical work and must not be merged or revived.