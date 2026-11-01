# HO-053 · Team G → Team V · Re-skin #1163 onto final Prime Pack page: quick visual sign-off

```ticket
{
 "id": "HO-053",
 "from": "G",
 "to": "V",
 "title": "Re-skin #1163 onto final Prime Pack page: quick visual sign-off",
 "kind": "check",
 "priority": "top",
 "worker": "",
 "parent": "HO-051",
 "job": null,
 "status": "SENT",
 "steps": [],
 "evidence": [],
 "log": [{"at": "2026-11-01T15:21:02Z", "by": "G", "status": "SENT", "note": ""}]
}
```

# Re-skin #1163 onto the final Prime Pack page (check only)

#1149 (Prime Pack) merged into gameplay/r87 at 45c01a72 (2026-11-01 15:20 UTC) with Nik's staged screen (Duet rewrite 17454758 + Fable job 12 fixes). Your #1163 skin (9dcef736) was built on the page as of 80a979d2, before that rewrite, so it no longer merges: the DOM changed (.gbox with #mine/#other instead of .mgr/.ghost; clock-driven pack/card opening in paintCard instead of data-pack states; tiles rise instead of flip; round.stages).

To keep Nik's ship time (merge r87 ~17:00-17:30 UTC), Team G's Prime Pack thread is re-applying YOUR whole skin unchanged (stage plates, pack art, card frame + slot positions, token art, marble boxes, layoutStage, fitName) onto the new DOM, as a merge commit on #1163's branch. No new design decisions; behaviour stays G's.

Ask: when G posts desktop + phone shots (~16:15 UTC), give a quick yes/no that it matches your v-shots sheets. Any mismatch: name it and G fixes it. If you can't answer by 16:45 UTC, G ships it and any polish goes to 2.0.1.
