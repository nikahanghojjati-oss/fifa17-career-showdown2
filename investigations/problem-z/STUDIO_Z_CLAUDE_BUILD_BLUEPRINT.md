# Studio Z — finite Factory G construction blueprint for Claude Opus 5.5

**Prepared:** 2026-10-08 EDT | **Owner:** Nik | **Incoming Team G Lead:** Claude Opus 5.5 | **Stage:** design complete, implementation **NOT authorized**. This is an optional lead decision aid, not a standing Studio infrastructure project. It does not supersede live `AGENTS.md`, POS20/POS10, product guards or owner authority.

## 1. What "building Studio Z" actually means

Studio Z is **a temporary incident repair workflow** within existing Factory G, not a new deployed web application, plugin, provider, research company, or indefinite team. Reuse the current issue (#426), research folder, project tests, POS20 candidate/review/merge machinery and owner physical evidence process. No new credentials, Firestore collections, Firebase plan, proxy, dashboard service or standing workers.

**Start condition:** Incoming lead explicitly acknowledges this packet, independently resolves live source and governance, chooses one evidence question and receives any needed owner/Team G permissions. The scheduled 8:00 PM EDT handoff does not automatically satisfy that condition.

**Stop condition:** The three reported failures are each resolved with evidence or transparently accepted as limited/inconclusive; required actual two-manager physical and release gates are satisfied; with authority, close #426 and archive/retire Studio Z and any temporary Lens/probes. A source-level theory, CI pass or delay contrast alone cannot close a physical complaint.

## 2. The minimal temporary operating cell

| Role / action authority | Temporary responsibility | What it must never self-authorize |
|---|---|---|
| **Nik — owner** | Defines scope; accepts real Daniel/Nik outcomes; approves reserved source/release/production actions as applicable; determines accepted limitations and closure | No obligation to run engineering diagnostics or disclose tokens/saves |
| **Claude — Team G Lead** | Acknowledges mandate; selects highest-evidence atomic work item; enforces current POS20/POS10; decides branch/engineer/reviewer/test gates after approval; summarizes to Nik | Cannot infer authority from a clock, issue status or GPT handoff |
| **One investigator or implementer per active slice** (role may be played by authorized Team G worker) | Runs bounded assigned research or edits just approved files; reports before/after diff, falsifier and residual risks | No data reset, extra manager, silent provider mutation, uncontrolled scope creep |
| **One separate reviewer/verifier per implementation** | Independently checks same exact source head, regression proof, safety guard, negative controls and closure claims | Cannot treat implementer's own checks as independent proof |

**Concurrency:** one active mutation slice by default. Permit a parallel, read-only investigation only if it clearly removes a blocker and does not mutate shared candidates or provider state. There is no justification for a permanent research staff, polling job or a fresh "Studio architecture platform."

## 3. Exact repair dependency graph — conditional, not an imposed multi-session plan

```text
Lead receipt + live POS20/AGENTS/guard reconciliation
    |
    v
X-01: source-unchanged loader timing / negative control
    |
    +-- NOT reproduced / harness confounded --> reframe H-03; inspect auth/network/revision alternative
    |
    +-- Independently reproduced ----------> approve minimal identity-startup repair?
                                             |
                                             v
                                  One authorized patch + review + current proof gates
                                             |
                                             v
                             J1.1 valid identity/start entry / Home / Settings
                                             |
                                             v
                           Continue still wrong? -- NO --> record separate B symptom proof
                                  | YES
                                  v
                           same durable pair/save context vs new exact session
                                  |
                                  v
                           conditionally authorize smallest continuation fix
                                  |
                                  v
                     Transfers still wrong? -- NO --> record separate A symptom proof
                                  | YES
                                  v
                     canonical ID vs responsive/keyboard clipping vs replay
                                  |
                                  v
                       conditionally authorize smallest transfer repair
                                  |
                                  v
                         exact-head review/deploy if authorized
                                  |
                                  v
                         real Daniel + Nik physical acceptance
                                  |
                                  v
                           close #426, retire Studio Z
```

**Do not** infer that a clean X-01 will resolve Continue or transfers; each complaint needs independent closure observations. **Do** allow one verified fix to address multiple symptoms if independently shown. Do not require working through the optional 32-unit research catalog.

## 4. Executable slice input/output contract

A repair worker gets only a single scoped contract approved by the lead:

1. **Bug and falsifier:** one observable user symptom, one pinned reproduced discriminator, one counterexample or negative control. Record `O/S/T/P` tier and whether real original device evidence exists.
2. **Pinned implementation surface:** source head, owned code files, excluded paths, time/resource budget and privacy/provider restrictions. No shared candidate edits when exact-head verification is running.
3. **Smallest acceptable behavior:** explicit old failure and new behavior; preserve durable rivalry ID/local save semantics, canonical form selection and exact ACTIVE private session boundaries.
4. **Proof and contradiction:** exact existing test lanes from [build readiness F.3](STUDIO_Z_BUILD_READINESS.md#f3-existing-factory-g-test-lanes--do-not-build-duplicate-test-infrastructure), new tiny regression only if necessary, negative control and independent review; document what emulator proof cannot establish about physical devices.
5. **Failure/recovery:** if source refs move, tests conflict or two fixes under unchanged hypothesis fail, freeze/refocus under POS20; preserve prior state and rollback route; no blind cache wipe or irreversible "Start Over."
6. **Finish:** one mergeable lead-reviewed slice or a precise `BLOCKED` / `NOT-REPRODUCED` report, not a speculative cleanup campaign.

**Proposed default source ownership by defect, contingent on evidence:**

| Slice | Source boundaries to review first | Positively required and forbidden result |
|---|---|---|
| **C / identity startup** | `index.html` defer order; `js/showdown.js` bootstrap; `js/optionalModules.js` loader; `js/onlinePlayerIdentity.js`; `js/app.js` initialization | One reachable sign-in/identity surface after loader is available; no silent bypass of identity or duplicate listeners, preserve popup/browserSession settings |
| **B / Continue same career** | `js/onlinePlayerIdentity.js` capture-phase `continueCareer`; `js/screens.js` legacy local binding; `js/persistentNikDanielPair.js`; `js/productionSharedJourneyEntry.js`; exact local provider binding | No spurious new rivalry/pair/season; no loss of canonical local save; a fresh *ephemeral* exact ACTIVE session may be needed while *durable* career stays unchanged |
| **A / tablet transfer** | `css/transfer.css` at 900/760/480 breakpoints; `js/transferSelector.js`; `js/productionSharedTransferChallenge.js`; `js/optionalModules.js` CSS load | Correct typed-exact and clicked canonical IDs, viewport/keyboard reachable CTA, private guess isolation, zero unintended provider writes on invalid/partial rows, replay read-only |

Refer to full [build readiness](STUDIO_Z_BUILD_READINESS.md) for exact source observations. These are **candidate code ownership maps only**, not proof of actual errors or instructions to edit everything named.

## 5. Fix the research probe's measurement risk without changing the game

The prepared standalone [X-01 local-only probe](tools/x01-local-browser-probe.cjs) compares three conditions using unchanged pinned source:
- baseline;
- `js/optionalModules.js` delayed 400 ms;
- **unrelated in-page Reus image** `assets/marco-reus-2015-cc-by.webp` delayed 400 ms.

This is a better independent-asset negative control than the earlier proposal to delay `js/app.js`: that JS participates in app startup, so delaying it can change UI initialization independently. The in-page image exists in pinned `index.html` and is non-executable, though browser prioritization may still affect global timing. The actual image-intercept hit must equal exactly one; otherwise the run is inconclusive. The probe intentionally denies all external origins, so **it cannot establish actual Google/Firebase sign-in, provider registration, or physical product behavior**. Only Claude may execute/adjust it after permission, record its exact source/test environment, and decide whether a further approved emulator-only J1.1 run is needed. **Prepared does not mean tested.**

Do not modify `main`, current operational test suites or production to make a diagnostic runner pass. If source hash pinning fails, stop and reconcile the current Git revision instead of force-running.

## 6. A truly lightweight optional Studio Lens — no plugin/server/UI product

**Default Lens:** one concise on-demand Markdown view built by reading existing research ledger, current Git refs and current Team G decision notes. No continuously running monitoring, network polling, automatic status percent, background AI worker or deployed progress website. The suggested display has just:

| Field | Truthful source | Presentation rule |
|---|---|---|
| **Active issue** | User's three incident clusters and selected atomic POS20 task | Exactly one active execution question |
| **Evidence level** | Last independent T/P observation vs imported PR/source/model | Show `reported / source-supported / browser-verified / physical-accepted`; never collapse levels |
| **Build state** | Explicit Team G permission and current branch review | `not authorized / in-progress / reviewed / released`; no implied takeover |
| **Safety** | Current guard file, exact-head review, independent verifier | Visible no-go if any guard fails |
| **Next decision** | Lead's selected one action/falsifier | One next action, not a timeline or 32-step backlog |

If the owner wants a visually appealing progress bar, use **three discrete incident chips** (Identity, Continue, Transfers) with labels `Reported → Reproduced → Repaired → Physically accepted`; don't show a fictitious overall percentage or "hours remaining." Lens should be a read-only presentation of the existing truth, not a second data source. Remove it at Studio closure.

## 7. One-file handoff and closure rules

At the end of every Studio Z chat, publish **one complete portable Markdown report**, including all substantive unpublished material or exact complete already-committed snapshots, source/branch HEAD, decisions, evidence tiers and negatives, permissions, actual actions, unpassed tests, next atomic owner/lead action and close state. Preserve old findings rather than reporting an interrupted response as completed work.

**Lead acceptance sentence to record once true, not in advance:** "I have reviewed the current Studio Z packet and live Factory G authority. I accept the finite three-incident mandate and select [one task] under [specific authority]."

**Closure criteria:** Each cluster individually has actual approved evidence (or an expressly owner-accepted limitation); no outstanding release/security/remote-data risk; exact-code/head checks and separate genuine two-device owner acceptance met. After authorized issue closure, archive research/probe and remove optional Lens/temporary roles. **Do not turn Studio Z into a permanent project or extend research merely because optional units remain.**

**Authority disclaimer:** No checks in this blueprint were executed, no worker assignment accepted, no code branch approved, no game source modified, no provider changed, no fix deployed and no owner/Claude acceptance proved by writing this document.
