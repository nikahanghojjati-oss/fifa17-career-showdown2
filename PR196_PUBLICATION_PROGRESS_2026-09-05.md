# PR196 publication and physical acceptance progress

This is an active work record, not a successor transition. SLE = Smart Lean Efficient. Current source, live evidence and later owner instructions win.

## Verified entry boundary

- Main: `2302e8daba6c9417954bc610f537aba41c4d3d87`.
- PR196 reviewed head: `ffb1d7579e3d6149ac58254ef47cfd58b0f4b2a2`, tree `8b8879782f2b1d6e44b0f8ff1b1c18efd31d671e`.
- All 15 PR workflow families and all 15 prior-main workflow families passed. The local exact-head 87-file contract suite passed.
- Production: v1.9.1 / 1.9.1-r2; all 100 runtime files independently matched production byte for byte.
- Fixed RJR-1: 91/100, vector 20/20, 20/20, 20/20, 22/30, 9/10. This publication receives zero credit.
- The closed predecessor WEC validated and matched its archive exactly. Its canonical history closure already exists.
- Fresh active WEC: `we-2026-09-05-pr196-publication-physical-acceptance-e9072`. Usage remaining is unavailable. The predecessor decision is not inherited.

## Additional review finding and correction

The two initial P2 findings were corrected and resolved before successor entry. A newly requested Codex review on ffb1d757 identified a third valid P2 in thread `PRRT_kwDOTomsDM6fkYGU`: unchecked nested structures beneath known scalar fields could be accepted and marked privacy-safe.

The regression reproduced the gap. The correction validates every root, device and record field type, allowing null only where the recorder emits it and treating runtime/error annotations as optional strings. Nested object/array payloads and invalid primitive types fail with `privacySafe: false`. Diagnostics use trusted schema locations and never echo rejected values or arbitrary input property names.

Adversarial coverage injects nested objects and arrays at every scalar field in the real export shape, including optional record annotations. Separate malformed primitive cases cover browser facts, booleans, timestamps and revisions. Existing valid-pair, mismatched-session, same-network, missing-interruption, resurrection, unknown-field and version cases remain required.

The fresh active WEC accompanies this substantive correction. Continuity contracts pin the predecessor archive's exact SHA-256 and separately require the fresh active owner, current capsule agreement and non-inherited decision. No historical archive or accepted RJR provenance changes.

## Current safe action

Corrected-candidate preflight passed all 87 contract files plus Stage 5H/5I browser audits, and the server port was released. Publish this correction to PR196, obtain final-head review and all 15 PR workflow families on one unchanged head, resolve the addressed thread after proof, then squash-merge with expected-head protection. Require all 15 main-push/Pages families, production proof and `npm run test:rjr-physical-preflight` before asking for physical evidence.

Then conduct one bounded Chromebook host on Wi-Fi / iPhone peer on cellular run at `?rjr-acceptance=1`: Host, Join, ACTIVE revision 1 on both, a real participating network interruption and same-session recovery, Close, CLOSED revision 2 on both without resurrection. Validate both sanitized JSON exports. A PASS is only an evidence candidate; physical independence and final fixed-ledger reconciliation remain separate judgments.

Billing is permanently forbidden; Firebase remains Spark. No provider, Rules, runtime, canonical storage or readiness-ledger change is part of this correction. App Check enforcement remains OFF, Firestore memory-only, Google Auth popup-only session persistence, Candidate C the sole destructive local Apply authority, exactly two private managers and no public discovery. Never retain raw private capabilities or authority IDs, and never destructively test the protected historical rivalry.
