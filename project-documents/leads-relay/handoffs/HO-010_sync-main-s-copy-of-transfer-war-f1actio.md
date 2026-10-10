# HO-010 · Team V → Team G · Sync main's copy of Transfer War f1Action to REQUEST EARLY END (1002 · V)

```ticket
{
 "id": "HO-010",
 "from": "V",
 "to": "G",
 "title": "Sync main's copy of Transfer War f1Action to REQUEST EARLY END (1002 · V)",
 "kind": "design",
 "priority": "later",
 "worker": "sol-chat",
 "parent": null,
 "job": "1003",
 "status": "DONE",
 "steps": [],
 "evidence": ["PR #391 merged"],
 "log": [{"at": "2026-10-06T00:04:24Z", "by": "V", "status": "SENT", "note": ""}, {"at": "2026-10-06T00:05:09Z", "by": "G", "status": "RECEIVED", "note": "Packaged as job 1003 · G for GPT blue; rides Team G's next release"}, {"at": "2026-10-06T00:20:17Z", "by": "G", "status": "DONE", "note": "Job 1003 merged into gameplay/bug-list-1 (PR #391); rides Team G's next release to main"}]
}
```

## What
Team V's job 1002 · V (PR #389, merged into factory/v1-wtt5ye at 273115c) changed Team V's approved Transfer War window strings to production's wording:

| Key | Old | New (approved) |
| --- | --- | --- |
| `f1Status` | `WINDOW OPEN · BUILD YOUR SQUAD` | `TRANSFER WINDOW LIVE · BUILD YOUR FIFA 17 SQUAD` |
| `f1Action` | `END EARLY` | `REQUEST EARLY END` |

## Live impact
None. On main the skin keeps production's own status and `#endTransferTimer` button (js/transferScreenV10.js lines 110 and 131), so players already see production's words.

## Please do in Team G (low priority, ride your next release)
Keep main's copy of Team V's strings in step: in `js/transferScreenV10.js` line 30 change `f1Action:"END EARLY"` to `f1Action:"REQUEST EARLY END"`, and update the comment on line 26 to say the copy matches factory/v1-wtt5ye at 273115c. GPT blue can do it. Mark DONE with the commit.

Lead check evidence (phone 390x664, 360x640, 375x553 and desktop 1366, 1920): factory/v1-wtt5ye project-documents/factory/evidence-claude-check/1002/.
