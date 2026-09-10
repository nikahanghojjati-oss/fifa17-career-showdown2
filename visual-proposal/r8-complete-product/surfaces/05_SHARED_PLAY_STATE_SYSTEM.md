# Surface Group 05 — Shared Two-Manager State System

Status: ACTIVE SURFACE CONTRACT

Shared play is presented as stateful variants of canonical screens, not as a separate skin or a parallel application.

## Core rule

R8 never creates a second shared-play protocol, scoring engine, save registry or navigation system. It visually exposes state already owned by the provider/runtime and keeps local and shared variants recognizably the same product.

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

Reuse `seasonEntry` with publication/reveal phases, coordinator commit, acknowledgement, canonical scoring and history convergence as defined in `screens/07_SEASON_RESULTS_ENTRY.md`.

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
- RECONNECTING;
- STALE — REVIEW AGAIN;
- REVOKED;
- UNAVAILABLE.

Exact user-visible wording remains subject to final product copy. The visual contract is that state and next owner are explicit, not inferred from color.

## Responsive and accessibility

Shared state bands remain near the action they govern. On mobile they move before the actionable control rather than into a distant header.

Codes/capabilities stay selectable and wrap-safe.

Waiting states are calm, not red.

Focus stays on current actionable controls and does not jump because a peer/provider state refreshes unless product authority intentionally moves focus.

Reduced motion does not delay shared transitions.

## Future final-main additions

If final main adds multi-season controls, reconnect/conflict flows, local reconciliation, final reconciliation, terminal close, physical-journey proof or stable-release UI, each new visible state must be inventoried here before the proposal can become final.