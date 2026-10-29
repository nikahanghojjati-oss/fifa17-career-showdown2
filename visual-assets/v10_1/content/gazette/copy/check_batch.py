"""Checks content-factory batch files (A, B, C, D, F, G and their _ED / MEGA forms).

Usage: python3 check_batch.py FILE [FILE ...]
Prints one line per problem and a summary per part. Exit code 1 if any HARD problem.
Only checks rules; it never writes or changes copy.
"""
import json, re, sys, collections

PH = re.compile(r"\{(\w+)\}")
WIN = {"winner", "loser", "winnerClub", "loserClub", "margin", "winnerPoints", "loserPoints"}
LEVEL = {"managerA", "managerB", "clubA", "clubB", "points"}
LEAD = {"leader", "trailer"}
SEASON_A = {"seasonNo", "seasonsTotal"}   # headlines, stories, small print
SEASON_B = {"season", "seasons"}          # commentary, duets
LEVEL_SITS = {"draw", "level-overall", "showdown-drawn", "rivalry-history"}
LEAD_SITS = {"lead-extended", "halfway", "final-season-decider", "golden-showdown", "dominant-run"}


def allowed(kind, sit):
    season = SEASON_B if kind in "BF" else SEASON_A
    if sit in LEVEL_SITS:
        return LEVEL | season
    if sit == "season-preview":
        return {"managerA", "managerB", "clubA", "clubB", "leader", "trailer"} | season
    if sit in LEAD_SITS:
        return LEAD | (WIN - {"winnerPoints", "loserPoints"}) | season
    return WIN | season


def vis_len(t):
    return len(PH.sub("x" * 10, t))


def texts(kind, item):
    if kind == "A":
        return [item.get("headline", ""), item.get("subhead", ""), item.get("kicker", "")]
    if kind == "C":
        return [item.get("standfirst", ""), *item.get("paragraphs", []), (item.get("pullquote") or {}).get("text", "")]
    if kind == "F":
        return [item.get("lead", ""), item.get("co", "")]
    return [item.get("text", ""), item.get("head", "")]


def items_of(part):
    for k in ("rows", "lines", "stories", "duets"):
        if k in part:
            return part[k]
    return []


def kind_of(part, name):
    if "duets" in part: return "F"
    if "clubs" in part: return "G"
    if "stories" in part: return "C"
    if "voice" in part: return "B"
    if "kind" in part: return "D"
    if "rows" in part: return "A"
    return name[:1].upper()


def check_part(part, name):
    hard = soft = 0
    kind = kind_of(part, name)
    sit = part.get("situation", "")
    items = items_of(part)
    ok = allowed(kind, sit) if kind in "ABCF" else None
    starts = collections.Counter()
    ids = set()
    for it in items:
        iid = it.get("id", "?")
        if iid in ids:
            print(f"  HARD {iid}: duplicate id"); hard += 1
        ids.add(iid)
        for t in texts(kind, it):
            if not t:
                continue
            bare = PH.sub("", t)
            if re.search(r"[–—]", t):
                print(f"  HARD {iid}: dash: {t}"); hard += 1
            digits = re.findall(r"\d+", bare)
            if digits and not (kind == "C" and set(digits) <= {"11", "110"}) and not (kind == "G"):
                print(f"  HARD {iid}: number written out: {t}"); hard += 1
            used = set(PH.findall(t))
            if kind == "G":
                bad = used - {"manager"}
            elif kind == "D":
                bad = used - (WIN | LEVEL | {"manager", "club"})
            else:
                bad = used - ok
            if bad:
                print(f"  HARD {iid}: placeholder not allowed {sorted(bad)}: {t}"); hard += 1
            if re.search(r"\b(Daniel|Nik)\b", t):
                print(f"  HARD {iid}: real name: {t}"); hard += 1
        main = texts(kind, it)[0]
        if kind == "A":
            h = it.get("headline", "")
            if h != h.upper() and not PH.search(h):
                print(f"  HARD {iid}: headline not capitals: {h}"); hard += 1
            if not 12 <= vis_len(h) <= 30:
                print(f"  SOFT {iid}: headline length {vis_len(h)}: {h}"); soft += 1
        if kind in "BG":
            n = vis_len(main)
            if not 45 <= n <= 125:
                print(f"  SOFT {iid}: length {n}: {main}"); soft += 1
        if kind == "B" and sit == "narrow-win" and "{margin} points" in main:
            print(f"  HARD {iid}: narrow win says '{{margin}} points'"); hard += 1
        if main:
            starts[" ".join(main.lower().split()[:3])] += 1
    for s, c in starts.items():
        if c > 1 and kind != "G":
            print(f"  SOFT same opening x{c}: '{s}'"); soft += 1
    if kind == "B":
        m = sum("{margin}" in it.get("text", "") for it in items)
        if m > 35:
            print(f"  SOFT {{margin}} used in {m} lines (limit 30)"); soft += 1
    print(f"{name} part batch={part.get('batch')} kind={kind} situation={sit or '-'} items={len(items)} hard={hard} soft={soft}")
    return hard


def main(paths):
    total = 0
    for p in paths:
        d = json.load(open(p, encoding="utf-8"))
        parts = d.get("parts") or d.get("batches") or [d]
        name = p.rsplit("/", 1)[-1]
        for part in parts:
            total += check_part(part, name)
    print("RESULT:", "PASS" if total == 0 else f"FAIL ({total} hard problems)")
    return 1 if total else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
