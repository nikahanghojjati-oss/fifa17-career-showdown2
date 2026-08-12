# Career Mode Showdown — Master Developer Handoff Appendix

Date: 2026-08-12
Companion to: `CAREER_MODE_SHOWDOWN_MASTER_DEVELOPER_HANDOFF_2026-08-12.md`
Research branch: `handoff/master-developer-deep-dive-2026-08-12`

This appendix is part of the same owner-requested master handoff package. The primary handoff recovers the product/history/architecture lineage. This appendix records the external Grok critique, the future roadmap dependency logic, and a source-grounded Candidate C execution protocol.

## 1. External Grok review — useful lessons accepted

The owner supplied a Grok conversation reviewing the application at an earlier v0.95-era state and again at v1.1.3.

Grok is not implementation authority. Its value is as an independent reviewer that can expose categories worth testing against the real repository.

### 1.1 Correct observation: the project is materially more than a basic generated page

Grok correctly identifies the current product as a multi-screen local-first application with:

- a non-trivial Showdown state machine;
- persistent local data;
- timers/Transfer phases;
- scoring and history;
- route transitions and confirmations;
- modular JavaScript;
- versioned preferences;
- backup/import analysis;
- responsive and accessibility work;
- a deliberate FIFA 17-inspired presentation layer.

That is a useful correction to any shallow framing of the repository as “AI-generated HTML.”

### 1.2 Correct observation: the owner’s planning discipline is a major engineering asset

The strongest point in the Grok review is its response after the owner showed the roadmap.

It correctly noticed that the roadmap is:

- dependency ordered rather than excitement ordered;
- explicit about exclusions and blocked work;
- careful about migrations, rollback and identity;
- careful about cloud cost/privacy/provider lock-in;
- explicit about release gates and definitions of done;
- willing to defer public/community functionality when verification cannot support it.

Historical ChatGPT evidence and repository history reinforce this. The project repeatedly avoided costly jumps because the owner insisted on planning the dependency chain first.

The next developer should treat this planning as a technical asset to preserve, not bureaucracy to “simplify away.”

### 1.3 Correct observation: v1.1 is a meaningful maturity step

Grok correctly identifies Data Safety and Recovery as a major technical advance relative to the earlier build.

Candidate A/B now provide:

- a versioned backup envelope;
- deterministic SHA-256 corruption detection;
- exact/raw recovery evidence;
- isolated import analysis;
- migration preview;
- conflict classification;
- future-format fail-closed behavior;
- zero-write preview semantics.

The remaining Candidate C gap is not evidence that A/B are unfinished. A/B were intentionally separated so the first write-capable restore stage could be implemented only after export and analysis semantics were proven.

### 1.4 Correct observation: singleton save, no PWA and no cloud are intentional current limits

Grok lists:

- one active local Showdown;
- no local profile/save library;
- no offline-install/PWA;
- no cloud.

Those are accurate observations, but the repository classifies them as **deliberate roadmap boundaries**, not random omissions.

- atomic recovery comes before save-library migration;
- PWA comes after recovery;
- stable IDs/save registry come after recovery/migrations;
- cloud comes much later after local identity and merge semantics.

A future developer should not “fix” those current limitations by prematurely collapsing milestone boundaries.

### 1.5 Correct observation: vanilla JavaScript remains a strong fit

Grok’s broad reasoning is sound:

- the product is browser-native;
- GitHub Pages is static;
- localStorage/file APIs/DOM/timers are first-class browser features;
- the project benefits from zero server/build dependency for normal use;
- current modular/lazy architecture already separates responsibilities;
- PWA work can remain JavaScript-native.

This handoff therefore finds **no evidence-based reason for a framework rewrite now**.

## 2. External Grok review — required pushback / corrections

### 2.1 The “entire project under 700 KB” size claim is incomplete/outdated

Grok estimated the whole project around 0.66 MB and described the Reus image as the only significant media asset.

That does not describe the current v1.1.3 repository.

Current `main` contains many locally bundled football WebP derivatives in addition to Reus. Summing the current football/player WebPs visible in the repository tree yields roughly **2.02 MiB of player imagery alone**, before HTML, JavaScript, CSS, tests, documentation or dependencies are counted.

This does **not** mean the application has become heavy at startup.

The correct performance distinction is:

- **repository/runtime asset inventory** is now multi-megabyte because richer football presentation is bundled locally;
- **eager initial shell** remains tightly controlled and was proven at **164,965 raw / 37,006 gzip** in v1.1.3;
- large modules/images remain route-scoped/lazy or proactively warmed after the critical shell where required.

Future reviews must not confuse total repository bytes with first-load/eager bytes.

### 2.2 “Stable” is not proof

Grok correctly said its praise was not caused by the word `Stable`; the repository should maintain the same standard.

A future developer must never infer release quality from:

- version number;
- footer label;
- branch name;
- “stable” marketing text.

Release authority comes from exact source SHA + complete gates + deployment parity + appropriate owner acceptance for visual art direction.

The r3 image incident is the strongest warning: green technical automation did not make the player crops owner-acceptable.

### 2.3 “An experienced engineer would make it cleaner” is a hypothesis, not a repository finding

It is reasonable to keep maintainability risk in mind, especially in a rapidly AI-assisted codebase.

But “a professional would make this cleaner” is too generic to justify a rewrite.

By v1.1.3 the repository already contains:

- explicit module authorities;
- migration/version contracts;
- deterministic fixtures;
- real-browser audits;
- deployed-byte verification;
- burn-in cycles;
- recovery-oriented architecture;
- extensive failure chronology/handoffs.

If maintainability problems are claimed, identify a concrete symptom such as duplicated authority, hidden coupling, repeated regression, excessive startup cost or untestable state. Then fix that root cause. Do not perform prestige refactoring.

### 2.4 TypeScript is a possible future tool, not an approved milestone

Grok suggests TypeScript might become attractive as profiles/cloud/migrations grow.

That is a reasonable **future evaluation trigger**, but it is not current roadmap authority.

Only reconsider typing/build tooling if evidence shows it prevents a meaningful class of defects at acceptable cost. Any such decision must preserve:

- GitHub Pages distribution;
- runtime simplicity;
- current authority boundaries;
- reproducible builds;
- startup budgets;
- AI/developer iteration clarity.

No TypeScript/framework migration should be smuggled into Candidate C, PWA or profiles as incidental modernization.

### 2.5 SHA-256 checksum is corruption detection, not authenticity

Candidate A’s SHA-256 checksum is useful for deterministic corruption/tamper detection within the backup envelope.

It is **not** authentication because the backup is not signed with a secret/private key. An attacker who can alter the backup can also recompute its checksum.

Do not describe Candidate A backups as cryptographically authenticated or “secure against malicious tampering.”

Candidate B’s hostile-structure/schema validation is the relevant safety layer for untrusted local backup input.

### 2.6 Cloud will require more than inserting an adapter

Grok’s JavaScript review says a future cloud adapter can sit behind storage. Directionally correct, but incomplete.

The repository roadmap correctly requires before provider selection:

- async repository interface;
- stable IDs/revisions/tombstones;
- merge/conflict semantics;
- privacy/threat model;
- retention/deletion model;
- auth needs;
- cost/exit analysis;
- local two-device simulation.

Cloud is therefore an architectural/security/product milestone, not just a different storage API.

### 2.7 Public competitive rankings remain fundamentally constrained by manual FIFA results

The project records results entered by humans from their separate FIFA careers.

Without a separate trusted verification model, a public leaderboard cannot honestly claim globally verified competitive results.

The current conditional v3 gate is correct: public ranking/community work should not be authorized merely because private connected play works.

## 3. Why the future roadmap order is technically important

The roadmap is best understood as a chain of capabilities where each milestone creates invariants needed by the next.

### 3.1 v1.1 — Data Safety and Recovery

**Invariant unlocked:** current local data can be exported, understood, migrated and restored without silent loss.

Candidate C closes this invariant by making restore atomic and rollback-verifiable.

Without this, later schema/identity changes would have no trustworthy escape hatch.

### 3.2 v1.2.0 — Installable Offline App

**Invariant unlocked:** the current local-first tracker can boot and update safely without the network.

Required by roadmap:

- manifest/icons/theme;
- service worker for first-party shell;
- atomic cache activation;
- Update Ready flow;
- offline media degradation;
- cache corruption/update/rollback tests.

Critical risk: a stale service worker can mix HTML/CSS/JS revisions. The PWA layer must therefore prove version-coherent activation/rollback.

The recovery foundation comes first so installability does not increase the chance of stranding local data.

### 3.3 v1.3.0 — Local Manager Profiles and Save Library

**Invariant unlocked:** stable local identity exists independently of display names and singleton storage.

Required:

- opaque manager IDs;
- opaque Showdown IDs;
- Season IDs;
- versioned save registry;
- multiple in-progress Showdowns;
- selected current Showdown;
- singleton + Legacy migration without duplication;
- user-reviewed mapping for ambiguous historical names.

This is a structural migration. It depends on v1.1 backup/import/migrations so the user has a reliable recovery path before identity is changed.

### 3.4 v1.4.0 — Legacy 2.0 and Achievements

**Invariant unlocked:** richer long-term history can safely refer to stable managers/Showdowns/Seasons.

Achievements remain derived/non-scoring. They must not alter max-11 scoring or winner logic.

Persist only information that is authored or genuinely non-derivable.

### 3.5 v1.5.0 — Analytics 2.0

**Invariant unlocked:** deeper analytics operate over stable, normalized identity/history rather than display-name guesses.

Charts need accessible table alternatives and honest insufficient-sample states.

Do not create a persistent analytics database unless profiling proves derived computation is actually a problem.

### 3.6 v1.6.0 — Optional Content Packs

**Invariant unlocked:** additional league/club/custom-pool content is versioned and portable without replacing the canonical five-league default.

Content packs need stable IDs/versioning, backup/import integration and deterministic pairing/identity validation.

Official club crests remain excluded by default.

### 3.7 v1.7.0 — Challenge Studio

**Invariant unlocked:** optional replay-value rules can be identified/versioned separately from canonical scoring.

Challenge objectives never mutate the max-11 Season scoring system.

No unsupported FIFA-save scraping.

### 3.8 v1.8.0 — Cloud Readiness, No Cloud UI

**Invariant unlocked:** data access/identity/conflict semantics become asynchronous/provider-neutral before any real remote dependency exists.

Required:

- async repository interface behind `js/storage.js`;
- local adapter remains default;
- ordered migrations;
- per-record revisions/timestamps/writer IDs/tombstones;
- deterministic merge rules;
- local two-device sync simulator;
- privacy/threat/retention/deletion model;
- provider ADR and budget/exit analysis.

Provider-specific types must not leak into gameplay modules.

### 3.9 v1.9.0 — Opt-In Cloud Backup Beta

**Invariant unlocked:** the smallest remote recovery capability works before realtime sync complexity.

Scope remains backup/recovery oriented:

- explicit opt-in;
- secure transport/provider storage;
- manual Back Up Now;
- Restore Preview;
- revision history;
- recovery;
- export/deletion;
- local-first failure behavior.

No realtime sync, public profile, friends, groups, chat, ranking or discovery.

### 3.10 v2.0.0 — Private QR Paired Two-Device Alpha

**Invariant unlocked:** two devices can participate in one private rivalry while one-device mode remains a complete fallback.

The existing Guess → Signing privacy split pays off here.

Host remains canonical for irreversible progression in the alpha; roles/tokens are bounded/revocable; stale writes and private data leakage are explicit failure cases.

### 3.11 v2.1.0 — Connected Rivalry

**Invariant unlocked:** reliable shared Showdown session rather than host-assisted alpha.

Adds shared canonical navigation, role-private screens, two-party irreversible confirmations, reconnect, conflict handling, resumable rooms, recovery, host transfer and audit trail.

The UI must remain game-like, not degrade into a synchronization admin console.

### 3.12 v2.2.0 — Private Sharing and Groups

**Invariant unlocked:** controlled social value without public-community risk.

Recommended progression:

1. revocable read-only completed-Showdown links;
2. privacy preview;
3. invited private groups;
4. private standings/history;
5. sanitized summary cards.

Never expose account/internal/device/recovery/draft/unrevealed Transfer data.

No public feed/comments/messaging in this milestone.

### 3.13 conditional v3 — Community, Discovery and Rankings

Not approved implementation.

Requires sustained connected-play use, owner budget/moderation approval, privacy/deletion/block/report/rate-limit/abuse operations, and an explicit distinction between verified and self-reported data.

If those conditions are not met, stop at private sharing/groups.

## 4. Candidate C — source-grounded implementation protocol for the next developer

This section does not replace `NEXT_TASK.md`. It operationalizes it using the v1.1.3 source inspected during this deep-dive.

### 4.1 Read order before any Candidate C code

1. fetch current `main` and record exact SHA;
2. read `00_HANDOFF_GOLDEN_RULE.md`;
3. read `00_DEVELOPER_START_HERE.md`;
4. read `NEXT_TASK.md`;
5. read both 2026-08-12 master handoff files;
6. read Candidate A/B release/post-merge handoffs;
7. read Candidate C section in `POST_V1_ROADMAP_EXECUTION.md`;
8. inspect live `js/storage.js`, `js/backup.js`, `js/importAnalysis.js`, `js/legacy.js`, `js/optionalModules.js`, `js/screens.js`, and relevant CSS/tests.

Do not resume an old Candidate A/B branch.

### 4.2 Create continuity evidence before coding

Create a Candidate C branch from current `main` and a **public Candidate C rolling handoff immediately**.

Record:

- base SHA;
- intended version/revision only after repo authority is checked;
- exact Candidate C scope and exclusions;
- transaction design;
- every diagnostic failure/correction;
- gate results;
- frozen candidate SHA;
- merge/deployment proof.

### 4.3 Keep write authority in `js/storage.js`

The UI/analysis module may prepare choices and request a restore.

The atomic multi-key storage mutation should be owned by `js/storage.js` so there is one place that knows:

- canonical key names;
- raw write/remove behavior;
- cache invalidation;
- verification;
- rollback.

Do not put direct `localStorage.setItem/removeItem` calls into Candidate C UI code.

### 4.4 Revalidation is mandatory immediately before Apply

Candidate B’s successful preview is evidence, not write permission.

Before Apply:

- flush pending writes;
- ensure the user-selected file/backup is still the analyzed object;
- enforce size limit again where relevant;
- parse again;
- verify format/version;
- verify checksum again;
- verify hostile structure/schema again;
- rerun deterministic migrations;
- rerun local conflict/current-state comparison;
- verify user choices still resolve every required conflict.

If anything differs, stop and return to a new preview rather than silently applying stale assumptions.

### 4.5 Raw snapshot occurs before any normalization/mutation

For each affected canonical key, capture one of two states:

- exact raw string;
- `null` meaning the key did not exist.

The snapshot must happen **before the first restore write** and before any helper can normalize/re-save the current storage value.

Rollback must distinguish “restore exact old string” from “remove key because it was absent.”

### 4.6 Compute the whole commit set in memory before writing

Resolve all explicit user choices first.

Candidate final values should already be deterministic strings/absence states before the transaction begins.

Do not interleave conflict decisions or migration work with storage writes.

### 4.7 Treat affected keys as one transaction

Even though Web Storage has no native multi-key transaction, application semantics must be all-or-nothing.

Recommended transaction state model for UI/diagnostics:

`idle`
→ `revalidating`
→ `choice-ready`
→ `applying`
→ `verifying`
→ `success`

Failure path:

`applying/verifying`
→ `rolling-back`
→ `rolled-back`

or, only if rollback itself cannot be verified:

`rollback-failed-critical`

The exact internal naming is flexible; the semantic separation is not.

### 4.8 Post-write verification must compare raw committed values

After writing every affected key:

- read each key back through storage authority;
- compare against the exact intended committed raw representation/absence;
- do not announce success because `setItem` merely returned without throwing.

A mismatch is a transaction failure and triggers rollback of all affected keys.

### 4.9 Rollback must attempt the complete restoration set

If an import write/verification fails:

- attempt restoration for **every affected canonical key**;
- do not stop rollback after the first rollback-write failure;
- collect rollback failures;
- read every affected key again;
- verify byte-for-byte against the original snapshot;
- only then classify rollback as successful or critical failure.

If rollback is incomplete:

- never navigate as if success occurred;
- show a high-severity recovery state;
- retain/report which raw keys could not be restored;
- strongly direct the user toward the pre-existing/exported recovery evidence.

### 4.10 Only update runtime caches/state after complete commit success

Before transaction success, do not opportunistically set:

- `currentShowdown`;
- active-save presence cache;
- Legacy cache/revision;
- application preferences cache;
- route-derived UI state.

After every storage key is verified:

1. invalidate/reload caches from canonical storage;
2. re-establish `currentShowdown` from the committed state;
3. refresh menu/state indicators;
4. resolve canonical route through `js/screens.js` authority;
5. move/focus UI only after transaction status is successful.

### 4.11 Double Apply / rapid interaction must be a no-op after first activation

The Apply control must have an in-flight lock that works for mouse, keyboard and touch.

A second activation must not begin a second transaction, re-run user choices against partially changed storage or create duplicate Legacy merges.

### 4.12 Legacy merge must be deterministic and idempotent

Rules already protected:

- preserve Showdown IDs as strings for comparison;
- exact duplicates do not multiply;
- same-ID different-content conflicts require explicit resolution policy;
- completed active save already represented in Legacy must not duplicate accidentally;
- importing the same backup again after a successful restore must produce deterministic no-duplicate behavior.

Do not introduce stable opaque new identities in Candidate C; that belongs to v1.3.

### 4.13 Active replacement is destructive and needs explicit recovery guidance

Before replacing a usable or corrupt current active slot:

- clearly identify what current data will be replaced;
- make the export/recovery path obvious;
- do not hide replacement inside a generic “Restore” click;
- preserve exact corrupt raw bytes in the transaction snapshot even if they cannot be parsed.

### 4.14 Preferences remain an explicit independent choice

Do not restore preferences merely because active/Legacy data is restored.

The user must be able to choose whether current settings remain unchanged or imported preferences replace them.

### 4.15 Page-lifecycle interruption must be tested honestly

Web Storage writes are synchronous, so some lifecycle failures may be difficult to reproduce deterministically between individual writes.

Do not invent a false guarantee.

Where reproducible, test navigation/reload/background/visibility interruption around the transaction boundary. Keep route/UI interactions blocked while Apply is in flight.

If crash-consistent recovery across an actual process kill would require a separate transaction journal or storage record, treat that as an explicit design decision requiring source/roadmap review; do not silently create a fourth canonical application-data owner/key just to make the test convenient.

### 4.16 Candidate C remains lazy and local

Data Management already loads through the Legacy optional-module path:

`backup.js` → `importAnalysis.js` → `legacy.js`

Candidate C should remain in this lazy Data Management surface unless usability evidence proves that a new top-level route is necessary.

No network request, PWA service worker, account, profile registry, cloud adapter or two-device code belongs in Candidate C.

### 4.17 Required Candidate C evidence

At minimum, deterministic failure injection for:

- first affected-key write failure;
- middle-key failure after an earlier write changed storage;
- final-key write failure;
- quota/storage exception;
- post-write verification mismatch;
- rollback write failure;
- corrupt pre-existing raw bytes;
- same-ID Legacy conflicts;
- rapid/double Apply;
- stale preview/file/current-state change before Apply;
- repeated import after successful restore;
- lifecycle interruption where reproducible.

Browser/UX evidence must include:

- keyboard;
- touch/mobile;
- Chromebook/wide desktop;
- 940px-class windowed desktop;
- 390×844 DPR2 mobile;
- reduced motion;
- focus movement;
- axe/accessibility;
- overflow;
- minimum target size;
- explicit failure/rollback messaging.

### 4.18 Release proof pattern for Candidate C

Do not count diagnostic/fix runs as official release proof.

Recommended established pattern:

1. diagnostic implementation/gates until clean;
2. include a complete public handoff in the candidate;
3. freeze one exact SHA;
4. run every permanent family twice on that exact SHA;
5. ensure Candidate C has dedicated contracts + browser evidence;
6. manually review restore/rollback screenshots;
7. merge with expected-head protection;
8. wait for GitHub Pages;
9. run every permanent family twice on immutable production runtime;
10. Stability public smoke must exercise safe Candidate C happy-path/failure-recovery checks that can be done without risking real user data;
11. close docs and seal evidence without creating a recursive CI-documentation loop.

Do not raise startup/performance thresholds to fit Candidate C. If new restore code threatens eager limits, keep it lazy or compact the actual eager path.

## 5. Project reasoning doctrine recovered across all environments

The next developer should internalize these as process rules, not slogans.

### 5.1 Current source wins, history explains why

Read old chats to recover intent and causality.

Do not use old chats to resurrect superseded implementation.

### 5.2 Later owner evidence beats earlier developer confidence

If screenshots, real-device behavior or explicit owner clarification contradict a previous “green/accepted” assumption, reclassify the defect.

Do not defend the old diagnosis because effort was invested in it.

### 5.3 A green gate can be incomplete

The r3 photo incident proves this.

When a gate misses a real defect, do not discard automation. Improve the contract so the observed failure class becomes reproducible while preserving the separate owner-art-direction boundary.

### 5.4 Never weaken a meaningful threshold merely to ship

Classify failures:

- real product defect;
- stale test authority after an intentional change;
- environment/infrastructure failure;
- test harness defect.

Fix the correct layer.

### 5.5 Performance budgets are product requirements

Do not solve startup pressure by raising limits unless the owner deliberately changes the requirement after evidence.

Prefer lazy loading, deduplication, dead-code cleanup and compact eager logic.

### 5.6 Rights safety is architecture

Keep local licensed derivatives, attribution/provenance and original FIFA-inspired UI language.

Do not copy official EA/FIFA menu art, sounds, proprietary typefaces or official club crests by default.

### 5.7 Handoff writing is part of implementation

The owner has repeatedly lost usable context when long chats/Work sessions ended.

Record as work happens:

- decisions;
- failures;
- rejected candidates;
- owner acceptance/rejection;
- commits/PRs/SHAs;
- exact next step.

Do not reconstruct only at the end.

## 6. Final conclusion of the 2026-08-12 deepening pass

The historical review materially strengthens the project model in four ways:

1. **It recovers causality.** Modern architecture/gates are traceable to real early failures rather than arbitrary convention.
2. **It separates superseded ideas from locked rules.** Old assistant suggestions about club rerolls, bonus caps and UI structure can no longer be mistaken for current authority.
3. **It clarifies the product.** Immersion, ceremony and rivalry identity are functional requirements alongside persistence/performance—not decorative extras.
4. **It makes Candidate C safer.** The next developer can begin from the actual current storage/backup/import boundaries with a defined transaction/rollback protocol rather than rediscovering them during implementation.

The correct next substantive move after this documentation handoff is complete/merged is still:

**Candidate C — Atomic Restore + Recovery UX.**

Do not skip to PWA, profiles, cloud or paired-device work.