#!/usr/bin/env python3
"""Write RELAY.md: every relay message between Team G and Team V in full, newest first, plus every hand-off ticket
with its pipeline (Sent > Delivered > Received > In progress > Done). Nik reads the whole conversation in one place.
Reads leads/relay with git and the PR #312 wake comments with the REST API (tools/two_factories.py); no Claude usage.
Run from the repo root after board.py: python3 project-documents/gameplay-factory/tools/relay_page.py"""
import json, os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import two_factories as TF

st = json.load(open(os.path.join(TF.F, "BOARD_STATE.json")))
R = TF.relay()
L = ["# 📡 Team G ↔ Team V relay: every message", "", f"[Back to the board](BOARD.md) · generated {st['generated']}", ""]
if not R:
    L += ["Could not read the relay branch this run. Nothing below is current."]
else:
    tk = {t["id"]: t for t in st.get("two", {}).get("tickets", [])}  # board.py already linked tickets to job progress
    L += [f"Relay branch `leads/relay` head `{R['head']}` ({TF.bos(R['head_time'])} Boston time) · {len(R['rows'])} messages · {len(R['tickets'])} hand-offs · "
          f"{R['pings']} wake comments on [PR #312]({TF.URL}/pull/312). How it works: [CONTRACT.md]({TF.URL}/blob/leads/relay/project-documents/leads-relay/CONTRACT.md).", ""]
    L += ["## Hand-offs (work passed between the factories)", ""]
    if R["tickets"]:
        for t in R["tickets"][::-1]:
            t.update({k: v for k, v in tk.get(t["id"], {}).items() if k in ("stage", "pct", "overdue")})
            L += [f"### {t['id']} · {t.get('from', '?')} → {t.get('to', '?')} · {t['title']}" + (" · ⚠ not acknowledged" if t["overdue"] else ""), "",
                  TF.pipeline(t), ""]
            for e in (t.get("log") or [])[::-1]:
                L.append(f"- {TF.bos(e.get('at'))} · Team {e.get('by', '?')} · {TF.STAGE_WORD.get(str(e.get('status')).upper(), e.get('status'))}" + (f" · {e['note']}" if e.get("note") else ""))
            if t.get("delivered_at"):
                L.append(f"- {TF.bos(t['delivered_at'])} · relay Action · Delivered in full as a wake comment on PR #312")
            L += ["", "<details><summary>Full ticket</summary>", "", t.get("body", ""), "", "</details>", ""]
    else:
        L += ["No hand-off yet.", ""]
    L += ["## Messages, newest first", ""]
    for m in R["rows"][::-1]:
        body = TF.text(R["ref"], m["path"]) if m["path"] else None
        if body:
            body = re.sub(r"^# SHOWDOWN LEADS RELAY\s*", "", body).strip()
        L += [f"### {m['id']} · {m['from']} → {m['to']} · {TF.bos(m['time'].replace(' ', 'T') + 'Z')} Boston time", "", f"**{m['subject']}** · reply needed: {m['reply']}", "",
              "<details><summary>Full message</summary>", "", body or "_Full text not found in archive/._", "", "</details>", ""]
open(os.path.join(TF.F, "RELAY.md"), "w").write("\n".join(L) + "\n")
print("relay page", len(R["rows"]) if R else 0, "messages")
