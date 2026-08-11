# NEXT TASK — Career Mode Showdown

Last updated: 2026-08-11

Application version: v1.1.0

Runtime asset revision: `1.1.0-r1`

## Current baseline: v1.1.0 Stable

PR #14 is the v1.1.0 Candidate A release path. The current branch implements **Versioned Backup Envelope + Non-Mutating Export**, five maintenance fixes, and the owner-requested face-safe return of FIFA-style diagonal accents.

## Current technical gate

Before merge, all eleven permanent workflows must pass on one frozen PR head. Stability must reach the new backup contracts and two full Chromium cycles. Licensed Football Visuals must show the line retune at desktop, 940px and mobile without entering the protected face/head zones. Candidate A Data Management screenshots must be inspected. Temporary tooling must not survive.

After merge, verify exact Pages bytes and rerun deployed runtime provenance, Home/Reus, football visuals, Candidate A export and the complete journey.

## Current owner gate

v1.0.2 visual direction is approved. The new v1.1 diagonal accent retune is **pending deployed real-device inspection**. Automated gates do not replace owner art-direction judgment.

## Scope lock

Candidate B import analysis and Candidate C restore are not part of PR #14. Do not begin them until Candidate A is merged/deployed/proven. Do not change gameplay, scoring, routing, storage keys/schema, player source crops, loading-screen composition, Messi/Lahm or the existing save identity model.

## Next roadmap step after Candidate A release proof

Candidate B — **Import Analysis + Migration Preview** — remains read-only/dry-run and must perform zero canonical localStorage writes/removals.
