# Showdown QA & Reliability review branch

Branch: `qa/showdown-qa-review-2026-10-04`  
Base: `main@8abc561601b75a5a18f03a13ae93be991c5c12bc` (v1.9.1 r53)  
Created: 2026-10-04 ET  
Owner: Nik  
Purpose: read-only QA evidence, historical findings, factory-system review, and a self-contained packet for independent Claude/Cloud review.

## Safety boundary

This branch is not a product candidate, factory branch, recovery branch, release branch, or implementation authority.

Nothing in `showdown-qa/` authorizes changes to:
- `main`
- `factory/v1-wtt5ye`
- `factory/gameplay-v1`
- `gameplay/recovery-v1`
- any Claude/Cloud working branch
- Firebase/provider settings or production data.

The reports are QA input. Any proposed change must be independently reconciled against live GitHub state and then go through the existing product/integration authority.

## What is in this packet

1. `reports/2026-10-04-factory-system-master-review.md`
   - Current Team V and Team G factory review.
   - Claude leadership review.
   - GPT-5.6, GPT-6.1 Work, Astra, Opus 5.5, Sonnet 5.5, Fable and Codex routing evidence.
   - Current control-plane defects.
   - Post-5.2 "one truth, many workers" proposal.
   - Blind-review and factory-lifecycle recommendations.

2. `reports/2026-10-04-historical-findings-ledger.md`
   - Consolidated QA/reliability findings from earlier Career Mode Showdown QA work.
   - Separates live-verified findings from historical/project-record findings.
   - Preserves the recurring authority-drift, navigation, identity, physical-proof and recovery lessons.

3. `reports/2026-09-25-navigation-reliability-reconstructed.md`
   - Reconstructed record of the September 25 QA navigation review.
   - The original temporary QA branch is no longer resolvable on GitHub, so this file is explicitly marked reconstructed rather than pretending the old branch is still live.

4. `handoffs/2026-10-04-claude-cloud-review-packet.md`
   - Shorter packet for Claude/Cloud.
   - Requests a proposal only.
   - No implementation or merge authority.

5. `SOURCE_MANIFEST.md`
   - Evidence provenance, exact current SHAs observed, live files reviewed, historical Library sources, and known retrieval limitations.

6. `QA_PROJECT_CHARTER_SNAPSHOT.md`
   - Snapshot of the QA workstream boundary used for this packet: evidence-driven review, no product-code mutation from QA, exact-head discipline, and Sol/product authority separation.

## Most important current finding

The factories themselves are working. The highest current systems risk is control-plane truth drift.

Examples observed on 2026-10-04:
- Team G JOB-29 status still said IN PROGRESS while PR #357 was merged.
- Team G board still listed JOB-31 as NOT WRITTEN while PR #350 was merged.
- Team G board still listed JOB-33 as NOT WRITTEN while PR #358 was merged.
- JOB-27 status still said READY / PR none while PR #362 existed and the board showed active progress.
- Root `AGENTS.md` says POS20 is active while `CURRENT_PRODUCT_GUARDS.json` still says `"operatingSystem": "POS10"`.

Treat these as PROCESS_DEFECT evidence, not as permission to alter product behavior.

## Recommended Cloud entry point

Point Claude/Cloud to this branch and use:

> Review branch `qa/showdown-qa-review-2026-10-04` of `nikahanghojjati-oss/fifa17-career-showdown2`. Read `showdown-qa/README.md`, then `showdown-qa/handoffs/2026-10-04-claude-cloud-review-packet.md`, the two reports under `showdown-qa/reports/`, and `showdown-qa/SOURCE_MANIFEST.md`. This is read-only review material. Independently reconcile live main, recovery, factories, PRs and exact-head evidence before accepting any claim. Return a governance/reliability proposal only. Do not change main, either factory, recovery, provider settings, scoring, privacy, storage, pairing or destructive-apply behavior.

## Status vocabulary

The packet recommends distinguishing:
- `WORKER_DONE`
- `LEAD_ACCEPTED`
- `INTEGRATED`
- `CANDIDATE_GREEN`
- `DEVICE_PROVEN`
- `PRODUCTION_PROVEN`
- `CLOSED`

This is a proposal, not current project authority.

## Update rule

Future QA findings may be added to this branch under `showdown-qa/` only. Product code should never be added here.
