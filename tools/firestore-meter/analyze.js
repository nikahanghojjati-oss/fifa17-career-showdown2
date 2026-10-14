"use strict";
// node analyze.js meter-data.json [windowLabelFilter]
const fs = require("fs");
const d = JSON.parse(fs.readFileSync(process.argv[2] || "meter-data.json"));
const filter = process.argv[3] || "";
const norm = p => String(p).split("/").map((seg, i) => {
  if (/^season_\d+$/.test(seg)) return "season_N";
  if (i % 2 === 1 && !["current", "authoritative", "leagueProjection", "state"].includes(seg) && /[0-9a-f]{8,}|_/.test(seg) && seg.length > 12) return "{id}";
  return seg;
}).join("/");
const pick = c => { const p = (c || []).find(x => /^js\/production/.test(x)); return (p || (c || [])[(c || []).length - 1] || "?").replace(/^js\//, ""); };
const txOwner = {};
for (const e of d.events) {
  if (e.k === "txstart") txOwner[`${e.user}:${e.tx}`] = pick(e.chain);
  e.owner = (e.tx && txOwner[`${e.user}:${e.tx}`]) ? txOwner[`${e.user}:${e.tx}`] : pick(e.chain);
}
const ownerOf = e => e.owner;
const mod = ownerOf;
const fmt = x => (Math.round(x * 100) / 100).toString();
const users = ["daniel", "nik"];
const wins = d.windows.filter(w => w.label.includes(filter));
console.log("== per window, per device (rates over the window) ==");
console.log("window".padEnd(44), "dev".padEnd(7), "secs", "reads/s", "reads/min", "tx/s", "writes/min", "commitRPC/min", "verifyOnly%");
for (const w of wins) {
  const secs = (w.end - w.start) / 1000;
  for (const u of users) {
    const ev = d.events.filter(e => e.user === u && e.t >= w.start && e.t < w.end);
    const reads = ev.filter(e => e.k === "read").reduce((a, e) => a + e.n, 0);
    const tx = ev.filter(e => e.k === "txstart").length;
    const writes = ev.filter(e => e.k === "write").reduce((a, e) => a + e.n, 0);
    const commits = d.net.filter(n => n.user === u && n.t >= w.start && n.t < w.end && /:commit/.test(n.url));
    const verifyOnly = commits.filter(c => c.kinds && !c.kinds.update && !c.kinds.delete && !c.kinds.transform).length;
    console.log(w.label.padEnd(44), u.padEnd(7), String(Math.round(secs)).padStart(4), fmt(reads / secs).padStart(7), fmt(reads / secs * 60).padStart(9), fmt(tx / secs).padStart(5), fmt(writes / secs * 60).padStart(10), fmt(commits.length / secs * 60).padStart(13), commits.length ? Math.round(100 * verifyOnly / commits.length) + "%" : "-");
  }
}
console.log("\n== per window: reads/s and tx/s by caller module (both devices summed) ==");
for (const w of wins) {
  const secs = (w.end - w.start) / 1000;
  const g = {};
  for (const e of d.events) {
    if (e.t < w.start || e.t >= w.end) continue;
    const m = mod(e);
    g[m] = g[m] || { reads: 0, tx: 0, docs: {} };
    if (e.k === "read") { g[m].reads += e.n; const p = norm(e.path); g[m].docs[p] = (g[m].docs[p] || 0) + e.n; }
    if (e.k === "txstart") g[m].tx += 1;
  }
  console.log(`-- ${w.label} (${Math.round(secs)}s)`);
  for (const [m, v] of Object.entries(g).sort((a, b) => b[1].reads - a[1].reads)) {
    if (!v.reads && !v.tx) continue;
    console.log("  ", m.padEnd(40), "reads/s", fmt(v.reads / secs).padStart(6), "tx/s", fmt(v.tx / secs).padStart(6), " docs:", Object.entries(v.docs).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([p, n]) => `${p} x${n}`).join("; "));
  }
}
console.log("\n== every write by window / module / op / path (count) ==");
for (const w of wins) {
  const g = {};
  for (const e of d.events) {
    if (e.k !== "write" || e.t < w.start || e.t >= w.end) continue;
    const k = `${e.user} ${mod(e)} ${e.op} ${norm(e.path)}`;
    g[k] = (g[k] || 0) + 1;
  }
  console.log(`-- ${w.label}: ${Object.keys(g).length ? "" : "NO WRITES"}`);
  for (const [k, n] of Object.entries(g).sort((a, b) => b[1] - a[1])) console.log("  ", String(n).padStart(4), k);
}
console.log("\n== RPC cross-check, whole run ==");
const nn = {};
for (const n of d.net) { const k = n.url; nn[k] = nn[k] || { rpc: 0, docs: 0, kinds: {} }; nn[k].rpc++; nn[k].docs += n.docs || 0; for (const [kk, v] of Object.entries(n.kinds || {})) nn[k].kinds[kk] = (nn[k].kinds[kk] || 0) + v; }
console.log(JSON.stringify(nn));
console.log("SDK-level: tx.get reads", d.events.filter(e => e.k === "read" && e.op === "tx.get").length, "getDoc/getDocs reads", d.events.filter(e => e.k === "read" && e.op !== "tx.get").reduce((a, e) => a + e.n, 0), "listeners", d.events.filter(e => e.k === "listener").length, "tx started", d.events.filter(e => e.k === "txstart").length, "tx ok", d.events.filter(e => e.k === "txend" && e.ok).length, "tx failed", d.events.filter(e => e.k === "txend" && !e.ok).length, "tx.set/update/delete writes", d.events.filter(e => e.k === "write").length);
const ro = d.events.filter(e => e.k === "txend" && e.ok);
console.log("committed transactions with 0 writes:", ro.filter(e => e.writes === 0).length, "of", ro.length);

// ---- top modules + poll interval + reads/poll over the idle parks -------------------------------------------------
const idle = d.windows.filter(w => !/PostCommit/.test(w.label));
const stat = {};
for (const e of d.events) {
  const w = idle.find(w => e.t >= w.start && e.t < w.end); if (!w) continue;
  const o = ownerOf(e), key = `${o}`;
  const s2 = stat[key] = stat[key] || { reads: 0, tx: 0, ts: {}, leaf: {}, docs: {} };
  if (e.k === "read") { s2.reads += e.n; const l = (e.chain[0] || "?").replace(/^js\//, ""); s2.leaf[l] = (s2.leaf[l] || 0) + e.n; const p = norm(e.path).replace(/accounts\/[^/]+/, "accounts/{uid}"); s2.docs[p] = (s2.docs[p] || 0) + e.n; }
  if (e.k === "txstart") { s2.tx++; (s2.ts[e.user] = s2.ts[e.user] || []).push(e.t); }
}
const totalSecs = idle.reduce((a, w) => a + (w.end - w.start) / 1000, 0);
console.log(`\n== TOP modules by reads over idle parks (${Math.round(totalSecs)}s of parked time, 2 devices) ==`);
for (const [o, v] of Object.entries(stat).sort((a, b) => b[1].reads - a[1].reads).slice(0, 14)) {
  const gaps = []; for (const u of Object.values(v.ts)) { u.sort((a, b) => a - b); for (let i = 1; i < u.length; i++) gaps.push(u[i] - u[i - 1]); }
  gaps.sort((a, b) => a - b); const med = gaps.length ? gaps[Math.floor(gaps.length / 2)] / 1000 : null;
  console.log(o.padEnd(42), "reads/min(both devs)", fmt(v.reads / totalSecs * 60).padStart(6), "tx/min", fmt(v.tx / totalSecs * 60).padStart(6), "reads/tx", fmt(v.reads / Math.max(1, v.tx)).padStart(5), "median gap between tx on one device(s)", med === null ? "-" : fmt(med));
  console.log("     leaf modules:", Object.entries(v.leaf).map(([k, n]) => `${k} ${n}`).join(", "), "| docs:", Object.entries(v.docs).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k, n]) => `${k} x${n}`).join("; "));
}
