# NEXT TASK: current entry point

Always re-resolve live main, open PRs and checks with the GitHub API before acting. Nothing below is a substitute for live state.

- Live release: `1.9.9-r85`.
- Current work branch: `gameplay/r86` (Marquee Player, reads at scale, Sol round 2 fixes). The SSJR physical run on r85 is the official launch.
- SSJR-2.1 ledger: `0/100`. Credit comes only from a real two-phone production run validated by `scripts/ssjr2-physical-run-credit.mjs`, never from CI, emulators, review, merge or deployment, and is never faked.

## Product rules that matter

- No tiebreak anywhere. Equal Showdown totals are a draw.
- Showdown lengths are 1, 3, 5 or 10 seasons.
- No screen dimming.
- Firebase Spark only, Billing OFF, App Check enforcement OFF, exactly two private managers.

Older snapshots (PR224 / R18) are frozen in `docs/history/`.
