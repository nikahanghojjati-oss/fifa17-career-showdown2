# JOB-00 · Factory smoke test

| Mode | Depends on | Steps | Code branch | Codex review |
| --- | --- | --- | --- | --- |
| plain chat (Work mode also fine) | nothing | 6 | `gameplay/job-00-smoke` (test only, never merged) | no |

## 1. Goal

Find out exactly what a Team G worker chat can do: read the repo, push to the factory branch, push a code branch, open a pull request, and run a terminal. Every later job is routed by this answer, so Nik and Daniel get working tests instead of chats that stall halfway.

## 2. Branches and files

- Read from and push status to: `factory/gameplay-v1`.
- Test code branch: create `gameplay/job-00-smoke` from `gameplay/recovery-v1`.
- Files you may create: `project-documents/gameplay-factory/smoke/hello.md`, `project-documents/gameplay-factory/smoke/CAPABILITIES.md`, `project-documents/gameplay-factory/status/JOB-00.md`, and on the test code branch only `project-documents/gameplay-factory/smoke/branch-test.md`.

## 3. Rules that apply (copied from the factory rules)

- Never push to `main`, never merge, never force-push, never delete anything.
- Never deploy or touch Firebase settings or billing.
- Stay inside the files above.

## 4. Steps

After each step update `status/JOB-00.md` and push it to `factory/gameplay-v1` with the message `Job 0 step k/6: <step name>`.

1. **Repo read.** Open `project-documents/gameplay-factory/BOARD.md` on `factory/gameplay-v1` and copy its first line into the status notes. Write which ChatGPT mode this chat is in (plain chat or Work mode) and which GitHub access you have (connector, terminal git, or none).
2. **Factory write.** Create `project-documents/gameplay-factory/smoke/hello.md` with the UTC date and time and the words "gameplay factory chat can write". Commit to `factory/gameplay-v1` with `Job 0 step 2/6: write test`. Record yes or no, and the exact error if no.
3. **Code branch and pull request.** Create branch `gameplay/job-00-smoke` from `gameplay/recovery-v1`, add `project-documents/gameplay-factory/smoke/branch-test.md` (one line: "branch test"), push it, and open a **draft** pull request from `gameplay/job-00-smoke` into `gameplay/recovery-v1` titled `Job 0 smoke PR (do not merge)`. Record the branch push and the PR link, or the exact error. Do not merge it; the lead closes it.
4. **Terminal.** If this chat has a terminal, run and record the output of each: `node --version` (the repo needs 24 or newer), `npm --version`, `git --version`, `java -version` (the Firebase emulator needs Java 21+), `npx --yes firebase-tools@15.28.1 --version`, `npx playwright --version`. If there is no terminal, write "no terminal" and go to step 6.
5. **Repo tests.** In the terminal: clone the repo, `git checkout gameplay/recovery-v1`, run `npm ci`, then `npm run test:contracts`. Passing output ends with a line like `PASS POS10 selected deterministic census (96/96 current blocking contracts: frozen POS10 floor + POS20 supplements).` Record the last line and how long it took.
6. **Verdict.** Write `project-documents/gameplay-factory/smoke/CAPABILITIES.md`: a table with rows repo read, factory push, code branch push, open PR, terminal, node ≥ 24, java ≥ 21, firebase emulator CLI, playwright, contract suite passes; each YES or NO with one line of detail. On its first line write exactly one verdict:
   - **ALL GREEN**: everything YES.
   - **NO TERMINAL**: code and test jobs must run in Work mode.
   - **NO PUSH**: chats hand Nik zip files for the lead.
   - **NO PR**: chats push branches; the lead opens the PRs.
   Commit, set State: DONE, push `Job 0 done: Factory smoke test`.

## 5. Tests first

None; this job makes no product change.

## 6. Done checklist (write PASS/FAIL with evidence in the status file)

- [ ] Every capability row has YES/NO and evidence.
- [ ] Only the files listed in section 2 changed.
- [ ] Nothing pushed to `main`; nothing merged; nothing deployed; no Firebase setting touched.
- [ ] Status file shows State: DONE with the CAPABILITIES verdict copied in.

## 7. When stuck

Write the blocker in `status/JOB-00.md` with State: BLOCKED, push it, and reply "Job 0 is blocked: <reason>". If you cannot push at all, give Nik `JOB-00.zip` as the factory rules say.
