# Duet job P4: make the two heroes' faces right in every picture (study, prompts, fixes)

Model: Opus 5.5, high effort or above. This is SENSITIVE work. Hero pictures load at startup on almost every screen, so a mistake can flash, cover a face, leave a ghost outline or break a screen. Never use Sonnet or Haiku for it, including in sub-teams.

Picked by Nik on 2026-11-26, 04:05 UTC (Wed 25 Nov, 11:05 PM Boston). In his words: study every hero picture the real game uses, in every room and screen. Find where Nik's or Daniel's face (or hair, head or body) looks deformed, defective, AI-generated, wrong or bad. Then work out what to prompt GPT, or what final touch code can do, to make each one better. The Home heroes are the anchor for likeness. Match the lighting of each clubhouse.

**The goal (Nik, 04:05 UTC):** new hero pictures for every one that is faulty, deformed or doesn't look right, so that each one matches the likeness of the Home pictures. In Nik's words, those "look perfect". The study exists to get there. A code-only touch is used only where it truly makes the hero match the Home likeness, as with cut-off hair from a layout crop. Otherwise the answer is a new, better picture.

This runs in its OWN Duet channel, separate from P3 (material clubhouses). Never touch P3's branches or mailbox, and P3 never touches yours.

## Nik's rules for this job (never break)
1. **Never slimmer (Nik 2026-11-24 22:53 UTC, restated 2026-11-26).** A fixed hero must never be smaller or thinner than today's outline, in any picture. If it shrinks, the old background shows around it as a ghost, and Nik will not redo backgrounds. Every fix stays INSIDE today's silhouette or covers it fully (the same outline, or slightly bigger). Reshaping a face that is too fat is done INSIDE the head: jaw, cheeks and neck are redrawn within the old head outline, with the freed area filled by the hero's own hair, collar or shadow, never by background.
   - **Hard check, per picture:** the new hero mask must fully cover the old hero mask (zero old-mask pixels left uncovered after a 1 px tolerance). If it doesn't, the picture fails, whatever its score.
2. **The Home heroes are the likeness anchor.** Nik's and Daniel's faces on the Wooden Home room (`visual-assets/v10_1/plates-hc/ENV_HOME_PLATE_HC_V3_2X.webp` desktop, `ENV_HOME_PHONE_HC_V3.webp` phone) are the reference for face shape, hair, beard, skin tone and build. Every other picture is judged against them. Daniel is Manager 1, always image-left; Nik is Manager 2, always image-right. Never mirror.
3. **One asset per ticket, one chat per ticket, edit from the source, never an edit of an edit** (skill showdown-likeness-image-ticket, rule zero and core rules 1-6). Nik runs each ticket in ChatGPT Work mode, Astra 6, Extra High (skill showdown-astra-image-prompts). Attach the picture to fix as Image 1. Attach a face crop from the Home anchor as Image 2 only when likeness is the problem.
4. **Change only the hero.** Everything outside the hero mask stays exactly as it is: room, objects, light, framing. On return, run a **likeness lock** (align.py, then keep the edited pixels only inside the hero zone with about a 6 px feather, and restore the original everywhere else).
5. **Lighting matches the room it sits in.** In the clubhouse rooms, paint.py lays the Wooden heroes back over every clubhouse (faces are 0 px different across Wooden, Platinum, Black Steel and Graphite today). So fix each room hero ONCE on the Wooden master, re-run the build, and all clubhouses get it. Then check the fixed hero in every clubhouse's light. If a hero looks wrong in one clubhouse's light, propose a per-clubhouse grade done in code and inside the mask only, and show it on the board before using it.
6. **Premium only.** The game must never load an old hero picture again once its fix ships. Old files leave the game, the service worker lists and the rooms board (check before removing: list every deleted file for the lead first).
7. **No backward compatibility** (pre-launch): no old/new mixing, no fallbacks to old heroes.
8. **Face pixel contracts** (`tests/contracts/r91-layout-faces-contracts.cjs`, `tests/fixtures/team-v/HC_FACE_ZONES.json`, `PHONE_FACE_ZONES*.json`, `tests/browser/phone-marble-facecheck-audit.cjs`) are re-pinned only after Nik's board OK for that picture. Never weaken a check to make it pass.

## Budget, clock and what ships
- **Budget:** Nik's Duet credit for this channel. Stop when it runs out, and post a REPORT with where each picture stands. Spend first on the study (cheap, and Nik sees it all at once), then on fixes in the order Nik picks.
- **Ships in 3.0 only if merged and proven before Sat 28 Nov, 8 PM Boston** (Sun 29, 01:00 UTC; the 3.0 build cut line). A fix that misses this stays on its branch for the first update after launch. Never rush one in half-done.
- **Order of work:** study all, then the board, then Nik picks, then fixes one picture at a time (each finished fully before the next).

## Who's who
- **Repo:** nikahanghojjati-oss/fifa17-career-showdown2. **Base branch:** `gameplay/r100`. Your branches start `claude-duet/p4-faces-`.
- **You (Duet):** you study, write the prompts, score and redo the pictures, cut, lock and deliver the files, wire them, run the checks, build the board and open PRs into `gameplay/r100`. You never merge.
- **The r100 lead** (Team G lead: r100 (2)) merges and answers priority and merge questions. **B7** ("Make the clubhouses premium") owns the clubhouse pipeline (paint.py, masks, PREMIUM_FILES.json) and answers how it was done. Both reach you only through the mailbox.
- **Nik** runs every picture prompt in ChatGPT and sends the result back. He picks which fixes to do from your study board, and says OK or not on each fixed picture.
- **Mailbox:** `r100-duet/DUET_P4_MAILBOX.md` on this branch (same rules as P1/P3: Q-n, FLAG and REPORT under "To desk", the desk answers A-n/N-n under "To Duet"). Nik types "check desk" in your channel and "check Duet" in the desk thread "Relay Duet questions and prompts".

## Read first
1. Skills **showdown-likeness-image-ticket** and **showdown-astra-image-prompts** (summaries below if they don't load).
2. `r100-duet/p3/teamv-kit/TEAM_V_METHOD.md` (Team V's method; it wins over this file for prompt wording and scoring) plus `align.py` and `save2.py` from the same folder. Fix their container paths first.
3. `tools/clubhouse-themes/` on gameplay/r100: `paint.py` (how the Wooden heroes are laid over every clubhouse), `masks/` (hero masks per room, desktop and phone), `build.py`, `finish.py`, `manifest.py`, `PREMIUM_FILES.json`.
4. The face contracts in rule 8.
5. `r100-duet/p3/b7-kit/PIPELINE_FOR_NEW_CLUBHOUSES.md`, for how a room picture flows from a painting into the game.

## Phase 1: the study (no pictures from Nik needed)
1. **Inventory.** List every picture in the real game that shows Nik or Daniel, at every size and device the game ships, and for every screen:
   - the clubhouse rooms (Home, Board, Box, Club, Coaches, Hall, Office, Archive, Tunnel, loading, sign-in), Wooden master plus each clubhouse;
   - Legacy (`visual-assets/v10_1/legacy/assets/OVL_LG_*`, `ENV_LG_*`);
   - League Roulette (`js/leagueRouletteScene3d.js` and the pictures it draws, desktop and phone, after the wheel was moved and made bigger);
   - the Trophy Room, Career Start, Gazette, Season Results, the Champion screen, Chamber Men, Transfer War, Prime Pack and any other screen with a hero.
   Find them from the code (what each screen actually loads), not from file names alone. Note retired files the game no longer loads, and leave them out.
2. **Capture what the player sees.** Use the real game in the emulator, both Chromebook sizes (1920x866 and 1920x1035), phone 390x844 and sideways 844x390. Take a screenshot of each hero, and a face crop at 100% from the source file.
3. **Compare with the anchor.** Set each face crop next to the Home anchor at equal head height, on grey. Score likeness (face shape, jaw width, cheeks, eyes, nose, mouth, hair line and volume, beard, skin tone, build) and defects: extra or melted features, asymmetry, smeared skin, plastic or waxy skin, wrong teeth, hands with the wrong finger count, cut-off hair or head, halo or fringe, ghost outline, lighting that doesn't match the room, and anything else that looks AI-made.
4. **Known problems Nik named (check these first):**
   - **Legacy:** Nik's face is too fat.
   - **League Roulette:** since the wheel moved and grew, part of Nik's hair and part of Daniel's hair are missing (cut off). Find out whether this is a crop, clip or layout in code (fix in code, no new picture), or whether the picture itself lacks the hair (needs a picture fix).
   - Others where part of Nik's or Daniel's face is defective or doesn't look right.
5. **For each problem, pick the cheapest fix that truly fixes it:**
   - **Code:** layout, crop, clip, scale or position (never scale a hero down below today's outline), a per-clubhouse grade inside the mask, edge clean-up (alpha 248-254 to 255, erode 1-2 px, decontaminate warm fringe).
   - **Picture:** a likeness-locked GPT edit of the hero zone (one ticket per asset), written in full and ready to paste.
   - **Both**, in that order.
6. **Study board.** Build one page Nik can open on his phone and Chromebook. Per picture, show: the screen, the size, the face crop next to the anchor, the problems in one plain line each, a severity (bad / noticeable / small), and the proposed fix (code or picture) with its cost in tickets. Put the worst first. Give each item an id `F-1`, `F-2` and so on. Publish it as a private artifact (or the board you used for P1/P3), and post the link in a REPORT.
7. **Nik's pick (NIK).** Send Nik the study board with the "Study OK ask" below. He answers with the ids to fix and the order, or "all". Write no picture tickets before this.

## Phase 2: fixing, one picture at a time
1. **Ticket** [you]: one ticket per asset, in `r100-duet/p4/RUN_SHEET_FACES.md`, Team V prompt order. Image 1 is the source picture to fix. Image 2 is the Home anchor face crop, only when likeness is the problem. The prompt keeps everything outside the hero exactly as it is, keeps the outline the same or slightly bigger, and names the one change (for example "make his face slimmer inside the same head outline: narrower jaw and cheeks, the same neck width and collar").
2. **Run it** [NIK]: new chat per ticket, attach the files, paste the box, send you the picture.
3. **Take it in** [you]: commit it untouched as `<ASSET_ID>_RAW.png`, align it, run the likeness lock, then run the **never-slimmer check** (rule 1) and score it against the anchor (pass 9/10; Nik: "try until reach 9 always"). Below 9, write ONE fix in the same chat, or a new-chat ticket, per Team V's redo loop. Never accept under 9, and never accept a picture that fails the never-slimmer check.
4. **Room heroes:** fix on the Wooden master, re-run the build for every clubhouse, and check every clubhouse's light (rule 5).
5. **Wire and prove** [you]: replace the file in the game, update `PREMIUM_FILES.json` and the service worker lists the clubhouse way, then run:
   - the contracts, flash in every clubhouse, the old-art audit, quality tiers and sizes;
   - the face contracts (still the OLD pins until Nik's OK);
   - a NEW contract per fixed picture: the never-slimmer mask check, plus a check that the game never loads the old file.
6. **Picture OK** [NIK]: send the "Fix OK ask" with the before/after on the board. After his OK, re-pin the face contracts for that picture and say so in the PR body.
7. **PR**: one PR per screen family (for example "Legacy heroes", "League Roulette hair"), into `gameplay/r100`. Draft until ready, then ready in one push with `@codex review`. Post a REPORT with the PR number and head. The lead merges.

## Message templates for Nik (use them word for word in shape)
**Study OK ask:** `Hero face study is ready: <board link>. I found N problems; the worst are F-1 <one line>, F-2 <one line>, F-3 <one line>. Reply with the ids to fix in order, or "all".`
**Picture ask** (one block per ticket):
```
F-1 Legacy, Nik desktop. New chat: ChatGPT Work mode, Astra 6, Extra High.
Attach Image 1: <blob link>  (Image 2: <blob link> or "none")
Paste the box below exactly. If ChatGPT offers a rewrite, reply: No, use my prompt exactly.
Send me the picture here. It saves as <ASSET_ID>.
<prompt in its own copy box>
```
**Score line:** `F-1: 8.5/10. Face shape right, beard edge soft on the left. One fix below.` or `F-1: 9.5/10, outline check passed. Accepted.`
**Fix ask:** `F-1 fix 1. Same chat, paste this:` followed by the one-line fix in a copy box.
**Fix OK ask:** `F-1 is fixed and wired. Before and after: <link>. OK to ship it? Reply OK, or name what to change.`
Every ask fits on a phone: short plain sentences, Boston times, and one copy box per thing Nik pastes.

## How you work with Nik
Nik is the hands, never the planner. He only pastes your prompts into ChatGPT, sends back the picture, picks from your study board and says OK or not on a look.
- Never ask Nik for a picture without the full ticket in the same message (Image links, the "saves as" name, and the exact prompt in ONE copy box). Never ask for a test picture.
- Never ask Nik how something is done. Ask the desk in the mailbox (Q-n).
- Before each message to Nik, check that it carries a ready prompt box, the study board, or a yes/no look call. If it doesn't, don't send it; do the work instead.

## Never touch
main, the release PR, leads/relay, the version and RUNTIME_REVISION, package.json, the Firestore Rules, SFP, production Firestore, P3's branches and mailbox, and any background outside a hero mask.

## Skill summaries (in case they don't load)
- **Likeness ticket:**
  - one asset = one ticket = one new chat;
  - edit the source, never an edit of an edit;
  - change one kind of thing per edit;
  - no text, logos or real players;
  - five fingers per hand;
  - Daniel image-left, Nik image-right, never mirrored;
  - gate check on return: likeness at a glance, wardrobe, pose, hands, no baked text, size and alpha, SHA-256 recorded.
- **Astra prompts:** ChatGPT Work mode, Astra 6, Extra High. Image 1 is the picture to edit. Follow Team V's 9-part prompt order. Pass is 9/10. Fixes are "Keep this image exactly the same. Change only: ..." in the same chat.

## When you stop
Write `r100-duet/P4_HANDOFF.md`: the study board link, each F-id with its state (not started / ticket written / picture in / wired / PR / merged), every branch and head, and what the next lead needs to finish each one.
