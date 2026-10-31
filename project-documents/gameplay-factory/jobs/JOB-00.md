# JOB-00 · Factory smoke test (chat lane)

| Lane | Depends on | Steps | Code branch | PR into | Codex review |
| --- | --- | --- | --- | --- | --- |
| **chat** (normal chat, press Stay in Chat) | nothing | 6 | `gameplay/job-00-smoke` (test only, already created, never merged) | `gameplay/recovery-v1` | no |

## 1. Goal

Find out exactly what a normal Team G worker chat can do: read the repo, save text files, save to a code branch, open a pull request, run Python and node, reach npm, take Chromium screenshots of the app, and save binaries. Every later job is routed by this answer (job 90 does the same for Sol Work mode), so Nik and Daniel get working tests instead of chats that stall halfway.

## 2. Branches and files

- Status and results go to `factory/gameplay-v1`.
- Test code branch: `gameplay/job-00-smoke` (the lead already created it from `gameplay/recovery-v1`).
- Files you may create: `project-documents/gameplay-factory/smoke/hello.md`, `project-documents/gameplay-factory/smoke/CAPABILITIES.md`, `project-documents/gameplay-factory/status/JOB-00.md` (on `factory/gameplay-v1`), and on `gameplay/job-00-smoke` only `project-documents/gameplay-factory/smoke/branch-test.md`.

## 3. Rules that apply

- Never push to `main`, never merge, never force-push, never delete anything.
- Never deploy or touch Firebase settings or billing.
- Stay inside the files above.

## 4. Steps

After each step update `status/JOB-00.md` and save it to `factory/gameplay-v1` with the message `Job 0 step k/6: <step name>`.

1. **Repo read.** Open `project-documents/gameplay-factory/BOARD.md` on `factory/gameplay-v1` and copy its first line into the status notes. Record how you read it (GitHub connector or raw link) and which tools this chat has (Python sandbox, image tool, connector writer, terminal).
2. **Factory write.** Save `project-documents/gameplay-factory/smoke/hello.md` with the UTC date and time and the words "gameplay factory chat can write" to `factory/gameplay-v1`. Record YES or NO, and the exact error if NO.
3. **Code branch and pull request.** Save `project-documents/gameplay-factory/smoke/branch-test.md` (one line: "branch test") to `gameplay/job-00-smoke`. Then try to open a **draft** pull request from `gameplay/job-00-smoke` into `gameplay/recovery-v1` titled `Job 0 smoke PR (do not merge)`. Record each as YES (with the link) or NO (with the error). Do not merge; the lead closes it.
4. **Sandbox tools.** In your code tool run and record: `python3 --version`; `node --version` (if node exists); `npm view playwright version` (shows whether the sandbox reaches the npm registry); `java -version`. Missing tools are an answer, not a failure.
5. **Screenshots and binaries.** Using the Python sandbox, get the repo files you need for the Home screen (`index.html`, `css/`, `js/`, `assets/`, `data/` from `gameplay/recovery-v1`, through the connector or raw links), serve them with `python3 -m http.server 8765`, and take Chromium screenshots of `http://127.0.0.1:8765/` at 1366 × 768 and at 393 × 660. Then try to save one PNG to `factory/gameplay-v1` as `project-documents/gameplay-factory/smoke/home_393x660.png`. Record whether the screenshots worked and whether the binary save worked. If the binary save fails, give Nik `JOB-00.zip` with the screenshots at the end.
6. **Verdict.** Write `project-documents/gameplay-factory/smoke/CAPABILITIES.md`: a table with rows repo read, text save to factory branch, text save to code branch, open PR, Python, node, npm registry reachable, Java, Chromium screenshots, binary save; each YES or NO with one line of detail. On its first line write the verdicts that apply, from: **TEXT SAVE OK** or **NO SAVE** (zip only), **PR OK** or **NO PR** (the lead opens PRs), **SCREENSHOTS OK** or **NO SCREENSHOTS**, **NPM OK** or **NO NPM** (code is tested by CI on push). Save, set State: DONE, finish with `Job 0 done: Factory smoke test (chat lane)`.

## 5. Tests first

None; this job makes no product change.

## 6. Done checklist (PASS/FAIL with evidence in the status file)

- [ ] Every capability row has YES/NO and evidence.
- [ ] Only the files in section 2 changed.
- [ ] Nothing pushed to `main`; nothing merged; nothing deployed; no Firebase setting touched.
- [ ] Status file shows State: DONE with the CAPABILITIES first line copied in.

## 7. When stuck

Write the blocker in `status/JOB-00.md` with State: BLOCKED, save, and reply `Job 0 is blocked: <reason>`. If you cannot save at all, give Nik `JOB-00.zip` as the handbook says.
