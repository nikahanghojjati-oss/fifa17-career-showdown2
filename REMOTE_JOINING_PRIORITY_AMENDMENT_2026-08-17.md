# Remote Joining Priority Amendment — 2026-08-17

Status: permanent owner roadmap clarification
Scope: private Remote Joining priority and prerequisite ordering only
Supersedes: only the earlier classification of private remote joining as `BLOCKED` in the 2026-08-16 product-philosophy amendment. It does not reverse the elimination of public community features or global leaderboard/rankings.

## Owner decision

Private Remote Joining is a prioritized long-term product destination for Career Mode Showdown.

The intended product is still a private two-manager companion. The second manager may be in another country, so a secure private remote session/joining capability is a meaningful end-state of the product rather than an optional side feature.

Remote Joining must therefore be represented as:

`PRIORITIZED LONG-TERM / DEPENDENCY-GATED / NOT YET IMPLEMENTATION-AUTHORIZED`

Do not describe the feature as permanently blocked or deprioritized.

## No-rush rule

Priority does not authorize premature implementation.

Remote Joining itself must not be built until every prerequisite needed for safe private remote play is implemented, tested and production-proven. Future developers must advance the enabling chain deliberately rather than jumping directly to networking, authentication or multiplayer UI.

## Ordered enabling path

The current strategic path is:

1. proven local recovery, Save Library identity, multi-Save portability and installed-app resilience — already shipped and protected;
2. Cloud / sync readiness with explicit provider boundaries, revision authority, conflict handling, tombstones, recovery, export and rollback escape hatches;
3. private account / authentication / authorization identity that remains distinct from Local Profile display labels and never guesses unresolved historical identity;
4. secure paired-device / private-session capability, including device revocation, invite/session authorization and abuse/rate boundaries;
5. Connected Rivalry synchronization with stale-write protection, deterministic conflict behavior, offline/reconnect recovery and two-device simulation;
6. private Remote Joining / session UX only after the preceding layers are proven.

Optional Private Cloud Backup may reuse the same Cloud foundation, but backup as a product surface is not by itself a substitute for the synchronization, identity and paired-session infrastructure required for Remote Joining.

## Long-term prioritization rule

When the project reaches future networked work and no later explicit owner instruction overrides this amendment, the next safe prerequisite that materially advances the Remote Joining path should be preferred over unrelated optional expansion.

Examples of unrelated optional expansion include additional content packs, broad achievement expansion or cosmetic systems that do not materially reduce Remote Joining prerequisite risk.

This preference does not automatically authorize runtime work. Every prerequisite still requires one bounded candidate through `NEXT_TASK.md` or a later explicit owner instruction, with existing validation, recovery, privacy, security and performance locks preserved.

## Permanent exclusions unchanged

The following remain eliminated unless a later owner amendment explicitly reverses them:

- public community/discovery surfaces;
- global leaderboard/rankings;
- public rivalry feeds or public matchmaking implied by Remote Joining.

Remote Joining is private. Pairing, identity and transport must not silently create public discoverability.

## Required authority propagation

Current-facing authority must converge on this terminology:

- `PRODUCT_PHILOSOPHY_LOCK.md`
- `PROJECT_STATE.md`
- `NEXT_TASK.md`
- `POST_V1_ROADMAP_EXECUTION.md`
- `00_DEVELOPER_START_HERE.md`
- current README/continuation guidance
- permanent contracts that validate the roadmap boundary.

Historical documents may retain the former `BLOCKED` wording when they clearly remain frozen history. Current authority must treat this amendment as the later owner decision.
