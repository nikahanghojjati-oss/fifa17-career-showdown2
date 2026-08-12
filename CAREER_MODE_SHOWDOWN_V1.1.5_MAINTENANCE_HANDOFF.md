# Career Mode Showdown v1.1.5 Maintenance — Rolling Handoff

Last updated: 2026-08-12
Branch: `agent/v1.1.5-maintenance`
Starting documentation head: `4e71e85f3ac03a0def0beb18e99c4dccd6964ac4`
Immutable v1.1.4 production runtime authority: `1a498441a6ccf557aa8b8bc7ced2b3d9cd22cdf7`
Public site: `https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/`
Draft maintenance PR: #25 — `v1.1.5 maintenance: restore transaction hardening`

## Owner request

Prepare a maintenance release after v1.1.4 that strengthens Candidate C restore/recovery, finishes the interrupted documentation seal, deepens future cloud-storage contracts for identity/revisions/conflicts/tombstones/privacy/security, fixes two major defects, passes every permanent gate confidently, deploys, receives two independent production proofs, and leaves the repository in a discrepancy-free state for the next developer.

## Release discipline

This is a maintenance release, not permission to jump to cloud synchronization or bypass the dependency roadmap. Runtime cloud storage remains blocked. v1.2.0 remains the next legal substantive product milestone after this maintenance release. Cloud work in v1.1.5 is contract/threat-model groundwork only and must not add network mutation or a second persistence authority.

No release may be called deployed/proven until one immutable candidate passes the required pre-merge matrices, expected-head merge protection, GitHub Pages revision convergence, exact deployed-byte verification, Candidate A/B/C deployed audits, full public journey and duplicate production proof.

## Baseline inherited from v1.1.4

Candidate C already protected fresh Apply-time Candidate B revalidation, exact raw storage comparison against reviewed browser state, complete candidate computation in memory before canonical mutation, `js/storage.js` sole browser-storage mutation authority, deterministic active → Legacy → preferences write order, post-write readback verification, raw byte/absence snapshots, rollback and rollback verification, double-activation rejection, stale-preview detection, deterministic repeat import/zero-write no-op behavior, corrupt byte preservation unless explicit replacement is chosen, and verified/critical rollback recovery UX.

v1.1.5 strengthens those contracts; it does not replace Candidate A/B/C architecture or change backup format version 1.

## Major defect 1 — confirmed restore intent could mutate during async revalidation

Root cause:

- `restoreUI.js` stored active/Legacy/preferences/conflict decisions in one mutable closure object.
- The user confirmed the visible plan, then `applyCareerModeRestore()` awaited fresh file analysis.
- The same mutable choices object was consumed after that asynchronous boundary.
- Apply was disabled, but the decision controls and file picker remained interactive during revalidation.
- A user could therefore confirm Plan A, change a choice while verification was in flight and cause Plan B to reach transaction planning without Plan B receiving confirmation.
- A related file-review race allowed a stale analysis completion for file A to become UI authority after the selected file had changed to B.

Implemented correction:

- `restore.js` captures the exact `confirmedFile`, deep-copied `confirmedChoices` and deep-copied reviewed raw precondition before the first await;
- fresh Candidate B analysis runs from `confirmedFile`, never the mutable later file selection;
- `restoreUI.js` locks file input, Review, all selects/conflict decisions and Apply while review/apply is in flight;
- review uses a monotonic `fileGeneration`; stale async review completion is discarded if file identity/generation changed;
- Apply binds the exact reviewed raw bytes and exact choices that produced the confirmed plan;
- deterministic contracts prove caller-side mutation after Apply begins cannot change the transaction candidate;
- real-browser maintenance audit attempts a programmatic decision mutation during delayed revalidation and requires the originally confirmed backup choice to commit.

## Major defect 2 — rollback included keys the transaction never successfully mutated

Root cause:

- the v1.1.4 transaction engine knew the planned affected-key set but not a distinct mutation-owned set;
- on any commit failure it attempted rollback for every affected key, including keys whose write failed or was never reached;
- first-key failure could therefore generate unnecessary writes and could falsely become critical recovery if an untouched-key rewrite failed;
- the old model also created a future concurrency hazard because rollback could overwrite newer cross-context bytes the restore transaction had never actually owned.

Implemented correction:

- `storageTransaction.js` now records `committedKeys` only after a commit write returns success;
- every planned write gets a normalized last-moment `prewrite` read and exact snapshot comparison;
- optional `expectedRaw` establishes an initial full transaction precondition;
- rollback scope is `committedKeys` only and is unwound in reverse commit order;
- first-write failure with zero successful mutation returns `write-failed-clean`, performs zero rollback writes and is explicitly non-critical;
- rollback checks ownership before mutation: already-restored snapshot bytes require no write, exact transaction-candidate bytes can be restored, and any third value is an ownership conflict that must not be clobbered;
- rollback verification runs only over transaction-owned mutations;
- ownership loss becomes `rollback-failed-critical` with explicit `rollbackOwnershipConflicts` evidence;
- critical recovery invalidates active-save, Legacy and preference caches and clears `currentShowdown` rather than leaving uncertain in-memory authority.

Permanent contract coverage includes success, exact no-op/idempotence, initial stale precondition, first/middle/final write failure, reverse rollback order, cross-context prewrite drift, rollback ownership conflict, exact raw absence and corrupt opaque bytes.

## Strict raw snapshot hardening

`js/storage.js` now exposes `captureCareerModeRawRestoreSnapshot()` specifically for destructive restore authority. Unlike the older backup snapshot helper, it distinguishes true `null` key absence from `localStorage.getItem()` failure. Any failed exact read produces `snapshot-unavailable`; restore fails closed before planning/writing instead of treating inaccessible storage as missing data.

The older Candidate A non-mutating backup snapshot remains compatible and unchanged in format semantics.

## Recovery UX hardening

The UI now distinguishes three failure classes instead of presenting every transaction failure as rollback:

1. `RESTORE NOT STARTED` — first required write failed before any canonical mutation; no rollback write was necessary.
2. `RESTORE ROLLED BACK` — one or more transaction-owned mutations occurred and were restored/verified byte-for-byte.
3. `CRITICAL RECOVERY STATE` — rollback or mutation ownership could not be proven. Controls lock until refresh and copy explicitly warns the user not to continue modifying the save.

The UI also surfaces stale transaction-boundary preconditions as a refreshed `stale-state` review rather than as a generic write failure.

## Candidate A provenance maintenance

Audit found `js/backup.js` still used a historical hardcoded `1.1.3` fallback when global `APP_VERSION` was unavailable. Full public execution normally had `APP_VERSION`, but isolated/error paths could stamp false provenance.

Correction:

- primary authority remains global `APP_VERSION` when available;
- otherwise Candidate A derives semantic version from the shell runtime revision (`x.y.z-rN`);
- if neither authority exists, it writes `unknown` rather than inventing an old release;
- `backup-contracts.cjs` now derives expected app/runtime provenance from current `js/app.js`, so future releases cannot accidentally reintroduce a historical fallback;
- backup format/checksum/payload semantics are unchanged.

## Future cloud-storage foundation — documentation/contracts only

Created `CLOUD_STORAGE_FOUNDATION.md` and permanent `cloud-foundation-contracts.cjs`. No cloud backend/network mutation was added.

The future contract now defines:

- separate `accountId`, `profileId`, `saveId`, `deviceId`, `installationId`, object type and object identity lifetimes;
- server-authoritative revision/base/parent semantics and compare-and-swap mutation;
- content hashes as integrity evidence only, never authentication;
- explicit divergent-head conflicts rather than silent last-write-wins gameplay state;
- tombstones with deletion revision and anti-resurrection rules;
- deterministic auto-merge only for domains with proven associative/idempotent merge contracts;
- local-first and opt-in cloud posture, data minimization, export/delete/retention requirements and no implied public sharing;
- HTTPS/TLS, authenticated ownership, server-side authorization, least privilege, secure session/token handling, CSRF/XSS considerations, replay/idempotency protection, rate limits, input/size limits, secret rotation and no service secrets in the static Pages client;
- future downloaded/conflict-resolved data must still pass Candidate C-style exact local preconditions, in-memory computation, canonical storage authority, verification and ownership-scoped rollback.

Cloud remains dependency-blocked: v1.2 Offline → v1.3 stable local profiles/save identity → v1.8 Cloud Readiness → v1.9 opt-in Cloud Backup Beta.

## Permanent gate improvements

New tests are not diagnostics-only:

- `restore-maintenance-contracts.cjs` is in the repository-wide contract suite;
- `restore-maintenance-audit.cjs` is appended to `test:restore-browser`, so Candidate C dedicated browser audit, Stability and every Burn-In pass inherit the new races/failure checks;
- `cloud-foundation-contracts.cjs` is in the repository-wide suite;
- `run-restore-contracts.cjs` runs the four Candidate C contract files and emits exact GitHub annotations when one fails, making future CI failures actionable;
- Final Polish now emits exact raw/gzip startup measurements as an annotation before enforcing the unchanged ceilings.

## Gate findings and corrections so far

### Candidate C contract failure 1

The first maintenance matrix failed before browser execution because the newly written storage contract compared VM-created values directly to host-realm literals and contained a source-shape check for `io.read(name,"prewrite")`. The runtime used the safer normalized helper `readValue(io,name,"prewrite")`.

Correction: cross-realm values are normalized/converted before host assertion and the source-shape contract now protects the actual normalized prewrite path. No runtime safety was weakened.

### Candidate C contract failure 2

The old `restore-plan-contracts.cjs` required literal `analyzeCareerModeBackupFile(file)`. v1.1.5 intentionally changed that call to `analyzeCareerModeBackupFile(confirmedFile)` to close the confirmed-intent race.

Correction: the old contract now requires the stronger immutable confirmed-file form and requires exact snapshot authority before transaction. Fresh Candidate B revalidation remains mandatory.

### Protected startup budget regression

Static App and Final Polish caught an eager raw-byte regression after strict snapshot/cache hardening. Diagnostic annotation measured:

- 165,031 raw bytes;
- 37,409 gzip bytes;
- protected ceilings remain 165,000 raw / 37,500 gzip.

The raw budget exceeded by 31 bytes. The threshold was not raised. A stale eager comment in `js/app.js` recorded the superseded `STARTUP_SPLASH_MINIMUM_MS = 1900` value while the real protected minimum is 2700 ms. Removing that obsolete comment recovered more than the 31-byte overage with zero runtime behavior change. Normal startup remains 2700 ms and reduced-motion startup 220 ms.

## Documentation closure still required

The v1.1.4 runtime itself is already twice-proven. `00_DEVELOPER_START_HERE.md` is still stale and must be rewritten during final release authority reconciliation. README, PROJECT_STATE, NEXT_TASK, roadmap starting point, release record, changelog and this handoff will be aligned only after v1.1.5 release identity is frozen and later after immutable production proof.

Historical release records must remain historical rather than being rewritten merely because they contain older releases.

## Accidental branch housekeeping

During connector discovery, several harmless extra branches were created from the same documentation-only main head: `agent/v1.1.5-maintenance-notes`, `agent/v1.1.5-maintenance-seal`, `agent/v1.1.5-maintenance-docs`, `agent/v1.1.5-maintenance-final`. No files were changed on those branches. The authoritative maintenance branch is only `agent/v1.1.5-maintenance`.

## Current release state

Runtime bug fixes and future-cloud contract groundwork are implemented on draft PR #25. Version identity deliberately remains v1.1.4 while the functional maintenance head is being attacked by permanent gates. Do not bump to v1.1.5 merely to make documentation look complete.

The next legal action is to make the functional head fully green, including the two new real-browser maintenance scenarios, then perform the coherent v1.1.5 / `1.1.5-r1` identity freeze and full two-pass release protocol. No v1.2 implementation begins until v1.1.5 is deployed and twice-proven.