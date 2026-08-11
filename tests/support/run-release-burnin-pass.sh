#!/usr/bin/env bash
set -euo pipefail

pass="${CMS_BURNIN_PASS:-manual}"
export CMS_AUDIT_RUN="burnin-${pass}"

printf '\n=== v1.1.1 release burn-in pass %s: static/contracts ===\n' "$pass"
find js data -type f -name '*.js' -print0 | xargs -0 -n1 node --check
npm run test:contracts

printf '\n=== v1.1.1 release burn-in pass %s: browser server ===\n' "$pass"
npm run serve:test > "/tmp/cms-burnin-${pass}.log" 2>&1 &
server_pid=$!
cleanup(){ kill "$server_pid" 2>/dev/null || true; }
trap cleanup EXIT
sleep 1

printf '\n=== pass %s: runtime provenance ===\n' "$pass"
npm run test:runtime-boundary
printf '\n=== pass %s: Home/Reus visual ===\n' "$pass"
npm run test:home-visual
printf '\n=== pass %s: licensed football visual ===\n' "$pass"
npm run test:football-visual
printf '\n=== pass %s: Candidate A backup/export ===\n' "$pass"
npm run test:backup-browser
printf '\n=== pass %s: complete journey ===\n' "$pass"
npm run test:browser

printf '\n=== v1.1.1 release burn-in pass %s PASSED ===\n' "$pass"
