# Red team r87: CONNECTIVITY

Audited `gameplay/r87` at **263064ac29290f810219309ffa1b3e2195f22502** (PR #1085 included), 2026-10-31. Report-only audit; no game code changed, no production Firebase contacted. Normal browser use only: Daniel/Nik, intermittent networks, reloads, locks, updates and two tabs. References below are lines in that commit, not in this report. Live main observed as `5b4337fdd64aaf1e2ed8de5abf6830021f29c82e`; its worker also declares `1.9.10-r86`. This audit does not assert what bytes are currently deployed.

**Connectivity score: 7/10.** Five confirmed code-path findings: one P0 update hazard, one P1 missed gameplay step, three P2 recoverable problems. No demonstrated duplication or corruption of an accepted Firebase season result. Device behavior and real quota reset remain unknown, not implied passes.

## Findings

### R87-B-01 — P0: r87 installs into the running r86 shell cache

**Evidence:** `service-worker.js:1–6` keeps `RUNTIME_REVISION = "1.9.10-r86"`; the changed shell adds r87 resources at `service-worker.js:278–281`. `populateCurrentCache` opens that same cache, replaces entries and deletes the entire cache on *any* installation failure (`service-worker.js:341–345`). Installation runs this before activation (`service-worker.js:369`). Fetches serve requested revision entries directly (`service-worker.js:404`). Main and this candidate use the same revision despite different bytes.

**Reproduce:**

1. Daniel installs/visits main's r86 on a fresh browser (there need be no retained r85 cache); Nik stays on r86.
2. Serve this exact r87 candidate as the next update, without changing its revision. Daniel leaves the old page open while the browser checks for the new worker.
3. Drop Daniel's connection during the new worker's `cache.addAll`, or make one new Roulette shell asset fail. Then close/reopen the app offline.
4. Separately, let installation succeed but leave the update waiting: the old page's subsequent lazy `?v=1.9.10-r86` fetches now read candidate bytes from the shared cache before the safe activation/reload boundary.

**Player sees:** on the failure branch, the only installed shell is deleted and offline launch cannot load it. If an r85 recovery cache exists, navigation can instead fall back to that older shell. On successful installation the old running page can mix old loaded modules with newly cached modules; safe update activation does not isolate the bytes. Nik can still run the old rules/UI. Specific resulting score corruption is **not** established.

**Root cause:** release identity is also the cache namespace; install-time mutation is not staged in an isolated candidate cache. This is a hazard of shipping the audited commit unchanged, not evidence of a production incident.

**Smallest fix:** assign r87 a unique, synchronized page/worker/runtime revision before release and make r86 the retained previous revision with the correct path delta. Never delete or populate the active worker's cache during a candidate install. Verify interrupted installation and a waiting update against an already open r86 page.

**Proof:** a local Node VM ran the actual worker with a pre-existing `career-mode-showdown-shell-1.9.10-r86` and `addAll` rejecting for a network drop; `populateCurrentCache()` rejected and deleted that existing cache. No remote calls.

### R87-B-02 — P1: a failed Roulette dependency skips the release, not just the animation

**Evidence:** `js/productionSharedTransferChallenge.js:396–405` returns permission to open Transfers if the step loader times out, fails, or throws. The loaded step also permits entry if `rrsEnsure` fails (`js/rosterRouletteStep.js:189–195`), and its outer catch converts every exception to `true` and suppresses another attempt on this page (`js/rosterRouletteStep.js:208–215`). `pstcOpenNow` uses that boolean to navigate to the Challenge (`js/productionSharedTransferChallenge.js:432`). Future boards nevertheless replay each previous season's seeded shot (`js/rosterRoulette.js:231–243`). This differs from the legitimate animation fallback, which still calls `rrsResult` (`js/rosterRouletteStep.js:196–202`).

**Reproduce:**

1. Use a newly confirmed r87 Showdown/season whose deterministic turn fires for Daniel. Both phones have read the shared setup and Challenge state.
2. On Daniel's browser, lose connectivity to the static host during first loading of `rosterRouletteStep.js`, or a required data/engine module. Nik's requests succeed. A failed first installation or use without an installed shell makes this reachable; it does not require modifying the app.
3. Daniel's failed loader returns or reaches its 10-second bound. Continue into the Transfer window and play the season.
4. Reconnect and open a subsequent season. The engine reconstructs the earlier shot whether Daniel was told to release the player or not.

**Player sees:** Nik receives both spin outcomes and any release instructions; Daniel goes straight into Transfers with no failure/retry message and no release instruction. Daniel's FIFA roster can retain a player the next auto-board has removed. If he later reopens the still-incomplete Challenge after connectivity returns, he may instead receive that instruction late, after starting the transfer window.

**Root cause:** availability of optional presentation and availability of the mandatory deterministic outcome are conflated. The exception path authorizes gameplay without a result or acknowledgement. Also, an engine `ROSTER_EXHAUSTED` exception is swallowed by the same catch; the engine contracts explicitly exercise that legitimate finite-roster condition (`tests/contracts/r87-roster-roulette-contracts.cjs`, L14).

**Smallest fix:** permit scene-only failure to fall back to a text outcome, but make missing engine/data/history produce a retry/Home panel and keep Transfers closed. Surface roster exhaustion explicitly. Preserve the same seeded plan on retry; do not mark an invalid/missing plan DONE.

**Proof:** Node VM loaded the actual step with a valid eligible context, an empty document stub and a runtime loader rejecting `network unavailable`. `decide(ctx)` was true; `runBeforeTransfers(ctx)` resolved **true**, without creating a result panel. This proves the authorization branch; no physical FIFA save was changed.

### R87-B-03 — P2: Roulette's precached scene dependencies are not served offline

**Evidence:** the iframe loads `vendor/three-r128.min.js` unversioned (`visual-assets/v10_1/roulette/index.html:134`), and fetches `platemap.json` and `assets/squads.json` unversioned (`visual-assets/v10_1/roulette/index.html:919–920`). They are in `SHELL_PATHS`, but the worker writes them only as versioned keys (`service-worker.js:298–299,327,343`). Only the marble tile is allowed through the unversioned shell route (`service-worker.js:31–34`). These JS/JSON paths are neither runtime images nor navigation requests; the fetch handler returns without `respondWith` when `v` is absent (`service-worker.js:403`).

**Reproduce:** Daniel installs the complete r87 shell but has never opened the Roulette iframe. Nik opens normally online. Disconnect Daniel from the static asset host when he first opens Roulette, keeping previously acquired gameplay authority/state available. To isolate this in a local browser, use the repository static server with synthetic/demo gameplay state, install the worker, clear the HTTP cache (retain Cache Storage), and simulate offline iframe requests.

**Player sees:** despite a verified complete offline shell, Daniel loses the 3D scene and receives the text fallback after error/timeout; Nik sees the animation. A warm HTTP cache can mask it. With a network connection, the iframe's unversioned dependencies also come from the current host rather than the selected recovery shell's revision. No different seeded outcome is proven from that fact.

**Root cause:** precaching a versioned URL does not satisfy an unversioned request. iframe navigation is specially handled; its internal scripts/JSON are not.

**Smallest fix:** route these exact unversioned scene JS/JSON paths through the selected revision's shell cache, or pass the selected revision into every iframe dependency URL, including fetches. Retain the current text-result fallback.

**Proof:** local VM dispatched the actual worker fetch handler for each of these three URLs without `v`. All three were confirmed in its diagnostics' shell list; none invoked `respondWith`. Thus their Cache Storage copies are unreachable on these requests. Physical phone/WebGL rendering was not tested.

### R87-B-04 — P2: a stale second tab silently replaces the newer signing draft

**Evidence:** `pstcSigningDraftKey` is identical for all tabs of the same rivalry/season/role (`js/productionSharedTransferChallenge.js:271`). Every edit serializes all three signing rows, including r87 position, and unconditionally writes that key (`js/productionSharedTransferChallenge.js:273–279,483,492`). There is no draft revision, compare, storage-event reconciliation or tab ownership. Restore only fills empty fields (`js/productionSharedTransferChallenge.js:281–290`); it does not reconcile an already populated stale form. The storage wrapper is plain `localStorage.setItem` (`js/storage.js:17`).

**Reproduce:**

1. Nik keeps his normal tab open. Daniel opens the same unlocked SIGNING_ENTRY in tabs A and B on his phone/Chromebook browser.
2. A holds an earlier selection. In B, Daniel corrects signing 1's name/position/overall; let its input/change handler save.
3. Return to A and edit signing 2 (the rest of A's form is still old). A writes the entire stale form over B's draft.
4. Close both tabs before locking, then reload. No network loss is necessary; going offline before closing does not recover the newer draft.

**Player sees:** B's newer signing 1 selection is gone from the restored draft. Signing 2's later edit survives. This loses **unsubmitted input only**; it does not overwrite an accepted Firebase signing, result or the partner's data.

**Root cause:** tab-local forms use last-writer-wins whole-form storage without conflict detection.

**Smallest fix:** detect external draft changes and stop stale autosaves until the player chooses the newer draft or keeps this tab's edits. Alternatively enforce one editing tab per role/context. Preserve position alongside the other fields. Do not attempt to replace locked Firebase inputs with a draft.

**Proof:** an extracted, unchanged `pstcSaveSigningDraft` ran in two VM tab contexts sharing a mocked storage map: save A's old selection, save B's new selection, save A's form again. The stored signing 1 reverted to A's old name/position/overall. This establishes the storage race, not a Firestore race.

### R87-B-05 — P2: transient Transfer errors surface as raw codes without recovery instructions

**Evidence:** provider errors retain only `code` (`js/sparkSharedTransferChallenge.js:30`). `pstcResultError` sets `providerResult=true` (`js/productionSharedTransferChallenge.js:144`); `pstcErrorText` maps only form-validation codes and otherwise returns the raw code (`js/productionSharedTransferChallenge.js:183–186`). A failed action uses that text in the card (`js/productionSharedTransferChallenge.js:211`). Quota has its own readable mapping and is not part of this finding.

**Reproduce:** Daniel and Nik enter Transfer War; Daniel taps to start/end/lock. Drop Daniel's connection after the read but before the mutation answer, so the SDK ultimately returns `unavailable` or `deadline-exceeded`. A real `permission-denied` persisting beyond the bounded race retry takes the same display path. Restore the connection.

**Player sees:** the card says `unavailable`, `deadline-exceeded`, or `permission-denied`, without explaining whether the tap saved or whether to refresh, retry, or reconnect the private session. `finally` does clear busy, so this is recoverable and is not evidence that the write was lost or duplicated.

**Root cause:** the human-readable fallback message passed to `pstcResultError` is deliberately bypassed for provider results; network and authorization codes have no presentation mapping.

**Smallest fix:** map transient/offline failures to “Could not confirm this step. Check connection, then refresh before retrying”; map persistent authorization failure to private-session recovery. Keep the original code for diagnostics, and reconcile server state before claiming failure or success. Preserve the existing quota message.

## Ranked top five

1. **R87-B-01:** isolate r87's shell revision before any release; prove that an interrupted update preserves r86.
2. **R87-B-02:** require the Roulette outcome before Transfers, even if the animation/assets fail.
3. **R87-B-04:** protect newer unsubmitted signings from a stale second tab.
4. **R87-B-03:** make the iframe consume its precached, revision-matched JS/JSON offline.
5. **R87-B-05:** explain ambiguous saves and the appropriate retry/reconnect action.

## Checked paths with no additional confirmed finding

“Clean” here means the inspected invariant survived code review/contracts, not that every real device interruption was exercised.

| Flow / concern | Evidence and bounded conclusion |
| --- | --- |
| Shared Setup, reload and concurrent confirm | `js/productionSharedShowdownSetup.js:198–241` serializes mutation intent, rereads before writing and has a bounded stale/race retry; `js/sparkSharedShowdownSetup.js` and `firestore.shared-setup-production.fragment.rules` enforce ledger transitions. No confirmed second draw/confirm from a retry. |
| Career Start waiting / locks | `js/productionSharedCareerStart.js:43–49` bounds the opening work; `:91–123` releases busy in finally; `js/sparkSharedCareerStart.js:71` uses protocol idempotency before writing. Its polling/listener wake paths are at `js/productionSharedCareerStart.js:225–237`. Roulette fail-open is separately reported above. |
| Transfer phases and accepted lock writes | `js/sparkSharedTransferChallenge.js:155–180` checks operation id/hash, base revision, phase and role before public/private writes in one transaction. `js/productionSharedTransferChallenge.js:188–216` rereads and handles concurrent moves. Rules lock signings only from null and preserve guesses/salt (`firestore.transfer-challenge-production.fragment.rules:310–330`); a completed local verdict copy is therefore not competing mutable truth under normal play. |
| Draft position / Firebase priority in one tab | `js/productionSharedTransferChallenge.js:276–290` stores/restores position and refuses to restore over locked/shared inputs. Two-tab unsubmitted conflict is B-04. |
| Season Results | `js/productionSharedSeasonResults.js:175–200` binds reviewed payload to context/fingerprint, checks an already published own result, and uses one operation id through bounded contention retries. `js/sparkSharedSeasonResults.js` plus `firestore.season-results-production.fragment.rules` provide authoritative result publication. No duplicate accepted result demonstrated. |
| Season Commit / different scores | `js/productionSharedSeasonCommit.js:153–166` rechecks a stale base and accepts an already satisfied commit/ack; `js/sparkSharedSeasonCommit.js:131–135` verifies stored state before projection. `firestore.season-commit-production.fragment.rules` governs the transition. Local progress alone does not authorize a new season. |
| Waiting listeners and cache authority | `js/sparkPrivatePairing.js:1151,1262` rejects cache and pending-write deliveries as healthy authority. Context listener errors detach and back off (`:1164–1179`); wait listener failure falls back to screen reads (`:1204–1207`). `js/productionSharedSeasonCommit.js:240–257` checks server metadata and wait-context health. No blanket claim that every listener attachment race was tested. |
| Journey reconnect after lock/offline/reload | `js/productionSharedJourneyReconnect.js:65–70,151–167,169–199,209–223` checks exact session/identity, invalidates outstanding recovery on offline, and wakes on online/visibility/poll. Reload losing a memory-only session is explained to the player (`:109–117`) and has a recovery action. A phone waiting for its offline partner is expected; no arbitrary forced advance should fabricate the partner's acknowledgement. |
| Terminal Close and Final Winner | `js/productionSharedTerminalClose.js:10,280–310` classifies unavailable/deadline as ambiguous and retains the close intent in RECOVERY_PENDING for retry. `js/productionSharedFinalReconciliation.js:72–89` rechecks authority/generation around awaited reads and refuses stale final state. `firestore.terminal-close-production.fragment.rules` owns durable close. No result-loss claim from a closed tab without an acknowledgement. |
| Local Reconciliation | `js/productionSharedLocalReconciliation.js:61–79` rechecks online preview rather than applying an offline cache as fresh remote truth. The module exposes no automatic local Apply (`:139`); existing Candidate C owns explicit application. |
| Phone career summaries / storage wipe | `js/careerSummaryStore.js:40–46,100–115` validates hash/reader version, prefers immutable phone copies, and falls back to Firebase if absent. `:117–125` treats summary upload as optional. A wiped phone cannot retain its unsent drafts; no promise of impossible local-only recovery. Closed-summary two-tab use is safe because accepted closed facts do not change. IndexedDB interruption coverage remains unknown below. |
| Roulette verdict cache and missing seasons | `js/productionSharedTransferChallenge.js:410–432` keys copies by rivalry/season and, when missing, obtains a COMPLETED provider projection before keeping it. `js/rosterRouletteStep.js:100–112` requests each prior season once per successful history build, with explicit retry/Home on a failed result. This is one **provider read operation**, not one billable document read: `js/sparkSharedTransferChallenge.js:130–151` reads authority/public/private documents. No extra polling introduced for Roulette history. |
| Pure Roulette agreement | `js/rosterRoulette.js:42–59,217–252` derives turns from rivalry id/season/role and reconstructs boards from the same ordered history; no network, clock or unseeded random source. All 14 contract groups passed, including 98 clubs and real-stream roster exhaustion. Identical valid inputs agree; dependency failure handling is B-02. |
| Showdown Home JOIN | `js/persistentNikDanielPair.js:443–454` falls back to memoized polling on listener errors; metadata changes are included and cached first delivery is ignored. It watches the current account's private inbox. No new r87 public discovery or joining authority introduced. |
| Rematch | `js/onlinePlayerIdentity.js:102–105`, `js/productionSharedJourneyEntry.js:203`, `js/seasonFinalV10.js:336–359`: same START decision/close path, Daniel-only starter, busy guard, length preset rather than an independent write path. Five dedicated contract groups passed. |
| Deadline Day | `js/deadlineDay.js:23–45,96–109` is derived presentation from the existing live clock, deterministic by season/second, no Firebase or independent timer. Seven contract groups passed. Clock displays need not be precisely synchronized to the same second; this does not change the shared deadline. |
| Offline shell / recovery structure | All declared shell paths exist; r87 engine, player data, squads, step, CSS, iframe, vendor, Deadline Day and lines are listed. `service-worker.js:334–339,353–379` verifies completeness before activation and finds retained recovery; `js/offlineApp.js:39–42,438–475,601` gates activation/reloads. B-01 defeats revision isolation; B-03 bypasses cached iframe subresources. Recovery was not physically exercised. |

## Error coverage and unknowns

- **resource-exhausted:** `js/sparkPrivatePairing.js:928–934,967–989` recognizes quota, clears transient shared copies, detaches listeners and publishes the paused state. Backoff is bounded by timers, not a permanent latch. Home shows the readable quota notice (`js/homeScreensV10.js:164–174`); the identity gate displays ONLINE PLAY PAUSED FOR TODAY outside ready identity (`js/onlinePlayerIdentity.js:74,82`). This is not proof of a universal full-screen pause during every gameplay phase.
- **unavailable / deadline-exceeded:** explicit ambiguous-close recovery exists; Transfer's raw display is B-05. No claim that every other screen has equally good error wording.
- **permission-denied:** bounded race handling exists in Transfer/Setup, with genuine denial ultimately surfaced. Denied-read backoff remains present (`js/sparkPrivatePairing.js:943–964`); it is not re-reported as a new finding.
- **offline:** journey authority holds offline and wakes on return; server-derived progress is retained. Actual mobile suspend/kill timing, captive portals, a network that is online to the browser but cannot reach Firestore, and SDK hangs rather than returned errors were **not physically verified**.
- **Unknown:** a full two-phone/Chromebook end-to-end journey with lock/kill at every write boundary; out-of-order delivery injection across every module; cross-midnight Spark recovery in a surviving and a reloaded tab; real IndexedDB blocked/abort behavior; browser storage eviction during open transactions; fresh offline recovery with both retained revisions. No Firebase emulator or production Firebase was used for this audit.
- Previously reported unlock/online cache wipe, denied-read backoff, Special Player reveal replay and rules-first deployment are not counted as new findings. This report's update finding concerns same-name install-time shell mutation, not the unlock cache.

## Validation and what makes this 10/10

**Passed:** `npm run test:contracts` (exit 0; 267/267 current blocking contracts), plus explicitly rerun r87 Roulette (14 groups), Rematch (5) and Deadline Day (7) suites. Ran these plus local VM probes of the actual worker/step and extracted unmodified signing-draft function. Probes established B-01 install failure, B-02 dependency failure, B-03 request routing and B-04 stale draft overwrite; B-05 follows the exact formatting branch. These are code-level reproductions, not claimed physical runs. Test success does not invalidate adverse paths the tests do not inject.

For **10/10**: fix the five findings; add fault-injection coverage for candidate cache interruption, cold offline iframe dependencies, Roulette mandatory-result loading, and two-tab signing edits. Then demonstrate one complete two-device journey through all listed phases with disconnect, phone lock, reload and tab kill around accepted/ambiguous writes, and a quota-paused journey that resumes after the daily reset without replaying or losing an accepted result. Confirm fresh-storage history/verdict rehydration and revision-consistent recovery on those devices. Keep Firebase truth authoritative and the Roulette calculation pure.
