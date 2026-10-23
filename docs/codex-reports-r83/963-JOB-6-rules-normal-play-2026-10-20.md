# JOB-6 — Firestore Rules and normal two-player play

## Summary

Audited live `main` at `9230e33455eae93040317e7553131be34c20da9b`, release **1.9.5-r81**, on **2026-10-20**. **No new deterministic normal-play app/Rules mismatch or permanent game freeze was established.** One acknowledgement-race UI test failed once with `permission-denied`, then passed the isolated checks below; that remains an unresolved observation, not a confirmed new defect. The confirmed budget caution is Terminal Close's progress update at approximately **894/1,000 expressions**.

`codex-findings/` did not exist on main. Before examining gameplay, also fetched and read every findings file in open draft PRs **#958–#962**: JOB-B, JOB-A, JOB-1, JOB-2 and JOB-8. PR #957 has no file in that folder. Their career-reader/loading defects, session-offer/wait stalls, draft/resume defects, JOIN duration/rediscovery issues, stale mode labels and Firebase usage findings are excluded. Started with **Season Commit acknowledgement races**, rather than the latest report's completed-Showdown storage/career-index entry point.

No app code, repository tests, Rules source, Firebase data or deployments were changed. Only this report belongs in the PR. Spark-only, Billing OFF, no Cloud Functions, App Check enforcement OFF and memory-only Firestore remain unchanged.

## Build and evidence boundaries

Ran the requested build sequence:

```text
node scripts/build-production-firestore-rules.mjs
node scripts/build-production-firestore-rules-with-persistent-pair.mjs
BUILT firestore.spark.generated.rules 124492 bytes
INJECTED persistent Nik/Daniel pair authority 154706 bytes
git hash-object firestore.spark.generated.rules
13cab80a76979299fcac195da925fa984c51d8a5
```

The composed artifact is byte-identical to the checked-in artifact. Reviewed that composition, including the persistent-pair injection, rather than treating `firestore.rules` or the uncomposed Spark base as production authority. Emulator checks used Firebase SDK **12.17.0**, Rules unit testing **5.0.1**, Firebase CLI **15.28.1** and Firestore emulator **1.22.0**. Current CI pins SDK 12.17.1 for its principal Rules lane; that patch-version difference is an evidence limit.

Searched `js/` for `setDoc`, `updateDoc`, `runTransaction`, and `writeBatch`, then followed actual transaction `get`/`set` calls, direct reads and listeners. Normal writers are account/device bootstrap; private pairing and its pair-link/career-index witnesses; career markers; permanent partner/JOIN notes; private session/session offer; connected-state publication; setup/league projection; Career Start; Transfer; Results; Commit; and terminal progress/final closure. History and multi-season providers reconstruct stored data read-only. Acceptance-only negative-probe modules and dormant trusted-server candidates are not normal gameplay callers.

The tests use local synthetic accounts and fixtures. Their accepted controls and actual-provider journeys are normal-play evidence; their tampering cases are not findings here. No production account run, physical-device suspension run or fresh deployed-Rules readback is claimed.

## Findings and unresolved observations

### B1 — Budget caution: Terminal Close progress has about 106 expressions of headroom

**Normal trigger:** complete a ten-season Showdown, including seasons in which both managers independently win the Europa League, then save the final career result. The provider advances a proof one season at a time before the final atomic rivalry/session close.

**Location:** `firestore.terminal-close-production.fragment.rules:120–154`, especially `ssjrTerminalAdvanceProgress`, calls the progress-shape checks and scores both managers' next acknowledged commit. The app performs this from `js/sparkTerminalClose.js:43–73`. `ssjrTerminalScore` at fragment line 43 includes the sparse Europa League term; it does not scan all ten commits inside one Rules evaluation.

The existing calibrated padding probe in `tests/firebase/europa-league-rules-emulator.cjs:305–373` produced:

```text
EL_RULES_EXPRESSION_BUDGET calibration=321 initialPad=75 advancePad=33
initialUsed~764 advanceUsed~894 (of 1000, +/-4)
```

These are approximate engine-budget measurements, not a count of source lines or coverage-tree nodes. The probe adds terms only to temporary emulator Rules, calibrates their cost, and binary-searches the last accepted padding. Unpadded writes pass; padded failures are explicitly checked for the evaluation-limit message. The full ten-season mixed CL/EL close also passed, with totals **60–100**.

An additional temporary probe used the same calibrated padding functions around the final rivalry-validation entry point, seeded valid ten-season progress, and called the **actual terminal provider**, including its atomic session close. Finalization accepted 92 terms and failed at 93 with the expression-limit message: approximately **711/1,000**, ±4, for this padded finalization boundary. This is not a separate exact measurement of every session/read grant. The progress advance is the closer measured boundary.

**Implication / suggested action:** flag the roughly **89%** progress budget when changing this rule or adding provenance checks. Preserve staged per-season proof and the separate preflight; do not move a ten-commit rescan or extra account/setup validation into every writing transaction. Add an explicit minimum-headroom assertion if this margin is a release requirement: today's test requires the unpadded operation to pass, but does not require a reserve (`europa-league-rules-emulator.cjs:369–370`). This is a maintenance risk, **not evidence that normal ten-season play currently exceeds the limit**.

### R1 — Unresolved acknowledgement-race failure; not a confirmed new freeze

**Normal scenario exercised:** Daniel presses COMMIT & ACKNOWLEDGE. Nik presses ACKNOWLEDGE immediately after the commit becomes visible, while Daniel's acknowledgement is still writing; the other acknowledgement's listener delivery is delayed. No app request or stored field is altered.

The first run of the unchanged `tests/firebase/shared-season-commit-ack-race-emulator.cjs` failed **A4.2**, one of nine scenarios:

```text
Daniel: no Season Commit error
(Your shared season acknowledgement could not be recorded.;
 reported: Unable to update Shared Season Commit: permission-denied)
FAIL Season Commit acknowledgement race: 1 scenario(s) failed
```

The test runs the actual production Commit adapter, budget layer, conflict guard and provider over the composed Rules; its DOM is a stub and it can delay listener delivery. This is an observed normal-flow test failure. The initial invocation shared an emulator with other suite activity, and both acknowledgement suites default to the same project ID; test isolation was not established for that first failure. It did not capture enough per-request revisions to distinguish a residual app race from test/emulator interaction, or to prove a lasting stall or lost acknowledgement.

**Relevant boundary:** the app writes a revision-plus-one commit envelope (`js/sparkSharedSeasonCommit.js:91,118–119`); the Rules require the current revision and acknowledgement prefix (`firestore.season-commit-production.fragment.rules:234–281`). A competing acknowledgement can legitimately make the first attempt stale. The provider's denial recovery at `js/sparkSharedSeasonCommit.js:104–126` must establish advancement before returning `SEASON_COMMIT_STALE_BASE_REVISION`; the adapter retries that code once at `js/productionSharedSeasonCommit.js:156–166`. A plain denial instead reaches the visible error at line 186. The budget layer marks failed writes for a server read (`js/sparkPrivatePairing.js:976–982`). Those recovery paths exist; this report does not assert they are universally broken.

**Follow-up evidence:**

- The lower-level forced-interleaving test passed both acknowledgement orderings, bounded retry, genuine-authority-denial control and stale-write denial: `shared-season-commit-concurrent-acknowledge-emulator.cjs` — four checks.
- Reran the **unchanged** UI suite in its own emulator project with `CMS_ACK_RACE_ROUNDS=12`: **27/27 scenarios passed** (A1, A2, thirteen A3 and twelve A4).
- A temporary A4-only run added logging in memory, without changing decisions or request contents: **12/12 passed**. Captured losing writes showed revision 1, fresh recovery revision 2, then an accepted revision-3 retry. Scratch instrumentation is not in the PR.

**Suggested next check:** retain the initial failure as evidence debt. Capture the failing write's read revision, attempted revision, fresh recovery result and listener revision on an isolated rerun before assigning a new defect or changing Rules. Do not weaken revision/prefix checks or blindly classify every permission refusal as contention. No P1/P2 freeze finding is assigned from this single unreproduced failure.

## Requested normal-play paths checked

| Path | What the app sends / what the composed Rules allow | Result |
| --- | --- | --- |
| Continue an r79 Showdown on r80/r81 | Persisted Results/Commit protocol revisions remain r9/r10; the asset release number is not substituted into those documents. Current readers/writers preserve old seven-key results and hashes. `tests/firebase/r79-showdown-continues-emulator.cjs` loads an actual r79 three-season fixture with season 1 accepted, plays seasons 2–3 through today's providers, and verifies the closed history. | **PASS, 11 checks.** All seven r79 season-1 documents remained byte-identical; both managers re-read all three seasons. A source/provider compatibility check, not a run of historical r80 browser assets. |
| `europaLeague` | Results normalizes the key sparsely, present only as `true`, and Commit copies the result (`js/sparkSharedSeasonResults.js:46–51,168`; `js/sparkSharedSeasonCommit.js:91`). Both Rules result shapes accept that encoding (`firestore.season-results-production.fragment.rules:141–158`; `firestore.season-commit-production.fragment.rules:25–44`). Terminal score uses `.get('europaLeague', false)` so old results remain valid. | **PASS, 23 Rules checks**, including old/new results together, both managers winning the same trophy, mixed seasons and ten-season closure. No new unknown-key rejection found. |
| END SHOWDOWN `endedEarly` | `pairAbandonCurrentShowdown` adds `{seasonsPlayed: 0..10 or null}` to the same root closure, preserving other data (`js/persistentNikDanielPair.js:146–180`). `cmsPersistentPairAbandonValid` explicitly permits `connectionState` plus `endedEarly` and validates that shape (`firestore.persistent-pair-production.fragment.rules:120–150`). The composed root match retains this separate abandon branch (`firestore.spark.generated.rules:2981–2985`). | **PASS** for Daniel/Nik, active/pending roots, 0/1/10/null and the older unmarked abandon path. Authorized managers still read the closed marked root. No missing-key refusal found. |
| Permanent pairing | Each account writes its own plain partner record with server `pairedAt`/`updatedAt`; it follows an ACTIVE rivalry read and its own career marker (`js/persistentNikDanielPair.js:312–334`). Rules validate those exact keys, marker/career relationship and the two manager slots (`firestore.persistent-pair-production.fragment.rules:376–458`). | **PASS** permanent-partner and persistent-pair suites, including replacement after closure and durable create/redeem witnesses. No new normal create/update mismatch found. |
| JOIN notes | Daniel writes the note in a **separate transaction after pairing creation**, with `serverTimestamp()` and the invite's exact expiry (`js/persistentNikDanielPair.js:259,366`). Rules bind mutual active partner records, Daniel's pending rivalry/invite and season count (`firestore.persistent-pair-production.fragment.rules:471–510`). Nik reads/listens to his own exact mailbox document; he does not list inboxes. | **PASS.** A fresh rivalry can replace the previous note immediately. The 60-second same-rivalry rewrite restriction is not imposed on the normal one-write START path. The already-reported TTL/discovery UI problems are excluded. |
| Acknowledgements during a race | The current commit update is immutable-result, prefix-preserving and revision-plus-one. The provider/adapter reconcile a proven concurrent advance instead of expecting the Firestore SDK to retry `permission-denied` itself. | Forced provider races passed; isolated UI suite **27/27** passed. **R1 remains open** from the initial UI-suite failure; do not describe all acknowledgement testing as green. |
| Expired session, then rejoined | The app submits the fresh session ID on subsequent writes; historical setup/role records may retain the old ID. Rules validate the submitted active session rather than demanding equality with all historical session IDs. Transfer signing updates preserve old guesses/timestamps/salt while linking the new public/private write (`firestore.transfer-challenge-production.fragment.rules:299–328`; shared authority at `firestore.shared-setup-production.fragment.rules:43–84`). | **PASS, full ten-season provider journey.** The old session really expired in season 6 after Daniel locked guesses; Daniel hosted a fresh session, Nik joined, play continued without redraw/reset, and Terminal Close used the fresh session. This does not clear JOB-1's separate connection-discovery stalls. |

## Additional read/write comparison

- **Bootstrap and account-local records:** own account/device gets and registration, pair-link, career-index and career-marker addresses have exact get grants. The pairing suites exercised actual atomic creator/redeemer witnesses; a later current-pair change is not required to read a completed career entry.
- **Setup and Career Start:** setup ledgers/league projection and Career Start acknowledgements were written through the actual providers in the ten-season journey. The app's operation arrays, phases and server timestamps matched their fragments. Career Start has its own bounded normal-race reconciliation (`js/productionSharedCareerStart.js:89–104`); it is not silently assumed to share Commit's recovery code.
- **Transfer private reads:** the provider asks for the opponent's role document only after public `COMPLETED` (`js/sparkSharedTransferChallenge.js:132–147`). Rules grant own-role reads earlier and both roles after that phase. Maximum three guesses and three signings were accepted for both managers throughout the ten-season run, including the session rotation.
- **Results private reads and league projection:** the provider publishes public+own role atomically and prepares/reuses the exact `sharedSetup/leagueProjection` address (`js/sparkSharedSeasonResults.js:139–168`). Rules use `getAfter` for the atomic link/projection. Opponent results are read after `RESULTS_READY`, matching the private read grant at `firestore.season-results-production.fragment.rules:230–234`.
- **Commit/history/progression reads:** requests are direct season addresses, bounded by 1/3/5/10; the Rules allow a member's exact get even when a future commit is absent. Normal history reconstruction needs no collection-list permission. Both managers reached the final accepted prefix in the ten-season run.
- **Reads after closure:** the composed completed-Showdown grants cover setup, public results, both result-role documents, commits and completed transfer history (`firestore.persistent-pair-production.fragment.rules:514–556`; generated child matches). They bind membership and completed provenance, without requiring an unexpired session. The ten-season journey and mixed r79 continuation exercised completed reads. Closed session reads remain intentionally refused; terminal replay reads the closed root/witness instead. Already-reported JavaScript career-reader failures are not misclassified as missing Rules grants.

## Validation record and limits

Local Rules/provider checks completed:

- `shared-season-commit-concurrent-acknowledge-emulator.cjs` — PASS, four checks.
- `r79-showdown-continues-emulator.cjs` — PASS, eleven checks.
- `europa-league-rules-emulator.cjs` — PASS, 23 checks, including calibrated expression headroom.
- `ended-early-emulator.cjs` — PASS.
- `permanent-partner-emulator.cjs` — PASS.
- `persistent-nik-daniel-pair-provider-emulator.cjs` — PASS.
- `CMS_SHOWDOWN_LENGTH=10 two-manager-journey-emulator.cjs` — PASS, including real expiry/rejoin in season 6, max-size Transfer inputs, simultaneous result publication, terminal closure, completed reads and a subsequent abandoned Showdown.
- `shared-season-commit-ack-race-emulator.cjs` — initial **FAIL, 1/9**; isolated unchanged rerun **PASS, 27/27**; logging-only A4 follow-up **PASS, 12/12**. R1 records the unresolved exception.
- Temporary actual-provider finalization padding probe — PASS unpadded; finalPad 92 accepted / 93 refused by the evaluation ceiling, approximately 711/1,000 ±4.

The finalization probe reuses repository fixture builders and padding functions, seeds valid already-accepted progress locally, and calls the actual provider. It does not claim a new full browser journey or production budget measurement. Raw coverage-tree node totals were not treated as the Firestore expression counter. Expected denials from negative controls and intentionally padded Rules are not normal-play failures.

POS20 classifies this report as **`POS20_DOC_ONLY`**, with zero selected product contracts and required `V10_FLASH_BROWSER` proof. `CMS_CHROMIUM_MULTI_CONTEXT=1 npm run test:v10-flash` **PASSED**: portrait 390×844, landscape 844×390, desktop 1920×910, double taps, reduced-motion checks and the additional Club live-preference checks. Its landscape tap-feedback observation was report-only and outside this Rules audit. Scratch scripts, logs and emulator/browser artifacts remain in `work/job6/` or generated ignored paths and are excluded from the PR.
