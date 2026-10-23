# JOB-3 — History and Legacy correctness

## Summary

Audited live `main` at `9230e33455eae93040317e7553131be34c20da9b`, release **1.9.5-r81**, on **2026-10-20**. **One new P2 finding; no substantiated new P1/P3 finding.** A transient failure in the r79 recovery scan becomes a page-lifetime decision to hide a real finished Showdown. Reopening History after connectivity returns still omits it and its points; the healthy manager sees it. Consequently, the requested unconditional correctness guarantee is **not proved**.

There was no `codex-findings/` directory on main. Before investigating, also fetched and read every findings file in open draft PRs **#958–#963** (JOB-B, JOB-A, JOB-1, JOB-2, JOB-8 and JOB-6), and inspected #957. Started with **completed-result adaptation and Legacy aggregation**, rather than JOB-6's acknowledgement races. Excluded the already-reported Firestore map-order comparison, missing browser protocols, career-screen mounting/readiness, session recovery, draft restoration, mode labels, usage growth and Rules observations. JOB-A already describes the marker-window/scan bounds; those are not presented as new findings here.

History is the Team V presentation of the **Legacy route** (`legacy`), not another independent archive. Read all eleven requested files in full and followed their analytics, scoring, index, renderer and fixture dependencies. No app code, repository tests, Rules, production accounts or deployments changed. Only this report belongs in the draft PR.

## Evidence and limits

Evidence combines the unchanged application modules, repository contracts, Auth/Firestore emulator journeys with composed production Rules, and isolated desktop/phone rendering. The new failure reproduction uses the actual saved r79 fixture, marker module, index reader, completed reader, adapter and career loader; its SDK double fails exactly one root read. It changes no saved result, witness or hash. This is deterministic recovery evidence, not a claim that the fault occurred on the owner's production devices.

The five actual finished-save captures cover **r75, r76 and r79**. There are no separate r77/r78 captures in `tests/fixtures/saved-showdowns/`; the old-format/hash compatibility checks support their shared seven-key format, not an exhaustive replay of every historical release. Firebase SDK was 12.17.0, CLI 15.28.1, Firestore emulator 1.22.0. Production Firestore field ordering remains the separately reported #957 problem even though the emulator checks pass.

## Findings

### F1 — P2: one failed r79 reveal read permanently hides the real game for that page

**Player steps**

1. Use an account whose r79-window career-start marker names the real first game that PR #936 is meant to restore. Both managers' saved indexes and completed game are intact.
2. After a reload, open History/Legacy while connectivity is recovering. Reading the marker succeeds, but the first exact root read in `careerHiddenRivalryIds` rejects with `unavailable`. The other manager has a healthy connection.
3. Restore connectivity, then leave and reopen History or another career screen in the same tab.
4. The affected manager still sees the real game omitted and its totals missing. The healthy manager sees the game and its points. A full page reload/cache reset recovers it. No game data was deleted.

**Cause / exact locations:** `js/careerStartMarker.js:61–62` reuses the reveal promise by account, immutable start time and marker hash. The root-read exception is swallowed with `break` at line 67; lines 72–74 resolve and cache an ordinary hidden-ID list, including the real game that could not be checked. The failed scan is indistinguishable from a successfully settled exclusion and is never evicted or retried. This also suppresses older qualifying games when the failed root is ahead of them in the scan.

The caller accepts this as a successful scope (`js/rivalryLegacyV10.js:226–229`) and passes it into the loader (`262–263`). The loader removes those IDs **before** reading any Showdown (`js/sparkClosedShowdownCareerLoader.js:62–65`). The resulting model can therefore be **empty/ready with no partial-coverage warning**, rather than unavailable. Later career loads call the same memoized reveal function. `readMarker`'s failed-read recovery (`js/careerStartMarker.js:123–135`) cannot repair this case: the marker read succeeded, and the separate reveal function swallowed the failure. `clearClosedShowdownCache` does not clear the marker module's `reveals` map; only its `clearCache`/a new page resets it (`207`).

This is separate from JOB-B B4: no marker epoch changes, no `none → ready` transition, and no competing screen mount are required. It also reproduces with all reader dependencies loaded and result maps left in their original order, independently of #957/JOB-A.

**Reproduction result:** on `r79-1season-win.json`, the actual career pipeline produced:

| Observation | Model | Completed Showdowns | Daniel / Nik points | History rows |
| --- | --- | ---: | --- | ---: |
| Daniel's first reveal read fails once | empty | 0 | 0 / 0 | 0 |
| Daniel reloads the career model after network recovery | empty | 0 | 0 / 0 | 0 |
| Nik loads the same game normally | ready | 1 | 5 / 1 | 1 |
| Daniel loads after marker-cache reset | ready | 1 | 5 / 1 | 1 |

The second Daniel load performs **no replacement reveal root read**. The first two loads plus Nik's healthy load make exactly three root gets: the failed scan, Nik's scan and Nik's completed reader. Both account indexes name the same game throughout.

**Suggested fix:** retain fail-closed filtering while authority is uncertain, but distinguish an interrupted scan from a successfully resolved exclusion. Do not retain a transiently failed scan as a successful page-lifetime result. Evict/retry it with bounded backoff or on the next explicit career visit, and expose unavailable/partial scope until it resolves. Reuse successful verified scans and preserve the r79 eligibility bounds, private exact gets, test exclusions and unchanged stored data. Do not reveal an unchecked root to fix the omission.

## Requested paths checked without another new finding

| Requirement | Result and practical limit |
| --- | --- |
| Every real finished Showdown once, both managers | Adapter/analytics deduplication, witness verification, index traversal and identical two-role models pass. The actual first-real-game browser journey lists both intended games on both phones and after reload. **F1 and the excluded existing reader/loading defects prevent an unconditional production guarantee.** |
| Test games hidden | No-marker accounts use `testRunsOnly`; hidden IDs are removed before reads. Real/test contracts and first-game recovery contracts pass. The explicit historical r79 exception is preserved: the code documents the owner's decision to reveal qualifying finished games because the old data cannot distinguish the accidental real game from a deliberate r79 test (`js/careerStartMarker.js:51–55`). This is not evidence that arbitrary test games count. |
| END SHOWDOWN | Completed-reader emulator checks include Nik ending early after one season: one root-only abandoned result, one status row, null score/winner, no seasons/trophies/points/completed wins counted. Older unmarked closes retain unknown season count. Desktop and phone renderer probes show exactly one Ended early card with date/2 seasons in a mixed archive and disable season disclosure for it. |
| Old saves with no `europaLeague` | All five real saved fixtures open through each manager's actual index → reader → loader under composed Rules: r75/r76 wins remain 6–5; r75/r76 draws remain 8–8; r79 win remains 5–1. The stranger is denied. Old-format compatibility passes 32 checks over 17 old Showdowns, including unchanged hashes/seven-key normalization. No extra `europaLeague:false` key is required. |
| Europa League +3 and attribution | Scoring parity passes 192 cases across six scorers; simultaneous CL+EL for one manager is refused. Mixed r79/r80 three-season continuation closes/reopens at 9–15 with Daniel's EL counted once, all seven old season-1 documents unchanged. Career counters, History's per-manager EL label and 1/3/5/10 season drawers pass. Existing performance/awards bonuses remain unchanged. |
| 1, 3, 5 and 10 seasons | Independent hand-calculated score/trophy expectations below pass through actual projection, terminal-witness verification, closed adapter, analytics and Legacy frame conversion for both reader roles. Identical duplicate completed entries count once. This additional matrix is model/adapter evidence, not four new full UI/provider playthroughs. |
| Draws | A 3–3 season with positions 1 versus 2 names Daniel the season winner while the one-season Showdown is a draw. The ten-season 60–60 case and actual saved 8–8 fixtures remain Showdown draws; no league-position or season-win tiebreak changes a tied total. History renders Draw. |
| Same totals on both managers | Healthy closed-reader projections/finals and the additional complete career models are identical across roles. The History Convergence browser audit agrees across desktop/mobile manager contexts. F1 is the reproduced exception caused by account-local filtering, not a scoring disagreement. |

The additional length matrix alternates these legal, bonus-free seasons: Daniel CL+cup = 6 versus Nik league+EL+cup = 7; then Daniel league+EL = 6 versus Nik CL = 5. League points/goals are below 100 and neither individual award is selected. No manager wins CL and EL together.

| Seasons | Daniel / Nik points | Daniel / Nik trophies | Daniel / Nik EL wins | Showdown result |
| ---: | --- | --- | --- | --- |
| 1 | 6 / 7 | 2 / 3 | 0 / 1 | Nik |
| 3 | 18 / 19 | 6 / 7 | 1 / 2 | Nik |
| 5 | 30 / 31 | 10 / 11 | 2 / 3 | Nik |
| 10 | 60 / 60 | 20 / 20 | 5 / 5 | Draw |

A combined archive of those four games plus one ended-early entry has **4 completed Showdowns, 19 counted seasons, points 114–117 and trophies 38–41**. Actual desktop paging and phone arrows reach every card once; the season drawers show 1/3/5/10 rows and the correct EL labels. The abandoned row contributes zero to every total.

## Validation record

- PASS: `tests/browser/r80-first-real-game-history-audit.cjs` — 11 checks, two manager browser contexts, Auth/Firestore emulators, composed production Rules; real START/checkmark/join, recovered first game, unused-code exclusion, both career views before/after reload, no production Firebase requests or page errors.
- PASS: `tests/browser/shared-history-convergence-audit.cjs` — matching desktop/mobile manager records/totals/trophies, stale-authority and denial checks, canonical storage unchanged.
- PASS: `tests/firebase/saved-showdowns-still-open-emulator.cjs` — 5 actual old-save fixtures, 42 checks, both managers and stranger denial.
- PASS: `tests/firebase/completed-showdown-read-emulator.cjs` — 64 checks, including root-only ended-early handling, matching manager reads, missing-season rejection, no backfill and never-joined-code exclusion.
- PASS: `tests/firebase/r79-showdown-continues-emulator.cjs` — 11 checks, mixed old/new results, EL +3, terminal totals and byte-preserved old documents. The three provider suites ran sequentially on a separate emulator instance from the first-real-game browser journey.
- PASS: contracts `completed-showdown-read`, `closed-showdown-adapter` (25), `shared-career-analytics` (18), `v10-rivalry-legacy` (17), `shared-history-convergence`, `shared-history-convergence-production`, `europa-league-compat` (32), `europa-league-scoring-parity` (13 / 192 cases), `r80-europa-career-pages` (7), `r80-first-real-game-history` (20), `r80-real-vs-test` (10), and `completed-showdown-wins`.
- PASS: unchanged-module F1 recovery probe, hand-calculated length/draw/deduplication matrix, and actual Legacy desktop/phone renderer probes. The temporary renderer harness initially omitted the seam dependency and then used a case-sensitive Draw assertion; both harness errors were corrected without changing app code or product expectations.
- POS20 route: **`POS20_DOC_ONLY`**, zero selected product contracts, required `V10_FLASH_BROWSER`. `CMS_CHROMIUM_MULTI_CONTEXT=1 npm run test:v10-flash` **PASS**, portrait/landscape/desktop, double taps, reduced motion and additional Club preference checks. Its tap-feedback observations are report-only and outside this audit.

All scratch scripts/logs remain under `work/job3/`; generated browser/emulator artifacts are excluded from the PR. No production account inspection, physical-device acceptance, fresh deployed-Rules readback or exhaustive production archive census is claimed.

## Reproducing F1 without changing the app

From repository root, save the following in a scratch `.cjs` file and run with Node and the repository's installed Firebase dependency. It uses the actual captured r79 game and original property ordering. The marker is a synthetic, valid-window fixture naming that game; only the first scan read is faulted.

```js
const fs = require('node:fs'), assert = require('node:assert/strict');
const root = process.cwd();
global.window = globalThis;
require(root + '/data/transferOptions.js');
const {Timestamp} = require('firebase/firestore');
const Marker = require(root + '/js/careerStartMarker.js');
const Loader = require(root + '/js/sparkClosedShowdownCareerLoader.js');
function decode(v) {
  for (const k of ['nullValue','stringValue','booleanValue','doubleValue'])
    if (k in v) return k === 'nullValue' ? null : v[k];
  if ('integerValue' in v) return Number(v.integerValue);
  if ('timestampValue' in v) {
    const m = /^(.*?)(?:\.(\d+))?Z$/.exec(v.timestampValue);
    return new Timestamp(Date.parse(m[1]+'Z')/1000,
      Number((m[2] || '').padEnd(9, '0')));
  }
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(decode);
  if ('mapValue' in v) return Object.fromEntries(
    Object.entries(v.mapValue.fields || {}).map(([k,x]) => [k,decode(x)]));
  throw Error('Unknown fixture value');
}
const f = JSON.parse(fs.readFileSync(
  'tests/fixtures/saved-showdowns/r79-1season-win.json'));
const docs = Object.fromEntries(f.documents.map(d =>
  [d.path,decode({mapValue:{fields:d.fields}})]));
const rid = f.rivalryId, rootPath = 'rivalries/' + rid;
const slots = docs[rootPath].data.managerSlots;
const d = slots.find(x => x.slotId === 'playerOne').accountId;
const n = slots.find(x => x.slotId === 'playerTwo').accountId;
const marker = {status:'ready',active:true,hiddenRivalryIds:[rid],
  startedAt:Date.UTC(2026,9,19,6),contentHash:'fixture-marker'};
let fail = true, rootReads = 0;
const sdk = {doc:(_db,...p) => p.join('/'),getDoc:async p => {
  if (p === rootPath) {
    rootReads++;
    if (fail) { fail=false; throw Object.assign(Error('offline'),{code:'unavailable'}); }
  }
  return {exists:() => Object.hasOwn(docs,p),data:() => docs[p]};
}};
async function load(uid) {
  const hiddenRivalryIds = await Marker.careerHiddenRivalryIds({
    marker,firestore:{},firebaseSdk:sdk,accountId:uid});
  return (await Loader.loadClosedShowdownCareer({firestore:{},firebaseSdk:sdk,
    user:{uid},hiddenRivalryIds})).model;
}
(async () => {
  Marker.clearCache(); Loader.clearClosedShowdownCache();
  assert.equal((await load(d)).managers.daniel.showdowns.completed,0);
  assert.equal((await load(d)).managers.daniel.showdowns.completed,0);
  assert.equal(rootReads,1,'recovery did not reread the failed root');
  assert.equal((await load(n)).managers.daniel.showdowns.completed,1);
  Marker.clearCache();
  assert.equal((await load(d)).managers.daniel.showdowns.completed,1);
  console.log('Reproduced: one failed reveal hides the real game until cache reset');
})().catch(e => { console.error(e); process.exitCode=1; });
```

Suggested regression: fail exactly one root get during a qualifying marker scan, restore normal reads, and revisit through the actual career binder. Require eventual identical complete careers for both managers, while older test games remain hidden and canonical storage remains byte-for-byte unchanged. The existing healthy/repeated-scan contracts and first-game browser journey do not exercise this failed-then-recovered scan.
