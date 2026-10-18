# JOB-24 · G-13 part 2a: foundation for Team V's screens (loader, top bar, shared kit, caching)

| Lane | Depends on | Code branch | PR into | Budget |
| --- | --- | --- | --- | --- |
| **lead** (helper in the lead thread; Nik 2026-10-04: no cloud sessions) | job 13 merged (yes) | `gameplay/job-24-v10-foundation` | `gameplay/recovery-v1` | STOP_BUDGET $8 |

Read `jobs/G13_PART2_COMMON.md` first. Jobs 25–30 build on this one, so keep it small, clear and well tested.

## Goal

One shared way to load and show Team V's screens inside the app, so every later job only adds a screen binder.

## Build

1. **`js/v10Screens.js` (lazy).** A small registry and loader:
   - `ensureKit()` loads Team V's shared kit once (`visual-assets/v10_1/shared/`: `showdown-tokens.css`, `showdown-type.css`, `showdown-ui.css`, `stage.css`, `stage.js`, `motion.css`, `motion.js`, referenced fonts).
   - `register(appScreenId, {css, js, mount(frame), unmount(), frame()})` and `show(appScreenId)`. It loads the screen's CSS and JS on first use, mounts it inside the existing app screen section, and unmounts when the app leaves that screen.
   - Hook into screen changes once. DEFAULT: listen to the app's existing screen-change path (`showScreen` / `navigateTo` in `js/screens.js`). If there is no event, add one tiny dispatch in `showScreen` (a `career-mode-screen-shown` CustomEvent with the screen id). That is the only startup-file edit allowed, and it must not raise the startup gzip line.
   - Move job 13's Career Statistics and Trophy Room binder (`js/careerScreensV10.js`) onto this registry, without changing what they show.
2. **Top navigation bar.** Copy `shared/navbar/navbar.css` and `navbar.js` and follow `NAV_CONTRACT.md` exactly: five tabs plus the gear icon, a desktop top bar on every screen except Loading, and a phone bottom bar and gear on hub screens only. Routes call the app's `navigateTo`. The lock comes from the real `nav.locked` / `nav.reason` in `js/startJoinViewModel.js` (job 6). A locked tap shows "Finish this step first" and does not navigate. Load the bar lazily right after start-up. A short delay before the bar appears is fine.
3. **Caching.** Today `service-worker.js` precaches job 13's ~3 MB of art in `SHELL_PATHS`. The full package is about 20 MB, which is too much to download on install over cellular.
   - DEFAULT: precache only the shared kit, fonts and each screen's CSS/JS.
   - Serve `visual-assets/v10_1/**` images from a separate runtime cache. Make it cache-first, keyed by `RUNTIME_REVISION`, filled on first view and cleared with old revisions.
   - Move job 13's images to that rule.
   - Keep every offline-shell contract (`tests/contracts/offline-shell*.cjs`) passing. If one of them truly requires precache for these files, keep precache and write the reason in the PR body.
4. **UI preferences.** If the bar or music needs to remember a choice, such as muted, use one `localStorage` key `cms.v10.ui` and nothing else.

## Tests

New `tests/contracts/v10-foundation-contracts.cjs`, which covers:
- the registry: load once, mount/unmount on screen change, no double mount;
- the nav: five tab routes, the active tab per screen exactly as in NAV_CONTRACT, locked taps don't navigate and show the toast text;
- the bar is hidden on Loading;
- the service-worker rule: images are not in `SHELL_PATHS`, the runtime cache name includes the revision, `RUNTIME_REVISION` is unchanged;
- `index.html` is unchanged and the startup line is not higher;
- job 13's screens still pass `career-screens-v10-contracts.cjs`.

## Done

Everything in COMMON "Checks before DONE". The two-manager browser journey must stay green with the bar showing. List in the PR body the API that jobs 25–30 should call, with a 5-line example of registering a screen.
