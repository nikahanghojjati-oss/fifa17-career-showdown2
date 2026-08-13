# Career Mode Showdown v1.2.0 Runtime Hotfix r2

Date: 2026-08-13 ET
Application version: `v1.2.0`
Runtime asset revision: `1.2.0-r2`
Previous known-good runtime: `1.2.0-r1`
Status: technically production-proven
Public site: `https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/`

## Scope

This runtime hotfix fixed two owner-reported production regressions without changing gameplay, scoring, canonical storage authority, Smart Back or accepted football assets.

1. iOS installed-app loading composition now separates viewport/safe-area behavior from the Reus art composition. Mobile uses a bounded width-owned top band, a stable subject-safe image box and an opacity/filter-only entrance animation that cannot move the protected composition geometry.
2. Installation UI no longer injects a floating global rail or panel. Install/update actions live only inside lazy Settings. Service Worker, cache, connectivity, update activation, offline degradation and rollback logic remain presentation-neutral.
3. Regression coverage protects desktop, low-height desktop, narrow mobile browser and iOS standalone-height loading archetypes plus explicit Settings-only install presentation.

Persistent global floating/sticky install presentation is not part of the accepted product pattern and must not return without explicit owner authorization.

## Release evidence

The exact hotfix candidate SHA `dd6af02ffdd0cc3fbb193e7e3c703a8023bb972e` passed all 13 normal PR workflow families twice.

Release path:

- release PR: #39;
- hotfix merge: `2179b7928602b9579dc6e129c40b8739082de80a`;
- post-merge Home visual companion browser/test correction: `e966a5a44927992e2e33f602434c5311bf7caee7`;
- Stability: `31740111919`;
- deployed-site-smoke job: `94581704562`;
- dedicated V1 Visual Immersion: `31740111961`;
- Release Integration Burn-In: `31740111986`, both complete stateful journeys passed.

Deployed Stability passed exact runtime bytes, runtime-error provenance, Home visual audit, crop-safe football-photo audit, Candidate A backup, Candidate B read-only analysis, Candidate C atomic restore/recovery, Settings/offline boundary and the complete public journey.

`V1.2.0_R2_PRODUCTION_PROOF.md` is the concise production proof record.

Technical production proof is separate from any later owner visual-acceptance statement; no owner signoff is fabricated.

## Release boundary and rollback

`RELEASE_V1.2.0.md` remains immutable evidence for the previous production runtime `1.2.0-r1`. It must not be rewritten to describe r2.

`1.2.0-r1` is the immediate previous known-good whole-runtime shell and rollback authority. The older v1.1.5 / `1.1.5-r1` record remains deeper historical rollback evidence.

## Next milestone

The hotfix is closed. The next legal milestone is v1.3.0 — Recovery & Device Resilience Hardening, starting from current verified r2 `main`.

Open draft PR #37 must be re-audited against r2 before reuse. It contains a known accidental shell replacement from commit `6ce7fe6fab87031b69e3dc5e98587fd3f78b3558`; useful hardening must be separated from that regression before any merge/deployment.