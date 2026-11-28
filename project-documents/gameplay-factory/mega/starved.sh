#!/usr/bin/env bash
# Exit 1 when a Validate POS20 / Validate Gameplay Fast / Showdown Gate run or job has waited over 90 s for a machine,
# so this tracker hands its machine back to the checks (same rule as the factory poller).
CHECKS='^(Validate POS20|Validate Gameplay Fast|Showdown Gate)$'; n=0
n=$(gh api "repos/$GITHUB_REPOSITORY/actions/runs?status=queued&per_page=50" --jq "[.workflow_runs[]|select(.name|test(\"$CHECKS\"))|select(.head_branch|test(\"^(factory/|leads/relay$)\")|not)|select(now-(.created_at|fromdateiso8601)>90)]|length" 2>/dev/null || echo 0)
[ "${n:-0}" -gt 0 ] && exit 1
exit 0
