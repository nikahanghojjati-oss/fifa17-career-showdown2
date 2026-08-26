# Owner authority — repository-first next-developer prompt standard

Recorded: 2026-08-26.

The owner explicitly requested that all future developers provide a short prompt similar to the repository-first successor prompt produced at the post-PR155 handoff boundary, so the owner can paste it into the next ChatGPT/developer session.

Permanent operating requirement:

- every fresh-session recommendation must give the owner one concise ready-to-paste next-developer prompt;
- the prompt must point first to the live repository and the current authoritative versioned `START_NEXT_SESSION_...md`;
- it must tell the successor to follow SLE/deep references only as needed;
- it must require independent verification of current `main`, relevant PR state, production/runtime/deployment state, `REMOTE_JOINING_READINESS.json`, `NEXT_TASK.md`, and the closing WEC;
- it must require a fresh WEC rather than inheritance of the predecessor transition decision;
- it must route execution to `IMMEDIATE NEXT TASK AFTER FULL STUDY` after bootstrap;
- it must state that the handoff is orientation only and current source/live GitHub/provider/deployment evidence wins;
- it is a convenience layer for the owner and never replaces the complete repository-native SLE package.

The semantic template is maintained in `00_HANDOFF_GOLDEN_RULE.md` and protected by `tests/contracts/next-developer-prompt-contracts.cjs`.

A later explicit owner instruction may change or revoke this standard.
