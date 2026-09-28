# Owner authorization — SSJR-2.0 simplified evidence (2026-09-28)

Owner: Nik (product owner and final authority for physical two-device acceptance).
Recorded by: Claude Opus 5.5, Lead Gameplay Reliability Engineer.

## Owner instruction (verbatim, 2026-09-28)

> You have full authority to make any changes necessary so ssjr test actually works, reflect production truth, and be up to date. Fix all issue and once it is fully ready if you can simply it do it otherwise give me the fixed test

Owner answers to the EVD-01 decision packet:

> N1 (owner sign-off as proof): if the game is working ssjr can improve i think that s correct
> N2: You can build them now
> N3 (third Google account): every time any new google account login to game, game will ask are you daniel or nik upon login so i don't understand how you want to test this idea

## Why SSJR-1.1 could not be satisfied

- `scripts/validate-ssjr-shared-setup-actor-evidence.mjs` rejected every browser export, because `scripts/ssjr-actor-evidence-v2.mjs` hard-codes `productionProvenanceAuthenticated:false`. No real run could ever credit the setup domain, and every later capability depends on it.
- The setup evidence tooling was pinned to runtime `1.9.1-r6`.
- It required a third unrelated Google account. The product deliberately asks every new account whether it is Daniel or Nik, so the owner could not operate that witness.
- It required a real 4-hour session expiry with the page left open.
- No production rejection tooling existed for career start through history.

## What SSJR-2.0 changes

`SHARED_SHOWDOWN_JOURNEY_MODEL_SSJR2.json` keeps every SSJR-1.1 capability, weight and dependency unchanged. Only the proof sources change:

1. **Rejection and denial behaviour** is proven by the automated deterministic and provider-enforcement suites named for each capability. Those suites include Firestore Rules emulator tests against the exact generated production Rules. They must pass on the production main being credited.
2. **Real production behaviour** is proven by one validated two-device Physical Journey pair (`scripts/validate-ssjr-physical-journey-evidence.mjs`). The capability's milestones must be present on both devices. This includes the recorder's non-writing production stale/replay conflict probe.
3. **Provenance** is Nik's owner attestation for that exact run (`acceptance/SSJR2_OWNER_ATTESTATION_TEMPLATE.json`), bound to the SHA-256 of both export files and delivered by Nik to the recording engineer.
   - No independent identity channel exists: automation uses the owner's own GitHub account, and the game admits only the two manager Google accounts.
   - This residual trust is accepted by the owner and stated in the model's `provenanceTrust`.
   - The automated layer is verified live against GitHub at record time, never asserted by a flag.

A one-season run cannot prove season-to-season advancement. The current recorder also records each stage only once, so no run can credit `multi-season` until a recorder and validator revision captures per-season milestones. Its dependents therefore remain uncredited from a one-season run: `final-reconciliation`, `terminal-close`, `physical-journey` and `stable-journey-release`. No weight or dependency was changed to avoid this.

SSJR-1.1 files remain frozen and unchanged for history. Its score stays 0/100.

Permanent locks are unchanged:
- Firebase Spark only, billing OFF.
- No Blaze, Cloud Run or Cloud Functions.
- App Check enforcement OFF.
- Exactly two private managers.
- Candidate C remains the only destructive local Apply.
