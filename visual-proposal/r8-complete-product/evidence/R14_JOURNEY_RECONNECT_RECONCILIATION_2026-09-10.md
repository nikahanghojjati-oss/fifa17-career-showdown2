# r14 Journey Reconnect Visual Reconciliation — 2026-09-10

Status: RECONCILED INTO R8 PROPOSAL

Production main anchor:

`97c28b1efea6ee6e901e6076a834ec419cbad5aa`

Production commit:

`SSJR r14: Journey Reconnect and coherent r14 shell (#242)`

Previous visual reconciliation anchor:

`ea96ff1280b5e63962b7ee1a6a8c0980fe4e3686` (`1.9.1-r13`)

## 1. Main delta that matters visually

The r14 release adds Shared Journey Reconnect. It does not add a new routed page. Production creates one live status element, `#sharedJourneyReconnectStatus`, beneath `#topHeader` when the current Showdown is a shared journey and a recovery state exists.

The feature recovers an already committed shared rivalry after:

- offline transitions;
- reload/re-entry;
- private-session expiry;
- exact-session replacement.

It reuses Shared Setup, Multi Season and Remote Joining authority rather than creating a parallel provider model.

## 2. Product invariants the visual proposal must preserve

Journey Reconnect is read-only.

It does not:

- mutate canonical Save Library state;
- require provider writes;
- require collection listing;
- require billing;
- create public discovery/matchmaking/community/rankings;
- resurrect a terminal rivalry;
- treat an expired or missing private session as active authority.

Durable journey state is rivalry-owned. Private session state is replaceable authorization.

## 3. Exact runtime phases

The r14 protocol exposes five phases:

1. `OFFLINE_HOLD`
2. `RECOVERY_PENDING`
3. `FRESH_SESSION_REQUIRED`
4. `ACTIVE_RECOVERED`
5. `TERMINAL_RECOVERED`

Only `ACTIVE_RECOVERED` and `TERMINAL_RECOVERED` represent active recovered authority.

`OFFLINE_HOLD` is explicitly non-authoritative while offline.

`FRESH_SESSION_REQUIRED` must not imply that the durable rivalry was lost. It means the old/expired authorization is not current authority.

## 4. Production-visible messages

### OFFLINE_HOLD

`SHARED JOURNEY HELD OFFLINE · Provider authority is not being claimed. Reconnect to verify the preserved journey before continuing.`

### RECOVERY_PENDING

`SHARED JOURNEY RECOVERY PENDING · Resolve the exact private-session operation before shared state can be authoritative again.`

### FRESH_SESSION_REQUIRED — resumable

`FRESH PRIVATE SESSION REQUIRED · The committed shared journey is preserved, but the old or expired session is not active authority. Open or join a fresh exact session for this rivalry to resume.`

### FRESH_SESSION_REQUIRED — no prior durable state

`FRESH PRIVATE SESSION REQUIRED · Establish an exact ACTIVE private session before shared journey recovery can be verified.`

### ACTIVE_RECOVERED

`SHARED JOURNEY RECOVERED · SEASON {activeSeason} OF {totalSeasons} · League, clubs and accepted history resumed without reset or redraw.`

### TERMINAL_RECOVERED

`SHARED JOURNEY RECOVERED · ALL {totalSeasons} SEASONS REMAIN TERMINAL · A new session cannot resurrect another season.`

## 5. Visual impact

This is a persistent state-note surface, not a modal and not a new route.

R8 treatment:

- located immediately below the global header, matching production ownership;
- compact enough not to push primary page actions below the fold unnecessarily;
- full-width within the app content shell, not edge-to-edge browser chrome;
- phase name and plain-language consequence separated typographically;
- state shown through text + border/icon geometry, never color alone;
- no character artwork;
- no animation behind session or recovery messaging;
- no confetti for recovered states;
- no destructive red for ordinary offline/pending/fresh-session states.

## 6. State hierarchy

### OFFLINE_HOLD

Neutral/amber hold treatment. The strongest message is `SHARED JOURNEY HELD OFFLINE`; secondary copy explains that authority is deliberately not claimed.

Do not show `ERROR` unless a separate actual runtime error exists.

### RECOVERY_PENDING

Amber pending treatment. Do not invent a generic Cancel/Reset action. The exact private-session operation remains owned by Remote Joining/provider UI.

### FRESH_SESSION_REQUIRED

Warm gold action-needed treatment. If resumable, explicitly preserve the user's confidence that the committed journey/history still exists. The visual surface may point toward the existing Open/Join Remote Joining control but must not create a new parallel join workflow.

### ACTIVE_RECOVERED

Positive green/gold confirmation. Surface shows current season and that league/clubs/accepted history resumed. It should settle into a compact status after acknowledgement/normal navigation according to senior integration decisions; it must not become a permanent celebratory billboard.

### TERMINAL_RECOVERED

Calm completion/terminal treatment. No `NEXT SEASON` affordance. Explain that a replacement session cannot resurrect a completed season plan.

## 7. Responsive requirements

At 390px:

- essential status copy >=13px;
- phase/eyebrow >=11px;
- no horizontal scrolling;
- long exact session/rivalry identifiers are omitted from the ordinary banner unless a separate diagnostic surface already owns them;
- existing page heading/actions remain reachable;
- no fixed-height clipping.

At Chromebook/reduced-wide widths, the banner remains one contained card or a two-row status strip rather than shrinking body text.

## 8. Accessibility

Production already owns `role="status"` and `aria-live="polite"`; preserve that semantic contract.

Do not move focus when the status changes.

Do not live-announce poll ticks when the user-visible message has not changed.

State icons, if used, are decorative unless they add information not already in text.

## 9. Proposal artifacts

- `surfaces/08_JOURNEY_RECONNECT_R14.md`
- `prototypes/28-journey-reconnect-r14-reference.html`
- final screenshot rows in `evidence/FINAL_SCREENSHOT_APPROVAL_INDEX.md`

## 10. Reconciliation result

r14 does not invalidate the routed R8 page architecture. It adds one substantial cross-product state surface that can appear above existing shared-rivalry pages.

Therefore the correct response is additive reconciliation, not redesigning every routed prototype from scratch.

Final-main reconciliation remains open because production development may advance beyond r14 before owner final approval.
