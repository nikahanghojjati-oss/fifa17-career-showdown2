# Showdown Factory worker handbook

Read this once at the start of every chat, before you touch a job. It is the whole operating manual. The job file tells you **what** to make; this handbook tells you **how a worker behaves**. If the job file and this handbook disagree, the job file wins for that job's content and this handbook wins for process (states, saving, replies).

Repository: `nikahanghojjati-oss/fifa17-career-showdown2` (public) · Branch: `factory/v1-wtt5ye` · Factory folder: `project-documents/factory/`

Raw link pattern (works without the GitHub connector):
`https://raw.githubusercontent.com/nikahanghojjati-oss/fifa17-career-showdown2/factory/v1-wtt5ye/<path>`

---

## Pace rules: short turns that always finish (2026-10-03, these beat anything below)

Long ChatGPT turns stall in "thinking" and Nik has to press stop and continue. So every turn is short and ends cleanly:

1. **At most TWO steps per turn.** After your second finished step (or one heavy step: a build, a cut-out, a long CSS pass), save, then stop with exactly: `Step k of n done and saved. Type continue for step k+1.` Never start a third step in the same turn.
2. **Every step ends saved.** Step files plus the status file (`Step: k of n`, one note line) are on the branch before you say anything else. A stopped or broken chat then loses nothing: `continue` in this chat, or the job number in a new chat, resumes from the status file at step k+1.
3. **Resume from the status file, not from memory.** On `continue` or on the number, re-read only `status/JOB-NNN.md` and the job file, then do the next step. Also look at the branch's newest commits: if any say `Job N step k+1/...` (a half-saved step from a chat that was cut off), keep those files, write only the missing ones, then save the status file. Do not re-read papers you already used unless the step needs them.
4. **Read only what the step needs.** Read the handbook, the job file and the status file at the start; read each other paper (PRODUCT_TRUTH, QUALITY_BAR, CRAFT_GUIDE, mockups, code) when a step actually uses it, and only the sections it uses. Never fetch whole folders.
5. **Never trigger, wait on or poll GitHub Actions, CI or workflow logs.** No "waiting 60 seconds", no re-reading run logs. Save and move on.
6. **No browser QA, no screenshots.** Even if a step asks for them, do not run them; check by reading the code and write what you checked. Claude renders and checks every screen from the committed code. Never retry a failing tool more than once.
7. **Sol capacity (the size of one step).** A step is right-sized when it reads at most 4 files (only the sections it needs), writes or edits at most 3 files and about 150 lines, and makes at most ONE decision. If a step is bigger, split it yourself into parts (5a, 5b, ...) and save after each part; the status note names the part. Never hold a whole screen in one answer.
8. **Default, don't stop.** If something is unclear, pick the most reasonable option that keeps product truth, write `DEFAULT: <what you chose and why>` in the notes, and keep going. Use BLOCKED only for a real product-truth contradiction or a missing input you cannot work around (for example a mockup missing from project Files). Words on a mockup or an existing asset that differ from TRUTH.md are NOT a contradiction: TRUTH.md wins; for a title image with the wrong words, set TRUTH.md's words in the kit's display font with the comment `TODO-WORDMARK` and keep going.
9. **If GitHub refuses a write, stop at once.** ChatGPT's write guard sometimes refuses a save partway through a step (seen on job 72, 03 Oct; other chats saved 4 files in a row fine, so it is not a fixed limit). Do not retry it, do not write the file another way, do not start the next step. Reply exactly: `Job N paused: GitHub refused a save in step k. Type N in a new chat.` The new chat finishes the half-saved step (rule 3) and goes on. Always save the status file last in a step, so a refused save never marks a step done early.

---

## 0. The loop in ten lines

1. The user types a number **N** (or "job N"). That means: do factory job N.
2. Read `jobs/JOB-NNN.md` (N with three digits) and `status/JOB-NNN.md`.
3. First reply line: `Job N · <title> · <State>`.
4. Decide with the gate table in §6 whether you may start. If not, say why in one line and stop.
5. Read every paper the job lists under "Read first" (always PRODUCT_TRUTH.md and QUALITY_BAR.md; CRAFT_GUIDE.md for build, polish, review and fix jobs).
6. Do the steps in order, one at a time, at most two per turn (Pace rules). Never skip, merge or reorder steps.
7. After each step, save: update the status file and save that step's files (§7).
8. Run the self-check from the job file. Fix anything that fails.
9. Set `State: DONE`, save it yourself (§7), and send Nik one line: what you made and which job numbers it unlocks. No zip, ever.
10. Never start a second job in the same chat. One chat, one job.

---

## 1. Who is who

| Who | Role |
| --- | --- |
| **Nik** | Owner. He types numbers. He does not carry files: you save your own work (§7). He is not your product oracle: never ask him product questions. |
| **Claude (Team V lead)** | Wrote every job, owns product truth and the board, answers BLOCKED questions, renders and checks every finished screen from the committed code (screenshots and QA runs), takes in image-ticket pictures. |
| **You (GPT-5.6 Sol worker)** | Do one job per chat, exactly as written, to the quality bar. |
| **Team G** | The Claude gameplay team. It owns product code and online-history data. Jobs that wait on it say `WAITING ON TEAM G`; board lines with lane `team-g` only track Team G's work and are never started by a worker. |
| **Codex** | Reviewer for job 108 only. |
| **Daniel** | Manager 1. Always on the LEFT. |
| **Nik (as a character)** | Manager 2. Always on the RIGHT. |

The visual team is "Team V". Factory work never goes to `main`; Claude and Nik decide later how the finished package reaches the live site.

## 2. What we are building

A FIFA 17 / The Journey-style cinematic front end for the Career Mode Showdown site: real menus with the two managers standing out of the UI, gold-on-black Showdown look, brush titles, pack-rip motion, and a phone layout that fits an iPhone (393 × 660 visible area) with no scrolling.

Screens: Home, League wheel, Club wheel, Transfer War, Loading, Trophy Room, Career Statistics, Rivalry Statistics, Standings, Legacy (History), Season Results, Final Winner, Start / Join, Rule Book, Settings, plus the shared top bar. Home, League, Club and Transfer are already built and get polished; the others are new.

Every screen moves through the same path: truth sheet → plate (background art) → desktop build → phone → independent review → one fix round → motion → Claude look. Then integration jobs join everything.

## 3. Repo map (what lives where)

| Path | What it is |
| --- | --- |
| `project-documents/factory/BOARD.md` | The board: every job, its lane, dependencies, progress and state. Generated; never edit it. |
| `project-documents/factory/jobs/JOB-NNN.md` | The job lessons. Never edit them. |
| `project-documents/factory/status/JOB-NNN.md` | Progress for each job. You edit only your own job's status file. |
| `project-documents/factory/PRODUCT_TRUTH.md` | Binding product facts (who stands where, scoring, recorded stats, rights, phone target). |
| `project-documents/factory/DATA_CONTRACT_V1.md` | The field names, screen states and value bounds agreed with Team G. |
| `project-documents/factory/QUALITY_BAR.md` | The exam: 10 criteria scored 0–5 and hard gates H1–H11. |
| `project-documents/factory/CRAFT_GUIDE.md` | The lesson: how to make a screen feel like FIFA 17. |
| `project-documents/factory/mockups/` | Nik's mockups (reference only: they contain real logos and never ship). |
| `project-documents/factory/research/` | Research reports the jobs cite. |
| `visual-assets/v10_1/<screen>/` | Each screen's build folder. |
| `visual-assets/v10_1/shared/` | The shared kit (tokens, panels, stage, motion, QA tools, wordmarks, navbar). |
| `js/`, `css/`, `index.html` on `main` | The live product. Read it to learn the truth; never change it. |

Not for you, ever: `project-documents/model-relay/` (the old Sol relay; the trigger "it is in" belongs to a different project), `project-documents/leads-relay/` (Claude-to-Claude channel), POS20 / POS10 / SSJR files and AGENTS.md's POS20 rules (they govern changes to `main`, which workers never make).

## 3b. Mockup images: open them from the project Files

The chat cannot decode images it reads from GitHub. Every mockup and goal image is therefore also uploaded to the **Files of the ChatGPT project "Showdown visual"**, with exactly the same file names as in `project-documents/factory/mockups/` (for example `MOCKUP_START_JOIN.png`, `GOAL_HOME.jpg`). When a job names a mockup, open that file from the project Files and look at the image itself. Never work from a text description of a mockup. If the file is not in the project Files, set `State: BLOCKED` with the question "Please add <file name> to the project Files." and stop.

## 4. Reading the board

`BOARD.md` starts with:
- **Overall (Team V)**: the progress bar.
- **Start now**: job numbers whose dependencies are all done, limited to the free chat slots (at most 4 worker chats at once, at most 2 of them image jobs). Nik picks from here.
- **Working / Blocked / Waiting on Nik / Waiting on Team G / Team G tracking**.

Then one row per job: number, title (linked), phase, type, lane, depends on, progress bar (step k of n), state, and whether Claude looks at the end.

Lanes say what kind of chat should run the job:

| Lane | Meaning |
| --- | --- |
| `plain` | Any GPT-5.6 Sol chat in Showdown visual. |
| `plain-image` | A chat that can generate images. At most 2 at once. |
| `plain (work if job 0 says no screenshots)` | Plain chat, unless job 0 found plain chats cannot render screenshots; then Sol Work mode. |
| `work` | Sol Work mode (terminal, browser). |
| `codex` | Codex review (job 108). |
| `team-g` | Tracks Team G. Never start it. |

If you are in the wrong kind of chat for the lane (for example a `work` job in a chat with no terminal), say so in your first reply and stop: `Job N needs Sol Work mode (lane work). Open it there with the starter line.`

## 5. The job file and the status file

**Job file** (`jobs/JOB-NNN.md`), read top to bottom:
- Header table: phase, type, lane, worker, wave, number of steps, whether Claude looks.
- **Depends on**: job numbers that must be DONE or SKIPPED first.
- **WAITING ON NIK / WAITS ON TEAM G / TEAM G TRACKING ONLY / Note** (if present).
- **Goal**: the outcome in one paragraph.
- **Read first**: papers and code to read before step 1.
- **The mockup and what to take from it**: what to copy from the mockup.
- **Product truth that overrides the mockup**: what to change. Truth beats mockup, always.
- **Steps**: numbered. Your work.
- **Deliverables**: the files you must leave behind.
- **Self-check**: lines to mark PASS or FAIL with evidence.
- **Done when**: the finish condition.

**Status file** (`status/JOB-NNN.md`) has this exact shape; keep the first lines machine-readable:

```
# Status · JOB-007 · Truth sheet: Final Winner

State: IN PROGRESS
Step: 3 of 7
Updated: 2026-10-02 14:05 UTC
Chat: GPT-5.6 Sol, Showdown visual

## Notes

- Step 1: found renderFinalWinner in js/showdownUI.js:412; ids listed in TRUTH.md.
- Step 2: 23 strings copied word for word.
- Step 3: data contract section written, cites DATA_CONTRACT_V1 §4.

## Self-check

## Blocked question
```

`State` is exactly one of: `NOT STARTED`, `IN PROGRESS`, `DONE`, `SKIPPED`, `BLOCKED`, `WAITING ON NIK`, `WAITING ON TEAM G`. `Step: k of n` is the last finished step (the board turns it into a percent). One note line per step, short and factual.

## 5b. Claude's quality check (2026-10-03)

When you set `State: DONE`, the board lists the job as "waiting for Claude's check". Claude renders and scores it against QUALITY_BAR.md (average 4.2 or more, no criterion under 3, hard gates pass) and writes one line under `Chat:`:
- `Claude check: PASS 4.4`: the job counts as done.
- `Claude check: FIX 3.8`: the state becomes `IN PROGRESS · FIX` and the status file gets a `## Claude fix list`. The board lists it under Type next as `N (fix)`. The next chat does only those items, two per turn, saves after each, then sets `State: DONE` again (keep `Step:` as it is). Never edit or delete the `Claude check:` line or the fix list yourself.

Aim to pass the first time: before DONE, re-read your self-check against QUALITY_BAR criteria and fix what you can.

## 6. The gate: may I start?

Check these in order. Stop at the first one that applies and reply with exactly that line.

| What you find | Your reply (one line), then stop |
| --- | --- |
| Lane is `team-g` | `Job N tracks Team G's work; workers never start it. Pick a number from "Start now" on the board.` |
| State `DONE` | `Job N is already done.` |
| State `SKIPPED` | `Job N was skipped: <reason from the notes>.` |
| State `WAITING ON NIK` | `Job N is waiting on Nik: <the WAITING ON NIK line from the job file>.` |
| State `WAITING ON TEAM G` | `Job N is waiting on Team G: <the WAITS ON TEAM G line from the job file>. Claude clears it when Team G delivers.` |
| State `BLOCKED` | `Job N is blocked on a question for Claude: <the blocked question>.` |
| A dependency's status is not `DONE` or `SKIPPED` | `Job N waits for job X, Y (not done yet).` |
| Wrong kind of chat for the lane | see §4 |
| State `IN PROGRESS · FIX` | Claude's quality check sent the job back. Do ONLY the numbered items under `## Claude fix list` in the status file (§5b), then set `State: DONE`. |
| State `IN PROGRESS` | Continue from the step after `Step: k`. Read the notes first; re-check the last step's files exist before building on them. |
| State `NOT STARTED` | Start at step 1. |

To check dependencies, open each `status/JOB-XXX.md` named under "Depends on" and read its `State:` line. Do not trust the board's progress column for this; the status files are the truth.

**Read the newest version, not a cached copy (2026-10-03).** Raw links that name the branch (`.../factory/v1-wtt5ye/...`) can be several minutes old, so a dependency that just finished can still look unfinished. Before you reply "waits for", re-check every dependency that is not DONE this way:
1. Get the branch's newest commit id: through the GitHub connector, or by opening `https://api.github.com/repos/nikahanghojjati-oss/fifa17-career-showdown2/commits/factory/v1-wtt5ye` and reading the first `"sha"`.
2. Open the status file pinned to that commit: `https://raw.githubusercontent.com/nikahanghojjati-oss/fifa17-career-showdown2/<sha>/project-documents/factory/status/JOB-XXX.md`.
Only if that pinned copy still is not DONE or SKIPPED do you reply `Job N waits for job X, Y (not done yet).` Use the same pinned links for the job file and everything else you read in that chat.

## 7. Saving your work: text only, you save it yourself (2026-10-03, final rule)

One rule, no options: **you save text files to `factory/v1-wtt5ye` yourself, after every step. You never make, upload, zip or hand over binary files.** Nik carries nothing.

- **Text** (HTML, CSS, JS, JSON, MD, SVG, Python, your status file): save each to its repo path, commit message `Job N step k/n: <short step name>`; last one `Job N done: <job title>`. Never another branch, never force-push, never delete files you did not create in this job.
- **Anything a script can make from files already in the repo** (cut-outs and rims, crops, title crops, WebP/PNG exports, previews, screenshots, QA renders, diffs): do NOT make it. Write the recipe instead: polygons or boxes in `platemap.json`, and the exact commands in `tools/MAKE_ASSETS.md` in the screen folder (for example `python3 visual-assets/v10_1/shared/tools/cutout.py --plate ... --map ... --key cutouts.daniel_arms --output assets/OVL_..._V1 --rim`). Reference the final file names in your code as if they exist. Claude runs the recipe, commits the files and renders the screen.
- **Brand-new pictures** come only from image tickets in a ChatGPT Temporary Chat; Nik drops those in Claude's factory thread. A project chat never generates or hands over a picture.
- **No inbox, no base64 parts, no zip.** (SELF_UPLOAD.md is retired.) If your chat cannot write to GitHub at all, set `State: BLOCKED` with `Blocked question: this chat cannot save to GitHub.` and stop.
- **You cannot read the repo at all**: first line `I can't read the repo (<reason>). Fix: turn on GitHub with + > Connectors > GitHub, or allow web search, then send N again.`

Older job files may still say "zip", "inbox" or "upload". Read them as this section.

## 8. Doing the steps well

- Work to the quality bar, not to "it works". The bar is a AAA FIFA 17 / The Journey menu, not a website.
- Steps are numbered for a reason: each one has a check you can see. Do them in order; never quietly skip one. If a step is impossible in your chat, write why in the notes and do the rest; if that makes the job meaningless, set BLOCKED.
- Stay inside the files the job names. Do not "improve" other screens, papers or jobs.
- Copy product strings word for word from the code on `main`. Never paraphrase them.
- Every number and name that can change is live DOM text from `fixtures.json`, never baked into an image.
- Preview data is fictional, labelled "Preview data", and within the bounds in DATA_CONTRACT_V1 §0. Whenever you write or change preview numbers, keep the plain season inputs in a top-level `checkSource` block and run `python3 visual-assets/v10_1/shared/tools/check_fixtures.py <fixtures.json>` until it prints `0 errors`. Real Showdowns have limits: both managers play in one league, so only one can finish in each position and only one can win the Champions League, the domestic cup, top scorer or top assist in a season.
- Measure, don't guess: positions as a % of the mockup, phone fit with factory-qa, page weight in KB.
- When the job says "Claude look: yes", finish normally; Claude reviews after you.

## 9. The rules that never bend

1. **Daniel LEFT, Nik RIGHT**, on every screen, card, table and phone layout. Never mirror character art.
2. **No real** club crests, league logos, trophies, EA/FIFA art, press photos or players. Our own crests, league marks and trophy art only. The mockups contain real logos; they never ship.
3. **No player photos**, with one exception: the Loading screen's Marco Reus photo with its credit line.
4. **Never bake live data into images**: names as data, scores, fees, stats, codes, timers.
5. **Only real buttons and recorded stats.** If the product has no behaviour for a mockup button, drop it. If the game does not record a stat, drop it (PRODUCT_TRUTH §3, DATA_CONTRACT_V1 §9).
6. **Scoring never changes**: Champions League 5, league title 3, domestic cup 1, performance bonus max 1, awards bonus max 1, season max 11. The app computes the score; nobody types it.
7. **Privacy:** never show the rival's unpublished inputs (season entries before results-ready, Transfer War guesses before the reveal).
8. **Phone:** 393 × 660 with no page scroll; 360 × 640 no scroll; the primary action visible at 375 × 553. Hub screens leave room for the 56 px bottom bar.
9. **Never ask Nik product questions.** If something is truly missing or contradictory: `State: BLOCKED`, write the exact question under "Blocked question", save, and reply `Job N is blocked: <question>`. Claude answers it.
10. **Never touch `main`**, never force-push, never delete branches or files you did not create.

## 10. Image jobs (lane fresh chat (image))

- **Image jobs are not run inside the Showdown visual project** (Nik, 2026-10-02): images come out better in a ChatGPT Temporary Chat outside any project (no memory, no chat history; save only the picture that chat made). Nik runs each image from its ticket in `project-documents/factory/tickets/` and drops the result in Claude's factory thread; Claude checks, commits and finishes the job. If a project chat is given an image job's number, it replies only: "Job N is an image job. Run its ticket in a new chat outside this project (see project-documents/factory/tickets/README.md)." The rules below still describe what a correct image is.

- **The image tool makes only the asset the job asks for.** Never make a summary, status or "job completed" picture, a screen mockup, or any person other than Daniel and Nik as the mockup shows them. Progress and results are plain text; the picture goes back the way the ticket says. A result that is not the requested asset is a failed try: discard it and retry in a new chat.

- One image per request. Never ask for several assets in one image.
- Edits, not new pictures: attach the guide image and ask for an edit, as the job's prompt says, word for word.
- **Likeness lock**: after an edit, keep the edited pixels only inside the edit zones (6 px feather) and the original mockup pixels everywhere else. Faces and hands always come from the original.
- Reject any result that adds a person, text or a logo, or changes a face; try again in a new request (at most 3 tries). Never edit an edit.
- Check spelling letter by letter on any wordmark.
- Save exactly the filenames the job lists, with sizes and SHA-256 in the intake report.

## 11. Chat types and their tools

| Chat | Can usually | Use it for |
| --- | --- | --- |
| Plain GPT-5.6 Sol chat in Showdown visual | Read the repo (connector or raw links), run Python in a sandbox, generate images, give file downloads | Truth sheets, image jobs, papers, builds when job 0 says screenshots work |
| Sol Work mode | Terminal, browser, Playwright screenshots | Lane `work`, and builds and reviews if plain chats cannot take screenshots |
| Codex | Code review | Job 108 only |

Job 0 records what plain chats can really do in `project-documents/factory/smoke/CAPABILITIES.md`. Read it when a job needs screenshots or images.

## 12. How to talk to Nik

- Plain, short sentences. He reads on a phone between other things.
- First reply: the handshake line `Job N · <title> · <State>`, then one line on what you are doing first.
- During work: one line per finished step at most.
- Finish: one line, what you made and what it unlocks, and that it is saved. Example: `Job 7 done and saved: the Final Winner truth sheet and fixtures. It feeds the Final Winner build (job 82).`
- Never ask him to decide product questions. Never ask "should I continue?". The only stop line between steps is the Pace rules one: `Step k of n done and saved. Type continue for step k+1.`

## 13. Examples

**"0" in a fresh chat with the connector on:**
`Job 0 · Factory smoke test · NOT STARTED` / `Starting step 1: reading the board.`

**"job 12" while job 0 is not done:**
`Job 12 · Showdown tokens and type system · NOT STARTED` / `Job 12 waits for job 0 (not done yet).`

**"98":**
`Job 98 · Team G G-3: the pure career model · WAITING ON TEAM G` / `Job 98 tracks Team G's work; workers never start it. Pick a number from "Start now" on the board.`

**"104" while job 102 is open:**
`Job 104 · Showcase: screens read Team G's model-true fixtures · NOT STARTED` / `Job 104 waits for job 102, 103 (not done yet).`

**"it is in":**
`This is the factory project: send a job number. The Sol relay runs in your other ChatGPT project.`

**"status 7":**
`Job 7 · State IN PROGRESS · Step 3 of 7 · Last note: data contract section written.`

## 14. Troubleshooting

| Problem | What to do |
| --- | --- |
| The connector can't see the repo or branch | Use the raw links (pattern at the top). Branch names with a slash work in raw links. |
| A raw link returns 404 | Check the three-digit number and the exact path; the file may not exist yet (then the job is not ready). |
| GitHub refused a save ("write guard") partway through a step | Pace rule 9: stop, reply `Job N paused: GitHub refused a save in step k. Type N in a new chat.` The new chat keeps the files already saved and writes only the missing ones. |
| The chat stalls in "thinking" or Nik pressed stop | Nothing is lost if you saved per step. On `continue` (or the number in a new chat), re-read the status file and do the next unsaved step. |
| You run out of room mid-job | Save (your files and the status at the last finished step, §7) and tell Nik: `Open a new chat and type N; it continues from step k+1.` |
| Two chats on the same job | The status file decides. If it already says IN PROGRESS with a recent `Updated:` time from another chat, reply `Job N is already being worked on in another chat.` and stop. |
| Mockup and PRODUCT_TRUTH disagree | PRODUCT_TRUTH wins. Write the difference in the notes. |
| PRODUCT_TRUTH and the live code on `main` disagree about behaviour | `main` wins. Write it as a NOTE. |
| A tool is missing (scikit-image, Playwright) | Try `pip install` once in the sandbox. If it still fails, write exactly what failed in the notes; if the step cannot be done without it, set BLOCKED. |
| You remember an older Showdown process from ChatGPT memory | Ignore it. This handbook and the job file are the only rules here. |
