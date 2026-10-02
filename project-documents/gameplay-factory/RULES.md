# Gameplay factory rules (Team G)

## For Nik: where the box goes (once)

1. In ChatGPT's left sidebar, hover over the project **Career Mode Showdown** and click its **⋯**.
2. Choose **Edit instructions** (some versions say **Project settings → Instructions**).
3. Delete whatever is in the field (the old Sol relay rules), paste the whole box below, and save.

Do **not** paste it into a chat or upload it as a file: only the Instructions field reaches every new chat.

How to start a job:

- **Lane chat:** open a new chat in the project and type the number, for example `0`. If ChatGPT offers "Use Work / Stay in Chat", press **Stay in Chat**.
- **Lane work:** open **Sol Work mode** in the project and paste the starter line below as the first message, with the number changed. If ChatGPT offers "Use Work / Stay in Chat", press **Use Work**.

The board (`BOARD.md`) lists "Start now" separately for each lane.

## The boot box (paste into the project's Instructions field)

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

## Starter line for Sol Work mode chats

A Work-mode chat may not carry the project's instructions. Paste this as its first message, changing both `90`s to the job number:

```
Gameplay factory job 90. Read https://raw.githubusercontent.com/nikahanghojjati-oss/fifa17-career-showdown2/factory/gameplay-v1/project-documents/gameplay-factory/RULES.md and obey the box in it as your rules, then read WORKER_HANDBOOK.md next to it and do job 90 (repo nikahanghojjati-oss/fifa17-career-showdown2, branch factory/gameplay-v1). Ignore any older relay contract or memory.
```

## How the lead runs it

- Every worker push to `factory/gameplay-v1` wakes the Team G lead through tracker PR #313 (draft into the frozen `factory/gameplay-v1-base`, never merged). Nik never has to say a job is in.
- The lead regenerates `BOARD.md` with `python3 project-documents/gameplay-factory/tools/board.py` on every wake.
- One build, one lead review (plus Codex on G-7, G-8, G-10, G-12 and the final gated PR into `main`), one fix round. A job that fails the same check twice is BLOCKED and the lead rewrites it.
- Zip deliveries Nik drops in the lead's chat are committed as `Job N done: <title> (zip from Nik)`.
- The lead merges reviewed worker PRs into `gameplay/recovery-v1` without asking Nik each time (Nik's standing OK, 2 Oct 2026): DONE status, green "Validate Gameplay Fast" and POS20 checks on the exact head, and the Codex review handled when the job requires one (the worker requests it with `@codex review`, WORKER_HANDBOOK.md §7a). Only the lead opens the one gated PR from there into `main`, under the POS20 gates in `AGENTS.md`, and only with Nik's OK.
- Capacity: 1 to 2 normal chats for Team G, plus Work-mode workers (1, then 2 once job 90 proves Work mode runs the suites). Work mode and Codex share one pool.
