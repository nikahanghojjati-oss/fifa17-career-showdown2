# Career Mode Showdown — v1.1.0 Release Record

Date: 2026-08-11
Release tag: `v1.1.0`
Application version: `v1.1.0`
Runtime asset revision: `1.1.0-r1`
Release class: roadmap advancement + maintenance hardening
Owner status: v1.0.2 approved; v1.1 face-safe accent retune pending deployed real-device inspection

## Roadmap milestone

v1.1.0 ships **Data Safety and Recovery — Candidate A only**: `Versioned Backup Envelope + Non-Mutating Export`.

Candidate B import analysis and Candidate C restore remain explicitly deferred.

## Candidate A

- read-only storage snapshot remains owned by `js/storage.js`;
- lazy `js/backup.js` creates a format-v1 envelope;
- active Showdown, Legacy and preferences are represented;
- malformed current bytes are retained in labelled recovery records;
- SHA-256 detects accidental corruption/tampering after export;
- readable JSON downloads locally with a timestamped filename;
- export performs zero canonical `localStorage.setItem()` / `removeItem()` operations;
- existing Showdown IDs/timestamps are preserved.

## Five maintenance fixes

1. corrupt non-empty active data no longer advertises a usable Continue Career save;
2. malformed Legacy shape is reported/preserved instead of silently appearing empty;
3. Settings degraded fallback identity is no longer stuck on v1.0.1;
4. committed destructive Data Management actions give explicit success feedback;
5. backup export is single-flight under rapid repeated activation.

## Visual amendment

The owner approved v1.0.2 clean-anchor photography but asked that FIFA 17-inspired diagonal energy remain. v1.1 restores bounded cyan/yellow accent rails only in lower-body/photo-edge zones. Permanent browser tests reject rails that enter the protected head/face region.

The owner-liked loading screen remains regression-protected.

## Quality boundary

Before merge, all eleven permanent workflow families must pass on one frozen SHA. Candidate A contracts/browser QA must cover empty/partial/full/corrupt/large-history states, real JSON download, keyboard/touch, reduced motion, axe, overflow, zero-write proof and checksum verification. Licensed visual QA must cover desktop/windowed/mobile face-safe accents.

After merge, Pages must deploy the exact merge and Stability must repeat deployed bytes, runtime provenance, Home/Reus, football photos, Candidate A export and the complete journey.

## Rollback

Immediate runtime rollback target is deployed v1.0.2 runtime merge:

`7a573ff2691b6143ecbc53df589822d5609f5e05`

`RELEASE_V1.0.2.md` remains immutable previous-release evidence.
