# Career Mode Showdown v1.9.1-r6 Maintenance Release Record

Status: RELEASE CANDIDATE / NOT PRODUCTION-PROVEN
Application version: `v1.9.1`
Runtime revision: `1.9.1-r6`
Previous known-good whole shell: `1.9.1-r5`
Remote Joining readiness: `100/100` under frozen model `RJR-1`
Shared Showdown Journey readiness: `0/100` under fixed model `SSJR-1.1`

## Why r6 exists

Genuine two-account production acceptance on the deployed r5 generation reached authoritative Shared Setup `SHOWDOWN_CONFIRMED · REV 6` with one valid repository league, two distinct same-league clubs, one season and both role confirmations. Two first-party product issues were then isolated:

1. the guided recorder falsely rejected the valid final setup because it expected a provider `clubLeagueIds` field that the canonical Shared Setup protocol does not contain;
2. the normal Shared Journey was routing players away from the app's core League Wheel and Club Pack reveal into an engineering-style Shared Setup overlay, contrary to the intended game-companion product philosophy.

r6 is a bounded product/acceptance correction. It earns zero SSJR credit by publication mechanics alone.

## Correct player journey

The permanent product order is:

`pre-draw shared save shell → exact two-manager pairing → exact ACTIVE private session → real League Wheel on both devices → real Club Pack reveal on both devices → shared season length → both role confirmations`.

Provider authority remains unchanged. Firebase/transaction state chooses the immutable league and clubs. The League Wheel and Club Pack screens are presentation surfaces for those provider-owned outcomes and never regain independent local-random authority.

Both manager browsers must witness the League Wheel locally. Both manager browsers must witness both club-pack reveals locally. The peer automatically refreshes authoritative state while waiting. If Player 2 reconnects after the provider has already committed clubs, that browser still sees and acknowledges the League Wheel result before it can enter Club Packs.

The plain engineering Shared Setup overlay is diagnostic-only and must not be the normal player-facing path.

## Recorder truth

The recorder validates observed clubs by membership in the repository-owned `sharedShowdownCatalog` for the authoritative league. It may derive privacy-safe club league identities only after that proof. Cross-runtime session evidence is reset when its recorded runtime differs from the live shell revision.

Acceptance mode installs the polished bridge before the recorder, so the recorder's legacy `openPanel()` route activates the League Wheel / Club Pack presentation rather than opening the engineering overlay.

## Publication discipline

`1.9.1-r6` remains NOT PRODUCTION-PROVEN until:

- every current permanent workflow family is green on one exact reviewed head;
- all objective review threads are resolved;
- the PR merges with expected-head SHA protection;
- post-merge workflows and GitHub Pages succeed;
- deployed-site verification proves one coherent r6 shell, including the new polished presentation and acceptance bridge;
- the public acceptance route reports live r6 rather than stale recorder state.

Until then, deployed `1.9.1-r5` remains production authority and the previous known-good recovery shell.

## Installed-app boundary

r6 changes executable browser behavior and therefore requires a coherent whole-shell runtime bump. Do not certify a mixed r5/r6 install. The Service Worker must cache the polished presentation and acceptance bridge as part of r6 and retain r5 as immediate previous recovery.

## Permanent safety boundary

Firebase remains Spark. Billing remains permanently OFF. Never enable Blaze, Cloud Billing, payment methods, purchased credits, Cloud Run, Cloud Functions or any billing-required service. App Check enforcement remains OFF. Firestore browser persistence remains memory-only. Google Auth remains popup-only browser-session persistence with no additional scopes.

Exactly two private managers. No public discovery, listing, lobby, matchmaking, community, rankings or global leaderboards.

Canonical local gameplay storage remains exactly:

- `careerModeShowdown.saveLibrary`
- `careerModeShowdown.legacyShowdowns`
- `careerModeShowdown.preferences`

Shared Setup presentation/recorder may observe but must not mutate those keys merely to establish setup evidence. Candidate C remains the sole destructive remote-to-local gameplay Apply authority with transaction-owned strict exact raw-snapshot rollback.

## Next evidence boundary

After r6 is coherently deployed and independently verified, ask the owner for one fresh Chromebook/iPhone two-account acceptance. Require both manager devices to visibly pass League Wheel and Club Pack screens. Then prove identical final revision 6, unchanged canonical storage, reload/resume and a fresh ACTIVE same-rivalry resume without redraw/reset. Retain only privacy-safe evidence. Never ask the owner to paste raw account/device/rivalry/session/pairing identifiers or raw canonical storage bytes into chat or repository evidence.

RJR-1 remains frozen `100/100`. SSJR-1.1 remains fixed `0/100` until genuine production evidence qualifies.
