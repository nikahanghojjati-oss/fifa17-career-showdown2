# New lead start (CONTRACT.md §11)

Any new Team G or Team V lead thread does these three steps **first**, before anything else. Every lead handoff file links here.

1. Register: `python3 project-documents/leads-relay/tools/handoff.py register --team <G|V> --session <this thread's session id> --thread "<short name>"`, then commit and push leads/relay. The script lists the open tickets addressed to you.
2. Team V only: `subscribe_pr_activity` on PR #312 (owner nikahanghojjati-oss, repo fifa17-career-showdown2).
3. Start every listed ticket now: `handoff.py set HO-NNN WORKING --by <team>`, then wake the other lead as the script prints. Never leave a ticket RECEIVED for "a later thread".

Find your session id with claude-code-remote `get_session` (no session_id = this session).

## Paste for Nik (only if a lead stalls)

Nik pastes this one box into the lead thread that stalled:

```
Lead: before anything else, do project-documents/leads-relay/NEW_LEAD_START.md on branch leads/relay (fetch +refs/heads/leads/relay:refs/remotes/origin/leads/relay). Register this thread with handoff.py register, then start the open tickets it lists.
```
