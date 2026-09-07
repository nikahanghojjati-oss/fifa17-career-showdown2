# Career Mode Showdown v1.9.1-r4 Maintenance Release Record

Status: RELEASE CANDIDATE / NOT PRODUCTION-PROVEN
Application version: `v1.9.1`
Runtime revision: `1.9.1-r4`
Previous known-good whole shell: `1.9.1-r3`
Remote Joining readiness: `100/100` under frozen model `RJR-1`
Shared Showdown Journey readiness: `0/100` under fixed model `SSJR-1.1`

## Purpose

This bounded release candidate makes the irreducible production two-account Shared Showdown acceptance materially easier without lowering its evidence bar. It adds an explicit query-gated guided recorder to the already production-proven paired-first Shared Setup path. Normal gameplay does not load or display the recorder.

Acceptance mode is enabled only with `?ssjr-acceptance=1`. The recorder watches the production Shared Setup state and automatically records privacy-safe positive checkpoints for exact pairing plus ACTIVE-before-setup, authoritative revision 4, identical final revision 6, unchanged canonical local gameplay storage, real reload/resume, and a fresh ACTIVE same-rivalry session resuming the identical setup.

## Simple-mode owner experience

The default recorder surface intentionally exposes one prominent context-aware `NEXT STEP` control. It changes itself as the run advances:

1. open the private-session controls;
2. open Shared Setup;
3. arm and perform the real reload proof;
4. open the fresh private-session controls;
5. download the privacy-safe result.

The detailed legacy controls remain available only inside collapsed `MORE CONTROLS — only if needed` fallback UI. Automatic polling marks PASS/PENDING without requiring the owner to inspect JSON, revision hashes or canonical-storage bytes. Screenshots are not required unless the recorder itself reports an error.

The recorder cannot sign into the two private manager accounts, choose the owner’s browser/device identities, or physically perform the two-device interactions. Those remain the genuine human boundary. Everything else in this positive-evidence path is reduced to automatic observation or a single next-action control where safely possible.

## Candidate evidence

PR #212 is the publication lane. This maintenance record is candidate-era authority only and must not be rewritten as deployed proof before the final exact PR head passes all 15 permanent workflow families, review threads are clear, expected-head merge protection succeeds, post-merge main publication gates pass, and the deployed public site independently proves the coherent `1.9.1-r4` shell.

Source, tests, CI, review, merge, deployment, documentation, WEC and recorder tooling earn zero SSJR credit by themselves. Fixed SSJR-1.1 remains `0/100` until genuine two-account production evidence qualifies against the frozen model and strict validator.

## Installed-app whole-shell boundary

`1.9.1-r4` is a new whole-shell identity because executable browser behavior changed. Its HTML, application assets, Home portrait reference, manifest icon URLs and Service Worker shell use the r4 revision. `1.9.1-r3` remains the immediate production-proven recovery target. Never construct or certify a mixed r3/r4 shell.

The Installable Offline App and v1.3.0 Recovery & Device Resilience baseline remain protected. A failed r4 publication must leave the verified r3 whole shell recoverable without touching canonical user data.

## Recorder privacy and canonical-storage boundary

Raw account, registered-browser/device, rivalry, pairing or session authority values must never be persisted or exported by the recorder. Only one-way SHA-256 fingerprints and bounded Shared Setup facts may survive reload. The recorder acquires canonical gameplay bytes only through the existing read-only storage authority and persists only a digest comparison.

Canonical local gameplay storage remains exactly:

- `careerModeShowdown.saveLibrary`
- `careerModeShowdown.legacyShowdowns`
- `careerModeShowdown.preferences`

Shared Setup and the recorder must not mutate those keys merely to establish remote setup evidence. Candidate A remains non-mutating, Candidate B remains read-only, and Candidate C remains the sole destructive remote-to-local gameplay Apply authority with transaction-owned mutation and strict exact raw-snapshot rollback.

## Shared Setup evidence boundary

The recorder does not manufacture missing setup facts. A qualifying observed final setup still requires one authoritative repository-catalog league, two distinct permanent same-league clubs, one supported `1 / 3 / 5 / 10` season length, both distinct manager confirmations, `SHOWDOWN_CONFIRMED`, and exact revision 6.

Pairing plus exact ACTIVE private-session authority must precede every shared league or club operation. Reload and fresh-session proofs must resume the same final setup without reset/redraw. Any canonical-storage divergence or authority drift fails closed.

The positive recorder does not by itself satisfy the eight required production denial labels per manager. Those remain a strict evidence boundary and should be automated/aggregated wherever the real production provider can prove them safely, rather than turned into repetitive owner ceremony.

## Permanent safety boundary

Firebase remains Spark and billing remains permanently forbidden. Billing must never be activated. Do not attach Cloud Billing, enable Blaze, add a payment method, activate Cloud Run or Cloud Functions, purchase credits, or select any billing-required provider path. Firestore browser persistence remains memory-only. App Check enforcement remains OFF. Google Auth remains popup-only `browserSessionPersistence` with no additional scopes.

Private pairing, Connected Rivalry and Private Remote Joining remain exact non-enumerable capabilities for exactly two private managers. No public discovery, listing, lobby, matchmaking, community surface, rankings or global leaderboard may be introduced.

## Evidence truth and next boundary

RJR-1 remains frozen `100/100`; consumed RJR physical acceptance is not repeated absent a proven regression. SSJR-1.1 remains `0/100` until real production evidence qualifies. Once r4 is production-proven, the next bounded action is the genuine two-account recorder-assisted Shared Setup acceptance. Transfer/results/scoring/history transport remains out of scope until that evidence boundary is resolved.
