# JOB-30 · G-13 part 2g: Rule Book and Settings

| Lane | Depends on | Code branch | PR into | Budget |
| --- | --- | --- | --- | --- |
| **codex** (Nik pastes the lead's box into the Codex app; the lead checks in a browser and merges) | job 24 merged | `gameplay/job-30-v10-rules-settings` | `gameplay/recovery-v1` | one Codex task |

Read `jobs/G13_PART2_COMMON.md` first, then job 24's PR body for the loader API (`js/v10Screens.js`).

## Screens

- Team V source (at `bde2172`): `rule-book/` and `settings/` (the system plate in `shared/plates/`).
- App screens: `ruleBook` and Settings (`#settingsButton` target).

## Build

- The **Rule Book** text comes from the app's current rules copy. Do not change any rule wording or scoring numbers. If Team V's copy differs from the app, the app wins. List each difference in the status file.
- **Settings** keeps every existing control and its id. That includes the backup and restore panels, which stay hidden or visible exactly as today. Candidate C alone owns destructive Apply, so never move or expose that control. Add Team V's credits block: the Marco Reus CC BY 2.0 line, its links and the app version.
- Register each screen through `js/v10Screens.js`. Copy only files that the CSS or JS reference. Images use job 24's runtime cache rule.

## Tests

`tests/contracts/v10-rules-settings-contracts.cjs`: the rules text equals the app source; every Settings control id survives; the Reus credit and the version are shown; no Apply control becomes visible.

## Done

Everything in COMMON "Checks before DONE". Then set `State: DONE` in `status/JOB-30.md`, with the PR link and head SHA. The lead merges; you do not.
