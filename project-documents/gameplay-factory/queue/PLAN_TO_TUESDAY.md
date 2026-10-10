# Mega factory plan: Friday night to Tuesday 13 Oct 2026 (Boston time)

**Numbers:** 518 now (112 audits, 126 studies, 280 code). More are added from audit findings and mockup results.

## The real limit
Typing is cheap; **merging code is not**. Every code PR runs the 13-minute Showdown Gate and the Team G lead merges it, one lock group at a time, at most 8 open. Realistic merge pace is **15 to 25 code PRs a day**. So by Tuesday we finish **all audits and studies** and about **70 to 90 of the 280 code items** (the first 6 to 8 of each of the 11 screen groups); the rest continue after Tuesday.

## Who does what
| Lane | Takes | How much |
| --- | --- | --- |
| **Sol chat, account 1 and 2** (nearly unlimited) | Audits (1 to 112), studies (126), and the `review` chat | The bulk: about 70 numbers a day across both accounts |
| **Codex, account 1 and 2** | Code items from the board's "Type now" list (it can run `npm run -s test:contracts` itself, so its PRs are more likely green) | About 10 to 15 a day per account, matching the merge pace. Work mode: none |

Codex line to type (task on the repo, one per code number N): `git fetch origin factory/gameplay-v1`, read `git show FETCH_HEAD:project-documents/gameplay-factory/queue/items/NNNN.md` (N padded to 4 digits), do exactly what it says, run `node scripts/pos10-syntax.mjs` and `npm run -s test:contracts`, open the PR it names.

## Day by day (3 bursts a day of about 40 minutes; nothing needed while you sleep or work)
| When | Sol chat numbers | Codex code numbers | Cumulative taken | Goal |
| --- | --- | --- | --- | --- |
| **Fri night** (10 to 20 min before bed) | 10 to 20 free numbers | 0 | ~15 | Audits start flowing |
| **Sat** morning, afternoon, evening | ~60 | ~25 | ~100 | Audits 1 to 50 done; first phone and laptop fixes in review |
| **Sun** 3 bursts | ~60 | ~30 | ~190 | All audits done; lead bundles real findings into fix jobs (wave 2); mockup matches start |
| **Mon** 3 bursts | ~60 | ~30 | ~280 | Studies done for stages 4 and 5; 50+ code PRs merged |
| **Tue** morning | ~40 | ~20 | ~340 | Final studies, last reviews; wave 2 (bug fixes from audits) queued after 518 |

Tuesday night picture: stage 1 audits 100%, stages 4 and 5 studies 100%, stages 2 and 3 about 30%. Because the lead's merge pace is the limit, the best use of spare time is audits and studies (they cost the lead nothing), and keeping 8 code PRs open so the lead never waits.

## Rules of thumb for you
- Type numbers from the board's **Type now** list. A blocked number costs one reply and you move on.
- Not done after Tuesday carries over; nothing is wasted.
- If Codex or Sol limits hit, stop; nothing breaks, numbers not yet branched are simply retaken.
