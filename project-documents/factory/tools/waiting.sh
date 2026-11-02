#!/bin/sh
# Lists jobs waiting for a Claude check: State DONE with no Claude check line,
# or a FIX check whose job was saved DONE again afterwards. Team G tracking (098) left out.
cd "$(dirname "$0")/../status" || exit 1
for f in JOB-*.md; do
  n=${f#JOB-}; n=${n%.md}; [ "$n" = 098 ] && continue
  grep -q '^State: DONE' "$f" || continue
  ck=$(grep -m1 'Claude check' "$f")
  if [ -z "$ck" ] || echo "$ck" | grep -q FIX; then echo "$n $(grep -m1 '^Updated' "$f" | cut -c10-)"; fi
done
