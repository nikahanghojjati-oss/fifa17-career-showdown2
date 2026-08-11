# NEXT TASK — Career Mode Showdown

Last updated: 2026-08-11

Application version: v1.1.0

Runtime asset revision: `1.1.0-r1`

## Current baseline: v1.1.0 Stable

Candidate A — **Versioned Backup Envelope + Non-Mutating Export** — is merged, deployed and technically proven. The production runtime remains the implementation authority. Candidate B import analysis and Candidate C restore are not part of the clean-stability build.

## Immediate clean-stability rule

When the owner requests a clean/stable build, branch directly from current `main` and reproduce the existing production state rather than redesigning it. The build is releasable only when every permanent feature/workstream/release workflow passes on one frozen final SHA, including Home Bootstrap, League Confirmation, Transfer, Season Review, Statistics, Settings, V1 Visual Immersion, Licensed Football Visuals, Final Polish, Static App, Stability Lane, and the five-pass release burn-in.

A failed/cancelled/timed-out gate is not a pass. Fix only reproduced defects, do not weaken contracts or raise performance budgets to obtain green CI, and restart final-SHA proof after any source change. Temporary helpers must be removed before merge.

After merge, Stability must verify GitHub Pages runtime-byte parity and repeat deployed runtime provenance, Home/Reus, football visuals, Candidate A backup/export and the complete public-site journey.

## Current owner gate

Automated visual gates do not replace owner art-direction judgment. The v1.1 face-safe diagonal accent retune remains subject to real-device owner inspection until explicitly accepted. The owner-liked loading presentation remains protected.

## Next substantive roadmap candidate

If the owner asks to advance features after the clean-stability seal, Candidate B — **Import Analysis + Migration Preview** — is the next legal candidate. It must remain read-only/dry-run and perform zero canonical `localStorage` writes/removals. Candidate C restore remains blocked behind Candidate B evidence.

Do not change gameplay, scoring, routing, storage keys/schema, player source crops, loading-screen composition, Messi/Lahm, or the existing save identity model without explicit owner instruction or a reproduced release defect.
