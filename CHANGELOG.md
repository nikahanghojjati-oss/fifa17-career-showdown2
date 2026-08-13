# v1.2.0 — Installable Offline App

Date: **August 13, 2026**

Runtime asset revision: **`1.2.0-r1`**

Status: technically production-proven.

v1.2.0 adds the installable/offline application shell while preserving gameplay, storage authority, Candidate A/B/C safety, Smart Back, accepted visuals and startup limits.

Release changes:

- Web App Manifest and original install artwork;
- version-owned first-party Service Worker shell;
- atomic cache population and verification;
- explicit safe-boundary Update Ready activation with no automatic install activation;
- whole-runtime revision selection and previous-known-good recovery;
- unrelated-cache preservation;
- worker-owned network reachability verification;
- explicit offline degradation for external media;
- lazy install/offline controller so eager startup remains protected;
- install, offline, failed-population, activation, corruption and two-cycle recovery browser evidence;
- exact preservation of all three canonical localStorage raw values;
- unchanged Candidate A export, Candidate B read-only analysis and Candidate C strict exact raw snapshot plus transaction-owned rollback semantics.

Production evidence:

- runtime merge: `e5acd4ae524f181242df3114b35fd2e812cd8f3b`;
- Pages deployment: `5891182853`;
- Stability: `31716787806`;
- deployed smoke: `94503946791`;
- Release Integration Burn-In: `31716787876`, 2/2 complete stateful journeys passed.

Deployed Stability passed exact runtime bytes, provenance, Home visuals, licensed football visuals, Candidate A/B/C, install/offline behavior and the complete public journey.

Frozen eager budgets remained 164,563 raw / 37,355 gzip bytes within the protected 165,000 / 37,500 ceilings.

Technical production proof is separate from owner visual acceptance; no separate owner signoff is invented here.

## Historical changelog

The complete pre-v1.2 changelog is preserved byte-for-byte as `CHANGELOG_PRE_V1.2_ARCHIVE.md`. Immutable per-release details also remain in the existing `RELEASE_V*.md` records.

Historical release index: v1.1.5 Restore Transaction Safety Maintenance; v1.1.4 Candidate C Atomic Restore + Recovery UX; v1.1.3 League Wheel Stability + Cinematic Football Visual Expansion; v1.1.2 Candidate B Import Analysis; v1.1.1 James Rodríguez source refresh; v1.1.0 Candidate A Data Safety and Recovery; v1.0.2 Clean-Anchor Visual Maintenance; v1.0.1 Stability Hardening; v1.0.0 Stable.

## Next milestone

v1.3.0 — Recovery & Device Resilience Hardening.

The older roadmap assignment of v1.3.0 directly to Local Profiles and Save Library is stale as a current task. Local Profiles remains future planned work with its new version assignment pending explicit reconciliation after v1.3 hardening.
