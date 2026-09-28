# STUDIO WORKFLOW AND MODEL ROUTING V3

Status: ACTIVE on commit by Sol · Version: V3.1 (adds §5a Sol Work lane) · Date: 2026-09-27 · Owner: Nik
Supersedes: the model and effort tables and the "Opus decides, Sonnet executes" rule in `STUDIO_WORKFLOW_AND_ROUTING_V2.md`, and any Sonnet routing in `MODEL_ROUTER_V10_1.md`. The rest of V2 (production loop, screen tiers, reuse, likeness standard, ChatGPT Work lane W1) stays in force.

## 1. Owner decision (2026-09-27)

- **Sonnet 5 is removed from this project on every Claude surface** (Project chat and Cloud). CP1 on Sonnet 5 High took ≈ 50 min and ≈ $15 for one bounded checkpoint, and that is not acceptable. Sonnet 5 may be used again only after Nik writes explicit approval for a named task.
- All Claude work runs on **Opus 5.5** at **Medium, High or Extra high**, chosen per task below. Max is never used without Nik's written approval.
- If Opus 5.5 is not offered on a surface, **stop and ask Nik**. There is no automatic fallback to another model.

## 2. Routing table

| Work | Surface | Model | Effort |
| --- | --- | --- | --- |
| New world set or screen-family direction | Claude Project | Opus 5.5 | Extra high |
| Final owner gate of a Tier S screen | Claude Project | Opus 5.5 | Extra high |
| Reuse-screen direction, reference intake, asset gate review, build briefs, checkpoint verdicts | Claude Project | Opus 5.5 | High |
| Verify-only re-review of a revision against listed gates | Claude Project | Opus 5.5 | High |
| Document tidy-ups, Tier B packages (Loading, Legacy), handoff reconciliation | Claude Project | Opus 5.5 | Medium |
| Revision from exact deltas; asset intake mechanics; evidence re-capture | Cloud | Opus 5.5 | **Medium** |
| Static checkpoint build from a finished brief where the builder must solve layout or composition | Cloud | Opus 5.5 | High |
| First-of-kind engine (Stage Engine v1), first production integration | Cloud | Opus 5.5 | High |
| Rescue after a High Cloud run fails the same item twice | Cloud | Opus 5.5 | Extra high, **with Nik's approval** |
| Coordination, product truth, branches, commits | ChatGPT | GPT-5.6 Sol | current |
| Images | ChatGPT image generation | Nik | per `LIKENESS_IMAGE_WORKFLOW_V1.md` |

Choose effort by the **expected total cost of the task**: tokens × loops × wall-clock. Per-token price alone is the wrong measure. Use Medium when the brief already contains the exact answer. Use High when the builder must make judgment calls. Opus 5.5 costs more per token than Sonnet 5; the bet is fewer loops and tighter briefs. Section 5 measures whether that bet pays.

## 3. Stop budget (mandatory for every Cloud task)

Every Cloud brief header carries:
```
STOP_BUDGET: <minutes> min wall-clock / $<credit> credit
PRIORITY_ORDER: <items, most important first>
```
Defaults (Claude may set lower; higher needs Nik's OK):

| Cloud task type | Budget |
| --- | --- |
| Revision from exact deltas | 30 min / $6 |
| Static checkpoint build | 45 min / $10 |
| First-of-kind (Stage Engine v1, first integration) | 60 min / $15, Nik confirms at launch |

Rules:
- The agent records its start time with `date`, commits in priority order, and at **80%** of the time budget stops adding scope, commits, and returns a result that marks unfinished items `NOT DONE`. At **100%** it stops.
- The Cloud agent cannot see credit, so **Nik watches the credit meter and stops the session at the credit cap**.
- If one item fails its gate twice, it is marked `BLOCKED` and returns to Claude for a re-brief. There is no third attempt in the same session.

## 4. Brief economy (Claude's side of the cost)

The CP1 overrun was partly a brief-design problem. That brief was 452 lines and bundled asset intake, a full build, 11 evidence sets, 16 captures and an upscaler install attempt into one session. From now on:
- One Cloud session does one kind of work: intake **or** build **or** revision. Split anything bigger.
- Revision briefs stay ≤ 150 lines and contain exact values, not goals to tune toward.
- Evidence covers only the frames and assets that changed.
- No heavy installs (ML models, torch, GPU stacks). If an optional tool isn't already there, use the named fallback.
- Every numeric self-QA claim must be measured by an assertion in the QA script, not asserted by hand.
- The Git commit SHA is the candidate fingerprint; combined-hash requirements are dropped.

## 5. Model announcement before any transition chain

Before any chain of transitions (Claude → Sol → Cloud → Claude → Nik …), Claude's final message includes a **Next steps** table naming the model and effort for **every** step, plus the stop budget for any Cloud step. Nik confirms before the Cloud step starts. No step may run on a model or effort not announced in that table without Nik's OK.

Every Cloud result records: model, effort, start and end time, elapsed minutes. Nik adds the credit used. After three Cloud tasks under V3, Claude reviews minutes and credit per task against CP1 (≈ 50 min, ≈ $15) and proposes adjustments.

## 5a. ChatGPT Work lane: GPT-5.6 Sol · Work mode · High (V3.1, owner decision 2026-09-27)

Nik has approved delegating a regular share of work to GPT-5.6 Sol in ChatGPT Work mode at High effort, so Claude and Cloud aren't carrying everything. This replaces V2's rule that W2 overflow runs only near Claude's usage limit. The lane is now a standing default for the tasks below.

| # | Delegated to Sol Work · High | Why it belongs there |
| --- | --- | --- |
| SW1 | **Gate pre-check** of every Cloud result: read `CLOUD_BUILD_RESULT*.md` and `render_qa_report.json`, and compare every measured value against the brief's numeric gates. Return PASS, FAIL or MISSING per gate, plus a list of anything Cloud claimed without measuring. | Mechanical, and needs no taste. It cuts Claude's review down to the visual items only. |
| SW2 | Exact mechanical deltas that need no rendering: a string, number, CSS value, file swap, manifest entry or doc edit that Claude has specified exactly | No Cloud session is needed for a one-line change |
| SW3 | Web-access tasks (previously W1): licence lookups, Wikimedia Commons fetches, flag-set sourcing | Claude's workspace has no web reach for these |
| SW4 | Document housekeeping: applying Claude's routing and package deltas into repo docs, `V10_STATE.md`, and Project-instruction patch text | Sol already stewards the repo |
| SW5 | A first-pass inventory or diff of a branch: which files changed and whether they stay inside the allowed paths | Branch-safety work, which is Sol's authority |

Not delegated (stays with Claude): visual direction, taste and checkpoint verdicts, likeness and image-gate reviews, build briefs. Not delegated (stays with Cloud): anything that needs rendering, Playwright captures or image processing.

Every Sol Work task gets a short task card from Claude (goal, inputs, exact checks, return format), with a **20 min** time budget. Model: GPT-5.6 Sol by default. GPT-6 Sol only for R17 integration architecture review, or after two failed 5.6 attempts at the same task. Astra only on Nik's explicit go.

Effect on Claude's reviews: when a Sol Work gate pre-check returns all-PASS, Claude's verify pass covers only the taste items and runs at **Opus 5.5 · Medium**. If any gate fails, the result goes back to Claude at High for a re-brief.

## 6. Project Instructions patch (Nik pastes into Claude Project → Instructions)

Replace the Claude Code Cloud bullets under "Team and authority" with:
```
•	Claude Code Cloud (claude.ai/code): the builder. Opus 5.5 only; Medium for exact-delta revisions and intake, High for builds that need judgment and for first-of-kind work. Every Cloud task carries a STOP_BUDGET. Sonnet 5 is not used in this project unless Nik approves it in writing for a named task.
```
Replace the whole "Model and effort routing" table with the table in §2 above, and replace its two footnote bullets with:
```
•	Max effort is never a default and needs Nik's approval.
•	If Opus 5.5 is not offered on a surface, stop and ask Nik. No automatic fallback.
•	Before any chain of transitions, announce the model and effort for every step; Nik confirms before a Cloud step starts.
```
Replace the "Astra High / GPT-6 Sol Work" bullet with:
```
•	GPT-5.6 Sol in ChatGPT Work mode, High: a standing delegate for gate pre-checks of Cloud results, exact mechanical deltas that need no rendering, web-access lookups, doc housekeeping and branch inventories (routing V3 §5a). Claude writes each task a short task card with a 20-minute budget.
•	Astra High / GPT-6 Sol Work: rare specialists, only for a named question.
```