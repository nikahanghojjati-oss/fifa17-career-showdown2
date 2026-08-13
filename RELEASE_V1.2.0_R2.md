# Career Mode Showdown v1.2.0 Runtime Hotfix r2

Release tag: `v1.2.0`
Runtime asset revision: `1.2.0-r2`
Previous known-good runtime: `1.2.0-r1`
Status: RELEASE CANDIDATE

## Scope

This runtime hotfix fixes two owner-reported regressions without changing gameplay, storage authority, navigation, scoring or accepted football assets.

1. iOS installed-app loading composition now separates viewport safe-area behavior from the Reus art box. The mobile portrait uses a bounded width-owned top band and a stable subject-safe fill so standalone viewport height cannot create a large empty band or displace the player crop.
2. Installation UI no longer injects a floating global rail or panel. Service Worker, cache, connectivity, update and rollback logic remain in the offline controller, while install/update actions are presented only inside lazy Settings.
3. Regression coverage adds desktop, low-height, mobile-browser and iOS-standalone loading archetypes plus explicit Settings-only install presentation checks.

## Release boundary

The immutable v1.2.0 / `1.2.0-r1` production record remains in `RELEASE_V1.2.0.md` with its original deployment evidence. This r2 record is separate so the proven r1 history is never rewritten.

Do not mark r2 production-proven until PR validation, merge, GitHub Pages deployment, deployed Stability and release integration proof complete.
