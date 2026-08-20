# FIFA 17 Career Mode Showdown — Successor Handoff After PR #112

===== BEGIN READY-TO-PASTE WORK ENVIRONMENT HANDOFF =====

Treat this handoff as orientation, never as implementation authority. Current source, live GitHub state, the deployed website, provider consoles, and later owner instructions override every recorded SHA, branch, PR, release, workflow, deployment, screenshot-derived fact, and historical statement below.

## Project

Owner: Hawk / nikahanghojjati-oss

Repository: `nikahanghojjati-oss/fifa17-career-showdown2`

Public site: `https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/`

Predecessor environment: `we-2026-08-19-production-firebase-project-activation`

Transition reason: Work Environment Continuity now requires `HANDOFF_AT_CHECKPOINT` after a long, evidence-heavy production Firebase activation session. Do not continue the next substantial provider milestone in the predecessor environment.

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

`e89f7011f029c8375fd69ba89cf9028c280aea04`

Commit title:

`Verify production Google Auth and Authorized domains (#112)`

PR #112:

- Title: `Verify production Google Auth and Authorized domains`
- Exact final PR head: `d02069d58e4390b9599c8dd11dbcf2f923dfcb77`
- Squash merge: `e89f7011f029c8375fd69ba89cf9028c280aea04`
- Changed files: exactly 3
  - `WORK_ENVIRONMENT_STATUS.json`
  - `firebase.production.environment.json`
  - `tests/contracts/production-firebase-environment-activation-contracts.cjs`
- All 13 normal workflow families passed on the exact final head.
- No submitted reviews.
- No review threads.
- PR was mergeable when merged.

The 13 green workflow families were:

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

Previous shell reference remains:

`1.3.0-r2`

No runtime Firebase SDK connection has been shipped yet. Do not bump the version merely for provider-side activation evidence.

## Current production Firebase project

Real production Firebase project ID:

`fifa17-career-showdown-prod`

Web App was owner-registered as:

`Career Mode Showdown Web`

Known public Web App configuration identifiers recorded in source:

- `authDomain`: `fifa17-career-showdown-prod.firebaseapp.com`
- `projectId`: `fifa17-career-showdown-prod`
- `storageBucket`: `fifa17-career-showdown-prod.firebasestorage.app`
- `messagingSenderId`: `409396353288`
- `appId`: `1:409396353288:web:1d3a2a5d6921de6ccbb4bd`

The concrete Firebase Web API key was intentionally removed from committed production metadata after GitHub secret scanning flagged it. The key is Firebase public project configuration, not an authorization secret, but there is no benefit in retaining the concrete value in source while the runtime is disconnected.

Never ask the owner to paste the API key again. Never ask for a service-account JSON key, private key, OAuth refresh token, access token, password, or Admin credential file.

Future runtime injection may receive the Firebase Web API key because public web Firebase configuration necessarily reaches the browser, but security must rely on Auth, Security Rules, App Check, IAM, and operation authorization—not secrecy of the Web API key.

## Firebase Browser-key security proof

Owner Google Cloud Console screenshots proved the Firebase Browser key is API-restricted to 25 selected APIs.

The complete supplied visible allowlist did not contain `Generative Language API`.

Repository state records:

- `apiKeyManagement.committed = false`
- `apiKeyManagement.classification = public-project-configuration`
- `apiKeyManagement.providerRestrictionsVerified = true`
- `providerRestrictionCount = 25`
- `generativeLanguageApiAllowed = false`

Do not loosen the API restriction allowlist.

Application restrictions were still `None` when inspected. Do not change browser application restrictions casually before controlled production Auth/runtime testing; an incorrect referrer restriction can break legitimate Firebase requests. This is not authorization authority and is not the immediate next milestone.

The historical GitHub secret-scanning alert may remain open because the valid Firebase key exists in repository history. Do not reflexively rotate the key merely to silence the alert. After provider restriction proof is permanently published, resolve the alert as an intentionally public/restricted Firebase Web configuration finding if the GitHub UI requires owner action.

## Firestore production database proof

Real Cloud Firestore database:

- Database ID: `(default)`
- Edition: Standard
- Location: `nam7`
- Starting mode chosen by owner: Production mode
- Scheduled backups: not enabled
- Provider existence: verified from owner Firebase Console screenshots

The screenshots showed the real `(default)` database Data interface and Rules tab. No sample collection/data was created. Keep it that way until trusted product flows actually require data.

## Google Authentication proof

Owner Firebase Console screenshot proved:

`Authentication > Sign-in method > Google = Enabled`

The project public-facing name was set to the product name and owner support email selected.

The locked client Auth policy remains:

- provider: Google
- provider class: `GoogleAuthProvider`
- sign-in flow: popup
- user gesture required
- redirect flow not authorized by implication
- persistence: `browserSessionPersistence`
- no extra OAuth scopes

## Authorized Domains proof

Final owner Firebase Console screenshot proved the production Authorized domains list contains exactly the observed provider entries:

- `fifa17-career-showdown-prod.firebaseapp.com` — Firebase default
- `fifa17-career-showdown-prod.web.app` — Firebase default
- `nikahanghojjati-oss.github.io` — Custom production host

`localhost` was removed successfully. The screenshot showed the success toast `localhost removed` and no localhost row remained.

Do not re-add localhost to the production project. The Stage 2D preflight permanently rejects localhost with `LOCALHOST_AUTHORIZED_DOMAIN_FORBIDDEN`.

Do not delete the two Firebase default domains.

## Firebase CLI alias safety

`.firebaserc` intentionally keeps the default alias pointed at the emulator/demo project:

`demo-career-mode-showdown-phase1f`

The production alias points at:

`fifa17-career-showdown-prod`

Do not make production the unqualified default alias. This is a deliberate safety boundary so accidental unqualified Firebase CLI operations cannot silently target production.

## Immediate next substantive milestone — production Firestore Security Rules

This is the direct next Remote Joining prerequisite.

Current authoritative repository rule source:

`firestore.rules`

Current GitHub blob SHA at the handoff boundary:

`0473750cb16b5b8eea234c0f8138c41de5ff3dfb`

`firebase.json` maps Firestore rules directly to `firestore.rules`.

The repository rules are already emulator-tested and contract-protected. Their key security behavior is:

- scoped authenticated `get` access for the caller's own account/profile/device/security-event data
- rivalry state reads only for currently entitled active actors or the exact tombstone restoration case
- invite/session/idempotency reads are narrowly scoped
- every application-client `list`, `create`, `update`, and `delete` path remains denied
- final catch-all `allow read, write: if false`

Never weaken the write boundary for convenience.

### Owner/provider deployment route

The predecessor environment has no authenticated Firebase CLI/Google Cloud management channel. The owner is already operating the Firebase Console successfully.

For the real `(default)` database, Firebase documentation confirms the Firebase Console Rules editor is a valid deployment route.

Successor should guide the owner carefully:

1. Firebase Console → project `FIFA 17 Career Mode Showdown`.
2. Menu → Databases & Storage → Firestore.
3. Ensure database selector is `(default)`.
4. Open `Rules`.
5. Enter Edit mode.
6. Replace the current starter Production-mode rule source with the exact current repository `firestore.rules` source. The repository file, not chat memory, is implementation authority.
7. Do not make any hand edits.
8. Click `Publish`.
9. Wait for successful publication.
10. Capture screenshots showing the deployed rule source/provider state.
11. Do not create sample data.

After provider proof, update `firebase.production.environment.json` to mark `productionSecurityRules` provider verified, record evidence without credentials, add/strengthen permanent contracts, run exact-head CI/review/thread/mergeability gates, and merge only if fully green.

Do not claim rules are production deployed until provider evidence exists.

## Next after production Firestore Rules — App Check

The next direct security prerequisite is Firebase App Check using reCAPTCHA Enterprise, following the already-proven Stage 2I trust plan.

Current official Firebase guidance recommends reCAPTCHA Enterprise for new web App Check integrations and provides a no-cost assessment quota. The project can remain on Spark for this registration step; do not upgrade to Blaze merely to activate App Check.

Important order:

1. Create/register an appropriate score-based reCAPTCHA Enterprise site key for the production web host.
2. Register the existing Firebase Web App under Security → App Check with the reCAPTCHA Enterprise provider.
3. Record provider proof.
4. Do not enable disruptive enforcement before the runtime actually initializes App Check and controlled tests prove legitimate traffic works.
5. When runtime integration occurs, initialize App Check before Firebase services and use the provider site key as public web configuration.
6. Monitor before enforcing.

Do not enable Gemini, Analytics, Firebase Hosting, paid scheduled backups, or unrelated services as sidequests.

## Trusted runtime / IAM after App Check

Trusted mutation execution remains server-side only. Browser writes must remain deny-all.

The trusted runtime must eventually use a dedicated service identity and Application Default Credentials. Do not create downloadable service-account keys.

Stage 2H's already-proven bootstrap role is intentionally narrow and includes only:

- `firebaseauth.users.get`
- `datastore.databases.get`
- `datastore.entities.get`
- `datastore.entities.create`

That four-permission role is bootstrap-only. Export, account deletion, and shared mutation methods require exact method-by-method IAM justification before any production role expansion.

Cloud Run/trusted server activation is downstream and may require enabling billing/Blaze. Do not enable billing early merely to advance paperwork. When that point arrives, preserve the owner's cost sensitivity and use quotas/budgets/limits where available.

## Existing dormant Stage 2 proof

All provider-neutral account/authz prerequisite stages 2A through 2I are already done/merged/proven. Do not repeat them.

Also already done/merged/proven:

- trusted shared mutation gateway
- trusted account deletion execution
- trusted connected-data account export execution

PR #105: trusted shared mutation gateway

PR #107: trusted account deletion execution

PR #108: trusted connected-data account export

PR #109: real production Firebase project/Web App boundary activation

PR #110: real production Firestore existence verification

PR #111: Firebase Web API key repository hardening

PR #112: provider-verified Browser-key API restrictions + Google Authentication + production Authorized domains + localhost removal

Do not invent another dormant Stage 2 letter/stage to avoid real provider activation.

## Remote Joining dependency order

Remaining high-level order remains:

1. Finish real Stage 2 production/account/operational activation:
   - production Firestore Rules deployment proof
   - App Check/reCAPTCHA Enterprise registration/integration proof
   - trusted runtime IAM/service identity
   - abuse controls, rollback/outage proof, and controlled runtime Firebase connection
2. Stage 3 Registered Devices / Private Pairing
3. Stage 4 Connected Rivalry synchronization
4. Stage 5 Private Remote Joining
5. hardening
6. stable release

Do not start Stage 3 until the real Stage 2 production lane is genuinely complete and proven.

## Cloud/sync architecture locks

Earlier Cloud/Sync Readiness Phase 1A–1F is done.

Key locks remain:

- Firebase Authentication + Cloud Firestore Standard provider decision
- Firestore persistent offline cache disabled
- local-only saves remain local unless explicitly connected
- private remote boundary only
- no public discovery/community/rankings
- deterministic revision/baseRevision/CAS conflict handling
- stale conflict, tombstones, idempotency/replay protection, device attribution
- two-owner rivalry governance
- provider outage must not destroy local-only authority
- Candidate A/B/C recovery guarantees remain intact

## Canonical browser storage

Canonical storage remains exactly:

- `careerModeShowdown.saveLibrary`
- `careerModeShowdown.legacyShowdowns`
- `careerModeShowdown.preferences`

`activeShowdown` is not canonical.

Do not disturb Candidate A/B/C restore/import safety while activating cloud functionality.

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

GitHub connector is functional and remains source authority.

The predecessor local/container environment did not have a usable authenticated `gh`, `firebase`, or `gcloud` provisioning route. Direct container network/DNS was unreliable/unavailable. No Firebase/Google Cloud management plugin was found.

Do not request secrets to work around that limitation. Use owner-controlled provider console actions for irreversible/provider writes, then record provider proof in source.

A transient GitHub workflow-status transport failure occurred once during PR #112 validation and succeeded on one bounded retry. No repository state changed from that failure.

## Current transition branch

Branch created from exact PR #112 merged main:

`agent/production-firestore-rules-deployment`

At the handoff preparation point it contains only continuity/handoff checkpoint work; no production Rules deployment has been claimed and no provider resource was changed from that branch.

Do not open or merge a documentation/WEC-only PR merely to publish the transition branch. The successor should independently fetch live main, read this handoff/branch as orientation, initialize its own fresh WEC identity according to `00_WORK_ENVIRONMENT_CONTINUITY.md`, and then advance the real production Rules milestone.

## WEC transition assessment

Observable predecessor signals before final seal:

- context complexity: high
- project complexity: very-high
- compaction count: 1
- major phases completed: 9
- large evidence events: 24+
- tool routing errors: 6
- corrected failures: 4
- repeated mistakes: 0
- stale fact corrections: 0
- unresolved failures: 0
- usage: unknown/unavailable and must not be fabricated
- handoff readiness: approximately 98/100 before the final seal
- atomic operation: false

Using the repository's deterministic WEC formula at the checkpoint:

- context pressure: 97/100
- quality risk: 52/100
- next-task separation: at least 20/100 and the next provider deployment is a clean milestone boundary
- handoff readiness: 98/100 before final seal
- continuation risk: approximately 65.7/100
- transition cost: approximately 14.4/100
- transition advantage: approximately +51.3
- decision: `HANDOFF_AT_CHECKPOINT`

This makes owner-facing `Handoff proximity: 100%` appropriate at the clean checkpoint. Generate the successor handoff and stop before production Rules deployment in the predecessor environment.

## Mandatory successor startup

Before making any product/provider mutation:

1. Fetch live main, recent commits, tags/releases, open PRs, active branches, and current CI.
2. Verify the deployed website and current app/runtime identity.
3. Read completely:
   - `AGENTS.md`
   - `00_HANDOFF_GOLDEN_RULE.md`
   - `00_WORK_ENVIRONMENT_CONTINUITY.md`
   - `00_FORWARD_PROGRESS_ANTI_LOOP.md`
   - `00_DEVELOPER_START_HERE.md`
   - `NEXT_TASK.md`
   - `REMOTE_JOINING_EXECUTION_ROADMAP.md`
   - `POST_V1_ROADMAP_EXECUTION.md`
   - `firebase.production.environment.json`
   - `.firebaserc`
   - `firebase.json`
   - `firestore.rules`
   - `js/firebaseProductionPreflight.js`
   - current `WORK_ENVIRONMENT_STATUS.json`
   - this handoff
4. Treat predecessor `HANDOFF_AT_CHECKPOINT` as inherited history only.
5. Archive predecessor facts according to WEC.
6. Initialize a fresh successor environment ID and reset per-environment observations.
7. Record verified live main and the real production Rules task.
8. Run the successor's own WEC assessment.
9. Obey that successor assessment.
10. Continue actual Remote Joining prerequisite work; do not get trapped in history reconciliation if live source already resolves it.

## Immediate successor objective

Do not repeat Firebase project creation, Firestore database creation, API-key restriction review, Google provider enablement, Authorized-domain setup, or localhost removal unless live provider evidence contradicts this handoff.

The immediate objective is real production Firestore Security Rules deployment and proof using current repository `firestore.rules` as implementation authority.

After that, move directly into App Check/reCAPTCHA Enterprise and trusted-runtime IAM in the locked dependency order.

## Clean-stop rule

At the predecessor checkpoint, do not start the production Rules publish action. That is the successor's next substantial milestone.

===== END READY-TO-PASTE WORK ENVIRONMENT HANDOFF =====
