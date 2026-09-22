# R9 Slice 3 — Shared Dashboard Alignment

Base runtime: `1.9.1-r44`
Base main: `47cbfbaba083e1eb35c06d687cceceb799e34920`

## Product role

The Dashboard is the current shared rivalry command center. It should answer four questions without creating new authority:

1. What Showdown and season am I in?
2. What is the authoritative aggregate score?
3. What shared stage is next?
4. Is the shared journey healthy enough to continue?

## Current owners

### Static/routine dashboard shell

`index.html` + `js/showdownUI.js`

Real nodes include:

- `#dashboardShowdownName`
- `#dashboardLeague`
- `#dashboardRound`
- `#dashboardStatus`
- `#dashboardTransferStatus`
- `#dashboardScoreboard`
- `#dashboardSeriesStatus`
- `#dashboardScoreOne`
- `#dashboardScoreTwo`
- `#dashboardLastSeasonSummary`
- Daniel/Nik manager + club cards
- `#seasonPrimaryAction`
- Back
- runtime-created `#dashboardIntegrityStatus`
- runtime-created `#completedShowdownHub`
- runtime-created `#deleteActiveShowdown`

### Authoritative Shared multi-season projection

`js/productionSharedMultiSeasonProgression.js`

When authoritative it marks:

- `#dashboard[data-shared-dashboard-authority="true"]`

and owns:

- current/terminal season text
- accepted season count
- aggregate manager totals
- current clubs from confirmed Shared Setup
- last accepted season summary
- series leader chip

It does not write canonical local storage.

### Shared Transfer next action

`js/productionSharedTransferChallenge.js`

It reuses the real:

- `#seasonPrimaryAction`
- `#dashboardTransferStatus`

and marks:

- `#seasonPrimaryAction[data-shared-transfer-challenge="true"]`

Labels are derived from the real Transfer provider state.

### Shared Journey reconnect

`js/productionSharedJourneyReconnect.js`

This is a global status surface, not a Dashboard-local provider.

Real nodes:

- `#sharedJourneyReconnectStatus`
- optional `#sharedJourneyReconnectAction`

Existing provider phases:

- `OFFLINE_HOLD`
- `RECOVERY_PENDING`
- `FRESH_SESSION_REQUIRED`
- `ACTIVE_RECOVERED`
- `TERMINAL_RECOVERED`

Existing DOM projections:

- `data-recovery-phase`
- `data-authoritative`

## R9 visual hierarchy

When `data-shared-dashboard-authority="true"`:

1. Showdown / league / season status
2. Aggregate scoreboard
3. latest accepted season context
4. Daniel and Nik club cards
5. real Shared Transfer primary action
6. secondary/back/destructive actions

Reconnect remains visually above the app because its scope is global. It must be strong enough to stop the user from mistaking preserved local display for provider authority.

## State rules

### Active season

- show accepted-season progress
- emphasize real next Shared Transfer action
- do not imply Transfer is playable if the runtime disables it elsewhere

### After accepted season

- last season summary becomes visible
- aggregate score remains the primary rivalry score
- next season cursor comes from Shared Multi-Season authority

### Terminal

- status reads Shared Showdown complete
- Dashboard may expose completed hub/actions created by current runtime
- no Start New Season affordance may be visually manufactured

### Integrity warning

- real `#dashboardIntegrityStatus` remains visible when runtime warnings exist
- styling must distinguish it from ordinary informational status

### Reconnect / offline hold

- global reconnect banner uses the real provider-derived message
- `OFFLINE_HOLD` must never look authoritative
- recovery-required states keep the real reconnect/resolve action
- recovered states may use success treatment only when existing `data-authoritative="true"`

## Protected behavior

Do not change:

- Shared Multi-Season read/projection rules
- season cursor logic
- score calculations
- Transfer state/primary action ownership
- reconnect protocol or polling
- completion/deletion behavior
- manager mapping
- Zlatan licensed Dashboard visual/crop
- local/canonical storage boundaries

## Acceptance

- no duplicate dashboard controls
- no new score source
- `#seasonPrimaryAction` remains the actual Transfer control
- reconnect banner remains global and provider-derived
- terminal Dashboard never visually offers an extra season
- long 10-season labels fit phone + Chromebook
