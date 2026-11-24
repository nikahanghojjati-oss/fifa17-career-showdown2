# JOB-A — career-zero investigation, current-writer verification

**Answer: the existing live incident record identifies the closed reader's order-sensitive `JSON.stringify` comparison as the root cause: equal Firestore result maps become `COMPLETED_SEASON_INVALID`, so every affected finished Showdown contributes zero; current-writer reproductions confirm this for both managers.**

Audited `main` **9230e33455eae93040317e7553131be34c20da9b**, release **1.9.5-r81**. Evidence was collected October 21 and finalized October 22, 2026. Main and the proposed reader-fix head were rechecked before publication. This PR changes only this report.

## Prior findings and what this report adds

There was no `codex-findings/` directory in the checkout. Before investigating, the team read every report then available in the open findings PRs: **#958 JOB-B, #959 JOB-A, #960 JOB-1, #961 JOB-2, #962 JOB-8, #963 JOB-6, #964 JOB-3 and #965 JOB-1**, including their complete report files. A final publication check found **#966 JOB-1**, whose full report was also read. Their loading, pairing, recovery, usage and history findings are excluded from the new-finding count.

**No new defect is reported here.** This is a verification addendum to [JOB-A #959](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/959) and the existing [reader repair #957](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/957), rather than a second issue report for either defect. Its additional evidence is a fresh emulator run and a matrix using results and Terminal Close records written by the **current providers**, rather than only an older saved fixture.

The incident attribution has two different evidence sources:

- PR #957 records Nik's live r81 Trophy Room showing **“Showing 0 of 2 Showdowns”**, both completed reads returning **`COMPLETED_SEASON_INVALID`**, and a season commit whose `results` map returned `playerTwo` before `playerOne`, with result fields also reordered. This is an existing account observation reported in that PR; this investigation did not independently access Nik's production account or raw capture.
- The new local matrix reproduces that precise error on newly written valid closes, changes only map insertion order, and verifies that #957's reader restores the identical projection and totals. This independently proves the code defect and the proposed repair's behavior at the reported boundary. It does not establish that every production Showdown always returns the same ordering.

## Evidence through the failing path

All file references below are relative to the audited main head.

| Step | Evidence and consequence |
| --- | --- |
| The working screen uses another source | `js/rivalryLegacyV10.js:299–305` builds the current Rivalry Statistics from live shared state. Correct cups there establish that gameplay has results, but do not exercise the closed reader. |
| Career screens enter the closed loader | Career Statistics/Trophy Room call the common career model loader (`js/careerScreensV10.js:1628–1643`); Legacy/History and the career-backed rivalry view use `rlLoadCareerModel` (`js/rivalryLegacyV10.js:244–274`). |
| Scope can deliberately empty a career | A missing marker becomes `testOnly:true` (`js/rivalryLegacyV10.js:222–229`); `testRunsOnly` supplies an empty index and reads no Showdowns (`js/sparkClosedShowdownCareerLoader.js:54–58`). A failed/unknown marker produces unavailable scope, not proof of a test career. The current normal marker paths are checked below. |
| Indexed games are reconstructed | The loader reads the own index, filters hidden IDs and calls the reader for each remaining ID (`js/sparkClosedShowdownCareerLoader.js:58–69`). The reader verifies the closed root and reads setup, public results, **both role documents**, and the commit (`js/sparkCompletedShowdownReader.js:159–188`). |
| Equal results acquire an extra, invalid requirement | `csrReadyState` explicitly builds `{playerOne:…,playerTwo:…}` (`js/sparkCompletedShowdownReader.js:125–128`). The separately read commit can return the reverse map order. Line **138** compares the two with `JSON.stringify`, after key/type validation, and fails with `COMPLETED_SEASON_INVALID`. `csrClone` preserves insertion order (`:37,43`); the canonical hashes already sort keys (`:38–40,128,143`). No value, receipt, hash or witness needs to be wrong. |
| The live provider already handles this boundary correctly | The season-commit provider compares canonical content (`js/sparkSharedSeasonCommit.js:80–89`, especially `:84`); it writes the results at `:91`. The role results are stored independently (`js/sparkSharedSeasonResults.js:168`). The closed reader retained the order-dependent comparison. |
| Rejection becomes zero contribution | The reader catches the failure and returns `unavailable` (`js/sparkCompletedShowdownReader.js:201–202`). The adapter retains an unavailable entry (`js/sharedClosedShowdownAdapter.js:54–57`); analytics skips its earned counters (`js/sharedCareerAnalytics.js:119–123`). When all indexed games fail, coverage is `0/N`, the model is `partial`, and accumulated points/trophies remain zero (`:113,151–163`). Legacy omits unavailable cards (`js/rivalryLegacyV10.js:26–30`). |

**One unavailable Showdown does not blank readable games.** Each entry is classified separately (`js/sharedClosedShowdownAdapter.js:96–100`), and readable entries continue accumulating (`js/sharedCareerAnalytics.js:125–149`). The incident needs all relevant games to fail, as the recorded `0 of 2` does. An unavailable index instead makes the whole model unavailable (`:112–114`).

## Fresh current-writer reproduction

Ran the unmodified `tests/firebase/completed-showdown-read-emulator.cjs` against the composed production Rules: **64/64 PASS**, including Daniel reading Nik's role result and the reverse after session closure.

A scratch extension reused that test's account/device/active-rivalry/session seed and its actual provider journey: setup → career readiness → transfer → both season results → commit/acknowledgements → history/final reconciliation → Terminal Close. Thus this isolates the writer/reader boundary; it does **not** claim to test first pairing or marker creation. Two newly generated one-season games covered the original seven result fields and the sparse r80 `europaLeague:true` result. Each was read as both Daniel and Nik.

At the SDK `getDoc` return boundary, three transformations were applied independently, preserving Timestamp objects and array order:

1. Return only the commit's outer `results` keys as `{playerTwo, playerOne}`.
2. Reverse only the role documents' result-field insertion order.
3. Recursively reverse all plain-object map keys.

The control reads used unmodified emulator snapshots. The comparison reader was loaded **in memory** from #957 commit `3321f234103d37e4b5235507559c49a54a23f6fd`; no app file was edited or written to Firebase with the fix.

| Cases | Main r81 reader | Proposed #957 reader |
| --- | --- | --- |
| 2 game shapes × 2 managers, original ordering | All 4 completed | Comparison control was main's verified projection |
| 2 shapes × 2 managers × 3 order-only transformations | All 12 unavailable, `COMPLETED_SEASON_INVALID` | All 12 completed; projections and finals deep-equal to their controls |
| 2 shapes × 2 managers, actually change commit `leagueGoals` | Not needed for the order-only comparison | All 4 rejected, `COMPLETED_SEASON_INVALID` |

Expected totals were retained exactly: **5–0** for seven-field results and **5–3** for the Europa case. This validates the existing repair without weakening changed-content rejection. The transformations simulate permitted database map representation, not player modifications to the app; ordinary play writes the underlying documents.

Scratch probe/logs remain under `work/job-a-schema/` and `work/job-a-rules/`; they are deliberately outside this report-only PR.

## Markers and indexes in each normal path

| Path | Daniel / Nik marker behavior | Index behavior |
| --- | --- | --- |
| First real START and first pairing | Daniel's mode gate calls `startRealCareer` before shell/code creation (`js/showdownModes.js:167–201`; `js/productionSharedJourneyEntry.js:290–298,441–457`). Marker storage is `js/careerStartMarker.js:179–205`. Nik's `CMS17R-` join awaits `pairEnsureOwnMarkerBeforeRealJoin` before redemption; marker failure stops the join (`js/persistentNikDanielPair.js:264,352–363`). | Creation/redemption supply their own durable witnesses (`js/persistentNikDanielPair.js:200–207,259,264`). These append the respective account's index inside the pairing transactions (`js/sparkPrivatePairing.js:294–305,350–359`). |
| Permanent pair START / Home JOIN note | Existing markers are reused. Home JOIN converts the note to a code and calls the same join route (`js/onlinePlayerIdentity.js:99–102`). Permanent partner creation requires the own marker (`firestore.persistent-pair-production.fragment.rules:409–425`); marker deletion is denied (`:590–597`). | The same witnesses append for both accounts. `pairPlanCareerIndexAppend` and `readCareerIndex` handle head/pages and idempotency (`js/persistentNikDanielPair.js:131–134`). |
| ACTIVE CONTINUE | Resumes the existing rivalry without creating/repairing a marker (`js/onlinePlayerIdentity.js:105`; `js/persistentNikDanielPair.js:275`). | No new rivalry, so no new append is expected. |

A real person can have no marker before first real START, while using Settings test runs, or while continuing a historical markerless/test rivalry. No current fresh-account, normal r81 real START/JOIN omission was established. The old low-level pairing UI does omit durable witnesses, but it is hidden by `js/onlinePlayerIdentity.js:54`; it is not evidence of a reachable normal-play failure.

r81's hidden-game recovery is bounded to markers created between the r79 and r80 prevention instants, scans at most ten roots, and only reveals qualifying closed games (`js/careerStartMarker.js:44–75`). It does not repair this reader rejection. The prior JOB-3 recovery-cache finding remains a separate existing finding.

## Strict reader checks versus current storage

| Reader gate | Current-writer comparison |
| --- | --- |
| Rivalry content hash | Root hash canonicalizes keys/timestamps (`js/sparkCompletedShowdownReader.js:53–56`; `js/sparkTerminalClose.js:15–22,41,81`). The root data has no obsolete exact-key whitelist. |
| Setup exactly six operations at revision 6 | Writer shape matches (`js/sparkSharedShowdownSetup.js:129–151`). r79's Daniel-only season selection still emits `commit-length` (`js/productionSharedShowdownPresentation.js:222–232`); both confirmations remain in the protocol. Reader replay is `js/sparkCompletedShowdownReader.js:87–112`. |
| Result runtime/shape | Results still use persisted protocol revision `1.9.1-r9` (`js/sharedSeasonResults.js:8`), with current public/role writes at `js/sparkSharedSeasonResults.js:168`. The reader accepts them (`js/sparkCompletedShowdownReader.js:115–131`). |
| Europa League | Reader accepts exactly the optional true eighth key and disallows simultaneous Champions League (`js/sparkCompletedShowdownReader.js:25–27,42–43`). Writer uses the same sparse shape (`js/sparkSharedSeasonResults.js:46–51`). The new matrix exercises it through close. |
| Exact commit keys, ACKNOWLEDGED revision 3/results revision 2/r10 | Storage matches (`js/sparkSharedSeasonCommit.js:21–22,80–91`; `js/sharedSeasonCommit.js:8`). The failure is the additional JSON ordering requirement at reader line 138. |
| Terminal witness and six progress keys/r18 | Writer/protocol remain r18 (`js/sharedTerminalClose.js:7–26`; `js/sparkTerminalClose.js:10,39–49,81`), matching `js/sparkCompletedShowdownReader.js:79–85`. App release r81 does not mean these persisted revisions become r81. |
| Rebuilt totals versus Terminal Close | Reader requires full season coverage and exact witness totals (`js/sparkCompletedShowdownReader.js:195–199`); terminal writer derives the same scores, including Europa (`js/sparkTerminalClose.js:36–49,79`). |
| END SHOWDOWN / r80 career save / r81 | `endedEarly` is accepted as status metadata when a closed root lacks Terminal Close (`js/sparkCompletedShowdownReader.js:150–176`); it intentionally contributes no completed honours. r80 automatic save calls the real terminal provider and exposes failure/retry (`js/productionSharedTerminalClose.js:18–35,276–289`). r81 changes marker recovery, not these writer schemas (`012e8b8e`). |

No additional current writer field was found that invalidates every real close. The newly written controls passing the complete reader are direct counterexamples to that hypothesis.

## Browser dependencies and Firestore access

The dependency omission already reported in JOB-A remains valid: the reader's Node dependencies come from `require`, while browser dependencies are globals (`js/sparkCompletedShowdownReader.js:11–19`). `modelDependencies` omits setup, catalog, results, commit and canonical scoring (`js/rivalryLegacyV10.js:79–90`). `ssjr.js` loads them in a separate asynchronous chain (`js/ssjr.js:98–157`), which Home readiness does not await (`:87`). A fresh Trophy Room entry therefore has no guaranteed dependency barrier. This is an existing independent cold-entry defect, and should be fixed, but completed gameplay warms those protocols; it explains persistent post-game zero less directly than the recorded map-order error. This addendum did not repeat the earlier isolated cold-dependency reproduction or claim a new physical-device timing observation.

Both requested Rules builders passed, yielding unchanged generated blob **`13cab80a76979299fcac195da925fa984c51d8a5`**:

```sh
node scripts/build-production-firestore-rules.mjs
node scripts/build-production-firestore-rules-with-persistent-pair.mjs
```

The composed get grants cover root, setup, public results, **either manager's role result**, and commits (`firestore.spark.generated.rules:442–446,2978–2979,3037,3081,3087–3088,3098`). Completed access checks bind the signed-in active account to the two managers and Terminal Close witness/progress, without requiring an active session (`firestore.persistent-pair-production.fragment.rules:514–547`). Own marker/index gets are allowed (`:580–597`). The fresh 64-check emulator run verifies these grants, including cross-role reads. No new source-Rules denial was established; no new production Rules readback was performed.

## Why the tests pass

- **Completed-reader emulator:** seeds accounts, devices, already-active rivalries, sessions and some pair links with Rules disabled (`tests/firebase/completed-showdown-read-emulator.cjs:71–77`), then runs the real lower-level writers through closure (`:79–108,138–141`). It does not exercise marker creation; its career aggregation supplies a ready index from `Object.keys(reads)` (`:229`). Node `require` supplies all protocols. Its ordinary emulator snapshots retain an ordering that passes; it has no independent map-order variation on main. The new matrix starts from that same passing data and demonstrates the missed boundary.
- **Two-manager browser journey:** does **not** hand-seed career markers. It asserts missing markers before actual START/redeem and verifies app-created markers and both indexes (`tests/browser/two-manager-browser-journey.cjs:386–429`), then both `[R1,R2]` indexes after Home JOIN (`:937–948`). Its Firebase/auth initialization uses the localhost emulator switch (`:71–87`; `tests/browser/support/emulator-runtime-switch.js:27–70`), not Settings test mode. Its normal close-failure injection has a separate retry test purpose (`:80–85`).
- The browser journey does check persisted Terminal Close (`:837–845`) and career screens before/after reload (`:848–858`). Those are meaningful assertions. However, it uses emulator map representation throughout, never changes independent map order, and reaches the first career check after full gameplay. On reload it enters Career Statistics before Trophy Room (`:323–359`), without deliberately delaying missing reader protocols. Passing it does not prove order invariance or a cold direct Trophy Room dependency barrier.

## Suggested repair and counting boundary

Use the existing #957 repair as the reader change: validate exact keys/types, rebuild results in a fixed order, and compare canonical content. Retain the hash, role, receipt, witness, season coverage and totals checks. The matrix shows existing completed data can recover without rewriting its documents. Also await all seven reader protocols from the career entry path before issuing the first read; retain retriable unavailable diagnostics instead of treating load failure as earned zero.

For a forward guarantee, the simplest owner-acceptable policy is to retire Settings test mode and replace account-marker inference with explicit rivalry eligibility from a **fixed repair-release cutover instant `T`**. The release must record the actual UTC value of `T`; it is not the time this report was written. Every normal rivalry created from `T` onward must be atomically indexed for each joining manager and, after valid Terminal Close, count for both through CONTINUE, reload, a fresh tab or another device. Eligibility must not depend on a later account checkmark hiding the existing index.

Keep **all pre-r79 test games permanently excluded**. Do not simply delete marker filtering or reset markers against the current index. Preserve a permanent exclusion of roots created before the r79 release boundary **2026-10-18T17:17:45Z**. For already-played r79+ games, retain known real eligibility or use an explicit reviewed recovery set; an old test's later `updatedAt` alone is insufficient proof of creation after that boundary. A future cutover is a clean fallback for ambiguous history, not permission to revive pre-r79 data. Validate any recovered close with the corrected reader.

## Regression that would have caught this

Extend the actual two-manager journey from fresh accounts through real START/first JOIN, a second permanent-pair Home JOIN and ACTIVE CONTINUE. Verify both indexes/markers and persisted terminal witnesses. At the SDK read boundary, independently reorder commit role keys, role-result keys and all plain maps while leaving arrays, values and timestamps intact. Require identical projections, scores, trophies and completed counts for both managers; alter one result value as a rejection control. Run both seven-field and Europa seasons. The matrix above shows this fails on r81 and passes with #957.

Add a fresh browser case with no `require`, Trophy Room as the first career destination, and the omitted protocol scripts delayed beyond Home readiness. Require the career entry to await them and show the finished result. Include a valid game beside one unreadable game, missing historical marker, r79+ recovery and permanent pre-r79 exclusion. These cases test the future counting policy as well as representation and bootstrap readiness.

Validation completed: both Rules builders; completed-reader emulator **64/64**; current-writer matrix **4 controls, 12 order-only failures restored by #957, 4 changed-content denials**; permanent-pairing client contracts **25 PASS**; real-versus-test contracts **10 PASS**. POS20 routes this single report as `POS20_DOC_ONLY`; required `V10_FLASH_BROWSER` **PASS** at phone portrait, phone landscape and desktop, plus Club motion checks. That visual proof uses fixtures and is not production career acceptance. No new full two-manager browser journey or physical production run was performed in this addendum.
