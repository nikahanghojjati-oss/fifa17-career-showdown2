# SUCCESSOR HANDOFF — POST-PR #154 EXACT ACCEPTED-RESULT REPLAY PROVEN / RJR 80

SLE = Smart Lean Efficient. This rule is mandatory for this successor and every later successor. A plain chat-only prompt or one unmirrored handoff is not a complete project transition.

## 1. Live-first authority

Repository: `nikahanghojjati-oss/fifa17-career-showdown2`

Public site: `https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/`

At the completed product checkpoint, PR #154 `Prove exact accepted-result idempotency replay` had exact final head `317121cd3298f2d452b079c06af53b21470be57b`. All 14 permanent PR workflow families succeeded on that exact unchanged head. PR #154 was mergeable, had zero submitted reviews and zero inline review threads, and live `main` had not drifted from the verified PR #153 base before merge.

PR #154 squash-merged under standing owner authorization as:

`141a7937a9e4cf580178c857dc6267e464f918aa`

The resulting 15 post-merge workflow/deployment runs all succeeded. GitHub Pages deployment succeeded and the post-merge Stability lane completed its contract, Chromium and deployed-site jobs, including runtime-byte verification and the deployed production journey.

Production application/runtime remains:

`v1.8.1 / 1.8.1-r3`

Runtime lineage remains PR #151 squash merge:

`beab9f31cb7f31bf4938f5b0df67394899ef12a0`

PR #154 is proof/authority hardening only. It does not change production runtime bytes, Firestore Security Rules, Firebase provider configuration, billing, canonical storage, Candidate C authority, Google Auth persistence/scopes, App Check enforcement, trusted-runtime IAM or Stage 5 session behavior.

This transition package is sealed from `agent/post-pr154-sle-handoff-seal`. The successor must independently fetch live `main`, any handoff-seal PR/merge state, exact checks, reviews/threads and current source authority. All SHAs in this handoff are orientation until independently revalidated; current live GitHub/source wins.

Standing owner authorization remains in force: after all required gates pass, merge and deploy without repeatedly requesting approval. A later explicit owner instruction overrides it.

## 2. Fixed Remote Joining readiness

Authority: `REMOTE_JOINING_READINESS.json`

Model: `RJR-1`

Fixed denominator: 100

Current score: `80/100`

Relevant evidence-backed movement:

- 76 → 78: repaired r3 ordinary-owner production proof restored exactly the two r2-invalidated Connected Account capabilities.
- 78 → 79: production-proven Stage 4 remote-to-local reconciliation earned exactly +1 for that previously explicit uncredited capability.
- 79 → 80: exact accepted-result idempotency replay earned exactly +1 for that previously explicit uncredited capability.

No duplicate points were awarded for PR count, workflow count, documentation, replay subassertions, receipt subassertions, helper corrections, screenshots or SLE/WEC work.

Current fixed domains remain:

- deterministic-sync-recovery: 20/20
- identity-auth-trust: 18/20
- production-cloud-security: 18/20
- devices-pairing-connected-rivalry-remote-join: 19/30
- real-device-hardening-release: 5/10
- total: 80/100

Still explicitly uncredited includes third-account/revoked-device production negatives, two-network/adverse-network/token-lifecycle hardening where still required, actual Stage 5 Private Remote Joining sessions, and final stable connected release acceptance.

## 3. Exact accepted-result replay capability now closed

Production runtime already contained the correct replay behavior, so this environment did not rewrite production mutation semantics merely to manufacture proof.

The focused permanent emulator proof is:

`tests/firebase/stage4-idempotency-replay-emulator.cjs`

It uses the real:

- `js/sparkConnectedRivalry.js`
- `js/sparkPrivatePairing.js`
- production `firestore.spark.rules`

The proof establishes the harder historical replay case:

1. an authoritative Connected Rivalry mutation is accepted at revision 0 using an immutable idempotency key/receipt;
2. a different legitimate mutation advances the same rivalry to revision 1;
3. the exact original accepted key/fingerprint is retried;
4. replay returns `ok: true`, `status: "replayed"`, the original accepted revision 0 and original accepted content hash;
5. current authoritative revision 1 and its current content/hash remain exactly unchanged;
6. the original accepted receipt remains exactly unchanged;
7. no duplicate receipt is created;
8. the tracked canonical local Save Library snapshot remains unchanged;
9. same-key/different-fingerprint reuse is rejected as `IDEMPOTENCY_CONFLICT`;
10. the other owner cannot use/read the accepting actor's receipt outside existing authority;
11. a genuinely new mutation based on stale revision 0 remains rejected as `STALE_BASE_REVISION`.

The Stage 3/4 permanent Firebase workflow now runs this focused proof after the existing Connected Rivalry emulator suite.

Important semantic lock: the normal UI creates a new idempotency key for a separate logical Publish click. Two separate manual Publish clicks are therefore two logical mutations, not an exact retry. The exact-replay boundary is reuse of the same immutable accepted key/fingerprint through the mutation/provider transaction path.

Do not repeat this proof merely to accumulate CI volume.

## 4. Publication evidence

Final exact PR head:

`317121cd3298f2d452b079c06af53b21470be57b`

PR workflow families required: 14

PR workflow families green: 14

Submitted reviews: 0

Inline review threads: 0

Mergeability before merge: true

Squash merge / published main:

`141a7937a9e4cf580178c857dc6267e464f918aa`

Post-merge workflow/deployment runs required: 15

Post-merge runs successful: 15

Pages deployment: success

Production runtime-byte/deployed-site Stability validation: success

No runtime revision bump occurred because the capability already existed and this PR changed evidence, permanent proof and authority pointers rather than production behavior.

## 5. Authority-coherence corrections made during PR #154

Moving fixed RJR from 79 to 80 exposed stale current-authority literals in older permanent contracts and successor pointers. These were treated as real consistency failures, not bypassed.

The corrections preserved historical provenance while advancing current truth. In particular:

- `NEXT_TASK.md`, `PROJECT_STATE.md`, `SESSION_BOOTSTRAP.json`, the compact SLE entrypoint and context graph were reconciled to RJR 80 / replay closed / production-negative authorization next;
- historical RJR 79 remains explicitly preserved as the pre-replay Stage 4 reconciliation checkpoint;
- historical r3 recovery RJR 76 remains history only;
- Stage 1 Cloud/Sync Phase 1A–1F and Stage 2A–2I remain closed and protected;
- PR #151 / `1.8.1-r3` runtime lineage remains exact;
- historical Trusted Shared Mutation Gateway wording remains provenance only and cannot revive completed work;
- permanent “14 workflow families” validation history remains explicit.

The first focused emulator candidate failed only because a test helper incorrectly assumed Firebase `withSecurityRulesDisabled` returned its callback value. That helper was corrected without weakening runtime, Rules, authorization, CAS or replay assertions.

A later sequence of Static/Stability failures was authority-coherence drift: old contracts still froze prior current-score/task wording. The final exact-head suite passed after current-versus-historical scope was made explicit. Do not interpret those corrected contract failures as product replay regressions.

## 6. IMMEDIATE NEXT TASK AFTER FULL STUDY

The next successor must not reopen replay or start a generic hardening program. The immediate product lane is:

`stage4-production-negative-authorization-proof`

Existing permanent emulator evidence already proves both likely candidates:

- third account: a registered third account cannot attach to the private two-owner rivalry and is denied with `permission-denied`;
- revoked device: a revoked Player Two device cannot publish authoritative Connected Rivalry state and is rejected with `CONNECTED_RIVALRY_DEVICE_REVOKED`; authoritative state remains unchanged.

Read-only predecessor audit also found that production client code exposes device-revocation machinery, but no normal production UI control invoking it was identified. Treat that as orientation only; confirm live source before relying on it.

Successor execution order:

1. independently verify live main, current RJR, current runtime, handoff-seal state and exact existing negative tests;
2. initialize a fresh unique WEC with reset counters and no inherited transition decision;
3. determine whether the existing deployed/runtime proof machinery can safely establish either third-account or revoked-device denial in real production without recreating owner setup or destructively changing useful rivalry state;
4. choose the smallest clean negative boundary, not both by default;
5. if a genuine product defect is discovered, repair only that defect through exact-head tests/reviews/merge/deploy;
6. if a production-only identity dependency cannot be automated, ask the owner only for the minimum specific action/evidence required;
7. after that one negative is closed, reassess fixed RJR evidence before selecting the next remaining hardening capability;
8. then assess two-network/adverse-network and token-lifecycle behavior one bounded capability at a time;
9. begin Stage 5 Private Remote Joining host/join/session orchestration immediately once fresh evidence shows the remaining explicit pre-Stage-5 gates are genuinely closed.

Private Remote Joining remains the highest long-term product priority. Prerequisites exist to reach it safely, not to postpone it indefinitely.

## 7. Do-not-repeat / owner-state hazards

Do not repeat completed owner proofs merely for duplication:

- destructive Candidate C remote-to-local Apply;
- consumed `pair_` + 64-zero unavailable-code fixture;
- historical deleted-identity rivalry recovery;
- r2/r3 Connected Account recovery incident;
- Stage 4 remote-to-local reconciliation;
- exact accepted-result replay.

The historical `pair_a07108...756fb` rivalry has deleted original local profile/save identities. Do not force/edit/delete it merely for testing.

Use existing current owner/account/rivalry state where possible. Do not create extra accounts, devices, pairings or destructive local/remote changes unless the chosen bounded proof genuinely requires them.

A direct sandbox `git clone` could not resolve github.com in the predecessor environment while the installed GitHub connector functioned normally. Prefer the connected GitHub tool; no owner action is required for that environment-local DNS limitation.

Usage remained unavailable/null. No predecessor usage percentage may be invented or inherited.

## 8. Permanent product/security locks

- exactly two private managers;
- canonical browser storage exactly:
  - `careerModeShowdown.saveLibrary`
  - `careerModeShowdown.legacyShowdowns`
  - `careerModeShowdown.preferences`
- `activeShowdown` remains non-canonical;
- Candidate A remains non-mutating export;
- Candidate B remains read-only import analysis;
- Candidate C remains sole destructive Apply authority;
- local-first startup/recovery must not depend on Firebase availability;
- Firebase remains Spark / zero billing;
- Firestore persistent cache remains disabled / memory-only;
- Google Auth remains popup-only with `browserSessionPersistence` and no extra OAuth scopes;
- App Check enforcement remains OFF;
- trusted-runtime IAM remains reviewed but unactivated/unbroadened;
- no public discovery, public profiles/community, matchmaking, public invitation directory or global rankings;
- display names never authorize;
- Stage 5 session work remains locked until the remaining explicit pre-Stage-5 evidence gates close.

## 9. Closing WEC / transition

Closing environment:

`we-2026-08-25-stage4-idempotency-replay`

This environment completed its bounded capability and publication checkpoint. Its transition decision is predecessor-only. The successor must validate the facts, archive them as orientation, create a new environment identifier, reset per-environment counters and make its own WEC decision.

Usage is `null/unavailable`; do not fabricate it.

The current environment reached the handoff point because the replay milestone and publication chain are complete while the next task is a distinct production-negative authorization milestone. No new substantial milestone belongs in this environment.

## 10. SLE successor package

Compact starter:

`START_NEXT_SESSION_V1.4.21_PR154_MERGED_POSTMERGE_GREEN.md`

Compact mirror:

`project-documents/session-starts/START_NEXT_SESSION_V1.4.21_PR154_MERGED_POSTMERGE_GREEN.md`

Stable compact entrypoint:

`project-documents/START_NEXT_SESSION.md`

Canonical full handoff:

`SUCCESSOR_HANDOFF_POST_PR154_EXACT_REPLAY_PROVEN_SLE_2026-08-25.md`

Full handoff mirror:

`project-documents/handoffs/SUCCESSOR_HANDOFF_POST_PR154_EXACT_REPLAY_PROVEN_SLE_2026-08-25.md`

Machine bootstrap:

`SESSION_BOOTSTRAP.json`

Context graph:

`SESSION_CONTEXT_GRAPH.json`

Current task authority:

`NEXT_TASK.md`

Current product state:

`PROJECT_STATE.md`

RJR authority:

`REMOTE_JOINING_READINESS.json`

WEC authority:

`WORK_ENVIRONMENT_STATUS.json`

At every future Handoff proximity 100%, recursively generate the complete mirrored SLE package, refresh genuinely changed current pointers, seal WEC, and stop before another substantial milestone.

## 11. Required owner-facing format

Handoff proximity: X%
Remote Joining readiness: ~Y%
Current lane: ...
Concrete dependency completed: ...
Next unlock: ...
Blocker: ...
Sidequest check: ...
