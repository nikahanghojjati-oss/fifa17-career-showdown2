# Team V bug factory (from 5 Oct 2026, 7:30 p.m. Eastern)

Nik's standing rule (relay ticket HO-008): for now both factories are **bug factories**. Every new bug (not new features) is digested, analyzed and packaged by the Claude lead into a job for a GPT worker. Claude threads do not fix new bugs themselves; work already in progress is finished.

## Where bugs come from

- Team G's bug factory receives Nik's bug lists. Wiring bugs stay in Team G. Glitches that need Team V's design work arrive here as hand-off tickets (`HO-NNN`, G → V) on `leads/relay`.
- Bugs Nik reports straight to Team V (project chat, screenshots) go through the same packaging.

## Packaging one bug (the lead does this)

1. **Number:** claim it from the shared counter (both teams, never reused; CONTRACT.md §10). From a `leads/relay` checkout:
   `python3 project-documents/leads-relay/tools/claim_number.py --team V --title "<short title>"` → prints e.g. `1002`.
2. **Read the cause** on the code the bug lives in (file and line numbers), so the worker never has to search.
3. **Write `jobs/JOB-NNNN.md`** (the number as claimed, four digits) in the JOB-1001 shape: lane table (lane, depends on, steps, code branch, PR into), the bug in Nik's words, why it happens with `file:line`, the only files the worker may change, numbered steps (at most 3), and a Done list. Write `status/JOB-NNNN.md` with `State: READY`.
4. **Open the tracking PR** `V-NNNN <short title>` into `factory/v1-wtt5ye` with a fenced `progress` block (SHARED_BOARD.md). `worker` is `sol-chat` (blue) or `sol-work` (green).
5. **Tell Nik one line:** `Type NNNN in <GPT blue: a new normal chat in Showdown visual | GPT green: Sol Work mode with the starter line>.`

## Lanes

| Lane | Model and place | Fits | Can | Cannot |
| --- | --- | --- | --- | --- |
| 🟦 **GPT blue** (`sol-chat`) | GPT-5.6 Sol, normal chat in the ChatGPT project "Showdown visual" (press Stay in Chat) | CSS, text, small edits with exact values | read and commit through the GitHub connector | run npm or tests, see a browser |
| 🟩 **GPT green** (`sol-work`) | ChatGPT Sol 6.1, Work mode, opened with the starter line in FACTORY_RULES.md | logic fixes covered by node tests | run node tests, push its own branch, open a PR | see CI, see a browser |

Default lane: blue for anything visual; green only when the fix needs a test run.

## Escalation ladder

Only after a GPT attempt fails, or when lessons (reviews/WORKER_SCORECARD.md) show GPT is not fit for that kind of job:

GPT blue / green → Sonnet → Opus → Fable (rare; after two failed fix rounds).

Write the reason on the job (a `ESCALATED: <lane> because <reason>` line in the status file and the PR's `current`).

## Pictures

Anything that needs a new Team V image or a GPT image ticket goes to Nik first: tell him what is needed and he handles it. The lead never starts an image ticket on its own.

## CI checks and the Physio

Workers leave the CI gates and the Showdown Gate Physio alone and never treat their files as contamination: WORKER_HANDBOOK.md section 9b. A bug job's PR may show files from a newer main; that is expected.

## Done means verified

GPT cannot see the screen or CI, so a bug job is done only after the lead checks it:

- screenshots at phone (393x660, 360x640) and desktop (1920, 1440, 1280) sizes, saved under `evidence-claude-check/NNNN/`,
- node tests or CI where the job touches logic,
- then the lead merges (or sends one round of exact numbers back) and ticks the last progress step.

## Bug board

One board for both teams (HO-012), built by Team G; Team V jobs show as `NNNN · V`: https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/factory/gameplay-v1/project-documents/gameplay-factory/BOARD.md
