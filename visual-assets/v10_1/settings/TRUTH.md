# Settings · Product truth

Authority: `main` @ `2de237391e17c7de2c6deb606b102b68ee640212` (r51), plus `project-documents/factory/PRODUCT_TRUTH.md` and `DATA_CONTRACT_V1.md`. The live product wins for current behaviour; factory product truth wins where it deliberately adds a requirement for the visual rebuild.

## Ids and routes

### Render and modal lifecycle

- `js/settings.js::renderSettings()` is the content renderer. It replaces `#settingsContent` with the Application, Motion & Feedback, Offline App and Showdown Data panels.
- `js/settings.js::ensureSettingsDialog()` creates the modal shell on first use.
- `js/settings.js::openSettings()` renders Settings, unhides `#settingsOverlay`, sets `#app` inert/aria-hidden and moves focus into the dialog.
- `js/settings.js::closeSettings()` hides the overlay, releases the background inert state and restores the element that opened Settings.
- Settings is a modal overlay, not an entry in `js/screens.js::screens`; there is no standalone Settings screen id in the main route stack.

### How Settings opens

1. Home tile `#settingsButton` is bound in `js/optionalModules.js::initializeOptionalModules()` to `openOptionalModule("settings")`.
2. `ensureSettingsModule()` lazy-loads `css/settings.css` and `js/settings.js`, calls `initializeSettings()`, then `openOptionalModule("settings")` calls `window.openSettings()`.
3. `#onlinePlayerIdentityBadge` also opens Settings by clicking `#settingsButton` when the online identity is ready; otherwise that badge opens the identity gate instead.

### How Back / close works

- `#settingsClose` (×, aria-label `Close Settings`) calls `closeSettings()`.
- Footer button `DONE` calls `closeSettings()`.
- `Escape` inside the overlay calls `closeSettings()`.
- Pointer-down on the backdrop outside the dialog calls `closeSettings()`.
- Those normal exits restore focus to the opener.
- `OPEN HISTORY & BACKUP` calls `openSettingsDataManagement()`: Settings closes without restoring focus, then `openOptionalModule("legacy")` opens Legacy; if that route fails, Settings reopens.
- A successful `DELETE CURRENT SHOWDOWN` closes Settings and navigates to `mainMenu` without adding a history entry.

### Stable ids used by product code or audits

| Selector | Contract in the live product |
| --- | --- |
| `#settingsButton` | Home opener; lazy-module binding; focus return target in browser audits. |
| `#settingsOverlay` | Modal visibility/aria state; online identity observer and browser audits depend on it. |
| `#settingsDialog` | Dialog container; focus trap target. |
| `#settingsTitle` | `aria-labelledby` target; online surface forces the heading back to `SETTINGS`. |
| `#settingsClose` | Close control; focus-preservation and Escape audit anchor. |
| `#settingsContent` | Dynamic panel mount; online identity observes this subtree. |
| `#onlinePlayerIdentitySettingsPanel` | Player-facing Account panel inserted first by `js/onlinePlayerIdentity.js`. |
| `#app` | Becomes inert and aria-hidden while Settings is open. |

### Stable classes used by product code or audits

| Selector | Dependency |
| --- | --- |
| `.settingsMotionChoice` | Radio-choice keyboard handling and focus restoration. |
| `.settingsAudioToggle` | Menu feedback switch and focus restoration. |
| `.settingsApplicationUpdateButton` | Player-facing update action; audited for visible/enabled state. |
| `.settingsDataPanel` | Player-facing Showdown Data panel; audited as visible. |
| `.settingsDeleteCurrentShowdown` | Safe current-Showdown deletion action when a save exists. |
| `.settingsDataButton` | History & Backup route and focus restoration. |
| `.settingsFooter button` | DONE control; browser audit uses it as the last visible control for Tab wrap. |
| `.settingsConnectedAccountPanel` | Class on the player-facing online identity Account panel. |
| `.settingsOfflinePanel`, `.settingsOfflineInstallButton`, `.settingsOfflineUpdateButton` | Retained internal recovery machinery; online product containment hides it. These are not normal player-facing controls. |

### Internal-only ids that must stay out of the player-facing visual

`#saveLibraryProductPanel`, `#sparkConnectedAccountPanel`, `#sparkPrivatePairingPanel` and `#sparkConnectedRivalryPanel` are explicitly hidden and tagged `data-product-surface="internal"` by `js/onlinePlayerIdentity.js`. Factory Settings must not promote these engineering/recovery panels into the normal screen.


## Live buttons and visible strings

Normal online Settings is the player-facing modal after `js/onlinePlayerIdentity.js` applies its containment rules. The Offline App recovery panel, Save Library recovery panel and provider engineering panels exist in the DOM but are hidden; they are not part of the player-facing visual.

### Modal shell

| Kind | Exact product text / behaviour |
| --- | --- |
| Eyebrow | `CAREER MODE SHOWDOWN` |
| Heading | `SETTINGS` |
| Close button | visible glyph `×`; aria-label `Close Settings`; closes Settings and restores focus |
| Footer button | `DONE`; closes Settings and restores focus |

### Account panel

Inserted by `js/onlinePlayerIdentity.js::renderOnlineSettings()`.

| State | Exact visible text |
| --- | --- |
| Eyebrow | `ACCOUNT` |
| Title, no selected manager | `DANIEL & NIK` |
| Title, Daniel | `WELCOME DANIEL` |
| Title, Nik | `WELCOME NIK` |
| Description | `Your player identity and this browser.` |
| Row label | `PLAYER` |
| Player value | `Not selected`, `Daniel` or `Nik` |
| Row label | `DEVICE` |
| Device value | `Ready` or `Not ready` |

Account actions are stateful and are the only buttons this panel may expose:

- signed out: `SIGN IN WITH GOOGLE`
- choose-manager: `DANIEL · PLAYER ONE` and `NIK · PLAYER TWO`
- offline / error / device-error: `TRY AGAIN`
- registered account/device: `FORGET THIS DEVICE`

Daniel is always the first manager choice.

### Application panel

| Kind | Exact product text |
| --- | --- |
| Eyebrow | `APPLICATION` |
| Title | `CAREER MODE SHOWDOWN` |
| Description | `Daniel and Nik's two-manager FIFA 17 Career Mode rivalry companion, built for the connected Showdown experience.` |
| Row | `APPLICATION VERSION` → `v1.9.1` on current main (`APP_VERSION = "1.9.1"`) |
| Row | `BUILD` → `1.9.1-r51` on current main (meta `app-asset-revision`) |
| Row | `CAREER DATA` → `Automatic Showdown storage` |
| Row | `PLAY MODE` → `Daniel vs Nik · two devices` |
| Update button | normally `UPDATE TO LATEST VERSION`; becomes `APPLY READY UPDATE` when a verified worker is waiting |
| Default status | `Updates keep your current Showdown and player identity.` |

Update-status / notice strings that can replace the default status or appear as an app notice are copied from `js/offlineApp.js`:

- `This browser does not support the application update service.`
- `Connect to the internet before checking for the latest Career Mode Showdown version.`
- `Checking for the latest Career Mode Showdown version…`
- `Latest verified version is being applied.`
- `A verified update is ready to apply.`
- `The latest application update is still downloading. Keep this page open and press Update to Latest Version again in a moment.`
- `You are already using the latest available Career Mode Showdown version.`
- error fallback: `The latest version could not be checked right now.`
- unsafe/busy boundary: `Update is ready, but an application operation is still in progress. Finish it and return to Home or Showdown Home before updating.`
- unsafe route boundary: `Update is ready. Return to Home or Showdown Home before applying it so unsaved form work is never discarded.`

### Motion & Feedback panel

| Kind | Exact product text |
| --- | --- |
| Eyebrow | `ACCESSIBILITY` |
| Title | `MOTION & FEEDBACK` |
| Description | `Follow the device by default, force non-essential motion to be minimized, and control the optional menu confirmation cue.` |
| Effective badge | `STANDARD` or `REDUCED` |
| Row | `DEVICE PREFERENCE` → `Standard motion` or `Reduced motion` |
| Row | `EFFECTIVE APP MOTION` → `Standard motion` or `Reduced motion` |
| Radiogroup aria-label | `Application motion preference` |
| Choice | `FOLLOW DEVICE` |
| Choice description | `Use the browser or operating-system accessibility preference.` |
| Choice | `REDUCE MOTION` |
| Choice description | `Always minimize menu transitions, League Wheel delay and Club Reveal theatrics.` |
| Feedback label | `MENU CLICK FEEDBACK` |
| Feedback description | `A short original confirmation cue. It stays silent while Home media is playing and never blocks navigation.` |
| Switch text | `ON` or `OFF` |
| Switch aria-label | `Menu click feedback on` or `Menu click feedback off` |

Exact notices from these controls:

- `Motion preferences are unavailable in this browser session.`
- `Reduced motion is enabled.`
- `Motion now follows your device preference.`
- `Menu feedback preferences are unavailable in this browser session.`
- `Menu click feedback is enabled.`
- `Menu click feedback is muted.`

### Showdown Data panel

| Kind | Exact product text / state |
| --- | --- |
| Eyebrow | `CAREER DATA` |
| Title | `SHOWDOWN DATA` |
| Description | `Delete a broken current Showdown safely or open History & Backup. Starting over closes only the current Showdown connection; your player identity and registered device stay ready.` |
| Row label | `CURRENT SHOWDOWN` |
| Current value, active | `{active.name or "Unnamed Showdown"} · {active.status or "Saved"}` |
| Current value, none | `None` |
| Row label | `HISTORY` |
| History value | `{n} completed showdown` when n = 1; otherwise `{n} completed showdowns` |
| Destructive button, active only | `DELETE CURRENT SHOWDOWN` |
| Route button | `OPEN HISTORY & BACKUP` |
| Note, active | `Delete Current Showdown closes this Showdown connection for both players before removing this device's current local copy. Player identity, registered device, completed history and app settings are kept.` |
| Note, none | `No current Showdown is stored on this device. Completed history, backup export and full reset remain available under History & Backup.` |

Delete confirmation (with live showdown name substituted):

`Delete the current "{name}" Showdown and start over? This closes the current Showdown connection for both players, removes this device's current local Showdown, and keeps your player identity, registered device, Legacy history and app settings. This cannot be undone.`

Delete success notice:

`Deleted the current "{name}" Showdown and closed its connection. Your player identity, registered device, Legacy history and app settings were kept.`

Delete failure prefix:

`The current Showdown was not deleted. {error message or "No saved data was changed."}`

Other exact route/error strings from this panel:

- `Data Management could not be opened.`
- `Showdown storage is unavailable in this session.`
- `Showdown storage could not be verified.`
- `The Showdown connection service is unavailable.`
- `Safe Showdown restart is unavailable in this build.`
- `The online Showdown connection was not closed, so the local copy was kept.`
- `The current Showdown could not be verified safely.`
- `The active Showdown changed after you confirmed deletion. Nothing was deleted. Review the current Showdown and confirm again.`
- `The online Showdown was closed, but this device could not remove its local copy. Retry Delete Current Showdown; no new connection will be created.`

### Product-truth addition required for the factory Settings rebuild

Current `main` does not yet repeat the Loading credit inside Settings. `PRODUCT_TRUTH.md §6` and `DATA_CONTRACT_V1.md §10` deliberately add it here, while OWNER-4 keeps the credit on Loading as well.

Exact required credit:

`Marco Reus photo: Tim Reckmann · CC BY 2.0 · Cropped for display`

- `Tim Reckmann` link: `https://www.flickr.com/photos/foto_db/16204330530/`
- `CC BY 2.0` link: `https://creativecommons.org/licenses/by/2.0/`
- The Settings copy is not a replacement for the Loading-screen credit.


## Data contract

Authority: `project-documents/factory/DATA_CONTRACT_V1.md`, especially §0 (all-screen status, manager keys, value bounds and interim label), §1 (`viewerRole`), §8 (online History rules), §9 (dropped stats) and §10 (Settings holds credits and app version).

The contract does not define a dedicated Settings view-model table. Therefore this sheet does not invent Team G field names. Where §10 states a Settings obligation in prose rather than naming a serialized field, the row below says so explicitly.

| Contract field / obligation | E/A | Source on main | Level | Settings use |
| --- | --- | --- | --- | --- |
| `status` | A view-model wrapper | §0 requires the normalized five-state wrapper; `js/settings.js` currently exposes local/provider substates instead of this field | per screen read | Exactly `loading`, `empty`, `unavailable`, `partial` or `ready`. |
| `viewerRole` | E | `js/onlinePlayerIdentity.js` maps selected manager id `daniel` / `nik`; contract §1 names the field | per viewer/session | Drives the player-facing Account label. Daniel is first/left, Nik second/right. |
| `interimLabel` | A display adapter | contract §0 | per screen read | If owner-review data is current-Showdown-only, exact text is `Current Showdown only. Career history is not yet available.` Never a launch state. |
| app version (Settings obligation; §10 has no serialized field name) | E | `js/app.js` `APP_VERSION` → `js/settings.js::getSettingsApplicationVersion()` | application | Current main value is `1.9.1`; visible as `v1.9.1`. |
| credits (Settings obligation; §10 has no serialized field name) | A on Settings | Absent from current Settings; required by `PRODUCT_TRUTH.md §6` and contract §10 | application | Repeat the Reus photo credit and links in Settings; Loading keeps its own copy. |

### Contract state behaviour

The factory Settings view-model always exposes one `status`:

- `loading`: Settings shell may render, but contract-backed career/history information is still resolving. Never substitute zeroes.
- `empty`: read succeeded for a new career with no counted Showdown history. Local settings controls still work.
- `unavailable`: a contract-backed read failed. Keep static app version, credit and local preference controls usable; show unavailable rather than zero.
- `partial`: some Showdowns are unreadable. Never call the data `career` or `all-time`; show the available coverage where a future contracted data surface uses it.
- `ready`: required reads succeeded.

Exact interim copy, when the preview intentionally demonstrates current-Showdown-only data:

`Current Showdown only. Career history is not yet available.`

### What is not a Team G career-data field

These are local application controls/state already on `main`, not recorded football/history stats. They remain legitimate Settings UI and are not renamed into invented Team G fields:

- reduced-motion preference and effective device motion
- menu click feedback on/off
- application update availability/action
- online identity/device readiness and the existing account actions

The contract's drop rule is applied to career/history/stat data. It is not used to delete genuine local Settings controls that do not represent recorded game history.

### Live fields dropped from the factory data presentation

Current `main` shows two free-form local summaries that have no Settings contract field name:

| Current main value | Product answer |
| --- | --- |
| `active.name` + `active.status` under `CURRENT SHOWDOWN` | DROP as a displayed data row in the factory visual. The safe current-Showdown action may remain; do not invent a Settings contract field for the free-form name/status summary. |
| `loadLegacyShowdowns().length` under `HISTORY` | DROP as a displayed career count. Provider history is authoritative; local legacy length is not a contract career total. |
| `BUILD` asset revision | DROP from the required data contract surface. §10 requires app version, not a build-revision field. |

No §9 dropped stat is reintroduced here. Settings must not add clean sheets, biggest match win, non-CL European wins, player names/photos, match results, possession or per-match statistics.


## Screen states and preview frames

Settings combines the contract's screen-read state with local UI substates. The contract state is authoritative for any career/history-backed information; account, motion, feedback and update controls have their own local substates.

### State inventory

| State family | Values on the real product / contract | Factory treatment |
| --- | --- | --- |
| Contract screen state | `loading`, `empty`, `unavailable`, `partial`, `ready` | All five must have a designed presentation. No failed read is rendered as zero or empty. |
| Viewer role | `daniel`, `nik` | Both are previewed. Daniel is always first/left wherever both appear. |
| Account state | `connecting`, `signed-out`, `choose-manager`, `ready`, `offline`, `error`, `device-error`, plus busy transitions while sign-in/selection/forget runs | These change the Account title/actions but do not create new career stats. |
| Motion | follow device / reduced override; effective motion standard or reduced | Preview both normal and reduced-motion choices. |
| Menu feedback | on / off | Exact ON/OFF switch copy; no extra sound setting is invented. |
| Update | current/checkable, waiting update, unsupported, offline, downloading/error | Button label/status changes only to strings copied in the Live buttons section. |
| Current Showdown action gate | no active Showdown / active Showdown | Safe delete exists only when an active Showdown exists. The factory visual does not show the uncontracted free-form current-name/status row. |
| Destructive confirmation | closed / open | Confirmation is native `window.confirm` behaviour on main; the factory preview must show the exact confirmation copy when open. |
| Operational error | action-specific notice | Keep the Settings screen visible unless main deliberately navigates away; career-data read failure maps to contract `unavailable`. |
| Completed | no distinct Settings screen state | A completed Showdown is handled by the career/history surfaces. Settings does not get a separate `completed` presentation. |

### Required preview frames

The minimum product frames from the job are ST1–ST3. Four additional contract-state frames are included so every required `status` can be reviewed without pretending that a failed read is an empty career.

| Frame | Contract status | Viewer | Purpose |
| --- | --- | --- | --- |
| `ST1` | `ready` | `daniel` | Default Settings: account ready, follows device, effective standard motion, menu feedback on, update action available, no destructive dialog. |
| `ST2` | `ready` | `nik` | Reduced-motion preview: reduced override on, effective reduced motion, menu feedback off. |
| `ST3` | `ready` | `daniel` | Destructive confirmation open for `DELETE CURRENT SHOWDOWN`; exact confirm string; background Settings remains visible/inert behind the dialog. |
| `ST4` | `loading` | `daniel` | Contract-backed data resolving; static app version, credit and local preference controls remain present; no fake zeroes. |
| `ST5` | `empty` | `daniel` | New career/read succeeded; no active Showdown delete action; local controls remain usable. |
| `ST6` | `unavailable` | `nik` | Contract-backed read failed/offline; show unavailable state, not zero history. Account recovery may expose `TRY AGAIN`. |
| `ST7` | `partial` | `nik` | Partial provider history. If current-Showdown-only owner-review data is shown, display exactly `Current Showdown only. Career history is not yet available.` and never call it career/all-time. |

No extra `active` or `completed` contract statuses are invented: active-Showdown presence is a local action gate inside the five-state wrapper, and completed is represented in the dedicated career/history flows.


## Mockup reconciliation

There is no Settings mockup or goal image in `project-documents/factory/mockups/`. The directory README assigns mockups/goals to Trophy Room, Career Statistics, Rivalry Statistics, Legacy, Season Results, Start / Join, Home, League, Club and Transfer War only.

Because no Settings mockup exists, there are no visual mockup elements to copy or reject. The Settings build authority is therefore the live product behaviour on `main`, the binding product truth, the data contract, shared factory visual language and the quality bar.

| Mockup element | Product answer |
| --- | --- |
| Settings mockup | N/A — no Settings mockup exists in the factory reference set. Do not borrow a different screen's composition and call it the Settings mockup. |
| Real club crests / league logos / trophies / player imagery | DROP / prohibited by `PRODUCT_TRUTH.md §6`; Settings needs none of them. |
| Reus photograph | Do not add the photograph to Settings. KEEP only the required text credit and links. The sole permitted Reus image remains on Loading. |
| ABOUT destination | DROP as a separate destination. `DATA_CONTRACT_V1.md §10` folds app version and credits into Settings. |
| Unrecorded football statistics | DROP. Settings does not invent stats; `DATA_CONTRACT_V1.md §9` remains binding. |

The absence of a Settings mockup is not a blocker because the product behaviour and content authority are explicit.
