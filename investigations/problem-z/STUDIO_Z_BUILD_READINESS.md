# Studio Z — build-ready incident work packages (decision-only, no implementation)

**Authority status:** prepared by GPT-6 on 2026-10-08 for Team G Lead Claude Opus 5.5; **not an authorization** to modify game code, allocate workers, run real-account experiments, publish, deploy, reset data or close issue #426. Nik owns reserved decisions. Lead must confirm receipt/authority against the live repository and POS20.

**Scope limit:** exactly the three *reported problem clusters*. Activate a package only when its own discriminatory evidence warrants a change; completing every package is **not** an automatic requirement. Preserve the original failures and separately identified alternatives. One active implementation slice by default. No independent Studio platform or permanent workers.

## A. Verified source context versus incident attribution

| Evidence | What is presently known | What must not be inferred |
|---|---|---|
| Owner runs A/B/C, 2026-10-07 | Tablet transfer fit/signing error, apparent reset after Continue, missing sign-in and stuck Connecting/legacy UI | Original screenshot bytes, exact device revisions, provider deletions and common root cause were **not** obtained |
| Pinned main `bc77a0b934c3d43279f27f73a72db21c2db2b4f2` | Inspectable source with runtime `1.9.1-r62` | That this was actually loaded by both physical devices |
| PR #425, QA head `2b88d4ae727c20e4329ca7b74d92befd70872e2b` | **Imported** three journey sign-in gate failures plus reported optional-loader 0/400 ms contrast | Independent Studio replication, real Google popup/root cause, successful downstream journey |
| Fresh Studio source checks | `index.html` defers `showdown.js` before `optionalModules.js` and `app.js`; `showdown.js` sets startup latch first. Transfer `pstcBuildSignings` checks canonical IDs before `lockSignings`. Session code has memory/expiry context. | End-to-end causality on October 7 or physical tablet measurements |

**Exact source links** at pinned main:
- [index.html script order, ~lines 410–417](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/bc77a0b934c3d43279f27f73a72db21c2db2b4f2/index.html#L410-L417)
- [showdown.js bootstrap latch, ~lines 4–7](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/bc77a0b934c3d43279f27f73a72db21c2db2b4f2/js/showdown.js#L4-L7)
- [optionalModules.js loader, ~line 92](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/bc77a0b934c3d43279f27f73a72db21c2db2b4f2/js/optionalModules.js#L92)
- [onlinePlayerIdentity.js state/readiness and containment, ~lines 1–60](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/bc77a0b934c3d43279f27f73a72db21c2db2b4f2/js/onlinePlayerIdentity.js#L1-L60)
- [screens.js local Continue route, ~line 643](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/bc77a0b934c3d43279f27f73a72db21c2db2b4f2/js/screens.js#L643)
- [persistentNikDanielPair.js source of online Continue and binding, ~lines 223–225](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/bc77a0b934c3d43279f27f73a72db21c2db2b4f2/js/persistentNikDanielPair.js#L223-L225)
- [sparkRemoteJoining.js session status and expiry, ~lines 107–133](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/bc77a0b934c3d43279f27f73a72db21c2db2b4f2/js/sparkRemoteJoining.js#L107-L133)
- [productionSharedTransferChallenge.js canonical signing builder, ~lines 173 and 193–196](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/bc77a0b934c3d43279f27f73a72db21c2db2b4f2/js/productionSharedTransferChallenge.js#L193-L196)
- [Transfer submit path before provider, ~lines 268–276](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/bc77a0b934c3d43279f27f73a72db21c2db2b4f2/js/productionSharedTransferChallenge.js#L268-L276)

### Universal implementation contract

Every proposed patch must specify the exact cause it addresses, untouched authorities, minimal file changes, its pre-fix failing case, negative controls, required inherited contract/browser/provider tests, one independently reviewed exact-head proof, and affected genuine dual-device owner acceptance. No fix may retroactively claim the other clusters resolved. Do not solve by changing authentication persistence, weakening guard, showing gameplay before authoritative identity, resetting storage, or re-creating the career.

## B. Slice 1 — access, identity startup and correct feedback (FIRST)

**Enter only after:** X-01 independent control/intervention test confirms a reproducible startup race, *or* X-02 independently confirms a different access boundary. This is highest priority because absent sign-in blocks all later playtesting.

**Supported mechanism:** `initializeOnlinePlayerEntry` sets `window.__cmsOnlinePlayerEntryBootstrap` before the optional runtime loader is available; an early failure may remain latched and the error reporter may also be missing. PR #425 is supporting **imported** evidence, not a new verification.

**Smallest candidate repair strategies for lead to evaluate (not prescriptions):**
1. Make identity startup dependent on loader readiness using explicit one-time ordering; ensure missing loader cannot permanently mark bootstrap complete.
2. Implement a bounded retry/idempotent startup state machine, with a permanent fallback sign-in/error route if loader fails. If choosing this, prove no double initialization, bypass or stale identity callback.

**Accept only if:** unchanged-source X-01 fails under targeted delay (or correct alternative failing case); candidate recovery works for the same control; Home sign-in/status remains actionable; legacy Settings panels remain contained; Start/Continue cannot bypass identity gate; signed-in-but-bootstrap-not-ready state is distinguishable from signed-out; terminal error/pending behavior is bounded under precisely tested failure conditions; second manager remains isolated. The Connecting overlay in original Run C may require independent X-02 and cannot be assigned to H-03 by assumption.

**Proof:** pinned browser startup targeted-delay control, unrelated-delay control, repeat under candidate; `tests/browser/two-manager-browser-journey.cjs` J1.1 and required selected inherited checks; identity Settings surface test. Real popup/affected device later under approval; no provider state changes in investigation.

**Stop:** If X-01 falsifies H-03, do *not* patch this race merely to make the plan true. Examine X-02 only with a narrower discriminating oracle.

## C. Slice 2 — Continue Career and exact same-career recovery

**Enter only after:** synthetic X-04 authority and before/after canonical state demonstrate a wrong route or unsafe recovery. The reported user-visible restart alone does not prove save loss.

**Authority states to distinguish:** Firebase authenticated; Connected Account active; registered device; UID-bound manager role; provider pairLink and rivalry membership; canonical local save/profile binding; ephemeral private-session capability with exact ACTIVE, correct rivalry/account/device and future expiry. A renewed session capability **may be expected** after reload; permanent pair and existing career **must survive**.

**Smallest candidate strategies for lead:**
1. Repair selection/guard of the Continue route to rejoin the existing exact binding and require fresh private-session authorization without new pairing/setup.
2. Fix only the missing/mismatched local recovery path where documented, preserving Candidate C's exclusive destructive Apply and backups.

**X-04 minimum fixtures:** exact valid pair+save with active session; identical pair+save with expired session; absent page-memory session; wrong rivalry/account/device; existing provider pair with missing local canonical binding; unsigned or unpaired negative control. Snapshot/hashes of **synthetic** canonical local/provider state before/after. Distinguish blocked/reauthorize/new pair route and count writes. Preserve each manager's mandatory full-screen stage witnesses when peer progress is ahead. Never log capability contents.

**Accept only if:** both managers can Continue/reconnect into the same rivalry/career and committed history under valid authority; absent/expired capability prompts safe new session without violating provider restrictions; wrong-context fails closed; no unexplained reroll, repeated permanent pairing, deleting save, or silent identity reassignment.

**Safety review note:** current `persistentNikDanielPair.js` contains an error message around source line 205 suggesting deleting the current Showdown, and other recovery copy suggesting START OVER around line 241. These are **source messages, not approved repair instructions**. Review any affected error UX specifically; do not treat destructive suggestions as a default user action or proof that deletion is required.

## D. Slice 3 — tablet transfers, canonical input and replay

**Enter only after:** X-05 proves a client canonical-ID mismatch or X-06 demonstrates measured unreachable controls. If both occur, fix each root cause separately inside one small transfer package.

**X-05 matrix:** through actual selector interaction, compare (a) fully valid visible name, league, nationality plus canonical IDs, (b) identical visible text with missing league ID, (c) missing nationality ID, (d) partial row, (e) fully blank row. Spy on `lockSignings`: client rejection must be recorded as **zero provider calls**. Direct test dataset injection alone cannot prove visual selector behavior. Confirm field-level actionable errors and rerender invariants.

**X-06 matrix:** portrait/landscape synthetic widths with exact reported actual tablet viewport only when measured; open software keyboard/visual viewport where browser actually supports it. Record control bounding rectangles, viewport scroll extents, focus/scroll-to-control, zoom, sticky CTA and overlay conditions. An emulator viewport is NOT evidence that the original tablet keyboard worked. Never invent actual tablet model/browser.

**X-07 conditional:** draft versus locked provider data after reload, which role owns each secret, committed provider state and per-manager replay witness; immutable snapshots, zero replay writes and no leak of rival private inputs.

**Accept only if:** every required field and submit action is discoverable/reachable at measured affected conditions; canonical selector IDs survive actual interaction; valid signing commits exactly once; invalid entries say precisely what to correct; interrupted committed progress is recoverable; no unauthorized rival data exposure.

## E. Release/acceptance matrix (design prepared, not executed)

| Gate | Evidence owner | Minimum proof to attach before calling resolved |
|---|---|---|
| Root-cause discrimination | Investigator | Exact source & fixture hashes, intervention/negative controls, alternative explanation and falsifier |
| Implementation permission | Team G Lead with applicable Nik reserved decisions | Explicit approved limited branch/files/tests; no implicit permission from this packet or scheduled 8 PM |
| Candidate integrity | Implementer | Exact-head changed-path diff, tests and regression results, zero forbidden config/storage/provider changes |
| Independent review | Different authorized verifier | Re-run/inspect chosen controls, evidence refs, security/rollback/no-op assessment; no self-awarded verification |
| Publication | Team G under POS20/POS10 | Required current exact-head checks, reviews, expected-head merge protection, applicable Rules/deployment authority |
| Genuine acceptance | Nik and Daniel, independently | Both identity ready, same pair+career and committed history after interruption, measured tablet signing use and each required canonical screen, current SSJR-2.1/MDP rules |
| Closure | Team G Lead and Nik | Verified or accepted-limitation decision linked to #426; exact residual debt, retirement of Studio task/Lens, final single-file handoff |

**Do not manufacture physical proof or SSJR/MDP credit** from source, mocks, CI, emulators, screenshots of synthetic test runs, merges or publication alone. Higher POS20/POS10 proof gates win over this minimum.

## F. No-go triggers

A proposed remedy is blocked if it requires: Firebase billing/Blaze, Cloud Run/Functions, App Check enforcement change, durable Firestore browser persistence, added OAuth scopes, non-popup auth, public identity/discovery, additional production managers, authority bypass, publishing private identifiers, mutating real providers as a read, routine storage clear, deleting canonical saves, implicit re-pairing, persisting raw session capability, remote-to-local destructive Apply outside Candidate C, relaxing two-manager screen witness, modifying unrelated Factory G application behavior, or skipping exact-head review/publication gates.

## F.1. Precise source-mapped implementation shelf — review before coding (NO CHECKS EXECUTED)

This is **preparation, not implementation or test credit**. The following findings are based on directly reading exact pinned `main` source, not inferring physical state. A Team G-approved implementer may use these as the starting code-review map after independent browser X-01. All names/lines below are **pinned**, not assumed live at takeover.

### Startup: single function and loader sequencing, no large refactor

- [`index.html` lines 410–416](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/bc77a0b934c3d43279f27f73a72db21c2db2b4f2/index.html#L410-L416) has `defer` scripts in the order storage → showdown → scoring → screens → menu → optionalModules → app; `showdown.js` line 21 calls the entry initializer as the file executes.
- [`showdown.js` line 6](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/bc77a0b934c3d43279f27f73a72db21c2db2b4f2/js/showdown.js#L6) sets `__cmsOnlinePlayerEntryBootstrap` **before** its eventual async loader use. When `document.readyState !== "loading"`, it schedules `setTimeout(0)`; when `loading`, it registers `DOMContentLoaded`. **A deferred script is often executing at readyState `interactive`; don't claim the ordering always races.** A delayed subsequent `optionalModules.js` can make this window relevant. The synthetic T-02-MODEL exercised this ordering only with stand-ins.
- [`optionalModules.js` `loadRuntimeScript`](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/bc77a0b934c3d43279f27f73a72db21c2db2b4f2/js/optionalModules.js#L90) manages promise caching, timeout/failure, and expected API readiness; the implementer must **not** bypass this module lifecycle or create a second independent loader. A loader failure after it executes has a different recovery path than a loader that was never defined.
- [`onlinePlayerIdentity.js` `initializeOnlineIdentity` / `signInOnlineIdentity`](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/bc77a0b934c3d43279f27f73a72db21c2db2b4f2/js/onlinePlayerIdentity.js) distinguishes signed-out, device-error, choose-manager, ready, error and signing-in. Do not conflate stuck `Opening Google sign-in…` with missing loader; it can also be downstream signed-in/provider flow.
- **Minimal repair contract, if H-03 independently confirmed:** make startup wait for the loader's *actual* readiness (for example bounded scheduled initialization after required modules are present) **without permanently latching a failed attempt**; preserve the module's own retry/timeout semantics. Show a recoverable explicit error if identity startup cannot complete, keep the sign-in gate enforced and the UI on a safe route. Verify exactly one successful initialization, no rapid duplicate listeners, and no hidden sign-in overlay. This is a **candidate design only**, not a preapproval of a code diff.

### Continue: two visible handlers and their different authority

- [`screens.js` `initializeScreens` ~line 770](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/bc77a0b934c3d43279f27f73a72db21c2db2b4f2/js/screens.js#L768-L785) binds the `continueCareer` button to legacy `resumeSavedShowdown`. That routine reads `loadSavedShowdown()`; if the local save is absent, it navigates to `createShowdown`. **This is a source-observed local-route behavior, not proof that the user's save disappeared.**
- [`onlinePlayerIdentity.js` capture-phase `click` listener near line 51](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/bc77a0b934c3d43279f27f73a72db21c2db2b4f2/js/onlinePlayerIdentity.js#L51) normally intercepts `#continueCareer` with `preventDefault` and `stopImmediatePropagation` to call `openCanonicalCareerContinue`. It checks published identity first. **If the identity runtime module/listener was never installed, the old click handler may remain.** This creates a *shared hypothesis* for user-visible Run B and C, not one established common root cause.
- The online handler [`openCanonicalCareerContinue`](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/bc77a0b934c3d43279f27f73a72db21c2db2b4f2/js/onlinePlayerIdentity.js) resolves persistent pairing and delegates to `pair.continuePair()` only if an active rivalry is present; the [pair continuation code](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/bc77a0b934c3d43279f27f73a72db21c2db2b4f2/js/persistentNikDanielPair.js#L223-L225) requires exact saved provider-bound local recovery data. The separate [`screens.js` canonical route](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/bc77a0b934c3d43279f27f73a72db21c2db2b4f2/js/screens.js#L266) may correctly show league/club selection **if those stages were actually uncommitted**.
- **Minimal repair contract, only if a fixture proves the bug:** preserve the online handler's capture priority and fail-closed startup. Where identity isn't ready, never allow the local legacy Continue binding to masquerade as an authorized pair resume; don't delete the local handler unless its supported offline/legacy work is first identified. An online Continue must restore the same durable pair/save and verified staged progress or safely explain the exact missing binding; it may request a fresh private session but not start a new permanent rivalry. Verify provider/local writes remain zero for ordinary resume.

### Transfers: visible labels are not canonical values

- [`productionSharedTransferChallenge.js` `pstcBuildSignings` ~line 193](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/bc77a0b934c3d43279f27f73a72db21c2db2b4f2/js/productionSharedTransferChallenge.js#L193-L199) demands player name, `pstcCanonical(league)` and `pstcCanonical(nationality)` for a touched signing row. If either ID is missing, it throws the exact `Complete signing N with player name, previous league and nationality` user-observed message **before provider lock**.
- [`transferSelector.js` `getTransferSelectorCanonicalValue`](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/bc77a0b934c3d43279f27f73a72db21c2db2b4f2/js/transferSelector.js) reads `dataset.canonicalId`, not the text label. `setTransferSelectorValue` clears that ID when the stored value cannot resolve to a valid FIFA 17 option. Therefore visible completed-looking text can still fail canonical validation — a **discriminating mechanism to check later, not physical proof**.
- **Minimal repair contract, only after actual selector-interaction reproduction:** correct how a legitimate selection commits its canonical ID and report the specific missing field. Do **not** silently accept typed free-text as a valid canonical ID, loosen provider constraints, or auto-commit partial entries. Independently check viewport/keyboard reachability because a layout defect may be separate from selector state.

### Research-only instructions for the receiving lead

**All test execution intentionally deferred to Claude/Team G.** Proposed checks remain in sections B–E and `NEXT_RESEARCH_SESSION.md`. Preserve the order: (1) real browser X-01 discriminator and negative control; (2) authorized minimal repair only if confirmed; (3) source-revision-matched local/provider continuation fixtures, then tablet selector/viewport tests as indicated by new evidence; (4) reviewer and genuinely independent dual-device owner acceptance. Never run actual signed-in/auth/session operations as 'harmless reads'; `initialize`, `refresh`, `attach` and retry can write remote or local state.


## F.2. Tablet selector and stylesheet discriminators — diagnosis, not a CSS rewrite

**New pinned-source detail:** The transfer-specific stylesheet is [css/transfer.css](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/bc77a0b934c3d43279f27f73a72db21c2db2b4f2/css/transfer.css) (blob 1c1f09b10161e9556ced28c475577df66d0f86b9), loaded by js/optionalModules.js. Do not assume the responsive selector code lives mainly in css/app.css.

- Width 900 px or less: signing row's .transferCombobox wrapper is explicitly set to the second CSS grid column.
- Width 760 px or less: the suggestion list changes to position fixed, 10 px left and right, 12 px from bottom, with maximum height 48vh. Compare keyboard/visual viewport and hit-testing.
- Width 480 px or less: suggestion options have minimum height 48 px.
- Desktop width above 900 and height 800 or less: compact phase navigation and shorter suggestion list.

**Correct canonical-value interpretation:** In js/transferSelector.js, handleTransferSelectorInput clears the previous canonical ID but *repopulates it if the entered text exactly normalizes to a resolved FIFA 17 option label*. chooseTransferSelectorOption also sets that ID; getTransferSelectorCanonicalValue returns dataset.canonicalId. Therefore the code already supports some exactly typed valid labels. In tests/browser/two-manager-browser-journey.cjs, fillTransferCombo literally calls input.fill(value), then waits for the canonical ID. **Do not claim typed text is always invalid**, or change validation before proving a specific mismatch.

**Targeted test oracle, reserved for Claude:** With unchanged approved fixture, compare valid exact typed labels, list-click selection, partial labels and deliberately invalid labels; record only presence/absence of canonical ID, not private values. Use synthetic breakpoint probes at 759/760/761 and 899/900/901 px; additionally record the actual consenting tablet's measured dimensions, visualViewport offset/height with keyboard open, focus, dropdown/CTA rectangles, horizontal and vertical scrolling, and touch hit-testing. Synthetic dimensions do not establish real device behavior. A missing ID should reject before lockSignings with **zero provider writes**. Valid exact ID should lock only once after explicitly authorized fixture. Preserve per-manager private data and historical phase replay.

## F.3. Existing Factory G test lanes — do not build duplicate test infrastructure

These source files/scripts were inspected at pinned main bc77a0b934c3d43279f27f73a72db21c2db2b4f2; **none was executed** in this foundation session. Use the current POS20 impact router and inherited POS10 proof floor to select sufficient tests. Read live versions on Claude's takeover.

| Concern | Existing source/script | Already covers / not a substitute for |
|---|---|---|
| X-01 loader readiness | [Unexecuted research probe](tools/x01-local-browser-probe.cjs) and [single next action](NEXT_RESEARCH_SESSION.md) | Loopback-only three conditions, source hashes, external network blocked; **cannot** verify OAuth/Firebase; app.js control is downstream defer timing, not an independent unrelated asset |
| Two-manager identity J1.1 | tests/browser/two-manager-browser-journey.cjs | Mock/emulator Sign In With Google → Daniel/Nik identities and badges; requires explicitly controlled Auth/Firestore emulator writes |
| Canonical typed transfer entries | same two-manager journey, helper fillTransferCombo | Types exact labels and waits for dataset.canonicalId, then locks and checks rival privacy; **does not** prove original tablet interaction |
| Online Continue/pair recovery | npm run test:persistent-pair-routing | Synthetic active/recovery state and contained Settings; **does not** prove original local/provider save survived |
| Exact shared reconnection | npm run test:ssjr:journey-reconnect | Synthetic authoritative league, clubs and season progression; **does not** replace real two-device continuity |
| Replay without writes | tests/browser/shared-transfer-challenge-replay-audit.cjs | Phase witness replay; asserts zero provider mutation and no extra replay reads |
| Contained Settings | tests/browser/connected-account-settings-audit.cjs; npm run test:settings-layout | Internal panels hidden / Settings accessibility; not tablet transfers |
| General Home sizes | npm run test:home-visual | Home regression viewports; not a physical transfer-keyboard test |
| Required physical journey evidence | npm run test:ssjr:physical-journey; npm run test:ssjr:physical-journey:browser; active SSJR2_PHYSICAL_RUN_GUIDE.md | Recorder/contracts only; real dual-device proof and Nik's owner-attested SSJR-2.1 credit remain separate |

The full emulator journey's source header gives this operator command; it must be run **only** by authorized Team G in an isolated local checkout and test-only emulator project, never against live Firebase:

    npx --yes firebase-tools@15.28.1 emulators:exec --config tests/browser/support/firebase.browser-journey.json --only auth,firestore --project demo-cms-browser-journey "node tests/browser/two-manager-browser-journey.cjs"

The journey itself performs emulator Rules updates and test-document writes, so this is NOT read-only. Its external downloads and tooling readiness must be approved. Never weaken J1.1 to artificially reach later checks. If a correctly evidenced startup repair also resolves Continue, avoid redundant patches but separately verify the two original user-visible symptoms. Check transfer validity and layout independently before authorizing any styling change.


## G. One active next action and lead decision

**Selected:** independently perform **Z-003 / X-01** on unchanged pinned source with three matched response timing conditions. Its gate is an attributable comparison or the exact blocker. Then the Team G Lead decides whether to authorize the small startup repair or select another single discriminating boundary. Z-002 public/device revision provenance is a *separate historical attribution debt*, not a reason to postpone useful pinned-source experiments.

**Lens:** not part of build. On-demand read-only checkpoint from ledger is sufficient; no plugin, background automation, polling, backend or second state database.

**Continuity:** every session exports exactly **one self-contained transferable Markdown file** holding new evidence and any unpublished work, fixed SHAs, decisions, unresolved contradictions, permissions, and only one next assignment. Close Studio Z once accepted rather than maintaining a lab.
