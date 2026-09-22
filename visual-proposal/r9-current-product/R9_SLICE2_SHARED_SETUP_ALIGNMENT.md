# R9 Slice 2 — Shared League + Club Setup Alignment

Base runtime authority: `1.9.1-r44`
Base main: `47cbfbaba083e1eb35c06d687cceceb799e34920`

## Purpose

League Wheel and Club Assignment are one provider-owned setup journey in current r44. They must be visually rebuilt together.

The visual layer does not own draw results, role authority, season choice, confirmation, polling, reveal witnesses or Career Start routing.

## Current authority

Primary owner: `js/productionSharedShowdownPresentation.js`

Persisted Shared Setup phases:

1. `SHARED_SETUP_OPEN`
2. `LEAGUE_WHEEL_COMMITTED`
3. `CLUB_ASSIGNMENTS_COMMITTED`
4. `SEASON_LENGTH_COMMITTED`
5. `SHOWDOWN_CONFIRMED`

Current public role projection:

- `playerOne` = Daniel
- `playerTwo` = Nik
- coordinator/host action authority comes from Shared Setup provider state, not visual role styling

## League Wheel current-state contract

### Not ready

Provider/pair/session authority is not ready.

Live DOM:
- `#leagueWheelScreen`
- `#selectedLeague`
- `#leagueStateNote`
- `#spinLeague`

Required presentation:
- clearly blocked
- pairing/session explanation visible
- no fake spinner or reroll affordance

### Shared setup open — coordinator

Provider says Shared Setup is open and this role is coordinator.

Required:
- real `#spinLeague` is primary
- provider-owned nature of the result remains visible
- busy state remains immediate through existing `aria-busy`

### Shared setup open — peer

Required:
- real `#spinLeague` becomes waiting state
- automatic provider polling remains the mechanism
- visual must not imply peer can spin
- no manual duplicate refresh/spin control

### League committed but not yet witnessed locally

The provider may already be ahead.

Required:
- same real wheel animates to authoritative league
- local witness is recorded only by existing runtime
- do not skip directly to Club Assignment

### League witnessed

Required:
- authoritative result visibly locked
- `#spinLeague` becomes the existing Continue to Club Packs control
- no reroll styling

## Club Assignment current-state contract

### Waiting for authoritative club draw

Required:
- two real sealed pack cards remain the visual object
- coordinator owns `#openClubPack`
- peer sees waiting state and automatic update
- Back remains hidden/disabled under shared authority

### Authoritative reveal in progress

Required:
- preserve existing reveal timing/reduced-motion path
- preserve existing card identities and procedural crest system
- status must communicate Pack 01, Pack 02 and both-revealed progression
- no visual code may create a second reveal scheduler

### Both packs witnessed

Required:
- real Daniel/Nik club cards
- real `#clubRivalryConfirmation`
- `#sharedShowdownSeasonChoice` becomes a season-plan status surface, not a season picker

### Season plan auto-locking

Daniel's original 1/3/5/10 selection is encoded/bound earlier and automatically committed.

Required:
- no second season-choice buttons visible
- pending state may say the original plan is being locked
- locked state displays exact season count
- mismatch state explicitly routes to recovery language

### Per-manager final confirmation

Required:
- real `#continueClubAssignment`
- not confirmed: `CONFIRM SHARED SHOWDOWN`
- own confirmed: `CONFIRMED · WAITING FOR RIVAL`
- both confirmed + ready: existing Career Start handoff
- confirmed but connection unavailable: reconnect language
- mismatch: disabled recovery-required state

## R9 presentation hooks allowed

R9 may add derived DOM data attributes for styling/debug evidence, provided they are projections only:

- `data-shared-setup-phase`
- `data-shared-presentation-role` already exists
- `data-shared-league-witnessed` already exists
- `data-shared-club-packs-witnessed` already exists
- `data-shared-season-state` may be `locking`, `locked`, `mismatch`, or `hidden`

These attributes do not become authority.

## Protected behaviors

Do not change:

- provider mutation methods
- provider polling interval
- `actionPromise` click coalescing
- busy/disabled handling
- wheel result calculation
- pack reveal scheduler
- witness reset rules
- hidden Back behavior
- automatic season commit
- per-role confirmation
- one-click Career Start handoff
- current Ronaldo/Pogba licensed football visuals and crop policy
- reduced-motion behavior
- Spark-only / billing-off architecture

## Acceptance

Source/contract:

- provider authority flags unchanged
- no local random authority introduced
- presentation hooks derive from existing setup state
- season status does not show a second picker
- existing control IDs are preserved

Browser:

- Daniel host: spin -> witness -> Continue -> packs -> season lock -> confirmation
- Nik peer late join: still witnesses league before packs
- mismatch: no picker, recovery state
- repeat-tap mutation count remains exactly one
- reduced-motion pack reveal remains valid
- mobile 390x844 and Chromebook 1366x768 have no horizontal overflow

Physical:

- iPhone Safari
- Chromebook Chrome
- background/foreground during peer wait
- one manager confirmed while the other remains unconfirmed
