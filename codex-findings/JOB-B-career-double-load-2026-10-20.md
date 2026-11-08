# JOB-B — career screens draw, disappear, and draw again

## Summary

Audited `main` at `9230e33455eae93040317e7553131be34c20da9b`, release **1.9.5-r81**, on 2026-10-20. Live main was checked again before writing. `codex-findings/` did not exist, so there were no previous reports in that folder to duplicate. No app code was changed.

**Eight P2 findings; no substantiated P1 or P3 findings.** The owner rule is violated in ordinary navigation: the screen loader considers a mounted frame ready before career data, authentication, and sometimes renderer initialization have settled. Subsequent refreshes replace whole stages and replay entrances. There need not be a failed network request or a double tap.

History is the Team V presentation of the app's **Legacy route** (`legacy`); they are not two independent screens. Rivalry Statistics uses app route `statistics`. Career Statistics and Trophy Room use a different binder sharing Legacy's career cache. The findings below distinguish premature frames, duplicate renders, duplicate data loads, and missing state notifications; they are related failure modes, not eight independent explanations of every observed flash.

The separate completed-document key-order problem in open PR #957 is excluded. It can change which data is readable but does not fix these lifecycle defects.

## Evidence and limits

Read the requested modules and their navigation, loader, renderer, provider, cache, and event callers. Ran isolated Chromium experiments with the **unchanged** `js/v10Screens.js`, `js/rivalryLegacyV10.js`, `js/careerScreensV10.js`, and, for marker races, `js/careerStartMarker.js`. Provider results were controlled promises containing repository career fixtures; minimal boot probes counted stage replacements without artwork/network timing. A separate experiment used the **real Career Statistics renderer and motion runtime/CSS**, with font readiness deliberately delayed. These prove code paths and mount counts, not a recording of the owner's private production accounts. Temporary harnesses/results stayed outside the repository.

| Scenario | Observed stage boots / result |
| --- | --- |
| Cold Career Statistics | `loading → ready → ready`, one data load |
| Cold Trophy Room | `loading → ready → ready`, one data load |
| Cold Legacy | `loading → ready`, one data load |
| Warm repeat mount of Career Statistics/Trophy Room | Three additional `ready` boots: cached start, cache publication, completion |
| Render already-mounted Legacy again | Two additional `ready` boots: retained start, refreshed result |
| Two Career Statistics mounts before the first read completes | Two simultaneous data loads; two loading boots |
| Marker changes during Legacy's read | First result discarded; second data load; final ready only after trailing reload |
| Marker changes after Career Statistics mounts | Two overlapping data loads; loading remount; final model mounted twice |
| Marker changes before Career Statistics mounts | Notification missed; first result cannot publish; screen ends unavailable |
| History revision changes during Legacy's first read | `loading → ready → ready`, two data loads |
| Account context changes during Legacy's read without a window event | Result discarded; screen remains loading, no replacement read |
| Real Career Statistics renderer, delayed fonts | With `data-v10-pending` absent: populated table opacity `1 → 0` when fonts settle, then entrance restores it |

Related existing contracts all pass: `legacy-refresh-contracts.cjs` (8), `sweep-online-career-live-refresh-contracts.cjs` (7), `career-start-marker-contracts.cjs` (14), and `career-screen-seam-contracts.cjs` (17): **46 checks**. Their mocks/assertions protect data, cache isolation, and throttling; they do not require one final stage boot or one uninterrupted loading cover.

The report-only path routes as `POS20_DOC_ONLY` (zero selected contracts; selected `V10_FLASH_BROWSER` proof). Ran `npm run test:v10-flash`: **PASS**, including all ten screen journeys at 390×844, 844×390 and 1920×910, double-tap checks, reduced-motion passes, and the extra Club checks. It checks old-design/style/image flashes and motion limits, not provider load counts or one final data mount; it does not invalidate the isolated findings above. The suite's desktop tap-feedback observation is report-only and outside this career audit. Generated visual reports stayed under `/tmp/`.

## Findings

### B1 — P2: first reveal waits for a frame's artwork, not its final career data

**Player steps:** After a normal page reload, open Legacy/History, Career Statistics, Trophy Room, or Rivalry Statistics. A slow career read makes the intermediate screen easy to see. No error or repeated tap is needed.

**Exact sequence and locations:**

1. Navigation exposes the route synchronously: `js/screens.js:441`, `js/screens.js:466`. Legacy starts its asynchronous binder from `js/legacy.js:535` and paints an unavailable seam at `js/legacy.js:543`. Trophy Room renders its seam, shows the route, and starts its binder without returning/awaiting it at `js/trophyRoom.js:269`. Statistics does the same at `js/statistics.js:615` and `js/statistics.js:622`.
2. Legacy/Rivalry `refresh` sets a new context's source to `LOADING` (`js/rivalryLegacyV10.js:282`), **awaits `screens.show()` first** (`js/rivalryLegacyV10.js:296`), and only then starts the model read (`js/rivalryLegacyV10.js:298`). Thus the first shown loading frame must finish its reveal before the data read begins.
3. Career Statistics/Trophy Room start `v10LoadOnline()` without awaiting it and immediately call `screens.show()` (`js/careerScreensV10.js:1642`). `v10Source()` chooses the shared cache, loading, or unavailable frame (`js/careerScreensV10.js:1518`).
4. `vsShow()` mounts whatever frame is available (`js/v10Screens.js:361`, `js/v10Screens.js:373`), waits for its images/plates, and settles the cover (`js/v10Screens.js:377`, `js/v10Screens.js:379`). It has no knowledge of the career read. The pending CSS only hides children while that flag exists (`css/v10Shell.css:17`); it is not a data-readiness gate.
5. The final result changes the frame and replaces the entire stage (`js/rivalryLegacyV10.js:309`, `js/rivalryLegacyV10.js:109`; `js/careerScreensV10.js:1537`). A still-mounted Legacy frame does not acquire a new pending cover in `vsShow()` (`js/v10Screens.js:367`), so the second boot can happen directly in view.

**Suggested fix:** Give navigation one awaitable prepare operation covering settled identity/account, marker/scope, final model, renderer readiness, and required images/fonts. Keep the loading presentation above the destination throughout. Mount the final ready/empty/partial/unavailable frame once, then release the cover. Start reads during preparation rather than after revealing a loading version of the destination. A settled empty result is final; an unresolved model is not.

The adjacent Standings career view has the same readiness split: `js/seasonFinalV10.js:284` starts a detached read, `js/seasonFinalV10.js:291` deliberately returns loading until it finishes, the screen-shown listener starts it at `js/seasonFinalV10.js:2076`, and `wake()` rebuilds the stage at `js/seasonFinalV10.js:2054` / `js/seasonFinalV10.js:1997`. Its initial screen cover likewise does not await that model.

### B2 — P2: one successful career read mounts the same final data twice

**Player steps:** Open Career Statistics or Trophy Room once while signed in. This occurs with a normal readable career, including a warmed cache.

**Exact sequence and locations:**

1. `v10LoadOnline()` awaits the common loader (`js/careerScreensV10.js:1633`).
2. Before that promise returns, `rlLoadCareerModel()` publishes `careerCache` and synchronously dispatches `career-mode-online-career-model-change` (`js/rivalryLegacyV10.js:273`).
3. Its listener unconditionally invalidates and shows the mounted screen (`js/careerScreensV10.js:1613`, `js/careerScreensV10.js:1616`). This mounts the final model.
4. The awaiting `v10LoadOnline()` then reaches `finally`, clears `onlineLoading`, and calls `v10Redraw()` (`js/careerScreensV10.js:1634`), which **again** invalidates and shows the same screen (`js/careerScreensV10.js:1626`).
5. `invalidate()` deletes the mounted record (`js/v10Screens.js:384`), defeating the same-object no-op at `js/v10Screens.js:364`. Each show can replace `host.innerHTML`, boot the renderer, reset UI selection/countups, and reacquire the pending cover. Browser probes recorded exactly `loading, ready, ready` on cold opens.

**Suggested fix:** Make one operation own the final commit. During an owned load, the publication event should update the model without initiating another mount; completion should perform the single final reveal. For independent publishers, call `show()` without unconditional invalidation when the host is intact, and suppress unchanged model revisions/content. Merely debouncing network reads cannot fix this two-mount/one-read defect.

### B3 — P2: retained sources and old render wrappers rebuild a warm screen before refreshing it

**Player steps:** View Legacy, return Home, and reopen it. Also revisit Career Statistics/Trophy Room after their model has been loaded, or return to Career Statistics through normal Back navigation.

**Exact sequence and locations:**

1. Legacy keeps `sources[screen]` and `sourceKeys[screen]` after unmount (`js/rivalryLegacyV10.js:65`, `js/rivalryLegacyV10.js:93`, `js/rivalryLegacyV10.js:177`). A same-context refresh leaves the retained model in place (`js/rivalryLegacyV10.js:282`). `refresh()` first shows that old model (`js/rivalryLegacyV10.js:296`), then reads again and shows the new model object (`js/rivalryLegacyV10.js:305`, `js/rivalryLegacyV10.js:309`). There is no equality check even when the data is identical. Retained/shared models can be empty as well as ready: for example, an earlier no-marker career yields empty, which can be drawn before a recheck discovers the real career (B4).
2. On a mounted Legacy screen, `renderLegacy()` finds no old `.legacyBox` and returns (`js/legacy.js:520`). Nevertheless its wrapper unconditionally invalidates and starts `refresh()` (`js/rivalryLegacyV10.js:328`). Normal `showScreen('legacy')` calls that renderer before entry (`js/screens.js:385`). The retained ready frame is booted again, then the refreshed ready frame is booted again. `clean()` destroys the prior stage (`js/rivalryLegacyV10.js:99`); the replacement starts History UI at page 1/default selection (`js/rivalryLegacyV10.js:30`).
3. Statistics/Trophy Room also prefer the cached model even while `onlineLoading` is true (`js/careerScreensV10.js:1524`), yet every online mount starts another read (`js/careerScreensV10.js:1642`). Starting that read invalidates/redraws immediately (`js/careerScreensV10.js:1630`). Their wrappers call the old renderer first, which replaces V10 content with a generic seam (`js/statistics.js:376`, `js/trophyRoom.js:209`), then invalidate/show the whole V10 stage (`js/careerScreensV10.js:1569`). Career Statistics also renders once explicitly and once in the entry hook (`js/statistics.js:617`, `js/screens.js:382`).

**Suggested fix:** Choose the owner of the destination DOM before running a renderer. Once V10 owns it, update the model without running the old DOM renderer or invalidating an intact host. On each visit, choose either an authoritative reusable snapshot or await its revalidation behind the loading screen; do not reveal cached panels and then tear them down. Reuse the mounted stage for unchanged data and preserve selection/tab/page for genuine later updates.

### B4 — P2: a marker read invalidates its own load; mount timing decides whether it repeats or loses the result

**Player steps:** Keep a browser open while the real career is started in another browser after this page read “no marker”, then open a career screen. The same path occurs when an earlier marker read failed and a subsequent normal read succeeds. The cross-browser `none → ready` case needs no failed request.

**Exact sequence and locations:**

1. The career loader captures `context()` including `markerEpoch` before awaiting marker resolution (`js/rivalryLegacyV10.js:76`, `js/rivalryLegacyV10.js:245`). It requests `recheckNone:true` (`js/rivalryLegacyV10.js:226`). The marker shares an in-flight promise, but deliberately rechecks a settled `none` (`js/careerStartMarker.js:112`).
2. Recovery or `none → ready` calls `csmPublish(..., true)` (`js/careerStartMarker.js:123`, `js/careerStartMarker.js:126`). That increments the epoch and synchronously dispatches `CHANGE_EVENT` before resolving the read (`js/careerStartMarker.js:101`, `js/careerStartMarker.js:105`). The original request already receives the correct marker, but now owns an obsolete context key.
3. **Legacy/Rivalry already mounted:** the change listener calls `refresh(screen,true)` (`js/rivalryLegacyV10.js:195`, `js/rivalryLegacyV10.js:201`). It switches the source to loading and marks the existing flight dirty (`js/rivalryLegacyV10.js:282`, `js/rivalryLegacyV10.js:286`). The first read continues doing career work, cannot publish the cache (`js/rivalryLegacyV10.js:273`), and cannot commit its screen result (`js/rivalryLegacyV10.js:308`). `finally` schedules another load, subject to the two-second interval (`js/rivalryLegacyV10.js:313`, `js/rivalryLegacyV10.js:322`).
4. **Career Statistics/Trophy Room already mounted:** their marker listener immediately calls `v10LoadOnline()` again (`js/careerScreensV10.js:1609`). That remounts loading and starts a second provider load while the first is still running. In the delayed-marker browser probe, two reads overlapped and the successful second result still hit B2.
5. **Marker resolves before those screens mount:** the listener's `isMounted` check ignores the event (`js/careerScreensV10.js:1610`). The original load still cannot publish because its key changed. Its final redraw has no cache and shows unavailable. The fast-marker browser probe reproduced this result with a valid model returned by the provider. The notification is not remembered for later mounting.

**Suggested fix:** Resolve the marker before fixing the career generation/cache key. Treat the marker notification as a scope invalidation, not an order to start a second read from inside the read discovering it. An owned prepare operation should adopt the resolved epoch, recompute its final scoped model, and commit once. Track pending/visible routes as well as mounted stages so a change cannot be lost before mount. Keep fail-closed test filtering throughout.

### B5 — P2: the common career loader orders publications but does not share in-flight reads

**Player steps:** Open Career Statistics, leave before the career finishes, and open Trophy Room or return to Statistics. Alternatively, open Settings (which starts its career count read), then close it and open a career screen before that read finishes. Slow normal service responses suffice; repeat taps are unnecessary.

**Exact sequence and locations:**

1. Each online Statistics/Trophy mount calls `v10LoadOnline()` (`js/careerScreensV10.js:1642`). Neither that function nor `rlLoadCareerModel()` has a same-context promise guard (`js/careerScreensV10.js:1629`, `js/rivalryLegacyV10.js:244`). `onlineToken` suppresses only an older completion's final redraw; it does not prevent its read (`js/careerScreensV10.js:1630`, `js/careerScreensV10.js:1634`).
2. The route-opening functions do not return their binder preparation (`js/statistics.js:619`, `js/trophyRoom.js:273`); `openOptionalModule()` can finish while model preparation is still pending (`js/optionalModules.js:488`, `js/optionalModules.js:511`). The navigation double-tap guard therefore is not a model-load lock.
3. Legacy's `reloads` serializes its own per-screen `refresh()` only (`js/rivalryLegacyV10.js:278`, `js/rivalryLegacyV10.js:286`). The exported `loadCareerModel` bypasses it. Settings (`js/settings.js:109`, `js/settings.js:115`) and Standings (`js/seasonFinalV10.js:284`, `js/seasonFinalV10.js:288`) have separate local guards, so they can overlap each other and the binders.
4. Every call increments `careerLoadSequence` (`js/rivalryLegacyV10.js:245`). Only the newest started call may publish the cache (`js/rivalryLegacyV10.js:273`), but both calls continue. Each can still return a model to its own caller (`js/rivalryLegacyV10.js:274`); Legacy's screen commit tests context, not that shared sequence (`js/rivalryLegacyV10.js:308`). The sequence is publication ordering, not request deduplication or one final destination commit.

**Suggested fix:** Put one in-flight promise per account/manager/pair/marker generation in the common model service, including requested rivalry projections. All consumers join it. Return/await destination preparation from open functions, and discard/cancel superseded navigation commits. If data is invalidated during preparation, settle the latest required generation under the same loading cover. Preserve the existing private context boundaries and read-only services.

### B6 — P2: a real history/terminal update during the first flight queues a second full-screen boot

**Player steps:** Open Legacy/History or Rivalry Statistics as an ordinary season/Showdown completion is still settling, including when the other manager completes the shared step. Remain on the screen while convergence/closure finishes.

**Exact sequence and locations:**

1. History convergence actually emits `career-mode-shared-history-convergence-state-change` with the accepted revision (`js/productionSharedHistoryConvergence.js:102`); Terminal Close emits its phase event (`js/productionSharedTerminalClose.js:154`). These are real runtime publishers.
2. The binder compares a phase/status/context/revision signature and calls `refresh(...,true)` for mounted routes (`js/rivalryLegacyV10.js:195`, `js/rivalryLegacyV10.js:197`, `js/rivalryLegacyV10.js:201`). A changed event during a flight sets `dirty`, without replacing or updating that flight (`js/rivalryLegacyV10.js:286`).
3. The first load still commits its result immediately (`js/rivalryLegacyV10.js:309`), even if dirty. The trailing timer starts another read (`js/rivalryLegacyV10.js:313`, `js/rivalryLegacyV10.js:322`) and that result replaces the stage again. It may contain identical final data, since the first provider read can already include the accepted update. There is no final-model equality check.
4. Rivalry's live branch creates a new wrapper object on each refresh (`js/rivalryLegacyV10.js:303`), so object-identity comparison in `vsShow()` cannot suppress a semantically identical result. Both renderers rebuild the host and restart entrances (`js/rivalryLegacyV10.js:109`, `js/rivalryLegacyV10.js:120`). The browser revision-event probe recorded `loading → ready → ready` and two reads.

**Suggested fix:** While preparing the first visible frame, incorporate/coalesce the latest required revision before committing. A dirty request must not publish an intermediate visible result. After initial reveal, compare authoritative data revisions/content and update the mounted view without destroying/re-entering it. Do not remove the legitimate convergence/closure refresh; remove the obsolete/unchanged intermediate commit.

### B7 — P2: late identity/account readiness is neither awaited nor reliably observed

**Player steps:** Browse a career screen before signing in, then use the sign-in chip; or open it while session/account initialization is still finishing. For an in-flight variant, let the signed-in account/manager context change before its career read returns.

**Exact sequence and locations:**

1. Model loading samples account state and immediately chooses unavailable if it is not yet connected (`js/rivalryLegacyV10.js:248`, `js/rivalryLegacyV10.js:250`); it does not await account/identity initialization. The Statistics/Trophy mount decides whether to start loading from the identity snapshot (`js/careerScreensV10.js:1642`). B1 can already have revealed unavailable/loading by then.
2. The binders register `career-mode-online-identity-change` / `career-mode-connected-account-state-change` handlers (`js/rivalryLegacyV10.js:195`; Statistics/Trophy listens only to the identity event at `js/careerScreensV10.js:1602`). **The production identity/account setters do not emit those events:** `setOnlineIdentityState()` notifies its subscriber set (`js/onlinePlayerIdentity.js:9`, subscribe at `js/onlinePlayerIdentity.js:106`); `sparkConnectedSetState()` does likewise (`js/sparkConnectedAccount.js:46`, subscribe at `js/sparkConnectedAccount.js:278`). Repository search found listeners but no production publishers/bridge for these two window event names. The career binders do not subscribe to those APIs.
3. Thus normal late sign-in can leave the first unavailable frame until another trigger/reopen starts a new draw. For a changed context during Legacy's flight, both cache and screen result are rejected (`js/rivalryLegacyV10.js:273`, `js/rivalryLegacyV10.js:308`), but without the missing event there is no `dirty` replacement load. The browser account-change probe remained on loading after its provider result returned.
4. If those window events are explicitly delivered, the registered handlers do cause reload/redraw after the first frame; during Statistics/Trophy's in-flight read they can start overlapping loads (B5), while Legacy queues a trailing one (B6). This is the listener behavior, **not evidence that normal sign-in currently emits those events**. Tests that manually dispatch them do not prove the production wiring.

**Suggested fix:** Await settled authentication/account registration as part of the initial preparation. Subscribe to the actual identity/account providers (or add one explicit event bridge), deduplicate meaningful context changes, immediately invalidate obsolete account generations, and feed the replacement prepare operation into the same loading cover. A settled signed-out screen may be final; transient connecting/bootstrapping must not be revealed as a final unavailable career. State changes arriving before mount must also be retained.

### B8 — P2: Career Statistics starts its entrance after the screen can already be visible

**Player steps:** Open Career Statistics on a fresh/slow font load with normal motion enabled. This can happen independently of duplicate career reads and can amplify every remount above.

**Exact sequence and locations:**

1. `v10Render()` calls `ShowdownCareerStatisticsBoot()` and returns immediately (`js/careerScreensV10.js:1554`, `js/careerScreensV10.js:1561`). The boot function starts a promise chain without returning it (`visual-assets/v10_1/career-statistics/career-statistics.js:177`).
2. That chain mounts and populates the table, then awaits `document.fonts.ready`, and only afterward calls `sdEnter(stage)` (`visual-assets/v10_1/career-statistics/career-statistics.js:177`). `vsShow()` meanwhile awaits image/plate decoding only and releases pending (`js/v10Screens.js:377`, `js/v10Screens.js:379`).
3. With fonts still pending but images ready, the populated panels are visible. Font completion then adds `sd-motion-ready` and removes entered/animating classes (`visual-assets/v10_1/shared/motion.js:101`, `visual-assets/v10_1/shared/motion.js:106`). The CSS hides panels in that state (`visual-assets/v10_1/shared/motion.css:39`) until their delayed entrance runs. This is literally panels visible, then absent, then visible again without new data.
4. In the real-renderer experiment the table had three rows and no pending flag both before and after releasing font readiness; its computed opacity changed from `1` to `0` and then recovered through the entrance animation.

**Suggested fix:** Return an explicit renderer-ready promise and await it before revealing. Resolve fonts before the single initial render/entrance, initialize motion state under the loading cover, and ensure later data commits do not restart entrance/count-up choreography. The loader's mount contract must await that readiness, not merely call a boot function returning `undefined`.

## Paths checked and found fine for this audit

- **No model-change/provider-reload loop in Legacy:** `js/rivalryLegacyV10.js:195` does not subscribe to `career-mode-online-career-model-change`. The consumer at `js/careerScreensV10.js:1613` calls show/invalidate, not `loadCareerModel`. B2 is duplicate rendering, not an infinite read loop.
- **Legacy refresh already has useful single-flight/throttling:** `js/rivalryLegacyV10.js:286`, `js/rivalryLegacyV10.js:288`, `js/rivalryLegacyV10.js:319`. Unchanged signatures are ignored (`js/rivalryLegacyV10.js:200`) and a hidden route's queued reload is dropped (`js/rivalryLegacyV10.js:322`). Those protections do not provide final-data readiness or common-loader deduplication.
- **Marker memoization/filtering:** `js/careerStartMarker.js:115` shares an in-flight marker read, a settled real marker remains cached, `recheckNone` is deliberate, and an ordinary first successful read without a prior failure/none does not dispatch CHANGE_EVENT (`js/careerStartMarker.js:123`). The reveal scan is awaited before scope resolution (`js/rivalryLegacyV10.js:227`). Do not “fix” the flash by showing test/unknown-scope data or disabling rechecks.
- **Cache isolation and late timeout cache protection:** the context includes account, manager, current/closed rivalry and marker epoch (`js/rivalryLegacyV10.js:76`); publication checks context, sequence, and flight liveness (`js/rivalryLegacyV10.js:273`, `js/rivalryLegacyV10.js:297`). These prevent stale cache publication, but do not automatically finish a replacement screen load.
- **Pure seam/model conversion:** `js/careerScreenSeam.js:48`, `js/careerScreenSeam.js:112`, `js/careerScreenSeam.js:133`, `js/rivalryLegacyV10.js:21`, `js/careerScreensV10.js:74` validate/convert supplied data; they do not launch provider reads. In normal play there is no online local-history fallback. Model-fed test routes were not counted as normal-play findings.
- **Closed-Showdown loader does not paint an optimistic cache frame:** `js/sparkClosedShowdownCareerLoader.js:26`, `js/sparkClosedShowdownCareerLoader.js:34`, `js/sparkClosedShowdownCareerLoader.js:43` assemble one result after awaited index/record reads. Its per-account terminal-record cache is data reuse, not a first UI draw; the problematic early draws occur in the binders above it.
- **Resource-load deduplication and same-frame show:** `js/v10Screens.js:168` shares screen resource loading, and `js/v10Screens.js:364` skips an intact same-object frame. `js/v10Screens.js:353` protects an active decode from a same-frame show. These checks are defeated by unconditional invalidate/new model objects; two calls to show alone are not automatically two boots.
- **Intentional player interactions:** History selection/paging and the season-history drawer (`visual-assets/v10_1/legacy/legacy.js:318`, `visual-assets/v10_1/legacy/legacy.js:540`), Trophy category selection (`visual-assets/v10_1/trophy-room/trophy-room.js:218`), and explicit retry are not spontaneous career reload findings. Legacy backup/restore/delete/reset paths were read but excluded from normal play.
- **Navigation tap guards:** `js/v10Screens.js:485` and `js/v10Screens.js:509` protect duplicate navigation taps. The findings reproduce without requiring a duplicate tap; asynchronous binder preparation currently outlives those route promises.

## Suggested acceptance checks for the fix

Use one navigation generation and a final-model revision/content fingerprint. Count full stage boots and record every animation frame of the loading cover and destination. A normal visit should have exactly one final destination boot/reveal, including empty and partial careers. Assert that no loaded panels disappear and no source-account content survives a generation change.

Cover cold and warm opens of all four career routes; Home/Back revisits; a valid `none → ready` marker discovered before and after mount; concurrent consumers; a real convergence/closure revision during preparation; sign-in/account readiness before and after the first frame; and fonts settling after images. Verify that unchanged cache publications do not remount, dirty first loads commit only their final required revision, and normal navigation joins shared in-flight reads. Keep test filtering, private scope, terminal-record caching, and legitimate live updates intact.
