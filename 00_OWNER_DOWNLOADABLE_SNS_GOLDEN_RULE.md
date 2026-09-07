# Career Mode Showdown — Owner Downloadable SNS Golden Rule

Owner-mandated permanent repository rule.

## Core rule

Once a Work Environment transition decision has been made, the developer must always generate an owner-facing SNS copy that the owner can download and use to start the successor environment.

This is mandatory handoff completion work, not an optional convenience step.

A transition decision includes any WEC or Session Handoff Proximity state that means the current environment should hand off at the current or next safe checkpoint, including `HANDOFF_AT_CHECKPOINT`, `HANDOFF_NOW`, `FINISH_SAFE_BOUNDARY` once the safe boundary is restored, SHP-2 `GENERATE_FULL_SNS_NOW`, or a completed `HANDOFF_COMPLETE_STOP` boundary.

The developer must not consider the session fully transitioned until the owner SNS copy has been generated from the final verified transfer boundary.

## Required owner artifact

For every transition, generate one standalone owner SNS artifact with a clear versioned name such as:

`OWNER_SNS_<VERSION>_<BOUNDARY>.md`

The artifact must be stored durably in repository state when repository writes are available. When the chat environment supports downloadable files, the developer must also provide the owner a directly downloadable copy in the chat. If a downloadable attachment cannot be produced because the environment lacks that capability, say so explicitly and still provide the complete ready-to-copy SNS text plus the repository path.

Do not make the owner reconstruct an SNS from a deep handoff, WEC JSON, CI logs, or multiple chat messages.

## Minimum SNS contents

The owner SNS copy must contain, at minimum:

1. the complete ready-to-paste prompt for the next developer/chat;
2. the newest authoritative `START_NEXT_SESSION_...` filename;
3. the branch to fetch if that starter is not on `main`;
4. the closing WEC ID;
5. independently verified `main` SHA at the transfer boundary;
6. active PR number and the last exact head whose CI state was actually inspected;
7. a warning that continuity/SNS seal commits may advance the branch and that the successor must independently resolve the live head before combining or relying on CI evidence;
8. production version/runtime authority and release-candidate identity when applicable;
9. current RJR, SSJR and MDP authority values when those trackers are active;
10. exact blocker or unfinished work classification;
11. the first safe action after bootstrap and the immediate next task;
12. permanent safety locks, including permanent zero billing and Firebase Spark whenever those remain project authority;
13. Session Handoff Proximity and HTR-1 must remain separate concepts;
14. a reminder that current source and live GitHub/provider/deployment evidence override stale handoff facts.

The SNS must be concise enough to paste into a fresh chat, but complete enough that the owner does not need to manually add missing transition facts.

## Timing and exact-boundary rule

Generate the owner SNS after the transition decision is made and after the current safe boundary has been classified.

If the SNS itself or other continuity sealing commits advance the branch beyond the last substantively tested head, the SNS must state that fact explicitly. Never imply that CI from an earlier head applies to a later seal head.

The owner copy should be refreshed again if any material transfer fact changes after the first SNS generation, including PR head, WEC state, blocker classification, starter name, production authority, or first safe successor action.

## Anti-spiral integration

The owner SNS copy is especially mandatory when SHP-2's anti-spiral circuit breaker triggers. A red CI state does not justify withholding the SNS. Known failing checks may be transferred safely when their exact head, failure class, current evidence, and next safe action are durably recorded.

Do not keep debugging merely because the SNS has not yet been generated. Generate the SNS as part of the transition and let the fresh environment continue from the classified safe boundary.

## Recursive inheritance

Every future starter, deep handoff, bootstrap capsule, developer-start document, generated prompt and successor environment must preserve this rule recursively.

A successor that later decides to transition must again create a fresh owner-downloadable SNS copy for its own exact closing boundary. Never reuse an old SNS unchanged when live authority has moved.

## Completion rule

A transition is not owner-complete until all of the following are true:

- the repository-native successor package exists;
- the WEC is safely classified for transition;
- the next developer's immediate task is explicit;
- the owner SNS copy has been generated from the current boundary;
- the owner has been given the SNS as a direct downloadable file when the environment supports file delivery, otherwise the complete copyable text and repository path are provided;
- the current session stops before beginning another substantial milestone.

This rule supplements `00_HANDOFF_GOLDEN_RULE.md`, `00_SESSION_HANDOFF_PROXIMITY_V2.md`, `00_WORK_ENVIRONMENT_CONTINUITY.md` and `00_HANDOFF_PROXIMITY_STAGE_GATES.md`. It never permits weakening technical gates, hiding failures, combining CI across heads, or using HTR-1 as session pressure.
