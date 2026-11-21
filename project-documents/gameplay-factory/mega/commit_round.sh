#!/usr/bin/env bash
# Called by tools/mega_tracker.py after a round that wrote new data: render the summary, commit, push (retry on a race).
set -u
B=project-documents/gameplay-factory
python3 $B/tools/mega_custom_view.py >/dev/null || true
git add $B/mega/MEGA_TRACKER.json $B/mega/MEGA_TRACKER.md $B/mega/CUSTOM_VIEW_MEGA.html
git diff --cached --quiet && exit 0
git commit -qm "Mega tracker: live update [skip ci]"
for i in 1 2 3 4; do
  git pull -q --rebase -X theirs origin factory/gameplay-v1 >/dev/null 2>&1 || git rebase --abort >/dev/null 2>&1
  git push -q origin HEAD:factory/gameplay-v1 && exit 0
  sleep 2
done
echo "push raced; next round retries"
