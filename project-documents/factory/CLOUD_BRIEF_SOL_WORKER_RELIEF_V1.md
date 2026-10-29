# CLOUD BRIEF · Sol worker relief V1

| Field | Value |
| --- | --- |
| Model | Claude Fable 5.1 |
| Effort | High |
| STOP_BUDGET | $25 or 60 minutes, whichever comes first; then commit what is done and write the BUILD_RESULT |
| Branch | `factory/v1-wtt5ye` (plus one message on `leads/relay`); never `main`, never force-push |

## Already done by the Team V lead before this session (verify, do not redo)

- **Sol capacity and pace rules:** at the top of `project-documents/factory/WORKER_HANDBOOK.md` ("Pace rules"). Only tighten them if your audit shows a gap.
- **Upload rule:** handbook §7. Workers save text only. Anything scriptable (cut-outs, crops, exports, screenshots) becomes a recipe in `tools/MAKE_ASSETS.md`, which Claude runs. Brand-new pictures come only from image tickets, which Nik carries. `SELF_UPLOAD.md` is marked RETIRED. **Task (2):** delete every remaining mention of the inbox, base64 parts and zips from the handbook, `SELF_UPLOAD.md` and the job generator, so this is the only option. There is nothing to upload-test, because workers no longer send binaries.
- **V2G-005** with the same lessons is already posted on `leads/relay`.

## Your tasks

1. **Job audit** (the main work): follow `project-documents/factory/handoffs/CC-006_FABLE_SOL_JOB_AUDIT.md` exactly. It explains the job generator (`tools/jobgen/`), its hard rules, the Sol capacity rule and the BUILD_RESULT format. Write the result to `project-documents/factory/handoffs/CC-006_BUILD_RESULT.md`.
2. **Upload clean-up:** as described above.
3. **Shared rules for Team G:** on branch `leads/relay`, write `project-documents/leads/SOL_WORKER_RULES_V1.md`, a self-contained copy of the Pace rules and the text-only upload rule, written so Team G's handbook can adopt it. Follow `project-documents/leads-relay/CONTRACT.md` and post one message, `V2G-006_sol-worker-rules-file`, that points to the file and asks Team G to apply it to their own jobs. Their chats fail the same way: a worker polled GitHub Actions on a J6/J7 run and stalled in "thinking". Write archive/, LATEST.md and the FEED.md row in one commit. Do not overwrite an unanswered Team G message in LATEST.md. If one is waiting there, write the file only and say so in BUILD_RESULT.

## Done when

The audit, the clean-up and the Team G file plus message are pushed, `CC-006_BUILD_RESULT.md` lists every job changed, and your final reply gives the last commit ids on both branches.
