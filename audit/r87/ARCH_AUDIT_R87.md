# r87 JavaScript architecture audit (fresh eyes), 2026-10-31

Base: `gameplay/r87` at 73713d75b. Scope: the 131 files under `js/` that the app loads, plus `service-worker.js`.
Method: a read-only sweep in four lanes (listeners and timers; swallowed errors and races in the sync layer; dead code and
duplicated state; startup size and load path). Every finding below was checked against the code before it got a verdict.
Fixes are on branch `claude-gameplay/r87-arch-fixes`. Each fix has a test that fails on the base and passes with the fix.

## Clean (checked, nothing to do)
- No handler stacking. Every per-screen listener or observer is removed or recreated with its element, and every one-time install is guarded.
- Home auto-JOIN: one live listener, stopped when Home is left, the tab is hidden, or the 10 minutes run out. All of its timers are cleared.
- Write paths. Season Results publish, Season Commit, Transfer Challenge, Setup and the spin mark each have:
  - an in-flight guard;
  - a stable operation id across retries;
  - a re-read before a stale retry;
  - an idempotent server transaction.

  No double submit was found.
- Service worker: every file the app lazy-loads is precached, and every precached file exists.
- Startup shell: 7 scripts and `css/app.css` total 37,385 of the 37,500 gzip bytes allowed (115 bytes free).

## Fixed in this PR
| id | sev | finding | fix | test |
|---|---|---|---|---|
| S-01 | P2 | A reload mid-Showdown can land on the wrong screen if the season-count read fails twice (weak signal). "Could not read" was treated as "no season played", so the phone opened Career Start and the season-1 replay instead of the live season (`js/productionSharedJourneyEntry.js` resumeAcceptedSeason). | If the read failed and this phone's own save already holds a played season, the phone reports the failure and shows the retryable entry card (START again). A Showdown with no played season keeps the old Career Start path. | `shared-journey-reload-resume-contracts.cjs` C3/C4 |
| S-05 | P3 | If the automatic Terminal Close threw before its own `try` (the intent check), the screen stayed on "Saving this Showdown..." for the page life. CLOSE stayed hidden and retry was blocked (`js/productionSharedTerminalClose.js` automatic close). | The caller now catches the rejection. It reports the error and ends as a failed automatic save, so CLOSE appears. Nothing is written. | `r83-terminal-close-replacement-contracts.cjs` last test |

## For the r87 lead (not in this PR)
| id | sev | finding | recommendation |
|---|---|---|---|
| D1 | P2 | `service-worker.js` precaches 7 acceptance-only scripts that load only behind `?ssjr`, `?ssjr-acceptance` or `?rjr-acceptance` (ssjrProductionAcceptanceRecorder, ssjrProductionNegativeProbeRunner, ssjrProductionNegativeEvidence, stage5fProductionAuthenticatedNegatives, ssjrAcceptancePolishedBridge, ssjrPhysicalJourneyAcceptance, remoteJoiningAcceptance). That is about 160 KB, kept twice with the retained previous shell. | Drop them in the 2.0.0 release PR, which already rewrites the shell lists. The shell counts in `r86-release-contracts` and 4 ssjr/marble contracts that pin the list change with it. I tried it here: only those contracts move. |
| A1 | Nik's call | Commentary v2 (`js/commentaryEngine.js`, plus `data/commentaryLines.js` at 966 KB with 5,100 lines) is not loaded by any screen. Only its contract test uses it. `scoutingCards.js` and `clubCards.js` are not loaded either. | Decide whether 2.0.0 shows commentary (for example in the Gazette) or it waits for 2.1. Nothing breaks either way: none of it is precached. |
| A2 | P2 (post-2.0) | The 37.5 KB budget guards only the 7 shell scripts. A cold Home load then pulls about 1.7 MB of JS (73 files) before the first tap, including seasonFinalV10 (190 KB), touchlineGazette, terminal close and every season module. All loads are `async=false`, so they run in order, and one slow file holds back the rest. | After 2.0, load the season-end modules when a season ends. Today the service worker hides most of the cost on repeat visits. |

## Valid, deferred (P3, low impact, not worth release risk today)
- **S-02:** In `onlinePlayerIdentity.js:84` and `persistentNikDanielPair.js:249`, an older init's `finally` clears a newer forced init's promise. A late init result can also overwrite a busy state for a moment. The effect is a short button flicker that heals itself. Fix: only clear the promise if it is still the same one, and use a generation check.
- **S-03:** `sparkConnectedRivalry.js` auto-publish has no single-flight. If both phones publish together, the loser shows "conflict" until the refresh that follows right after.
- **S-04:** In `productionSharedTerminalClose.js`, refresh and close share one `busy` flag. The effect is cosmetic: "READY" can flash during a close. The close itself stays idempotent.
- **S-06:** `productionSharedHistoryConvergence.js` phcRefresh returns an in-flight promise from the previous season. The next season's History can show up to one fast poll late.
- **L2:** In `persistentNikDanielPair.js:72-80`, Daniel's pair-code wait poll drops to every 15 s after 3 minutes and never stops. It only runs during a first pairing, which is permanent. Fix: cap it at 10 minutes like auto-JOIN.
- **L3:** Two whole-document MutationObservers run for the page life: `musicDockV10.js:277`, and `fullMotionHonor.js:89` (only while Full Motion is on). This is a small CPU cost on DOM changes.
- **S3:** Terminal Close clears `cms.draft.v1` but not `cms.signingDraft.v1`. The leftover is harmless because a restore checks the rivalry and the season.
- **S1/S2:** Some rules and constants are copied across files:
  - CL +5 / EL +3 in 4 files;
  - the Daniel/Nik name map in 10 files;
  - `[1,3,5,10]` in about 36 places;
  - storage key lists in 3 files.

  Contracts pin canonical scoring today. Consolidate after 2.0.
- **D2:** About 9 KB of App Check bootstrap code in `productionFirebaseRuntime.js` is never called (App Check is off). A few small functions have no caller. Clean up after 2.0.

## Rejected
- **L1:** "The shared-setup 2.5 s poll is not tied to the screen." While the live listener is healthy, the poll reads from it, and the listener is billed only when the document changes. A manager who returns mid-setup needs fresh state. No change.
- **L4:** "The roulette scene can wait forever on `channel.done`." CONTINUE is plain DOM, so nobody is stranded. The roulette files belong to the roulette helpers anyway.
