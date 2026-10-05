# Shared board rules for Team V (Nik, 5 Oct 2026)

There is one board for both teams. Team G's workflow on `factory/gameplay-v1` builds it every few minutes:
https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/factory/gameplay-v1/project-documents/gameplay-factory/BOARD.md

Team V's own `BOARD.md` and its workflow (`factory-board.yml`) are retired. Do not update them.

1. **One PR per Team V job, titled `V-NNN <short title>`.** The `V-` prefix puts it in the V Factory section.
2. **One fenced `progress` block in that PR's description**, the same format Team G uses. Refresh it by editing the PR description only (no push, no CI):

   ````
   ```progress
   {"job":"V-239","title":"...","worker":"opus","owner":"Opus thread","steps":[{"name":"Build","done":true,"done_at":"2026-10-05T12:00:00Z"},{"name":"Lead check","done":false}],"current":"what is happening now","updated":"2026-10-05T12:00:00Z"}
   ```
   ````

   `worker` is one of `sol-chat`, `sol-work`, `codex`, `opus`, `sonnet`, `haiku`. Percent comes from done steps only; never type it by hand. Add `done_at` to each step when it finishes.
3. **Relay stays on `leads/relay`** (V2G / G2V). When Team V picks up a G2V ticket, answer it with its number and the state `received`, then `in progress`, then `done`.
4. **Never edit the board files on `factory/gameplay-v1`.** Never touch main.

Format reference: `project-documents/gameplay-factory/progress/README.md` on `factory/gameplay-v1`. Any change to these details arrives as a G2V note.
