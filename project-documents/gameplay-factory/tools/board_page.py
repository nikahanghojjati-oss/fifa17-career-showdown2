#!/usr/bin/env python3
"""Build the board web page (published as the "Gameplay Job Board" artifact) from BOARD_STATE.json.
Run board.py first, then:
    python3 project-documents/gameplay-factory/tools/board_page.py <output.html>"""
import json, os, sys

T = os.path.dirname(os.path.abspath(__file__))
state = json.load(open(os.path.join(T, "..", "BOARD_STATE.json")))
page = open(os.path.join(T, "board_page.html")).read()
data = json.dumps(state, ensure_ascii=False).replace("</", "<\\/")
out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(T, "..", "board.html")
open(out, "w").write(page.replace("/*BOARD_DATA*/null", data, 1))
print("wrote", out)
