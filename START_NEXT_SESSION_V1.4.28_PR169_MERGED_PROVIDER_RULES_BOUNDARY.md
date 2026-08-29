# START NEXT SESSION — V1.4.28 — PR #169 MERGED / PROVIDER RULES BOUNDARY

## PURPOSE

Continue the FIFA 17 Career Mode Showdown Private Remote Joining work toward RJR 100 from the clean PR #169 provider-security boundary.

Treat this file as orientation only. Current repository source, live GitHub state, Firebase/provider-authoritative state, production deployment evidence and later owner instructions always win.

Do not inherit the predecessor environment's transition decision as the successor environment's initial decision.

---

## PREDECESSOR ENVIRONMENT

Environment ID:

`we-2026-08-29-rjr-provider-security-deployment-path`

Final predecessor decision:

`HANDOFF_AT_CHECKPOINT`

Handoff proximity at predecessor stop:

`100%`

That 100% refers only to environment-transition proximity. It does not mean Remote Joining Readiness is complete.

Required successor sequence:

1. Independently verify current live main, PR #169, exact merge SHA and current deployment/provider evidence.
2. Read `WORK_ENVIRONMENT_STATUS.json` and validate/archive the predecessor WEC.
3. Initialize a fresh unique successor WEC.
4. Reset every per-environment counter; never copy predecessor counts as successor state.
5. Record the actual current live main SHA.
6. Run the fresh successor WEC assessment.
7. Obey only the successor environment's own decision.
8. Re-read `REMOTE_JOINING_READINESS.json` before changing RJR. Never award score for implementation, CI, PR, merge, documentation or deployment-path existence alone.

---

## LAST VERIFIED LIVE MAIN

At predecessor closeout:

`cbdc8cbf12f53b1bb60e6e1306f070a11ae6ccbc`

This is the squash merge of PR #169:

`Add isolated production Firestore Rules deployment path`

PR #169 final exact sealed head:

`534c0a9f97aa1f6000a591fb3d0612b8ac4b6f6d`

PR #169 merged:

YES

Merge commit:

`cbdc8cbf12f53b1bb60e6e1306f070a11ae6ccbc`

The successor must independently verify that main has not moved before relying on this SHA.

---

## PR #169 EXACT-HEAD VALIDATION

The unchanged final sealed head `534c0a9f97aa1f6000a591fb3d0612b8ac4b6f6d` passed all 14 permanent workflow families before merge:

1. Validate Season Review — run `33233379850` — SUCCESS
2. Validate Final Polish — run `33233379862` — SUCCESS
3. Validate Transfer Workstream — run `33233379880` — SUCCESS
4. Validate Statistics Workstream — run `33233379852` — SUCCESS
5. Validate Home Bootstrap — run `33233379908` — SUCCESS
6. Validate Candidate B Import Analysis — run `33233379857` — SUCCESS
7. Validate League Confirmation — run `33233379899` — SUCCESS
8. Validate V1 Visual Immersion — run `33233379841` — SUCCESS
9. Validate Settings Workstream — run `33233379853` — SUCCESS
10. Validate Stability Lane — run `33233379885` — SUCCESS
11. Validate Static App — run `33233379846` — SUCCESS
12. Validate Licensed Football Visuals — run `33233379838` — SUCCESS
13. Validate Stage 3 Private Pairing — run `33233379860` — SUCCESS
14. Validate Candidate C Atomic Restore — run `33233379893` — SUCCESS

The Stability Lane's long Chromium journey completed successfully. The Static App and Stage 3 gates also exercised the repository/Firebase emulator contract suites.

A second Codex review was explicitly requested on the final head after corrections. No second review result was posted before publication. Publication relied on the complete 14-family exact-head gate, mergeability, and zero unresolved known review threads; do not falsely claim a second Codex review completed.

---

## PR #169 CORRECTED FAILURES

Do not hide or regress these corrected branch-local failures.

### 1. Wrong strengthened-Rules helper names in the first new contract

The initial deployment-path contract asserted helper names that were not present in `firestore.spark.rules`.

It was corrected to lock the actual strengthened Rules helpers and authorization structure, including:

- `signedIn()`
- `activeDevice(deviceId)`
- `activePairedRivalry(rivalryId)`
- `currentlyEntitled(rivalryId)`
- participant membership through `request.auth.uid in rivalry.data.data.authorizedAccountIds`
- rivalry get authorization through `currentlyEntitled(rivalryId) || capabilityCanReadPendingRivalry(rivalryId)`
- final deny fallback `allow read, write: if false`

### 2. Incorrect copied Phase 1F demo project ID

The first new contract/guide/WEC used the wrong root Firebase demo project identity.

Live `.firebaserc` proves the protected historical values are:

Default:

`demo-career-mode-showdown-phase1f`

Existing named production alias:

`fifa17-career-showdown-prod`

The corrected PR preserves both and does not make production the default.

### 3. Abbreviated App Check lock

The fresh WEC initially abbreviated the permanent App Check boundary too aggressively and failed the existing boundary contract.

The corrected invariant is explicit:

`App Check enforcement OFF`

Both automated inline review findings were fixed, replied to and resolved before merge.

---

## POST-MERGE GITHUB PAGES

GitHub Pages deployment run:

`33233575696`

Exact head:

`cbdc8cbf12f53b1bb60e6e1306f070a11ae6ccbc`

Result:

`SUCCESS`

Critical classification:

This is GitHub Pages static publication only.

It does NOT prove Firebase Firestore Rules publication, Firebase provider state, provider authorization enforcement or any RJR scoring event.

PR #169 contains no product runtime feature change. The established production application/runtime authority therefore remains:

Application:

`v1.8.1`

Runtime:

`1.8.1-r5`

Known-good rollback runtime:

`1.8.1-r4`

The successor must independently verify current runtime/deployment evidence if a later change has occurred.

---

## FIXED RJR AUTHORITY

Current fixed RJR-1 at predecessor stop:

`85/100`

Do not increase it merely because PR #169 exists, passed tests, merged or deployed to GitHub Pages.

No direct Firebase provider publication of strengthened `firestore.spark.rules` and no new legitimate production authorization-negative observation occurred in the predecessor environment.

The remaining score gaps are still real capability/evidence gaps, not paperwork gaps.

Current fixed-domain gaps include:

- authenticated third-account and revoked-device production authorization negatives
- direct provider-backed strengthened security publication/acceptance
- provider-backed revoked-device enforcement rather than only the client pre-write guard
- real two-physical-device/network Remote Joining hardening where still required by the scoring authority
- actual Remote Joining sessions
- final stable Remote Joining release acceptance

Always re-read current `REMOTE_JOINING_READINESS.json` because later evidence may have changed the score after this handoff.

---

## MATERIAL RESULT OF PR #169

PR #169 removes deployment ambiguity without changing the protected historical emulator lane.

### New isolated config

`firebase.production.rules.json`

It is deliberately separate from root `firebase.json` and targets only:

`firestore.spark.rules`

It contains no Hosting, Functions, Storage, Auth, App Check, IAM, billing or Firestore indexes deployment configuration.

### New deployment authority guide

`PRODUCTION_FIRESTORE_RULES_DEPLOYMENT.md`

Exact bounded CLI command:

`firebase deploy --config firebase.production.rules.json --project fifa17-career-showdown-prod --only firestore`

The project is explicit. Never rely on the root default for this production mutation.

### Permanent contract

`tests/contracts/production-firestore-rules-deployment-path-contracts.cjs`

It protects all of these facts:

- root `firebase.json` remains `firestore.rules`
- root `.firebaserc` default remains `demo-career-mode-showdown-phase1f`
- existing `.firebaserc` production alias remains `fifa17-career-showdown-prod`
- the isolated production config targets `firestore.spark.rules`
- the isolated config remains a single default-database object with no indexes entry
- the historical provider manifest cannot silently claim the strengthened source is deployed
- the exact production command remains explicit and bounded
- provider publication remains unverified until direct provider evidence exists

---

## PROVIDER FIRESTORE RULES NONCLAIM

Production Firebase publication of strengthened:

`firestore.spark.rules`

remains:

`UNVERIFIED`

Do not infer provider state from any of these:

- repository source
- emulator tests
- GitHub CI
- PR #169 review/merge
- GitHub Pages deployment
- existence of `firebase.production.rules.json`
- existence of `PRODUCTION_FIRESTORE_RULES_DEPLOYMENT.md`

`firebase.production.environment.json` still correctly records the older provider-verified production Rules source:

`firestore.rules`

Do not rewrite that field to `firestore.spark.rules` until new direct provider-authoritative evidence proves the strengthened Rules were actually published.

A Firebase CLI success exit is useful deployment evidence but is not by itself enough for RJR credit. Capture direct provider-authoritative verification of the production `(default)` Rules state and then execute the relevant legitimate production authorization acceptance.

---

## AUTONOMOUS ROUTES EXHAUSTED BY PREDECESSOR

The predecessor independently checked for a way to close the provider gap without owner intervention.

Unavailable in that environment:

- Firebase connector
- Google Cloud connector
- repository provider credential path
- exposed service-account credential
- already-authorized local Firebase CLI route
- GitHub Pages provider authority

Do not waste another environment repeating these checks merely for confidence unless the available tool/connectivity set is materially different.

If the successor itself has a genuine authenticated Firebase/provider route, use it directly and efficiently.

If not, this is now a legitimate owner-required boundary.

---

## PREFERRED NEXT OWNER-REQUIRED UNLOCK

If no autonomous authenticated Firebase route exists in the fresh successor, ask the owner only for the smallest provider action that cannot be done by the environment.

Preferred browser-first route:

1. Open Firebase Console for production project `fifa17-career-showdown-prod`.
2. Open Firestore Database → `(default)` → Rules.
3. Replace the editor with the exact current repository `firestore.spark.rules` source without hand editing.
4. Publish.
5. Capture direct provider-authoritative evidence of the published Rules state/version.

The successor should fetch the exact current `firestore.spark.rules` from live main before giving the owner pasteable code. Do not rely on a stale handoff copy.

If the owner instead has an already-authenticated Firebase CLI route, the isolated exact command is available in `PRODUCTION_FIRESTORE_RULES_DEPLOYMENT.md`.

Do not ask the owner to enable billing, create a service account, broaden IAM, turn on App Check enforcement or change unrelated Firebase settings merely to publish these Rules.

---

## NEXT PRODUCTION AUTHORIZATION ACCEPTANCE

After strengthened Rules publication is directly provider-authoritative, select the smallest legitimate acceptance evidence that actually exists.

### Preferred third-account read-only proof if legitimate state already exists

Use the deployed production authorization acceptance surface only if the owner already has:

1. a legitimate existing active Connected Account
2. that account is neither manager in the target rivalry
3. a legitimate existing active paired rivalry
4. explicit confirmation the signed-in account is neither manager
5. explicit confirmation the rivalry is legitimate and active

The probe performs exactly two Firestore reads and zero writes:

`rivalries/{rivalryId}`

`rivalries/{rivalryId}/state/authoritative`

Both must be denied by the provider and browser storage must remain unchanged for an eligible evidence candidate.

Never create a fake third account or alter a rivalry merely for scoring.

### Revoked-device path if legitimate state already exists

The existing client registration guard returning:

`PRIVATE_DEVICE_REVOKED`

before provider mutation staging is prerequisite-only evidence.

It is not Firestore Rules mutation-denial proof and earns zero RJR by itself.

Only credit a revoked-device provider boundary when a legitimate existing revoked registered device is actually exercised through the provider-backed boundary required by the current scoring authority.

---

## STAGE 5

Stage 5 remains:

`LOCKED`

Do not begin actual host/join/session orchestration merely because the repository deployment path is clean.

Stage 5 must remain locked until its explicit prerequisites genuinely close under current live authority.

When the prerequisite evidence is genuinely complete, the successor may reassess Stage 5 using current source and RJR authority. Do not inherit an old lock or unlock blindly.

---

## PERMANENT LOCKS

Preserve all of these unless a later explicitly authorized architecture change supersedes them:

- Exactly two private managers.
- Canonical local browser storage remains `careerModeShowdown.saveLibrary`, `careerModeShowdown.legacyShowdowns`, `careerModeShowdown.preferences`.
- `activeShowdown` remains non-canonical.
- Firebase remains Spark / zero billing.
- Firestore client persistence remains memory-only.
- Google Auth remains popup-only with `browserSessionPersistence`.
- No extra Google/Auth scopes.
- App Check enforcement OFF.
- Trusted-runtime IAM remains unactivated and unbroadened.
- Public discovery, community, matchmaking and global rankings remain prohibited.
- Historical rivalry `pair_a07108...756fb` must not be forced, edited or deleted.

---

## CONSUMED PROOF — DO NOT REPEAT MERELY FOR CONFIDENCE

Do not repeat already-consumed:

- owner/device proof
- Candidate C destructive reconciliation proof
- exact replay proof
- adverse-provider proof
- token-lifecycle proof
- structural-abuse proof
- sustained-rate-limit proof
- production rollback/restoration proof

Repeat consumed proof only if a genuine changed precondition or proven regression makes it necessary.

---

## AUTHORITY POINTER STALENESS

`NEXT_TASK.md` and `PROJECT_STATE.md` may still contain older PR #167 / pre-PR #168 transition wording.

This is known and deliberate context, not authority to roll back current state. PR #168 previously attempted a premature `NEXT_TASK.md` rewrite and CI correctly rejected it; that change was reverted.

Do not rewrite these authority pointers cosmetically in isolation.

If the fresh successor updates them, do so only as part of a coherent contract-safe authority reconciliation grounded in current live main, current WEC, current RJR authority and current provider evidence.

At startup, newer live repository facts, current WEC, this successor handoff, actual GitHub state and direct provider state win over stale pointer prose.

---

## PENDING CANONICAL WEC HISTORY APPEND

The connected GitHub write surface used by the predecessor could replace whole files but could not safely append to the large canonical `WORK_ENVIRONMENT_HISTORY.md` without reconstructing historical content.

Therefore predecessor and current closure records are stored additions-only in:

`WORK_ENVIRONMENT_HISTORY_APPEND_PR168_PROVIDER_SECURITY_2026-08-29.md`

A future environment with an append-capable route should:

1. append those records verbatim to `WORK_ENVIRONMENT_HISTORY.md`
2. verify the canonical history change is additions-only
3. delete the pending payload in the same bounded continuity checkpoint

Do not rewrite or truncate canonical history to eliminate this payload.

---

## IMMEDIATE NEXT TASK AFTER FULL STUDY

1. Independently verify current live `main` and do not assume `cbdc8cbf12f53b1bb60e6e1306f070a11ae6ccbc` is still current.
2. Verify PR #169 merged state, final head and merge SHA.
3. Verify current GitHub Pages deployment/runtime state and distinguish it from Firebase provider state.
4. Read and reconcile at minimum:
   - `REMOTE_JOINING_READINESS.json`
   - `WORK_ENVIRONMENT_STATUS.json`
   - `firebase.production.environment.json`
   - `firebase.production.rules.json`
   - `PRODUCTION_FIRESTORE_RULES_DEPLOYMENT.md`
   - `firestore.spark.rules`
   - `NEXT_TASK.md`
   - `PROJECT_STATE.md`
   - `SESSION_BOOTSTRAP.json`
   - `00_DEVELOPER_START_HERE.md`
   - `00_CURRENT_HANDOFF.md`
   - current permanent workflow topology
5. Validate/archive predecessor WEC `we-2026-08-29-rjr-provider-security-deployment-path`.
6. Initialize a fresh unique successor WEC with reset counters and current live main SHA.
7. Do not inherit predecessor `HANDOFF_AT_CHECKPOINT`.
8. Preserve fixed RJR-1 at `85/100` unless genuinely new evidence under the current scoring authority justifies a bounded change.
9. Check once whether the successor has a genuine authenticated Firebase/provider route that the predecessor lacked.
10. If such a route exists, directly publish/verify strengthened `firestore.spark.rules` using the isolated production path while preserving every permanent lock.
11. If no such route exists, ask the owner for only the smallest browser-first Firebase Console publication/verification action. This is a genuine owner-required boundary, not a side quest.
12. After direct provider verification, select the smallest legitimate production authorization-negative acceptance supported by real existing account/device/rivalry state.
13. Do not fabricate third-account eligibility, revoked-device state or provider evidence.
14. Recalculate RJR only for genuinely new verified capability evidence.
15. Keep Stage 5 locked until its explicit prerequisites genuinely close.
16. Continue toward RJR 100 with maximum accuracy, minimum side quests and no duplicate scoring.

---

## HANDOFF PROXIMITY GOVERNANCE

Predecessor handoff proximity:

`100%`

The fresh successor must reset and independently assess its own handoff proximity.

When the successor itself reaches 100%:

1. finish only its current safe bounded checkpoint
2. generate a complete recursive successor handoff
3. record all live state, evidence, locks, corrected failures and unresolved work
4. stop before beginning another substantial milestone

---

## CURRENT CHECKPOINT SUMMARY

Handoff proximity:

`100%`

Remote Joining Readiness:

`85/100`

Stage 5:

`LOCKED`

Production application authority:

`v1.8.1`

Production runtime authority:

`1.8.1-r5`

Known-good rollback runtime:

`1.8.1-r4`

Last verified live main at predecessor closeout:

`cbdc8cbf12f53b1bb60e6e1306f070a11ae6ccbc`

PR #169:

`MERGED`

PR #169 final sealed head:

`534c0a9f97aa1f6000a591fb3d0612b8ac4b6f6d`

PR #169 exact-head permanent gate:

`14/14 SUCCESS`

Post-merge GitHub Pages run:

`33233575696 — SUCCESS`

Strengthened production Firestore Rules publication:

`UNVERIFIED`

Primary next unlock:

Direct authenticated provider publication and provider-authoritative verification of current `firestore.spark.rules`, followed by the smallest legitimate production authorization-negative acceptance.

Current genuine blocker:

The predecessor had no authenticated Firebase/provider authority route. If the fresh successor also lacks one, the owner must perform the minimal provider-side publication/verification action. No further repository-only work can legitimately close that scoring gap.
