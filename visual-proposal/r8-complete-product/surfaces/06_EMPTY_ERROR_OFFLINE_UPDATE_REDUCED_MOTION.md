# Surface Group 06 — Empty, Error, Offline, Update and Reduced-Motion State Grammar

Status: ACTIVE CROSS-PRODUCT CONTRACT

This state grammar applies across routed screens, dialogs and connected/recovery surfaces. Individual screen contracts may refine it but may not contradict the underlying product authority.

## Empty

Use a neutral dark/charcoal card, short explanation and one appropriate next action when one exists.

Never show fake sample data as though it were a saved Showdown, statistic, trophy or remote state.

Empty is visually distinct from loading and error.

## Loading / busy

Keep component geometry stable to prevent layout jumps.

Use explicit status text and existing `aria-busy` behavior where product authority already provides it. Decorative infinite spinners are optional and subordinate to useful status copy.

No busy animation may delay a completed product action.

## Waiting for the other manager

Waiting is calm, not destructive red.

Identify who or what is awaited when product authority knows it. Avoid visual pressure that encourages repeated manual refresh/submit actions.

The current user's already-completed action remains visibly acknowledged.

## Offline / provider unavailable

Distinguish connected-feature unavailability from local Career Mode availability whenever the runtime supports local continuation.

Do not use cloud-loss imagery or copy that implies local saves are gone.

Offline/reconnecting status uses explicit text and restrained amber/neutral treatment.

## Stale / conflict

Use amber warning hierarchy.

Explain that the view/action must be refreshed or reviewed again. Where product truth says no unverified mutation occurred, the presentation should reinforce that safety rather than suggesting corruption.

Primary next action is refresh/retry/re-review according to runtime authority, not destructive reset.

## Revoked / unavailable capability

Use clear neutral-danger hierarchy based on actual severity. Explain that the previous capability cannot be used. Do not silently generate or visually imply a replacement capability.

## Destructive error / critical recovery

Reserve red for real destructive risk, blocked restore/delete or critical recovery.

Use explicit text plus color. Freeze unrelated controls only when the runtime does.

No character art, glow sweep, confetti or continuous decorative motion.

## Update states

Application update availability, applying/update-ready or offline-stale states must remain subordinate to active user data safety.

Do not style an update prompt like a destructive system alert unless the product says the current state is unsafe. Preserve existing update/reload semantics.

## Reduced motion

For `prefers-reduced-motion: reduce` and any product-level reduced-motion setting:

- suppress decorative translation/scale;
- suppress continuous atmosphere drift;
- suppress nonessential sheen/sweeps/confetti;
- preserve immediate state changes;
- preserve product-owned wheel/pack comprehension according to existing reduced-motion behavior;
- do not suppress required information;
- do not delay controls while waiting for an animation that no longer plays.

## Focus and live-region behavior

Async state updates must not steal focus unless product authority intentionally transfers it.

Runtime notice dismiss, dialog controls and route-heading focus remain visible.

Live regions announce meaningful state changes, not decorative animation frames.

## Responsive state handling

Status copy, errors and codes wrap safely at 390px class mobile width.

Do not hide error explanation to save vertical space. Collapse decoration first, then secondary metadata, before reducing essential state copy.

## Cross-product acceptance

Every substantial screen/surface must eventually be checked against:

- normal populated;
- empty;
- busy/loading;
- disabled;
- waiting;
- offline/unavailable;
- reconnecting;
- stale/conflict;
- revoked when applicable;
- destructive/critical recovery when applicable;
- normal motion;
- reduced motion.

Only states that the underlying product can actually expose need a rendered fixture; the proposal must not invent unreachable product semantics.