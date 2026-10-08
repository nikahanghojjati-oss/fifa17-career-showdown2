# Studio Z — selected next experiment and precise blocker

**Date:** 2026-10-08 EDT · **Status:** `Z-003 / X-01` in progress, **completion gate not met** · **Implementation approval:** none.

**Start here:** [Finite foundation](STUDIO_Z_FOUNDATION_AND_LEAD_HANDOFF_2026-10-08.md) → [build decision/acceptance packets](STUDIO_Z_BUILD_READINESS.md) → [partial source-excerpt model](research-blocks/Z-003_STARTUP_SOURCE_EXCERPT_MODEL_2026-10-08.md) → active POS20/AGENTS/guards.

## What was actually established in the most recent research session

Pinned main `bc77a0b934c3d43279f27f73a72db21c2db2b4f2` runs `showdown.js` before `optionalModules.js` and `app.js`. The excerpted `ensureOnlinePlayerIdentitySurface` and `initializeOnlinePlayerEntry` functions were run unchanged in a local deterministic Node VM with controlled stand-ins. When the startup timer ran before loader readiness, identity remained absent and a later repeated invocation did not retry because the latch had already been set. Ready-loader and unrelated-latency controls loaded the modeled identity. **This is T-02-MODEL, not proof of real browser ordering or the October 7 device incident.**

Full Chromium X-01 could not run locally: all synthetic/local browser navigations failed at the environment boundary with `net::ERR_BLOCKED_BY_ADMINISTRATOR`; direct git clone failed DNS. **No new physical/product browser test has been passed and no root cause is verified.** Existing PR #425 remains imported support only. The model runner/log digests and exact limitations are in the new report.

## Claude-ready local probe (PREPARED, NOT EXECUTED)

A small zero-auth [research-only browser probe](tools/x01-local-browser-probe.cjs) is staged under the **investigation directory**, not in the production game or official test suite. It uses the existing test server and Chromium resolver, refuses non-loopback URLs, blocks **all** outbound non-local requests, isolates three new disposable browser contexts, and compares baseline vs a 400ms delay of `js/optionalModules.js` vs the same delay to `js/app.js` (a script sequenced **after** optionalModules). It also refuses to start unless five pinned game files have the exact expected Git blob digests. It writes coarse identity state, badge existence, script timing and controlled request counts to a local temporary JSON file, not user identities or codes. This is a **prepared unexecuted test artifact** and must not be credited as evidence or a passed test.

After accepting actual Team G research execution responsibility, Claude may run in an isolated pinned-source checkout with current Node `>=24` and installed devDependencies:

```bash
# Terminal A, disposable local checkout, no production credentials:
npm run serve:test

# Terminal B:
CMS_CHROMIUM_MULTI_CONTEXT=1 node investigations/problem-z/tools/x01-local-browser-probe.cjs
```

The script default output goes to OS temp, prefixed `studio-z-x01-`. Environment variable `CMS_Z_X01_OUTPUT` can override. If local navigation is still blocked, record the exact environment blocker and **stop**; do not route around administrator policy. If the source pin fails, re-resolve current authority/source and prepare a new explicitly versioned fixture before running. Do not force source hashes.

**Limits:** because Firebase and Google resources are blocked, the probe can discriminate *startup module/identity surface readiness*, **not** Google popup success, Firebase state, real sign-in, or physical Run C. Failure to sign in is expected under this isolation and is not a product defect. The 400ms app-script control is a downstream deferred-script timing control, not a perfect asset-load control; record this limitation. If deeper sign-in flow is justified, separately use the repo's existing `tests/browser/two-manager-browser-journey.cjs` emulator-only fixture under Team G's normal test approval and exact-head POS20 gates. That fixture can perform emulator writes and must not be treated as a pure read. Do not point it at production.

**Operator proof ledger:** exact Git HEAD, five verified blob SHAs, command, environment, case reports, negative control, failure observations, fixture diff/no product diff, external request blocking, and a separate reviewer. Do not award a browser result based only on the script existing or command being documented.


## The single next task

Independently test H-03 with a **permitted isolated full product checkout and browser harness** against pinned unmodified main:

1. Resolve live repo/GitHub branch and read `AGENTS.md`, guards, POS20/POS10, imported PR #425 fixture, the model result and its limitations. Do not treat report duplication as independent execution.
2. Use fresh disposable browser contexts, no real Google sign-in, no production service/provider mutation, no application source edits and no manufactured passing tests.
3. Compare ordinary startup, **400 ms delay only to `js/optionalModules.js`**, and an equally delayed **unrelated asset** with the same source/fixtures and matched controls. Confirm environment/race conditions rather than assuming an injected stub is identical to production.
4. Capture clocked `document.readyState`, `__cmsOnlinePlayerEntryBootstrap`, loader/reporter/identity APIs, Home badge/sign-in overlay, Start route, page errors, exact source/relevant fixture hashes, commands and artifacts. A later Settings-triggered identity load is a separate chronology, not automatic startup recovery.
5. If the delayed loader alone prevents sign-in after its arrival and controls recover, submit a **cause-limited repair authorization question** to Team G Lead. If not, mark H-03 as not reproduced in that environment and narrow the next auth/runtime alternative. After two nondiscriminating experiments with unchanged evidence, stop and reframe.

**Completion:** attributable real-browser matched comparison or a precise new blocker. A prior synthetic event-order model is useful support, but **does not close Z-003**, receive independent review credit, or authorize a patch.

**Session end:** one self-contained portable file with this outcome, exact refs, actual evidence/code changes, limitations, permission state and **one next assignment**. Keep research-only commits under `investigations/problem-z/` until Team G authorizes a separate implementation path.

**Leadership:** planned 8 PM EDT October 8 handoff to Claude Opus 5.5 in Factory G. Actual receipt, acknowledgment, authority, engineering permission, release and acceptance are separately evidenced; none is automatic.
