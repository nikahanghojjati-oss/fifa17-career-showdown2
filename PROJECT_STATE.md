# PROJECT STATE — Career Mode Showdown

Last updated: 2026-08-14 ET

This file is the primary owner of current deployed product state. `NEXT_TASK.md` owns implementation authorization; `POST_V1_ROADMAP_EXECUTION.md` owns dependency direction/status; release/proof documents remain frozen evidence for the release they name.

## Production authority

Application milestone: v1.3.0 — Recovery & Device Resilience Hardening
Installable Offline App runtime label: `1.3.0-r1`
Immediate previous known-good whole shell: `1.2.0-r2`
Production status: merged, deployed, exact-byte verified and technically production-proven
Current production runtime feature merge: `95e98c13bbb4cac485531565c3577ae31286d0af`
Current feature release version: intentionally unassigned
Public site: `https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/`

The original v1.3 release remains the whole-shell baseline. Later Local Profiles / Save Library and explicit manager-identity work advanced production functionality without assigning a new application or Service Worker release identity.

## Completed Local Profiles / Save Library / manager identity chain

1. Identity foundation — PR #46, merge `b76baf3be8107a57c5898f691d5178ae1d8a8547`.
2. Canonical persistence integration — PR #48, merge `d62ea1f62ec92af4a90de04a6ef182ed1bf44692`.
3. Runtime authority cutover — PR #51, merge `7c970c2fa425c9ae6ab8ddf215c8ee88305125a2`.
4. Visible Local Profiles / Save Library Core UI — PR #53, merge `9c648d10e869a56de54e0fa98c30cf2d2e5d05aa`.
5. Explicit cross-Save/historical manager identity linkage foundation — PR #57, merge `95e98c13bbb4cac485531565c3577ae31286d0af`.

All five layers are shipped and production-proven. Do not describe Save Library, stable local identity or explicit manager linkage semantics as unfinished foundation work.

## Visible Save Library and identity-link product state

Current production behavior includes:

- Home visibly exposes Local / Save Library through the established Settings owner;
- lazy Save Library UI inside Settings;
- empty, one-save and multi-save states;
- additive New Showdown creation;
- one explicit `activeSaveId`;
- explicit stable-ID switching;
- deletion of exactly one Save without full reset or implicit replacement;
- visible Local Profiles;
- same visible manager names remaining distinct stable profiles;
- profiles retained after single-Save deletion;
- explicit reuse of an existing Local Profile for a manager role across Saves when the user knows the relationship;
- no automatic identity matching by display name;
- matching Legacy propagation only through exact stable `identity.saveId` equality;
- historical-only Legacy manager roles explicitly mappable to an existing Local Profile or explicitly returnable to unresolved/null;
- display labels remaining unchanged when stable identity links change;
- one Local Profile blocked from representing both rival roles in the same Showdown;
- old-singleton compatibility and fail-closed corrupt/dual/unverifiable authority behavior;
- mutation rerenders preserving focus within Settings;
- Chromebook, mobile and reduced-motion containment;
- lazy Save Library assets included in the verified offline whole shell.

`js/saveLibraryRuntime.js` remains the product-level Save Library and manager-identity mutation authority. UI code remains detached from raw canonical browser storage.

## Identity state

Stable prefixes remain:

- `profile_*`
- `save_*`
- `season_*`

Current generated IDs use 24 lowercase hexadecimal characters after the prefix.

Display names are labels, never identity authority. Same-name profiles are intentionally legal.

Fresh Save creation still creates two fresh stable Local Profiles, one for each manager role. The product does not infer that profiles from different Saves are the same real manager because their labels match.

The shipped explicit-linkage foundation now allows a user to reuse an existing stable Local Profile across Save roles. Linkage changes only stable profile references; it does not merge/delete the prior profile or rewrite Showdown/Legacy labels.

Historical singleton migration still creates authoritative refs for the active Showdown and may safely reuse them for an exact same-Showdown Legacy record. Other historical relationships remain null/unresolved until explicitly mapped. Historical mapping uses record/stable identity, never name equality.

## Current Analytics state

Statistics, Trophy Room and career records remain shipped derived/read-only features under `js/analytics.js`.

Career-level aggregation is not yet identity-authoritative across all Saves/history:

- `analyticsNormalizeName()` normalizes display labels;
- `getOrCreateManagerStats()` keys the career map by that normalized label;
- `calculateCareerAnalytics()` passes `showdown.managers[playerKey]` and does not yet consume authoritative `identity.managerProfileIds`.

Source-grounded consequence: two distinct same-name `profile_*` identities can still collapse into one Career Analytics manager row even though the product can now explicitly distinguish/link those identities correctly in canonical state.

A direct profile-ID key swap is not sufficiently correct by itself. Explicit linkage semantics now exist, but a future Analytics implementation must also represent historical records whose profile relationship intentionally remains unresolved rather than guessing from labels.

Rivalry Analytics remains scoped to the two roles of one Showdown. Career manager totals, career records and Trophy Room leader/cabinet data still inherit the current name-keyed longitudinal limitation until a separately authorized Analytics correction ships.

## Historical identity / Legacy state

The historical/cross-Save identity semantic prerequisite is now production-proven.

The product distinguishes:

A. authoritative stable Local Profile references;
B. cross-Save relationships explicitly established by reusing a stable profile;
C. relationships safely propagated by exact stable Save identity;
D. intentionally unresolved historical manager relationships;
E. display-name-only historical labels carrying no identity authority.

An unresolved record is a valid state, not an implementation failure. Identity-safe longitudinal Analytics is now technically unblocked by the semantic foundation, but it remains a separate future candidate and is not implementation-authorized by this state file.

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

`js/storage.js` remains sole public raw browser-storage authority. `js/storageTransaction.js` remains raw transaction authority. Identity mutations use the existing strict exact raw preconditions and transaction-owned mutation/fail-closed behavior.

## Recovery/import state

Candidate A remains non-mutating export.
Candidate B remains strictly read-only analysis.
Candidate C remains the only import stage permitted to mutate canonical restore state.

Candidate C destructive Apply still requires `captureCareerModeRawRestoreSnapshot()` as strict exact raw snapshot authority and must never substitute `captureCareerModeRawBackupInputs()`.

Preserve exact preconditions, last-moment raw guards, transaction-owned mutation, ownership-scoped reverse rollback, anti-clobber verification, exact post-write verification, byte-for-byte rollback verification, corrupt-byte preservation, retry/idempotence and critical recovery.

The identity foundation did not change the v1 backup envelope. Candidate A already projects the active Showdown with `identity.managerProfileIds`. Candidate C preparation now preserves valid incoming active profile refs, reuses matching local profiles, reconstructs only minimum missing referenced profiles when required, preserves unrelated/non-active Saves and rejects one profile being assigned to both rival roles.

Complete fresh-device multi-Save portability remains a separate future backup/import candidate.

## Installable Offline App state

Whole-shell label remains exactly `1.3.0-r1`.
Previous known-good whole shell remains `1.2.0-r2`.

Service Worker and Cache Storage own application bytes only, never canonical user data. Preserve verified cache population, explicit update activation, current/previous whole-shell recovery and installed-app behavior.

## Performance state

Locked ceilings remain unchanged:

- eager raw `162781` <= `165000` bytes
- eager gzip `37415` <= `37500` bytes
- Reus startup portrait `88492` <= `95000` bytes
- combined first-party startup `251273` <= `260000` bytes
- normal loading minimum `2700 ms`
- reduced-motion loading `220 ms`

The manager identity surface remains lazy inside Settings and did not require a startup architecture change.

## Permanent evidence state

The repository remains at 14 permanent workflow families and 27 protected multiline executable blocks.

Identity-linkage permanent evidence includes:

- deterministic explicit cross-Save reuse and same-name separation;
- stable-ID-only matching-Legacy propagation;
- unresolved historical map/unmap behavior;
- profile retention after Save deletion;
- Candidate A/C identity preservation, including minimum fresh-device profile reconstruction;
- stale Save authority and Legacy transaction-boundary drift failing closed;
- visible browser linkage, focus ownership and singleton non-resurrection;
- Stability integration locally and against deployed Pages.

Exact PR #57 final head `9bf4cc19c6ec6485c28a7dd542cbac74052d44bc` passed all 13 normal PR workflow families.

Exact production merge `95e98c13bbb4cac485531565c3577ae31286d0af` passed all 14 permanent push workflow families. Post-merge Stability run `31812858587` passed repository contracts, Chromium integration and deployed-site smoke. Deployed proof verified runtime bytes and passed Home, Save Library, manager identity linkage, licensed football visuals, Candidate A/B/C, Installable Offline App/offline and the complete production journey.

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

Save Library and explicit manager identity-linkage semantics are complete and production-proven.

Current Career Analytics still has the name-keyed longitudinal identity defect. The semantic prerequisite for a correct identity-aware solution now exists, including explicit unresolved-history treatment, but no Analytics runtime change is automatically authorized.

No new substantial runtime product candidate is automatically assigned. Analytics correction, profile editing, backup/import evolution and cloud remain separately bounded future candidates requiring explicit owner authorization.
