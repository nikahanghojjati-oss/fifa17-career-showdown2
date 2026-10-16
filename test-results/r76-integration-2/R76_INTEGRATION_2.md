# JOB-1830 r76 integration round 2

**Do not merge.** Tested product head: `b2e68639e835e5be9b0d17423ef175fb88360084`. Base: `2f3865feca484223ac7d267d83a9c4828bad3078`. Seventeen PRs are combined; #847 is excluded for a non-additive product-code conflict. The release ship gate is **not established**: three browser audits fail and every emulator journey stops after the first acknowledged season. Full-season cost and the 10/day (60-minute) / 14/day (30-minute) targets remain unproved.

## Target advanced during the pause

At publication, `gameplay/bug-list-1` is `5c66c989f415676f57f7b8d0318fa17ea3925cdd`, including #864 and #865. Several source PRs have since closed/merged; their heads did not change. `live-pr-state-at-publication.json` records that later state. They were open when selected and merged in the original integration sequence. The frozen tested branch remains based on the requested original r75 snapshot. **It has not been rebased or validated against the advanced target.** The new target includes the three TEST ONLY contracts and fixes; importing it would violate this job’s instruction to keep those tests out of this branch and would mix code heads. This is an evidence/integration draft, not a merge-ready successor to the advanced target. Its diff/mergeability must be reviewed with that distinction.

## Base check

| Run | Full contract census | Decoded before reveal failed? | Evidence |
| --- | --- | --- | --- |
| 1 | PASS | no | [log](base-contracts-1.log) |
| 2 | PASS | no | [log](base-contracts-2.log) |
| 3 | PASS | no | [log](base-contracts-3.log) |

The named `tests/contracts/season-entry-no-flash-contracts.cjs:115` failure occurred **0/3** times. No KNOWN BASE exemption was used. The unchanged base passed 191/191 blocking contracts in each run.

## Ordered integration

| PR | Source head | Decision | Tested merge head | Evidence |
| --- | --- | --- | --- | --- |
| #836 | `638eac62b09aa5aec77a0566b711b17e5cdb73c5` | merged | `8bfd46f0a1d0b177e524698d475828fc15b0d3a6` | syntax / contracts / ops PASS; [logs](pr-836-contracts.log) |
| #837 | `1cdaab57066e675c3b9d13b9cf2f8f0d8679c800` | merged | `962b1810086f062ed3d529fc2cbe9c1a2ca2634f` | syntax / contracts / ops PASS; [logs](pr-837-contracts.log) |
| #838 | `20b9349e9b1b36aab9c5aec7498a22a6e614c35c` | merged | `dd24d665fd19db600bb021ed15db4844f4f10779` | syntax / contracts / ops PASS; [logs](pr-838-contracts.log) |
| #845 | `33aabae4356ab2ee59fbb215c3af4ce3dabfe676` | merged | `cd9307fa6a0c35a11d9eaa601c7fc915299af943` | syntax / contracts / ops PASS; [logs](pr-845-contracts.log) |
| #841 | `8c3e1f23b7bb51ee16075b26848d644c8e454e49` | merged | `3c054e1733dd067a5987e0da5ef21306f020c520` | syntax / contracts / ops PASS; [logs](pr-841-contracts.log) |
| #846 | `e4349c2502675a3e1001d4952e34f1f8e432f74e` | merged | `4b67989763a2c6962c2e99d3982229223ee18781` | syntax / contracts / ops PASS; [logs](pr-846-contracts.log) |
| #839 | `9b9675fe51c5f4a771f9c01217724f03077c21d7` | merged | `e4f043cb1ce4c70c762f3453857599b34eae1143` | syntax / contracts / ops PASS; [logs](pr-839-contracts.log) |
| #840 | `4f57485eb07fdfa257546868b1875b027ea038a7` | merged | `e363f92f747829426e1d6b7c610bd30db8f1b5e5` | syntax / contracts / ops PASS; [logs](pr-840-contracts.log) |
| #844 | `2ebe8c391698c92e6bbc873d031c94f6a16ab206` | merged | `f3474fcfc1450117e20e2c52f6fc3b5b9141852a` | syntax / contracts / ops PASS; [logs](pr-844-contracts.log) |
| #862 | `cf1ace2b3c122f742e5b07a3306eb1078c93d682` | merged | `36de11f04d8206be5801ebf79e862c6de7deed79` | syntax / contracts / ops PASS; [logs](pr-862-contracts.log) |
| #848 | `b8f3b767027a400a1ac7f02d0313c7c125e7547b` | merged | `d2f1409e5cd288f8a5dfa0cf1809101426d8b037` | syntax / contracts / ops PASS; [logs](pr-848-contracts.log) |
| #849 | `ec6e23fdbcb4fd87f4c1cd1df37f1d6d3e9416ea` | merged | `e8c8c0201d107f350a573b1f25b895822a7c780b` | syntax / contracts / ops PASS; [logs](pr-849-contracts.log) |
| #850 | `a579446f97fd880836a5e13ad2659ad41e2fa258` | merged | `b2938196fe68f6c1e687b70f28cddf08e656d994` | syntax / contracts / ops PASS; [logs](pr-850-contracts.log) |
| #856 | `306e2e0700ae7bdf977f2056b6c4d1bf0abc01e4` | merged | `37ac4b7d5ef6c9384359c7c12bbfea05968dd197` | syntax / contracts / ops PASS; [logs](pr-856-contracts.log) |
| #860 | `ebada1276f01ae1f311f152802bfb1b929efbd6a` | merged | `955e2817d4d793e681ff28eab0b8c707a5e02f08` | syntax / contracts / ops PASS; [logs](pr-860-contracts.log) |
| #861 | `7d3df03ba0f7c4a92fa13513d6aa8c7f8aff957e` | merged | `9f2553863e2645cfb8a666019e918faf5341fcd7` | syntax / contracts / ops PASS; [logs](pr-861-contracts.log) |
| #863 | `d158e00df91c3e5d1769965f34f07a8e2e84a1dc` | merged | `b2e68639e835e5be9b0d17423ef175fb88360084` | syntax / contracts / ops PASS; [logs](pr-863-contracts.log) |
| #847 | `74c6422f0070ba888816d6f1c7c98aa93444eb72` | CONFLICT | `b2e68639e835e5be9b0d17423ef175fb88360084` | [both sides and conflicting hunks](conflict-847.txt) |

Every kept merge passed syntax, the complete contract census, and operations: **51 per-merge check executions**. Source branches were fetched and verified against their live PR heads. `merges.json` contains the exact command, exit, duration and tail for every check. #863 is the open JOB-1829 PR. #862 already contains #842; #861 already contains #852. #842, #843, #851, #852, #853, #854 and #855 were not merged separately. #857–#859 were kept out of the product head.

Only adjacent additive registrations were resolved, preserving both sides in PR order. An initial resolver wrongly rejected #846 because a single-line expected-test array had earlier insertions. Before continuing, the superseded later checks were allowed to finish, that unpublished sequence was rewound to the validated #841 head, and #846 onward was replayed with an append-only ordered-set resolution. Superseded evidence is retained under `superseded-order-correction/`; it is not used to credit the final head. No product fix or existing test assertion was authored or loosened. #847 overlaps existing `js/seasonFinalV10.js` changes; the merge was aborted and its full conflicting diff and all ancestor/earlier/incoming sides were saved in `conflict-847.txt`.

## Whole-head checks

The package script contains **30 browser audits plus one deterministic lifecycle check**. It stopped at Shared Season Results; the remaining audits were run once individually. Browser audits: **27 PASS, 3 FAIL**. The lifecycle check passed. The separate screen-flash audit also passed.

| Audit | Result |
| --- | --- |
| `tests/browser/persistent-pair-user-facing-routing-audit.cjs` | PASS |
| `tests/browser/production-shared-setup-overlay-audit.cjs` | PASS |
| `tests/browser/shared-showdown-polished-presentation-audit.cjs` | PASS |
| `tests/browser/shared-career-start-r33-audit.cjs` | PASS |
| `tests/browser/shared-transfer-challenge-replay-audit.cjs` | PASS |
| `tests/browser/shared-season-results-audit.cjs` | FAIL |
| `tests/browser/shared-season-commit-audit.cjs` | PASS |
| `tests/browser/shared-season-commit-second-publisher-audit.cjs` | PASS |
| `tests/browser/shared-canonical-scoring-audit.cjs` | PASS |
| `tests/browser/shared-history-convergence-audit.cjs` | PASS |
| `tests/browser/shared-multi-season-progression-audit.cjs` | PASS |
| `tests/browser/shared-journey-reconnect-audit.cjs` | PASS |
| `tests/browser/ssjr-production-acceptance-recorder-audit.cjs` | PASS |
| `tests/browser/ssjr-production-actor-evidence-v2-audit.cjs` | PASS |
| `tests/browser/stability-audit.cjs` | FAIL |
| `tests/browser/connected-account-settings-audit.cjs` | PASS |
| `tests/browser/settings-offline-save-library-editor-audit.cjs` | PASS |
| `tests/browser/stage3-private-pairing-audit.cjs` | PASS |
| `tests/browser/pairing-four-code-automation-audit.cjs` | PASS |
| `tests/browser/stage4-remote-local-reconciliation-audit.cjs` | PASS |
| `tests/browser/stage5e-remote-joining-audit.cjs` | PASS |
| `tests/browser/stage5g-remote-joining-reconnect-audit.cjs` | PASS |
| `tests/browser/stage5h-remote-joining-adverse-network-audit.cjs` | PASS |
| `tests/browser/stage5i-remote-joining-acceptance-recorder-audit.cjs` | PASS |
| `tests/browser/shared-showdown-setup-audit.cjs` | PASS |
| `tests/browser/shared-showdown-paired-first-entry-audit.cjs` | FAIL |
| `tests/browser/shared-journey-conflicts-audit.cjs` | PASS |
| `tests/browser/shared-local-reconciliation-audit.cjs` | PASS |
| `tests/browser/shared-final-reconciliation-audit.cjs` | PASS |
| `tests/browser/shared-terminal-close-audit.cjs` | PASS |

| Check | Exit | Last line |
| --- | --- | --- |
| screen-flash | 0 | `v10 screen flash audit: PASS` |
| firestore-budget | 0 | `PASS Firestore budget contracts: 16 checks, measured reads/min 3.4 / 0.0 / 3.0 / 1.8 / 60.0 (waiting <= 5 reads/min, hidden 0, idle writes 0, partner update <= 1000 ms).` |
| reus-startup | 0 | `PASS Reus Gate startup contracts: source, slow start (motion and reduced motion), screen plate gate (Rule Book, Club), no-loader fallback, failed-loader release.` |
| startup-size | 0 | `Accessibility and presentation budgets passed for 1.9.1-r75: 158862 raw / 37397 compressed initial bytes; 4845 lazy feedback bytes.` |

See [browser-failures.md](browser-failures.md) for each failing file:line, expected screen, observed screen, and intended-change classification. Two dashboard assertions conflict with JOB-1806; the missing REVIEW CONNECTION control remains a real unresolved audit failure. Existing tests were not modified and failures were not retried as passing evidence.

Final kept-merge check tails:

```text
POS10 syntax: 358 active source files, 0 failures
PASS Transfer Challenge read dedupe contracts
PASS POS10 selected deterministic census (204/204 current blocking contracts: frozen POS10 floor + POS20 supplements).
ℹ tests 73
ℹ suites 0
ℹ pass 73
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 891.151798
```

## Meter and daily capacity

The JOB-1824 meter was copied byte-for-byte. JOB-1825’s unchanged `capture.cjs`, `compact-traces.cjs`, `model.cjs` and `analyze.cjs` observers were used. The model is **server client reads plus distinct concrete Rules documents per backend request**, counting repeated dependency paths once. The composed Rules SHA matches the reference; 129 published N=3 signatures were reused, with no fresh probe replay. Unmatched authorizations remain unpriced and are assigned a conservative allowance of 20 Rules reads each for an illustrative upper estimate. Source/signature reuse and imperfect coverage are estimation limits, not proof of production billing. Raw request bodies, synthetic emulator auth tokens and IDs remain in scratch files, outside this committed report.

| Run | Completed | Wall min | All client reads | All writes incl. verifies | Partial request-model reads | Unpriced authorizations | Reads/writes per complete season |
| --- | --- | --- | --- | --- | --- | --- | --- |
| m3 | 0/3 loop seasons; S1 acknowledged | 3.85 | 512 | 154 | 2073–2213 | 7 | not established |
| i3 | 0/3 loop seasons; S1 acknowledged | 12.17 | 578 | 154 | 2467–2587 | 6 | not established |

These are **partial-run totals**, not normalized three-season costs. Both runs reached a dual-acknowledged S1 and passed S1 scoring/history and resume-to-season-2 checks, but `seasonLog.push` occurs after the next-season excursion; that excursion fails, so the harness reports zero fully completed loop seasons. Terminal close and later-season amortization were not measured. Do not divide these totals by three. The JOB-1824 complete m3a reference is 404.3 gameplay client reads / 135.0 writes per season; its full totals are 1,311 / 407. The new m3 totals are 512 / 154 for the incomplete S1 slice, with request-model reads 2,073–2,213; no complete per-season comparison is valid.

Waiting rates are for both managers combined. Each new state has **one** season-1 two-minute window, rather than three complete seasons. Both actual browser visibility states were checked at entry; real tab hiding was used. All four windows recorded zero SDK traffic and zero modeled backend read cost. The meter’s AST-evaluation counter differs during the Home bracket (490 evaluations despite no new SDK traffic); coverage brackets can include delayed/observer work and are not substituted for billable distinct-document reads. All raw summary counters are retained.

| Waiting screen (both managers) | New windows | Minutes | JOB-1824 client reads/min | New client reads/min | JOB-1825 modeled reads/min | New modeled reads/min | New writes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Showdown Home visible | 1 | 2.000 | 9.13 | 0.00 | 36.41 | 0.00 | 0 |
| Standings visible | 1 | 2.003 | 9.80 | 0.00 | 37.20 | 0.00 | 0 |
| Season Results visible | 1 | 2.000 | 23.59 | 0.00 | 118.86 | 0.00 | 0 |
| Season Results Nik hidden | 1 | 2.001 | 13.06 | 0.00 | 61.09 | 0.00 | 0 |

| Minutes/season | JOB-1824 conservative seasons/day | JOB-1825 request-model seasons/day | Validated final-head seasons/day | If the incomplete S1 slice represented a full season |
| --- | --- | --- | --- | --- |
| 60 | 1.91 | 8.69 | NOT ESTABLISHED | 22.59–24.12 (partial-sample illustration only) |
| 30 | 2.76 | 13.06 | NOT ESTABLISHED | 22.59–24.12 (partial-sample illustration only) |

Formula: `min(50000 / modeled reads, 20000 / writes)` for the two managers together, with equal waiting time on the three both-visible screens. The final column only substitutes the incomplete m3 S1 slice (2,073–2,213 modeled reads, 154 writes) and the observed zero idle rate. It omits unmeasured terminal/later-season work and is **not a validated forecast or ship-gate pass**. The answer to whether complete 60-minute seasons reach 10/day and 30-minute seasons reach 14/day is **unproved in this job**.

The first i3 attempt was interrupted by the execution-session loss while its first Home window was still RUNNING: 30/30 checks, no failure, no completed window. Its partial summary/log are retained under `interrupted-i3/`. On continuation, the static server and virtual display were restored and only that interrupted i3 run was restarted. The completed m3 failure was not retried. Emulators ran sequentially with Java heap capped at 2 GiB; no OOM event was observed. All projects were local `demo-cms-browser-journey`; no real Firebase project, merge or deployment was used.

## CE2PG

| Run | Finished | Browser / wall min | Checks passed | Loop seasons | Failed IDs vs m3a / m5 | History / Career / Trophy / Legacy |
| --- | --- | --- | --- | --- | --- | --- |
| ce2pg-3-1 | no | 3.49 / 3.69 | 76/82 | 0/3; S1 acknowledged | 6 new vs each reference | S1 only; later seasons / final / cleared / fresh views unproved |
| ce2pg-5-2 | no | 4.12 / 4.45 | 76/82 | 0/5; S1 acknowledged | 6 new vs each reference | S1 only; later seasons / final / cleared / fresh views unproved |
| ce2pg-10-3 | no | 3.67 / 4.00 | 76/82 | 0/10; S1 acknowledged | 6 new vs each reference | S1 only; later seasons / final / cleared / fresh views unproved |

Every run stopped on the same stale navigation path. The unchanged harness expects Rivalry Statistics Back to restore the dashboard (`ce2pg-journey.cjs:691`, meter `:855`), while JOB-1806 lines 8–17 require Home. It records `screens=mainMenu` on both browsers, then clicks hidden `#seasonPrimaryAction` at `ce2pg-journey.cjs:574` (meter `:738`) and times out. This is a **harness incompatibility with an intended change**, not evidence that the player’s visible Continue Career control is broken. The harness was not changed or bypassed to manufacture multi-season proof. No run finished and no terminal witness was reached.

All five meter/journey runs have the following six new failed IDs compared separately with each of JOB-1824’s m3a and m5 reference lists:

- `S1.excursion.stats.daniel`
- `S1.excursion.stats.nik`
- `S1.excursion.trophy.daniel`
- `S1.excursion.trophy.nik`
- `S1.rivalry.back.daniel`
- `S1.rivalry.back.nik`

`journey-comparison.json` retains the exact lists for every run, both comparisons, timings and fatal states. Original JSON/logs remain verbatim.

`excursion.stats` (`ce2pg-journey.cjs:660`, meter `:824`) expects NO COMPLETED RECORD YET. Both browsers instead display a career table with zero completed Showdowns and one accepted season, matching visible current points/trophies. `excursion.trophy` (`:665`, meter `:829`) expects all cabinet values to be dashes; both browsers instead display S1 league/Champions League honours. JOB-1809 lines 27–33 request live Rivalry Statistics, and JOB-1818/CARD-HUNT-B10-1 requests fresh Career/Trophy cache rendering, but neither explicitly changes completed-career eligibility to include an active Showdown. These **four assertions remain unresolved semantic failures**, not excused as proven intended behavior. The two `rivalry.back` failures are the intended Home route described above. No new network, production-host, uncaught-page-error or Rules-expression-limit check failed in these attempts.

After S1, all eight Shared History checks (heading, totals/lead, W-D-L/points, trophy attribution on both browsers), canonical season scoring, the next-season dashboard, and fresh-runtime session/resume checks passed. Legacy correctly showed no completed Showdown on both browsers. Career Statistics and Trophy Room displayed the same current S1 figures on both browsers but failed the completed-only expectations above. **Matching all four screens after every requested season, including final/cleared/fresh-browser views, was not proved** because seasons 2+ and terminal phases were never reached.

## TEST ONLY checks

| TEST ONLY PR | Source head | New test | Result | First failure |
| --- | --- | --- | --- | --- |
| #857 | `f9db71a7f99fbc713e948685818e5e6dbb241e87` | `tests/contracts/sweep-biggest-showdown-tie-contracts.cjs` | FAIL | `  AssertionError [ERR_ASSERTION]: equal cross-manager wins must be shared at TestContext.<anonymous> (tests/contracts/sweep-biggest-showdown-tie-contracts.cjs:52:12)` |
| #858 | `66e6e0fb1a8233939aed8f1c555f10181e475caa` | `tests/contracts/sweep-career-table-level-rank-contracts.cjs` | FAIL | `AssertionError [ERR_ASSERTION]: Expected values to be strictly deep-equal: at tests/contracts/sweep-career-table-level-rank-contracts.cjs:61:12` |
| #859 | `d8961abd5eb5e92d73a425b279b0d62a7611775a` | `tests/contracts/sweep-missing-season-stats-contracts.cjs` | FAIL | `  AssertionError [ERR_ASSERTION]: Missing expected rejection: leaguePoints=null must not become zero at async TestContext.<anonymous> (tests/contracts/sweep-missing-season-stats-contracts.cjs:85:7)` |

Each new test was copied from its exact PR head into a detached throwaway worktree of the frozen final product head and run once. No registry entries from those PRs were copied. The worktree was removed; none of the three tests is in this branch.

## Provenance and limits

| Reference | Fetched commit |
| --- | --- |
| origin/factory/gameplay-v1 | `312d8e1d8628fae00aa44402a575f4144fc8cd0c` |
| origin/codex/job-1824-firestore-meter | `f1fbd2ee96da97978898158d0a69900426a84aa5` |
| origin/codex/job-1825-rules-cost | `96d9e2ebe1f329720947454f4c1f5b68657d979a` |
| origin/gameplay/ce2pg | `82bfcc74f9ed7893b912607f6d42b3ff7df667a2` |

All source PRs were open at their integration selection, with exact heads pinned in `source-pr-snapshot.json`; the connected GitHub app returned empty review, thread, comment and combined-status lists for the assessed source PRs. GitHub CLI API calls were forbidden in this environment, so the connected app was used for PR state. Live main and recorded POS20 candidate/recovery refs were observed; their stale ledger heads did not replace the explicitly requested `2f3865feca484223ac7d267d83a9c4828bad3078` integration base. No remote main/base/candidate/recovery mutation was performed. This is local emulator/browser evidence only: no production acceptance, SSJR/MDP credit, Showdown Gate seal, approval, merge or deployment is claimed.

The report-only commit follows tested product head `b2e68639e835e5be9b0d17423ef175fb88360084`; it changes only `test-results/r76-integration-2/`. Reports do not turn the failing product/audit evidence green. Remaining work is #847 conflict integration by its owner, review of the connection and active-career eligibility failures, and a separately authorized unchanged-assertion-compatible journey harness before a complete capacity run.
