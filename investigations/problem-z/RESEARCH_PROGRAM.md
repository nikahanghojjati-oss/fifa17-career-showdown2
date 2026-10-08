# Studio Z — Research program, revision 2

**Research only. Implementation authorization: none.** Branch: `investigation/problem-z-z-studio-2026-10-08`.

The inherited program is a useful inventory, but a forty-session sequence would delay the questions that distinguish causes. Revision 2 preserves **40 historical IDs**, consolidates eight overlapping reporting units into **32 active work units**, and groups them into **seven dependency tracks**. Tracks are navigational phases, not a required serial calendar. A work unit can take several sessions. Consolidation earns no progress credit. The historical revision remains available at commit `740a706129d963ec2ff1c5f35c68e3c71b0a7a3f`.

Current state: **one research-complete baseline; zero independently verified blocks; no established physical root cause; no product repair.** This architecture assignment does not close the blocks whose initial models it seeds.

## Research objective and selection

Explain the three owner-reported attempts while distinguishing authentication, private-account/device readiness, pairing, exact ACTIVE session authority, canonical local data, provider progress, runtime delivery and UI failures. Permit multiple independent causes and shared causes; do not force one story to explain every symptom.

The immediate question is **Z-003 / X-01**: independently discriminate the existing exact-main startup-loader failure report. Its reported intervention, control and source anchors offer more immediate information than repeating general popup speculation. **Z-002 remains next provenance work**, with public asset sampling already recorded but device attribution open. See [audit](ARCHITECTURE_AUDIT.md), [causal model](CAUSAL_MODEL.md) and [checkpoint](NEXT_RESEARCH_SESSION.md).

`dependencies` in the ledger are prerequisites for the full unit's conclusion. Source reading and test design may start earlier with recorded assumptions; do not close a dependent conclusion on unresolved authority. Z-033/Z-034/Z-035 and security review are updated throughout, not postponed until all technical tracks finish. Z-039 is final independent audit, not a reason to defer ordinary contradiction handling.

## Critical research paths

- Access: Z-003 → Z-005 → Z-009 → Z-010/Z-011, with Z-013 and Z-015 investigating UI separately. Distinguish no popup invocation from popup failure and successful authentication followed by failed bootstrap.
- Continuity: Z-021 + identity → Z-017 → Z-018 → Z-024 → Z-019. Required outcome is the **same rivalry/career under valid current authority**, not unauthorized persistence of the old session capability. Both managers retain their ordered screen obligations.
- Runtime: Z-002 → Z-025 → Z-027, with coherent-source timing failure as a control against mixed-revision explanations.
- Transfers: Z-031 can proceed alongside Z-029; combine only at Z-032. Client error attribution, control reachability and committed/draft persistence require separate oracles.
- Verification: Z-034/Z-035 define tests and capture early; Z-036 designs authorized physical verification; Z-037 → Z-039 → Z-040 supports cause-specific engineering decisions. A supported urgent finding can reach the lead before this final path finishes.

## Roadmap and per-unit exit gates

Priority `now` means selected next; `early` means high-value source/design work when dependencies allow; `conditional` means schedule only when evidence or a decision makes it useful. No fictional dates or numerical information-gain scores. Every unit inherits the privacy and no-production-mutation rules in [protocol](RESEARCH_PROTOCOL.md).

### A — Foundations and experiment design

| ID / priority | Focused question | Prerequisites | Evidence and completion gate |
|---|---|---|---|
| Z-001 · recorded | What is actually known about each of the three attempts? | None | O/S; original images unavailable to this review. Preserved timeline with O provenance and unknowns; original report retained. |
| Z-002 · next | Which source, publication and device revisions can be established independently? | Z-001 | S/P-public; P-device needed only for device attribution. Timeline distinguishes commit, successful deployment, sampled served bytes and device runtime; exact gaps remain explicit. |
| Z-003 · now | Can deferred startup latch identity initialization before its loader exists? | Z-001 | S + isolated T; imported T-01 is a lead, not independent replication. Matched control, delayed optional loader and delayed unrelated asset discriminate H-03; record events and negative control or exact blocker. |
| Z-004 · early | Which permitted diagnostic calls can themselves write or destroy state? | None | S; relevant POS20/POS10 and provider rules. Action inventory classifies passive reads, initialization side effects, synthetic actions and forbidden production operations. |
| Z-033 · early | Which causal models survive evidence, including independent defects? | Z-001, Z-003, Z-004 | O/S/T/P as available; H remains explicitly hypothetical. Symptoms linked to alternatives and falsifiers; contradiction and observation needed to distinguish each recorded. Revisit on new evidence. |
| Z-034 · early | Which smallest experiments separate candidate causes without changing application code? | Z-003, Z-004 | S; T design, not execution credit. Oracle, negative control, fault variable, environment, stop rule and relevant suite specified for each selected experiment. |
| Z-035 · early | Which physical observations cannot safely be replaced by source or simulation? | Z-001, Z-004 | O/S; plan only, P requires authorization. Minimal consented capture protocol with allowlisted fields, redaction, retention and no initialization disguised as reading. |

### B — Authentication and identity

| ID / priority | Focused question | Prerequisites | Evidence and completion gate |
|---|---|---|---|
| Z-005 · early (includes Z-007) | Where can sign-in stop, and how are each return, rejection and pending state presented? | Z-003, Z-004 | S + T; includes former Z-007. Transition/error table separates loader, popup, Firebase user, bootstrap, device and UI; success/popup-cancel/bootstrap-fail alternatives have distinguishable traces. |
| Z-006 · conditional | Does delayed pre-popup preparation cause popup failure in a specified browser? | Z-005 | T real browser; P needed for original-device attribution. Record trusted click, activation at invocation, actual popup call/result and timing controls; distinguish no call from rejected call. |
| Z-008 · conditional | Which affected environments differ after the same boundary is exercised? | Z-005, Z-006, Z-035 | T + separately authorized P. Small evidence-led browser matrix; actual browser identities sourced, simulations labelled; unknown environments remain gaps. |
| Z-009 · early | Can Firebase authentication succeed while private bootstrap fails or is unavailable? | Z-005 | S/T; live provider state not assumed. Account transaction/status map and success-versus-bootstrap-failure control; no claim of device readiness from auth alone. |
| Z-010 · early | What survives reload, browser replacement, storage failure or device revocation? | Z-009 | S/T; no live revoke, clear or re-register diagnostic. IndexedDB identity and registered-device authority map; synthetic missing/blocked/revoked cases fail closed with storage unchanged. |
| Z-011 · early (includes Z-012) | How does local manager selection reconcile with UID-bound pair membership and mismatches? | Z-009, Z-010 | S/T; includes former Z-012; no third production account. Both roles, wrong local selection and changed synthetic UID matrix; remote membership remains authority. |

### C — UI and runtime consistency

| ID / priority | Focused question | Prerequisites | Evidence and completion gate |
|---|---|---|---|
| Z-013 · early (includes Z-014) | Can one identity lifecycle failure explain both missing badge and legacy Settings visibility? | Z-003 | S/T; includes former Z-014. Separate DOM absence, hidden DOM and containment-not-installed cases; test badge and panel independently under matched load conditions. |
| Z-015 · early | Which capture and target handlers own each entry action? | Z-003, Z-005 | S/T. Event-order table with loaded/unloaded identity and pending/ready states; no duplicate-handler cause inferred from coexistence. |
| Z-016 · conditional | Which waits have a terminal, accessible recovery path? | Z-005, Z-013 | S/T + accessibility design, no UI implementation. Observed deadlines distinguished from proposed deadlines; bounded-feedback/focus/close specification for every selected wait. |
| Z-025 · early (includes Z-026) | Can retained shell and network-only assets produce a mixed executable revision? | Z-002, Z-003 | S/T; P-device required for historical cache attribution; includes Z-026. Cache/network matrix and fault experiment with byte fingerprints; same-revision load failure remains a competing explanation. |
| Z-027 · conditional | Do network, visibility or controller changes expose stale async completion? | Z-005, Z-018, Z-025 | S/T. Ordered event schedules identify authority generation and stale completion, with single-trigger controls. |
| Z-028 · conditional | Which update or rollback paths preserve saves and remain compatible? | Z-025, Z-019, Z-022 | S/T design; production action separately approved. Non-destructive options and stop conditions tied to tested cache compatibility; no automatic rollback/clear recommendation. |

### D — Pairing, sessions and recovery

| ID / priority | Focused question | Prerequisites | Evidence and completion gate |
|---|---|---|---|
| Z-017 · early (includes Z-020) | Which durable pair link and local recovery binding identify the same career? | Z-009, Z-010, Z-011, Z-021 | S/T; includes former Z-020. Pair/rivalry/UID/device/local binding invariants plus safe recovery tree; pair active explicitly separated from session ACTIVE. |
| Z-018 · early | What expires or vanishes when a private session is reloaded? | Z-017 | S/T; no capability publication. Capability memory, remote lifecycle and exact ACTIVE validation table, including no-session versus expired-session and wrong context. |
| Z-019 · conditional (includes Z-023) | Which interruption outcomes preserve the same career and each manager’s screen sequence? | Z-018, Z-021, Z-024 | S/T; physical debt explicit; includes Z-023. Before/after invariants for reload/offline/delayed peer; fresh session versus new rivalry distinguished; committed and draft state separated. |
| Z-021 · early | Where do canonical saves, recovery pointers and pending markers persist? | Z-003, Z-004 | S/T. Key/object ownership and write/normalization matrix; read-only snapshots or disposable synthetic fixtures only. |
| Z-022 · conditional | When is remote comparison read-only, and when may Candidate C Apply mutate local data? | Z-017, Z-021 | S/T design; no production Apply. Preview/explicit Apply/backup/exact rollback authority traced; no alternative destructive recovery path recommended. |
| Z-024 · early | Which Continue Career route wins for each exact authority and save state? | Z-015, Z-017, Z-018, Z-021 | S/T. Trace local fallback, pair continuation and shared entry; absent/mismatched/valid binding controls explain route without assuming data deletion. |

### E — Transfer usability and persistence

| ID / priority | Focused question | Prerequisites | Evidence and completion gate |
|---|---|---|---|
| Z-029 · early (includes Z-030) | Which transfer controls are unreachable at measured viewport and keyboard conditions? | Z-001, Z-003, Z-035 | O/S/T; physical coverage separate; includes Z-030. Screenshot provenance plus CSS/DOM constraint audit and reachability tests; unknown original viewport does not block labelled generic tests. |
| Z-031 · early | Can visible signing labels differ from canonical IDs before submission? | Z-003, Z-004 | S/T; mutation spy in disposable harness. Client build → selector IDs → provider validation traced; identical displayed text with/without valid IDs distinguishes H-05 from provider rejection. |
| Z-032 · conditional | Which transfer drafts, locks and replay witnesses survive interruption? | Z-018, Z-019, Z-029, Z-031 | S/T; P later; preserve private rival inputs. Draft versus provider-committed input and per-manager screen ledger tested across reload; idempotent locks and zero replay writes checked. |

### F — Physical verification design

| ID / priority | Focused question | Prerequisites | Evidence and completion gate |
|---|---|---|---|
| Z-036 · conditional | What authorized physical run can verify the supported mechanism and full recovery? | Z-008, Z-019, Z-022, Z-029, Z-031, Z-032, Z-034, Z-035 | Plan S/T; actual P and attestation remain separate gates. Executable one-season diagnosis and, when justified, current SSJR-2.1 three-season acceptance plan; each manager supplies own evidence. |

### G — Causal synthesis and lead decisions

| ID / priority | Focused question | Prerequisites | Evidence and completion gate |
|---|---|---|---|
| Z-037 · conditional (includes Z-038) | Which remedies address supported causes within every guard? | Z-033, Z-034 | Evidence-supported recommendation only; includes Z-038. At least two feasible alternatives or reason only one is viable; security/privacy/cost and regression obligations assessed per option. |
| Z-039 · conditional | Which claims withstand an independent evidence and contradiction audit? | Z-036, Z-037 | Independent review of actual O/S/T/P; no automatic pass. Reviewer cites inspected artifacts, scope, contradictory results and unresolved debt; author self-review cannot self-award independent verification. |
| Z-040 · conditional | What engineering decisions does the lead have sufficient evidence to make? | Z-039 | Lead receipt/decision evidence separate; tonight’s leadership package is not this completed block. Cause-specific dossier and accept/reject/defer decisions requested; unknowns dispositioned without forced completion of irrelevant blocks. |

## Identifier mapping and adaptation

All unlisted IDs map to themselves. Original titles and phases are retained in each ledger entry. Aliases remain searchable and excluded from active, completed and verified counts.

| Historical ID | Active unit | Reason |
|---|---|---|
| Z-007 | Z-005 | Error taxonomy is the observable output of the auth state machine. |
| Z-012 | Z-011 | Mismatch scenarios validate the same role/UID binding invariants. |
| Z-014 | Z-013 | Badge and containment share identity-module lifecycle; keep separate symptom tests within one report. |
| Z-020 | Z-017 | Recovery boundaries belong beside pairing authority, not a duplicate state map. |
| Z-023 | Z-019 | One interruption matrix covers reload, offline and delayed peer; Continue routing remains Z-024. |
| Z-026 | Z-025 | Cache policy and mixed-runtime experiments use one source/version matrix. |
| Z-030 | Z-029 | Layout observation and constraint analysis share one responsive report; missing photographs block only physical attribution. |
| Z-038 | Z-037 | Every remedy must carry its security/privacy/budget review; Z-004 remains an early diagnostic safety gate. |

Split a unit only when its questions require materially different evidence, independent acceptance or repeated sessions that cannot maintain one coherent report. Add a stable suffix or new ID with `supersedes`/`splitFrom`; never reuse an old ID. Reopening retains the old verdict at its old source fingerprint. Dropping irrelevant work requires a reason and lead/owner disposition; it is not completion.

## Research versus response

The roadmap never holds an urgent, independently supported access/data/security finding until unit 40. Prepare a narrowly scoped escalation with the exact mechanism, source, control, intervention, limitations and decision needed. Existing issue #426 and the prepared leadership package are references, not proof of acceptance. No worker assignment, application change, merge, Rules change, deployment or Lens implementation follows automatically.

The October 8 leadership transfer package may be ready while the investigation is incomplete. Its readiness gate and the later root-cause/engineering gates are deliberately separate in [TEAM_G_REVIEW_GATE.md](TEAM_G_REVIEW_GATE.md).
