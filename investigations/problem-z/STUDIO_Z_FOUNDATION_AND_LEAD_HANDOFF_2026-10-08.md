# Studio Z — finite foundation and Team G build handoff

**Prepared:** 2026-10-08 EDT | **Owner:** Nik | **Receiving lead:** Team G Lead, Claude Opus 5.5, Factory G | **Scheduled handoff:** 2026-10-08 20:00 EDT

**Status:** Foundation prepared; incident unresolved; engineering authorization **NOT GRANTED** by this document. Receipt, review, approval, implementation, release and physical acceptance have not occurred merely because this file exists or the clock reaches 8 PM.

## Foundation completion addendum — later on October 8, 2026

The owner subsequently authorized continued **research/documentation foundation work only**, not building/repairing the application. Since this charter's first commit:

- Astra's unpublished audit and causal model were recovered from the owner-supplied handoff and committed as [ARCHITECTURE_AUDIT.md](ARCHITECTURE_AUDIT.md) and [CAUSAL_MODEL.md](CAUSAL_MODEL.md). **Recovered text is not asserted byte-for-byte identical to the original unsaved files; the full earlier export remains independent historical preservation.**
- Astra's revised [RESEARCH_PROGRAM.md](RESEARCH_PROGRAM.md) (32 selectable units, 40 preserved IDs) and reconciled [RESEARCH_LEDGER.json](RESEARCH_LEDGER.json) were committed; **no additional research question was marked independently verified**. The old paragraph below suggesting those drafts remain unpublished is historical and now superseded.
- The small, conditional [STUDIO_Z_BUILD_READINESS.md](STUDIO_Z_BUILD_READINESS.md) provides engineering candidate options, explicit entry/exit tests and physical acceptance for the three incident clusters. It is a **specification**, not a repair.
- [EVIDENCE_REGISTER.md](EVIDENCE_REGISTER.md) now records scoped S-10–S-19/T-01/P-01 provenance including imported-versus-direct review; [RESEARCH_PROTOCOL.md](RESEARCH_PROTOCOL.md) and [TEAM_G_REVIEW_GATE.md](TEAM_G_REVIEW_GATE.md) enforce finite scope and the one-file-per-session export. [NEXT_RESEARCH_SESSION.md](NEXT_RESEARCH_SESSION.md) still selects only X-01.
- This work **did not execute X-01, modify game/test files, assign workers, test real accounts, mutate Firebase, release anything, grant Team G authority, or establish a physical cause**. Do not confuse source-check corroboration with browser test T evidence.

**Lead entry order:** this addendum → current foundation → build readiness → NEXT_RESEARCH_SESSION → ledger/causal/evidence only as needed → live POS20/guards. Do not read the entire historical catalog before making the first discriminating decision. The latest **single-file export** is linked from the workspace README when available; actual lead receipt/acceptance remains a separate recorded action.

---

### Targeted post-foundation research update

The [Z-003 source-excerpt model report](research-blocks/Z-003_STARTUP_SOURCE_EXCERPT_MODEL_2026-10-08.md) now records a **locally executed Node VM event-order experiment** using verbatim pinned startup function excerpts. Three deterministic loader-availability schedules discriminated the latched failure in the model, but a Chromium real-browser attempt was **blocked at environment navigation**, so X-01 remains **in progress, not independently browser verified**. The research ledger/evidence and next session have been updated. No application patch, real account, production provider activity, deployment or original physical incident reproduction occurred.

## 1. Mission and stop rule

Studio Z is a **temporary, narrow Factory G incident team** for GitHub issue [#426](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/issues/426). Its purpose is to:
1. Diagnose only the failures witnessed in the October 7, 2026 two-manager physical playtests.
2. Enable Team G to authorize and build the **smallest independently justified corrections**.
3. Demonstrate reliable entry, same-career continuation and usable transfers without weakening private authority or destroying data.
4. Obtain required real Nik/Daniel acceptance and **close Studio Z**, archive the evidence and retire temporary diagnostics.

Do **not** create an indefinite research lab, require all 40 historical IDs or 32 optional revised units, fabricate completion percentages, build a parallel management platform or make the optional Lens an engineering dependency. Decision-changing evidence, not document count, determines the next step. After two nondiscriminating attempts against an unchanged evidence fingerprint, reframe or report the exact blocker. Stop researching a mechanism once a safe, testable repair decision can be made; preserve incident attribution uncertainty where unavoidable.

## 2. Exact authority and repository state

- **Repo:** `nikahanghojjati-oss/fifa17-career-showdown2`.
- **Research/documentation branch:** `investigation/problem-z-z-studio-2026-10-08`; observed original head `740a706129d963ec2ff1c5f35c68e3c71b0a7a3f` immediately before this foundation was written.
- **Product main:** `bc77a0b934c3d43279f27f73a72db21c2db2b4f2` at this review. Re-resolve before work. App source pinned to this SHA for comparisons.
- **Historical imported test:** PR [#425](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/425), report at `project-documents/gameplay-factory/sweeps/olympiad/findings/codex-1006-2350-1.json` on `qa/codex-two-manager-1006-2350`. Its reported runs are **not** an independent rerun by this Studio.
- **Authority:** live `AGENTS.md`, `CURRENT_PRODUCT_GUARDS.json`, active POS20, inherited POS10 proof floor, and applicable SSJR-2.1/MDP rules always govern. Historic `POS20_CURRENT_STATE.json` and old research instructions may be stale.
- **Allowed documentation changes under this foundation:** only `investigations/problem-z/` on the research branch. Team G Lead must separately authorize any application code, worker branches, PRs, tests involving real private accounts, merges, provider change or deployment.

The owner's complete **STUDIO_Z_HANDOFF_2026-10-08(1).md** export preserves 12 prior research snapshots, including Astra's architecture audit, causal model and revision-2 ledger **that had not been committed** as of that export. The export's opening reconciliation supersedes stale appendix claims. Do not assume those drafts exist in GitHub, blindly run their generator or overwrite newer branch work.

## 3. Incident scope and current evidence

**A — tablet transfers:** Daniel reported an ill-fitting Transfer War Room; signing 1 requested player name, previous league and nationality; refresh disrupted continuity. **B — Continue Career:** after league/club selection, Continue appeared to restart or require repeated pairing/setup. **C — entry/UI:** Home sign-in absent while Season 1/1 remained; Connecting / Opening Google sign-in could persist; Settings login failed to make the manager game-ready and legacy DEVICE / OFFLINE APP surfaced.

Neither original screenshot bytes nor actual October 7 device runtime/auth/provider trace are available in this handoff. Apparent UI resets do **not** establish deleted canonical saves or durable pair. These are three potentially distinct defects; do not force a single explanation.

### Findings imported from Astra's prior research, plus direct current source checks

| Lead | Evidential status | Small next discriminator |
|---|---|---|
| **H-03 startup ordering/latch.** Pinned `index.html` defers `showdown.js` before `optionalModules.js` and `app.js`. `showdown.js` sets `__cmsOnlinePlayerEntryBootstrap` before calling the optional runtime loader; a premature throw can leave an unretried bootstrap. | Source path confirmed directly; PR #425 reports three sign-in-entry failures and 0/400 ms loader-response contrast. **Not independently rerun here and not the proven physical root cause.** | **Z-003 / X-01**, unchanged pinned files, ordinary load, 400 ms optional-loader delay, *unrelated-asset* 400 ms delay control. |
| **H-02/H-11 auth readiness.** Google/Firebase user, connected-account bootstrap, registered device, local manager, durable pair and exact ACTIVE private session are distinct authorities; signed-out rendering can hide bootstrap problems. | Prior source review, no original provider/auth trace. | Synthetic successful-auth/bootstrap-fail versus popup rejection/pending state only if X-01 does not explain access sufficiently. |
| **H-05 signing canonical ID.** `pstcBuildSignings` uses canonical league/nationality IDs, and `pstcHandleAction` builds signings **before** `lockSignings`. A visible label may lack the ID; the error need not be a provider rejection. | Direct source check at pinned `js/productionSharedTransferChallenge.js`; no physical field trace. | **X-05** same visible labels with valid/missing canonical IDs and a zero-provider-call spy. |
| **H-07 tablet reachability.** Reported layout/keyboard accessibility problem is independent of validation and may exacerbate it. | Owner report; original viewport and screenshots unavailable. | **X-06** actual control bounds/scroll/focus in labelled synthetic viewports; physical confirmation only with consent. |
| **H-04/H-08 continuity.** Page-memory private-session capability can disappear on reload without erasing pair/career; a fresh **exact ACTIVE** session may be required. Repeat permanent pairing, destructive reset or new career are not acceptable substitutes. | Prior source/contract review, no original local/remote before-and-after proof. | **X-04** disposable exact save/pair fixtures; expired/absent/valid/wrong-session controls and snapshot invariants. |
| **H-06 mixed runtime.** Current public asset sampling may match main yet the historical device cache could differ. | Previously sampled public assets; **not** a record of physical device bytes. | Investigate only if coherent-source timing and actual failure evidence warrant it; never clear real storage by default. |

**Important contradiction:** A visible Connecting overlay in one physical attempt means an always-absent identity module cannot explain every symptom without different chronology or an additional mechanism. Preserve that uncertainty.

## 4. Minimal Studio construction inside Factory G

No new standing organization is needed. The lead may assign one investigator/engineer plus an independent verifier **per active defect**, reusing Factory G tooling. Keep only **one active repair slice** unless there is a concrete blocking dependency that makes parallel work safer and faster.

| Slice | Enter when | Output | No-go |
|---|---|---|---|
| **Access/UI** (first priority) | Independently reproduced H-03 or other bounded auth mechanism | Small patch proposal with race/error recovery proof; Home sign-in and legacy containment regression | No changed auth persistence, provider policy or popup scopes; no silent bypass of identity guard |
| **Career continuity** | Exact-context trace distinguishes new session authorization from incorrect new pairing/career route | Same-career non-destructive resume correction and local/remote invariant tests | No routine re-pair, reset, storage clear, unsolicited remote Apply or persisted old session token |
| **Tablet transfers** | Canonical ID or measured reachability defect independently demonstrated | Accessible input/validation correction with replay/commit invariants | No leaking rival private selections or claiming client rejection is provider denial without a call trace |

A slice can be deferred or dropped when evidence disproves it or shows it is not needed. Do not turn research catalog entries into mandatory worker tasks.

## 5. First ready-to-run assignment — X-01 (not a fix)

**Question:** Can a targeted 400 ms delay only to `js/optionalModules.js` make the pinned source latch identity initialization before `loadRuntimeScript` exists, with no automatic recovery once it becomes available?

**Execution boundary:** disposable local browser contexts, static pinned product files, no code edits, no real Google login and no production Firebase mutations. Reproduce the imported PR's environment only to the degree needed; inspect fixture interception and record limitations. Compare (A) ordinary response, (B) delayed optional loader, (C) equally delayed unrelated asset, with identical environment/source fingerprints.

**Capture:** clocked readyState; bootstrap flag; loader/reporter availability; identity API/badge/overlay; Start click route; console/page errors; screenshot hashes; exact test command and environment. **Falsifier:** identity reliably recovers after loader arrival under the targeted delay. If all controls fail, check harness assumptions rather than award root-cause credit.

**Gate:** attach an independently executed comparison or a precise blocker. Explain what it proves about source **and what it cannot prove about October 7 physical play**. Then ask Team G Lead whether evidence justifies a bounded access repair, and what regression gates apply. Do not implement a patch as part of this research-only assignment.

## 6. Acceptance and non-negotiable safety

- **Exactly two private managers**: Nik and Daniel. UID, registered-device and provider membership remain authoritative; mere manager display selection is never authorization. Exact ACTIVE session, right context, and per-manager canonical screens are retained.
- **Permanent zero billing:** Firebase Spark only, no Blaze/billing account/Cloud Run/Cloud Functions; App Check enforcement OFF; Firestore browser memory-only; Google popup-only `browserSessionPersistence`, no added scopes.
- **Data safety:** canonical save and durable pairing preserved; no automatic delete, cache/storage clear, account switching, device revocation, pairing discard or active Showdown abandonment. Candidate C remains the sole destructive remote-to-local Apply with backup and exact rollback.
- **Privacy:** no tokens, UIDs, private invite codes, account/device identifiers, complete saves or raw provider payloads in public diagnostics or exports. Init/restore/attach/sign-in can write; never call them as “passive reads.”
- **Proof to close:** both legitimate managers enter and reach game-ready authority, recover the **same** rivalry/career and committed progress through relevant interruptions, can use measured tablet transfer controls with canonical selections, and independently witness required screens. Execute applicable POS20/POS10, regression, provider, SSJR-2.1 and genuine physical gates before lead review, release and Nik's acceptance; no simulated credit.
- **Exit:** exact approved build/test/deployment evidence, remaining debt, Team G Lead decision and Nik's acceptance. Close issue #426 only on actual authorized resolution. If owner accepts unresolved limits, record **closed-inconclusive**, not “fixed.” Archive Studio Z and stop Lens/research.

## 7. Optional progress Lens, deliberately tiny

Default to the existing ledger/checkpoint as source of truth and an **on-demand read-only Markdown snapshot**, showing active question, verified finding, blocker, next decision and authority state. No plugin/backend/dashboard deployment is justified now; no duplicated status entry, polling, heartbeat, permanent infrastructure or synthetic percentage. Lens effort must remain incidental and never block a fix.

## 8. Mandatory one-file session handoff and lead acceptance

**Every Studio Z chat/session ends with ONE downloadable, self-contained transferable Markdown file**, including: objective; exact repo/branch/source fingerprints; what was actually read/run/written; evidence tiers and artifacts; controls and contradictory results; changed files/commit SHA; guard review; current status; approval/acceptance states; blockers; **one** next action; and clear closure criteria. When draft research is not committed, embed it verbatim or otherwise preserve it in that one export; do not pretend a remote pointer carries unpublished work. A short lead-facing summary may accompany the one file, but not replace it. An unexpected interruption requires honest partial preservation on the next session, not invented completion.

**Lead receipt checklist:** (1) acknowledge actual handoff receipt, (2) check live POS20/guards/repo refs and unpublished Astra draft state, (3) accept/amend this finite scope, (4) review independent X-01 outcome and choose first bounded slice, (5) specify separate implementation branch/workers, verification and publication authority, (6) record acceptance or blocker. **The 8:00 PM schedule is not an automatic model switch, permissions transfer or message delivery.**

**Prepared for Claude Opus 5.5:** Continue only this finite Studio Z incident within Factory G. Treat the uploaded complete historical handoff as evidence history and this file as the current small execution charter. Do not execute 40/32 units by default. Independently discriminate X-01 first, then select the smallest supported repair slice. Obtain the necessary approvals, preserve all guards, verify Nik/Daniel's physical outcomes, and close the temporary Studio when accepted.
