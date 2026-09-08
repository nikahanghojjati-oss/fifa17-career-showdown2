# Career Mode Showdown Project Operating System v5

Status: current project operating authority after reviewed activation.

POS v5 is the lean, failure-resistant delivery system for Career Mode Showdown. It keeps the product and safety protections that repeatedly proved useful, removes process-provenance coupling that repeatedly caused false blockers, minimizes repeated CI work, and makes developer-session transfer deterministic without mutating product source.

## 1. Authority order

1. Later explicit owner instruction.
2. Current verified source, live GitHub state, provider state and deployed behavior.
3. `CURRENT_PRODUCT_GUARDS.json`, active product/evidence models and executable release authority.
4. `NEXT_TASK.md`.
5. Active PR Recovery Beacon RB-2 when present.
6. DRF-1 Developer Relay File when a real transfer occurred.
7. Historical POS versions, handoffs, WEC records, completed milestone ledgers and provenance.

Recorded SHAs and transfer files are orientation only until live authority is independently reverified. Never combine CI evidence across heads.

## 2. Product metrics

- SSJR stays the accepted two-manager product-readiness metric.
- MDP remains the engineering lifecycle tracker until a separately reviewed migration replaces it.
- RJR-1 remains frozen completed evidence at 100/100 unless a demonstrated regression invalidates a still-shipped capability.

Continuity, transfer, debugging and operating-system artifacts earn zero product progress.

## 3. Gate lifecycle: GL-1

Every blocking gate must protect one current product/safety/release invariant and have one clear blocking owner. A gate is active only when failure can still imply one of: wrong runtime/UI behavior, wrong data/storage/sync/recovery behavior, wrong security/privacy/provider behavior, wrong current evidence, or wrong release/deployment behavior.

A gate must be demoted from blocking CI when it protects only historical wording, PR/WEC/run IDs, handoff format, completed milestone narration, old workflow topology, retired architecture, or documentation inheritance. Demotion means manual historical/provenance audit when evidence is still worth preserving; deletion is used only when the gate has no remaining evidentiary value.

No active gate may require a process document merely to prove a product invariant. Permanent safety is proved from machine guards, config, source, Rules, runtime behavior or current evidence schema.

## 4. Gate execution lanes: GEL-1

POS v5 uses three execution lanes instead of treating every change like a release:

- `TARGETED`: fastest development loop. Run changed-domain contracts and focused browser/emulator checks only.
- `CANDIDATE`: run the complete current-product Failure Census once on the exact candidate head plus only genuinely impacted specialist workflows.
- `RELEASE`: after merge, run canonical Stability browser/deployed proof, deployment proof and release burn-in on the exact main head.

Operations-only changes run `npm run test:ops` and do not trigger product-release proof by policy. If an operations change edits the current-product runner or gate manifest, add one local current-product census before publication because the test infrastructure itself changed.

Do not repeatedly run a full matrix while diagnosing one known failure. Do not rerun successful unrelated specialist gates without a changed risk domain or a new candidate head.

## 5. Failure Census FC-2

The repository-level current-product runner executes every blocking contract in one pass, records every independent failure and exits red only after the complete census. Each child has a timeout and bounded output buffer so one hung or noisy test cannot erase the rest of the diagnostic picture.

After one census, classify the whole failure set and batch one coherent correction when safe. This directly prevents the historical one-fix/one-fanout/next-hidden-failure spiral.

## 6. Gate Purity GP-2

Blocking product gates may read only current executable/product authority needed by their invariant. They must not import `NEXT_TASK.md`, handoff files, WEC state, old readiness ledgers, transfer packages, POS prose, historical run IDs or completed milestone narration to decide product correctness.

Forbidden-action checks inspect executable/config behavior rather than explanatory comments. Formatting, exact prose, exact PR numbers, exact workflow counts and exact command spelling are not product invariants unless the product literally consumes them.

## 7. Risk Router RR-1

Before remote CI, classify the changed paths into risk domains. Default domains are: `OPS_ONLY`, `UI_RUNTIME`, `DATA_RECOVERY`, `SHARED_SESSION`, `SECURITY_PROVIDER`, `TEST_INFRA`, and `BROAD_RELEASE`.

The router recommends the minimum sufficient lane and specialist set. Security/provider, storage/destructive restore, shared-session authority, workflow/test-infrastructure changes and unknown broad changes escalate automatically. A human/agent may always escalate; it may not de-escalate a security/provider or destructive-data change without direct evidence.

## 8. Debug Loop Limiter DLL-1

POS v5 removes the global adaptive attempt budget. Counting unrelated attempts proved less useful than tracking whether a root-cause hypothesis is learning anything.

For one root-cause hypothesis:
1. reproduce or establish direct evidence;
2. make one coherent correction;
3. run the narrow validation that can falsify the hypothesis;
4. if still red, inspect new evidence before another correction.

Two failed corrections under the same materially unchanged hypothesis require `REFRAME`: widen the failure census, change the hypothesis, or classify the gate itself. A third same-hypothesis correction is prohibited without new evidence. Unreproduced infrastructure flakes do not count as product corrections.

This is a loop breaker, not a pressure meter.

## 9. Atomic publication APR-1

Prefer one coherent tested commit per candidate batch. When many files must change together, prepare blobs/tree first and advance the branch once. Do not create a chain of tiny commits that each launches the same remote matrix.

Before merge, re-resolve the exact live PR head and never merge or cite checks from an older head. After merge, all release authority moves to the exact resulting main commit.

## 10. Recovery Beacon RB-2

RB-2 is the interruption fallback. It is a tiny hidden machine-readable checkpoint stored in active PR metadata, never in the Git tree.

It records only: repository, branch, PR, recorded head, current lane, failure class/root hypothesis, last safe checkpoint and exact next action. It is orientation only.

Refresh RB-2 after a coherent commit, blocker reclassification, before a risky publication/deployment sequence, or when TRANSFER is triggered. Do not update it after ordinary reads/polls. Updating RB-2 must not change the code head or trigger CI.

## 11. Transition Decision TD-1

There is no handoff percentage and no multi-level readiness score. TD-1 is binary:

- `CONTINUE`: keep working.
- `TRANSFER`: finish or safely abort the current atomic operation, refresh RB-2, generate DRF-1, and stop at the clean boundary.

TRANSFER triggers: explicit owner request; owner-reported platform usage warning/critically low allowance; another substantial task would risk unrecoverable context; DLL-1 requires reframe but context is materially degraded; or the environment can no longer safely complete the next atomic operation.

Message count, elapsed time, successful reads, successful tool calls, commit count and a single interruption do not independently trigger transfer.

The owner never needs to ask for SNS. If the UI shows a usage warning the assistant cannot see, the owner reports it once; TD-1 becomes TRANSFER at the next safe boundary.

## 12. DRF-1 Developer Relay File

DRF-1 is the primary transfer product. It is a single external Markdown file, not a pasted long prompt and not a repository commit.

Why file over prompt:
- exact content survives copy/paste and chat-history loss;
- one upload is cheaper for successor context than reconstructing a long conversation;
- a fixed schema is deterministic for both human and model reading;
- it can be downloaded, stored and re-uploaded without changing Git or triggering CI;
- it remains readable without requiring a parser.

DRF-1 has a hard compact schema: authority warning, repository/branch/PR, recorded head, last safe checkpoint, current lane, unresolved root hypotheses, exact next action, required live revalidation, permanent locks, and only the minimum historical references genuinely needed.

Target maximum size is 4 KiB. It must not contain raw private identifiers, secrets, full logs, duplicated history or long explanations. If the needed state cannot fit, reference the relevant repository file instead of copying it.

At transfer the assistant gives the owner the DRF-1 file. A one-line companion instruction is enough: “Open the attached DRF-1 first and continue from its exact next action after live revalidation.” The file, not that sentence, carries the state.

## 13. Successor startup: SS-1

Startup order is deliberately small:
1. DRF-1 if supplied;
2. `PROJECT_OPERATING_SYSTEM_V5.md`;
3. `CURRENT_PRODUCT_GUARDS.json`;
4. `NEXT_TASK.md`;
5. live PR/main/check/review/deployment state, including RB-2 when present.

Do not preload WEC archives, old SNS/SLE/starter families, old POS versions, completed RJR evidence or dormant architecture unless the live blocker specifically needs them.

## 14. Historical repeated-failure policy

Keep and strengthen direct owners for failure families that repeatedly represented real product risk:
- stale Connected Rivalry convergence/pointer precedence;
- acknowledgement loss, retries, idempotency and reconnect/offline recovery;
- recorder/evidence schema compatibility that affects accepted current evidence;
- deployed artifact/cache/service-worker completeness;
- exact-path/no-list provider authorization and privacy;
- Candidate C snapshot/precondition/rollback authority;
- paired-first and both-manager Shared Showdown presentation;
- browser-only DOM/control-flow regressions.

Archive or demote repeated false-blocker families:
- handoff/SNS/SLE/WEC literal mismatches;
- PR/RJR/provider-run provenance required by unrelated runtime gates;
- exact workflow-count/topology magic numbers;
- dormant Cloud Run/custom credential designs;
- safety regexes that match comments instead of executable behavior;
- documentation inheritance used as a permanent control-plane proof.

## 15. Legacy dispositions

- SHP percentage: retired.
- HTR numerical score: retired.
- WEC: historical provenance only.
- SLE: retained only as a nonblocking principle: Smart, Lean, Efficient.
- SNS: retired for new transfers.
- POS v2/v3/v4: historical operating-system provenance after POS5 activation.
- continuity-only PRs: prohibited unless a unique repository-recovery hazard is demonstrated.

## 16. Permanent product locks

`CURRENT_PRODUCT_GUARDS.json` remains the compact machine authority.

Billing remains OFF and Firebase remains Spark. Never enable Blaze, Cloud Billing/account linkage, Cloud Run or Cloud Functions. App Check enforcement remains OFF. Firestore browser persistence remains memory-only. Google Auth remains popup-only `browserSessionPersistence` with no extra scopes.

Exactly two private managers. Connected Rivalry pairing plus exact ACTIVE precedes league or club authority. Candidate C remains the sole destructive remote-to-local gameplay Apply authority with transaction-owned exact rollback.

Canonical local storage remains exactly `careerModeShowdown.saveLibrary`, `careerModeShowdown.legacyShowdowns`, and `careerModeShowdown.preferences`.

No public discovery, listing, lobby, matchmaking, community, rankings or global leaderboards. `SSJR-DUAL-FULL-SCREEN-1` remains permanent.

## 17. Owner reporting

Normal reporting is product-centered: SSJR, MDP, current lane, concrete dependency completed, blocker and next product unlock.

Report `Transition signal: TRANSFER` when TD-1 changes to transfer or when the owner asks. Otherwise omit transition noise.

## 18. Core rule

One current invariant has one blocking owner. One investigation reveals the whole relevant failure set. One candidate head gets one complete candidate proof. One release head gets one release proof. One transfer creates one tiny external relay file. Spend compute on product risk, not project paperwork.
