"""Inline SVG for the Team V board (Nik, 2026-10-10 01:42 UTC: a visually great board with graphs, almost no Claude usage).

One dashboard of shapes and text: no scripts, images, animation or filters, so it works in the app's Custom view tab
and on GitHub as a committed .svg file. Styling sits in one <style> block to keep the page small.
Used by custom_view.py (inline in CUSTOM_VIEW_V.html, and CUSTOM_VIEW_V.svg for GitHub).
Pure function: numbers in, string out. Never hand-write numbers."""
import html

GOLD, BLUE, TEAL, GREEN, ORANGE, GREY, TEXT, MUTED, TRACK = "#f0d900", "#2c7399", "#42b9da", "#43b581", "#f97316", "#43515b", "#fbfcfc", "#8ea2ac", "#12191f"
STAGE_COLOR = {"SENT": MUTED, "DELIVERED": BLUE, "RECEIVED": TEAL, "WORKING": GOLD, "DONE": GREEN, "RETURNED": ORANGE}
FONT = "'Segoe UI',system-ui,Arial,sans-serif"
STYLE = (f".t{{font:12px {FONT};fill:{TEXT}}}.m{{font:11px {FONT};fill:{TEXT}}}.mu{{font:12px {FONT};fill:{MUTED}}}"
         f".h{{font:700 11px {FONT};fill:{TEAL};letter-spacing:1.5px}}.k{{font:800 12px {FONT};fill:{GOLD}}}"
         f".big{{font:800 18px {FONT};fill:{GOLD};letter-spacing:1px}}.n{{font:800 22px {FONT};fill:{GOLD}}}"
         f".c{{font:10px {FONT};fill:{MUTED};letter-spacing:1px}}.g{{font:800 9px {FONT};letter-spacing:1px}}"
         f".r{{fill:{TRACK};stroke:{GREY};stroke-width:.5}}")


def _n(x):
    return f"{float(x):.1f}".rstrip("0").rstrip(".")


def _t(x, y, s, cls="t", anchor=None):
    a = f' text-anchor="{anchor}"' if anchor else ""
    return f'<text x="{_n(x)}" y="{_n(y)}" class="{cls}"{a}>{html.escape(str(s))}</text>'


def _bar(x, y, w, fill, rx=5, h=10):
    return f'<rect x="{_n(x)}" y="{_n(y)}" width="{_n(max(w, 0))}" height="{h}" rx="{rx}" fill="{fill}"/>'


def dashboard(stages, cur, tickets, jobs, tiles, title="Team V board", width=640):
    """stages: [(name, pct, lines)] from custom_view.stages(); tickets: hand-off dicts with "stage";
    jobs: [(id, title, pct or None, live_detail)]; tiles: [(value, label)]. Returns the SVG as a string."""
    W = width
    H = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} @H@" width="100%" role="img" aria-label="{html.escape(title)}">',
         f"<style>{STYLE}</style>",
         f'<defs><linearGradient id="g"><stop offset="0" stop-color="{BLUE}"/><stop offset="1" stop-color="{GOLD}"/></linearGradient></defs>',
         f'<rect width="{W}" height="@H@" rx="14" fill="#20272d"/>',
         f'<rect width="{W}" height="6" rx="3" fill="url(#g)"/>',
         _t(18, 34, title.upper(), "big")]

    # KPI tiles
    tw = (W - 36 - 3 * 8) / 4
    for i, (v, lab) in enumerate(tiles[:4]):
        x = 18 + i * (tw + 8)
        H.append(f'<rect x="{_n(x)}" y="48" width="{_n(tw)}" height="58" rx="10" fill="#2c353c" stroke="{GREY}"/>')
        H.append(f'<rect x="{_n(x)}" y="48" width="{_n(tw)}" height="3" rx="1.5" fill="{GOLD}"/>')
        H.append(_t(x + tw / 2, 82, v, "n", "middle"))
        H.append(_t(x + tw / 2, 99, str(lab).upper(), "c", "middle"))

    # Goal bars
    H.append(_t(18, 128, "GOALS, IN ORDER", "h"))
    y, bx, bw = 138, 210, W - 18 - 210 - 44
    for i, (name, pct, _lines) in enumerate(stages):
        y += 24
        pct = max(0.0, min(100.0, float(pct or 0)))
        H.append(_t(18, y, f"{i + 1}. {name}"))
        if i == cur or pct >= 100:
            H.append(f'<text x="18" y="{_n(y + 12)}" class="g" fill="{GOLD if i == cur else GREEN}">{"NOW" if i == cur else "DONE"}</text>')
        H.append(f'<rect x="{bx}" y="{_n(y - 9)}" width="{bw}" height="10" rx="5" class="r"/>')
        if pct > 0:
            H.append(_bar(bx, y - 9, max(bw * pct / 100, 4), GOLD if i == cur else GREEN if pct >= 100 else TEAL))
        H.append(_t(W - 18, y, f"{_n(round(pct, 1))}%", "k", "end"))
    y += 22

    # Hand-off pipeline: one stacked bar, a count per stage
    order = ["SENT", "DELIVERED", "RECEIVED", "WORKING", "DONE"]
    counts = {k: 0 for k in order}
    for t in tickets:
        s = str(t.get("stage") or "").upper().replace("IN PROGRESS", "WORKING")
        if s in counts:
            counts[s] += 1
    total = sum(counts.values()) or 1
    H.append(_t(18, y, f"HAND-OFFS · {sum(counts.values())}", "h"))
    y += 12
    x, full = 18.0, W - 36
    for k in order:
        if counts[k]:
            w = full * counts[k] / total
            H.append(f'<rect x="{_n(x)}" y="{y}" width="{_n(w)}" height="14" fill="{STAGE_COLOR[k]}"/>')
            x += w
    H.append(f'<rect x="18" y="{y}" width="{full}" height="14" rx="7" fill="none" stroke="{GREY}" stroke-width=".5"/>')
    y += 28
    lx = 18
    for k in order:
        label = f"{k.title()} {counts[k]}"
        H.append(f'<rect x="{lx}" y="{y - 9}" width="10" height="10" rx="2" fill="{STAGE_COLOR[k]}"/>')
        H.append(_t(lx + 15, y, label, "m"))
        lx += 15 + 7 * len(label) + 14
    y += 18

    # Open Team V jobs: one bar each
    H.append(_t(18, y, "TEAM V JOBS MOVING", "h"))
    if not jobs:
        y += 20
        H.append(_t(18, y, "Nothing moving for Team V right now.", "mu"))
    for jid, jt, jp, live in jobs[:4]:
        y += 22
        H.append(_t(18, y, f"{jid} · {str(jt)[:44]}"))
        if live:  # live detail: CI lanes passed and when the PR last moved
            H.append(f'<text x="18" y="{_n(y + 13)}" style="font:10px {FONT};fill:{MUTED}">{html.escape(live)}</text>')
            y += 12
        jx, jw = 348, W - 18 - 348 - 46
        H.append(f'<rect x="{jx}" y="{_n(y - 9)}" width="{jw}" height="10" rx="5" class="r"/>')
        if jp is not None:
            p = max(0.0, min(99.9, float(jp)))  # an open job never reads 100 %
            H.append(_bar(jx, y - 9, max(jw * p / 100, 3), ORANGE))
            H.append(_t(W - 18, y, f"{p:.1f}%", "k", "end"))
        else:
            H.append(_t(W - 18, y, "no % yet", "mu", "end"))
    y += 16
    return "\n".join(H).replace("@H@", str(int(y))) + "\n</svg>\n"
