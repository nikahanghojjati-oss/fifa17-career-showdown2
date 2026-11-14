# Showdown Gate independent audit, 9 Oct 2026: Team G lead verdict

**Decision: KEEP_SHADOW (agree with the audit's 71/100).** The Gate stays in shadow beside Validate POS20 and Validate Gameplay Fast. POS20 is unchanged. No promotion and no switch card until jobs 1043 and 1044 are merged and a fresh exit report is clean.

- Audit: [SHOWDOWN_GATE_AUDIT_2026-10-09_INDEPENDENT.md](SHOWDOWN_GATE_AUDIT_2026-10-09_INDEPENDENT.md). Nik uploaded it to the project on 2026-10-09 at 12:43 UTC; it is kept verbatim.
- Verified by: the Team G lead, 2026-10-09 ~12:55 UTC, against live main `e49add993d38ae778765ef8ee9d46875428b22ff` (r65). `.github/workflows/showdown-gate.yml`, `scripts/gate-compare.mjs`, `scripts/showdown-gate.mjs` and `scripts/gate-preempt.mjs` have not changed between the audited `963a9791` and `e49add99`.

## Findings checked against live code

| Finding | Lead check on e49add99 | Verdict | Job |
|---|---|---|---|
| F1: PR-head code gets Actions write | `l1-core` declares `actions: write`, checks out the PR head with default persisted credentials, and runs `node scripts/gate-preempt.mjs` from that checkout with `GITHUB_TOKEN`. Every later L1 step (`npm ci`, the tests) runs in the same job. The Physio (`gate-watchdog.yml`) already runs the same preempt sweep from a default-branch checkout with `persist-credentials: false`. | **Confirmed** | 1043 (Claude Sonnet; in progress) |
| F2: exit evaluator says ready on bad evidence | The audit's appendix, run on e49add99, prints `F2 ready= true` (10 copies of one head, mismatched profiles, a duplicated canary, and a failed infra run). The CLI derives `watchdog_reruns` from `run_attempt-1`. | **Confirmed** | 1044 (Codex) |
| F3: seal provenance and live head | The same appendix prints `F3 verdict= PASS` with `lane:"WRONG"`, `job:"WRONG"`, `run_attempt:99` and `prLiveHead:null`. | **Confirmed** | 1044 (Codex) |
| F4: unpinned actions and tool installs | Actions use major tags (`@v5`). Firebase tools are installed with `npm install --package-lock=false` and npx at pinned top-level versions only. | **Confirmed** (hardening) | 1045 (Claude Sonnet; after 1043) |
| F5: enforcement and exit semantics | Main has no branch protection (already in memory). Exit semantics are owner decisions. | **Agree** | Nik card when the Gate is otherwise ready |

## Corrections accepted
- **#395 L5 canary:** the earlier "stale Rules reference" explanation was wrong. T9 and M12 passed. L5 failed S13, B9 and M5-M7 because the planted transfer-history emulator failure propagated. #395 is one canary head carrying two planted failure categories, not two independent controls.
- **#396 infra wording:** a runner was acquired and setup then failed. User-facing text should come from the actual classification, not "GitHub gave it no machine". This is folded into 1044.
- **POS20 is not shown to be a required main check.** Main protection is off. Nothing changes until Nik decides.

## Owner decisions held for one card (not asked yet)
1. Canary independence: two different heads, or two planted failure categories.
2. Whether "full seal" means a full-route PASS.
3. Required-check scope, bypass policy and rollback, before any promotion.

These are asked only when 1043 and 1044 are merged and a fresh exit report would otherwise be ready.
