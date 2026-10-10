# Audit: js/productionSharedSeasonResults.js, first half (lines 1-77)

Job 1509 · Queue item 0086 · Read on factory/gameplay-v1 @ 986c7a1e1 (the file on qa/mega-audits differs; the active gameplay line was audited).

## Finding 1 · PROBABLE · line 77 · duplicate Spark reads while a first load or context change is in flight

What the player sees: nothing wrong on screen, but while the first read (or a read after a season/context change) is pending, every 15 s poll starts another full read: setup refresh, transfer refresh and a Firestore read, which spends Spark quota.

Why: the in-flight dedupe compares against `contextKey`, which is only set after a successful read (line 73), so it is still empty or stale while the read is pending:
```
function pssrRefresh(){const request=pssrRequestContext();if(!request)return Promise.resolve(null);if(refreshPromise&&contextKey===request.key)return refreshPromise;
```
Smallest change: store the in-flight request key next to `refreshPromise` (for example `refreshKey = request.key`) and compare `refreshKey===request.key` instead of `contextKey`.

## Finding 2 · PROBABLE · lines 73-74 · an error from an earlier context survives a successful refresh

What the player sees: after a rejected action (for example the "context changed" or "result changed after review" messages set at lines 129 and 131), a later successful refresh into a new season or context that is not yet RESULTS_READY and has no own result keeps showing the old message.

Why: only the success phases clear the error:
```
view={...result,setup:ctx.setup.setup,rivalryId:ctx.setup.rivalryId};contextKey=request.key;pssrRender();
if(result.ownResult||result.state?.phase==="RESULTS_READY")pssrSetError("");
```
Smallest change: when `request.key!==contextKey` (the context actually changed) before line 73 overwrites `contextKey`, call `pssrSetError("")`. Do not clear on every poll, because that would wipe a real publish failure the player still needs to read.

## Riskiest places checked (no finding)

- Line 64, `setup.setup.revision!==6`: correct. Revision is `min(phaseIndex+1,4)+confirmedRoles.length` (js/sharedShowdownSetup.js line 127), which equals 6 at SHOWDOWN_CONFIRMED.
- Line 55, `pssrQueueProvider`: serial chain with a catch, so one rejected read cannot block later reads.
- Lines 37 and 46-49: season and context key derivation falls back to `null`/an error path instead of a wrong season.

Not checked: whether the provider read result carries `managerRole` and `seasonNumber` (needed by `pssrCanRoute`, line 53). That lives in js/sparkSharedSeasonResults.js, which this job did not read.
