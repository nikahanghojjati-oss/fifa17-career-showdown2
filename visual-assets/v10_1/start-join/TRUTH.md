# Start / Join product truth

Factory screen: Start / Join  
Live product authority: `main` (read only)  
Factory authority: `project-documents/factory/PRODUCT_TRUTH.md` and `DATA_CONTRACT_V1.md`

The factory name "Start / Join" maps to the live `createShowdown` route plus the shared journey entry, persistent Daniel/Nik pairing controls, and private session overlay. The live Home tile still says "START A SHOWDOWN"; behaviour on `main` is authoritative.

## Ids and routes

### Route and render authority

- Home opens the screen from `#newShowdown`. `js/screens.js::initializeScreens` binds it to `navigateTo("createShowdown")`.
- `createShowdown` is always a legal route in `isRouteStateValid`.
- The live setup shell is `<section id="createShowdown" class="screen hidden">` in `index.html`. Its heading receives the runtime id `createShowdownScreenTitle` and becomes the route focus target via `prepareScreenAccessibility`.
- The visible setup route is prepared by `showScreen` / `navigateTo`; `createShowdown` is also in `REQUIRED_FOOTBALL_VISUAL_SCREENS`, so the football visual layer is prepared before entry.
- `#startShowdown` is initially bound by `js/screens.js::initializeScreens`, then `js/productionSharedJourneyEntry.js::installStartButton` takes canonical capture-phase ownership and calls `startShared`.
- `startShared` creates or reuses the shared Showdown shell, then opens `#productionSharedJourneyEntryOverlay`. `renderPanel` is the renderer for that entry dialog.
- From the entry dialog, CONNECT PLAYERS / REVIEW CONNECTION calls `openPersistentPairControls`, which returns to `mainMenu` and renders `js/persistentNikDanielPair.js::pairRender` into `#persistentNikDanielPairPanel`.
- CONTINUE / CONNECTED calls `openRemote`, which opens `#sparkRemoteJoiningOverlay`; `js/sparkRemoteJoining.js::srjRenderPanel` renders the host/join session controls.
- START CAREER calls `openSharedExperience`, which opens Career Start if the setup is already confirmed, otherwise activates the shared Showdown presentation.
- Back on `createShowdown` is the real `.backButton[data-smart-back]`. `initializeSmartBackDelegation` captures it and calls `navigateBackSmart`. Legal back targets are `["dashboard", "mainMenu"]`; normal Home → Start flow returns to `mainMenu`.
- The entry and remote joining layers are dialogs with their own close buttons; closing them hides the overlay and leaves the underlying route unchanged.

### IDs depended on by product code

| ID | Source / dependency |
| --- | --- |
| `newShowdown` | Home tile; `screens.js` opens `createShowdown`. |
| `createShowdown` | Route/screen id used by `screens.js`. |
| `createShowdownScreenTitle` | Runtime heading id assigned by `prepareScreenAccessibility`. |
| `showdownName` | Hidden canonical Showdown name field in live markup. |
| `managerOne` | Hidden canonical Player One field; Daniel. |
| `managerTwo` | Hidden canonical Player Two field; Nik. |
| `roundAmount` | Season length selector; read by shared journey setup and joiner shell provisioning. |
| `startShowdown` | Primary setup action intercepted by the shared journey entry module. |
| `productionSharedJourneyEntryOverlay` | Entry dialog root rendered by `productionSharedJourneyEntry.js`. |
| `startSharedShowdown` | Legacy/duplicate shared-start id checked and removed by the canonical installer. |
| `continueSharedSetupGate` | Temporary continue control used while shared setup is pending. |
| `sharedJourneyLeagueLockNote` | Temporary lock note inserted before league selection when both players are not connected. |
| `spinLeague` | Locked while shared setup is pending. |
| `openClubPack` | Locked while shared setup is pending. |
| `persistentNikDanielPairPanel` | Persistent two-manager connection panel root. |
| `persistentNikDanielPairCode` | Nik's Daniel-hosted code input in persistent pairing controls. |
| `sparkRemoteJoiningOverlay` | Private session dialog root. |
| `settingsContent`, `settingsOverlay`, `sparkConnectedAccountPanel`, `sparkPrivatePairingPanel`, `sparkPrivatePairingCodeInput` | Settings pairing ids used by `sparkPrivatePairing.js`; retained as product dependencies even though the factory Start / Join screen consolidates the flow. |

### Classes / selectors depended on by product code

- `.screen`, `.hidden`: screen routing / visibility.
- `.setupBox`: live setup shell.
- `.menuButton`: primary setup and pairing/session actions.
- `.backButton`: centralized smart Back delegation.
- `.stateNote`: setup note and persistent pairing panel host styling.
- `.fifaMenuShell`, `.fifaMenuGrid`: persistent pairing insertion point on Home.
- Entry / remote joining selectors shared by the live modules: `.remoteJoiningOverlay`, `.remoteJoiningShell`, `.remoteJoiningHeader`, `.remoteJoiningDismiss`, `.remoteJoiningBody`, `.remoteJoiningEyebrow`, `.remoteJoiningGrid`, `.remoteJoiningCard`, `.remoteJoiningStep`, `.remoteJoiningInput`, `.remoteJoiningCurrent`, `.remoteJoiningState`, `.remoteJoiningCode`, `.remoteJoiningMeta`, `.remoteJoiningActions`, `.remoteJoiningEmpty`, `.remoteJoiningStatus`, `.compactButton`.
- Settings pairing selectors used by `sparkPrivatePairing.js`: `.settingsPanel`, `.settingsConnectedAccountPanel`, `.settingsPrivatePairingPanel`, `.settingsPanelHeading`, `.settingsPanelEyebrow`, `.settingsInfoGrid`, `.settingsInfoRow`, `.settingsOfflineActions`, `.settingsConnectedAccountActions`, `.settingsConnectedAccountButton`, `.settingsConnectedAccountInput`, `.settingsDataNote`.

## Live buttons and strings

Strings below are copied from `main`. Product wording overrides for the factory build are recorded later; this section preserves the live source truth.

### Setup route: createShowdown

Visible / accessible strings:

- `NEW SHOWDOWN`
- `Daniel is Player One. Nik is Player Two.`
- `NUMBER OF SEASONS`
- `1 Season`, `3 Seasons`, `5 Seasons`, `10 Seasons`
- Hidden accessible labels retained by the live form: `SHOWDOWN NAME`, `PLAYER ONE`, `PLAYER TWO`
- Hidden canonical values: `Daniel vs Nik`, `Daniel`, `Nik`
- Back button: `BACK`

The primary start button changes with online identity state:

| State | Exact label |
| --- | --- |
| identity ready | `START A SHOWDOWN` |
| choose manager | `CHOOSE PLAYER TO START` |
| offline | `RECONNECT TO START` |
| signed out | `SIGN IN TO START` |
| other not-ready state | `CONNECT TO START` |

When identity is not ready its title is exactly `Sign in and choose Daniel or Nik before starting a Showdown.`

Actions:

| Button | Live action |
| --- | --- |
| `START A SHOWDOWN` / state variant | Canonical capture listener calls `startShared`; if identity is not ready it opens the identity gate. If ready it prepares the shared Showdown shell and opens the entry dialog. |
| `BACK` | Smart Back; normally returns to Home. |

Fresh-start confirmation when a live pair already exists:

`Start a new Showdown? This will close the current Daniel vs Nik Showdown for both players. Your player identity, registered device, Legacy history, app settings and existing local recovery data will be kept.`

### Shared journey entry dialog

Dialog aria-label: `Career Mode Showdown entry`  
Close button aria-label: `Close career entry`

Static strings:

- `CAREER MODE SHOWDOWN // 17`
- `CAREER MODE SHOWDOWN`
- `GET READY`
- `Daniel and Nik must both be connected before the career begins.`
- Row labels: `ACCOUNT`, `THIS BROWSER`, `DANIEL + NIK`, `CAREER`
- Row values vary: `READY`, `REQUIRED`, `CONNECTED`, `CONNECT`, `WAITING`

Buttons and state-dependent labels:

| Button label | Live action / state |
| --- | --- |
| `CONNECT PLAYERS` | Opens persistent Daniel/Nik pairing controls when no rivalry is attached. |
| `REVIEW CONNECTION` | Same action when a rivalry already exists. |
| `CONTINUE` | Opens private Remote Joining when the private session is not active. Disabled until rivalry is ready. |
| `CONNECTED` | Same action when the private session is active. |
| `WAITING FOR BOTH PLAYERS` | Disabled career-start action until the session is active. |
| `START CAREER` | Opens confirmed Career Start or activates the shared Showdown presentation. |
| `REFRESH` | Re-reads the entry status. |
| `×` | Closes the entry dialog. |

Live status sentences:

- `Ready. Continue to Career Start.`
- `Ready. Continue when both players are set.`
- `Both players must be connected before league and club selection.`

### Persistent Daniel / Nik pairing controls

State headings:

- `CONNECT PLAYERS`
- `WAITING FOR THE OTHER PLAYER`
- `CAREER READY`
- `FINISH CONNECTION`
- `OLD SHOWDOWN FOUND`
- `OLD CONNECTION FOUND`

Role / instruction strings:

- `DANIEL STARTS THE SHOWDOWN AND SENDS THIS CODE TO NIK`
- `NIK ENTERS THE CODE DANIEL SENDS`
- `CHOOSE DANIEL OR NIK FOR THIS DEVICE FIRST`
- `NIK WAITS FOR THE NEW CODE DANIEL CREATES`
- `If the original code expired, create a new one.`
- Input placeholder: `Paste Daniel's code`
- `DO NOT REFRESH UNTIL THE CONNECTION IS SAVED`
- `SAVE THE CONNECTION BEFORE SHARING THE CODE`
- `NO LOCAL CAREER DATA ON THIS BROWSER`

Buttons and live actions:

| Button | Live action |
| --- | --- |
| `CREATE CODE FOR NIK` | Daniel creates a one-use, season-bound connection code. |
| `JOIN DANIEL'S SHOWDOWN` | Nik redeems Daniel's code. |
| `COPY CODE` | Copies the displayed code. |
| `CHECK STATUS` | Re-initializes and reads provider pairing state. |
| `NEW CODE` | Creates a replacement code for the same selected manager role. |
| `CONTINUE CAREER` | Opens the shared career when active and recoverable locally. |
| `TRY CONTINUE AGAIN` | Same continuation action after an error. |
| `RETRY CONNECTION` | Retries saving the exact existing pair link. |
| `DELETE OLD CONNECTION & START FRESH` | Nik-only stale pending cleanup, after confirmation. |
| `DELETE OLD SHOWDOWN & START OVER` | Recovery path that closes the old Showdown, after confirmation. |
| `RESTORE BACKUP` | Opens verified backup restore. |

Important exact state / error text used by this surface includes:

- `Getting your Showdown ready…`
- `Daniel and Nik need to connect before the first Showdown.`
- `Preparing your Showdown…`
- `Joining Daniel's Showdown…`
- `Daniel and Nik are already connected.`
- `Send this code to Nik. It is needed only once.`
- `Nik joined Daniel's Showdown. Continue Career when both players are ready.`
- `Finishing your connection…`
- `Connection saved. Send the code to Nik. It is needed only once.`
- `Opening your career…`
- `Career ready.`
- `The code could not be joined.`
- `The Showdown could not be started.`
- `This browser has conflicting player data. Forget this device and start again.`
- `Choose Daniel or Nik before continuing.`
- `Choose the number of seasons before creating a connection code.`
- `Ask Daniel to create a new connection code, then paste that new code here.`
- `Daniel's connection code is invalid.`
- `This browser has a different unfinished Showdown. Delete the old Showdown first, then paste Daniel's code again.`
- `This one-use pairing code could not be joined. It may be expired, already used, or unavailable to this account. Create a new code on the other device, or use Connected Rivalry below if these managers are already paired.`

Provider and recovery failures may surface their exact provider `error.message`; the fixed fallback text above is not paraphrased.

Confirm text for stale Nik cleanup:

`Delete this old connection and start fresh? This closes the stale online test connection and removes only its unfinished local Showdown so Nik can join the new code Daniel creates.`

Confirm text for recovery start-over:

`Delete the old Showdown and start over? This closes the old online Showdown for both players. Your player identity, registered device, Legacy history and app settings are kept.`

### Private Remote Joining dialog

Dialog aria-label: `Private Remote Joining`  
Close button aria-label: `Close Private Remote Joining`  
Join input aria-label: `Exact private session code`  
Join input placeholder: `session_…`

Live headings / explanatory copy:

- `CAREER MODE SHOWDOWN // 17`
- `PRIVATE SESSION · EXACT CAPABILITY ONLY`
- `REMOTE JOINING`
- `No lobby, listing or public discovery. Session services resolve only after a private action. Ambiguous network outcomes retain only the exact page-memory capability for safe same-capability retry; no replacement session is generated.`
- `01 · HOST`
- `OPEN PRIVATE SESSION`
- `Creates one fresh 256-bit capability for the currently attached two-manager Connected Rivalry.`
- `02 · JOIN`
- `JOIN EXACT SESSION`
- `Paste the full code shared directly by the other already-paired manager.`
- `CURRENT PAGE-MEMORY SESSION`
- Empty state: `No session capability is held in page memory.`

Buttons and actions:

| Button | Live action |
| --- | --- |
| `HOST PRIVATE SESSION` | Creates a new private session capability if no unresolved/nonterminal session is held. |
| `JOIN PRIVATE SESSION` | Joins the exact pasted session capability. |
| `COPY CODE` | Copies the current capability when copying is allowed. |
| `REFRESH / READ` | Reads the exact current provider session. |
| `REVOKE OPEN SESSION` | Revokes an open host session. |
| `CLOSE SESSION` | Closes an active session. |
| `FORGET CODE` | Forgets the terminal capability from page memory without changing provider state. |
| `RETRY SAME <ACTION>` | Retries an unresolved host / join / close using the same capability. |
| `×` | Closes the dialog. |

State / status strings and templates include:

- Initial: `Remote Joining is private and action-only. No session request has been sent.`
- `Creating an exact private session capability…`
- `Opening the exact private session. Its full capability is hidden until provider acknowledgement is confirmed…`
- `Joining the exact private session…`
- `Joining the exact capability. Its full value remains hidden while provider acknowledgement is unresolved…`
- `Reading exact private-session authority…`
- `Revoking the exact open private session…`
- `Closing the exact active private session. Copy is disabled until provider acknowledgement is confirmed…`
- `Private session is revoked terminally. It can no longer be joined; forget the code when ready.`
- `Private session code forgotten from page memory. No provider state was changed.`
- State line template: `<STATE> · REV <revision> · <role>`; clock-expired state uses `EXPIRED`.
- Meta template: `Rivalry <short id> · expires <local time>`.
- Clipboard result labels: `COPIED`, `COPY UNAVAILABLE`.
- Start-block errors: `Resolve, revoke or close the current private session before hosting another.` and `Resolve, revoke or close the current private session before joining another.`
- Missing code: `No private session code is held in page memory.`
- Pending-operation guard: `Resolve the pending operation before reading the session.`, `Resolve the pending operation before revoking the session.`, `Resolve the pending operation before closing the session.`
- Revoke guard: `Only an open host session can be revoked before peer join.`
- Close guard: `Only an active private session can be closed.`
- Forget guard: `Resolve the pending provider outcome before forgetting this page-memory capability.`
- Quota fallback: `Firebase Spark quota is temporarily exhausted. No upgrade will be attempted; local Career Mode remains available.`

### Factory wording override

`PRODUCT_TRUTH.md` requires plain words on the factory Start / Join screen. The build must not carry forward jargon such as `page-memory session`, `exact capability`, `256-bit capability`, or provider implementation detail. It may change presentation wording only where the product already has an equivalent plain meaning. The live strings above remain the source record for behaviour and state mapping.
