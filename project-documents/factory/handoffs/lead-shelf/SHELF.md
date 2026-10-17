# SHELF: Team V lead reference shelf

A topic-sorted reference of every small thing Nik was told or decided in the old Team V lead thread (01 to 15 Oct 2026), so a new lead can open only the section that matches a question; the exact words live in `LOG_NIK_MESSAGES.md` and `LOG_LEAD_REPLIES.md` in this folder (grep their `### <Day> <DD> Oct 2026 <time> Eastern` headers).

Repo: `nikahanghojjati-oss/fifa17-career-showdown2`. Work branch: `factory/v1-wtt5ye`. Never main. All times below are Eastern unless marked.

## TABLE OF CONTENTS

1. S01 How to use this shelf and the two logs
2. S02 Nik: standing rules, preferences, tone
3. S03 Glossary and voice-typing mis-hearings
4. S04 Product truth and art rules
5. S05 Teams, roles, branches, relay, job numbering, boards
6. S06 Factory workflow (jobs, GPT blue/green, intake, check.py, guards)
7. S07 Timeline of big moments
8. S08 Final polish CC-008 and shipping to Team G
9. S09 Mockups: desktop NEXT_* and phone PHONE_* (approvals with dates)
10. S10 Premium plates 1610P (desktop backgrounds)
11. S11 Marble phone mockups, HO-026 (tickets 1799 and 1800)
12. S12 Phone plates 1801, full body rule, face and head checks
13. S13 HO-027 no state filters and anti-flash
14. S14 Full Motion, Settings and Delete Current Showdown
15. S15 Loading screen
16. S16 Home
17. S17 Connect Players
18. S18 Season Results
19. S19 Transfer War
20. S20 Select League
21. S21 Club Assignment
22. S22 Career Statistics
23. S23 Rivalry Statistics
24. S24 Legacy
25. S25 Settings
26. S26 Final Winner
27. S27 Trophy Room
28. S28 Rule Book
29. S29 Standings
30. S30 Studies and V_ADOPTION
31. S31 Hand-offs HO-001 to HO-027 and relay ids
32. S32 Tools and scripts
33. S33 Image tickets and GPT prompt lessons
34. S34 Budget, models, usage
35. S35 Open items, promises, things waiting
36. S36 The 15 Oct thread transition

## S01 How to use this shelf and the two logs

- `LOG_NIK_MESSAGES.md` has every Nik message, oldest first. A header looks like `### Mon 12 Oct 2026 9:23 p.m. Eastern (cmsg_...)`. Search with `grep -n "Mon 12 Oct 2026 9:23" LOG_NIK_MESSAGES.md`.
- Entries with an empty body in the Nik log are picture drops (the picture itself is not in the log). The next lead reply names the picture, for example the Nik entries Sat 10 Oct 11:57 a.m., 12:00 p.m., 12:03 p.m. are the phone Connect Players, Season Results and Transfer pictures.
- `LOG_LEAD_REPLIES.md` has every lead reply. `[update_message]` entries are edits of an earlier reply (the last edit is the true text). Many replies repeat each other because of edits.
- Each bullet below gives its date and time so you can grep the log header for the exact words.
- Nik also chose some options on decision cards; those appear in the Nik log as `Chose "..."` lines (Sat 03 Oct 11:13 p.m. "Stop watching"; Sat 10 Oct 11:22 a.m. "Use studies").
- Team memory notes (outside the repo) live in `/tmp/claude/memory/team/silo/*.md` (`MEMORY.md` is the index); they store some times in UTC, converted here to Eastern (UTC minus 4). Choices Nik made on cards that are not in the Nik log (for example the Mon 12 Oct 8:38 a.m. Home plate pick, "marble lounge") come from memory and the lead replies.

## S02 Nik: standing rules, preferences, tone

- Nik is the owner, in Boston. Show ALL times in Eastern, written like "Sat 10:20 a.m. Eastern". UTC is internal only. (memory)
- Nik works on iPhone Safari. He cannot open `/mnt/...` links or file cards, so ALWAYS give GitHub links (blob links on `factory/v1-wtt5ye`). To attach a picture he opens it in Safari, presses and holds, then Save to Photos. (Fri 02 Oct 12:22 p.m.)
- When he opens the repo on GitHub the branch menu must say `factory/v1-wtt5ye`, not main, or files will not show. (Mon 12 Oct 8:37 p.m.)
- Use plain simple words. Short replies. Open with "Nothing needed from you" when true, then one clear "Type next" or one clear step.
- Give him copy-paste blocks in code fences, single and self-contained, with clickable links. Always write "GPT-5.6 Sol" and "Sol Work mode" in full. (memory)
- He wants rendered pictures to look at, not HTML pages on GitHub (Nik, Sun 04 Oct 4:30 p.m.). The review page is the artifact https://claude.ai/artifact/KdCK9SxNfGfNjYNj47WGNX (same link updated; last updated 04 Oct 4:33 p.m. and again after CC-008).
- When he asks "which one is better" or asks for judgment, give the pick and a short plain reason (Nik, Mon 12 Oct 9:23 p.m.: "I need your judgment and an explanation").
- When he asks what to tell Team G, give him an exact line to say, not "go" (Nik, Mon 12 Oct 5:45 a.m.). The lead gave: "Build the adopted desktop studies into the live game first, then phone, and show me each screen when it's live."
- Standing authorization: settings, repo, branch and thread work without asking; never touch main, never force-push or delete, nothing irreversible without his words. (memory)
- He likes cost estimates on reports and ordered lists: "Type next:" with job numbers, "Done: N of M" on picture batches. He wants tickets fixed at the SAME link so he can reopen the page (Sun 11 Oct 2:15 a.m.).
- Backlog rule (Nik, Sat 03 Oct 10:46 p.m.): never let more than 3 jobs wait for the lead's review; if more than 3, start reviewing.
- Auto-resolve rule (Nik, Sun 04 Oct 11:54 a.m., memory): the coordinator resolves finished threads itself and never makes Nik type "resolve"; never resolve the factory job board thread, the Haiku V keeper thread or the ideas backlog thread.
- Nik's vision (Thu 01 Oct 8:05 p.m.): the lead is a coordinator/manager, GPT does the work, quality is "triple A game quality FIFA 17 style" with characters standing out of the menu "in a very realistic very nice way"; he can run about 5 GPT chats at once.
- Nik's goal sentence (Sun 04 Oct 12:15 p.m., memory): when the Team V board AND Team G board both reach 100%, Nik and Daniel have a working, bug-free game on the live site with the new visual pack, playable first start to finish. Done = both boards done + integration jobs 103 to 110 + review + two-player play-through + Nik's OK to merge into main.
- Nik is friendly and says thanks (Sun 04 Oct 6:08 p.m.: "Congrats to you as well ... great job"); the lead answers in kind.
- Pictures are made in a brand-new NORMAL ChatGPT chat OUTSIDE any project, one new chat per ticket. Never tell him to use a Temporary Chat any more (Nik, Mon 12 Oct 9:19 a.m.: Temporary Chats cannot make images now). (replaced: Temporary Chat steps from 02 Oct to 11 Oct)

## S03 Glossary and voice-typing mis-hearings

Nik dictates by voice. The right column is the lead's reading (a few are guesses, marked "probably").

- "job prompt", "Board", "update", "Update?" = the job board / status (Mon 05 Oct 1:52 p.m.: "make sure the board is fully updated in custom for you page"). The Custom view tab refreshes only on his Refresh click, "update the job board" or "is board updated", or a Haiku V SHA message. (memory)
- "GPT five point six", "Sol", "Sol 5.6" = GPT-5.6 Sol. "Work mode", "Work with ChatGPT" = Sol Work mode (metered, stops often). "GPT blue" = normal Sol chat; "GPT green" = Sol Work mode (lead naming from HO-008).
- "Astra" = another GPT chat Nik ran for bundles (C2W-004); "second account" = his second ChatGPT account (Sun 04 Oct 12:31 p.m.). "Fable", "Opus", "Sonnet", "Haiku" = Claude tiers (Fable rare and costly).
- "mega factory" = Team G's GPT factory (518 tickets, 126 layout studies). "studies" = hand-coded HTML layout pages, not pictures.
- "R76", "R77", "r76", "part of our 76" (Mon 12 Oct 8:42 p.m.) = live release numbers; r76 is Team G's next release; Nik said R77 will be visual (Thu 15 Oct 6:43 p.m.).
- "Thursday" = Thu 08 Oct (mockup-progress target; also the Claude weekly reset, Fri 00:00 UTC = Thu 8:00 p.m. Eastern, derived). "the old board" = board 1 (238 jobs, frozen).
- "cloud checks", "log clearness" (Sun 04 Oct 12:21 p.m., 1:25 p.m.) = the lead's checks of waiting jobs; "auto fix on" (1:55 p.m.) = check every 5 minutes and fix small failures; "the class finish" (5:17 p.m.) = the cloud session finishing (lead's reading).
- "carrier" = career; "carrier statics", "right variable a static" = Career or Rivalry Statistics (from context). "leak", "select leak", "next league" = Select League / NEXT_LEAGUE guide. "signing page/button" (Sun 11 Oct 6:30 p.m.) = Google SIGN IN on Home. "transfer bar", "transfer war room" = Transfer War.
- "premium nest" (Sun 11 Oct 6:42 p.m.) = probably "premium-ness". "Kion style" (Mon 12 Oct 9:40 a.m.), "client style" (7:30 p.m.) = probably "cyan style" (cyan-box guides). "respotorti" = repository; "padte" = paste; "confartion" = probably configuration; "envomint" = environment; "dimm" = dim; "wgoch" = which; "shell file" (Thu 15 Oct) = this shelf file.
- "the voice image" (Sun 11 Oct Loading ask): lead read it as the Marco Reus photo and asked Nik to say if not; no correction came.
- "1588 HOME", "1610 LEAGUE", "1610P LEAGUE", "1636 NEXT_LOADING", "1800 LEAGUE", "1801 KEY" = picture-drop code (ticket job + key). "release last three" (Sun 11 Oct 9:20 p.m., memory) = release Trophy Room, single cup and Standings to Team G. "go" in the Team G thread = release a held item past their safety check.
- "relay" typed in the Team G thread = Team G lead reads `LATEST.md` and acts if it is addressed to them.
- "Type next" = job numbers Nik types in new GPT chats.
- "Showdown visual" = Nik's ChatGPT project for Team V. "career mode" / "Career Mode Showdown" = Team G's ChatGPT project.
- "plate" = clean background picture (people kept, UI and words removed). "guide" = the picture with solid cyan boxes over what GPT must repaint.
- "full body" = both managers shown full length (S12).

## S04 Product truth and art rules

Product authority files: `project-documents/factory/PRODUCT_TRUTH.md` (rules numbered; §9 no state filters, §10 full bodies, product rule 10), `project-documents/product-authority/CMS_HOME_FEATURE_RECOVERY_ONLINE_REINTEGRATION_DIRECTIVE_2026-10-01.md` (OWNER-5).

People and sides:
- Daniel is always on the LEFT, Nik always on the RIGHT. In picture prompts: the man with curly hair stays LEFT, the man with the full beard stays RIGHT; never mirror or redraw them. Both managers must always be present on screens that show them. (Sun 04 Oct 2:49 p.m.; Sun 11 Oct 8:34 p.m.)
- Nik and Daniel portraits are allowed; no brand marks on them. Each phone hero pair must show both faces and upper bodies clearly (Nik, Sun 04 Oct 5:04 p.m.).
- NO player photos anywhere except the Marco Reus photo on Loading (OWNER-4, 01 Oct): real photo with the kit logos kept, credit "Marco Reus photo: Tim Reckmann · CC BY 2.0 · Cropped for display" must stay readable. Nik, Mon 12 Oct 8:33 p.m.: "keep the logo and keep the real photo".
- No real club crests or league logos, no real trophies. Originals only. Never trace real logos. "Copy the badges, never a real crest" line was added to the 13 phone marble tickets (Mon 12 Oct 7:38 p.m.).
- Crests: Nik (30 Sep) chose originals that look close to the real ones (real colours plus one redrawn theme; outline, pose, layout, text always different); rules `/mnt/project-files/visual/crests/CREST_CLOSENESS_RULES_V1.md`. CREST-V1 owner gate: kept Milan, Monaco, Barcelona; asked for toned-down flat one-colour symbols for Sassuolo, Montpellier, Empoli, Atalanta and a West Ham hammer fix (two hammers splayed, never crossed); revision brief on `claude-cloud/crest-v1` @ de515de. Do not reopen other crests unless Nik asks.
- League marks V2 (Nik, Thu 01 Oct 8:35 p.m.): Premier League A = Crown; LaLiga A = Bull; Bundesliga B = Schale (round plate); Serie A A = Shield; "League One" (he said it; the lead read Ligue 1) A = the numeral "1". Alternatives he did not pick: Lion, Sun ball, Eagle, Laurel, Rooster. Pick sheet file: `LEAGUE_MARKS_V2_PICK_SHEET.png` (the lead's reply Thu 01 Oct 8:33 p.m. linked it under `/mnt/project-files/factory/`; repo path not recorded).
- League wheel rule (Nik, Mon 12 Oct 9:40 a.m. and earlier): the gold ring/rim must NEVER cover any league name or icon; all five marks share one premium gold finish.

Scoring and results (Team G data wins; recorded 02 to 04 Oct):
- Points: Champions League 5, league 3, cup 1; performance pair max 1; awards pair max 1; season max 11. Season Results mockup showed a wrong 9 that should be 10 (Fri 02 Oct 5:02 a.m.).
- A level final total stays a DRAW (Team G data, Sun 04 Oct 1:50 p.m.). A tied season is broken by league position.
- Abandoned Showdowns do not count in history, and there is no backfill (two history answers recorded Thu 01 Oct 8:25 p.m.).
- Impossible sample numbers are not allowed (both managers cannot win the same Champions League or cup in one season; both cannot finish the same place). A shared checker was written (Fri 02 Oct 10:08 a.m.).

Screens and nav:
- Top nav (G2V-001R2): 5 tabs HOME, CAREER, STANDINGS, STATS, RULES plus a settings gear at the top right. Phone (<=900px) shows a bottom bar on hub screens only. Bottom tabs have icons: HOME house, CAREER trophy, STANDINGS three lines, STATS bar chart, RULES page. Desktop: CM17 badge then the same five tabs.
- Banned invented tabs: SQUAD, TRANSFERS, COMPETITIONS, COMPETE, PROFILE, SHOP, bell, avatar, search.
- Home = Continue (dominant), Start/Join, History, Statistics, Trophy Room, Rule Book, Settings (OWNER-5). Home keeps SIGN IN at top right on every build (Nik, Sun 11 Oct 6:30 p.m.).
- The CAREER READY / Continue Career box comes off Home completely, with create code and join; they live on the Connect Players page (HO-014; Mon 05 Oct 9:31 p.m.).
- Start/Join screen title is CONNECT PLAYERS (not the mockup's "PRIVATE REMOTE JOINING"). (Sat 03 Oct 12:07 p.m.)
- Home music: Audius player, 4 songs (`visual-assets/v10_1/home/soundtrack.js`); the YouTube-only FIFA 17 trailer is NOT carried over; no YouTube. Music should stay alive across screens (integration work).
- Transfer War wording must match the live game: "TRANSFER WINDOW LIVE · BUILD YOUR FIFA 17 SQUAD" and "REQUEST EARLY END" (job 1002, Mon 05 Oct 8:04 p.m.).
- Google Auth, billing and gameplay rules live in `AGENTS.md` (POS20); Team V does not change them.

Phone viewport targets (Nik, 01 Oct; memory `owner-phone-viewport`):
- Nik's phone: iPhone 393x852 CSS px (Dynamic Island). In Safari about 393x660 visible. Design target: every button visible, no scroll, at 393x660.
- Safety floor: 360x640 no scroll; 375x553 primary action visible. Also check 1366x640 short laptop and tablet 820x1180.
- Mockup guide pictures for phone were live r67 at 393x660 @3x padded with black bars to 2:3.

Lighting and no-filter rules: see S13. Full body rule: see S12.

## S05 Teams, roles, branches, relay, job numbering, boards

Teams
- TEAM V = visual (this project). Workers = GPT-5.6 Sol chats in the ChatGPT project "Showdown visual". The lead is a Claude thread; it is also keeper of product truth.
- TEAM G = gameplay, a separate Claude project; owns `main`, the game code and the safety checks; workers in the ChatGPT project "career mode" (lead text also says "Career Mode Showdown"); Codex is its reviewer. Team G does the merge into main, only after the two-player play-through passes and Nik says OK; Team V never touches main. (Sun 04 Oct 5:22 p.m.)
- Team G brief `project-documents/leads/TEAM_G_FACTORY_BRIEF_V2_2026-10-02.md`; data contract `project-documents/leads/DATA_CONTRACT_V1.md`.
- Roles (memory): coordinator chat = routing; factory thread (this lead) = job files, handbook, intake, relay sends, our board view; mechanical helpers = Sonnet; hard jobs = Opus (Medium); emergency = Fable (rare, long work as a Cloud brief on credit).
- Threads: factory thread "Showdown Factory job board" `cmsg_01EujkXvkVgpeb1tEe71X8oG8hzu9AH1XLWrMGPZ2vD3th`; "Haiku V board keeper" `cmsg_01EujkXvkVgpeb1tEe71X8oGXjG6H3m6rpfoWmrn5E2D3t`; ideas backlog "Claude Mods" `cmsg_01EujkXvkVgpeb1tEe71X8oG4kU9xp86zij81bbXBXBmPt` (never ahead of screen work).
- Team G lead session `session_01WtNr2MS7C9s34e26kzc17a` (used to wake them). INBOX "V" entry named `session_013pn5j1NjipzmcDNVpF7Fd3` when registered (Mon 05 Oct, memory). Team G's old bug factory session `session_01LVR7kzPPizrAjmAi8vBPQZ` is idle since Sat 10 Oct 11:35 a.m.; the INBOX "G" entry was fixed to their live lead (Sat 10 Oct 11:35 p.m.).
- If the factory thread session is ever replaced, the new one must re-subscribe to PR #312 and update INBOX.json "V" on `leads/relay` (memory; G2V-016).

Branches and PRs
- `factory/v1-wtt5ye` = all Team V work. Draft tracker PR #311 (never merge; Nik chose to stop watching its CI, Sat 03 Oct 11:13 p.m.; call unsubscribe_pr_activity(#311) after each push because a push re-subscribes).
- `leads/relay` = relay files; draft tracker PR #312 (`leads/relay` -> `leads/relay-base`, never merge).
- `factory/gameplay-v1` = Team G's factory branch (their board, V_ADOPTION.md, Haiku V keeper files). Never edit their board files.
- Other branches: `handoff/truth-keeper` (job 1047 history notes: 6 files, 121 items; Fri 09 Oct 7:53 p.m.), `claude-cloud/{transfer-tr2-plate-g,crest-v1,hlc-goals}`, `qa/bug-olympiad`, `audit/layout-auditor`, `study/job-*`, per-job `v-NNN-slug` off the factory branch; `visual/cinematic-system-v10` is stale.
- Live site: https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/ . Version 2.0 with all Team V screens live since Mon 05 Oct 1:01 a.m. (Team G note). Builds mentioned: r60 (phone Home icons), r67, r69 (League stadium black bug), r71, r72 (live 12 Oct), r75 (urgent Firebase fix only), r76 (next; marble phone + no-filters wiring).

Relay (V and G talk through the repo; Nik carries nothing)
- Files: `project-documents/leads-relay/{CONTRACT,LATEST,FEED,INBOX}.md/json`. Ids V2G-NNN (V to G) and G2V-NNN (G to V); a reply reuses the incoming number. Last numbers known: V2G-017 (Mon 05 Oct, shared board adopted), G2V-016 (relay listening). Always read the FEED.md tail for the next free number.
- Wake: GitHub action `leads-relay-ping.yml` on `leads/relay` posts one PR #312 comment per new FEED.md row (comments wake subscribers). Added Sat 03 Oct 11:26 p.m. after G2V-009 sat unanswered about 4 hours. The factory thread listens to PR #312 (woke in 2 seconds in a test, Mon 05 Oct 1:37 p.m.). Sender also nudges the other team via send_message to the INBOX session id (CONTRACT §9). Ignore our own echo comments.
- HO-025 (Sat 10 Oct 11:33 p.m.): FEED.md now gets a line for every hand-off move via `feed_sync.py`; 34 V lines and 30 G lines; rule: every hand-off change gets its feed line in the same commit.
- Hand-off tickets live in `project-documents/leads-relay/handoffs/HO-NNN_*.md` on `leads/relay`; set state with `python3 project-documents/leads-relay/tools/handoff.py set HO-NNN WORKING --by V --job V-NNN` then `DONE --by V --evidence "..."`.

Job numbering
- Old Team V jobs 0 to 124, later 0 to 135, then 0 to 242 (one number = one turn, CC-007). Board total 238 counted jobs.
- New Team V jobs after JOB-242 were V-243 .. V-247 (V-243 phone Home overlays PR #372; V-244 calm stage PR #374; V-245 visual check findings PR #375; V-246 header and footer spec PR #376; V-247 phone Home tile icons PR #381).
- SHARED COUNTER (HO-007, Mon 05 Oct 7:24 p.m.): both teams take numbers from one counter starting at 1001 (1001 = Team G Home desktop tile icons). Claim with `python3 project-documents/leads-relay/tools/claim_number.py --team V --title "..."` in a `leads/relay` checkout. Board shows "NNNN · V"; keep "V-" PR title prefix and a fenced ```progress block in the PR description (edit the description only, no push).
- Shared numbers used by V so far: 1002 (PR #389), 1006 (PR #393), 1007 (PR #394, folded into 1016), 1008 (closed, folded into 1016), 1012, 1013, 1016, 1029, 1029b, 1030, 1035 (sideways phone), 1036 (upright tablet), 1047 (history notes), 1588 (12 phone pictures), 1610 (desktop pictures), 1610P (desktop backgrounds), 1636 (Loading pictures), 1799/1800 (marble phone), 1801 (phone backgrounds). Team G numbers seen: 1591, 1635, 1652 (Full Motion), 1657 (stadium bugs r71).
- Other counters (own per label): C2S 005, S2C 005, C2W 006, W2C 002, CC 008, IMG 004.

Boards
- Shared data, two board views (Nik, Mon 05 Oct 8:47 a.m.): one data source (each V- PR progress block + the relay feed); each team keeps its own board featuring its own work first and largest, the other team smaller below. Team V board `project-documents/factory/BOARD.md` (rules `SHARED_BOARD.md`); Team G board on `factory/gameplay-v1`.
- Board 1 (238 jobs) frozen at 238/238 on Mon 05 Oct 8:46 a.m.
- Board self-updates for free via GitHub Actions (commit 486df1d, Thu 08 Oct 8:20 p.m.): rebuilds on V- PR opened/edited/closed/merged and on pushes to the factory branch; before that it had been stuck since Tue 06 Oct 10:57 a.m. The small Team G strip refreshes only when Team V has activity.
- Haiku V keeper (Nik, Sat 10 Oct 10:17 a.m.): owns `CUSTOM_VIEW_V.html/.svg` and the Team V parts of `tools/custom_view.py` (`--v`) and `tools/wow_svg.py` on `factory/gameplay-v1` (kit `project-documents/gameplay-factory/keepers/HAIKU_V_KEEPER_KIT.md`, split 6176c48d); watches `factory/gameplay-v1` and `leads/relay` every 3 minutes and messages the coordinator a new SHA plus raw `CUSTOM_VIEW_V.html` URL on real V moves; the coordinator then publishes the Team V Custom view tab (skip if only the clock changed). Custom view tab refreshes only on Nik's Refresh click, "update the job board"/"is board updated", or a Haiku V SHA message.
- Mockup board `project-documents/factory/mockup-board/MOCKUP_BOARD.md`: run-01 = 74% on Tue 06 Oct 12:11 a.m.; Nik's Thursday goal is HO-017 (S31).

## S06 Factory workflow

Setup of workers
- One-time paste (Thu 01 Oct 8:49 p.m.; Fri 02 Oct 12:06 a.m.): the box inside `project-documents/factory/FACTORY_RULES.md` (also `BOOT_PASTE.txt`, about 2,500 of 8,000 characters) goes into the Instructions of the ChatGPT project "Showdown visual" ("..." next to the name > Edit instructions); it links the public handbook `project-documents/factory/WORKER_HANDBOOK.md`. Each new chat needs GitHub on (+ > Connectors > GitHub). Delete old chats "Clarify zero request" and "Repository relay check". Test: type `0`; first line must be `Job 0 · Factory smoke test · NOT STARTED`.
- Outside the project (Sol Work mode, Codex) first message: `Factory job N. Read https://raw.githubusercontent.com/nikahanghojjati-oss/fifa17-career-showdown2/factory/v1-wtt5ye/project-documents/factory/FACTORY_RULES.md and obey the box in it as your rules, then do job N (repo nikahanghojjati-oss/fifa17-career-showdown2, branch factory/v1-wtt5ye). Ignore any older relay contract or memory.` A bare number = do `project-documents/factory/jobs/JOB-NNN.md` (three digits; four for shared numbers); `AGENTS.md` says the same.
- Job 0 result (Fri 02 Oct 3:34 a.m.): a normal chat can read the repo, save text, run Python, take screenshots and make images, but cannot save images. A Work mode worker has no browser (job 1 stuck, moved, 3:59 a.m.). Up to 5 normal chats at once; they do not use the Work meter (Sat 03 Oct 11:47 a.m.).

Job sizing and generator
- CC-007 (Fable cloud, Sat 03 Oct 9:26 p.m.): one job = one Sol turn: at most 5 reads beyond job and status file, at most 3 work files plus the status file saved last, about 200 lines, one decision, resumable from `Job N` commits (review 4 parts, fix round 3, motion 3, phone 3, build about 6). Jobs 0 to 242; parts 140+ appear when the part before is DONE. Never write "type continue" in a job; never use Work mode for factory jobs.
- Generator `project-documents/factory/tools/jobgen/gen_jobs.py` + `screens.py`: edit job text there, never `jobs/*.md` by hand; never add, remove or reorder `job()` calls (numbers come from order); change step counts only for NOT STARTED jobs. Lint `check_jobs.py` must report 0 MISSING and 0 HOLE (born from job 141, Sat 03 Oct 11:31 p.m.: Transfer War had no TRUTH.md, so one was written at `visual-assets/v10_1/tr2/slice-02-plate/TRUTH.md`; 103 jobs had `{job:...}` holes). A missing read file is a DEFAULT (BUILD_RESULT.md, TRUTH.md, PRODUCT_TRUTH.md), never BLOCKED; wrong title words = use the font and go on (Sat 03 Oct 12:07 p.m.).
- Write guard: the ChatGPT GitHub connector sometimes refuses saves; the chat stops with "Job N paused, type N in a new chat"; status file saved last; bundles retry once on HTTP 422/409. Workers save TEXT ONLY and straight to the branch (no zips, since Sat 03 Oct 8:51 a.m.); they write recipes for cut-outs and crops and the lead makes them; they do not wait on GitHub or take screenshots. Before a chat says "waits for" it re-checks the newest files (Fri 02 Oct 8:06 p.m.).
- Handbook 9b (Mon 05 Oct 7:41 p.m.): workers never delete, revert or bypass CI checks, the Physio watchdog or Team G gate files (card pasted into both ChatGPT projects).
- Phone band trap (04 Oct): shared `stage.js` clips phone art to a 46% band and starts the UI below it; phone jobs place UI in % of the whole screen (hero zone 55%): art height 55%, UI layer top 0.

Quality gate (the lead's check)
- A job is done only after the lead checks real screens and writes `Claude check: PASS <score>` or FIX via `project-documents/factory/tools/check.py` (FIX max 3 items; board shows "N (fix)"; PASS does not clear "IN PROGRESS · FIX", set State: DONE by hand when a fix landed through later parts; review/plan parts get PASS without a score). Screenshots in `project-documents/factory/evidence-claude-check/`.
- Bar (Sat 03 Oct 11:04 a.m.; `QUALITY_BAR.md`): 10 criteria scored 0 to 5 (including "characters stand out of the menu", "hands and contact", pack-rip motion); pass = average 4.2 or more, nothing under 3, plus hard gates (nine, then eleven after the 01 Oct 8:29 p.m. edit): Daniel left, no real logos, no scroll at 393x660, automatic mockup-match check, page-weight limit.
- Never intake a GPT "Job N done" for jobs reserved for another thread (Nik: 114 must be Fable's); before naming "Type next" call list_thread_sessions.
- Backlog guard (Nik, Sat 03 Oct 10:46 p.m.): routine `trig_01WAbi3RfWbpwGEDPjeyiYgZ` hourly at :52 from 7:52 a.m. to 1:52 a.m. runs `project-documents/factory/tools/waiting.sh`; more than 3 waiting, or one over 2 hours, means check now; else silent. (replaced: every 2 hours from Sat 03 Oct 8:28 p.m.) Temporary fast polling: Sun 04 Oct 1:25 p.m. every 5 minutes for an hour; 1:55 p.m. "auto fix on" for 3 hours (until 4:56 p.m.). Since Sat 10 Oct it also checks `study/job-*` branches (S30).

Who does which job
- GPT FIRST (HO-008, Mon 05 Oct 7:33 p.m.; widened 7:41 p.m.): until Nik says otherwise every GPT-capable job goes to GPT blue (normal Sol chat, CSS/text) or GPT green (Sol Work mode, logic with node tests); Sonnet only if GPT cannot; then Opus; Fable rare. The lead does not fix new bugs itself; pictures go to Nik first; done only after lead screenshots at phone and desktop. `project-documents/factory/BUG_FACTORY.md`. First job 1002 (GPT blue, first try, merged 273115c). GPT cannot see pictures, so re-cutting art goes to Sonnet or Opus (1016 to Sonnet).
- Fable audit CC-006 (Sat 03 Oct 10:27 to 10:56 a.m.) rewrote 70 unstarted jobs (`handoffs/CC-006_BUILD_RESULT.md`); Nik started two sessions by mistake, the second saved nothing but found a generator bug.
- Bundles (Sun 04 Oct): `handoffs/C2W-004_ASTRA_LEGACY_BUNDLE.md` (Legacy jobs) and `handoffs/C2W-005_SOL61_BUNDLE.md` (11 jobs). Stops were save collisions (422/409), one caused by the lead editing `season-results.css` mid-bundle: never edit a screen a running bundle owns.
- Claude took 15 hard jobs (Sun 04 Oct 2:12 p.m.): 104, 214 to 220, 105, 221 to 226. Owners (3:36 p.m.): Opus thread 109, 234, 235, 110, 236; Sonnet thread 237 to 239; GPT 232, 233. Nik changed at 3:48 p.m.: job 108 (final review) is done by the Opus thread, not Codex.

## S07 Timeline of big moments

- Thu 01 Oct 8:05 p.m. Nik asks for the manager-style automated factory; 8:35 p.m. league marks picked. Fri 02 Oct: worker boot box (12:06 a.m.), job 0 done, 25 early pictures passed. Sat 03 Oct: Fable audit (10:27 a.m.), quality gate live (11:04 a.m.), jobs re-split to 238 (about 9:26 p.m.).
- Board counts: 30/135 (Fri 02 Oct 3:06 p.m.); 87/135 (Sat 03 Oct 9:00 p.m.); 157/238 (10:51 p.m.); 200/238 (Sun 04 Oct 1:08 p.m.); 220/238 (2:42 p.m.); 238/238 (4:23 p.m.).
- Sun 04 Oct: Nik's visual critique 5:04 and 5:10 p.m.; approved visually 6:07 p.m. and shipped to Team G (S08). Mon 05 Oct: v2.0 live 1:01 a.m.; shared counter 7:24 p.m.; bug factory 7:33 p.m. Tue 06 Oct: mockup board 74%; Mockup Lab dropped 1:07 a.m.
- Thu 08 Oct 8:20 p.m. boards self-update; Sat 10 Oct phone picture tickets (1588); Sun 11 Oct desktop premium pictures (all 16 approved by 9:19 p.m.); Mon 12 Oct 10:07 a.m. 14 desktop plates; 8:44 p.m. 17 marble phone pictures; 8:42 p.m. no-filter rule; 9:26 p.m. full body ruling; 10:11 p.m. 15 phone plates. Thu 15 Oct 6:43 p.m. thread transition (S36).

## S08 Final polish CC-008 and shipping to Team G

- Board hit 238/238 Sun 04 Oct 4:23 p.m.; brief `project-documents/factory/handoffs/CC-008_FINAL_POLISH.md` (commit bde2172a): one cloud session on claude.ai/code, repo `nikahanghojjati-oss/fifa17-career-showdown2`, branch `factory/v1-wtt5ye`, Opus High, $15 cap, about an hour. Paste: `Fetch branch factory/v1-wtt5ye of nikahanghojjati-oss/fifa17-career-showdown2 and follow project-documents/factory/handoffs/CC-008_FINAL_POLISH.md exactly.` If already started: `Pull factory/v1-wtt5ye again: the brief now has a Part A from Nik's review. Do Part A first, then Part B; skip the text notes (C2W-006 does them).`
- C2W-006 (text-only GPT-5.6 Sol chat): `Do project-documents/factory/handoffs/C2W-006_SOL_PACKAGE_NOTES.md on branch factory/v1-wtt5ye of nikahanghojjati-oss/fifa17-career-showdown2.` Wrote home/league/club TRUTH.md, loading/BUILD_RESULT.md, PACKAGE.md, HANDOFF_TO_SOL.md (Sun 04 Oct 5:21 p.m.).
- Nik's review 1 (Sun 04 Oct 2:48 p.m.): desktop good except League (ring covered about 70% of logos; lead fixed in 2cdb1a20). Review 2 (5:04 and 5:10 p.m.) became Part A: A1 Home phone empty band used for the music player; A2 League phone wheel below both heads; A3 Club phone Nik about half size, side by side, both packs; A4 Transfer phone Daniel's face clear, clean top; A5 Rivalry desktop washed-out lighting; A6 Career Statistics phone title off faces; A7 Legacy phone Daniel closer; A8 Loading desktop a little more gold (optional). Approved as is: desktop Home, League, Club, Transfer, Loading; Settings, Rule Book, Legacy, Trophy Room, Standings, Final Winner, Season Results, Connect Players (Legacy: Daniel "a little bit out there ... in center" on mobile, minor).
- Result (Sun 04 Oct 6:05 p.m.): landed as 5e05a1f7 (17 items, PASS); lead re-took pictures and confirmed A1 to A8 (`handoffs/CC-008_RESULT.md`); 17 changed files sent as READY TO WIRE (V2G-015, bcab6aba). Three accepted leftovers: S35.
- Ship decision (Nik, Sun 04 Oct 6:07 and 6:08 p.m.): "I approve it visually now"; relay V2G-016 told Team G "wire all 15 screens as they are". Nik ignored a few tiny visual errors on purpose: "we will come back afterwards and fix those"; lead: "just list what you spotted and I'll turn it into jobs."
- Meaning of approval: Team G can build it in now; NOT live until Team G finishes wiring (G-13), Nik and Daniel play one full Showdown, and Nik says OK; then Team G merges to main. Nik's step: type `relay` in the Team G thread and keep running their job numbers in the ChatGPT project "Career Mode Showdown".
- Board 2 ideas (Nik, Sun 04 Oct 5:19 p.m.; lead advised waiting): more polish and bug fixes; more motion (screen changes, score count-ups, trophy moments); more pack openings; a FIFA Ultimate Team draft-style moment where each manager sees 5 cards and picks one (needs Team G for the rules).
- Visual QA after ship (Mon 05 Oct 12:20 p.m.): 20 differences live 2.0 vs approved frames, 19 were Team G wiring (black side bands on Stats, Trophy Room, Rivalry, History; old Loading; Home showing 4 of 7 tiles; old player card on Season Results). `handoffs/HO-004_FINDINGS.md`.

## S09 Mockups: desktop NEXT_* and phone PHONE_* (approvals with dates)

Where and what
- Folder `project-documents/factory/mockups/` holds ONLY `NEXT_<KEY>.png` (desktop) and `PHONE_<KEY>.png` (phone), one target per screen. Old `GOAL_*` and `MOCKUP_*` were moved to `mockups/archive/` and marked retired (Mon 12 Oct 8:44 a.m.; Nik said the PHONE_ pictures stay without a marble redo at 8:41 a.m., later replaced by the marble phone decision, S11).
- Keys: HOME, CONNECT_PLAYERS, SEASON_RESULTS, TRANSFER, LEAGUE, CLUB, STATISTICS, RIVALRY, LEGACY, TROPHY_ROOM, SETTINGS, FINAL_WINNER, RULE_BOOK, STANDINGS, LOADING, TROPHY_ROOM_SINGLE. Desktop = 16 pictures, phone = 16 pictures (Mon 12 Oct 5:42 a.m. edit).
- How the pieces fit (Mon 12 Oct 5:43 a.m.): Nik's pictures are the TARGET; the mega factory "studies" are real coded pages that copy a picture at real sizes; the lead adopts good studies; Team G builds adopted studies into the live game. Build order (Nik, Mon 12 Oct 5:45 a.m.): DESKTOP first, phone after. "I already decided that the desktop mockup is gonna go first."
- Mockup Lab (an earlier ChatGPT project making APPROVED_NN pictures) was DROPPED by Nik on Tue 06 Oct 1:07 a.m. (ChatGPT could not finish it). Never ask for APPROVED_NN pictures.
- Picture-drop codes: phone `1588 <KEY>`; desktop `1610 <KEY>` (not 1591, Team G used it, Sun 11 Oct 12:27 a.m.); Loading `1636 PHONE_LOADING` / `1636 NEXT_LOADING`; Rule Book and Standings phone kept `1588 RULE_BOOK` / `1588 STANDINGS`.

How the "Use studies" decision settled (replaced: earlier "studies replace my mockup tickets")
- Sat 10 Oct 11:22 a.m. Nik chose "Use studies" on a card. At 11:33 a.m. the lead found that none of Team G's 518 tickets makes pictures (the 126 studies are hand-coded HTML), said so, and Nik chose to have Team V write picture tickets. Team G (HO-024, Sat 10 Oct 11:35 a.m.) aimed all 126 studies at `PHONE_<KEY>.png` / `NEXT_<KEY>.png` and held them until released. Release = lead sends the Team G lead "PHONE_<KEY> approved"; it lands in `queue/PICTURES.json` approved.PHONE/NEXT on `factory/gameplay-v1`.
- Phone guides: live r67 at 393x660 @3x padded with black bars to 2:3 (`tickets/attach/PHONE_1588_guides.json`); tickets `tickets/TICKET-1588_<n>_OF_12_PHONE_<KEY>.md`, guides `tickets/attach/GUIDE_PHONE_<KEY>.png` (commit a5d7b507). Intake: crop bars, gate-check likeness, text, fit, no crests, save `mockups/PHONE_<KEY>.png`, send Team G the approval.

Phone pictures approved (1588 series)
- First try: HOME Sat 10 Oct 11:54 a.m. (big tile art like desktop); CONNECT_PLAYERS 11:58 a.m.; SEASON_RESULTS 12:01 p.m. (badge is our own art); TRANSFER 12:05 p.m.; STATISTICS 12:58 p.m.; RIVALRY 1:04 p.m. (picture lit STANDINGS, live tab is STATS, Team G keeps live); LEGACY 11:08 p.m.
- LEAGUE try 3, 12:25 p.m. (try 1 copied the live flaw, rim hid the marks; try 2 centre crown repeated Premier League and marks mismatched; try 3: one gold set, crown only in Premier League slice, gold football hub). CLUB try 2, 12:48 p.m. (try 1 dozens of glary spotlights). TROPHY_ROOM try 2, 11:15 p.m. (needed Champions League tab, four trophies, one condensed font, cinematic niches).
- Approved 11:23 p.m.: TROPHY_ROOM_SINGLE (10B), SETTINGS (asked Team G to use the game font for DANIEL & NIK and CAREER MODE SHOWDOWN), FINAL_WINNER (after a button-only fix prompt in the same chat). Four high-res trophies (10C) 11:31 p.m.: used the FIRST League Title (second had solid gold background), cut each out, repaired three crown tips on Showdown Champion; preview `mockups/trophies/PREVIEW_1536_CUTOUTS.png`.
- Sun 11 Oct: RULE_BOOK 3:18 a.m. (after the no-invention rewrite, S33); LOADING 3:40 a.m. (the SECOND of two; calmer lighting, square-corner label, face clearer); STANDINGS 3:53 a.m.
- Live trophy art is only 341 x 512 px, too blurry to show big; each tab already shows only its trophy but small (Sat 10 Oct 11:17 p.m.).

Desktop pictures approved (1610 series; first "plain" versions, then premium reruns)
- NEXT_HOME: first Sun 11 Oct 1:51 a.m. ("More Than A Game" tag dropped, fine); premium 6:56 p.m. (marble lounge, gold columns, SIGN IN visible top right, real gold CONTINUE CAREER tile).
- NEXT_RULE_BOOK: first 4:00 a.m. (lead repainted card 06 lines; banner "SAME AMBITION" vs real SAME PASSION); premium 8:29 p.m. (repainted "remembered"; gold BACK TO MAIN MENU).
- NEXT_LOADING: first 3:50 a.m.; premium 8:25 p.m. (black-marble tunnel, gold veins, heavy gold CM 17 badge).
- NEXT_CONNECT_PLAYERS: first 6:31 p.m.; premium 6:54 p.m. (dash in "DANIEL - START" is wrong, Team G keeps the real dot; CHOOSE SEASONS big gold button).
- NEXT_SEASON_RESULTS: first 6:33 p.m.; premium 6:58 p.m.
- NEXT_TRANSFER: premium 8:32 p.m.; NEXT_CLUB and NEXT_STATISTICS: premium approved by 8:49 p.m.; NEXT_RIVALRY and NEXT_LEGACY: 8:59 p.m.; NEXT_LEAGUE: 9:02 p.m.; NEXT_FINAL_WINNER: 9:08 p.m.; NEXT_SETTINGS: 9:11 p.m. (after rebuild, S14); NEXT_TROPHY_ROOM and NEXT_STANDINGS: 9:15 p.m.; NEXT_TROPHY_ROOM_SINGLE: 9:19 p.m. (all 16 approved).
- Nik's 6:42 p.m. order: rewrite every desktop ticket at the premium level (marble, smoked glass, brushed gold, gold-leaf title, polished-gold main button); the 4 earlier approved stay targets until replaced. Rewritten 6:43 p.m. at the same links (S33).
- At 9:18 p.m. Nik said: if you have all the mockups, tell Team G they are all approved and I will check with the Team G lead. Release of the last three: Trophy Room, Trophy Room single, Standings (9:20 p.m. "release last three", memory; the lead's early Mon 12 Oct 5:42 a.m. line that these still waited was corrected at 5:43 a.m.).
- Each Trophy Room tab should open ONLY that one cup, big and sharp, using Nik's high-res cups (Nik, Sun 11 Oct 9:13 p.m.: "if we press on each section it would show that one cup in a better resolution and that one cup only"); the four high-res cups are in the repo; no more assets needed.

## S10 Premium plates 1610P (desktop backgrounds)

- Why: Team G noticed live r72 still used the old V1 stadium backgrounds because no clean version of the premium NEXT_ pictures existed (people kept, UI and words removed) (Mon 12 Oct 8:41 a.m.).
- Tickets `project-documents/factory/tickets/TICKET-1610P_<n>_OF_14_<KEY>_PLATE.md`, index `TICKET-1610P_README.md` (commit abeba81a8). Guides `tickets/attach/GUIDE_<KEY>_PLATE_V2.png`: the 1536x864 NEXT picture with solid cyan rectangles over UI, pasted at y=80 on a 1536x1024 black canvas. Mask rects in `project-documents/factory/tools/plates_v2/masks.py` (M[KEY], LOCK entries).
- Drop code `1610P <KEY>`. Home ticket waited for Nik's pick between marble lounge and trophy hall; Nik picked MARBLE LOUNGE (Mon 12 Oct 8:38 a.m., memory); Home ticket ready 8:44 a.m. (commit 1e41f8664).
- Kept on purpose in plates: managers, banners, name tags, League marble plinth, empty Trophy Room and Final Winner pedestals, Club packs with badge circles blanked.
- Intake: (1) likeness lock because GPT redraws faces slightly and shifts about 15 px: `python3 project-documents/factory/tools/plates_v2/lock.py KEY raw.png "<rects from masks.py M[KEY]>"` ORB-fits the GPT picture onto NEXT_<KEY> (resized 1536x864) and takes GPT pixels only inside the cyan rects grown 12 px, feathered 5 px; (2) check no UI left outside rects, no cyan, no new words, Daniel LEFT; (3) save `visual-assets/v10_1/plates-v2/ENV_<KEY>_PLATE_V2_1X.webp` (1536x864) and `_2X.webp` (3072x1728, Lanczos); (4) commit, push, unsubscribe PR #311; (5) send the Team G lead the path; (6) reply to Nik with the GitHub link. `plates-v2/README.md` lists each plate.
- Try numbers and times (Mon 12 Oct): HOME passed 9:12 a.m. (commit 80053ccfd; ChatGPT redrew faces slightly so only its new background was kept); CONNECT_PLAYERS try 1 failed 9:13 a.m. (whole screen redrawn), try 2 passed 9:16 a.m. (9920e95e9); SEASON_RESULTS try 1 failed (old chat redrew whole screen), try 2 passed 9:29 a.m. after memory was turned off and a new chat (4dead3662); TRANSFER try 1 passed 9:39 a.m. (8fa44bb6d); LEAGUE try 1 failed 9:42 a.m. (drew whole screen again), try 2 passed 9:47 a.m. (4884f47b8); CLUB try 1 passed 9:49 a.m. (33d16c9f5; faint "CLUB PACK" words cleared); STATISTICS try 1 passed 9:51 a.m.; RIVALRY try 1 passed 9:56 a.m. (a second version had thin paste lines across the men and windows; the saved first one was kept, 9:55 a.m.); SETTINGS try 1 passed 10:02 a.m. (empty penthouse lounge); LEGACY and TROPHY_ROOM try 1 passed 10:03 a.m.; RULE_BOOK passed 10:06 a.m. after banner PASSSION was fixed to PASSION with `tools/plates_v2/fix_rule_book_banner.py`; FINAL_WINNER and STANDINGS passed 10:07 a.m. All 14 done 10:07 a.m. (commit f741ce0ce, 10:10 a.m.). Team G swaps V1 plates for these.
- Nik's feedback during the batch (Mon 12 Oct): 9:19 a.m. use a normal chat (Temporary Chat has no image tool), prompts should ask background only; 9:21 a.m. how to turn off ChatGPT chat-history memory (lead 9:22 a.m., corrected 9:24 a.m.: switch off only "Enable memory", the blue switch at the top of "ChatGPT memory", then a new chat per ticket; turn on after); 9:40 a.m. rim still blocks logos and the League guide is not cyan style; 9:55 a.m. "which one is better?"; 7:30 p.m. only background? use cyan style (worked better), memory off.
- The League plate has no wheel at all; the live game draws the wheel on top. Nik's rule (gold ring never covers a name or symbol) was sent to Team G (Mon 12 Oct 9:42 a.m.).
- Per-screen BANS list added to the prompts after the League try 1 failure (commit b357af56c). Tickets rewritten 9:25 a.m. (be9e3c15c): a normal new chat, an empty-background-only prompt, and the check fails any returned UI.

## S11 Marble phone mockups, HO-026 (tickets 1799 and 1800)

- Decision: Nik 12 Oct 4:34 p.m., refined 5:52 p.m. (via Team G HO-026 sent 5:55 p.m.): phone, sideways and tablet get EXACTLY the desktop marble look (`plates-v2` / `NEXT_*`), no glass, nothing new; desktop unchanged; new file names only (V2/V3), never overwrite V1. Lands in r76 (r75 = urgent Firebase fix only).
- Nik's rule at 5:58 p.m. (memory): no double work; each MARBLE mockup keeps the approved PHONE_ layout exactly (same panel positions, sizes, order); only the art changes. Never redesign a layout.
- Two-step process (lead explained Mon 12 Oct 7:35 p.m.; Nik 7:36 p.m. "I understand the process better now and I approve it"): Step 1 full marble phone mockup (target Nik approves, Team G copies) -> Step 2 background-only plate (cyan-box guide; game draws its own words and buttons because they change and must be tappable and sharp).
- Ticket pictures: Picture 1 = `PHONE_<KEY>.png` (layout), Picture 2 = `NEXT_<KEY>.png` (look and men). Result = `mockups/PHONE_<KEY>_MARBLE.png`.
- Tickets: 1799 (3 samples: Home, Season Results, Final Winner; files `TICKET-1799_<i>_OF_3_PHONE_<KEY>_MARBLE.md`) at 5:59 p.m.; 1800 (13 more, `TICKET-1800_<i>_OF_13_PHONE_<KEY>_MARBLE.md`, index `TICKET-1800_README.md`, commit dbfc4bb6b) at 7:36 p.m.; 11B Settings lower part `TICKET-1800_11B_PHONE_SETTINGS_2_MARBLE.md` at 8:27 p.m. Drop code `1800 <KEY>` (Home/SR/FW used 1799).
- Approved, Mon 12 Oct: HOME 7:31 p.m. (353d6bf67); SEASON_RESULTS 7:38 p.m. (lead replaced a GPT badge that looked like the real Arsenal cannon with our own yellow badge; GPT put the four checkboxes in one column instead of 2 by 2, left because the game keeps 2x2); CONNECT_PLAYERS 7:40 p.m.; LEAGUE 7:50 p.m.; CLUB 7:58 p.m. (GPT put badges on packs, fine); TRANSFER 8:02 p.m.; STANDINGS 8:06 p.m.; RIVALRY 8:10 p.m.; LEGACY 8:14 p.m.; TROPHY_ROOM 8:16 p.m.; RULE_BOOK 8:23 p.m.; SETTINGS top part 8:27 p.m.; LOADING 8:30 p.m. (look target only: GPT redrew Reus, S15); SETTINGS_2 lower part 8:34 p.m.; TROPHY_ROOM_SINGLE 8:39 p.m.; FINAL_WINNER and STATISTICS 8:44 p.m. = all 17 (commit f4426ace1).
- Nik's 8:25 p.m. catch: phone Settings had no Delete Current Showdown. The old phone picture predated Delete and Full Motion (lead's mistake: the ticket copied only the old picture). Phone Settings scrolls, so it has two pictures; Team G told the phone sheet must show all four cards.
- Superseded: Team V first told Team G to re-cut `OVL_<KEY>_{DANIEL,NIK}_PHONE_V3` manager cutouts; later told NO V3 cutouts (new plates already contain both men; drop old `OVL_*_PHONE`) (Mon 12 Oct 10:20 p.m.).
- Sideways and tablet: no new ChatGPT art; sideways (852x393 split hero box, managers left, right 55% calm) and tablet portrait reuse the phone plate (object-position top); tablet landscape uses the desktop PLATE_V2 (told Team G Mon 12 Oct 10:20 p.m., memory). Team V part of HO-026 DONE then; Team G wires in r76 with `live_facecheck`.
- A note must go into `V_ADOPTION.md` saying which phone, sideways and tablet studies are re-approved in marble (line f0c80edfa).

## S12 Phone plates 1801, full body rule, face and head checks

- Tickets (Mon 12 Oct 8:47 p.m., commit 71935c31d): 15 phone background tickets `TICKET-1801_<i>_OF_15_<KEY>_PHONE_PLATE.md`, index `TICKET-1801_README.md`, guides `tickets/attach/GUIDE_<KEY>_PHONE_V2.png`, tools in `project-documents/factory/tools/phone_plates/{masks,guides,tickets}.py`. Drop code `1801 KEY`. Cyan covers only buttons, cards and words; both men stay.
- Output: `visual-assets/v10_1/plates-v2/ENV_<KEY>_PHONE_V2.webp` at 1179x2096 (crop to 0.5625). Loading = empty tunnel (Team G puts the real Reus photo on top); Trophy Room single and Settings part 2 reuse their screen's plate; Settings plate serves both parts.
- Full body ruling (Nik asked the lead to judge, Mon 12 Oct 9:23 p.m.; answered 9:26 p.m.): show BOTH managers full length on every screen that has them. Why: game cards and buttons cover the lower half anyway; a half-cut man leaves a hard line or fade that peeks through gaps on taller phones (pasted-sticker look); whole men also feed the sideways and tablet backgrounds. Natural "half" cases only where a real object is in front: Transfer desk (seated), League round plinth (men stand BEHIND it), Trophy Room and Final Winner pedestals (men stand behind). Settings, Rule Book, Loading have no men. Tickets regenerated (8e756fbeb).
- Nik's later wording: "make sure no more faded or cut design comeback to game in screens that body exist" (Mon 12 Oct 9:43 p.m.). Lead: bodies hidden behind cards, tab bar, desk or plinth are fine; only senseless fades or cuts in open space are blocked (9:45 to 9:46 p.m.). Written as PRODUCT_TRUTH §10 (product rule 10).
- Faded-body bug (Nik 9:41 p.m., lead fixed 9:42 p.m., the lead's own mistake): the lock tool copied everything around the game boxes from the approved mockup, so League's outer body halves came from the old faded mockup. Fix in `lock.py` (9:45 p.m.): keep ONLY the two approved heads (face, hair, chin) from the mockup; everything else (full bodies, floor, room) is Nik's GPT picture. Redone for the 6 finished plates.
- Empty screens never get a head (Loading fix, 10:11 p.m.: the tool had found Reus's face and tried to paste it into the empty tunnel).
- Face check (Nik 9:34 p.m.; built 9:35 to 9:40 p.m.): `facecheck.py` finds both faces per screen and checks (1) no button, card, title or tab bar touches a face, (2) both faces stay on screen on iPhone shape even at the sides, (3) on the finished plate faces sit where they are in the approved mockup. All 12 screens with managers pass. Pictures `reviews/PHONE_PLATES_FACE_CHECK.png`, `reviews/PHONE_PLATES_ALL_15.png`.
- Live check `project-documents/factory/tools/phone_plates/live_facecheck.cjs`: opens the real game screen at 4 phone sizes, measures every real box, screenshots with faces outlined (clean on live Home: `reviews/LIVE_FACECHECK_HOME_PHONE.png`; other screens need a game in progress, Team G has the setup); also fails if any live manager is faded, cut in open space, see-through or dimmed (flags fade masks, clip, opacity, filters). Zones `plates-v2/PHONE_FACE_ZONES.json`. Given to Team G for r76 with main's fade spots `v10Setup.css:628`, `v10Transfer.css:91-109/291` (League, Club, Start; Transfer War).
- Head vs body check (Nik 9:47 p.m.; lead 9:49 p.m.): 12 heads on 6 screens measured: position under 1 px, tilt under 0.15 degrees, size under 0.4%, brightness under 2%. The tool now snaps each approved head onto its body and flags more than 2 px, 0.5 degree, 1% size or 6% brightness (tested with a 3 degree tilt and 4% growth). Close-up `reviews/PHONE_PLATES_HEAD_BODY_CLOSEUP.png`.
- Done list (Mon 12 Oct): HOME 9:04 p.m.; CONNECT_PLAYERS 9:06 p.m. (also fixed a seam across the men's legs on Home); SEASON_RESULTS retry 9:13 p.m. (first failed 9:08 p.m.: men cut at the waist; fix prompt: continue both bodies below that line in the same black suits); TRANSFER 9:13 p.m. (redone with approved faces 9:26 p.m. after a tool bug); LEAGUE 9:31 p.m. (try 1 men faded at waist; try 2 legs in front of plinth; fix prompt "Almost right. Keep both men full length, but they must stand BEHIND the round marble plinth ..." pasted in the chat that made the second picture, Daniel pointing and Nik hand on chin); TROPHY_ROOM 9:37 p.m.; FINAL_WINNER 9:51 p.m.; CLUB 9:55 p.m.; STATISTICS 9:57 p.m.; RIVALRY 10:00 p.m.; LEGACY 10:03 p.m. (GPT turned Nik's eyes sideways; final uses the approved head); SETTINGS 10:05 p.m.; STANDINGS, LOADING, RULE_BOOK 10:11 p.m. = all 15 (commit 7eb67d35c). Handed to Team G with face-safe areas and the check.
- Nik, 9:50 p.m. "do you have better version of this page? or I have not sent this page to you yet?" = the Final Winner picture was the first sent.

## S13 HO-027 no state filters and anti-flash

- The rule (Nik, Mon 12 Oct 8:42 p.m., "a very important rule"; also 8:52 p.m.): NO transparent, dimmed, greyed, blurred or dark-shadowed managers (loser, signed out, waiting) and NO dark or grey overlay on any screen for a signed-out, empty or locked state. Signed-out = the normal screen with the state said in words and buttons; the loser looks exactly like the winner. He saw it on Legacy, Career and Settings; Final Winner dims the loser. Tell Team G; r76 (HO-027, top priority).
- Clarified (Nik 8:48 p.m.): NOT "full brightness". The good signed-in look (natural lighting on skin and clothes, matching environment and reflections) is the target and does not change; only state filters go, safely. Wording became "same natural lighting, never dimmed" in Team G's ticket, our rules and picture tickets. Nik 8:52 p.m.: match the good desktop look; the only signed-out screen he knew that dims managers is Final Winner. Lead found more: Trophy Room (unwon cup greyed), Legacy (stopped Showdown card faded), phone shadow overlays on Rivalry and Legacy (dark fade at bottom), dark blurred oval near the men on Career Statistics and Rivalry phone.
- Sources (lead, 8:50 p.m., from live code): "empty state" and "loser" styles added by builders on both teams. Career Statistics: dark band, faded tiles, hides the managers picture; Trophy Room: centre trophy fades to 30%, unwon cups greyed; Final Winner: loser see-through and darker (greyer on phone); Legacy: unfinished cards faded and greyed; Home: unusable tile pictures grey and faded. Not tied to Full Motion, Reduce Motion or the flash fix.
- Keep list: quick fade-in when a screen loads (stops the flash), soft shadows under the men, the darker backdrop behind a popup like "Delete Showdown?", the desktop's own soft shadows and rim lights. A button that cannot be pressed yet stays a little faded (Nik 8:52 p.m.: "yes a faded button that is not ready for press makes sense"; only buttons, never pictures).
- Anti-flash (Nik 9:03 p.m. concern): flash-guard lines stay untouched; Team G tests cold load and moving between screens, desktop and phone, before shipping; shows before/after screenshots signed in and out; the signed-in look must stay identical.
- Lighting reference Nik approved at 8:57 p.m. ("this is good lighting reference most of desktop pages are already good lighting"): `project-documents/factory/reviews/LIGHTING_REFERENCE_LIVE_HOME_DESKTOP.png`. Words used: warm gold light from stadium and room falls on both men equally; natural highlights and soft shadows; neither man lighter, darker or greyer; nothing laid over them.
- In picture tickets: both men same natural lighting; reject mockups or studies with dimmed people; flag code opacity/filter/overlay on managers or plates. `PRODUCT_TRUTH.md` §9.

## S14 Full Motion, Settings and Delete Current Showdown

- Full Motion is approved: Nik OK'd it on Sun 11 Oct (memory says Team G built it in job 1652; draft PR #691; not live as of Sun 11 Oct 9:05 p.m.). Settings offers three choices: Follow Device, Full Motion, Reduce Motion. (Nik asked at 9:03 p.m. whether it was real and approved; lead confirmed 9:05 p.m.)
- Nik's earlier catch (Sun 11 Oct 8:50 p.m.): the Settings mockup missed Delete Current Showdown and other live parts. Cause: with no saved Showdown the live site hides the Delete button, so the first guide showed only the top of the Showdown Data card. New guide shows a saved Showdown and the whole card: Current Showdown, History, a red DELETE CURRENT SHOWDOWN button, OPEN HISTORY & BACKUP and the note, word for word.
- Final desktop Settings (approved Sun 11 Oct 9:11 p.m.): three motion choices with Full Motion selected plus the whole Showdown Data card; one garbled sentence ("Starting over closes only...") repainted with the real words; Team G told the whole card must fit on screen without scrolling.
- Phone Settings (Mon 12 Oct 8:25 to 8:34 p.m.): two marble pictures. Top part `PHONE_SETTINGS_MARBLE.png` (Account, Application); lower part `PHONE_SETTINGS_2_MARBLE.png` (Motion & Feedback with FULL MOTION highlighted; Showdown Data with red DELETE CURRENT SHOWDOWN). Nik's words at 8:25 p.m.: Delete current showdown is "very important button that should exist".

## S15 Loading screen

- Marco Reus exception (OWNER-4, 01 Oct): ONLY Loading uses a player photo; the live Loading layout has Reus on the left, credit bottom left. Keep the credit readable but subordinate; never remove it during cleanup.
- Nik, Mon 12 Oct 8:33 p.m.: keep the REAL photo with the kit logos. Lead's legal summary (8:31 p.m., not a lawyer): photo is CC BY 2.0, which allows changed versions with credit saying it was changed ("Edited"); it does not cover Reus's own right to his face or the BVB, Puma and Evonik logos; an AI redraw also changes his face; advice: keep the real photo.
- Loading has no mockup picture of its own in the old set (job 11): reference was the live Loading screen (Fri 02 Oct 5:26 a.m.). Jobs 54 to 56 passed (Sat 03 Oct 11:06 a.m.): crop the same Reus photo, keep face and as much as fits on phone, no ball, no other Reus picture.
- Pictures: tickets `TICKET-1636_1_OF_2_PHONE_LOADING.md` and `_2_OF_2_NEXT_LOADING.md` (Sun 11 Oct 2:47 a.m.; keep Reus and credit, same layout, no Nik/Daniel, gold brush title). Premium NEXT_LOADING = black-marble stadium tunnel with gold veins, heavy gold CM 17 medallion, gold-framed plaque, gold loading bars (Nik asked 6:57 p.m. whether it was rewritten; done at the same link).
- Team G builds Loading after the screen-transition fix (JOB-1635) so they do not clash (lead, Sun 11 Oct 3:50 a.m.).
- Marble phone Loading `PHONE_LOADING_MARBLE.png` is a LOOK TARGET only (GPT redrew Reus). The game keeps the real photo layered on the empty tunnel `ENV_LOADING_PHONE_V2` (Mon 12 Oct 8:30 to 8:33 p.m.).
- Nik, Sun 04 Oct 5:10 p.m.: Loading looks fine; desktop could get "a little bit more golden theme", not required; done as CC-008 A8 (warmer, more gold, Reus photo and credit unchanged; confirmed 6:05 p.m.).

## S16 Home

Dates of picture approvals, plates, marble phone and phone plates for every screen are in S09 to S12 and are not repeated below.

- SIGN IN (Google) must be on Home, top right, on every build (Nik, Sun 11 Oct 6:30 p.m.: "that's very important"). Already in the approved Home picture; Team G told it is required.
- Home = Continue (dominant), Start/Join, History, Statistics, Trophy Room, Rule Book, Settings. The CAREER READY / Continue Career box, create code and join come OFF Home (HO-014).
- Phone Home shows all 7 tiles, three to a row; each name sits at the top and the icon sits fully inside the tile at lower right (Team G changed the design slightly, lead accepted Mon 05 Oct 2:42 p.m.; proof `evidence-claude-check/HO-006/r60_home_393x660.jpg`). Lead offered to redesign as big centred icons if Nik prefers (no answer recorded). Earlier Nik wording (memory, 05 Oct): big art filling the right side of each tile, centred vertically, fully inside, never tiny and clipped in a corner.
- Phone ghost coat fixed (V-243 / HO-005, PR #372; `evidence-claude-check/V-243/before_after_390x844.jpg`).
- Nik's phone notes (Sun 04 Oct 5:04 p.m.): empty dark band under Settings / Rule Book / Trophy Room (use it, maybe for a song player: done, music card sits there) and the select link covering his and Daniel's hair (push down: done in CC-008).
- Desktop study 1086 adopted Sun 11 Oct 7:55 a.m. with two fixes: put back the CM17 badge and SIGN IN, stop tile art covering tile names on small laptops. Plate is the marble lounge.
- Tablet: Home tablet keeps Team V's design (no change agreed, Sat 10 Oct 11:56 p.m.); tablet layout job 1036 moved the Home title off the faces (Thu 08 Oct 11:44 p.m.).
- Music: Audius, 4 tracks; YouTube trailer dropped; keep audio alive across screens (integration).
- Filter to remove in live code: tile pictures grey and faded when a tile cannot be used (S13).
- Job 32: a text line on the Continue tile cut off; passed Sat 03 Oct 1:41 p.m. Home has no TRUTH.md until C2W-006 wrote one (Sun 04 Oct).

## S17 Connect Players

- Title is CONNECT PLAYERS in the display font (comment TODO-WORDMARK); brush picture ticket `tickets/TICKET-124_6_OF_6_TITLE_CONNECT_PLAYERS.md` (later `shared/wordmarks/TITLE_CONNECT_PLAYERS_V1.webp`).
- Create code / Join gets its own screen (job 1013, designed like Host and Join private session); today the box sits on Home from `js/persistentNikDanielPair.js:319`. Team G moves the code; Team V checks (Mon 05 Oct 9:29 p.m., HO-014 at 9:31 p.m.).
- "Session ended" after the last season is wrong (`js/sharedJourneyReconnect.js:159` treats a closed session like an expired one); should say the Showdown is complete (HO-013). Team G job 1011 covers jargon ("canonical local save", "Candidate C Apply", "reconciliation").
- Desktop NEXT_CONNECT_PLAYERS: dash in "DANIEL - START" is wrong, real dot kept; CHOOSE SEASONS is the big yellow/gold button; two cards bigger; plate is a clean tunnel with banners and name tags kept.
- Study 1110 adopted Sat 10 Oct 10:56 p.m.; sideways and tablet redos passed Mon 12 Oct 8:55 a.m.

## S18 Season Results

- Scoring on screen: +5, +3, +1, +1, +1, max 11. Mockup's 9 should be 10 (Fri 02 Oct 5:02 a.m.). A tied season is broken by league position. Desktop job 1029/1029b fits a Chromebook-size window (PASS Tue 06 Oct 10:57 a.m.).
- Job 77 failed twice (score bar covered form rows, tagline hidden, form shrinks under the score row); the lead fixed it itself (Sat 03 Oct 10:51 p.m.). Phone tabs and score fields pushed too far down: lead moved them up (Sun 04 Oct 11:32 a.m.).
- Leftovers listed for CC-008: "MAX" in a plain browser font (Sol styling fixed), 1366x640 scoring panel covers the subtitle (fixed), subtitle "TWO MANAGERS · ONE LEGACY" overlapped by the brush title on desktop, empty black band on phone (fixed).
- Phone fix 1012 (Mon 05 Oct 9:37 p.m., HO-015): one normal page scroll, cards full width (Daniel first), smaller hero, status lines grouped at the bottom, one status line instead of stacked "ACKNOWLEDGED ✓ / PLAN COMPLETE ✓". Cause: results sat in a fixed ~205px box with its own scroll and two columns. White cards Nik saw were the old cached look: hard refresh. Evidence `evidence-claude-check/1012/`.
- Nik 04 Oct 5:10 p.m.: Season Results looks okay.

## S19 Transfer War

- Words must match live: "TRANSFER WINDOW LIVE · BUILD YOUR FIFA 17 SQUAD", "REQUEST EARLY END" (1002, PR #389, merged first try; HO-010 asks G to update one matching line).
- Early-end button hidden on phone because the corner trim on Nik's card cut the pinned button; 1007 added a one-line fix (PR #394).
- Daniel's face: his phone picture was cut along an outline through his face (quarter erased and blurred) and Nik sat too close (22% and 78% of width instead of planned 14% and 84%) drawn on top. 1007 and 1008 folded into ONE phone revamp, job 1016 (Sonnet), passed Mon 05 Oct 9:53 p.m.: both re-cut from existing art, faces whole, no overlap, hero smaller, cards clean panels, REQUEST EARLY END on the plate just above HOME / REFRESH, no scroll at 393 or 360. Evidence `evidence-claude-check/1016/lead_check_phone_sheet.jpg`; Team G copy is HO-016.
- Job 49 passed 84/84 browser checks; the lead restored HOME and REFRESH buttons a worker hid (Fri 02 Oct 9:18 p.m.). Top menu bar (job 52) covered the painted title, lead moved the screen below it; 1366x640 title top cut a little (a Sol fix failed, then "extra 6", verify de9b73bc). Phone clock fixed by lead: right end of the WINDOW OPEN bar (Sun 04 Oct 3:13 p.m.).
- Sideways phone and upright tablet layouts: jobs 1035 and 1036 (LOCK big and gold, Home title off the faces), Thu 08 Oct 11:44 p.m.; before/after `visual-assets/v10_1/tr2/evidence/1036/before_after_820x1180.jpg`.
- Premium desktop picture (Sun 11 Oct 6:38 p.m. Nik: "adjust the prompt ... on a different level", elements unchanged): night executive war room, black marble desk, smoked glass, hanging gold scoreboard timer, glass-and-gold cards, solid gold REQUEST EARLY END, red wax CM17 seal on Nik's card; approved 8:32 p.m.
- Phone redo study for Transfer War (title dropped twice) is the only redo still open as of Mon 12 Oct 8:55 a.m.

## S20 Select League

- Gold ring/rim must never cover any league name or icon (Nik: Sun 04 Oct 2:48 p.m. about 70% of logos covered; Sat 10 Oct 12:08 p.m.; Mon 12 Oct 9:40 a.m.). Lead fixed live (2cdb1a20, Sun 04 Oct 2:49 p.m.).
- Wheel details from the approved phone prompt (Sat 10 Oct 12:21 p.m.): five equal slices; mark with name under it, halfway between centre and rim; five marks one flat gold set (Premier League crown, LaLiga bull head, Bundesliga round plate, Serie A shield, Ligue 1 numeral 1); names one font, white; chosen slice lit gold with black crown and name; each mark once on the screen; hub = polished gold cap with a football (replaced: crown centre repeating Premier League); pointer = plain gold triangle, no crown.
- Brush SELECT LEAGUE title done (job 1030, Tue 06 Oct 1:07 a.m.). Job 37: Daniel's fingertip touches the wheel; job 38 league marks. League/Club/VS brush wordmarks: League done, Club and VS never made (Club desktop shows text "VS", hidden on phone).
- Phone: wheel moved below both heads (A2). Phone marble men stand BEHIND the round marble plinth with its flat top empty for the wheel; wheel came out smaller in the mockup, fine because the game draws its own.
- Desktop guide was captured wrong (no managers) because live r69 style paints black over the League stadium and Rivalry/Legacy put the stadium into a hidden Season screen; fixed in Team G job 1657 (r71). Guides for League, Rivalry, Legacy rebuilt (Sun 11 Oct 8:49 p.m.).
- Premium NEXT_LEAGUE approved 9:02 p.m. Sun 11 Oct (ring covers no name or icon, all five match gold); the League plate has no wheel (game draws it).
- Desktop study kept Mon 12 Oct 7:56 a.m. with three Team G fixes: proper font, real football in the middle, marble stand once art exists. Fade-at-bottom of League/Club/Start (`v10Setup.css:628`) sent to Team G.

## S21 Club Assignment

- Job 43: Club was zoomed in too far, faces scored about 0.2 against the mockup (0.9 passes). Job 44: names overlap on shorter laptops. Job 47: top bar showed as plain blue links.
- Hidden "VS" caused the stray painted "S" on Club phone (fixed). Club desktop shows text "VS" until a brush wordmark exists.
- Nik 04 Oct 5:04 p.m.: on phone Nik covered Daniel fully and was too big; shrink to about 50%; CC-008 A3 made both side by side, same size, both packs showing.
- Calm lighting plan from the phone prompt (Sat 10 Oct 12:31 p.m.): dark quiet stadium, no flares behind heads or text; soft warm key light on both faces; gold glow only on the CLUB ASSIGNMENT title, VS, lit LOCK step and CONFIRM RIVALRY & START SHOWDOWN button; lower half on near-black panel. Grey sentence in full: "These clubs are permanent for the full showdown. Confirmation starts the rivalry and never rerolls either club." Two club badges (antlers, tower) stay.
- Nik 11 Oct 8:34 p.m.: part of his hair on the head was gone in the select league and club assignment guides; guides rebuilt.
- Plate: faint "CLUB PACK" words cleared, packs plain black so the game puts crests on; phone plate has men holding plain black packs (game badges land inside).
- Club desktop study kept (Mon 12 Oct 5:59 a.m.); "full pack-rip for Club" was a job goal.

## S22 Career Statistics

- Early sample numbers were impossible (career points too high for trophies); jobs 3, 131, 137 fixed with the shared checker.
- Phone title covered faces: fixed A6 (Nik, Sun 04 Oct 5:10 p.m.: "covering half of my face and almost all of Daniel's hair").
- Filters to remove (S13): dark band over the middle, faded tiles, hides the managers picture when signed out; dark blurred oval near the men on phone.
- Plate shows night city windows and gold trophy shelves where the stat cards were.
- Studies: first Career Statistics study with overlapping cards not adopted (Sat 10 Oct 10:56 p.m.); desktop, phone, sideways, tablet studies later kept.
- Live site had black side bands on Stats (HO-004 finding).

## S23 Rivalry Statistics

- Desktop lighting too bright and washed out (Nik, Sun 04 Oct 5:04 p.m. "the lighting is not right"); cause: a hidden bug spreading the gold glow over the whole screen; fixed in CC-008 A5 (confirmed 6:05 p.m.).
- Early sample numbers: both finished 4th, impossible; fixed (job 135). Job 67 (3.9 scored, bottom panels half empty, dashes instead of numbers) passed after fix 4.3.
- Desktop prompt fixes: Nik's numbers column was empty on live; guide rebuilt to show both men; plate shows full floodlit stands.
- Phone: tab sits under STATS not STANDINGS (the picture lit STANDINGS, Team G keeps live tab); picture approved first try 1:04 p.m. Sat 10 Oct; marble 8:10 p.m.; plate 10:00 p.m. (golden stadium, both banners). Phone dark overlay and bottom dark fade to remove (S13). Leftover: 375x553 totals scroll inside panel.
- Study 1372 adopted Sat 10 Oct 10:56 p.m.; sideways and tablet adopted 11:56 p.m.
- Rivalry and Legacy hide their stadium picture in a hidden Season screen on live (job 1657, r71).

## S24 Legacy

- Sample numbers fixed (eleven season scores did not add up; a season where both finished 2nd) in jobs 5 and 132. A level final total shows Draw (correct).
- Phone: managers tiny, title behind Nik, archive cards off screen: fixed by lead Sun 04 Oct 11:56 a.m. (managers top, title below, cards and button fit at all three phone sizes); archive cards ran off the right edge and page dots missing: fixed in Astra bundle; Astra bundle passed 4.3 (Sun 04 Oct 1:08 p.m.).
- Phone background image 118: ticket `tickets/TICKET-118_1_OF_1_ENV_LG_PHONE_RAW.md`, guide `tickets/attach/GUIDE_LG_PHONE.png`; passed on Nik's drop Sun 04 Oct 11:32 a.m. (Temporary Chat era; check: no cyan, no people, no text, blends, tall).
- A7 Daniel closer on phone. Filters: stopped-early Showdown card faded and greyed (S13).
- Legacy tablet redo passed Mon 12 Oct 8:55 a.m. 375x553 eyebrow touches title (leftover).

## S25 Settings

- Cards on live: Account, Application, Motion & Feedback (Follow Device / Full Motion / Reduce Motion), Showdown Data (see S14). Gear stays top right on all phone and desktop bars.
- Job 95: buttons clipped, phone panels unreachable, every panel blank (bug fixed by lead), short laptop (1366x640) panels spill past the bottom; passed 4.3 at Sat 03 Oct 11:51 p.m. Nik 04 Oct 5:10 p.m.: Settings looks good on desktop.
- Idle frame rate after the calm stage fix (PR #374): Settings 13 to 60 fps, Rule Book 22 to 60.
- Settings plate is an empty penthouse lounge (S10, S12). DANIEL & NIK and CAREER MODE SHOWDOWN should use the game font (live uses a plain one).
- Filter list (S13) names Settings among signed-out screens Nik noticed.

## S26 Final Winner (Showdown Champion)

- Sample data: both managers had 2 league titles in a 3-season Showdown (impossible); fixed (job 134); job 139 also dropped buttons the online result screen does not have.
- Job 1006 (PR #393, passed Tue 06 Oct 10:57 a.m.): FINAL SEASON box, e.g. "FINAL SEASON 3 · 7 – 2 · DANIEL TAKES THE SEASON"; desktop beside SEASONS and MARGIN; phone top row of SUMMARY tab.
- Phone: managers shown twice/see-through and empty top (58/83 style issues, Fable thread fixed 83); bottom buttons REVIEW MY SEASON RESULT and BACK TO SHOWDOWN HOME were below the visible edge so GPT drew blank bars (Sat 10 Oct 11:20 p.m.).
- Desktop live: two buttons tiny and white (fixed in prompt); 1366x640 TERMINAL footer crosses trophy stem and DANIEL WINS near the crown; phone 375x553 TERMINAL line touches the panel edge.
- Nik 04 Oct 5:10 p.m.: Showdown Champion looks okay. Loser dim filter must go (S13).

## S27 Trophy Room

- Live has five tabs ALL, SHOWDOWN, LEAGUE TITLES, DOMESTIC CUPS, CHAMPIONS LEAGUE and four trophies; phone cut off the Champions League tab and two cards so GPT never saw them. Counts used in the approved picture: SHOWDOWN CHAMPION Daniel x1, Nik -; LEAGUE TITLE Daniel x2, Nik x1; DOMESTIC CUP Daniel x2, Nik -; CHAMPIONS LEAGUE Daniel x1, Nik x1.
- Trophy designs (own, never real): Showdown Champion gold trophy with football inside a crown-shaped cup; League Title silver cup with gold laurel handles and band of gold stars; Domestic Cup round silver cup with domed lid and two loop handles on black-and-gold base; Champions League tall silver cup with band of small gold stars and two tall sweeping gold handles on black base. Nik 10 Oct 11:10 p.m.: wanted CL tab, matching font, more cinematic trophies, and the Continental Cup shown.
- Trophy art jobs: 19 Showdown Champion passed Fri 02 Oct 12:22 p.m. (cleaned red edge); 20 League Title 12:30 p.m.; 21 Domestic Cup and 22 Continental passed 5:48 p.m.; ticket 23 backgrounds.
- Job 2 had an impossible "perfect seasons" count (fixed, job 130 and 136); job 57 counts cut off and trophy covered tagline; job 58 phone: Nik covers Daniel and cards cut right (passed in the Fable thread Sat 03 Oct 9:34 p.m.).
- Each tab opens ONLY its cup, big (S09); single-cup views: phone, desktop (Champions League lit, Daniel x1, Nik -) and marble phone.
- Filters to remove (S13): centre trophy fades to 30%, unwon cups greyed.

## S28 Rule Book

- Content: sections 01 to 06 (six real rule lines word for word); scoring table; right banner reads DIFFERENT MANAGERS SAME PASSION (GPT wrote "SAME AMBITION" and once "PASSSION"; the repo plate was fixed); desktop gold BACK TO MAIN MENU; phone gear top right with RULES tab lit; no people.
- GPT invented rules ("Six users are randomly drawn..."), swapped tabs for SQUAD/TRANSFERS/COMPETITIONS/COMPETE and moved or dropped the gear (Nik, Sun 11 Oct 2:15 a.m.; none of three tries usable). Hardened every unused ticket at the same links 2:20 a.m. (S33). Phone Rule Book approved after that, 3:18 a.m.
- Phone live: PREVIEW DATA chip under the settings button (leftover); job 94 cards cut off last line (fixed); phone ticket asked for fold-out sections so nothing scrolls.
- Studies: 1429 adopted Sun 11 Oct 9:54 p.m.; 1430 no study (workers hit a reading limit); 1431 not adopted (wrong fonts, made-up top bar, tabs without icons) 10:53 p.m.; tablet adopted; sideways scrolled (turned down) then redo passed Mon 12 Oct 8:55 a.m.

## S29 Standings

- Phone live: stats table cut off at the bottom (last two rows hide behind the tab bar); approved picture fits all seven rows with right numbers, Daniel left, gear and five tabs (Sun 11 Oct 3:53 a.m.).
- Job 204: small phone table cut a row in half, laptop view missing the top menu bar (fixed by a Sonnet thread, passed 4.3).
- Studies: Standings phone 1255 adopted Sun 11 Oct 9:54 p.m.; tablet adopted; phone C and sideways turned down (wrong fonts or clipped row) 11:55 p.m.; sideways redo passed Mon 12 Oct 8:55 a.m.
- Nik 04 Oct 5:10 p.m.: Standings looks good.

## S30 Studies and V_ADOPTION

- Studies = Team G mega factory's hand-coded HTML layout pages (126 phone/sideways/tablet/desktop studies; 518 tickets in all). They are not pictures. Log: `project-documents/gameplay-factory/queue/V_ADOPTION.md` on `factory/gameplay-v1`; the lead adds one verdict line per study; the hourly trigger also checks `study/job-*` branches. Judge against the approved PHONE_/NEXT_ picture: reject wrong fonts, invented top bars, tabs without icons, clipped rows, dropped titles (Transfer War title dropped twice), huge broken gold marks over the wheel, thin-strip crops of the men.
- Verdict log (Eastern): Sat 10 Oct 10:56 p.m. 10 reviewed, 2 adopted (Connect Players 1110, Rivalry 1372); 11:56 p.m. 21 reviewed, 11 adopted, 3 no change (Home tablet, Transfer sideways and tablet keep Team V designs), 7 not; Sun 11 Oct 12:56 a.m. 20 reviewed, 10 adopted; 1:55 a.m. 8 reviewed (Home, League), none; 2:11 a.m. redos adopted (League phone/sideways/tablet, Home phone/sideways); 7:55 a.m. desktop Home 1086; 9:54 p.m. Standings phone 1255, Rule Book phone 1429; 10:53 p.m. Rule Book phone C 1431 not adopted; 11:55 p.m. kept 5 of 8 (Club, Final Winner, Career Statistics desktop; Standings, Rule Book tablet).
- Mon 12 Oct 5:59 a.m. "V_ADOPTION complete": every screen and size decided; 39 slots kept (most phone/sideways/tablet plus desktop for Home, Club, Career Statistics, Final Winner); 17 redo (desktop for the other 10 screens with no study, Transfer phone, sideways for Connect Players, Standings, Trophy Room, Rule Book, tablet for Connect Players and Legacy). 6:00 a.m. plan: 10 desktop redos built straight from the approved desktop picture; 7 phone/sideways/tablet redos re-run with fix notes; 4 kept desktop studies being built. 7:56 a.m. League desktop study kept. 8:55 a.m. six redos pass (Connect Players sideways and tablet, Standings sideways, Trophy Room sideways, Rule Book sideways, Legacy tablet); only the Transfer War phone redo open.
- HO-023 five fixes (Sat 10 Oct 11:31 a.m.): 36 tickets pointed to missing art folders (transfer -> `tr2/slice-02-plate/assets`; rule-book/settings/standings -> `shared/`); tickets did not say where mockups are; phone size missed the no-scroll rule (393x660, 360x640, 375x553 main button); tickets omitted Daniel left, no player photos, no real crests; items 316, 334, 344, 362 were already done by jobs 1035/1036.
- After the marble decision (Mon 12 Oct, S11) V_ADOPTION gets a note saying which studies are re-approved in marble (line f0c80edfa).

## S31 Hand-offs HO-001 to HO-027 and relay ids

One line each (V = Team V, G = Team G). Unknown items are marked "not in logs".
- HO-001: probably the "hand-off tickets" protocol step (Mon 05 Oct 11:46 a.m. fifth item); HO-001 to HO-004 sent 8:51 to 8:54 a.m., picked up 11:46 a.m. (2 h 52 m), done 11:47 a.m. to 12:19 p.m.
- HO-002: mouse stutter / calm stage (V-244, PR #374): gold dust and light play once then hold; Settings 13 to 60 fps idle, Rule Book 22 to 60.
- HO-003: header chips and footer spec (V-246, PR #376; `handoffs/HO-003_SPEC.md`): desktop SIGN IN and SEASON chips move into the top bar by the gear; phone hides them on stage screens (Nik may want the season chip back); footer hidden everywhere.
- HO-004: visual check of live 2.0 vs approved frames (V-245, PR #375; `handoffs/HO-004_FINDINGS.md`).
- HO-005: phone Home ghost coat (V-243, PR #372), sent 9:02 a.m., picked up 11:46 a.m., done 12:04 p.m.
- HO-006: phone Home tile icons (V-247, PR #381); Team G done 3:08 p.m. 05 Oct, live r60.
- HO-007: shared job counter from 1001 (Mon 05 Oct 7:24 p.m.). HO-008: bug factory, GPT first (7:33 p.m.). HO-009: V asks G to copy the CI/Physio watchdog rule (7:41 p.m.). HO-010: V asks G to update one Transfer War wording line (8:04 p.m.).
- HO-011, HO-012: not in logs. HO-013: "Session ended" message wrong (Mon 05 Oct 9:29 p.m.). HO-014: CAREER READY / Continue Career box and create/join off Home (9:31 p.m.). HO-015: Season Results phone CSS (9:37 p.m.). HO-016: copy the Transfer War phone revamp 1016 into the live game (9:53 p.m.).
- HO-017: Nik's Thursday goal (Tue 06 Oct 12:02 a.m., via G): move the live game toward mockups and keep a progress board; Team G works the Bug Olympiad list. HO-018 to HO-020: not in logs.
- HO-021: sideways phone (job 1035, done) and upright tablet (job 1036) layouts. HO-022: V judges Team G studies in V_ADOPTION. HO-023: V's five fixes to study tickets (Sat 10 Oct 11:31 a.m.). HO-024: G done, 126 studies aim at PHONE_/NEXT_ pictures, held until released (8aaa40c0; Sat 10 Oct 11:35 a.m.).
- HO-025: relay feed and inbox (V to G; Sat 10 Oct 11:33 p.m.); G inbox fixed 11:35 p.m. HO-026: marble phone/sideways/tablet (G to V, Mon 12 Oct 5:55 p.m.); Team V part DONE 10:20 p.m. HO-027: remove all state filters, r76 (V to G, Mon 12 Oct 8:44 p.m.), plus lighting reference, anti-flash note and live check.
- Relay ids: V2G-013 (promised the CC-008 file list), V2G-015 file list (bcab6aba), V2G-016 "Nik approved 5e05a1f, wire all 15 screens", V2G-017 shared board adopted (Mon 05 Oct); G2V-001R2 top nav; G2V-009 sat ~4 hours; G2V-015/016 relay listening (sent 11:52 a.m., done 1:38 p.m. Mon 05 Oct). Read the FEED.md tail for the next number.

## S32 Tools and scripts

All paths relative to the repo on `factory/v1-wtt5ye` unless noted.
- `project-documents/factory/tools/check.py` (lead's PASS/FIX recorder), `waiting.sh` (counts jobs waiting for the lead; used by the hourly trigger), `jobgen/gen_jobs.py`, `jobgen/screens.py`, `jobgen/check_jobs.py` (S06), `board.py` (an image job is startable only when its ticket exists).
- `project-documents/factory/tools/phone_art.py` (cutout + refine + webp + proof); `visual-assets/v10_1/shared/tools/refine_cutout.py` (rembg, `--grow 80`; rembg/opencv only in the container); `tools/claude_qc.cjs` (screenshot renderer); `visual-assets/v10_1/shared/tools/mockup_diff.py` (closeness gates in `project-documents/factory/research/MOCKUP_FIDELITY_REPORT.md`).
- `project-documents/factory/tools/plates_v2/`: `masks.py` (cyan rects M[KEY], LOCK entries), `lock.py KEY raw.png "<rects>"` (ORB-fit and likeness lock), `fix_rule_book_banner.py`.
- `project-documents/factory/tools/phone_plates/`: `masks.py`, `guides.py`, `tickets.py` (`python3 tickets.py 1800` regenerates tickets), `facecheck.py`, `live_facecheck.cjs`; `plates-v2/PHONE_FACE_ZONES.json`. Phone lock adapted from `plates_v2/lock.py` (no black bars; only approved heads kept). Earlier ticket generators `tickets.py`, `zones.py`, `make3.py` were scratchpad scripts (no-invention rewrite commit 90c68860); guide zones saved as `assets/plate_zones.json` and `GUIDE_<K>_PLATE.png`.
- Relay tools on `leads/relay` (`project-documents/leads-relay/tools/`): `handoff.py`, `claim_number.py`, `feed_sync.py` (`--team G` for Team G), `shared_board.py`; action `.github/workflows/leads-relay-ping.yml`.
- Haiku V keeper files (`CUSTOM_VIEW_V.html/.svg`, `tools/custom_view.py --v`, `tools/wow_svg.py`) are on `factory/gameplay-v1`. Team G layout audit `tools/layout-audit` on `audit/layout-auditor` (every screen without sign-in at 5 sizes; `LAYOUT_AUDIT_EVAL` hook dumps live text). Physio watchdog and CI gates are Team G's; workers never touch them.
- Evidence `project-documents/factory/evidence-claude-check/<job>/`; reviews `project-documents/factory/reviews/` (WORKER_SCORECARD.{md,pdf}, PHONE_PASS.md, LIGHTING_REFERENCE_LIVE_HOME_DESKTOP.png, PHONE_PLATES_*.png); plan `project-documents/factory/PLAN_PHONE_MOCKUPS.md`. Skills the lead used: showdown-likeness-image-ticket (ticket rules, gate review), showdown-model-picker.

## S33 Image tickets and GPT prompt lessons

Mechanics
- One ticket = one image: `tickets/TICKET-<job>_<i>_OF_<n>_<ASSET>.md`, a README index, attachments in `tickets/attach/`. Nik attaches ONLY the guide picture(s), pastes the prompt exactly, drops the result with the code; the lead checks, saves, finishes. Up to 3 tries (Legacy 118 rule). Fix message: if a picture is great except words or tabs, paste the ticket's fix message once in the same chat (step 6).
- Each ticket in a brand-new NORMAL chat outside any project, ChatGPT memory off. Old chats that already made Showdown pictures redraw the whole screen (Season Results try 1, Connect Players try 1; an early normal chat returned 3 unrelated memory-bled pictures).
- Keep ticket links stable and give GitHub blob links (iPhone). Show Nik the new prompt in chat so he can paste it (Sat 10 Oct 12:08 p.m.); the ticket carries the same text. Old flow rebuilt `IMAGE_TICKETS.zip` after changes.

Prompt recipe (what worked)
- `Edit this image.` first; "Keep exactly" (layout, every element and word spelled exactly, both men as they are, curly hair LEFT, full beard RIGHT); the change list; a Rules line: fits one screen, no real crests, league logos, trophies or player photos, black bars stay plain black, same tall portrait framing, largest size available.
- MOST IMPORTANT block (Nik, Sun 11 Oct 2:15 a.m.): only words already in the picture or prompt; no new or moved buttons, tabs, icons; name banned tabs (S04); spell the exact bars; body text verbatim where GPT cannot read it; bar check in the checklist. 15 unused tickets updated at the same links 2:20 a.m. Generator commit 90c68860.
- Calm lighting paragraph (added to last six phone tickets Sat 10 Oct 12:48 p.m.): one controlled plan "like a high-end sports broadcast poster, not a wall of lights"; no lens flares, bursts, sparkles or glare behind heads or text; soft warm key light on both faces; thin warm rim light; strong gold glow only on named elements.
- Premium rewrite (Sun 11 Oct 6:39 to 6:43 p.m.): luxury set per screen (marble, smoked glass, brushed gold, gold-leaf title, polished-gold main button), keep every element, word and position, list every word on screen; Home also says SIGN IN must stay visible.
- Background-only prompts: say the cyan boxes were removed on purpose and must not be drawn back; per-screen BANS list (League: no wheel, ring, football, league names or symbols); warn that a file showing the finished screen is the wrong file; the guide should show big solid cyan boxes. Ask only for the empty background (Nik, Mon 12 Oct 9:19 a.m.). Small GPT face changes do not matter: approved faces are put back (S10, S12).
- Early flow: GPT could not open pictures stored on GitHub (Fri 02 Oct 5:17 a.m., job 8): `SHOWDOWN_MOCKUPS.zip` (11 pictures) was uploaded to project Files (later replaced by text-only workers). GPT cannot see pictures, so use Sonnet or Opus for art re-cuts.
- Trophy cut-outs: GPT returns a glow background, so cut out; fix red edge to gold; repair crown tips (trophies 19 and 20 passed first try, Fri 02 Oct).
- Real marks: GPT sometimes draws something near a real crest (Arsenal cannon-like badge, Mon 12 Oct 7:38 p.m.): put our own badge back; keep "copy the badges, never a real crest".
- Ticket accuracy: do not call the Final Winner bottom buttons a "progress bar"; check what the live screen really shows (League guide missing managers; Settings hiding Delete when no Showdown is saved); capture guides from the code state that shows everything.

## S34 Budget, models, usage

- Claude weekly limit resets Fridays 00:00 UTC (Thursday 8:00 p.m. Eastern; last reset 09 Oct UTC); every Claude model in project threads counts. Be efficient. Claude Code cloud sessions (claude.ai/code) bill to Nik's credit, not the weekly limit (credit $169 on Sat 03 Oct 10:27 a.m.). Fable is about 2.5 times the Opus price. Nik likes cost estimates in reports.
- ChatGPT: normal chats do not use the usage meter; Work mode does. Nik ran out of Work mode usage Sun 04 Oct 1:09 p.m. (1% left until 4:18 p.m.); Sol bundles in Work mode drained it. Second ChatGPT account was offered for Sol (Sun 04 Oct 12:31 p.m.): sign in to GitHub connector there too.
- Cloud sessions: CC-006 Fable audit capped $25 or one hour; CC-007 Fable cloud run took 16 minutes and $7.89 under a $15 cap (a similar generator-scale job fits $10); CC-008 Opus High capped $15 for about an hour; Fable emergency max about 10 minutes. Verify every cloud run against live state before telling Nik (Fable missed job 128; fixed 9f8f0b4).
- Scorecard (04 Oct, `project-documents/factory/reviews/WORKER_SCORECARD.{md,pdf}`, shared with Team G): Opus 34/34 first try, Sonnet 50/52, GPT chats 83% of 121; advice: GPT text and reviews, Claude builds, phone and fixes, Fable after 2 failed fix rounds.
- Nik asked (Sun 04 Oct 2:11 p.m.) the lead to take over GPT-struggling job 104 and similar and say how much is left and who can do what; lead took 15 jobs.
- Boards, relay listening and routines cost no Claude usage; the hourly guard is silent when nothing waits. Roles: coordinator Opus Medium; factory thread Opus High; helpers Sonnet Medium; Haiku keeps the V board.
- Nik's 15 Oct reason to move: the Team V lead thread became so large that every reply re-read the whole chat and burned usage (S36).

## S35 Open items, promises, things waiting

Waiting on Team G / the live game
- r76 wiring (Team G): marble phone screens (HO-026), no state filters (HO-027), main's fade removals (`v10Setup.css:628`, `v10Transfer.css:91-109/291`), `live_facecheck.cjs` on every screen with before/after screenshots signed in and out, anti-flash tested cold and between screens. The lead must check the wired screens on the real site and show Nik each one (line Nik can send Team G: "show me each screen when it's live").
- Team G builds adopted studies, desktop first then phone (Nik, Mon 12 Oct 5:45 a.m.); the Transfer War phone redo study was the only redo open on Mon 12 Oct 8:55 a.m. (no later status in logs).
- Full Motion (job 1652, draft PR #691) not live as of Sun 11 Oct 9:05 p.m.; Team G builds the one-cup Trophy Room with the high-res cups; Loading build waits on JOB-1635.
- Two-player play-through by Nik and Daniel, then Nik's OK, then Team G merges to main (G-13 wiring reports go to the lead for checking).

Promises by the lead not recorded as finished
- Check Team G's wired screens against the approved pictures when they report (Sun 04 Oct 5:22 p.m.).
- Turn Nik's small visual errors (ignored on 04 Oct to ship) into jobs when he lists them (Sun 04 Oct 6:08 p.m.).
- Redesign phone Home tiles as big centred icons if Nik says so (Mon 05 Oct 2:42 p.m.); bring the season chip back on phone stage screens if he says so (12:20 p.m.). Neither answered.
- "Start the phone mockup plan" / "start the next-level desktop plan" (Tue 06 Oct 1:10 and 1:12 a.m.): effectively done through the premium NEXT_ and PHONE_ marble pictures; the level-by-level GPT Image 2.5 upgrade idea was not continued; confirm with Nik before reviving.
- Board 2 (polish, motion, more pack openings, FUT-draft-style pick of 5 cards): only after the shared goal is met and Nik says go; first check fit with scoring rules.
- Brush wordmarks: League done (1030); Club and VS never made (Club desktop shows text "VS"). Music across screens (Audius `soundtrack.js`, no YouTube) is integration work.
- Leftovers accepted from CC-008: Rivalry phone 375x553 totals scroll in panel; Final Winner phone preview chip touches eyebrow; Transfer War F3 at 375x553 hides heroes; Rule Book phone PREVIEW DATA chip; Legacy 375x553 eyebrow touches title; Final Winner 1366x640 TERMINAL footer crosses trophy stem.
- Real text Team G keeps instead of the mockup's: Rule Book banner SAME PASSION; dot not dash in "DANIEL - START"; Rivalry tab STATS.

Nik's own to-dos
- Turn ChatGPT memory back on when the backgrounds are done (lead's instruction Mon 12 Oct 9:24 a.m.; he switched it off by 7:30 p.m.).
- Type "go" in the Team G thread when their safety check asks (Sun 11 Oct 6:34 p.m.; last three released 9:20 p.m.).
- Resolve the old thread after hand-over if better (Thu 15 Oct 6:43 p.m.). List small visual fixes after the play-through (Sun 04 Oct 6:08 p.m.).

Answered Thu 15 Oct 7:18 p.m.: Nik agreed: Home tiles follow PHONE_HOME_MARBLE (no centred icons); season chip stays off phone stage screens; the lead makes the small-fixes list in the r77 check; "next-level desktop" = marble design, already DONE (r75). r77 (not r76) carries HO-026, HO-027 and the fade removal.

Open question from Nik (Thu 15 Oct 6:43 p.m.): "I'm not sure what else you need to do for the R77 visual." No answer in the logs. Candidates from the record: r76 live checks above, the Transfer War phone study, Club/VS wordmarks, any small visual list Nik gives.

Feature idea (Nik, Thu 15 Oct 7:58 p.m.): he likes a pick-1-of-3 card pack after r77. Lead answered: visually doable (reuse Club Pack art), picks sealed, a pack must never change clubs or points. Ranked ideas: 1) Season Challenge pack (pick 1 of 3 play challenges, rival confirms at season end, Legacy badge) RECOMMENDED; 2) Transfer Target pack (player type, no real players); 3) secret season predictions revealed at Season Results; 4) trophy ceremony cinematic. Waiting on Nik's "go" after r77; then write it up for both teams (Team G confirms Firestore fit).

## S36 The 15 Oct thread transition

- Nik's request (Thu 15 Oct 6:43 p.m.): the Team G lead thread had grown too large and burned his usage (each reply re-reads the whole chat); he wants the same check for Team V. Move to a new thread only if it really saves usage. While he works R76 with Team G, R77 will be visual (he thinks all backgrounds are done).
- Asked of the lead: (1) confirm it is safe and helps usage; (2) update team memory fully; (3) write a short handoff file (Team G's was about 12 KB; exact size not important); (4) write all the small things and his scratches into a "shell" (shelf) file as a directory resource: the new lead opens only the section matching a question; (5) tell him what to type in the coordinator chat to create the new thread to lead Team V; (6) afterwards, if better, resolve the old thread.
- The lead's reply (Thu 15 Oct 6:43 p.m.): will check whether a fresh thread saves usage, then build the short handoff, the detailed shelf file and memory updates.
- Re-register after the switch: subscribe the new lead thread to PR #312 and set INBOX.json "V" on `leads/relay`; never re-subscribe to PR #311; auto-resolve must not touch the factory job board, Haiku V keeper or ideas backlog threads.
- Good first checks for the new lead: resolve live `main`, open PRs and `factory/gameplay-v1`; read the FEED.md tail; check whether r76 shipped and run the live checks (S12, S13); then ask Nik what R77 visual should contain.
