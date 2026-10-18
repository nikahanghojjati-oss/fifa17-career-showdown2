# r80 plan: career save to Firebase

Base main 9b8190f0 (1.9.3-r79); branch gameplay/r80; refs are file:line there.

## 0. Lead revision (2026-10-18 18:15 UTC): rebuild, don't copy

Section 1 shows the only browser-only piece of a live two-player Showdown is a shell that is fully derivable from Firebase:
saveId + profileId (own `accounts/{uid}/pairLinks/current`: providerSaveId/providerProfileId), role (identity), totalRounds
(rivalry id char 5, `wslSeasonsOf`), canonical names Daniel/Nik, and `sharedJourney:{mode:"shared",setupPending:true}`.
Profiles are only `{profileId, displayName}` (js/saveLibraryFoundation.js:280-288). Nik's joiner shell is already built from the
code alone (`provisionJoinerShell`, js/productionSharedJourneyEntry.js:86).

**Chosen design (B):** no `careerSave` doc. When the pair read says a Showdown is live and this browser lacks the exact shell,
rebuild it with the pairLink's exact saveId/profileId (`runtime.adoptOnlineEntry`, reusing `runtimeAppendSaveEntry`), then continue.
Firebase stays the only truth; the browser library becomes a cache. Cost: 0 new docs, 0 new reads or writes, Rules change only
for `endedEarly`. Section 2's careerSave doc, section 3's push hook and section 6's upload are dropped; PR 1 shrinks to the
`endedEarly` Rule, PR 2+3 merge into "rebuild on continue". Open question 1 disappears (any device can rebuild).
Kept from below: END SHOWDOWN (4), wording sweep (5), tests (7, minus push cases), PR 4 and 5.
Fallback (A, sections 2-3) only if review finds shell state that cannot be derived.
**Where the rebuild runs (Codex #927 P1):** right after the active pair read in `pairInitialize()`, before any
`recovery-required` state is published. Today a fresh browser reaches `recovery-required` there, START returns `pair-first`, and
the recovery UI offers only RESTORE BACKUP / DELETE, so `pairContinueOnlineShowdown()` is never reached. r80: when the pairLink is
active and the exact shell is missing, adopt it first (no extra read); `recovery-required` stays only for a failed adopt. Also adopt
in `pairContinueOnlineShowdown()` and `pairRetryPairLink()` (idempotent: an existing exact shell is reused, never duplicated).
**END season count (Codex #927 P2):** after a reload Settings can END before multi-season progression is loaded, so the in-memory
count is not trustworthy. END first runs the existing progression `resumeFromAuthority()` for that exact rivalry (a few reads, once
per END), then writes the mark in the abandon transaction; if the count cannot be read, END still closes and records
`seasonsPlayed` as unknown (History shows a dash). Test: reload, then END mid-season 2 => row shows 1 season.

## 1. Where the save lives today

`careerModeShowdown.saveLibrary` (schema js/saveLibraryFoundation.js:232,274-330) = `{schemaVersion, activeSaveId, profiles[],
saves:[{saveId, showdown}]}`. For a two-player Showdown the active `showdown` is only a shell: managers, totalRounds, identity
refs, `sharedJourney:{mode:"shared",setupPending:true}` (js/productionSharedJourneyEntry.js:31-40). Shared Setup never changes it (js/productionSharedShowdownSetup.js:76-80); league, clubs, transfers, seasons are in Firestore.
Size: live shell 2-5 KB; whole library grows per Showdown (tens to hundreds of KB).

- Writes all go through `runtimeCommitLibrary` (js/saveLibraryRuntime.js:242), from `runtimeSaveCurrent` :278, `runtimeClearActive` :419,
  `runtimeCreateShowdown` :475, archive/identity :256, and restore (js/restore.js:230-238, 545). Callers of `saveCurrentShowdown()`:
  productionSharedJourneyEntry.js:38, leagueWheel.js:193,299, clubAssignment.js:417,458, seasonEngine.js:526, transferChallenge.js:370-743,
  screens.js:668. Debounce js/storage.js:6,38-42 (420 ms, flush on pagehide/hidden).
- Reads: js/storage.js:15-61, js/saveLibraryRuntime.js:301, backup.js:73-117, analytics.js:62, saveLibraryUI.js (whole editor),
  and the START decision `wslLocalShell` (js/whichShowdownIsLive.js:32).
- Other browser-only: `pairedShell.v1` (js/persistentNikDanielPair.js:65), IndexedDB pointer (js/sparkConnectedRivalry.js:8,201-238),
  session PENDING_KEY / LIVE_GAME_KEY (js/productionSharedJourneyEntry.js:8,309). All rebuildable caches.

Already in Firestore: `rivalries/{pair_*}` (slots carry each player's saveId/profileId) + sharedSetup, transfers, seasonResults,
seasonCommits, terminalClose; `accounts/{uid}/` pairLinks, careerIndex, careerStart, partner, partnerInbox (all `current`).
Browser only: the shell + its 2 profiles. Without them a new browser cannot continue.

The gate: `freshBrowserGameplayRequiresVerifiedLocalRecovery:true` and `gameplayCacheHydrationAcrossFreshBrowsers:false`
(js/persistentNikDanielPair.js:543, asserted in tests/contracts/persistent-nik-daniel-pair-contracts.cjs:42,119).
`pairContinueOnlineShowdown` (:266) throws PERSISTENT_PAIR_LOCAL_RECOVERY_REQUIRED when `pairExactLocalBindingForProviderSlot` (:117,
via `pairHasExactLocalRecoveryCopy` :116) finds no shell for the slot's saveId. :265 does the same during the connect step.

## 2. Firestore layout and Rules

New doc `accounts/{uid}/careerSave/current`, owner-written, pairLinks-style envelope (objectType `careerSave`). data:
`{schemaVersion:1, rivalryId|null, saveId, entry:{saveId, showdown}, profiles:[2]}`. 2-5 KB live, <200 KB ever; client refuses >900 KB
(limit 1 MiB). Live Showdown stays rivalry + pairLink; this doc only rebuilds the save (no second pointer).

Rules, all in firestore.persistent-pair-production.fragment.rules:
- Inside the FUNCTIONS block (ends at :557) add `cmsCareerSaveWriteValid(accountId, docId)`. Owner uid, docId 'current', `activeDevice`,
  `validCreateEnvelope`/`validCasEnvelope(..,'careerSave','current')`, `data.keys().hasOnly(..)`. No cross-doc `get()` (billed reads).
- Inside the MATCH block (:559-599) add `match /accounts/{accountId}/careerSave/{docId}`: get by owner only, create/update via the
  function, list/delete false.
- END mark: in `cmsPersistentPairAbandonValid` (:120-138), change :137 to `affectedKeys().hasOnly(['connectionState','endedEarly'])`. If
  `endedEarly` is present it must be `{seasonsPlayed:int 0..10}`. scripts/inject-persistent-pair-rules.mjs:46 needs no change, because
  "closed && no terminalClose" still holds.
- Build: scripts/build-production-firestore-rules-with-persistent-pair.mjs + inject-persistent-pair-rules.mjs pick it up (no change).
  Regenerate tests/fixtures/composed-production-rules/main-delta.json (`node tests/support/composed-production-rules.cjs
  --print-main-delta origin/main`), add owner "R80-SAVE" to `allowedOwners`, review hunks. Gates: tests/contracts/composed-production-rules-contracts.cjs, showdown-gate-l5-inputs-contracts.cjs.

## 3. Write and read timing, budget

Writes: one hook at the end of `runtimeCommitLibrary` (js/saveLibraryRuntime.js:252). It schedules a push of the active entry, debounced
1.5 s, and skips the push when the content hash matches the last pushed hash. It also flushes in `flushPendingApplicationWrites`
(js/storage.js:41). A push is a single `set` with revision = known+1, with no read before it. The revision is learned from the START read.
- Refused push: one `get`. Same contentHash = already landed (idempotent); same saveId = retry at new revision; other saveId = another
  device of this account moved on, online wins, browser adopts it.
- Also push once after the pair link persists (rivalryId bound, js/persistentNikDanielPair.js:144-200), outside that transaction.
- Shared play does not touch the save during seasons, so a Showdown costs about Daniel 2 writes (START shell, code linked) plus Nik
  1-2 writes. END adds no write, because the mark rides on the existing abandon write.

Reads: `whichShowdownIsLive` reads `careerSave/current` once per page next to the pair read it already makes (memoised; the same answer
serves the reload path js/productionSharedJourneyEntry.js:438-445 and START js/onlinePlayerIdentity.js:85). On a new device that is
1 get. The local copy becomes a cache only and is rebuilt from the doc.

Budget: R76 measured ~404 reads / 124 writes per season, both players (RELEASE_V1.9.1_R76.md:24, ~30 seasons/day); r79 meter cap
800/600 (tests/browser/r79-two-player-journey-audit.cjs:46). r80 adds <=4-6 reads and 3-4 writes per Showdown (<2% even for 1-season
Showdowns), so ~30 seasons/day holds (target 20, floor 14).

## 4. END SHOWDOWN

DELETE today: js/settings.js:593 confirms (:603) → `releaseSettingsCurrentShowdownConnection` (:522) → `pair.abandonCurrentShowdown`
(js/persistentNikDanielPair.js:147): one transaction, 3 reads + 1 write (connectionState 'closed' via `pairBuildRivalryClosureEnvelope` :101);
then `runtime.clearActiveShowdown()`, draft sweep, "Deleted..." notice. The other phone learns of it from its existing terminal read (js/sparkTerminalClose.js:90-92 →
js/productionSharedTerminalClose.js:173-186 phase DELETED → pair :528-541). History already shows "Abandoned" rows
(js/sparkCompletedShowdownReader.js:163-164 → js/sharedClosedShowdownAdapter.js:68-71 → js/careerScreenSeam.js:19,67,92), and they never
count (js/sharedCareerAnalytics.js:35,115-116; js/rivalryLegacyV10.js:40).

END changes:
- js/settings.js:700-701 label END SHOWDOWN; keep class `settingsDeleteCurrentShowdown` (red, css/rulesSettingsV10.css:39-47,1161);
  rename to `endSettingsCurrentShowdown`; confirm/notice: "Ends this Showdown for both players. History keeps it as Ended early."
- `abandonCurrentShowdown({..,seasonsPlayed})` puts `endedEarly:{seasonsPlayed}` in the closure data (:101); seasonsPlayed from the
  in-memory multi-season progression (no read). Same single write.
- Browser cache still cleared; careerSave doc left alone (closed rivalry = not live, `closedHere` js/whichShowdownIsLive.js:29; next
  START overwrites). Nothing deleted.
- Reader :164 adds `endedAt` (rivalry updatedAt) + `seasonsPlayed` from the doc it already read; adapter/seam label "Ended early" with
  date + seasons (old rows: dash). Counting unchanged.
- Partner side: the DELETED texts in productionSharedTerminalClose / pair become "ended early" wording. Phase names can stay.
- js/showdownUI.js:162 `deleteCurrentShowdownFromDashboard` (classic, "browser storage"): hide it for shared saves or route it to END.

## 5. Wording sweep

User-visible save wording (local copy / this device / this browser / browser storage), main sites: settings.js:551,583-584,604,639,646,721-722;
persistentNikDanielPair.js:151-174,265-266; startJoinViewModel.js:11; showdownUI.js:152-174; storage.js:15-17; saveLibraryRuntime.js:382,612;
saveLibraryUI.js (18 sites, 26-692); restore.js 286-782 + restoreUI.js:169,215; legacy.js:181-388; transferChallenge.js:372,396,530;
seasonEngine.js:532; screens.js:332,671; productionShared{LocalReconciliation:30-38, ShowdownPresentation:117-209, ShowdownSetup:81-128,
SeasonResults:143,153, MultiSeasonProgression:130, TransferChallenge:325, TerminalClose:146, JourneyEntry:111,123,387};
sparkConnectedRivalry.js (~25), sparkPrivatePairing.js:82-562, sparkRemoteJoining.js:90-572, sparkConnectedAccount.js:15-199,
onlinePlayerIdentity.js:65,72, offlineApp.js:73,295,369, careerStartMarker.js:111,123, backup.js:154, importAnalysis.js:903,936.
Rename `PERSISTENT_PAIR_LOCAL_RECOVERY_REQUIRED`, `pairHasExactLocalRecoveryCopy`, `wslLocalShell`; flip the :543 flags. Device-registration
wording (registered device, FORGET THIS DEVICE) is sign-in, not save: keep. New contract greps js/ + index.html for banned save phrases.

## 6. Migration

Nothing existing is rewritten. First r80 load: a browser whose active saveId = live pair's providerSaveId (or Daniel's pending
code-less shell) and whose `careerSave/current` is missing/different uploads its entry once (1 write; races settle by CAS). If a live
Showdown's only copy sits in a browser that never opens r80, the other device sees "Open the game once where you last played, or END
SHOWDOWN" (see Q1). Finished Showdowns are untouched; the reader's pinned runtimeRevisions (js/sparkCompletedShowdownReader.js:81,113,133)
stay as they are, and `npm run test:saved-showdowns-still-open` must keep passing.

## 7. Tests

- Contracts to update: which-showdown-is-live-contracts.cjs (decide() unchanged; read() now sources the shell from the online doc),
  persistent-nik-daniel-pair-contracts.cjs:42,119, r79-delete-rejoin-contracts.cjs, showdown-delete-clears-drafts-contracts.cjs,
  r79-modes-settings-contracts.cjs, start-join-view-model-contracts.cjs, save-library-product-contracts.cjs, composed-production-rules-contracts.cjs.
- Emulator: new tests/firebase/career-save-emulator.cjs (like permanent-partner-emulator.cjs): owner get/create/CAS; partner, list,
  delete, stale revision refused; abandon with/without valid `endedEarly`, bad shapes refused.
  Extend closed-showdown-adapter-emulator.cjs and completed-showdown-read-emulator.cjs (abandoned with endedAt/seasonsPlayed; old abandoned
  without the mark), and run composed-production-rules-regression.cjs.
- Browser: extend `npm run test:r79-journey` (or test:r80-journey, same emulator config): (a) Daniel mid-season in an empty new
  context continues the same season; (b) both reload mid-season; (c) offline during a push then online: one revision, no duplicate;
  (d) END mid-season: both Home, one Ended early row (date, seasons), Legacy/Stats/Trophy/Rivalry unchanged, next START new;
  (e) END double-tap + retried push idempotent; (f) test-run END never in real History; (g) meter delta <= +6 reads / +4 writes.
  Update strings in r79-delete-rejoin, career-start-settings, connected-account-settings, settings-offline-save-library-editor audits.

## 8. PR split (each into gameplay/r80)

1. Rules only: the careerSave match and endedEarly in abandon, emulator test, main-delta + R80-SAVE. No client change.
2. Online save: a small lazy module js/careerSaveOnline.js (read/push/adopt; it keeps js/persistentNikDanielPair.js from growing), the hook in
   `runtimeCommitLibrary`, `runtime.adoptOnlineEntry` (reuses `runtimeAppendSaveEntry` + commit), and the one-time migration upload. No UI.
3. Source swap: `wslLocalShell` → the online shell in js/whichShowdownIsLive.js:32-38; `pairContinueOnlineShowdown` (:266) and :265
   adopt the online entry before the binding check; flip the flags. Journey cases (a)(b)(c).
4. END SHOWDOWN: Settings, the endedEarly mark, reader/adapter/seam "Ended early" row, partner wording. Cases (d)(e)(f).
5. Wording sweep, banned-phrase contract, meter case (g), release notes and runtime revision r80.

## Open questions for Nik

1. Live Showdown whose only copy is in a browser that never opens r80: is "open it once there, or END SHOWDOWN" OK, or must r80
   rebuild it from the online pairing?
2. Browser-only old Showdowns (classic Legacy, never-online saves): keep in backup files only, or upload once?
