# Career Mode Showdown Project Operating System v5

Status: candidate operating authority on the POS5 branch until reviewed and merged.

POS5 is the crash-resistant, product-first operating model. Its job is not to prevent every external platform interruption; that is outside repository control. Its job is to make interruptions cheap, bounded and recoverable while keeping product gates strong and development fast.

## 1. Authority order

1. Later explicit owner instruction.
2. Current verified source, live GitHub state, provider state and deployed behavior.
3. `CURRENT_PRODUCT_GUARDS.json`, active product/evidence models and executable release authority.
4. `NEXT_TASK.md`.
5. Active PR Recovery Beacon RB-2 when present.
6. Developer Relay File DRF-1 when a real session relay occurred.
7. Historical POS, handoff, WEC, SNS/SLE, completed milestone and provenance material.

Recorded SHAs and relay artifacts are orientation only. Re-resolve live main, branch/PR head, checks, reviews and deployment before editing. Never combine CI evidence across heads.

## 2. What actually caused repeated interruption damage

POS5 distinguishes interruption triggers from interruption amplifiers.

External triggers cannot be eliminated by the repository: platform usage/capacity limits, tool/runtime failures, context compaction, transient network/provider failures and application/session termination.

The project repeatedly amplified those triggers through avoidable operating choices:
- large amounts of live state existed only inside one chat before a durable checkpoint;
- continuity itself mutated the Git head, invalidating exact-head evidence and launching new CI;
- fail-fast suites revealed one stale gate per expensive fanout;
- literal handoff/RJR/PR/provider-run wording was allowed to block executable product work;
- many tiny commits each triggered the same remote matrix;
- large logs and repeated polling consumed context without advancing the product;
- release verification, operating-system redesign and unrelated product work were sometimes widened in parallel;
- concurrent head movement was discovered late, forcing reconstruction/revalidation;
- transfer packaging happened near the end of a session, so abrupt interruption could happen first.

POS5 therefore optimizes the amount of volatile state at risk, not the number of handoff documents produced.

## 3. AWU-1 Atomic Work Unit

Every mutation lane is divided into Atomic Work Units (AWUs). An AWU is one coherent intent with one risk domain and one durable exit.

An AWU ends when one of these is true:
- the coherent change is committed/pushed to the active branch;
- the change is deliberately abandoned and the repository is back at the last safe state;
- the active blocker is classified and the exact next action is recorded in RB-2.

Do not widen into a second independent mutation lane while an AWU is unresolved. Reads and diagnosis may be broad; writes stay narrow.

There is no arbitrary file-count limit. The test is recoverability: a successor reading live Git + RB-2 must be able to identify or safely repeat the unfinished AWU without reconstructing a long conversation.

## 4. CLB-1 Crash Loss Budget

The Crash Loss Budget is one AWU.

Durable recovery state must never lag more than one coherent AWU behind the work. If a second independent mutation would begin while RB-2 is stale, refresh RB-2 first.

Refresh RB-2:
- after a coherent commit/push;
- after a blocker changes class or exact next action;
- before merge, deployment, provider mutation or another non-trivial remote publication step;
- before deliberately beginning a long-running or broad-risk validation;
- when the relay controller reports that recovery state is stale.

Do not refresh RB-2 after every read, successful tool call or polling event. Crash resilience must stay cheap.

## 5. RB-2 Recovery Beacon

RB-2 is a tiny hidden machine-readable block in active PR metadata. It is the automatic interruption fallback, not the normal transfer product.

It records only: repository, branch, PR, recorded head, current lane, AWU, blocker class, last safe checkpoint, exact next action, validation summary and timestamp.

RB-2 never changes the Git tree or head and never triggers CI. It is orientation only and cannot supply product readiness credit.

If no active PR exists, the branch plus `NEXT_TASK.md` remain the durable base and DRF-1 is generated at the next actual relay.

## 6. TDS-3 Relay Decision Signal

There is no handoff percentage. Owner-facing relay state has only three values:
- `CONTINUE`
- `RELAY_AFTER_ATOMIC`
- `RELAY_NOW`

Hard relay triggers:
- explicit owner request;
- owner-reported platform usage/capacity warning that the assistant cannot see;
- another substantial AWU would exceed CLB-1 or risk unrecoverable volatile state;
- ADB-4 exhausted with unresolved meaningful failure;
- severe reconstruction/context damage plus unresolved correction cycles;
- current environment can no longer verify/write the live authority needed for safe progress.

A stale beacon does not automatically mean relay. Refreshing recovery state and ending a session are separate decisions.

## 7. ADB-4 Failure-Aware Adaptive Debug Budget

ADB-4 dynamically grants 3–20 meaningful correction/validation cycles. It is not a universal quota.

Failure classes:
- `PRODUCT_DEFECT`
- `TEST_DEFECT`
- `PROCESS_DRIFT`
- `DORMANT_PROVENANCE`
- `INFRA_FLAKE`
- `HEAD_MOVED`
- `UNKNOWN`

Only a meaningful correction followed by validation consumes a cycle. Reading, classification, polling, successful validation and an unreproduced infrastructure flake do not.

Narrow test/process defects with healthy context can receive a high budget. Broad product/security failures, several unresolved domains, repeated head movement or reconstructed context shrink the budget.

Never spend cycles restoring obsolete prose merely to satisfy a non-product assertion. Reclassify or archive the gate when its protected invariant has a stronger current owner.

## 8. FC-2 Failure Census and failure fingerprinting

The repository-level current-product runner executes all independent blocking contracts and reports the whole failure set before returning red. Each child has a bounded timeout and output buffer.

After a census, group failures by protected invariant/failure class and correct a coherent class together. Do not make one wording repair per CI run.

A repeated identical failure on an unchanged relevant source/head is a diagnostic signal, not a reason to increase mutation breadth. Investigate the gate or infrastructure before making another product edit.

## 9. GP-2 Gate Relevance and Purity

A blocking gate must protect a still-used product, security, privacy, data, provider, recovery, UI/UX, executable schema/API, current evidence or release invariant.

Blocking gates must not depend on handoff/WEC/SNS/SLE packaging, `NEXT_TASK.md`, completed RJR score history, old PR numbers, old provider run IDs, exact workflow counts or historical wording merely to prove a current runtime invariant.

Safety gates must inspect executable behavior/configuration/source. Warning comments and explanatory prose naming forbidden systems are not proof that those systems execute.

When an old gate contains a useful invariant plus historical coupling, update it to the useful invariant. When the invariant is fully superseded by a stronger current gate, archive the old test for manual provenance instead of deleting history.

## 10. CI and compute discipline

- Stability owns one complete current-product census.
- Static/specialist workflows own focused risk domains only.
- Historical and dormant architecture audits are manual-only.
- During development, run the smallest targeted local/current checks justified by the changed risk.
- Publish one coherent tested commit per AWU rather than many small commits that trigger the same fanout.
- Before any write, resolve the current branch head. If it moved, classify `HEAD_MOVED`, compare first, and never overwrite concurrent work blindly.
- Poll remote CI sparsely. Read compact status first; fetch detailed logs only for current red jobs.
- Do not continue an unrelated broad redesign merely to fill time while release CI runs. Start another lane only when it is isolated on a separate branch and has its own durable recovery state.

## 11. DRF-1 Developer Relay File — primary transition product

POS5 chooses a file, not a pasted long prompt, as the primary developer-session transfer product.

Name: `DEVELOPER_RELAY_POS5.md`.

Why a file is better for this project:
- one upload preserves exact content without copy/paste loss or chat reformatting;
- a fixed schema is easier for a successor to parse deterministically;
- it can include the minimum live state without repeating repository history;
- it stays outside Git, so generating it causes zero commits and zero CI;
- the owner can retain or upload one artifact instead of managing a long prompt plus multiple handoff files;
- it can be regenerated from live Git/RB-2 if a previous relay file becomes stale.

The file is deliberately small (hard cap 8 KiB) and contains only:
- authority/reverification rule;
- repo, branch, PR and recorded head;
- current lane/AWU;
- last safe checkpoint;
- unresolved failure classes and concise validation status;
- exact next action;
- permanent product locks by reference to `CURRENT_PRODUCT_GUARDS.json` plus the zero-billing/Spark reminder;
- relay reason.

A one-line companion prompt is allowed only for convenience: `Open the attached DEVELOPER_RELAY_POS5.md first and continue from its live-verification instructions.` The file, not that sentence, is the transfer authority.

DRF-1 is generated only at an actual relay or explicit owner request. It is never committed and never opens a continuity-only PR.

## 12. Interruption recovery startup

If a session ended abruptly without DRF-1:
1. resolve live main and active PR/branch;
2. read RB-2 if present;
3. read `PROJECT_OPERATING_SYSTEM_V5.md`, `CURRENT_PRODUCT_GUARDS.json`, and `NEXT_TASK.md`;
4. compare recorded RB-2 head to live head;
5. resume or safely repeat at most the one unfinished AWU.

If DRF-1 is supplied, read it first, then perform the same live re-verification. Do not recursively load older relay/handoff files unless the actual blocker requires provenance.

## 13. Metrics and legacy disposition

Active product/delivery metrics:
- SSJR: keep as product acceptance/readiness.
- MDP: keep as feature lifecycle maturity; MDP-1 remains current until a separately reviewed MDP-2 migration.
- RJR: frozen historical 100/100; current product regression gates remain where relevant.

Session/process concepts:
- SHP percentage: retired.
- HTR score: retired.
- WEC: historical provenance only.
- SLE: nonblocking Smart Lean Efficient principle only.
- SNS/RCP successor packages: superseded for new transfers by RB-2 + DRF-1.
- continuity-only PRs: prohibited unless a unique repository-recovery hazard exists.
- POS2/POS3/POS4: design/history, not startup authority after POS5 merge.

## 14. Permanent product locks

`CURRENT_PRODUCT_GUARDS.json` remains the machine authority.

Billing remains permanently OFF and Firebase remains Spark. Never enable Blaze, Cloud Billing/account linkage, Cloud Run or Cloud Functions. App Check enforcement remains OFF. Firestore browser persistence remains memory-only. Google Auth remains popup-only `browserSessionPersistence` with no extra scopes.

Exactly two private managers. Connected Rivalry pairing plus exact ACTIVE precedes league or club authority. Candidate C remains the sole destructive remote-to-local gameplay Apply authority with transaction-owned exact rollback.

Canonical local storage remains exactly `careerModeShowdown.saveLibrary`, `careerModeShowdown.legacyShowdowns`, and `careerModeShowdown.preferences`.

No public discovery/listing/lobby/matchmaking/community/rankings/global leaderboards. `SSJR-DUAL-FULL-SCREEN-1` remains permanent.

## 15. Owner-facing reporting

Normal work reports product progress, not continuity bureaucracy. Keep SSJR, MDP, current lane, concrete dependency completed, next unlock and blocker when useful.

Relay state is normally omitted while `CONTINUE`. Report it when it changes to `RELAY_AFTER_ATOMIC` or `RELAY_NOW`, or when the owner asks.

The owner should not need to guess when to ask for an SNS. POS5 owns that decision and produces DRF-1 automatically at the real relay boundary. If the platform shows a usage warning that the assistant cannot see, the owner only needs to report that warning once.
