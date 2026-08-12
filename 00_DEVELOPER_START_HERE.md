# Career Mode Showdown — Developer Start Here

Last updated: 2026-08-12
Repository: `nikahanghojjati-oss/fifa17-career-showdown2`
Purpose: canonical current-facing first read for a new developer session.

Historical release archaeology belongs in the release/handoff records. This file should describe what is true now, what is protected, and what work is legally next.

## 0. Sixty-second state

Release candidate application: `v1.1.5`
Runtime asset revision: `1.1.5-r1`
Release branch: `agent/v1.1.5-maintenance`
Draft release PR: #25

Current public production remains v1.1.4 until PR #25 is merged and GitHub Pages proof is complete.

Immutable v1.1.4 production runtime authority:

`1a498441a6ccf557aa8b8bc7ced2b3d9cd22cdf7`

Functional v1.1.5 maintenance proof before the identity freeze:

`dbcdffaae927163e5a9c8b44466ff2084e814de5`

That functional head passed all 14 permanent workflow families, including Candidate C twice-browser recovery, both Stability Chromium cycles and Burn-In 5/5. The later v1.1.5 identity/document freeze must still pass the complete release protocol on one final immutable PR head.

Current product/recovery state:

- Candidate A — Versioned Backup Envelope + Non-Mutating Export — complete and protected.
- Candidate B — Import Analysis + Migration Preview — complete, protected and strictly read-only.
- Candidate C — Atomic Restore + Recovery UX — complete and protected.
- v1.1.5 maintenance fixes two major Candidate C transaction defects and strengthens strict snapshots, stale-state preconditions and rollback ownership.
- `CLOUD_STORAGE_FOUNDATION.md` defines future cloud identity/revision/conflict/tombstone/privacy/security requirements only. No cloud backend or network mutation is authorized in v1.1.5.
- After v1.1.5 is deployed and twice-proven, v1.2.0 Installable Offline App is the next legal substantive milestone.

The owner-mandated `00_HANDOFF_GOLDEN_RULE.md` remains permanent policy: meaningful actions, failures, fixes, gates, merges, deployment evidence and next-step decisions must be recorded in a public repository handoff while work occurs.

## 1. Start every new session in this order

1. Read `00_HANDOFF_GOLDEN_RULE.md`.
2. Fetch current `main` and the active release branch; record their exact SHAs.
3. Read this file completely.
4. Read `NEXT_TASK.md` completely.
5. Read `CAREER_MODE_SHOWDOWN_V1.1.5_MAINTENANCE_HANDOFF.md` for the current maintenance chronology.
6. Read `RELEASE_V1.1.5.md` for the release contract and proof requirements.
7. Inspect the source and tests named by the active task before changing anything.
8. Read `CLOUD_STORAGE_FOUNDATION.md` only when work touches future identity/sync design; it does not authorize cloud implementation.
9. Use `POST_V1_ROADMAP_EXECUTION.md` for dependency order after the current release.
10. Use old Project Bible/master historical files only when deeper intent or supersession history is materially needed.

Do not restart planning. Do not ask the owner to repeat decisions already encoded in current source/current authority.

## 2. Authority order

When evidence conflicts:

1. current source on the active release branch and then `main` after merge;
2. later explicit owner decisions;
3. `PROJECT_STATE.md`;
4. `NEXT_TASK.md`;
5. this bootstrap, active release record and active handoff;
6. roadmap/amendments;
7. older project/historical documents and chats.

Never revert verified source merely to satisfy stale documentation. Correct the stale document.

A documentation-only `main` head after a release seal is not automatically the immutable application runtime authority. Release handoffs must distinguish those two SHAs explicitly.

## 3. Product identity

Career Mode Showdown is a two-manager FIFA 17 Career Mode rivalry companion hosted as a static GitHub Pages app.

Current mode is locked to:

- exactly two managers;
- both managers play their own FIFA 17 Career Mode saves outside the website;
- one local browser/device;
- one active local Showdown;
- manual FIFA 17 result entry;
- browser localStorage persistence;
- vanilla HTML/CSS/JavaScript;
- local-first operation.

The website supplies rivalry structure, rules, ceremony, tracking, history, statistics, recovery and FIFA 17-era presentation. It is not a browser football simulator and is not yet a cloud/account product.

## 4. Locked competition rules

Per manager per Season:

- Champions League winner: `+5`;
- Domestic League winner: `+3`;
- Main domestic Cup winner: `+1`;
- 100 league points and/or 100 league goals: shared maximum `+1`;
- Top Scorer and/or Top Assist: shared maximum `+1`;
- maximum Season score: `11`.

Winner logic:

1. higher Season score wins;
2. equal non-zero scores are a Draw;
3. only `0–0` uses league position;
4. equal league position at `0–0` uses league points;
5. if still tied, Draw.

Other locked rules:

- same selected league for both managers;
- different clubs;
- clubs assigned once and permanent for the entire Showdown;
- no post-assignment club reroll;
- club reuse across separate Showdowns allowed;
- 1 / 3 / 5 / 10 Season Showdowns;
- default leagues remain Premier League, LaLiga, Bundesliga, Serie A and Ligue 1;
- Transfer Challenge remains maximum three signings each and three opponent guesses;
- guess type remains League or Nationality;
- correctly guessed signings are released;
- manual FIFA 17 results are authoritative.

Future achievements, cloud features, content packs or online play do not alter canonical max-11 scoring without an explicit owner rule change.

## 5. Core architecture ownership

Navigation/history authority: `js/screens.js`

- Smart Back remains centralized.
- Feature modules do not create parallel route history.
- Critical data transactions finish or recover before route departure.

Canonical persistence authority: `js/storage.js`

- feature modules do not become independent localStorage owners;
- exact restore snapshots and canonical restore writes live behind storage authority;
- malformed raw bytes are preserved unless an explicit replacement transaction owns them;
- future cloud synchronization may propose validated state, but may not bypass canonical local transaction authority.

Canonical localStorage keys:

1. `careerModeShowdown.activeShowdown`
2. `careerModeShowdown.legacyShowdowns`
3. `careerModeShowdown.preferences`

Current Showdown schema: `2`
Current preferences schema: `2`

Scoring authority: `js/scoring.js`
Canonical Showdown model: `js/showdown.js`
Derived analytics: `js/analytics.js`

Optional features remain lazy when practical. Candidate C remains in the lazy Data Management/Legacy surface.

## 6. Candidate A/B/C recovery architecture

### Candidate A — export

Candidate A provides a human-readable versioned backup envelope with SHA-256 integrity verification, active Showdown, Legacy, preferences, warnings/recovery data and zero canonical mutation.

SHA-256 here is corruption/integrity evidence only. It is not encryption, signing, authentication or authorization.

v1.1.5 removes the old hardcoded v1.1.3 provenance fallback. Candidate A now uses current `APP_VERSION`, otherwise derives semantic version from the shell revision, otherwise records `unknown` rather than inventing a historical release.

### Candidate B — analysis

Candidate B remains read-only:

- size and JSON validation;
- backup format/checksum/schema validation;
- hostile nesting/key guards;
- supported migrations;
- current-state comparison;
- same-ID duplicate/conflict classification;
- migration/conflict preview;
- zero canonical writes/removals;
- no network request.

A preview is evidence. It is never permission to write.

### Candidate C — atomic restore

The protected restore transaction now requires:

1. flush pending canonical writes;
2. freeze the exact selected File, user choices and reviewed raw precondition before asynchronous revalidation;
3. freshly rerun Candidate B analysis on that exact confirmed File;
4. acquire a strict exact raw storage snapshot that differentiates absence from read failure;
5. detect reviewed-state drift before planning;
6. compute the complete final candidate in memory;
7. require explicit active/Legacy/preferences/conflict choices;
8. pass the planning snapshot into canonical storage as a transaction precondition;
9. perform a last-moment exact raw-byte precondition read before each write;
10. write in deterministic active → Legacy → preferences order;
11. record mutation ownership only after a write succeeds;
12. verify committed bytes after writing;
13. on failure, roll back only transaction-owned mutations in reverse commit order;
14. refuse to overwrite a third/newer value that the transaction cannot prove it owns;
15. verify rollback byte-for-byte;
16. enter locked critical recovery if ownership/rollback cannot be proven;
17. invalidate uncertain runtime caches after critical recovery;
18. synchronize runtime/navigation only after complete verified success;
19. keep repeated identical restore a zero-write no-op;
20. preserve corrupt raw bytes unless explicit replacement is chosen.

## 7. v1.1.5 two major maintenance fixes

Fix 1 — immutable confirmed restore intent

v1.1.4 could confirm one plan and then consume changed choices after an asynchronous revalidation boundary. v1.1.5 freezes the confirmed file/choices/raw bytes before the first await, locks the full decision surface while review/apply is in flight and generation-binds async file review results.

Fix 2 — transaction-owned rollback

v1.1.4 rolled back every planned affected key, including keys that were never successfully mutated. v1.1.5 tracks successful writes, rolls back only those owned mutations in reverse order and refuses to clobber bytes that have become a third/newer value.

Recovery UX now distinguishes:

- `RESTORE NOT STARTED` — no successful canonical mutation, no rollback required;
- `RESTORE ROLLED BACK` — owned mutations restored and verified;
- `CRITICAL RECOVERY STATE` — rollback or ownership cannot be proven; restore controls lock until refresh.

The exact defect/fix chronology and gate findings are in `CAREER_MODE_SHOWDOWN_V1.1.5_MAINTENANCE_HANDOFF.md`.

## 8. Visual/performance authority

The protected Marco Reus loading/Home presentation remains current visual identity.

The v1.1.3 licensed route-photo archive remains current visual-source/provenance authority, including the accepted James Rodríguez, Marcus Rashford and Anthony Martial replacements plus the additional route-scoped football images.

Do not revive rejected older image derivatives merely because historical handoffs mention them.

Startup limits remain unchanged:

- eager raw code: 165,000 bytes;
- eager gzip code: 37,500 bytes;
- startup Marco Reus portrait: 95,000 bytes;
- combined first-party startup bytes: 260,000 bytes.

Normal loading minimum remains 2700 ms; reduced-motion startup remains 220 ms.

v1.1.5 briefly exceeded the eager raw limit by 31 bytes (165,031). The limit was not raised. An obsolete eager comment was removed and the original budget returned green with no behavior loss.

## 9. Permanent validation topology

Current release validation has 14 permanent workflow families:

1. Home Bootstrap;
2. League Confirmation;
3. Transfer Workstream;
4. Season Review;
5. Statistics Workstream;
6. Settings Workstream;
7. V1 Visual Immersion;
8. Licensed Football Visuals;
9. Final Polish;
10. Static App;
11. Candidate B Import Analysis;
12. Candidate C Atomic Restore;
13. Stability Lane;
14. Candidate C Release Burn-In.

The permanent `.yml` suite contains 27 protected executable workflow blocks. The topology guard must fail if those blocks are silently added/removed without an intentional contract update.

Candidate C browser recovery runs the original deep recovery audit plus the v1.1.5 maintenance race/failure audit. Stability includes Candidate A/B/C and complete browser journeys across two local cycles. Burn-In runs the complete release gate five times.

Never weaken a threshold or delete an assertion merely because it exposes a defect.

## 10. Functional v1.1.5 proof already achieved

Before changing release identity, functional head:

`dbcdffaae927163e5a9c8b44466ff2084e814de5`

passed all 14 permanent workflow families.

Notable proof:

- Candidate C deterministic contracts green;
- Candidate C complete destructive/recovery browser command green twice, including immutable-confirmed-intent and clean-first-write-failure scenarios;
- Stability contracts green and both complete Chromium cycles green;
- Burn-In 5/5;
- Candidate A/B green;
- licensed visuals green;
- Static App complete repository contracts and 27-block topology green;
- original startup budgets green.

This proves the maintenance behavior before version/document migration. It is not yet the official v1.1.5 release proof.

## 11. Future cloud storage boundary

Read `CLOUD_STORAGE_FOUNDATION.md` before any future sync work.

The future contract requires separate account/profile/save/device/installation/object identities, server-authoritative revisions, compare-and-swap, explicit conflicts, deletion tombstones/anti-resurrection, privacy minimization/opt-in behavior and server-side authentication/authorization/security controls.

Important anti-shortcuts:

- no Firebase/Supabase/other backend merely because it is easy to connect;
- no silent last-write-wins gameplay state;
- no timestamp-as-revision authority;
- no device ID as authentication;
- no service/admin secret in static client JS;
- no direct localStorage writes from a future sync module;
- no SHA-256 integrity checksum presented as authentication/encryption;
- no cloud feature before the roadmap dependencies and owner decision are satisfied.

Dependency order remains:

v1.2 Offline/PWA → v1.3 stable local profiles/save identity → later cloud readiness → opt-in cloud backup.

## 12. Current legal task

Do not start v1.2 yet.

Current legal work is only v1.1.5 release closure:

1. reconcile all current authority documents with v1.1.5 candidate identity while preserving v1.1.4 as current public production until merge;
2. freeze one exact PR #25 head SHA with no temporary helper workflows;
3. pass all 14 permanent families on that exact SHA;
4. independently repeat the complete matrix on the same SHA;
5. merge with expected-head protection;
6. wait for Pages to serve `1.1.5-r1` from the immutable merge SHA;
7. pass exact deployed runtime-byte verification, provenance, Home/Reus, licensed visuals, Candidate A, Candidate B, Candidate C and the full public journey;
8. pass production Burn-In 5/5;
9. independently repeat all production proof on the same immutable runtime SHA;
10. write the v1.1.5 post-merge seal and align current-facing documentation without redefining the immutable runtime authority.

## 13. Next legal substantive milestone after release

v1.2.0 — Installable Offline App.

Before implementation, read the v1.2 section of `POST_V1_ROADMAP_EXECUTION.md`. Service-worker/update/recovery behavior must preserve local data safety and must not accidentally cache stale incompatible runtime revisions.

Cloud/account, profile registry, QR pairing and two-device play remain dependency-blocked.

## 14. Exact continuation sentence

A correctly oriented developer at the current pre-merge point should be able to state:

`Career Mode Showdown v1.1.5 / 1.1.5-r1 is the maintenance release candidate on PR #25, while immutable v1.1.4 runtime 1a498441a6ccf557aa8b8bc7ced2b3d9cd22cdf7 remains public production until merge. Candidate A export, Candidate B read-only analysis and Candidate C atomic restore are implemented and protected. v1.1.5 fixes mutable confirmed restore intent and over-broad rollback by freezing confirmed file/choices/raw state, adding strict snapshots and last-moment byte preconditions, and rolling back only transaction-owned mutations with anti-clobber ownership checks. Functional head dbcdffaae927163e5a9c8b44466ff2084e814de5 passed all 14 permanent families before the version freeze. Cloud identity/revision/conflict/tombstone/privacy/security work is future-contract-only. The only legal current work is freezing and twice-proving PR #25, deploying and twice-proving the exact Pages runtime, sealing documentation, then beginning v1.2 Installable Offline App.`

If a future developer cannot make that statement confidently after reading current source, this file, `NEXT_TASK.md` and the maintenance handoff, they are not ready to modify the release.