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

## Data contract

Source: `project-documents/factory/DATA_CONTRACT_V1.md` §0. Loading shows no history, score, season, club, league, manager-record or transfer data. Therefore §0 is the only applicable contract section.

| Contract field | E/A | Main source | Level | Loading use |
| --- | --- | --- | --- | --- |
| `status` | E (derived adapter) | `index.html #loadingScreen` + `js/app.js ra()` / `finishStartupPresentation()` | per startup screen instance | Required screen-state field. Main already exposes the underlying lifecycle through `aria-busy`, `.is-ready`, `.is-exiting` and `.hidden`; the factory view model names that state with the contract token. |

No other DATA_CONTRACT_V1 field is displayed by Loading. In particular, Loading does not show `viewerRole`, manager values, `season`, `totalSeasons`, `leagueId`, clubs, scores, trophies, history coverage or transfers. Contract §9 dropped stats are also absent.

### Contract state vocabulary

The preview/build view model uses the contract's exact five states:

- `loading` — startup presentation is active.
- `empty` — contract-safe empty-state preview only; the live startup currently has no separate empty state.
- `unavailable` — contract-safe unavailable-state preview only; the live startup currently has no separate unavailable state.
- `partial` — contract-safe partial-state preview only; the live startup currently has no separate partial state.
- `ready` — startup work is complete and the screen hands off to Home.

The contract's exact interim label is:
`Current Showdown only. Career history is not yet available.`

Loading does not display career history, so this label is retained in fixture metadata for contract fidelity but is not rendered on the Loading screen.

### Bounds and identity rules

Although Loading does not render gameplay values, any fixture context that is present elsewhere in a future preview must obey §0: `totalSeasons` ∈ {1, 3, 5, 10}; league IDs are `premier_league`, `laliga`, `bundesliga`, `serie_a`, `ligue_1`; positions/points/goals stay within league bounds; managers are keyed `daniel` then `nik`. No such values are needed by the current Loading UI.

## Screen states and preview frames

### States the live product actually has

| Live state | Evidence on main | User-visible result |
| --- | --- | --- |
| startup / loading | initial `#loadingScreen[aria-busy="true"]`; app hidden | Reus startup composition with `PREPARING CAREER MODE SHOWDOWN` and animated pulse |
| ready-to-handoff | `ra()` adds `.is-ready`, reveals `#app` but keeps it inert until handoff | same splash remains visible until the minimum startup duration expires |
| exiting | `finishStartupPresentation()` sets `aria-busy="false"`, `aria-hidden="true"`, adds `.is-exiting` | splash fades/scales out over 240 ms in normal motion |
| handed off / done | splash receives `hidden` + `.hidden`; `#app` becomes interactive | Home / `mainMenu` is active |

Reduced motion uses the same semantic states but a 220 ms minimum and no delayed exit transition.

The live Loading screen has no distinct `empty`, `partial`, `unavailable`, error, active-showdown, completed-showdown, Daniel-role or Nik-role presentation. It is identical for both managers.

If initialization throws, `reportApplicationError()` uses the separate application runtime notice system; Loading itself does not switch to an error frame.

There is no slow-network message in the product. Therefore the suggested LD3 slow-network frame is dropped rather than invented.

### Preview-frame plan

- `LD1` — loading in progress. Real live startup state.
- `LD2` — loading done / handoff to Home. Real ready/exiting state.
- `LD3` — omitted. The product has no slow-network message.
- `LD4_EMPTY` — contract-only empty preview. New copy, clearly marked preview data; not claimed as current live behavior.
- `LD5_PARTIAL` — contract-only partial preview. New copy, clearly marked preview data.
- `LD6_UNAVAILABLE` — contract-only unavailable preview. New copy, clearly marked preview data.
- `LD7_READY` — contract `ready` alias for the LD2 handoff state, so all five DATA_CONTRACT_V1 §0 tokens can be exercised without inventing a new live route.

Loading is not manager-specific, so no Daniel/Nik role variants are created. Daniel-first ordering remains relevant only to any fixture metadata that carries managers; this screen currently carries none.

## Live reference element audit

JOB-011 has no mockup image. Per the updated job instruction and Claude's unblock note, the reference authority for this step is the live Loading screen on `main`: `index.html #loadingScreen`, its startup flow in `js/app.js` / `js/screens.js`, its styling in `css/app.css`, and the licensed Reus asset plus credit in `THIRD_PARTY_NOTICES.md`.

The new look follows `CRAFT_GUIDE.md` §4: black/gold Showdown materials, restrained glass, Barlow UI type, gold edges/highlights, and no invented controls or data. Loading has no phone bottom bar.

| Live element | New-look answer | Product reason |
| --- | --- | --- |
| `#loadingScreen` full-screen startup shell | KEEP with new styling | Preserve the real startup-only lifecycle and automatic handoff. Regrade from the current blue/grey treatment into the shared black/gold Showdown look without turning Loading into a routed screen. |
| `.startupScene` backdrop | KEEP with new styling | Preserve the live full-screen scene role. Use dark stadium atmosphere and restrained gold light consistent with the Showdown system; do not add a real logo or extra player. |
| `.startupShardOne`, `.startupShardTwo`, `.startupGrid` | KEEP with new styling | They are decorative geometry, not data. Retain the sense of motion/depth but recolor to the shared black/gold palette and keep them subordinate to the athlete and title. |
| `.startupAthleteFrame` + `#startupAthlete` Marco Reus photo | KEEP | OWNER-4 / PRODUCT_TRUTH §6 explicitly permits this one player-photo exception on Loading. Keep the licensed local asset and reviewed crop; styling may regrade around it but must not replace it with generated player art. |
| `.startupRoundel` with `CM` / `17` | KEEP with new styling | This is project-owned decorative brand text, not a real crest or competition logo. Restyle to match the shared gold/black identity. |
| `.startupKicker` — `THE RIVALRY STARTS HERE` | KEEP with new styling | Exact live string is retained. Make it a restrained eyebrow/kicker in the shared typography system. |
| `.startupIdentity h1` — `CAREER MODE` / `SHOWDOWN 17` | KEEP with new styling | Exact live title remains. Use the Showdown title hierarchy and metallic/gold treatment while keeping accessible DOM text; no state value is baked into art. |
| `.startupEdition` — `TWO MANAGERS · ONE LEGACY` | KEEP with new styling | Exact live decorative copy remains; use the shared edge/plate treatment only if needed for legibility. |
| `.startupStatus` + `.startupPulse` + `#loadingText` | KEEP with new styling | This is the only live loading-status presentation. Keep `PREPARING CAREER MODE SHOWDOWN`; retain motion/reduced-motion behavior and recolor the pulse to the shared gold family. |
| `.startupSaveNote` — `TWO MANAGERS · ONE SHOWDOWN` | KEEP with new styling | Exact live support line remains. Keep it visually secondary. |
| `.startupPhotoCredit` | CHANGE to binding OWNER-4 treatment | Keep the credit visible, but replace live `Display crop` wording with exact product truth: `Marco Reus photo: Tim Reckmann · CC BY 2.0 · Cropped for display`. Remove `aria-hidden`; make Tim Reckmann link to `https://www.flickr.com/photos/foto_db/16204330530/` and CC BY 2.0 link to `https://creativecommons.org/licenses/by/2.0/`, readable by screen readers. |
| `.is-ready`, `.is-exiting`, `.hidden` lifecycle states | KEEP as behavior | These states implement the real startup handoff. Visual polish may change easing/grade later, but truth jobs do not invent a new route or user action. |
| Back button / retry button / slow-network control | DROP / do not add | The live Loading screen has none. PRODUCT_TRUTH permits only real controls; initialization errors belong to the separate runtime notice system. |
| Top navigation / phone bottom bar | DROP / do not add | PRODUCT_TRUTH §7 explicitly hides the phone bottom bar on Loading, and the live startup precedes routed navigation. |
| History/score/club/league/manager data panels | DROP / do not add | Loading displays none of those fields. DATA_CONTRACT_V1 §0 contributes only the derived `status` vocabulary here. |

### Reference differences that are intentional

- The Reus credit is the one required content change: live `Display crop` becomes product-truth `Cropped for display`, with accessible links.
- The visual palette changes from the current blue/grey FIFA-era styling to the factory's black/gold Showdown system.
- No mockup-only element exists to copy, and no new button, stat, route or history panel is introduced.

## Open questions

None. The former reference-image ambiguity was resolved by the updated JOB-011 instruction and Claude's unblock note: Loading has no mockup, so the live `main` startup screen is the reference authority. The build has enough product truth to proceed.
