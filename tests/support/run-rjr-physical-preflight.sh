#!/usr/bin/env bash
set -euo pipefail

host="${CMS_TEST_HOST:-127.0.0.1}"
port="${CMS_RJR_PREFLIGHT_PORT:-4187}"
base_url="http://${host}:${port}/"
server_log="${TMPDIR:-/tmp}/cms-rjr-physical-preflight-${port}-$$.log"

CMS_TEST_HOST="$host" CMS_TEST_PORT="$port" node tests/support/static-server.cjs > "$server_log" 2>&1 &
server_pid=$!
cleanup(){
  kill "$server_pid" 2>/dev/null || true
  wait "$server_pid" 2>/dev/null || true
  rm -f "$server_log"
}
trap cleanup EXIT

ready=false
for attempt in $(seq 1 40); do
  if ! kill -0 "$server_pid" 2>/dev/null; then
    printf 'RJR physical preflight server exited before becoming ready.\n' >&2
    sed -n '1,120p' "$server_log" >&2
    exit 1
  fi
  if CMS_RJR_PREFLIGHT_URL="$base_url" node -e 'fetch(process.env.CMS_RJR_PREFLIGHT_URL,{method:"HEAD"}).then(response=>process.exit(response.ok?0:1)).catch(()=>process.exit(1))'; then
    ready=true
    break
  fi
  sleep 0.25
done

if [[ "$ready" != "true" ]]; then
  printf 'RJR physical preflight server did not become ready at %s.\n' "$base_url" >&2
  sed -n '1,120p' "$server_log" >&2
  exit 1
fi

CMS_BASE_URL="$base_url" npm run test:stage5h
CMS_BASE_URL="$base_url" npm run test:stage5i
