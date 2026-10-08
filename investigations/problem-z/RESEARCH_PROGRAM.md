# Problem Z — Multi-session Research Program (40-block initial roadmap)

**Program status:** ACTIVE RESEARCH / NO IMPLEMENTATION AUTHORIZATION  
**Created:** 2026-10-08  
**Repository:** [Career Mode Showdown](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2)  
**Sole research branch:** `investigation/problem-z-z-studio-2026-10-08` (never write to `main`)  
**Escalation:** [Problem Z #426](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/issues/426)  
**Final decision authority:** Team G Lead (Claude Opus 5.5), after dossier submission; owner may clarify or change research priority.  
**Initial plan:** 40 focused research blocks across 10 phases, likely 40 or more chat sessions. No deadline or fixed number of conversations guarantees a solved bug. A research block can be split, revisited, or added if evidence demands it.

## North-star question

Why did a real Daniel-and-Nik two-manager session experience tablet Transfer War Room clipping/validation and loss of continuity, repeat pairing after Continue Career, and ultimately a missing Home sign-in plus unusable Google account-to-game identity, and what evidence-backed, safe options could resolve the full failure chain without compromising security, shared-game integrity or local saves?

## Boundaries and evidence rules

- This is a **research program**, not a parallel development team. No product code, prod provider data, remote account/device state, live credentials, deployments, main commits, merging, worker assignments or security policy changes are authorized by this plan.
- One active **atomic research block per chat session** is the default. A session must produce a durable, cited research artifact and update the ledger + next handoff; if blocked, record the blocker rather than fake completion. Extra sessions for deeper evidence are encouraged.
- **Evidence tiers:** O = owner-observed/screenshots; S = repo-source verified at a recorded SHA; T = deterministic/browser reproduction with explicit environment; P = legitimate physical/production observation with consent and full provenance; H = hypothesis/inference. Never promote H to observed fact, and never promote T to P.
- Separate `research-complete` from `independently-verified` and `lead-approved`. Even 40 completed research blocks do not mean the cause is fixed or the lead authorized building.
- Preserve POS20 active project governance and POS10 proof floor; zero SSJR/MDP product score earned by research. Respect two managers, exact ACTIVE before league/club authority, pop-up Google auth with session persistence, Spark/zero billing, memory-only Firestore, Candidate C-only destructive Apply and dual-full-screen experience.
- No repeated logins or destructive cleanup on the two real player devices as a substitute for targeted evidence. Never include passwords, tokens, raw Firebase UIDs, invite capabilities, account emails, device identifiers or full save content in this public repository.

## Deliverable model

Each research block records the question, source SHA/asset revision, evidence tier and direct citations, analysis, tested/falsified hypotheses, uncertainty, safety boundary, conclusion or blocker, open questions, and one next question. Research artifacts live under `research-blocks/`. `RESEARCH_LEDGER.json` is the machine-readable plan/status source, `NEXT_RESEARCH_SESSION.md` the working checkpoint, `EVIDENCE_REGISTER.md` the provenance record and `TEAM_G_REVIEW_GATE.md` the eventual decision threshold. See `RESEARCH_PROTOCOL.md` for the exact per-chat procedure.

## Research roadmap

### Phase I — Incident forensics & baseline

**Goal:** Preserve what actually happened, normalize provenance and establish the exact technical and safety baseline before causal claims.

| Block | Investigation | Question | Required output |
|---|---|---|---|
| Z-001 | Physical-playtest incident timeline | Which observed events and on-screen states can be established from the three runs? | A sourced timeline, evidence categories, known unknowns, and a non-destructive recovery caution. |
| Z-002 | Live revision and deployment provenance | Which exact main head, deployed Pages build, service-worker revision, and asset versions were in use? | An as-of timeline separating repository state from live deployment and each device's unverified runtime. |
| Z-003 | Application module/load graph | How do bootstrapping, lazy script loading, styling, Settings and entry bind to one another? | A cross-referenced module diagram with startup and failure edges. |
| Z-004 | Authority, policy and hazards | Which security/privacy/canonical-journey rules constrain diagnosis and later remediation? | A signed-off-for-research-only constraints and hazardous-action register. |

**Exit criterion:** Findings are source-grounded, inconsistencies recorded and phase-level unknowns listed. No phase exit is evidence of a real-device fix.

### Phase II — Firebase authentication & popup lifecycle

**Goal:** Understand why Google sign-in can stay on Connecting and how to distinguish provider, app and UI failures.

| Block | Investigation | Question | Required output |
|---|---|---|---|
| Z-005 | Auth transition state machine | What are all states between signed out, popup attempt, Firebase user, account bootstrap, and terminal results? | State/transition table with missing guards and provenance. |
| Z-006 | Popup and user-activation boundary | Can asynchronous initialization interrupt popup launch on target browsers? | Causal hypotheses and controlled timing test design across browser contexts. |
| Z-007 | Auth failure taxonomy and recoverability | Which error codes are swallowed, converted or misreported as signed out? | Provider-to-UI error map, retry policy proposal, no secrets. |
| Z-008 | Cross-browser login compatibility | How do iOS, Android tablet, desktop, PWA and browser restrictions differ? | Real vs simulated browser matrix with evidence labeling and safe reproduction steps. |

**Exit criterion:** Findings are source-grounded, inconsistencies recorded and phase-level unknowns listed. No phase exit is evidence of a real-device fix.

### Phase III — Account, device and player identity

**Goal:** Show how Firebase UID, private account, registered device and chosen manager become a trustworthy ready-to-play identity.

| Block | Investigation | Question | Required output |
|---|---|---|---|
| Z-009 | Connected Account bootstrap | What conditions turn a real Firebase user into a connected private account? | Bootstrap and Firestore rules decision tree; explicit negative states. |
| Z-010 | Registered-device lifecycle | What makes a device recognized or unavailable across browser/storage changes? | Device and IndexedDB dependency diagram and recovery constraints. |
| Z-011 | Nik/Daniel role binding | How is manager selection bound and recovered for exactly two people? | Role binding and persistence invariants, conflict taxonomy. |
| Z-012 | Account/device mismatch scenarios | What happens when a valid Google account is not the expected linked manager/device? | Matrix of fail-closed states, privacy-safe messages and authorized next steps. |

**Exit criterion:** Findings are source-grounded, inconsistencies recorded and phase-level unknowns listed. No phase exit is evidence of a real-device fix.

### Phase IV — Home, Settings and identity presentation

**Goal:** Explain why Home can lose its sign-in CTA while displaying season progress and why old Settings modules leak into UI.

| Block | Investigation | Question | Required output |
|---|---|---|---|
| Z-013 | Header and badge lifecycle | Can lazy identity initialization fail to mount the Home sign-in badge? | Home CTA lifecycle chart and testable reproduction branches. |
| Z-014 | Legacy Settings containment | Under which load/mutation/style sequences does OFFLINE APP become visible? | CSS injection + observers timing model with evidence of any actual failure. |
| Z-015 | Navigation and event ownership | Do capture-phase handlers, local entry and optional modules race or conflict? | Event ordering table, possible swallowed/replayed clicks. |
| Z-016 | Accessible feedback and exit paths | Can Connecting remain forever; how should signing in fail or recover clearly? | Bounded UX state specification with actionable errors and focus behavior. |

**Exit criterion:** Findings are source-grounded, inconsistencies recorded and phase-level unknowns listed. No phase exit is evidence of a real-device fix.

### Phase V — Private pairing and shared sessions

**Goal:** Trace authorized Daniel/Nik connection so valid relationships survive reload while invalid ones fail closed.

| Block | Investigation | Question | Required output |
|---|---|---|---|
| Z-017 | Persistent pairing authority | How does an existing two-player rivalry map to local and remote state? | Pairing state machine, unique authority keys, re-pair rules. |
| Z-018 | ACTIVE private session lifecycle | What starts/ends/renews a private session and what is ephemeral? | Host/join/expiry/revocation/ACTIVE transition model. |
| Z-019 | Reconnect after reload | Why might refresh lose a private session despite persisted pairing? | Reload-vs-memory-vs-provider state grid and continuation oracle. |
| Z-020 | Safe pairing recovery boundary | Which recovery steps preserve the current rivalry and which are destructive? | Recovery decision tree, prohibitions, no implicit abandon. |

**Exit criterion:** Findings are source-grounded, inconsistencies recorded and phase-level unknowns listed. No phase exit is evidence of a real-device fix.

### Phase VI — Save, Continue Career and canonical recovery

**Goal:** Prove what can be resumed, from where, without new pairing or skipped gameplay scenes.

| Block | Investigation | Question | Required output |
|---|---|---|---|
| Z-021 | Local Showdown and Save Library | Which objects persist and which operations normalize or overwrite local state? | Local state provenance and storage key ownership. |
| Z-022 | Remote authority and Candidate C | When may server state be read, compared or destructively applied to local? | Read-only and destructive boundaries with exact rollback guarantees. |
| Z-023 | Interruption and reconciliation model | Which gameplay transitions survive reload, offline and delayed second-player action? | Full shared-journey interruption matrix, both manager perspectives. |
| Z-024 | Continue Career route audit | Which handler owns Continue Career for each authorized user/context? | Route arbitration and exact-session resume invariant, independent of guessed bug cause. |

**Exit criterion:** Findings are source-grounded, inconsistencies recorded and phase-level unknowns listed. No phase exit is evidence of a real-device fix.

### Phase VII — Offline, service worker and runtime drift

**Goal:** Rule in or out stale shell, mixed asset versions and background/network lifecycle as causes.

| Block | Investigation | Question | Required output |
|---|---|---|---|
| Z-025 | Offline cache and fetch behavior | What is cached, network-only, retained or switched across updates? | Service-worker cache/control map. |
| Z-026 | Mixed runtime and stale UI | Can two tabs/devices load incompatible shell, CSS or identity modules? | Version-drift test matrix and evidence rules. |
| Z-027 | Network/visibility transition races | What runs on offline/online, visibility and controllerchange events? | Event race catalog and suggested deterministic timing fixtures. |
| Z-028 | Safe update and rollback UX | How can a broken shell report versions and recover without deleting saves? | Non-destructive recovery proposal respecting existing rollback design. |

**Exit criterion:** Findings are source-grounded, inconsistencies recorded and phase-level unknowns listed. No phase exit is evidence of a real-device fix.

### Phase VIII — Tablet Transfer War Room

**Goal:** Separate responsive-layout defects from validation, focus, provider state and transfer-stage continuity defects.

| Block | Investigation | Question | Required output |
|---|---|---|---|
| Z-029 | Photographic layout evidence map | What precisely is and is not visible in the tablet screenshot and known viewport? | Measured UI symptom map with no invented device dimensions. |
| Z-030 | Landscape responsive constraints | Which grids, fixed panels, clipping, scrolling and keyboard interactions fail on tablets? | Viewport/orientation CSS constraint audit with target test sizes. |
| Z-031 | Signing/guess validation contract | Why does signing 1 fail validation; are displayed and canonical values aligned? | Client/provider contract trace, field-level actionable error specification. |
| Z-032 | Transfer reload/replay safety | What happens to draft signing data and stage authority after refresh/late peer? | Full-screen transfer replay checklist and state continuity matrix. |

**Exit criterion:** Findings are source-grounded, inconsistencies recorded and phase-level unknowns listed. No phase exit is evidence of a real-device fix.

### Phase IX — Causal synthesis and proof design

**Goal:** Reduce uncertainty systematically and design falsifiable, privacy-safe experiments and acceptance criteria.

| Block | Investigation | Question | Required output |
|---|---|---|---|
| Z-033 | Competing root-cause model | Which hypotheses best explain all three runs and which contradict evidence? | Ranked causal graph, discriminating experiments and uncertainty. |
| Z-034 | Deterministic test architecture | How should contract, browser and fault injection coverage be organized? | Non-executing test specification mapped to current suites. |
| Z-035 | Safe production observation plan | What minimum non-secret runtime evidence is necessary for real-device diagnosis? | Approved-only evidence collection protocol, retention and redaction. |
| Z-036 | Two-device acceptance design | What exact one- and three-season physical experiments demonstrate end-to-end recovery? | Daniel/Nik physical acceptance checklist, failure captures and independent attestations. |

**Exit criterion:** Findings are source-grounded, inconsistencies recorded and phase-level unknowns listed. No phase exit is evidence of a real-device fix.

### Phase X — Lead-ready research decision dossier

**Goal:** Deliver a complete body of evidence and decisions to Team G Lead, without silently authorizing implementation.

| Block | Investigation | Question | Required output |
|---|---|---|---|
| Z-037 | Remediation options and tradeoffs | What candidate approaches address the supported causes without unsafe shortcuts? | Alternative options, constraints, risk/complexity/cost, no source changes. |
| Z-038 | Security, privacy and budget review | Do all proposed paths preserve private two-manager auth, zero billing and Candidate C? | Constraint-by-constraint design assessment; unresolved blockers explicit. |
| Z-039 | Integrated evidence/contradictions audit | Which claims are observed, reproduced, inferred or still unknown? | Final evidence index, falsified hypotheses, remaining debt and readiness. |
| Z-040 | Team G Lead decision packet | What precise decisions, staffing, implementation branches and verification gates should the lead own? | Executive summary and option table, implementation boundaries, approval requests. |

**Exit criterion:** Findings are source-grounded, inconsistencies recorded and phase-level unknowns listed. No phase exit is evidence of a real-device fix.

## Adaptive scheduling and prioritization

1. **Baseline-first:** start with Z-001→Z-004 unless high-risk new evidence calls for immediate non-destructive forensic preservation.
2. **Causal discipline:** before a new experiment, name a competing hypothesis, the result that would falsify it, and the lowest-risk observation that separates alternatives.
3. **Explicit gates:** later blocks may continue with carefully marked unknowns; no evidence is invented to make an earlier block green. The lead packet is not final while safety-critical unknowns lack documented rationale.
4. **Incident urgency:** a P0 recommendation can prompt the owner/lead to authorize an independent urgent mitigation outside this long research program; the research branch still may not touch production.
5. **Research debt:** if two iterations fail under unchanged evidence, reframe the hypothesis (aligning with POS20); preserve contradictory evidence and negative findings.
6. **No autopilot:** future chats resume only when a user starts a new session/request; the program does not claim autonomous background research.

## Review handoff (after investigation, not now)

Once the ledger demonstrates each required block completed **or explicitly dispositioned with an accepted blocker** and cross-block contradictions are reconciled, prepare the decision dossier for Team G Lead. Only the lead decides whether to authorize a Z Studio implementation team, worker selection, code branches, security changes (if any), PRs, test gates, merge and deployment. An issue or document addressed to the lead is not approval.
