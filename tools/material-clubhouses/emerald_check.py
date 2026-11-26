#!/usr/bin/env python3
"""P3 Emerald Clubhouse numeric bar: python3 tools/material-clubhouses/emerald_check.py [ROOM ...] [--dir DIR] [--sib DIR].
Limits live in material_check.py LOOKS["EMERALD"]; the reasons are in project-documents/hc-art/material-clubhouses/emerald/COLOUR_STUDY.md."""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import material_check
sys.argv = [sys.argv[0], "emerald"] + sys.argv[1:]
material_check.main()
