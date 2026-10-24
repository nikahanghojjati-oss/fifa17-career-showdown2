# SWEEP-JOB-1752 · Gameplay follow-up

| finding | file:line then -> file:line now | verdict | evidence (quoted lines) |
| --- | --- | --- | --- |
| A slower Create Showdown navigation could overwrite the player's later Main Menu choice after football visuals or gameplay finished loading. | `js/screens.js:487-513` -> `js/screens.js:488-516` | FIXED | `let latestNavigationRequestId = 0;` (488); `const requestId = ++latestNavigationRequestId;` (490); `if(requestId !== latestNavigationRequestId){ return false; }` (513-515). The earlier navigation cannot present a screen after a newer request. |

Still open: 0
