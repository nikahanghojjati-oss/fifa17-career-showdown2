# Career Mode Showdown — Local Profiles / Save Library Active Handoff

Last updated: 2026-08-13 ET
Status: active development candidate; not production authority
Repository: `nikahanghojjati-oss/fifa17-career-showdown2`
Production baseline at session start: `main` `908469d6034a9374b18d5d75f94fa371d8ad54a7`
Production application/runtime: `v1.3.0` / `1.3.0-r1`
Immediate previous whole runtime: `1.2.0-r2`
Active branch: `agent/local-profiles-save-library-foundation`
Feature version: intentionally unassigned pending current release authority

## Owner instruction

After the repository was independently reconstructed and the closed v1.3 production baseline was confirmed, the owner explicitly said `Continue`.

This is treated as current authorization to move to the next approved dependency-ordered product direction: Local Profiles / Save Library. It is not authorization for cloud, accounts, QR pairing, synchronization, gameplay/scoring changes, framework migration or broad visual redesign.

## Recovered feature authority

The current repository roadmap says Local Profiles / Save Library is the next approved future direction after v1.3 but deliberately leaves its version pending.

The historical owner-approved post-v1 roadmap defines the milestone as an extra-large change that must be split into testable candidates. Required outcomes include stable opaque manager/Showdown/Season identities, editable manager display names independent of identity, a versioned local save registry with several in-progress Showdowns and one explicitly selected current Showdown, preserved Legacy, migration without duplication, profile creation, Save Library actions, and backup/import integration. `js/storage.js` remains the only public persistence authority.

Historical numeric label `v1.3.0` for this feature is superseded because `v1.3.0` is now the shipped Recovery & Device Resilience Hardening release. Do not silently reuse the old version number.

## Candidate split chosen in this session

Because the roadmap classifies this milestone as extra large, this session is starting with a bounded storage/identity foundation rather than attempting the whole milestone in one unsafe change.

Candidate foundation goals:

1. define the versioned local save-registry/identity contract against current source;
2. preserve the current one-active-save user path while the internal foundation is introduced;
3. make singleton migration rollback-safe and idempotent;
4. preserve Legacy bytes/history and avoid guessing historical manager identity from names;
5. preserve Candidate A/B/C recovery guarantees and exact-byte authority;
6. add focused deterministic regression evidence before visible multi-save management UI;
7. keep cloud/network behavior completely out of scope.

Visible profile mapping, Save Library management actions and backup/import envelope evolution must not be started until the foundation contract is proven or a clean handoff names the exact next candidate.

## Source authority inspected

Current source inspected before runtime changes includes `js/storage.js`, `js/storageTransaction.js`, `js/showdown.js`, `js/backup.js`, `js/importAnalysis.js`, `js/restore.js`, `js/scoring.js`, `service-worker.js`, current recovery contracts and roadmap/handoff authority.

Important current facts:

- current new Showdown IDs are still `Date.now()` values;
- current canonical persistence uses `careerModeShowdown.activeShowdown`, `careerModeShowdown.legacyShowdowns`, and `careerModeShowdown.preferences`;
- Candidate C destructive Apply requires `captureCareerModeRawRestoreSnapshot()` and fails closed when strict authority is unavailable;
- Service Worker/Cache Storage are application-byte authority only;
- scoring/gameplay/navigation authorities remain unchanged.

## Migration hazard

Historical all-time analytics currently infer manager identity from display names. The feature contract forbids silently treating equal names as the same person or changed spellings as different people.

Therefore this foundation must not auto-link Legacy records to manager profiles by normalized name. Historical manager-profile mapping is a later explicit-review stage. Stable Showdown/save identity can be migrated independently because existing Showdown IDs already identify individual rivalry records.

## Tool/environment history

A read-only attempt to clone the public repository through the execution container failed because the environment could not resolve `github.com`. No repository mutation occurred.

The first GitHub connector attempt to create this active handoff file was blocked by the connector safety layer before mutation. No branch content changed from that blocked call. The handoff was then published successfully through the Git object API path.

The first attempt to create the draft pull request with a full descriptive body was also blocked by the connector safety layer before mutation. A subsequent minimal connector call succeeded, creating PR #46, after which the PR body was updated successfully. No duplicate PR or issue was created.

## Foundation implementation checkpoint

Handoff bootstrap commit:

`cbc90700b37b9aa6dd703a94a8cbb977b76a6a25`

Foundation implementation head:

`c6da6f4324c1590949aab2da6233f0ccc5fecfa0`

Draft PR:

`#46 — Add Save Library identity foundation`

Base:

`908469d6034a9374b18d5d75f94fa371d8ad54a7`

Head before this documentation checkpoint:

`c6da6f4324c1590949aab2da6233f0ccc5fecfa0`

Exact changed implementation/test files at that head:

- `js/saveLibraryFoundation.js`
- `tests/contracts/save-library-foundation-contracts.cjs`
- `tests/support/run-contract-suite.cjs`
- this active handoff from the preceding bootstrap commit.

The foundation module is intentionally not loaded by `index.html`, `service-worker.js` or `js/optionalModules.js`. It cannot mutate production storage and does not change the deployed runtime identity.

### Identity and migration decisions

The foundation currently defines a future Save Library schema v1 and identity schema v1 as pure planning contracts only.

Proposed future registry key:

`careerModeShowdown.saveLibrary`

This key is not yet canonical runtime storage. The current production three-key model remains authoritative until a later separately proven atomic migration candidate changes that authority.

Stable migration IDs are deterministic SHA-256-derived opaque identifiers based on existing persisted identity, not display names or timestamps used as conflict authority:

- `save_*` derived from the existing Showdown ID when no stable save ID already exists;
- `season_*` derived from stable save ID plus canonical Season/round number;
- two initial `profile_*` identities for the current active Showdown are derived from stable save identity plus explicit player role.

Profile IDs are independent of the manager display-name string. Two managers named exactly the same remain different identities. Historical Legacy records that do not share the exact current Showdown identity are not auto-linked to profiles; they are emitted as `mappingRequired` for a later explicit review stage.

The migration planner fails closed when:

- active raw JSON is corrupt;
- Legacy raw JSON is corrupt or not an array;
- Legacy contains same-ID/different-content conflicts;
- a Showdown lacks an existing stable record ID;
- Season records have invalid or duplicate round numbers;
- a pre-existing Save Library is malformed or violates its schema.

A valid pre-existing Save Library returns `already-migrated` with no mutation candidate.

The raw planner currently models a future atomic migration candidate that would add the Save Library, rewrite migrated Legacy identity metadata and retire the singleton active slot while keeping preferences as an exact raw precondition. This is planning output only; no storage authority consumes or commits it in this candidate.

### Focused local evidence

The execution environment could not clone GitHub for a complete local repository suite, but the isolated candidate files were tested locally:

- `node --check js/saveLibraryFoundation.js` — pass;
- `node tests/contracts/save-library-foundation-contracts.cjs` — pass.

Focused contract coverage proves:

- deterministic repeated save/profile/Season ID migration;
- identical manager names remain distinct identities;
- unrelated historical Legacy names require explicit mapping;
- active + Legacy records with the same existing Showdown identity may reuse the explicit active profile mapping;
- exact duplicate Legacy entries dedupe deterministically;
- same-ID/different-content Legacy entries block migration;
- ambiguous duplicate Season numbering blocks migration before a candidate exists;
- corrupt raw source creates no mutation candidate;
- a valid existing Save Library makes migration idempotently non-mutating.

## Exact PR validation for foundation head

The exact implementation head `c6da6f4324c1590949aab2da6233f0ccc5fecfa0` passed all 13 normal PR workflow families together:

- Validate Candidate B Import Analysis `31758537159` — success;
- Validate V1 Visual Immersion `31758537190` — success;
- Validate League Confirmation `31758537214` — success;
- Validate Static App `31758537223` — success;
- Validate Candidate C Atomic Restore `31758537233` — success;
- Validate Home Bootstrap `31758537243` — success;
- Validate Final Polish `31758537244` — success;
- Validate Transfer Workstream `31758537254` — success;
- Validate Season Review `31758537259` — success;
- Validate Settings Workstream `31758537290` — success;
- Validate Licensed Football Visuals `31758537304` — success;
- Validate Stability Lane `31758537329` — success;
- Validate Statistics Workstream `31758537380` — success.

The Static App job `94639636935` explicitly executed the expanded repository contract suite and printed:

`PASS save-library foundation: deterministic identities, explicit historical mapping, conflict blocking and raw migration planning`

It also preserved the protected eager startup measurements at:

- raw: `164563` bytes;
- gzip: `37355` bytes.

Both remain under the locked `165000` / `37500` ceilings. The permanent workflow topology also remained 13 PR workflows / 27 executable blocks.

Candidate C's complete restore browser audit and the canonical Chromium Stability integration journey both passed at this exact implementation head. No test was weakened and no budget was raised.

## Current next action

Seal this checkpoint, verify the final PR head after the handoff-only commit, then merge PR #46 only if the normal repository gates remain green.

After merge, the next substantial candidate is canonical persistence integration: design and prove the four-key transition boundary needed to atomically create `careerModeShowdown.saveLibrary` while retiring `careerModeShowdown.activeShowdown`, without creating two canonical authorities, weakening Candidate C, or exposing multi-save UI prematurely.

Because that next step changes canonical persistence and transaction semantics, it is a distinct high-risk engineering task and should begin only from a freshly verified clean repository boundary with this handoff as authority.
