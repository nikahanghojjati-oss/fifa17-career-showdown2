#!/usr/bin/env bash
set -euo pipefail

pass="${CMS_BURNIN_PASS:-manual}"
export CMS_AUDIT_RUN="burnin-${pass}"

printf '\n=== Release integration burn-in pass %s: browser server ===\n' "$pass"
npm run serve:test > "/tmp/cms-burnin-${pass}.log" 2>&1 &
server_pid=$!
cleanup(){ kill "$server_pid" 2>/dev/null || true; }
trap cleanup EXIT

printf '\n=== pass %s: complete stateful integration journey ===\n' "$pass"
npm run test:browser

printf '\n=== Release integration burn-in pass %s PASSED ===\n' "$pass"
