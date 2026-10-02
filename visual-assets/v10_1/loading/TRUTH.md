# Loading · product truth

Authority: live product on `main` at `2de237391e17c7de2c6deb606b102b68ee640212` (r51), read only. Product truth and the Team V ↔ Team G contract are in `project-documents/factory/PRODUCT_TRUTH.md` and `project-documents/factory/DATA_CONTRACT_V1.md`.

## Ids and routes

### How the Loading screen is rendered

Loading is not a normal routed screen and has no dedicated render function. It is static startup markup in `index.html` under `#loadingScreen`.

Startup flow on `main`:

1. `js/app.js` `sa()` initializes the application and calls `showScreen("mainMenu", false)` while `#app` is still hidden/inert.
2. On the next animation frame, `ra()` removes `.hidden` from `#app`, keeps the app inert, adds `.is-ready` to `#loadingScreen`, and waits for the startup minimum duration.
3. `finishStartupPresentation(loadingScreen, app, reducedMotion)` sets `aria-hidden="true"`, `aria-busy="false"`, adds `.is-exiting`, restores `#app` interaction, then hides the splash immediately for reduced motion or after the 240 ms exit transition.
4. The handoff target is `mainMenu`.

Timing constants in `js/app.js`:
- normal minimum: `STARTUP_SPLASH_MINIMUM_MS = 2700`
- reduced motion minimum: `STARTUP_SPLASH_REDUCED_MS = 220`
- exit: `STARTUP_SPLASH_EXIT_MS = 240`

### Route and Back

- Entry: automatic on document startup. There is no user route into Loading.
- Exit: automatic handoff to `mainMenu`.
- Back: none. Loading has no Back control.
- `js/screens.js` does not include `loadingScreen` in the `screens` array or `SAFE_BACK_TARGETS`, so `showScreen()`, `navigateTo()` and `navigateBackSmart()` never treat Loading as an app route.
- Product truth: the phone bottom bar is hidden on Loading.

### IDs depended on by product code or browser tests

| Selector | Dependency |
| --- | --- |
| `#loadingScreen` | `js/app.js` startup lifecycle; `tests/browser/loading-visual-audit.cjs`; base and fidelity CSS |
| `#app` | `js/app.js` startup handoff and loading visual audit |
| `#startupAthlete` | Reus image styling; loading visual audit decode/crop assertions |
| `#loadingText` | Loading status text styling and live status text node |

### Classes and selectors depended on by product CSS/tests

| Selector | Purpose / dependency |
| --- | --- |
| `.startupScene` | full-screen scene layer |
| `.startupShard`, `.startupShardOne`, `.startupShardTwo` | geometric startup art |
| `.startupGrid` | scene grid overlay |
| `.startupAthleteFrame` | Reus photo frame; directly measured by loading visual audit |
| `.startupIdentity` | startup identity block; directly measured by loading visual audit |
| `.startupIdentity h1` | title block; directly measured by loading visual audit |
| `.startupRoundel` | CM / 17 roundel |
| `.startupKicker` | decorative kicker |
| `.startupEdition` | two-manager edition line |
| `.startupStatus` | loading pulse + status; directly measured by loading visual audit |
| `.startupPulse` | animated four-bar loading pulse |
| `.startupSaveNote` | lower-right/lower-left supporting line; directly measured by loading visual audit |
| `.startupPhotoCredit` | Reus attribution; directly measured by loading visual audit |
| `.is-ready` | startup-ready state added by `ra()` |
| `.is-exiting` | exit state added by `finishStartupPresentation()` |
| `.hidden` | final hidden state after startup completes |
| `link[data-visual-fidelity="reus-r3"]` | required by loading visual audit; injected by `js/app.js` |
| `link[data-offline-app-style]` | mobile/installed-app loading audit dependency |

The loading visual audit also depends on the mobile CSS custom property `--startup-mobile-top-band` and verifies the startup composition at browser and iOS standalone heights.


## Buttons and strings

### Buttons

There are no buttons or other user actions on Loading. The screen exits automatically to Home.

### Visible strings on `main`

Copied exactly from `index.html`:

| Element | Exact live string | State notes |
| --- | --- | --- |
| roundel | `CM` | static decorative text |
| roundel | `17` | static decorative text |
| kicker | `THE RIVALRY STARTS HERE` | static |
| title line 1 | `CAREER MODE` | static |
| title line 2 | `SHOWDOWN` + `17` | static |
| edition line | `TWO MANAGERS · ONE LEGACY` | static |
| loading status | `PREPARING CAREER MODE SHOWDOWN` | shown during startup; `#loadingText` is not rewritten by current product code |
| save/support line | `TWO MANAGERS · ONE SHOWDOWN` | static |
| photo credit | `Marco Reus photo: Tim Reckmann · CC BY 2.0 · Display crop` | static live wording; see required product-truth correction below |

### Accessibility strings and state

- `#loadingScreen` starts with `role="status"`, `aria-live="polite"`, `aria-busy="true"`, and exact `aria-label="Career Mode Showdown is starting"`.
- When the startup presentation finishes, `js/app.js` changes `aria-busy` to `false` and sets `aria-hidden="true"` before hiding the splash.
- The Reus image has `alt=""`; the scene and identity are decorative/aria-hidden.
- Current `main` also marks `.startupPhotoCredit` `aria-hidden="true"`.

### Binding rights/accessibility override

`PRODUCT_TRUTH.md` §6 and OWNER-4 require the Loading credit to stay visible and be readable by screen readers, with:
`Marco Reus photo: Tim Reckmann · CC BY 2.0 · Cropped for display`

The required final treatment also links the photographer name to `https://www.flickr.com/photos/foto_db/16204330530/` and the licence to `https://creativecommons.org/licenses/by/2.0/`.

This is a product-truth correction to the current live text/accessibility treatment, not invented copy.

### Missing state-specific copy on the live splash

The current product has no Loading-specific empty, unavailable, partial, slow-network, retry, or error string, and no state-dependent button label. Generic runtime errors are shown by the separate application runtime notice system, not by `#loadingText`.
