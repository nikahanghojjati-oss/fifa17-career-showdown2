#!/usr/bin/env python3
"""HO-041: merge the saved Gazette batches into the game's data files.

Reads copy/batches/*.json (prefers _ED editor-pass files, best score first),
drops duplicates, repeated openers, semicolons and comma-joined sentences,
caps each situation so the files stay small, then writes:
  fixtures/frontPages.js      SEASON + FINAL headlines (same API, contentVersion 2)
  fixtures/commentaryLines.js RESULTS commentary (CLUBS kept from r86)
  fixtures/gazetteCopy.js     stories, duets and small print (new)
Run from anywhere: python3 build_copy.py
"""
import json, os, re, sys, collections

HERE = os.path.dirname(os.path.abspath(__file__))
BATCHES = os.path.join(HERE, "batches")
FIX = os.path.normpath(os.path.join(HERE, "..", "..", "fixtures"))

CAP = {"A": 40, "B": 40, "C": 6, "F": 12, "D": 30}
FINAL_SITUATIONS = {"showdown-won-1-season", "showdown-won-3-seasons", "showdown-won-5-seasons",
                    "golden-showdown-won", "showdown-drawn", "won-on-the-final-day", "dominant-win"}
DROP_IDS = {"sb12-08", "b18-003"}  # sb12-08: decider story with winner/loser slots. b18-003: "draw" headline on a won Showdown
NAMES = re.compile(r"\b(Daniel|Nik)\b")
DASH = re.compile(r"[–—]")
DIGIT = re.compile(r"\d")
# "clause, it's ..." style comma joins: a comma followed by a fresh subject and a verb.
SPLICE = re.compile(
    r", (?:it|it's|there's|that's|this is|they're|they've|we're|we've|you'd|i'd|i'm|nobody|somebody|everybody|"
    r"the (?:\w+ ){0,2}(?:is|has|was|will|can|keeps|looks|seems)|"
    r"\{\w+\}(?:'s \w+)? (?:has|is|was|will|can|keeps|holds|made|took|needs|must|gets|wins|stands|remains|finishes|claims|answered|understood))\b",
    re.I)


def strip_slots(s):
    return re.sub(r"\{\w+\}", "", s)


def fix_semicolons(s):
    return re.sub(r";\s+(\w)", lambda m: ". " + m.group(1).upper(), s)


def clean(s):
    return fix_semicolons(s.strip())


def bad(text, splice=True):
    return bool(NAMES.search(text) or DASH.search(text) or DIGIT.search(strip_slots(text)) or (splice and SPLICE.search(text)))


def norm(s):
    return re.sub(r"[^a-z ]", "", strip_slots(s).lower()).split()


def load():
    files = collections.defaultdict(dict)
    for f in sorted(os.listdir(BATCHES)):
        m = re.match(r"([A-G])(\d{3})(_ED)?(?: \d+)?\.json$", f)
        if not m:
            continue
        key = (m[1], int(m[2]))
        ed = bool(m[3])
        prev = files[key].get("ed")
        if prev is None or (ed and not prev):
            files[key] = {"ed": ed, "path": os.path.join(BATCHES, f)}
    out = collections.defaultdict(list)
    for (kind, n), info in sorted(files.items()):
        d = json.load(open(info["path"]))
        out[kind].append((d, info["ed"]))
    return out


def ranked(items):
    return sorted(items, key=lambda r: (-r["_score"], r["_order"]))


def pick(rows, cap, textfn, splice=True, openers_max=1):
    """Best rows first, skip rule breaks, duplicates and repeated three-word openers."""
    seen, openers, keep = set(), collections.Counter(), []
    for r in ranked(rows):
        t = textfn(r)
        if r.get("id") in DROP_IDS or bad(t, splice):
            continue
        w = norm(t)
        sig = " ".join(w)
        op = " ".join(w[:3])
        if sig in seen or openers[op] >= openers_max:
            continue
        seen.add(sig)
        openers[op] += 1
        keep.append(r)
        if len(keep) >= cap:
            break
    return keep


def tag(rows, d, ed, start):
    for i, r in enumerate(rows):
        r["_score"] = r.get("score") if isinstance(r.get("score"), (int, float)) else (8 if ed else 7)
        r["_order"] = start + i
    return rows


def group(batches, listkey, sitkey="situation"):
    by = collections.defaultdict(list)
    order = 0
    for d, ed in batches:
        rows = d.get(listkey) or []
        sit = d.get(sitkey) or d.get("kind")
        for r in tag([dict(r) for r in rows], d, ed, order):
            by[r.get("situation", sit) if listkey == "items" and sitkey == "kind" else sit].append(r)
        order += len(rows)
    return by


def js_rows(rows):
    return ",\n".join("    " + json.dumps(r, ensure_ascii=False, separators=(",", ":")) for r in rows)


def umd(name, header, body, ret):
    return ("(function(root,factory){\n  const api=factory();\n"
            "  if(typeof module!==\"undefined\"&&module.exports)module.exports=api;\n"
            "  else root." + name + "=api;\n"
            "})(typeof globalThis!==\"undefined\"?globalThis:this,function(){\n  \"use strict\";\n\n"
            + header + "\n  const freeze=list=>Object.freeze(list.map(row=>Object.freeze(row)));\n"
            + body + "\n  return Object.freeze(" + ret + ");\n});\n")


def main():
    b = load()
    report = {}

    # A: headlines
    heads = group(b["A"], "rows")
    season, final = [], []
    for sit, rows in heads.items():
        keep = pick(rows, CAP["A"], lambda r: r["headline"] + " " + r["subhead"])
        report["A " + sit] = len(keep)
        for r in keep:
            row = {"situation": sit, "headline": clean(r["headline"]), "subhead": clean(r["subhead"]), "kicker": r.get("kicker", "")}
            (final if sit in FINAL_SITUATIONS else season).append(row)
    for prefix, lst in (("h1", season), ("h2", final)):
        for i, r in enumerate(lst, 1):
            r["id"] = "%s-%03d" % (prefix, i)
    season = [{"id": r["id"], **{k: v for k, v in r.items() if k != "id"}} for r in season]
    final = [{"id": r["id"], **{k: v for k, v in r.items() if k != "id"}} for r in final]
    open(os.path.join(FIX, "frontPages.js"), "w").write(umd(
        "CareerModeFrontPages",
        "  // HO-041 Touchline Gazette headlines (built by gazette/copy/build_copy.py from the checked batches; replaces r86).\n"
        "  // season: the season front page after Season Results. final: the Final Winner front page.\n"
        "  // {placeholders} are filled at show time; equal totals are always a draw.",
        "  const SEASON=freeze([\n" + js_rows(season) + "\n  ]);\n  const FINAL=freeze([\n" + js_rows(final) + "\n  ]);",
        "{contentVersion:2,season:SEASON,final:FINAL}"))

    # B: commentary, keep r86 CLUBS block verbatim
    lines = group(b["B"], "lines")
    results = []
    for sit, rows in lines.items():
        keep = pick(rows, CAP["B"], lambda r: r["text"])
        report["B " + sit] = len(keep)
        results += [{"situation": sit, "text": clean(r["text"])} for r in keep]
    results = [{"id": "c1-%04d" % i, **r} for i, r in enumerate(results, 1)]
    old = open(os.path.join(FIX, "commentaryLines.js")).read()
    m = re.search(r"\n  const CLUBS=freeze\(\[.*?\n  \]\);", old, re.S)
    if not m:
        sys.exit("CLUBS block not found in commentaryLines.js")
    open(os.path.join(FIX, "commentaryLines.js"), "w").write(umd(
        "CareerModeCommentaryLines",
        "  // HO-041 commentator lines (built by gazette/copy/build_copy.py; replaces the r86 results, which used old rules).\n"
        "  // results: lines after a season or Showdown result, by situation. clubs: r86 club-history lines, unchanged.\n"
        "  // Slots in {braces} are filled at show time; equal totals are always a draw, never a tiebreak.",
        "  const RESULTS=freeze([\n" + js_rows(results) + "\n  ]);" + m.group(0),
        "{contentVersion:2,results:RESULTS,clubs:CLUBS}"))

    # C stories, F duets, D small print
    stories = []
    for sit, rows in group(b["C"], "stories").items():
        keep = pick(rows, CAP["C"], lambda r: r["standfirst"] + " " + " ".join(r["paragraphs"]) + " " + r["pullquote"]["text"], splice=False, openers_max=2)
        report["C " + sit] = len(keep)
        for r in keep:
            stories.append({"situation": sit, "edition": "final" if sit in FINAL_SITUATIONS else "season",
                            "byline": clean(r["byline"]), "standfirst": clean(r["standfirst"]),
                            "paragraphs": [clean(p) for p in r["paragraphs"]],
                            "pullquote": {"text": clean(r["pullquote"]["text"]), "who": r["pullquote"]["who"]}})
    stories = [{"id": "s-%03d" % i, **r} for i, r in enumerate(stories, 1)]
    duets = []
    for sit, rows in group(b["F"], "duets").items():
        keep = pick(rows, CAP["F"], lambda r: r["lead"] + " " + r["co"])
        report["F " + sit] = len(keep)
        duets += [{"situation": sit, "lead": clean(r["lead"]), "co": clean(r["co"])} for r in keep]
    duets = [{"id": "d-%04d" % i, **r} for i, r in enumerate(duets, 1)]
    small = collections.defaultdict(list)
    for d, ed in b["D"]:
        kind = d["kind"]
        rows = tag([dict(r) for r in (d.get("items") or d.get("rows") or [])], d, ed, 0)
        for r in pick(rows, CAP["D"], lambda r: (r.get("head", "") + " " + r["text"]).strip()):
            row = {k: (clean(v) if isinstance(v, str) and k in ("text", "head") else v)
                   for k, v in r.items() if not k.startswith("_") and k not in ("score", "was", "id")}
            small[kind].append(row)
        report["D " + kind] = len(small[kind])
    body = ("  const STORIES=freeze([\n" + js_rows(stories) + "\n  ]);\n"
            "  const DUETS=freeze([\n" + js_rows(duets) + "\n  ]);\n"
            "  const SMALL=Object.freeze({" + ",".join(
                "%s:freeze([\n%s\n  ])" % (k, js_rows(v)) for k, v in sorted(small.items())) + "});")
    open(os.path.join(FIX, "gazetteCopy.js"), "w").write(umd(
        "CareerModeGazetteCopy",
        "  // HO-041 Touchline Gazette copy (built by gazette/copy/build_copy.py from the checked batches).\n"
        "  // stories: front-page lead stories by situation and edition. duets: two-voice commentary (lead + co), show on a two-line bar.\n"
        "  // small: briefs, captions (by photo), ears and quotes. Fill {placeholders} like frontPages.js.",
        body, "{contentVersion:1,stories:STORIES,duets:DUETS,small:SMALL}"))

    for k in sorted(report):
        print(k, report[k])
    print("season", len(season), "final", len(final), "results", len(results), "stories", len(stories), "duets", len(duets))


if __name__ == "__main__":
    main()
