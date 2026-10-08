# Problem Z — Research session operating protocol

**Scope:** Research only, on `investigation/problem-z-z-studio-2026-10-08`. **Authority:** User directs the research agenda; Team G Lead (Claude Opus 5.5) owns later implementation/assignment/publication decisions. **External scheduling:** none.

## Definition of an atomic session
A research session aims to investigate exactly **one Z-### block**, with one attributable artifact. It may read other modules to understand the block, but its conclusion must not falsely close adjacent blocks. If a question requires deeper investigation, subdivide the block in the ledger, add follow-up sessions, and retain uncertainties. The starting 40 blocks are a research map, not a promise that every question can be answered in exactly 40 chats.

## Mandatory first actions in each future chat
1. Confirm intent to continue Problem Z research (not gameplay development). Read [program](RESEARCH_PROGRAM.md), [ledger](RESEARCH_LEDGER.json), [next checkpoint](NEXT_RESEARCH_SESSION.md), [evidence register](EVIDENCE_REGISTER.md), the immediately preceding block and any relevant lead feedback.
2. Fetch live `main` and the exact research branch head; capture current SHAs. Reconcile any source/deployment drift rather than treating an old recorded SHA as live authority.
3. Read `AGENTS.md`, `CURRENT_PRODUCT_GUARDS.json`, POS20/POS10 relevant controls and current project handoff. These remain authoritative over the research notes.
4. Select the ledger's `nextBlock`, unless the user redirects or safety-critical new evidence justifies an explicit resequencing entry. Never claim an already closed block is unrevised; annotate a recheck/revisit if evidence changed.
5. State one block question, relevant hypotheses, required proof tier, safe actions, prohibitions and deliverable. Distinguish static investigation from authorized real-device observation.

## Research mechanics: OBSERVE → MODEL → HYPOTHESIZE → PLAN → (SAFE) ACT → VERIFY → LEARN → RECOVER

- **OBSERVE:** Ground claims with precise source paths and commit SHA, captured test output, or user-observed text. `main` code does not automatically describe what was running on each device.
- **MODEL:** Diagram the relevant actors and trust boundaries (Firebase user, Connected Account, registered device, chosen manager, pairing, ACTIVE session, local save, canonical screen, service worker).
- **HYPOTHESIZE:** Keep alternative explanations and specific falsifiers. Reject any conclusion that merely fits one symptom while contradicting others.
- **PLAN:** Prefer inspecting source, tests, public GitHub metadata or an isolated harness. Request physical-owner action only if source/simulation cannot answer the question.
- **ACT:** Research may add or update Markdown/JSON under `investigations/problem-z/` on the dedicated branch. No mutation of game code, prod Firebase, auth settings, service workers, existing saves, open production PRs, or `main` is granted by this protocol.
- **VERIFY:** Verify citations, provenance and contradiction handling; a static-code finding is S, not a reproduction T/P. Do not claim CI, auth, deployment, physical evidence or bugs are fixed without executing and documenting such proof.
- **LEARN:** Update evidence, hypothesis standings, research output and open questions. Two failed attempts under unchanged evidence require reframing.
- **RECOVER:** On missing tools, permission, or evidence: mark `blocked`, document exact blocker, record the safest next step. Never falsify a green result.

## Research status transitions
`planned` → `in-progress` → `research-complete` (or `blocked`), and `research-complete` → `revisit-required` if contradictory new evidence surfaces. Research-complete **does not mean** independently validated, lead approved, or resolved. Ledger tracks review status separately. Evidence gaps are allowed when prominent and specific.

A block may be marked `research-complete` only when:
- A unique `research-blocks/Z-###_*.md` exists and cites source context at an explicit head.
- The question is answered to the available evidence level, or demonstrably unanswerable without an exact missing piece.
- Observed / supported / inferred / unknown are separated.
- At least one falsifiable follow-up or justified negative finding is preserved.
- Privacy/billing/security and production isolation are respected.

## Mandatory end-of-chat checkpoint
1. Save/update one block report (or blocked work log).
2. Update `RESEARCH_LEDGER.json` status and history **only after** the artifact exists; do not count a half-investigated section as complete.
3. Update `EVIDENCE_REGISTER.md` with new positive/negative facts, contradictions and evidence gaps; never paste raw secret/PII.
4. Update `NEXT_RESEARCH_SESSION.md` with exact next Z-block, its question, prerequisite files, 3–6 specific actions and exit test.
5. Re-read research files on the branch; compare `main...research-branch` and confirm ONLY investigation paths changed. Do not merge, deploy or create implementation PR without separate Team G Lead authorization.
6. Give the user a concise recap: block investigated, new evidence, what remains uncertain, links and what next chat will do.

## Citation and privacy standard
Use GitHub blob permalinks/line links for S claims, explicit test commands/environment/log snippets for T claims, and authorized physical evidence provenance for P claims. Label screenshots O with description/date and attach **only sanitized descriptions** to this public repository. No account emails, raw tokens, Firebase UIDs, browser fingerprint, device IDs, private invite codes, complete saves or unsupported personal claims.

## Final review trigger
Completion means the research questions were responsibly investigated, not necessarily that the root cause is known or remediation is ready. The Team G Lead packet is prepared when Z-040 and the [review gate](TEAM_G_REVIEW_GATE.md) are satisfied or explicit unresolved matters are listed for lead adjudication. Creating GitHub Issue #426 did not submit a final reviewed dossier.
