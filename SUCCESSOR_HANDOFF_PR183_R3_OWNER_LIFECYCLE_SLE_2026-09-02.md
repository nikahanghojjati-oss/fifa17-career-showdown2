# FIFA 17 Career Mode Showdown — SLE Successor Handoff — PR #183 r3 Owner Lifecycle

Treat this handoff as orientation only. Current source, live GitHub/provider/deployment state, WEC, security/recovery authority, RJR ledger and later owner instructions override recorded facts.

SLE = **Smart Lean Efficient**. The successor must recursively preserve `00_SLE_HANDOFF_PROTOCOL.md` at its own future transition.

## Fast startup

Repository: `nikahanghojjati-oss/fifa17-career-showdown2`
Public site: `https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/`
Recorded live main: `4eefed1f855d66c4af8c823291e24344886c617e`
Merged PR: `#183` — `Harden one-copy private pairing and Stage 5E owner flow`
Application: `v1.9.0`
Production runtime: `1.9.0-r3`
Pages run: `33672057887`
Pages artifact ID: `9862881955`
Pages artifact digest: `sha256:adb6e4e9384f5b2fd9f83865a5aeb8ad28ec01e947a0f28698498243aa1035e1`
Predecessor WEC: `we-2026-09-02-stage5e-production-acceptance`
Recorded fixed RJR-1 before post-test recalculation: `87/100`

Newest compact starter:
`START_NEXT_SESSION_V1.4.36_PR183_R3_OWNER_LIFECYCLE.md`

Starter mirror:
`project-documents/session-starts/START_NEXT_SESSION_V1.4.36_PR183_R3_OWNER_LIFECYCLE.md`

This handoff mirror:
`project-documents/handoffs/SUCCESSOR_HANDOFF_PR183_R3_OWNER_LIFECYCLE_SLE_2026-09-02.md`

Critical owner evidence:
`STAGE5E_R3_OWNER_PRODUCTION_LIFECYCLE_EVIDENCE_2026-09-02.md`

Normal successor loading path:

1. retrieve newest START NEXT SESSION;
2. read `SESSION_BOOTSTRAP.json`;
3. independently verify live GitHub/deployment/RJR state;
4. validate/archive predecessor WEC as historical closure;
5. initialize a fresh successor WEC with a unique environment ID and reset counters;
6. obey the fresh assessment;
7. read this deep handoff only as needed.

Never inherit the predecessor's final `HANDOFF_AT_CHECKPOINT` decision as the successor's starting decision.

## Owner reporting contract

Every substantive project checkpoint must explicitly include:

`Handoff proximity: N%`
`RJR: X/100`

Handoff proximity is current-environment continuity readiness. It is not RJR, milestone completion or hidden quota. RJR moves only from evidence-backed capability under the fixed `RJR-1` model.

## Standing owner authority

The owner has standing merge/deploy authorization for the project once all required current gates are satisfied. Later owner instruction also authorizes all nonbilling engineering/provider/auth-policy/Rules/runtime/deployment/testing/evidence decisions required for Remote Joining.

The permanent exception is billing: **billing must never be activated**.

Do not ask again for authority that is already recorded unless a genuinely new billing boundary or owner-only external action arises.

## Permanent locks — non-negotiable

- Firebase remains **Spark**.
- Never attach Cloud Billing, enable Blaze, add a payment method, activate Cloud Run, Cloud Functions or another billing-required service even if it advertises free usage.
- Firestore browser persistence remains **memory-only**.
- App Check enforcement remains **OFF**.
- Exactly two private managers remain authoritative.
- No public session listing, discovery, lobbies, matchmaking, community, rankings or public profiles.
- Exact private capability access only.
- Canonical browser storage remains exactly:
  - `careerModeShowdown.saveLibrary`
  - `careerModeShowdown.legacyShowdowns`
  - `careerModeShowdown.preferences`
- `activeShowdown` is not canonical.
- Remote Joining must not mutate canonical local saves.
- Candidate A remains non-mutating export.
- Candidate B remains read-only import analysis.
- Candidate C remains the **sole destructive remote-to-local gameplay Apply authority**.
- Do not edit, force, delete or destructively test the protected historical rivalry.
- Provider/quota failure must fail closed while local Career Mode remains playable.
- Never expose full `pair_...` or `session_...` capability material in chat, logs, committed evidence or screenshots. Use truncation/fingerprints.

## How this environment arrived here

### PR #181 / r1

PR #181 shipped the first production Stage 5E Private Remote Joining runtime as `v1.9.0 / 1.9.0-r1`.

The first genuine owner-device production attempt exposed a Connected Rivalry restore defect: Player Two could initially attach, but reinitialization selected the first local manager binding rather than the binding that owned the saved pointer. Remote Joining then saw no attached rivalry for the intended Player Two context.

### PR #182 / r2

PR #182 corrected durable Connected Rivalry restoration across all valid local manager bindings and added pairing-to-Connected-Rivalry auto-link QoL. It was merged/deployed after full validation.

### PR #183 / r3

The owner requested a smoother normal flow:

- Player One creates one pairing capability;
- direct `COPY PAIRING CODE` button appears under it;
- Player Two pastes that exact value once;
- the exact same `pair_...` identity carries automatically into both Connected Rivalry contexts;
- normal flow must not require manual `VERIFY / REATTACH`;
- manager selection must remain bound to the manager chosen when CREATE/JOIN begins.

PR #183 implemented and hardened that bounded QoL behavior without changing infrastructure authority.

Key r3 protections include:

- direct full-capability Copy action for Player One;
- exactly one Player Two paste in the intended flow;
- exact pairing identity propagation without transformation;
- manager selection captured/locked for a live capability;
- durable pointer restore across manager bindings;
- late device-registration initialization cannot clobber pairing state;
- stale Settings copy saying Remote Joining was locked was corrected to truthfully point to Showdown Home;
- no polling, new Firebase service, new storage key, new Rules authority, new authentication path or Candidate C bypass.

Permanent regression proof includes deterministic repeated four-code equality and fresh-process Chromium Player One/Player Two scenarios.

## PR #183 publication / production proof

Final reviewed PR head before merge: `4adc1545be9b43b90cd23ee6a46f64c456f81a9f`.

All 14 required exact-head workflow families passed. Inline review threads were zero unresolved at publication.

Merge/live main: `4eefed1f855d66c4af8c823291e24344886c617e`.

Post-merge Pages run `33672057887` succeeded for that exact merge SHA. Deployment logs reported successful Pages deployment to the public site.

Exact deployment artifact:

- ID `9862881955`
- digest `sha256:adb6e4e9384f5b2fd9f83865a5aeb8ad28ec01e947a0f28698498243aa1035e1`

The deployed artifact was inspected and contains `v1.9.0 / 1.9.0-r3`, r3 Service Worker identity, the pairing Copy action, corrected Remote Joining copy and unchanged billing/discovery/local-save/Candidate C locks.

Post-merge Release Integration Burn-In run `33672057860`: both integration passes succeeded.

Post-merge Stability run `33672057917`:

- stability contracts: success;
- Chromium stability: success;
- deployed-site smoke: success.

The deployed-site smoke verified every production runtime byte and exercised runtime error provenance, production App Check token path, Home, Save Library, manager identity, analytics, football-photo safety, Candidate A/B/C, offline/install boundary and the complete deployed journey.

Do not repeat these publication/deployment gates merely for confidence unless a new source head makes them necessary.

## Latest owner production evidence — major capability PASS plus QoL defect

Read the dedicated evidence record before changing code:

`STAGE5E_R3_OWNER_PRODUCTION_LIFECYCLE_EVIDENCE_2026-09-02.md`

Owner browser topology:

- Player One: ordinary Chrome, authenticated account A, registered application-device identity A.
- Player Two: Chrome Incognito, authenticated distinct account B, registered application-device identity B.
- Both on one physical Chromebook.

### What worked

Player Two initially showed automatic Connected Rivalry attachment from the completed private pairing with no second code entry.

After the owner manually aligned stale Connected Rivalry pointers, the real production Remote Joining runtime completed:

`Host → Join → ACTIVE rev 1 → peer Read/Refresh ACTIVE → Close → other peer Read/Refresh CLOSED rev 2`

Owner screenshots show:

- Player Two: `ACTIVE · REV 1 · PEER`;
- Player One: `ACTIVE · REV 1 · HOST`;
- Player Two: `CLOSED · REV 2 · PEER`;
- Player One after refresh: `CLOSED · REV 2 · HOST`.

The runtime message explicitly reported an active session with exactly the two paired rivalry accounts and local gameplay unchanged.

This is genuine provider-live actual Remote Joining lifecycle evidence, not emulator/CI substitution.

### What still failed

The no-manual-reattach automation did **not** fully pass.

Current new test rivalry: truncated `pair_516141...d3a07a`.
Old Player One durable rivalry from prior production test: truncated `pair_691f64...ae444`.

Player One reopened with the old rivalry still selected. The owner had to replace it with the new rivalry and press `VERIFY / REATTACH`. The owner also reports pressing reattach on Player Two to ensure alignment before continuing.

Therefore do not state that r3 achieved zero-manual-reattach normal flow. It did not.

## Root-cause investigation — complete

The defect is source-confirmed in `js/sparkConnectedRivalry.js`.

Current `crInitialize()` logic effectively does:

1. resolve/restore a durable saved pointer across local manager bindings;
2. if a durable pointer exists, use it;
3. only if no durable pointer exists, inspect a current pairing candidate and try automatic attach.

That precedence is wrong for the specific transition from an older still-valid rivalry A to a newly completed exact pairing B.

A stale but structurally valid durable pointer A prevents provider-active B from ever being considered. This explains the owner evidence exactly:

- Player One had durable A from yesterday;
- Player Two completed current B;
- Player Two with no conflicting durable pointer auto-attached B;
- Player One restored A and skipped B;
- manual replacement/Verify-Reattach moved Player One to B;
- Remote Joining then worked end-to-end.

This is a **pointer selection precedence bug**, not a need to rebuild pairing, Firestore, Auth, Rules or Remote Joining.

## Required correction — smallest safe slice

Do not remove durable-pointer safety. Instead make selection evidence-aware:

- if there is no current pairing B, keep durable A;
- if B is pending, expired, malformed, unavailable, unauthorized, wrong-account, wrong-device or wrong-manager, keep A;
- if B is provider-confirmed `active`, and exact current account + registered device context + selected manager binding are authorized, B may supersede stale A;
- persist B only through the existing verified Connected Rivalry pointer path;
- never delete/edit/force old provider rivalry A merely because the browser pointer advances;
- no polling;
- no new localStorage;
- no new provider collection/listing path;
- no Rules/auth/IAM expansion;
- no canonical save mutation;
- no Candidate C authority change;
- no billing.

### Mandatory regression matrix

Before asking the owner to test again, prove at minimum:

1. stale durable A + provider-active exact B → initialize converges to B and stores B;
2. pending/unverified/mismatched B → A remains unchanged;
3. Player One creates B, Player Two joins B with exactly one paste, Player One later reinitializes → Player One automatically converges to B without `VERIFY / REATTACH`;
4. Player Two remains on B across DONE/reopen/Remote Joining;
5. `P1 generated == P1 Connected Rivalry == P2 one pasted value == P2 Connected Rivalry`;
6. no second Player Two paste;
7. no canonical localStorage mutation;
8. no billing/discovery/Candidate C/session-authority expansion;
9. a valid unrelated older provider rivalry is not destructively modified or deleted.

Prefer a deterministic contract plus fresh Chromium manager-isolated browser tests matching production Save Library geometry. Reuse existing r3 test helpers instead of introducing parallel infrastructure.

## Smallest owner acceptance after the fix

The user should not be burdened with another full lifecycle unless session code changes.

After the stale-pointer fix is merged/deployed and exact production bytes are independently verified, ask only for:

1. Player One creates a **fresh** pairing and presses `COPY PAIRING CODE` once.
2. Player Two chooses Player Two and pastes that value exactly once into `JOIN PRIVATE PAIRING`.
3. Player Two completes pairing and automatically shows the current Connected Rivalry without manual Attach/Reattach.
4. Player One reopens Save Library or directly opens Private Remote Joining.
5. Player One must automatically converge to the same current rivalry.
6. **Do not press `VERIFY / REATTACH`.** If it is required, stop and classify the test as failed.

The already-proven Host/Join/Read/Close lifecycle does not need to be repeated merely for confidence unless the fix modifies session-runtime behavior or a fresh fixed-domain evidence gap explicitly requires it.

## Sensitive capability handling

The owner's latest screenshots accidentally show the full `session_...` capability. The session is terminally CLOSED, but the capability must still be treated as sensitive evidence material.

Do not:

- quote it in chat;
- copy it into a commit;
- include it in issue/PR evidence;
- retain it in generated handoff text;
- ask the owner to expose a future one.

Future evidence must fully cover/redact the session capability. Truncated rivalry identifiers are sufficient for continuity.

## RJR-1 status and recalculation requirement

Checked-in authority at predecessor closure remains:

`REMOTE_JOINING_READINESS.json` → `RJR-1` → `87/100`.

Recorded fixed domains before this new owner proof:

- deterministic sync/recovery: `20/20`;
- identity/auth/authz/trust: `18/20`;
- production cloud/security: `20/20`;
- devices/pairing/Connected Rivalry/actual Remote Joining: `20/30`;
- real-device hardening/stable release: `9/10`.

The ledger explicitly said actual Remote Joining sessions remained uncredited. The owner has now materially proven an actual provider-live Host/Join/Read/Close lifecycle across two distinct application-device identities, so the successor must perform a genuine evidence-only RJR recalculation.

Do **not** mechanically leave the score at 87 after studying the new proof if the fixed domain rubric objectively awards points. Conversely, do **not** award the failed zero-manual-reattach automation or two-physical-device/two-network hardening. Document the exact delta and reason in `REMOTE_JOINING_READINESS.json` rather than estimating in chat.

Source code, PR #183, green CI, Pages deployment, SLE packaging and this handoff are all delta zero by themselves.

## Remaining known RJR gaps after lifecycle proof

Use the actual current ledger after recalculation. Known pre-proof gaps included:

- authenticated third-account / revoked-device production negatives specific to the relevant private Remote Joining boundary where still uncredited;
- two-physical-device/two-network Remote Joining hardening and reconnect/adverse-network behavior;
- remaining identity/auth/trust evidence;
- final stable Remote Joining real-device release acceptance.

Do not assume all of these remain worth the same points after the new lifecycle evidence; use the fixed RJR-1 domain model.

## Work Environment Continuity

Predecessor environment:
`we-2026-09-02-stage5e-production-acceptance`

The predecessor ends at `Handoff proximity: 100%` with `HANDOFF_AT_CHECKPOINT` because:

- r3 is deployed and fully production-smoke proven;
- genuine owner lifecycle evidence is captured;
- the remaining normal-flow automation failure has a source-confirmed root cause;
- the next task is a clean bounded stale-pointer-precedence repair suitable for a fresh environment.

The closing WEC decision is historical only. The successor must:

1. independently verify live main and current repository/provider/deployment truth;
2. validate/archive the predecessor closure;
3. initialize a fresh unique WEC with reset counters;
4. record verified starting main SHA;
5. assess independently;
6. obey its own decision.

## IMMEDIATE NEXT TASK AFTER FULL STUDY

1. Verify live `main`, PR #183 merge, Pages exact merge SHA, post-merge workflows, r3 deployed bytes and current RJR ledger.
2. Initialize fresh WEC; do not inherit predecessor transition decision.
3. Read the owner evidence record and source-confirm the stale-pointer precedence mechanism before editing.
4. Recalculate RJR-1 from the genuine owner Host/Join/Read/Close lifecycle, with no credit for the failed no-manual-reattach flow or process artifacts.
5. Implement only the provider-confirmed-current-pairing supersedes stale-durable-pointer correction.
6. Add the mandatory regression matrix above and run targeted + full applicable validation.
7. Review exact head, resolve valid threads, merge under standing nonbilling authorization, verify post-merge/Pages exact bytes.
8. Ask the owner for only the minimal zero-manual-reattach acceptance.
9. If it passes, record the evidence and continue directly to the smallest genuinely uncredited RJR dependency. Do not start a documentation sidequest.
10. Continue until genuine RJR reaches `100/100`, preserving every permanent lock.

## SLE recursive package rule

At the successor's next handoff boundary, `00_SLE_HANDOFF_PROTOCOL.md` remains mandatory. Generate/refresh:

- newest versioned root START NEXT SESSION;
- byte-identical starter mirror under `project-documents/session-starts/`;
- `SESSION_BOOTSTRAP.json`;
- complete root `SUCCESSOR_HANDOFF_..._SLE_...md`;
- byte-identical handoff mirror under `project-documents/handoffs/`;
- context graph/model/learning pointers only where useful/current-state references changed;
- exact WEC/live/RJR/security pointers;
- one fresh short repository-first owner copy-paste prompt.

The fresh next-developer prompt must identify the newest starter, require independent live verification and fresh WEC initialization, and direct the successor to `IMMEDIATE NEXT TASK AFTER FULL STUDY`.

## Clean stop

This predecessor stops at the completed handoff checkpoint. It does not begin the stale-pointer source correction after reaching handoff proximity 100%. The fresh successor owns that bounded fix, RJR recalculation and next production acceptance.
## Repository-first next-developer prompt

At the next handoff, preserve the mandatory repository-first next-developer prompt and regenerate it with `npm run work:next-prompt` when repository tooling is available. The prompt must name the newest START NEXT SESSION, require independent live verification, require a fresh unique WEC, route to `IMMEDIATE NEXT TASK AFTER FULL STUDY`, and keep the handoff orientation-only.
