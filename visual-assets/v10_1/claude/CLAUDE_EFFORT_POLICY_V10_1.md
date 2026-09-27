# CLAUDE OPUS 5.5 — EFFORT POLICY FOR SHOWDOWN VISUAL V10.1

Status: ACTIVE
Date: 2026-09-27

## Current recommendation

For COV-01 use:
`Claude Chat Project + Opus 5.5 + Extra / xhigh`

This supersedes the earlier recommendation to run COV-01 in Claude Code Ultracode.

## Why Extra is the best first choice

COV-01 is:
- high leverage;
- multimodal;
- document-heavy;
- visually analytical;
- bounded;
- read-only.

Anthropic describes Extra high / xhigh as the setting for complex coding and agentic work that needs deeper reasoning than High without the full token cost of Max.

COV-01 benefits from that additional depth, but it does not need autonomous repository orchestration.

Nik's Claude Chat UI also marks Max as substantially heavier usage. Save Max for a specific unresolved problem.

## Surface routing

### Claude Chat Project + Extra
Use for:
- COV-01
- art-direction review
- research synthesis
- camera/staging critique
- mobile composition review
- owner-reference analysis
- reviewing a frozen visual specification

### Claude Chat Project + High
Use for:
- routine bounded follow-up critique
- checking one revised desktop/mobile pair
- checking a small spec delta
- validating one asset-fit correction

### Claude Chat Project + Max
Use only for:
- a difficult unresolved high-impact contradiction
- a correctness-critical visual/product-truth conflict
- a single hard decision where Extra did not converge

### Claude Code + Ultracode
Use for:
- broad autonomous engineering work
- repo-wide audits
- large codebase migrations/refactors
- substantial multi-lane technical tasks where dynamic workflow orchestration is useful
- later Claude-owned implementation only when write ownership is isolated and explicitly authorized

Ultracode is real in Claude Code, but availability does not make it the preferred mode for a bounded art-direction review.

## Important distinction

Ultracode is not simply a stronger answer-quality setting for ordinary visual review.

Its value is workflow orchestration around substantive technical tasks.

For COV-01 the persistent context and lower write risk of a Claude Project are more valuable.

## Quota discipline

Use the lowest effort that reliably preserves quality.

Current routing:
- COV-01: Extra
- routine visual review: High
- repetitive deterministic QA: Medium if available
- rare unresolved hard judgment: Max
- large autonomous Claude Code workflow: Ultracode

Effort changes depth and usage, not project authority.
