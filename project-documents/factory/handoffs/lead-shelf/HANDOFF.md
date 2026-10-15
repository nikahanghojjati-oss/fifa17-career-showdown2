# Team V lead handoff (read this first)

Written Thu 15 Oct 2026, 6:50 p.m. Eastern, by the old Team V lead thread "Showdown Factory job board" when Nik moved Team V to a fresh thread to save usage.
Repo: nikahanghojjati-oss/fifa17-career-showdown2. Team V work branch: `factory/v1-wtt5ye` (never main).

## 1. How to use these files

| File | What it is | How to read it |
|---|---|---|
| `HANDOFF.md` (this) | Who you are, live state, first steps | Read all of it now |
| `SHELF.md` | Every small decision, rule, number, path and promise, sorted by topic (`## S01` ... ) | Read only the section that matches the question: `grep -n '^## S' SHELF.md`, then read that section |
| `LOG_NIK_MESSAGES.md` | Every message Nik wrote in the old thread, verbatim, with Eastern times | grep for a word or a time when you need his exact words |
| `LOG_LEAD_REPLIES.md` | Every reply the old lead sent Nik, verbatim | grep when Nik says "you told me ..." |

All four are in `project-documents/factory/handoffs/lead-shelf/` on `factory/v1-wtt5ye`, with a copy in `/mnt/project-files/factory/handoffs/lead-shelf/`. Team memory (`/tmp/claude/memory/team/silo/`, index `MEMORY.md`) holds the durable rules too. Never read the logs whole; that is the cost this move is avoiding.

## 2. Who you are

- You are the **Team V lead**: visual lead and keeper of product truth for the Career Mode Showdown game (a two-player FIFA 17 career mode companion site for Nik and Daniel).
- **Team V** = this Claude project (visuals). Workers are GPT chats Nik runs in ChatGPT: "GPT blue" = a normal GPT-5.6 Sol chat (CSS and text), "GPT green" = Sol Work mode (logic with tests). Always write those names in full to Nik.
- **Team G** = a separate Claude project (gameplay). It owns `main`, merges and releases. Team V never touches main, never merges into it, never releases.
- Nik (owner, Boston) talks to you here. He is on iPhone Safari: he cannot open `/mnt` links or file cards, so **always give GitHub links** (`https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/factory/v1-wtt5ye/<path>`). Show times in **Eastern** only. Plain, short words. He voice-types, so expect mis-hearings ("job prompt" = job board, "Team B" = Team V, "GTRED" = Team G lead).
- Standing authorization: settings, repo, branch and thread work without asking. Never touch main, never force-push, never delete branches or files you did not create, nothing irreversible without Nik's own words. Billing permanently OFF, Firebase Spark only.

## 3. Rules that bite (full lists in SHELF.md)

1. **Art truth:** Daniel always LEFT, Nik RIGHT. No player photos except the Loading screen's real Marco Reus photo (kept with kit logos, credit line required). No real club crests, league logos or trophies; our own marks only (PL Crown, LaLiga Bull, Bundesliga Schale, Serie A Shield, Ligue 1 "1").
2. **Full bodies:** both managers full length on every screen with managers. Cuts are allowed only where a real object is in front: Transfer desk (seated), League plinth, Trophy Room and Final Winner pedestals. No senseless fades or cuts ever come back.
3. **Faces never covered** by layout. Face check is per-screen ("smart"): `project-documents/factory/tools/phone_plates/facecheck.py` and `live_facecheck.cjs` with `visual-assets/v10_1/plates-v2/PHONE_FACE_ZONES.json`.
4. **HO-027, no state filters:** no dim, blur, see-through or dark overlay on managers or screens (signed-out and loser states look like the good signed-in version). Not a brightness boost; lighting stays realistic. **Keep all anti-flash code.**
5. **Head and body must match** in place, tilt and size (heads come from the approved mockup, bodies from Nik's GPT picture; `lock.py` checks it).
6. **Never redesign phone layouts.** Use new file names only; never overwrite V1 files.
7. **GPT first (bug factory):** every job GPT can do is packaged as a numbered job file for GPT blue or green; Sonnet only if GPT can't, then Opus; Fable rare. Claude threads don't fix new bugs themselves. New pictures always go to Nik first.
8. **Pictures run in a normal new ChatGPT chat outside any project.** Never tell Nik to use a Temporary Chat (they can't make images any more).
9. Every picture ticket carries the no-invention block (exact tab bar and gear, verbatim body text, no invented tabs or rules).
10. Handoffs to Nik: one complete file per task or destination, single self-contained paste lines, clickable links.

## 4. Where things live

- Factory folder: `project-documents/factory/` (FACTORY_RULES, WORKER_HANDBOOK, PRODUCT_TRUTH, QUALITY_BAR, BUG_FACTORY, SHARED_BOARD, BOARD.md, jobs/, tickets/, mockups/, reviews/, handoffs/, tools/).
- Mockups (the visual target): `project-documents/factory/mockups/` holds only `NEXT_<SCREEN>.png` (desktop, 16 approved) and `PHONE_<SCREEN>.png` plus `PHONE_<SCREEN>_MARBLE.png` (17 approved). Old ones are in `mockups/archive/`.
- Backgrounds: `visual-assets/v10_1/plates-v2/` holds `ENV_<KEY>_PLATE_V2_{1X,2X}.webp` (14 desktop, done 12 Oct) and `ENV_<KEY>_PHONE_V2.webp` (15 phone, done 12 Oct), plus README rows.
- Draft tracker PR #311 (factory branch, never merge). Relay tracker PR #312.
- **Relay with Team G:** branch `leads/relay`, folder `project-documents/leads-relay/` (CONTRACT.md, FEED.md, INBOX.json, handoffs/HO-NNN_*.md, tools/handoff.py, tools/claim_number.py). Hand-offs HO-001..HO-027 so far. Job numbers come from the shared counter (`claim_number.py --team V --title "..."`); Team V PR titles keep the "V-" prefix.
- Studies: Team G's mega factory makes coded study pages; Team V judges each in `project-documents/gameplay-factory/queue/V_ADOPTION.md` on `factory/gameplay-v1`. Edit only that file there; never edit Team G's board files.
- Boards rebuild themselves through GitHub Actions; the Haiku V keeper thread owns `CUSTOM_VIEW_V.html`.

## 5. Live state (15 Oct 2026, evening Eastern)

- Live site build: r72 on 12 Oct; Team G is working on **r76** now. r75 was an urgent Firebase fix only.
- **Done by Team V:** all 16 desktop NEXT mockups, all 17 phone marble mockups, all 14 desktop premium backgrounds, all 15 phone backgrounds (heads locked, 24 heads match bodies within 1px, 0.25 degrees and 0.4% size, face check passes on all 12 manager screens). HO-026 Team V part DONE. Sideways (852x393) and tablet portrait reuse the phone plates; tablet landscape uses the desktop plates. No new art needed there. Team G dropped the old OVL_*_PHONE cutouts (no V3 cutouts).
- **With Team G for r76:** wiring the phone plates, HO-027 filter removal, and removing the fade masks Team V found on main (`css/v10Setup.css:628-629` `.v26Hero img`; `css/v10Transfer.css:91-92, 100-101, 108-109, 291`). They run `live_facecheck.cjs` on it.
- Factory queue: empty. `waiting.sh` has listed nothing and no new studies have appeared since 13 Oct.
- Nothing is waiting on Nik.

## 6. What may come next (r77, Nik expects a visual release)

- When Team G ships r76: check the live phone screens against the PHONE_*_MARBLE mockups with `live_facecheck.cjs` (393x852, 393x660, 375x667, 360x640). Report any failing screen to Team G as a hand-off. Check for no fades, no filters, no flash.
- "Next-level desktop" (plan 2) is DONE: Nik said on Thu 15 Oct 7:18 p.m. Eastern it was the code name for the marble design, already live (r75). Only desktop glitches Nik reports remain. Never revive it as a new plan.
- r76 has NO visual changes (gameplay + Firestore reads only; Team G, 15 Oct). HO-026 phone marble, HO-027 no filters and the fade removal are all in **r77** (Nik moved them 13 Oct). After r76: quick no-regression check only; full phone check after r77.
- Nik agreed (15 Oct 7:18 p.m.): phone Home tiles follow PHONE_HOME_MARBLE (name top left, big icon right, not centred); no season chip on phone stage screens; the lead builds the small-fixes list itself during the r77 check.
- Mockup closeness board: `project-documents/factory/mockup-board/MOCKUP_BOARD.md` (74% on 06 Oct). Refresh its number after r76 lands.
- Big goal: when both boards reach 100%, Nik and Daniel have a working, bug-free game on the live site with the new visual pack. That needs integration jobs 103-110, Codex review, a full two-player play-through, and Nik's OK.

## 7. Your first steps in the new thread (do these once)

1. Read this file, then `grep -n '^## S' SHELF.md` so you know the shelf's sections.
2. **Relay:** in a `leads/relay` checkout, set `INBOX.json` "V" to your session id and thread name, commit, push. Subscribe to PR #312 activity. Read `INBOX.json` "G" for Team G's current session (Team G is also moving to a fresh lead thread, so the old `session_01WtNr2MS7C9s34e26kzc17a` may be stale). Send Team G one short message with your new session id.
3. **Hourly backlog guard: PAUSED on purpose.** The scheduled task "Factory: keep the Claude check lane at 3 or fewer" (`trig_01WAbi3RfWbpwGEDPjeyiYgZ`, bound to the OLD session) checked every hour from 7 a.m. to 1 a.m. Eastern, 19 times a day, for GPT jobs waiting on a Claude check and for new studies. It found nothing from 13 Oct on and burned Nik's usage, so it was paused on 15 Oct at 6:47 p.m. Eastern. Leave it off. Turn the guard on again only when Nik starts handing out GPT jobs or studies for Team V again. To do that, create the same task bound to your own session: same cron `CRON_TZ=America/New_York 52 0,1,7-23 * * *`, same prompt (read it with `get_trigger`). Then delete the old one. Tell Nik when you turn it on, and turn it off again once the queue is empty. The relay does not need it: Team G wakes you directly.
4. Tell Nik in one short reply that you are set up and nothing is waiting on him.

## 8. Fresh-thread rule (Nik, 15 Oct 2026, 6:45 p.m. Eastern)

Start a new Team V lead thread **after every release**, the same time Team G moves to a new lead thread. **Remind Nik every time**: as soon as Team G says a release shipped, tell him "Release rNN shipped. Time to move Team V to a fresh lead thread too." Before he moves, refresh this file (section 5 and the date), append new decisions to SHELF.md in the right section, add new Nik messages and replies to the two logs, and update team memory.

## 9. Push pattern

```
for i in 1 2 3 4; do git pull -q --rebase --autostash origin factory/v1-wtt5ye && git push -q origin factory/v1-wtt5ye && break; sleep $((2**i)); done
```
After each push to the factory branch, call `unsubscribe_pr_activity` for PR #311 (Nik chose not to watch it). Commit trailer:
```
Co-Authored-By: <your model line from the session's attribution reminder>
Claude-Session: <your session URL>
```
Never put model ids in files or commit messages beyond that trailer.
