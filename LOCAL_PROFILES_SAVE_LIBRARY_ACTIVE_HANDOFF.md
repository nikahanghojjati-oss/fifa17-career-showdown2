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

The first GitHub connector attempt to create this active handoff file was blocked by the connector safety layer before mutation. No branch content changed from that blocked call. This handoff is being published through the Git object API path instead.

## Current next action

Implement and test the smallest coherent save-registry/identity foundation on this branch without changing production `main`, assigning a new release version, starting cloud work or weakening any existing recovery/performance/visual/gameplay lock.
