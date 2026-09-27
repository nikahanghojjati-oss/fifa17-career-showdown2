# V10 NEXT

## Active route — ASTRA_CONSTRAINED

The project is temporarily using Claude Opus 5.5 as the provisional senior visual reviewer while conserving Astra quota.

This does NOT replace Astra's executive cinematic role.

## Immediate next action

Give Claude the onboarding packet under:

`visual-assets/v10_1/claude/`

Start with:
`CLAUDE_OPUS_5_5_START_HERE.md`

Then run:
`CLAUDE_FIRST_ASSIGNMENT_ASTRA_CONSTRAINED.md`

Required Claude verdict:
- `PROVISIONALLY READY FOR GOLDEN FRAME`
or
- `NOT PROVISIONALLY READY FOR GOLDEN FRAME`

Claude must:
- remain read-only;
- not implement;
- not generate images;
- not redesign product behavior;
- return bounded deltas only.

## After Claude review

GPT-5.6 Sol:
1. validates findings against current product truth;
2. updates only the canonical V10.1 screen spec;
3. records accepted/rejected Claude deltas;
4. performs or requests the approved-asset fit audit.

If provisionally ready:
- one isolated provisional desktop + mobile golden frame may be built;
- status must remain `PROVISIONAL_ASTRA_REVIEW_PENDING`;
- no reusable visual promotion yet.

When Astra becomes available:
follow:
`visual-assets/v10_1/model-routing/ASTRA_REENTRY_PROTOCOL_V10_1.md`

Astra receives only the compact delta/evidence packet and resumes executive cinematic judgment.

Current product main:
`f077b9c5be5e4d5bf5ef17b2d219983dbf142962`

Image generation remains LOCKED.
