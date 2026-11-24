# done.sh club NAME tryfile HO note
set -e
cd /tmp/claude-0/in && python3 -I /home/user/work/project-documents/hc-art/ho-premium-full/tools/save2.py $1 $2 $3.png $3_aligned.webp
cd /home/user/work && git add -A && git commit -qm "$4 $2

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01GU43Q4Pzep7ADdjW9oEDst" && git push -q origin claude/project-thread-ie3afv
H=$(git rev-parse --short=9 HEAD)
cd /home/user/relay && git pull -q --no-rebase origin leads/relay
python3 project-documents/leads-relay/tools/handoff.py set $4 DONE --by V --evidence "claude/project-thread-ie3afv $H project-documents/hc-art/ho-premium-full/$1/$2.webp" --note "$5" >/dev/null
python3 project-documents/leads-relay/tools/feed_sync.py --team V >/dev/null
git add -A && git commit -qm "$4 DONE by V

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01GU43Q4Pzep7ADdjW9oEDst" && git push -q origin leads/relay
git log --oneline -1
