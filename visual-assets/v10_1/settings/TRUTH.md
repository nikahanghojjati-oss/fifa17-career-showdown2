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
