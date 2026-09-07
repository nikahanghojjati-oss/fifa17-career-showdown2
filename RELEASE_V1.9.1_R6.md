# Career Mode Showdown v1.9.1-r6 Runtime Hotfix

Status: RELEASE CANDIDATE
Application version: `v1.9.1`
Runtime asset revision: `1.9.1-r6`
Previous known-good runtime: `1.9.1-r5`
Remote Joining readiness: `100/100` under frozen model `RJR-1`
Shared Showdown Journey readiness: `0/100` under fixed model `SSJR-1.1`

## Purpose

This release candidate corrects two defects exposed by genuine two-account production SSJR acceptance and restores the intended player-facing Shared Showdown design philosophy.

The owner reached authoritative `SHOWDOWN_CONFIRMED · REV 6` with LaLiga, Osasuna, Espanyol, one season and both manager confirmations. The guided recorder then produced a false negative because it required a provider `clubLeagueIds` field that the canonical Shared Setup protocol never stores. The same physical run also showed that the normal Shared Journey path had replaced the product's core League Wheel and Club Pack reveal screens with an engineering-style Shared Setup panel.

r6 fixes both issues without changing provider authority, canonical gameplay storage, Firebase plan or billing posture.

## Recorder correction

The guided recorder now validates each observed club directly against the immutable repository-owned Shared Showdown catalog for the authoritative `leagueId`. It no longer requires a nonexistent provider `clubLeagueIds` field. Privacy-safe derived club-league identities may be emitted only after that catalog membership succeeds.

Recorder safe state is also runtime-scoped. Persisted recorder evidence from an older shell is reset when its stored runtime revision differs from the live HTML revision, preventing a stale r4/r5 evidence label from silently surviving into r6.

## Player-facing Shared Showdown presentation

Pairing plus the exact ACTIVE private session remain mandatory before any league or club authority is available. After those gates succeed, normal Shared Showdown now returns to the existing game-like setup presentation:

1. both managers enter the real `leagueWheelScreen`;
2. the provider owns one immutable league outcome and each browser visibly witnesses the League Wheel animate to that same result;
3. neither browser may advance to club packs until that browser has locally witnessed the authoritative league;
4. both managers enter the real `clubWheelScreen`;
5. the provider owns the two distinct same-league club outcomes and each browser visibly witnesses both original sealed-pack reveals;
6. season length is chosen from `1 / 3 / 5 / 10` after the pack reveal;
7. each manager confirms on their own device.

The non-coordinator browser automatically refreshes provider authority while waiting. A late peer that learns the provider has already advanced to clubs is still forced through its own League Wheel witness before Club Packs, so Player 2 can never silently skip a core presentation screen.

The engineering Shared Setup overlay remains available only as an internal diagnostic/debug authority surface. It is not the intended player-facing Shared Showdown setup UI.

## Acceptance recorder route

Acceptance mode loads `ssjrAcceptancePolishedBridge.js` before the guided recorder. The recorder's legacy Shared Setup `openPanel()` call is intercepted and routed into the polished Shared Showdown presentation. The original engineering `openPanel()` remains available only as an explicit diagnostic escape hatch.

## Permanent regression coverage

Permanent contracts and a two-context browser audit prove:

- both `playerOne` and `playerTwo` visibly witness the real League Wheel;
- both roles visibly witness both original club-pack reveals;
- a late Player 2 authority state still cannot skip League Wheel presentation;
- peer state auto-refreshes while waiting;
- the provider remains sole league/club draw authority;
- local random league and club authority remain disabled during Shared Journey;
- the guided recorder is bridged away from the engineering panel;
- canonical gameplay storage is not mutated merely to present Shared Setup.

These tests, source changes, CI, review, merge and deployment earn zero SSJR credit by themselves.

## Whole-shell boundary

Executable browser behavior changed, so r6 is a new whole-shell identity. HTML asset revision, direct asset query strings, lazy Shared Journey/recorder assets, manifest URLs and Service Worker cache identity must converge on `1.9.1-r6`. The coherent `1.9.1-r5` shell remains the immediate previous known-good recovery target. Never certify a mixed r5/r6 shell.

## Permanent safety boundary

Firebase remains Spark and billing remains permanently forbidden. Do not enable Blaze, Cloud Billing, payment methods, purchased credits, Cloud Run, Cloud Functions or any billing-required provider path. App Check enforcement remains OFF. Firestore browser persistence remains memory-only. Google authentication remains popup-only browser-session persistence with no additional scopes.

Exactly two private managers remain the only remote participants. No public discovery, listing, lobby, matchmaking, community surface, rankings or global leaderboard may be introduced.

Canonical gameplay storage remains exactly:

- `careerModeShowdown.saveLibrary`
- `careerModeShowdown.legacyShowdowns`
- `careerModeShowdown.preferences`

Candidate C remains the sole destructive remote-to-local gameplay Apply authority with transaction-owned mutation and exact raw-snapshot rollback.

## Acceptance truth

SSJR-1.1 remains `0/100` until genuine two-account production evidence satisfies the fixed validator/model. After coherent r6 production is independently proven, the owner should perform one fresh two-device acceptance. The expected player-facing path is paired managers → exact ACTIVE private session → League Wheel visible on both devices → Club Pack reveal visible on both devices → season length → both confirmations → identical `SHOWDOWN_CONFIRMED · REV 6` → reload/resume → fresh ACTIVE same-rivalry resume, with canonical storage unchanged and privacy-safe evidence only.
