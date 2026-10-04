# V10 INTERRUPTION-RESILIENT EXECUTION PROTOCOL

## Problem

Long visual/research sessions have sometimes been interrupted by UI streaming/tool/runtime failures. Sol cannot control the app/network streaming layer itself.

V10 solves the part that is controllable: no meaningful work should be lost when a response or tool sequence is interrupted.

## Core rule: checkpoint before expansion

Every substantial V10 work block uses atomic commits.

No critical reasoning exists only in an unfinished assistant message.

## Work unit

A V10 work unit contains at most:
1. one research/theme batch;
2. one durable document/update;
3. one repository commit;
4. one short state checkpoint.

Then continue.

## Durable state files

Maintain:
- visual-assets/v10/V10_STATE.md
- visual-assets/v10/V10_NEXT.md
- visual-assets/v10/V10_WORKLOG.md

At the end of every major milestone update STATE and NEXT.

## Two-phase write rule

For a large deliverable:

PHASE A — skeleton
- purpose
- source anchor
- conclusions
- next work

Commit.

PHASE B — expansion
- deeper research
- implementation detail
- QA

Commit.

If interruption happens between A and B, the project still has a valid resumable checkpoint.

## Tool-call rule

Avoid one monolithic tool call containing many unrelated writes.

Prefer:
- 1–4 repository writes per tool call
- verify branch/head after major batches
- create source/research ledgers in chunks if large

## Response rule

When a session includes many tools:
1. complete a durable checkpoint before optional exploration;
2. if interruption occurs, next session reads STATE + NEXT;
3. never rely on conversational memory for unfinished work.

## Reference-upload rule

Reference images are inspected and written into a reference-study file before any asset-generation decision.

This prevents accidental reference -> image-generation jumps.

## V10_STATE minimum schema

- system version
- current branch
- current main anchor
- active screen
- current golden-frame stage
- research batches completed
- worker decision
- last safe commit
- next exact action
- blockers
- image generation lock state

## Recovery prompt

If a future chat is interrupted, Nik can say:

Open visual-assets/v10/V10_STATE.md and V10_NEXT.md from the visual/cinematic-system-v10 branch and continue exactly from the next safe action.

## What this can and cannot guarantee

CAN:
- preserve work
- prevent lost reasoning
- reduce giant tool batches
- make continuation deterministic

CANNOT:
- control ChatGPT client/network streaming
- guarantee a message will never be interrupted

V10 therefore makes interruptions cheap rather than pretending they can be eliminated.