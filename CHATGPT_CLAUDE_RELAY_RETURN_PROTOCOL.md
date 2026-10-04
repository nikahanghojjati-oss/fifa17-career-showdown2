# CHATGPT ↔ CLAUDE RELAY RETURN PROTOCOL

Status: PERMANENT PROJECT OPERATING PROTOCOL
Owner: Nik
Applies to: Career Mode Showdown gameplay collaboration
Primary coordinator: GPT-5.6 Sol
Engineering lead collaborator: Claude Opus 5.5
Effective date: 2026-09-28

## Purpose

Nik frequently transfers engineering handoff files from Claude Opus 5.5 to ChatGPT for reconciliation, review, acceptance decisions, product-truth checks, or coordination.

To eliminate manual copy/paste and preserve exact relay history, every Claude-to-ChatGPT handoff must produce a complete ChatGPT-to-Claude response artifact in addition to the normal chat response.

This is a standing rule and should be treated as durable project procedure.

## Trigger

This protocol activates whenever Nik gives ChatGPT a file, handoff, report, decision packet, engineering packet, or other artifact originating from Claude or intended to continue the Claude ↔ ChatGPT project relay.

Typical examples include files named like:

- `CLAUDE_*_HANDOFF_TO_SOL_*.md`
- `CLAUDE_*_DECISION_*.md`
- `CLAUDE_*_REPORT_*.md`
- Claude engineering milestone packets
- Claude physical-test readiness packets
- Claude post-run assessment packets
- Any file Nik explicitly says came from Claude or should be answered back to Claude

The rule also applies when Nik simply uploads a Claude file without adding a detailed written request, if the intended action is clearly to review/reconcile/respond to it.

## Mandatory ChatGPT output

Every triggered relay must produce BOTH of the following in the same response:

1. A full normal ChatGPT answer in the conversation.
2. An iPhone-downloadable file containing the FULL substantive answer that Nik can give directly back to Claude.

The downloadable file is mandatory. It is not optional, and ChatGPT should not wait for Nik to ask for it separately.

## File requirements

The return artifact should normally be plain UTF-8 `.txt` because this is the most reliable format for downloading, opening, sharing, and re-uploading on iPhone.

A Markdown copy may also be created when useful, but the iPhone-friendly `.txt` version is the required minimum.

The file must contain the complete substantive response, not a short summary, pointer, or partial handoff.

If the chat answer contains:

- decisions,
- disagreements,
- approvals,
- technical findings,
- repository state,
- exact SHAs,
- PR status,
- acceptance-policy decisions,
- physical-test instructions,
- risks,
- next actions,
- instructions for Claude,
- or product-truth corrections,

those same substantive items must be present in the downloadable return file.

Do not force Nik to manually copy missing parts from the chat into the file.

## Fidelity rule

The downloadable file should be suitable for direct upload to Claude with no rewriting by Nik.

It should preserve:

- the same conclusions as the chat response;
- exact branch names, PR numbers, SHAs, runtime versions, and status facts when relevant;
- clear distinctions between proven facts, inference, and unresolved questions;
- all decisions Claude needs to continue work;
- all owner actions Claude needs to know;
- all requested review/reconciliation feedback.

Minor formatting differences between chat and file are acceptable, but substantive content must not be omitted.

## Recommended filename

Use a descriptive relay filename such as:

`SOL_RESPONSE_TO_CLAUDE_<TASK_OR_MILESTONE>_YYYY-MM-DD.txt`

Examples:

- `SOL_RESPONSE_TO_CLAUDE_REL01_2026-09-28.txt`
- `SOL_RESPONSE_TO_CLAUDE_SSJR_PHYSICAL_READY_2026-09-28.txt`
- `SOL_RESPONSE_TO_CLAUDE_POST_RUN_RECONCILIATION_2026-09-29.txt`

When Claude provided a Task ID, milestone ID, or handoff ID, preserve it in the filename when practical.

## Repository-history rule

This protocol file is the durable authority for the relay behavior.

Important milestone response artifacts may also be committed to the repository when they are materially useful as project history, especially when they contain:

- acceptance-policy decisions;
- engineering authority changes;
- SSJR evidence-model decisions;
- major release reconciliation;
- owner-approved workflow changes;
- or a decision that future Claude or ChatGPT sessions must be able to recover.

Routine responses do not all need to be committed individually unless doing so materially improves continuity.

## ChatGPT behavior

On receipt of a Claude relay:

1. Read the supplied Claude artifact fully enough to answer the requested issue.
2. Verify live repository facts when current GitHub state matters.
3. Produce the full reconciliation/answer in chat.
4. Create an iPhone-friendly `.txt` file containing the same full substantive answer.
5. Give Nik a direct downloadable sandbox link to that file in the same response.
6. If the response establishes a durable project-level decision that future agents must recover, save that decision to the repository as appropriate.

Do not respond with only “reviewed,” “accepted,” or a brief summary if Claude needs substantive continuation information.

## No separate reminder required

Nik should not need to say:

- “make a file,”
- “give me the downloadable version,”
- “make it iPhone friendly,”
- or “give me something I can send to Claude.”

Those requirements are automatic whenever this protocol is triggered.

## Failure handling

If file generation fails during a relay response, retry file creation before finalizing whenever possible.

If an environment limitation genuinely prevents creating the downloadable file, state that limitation clearly and still provide the full answer in chat. Do not silently omit the artifact.

## Scope

This protocol governs the Claude ↔ ChatGPT collaboration relay for Career Mode Showdown.

It does not require a downloadable file for every ordinary user question, only for Claude-originated or Claude-destined project handoffs and closely related relay packets.

## Standing owner intent

Claude Opus 5.5 is expected to remain a long-term lead engineering collaborator on Career Mode Showdown.

GPT-5.6 Sol is expected to remain a coordinator, reconciler, acceptance-policy reviewer, and owner-facing counterpart.

The relay artifact requirement exists so the two systems can exchange complete decisions efficiently without Nik manually copying long ChatGPT responses between them.

This protocol remains active until Nik explicitly changes or revokes it.
