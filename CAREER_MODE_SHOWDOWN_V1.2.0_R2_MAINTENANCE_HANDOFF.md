# Career Mode Showdown — v1.2.0 r2 Hotfix Maintenance Handoff

Last updated: 2026-08-13 ET
Application version: v1.2.0
Candidate runtime asset revision: `1.2.0-r2`
Previous known-good runtime: `1.2.0-r1`
Repository: `nikahanghojjati-oss/fifa17-career-showdown2`
Branch: `agent/ios-loading-settings-install-fix`
PR: #38
Status: RELEASE CANDIDATE

## Owner instruction

Fix, test, deploy and ship the iOS installed-app loading regression and the install UI hierarchy regression. Installation belongs in Settings. Floating bars, sticky prompts and universal install overlays are not authorized.

## Root cause and fix

The old mobile loading path combined a full-height athlete frame with a width-constrained, bottom-aligned `object-fit: contain` portrait. A taller standalone iOS viewport increased unused vertical space above the rendered Reus image, so the installed app could show a large top band and shift the intended composition even though mobile Safari looked acceptable.

The r2 fix keeps safe-area/viewport handling separate from the visual composition. The mobile photo gets a bounded width-owned top band and its own stable image box with subject-safe fill. Raw viewport-height units are not used to stretch the art.

The old offline controller also injected a fixed global install/status rail and panel. r2 removes presentation injection from the controller. Service Worker registration, complete-cache verification, connectivity probing, safe update activation, previous-runtime rollback and offline media degradation remain. Settings owns the install/update UI and delegates to those controller APIs.

## Regression philosophy

The release gates must verify composition relationships, not only element existence. The loading visual audit covers desktop, low-height desktop, narrow mobile browser and iOS standalone-height archetypes. It checks bounded top-band geometry, image anchoring, crop coverage, identity position, status/lower-copy placement and browser-versus-standalone drift.

Settings/offline contracts must prove no global fixed or sticky install UI exists and the install/update controls live inside Settings. Stability browser proof must exercise the Settings-owned state while preserving offline boot, all three canonical raw storage values, update boundaries and Candidate A/B/C offline loading.

## Protected systems

No gameplay rule, scoring rule, club database, persistence authority, Candidate A/B/C contract, Smart Back ownership, Home Reus treatment, accepted licensed football image, or startup performance ceiling may change.

Candidate C continues to require immutable confirmed intent, strict exact raw snapshot, last-moment prewrite checks, transaction-owned mutation/rollback, byte-for-byte verification and anti-clobber semantics.

## Release boundary

Do not call `1.2.0-r2` production-proven before protected PR checks, merge, GitHub Pages deployment, deployed Stability and release integration evidence are complete. Preserve `RELEASE_V1.2.0.md` and `CAREER_MODE_SHOWDOWN_V1.2.0_MAINTENANCE_HANDOFF.md` as immutable r1 evidence.
