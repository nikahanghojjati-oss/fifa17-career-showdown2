# WORKER MODEL DECISION V10

Decision date: 2026-09-27
Goal: highest practical visual-implementation quality at reasonable usage/cost with minimal worker complexity.

## Recommended architecture

ART DIRECTOR / SYSTEM BRAIN
GPT-5.6 Sol — High — current Chat

PRIMARY WORKER
GPT-6 Sol — High — ChatGPT Work

OPTIONAL EXCEPTION ONLY
GPT-6 Astra — Medium or High — only for a critical frozen slice that GPT-6 Sol High fails or for one unusually difficult whole-system reconciliation.

LUNA
Not a primary V10 visual builder.

## Why GPT-6 Sol High is the default worker

OpenAI positions GPT-6 Sol for complex coding and agentic workflows.

V10 worker tasks are exactly that:
- open current repository;
- inspect existing HTML/CSS/JS;
- implement a frozen golden composition;
- preserve behavior;
- integrate assets;
- build state variants;
- adapt desktop/mobile;
- run browser QA;
- fix bounded defects.

High is the default reasoning level because OpenAI guidance recommends medium/high for diagnosing, comparing options, writing plans and reasoning through code.

xhigh/max are NOT default.

OpenAI recommends xhigh/max only when representative evaluations show the quality improvement is worth added latency and usage.

V10's packets deliberately remove much of the ambiguous art-direction reasoning from the worker. That makes High the appropriate first setting.

## Why not Astra as the regular worker

GPT-6 Astra is OpenAI's most capable model for the hardest end-to-end work.

However, the public API token rates are:
- Astra: $10 input / $50 output per 1M
- Sol: $2 input / $10 output per 1M

That is a 5x price ratio on those token rates.

Work allowance accounting is separate from API billing, but OpenAI also notes Astra can consume included Work/Codex allowance faster depending on reasoning, task length and output.

Since Sol receives a frozen visual target rather than an open-ended design problem, paying the regular Astra premium is unlikely to be the best default tradeoff.

## When Astra earns an escalation

Use Astra only when one of these is true:

A. GPT-6 Sol High fails the SAME frozen implementation packet twice in a way that indicates reasoning/cross-file synthesis limits rather than a bad blueprint.

B. A slice requires unusually difficult repository-wide reconciliation, browser computer use, or large-scale technical diagnosis.

C. We want one high-stakes independent red-team review of a near-final architecture.

Start Astra at Medium for a well-specified task.
Raise to High only if the task genuinely requires deeper tradeoffs.
Do not default to xhigh/max without evidence.

## Why Luna is removed from primary building

OpenAI positions GPT-6 Luna for focused, high-volume efficiency.

That is useful for repetitive or well-scoped work, but Showdown's primary visual implementation still requires nuanced cross-file reasoning, visual fidelity judgment, responsive interpretation and debugging.

Project evidence already showed Luna could follow explicit assets/state rules but tended to reduce premium art direction into safer/basic web composition.

More Luna reasoning effort does not change the basic worker-fit problem enough to justify making it primary.

Possible later Luna work:
- repetitive screenshot regression;
- accessibility checklist;
- isolated mechanical CSS edits;
- state-coverage checks.

Because Nik prefers a simple architecture, V10 does not require Luna at all.

## Why current Sol stays the art director

Keeping art direction in this GPT-5.6 Sol High conversation preserves:
- accumulated Showdown visual context;
- owner taste feedback;
- reference understanding;
- V10 system authority;
- independent review separation from the worker.

The worker should not grade its own art direction.

## Recommended normal flow

NIK
-> GPT-5.6 Sol High: product sync + references + golden composition + art direction
-> GPT-6 Sol High Work: production implementation
-> GPT-5.6 Sol High: independent browser visual/product review
-> NIK: final taste approval

## Efficient fallback flow

If GPT-6 Sol High passes:
do not involve another model.

If GPT-6 Sol High fails for implementation reasons:
one Astra Medium/High escalation.

No parallel-model swarm by default.

## Summary

BEST DEFAULT WORKER:
GPT-6 Sol / High / ChatGPT Work

BEST QUALITY ESCALATION:
GPT-6 Astra / Medium first, High if necessary

NOT RECOMMENDED DEFAULT:
Luna Max
Astra Max
multi-agent parallel implementation

V10 optimizes quality per successful screen, not raw token cheapness or raw model capability.