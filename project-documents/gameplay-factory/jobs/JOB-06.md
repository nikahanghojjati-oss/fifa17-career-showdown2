# JOB-06 · Start/Join view model + nav.locked

| Lane | Depends on | Steps | Code branch | PR into | Codex review |
| --- | --- | --- | --- | --- | --- |
| **chat** (normal chat; full test suites run on GitHub CI, see below) | nothing | 7 | `gameplay/job-06-start-join-model` | `gameplay/recovery-v1` | no |

## 1. Goal

Build `js/startJoinViewModel.js`: one pure function that turns the state the app already has (player identity, the Daniel/Nik pair link, the private session) into a single view model for the Start/Join screen, with a confirm text on every destructive action, plus one pure function that says when the new top navigation bar must lock. Team V is designing a Start/Join screen with two big buttons and a "More" menu, and a top bar that must never let a tap throw away a manager's unfinished transfer guesses or season inputs; this job gives them one tested source of truth so the screen never offers a button the providers cannot do, and Nik and Daniel never lose input by tapping a tab.

## 2. Branches and files

- **Lane decision (lead, 2026-10-02):** this job runs in a normal chat. Your sandbox has node 22 but no npm registry, so run your own new contract directly with `node tests/contracts/<your file>` (it needs no packages) and `node --check` on your module. `npm run test:contracts` and `npm run test:ops` run on GitHub: every save to the code branch triggers "Validate Gameplay Fast"; read it on your exact head commit (WORKER_HANDBOOK.md §7). Wherever a step says "run npm …", that CI run is the evidence.

- Code branch `gameplay/job-06-start-join-model` already exists (the lead cut it from `gameplay/recovery-v1`). Save code there. Open a PR into `gameplay/recovery-v1` titled `Job 6: Start/Join view model + nav.locked`.
- First check that job 3 is merged: `js/sharedCareerAnalytics.js` must exist on `gameplay/recovery-v1`. If not, reply "Job 6 waits for job 3." and stop.
- Work mode cannot push with git (job 90). Save files with the GitHub connector and use the CI path in WORKER_HANDBOOK.md §7: read "Validate Gameplay Fast" on your exact head commit.
- Create:
  - `js/startJoinViewModel.js`
  - `tests/contracts/start-join-view-model-contracts.cjs`
- Edit: `POS20_SUPPLEMENTAL_PRODUCT_TESTS.json` (append one entry) and `tests/operations/pos20-control-plane.test.mjs` (two narrow edits, step 6; the lead allows exactly these).
- Status: `project-documents/gameplay-factory/status/JOB-06.md` on `factory/gameplay-v1`.
- Change nothing else. **Adapter only:** no screen, no DOM, no provider change. Do not touch `js/persistentNikDanielPair.js`, `js/sparkRemoteJoining.js`, `js/onlinePlayerIdentity.js`, `js/screens.js`, `js/optionalModules.js`, `index.html`, `service-worker.js`, any CSS or Rules file. The new module is not loaded by the app in this job (binding it is job 13 with Team V), so it needs no service-worker entry.

Read first (all on `gameplay/recovery-v1`):

1. Data contract `project-documents/leads/DATA_CONTRACT_V1.md` on branch `leads/relay`: §0, §1 (`viewerRole`), §2 (Start/Join; field and action names are binding) and §10 (`nav.locked`, `nav.reason`, "Finish this step first").
2. `js/persistentNikDanielPair.js` (the pair provider):
   - 9-14 `MANAGER_BY_ROLE` (`playerOne` = daniel, `playerTwo` = nik); 20 the state shape (`status`, `initialized`, `busy`, `managerRole`, `managerId`, `rivalryId`, `connectionState`, `capability`, …).
   - 131 `pairInitialize`: statuses `unpaired`, `paired`, `recovery-required`, `waiting`, `signed-out`, `unavailable`; `capability` (the `CMS17-…` code) is set only while `connectionState === "pending-pair"`.
   - 144 `startPairing` (status `starting`, then `waiting`, or `save-required` / `error`), 145 `joinPairing` (`joining`, then `paired`), 147 `retryPairLink` (`pair-link-retry`), 67-105 `abandonCurrentShowdown` (no confirm of its own).
   - 167-194 `discardStalePendingConnection` and 196-235 `startOver`: these two **ask their own confirm** (`root.confirm` at 178 and 214).
   - 240 `pairRender`: today's buttons and exactly when each shows. Your model must match it.
   - 244 the exported method names.
3. `js/sparkRemoteJoining.js` (private session): 21 state shape; 107-109 `srjExpiredByClock`, `srjHasNonterminalSession`, `srjSessionBlocksStart`; 263 and 267 HOST / JOIN enable rule; 277-281 COPY CODE, REFRESH / READ, REVOKE OPEN SESSION, CLOSE SESSION, FORGET CODE enable rules; 327-337 exported methods. `js/sparkPrivateSession.js:15` lists the session states `open`, `active`, `revoked`, `expired`, `closed`; while a request is unresolved the runtime uses `sessionState: "unresolved"` (171, 186).
4. `js/onlinePlayerIdentity.js`: 7 state shape (`status`, `registered`, `managerId`, `busy`); 44 the Settings panel shows FORGET THIS DEVICE with **no** confirm today; 52 `forgetOnlineDevice`; 59 exports (`forgetThisDevice`).
5. `js/screens.js:1-15`: the 13 screen ids; `getActiveScreenName` at 63.
6. Style: `js/sharedCareerAnalytics.js` (job 3) for the wrapper and deep freeze; `tests/contracts/shared-career-analytics-contracts.cjs` for how a contract test is written.

## 3. Rules that apply (do not change)

- Never push to `main`, never merge, never force-push, never delete anything. Never deploy.
- Two managers only: `daniel` = `playerOne`, `nik` = `playerTwo`. Daniel creates the code, Nik joins it. Never key by account, profile or save id.
- No provider behaviour changes. The model only describes what the existing providers already do.
- Privacy: the model never carries account ids, device ids, save or profile ids, the rivalry id, the private session code or provider messages. The pairing code appears only for Daniel, only after he created it.
- Every destructive action (`abandonShowdown`, `forgetThisDevice`, session `revoke`, `close`, `forget`) carries a confirm text.
- Pure: never read `localStorage`, `sessionStorage`, `indexedDB`, `window.`, `document`, `Date.now`, `Math.random` or call `confirm(`. The current time comes in as an argument.
- Do not weaken, skip or delete an existing test. The only existing test you edit is `tests/operations/pos20-control-plane.test.mjs`, exactly as step 6 says.

> **Trap (checked by the lead):** `tests/contracts/static-app-release-contracts.cjs:30` joins every `js/*.js` file into one script. It fails if a `function name(` appears in two files, if two files declare the same top-level `let`/`const`, or if any file other than `storage.js`/`diagnostics.js` contains the word `localStorage` anywhere (even in a comment). Keep everything inside the module wrapper and prefix every helper with `sj` (for example `sjFreeze`, `sjAction`). The startup-size budget (`static-app-release-contracts.cjs:28`) is not affected because nothing in `index.html` changes.

## 4. The API to build

```js
// Browser: window.CareerModeStartJoinViewModel; Node: module.exports. No dependencies.
buildStartJoinViewModel({ identity, pair, session, nowEpochMs }) -> deeply frozen view model
navLockState(activeScreen) -> deeply frozen { locked, reason }
CONFIRM, NAV_LOCK_TEXT, LOCKED_SCREENS, contractVersion: 1
```

Inputs are the plain `getState()` objects: `identity` from `CareerModeOnlinePlayerIdentity`, `pair` from `CareerModePersistentNikDanielPair`, `session` from `CareerModeSparkRemoteJoining` (or `null`), and `nowEpochMs` (a number, used only for session expiry). Missing inputs count as `{}`.

### 4.1 Output

```js
{
  status,          // "loading" | "unavailable" | "ready"   (empty/partial never apply here)
  viewerRole,      // "daniel" | "nik" | null
  busy,            // identity.busy || pair.busy || session.busy
  pairing: { state, code, actions: { createCode, join, copyCode, newCode, checkStatus, retry } },
  session: { state, actions: { host, join, refresh, revoke, close, forget } },
  abandonShowdown, // action
  forgetThisDevice,// action
  primaryActions,  // the one or two big buttons, as ids like "pairing.createCode"
  moreActions      // subset of ["session.revoke","session.close","session.forget"], in that order, when available
}
// every action:
{ available, enabled, provider, args, confirm, confirmedByProvider }
```

- An action that is not `available` is `{available:false, enabled:false, provider:null, args:null, confirm:null, confirmedByProvider:false}`. `enabled` is `available && !busy` unless a rule below says more.
- `provider` names the existing method the screen will call: `"pair.<method>"`, `"session.<method>"`, `"identity.<method>"` (each must exist in that module's export), or `"clipboard.pairingCode"` for copying.
- `confirmedByProvider: true` means the provider asks its own confirm, so the screen must not ask a second time; `confirm` then holds the provider's exact text (copied from the source) so the words match.

### 4.2 Rules

- `viewerRole`: from `pair.managerRole` (`playerOne` → `daniel`, `playerTwo` → `nik`), else from `identity.managerId` if it is `daniel` or `nik`, else `null`.
- `status`: `unavailable` when `identity.status !== "ready"` or `identity.registered !== true` or `viewerRole` is `null`, or `pair.status` is `"unavailable"` or `"signed-out"`; otherwise `loading` when `pair.initialized !== true` or `pair.status === "idle"`; otherwise `ready`. When not `ready`: `pairing.state` is `"none"`, `session.state` is `null`, `primaryActions` and `moreActions` are `[]`, and every pairing, session and abandon action is unavailable.
- `pairing.state`: `"paired"` when `connectionState === "active"`; when `"pending-pair"` and `managerRole === "playerOne"`: `"code-created"` if `capability` is set, else `"waiting-for-nik"`; otherwise `"none"` (this includes the stale case `pending-pair` with `managerRole === "playerTwo"`).
- `pairing.code`: `pair.capability` only when the state is `"code-created"` and `viewerRole === "daniel"`; else `null`.
- "Retry mode" = ready and `pair.status === "pair-link-retry"`. In retry mode only `retry` is available (`provider "pair.retryPairLink"`).
- "Fresh start" = ready, not retry mode, `connectionState` neither `active` nor `pending-pair`, and `pair.status` is `unpaired`, `save-required` or `error` (same as `pairRender` line 240).
  - `createCode`: fresh start and Daniel; `provider "pair.startPairing"`, `args {managerRole:"playerOne"}`.
  - `join`: fresh start and Nik; `provider "pair.joinPairing"`, `args {managerRole:"playerTwo"}` (the screen passes the typed code as the first argument).
- `copyCode`: state `code-created` and Daniel; `provider "clipboard.pairingCode"`; enabled even while busy (it only copies). `newCode`: same availability; `provider "pair.startPairing"`, `args {managerRole:"playerOne"}`.
- `checkStatus`: ready, not retry mode, `connectionState === "pending-pair"` (any role); `provider "pair.initialize"`, `args {force:true}`.
- Session layer = ready, `pairing.state === "paired"` and `pair.status === "paired"`. Outside it `session.state` is `null` and all session actions are unavailable.
  - `expired` = session has `sessionId`, finite `expiresAtEpochMs` and finite `nowEpochMs >= expiresAtEpochMs`. `nonterminal` = `sessionId` and `sessionState` is `open` or `active` and not expired. `blocksStart` = `nonterminal` or `pendingAction` set or `sessionState === "unresolved"` (sparkRemoteJoining.js:107-109).
  - `session.state`: `null` with no `sessionId` or when `"unresolved"`; `"expired"` when expired; else the provider value if it is one of `open`, `active`, `revoked`, `closed`, `expired`, otherwise `null`.
  - `host` / `join`: available in the session layer; enabled when not busy and not `blocksStart`; providers `session.hostSession` / `session.joinSession`.
  - With a `sessionId` held (session layer): `refresh` enabled when not busy and no `pendingAction` (`session.refreshSession`); `revoke` enabled when not busy, not expired, no `pendingAction` and `sessionState === "open"` (`session.revokeSession`); `close` the same but `sessionState === "active"` (`session.closeSession`); `forget` enabled when not busy, no `pendingAction`, not `nonterminal` and not `"unresolved"` (`session.forgetSession`). These mirror lines 277-281 exactly.
- `abandonShowdown` (ready only):
  - `recovery-required` (active link, no local copy): `provider "pair.startOver"`, `confirmedByProvider: true`, `confirm` = the text at persistentNikDanielPair.js:214.
  - stale Nik pending (`pending-pair`, `managerRole "playerTwo"`, viewer Nik): `provider "pair.discardStalePendingConnection"`, `confirmedByProvider: true`, `confirm` = the text at line 178.
  - otherwise available when `connectionState` is `active` or `pending-pair`: `provider "pair.abandonCurrentShowdown"`, `confirm = CONFIRM.abandon`, `confirmedByProvider: false`. The screen passes `{expectedRivalryId}` from the live pair state itself; the model does not carry the id.
- `forgetThisDevice`: available when `identity.registered === true` and `viewerRole` is set (also when status is not ready, so a broken browser can still be forgotten); `provider "identity.forgetThisDevice"`, `confirm = CONFIRM.forgetThisDevice`, never `confirmedByProvider` (the provider has no confirm, onlinePlayerIdentity.js:44).
- `primaryActions`, first rule that matches: retry mode → `["pairing.retry"]`; recovery-required → `["abandonShowdown"]`; stale Nik pending → `["abandonShowdown","pairing.checkStatus"]`; `code-created` → `["pairing.copyCode","pairing.checkStatus"]`; `waiting-for-nik` → `["pairing.checkStatus"]`; session layer with `nonterminal` or a `pendingAction` → `["session.refresh"]`; session layer otherwise → `["session.host","session.join"]`; fresh start → `["pairing.createCode"]` for Daniel or `["pairing.join"]` for Nik; else `[]`.
- `CONFIRM` (exact strings; the lead may reword later through the relay):
  - `abandon`: `Abandon this Showdown? It closes the current Daniel vs Nik Showdown for both players. Abandoned Showdowns do not count toward career records.`
  - `startOver`: copy of persistentNikDanielPair.js:214. `discardStale`: copy of line 178.
  - `forgetThisDevice`: `Forget this device? This browser is signed out and must be set up again before it can play. Your Showdowns are not deleted.`
  - `revoke`: `Revoke this open session code? The other player can no longer use it.`
  - `close`: `Close this private session? Both players leave the session. Your Showdown is kept.`
  - `forget`: `Forget this session code on this browser? Nothing online is changed.`

### 4.3 `navLockState(activeScreen)`

- `LOCKED_SCREENS` = `{ transferChallenge: "transfer-window", seasonEntry: "season-entry", leagueWheelScreen: "setup", clubWheelScreen: "setup" }` (data contract §10).
- Returns `{ locked: true, reason }` for those four, `{ locked: false, reason: null }` for the other nine ids in `screens.js:1-15` and for `null` (no active screen). Any other string throws `TypeError("NAV_SCREEN_UNKNOWN")`, so a renamed screen is caught by the tests.
- `NAV_LOCK_TEXT` = `Finish this step first` (exact; shown on a locked tap).

## 5. Steps

After each step update `status/JOB-06.md` and save it to `factory/gameplay-v1` with `Job 6 step k/7: <step name>`. Save code to `gameplay/job-06-start-join-model` as you go.

1. **Baseline.** Clone, check out `gameplay/recovery-v1`, `npm ci`, `npm run test:contracts`, `npm run test:ops`. Record the last lines (`… 97/97 …`, or `98/98` if job 4 merged first; `# pass 73`). Confirm `js/sharedCareerAnalytics.js` exists.
2. **Provider facts.** In node, `require` `js/persistentNikDanielPair.js`, `js/sparkRemoteJoining.js` and `js/onlinePlayerIdentity.js` and print the names of their exported functions and their `getState()`. Paste the three lines into the status notes. Every `provider` name in section 4 must be in those lists; if one is missing, stop and set BLOCKED.
3. **Failing tests first.** Write `tests/contracts/start-join-view-model-contracts.cjs` with every case in section 6. Create `js/startJoinViewModel.js` with the wrapper and functions that throw `"not implemented"`. Run; it must fail. Save both ("tests first").
4. **nav lock.** Implement `navLockState`, `LOCKED_SCREENS`, `NAV_LOCK_TEXT`. Cases 1-2 pass.
5. **View model.** Implement `buildStartJoinViewModel` until all cases pass. No DOM, no storage, no globals, no clock.
6. **Register.** Append to the `tests` array of `POS20_SUPPLEMENTAL_PRODUCT_TESTS.json` (keep its formatting):
   ```json
   {
     "path": "tests/contracts/start-join-view-model-contracts.cjs",
     "patterns": [
       "^js/startJoinViewModel\\.js$",
       "^js/persistentNikDanielPair\\.js$",
       "^js/sparkRemoteJoining\\.js$",
       "^js/onlinePlayerIdentity\\.js$",
       "^js/screens\\.js$",
       "^tests/contracts/start-join-view-model-contracts\\.cjs$",
       "^POS20_SUPPLEMENTAL_PRODUCT_TESTS\\.json$"
     ]
   }
   ```
   Then in `tests/operations/pos20-control-plane.test.mjs` (lead-approved, nothing else): after the last `const …Contract='tests/contracts/…';` line before `const supplementalRegistry` (line 66 today) add `const startJoinViewModelContract='tests/contracts/start-join-view-model-contracts.cjs';`, and add `,startJoinViewModelContract` as the last element of the `expectedSupplementalContracts` array (line 70 today; if job 4 merged first it already ends with `careerScreenSeamContract`, add yours after it). Run `npm run test:contracts` (one more than your baseline, for example `98/98`) and `npm run test:ops` (`# pass 73`, `# fail 0`). Save. Wait for "Validate Gameplay Fast" green on your exact head. Open the PR.
7. **Finish.** Fill the Done checklist, set State: DONE with branch, head SHA, PR link and CI run link, save `Job 6 done: Start/Join view model + nav.locked`.

## 6. Test cases (write all of them in step 3)

Build inputs as plain objects. Use `identity = {status:"ready", registered:true, managerId, busy:false, accountId:"acct_test"}`, `pair = {status, initialized:true, busy:false, managerRole, managerId, connectionState, capability, rivalryId:"pair_"+"1".repeat(64), accountId:"acct_test", deviceId:"device_test", providerSaveId:"save_"+"a".repeat(24), providerProfileId:"profile_"+"a".repeat(24), message:"provider text"}`, `session = {status:"ready", busy:false, sessionId:"session_"+"2".repeat(64), sessionState, expiresAtEpochMs:1000, pendingAction:null}`. One block each with a clear message; end with `console.log("PASS Start/Join view model contracts (20/20 cases): …")`.

1. **Lock table.** `transferChallenge` → `{locked:true,reason:"transfer-window"}`, `seasonEntry` → `"season-entry"`, `leagueWheelScreen` and `clubWheelScreen` → `"setup"`; the other nine screen ids and `null` → `{locked:false,reason:null}`; `"shop"` throws `NAV_SCREEN_UNKNOWN`; `NAV_LOCK_TEXT` is exactly `Finish this step first`.
2. **Screen ids are real.** Every key of `LOCKED_SCREENS` appears as `"<id>"` inside the `screens` array in the source of `js/screens.js`.
3. **Status.** Identity not ready, not registered, or no manager → `unavailable`; `pair.status` `unavailable` or `signed-out` → `unavailable`; `pair.initialized:false` or status `idle` → `loading`; otherwise `ready`. When not ready every pairing, session and abandon action is unavailable and both lists are `[]`.
4. **Daniel fresh start.** `unpaired`, no connection: `createCode` available and enabled with `args {managerRole:"playerOne"}`, `join` unavailable, `primaryActions ["pairing.createCode"]`. Same for `save-required` and `error`.
5. **Nik fresh start.** `join` available with `args {managerRole:"playerTwo"}`, `createCode` unavailable, `primaryActions ["pairing.join"]`.
6. **Daniel code created.** `pending-pair`, `playerOne`, capability `"CMS17-pair_…"`: state `code-created`, `code` equals the capability, `copyCode`, `newCode`, `checkStatus` available, `primaryActions ["pairing.copyCode","pairing.checkStatus"]`.
7. **Waiting for Nik.** Same without capability: state `waiting-for-nik`, `code` null, only `checkStatus`, `primaryActions ["pairing.checkStatus"]`.
8. **Nik never sees a code.** In every state where `viewerRole` is `nik`, `pairing.code` is `null`.
9. **Retry.** `pair-link-retry`: only `retry` available among pairing actions; `primaryActions ["pairing.retry"]`.
10. **Paired, no session.** `session.state` null; `host` and `join` enabled; `primaryActions ["session.host","session.join"]`; `moreActions []`.
11. **Open session.** `refresh` and `revoke` enabled, `close` and `forget` disabled, `host`/`join` disabled; `primaryActions ["session.refresh"]`; `moreActions ["session.revoke","session.close","session.forget"]`.
12. **Active session.** `close` enabled, `revoke` disabled.
13. **Expired by clock.** `nowEpochMs 1000` with `expiresAtEpochMs 1000` and state `open`: `session.state "expired"`, `revoke` and `close` disabled, `forget` enabled, `host`/`join` enabled. With `nowEpochMs 999` it is still `open`.
14. **Unresolved request.** `sessionState "unresolved"`, `pendingAction "host"`: `session.state` null; `host`, `join`, `refresh`, `forget` disabled.
15. **Busy.** With `pair.busy` (or `identity.busy`, or `session.busy`) true, every `enabled` is false except `copyCode`; `available` values do not change.
16. **Abandon variants.** Paired normal → `pair.abandonCurrentShowdown`, `CONFIRM.abandon`, `confirmedByProvider false`. `recovery-required` → `pair.startOver`, `confirmedByProvider true`, confirm text found verbatim in `js/persistentNikDanielPair.js`, `primaryActions ["abandonShowdown"]`. Stale Nik pending → `pair.discardStalePendingConnection`, text found verbatim in the same file, `primaryActions ["abandonShowdown","pairing.checkStatus"]`. Unpaired → unavailable.
17. **Forget this device.** Available with a confirm whenever registered with a manager, also when `identity.status` is `"offline"`; never `confirmedByProvider`.
18. **Providers exist and destructive actions confirm.** Across all inputs used in cases 3-17, every available action's `provider` is `"clipboard.pairingCode"` or `pair.X` / `session.X` / `identity.X` where `X` is a function exported by the required module. Every available `abandonShowdown`, `forgetThisDevice`, `session.revoke`, `session.close`, `session.forget` has a non-empty `confirm`. Every id in `primaryActions` and `moreActions` names an available action.
19. **No leaks.** `JSON.stringify` of every model from cases 3-17 contains none of `acct_test`, `device_test`, the save id, the profile id, the session id, the rivalry id or `provider text`, after `pairing.code` is removed (Daniel's `CMS17-` code contains the rivalry id by design).
20. **Pure and frozen.** The model and all nested objects are frozen; the same input twice gives `deepEqual` output; inputs are not mutated (deep-copy and compare); the source of `js/startJoinViewModel.js` contains none of `localStorage`, `sessionStorage`, `indexedDB`, `window.`, `document`, `Date.now`, `Math.random`, `confirm(`.

## 7. Done checklist (PASS/FAIL with one line of evidence each, in the status file)

- [ ] The test failed before the model existed (commit link) and passes now (20/20).
- [ ] `npm run test:contracts` passes at baseline + 1; `npm run test:ops` passes 73/73.
- [ ] "Validate Gameplay Fast" green on the exact head (run URL).
- [ ] Only the four files in section 2 changed; no provider, screen, `index.html`, service worker, CSS or Rules file touched.
- [ ] Every action names an existing provider method; every destructive action has a confirm; no double confirm where the provider already asks.
- [ ] No ids, codes or provider messages leak; Nik never gets a pairing code.
- [ ] `nav.locked` is true exactly on `transferChallenge`, `seasonEntry`, `leagueWheelScreen`, `clubWheelScreen`.
- [ ] PR open into `gameplay/recovery-v1`; nothing pushed to `main`; nothing deployed.

## 8. When stuck

If the contract and this job disagree, this job wins for now: write the question in the status file and continue. If a provider does not behave as section 4 describes (for example a method is missing in step 2), do not change the provider: set State: BLOCKED with the exact line, save, and reply "Job 6 is blocked: <one line>". If an existing test other than `pos20-control-plane.test.mjs` fails, or the same step fails twice, do the same.
