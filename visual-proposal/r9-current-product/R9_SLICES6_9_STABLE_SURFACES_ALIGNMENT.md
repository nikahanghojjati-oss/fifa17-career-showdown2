# R9 Slices 6–9 — Remaining Stable-Surface Alignment

Base runtime: `1.9.1-r44`
Base main: `47cbfbaba083e1eb35c06d687cceceb799e34920`

These slices cover the lower-risk screens whose data/runtime ownership is already stable enough for presentation-only realignment.

## Slice 6 — Season Summary

Current route: `seasonSummary`

R9 role:

- preserve it as the existing local/historical summary shell
- do not give it competing Shared Journey progression authority
- Shared live progression remains owned by Season Results + Shared Multi-Season + Dashboard
- keep `#nextSeasonAction` and local-mode behavior intact
- use R9 visual materials only

## Slice 7 — Analytics family

Routes:

- `statistics`
- `careerStatistics`
- `trophyRoom`

Owners:

- `js/statistics.js`
- `js/trophyRoom.js`
- `css/analytics.css`

R9 rules:

- preserve identity-safe Daniel/Nik attribution
- preserve current tables/cards/progression lists
- no ranking/community/public-discovery concepts
- Rivalry Statistics remains valid without a football-photo plan
- Career Statistics and Trophy Room retain their licensed visual plans where current runtime mounts them
- dense data must remain readable on 390px mobile and Chromebook widths

## Slice 8 — Legacy + Restore / Recovery

Route:

- `legacy`

Owners:

- `js/legacy.js`
- `js/restoreUI.js`
- `js/restore.js`
- `js/importAnalysis.js`
- `css/legacy.css`
- `css/restore.css`

R9 rules:

- archive history and recovery tools remain one product family
- do not weaken Candidate B import analysis or Candidate C atomic restore
- destructive controls remain visually distinct
- corrupt/blocked/recovery states remain visible real text
- do not invent provider recovery authority
- maintain long-ID / conflict-message wrapping

## Slice 9 — Rule Book + Settings

### Rule Book

Owner:

- `js/ruleBook.js`
- `css/rulebook.css`

R9 rules:

- styling must not alter the current scoring/rule text
- scoring presentation must remain consistent with canonical scoring implementation
- preserve responsive one-column mobile layout

### Settings

Owners:

- `js/settings.js`
- `js/onlinePlayerIdentity.js`
- `css/settings.css`

Current online-only product behavior:

- product-facing Account / player / device panel is injected by Online Player Identity
- internal engineering panels are hidden in normal product mode
- offline/internal diagnostics can remain available to audit/test surfaces but must not be visually resurrected in normal mode
- real Forget This Device / retry / identity actions remain the only controls

R9 rules:

- style existing `settingsConnectedAccountPanel`
- no duplicate sign-in/device flow
- preserve focus trap, keyboard operation, reduced motion and mobile full-screen dialog
- do not alter account/device authority

## Shared acceptance

- presentation-only changes
- no provider writes added
- no route ownership changes
- no canonical storage changes
- no second controls
- 390×844 and 1366×768 no horizontal overflow
- reduced-motion behavior retained
- Manager 1 = Daniel
- Manager 2 = Nik
- Firebase Spark only
- billing OFF
