# Surface Group 05 — Shared Two-Manager State System

Status: ACTIVE SURFACE CONTRACT — RECONCILED THROUGH r13 MULTI SEASON

Current product anchor: `ea96ff1280b5e63962b7ee1a6a8c0980fe4e3686` / `1.9.1-r13`.

Shared play is presented as stateful variants of canonical screens, not as a separate skin or a parallel application.

## Core rule

R8 never creates a second shared-play protocol, scoring engine, save registry, season cursor or navigation system. It visually exposes state already owned by the provider/runtime and keeps local and shared variants recognizably the same product.

Canonical manager mapping in proposal examples:

Manager 1 = Daniel

Manager 2 = Nik

## Shared setup

Canonical screens: League Wheel and Club Assignment.

Visual states:

- pairing/session gate;
- coordinator/host action available;
- peer waiting;
- provider-authoritative result;
- no-reroll/locked result;
- mirrored manager equality;
- stale/reconnecting/revoked/unavailable when surfaced.

Actionable authority is explicit in text. Peer waiting must not resemble an error.

## Shared Career Start

Where current/final runtime exposes this state, show:

- setup confirmed;
- each bound manager acknowledgement;
- own acknowledged / waiting for rival;
- both ready;
- no duplicate local Start authority.

Use a compact readiness band within the canonical flow rather than a new full-page experience unless final product owns a route.

## Shared Transfer Challenge

Reuse the canonical Transfer Challenge board with:

- role-owned private fields;
- opponent privacy before completion;
- shared timer and terminal state;
- provider confirmation;
- identical verdict after authoritative reveal.

Do not render fake hidden opponent data. Withheld data is represented as explicitly withheld.

## Shared Season Results

Reuse `seasonEntry` with publication/reveal phases, coordinator commit, acknowledgement, canonical scoring, history convergence and r13 Multi Season progression as defined in `screens/07_SEASON_RESULTS_ENTRY.md`.

## Shared Season Commit

Use a clear status/action band:

- Coordinator: Commit Shared Season;
- Peer: Waiting for Coordinator;
- after commit: Acknowledge Shared Season;
- own acknowledged: Waiting for Rival;
- both acknowledged: terminal confirmation.

The band must never imply a commit before provider authority confirms it.

## Shared Canonical Scoring

Use a high-contrast gold authority panel only after canonical scoring is genuinely available.

Display real totals and contribution categories without recalculating them in presentation code.

## Shared History Convergence

Use a quieter read-only ledger showing accepted seasons, league, fixed clubs, W/D/L, Showdown points and trophies according to provider-authoritative history.

No edit affordance and no write-like styling.

## r13 Shared Multi Season progression

Multi Season is a progression gate after accepted Shared History, not a new route or a new visual subsystem.

Production owns dynamic UI elements inside the existing Season Results review flow:

- `#sharedMultiSeasonProgressionStatus`;
- `#sharedMultiSeasonContinueAction`.

The visual system must distinguish:

### History not yet witnessed

Accepted season is known, but the Shared History review has not yet been visibly witnessed on this device. Show a calm explanatory status and a disabled waiting action.

### Ready to advance

History for Season N is converged and visibly witnessed. Show the next-season status and allow exactly one `CONTINUE TO SEASON N+1` action when production enables it. The action returns to canonical Dashboard.

### Season plan terminal

All configured seasons are authoritatively accepted. Show `SEASON PLAN COMPLETE ✓` as disabled and explicitly state that Final Reconciliation remains separate.

R8 must not:

- invent a season selector;
- skip a season;
- alter fixed clubs;
- make the Continue action look like another provider commit;
- claim Final Reconciliation is complete;
- locally persist a second season cursor.

## State badge grammar

Recommended text-first badges:

- READY;
- YOUR ACTION;
- WAITING FOR RIVAL;
- WAITING FOR COORDINATOR;
- PUBLISHED;
- REVEALED;
- COMMITTED;
- ACKNOWLEDGED;
- HISTORY CONVERGED;
- NEXT SEASON READY;
- SEASON PLAN COMPLETE;
- RECONNECTING;
- STALE — REVIEW AGAIN;
- REVOKED;
- UNAVAILABLE.

Exact user-visible wording remains subject to final product copy. The visual contract is that state and next owner are explicit, not inferred from color.

## Responsive and accessibility

Shared state bands remain near the action they govern. On mobile they move before the actionable control rather than into a distant header.

Codes/capabilities stay selectable and wrap-safe.

Waiting states are calm, not red.

Multi Season status and Continue remain adjacent in reading order and focus order.

Focus stays on current actionable controls and does not jump because a peer/provider state refreshes unless product authority intentionally moves focus.

Reduced motion does not delay shared transitions.

Disabled waiting and terminal actions remain understandable without relying on low opacity.

## Future final-main additions

Current `NEXT_TASK` after r13 points toward Journey Reconnect. Later work may also add conflict handling, local reconciliation, final reconciliation, terminal close, physical-journey proof or stable-release UI. Each new visible state must be inventoried here before the proposal can become final.