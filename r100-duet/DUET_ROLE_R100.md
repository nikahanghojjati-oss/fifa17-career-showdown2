> **Superseded 2026-11-24 17:56 UTC (Nik):** Duet no longer tests (Opus reviewing Opus adds little). Duet jobs for 3.0 are P1 `DUET_P1_PHONE_ROOMS.md` and P2 `DUET_P2_STORY_NOTES.md`. D1-D13 in DUET_JOBS_R100.md are shelved.

# Claude Duet role for 3.0.0 "Phoenix" (r100), set by the r100 Team G lead, 2026-11-24

Duet is the INDEPENDENT TESTER for 3.0.0. It never builds, fixes or merges. Builders are the Opus high threads in Nik's project; the r100 lead verifies every finding against the code and routes fixes.

## Model and budget
- Use the strongest model Duet offers at high effort (Fable 5.2 high if available, otherwise Opus high). Never Sonnet or Haiku: everything here is sensitive (sync, resume, pairing, sign-in, scoring).
- Budget: about $500 of Duet credit for all of 3.0. Aim at about $25-40 per job; stop and report if a job passes $60.

## Rules
- Read and run only. Never push, open PRs, comment on GitHub, change leads/relay, or touch production Firestore or the live site's data.
- Repo `nikahanghojjati-oss/fifa17-career-showdown2` (public). Shared notes for every job: `r100-sol/_HOUSE_RULES_R100.md` on branch audit-packets (game summary, the Phoenix bar, what to look at, evidence rule, how to run things, report format). Follow them exactly.
- Fair, normal play only. Old saves, old versions and mixed versions are out of scope (pre-launch). Never suggest new confirm steps, warnings or extra taps.
- A finding counts only with a reproduction run twice at the pinned SHA; otherwise UNSURE.

## Jobs
All jobs are in `r100-duet/DUET_JOBS_R100.md` (D1-D13, Tue 24 to Thu 26 Nov). One channel per job.

## Report (paste the whole answer back to Nik, who pastes it into the r100 lead thread)
Use the report format in the shared notes. IDs: the job's own prefix (D1-NN ... D13-NN). First line VERDICT, then the SHAs.
