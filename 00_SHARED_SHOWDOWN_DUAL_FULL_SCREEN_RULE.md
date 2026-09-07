# Shared Showdown Dual Full Screen Experience Rule

Owner direction: 2026-09-07.

This is a permanent Shared Showdown product rule. The League Wheel and Club Pack requirement is not a one-off exception. It generalizes to the complete Shared Showdown Journey.

Both private managers must individually experience every canonical gameplay screen from shared entry through terminal completion on their own device. One manager seeing a screen never satisfies the other manager's experience requirement.

Role-specific authority may differ. For example, the host may own the league spin while the peer sees the same complete League Wheel screen in a waiting/read-only state. Different controls are allowed. Skipping the gameplay screen for one role is not allowed.

A toast, badge, status line, background refresh, summary label or the other manager's screenshot is not equivalent to seeing the complete gameplay screen.

## Ordered local experience

Every canonical Shared Journey screen is part of an ordered per-device experience. If provider authority advances while one device is late, reloaded or temporarily offline, that device must replay or render every missed canonical gameplay screen in order before its local experience proceeds beyond those stages.

Provider advancement may therefore coexist with a late peer only when committed states remain replayable. A later authoritative state must never make a required earlier gameplay screen impossible for one manager to experience.

The existing r6 League Wheel and Club Pack behavior is the first concrete implementation of this rule. Each device must independently witness the real League Wheel, both club reveals, season-length state and final setup confirmation. The same principle applies to future career-start, transfer, results, season review, scoring, history, season-transition, reconciliation and terminal completion screens.

Reconnect and recovery may restore a device at the authoritative current state, but they may not silently skip normal canonical screens that device has not yet experienced. Diagnostic, error and engineering-only surfaces are not canonical gameplay screens and do not create a requirement that the unaffected peer see the same error.

## Relationship to MDP

For a user-facing Shared Journey capability, the dual-full-screen rule is part of the MDP engineering lifecycle exit criteria.

A capability may not complete MDP implementation, primary automated verification, regression re-test or product integration if one manager can skip any canonical gameplay screen belonging to that capability.

Adding this requirement does not itself award MDP points. Work earns MDP only when it closes a lifecycle stage under the normal MDP-1 scoring rules. If a later screen-skipping regression makes a previously completed lifecycle stage untrue, MDP must be reduced accordingly.

## Relationship to SSJR

This rule does not change the frozen SSJR-1.1 denominator, capability weights or evidence-layer policy and grants zero SSJR credit by itself.

Applicable SSJR production evidence must nevertheless demonstrate product behavior consistent with this later owner instruction. When physical/two-account proof covers a gameplay stage, each manager's observation must prove their own full-screen experience rather than inferring it from the other role.

## Canonical machine-readable authority

The complete stage map and invariants live in `SHARED_SHOWDOWN_DUAL_SCREEN_EXPERIENCE.json` under contract ID `SSJR-DUAL-FULL-SCREEN-1`.

Every future canonical Shared Journey gameplay screen automatically inherits this rule even if that screen is added after the current stage map was written. New screens must be added to the map when implemented, but omission from the map never creates permission to skip a screen for one role.
