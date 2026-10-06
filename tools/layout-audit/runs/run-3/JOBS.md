# Cleanup factory jobs (from layout audit run 3)

Source: /mnt/project-files/layout-audit/run-3/ (tool: branch audit/layout-auditor, tools/layout-audit/).
Fix base: gameplay/bug-list-1. One Sonnet (medium) helper per job; the lead (Opus) reviews and merges. Layout changes get a Team V check before merge (TEAM_V_SCREENS.md).

| Job | Screens | Worker | State |
|---|---|---|---|
| 1031 | Transfer War signing on phones (footer row over the Nik card, LOCK MY SIGNINGS pinned under it); Career Statistics headline tile text clipped at 375x553 and 360x560 | Sonnet | building |
| 1032 | Rivalry Statistics ghost title and title over totals; Legacy grey right-edge strip on phones | Sonnet | building |
| 1033 | Standings title and toggles overlap at 1536x730; Trophy Room card over heading on desktop | Sonnet | building |
| Team V | Final Winner: ghost title text, broken or stretched character cut-outs on desktop (job 1006 · V is open there) | Team V | sent |
| HO-018 / 1029 | Season Results desktop (entry panel over REVIEW button): the port in progress should fix it, so re-measure after | Sonnet | porting |

Left alone (likely false or cosmetic): Home wordmark over figure, club title 5px, bottom-edge minor flags.
