# Independent Showdown Gate audit — Team G lead
**Decision: KEEP_SHADOW. Score: 71/100. The prior 79/100 should decrease by eight points. Assessment: PARTLY AGREE.**

The architecture, real regression detection, and simulated recovery are credible. Promotion is blocked by an actual PR-code/write-token boundary, a reproducibly permissive exit evaluator, incomplete independent evidence binding, and unresolved control/sample rules. No unsafe Gate-PASS/old-FAIL disagreement appeared in the bounded 16-head comparison. That observation does not establish absence of defects.

Read-only review: no GitHub writes, comments, workflow triggers, reruns, merges, permission changes, or deployments. The score is explicit reviewer judgment, not a probability of safety or a product-acceptance certificate.

## 1. Evidence scope and frozen references
Audit started **October 9, 2026, 01:57:34 EDT** (America/New_York; `2026-10-09T05:57:34Z`). Source and primary comparison sample were frozen then. PR state was rechecked at approximately **02:10 EDT**, and main was rechecked unchanged at **02:21:32 EDT** (`2026-10-09T06:21:32Z`). Live changes during the review are reported separately.

| Item | Independently observed evidence | Limits |
|---|---|---|
| Repository / main | [Repository](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2); [main commit](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/commit/963a97913734c815fc053bc2c3db209ed32e6183) `963a97913734c815fc053bc2c3db209ed32e6183`, r64 merge #429 | Main remained this SHA at the final state recheck; no inference about subsequent changes |
| Gate workflow identity | [Pinned workflow](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/963a97913734c815fc053bc2c3db209ed32e6183/.github/workflows/showdown-gate.yml); Git blob `57c63512033940d5f8471cc8f1c651778feb17a9`, 29,810 bytes | Git blob SHA identifies file bytes, not a model or Actions run |
| Gate history | [Introduction commit](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/commit/bc77a0b934c3d43279f27f73a72db21c2db2b4f2), merged [#386](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/386); queried workflow path history showed that introduction | Not an exhaustive review of every historical application commit |
| Branch enforcement | [Branch API](https://api.github.com/repos/nikahanghojjati-oss/fifa17-career-showdown2/branches/main) returned `protected:false`, protection enabled false, required-status-check enforcement off, empty checks/contexts. [Rulesets API](https://api.github.com/repos/nikahanghojjati-oss/fifa17-career-showdown2/rulesets?includes_parents=true) returned `[]` | Detailed `/branches/main/protection` returned 403, administration unavailable to integration. No visible evidence of enforced POS20 or Gate on main; hidden settings cannot be certified |
| Passing PR #435 | Head `4c48cee9fb3fe62afa6322db2cd4a502576469f5`; [Gate 37887091534](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/actions/runs/37887091534), [POS20 37887091525](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/actions/runs/37887091525), attempt 1 | Six lanes + seal green; route log 144 contracts/48 proofs; seal 214 distinct evidence IDs, not 214 test processes |
| Current main push | Head `963a97913734c815fc053bc2c3db209ed32e6183`; [Gate 37890012813](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/actions/runs/37890012813), [seal job 113691071864](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/actions/runs/37890012813/job/113691071864), attempt 1 | Real log PASS at 05:54:32 UTC, `COGNITIVE_FULL_SEAL`, 214 IDs; CI success does not certify deployed Firebase state |
| Canary #395 | Head `b381233f04619eba1a85dc93de827de6d7ae32b0`; [Gate 37398571818](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/actions/runs/37398571818), [POS20 37398571824](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/actions/runs/37398571824), attempt 1 | FAIL_TEST verified from seal and failure logs; closed, unmerged; one head with two planted failure categories |
| Simulated infra #396 | Head `61161337fa58344482e44a7bd088c7a9d63f98ab`; [Gate 37398574147](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/actions/runs/37398574147) attempts 1→2 | Setup failure before test; seal INFRA_RETRYING then PASS, 206 IDs. Closed, unmerged |
| Automatic retry attribution | [Physio 37400374259/job 112065994280](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/actions/runs/37400374259/job/112065994280) | Log at 01:41:07 UTC records target 37398574147, INFRA, rerun-failed-jobs, HTTP 201. Attribution is stronger than merely seeing attempt 2 |
| Latest #424, changed during audit | Head `6761a586f2c08480317b899389a6de9bb87cecfb`; [Gate 37891043256](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/actions/runs/37891043256), [seal 113694178813](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/actions/runs/37891043256/job/113694178813), [POS20 37891043197](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/actions/runs/37891043197), attempt 1 | All lanes PASS, seal 215 IDs at 06:06:32 UTC. Merged at 06:07:21 UTC to gameplay/bug-list-1, merge `626fc881925ed7277d192a63f88de51c3a4324b0`. Kept outside the frozen 16-head performance sample |
| Relevant open #425 | Head `2b88d4ae727c20e4329ca7b74d92befd70872e2b`, base qa/bug-olympiad; [Gate 37549520355](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/actions/runs/37549520355) successful | Separate branch; not a main deployment or part of the 16-head timing sample |

Run IDs, job IDs, attempt numbers, head SHAs, decoded seal/route/failure logs and jobs API timestamps were fetched through the authorized GitHub connection. Six recent pages of repository runs (600 returned entries) were inspected; pagination moved during collection and a repeated cancelled run was deduplicated by run ID. This is bounded sampling, not the entire CI history. A published authoritative exit-summary artifact was not located. The comparison below is an **offline replay of the repository's comparator functions using fetched live evidence**, not an assertion that its live CLI published a report. Binary lane ZIP payloads were not independently downloaded; seal logs and source reveal their validation path.

Minimum source inspection included the three validation workflows, Gate/Physio/preempt/compare scripts, coverage graph and three contracts, both impact routers and proof runner, Rules builders/regression/support/fixture, watchdog workflow, deployment workflow, AGENTS, PROJECT_OPERATING_SYSTEM_POS20, CURRENT_PRODUCT_GUARDS, registries and baseline. Local pinned-source execution passed:
- coverage contract: **155 checks**, 16 gates, 63 old steps and 63 mappings;
- watchdog contract: **6 groups**;
- Physio contract: **12 groups**, using recorded/synthetic fixtures and mocked clients.

These were local read-only tests. The complete application/browser/emulator suite was not independently rerun; actual CI logs supply that evidence.

## 2. Weighted score and comparison with 79
| Dimension | Weight | Awarded | Deductions, and evidence that would recover points |
|---|---:|---:|---|
| Coverage/correctness | 30 | **25** | −2: PR defines execution and its own evidence/verifier; recover with trusted verification and adversarial negative controls. −1: unknown live PR head permits PASS; recover with explicit unavailable/superseded handling. −1: incomplete lane/job/run/route provenance binding; recover with validated provenance including permitted carried results. −1: finite structural/route tests; recover with generated route/skip/missing-proof cases |
| Security/permissions | 25 | **15** | −8: actual Actions-write token crosses PR code boundary; recover by isolating all privileged code and dependencies from candidate checkout. −2: mutable action tags and unlocked additional npm/npx dependency resolution; recover with reviewed immutable pins and reproducible dependencies |
| Failure/recovery | 20 | **17** | −2: no independently verified live exhausted-budget/real runner-loss sequence; recover with archived genuine cases or separately authorized safe controls. −1: broad pre-test setup classification and misleading no-machine wording; recover with explicit causes and fail-closed package/config distinctions |
| Performance/efficiency | 15 | **10** | −3: only seven successful matched heads and no representative narrow-route/long-term sample; recover with ≥10 successful equivalent workloads across route/load strata. −2: repeated setup and measured runner occupancy; recover with a predeclared coverage-equivalent efficiency target and demonstrated resource reduction |
| Rollout/evidence quality | 10 | **4** | −3: false-ready evaluator; recover with independent negative cases and a trustworthy published summary. −1: one canary head vs two-entry criterion; recover with explicit independent-control policy/evidence. −2: enforcement not evidenced and transition/rollback unproven; recover with owner-verified required-check policy and separate reviewed promotion plan |
| **Total** | **100** | **71** | Coverage 25 + security 15 + recovery 17 + performance 10 + maturity 4 |

Compared with the prior allocations (28/18/17/9/7), this review lowers correctness, security and maturity, keeps recovery unchanged and slightly raises performance evidence credit. It agrees with continuing shadow and preserving Rules checks. It rejects the prior L5 canary explanation and the implication that POS20 is presently verified as a required main check. Historical #422/#431/#432 failures are no longer open-PR blockers. Newly verified weaknesses outweigh those favorable corrections.

## 3. Prioritized findings
### F1 — High: PR-head code receives repository Actions write authority
[Workflow lines 29–55](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/963a97913734c815fc053bc2c3db209ed32e6183/.github/workflows/showdown-gate.yml#L29-L55) assigns L1 `actions:write`, checks out the PR head, and passes `github.token` to `node scripts/gate-preempt.mjs` from that checkout. [Actual L1 log](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/actions/runs/37887091534/job/113679411773) reports Actions: write / Contents: read, then executes the helper. Its source allowlist is a policy in mutable candidate code, not a token restriction.

**Conditions:** a same-repository PR whose author can change that helper or its imported code, and whose workflow is permitted to run. This includes a compromised contributor/agent. It can perform Actions operations outside the intended helper allowlist. Contents read is not contents write; this finding does not claim a direct code-push permission or an observed exploit. Ordinary public fork pull_request tokens are restricted by GitHub; do not generalize the observed same-repo privilege to arbitrary outsiders. No pull_request_target or explicit repository secrets are used here.

**Smallest safe fix:** remove L1's write elevation and candidate helper call, retaining trusted default-branch Physio preemption; explicitly disable checkout credential persistence in candidate lanes. If synchronous preemption is essential, run it in a separate privileged job/workflow that checks out only a trusted revision, imports only trusted dependencies, and treats PR data as data. Merely copying one helper while leaving its imports/npm lifecycle candidate-controlled is insufficient. Verify read-only tokens in all candidate execution paths.

GitHub's [authentication guidance](https://docs.github.com/actions/reference/authentication-in-a-workflow), [token scope](https://docs.github.com/en/actions/concepts/security/github_token), and [secure-use reference](https://docs.github.com/en/actions/reference/security/secure-use) establish the security model. No live exploitation was performed.

### F2 — High promotion risk: exit evaluator can declare invalid evidence ready
[compareHead lines 35–41](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/963a97913734c815fc053bc2c3db209ed32e6183/scripts/gate-compare.mjs#L35-L41) calculates profile equality, but [evaluateExitCriteria lines 49–62](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/963a97913734c815fc053bc2c3db209ed32e6183/scripts/gate-compare.mjs#L49-L62) does not enforce it. It counts entries rather than unique head/control identities, counts full-route failed outcomes as full seals, and accepts an infra entry with attempt 2 / watchdog_reruns 1 without requiring successful recovery. [CLI line 167](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/963a97913734c815fc053bc2c3db209ed32e6183/scripts/gate-compare.mjs#L160-L168) derives watchdog_reruns from attempt−1, which does not distinguish manual retries.

**Independent local reproduction:** one real-shaped PASS comparison with mismatched profiles, repeated ten times; one canary repeated twice; an infra entry whose conclusion is failure. The pure evaluator returned `ready:true`. The normal CLI already deduplicates ordinary comparison heads via Set, so the ten-duplicates case is an API validation gap, not a claim that its usual CLI always duplicates heads. Duplicate canary arguments remain accepted. Individual omissions also survive otherwise valid synthetic controls.

**Fix:** validate complete evidence records, unique head/control identity, profile and expected-set equality, two successful full seals, failure-control independence/no later rerun, and actual attributed successful infra recovery. Unknown/incomplete evidence must remain non-ready. Add these independent negative cases; the present passing contract tests do not expose them. This is a demonstrated function defect, **not an observed unauthorized promotion**; Gate is shadow.

### F3 — Medium, promotion blocker: seal provenance and live-head checks are incomplete
[Seal lines 117–157](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/963a97913734c815fc053bc2c3db209ed32e6183/scripts/showdown-gate.mjs#L117-L157) checks green needs, schema, head, profile, result and required selected/ran IDs. It does not validate lane/job identity, run provenance, attempt provenance, base SHA or complete route digest. Records do not carry several of those fields. [PR lookup lines 235–251](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/963a97913734c815fc053bc2c3db209ed32e6183/scripts/showdown-gate.mjs#L235-L251) catches API errors and leaves liveHead null; the superseded guard tests only a truthy live head.

A local case with all six green needs, correct required IDs/head/schema but `lane:"WRONG"`, `job:"WRONG"`, `run_attempt:99`, and null live head returned **PASS**. This isolates validation weaknesses; it does not demonstrate a cross-run artifact injection in real GitHub. Artifact lookup is constrained to the current run, which mitigates cross-run substitution.

**Fix:** fail current-head eligibility closed on PR-head lookup failure; validate lane/job, run and expected-route provenance against trusted job evidence. Preserve intentionally carried successful artifacts from earlier attempts: require the same run/head plus an explicitly allowed successful prior job/attempt, rather than blindly requiring every artifact to have the latest attempt number. Bind base/input digests. Recognize that candidate code creates both evidence and verifier; promotion needs trusted verification/review, not stronger self-assertions alone.

### F4 — Medium hardening: dependency execution is not fully reproducible
[Action tags and cache/install steps](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/963a97913734c815fc053bc2c3db209ed32e6183/.github/workflows/showdown-gate.yml#L34-L77) use major tags; [additional installations](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/963a97913734c815fc053bc2c3db209ed32e6183/.github/workflows/showdown-gate.yml#L376-L387) use `npm install --package-lock=false` and npx with pinned top-level Firebase versions. Those versions improve predictability but do not lock the entire resolution graph. Repeated emulator/tool installation also consumes resources. Use reviewed full action SHAs and a reproducible tool dependency lock/image, with update checks. This is exposure/hardening evidence, not proof of a compromised package.

### F5 — Medium rollout gap: current enforcement and exit interpretation need owner decisions
Main metadata reports no protection, and rulesets are empty. Workflow comments calling Gate “not required” do not establish that POS20 is required. Keep both validation workflows running; do not weaken any actually enforced policy elsewhere. Before promotion obtain an authorized administrator's exact required contexts/check IDs, branch/ruleset scope, bypass policy and rollback plan. The detailed protection 403 is a visibility limit, not evidence that a particular hidden rule exists.

Separately decide whether “two canaries” means two independent heads or two independently planted failure categories, and whether “full seal” requires PASS. Do not change the bar merely to make this sample pass.

## 4. Correctness, guards, Rules drift and recovery
**Six independent routes:** L1 core; L2 full browser; L3 storage/visual/gameplay; L4 remote/lifecycle; L5 composed Rules regression; L6 browser journey. Each invokes the unchanged POS20 router with exact two-dot base/head changed files; push forces full. Seal recomputes the route. Coverage checks map 63 steps across 16 old gates; proofs belong to one lane group. Extra fixed Gameplay Fast/Rules checks and L1 all-registered contracts expand execution beyond routed IDs. This is strong structural coverage, not proof of test validity or formal equivalence for every route.

**Failure behavior:** missing records, narrowed selection, wrong head, missing expected success IDs and red lanes fail closed in inspected code/contracts. Conditional proof steps count only successful outcomes; skipped required evidence does not count as ran. Draft PR lanes skip and seal yields DRAFT/non-PASS; ready_for_review triggers fresh work. PR concurrency cancels superseded first-attempt runs; main concurrency groups by SHA and retains each push. A cancelled run can skip seal without becoming PASS. Test-before-failure evidence wins over concurrent infra failure in watchdog classification.

**Retries:** trusted default-branch [Physio workflow](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/963a97913734c815fc053bc2c3db209ed32e6183/.github/workflows/gate-watchdog.yml) has elevated API permissions but does not execute the PR checkout; its checkout disables credential persistence. Only three allowlisted validators are watched. Maximum is three attempts/two automatic reruns per head, including budget across runs. An explicitly failed test is never retried; runner-loss during an unfinished test can classify infra. Pre-test npm/config failure may be classified infra even if reproducible; bounded retries still cannot convert a persistent failure into PASS. Exhaustion, supersession and mixed-test/infra cases pass mocked contracts; a live exhaustion sequence was not independently found.

**Canary correction:** [#395 L5 log](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/actions/runs/37398571818/job/112060299722) shows T9 **passed** and M12 **passed**. L5 failed S13, B9, M5, M6 and M7 because the planted completed-transfer-history emulator failure was exercised and propagated. The prior “stale Rules reference” explanation is wrong. L1 catches the planted contract; L3 and L5 catch the same planted emulator. Thus two failure categories, one canary head, not three independent controls. Retrieved head runs showed attempt 1 with no retry; the no-rerun conclusion is bounded to those retrieved records.

**Infra attribution:** #396's first L5 [job 112060306128](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/actions/runs/37398574147/job/112060306128) deliberately fails setup before tests; first seal [112064571914](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/actions/runs/37398574147/job/112064571914) reports INFRA_RETRYING. Physio's HTTP 201 log ties the automatic action to this run/head; attempt-2 [seal 112067529502](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/actions/runs/37398574147/job/112067529502) passes. This verifies one successful simulated recovery, not a real-world recovery rate. “GitHub gave it no machine” is misleading here: the simulation acquired a runner then failed setup. Derive user-facing cause text from actual classification.

**r62→r63→r64 Rules:** #422, #431 and #432 heads were respectively `6452d0b455fe45f55c3085a64d9b94005eafe479`, `5a1b5ad350ce169fd7605365035b91e37f8a2224`, `a541ed3c83699481b06fa402910f654ee0678c83`. Their historical L5 logs ([#422](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/actions/runs/37883762311/job/113669066507), [#431](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/actions/runs/37882880965/job/113666323792), [#432](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/actions/runs/37882963790/job/113666590392)) fail T9 and dependent M12: live origin/main was r63 `2b8b043fa7c56531a622f658da27dbda0c98771f`; fixture still reviewed r62 `bc77a0b934c3d43279f27f73a72db21c2db2b4f2`. They are merged to gameplay/bug-list-1 now. Those historical reds are legitimate review/fingerprint detection, not a proven Gate routing defect or present open-head blocker.

[#435](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/435) updates the reviewed [main-delta fixture](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/963a97913734c815fc053bc2c3db209ed32e6183/tests/fixtures/composed-production-rules/main-delta.json) and release text without disabling Rules/tests. Production/candidate hash `0f2b8f894fb315bb523b5f8bbd6ffe04f65c8d07af8419efd4e0b7ce0ceb8ee6`, blob `649d339091a68ac902d525215ec8a27b86e6ee98`, 134,679 bytes, empty allowed hunks. The prior Z4 pointer change had shipped. Current r64 [L5 log](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/actions/runs/37890012813/job/113688579736) passes T9 against origin/main `963a979`, M12 and all 52 numbered checks; gap suite also passes 69 cases. Latest #424 L5 independently passes the same hash and 52 checks. The fixture's recorded r63 commit need not match every new main commit when composed bytes/deployment composition are unchanged. Re-review actual changed bytes/build path; never suppress T9/M12 or automatically approve every refreshed pin.

**Representative additional failure:** historical #424 head `34cd0fa555bb8d4f084d320153d11a755b2440df`, [L6 log](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/actions/runs/37887342927/job/113680197765), shows AssertionError at 05:16:23 UTC against terminal wording regex `/TERMINAL · NO NEW SESSION · NO NEW SEASON/`; L5 also failed its old pin. Gate FAIL_TEST is real test evidence. The later passing #424 head supersedes it; don't attribute old failures to that new head.

**Zero billing/product authority:** Rules build and [boundary guard](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/963a97913734c815fc053bc2c3db209ed32e6183/scripts/assert-firestore-zero-billing-boundary.mjs) preserve static Spark/no-billing assertions. Emulator and composed-artifact checks remain enabled. Static code/CI does not prove the external Firebase billing account, currently deployed Rules identity, or two physical managers' real authenticated production journey. No deployment or physical-product acceptance was performed. POS20's **project operating system** and decision/acceptance rules remain distinct from the **Validate POS20 GitHub workflow**.

## 5. Shadow exit evidence and fair performance
### Frozen 16-head comparison
These are recent completed, non-cancelled PR Gate runs, deduplicated by exact head, paired with POS20 and Gameplay Fast when available. All 16 independently retrieved selector/seal logs show matching `POS20_FULL_SEAL` profiles; all are attempt 1. No infra-only control was counted as an ordinary comparison. Run API PR metadata can reflect later PR state, so the exact run `head_sha` and logged head—not the mutable nested PR head—identify each historical observation.

Columns queue, span and runner values are ordered **Gate / POS20 / Gameplay Fast**, with the third value omitted when absent. Queue = earliest active job start − run creation; span = last active job completion − earliest start; runner = sum of active job durations. Seconds and runner minutes are unrounded in calculation, displayed to two decimals for minutes. Span includes inter-job waiting; it is not CPU time. Failure rows remain failed workloads, not speed-win examples.

| Exact head | Gate run | POS20 / Gameplay Fast run | Gate/old union outcome | Queue seconds | Span seconds | Runner minutes |
|---|---|---|---|---:|---:|---:|
| `71f338e7340f86a0910e97aeff02f3ae93efbd27` | [37889982075](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/actions/runs/37889982075) | [37889981984](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/actions/runs/37889981984) / [37889976778](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/actions/runs/37889976778) | PASS/PASS | 4/4/3 | 480/827/359 | 36.00/22.43/16.27 |
| `a16ad842196cdb7f1ff49ad863fbda954ddf0b5e` | [37888302747](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/actions/runs/37888302747) | [37888302654](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/actions/runs/37888302654) / [37888299179](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/actions/runs/37888299179) | PASS/PASS | 238/637/360 | 940/713/392 | 34.98/22.25/15.97 |
| `6bf38984d10f354208b39ef119ca2c3ae912ac15` | [37888251861](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/actions/runs/37888251861) | [37888251620](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/actions/runs/37888251620) / absent | PASS/PASS | 22/7 | 1046/1173 | 32.45/22.32 |
| `202136b6d2fdd63ff8bb49b2e96820099107f4d7` | [37888179527](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/actions/runs/37888179527) | [37888179499](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/actions/runs/37888179499) / [37888176596](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/actions/runs/37888176596) | PASS/PASS | 95/196/435 | 781/812/537 | 34.65/22.23/17.23 |
| `952c14b67ebf6ac3bc97ab85472b90c0a2d8434f` | [37888178969](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/actions/runs/37888178969) | [37888178974](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/actions/runs/37888178974) / absent | PASS/PASS | 66/267 | 673/995 | 35.97/22.12 |
| `34cd0fa555bb8d4f084d320153d11a755b2440df` | [37887342927](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/actions/runs/37887342927) | [37887342878](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/actions/runs/37887342878) / [37887338856](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/actions/runs/37887338856) | FAIL_TEST/FAIL | 3/3/3 | 620/495/366 | 33.80/21.22/16.53 |
| `4c48cee9fb3fe62afa6322db2cd4a502576469f5` | [37887091534](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/actions/runs/37887091534) | [37887091525](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/actions/runs/37887091525) / absent | PASS/PASS | 3/3 | 549/534 | 35.27/20.58 |
| `83824fba5ddb2c62dae73993cdb702090dca55f4` | [37885661877](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/actions/runs/37885661877) | [37885661868](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/actions/runs/37885661868) / absent | FAIL_TEST/PASS | 3/3 | 547/391 | 35.38/21.82 |
| `b0b118dc9d206e43f5ac7555390a524c6b15593d` | [37884230167](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/actions/runs/37884230167) | [37884230154](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/actions/runs/37884230154) / [37884227154](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/actions/runs/37884227154) | FAIL_TEST/FAIL | 44/61/7 | 610/465/410 | 34.88/20.43/18.40 |
| `590da774f8dffce17ee58ac302df17d49b52b427` | [37883767764](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/actions/runs/37883767764) | [37883766643](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/actions/runs/37883766643) / [37883762157](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/actions/runs/37883762157) | FAIL_TEST/FAIL | 28/28/3 | 595/512/321 | 27.70/17.37/15.27 |
| `6452d0b455fe45f55c3085a64d9b94005eafe479` | [37883762311](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/actions/runs/37883762311) | [37883762404](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/actions/runs/37883762404) / [37883757897](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/actions/runs/37883757897) | FAIL_TEST/FAIL | 4/4/3 | 719/710/344 | 32.28/22.13/16.82 |
| `4e8b251e1edc3de0542a21270277aed2f998da90` | [37883384105](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/actions/runs/37883384105) | [37883383948](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/actions/runs/37883383948) / absent | FAIL_TEST/PASS | 3/3 | 629/660 | 31.77/22.58 |
| `a541ed3c83699481b06fa402910f654ee0678c83` | [37882963790](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/actions/runs/37882963790) | [37882963810](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/actions/runs/37882963810) / absent | FAIL_TEST/PASS | 3/3 | 566/486 | 34.65/21.37 |
| `5a1b5ad350ce169fd7605365035b91e37f8a2224` | [37882880965](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/actions/runs/37882880965) | [37882879882](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/actions/runs/37882879882) / absent | FAIL_TEST/PASS | 3/3 | 515/418 | 34.77/21.33 |
| `ab444ba83d0f4c302dc9a073df9ffd367e610f97` | [37878932264](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/actions/runs/37878932264) | [37878932284](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/actions/runs/37878932284) / absent | FAIL_TEST/PASS | 4/4 | 543/423 | 34.45/22.40 |
| `c735cc6b4732a8c7c64d716ff5c45ae930b9c416` | [37874796267](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/actions/runs/37874796267) | [37874796272](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/actions/runs/37874796272) / absent | PASS/PASS | 3/3 | 574/412 | 31.95/22.83 |

| Existing criterion | Audit result | Interpretation |
|---|---|---|
| ≥10 comparable heads | 16 unique heads | Met in bounded sample; not representative random sampling |
| ≥2 full seals | 16 full-route executions, **7 successful paired full seals** | Met even under the safer successful-seal interpretation |
| Gate PASS while old FAIL = 0 | 0; seven both pass, three both fail, six Gate fail/old pass | No observed unsafe disagreement; conservative disagreement still needs explanation |
| Same route | 16/16 observed | Evaluator omission remains a defect despite sample equality |
| Gate executed evidence superset | 15/16; head `590da774f8dffce17ee58ac302df17d49b52b427` missing ten old successful IDs | Strict replay blocks exit. Failed sequential Gate steps stop later proofs while old parallel jobs can pass; missing successful evidence on this failed head does not alone prove a passing-head routing gap |
| Two distinct real-failure controls | Two planted categories on **one head**, #395 | Insufficient for two independent head records; owner must specify category-vs-head identity; duplicate arguments are not new evidence |
| One infra rerun, successful and attributed | #396, exactly one automatic rerun then PASS | Met for this simulated case, independently attributed to Physio |

The unmodified evaluator replay returns **ready:false** (superset/control criteria fail). A hypothetical exclusion of the failed early-exit head would leave 15 heads and seven passing full seals, but does not resolve canary independence, security, or evaluator correctness. No exit success is asserted. To fix failed-head comparison, separately instrument expected/started/successful proof sets and keep no-missing-evidence mandatory on passing heads; obtain owner approval for semantics before revising any criterion.

Excluded/unknown: pending exact #424 at initial freeze (later verified separately); cancelled runs including 37887946280 and 37887533983; main push runs (not PR quota); synthetic/local cases; #395/#396 controls (not ordinary quota); absent Gameplay Fast where its branch trigger did not apply; unretrieved older history and binary artifacts. Repeated pagination records and repeated heads count once. Sixteen heads are not sixteen independent product areas; related PR revisions cluster.

### Latency/resource conclusions
Median is conventional middle-value average for even n; p90 is nearest rank `ceil(0.9n)`.

| Sample | Gate span median / p90 | POS20 span median / p90 | Old observed union span median / p90 | Gate runner-min sum | POS20 runner-min sum | POS20 + observed Fast runner-min sum |
|---|---|---|---|---:|---:|---:|
| All 16, including failures | 602.5s / 940s | **523s / 995s** | 537s / 995s | 540.95 | 345.42 | 461.90 |
| Seven paired successes | 673s / 1046s | 812s / 1173s | 832s / 1173s | 241.27 | 154.77 | 204.23 |

Old observed union span runs from the earliest active job start across the paired old workflows to their latest completion. Different push/PR creation times can affect that interval; absent Fast does not imply a separately measured equivalent union. These union statistics include only Fast runs actually observed on each exact head.

All-16 initial queue median is 4s for each validator. Queues reach 238s Gate / 637s POS20 on one paired head; job waves and queue contention strongly affect wall time. The seven-success sample has lower Gate median wall time, but only three have a separate Fast run, and Gate always includes additional fixed suites. Across all sixteen, Gate has higher runner occupancy than POS20 plus the Fast runs actually observed. Neither finding establishes an overall production speed/cost advantage. Shadow runs consume both candidates and old validators.

For #435, jobs API timestamps give Gate 05:07:48→05:16:57 UTC (**549s**) vs POS20 05:07:48→05:16:42 (**534s**), initial queue 3s each; runner occupancy **35.27 vs 20.58 minutes**. The prior log-line method gave approximately 545s vs 530s; both methods yield **15s longer for Gate**. Different start/end definitions explain the four-second offset, not a contradiction.

Runner-minutes here are occupancy proxies, not GitHub billing invoices or actual CPU utilization. Retry records may carry prior successful jobs with identical execution timestamps under later attempt metadata; count those executions once across attempts. No retry-cost percentage was inferred. No percentage speed improvement is claimed.

### Reproduction and snapshot appendix
The two independent cases below use only pure functions from a **local checkout pinned to the audited main SHA**; no API calls or credentials are required. Run with Node in module mode. They reproduce omissions, not a production attack.
```js
import {compareHead, evaluateExitCriteria}
  from './scripts/gate-compare.mjs';
import {LANE_IDS, LANES, selectedFor, evaluateSeal}
  from './scripts/showdown-gate.mjs';
const head = 'a'.repeat(40);
const c = compareHead({
  head,
  pos20: {verdict:'PASS', profile:'POS20_FULL_SEAL', ran:['x']},
  gate: {verdict:'PASS', profile:'OTHER_FULL_SEAL', ran:['x']}
});
const canary = {
  head:'b'.repeat(40), gate:{verdict:'FAIL_TEST', run_attempt:1}
};
console.log(evaluateExitCriteria({
  comparisons:Array(10).fill(c),
  canaries:[canary, canary],
  infraRuns:[{run_attempt:2, watchdog_reruns:1, conclusion:'failure'}]
}).ready); // actual true; expected false for these invalid inputs

const route = {profile:'POS20_FULL_SEAL', tests:[], proofs:[], operations:false};
const needs = Object.fromEntries(LANE_IDS.map(l =>
  [LANES[l].job, {result:'success'}]));
const lanes = Object.fromEntries(LANE_IDS.map(l => [l, {
  schema:'showdown-gate-lane/v1', head_sha:head, lane:'WRONG',
  job:'WRONG', run_attempt:99, route_profile:route.profile,
  result:'success', selected:selectedFor(l,route), ran:selectedFor(l,route)
}]));
console.log(evaluateSeal({
  event:'pull_request', draft:false, headSha:head, prLiveHead:null,
  route, needs, lanes, runAttempt:1, runId:100
}).verdict); // actual PASS; incomplete identity/current-head validation
```

For the strict failed-head superset row, the ten missing successful IDs are HOME_BOOTSTRAP_INLINE, JS_SYNTAX, LEAGUE_CONFIRMATION_INLINE, LIFECYCLE_COMPOSED_1_3_5_10, LIFECYCLE_COMPOSED_RULES_BUILD, SETTINGS_WORKSTREAM_INLINE, SPARK_ACCOUNT_BOOTSTRAP_EMULATOR, STATIC_APP_RELEASE, TRANSFER_WORKSTREAM_INLINE and V1_VISUAL_IMMERSION_INLINE. Distinguish these successful-execution IDs from selector omission.

The 16-head time window is October 9, 02:29:14–05:44:01 UTC (run creation identifies the window, not retrieval). The final open-PR inventory below was fetched around 06:10 UTC. #424 left the open list during this audit; draft #313 and #312 changed heads during it. No current-head pass/fail inference is made for the other inventory rows without separately inspected exact-head logs.

| Current open PR | Exact head at state recheck | Base branch | State |
|---|---|---|---|
| [#425](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/425) | `2b88d4ae727c20e4329ca7b74d92befd70872e2b` | `qa/bug-olympiad` | ready |
| [#381](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/381) | `3b8cb664989ea1c7c7132c19fda14ac974897ad1` | `factory/v1-wtt5ye` | ready |
| [#341](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/341) | `3ce83562670cd21f612821768719d2a53abde9a5` | `main` | draft |
| [#313](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/313) | `fb3d5f16e9f34cb8ac94a8c7ba7d0d5aa3a7ebc9` | `factory/gameplay-v1-base` | draft |
| [#312](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/312) | `0a0ee6470ac57ffb94080b3ecf461988f0478c81` | `leads/relay-base` | draft |
| [#311](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/311) | `1ed3e3710962bd390b62d25d895056f6b41629d9` | `visual/cinematic-system-v10` | draft |
| [#304](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/304) | `f496dbf918bb5f38df7a7c56f93ba0b67202d186` | `main` | ready |
| [#301](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/301) | `b646e17c6aa79d67bd9a489c3c4853e9861d2c86` | `visual/r9-r44-global-screen-realignment` | draft |
| [#299](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/299) | `d7a68de3a7b002b707f39284ea75306f685129e4` | `main` | draft |
| [#298](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/298) | `f478776d916d8c26a2b8448c1ba1a7a2e1c14bb1` | `main` | draft |
| [#238](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/238) | `1b106148fc24cc69047bfebcb3a1cf644b6c36cf` | `main` | draft |
| [#234](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/234) | `0e76b3f67df3394cf3967b2d3f8994855cb08119` | `main` | ready |
| [#221](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/221) | `2a0e668a13fe38383d07d50d0a0a134bfefd718e` | `main` | draft |
| [#185](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/185) | `235f59f5d30f3800142dc94c78f4528050e60f3f` | `main` | ready |
| [#170](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/170) | `6ab378fb0abb1a162a98f661fed40c78c7ab3028` | `main` | ready |
| [#164](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/164) | `ecb1abedefefd346a3a18e71c9b3923a662df292` | `main` | draft |
| [#152](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/152) | `43353922eddf3596deeaf5f2afdf19e4919f019c` | `main` | ready |
| [#37](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/37) | `221212a87cc58712a1ebd9452d7b71cdaa36327d` | `main` | draft |
| [#35](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/35) | `6ce9b1bb1ff3f0328c4992ce9eab6bdd21e6d34b` | `main` | draft |

## 6. Concrete readiness checklist and owner decisions
**Technical blockers, in priority order:**
- [ ] Isolate Actions write authority from every candidate-source execution path; verify token permissions in logs and safe negative cases.
- [ ] Repair exit evaluator omissions; prove duplicate heads/canaries, mismatched profiles, failed full seals, manual/failed retry and missing evidence cannot yield ready.
- [ ] Bind seal provenance, handle unavailable live PR head explicitly, and retain validated same-run earlier-attempt successes.
- [ ] Publish a pinned, deduplicated comparison with independent failure controls, successful full seals and attributed recovery; explain all conservative disagreements.
- [ ] Preserve T9/M12 and zero-billing checks; review Rules changes only against actual composed bytes/build provenance.
- [ ] Collect ≥10 successful coverage-equivalent pairs and route/load strata, queue/inter-job waits, retries and deduplicated runner occupancy; apply a predeclared efficiency threshold.
- [ ] Independently verify required-check/ruleset policy and rehearse a reviewed rollback path before any check transition.

**Owner decisions:** define canary independence and successful-full-seal semantics; decide acceptable trust/verifier architecture; choose protection scope and bypass policy; set performance/resource thresholds and rollout owner. These decisions cannot be inferred from a green badge or this score. Any new control PR, live retry simulation, workflow patch, permission change or promotion requires a separately authorized task.

**G-lead decision request:** record KEEP_SHADOW, or challenge it with the exact SHA/run, contrary code/log evidence, and the finding or score deduction that evidence falsifies. Preserve POS20 project authority and existing validation while resolving the blockers.

