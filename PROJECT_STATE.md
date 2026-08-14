# PROJECT STATE — Career Mode Showdown

Last updated: 2026-08-14 ET

This file is the primary owner of current deployed product state. `NEXT_TASK.md` owns implementation authorization; `POST_V1_ROADMAP_EXECUTION.md` owns dependency direction/status; release/proof documents remain frozen evidence for the release they name.

## Production authority

Application milestone: v1.3.0 — Recovery & Device Resilience Hardening
Installable Offline App runtime label: `1.3.0-r1`
Immediate previous known-good whole shell: `1.2.0-r2`
Production status: merged, deployed, exact-byte verified and technically production-proven
Current production runtime feature merge: `9c648d10e869a56de54e0fa98c30cf2d2e5d05aa`
Current feature release version: intentionally unassigned
Public site: `https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/`

The original v1.3 release remains the whole-shell baseline. The later Local Profiles / Save Library dependency chain advanced production functionality without assigning a new application or Service Worker release identity.

## Completed Local Profiles / Save Library chain

1. Identity foundation — PR #46, merge `b76baf3be8107a57c5898f691d5178ae1d8a8547`.
2. Canonical persistence integration — PR #48, merge `d62ea1f62ec92af4a90de04a6ef182ed1bf44692`.
3. Runtime authority cutover — PR #51, merge `7c970c2fa425c9ae6ab8ddf215c8ee88305125a2`.
4. Visible Local Profiles / Save Library Core UI — PR #53, merge `9c648d10e869a56de54e0fa98c30cf2d2e5d05aa`.

All four layers are shipped and production-proven. Do not describe Save Library or stable local identity as unfinished foundation work.

## Visible Save Library product state

Current production behavior includes:

- Home visibly exposes Local / Save Library through the established Settings owner;
- lazy Save Library UI inside Settings;
- empty, one-save and multi-save states;
- additive New Showdown creation;
- one explicit `activeSaveId`;
- explicit stable-ID switching;
- deletion of exactly one Save without full reset;
- no implicit replacement when the active Save is deleted;
- visible read-only Local Profiles;
- same visible manager names remaining distinct stable profiles;
- profiles retained after single-Save deletion;
- non-mutating old-singleton Save Library/Legacy opening until confirmed Start/Continue cutover;
- corrupt, dual or unverifiable authority blocked fail-closed;
- mutation rerenders preserving focus within Settings;
- Chromebook, mobile and reduced-motion containment;
- lazy Save Library assets included in the verified offline whole shell.

`js/saveLibraryRuntime.js` remains the only product-level Save Library mutation authority.

## Identity state

Stable prefixes remain:

- `profile_*`
- `save_*`
- `season_*`

Current generated IDs use 24 lowercase hexadecimal characters after the prefix.

Display names are labels, never identity authority. Same-name profiles are intentionally legal.

Current Save creation creates two fresh stable Local Profiles for the new Save, one for each manager role. The product does not yet establish that a profile from one Save and a profile from another Save are the same real manager merely because their labels match.

Historical singleton migration creates authoritative profile references for the active Showdown. A Legacy record with the exact same Showdown identity can safely inherit that exact relationship. Other historical Legacy records deliberately retain null manager-profile references and are counted as requiring historical identity mapping rather than being guessed by name.

## Current Analytics state and identity limitation

Current Statistics, Trophy Room and career records remain shipped derived/read-only features under `js/analytics.js`.

Career-level aggregation is not yet identity-authoritative across all Saves/history:

- `analyticsNormalizeName()` normalizes display labels;
- `getOrCreateManagerStats()` keys the career map by that normalized label;
- `calculateCareerAnalytics()` passes `showdown.managers[playerKey]` and does not consume `identity.managerProfileIds`.

Source-grounded consequence: two distinct same-name `profile_*` identities can collapse into one career Analytics manager. This is deterministically reproducible.

A direct replacement of the name key with `profileId` is not sufficient person-level semantics because current New Showdown creation produces fresh profiles for each Save. Such a change could split one real manager across multiple career rows unless explicit cross-Save profile linkage/reuse semantics first exist.

Historical ambiguous records must remain unresolved. Do not map them because display names match.

Rivalry Analytics remains scoped to the two roles of one Showdown, while career manager totals, career records and Trophy Room leader/cabinet data inherit the cross-history aggregation limitation.

## Historical identity / Legacy dependency state

Historical profile identity is an ACTIVE DEPENDENCY QUESTION, not an unfinished Save Library foundation.

A future identity/history capability must distinguish:

A. authoritative stable profile references;
B. relationships safely recoverable by stable record identity;
C. intentionally unresolved historical relationships;
D. display-name-only legacy labels that carry no identity authority.

Showdown- and Season-scoped Legacy/Achievement calculations can proceed without solving person-level cross-history identity. Cross-career achievements, manager totals, career records and full longitudinal Analytics require explicit identity semantics first.

`js/legacy.js` may be an appropriate product surface for historical treatment, but it must not become raw storage mutation authority. Any future mapping mutation must remain behind the established identity/storage transaction boundaries.

## Storage state

Before explicit Save Library cutover on an old singleton device, public canonical storage is exactly:

- `careerModeShowdown.activeShowdown`
- `careerModeShowdown.legacyShowdowns`
- `careerModeShowdown.preferences`

After successful cutover, public canonical storage is exactly:

- `careerModeShowdown.saveLibrary`
- `careerModeShowdown.legacyShowdowns`
- `careerModeShowdown.preferences`

`careerModeShowdown.activeShowdown` is only a migration/recovery compatibility slot after cutover and must never become a permanent fourth key.

`js/storage.js` remains sole public raw browser-storage authority. `js/storageTransaction.js` remains raw transaction authority. UI code never owns canonical `localStorage` directly.

## Recovery/import state

Candidate A remains non-mutating export.
Candidate B remains strictly read-only analysis.
Candidate C remains the only import stage permitted to mutate canonical restore state.

Candidate C destructive Apply still requires `captureCareerModeRawRestoreSnapshot()` as strict exact raw snapshot authority and must never substitute `captureCareerModeRawBackupInputs()`.

Preserve exact preconditions, last-moment raw guards, transaction-owned mutation, ownership-scoped reverse rollback, anti-clobber verification, exact post-write verification, byte-for-byte rollback verification, corrupt-byte preservation, retry/idempotence and critical recovery.

## Backup portability boundary

Candidate A/B/C are compatible with the shipped Save Library authority, but the current v1 backup envelope is not a complete fresh-device Save Library export.

With Save Library active, Candidate A projects the authoritative active Save into the historical `activeShowdown` payload and includes Legacy plus preferences. The normal envelope does not serialize every non-active Save and Local Profile from the full `careerModeShowdown.saveLibrary` registry.

Candidate C preparation preserves non-active Saves already present in the destination library while replacing/restoring the active entry. Therefore same-device restore compatibility is proven, while a complete fresh-device multi-Save round trip remains a separate future backup/import evolution candidate.

This boundary is not authorization to redesign the backup format.

## Installable Offline App state

Whole-shell label remains exactly `1.3.0-r1`.
Previous known-good whole shell remains `1.2.0-r2`.

Service Worker and Cache Storage own application bytes only, never canonical user data. Preserve verified cache population, explicit update activation, current/previous whole-shell recovery and installed-app behavior.

## Performance state

Exact final PR #53 measurements:

- eager raw: `162781` bytes
- eager gzip: `37415` bytes
- lazy feedback: `4845` bytes
- Reus startup portrait: `88492` bytes
- combined first-party startup: `251273` bytes

Locked ceilings remain unchanged:

- eager raw <= `165000`
- eager gzip <= `37500`
- Reus startup portrait <= `95000`
- combined first-party startup <= `260000`
- normal loading minimum `2700 ms`
- reduced-motion loading `220 ms`

## Permanent evidence state

Save Library product evidence includes deterministic foundation/persistence/runtime/product contracts, the permanent browser Save Library audit, Stability integration, deployed-site smoke and offline whole-shell inclusion.

Automated proof already covers multiple Saves, three-Save journeys, same-name profiles, switching, switch/reload, active and non-active deletion, keyboard/focus behavior, Chromebook/mobile containment, reduced motion, stale runtime authority and corrupt/dual authority fail-closed behavior.

That is not the same as long-term human usage proof for large Save counts, many repeated cycles, true installed-PWA process restarts or extended real-device use.

The repository remains at 14 permanent workflow families and 27 protected multiline executable blocks.

## Exact production proof

Final PR #53 head: `2021a0a2eaed26f0aca6639278de82afe2a28d6d`.

All 13 normal PR workflow families succeeded on that exact head.

PR Stability `31771109094` — success.
Candidate C `31771109180` — success.
Static App `31771109225` — success.

Runtime feature merge: `9c648d10e869a56de54e0fa98c30cf2d2e5d05aa`.

All 14 permanent push workflow families succeeded on that exact merge.
Release Integration Burn-In `31771269732` — success.
Post-merge Stability `31771269740` — success, including deployed-site smoke.

Production Pages proof verified 71 `1.3.0-r1` runtime files byte-for-byte and passed Home, Save Library, licensed football visuals, Candidate A/B/C, Installable Offline App/offline and complete deployed journey audits.

## Protected product surfaces and gameplay

Preserve Home, Continue Career, Create Showdown, league confirmation, club confirmation, Transfer Challenge, Season Entry, Season Review, Season Summary, Statistics, Legacy, Trophy Room, Rule Book, Save Library/Settings, Smart Back, PWA/offline, accessibility, responsive containment, installed iOS behavior, licensed football photography and FIFA 17-inspired presentation.

Exactly two managers.
Showdown lengths: `1`, `3`, `5`, `10`.
Same selected league, different permanent clubs.
Champions League +5, League +3, Domestic Cup +1.
100 League Points and/or 100 League Goals combined maximum +1.
Top Scorer and/or Top Assist combined maximum +1.
Maximum Season score 11.
Equal non-zero scores are Draws.
Only 0–0 invokes league position and then league points.

## Current clean boundary

Save Library is complete and production-proven.

Historical/cross-Save profile identity is an active dependency question. Full identity-safe longitudinal career Analytics is dependent on that decision. A naive name match or profile-key substitution is not authorized.

No new substantial runtime product candidate is automatically assigned. Profile linkage/mapping semantics, profile editing, Analytics behavior changes, backup/import evolution and cloud remain separately bounded future candidates requiring explicit dependency/owner authorization.
