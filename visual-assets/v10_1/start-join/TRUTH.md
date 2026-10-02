# Start / Join product truth

Factory screen: Start / Join  
Live authority: `main` (read only)  
Factory authority: `project-documents/factory/PRODUCT_TRUTH.md`, `DATA_CONTRACT_V1.md`

The factory screen consolidates the live season setup, Daniel/Nik pairing, and private-session entry. Behaviour stays live-authoritative; only presentation is simplified.

## 1. Routes, renderers, ids and selectors

### Route / Back truth

- Home entry is `#newShowdown`.
- `screens.js::initializeScreens` normally routes it to `navigateTo("createShowdown")`.
- `onlinePlayerIdentity.js` intercepts Nik's ready-state Home click and calls `openCanonicalShowdownJoin()`; Daniel continues to `createShowdown`.
- `createShowdown` is always legal in `isRouteStateValid`. `showScreen` / `navigateTo` own route visibility and focus.
- `prepareScreenAccessibility` gives its h2 runtime id `createShowdownScreenTitle`.
- `#startShowdown` is capture-intercepted by the online/shared entry modules; canonical Start prepares the shared shell and opens `#productionSharedJourneyEntryOverlay`.
- Entry CONNECT PLAYERS / REVIEW CONNECTION calls `openPersistentPairControls`, returns to `mainMenu`, then `persistentNikDanielPair.js::pairRender` mounts `#persistentNikDanielPairPanel`.
- Entry CONTINUE / CONNECTED calls `openRemote`, which opens `#sparkRemoteJoiningOverlay`; `sparkRemoteJoining.js::srjRenderPanel` renders it.
- Entry START CAREER calls `openSharedExperience`.
- `createShowdown` Back is the real `.backButton[data-smart-back]`; centralized `navigateBackSmart` allows `dashboard` or `mainMenu`. Normal Home -> Start returns Home.
- Identity, entry and remote overlays close without changing the underlying screen route.

### Product-code ids that must survive adapter/build wiring

`newShowdown`, `createShowdown`, `createShowdownScreenTitle`, `showdownName`, `managerOne`, `managerTwo`, `roundAmount`, `onlineShowdownSetupNote`, `onlinePlayerIdentityOverlay`, `onlinePlayerIdentityBadge`, `onlinePlayerIdentitySettingsPanel`, `startShowdown`, `productionSharedJourneyEntryOverlay`, `startSharedShowdown`, `continueSharedSetupGate`, `sharedJourneyLeagueLockNote`, `spinLeague`, `openClubPack`, `persistentNikDanielPairPanel`, `persistentNikDanielPairCode`, `sparkRemoteJoiningOverlay`, `settingsContent`, `settingsOverlay`, `sparkConnectedAccountPanel`, `sparkPrivatePairingPanel`, `sparkPrivatePairingCodeInput`.

### Product-code classes/selectors

`.screen`, `.hidden`, `.setupBox`, `.menuButton`, `.backButton`, `.stateNote`, `.fifaMenuShell`, `.fifaMenuGrid`; remote selectors `.remoteJoiningOverlay`, `.remoteJoiningShell`, `.remoteJoiningHeader`, `.remoteJoiningDismiss`, `.remoteJoiningBody`, `.remoteJoiningEyebrow`, `.remoteJoiningGrid`, `.remoteJoiningCard`, `.remoteJoiningStep`, `.remoteJoiningInput`, `.remoteJoiningCurrent`, `.remoteJoiningState`, `.remoteJoiningCode`, `.remoteJoiningMeta`, `.remoteJoiningActions`, `.remoteJoiningEmpty`, `.remoteJoiningStatus`, `.compactButton`; settings pairing selectors `.settingsPanel`, `.settingsConnectedAccountPanel`, `.settingsPrivatePairingPanel`, `.settingsPanelHeading`, `.settingsPanelEyebrow`, `.settingsInfoGrid`, `.settingsInfoRow`, `.settingsOfflineActions`, `.settingsConnectedAccountActions`, `.settingsConnectedAccountButton`, `.settingsConnectedAccountInput`, `.settingsDataNote`.

## 2. Live buttons and visible strings

These are copied from `main`. Factory wording may simplify jargon only where it preserves the same product meaning.

### Home and identity gate

Role-aware Home tile from `onlinePlayerIdentity.js::configureOnlineProductSurface`:

| Player | Code | Label | Meta | Route |
| --- | --- | --- | --- | --- |
| Daniel | `NEW` | `START A SHOWDOWN` | `Choose seasons and create the code` | season setup |
| Nik | `JOIN` | `JOIN DANIEL'S SHOWDOWN` | `Paste Daniel's code` | canonical Join |

Identity gate fixed strings: `CAREER MODE SHOWDOWN`, `CONNECTION REQUIRED`, `SIGN IN TO PLAY`, `WHO ARE YOU?`, `CONNECTION NEEDS ATTENTION`, `CONNECTING`, `TRY AGAIN`, `SIGN IN WITH GOOGLE`, `DANIEL · PLAYER ONE`, `NIK · PLAYER TWO`; close aria-label `Close sign-in`.

Identity status copy includes `Preparing your player…`, `Connection required. Reconnect before continuing.`, `Connecting…`, `Sign in with Google to play.`, `Choose your player.`, `Opening Google sign-in…`, `Welcome Daniel.`, `Welcome Nik.`, `Forgetting this device…`, `This device was forgotten.`, `This device was forgotten. Refresh before using it again.`.

### Season setup

Visible strings: `NEW SHOWDOWN`, `Daniel is Player One. Nik is Player Two.`, `NUMBER OF SEASONS`, `1 Season`, `3 Seasons`, `5 Seasons`, `10 Seasons`, `BACK`. Hidden canonical labels/values remain `SHOWDOWN NAME` / `Daniel vs Nik`, `PLAYER ONE` / `Daniel`, `PLAYER TWO` / `Nik`.

Start button exact state labels: `START A SHOWDOWN`, `CHOOSE PLAYER TO START`, `RECONNECT TO START`, `SIGN IN TO START`, `CONNECT TO START`. Not-ready title: `Sign in and choose Daniel or Nik before starting a Showdown.`

Fresh-start confirm:
`Start a new Showdown? This will close the current Daniel vs Nik Showdown for both players. Your player identity, registered device, Legacy history, app settings and existing local recovery data will be kept.`

### Shared entry dialog

Aria: `Career Mode Showdown entry`; close aria `Close career entry`.  
Strings: `CAREER MODE SHOWDOWN // 17`, `CAREER MODE SHOWDOWN`, `GET READY`, `Daniel and Nik must both be connected before the career begins.`  
Rows: `ACCOUNT`, `THIS BROWSER`, `DANIEL + NIK`, `CAREER`; values `READY`, `REQUIRED`, `CONNECTED`, `CONNECT`, `WAITING`.  
Buttons: `CONNECT PLAYERS`, `REVIEW CONNECTION`, `CONTINUE`, `CONNECTED`, `WAITING FOR BOTH PLAYERS`, `START CAREER`, `REFRESH`, `×`.  
Status: `Ready. Continue to Career Start.`, `Ready. Continue when both players are set.`, `Both players must be connected before league and club selection.`

### Persistent Daniel / Nik pairing

Headings: `CONNECT PLAYERS`, `WAITING FOR THE OTHER PLAYER`, `CAREER READY`, `FINISH CONNECTION`, `OLD SHOWDOWN FOUND`, `OLD CONNECTION FOUND`.

Instructions: `DANIEL STARTS THE SHOWDOWN AND SENDS THIS CODE TO NIK`, `NIK ENTERS THE CODE DANIEL SENDS`, `CHOOSE DANIEL OR NIK FOR THIS DEVICE FIRST`, `NIK WAITS FOR THE NEW CODE DANIEL CREATES`, `If the original code expired, create a new one.`, `DO NOT REFRESH UNTIL THE CONNECTION IS SAVED`, `SAVE THE CONNECTION BEFORE SHARING THE CODE`, `NO LOCAL CAREER DATA ON THIS BROWSER`; input placeholder `Paste Daniel's code`.

Buttons: `CREATE CODE FOR NIK`, `JOIN DANIEL'S SHOWDOWN`, `COPY CODE`, `CHECK STATUS`, `NEW CODE`, `CONTINUE CAREER`, `TRY CONTINUE AGAIN`, `RETRY CONNECTION`, `DELETE OLD CONNECTION & START FRESH`, `DELETE OLD SHOWDOWN & START OVER`, `RESTORE BACKUP`.

Visible state/error copy includes: `Getting your Showdown ready…`, `Daniel and Nik need to connect before the first Showdown.`, `Preparing your Showdown…`, `Joining Daniel's Showdown…`, `Daniel and Nik are already connected.`, `Send this code to Nik. It is needed only once.`, `Nik joined Daniel's Showdown. Continue Career when both players are ready.`, `Finishing your connection…`, `Connection saved. Send the code to Nik. It is needed only once.`, `Opening your career…`, `Career ready.`, `The code could not be joined.`, `The Showdown could not be started.`, `This browser has conflicting player data. Forget this device and start again.`, `Choose Daniel or Nik before continuing.`, `Choose the number of seasons before creating a connection code.`, `Ask Daniel to create a new connection code, then paste that new code here.`, `Daniel's connection code is invalid.`, `This browser has a different unfinished Showdown. Delete the old Showdown first, then paste Daniel's code again.`

Opaque join failure:
`This one-use pairing code could not be joined. It may be expired, already used, or unavailable to this account. Create a new code on the other device, or use Connected Rivalry below if these managers are already paired.`

Stale-Nik confirm:
`Delete this old connection and start fresh? This closes the stale online test connection and removes only its unfinished local Showdown so Nik can join the new code Daniel creates.`

Recovery start-over confirm:
`Delete the old Showdown and start over? This closes the old online Showdown for both players. Your player identity, registered device, Legacy history and app settings are kept.`

### Private Remote Joining

Aria: `Private Remote Joining`; close aria `Close Private Remote Joining`; input aria `Exact private session code`; placeholder `session_…`.

Visible headings/copy: `CAREER MODE SHOWDOWN // 17`, `PRIVATE SESSION · EXACT CAPABILITY ONLY`, `REMOTE JOINING`, `01 · HOST`, `OPEN PRIVATE SESSION`, `02 · JOIN`, `JOIN EXACT SESSION`, `CURRENT PAGE-MEMORY SESSION`, `No session capability is held in page memory.` Live explanatory text says there is no lobby/public discovery, uses a fresh 256-bit capability, and requires the exact directly shared code.

Buttons: `HOST PRIVATE SESSION`, `JOIN PRIVATE SESSION`, `COPY CODE`, `REFRESH / READ`, `REVOKE OPEN SESSION`, `CLOSE SESSION`, `FORGET CODE`, dynamic `RETRY SAME <ACTION>`, `×`. Clipboard feedback: `COPIED`, `COPY UNAVAILABLE`.

Visible state copy includes `Remote Joining is private and action-only. No session request has been sent.`, `Creating an exact private session capability…`, `Joining the exact private session…`, `Reading exact private-session authority…`, `Revoking the exact open private session…`, `Private session is revoked terminally. It can no longer be joined; forget the code when ready.`, `Private session code forgotten from page memory. No provider state was changed.`; state line `<STATE> · REV <revision> · <role>`; expired uses `EXPIRED`; meta `Rivalry <short id> · expires <local time>`.

Guards/errors: `Resolve, revoke or close the current private session before hosting another.`, `Resolve, revoke or close the current private session before joining another.`, `No private session code is held in page memory.`, `Only an open host session can be revoked before peer join.`, `Only an active private session can be closed.`, `Resolve the pending provider outcome before forgetting this page-memory capability.`, `Firebase Spark quota is temporarily exhausted. No upgrade will be attempted; local Career Mode remains available.`

Factory wording rule: do not carry forward implementation jargon such as `page-memory session`, `exact capability`, `256-bit capability`, provider names, or protocol detail into the polished Start / Join UI. Use plain equivalents without changing behaviour.

## 3. Data contract

Authority: `DATA_CONTRACT_V1.md §0, §2, §9`.

| Contract field/action | E/A | Exact live source | Level |
| --- | --- | --- | --- |
| `status`: `loading` / `empty` / `unavailable` / `partial` / `ready` | A | G-6 adapter over persistent-pair + remote-session states | Start / Join view |
| `totalSeasons` ∈ {1,3,5,10} | E | `#roundAmount`; persisted Showdown season count; `pairPreparedTotalRounds` | Showdown |
| `pairing.state`: `none` / `code-created` / `waiting-for-nik` / `paired` | E | `pairInitialize`, `pairStartPairing`, `pairJoinPairing` | Showdown |
| `pairing.code` host only after creation | E | `pairStartPairing` -> `pairBuildPlayerJoinCode` -> `state.capability` | Showdown |
| `createCode` | E | `pairStartPairing` | Showdown |
| pairing `join` | E | `pairJoinPairing` | Showdown |
| `copyCode` | E | `pairRender` -> `pairCopyText` | Showdown |
| `newCode` | E | `pairRender` -> `pairStartPairing` | Showdown |
| `checkStatus` | E | `pairRender` -> `pairInitialize({force:true})` | Showdown |
| `retry` | E | `pairRetryPairLink` | Showdown |
| `session.state`: `open` / `active` / `revoked` / `closed` / `expired` | E | `sparkRemoteJoining.js` `srjState.sessionState` + `srjExpiredByClock` | private session |
| `host` | E | `srjHostSession` | private session |
| session `join` | E | `srjJoinSession` | private session |
| `refresh` | E | `srjRefreshSession` | private session |
| `revoke` | E | `srjRevokeSession` | private session |
| `close` | E | `srjCloseSession` | private session |
| `forget` | E | `srjForgetSession` | current browser's session code |
| `abandonShowdown` with confirm | E | `pairAbandonCurrentShowdown`; current callers confirm before closure | Showdown |
| `forgetThisDevice` with confirm | E | `onlinePlayerIdentity.js::forgetOnlineDevice` exported as `forgetThisDevice`; provider revoke is `sparkPrivatePairing.js::revokeRegisteredDevice` | registered browser / identity |
| one VM, two big buttons, More with Revoke / Close / Forget + confirm | A | G-6 adapter only | Start / Join view |

Contract-state meaning: `loading` = read pending; `empty` = successful read, no connection; `unavailable` = required read failed; `partial` = one required layer known and another unavailable; `ready` = authoritative current state. Never substitute zero/empty for a failed read.

Exact interim label if current-Showdown-only context is ever shown before real career history:
`Current Showdown only. Career history is not yet available.`

Manager keys are `daniel` = `playerOne` and `nik` = `playerTwo`; Daniel is always first/left. No rival private inputs enter the VM. §9 dropped stats are absent.

## 4. States and preview frames

### State matrix

| Runtime situation | Contract status | Product treatment |
| --- | --- | --- |
| identity/pair/session read pending | `loading` | progress only; no guessed code/state |
| read succeeded, no pair/session | `empty` | Start / Join choices |
| one layer known, another required read failed | `partial` | preserve known layer + availability wording + real retry |
| required authority cannot be read | `unavailable` | unavailable message + retry; never delete local career |
| valid current state known | `ready` | actions from actual pairing/session values |

Live `error` is not a sixth contract status. A malformed pasted code is an inline action error while the successful read remains `empty` or `ready`. A failed state read maps to `unavailable`; one-layer failure maps to `partial`.

Live `active` maps to `status=ready`, `pairing.state=paired`, `session.state=active`. Start / Join has no generic `completed` state. Terminal session states are `revoked`, `closed`, `expired` under top-level `ready`; confirmed setup continues to START CAREER.

### Role behavior

Daniel is Player One and established host: choose seasons, create code, send to Nik. Nik is Player Two and joins Daniel's code; his Home tile routes directly to Join. The factory composition keeps both large cards visible on both devices for orientation, Daniel first/left and Nik second/right, while only the selected identity's pairing action is enabled/primary. After pairing, the existing session actions remain intact; the established presentation is Daniel host, Nik joiner.

### Required preview frames

All frames visibly say `Preview data`. Codes are live DOM text, never image pixels.

| Frame | Contract values | Required preview |
| --- | --- | --- |
| `SJ1` nothing hosted | `status=empty`; `pairing.state=none`; no code/session | Two choices: Daniel Start left with season selector/create path; Nik Join right with paste path. |
| `SJ2` Daniel hosting | `status=ready`; `pairing.state=waiting-for-nik`; host-only `pairing.code`; no session | Daniel emphasized; selectable code + COPY CODE, NEW CODE, CHECK STATUS. |
| `SJ3` Nik joining | `status=ready`; authoritative `pairing.state=none` until redemption | Nik emphasized; preview harness fills the live input; JOIN DANIEL'S SHOWDOWN. Typed draft is transient DOM input, not `pairing.code`. |
| `SJ4` bad code | `status=empty` when state read succeeded and no pair exists | Keep Join form; malformed preview shows `Daniel's connection code is invalid.` inline. |
| `SJ5` connected/paired | `status=ready`; `pairing.state=paired`; `session.state=active` | Both connected; no pairing code; START CAREER. Session management is secondary in More. |

Additional QA coverage: `loading`, `partial`, `unavailable`, pair retry/recovery-required, and session `revoked`, `closed`, `expired`. These supplement rather than replace SJ1-SJ5.
