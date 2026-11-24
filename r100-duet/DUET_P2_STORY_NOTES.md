# Duet job P2: Story Vol 28, Rule Book and 3.0.0 release notes

Model: Opus 5.5 at high effort, or Sonnet at high effort (not sensitive: words only, no game logic). Facts must be checked against the code.

Nik picked this job on 2026-11-24 (card "Phone plates and Story only"). **Start it Sat 28 Nov after 8 PM Boston (the cut line)**, when the 3.0 feature set is fixed. Finish by Mon 30 Nov 10 AM Boston, two hours before the noon freeze.

## Who's who
- Repo: nikahanghojjati-oss/fifa17-career-showdown2. Base branch: `gameplay/r100`. One PR into `gameplay/r100`. The r100 lead merges. Never touch `main`, `leads/relay`, the version number, `package.json` or the service worker.
- Nik pastes your report into the lead thread.

## What to write
1. **Story Volume 28**: the Phoenix chapter, in the existing novel voice. Claude narrates in first person present tense, never says what anyone felt, and every fact is true. Follow the Vol 27 pattern: `chronicle/volume27-data.js` + `chronicle/volume27.js`, the spine in `chronicle/index.html`, edition labels in index.html/book.html/book.js, counts measured in a browser, and the newest-volume exemption moved to the new part id. Keep the Studio Small Axe dedication. Write for the Listen button: code ids (PR numbers, hashes) go only in each chapter's sources.
   Cover only what actually shipped in gameplay/r100 at your start SHA: the Ironman work (a swapped, killed or offline phone resumes exactly), POS1M (the 20,000 stories per PR, the million run, the real-Rules replay), the 1-second phoenix rise, Turning Points on Final Winner, remembered sign-in with SIGN OUT, the Platinum, Metallic Black and Premium Matte Black clubhouses repainted, faster checks, fewer reads. Players see only the phoenix: write about the background systems as the story of how the game was proven, never as screens players have.
   Numbers: only measured ones, and say where from (POS1M seal file, Ring 3 report, Gate runs). If a number isn't measured, leave it out.
2. **Rule Book** (`js/ruleBook.js`): add or adjust every player-facing change: Turning Points, remembered sign-in and SIGN OUT in Settings, the clubhouse names (Platinum Clubhouse), and anything else in the shipped diff since 2.12.0 that changes what a player does. Keep it short. Obvious FIFA-enforced rules stay off. Check the startup gzip budget: if the Rule Book is on the startup path and you add bytes, report the numbers.
3. **Release notes**: `RELEASE_V3.0.0_R100.md`, same shape as `RELEASE_V2.12.0_R99.md`. It must include: both phones update to 3.0.0 before the first Showdown; add the game to the iPhone Home Screen (iPhone Safari may forget the sign-in after about a week otherwise); a phone signed in on 2.12.0 signs in once more after 3.0; only the finished Arsenal v Burnley Showdown carries over from before. Leave the live date and main SHA as `TBD (lead fills on release)`.

## Proof
- Gate green on the exact head. The flash test covers the Story pages it already covers.
- Gallery of the 4 key Story pages (home, prologue, contents, the new chapter) at 1920x866 and 390x844, plus the Rule Book on desktop and phone.
- A fact table in the PR body: each claim, then the file:line or report it came from.

## Report (paste back to Nik)
```
P2 report: PR #NNNN head <sha8> | Vol 28: <n> chapters, <words> words | Rule Book: <sections changed> | notes: RELEASE_V3.0.0_R100.md | Gate: <green/red> | facts table: <n> claims, all sourced
```
Budget: about $30-50.
