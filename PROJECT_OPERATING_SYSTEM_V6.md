# Career Mode Showdown Project Operating System v6

Status: candidate authority on the POS6 branch until reviewed and merged.

POS6 is the Fast / Furious / Accurate operating model. Its purpose is to increase real product throughput by removing redundant gate execution, keeping strong invariants under one clear owner, routing expensive proof only to changed risk domains, and escalating unfamiliar changes to a complete seal instead of guessing.

## 1. Authority

1. Later explicit owner instruction.
2. Current verified source, live GitHub state, provider state and deployed behavior.
3. `CURRENT_PRODUCT_GUARDS.json`, current product/evidence models and executable release authority.
4. `NEXT_TASK.md`.
5. Active PR RB-2 Recovery Beacon when present.
6. DRF-1 only when an actual developer relay occurs.
7. Git history for superseded operating systems and historical provenance.

Never combine validation evidence across heads.

## 2. Fast / Furious / Accurate

POS6 has three validation tiers.

### FAST

Every non-document product PR runs one deterministic census:
- JavaScript syntax for current executable/test tooling;
- every blocking deterministic current-product contract exactly once through `CURRENT_PRODUCT_TEST_MANIFEST.json`;
- POS6 operations tests only when operating-system code changes.

FAST must finish before expensive proof is interpreted. It is the quickest high-information failure surface.

### FURIOUS

RACE-6 classifies changed files into risk domains and launches only the relevant expensive proof in parallel. Current domains are Shared Setup, remote/security/provider, storage/restore, and visual/presentation. Multiple domains may run together when a change crosses boundaries.

FURIOUS never skips a required invariant because a file name is unfamiliar. Unknown non-document changes escalate to ACCURATE.

### ACCURATE

A cross-cutting, release-critical, test-topology, dependency, product-guard or otherwise unclassified change runs the complete browser and remote-emulator seal. Main continues to run post-merge deployment/release proof.

ACCURATE is intentionally expensive and intentionally uncommon.

## 3. RACE-6 Risk-Adaptive CI Engine

`scripts/pos6-risk-router.mjs` is the machine router. `POS6_RISK_MAP.json` documents the policy.

Rules:
- operating-only changes run FAST + operations tests;
- Shared Setup changes run FAST plus Shared Setup browser/emulator proof;
- remote/auth/rules changes run FAST plus the remote security seal;
- storage/restore changes run FAST plus storage browser proof;
- visual/presentation changes run FAST plus visual browser proof;
- package, product-guard, workflow topology, test-manifest, service-worker and unknown non-document changes run ACCURATE;
- documentation-only changes do not launch product CI.

When classification overlaps, choose the union of relevant risk lanes. Accuracy wins ties.

## 4. One deterministic owner

POS6 removes the POS5 wrapper that ran operations tests and extra product contracts around the 51-test manifest. All blocking deterministic current-product contracts belong directly to `CURRENT_PRODUCT_TEST_MANIFEST.json` and execute once through FC-2.

Operations tests are not product tests. Historical/provenance audits are not product tests. Browser/emulator evidence is not duplicated merely because an old workflow used to own it.

## 5. Active GitHub Actions topology

Normal pull requests have one automatic orchestrator: `Validate POS6 Fast Furious Accurate`.

The prior unconditional specialist PR workflows are removed from the active Actions directory. Their useful invariants continue through the deterministic manifest, focused POS6 browser/emulator lanes, or the ACCURATE seal. Exact historical workflow files remain available in Git history.

Main retains release/deployment workflows, including a full post-merge Stability/deployed-site proof and Release Integration Burn-In.

## 6. AWU-1, CLB-1 and RB-2

POS6 keeps the crash-resistance mechanisms that worked.

- One coherent Atomic Work Unit at a time per mutation lane.
- Crash Loss Budget remains one AWU.
- RB-2 is the small non-Git recovery checkpoint in active PR metadata.
- RB-2 remains capped at 4 KiB.
- DRF-1 remains an external relay file capped at 8 KiB and is generated only for an actual relay.

Recovery state must not become a parallel project.

## 7. TDS-6 and ADB-6

Relay state remains `CONTINUE`, `RELAY_AFTER_ATOMIC`, or `RELAY_NOW`.

Relay is driven only by observable project conditions: explicit owner request, inability to resolve/write required live authority, CLB-1 risk, exhausted adaptive debugging with unresolved meaningful failure, or severe reconstruction damage.

ADB-6 grants a contextual 3–20 meaningful correction/validation cycles. Reads, polling, successful validation and an unreproduced infrastructure flake consume zero cycles. Fix coherent failure classes together after FC-2 reports the whole deterministic failure set.

## 8. Stale-system retirement

The active package command surface no longer advertises WEC, SHP, HTR, resume-capsule, old next-prompt, handoff-preflight or POS2 health tooling. Superseded operating-system executables/tests may be removed from the current tree when POS6 has a stronger current replacement; Git history remains the provenance archive.

SHP and HTR do not return. WEC is historical. SNS/RCP packaging is superseded by RB-2 + DRF-1.

## 9. Product safety locks

`CURRENT_PRODUCT_GUARDS.json` remains machine authority.

Billing remains permanently OFF and Firebase remains Spark. Never enable Blaze, Cloud Billing/account linkage, Cloud Run or Cloud Functions. App Check enforcement remains OFF. Firestore browser persistence remains memory-only. Google Auth remains popup-only `browserSessionPersistence` with no extra scopes.

Exactly two private managers. Connected Rivalry pairing plus exact ACTIVE precedes league or club authority. Candidate C remains the sole destructive remote-to-local gameplay Apply authority with transaction-owned exact rollback.

Canonical local storage remains exactly `careerModeShowdown.saveLibrary`, `careerModeShowdown.legacyShowdowns`, and `careerModeShowdown.preferences`.

No public discovery/listing/lobby/matchmaking/community/rankings/global leaderboards. `SSJR-DUAL-FULL-SCREEN-1` remains permanent.

## 10. Product-first exit

POS6 itself earns zero SSJR and zero MDP credit.

Once POS6 is reviewed, exact-head green and merged, operating-system work stops. Resume the current Shared Showdown Journey dependency immediately: production Shared Setup integration/evidence, then the next unfinished two-manager capability.
