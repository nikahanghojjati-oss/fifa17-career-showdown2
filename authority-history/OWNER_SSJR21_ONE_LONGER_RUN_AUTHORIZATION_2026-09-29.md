# Owner authorization: SSJR-2.1, one longer run for up to 100/100

Date: 2026-09-29 (America/New_York). Owner: Nik (product owner and final authority on SSJR acceptance).

## Owner request (verbatim, from the Claude gameplay engineering session, 07:12 local)

> I rather to do just one longer game for up to 100 so you know we can just do like if we can do like we can do an update so I can just do like one test and we can earn like like all the SSJR that would be better I prefer that like can you update the test so we can do that

This followed Claude's report that a one-season SSJR-2.0 run can prove at most 82/100. The remaining 18 points were blocked because the Physical Journey recorder captured only one-season plans.

Standing authority from the same owner (2026-09-28) still applies: "You have full authority to make any changes necessary so ssjr test actually works, reflect production truth, and be up to date."

## What this authorizes

- **SSJR-2.1** replaces SSJR-2.0 as the active reporting model in `SHARED_SHOWDOWN_JOURNEY_MODEL_SSJR2.json`.
- The byte-identical SSJR-2.0 model is preserved at `authority-history/SHARED_SHOWDOWN_JOURNEY_MODEL_SSJR2_0.json`.
- **The only change is how multi-season is proven.**
  - From runtime `1.9.1-r51`, the recorder records every season of the confirmed plan, plus the completed plan.
  - The validator requires every season, in order, on both devices, with Final Reconciliation on the last season.
  - Multi-season is credited from one validated run of at least two confirmed seasons. Its dependents follow through the unchanged dependency graph.
- **Unchanged:** capabilities, weights, dependencies, the three evidence layers, zero-credit activities and permanent locks.
- **Stable release:** the `stable-journey-release` capability still requires Nik to set `stableReleaseAccepted: true` in the hash-bound attestation.

## What this does not authorize

- No credit from CI, emulators, two tabs, Incognito windows or simulated browsers.
- No change to billing (OFF), Firebase (Spark only) or App Check enforcement (OFF).
- No change to the two-manager private scope or to Candidate C Apply authority.
