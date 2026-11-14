# SWEEP-JOB-1762 · Shared Showdown setup audit

Checked source audit `JOB-1762.md` against `gameplay/bug-list-1`. The audit raised **no confirmed gameplay findings**; the three reviewed areas below remain safeguarded. These are checks, not new bug claims.

| finding | file:line then -> file:line now | verdict | evidence (quoted lines) |
| --- | --- | --- | --- |
| No bug reported: repeated taps / stale setup commands | `js/sharedShowdownSetup.js:172-190` -> `js/sharedShowdownSetup.js:175-183`; provider `js/sparkSharedShowdownSetup.js:189-205` -> same | **NOT A BUG** | `if(receipt.requestHash !== requestHash) ssjFail("SETUP_IDEMPOTENCY_CONFLICT");`<br>`return freeze({ok:true, status:"replayed", acceptedRevision:receipt.acceptedRevision, state:prior});`<br>`if(request.baseRevision !== (prior ? prior.revision : 0)) ssjFail("SETUP_STALE_BASE_REVISION");` The provider still uses `runTransaction`. |
| No bug reported: league / two clubs / permitted season lengths | `js/sharedShowdownSetup.js:94-107,146-173,204-220` -> `js/sharedShowdownSetup.js:90-105,140-161,196-209` | **NOT A BUG** | `if(value.type === "commit-length" && !LENGTHS.includes(value.totalSeasons)) ssjFail("SETUP_LENGTH_INVALID");`<br>`if(clubs.playerOne === clubs.playerTwo || !catalog[leagueId] || !ROLES.every(role => catalog[leagueId].includes(clubs[role]))) ssjFail("SETUP_CLUBS_INVALID");`<br>`if(request.leagueId !== expected.leagueId) ssjFail("SETUP_DRAW_MISMATCH");` Contract still tests lengths `1,3,5,10` and rejected draws. |
| No bug reported: both managers get the same confirmed setup | `js/sharedShowdownSetup.js:47-74,125-143,203-225` -> `js/sharedShowdownSetup.js:48-73,125-137,210-220` | **NOT A BUG** | `if(!slot || ["accountId", "profileId", "saveId"].some(key => slot[key] !== actor[key])) ssjFail("SETUP_ACTOR_NOT_ENTITLED");`<br>`if(request.setupHash !== await hash(setupValue(prior), cryptoImpl)) ssjFail("SETUP_CONFIRMATION_CHANGED");`<br>`if(next.confirmedRoles.length === 2) next.phase = "SHOWDOWN_CONFIRMED";` |

`tests/contracts/shared-showdown-setup-contracts.cjs` was read as existing coverage; no tests were run (reading-only audit).

Still open: 0
