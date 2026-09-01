# Stage 5D Production Rules Provider-Pending Proof — 2026-09-01

Status: REPOSITORY / CI / REVIEW / MERGE / PAGES PROVEN — AUTHENTICATED FIREBASE PROVIDER PUBLICATION PENDING

Remote Joining readiness remains fixed at 87/100 under RJR-1. Repository source promotion, CI, review, merge, Pages publication, provider publication mechanics, WEC and SLE earn zero capability credit.

## Exact completed boundary

PR #176 `Promote minimum production private-session Rules source` was reviewed and squash-merged by expected head.

- final PR head: `4c1e9be8e0af26e277ed9fd1ae0545ec065173ff`
- final PR tree: `e7083c2cda0e737f9d1c5654ca663df6ddf3408a`
- squash merge / verified main: `a4489fe7d812144deb3f747019eb162628480dac`
- merge tree: `e7083c2cda0e737f9d1c5654ca663df6ddf3408a`
- reviewed repository Rules source: `firestore.spark.rules`
- reviewed Rules Git blob: `363af783d7e5436fdfaa3766d4aa413fc9952a08`
- source lineage: byte-identical to the already-proven `firestore.stage5c.rules` blob
- production runtime remains `v1.8.1 / 1.8.1-r5`

All 14 permanent exact-head PR workflow families passed on the unchanged final head. Java 21 Stage 3 run `33530646438`, job `99932635371`, passed the deterministic Stage 5 production Rules contract and the Stage 5A, Stage 5B and Stage 5C Firebase emulator proofs.

Codex was requested on the final reviewed lineage but GitHub explicitly reported that included code-review usage was exhausted and continuing required an account upgrade or paid credits. Paid review is forbidden by the project zero-billing rule. The repository therefore used its documented zero-billing exact-head fallback: complete changed-file audit, 14/14 exact-head workflow success, Java 21 Stage 5 emulator success and zero valid unresolved review threads. The fallback review found no major issue and was recorded on the exact final commit. The quota refusal itself was not treated as review success and earned zero RJR credit.

PR #176 then merged by expected head, preventing a head race. Main and the merged tree were independently verified. Post-merge Pages validation proves the unchanged deployed `1.8.1-r5` runtime byte boundary; no Stage 5 host/join runtime is loaded by this milestone.

## Provider truth remains deliberately separate

The repository source is ready for provider publication, but the current environment has no authenticated Firebase production control plane. The available integrations expose GitHub but no Firebase or Google Cloud deployment connector. Repository search found no Firebase deploy workflow, Firebase CLI token reference or workload-identity provider configuration that could safely perform production Rules publication. GitHub secret APIs are unavailable to this integration and no credential is inferred or fabricated.

Therefore this checkpoint does not claim that production Firebase currently serves blob `363af783...`.

The last independently provider-proven production Rules remain:

- Firebase project: `fifa17-career-showdown-prod`
- Firestore database: `(default)`
- provider-proven repository source: `firestore.spark.rules`
- last provider-proven deployed blob: `2b7c0b166ae0aae7ab7a3ce84725b21091262484`
- proof: `PRODUCTION_FIRESTORE_RULES_PROVIDER_PROOF_2026-08-29.md`

`firebase.production.environment.json` must continue to record that old provider-proven blob until a new provider publication is independently verified. Source promotion must never be misreported as provider activation.

## Exact zero-billing provider action

In a successor environment that already has an authenticated Firebase CLI or authenticated Firebase Console session for `fifa17-career-showdown-prod`:

1. Independently verify live `main`, PR #176 merge state, this proof, current RJR87 and the closing WEC.
2. Confirm Firebase remains Spark. Do not link Cloud Billing, enable Blaze, add a payment method, buy credits, activate Cloud Run or use any billing-required service.
3. Verify current-main `firestore.spark.rules` still has Git blob `363af783d7e5436fdfaa3766d4aa413fc9952a08` and `firebase.production.rules.json` still targets only `firestore.spark.rules`.
4. Using the already-authenticated provider session, publish Firestore Security Rules only. The intended Firebase CLI form is `firebase deploy --only firestore:rules --project fifa17-career-showdown-prod --config firebase.production.rules.json`. Do not deploy Functions, Storage, Hosting, Cloud Run or any other provider surface as part of this action.
5. Independently verify from the authenticated provider control plane that the active production Firestore Rules source is the reviewed source. Record durable provider evidence before changing any production manifest claim.
6. Only after independent provider verification may a later evidence PR update `firebase.production.environment.json` to the new provider-proven blob and mark the Stage 5C production Rules publication fact true.
7. Provider publication mechanics alone still earn zero RJR credit. Only after the provider Rules fact is sealed may a fresh reviewed runtime WEC begin the separate host/join UX slice.

## Security and product locks

The promoted Rules use ordinary Firebase `request.auth.uid` as account authority. Registered device IDs remain account-owned mutation metadata, not physical-browser authentication. Exact 256-bit capability, no listing, exactly two entitled rivalry accounts, host-open, peer-join, CAS, expiry, revoke, close, terminal no-resurrection and final deny-by-default remain protected.

App Check enforcement remains OFF. Firestore browser persistence remains memory-only. Google Auth remains popup-only `browserSessionPersistence` with no extra scopes. Canonical local storage remains exactly `careerModeShowdown.saveLibrary`, `careerModeShowdown.legacyShowdowns` and `careerModeShowdown.preferences`. Candidate C remains the sole destructive remote-to-local Apply authority. Public discovery, community, matchmaking and global rankings remain prohibited. The protected historical rivalry remains untouched.

## Authority

`00_OWNER_ZERO_BILLING_REMOTE_JOINING_AUTHORIZATION.md` authorizes every remaining nonbilling Remote Joining engineering, Rules, provider, IAM, Auth-policy, runtime, testing, evidence, merge and publication decision after mandatory gates. Billing remains the permanent exception. No repeated owner approval is required for the provider Rules publication described above as long as it remains Spark-compatible and passes the required evidence gates.
