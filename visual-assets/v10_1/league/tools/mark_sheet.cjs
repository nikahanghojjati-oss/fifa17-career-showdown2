// W1 QA evidence: the five crest-v1 league marks at 1X (64 px) in the wheel's monochrome treatment,
// unselected (pale gold on glass) and selected (near-black on the gold wedge), next to the untreated mark.
// Usage: NODE_PATH=$(npm root -g) node tools/mark_sheet.cjs   (server on :8765 from the repo root)
const { chromium } = require("playwright");
const path = require("path");
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 560, height: 420 }, deviceScaleFactor: 1 });
  await p.goto("http://127.0.0.1:8765/visual-assets/v10_1/league/index.html?frame=L1");
  await p.waitForFunction(() => window.__leagueReady === true);
  await p.evaluate(() => {
    const ids = ["premier_league", "laliga", "bundesliga", "serie_a", "ligue_1"];
    const css = getComputedStyle(document.querySelector(".wheelItem:not(.is-top)"), "::before").filter;
    const cssTop = getComputedStyle(document.querySelector(".wheelItem.is-top"), "::before").filter;
    document.body.innerHTML = `<div id="sheet" style="position:fixed;inset:0;background:#070604;padding:12px;font:600 12px system-ui;color:#ccc"></div>`;
    const sheet = document.getElementById("sheet");
    [["original (outside wheel)", "none", "#1a1c20"], ["unselected: " + css, css, "#14171B"], ["selected: " + cssTop, cssTop, "#E9BE52"]].forEach(([label, f, bg]) => {
      const row = document.createElement("div"); row.style.cssText = "display:flex;gap:16px;align-items:center;margin:8px 0";
      const l = document.createElement("div"); l.textContent = label.slice(0, 40); l.style.cssText = "width:120px;font-size:12px;line-height:1.2"; row.appendChild(l);
      ids.forEach((id) => { const d = document.createElement("div"); d.style.cssText = `width:64px;height:64px;padding:6px;background:${bg}`; const m = document.createElement("div"); m.style.cssText = `width:64px;height:64px;background:${window.getLeagueMark(id).image} center/contain no-repeat;filter:${f}`; d.appendChild(m); row.appendChild(d); });
      sheet.appendChild(row);
    });
  });
  await p.screenshot({ path: path.join(__dirname, "..", "evidence", "W1_league_marks_1x.png") });
  await b.close();
})();
