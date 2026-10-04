# SHOWDOWN VISUAL — CLOUD -> COORDINATOR -> PRODUCER RETURN CONTRACT

Recipient: Claude Code Cloud Session implementation worker
Surface: claude.ai/code Cloud Session
Model: Opus 5.5
Effort: High unless coordinator specifies otherwise
Branch: dedicated implementation branch supplied by coordinator
Role: implementation + evidence
Input authority: approved CLOUD_BUILD_BRIEF
Expected output: CLOUD_BUILD_RESULT
Return to: GPT-5.6 Sol coordinator
Stop condition: one bounded build slice + evidence, no PR unless requested

## Return path

Cloud result goes FIRST to GPT-5.6 Sol.

Sol checks:
- product truth;
- branch safety;
- unauthorized behavior changes;
- asset provenance;
- required evidence completeness.

If those pass, Sol routes the frozen evidence to Claude Chat Project for visual producer review.

The producer review does NOT inspect a moving implementation.
It reviews one exact fingerprint.

## Producer review verdict

Claude Chat returns one:

`APPROVE_FOR_OWNER_REVIEW`

or

`REVISE`

If REVISE:
- stable issue IDs;
- exact visual delta;
- evidence;
- whether new asset needed;
- whether product-truth risk exists.

Sol then writes the next bounded Cloud task.

## Browser QA

If a live preview exists, Claude in Chrome may be used between Sol validation and producer review for runtime evidence.

Its findings are returned to Sol, not applied ad hoc.
