# START NEXT SESSION — r9 Shared Season Results / MDP 50.50 Safe Transfer

## Owner directive
Work relentlessly and honestly toward MDP 100. Maintain the existing MDP tracker and report MDP/item-MDP progress as lifecycle gates actually close. Do not award credit early. Interrupt the owner only when physical Chromebook + iPhone testing is genuinely required or when the work environment reaches transition time.

## Repository and authority
- Repository: `nikahanghojjati-oss/fifa17-career-showdown2`
- Active branch: `feat/ssjr-shared-season-results-r9`
- Exact final substantive pre-handoff head: `70c20f81176d9a571b41def886460b71594e2298`
- Parent/deployed r8 branch anchor: `05e2cee7282d771d326017614c04ecdfdbefa9f9`
- The handoff/continuity commit that adds this file necessarily advances the branch beyond the substantive head. The successor MUST independently resolve the exact live branch head before editing and must not combine CI or test evidence across different heads.

## Locked milestone state
- SSJR: `0/100`
- MDP: `50.50/100`
- Current MDP capability: Shared Season Results / `results-publication`
- Capability weight: `6.00` milestone points
- No new MDP credit was awarded in this session because the full milestone-specific implementation lifecycle stage has NOT closed.

Frozen MDP progression for this capability:
- `50.50 -> 52.60` only after complete milestone-specific implementation closes
- `52.60 -> 53.50` only after automated-test stage closes
- `53.50 -> 54.10` only after genuine defect-resolution work closes
- `54.10 -> 55.30` only after regression retest closes
- `55.30 -> 55.90` only after real product integration closes

Do not convert partial-core work into implementation credit.

## Permanent locks
- Firebase Spark only
- Billing permanently OFF
- No Cloud Functions
- No Cloud Run
- No paid infrastructure
- Exactly two private managers
- No public lobby/discovery/community/rankings
- Shared Season Results must not mutate canonical local Save during this r9 publication capability
- Shared scoring is NOT authoritative in this capability

## Work completed in this environment
### 1. r9 branch and baseline
The active r9 branch was confirmed cleanly anchored to deployed r8. The repository MDP ledger had previously been corrected to the genuine 50.50 baseline; that bookkeeping earned `MDP task delta +0.00`.

### 2. Existing local Season Results authority studied
Key local file:
- `js/seasonEngine.js`

The exact existing manager result payload is:
- `leaguePosition`
- `leaguePoints`
- `leagueGoals`
- `domesticCup`
- `championsLeague`
- `topScorer`
- `topAssist`

The local engine already has deliberate Review Results UX, draft fingerprinting, confirmation-time revalidation, scoring calculation, and immutable completed-season behavior. r9 should reuse the reviewed values and must not invent a second result schema.

### 3. r8 shared architecture studied
Exact precedents:
- `js/sharedTransferChallenge.js`
- `js/sparkSharedTransferChallenge.js`
- `js/productionSharedTransferChallenge.js`
- `firestore.transfer-challenge-production.fragment.rules`
- `tests/contracts/shared-transfer-challenge-contracts.cjs`
- `tests/contracts/shared-transfer-challenge-provider-contracts.cjs`
- `tests/browser/shared-transfer-challenge-replay-audit.cjs`

The proven architecture is:
1. provider-neutral deterministic protocol
2. Firebase Spark / Firestore authority adapter
3. production adapter that reuses existing UI while shared authority remains separate from canonical local Save

The r8 provider validates exact account, active device, rivalry, two-manager entitlement, active session, confirmed shared setup, and Career Start before every transaction. It uses public + role-private documents, monotonic revisions, operation hashes, exact actor-role ownership, and idempotent replay protection.

### 4. NEW r9 deterministic protocol committed
New file:
- `js/sharedSeasonResults.js`

Commit:
- `70c20f81176d9a571b41def886460b71594e2298`
- message: `feat(ssjr): add deterministic shared season results protocol`

Current protocol behavior:
- runtime revision `1.9.1-r9`
- roles: `playerOne`, `playerTwo`
- phases: `COLLECTING`, `RESULTS_READY`
- operation IDs: `season_result_op_<32 hex>`
- one immutable `publish-result` command per manager
- revision 1 after first manager publication
- revision 2 and `RESULTS_READY` after second publication
- stale base revision rejection
- idempotent replay acceptance for the exact same command
- idempotency conflict rejection for mismatched replay
- duplicate role publication rejection
- prior Shared Setup must be `SHOWDOWN_CONFIRMED` revision 6
- Career Start must be `CAREER_START_READY` revision 2
- current Shared Transfer Challenge must be `COMPLETED` for the same season
- first manager's payload remains hidden from opponent projection until both managers publish
- after both publish, both results are available in role projection
- `canonicalStorageMutation:false`
- `authoritativeScoring:false`
- `billingRequired:false`

Current bounded result validation in the deterministic protocol:
- `leaguePosition`: integer 1 through supplied league `teamCount`
- `teamCount`: integer 2 through 20
- `leaguePoints`: integer 0 through 114
- `leagueGoals`: integer 0 through 300
- four achievement values must be booleans

These upper bounds were introduced as an r9 security/data-integrity boundary. The successor should validate them against repository/product expectations before freezing Firestore Rules. If the product authority requires a different explicit maximum, change protocol + tests + Rules together before integration; do not silently diverge.

### 5. Local smoke validation performed before GitHub commit
The new deterministic protocol was checked with Node syntax validation and an isolated smoke harness. The following passed locally:
- syntax check
- first manager publish -> `COLLECTING`, revision 1
- opponent result hidden before both publish
- exact replay -> idempotent acceptance
- stale revision -> rejection
- second manager publish -> `RESULTS_READY`, revision 2
- opponent result visible after both publish
- third publication after ready -> rejection
- invalid team count -> rejection

IMPORTANT: this is local smoke evidence only. No repository contract test file was committed yet and no exact-head GitHub CI has been credited for r9.

## Immediate next task — do this first
Do NOT restart discovery. Continue r9 implementation from the committed deterministic core.

### A. Add repository deterministic contracts
Create:
- `tests/contracts/shared-season-results-contracts.cjs`

At minimum prove:
- factory and feature metadata
- r9 runtime revision
- Spark / zero-billing / no canonical storage flags
- exact seven-field result shape
- setup gate
- career-start gate
- transfer-complete same-season gate
- season range gate
- first publication
- role privacy before both publish
- second publication
- both-result projection only after ready
- stale revision
- duplicate role publication
- exact idempotent replay
- mismatched idempotency conflict
- numeric lower/upper boundaries
- non-boolean achievement rejection
- state hash tamper rejection
- immutable/frozen returned state

### B. Build Spark provider
Create:
- `js/sparkSharedSeasonResults.js`

Mirror the r8 provider authority pattern. Recommended Firestore model:
- public authority: `rivalries/{rivalryId}/seasonResults/season_{seasonNumber}`
- role-private result: `rivalries/{rivalryId}/seasonResults/season_{seasonNumber}/roles/{managerRole}`

Public document should contain only publication metadata before both managers submit, not the private result payloads. Role documents own the seven result values. Opponent role document must not be readable until public phase is `RESULTS_READY`.

Provider transaction prerequisites should include:
- active account
- active device
- live rivalry with exactly two active manager slots
- exact active two-account session
- shared setup confirmed revision 6
- Career Start ready revision 2
- current season transfer challenge public state `COMPLETED`
- actor role derived from rivalry entitlement, never caller supplied

Provider must enforce:
- exact base revision
- immutable one-time role publication
- operation-id replay semantics
- server timestamps
- no caller catalog/authority override
- no local storage / canonical Save mutation

### C. Add provider contracts
Create:
- `tests/contracts/shared-season-results-provider-contracts.cjs`

Mirror the r8 provider-contract harness and prove unauthorized/wrong-role/stale/duplicate/replay/privacy behavior.

### D. Add Firestore Rules fragment
Create:
- `firestore.season-results-production.fragment.rules`

Then update:
- `scripts/build-production-firestore-rules.mjs`

Rules must preserve Spark-only and zero billing. Deny list/delete. Enforce exact account/device/rivalry/session authority, one role document per actor role, exact allowed result fields and bounds, monotonic revision, operation arrays/hashes, and opponent privacy until `RESULTS_READY`.

Do not hand-edit generated production Rules as the primary source if the repository generator owns them.

### E. Build production adapter
Create:
- `js/productionSharedSeasonResults.js`

Integrate with the existing Season Results review flow. The preferred r9 behavior is:
- shared manager enters/reviews only their own result authority
- publication occurs only from a deliberate reviewed state
- no canonical local Save mutation at publication time
- UI communicates own publication / waiting for opponent / both results ready
- shared result publication does not silently call `persistCompletedSeason`
- authoritative scoring and Season Commit stay reserved for later roadmap capabilities

Study r8 runtime loading in `js/productionSharedTransferChallenge.js`, then update `js/optionalModules.js`, `index.html`, `service-worker.js`, or other loader/cache surfaces only as repository architecture actually requires.

### F. Automated integration proof
Update the relevant current-product manifest/suite only when the r9 capability is sufficiently integrated:
- `CURRENT_PRODUCT_TEST_MANIFEST.json`
- `tests/support/run-current-product-contracts.cjs`
- `package.json` only if required by existing patterns

Add browser/replay audit if needed, likely analogous to:
- `tests/browser/shared-transfer-challenge-replay-audit.cjs`

Run the complete permanent workflow family on one exact head. Never combine green checks from different SHAs.

## Manual testing status
NOT TESTING TIME YET.

Do not ask the owner for Chromebook + iPhone testing until automated implementation, provider/Rules contracts, production integration, exact-head CI and deployment prerequisites are green enough that physical two-device behavior is the actual remaining gate.

When that point is reached, explicitly tell the owner `TESTING TIME` and provide exact Chromebook + iPhone steps with expected result on each device.

## MDP accounting warning
Current score stays `50.50/100` at this checkpoint.

The deterministic core is meaningful implementation progress but is only part of the milestone-specific implementation stage. Do not raise to 52.60 merely because `js/sharedSeasonResults.js` exists. Raise only when protocol + provider + Rules + production adapter and required wiring together satisfy the complete implementation gate under the frozen MDP model.

## Handoff proximity
- Session handoff proximity: `100%`
- Reason: environment/context safety threshold reached after a clean substantive r9 protocol commit.
- This is TRANSITION TIME, not testing time.

## Successor startup sequence
1. Open this file first.
2. Independently fetch live `feat/ssjr-shared-season-results-r9` and resolve its exact head.
3. Verify `70c20f81176d9a571b41def886460b71594e2298` remains the final substantive pre-handoff commit and inspect any later continuity-only commit separately.
4. Fetch and inspect `js/sharedSeasonResults.js` from the live branch.
5. Reconfirm live `main`, production/runtime authority, current MDP ledger, and permanent zero-billing/Spark constraints before merging anything.
6. Continue immediately with `tests/contracts/shared-season-results-contracts.cjs` and `js/sparkSharedSeasonResults.js` rather than restarting roadmap research.
7. Keep reporting `SSJR 0/100 | MDP 50.50/100` until a real lifecycle gate closes.
8. Work toward MDP 100 until either owner physical testing is genuinely required or the next safe transfer threshold is reached.
