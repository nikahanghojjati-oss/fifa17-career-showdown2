# Red team r87: Roulette + Special Player — round 2

Audited `gameplay/r87` at **`b2ba864e691c6c7a4c47edc83d080b4822033237`**, 31 October 2026. This head contains `73713d75`, #1095, #1101 and #1102, and the later signing/club-namesake repair `8742e1b1`. Round 1 baseline: `audit/r87/REDTEAM_R87_RR_SP.md`. All file:line references below are to this audited head, not a proposed fix.

**Score: 7/10.** The six in-scope round 1 engine/scene-plan defects are fixed under the clarified matching rules. No new wrong engine-selected player or identical-input phone disagreement was reproduced. Six remaining findings: **four P1** (ambiguous manual release identity, stale retry card, failed-navigation cleanup, and missing SP guard after a failed draw load on resume), **two P2** (hidden spin-mark failure on the non-coordinator and an optional font request aborting the scene). None is claimed as a demonstrated P0. Six ten-season walks, the supplied regression suites, source-data comparisons and the local Rules emulator passed the integrity checks described below; the additional recovery repros expose gaps in that coverage.

Publication-state check: **#1105 is open**, at `b07b9a9e19c56415516146de62991caa83054a1b`. It already proposes fixes for F2-03/F2-01/F2-06, corresponding to C2-04/05/06 below. These are independently reproduced defects **still present on the audited branch**, not claims of previously undiscovered work or evaluations of that unmerged patch. #1123 is also open and proposes scene look changes. Neither PR was applied to the test checkout. Live `gameplay/r87` was re-fetched before publication and remained the pinned head.

Only this Markdown file is proposed. No game code changes, production Firebase requests, deployments, merges or SSJR/MDP credit. Public GitHub source/metadata and the public CSV were read; Firebase tests used a `demo-` project and the local emulator. Browser requests outside localhost were blocked. The release-time roulette cutoff, initials expansion, equal chances across filled XI/sub slots, unknown-position bench-only behavior and the known accented-font fallback are not reported as bugs.

## A. Round 1 verdicts and exact reruns

Conventions: slots 0–10 are XI, 11–14 subs. Unmentioned board slots remain the launch board returned by `require('./js/rosterRoulette.js').board(club)`. All season histories contain both role arrays, including empty arrays. `release:false` means kept. Fixture names and complete IDs are those in round 1. Tests below used the actual module on this head, plus isolated VM draw overrides only for the expressly all-fired walks. Ordinary seeded repros do not override randomness.

| Round 1 ID | Verdict | Rerun / actual result at this head | Evidence |
|---|---|---|---|
| R87-C-01 | **FIXED** | Original Barcelona/Liverpool ID `pair_a0000000000000030000012d0000000000000000000000000000000000000045`, season 1, SP Messi/Neymar, no signings. Daniel still fires chamber 6 at slot 1; the victim is now **André Gomes**, not Neymar. Both SPs are absent. Daniel XI is `[A. Turan, André Gomes, L. Suárez, Iniesta, Sergio Busquets, I. Rakitić, Jordi Alba, Piqué, J. Mascherano, M. ter Stegen, Sergi Roberto]`, subs `[J. Mathieu, J. Cillessen, S. Umtiti, Paco Alcácer]`. | `js/rosterRoulette.js:143–149,334–341`; contract L17 also drains every catalog-club SP's pool. |
| R87-C-02 | **FIXED** | Original Arsenal `rb` fixture shoots Bellerín in S1. S2 now has **M. Debuchy at RB10**, with Mertesacker remaining sub11. Original `bellerin` SP fixture produces that same correct launch replacement. Liverpool's forced S1 LW loss now brings in **Origi**, not ST-only Sturridge; the next ST loss promotes Sturridge, not Sakho. | `js/rosterRoulette.js:234–274`; L18 and the walks below. Exhausted-line fallback is distinguished below from ignoring an available fitting player. |
| R87-C-03 | **FIXED** | Arsenal, original `safe` ID, S1 safe; keep Playmaker90/CAM in window 1. S2: **Playmaker at LDM6**, Özil remains CAM0; Xhaka84 takes sub12. The signing no longer displaces Özil89 while Xhaka84 remains. Strict equal-overall incumbent retention also passes. | `js/rosterRoulette.js:120–124,206–224`; L19. |
| R87-C-04 | **FIXED** | Original `order` ID; keep First CM90 and Second CM90, reverse their UI entry slots. Both complete S2 plans are now equal: First CM at LDM6, Second CM at RDM3; subs `[P. Mertesacker, G. Xhaka, Santi Cazorla, Lucas Pérez]`. The seeded S2 shot is chamber5/slot3/**Second CM in both**. | `js/rosterRoulette.js:60–63,309–313`; L20. |
| R87-C-05 | **FIXED for the explicitly agreed matching scope** | Empoli's Matheus Pereira70/#31 survives Sporting's SP Matheus Pereira74/#73 exclusion: in the original forced-sub11 S4 repro he now occupies sub11. Alavés' Manu García #26 retains CAM positions and can appear independently of #19. `M. Ozil`, case and outside spaces fold to `M. Özil` and cannot restore the SP. The original `Mesut Ozil` spelling still differs, as expected from the expressly parked initials expansion; it is **not** an open finding. The new release-panel identity loss is C2-01 below, not a failure of the repaired engine matching. | `js/rosterRoulette.js:42–59,90–106,139–149`; L21 and L1d; `js/marqueePlayer.js:58–63`. |
| R87-C-06 | **FIXED** | Original `safe` ID, Arsenal/Liverpool S1, no signings/SP: Daniel bullet1/stop4/safe/aim9; Nik bullet2/stop0/safe/aim6. The parent sends these exact chamber and slot fields plus a shared cosmetic seed. Extracting the actual scene `rrPlanTurn` and driving 40 safe/fired turns with deliberately reversed visual bubble order preserves every engine bullet, stop, fire and aim slot. | `js/rosterRouletteStep.js:109–110,174–178`; `visual-assets/v10_1/roulette/index.html:779–796,994–996`; L22. Full WebGL rendering limits are recorded below. |

The cutoff item is deliberately outside this verdict table, as instructed.

### Other fixes cited in the request

| Finding / fix | Verdict and evidence rerun |
|---|---|
| R87-D-01, Mbappé source/display name | **FIXED.** `data/marqueePlayers.js:327–330` maps `K. Mbappé` to `K. Mbappe Lottin`; the step forwards this (`js/rosterRouletteStep.js:102–106`), and the engine excludes both names (`js/rosterRoulette.js:300–305`). L21 verifies exactly one matching source row for each of 269 catalog-club SPs. |
| R87-E-01, stale signing gets a vacancy ahead of the current window/bench | **FIXED.** Only the current window gets first refusal (`js/rosterRoulette.js:234–241`); L23's original XI and sub vacancy repros pass. |
| RT5 Q1 / Q2 | **FIXED.** Displaced starters compare with the remaining weakest sub before taking a bench vacancy (`js/rosterRoulette.js:184–194`); refill compares reserves with unused club rows by overall/shirt (`:157–178`). Both L23 repros pass. |
| R87-E-02, exhausted keepers and later keeper signing | **FIXED.** L14's natural Everton repro and the forced exhaustion/keeper-repair cases pass. `js/rosterRoulette.js:265–274` exhausts keeper choices before using an outfielder; `:196–218,278–289` repairs a stopgap when a fitting player becomes available. |
| Sol SQ-1-01 | **FIXED.** All 98 scene launch XIs and four subs equal the engine's roster tuples; L1b. `scripts/sync-roulette-scene-squads.cjs:12–23` supplies the sync. |
| Sol SQ-2-01 / 02 / 03 | **FIXED.** L1c's Roma/Hull stopgap repair, guessed incumbent eviction **after that season's displayed shot**, and repeated-signing first-window repros pass. `js/rosterRoulette.js:278–294,345–363`. |
| Later Sol SQ-4-01 | **FIXED at this head.** A guessed signing does not evict the manager's club namesake. L1d includes 400 ten-season oracle careers. Club people retain name+shirt; typed signings have their own name identity (`js/rosterRoulette.js:42–59`). No attempt was made to reverse this subsequent explicit owner decision. |
| RT5-FLOW-01 | **FIXED.** L24 drives a frame that says ready and then drops setup/errors. The stage waits for armed and falls back to the result after an error or five-second armed timeout. `js/rosterRouletteStep.js:151–191`; scene `:981–991`. |
| SP-01 | **FIXED.** S10's in-progress row without a confirm time returns no previous Showdown's chip (`js/specialPlayerChip.js:75–85`). |
| SP-02 | **PARTIAL.** L7 verifies own SP display/source aliases, folded spelling, old Showdowns and rival SP acceptance; the form refuses own SP before lock when the draw is loaded (`js/productionSharedTransferChallenge.js:260–271`). Career Start attempts to load the chip/draw, but catches failure as optional (`js/productionSharedCareerStart.js:18–33`). With roulette already done on this browser, the transfer open never ensures the draw again: the production form can send its own SP as an ordinary signing. **Exact remaining repro: C2-06.** Open #1105 proposes the missing ensure-before-decide fix. |
| SP-03 | **FIXED for a reveal that never starts.** Vendored three.js, no seen marker on initial load failure (`js/specialPlayerReveal.js:99–111`; reveal page `:164`). R3/R5 contracts pass. An error **after** start retains the seen marker; a physical post-start recovery run is unknown, not claimed fixed by an initial-load test. |

## B. New findings

### R87-C2-01 — P1: the manual release panel discards the shirt identity of a homonym

**File:line:** `js/rosterRouletteStep.js:196–205`; `:174` also drops shirt number from the frame board payload. The source people are `data/fifa17Players.js:32` (Alavés). The scene's result is also name-only at `visual-assets/v10_1/roulette/index.html:801,842`.

**Exact inputs:** id `pair_a000000000000000000000000000000000000000000000000000000000000121` (equivalently `'pair_a'+'121'.padStart(63,'0')`); Daniel Alavés, Nik Liverpool; confirmed `2026-10-31T12:00:00Z`; S1, empty histories, no signings. Real SPs: Daniel Neymar/#11, Nik Cristiano Ronaldo/#7, neither from Alavés. Daniel fires **bullet2/stop2, hitSlot7**, the engine person **Manu García, shirt19, overall74, CDM/CM/LB**. Nik is safe. The club database also contains a different **Manu García, shirt26, overall67, CAM**.

**Steps:** open the season roulette and finish it; alternatively let the 3D scene fail to load, an ordinary supported recovery path. Read the mandatory release panel. Local Chromium reproduced the latter path using the actual step, engine and data, with external requests blocked.

**Expected versus actual board:** the board itself is correct and unchanged: `RRR.board('Alavés')`, including Manu García/#19 at LDM7; #26 is still a distinct eligible club player. Expected instruction: **“Release Manu García · #19 · 74 · CDM/CM/LB”**, preserving enough identity to distinguish him in FIFA. Actual heading **“Release Manu García”**, outcome **“Daniel lost Manu García.”**, note **“Release Manu García in your FIFA 17 save now…”**. Neither the panel nor its confirmation identifies the shirt, rating or position. On the scene-failure path there is no visible board from which to infer the intended person. The app can accept “I'VE RELEASED HIM” after the manager releases #26 instead, while its next board excludes #19 and can later use #26.

**Root cause:** the engine correctly repaired the original name-only identity, but the manual action boundary formats only `turn.player.name`. **Smallest fix:** format the authoritative player's shirt number and useful position/overall alongside the name in all release instructions; preserve the shirt in the scene payload/results for club homonyms. No RNG or board-rule change is needed. **Severity limit:** this is a reproduced ambiguous instruction, not evidence that the engine selected the wrong row or that a real manager already released the wrong person; therefore P1, not P0.

Independent natural follow-up: with no signings and ID `'pair_a'+'5d79'.padStart(63,'0')`, Alavés' S10 board has **both** Manu García/#19 at LDM7 and #26 at CAM9. Daniel's shots in S2/3/4/6/7/9 are respectively Krstičić, Kiko Femenía, Torres, Camarasa, Deyverson and Marcos Llorente; S1/5/8/10 are safe. This was an unforced seeded replay and confirms that the two source people are a reachable distinction, not a fabricated duplicate.

### R87-C2-02 — P2: the non-coordinator cannot see that his own spin mark failed

**File:line:** `js/productionSharedTransferChallenge.js:391–398,503,534–538`.

**Exact inputs:** id `'pair_'+'a'.repeat(64)`; Daniel/playerOne coordinates, SC Freiburg; Nik/playerTwo, Hertha BSC; confirmed `2026-10-31T00:00:00Z`; S1, no signings/history. SPs J. Añor/Williams. Both turns are safe: Daniel bullet0/stop4/aim11, Nik bullet4/stop1/aim5. Both managers have completed their local result confirmation. Server pre-window document at `rivalries/{id}/transferChallenges/season_1` contains only `{spins:{playerOne:true}}`. Nik's `markSpun` returns `permission-denied`, as when the app update arrives before Rules supporting marks. This is a normal rollout/network authority failure, not a modified-client request.

**Repro:** reuse `phone()` from `tests/contracts/r87-wait-both-spins-contracts.cjs:155–181` with `{role:'playerTwo', confirmedAtMs:Step.fromMs+86400000, store:{spins:['playerOne'],state:null,refuseMarks:true}}`. This runs the real production UI in its fake page/provider, with the roulette already locally done. The existing refusal test covers only the coordinator. Allow marks again, tick three times, then construct a reloaded phone using the same store.

**Expected versus actual board:** neither board changes; both remain their launch boards, and START must stay shut until both marks exist. Expected Nik status: **“YOUR SPIN WAS NOT SAVED · RELOAD TO RETRY”**, or a retry action; Daniel must keep waiting. Actual Nik status: **“READY · WAITING FOR DANIEL TO START”**, with START hidden. `spinsMissing()` is `['playerTwo']`, and exactly one attempted Nik mark is recorded. After permission is restored, three ticks still produce no retry and the same misleading label. Reloading Nik writes his own mark successfully; the store then has both roles.

**Root cause:** permission failure deliberately clears pending and records `spinRefusedKey`, suppressing automatic retries. Its recovery message is rendered only inside `role===coordinatorRole`; the non-coordinator always gets the generic waiting-for-coordinator text. **Smallest fix:** show own saving/refusal state in the shared status area for either manager, before the coordinator-only START control, with the existing reload/retry instruction. Do not bypass the marks or claim a reload can fix Rules that are still undeployed. **Severity limit:** P2 for the hidden failure/wrong waiting label; persistent obsolete Rules are a deployment dependency, not a new claim of broken current Rules.

### R87-C2-03 — P2: an optional Google font failure aborts the whole scene

**File:line:** `visual-assets/v10_1/roulette/index.html:8–12,139–143`; `js/rosterRouletteStep.js:155–158,173,187`.

**Exact inputs:** original `safe` ID `pair_a9b24c458404d9c2f3b8a8937ba550a8e50867c1b522a009b99b2fdfbb1f66a5`; Arsenal/Liverpool; confirmed `2026-10-31T12:00:00Z`; S1, empty history, no signings. SPs David Silva/A. Januzaj; neither changes these clubs' launch boards. Daniel bullet1/stop4/aim9, Nik bullet2/stop0/aim6, both safe. All app/scene requests resolve locally. Fail the stylesheet request to `fonts.googleapis.com` (ordinary offline, DNS/filter failure, or unavailable font host).

**Expected versus actual board:** both boards/results remain the correct launch boards and safe turns. Expected: use fallback title/stamp fonts and play the bundled scene, as the page's own comment at lines 8–11 promises. Actual local browser result: the frame sends **`{type:'cms-rr-error',message:'Error: error'}`**, the parent removes the entire stage and shows **“Your squad is safe”**. The same blocked-font path with C2-01's Alavés ID correctly shows its release panel. In both cases BACK returns false, routes to Showdown Home and leaves done unset.

**Root cause:** the capture-phase `window` error listener treats **every resource load error** as fatal, including this optional stylesheet. The font file is not a required engine/scene dependency. **Smallest fix:** ignore load errors for optional external font stylesheets (or bundle these remaining fonts); keep required JS/setup/WebGL failures on the existing result fallback path. This concerns losing the entire animation, not the already accepted appearance of accented names in a fallback font. No wrong shot or permanently stuck flow was reproduced.

### R87-C2-04 — P1: successful history retry leaves an inert card above the scene

**File:line:** `js/rosterRouletteStep.js:113–123,169–190`; `css/v10Roulette.css:4–7`. Known pending fix: **#1105 / F2-03**, not merged at the audited head.

**Exact inputs:** original `safe` ID, Arsenal/Liverpool, confirmed `2026-10-31T12:00:00Z`, season **2**, SPs David Silva/A. Januzaj, season-1 verdicts `{playerOne:[],playerTwo:[]}`, no signings. Both S1 spins are safe, so both S2 boards are their unchanged launch boards. Both S2 turns are also safe: Daniel bullet3/stop4/aim1, Nik bullet4/stop6/aim12. `ctx.verdicts(1)` first returns `{ok:false,code:'unavailable'}`, then succeeds with those empty verdicts. This represents one temporary missing-history read failure; the current season has not been marked done or watched.

**Repro:** tap TRY AGAIN on “Building the boards”; allow the recovered scene to send its ordinary ready/armed messages. An isolated fake-DOM/frame harness ran the real step and engine, with no game-file changes. After two history calls the stage was `visibility:'visible'`, setup had been posted, and the **same old “Building the boards” panel** was still mounted. Pressing its old BACK button did not resolve the active step.

**Expected versus actual board:** the computed S2 boards and turns are correct and unchanged; expected the history-retry card to disappear before the scene became interactive. Actual: the opaque retry overlay is z-index **96**, above the stage's **95**, intercepting its spin controls. Its TRY AGAIN/BACK handlers resolve an already settled choice promise and cannot leave the active scene wait. A reload is needed. Supplying a simulated scene-continue message lets the result card replace the stale panel, confirming where the real flow is blocked; a normal user cannot get there through the covered CTA.

**Root cause:** `rrsHistory` leaves its choice panel mounted after a successful retry; `rrsScene` creates the stage without removing that panel. **Smallest fix:** remove the stale panel when the scene starts, under the loading screen. Preserve the actual result/confirmation panel afterward. This is a normal transient-connection recovery defect, not an invalid engine plan.

### R87-C2-05 — P1: a failed transfer-page navigation leaves the completed result panel mounted

**File:line:** `js/productionSharedTransferChallenge.js:508–510`; `js/rosterRouletteStep.js:224–227,240–252`. Known pending fix: **#1105 / F2-01**.

**Exact inputs:** same id/clubs/SPs/S1 safe spins as C2-02; no signings/history. Both server marks already exist. The manager finishes the roulette result and taps GO TO THE TRANSFER WINDOW. `navigateTo('transferChallenge')` rejects because the next screen's runtime/asset could not load, a supported ordinary connection failure.

**Repro:** the production-module VM harness, with a completed step retaining its panel until `close()`, threw “Transfer page asset could not load” from the navigation boundary. It recorded **one completed step, zero `close()` calls, panel still mounted**, no mark write and no START call. The actual step deliberately keeps its result panel up until its caller closes it.

**Expected versus actual board:** both launch boards/results stay correct; expected the navigation failure to clean up the completed roulette UI and leave an actionable dashboard/retry route. Actual: `pstcOpenNow` exits through rejection before `pstcCloseRoulette()`. The now-inert result card can remain over the error/dashboard; its choice promise has already resolved and the step has already marked done. This is not a second RNG spin or a lost board.

**Root cause:** cleanup follows the awaited navigation only on success. **Smallest fix:** put that navigation boundary in `try/finally` and close the completed roulette in `finally`, preserving the navigation error for the caller's recovery UI. The repro instruments module boundaries; actual asset-failure rendering on physical phones remains unknown.

### R87-C2-06 — P1: locally completed roulette bypasses draw loading, disabling own-SP signing refusal

**File:line:** `js/productionSharedTransferChallenge.js:264–271,432–436`; `js/rosterRouletteStep.js:209–211,255–257`; `js/productionSharedCareerStart.js:31–33`. Known pending fix: **#1105 / F2-06**. This is the remaining path in SP-02.

**Exact inputs:** id `'pair_'+'a'.repeat(64)`, Daniel/playerOne SC Freiburg, Nik Hertha BSC, confirmed `2026-10-31T00:00:00Z`, S1. SPs are Daniel **J. Añor76/RM**, Nik Williams; both spins safe as in C2-02, and the roulette DONE marker is already stored from before a reload. Resume in `SIGNING_ENTRY`, revision5, guesses locked for both, no signings locked. The optional Career Start chip/draw load failed in this new runtime, leaving `CareerModeMarqueePlayer` absent; other transfer dependencies and provider access recover. Enter signing1 **J. Añor**, overall76, RM, prior league `spain-primera-division`, nationality `venezuela`; leave signing2/3 blank, confirm the partial lock. No initials/spelling variation is involved.

**Expected versus actual board:** boards remain the correct launch boards and the free SP remains outside them. Expected a loaded-draw refusal (“Signing 1 is your Special Player…”) before any provider signing lock. Actual: `decide(ctx)` is false due to local DONE, so `runBeforeTransfers`/`rrsEnsure` never load the draw. `isOwnSpecial(...)` returns false. A production-form VM repro, after advancing its ordinary read-only replay, captured an outgoing `lockSignings` payload containing its own **J. Añor76/RM**. The harness deliberately refused the provider mutation after recording it; no remote write was made. The reproduced failure is client validation, not an assertion that a real SP has already been released.

**Root cause:** the refusal depends on an optional previously loaded global; the done/resume path skips the only required roulette draw load, and the guard fails open. Career Start's optional ensure does not guarantee success on a later transfer open. **Smallest fix:** ensure the small draw/list dependency before checking `decide()`, including locally done/reload flows; if this required validation dependency fails, show a retry/recovery reason instead of allowing signing lock. Do not change the SP draw or store another board. With a loaded draw the original SP-02 test remains fixed.

## C. Both-spins wait: attack matrix

The real provider contracts and a local emulator with **generated current Rules** were both run. The emulator configuration used `demo-r87-c2`; no production Firestore was read or written.

| Scenario | Result |
|---|---|
| Eligible season, zero marks; START called without caller opt-in | Provider refuses `TRANSFER_ROULETTE_PENDING`; no window created. |
| One mark, either role; attempt START/expire the not-yet-opened window | One mark is insufficient. No timer starts; expire reports not started. Rules RM3 independently denies START with one mark. |
| Both marks | START opens normally and replaces the pre-window document with the existing exact-key ledger. RM5 proves this under Rules, not merely a fake provider. |
| Reload after marking / old local “done” before #1101 | Stored mark survives; locally done roulette calls `pstcAfterSpin` and writes a missing own mark. Normal successful refresh/ticks do not repeatedly write it. Retry of a lost answer is idempotent. |
| Partner not yet finished his own roulette | Tick/refresh do not borrow the partner's mark to mark the unspun role; B9. |
| Kill switch before either mark; old Showdown | No roulette/no marks required; opens as intended. Boundary tests compare provider and step cutoff without evaluating the release-time policy decision. |
| Missing confirm time | The existing B5 fixture has no confirm time on either side and passes. That is not proof of a healthy failed-Setup-read path: the UI currently skips while a provider with a known eligible server timestamp can still demand marks. Open #1105/F2-05 proposes making missing time fail closed; this audit does not label that pending recovery path clean. |
| Kill switch after one mark / marked document subsequently ineligible | Existing mark keeps START waiting. The other phone reaches the step without animation and writes its own mark; both then allow START. |
| Partner's mark arrives while coordinator waits | Listener wakes the existing season view; START flips without an extra context reread. |
| Permission denied / old Rules | Fail closed. Coordinator shows reload instruction; **non-coordinator bug C2-02**. Current Rules accept normal own marks; actual production deployment state is **unknown**. |
| Mark wrong actor, remove a mark, delete document, mark after START | Current Rules deny these (RM2/RM4/RM5). These adversarial checks validate authority only; modified-client-only behavior is not filed as a finding. |
| Wrong season / duplicates | Provider builds `season_${seasonNumber}` at `js/sparkSharedTransferChallenge.js:212–214`; UI passes its captured request and rechecks context (`js/productionSharedTransferChallenge.js:490–500`). Existing marks avoid successful repeat writes. No normal-play wrong-season write or harmful duplicate reproduced. A delayed cross-season race on physical devices remains unknown. |

Rules must be published with or before the new client (`js/productionSharedTransferChallenge.js:487–489`). An unchanged pre-update phone cannot manufacture a new protocol mark; refreshing to the current client is the supported recovery. This is a rollout constraint, not proof of production rollout acceptance.

## D. Hand-walked ten-season boards

These are **actual current-engine boards**, independently reviewed against each transition's position, rating, bench and reserve branches. They are not labeled an independent full-rule oracle. There are **60 displayed Daniel boards**, three clubs × ten seasons × two variants. Nik is Liverpool in all runs and follows the Liverpool no-signing table. Each role's bullet fires every season, hitting slot `season-1` (S1→0, …, S10→9).

Reproduce without editing a game file: evaluate `js/rosterRoulette.js` in an isolated VM with its ordinary bundled `CareerModeFifa17Players` and `CareerModeRosterSquads`; replace only the VM source text `const next=rrStream(hex,season,role);` with `const values=[0,0,season-1];const next=()=>values.shift();`. This is a permitted draw-sequence exercise, not a shipped exploit or a claim that one natural ID makes twenty successive shots. ID `'pair_a'+'0'.repeat(63)`; SPs are its real Neymar/Cristiano Ronaldo draw (neither belongs to these three clubs). Every prior history window exists. No-signing runs use empty arrays for both roles. Signing runs put one row in Daniel's window k=1…9: `{slot:1,name:'Incoming '+k,overall:79+k,position:['CB','ST','RB','LB','CM','RW','LW','GK','CAM'][k-1],release:false}`. Nik's rows stay empty. Synthetic names stand for legal form inputs with these ratings/positions. Every row is the board **before** that season's shot.

All 60 boards have 15 filled, distinct people, one actual keeper in XI, permanent losses and identical replay. Each board/turn was also compared with a reconstruction **omitting all history at or after that season**: no later-window effect. In the unchanged no-signing path, initial histories omitted versus future empty histories give the same S1 board/turn.

Manual transition checks (S2…S10 in order):

- **Liverpool, no signings:** LW Origi comes straight from reserves because sub Sturridge does not fit LW; then ST Sturridge promotes, bench refills Lucas Leiva; LCB Sakho promotes/refill Klavan; RCB Lucas promotes/refill Alberto Moreno; RB Gomez comes directly from the database because no fitting sub; LCM Can promotes/refill Ings; CDM Stewart directly from database; LB Moreno promotes/refill Ilori; RCM Grujić directly from database. No Sakho-at-ST or Klavan-at-RB carry-forward survives.
- **Liverpool, signings:** CB80 Incoming1 is below the compatible starting CB82s and does not get stale first refusal in later windows; it finally reaches the bench after the S7 Henderson loss/rebalancing. ST81 Incoming2 takes the S2 vacancy; RB82 Incoming3 strictly upgrades Clyne81; LB83 Incoming4 strictly upgrades Milner81. Incoming5 CM84 upgrades and is immediately the S6 victim. S7 uses G. Wijnaldum to refill that loss while RW85 Incoming6 upgrades Mané79. LW86 Incoming7 upgrades Origi78. S8's LB loss promotes Moreno while GK87 Incoming8 upgrades Mignolet78. CAM88 Incoming9 fills the S9 midfield loss. Displaced players follow the bench comparison rather than always taking an empty bench place.
- **Sevilla, no signings:** Krohn-Dehli→LDM; Vitolo→LM; Carriço→CB; Vázquez→RDM; Mercado→LCB (Trémoulinas is not wrongly preferred while Mercado fits); Sirigu→GK. After Ben Yedder is lost, **no unused/unshot fitting ST/CF remains**, so S8 has LB Trémoulinas at RS. After Vietto is lost, S9 has Ganso at LS. S10 promotes Kranevitter into the lost CAM. The two striker stopgaps remain because no fitting player becomes available. See exhausted-line note below.
- **Sevilla, signings:** CB80 Incoming1 upgrades Pareja; ST81 Incoming2 upgrades Vietto; Carriço fills the shot CB while RB82 Incoming3 stays bench-only in the back-three shape. Vázquez fills the next midfield loss while LB83 Incoming4 stays bench. Pareja fills the next CB loss; CM84 Incoming5 takes weakest compatible Kiyotake79, with no CAM preference. Sirigu fills keeper loss while RW85 Incoming6 upgrades RM. LW86 Incoming7 upgrades LM, while Vietto refills Ben Yedder's striker slot. GK87 Incoming8 upgrades Sirigu; Kiyotake (CF secondary) fills the S8 lost striker. CAM88 Incoming9 replaces the now-lost Incoming5. Fitting signings stay in their lines.
- **Arsenal, no signings:** Coquelin→CAM (the agreed broad CM line); Ospina→GK; Walcott→LM; Elneny→RDM directly from database rather than Mertesacker; Mertesacker→LCB; Oxlade-Chamberlain→RM directly; Zelalem→LDM directly; Gabriel→RCB; Lucas Pérez→ST. Lucas Pérez81 and Welbeck80 both fit the last striker loss, so Pérez wins by overall even though Welbeck is the earlier sub slot.
- **Arsenal, signings:** Incoming1 CB80 waits in reserves while stronger fitting subs win earlier CB vacancies; Incoming2 ST81 takes the weakest bench place. RB82 and LB83 Incoming3/4 strictly upgrade Bellerín79/Monreal81. The shot RDM is filled by Elneny before Incoming5 CM84 strictly upgrades him in the next window; Coquelin81 remains because 74 is the weaker compatible incumbent. Incoming6 RW85 fills the RM vacancy, Incoming7 LW86 upgrades LM, and Elneny fills Xhaka's loss. Incoming1 finally fills the S8 shot RCB as the best fitting available reserve, while Incoming8 GK87 upgrades Ospina. Incoming9 CAM88 takes the weakest compatible **LDM Elneny74**, preserving Coquelin81 and Incoming5 CM84; Pérez fills the S9 striker loss. This is the opposite of the old CAM-preference failure.

**Exhausted-line interpretation:** the supplied rules require filled slots until the **whole** club pool runs out, and ask for the “best-fitting” bench/reserve. The implementation uses best available outfielder only after no fitting outfielder remains (`js/rosterRoulette.js:261–269`), and repairs the stopgap later. Accordingly Sevilla's unavoidable striker stopgaps are disclosed rather than misreported as the original C-02 defect, which ignored an available fitting player. If all outfield slots must remain positively compatible even when no fitting person exists, the desired alternative (formation change versus empty slot versus whole-board reassignment) is **unspecified**; neither a compatible striker nor a completely exhausted pool exists in those rows. No silent rule exception is being claimed to have been independently approved.

### Liverpool — 4-3-3 (2)

Slots 0–10: LW, ST, LCB, RCB, RB, LCM, CDM, LB, RCM, RW, GK. Slots 11–14: SUB.

**No signings**

| Season | XI in slot order | Subs in slot order | Fired slot / player |
|---|---|---|---|
| 1 | Coutinho; Roberto Firmino; D. Lovren; J. Matip; N. Clyne; G. Wijnaldum; J. Henderson; J. Milner; A. Lallana; S. Mané; S. Mignolet | D. Sturridge; L. Karius; M. Sakho; E. Can | 0 / Coutinho |
| 2 | D. Origi; Roberto Firmino; D. Lovren; J. Matip; N. Clyne; G. Wijnaldum; J. Henderson; J. Milner; A. Lallana; S. Mané; S. Mignolet | D. Sturridge; L. Karius; M. Sakho; E. Can | 1 / Roberto Firmino |
| 3 | D. Origi; D. Sturridge; D. Lovren; J. Matip; N. Clyne; G. Wijnaldum; J. Henderson; J. Milner; A. Lallana; S. Mané; S. Mignolet | Lucas Leiva; L. Karius; M. Sakho; E. Can | 2 / D. Lovren |
| 4 | D. Origi; D. Sturridge; M. Sakho; J. Matip; N. Clyne; G. Wijnaldum; J. Henderson; J. Milner; A. Lallana; S. Mané; S. Mignolet | Lucas Leiva; L. Karius; R. Klavan; E. Can | 3 / J. Matip |
| 5 | D. Origi; D. Sturridge; M. Sakho; Lucas Leiva; N. Clyne; G. Wijnaldum; J. Henderson; J. Milner; A. Lallana; S. Mané; S. Mignolet | Alberto Moreno; L. Karius; R. Klavan; E. Can | 4 / N. Clyne |
| 6 | D. Origi; D. Sturridge; M. Sakho; Lucas Leiva; J. Gomez; G. Wijnaldum; J. Henderson; J. Milner; A. Lallana; S. Mané; S. Mignolet | Alberto Moreno; L. Karius; R. Klavan; E. Can | 5 / G. Wijnaldum |
| 7 | D. Origi; D. Sturridge; M. Sakho; Lucas Leiva; J. Gomez; E. Can; J. Henderson; J. Milner; A. Lallana; S. Mané; S. Mignolet | Alberto Moreno; L. Karius; R. Klavan; D. Ings | 6 / J. Henderson |
| 8 | D. Origi; D. Sturridge; M. Sakho; Lucas Leiva; J. Gomez; E. Can; K. Stewart; J. Milner; A. Lallana; S. Mané; S. Mignolet | Alberto Moreno; L. Karius; R. Klavan; D. Ings | 7 / J. Milner |
| 9 | D. Origi; D. Sturridge; M. Sakho; Lucas Leiva; J. Gomez; E. Can; K. Stewart; Alberto Moreno; A. Lallana; S. Mané; S. Mignolet | Ilori; L. Karius; R. Klavan; D. Ings | 8 / A. Lallana |
| 10 | D. Origi; D. Sturridge; M. Sakho; Lucas Leiva; J. Gomez; E. Can; K. Stewart; Alberto Moreno; M. Grujić; S. Mané; S. Mignolet | Ilori; L. Karius; R. Klavan; D. Ings | 9 / S. Mané |

**Kept signings**

| Season | XI in slot order | Subs in slot order | Fired slot / player |
|---|---|---|---|
| 1 | Coutinho; Roberto Firmino; D. Lovren; J. Matip; N. Clyne; G. Wijnaldum; J. Henderson; J. Milner; A. Lallana; S. Mané; S. Mignolet | D. Sturridge; L. Karius; M. Sakho; E. Can | 0 / Coutinho |
| 2 | D. Origi; Roberto Firmino; D. Lovren; J. Matip; N. Clyne; G. Wijnaldum; J. Henderson; J. Milner; A. Lallana; S. Mané; S. Mignolet | D. Sturridge; L. Karius; M. Sakho; E. Can | 1 / Roberto Firmino |
| 3 | D. Origi; Incoming 2; D. Lovren; J. Matip; N. Clyne; G. Wijnaldum; J. Henderson; J. Milner; A. Lallana; S. Mané; S. Mignolet | D. Sturridge; L. Karius; M. Sakho; E. Can | 2 / D. Lovren |
| 4 | D. Origi; Incoming 2; M. Sakho; J. Matip; Incoming 3; G. Wijnaldum; J. Henderson; J. Milner; A. Lallana; S. Mané; S. Mignolet | D. Sturridge; L. Karius; Lucas Leiva; N. Clyne | 3 / J. Matip |
| 5 | D. Origi; Incoming 2; M. Sakho; Lucas Leiva; Incoming 3; G. Wijnaldum; J. Henderson; Incoming 4; A. Lallana; S. Mané; S. Mignolet | D. Sturridge; L. Karius; J. Milner; N. Clyne | 4 / Incoming 3 |
| 6 | D. Origi; Incoming 2; M. Sakho; Lucas Leiva; N. Clyne; Incoming 5; J. Henderson; Incoming 4; A. Lallana; S. Mané; S. Mignolet | D. Sturridge; L. Karius; J. Milner; G. Wijnaldum | 5 / Incoming 5 |
| 7 | D. Origi; Incoming 2; M. Sakho; Lucas Leiva; N. Clyne; G. Wijnaldum; J. Henderson; Incoming 4; A. Lallana; Incoming 6; S. Mignolet | D. Sturridge; L. Karius; J. Milner; E. Can | 6 / J. Henderson |
| 8 | Incoming 7; Incoming 2; M. Sakho; Lucas Leiva; N. Clyne; G. Wijnaldum; J. Milner; Incoming 4; A. Lallana; Incoming 6; S. Mignolet | D. Sturridge; L. Karius; Incoming 1; E. Can | 7 / Incoming 4 |
| 9 | Incoming 7; Incoming 2; M. Sakho; Lucas Leiva; N. Clyne; G. Wijnaldum; J. Milner; Alberto Moreno; A. Lallana; Incoming 6; Incoming 8 | D. Sturridge; L. Karius; Incoming 1; E. Can | 8 / A. Lallana |
| 10 | Incoming 7; Incoming 2; M. Sakho; Lucas Leiva; N. Clyne; G. Wijnaldum; J. Milner; Alberto Moreno; Incoming 9; Incoming 6; Incoming 8 | D. Sturridge; L. Karius; Incoming 1; E. Can | 9 / Incoming 6 |

### Sevilla — 3-5-2

Slots 0–10: LDM, LM, CB, RDM, LCB, GK, RS, LS, CAM, RM, RCB. Slots 11–14: SUB.

**No signings**

| Season | XI in slot order | Subs in slot order | Fired slot / player |
|---|---|---|---|
| 1 | S. N'Zonzi; S. Nasri; A. Rami; Iborra; T. Kolodziejczak; Sergio Rico; W. Ben Yedder; L. Vietto; H. Kiyotake; Pablo Sarabia; N. Pareja | Vitolo; M. Krohn-Dehli; S. Sirigu; F. Vázquez | 0 / S. N'Zonzi |
| 2 | M. Krohn-Dehli; S. Nasri; A. Rami; Iborra; T. Kolodziejczak; Sergio Rico; W. Ben Yedder; L. Vietto; H. Kiyotake; Pablo Sarabia; N. Pareja | Vitolo; B. Trémoulinas; S. Sirigu; F. Vázquez | 1 / S. Nasri |
| 3 | M. Krohn-Dehli; Vitolo; A. Rami; Iborra; T. Kolodziejczak; Sergio Rico; W. Ben Yedder; L. Vietto; H. Kiyotake; Pablo Sarabia; N. Pareja | Daniel Carriço; B. Trémoulinas; S. Sirigu; F. Vázquez | 2 / A. Rami |
| 4 | M. Krohn-Dehli; Vitolo; Daniel Carriço; Iborra; T. Kolodziejczak; Sergio Rico; W. Ben Yedder; L. Vietto; H. Kiyotake; Pablo Sarabia; N. Pareja | Ganso; B. Trémoulinas; S. Sirigu; F. Vázquez | 3 / Iborra |
| 5 | M. Krohn-Dehli; Vitolo; Daniel Carriço; F. Vázquez; T. Kolodziejczak; Sergio Rico; W. Ben Yedder; L. Vietto; H. Kiyotake; Pablo Sarabia; N. Pareja | Ganso; B. Trémoulinas; S. Sirigu; Mariano | 4 / T. Kolodziejczak |
| 6 | M. Krohn-Dehli; Vitolo; Daniel Carriço; F. Vázquez; G. Mercado; Sergio Rico; W. Ben Yedder; L. Vietto; H. Kiyotake; Pablo Sarabia; N. Pareja | Ganso; B. Trémoulinas; S. Sirigu; Mariano | 5 / Sergio Rico |
| 7 | M. Krohn-Dehli; Vitolo; Daniel Carriço; F. Vázquez; G. Mercado; S. Sirigu; W. Ben Yedder; L. Vietto; H. Kiyotake; Pablo Sarabia; N. Pareja | Ganso; B. Trémoulinas; M. Kranevitter; Mariano | 6 / W. Ben Yedder |
| 8 | M. Krohn-Dehli; Vitolo; Daniel Carriço; F. Vázquez; G. Mercado; S. Sirigu; B. Trémoulinas; L. Vietto; H. Kiyotake; Pablo Sarabia; N. Pareja | Ganso; Escudero; M. Kranevitter; Mariano | 7 / L. Vietto |
| 9 | M. Krohn-Dehli; Vitolo; Daniel Carriço; F. Vázquez; G. Mercado; S. Sirigu; B. Trémoulinas; Ganso; H. Kiyotake; Pablo Sarabia; N. Pareja | J. Correa; Escudero; M. Kranevitter; Mariano | 8 / H. Kiyotake |
| 10 | M. Krohn-Dehli; Vitolo; Daniel Carriço; F. Vázquez; G. Mercado; S. Sirigu; B. Trémoulinas; Ganso; M. Kranevitter; Pablo Sarabia; N. Pareja | J. Correa; Escudero; David Soria; Mariano | 9 / Pablo Sarabia |

**Kept signings**

| Season | XI in slot order | Subs in slot order | Fired slot / player |
|---|---|---|---|
| 1 | S. N'Zonzi; S. Nasri; A. Rami; Iborra; T. Kolodziejczak; Sergio Rico; W. Ben Yedder; L. Vietto; H. Kiyotake; Pablo Sarabia; N. Pareja | Vitolo; M. Krohn-Dehli; S. Sirigu; F. Vázquez | 0 / S. N'Zonzi |
| 2 | M. Krohn-Dehli; S. Nasri; A. Rami; Iborra; T. Kolodziejczak; Sergio Rico; W. Ben Yedder; L. Vietto; H. Kiyotake; Pablo Sarabia; Incoming 1 | Vitolo; B. Trémoulinas; S. Sirigu; F. Vázquez | 1 / S. Nasri |
| 3 | M. Krohn-Dehli; Vitolo; A. Rami; Iborra; T. Kolodziejczak; Sergio Rico; W. Ben Yedder; Incoming 2; H. Kiyotake; Pablo Sarabia; Incoming 1 | Daniel Carriço; B. Trémoulinas; S. Sirigu; F. Vázquez | 2 / A. Rami |
| 4 | M. Krohn-Dehli; Vitolo; Daniel Carriço; Iborra; T. Kolodziejczak; Sergio Rico; W. Ben Yedder; Incoming 2; H. Kiyotake; Pablo Sarabia; Incoming 1 | Incoming 3; B. Trémoulinas; S. Sirigu; F. Vázquez | 3 / Iborra |
| 5 | M. Krohn-Dehli; Vitolo; Daniel Carriço; F. Vázquez; T. Kolodziejczak; Sergio Rico; W. Ben Yedder; Incoming 2; H. Kiyotake; Pablo Sarabia; Incoming 1 | Incoming 3; Incoming 4; S. Sirigu; B. Trémoulinas | 4 / T. Kolodziejczak |
| 6 | M. Krohn-Dehli; Vitolo; Daniel Carriço; F. Vázquez; N. Pareja; Sergio Rico; W. Ben Yedder; Incoming 2; Incoming 5; Pablo Sarabia; Incoming 1 | Incoming 3; Incoming 4; S. Sirigu; B. Trémoulinas | 5 / Sergio Rico |
| 7 | M. Krohn-Dehli; Vitolo; Daniel Carriço; F. Vázquez; N. Pareja; S. Sirigu; W. Ben Yedder; Incoming 2; Incoming 5; Incoming 6; Incoming 1 | Incoming 3; Incoming 4; Ganso; B. Trémoulinas | 6 / W. Ben Yedder |
| 8 | M. Krohn-Dehli; Incoming 7; Daniel Carriço; F. Vázquez; N. Pareja; S. Sirigu; L. Vietto; Incoming 2; Incoming 5; Incoming 6; Incoming 1 | Incoming 3; Incoming 4; Vitolo; B. Trémoulinas | 7 / Incoming 2 |
| 9 | M. Krohn-Dehli; Incoming 7; Daniel Carriço; F. Vázquez; N. Pareja; Incoming 8; L. Vietto; H. Kiyotake; Incoming 5; Incoming 6; Incoming 1 | Incoming 3; Incoming 4; Vitolo; S. Sirigu | 8 / Incoming 5 |
| 10 | M. Krohn-Dehli; Incoming 7; Daniel Carriço; F. Vázquez; N. Pareja; Incoming 8; L. Vietto; H. Kiyotake; Incoming 9; Incoming 6; Incoming 1 | Incoming 3; Incoming 4; Vitolo; S. Sirigu | 9 / Incoming 6 |

### Arsenal — 4-2-3-1 (2)

Slots 0–10: CAM, GK, LM, RDM, LCB, RM, LDM, RCB, ST, LB, RB. Slots 11–14: SUB.

**No signings**

| Season | XI in slot order | Subs in slot order | Fired slot / player |
|---|---|---|---|
| 1 | M. Özil; P. Čech; A. Sánchez; Santi Cazorla; L. Koscielny; A. Ramsey; G. Xhaka; S. Mustafi; O. Giroud; Nacho Monreal; Héctor Bellerín | P. Mertesacker; F. Coquelin; T. Walcott; Lucas Pérez | 0 / M. Özil |
| 2 | F. Coquelin; P. Čech; A. Sánchez; Santi Cazorla; L. Koscielny; A. Ramsey; G. Xhaka; S. Mustafi; O. Giroud; Nacho Monreal; Héctor Bellerín | P. Mertesacker; M. Debuchy; T. Walcott; Lucas Pérez | 1 / P. Čech |
| 3 | F. Coquelin; D. Ospina; A. Sánchez; Santi Cazorla; L. Koscielny; A. Ramsey; G. Xhaka; S. Mustafi; O. Giroud; Nacho Monreal; Héctor Bellerín | P. Mertesacker; M. Debuchy; T. Walcott; Lucas Pérez | 2 / A. Sánchez |
| 4 | F. Coquelin; D. Ospina; T. Walcott; Santi Cazorla; L. Koscielny; A. Ramsey; G. Xhaka; S. Mustafi; O. Giroud; Nacho Monreal; Héctor Bellerín | P. Mertesacker; M. Debuchy; K. Gibbs; Lucas Pérez | 3 / Santi Cazorla |
| 5 | F. Coquelin; D. Ospina; T. Walcott; M. Elneny; L. Koscielny; A. Ramsey; G. Xhaka; S. Mustafi; O. Giroud; Nacho Monreal; Héctor Bellerín | P. Mertesacker; M. Debuchy; K. Gibbs; Lucas Pérez | 4 / L. Koscielny |
| 6 | F. Coquelin; D. Ospina; T. Walcott; M. Elneny; P. Mertesacker; A. Ramsey; G. Xhaka; S. Mustafi; O. Giroud; Nacho Monreal; Héctor Bellerín | D. Welbeck; M. Debuchy; K. Gibbs; Lucas Pérez | 5 / A. Ramsey |
| 7 | F. Coquelin; D. Ospina; T. Walcott; M. Elneny; P. Mertesacker; A. Oxlade-Chamberlain; G. Xhaka; S. Mustafi; O. Giroud; Nacho Monreal; Héctor Bellerín | D. Welbeck; M. Debuchy; K. Gibbs; Lucas Pérez | 6 / G. Xhaka |
| 8 | F. Coquelin; D. Ospina; T. Walcott; M. Elneny; P. Mertesacker; A. Oxlade-Chamberlain; G. Zelalem; S. Mustafi; O. Giroud; Nacho Monreal; Héctor Bellerín | D. Welbeck; M. Debuchy; K. Gibbs; Lucas Pérez | 7 / S. Mustafi |
| 9 | F. Coquelin; D. Ospina; T. Walcott; M. Elneny; P. Mertesacker; A. Oxlade-Chamberlain; G. Zelalem; Gabriel; O. Giroud; Nacho Monreal; Héctor Bellerín | D. Welbeck; M. Debuchy; K. Gibbs; Lucas Pérez | 8 / O. Giroud |
| 10 | F. Coquelin; D. Ospina; T. Walcott; M. Elneny; P. Mertesacker; A. Oxlade-Chamberlain; G. Zelalem; Gabriel; Lucas Pérez; Nacho Monreal; Héctor Bellerín | D. Welbeck; M. Debuchy; K. Gibbs; C. Jenkinson | 9 / Nacho Monreal |

**Kept signings**

| Season | XI in slot order | Subs in slot order | Fired slot / player |
|---|---|---|---|
| 1 | M. Özil; P. Čech; A. Sánchez; Santi Cazorla; L. Koscielny; A. Ramsey; G. Xhaka; S. Mustafi; O. Giroud; Nacho Monreal; Héctor Bellerín | P. Mertesacker; F. Coquelin; T. Walcott; Lucas Pérez | 0 / M. Özil |
| 2 | F. Coquelin; P. Čech; A. Sánchez; Santi Cazorla; L. Koscielny; A. Ramsey; G. Xhaka; S. Mustafi; O. Giroud; Nacho Monreal; Héctor Bellerín | P. Mertesacker; M. Debuchy; T. Walcott; Lucas Pérez | 1 / P. Čech |
| 3 | F. Coquelin; D. Ospina; A. Sánchez; Santi Cazorla; L. Koscielny; A. Ramsey; G. Xhaka; S. Mustafi; O. Giroud; Nacho Monreal; Héctor Bellerín | P. Mertesacker; Incoming 2; T. Walcott; Lucas Pérez | 2 / A. Sánchez |
| 4 | F. Coquelin; D. Ospina; T. Walcott; Santi Cazorla; L. Koscielny; A. Ramsey; G. Xhaka; S. Mustafi; O. Giroud; Nacho Monreal; Incoming 3 | P. Mertesacker; Incoming 2; M. Debuchy; Lucas Pérez | 3 / Santi Cazorla |
| 5 | F. Coquelin; D. Ospina; T. Walcott; M. Elneny; L. Koscielny; A. Ramsey; G. Xhaka; S. Mustafi; O. Giroud; Incoming 4; Incoming 3 | P. Mertesacker; Incoming 2; Nacho Monreal; Lucas Pérez | 4 / L. Koscielny |
| 6 | F. Coquelin; D. Ospina; T. Walcott; Incoming 5; P. Mertesacker; A. Ramsey; G. Xhaka; S. Mustafi; O. Giroud; Incoming 4; Incoming 3 | M. Debuchy; Incoming 2; Nacho Monreal; Lucas Pérez | 5 / A. Ramsey |
| 7 | F. Coquelin; D. Ospina; T. Walcott; Incoming 5; P. Mertesacker; Incoming 6; G. Xhaka; S. Mustafi; O. Giroud; Incoming 4; Incoming 3 | M. Debuchy; Incoming 2; Nacho Monreal; Lucas Pérez | 6 / G. Xhaka |
| 8 | F. Coquelin; D. Ospina; Incoming 7; Incoming 5; P. Mertesacker; Incoming 6; M. Elneny; S. Mustafi; O. Giroud; Incoming 4; Incoming 3 | T. Walcott; Incoming 2; Nacho Monreal; Lucas Pérez | 7 / S. Mustafi |
| 9 | F. Coquelin; Incoming 8; Incoming 7; Incoming 5; P. Mertesacker; Incoming 6; M. Elneny; Incoming 1; O. Giroud; Incoming 4; Incoming 3 | T. Walcott; Incoming 2; Nacho Monreal; Lucas Pérez | 8 / O. Giroud |
| 10 | F. Coquelin; Incoming 8; Incoming 7; Incoming 5; P. Mertesacker; Incoming 6; Incoming 9; Incoming 1; Lucas Pérez; Incoming 4; Incoming 3 | T. Walcott; Incoming 2; Nacho Monreal; M. Debuchy | 9 / Incoming 4 |

## E. Checked and clean, with the evidence boundaries

Executed from the pinned repository root:

```sh
node tests/contracts/r87-roster-roulette-contracts.cjs
node tests/contracts/r87-roulette-board-invariants-contracts.cjs
node tests/contracts/r87-wait-both-spins-contracts.cjs
node tests/contracts/r86-marquee-player-contracts.cjs
node tests/contracts/r86-special-player-reveal-contracts.cjs
node tests/contracts/r86-sp-chip-contracts.cjs
```

Results: **27 roulette groups**, **9 board-invariant checks**, both-spins suite **PASS**, **7 SP draw checks**, **12 reveal checks**, **10 chip groups**. The board-invariant run covered 60 seeded careers/600 seasons, 5,113 guessed checks and 819 shot checks, property seed `20261031`. It compares future-history prefixes, the two role inputs, replay and the real evaluator→verdict filter→local JSON→board chain. The roulette suite additionally exercises all 98 clubs, forced firing, exhaustion, 269 catalog SP matches, and the named round 1 fixtures. Passing these tests is bounded evidence, not a guarantee about every possible signing sequence.

The local Firestore proof used dependencies installed **outside the repo** and this sequence (with that dependency directory on `NODE_PATH`):

```sh
node scripts/build-production-firestore-rules-with-persistent-pair.mjs
firebase emulators:exec --only firestore --project demo-r87-c2 --config firebase.json \
  'node tests/firebase/shared-transfer-challenge-fresh-session-emulator.cjs'
```

**PASS:** fourteen JOB-1051/1052 Rules checks, five roulette mark checks RM1–RM5, and the fresh-session/expiry migration proof. The generated Rules are an ignored local test artifact, not a proposed change. The important independent result is RM3/RM5: current Rules themselves deny a one-mark START and allow a two-mark START. A real transaction's mark is not being equated with a fake-provider success.

Additional checks:

- **Data/source:** downloaded only the public `players_17.csv` from `raw.githubusercontent.com/ifrankandrade/data-visualization/main/datasets/players_17.csv`. SHA256 **`f2d35920e5cddb28d750924281c4e4095fdc485a5d8358497cd579b1b7b5e03a`** equals bundled `sourceSha256`. All **17,597** CSV rows were parsed. All **2,975** bundled player rows equal their exact catalog-aliased club's CSV rows **in order**, including name, overall, preferred positions, team position, shirt and nationality. All 98 formation XIs, four top non-starters and three reserves agree with their selection rules. A separate name+shirt reserve calculation found **zero** launch reserve mismatches. `scripts/build-fifa17-rosters.py:129–138` still uses a name set for initial reserve selection, but no present club's first-three reserve result differs; a hypothetical future data-refresh homonym ordering was not promoted to a current normal-play finding.
- **SP source/list/reveal:** all **305** draw rows match the source overall, potential, club, shirt, nationality, position and six card stats. The top-300 potential/overall cutoff is **85/75**, including the full tie. The reveal page's `MP_LIST` (`visual-assets/v10_1/special-player/index.html:1202`) equals all 305 full tuples and their order, not just their names. Distinct draw indices, competition-rank tiers, source alias, eligibility and no-network deterministic draw pass. No list mutation/reordering proposed.
- **Identity and entry order:** tested folded accents/case/trim, the two Manu García shirts, Empoli/Sporting Matheus Pereira, repeated signings, unknown position, rejected own SP with the draw loaded, and reversed equal-overall UI entry slots. C2-06 separately reproduces the missing-draw guard failure. The current c|name#shirt versus s|name distinction was respected; namesakes were not treated as one person just to manufacture an exclusion failure. No new same-input board or shot divergence found.
- **Board history:** exact reruns plus the 60 all-fired boards use only windows before the board's season. Later kept/guessed verdicts do not retroactively alter launch boards, an already shown shot, or the other manager's board. Missing history is requested per prior season; local cached completed verdicts avoid rereads (`js/productionSharedTransferChallenge.js:445–462`). The board engine has no Firebase API or board-document access. “One missing-season read” here means one `provider.read` call; that provider transaction reads its authoritative context documents, not one physical billed document in total.
- **Scene contract:** engine board slots survive the scene's Y-sorted bubble order; hitSlot/aimSlot take priority over a name fallback (`visual-assets/v10_1/roulette/index.html:699,707–708,782–789`). The actual extracted `rrPlanTurn` passed forty exact plan checks. All 98 scene launch tuples are synchronized. No unique-name victim mismatch was reproduced. Shirt identity is nevertheless lost at the release boundary (C2-01).
- **Scene failure / BACK:** a local Chromium host loaded the **actual** step, engine and data with localhost-only routing. Safe and fired scenarios showed the correct result panels after the optional font error. BACK returned false, navigated to `mainMenu`, and left roulette done unset. This is a real DOM recovery check, not a rendered two-phone 3D acceptance claim.
- **Reload/flow source review:** watched and done are separate; an interrupted animation deterministically replays, watched-before-confirmation reload shows the result again, and done-before-server-mark reload writes the missing mark. Both roles' spins are presented in Daniel/Nik order; the mandatory release instruction uses the engine plan, never an untrusted scene-reported victim. Scene-ready/armed failures keep the release panel; explicit BACK does not start Transfers. Existing tests cover engine/data loading retry and blocked history as well.
- **Rule Book:** `js/ruleBook.js:59–63,206–213` agrees on the free extra SP, no guess release of own SP, equal filled-slot target chance, auto board, depleted-pool empty slots and SP training scope. “Your SP is never on your board” is less explicit than the engine's protection of both SPs on both boards, but does not authorize hitting the rival's SP. No contradictory scoring or training behavior was inferred from internal `marquee` identifiers.
- **Required documentation proof:** `node scripts/pos20-impact-router.mjs --files audit/r87/REDTEAM_R87_RR_SP_ROUND2.md --json` selects **POS20_DOC_ONLY**, zero product contract tests/operations, plus supplemental **V10_FLASH_BROWSER**. `npm run test:v10-flash` **PASS** locally on portrait 390×844, landscape 844×390 and desktop 1920×910, plus the club reduced-motion checks. A temporary Playwright preload blocked every non-localhost browser request; it is not committed. No SSJR/MDP or production acceptance credit follows.

## F. Ranked top five actions

1. **C2-04 / P1:** remove the stale retry panel before the recovered scene starts. Otherwise a normal failed history read can turn its successful retry into a dead end. The proposed #1105 repair needs merging/reverification.
2. **C2-06 / P1:** require the SP draw for the signing guard even after local roulette completion/reload. Restore the rule that a free own SP cannot occupy a normal Transfer War signing slot. #1105 proposes this fix too.
3. **C2-01 / P1:** carry shirt identity into the mandatory manual release panel, especially when the scene fails. It is the remaining direct ambiguity between two real club people.
4. **C2-05 / P1:** clean up completed roulette UI on failed navigation, preserving a usable error/retry route; #1105 proposes the necessary `finally` boundary.
5. **C2-02 / P2:** show own mark-saving/refusal state to the non-coordinator so both managers are not told to wait for each other without recovery instructions.

Next: C2-03's optional-font abort, then two-phone Rules/client rollout and rendered chamber/target/board evidence. Passing module/emulator checks does not close those physical verification debts.

## G. Unknown / limits and what makes this 10/10

- **Unknown:** production Rules version/deployment ordering, real accounts, service-worker upgrade state and physical two-phone Safari/WebGL behavior. No production Firebase endpoint was contacted to resolve these. The provider/emulator results apply to this repository head and local Rules only.
- **Unknown:** an uninterrupted rendered two-turn WebGL run in this container. A software-Chromium attempt with the external font stylesheet fulfilled locally did not reach a visible/ready stage within its 30-second browser wait and was recorded as an unsuccessful environment-limited attempt. The clean fallback runs and extracted scene-plan tests are the evidence actually obtained. No claim is made that chambers were visually observed on two phones.
- **Unknown:** failed-before-ready SP reveal recovery on physical devices, post-start WebGL loss, all career-chip clipping/sound/vibration/accessibility combinations, and delayed physical cross-season marking races. These were source/contract-reviewed where noted, not production-accepted.
- **Unknown policy detail:** how to keep an XI positively position-compatible when a club has players left but none fitting that line (Sevilla S8–S10 above). The current best-available stopgap preserves the mandatory full board and is not the old available-fit-ignored bug. The tables expose the actual behavior for a rule decision without assigning a false P0/P1.
- The per-missing-season cache path was inspected and exercised through contracts; physical billed-read totals for a cleared-cache ten-season rejoin are **unknown**. No board persistence is introduced.

To reach **10/10**: fix the six reproduced presentation/recovery/validation findings (including merging and verifying the relevant pending #1105 changes), retain the six repaired round 1 engine invariants and subsequent signing/namesake fixes, state the exhausted-line policy explicitly, and close the two-phone rollout/rendering evidence debt above. The present engine/data/Rules evidence supports an improvement from round 1's 5/10; it does not justify calling unobserved production behavior verified.
