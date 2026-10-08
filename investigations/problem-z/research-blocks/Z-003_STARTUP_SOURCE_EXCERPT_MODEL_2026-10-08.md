# Z-003 / X-01 — source-excerpt event-order model (partial, NOT full-app reproduction)

**Date:** 2026-10-08 EDT. **Question:** does the startup code latch before the loader exists and then fail to automatically recover? **Status:** `in-progress`, declared X-01 browser completion gate **NOT MET**. **Engineering authorization:** none. **Production action:** none.

## Sources and pinning

- Pinned application main: `bc77a0b934c3d43279f27f73a72db21c2db2b4f2` (runtime `1.9.1-r62`).
- Direct exact function bodies copied **verbatim** for the model from [`js/showdown.js` lines 4 and 6](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/bc77a0b934c3d43279f27f73a72db21c2db2b4f2/js/showdown.js#L4-L6). The model also invokes `initializeOnlinePlayerEntry()` as the pinned file does at line 21.
- Script order checked at [`index.html` lines 410–416](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/bc77a0b934c3d43279f27f73a72db21c2db2b4f2/index.html#L410-L416): `showdown.js` precedes `optionalModules.js` and `app.js`.
- Existing **imported** [PR #425](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/425) reported three identity-entry journey failures and its own 0/400ms browser contrast. That test lineage has **not** been rerun independently here.
- This new observation is **T-02-MODEL**, a deterministic Node VM simulation of the exact two pinned startup functions. It is not a full app, a real browser/DOM/deferred-download execution, a physical reproduction, or a proof that October 7 failures had this cause.

## Actions actually attempted

1. Checked availability of repository/source and tools. A full repo clone was **unavailable** because this isolated container could not resolve github.com. Pinned source was read safely through the connected GitHub read tools instead.
2. Constructed a disposable Playwright/Chromium synthetic page with the same two copied source functions, three asset-delay cases and stand-in loader/identity UI. The Chromium navigation attempt failed before any UI experiment with `net::ERR_BLOCKED_BY_ADMINISTRATOR` even for an isolated synthetic/local origin. A second basic navigation probe also failed, including a data URL. **No Chromium X-01 result exists from these attempts.** Neither failure implies anything about the game.
3. Ran a deterministic event-order model in Node `v22.16.0` using `vm.runInNewContext`: an `interactive` document and captured `setTimeout(0)`, then three manually controlled loader-availability schedules. The real function bodies were unchanged; the loader, document, identity state and reporter were **stand-ins**. No network, real Google popup or Firebase was used.
4. No application, official test, configuration, provider or deployment file was changed. The model source file and output remained in a disposable local research directory; exact recorded content digests appear below.

## Observations — deterministic model, not product proof

| Controlled schedule | Loader invoked | Latch true | Identity available after callback | Repeating bootstrap without reset | Errors after reporter later appears |
|---|---:|---|---|---|---|
| Loader ready **before** startup timer | 1 | yes | yes | already initialized | none |
| Startup timer runs **before** loader; loader appears later | 0 | yes | **no** | **still absent** | none, since original error occurred before reporter was available |
| Unrelated latency ahead of startup; loader ready by callback | 1 | yes | yes | already initialized | none |

Console:
```text
{"first":{"case":"loader available before scheduled start","loaderUsed":1,"bootstrapFlag":true,"identityLoaded":true,"reporterReady":false,"errors":[]},"afterRepeatedBootstrap":{"loaderUsed":1,"identityLoaded":true}}
{"first":{"case":"loader appears only after scheduled start","loaderUsed":0,"bootstrapFlag":true,"identityLoaded":false,"reporterReady":true,"errors":[]},"afterRepeatedBootstrap":{"loaderUsed":0,"identityLoaded":false}}
{"first":{"case":"unrelated latency before bootstrap, loader available at start","loaderUsed":1,"bootstrapFlag":true,"identityLoaded":true,"reporterReady":false,"errors":[]},"afterRepeatedBootstrap":{"loaderUsed":1,"identityLoaded":true}}
PASS: deterministic source-excerpt ordering discriminator; NOT independent full-app browser X-01 reproduction
```

**Reproducibility identifiers:** local runner `x01_node_order_model.cjs` SHA-256 `c2fb27076638c9bd2458b70239f72a3e6fccea4fd8753d0450add6685e7497ff`; emitted console file `x01_node_result.txt` SHA-256 `19270bb15ce54c44ed9c04bb1a5fa7956028bc915c4f77cd9774e9660d927d17`; Node `v22.16.0`. The local runner is preserved in the owner-facing session export, not assumed to be present on GitHub. The scope of the digest is local research material, not a hash of application source. `showdown.js` at pinned main had Git blob SHA `b1a09367635c0d9a5b72db8e4e312f83ba6ed26f` at source read time.

## Causal interpretation and honest limitations

- **Supported within the synthetic event schedule:** the actual pinned startup function sets the bootstrap latch before checking loader availability; if the timer callback reaches the absent-loader branch, a rejection is caught, the latch persists, and a call to `initializeOnlinePlayerEntry()` later returns early without retrying. A reporter installed after that failure has no retained error event in this model.
- **Not independently established:** that the real browser/deferred script order reaches this timing on unchanged complete source; whether an unrelated-asset delay control behaves identically in the real application; whether Settings or another interaction later calls `ensureOnlinePlayerIdentitySurface`; whether any specific October 7 device reached this schedule; whether the visible Connecting overlay belongs to the same causal branch.
- **Alternative mechanisms remain:** H-02 auth/connected bootstrap state collapse, H-06 mixed revision, H-10 stale async completion, and H-11 provider/network/config outcomes. The physical Connecting overlay still prevents a one-cause claim that the identity module was absent throughout the entire third run.
- **Scope-of-test classification:** T-02-MODEL (controlled deterministic model). It does not satisfy the declared S+T full source **real browser** comparison with 400ms targeted load and matched unrelated-delay control. The experiment is in-progress/blocked on a working permitted browser/full source fixture, **not research-complete** or independently verified.

## Next smallest actual task

Team G or an authorized researcher with a functioning isolated browser checkout should execute **Z-003/X-01 proper**: current [NEXT_RESEARCH_SESSION.md](../NEXT_RESEARCH_SESSION.md), unchanged pinned source, real browser, three matched contexts (normal, 400ms only `optionalModules.js`, 400ms unrelated asset), no Google account or production writes. Inspect J1.1 fixture carefully. Record exact timing, badge/identity API/guard, bootstrap flag, errors and route. If the race is independently reproduced, prepare Team G's bounded implementation decision and required regression gates; otherwise reframe the alternate access boundary. **Do not change product code before separate authorization.**

## Safety and decision disposition

No extra manager, real OAuth, pairing, session, Firebase service, save, production telemetry or billing was involved. Existing POS20/POS10/Firebase Spark/private authority unchanged. Neither Studio leadership acceptance nor application engineering permission was inferred. This report is a narrow new piece of evidence to help Claude decide how to verify, not a license to patch.
