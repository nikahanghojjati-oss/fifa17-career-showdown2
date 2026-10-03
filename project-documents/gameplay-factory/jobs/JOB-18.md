# JOB-18 · Nik's pair code survives the pair-panel re-render (no false "invalid")

| Lane | Depends on | Steps | Code branch | PR into | Codex review |
| --- | --- | --- | --- | --- | --- |
| **chat** (normal chat; every emulator run happens on GitHub CI, WORKER_HANDBOOK §7) | none (the contract is node-only and needs no JOB-16 harness) | 5 | `gameplay/job-18-pair-code-race` | `gameplay/recovery-v1` | no |

## 1. Goal

Nik opens "JOIN DANIEL'S SHOWDOWN", pastes Daniel's code and presses JOIN. If he does that while the app is still syncing the pair state, the code vanishes from the field and the panel says **"Daniel's connection code is invalid."** although the code is right. The JOB-16 browser prototype hit this and worked around it by waiting for the pair state to settle (JOB-16 §8 and Appendix C line "Trap: the pair panel re-renders …"). After this job a code Nik types is never thrown away, and an empty field never says "invalid".

Root cause (lead-verified on `gameplay/recovery-v1` @ `889810f`; production `main` @ `2e0bd45` has the same code in both files, so it affects production today):

1. `js/persistentNikDanielPair.js:27` `pairSetState` calls `pairRender()` on every state change.
2. `js/persistentNikDanielPair.js:257` `pairRender` calls `panel.replaceChildren()` and builds a **new, empty** `<input id="persistentNikDanielPairCode">` plus a new JOIN button whose click handler reads `input.value` of that new input only (`pairJoinPairing(input.value,…)`). Nothing copies the old value across.
3. The re-renders come from the identity sidecar: `js/onlinePlayerIdentity.js:9` `setOnlineIdentityState` starts `syncPersistentPairSidecar()` on every identity change; `js/onlinePlayerIdentity.js:21` `syncPersistentPairSidecar` runs `pair.initialize({force:true})` (one Firestore transaction, then `pairSetState({status:"unpaired",…})`, so a re-render) and then `pair.render()` again; `js/onlinePlayerIdentity.js:54` `openCanonicalShowdownJoin` (Nik's Home tile, wired at line 57) awaits that sync and calls `pair.render()` once more. `js/persistentNikDanielPair.js:260` also re-renders on every `career-mode-online-identity-change` event. While the sync runs, the panel from the previous sync is already showing an input that Nik can type into (`busy:false`, `status:"unpaired"`), so the JOB-16 settle wait is a heuristic, not a guarantee.
4. A code typed into the old input is detached; the visible field is empty; JOIN calls `pairJoinPairing("")`, and `pairParsePlayerJoinCode` (`js/persistentNikDanielPair.js:156`) throws `PAIRING_CAPABILITY_INVALID` "Daniel's connection code is invalid." for the empty string. The same loss happens across the `joining` busy render: a code rejected by the provider is gone when the panel comes back.

Lead repro (2026-10-03, throwaway worktree, JOB-16 Appendices A/C/D on ports auth 9399 / firestore 8484, Playwright Chromium 1194): with the settle wait removed, Nik fills and clicks JOIN 218-335 ms after opening Join. Old code: 3 of 3 runs end `{"status":"error","message":"Daniel's connection code is invalid."}` with the field empty. With the Appendix B fix: 3 of 3 runs reach CAREER READY with both career indexes `[R1]`, and the unmodified JOB-16 Appendix C (J0-J3) still passes.

## 2. Branches and files

- The lead creates `gameplay/job-18-pair-code-race` from `gameplay/recovery-v1`. If it is missing, create it yourself from `gameplay/recovery-v1`.
- Edit: `js/persistentNikDanielPair.js`, only `pairRender` plus one new `let` next to `pairInitializePromise` (Appendix B). `contractVersion` stays 4.
- Create: `tests/contracts/pair-code-entry-race-contracts.cjs` (Appendix A, full file).
- Register it: one entry appended **last** in `POS20_SUPPLEMENTAL_PRODUCT_TESTS.json`, and one const plus the same name appended **last** to `expectedSupplementalContracts` in `tests/operations/pos20-control-plane.test.mjs` (Appendix C). JSON regex patterns escape a dot as `\\.` in the file text (one backslash in the regex), never `\\\\.`. If JOB-16 or JOB-08 merges first, rebase and re-append this entry and const LAST again, keeping theirs.
- Never change the Rules, `js/onlinePlayerIdentity.js`, `js/sparkPrivatePairing.js`, `index.html`, `service-worker.js` (the shell bump to r52 happens at the main gate), CSS, or any existing test. No visual redesign: same elements, same texts, same order.

## 3. What to build

In `pairRender` (Appendix B is the reference, apply it exactly):

- Before `panel.replaceChildren()`, read the current `#persistentNikDanielPairCode` input (if any): its value, whether it has focus, and its caret (`selectionStart`/`selectionEnd`). Keep the value in a module-level `pairDraftCode` so it also survives renders where the input is absent (the `joining` busy render).
- Clear `pairDraftCode` when there is no account (`!state.accountId`) or a connection exists (`state.connectionState` set), so a used code never reappears for a later Showdown.
- Put `pairDraftCode` into the new input. After the panel is rebuilt, if the old input had focus, focus the new one and restore the caret.
- JOIN with an empty or whitespace-only field does **not** call `pairJoinPairing`; it sets the message "Paste Daniel's code first, then press Join." and nothing else (no busy flash, no "invalid").
- A malformed non-empty code still goes through `pairJoinPairing` and still shows "Daniel's connection code is invalid." (unchanged), and stays in the field so Nik can correct it.

Startup budget: `js/persistentNikDanielPair.js` is lazy-loaded (not one of the 7 startup scripts in `index.html`), so the startup gzip stays `37493/37500`. The lazy file grows by about 600 bytes raw / 180 bytes gzip (lead measured 13780 to 13960). Spark only; no Firestore, Rules or provider change.

## 4. Steps

1. Baseline: note the "Validate Gameplay Fast" result on the job branch head (it should be green; this bug is not covered by any existing test). Quote it.
2. **Tests first.** Create `tests/contracts/pair-code-entry-race-contracts.cjs` (Appendix A) and apply Appendix C. Run `node tests/contracts/pair-code-entry-race-contracts.cjs`: it must **fail** on the old code with `AssertionError … 2b the code Nik typed survives the pair-panel re-render` (actual `''`). Save. The red `Gameplay contracts` run on your head is your tests-first evidence; link it.
3. Make the fix in `js/persistentNikDanielPair.js` (Appendix B). `node --check js/persistentNikDanielPair.js`, then the contract: `PASS pair code entry race contracts: typed code survives re-render, empty never invalid, malformed still rejected.` Run `npm run test:contracts` (lead: 103/103, `startup 162809/37493`) and `npm run test:ops` (lead: pass 73 / fail 0). Save.
4. Push and wait for "Validate Gameplay Fast" on your exact head. It must be fully green, including the persistent pair emulator and the two-manager journey.
5. Open the PR into `gameplay/recovery-v1`, fill the status file and the Done checklist, then set State: DONE (WORKER_HANDBOOK §7a).

## 5. Tests first (the contract)

`tests/contracts/pair-code-entry-race-contracts.cjs` loads the real `js/persistentNikDanielPair.js` in a `node:vm` sandbox with a tiny DOM and fake Spark services (signed-in Nik, registered device, no pair link). It proves:

- (1) Nik reaches `unpaired` and the code input and JOIN button render.
- (2) Nik focuses the field and types a valid 3-season code; then the sidecar re-render happens exactly as in production (`initialize({force:true})` then `render()`). The new input still holds the code, keeps focus and caret, and JOIN starts the join flow (`joining` is seen) without the "invalid" message. **Fails on the old code** (2b: field is `''`; with 2b-2d removed the old code ends on "Daniel's connection code is invalid.").
- (3) JOIN with an empty field does not start a join, never says "invalid", asks Nik to paste Daniel's code, and leaves the panel usable.
- (4) A malformed code is still rejected with the existing message and stays in the field.

## 6. Done checklist (PASS/FAIL with one line of evidence each, in the status file)

- [ ] The contract fails on the old code and passes on the new code (quote both lines).
- [ ] "Validate Gameplay Fast" is green on the exact head, including the persistent pair emulator and the two-manager journey.
- [ ] Only `js/persistentNikDanielPair.js`, the new contract and the two registry files changed; `contractVersion` still 4; `index.html`, `service-worker.js`, Rules unchanged.
- [ ] `npm run test:contracts` still reports `startup …/37493` (or lower) and all contracts pass; `npm run test:ops` fail 0.
- [ ] A malformed code still says "Daniel's connection code is invalid." (contract case 4); an empty field never does (case 3).

## 7. When stuck

Set State: BLOCKED in the status file, quote the exact error, and ask one question.

- **The registry test fails with a deep-equal diff on `expectedSupplementalContracts`.** Another job merged first; put `pairCodeEntryRaceContract` back as the last item and the JSON entry back as the last entry.
- **A hunk in Appendix B does not match.** The line is minified; search for the exact `old` text in the file. If `pairRender` moved, re-apply by hand and say so in the Notes.

## 8. Follow-up (lead decides, not in this job)

After this merges, JOB-16 Appendix C may drop its settle wait before filling Nik's code (it stays harmless if kept). The same replace-the-whole-panel pattern exists in the other pair-panel branches, but only this one has a text field.

## Appendices (lead reference implementation)

The lead built Appendices A-C in a throwaway worktree on `gameplay/recovery-v1` at `889810f` and ran them: the contract fails on the old code (2b) and passes on the new code; `npm run test:contracts` is `103/103` (`startup 162809/37493`); `npm run test:ops` is pass 73 / fail 0; JOB-16 Appendix C J0-J3 passes with the fix; the immediate-typing browser repro goes from 3/3 "invalid" to 3/3 CAREER READY.

### Appendix A. `tests/contracts/pair-code-entry-race-contracts.cjs` (full file)

```js
"use strict";
// G-2d: a pair code Nik types must survive pair-panel re-renders, and an empty field never says "invalid".
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");

const root=path.resolve(__dirname,"../..");
const pairSource=fs.readFileSync(path.join(root,"js/persistentNikDanielPair.js"),"utf8");
const INVALID="Daniel's connection code is invalid.";
const CODE=`CMS17-pair_3${"ab".repeat(31)}c`;

// Tiny DOM: enough for pairRender (createElement, replaceChildren, ids, focus, clicks).
function createDom(){
  let active=null;
  class El{
    constructor(tag){this.tagName=String(tag).toUpperCase();this.children=[];this.parent=null;this.style={};this.listeners={};this.id="";this.className="";this.ownText="";this.value="";this.disabled=false;this.selectionStart=0;this.selectionEnd=0;}
    get textContent(){return this.ownText+this.children.map(c=>c.textContent).join("");}
    set textContent(v){this.ownText=v==null?"":String(v);this.children=[];}
    get isConnected(){let n=this;while(n){if(n===body)return true;n=n.parent;}return false;}
    append(...nodes){for(const n of nodes){if(n.parent)n.parent.children=n.parent.children.filter(c=>c!==n);n.parent=this;this.children.push(n);}}
    insertBefore(n){this.append(n);return n;}
    replaceChildren(...nodes){for(const c of this.children)c.parent=null;this.children=[];this.append(...nodes);}
    addEventListener(type,fn){(this.listeners[type]||(this.listeners[type]=[])).push(fn);}
    click(){if(!this.disabled)for(const fn of this.listeners.click||[])fn({preventDefault(){}});}
    focus(){if(this.isConnected)active=this;}
    setSelectionRange(a,b){this.selectionStart=a;this.selectionEnd=b;}
    all(){return this.children.flatMap(c=>[c,...c.all()]);}
    querySelector(sel){return sel===".fifaMenuGrid"?null:null;}
    scrollIntoView(){}
  }
  const body=new El("body"),menu=new El("div"),shell=new El("div");
  menu.id="mainMenu";shell.className="fifaMenuShell";body.append(menu);menu.append(shell);
  const document={
    createElement:tag=>new El(tag),
    getElementById:id=>body.all().find(n=>n.id===id)||null,
    querySelector:sel=>sel==="#mainMenu .fifaMenuShell"?shell:null,
    get activeElement(){return active&&active.isConnected?active:body;}
  };
  return{document,body};
}

async function settle(){for(let i=0;i<20;i+=1)await new Promise(r=>setImmediate(r));}

async function bootNik(){
  const {document}=createDom();
  const statuses=[];
  const firestoreSdk={
    doc:(_db,...parts)=>({path:parts.join("/")}),
    runTransaction:async(_db,fn)=>fn({get:async()=>({exists:()=>false,data:()=>null})}),
    getDoc:async()=>({exists:()=>false,data:()=>null})
  };
  const sandbox={
    console,setTimeout,clearTimeout,TextEncoder,
    document,
    CareerModeOnlinePlayerIdentity:{getState:()=>({managerId:"nik"})},
    CareerModeSparkConnectedAccount:{initialize:async()=>({}),getState:()=>({connected:true,accountId:"uid_nik"})},
    CareerModeSparkPrivatePairing:{initialize:async()=>({}),getState:()=>({registered:true,deviceId:"device_nik"}),localBindingOptions:()=>[]},
    CareerModeProductionFirebaseRuntime:{ensureAccountServices:async()=>({ok:true,auth:{currentUser:{uid:"uid_nik"}},firestore:{},firestoreSdk})}
  };
  vm.createContext(sandbox);
  vm.runInContext(pairSource,sandbox,{filename:"js/persistentNikDanielPair.js"});
  const pair=sandbox.CareerModePersistentNikDanielPair;
  assert.ok(pair&&typeof pair.initialize==="function","pair module loads in the sandbox");
  pair.subscribe(s=>statuses.push(s.status));
  const first=await pair.initialize({force:true});
  assert.equal(first.status,"unpaired","1a Nik reaches the unpaired code-entry state");
  const panel=()=>document.getElementById("persistentNikDanielPairPanel");
  const input=()=>document.getElementById("persistentNikDanielPairCode");
  const joinButton=()=>panel().all().find(n=>n.tagName==="BUTTON"&&n.textContent==="JOIN DANIEL'S SHOWDOWN");
  assert.ok(input(),"1b the code input is rendered for Nik");
  assert.ok(joinButton(),"1c the join button is rendered for Nik");
  return{pair,document,statuses,panel,input,joinButton};
}

(async()=>{
  // 2. Typed code survives a sync re-render (the JOB-16 trap) and reaches the join flow.
  {
    const t=await bootNik();
    const typedInto=t.input();
    typedInto.focus();
    typedInto.value=CODE;
    typedInto.setSelectionRange(CODE.length,CODE.length);
    // The sidecar sync (onlinePlayerIdentity syncPersistentPairSidecar) re-initializes and re-renders.
    await t.pair.initialize({force:true});
    t.pair.render();
    const after=t.input();
    assert.ok(after,"2a the code input is still rendered after the sync re-render");
    assert.equal(after.value,CODE,"2b the code Nik typed survives the pair-panel re-render");
    assert.equal(t.document.activeElement,after,"2c focus stays in the code input across the re-render");
    assert.equal(after.selectionStart,CODE.length,"2d the caret position is kept");
    t.statuses.length=0;
    t.joinButton().click();
    await settle();
    assert.ok(t.statuses.includes("joining"),"2e JOIN starts the join flow with the preserved code");
    assert.notEqual(t.pair.getState().message,INVALID,"2f a correct code typed before the re-render is never reported as invalid");
  }
  // 3. An empty field never says "invalid" and never starts a join.
  {
    const t=await bootNik();
    t.statuses.length=0;
    t.joinButton().click();
    await settle();
    assert.equal(t.statuses.includes("joining"),false,"3a JOIN with an empty field does not start a join");
    assert.notEqual(t.pair.getState().message,INVALID,"3b an empty field is not reported as an invalid code");
    assert.match(t.pair.getState().message,/paste daniel's code/i,"3c an empty field asks Nik to paste Daniel's code");
    assert.equal(t.pair.getState().busy,false,"3d the panel stays usable");
  }
  // 4. A really wrong code is still rejected with the existing message.
  {
    const t=await bootNik();
    t.input().value="CMS17-not-a-code";
    t.joinButton().click();
    await settle();
    assert.equal(t.pair.getState().message,INVALID,"4a a malformed code is still rejected as invalid");
    assert.equal(t.input().value,"CMS17-not-a-code","4b the rejected code stays in the field so Nik can correct it");
  }
  console.log("PASS pair code entry race contracts: typed code survives re-render, empty never invalid, malformed still rejected.");
})().catch(error=>{console.error(error);process.exit(1);});
```

### Appendix B. `js/persistentNikDanielPair.js` (four exact replacements; each `old` text occurs once)

The file's lines are long and minified, so the fix is given as find/replace pairs. Apply them in order.

B1. Add the draft holder (line 21, after `pairInitializePromise`):

```text
old:   let pairInitializePromise=null;
new:   let pairInitializePromise=null;
       let pairDraftCode="";
```

(The new line is indented with two spaces, like its neighbours.)

B2. In `pairRender`, capture the typed code, focus and caret before the panel is rebuilt:

```js
// old
shell.insertBefore(panel,grid||null);}panel.replaceChildren();
// new
shell.insertBefore(panel,grid||null);}const typed=root.document.getElementById(CODE_INPUT_ID),typedFocus=Boolean(typed&&root.document.activeElement===typed),typedStart=typed?.selectionStart,typedEnd=typed?.selectionEnd;if(typed)pairDraftCode=typed.value;if(!state.accountId||state.connectionState)pairDraftCode="";panel.replaceChildren();
```

B3. Put the draft into the new input, and guard an empty JOIN:

```js
// old
input.style.minWidth="min(330px,100%)";const join=pairCreateElement("button","menuButton","JOIN DANIEL'S SHOWDOWN");join.type="button";join.disabled=state.busy;join.addEventListener("click",()=>void pairJoinPairing(input.value,{managerRole:"playerTwo"}));
// new
input.style.minWidth="min(330px,100%)";input.value=pairDraftCode;const join=pairCreateElement("button","menuButton","JOIN DANIEL'S SHOWDOWN");join.type="button";join.disabled=state.busy;join.addEventListener("click",()=>{if(!input.value.trim()){pairSetState({message:"Paste Daniel's code first, then press Join."});return;}void pairJoinPairing(input.value,{managerRole:"playerTwo"});});
```

B4. Restore focus and caret after the panel is rebuilt (end of `pairRender`):

```js
// old
}panel.append(actions);return panel;}
// new
}panel.append(actions);const restored=typedFocus&&root.document.getElementById(CODE_INPUT_ID);if(restored){restored.focus();try{restored.setSelectionRange(typedStart,typedEnd);}catch(_error){}}return panel;}
```

Lead measurement: raw 64286 to 64887 bytes, gzip 13780 to 13960 (lazy file; startup unchanged at 37493/37500).

### Appendix C. Registry and ops test

```diff
--- a/POS20_SUPPLEMENTAL_PRODUCT_TESTS.json
+++ b/POS20_SUPPLEMENTAL_PRODUCT_TESTS.json
@@ (end of the "tests" array, after the career-index entry)
         "^tests/contracts/career-index-contracts\\.cjs$",
         "^POS20_SUPPLEMENTAL_PRODUCT_TESTS\\.json$"
       ]
+    },
+    {
+      "path": "tests/contracts/pair-code-entry-race-contracts.cjs",
+      "patterns": [
+        "^js/persistentNikDanielPair\\.js$",
+        "^js/onlinePlayerIdentity\\.js$",
+        "^tests/contracts/pair-code-entry-race-contracts\\.cjs$",
+        "^POS20_SUPPLEMENTAL_PRODUCT_TESTS\\.json$"
+      ]
     }
   ]
 }
```

```diff
--- a/tests/operations/pos20-control-plane.test.mjs
+++ b/tests/operations/pos20-control-plane.test.mjs
@@ (after the careerIndexContract const, about line 71)
 const careerIndexContract='tests/contracts/career-index-contracts.cjs';
+const pairCodeEntryRaceContract='tests/contracts/pair-code-entry-race-contracts.cjs';
@@ (end of the expectedSupplementalContracts array, about line 75)
-…,sharedSeasonResultsRaceContract,careerIndexContract];
+…,sharedSeasonResultsRaceContract,careerIndexContract,pairCodeEntryRaceContract];
```

### Appendix D. Lead browser repro (reference only; not part of this job's files)

In a throwaway worktree with JOB-16 Appendices A, C and D (ports changed to auth 9399, firestore 8484, hub 4444, logging 4544), the lead replaced the two settle lines before Nik's fill in Appendix C J2 (`waitForFunction(… busy===false&&status==="unpaired" …)` and `waitForTimeout(500)`) with an immediate `fill(pairCode)` + JOIN click, then waited for CAREER READY or the "invalid" text:

```text
old code: REPRO_OUTCOME=invalid typed+clicked in 232 ms; field now ""; state={"status":"error","busy":false,"message":"Daniel's connection code is invalid."}   (3 of 3 runs)
fixed:    REPRO_OUTCOME=joined  typed+clicked in 218 ms; state={"status":"paired",...}; ok 6 J2.2 Nik joined with the code; ... both career indexes [R1]   (3 of 3 runs, incl. unmodified Appendix C J0-J3: PASS 8 numbered checks)
```
