# CLAUDE OPUS 5.5 — EFFORT POLICY FOR SHOWDOWN VISUAL V10.1

Status: ACTIVE RECOMMENDATION
Date: 2026-09-27

## Official Anthropic effort vocabulary

Anthropic documents the Opus 5 family with:
- low
- medium
- high
- xhigh
- max

For this project, treat any UI label "Extra High" as `xhigh` if it maps to Anthropic's xhigh effort.

"Ultra Code" is not an Anthropic-documented effort level in the official effort parameter. If your client exposes an Ultra Code preset, treat it as a client-specific coding mode, not as a known higher reasoning tier. Do not use it for V10.1 art direction unless a task specifically becomes implementation-heavy and the client documents what it changes.

## Project default

### COV-01 onboarding + focused art-direction review
Use: `xhigh / Extra High`

Why:
- this is a one-time high-leverage review;
- it must integrate a research bible, current visual authority, screen spec, screenshots and approved assets;
- mistakes can propagate into the golden frame;
- it benefits from deeper multimodal reasoning;
- it is bounded enough that max effort is unlikely to justify its extra cost/latency.

### Routine follow-up visual review
Use: `high`

Examples:
- checking whether Sol applied a bounded spec delta correctly;
- reviewing one desktop/mobile pair;
- reviewing a small asset-fit question;
- checking a limited CSS/layout regression.

### Repetitive QA / narrow comparison
Use: `medium`

Examples:
- compare exact screenshots against an already-frozen checklist;
- inspect one state for missed labels/crops;
- verify that a known issue is fixed;
- summarize a known delta packet.

### Major deadlock / new complex art-direction problem
Use: `max`

Use max only when:
- COV-01 at xhigh exposes a genuinely unresolved high-impact camera/spatial problem;
- Claude must reason across several contradictory visual constraints;
- a branch-wide implementation failure needs a deep root-cause analysis;
- Astra is unavailable and the project is blocked without the strongest possible Claude pass.

Do not run every task at max. Anthropic warns that max can have diminishing returns and overthink simpler work.

### Coding-heavy autonomous implementation
Preferred starting effort: `xhigh`

If Claude is later explicitly authorized as a builder on a dedicated task branch:
- use xhigh for long-horizon multi-file work;
- use max only for unusually difficult blocked implementation;
- use high for bounded CSS/DOM changes;
- use medium for small deterministic fixes.

## Current recommendation to Nik

For the first Claude session:
`Claude Opus 5.5 + Extra High / xhigh effort`

Do NOT choose max for the first pass.

Reason:
Anthropic reports that Opus 5.5 is already unusually strong at medium/default effort, while xhigh is intended for work needing more depth than the default. Max is best reserved for tasks where maximum capability clearly matters more than token/latency cost and may overthink simpler problems.

## If the interface only offers these labels

- Medium -> medium
- High -> high
- Extra High -> xhigh
- Max -> max
- Ultra Code -> client-specific; do not assume it is above max reasoning

Choose:
`Extra High` for COV-01.

## Escalation rule

Start COV-01 at xhigh.

Escalate to max only if one of these occurs:
1. Claude explicitly identifies a high-confidence unresolved contradiction in the V10.1 authority;
2. the asset-fit problem cannot be resolved by composition/crop analysis;
3. the camera/spatial spec remains ambiguous after one bounded revision;
4. Sol and Claude disagree on a material visual issue and Astra is still unavailable.

Otherwise remain at xhigh or step down to high for subsequent review turns.

## Conservation rule

Effort is not a quality score.

Higher effort does not grant more project authority.
A medium-effort Claude finding can be correct.
A max-effort Claude finding can still be rejected by product truth, Astra's later art direction, or Nik's taste judgment.
