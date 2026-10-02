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
