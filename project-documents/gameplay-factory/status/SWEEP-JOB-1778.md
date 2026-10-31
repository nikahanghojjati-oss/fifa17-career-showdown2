# SWEEP-JOB-1778 — Older audit report gameplay sweep

Source: `project-documents/gameplay-factory/status/JOB-1778.md` (`factory/gameplay-v1`). Checked today's `gameplay/bug-list-1` code.

| Finding | File:line then → file:line now | Verdict | Evidence (quoted lines) |
| --- | --- | --- | --- |
| After the shared Showdown closes, the old Final Reconciliation panel could still display **CLOSE THE SHOWDOWN WHEN READY**, and refresh could revive it. | `js/productionSharedFinalReconciliation.js:45,69-77` → `js/productionSharedFinalReconciliation.js:16,46,65,71,94-95` | FIXED | Line 46 prevents displaying a cached pre-close panel: `...&&pfrLocalAuthorityMatches(request,localState)&&!pfrTerminalClosed()?view:null;` Line 65 blocks publishing an in-flight result when closed: `...||pfrTerminalClosed())return pfrDiscard(request,generation);` Line 94 clears it on the close event: `if((event?.type==="career-mode-shared-terminal-close-state-change"&&event.detail?.phase==="CLOSED")||pfrTerminalClosed())return pfrClearView({bump:true});` Line 95 registers the close event. |

Still open: 0
