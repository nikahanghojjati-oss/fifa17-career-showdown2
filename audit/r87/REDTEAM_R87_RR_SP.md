# Red team r87: Roulette + Special Player

Audited `gameplay/r87` at `d1a25535e2143995e76086d08d78159fed0b09e7` (2026-10-31 UTC), including PR #1085 (`263064ac`). Documentation only. Normal UI input and normal seeded draws are the threat model; no production Firebase was contacted. Paths/lines below refer to this exact head.

**Score: 5/10.** Full boards and deterministic engine replay work, but Special Player protection, compatible replacement, weakest-starter selection and order independence fail. Seven findings: one P0, five P1, one P2. A different signing-entry order changes a later release, but identical authoritative inputs still produce identical engine results; do not confuse those two claims.

PR #1091 was **open**, head `e3df001977fe623460de9b03b2f034d1aebae0b7`, when checked through GitHub. Per the task, its silent load/error bypass, exhaustion panel and offline asset fixes are treated as addressed and are not re-reported. This report does not claim that patch was already on the audited branch. The report should accompany that fix, not replace it.

## Reproduction conventions

Unless overridden: Daniel/playerOne owns the named club; Nik/playerTwo owns Liverpool; season 1 history is empty; later histories have `{playerOne:[],playerTwo:[]}` for each preceding season. SP is null for isolated squad tests (repeat with an unrelated SP gives the same squad result). Signing rows are `{slot,name,overall,position,release}`; release=false means kept. Synthetic signing names represent ordinary players with the stated rating/position, not modified-app commands. To reproduce an SP integration case, use `require('./js/marqueePlayer.js').forShowdown(id, Date.parse('2026-10-31T00:00:00Z'))` as `options.special`.

Board differences below are exact slot deltas from `require('./js/rosterRoulette.js').board(club)` unless a complete board is given in the walks. Slots 0–10 are XI, 11–14 subs. All untouched slots retain their stated baseline. Thus expected/actual deltas specify the whole board without repeating fifteen names for each finding.

Fixture IDs:

- `safe`: `pair_a9b24c458404d9c2f3b8a8937ba550a8e50867c1b522a009b99b2fdfbb1f66a5`
- `rb`: `pair_aa5da30f08fc95a1210a286f52fa2c33b594e44bcb7381802e9a699cd68bcd0e`
- `order`: `pair_a2621a78bf4fa1e0a09ea793d734478e32bc7178fe0b3971ff9563fad68d9c5c`
- `bellerin`: `pair_a000000000000085000000000000000000000000000000000000000000000000`
- `matheus`: `pair_a0000000000000d2000000000000000000000000000000000000000000000000`
- `ozil`: `pair_a000000000000012000000000000000000000000000000000000000000000000`

## Findings

### R87-C-01 — P0: the other manager's Special Player can be shot

**Evidence:** `js/rosterRoulette.js:192`–195, 223–228 excludes only `special[role]`; `:52`–59 targets every row with `special:false`; `:100` stamps every placed player false. `js/rosterRouletteStep.js:176`–183 builds the release instruction from that plan.

**Exact inputs:** id `pair_a0000000000000030000012d0000000000000000000000000000000000000045`; Daniel Barcelona, Nik Liverpool; confirmed 2026-10-31; season 1; no signings. Real SP draw: Daniel **L. Messi**, Nik **Neymar**. Daniel fires (bullet=6, stop=6), hitSlot=1, player=Neymar. No forced RNG required.

**Expected:** both SP identities absent from every XI/bench/reserve, and Daniel's fired turn hits an eligible ordinary player. **Actual Daniel board:** `[A. Turan, Neymar, L. Suárez, Iniesta, Sergio Busquets, I. Rakitić, Jordi Alba, Piqué, J. Mascherano, M. ter Stegen, Sergi Roberto | André Gomes, J. Cillessen, S. Umtiti, Paco Alcácer]`; the result tells Daniel to release Neymar. Own SP Messi is correctly absent, rival SP Neymar is present and targetable. Nik's SP chip still says Neymar. A compatible corrected board can retain the other thirteen slots, put André Gomes (LM secondary position, 84) at LW slot1 and Denis Suárez80 into sub11; neither SP is then eligible.

**Root cause:** protection is scoped to the board owner although the supplied rule says the SP is never on a board anywhere. **Smallest fix:** build a shared excluded set from **both** drawn identities before creating either board/reserve pool, then run compatible replacements. Preserve fifteen equally eligible targets. This is not an attack requiring a forged draw or player input.

### R87-C-02 — P1: zero-fit bench promotion puts a player in an incompatible XI slot

**Evidence:** `js/rosterRoulette.js:175`–189 allows any outfielder as a replacement; zero fit is ranked, not rejected. The database fallback tests only goalkeeper vs outfielder. Same path initializes an own-club SP replacement at `:226`–228.

**Exact inputs:** Arsenal, id `rb`, season 1 fires at slot 10/Héctor Bellerín (bullet=stop=4); no signings; season 2 requested with empty season-1 verdicts. **Expected:** RB must remain a compatible right-back; M. Debuchy (80, RB) is in the hidden reserves, so there is no genuine positional exhaustion. **Actual:** RB slot 10=P. Mertesacker (83, CB); sub slot 11=M. Debuchy (80, RB). The engine puts the fitting reserve on the bench while starting the incompatible defender. All other slots are launch values.

Second reproduction: Arsenal season 1, id `bellerin`, SP draw Daniel=Héctor Bellerín. No prior shots/signings. Exactly the same wrong RB/bench delta occurs immediately on launch. This also violates “skip him and the next player takes his place.”

**Root cause:** keeping fifteen names takes precedence over positive positional fit. **Smallest fix:** require positive fit when promoting a bench outfielder, then try a fitting reserve/database player directly; report positional exhaustion only when no compatible player remains. Never use an arbitrary outfielder as a successful fill. The detailed walks show this is systemic (Liverpool's Sakho at ST, Sevilla's Mariano at LS), not just a Bellerín edge case.

### R87-C-03 — P1: CAM preference replaces a stronger compatible starter

**Evidence:** `js/rosterRoulette.js:90`–98 assigns CAM a fit score of 2; `:153` compares that score before incumbent rating.

**Exact inputs:** Arsenal; id `safe`; season 1 does not fire (bullet=1, stop=4); season-1 kept row `{slot:1,name:"Playmaker",overall:90,position:"CAM",release:false}`; request season 2; no SP.

**Expected:** under the engine's own compatible midfield-line definition, the weakest compatible starter is G. Xhaka (84, LDM). Put Playmaker there, retain M. Özil (89, CAM), put Xhaka into weakest sub slot 12 (F. Coquelin 81), and reserve Coquelin. **Actual:** Playmaker replaces Özil at CAM slot 0; Özil replaces Coquelin at sub 12; Xhaka remains at LDM. All other launch slots unchanged.

**Root cause:** an undocumented positional preference overrides “weakest compatible starter, strictly better.” **Smallest fix:** use fit only to establish eligibility, then choose minimum incumbent overall. If exact CAM-only eligibility is wanted instead, that is a different rule and must be made explicit consistently; the present engine calls CM/CDM compatible and treats them as such elsewhere. Incumbents on equal overall correctly remain.

### R87-C-04 — P1: signing entry order changes a later released player

**Evidence:** `js/rosterRoulette.js:199`–203 sorts equal overalls by input slot; `:244` applies sequentially; `:153` picks the weakest current compatible slot. Target selection later uses the fixed board slot (`:59`–61).

**Exact inputs:** Arsenal, id `order`; no SP. Season 1 is safe. Keep First CM and Second CM, each overall=90, position=CM, release=false. Run A: First CM slot=1, Second CM slot=2; run B: Second CM slot=1, First CM slot=2. Only the normal signing-entry order changes. Request season 2.

**Expected:** one canonical board and release for the same kept player set regardless of entry order (the rules supply no specific identity tiebreak; the fix must define a stable one). **Actual A:** RDM slot 3=Second CM, LDM slot 6=First CM. **Actual B:** slot 3=First CM, slot 6=Second CM. Both have bench `[P. Mertesacker, G. Xhaka, Santi Cazorla, Lucas Pérez]`; all other XI slots are launch values. The real season-2 turn fires (bullet=stop=5) at slot 3: **Second CM is released in A, First CM in B**.

**Root cause:** user input slot is gameplay identity/order authority. **Smallest fix:** rank equal-rated signings using a stable player identity, independent of entry slots, before applying upgrades. Sort an identical row array in memory without changing row.slot and the current engine is stable; the failure is changing the UI entry slots, not arbitrary Firebase row-array order. Classified P1 for the order-independence rule; this is not evidence of identical-input phones disagreeing.

### R87-C-05 — P1: display-name identity merges distinct people and misses ordinary spelling aliases

**Evidence:** `js/rosterRoulette.js:41` (`rrKey` is trim/lowercase only), `:67`–80 (first name match supplies positions), `:102`–114 (database player drops source identity and deduplicates by name), `:145`, `:223`; `scripts/build-fifa17-rosters.py:127`–138 deduplicates reserve names. `data/fifa17Players.js:32` contains Alavés' two Manu García rows; the Empoli row is at `:75`; `data/marqueePlayers.js:230` contains Sporting CP's Matheus Pereira. Use exact name searches if line numbers shift.

**Exact inputs A:** Empoli vs Liverpool; id `matheus`; real Daniel SP=Matheus Pereira, Sporting CP, overall74, shirt73, LM. Empoli has a **different** Matheus Pereira, overall70, shirt31, CAM, in its launch hidden reserves. No signings. **Expected:** retain Empoli's player in reserves, since the drawn SP does not belong to Empoli. **Actual:** `:225` rejects Empoli's reserve just because the names match and backfills a different player. With the documented forced firing fixture targeting sub slot11 every season, season4's expected sub11 is Empoli Matheus Pereira70; actual is A. Pelagotti. Other board slots in that fixture stay launch values. Even before any bullet, the hidden three already differ incorrectly.

**Exact inputs B:** Alavés, no SP, no signings, any id, season1. The database contains Manu García74/CDM,CM,LB/#19 and Manu García67/CAM/#26. Once #19 is on the XI, #26 is unconditionally unavailable for any later database refill; after #19 is shot, exclusion still suppresses #26. These are separate players, not a duplicate row. A name-only position lookup for #26 also returns #19's defensive positions. This is direct finite-pool evidence; the exact earliest natural ten-season board where #26 is needed was not established and is **unknown**, not claimed as a reproduced natural release.

**Exact inputs C (ordinary text input):** Arsenal, id `ozil`, Daniel SP=M. Özil, season1 verdict kept `{slot:1,name:"Mesut Ozil",overall:89,position:"CAM",release:false}`. Season2 includes Mesut Ozil at CAM despite the actual same person's SP exclusion. The input form accepts that name spelling (`js/productionSharedTransferChallenge.js:251`); no modified client is needed. This is a robustness failure for an accidental SP entry, not an instruction to count the free SP among normal signings. Similarly, initials/accent variants defeat deduplication of the same signed person.

**Root cause:** one display string is both identity and matching key, so it is simultaneously too broad and too narrow. **Smallest fix:** retain source player IDs from the CSV through roster/SP data; resolve normal signing input to a selected player identity, with explicit disambiguation for genuine homonyms and aliases for common spelling variants. Preserve the original display name separately. Do not “fix” Manu García merely by stripping accents or excluding every homonym.

### R87-C-06 — P2: phones animate different chambers and safe-turn targets

**Evidence:** `js/rosterRouletteStep.js:162`–164 sends only `{fire,target}`, omitting engine bulletChamber/stopChamber/hitSlot and seed. `visual-assets/v10_1/roulette/index.html:150` starts a random local stream; `:751`–759 chooses local bulletAt and safe-stop chamber, and a random board target when the planned target is null.

**Exact inputs:** both phones open Arsenal vs Liverpool, id `safe`, season1, no signings/SP. Engine Daniel bullet=1, stop=4, safe. **Expected:** same seeded displayed chambers/aim on both phones, matching the engine plan. **Actual:** both show safe, but each page selects its own loaded chamber and a different non-bullet stop/aim from Math.random-seeded state. No changed app is required; ordinary independent page loads suffice. Board names/ratings match. For a reproducible isolated evaluation of the scene RNG, seed=1 gives first bullet1 and next safe chamber4; seed=3 gives bullet1 and next safe chamber5. The parent never passes a seed in normal embedding.

**Root cause:** the scene receives a verdict, not the complete spin plan. **Smallest fix:** pass the engine's chamber indices and target slot and consume them directly. A safe spin may choose a deterministic visual aim using the same Showdown seed. Treat this as a visible mismatch, not as a demonstrated release-outcome divergence: named fired targets and fire booleans are currently preserved for the unique-name boards tested. The scene's random fallback when a named target cannot be found is risky, but no normal unique-name board caused that fallback here.

### R87-C-07 — P1: the r87 cutoff admits pre-r87 Showdowns

**Evidence:** `js/rosterRouletteStep.js:20`–21 fixes the cutoff at 2026-10-30 00:00 UTC; `:50`–57 admits any unfinished season with a later confirmation. `js/marqueePlayer.js:16` uses the **later r86** release boundary, 03:00 UTC that day.

**Exact inputs:** existing r86 Showdown, id `rb`, Arsenal/Liverpool, confirmedAtMs=Date.parse('2026-10-30T04:00:00Z'), managerRole=playerOne, season=1, phase=NOT_STARTED, no local rouletteDone key. `require('./js/rosterRouletteStep.js').decide(ctx)` returns true. SP may be drawn normally; it does not affect the eligibility test. No signings. The board would use Arsenal launch rows, with any own-SP substitution, despite the Showdown predating r87.

**Expected:** old r86 Showdown gets no roulette board/spin/release instruction at all. **Actual:** eligible and forced into roulette; the `rb` fixture without an own-club SP releases Bellerín. **Root cause:** placeholder cutoff predates the previous feature's release. **Smallest fix:** pin the actual r87 release instant before shipping, and test just-before/at/after against preserved old Showdowns. This is a release integration requirement, not a claim that r87 has already shipped or that PR #1091 reintroduced the old load failure. Actual future release timestamp remains **unknown**.

## Ten-season hand walks (three formations, two variants each)

These are actual engine boards, traced against the replacement branches by hand; they are **not** claimed to be the correct-rule oracle. There are 60 boards: each of three clubs has one no-signing walk and one kept-signing walk. Every bullet fires for **both** roles. The table shows Daniel's board; Nik is the Liverpool control, uses the same forced slot schedule and no signings, and therefore follows the Liverpool no-signing table in every walk. Every row has 11+4 nonempty, distinct names and exactly one actual goalkeeper in XI. No previously shot exact name returns. Positional compatibility fails as annotated below.

To make the demanded all-fired path reproducible without hunting a roughly 7^-20 two-manager seed, the only test override is the same isolated-VM technique used by repository contract L11: replace `const next=rrStream(hex,season,role);` with `const values=[0,0,season-1];const next=()=>values.shift();`. The committed game files are untouched. Use id `pair_a000000000000000000000000000000000000000000000000000000000000000`, SP=null, and complete history arrays. This is an exercise of an allowed outcome sequence, not an exploitable test hook in the shipped app. Each row is the pre-shot board; its named shot leaves before the next row. Season10's shot has no season11 board because Showdowns stop at ten seasons.

Hand trace checkpoints / expected versus actual:

- Liverpool, no signings: S1 Coutinho is lost. S2 promotes ST-only Sturridge to LW despite no positive LW fit (C-02). S2 loses Firmino; S3 promotes CB Sakho to ST although Origi is an available ST reserve. Expected ST=Origi or another compatible ST, not Sakho. S3 loss Lovren promotes Lucas Leiva (CB secondary position) correctly; S4 loss Matip promotes Can (CB secondary) correctly. S5 loss Clyne produces Klavan at RB incorrectly; S6/7/8 losses likewise produce out-of-line replacements. S9 loss Lallana promotes compatible Stewart. Every bench refill follows reserve rating/shirt order; the error is who moves into XI.
- Liverpool with signings: Incoming1 CB80 is below the weakest CB82, so it stays in reserves; after S3 CB loss he fills CB in S4. Incoming2 ST81 fills the S2 striker loss despite being below Firmino82. Incoming3 RB82 upgrades Clyne81, whose displacement later makes a valid RB refill possible. Incoming4 LB83 upgrades Milner81. Incoming5 CM84 is lost immediately in S6. Incoming6 RW85 starts at RW. Incoming7 LW86 starts at LW. Incoming8 GK87 upgrades Mignolet78. Incoming9 CAM88 fills the S9 midfield loss. LW and late LB fallback still violate C-02.
- Sevilla, no signings: S1 N'Zonzi loss promotes compatible Krohn-Dehli; S2 Nasri loss promotes Vitolo; S3 Rami loss promotes Carriço; S4 Iborra loss promotes Vázquez (engine midfield line). S5 loss Kolodziejczak yields LB Trémoulinas at LCB despite available CBs in database; S6 keeper loss correctly promotes Sirigu. S7 and S8 striker losses yield Ganso and Mariano at RS/LS incorrectly. S9 loss Kiyotake promotes Correa, a compatible CAM. Expected compatible CB/forward fill or explicit exhaustion, never LB/RB in those striker/CB slots.
- Sevilla with signings: Incoming1 upgrades Pareja at RCB, Incoming2 upgrades Vietto at LS; after Rami is shot S4 incorrectly puts Vázquez at CB while Carriço is on the bench later in that same board. Incoming3 RB has no compatible XI slot and stays on bench. Incoming4 LB similarly stays bench until the CB loss then is incorrectly promoted into LCB. Incoming5 CM84 takes CAM Kiyotake79, the weakest compatible midfield incumbent (valid in this row). Incoming6 upgrades RM, Incoming7 upgrades LM, Incoming8 upgrades GK. S8's striker loss promotes RB Incoming3 even though ST Vietto is in reserves. S9 Incoming9 CAM88 fills the CAM loss.
- Arsenal, no signings: Coquelin fills the first CAM loss under the engine's broad midfield-line rule; Ospina correctly fills the keeper loss from the club database. Walcott correctly fills LM. Then Mertesacker at RDM, Lucas Pérez at LCB, Debuchy at RM and Gibbs at LDM are incompatible (C-02), despite compatible database candidates. Gabriel correctly replaces Mustafi at RCB, Welbeck correctly fills ST. Expected every incompatible slot to use a positive-fit candidate or report exhaustion.
- Arsenal with signings: Incoming1 CB80 stays reserved until a CB vacancy; Incoming2 ST81 stays bench behind Giroud83. Incoming3 RB82 and Incoming4 LB83 upgrade the correct sides. Incoming5 CM84 upgrades the now-weak CAM rather than a stronger midfield incumbent (valid weakest-line improvement in that particular row). Incoming6 RW85 fills a shot RM, Incoming7 LW86 upgrades LM, Incoming8 GK87 upgrades Ospina79, Incoming9 CAM88 prefers CAM and displaces Incoming5 rather than weaker compatible Coquelin (C-03). Mertesacker at RDM and Lucas Pérez at RCB remain incompatible carry-forwards, so these walks do not become clean just because kept players join.


### Liverpool — 4-3-3 (2)

Slots (fixed for both runs): 0=LW, 1=ST, 2=LCB, 3=RCB, 4=RB, 5=LCM, 6=CDM, 7=LB, 8=RCM, 9=RW, 10=GK, 11=SUB, 12=SUB, 13=SUB, 14=SUB.

**No signings**

| Season | XI in slot order (0–10) | Subs (11–14) | Shot slot / player |
|---|---|---|---|
| 1 | Coutinho; Roberto Firmino; D. Lovren; J. Matip; N. Clyne; G. Wijnaldum; J. Henderson; J. Milner; A. Lallana; S. Mané; S. Mignolet | D. Sturridge; L. Karius; M. Sakho; E. Can | 0 / Coutinho |
| 2 | D. Sturridge; Roberto Firmino; D. Lovren; J. Matip; N. Clyne; G. Wijnaldum; J. Henderson; J. Milner; A. Lallana; S. Mané; S. Mignolet | Lucas Leiva; L. Karius; M. Sakho; E. Can | 1 / Roberto Firmino |
| 3 | D. Sturridge; M. Sakho; D. Lovren; J. Matip; N. Clyne; G. Wijnaldum; J. Henderson; J. Milner; A. Lallana; S. Mané; S. Mignolet | Lucas Leiva; L. Karius; R. Klavan; E. Can | 2 / D. Lovren |
| 4 | D. Sturridge; M. Sakho; Lucas Leiva; J. Matip; N. Clyne; G. Wijnaldum; J. Henderson; J. Milner; A. Lallana; S. Mané; S. Mignolet | D. Origi; L. Karius; R. Klavan; E. Can | 3 / J. Matip |
| 5 | D. Sturridge; M. Sakho; Lucas Leiva; E. Can; N. Clyne; G. Wijnaldum; J. Henderson; J. Milner; A. Lallana; S. Mané; S. Mignolet | D. Origi; L. Karius; R. Klavan; Alberto Moreno | 4 / N. Clyne |
| 6 | D. Sturridge; M. Sakho; Lucas Leiva; E. Can; R. Klavan; G. Wijnaldum; J. Henderson; J. Milner; A. Lallana; S. Mané; S. Mignolet | D. Origi; L. Karius; D. Ings; Alberto Moreno | 5 / G. Wijnaldum |
| 7 | D. Sturridge; M. Sakho; Lucas Leiva; E. Can; R. Klavan; D. Origi; J. Henderson; J. Milner; A. Lallana; S. Mané; S. Mignolet | Ilori; L. Karius; D. Ings; Alberto Moreno | 6 / J. Henderson |
| 8 | D. Sturridge; M. Sakho; Lucas Leiva; E. Can; R. Klavan; D. Origi; Alberto Moreno; J. Milner; A. Lallana; S. Mané; S. Mignolet | Ilori; L. Karius; D. Ings; A. Manninger | 7 / J. Milner |
| 9 | D. Sturridge; M. Sakho; Lucas Leiva; E. Can; R. Klavan; D. Origi; Alberto Moreno; D. Ings; A. Lallana; S. Mané; S. Mignolet | Ilori; L. Karius; K. Stewart; A. Manninger | 8 / A. Lallana |
| 10 | D. Sturridge; M. Sakho; Lucas Leiva; E. Can; R. Klavan; D. Origi; Alberto Moreno; D. Ings; K. Stewart; S. Mané; S. Mignolet | Ilori; L. Karius; M. Grujić; A. Manninger | 9 / S. Mané |
**Kept signings**

After season k=1…9: Incoming k, overall 79+k, position [CB, ST, RB, LB, CM, RW, LW, GK, CAM][k−1], slot 1, release=false. Nik has no signings.

| Season | XI in slot order (0–10) | Subs (11–14) | Shot slot / player |
|---|---|---|---|
| 1 | Coutinho; Roberto Firmino; D. Lovren; J. Matip; N. Clyne; G. Wijnaldum; J. Henderson; J. Milner; A. Lallana; S. Mané; S. Mignolet | D. Sturridge; L. Karius; M. Sakho; E. Can | 0 / Coutinho |
| 2 | D. Sturridge; Roberto Firmino; D. Lovren; J. Matip; N. Clyne; G. Wijnaldum; J. Henderson; J. Milner; A. Lallana; S. Mané; S. Mignolet | Lucas Leiva; L. Karius; M. Sakho; E. Can | 1 / Roberto Firmino |
| 3 | D. Sturridge; Incoming 2; D. Lovren; J. Matip; N. Clyne; G. Wijnaldum; J. Henderson; J. Milner; A. Lallana; S. Mané; S. Mignolet | Lucas Leiva; L. Karius; M. Sakho; E. Can | 2 / D. Lovren |
| 4 | D. Sturridge; Incoming 2; Incoming 1; J. Matip; Incoming 3; G. Wijnaldum; J. Henderson; J. Milner; A. Lallana; S. Mané; S. Mignolet | N. Clyne; L. Karius; M. Sakho; E. Can | 3 / J. Matip |
| 5 | D. Sturridge; Incoming 2; Incoming 1; M. Sakho; Incoming 3; G. Wijnaldum; J. Henderson; Incoming 4; A. Lallana; S. Mané; S. Mignolet | N. Clyne; L. Karius; Lucas Leiva; J. Milner | 4 / Incoming 3 |
| 6 | D. Sturridge; Incoming 2; Incoming 1; M. Sakho; N. Clyne; Incoming 5; J. Henderson; Incoming 4; A. Lallana; S. Mané; S. Mignolet | Lucas Leiva; L. Karius; G. Wijnaldum; J. Milner | 5 / Incoming 5 |
| 7 | D. Sturridge; Incoming 2; Incoming 1; M. Sakho; N. Clyne; G. Wijnaldum; J. Henderson; Incoming 4; A. Lallana; Incoming 6; S. Mignolet | Lucas Leiva; L. Karius; E. Can; J. Milner | 6 / J. Henderson |
| 8 | Incoming 7; Incoming 2; Incoming 1; M. Sakho; N. Clyne; G. Wijnaldum; J. Milner; Incoming 4; A. Lallana; Incoming 6; S. Mignolet | D. Sturridge; L. Karius; E. Can; Lucas Leiva | 7 / Incoming 4 |
| 9 | Incoming 7; Incoming 2; Incoming 1; M. Sakho; N. Clyne; G. Wijnaldum; J. Milner; D. Sturridge; A. Lallana; Incoming 6; Incoming 8 | R. Klavan; L. Karius; E. Can; Lucas Leiva | 8 / A. Lallana |
| 10 | Incoming 7; Incoming 2; Incoming 1; M. Sakho; N. Clyne; G. Wijnaldum; J. Milner; D. Sturridge; Incoming 9; Incoming 6; Incoming 8 | R. Klavan; L. Karius; E. Can; Lucas Leiva | 9 / Incoming 6 |

### Sevilla — 3-5-2

Slots (fixed for both runs): 0=LDM, 1=LM, 2=CB, 3=RDM, 4=LCB, 5=GK, 6=RS, 7=LS, 8=CAM, 9=RM, 10=RCB, 11=SUB, 12=SUB, 13=SUB, 14=SUB.

**No signings**

| Season | XI in slot order (0–10) | Subs (11–14) | Shot slot / player |
|---|---|---|---|
| 1 | S. N'Zonzi; S. Nasri; A. Rami; Iborra; T. Kolodziejczak; Sergio Rico; W. Ben Yedder; L. Vietto; H. Kiyotake; Pablo Sarabia; N. Pareja | Vitolo; M. Krohn-Dehli; S. Sirigu; F. Vázquez | 0 / S. N'Zonzi |
| 2 | M. Krohn-Dehli; S. Nasri; A. Rami; Iborra; T. Kolodziejczak; Sergio Rico; W. Ben Yedder; L. Vietto; H. Kiyotake; Pablo Sarabia; N. Pareja | Vitolo; B. Trémoulinas; S. Sirigu; F. Vázquez | 1 / S. Nasri |
| 3 | M. Krohn-Dehli; Vitolo; A. Rami; Iborra; T. Kolodziejczak; Sergio Rico; W. Ben Yedder; L. Vietto; H. Kiyotake; Pablo Sarabia; N. Pareja | Daniel Carriço; B. Trémoulinas; S. Sirigu; F. Vázquez | 2 / A. Rami |
| 4 | M. Krohn-Dehli; Vitolo; Daniel Carriço; Iborra; T. Kolodziejczak; Sergio Rico; W. Ben Yedder; L. Vietto; H. Kiyotake; Pablo Sarabia; N. Pareja | Ganso; B. Trémoulinas; S. Sirigu; F. Vázquez | 3 / Iborra |
| 5 | M. Krohn-Dehli; Vitolo; Daniel Carriço; F. Vázquez; T. Kolodziejczak; Sergio Rico; W. Ben Yedder; L. Vietto; H. Kiyotake; Pablo Sarabia; N. Pareja | Ganso; B. Trémoulinas; S. Sirigu; Mariano | 4 / T. Kolodziejczak |
| 6 | M. Krohn-Dehli; Vitolo; Daniel Carriço; F. Vázquez; B. Trémoulinas; Sergio Rico; W. Ben Yedder; L. Vietto; H. Kiyotake; Pablo Sarabia; N. Pareja | Ganso; M. Kranevitter; S. Sirigu; Mariano | 5 / Sergio Rico |
| 7 | M. Krohn-Dehli; Vitolo; Daniel Carriço; F. Vázquez; B. Trémoulinas; S. Sirigu; W. Ben Yedder; L. Vietto; H. Kiyotake; Pablo Sarabia; N. Pareja | Ganso; M. Kranevitter; Escudero; Mariano | 6 / W. Ben Yedder |
| 8 | M. Krohn-Dehli; Vitolo; Daniel Carriço; F. Vázquez; B. Trémoulinas; S. Sirigu; Ganso; L. Vietto; H. Kiyotake; Pablo Sarabia; N. Pareja | G. Mercado; M. Kranevitter; Escudero; Mariano | 7 / L. Vietto |
| 9 | M. Krohn-Dehli; Vitolo; Daniel Carriço; F. Vázquez; B. Trémoulinas; S. Sirigu; Ganso; Mariano; H. Kiyotake; Pablo Sarabia; N. Pareja | G. Mercado; M. Kranevitter; Escudero; J. Correa | 8 / H. Kiyotake |
| 10 | M. Krohn-Dehli; Vitolo; Daniel Carriço; F. Vázquez; B. Trémoulinas; S. Sirigu; Ganso; Mariano; J. Correa; Pablo Sarabia; N. Pareja | G. Mercado; M. Kranevitter; Escudero; David Soria | 9 / Pablo Sarabia |
**Kept signings**

After season k=1…9: Incoming k, overall 79+k, position [CB, ST, RB, LB, CM, RW, LW, GK, CAM][k−1], slot 1, release=false. Nik has no signings.

| Season | XI in slot order (0–10) | Subs (11–14) | Shot slot / player |
|---|---|---|---|
| 1 | S. N'Zonzi; S. Nasri; A. Rami; Iborra; T. Kolodziejczak; Sergio Rico; W. Ben Yedder; L. Vietto; H. Kiyotake; Pablo Sarabia; N. Pareja | Vitolo; M. Krohn-Dehli; S. Sirigu; F. Vázquez | 0 / S. N'Zonzi |
| 2 | M. Krohn-Dehli; S. Nasri; A. Rami; Iborra; T. Kolodziejczak; Sergio Rico; W. Ben Yedder; L. Vietto; H. Kiyotake; Pablo Sarabia; Incoming 1 | Vitolo; B. Trémoulinas; S. Sirigu; F. Vázquez | 1 / S. Nasri |
| 3 | M. Krohn-Dehli; Vitolo; A. Rami; Iborra; T. Kolodziejczak; Sergio Rico; W. Ben Yedder; Incoming 2; H. Kiyotake; Pablo Sarabia; Incoming 1 | Daniel Carriço; B. Trémoulinas; S. Sirigu; F. Vázquez | 2 / A. Rami |
| 4 | M. Krohn-Dehli; Vitolo; F. Vázquez; Iborra; T. Kolodziejczak; Sergio Rico; W. Ben Yedder; Incoming 2; H. Kiyotake; Pablo Sarabia; Incoming 1 | Incoming 3; B. Trémoulinas; S. Sirigu; Daniel Carriço | 3 / Iborra |
| 5 | M. Krohn-Dehli; Vitolo; F. Vázquez; Daniel Carriço; T. Kolodziejczak; Sergio Rico; W. Ben Yedder; Incoming 2; H. Kiyotake; Pablo Sarabia; Incoming 1 | Incoming 3; Incoming 4; S. Sirigu; B. Trémoulinas | 4 / T. Kolodziejczak |
| 6 | M. Krohn-Dehli; Vitolo; F. Vázquez; Daniel Carriço; Incoming 4; Sergio Rico; W. Ben Yedder; Incoming 2; Incoming 5; Pablo Sarabia; Incoming 1 | Incoming 3; Ganso; S. Sirigu; B. Trémoulinas | 5 / Sergio Rico |
| 7 | M. Krohn-Dehli; Vitolo; F. Vázquez; Daniel Carriço; Incoming 4; S. Sirigu; W. Ben Yedder; Incoming 2; Incoming 5; Incoming 6; Incoming 1 | Incoming 3; Ganso; L. Vietto; B. Trémoulinas | 6 / W. Ben Yedder |
| 8 | M. Krohn-Dehli; Incoming 7; F. Vázquez; Daniel Carriço; Incoming 4; S. Sirigu; Vitolo; Incoming 2; Incoming 5; Incoming 6; Incoming 1 | Incoming 3; Ganso; L. Vietto; B. Trémoulinas | 7 / Incoming 2 |
| 9 | M. Krohn-Dehli; Incoming 7; F. Vázquez; Daniel Carriço; Incoming 4; Incoming 8; Vitolo; Incoming 3; Incoming 5; Incoming 6; Incoming 1 | L. Vietto; Ganso; S. Sirigu; B. Trémoulinas | 8 / Incoming 5 |
| 10 | M. Krohn-Dehli; Incoming 7; F. Vázquez; Daniel Carriço; Incoming 4; Incoming 8; Vitolo; Incoming 3; Incoming 9; Incoming 6; Incoming 1 | L. Vietto; Ganso; S. Sirigu; B. Trémoulinas | 9 / Incoming 6 |

### Arsenal — 4-2-3-1 (2)

Slots (fixed for both runs): 0=CAM, 1=GK, 2=LM, 3=RDM, 4=LCB, 5=RM, 6=LDM, 7=RCB, 8=ST, 9=LB, 10=RB, 11=SUB, 12=SUB, 13=SUB, 14=SUB.

**No signings**

| Season | XI in slot order (0–10) | Subs (11–14) | Shot slot / player |
|---|---|---|---|
| 1 | M. Özil; P. Čech; A. Sánchez; Santi Cazorla; L. Koscielny; A. Ramsey; G. Xhaka; S. Mustafi; O. Giroud; Nacho Monreal; Héctor Bellerín | P. Mertesacker; F. Coquelin; T. Walcott; Lucas Pérez | 0 / M. Özil |
| 2 | F. Coquelin; P. Čech; A. Sánchez; Santi Cazorla; L. Koscielny; A. Ramsey; G. Xhaka; S. Mustafi; O. Giroud; Nacho Monreal; Héctor Bellerín | P. Mertesacker; M. Debuchy; T. Walcott; Lucas Pérez | 1 / P. Čech |
| 3 | F. Coquelin; D. Ospina; A. Sánchez; Santi Cazorla; L. Koscielny; A. Ramsey; G. Xhaka; S. Mustafi; O. Giroud; Nacho Monreal; Héctor Bellerín | P. Mertesacker; M. Debuchy; T. Walcott; Lucas Pérez | 2 / A. Sánchez |
| 4 | F. Coquelin; D. Ospina; T. Walcott; Santi Cazorla; L. Koscielny; A. Ramsey; G. Xhaka; S. Mustafi; O. Giroud; Nacho Monreal; Héctor Bellerín | P. Mertesacker; M. Debuchy; K. Gibbs; Lucas Pérez | 3 / Santi Cazorla |
| 5 | F. Coquelin; D. Ospina; T. Walcott; P. Mertesacker; L. Koscielny; A. Ramsey; G. Xhaka; S. Mustafi; O. Giroud; Nacho Monreal; Héctor Bellerín | D. Welbeck; M. Debuchy; K. Gibbs; Lucas Pérez | 4 / L. Koscielny |
| 6 | F. Coquelin; D. Ospina; T. Walcott; P. Mertesacker; Lucas Pérez; A. Ramsey; G. Xhaka; S. Mustafi; O. Giroud; Nacho Monreal; Héctor Bellerín | D. Welbeck; M. Debuchy; K. Gibbs; Gabriel | 5 / A. Ramsey |
| 7 | F. Coquelin; D. Ospina; T. Walcott; P. Mertesacker; Lucas Pérez; M. Debuchy; G. Xhaka; S. Mustafi; O. Giroud; Nacho Monreal; Héctor Bellerín | D. Welbeck; A. Oxlade-Chamberlain; K. Gibbs; Gabriel | 6 / G. Xhaka |
| 8 | F. Coquelin; D. Ospina; T. Walcott; P. Mertesacker; Lucas Pérez; M. Debuchy; K. Gibbs; S. Mustafi; O. Giroud; Nacho Monreal; Héctor Bellerín | D. Welbeck; A. Oxlade-Chamberlain; M. Elneny; Gabriel | 7 / S. Mustafi |
| 9 | F. Coquelin; D. Ospina; T. Walcott; P. Mertesacker; Lucas Pérez; M. Debuchy; K. Gibbs; Gabriel; O. Giroud; Nacho Monreal; Héctor Bellerín | D. Welbeck; A. Oxlade-Chamberlain; M. Elneny; C. Jenkinson | 8 / O. Giroud |
| 10 | F. Coquelin; D. Ospina; T. Walcott; P. Mertesacker; Lucas Pérez; M. Debuchy; K. Gibbs; Gabriel; D. Welbeck; Nacho Monreal; Héctor Bellerín | A. Iwobi; A. Oxlade-Chamberlain; M. Elneny; C. Jenkinson | 9 / Nacho Monreal |
**Kept signings**

After season k=1…9: Incoming k, overall 79+k, position [CB, ST, RB, LB, CM, RW, LW, GK, CAM][k−1], slot 1, release=false. Nik has no signings.

| Season | XI in slot order (0–10) | Subs (11–14) | Shot slot / player |
|---|---|---|---|
| 1 | M. Özil; P. Čech; A. Sánchez; Santi Cazorla; L. Koscielny; A. Ramsey; G. Xhaka; S. Mustafi; O. Giroud; Nacho Monreal; Héctor Bellerín | P. Mertesacker; F. Coquelin; T. Walcott; Lucas Pérez | 0 / M. Özil |
| 2 | F. Coquelin; P. Čech; A. Sánchez; Santi Cazorla; L. Koscielny; A. Ramsey; G. Xhaka; S. Mustafi; O. Giroud; Nacho Monreal; Héctor Bellerín | P. Mertesacker; M. Debuchy; T. Walcott; Lucas Pérez | 1 / P. Čech |
| 3 | F. Coquelin; D. Ospina; A. Sánchez; Santi Cazorla; L. Koscielny; A. Ramsey; G. Xhaka; S. Mustafi; O. Giroud; Nacho Monreal; Héctor Bellerín | P. Mertesacker; Incoming 2; T. Walcott; Lucas Pérez | 2 / A. Sánchez |
| 4 | F. Coquelin; D. Ospina; T. Walcott; Santi Cazorla; L. Koscielny; A. Ramsey; G. Xhaka; S. Mustafi; O. Giroud; Nacho Monreal; Incoming 3 | P. Mertesacker; Incoming 2; M. Debuchy; Lucas Pérez | 3 / Santi Cazorla |
| 5 | F. Coquelin; D. Ospina; T. Walcott; P. Mertesacker; L. Koscielny; A. Ramsey; G. Xhaka; S. Mustafi; O. Giroud; Incoming 4; Incoming 3 | M. Debuchy; Incoming 2; Nacho Monreal; Lucas Pérez | 4 / L. Koscielny |
| 6 | Incoming 5; D. Ospina; T. Walcott; P. Mertesacker; Incoming 1; A. Ramsey; G. Xhaka; S. Mustafi; O. Giroud; Incoming 4; Incoming 3 | F. Coquelin; Incoming 2; Nacho Monreal; Lucas Pérez | 5 / A. Ramsey |
| 7 | Incoming 5; D. Ospina; T. Walcott; P. Mertesacker; Incoming 1; Incoming 6; G. Xhaka; S. Mustafi; O. Giroud; Incoming 4; Incoming 3 | F. Coquelin; Incoming 2; Nacho Monreal; Lucas Pérez | 6 / G. Xhaka |
| 8 | Incoming 5; D. Ospina; Incoming 7; P. Mertesacker; Incoming 1; Incoming 6; F. Coquelin; S. Mustafi; O. Giroud; Incoming 4; Incoming 3 | T. Walcott; Incoming 2; Nacho Monreal; Lucas Pérez | 7 / S. Mustafi |
| 9 | Incoming 5; Incoming 8; Incoming 7; P. Mertesacker; Incoming 1; Incoming 6; F. Coquelin; Lucas Pérez; O. Giroud; Incoming 4; Incoming 3 | T. Walcott; Incoming 2; Nacho Monreal; M. Debuchy | 8 / O. Giroud |
| 10 | Incoming 9; Incoming 8; Incoming 7; P. Mertesacker; Incoming 1; Incoming 6; F. Coquelin; Lucas Pérez; T. Walcott; Incoming 4; Incoming 3 | M. Debuchy; Incoming 2; Nacho Monreal; Incoming 5 | 9 / Incoming 4 |

## Ranked top five

1. **C-01 / P0:** globally protect both SP identities; real seeded Neymar release proves impact.
2. **C-02 / P1:** reject incompatible promotion; this corrupts many ordinary multi-season boards.
3. **C-03 / P1:** choose the weakest compatible starter before any positional preference.
4. **C-04 / P1:** remove input order as a gameplay tiebreak; it changes a real next-season release.
5. **C-05 / P1:** use player identity, not display strings, for exclusions and deduplication.

C-07 is also a release blocker: set the cutoff in the release PR. C-06 is presentation consistency work after the squad rules are correct.

## Checked and clean (with limits)

- `node tests/contracts/r87-roster-roulette-contracts.cjs`: **14 groups passed**. Includes all 98 clubs, 2,975 rows, full launch boards, three reserves, position-code/rating bounds, forced ten-season full-board checks, finite pool exhaustion, own-SP exclusion, deterministic VM/CommonJS replay and approximate probability/target spread. Some assertions explicitly bless best-outfielder fallback and CAM preference, so passing does not refute C-02/C-03.
- `node tests/contracts/r86-marquee-player-contracts.cjs`: **6 groups passed**. Distinct deterministic draws, badges/ranks, release cutoff, older-save null handling and club crests.
- `node tests/contracts/r86-special-player-reveal-contracts.cjs`: **12 groups passed**. Same draw indices, reveal-before-Career-Start wiring, continue/error routing, reload seen guard, wording and shell contracts.
- `node tests/contracts/r86-sp-chip-contracts.cjs`: **9 groups passed**, including screen placement, saved/live identity, wording, style scoping and post-close preservation.
- Local `npm run test:v10-flash`: **PASS** (portrait 390×844, landscape 844×390, desktop 1920×910, plus club reduced-motion checks). Every external HTTP(S) browser request was aborted by a temporary Playwright preload; only localhost was allowed. One nonblocking desktop tap-feedback observation: pressed state not painted, no layout change. The first attempt failed before page load because the local static server was not yet running; after starting it, the complete rerun passed. Neither temporary harness nor test artifacts are committed. This is a general UI proof, not physical roulette-scene acceptance.
- Parsed the 3D reveal's `MP_LIST` (`visual-assets/v10_1/special-player/index.html:1198`) and compared all 305 tuples to `data/marqueePlayers.js`, including rank, name, club, overall, potential, shirt, nation, position and all six stats: **exact match**. No draw/reveal roster drift found.
- Downloaded only the public CSV source (no Firebase). SHA256 `f2d35920e5cddb28d750924281c4e4095fdc485a5d8358497cd579b1b7b5e03a` matches bundled sourceSha256; 17,597 source rows. All 2,975 bundled player tuples match a source tuple. The generator uses explicit catalog-club aliases and formation slot sets, selects source XI and four best non-starters, then three distinct-name reserves. No accidental rating/position/source-value drift found. The name-only identity loss in C-05 remains a separate failure; source fidelity is not proof of identity correctness.
- Current form validates integer overall 30–99 and a supported position; generated source data is 40–99. Legacy verdicts with no overall are ignored rather than producing zero-rated players. No off-by-one rating range bug reproduced.
- Exact-name SP filtering works for every own launch XI, sub and reserve tested by L13; it is not global protection and not homonym-safe. The list version/draw has no network or clock randomness once eligibility is known. The checked visible wording is Special Player/SP; internal `marquee` identifiers are not user-facing wording bugs.
- Fired plan player is the engine board row at hitSlot. Scene merge uses authoritative names/overall/formation and all 15 rows, selecting named fired targets even though its visual bubbles are sorted by pitch Y. No normal unique-name case showed the scene naming a different fired player than the plan. The parent release message uses the engine player, not a scene-provided name.
- Step/result review: own fired result requires I'VE RELEASED HIM; safe result has a transfer-window button; BACK resolves false and routes home without marking done. Watched and done are separate browser storage markers. Mid-spin reload rebuilds the same deterministic plan and may replay the animation; reload after watched skips animation but retains release confirmation. These are source/contract conclusions, not a physical two-phone acceptance claim.
- Board engine does not read/write Firebase. History callback returns cached completed Transfer Challenge verdicts, otherwise one provider read per missing season (`js/productionSharedTransferChallenge.js:410`–427). No board document or new Rules path found. Cached rows retain overall, position and release; both phones with the same history reconstruct the same engine board. Missing history blocks board reconstruction; PR #1091 supplies the requested error/exhaustion recovery.
- Documentation impact router: **POS20_DOC_ONLY**, no selected product tests, operations=false. Its supplemental V10_FLASH_BROWSER proof is recorded below; it grants no SSJR/MDP credit.

## Unknown / verification limits

- No production Firebase calls, no real account sessions and no physical two-phone Safari/WebGL run. Actual deployment/service-worker rollout, reveal/chip clipping on every career screen, sound/vibration and post-reconnect UI timing are **unknown** beyond source/contracts/local smoke. No claims of production acceptance or SSJR credit.
- PR #1091 was inspected as a proposed fix, not merged into this report branch. Its actual production offline/load-error/exhaustion behavior is **unknown** here and explicitly excluded from findings as requested.
- Exact future r87 release boundary is **unknown** until the release PR pins it. C-07 identifies the current boundary behavior.
- The precise canonical tie identity order is **unspecified** by the supplied rules. C-04 proves input dependence; it does not invent a mandated alphabetical winner.
- The first natural ten-season need for Alavés' younger Manu García, and any real player-name alias entered by Daniel/Nik, are **unknown**; their data/engine identity failures are demonstrated separately from production occurrence.
- An uninterrupted full scene render on two physical phones was not performed. Scene target fallback for a nonexistent named target was not promoted to a finding without a normal-play reproduction.

## What makes this 10/10

Fix the seven findings; pin the r87 eligibility boundary; preserve PR #1091's retry/back/exhaustion and offline fixes. Add semantic assertions for positive positional fit (including reserve/database fallback), global SP exclusion by stable identity, weakest-compatible improvement and permutations of signing entry slots. Use the full engine spin plan in the scene. Re-run the 60-board walks against an independent rule oracle and verify reload/back/retry/exhaustion on two real phones with identical boards, chambers, targets, chips and release names. Keep all board computation local and limit remote history reads to missing seasons.
