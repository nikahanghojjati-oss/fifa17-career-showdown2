# Surface Group 08 — r14 Shared Journey Reconnect

Status: ACTIVE PROPOSAL CONTRACT — RECONCILED TO PRODUCTION `1.9.1-r14`

Production anchor:

`97c28b1efea6ee6e901e6076a834ec419cbad5aa`

Production owner:

`js/productionSharedJourneyReconnect.js`

This surface is not a new route. Production owns a live `#sharedJourneyReconnectStatus` note inserted beneath `#topHeader` for shared journeys when reconnect state is present.

## Product authority

Journey Reconnect is read-only recovery observation. It preserves the durable rivalry while re-verifying replaceable private-session authorization.

The visual layer must never imply that this feature:

- writes canonical Save Library state;
- replaces Remote Joining;
- lists/discovers public sessions;
- changes league/clubs/history;
- can resurrect a terminal season plan;
- requires billing or paid cloud infrastructure.

## Exact phases

### `OFFLINE_HOLD`

Meaning: network is offline and provider authority is deliberately not claimed.

Presentation:

- calm amber/neutral left rule;
- title `SHARED JOURNEY HELD OFFLINE`;
- body explains preserved journey + reconnect requirement;
- no retry spinner loop;
- no destructive red;
- Career Mode/local surfaces remain visually available according to actual runtime capability.

### `RECOVERY_PENDING`

Meaning: an exact private-session operation is unresolved.

Presentation:

- amber pending state;
- title `SHARED JOURNEY RECOVERY PENDING`;
- do not invent a Cancel/Reset control;
- point to the existing session-operation surface only if production already exposes it.

### `FRESH_SESSION_REQUIRED`

Meaning: no valid active private-session authority exists.

Two product-copy cases exist:

1. resumable durable journey exists — emphasize `YOUR COMMITTED JOURNEY IS PRESERVED` beneath the requirement;
2. no durable recovery context — simply require an exact ACTIVE session before shared journey verification.

Presentation:

- warm-gold action-required hierarchy;
- existing Open/Join private-session action may be referenced, never duplicated as a parallel workflow;
- old/expired session must not carry green/active styling.

### `ACTIVE_RECOVERED`

Meaning: current exact authorization and durable shared journey are successfully recovered for an active season.

Presentation:

- green/gold positive state;
- title `SHARED JOURNEY RECOVERED`;
- show `SEASON n OF total`;
- supporting line: league, clubs and accepted history resumed without reset/redraw;
- no confetti or forced animation;
- state should read as trustworthy system confirmation, not a victory celebration.

### `TERMINAL_RECOVERED`

Meaning: the terminal season plan remains terminal after recovery.

Presentation:

- cream/gold archive-completion hierarchy;
- title `SHARED JOURNEY RECOVERED`;
- show `ALL n SEASONS REMAIN TERMINAL`;
- no Next Season action;
- explicitly prevent visual implication that a new private session resets completion.

## Placement

- immediately after the global header, preserving the existing production insertion point;
- inside the normal app width/safe area;
- before routed page title/content;
- not a modal;
- never overlays wheel, pack, form or transfer controls;
- does not consume the Home character safe zones because this state belongs to shared journey continuation, not the decorative landing composition.

## Visual tokens

Use the R8 dark shell and state grammar:

- shell: `#080b0e` / `#0d1216`;
- primary text: cream;
- action-required/pending: warm gold/amber;
- active recovered: restrained success green + gold, with text explanation;
- terminal: cream/gold, not success confetti;
- actual destructive/provider error only: red, outside these normal protocol phases.

State must remain understandable in grayscale.

## Mobile

At 390px:

- phase title 12px+ bold/uppercase or equivalent;
- body/status copy 13px+;
- avoid more than one inline action;
- any action becomes a full-width 44px+ target when necessary;
- identifiers do not force horizontal overflow;
- banner height grows naturally with text.

## Motion

No continuous animation.

An entering recovered state may use one short opacity/border emphasis transition if normal-motion settings permit. Reduced motion renders the state immediately.

Polling does not trigger visual pulse unless the message/phase actually changes.

## Accessibility

Preserve production semantics:

- `role="status"`;
- `aria-live="polite"`;
- no focus stealing;
- no repeated announcement when text is unchanged;
- decorative icon `aria-hidden="true"`;
- action labels describe the existing workflow destination, not generic `Fix`.

## Required final screenshots

At minimum:

1. `OFFLINE_HOLD`;
2. `RECOVERY_PENDING`;
3. `FRESH_SESSION_REQUIRED` with resumable/preserved journey copy;
4. `ACTIVE_RECOVERED` during an active multi-season journey;
5. `TERMINAL_RECOVERED`;
6. one 390px representative showing the longest action-required text if geometry materially differs.

A single final review sheet may satisfy the five desktop state rows only if every state is independently readable at approval scale.

## Acceptance

- all five actual r14 phases are represented;
- no unreachable recovery semantics invented;
- no provider/session authority shown as canonical Save authority;
- terminal state has no next-season resurrection cue;
- mobile text meets R8 readability floor;
- screenshot set added to owner approval index;
- final-main reconciliation checks whether a later runtime changed these phases/messages before owner approval.
