# Reviewer (type `review`)
Use the GitHub connector on `nikahanghojjati-oss/fifa17-career-showdown2`.
1. List open pull requests whose title starts with `JOB-`. Skip any that already has a comment starting with `Sol review`.
2. Take the oldest one left. If none: reply exactly `No pull request is waiting for review.` and stop.
3. Read its ticket (`project-documents/gameplay-factory/jobs/JOB-NNNN.md` on `factory/gameplay-v1`) and its diff.
4. Post ONE comment starting with `Sol review`: verdict (`OK`, `OK with notes`, `Needs changes`); whether it stayed inside the ticket's files and rules (name any other file); anything that changes player-visible text, tap order or game logic (must be none); up to 5 short bullets with file and line. Do not push, approve, merge or close.
5. Last line: `Reviewed PR <link>: <verdict>.`
