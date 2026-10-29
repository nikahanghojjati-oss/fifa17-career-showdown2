#!/usr/bin/env python3
"""Factory inbox unpacker (run by .github/workflows/factory-inbox.yml).

Data only: it decodes and checks files. It never runs anything a worker sent.

A worker chat that can only write TEXT to GitHub drops a delivery folder:

  project-documents/factory/inbox/<DELIVERY>/<name>.b64.001  (base64 parts)
  project-documents/factory/inbox/<DELIVERY>/MANIFEST.json   (written LAST)

MANIFEST.json (made by tools/inbox_pack.py):
  {
    "job": "111",
    "message": "Job 111 step 3/5: phone crop",
    "files": [
      {"to": "visual-assets/.../x.webp", "bytes": 1234, "sha256": "...",
       "parts": ["x.webp.b64.001", "x.webp.b64.002"], "part_sha256": ["...", "..."]},
      {"unzip": true, "bytes": 999, "sha256": "...", "parts": ["JOB-111.zip.b64.001"], "part_sha256": ["..."]}
    ]
  }

Every file is checked part by part and as a whole. Zips are unpacked at the
repo root (their inside paths are repo-relative). Only visual-assets/ and
project-documents/ can be written. A receipt goes to inbox/receipts/<DELIVERY>.md.
A good delivery's folder is removed; a failed one is kept so the worker can
re-save the named part and then MANIFEST.json again to retry.
"""
import base64, hashlib, io, json, os, re, shutil, sys, zipfile
from datetime import datetime, timezone

INBOX = "project-documents/factory/inbox"
RECEIPTS = INBOX + "/receipts"
ALLOWED = ("visual-assets/", "project-documents/")
MAX_BYTES = 50 * 1024 * 1024


def sha(b):
    return hashlib.sha256(b).hexdigest()


def safe_target(p):
    p = (p or "").replace("\\", "/")
    while p.startswith("./"):
        p = p[2:]
    if not p or p.startswith("/") or ".." in p.split("/"):
        return None
    if not p.startswith(ALLOWED) or p.startswith(INBOX + "/"):
        return None
    return p


def deliveries():
    if not os.path.isdir(INBOX):
        return []
    return [n for n in sorted(os.listdir(INBOX))
            if n != "receipts" and os.path.isfile(os.path.join(INBOX, n, "MANIFEST.json"))]


def unpack(name):
    d = os.path.join(INBOX, name)
    errors, written = [], []
    try:
        m = json.load(open(os.path.join(d, "MANIFEST.json"), encoding="utf-8"))
    except Exception as e:
        return m_result(name, {}, [f"MANIFEST.json is not valid JSON: {e}"], [])
    staged = []  # (target, bytes): written only if the whole delivery passes
    for i, f in enumerate(m.get("files", []), 1):
        label = f.get("to") or f"zip {i}"
        parts, psha = f.get("parts") or [], f.get("part_sha256") or []
        if not parts:
            errors.append(f"{label}: no parts listed")
            continue
        chunks, bad = [], False
        for k, part in enumerate(parts):
            pp = os.path.join(d, os.path.basename(part))
            tag = f"{label}: part {k + 1} of {len(parts)} ({part})"
            if not os.path.isfile(pp):
                errors.append(f"{tag} is missing; save it")
                bad = True
                continue
            text = re.sub(r"\s+", "", open(pp, encoding="ascii", errors="replace").read())
            try:
                raw = base64.b64decode(text, validate=True)
            except Exception:
                errors.append(f"{tag} is not clean base64; save it again exactly as packed")
                bad = True
                continue
            if k < len(psha) and psha[k] and sha(raw) != psha[k]:
                errors.append(f"{tag} changed on the way (checksum differs); save it again exactly as packed")
                bad = True
            chunks.append(raw)
        if bad:
            continue
        blob = b"".join(chunks)
        if f.get("sha256") and sha(blob) != f["sha256"]:
            errors.append(f"{label}: whole-file checksum differs; save all its parts again")
            continue
        if len(blob) > MAX_BYTES:
            errors.append(f"{label}: larger than 50 MB")
            continue
        if f.get("unzip"):
            try:
                z = zipfile.ZipFile(io.BytesIO(blob))
            except Exception as e:
                errors.append(f"{label}: not a zip ({e})")
                continue
            for info in z.infolist():
                if info.is_dir():
                    continue
                t = safe_target(info.filename)
                if t:
                    staged.append((t, z.read(info)))
                else:
                    errors.append(f"zip entry {info.filename}: must sit under visual-assets/ or project-documents/")
        else:
            t = safe_target(f.get("to"))
            if t:
                staged.append((t, blob))
            else:
                errors.append(f"{label}: 'to' must be a repo path under visual-assets/ or project-documents/")
    if not m.get("files"):
        errors.append("MANIFEST.json lists no files")
    if not errors:
        for t, b in staged:
            os.makedirs(os.path.dirname(t) or ".", exist_ok=True)
            with open(t, "wb") as o:
                o.write(b)
            written.append((t, len(b)))
    return m_result(name, m, errors, written)


def m_result(name, m, errors, written):
    return {"name": name, "manifest": m, "errors": errors, "written": written, "ok": not errors}


def main():
    results = [unpack(n) for n in deliveries()]
    stamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    msgs = []
    if results:
        os.makedirs(RECEIPTS, exist_ok=True)
    for r in results:
        name, m = r["name"], r["manifest"]
        lines = [f"# Inbox receipt: {name}", "", f"Result: {'OK' if r['ok'] else 'FAILED'}",
                 f"Time: {stamp}", f"Job: {m.get('job', '?')}", ""]
        if r["written"]:
            lines += ["Files written:", ""] + [f"- `{t}` ({n} bytes)" for t, n in r["written"]] + [""]
        if r["errors"]:
            lines += ["Nothing was written. Fix these, then save MANIFEST.json again to retry:", ""]
            lines += [f"- {e}" for e in r["errors"]] + [""]
        lines.append("The delivery folder was removed." if r["ok"] else "The delivery folder was kept.")
        with open(os.path.join(RECEIPTS, name + ".md"), "w") as o:
            o.write("\n".join(lines) + "\n")
        if r["ok"]:
            shutil.rmtree(os.path.join(INBOX, name))
        msgs.append((m.get("message") or f"Inbox {name}") + ("" if r["ok"] else " (inbox FAILED, see receipt)"))
        print(("OK   " if r["ok"] else "FAIL ") + name, *r["errors"], sep="\n  ")
    gh = os.environ.get("GITHUB_OUTPUT")
    if gh:
        msg = "; ".join(msgs).replace("\n", " ")[:200] or "Inbox: nothing to unpack"
        with open(gh, "a") as o:
            o.write(f"any={'true' if results else 'false'}\nmessage={msg}\n")


if __name__ == "__main__":
    main()
