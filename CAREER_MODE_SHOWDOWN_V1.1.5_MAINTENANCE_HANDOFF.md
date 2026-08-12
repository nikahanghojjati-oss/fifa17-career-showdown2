# Career Mode Showdown v1.1.5 Maintenance — Rolling Handoff

Last updated: 2026-08-12
Branch: `agent/v1.1.5-maintenance`
Starting documentation head: `4e71e85f3ac03a0def0beb18e99c4dccd6964ac4`
Immutable v1.1.4 production runtime authority: `1a498441a6ccf557aa8b8bc7ced2b3d9cd22cdf7`
Public site: `https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/`

## Owner request

Prepare a maintenance release after v1.1.4 that strengthens Candidate C restore/recovery, finishes the interrupted documentation seal, deepens future cloud-storage contracts for identity/revisions/conflicts/tombstones/privacy/security, fixes two major defects, passes every permanent gate confidently, deploys, receives two independent production proofs, and leaves the repository in a discrepancy-free state for the next developer.

## Release discipline

This is a maintenance release, not permission to jump to cloud synchronization or bypass the dependency roadmap. Runtime cloud storage remains blocked. v1.2.0 remains the next legal substantive product milestone after this maintenance release. Cloud work in v1.1.5 is contract/threat-model groundwork only and must not add network mutation or a second persistence authority.

No release may be called deployed/proven until one immutable candidate passes the required pre-merge matrices, expected-head merge protection, GitHub Pages revision convergence, exact deployed-byte verification, Candidate A/B/C deployed audits, full public journey and duplicate production proof.

## Baseline inherited from v1.1.4

Candidate C already protects:

1. fresh Apply-time Candidate B revalidation;
2. exact raw storage comparison against reviewed browser state;
3. complete candidate computation in memory before canonical mutation;
4. `js/storage.js` as sole browser-storage mutation authority;
5. deterministic active → Legacy → preferences write order;
6. post-write readback verification;
7. raw byte/absence snapshots;
8. rollback and rollback verification;
9. double-activation rejection;
10. stale-preview detection;
11. deterministic repeat import / zero-write no-op behavior;
12. corrupt byte preservation unless explicit replacement is chosen;
13. verified rollback and critical rollback recovery UX.

These contracts are protected and may only be strengthened, never weakened.

## Major defect 1 — confirmed restore intent is mutable during async revalidation

Root cause found during the v1.1.5 audit:

- `restoreUI.js` stores active/Legacy/preferences/conflict decisions in one mutable closure object.
- The user confirms the visible plan, then `applyCareerModeRestore()` awaits fresh file analysis.
- The same mutable choices object is used after that await.
- The Apply button is disabled, but decision controls and the file picker remain interactive during asynchronous verification.
- Therefore the user can confirm Plan A and change a selection while revalidation is in flight; without hardening, the transaction can compute/commit Plan B without Plan B receiving confirmation.
- A related review race allows the selected file to change while another file is still being analyzed.

Required correction:

- snapshot and deep-copy the confirmed file/choices/reviewed raw state before any asynchronous boundary;
- transaction planning must consume only that immutable Apply intent;
- lock all restore decision/file controls while review or Apply is in flight;
- bind each completed analysis to the exact file-generation that produced it and discard stale review completion;
- add deterministic contract tests plus real-browser race tests.

## Major defect 2 — rollback scope includes keys never successfully mutated

Root cause found in `js/storageTransaction.js`:

- the engine computes all affected keys;
- after any commit write failure it currently attempts rollback for every affected key, even keys whose commit write never succeeded or was never reached;
- a first-key write failure can therefore cause unnecessary writes to untouched keys and can incorrectly escalate to critical rollback failure if an untouched-key rewrite fails;
- unnecessary rollback writes also create a future concurrency hazard because a newer value from another context could be overwritten even though this restore never owned a mutation for that key.

Required correction:

- track successful commit writes explicitly;
- rollback only keys actually mutated by the transaction, in reverse commit order;
- verify rollback only for those owned mutations;
- if no write succeeded, return a clean non-critical write failure with zero rollback writes;
- before rolling back an owned key, verify the current bytes still match the transaction's candidate bytes; if not, refuse to clobber newer/unowned bytes and enter critical recovery with an explicit ownership conflict;
- add per-write stale preconditions so cross-context drift is detected before mutation whenever possible;
- add exact contracts for first/middle/final failure, ownership conflict and raw absence.

## Additional restore hardening in scope

- introduce a strict restore snapshot authority that distinguishes true key absence from localStorage read failure;
- fail closed before planning/writing if an exact snapshot cannot be acquired;
- preserve corrupt raw bytes unless the user explicitly chooses replacement;
- invalidate in-memory caches if a critical rollback leaves canonical bytes uncertain;
- align recovery UX copy with clean failure vs verified rollback vs critical rollback;
- keep deterministic repeated restores at zero writes;
- keep Candidate B analysis read-only and Candidate A export non-mutating.

## Release-coherence defect to correct

`js/backup.js` still contains a v1.1.3 fallback application-version stamp and the isolated Candidate A contract still expects that stale fallback. Public full-app execution normally sees `APP_VERSION`, but the fallback is inconsistent with release authority and must be made current/dynamic without changing the backup format.

## Future cloud-storage foundation — documentation/contracts only

v1.1.5 will define future synchronization invariants without adding a cloud backend:

- stable account/profile/save/device/installation identity boundaries;
- server-authoritative revisions and explicit base/parent revision semantics;
- content hashes for integrity, never as authentication;
- compare-and-swap writes / stale-revision rejection;
- divergent-head conflicts rather than silent last-write-wins for gameplay state;
- explicit tombstones with deletion revision and anti-resurrection rules;
- deterministic conflict resolution only for domains proven mergeable;
- privacy minimization, local-first/opt-in posture, export/delete requirements;
- authenticated ownership, least privilege, transport encryption, secure token handling, replay/idempotency protections and rate limiting;
- no future sync engine may bypass canonical validated storage transactions.

## Documentation closure

The v1.1.4 runtime itself is already twice-proven. Current-facing authority files must be reconciled, especially `00_DEVELOPER_START_HERE.md`, which still contains pre-merge v1.1.4 language. Historical release records remain historical and should not be rewritten merely because they contain older versions.

## Accidental branch housekeeping

During connector discovery, several harmless extra branches were created from the same documentation-only main head (`agent/v1.1.5-maintenance-notes`, `agent/v1.1.5-maintenance-seal`, `agent/v1.1.5-maintenance-docs`, `agent/v1.1.5-maintenance-final`). No files were changed on those branches. The authoritative maintenance branch is only `agent/v1.1.5-maintenance`. Do not use the extras for release authority.

## Current next action

Implement the two release-blocking restore fixes and their permanent regression tests first. Then add strict snapshot/cache hardening and cloud foundation contracts. Only after runtime behavior is green should release identity advance to v1.1.5 / `1.1.5-r1` and authority documentation be frozen.