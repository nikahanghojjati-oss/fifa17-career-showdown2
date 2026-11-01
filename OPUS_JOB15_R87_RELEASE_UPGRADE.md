# Job 15 (Opus): the 2.0.0 release PR, upgrade from 1.9.10 and the cutoffs (Career Mode Showdown)

Code snapshot: repo nikahanghojjati-oss/fifa17-career-showdown2. Live production is 1.9.10-r86 (main @ 5b4337fdd64aaf1e2ed8de5abf6830021f29c82e). The frozen 2.0.0 candidate is gameplay/r87 @ 187a67c0 (258f3f3e plus #1183, which only touches ruleBook.js, statistics.js and trophyRoom.js; none of the files below). The release PR #1156 (branch claude-gameplay/r87-release @ 443486cb84fffcb344409e84e12e2e7245e936cd, into gameplay/r87) bumps the version to 2.0.0-r87, pins the roulette and Prime Pack start times (`RRR_FROM_MS` = `ICON_FROM_MS`) and other cutoffs to the release time, and re-pins the Firestore Rules. Then gameplay/r87 merges into main, the Rules deploy runs first, and the site deploys.

**Planned timing:** the owner types "merge r87" on 1 Nov 2026 around 18:15 UTC or later (Boston 2:15 pm EST or later); the release must be live on both real phones by Sun 1 Nov 7 pm Boston = 2026-11-02 00:00 UTC.

Below: the release PR diff (code files only; tests and docs left out), the release-head service worker, roulette step, transfer-challenge sync module and `tools/set-release-time.cjs`, every `*_FROM_MS` use in js/ with context, the browser test that claims to prove the 1.9.10 to 2.0.0 upgrade, both deploy workflows, the release checklist and the draft release notes.

## The product
A private two-player FIFA 17 Career Mode competition web app (vanilla JS, Firebase Firestore on the free Spark plan with no Cloud Functions, GitHub Pages, a service worker). Two managers, Daniel (playerOne) and Nik (playerTwo), each on his own phone, play a "Showdown" of 1, 3, 5 or 10 seasons. Each season both phones walk through shared screens: Career Start, Russian Roster Roulette (each manager spins), **Prime Pack** (new in 2.0.0), the Transfer Challenge, results, a season commit both acknowledge, then scoring, history and a lifetime career. 2.0.0 (release r87) is the biggest release ever and the **first change to the scoring system since the project began.**

## Scoring truth for 2.0.0 (owner rules; the code must match)
- A season is worth **0 to 15** points (it was 0 to 11). Europa League +3 or Champions League +5, never both. Prime Pack adds 4, 3, 2 or 1 to exactly one manager, or to nobody. **Both managers never score Prime Pack in the same season.**
- **Golden Showdown = 150** in a 10-season Showdown (15 x 10). The owner said on 1 Nov 2026: no real 10-season Showdown was ever played, so there is no 110 record to preserve; every screen, note, Gazette line and record book must say 15 / 150 only. Showdowns started before 2.0.0 never play Prime Pack, and breaking a pre-2.0.0 game is acceptable; a new 2.0.0 game must fully work.
- **No tiebreak anywhere.** Equal totals = DRAW (a 150-150 is a draw); equal career points = LEVEL. League position never decides anything.
- Lengths 1, 3, 5, 10 only. Reus Gate: the loading screen stays until the next screen is ready. No dimming ever. Nothing covers anything at any size. No flash of an old design.

## Prime Pack rules
- Once per season on both phones, after both roulette spins and before the transfer window opens. Only Showdowns confirmed at or after `ICON_FROM_MS` (equal to the roulette's `RRR_FROM_MS`; the release PR pins both to the release time) play it. Kill switch `CMS_PRIME_PACK = "off"`.
- One masked card of a real player (data/icons.js), seeded from the Showdown id, never the same player twice in one Showdown. The answer is never stored; both phones derive it.
- Stages (one table, `STAGES` in js/iconGuess.js): 3 s count-in after the later arrival; S1 = 4 pts (position + 1 real stat; 2.5 s reveal + 25 s guessing); S2 = 3 pts (+1 stat; 1.5 s + 20 s); S3 = 2 pts (+1 stat; 1.5 s + 20 s); S4 = 1 pt (+1 stat; 1.5 s + 20 s); S5 = no guessing, reveals the last 2 stats, name, nationality, overall. A right guess at any stage jumps to S5.
- Each manager has 2 guesses (tokens) per round; wrong guesses spend a token and are never stored. Name matching: `typoRule` in js/iconNames.js.
- The first right guess **by server time** wins; points come from the server time of the winning write at the stage edges (Rules `ssjrPackStagePoints`). The point lands as a sparse `primePack` key on the winner's Season Result; the round record is `rivalries/{rid}/primePackRounds/season_N`.

## Trust model
Normal play only: two real phones, reloads, phone locks, app switching, offline/online, slow networks, clock skew, one phone far behind, cleared storage, two tabs, a service-worker update mid-Showdown, one phone on 1.9.10 and one on 2.0.0. A deliberately modified app is out of scope, EXCEPT where the Firestore Rules are the only guard on points: report a crafted write that gives a manager points he did not win as P1 "hardening".

## How to report
You cannot run code here, so reason carefully, show timing and arithmetic, and quote code. For each finding:
- ID and severity: P0 = wrong points, wrong winner, both scoring, a lost or doubled result, a stuck screen, or a refused legitimate write a player sees; P1 = rare or edge; P2 = cosmetic or wording;
- file:line, quoting the code;
- exact steps or timeline that show it;
- expected vs actual;
- the smallest fix as a unified diff.
Then list what you checked and found correct, area by area. Rank findings most severe first. Say "none found" where true. Keep the visible reply under about 50,000 characters.

## Hunt these specifically
1. **Cutoff times vs real release time.** The PR pins the cutoffs to a fixed time. What happens to a Showdown confirmed on 1.9.10 between that pinned time and the moment 2.0.0 is actually live on a phone? Can one phone treat it as a 2.0.0 Showdown (roulette + Prime Pack, 15-point seasons) while the other treats it as old? Can a Showdown get stuck because its first season had no roulette/Prime Pack but later seasons expect them? Are all cutoffs (`RRR_FROM_MS`, `ICON_FROM_MS`, `OWN_CLUB_FROM_MS`, any other) equal where they must be, and is anything still a placeholder?
2. **Mixed versions in one season.** One phone on 1.9.10 (service worker not yet updated), one on 2.0.0. The claim: a 1.9.10 phone refuses 2.0.0 transfer data until it updates on Home. Is that refusal shown in plain words with a way forward, never a stuck screen? Can the 1.9.10 phone write anything (results, commit, close) that a 2.0.0 Showdown then counts with 11-point maths, or that the new Rules refuse with no message?
3. **Service-worker upgrade.** Does every file 2.0.0 needs (Prime Pack page, data/icons.js, iconGuess*, iconNames, roulette scene and vendor, new CSS) sit in the cached shell, with the version bumped so phones fetch the new set? Can a phone end up with a half-old, half-new app (old HTML, new JS or the reverse)? Does the update wait for Home as the house rule says, and never land mid-season-screen?
4. **Rules before site.** The new Rules must be live before the new site, and the old 1.9.10 site must keep working on the new Rules during the gap. Check the deploy workflows' order and failure handling: if the Rules deploy fails, does the site deploy stop? Does the client pin `FSB_RULES_SHA256` match what the Rules workflow actually deploys (the composed file)?
5. **Release PR correctness.** Every changed line: version strings agree everywhere (service worker, manifest, package.json, index.html, app.js), nothing reverts an earlier r87 fix, `set-release-time.cjs` updates every constant it must and nothing else.
6. **Docs against code.** Release notes and checklist claims (15 / 150, Prime Pack rules, cutoffs, rollback steps) match the code. Flag any "110", "11 points", "max 12" or "+1" left in player-facing text or notes.

## Do not re-report
Prime Pack round timing and the guess screen, and the scoring data path (other jobs cover them). Layout.

Finding IDs: O15-NN.


## FILE: release PR #1156 diff (code files only)
```text
diff --git a/RELEASE_V2.0.0_R87.md b/RELEASE_V2.0.0_R87.md
new file mode 100644
index 0000000000..7a5d204220
--- /dev/null
+++ b/RELEASE_V2.0.0_R87.md
@@ -0,0 +1,59 @@
+# Career Mode Showdown 2.0.0 (r87): Russian Roster Roulette, the Touchline Gazette, Commentary v3 and a full polish (v2.0.0 runtime r87)
+
+Application version: `v2.0.0`  
+Runtime asset revision: `2.0.0-r87`  
+Previous known-good runtime: `1.9.10-r86`
+
+r87 is 2.0.0, the biggest release so far. It ships only after a smooth 10-season Showdown on the emulator and Nik's own check
+on real phones once it is live. The player-facing notes are in `gameplay/r87/RELEASE_NOTES_2.0.0.md` (release-notes branch);
+this file is the release record.
+
+## What changed
+
+- Russian Roster Roulette before every season's transfer window, the same spin on both phones, saved online; the window opens
+  only after both managers spun (#1069, #1080, #1101, #1107, #1112, #1147, #1148). It runs for Showdowns confirmed at or after
+  the 2.0.0 release time (`RRR_FROM_MS` = `ROULETTE_FROM_MS`, set by `tools/set-release-time.cjs`).
+- Transfer window: signing overall and position, official 2016-17 league names, Deadline Day finish.
+- The Touchline Gazette after each season and a final edition (#1094, #1110, #1116).
+- Commentary v3 on Season Results and below the Final Winner stage (#1126).
+- Career screens: History opens on the newest Showdown and moves fast through hundreds; career fixes (#1103, #1120, #1135).
+- Polish of start screens, match-day, scenes, error and offline screens, transitions, music player and first load
+  (#1111, #1118, #1122, #1123, #1130, #1134, #1137, #1139, #1140).
+- Reads: shared reads meter and accounting, Fable job 3 read fixes (#1097, #1114, #1133, #1144, #1145).
+- Red-team and Fable fixes (#1104, #1105, #1146, #1147, #1148).
+
+## Update safety
+
+- The shell and service worker advance to 2.0.0-r87 in a fresh `career-mode-showdown-shell-2.0.0-r87` cache, and 1.9.10-r86
+  is retained for rollback. `SHELL_PATHS_ADDED_SINCE_PREVIOUS` lists the files 2.0.0 adds and
+  `SHELL_PATHS_REMOVED_SINCE_PREVIOUS` the seven acceptance-only scripts it no longer precaches (arch audit D1), so the
+  retained r86 shell is verified against its own 228 paths (`tests/fixtures/shell-paths/1.9.10-r86.json`).
+- An installed phone takes the update on Home, never in the middle of a game screen (#1125 proof).
+- A phone still on 1.9.10 refuses 2.0.0 transfer data and fails closed until it updates on Home. After 2.0.0 is live, open
+  the app on both phones and wait on Home until it reloads itself.
+
+## Deploy order
+
+- Rules first, then the site. The Pages workflow's `rules-first` job holds the site until this commit's Rules deploy
+  succeeded. Old Rules refuse the new spin marks, the roulette/spins record and Prime Pack rounds.
+
+## What did not change
+
+- No tiebreak anywhere. The Remote Joining protocol and pairing stay as they were.
+- The no-flash rules and the Reus Gate are unchanged.
+- Firebase remains Spark-only, billing remains OFF and App Check enforcement remains OFF.
+- No saved Showdown is rewritten. Nothing in Firebase is deleted or edited.
+
+## Firestore Rules
+
+- Composed production Rules: filled in on the release PR from the exact release head (re-pin of #1097, #1101, #1148,
+  #1147 and Prime Pack).
+
+## Checks
+
+- Filled in on the release PR from the exact release head.
+
+## SSJR status
+
+SSJR-1.1 remains frozen at `0/100`. SSJR-2.1 is `100/100`, earned on r85 (`1.9.9-r85`) by the 2026-10-29 two-device production
+run. No SSJR credit comes from this source, CI or deployment, and no new physical acceptance is claimed for 2.0.0.
diff --git a/index.html b/index.html
index 3303054525..508623f8b7 100644
--- a/index.html
+++ b/index.html
@@ -3,12 +3,12 @@
 <head>
 <meta charset="UTF-8">
 <meta name="viewport" content="width=device-width, initial-scale=1.0">
-<meta name="app-asset-revision" content="1.9.10-r86">
+<meta name="app-asset-revision" content="2.0.0-r87">
 <title>Career Mode Showdown</title>
-<link rel="preload" as="image" href="assets/LOADING_REUS_PHONE.webp?v=1.9.10-r86" media="(max-aspect-ratio: 7/5)" fetchpriority="high">
-<link rel="preload" as="image" href="assets/LOADING_REUS_DESKTOP.webp?v=1.9.10-r86" media="not all and (max-aspect-ratio: 7/5)" fetchpriority="high">
-<link rel="stylesheet" href="assets/fonts/barlow-condensed.css?v=1.9.10-r86">
-<link rel="stylesheet" id="appStyles" href="css/app.css?v=1.9.10-r86">
+<link rel="preload" as="image" href="assets/LOADING_REUS_PHONE.webp?v=2.0.0-r87" media="(max-aspect-ratio: 7/5)" fetchpriority="high">
+<link rel="preload" as="image" href="assets/LOADING_REUS_DESKTOP.webp?v=2.0.0-r87" media="not all and (max-aspect-ratio: 7/5)" fetchpriority="high">
+<link rel="stylesheet" href="assets/fonts/barlow-condensed.css?v=2.0.0-r87">
+<link rel="stylesheet" id="appStyles" href="css/app.css?v=2.0.0-r87">
 </head>
 <body>
 <div id="background"></div>
@@ -18,8 +18,8 @@
 <div class="startupScene" aria-hidden="true">
 <div class="startupAthleteFrame">
 <picture>
-<source media="(max-aspect-ratio: 7/5)" srcset="assets/LOADING_REUS_PHONE.webp?v=1.9.10-r86" width="1179" height="2096">
-<img id="startupAthlete" src="assets/LOADING_REUS_DESKTOP.webp?v=1.9.10-r86" width="1920" height="1080" alt="" decoding="async" fetchpriority="high">
+<source media="(max-aspect-ratio: 7/5)" srcset="assets/LOADING_REUS_PHONE.webp?v=2.0.0-r87" width="1179" height="2096">
+<img id="startupAthlete" src="assets/LOADING_REUS_DESKTOP.webp?v=2.0.0-r87" width="1920" height="1080" alt="" decoding="async" fetchpriority="high">
 </picture>
 </div>
 </div>
@@ -382,15 +382,15 @@ <h2>LEGACY</h2>
 <button class="backButton" data-smart-back type="button">BACK TO HOME</button>
 </section>
 </main>
-<footer>Career Mode Showdown<br>v1.9.10</footer>
+<footer>Career Mode Showdown<br>v2.0.0</footer>
 </div>
 
-<script defer src="js/storage.js?v=1.9.10-r86"></script>
-<script defer src="js/showdown.js?v=1.9.10-r86"></script>
-<script defer src="js/scoring.js?v=1.9.10-r86"></script>
-<script defer src="js/screens.js?v=1.9.10-r86"></script>
-<script defer src="js/menuExperience.js?v=1.9.10-r86"></script>
-<script defer src="js/optionalModules.js?v=1.9.10-r86"></script>
-<script defer src="js/app.js?v=1.9.10-r86"></script>
+<script defer src="js/storage.js?v=2.0.0-r87"></script>
+<script defer src="js/showdown.js?v=2.0.0-r87"></script>
+<script defer src="js/scoring.js?v=2.0.0-r87"></script>
+<script defer src="js/screens.js?v=2.0.0-r87"></script>
+<script defer src="js/menuExperience.js?v=2.0.0-r87"></script>
+<script defer src="js/optionalModules.js?v=2.0.0-r87"></script>
+<script defer src="js/app.js?v=2.0.0-r87"></script>
 </body>
 </html>
\ No newline at end of file
diff --git a/js/app.js b/js/app.js
index eb0a98634b..c8a2095d70 100644
--- a/js/app.js
+++ b/js/app.js
@@ -1 +1 @@
-const APP_VERSION = "1.9.10";const STARTUP_SPLASH_MINIMUM_MS = 2700;const STARTUP_SPLASH_REDUCED_MS = 220;const STARTUP_SPLASH_EXIT_MS=240;const VISUAL_FIDELITY_STYLESHEET="css/visual-fidelity-r3.css?v=1.9.10-r86";const EXTERNAL_RUNTIME_ERROR=/contentScriptData\.init_ts|(?:chrome|moz|safari-web)-extension:\/\/|webkit-masked-url:\/\//i;let applicationStarted=false,runtimeNoticeTimer=null,runtimeBoundaryInstalled=false,performanceLifecycleInstalled=false,runtimeNoticeElement=null,runtimeNoticeTextElement=null,suppressedExternalRuntimeErrors=0;function iv(){if(document.querySelector('link[data-visual-fidelity="reus-r3"]'))return;const s=document.createElement("link");s.rel="stylesheet";s.href=VISUAL_FIDELITY_STYLESHEET;s.dataset.visualFidelity="reus-r3";s.addEventListener("error",()=>console.warn("[Career Mode Showdown] Reus visual fidelity stylesheet could not be loaded."),{once:true});document.head.appendChild(s);}iv();function rn(){if(runtimeNoticeElement?.isConnected)return runtimeNoticeElement;const e=document.getElementById("appRuntimeNotice");if(e){runtimeNoticeElement=e;runtimeNoticeTextElement=e.querySelector(".runtimeNoticeText");return e;}const n=document.createElement("div"),t=document.createElement("span"),b=document.createElement("button");n.id="appRuntimeNotice";n.setAttribute("role","status");n.setAttribute("aria-live","polite");t.className="runtimeNoticeText";b.type="button";b.setAttribute("aria-label","Dismiss message");b.textContent="×";b.addEventListener("click",()=>{if(runtimeNoticeTimer)clearTimeout(runtimeNoticeTimer);runtimeNoticeTimer=null;n.remove();runtimeNoticeElement=runtimeNoticeTextElement=null;});n.append(t,b);document.body.appendChild(n);runtimeNoticeElement=n;runtimeNoticeTextElement=t;return n;}function showAppNotice(message,type="error",duration=7000){const n=rn();if(n.className!==type)n.className=type;const m=String(message||"");if(runtimeNoticeTextElement&&runtimeNoticeTextElement.textContent!==m)runtimeNoticeTextElement.textContent=m;if(runtimeNoticeTimer)clearTimeout(runtimeNoticeTimer);runtimeNoticeTimer=duration>0?setTimeout(()=>{if(runtimeNoticeElement?.isConnected)runtimeNoticeElement.remove();runtimeNoticeElement=runtimeNoticeTextElement=runtimeNoticeTimer=null;},duration):null;}window.showAppNotice=showAppNotice;function reportApplicationError(c,e,q){const d=e?.message;console.error(`[Career Mode Showdown] ${c}:`,e);showAppNotice(`${c}. ${!q&&/^(?!.*permission)([A-Z][\w ',]*\. ?)+$/.test(d)?d:"Your career is safe. Try again."}`,"error",1e4);}window.reportApplicationError=reportApplicationError;function isFirstPartyRuntimeError(message="",filename="",stack=""){const evidence=`${message}\n${filename}\n${stack}`;if(EXTERNAL_RUNTIME_ERROR.test(evidence))return false;if(filename)try{if(new URL(filename,location.href).origin===location.origin)return true;}catch(error){}return String(stack||"").includes(`${location.origin}/`);}window.isFirstPartyRuntimeError=isFirstPartyRuntimeError;window.getRuntimeErrorBoundaryDiagnostics=()=>({installed:runtimeBoundaryInstalled,suppressedExternalRuntimeErrors});function installRuntimeErrorBoundary(){if(runtimeBoundaryInstalled)return;runtimeBoundaryInstalled=true;addEventListener("error",e=>{if(!e)return;const x=e.error,m=String(e.message||x?.message||""),s=typeof x?.stack==="string"?x.stack:"";if(/^ResizeObserver loop (?:completed with undelivered notifications|limit exceeded)\.?$/.test(m))return console.debug(m);if(!isFirstPartyRuntimeError(m,e.filename||"",s)){suppressedExternalRuntimeErrors++;return;}reportApplicationError("Something went wrong on this screen",x||new Error(m||"Unknown runtime error"),1);});addEventListener("unhandledrejection",e=>{const r=e?.reason,m=r?.message?String(r.message):String(r||"Unknown promise rejection"),s=typeof r?.stack==="string"?r.stack:"";if(!isFirstPartyRuntimeError(m,"",s)){suppressedExternalRuntimeErrors++;return;}reportApplicationError("Something went wrong on this screen",r,1);});}function rt(){if(!currentShowdown||typeof window.getActiveScreenName!=="function"||window.getActiveScreenName()!=="transferChallenge"||typeof getTransferChallengeForSeason!=="function")return;const c=getTransferChallengeForSeason(currentShowdown.currentRound);if(!c||c.status!=="active")return;if(typeof window.synchronizeTransferDeadline==="function")window.synchronizeTransferDeadline(c);if(c.status==="active"&&typeof window.startTransferTimerLoop==="function")window.startTransferTimerLoop();else if(typeof window.renderTransferChallenge==="function")window.renderTransferChallenge(c);}function ipl(){if(performanceLifecycleInstalled)return;performanceLifecycleInstalled=true;document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="hidden"){if(typeof window.stopTransferTimerLoop==="function")window.stopTransferTimerLoop();return;}rt();});}window.initializePerformanceLifecycle=ipl;function rm(){return window.isReducedMotionPreferred();}function finishStartupPresentation(loadingScreen,app,reducedMotion){if(window.careerModeHomeHold!==0&&performance.now()<(window.careerModeHomeHold?15e3:6e3))return setTimeout(finishStartupPresentation,50,loadingScreen,app,reducedMotion);if(loadingScreen){loadingScreen.setAttribute("aria-hidden", "true");loadingScreen.setAttribute("aria-busy","false");loadingScreen.classList.add("is-exiting");}if(app){app.inert = false;app.removeAttribute("aria-hidden");}const done=()=>{if(!loadingScreen)return;loadingScreen.hidden=true;loadingScreen.classList.add("hidden");};reducedMotion?done():setTimeout(done,STARTUP_SPLASH_EXIT_MS);}function ra(){const loadingScreen=document.getElementById("loadingScreen"),app=document.getElementById("app");if(app){app.classList.remove("hidden");app.inert = true;}const reducedMotion=rm(),minimumDuration=reducedMotion?STARTUP_SPLASH_REDUCED_MS:STARTUP_SPLASH_MINIMUM_MS,elapsed=performance.now();if(loadingScreen)loadingScreen.classList.add("is-ready");setTimeout(()=>finishStartupPresentation(loadingScreen,app,reducedMotion),Math.max(0,minimumDuration-elapsed));}function sd(){const run=async()=>{try{await window.ensureDiagnosticsModule?.();window.runApplicationDiagnostics?.();}catch(error){console.warn("[Career Mode Showdown] Diagnostics could not be loaded:",error);}};typeof requestIdleCallback==="function"?requestIdleCallback(()=>run(),{timeout:2200}):setTimeout(run,350);}function so(){const load=()=>{if(window.getOfflineAppDiagnostics)return;window.careerModeHomeHold=1;const r=document.querySelector('meta[name="app-asset-revision"]').content,m=document.createElement("link"),s=document.createElement("script"),f=document.createElement("script");m.rel="manifest";m.href=`manifest.webmanifest?v=${r}`;document.head.appendChild(m);s.src=`js/offlineApp.js?v=${r}`;f.src=`js/ssjr.js?v=${r}`;document.body.append(s,f);};typeof requestIdleCallback==="function"?requestIdleCallback(load,{timeout:1200}):setTimeout(load,140);}function ri(name,initializer){if(typeof initializer!=="function")throw new Error(`Required initializer is unavailable: ${name}`);initializer();}function im(){[["initializeStorageLifecycle",window.initializeStorageLifecycle],["initializeScreens",window.initializeScreens||(typeof initializeScreens==="function"?initializeScreens:null)],["initializeMenuExperience",window.initializeMenuExperience||(typeof initializeMenuExperience==="function"?initializeMenuExperience:null)],["initializeOptionalModules",window.initializeOptionalModules],["initializePerformanceLifecycle",ipl]].forEach(([name,initializer])=>ri(name,initializer));}function sa(){if(applicationStarted)return;applicationStarted=true;installRuntimeErrorBoundary();try{im();if(!showScreen("mainMenu",false))throw new Error("Main Menu could not be opened.");}catch(error){reportApplicationError("The game did not start",error);}requestAnimationFrame(()=>{ra();so();sd();});}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",sa,{once:true}):sa();
\ No newline at end of file
+const APP_VERSION = "2.0.0";const STARTUP_SPLASH_MINIMUM_MS = 2700;const STARTUP_SPLASH_REDUCED_MS = 220;const STARTUP_SPLASH_EXIT_MS=240;const VISUAL_FIDELITY_STYLESHEET="css/visual-fidelity-r3.css?v=2.0.0-r87";const EXTERNAL_RUNTIME_ERROR=/contentScriptData\.init_ts|(?:chrome|moz|safari-web)-extension:\/\/|webkit-masked-url:\/\//i;let applicationStarted=false,runtimeNoticeTimer=null,runtimeBoundaryInstalled=false,performanceLifecycleInstalled=false,runtimeNoticeElement=null,runtimeNoticeTextElement=null,suppressedExternalRuntimeErrors=0;function iv(){if(document.querySelector('link[data-visual-fidelity="reus-r3"]'))return;const s=document.createElement("link");s.rel="stylesheet";s.href=VISUAL_FIDELITY_STYLESHEET;s.dataset.visualFidelity="reus-r3";s.addEventListener("error",()=>console.warn("[Career Mode Showdown] Reus visual fidelity stylesheet could not be loaded."),{once:true});document.head.appendChild(s);}iv();function rn(){if(runtimeNoticeElement?.isConnected)return runtimeNoticeElement;const e=document.getElementById("appRuntimeNotice");if(e){runtimeNoticeElement=e;runtimeNoticeTextElement=e.querySelector(".runtimeNoticeText");return e;}const n=document.createElement("div"),t=document.createElement("span"),b=document.createElement("button");n.id="appRuntimeNotice";n.setAttribute("role","status");n.setAttribute("aria-live","polite");t.className="runtimeNoticeText";b.type="button";b.setAttribute("aria-label","Dismiss message");b.textContent="×";b.addEventListener("click",()=>{if(runtimeNoticeTimer)clearTimeout(runtimeNoticeTimer);runtimeNoticeTimer=null;n.remove();runtimeNoticeElement=runtimeNoticeTextElement=null;});n.append(t,b);document.body.appendChild(n);runtimeNoticeElement=n;runtimeNoticeTextElement=t;return n;}function showAppNotice(message,type="error",duration=7000){const n=rn();if(n.className!==type)n.className=type;const m=String(message||"");if(runtimeNoticeTextElement&&runtimeNoticeTextElement.textContent!==m)runtimeNoticeTextElement.textContent=m;if(runtimeNoticeTimer)clearTimeout(runtimeNoticeTimer);runtimeNoticeTimer=duration>0?setTimeout(()=>{if(runtimeNoticeElement?.isConnected)runtimeNoticeElement.remove();runtimeNoticeElement=runtimeNoticeTextElement=runtimeNoticeTimer=null;},duration):null;}window.showAppNotice=showAppNotice;function reportApplicationError(c,e,q){const d=e?.message;console.error(`[Career Mode Showdown] ${c}:`,e);showAppNotice(`${c}. ${!q&&/^(?!.*permission)([A-Z][\w ',]*\. ?)+$/.test(d)?d:"Your career is safe. Try again."}`,"error",1e4);}window.reportApplicationError=reportApplicationError;function isFirstPartyRuntimeError(message="",filename="",stack=""){const evidence=`${message}\n${filename}\n${stack}`;if(EXTERNAL_RUNTIME_ERROR.test(evidence))return false;if(filename)try{if(new URL(filename,location.href).origin===location.origin)return true;}catch(error){}return String(stack||"").includes(`${location.origin}/`);}window.isFirstPartyRuntimeError=isFirstPartyRuntimeError;window.getRuntimeErrorBoundaryDiagnostics=()=>({installed:runtimeBoundaryInstalled,suppressedExternalRuntimeErrors});function installRuntimeErrorBoundary(){if(runtimeBoundaryInstalled)return;runtimeBoundaryInstalled=true;addEventListener("error",e=>{if(!e)return;const x=e.error,m=String(e.message||x?.message||""),s=typeof x?.stack==="string"?x.stack:"";if(/^ResizeObserver loop (?:completed with undelivered notifications|limit exceeded)\.?$/.test(m))return console.debug(m);if(!isFirstPartyRuntimeError(m,e.filename||"",s)){suppressedExternalRuntimeErrors++;return;}reportApplicationError("Something went wrong on this screen",x||new Error(m||"Unknown runtime error"),1);});addEventListener("unhandledrejection",e=>{const r=e?.reason,m=r?.message?String(r.message):String(r||"Unknown promise rejection"),s=typeof r?.stack==="string"?r.stack:"";if(!isFirstPartyRuntimeError(m,"",s)){suppressedExternalRuntimeErrors++;return;}reportApplicationError("Something went wrong on this screen",r,1);});}function rt(){if(!currentShowdown||typeof window.getActiveScreenName!=="function"||window.getActiveScreenName()!=="transferChallenge"||typeof getTransferChallengeForSeason!=="function")return;const c=getTransferChallengeForSeason(currentShowdown.currentRound);if(!c||c.status!=="active")return;if(typeof window.synchronizeTransferDeadline==="function")window.synchronizeTransferDeadline(c);if(c.status==="active"&&typeof window.startTransferTimerLoop==="function")window.startTransferTimerLoop();else if(typeof window.renderTransferChallenge==="function")window.renderTransferChallenge(c);}function ipl(){if(performanceLifecycleInstalled)return;performanceLifecycleInstalled=true;document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="hidden"){if(typeof window.stopTransferTimerLoop==="function")window.stopTransferTimerLoop();return;}rt();});}window.initializePerformanceLifecycle=ipl;function rm(){return window.isReducedMotionPreferred();}function finishStartupPresentation(loadingScreen,app,reducedMotion){if(window.careerModeHomeHold!==0&&performance.now()<(window.careerModeHomeHold?15e3:6e3))return setTimeout(finishStartupPresentation,50,loadingScreen,app,reducedMotion);if(loadingScreen){loadingScreen.setAttribute("aria-hidden", "true");loadingScreen.setAttribute("aria-busy","false");loadingScreen.classList.add("is-exiting");}if(app){app.inert = false;app.removeAttribute("aria-hidden");}const done=()=>{if(!loadingScreen)return;loadingScreen.hidden=true;loadingScreen.classList.add("hidden");};reducedMotion?done():setTimeout(done,STARTUP_SPLASH_EXIT_MS);}function ra(){const loadingScreen=document.getElementById("loadingScreen"),app=document.getElementById("app");if(app){app.classList.remove("hidden");app.inert = true;}const reducedMotion=rm(),minimumDuration=reducedMotion?STARTUP_SPLASH_REDUCED_MS:STARTUP_SPLASH_MINIMUM_MS,elapsed=performance.now();if(loadingScreen)loadingScreen.classList.add("is-ready");setTimeout(()=>finishStartupPresentation(loadingScreen,app,reducedMotion),Math.max(0,minimumDuration-elapsed));}function sd(){const run=async()=>{try{await window.ensureDiagnosticsModule?.();window.runApplicationDiagnostics?.();}catch(error){console.warn("[Career Mode Showdown] Diagnostics could not be loaded:",error);}};typeof requestIdleCallback==="function"?requestIdleCallback(()=>run(),{timeout:2200}):setTimeout(run,350);}function so(){const load=()=>{if(window.getOfflineAppDiagnostics)return;window.careerModeHomeHold=1;const r=document.querySelector('meta[name="app-asset-revision"]').content,m=document.createElement("link"),s=document.createElement("script"),f=document.createElement("script");m.rel="manifest";m.href=`manifest.webmanifest?v=${r}`;document.head.appendChild(m);s.src=`js/offlineApp.js?v=${r}`;f.src=`js/ssjr.js?v=${r}`;document.body.append(s,f);};typeof requestIdleCallback==="function"?requestIdleCallback(load,{timeout:1200}):setTimeout(load,140);}function ri(name,initializer){if(typeof initializer!=="function")throw new Error(`Required initializer is unavailable: ${name}`);initializer();}function im(){[["initializeStorageLifecycle",window.initializeStorageLifecycle],["initializeScreens",window.initializeScreens||(typeof initializeScreens==="function"?initializeScreens:null)],["initializeMenuExperience",window.initializeMenuExperience||(typeof initializeMenuExperience==="function"?initializeMenuExperience:null)],["initializeOptionalModules",window.initializeOptionalModules],["initializePerformanceLifecycle",ipl]].forEach(([name,initializer])=>ri(name,initializer));}function sa(){if(applicationStarted)return;applicationStarted=true;installRuntimeErrorBoundary();try{im();if(!showScreen("mainMenu",false))throw new Error("Main Menu could not be opened.");}catch(error){reportApplicationError("The game did not start",error);}requestAnimationFrame(()=>{ra();so();sd();});}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",sa,{once:true}):sa();
\ No newline at end of file
diff --git a/js/careerScreenSeam.js b/js/careerScreenSeam.js
index e5b65db395..c84ecc90c0 100644
--- a/js/careerScreenSeam.js
+++ b/js/careerScreenSeam.js
@@ -64,7 +64,7 @@
   // js/iconGuess.js fromMs (the Roster Roulette boundary; tests/contracts/r87-prime-pack-totals-contracts.cjs keeps them equal).
   const GOLDEN_SHOWDOWN=Object.freeze({seasons:10,points:110,primePackPoints:150});
   const SEASON_MAX=Object.freeze({before:11,primePack:15});
-  const PRIME_PACK_FROM_MS=Date.parse("2026-10-30T00:00:00Z");
+  const PRIME_PACK_FROM_MS=Date.parse("2026-11-01T17:00:00Z");
   const PAIR_ID=/^pair_[0-9a-f]{64}$/;
   function csSeasonScores(row){
     const out=[];
diff --git a/js/commentaryV3.js b/js/commentaryV3.js
index b1d68c05b2..ff60a8cf4b 100644
--- a/js/commentaryV3.js
+++ b/js/commentaryV3.js
@@ -32,7 +32,7 @@
   const LENGTHS=Object.freeze([1,3,5,10]);
   const MAX=11,PACK_MAX=15;
   // The Prime Pack boundary is js/iconGuess.js fromMs: a Showdown confirmed on or after it plays Prime Pack.
-  const PRIME_PACK_FROM_MS=Date.parse("2026-10-30T00:00:00Z");
+  const PRIME_PACK_FROM_MS=Date.parse("2026-11-01T17:00:00Z");
   const node=typeof module!=="undefined"&&module.exports;
   const other=role=>role==="playerOne"?"playerTwo":"playerOne";
   const int=(x,lo,hi)=>Number.isInteger(x)&&x>=lo&&x<=hi;
diff --git a/js/iconGuess.js b/js/iconGuess.js
index 2356a16623..d6ce9654a2 100644
--- a/js/iconGuess.js
+++ b/js/iconGuess.js
@@ -52,7 +52,7 @@
   // like Roster Roulette, so one Showdown never mixes 11-point and 15-point seasons. ICON_FROM_MS is the same boundary as
   // js/rosterRouletteStep.js RRR_FROM_MS (a contract keeps them equal); the r87 release PR pins both to the release time.
   // Do not change it outside the release PR.
-  const ICON_FROM_MS=Date.parse("2026-10-30T00:00:00Z");
+  const ICON_FROM_MS=Date.parse("2026-11-01T17:00:00Z");
 
   // ---------- the draw ----------
   // The id's first hex digit is the season count (js/persistentNikDanielPair.js), so it is left out: a new season must
diff --git a/js/menuExperience.js b/js/menuExperience.js
index 741cbc2695..311bf81153 100644
--- a/js/menuExperience.js
+++ b/js/menuExperience.js
@@ -1,5 +1,5 @@
 const MARCO_REUS_IMAGE = Object.freeze({
-    thumbnail: "assets/marco-reus-2015-cc-by.webp?v=1.9.10-r86",
+    thumbnail: "assets/marco-reus-2015-cc-by.webp?v=2.0.0-r87",
     source: "https://commons.wikimedia.org/wiki/File:Marco_Reus_(16204330530)_(cropped).jpg",
     license: "https://creativecommons.org/licenses/by/2.0/"
 });
diff --git a/js/productionSharedSeasonResults.js b/js/productionSharedSeasonResults.js
index a75908bfb5..26e4662c27 100644
--- a/js/productionSharedSeasonResults.js
+++ b/js/productionSharedSeasonResults.js
@@ -181,7 +181,7 @@
   // by the stage of his right guess (the Rules accept it only when the round record names him and its server time gives N). Read once from the round record, only for a Showdown that plays
   // Prime Pack; an older Showdown never loads the step or reads anything. A read that fails stops the publish (TRY AGAIN),
   // so a won point is never dropped by a bad connection.
-  const PRIME_PACK_FROM_MS=Date.parse("2026-10-30T00:00:00Z");
+  const PRIME_PACK_FROM_MS=Date.parse("2026-11-01T17:00:00Z");
   async function pssrWithPrimePack(ctx,request,result){
     const confirmedAtMs=pssrSetupState()?.setupUpdatedAtMs;
     // Old Showdowns never load the step (the same boundary as js/iconGuess.js fromMs; a contract keeps them equal).
diff --git a/js/productionSharedTransferChallenge.js b/js/productionSharedTransferChallenge.js
index 6a609de979..3ead6bcc76 100644
--- a/js/productionSharedTransferChallenge.js
+++ b/js/productionSharedTransferChallenge.js
@@ -24,7 +24,7 @@
   // The reason the roulette could not start on this phone (shown on the dashboard and on Career Start), or "" (Fable F2-05).
   let rouletteError="",primePackLoadError=false;
   const PSTC_PRIME_PACK_TEXT="Prime Pack could not load. Check the connection and tap again.";
-  const PRIME_PACK_FROM_MS=Date.parse("2026-10-30T00:00:00Z");
+  const PRIME_PACK_FROM_MS=Date.parse("2026-11-01T17:00:00Z");
   const PSTC_ROULETTE_TEXT=Object.freeze({
     load:"The roulette could not load. Check the connection and tap again.",
     setup:"This season's roulette needs the Showdown's confirmed Setup, and it could not be read just now. Tap again to retry.",
diff --git a/js/rosterRouletteStep.js b/js/rosterRouletteStep.js
index e1f46085c5..645c68864f 100644
--- a/js/rosterRouletteStep.js
+++ b/js/rosterRouletteStep.js
@@ -19,10 +19,10 @@
   const PAGE="visual-assets/v10_1/roulette/index.html";
   const STAGE_ID="rrStage",PANEL_ID="rrStepPanel";
   const DONE_KEY="careerModeShowdown.rouletteDone.v1",WATCHED_KEY="careerModeShowdown.rouletteWatched.v1",KEYS_MAX=60;
-  // RRR_FROM_MS is set to the r87 release time in the release PR (red team R87-C-07: the placeholder below is earlier than
-  // the r86 boundary, js/marqueePlayer.js MARQUEE_FROM_MS 03:00 UTC that day, so until the release PR pins it, r86
-  // Showdowns confirmed after midnight would get a roulette). Do not change it outside the release PR.
-  const RRR_FROM_MS=Date.parse("2026-10-30T00:00:00Z");
+  // RRR_FROM_MS is the 2.0.0 release time (red team R87-C-07): a Showdown confirmed before it (played on 1.9.10) gets no
+  // roulette. It and js/sparkSharedTransferChallenge.js ROULETTE_FROM_MS are one value, set only by
+  // `node tools/set-release-time.cjs <UTC time>` (release contract RX2 checks they match).
+  const RRR_FROM_MS=Date.parse("2026-11-01T17:00:00Z");
   const MIN_LOADING_MS=1000,MAX_LOADING_MS=15000,LOAD_WAIT_MS=10000,ARMED_WAIT_MS=5000;
   const ROLES=Object.freeze(["playerOne","playerTwo"]),NAMES=Object.freeze({playerOne:"Daniel",playerTwo:"Nik"});
   const sceneFailedHere=new Set();
@@ -42,12 +42,15 @@
   async function rrsLoad(key,path,ready){if(ready())return true;if(typeof root.loadRuntimeScript!=="function")return false;await root.loadRuntimeScript(key,path,ready);return Boolean(ready());}
   // The Special Player draw (data/marqueePlayers.js + js/marqueePlayer.js), also wanted by the Transfer War signing form
   // (R87-SP-02) when this season's roulette is already done on this browser (Fable F2-06).
+  // Fable F6-05: the load wait counts only time the page is on screen (rrsVisibleWait), so a phone locked on a cold cache
+  // does not come back to "The roulette could not load".
+  function rrsLoadWait(loads){let stop=()=>{};const timeout=new Promise(resolve=>{stop=rrsVisibleWait(LOAD_WAIT_MS,()=>resolve(false));});return Promise.race([loads,timeout]).finally(()=>stop());}
   function rrsEnsureDraw(){
     const loads=Promise.all([
       rrsLoad("marquee-player-list","data/marqueePlayers.js",()=>Boolean(root.CareerModeMarqueePlayers)),
       rrsLoad("marquee-player","js/marqueePlayer.js",()=>Boolean(root.CareerModeMarqueePlayer))
     ]).then(list=>list.every(Boolean),()=>false);
-    return Promise.race([loads,rrsWait(LOAD_WAIT_MS).then(()=>false)]);
+    return rrsLoadWait(loads);
   }
   async function rrsEnsure(){
     const loads=Promise.all([
@@ -58,7 +61,7 @@
       rrsLoad("marquee-player","js/marqueePlayer.js",()=>Boolean(root.CareerModeMarqueePlayer)),
       typeof root.loadRuntimeStyle==="function"?Promise.resolve(root.loadRuntimeStyle("roulette-step","css/v10Roulette.css")).then(()=>true,()=>true):true
     ]).then(list=>list.every(Boolean),()=>false);
-    return Promise.race([loads,rrsWait(LOAD_WAIT_MS).then(()=>false)]);
+    return rrsLoadWait(loads);
   }
 
   // ctx = {rivalryId, managerRole, season, clubs:{playerOne,playerTwo}, confirmedAtMs, phase, verdicts(k)} from the Transfer
diff --git a/js/sharedCareerAnalytics.js b/js/sharedCareerAnalytics.js
index 689b29238b..827eee5e71 100644
--- a/js/sharedCareerAnalytics.js
+++ b/js/sharedCareerAnalytics.js
@@ -74,7 +74,7 @@
   }
   // r87 Prime Pack: a perfect season is the Showdown's own maximum, 15 for a Showdown confirmed on or after the Prime Pack
   // boundary (js/iconGuess.js fromMs) and 11 before it; with no confirm time, a season with Prime Pack or above 11 means 15.
-  const PRIME_PACK_FROM_MS=Date.parse("2026-10-30T00:00:00Z");
+  const PRIME_PACK_FROM_MS=Date.parse("2026-11-01T17:00:00Z");
   function seasonMaxOf(entry,seasons){
     if(Number.isFinite(entry.setupConfirmedAt))return entry.setupConfirmedAt>=PRIME_PACK_FROM_MS?15:11;
     return seasons.some(season=>ROLES.some(role=>season[role]&&(season[role].primePack!==undefined||season[role].scoring.total>11)))?15:11;
diff --git a/js/sparkSharedTransferChallenge.js b/js/sparkSharedTransferChallenge.js
index e38c284673..49888a999d 100644
--- a/js/sparkSharedTransferChallenge.js
+++ b/js/sparkSharedTransferChallenge.js
@@ -59,7 +59,8 @@
   function stspEpoch(value){const n=Number(value===undefined?Date.now():value);if(!Number.isSafeInteger(n)||n<0)stspFail("TRANSFER_CLOCK_INVALID");return n;}
   // RT5-FLOW-02 eligibility, shared by this provider, the Transfer Challenge UI and (by its fromMs) js/rosterRouletteStep.js:
   // the roulette runs for a Showdown whose Setup was confirmed at or after RRR_FROM_MS, unless CMS_ROSTER_ROULETTE is "off".
-  const ROULETTE_FROM_MS=Date.parse("2026-10-30T00:00:00Z");
+  // The 2.0.0 release time, set with RRR_FROM_MS by `node tools/set-release-time.cjs <UTC time>`.
+  const ROULETTE_FROM_MS=Date.parse("2026-11-01T17:00:00Z");
   function stspRouletteEligible(confirmedAtMs){return Number.isFinite(confirmedAtMs)&&confirmedAtMs>=ROULETTE_FROM_MS&&root.CMS_ROSTER_ROULETTE!=="off";}
   function stspTimestampMillis(value){if(value&&typeof value.toMillis==="function")return value.toMillis();if(value instanceof Date)return value.getTime();return Number.NaN;}
   function stspTimestamp(sdk,epoch){if(!sdk.Timestamp||typeof sdk.Timestamp.fromMillis!=="function")stspFail("TRANSFER_PROVIDER_UNAVAILABLE");return sdk.Timestamp.fromMillis(epoch);}
diff --git a/js/touchlineGazette.js b/js/touchlineGazette.js
index e8fa0fe7b9..fceef8cd7f 100644
--- a/js/touchlineGazette.js
+++ b/js/touchlineGazette.js
@@ -34,7 +34,7 @@
   // r87 Prime Pack (G Lead and Nik 2026-11-01): a Showdown that plays Prime Pack scores up to 15 a season (11 + up to 4), so
   // its race counts 15 a season left and its Golden Showdown is 150; a Showdown confirmed before Prime Pack keeps 11 and 110.
   // PRIME_PACK_FROM_MS is js/iconGuess.js fromMs (tests/contracts/r87-prime-pack-totals-contracts.cjs keeps them equal).
-  const SEASON_MAX=Object.freeze({before:11,primePack:15}),PRIME_PACK_FROM_MS=Date.parse("2026-10-30T00:00:00Z");
+  const SEASON_MAX=Object.freeze({before:11,primePack:15}),PRIME_PACK_FROM_MS=Date.parse("2026-11-01T17:00:00Z");
   // true/false when this Showdown's confirm time is known (given, or the live Setup when it is this Showdown), else null.
   function tgPrimePack(rivalryId,confirmedAt){
     if(Number.isFinite(confirmedAt))return confirmedAt>=PRIME_PACK_FROM_MS;
diff --git a/manifest.webmanifest b/manifest.webmanifest
index 8a7c14150d..30b265ccbd 100644
--- a/manifest.webmanifest
+++ b/manifest.webmanifest
@@ -10,8 +10,8 @@
   "theme_color": "#20272d",
   "orientation": "any",
   "icons": [
-    {"src": "assets/icons/showdown-192.svg?v=1.9.10-r86", "sizes": "192x192", "type": "image/svg+xml", "purpose": "any"},
-    {"src": "assets/icons/showdown-512.svg?v=1.9.10-r86", "sizes": "512x512", "type": "image/svg+xml", "purpose": "any"},
-    {"src": "assets/icons/showdown-maskable-512.svg?v=1.9.10-r86", "sizes": "512x512", "type": "image/svg+xml", "purpose": "maskable"}
+    {"src": "assets/icons/showdown-192.svg?v=2.0.0-r87", "sizes": "192x192", "type": "image/svg+xml", "purpose": "any"},
+    {"src": "assets/icons/showdown-512.svg?v=2.0.0-r87", "sizes": "512x512", "type": "image/svg+xml", "purpose": "any"},
+    {"src": "assets/icons/showdown-maskable-512.svg?v=2.0.0-r87", "sizes": "512x512", "type": "image/svg+xml", "purpose": "maskable"}
   ]
 }
diff --git a/package.json b/package.json
index 8f93920e81..b222e446c8 100644
--- a/package.json
+++ b/package.json
@@ -1,6 +1,6 @@
 {
   "name": "career-mode-showdown",
-  "version": "1.9.10",
+  "version": "2.0.0",
   "private": true,
   "description": "Repository-owned stability and browser validation for Career Mode Showdown.",
   "scripts": {
@@ -68,7 +68,27 @@
     "validate:ssjr-physical-journey": "node scripts/validate-ssjr-physical-journey-evidence.mjs",
     "test:persistent-pair-routing": "node tests/browser/persistent-pair-user-facing-routing-audit.cjs",
     "ssjr2:credit": "node scripts/ssjr2-physical-run-credit.mjs",
-    "test:r83-gallery-layout": "node tests/browser/r83-gallery-layout-audit.cjs"
+    "test:r83-gallery-layout": "node tests/browser/r83-gallery-layout-audit.cjs",
+    "test:r87:release": "node tests/contracts/r86-release-contracts.cjs && node tests/contracts/r87-upgrade-rollback-list-contracts.cjs && node tools/set-release-time.cjs",
+    "test:r87:upgrade": "node tests/browser/r87-upgrade-from-r86-audit.cjs",
+    "test:r87:ce2pg10": "CE2PG_PLAN=single CE2PG_SEASONS=10 NODE_OPTIONS=\"--require ./tests/browser/support/ce2pg-roulette-observer.cjs\" node tests/browser/ce2pg-journey.cjs",
+    "test:r87:lengths": "CE2PG_PLAN=single CE2PG_SEASONS=1 NODE_OPTIONS=\"--require ./tests/browser/support/ce2pg-roulette-observer.cjs\" node tests/browser/ce2pg-journey.cjs && CE2PG_PLAN=single CE2PG_SEASONS=3 NODE_OPTIONS=\"--require ./tests/browser/support/ce2pg-roulette-observer.cjs\" node tests/browser/ce2pg-journey.cjs && CE2PG_PLAN=single CE2PG_SEASONS=5 NODE_OPTIONS=\"--require ./tests/browser/support/ce2pg-roulette-observer.cjs\" node tests/browser/ce2pg-journey.cjs",
+    "test:r87:leak-soak": "CE2PG_PORT_BASE=9810 CE2PG_APP_PORT=4911 node tests/browser/ce2pg-leak-soak.cjs",
+    "test:r87:oracle": "node tests/browser/career-oracle.cjs",
+    "test:r87:finish": "R87FR_SEASONS=1 node tests/browser/r87-finish-rematch-proof.cjs && R87FR_SEASONS=1 R87FR_SCENARIO=draw node tests/browser/r87-finish-rematch-proof.cjs",
+    "test:r87:privacy": "npx --yes firebase-tools@15.28.1 emulators:exec --only firestore --project demo-cms-r87-guess-privacy \"node tests/firebase/r87-guess-privacy-emulator.cjs\" && node tests/browser/r87-guess-privacy-audit.cjs",
+    "test:r87:clocks": "node tests/contracts/r87-dst-clock-change-contracts.cjs && node tests/contracts/r87-terminal-close-clock-contracts.cjs && npx --yes firebase-tools@15.28.1 emulators:exec --only firestore --project demo-cms-r87-clock-skew \"node tests/firebase/r87-device-clock-skew-emulator.cjs\"",
+    "test:r87:pairing": "node tests/contracts/r87-fable-pairing-fixes-contracts.cjs && CMS_CHROMIUM_MULTI_CONTEXT=1 npx --yes firebase-tools@15.28.1 emulators:exec --config tests/browser/support/firebase.browser-journey.json --only auth,firestore --project demo-cms-browser-journey \"node tests/browser/r87-pairing-edges-audit.cjs\"",
+    "test:r87:scoring": "node tests/contracts/r87-scoring-everywhere-contracts.cjs",
+    "test:r87:sizes": "node tests/browser/r87-proof-sizes-tour.cjs",
+    "test:r87:history-scale": "node tests/contracts/r87-history-scale-contracts.cjs && node tests/support/with-static-server.cjs \"node tests/browser/r87-history-scale-audit.cjs\"",
+    "test:r87:roulette": "node tests/contracts/r87-roster-roulette-contracts.cjs && node tests/contracts/r87-roulette-board-invariants-contracts.cjs && node tests/contracts/r87-roulette-hits-contracts.cjs && node tests/contracts/r87-wait-both-spins-contracts.cjs && npx --yes firebase-tools@15.28.1 emulators:exec --only firestore --project demo-cms-roulette-reads \"node tests/firebase/r87-roulette-history-reads-emulator.cjs\"",
+    "test:r87:fable": "node tests/contracts/r87-fable-step-contracts.cjs && node tests/contracts/r87-fable-pairing-fixes-contracts.cjs && node tests/contracts/r87-fable3-meter-fixes-contracts.cjs && node tests/contracts/r87-reads-sp-fixes-contracts.cjs",
+    "test:r87:reads-meter": "node tests/contracts/r87-shared-reads-meter-contracts.cjs && npx --yes firebase-tools@15.28.1 emulators:exec --only firestore --project demo-cms-reads-meter \"node tests/firebase/shared-reads-meter-emulator.cjs\"",
+    "test:r87:career-fixes": "node tests/contracts/r87-career-fixes-contracts.cjs && node tests/contracts/r87-career-fixes-browser-contracts.cjs && node tests/contracts/r87-career-fixes-browser-nav-contracts.cjs && node tests/contracts/r87-career-fixes-lane-c-browser-contracts.cjs && node tests/contracts/r87-career-start-b-contracts.cjs && node tests/contracts/r87-rematch-contracts.cjs",
+    "test:r87:polish": "node tests/contracts/r87-polish-final-contracts.cjs && node tests/contracts/r87-polish-matchday-contracts.cjs && node tests/contracts/r87-transition-gate-contracts.cjs && node tests/support/with-static-server.cjs \"node tests/browser/r87-transition-speed-audit.cjs\"",
+    "test:r87:commentary-v3": "node tests/contracts/r87-commentary-v3-contracts.cjs && node tests/support/with-static-server.cjs \"node tests/browser/r87-commentary-v3-audit.cjs && node tests/browser/r87-commentary-v3-final-audit.cjs\"",
+    "test:r87:gazette": "node tests/contracts/r87-gazette-contracts.cjs && node tests/contracts/r87-deadline-day-contracts.cjs"
   },
   "devDependencies": {
     "@sparticuz/chromium": "149.0.0",
diff --git a/service-worker.js b/service-worker.js
index 441f1fe51b..2cf8a8c473 100644
--- a/service-worker.js
+++ b/service-worker.js
@@ -1,5 +1,5 @@
-const RUNTIME_REVISION = "1.9.10-r86";
-const PREVIOUS_RUNTIME_REVISION = "1.9.9-r85";
+const RUNTIME_REVISION = "2.0.0-r87";
+const PREVIOUS_RUNTIME_REVISION = "1.9.10-r86";
 const CACHE_PREFIX = "career-mode-showdown-shell-";
 const MODE_CACHE_PREFIX = "career-mode-showdown-runtime-mode-";
 const CACHE_NAME = `${CACHE_PREFIX}${RUNTIME_REVISION}`;
@@ -172,12 +172,6 @@ const SHELL_PATHS = Object.freeze([
     "js/productionFirebaseRuntime.js",
     "js/fullMotionHonor.js",
     "js/ssjr.js",
-    "js/ssjrProductionAcceptanceRecorder.js",
-    "js/ssjrProductionNegativeProbeRunner.js",
-    "js/ssjrProductionNegativeEvidence.js",
-    "js/stage5fProductionAuthenticatedNegatives.js",
-    "js/ssjrAcceptancePolishedBridge.js",
-    "js/ssjrPhysicalJourneyAcceptance.js",
     "js/productionSharedJourneyEntry.js",
     "js/productionSharedJourneyGuard.js",
     "js/productionSharedShowdownPresentation.js",
@@ -218,7 +212,6 @@ const SHELL_PATHS = Object.freeze([
     "js/sharedTerminalClose.js",
     "js/sparkTerminalClose.js",
     "js/productionSharedTerminalClose.js",
-    "js/remoteJoiningAcceptance.js",
     "js/sparkRemoteJoining.js",
     "js/sparkAccountBootstrap.js",
     "js/sparkConnectedAccount.js",
@@ -338,17 +331,18 @@ const SHELL_PATHS = Object.freeze([
 const SHELL_PATH_SET = new Set(SHELL_PATHS);
 // The retained previous shell was installed by its own worker with its own list, so it is verified against that list, not
 // this one: checked against SHELL_PATHS it would lack this release's new files, fail, and be deleted on activation, leaving
-// nothing to roll back to. Each release lists here the shell paths it added since PREVIOUS_RUNTIME_REVISION (and empties
-// the set when it changes PREVIOUS_RUNTIME_REVISION again). r80 adds no shell path to r79's 221 paths and removes none.
-// r86: PREVIOUS is now r85, whose own list already holds the music player; these are the six files r86 adds to its 222.
-// r87 (until its own release moves PREVIOUS to r86): r86's six, plus the Deadline Day strip and lines and the Russian Roster
-// Roulette step, engine, squads, styles and Team V's page with its vendored three.js.
-// r87 Touchline Gazette (Nik 2026-10-31): its page script, copy, headline pack, styles, Team V's paper and sheet and the
-// seven OFL Gazette fonts (licences beside them). Its press photos are Team V images (V10_IMAGE_PATH, runtime cache).
-// r87 first load: Google Fonts' Barlow Condensed sheet and its nine files, now served from this site.
-// r87 Prime Pack: its step, round engine, name matcher, Icon list and page.
-const SHELL_PATHS_ADDED_SINCE_PREVIOUS = new Set(["js/careerSummaryStore.js","js/specialPlayerReveal.js","visual-assets/v10_1/special-player/index.html","js/marqueePlayer.js","data/marqueePlayers.js","js/specialPlayerChip.js","js/rosterRouletteStep.js","js/rosterRoulette.js","data/rosterSquads.js","css/v10Roulette.css","visual-assets/v10_1/roulette/index.html","visual-assets/v10_1/roulette/platemap.json","visual-assets/v10_1/roulette/vendor/three-r128.min.js","visual-assets/v10_1/roulette/vendor/THREE_LICENSE.txt","visual-assets/v10_1/roulette/assets/squads.json","js/deadlineDay.js","data/deadlineDayLines.js","data/fifa17Players.js","js/touchlineGazette.js","data/gazetteCopy.js","data/frontPages.js","css/v10Gazette.css","visual-assets/v10_1/content/content.css","visual-assets/v10_1/content/frontpage.js","visual-assets/v10_1/content/gazette/fonts/unifrakturmaguntia-latin-400-normal.woff2","visual-assets/v10_1/content/gazette/fonts/playfair-display-latin-700-normal.woff2","visual-assets/v10_1/content/gazette/fonts/playfair-display-latin-900-normal.woff2","visual-assets/v10_1/content/gazette/fonts/playfair-display-latin-400-italic.woff2","visual-assets/v10_1/content/gazette/fonts/old-standard-tt-latin-400-normal.woff2","visual-assets/v10_1/content/gazette/fonts/old-standard-tt-latin-400-italic.woff2","visual-assets/v10_1/content/gazette/fonts/old-standard-tt-latin-700-normal.woff2","visual-assets/v10_1/content/gazette/fonts/LICENSE-unifrakturmaguntia.txt","visual-assets/v10_1/content/gazette/fonts/LICENSE-playfair-display.txt","visual-assets/v10_1/content/gazette/fonts/LICENSE-old-standard-tt.txt","js/commentaryV3.js","js/commentaryEngine.js","data/commentaryLines.js","assets/fonts/barlow-condensed.css","assets/fonts/barlow-condensed-vietnamese-600-normal.woff2","assets/fonts/barlow-condensed-vietnamese-700-normal.woff2","assets/fonts/barlow-condensed-vietnamese-800-normal.woff2","assets/fonts/barlow-condensed-latin-ext-600-normal.woff2","assets/fonts/barlow-condensed-latin-ext-700-normal.woff2","assets/fonts/barlow-condensed-latin-ext-800-normal.woff2","assets/fonts/barlow-condensed-latin-600-normal.woff2","assets/fonts/barlow-condensed-latin-700-normal.woff2","assets/fonts/barlow-condensed-latin-800-normal.woff2","js/iconGuessStep.js","js/iconGuess.js","js/iconNames.js","data/icons.js","visual-assets/v10_1/icon-guess/index.html"]);
-const PREVIOUS_SHELL_PATHS = Object.freeze(SHELL_PATHS.filter(path=>!SHELL_PATHS_ADDED_SINCE_PREVIOUS.has(path)));
+// nothing to roll back to. Each release lists here the shell paths it added since PREVIOUS_RUNTIME_REVISION and the ones it
+// removed, so PREVIOUS_SHELL_PATHS is exactly the list that build precached (tests/fixtures/shell-paths/<revision>.json).
+// A release that moves PREVIOUS_RUNTIME_REVISION again resets BOTH sets to what it adds and removes since that revision.
+// 2.0.0 (r87): PREVIOUS is 1.9.10-r86 (228 paths). Added: Deadline Day, the Russian Roster Roulette step, engine, squads,
+// styles and Team V's page with its vendored three.js, the Touchline Gazette (page script, copy, headline pack, styles, paper,
+// sheet and its seven OFL fonts with licences), Commentary v3, the self-hosted Barlow Condensed sheet with its nine files (first load), and Prime Pack's step, round
+// engine, name matcher, Icon list and page (its pictures are Team V images, V10_IMAGE_PATH runtime cache). Removed (arch audit D1): the seven
+// acceptance-only scripts that load only behind ?ssjr, ?ssjr-acceptance or ?rjr-acceptance; they are no longer precached
+// and come from the shell of the revision that asks for them, else the network (SHELL_PATHS_REMOVED_SINCE_PREVIOUS below).
+const SHELL_PATHS_ADDED_SINCE_PREVIOUS = new Set(["assets/fonts/barlow-condensed.css", "assets/fonts/barlow-condensed-vietnamese-600-normal.woff2", "assets/fonts/barlow-condensed-vietnamese-700-normal.woff2", "assets/fonts/barlow-condensed-vietnamese-800-normal.woff2", "assets/fonts/barlow-condensed-latin-ext-600-normal.woff2", "assets/fonts/barlow-condensed-latin-ext-700-normal.woff2", "assets/fonts/barlow-condensed-latin-ext-800-normal.woff2", "assets/fonts/barlow-condensed-latin-600-normal.woff2", "assets/fonts/barlow-condensed-latin-700-normal.woff2", "assets/fonts/barlow-condensed-latin-800-normal.woff2", "js/deadlineDay.js", "data/deadlineDayLines.js", "js/rosterRouletteStep.js", "js/rosterRoulette.js", "data/rosterSquads.js", "data/fifa17Players.js", "css/v10Roulette.css", "visual-assets/v10_1/roulette/index.html", "visual-assets/v10_1/roulette/platemap.json", "visual-assets/v10_1/roulette/vendor/three-r128.min.js", "visual-assets/v10_1/roulette/vendor/THREE_LICENSE.txt", "visual-assets/v10_1/roulette/assets/squads.json", "js/touchlineGazette.js", "js/commentaryV3.js", "js/commentaryEngine.js", "data/commentaryLines.js", "data/gazetteCopy.js", "data/frontPages.js", "css/v10Gazette.css", "visual-assets/v10_1/content/content.css", "visual-assets/v10_1/content/frontpage.js", "visual-assets/v10_1/content/gazette/fonts/unifrakturmaguntia-latin-400-normal.woff2", "visual-assets/v10_1/content/gazette/fonts/playfair-display-latin-700-normal.woff2", "visual-assets/v10_1/content/gazette/fonts/playfair-display-latin-900-normal.woff2", "visual-assets/v10_1/content/gazette/fonts/playfair-display-latin-400-italic.woff2", "visual-assets/v10_1/content/gazette/fonts/old-standard-tt-latin-400-normal.woff2", "visual-assets/v10_1/content/gazette/fonts/old-standard-tt-latin-400-italic.woff2", "visual-assets/v10_1/content/gazette/fonts/old-standard-tt-latin-700-normal.woff2", "visual-assets/v10_1/content/gazette/fonts/LICENSE-unifrakturmaguntia.txt", "visual-assets/v10_1/content/gazette/fonts/LICENSE-playfair-display.txt", "visual-assets/v10_1/content/gazette/fonts/LICENSE-old-standard-tt.txt", "js/iconGuessStep.js", "js/iconGuess.js", "js/iconNames.js", "data/icons.js", "visual-assets/v10_1/icon-guess/index.html"]);
+const SHELL_PATHS_REMOVED_SINCE_PREVIOUS = new Set(["js/ssjrProductionAcceptanceRecorder.js","js/ssjrProductionNegativeProbeRunner.js","js/ssjrProductionNegativeEvidence.js","js/stage5fProductionAuthenticatedNegatives.js","js/ssjrAcceptancePolishedBridge.js","js/ssjrPhysicalJourneyAcceptance.js","js/remoteJoiningAcceptance.js"]);
+const PREVIOUS_SHELL_PATHS = Object.freeze([...SHELL_PATHS.filter(path=>!SHELL_PATHS_ADDED_SINCE_PREVIOUS.has(path)),...SHELL_PATHS_REMOVED_SINCE_PREVIOUS]);
 function shellPathsForRevision(revision){ return revision&&revision!==RUNTIME_REVISION&&revision===PREVIOUS_RUNTIME_REVISION?PREVIOUS_SHELL_PATHS:SHELL_PATHS; }
 
 function scopeUrl(path = ""){
@@ -461,7 +455,7 @@ self.addEventListener("fetch",event=>{
         if(SHELL_FRAME_NAVIGATION_PATHS.has(path)){ event.respondWith((async()=>{ const selected=await chooseNavigationRuntime(); const cached=selected?await cachedShellResponse(path,selected.revision):null; return cached||fetch(request); })()); return; }
         event.respondWith((async()=>{ const selected=await chooseNavigationRuntime(); if(selected){const cached=await cachedShellResponse("index.html",selected.revision);if(cached){return cached;}} return fetch(request); })()); return;
     }
-    const path=relativeScopePath(url); if(!path){return;} if(isV10ImagePath(path)){ event.respondWith(v10ImageResponse(event,request,path)); return; } if(NETWORK_ONLY_ASSET_PATHS.has(path)){ event.respondWith(fetch(networkOnlyRequest(request))); return; } if(path===RUNTIME_CONFIG_PATH){return;} if(path===APP_CHECK_BOOTSTRAP_PATH){return;} if(UNVERSIONED_SHELL_ASSET_PATHS.has(path)&&!url.searchParams.get("v")){ event.respondWith(unversionedShellResponse(request,path)); return; } const requestedRevision=url.searchParams.get("v")||""; if(!requestedRevision){return;}
+    const path=relativeScopePath(url); if(!path){return;} if(isV10ImagePath(path)){ event.respondWith(v10ImageResponse(event,request,path)); return; } if(NETWORK_ONLY_ASSET_PATHS.has(path)){ event.respondWith(fetch(networkOnlyRequest(request))); return; } if(SHELL_PATHS_REMOVED_SINCE_PREVIOUS.has(path)){ const asked=url.searchParams.get("v")||""; event.respondWith((async()=>{ const cached=asked&&asked!==RUNTIME_REVISION?await cachedShellResponse(path,asked):null; return cached||fetch(networkOnlyRequest(request)); })()); return; } if(path===RUNTIME_CONFIG_PATH){return;} if(path===APP_CHECK_BOOTSTRAP_PATH){return;} if(UNVERSIONED_SHELL_ASSET_PATHS.has(path)&&!url.searchParams.get("v")){ event.respondWith(unversionedShellResponse(request,path)); return; } const requestedRevision=url.searchParams.get("v")||""; if(!requestedRevision){return;}
     event.respondWith((async()=>{const cached=await cachedShellResponse(path,requestedRevision);return cached||Response.error();})());
 });
 self.__CMS_SERVICE_WORKER_DIAGNOSTICS__=Object.freeze({revision:RUNTIME_REVISION,previousRevision:PREVIOUS_RUNTIME_REVISION,cacheName:CACHE_NAME,previousCacheName:PREVIOUS_CACHE_NAME,modeCacheName:MODE_CACHE_NAME,shellPaths:SHELL_PATHS,previousShellPaths:PREVIOUS_SHELL_PATHS});
\ No newline at end of file
diff --git a/tools/set-release-time.cjs b/tools/set-release-time.cjs
new file mode 100644
index 0000000000..f409eeb29e
--- /dev/null
+++ b/tools/set-release-time.cjs
@@ -0,0 +1,36 @@
+#!/usr/bin/env node
+"use strict";
+// 2.0.0 release time: the one place the lead sets it at freeze. Every start constant that must equal the release time is
+// listed here; the release contract (tests/contracts/r86-release-contracts.cjs RR5) fails if any of them differ.
+//   node tools/set-release-time.cjs 2026-11-01T17:00:00Z   (sets them all)
+//   node tools/set-release-time.cjs                        (prints them)
+const fs=require("node:fs");
+const path=require("node:path");
+const ROOT=path.resolve(__dirname,"..");
+const RELEASE_TIME_CONSTANTS=Object.freeze([
+  {file:"js/rosterRouletteStep.js",name:"RRR_FROM_MS"},
+  {file:"js/sparkSharedTransferChallenge.js",name:"ROULETTE_FROM_MS"},
+  // Prime Pack (#1149): the guessing round and every 15-a-season total start with the same Showdowns as the roulette.
+  {file:"js/iconGuess.js",name:"ICON_FROM_MS"},
+  {file:"js/careerScreenSeam.js",name:"PRIME_PACK_FROM_MS"},
+  {file:"js/touchlineGazette.js",name:"PRIME_PACK_FROM_MS"},
+  {file:"js/sharedCareerAnalytics.js",name:"PRIME_PACK_FROM_MS"},
+  {file:"js/productionSharedTransferChallenge.js",name:"PRIME_PACK_FROM_MS"},
+  {file:"js/productionSharedSeasonResults.js",name:"PRIME_PACK_FROM_MS"},
+  {file:"js/commentaryV3.js",name:"PRIME_PACK_FROM_MS"},
+  // Special Player from the manager's own club (#1173).
+  {file:"js/marqueePlayer.js",name:"OWN_CLUB_FROM_MS"}
+]);
+// js/marqueePlayer.js MARQUEE_FROM_MS is r86's own boundary and is never moved.
+const NOT_RELEASE_TIME=Object.freeze(["MARQUEE_FROM_MS"]);
+const pattern=name=>new RegExp(`(\\b${name}=Date\\.parse\\(")([^"]+)("\\);)`);
+function read(){return RELEASE_TIME_CONSTANTS.map(c=>{const source=fs.readFileSync(path.join(ROOT,c.file),"utf8"),m=pattern(c.name).exec(source);if(!m)throw new Error(`${c.file}: no ${c.name}=Date.parse("...") literal`);return {...c,value:m[2]};});}
+if(require.main===module){
+  const at=process.argv[2];
+  if(at){
+    if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(at)||!Number.isFinite(Date.parse(at))){console.error(`not a UTC time like 2026-11-01T17:00:00Z: ${at}`);process.exit(1);}
+    for(const c of RELEASE_TIME_CONSTANTS){const file=path.join(ROOT,c.file),source=fs.readFileSync(file,"utf8");if(!pattern(c.name).test(source))throw new Error(`${c.file}: no ${c.name} literal`);fs.writeFileSync(file,source.replace(pattern(c.name),`$1${at}$3`));}
+  }
+  for(const c of read())console.log(`${c.value}  ${c.name}  ${c.file}`);
+}
+module.exports={RELEASE_TIME_CONSTANTS,NOT_RELEASE_TIME,read};

```


## FILE: service-worker.js (at 443486cb84fffcb344409e84e12e2e7245e936cd)
```
const RUNTIME_REVISION = "2.0.0-r87";
const PREVIOUS_RUNTIME_REVISION = "1.9.10-r86";
const CACHE_PREFIX = "career-mode-showdown-shell-";
const MODE_CACHE_PREFIX = "career-mode-showdown-runtime-mode-";
const CACHE_NAME = `${CACHE_PREFIX}${RUNTIME_REVISION}`;
const PREVIOUS_CACHE_NAME = PREVIOUS_RUNTIME_REVISION ? `${CACHE_PREFIX}${PREVIOUS_RUNTIME_REVISION}` : "";
const MODE_CACHE_NAME = `${MODE_CACHE_PREFIX}${RUNTIME_REVISION}`;
// JOB-24: Team V images are not precached on install (about 20 MB in all). They load on first view into
// this cache-first runtime cache, keyed by RUNTIME_REVISION. Activate keeps it and the retained recovery
// revision's image cache (for rollback) and clears the others.
const V10_IMAGE_CACHE_PREFIX = "career-mode-showdown-v10-images-";
const V10_IMAGE_CACHE_NAME = `${V10_IMAGE_CACHE_PREFIX}${RUNTIME_REVISION}`;
function v10ImageCacheName(revision){ return revision ? `${V10_IMAGE_CACHE_PREFIX}${revision}` : ""; }
// r87: the Russian Roster Roulette sounds (visual-assets/v10_1/roulette/assets/sfx/*.wav, 1.8 MB) follow the same cache-first
// runtime rule as Team V's images instead of the install precache.
const V10_IMAGE_PATH = /^visual-assets\/v10_1\/.+\.(?:webp|png|jpe?g|avif|gif|svg|wav)$/i;
const NETWORK_PROBE_TIMEOUT_MS = 1800;
const RUNTIME_CONFIG_PATH = "firebase.runtime-config.json";
const APP_CHECK_BOOTSTRAP_PATH = "js/productionAppCheckBootstrap.js";
const NETWORK_ONLY_NAVIGATION_PATHS = new Set([
    "production-authorization-acceptance.html"
]);
// r86: the Special Player page is its own document in a frame (js/specialPlayerReveal.js). A frame load is a navigation:
// it gets that page from the shell the app runs (then the network), never the shell's index.html. Its images follow the
// Team V cache-first image rule.
const SHELL_FRAME_NAVIGATION_PATHS = new Set([
    "visual-assets/v10_1/special-player/index.html",
    "visual-assets/v10_1/roulette/index.html",
    // r87 Prime Pack: its page in the #igStage frame (js/iconGuessStep.js), same rule.
    "visual-assets/v10_1/icon-guess/index.html"
]);
// Precached shell files that a stylesheet asks for by a relative url(), so the request has no ?v=: css/r78-marble-surfaces.css
// draws its panels with url("r78-marble-tile.webp"). They come from the shell the page runs (the precached copy), then the network.
// r87: the Roulette page in its frame asks for its 3D library and data the same way (no ?v=), so offline it still gets the
// precached copies of the shell it runs (red team R87-B-03).
const UNVERSIONED_SHELL_ASSET_PATHS = new Set([
    "css/r78-marble-tile.webp",
    "visual-assets/v10_1/roulette/vendor/three-r128.min.js",
    "visual-assets/v10_1/roulette/platemap.json",
    "visual-assets/v10_1/roulette/assets/squads.json",
    "visual-assets/v10_1/shared/fonts/barlow-condensed-latin-600-normal.woff2",
    "visual-assets/v10_1/shared/fonts/barlow-condensed-latin-700-normal.woff2",
    "assets/fonts/barlow-condensed-vietnamese-600-normal.woff2",
    "assets/fonts/barlow-condensed-vietnamese-700-normal.woff2",
    "assets/fonts/barlow-condensed-vietnamese-800-normal.woff2",
    "assets/fonts/barlow-condensed-latin-ext-600-normal.woff2",
    "assets/fonts/barlow-condensed-latin-ext-700-normal.woff2",
    "assets/fonts/barlow-condensed-latin-ext-800-normal.woff2",
    "assets/fonts/barlow-condensed-latin-600-normal.woff2",
    "assets/fonts/barlow-condensed-latin-700-normal.woff2",
    "assets/fonts/barlow-condensed-latin-800-normal.woff2",
    // r87: the rest of the local faces, so the offline and error screens keep the brush title and body type offline
    "visual-assets/v10_1/shared/fonts/barlow-latin-400-normal.woff2",
    "visual-assets/v10_1/shared/fonts/barlow-latin-600-normal.woff2",
    "visual-assets/v10_1/shared/fonts/kaushan-script-latin-400-normal.woff2"
]);
const NETWORK_ONLY_ASSET_PATHS = new Set([
    "js/productionAuthorizationAcceptance.js",
    "js/productionProviderAbuseAcceptance.js"
]);

const SHELL_PATHS = Object.freeze([
    "index.html",
    "manifest.webmanifest",
    "css/app.css",
    "assets/fonts/barlow-condensed.css",
    "assets/fonts/barlow-condensed-vietnamese-600-normal.woff2",
    "assets/fonts/barlow-condensed-vietnamese-700-normal.woff2",
    "assets/fonts/barlow-condensed-vietnamese-800-normal.woff2",
    "assets/fonts/barlow-condensed-latin-ext-600-normal.woff2",
    "assets/fonts/barlow-condensed-latin-ext-700-normal.woff2",
    "assets/fonts/barlow-condensed-latin-ext-800-normal.woff2",
    "assets/fonts/barlow-condensed-latin-600-normal.woff2",
    "assets/fonts/barlow-condensed-latin-700-normal.woff2",
    "assets/fonts/barlow-condensed-latin-800-normal.woff2",
    "css/visual-fidelity-r3.css",
    "css/offline.css",
    "css/remoteJoining.css",
    "css/analytics.css",
    "css/footballVisuals.css",
    "css/footballVisuals-v113.css",
    "css/legacy.css",
    "css/restore.css",
    "css/rulebook.css",
    "css/saveLibrary.css",
    "css/season.css",
    "css/settings.css",
    "css/transfer.css",
    "data/clubs.js",
    "data/footballVisuals.js",
    "data/leagues.js",
    "data/transferOptions.js",
    "js/analytics.js",
    "js/careerScreenSeam.js",
    "js/careerScreensV10.js",
  "visual-assets/v10_1/legacy/legacy.css",
  "visual-assets/v10_1/legacy/legacy.js",
  "visual-assets/v10_1/legacy/strings.json",
  "visual-assets/v10_1/legacy/assets/platemap.json",
  "visual-assets/v10_1/rivalry-statistics/rivalry-statistics.css",
  "visual-assets/v10_1/rivalry-statistics/rivalry-statistics.js",
  "visual-assets/v10_1/rivalry-statistics/strings.json",
  "visual-assets/v10_1/rivalry-statistics/assets/platemap.json",
  "js/rivalryLegacyV10.js",
  "js/rivalryLegacyV10Markup.js",
  "js/sharedCareerAnalytics.js",
  "js/sharedActiveShowdownAdapter.js",
  "js/sharedClosedShowdownAdapter.js",
  "js/sparkCompletedShowdownReader.js",
  "js/sparkClosedShowdownCareerLoader.js",
  "js/careerSummaryStore.js",
  "js/specialPlayerReveal.js",
  "visual-assets/v10_1/special-player/index.html",
  "js/marqueePlayer.js",
  "data/marqueePlayers.js",
  "js/deadlineDay.js",
  "data/deadlineDayLines.js",
  "js/rosterRouletteStep.js",
  "js/rosterRoulette.js",
  "data/rosterSquads.js",
  "data/fifa17Players.js",
  "css/v10Roulette.css",
  "visual-assets/v10_1/roulette/index.html",
  "visual-assets/v10_1/roulette/platemap.json",
  "visual-assets/v10_1/roulette/vendor/three-r128.min.js",
  "visual-assets/v10_1/roulette/vendor/THREE_LICENSE.txt",
  "visual-assets/v10_1/roulette/assets/squads.json",
  "js/touchlineGazette.js",
  "js/commentaryV3.js",
  "js/commentaryEngine.js",
  "data/commentaryLines.js",
  "data/gazetteCopy.js",
  "data/frontPages.js",
  "css/v10Gazette.css",
  "visual-assets/v10_1/content/content.css",
  "visual-assets/v10_1/content/frontpage.js",
  "visual-assets/v10_1/content/gazette/fonts/unifrakturmaguntia-latin-400-normal.woff2",
  "visual-assets/v10_1/content/gazette/fonts/playfair-display-latin-700-normal.woff2",
  "visual-assets/v10_1/content/gazette/fonts/playfair-display-latin-900-normal.woff2",
  "visual-assets/v10_1/content/gazette/fonts/playfair-display-latin-400-italic.woff2",
  "visual-assets/v10_1/content/gazette/fonts/old-standard-tt-latin-400-normal.woff2",
  "visual-assets/v10_1/content/gazette/fonts/old-standard-tt-latin-400-italic.woff2",
  "visual-assets/v10_1/content/gazette/fonts/old-standard-tt-latin-700-normal.woff2",
  "visual-assets/v10_1/content/gazette/fonts/LICENSE-unifrakturmaguntia.txt",
  "visual-assets/v10_1/content/gazette/fonts/LICENSE-playfair-display.txt",
  "visual-assets/v10_1/content/gazette/fonts/LICENSE-old-standard-tt.txt",
  "js/iconGuessStep.js",
  "js/iconGuess.js",
  "js/iconNames.js",
  "data/icons.js",
  "visual-assets/v10_1/icon-guess/index.html",
  "js/specialPlayerChip.js",
  "js/careerStartMarker.js",
  "css/rivalryLegacyV10.css",
    "js/app.js",
    "js/backup.js",
    "js/clubAssignment.js",
    "js/dataEngine.js",
    "js/diagnostics.js",
    "js/footballVisuals.js",
    "js/importAnalysis.js",
    "js/leagueWheel.js",
    "js/legacy.js",
    "js/menuExperience.js",
    "js/menuFeedback.js",
    "js/offlineApp.js",
    "js/optionalModules.js",
    "js/onlinePlayerIdentity.js",
    "js/persistentNikDanielPair.js",
    "js/whichShowdownIsLive.js",
    "js/showdownModes.js",
    "js/productionFirebaseRuntime.js",
    "js/fullMotionHonor.js",
    "js/ssjr.js",
    "js/productionSharedJourneyEntry.js",
    "js/productionSharedJourneyGuard.js",
    "js/productionSharedShowdownPresentation.js",
    "js/productionSharedShowdownSetup.js",
    "js/sharedShowdownSetup.js",
    "js/sharedShowdownCatalog.js",
    "js/sparkSharedShowdownSetup.js",
    "js/sharedCareerStart.js",
    "js/sparkSharedCareerStart.js",
    "js/productionSharedCareerStart.js",
    "js/sharedTransferChallenge.js",
    "js/sparkSharedTransferChallenge.js",
    "js/productionSharedTransferChallenge.js",
    "js/sharedSeasonResults.js",
    "js/sparkSharedSeasonResults.js",
    "js/productionSharedSeasonResults.js",
    "js/productionSharedSeasonResultsRoute.js",
    "js/sharedSeasonCommit.js",
    "js/sparkSharedSeasonCommit.js",
    "js/productionSharedSeasonCommit.js",
    "js/sharedCanonicalScoring.js",
    "js/sparkSharedCanonicalScoring.js",
    "js/productionSharedCanonicalScoring.js",
    "js/sharedHistoryConvergence.js",
    "js/sparkSharedHistoryConvergence.js",
    "js/productionSharedHistoryConvergence.js",
    "js/sharedMultiSeasonProgression.js",
    "js/sparkSharedMultiSeasonProgression.js",
    "js/productionSharedMultiSeasonProgression.js",
    "js/sharedJourneyReconnect.js",
    "js/productionSharedJourneyReconnect.js",
    "js/sharedJourneyConflicts.js",
    "js/productionSharedJourneyConflicts.js",
    "js/sharedLocalReconciliation.js",
    "js/productionSharedLocalReconciliation.js",
    "js/sharedFinalReconciliation.js",
    "js/productionSharedFinalReconciliation.js",
    "js/sharedTerminalClose.js",
    "js/sparkTerminalClose.js",
    "js/productionSharedTerminalClose.js",
    "js/sparkRemoteJoining.js",
    "js/sparkAccountBootstrap.js",
    "js/sparkConnectedAccount.js",
    "js/sparkPrivatePairing.js",
    "js/sparkConnectedRivalry.js",
    "js/sparkPrivateSession.js",
    "js/sparkStandardAuthPrivateSession.js",
    "js/restore.js",
    "js/restoreUI.js",
    "js/ruleBook.js",
    "js/saveLibraryCutover.js",
    "js/saveLibraryFoundation.js",
    "js/saveLibraryPersistence.js",
    "js/saveLibraryRuntime.js",
    "js/saveLibraryUI.js",
    "js/scoring.js",
    "js/screens.js",
    "js/seasonEngine.js",
    "js/settings.js",
    "js/showdown.js",
    "js/showdownUI.js",
    "js/statistics.js",
    "js/storage.js",
    "js/storageTransaction.js",
    "js/transferChallenge.js",
    "js/transferSelector.js",
    "js/trophyRoom.js",
    "js/visualIdentity.js",
    "assets/marco-reus-2015-cc-by.webp",
    "assets/LOADING_REUS_DESKTOP.webp",
    "assets/LOADING_REUS_PHONE.webp",
    "assets/football/anthony-martial-cska-2017-v113.webp",
    "assets/football/antoine-griezmann-atletico-2016-v113.webp",
    "assets/football/cristiano-ronaldo-euro-2016-v113.webp",
    "assets/football/james-rodriguez-world-cup-2014-v113.webp",
    "assets/football/lionel-messi-barcelona-2016-subject-r4.webp",
    "assets/football/marcus-rashford-chelsea-2017-v113.webp",
    "assets/football/mario-balotelli-euro-2012-celebration-v113.webp",
    "assets/football/neymar-brazil-olympic-gold-2016-v113.webp",
    "assets/football/paul-pogba-man-utd-2016-v113.webp",
    "assets/football/philipp-lahm-world-cup-2014-focus-r4.webp",
    "assets/football/radamel-falcao-europa-league-2012-v113.webp",
    "assets/football/zlatan-ibrahimovic-man-utd-2016-v113.webp",
    "assets/icons/showdown-192.svg",
    "assets/icons/showdown-512.svg",
    "assets/icons/showdown-maskable-512.svg",
    "visual-assets/v10_1/career-statistics/assets/platemap.json",
    "visual-assets/v10_1/career-statistics/career-statistics.css",
    "visual-assets/v10_1/career-statistics/career-statistics.js",
    "visual-assets/v10_1/shared/fonts/barlow-condensed-latin-600-normal.woff2",
    "visual-assets/v10_1/shared/fonts/barlow-condensed-latin-700-normal.woff2",
    "visual-assets/v10_1/shared/fonts/barlow-latin-400-normal.woff2",
    "visual-assets/v10_1/shared/fonts/barlow-latin-600-normal.woff2",
    "visual-assets/v10_1/shared/fonts/kaushan-script-latin-400-normal.woff2",
    "visual-assets/v10_1/shared/motion.css",
    "visual-assets/v10_1/shared/motion.js",
    "visual-assets/v10_1/shared/showdown-tokens.css",
    "visual-assets/v10_1/shared/showdown-type.css",
    "visual-assets/v10_1/shared/showdown-ui.css",
    "visual-assets/v10_1/shared/stage.css",
    "visual-assets/v10_1/shared/stage.js",
    "visual-assets/v10_1/trophy-room/assets/platemap.json",
    "visual-assets/v10_1/trophy-room/trophy-room.css",
    "visual-assets/v10_1/trophy-room/trophy-room.js",
    "visual-assets/v10_1/season-results/season-results.css",
    "visual-assets/v10_1/season-results/season-results.js",
    "visual-assets/v10_1/season-results/app-shell.html",
    "visual-assets/v10_1/final-winner/final-winner.css",
    "visual-assets/v10_1/final-winner/final-winner.js",
    "visual-assets/v10_1/final-winner/app-shell.html",
    "visual-assets/v10_1/standings/standings.css",
    "visual-assets/v10_1/standings/standings.js",
    "visual-assets/v10_1/standings/app-shell.html",
    "visual-assets/v10_1/final-winner/app-strings.json",
    "visual-assets/v10_1/standings/app-strings.json",
    "js/seasonFinalV10.js",
    "visual-assets/v10_1/season-results/app.css",
    "js/v10Screens.js",
    "js/homeScreensV10.js",
    "visual-assets/v10_1/home/home.css",
    "visual-assets/v10_1/home/soundtrack.js",
    "js/musicDockV10.js",
    "css/homeV10.css",
    "js/rulesSettingsV10.js",
    "css/rulesSettingsV10.css",
    "visual-assets/v10_1/rule-book/rule-book.css",
    "visual-assets/v10_1/settings/settings.css",
    "js/startJoinViewModel.js",
    "css/v10Shell.css",
    "css/r78-type.css",
    "css/r78-marble-surfaces.css",
    "css/r78-marble-tile.webp",
    "js/showdownConfirm.js",
    "visual-assets/v10_1/shared/navbar/navbar.css",
    "visual-assets/v10_1/shared/navbar/navbar.js",
    "js/v10Setup.js",
    "css/v10Setup.css",
    "js/connectPlayersScreenV10.js",
    "css/connectPlayersV10.css",
    "js/transferScreenV10.js",
    "css/v10Transfer.css",
    "visual-assets/v10_1/tr2/slice-02-plate/plate.css",
    "visual-assets/v10_1/tr2/slice-02-plate/plate.js",
    "visual-assets/v10_1/tr2/slice-02-plate/platemap.json",
    "visual-assets/v10_1/tr2/slice-02-plate/assets/fonts/barlow-condensed-latin-600-normal.woff2",
    "visual-assets/v10_1/tr2/slice-02-plate/assets/fonts/barlow-condensed-latin-700-normal.woff2",
    "visual-assets/v10_1/tr2/slice-02-plate/assets/fonts/barlow-latin-400-normal.woff2",
    "visual-assets/v10_1/tr2/slice-02-plate/assets/fonts/barlow-latin-600-normal.woff2",
    "js/clubScreenV10.js",
    "css/v10Club.css",
    "visual-assets/v10_1/club/club.css",
    "visual-assets/v10_1/club/club.js",
    "visual-assets/v10_1/club/assets/platemap.json",
    "visual-assets/v10_1/club/assets/handmap.json",
    "visual-assets/v10_1/tr2/slice-02-plate/assets/fonts/kaushan-script-latin-400-normal.woff2"
]);
const SHELL_PATH_SET = new Set(SHELL_PATHS);
// The retained previous shell was installed by its own worker with its own list, so it is verified against that list, not
// this one: checked against SHELL_PATHS it would lack this release's new files, fail, and be deleted on activation, leaving
// nothing to roll back to. Each release lists here the shell paths it added since PREVIOUS_RUNTIME_REVISION and the ones it
// removed, so PREVIOUS_SHELL_PATHS is exactly the list that build precached (tests/fixtures/shell-paths/<revision>.json).
// A release that moves PREVIOUS_RUNTIME_REVISION again resets BOTH sets to what it adds and removes since that revision.
// 2.0.0 (r87): PREVIOUS is 1.9.10-r86 (228 paths). Added: Deadline Day, the Russian Roster Roulette step, engine, squads,
// styles and Team V's page with its vendored three.js, the Touchline Gazette (page script, copy, headline pack, styles, paper,
// sheet and its seven OFL fonts with licences), Commentary v3, the self-hosted Barlow Condensed sheet with its nine files (first load), and Prime Pack's step, round
// engine, name matcher, Icon list and page (its pictures are Team V images, V10_IMAGE_PATH runtime cache). Removed (arch audit D1): the seven
// acceptance-only scripts that load only behind ?ssjr, ?ssjr-acceptance or ?rjr-acceptance; they are no longer precached
// and come from the shell of the revision that asks for them, else the network (SHELL_PATHS_REMOVED_SINCE_PREVIOUS below).
const SHELL_PATHS_ADDED_SINCE_PREVIOUS = new Set(["assets/fonts/barlow-condensed.css", "assets/fonts/barlow-condensed-vietnamese-600-normal.woff2", "assets/fonts/barlow-condensed-vietnamese-700-normal.woff2", "assets/fonts/barlow-condensed-vietnamese-800-normal.woff2", "assets/fonts/barlow-condensed-latin-ext-600-normal.woff2", "assets/fonts/barlow-condensed-latin-ext-700-normal.woff2", "assets/fonts/barlow-condensed-latin-ext-800-normal.woff2", "assets/fonts/barlow-condensed-latin-600-normal.woff2", "assets/fonts/barlow-condensed-latin-700-normal.woff2", "assets/fonts/barlow-condensed-latin-800-normal.woff2", "js/deadlineDay.js", "data/deadlineDayLines.js", "js/rosterRouletteStep.js", "js/rosterRoulette.js", "data/rosterSquads.js", "data/fifa17Players.js", "css/v10Roulette.css", "visual-assets/v10_1/roulette/index.html", "visual-assets/v10_1/roulette/platemap.json", "visual-assets/v10_1/roulette/vendor/three-r128.min.js", "visual-assets/v10_1/roulette/vendor/THREE_LICENSE.txt", "visual-assets/v10_1/roulette/assets/squads.json", "js/touchlineGazette.js", "js/commentaryV3.js", "js/commentaryEngine.js", "data/commentaryLines.js", "data/gazetteCopy.js", "data/frontPages.js", "css/v10Gazette.css", "visual-assets/v10_1/content/content.css", "visual-assets/v10_1/content/frontpage.js", "visual-assets/v10_1/content/gazette/fonts/unifrakturmaguntia-latin-400-normal.woff2", "visual-assets/v10_1/content/gazette/fonts/playfair-display-latin-700-normal.woff2", "visual-assets/v10_1/content/gazette/fonts/playfair-display-latin-900-normal.woff2", "visual-assets/v10_1/content/gazette/fonts/playfair-display-latin-400-italic.woff2", "visual-assets/v10_1/content/gazette/fonts/old-standard-tt-latin-400-normal.woff2", "visual-assets/v10_1/content/gazette/fonts/old-standard-tt-latin-400-italic.woff2", "visual-assets/v10_1/content/gazette/fonts/old-standard-tt-latin-700-normal.woff2", "visual-assets/v10_1/content/gazette/fonts/LICENSE-unifrakturmaguntia.txt", "visual-assets/v10_1/content/gazette/fonts/LICENSE-playfair-display.txt", "visual-assets/v10_1/content/gazette/fonts/LICENSE-old-standard-tt.txt", "js/iconGuessStep.js", "js/iconGuess.js", "js/iconNames.js", "data/icons.js", "visual-assets/v10_1/icon-guess/index.html"]);
const SHELL_PATHS_REMOVED_SINCE_PREVIOUS = new Set(["js/ssjrProductionAcceptanceRecorder.js","js/ssjrProductionNegativeProbeRunner.js","js/ssjrProductionNegativeEvidence.js","js/stage5fProductionAuthenticatedNegatives.js","js/ssjrAcceptancePolishedBridge.js","js/ssjrPhysicalJourneyAcceptance.js","js/remoteJoiningAcceptance.js"]);
const PREVIOUS_SHELL_PATHS = Object.freeze([...SHELL_PATHS.filter(path=>!SHELL_PATHS_ADDED_SINCE_PREVIOUS.has(path)),...SHELL_PATHS_REMOVED_SINCE_PREVIOUS]);
function shellPathsForRevision(revision){ return revision&&revision!==RUNTIME_REVISION&&revision===PREVIOUS_RUNTIME_REVISION?PREVIOUS_SHELL_PATHS:SHELL_PATHS; }

function scopeUrl(path = ""){
    return new URL(path, self.registration.scope);
}
function versionedShellUrl(path, revision = RUNTIME_REVISION){
    const url = scopeUrl(path); url.searchParams.set("v", revision); return url.href;
}
function networkOnlyRequest(request){ return new Request(request,{cache:"reload"}); }
function cacheNameForRevision(revision){ return revision ? `${CACHE_PREFIX}${revision}` : ""; }
function revisionFromCacheName(cacheName){ return cacheName&&cacheName.startsWith(CACHE_PREFIX)?cacheName.slice(CACHE_PREFIX.length):""; }
function compareRuntimeRevisions(a,b){
    const parse=value=>{const match=/^(\d+)\.(\d+)\.(\d+)-r(\d+)$/.exec(value||"");return match?match.slice(1).map(Number):null;};
    const left=parse(a),right=parse(b); if(!left&&!right)return 0;if(!left)return-1;if(!right)return 1;
    for(let index=0;index<left.length;index+=1){if(left[index]!==right[index])return left[index]-right[index];}return 0;
}
async function verifyRetainedRuntime(revision){
    if(!revision)return {ok:false,available:false,cacheName:"",revision:"",expected:0,missing:[]};
    if(revision===RUNTIME_REVISION||revision===PREVIOUS_RUNTIME_REVISION)return verifyCache(revision);
    const cacheName=cacheNameForRevision(revision); if(!(await cacheExists(cacheName)))return {ok:false,available:false,cacheName,revision,expected:0,missing:["index.html"]};
    const cache=await caches.open(cacheName); const index=await cache.match(versionedShellUrl("index.html",revision));
    return {ok:Boolean(index&&index.ok),available:true,cacheName,revision,expected:null,missing:index&&index.ok?[]:["index.html"]};
}
async function findRecoveryRuntime(){
    const names=(await caches.keys()).filter(name=>name.startsWith(CACHE_PREFIX)&&name!==CACHE_NAME);
    const revisions=names.map(revisionFromCacheName).filter(Boolean).sort((a,b)=>compareRuntimeRevisions(b,a));
    if(PREVIOUS_RUNTIME_REVISION){
        const preferred=await verifyRetainedRuntime(PREVIOUS_RUNTIME_REVISION); if(preferred.ok)return preferred;
    }
    for(const revision of revisions){
        if(revision===PREVIOUS_RUNTIME_REVISION)continue;
        const candidate=await verifyRetainedRuntime(revision); if(candidate.ok)return candidate;
    }
    return {ok:false,available:false,cacheName:"",revision:"",expected:0,missing:[]};
}
function requestForShellPath(path){ return new Request(versionedShellUrl(path), { cache: "reload", credentials:"same-origin" }); }
function relativeScopePath(url){
    const scope = scopeUrl();
    if(url.origin !== scope.origin || !url.pathname.startsWith(scope.pathname)){ return ""; }
    return url.pathname.slice(scope.pathname.length).replace(/^\/+/, "") || "index.html";
}
async function cacheExists(cacheName){ if(!cacheName){ return false; } return (await caches.keys()).includes(cacheName); }
async function verifyCache(revision = RUNTIME_REVISION){
    const cacheName = cacheNameForRevision(revision); const paths=shellPathsForRevision(revision);
    if(!revision || !(await cacheExists(cacheName))){ return { ok:false, available:false, cacheName, revision, expected:paths.length, missing:paths.slice() }; }
    const cache=await caches.open(cacheName); const missing=[];
    for(const path of paths){ const response=await cache.match(versionedShellUrl(path,revision)); if(!response||!response.ok){ missing.push(path); } }
    return { ok:missing.length===0, available:true, cacheName, revision,expected:paths.length, missing };
}
async function populateCurrentCache(){
    const cache=await caches.open(CACHE_NAME);
    try{ await cache.addAll(SHELL_PATHS.map(requestForShellPath)); const status=await verifyCache(RUNTIME_REVISION); if(!status.ok){ throw new Error(`Application shell cache is incomplete: ${status.missing.join(", ")}`); } return status; }
    catch(error){ await caches.delete(CACHE_NAME); throw error; }
}
async function readForcedRevision(){
    if(!(await cacheExists(MODE_CACHE_NAME))){ return ""; }
    const cache=await caches.open(MODE_CACHE_NAME); const response=await cache.match(scopeUrl("__cms_runtime_mode__").href); if(!response){ return ""; }
    try{return(await response.text()).trim();}catch(error){return"";}
}
async function writeForcedRevision(revision){ const cache=await caches.open(MODE_CACHE_NAME); await cache.put(scopeUrl("__cms_runtime_mode__").href,new Response(String(revision||""),{headers:{"content-type":"text/plain; charset=utf-8"}})); }
async function clearForcedRevision(){ await caches.delete(MODE_CACHE_NAME); }
async function chooseNavigationRuntime(){
    const forcedRevision=await readForcedRevision();
    if(forcedRevision){ const forcedStatus=await verifyRetainedRuntime(forcedRevision); if(forcedStatus.ok){return forcedStatus;} await clearForcedRevision(); }
    const currentStatus=await verifyCache(RUNTIME_REVISION); if(currentStatus.ok){return currentStatus;}
    const recovery=await findRecoveryRuntime(); if(recovery.ok)return recovery;
    return null;
}
async function getStatusBundle(){ const current=await verifyCache(RUNTIME_REVISION); const previous=PREVIOUS_RUNTIME_REVISION?await verifyCache(PREVIOUS_RUNTIME_REVISION):{ok:false,available:false,cacheName:"",revision:"",expected:SHELL_PATHS.length,missing:SHELL_PATHS.slice()}; const recovery=await findRecoveryRuntime(); return{current,previous,recovery,forcedRevision:await readForcedRevision(),cacheNames:await caches.keys()}; }
async function probeNetwork(){
    const controller=new AbortController(); const timeout=setTimeout(()=>controller.abort(),NETWORK_PROBE_TIMEOUT_MS); const url=scopeUrl("service-worker.js"); url.searchParams.set("network-probe",`${Date.now()}-${Math.random().toString(36).slice(2)}`);
    try{ const response=await fetch(new Request(url.href,{cache:"no-store",credentials:"same-origin",signal:controller.signal})); return{online:response.ok,status:response.status}; }
    catch(error){ return{online:false,status:0,error:error?.name||error?.message||String(error)}; }
    finally{ clearTimeout(timeout); }
}
function replyToClient(event,payload){ const port=event.ports&&event.ports[0]; if(port){port.postMessage(payload);} }
self.addEventListener("install",event=>{ event.waitUntil(populateCurrentCache()); });
self.addEventListener("message",event=>{
    const type=event.data&&event.data.type;
    if(type==="CMS_PROBE_NETWORK"){ event.waitUntil((async()=>{ const status=await probeNetwork(); replyToClient(event,{type:"CMS_NETWORK_STATUS",ok:true,...status}); })()); return; }
    if(type==="CMS_GET_CACHE_STATUS"){ event.waitUntil((async()=>{ try{ const status=await getStatusBundle(); replyToClient(event,{type:"CMS_CACHE_STATUS",ok:status.current.ok,revision:RUNTIME_REVISION,previousRevision:PREVIOUS_RUNTIME_REVISION,...status}); }catch(error){ replyToClient(event,{type:"CMS_CACHE_STATUS",ok:false,revision:RUNTIME_REVISION,error:error?.message||String(error)}); } })()); return; }
    if(type==="CMS_ACTIVATE_UPDATE"){ event.waitUntil((async()=>{ try{ const status=await verifyCache(RUNTIME_REVISION); if(!status.ok){ replyToClient(event,{type:"CMS_ACTIVATION_REJECTED",ok:false,revision:RUNTIME_REVISION,missing:status.missing}); return; } await self.skipWaiting(); replyToClient(event,{type:"CMS_ACTIVATION_ACCEPTED",ok:true,revision:RUNTIME_REVISION}); }catch(error){ replyToClient(event,{type:"CMS_ACTIVATION_REJECTED",ok:false,revision:RUNTIME_REVISION,error:error?.message||String(error)}); } })()); return; }
    if(type==="CMS_ROLLBACK_TO_PREVIOUS"){ event.waitUntil((async()=>{ try{ const recovery=await findRecoveryRuntime(); if(!recovery.ok){throw new Error("No verified previous application shell is available for rollback.");} await writeForcedRevision(recovery.revision); replyToClient(event,{type:"CMS_ROLLBACK_ACCEPTED",ok:true,revision:recovery.revision}); }catch(error){ replyToClient(event,{type:"CMS_ROLLBACK_REJECTED",ok:false,error:error?.message||String(error)}); } })()); return; }
    if(type==="CMS_CLEAR_ROLLBACK"){ event.waitUntil((async()=>{ await clearForcedRevision(); replyToClient(event,{type:"CMS_ROLLBACK_CLEARED",ok:true,revision:RUNTIME_REVISION}); })()); }
});
self.addEventListener("activate",event=>{ event.waitUntil((async()=>{ const status=await verifyCache(RUNTIME_REVISION); if(!status.ok){throw new Error(`Refusing activation with incomplete application shell: ${status.missing.join(", ")}`);} await clearForcedRevision(); const recovery=await findRecoveryRuntime(); const keepShellCaches=new Set([CACHE_NAME,recovery.ok?recovery.cacheName:""] .filter(Boolean)); const keepImageCaches=new Set([V10_IMAGE_CACHE_NAME,recovery.ok?v10ImageCacheName(recovery.revision):""].filter(Boolean)); const cacheNames=await caches.keys(); await Promise.all(cacheNames.map(name=>{if(name.startsWith(CACHE_PREFIX)&&!keepShellCaches.has(name)){return caches.delete(name);}if(name.startsWith(MODE_CACHE_PREFIX)&&name!==MODE_CACHE_NAME){return caches.delete(name);}if(name.startsWith(V10_IMAGE_CACHE_PREFIX)&&!keepImageCaches.has(name)){return caches.delete(name);}return Promise.resolve(false);})); await self.clients.claim(); })()); });
async function cachedShellResponse(path,revision){ const cacheName=cacheNameForRevision(revision); if(!cacheName||!(await cacheExists(cacheName))){return null;} const cache=await caches.open(cacheName); return cache.match(versionedShellUrl(path,revision)); }
function isV10ImagePath(path){ return V10_IMAGE_PATH.test(path); }
// Images follow the shell the page runs: after a rollback they come from the retained revision's own image cache
// (or its shell cache, for revisions that precached them), so an offline rollback keeps the art it had viewed. A miss is
// fetched by path: each Team V image path names one generation (_V<n> name, bytes pinned by v10-foundation F9c).
async function v10ImageRevision(){ const forced=await readForcedRevision(); return forced&&forced!==RUNTIME_REVISION&&await cacheExists(cacheNameForRevision(forced))?forced:RUNTIME_REVISION; }
async function v10ImageResponse(event,request,path){
    const revision=await v10ImageRevision(); const cache=await caches.open(v10ImageCacheName(revision)); const key=scopeUrl(path).href;
    const cached=await cache.match(key); if(cached){ return cached; }
    if(revision!==RUNTIME_REVISION){ const retained=await cachedShellResponse(path,revision); if(retained){ return retained; } }
    const response=await fetch(request);
    if(response&&response.ok&&response.type==="basic"){ event.waitUntil(cache.put(key,response.clone()).catch(()=>{})); }
    return response;
}
async function unversionedShellResponse(request,path){
    const revision=await v10ImageRevision(); const cached=await cachedShellResponse(path,revision)||(revision!==RUNTIME_REVISION?await cachedShellResponse(path,RUNTIME_REVISION):null);
    return cached||fetch(request);
}
self.addEventListener("fetch",event=>{
    const request=event.request; if(request.method!=="GET"){return;} const url=new URL(request.url); const scope=scopeUrl(); if(url.origin!==scope.origin){return;}
    if(request.mode==="navigate"){
        const path=relativeScopePath(url);
        if(NETWORK_ONLY_NAVIGATION_PATHS.has(path)){ event.respondWith(fetch(networkOnlyRequest(request))); return; }
        if(SHELL_FRAME_NAVIGATION_PATHS.has(path)){ event.respondWith((async()=>{ const selected=await chooseNavigationRuntime(); const cached=selected?await cachedShellResponse(path,selected.revision):null; return cached||fetch(request); })()); return; }
        event.respondWith((async()=>{ const selected=await chooseNavigationRuntime(); if(selected){const cached=await cachedShellResponse("index.html",selected.revision);if(cached){return cached;}} return fetch(request); })()); return;
    }
    const path=relativeScopePath(url); if(!path){return;} if(isV10ImagePath(path)){ event.respondWith(v10ImageResponse(event,request,path)); return; } if(NETWORK_ONLY_ASSET_PATHS.has(path)){ event.respondWith(fetch(networkOnlyRequest(request))); return; } if(SHELL_PATHS_REMOVED_SINCE_PREVIOUS.has(path)){ const asked=url.searchParams.get("v")||""; event.respondWith((async()=>{ const cached=asked&&asked!==RUNTIME_REVISION?await cachedShellResponse(path,asked):null; return cached||fetch(networkOnlyRequest(request)); })()); return; } if(path===RUNTIME_CONFIG_PATH){return;} if(path===APP_CHECK_BOOTSTRAP_PATH){return;} if(UNVERSIONED_SHELL_ASSET_PATHS.has(path)&&!url.searchParams.get("v")){ event.respondWith(unversionedShellResponse(request,path)); return; } const requestedRevision=url.searchParams.get("v")||""; if(!requestedRevision){return;}
    event.respondWith((async()=>{const cached=await cachedShellResponse(path,requestedRevision);return cached||Response.error();})());
});
self.__CMS_SERVICE_WORKER_DIAGNOSTICS__=Object.freeze({revision:RUNTIME_REVISION,previousRevision:PREVIOUS_RUNTIME_REVISION,cacheName:CACHE_NAME,previousCacheName:PREVIOUS_CACHE_NAME,modeCacheName:MODE_CACHE_NAME,shellPaths:SHELL_PATHS,previousShellPaths:PREVIOUS_SHELL_PATHS});
```


## FILE: tools/set-release-time.cjs (at 443486cb84fffcb344409e84e12e2e7245e936cd)
```
#!/usr/bin/env node
"use strict";
// 2.0.0 release time: the one place the lead sets it at freeze. Every start constant that must equal the release time is
// listed here; the release contract (tests/contracts/r86-release-contracts.cjs RR5) fails if any of them differ.
//   node tools/set-release-time.cjs 2026-11-01T17:00:00Z   (sets them all)
//   node tools/set-release-time.cjs                        (prints them)
const fs=require("node:fs");
const path=require("node:path");
const ROOT=path.resolve(__dirname,"..");
const RELEASE_TIME_CONSTANTS=Object.freeze([
  {file:"js/rosterRouletteStep.js",name:"RRR_FROM_MS"},
  {file:"js/sparkSharedTransferChallenge.js",name:"ROULETTE_FROM_MS"},
  // Prime Pack (#1149): the guessing round and every 15-a-season total start with the same Showdowns as the roulette.
  {file:"js/iconGuess.js",name:"ICON_FROM_MS"},
  {file:"js/careerScreenSeam.js",name:"PRIME_PACK_FROM_MS"},
  {file:"js/touchlineGazette.js",name:"PRIME_PACK_FROM_MS"},
  {file:"js/sharedCareerAnalytics.js",name:"PRIME_PACK_FROM_MS"},
  {file:"js/productionSharedTransferChallenge.js",name:"PRIME_PACK_FROM_MS"},
  {file:"js/productionSharedSeasonResults.js",name:"PRIME_PACK_FROM_MS"},
  {file:"js/commentaryV3.js",name:"PRIME_PACK_FROM_MS"},
  // Special Player from the manager's own club (#1173).
  {file:"js/marqueePlayer.js",name:"OWN_CLUB_FROM_MS"}
]);
// js/marqueePlayer.js MARQUEE_FROM_MS is r86's own boundary and is never moved.
const NOT_RELEASE_TIME=Object.freeze(["MARQUEE_FROM_MS"]);
const pattern=name=>new RegExp(`(\\b${name}=Date\\.parse\\(")([^"]+)("\\);)`);
function read(){return RELEASE_TIME_CONSTANTS.map(c=>{const source=fs.readFileSync(path.join(ROOT,c.file),"utf8"),m=pattern(c.name).exec(source);if(!m)throw new Error(`${c.file}: no ${c.name}=Date.parse("...") literal`);return {...c,value:m[2]};});}
if(require.main===module){
  const at=process.argv[2];
  if(at){
    if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(at)||!Number.isFinite(Date.parse(at))){console.error(`not a UTC time like 2026-11-01T17:00:00Z: ${at}`);process.exit(1);}
    for(const c of RELEASE_TIME_CONSTANTS){const file=path.join(ROOT,c.file),source=fs.readFileSync(file,"utf8");if(!pattern(c.name).test(source))throw new Error(`${c.file}: no ${c.name} literal`);fs.writeFileSync(file,source.replace(pattern(c.name),`$1${at}$3`));}
  }
  for(const c of read())console.log(`${c.value}  ${c.name}  ${c.file}`);
}
module.exports={RELEASE_TIME_CONSTANTS,NOT_RELEASE_TIME,read};

```


## FILE: js/rosterRouletteStep.js (at 443486cb84fffcb344409e84e12e2e7245e936cd)
```
(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeRosterRouletteStep=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  // r87 Russian Roster Roulette, the season step (Nik 2026-10-28/29/30; look = Team V HO-040, approved 29 Oct). Every season,
  // before this manager's Transfer Challenge opens, both spins play in Team V's page in a full-screen frame, Daniel first, with
  // the outcome from js/rosterRoulette.js (the Showdown id decides, so both phones agree; HO040-M1); then he confirms the
  // release in his FIFA 17 save. The app never releases anyone itself. The boards build themselves (Nik 2026-10-30): the
  // FIFA 17 launch board excluding the Special Player, then each season's shot player out and kept signings in by position and overall, from
  // last seasons' Transfer War verdicts and saved shots (kept on this phone when they were shown; otherwise plain reads of
  // both verdict documents and the saved spins per missing season, all seasons at once; F2-12). No board is saved anywhere and nobody types one.
  // Shown once per manager per season on this browser (the watched spin is not replayed); never for a Showdown confirmed
  // before r87. A page that fails to load skips only the animation: the result and the release still show. Anything else that
  // fails (engine, data, an error) keeps the Transfer Challenge closed behind TRY AGAIN / BACK (red team R87-B-02): the seeded
  // shot still counts on later boards, so a manager must never reach the window without being told about it.
  const PAGE="visual-assets/v10_1/roulette/index.html";
  const STAGE_ID="rrStage",PANEL_ID="rrStepPanel";
  const DONE_KEY="careerModeShowdown.rouletteDone.v1",WATCHED_KEY="careerModeShowdown.rouletteWatched.v1",KEYS_MAX=60;
  // RRR_FROM_MS is the 2.0.0 release time (red team R87-C-07): a Showdown confirmed before it (played on 1.9.10) gets no
  // roulette. It and js/sparkSharedTransferChallenge.js ROULETTE_FROM_MS are one value, set only by
  // `node tools/set-release-time.cjs <UTC time>` (release contract RX2 checks they match).
  const RRR_FROM_MS=Date.parse("2026-11-01T17:00:00Z");
  const MIN_LOADING_MS=1000,MAX_LOADING_MS=15000,LOAD_WAIT_MS=10000,ARMED_WAIT_MS=5000;
  const ROLES=Object.freeze(["playerOne","playerTwo"]),NAMES=Object.freeze({playerOne:"Daniel",playerTwo:"Nik"});
  const sceneFailedHere=new Set();
  // holding (Fable F2-17): from START until close() (or the way back to Home), so the screens that open the Transfer Challenge
  // keep counting the roulette as on screen while its release is saved and the window is navigated to. loading: the Reus Gate
  // loading screen, held from START until a card or the scene is ready (Fable F2-13).
  let running=null,leftForHome=false,holding=false,loading=null,loadingShows=0,loadingPrior=null;

  function rrsDoc(){return root.document||null;}
  function rrsWait(ms){return new Promise(resolve=>root.setTimeout(resolve,ms));}
  function rrsOther(role){return role==="playerOne"?"playerTwo":"playerOne";}
  function rrsKey(ctx){return `${ctx.rivalryId}|${ctx.season}|${ctx.managerRole}`;}
  // Both lists go through the app's storage helpers (js/storage.js), like every other browser-kept value.
  function rrsList(key){try{const value=JSON.parse(typeof root.readStorageValue==="function"&&root.readStorageValue(key)||"[]");return Array.isArray(value)?value.filter(item=>typeof item==="string"):[];}catch(_error){return [];}}
  function rrsHas(key,item){return rrsList(key).includes(item);}
  function rrsMark(key,item){try{const list=rrsList(key).filter(value=>value!==item);list.push(item);if(typeof root.writeStorageValue==="function")root.writeStorageValue(key,JSON.stringify(list.slice(-KEYS_MAX)));}catch(_error){}}
  async function rrsLoad(key,path,ready){if(ready())return true;if(typeof root.loadRuntimeScript!=="function")return false;await root.loadRuntimeScript(key,path,ready);return Boolean(ready());}
  // The Special Player draw (data/marqueePlayers.js + js/marqueePlayer.js), also wanted by the Transfer War signing form
  // (R87-SP-02) when this season's roulette is already done on this browser (Fable F2-06).
  // Fable F6-05: the load wait counts only time the page is on screen (rrsVisibleWait), so a phone locked on a cold cache
  // does not come back to "The roulette could not load".
  function rrsLoadWait(loads){let stop=()=>{};const timeout=new Promise(resolve=>{stop=rrsVisibleWait(LOAD_WAIT_MS,()=>resolve(false));});return Promise.race([loads,timeout]).finally(()=>stop());}
  function rrsEnsureDraw(){
    const loads=Promise.all([
      rrsLoad("marquee-player-list","data/marqueePlayers.js",()=>Boolean(root.CareerModeMarqueePlayers)),
      rrsLoad("marquee-player","js/marqueePlayer.js",()=>Boolean(root.CareerModeMarqueePlayer))
    ]).then(list=>list.every(Boolean),()=>false);
    return rrsLoadWait(loads);
  }
  async function rrsEnsure(){
    const loads=Promise.all([
      rrsLoad("fifa17-players","data/fifa17Players.js",()=>Boolean(root.CareerModeFifa17Players)),
      rrsLoad("roster-squads","data/rosterSquads.js",()=>Boolean(root.CareerModeRosterSquads)),
      rrsLoad("roster-roulette","js/rosterRoulette.js",()=>Boolean(root.CareerModeRosterRoulette)),
      rrsLoad("marquee-player-list","data/marqueePlayers.js",()=>Boolean(root.CareerModeMarqueePlayers)),
      rrsLoad("marquee-player","js/marqueePlayer.js",()=>Boolean(root.CareerModeMarqueePlayer)),
      typeof root.loadRuntimeStyle==="function"?Promise.resolve(root.loadRuntimeStyle("roulette-step","css/v10Roulette.css")).then(()=>true,()=>true):true
    ]).then(list=>list.every(Boolean),()=>false);
    return rrsLoadWait(loads);
  }

  // ctx = {rivalryId, managerRole, season, clubs:{playerOne,playerTwo}, confirmedAtMs, phase, verdicts(k)} from the Transfer
  // Challenge. True when this manager still has this season's roulette to do on this browser.
  function rrsDecide(ctx){
    if(root.CMS_ROSTER_ROULETTE==="off"||!ctx)return false;
    if(!/^pair_[0-9a-f]{64}$/.test(String(ctx.rivalryId||""))||!ROLES.includes(ctx.managerRole))return false;
    if(!Number.isInteger(ctx.season)||ctx.season<1||ctx.season>10)return false;
    if(!ctx.clubs||!ctx.clubs.playerOne||!ctx.clubs.playerTwo||ctx.phase==="COMPLETED")return false;
    if(!Number.isFinite(ctx.confirmedAtMs)||ctx.confirmedAtMs<RRR_FROM_MS)return false;
    const key=rrsKey(ctx);
    return !rrsHas(DONE_KEY,key);
  }

  // ---------- the panel (marble, like Career Start; no scrim: it sits on the scene or the page as an opaque card) ----------
  function rrsEl(tag,className,text){const node=rrsDoc().createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=String(text);return node;}
  function rrsButton(label,className,onClick){const button=rrsEl("button",className,label);button.type="button";button.addEventListener("click",onClick);return button;}
  function rrsRemovePanel(){const panel=rrsDoc()?.getElementById(PANEL_ID);if(panel)panel.remove();}
  function rrsPanel(ctx,heading,label){
    rrsRemovePanel();
    const overlay=rrsEl("div","remoteJoiningOverlay rrStepOverlay");overlay.id=PANEL_ID;overlay.setAttribute("role","dialog");overlay.setAttribute("aria-modal","true");overlay.setAttribute("aria-label",label);
    const shell=rrsEl("div","remoteJoiningShell rrStepShell"),header=rrsEl("div","remoteJoiningHeader");
    header.append(rrsEl("strong","",`SEASON ${ctx.season} · RUSSIAN ROSTER ROULETTE`));
    const body=rrsEl("div","rrStepBody");body.append(rrsEl("h2","rrStepTitle",heading));
    // No finished scene behind the card (WebGL missing, scene seen before a reload, history retry): stand it in the room, never on the page below.
    if(!rrsDoc().getElementById(STAGE_ID))overlay.classList.add("rrStepRoom");
    shell.append(header,body);overlay.append(shell);rrsDoc().body.append(overlay);
    return {overlay,body};
  }
  // A choice panel: resolves with the id of the button pressed. The card takes over from the loading screen; TRY AGAIN brings
  // the loading screen back over the card until the next card or the scene is ready (Reus Gate, Fable F2-13).
  function rrsAsk(ctx,{heading,label,lines=[],note="",buttons}){
    return new Promise(resolve=>{
      const {body}=rrsPanel(ctx,heading,label);rrsLoadingOff();
      for(const line of lines)body.append(rrsEl("p","rrStepLine",line));
      if(note)body.append(rrsEl("p","rrStepNote",note));
      const row=rrsEl("div","rrStepActions");
      // Fable F11-12: one answer per card; the buttons go quiet at once (saving the spin can take a few seconds after GO).
      const pressed=[];
      for(const b of buttons){const button=rrsButton(b.label,b.primary?"menuButton rrStepPrimary":"backButton",()=>{for(const other of pressed)other.disabled=true;if(b.id==="retry")rrsLoadingOn();resolve(b.id);});pressed.push(button);row.append(button);}
      body.append(row);row.querySelector("button")?.focus();
    });
  }

  // ---------- season 2+: this manager's board ----------
  // The same rules as the engine and the Rules (js/rosterRoulette.js normalizeBoard), with a reason a person can act on.
  // Fable F2-09: the true reason for each answer; "the connection" only when it was the connection.
  function rrsReadError(result,season){
    const quota=root.CareerModeFirestoreBudget?.quotaMessage?.(result);if(quota)return quota;
    const code=String(result&&result.code||"");
    if(/permission/i.test(code))return `Season ${season}'s Transfer War could not be read: the Showdown is not open here. Go back to Showdown Home and open it again.`;
    if(code==="TRANSFER_NOT_COMPLETED")return `Season ${season}'s Transfer War never reached its verdicts, and this season's boards are built from them. Nothing was spun or saved.`;
    if(/STALE|MISMATCH/.test(code))return `This Showdown moved on while this screen was open, so Season ${season}'s Transfer War no longer matches it. Go back to Showdown Home and open it again.`;
    if(!code||/unavailable|deadline|offline|network|aborted|timeout|PROVIDER_FAILED/i.test(code))return `Season ${season}'s Transfer War could not be reached: the connection dropped. Try again when it is back.`;
    return `Season ${season}'s Transfer War could not be read (${code}). Nothing was spun or saved.`;
  }
  // The Special Players both phones drew for this Showdown (js/marqueePlayer.js): {role:{name, overall, number,
  // sourceName}}, or null for a Showdown confirmed before the Special Player. The engine excludes BOTH from both boards
  // (red team R87-C-01) by his own squad database row: name + shirt number (R87-C-05), under the database name when it
  // differs from the display name (R87-D-01, data/marqueePlayers.js sourceNames).
  function rrsSpecial(ctx){
    const draw=root.CareerModeMarqueePlayer,picks=draw&&draw.forShowdown(ctx.rivalryId,ctx.confirmedAtMs,{clubs:ctx.clubs});
    const sourceNames=(root.CareerModeMarqueePlayers&&root.CareerModeMarqueePlayers.sourceNames)||{};
    return picks?Object.fromEntries(ROLES.map(role=>[role,{name:picks[role].name,overall:picks[role].overall,number:picks[role].number,
      sourceName:Object.prototype.hasOwnProperty.call(sourceNames,picks[role].name)?sourceNames[picks[role].name]:null}])):null;
  }
  /* rrsSpecial end */
  // A cosmetic seed for the scene (red team R87-C-06): from the Showdown id and the season, the same on both phones.
  function rrsSeed(ctx){return (parseInt(String(ctx.rivalryId).slice(-8),16)^Math.imul(ctx.season,0x9E3779B1))>>>0;}
  // history[k] = both managers' Transfer War verdicts of season k, for every season before this one; null when the
  // manager leaves.
  // F2-02: also the outcomes each season's spin marks saved (hits[k], or null when that season has none): the engine replays
  // them as the authority. F2-12: all missing seasons are asked for at once; TRY AGAIN asks again only for those that failed.
  async function rrsHistory(ctx,hits){
    const history=[null];
    const first=new Map();for(let k=1;k<ctx.season;k+=1)first.set(k,Promise.resolve(ctx.verdicts(k)).catch(()=>null));
    for(let k=1;k<ctx.season;k+=1){
      for(let attempt=0;;attempt+=1){
        const result=attempt===0?await first.get(k):await ctx.verdicts(k);
        if(result&&result.ok){history.push(result.verdicts);hits[k]=result.hits||null;break;}
        const choice=await rrsAsk(ctx,{heading:"Building the boards",label:"Building the boards",lines:[rrsReadError(result,k)],buttons:[{id:"retry",label:"TRY AGAIN",primary:true},{id:"back",label:"BACK TO SHOWDOWN HOME"}]});
        if(choice==="back")return null;
      }
    }
    return history;
  }

  // ---------- the spins (Team V's page in a frame) ----------
  function rrsShowLoading(){
    const doc=rrsDoc(),el=doc&&doc.getElementById("loadingScreen");if(!el)return {hide(){}};
    // A show during the previous fade keeps the words from before the roulette, not its own.
    const text=doc.getElementById("loadingText"),fading=Boolean(loadingPrior&&el.classList.contains("is-exiting")&&!el.hidden);
    const priorText=fading?loadingPrior.text:text?text.textContent:"",priorLabel=fading?loadingPrior.label:el.getAttribute("aria-label");loadingPrior={text:priorText,label:priorLabel};
    el.style.transition="none";el.classList.remove("is-exiting","hidden");el.hidden=false;el.removeAttribute("aria-hidden");el.setAttribute("aria-busy","true");el.setAttribute("aria-label","Loading the revolver");
    if(text)text.textContent="LOADING THE REVOLVER";
    void el.offsetWidth;el.style.transition="";
    const shows=++loadingShows;let hidden=false;
    return {hide(){
      if(hidden)return;hidden=true;el.setAttribute("aria-hidden","true");el.setAttribute("aria-busy","false");el.classList.add("is-exiting");
      root.setTimeout(()=>{if(shows!==loadingShows)return;/* shown again (TRY AGAIN) during the fade */el.hidden=true;el.classList.add("hidden");if(text)text.textContent=priorText;if(priorLabel!==null)el.setAttribute("aria-label",priorLabel);},240);
    }};
  }
  function rrsLoadingOn(){if(!loading)loading=rrsShowLoading();}
  function rrsLoadingOff(){const shown=loading;loading=null;if(shown)shown.hide();}
  // A wait that only counts time the page was on screen (Fable F2-07): a phone locked or switched away while the scene loads
  // does not use up the wait, so a scene that would have worked is not skipped the moment the manager comes back.
  function rrsVisibleWait(ms,onTimeout){
    const doc=rrsDoc();let timer=null,stopped=false,away=false;
    const hidden=()=>Boolean(doc&&doc.visibilityState==="hidden");
    const onVisibility=()=>{if(hidden())away=true;};
    const arm=()=>{timer=root.setTimeout(()=>{if(stopped)return;if(away||hidden()){away=hidden();arm();return;}stop();onTimeout();},ms);};
    const stop=()=>{stopped=true;root.clearTimeout(timer);doc?.removeEventListener?.("visibilitychange",onVisibility);};
    doc?.addEventListener?.("visibilitychange",onVisibility);arm();
    return stop;
  }
  function rrsRemoveStage(){const stage=rrsDoc()?.getElementById(STAGE_ID);if(stage)stage.remove();}
  function rrsCreateStage(ctx){
    const doc=rrsDoc();rrsRemoveStage();
    const stage=doc.createElement("div");stage.id=STAGE_ID;stage.setAttribute("role","dialog");stage.setAttribute("aria-modal","true");stage.setAttribute("aria-label","Russian Roster Roulette");
    stage.style.cssText="position:fixed;inset:0;z-index:95;background:#050403;visibility:hidden";
    const frame=doc.createElement("iframe");frame.title="Russian Roster Roulette";
    const base=typeof root.optionalAssetUrl==="function"?root.optionalAssetUrl(PAGE):PAGE;
    frame.src=`${base}${base.includes("?")?"&":"?"}embed=1&d=${encodeURIComponent(ctx.clubs.playerOne)}&n=${encodeURIComponent(ctx.clubs.playerTwo)}`;
    frame.style.cssText="display:block;width:100%;height:100%;border:0;background:#050403";
    stage.append(frame);doc.body.append(stage);
    return {stage,frame};
  }
  function rrsListen(frame){
    const origin=root.location&&root.location.origin;let onReady,onDone,onArmed;
    const ready=new Promise(resolve=>{onReady=resolve;}),done=new Promise(resolve=>{onDone=resolve;}),armed=new Promise(resolve=>{onArmed=resolve;});
    const handler=event=>{
      if(event.source!==frame.contentWindow||event.origin!==origin||!event.data)return;
      if(event.data.type==="cms-rr-ready")onReady("ready");
      else if(event.data.type==="cms-rr-armed")onArmed("armed");
      else if(event.data.type==="cms-rr-error"){onReady("error");onArmed("error");onDone("error");}
      else if(event.data.type==="cms-rr-continue")onDone("continue");
    };
    root.addEventListener("message",handler);
    // A page that loads without its 3D library, or not at all, is dropped at once instead of after the full wait.
    frame.addEventListener("load",()=>{try{const view=frame.contentWindow;if(view&&String(view.location.href)==="about:blank")return;if(!view||!view.THREE)onReady("error");}catch(_error){onReady("error");}});
    frame.addEventListener("error",()=>onReady("error"));
    const stopWait=rrsVisibleWait(MAX_LOADING_MS,()=>onReady("timeout"));
    return {ready:ready.finally(stopWait),armed,done,stop(){root.removeEventListener("message",handler);stopWait();}};
  }
  // "watched" when both spins played to the end, "skipped" when the page could not run (the result still shows).
  async function rrsScene(ctx,plan){
    // The loading screen (held since START) covers a card left from a TRY AGAIN; the card goes now, so it can never stand over
    // the scene with dead buttons (Fable F2-03).
    rrsLoadingOn();rrsRemovePanel();
    const shownAt=Date.now();let channel=null,stage=null,frame=null;
    try{
      ({stage,frame}=rrsCreateStage(ctx));channel=rrsListen(frame);
      if(await channel.ready!=="ready")throw new Error("Roulette page did not start.");
      const boardOf=role=>plan.boards[role].map(p=>({pos:p.pos,position:p.positions[0]||null,name:p.name||"EMPTY SLOT",special:p.special===true,rating:p.name&&p.rating>0?p.rating:null,number:p.name&&Number.isInteger(p.number)?p.number:null}));
      // The whole spin plan (red team R87-C-06): the scene loads bulletChamber, stops on stopChamber and aims at hitSlot
      // (a safe turn at aimSlot), so both phones show the same chambers and the same player.
      const turns=plan.turns.map(turn=>({fire:turn.fired,target:turn.player?turn.player.name:null,targetLabel:turn.player?rrsPlayerLabel(turn.player):null,targetNumber:turn.player?rrsPlayerFacts(turn.player).number:null,targetPosition:turn.player?rrsPlayerFacts(turn.player).position:null,targetRating:turn.player?rrsPlayerFacts(turn.player).rating:null,bulletChamber:turn.bulletChamber,stopChamber:turn.stopChamber,hitSlot:turn.hitSlot,aimSlot:turn.aimSlot}));
      frame.contentWindow.postMessage({type:"cms-rr-setup",d:ctx.clubs.playerOne,n:ctx.clubs.playerTwo,boards:{D:boardOf("playerOne"),N:boardOf("playerTwo")},formations:{D:plan.formations.playerOne,N:plan.formations.playerTwo},turns,seed:rrsSeed(ctx)},root.location.origin);
      // Red team RT5-FLOW-01: the stage stays hidden until the page says it took the setup ("cms-rr-armed"). A page that
      // drops it (its squads file failed) or never answers is removed after ARMED_WAIT_MS and the result panel shows.
      let stopArmed=()=>{};
      const armed=await Promise.race([channel.armed,new Promise(resolve=>{stopArmed=rrsVisibleWait(ARMED_WAIT_MS,()=>resolve("timeout"));})]);
      stopArmed();
      if(armed!=="armed")throw new Error("Roulette page did not take the spins.");
      const left=MIN_LOADING_MS-(Date.now()-shownAt);if(left>0)await rrsWait(left);
      stage.style.visibility="visible";
    }catch(_error){if(channel)channel.stop();sceneFailedHere.add(rrsKey(ctx));rrsRemoveStage();return "skipped";}// the result card takes over from the loading screen
    rrsLoadingOff();
    try{frame.focus();}catch(_error){}
    const end=await channel.done;channel.stop();
    if(end!=="continue"){sceneFailedHere.add(rrsKey(ctx));rrsRemoveStage();return "skipped";}// F11-11: never a dead frame under the card
    return "watched";
  }

  // ---------- the result and the release ----------
  // Codex C2-01: a name alone does not tell namesakes apart (Alavés has a Manu García #19 and #26), so the release names the
  // shirt number (when the squad lists one), the position and the overall.
  function rrsPlayerFacts(p){
    const number=Number.isInteger(p&&p.number)?p.number:null,position=(p&&Array.isArray(p.positions)&&p.positions[0])||(p&&p.pos&&p.pos!=="SUB"?p.pos:null),rating=p&&Number.isInteger(p.rating)&&p.rating>0?p.rating:null;
    return {number,position,rating};
  }
  function rrsPlayerLabel(p){
    const f=rrsPlayerFacts(p),parts=[f.number!==null?`#${f.number}`:null,f.position,f.rating!==null?`${f.rating} overall`:null].filter(Boolean);
    return parts.length?`${p.name} (${parts.join(", ")})`:String(p.name);
  }
  function rrsOutcomeLine(turn){return turn.fired?`${NAMES[turn.role]} lost ${rrsPlayerLabel(turn.player)}.`:`${NAMES[turn.role]}: empty chamber. Squad safe.`;}
  // F2-19 (Fable job 2): a kept signing the board rules keep off is said in one line, never dropped silently. Signings are known
  // by name only, so a name the roulette shot, a Special Player's, or a guessed and released signing's keeps him off the board.
  const RRS_SKIP_WHY=Object.freeze({
    shot:name=>`the roulette shot a ${name}, and a shot player never comes back.`,
    special:name=>`${name} is a Special Player's name, and a Special Player is never on a board.`,
    guessed:name=>`a ${name} was guessed and released in the Transfer War, and a released player stays off the board.`,
    reserve:name=>`${name} waits in your reserves: every starter in his line and every sub has a higher overall.`});
  function rrsSkippedLines(plan,role){
    const list=plan&&plan.skipped&&Array.isArray(plan.skipped[role])?plan.skipped[role]:[];
    return list.filter(item=>item&&typeof item.name==="string"&&RRS_SKIP_WHY[item.reason]).map(item=>`${item.name} (signed in season ${item.season}) is not on your board: ${RRS_SKIP_WHY[item.reason](item.name)}`);
  }
  async function rrsResult(ctx,plan){
    const mine=plan.turns.find(turn=>turn.role===ctx.managerRole);
    const lines=[...plan.turns.map(rrsOutcomeLine),...rrsSkippedLines(plan,ctx.managerRole)];
    const choice=mine.fired
      ?await rrsAsk(ctx,{heading:`Release ${mine.player.name}${Number.isInteger(mine.player.number)?` #${mine.player.number}`:""}`,label:"Release your player",lines,
        note:`Release ${rrsPlayerLabel(mine.player)} in your FIFA 17 save now, before the transfer window. The game can't do it for you.`,
        buttons:[{id:"go",label:"I'VE RELEASED HIM",primary:true},{id:"back",label:"BACK TO SHOWDOWN HOME"}]})
      :await rrsAsk(ctx,{heading:"Your squad is safe",label:"Your squad is safe",lines,note:"Your squad stays as it is this season.",
        buttons:[{id:"go",label:"GO TO THE TRANSFER WINDOW",primary:true},{id:"back",label:"BACK TO SHOWDOWN HOME"}]});
    return choice==="go";
  }

  // ---------- F2-02 / F2-10: the spin marks on the server ----------
  // ctx.marks = this season's marks as the Transfer Challenge read them ({playerOne, playerTwo}: true, an outcome, or null), or
  // null once the window opened (both managers had spun: START needs both marks). An outcome is {fired, hitName, hitNumber,
  // hitSlot, hitSignedSeason, version}.
  function rrsOutcomeOf(entry){return entry&&typeof entry==="object"&&typeof entry.fired==="boolean"&&typeof entry.version==="string"?entry:null;}
  function rrsSpunOnServer(ctx){return ctx.windowStarted===true||Boolean(ctx.marks&&ctx.marks[ctx.managerRole]);}
  // F2-02: the partner spun this season on a different version of the game (another build, or other squad data), so the two
  // phones could show different players. Said plainly, never a silent desync. TRY AGAIN reads the marks again (after either
  // phone was updated); the partner's saved spin stands for him either way, so CONTINUE goes on with it as the authority.
  async function rrsVersionStop(ctx,version){
    for(;;){
      const partner=rrsOutcomeOf(ctx.marks&&ctx.marks[rrsOther(ctx.managerRole)]);
      if(!version||!partner||partner.version===version||rrsSpunOnServer(ctx)&&ctx.marks&&ctx.marks[ctx.managerRole])return true;
      const name=NAMES[rrsOther(ctx.managerRole)];
      const choice=await rrsAsk(ctx,{heading:"Update the game on the other phone",label:"Update the game on the other phone",
        lines:[`${name} spun this season's roulette on a different version of the game, so the two phones could show different players.`,`Update the game on ${name}'s phone: close it fully and open it again. If yours is the one behind, do the same on yours. Then tap TRY AGAIN.`],
        note:`Your version: ${version} · ${name}'s spin: ${partner.version}. ${name}'s saved spin stands for him either way.`,
        buttons:[{id:"retry",label:"TRY AGAIN",primary:true},{id:"continue",label:`CONTINUE WITH ${name.toUpperCase()}'S SAVED SPIN`},{id:"back",label:"BACK TO SHOWDOWN HOME"}]});
      if(choice==="back")return false;
      if(choice==="continue")return true;
      if(typeof ctx.refreshMarks==="function"){try{const next=await ctx.refreshMarks();if(next&&typeof next==="object"){ctx.marks=next.marks===undefined?ctx.marks:next.marks;ctx.windowStarted=next.windowStarted===true;}}catch(_error){}}
    }
  }

  // Fable F2-04: why no plan could be built, in words a manager can act on (the engine only answers null).
  function rrsNoPlanReason(ctx,engine,history){
    for(const role of ROLES){
      const club=ctx.clubs[role];
      if(!engine.board(club)||!root.CareerModeFifa17Players?.clubs?.[club])return `There is no FIFA 17 squad for ${club} in this version of the app, so this season's boards cannot be built. Nothing was spun or saved.`;
    }
    for(let k=1;k<ctx.season;k+=1)if(!history[k]||!ROLES.every(role=>Array.isArray(history[k][role])))return `Season ${k}'s Transfer War verdicts could not be used to build this season's boards. Nothing was spun or saved.`;
    return "This season's boards could not be built. Nothing was spun or saved.";
  }
  async function rrsRun(ctx){
    if(!rrsDecide(ctx)||!rrsDoc())return true;
    rrsLoadingOn();
    while(!await rrsEnsure()){
      const choice=await rrsAsk(ctx,{heading:"Loading the roulette",label:"Loading the roulette",lines:["The roulette could not load. Check the connection and try again."],buttons:[{id:"retry",label:"TRY AGAIN",primary:true},{id:"back",label:"BACK TO SHOWDOWN HOME"}]});
      if(choice==="back")return false;
    }
    const engine=root.CareerModeRosterRoulette,key=rrsKey(ctx),special=rrsSpecial(ctx);
    const version=typeof engine.version==="function"?engine.version(ctx.clubs,{special}):null;
    if(!await rrsVersionStop(ctx,version))return false;
    const hits={};
    const history=ctx.season>1?await rrsHistory(ctx,hits):[null];if(!history)return false;
    // This season: a saved mark (this manager's own on a second browser, the partner's always) is the authority for that turn.
    hits[ctx.season]=Object.fromEntries(ROLES.map(role=>[role,rrsOutcomeOf(ctx.marks&&ctx.marks[role])]));
    // Never skipped (Nik 2026-10-31): a short squad shows empty slots and the bullet only hits a real player. A club the data
    // does not know is named before the engine runs (Fable S4); no plan is never marked done (Fable F2-04): the window stays
    // shut and the card says why, with the way back to Showdown Home.
    const known=ROLES.every(role=>engine.board(ctx.clubs[role])&&root.CareerModeFifa17Players?.clubs?.[ctx.clubs[role]]);
    const plan=known?engine.forSeason(ctx.rivalryId,ctx.clubs,ctx.season,{special,history,hits}):null;
    if(!plan||plan.turns.some(turn=>turn.fired&&!turn.player)){
      const reason=plan?"This season's spin could not find the player it hit. Nothing was spun or saved.":rrsNoPlanReason(ctx,engine,history);
      await rrsAsk(ctx,{heading:"No roulette board",label:"No roulette board",lines:[reason],note:"The transfer window stays shut until this season's roulette can run.",buttons:[{id:"back",label:"BACK TO SHOWDOWN HOME",primary:true}]});
      return false;
    }
    // F2-10: the server already holds this manager's spin for this season (another browser or tab, or cleared storage): the
    // result card shows it at once, with no second spin.
    const spun=rrsSpunOnServer(ctx);
    if(spun)rrsMark(WATCHED_KEY,key);
    if(!spun&&!rrsHas(WATCHED_KEY,key)&&!sceneFailedHere.has(key)){
      const scene=await rrsScene(ctx,plan);
      if(scene==="watched")rrsMark(WATCHED_KEY,key);
    }
    const go=await rrsResult(ctx,plan);
    if(!go)return false;
    // F2-02: the outcome this manager's mark records (only while the server has none for him this season).
    if(!spun&&typeof ctx.remember==="function"&&typeof engine.outcome==="function"){try{ctx.remember(engine.outcome(plan,ctx.managerRole,version));}catch(_error){}}
    rrsMark(DONE_KEY,key);
    return true;
  }
  // An unexpected error asks TRY AGAIN / BACK; the same seeded plan is rebuilt on retry and nothing is marked done.
  async function rrsRunGuarded(ctx){
    for(;;){
      try{return await rrsRun(ctx);}
      catch(_error){
        rrsRemoveStage();
        const choice=await rrsAsk(ctx,{heading:"The roulette hit a problem",label:"The roulette hit a problem",lines:["This season's spins could not be built. Nothing was spun or saved."],buttons:[{id:"retry",label:"TRY AGAIN",primary:true},{id:"back",label:"BACK TO SHOWDOWN HOME"}]});
        if(choice==="back")return false;
      }
    }
  }
  // Resolves true when the Transfer Challenge may open, false when the manager went back to Showdown Home (or the step could
  // not even show its panel). Never rejects, and never opens the Transfer Challenge without this season's result.
  // The panel and the stage stay up until close() so nothing shows between them and the next screen.
  function rrsRunBeforeTransfers(ctx){
    if(running)return running;
    leftForHome=false;holding=true;
    const run=Promise.resolve().then(()=>rrsRunGuarded(ctx)).catch(()=>false).then(go=>{
      // Fable F11-08 (Reus Gate): the roulette and the loading screen stay up until Showdown Home is on screen, so Career Start
      // or the Club screen never flashes in between. A new run started meanwhile keeps its own panel and stage.
      if(go===false){leftForHome=true;holding=false;rrsLoadingOn();const tear=()=>{if((running&&running!==run)||holding)return;rrsRemovePanel();rrsRemoveStage();rrsLoadingOff();};
        if(typeof root.navigateTo==="function")void Promise.resolve().then(()=>root.navigateTo("mainMenu")).catch(()=>{}).finally(tear);else tear();}
      return go!==false;
    }).finally(()=>{if(running===run)running=null;});
    running=run;return run;
  }
  function rrsClose(){holding=false;rrsRemovePanel();rrsRemoveStage();rrsLoadingOff();return true;}
  // Red team R87-SP-02: for the Transfer War signing form, is a typed name this manager's own Special Player? The draw is
  // loaded before every window opens (ensureDraw, also when the roulette is already done here: Fable F2-06); false when the
  // Showdown has none.
  function rrsIsOwnSpecial(rivalryId,confirmedAtMs,role,name,clubs){
    const draw=root.CareerModeMarqueePlayer;
    try{return Boolean(draw&&typeof draw.isOwnSpecial==="function"&&draw.isOwnSpecial(rivalryId,confirmedAtMs,role,name,clubs));}catch(_error){return false;}
  }
  // For the screens that open the Transfer Challenge: a roulette is on screen (its pace is the manager's, so no load timeout
  // may end it), and whether the last one ended with the manager going back to Showdown Home (not a failure).
  function rrsActive(){return Boolean(running)||holding;}
  function rrsWentHome(){return leftForHome;}
  // Fable F2-11: a new open forgets an earlier BACK, so a later failure that never reached the roulette is not read as one.
  function rrsForgetHome(){leftForHome=false;return true;}

  return Object.freeze({contractVersion:1,feature:"cms-roster-roulette-step",page:PAGE,stageId:STAGE_ID,panelId:PANEL_ID,doneKey:DONE_KEY,watchedKey:WATCHED_KEY,fromMs:RRR_FROM_MS,decide:rrsDecide,runBeforeTransfers:rrsRunBeforeTransfers,close:rrsClose,active:rrsActive,wentHome:rrsWentHome,forgetHome:rrsForgetHome,ensureDraw:rrsEnsureDraw,isOwnSpecial:rrsIsOwnSpecial});
});

```


## FILE: js/sparkSharedTransferChallenge.js (at 443486cb84fffcb344409e84e12e2e7245e936cd)
```
(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeSparkSharedTransferChallenge=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  const protocol=typeof require==="function"?require("./sharedTransferChallenge.js"):root.CareerModeSharedTransferChallenge;
  const ROLES=Object.freeze(["playerOne","playerTwo"]);
  const OPERATION=/^transfer_op_[0-9a-f]{32}$/;
  const HASH=/^sha256:[0-9a-f]{64}$/;
  const PUBLIC_KEYS=Object.freeze([
    "schemaVersion","objectType","rivalryId","seasonNumber","runtimeRevision","coordinatorRole","phase","revision",
    "startedAt","endedAt","endRequestedRoles","guessLockedRoles","signingLockedRoles",
    "operationIds","operationTypes","operationHashes","baseRevisions","actorRoles",
    "activeSessionId","updatedAt","updatedByDeviceId"
  ]);
  const PRIVATE_KEYS=Object.freeze([
    "schemaVersion","objectType","rivalryId","seasonNumber","managerRole","guesses","signings",
    "guessLockedAt","signingLockedAt","activeSessionId","updatedAt","updatedByDeviceId"
  ]);
  // JOB-1051: a role document written by r66 has exactly PRIVATE_KEYS (no salts); a new one has PRIVATE_KEYS plus both salt keys.
  const SALT_KEYS=Object.freeze(["guessSalt","signingSalt"]);
  const SALT=/^[0-9a-f]{64}$/;
  // r87 (Nik 2026-10-31, red team RT5-FLOW-02): the shared window waits until both managers have spun this season's Russian
  // Roster Roulette. Before the window opens, the season's public document may exist as a small pre-window mark document:
  // each manager adds his own role to spins (one merge write, no read) when he confirms his release. START needs both;
  // starting the window replaces the document with the normal ledger (exactly PUBLIC_KEYS, so no other reader changes).
  const SPIN_KEYS=Object.freeze(["schemaVersion","objectType","rivalryId","seasonNumber","phase","spins","updatedAt"]);
  // F2-02 (Fable job 2): a mark records that season's outcome for its manager (js/rosterRoulette.js outcome): fired, hitName,
  // hitNumber, hitSlot (0-14), hitSignedSeason (1-10, or null for a club player) and the engine and data version. A mark from a
  // phone that ran no roulette (switched off, no confirm time) is plain true. Each manager writes his own entry once (the Rules refuse a second write).
  const OUTCOME_KEYS=Object.freeze(["fired","hitName","hitNumber","hitSlot","hitSignedSeason","version"]);
  const OUTCOME_VERSION=/^rr[0-9]{1,3}\.[0-9]{1,4}\.[0-9a-f]{8}$/;
  // The durable copy START makes of both marks (the mark document itself is replaced by the ledger), so later seasons replay the
  // saved shots: rivalries/{rid}/transferChallenges/season_N/roulette/spins, written once, never changed.
  const RECORD_KEYS=Object.freeze(["schemaVersion","objectType","rivalryId","seasonNumber","spins"]);
  const COMMAND_TYPES=Object.freeze(["start-window","request-end-window","advance-expired-window","lock-guesses","lock-signings"]);
  const CANONICAL_LEAGUE_IDS=Object.freeze((Array.isArray(root.FIFA17_TRANSFER_LEAGUES)?root.FIFA17_TRANSFER_LEAGUES:[]).map(item=>item&&item.id).filter(Boolean));
  const CANONICAL_NATIONALITY_IDS=Object.freeze((Array.isArray(root.FIFA17_TRANSFER_NATIONALITIES)?root.FIFA17_TRANSFER_NATIONALITIES:[]).map(item=>item&&item.id).filter(Boolean));

  function stspFail(code,message){const error=new Error(message||code);error.code=code;throw error;}
  function stspResultError(error){return Object.freeze({ok:false,code:error&&typeof error.code==="string"?error.code:"TRANSFER_PROVIDER_FAILED"});}
  function stspSnapshot(value){return value&&typeof value.exists==="function"&&value.exists()?value.data():null;}
  function stspPlain(value){return !!value&&typeof value==="object"&&!Array.isArray(value);}
  function stspExact(value,keys,code="TRANSFER_PROVIDER_STATE_INVALID"){if(!stspPlain(value)||Object.keys(value).length!==keys.length||keys.some(key=>!Object.hasOwn(value,key)))stspFail(code);return value;}
  function stspClone(value){return JSON.parse(JSON.stringify(value));}
  function stspFreeze(value){if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.values(value).forEach(stspFreeze);Object.freeze(value);}return value;}
  function stspCanonical(value){if(Array.isArray(value))return `[${value.map(stspCanonical).join(",")}]`;if(value&&typeof value==="object"&&Object.getPrototypeOf(value)===Object.prototype)return `{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${stspCanonical(value[key])}`).join(",")}}`;return JSON.stringify(value);}
  async function stspHash(value,cryptoImpl){if(!cryptoImpl?.subtle||typeof TextEncoder==="undefined")stspFail("TRANSFER_CRYPTO_UNAVAILABLE");const bytes=await cryptoImpl.subtle.digest("SHA-256",new TextEncoder().encode(stspCanonical(value)));return `sha256:${Array.from(new Uint8Array(bytes),byte=>byte.toString(16).padStart(2,"0")).join("")}`;}
  // JOB-1051: 32 random bytes, hex. Stored only in the actor's own private role document (unreadable by the rival until COMPLETED).
  function stspNewSalt(cryptoImpl){if(!cryptoImpl||typeof cryptoImpl.getRandomValues!=="function")stspFail("TRANSFER_CRYPTO_UNAVAILABLE");return Array.from(cryptoImpl.getRandomValues(new Uint8Array(32)),byte=>byte.toString(16).padStart(2,"0")).join("");}
  function stspNormalizeRivalryId(value){const id=String(value||"").trim().toLowerCase();if(!/^pair_[0-9a-f]{64}$/.test(id))stspFail("TRANSFER_RIVALRY_INVALID");return id;}
  function stspNormalizeSessionId(value){const id=String(value||"").trim().toLowerCase();if(!/^session_[0-9a-f]{64}$/.test(id))stspFail("TRANSFER_SESSION_INVALID");return id;}
  function stspNormalizeDeviceId(value){const id=String(value||"").trim().toLowerCase();if(!/^device_[0-9a-f]{32}$/.test(id))stspFail("TRANSFER_DEVICE_INACTIVE");return id;}
  function stspNormalizeOperationId(value){const id=String(value||"").trim().toLowerCase();if(!OPERATION.test(id))stspFail("TRANSFER_COMMAND_INVALID");return id;}
  function stspAccountId(user){const id=user&&typeof user.uid==="string"?user.uid.trim():"";if(!id)stspFail("TRANSFER_AUTH_REQUIRED");return id;}
  function stspSeason(value,totalSeasons){const season=Number(value);if(!Number.isInteger(season)||season<1||season>totalSeasons)stspFail("TRANSFER_SEASON_INVALID");return season;}
  function stspEpoch(value){const n=Number(value===undefined?Date.now():value);if(!Number.isSafeInteger(n)||n<0)stspFail("TRANSFER_CLOCK_INVALID");return n;}
  // RT5-FLOW-02 eligibility, shared by this provider, the Transfer Challenge UI and (by its fromMs) js/rosterRouletteStep.js:
  // the roulette runs for a Showdown whose Setup was confirmed at or after RRR_FROM_MS, unless CMS_ROSTER_ROULETTE is "off".
  // The 2.0.0 release time, set with RRR_FROM_MS by `node tools/set-release-time.cjs <UTC time>`.
  const ROULETTE_FROM_MS=Date.parse("2026-11-01T17:00:00Z");
  function stspRouletteEligible(confirmedAtMs){return Number.isFinite(confirmedAtMs)&&confirmedAtMs>=ROULETTE_FROM_MS&&root.CMS_ROSTER_ROULETTE!=="off";}
  function stspTimestampMillis(value){if(value&&typeof value.toMillis==="function")return value.toMillis();if(value instanceof Date)return value.getTime();return Number.NaN;}
  function stspTimestamp(sdk,epoch){if(!sdk.Timestamp||typeof sdk.Timestamp.fromMillis!=="function")stspFail("TRANSFER_PROVIDER_UNAVAILABLE");return sdk.Timestamp.fromMillis(epoch);}
  function stspServerTimestamp(sdk){if(typeof sdk.serverTimestamp!=="function")stspFail("TRANSFER_PROVIDER_UNAVAILABLE");return sdk.serverTimestamp();}
  function stspValidateSdk(options){if(!options.firestore)stspFail("TRANSFER_PROVIDER_UNAVAILABLE");for(const name of ["doc","runTransaction","serverTimestamp"]){if(!options.firebaseSdk||typeof options.firebaseSdk[name]!=="function")stspFail("TRANSFER_PROVIDER_UNAVAILABLE");}if(!options.firebaseSdk.Timestamp||typeof options.firebaseSdk.Timestamp.fromMillis!=="function")stspFail("TRANSFER_PROVIDER_UNAVAILABLE");}
  function stspRoleList(value,code="TRANSFER_PROVIDER_STATE_INVALID"){if(!Array.isArray(value)||value.length>2||new Set(value).size!==value.length||value.some(role=>!ROLES.includes(role)))stspFail(code);return value;}
  function stspCatalog(){
    if(CANONICAL_LEAGUE_IDS.length!==36||CANONICAL_NATIONALITY_IDS.length!==164)stspFail("TRANSFER_CATALOG_UNAVAILABLE");
    return Object.freeze({leagueIds:new Set(CANONICAL_LEAGUE_IDS),nationalityIds:new Set(CANONICAL_NATIONALITY_IDS)});
  }
  function stspNormalizeGuesses(value,catalog){
    if(!Array.isArray(value)||value.length>3)stspFail("TRANSFER_GUESSES_INVALID");const slots=new Set();
    return value.map(item=>{stspExact(item,["slot","type","valueId"],"TRANSFER_GUESSES_INVALID");if(!Number.isInteger(item.slot)||item.slot<1||item.slot>3||slots.has(item.slot))stspFail("TRANSFER_GUESSES_INVALID");slots.add(item.slot);if(item.type!=="league"&&item.type!=="nationality")stspFail("TRANSFER_GUESSES_INVALID");const allowed=item.type==="league"?catalog.leagueIds:catalog.nationalityIds;if(!allowed.has(item.valueId))stspFail("TRANSFER_GUESSES_INVALID");return {slot:item.slot,type:item.type,valueId:item.valueId};}).sort((a,b)=>a.slot-b.slot);
  }
  function stspNormalizeSignings(value,catalog){
    if(!Array.isArray(value)||value.length>3)stspFail("TRANSFER_SIGNINGS_INVALID");const slots=new Set();
    return value.map(item=>{const hasOverall=Boolean(item&&typeof item==="object"&&Object.hasOwn(item,"overall")),hasPosition=Boolean(item&&typeof item==="object"&&Object.hasOwn(item,"position"));/* r87: optional FIFA 17 overall (30-99) and position */stspExact(item,["slot","name","leagueId","nationalityId",...(hasOverall?["overall"]:[]),...(hasPosition?["position"]:[])],"TRANSFER_SIGNINGS_INVALID");if(hasPosition&&!["GK","RB","RWB","CB","LB","LWB","CDM","CM","CAM","RM","LM","RW","LW","CF","ST"].includes(item.position))stspFail("TRANSFER_SIGNINGS_INVALID");if(hasOverall&&!(Number.isInteger(item.overall)&&item.overall>=30&&item.overall<=99))stspFail("TRANSFER_SIGNINGS_INVALID");if(!Number.isInteger(item.slot)||item.slot<1||item.slot>3||slots.has(item.slot))stspFail("TRANSFER_SIGNINGS_INVALID");slots.add(item.slot);if(typeof item.name!=="string"||!item.name||item.name!==item.name.trim()||item.name.length>80||!catalog.leagueIds.has(item.leagueId)||!catalog.nationalityIds.has(item.nationalityId))stspFail("TRANSFER_SIGNINGS_INVALID");const row={slot:item.slot,name:item.name,leagueId:item.leagueId,nationalityId:item.nationalityId};if(hasOverall)row.overall=item.overall;if(hasPosition)row.position=item.position;return row;}).sort((a,b)=>a.slot-b.slot);
  }
  function stspAssertAccount(value,uid){if(!value||value.objectType!=="account"||value.objectId!==uid||value.lifecycleState!=="live"||!value.data||value.data.status!=="active")stspFail("TRANSFER_MANAGER_INACTIVE");}
  function stspAssertDevice(value,deviceId){if(!value||value.objectType!=="device"||value.objectId!==deviceId||value.lifecycleState!=="live"||!value.data||value.data.deviceId!==deviceId||value.data.state!=="active")stspFail("TRANSFER_DEVICE_INACTIVE");}
  function stspAssertRivalry(value,rivalryId,uid){
    if(!value||value.objectType!=="rivalry"||value.objectId!==rivalryId||value.lifecycleState!=="live"||!value.data||value.data.connectionState!=="active")stspFail("TRANSFER_RIVALRY_INACTIVE");
    const slots=Array.isArray(value.data.managerSlots)?value.data.managerSlots:[],authorized=Array.isArray(value.data.authorizedAccountIds)?value.data.authorizedAccountIds:[];
    if(slots.length!==2||authorized.length!==2||new Set(authorized).size!==2)stspFail("TRANSFER_TWO_MANAGERS_REQUIRED");
    const ordered=ROLES.map(role=>slots.find(item=>item&&item.slotId===role));
    if(ordered.some(item=>!item||item.entitlementState!=="active"||typeof item.accountId!=="string")||ordered[0].accountId===ordered[1].accountId||!ordered.every(item=>authorized.includes(item.accountId)))stspFail("TRANSFER_BINDING_INVALID");
    const actor=ordered.find(item=>item.accountId===uid);if(!actor)stspFail("TRANSFER_ACTOR_NOT_ENTITLED");return Object.freeze({slots:ordered,authorized,actor});
  }
  function stspAssertSession(value,rivalryId,sessionId,authorized,now){
    if(!value||value.objectType!=="session"||value.objectId!==sessionId||value.lifecycleState!=="live"||!value.data)stspFail("TRANSFER_SESSION_INVALID");
    const members=Array.isArray(value.data.memberAccountIds)?value.data.memberAccountIds:[],expires=stspTimestampMillis(value.data.expiresAt);
    if(value.data.rivalryId!==rivalryId||value.data.state!=="active"||members.length!==2||new Set(members).size!==2||!authorized.every(id=>members.includes(id))||!members.every(id=>authorized.includes(id))||!Number.isFinite(expires))stspFail("TRANSFER_ACTIVE_SESSION_REQUIRED");
  }
  function stspAssertSetup(value,rivalryId){
    if(!value||value.schemaVersion!==1||value.objectType!=="sharedSetupLedger"||value.rivalryId!==rivalryId||value.revision!==6||value.phase!=="SHOWDOWN_CONFIRMED"||!ROLES.includes(value.coordinatorRole)||![1,3,5,10].includes(value.totalSeasons))stspFail("TRANSFER_SETUP_NOT_CONFIRMED");
    if(!Array.isArray(value.confirmedRoles)||value.confirmedRoles.length!==2||!ROLES.every(role=>value.confirmedRoles.includes(role)))stspFail("TRANSFER_SETUP_NOT_CONFIRMED");return value;
  }
  function stspAssertCareer(value,rivalryId,setup){
    if(!value||value.schemaVersion!==1||value.objectType!=="sharedCareerStart"||value.rivalryId!==rivalryId||value.setupRevision!==6||value.totalSeasons!==setup.totalSeasons||value.revision!==2||value.phase!=="CAREER_START_READY")stspFail("TRANSFER_CAREER_START_NOT_READY");
    if(!Array.isArray(value.acknowledgedRoles)||value.acknowledgedRoles.length!==2||!ROLES.every(role=>value.acknowledgedRoles.includes(role)))stspFail("TRANSFER_CAREER_START_NOT_READY");return value;
  }
  // The pre-window mark document: null when it is absent or the ledger has started, else the roles that have spun (in role order).
  function stspIsPreWindow(value){return stspPlain(value)&&value.phase==="NOT_STARTED";}
  // A valid outcome (frozen copy), or null.
  function stspOutcome(value){
    if(!stspPlain(value)||Object.keys(value).length!==OUTCOME_KEYS.length||OUTCOME_KEYS.some(key=>!Object.hasOwn(value,key)))return null;
    if(typeof value.fired!=="boolean"||typeof value.version!=="string"||!OUTCOME_VERSION.test(value.version))return null;
    if(value.fired){
      if(typeof value.hitName!=="string"||!value.hitName||value.hitName!==value.hitName.trim()||value.hitName.length>80||!Number.isInteger(value.hitSlot)||value.hitSlot<0||value.hitSlot>14||!(value.hitNumber===null||(Number.isInteger(value.hitNumber)&&value.hitNumber>=0&&value.hitNumber<=99))||!(value.hitSignedSeason===null||(Number.isInteger(value.hitSignedSeason)&&value.hitSignedSeason>=1&&value.hitSignedSeason<=10)))return null;
    }else if(value.hitName!==null||value.hitNumber!==null||value.hitSlot!==null||value.hitSignedSeason!==null)return null;
    return Object.freeze({fired:value.fired,hitName:value.hitName,hitNumber:value.hitNumber,hitSlot:value.hitSlot,hitSignedSeason:value.hitSignedSeason,version:value.version});
  }
  // {playerOne, playerTwo}: each manager's stored entry (true, or his outcome), or null when he has none.
  function stspSpinEntries(spins){
    if(!stspPlain(spins)||Object.keys(spins).some(role=>!ROLES.includes(role)))stspFail("TRANSFER_PROVIDER_STATE_INVALID");
    const entries={};
    for(const role of ROLES){
      if(!Object.hasOwn(spins,role)){entries[role]=null;continue;}
      const entry=spins[role]===true?true:stspOutcome(spins[role]);
      if(!entry)stspFail("TRANSFER_PROVIDER_STATE_INVALID");entries[role]=entry;
    }
    return Object.freeze(entries);
  }
  function stspSpinMarks(value,rivalryId,seasonNumber){
    if(!stspIsPreWindow(value))return null;stspExact(value,SPIN_KEYS);
    if(value.schemaVersion!==1||value.objectType!=="sharedTransferChallenge"||value.rivalryId!==rivalryId||value.seasonNumber!==seasonNumber)stspFail("TRANSFER_PROVIDER_STATE_INVALID");
    return stspSpinEntries(value.spins);
  }
  function stspSpins(value,rivalryId,seasonNumber){const marks=stspSpinMarks(value,rivalryId,seasonNumber);return marks?ROLES.filter(role=>marks[role]!==null):null;}
  function stspPublicState(value,rivalryId,seasonNumber,setup){
    if(!value||stspIsPreWindow(value))return null;stspExact(value,PUBLIC_KEYS);
    if(value.schemaVersion!==1||value.objectType!=="sharedTransferChallenge"||value.rivalryId!==rivalryId||value.seasonNumber!==seasonNumber||value.runtimeRevision!==protocol.runtimeRevision||value.coordinatorRole!==setup.coordinatorRole||!protocol.phases.includes(value.phase)||!Number.isInteger(value.revision)||value.revision<1||value.revision>7)stspFail("TRANSFER_PROVIDER_STATE_INVALID");
    const startedAtEpochMs=stspTimestampMillis(value.startedAt),endedAtEpochMs=value.endedAt===null?null:stspTimestampMillis(value.endedAt);if(!Number.isFinite(startedAtEpochMs)||(value.endedAt!==null&&!Number.isFinite(endedAtEpochMs)))stspFail("TRANSFER_PROVIDER_STATE_INVALID");
    stspRoleList(value.endRequestedRoles);stspRoleList(value.guessLockedRoles);stspRoleList(value.signingLockedRoles);
    for(const key of ["operationIds","operationTypes","operationHashes","baseRevisions","actorRoles"]){if(!Array.isArray(value[key])||value[key].length!==value.revision)stspFail("TRANSFER_PROVIDER_STATE_INVALID");}
    if(new Set(value.operationIds).size!==value.operationIds.length||value.operationIds.some(id=>!OPERATION.test(id))||value.operationTypes.some(type=>!COMMAND_TYPES.includes(type))||value.operationHashes.some(hash=>!HASH.test(hash))||value.baseRevisions.some((base,index)=>base!==index)||value.actorRoles.some(role=>!ROLES.includes(role)))stspFail("TRANSFER_PROVIDER_STATE_INVALID");
    if(value.phase==="WINDOW_OPEN"&&(value.endedAt!==null||value.guessLockedRoles.length||value.signingLockedRoles.length))stspFail("TRANSFER_PROVIDER_STATE_INVALID");
    if(value.phase==="GUESS_ENTRY"&&(value.endedAt===null||value.signingLockedRoles.length))stspFail("TRANSFER_PROVIDER_STATE_INVALID");
    if(value.phase==="SIGNING_ENTRY"&&(value.endedAt===null||value.guessLockedRoles.length!==2||value.signingLockedRoles.length>1))stspFail("TRANSFER_PROVIDER_STATE_INVALID");
    if(value.phase==="COMPLETED"&&(value.endedAt===null||value.guessLockedRoles.length!==2||value.signingLockedRoles.length!==2))stspFail("TRANSFER_PROVIDER_STATE_INVALID");
    if(!/^session_[0-9a-f]{64}$/.test(value.activeSessionId||"")||!/^device_[0-9a-f]{32}$/.test(value.updatedByDeviceId||""))stspFail("TRANSFER_PROVIDER_STATE_INVALID");
    return stspFreeze({seasonNumber,coordinatorRole:value.coordinatorRole,phase:value.phase,revision:value.revision,startedAtEpochMs,endedAtEpochMs,endRequestedRoles:[...value.endRequestedRoles],guessLockedRoles:[...value.guessLockedRoles],signingLockedRoles:[...value.signingLockedRoles],operationIds:[...value.operationIds],operationTypes:[...value.operationTypes],operationHashes:[...value.operationHashes],baseRevisions:[...value.baseRevisions],actorRoles:[...value.actorRoles]});
  }
  function stspPrivateState(value,rivalryId,seasonNumber,role,catalog){
    if(!value)return null;
    const salted=stspPlain(value)&&Object.hasOwn(value,SALT_KEYS[0]);stspExact(value,salted?[...PRIVATE_KEYS,...SALT_KEYS]:PRIVATE_KEYS);
    if(value.schemaVersion!==1||value.objectType!=="sharedTransferChallengeRole"||value.rivalryId!==rivalryId||value.seasonNumber!==seasonNumber||value.managerRole!==role)stspFail("TRANSFER_PRIVATE_STATE_INVALID");
    const guesses=value.guesses===null?null:stspNormalizeGuesses(value.guesses,catalog),signings=value.signings===null?null:stspNormalizeSignings(value.signings,catalog),guessLockedAtEpochMs=value.guessLockedAt===null?null:stspTimestampMillis(value.guessLockedAt),signingLockedAtEpochMs=value.signingLockedAt===null?null:stspTimestampMillis(value.signingLockedAt);
    if((guesses===null)!==(guessLockedAtEpochMs===null)||(signings===null)!==(signingLockedAtEpochMs===null)||(guessLockedAtEpochMs!==null&&!Number.isFinite(guessLockedAtEpochMs))||(signingLockedAtEpochMs!==null&&!Number.isFinite(signingLockedAtEpochMs))||!/^session_[0-9a-f]{64}$/.test(value.activeSessionId||"")||!/^device_[0-9a-f]{32}$/.test(value.updatedByDeviceId||""))stspFail("TRANSFER_PRIVATE_STATE_INVALID");
    const guessSalt=salted?value.guessSalt:null,signingSalt=salted?value.signingSalt:null;
    // A salt exists only together with the lock it belongs to, and is exactly 64 lowercase hex characters.
    for(const [salt,locked] of [[guessSalt,guesses],[signingSalt,signings]])if(salt!==null&&(typeof salt!=="string"||!SALT.test(salt)||locked===null))stspFail("TRANSFER_PRIVATE_STATE_INVALID");
    return stspFreeze({guesses,signings,guessLockedAtEpochMs,signingLockedAtEpochMs,guessSalt,signingSalt});
  }
  function stspPublicLedger(state,ctx,serverNow,type){
    const prior=ctx.publicValue||null,startedAt=type==="start-window"?serverNow:(prior?.startedAt||stspTimestamp(ctx.sdk,state.startedAtEpochMs));let endedAt=null;
    if(state.endedAtEpochMs!==null){
      const earlyEnd=type==="request-end-window"&&state.phase==="GUESS_ENTRY"&&state.endRequestedRoles.length===2;
      if(earlyEnd||type==="advance-expired-window")endedAt=serverNow;
      else endedAt=prior?.endedAt||stspTimestamp(ctx.sdk,state.endedAtEpochMs);
    }
    return {schemaVersion:1,objectType:"sharedTransferChallenge",rivalryId:ctx.rivalryId,seasonNumber:ctx.seasonNumber,runtimeRevision:protocol.runtimeRevision,coordinatorRole:state.coordinatorRole,phase:state.phase,revision:state.revision,startedAt,endedAt,endRequestedRoles:[...state.endRequestedRoles],guessLockedRoles:[...state.guessLockedRoles],signingLockedRoles:[...state.signingLockedRoles],operationIds:[...state.operationIds],operationTypes:[...state.operationTypes],operationHashes:[...state.operationHashes],baseRevisions:[...state.baseRevisions],actorRoles:[...state.actorRoles],activeSessionId:ctx.sessionId,updatedAt:serverNow,updatedByDeviceId:ctx.deviceId};
  }
  function stspPrivateLedger(privateState,ctx,role,serverNow,type){
    const prior=ctx.ownValue||null;
    const guessLockedAt=type==="lock-guesses"?serverNow:(prior?.guessLockedAt||(privateState.guessLockedAtEpochMs===null||privateState.guessLockedAtEpochMs===undefined?null:stspTimestamp(ctx.sdk,privateState.guessLockedAtEpochMs)));
    const signingLockedAt=type==="lock-signings"?serverNow:(prior?.signingLockedAt||(privateState.signingLockedAtEpochMs===null||privateState.signingLockedAtEpochMs===undefined?null:stspTimestamp(ctx.sdk,privateState.signingLockedAtEpochMs)));
    return {schemaVersion:1,objectType:"sharedTransferChallengeRole",rivalryId:ctx.rivalryId,seasonNumber:ctx.seasonNumber,managerRole:role,guesses:privateState.guesses?stspClone(privateState.guesses):null,signings:privateState.signings?stspClone(privateState.signings):null,guessLockedAt,signingLockedAt,activeSessionId:ctx.sessionId,updatedAt:serverNow,updatedByDeviceId:ctx.deviceId,guessSalt:privateState.guessSalt||null,signingSalt:privateState.signingSalt||null};
  }
  async function stspContext(options,transaction,{readOpponent=false}={}){
    stspValidateSdk(options);const catalog=stspCatalog(),uid=stspAccountId(options.user),rivalryId=stspNormalizeRivalryId(options.rivalryId),sessionId=stspNormalizeSessionId(options.sessionId),deviceId=stspNormalizeDeviceId(options.deviceId),now=stspEpoch(options.nowEpochMs),sdk=options.firebaseSdk,db=options.firestore;
    const baseRefs={account:sdk.doc(db,"accounts",uid),device:sdk.doc(db,"accounts",uid,"devices",deviceId),rivalry:sdk.doc(db,"rivalries",rivalryId),session:sdk.doc(db,"rivalries",rivalryId,"sessions",sessionId),setup:sdk.doc(db,"rivalries",rivalryId,"sharedSetup","authoritative"),career:sdk.doc(db,"rivalries",rivalryId,"careerStart","authoritative")};
    stspAssertAccount(stspSnapshot(await transaction.get(baseRefs.account)),uid);stspAssertDevice(stspSnapshot(await transaction.get(baseRefs.device)),deviceId);const rivalry=stspAssertRivalry(stspSnapshot(await transaction.get(baseRefs.rivalry)),rivalryId,uid);stspAssertSession(stspSnapshot(await transaction.get(baseRefs.session)),rivalryId,sessionId,rivalry.authorized,now);const setup=stspAssertSetup(stspSnapshot(await transaction.get(baseRefs.setup)),rivalryId);stspAssertCareer(stspSnapshot(await transaction.get(baseRefs.career)),rivalryId,setup);const seasonNumber=stspSeason(options.seasonNumber,setup.totalSeasons),role=rivalry.actor.slotId,opponentRole=role==="playerOne"?"playerTwo":"playerOne",transferId=`season_${seasonNumber}`;
    const refs={...baseRefs,public:sdk.doc(db,"rivalries",rivalryId,"transferChallenges",transferId),own:sdk.doc(db,"rivalries",rivalryId,"transferChallenges",transferId,"roles",role),opponent:sdk.doc(db,"rivalries",rivalryId,"transferChallenges",transferId,"roles",opponentRole)};
    const publicValue=stspSnapshot(await transaction.get(refs.public)),state=stspPublicState(publicValue,rivalryId,seasonNumber,setup),spinMarks=state?null:(stspSpinMarks(publicValue,rivalryId,seasonNumber)||Object.freeze({playerOne:null,playerTwo:null})),spunRoles=spinMarks?ROLES.filter(item=>spinMarks[item]!==null):null,ownValue=stspSnapshot(await transaction.get(refs.own)),own=stspPrivateState(ownValue,rivalryId,seasonNumber,role,catalog);let opponent=null;
    if(readOpponent==="ifCompleted"&&!(state&&state.phase==="COMPLETED"))readOpponent=false;if(readOpponent){if(!state||state.phase!=="COMPLETED")stspFail("TRANSFER_PRIVATE_READ_BLOCKED");opponent=stspPrivateState(stspSnapshot(await transaction.get(refs.opponent)),rivalryId,seasonNumber,opponentRole,catalog);if(!opponent)stspFail("TRANSFER_PRIVATE_STATE_INVALID");}
    refs.roulette=sdk.doc(db,"rivalries",rivalryId,"transferChallenges",transferId,"roulette","spins");
    return Object.freeze({catalog,uid,rivalryId,sessionId,deviceId,now,sdk,db,rivalry,setup,seasonNumber,role,opponentRole,state,spunRoles,spinMarks,own,publicValue,ownValue,opponent,refs});
  }
  function stspProjection(ctx){
    const state=ctx.state;if(!state)return Object.freeze({ok:true,revision:0,state:null,managerRole:ctx.role,seasonNumber:ctx.seasonNumber,spunRoles:Object.freeze([...(ctx.spunRoles||[])]),spinMarks:ctx.spinMarks||Object.freeze({playerOne:null,playerTwo:null}),ownInputs:null,opponentInputs:null,verdicts:null});
    const ownInputs=ctx.own?{guesses:stspClone(ctx.own.guesses),signings:stspClone(ctx.own.signings)}:{guesses:null,signings:null};
    const opponentInputs=state.phase==="COMPLETED"&&ctx.opponent?{guesses:stspClone(ctx.opponent.guesses),signings:stspClone(ctx.opponent.signings)}:null;let verdicts=null;
    if(state.phase==="COMPLETED"){
      if(!ctx.own||!ctx.opponent||!ctx.own.guesses||!ctx.own.signings||!ctx.opponent.guesses||!ctx.opponent.signings)stspFail("TRANSFER_PRIVATE_STATE_INVALID");
      const inputs={};inputs[ctx.role]=ctx.own;inputs[ctx.opponentRole]=ctx.opponent;const evalState={phase:"COMPLETED",inputs};
      verdicts={playerOne:stspProtocolVerdict("playerOne",evalState),playerTwo:stspProtocolVerdict("playerTwo",evalState)};
    }
    return stspFreeze({ok:true,revision:state.revision,state:stspClone(state),managerRole:ctx.role,seasonNumber:ctx.seasonNumber,spunRoles:null,spinMarks:null,ownInputs,opponentInputs,verdicts});
  }
  function stspProtocolVerdict(role,state){
    const opponent=role==="playerOne"?"playerTwo":"playerOne",guesses=state.inputs[opponent].guesses||[];
    return (state.inputs[role].signings||[]).map(signing=>{const matchedBy=guesses.filter(guess=>(guess.type==="league"&&guess.valueId===signing.leagueId)||(guess.type==="nationality"&&guess.valueId===signing.nationalityId));return {...signing,release:matchedBy.length>0,matchedBy:matchedBy.map(guess=>({type:guess.type,valueId:guess.valueId}))};});
  }
  // RS-02 (r87): one pass. The opponent's private document is read only after this same pass has seen the public document
  // COMPLETED (the Rules allow it only then); before, a COMPLETED season read the whole context twice (17 gets in one transaction).
  async function stspRead(options={}){try{return await options.firebaseSdk.runTransaction(options.firestore,async transaction=>{return stspProjection(await stspContext(options,transaction,{readOpponent:"ifCompleted"}));});}catch(error){return stspResultError(error);}}
  async function stspMutate(options,type,payload){
    try{
      stspValidateSdk(options);const operationId=stspNormalizeOperationId(options.operationId),baseRevision=Number(options.baseRevision);if(!Number.isInteger(baseRevision)||baseRevision<0||baseRevision>7)stspFail("TRANSFER_COMMAND_INVALID");const cryptoImpl=options.cryptoImpl||root.crypto;
      return await options.firebaseSdk.runTransaction(options.firestore,async transaction=>{
        const ctx=await stspContext(options,transaction),current=ctx.state,revision=current?current.revision:0;let normalizedPayload={};
        if(type==="lock-guesses")normalizedPayload={guesses:stspNormalizeGuesses(payload.guesses,ctx.catalog)};else if(type==="lock-signings")normalizedPayload={signings:stspNormalizeSignings(payload.signings,ctx.catalog)};
        // JOB-1051: a lock's hash commits to the private payload AND a fresh random salt that only the actor's own private role document holds.
        // The rival can read the public ledger but not the role document before COMPLETED, so it cannot brute-force the small guess space.
        const privateType=type==="lock-guesses"||type==="lock-signings",saltKey=type==="lock-guesses"?"guessSalt":"signingSalt";
        const commit=salt=>stspHash({actorRole:ctx.role,type,operationId,baseRevision,...normalizedPayload,...(salt?{salt}:{})},cryptoImpl);
        if(current){const index=current.operationIds.indexOf(operationId);if(index>=0){
          // Replays recompute with the salt already stored in the actor's own document; a role document without a salt (written by r66) uses the old unsalted payload hash.
          const storedSalt=privateType&&ctx.own?ctx.own[saltKey]:null;
          if(current.operationTypes[index]!==type||current.operationHashes[index]!==await commit(storedSalt)||current.baseRevisions[index]!==baseRevision||current.actorRoles[index]!==ctx.role)stspFail("TRANSFER_IDEMPOTENCY_CONFLICT");return stspFreeze({ok:true,status:"accepted",replayed:true,revision:current.revision,state:stspClone(current),managerRole:ctx.role,seasonNumber:ctx.seasonNumber,needsRefresh:current.phase==="COMPLETED"});}}
        const salt=privateType?stspNewSalt(cryptoImpl):null,operationHash=await commit(salt);
        if(baseRevision!==revision)stspFail("TRANSFER_STALE_BASE_REVISION");if(!current&&type!=="start-window")stspFail("TRANSFER_NOT_STARTED");if(current&&type==="start-window")stspFail("TRANSFER_ALREADY_STARTED");if(current&&current.phase==="COMPLETED")stspFail("TRANSFER_ALREADY_COMPLETED");
        let next=current?stspClone(current):{seasonNumber:ctx.seasonNumber,coordinatorRole:ctx.setup.coordinatorRole,phase:"WINDOW_OPEN",revision:0,startedAtEpochMs:ctx.now,endedAtEpochMs:null,endRequestedRoles:[],guessLockedRoles:[],signingLockedRoles:[],operationIds:[],operationTypes:[],operationHashes:[],baseRevisions:[],actorRoles:[]};
        let own=ctx.own?stspClone(ctx.own):{guesses:null,signings:null,guessLockedAtEpochMs:null,signingLockedAtEpochMs:null,guessSalt:null,signingSalt:null};let writePrivate=false;
        if(type==="start-window"){if(ctx.role!==ctx.setup.coordinatorRole)stspFail("TRANSFER_COORDINATOR_REQUIRED");
          // RT5-FLOW-02: START needs both marks whenever this Showdown is roulette-eligible (decided here from the Setup ledger
          // this transaction already read, the same rule as the UI and the roulette step: no caller opt-in), and whenever any
          // mark exists. A Showdown confirmed before RRR_FROM_MS, or with the roulette switched off, has no marks and passes.
          const spun=ctx.spunRoles||[];if((spun.length||stspRouletteEligible(stspTimestampMillis(ctx.setup.updatedAt)))&&!ROLES.every(role=>spun.includes(role)))stspFail("TRANSFER_ROULETTE_PENDING");
          next.startedAtEpochMs=ctx.now;}
        else if(type==="request-end-window"){if(next.phase!=="WINDOW_OPEN")stspFail("TRANSFER_PHASE_INVALID");if(next.endRequestedRoles.includes(ctx.role))stspFail("TRANSFER_END_ALREADY_REQUESTED");next.endRequestedRoles.push(ctx.role);if(next.endRequestedRoles.length===2){next.phase="GUESS_ENTRY";next.endedAtEpochMs=ctx.now;}}
        else if(type==="advance-expired-window"){if(next.phase!=="WINDOW_OPEN")stspFail("TRANSFER_PHASE_INVALID");if(ctx.now<next.startedAtEpochMs+protocol.windowMs)stspFail("TRANSFER_WINDOW_STILL_OPEN");next.phase="GUESS_ENTRY";next.endedAtEpochMs=ctx.now;}
        else if(type==="lock-guesses"){if(next.phase!=="GUESS_ENTRY")stspFail("TRANSFER_PHASE_INVALID");if(next.guessLockedRoles.includes(ctx.role)||own.guesses!==null)stspFail("TRANSFER_GUESSES_ALREADY_LOCKED");own.guesses=normalizedPayload.guesses;own.guessSalt=salt;next.guessLockedRoles.push(ctx.role);if(next.guessLockedRoles.length===2)next.phase="SIGNING_ENTRY";writePrivate=true;}
        else if(type==="lock-signings"){if(next.phase!=="SIGNING_ENTRY")stspFail("TRANSFER_PHASE_INVALID");if(!next.guessLockedRoles.includes(ctx.role)||!own.guesses)stspFail("TRANSFER_GUESSES_REQUIRED");if(next.signingLockedRoles.includes(ctx.role)||own.signings!==null)stspFail("TRANSFER_SIGNINGS_ALREADY_LOCKED");own.signings=normalizedPayload.signings;own.signingSalt=salt;next.signingLockedRoles.push(ctx.role);if(next.signingLockedRoles.length===2)next.phase="COMPLETED";writePrivate=true;}
        else stspFail("TRANSFER_COMMAND_INVALID");
        next.operationIds.push(operationId);next.operationTypes.push(type);next.operationHashes.push(operationHash);next.baseRevisions.push(revision);next.actorRoles.push(ctx.role);next.revision=revision+1;
        const serverNow=stspServerTimestamp(ctx.sdk);transaction.set(ctx.refs.public,stspPublicLedger(next,ctx,serverNow,type));if(writePrivate)transaction.set(ctx.refs.own,stspPrivateLedger(own,ctx,ctx.role,serverNow,type));
        // F2-02: START from a document holding both marks keeps them: one durable record, an exact copy (the Rules compare it with
        // the marks being replaced), so later seasons replay each saved shot instead of recomputing it.
        if(type==="start-window"&&ctx.spinMarks&&ROLES.every(role=>ctx.spinMarks[role]!==null))transaction.set(ctx.refs.roulette,{schemaVersion:1,objectType:"sharedTransferRouletteSpins",rivalryId:ctx.rivalryId,seasonNumber:ctx.seasonNumber,spins:stspClone(ctx.publicValue.spins)});
        return stspFreeze({ok:true,status:"accepted",replayed:false,revision:next.revision,state:stspClone(next),managerRole:ctx.role,seasonNumber:ctx.seasonNumber,needsRefresh:type==="start-window"||next.phase==="COMPLETED"});
      });
    }catch(error){return stspResultError(error);}
  }
  // RT5-FLOW-02: this manager's own "spun" mark for this season, one merge write and no read (the Rules check that the signed-in
  // member writes only his own role, never removes a mark, and only before the window opens). Writing it again changes nothing
  // but updatedAt, so a retry after a lost answer or a reload is safe. A window that already opened refuses it
  // (permission-denied): the mark is not needed any more, so the caller treats that as done.
  async function stspMarkSpun(options={}){
    try{
      if(!options.firestore||!options.firebaseSdk||typeof options.firebaseSdk.doc!=="function"||typeof options.firebaseSdk.runTransaction!=="function"||typeof options.firebaseSdk.serverTimestamp!=="function")stspFail("TRANSFER_PROVIDER_UNAVAILABLE");
      stspAccountId(options.user);const rivalryId=stspNormalizeRivalryId(options.rivalryId),season=stspSeason(options.seasonNumber,10),role=options.managerRole;if(!ROLES.includes(role))stspFail("TRANSFER_ROLE_INVALID");
      // F2-02: with options.outcome (this manager's own turn, js/rosterRoulette.js outcome) the entry records it; without one
      // (no roulette ran on this phone) it is true. A malformed outcome is refused here, before any write.
      let entry=true;if(options.outcome!==undefined&&options.outcome!==null){entry=stspOutcome(options.outcome);if(!entry)stspFail("TRANSFER_SPIN_OUTCOME_INVALID");entry={...entry};}
      const sdk=options.firebaseSdk,ref=sdk.doc(options.firestore,"rivalries",rivalryId,"transferChallenges",`season_${season}`);
      try{
        await sdk.runTransaction(options.firestore,async transaction=>{transaction.set(ref,{schemaVersion:1,objectType:"sharedTransferChallenge",rivalryId,seasonNumber:season,phase:"NOT_STARTED",spins:{[role]:entry},updatedAt:stspServerTimestamp(sdk)},{merge:true});});
      }catch(error){
        // The Rules accept one mark per manager and season (F2-02), so marking again (a retry after a lost ack, a reload, a
        // second tab, or a caller that marked before an earlier START was refused) is denied. Only then, one read: if this
        // manager's mark is already on the document, or the window already opened from both marks, he has spun. The stored
        // mark stands (the first outcome is the season's outcome); nothing is written.
        if(String(error&&error.code||"").replace(/^firestore\//,"")!=="permission-denied")throw error;
        const stored=await sdk.runTransaction(options.firestore,async transaction=>stspSnapshot(await transaction.get(ref)));
        const marked=stored&&(stored.phase!=="NOT_STARTED"||(stspPlain(stored.spins)&&Object.hasOwn(stored.spins,role)&&stored.spins[role]!==false));
        if(!marked)throw error;
        return Object.freeze({ok:true,managerRole:role,seasonNumber:season,alreadyMarked:true});
      }
      return Object.freeze({ok:true,managerRole:role,seasonNumber:season});
    }catch(error){return stspResultError(error);}
  }
  // F2-12 (Fable job 2): an earlier season for the roulette boards, with plain document gets and no prerequisite transaction:
  // this manager's own role document, the partner's (the Rules allow it only once the season's window is COMPLETED) and the
  // durable spin record. Verdicts are computed as stspProtocolVerdict does. options.verdicts false reads the record only (the
  // verdicts are already kept on this phone). hits is {playerOne, playerTwo} (an outcome or null), or null without a record.
  async function stspReadRouletteSeason(options={}){
    try{
      const sdk=options.firebaseSdk,db=options.firestore;
      if(!db||!sdk||typeof sdk.doc!=="function"||typeof sdk.getDoc!=="function")stspFail("TRANSFER_PROVIDER_UNAVAILABLE");
      stspAccountId(options.user);const rivalryId=stspNormalizeRivalryId(options.rivalryId),season=stspSeason(options.seasonNumber,10),role=options.managerRole;if(!ROLES.includes(role))stspFail("TRANSFER_ROLE_INVALID");
      const opponentRole=role==="playerOne"?"playerTwo":"playerOne",transferId=`season_${season}`,wantVerdicts=options.verdicts!==false;
      const get=parts=>sdk.getDoc(sdk.doc(db,"rivalries",rivalryId,"transferChallenges",transferId,...parts)).then(stspSnapshot);
      const settled=await Promise.allSettled([get(["roulette","spins"]),...(wantVerdicts?[get(["roles",role]),get(["roles",opponentRole])]:[])]);
      if(settled[0].status==="rejected")throw settled[0].reason;
      let hits=null;const record=settled[0].value;
      if(record){
        stspExact(record,RECORD_KEYS);
        if(record.schemaVersion!==1||record.objectType!=="sharedTransferRouletteSpins"||record.rivalryId!==rivalryId||record.seasonNumber!==season)stspFail("TRANSFER_PROVIDER_STATE_INVALID");
        const entries=stspSpinEntries(record.spins);hits=Object.freeze(Object.fromEntries(ROLES.map(item=>[item,entries[item]&&entries[item]!==true?entries[item]:null])));
      }
      if(!wantVerdicts)return Object.freeze({ok:true,seasonNumber:season,verdicts:null,hits});
      const catalog=stspCatalog();
      if(settled[1].status==="rejected")throw settled[1].reason;
      const own=stspPrivateState(settled[1].value,rivalryId,season,role,catalog);
      if(!own||!own.guesses||!own.signings)stspFail("TRANSFER_NOT_COMPLETED");
      if(settled[2].status==="rejected")throw settled[2].reason;
      const opponent=stspPrivateState(settled[2].value,rivalryId,season,opponentRole,catalog);
      if(!opponent||!opponent.guesses||!opponent.signings)stspFail("TRANSFER_NOT_COMPLETED");
      const inputs={[role]:own,[opponentRole]:opponent},evalState={phase:"COMPLETED",inputs};
      return stspFreeze({ok:true,seasonNumber:season,verdicts:{playerOne:stspProtocolVerdict("playerOne",evalState),playerTwo:stspProtocolVerdict("playerTwo",evalState)},hits});
    }catch(error){return stspResultError(error);}
  }
  const stspStartWindow=options=>stspMutate(options,"start-window",{});
  const stspRequestEndWindow=options=>stspMutate(options,"request-end-window",{});
  const stspAdvanceExpiredWindow=options=>stspMutate(options,"advance-expired-window",{});
  const stspLockGuesses=options=>stspMutate(options,"lock-guesses",{guesses:options.guesses});
  const stspLockSignings=options=>stspMutate(options,"lock-signings",{signings:options.signings});

  return Object.freeze({contractVersion:1,feature:"ssjr-spark-shared-transfer-challenge",runtimeRevision:protocol.runtimeRevision,read:stspRead,markSpun:stspMarkSpun,readRouletteSeason:stspReadRouletteSeason,outcomeValid:value=>Boolean(stspOutcome(value)),rouletteFromMs:ROULETTE_FROM_MS,rouletteEligible:stspRouletteEligible,startWindow:stspStartWindow,requestEndWindow:stspRequestEndWindow,advanceExpiredWindow:stspAdvanceExpiredWindow,lockGuesses:stspLockGuesses,lockSignings:stspLockSignings,billingRequired:false,blazeRequired:false,cloudRunRequired:false,cloudFunctionsRequired:false,canonicalStorageMutation:false,privateInputsSplit:true,serverClockAuthoritative:true,repositoryCatalogSnapshot:true,callerCatalogOverride:false});
});
```


## FILE: every *_FROM_MS use in js/ at the candidate (grep -B3 -A3)
```text
js/productionSharedTransferChallenge.js-24-  // The reason the roulette could not start on this phone (shown on the dashboard and on Career Start), or "" (Fable F2-05).
js/productionSharedTransferChallenge.js-25-  let rouletteError="",primePackLoadError=false;
js/productionSharedTransferChallenge.js-26-  const PSTC_PRIME_PACK_TEXT="Prime Pack could not load. Check the connection and tap again.";
js/productionSharedTransferChallenge.js:27:  const PRIME_PACK_FROM_MS=Date.parse("2026-10-30T00:00:00Z");
js/productionSharedTransferChallenge.js-28-  const PSTC_ROULETTE_TEXT=Object.freeze({
js/productionSharedTransferChallenge.js-29-    load:"The roulette could not load. Check the connection and tap again.",
js/productionSharedTransferChallenge.js-30-    setup:"This season's roulette needs the Showdown's confirmed Setup, and it could not be read just now. Tap again to retry.",
--
js/productionSharedTransferChallenge.js-518-      if(!view||!view.managerRole||!request)return true;
js/productionSharedTransferChallenge.js-519-      const confirmedAtMs=pstcSetupState()?.setupUpdatedAtMs;
js/productionSharedTransferChallenge.js-520-      // Old Showdowns never load the Prime Pack step (the boundary is js/iconGuess.js fromMs).
js/productionSharedTransferChallenge.js:521:      if(!Number.isFinite(confirmedAtMs)||confirmedAtMs<PRIME_PACK_FROM_MS||root.CMS_PRIME_PACK==="off")return true;
js/productionSharedTransferChallenge.js-522-      let timer;const step=await Promise.race([pstcLoadScript("prime-pack-step","js/iconGuessStep.js",()=>root.CareerModeIconGuessStep),new Promise(resolve=>{timer=root.setTimeout(()=>resolve(null),10000);})]).finally(()=>root.clearTimeout(timer));
js/productionSharedTransferChallenge.js-523-      if(!step){primePackLoadError=true;return false;}
js/productionSharedTransferChallenge.js-524-      // applies() needs the round engine (js/iconGuess.js): load it first, or an r87 Showdown would skip the Prime Pack.
--
js/productionSharedTransferChallenge.js-596-  let pendingOutcome=null;
js/productionSharedTransferChallenge.js-597-  function pstcPendingOutcome(request,role){const key=pstcOutcomeKey(request,role);if(pendingOutcome&&pendingOutcome.key===key)return pendingOutcome.outcome;const found=pstcOutcomeList().find(item=>item[0]===key);return found?pstcOutcomeCopy(found[1]):null;}
js/productionSharedTransferChallenge.js-598-  // ---- RT5-FLOW-02: both spins before the shared window ----
js/productionSharedTransferChallenge.js:599:  // The roulette applies to a Showdown confirmed at or after the step's RRR_FROM_MS while it is not switched off; any other
js/productionSharedTransferChallenge.js-600-  // season (an older Showdown) passes by itself and never writes or waits for a mark.
js/productionSharedTransferChallenge.js-601-  // The provider's own eligibility rule (it enforces START with it), so the screen and the provider can never disagree.
js/productionSharedTransferChallenge.js-602-  function pstcRouletteAppliesTo(confirmedAtMs,step){return Boolean(step&&typeof provider?.rouletteEligible==="function"&&provider.rouletteEligible(confirmedAtMs));}
--
js/rosterRouletteStep.js-19-  const PAGE="visual-assets/v10_1/roulette/index.html";
js/rosterRouletteStep.js-20-  const STAGE_ID="rrStage",PANEL_ID="rrStepPanel";
js/rosterRouletteStep.js-21-  const DONE_KEY="careerModeShowdown.rouletteDone.v1",WATCHED_KEY="careerModeShowdown.rouletteWatched.v1",KEYS_MAX=60;
js/rosterRouletteStep.js:22:  // RRR_FROM_MS is set to the r87 release time in the release PR (red team R87-C-07: the placeholder below is earlier than
js/rosterRouletteStep.js:23:  // the r86 boundary, js/marqueePlayer.js MARQUEE_FROM_MS 03:00 UTC that day, so until the release PR pins it, r86
js/rosterRouletteStep.js-24-  // Showdowns confirmed after midnight would get a roulette). Do not change it outside the release PR.
js/rosterRouletteStep.js:25:  const RRR_FROM_MS=Date.parse("2026-10-30T00:00:00Z");
js/rosterRouletteStep.js-26-  const MIN_LOADING_MS=1000,MAX_LOADING_MS=15000,LOAD_WAIT_MS=10000,ARMED_WAIT_MS=5000;
js/rosterRouletteStep.js-27-  const ROLES=Object.freeze(["playerOne","playerTwo"]),NAMES=Object.freeze({playerOne:"Daniel",playerTwo:"Nik"});
js/rosterRouletteStep.js-28-  const sceneFailedHere=new Set();
--
js/rosterRouletteStep.js-68-    if(!/^pair_[0-9a-f]{64}$/.test(String(ctx.rivalryId||""))||!ROLES.includes(ctx.managerRole))return false;
js/rosterRouletteStep.js-69-    if(!Number.isInteger(ctx.season)||ctx.season<1||ctx.season>10)return false;
js/rosterRouletteStep.js-70-    if(!ctx.clubs||!ctx.clubs.playerOne||!ctx.clubs.playerTwo||ctx.phase==="COMPLETED")return false;
js/rosterRouletteStep.js:71:    if(!Number.isFinite(ctx.confirmedAtMs)||ctx.confirmedAtMs<RRR_FROM_MS)return false;
js/rosterRouletteStep.js-72-    const key=rrsKey(ctx);
js/rosterRouletteStep.js-73-    return !rrsHas(DONE_KEY,key);
js/rosterRouletteStep.js-74-  }
--
js/rosterRouletteStep.js-381-  // Fable F2-11: a new open forgets an earlier BACK, so a later failure that never reached the roulette is not read as one.
js/rosterRouletteStep.js-382-  function rrsForgetHome(){leftForHome=false;return true;}
js/rosterRouletteStep.js-383-
js/rosterRouletteStep.js:384:  return Object.freeze({contractVersion:1,feature:"cms-roster-roulette-step",page:PAGE,stageId:STAGE_ID,panelId:PANEL_ID,doneKey:DONE_KEY,watchedKey:WATCHED_KEY,fromMs:RRR_FROM_MS,decide:rrsDecide,runBeforeTransfers:rrsRunBeforeTransfers,close:rrsClose,active:rrsActive,wentHome:rrsWentHome,forgetHome:rrsForgetHome,ensureDraw:rrsEnsureDraw,isOwnSpecial:rrsIsOwnSpecial})
js/rosterRouletteStep.js-385-});
--
js/sparkSharedTransferChallenge.js-58-  function stspSeason(value,totalSeasons){const season=Number(value);if(!Number.isInteger(season)||season<1||season>totalSeasons)stspFail("TRANSFER_SEASON_INVALID");return season;}
js/sparkSharedTransferChallenge.js-59-  function stspEpoch(value){const n=Number(value===undefined?Date.now():value);if(!Number.isSafeInteger(n)||n<0)stspFail("TRANSFER_CLOCK_INVALID");return n;}
js/sparkSharedTransferChallenge.js-60-  // RT5-FLOW-02 eligibility, shared by this provider, the Transfer Challenge UI and (by its fromMs) js/rosterRouletteStep.js:
js/sparkSharedTransferChallenge.js:61:  // the roulette runs for a Showdown whose Setup was confirmed at or after RRR_FROM_MS, unless CMS_ROSTER_ROULETTE is "off".
js/sparkSharedTransferChallenge.js:62:  const ROULETTE_FROM_MS=Date.parse("2026-10-30T00:00:00Z");
js/sparkSharedTransferChallenge.js:63:  function stspRouletteEligible(confirmedAtMs){return Number.isFinite(confirmedAtMs)&&confirmedAtMs>=ROULETTE_FROM_MS&&root.CMS_ROSTER_ROULETTE!=="off";}
js/sparkSharedTransferChallenge.js-64-  function stspTimestampMillis(value){if(value&&typeof value.toMillis==="function")return value.toMillis();if(value instanceof Date)return value.getTime();return Number.NaN;}
js/sparkSharedTransferChallenge.js-65-  function stspTimestamp(sdk,epoch){if(!sdk.Timestamp||typeof sdk.Timestamp.fromMillis!=="function")stspFail("TRANSFER_PROVIDER_UNAVAILABLE");return sdk.Timestamp.fromMillis(epoch);}
js/sparkSharedTransferChallenge.js-66-  function stspServerTimestamp(sdk){if(typeof sdk.serverTimestamp!=="function")stspFail("TRANSFER_PROVIDER_UNAVAILABLE");return sdk.serverTimestamp();}
--
js/sparkSharedTransferChallenge.js-218-        if(type==="start-window"){if(ctx.role!==ctx.setup.coordinatorRole)stspFail("TRANSFER_COORDINATOR_REQUIRED");
js/sparkSharedTransferChallenge.js-219-          // RT5-FLOW-02: START needs both marks whenever this Showdown is roulette-eligible (decided here from the Setup ledger
js/sparkSharedTransferChallenge.js-220-          // this transaction already read, the same rule as the UI and the roulette step: no caller opt-in), and whenever any
js/sparkSharedTransferChallenge.js:221:          // mark exists. A Showdown confirmed before RRR_FROM_MS, or with the roulette switched off, has no marks and passes.
js/sparkSharedTransferChallenge.js-222-          const spun=ctx.spunRoles||[];if((spun.length||stspRouletteEligible(stspTimestampMillis(ctx.setup.updatedAt)))&&!ROLES.every(role=>spun.includes(role)))stspFail("TRANSFER_ROULETTE_PENDING");
js/sparkSharedTransferChallenge.js-223-          next.startedAtEpochMs=ctx.now;}
js/sparkSharedTransferChallenge.js-224-        else if(type==="request-end-window"){if(next.phase!=="WINDOW_OPEN")stspFail("TRANSFER_PHASE_INVALID");if(next.endRequestedRoles.includes(ctx.role))stspFail("TRANSFER_END_ALREADY_REQUESTED");next.endRequestedRoles.push(ctx.role);if(next.endRequestedRoles.length===2){next.phase="GUESS_ENTRY";next.endedAtEpochMs=ctx.now;}}
--
js/sparkSharedTransferChallenge.js-300-  const stspLockGuesses=options=>stspMutate(options,"lock-guesses",{guesses:options.guesses});
js/sparkSharedTransferChallenge.js-301-  const stspLockSignings=options=>stspMutate(options,"lock-signings",{signings:options.signings});
js/sparkSharedTransferChallenge.js-302-
js/sparkSharedTransferChallenge.js:303:  return Object.freeze({contractVersion:1,feature:"ssjr-spark-shared-transfer-challenge",runtimeRevision:protocol.runtimeRevision,read:stspRead,markSpun:stspMarkSpun,readRouletteSeason:stspReadRouletteSeason,outcomeValid:value=>Boolean(stspOutcome(value)),rouletteFromMs:ROULETTE_FROM_MS,rouletteEligible:stspRouletteEligible,startWindow:stspStartWindow,request
js/sparkSharedTransferChallenge.js-304-});
--
js/careerScreenSeam.js-60-  // Showdown. Each manager is judged on their own total, so both can earn it in one Showdown. An ended-early, unfinished or
js/careerScreenSeam.js-61-  // shorter Showdown never earns it. Read from the completed rows already loaded; nothing is stored.
js/careerScreenSeam.js-62-  // r87 Prime Pack (G Lead and Nik 2026-11-01): a Showdown that plays Prime Pack scores up to 15 a season (11 + up to 4), so its
js/careerScreenSeam.js:63:  // Golden Showdown is 150; a Showdown confirmed before Prime Pack keeps 11 a season and 110. PRIME_PACK_FROM_MS is
js/careerScreenSeam.js-64-  // js/iconGuess.js fromMs (the Roster Roulette boundary; tests/contracts/r87-prime-pack-totals-contracts.cjs keeps them equal).
js/careerScreenSeam.js-65-  const GOLDEN_SHOWDOWN=Object.freeze({seasons:10,points:110,primePackPoints:150});
js/careerScreenSeam.js-66-  const SEASON_MAX=Object.freeze({before:11,primePack:15});
js/careerScreenSeam.js:67:  const PRIME_PACK_FROM_MS=Date.parse("2026-10-30T00:00:00Z");
js/careerScreenSeam.js-68-  const PAIR_ID=/^pair_[0-9a-f]{64}$/;
js/careerScreenSeam.js-69-  function csSeasonScores(row){
js/careerScreenSeam.js-70-    const out=[];
--
js/careerScreenSeam.js-76-  // without one, a season over 11 can only be Prime Pack, and the live Showdown's Setup (when it is this Showdown) decides.
js/careerScreenSeam.js-77-  function seasonMaxFor(row){
js/careerScreenSeam.js-78-    const pack=SEASON_MAX.primePack,before=SEASON_MAX.before;
js/careerScreenSeam.js:79:    if(row&&PAIR_ID.test(String(row.rivalryId))&&Number.isFinite(row.setupConfirmedAt))return row.setupConfirmedAt>=PRIME_PACK_FROM_MS?pack:before;
js/careerScreenSeam.js-80-    if(csSeasonScores(row).some(score=>score>before))return pack;
js/careerScreenSeam.js-81-    const live=csLiveSetup();
js/careerScreenSeam.js:82:    if(live&&(row?.rivalryId==null||row.rivalryId===live.rivalryId))return live.setupUpdatedAtMs>=PRIME_PACK_FROM_MS?pack:before;
js/careerScreenSeam.js-83-    return before;
js/careerScreenSeam.js-84-  }
js/careerScreenSeam.js-85-  function goldenShowdownPoints(row){return GOLDEN_SHOWDOWN.seasons*seasonMaxFor(row);}
--
js/careerScreenSeam.js-195-    }
js/careerScreenSeam.js-196-    fragment.appendChild(root);return fragment;
js/careerScreenSeam.js-197-  }
js/careerScreenSeam.js:198:  return csFreeze({contractVersion:1,SCREENS,STATUSES,TEXT,GOLDEN_SHOWDOWN,SEASON_MAX,PRIME_PACK_FROM_MS,seasonMaxFor,goldenShowdownPoints,endedEarlyText,goldenShowdownManagers,goldenShowdownCounts,normalizeRenderRequest,isOnlineCareerRoute,selectCareerScreenSource,careerScreenView,paintCareerScreenView});
js/careerScreenSeam.js-199-});
--
js/sharedCareerAnalytics.js-74-  }
js/sharedCareerAnalytics.js-75-  // r87 Prime Pack: a perfect season is the Showdown's own maximum, 15 for a Showdown confirmed on or after the Prime Pack
js/sharedCareerAnalytics.js-76-  // boundary (js/iconGuess.js fromMs) and 11 before it; with no confirm time, a season with Prime Pack or above 11 means 15.
js/sharedCareerAnalytics.js:77:  const PRIME_PACK_FROM_MS=Date.parse("2026-10-30T00:00:00Z");
js/sharedCareerAnalytics.js-78-  function seasonMaxOf(entry,seasons){
js/sharedCareerAnalytics.js:79:    if(Number.isFinite(entry.setupConfirmedAt))return entry.setupConfirmedAt>=PRIME_PACK_FROM_MS?15:11;
js/sharedCareerAnalytics.js-80-    return seasons.some(season=>ROLES.some(role=>season[role]&&(season[role].primePack!==undefined||season[role].scoring.total>11)))?15:11;
js/sharedCareerAnalytics.js-81-  }
js/sharedCareerAnalytics.js-82-  function accumulate(record,season,role,sums,max=11){
--
js/productionSharedSeasonResults.js-181-  // by the stage of his right guess (the Rules accept it only when the round record names him and its server time gives N). Read once from the round record, only for a Showdown that plays
js/productionSharedSeasonResults.js-182-  // Prime Pack; an older Showdown never loads the step or reads anything. A read that fails stops the publish (TRY AGAIN),
js/productionSharedSeasonResults.js-183-  // so a won point is never dropped by a bad connection.
js/productionSharedSeasonResults.js:184:  const PRIME_PACK_FROM_MS=Date.parse("2026-10-30T00:00:00Z");
js/productionSharedSeasonResults.js-185-  async function pssrWithPrimePack(ctx,request,result){
js/productionSharedSeasonResults.js-186-    const confirmedAtMs=pssrSetupState()?.setupUpdatedAtMs;
js/productionSharedSeasonResults.js-187-    // Old Showdowns never load the step (the same boundary as js/iconGuess.js fromMs; a contract keeps them equal).
js/productionSharedSeasonResults.js:188:    if(!Number.isFinite(confirmedAtMs)||confirmedAtMs<PRIME_PACK_FROM_MS||root.CMS_PRIME_PACK==="off"||!result||typeof result!=="object")return result;
js/productionSharedSeasonResults.js-189-    const step=root.CareerModeIconGuessStep||await (typeof root.loadRuntimeScript==="function"?root.loadRuntimeScript("prime-pack-step","js/iconGuessStep.js",()=>root.CareerModeIconGuessStep).then(()=>root.CareerModeIconGuessStep,()=>null):null);
js/productionSharedSeasonResults.js-190-    // applies() needs the round engine (js/iconGuess.js): load it first, or a won Prime Pack point would be dropped.
js/productionSharedSeasonResults.js-191-    if(!step||!await step.ensure())pssrFail("SEASON_RESULTS_PRIME_PACK_UNAVAILABLE","Prime Pack could not load. Check the connection and try again.");
--
js/commentaryV3.js-32-  const LENGTHS=Object.freeze([1,3,5,10]);
js/commentaryV3.js-33-  const MAX=11,PACK_MAX=15;
js/commentaryV3.js-34-  // The Prime Pack boundary is js/iconGuess.js fromMs: a Showdown confirmed on or after it plays Prime Pack.
js/commentaryV3.js:35:  const PRIME_PACK_FROM_MS=Date.parse("2026-10-30T00:00:00Z");
js/commentaryV3.js-36-  const node=typeof module!=="undefined"&&module.exports;
js/commentaryV3.js-37-  const other=role=>role==="playerOne"?"playerTwo":"playerOne";
js/commentaryV3.js-38-  const int=(x,lo,hi)=>Number.isInteger(x)&&x>=lo&&x<=hi;
--
js/commentaryV3.js-251-    // Prime Pack is known from this Showdown's confirm time, so an early season with no Prime Pack points yet still counts 15.
js/commentaryV3.js-252-    const at=setupState.setupUpdatedAtMs;
js/commentaryV3.js-253-    return {showdownId:rivalryId,seasons:N,league:setup.leagueId,clubs:setup.clubs,teamCount:Array.isArray(teams)?teams.length:null,history:rows,season:s,
js/commentaryV3.js:254:      primePack:Number.isFinite(at)?at>=PRIME_PACK_FROM_MS:undefined};
js/commentaryV3.js-255-  }
js/commentaryV3.js-256-  function cvLoadAssets(){
js/commentaryV3.js-257-    if(assets)return assets;
--
js/commentaryV3.js-358-    // Prime Pack: this Showdown's confirm time (the closed read carries it), else the live Setup when it is this Showdown.
js/commentaryV3.js-359-    let at=history.setupConfirmedAt;
js/commentaryV3.js-360-    if(!Number.isFinite(at)){const live=state("CareerModeProductionSharedShowdownSetup");if(live&&String(live.rivalryId)===rid&&live.setup?.phase==="SHOWDOWN_CONFIRMED")at=live.setupUpdatedAtMs;}
js/commentaryV3.js:361:    return {showdownId:rid,primePack:Number.isFinite(at)?at>=PRIME_PACK_FROM_MS:undefined,seasons:p.totalSeasons,league:p.leagueId,clubs:{playerOne:p.managerRecords?.playerOne?.club,playerTwo:p.managerRecords?.playerTwo?.club},
js/commentaryV3.js-362-      teamCount:Array.isArray(teams)?teams.length:null,history:p.seasonHistory,season:p.totalSeasons};
js/commentaryV3.js-363-  }
js/commentaryV3.js-364-  function cvFinalRule(doc){
--
js/touchlineGazette.js-33-  const GOLDEN=Object.freeze({seasons:10,points:110});
js/touchlineGazette.js-34-  // r87 Prime Pack (G Lead and Nik 2026-11-01): a Showdown that plays Prime Pack scores up to 15 a season (11 + up to 4), so
js/touchlineGazette.js-35-  // its race counts 15 a season left and its Golden Showdown is 150; a Showdown confirmed before Prime Pack keeps 11 and 110.
js/touchlineGazette.js:36:  // PRIME_PACK_FROM_MS is js/iconGuess.js fromMs (tests/contracts/r87-prime-pack-totals-contracts.cjs keeps them equal).
js/touchlineGazette.js:37:  const SEASON_MAX=Object.freeze({before:11,primePack:15}),PRIME_PACK_FROM_MS=Date.parse("2026-10-30T00:00:00Z");
js/touchlineGazette.js-38-  // true/false when this Showdown's confirm time is known (given, or the live Setup when it is this Showdown), else null.
js/touchlineGazette.js-39-  function tgPrimePack(rivalryId,confirmedAt){
js/touchlineGazette.js:40:    if(Number.isFinite(confirmedAt))return confirmedAt>=PRIME_PACK_FROM_MS;
js/touchlineGazette.js:41:    try{const setup=root.CareerModeProductionSharedShowdownSetup?.getState?.();if(setup&&setup.rivalryId===rivalryId&&setup.setup?.phase==="SHOWDOWN_CONFIRMED"&&Number.isFinite(setup.setupUpdatedAtMs))return setup.setupUpdatedAtMs>=PRIME_PACK_FROM_MS;}catch(_error){}
js/touchlineGazette.js-42-    return null;
js/touchlineGazette.js-43-  }
js/touchlineGazette.js-44-  const TROPHY_ART=Object.freeze({"champions-league":"TRO_CONTINENTAL","europa-league":"TRO_EUROPA","league-title":"TRO_LEAGUE_TITLE","domestic-cup":"TRO_DOMESTIC_CUP"});
--
js/iconGuess.js-49-  const LEAD_MS=3000;   // after the second manager arrives, both phones count in together before the card rises
js/iconGuess.js-50-  const RECORD_VERSION=1;
js/iconGuess.js-51-  // Nik 2026-10-31 (N1), moved to r87 on 2026-11-01: the game runs only in Showdowns confirmed on the release that ships it,
js/iconGuess.js:52:  // like Roster Roulette, so one Showdown never mixes 11-point and 15-point seasons. ICON_FROM_MS is the same boundary as
js/iconGuess.js:53:  // js/rosterRouletteStep.js RRR_FROM_MS (a contract keeps them equal); the r87 release PR pins both to the release time.
js/iconGuess.js-54-  // Do not change it outside the release PR.
js/iconGuess.js:55:  const ICON_FROM_MS=Date.parse("2026-10-30T00:00:00Z");
js/iconGuess.js-56-
js/iconGuess.js-57-  // ---------- the draw ----------
js/iconGuess.js-58-  // The id's first hex digit is the season count (js/persistentNikDanielPair.js), so it is left out: a new season must
--
js/iconGuess.js-101-    if(at instanceof Date){const value=at.getTime();return Number.isFinite(value)?value:null;}
js/iconGuess.js-102-    return null;
js/iconGuess.js-103-  }
js/iconGuess.js:104:  function igEligible(rivalryId,confirmedAt,{fromMs=ICON_FROM_MS}={}){
js/iconGuess.js-105-    const at=igMillis(confirmedAt);
js/iconGuess.js-106-    return Boolean(igHex(rivalryId))&&at!==null&&at>=fromMs;
js/iconGuess.js-107-  }
--
js/iconGuess.js-221-  return Object.freeze({
js/iconGuess.js-222-    contractVersion:1,feature:"cms-icon-guess",roles:ROLES,stats:STATS,maxSeasons:MAX_SEASONS,chips:CHIPS,
js/iconGuess.js-223-    beats:BEATS,lastBeat:LAST_BEAT,stagePoints:STAGE_POINTS,maxPoints:MAX_POINTS,stages:STAGES,stageStarts:STAGE_STARTS,roundMs:ROUND_MS,leadMs:LEAD_MS,
js/iconGuess.js:224:    fromMs:ICON_FROM_MS,eligible:igEligible,order:igOrder,statOrder:igStatOrder,draw:igDraw,
js/iconGuess.js-225-    endsAt:igEndsAt,beatAt:igBeatAt,revealed:igRevealed,stagePointsAt:igStagePoints,resultView:igResultView,
js/iconGuess.js-226-    newRecord:igNewRecord,validRecord:igValid,startMs:igStartMs,arrive:igArrive,outcome:igOutcome,applyGuess:igApplyGuess,points:igPoints
js/iconGuess.js-227-  });
--
js/marqueePlayer.js-10-  // read, no write and no Rules change, and nothing is added to any hashed document (Sol round 2 design rule). Only a
js/marqueePlayer.js-11-  // Showdown confirmed on r86 or later has a Special Player: older Showdowns and saves show none, never an error.
js/marqueePlayer.js-12-  // The confirm time is the shared Setup's last updatedAt (the Rules pin it to request.time at SHOWDOWN_CONFIRMED).
js/marqueePlayer.js:13:  // MARQUEE_FROM_MS is the r86 release time (red team #3): the release PR's start, 2026-10-30 03:00 UTC. Showdowns
js/marqueePlayer.js-14-  // confirmed before it get no Special Player.
js/marqueePlayer.js:15:  const MARQUEE_FROM_MS=Date.parse("2026-10-30T03:00:00Z");
js/marqueePlayer.js-16-  // GC-04 (Nik 2026-11-01): from 2.0.0 a manager's Special Player never plays for that manager's own club (he would be a
js/marqueePlayer.js-17-  // "free extra signing" of a player the manager already owns). The draw skips forward from the same id-derived positions
js/marqueePlayer.js-18-  // to the next player not at his club, so it stays read-free and the same on both phones. Showdowns confirmed before
js/marqueePlayer.js:19:  // OWN_CLUB_FROM_MS keep the r86 draw exactly. It is a placeholder at the planned 2.0.0 go-live that tools/set-release-time.cjs
js/marqueePlayer.js:20:  // pins to the exact release time with RRR_FROM_MS (tests/contracts/r87-sp-own-club-contracts.cjs: never before the Roster
js/marqueePlayer.js-21-  // Roulette boundary). From it the draw needs both managers' clubs: a caller without them gets no Special Player rather
js/marqueePlayer.js-22-  // than a wrong one.
js/marqueePlayer.js:23:  const OWN_CLUB_FROM_MS=Date.parse("2026-11-01T17:00:00Z");
js/marqueePlayer.js-24-  const RIVALRY_ID=/^pair_([0-9a-f]{64})$/;
js/marqueePlayer.js-25-  const ROLES=Object.freeze(["playerOne","playerTwo"]);
js/marqueePlayer.js-26-  // Ranking badge (Nik): top 3 black-blue-gold, top 10 blue-gold, top 20 gold, top 50 silver, others bronze.
--
js/marqueePlayer.js-70-  }
js/marqueePlayer.js-71-  // {playerOne, playerTwo} for a Showdown confirmed at confirmedAt (millis, Timestamp or Date), or null (none).
js/marqueePlayer.js-72-  // fromMs is for tests and galleries only.
js/marqueePlayer.js:73:  // clubs: both managers' clubs (needed from OWN_CLUB_FROM_MS, GC-04). ownClubFromMs is for tests and galleries only.
js/marqueePlayer.js-74-  function mpUsesClubs(at,ownClubFromMs){return at!==null&&at>=ownClubFromMs;}
js/marqueePlayer.js:75:  function mpForShowdown(rivalryId,confirmedAt,{fromMs=MARQUEE_FROM_MS,clubs=null,ownClubFromMs=OWN_CLUB_FROM_MS}={}){
js/marqueePlayer.js-76-    const at=mpMillis(confirmedAt),list=mpList();
js/marqueePlayer.js-77-    if(at===null||at<fromMs||!list)return null;
js/marqueePlayer.js-78-    const useClubs=mpUsesClubs(at,ownClubFromMs);
--
js/marqueePlayer.js-87-  function mpPicksForShowdown(rivalryId,confirmedAt,clubs){
js/marqueePlayer.js-88-    const at=mpMillis(confirmedAt),list=mpList();
js/marqueePlayer.js-89-    if(!list||!mpForShowdown(rivalryId,confirmedAt,{clubs}))return null;
js/marqueePlayer.js:90:    return mpPicks(rivalryId,list.players.length,mpUsesClubs(at,OWN_CLUB_FROM_MS)?clubs:null);
js/marqueePlayer.js-91-  }
js/marqueePlayer.js-92-  // Red team R87-SP-02: is a typed Transfer War signing name this manager's own Special Player? Names compare with accents
js/marqueePlayer.js-93-  // folded, trimmed and lower-cased, against the display name and the squad database name (data/marqueePlayers.js
--
js/marqueePlayer.js-100-    return [player.name,source].some(n=>n&&mpFold(n)===mpFold(name));
js/marqueePlayer.js-101-  }
js/marqueePlayer.js-102-
js/marqueePlayer.js:103:  return Object.freeze({contractVersion:1,feature:"cms-marquee-player",fromMs:MARQUEE_FROM_MS,ownClubFromMs:OWN_CLUB_FROM_MS,roles:ROLES,tier:mpTier,picks:mpPicks,picksForShowdown:mpPicksForShowdown,clubAliases:CLUB_ALIASES,forShowdown:mpForShowdown,forNewShowdown:mpForNewShowdown,isOwnSpecial:mpIsOwnSpecial});
js/marqueePlayer.js-104-});

```


## FILE: tests/browser/r87-upgrade-from-r86-audit.cjs
```
"use strict";
// r87 upgrade proof: a phone that runs the live r86 build (1.9.10-r86, main) takes the 2.0.0 update the way a real phone does.
// The real r86 tree is served first, then the gameplay/r87 tree with the release PR's edits simulated (every "1.9.10-r86"
// becomes the 2.0.0 revision, APP_VERSION 2.0.0, PREVIOUS_RUNTIME_REVISION = 1.9.10-r86 and the rollback list = the shell
// paths r87 adds to r86's). Checks, in one browser profile:
//   U1  r86 installs and verifies its own shell (the phone before the release).
//   U2  the 2.0.0 worker downloads while the page is OFF Home (a game screen): it waits and never reloads the page there.
//   U3  back on Home it applies by itself; the page reloads straight into 2.0.0: no request of the reload asks for a
//       1.9.10-r86 asset, no r86 markup is painted after the reload (cache bust / no old-design flash).
//   U4  the 2.0.0 worker keeps the r86 shell whole as its rollback (PREVIOUS shell verified) and drops older caches.
//   U5  the phone's own data survives: every localStorage key and value, and the IndexedDB databases (device identity).
//   U6  rollback to 1.9.10 from Home runs the complete r86 shell; clearing it returns to 2.0.0.
// Needs the r86 tree: CMS_UPGRADE_FROM_ROOT=<dir> (for example `git worktree add ../r86 origin/main`). No Firebase: every
// request that is not this local server is refused, so no production host is ever contacted. Not a Gate lane.
// Run: CMS_UPGRADE_FROM_ROOT=../r86 node tests/browser/r87-upgrade-from-r86-audit.cjs
const assert=require("node:assert/strict");
const fs=require("node:fs");
const http=require("node:http");
const path=require("node:path");
const vm=require("node:vm");
const {chromium}=require("playwright");
const {resolveChromiumRuntime}=require("../support/chromium-runtime.cjs");

const R87_ROOT=path.resolve(__dirname,"../..");
const R86_ROOT=process.env.CMS_UPGRADE_FROM_ROOT?path.resolve(process.env.CMS_UPGRADE_FROM_ROOT):"";
const FROM="1.9.10-r86",TO=process.env.CMS_UPGRADE_TO_REVISION||"2.0.0-r87",TO_APP=TO.split("-")[0];
const PORT=Number(process.env.CMS_UPGRADE_PORT||4631);
const BASE=`http://127.0.0.1:${PORT}/`;
const OUT=path.join(R87_ROOT,"test-results","r87-upgrade-from-r86");
const pass=message=>console.log(`PASS ${message}`);

if(!R86_ROOT||!fs.existsSync(path.join(R86_ROOT,"service-worker.js"))){console.log("SKIP r87 upgrade audit: set CMS_UPGRADE_FROM_ROOT to an r86 (main) tree");process.exit(0);}

function swFacts(source){
  const sandbox={self:{addEventListener(){},location:{href:BASE},registration:{scope:BASE}},URL,console,Response:function(){},caches:{},fetch(){},setTimeout,clearTimeout};
  vm.createContext(sandbox);
  vm.runInContext(`${source}\n;globalThis.__facts={revision:RUNTIME_REVISION,previous:PREVIOUS_RUNTIME_REVISION,shell:[...SHELL_PATHS],previousShell:[...PREVIOUS_SHELL_PATHS]};`,sandbox);
  return JSON.parse(JSON.stringify(sandbox.__facts));
}
const r86Worker=fs.readFileSync(path.join(R86_ROOT,"service-worker.js"),"utf8");
const r86Facts=swFacts(r86Worker);
assert.equal(r86Facts.revision,FROM,`CMS_UPGRADE_FROM_ROOT must hold the live r86 build (${FROM}), found ${r86Facts.revision}`);

// The release PR's edits, applied to what the server sends (the tree on disk is never changed).
const r87Source=fs.readFileSync(path.join(R87_ROOT,"service-worker.js"),"utf8");
const r87Shell=swFacts(r87Source).shell;
const addedSinceR86=r87Shell.filter(p=>!r86Facts.shell.includes(p));
const removedSinceR86=r86Facts.shell.filter(p=>!r87Shell.includes(p));
function releaseWorker(source){
  let out=source.split(FROM).join(TO);
  out=out.replace(/const PREVIOUS_RUNTIME_REVISION = "[^"]*";/,`const PREVIOUS_RUNTIME_REVISION = "${FROM}";`);
  out=out.replace(/const SHELL_PATHS_ADDED_SINCE_PREVIOUS = new Set\(\[[^\]]*\]\);/,`const SHELL_PATHS_ADDED_SINCE_PREVIOUS = new Set(${JSON.stringify(addedSinceR86)});`);
  return out;
}
// U7: a later release on top of 2.0.0 (revision BUMP, PREVIOUS = 2.0.0, nothing added), to check the next update too.
const BUMP=`${TO_APP}-r87-next`;let bumped=false;
function bumpText(rel,text){
  let out=text.split(TO).join(BUMP);
  if(rel==="service-worker.js"){out=out.replace(/const PREVIOUS_RUNTIME_REVISION = "[^"]*";/,`const PREVIOUS_RUNTIME_REVISION = "${TO}";`);out=out.replace(/const SHELL_PATHS_ADDED_SINCE_PREVIOUS = new Set\([^;]*\);/,"const SHELL_PATHS_ADDED_SINCE_PREVIOUS = new Set([]);");}
  return out;
}
function releaseText(rel,text){
  if(bumped)return bumpText(rel,releaseText0(rel,text));
  return releaseText0(rel,text);
}
function releaseText0(rel,text){
  if(rel==="service-worker.js")return releaseWorker(text);
  let out=text.split(FROM).join(TO);
  if(rel==="js/app.js")out=out.replace(/const APP_VERSION = "[^"]+";/,`const APP_VERSION = "${TO_APP}";`);
  return out;
}
const releaseFacts=swFacts(releaseWorker(r87Source));
assert.equal(releaseFacts.revision,TO);assert.equal(releaseFacts.previous,FROM);

const MIME={".css":"text/css; charset=utf-8",".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",".mjs":"text/javascript; charset=utf-8",".json":"application/json; charset=utf-8",".webmanifest":"application/manifest+json; charset=utf-8",".png":"image/png",".webp":"image/webp",".jpg":"image/jpeg",".jpeg":"image/jpeg",".svg":"image/svg+xml",".woff2":"font/woff2",".wav":"audio/wav",".txt":"text/plain; charset=utf-8",".md":"text/markdown; charset=utf-8",".avif":"image/avif",".gif":"image/gif"};
const TEXT=new Set([".css",".html",".js",".mjs",".json",".webmanifest",".txt",".md",".svg"]);
let serving="r86";const served={r86:[],r87:[]};
const server=http.createServer((request,response)=>{
  const url=new URL(request.url,BASE);let rel=decodeURIComponent(url.pathname).replace(/^\/+/,"")||"index.html";
  const root=serving==="r86"?R86_ROOT:R87_ROOT,file=path.resolve(root,rel);
  if(file!==root&&!file.startsWith(root+path.sep)){response.writeHead(403);response.end();return;}
  let target=file;try{if(fs.statSync(target).isDirectory()){target=path.join(target,"index.html");rel=path.posix.join(rel,"index.html");}}catch(_e){}
  fs.readFile(target,(error,data)=>{
    if(error){response.writeHead(404,{"cache-control":"no-store"});response.end("Not found");return;}
    const ext=path.extname(target).toLowerCase();
    let body=data;if(serving==="r87"&&TEXT.has(ext))body=Buffer.from(releaseText(rel,data.toString("utf8")));
    served[serving].push(rel);
    response.writeHead(200,{"content-type":MIME[ext]||"application/octet-stream","cache-control":"no-store","x-content-type-options":"nosniff"});
    response.end(request.method==="HEAD"?undefined:body);
  });
});

async function workerMessage(page,type,which="active"){
  return page.evaluate(({type,which})=>new Promise(async(resolve,reject)=>{
    const reg=await navigator.serviceWorker.getRegistration("./"),worker=which==="waiting"?reg?.waiting:(reg?.active||navigator.serviceWorker.controller);
    if(!worker)return reject(new Error(`no ${which} worker`));
    const channel=new MessageChannel(),timer=setTimeout(()=>reject(new Error(`${type} timed out`)),15000);
    channel.port1.onmessage=event=>{clearTimeout(timer);resolve(event.data);};worker.postMessage({type},[channel.port2]);
  }),{type,which});
}
const pageFacts=page=>page.evaluate(()=>({app:typeof APP_VERSION==="string"?APP_VERSION:null,meta:document.querySelector('meta[name="app-asset-revision"]')?.content||null,screen:typeof window.getActiveScreenName==="function"?window.getActiveScreenName():null,controller:Boolean(navigator.serviceWorker.controller)}));
async function phoneData(page){
  return page.evaluate(async()=>{
    const local={};for(let i=0;i<localStorage.length;i+=1){const key=localStorage.key(i);local[key]=localStorage.getItem(key);}
    const dbs=typeof indexedDB.databases==="function"?(await indexedDB.databases()).map(d=>d.name).sort():[];
    return {local,dbs};
  });
}
// Page predicates that return a promise are polled here (page.waitForFunction does not wait for a returned promise).
async function poll(page,predicate,timeout,message){const until=Date.now()+timeout;while(Date.now()<until){if(await page.evaluate(predicate).catch(()=>false))return;await page.waitForTimeout(250);}throw new Error(message);}
// The phone's device identity (IndexedDB, js/sparkPrivatePairing.js): the id pairing and every shared write are bound to.
async function deviceId(page){
  return page.evaluate(async()=>{
    if(!window.CareerModeSparkPrivatePairing)await new Promise((resolve,reject)=>{const s=document.createElement("script");s.src="js/sparkPrivatePairing.js";s.onload=resolve;s.onerror=reject;document.head.append(s);});
    const identity=await window.CareerModeSparkPrivatePairing.getOrCreateDeviceIdentity({indexedDBImpl:indexedDB,cryptoImpl:crypto});
    return identity&&identity.deviceId||null;
  });
}
async function waitHome(page,timeout=60000){await page.waitForFunction(()=>typeof window.getActiveScreenName==="function"&&window.getActiveScreenName()==="mainMenu"&&!document.querySelector("#loadingScreen:not(.hidden)"),null,{timeout});}

async function run(){
  fs.mkdirSync(OUT,{recursive:true});
  await new Promise(resolve=>server.listen(PORT,"127.0.0.1",resolve));
  const runtime=await resolveChromiumRuntime();
  const browser=await chromium.launch({executablePath:runtime.executablePath,args:runtime.args,headless:true});
  const context=await browser.newContext({viewport:{width:1280,height:800}});
  const refused=new Set();
  await context.route("**/*",route=>{const u=new URL(route.request().url());if(u.hostname==="127.0.0.1"&&Number(u.port)===PORT)return route.continue();refused.add(u.hostname);return route.abort();});
  const page=await context.newPage();
  const pageErrors=[];page.on("pageerror",e=>pageErrors.push(String(e.message||e)));
  try{
    // U1 -------------------------------------------------------------------------------------------------------------------
    await page.goto(BASE,{waitUntil:"domcontentloaded"});
    await waitHome(page);
    await page.waitForFunction(()=>Boolean(navigator.serviceWorker.controller),null,{timeout:60000}).catch(async()=>{await page.reload({waitUntil:"domcontentloaded"});await page.waitForFunction(()=>Boolean(navigator.serviceWorker.controller),null,{timeout:60000});});
    await poll(page,()=>navigator.serviceWorker.getRegistration("./").then(r=>Boolean(r&&r.active&&r.active.state==="activated"&&!r.installing&&!r.waiting)),120000,"the r86 worker never activated");
    let status=await workerMessage(page,"CMS_GET_CACHE_STATUS");
    assert.equal(status.revision,FROM);assert.equal(status.current.ok,true,`r86 shell not verified: ${JSON.stringify(status.current.missing||[]).slice(0,300)}`);
    let facts=await pageFacts(page);assert.equal(facts.meta,FROM);
    // A phone with history: a few canonical keys the way the game keeps them (opaque to the update).
    await page.evaluate(()=>{localStorage.setItem("careerModeShowdown.upgradeProbe.v1",JSON.stringify({seasons:[1,2,3],note:"kept"}));});
    const deviceBefore=await deviceId(page);assert.match(String(deviceBefore),/^device_[0-9a-f]{32}$/);
    const before=await phoneData(page);
    pass(`U1 r86 ${FROM} installed and verified (${r86Facts.shell.length} shell paths)`);

    // U2 -------------------------------------------------------------------------------------------------------------------
    serving="r87";
    // Off Home: a game screen (the update boundary must hold it).
    const offHome=await page.evaluate(async()=>{const tried=[];for(const name of ["standings","statistics","trophyRoom","legacy","settings","createShowdown"]){try{if(typeof window.navigateTo==="function"){await window.navigateTo(name,{allowCanonicalFallback:false});const now=window.getActiveScreenName();tried.push(`${name}->${now}`);if(now&&now!=="mainMenu")return now;}}catch(e){tried.push(`${name}:${e.message}`);}}return tried.join(" | ");});
    console.log(`off Home: ${offHome}`);
    assert.ok(offHome&&!["mainMenu","dashboard"].includes(offHome)&&!offHome.includes("->"),`could not leave Home for the boundary check: ${offHome}`);
    let reloadedOffHome=false;page.once("framenavigated",frame=>{if(frame===page.mainFrame())reloadedOffHome=true;});
    await page.evaluate(()=>navigator.serviceWorker.getRegistration("./").then(r=>r.update()));
    await poll(page,()=>navigator.serviceWorker.getRegistration("./").then(r=>Boolean(r&&r.waiting&&!r.installing&&r.waiting.state==="installed")),180000,"the 2.0.0 worker never finished installing");
    const waiting=await workerMessage(page,"CMS_GET_CACHE_STATUS","waiting");
    assert.equal(waiting.revision,TO);assert.equal(waiting.current.ok,true,`2.0.0 shell not verified: ${JSON.stringify(waiting.current.missing||[]).slice(0,300)}`);
    await page.waitForTimeout(20000);
    assert.equal(reloadedOffHome,false,`the update reloaded the page on ${offHome}`);
    facts=await pageFacts(page);assert.equal(facts.meta,FROM);assert.equal(facts.screen,offHome);
    pass(`U2 the 2.0.0 worker waited while the page was on ${offHome} (no reload in 20 s)`);

    // U3 -------------------------------------------------------------------------------------------------------------------
    const afterRequests=[];let navigations=0;
    const onRequest=req=>{if(navigations>0)afterRequests.push(req.url());};
    page.on("request",onRequest);
    page.on("framenavigated",frame=>{if(frame===page.mainFrame())navigations+=1;});
    // r86 painted, recorded per frame after the reload: any element only r86 renders would show here. The page's own revision
    // meta is read on every animation frame from the first script that runs after the reload.
    await context.addInitScript(()=>{const seen=[];window.__cmsRevisionsSeen=seen;const read=()=>{const m=document.querySelector('meta[name="app-asset-revision"]');if(m&&!seen.includes(m.content))seen.push(m.content);};read();document.addEventListener("readystatechange",read);const tick=()=>{read();if(seen.length<4&&performance.now()<15000)requestAnimationFrame(tick);};requestAnimationFrame(tick);});
    await page.evaluate(async()=>{if(typeof window.navigateTo==="function")await window.navigateTo("mainMenu");});
    await page.waitForFunction(()=>true);
    const deadline=Date.now()+90000;while(navigations===0&&Date.now()<deadline)await page.waitForTimeout(250);
    assert.ok(navigations>0,"the 2.0.0 update did not apply on Home within 90 s");
    await page.waitForLoadState("domcontentloaded");await waitHome(page);
    facts=await pageFacts(page);
    assert.equal(facts.meta,TO);assert.equal(facts.app,TO_APP);
    const stale=afterRequests.filter(u=>u.includes(`v=${FROM}`));
    assert.deepEqual(stale,[],"requests after the update still asked for 1.9.10-r86 assets");
    const seen=await page.evaluate(()=>window.__cmsRevisionsSeen||[]);
    assert.deepEqual(seen,[TO],`the page painted another revision after the update: ${seen.join(", ")}`);
    await page.screenshot({path:path.join(OUT,"after-update-home-1280x800.png")});
    pass(`U3 Home applied the update by itself and reloaded straight into ${TO} (${afterRequests.length} requests, none for ${FROM})`);

    // U4 -------------------------------------------------------------------------------------------------------------------
    status=await workerMessage(page,"CMS_GET_CACHE_STATUS");
    assert.equal(status.revision,TO);assert.equal(status.previousRevision,FROM);
    assert.equal(status.current.ok,true);assert.equal(status.previous.ok,true,`r86 rollback shell incomplete: ${JSON.stringify(status.previous.missing||[]).slice(0,300)}`);
    const keys=await page.evaluate(()=>caches.keys());
    assert.ok(keys.some(k=>k.endsWith(TO)),"no 2.0.0 shell cache");assert.ok(keys.some(k=>k.endsWith(FROM)),"the r86 shell cache was dropped");
    assert.ok(!keys.some(k=>/1\.9\.9-r85/.test(k)),`an r85 cache was kept: ${keys.join(", ")}`);
    assert.equal(removedSinceR86.length,0,`r87 dropped shell paths r86 has (${removedSinceR86.join(", ")}): the rollback list cannot be r87's list minus the added paths`);
    pass(`U4 rollback shell ${FROM} verified whole (${releaseFacts.previousShell.length} paths = r86's ${r86Facts.shell.length}); caches: ${keys.join(", ")}`);

    // U5 -------------------------------------------------------------------------------------------------------------------
    const after=await phoneData(page);
    for(const [key,value] of Object.entries(before.local))assert.equal(after.local[key],value,`localStorage ${key} changed across the update`);
    for(const name of before.dbs)assert.ok(after.dbs.includes(name),`IndexedDB ${name} lost across the update`);
    assert.equal(await deviceId(page),deviceBefore,"the device identity changed across the update (pairing would break)");
    pass(`U5 ${Object.keys(before.local).length} localStorage keys, ${before.dbs.length} IndexedDB databases and the device identity kept as they were`);

    // U6 -------------------------------------------------------------------------------------------------------------------
    const rolled=await workerMessage(page,"CMS_ROLLBACK_TO_PREVIOUS");
    assert.equal(rolled.type,"CMS_ROLLBACK_ACCEPTED",JSON.stringify(rolled));
    // offline: nothing is served, so the rollback must come whole from the r86 cache
    await context.setOffline(true);
    await page.reload({waitUntil:"domcontentloaded"});await waitHome(page);
    facts=await pageFacts(page);assert.equal(facts.meta,FROM,"rollback did not run the r86 shell");
    await context.setOffline(false);serving="r87";
    const cleared=await workerMessage(page,"CMS_CLEAR_ROLLBACK");assert.equal(cleared.ok,true);
    await page.reload({waitUntil:"domcontentloaded"});await waitHome(page);
    facts=await pageFacts(page);assert.equal(facts.meta,TO);
    pass(`U6 offline rollback ran the whole ${FROM} shell from cache; clearing it returned to ${TO}`);

    // U7 ------------------------------------------------------------------------------------------------------------------
    // The next release after 2.0.0, on a phone that opens the app and closes it again within a few seconds (before the
    // app's own update check may run), then opens it again: the second open must still end on the new build by itself.
    bumped=true;
    await page.close();
    const quick=await context.newPage();quick.on("pageerror",e=>pageErrors.push(String(e.message||e)));
    await quick.goto(BASE,{waitUntil:"domcontentloaded"});await quick.waitForTimeout(5000);await quick.close();
    const next=await context.newPage();next.on("pageerror",e=>pageErrors.push(String(e.message||e)));
    const opened=Date.now();
    await next.goto(BASE,{waitUntil:"domcontentloaded"});
    const until=Date.now()+180000;let nextMeta=null;
    while(Date.now()<until){nextMeta=await next.evaluate(()=>document.querySelector('meta[name="app-asset-revision"]')?.content||null).catch(()=>null);if(nextMeta===BUMP)break;await next.waitForTimeout(500);}
    assert.equal(nextMeta,BUMP,`the next update did not apply after a 5 s open and a second open (still ${nextMeta})`);
    await waitHome(next);
    pass(`U7 the next release (${BUMP}) applied by itself on the second open, ${Math.round((Date.now()-opened)/1000)} s after it, after a first open closed at 5 s`);

    assert.deepEqual(pageErrors,[],"uncaught page errors");
    console.log(`r87 upgrade audit passed: ${FROM} -> ${TO}; rollback list adds ${addedSinceR86.length} paths: ${addedSinceR86.join(" ")}; refused hosts: ${[...refused].sort().join(", ")||"none"}`);
  }finally{await context.close().catch(()=>{});await browser.close().catch(()=>{});server.close();}
}
run().catch(error=>{console.error(error?.stack||error);process.exitCode=1;});

```


## FILE: .github/workflows/deploy-firestore-rules-zero-billing.yml
```
name: Deploy Firebase Firestore Rules - Zero Billing

on:
  workflow_dispatch:
    inputs:
      reason:
        description: Why this reviewed Rules source is being deployed
        required: false
        default: manual-provider-publication
  push:
    branches:
      - main
    paths:
      - firestore.spark.rules
      - firestore.shared-setup-production.fragment.rules
      - firestore.career-start-production.fragment.rules
      - firestore.transfer-challenge-production.fragment.rules
      - firestore.season-results-production.fragment.rules
      - firestore.season-commit-production.fragment.rules
      - firestore.terminal-close-production.fragment.rules
      - firestore.persistent-pair-production.fragment.rules
      - scripts/assert-firestore-zero-billing-boundary.mjs
      - scripts/build-production-firestore-rules.mjs
      - scripts/build-production-firestore-rules-with-persistent-pair.mjs
      - scripts/inject-persistent-pair-rules.mjs
      - scripts/publish-firestore-rules-zero-billing.mjs
      - firebase.production.rules.json
      - ops/firebase-rules-deploy-request.json

permissions:
  contents: read

concurrency:
  group: production-firestore-rules-zero-billing
  cancel-in-progress: false

env:
  FIREBASE_PROJECT_ID: fifa17-career-showdown-prod
  FIREBASE_CONFIG_FILE: firebase.production.rules.json
  FIREBASE_RULES_BASE_FILE: firestore.spark.rules
  FIREBASE_RULES_FILE: firestore.spark.generated.rules

jobs:
  deploy-firestore-rules:
    if: github.repository == 'nikahanghojjati-oss/fifa17-career-showdown2' && github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    timeout-minutes: 20

    steps:
      - name: Check out exact main source
        uses: actions/checkout@v7
        with:
          persist-credentials: false

      - name: Set up Node.js 24
        uses: actions/setup-node@v6
        with:
          node-version: 24
          package-manager-cache: false

      - name: Set up Java 21 for local Firestore emulator proof
        uses: actions/setup-java@v5
        with:
          distribution: temurin
          java-version: 21

      - name: Assert permanent zero-billing deployment boundary
        shell: bash
        run: |
          set -euo pipefail
          test "${GITHUB_REPOSITORY}" = "nikahanghojjati-oss/fifa17-career-showdown2"
          test "${GITHUB_REF}" = "refs/heads/main"
          test "${FIREBASE_PROJECT_ID}" = "fifa17-career-showdown-prod"
          node - <<'NODE'
          const fs = require('node:fs');
          const cfg = JSON.parse(fs.readFileSync('firebase.production.rules.json', 'utf8'));
          if (cfg?.firestore?.rules !== 'firestore.spark.rules') {
            throw new Error('firebase.production.rules.json must retain firestore.spark.rules as the reviewed Spark base authority.');
          }
          NODE

      - name: Build reviewed Shared Journey Rules source
        run: node scripts/build-production-firestore-rules.mjs

      - name: Add bounded persistent pair Rules authority
        run: node scripts/build-production-firestore-rules-with-persistent-pair.mjs

      - name: Refuse generated Rules that weaken the permanent Spark boundary
        shell: bash
        run: |
          set -euo pipefail
          test -s "${FIREBASE_RULES_FILE}"
          grep -Fq "match /accounts/{accountId}/pairLinks/{pairId}" "${FIREBASE_RULES_FILE}"
          grep -Fq "cmsPersistentPairCreationWitnessValid(rivalryId)" "${FIREBASE_RULES_FILE}"
          grep -Fq "cmsPersistentPairRedemptionWitnessValid(rivalryId, inviteBefore.data.slotId)" "${FIREBASE_RULES_FILE}"
          grep -Fq "allow get: if signedIn() && request.auth.uid == accountId && pairId == 'current'" "${FIREBASE_RULES_FILE}"
          grep -Fq "allow create: if cmsPersistentPairCreateValid(accountId, pairId)" "${FIREBASE_RULES_FILE}"
          grep -Fq "allow update: if cmsPersistentPairUpdateValid(accountId, pairId)" "${FIREBASE_RULES_FILE}"
          grep -Fq "allow list, delete: if false" "${FIREBASE_RULES_FILE}"
          grep -Fq "match /sharedSetup/authoritative" "${FIREBASE_RULES_FILE}"
          grep -Fq "allow create: if ssjrValidCreateLedger(rivalryId)" "${FIREBASE_RULES_FILE}"
          grep -Fq "allow update: if ssjrValidUpdateLedger(rivalryId)" "${FIREBASE_RULES_FILE}"
          grep -Fq "match /careerStart/authoritative" "${FIREBASE_RULES_FILE}"
          grep -Fq "allow create: if ssjrCareerValidCreate(rivalryId)" "${FIREBASE_RULES_FILE}"
          grep -Fq "allow update: if ssjrCareerValidUpdate(rivalryId)" "${FIREBASE_RULES_FILE}"
          grep -Fq "match /transferChallenges/{transferId}" "${FIREBASE_RULES_FILE}"
          grep -Fq "allow create: if ssjrTransferValidCreate(rivalryId, transferId)" "${FIREBASE_RULES_FILE}"
          grep -Fq "allow update: if ssjrTransferValidUpdate(rivalryId, transferId)" "${FIREBASE_RULES_FILE}"
          grep -Fq "request.time >= before.startedAt + duration.value(15, 'm')" "${FIREBASE_RULES_FILE}"
          grep -Fq "managerRole == ssjrActorRole(rivalryId) || public.phase == 'COMPLETED'" "${FIREBASE_RULES_FILE}"
          grep -Fq "match /seasonResults/{seasonId}" "${FIREBASE_RULES_FILE}"
          grep -Fq "allow create: if ssjrResultsValidCreate(rivalryId, seasonId)" "${FIREBASE_RULES_FILE}"
          grep -Fq "allow update: if ssjrResultsValidUpdate(rivalryId, seasonId)" "${FIREBASE_RULES_FILE}"
          grep -Fq "allow create: if ssjrResultsPrivateCreateValid(rivalryId, seasonId, managerRole)" "${FIREBASE_RULES_FILE}"
          grep -Fq "managerRole == ssjrActorRole(rivalryId) || public.phase == 'RESULTS_READY'" "${FIREBASE_RULES_FILE}"
          grep -Fq "career.setupOperationIds == setup.operationIds" "${FIREBASE_RULES_FILE}"
          grep -Fq "transfer.phase == 'COMPLETED'" "${FIREBASE_RULES_FILE}"
          grep -Fq "transfer.revision == 6 || transfer.revision == 7" "${FIREBASE_RULES_FILE}"
          grep -Fq "match /seasonCommits/{seasonId}" "${FIREBASE_RULES_FILE}"
          grep -Fq "allow create: if ssjrCommitValidCreate(rivalryId, seasonId)" "${FIREBASE_RULES_FILE}"
          grep -Fq "allow update: if ssjrCommitValidUpdate(rivalryId, seasonId)" "${FIREBASE_RULES_FILE}"
          grep -Fq "root.runtimeRevision == '1.9.1-r10'" "${FIREBASE_RULES_FILE}"
          grep -Fq "role == setup.coordinatorRole" "${FIREBASE_RULES_FILE}"
          # Audit R84 F01/F02 (r85): pin the live Season Commit validators and the restored acting account/device lookups.
          grep -Fq "after.results.playerOne == p1.result" "${FIREBASE_RULES_FILE}"
          grep -Fq "after.results.playerTwo == p2.result" "${FIREBASE_RULES_FILE}"
          grep -Fq "ssjrActorWriteAuthorityValid(rivalryId, after.updatedByDeviceId, after.activeSessionId);" "${FIREBASE_RULES_FILE}"
          grep -Fq "return ssjrActorWriteAuthorityValid(rivalryId, deviceId, sessionId)" "${FIREBASE_RULES_FILE}"
          grep -Fq "actorAccount.data.data.status == 'active'" "${FIREBASE_RULES_FILE}"
          grep -Fq "device.data.data.state == 'active'" "${FIREBASE_RULES_FILE}"
          grep -Fq "root.phase == 'ACKNOWLEDGED'" "${FIREBASE_RULES_FILE}"
          grep -Fq "request.resource.data.data.connectionState == 'closed'" "${FIREBASE_RULES_FILE}"
          grep -Fq "!('terminalClose' in request.resource.data.data)" "${FIREBASE_RULES_FILE}"
          grep -Fq "&& cmsPersistentPairAbandonValid(rivalryId)" "${FIREBASE_RULES_FILE}"
          grep -Fq "function ssjrTerminalValidRivalryUpdate(rivalryId)" "${FIREBASE_RULES_FILE}"
          grep -Fq "intent.runtimeRevision == '1.9.1-r18'" "${FIREBASE_RULES_FILE}"
          grep -Fq "function ssjrTerminalValidProgressUpdate(rivalryId)" "${FIREBASE_RULES_FILE}"
          grep -Fq "priorProgress.acceptedThroughSeason == priorProgress.totalSeasons" "${FIREBASE_RULES_FILE}"
          grep -Fq "function ssjrTerminalValidAtomicSessionClose(rivalryId, sessionId)" "${FIREBASE_RULES_FILE}"
          grep -Fq "|| (!('terminalProgress' in request.resource.data.data) && validRivalryRedeem(rivalryId));" "${FIREBASE_RULES_FILE}"
          grep -Fq "intent.billingRequired == false" "${FIREBASE_RULES_FILE}"
          grep -Fq "allow list, delete: if false" "${FIREBASE_RULES_FILE}"
          grep -Fq "allow list, update, delete: if false" "${FIREBASE_RULES_FILE}"
          grep -Fq "match /{document=**}" "${FIREBASE_RULES_FILE}"
          node scripts/assert-firestore-zero-billing-boundary.mjs

      - name: Install locked repository dependencies
        run: npm ci

      - name: Install pinned Firebase emulator test dependencies
        run: npm install --no-save --package-lock=false firebase@12.17.1 @firebase/rules-unit-testing@5.0.1 firebase-admin@14.2.0

      - name: Prove reviewed production Rules contracts
        run: |
          node tests/contracts/stage5d-production-session-rules-contracts.cjs
          node tests/contracts/shared-showdown-production-runtime-contracts.cjs
          node tests/contracts/shared-career-start-contracts.cjs
          node tests/contracts/shared-transfer-challenge-contracts.cjs
          node tests/contracts/shared-season-results-contracts.cjs
          node tests/contracts/shared-season-results-provider-contracts.cjs
          node tests/contracts/shared-season-results-rules-contracts.cjs
          node tests/contracts/shared-season-commit-contracts.cjs
          node tests/contracts/shared-season-commit-provider-contracts.cjs
          node tests/contracts/shared-season-commit-rules-contracts.cjs
          node tests/contracts/shared-terminal-close-rules-contracts.cjs
          node tests/contracts/persistent-nik-daniel-pair-contracts.cjs

      - name: Reprove generated production Shared Setup Rules with adversarial provider matrix
        run: npx --yes firebase-tools@15.28.1 emulators:exec --only firestore --project demo-career-mode-showdown-shared-setup-production-deploy "node tests/firebase/shared-showdown-setup-production-provider-emulator.cjs"

      - name: Prove Shared Transfer fresh-session timeout recovery
        run: npx --yes firebase-tools@15.28.1 emulators:exec --only firestore --project demo-career-mode-showdown-transfer-fresh-session "node tests/firebase/shared-transfer-challenge-fresh-session-emulator.cjs"

      - name: Prove full shared gameplay provider lifecycle
        run: npx --yes firebase-tools@15.28.1 emulators:exec --only firestore --project demo-career-mode-showdown-gameplay-lifecycle "CMS_SHOWDOWN_LENGTH=1 node tests/firebase/shared-gameplay-provider-lifecycle-emulator.cjs && CMS_SHOWDOWN_LENGTH=3 node tests/firebase/shared-gameplay-provider-lifecycle-emulator.cjs && CMS_SHOWDOWN_LENGTH=5 node tests/firebase/shared-gameplay-provider-lifecycle-emulator.cjs && CMS_SHOWDOWN_LENGTH=10 node tests/firebase/shared-gameplay-provider-lifecycle-emulator.cjs"

      - name: Prove r18 Terminal Close Rules with adversarial provider matrix
        run: npx --yes firebase-tools@15.28.1 emulators:exec --only firestore --project demo-career-mode-showdown-terminal-close-production-deploy "node tests/firebase/shared-terminal-close-production-provider-emulator.cjs && node tests/firebase/europa-league-rules-emulator.cjs && node tests/firebase/prime-pack-rules-emulator.cjs"

      - name: Prove persistent Nik and Daniel pair Rules with adversarial provider matrix
        run: npx --yes firebase-tools@15.28.1 emulators:exec --only firestore --project demo-career-mode-showdown-persistent-pair-deploy "node tests/firebase/persistent-nik-daniel-pair-provider-emulator.cjs && node tests/firebase/permanent-partner-emulator.cjs && node tests/firebase/ended-early-emulator.cjs"

      - name: Authenticate permanent Firebase Rules service account
        id: google-auth
        uses: google-github-actions/auth@v3
        with:
          credentials_json: ${{ secrets.FIREBASE_RULES_SERVICE_ACCOUNT_JSON }}
          create_credentials_file: true
          export_environment_variables: true

      - name: Refuse missing permanent ADC credential file
        shell: bash
        run: |
          set -euo pipefail
          test -n "${GOOGLE_APPLICATION_CREDENTIALS:-}"
          test -f "${GOOGLE_APPLICATION_CREDENTIALS}"

      # The helper uses only Google OAuth and https://firebaserules.googleapis.com.
      # Ruleset creation compiles the generated source before the cloud.firestore release changes.
      # No Cloud Run, Cloud Functions, billing API, Blaze plan, payment method or purchased credit exists in this workflow.
      - name: Compile, publish and independently read back exact Firestore Rules source
        run: node scripts/publish-firestore-rules-zero-billing.mjs

```


## FILE: .github/workflows/deploy-github-pages.yml
```
name: Deploy GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages-production
  cancel-in-progress: false

jobs:
  # r86 (red team #4): the Rules go live before the site. A push that changes the Rules starts both workflows at once;
  # the new app would then meet the old Rules for a few minutes (its career summaries denied, each History open a full
  # read). This job waits for this commit's Rules deploy and stops the site if that deploy fails. A push without a Rules
  # change starts no Rules run, so after 90 s with none the site goes ahead only if the last Rules deploy on main succeeded.
  rules-first:
    runs-on: ubuntu-latest
    timeout-minutes: 20
    permissions:
      actions: read
      contents: read
    steps:
      - name: Wait for this commit's Rules deploy
        if: github.event_name == 'push'
        env:
          GH_TOKEN: ${{ github.token }}
          REPO: ${{ github.repository }}
          SHA: ${{ github.sha }}
        shell: bash
        run: |
          set -euo pipefail
          for attempt in $(seq 1 110); do
            runs="$(gh api "repos/$REPO/actions/workflows/deploy-firestore-rules-zero-billing.yml/runs?head_sha=$SHA&event=push&per_page=5" --jq '[.workflow_runs[] | {status, conclusion}]')"
            count="$(jq 'length' <<<"$runs")"
            if [[ "$count" == "0" ]]; then
              if (( attempt >= 9 )); then
                # r87: no Rules run for this commit, so the live Rules are whatever the last Rules deploy on main left. A failed one
                # (the Rules API answered 503 four times during r86) must be re-run before any later push ships the site.
                last="$(gh api "repos/$REPO/actions/workflows/deploy-firestore-rules-zero-billing.yml/runs?branch=main&event=push&status=completed&per_page=1" --jq '.workflow_runs[0].conclusion // "none"')"
                if [[ "$last" == "success" || "$last" == "none" ]]; then echo "No Rules deploy for this commit; the last one on main succeeded, so the site goes ahead."; exit 0; fi
                echo "::error::No Rules deploy for this commit and the last Rules deploy on main ended '$last'. Re-run it first; the site is not deployed ahead of its Rules."
                exit 1
              fi
            elif [[ "$(jq -r '.[0].status' <<<"$runs")" == "completed" ]]; then
              conclusion="$(jq -r '.[0].conclusion' <<<"$runs")"
              if [[ "$conclusion" == "success" ]]; then echo "Rules deployed; the site goes ahead."; exit 0; fi
              echo "::error::This commit's Rules deploy ended '$conclusion'; the site is not deployed ahead of its Rules."
              exit 1
            fi
            sleep 10
          done
          echo "::error::This commit's Rules deploy did not finish in time; the site is not deployed ahead of its Rules."
          exit 1

  build:
    needs: rules-first
    runs-on: ubuntu-latest
    timeout-minutes: 8

    steps:
      - name: Check out repository
        uses: actions/checkout@v5

      - name: Set up Node.js
        uses: actions/setup-node@v5
        with:
          node-version: 24

      - name: Require controlled browser-public deployment variables
        env:
          HAS_FIREBASE_WEB_API_KEY: ${{ vars.CMS_FIREBASE_WEB_API_KEY != '' }}
        shell: bash
        run: |
          set -euo pipefail
          if [[ "$HAS_FIREBASE_WEB_API_KEY" != "true" ]]; then
            echo "::error::Required GitHub Actions variable CMS_FIREBASE_WEB_API_KEY is not configured."
            exit 1
          fi

      - name: Configure GitHub Pages
        uses: actions/configure-pages@v5

      - name: Stage static runtime surface
        shell: bash
        run: |
          set -euo pipefail
          mkdir -p .pages-artifact/scripts
          cp index.html manifest.webmanifest service-worker.js firebase.runtime-config.json .pages-artifact/
          cp production-authorization-acceptance.html .pages-artifact/
          cp -R acceptance assets css data js .pages-artifact/
          # Team V screens, fonts and art (precached by service-worker.js and loaded under ?v=).
          cp -R visual-assets .pages-artifact/
          cp scripts/render-production-firebase-public-config.mjs .pages-artifact/scripts/

      - name: Render deployment-only Firebase configuration
        env:
          CMS_FIREBASE_WEB_API_KEY: ${{ vars.CMS_FIREBASE_WEB_API_KEY }}
        run: node .pages-artifact/scripts/render-production-firebase-public-config.mjs

      - name: Verify rendered configuration without printing provider values
        shell: bash
        run: |
          set -euo pipefail
          node - <<'NODE'
          const fs = require("node:fs");
          const config = JSON.parse(fs.readFileSync(".pages-artifact/firebase.runtime-config.json", "utf8"));
          if(config.schemaVersion !== 1 || config.configured !== true){
            throw new Error("Rendered runtime configuration is not enabled.");
          }
          if(!config.firebaseConfig || config.firebaseConfig.projectId !== "fifa17-career-showdown-prod"){
            throw new Error("Rendered runtime configuration has the wrong Firebase project.");
          }
          if(typeof config.firebaseConfig.apiKey !== "string" || config.firebaseConfig.apiKey.length < 20){
            throw new Error("Rendered Firebase Web API key is missing or malformed.");
          }
          process.stdout.write("Verified configured production Firebase runtime shape without printing provider values.\n");
          NODE
          rm -rf .pages-artifact/scripts

      - name: Upload GitHub Pages artifact
        uses: actions/upload-pages-artifact@v4
        with:
          path: .pages-artifact

  deploy:
    needs: build
    runs-on: ubuntu-latest
    timeout-minutes: 8
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}

    steps:
      - name: Deploy GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4

```


## FILE: RELEASE_PR_CHECKLIST.md
```text
# r87 = 2.0.0 release PR checklist (lead, 2026-11-01 08:00 UTC)

Branch claude-gameplay/r87-release off the current gameplay/r87. Open a draft PR into gameplay/r87 titled "r87 release items (merge at freeze)". The lead merges it at freeze, then opens gameplay/r87 -> main.

1. Version 2.0.0-r87 everywhere the version is pinned: r86-release-contracts pins "1.9.10-r86", plus Settings version text and release notes.
2. Service worker revision bump.
3. Set RRR_FROM_MS and ROULETTE_FROM_MS to the release time. Put the value in one constant and say in the PR body where the lead sets it at freeze. Do the same for Prime Pack's start constant once #1149 lands.
4. PREVIOUS = 1.9.10-r86. Rollback list SHELL_PATHS_ADDED_SINCE_PREVIOUS: 38 paths with #1122, plus 3 from #1126 (41), plus whatever #1149 adds. Contract r87-upgrade-rollback-list prints the list.
5. Arch D1: drop the 7 acceptance-only scripts (~160 KB) from the precache. This changes the shell counts in r86-release-contracts and in 4 ssjr/marble contracts.
6. Rules re-pin of the composed Rules: #1097, #1101, #1148 (c318ee69) and #1147 (670ab4e6), plus #1149's primePackRounds once merged. Regenerate with tests/support/regenerate-fsb-lookup-table.cjs and keep main-delta.json in step.
7. Wire every new proof test command into package.json. Take them from the PR bodies of the merged r87 PRs: leak-soak, privacy, oracle, lengths, finish, clocks, pairing, scoring, sizes, words, history-scale, roulette-hits, fable-step, fable-pairing, polish-*, career-fixes, and so on.
8. Small items:
   - F4 Waiting panel overflow (only if Codex C1 hasn't fixed it).
   - The commentary typo is already fixed in #1126.
9. Deploy order: Rules deploy first, then Pages (old Rules refuse the new spin marks, Prime Pack rounds and the roulette/spins record).
10. Run contracts, ops and the full Gate locally where possible. Batch the pushes. Merge gameplay/r87 into the branch only for a real conflict. Registry-only conflicts go to the lead.

Never: push to main, deploy Rules, touch other open PRs' files beyond the pins above.

```


## FILE: RELEASE_NOTES_2.0.0.md
```text
# Career Mode Showdown 2.0.0 (r87): release notes

Draft for Nik and Daniel. Kept up to date as fix PRs land in gameplay/r87. Facts come from the merged PRs listed at the bottom.
Status: DRAFT, last updated 2026-11-01 17:45 UTC (final app build gameplay/r87 9a9667fb). Items under "Still to land" are not in yet.

## The big one: Russian Roster Roulette
Every season, after Career Start and before the transfer window, each of you spins a seven-chamber revolver in a 3D cowboy-cafe scene. Daniel spins first.
- One chamber in seven fires. A shot hits one of the 15 players on your FIFA 17 squad board (11 starters and 4 subs), and you release that player in your real FIFA 17 save.
- Your board starts as your club's real FIFA 17 launch squad, in its real formation. From season 2 it updates itself: the player you lost leaves, and your kept signings join if they fit the position and are better.
- Your Special Player is never on the board, so he can never be shot.
- The transfer window opens only after both of you have spun. Until then the button says who it is waiting for.
- Both phones always see the same spin. A refresh or double tap can't spin again.
- If the scene can't load, you still get your result on a plain panel, and the transfer window stays shut until you have seen it.
- Each season's hit is saved online, so a reload or the other phone always shows the same player, and the roulette never spins twice.
- A player your rival guessed comes off your board, but a club player who shares his name stays. A player your rival guessed can't be signed again in a later transfer window: the game refuses with a clear message, and the Rule Book says so.
- The scene looks sharper: a nickel-steel drum, the title steps aside while a turn plays, and the props keep clear of the boards.

## Prime Pack (new)
Once a season, right after the roulette and before the transfer window, a Prime Pack opens on both phones and one masked Icon card rises.
- Stage 1 shows his position and one real card stat; each of the next three stages adds a stat. A right name scores 4, 3, 2 or 1 points depending on the stage.
- Each of you has 2 guesses for the whole round. The first right guess wins (by server time), so only one of you can score. Nobody right means nobody scores, and the full card is revealed.
- A perfect season is now 15 points, and a Golden Showdown is 150 points over ten seasons.
- The player is never stored: both phones work him out from the Showdown, so nobody can peek.
- If one of you taps BACK while waiting, the other can't play the round alone.
- Team V's card art: a cream-and-gold Icon card in the Showdown's own style. With the phone keyboard open the page keeps its phone layout, and once the round is over your line gets the whole box.

## Transfer window
- Each signing now takes the player's FIFA 17 overall (30 to 99) and his position. These feed the roulette board; they are never part of a guess.
- League names use the official 2016-17 names (LaLiga Santander, Serie A TIM, Sky Bet Championship and so on). Old names still work in search.
- Search lists show every option, scroll properly, and stay clear of the phone's bottom buttons.
- On a laptop the faces at the top are no longer covered.
- Deadline Day finish: the last part of the window gets ticker headlines and a commentator line.
- Clearer messages when the connection drops or Firebase refuses an action.
- A cleaner Transfer War: the window clock is the hero on laptops, RELEASE and KEEP stamps, and an opaque CONTINUE bar on phones.
- Locking three signings works again (it was refused by Firebase in an earlier r87 build).

## Season Results: Commentary v3
A two-voice TV bar inside the SEASON SCORE box. COMMENTARY tells the biggest story of the season, and BY THE NUMBERS works out exactly what each of you needs next. Lines come only from your own results, never repeat within a Showdown, and the last season tells the story of the whole Showdown. It never covers faces or buttons.

## The Touchline Gazette
A newspaper front page after each season's results, and a final edition after the Final Winner that covers the whole Showdown. Both phones print the same paper. It costs no extra Firebase reads, and CONTINUE takes you on to the next screen. The last season goes straight to the final edition.
- THE RACE strip says who leads, by how much, and when a lead can no longer be caught.
- A record book with streaks, best seasons and perfect 15-point seasons, and a Golden watch (150 points) in ten-season Showdowns.
- Every printed line is checked against what really happened. The paper is bigger, with darker ink and larger reading sizes, and fills the whole phone screen. Broken pictures and sideways phones are fixed.

## Starting a Showdown
- Seasons screen: four gold chips for 1, 3, 5 and 10 seasons, plus the NEW SHOWDOWN wordmark.
- Career Start has its own stage on the Club plate: your club crests sit inside the packs, and nothing covers the faces or wordmark.
- Special Player reveal: smoother on phones, the LED boards show whole messages, the name always fits its plate, and Continue is no longer dimmed while waiting. From 2.0.0 Showdowns on, neither manager's Special Player is ever from their own club.
- REMATCH on the Final Winner screen. Daniel's opens the seasons screen with the same length already picked; Nik's takes him to Home to JOIN.

## Career screens
- History opens on your newest Showdown and stays fast with hundreds of Showdowns.
- History & Backup shows your real online career (it showed 0 before), and Standings and Rivalry no longer get stuck during a live Showdown.
- The season history is now a clear table: season, both managers' points and the result.
- Career pages keep the Reus loading screen up until your career has arrived, even on a slow or offline phone, and show TRY AGAIN if they can't load. No crown for a 0-0 when no Showdown has finished, and equal points always count as a draw. An empty Standings tab has a button to Career Standings.
- Many layout fixes: Final Winner buttons, Trophy Room headings and "NOT WON YET", drawn Showdowns shown with "=", a split face for a level Career Leaders row, and big numbers fitting on Career Statistics.

## Smoother everywhere
- No black pause between screens. A slow screen change shows the Reus loading screen instead, and it never blinks.
- No flash of the old top bar between Loading and Home, and a faster first load.
- Error, offline and quota screens say what happened in plain words and always give you a way back.
- A double tap on a Home tile no longer opens the wrong screen.
- Home has no extra music bar at any size, and its tiles never sit under the phone's tab bar. On phones music lives in the MUSIC tab.
- The first tap on OPEN TROPHY ROOM always opens it (it was sometimes swallowed while the screen loaded).
- Title screens wipe in without a solid cover over the picture.
- Music player: your chosen song stays chosen, a failed stream retries when you tap Play, and the panel says what it's doing.
- Reloading in the middle of a Showdown on a weak signal resumes the right season instead of starting again. A reload or a stale tab at the very end of a Showdown still lands on the Champion screen.
- Pairing: an UNPAIR that can't happen says why, Nik's Home notices when Daniel has unpaired, expired codes say so, and the JOIN wait stops polling once the code has expired.
- A phone with a wrong clock can still connect, and tomorrow's clock change doesn't affect timers.
- No dark box across a face on tablet Home, and the Select League waiting strip never covers its buttons.

## Free-tier reads
- Both phones now show the same "free online use today" and "seasons left" numbers (a small shared meter, written once per season per phone).
- Several cuts to background reads, including the season-commit wait (about a quarter fewer reads there) and the settings counter no longer charging lookups Firebase doesn't bill. About 580 billed reads per middle season for both phones. The game stays on the free Firebase plan.

## Wording
Buttons and status lines name Daniel instead of "host", the Transfer Challenge shows the right season number, and empty screens say what to tap next.

## Still to land (not in yet)
- Version 2.0.0 everywhere (Settings and the update check).

## Before and right after it goes live
- A 10-season emulator game with every career screen matching the online data.
- Nik looks over the gallery, then types "merge r87". The new Firebase Rules deploy first, then the site.
- Nik's real-phone check on the live game (there is no test site, and the roulette needs a Showdown started after the release): https://claude.ai/artifact/LDYipb4Bc6qmYg8Gg3onPU

## Merged PRs in this release (into gameplay/r87)
#1040, #1043, #1044, #1045 (board save, later removed by #1069), #1049, #1052, #1065, #1069, #1075, #1078 (r86 merged in), #1079, #1080, #1081, #1082, #1083, #1084, #1085, #1088, #1091, #1093, #1094, #1095, #1096, #1097, #1098, #1099, #1100, #1101, #1102, #1103, #1104, #1105, #1106, #1107, #1108, #1109, #1110, #1111, #1112, #1113, #1114, #1116, #1117, #1119, #1120, #1121, #1123, #1125, #1126, #1128, #1129, #1130, #1131, #1132, #1133, #1134, #1135, #1137, #1138, #1139, #1140, #1141, #1142, #1143, #1144, #1145, #1146, #1147, #1148, #1118, #1122, #1150, #1151, #1152, #1153, #1154, #1157, #1158, #1159, #1160, #1161, #1162, #1164, #1165, #1166, #1167, #1168, #1169, #1170, #1171, #1173, #1174, #1149, #1175, #1163, #1176, #1177, #1178, #1179, #1180.

```
