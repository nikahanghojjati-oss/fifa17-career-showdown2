# Career Mode Showdown — Current Handoff

Last updated: 2026-08-14 ET
Repository: `nikahanghojjati-oss/fifa17-career-showdown2`
Public site: `https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/`

This is the concise rolling handoff and evidence trail. `PROJECT_STATE.md` owns current deployed product state. `NEXT_TASK.md` owns the normal implementation authorization boundary unless superseded by a later explicit owner instruction. `POST_V1_ROADMAP_EXECUTION.md` owns dependency direction/classification. Release and production-proof documents remain frozen evidence for the release they name.

## Active owner-authorized implementation

On 2026-08-14 ET the owner explicitly authorized the smallest correct cross-Save/profile manager identity linkage and historical mapping foundation required before identity-safe longitudinal Analytics.

The authorization specifically requires:

- do not simply replace name-based Analytics keys with profile IDs;
- reconstruct profile creation/reuse, Save Library, `identity.managerProfileIds`, Legacy migration/mappings, deletion/retention, Candidate A/B/C, Analytics caching and Trophy Room dependencies first;
- preserve gameplay, persistence, recovery, PWA/offline, visuals and performance;
- protect same-name distinct managers, one manager across multiple Saves, unresolved historical identities and deletion/recovery behavior with deterministic and browser evidence;
- do not expand into cloud, accounts, synchronization or unrelated roadmap work.

Verified live `main` before branch creation:

`56b7f5cff2055d67ba5ffa6b4729bb24c46718a5`

Active branch:

`agent/manager-identity-linkage-foundation`

Branch-opening handoff commit:

`50840969738e3fb26fb2851ace3eca17d17e1df2`

The branch was created directly from the exact live `main` SHA above. At branch creation the only open PRs were obsolete historical drafts #37 and #35.

## Production/runtime boundary before this candidate

Application milestone: `v1.3.0 — Recovery & Device Resilience Hardening`

Installable Offline App runtime: `1.3.0-r1`

Immediate previous known-good whole shell: `1.2.0-r2`

Current shipped product layer: Visible Local Profiles / Save Library Core UI

Current production runtime feature merge: `9c648d10e869a56de54e0fa98c30cf2d2e5d05aa`

Feature release version: intentionally unassigned

This candidate does not assign a new application or runtime version.

## Source reconstruction and bounded semantic decision

Current source and the completed Local Profiles / Save Library handoffs establish these non-negotiable facts:

1. Stable `profile_*`, `save_*` and `season_*` identities already exist.
2. Fresh New Showdown creation intentionally creates two fresh Local Profiles. Equal display names do not imply equal identity.
3. Display names are labels only. Name equality, normalization, spelling or case folding must never map identity.
4. Singleton migration may reuse profile refs for a Legacy record only when it is the exact same Showdown identity; otherwise historical manager refs remain unresolved.
5. Single-Save deletion intentionally retains Local Profiles and Legacy history.
6. `js/saveLibraryRuntime.js` is the canonical runtime mutation owner. UI code must not write canonical browser storage.
7. Candidate A remains a non-mutating active-Save projection with the existing v1 envelope. Candidate C remains the only restore stage that mutates canonical restore state through strict exact raw snapshots and transaction-owned guarded writes.
8. Current Career Analytics still aggregates longitudinal managers primarily by normalized display name. Trophy Room consumes that output and therefore inherits the limitation.

A direct profile-ID key swap is not sufficiently correct because fresh Saves can represent the same real manager with different `profile_*` identities. The smallest safe foundation is therefore explicit reuse of an existing stable Local Profile reference, not a new person/account schema and not name inference.

### Chosen identity semantics

- Existing `profile_*` identity is the longitudinal manager identity when the user explicitly reuses it.
- A Save manager role can be explicitly reassigned to an existing Local Profile.
- The old Local Profile is retained; linkage does not merge/delete identities.
- One profile cannot represent both rival roles inside the same Showdown.
- Showdown and Legacy display-name labels are not rewritten by identity linkage.
- A matching Legacy copy inherits a Save-role link only when its stable `identity.saveId` exactly matches that Save.
- Historical-only Legacy roles may be explicitly mapped to an existing Local Profile or explicitly returned to `null` / unresolved.
- Historical mappings are located by the existing Showdown record identity and stable-ID migration, never by manager labels.
- If a historical record resolves to a Save that still exists locally, direct historical mapping is rejected; the Save role must be linked so the matching Legacy copy stays coherent.
- Save deletion continues to preserve profiles, cross-Save references and historical mappings.
- No profile rename/edit, generic profile CRUD, Analytics calculation rewrite, cloud/account/sync model, backup-envelope redesign or release assignment is part of this candidate.

## Recovery / Candidate A-B-C conclusion

Candidate A already carries the active Showdown's `identity.managerProfileIds` inside its existing active-Showdown projection. The v1 backup envelope therefore does not need a format change for this bounded foundation.

The existing Save Library restore preparation previously rebuilt the active backup through singleton migration and could regenerate role profile IDs. The bounded correction preserves valid incoming `profile_*` references:

- reuse an existing local profile when the incoming stable ID already exists;
- reconstruct only the minimum referenced profile registry entry when the incoming active backup carries a valid stable profile ID that is not present locally;
- retain deterministic generated fallback profiles for older backups that do not carry valid refs;
- reject an active backup that assigns the same profile to both rival roles;
- retain all unrelated/non-active Saves and existing profiles.

Candidate C's strict exact raw snapshots, stale-state checks, guarded transaction, rollback ownership and recovery machinery remain unchanged.

## Transaction/concurrency decision

Identity mutations flush pending application writes first and then use the existing exact Save Library/Legacy/singleton transaction authority.

For Save-role linkage, Legacy bytes are always included as an exact guarded precondition even when no current Legacy record changes. This is required because the presence of a matching stable Legacy copy determines whether propagation is required. If another tab archives or changes Legacy at the transaction boundary, the linkage fails closed before an owned write rather than accepting an inconsistent Save/Legacy relationship.

## Implementation checkpoint

The bounded implementation changes are now published on the active branch in these files:

- `js/saveLibraryRuntime.js`
  - adds detached identity mapping inspection;
  - adds explicit Save-role profile reassignment;
  - adds explicit historical-role mapping/unmapping;
  - uses existing guarded Save Library/Legacy transaction ownership;
  - preserves incoming active profile refs during restore preparation.
- `js/saveLibraryUI.js`
  - adds an explicit Manager Identity Links surface inside the existing lazy Save Library/Settings owner;
  - profile options include both display label and short stable profile identity;
  - historical-only roles include an explicit unresolved option;
  - no raw `localStorage` access is added.
- `css/saveLibrary.css`
  - adds contained lazy linkage presentation while retaining phone/reduced-motion behavior.
- `tests/contracts/manager-identity-linkage-contracts.cjs`
  - protects same-name separation, explicit cross-Save reuse, stable-only Legacy propagation, unresolved history, profile retention, Candidate A/C identity preservation, stale Save authority and Legacy transaction-boundary drift.
- `tests/support/run-contract-suite.cjs`
  - wires the deterministic identity contract into the canonical contract suite.
- `tests/browser/manager-identity-linkage-audit.cjs`
  - exercises the visible linkage surface, same-name distinct managers, exact matching-Legacy propagation, historical map/unmap, cross-linked active Candidate A/C preservation, deletion retention and Settings focus ownership.
- `.github/workflows/validate-stability-lane.yml`
  - adds the browser audit to the existing Stability family locally and on deployed `main` without adding a workflow family or increasing timeouts.

Publication commits through the first complete runtime/UI/test implementation:

- `6b0f0db114553010d6a014fe7f2e1dd58613b1e2` — deterministic identity contract;
- `77d22ec020ba584d0eac911fd6d8e6bff7b4a4f8` — browser identity audit;
- `b972d8368bb64b9326595baef1cbc3ef56b56eb6` — canonical contract-suite wiring;
- `f454a9d592f2ad5bd898d4adee8163dc38f2441a` — Save Library identity-link styles;
- `50f94c355e8b390a34daa48affd6991064172937` — Stability lane coverage;
- `9e126e35c3d02b54495233e87ea4c99957423d6d` — explicit identity UI;
- `94da55d5d92a1c2a5e7a36f0ffdb7e0adc306640` — runtime identity linkage and restore-preservation implementation.

No gameplay/scoring code, Analytics calculation, Trophy Room calculation, raw storage owner, storage transaction engine, service worker revision, release identity or backup envelope is changed.

Local pre-publication checks completed against the prepared files:

- `node --check js/saveLibraryRuntime.js` — pass;
- `node --check js/saveLibraryUI.js` — pass;
- `node --check tests/contracts/manager-identity-linkage-contracts.cjs` — pass;
- `node --check tests/browser/manager-identity-linkage-audit.cjs` — pass;
- `node --check tests/support/run-contract-suite.cjs` — pass;
- Save Library CSS braces balanced;
- required existing `@media(max-width:760px)` and `@media(prefers-reduced-motion:reduce)` boundaries retained;
- `js/saveLibraryUI.js` contains no `localStorage` access.

Full repository validation is still required on the exact published branch head. Do not call the candidate green until GitHub Actions proves that exact head.

## Prior audit / authority closure

The prerequisite Identity × Legacy × Analytics × Roadmap audit was completed on `agent/identity-analytics-roadmap-audit`.

Final validated audit head:

`64afd874516af0b104a30f438514d43c8e0eb253`

PR #56 merge:

`58c92dfbabd3fcdcb5cf03cce6baffe882901e4e`

The audit established that current name-based longitudinal Analytics is not identity-safe and that historical ambiguity must remain unresolved unless source identity proves a relationship.

Post-merge handoff authority before this candidate was sealed through:

`56b7f5cff2055d67ba5ffa6b4729bb24c46718a5`

A prior documentation-only handoff seal at `2433e80358cc70494e1360a9c0f39c510f5f26bf` failed Static App because the protected semantic phrase `concise rolling handoff` had been altered. The correction `dc9a7c494dab834a6fec731b370937cf45b6aff1` restored the contract without weakening it. Preserve both protected semantic markers in this file.

## Open historical drafts

PR #37 / `agent/v13-hardening` and PR #35 / `agent/v1.2-installable-offline-r2` are obsolete historical drafts, not development baselines.

## Current validation / next legal action

Open a draft PR for `agent/manager-identity-linkage-foundation` and validate its exact head across all normal PR workflow families. Record every failure, root cause and correction here without weakening product guarantees or increasing time/performance ceilings.

After the identity foundation itself is green and production-proven, stop before changing Career Analytics/Trophy Room aggregation unless a later explicit owner instruction authorizes that separate runtime correction.
