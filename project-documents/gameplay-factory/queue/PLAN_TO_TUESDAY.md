# Mega factory plan: Friday night to Tuesday 13 Oct 2026 (Boston time)

**Numbers:** 518 now (112 audits, 126 studies, 280 code). More are added from audit findings and mockup results.

## The real limit
Typing is cheap; **merging code is not**. Every code PR runs the 13-minute Showdown Gate and the Team G lead merges it, one lock group at a time, at most 8 open. With **trains** (below) one PR carries 5 fixes, so merging 6 to 10 trains a day lands **20 to 50 code fixes a day**. By Tuesday we finish **all audits and studies** and about **100 to 150 of the 280 code items**; the rest continue after Tuesday.

## Who does what
Nik types just a number, nothing else, in a normal GPT-6 Sol chat on either account (Codex on the web cannot choose branches, so it does not run queue items). The chat's project instructions (INSTRUCTIONS.md, pasted once per account) do the rest.
| Lane | Takes |
| --- | --- |
| **Sol chat, both accounts** (nearly unlimited) | Every item: code items (committed onto the group train through the GitHub connector), audits, studies, and `review` |
| **Codex** | Reviews only: the Team G lead posts `@codex review` on train PRs it marks ready (no typing, no branch choosing), and the lead's own CI jobs |

## Day by day (3 bursts a day of about 40 minutes; nothing needed while you sleep or work)
| When | Sol chat numbers (all kinds) | Codex | Cumulative taken | Goal |
| --- | --- | --- | --- | --- |
| **Fri night** (10 to 20 min before bed) | 10 to 20 free numbers | 0 | ~15 | Audits start flowing |
| **Sat** morning, afternoon, evening | ~60 | reviews | ~100 | Audits 1 to 50 done; first phone and laptop fixes in review |
| **Sun** 3 bursts | ~60 | reviews | ~190 | All audits done; lead bundles real findings into fix jobs (wave 2); mockup matches start |
| **Mon** 3 bursts | ~60 | reviews | ~280 | Studies done for stages 4 and 5; 50+ code PRs merged |
| **Tue** morning | ~40 | reviews | ~340 | Final studies, last reviews; wave 2 (bug fixes from audits) queued after 518 |

Tuesday night picture: stage 1 audits 100%, stages 4 and 5 studies 100%, stages 2 and 3 about 30%. Because the lead's merge pace is the limit, the best use of spare time is audits and studies (they cost the lead nothing), and keeping 8 code PRs open so the lead never waits.

## Rules of thumb for you
- Type numbers from the board's **Type now** list. A blocked number costs one reply and you move on.
- Not done after Tuesday carries over; nothing is wasted.
- If Codex or Sol limits hit, stop; nothing breaks, numbers not yet branched are simply retaken.

## Checks and merging (Team G lead's part, folded in)
Full text: `/mnt/project-files/check-system/FAST_SAFE_CHECKS_PLAN.md`. No test is dropped; the Showdown Gate still runs all six lanes on every ready head.
1. **Drafts until ready:** every code, study and audit PR opens as a draft; the lead marks at most 8 code PRs ready, so the Gate runs once per head.
2. **Group trains:** code items of one lock group stack, in order, on `gameplay/train-<group>-<k>` (5 items per train). Each item commits its change and its `status/JOB-N.md` onto the train; the 5th opens ONE draft PR. One Gate run and one review cover 5 fixes. The group is locked while its train PR is open.
3. to 5. (lead's CI jobs, written as Codex items): split the slowest Gate lane, cache downloads, screenshots as a run artifact.
6. **Batch merges:** the lead merges ready trains two or three times a day; releases to players stay "merge rNN" from Nik.
