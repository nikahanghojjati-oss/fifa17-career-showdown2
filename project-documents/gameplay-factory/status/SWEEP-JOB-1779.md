# SWEEP-JOB-1779 — Older audit report gameplay sweep

Source: `project-documents/gameplay-factory/status/JOB-1779.md` (`factory/gameplay-v1`). Checked today's `gameplay/bug-list-1` code.

| Finding | File:line then → file:line now | Verdict | Evidence (quoted lines) |
| --- | --- | --- | --- |
| A private session expiring or being replaced during a failed shared Setup provider read could leave the old confirmed choices marked **ready** for another refresh. | `js/productionSharedShowdownSetup.js:190` → `js/productionSharedShowdownSetup.js:156-161,189-194` | FIXED | Line 189: `if(readReached&&!heldSessionStillActive())heldReadFailure=true;` Line 192's one-poll hold requires `!heldReadFailure`; line 194 otherwise returns `setState({status:"locked",busy:false,ready:false,...failureState(error,"SHARED_SETUP_UNAVAILABLE")});`. Lines 156-161 check session state, IDs, pending action and expiry. Thus a read that finishes after session loss locks the Setup immediately; the active-session read-blip hold remains. |

Still open: 0
