# START NEXT SESSION — v1.4.22 — PR #158 MERGED / POST-MERGE GREEN / RJR 81

SLE = Smart Lean Efficient.

Repository: `nikahanghojjati-oss/fifa17-career-showdown2`
Public site: `https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/`
Canonical starter: `START_NEXT_SESSION_V1.4.22_PR158_MERGED_POSTMERGE_GREEN.md`

Treat this starter and every handoff as orientation only. Current source, live GitHub/provider/deployment evidence and later owner instructions win.

## VERIFIED CHECKPOINT

- Live `main`: `5eecb482e94263fce7ce9041cdc4f3c7f3a86d21`.
- PR #158 `Prove Stage 4 adverse-network local-save safety` final exact head: `72435c180deb744418f93fe8155f280973c3b76a`.
- PR #158 exact head passed all 14 permanent workflow families; the only Codex review finding was fixed and its thread resolved.
- PR #158 squash merge: `5eecb482e94263fce7ce9041cdc4f3c7f3a86d21`.
- All 15 post-merge push/deployment runs are successful, including GitHub Pages run `33019945003` and Stability run `33019945012` with full deployed-site journey.
- Production remains `v1.8.1 / 1.8.1-r3`; runtime bytes and provider configuration did not change in PR #158.
- Remote Joining readiness: `81/100` under fixed RJR-1.

PR #158 permanently proves deterministic Connected Rivalry provider-failure safety through `tests/contracts/stage4-adverse-network-contracts.cjs`: valid registered-device/exactly-two-owner preflight and immutable local projection may complete, then provider loss before remote commit fails bounded while canonical local Save Library bytes remain unchanged. This adds exactly +1 from 80 to 81 and does not credit two-physical-network behavior, token lifecycle, authenticated third-account/revoked-device production negatives, or actual Remote Joining sessions.

PR #157 already established that the authenticated third-account/revoked registered-device production-negative boundary cannot be honestly automated without legitimate authenticated production identity/device state. Its synthetic probes are non-evidence. Do not recreate consumed owner account/pairing/device state merely for duplication.

## IMMEDIATE NEXT TASK AFTER FULL STUDY

Initialize a fresh unique WEC after independently verifying live `main`, PR #158, deployment, `REMOTE_JOINING_READINESS.json`, `NEXT_TASK.md`, `SESSION_BOOTSTRAP.json` and the closing WEC. Then advance the next automatically provable pre-Stage-5 capability: token-lifecycle hardening.

Study deployed `1.8.1-r3` App Check/Auth lifecycle, especially `js/productionFirebaseRuntime.js`, `js/sparkConnectedAccount.js`, existing App Check/runtime contracts and Connected Rivalry safety. Prove the smallest meaningful deterministic expiry/refresh transition that cannot corrupt Connected Account, Connected Rivalry or canonical local saves. App Check enforcement remains OFF. Do not add extra Auth scopes, persistent Firestore cache, billing, speculative scheduler work or new storage authority unless live source evidence makes it genuinely necessary.

Two-physical-network behavior remains separately uncredited. Stage 5 host/join/session orchestration remains locked until the remaining explicit pre-Stage-5 gates are genuinely closed.

## PERMANENT LOCKS

Exactly two private managers. Canonical storage only `careerModeShowdown.saveLibrary`, `careerModeShowdown.legacyShowdowns`, `careerModeShowdown.preferences`; `activeShowdown` is non-canonical. Candidate A non-mutating, Candidate B read-only, Candidate C sole destructive Apply authority. Firebase Spark / zero billing. Firestore memory-only. Google Auth popup-only `browserSessionPersistence` with no extra scopes. App Check enforcement remains OFF. Trusted-runtime IAM remains unactivated/unbroadened. No public discovery/community/matchmaking/global rankings. Local-first startup/recovery must remain usable without Firebase.

Standing owner merge/deploy authorization remains active after all required tests, exact-head review and deployment gates pass. Later explicit owner instructions override it.

Future handoffs must recursively use SLE = Smart Lean Efficient and preserve the mandatory repository-first next-developer prompt standard. When repository tooling is available use `npm run work:next-prompt`. A fresh successor must initialize its own WEC; never inherit this predecessor's transition decision as its own.

Owner-facing progress format:
Handoff proximity: X%
Remote Joining readiness: ~Y%
Current lane: ...
Concrete dependency completed: ...
Next unlock: ...
Blocker: ...
Sidequest check: ...
