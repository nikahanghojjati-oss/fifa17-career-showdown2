"use strict";
// Builds SUMMARY.md from findings.json. Usage: node summarize.cjs <out-dir>
const fs = require("node:fs");
const path = require("node:path");
const outDir = path.resolve(process.argv[2] || process.env.LAYOUT_AUDIT_OUT || "layout-audit-out");
const data = JSON.parse(fs.readFileSync(path.join(outDir, "findings.json"), "utf8"));
const ignored = data.findings.filter(f => f.severity === "ignored").length;
data.findings = data.findings.filter(f => f.severity !== "ignored"); // deliberate crops etc. stay in findings.json but are not counted
const sizes = data.sizes;
const screens = [...new Set(data.captured.map(c => c.screen))];
const rules = ["text-clipped", "art-clipped", "duplicate-text", "edge-gap", "overlap", "off-screen", "page-scroll", "stretched-image", "tap-target"];

const count = (screen, size) => data.findings.filter(f => f.screen === screen && f.size === size).length;
const lines = [];
lines.push("# Layout audit summary", "");
lines.push(`Base URL: ${data.baseUrl}  `, `Generated: ${data.generatedAt}  `, `Findings: ${data.findings.length} across ${data.captured.length} screen captures.`, "");
lines.push("## Findings per screen and size", "");
lines.push("| screen | " + sizes.join(" | ") + " | total |", "|---|" + sizes.map(() => "---:").join("|") + "|---:|");
for(const screen of screens){
    const row = sizes.map(size => data.captured.some(c => c.screen === screen && c.size === size) ? String(count(screen, size)) : "n/a");
    lines.push(`| ${screen} | ${row.join(" | ")} | ${data.findings.filter(f => f.screen === screen).length} |`);
}
lines.push("| **all** | " + sizes.map(size => data.findings.filter(f => f.size === size).length).join(" | ") + ` | ${data.findings.length} |`, "");
lines.push("## Module and route per capture (393x660; same module at every size)", "", "| capture | route (active screen) | module | DOM evidence |", "|---|---|---|---|");
for(const screen of screens){ const m = (data.captureMeta || {})[screen + "|" + (sizes.includes("393x660") ? "393x660" : sizes[0])] || {}; lines.push(`| ${screen} | ${m.route || ""} | ${m.module || ""} | ${(m.evidence || []).join(" ")} |`); }
lines.push("");
lines.push("## Findings per rule", "", "| rule | " + sizes.join(" | ") + " | total |", "|---|" + sizes.map(() => "---:").join("|") + "|---:|");
for(const rule of rules) lines.push(`| ${rule} | ${sizes.map(size => data.findings.filter(f => f.rule === rule && f.size === size).length).join(" | ")} | ${data.findings.filter(f => f.rule === rule).length} |`);
lines.push("");

// Group the same defect across sizes (same screen+rule+selector) and rank.
const groups = new Map();
for(const f of data.findings){
    const key = [f.screen, f.rule, f.selector].join("|");
    if(!groups.has(key)) groups.set(key, { ...f, sizes: [], worst: f });
    const g = groups.get(key); g.sizes.push(f.size);
    if(score(f) > score(g.worst)) g.worst = f;
}
function amount(f){ const m = f.detail.match(/(\d+(?:\.\d+)?)px (?:horizontal|vertical)|by (\d+(?:\.\d+)?)px2|(\d+(?:\.\d+)?)% off|past/); return m ? parseFloat(m[1] || m[2] || m[3]) : 0; }
function score(f){
    const base = { "off-screen": 900, "page-scroll": 800, "text-clipped": 600, overlap: 500, "stretched-image": 400, "art-clipped": 450, "duplicate-text": 550, "edge-gap": 650, "tap-target": 100 }[f.rule] || 0;
    const sev = f.severity === "minor" || f.severity === "low" ? 0.15 : 1;
    let extra = 0;
    if(f.rule === "overlap") extra = Math.min(300, amount(f) / 20);
    else if(f.rule === "page-scroll") extra = Math.min(300, Math.max(f.rect.h - 0, 0) / 20);
    else extra = Math.min(300, amount(f) * 3 + (f.rect.w || 0) / 10);
    return (base + extra) * sev;
}
function plain(f){
    const where = `${f.screen} at ${f.size}`;
    const name = f.text ? ` ("${f.text.replace(/\s+/g, " ").slice(0, 40)}")` : "";
    switch(f.rule){
        case "off-screen": return `On ${where}, ${f.selector}${name} runs off the edge of the screen: ${f.detail}. People cannot see or press all of it.`;
        case "text-clipped": return `On ${where}, text${name} in ${f.selector} is cut off: ${f.detail.replace(/^text cut by overflow-hidden/, "hidden by the container")}.`;
        case "art-clipped": return `On ${where}, character/figure art ${f.selector} is cut off: ${f.detail}.`;
        case "duplicate-text": return `On ${where}, the same text is drawn twice on top of itself (${f.detail}): ${f.selector.replace(/\s+/g, " ")}.`;
        case "edge-gap": return `On ${where}, ${f.detail}.`;
        case "overlap": return `On ${where}, two things sit on top of each other (${f.detail}): ${f.selector.replace(/\s+/g, " ")}.`;
        case "page-scroll": return `On ${where}, the whole page scrolls (${f.detail}), so it does not fit the window.`;
        case "stretched-image": return `On ${where}, an image is squashed or stretched: ${f.selector} ${f.detail}.`;
        case "tap-target": return `On ${where}, ${f.selector}${name} is smaller than a finger target (${f.detail}).`;
        default: return `${where}: ${f.detail}`;
    }
}
const ranked = [...groups.values()].sort((a, b) => score(b.worst) * (1 + b.sizes.length / 10) - score(a.worst) * (1 + a.sizes.length / 10));
lines.push("## Top 30 worst findings", "", "Same defect seen at several sizes is merged into one line (worst size shown). Full detail: findings.json.", "");
ranked.slice(0, 30).forEach((g, i) => {
    const f = g.worst;
    lines.push(`${i + 1}. **${f.rule}** ${plain(f)} Seen at: ${[...new Set(g.sizes)].join(", ")}. Rect (x,y,w,h): ${f.rect.x}, ${f.rect.y}, ${f.rect.w}, ${f.rect.h}. Screenshot: ${f.screenshot}`);
});
lines.push("", "## Fix jobs estimate (one screen each, real defects only: not minor, not ignored)", "");
const jobs = new Map();
for(const f of data.findings){ if(f.severity === "minor") continue; const j = jobs.get(f.screen.replace(/^settings-panel-.*/, "settings").replace(/^transfer-war-.*/, "transfer-war").replace(/^season-results-.*/, "season-results").replace(/^club-wheel.*/, "club-wheel").replace(/^league-wheel.*/, "league-wheel")) || {}; j[f.rule] = (j[f.rule] || 0) + 1; jobs.set(f.screen.replace(/^settings-panel-.*/, "settings").replace(/^transfer-war-.*/, "transfer-war").replace(/^season-results-.*/, "season-results").replace(/^club-wheel.*/, "club-wheel").replace(/^league-wheel.*/, "league-wheel"), j); }
for(const [screen, j] of [...jobs].sort()) lines.push(`- ${screen}: ${Object.entries(j).map(([r, n]) => r + " x" + n).join(", ")}`);
lines.push("", `Estimated separate fix jobs (screens with at least one non-minor finding): ${jobs.size}. Ignored findings kept in findings.json: ${ignored}.`);
lines.push("", "## Screens not reached", "");
for(const size of sizes){ const u = data.unreached[size] || []; lines.push(`- ${size}: ${u.length ? u.map(x => `${x.screen} (${x.why})`).join("; ") : "none, every planned screen was reached"}`); }
lines.push("", "## Not covered", "", "- Screens that need a real Google sign-in or a live second device (connected rivalry, pairing, live Transfer War timers, Season Results from a real opponent) are shown only through the in-page fake provider fixtures, so their content is representative, not real.", "- Settings sub-panels behind confirmation dialogs (restore, reset) are never confirmed; only what is visible without a destructive click is measured.", "");
fs.writeFileSync(path.join(outDir, "SUMMARY.md"), lines.join("\n"));
fs.writeFileSync(path.join(outDir, "top30.json"), JSON.stringify(ranked.slice(0, 30).map(g => ({ rule: g.rule, screen: g.screen, selector: g.selector, sizes: [...new Set(g.sizes)], worst: g.worst })), null, 1));
console.log("wrote", path.join(outDir, "SUMMARY.md"));
