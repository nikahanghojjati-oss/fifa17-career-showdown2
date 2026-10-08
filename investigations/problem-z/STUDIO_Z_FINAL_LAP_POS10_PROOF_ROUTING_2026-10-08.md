# Studio Z — Final-lap proof-routing and exact acceptance addendum
**2026-10-08 EDT · read-only source audit · no new product tests**

Companion (not replacement) to the [complete Codex-integrated one-file handoff](STUDIO_Z_CODEX_RETURN_INTEGRATED_SINGLE_HANDOFF_2026-10-08.md). Exact source reference `main=bc77a0b934c3d43279f27f73a72db21c2db2b4f2`, `qa/bug-olympiad=6fc04f6823115525eb7950f75576b82d5dc2cbfe`. Sources: `POS10_IMPACT_GRAPH.json`, `CURRENT_PRODUCT_TEST_MANIFEST.json`, `scripts/pos10-impact-router.mjs:94–106`, `AGENTS.md`, Codex result and previous Studio foundation.

## One operational finding that prevents under-testing

POS10 **fails closed** when a changed non-document path matches no `artifactRules`: `scripts/pos10-impact-router.mjs:106` returns `FULL_SEAL`. This is important because several current production code modules are not matched by the historic regex map. **Static predicted routing**, not an executed official router or permission to edit:

| Potential future changed file | Current artifact rule and expected proof floor |
|---|---|
| `js/showdown.js` | `core-runtime` -> `CORE_RUNTIME_RELEASE`, seven manifest tests indexed 11,12,55–59 plus `STATIC_SPARK` and `FULL_BROWSER` |
| `js/onlinePlayerIdentity.js` | Unclassified -> `FULL_SEAL` |
| `js/screens.js` | `core-runtime` -> core-release proof floor |
| `js/persistentNikDanielPair.js` | Unclassified -> `FULL_SEAL` |
| `js/transferSelector.js`, `data/transferOptions.js` | `transfer-inline` -> `CORE_RUNTIME_RELEASE` + `VISUAL_PRESENTATION` and `INLINE_TRANSFER` |
| `css/v10Transfer.css` | `visual-general` -> `VISUAL_PRESENTATION` / `VISUAL_BROWSER` but not necessarily `INLINE_TRANSFER` |
| `visual-assets/v10_1/tr2/slice-02-plate/plate.css`, `js/productionSharedTransferChallenge.js` | Unclassified -> `FULL_SEAL` |

The seven core-runtime manifest tests are `stability-contracts`, `static-app-release-contracts`, `release-shell-coherence-contracts`, `offline-hotfix-contracts`, `v13-offline-lifecycle-contracts`, `ci-orchestration-contracts`, and `final-release-hardening`. The exact candidate changed-file union, transitive consumers and **POS20/selected POS10 gates** must be evaluated by authorized Team G; POS20 may only increase proof. A small `showdown.js` change is preferable only **if genuinely sufficient** for correct idempotent loader readiness, retry/error behavior, and continuing protection; never distort the source patch merely to evade tests.

## Repair-readiness discriminator

**C:** unchanged baseline, deliberately held original `optionalModules.js`, equal-delayed unrelated-image control; observe loader, bootstrap latch, identity API/initialized, Home badge, containment style, computed legacy Settings visibility, online Continue capture vs legacy, later Settings retry, and **unsigned career creation denial**. Existing Chromium checked record shows only induced failure, not matched X-01 controls. X-01 still **UNEXECUTED/BLOCKED FOR TEAM G AUTHORIZATION**. The conditional popup/user-activation hypothesis remains separate until affected real device still fails with module loaded.

**B:** existing `tests/browser/two-manager-browser-journey.cjs` J9.1 is the critical current gap; imported 24-pass test stopped after **Daniel's** reload, before Nik's reload. J9.2 (new exact finite ACTIVE session, same rivalry/save and Season 2 of 3 / 9–3) and J9.3 (matching completed signings/verdicts) are **UNREACHED**. Do not confuse a new session with new Showdown, or infer data deletion from absent UI. No Restore/Apply, Forget, Start Over, reset or simulated owner saves.

**A:** require ambiguous country label vs unambiguous typed exact value; phone actual pointer/hit-target and owner tablet-landscape input visibility and signing-1 correctness. Existing general QA harness substitutes ArrowDown/Enter below 600px, so keyboard success is not touch success. If only CSS glue changes, explicitly require the pointer regression even if the automatic proof minimum chooses visual suites. Draft persistence remains OWNER DECISION REQUIRED.

**Safety outside automatic Studio scope:** two independently checked Restore Keep-current defects stay separate Candidate C blocker; source-supported unadjudicated public-guess hash leak / Rules/catalog mismatch need separate authorized security triage; checked stale season results need its own integrity owner. No production/provider changes or tests executed.

## Timebox

The owner requested GPT-only time-limited foundation work, not a permanently running system. Scheduled finite follow-ups: **19:00 ET** checkpoint and **20:00 ET** one-file completion/handoff. A static GPT-only Lens counts down in the user's browser and shows *manually verified* progress; it is not an active worker, live repo sync, or Claude product dependency. Until the scheduled tasks run, they remain pending. At 20:00 stop foundation research; Claude still must explicitly accept assignment and authorizations, with owner physical SSJR-2.1 evidence at the right stage. Zero patches/deployments/physical acceptance currently claimed.
