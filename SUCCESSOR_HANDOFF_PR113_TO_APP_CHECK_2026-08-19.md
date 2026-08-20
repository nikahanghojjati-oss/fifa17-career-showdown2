# FIFA 17 Career Mode Showdown — Successor Handoff After PR #113

===== BEGIN READY-TO-PASTE WORK ENVIRONMENT HANDOFF =====

Treat this handoff as orientation, never as implementation authority. Current source, live GitHub state, the deployed website, provider consoles, current official Firebase/Google Cloud documentation, and later owner instructions override every recorded SHA, branch, PR, workflow, deployment, screenshot-derived fact, roadmap statement, and historical statement below.

## Project

Owner: Hawk / nikahanghojjati-oss

Repository: `nikahanghojjati-oss/fifa17-career-showdown2`

Public site: `https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/`

Predecessor environment: `we-2026-08-19-production-firestore-rules-activation`

Transition reason: the predecessor completed the real production Firestore Security Rules provider milestone and published PR #113. Its fresh deterministic Work Environment Continuity assessment now requires `HANDOFF_AT_CHECKPOINT`. Do not begin the distinct App Check/reCAPTCHA Enterprise milestone in the predecessor environment.

## Mandatory owner reporting format

Every substantive owner-facing project response must contain exactly these seven lines, in this order:

1. `Handoff proximity: X%`
2. `Remote Joining readiness: ~Y%`
3. `Current lane: ...`
4. `Concrete dependency completed: ...`
5. `Next unlock: ...`
6. `Blocker: ...`
7. `Sidequest check: ...`

Handoff proximity means Work environment transition proximity, not task completion. Base it on observable continuity evidence. Never fabricate usage. At 100%, automatically generate a complete successor handoff and stop at the clean checkpoint before another substantial milestone. WEC remains authoritative if stricter.

## Owner strategic priorities

The highest long-term product priority is Private Remote Joining, but only after every prerequisite, dependency, security boundary, provider configuration, recovery rule, and infrastructure requirement is complete and proven in dependency order. Stability is more important than speed.

Do not turn continuity/history/documentation into a sidequest. Advance the actual website/Remote Joining roadmap whenever a real prerequisite is available.

Ship semantic version changes only when runtime/product behavior actually changes. PATCH = fixes/hardening, MINOR = product features, MAJOR = breaking changes. Dormant/provider activation evidence by itself does not bump the app version or runtime revision.

Public discovery, public profiles, public matchmaking, public invitation directories/lobbies, community systems, global leaderboards, and rankings remain eliminated/prohibited.

## Current verified GitHub publication boundary

Independently verified live `main` after predecessor publication:

`1ccf2d3f451ea53575698877787562e38f1d6f50`

Commit title:

`Verify production Firestore Security Rules deployment (#113)`

PR #113:

- Title: `Verify production Firestore Security Rules deployment`
- Exact final PR head: `8eae1eca5180f6231d92c33df9e25eec601f3c2d`
- Squash merge / independently verified live main: `1ccf2d3f451ea53575698877787562e38f1d6f50`
- Base before merge: `e89f7011f029c8375fd69ba89cf9028c280aea04`
- Final changed files: exactly 6
  - `SUCCESSOR_HANDOFF_PR112_TO_PRODUCTION_FIRESTORE_RULES_2026-08-19.md`
  - `WORK_ENVIRONMENT_STATUS.json`
  - `firebase.production.environment.json`
  - `tests/contracts/private-account-auth-stage2i-boundary-contracts.cjs`
  - `tests/contracts/production-firebase-environment-activation-contracts.cjs`
  - `tests/contracts/work-environment-interruption-resilience-contracts.cjs`
- All 13 normal workflow families passed on the exact unchanged final head.
- No submitted reviews.
- No inline review threads.
- PR was mergeable immediately before merge.
- Draft status was removed without changing the exact head.
- Squash merge used expected-head protection.

The 13 successful final workflow families were:

- Validate League Confirmation
- Validate Season Review
- Validate Final Polish
- Validate Transfer Workstream
- Validate Statistics Workstream
- Validate Home Bootstrap
- Validate Settings Workstream
- Validate V1 Visual Immersion
- Validate Candidate B Import Analysis
- Validate Licensed Football Visuals
- Validate Static App
- Validate Candidate C Atomic Restore
- Validate Stability Lane

## Runtime identity

Application/package version remains:

`1.4.0`

Runtime revision remains:

`1.4.0-r1`

Previous whole-shell reference remains:

`1.3.0-r2`

PR #113 changed provider/security evidence and repository contracts only. It did not ship a runtime Firebase SDK connection or change website behavior. No semantic version or runtime revision bump was appropriate.

## Real production Firebase project

Production Firebase project ID:

`fifa17-career-showdown-prod`

Registered Web App:

`Career Mode Showdown Web`

Known committed public Web App identifiers remain:

- `authDomain`: `fifa17-career-showdown-prod.firebaseapp.com`
- `projectId`: `fifa17-career-showdown-prod`
- `storageBucket`: `fifa17-career-showdown-prod.firebasestorage.app`
- `messagingSenderId`: `409396353288`
- `appId`: `1:409396353288:web:1d3a2a5d6921de6ccbb4bd`

The concrete Firebase Web API key remains intentionally absent from committed production metadata. It is public web project configuration rather than an authorization secret, but there is no need to retain the concrete value in repository source while production runtime is disconnected.

Never ask the owner to paste the Web API key again merely for repository bookkeeping. Never request a service-account JSON key, private key, OAuth refresh token, access token, password, or Admin credential file.

Security must rely on Firebase Auth, Firestore Security Rules, App Check, trusted application authorization and IAM, not secrecy of the Web API key.

## Firebase Browser-key security proof

Owner Google Cloud Console evidence already proved the Firebase Browser key is API-restricted to 25 selected APIs and the visible allowlist does not contain `Generative Language API`.

Committed production metadata records:

- `apiKeyManagement.committed = false`
- `classification = public-project-configuration`
- `providerRestrictionsVerified = true`
- `providerRestrictionCount = 25`
- `generativeLanguageApiAllowed = false`

Do not loosen the API restriction allowlist.

Application restrictions were not yet activated in the predecessor provider review. Do not casually add browser referrer restrictions before controlled production Auth/runtime testing proves the exact required origin behavior. API-key application restrictions are defense in depth, not application authorization.

## Production Firestore database

Real Cloud Firestore database:

- Database ID: `(default)`
- Edition: Standard
- Location: `nam7`
- Starting mode: Production mode
- Scheduled backups: not enabled
- Provider existence: verified
- No sample collection/data was created during provider activation

Keep the database empty until trusted product flows actually require production data.

## Google Authentication and Authorized Domains

Google Authentication remains provider-verified enabled.

Locked client Auth policy remains:

- provider: Google
- provider class: `GoogleAuthProvider`
- sign-in flow: popup
- explicit user gesture required
- redirect flow not authorized by implication
- persistence: `browserSessionPersistence`
- no extra OAuth scopes

Provider-verified Authorized domains remain:

- `fifa17-career-showdown-prod.firebaseapp.com`
- `fifa17-career-showdown-prod.web.app`
- `nikahanghojjati-oss.github.io`

`localhost` remains removed and forbidden in production preflight. Do not re-add it. Do not delete the two Firebase default domains.

## Production Firestore Security Rules — DONE / DEPLOYED / MERGED / PROTECTED

This is the major milestone completed by PR #113.

Canonical repository Rules source:

`firestore.rules`

Provider-verified deployed Rules source Git blob SHA:

`0473750cb16b5b8eea234c0f8138c41de5ff3dfb`

`firebase.json` continues to map Firestore Rules directly to `firestore.rules`.

Owner provider proof at approximately 20:51 ET on 2026-08-19 showed:

- Firebase Console Cloud Firestore
- database `(default)`
- Rules tab selected
- the repository Rules structure visible across the source
- Firebase success toast: `Published changes can take up to a minute to propagate`
- no sample data creation

The owner asked whether to click `Develop & Test`; predecessor correctly instructed not to. That tool was not needed for the production publication proof.

Current `firebase.production.environment.json` on live main records:

- `productionSecurityRules = provider-verified-deployed`
- `productionSecurityRulesSource = firestore.rules`
- `productionSecurityRulesSourceBlobSha = 0473750cb16b5b8eea234c0f8138c41de5ff3dfb`
- provider screenshot evidence
- `appCheck = not-enabled-yet`
- `trustedRuntimeIam = not-activated-yet`
- `runtimeConnected = false`

The permanent production Firebase activation contract now:

1. verifies `firebase.json` still points at `firestore.rules`;
2. recomputes the exact Git blob SHA from `firestore.rules` source bytes and requires equality with the provider-verified deployed blob;
3. protects Rules version 2;
4. protects the final catch-all deny;
5. parses declared `allow` permission lists and requires every actual `create`, `update`, `delete`, or `write` authority to be explicit `if false`;
6. preserves all prior production project/API-key/Auth/Authorized-domain safety checks.

Do not weaken this write boundary for convenience.

### Current Rules security behavior

The deployed source has narrowly scoped authenticated `get` reads for the caller's own account/profile/device/security-event data and narrowly scoped rivalry/invite/session/idempotency reads.

Application-client `list`, `create`, `update`, and `delete` remain denied.

Final fallback remains deny-all:

`allow read, write: if false;`

Trusted mutations remain server-side only in later trusted-runtime activation.

## PR #113 validation findings and corrections

Several exact-head CI attempts correctly exposed stale repository continuity assumptions and one test matcher bug. These findings were fixed rather than bypassed. None required a change to the deployed `firestore.rules` source.

Important rejected/intermediate heads included:

- `ed17245960a880c495457350281b5ce24c71e640`
- `a10ef450faae241f83d11c2515656005e02b0676`
- `f95d59405888e6f9ac49ef6a68f6a542ac90a99b`
- `09305a477671d9dffe335b27307e6e333be7985f`
- `815260762b6eefcb958baf576059ee8d5d0ef8e4`

Only final head `8eae1eca5180f6231d92c33df9e25eec601f3c2d` is merge authority.

Corrections included:

1. `work-environment-interruption-resilience-contracts.cjs` had predecessor-era hard-coded wording requiring the generic phrase `production Firebase environment activation` and an obsolete PR #108 starting-main SHA. It was generalized so a fresh successor must name its actual production Firebase/Firestore lane, preserve its own `repository.startingMainSha`, record a concrete resumable provider/publication action, and preserve inherited `HANDOFF_AT_CHECKPOINT` only as historical evidence.
2. A successor status checkpoint initially failed to repeat its own starting-main SHA inside `lastSafeCheckpoint`; the status was corrected rather than weakening the invariant.
3. The first production-Rules write-authority matcher falsely treated the substring `create` inside a field name such as `createdByAccountId` as if an `allow get` statement granted the `create` permission. The matcher was corrected to inspect only the declared permission list before the colon.
4. A premature `transition-prepared` lifecycle was rejected while the fresh successor intentionally diverged from stale `NEXT_TASK.md`; lifecycle remained `active` through PR publication as required.
5. `private-account-auth-stage2i-boundary-contracts.cjs` duplicated the same predecessor-era provider-lane and PR #108 starting-main assumptions. Those historical-current-authority literals were generalized using the same source-grounded fresh-successor invariants while every substantive Stage 2I App Check/Auth/IAM trust lock remained intact.

No product security assertion, Firebase Rules restriction, recovery guarantee, runtime behavior, timeout, or performance ceiling was weakened to make CI pass.

## Immediate next substantive milestone — App Check with reCAPTCHA Enterprise

This is the direct next Remote Joining prerequisite after PR #113.

Do not begin Stage 3 Registered Devices / Private Pairing yet.

Before provider mutation, successor must independently verify current official Firebase and Google Cloud documentation because App Check/reCAPTCHA provider details can change.

The inherited locked direction is:

1. Use Firebase App Check for the production Web App.
2. Use the reCAPTCHA Enterprise provider for the web integration unless current official Firebase guidance has materially changed.
3. Create/register the appropriate score-based reCAPTCHA Enterprise site key for the production web host only after verifying current provider requirements.
4. Register the existing Firebase Web App under Firebase Console `Security > App Check` with the reCAPTCHA Enterprise provider.
5. Record the exact provider project/Web App identity and public site key configuration without storing any private credential.
6. Do not enable disruptive App Check enforcement merely because registration succeeds.
7. Production runtime currently does not initialize Firebase/App Check. Enforcement must remain off until the client integration is intentionally implemented and controlled testing/metrics show legitimate traffic works.
8. When runtime integration is authorized, initialize App Check before Firebase services and treat the reCAPTCHA Enterprise site key as public web configuration.
9. Monitor legitimate request metrics before enforcing.
10. Preserve Stage 2I trust order: origin defense in depth, transient App Check token, trusted Admin App Check verification, exact production Firebase Web App identity, exact production project audience, revocation-aware Firebase ID-token verification, derive architecture accountId only from verified UID, operation-specific application authorization, then trusted adapter execution.

Do not enable Gemini, Analytics, Firebase Hosting, paid scheduled backups, or unrelated services as sidequests.

Do not upgrade to Blaze merely to advance paperwork. Billing/Cloud Run activation is downstream when a genuinely required trusted production runtime needs it.

## Stage 2I historical trust locks remain authoritative

Stage 2I is already DONE / MERGED / PROVEN at its dormant boundary. Do not reimplement it.

Key protected concepts include:

- production reCAPTCHA Enterprise App Check direction
- exact production Web App identity verification
- exact project audience validation
- transient `X-Firebase-AppCheck`
- trusted server-side App Check verification
- App Check is not authentication or application authorization
- revocation-aware `verifyIdToken(idToken, true)`
- derive architecture `accountId` only from verified Firebase UID
- exact operation-specific authorization before trusted execution
- debug App Check belongs only to explicit development/emulator/CI environments
- no production `localhost` allowance by implication

The Stage 2I boundary contract was updated in PR #113 only to stop freezing later successor current-task identities; substantive Stage 2I security requirements remain protected.

## Trusted runtime / IAM after App Check

Trusted mutation execution remains server-side only. Browser writes remain deny-all.

Future trusted runtime must use a dedicated service identity and Application Default Credentials. Do not create downloadable service-account keys.

Stage 2H's existing account-bootstrap custom-role permissions remain exactly:

- `firebaseauth.users.get`
- `datastore.databases.get`
- `datastore.entities.get`
- `datastore.entities.create`

That four-permission role is bootstrap-only.

Connected-data export, account deletion, shared mutation and later Remote Joining operations require exact method-by-method IAM justification before production role expansion. Do not broaden IAM based on convenience or broad predefined roles.

Cloud Run/trusted server activation is downstream and may require billing/Blaze. Preserve owner cost sensitivity and use quotas/budgets/limits where available when that point genuinely arrives.

## Existing Stage 2 proof — do not repeat

All provider-neutral account/authz prerequisite Stages 2A through 2I are already DONE / MERGED / PROVEN at their designed boundaries.

Also done/merged/proven:

- trusted shared mutation gateway — PR #105
- trusted account deletion execution — PR #107
- trusted connected-data account export execution — PR #108
- real production Firebase project/Web App activation — PR #109
- real production Firestore existence verification — PR #110
- Firebase Web API key repository hardening — PR #111
- Browser-key API restrictions + Google Authentication + production Authorized domains + localhost removal — PR #112
- production Firestore Security Rules deployment and permanent exact-source protection — PR #113

Do not invent another dormant Stage 2 letter/stage to avoid real provider activation.

## Important current-source hazard — stale `NEXT_TASK.md`

At the PR #113 boundary, the top/current section of `NEXT_TASK.md` is stale and still describes the already-completed trusted connected-data export prerequisite and an older environment/main identity.

This stale file was explicitly discovered during predecessor reconstruction and protected by fresh-successor divergence contracts rather than silently treated as current authority.

Do not create a documentation-only sidequest PR merely to rewrite history.

Successor should reconcile the current-facing `NEXT_TASK.md` authority safely as part of the real App Check provider milestone or another naturally necessary current-authority update, while preserving retained historical bodies and append-only provenance.

Current live GitHub/provider evidence and this handoff supersede that stale top section until it is safely reconciled.

## Firebase CLI alias safety

`.firebaserc` intentionally keeps the default alias on the emulator/demo project:

`demo-career-mode-showdown-phase1f`

Production alias points at:

`fifa17-career-showdown-prod`

Never make production the unqualified default alias. This is a deliberate safety boundary against accidental production CLI operations.

## Remote Joining dependency order

Remaining high-level dependency order:

1. Finish genuine Stage 2 production/account/operational activation:
   - App Check/reCAPTCHA Enterprise registration and later controlled runtime integration proof
   - trusted runtime IAM/service identity activation
   - abuse/rate controls where actually required
   - provider outage/recovery and rollback proof
   - controlled runtime Firebase connection and launch validation
2. Stage 3 Registered Devices / Private Pairing
3. Stage 4 Connected Rivalry synchronization
4. Stage 5 Private Remote Joining
5. hardening
6. stable release

Do not start Stage 3 until Stage 2 is genuinely complete and proven.

## Cloud/sync architecture locks

Cloud/Sync Readiness Phase 1A–1F remains DONE / protected.

Key locks:

- Firebase Authentication + Cloud Firestore Standard provider decision
- Firestore persistent offline cache disabled
- local-only Saves remain local unless explicitly connected
- private remote boundary only
- no public discovery/community/rankings
- deterministic revision/baseRevision/CAS conflict handling
- stale conflict, tombstones, idempotency/replay protection and device attribution
- two-owner rivalry governance
- provider outage must not destroy local-only authority
- Candidate A/B/C recovery guarantees remain intact

## Canonical browser storage

Canonical browser storage remains exactly:

- `careerModeShowdown.saveLibrary`
- `careerModeShowdown.legacyShowdowns`
- `careerModeShowdown.preferences`

`activeShowdown` is not canonical.

Candidate A remains non-mutating export.
Candidate B remains read-only import analysis.
Candidate C remains the sole destructive import Apply authority with all existing recovery protections.

Cloud work must not corrupt or silently replace local recovery authority.

## Core product/scoring locks

Two managers only, same league, different permanent clubs, season lengths 1/3/5/10.

Scoring per season:

- Champions League +5
- Domestic League +3
- Main Domestic Cup +1
- 100 League Points +1
- 100 League Goals +1
- Top Scorer +1
- Top Assist +1

Cap rule:

- at most one point total for the 100 points/goals pair
- at most one point total for Top Scorer/Top Assist pair

Tiebreakers are not bonus points:

1. league position
2. league points

## Environment/tooling reality

GitHub connector is functional and is source/write authority.

The predecessor did not have an authenticated Firebase or Google Cloud management connector. Production provider mutations requiring account access were therefore owner-controlled through Firebase/Google Cloud Console, followed by repository evidence and exact-head CI proof.

Do not request secrets to work around provider-tool limitations.

Direct shell/network availability may vary across environments. Use connected GitHub first and current repository bootstrap policy for any local `gh` gap.

## Transition branch

Clean handoff branch created from exact merged PR #113 live main:

`agent/post-pr113-app-check-handoff`

Base:

`1ccf2d3f451ea53575698877787562e38f1d6f50`

This branch is for the transition handoff/status checkpoint only. Do not open or merge a documentation/WEC-only PR merely to publish the transition branch.

The successor should independently fetch live main, read this handoff as orientation, initialize its own fresh WEC identity according to `00_WORK_ENVIRONMENT_CONTINUITY.md`, then advance the real App Check milestone.

## Final predecessor WEC assessment

Observable predecessor signals at the post-PR #113 clean checkpoint:

- context complexity: high
- project complexity: very-high
- compaction count: 1
- major phases completed: 4 or more including reconstruction, provider proof, publication validation/correction, and merge/live-main verification
- dense evidence events: 30+
- tool routing errors: 1
- corrected publication/test/status failures: 4 tracked clusters
- stale fact corrections: 3
- repeated mistakes: 0
- unresolved failures: 0
- usage remaining: unavailable and never fabricated
- handoff completeness: effectively 100 at final seal
- unrecorded material decisions: 0
- atomic operation: false
- next substantial milestone is distinct: true — App Check/reCAPTCHA Enterprise

Using the repository deterministic model, context pressure is very high and the next-task separation is 80. With current quality-risk observations, complete handoff readiness, no atomic operation and unavailable usage omitted rather than guessed, continuation risk exceeds the `HANDOFF_AT_CHECKPOINT` threshold and transition advantage is strongly positive.

Final decision:

`HANDOFF_AT_CHECKPOINT`

Owner-facing Handoff proximity is therefore `100%` at this clean post-PR #113 boundary.

## Mandatory successor startup

Before any new provider/product mutation:

1. Fetch live `main`, recent commits, open PRs, active branches, current CI, and current production app/runtime identity.
2. Verify PR #113 remains merged from exact final head `8eae1eca5180f6231d92c33df9e25eec601f3c2d` to live main `1ccf2d3f451ea53575698877787562e38f1d6f50` unless later legitimate work supersedes it.
3. Read completely:
   - `AGENTS.md`
   - `00_HANDOFF_GOLDEN_RULE.md`
   - `00_WORK_ENVIRONMENT_CONTINUITY.md`
   - `00_FORWARD_PROGRESS_ANTI_LOOP.md`
   - `00_DEVELOPER_START_HERE.md`
   - `NEXT_TASK.md`
   - `REMOTE_JOINING_EXECUTION_ROADMAP.md`
   - `POST_V1_ROADMAP_EXECUTION.md`
   - `PRIVATE_ACCOUNT_AUTH_STAGE_2I.md`
   - `firebase.production.environment.json`
   - `.firebaserc`
   - `firebase.json`
   - `firestore.rules`
   - `tests/contracts/production-firebase-environment-activation-contracts.cjs`
   - `tests/contracts/private-account-auth-stage2i-boundary-contracts.cjs`
   - current `WORK_ENVIRONMENT_STATUS.json`
   - this handoff
4. Treat predecessor `HANDOFF_AT_CHECKPOINT` as inherited history only.
5. Archive predecessor facts according to WEC when safe and required.
6. Initialize a fresh successor environment ID and reset every per-environment observation/counter.
7. Set successor `repository.startingMainSha` to the live main actually observed at entry.
8. Record App Check/reCAPTCHA Enterprise as the real bounded next task if current source/provider truth still agrees.
9. Run the successor's own WEC assessment and obey it.
10. Verify current official Firebase/Google Cloud App Check/reCAPTCHA Enterprise documentation before provider mutation.
11. Advance the actual App Check prerequisite; do not get trapped in stale-history reconciliation if current source already resolves the implementation direction.

## Immediate successor objective

Do not repeat Firebase project creation, Firestore database creation, Web API-key restriction review, Google provider enablement, Authorized-domain setup, localhost removal, or production Firestore Rules publication unless current live provider evidence contradicts the verified PR #113 state.

The immediate substantive objective is App Check with reCAPTCHA Enterprise registration/provider proof in the exact production Firebase project/Web App, while keeping enforcement off until client/runtime integration and controlled monitoring justify it.

After App Check, continue directly to exact trusted-runtime IAM/service identity and the remaining Stage 2 operational proofs in dependency order.

## Clean-stop rule

The predecessor has reached the post-PR #113 clean checkpoint and must not begin App Check/reCAPTCHA Enterprise. That is the successor's next substantial milestone.

===== END READY-TO-PASTE WORK ENVIRONMENT HANDOFF =====
