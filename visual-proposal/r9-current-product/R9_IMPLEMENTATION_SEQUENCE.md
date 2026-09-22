# R9 Implementation Sequence — Current r44

Base: `47cbfbaba083e1eb35c06d687cceceb799e34920`

## Goal

Rebuild the visual system around the latest production architecture without destabilizing the now-working Shared Showdown authority.

This sequence intentionally avoids a one-shot whole-site CSS rewrite.

## Slice 0 — Global contract and test harness

Status: STARTED by this package.

Tasks:

- freeze the current route/surface inventory
- preserve r44 DOM IDs and runtime-created nodes
- define global spacing/type/action/state tokens that can be consumed by all current CSS modules
- define a standard presentation treatment for READY / WAITING / LOCKED / CONFIRMING / RECOVERY / ERROR / COMPLETED
- keep image generation locked
- add source-backed browser checks before broad visual adoption

Exit gate:

- all 13 routes and all first-class overlays/panels have current owners recorded
- no proposal state exists without a current runtime source

## Slice 1 — Home + online identity + Create Showdown

Reason: these are the true entrance to the online-only product and have changed materially since R8.

Must cover:

- Daniel host / Nik join variations
- signed out
- connecting
- choose player
- offline
- device error
- active showdown
- no active showdown
- season count 1/3/5/10
- persistent pair / Shared Journey entry states

Do not revive hidden manager-name inputs as visible controls.

## Slice 2 — League Wheel + Club Assignment shared setup

Rebuild both screens as one connected setup journey.

Must preserve:

- host-only provider mutations
- peer waiting/automatic refresh
- authoritative league reveal
- both-device witness presentation
- authoritative two-pack reveal
- Daniel/Nik mapping
- recovered authoritative season plan
- mismatch/recovery state
- per-manager final confirmation
- Career Start handoff

This slice should reuse existing live wheel and pack DOM; no visual-only wheel or pack engine.

## Slice 3 — Dashboard / rivalry command center

Unify the hierarchy for:

- current season
- aggregate score
- current clubs
- current shared stage
- primary next action
- reconnect/recovery
- last season
- rivalry statistics when product-exposed
- completed-showdown state

No public ranking/community concepts.

## Slice 4 — Transfer

Integrate accepted work from draft PR #298 only after its independent acceptance.

Do not copy Transfer changes manually into Global R9 before that gate.

## Slice 5 — Season Results authority workflow

Highest-risk visual slice.

Treat the route as stages:

1. own result entry
2. own review/edit
3. own publication/lock
4. waiting for rival
5. both results available
6. season commit
7. canonical scoring
8. history convergence
9. multi-season progression OR final reconciliation
10. terminal close

Must include stale/reconnect/conflict/failure states and must not expose opponent-private results early.

## Slice 6 — Season Summary / historical result role

Decide its r44 product role explicitly.

If Shared Journey uses Season Results + Dashboard as the live progression path, Season Summary should be treated as historical/summary presentation rather than given competing live progression authority.

## Slice 7 — Analytics family

Update together:

- Rivalry Statistics
- Career Statistics
- Trophy Room

Share a dense-data visual grammar while preserving the current distinction that Rivalry Statistics does not require the football-photo visual system.

## Slice 8 — Legacy + restore/recovery

Design normal archive content and operational recovery as one product family.

Must prove:

- completed showdown archive
- empty
- import analysis
- invalid/corrupt
- unavailable
- recovery
- destructive controls
- long identifiers/messages
- keyboard/mobile operation

## Slice 9 — Rule Book + Settings

Rule Book:

- current canonical scoring content
- readable tables/cards
- no stale rule copy disguised by styling

Settings:

- online account/player/device presentation
- reconnect/error
- Forget Device
- product-facing panels only
- preserve hidden internal audit panels

## Slice 10 — Global overlays and final cross-screen acceptance

Explicitly polish:

- loading/startup
- online identity gate
- Shared Journey entry/setup
- Shared Career Start
- reconnect
- conflict/reconciliation
- update/offline notices
- route transitions
- reduced motion

Physical acceptance targets:

- iPhone Safari
- Chromebook Chrome
- narrow mobile reflow
- software keyboard open
- background/foreground recovery
- reconnect after temporary network loss
- long 10-season labels and final-season terminal path

## Branching policy

- `main` remains untouched by R9 work until a bounded slice is accepted.
- Draft PR #298 remains Transfer-only.
- This global branch owns current-product mapping and future non-Transfer screen slices.
- Before each implementation slice, re-resolve `main`. If main moves, reconcile runtime ownership first.
- Never merge the old R8 proposal branch into R9. Port only reviewed visual ideas/assets that remain compatible with current r44 authority.

## Recommended immediate implementation target

After this source-backed alignment package, start Slice 1: Home + Online Identity + Create Showdown.

Why:

- lowest provider-mutation risk
- highest user-facing impact
- current R8 assumptions are visibly outdated
- establishes reusable R9 typography/action/state grammar before League/Club and Season Results
