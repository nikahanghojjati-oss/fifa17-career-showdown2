# FIFA 17 Career Mode Showdown — SLE Successor Handoff — Stage 4 Production Proof to Reconciliation

Date: 2026-08-24 ET
Closing environment: `we-2026-08-22-stage4-human-appcheck-proof`
Closing decision: `HANDOFF_AT_CHECKPOINT` — closing environment only; successor must not inherit it.

## 1. Mission

Continue the FIFA 17 Career Mode Showdown PWA for owner Hawk / `nikahanghojjati-oss`. Highest long-term priority remains complete Private Remote Joining, advanced dependency-first and stability-first without sidequests or repeated setup.

Repository: `nikahanghojjati-oss/fifa17-career-showdown2`
Public site: `https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/`

This handoff is orientation, not live authority. Current source, live GitHub/provider/deployment state and later owner instructions win. Independently verify live `main`, the checkpoint branch/PR, changed files, exact PR head/checks/reviews/threads/mergeability and provider evidence when relevant. Validate/archive the predecessor WEC, initialize a fresh unique WEC with reset counters, and assess again before mutation.

## 2. Exact authority chain

- Stage 3 production baseline: PR #129 merge `5d254cea6e4deebd2aac79effeda30dcc3048385`.
- Immutable Stage 4 source seal: `7336adda832322bbd93e8c16f3de0e4bbf5273c1`.
- Production-published Stage 4 Firestore Rules blob: `ecc8ccb2ab50f0f7057ab3170eb080ad9e36025f`.
- PR #130 Stage 4 Connected Rivalry merge: `d0eb160d62a05ebdc5c68b5b79447ce1fedffc05`.
- PR #131 r2 release merge: `ce09cbef6030bcd1329121be556ba4da2fe20fd2`.
- Current production application/runtime identity: `v1.7.0 / 1.7.0-r2`.
- Previous whole-shell recovery fallback: `1.6.0-r1`; never use potentially mixed `1.7.0-r1` cache as recovery authority.
- PR #133 diagnostic merge: `d3ae21ebfded08e45d9a0db61cf22948e1539df3`.
- Continuity-only PR #134 / verified pre-proof live main: `6d1e5f55e666eebbf5a9527eb0db5e93f6e18d60`.
- Production proof record: `PRODUCTION_STAGE4_CONNECTED_RIVALRY_PROOF_2026-08-24.md`.
- Fixed readiness ledger: `REMOTE_JOINING_READINESS.json`, RJR-1 `77/100`.

The evidence branch is `agent/stage4-human-appcheck-production-proof`, with closing checkpoint PR #135. Before SLE packaging its remote head was `fb038ed748b230045c55f06402062261d801d2b9`; the final package/WEC seal necessarily advances it. Resolve PR #135's current exact head/checks/reviews/threads/merge state from GitHub rather than assuming the pre-package SHA.

Two old open draft PRs, #35 and #37, may still appear in repository search. They are legacy v1.2/v1.3 work and do not supersede the current Stage 4 authority. Do not modify or merge them as part of this lane.

## 3. Ordinary-browser App Check proof

Owner-supplied production diagnostics from ordinary Chrome reported:

- `status: ready`;
- `attempted: true`;
- `connected: true`;
- `tokenObserved: true`;
- provider `recaptcha-enterprise`;
- Firebase SDK `12.17.0`;
- memory-only Firestore;
- popup-only `browserSessionPersistence`;
- bounded Stage 4 browser write scope.

The diagnostic object did not contain the raw App Check token. No API key, site key, raw token, complete private rivalry code or screenshot was committed. App Check enforcement remains OFF. This genuine owner-controlled browser result resolves the earlier headless-CI attestation limitation without enabling a production debug provider or changing provider security.

## 4. Genuine Connected Rivalry production proof

The exact evidence is classified in `PRODUCTION_STAGE4_CONNECTED_RIVALRY_PROOF_2026-08-24.md`.

First Chromebook rivalry:

1. Player Two / Lil verifies the existing private rivalry, refreshes an unpublished base and publishes authoritative revision 0.
2. Distinct incognito Player One / Tyuu refreshes the same rivalry and observes revision 0.
3. Both paths preserve local-only behavior; there is no local Apply or reported local-save overwrite.

Second independent iPhone rivalry:

1. Player Two / Gop publishes authoritative revision 0.
2. Unrefreshed Player One / Nik receives the intended stale-base rejection with refresh guidance and no local-save change.
3. Player One / Nik refreshes safely to revision 0.
4. Player One / Nik publishes exactly once and advances monotonically to revision 1.
5. Player Two / Gop refreshes and converges on revision 1.

The owner explicitly reported using the installed Career Mode app and Safari on one physical iPhone. Credit this only as bounded mobile cross-surface hardening, not as two-physical-device or two-network proof. The two rivalries are distinct and must never be conflated.

## 5. RJR-1 reconciliation

RJR moves only for genuine fixed-domain capability:

- `69 -> 72`: entitled attach, initial revision-0 publication and cross-manager revision-0 read;
- `72 -> 74`: stale-base rejection and bounded iPhone cross-surface hardening;
- `74 -> 77`: stale recovery, monotonic revision-1 update and cross-manager revision-1 convergence.

No points are awarded for screenshots themselves, commits, documentation, CI, WEC/SLE packaging, repeated revision-0 behavior or unproven negative paths.

Still uncredited: exact idempotency replay; same-key/different-request production conflict; third-account and revoked-device production negatives; two-physical-device/two-network hardening; adverse network/token expiry/sleep-wake behavior; remote-to-local reconciliation; Stage 5 sessions; final stable Remote Joining acceptance.

## 6. Current implementation-authorization boundary

`NEXT_TASK.md` is the sole implementation authority. The completed first-slice override explicitly prohibited remote-to-local destructive Apply. Production proof does not silently expand that authorization.

This checkpoint therefore selects, but does not start, the next prerequisite: a bounded remote-to-local reconciliation slice under Candidate C recovery authority. A fresh successor must verify live authority, initialize a fresh WEC and, if its assessment permits, activate the candidate atomically in `NEXT_TASK.md` with the real engineering change. Do not insert a documentation-only prerequisite PR.

The candidate must include:

1. remote read/preview remains non-mutating by default; no automatic Apply;
2. immutable observed remote revision/hash and exact local target identity;
3. explicit confirmation tied to immutable intent;
4. canonical backup completed before Apply;
5. Candidate C as sole destructive local Apply authority;
6. transaction-owned mutation, stale-state rejection and anti-clobber checks;
7. ownership-scoped reverse rollback and exact recovery verification;
8. unmistakable observed-remote versus committed-local UI;
9. focused contract/browser validation and genuine production proof before Stage 5.

## 7. Locked product/security boundaries

- App Check enforcement remains OFF.
- Firebase Spark / zero billing remains mandatory.
- Firestore persistent cache remains disabled/memory-only.
- Google Auth remains popup-only `browserSessionPersistence` with no extra scopes.
- No Blaze, Cloud Run, Cloud Functions or Firebase Storage.
- Canonical localStorage remains exactly `careerModeShowdown.saveLibrary`, `careerModeShowdown.legacyShowdowns`, `careerModeShowdown.preferences`; `activeShowdown` is non-canonical.
- Candidate A remains non-mutating export.
- Candidate B remains read-only import analysis.
- Candidate C remains the sole destructive local Apply authority.
- Client `baseRevision` remains immutable across retries; no silent rebase or last-writer-wins.
- Exact idempotency replay must not increment revision; same key with a different request must conflict.
- Tombstoned shared state cannot be resurrected by ordinary publish.
- Exactly two managers; no public discovery/community/matchmaking/invite directory/global leaderboard/rankings.
- Stage 5 session documents and orchestration remain blocked.
- Do not republish Rules blob `ecc8ccb2ab50f0f7057ab3170eb080ad9e36025f` absent a reviewed change or concrete regression.
- Do not repeat Firebase/App Check/account/device/pairing setup or the completed human proof absent concrete regression evidence.

## 8. GitHub and tooling facts

The connected GitHub app is authenticated as `nikahanghojjati-oss` with repository admin/write capability and remains the primary GitHub authority.

The repository bootstrap installed checksum-verified local `gh` 2.98.0 under the ignored environment-local tool directory. It had no local CLI authentication and was not needed because the connected GitHub route covered required reads/writes. Do not ask the owner to authenticate `gh` unless a future task has a concrete gh-only gap. Never extract or inject connector credentials into the CLI. Neither binary nor CLI auth should be promised as inheritable across future isolated Work environments; record the routing fact and bootstrap only when genuinely useful.

The Work-layer `npm run work:continuity:validate` request disconnected before approval completion. Direct `node scripts/work-environment-continuity.mjs validate` passed. One later shell search had a quoting error and was immediately corrected. The Work-layer `npm run test:contracts` request also disconnected before approval completion; the exact underlying direct Node commands then passed all 68 contract files. These are recorded as three recoverable route/tool errors; no product/provider mutation resulted.

## 9. WEC/SLE transition

The decision-trigger assessment returned `HANDOFF_AT_CHECKPOINT`: context pressure 97/100, quality risk 18/100, usage unknown, handoff readiness 98/100, continuation risk 64.2/100 and transition advantage 44.5. Later recoverable packaging-route errors are preserved separately in the final WEC rather than retroactively changing that exact earlier output. The decisive facts were high context pressure plus a distinct next milestone with a strong handoff package. The decision belongs only to `we-2026-08-22-stage4-human-appcheck-proof`.

A successor must verify the closing checkpoint, archive this status/history, create a fresh unique WEC, reset counters, set the exact reconciliation candidate only when activated with code, and run a fresh assessment. Usage remains unavailable and must not be estimated.

At the successor's own Handoff proximity 100%, repeat the complete Smart Lean Efficient package and stop before another substantial milestone.

## 10. Mandatory SLE continuity language

SLE = Smart Lean Efficient.

IMMEDIATE NEXT TASK AFTER FULL STUDY: verify the production-proof checkpoint, initialize a fresh WEC, then atomically activate and implement the smallest Candidate-C-governed remote-to-local reconciliation slice if the new assessment permits; Stage 5 remains blocked.

Standing owner authorization remains active: after all required tests and mandatory gates pass, merge and deploy without asking for repeated owner approval, while preserving exact-head protection and deployment verification.

Remote Joining readiness: 77/100. Move it only for newly proven fixed-domain production capability.

Every substantive owner-facing project response must end with these seven lines in this order:

Handoff proximity: X%
Remote Joining readiness: X/100
Current lane: ...
Concrete dependency completed: ...
Next unlock: ...
Blocker: ...
Sidequest check: ...
