"""Checks content-factory batch files (A, B, C, D, F, G and their _ED / MEGA forms).

Usage: python3 check_batch.py [--strict] FILE [FILE ...]
--strict adds the editor bar: word repeats (one content word more than 5 times per 50 items, 10 per 100),
F lead/co word counts, and repeated sentence skeletons. Use it for every _ED file.
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


STRICT = False
STOP = set("""a an the and or but so of to in on at by for with from into onto over under up down out off
is are was were be been being has have had do does did will would can could should may might must shall
this that these those it its it's they them their there here then than as if not no nor yet just only
very more most much many some any all each every both either neither one ones own same such too also
who whom whose which what when where why how i you we he she his her our your my me us him
about after again against before below between during through while until because once still even ever
now back away again isn't doesn't don't can't won't that's there's here's what's who's let's""".split())


def strict_checks(kind, sit, items):
    soft = 0
    words = collections.Counter()
    sit_words = set(re.findall(r"[a-z]+", sit.replace("-", " ")))
    for it in items:
        for t in texts(kind, it):
            for w in re.findall(r"[a-z']+", PH.sub(" ", t).lower()):
                w = w.strip("'")
                if len(w) > 2 and w not in STOP and w not in sit_words and w not in {"showdown", "season", "seasons", "league", "cup"}:
                    words[w] += 1
    limit = max(5, len(items) // 10)
    for w, c in words.most_common():
        if c <= limit:
            break
        print(f"  SOFT word '{w}' used {c} times (limit {limit})"); soft += 1
    if kind == "F":
        for it in items:
            nl, nc = len(it.get("lead", "").split()), len(it.get("co", "").split())
            if not 6 <= nl <= 18 or not 6 <= nc <= 20:
                print(f"  SOFT {it.get('id')}: lead {nl} words, co {nc} words (6-18, 6-20)"); soft += 1
    skel = collections.Counter()
    for it in items:
        m = texts(kind, it)[0]
        sk = re.sub(r"\{\w+\}", "X", m.lower())
        sk = " ".join(sk.split()[:2]) + " ... " + " ".join(sk.split()[-2:])
        skel[sk] += 1
    for k, c in skel.items():
        if c > 2:
            print(f"  SOFT same shape x{c}: '{k}'"); soft += 1
    return soft


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
    if STRICT:
        soft += strict_checks(kind, sit, items)
    print(f"{name} part batch={part.get('batch')} kind={kind} situation={sit or '-'} items={len(items)} hard={hard} soft={soft}")
    return hard


def main(paths):
    global STRICT
    if paths and paths[0] == "--strict":
        STRICT, paths = True, paths[1:]
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
