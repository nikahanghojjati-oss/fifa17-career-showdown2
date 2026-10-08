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

## G. One active next action and lead decision

**Selected:** independently perform **Z-003 / X-01** on unchanged pinned source with three matched response timing conditions. Its gate is an attributable comparison or the exact blocker. Then the Team G Lead decides whether to authorize the small startup repair or select another single discriminating boundary. Z-002 public/device revision provenance is a *separate historical attribution debt*, not a reason to postpone useful pinned-source experiments.

**Lens:** not part of build. On-demand read-only checkpoint from ledger is sufficient; no plugin, background automation, polling, backend or second state database.

**Continuity:** every session exports exactly **one self-contained transferable Markdown file** holding new evidence and any unpublished work, fixed SHAs, decisions, unresolved contradictions, permissions, and only one next assignment. Close Studio Z once accepted rather than maintaining a lab.
