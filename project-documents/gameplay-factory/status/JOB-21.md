# JOB-21 status

Status: DONE
Lane: lead
PR: #344 into gameplay/recovery-v1 (branch gameplay/job-21-tap-races)

Source: Sonnet bug hunt 2026-10-04, item 1 (plus the item 4 error text and the commit copy extra).
When both managers tap the same button at the same moment, or the transfer timer hits 0:00 on both phones, the slower phone re-reads and retries once quietly instead of showing permission-denied. New contract tests/contracts/shared-tap-race-contracts.cjs. Contracts 114/114, ops 73/0 locally; PR #344 merged into gameplay/recovery-v1 (eb5edab), all 16 checks green on 7fb88dc. Also holds one-poll refresh failures (Reconnect, Multi Season, History) and keeps a confirmed Setup through one failed read.
