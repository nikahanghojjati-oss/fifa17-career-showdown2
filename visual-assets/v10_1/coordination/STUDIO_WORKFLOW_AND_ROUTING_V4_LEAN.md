# STUDIO WORKFLOW AND ROUTING V4 LEAN

Status: ACTIVE
Date: 2026-09-27
Owner: Nik
Program Coordinator / Product-Truth Guard / Repo Steward: GPT-5.6 Sol
Lead Visual Producer + default builder: Claude Opus 5.5 in Claude Project

This file supersedes STUDIO_WORKFLOW_AND_ROUTING_V3.md §§2–5a wherever they conflict.

## Budget policy
- Approximate Cloud credit remaining at reset: $78.
- Reserve $43–50 for the main project.
- All remaining visual Cloud work across all 10 screens: target $30, hard stop $35.
- Expected visual Cloud spend under this routing: $0–10.
- Claude Code Cloud is contingency only and requires Nik approval for each use.

## Free lanes first
- Sol: product truth, branch-safety review, state/docs/commits, exact non-rendered edits of roughly <=40 lines, Cloud launch prompts when contingency is needed, budget ledger.
- Nik / ChatGPT Images: image assets.
- Claude Project chat: default visual builder. Direction, implementation, Playwright render/QA and producer review.
- Claude Code Cloud: contingency only when Claude Project cannot finish or a long multi-file production integration materially warrants it.

## Per-screen process
1. One Claude direction/build card per screen or batch, <=60 lines. Reuse the Transfer kit where appropriate.
2. One Claude Project build, normally Opus 5.5 High: change, render, QA and return commit-ready files, max 4 DPR1 screenshots (key desktop, alternate state, mobile, blur) plus QA JSON. Sol product-truth checks and commits.
3. Nik owner look: ACCEPT or one focused correction round. Remaining polish is deferred.

## Standing cuts
- No prototype-then-integrate for later screens. Transfer alone keeps the existing prototype.
- No separate Stage Engine. Use CSS transitions/cue classes with reduced-motion support.
- QA asserts only: zero console errors; controls reachable at 1366x640 and 390x844; control/font sizes; AB1 no four-sided-border boxes; privacy no rival data; strings/IDs unchanged.
- Handoffs stay one page unless Nik asks for long analysis.
- Optional polish is dropped by default: CP1R R1 hair-rim pass, P6 contact shadows, DPR2 evidence.
- Opus 5.5 Medium is the default only for paid Cloud contingency; High is reserved there for Transfer production integration; Extra High is not used in Cloud.

## CP1P execution
CP1P runs in one fresh Claude Project chat at Opus 5.5 High with zero Cloud-credit spend.

Do: B0, M2, M3, M5, M4, P1, P2, P3, P4, P5, R3 and A1 (Nik Window-pose denoise export).
Drop: A2 and P6.

The older CP1P Part A/Part B Cloud split, its paid budgets, expanded evidence list and SW1 routing are superseded. The detailed geometry/material/mechanical values in the CP1P brief remain authoritative unless this V4 file explicitly overrides them.

Main is read-only. No PR or merge from the build chat. Sol reviews product truth and performs durable repository commits after return.
