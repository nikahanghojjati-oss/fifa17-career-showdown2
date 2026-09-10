# Screen 06 — Transfer Challenge / `transferChallenge`

Status: ACTIVE SCREEN CONTRACT

Source anchor: current `main` at `cef2e101f23fd8cb777f71950bac8f0f8d9f2c7b`.

## Purpose

Transfer Challenge is a timed competitive operations board. Urgency, privacy and data-entry clarity dominate. Decorative character art is excluded.

## Exact current routed structure

Preserve the current live product elements:

- Season Transfer Challenge heading;
- rules summary: 15 minutes, maximum three signings each, three opponent guesses;
- live phase status;
- `15:00` timer surface;
- rule note explaining league/nationality guesses and required releases;
- Start 15-Minute Window;
- End Window Early when available;
- equal Manager 1 and Manager 2 signing cards;
- three signing rows per manager with player, previous league and nationality fields;
- three opponent-guess rows per side with guess type and value;
- form error live region;
- Lock Transfer Challenge Results when available;
- verdict cards;
- Continue to Season Results;
- Back to Showdown Home.

R8 does not alter timer, guess, signing, reveal, release or shared authority semantics.

## Visual hierarchy

1. Timer and phase status.
2. Start/end/lock authority action for current phase.
3. Two equal signing columns.
4. Two equal opponent-guess columns.
5. Validation/error state.
6. Verdict reveal after completion.
7. Continue to Season Results.

Use a dark technical board with gold phase rails. Avoid pulsing decoration around the timer; urgency comes from scale, typography and state, not distracting motion.

## Privacy treatment

Where shared authority withholds opponent data, represent that state as an explicit private/withheld panel. Do not show blurred fake data or decorative silhouettes that imply information exists locally.

A withheld state uses real explanatory text and an original lock/private icon only if it improves scanability.

## Manager mapping

Canonical proposal examples preserve Manager 1 = Daniel and Manager 2 = Nik. Live manager names remain DOM text and the two columns remain visually equal.

## State family

Cover:

- not started;
- active countdown;
- one manager ended early / waiting;
- both approved early end;
- timeout;
- role-owned entry locked;
- private opponent data withheld;
- validation error;
- results locked;
- verdict visible;
- ready to continue;
- provider/reconnect/stale/revoked/error state where surfaced;
- reduced motion.

## Asset resolution

Required roles:

- timer/window frame: CSS/procedural geometry;
- guess/signing stage markers: DOM/CSS;
- private/unrevealed/complete state badges: DOM text plus CSS;
- transfer-paper/operations-board treatment: CSS/SVG surface with all names/labels as live DOM text;
- rights-safe transfer icons: original minimal SVG only when needed.

No new raster image generation is required.

Previous mirrored-text transfer artwork is explicitly rejected. No core UI text may be baked into any transfer image or board asset.

## Responsive contract

Wide desktop may show two manager signing columns and two guess columns side by side.

Reduced wide prioritizes the timer and phase action, then preserves equal manager columns if field widths remain usable.

Chromebook/tablet may stack signing and guess sections. Keep the timer and current action near the top and do not force tiny three-field inputs solely to preserve a desktop grid.

Mobile stacks each signing row into readable labeled fields if necessary. Opponent guess type/value remain paired only when touch targets and labels stay clear.

## Accessibility and QA

- timer remains a real timer/status surface, not image text;
- phase state remains explicit in text;
- private/withheld state is not color-only;
- all inputs retain accessible labels;
- focus ordering follows the logical DOM workflow;
- error messaging is readable and associated with the active phase;
- disabled/locked inputs remain understandable;
- reduced motion suppresses decoration without changing timing authority;
- no animation delays Start, End Early, Lock or Continue actions.

## Final-main reconciliation

At the final product checkpoint, inspect the provider-authoritative shared Transfer Challenge states as well as the local route. Any new role ownership, approval or reconnection state becomes part of this contract before senior implementation.