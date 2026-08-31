# Stage 5A Private Session Candidate Emulator Proof — 2026-08-31

Status: candidate protocol and emulator boundary proven; production publication deliberately excluded.

Application/runtime: `v1.8.1 / 1.8.1-r5` unchanged.

Fixed Remote Joining readiness: `87/100` unchanged. Candidate source, emulator identities, CI, PR publication and documentation receive zero production RJR credit.

Pull request: PR #173 `Implement Stage 5A private-session candidate boundary`.

Implementation proof head: `217d9d729774b23ab4fdf8c5cae842d993986a3f`, tree `21a96e44f2e606cc14cd6b54254544b456095036`.

## Implemented boundary

`js/sparkPrivateSession.js` is a separate dormant Stage 5A client. It is not loaded by the production shell and it does not modify `js/sparkConnectedRivalry.js`.

The client establishes:

- exact 256-bit private capability IDs in the form `session_` plus 64 lowercase hexadecimal characters;
- the reserved path `rivalries/{rivalryId}/sessions/{sessionId}`;
- exact data fields `rivalryId`, `hostAccountId`, `memberAccountIds`, `state`, `createdAt`, `expiresAt`, `lastActivityAt`, and `revokedAt`;
- lifecycle states `open | active | revoked | expired | closed`;
- a provider-verifiable Firebase ID-token `device_id` claim matching the caller's current registered device before any provider operation;
- active-account, active claimed-device and active exactly-two-account rivalry checks before each operation;
- host-only idempotent `open` creation;
- other-entitled-peer-only atomic `open -> active` join;
- immutable rivalry, host, creation, expiry and two-member authority;
- bounded host revoke, active-member close and member expiry;
- deterministic replay of an already accepted identical operation without revision or expiry extension;
- no transition out of `revoked`, `expired` or `closed`;
- SHA-256 envelope verification before trusting existing session authority.

The module exports no collection query or discovery API. It is memory-only and creates no localStorage, IndexedDB, Cache Storage, Candidate C, local Save or Connected Rivalry gameplay mutation.

## Candidate Rules isolation

`firestore.stage5a.rules` is a complete candidate copy of the reviewed production source plus two explicitly tagged Stage 5A regions. Outside those tagged regions, the deterministic contract reconstructs an exact byte match to `firestore.spark.rules`.

The candidate adds only:

- exact-capability `get` for the active entitled rivalry pair only when the ID-token `device_id` claim names the caller's current active registered device, including the missing-document preflight needed for deterministic create/retry;
- host/open create with a maximum 30-minute expiry;
- peer/open-to-active join;
- host revoke, active-member close and member expiry;
- immutable authority and CAS envelope requirements, with each mutation envelope's `updatedByDeviceId` equal to the active token claim;
- denial of list and delete.

The update path validates the new session base once and then applies the exact target-state transition guard. This keeps legitimate and forged request evaluation bounded while preserving fail-closed behavior.

Production `firestore.spark.rules` is unchanged at blob `2b7c0b166ae0aae7ab7a3ce84725b21091262484`. Root `firebase.json`, `firebase.production.rules.json` and `.firebaserc` are unchanged and do not reference `firestore.stage5a.rules`. No provider Rules publication occurred.

Production currently has no implemented or proven issuer for the candidate `device_id` custom claim. The candidate therefore fails closed with current production tokens and must not be described or published as functional production session authority.

## Deterministic client proof

`tests/contracts/stage5a-private-session-contracts.cjs` proves:

- exact capability generation and rejection of malformed IDs;
- missing or mismatched provider device credentials fail before provider access;
- no storage key, listing API, runtime script loading or Stage 4 module contamination;
- host open and exact replay without TTL extension;
- conflicting host, host self-join and third-account denial;
- peer observation and atomic join with exact replay;
- close, revoke and expiry with terminal no-resurrection;
- account, device and rivalry authority rechecks;
- provider outage before commit leaves remote fixtures and canonical local storage unchanged;
- candidate Rules isolation from production deployment authority.

The contract is included in the complete repository suite and in the permanent Stage 3/4/5A workflow family.

## Real Firestore emulator proof

PR #173 workflow `Validate Stage 3 Private Pairing` executes the real Firebase Firestore emulator with `firebase@12.17.0`, `@firebase/rules-unit-testing@5.0.1` and `firebase-tools@15.28.1`.

The Stage 5A fixture establishes three authenticated emulator accounts and registered devices, creates and redeems a legitimate exactly-two-manager rivalry through the real Stage 3 client, and then proves:

- host open, host retry and expiry immutability;
- peer exact read without collection or collection-group listing;
- exact read denial when the device claim is missing or names a never-registered device;
- anonymous and third-account read/join denial;
- host self-join denial and conflicting-host denial;
- immutable host, membership and expiry against forged updates;
- peer join and exact retry;
- delete denial;
- member close and retry;
- terminal join/resurrection denial;
- host revoke and retry with peer revoke denial;
- premature expiry denial followed by accepted bounded expiry and retry;
- malformed capability and third-account create denial;
- a mutation naming another active registered device is denied when it does not match the caller's token claim;
- revoked-device client, exact-read and direct-write denial;
- inactive-account client and direct-write denial;
- lost-rivalry-entitlement client and direct-write denial.

Initial head `f7e012e2a5a5d7eef80c72737f0498baa9986efd` passed the complete Stage 5A emulator matrix in workflow run `33346774156`, job `99352269382`. Provider logs also exposed expression-budget exhaustion on intentionally forged late-failing updates.

Evaluation-hardened head `708bb881dec7db65085dc8d9b447126605d00b38` shared the structural base validation and passed all 14 permanent pull-request workflow families. Its Stage 3/4/5A workflow run `33346922234`, job `99352686582`, completed SUCCESS with no Stage 5A expression-budget diagnostic. Automated review then correctly found that direct exact reads still lacked provider-verifiable current-device identity.

Corrected head `217d9d729774b23ab4fdf8c5cae842d993986a3f` binds reads and writes to the active `device_id` token claim. All 14 permanent workflow families passed. Exact Stage 3/4/5A run `33348247795`, job `99356433928`, passed both Stage 5A lanes, emitted the provider-verifiable credential PASS, contained 11 expected `PERMISSION_DENIED` outcomes after the Stage 5A boundary began, and contained no expression-budget or assertion diagnostic. Review thread `PRRT_kwDOTomsDM6dlgrC` / comment `3891100244` was answered with exact proof and resolved.

Emulator accounts, devices, rivalries and sessions are synthetic test mechanisms only. They are not production evidence and receive no RJR credit.

## Permanent exclusions and next boundary

This checkpoint does not:

- publish production session mutation Rules;
- load the client into production runtime;
- expose host/join UX;
- create or alter production accounts, devices, rivalries or sessions;
- change Firebase billing, Auth persistence, App Check enforcement or IAM;
- touch the protected historical rivalry;
- add public discovery, lobbies, matchmaking, community, profiles, rankings or leaderboards.

The next engineering slice is separate: establish the smallest provider-verifiable current-device credential issuance, refresh and revocation boundary that can safely supply `device_id`. Preserve zero billing and unbroadened trusted IAM unless later owner authority changes them. Do not publish production session Rules, activate runtime/UX or claim readiness credit until that credential exists and is proven.
