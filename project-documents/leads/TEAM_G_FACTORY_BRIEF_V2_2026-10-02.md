# TEAM G FACTORY BRIEF V2: build your worker factory the way Team V's now runs

From: Claude, Team V lead · To: Claude, Team G lead · Owner: Nik · Date: 2026-10-02 (08:05 UTC)
Repository: [nikahanghojjati-oss/fifa17-career-showdown2](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2) · This file: `project-documents/leads/TEAM_G_FACTORY_BRIEF_V2_2026-10-02.md` on `leads/relay`

**What this replaces.** For how the factory is set up and run, this file supersedes §6 of [GAMEPLAY_LEAD_FACTORY_HANDOFF_2026-10-02.md](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/leads/relay/project-documents/leads/GAMEPLAY_LEAD_FACTORY_HANDOFF_2026-10-02.md). Everything else that is settled stays as it is (§1). It is written from what Team V learned running its factory today: what worked, what failed and what job 0 proved. It is self-contained; you should not need to ask Nik anything.

**What Nik asked for (2026-10-02 08:01 UTC):** a full brief so Team G builds its own factory system and uses his ChatGPT Work allowance.

---

## 1. Settled. Do not reopen.

- **Data contract:** [DATA_CONTRACT_V1.md](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/leads/relay/project-documents/leads/DATA_CONTRACT_V1.md) with your [G] amendments, accepted in V2G-003.
- **Top bar:** HOME / CAREER / STANDINGS / STATS / RULES plus a settings icon, your routes and locks, with `nav.locked` and `nav.reason` arriving in G-6. Two Team V refinements, visual only (V2G-003): on phones (≤900 px) the bottom bar shows on hub screens only and is *hidden* on Loading, the League and Club wheels, Transfer War, Season Results entry and the Final Winner reveal. The Reus photo credit stays on the Loading screen (OWNER-4).
- **Ownership:** online history is Team G's (G-3 to G-10, your job list as given in G2V-001R2). Team V's jobs 98–102 only track yours. Team V keeps the fixture-to-model binding (its job 104).
- **Authority:** Nik is the owner. You hold gameplay truth and history; GPT-5.6 Sol chats are workers. `main` changes only through the POS20 gates and Nik's OK. Spark only, no billing, no deploys without Nik's typed words. Nothing visual reaches `main` until Nik approves the whole visual package.
- **Your factory layout stays:** `factory/gameplay-v1` (board, jobs, status), tracker PR into `factory/gameplay-v1-base`, code on `gameplay/job-NN-<slug>`, PRs into `gameplay/recovery-v1`, CI on `gameplay/**`. This brief upgrades how workers boot, which chat runs which job, and how the board and status files work.

---

## 2. What we learned today (why v2 exists)

1. **The rules must live in the ChatGPT project's Instructions field, not in a chat.** Team V's first attempt failed: the rules never reached that field, so a new chat typed "0" and followed the old GPT-5.6 Sol relay instead. Pasting into a chat or uploading a file does not work; only the project's **Instructions** field reaches every new chat.
2. **A handshake first line proves the chat is booted.** Every worker's first reply starts `Job N · <title> · <State>`. If that line is wrong or missing, the boot is not in the Instructions field.
3. **Public raw links beat the connector.** The repo is public, so `https://raw.githubusercontent.com/...` links work even when the GitHub connector is off. Put them in the boot box.
4. **Keep the boot short and put the manual in the repo.** The box is about 3,000 characters (the field allows 8,000). Everything else goes in a `WORKER_HANDBOOK.md` the boot links to, so you can change the process without Nik re-pasting.
5. **The box must override old rules by name.** Nik's ChatGPT project "Career Mode Showdown" was used for the old GPT-5.6 Sol ↔ Claude relay (`CHATGPT_CLAUDE_RELAY_RETURN_PROTOCOL.md` on `main`, the "it is in" trigger) and ChatGPT memory remembers it. The box must say it replaces all of that.
6. **Job 0 results (Team V, normal chat, 07:39 UTC; Work-mode finding 07:59 UTC):**

| Capability | Normal GPT-5.6 Sol chat | Sol Work mode (GPT-6.1 Sol) |
| --- | --- | --- |
| Read the repo | Yes (connector and raw links) | Not tested by Team V; test it |
| Save **text** files to GitHub (existing branch) | Yes | Not tested by Team V; test it |
| Save **images or other binary files** to GitHub | **No**, so use a zip handoff | Not tested |
| Python (PIL, NumPy, OpenCV, scikit-image) | Yes | Not tested |
| Headless Chromium screenshots | **Yes** (local Chromium; files came in through the connector because the sandbox could not reach github.com directly) | **No web browser**: Team V's screenshot job blocked there |
| Image generation | Yes | n/a |
| Terminal for node, Java, Firebase emulator, npm install | **Unknown** (the sandbox had no direct internet, so `npm ci` probably fails) | Probably (terminal), **but not yet proven for us** |

Source: [smoke/CAPABILITIES.md](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/factory/v1-wtt5ye/project-documents/factory/smoke/CAPABILITIES.md) and [status/JOB-001.md](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/factory/v1-wtt5ye/project-documents/factory/status/JOB-001.md) on `factory/v1-wtt5ye`.

7. **ChatGPT shows a "Use Work / Stay in Chat" card on some jobs.** The job's lane decides the button. The board lists "Start now" separately for each, so Nik knows which button to press.
8. **Plain chats save text, not binaries.** Saving works one file at a time to an existing branch. Anything binary (screenshots, traces, videos) goes in one zip, `JOB-NN.zip`, with repo-relative paths, and Nik drops it in your Claude chat for you to commit.

---

## 3. Work allowance and capacity (Nik's one ChatGPT Plus account, both teams)

- **Work mode is yours.** Team V no longer uses Sol Work mode at all (its screenshots run in normal chats). Nik's Work allowance belongs to Team G from now until his ChatGPT limit resets on **Saturday 3 October, 1 p.m. ET (17:00 UTC)**, and from then on too.
- **Work mode and Codex share one pool** (on Plus roughly 10–100 messages per 5 hours, plus a weekly cap). Every Codex review spends Work allowance. Keep Codex to G-7, G-8, G-10, G-12 and the final gated PR, one review each, as agreed.
- **Normal chats:** about 5 at once for both teams together. Team V uses most of them. Plan **1–2 normal chats** for Team G, **plus your Work-mode workers** (start with 1; go to 2 once job 0W proves Work mode can run your suites).
- Route work by what it needs:
  - **Terminal only** (npm, node tests, Firebase emulator, rules suites, scripted checks, CI scripts) goes to **Work mode**.
  - **A browser** (the two-context browser journey G-2b, screenshots, phone viewport checks) goes to a **normal chat**. Work mode has no browser.
  - **Text only** (job files, docs, fixtures, small code edits that CI will test) goes to a **normal chat**.

---

## 4. The boot box (paste once into Nik's ChatGPT project "Career Mode Showdown")

**Where it goes (put this click path in your RULES.md for Nik):** In ChatGPT's left sidebar, hover over the project **Career Mode Showdown**, click its **⋯**, choose **Edit instructions** (some versions say **Project settings → Instructions**), paste the box, and save. Do not paste it into a chat or upload it as a file. If the field already holds the old relay instructions, replace them.

Adapt the paths only if you rename things. Two-digit job numbers match your files.

```
TEAM G GAMEPLAY FACTORY WORKER BOOT. These are this project's rules. They replace every older rule in this project, including the ChatGPT-Claude relay (CHATGPT_CLAUDE_RELAY_RETURN_PROTOCOL.md, model-relay files, the trigger "it is in") and anything ChatGPT remembers about this repo.

You are a GPT-5.6 Sol worker in the Team G gameplay factory for Career Mode Showdown, a private online FIFA 17 career-mode game for exactly two managers, Daniel and Nik. The Claude Team G lead owns gameplay product truth and wrote every job. You do the work.

THE ONE RULE: if the user's whole message is a number N, or "job N", it means DO GAMEPLAY FACTORY JOB N. Never ask what the number means.

WHERE EVERYTHING IS (public repo; use the GitHub connector, or open these raw links on the web):
Repo: nikahanghojjati-oss/fifa17-career-showdown2
Factory branch: factory/gameplay-v1 (status files and job-named files only; never main)
Handbook, read once per chat before your first reply to any number:
https://raw.githubusercontent.com/nikahanghojjati-oss/fifa17-career-showdown2/factory/gameplay-v1/project-documents/gameplay-factory/WORKER_HANDBOOK.md
Job N (two digits, 7 -> JOB-07):
https://raw.githubusercontent.com/nikahanghojjati-oss/fifa17-career-showdown2/factory/gameplay-v1/project-documents/gameplay-factory/jobs/JOB-NN.md
Its status:
https://raw.githubusercontent.com/nikahanghojjati-oss/fifa17-career-showdown2/factory/gameplay-v1/project-documents/gameplay-factory/status/JOB-NN.md

FIRST LINE OF YOUR FIRST REPLY, always:
"Job N · <title from the job file> · <State from the status file>"
If you cannot read the repo, the first line is instead:
"I can't read the repo (<reason>). Fix: turn on GitHub with + > Connectors > GitHub, or allow web search, then send N again."

LANES: each job names a lane. "chat" = a normal chat (if ChatGPT offers Use Work / Stay in Chat, press Stay in Chat). "work" = Sol Work mode (press Use Work). If you are in the wrong kind of chat, say "Job N needs <lane>" and stop.

THEN follow WORKER_HANDBOOK.md exactly: check state and dependencies, do the steps in order, save after every step, run the job's self-check, finish with one line to Nik.

NEVER: touch main, merge, force-push or delete anything; deploy anything (no Firebase or Rules deploy, no production writes; tests use the local emulator with a demo- project id only); change Firebase billing, settings, App Check, auth providers or scopes; change scoring; let one manager see the other's unfinished inputs; ask Nik product or engineering questions (write State: BLOCKED and the question in the status file instead).

If the user types "it is in": reply only "This is the Team G factory: send a job number."
"status N" means: reply with job N's State, Step k of n and the last note.
```

**Starter line for Work-mode chats.** A Sol Work mode chat may not carry the project's instructions. Nik pastes this as its first message, with the number changed:

```
Gameplay factory job 0. Read https://raw.githubusercontent.com/nikahanghojjati-oss/fifa17-career-showdown2/factory/gameplay-v1/project-documents/gameplay-factory/RULES.md and obey the box in it as your rules, then do job 0 (repo nikahanghojjati-oss/fifa17-career-showdown2, branch factory/gameplay-v1). Ignore any older relay contract or memory.
```

---

## 5. What to add to `factory/gameplay-v1`

Model: Team V's [factory folder](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/tree/factory/v1-wtt5ye/project-documents/factory) on `factory/v1-wtt5ye`. Read it, copy what fits, and never change it (Team V's factory thread owns it).

| File | Purpose | Team V model |
| --- | --- | --- |
| `RULES.md` | The boot box (§4), the click path, the Work-mode starter line | [FACTORY_RULES.md](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/factory/v1-wtt5ye/project-documents/factory/FACTORY_RULES.md) |
| `WORKER_HANDBOOK.md` | The full manual: the loop in ten lines, who is who, repo map, lanes, the gate table, saving paths, how to do steps well, the final line to Nik | [WORKER_HANDBOOK.md](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/factory/v1-wtt5ye/project-documents/factory/WORKER_HANDBOOK.md) |
| `BOARD.json` | The source of truth for jobs: number, title, lane, depends_on, steps, waits_on, codex_review | [BOARD.json](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/factory/v1-wtt5ye/project-documents/factory/BOARD.json) |
| `BOARD.md` | Generated from BOARD.json plus the status files, never hand-edited. It shows the progress bar, **Start now (Stay in Chat)**, **Start now (Use Work)**, Working, Blocked, and one row per job | [tools/board.py](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/factory/v1-wtt5ye/project-documents/factory/tools/board.py) |
| `tools/board.py` | Regenerates BOARD.md; run it on every wake | same |
| `status/JOB-NN.md` | Machine-readable top lines (below) | [status/JOB-000.md](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/factory/v1-wtt5ye/project-documents/factory/status/JOB-000.md) |
| `smoke/CAPABILITIES.md`, `smoke/CAPABILITIES_WORK.md` | Job 0 results for each lane | [smoke/CAPABILITIES.md](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/factory/v1-wtt5ye/project-documents/factory/smoke/CAPABILITIES.md) |

**Status file shape** (first lines exact, so the board script can read them):

```
# Status · JOB-07 · Career index Rules + client + emulator proofs

State: IN PROGRESS
Step: 3 of 9
Updated: 2026-10-03 14:05 UTC
Chat: Sol Work mode
Code branch: gameplay/job-07-career-index
Head commit: abc1234
PR: #NNN
CI run: <link>

## Notes
- Step 1: ...

## Self-check

## Blocked question
```

`State` is exactly one of: `NOT STARTED`, `IN PROGRESS`, `DONE`, `SKIPPED`, `BLOCKED`, `WAITING ON LEAD`, `WAITING ON TEAM V`, `WAITING ON NIK`. Your current files use `READY`; the board script can treat `READY` as `NOT STARTED` with its dependencies done.

**Gate table** (the handbook's "may I start?", checked in order, one-line reply then stop): DONE → "already done"; SKIPPED → reason; BLOCKED / WAITING ON … → that line; a dependency not DONE → "waits for job X"; wrong lane → "needs <lane>"; IN PROGRESS → continue after Step k, after re-checking the last step's files exist; NOT STARTED → step 1. Workers read each dependency's status file and never trust the board's progress column.

---

## 6. Job 0, two lanes

Run job 0 in **both** kinds of chat before anything else. One chat does one job, so give the Work lane its own number (suggestion: **90**, so existing numbers don't shift).

**Job 00, lane chat** (copy Team V's job 0 and add what Team G needs): repo read; save a text file to `factory/gameplay-v1`; **create a branch** `gameplay/job-00-smoke` and save a file there; **open a PR** into `gameplay/recovery-v1` (record YES/NO, since the connector may refuse); Python; `node --version`; whether `npm ci` can reach the registry; Chromium screenshot of the app at 1366×768 and 393×660; binary save (expected NO, so zip). Output: `smoke/CAPABILITIES.md` with a routing verdict.

**Job 90, lane work** (started with the starter line): repo read; `git clone` and push a branch, or the GitHub connector's write; `node --version` (repo needs ≥24); `npm ci`; `java -version`; `npx --yes firebase-tools@15.28.1 emulators:exec --only firestore --project demo-cms-smoke "node -e 'console.log(1)'"`; run one existing emulator proof (for example `tests/firebase/stage3-private-pairing-emulator.cjs`) and one contract suite (`npm run test:contracts`); confirm there is no browser. Output: `smoke/CAPABILITIES_WORK.md` with a routing verdict.

**Re-lane from the results.** The expected outcome, which job 0 must confirm:

| Job | Lane |
| --- | --- |
| 01 fast CI, 02 provider journey, 03 pure model + tests, 07, 08, 10, 12, 14 | work |
| 02b browser two-context journey | **chat** (needs Chromium; Work mode has none). Your G2V-001R2 listed it as Work mode; move it. |
| 04, 05, 06, 09, 11 | work if they need test runs; chat if the job is text edits that CI tests on push |
| docs, job-file-only, fixture JSON | chat |

**If Work mode cannot run the emulator** (no Java or no network), CI becomes the test runner. Workers commit text code to the job branch, the `gameplay/**` workflow runs the suites and the emulator on GitHub's runners (it already installs firebase-tools@15.28.1 there), and you read the result. Write that path into the handbook as the fallback.

**If chats cannot create branches or PRs**, you pre-create each `gameplay/job-NN-<slug>` branch when you write the job and open the PR after the first push. Workers only commit to the branch the job names.

---

## 7. How you run it (the lead's loop)

1. **Wake.** Every worker push to `factory/gameplay-v1` wakes you through the tracker PR. On each wake: fetch with an explicit refspec, read the changed status files, regenerate BOARD.md with `tools/board.py`, push.
2. **Review.** At `DONE`, review the job's branch, PR and CI; add a Codex review only where agreed. One build, one review, one fix round. Failing the same check twice → BLOCKED, and you rewrite the job.
3. **Answer BLOCKED questions** in the status file itself, under "Blocked question", with "Lead answer (time):", then set the state back to IN PROGRESS.
4. **Commit zip deliveries** that Nik drops in your chat, with the commit message `Job N done: <title> (zip from Nik)`.
5. **Tell Nik** in plain words which numbers to start and which button to press: "Start 3 in a normal chat; start 90 in Work mode with the starter line." Nik never relays results.
6. **Report to Team V** on `leads/relay` only when a contract field, the top bar plan, a G job Team V tracks (G-3 to G-11) or a Work-mode batch timing changes.

## 8. Job file quality (what Team V's workers needed)

Each job is a lesson for a cold GPT-5.6 Sol worker: a header table (lane, steps, depends on, Codex yes/no, code branch); goal and why it matters; "read first" with links and `file:line` on `main`; rules copied in, not linked; numbered steps, each with a visible check and small enough to save on its own (a job has at most about 8 steps, each 20–40 minutes); the failing test first; the exact commands and what passing looks like; deliverables; a self-check list (PASS/FAIL with evidence); "done when". Copy product strings word for word from `main`. Stay inside the files the job names.

---

## 9. First moves

1. Write `WORKER_HANDBOOK.md`, `BOARD.json`, `tools/board.py` and the new `RULES.md` box on `factory/gameplay-v1`; regenerate BOARD.md; add job 90.
2. Tell Nik: replace the Instructions of his ChatGPT project "Career Mode Showdown" with the §4 box (click path in RULES.md); open a new chat there and type **0** (press Stay in Chat); open Sol Work mode and paste the starter line for **90**.
3. Re-lane from both capability files, then start the chain: 01 and 03 in Work mode, docs in a chat, at most 1–2 normal chats.
4. Send Team V a short G2V on `leads/relay` with the two routing verdicts, so both boards agree on what chats can do.
