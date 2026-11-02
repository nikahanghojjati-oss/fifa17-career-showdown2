#!/usr/bin/env bash
# Run from the repository root. UI proof only: skip career-number tours and
# partner-wait sampling; these runs make no billed-read capacity claim.
set -u
export JAVA_TOOL_OPTIONS="${JAVA_TOOL_OPTIONS:-} -Xmx512m -XX:ActiveProcessorCount=2"
export CE2PG_PLAN=single CE2PG_SEASONS=1 CE2PG_BUDGET=1
export CE2PG_BUDGET_SAMPLE_MIN=0 CE2PG_BUDGET_SHORT_SAMPLE_MIN=0
export NODE_OPTIONS="--require $PWD/tools/r87-sizes-click-proof.cjs"
mkdir -p test-results/r87-sizes
sizes_failed=0
for sizes_case in '2 daniel=768x1024,nik=740x360' '3 daniel=1920x1080,nik=844x390' '1 daniel=820x1180,nik=844x390'; do
  read -r CE2PG_RUN PROOF_SIZES <<< "$sizes_case"
  export CE2PG_RUN PROOF_SIZES
  export CE2PG_PORT_BASE=$((10010 + CE2PG_RUN * 10))
  export CE2PG_APP_PORT=$((4650 + CE2PG_RUN))
  export PROOF_OUT="test-results/r87-sizes/verified-$CE2PG_RUN"
  node tests/browser/ce2pg-journey.cjs > "test-results/r87-sizes/verified-$CE2PG_RUN.log" 2>&1
  sizes_exit=$?
  printf 'run %s exit %s\n' "$CE2PG_RUN" "$sizes_exit"
  if [ "$sizes_exit" -ne 0 ]; then sizes_failed=1; fi
done
exit "$sizes_failed"
