#!/usr/bin/env python3
"""r100 Duet P1: take Team V's delivered phone bands into paintings/ after checking each one against Team V's SHA256.json.

A DONE line on leads/relay names the branch, the commit and the path (project-documents/hc-art/ho-premium-full/<club>/<NAME>.webp).

  git fetch origin leads/relay:refs/remotes/origin/leads/relay          # read the DONE line
  git fetch origin <team-v-branch>:refs/remotes/origin/teamv            # the commit it names must be in this
  python3 tools/clubhouse-themes/intake.py <commit> ENV_HOME_PHONE_SILVER_P1 [more names...]
  python3 tools/clubhouse-themes/paint.py && python3 tools/clubhouse-themes/pin.py

Refuses a name that is not a phone band, a file whose sha256 is not the one in SHA256.json, or a band that is not 1179x2096.
"""
import hashlib, io, json, os, re, subprocess, sys
from PIL import Image

HERE = os.path.dirname(__file__)
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
BASE = "project-documents/hc-art/ho-premium-full"
BAND = re.compile(r"^ENV_[A-Z]+_PHONE_(SILVER|BLACK|MATTE)_P1$")

def show(commit, path):
    r = subprocess.run(["git", "-C", ROOT, "show", f"{commit}:{path}"], capture_output=True)
    if r.returncode: raise SystemExit(f"{path}: not at {commit} (not delivered yet, or that commit is not fetched)")
    return r.stdout

def take(commit, name):
    m = BAND.match(name)
    if not m: raise SystemExit(f"{name}: not a phone band name (ENV_<ROOM>_PHONE_<SILVER|BLACK|MATTE>_P1)")
    club = m.group(1).lower()
    data = show(commit, f"{BASE}/{club}/{name}.webp")
    want = json.loads(show(commit, f"{BASE}/{club}/SHA256.json")).get(name + ".webp")
    got = hashlib.sha256(data).hexdigest()
    if got != want: raise SystemExit(f"{name}: sha256 {got} is not Team V's {want}")
    size = Image.open(io.BytesIO(data)).size
    if size != (1179, 2096): raise SystemExit(f"{name}: {size[0]}x{size[1]}, expected 1179x2096 (aligned to the Wooden phone plate)")
    dest = os.path.join(HERE, "paintings", name + ".webp")
    with open(dest, "wb") as fh: fh.write(data)
    print("took", os.path.relpath(dest, ROOT), got[:12])

if __name__ == "__main__":
    if len(sys.argv) < 3: raise SystemExit(__doc__)
    for n in sys.argv[2:]: take(sys.argv[1], n[:-5] if n.endswith(".webp") else n)
