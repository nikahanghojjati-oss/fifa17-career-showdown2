# JOB-04 · Renderer seams: screens take a model, never the local path

| Lane | Depends on | Steps | Code branch | PR into | Codex review |
| --- | --- | --- | --- | --- | --- |
| **work** (Sol Work mode: terminal, node 24) | JOB-03 merged into `gameplay/recovery-v1` | 7 | `gameplay/job-04-renderer-seams` | `gameplay/recovery-v1` | no |

## 1. Goal

Change the History (Legacy), Career Statistics, Trophy Room and Rivalry Statistics screens so they draw from a career model that is handed to them, and so the online app can never fall back to the old browser-local data. Today these four screens read old local saves on their own (`buildCareerAnalytics()`, `loadLegacyShowdowns()`, `currentShowdown`), which is why they were hidden online in r43; after this job a signed-in Daniel or Nik sees either the real shared numbers or an honest "unavailable" message, never stale local numbers and never "empty" when a read failed. The screens stay hidden online in this job (removing the r43 hiding is job 13).

## 2. Branches and files

- Code branch `gameplay/job-04-renderer-seams` already exists (the lead cut it from `gameplay/recovery-v1`). Save code there. Open a PR into `gameplay/recovery-v1` titled `Job 4: renderer seams`.
- First check that job 3 is merged: `js/sharedCareerAnalytics.js` must exist on `gameplay/recovery-v1`. If it does not, reply "Job 4 waits for job 3." and stop.
- Work mode cannot push with git (job 90). Save files with the GitHub connector and use the CI path in WORKER_HANDBOOK.md §7: read the "Validate Gameplay Fast" result on your exact head commit.
- Create:
  - `js/careerScreenSeam.js` (the pure seam, section 4)
  - `tests/support/fake-dom.cjs` (given in full in section 6; copy it exactly)
  - `tests/contracts/career-screen-seam-contracts.cjs`
- Edit (only the lines named in section 4.3):
  - `js/statistics.js`, `js/trophyRoom.js`, `js/legacy.js`
  - `service-worker.js`: one added line (section 4.3)
  - `POS20_SUPPLEMENTAL_PRODUCT_TESTS.json`: append one entry (step 6)
  - `tests/operations/pos20-control-plane.test.mjs`: two narrow edits (step 6). The lead allows exactly these.
- Status: `project-documents/gameplay-factory/status/JOB-04.md` on `factory/gameplay-v1`.
- Change nothing else. In particular **do not touch** `js/onlinePlayerIdentity.js` (the r43 containment at line 24 stays; removing it is job 13), `js/analytics.js`, `js/screens.js`, `js/optionalModules.js`, `index.html`, `js/app.js`, any `css/` file or any Rules file.

Read first (all on `gameplay/recovery-v1`):

1. Data contract `project-documents/leads/DATA_CONTRACT_V1.md` on branch `leads/relay`, sections 0, 5, 6, 7, 8. Field names there are binding.
2. `js/sharedCareerAnalytics.js` (job 3): `buildCareerModel` output shape. This is the `model` the screens now take.
3. `js/statistics.js`: `renderCareerStatistics` 313-364 (local call `buildCareerAnalytics()` at 324, empty text 341-346), `renderRivalryStatistics` 487-536 (local `currentShowdown` at 496 and 505), `openCareerStatistics` 538-542, `openRivalryStatistics` 544-549, `createComparisonRow` 150 (left value = Daniel, right = Nik).
4. `js/trophyRoom.js`: `renderTrophyRoom` 195-252 (local call at 204, empty text 238-242), `openTrophyRoom` 254-258.
5. `js/legacy.js`: `renderLegacy` 473-530. Line 474 `archiveCompletedSaveBeforeLegacy()` writes local storage; 487 reads `loadLegacyShowdowns()`; 524 adds delete/backup/reset controls; 526-528 mounts the import panel. None of these may run online.
6. How the screens are reached: `js/screens.js:381-386` calls `window.renderCareerStatistics()` and `window.renderLegacy()` with **no argument** every time those screens are shown; `js/optionalModules.js:491-507` opens them; `js/optionalModules.js:319-372` lazy-loads the scripts. You may not edit these two files (see the trap in section 3).
7. How "online" is known: `js/showdown.js:4,6` loads `js/onlinePlayerIdentity.js` at every start; its state (`onlinePlayerIdentity.js:7`) carries `registered` and `managerId`, read through `window.CareerModeOnlinePlayerIdentity.getState()` (export at line 59). Containment: `onlinePlayerIdentity.js:24`.
8. `js/restoreUI.js:253`: the restore panel mounts only into `#legacy .legacyDataControls`. If the online branch never creates that element, the panel cannot appear.

## 3. Rules that apply (do not change)

- Never push to `main`, never merge, never force-push, never delete anything. Never deploy.
- Two managers only: `daniel` = `playerOne` = LEFT column, `nik` = `playerTwo` = right. Never key by account, profile or save id.
- Scoring is never recomputed here. The seam only displays numbers from the model.
- No rival private inputs: the seam shows only fields that exist in the career model (no guesses, signings or unpublished season inputs exist there).
- Empty text appears only when the model's `status === "empty"`. A failed or missing read is `unavailable`, never empty and never 0.
- Abandoned Showdowns are status-only rows: no totals, no winner.
- `js/careerScreenSeam.js` must never read `localStorage`, `sessionStorage`, `indexedDB`, `window`, `document` (it receives a `doc` argument instead), `currentShowdown`, `Date.now` or `Math.random`.
- Do not weaken, skip or delete an existing test. The only existing test you edit is `tests/operations/pos20-control-plane.test.mjs`, exactly as step 6 says.

> **Trap (checked by the lead): the startup budget has 7 bytes left.** `tests/contracts/static-app-release-contracts.cjs:28` and `tests/contracts/final-polish-presentation.cjs:51-57` cap the scripts named in `index.html` at 37500 gzip bytes; today they are at 37493. Any edit to `index.html`, `js/storage.js`, `js/showdown.js`, `js/scoring.js`, `js/screens.js`, `js/menuExperience.js`, `js/optionalModules.js`, `js/app.js` or `css/app.css` fails both tests. That is why the seam is loaded by the renderers themselves (section 4.3), not by `optionalModules.js`.

> **Trap 2: unique names.** `tests/contracts/static-app-release-contracts.cjs:30` joins every `js/*.js` file into one script and fails if any `function name(` appears in two files, if two files declare the same top-level `let`/`const`, or if any file other than `storage.js`/`diagnostics.js` contains the word `localStorage` (so do not even write it in a comment in `js/`). Prefix every helper in the seam with `cs` (for example `csFreeze`). `tests/contracts/statistics-architecture.cjs:63-64` fails if a new file name in `js/` contains "analytics": the name `careerScreenSeam.js` is safe. The same contract (lines 39 and 48) requires the literal text `buildCareerAnalytics()` in `statistics.js` and `createCareerStandingsTable(analytics.managers)` in `trophyRoom.js`: keep the local branches intact.

## 4. What to build

### 4.1 The seam API (`js/careerScreenSeam.js`)

Copy the module wrapper from `js/sharedHistoryConvergence.js:1-5`, but with no dependency: browser global `window.CareerModeCareerScreenSeam`, Node `module.exports`. Export a deeply frozen object:

```js
{ contractVersion: 1, SCREENS, STATUSES, TEXT,
  normalizeRenderRequest, isOnlineCareerRoute, selectCareerScreenSource,
  careerScreenView, paintCareerScreenView }
```

- `SCREENS` = `["careerStatistics","trophyRoom","legacy","rivalryStatistics"]`; `STATUSES` = `["loading","empty","unavailable","partial","ready"]`.
- `TEXT` (exact strings; the four `empty` strings are copied from the current screens and a test compares them to the source):
  - `loading`: `Loading career history.`
  - `unavailable`: `Career history is unavailable right now. Nothing is lost. Try again when you are reconnected.`
  - `partial`: `Showing {readable} of {indexed} Showdowns. Some Showdowns could not be read, so these are not complete career totals.`
  - `empty.careerStatistics` = `statistics.js:344` text; `empty.trophyRoom` = `trophyRoom.js:240`; `empty.legacy` = `legacy.js:513`; `empty.rivalryStatistics` = `statistics.js:439`.
  - `historyStatus`: `completed` "Completed", `in-progress` "In progress", `completion-pending` "Final result, completion pending", `abandoned` "Abandoned", `unavailable` "Unavailable". `winner`: `daniel` "Daniel won", `nik` "Nik won", `draw` "Draw".
- `normalizeRenderRequest(arg)` returns frozen `{ force, hasModel, model }`. `undefined`, `null`, `false` → `{false,false,null}`; `true` → `{true,false,null}` (old `force` calls keep working); a plain object → `force: arg.force === true`, `hasModel: "model" in arg` (own property), `model: arg.model ?? null`. Anything else (number, string, array) throws `TypeError("CAREER_SCREEN_REQUEST_INVALID")`.
- `isOnlineCareerRoute(identityState)` is `true` only when `identityState.registered === true` **and** `identityState.managerId` is `"daniel"` or `"nik"`. Status is deliberately ignored, so a signed-in player who goes offline stays on the online route. A signed-out or not yet registered browser is the local route (this keeps the main-only local browser audits, such as `tests/browser/identity-safe-career-analytics-audit.cjs`, working).
- `selectCareerScreenSource({ identityState, model })`: model given and its `status` is one of `STATUSES` → `"model"`; model given but malformed → `"unavailable"` (never local); no model and online → `"unavailable"`; no model and not online → `"local"`.
- `careerScreenView(screen, model)` returns a deeply frozen `{ screen, status, message, interimLabel, sections }`. Unknown `screen` throws `TypeError("CAREER_SCREEN_UNKNOWN")`. Malformed or `null` model → `status: "unavailable"`. Rules:
  - `loading` → `message = TEXT.loading`, `sections = []`; `unavailable` → `TEXT.unavailable`, `[]`; `empty` → `TEXT.empty[screen]`, `[]`.
  - `partial` → `message` = `TEXT.partial` with `{readable}` and `{indexed}` from `model.coverage`; sections built. `ready` → `message = null`; sections built.
  - `interimLabel` = `model.interimLabel` when it is a string, else `null`; always `null` when the view is `unavailable`.
  - `rivalryStatistics` takes a career model built from the current Showdown only (job 5 builds it with `buildCareerModel` and one Showdown). If a `partial`/`ready` model does not have exactly one entry in `history.showdowns`, the view is `unavailable`.
  - A section is `{ heading, rows }`. A row is either a comparison `{ label, daniel, nik }` or a single `{ label, value }`. Every number is shown as text: `null` → `"-"`, integer → `String(n)`, other → `n.toFixed(1)`.
  - `careerStatistics`: section `CAREER TABLE` with comparison rows Career points, Seasons played, Season wins, Season draws, Season losses (from `managers.*`), Showdowns completed, Showdown wins, Showdown draws, Showdown losses (from `managers.*.showdowns`), then single row `Biggest Showdown win` = `"Daniel by 8"` / `"Nik by 3"` / `"-"`. Section `SEASON RECORDS`: Best season score, Best league points, Best league goals, Best league position, Average season score, Average league points, Average league goals, Perfect seasons, 100-point seasons, 100-goal seasons, Top scorer seasons, Top assist seasons, Performance bonuses, Awards bonuses.
  - `trophyRoom`: `MANAGER CABINETS` comparison rows Champions Leagues, League titles, Domestic cups, Total trophies (from `trophyRoom.cabinet`); `CAREER TABLE` single rows from `trophyRoom.standings` in order, label `"1. Daniel"` (add `" (level)"` when `level`), value `"8 points, 1 season wins"`; `ALL-TIME RECORDS` single rows from `trophyRoom.records`, label = record label, value `"Daniel · 8"` / `"Nik · 8"` / `"Shared · 8"`, or `"-"` when `value` is null.
  - `legacy`: one section `SHOWDOWNS`, one single row per `history.showdowns` entry: label `"SHOWDOWN 1"`, value = status text, then `" · Daniel 8 - Nik 0"` when totals exist, then `" · Daniel won"` when a winner exists. For `abandoned` and `unavailable` rows the value is the status text only, even if a forged model carries totals or a winner.
  - `rivalryStatistics`: `HEAD TO HEAD` comparison rows Showdown points (from `history.showdowns[0].totals`), Season wins, Season draws, Season losses, Champions Leagues, League titles, Domestic cups, Total trophies, Perfect seasons, Best season score; `SEASONS` one comparison row per season, label `"Season 1"`, values the season scores.
- `paintCareerScreenView(doc, view)` returns a `DocumentFragment` made only with `doc.createDocumentFragment`, `doc.createElement`, `className`, `textContent`, `setAttribute`, `append`/`appendChild`: one `div.careerScreenView` with attributes `data-career-screen` and `data-career-status`; then `p.careerScreenInterim` if `interimLabel`; then `div.analyticsEmpty` with `role="status"` if `message`; then per section an `h3.analyticsSectionHeading` and a `div.careerScreenSection` holding, for comparison sections, a header `div.comparisonRow.careerScreenNames` (`strong` "DANIEL", empty `span`, `strong` "NIK") and one `div.comparisonRow` per row (`strong` daniel, `span` label, `strong` nik), and for single rows `div.careerScreenRow` (`span` label, `strong` value).

### 4.2 Why the renderers load the seam themselves

The renderer scripts are loaded lazily and `optionalModules.js` cannot be edited (trap). Each renderer asks for the seam; if it is not loaded yet, it starts the load and draws again when it arrives. It never draws local data while waiting.

### 4.3 The renderer edits (exact)

`js/statistics.js`, after line 8 add `let careerStatisticsModel = null;`, `let rivalryStatisticsModel = null;` and these two helpers (copy exactly):

```js
function readCareerScreenSeam(rerender){
    const seam = window.CareerModeCareerScreenSeam;
    if(seam){ return seam; }
    if(typeof window.loadRuntimeScript === "function"){
        window.loadRuntimeScript("career-screen-seam", "js/careerScreenSeam.js", () => Boolean(window.CareerModeCareerScreenSeam))
            .then(rerender)
            .catch(error => { if(typeof window.reportApplicationError === "function"){ window.reportApplicationError("Career screens could not load", error); } });
    }
    return null;
}

function readCareerIdentityState(){
    const identity = window.CareerModeOnlinePlayerIdentity;
    return identity && typeof identity.getState === "function" ? identity.getState() : null;
}
```

Then change `renderCareerStatistics(force = false)` to `renderCareerStatistics(request = false)` and insert right after its `if(!content){ return; }`:

```js
    const seam = readCareerScreenSeam(() => renderCareerStatistics(request));
    if(!seam){ return; }
    const normalized = seam.normalizeRenderRequest(request);
    if(normalized.hasModel){ careerStatisticsModel = normalized.model; }
    const force = normalized.force;
    const source = seam.selectCareerScreenSource({ identityState: readCareerIdentityState(), model: careerStatisticsModel });
    if(source !== "local"){
        content.replaceChildren(seam.paintCareerScreenView(document, seam.careerScreenView("careerStatistics", source === "model" ? careerStatisticsModel : null)));
        careerStatisticsRenderKey = null;
        return;
    }
```

The rest of the function (the local branch) stays exactly as it is. A remembered model is used again by the zero-argument call at `screens.js:382`; `{ model: null }` forgets it.

- Same pattern for `renderRivalryStatistics` (screen `"rivalryStatistics"`, variable `rivalryStatisticsModel`, key `rivalryStatisticsRenderKey`), inserted before the `if(!currentShowdown)` block at line 496.
- `openCareerStatistics(request = false)` passes `request` to `renderCareerStatistics(request)`. `openRivalryStatistics(request = false)`: keep `if(!currentShowdown){ return; }` only when the request does not carry a model (`const suppliesModel = Boolean(request && typeof request === "object" && request.model);`), then pass `request` on.
- `js/trophyRoom.js`: add `let trophyRoomModel = null;` above `renderTrophyRoom`, same pattern (screen `"trophyRoom"`, key `trophyRoomRenderKey`), reusing `readCareerScreenSeam` and `readCareerIdentityState` from `statistics.js` (always loaded first, `optionalModules.js:345-355`). `openTrophyRoom(request = false)` forwards `request`.
- `js/legacy.js`: add `let legacyModel = null;` and a helper `readLegacyScreenSeam(rerender)` with the same body as `readCareerScreenSeam` (a new name, because `legacy.js` is loaded without `statistics.js`). In `renderLegacy(request = false)` the seam block comes **first**, before `archiveCompletedSaveBeforeLegacy()`; it finds the container `document.querySelector("#legacy .legacyBox")`, reads the identity inline (same two lines as `readCareerIdentityState`), paints into the container, sets `lastLegacyRenderedRevision = null` and returns. The local branch (lines 474-529) stays unchanged after it.
- `service-worker.js`: add the line `    "js/careerScreenSeam.js",` directly after `    "js/analytics.js",` (line 40) so the file is cached for offline use. Do not change the runtime revision; the lead bumps it at the gated PR into `main`.

## 5. Steps

After each step update `status/JOB-04.md` and save it to `factory/gameplay-v1` with `Job 4 step k/7: <step name>`. Save code to `gameplay/job-04-renderer-seams` as you go.

1. **Baseline.** Clone, check out `gameplay/recovery-v1`, `npm ci`, `npm run test:contracts` and `npm run test:ops`. Record the last lines (`… 97/97 …` and `# pass 73`). Confirm `js/sharedCareerAnalytics.js` exists.
2. **Fake DOM.** Create `tests/support/fake-dom.cjs` exactly as in section 6. Run `node -e "const {createFakeDocument}=require('./tests/support/fake-dom.cjs');const d=createFakeDocument();const b=d.register('x');b.append(d.createElement('p'));b.children[0].textContent='ok';console.log(b.textContent,b.childElementCount)"`; it must print `ok 1`.
3. **Failing tests first.** Write `tests/contracts/career-screen-seam-contracts.cjs` with every case in section 7. Create `js/careerScreenSeam.js` with only the wrapper and functions that throw `"not implemented"`. Run the test; it must fail. Save both ("tests first").
4. **Seam.** Implement section 4.1 until cases 1-10 and 17 pass.
5. **Renderers.** Make the edits in section 4.3 until cases 11-16 pass. Run `npm run test:contracts`; it must still say `97/97` (your new test is not registered yet).
6. **Register.** Append to the `tests` array of `POS20_SUPPLEMENTAL_PRODUCT_TESTS.json` (keep the file's formatting):
   ```json
   {
     "path": "tests/contracts/career-screen-seam-contracts.cjs",
     "patterns": [
       "^js/careerScreenSeam\\.js$",
       "^js/statistics\\.js$",
       "^js/trophyRoom\\.js$",
       "^js/legacy\\.js$",
       "^js/sharedCareerAnalytics\\.js$",
       "^tests/support/fake-dom\\.cjs$",
       "^tests/contracts/career-screen-seam-contracts\\.cjs$",
       "^POS20_SUPPLEMENTAL_PRODUCT_TESTS\\.json$"
     ]
   }
   ```
   Then in `tests/operations/pos20-control-plane.test.mjs` (lead-approved, nothing else): after line 66 (`const sharedCareerAnalyticsContract=…`) add `const careerScreenSeamContract='tests/contracts/career-screen-seam-contracts.cjs';`, and at the end of the `expectedSupplementalContracts` array on line 70 add `,careerScreenSeamContract` as the last element (if job 6 merged first and the array already ends with `startJoinViewModelContract`, add yours after it). Run `npm run test:contracts` (now `98/98`, or `99/99` if job 6 is already in) and `npm run test:ops` (`# pass 73`, `# fail 0`). Save. Wait for "Validate Gameplay Fast" green on your exact head. Open the PR.
7. **Finish.** Fill the Done checklist, set State: DONE with branch, head SHA, PR link and CI run link, save `Job 4 done: Renderer seams`.

## 6. `tests/support/fake-dom.cjs` (copy exactly)

```js
"use strict";
// Minimal DOM for node contract tests of the career screen renderers. No browser needed.
class FakeNode{
  constructor(tag,isFragment=false){this.tagName=String(tag).toUpperCase();this.isFragment=isFragment;this.children=[];this.attributes={};this.dataset={};this.style={};this.className="";this.id="";this.hidden=false;this.ownText="";this.parent=null;
    const self=this;this.classList={add:(...c)=>{const s=new Set(self.className.split(/\s+/).filter(Boolean));c.forEach(x=>s.add(x));self.className=[...s].join(" ");},remove:(...c)=>{self.className=self.className.split(/\s+/).filter(x=>x&&!c.includes(x)).join(" ");},contains:c=>self.className.split(/\s+/).includes(c),toggle:(c,force)=>{const on=force===undefined?!self.classList.contains(c):Boolean(force);on?self.classList.add(c):self.classList.remove(c);return on;}};}
  get textContent(){return this.ownText+this.children.map(c=>c.textContent).join("");}
  set textContent(v){this.ownText=v==null?"":String(v);this.children=[];}
  get childElementCount(){return this.children.length;}
  get firstChild(){return this.children[0]||null;}
  setAttribute(k,v){this.attributes[k]=String(v);}
  getAttribute(k){return Object.prototype.hasOwnProperty.call(this.attributes,k)?this.attributes[k]:null;}
  addEventListener(){} removeEventListener(){}
  appendChild(n){if(n.isFragment){const moved=n.children.splice(0);moved.forEach(c=>{c.parent=this;this.children.push(c);});return n;}if(n.parent)n.parent.children=n.parent.children.filter(c=>c!==n);n.parent=this;this.children.push(n);return n;}
  append(...nodes){nodes.forEach(n=>this.appendChild(typeof n==="string"?Object.assign(new FakeNode("#text"),{ownText:n}):n));}
  insertBefore(n){return this.appendChild(n);}
  replaceChildren(...nodes){this.children=[];this.ownText="";this.append(...nodes);}
  remove(){if(this.parent)this.parent.children=this.parent.children.filter(c=>c!==this);this.parent=null;}
  all(){return this.children.flatMap(c=>[c,...c.all()]);}
  findByClass(name){return this.all().filter(n=>n.className.split(/\s+/).includes(name));}
}
function createFakeDocument(){
  const byId=new Map(),bySelector=new Map();
  const doc={
    createElement:tag=>new FakeNode(tag),
    createDocumentFragment:()=>new FakeNode("#fragment",true),
    getElementById:id=>byId.get(id)||null,
    querySelector:sel=>bySelector.get(sel)||null,
    querySelectorAll:()=>[],
    addEventListener(){},
    register(id,node=new FakeNode("div")){node.id=id;byId.set(id,node);return node;},
    registerSelector(sel,node=new FakeNode("div")){bySelector.set(sel,node);return node;}
  };
  return doc;
}
module.exports={FakeNode,createFakeDocument};
```

**Renderer harness for cases 11-16.** Build a `vm` context whose `window` is the context itself, with: `document` from `createFakeDocument()` with `careerStatisticsContent`, `trophyRoomContent`, `rivalryStatisticsContent`, `careerStatisticsRivalryButton` registered and the selectors `#legacy .legacyBox` and `main` registered; `currentShowdown: null`; spies `buildCareerAnalytics` (returns `{totals:{showdowns:0,seasons:0,points:0,trophies:0},managers:[],identity:{unresolvedRoleCount:0},records:{}}`), `buildRivalryAnalytics`, `loadLegacyShowdowns` (returns `[]`), `loadSavedShowdown` (returns `null`), each counting calls; `getCareerAnalyticsRevisionKey`, `getLegacyStorageRevision`, `showScreen` stubs; `CareerModeOnlinePlayerIdentity: { getState: () => identityState }`; and `CareerModeCareerScreenSeam` set to the required seam (except in case 15). Run `js/statistics.js`, `js/trophyRoom.js`, `js/legacy.js` in that order with `vm.runInContext`. Build models with `tests/support/career-fixture-helpers.cjs` and `buildCareerModel` from job 3. Online identity = `{ status: "ready", registered: true, managerId: "nik" }`.

## 7. Test cases (write all of them in step 3)

One block each, with a clear message; end with `console.log("PASS Career screen seam contracts (17/17 cases): …")`.

1. **Request normalising.** `undefined`, `false`, `true`, `{force:true}`, `{model:m}`, `{model:null}` give the exact objects in 4.1; `3`, `"x"`, `[]` throw `CAREER_SCREEN_REQUEST_INVALID`.
2. **Online route.** `true` for registered Daniel and Nik, also when `status` is `"offline"`; `false` for `null`, `{}`, `registered:false`, `managerId:"alex"`.
3. **Source table.** All six combinations of (online, not online) × (no model, valid model, malformed model) give the values in 4.1. A malformed model is never `"local"`.
4. **Empty only when empty.** For each of the four screens, `TEXT.empty[screen]` appears only for a `status: "empty"` model; `loading`, `unavailable`, `partial`, `ready` and `null` never show it. Each `TEXT.empty` string is found verbatim in the current source of its screen file (`statistics.js`, `trophyRoom.js`, `legacy.js`).
5. **Partial and interim.** A model with one completed and one `unavailable` Showdown gives `message` "Showing 1 of 2 Showdowns. …". A model built with `currentShowdownOnly: true` carries exactly "Current Showdown only. Career history is not yet available." as `interimLabel`.
6. **Left and right.** In a model where Nik has more career points than Daniel, every comparison row's `daniel` value comes from `managers.daniel` and `nik` from `managers.nik`; the painted header row reads `DANIEL` left, `NIK` right.
7. **Abandoned is status only.** A legacy row for an `abandoned` Showdown has value exactly `"Abandoned"`, also when the test forges `totals` and `winner` onto that row.
8. **Rivalry needs one Showdown.** A `ready` model with two Showdowns gives a `rivalryStatistics` view with status `unavailable`.
9. **No ids on screen.** The painted text of every screen for a ready model contains none of `pair_`, `acct_`, `profile_`, `save_`, `session_`.
10. **Malformed models.** `{}`, `{status:"weird"}` and `null` give `status: "unavailable"` and `TEXT.unavailable` for every screen.
11. **Online never runs the local path.** With the online identity, call `renderCareerStatistics()`, `renderTrophyRoom()`, `renderLegacy()`, `renderRivalryStatistics()`, `openCareerStatistics()`, `openTrophyRoom()`: every spy count is 0 (so no local read, no archive write, no import panel), each screen shows `TEXT.unavailable`, and the legacy container has no `legacyDataControls` element (so the restore panel cannot mount).
12. **Local route unchanged.** With identity `null`, `renderCareerStatistics()` and `renderTrophyRoom()` call `buildCareerAnalytics` (2 calls) and `renderLegacy()` calls `loadLegacyShowdowns` once.
13. **Model given and remembered.** Online, `openCareerStatistics({model})` paints `CAREER TABLE`; a following zero-argument `renderCareerStatistics()` paints the same; `renderCareerStatistics({model:null})` paints `TEXT.unavailable`. Spies stay 0.
14. **Open functions forward.** `openRivalryStatistics({model: rivalryModel})` paints `HEAD TO HEAD` although `currentShowdown` is `null`; `openRivalryStatistics()` with `currentShowdown` `null` does nothing (old behaviour).
15. **Seam loaded late.** Without `CareerModeCareerScreenSeam` in the context and with a `loadRuntimeScript` stub that records its arguments and then installs the seam, an online `renderCareerStatistics()` paints nothing at first, calls `loadRuntimeScript("career-screen-seam","js/careerScreenSeam.js",fn)`, and after the promise settles shows `TEXT.unavailable`. No spy ran.
16. **Containment untouched.** `js/onlinePlayerIdentity.js` still contains `#legacyButton:not([data-test-surface='internal-audit'])`, `#careerStatisticsButton:not([data-test-surface='internal-audit'])`, `#rivalryStatisticsButton:not([data-test-surface='internal-audit'])` and `display:none!important`; `index.html` still has no `trophyRoomButton`.
17. **Pure and frozen.** Views and the export are deeply frozen; the same input twice gives `deepEqual` views; the source of `js/careerScreenSeam.js` contains none of `localStorage`, `sessionStorage`, `indexedDB`, `window`, `document`, `currentShowdown`, `Date.now`, `Math.random`.

## 8. Done checklist (PASS/FAIL with one line of evidence each, in the status file)

- [ ] The test failed before the seam existed (commit link) and passes now (17/17).
- [ ] `npm run test:contracts` passes at 98/98 (or 99/99 with job 6); `npm run test:ops` passes 73/73.
- [ ] "Validate Gameplay Fast" green on the exact head (run URL).
- [ ] Only the files in section 2 changed; `onlinePlayerIdentity.js`, `analytics.js`, `screens.js`, `optionalModules.js`, `index.html`, CSS and Rules untouched.
- [ ] Online, no renderer reaches `buildCareerAnalytics`, `loadLegacyShowdowns`, `loadSavedShowdown` or `currentShowdown` data (case 11).
- [ ] Empty text only for `status === "empty"` (case 4); Daniel left, Nik right (case 6).
- [ ] PR open into `gameplay/recovery-v1`; nothing pushed to `main`; nothing deployed.

## 9. When stuck

If the contract and this job disagree, this job wins for now: write the question in the status file and continue. If an existing test other than `pos20-control-plane.test.mjs` fails, do not edit it: set State: BLOCKED with the test name, the failing assertion and the line, save, and reply "Job 4 is blocked: <one line>". If the same step fails twice, do the same.
