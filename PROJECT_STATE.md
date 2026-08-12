# PROJECT STATE — Career Mode Showdown

Last updated: 2026-08-12

## Authority / continuation rule

The project is designed and implemented through Candidate C Atomic Restore + Recovery UX. Immutable v1.1.4 is the current public production runtime. v1.1.5 is the focused restore-safety maintenance release candidate on PR #25.

Current work is release closure only. Do not restart Candidate C planning and do not begin v1.2, profiles, cloud or two-device work before v1.1.5 is merged, deployed, twice-proven and documentation-sealed.

Authority when sources disagree:

1. current source on the active release branch, then `main` after merge;
2. explicit later owner decisions/amendments;
3. `PROJECT_STATE.md`;
4. `NEXT_TASK.md`;
5. current release/handoff documents;
6. roadmap/amendments;
7. original Project Bible / architecture documents;
8. older historical records/conversations.

Never revert verified source merely to satisfy stale documentation. Correct the stale document.

## Current implementation

Release candidate: v1.1.5 — Restore Transaction Safety Maintenance
Runtime asset revision: `1.1.5-r1`
Hosting: GitHub Pages
Technology: static HTML + CSS + vanilla JavaScript + browser localStorage
Product mode: exactly two managers, one device/browser, one active Showdown
Current activity: v1.1.5 pre-merge release closure
Maintenance PR: #25 — `agent/v1.1.5-maintenance`
Current public production: v1.1.4 / `1.1.4-r1`
Immutable v1.1.4 production runtime authority: `1a498441a6ccf557aa8b8bc7ced2b3d9cd22cdf7`
v1.1.4 GitHub Pages deployment: `5877215224`
v1.1.5 functional proof before identity freeze: `dbcdffaae927163e5a9c8b44466ff2084e814de5` — 14/14 permanent families green
Protected visual surface: Marco Reus Home/loading presentation and accepted route-scoped licensed football visuals
Future cloud status: contract/threat-model groundwork only; no backend or network mutation is authorized
Next substantive milestone after v1.1.5 proof: v1.2.0 — Installable Offline App

A later documentation-only `main` commit is not automatically a new application runtime authority. Runtime authority is the immutable commit whose served runtime bytes were deployed and proven.

## v1.1.5 maintenance changes

v1.1.5 changes no gameplay rule, scoring rule, manager count, league/club assignment rule, Transfer Challenge rule, Season Review calculation, statistics formula, backup format version, storage key or accepted football-photo source.

It fixes two major restore defects and hardens Candidate C transaction semantics.

### Major fix 1 — immutable confirmed restore intent

Before v1.1.5, the user could confirm one restore plan and then mutate file/choice state while asynchronous fresh analysis was still running. The transaction could therefore consume decisions different from the ones visibly confirmed.

v1.1.5 now:

1. freezes the exact selected File before the first asynchronous Apply boundary;
2. deep-copies the exact confirmed active/Legacy/preferences/conflict choices;
3. deep-copies the reviewed raw-state precondition;
4. reruns Candidate B analysis against the exact confirmed File;
5. locks the file input, Review, all decision controls and Apply while review/apply is in flight;
6. generation-binds file analysis so a stale completion cannot become current authority;
7. commits only the plan derived from the frozen confirmed values.

### Major fix 2 — transaction-owned rollback

Before v1.1.5, rollback covered the whole planned affected-key set, including keys whose write never succeeded or was never reached. That created unnecessary writes, false critical recovery after a clean first-write failure and a future cross-context clobber risk.

v1.1.5 now:

1. checks an exact full raw transaction precondition when supplied;
2. performs an exact last-moment raw `prewrite` check before every mutation;
3. grants mutation ownership only after a write succeeds;
4. records `committedKeys` as the exact rollback-owned set;
5. rolls back only owned mutations, in reverse commit order;
6. performs zero rollback writes after a failed first write;
7. refuses to overwrite a third/newer value that the transaction cannot prove it owns;
8. verifies owned rollback byte-for-byte;
9. enters locked critical recovery and invalidates uncertain runtime caches when rollback/ownership cannot be proven.

## Candidate A / B / C authority

Candidate A — Versioned Backup Envelope + Non-Mutating Export

- human-readable backup format v1;
- SHA-256 integrity/corruption evidence;
- active Showdown, Legacy and preferences plus recovery representation;
- malformed raw-byte preservation;
- zero canonical mutation;
- v1.1.5 provenance uses current `APP_VERSION`, otherwise shell-derived semantic version, otherwise `unknown`; no historical version is invented.

Candidate B — Import Analysis + Migration Preview

- strictly read-only;
- size/JSON/format/checksum/schema/hostile-input validation;
- supported deterministic migrations;
- current-state comparison and conflict preview;
- zero canonical localStorage writes/removals;
- a preview is evidence, never write authority.

Candidate C — Atomic Restore + Recovery UX

A legal restore preserves this sequence:

1. flush pending canonical writes;
2. freeze confirmed file, choices and reviewed raw bytes;
3. freshly revalidate the exact confirmed backup;
4. capture a strict exact raw snapshot that differentiates key absence from storage read failure;
5. detect reviewed-state drift;
6. compute every final candidate value completely in memory;
7. require explicit active/Legacy/preferences/conflict decisions;
8. enter canonical storage with the planning snapshot as transaction precondition;
9. recheck exact raw bytes immediately before every write;
10. commit in deterministic active → Legacy → preferences order;
11. verify every committed value;
12. on failure, roll back only transaction-owned successful mutations in reverse order;
13. refuse to clobber newer/unowned bytes;
14. verify owned rollback byte-for-byte;
15. enter locked critical recovery if rollback/ownership is uncertain;
16. invalidate uncertain runtime caches after critical recovery;
17. synchronize runtime/navigation only after complete success;
18. keep repeated identical restore a deterministic zero-write no-op;
19. preserve corrupt raw bytes unless explicit replacement was chosen;
20. keep canonical browser mutation under `js/storage.js` authority.

Recovery UX permanently distinguishes:

- `RESTORE NOT STARTED` — zero successful canonical mutations, so rollback was unnecessary;
- `RESTORE ROLLED BACK` — owned mutations restored and verified byte-for-byte;
- `CRITICAL RECOVERY STATE` — ownership/rollback cannot be proven and restore controls lock until refresh.

## Locked competition rules

- exactly two managers;
- Showdown lengths `[1,3,5,10]`;
- both managers use the same selected league;
- clubs are different and permanent after confirmation;
- Champions League winner = 5 points;
- domestic league winner = 3 points;
- main domestic cup winner = 1 point;
- 100 league points and/or 100 league goals share one +1 performance bonus;
- Top Scorer and/or Top Assist share one +1 awards bonus;
- maximum season score = 11;
- equal non-zero season scores remain a draw;
- only a 0–0 season uses tiebreakers: better league position, then league points;
- League Wheel requires explicit Continue after selection;
- Club Assignment requires explicit rivalry confirmation before the Showdown begins.

## Core authority boundaries

Routing: `js/screens.js` remains route/history authority. Smart Back stays centralized.

Persistence: `js/storage.js` remains canonical storage authority for active Showdown, Legacy and preferences. Restore/storage-transaction modules support this authority; they do not create another persistence owner.

Canonical localStorage keys remain exactly:

1. `careerModeShowdown.activeShowdown`
2. `careerModeShowdown.legacyShowdowns`
3. `careerModeShowdown.preferences`

Current Showdown schema: `2`
Current preferences schema: `2`

Scoring: `js/scoring.js`
Canonical Showdown model: `js/showdown.js`
Derived analytics: `js/analytics.js`

The startup shell remains one local stylesheet plus seven local scripts. Heavy gameplay, Transfer, Season Review, analytics, Settings, football visuals and Data Management remain lazy.

## Performance / presentation protection

Protected startup ceilings remain unchanged:

- 165,000 raw eager code bytes;
- 37,500 gzip eager code bytes;
- 95,000 startup Marco Reus portrait bytes;
- 260,000 combined first-party startup bytes.

Normal startup minimum remains 2700 ms. Reduced-motion startup remains 220 ms.

v1.1.5 temporarily measured 165,031 raw bytes after strict restore hardening. The ceiling was not raised. Removing an obsolete eager comment returned the original budget green without changing behavior.

The accepted v1.1.3 route-scoped licensed football-photo archive remains current source/provenance authority. Do not revive rejected James Rodríguez, Marcus Rashford or Anthony Martial derivatives from older handoffs.

## Validation topology

The release has 14 permanent workflow families:

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

Permanent `.yml` source contains 27 protected executable blocks.

Candidate C browser proof includes the original destructive/recovery suite plus v1.1.5 immutable-confirmed-intent and clean-first-write-failure maintenance scenarios. Stability runs Candidate A/B/C and complete Chromium journeys across two cycles. Burn-In runs the complete release gate five times.

Functional head `dbcdffaae927163e5a9c8b44466ff2084e814de5` passed all 14 families before the version/document freeze. Formal release proof must still run twice on one final coherent v1.1.5 candidate SHA and twice again on the immutable production runtime.

## Future cloud boundary

`CLOUD_STORAGE_FOUNDATION.md` is future architecture/security authority only. v1.1.5 does not add accounts, cloud persistence, network mutation or a second storage owner.

The future contract covers distinct account/profile/save/device/installation/object identities, server-authoritative revisions and compare-and-swap, explicit divergent conflicts, tombstones/anti-resurrection, privacy minimization/opt-in behavior, export/delete/retention, authenticated ownership, server-side authorization, TLS, least privilege, secure session/token handling, replay/idempotency protection, limits and no service secrets in the static client.

Cloud implementation remains dependency-blocked behind the approved roadmap.

## Current gate / next dependency

The only legal current work is v1.1.5 release closure:

1. finish current-facing documentation coherence;
2. freeze one exact PR #25 SHA with no temporary helper workflows;
3. pass all 14 permanent workflow families on that exact SHA;
4. independently repeat the complete matrix on the same SHA;
5. merge with expected-head protection;
6. wait for Pages to converge to `1.1.5-r1`;
7. prove exact deployed runtime bytes, provenance, Home/Reus, licensed visuals, Candidate A, Candidate B, Candidate C and the full public journey;
8. pass production Burn-In 5/5 and the remaining permanent families;
9. independently repeat production proof on the same immutable runtime SHA;
10. seal post-merge documentation without redefining the immutable runtime authority.

After those steps, v1.2.0 — Installable Offline App — becomes the next legal substantive milestone.

Profiles/save registry, cloud/accounts, QR pairing and two-device work remain dependency-blocked behind the documented roadmap order.
