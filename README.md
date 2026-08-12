# Career Mode Showdown

A lightweight two-player FIFA 17 Career Mode rivalry companion built for GitHub Pages with plain HTML, CSS, JavaScript and browser localStorage.

Release candidate: v1.1.5 — Restore Transaction Safety Maintenance
Runtime asset revision: `1.1.5-r1`
Current public production: v1.1.4 / `1.1.4-r1`
Immutable current production authority: `1a498441a6ccf557aa8b8bc7ced2b3d9cd22cdf7`
v1.1.4 GitHub Pages deployment: `5877215224`
Maintenance PR: #25 — `agent/v1.1.5-maintenance`
Maintenance status: implementation complete; pre-merge release closure and duplicate same-SHA proof required
Functional maintenance proof: `dbcdffaae927163e5a9c8b44466ff2084e814de5` passed all 14 permanent families before identity freeze
Protected surface: Marco Reus Home/loading presentation and accepted route-scoped licensed football visuals
Current developer entry: `00_DEVELOPER_START_HERE.md`
Future cloud contract: `CLOUD_STORAGE_FOUNDATION.md` — architecture/security groundwork only, no cloud runtime
Next substantive milestone after v1.1.5 proof: v1.2.0 — Installable Offline App

## Development entry point

The project is already designed and implemented through Candidate C. v1.1.5 is a focused maintenance release. Do not restart planning, reimplement Candidate C, begin v1.2 or add cloud runtime before release proof is sealed.

Read in this order:

1. `00_HANDOFF_GOLDEN_RULE.md` — permanent continuous public handoff protocol.
2. `00_DEVELOPER_START_HERE.md` — current bootstrap and authority order.
3. `NEXT_TASK.md` — v1.1.5 release closure is the sole legal current task.
4. current source on PR #25 — implementation authority for the maintenance candidate.
5. `PROJECT_STATE.md` — locked product/system state and production/candidate distinction.
6. `CAREER_MODE_SHOWDOWN_V1.1.5_MAINTENANCE_HANDOFF.md` — maintenance chronology, failures and corrections.
7. `RELEASE_V1.1.5.md` — release contract and formal proof requirements.
8. `CLOUD_STORAGE_FOUNDATION.md` — future-only identity/revision/conflict/tombstone/privacy/security contract.
9. `CAREER_MODE_SHOWDOWN_V1.1.4_POST_MERGE.md` — current production proof until v1.1.5 merges.
10. `POST_V1_ROADMAP_EXECUTION.md` — dependency-ordered roadmap.

## Product model and locked rules

Career Mode Showdown is a rivalry companion, not a browser football simulator and not yet a cloud/account product.

Current product model remains:

- exactly two managers;
- one local browser/device and one active Showdown;
- both managers play separate FIFA 17 Career Mode saves outside the site;
- manual result entry;
- one selected league for both managers;
- different clubs, assigned once and permanent for the Showdown;
- 1 / 3 / 5 / 10 Season Showdowns;
- default five-league wheel: Premier League, LaLiga, Bundesliga, Serie A and Ligue 1;
- Champions League +5, domestic league +3, main domestic cup +1;
- 100 league points and/or 100 league goals share one +1 performance bonus;
- Top Scorer and/or Top Assist share one +1 awards bonus;
- maximum Season score 11;
- equal non-zero scores are a Draw;
- only 0–0 uses league position then league points as tiebreakers.

## Data Safety and Recovery sequence

### Candidate A — Versioned Backup Envelope + Non-Mutating Export

Candidate A remains non-mutating. It exports a human-readable format-v1 JSON backup containing active Showdown, Legacy, preferences and recovery information with SHA-256 integrity evidence.

Malformed raw bytes are preserved. SHA-256 is corruption/integrity evidence only; it is not encryption, signing, authentication or authorization.

v1.1.5 removes the old hardcoded v1.1.3 provenance fallback. Backup provenance now uses current `APP_VERSION`, otherwise derives semantic version from the shell runtime revision, otherwise records `unknown`.

### Candidate B — Import Analysis + Migration Preview

Candidate B remains strictly read-only. It validates size, JSON, format, checksum, schema and hostile/future data; performs supported deterministic migration analysis; compares current local state; classifies same-ID conflicts; and presents a preview.

Candidate B performs zero canonical localStorage writes/removals. A preview is evidence, never write authority.

### Candidate C — Atomic Restore + Recovery UX

Candidate C is the only import stage permitted to commit canonical state after fresh verification and explicit user decisions.

The v1.1.5 protected transaction now:

1. flushes pending canonical writes;
2. freezes the exact selected File, confirmed choices and reviewed raw-state precondition before asynchronous revalidation;
3. freshly reruns Candidate B analysis against that exact confirmed File;
4. captures a strict exact raw snapshot that differentiates true key absence from storage-read failure;
5. detects reviewed-state drift before planning;
6. computes the complete final candidate in memory before mutation;
7. enters `js/storage.js` authority with the exact planning snapshot as a transaction precondition;
8. rechecks exact raw bytes immediately before every write;
9. commits in deterministic active → Legacy → preferences order;
10. records mutation ownership only after a write succeeds;
11. verifies every committed value;
12. rolls back only transaction-owned successful mutations, in reverse order;
13. refuses to clobber a third/newer value it cannot prove it owns;
14. verifies owned rollback byte-for-byte;
15. enters locked critical recovery and invalidates uncertain caches if rollback/ownership cannot be proven;
16. synchronizes runtime/navigation only after complete success;
17. preserves corrupt raw bytes unless explicit replacement is chosen;
18. treats repeated identical restore as a deterministic zero-write no-op.

Recovery UX distinguishes:

- `RESTORE NOT STARTED` — no successful canonical mutation, so no rollback was required;
- `RESTORE ROLLED BACK` — owned mutations restored and verified byte-for-byte;
- `CRITICAL RECOVERY STATE` — rollback/ownership cannot be proven and restore controls lock until refresh.

## v1.1.5 two major bug fixes

### Immutable confirmed restore intent

v1.1.4 could confirm one visible restore plan and then consume changed file/choice state after an asynchronous revalidation boundary. v1.1.5 freezes the confirmed File/choices/raw state before the first `await`, locks the entire restore decision surface while review/apply is in flight and generation-binds asynchronous file analysis so stale completion cannot become current authority.

Permanent deterministic and real-browser tests deliberately mutate decision state during delayed revalidation and require the originally confirmed plan to win.

### Transaction-owned rollback

v1.1.4 rolled back the full planned affected-key set, including keys that had not been successfully mutated. v1.1.5 tracks successful mutation ownership, performs zero rollback writes after a clean first-write failure, unwinds owned mutations in reverse order and refuses to overwrite newer/unowned bytes.

Permanent coverage protects first/middle/final write failure, quota/storage exceptions, verification mismatch, ownership conflict, corrupt bytes, absence semantics, stale state and idempotence.

## Architecture

`js/screens.js` remains the sole navigation/history authority.

`js/storage.js` remains canonical local persistence authority for exactly three keys:

1. `careerModeShowdown.activeShowdown`
2. `careerModeShowdown.legacyShowdowns`
3. `careerModeShowdown.preferences`

Current Showdown schema: `2`.
Current preferences schema: `2`.

Restore/planning/transaction modules support storage authority; they do not become another persistence owner. Future cloud synchronization may propose validated state but may not bypass the local exact-snapshot/precondition/verification/ownership-rollback boundary.

Heavy gameplay, Transfer, Season Review, analytics, Settings, football visuals and Data Management remain lazy. The startup shell remains one local stylesheet plus seven local scripts.

## Performance and presentation protection

Protected startup ceilings remain:

- 165,000 raw eager code bytes;
- 37,500 gzip eager code bytes;
- 95,000 startup Marco Reus portrait bytes;
- 260,000 combined first-party startup bytes.

Normal startup minimum remains 2700 ms. Reduced-motion startup remains 220 ms.

The v1.1.5 hardening initially produced 165,031 raw eager bytes and correctly failed. The ceiling was not raised. Removing an obsolete eager comment returned the original budget green without changing runtime behavior.

The accepted v1.1.3 route-scoped licensed football-photo archive remains visual-source/provenance authority. Do not revive rejected James Rodríguez, Marcus Rashford or Anthony Martial derivatives from historical handoffs.

## Future cloud storage boundary

`CLOUD_STORAGE_FOUNDATION.md` defines future architecture/security requirements only. v1.1.5 adds no backend, account requirement, cloud write path or service secret.

The future contract requires separate account/profile/save/device/installation/object identities, server-authoritative revisions and compare-and-swap writes, explicit divergent conflicts, tombstones/anti-resurrection, local-first opt-in privacy, data minimization, export/delete/retention, authenticated ownership, server-side authorization, TLS, least privilege, secure session/token handling, replay/idempotency controls, rate limits and input/size limits.

Cloud remains dependency-blocked behind v1.2 Offline/PWA, v1.3 stable local profiles/save identity and later cloud-readiness work.

## Validation and release proof

There are 14 permanent workflow families and 27 protected executable workflow blocks.

Functional head `dbcdffaae927163e5a9c8b44466ff2084e814de5` passed all 14 families before the v1.1.5 identity/document freeze, including Candidate C twice-browser recovery, both Stability Chromium cycles and Burn-In 5/5.

That functional proof is not the formal release seal. One final coherent v1.1.5 / `1.1.5-r1` PR #25 SHA must pass all 14 families, then the complete matrix must be independently repeated on the same SHA. After expected-head merge and Pages convergence, production must pass exact deployed-byte verification, Candidate A/B/C, Home/Reus, licensed visuals, the full public journey, Burn-In 5/5 and the remaining families twice on the immutable runtime SHA.

## Current task and next dependency

The only legal current task is v1.1.5 release closure and proof.

After v1.1.5 is merged, Pages-deployed, twice-proven and documentation-sealed, v1.2.0 — Installable Offline App — becomes the next legal substantive milestone.

Do not jump ahead to profiles/save registry, cloud/accounts, QR pairing, two-device play or public rankings. Follow `POST_V1_ROADMAP_EXECUTION.md` in dependency order.
