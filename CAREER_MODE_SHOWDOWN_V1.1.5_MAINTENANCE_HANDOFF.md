# Career Mode Showdown v1.1.5 Maintenance — Master Rolling Handoff

Last updated: 2026-08-12
Repository: `nikahanghojjati-oss/fifa17-career-showdown2`
Authoritative maintenance branch: `agent/v1.1.5-maintenance`
Draft PR: #25 — `v1.1.5 maintenance: restore transaction hardening`
Starting documentation head: `4e71e85f3ac03a0def0beb18e99c4dccd6964ac4`
Immutable current public production runtime: `1a498441a6ccf557aa8b8bc7ced2b3d9cd22cdf7` (v1.1.4)
Current maintenance candidate identity: v1.1.5 / `1.1.5-r1`
Public site: `https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/`

This is the primary v1.1.5 development chronology. Read it with `00_DEVELOPER_START_HERE.md`, `NEXT_TASK.md` and `RELEASE_V1.1.5.md`. Historical v1.1.4 proof remains in `CAREER_MODE_SHOWDOWN_V1.1.4_POST_MERGE.md`.

## 1. Owner request

The owner asked for a stable maintenance release that:

- finishes the interrupted v1.1.4 documentation seal;
- improves Candidate C fresh revalidation, exact raw snapshots, in-memory computation, storage authority, post-write verification, byte-for-byte rollback, rollback verification, double-activation protection, stale-preview detection, deterministic repeat imports, corrupt-byte preservation and recovery UX;
- fixes two major restore bugs rather than making cosmetic maintenance changes;
- establishes future cloud identity, revision, conflict, tombstone, privacy and security requirements without prematurely adding cloud runtime;
- passes all permanent gates confidently, deploys and receives duplicate production proof;
- leaves current handoffs/authority coherent for the next developer;
- keeps v1.2.0 Installable Offline App as the next substantive milestone after maintenance proof.

## 2. Release discipline

This maintenance release does not change gameplay/scoring, the exactly-two-manager product, backup format version 1, Candidate B read-only semantics, licensed football-photo authority or the protected Marco Reus loading presentation.

Cloud remains future contract/threat-model work only. No cloud backend, network write, account requirement or second persistence authority is introduced.

A release is not called deployed/proven merely because source is merged. Required proof remains:

1. one exact final PR SHA;
2. complete permanent matrix green;
3. independent second same-SHA matrix;
4. expected-head-protected merge;
5. Pages revision convergence;
6. exact deployed-byte parity;
7. public provenance, Home/Reus, licensed visuals, Candidate A, Candidate B, Candidate C and full journey;
8. Burn-In 5/5;
9. independent second production proof on the same immutable runtime SHA;
10. post-merge docs-only seal that does not redefine runtime authority.

## 3. Major defect 1 — confirmed restore intent could change after confirmation

### Root cause

v1.1.4 correctly performed fresh Apply-time Candidate B analysis, but `restoreUI.js` held active/Legacy/preferences/conflict choices in one mutable closure object. Apply awaited asynchronous revalidation and then used that same object.

The Apply button was disabled, but file/choice controls remained mutable. A user could therefore confirm Plan A, alter a choice while verification was running and allow Plan B to reach commit without Plan B receiving the visible confirmation.

The same class of race existed during Review: an analysis for selected file A could finish after the user selected file B and become stale UI authority.

### Correction

`js/restore.js` now freezes before the first asynchronous Apply boundary:

- `confirmedFile`;
- deep-copied `confirmedChoices`;
- deep-copied `confirmedExpectedRaw`.

Fresh Candidate B analysis runs only on the exact confirmed File.

`js/restoreUI.js` now:

- locks file picker, Review, all top-level restore selects, Legacy conflict controls and Apply while review/apply is in flight;
- maintains a monotonic `fileGeneration`;
- discards stale async Review completion when file identity/generation changed;
- binds the exact confirmed file/choices/raw snapshot before confirmation-to-Apply transition;
- refuses to proceed if the file changed between confirmation and transaction start.

### Permanent proof

`tests/contracts/restore-maintenance-contracts.cjs` mutates caller-side choices and reviewed state after Apply begins and requires the original confirmed intent to remain authoritative.

`tests/browser/restore-maintenance-audit.cjs` delays fresh analysis in real Chromium, attempts a programmatic choice mutation while Apply is in flight and requires the originally confirmed backup active state to commit.

## 4. Major defect 2 — rollback scope included keys never successfully mutated

### Root cause

The v1.1.4 transaction planned an affected-key set and rolled that entire set back after a commit failure. A key whose write failed or was never reached could still receive an unnecessary rollback write.

Consequences included:

- a first-key failure could perform needless rollback writes;
- failure of an unnecessary rollback write could falsely escalate to critical recovery;
- future cross-context concurrency could allow rollback to overwrite newer bytes for a key this transaction never successfully mutated.

### Correction

`js/storageTransaction.js` now implements transaction ownership:

- optional full `expectedRaw` precondition;
- exact `prewrite` read immediately before every mutation;
- `committedKeys` recorded only after a commit write succeeds;
- rollback scope equals successfully committed/owned keys only;
- rollback order is reverse commit order;
- first-write failure with zero successful mutation returns `write-failed-clean`, performs zero rollback writes and is explicitly non-critical;
- rollback checks current ownership before writing:
  - current bytes already equal snapshot: already restored, no write;
  - current bytes equal this transaction's candidate: transaction still owns them and may restore snapshot;
  - any third/newer value: ownership conflict; Candidate C refuses to clobber it;
- rollback verification covers transaction-owned mutations byte-for-byte;
- ownership loss or unverified rollback returns `rollback-failed-critical` with explicit ownership-conflict evidence.

`js/storage.js` invalidates active-save presence, Legacy cache and preference cache and clears `currentShowdown` when critical recovery means canonical bytes are uncertain.

### Permanent proof

The storage contract now covers:

- complete success;
- repeated identical no-op / zero writes;
- initial stale precondition;
- first-key clean failure;
- middle-key failure with one owned rollback;
- final-key failure with reverse-order owned rollback;
- last-moment cross-context drift;
- post-write verification mismatch;
- rollback ownership conflict and anti-clobber behavior;
- exact key absence/removal semantics;
- corrupt opaque raw-byte preservation.

The real-browser maintenance audit requires a first-write failure to show `RESTORE NOT STARTED`, preserve exact prior bytes and perform no rollback rewrite.

## 5. Strict restore snapshot / stale-state hardening

`js/storage.js` now provides destructive restore authority through `captureCareerModeRawRestoreSnapshot()`.

It differentiates true key absence from `localStorage.getItem()` failure. A read failure no longer looks like a missing key. Any failed exact read returns a failed snapshot and Candidate C returns `snapshot-unavailable` before planning or mutation.

Candidate C has two stale-state barriers:

1. reviewed-state comparison after pending writes are flushed and fresh Candidate B analysis finishes;
2. exact per-write precondition immediately before each canonical mutation.

A transaction-boundary precondition failure is normalized into explicit stale-state recovery rather than generic storage failure.

## 6. Recovery UX hardening

The restore surface now distinguishes:

### RESTORE NOT STARTED

The first required write failed before Candidate C successfully mutated any canonical key. No rollback write is necessary. Existing bytes remain authority.

### RESTORE ROLLED BACK

One or more transaction-owned mutations occurred and were restored/verified byte-for-byte. Deliberate retry remains possible.

### CRITICAL RECOVERY STATE

Rollback or mutation ownership cannot be proven. Candidate C controls lock until refresh, uncertain runtime caches are invalidated and the UI tells the user not to continue modifying the save as if state were known-good.

Existing success, conflict choice, stale-state, corrupt-data guidance, deterministic repeat import, double-Apply lock, lifecycle protection, keyboard/focus, reduced motion, Chromebook/windowed desktop, mobile DPR2, footer-safe scrolling and 44 px restore input remain protected.

## 7. Candidate A provenance maintenance

Audit found `js/backup.js` retained a hardcoded v1.1.3 application-version fallback when global `APP_VERSION` was unavailable.

v1.1.5 removes the false historical fallback:

1. use current global `APP_VERSION` when available;
2. otherwise parse semantic version from current shell runtime revision;
3. otherwise record `unknown` rather than inventing an old release.

Backup format remains version 1. Payload, checksum and non-mutating export semantics are unchanged.

`backup-contracts.cjs` derives expected release provenance from current `js/app.js`, so later releases cannot silently reintroduce a historical hardcode.

## 8. Future cloud storage foundation

Created `CLOUD_STORAGE_FOUNDATION.md` and `tests/contracts/cloud-foundation-contracts.cjs`.

No cloud runtime was added.

The future contract defines:

### Identity

Separate account, profile, save, device, installation and object identities with explicit lifetime/ownership boundaries. Device/installation IDs are metadata, not credentials.

### Revisions

Server-authoritative revision tokens, base/parent revision semantics, compare-and-swap writes, content hashes for integrity only, and no timestamp-based conflict authority.

### Conflicts

No silent last-write-wins for gameplay state. Divergent heads require explicit local/remote/fork resolution unless a domain has a separately proven deterministic associative/idempotent merge contract.

### Tombstones

Deletion revisions, anti-resurrection rules, stale-client rejection, explicit retention/compaction policy and restore-from-trash as a new live revision rather than history erasure.

### Privacy

Local-first/opt-in posture, data minimization, separation of private backup from future sharing, export/delete support, retention clarity and no unnecessary PII/secrets in URLs/logs.

### Security

TLS, authenticated ownership, server-side authorization on every object operation, least privilege, secure session/token handling, CSRF/XSS considerations, replay/idempotency protection, rate limiting, schema/size limits, encryption-at-rest provider controls, secret rotation and no service-role/admin secret in the static client.

Plain backup SHA-256 remains integrity evidence only and must never be described as encryption/authentication.

### Local apply boundary

Future remote/downloaded state must still pass the strengthened local Candidate C sequence: flush, authenticate/validate, exact local snapshot, base compare, full in-memory compute, explicit conflict choices, canonical storage authority, post-write verification, ownership-scoped rollback and critical recovery on uncertainty.

Roadmap dependency remains:

v1.2 Offline/PWA → v1.3 stable local profiles/save identity → later Cloud Readiness → opt-in Cloud Backup Beta.

## 9. Permanent CI/tooling improvements

Added:

- `restore-maintenance-contracts.cjs`;
- `restore-maintenance-audit.cjs`;
- `cloud-foundation-contracts.cjs`;
- `run-restore-contracts.cjs`;
- `run-contract-suite.cjs`.

The dedicated Candidate C browser command now runs the original deep recovery audit plus the maintenance race/failure audit. Stability and every Burn-In pass inherit it.

The contract runners emit exact failing filenames/assertion text as GitHub annotations, replacing anonymous aggregate `exit code 1` failures.

Final Polish now emits exact raw/gzip startup measurements before enforcing unchanged limits.

No permanent assertion or threshold was removed to make the maintenance green.

## 10. Important gate failures and what they found

### Cross-realm contract harness failure

The first new storage contract compared VM-created values directly with host-realm values and asserted an outdated source shape. Runtime behavior was not the failure. The harness was corrected to normalize values and protect the actual `readValue(io,name,"prewrite")` path.

### Old fresh-analysis source guard

An older contract required literal `analyzeCareerModeBackupFile(file)`. The new safe implementation intentionally uses `analyzeCareerModeBackupFile(confirmedFile)`. The guard was updated to require the stronger immutable confirmed-file form.

### Old stale-state guard

The earlier contract looked for one loose snapshot/comparison source sequence. v1.1.5 uses strict snapshot authority plus a second transaction-boundary precondition. The guard was updated to require both layers.

### Old final-hardening confirmed-choice guard

The earlier final guard expected mutable `choices`/`reviewedRaw`. It was updated to require `confirmedChoices`/`confirmedRaw`, full control locking, strict snapshots and ownership rollback.

### Startup budget regression

Strict eager storage hardening initially measured:

- 165,031 raw bytes;
- 37,409 gzip bytes.

Protected ceilings are:

- 165,000 raw;
- 37,500 gzip.

The raw limit correctly failed by 31 bytes. It was not raised. An obsolete eager comment referring to an old 1900 ms loading value was removed, returning the shell under the original ceiling without behavior loss.

Normal loading remains 2700 ms; reduced-motion startup remains 220 ms.

## 11. Functional proof before release identity change

Functional maintenance head:

`dbcdffaae927163e5a9c8b44466ff2084e814de5`

passed all 14 permanent workflow families before the version identity changed.

That proof included:

- all ordinary workstream families;
- Static App full repository contracts and protected 27-block topology;
- Candidate C deterministic contracts;
- Candidate C complete destructive/recovery browser command twice, including the two new maintenance scenarios;
- Stability contracts and two full Chromium cycles;
- Candidate C Release Burn-In 5/5;
- Candidate A/B;
- licensed visuals;
- original startup limits.

This intentionally separated functional correctness from release-number/document migration.

## 12. Release identity freeze chronology

The first temporary exact-identity helper expected nine `1.1.4-r1` shell references and failed before committing anything.

Source inspection proved ten references were correct:

1. runtime-revision meta;
2. eager app stylesheet;
3. Reus startup portrait;
4–10. seven eager scripts.

After correcting only that expected count, the helper successfully committed:

`882be077a1bc0caa4ddee17630a624f7bc934e47` — `Freeze v1.1.5 runtime identity`

It aligned:

- `package.json` → 1.1.5;
- both root `package-lock.json` version fields → 1.1.5;
- `APP_VERSION` → 1.1.5;
- visual-fidelity stylesheet cache → `1.1.5-r1`;
- shell revision meta → `1.1.5-r1`;
- eager stylesheet, Reus portrait and all seven startup scripts → `1.1.5-r1`;
- visible footer → `v1.1.5 · Stable`.

The temporary identity workflow was deleted immediately after verification and is not part of the release candidate.

## 13. Authority/document reconciliation chronology

`00_DEVELOPER_START_HERE.md` was rebuilt as a current-facing v1.1.5 bootstrap.

`NEXT_TASK.md` was rebuilt so the sole legal work is v1.1.5 release closure rather than reimplementing Candidate C.

A guarded temporary docs helper updated only current-facing blocks in:

- README;
- PROJECT_STATE;
- POST_V1_ROADMAP_EXECUTION;
- CHANGELOG.

It preserved historical v1.1.4/v1.1.3 evidence rather than rewriting history and was deleted immediately after success.

An attempted temporary handoff helper had invalid YAML and produced zero jobs/zero handoff mutation. It was deleted instead of being debugged. This consolidated handoff replacement is the corrective path.

## 14. Current release-candidate truth

Application production: v1.1.5
Runtime/cache revision: `1.1.5-r1`
Merged PR: #25
Immutable production runtime authority: `ff755a9863abc843ae9aac45178428e3a104fc65`
GitHub Pages build: `1147995655`
Production proof: twice complete

Implemented/protected maintenance:

- immutable confirmed restore file/choices/raw precondition;
- strict exact destructive snapshots;
- reviewed-state and transaction-boundary stale detection;
- complete in-memory candidate computation;
- sole canonical storage authority;
- post-write verification;
- mutation-owned reverse rollback;
- byte-for-byte rollback verification;
- anti-clobber rollback ownership conflict detection;
- double-activation protection;
- deterministic repeat imports;
- corrupt-byte preservation;
- differentiated recovery UX;
- dynamic Candidate A provenance;
- future cloud safety contract only.

Next substantive milestone after release proof: v1.2.0 Installable Offline App.

## 15. Release closure completed

v1.1.5 release work is closed.

Completed evidence:

1. frozen pre-merge SHA `97088274e1eac377927476b84c6090e7233e0997` passed all 14 permanent families twice;
2. PR #25 merged with expected-head protection;
3. immutable runtime authority is `ff755a9863abc843ae9aac45178428e3a104fc65`;
4. Pages build `1147995655` deployed that exact runtime as `1.1.5-r1`;
5. production attempt 1 passed all 14 families, exact deployed bytes and full live journey;
6. production attempt 2 independently passed all 14 families on the same runtime, including Candidate C twice-browser recovery, Burn-In 5/5, two-cycle Stability and the complete deployed-site smoke;
7. the apparent Stability glitch was proven to be GitHub concurrency cancellation, not an assertion failure;
8. post-release CI hardening prevents reruns/manual proof dispatches from cancelling active Stability/Candidate B/C evidence while preserving Burn-In's non-cancelling five-pass behavior;
9. `CAREER_MODE_SHOWDOWN_V1.1.5_POST_MERGE.md` is the immutable production evidence record.

The next legal substantive milestone is v1.2.0 Installable Offline App.

## 16. Continuation for the next developer

Do not restart Candidate C or cloud planning.

Fetch current `main`, PR #25 and its exact head. Read:

1. `00_HANDOFF_GOLDEN_RULE.md`;
2. `00_DEVELOPER_START_HERE.md`;
3. `NEXT_TASK.md`;
4. this handoff;
5. `RELEASE_V1.1.5.md`;
6. `CLOUD_STORAGE_FOUNDATION.md` only for future sync constraints.

The two maintenance bugs are already implemented and functionally proven. Continue only the release protocol unless a permanent gate exposes a new concrete defect. Do not weaken a test to preserve a candidate. If release proof becomes fully green, deploy and seal v1.1.5 before beginning v1.2.