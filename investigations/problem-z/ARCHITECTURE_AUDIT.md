# Studio Z — Independent architecture audit and risk register

**Review date:** 2026-10-08. **Product source:** `bc77a0b934c3d43279f27f73a72db21c2db2b4f2`. **Inherited research head:** `740a706129d963ec2ff1c5f35c68e3c71b0a7a3f`. This is an independent examination of the inherited plan, followed by author self-review; it is not a second reviewer's verification of findings.

## Executive assessment

The inherited ten-phase, forty-block outline correctly separates owner observations, source, controlled tests and physical evidence, and protects production authority. Its weakness is operational: it inventories subsystems without an executable dependency model, gives every phase the same generic exit, postpones causal/test/capture design, and risks equating forty reports with useful investigation. It also defers lead review in ways that could delay response to a serious access blocker.

**Owner correction at 2026-10-08 13:03 EDT supersedes the original long-term-laboratory framing.** Studio Z is a finite Problem Z incident project. Research ends when there is sufficient evidence to choose safe fixes or explicitly identify the one remaining decision/evidence blocker. A bounded Studio within Factory G then implements only separately approved repairs, verifies the original failures, and closes. The question catalog is optional coverage, not a work quota. No standing research lab, indefinite monitoring or Lens project is a success requirement.

Keep 40 historical IDs; consolidate eight overlaps into **32 selectable work units in seven tracks**. Select one question at a time by decision value. Do not execute all units merely because they exist. The original Z-001 report remains the only research-complete unit. This assignment seeds architecture and evidence records without declaring the underlying investigation finished.

## Material findings from this review

1. **Startup failure has existing controlled support.** PR [#425](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/425), head `2b88d4ae727c20e4329ca7b74d92befd70872e2b`, reports three exact-main Chromium/emulator journeys failing at sign-in entry and a separate 0 ms/400 ms loader-response comparison. Source inspection supports the dependency ordering and latched flag. All six stored screenshot hashes match the report. This verifies artifact integrity, not the reported execution or original physical incident. Independently replicate the narrow mechanism before designing a repair. See S-11/T-01.
2. **Auth success is not game readiness.** Firebase user, Connected Account active status, registered device, chosen manager, provider membership, local recovery binding and exact ACTIVE session are distinct. Some non-connected outcomes are mapped to signed-out UI. No physical popup result or provider-state trace was obtained. See S-12.
3. **The signing message can originate before the provider call.** `pstcBuildSignings` requires canonical selector IDs as well as visible text; `pstcHandleAction` builds those rows before `lockSignings`. Describing this message as a server rejection is unsupported without a trace. Layout, canonical input and persistence need separate experiments. See S-14.
4. **Pairing survival differs from session survival.** The private session capability is page-memory state. Reload may legitimately require a fresh exact private session for the same rivalry and saved career. The existing acceptance proposal's language about the “same session” must not become a requirement to persist that capability. A new session is not permission to repeat permanent pairing, erase a save or redraw setup. See S-13/S-17.
5. **Public source delivery was sampled, not physical runtime proven.** Four public HTTP assets matched main byte-for-byte at 16:58 UTC. A successful Pages run for main was observed. Neither establishes loaded bytes on October 7, deployment history completeness, live Rules contents, or authenticated behavior. See S-10/P-01.
6. **“Read-only diagnosis” can accidentally write.** Account initialization can bootstrap a remote account; pairing initialization can register a device. Production observations must not call arbitrary `initialize`, sign-in, retry, attach or restore APIs as if they were passive readers. See S-12 and protocol.
7. **Existing tests are not interchangeable proof.** The inherited `private-account-auth-stage2i` lead concerns an older App Check/trusted-runtime boundary, whereas the inspected account path uses Spark browser transactions. Transfer replay tests mock provider responses at desktop/phone sizes and do not prove the affected tablet keyboard layout. Select coverage by current call path and inspect mocks. See causal model coverage map.

No repair, product test rerun, original screenshot inspection, physical reproduction or private provider diagnosis was performed in this review.

## Audit of every inherited block

Importance/value are qualitative and relative to the incident: **high** reduces an immediate access, continuity, integrity or authority uncertainty; **conditional** is useful only after an earlier discriminating result. “Available” below means source or inherited evidence exists, not that the block is completed. Revised prerequisites, exact questions, evidence gates and falsifiers are in the program and ledger. All rows inherit privacy and product guards; specific hazards are identified where material.

| Old ID | Importance / expected information value | Evidence available and main weakness | Decision / specificity, safety and completion improvement |
|---|---|---|---|
| Z-001 | High baseline; low value to repeat | Owner narrative and inherited screenshot descriptions; original images absent here | Preserve report; reopen only for new observations, not a new model's retelling. |
| Z-002 | High attribution | Live Git refs, Pages metadata, sampled public bytes; device history absent | Retain; separate source/publication/served/device revisions. Do not block local experiments on unavailable device history. |
| Z-003 | Highest near-term access value | Source and exact-main QA timing report | Retain and select next; intervention plus unrelated-delay control replaces generic module diagram as exit. |
| Z-004 | High harm avoidance | Guards, initialization and recovery code | Retain early; classify apparently passive calls with side effects. No permission shortcut. |
| Z-005 | High access diagnosis | Sign-in and initialization source | Absorb Z-007; require returned, thrown and never-settled outcomes across boundaries. |
| Z-006 | Conditional after popup-stage trace | Async calls exist; physical activation data absent | Retain; actual invocation/activation oracle, not “async implies blocked popup.” |
| Z-007 | High question, duplicated report | Error mapping shares Z-005 source | Alias to Z-005; taxonomy tied to state and UI transitions. |
| Z-008 | Conditional environment discriminator | Original browser details incomplete | Retain; test only justified environments, label engine simulation; do not assume tablet OS or installed PWA. |
| Z-009 | High auth-versus-account discriminator | Account envelope transaction and status handling | Retain; valid Firebase user + failed bootstrap contrast, no live account creation. |
| Z-010 | High identity/data risk | IndexedDB + provider device registration | Retain; missing/blocked/revoked synthetic states; no real revoke or storage clearing. |
| Z-011 | High private-role authority | UID-bound local role and provider membership | Absorb Z-012; role selection must not be mistaken for remote authorization. |
| Z-012 | High negative control, duplicated matrix | Shares Z-009–011 context | Alias to Z-011; both legitimate roles plus synthetic mismatch cases, no third production identity. |
| Z-013 | High observable access boundary | Static header, dynamic badge and common identity module | Absorb Z-014; distinguish node absent, hidden and initialization failed. |
| Z-014 | High symptom, shared lifecycle | Legacy panel builder + injected containment | Alias to Z-013; test separately from badge; common module is not proof of common cause. |
| Z-015 | High route discrimination | Capture/target handler source | Retain; event-order table and controls; no inference of conflict from multiple listeners alone. |
| Z-016 | Conditional repair requirement | Close control exists; some waits bounded, some not | Retain; inventory real deadlines and focus behavior before proposing UX. Not a design expansion. |
| Z-017 | High career identity | Pair link, rivalry slots and exact local recovery binding | Absorb Z-020; trace UID/device/save/profile/rivalry as one context. |
| Z-018 | High expected-versus-bug discriminator | Remote Joining memory state and exact expiry checks | Retain; no-session, expired, wrong-rivalry, unresolved action and ACTIVE distinguished. |
| Z-019 | High continuity | Existing reconnect source/tests, incomplete physical traces | Absorb Z-023; one interruption matrix; require same career, not necessarily same session capability. |
| Z-020 | High safety, duplicate state map | Pairing and recovery contracts | Alias to Z-017; forbidden destructive paths visible at every transition. |
| Z-021 | High data-integrity boundary | Canonical library, current save and pending markers | Retain early; distinguish draft, canonical local and remote committed data. |
| Z-022 | Conditional but mandatory if remedy touches reconciliation | Candidate B/C source | Retain; preview versus explicit Apply, backup and exact rollback; no live Apply experiment. |
| Z-023 | High matrix, duplicated interruption study | Same route and recovery consumers | Alias to Z-019; per-manager screen witnessing remains an independent invariant. |
| Z-024 | High Continue Career symptom value | Local resume, identity capture, pair and shared entry | Retain; bind route outcome to exact authority, not apparent restart. |
| Z-025 | High if drift implicated | Revision caches and network-only exceptions | Absorb Z-026; cache behavior plus byte-provenance experiment in one report. |
| Z-026 | High alternative, overlapping source | Public sample coherent; device cache absent | Alias to Z-025; coherent-source loader failure serves as competing explanation. |
| Z-027 | Conditional race discriminator | Online/offline/visibility events and forced initialization | Retain; controlled ordering and generation checks, not arbitrary retry storms. |
| Z-028 | Conditional remediation option | Rollback code and compatibility gaps | Retain only if selected remedy requires it; no cache deletion/update on real devices by default. |
| Z-029 | High tablet usability | Owner report, inherited photo text; no original image | Absorb Z-030; source audit can proceed, physical attribution cannot. |
| Z-030 | High source companion to photo | CSS, visual plate, canonical-input bridge | Alias to Z-029; test clipping, scroll and keyboard with recorded synthetic sizes. |
| Z-031 | High cheap validation discriminator | Exact client message and canonical ID code | Retain early in parallel with layout; provider-mutation spy identifies where rejection occurs. |
| Z-032 | High if refresh loses progress | Context reset, committed provider inputs and replay tests | Retain; split uncommitted drafts from locked/committed data, protect rival privacy. |
| Z-033 | Essential, wrongly late | Existing H leads and new contradicting/limiting evidence | Move to foundations and update incrementally; support multiple causal clusters. |
| Z-034 | Essential, wrongly late | Current deterministic/browser suites | Move early; specify controls/oracles before experiments; old test name does not prove current coverage. |
| Z-035 | Essential, wrongly late | Device evidence gaps already known | Move early; collect only irreducible safe fields with authorization; avoid creating accounts during inspection. |
| Z-036 | Conditional physical acceptance design | Current dual-screen and SSJR-2.1 rules | Retain; scoped incident acceptance first; longer run only if affected dependencies/governance require it. |
| Z-037 | High once a mechanism is supported | No independently verified incident cause yet | Absorb Z-038; alternatives with security/cost analysis; stop research when lead can choose responsibly. |
| Z-038 | Essential constraint, redundant end report | Guards available now | Alias to Z-037; continuous Z-004 safety checks remain, not delayed end-stage approval. |
| Z-039 | Essential final evidence quality | Original gate conflates reports and readiness | Retain; independent verification requires a cited reviewer/action; no self-award. |
| Z-040 | Essential decision, overly late for leadership | Owner has separately scheduled handoff | Retain for final cause-specific dossier; tonight's operational handoff is separate and can be ready now. |

## Finite execution and closure

Use four project stages: **diagnose → approved Factory G repair → verify → close**. This session is in diagnose/architecture preparation. Team G decides any bounded Studio work package, worker assignments, engineering branch, verification and release under governance; none is assigned or implemented here.

Before each question ask: “Which repair, acceptance or safety decision changes with its answer?” If none, remove it from the active queue. Stop expanding a causal cluster when one mechanism has an adequate differentiating control, competing serious explanations are addressed, repair options are clear and verification can be specified. Physical attribution uncertainty can remain explicit while a reproducible product defect is repaired with approval. Do not require proof that one cause explains all three runs.

After two nondiscriminating attempts with unchanged source/evidence, record the dead end and reframe or escalate the exact missing evidence. After each completed question, decide research-next, repair-ready, externally-blocked or closure-ready. There is no required session count. Do not spend a third session repackaging the same findings.

Success closure is conditional on all of these, with evidence references:

| Outcome | Acceptance needed before `closed-verified` |
|---|---|
| Reliable entry | Both legitimate managers can reach authorized game-ready state; targeted adverse conditions reach bounded actionable failure; Home sign-in remains accessible and legacy Offline App does not leak in the tested normal surface. |
| Career continuity | Continue Career and relevant reload/interruption cases preserve the same rivalry/career and committed progress; session reauthorization is explicit when required; no unnecessary permanent re-pairing/redraw or silent save destruction. |
| Usable transfers | At the affected measured tablet conditions, required inputs/actions are reachable; canonical selections submit correctly; invalid fields are explained; committed data and each manager's replay obligations survive the tested interruptions. |
| Safe integration | Exact approved source, selected inherited proofs, review and release evidence; guards preserved; genuine two-manager physical observations for affected journeys. Source/CI/deployment alone insufficient. |
| Owner/lead acceptance and shutdown | Team G records verification and Nik accepts incident outcomes or explicitly adjudicates remaining debt. Publish one final transferable closeout, archive the record and retire temporary Studio tasks/diagnostics. Stop routine research and Lens work. |

If unresolved risk is accepted without verified repair, use **closed-inconclusive / owner-accepted limitations**, never “fixed.” A later recurrence opens a scoped new incident or explicitly reopens this one with new evidence. Merely planning closure does not close #426.

## Risk and uncertainty register

| ID | Risk / present evidence | Response and owner of decision |
|---|---|---|
| R-01 | Severe manager access blocker; O-04–06, S-11/T-01 | Prioritize X-01 and auth boundary isolation. Lead decides urgency; do not wait for all catalog units. |
| R-02 | Data loss from misdiagnosing UI/session state; O-01/03 | Snapshot categories only; never clear, abandon, revoke or Apply as routine diagnosis. Lead/owner must authorize destructive action separately. |
| R-03 | Treating a manager label as UID/device/session authority | Model exact bindings and negative controls; no alternate-account workaround. Security review follows any proposed authority change. |
| R-04 | Public disclosure of private capability, UID, email or saves | Allowlisted categorical diagnostics, synthetic fixtures and public-code hashes only. Redact before any repository write or handoff. |
| R-05 | Mixed source, deployment, device or Rules revisions | Fingerprint relevant files; public asset and workflow observations have timestamps/scopes. Reopen affected claims on drift. |
| R-06 | Research or Lens expands beyond incident benefit | One question at a time; conditional catalog; Lens optional, design-only now; stop rule and explicit closure. |
| R-07 | 8 PM schedule mistaken for authority, acceptance or deployment grant | Handoff receipt states require links; no timed automatic transfer or credential change. |
| R-08 | Report counts masquerade as reliability or SSJR/MDP score | Separate documented, independently verified, physically linked and fixed/accepted outcomes. Aliases never count as completion. |
| R-09 | “Inspect state” executes bootstrap/device writes | Inspect source first; passive public HTTP only in this review. Any initializer on production is an action requiring a separate scoped decision. |
| R-10 | Test harness hides dependency races or supplies canonical IDs directly | Inspect injections/mocks; keep unchanged-source controls and report engine/environment. Imported repeats share one lineage, not independent evidence. |
| R-11 | Device evidence unavailable / original screenshots missing | Mark blocked only the physical attribution; continue useful safe discrimination. No invented browser, dimensions or chronology. |
| R-12 | Handoff files become a second drifting database | One canonical GitHub ledger/provenance; one immutable self-contained derivative file at each closeout, stamped to its commit. Never edit the export as live authority. |
| R-13 | Harmful current recovery wording encourages reset | Record source wording as a hazard, not endorsed advice; incorporate into later authorized repair review. |

## Adversarial self-review — weaknesses found and design changes

| Scenario | Weakness actually found | Correction and remaining limitation |
|---|---|---|
| Repeated speculation | Original H list has no evidence fingerprint or lineage | Stable hypothesis records; unchanged-evidence counter and shared lineage. Author must still honestly record failed attempts. |
| Contradictory popup tests | Original umbrella can conflate popup and bootstrap | Trace invocation/result/auth/connected/device separately; successful popup rejects only the popup explanation for that attempt. |
| Runtime drift | Top-level handoffs carry old refs and r18; current source is r62 | Freshness check against live refs + per-source fingerprint. Original device revision remains unknown. |
| Urgent defect | Lead review deferred until full dossier | Separate critical escalation path; #425 support placed prominently in handoff. No new lead receipt is claimed. |
| Seventy-session horizon | Session-count framing rewards persistence | Finite decision gates, no mandatory completion of catalog, two-attempt reframe; an unusually long run needs lead/owner scope review, not passive extension. |
| Failed experiments | Generic completion could count “unanswerable” as finished | Declared gate unmet means blocked; record what was learned and redesign the oracle. |
| Missing Lens | Native snapshot cannot self-refresh | GitHub checkpoint sufficient; no Lens dependency, polling or heartbeat. |
| Misleading progress | One count cannot convey physical verification | Distinct evidence scopes and verification states; public HTTP P never counts as physical incident proof. |
| Authority conflict | Old triage wording suggests Studio establishment/worker decisions | Research recommendations are not assignments; schedule is not acceptance; current implementation flag remains false. |
| Unexpected cause | Serial subsystem phases protect the first story | Adaptive competing hypotheses; aliases/splits and reopening preserve old evidence without defending it. |
| Efficient closure | Initial mission described a long-term lab | Owner's finite-project correction embedded in roadmap, protocol, gate, ledger and handoff; Lens cannot block closure. |
| Interrupted session | Prior chat work could be lost without a transferable artifact | Mandatory one-file closeout/checkpoint; if abruptly interrupted, next session exports the honest latest saved state, never invented completion. No chat-end automation capability is claimed. |

This is a self-review of the design, not ten successful product tests. No independent reviewer has accepted this architecture package yet.
