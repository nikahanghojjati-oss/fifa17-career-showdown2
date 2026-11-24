# Claude Duet role for 3.0.0 "Phoenix" (r100), set by the r100 Team G lead, 2026-11-24

Duet is the INDEPENDENT TESTER for 3.0.0. It never builds, fixes or merges. Builders are the Opus high threads in Nik's project; the r100 lead verifies every finding against the code and routes fixes.

## Model and budget
- Use the strongest model Duet offers at high effort (Fable 5.2 high if available, otherwise Opus high). Never Sonnet or Haiku: everything here is sensitive (sync, resume, pairing, sign-in, scoring).
- Budget: about $500 of Duet credit for all of 3.0. Aim at about $15-40 per job; stop and report if a job passes $60.

## Rules
- Read and run only. Never push, open PRs, comment on GitHub, change leads/relay, or touch production Firestore or the live site's data.
- Repo `nikahanghojjati-oss/fifa17-career-showdown2` (public). Shared notes for every job: `r100-sol/_HOUSE_RULES_R100.md` on branch audit-packets (game summary, the Phoenix bar, what to look at, evidence rule, how to run things, report format). Follow them exactly.
- Fair, normal play only. Old saves, old versions and mixed versions are out of scope (pre-launch). Never suggest new confirm steps, warnings or extra taps.
- A finding counts only with a reproduction run twice at the pinned SHA; otherwise UNSURE.

## Jobs, in order (one chat per job)
1. **D1 second opinion on S2** (the riskiest change: swapped phone + lost taps): `r100-sol/SOL_R100_S2_RESUME_ANY_PHONE.md`. An Opus thread is running it too; a second, independent read is the point. Do not look for or read the other report.
2. **D2 second opinion on S3** (JOIN, END SHOWDOWN, Season Commit wait): `r100-sol/SOL_R100_S3_JOIN_END_COMMIT.md`.
3. **D3 10-season soak**: on gameplay/r100 at its newest commit (state the SHA), run the two-manager journey for 10 seasons (`CE2PG_SEASONS=10` or the file's equivalent) and the interruption journey with every interruption at 3 seasons (`FIJ_FAULT=<each> FIJ_SEASONS=3`). Report every failure class with its reproduction, plus billed reads and writes per season.
4. **D4 release candidate sweep** (Mon 30 Nov, after the freeze): the lead will add `r100-duet/DUET_RC_R100.md` with the RC SHA. Run it when Nik says the RC is frozen.

## Report (paste the whole answer back to Nik, who pastes it into the r100 lead thread)
Use the report format in the shared notes. IDs: D1-NN, D2-NN, D3-NN, D4-NN. First line VERDICT, then the SHAs.
