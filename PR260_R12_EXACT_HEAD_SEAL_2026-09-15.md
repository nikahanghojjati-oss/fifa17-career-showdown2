# PR260 R12 Exact-Head Seal — 2026-09-15

Purpose: documentation-only seal for the final r21 / panel-authority candidate. This file earns no product, MDP or SSJR credit and exists only to create one immutable CI/review head.

## Product head immediately before this seal

`c49a91bcd39e5a0d4a7825b0e6db0096f2c6d4ea`

Commit: `fix(pr260): publish r21 shell and reactivate panel authority R12`

## R11 Codex blockers fixed

### Fresh installable shell identity

The changed whole shell no longer reuses `1.9.1-r20`.

- current runtime: `1.9.1-r21`
- immediate previous known-good runtime: `1.9.1-r20`
- application version remains `1.9.1`
- index, manifest icons, service-worker cache namespace, lazy visual-fidelity CSS and lazy Reus image all share r21
- the permanent release-shell contract requires the recovery runtime to be exactly generation - 1
- r20 physical-journey recorder/validator/release evidence remains historical provenance and does not force r20 to remain the current shell

### Persistent-pair panel Continue authority

`pairContinueOnlineShowdown()` now reactivates Save Library authority before checking the exact provider-linked Save/Profile. A browser whose ACTIVE pair panel remains visible after cross-tab Save Library invalidation therefore re-establishes local authority, hydrates the exact provider-linked Save and continues instead of falsely entering recovery.

The permanent real-browser routing audit now proves this invalidated-authority panel path in addition to cold reload hydration, stale-opposite-role repair and genuine fresh-browser recovery.

## Focused proof completed before this seal

Workflow: `PR260 R12 release authority`
Run: `35026593157`

Passed before publication:

- exact r21 current / r20 previous revision topology;
- all 94 permanent product contracts;
- protected startup budget: `162647 raw / 37468 gzip`, below unchanged `165000 / 37500` ceilings;
- release-shell coherence with immediate previous recovery target;
- persistent Nik/Daniel pair authority contracts;
- real Chromium installed/offline shell audit;
- real Chromium persistent-pair routing audit including panel Continue after Save Library authority invalidation.

Temporary R12 workflows and patch scripts removed themselves in the same publication commit and are absent from the product tree.

## Governance / zero-cost boundary

- Daniel = permanent Player One; Nik = permanent Player Two.
- Pair authority remains private, account-owned, exact-device/rivalry/session bound and non-listable.
- Firebase remains Spark-only; billing remains OFF.
- App Check enforcement remains OFF.
- No Cloud Functions, Cloud Run, Blaze/payment dependency, public discovery/community/rankings or provider list expansion.
- SSJR-1.1 remains exactly `0/100`; source, CI, merge or release publication grants no physical-journey acceptance credit.
- MDP remains `95.50/100` until separately governed evidence changes it.

## Merge gate

Do not merge using R11 or earlier evidence. Require a fresh exact-head POS20 run and one fresh Codex review on the commit created by this R12 seal. If either finds a substantive blocker, fix it and create a new seal. If both are clean and `main` has not moved, merge PR #260 using the exact sealed head SHA. Then verify the exact merged-main GitHub Pages deployment and Rules-only zero-billing Firestore deployment/readback before asking Nik and Daniel to begin genuine two-device physical testing.
