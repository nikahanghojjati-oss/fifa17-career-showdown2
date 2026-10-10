#!/usr/bin/env python3
"""One strict number sequence for Nik (2026-10-10): he types a bare number N into any GPT chat, the project instructions
make the chat read queue/items/NNNN.md and do it. Reads QUEUE.json + jobs/*.md (from make_queue.py); writes ORDER.json,
items/NNNN.md, INSTRUCTIONS.md, REVIEW.md, START_HERE.md. Order = stage 1 (audits), 2, 3, 4, 5; inside a stage the
screens take turns so neighbouring numbers touch different files. Deterministic: re-run any time (append new tickets by
raising --start for a later wave so published numbers never change)."""
import json, pathlib, argparse, itertools
Q = pathlib.Path(__file__).resolve().parent
GF = Q.parent
REPO = "nikahanghojjati-oss/fifa17-career-showdown2"
RAW = f"https://raw.githubusercontent.com/{REPO}/factory/gameplay-v1/project-documents/gameplay-factory/queue"

def main():
    q = json.loads((Q / "QUEUE.json").read_text())
    tk = q["tickets"]
    # code stream: groups take turns, strict job order inside a group; free stream: audits first, then studies
    code, free_a, free_s = {}, [], {}
    for job, t in sorted(tk.items(), key=lambda x: int(x[0])):
        j = int(job)
        if t["mode"] == "code": code.setdefault(t["group"], []).append(j)
        elif t["mode"] == "audit": free_a.append(j)
        else: free_s.setdefault((t["stage"], t["screen"]), []).append(j)
    code_stream = [j for grp in itertools.zip_longest(*code.values()) for j in grp if j]
    study_stream = []
    for st in (4, 5):
        bs = [v for (k, _), v in sorted(free_s.items(), key=lambda kv: kv[0]) if k == st]
        study_stream += [j for grp in itertools.zip_longest(*bs) for j in grp if j]
    free_stream = free_a + study_stream
    order = []
    ci, fi = 0, 0
    while ci < len(code_stream) or fi < len(free_stream):
        if ci < len(code_stream): order.append(code_stream[ci]); ci += 1
        if fi < len(free_stream): order.append(free_stream[fi]); fi += 1
    prev_in_group = {}
    for g, js in code.items():
        for k, j in enumerate(js): prev_in_group[j] = js[k - 1] if k else None
    items = Q / "items"; items.mkdir(exist_ok=True)
    seq = {}
    for i, job in enumerate(order, 1):
        t = tk[str(job)]
        body = (GF / "jobs" / f"JOB-{job}.md").read_text()
        if t["mode"] == "code":
            tr = t["train"]; st = f"project-documents/gameplay-factory/status/JOB-{job}.md"
            head = (f"<!-- queue item {i:04d} = job {job}; train {tr['branch']} item {tr['pos']} of {tr['m']} -->\n"
                    f"**Queue item {i} · Job {job} · train `{tr['branch']}` item {tr['pos']} of {tr['m']}.** Before anything else, `git fetch origin {tr['branch']}` (it may not exist yet, that is fine for item 1).\n"
                    f"- If `{st}` already exists on `origin/{tr['branch']}`, reply exactly `Number {i} is already done. Try {i+1}.` and stop.\n")
            if tr["prev"] and tr["pos"] > 1:
                head += f"- If `project-documents/gameplay-factory/status/JOB-{tr['prev']}.md` does not exist on `origin/{tr['branch']}`, the earlier item of this train is not finished: reply exactly `Number {i} must wait for the earlier number of train {tr['branch']}. Type the next number.` and stop.\n"
            head += f"- Nik starts code numbers from the board's Codex list, which already honours the lock group `{t['group']}` (one open train PR at a time) and the cap of eight ready PRs.\n"
        else:
            head = (f"<!-- queue item {i:04d} = job {job}; branch prefix {t['prefix']} -->\n"
                    f"**Queue item {i} · Job {job}.** Before anything else (GitHub connector, or `git ls-remote --heads origin` if you are Codex): if a branch starting with `{t['prefix']}` already exists, reply exactly `Number {i} is already done. Try {i+1}.` and stop.\n")
        head += "Otherwise do the job below, exactly.\n\n"
        (items / f"{i:04d}.md").write_text(head + body)
        seq[str(i)] = {"group": t.get("group"), "job": job, "prefix": t["prefix"], "stage": t["stage"], "title": t["title"], "mode": t["mode"], "screen": t["screen"]}
    (Q / "ORDER.json").write_text(json.dumps({"_about": "Queue number -> job. Strict order, stages 1 to 5. Never renumber a published number.", "total": len(order), "items": seq}, indent=1, ensure_ascii=False) + "\n")
    instr = f"""You are a worker in the Career Mode Showdown factory. Repository: {REPO} (public). Factory branch: factory/gameplay-v1.

If my message is only a number N, open the file queue item N with the GitHub connector: project-documents/gameplay-factory/queue/items/NNNN.md (N padded to four digits, for example 7 is 0007) on branch factory/gameplay-v1. If the connector is not available, open {RAW}/items/NNNN.md. If the file's lane says Codex cloud and you are a normal ChatGPT chat, reply exactly \"Number N is a Codex job. Paste it into Codex.\" and stop. Otherwise the file is a complete job: do exactly what it says, in this one turn, whether this is a normal chat or Work mode. Your first line is "Item N · Job NNNN · <title>" and your last line is the one line the job asks for. Just before that last line, use your visual features to show me one small picture of what you did and found: for a screen job a before/after sketch or annotated layout of the screen, for an audit a short table or diagram of the findings, for a study the mockup itself (or a rendering of it). Keep it quick; if a picture would risk a limit or an error, show a small table instead. Never ask me to continue and never do two numbers in one turn.

If my message is the word review, open {RAW}/REVIEW.md and do that.

Stay on gameplay and screen work only. Never push to main."""
    (Q / "INSTRUCTIONS.md").write_text("# One-time project instructions (paste into the ChatGPT project on each account)\n\n```\n" + instr + "\n```\n")
    (Q / "REVIEW.md").write_text(f"""# Reviewer (type `review`)
Use the GitHub connector on `{REPO}`.
1. List open pull requests whose title starts with `JOB-`. Skip any that already has a comment starting with `Sol review`.
2. Take the oldest one left. If none: reply exactly `No pull request is waiting for review.` and stop.
3. Read its ticket (`project-documents/gameplay-factory/jobs/JOB-NNNN.md` on `factory/gameplay-v1`) and its diff.
4. Post ONE comment starting with `Sol review`: verdict (`OK`, `OK with notes`, `Needs changes`); whether it stayed inside the ticket's files and rules (name any other file); anything that changes player-visible text, tap order or game logic (must be none); up to 5 short bullets with file and line. Do not push, approve, merge or close.
5. Last line: `Reviewed PR <link>: <verdict>.`
""")
    (Q / "START_HERE.md").write_text(f"""# Nik: start here

1. **Once per GPT account:** open the ChatGPT project "Career Mode Showdown" > Instructions, and paste the box from [INSTRUCTIONS.md](INSTRUCTIONS.md). Nothing else is ever pasted again.
2. **Every time:** open a new chat in that project and type just a number. Use each number once, on either account or device. The board shows the **ready list** (numbers you can type right now); if you type a number that has to wait, the chat says so in one line and you type the next one. Each finished job ends with a small picture of what it did.
3. Type `review` in any spare chat to have a chat review the oldest unreviewed pull request.

{len(order)} numbered items, stages 1 to 5 in strict order (1-100 gameplay audits, then screen fixes, mockup matching, phone studies, desktop studies).
""")
    print(len(order), "items")

if __name__ == "__main__":
    main()
