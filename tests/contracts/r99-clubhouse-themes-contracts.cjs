#!/usr/bin/env node
"use strict";
// R99-01 clubhouse themes (Nik 2026-11-23): "3 club house themes: current one, silver one and black metallic one" (23:21 UTC: a fourth,
// Premium Matte Black; Metal Black renamed Metallic Black), switched in Settings, keeping every element of every screen including the heroes. The pick lives on this device only (localStorage).
// A theme draws each room plate from plates-hc/<theme>/ (the same room recoloured, Daniel and Nik held out by a mask,
// tools/clubhouse-themes/build.py) and the panel marble from css/r78-marble-tile-metal.webp; index.html sets it before anything
// loads. The browser half (every screen draws and downloads only its themed room, desktop and phones) is
// CMS_CLUBHOUSE=silver|black|matte node tests/browser/r91-old-art-audit.cjs.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
const read = file => fs.readFileSync(path.join(ROOT, file), "utf8");
let passed = 0;
const check = (name, fn) => { fn(); passed++; console.log(`ok ${name}`); };

// WebP width and height from the file header (VP8, VP8L, VP8X).
function webpSize(file){
  const b = fs.readFileSync(file);
  assert.equal(b.toString("ascii", 0, 4), "RIFF", `${file} is a RIFF file`);
  const kind = b.toString("ascii", 12, 16);
  if(kind === "VP8X") return [1 + b.readUIntLE(24, 3), 1 + b.readUIntLE(27, 3)];
  if(kind === "VP8L"){ const bits = b.readUInt32LE(21); return [1 + (bits & 0x3fff), 1 + ((bits >> 14) & 0x3fff)]; }
  if(kind === "VP8 ") return [b.readUInt16LE(26) & 0x3fff, b.readUInt16LE(28) & 0x3fff];
  throw new Error(`${file}: unknown WebP chunk ${kind}`);
}

const PLATES = path.join(ROOT, "visual-assets/v10_1/plates-hc");
const plain = fs.readdirSync(PLATES).filter(f => /^(ENV|TILE)_.*\.webp$/.test(f) && !/_HC_V2/.test(f));

check("every room plate in use has a Silver, a Metallic Black and a Premium Matte Black copy of the same size", () => {
  assert.ok(plain.length >= 60, `the room plates are found (${plain.length})`);
  for(const theme of ["silver", "black", "matte"]){
    const dir = path.join(PLATES, theme);
    const copies = fs.readdirSync(dir).filter(f => f.endsWith(".webp"));
    assert.deepEqual(copies.sort(), plain.slice().sort(), `plates-hc/${theme}/ holds exactly the plain rooms`);
    for(const f of plain) assert.deepEqual(webpSize(path.join(dir, f)), webpSize(path.join(PLATES, f)), `${theme}/${f} keeps the plate's size (every layout and anchor still fits)`);
  }
  // Every room a screen names (css, js, Team V kits) is one of them, so a theme never asks for a missing picture.
  const named = new Set();
  const walk = dir => { for(const e of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })){ const rel = `${dir}/${e.name}`; if(e.isDirectory()) walk(rel); else if(/\.(css|js|html)$/.test(e.name)) for(const m of read(rel).matchAll(/plates-hc\/((?:ENV|TILE)_[A-Z0-9_]+\.webp)/g)) named.add(m[1]); } };
  ["css", "js", "visual-assets/v10_1"].forEach(walk);
  for(const f of named) assert.ok(plain.includes(f), `${f} (named by a screen) has themed copies`);
  assert.ok(fs.existsSync(path.join(ROOT, "css/r78-marble-tile-metal.webp")), "the metal panel marble is there");
  assert.deepEqual(webpSize(path.join(ROOT, "css/r78-marble-tile-metal.webp")), webpSize(path.join(ROOT, "css/r78-marble-tile.webp")), "the metal marble tiles like the old one");
});

const html = read("index.html");
const start = html.indexOf("R99-01 clubhouse themes");
const scriptOpen = html.lastIndexOf("<script>", start), scriptClose = html.indexOf("</script>", start);
const code = html.slice(scriptOpen + 8, scriptClose);
const BASE = JSON.parse((code.match(/BASE=(\{[^}]*\})/) || [])[1].replace(/(\w+):/g, '"$1":'));

check("index.html sets the theme before any sheet or picture is asked for, from this device only", () => {
  assert.ok(scriptOpen > 0 && start > scriptOpen, "the theme script is inline in index.html");
  assert.ok(scriptClose < html.indexOf("<link"), "it runs before the first preload and before css/app.css");
  assert.match(code, /localStorage\.getItem\(K\)/, "the pick is read from this device");
  assert.match(code, /K="cmsClubhouseTheme"/, "one key");
  const bare = code.replace(/\/\*[^]*?\*\//g, "");
  for(const banned of [/firestore/i, /fetch\(/, /XMLHttpRequest/, /sessionStorage/, /opacity|[^A-Za-z]filter:|backdrop/]) assert.doesNotMatch(bare, banned, `the theme script has no ${banned}`);
  assert.doesNotMatch(code, /visual-assets\/v10_1/, "the start-up shell still names nothing in visual-assets/v10_1");
  const refs = [...html.matchAll(/(?:src|href)="((?:js|css|data)\/[^"?#]+)/g)].map(m => m[1]);
  assert.deepEqual(refs, ["css/app.css", "js/storage.js", "js/showdown.js", "js/scoring.js", "js/screens.js", "js/menuExperience.js", "js/optionalModules.js", "js/app.js"], "no start-up file added (the start-up budget is unchanged)");
  const style = html.slice(html.indexOf("\n<style>") + 8, html.indexOf("</style>"));
  for(const line of style.split("\n").filter(l => l.includes("{"))) assert.match(line, /^(?:@media [^{]+\{)?html\[data-clubhouse="(?:silver|black|matte)"\]/, "the inline style only touches the Silver, Metallic Black and Premium Matte Black clubhouses (Wooden stays as it is)");
  // the loading room: drawn from assets/loading/<theme>/ at every size the Wooden one comes in, its files there, never in the shell
  for(const t of ["silver", "black", "matte"]) for(const f of ["ENV_LOADING_PLATE_HC_1X", "ENV_LOADING_PLATE_HC_2X", "ENV_LOADING_PHONE_HC_590W", "ENV_LOADING_PHONE_HC"]){
    assert.ok(style.includes(`url("assets/loading/${t}/${f}.webp")`), `${t} ${f} drawn`);
    assert.ok(fs.existsSync(path.join(ROOT, "assets/loading", t, f + ".webp")), `${t} ${f} exists`);
  }
  assert.deepEqual(Object.keys(BASE), ["silver", "black", "matte"], "a ground colour for every clubhouse");
  for(const v of Object.values(BASE)) assert.match(v, /^#[0-9a-f]{6}$/);
  assert.match(code, /function pre\(\)\{if\(!cur/, "the themed loading room is preloaded only in a theme");
  assert.match(code, /function hold\(n\)/, "a screen's own sheet waits unapplied until it is rewritten");
  assert.doesNotMatch(style, /opacity|backdrop|rgba\(0,\s*0,\s*0,\s*\.[4-9]\)\s*!important;?\s*background/, "no dimming");
});

// A small DOM, enough to run the inline script and read what it changes.
function runtime(saved){
  const store = new Map(saved ? [["cmsClubhouseTheme", saved]] : []);
  class Node {}
  Object.defineProperty(Node.prototype, "textContent", { configurable: true, enumerable: true, get(){ return this._text || ""; }, set(v){ this._text = v; } });
  class Element extends Node { constructor(tag){ super(); this.tagName = tag; this.attrs = {}; this.nodeType = 1; } getAttribute(k){ return k in this.attrs ? this.attrs[k] : null; } setAttribute(k, v){ this.attrs[k] = String(v); } removeAttribute(k){ delete this.attrs[k]; } querySelectorAll(){ return []; } insertAdjacentHTML(_w, v){ this._html = v; } }
  Object.defineProperty(Element.prototype, "innerHTML", { configurable: true, enumerable: true, get(){ return this._html || ""; }, set(v){ this._html = v; } });
  class HTMLStyleElement extends Element {}
  class HTMLImageElement extends Element {}
  Object.defineProperty(HTMLImageElement.prototype, "src", { configurable: true, enumerable: true, get(){ return this.getAttribute("src"); }, set(v){ this.setAttribute("src", v); } });
  Object.defineProperty(HTMLImageElement.prototype, "srcset", { configurable: true, enumerable: true, get(){ return this.getAttribute("srcset"); }, set(v){ this.setAttribute("srcset", v); } });
  class CSSStyleDeclaration { setProperty(k, v){ this[k] = v; } }
  class HTMLSourceElement extends Element {}
  Object.defineProperty(HTMLSourceElement.prototype, "srcset", { configurable: true, enumerable: true, get(){ return this.getAttribute("srcset"); }, set(v){ this.setAttribute("srcset", v); } });
  const docEl = new Element("HTML");
  const listeners = [];
  let observers = 0;
  const rule = { style: Object.assign(["background-image"], { cssText: "background-image: url(\"../visual-assets/v10_1/plates-hc/ENV_HOME_PLATE_HC_V3_1X.webp\");", _v: { "background-image": "url(\"../visual-assets/v10_1/plates-hc/ENV_HOME_PLATE_HC_V3_1X.webp\")" }, getPropertyValue(p){ return this._v[p] || ""; }, getPropertyPriority(){ return ""; }, setProperty(p, v){ this._v[p] = v; this.cssText = `${p}: ${v};`; } }) };
  // a room with a warm colour round it (Final Winner's #1d1a16), and a marble panel with one (not a room: its colour stays)
  const decl = (props, v) => ({ style: Object.assign(props, { _v: v, get cssText(){ return Object.entries(this._v).map(([k, x]) => `${k}: ${x};`).join(" "); }, getPropertyValue(p){ return this._v[p] || ""; }, getPropertyPriority(p){ return p === "background-color" ? "important" : ""; }, setProperty(p, x, prio){ this._v[p] = x; this._prio = prio; } }) });
  const framed = decl(["background-color", "background-image"], { "background-color": "rgb(29, 26, 22)", "background-image": "url(\"../visual-assets/v10_1/plates-hc/ENV_BOARD_PLATE_HC_V3_1X.webp\")" });
  const panel = decl(["background-color", "background-image"], { "background-color": "rgb(40, 33, 24)", "background-image": "url(\"r78-marble-tile.webp\")" });
  const pack = decl(["background-color", "background-image"], { "background-color": "rgb(13, 11, 9)", "background-image": "url(\"../visual-assets/v10_1/plates-hc/PACK_CLUB_HC_V1_1X.webp\")" });
  const document = { documentElement: docEl, styleSheets: [{ cssRules: [rule, framed, panel, pack] }], addEventListener(type, fn, capture){ listeners.push({ type, fn, capture }); } };
  const window = { document, Node, Element, HTMLStyleElement, HTMLImageElement, HTMLSourceElement, CSSStyleDeclaration,
    localStorage: { getItem: k => store.has(k) ? store.get(k) : null, setItem: (k, v) => store.set(k, String(v)), removeItem: k => store.delete(k) },
    MutationObserver: class { constructor(){ observers++; } observe(){} disconnect(){} } };
  const innerHTMLBefore = Object.getOwnPropertyDescriptor(Element.prototype, "innerHTML");
  window.window = window; vm.runInNewContext(code, window);
  return { window, document, docEl, store, rule, framed, panel, pack, listeners, observers: () => observers, Element, HTMLImageElement, CSSStyleDeclaration, innerHTMLBefore };
}

check("the current clubhouse runs nothing: no attribute, no observer, no DOM hook", () => {
  const r = runtime(null);
  assert.equal(r.window.cmsClubhouse.theme(), "current");
  assert.equal(r.docEl.getAttribute("data-clubhouse"), null);
  assert.equal(r.observers(), 0, "no observer");
  assert.equal(Object.getOwnPropertyDescriptor(r.Element.prototype, "innerHTML").set, r.innerHTMLBefore.set, "innerHTML untouched");
  const u = "url(visual-assets/v10_1/plates-hc/ENV_HOME_PLATE_HC_V3_1X.webp)";
  assert.equal(r.window.cmsClubhouse.fix(u), u);
  assert.equal(runtime("purple").window.cmsClubhouse.theme(), "current", "an unknown saved value is the current clubhouse");
});

check("Silver, Metallic Black and Premium Matte Black draw the themed rooms and the metal marble, and switching back restores the plain rooms", () => {
  const r = runtime("silver"), api = r.window.cmsClubhouse;
  assert.equal(api.theme(), "silver");
  assert.equal(r.docEl.getAttribute("data-clubhouse"), "silver");
  assert.equal(r.observers(), 1);
  assert.ok(r.listeners.some(l => l.type === "load" && l.capture === true), "sheets are rewritten in the capture phase of their load, before their own handlers");
  const plate = "image-set(url('visual-assets/v10_1/plates-hc/ENV_BOX_PLATE_HC_V4_1920.webp') 1.25x)";
  assert.equal(api.fix(plate), "image-set(url('visual-assets/v10_1/plates-hc/silver/ENV_BOX_PLATE_HC_V4_1920.webp') 1.25x)");
  assert.equal(api.fix('url("r78-marble-tile.webp")'), 'url("r78-marble-tile-metal.webp")');
  const pack = "url(visual-assets/v10_1/plates-hc/PACK_CLUB_HC_V1_1X.webp)";
  assert.equal(api.fix(pack), pack, "the club pack is not a room");
  // markup and pictures are themed as they are set (before the picture starts to load)
  const host = new r.Element("DIV"); host.innerHTML = '<img src="visual-assets/v10_1/plates-hc/ENV_ARCHIVE_PHONE_HC_V3.webp">';
  assert.match(host.innerHTML, /plates-hc\/silver\/ENV_ARCHIVE_PHONE_HC_V3/);
  const img = new r.HTMLImageElement("IMG"); img.srcset = "visual-assets/v10_1/plates-hc/ENV_TUNNEL_PHONE_HC_V3_590W.webp";
  assert.match(img.getAttribute("srcset"), /plates-hc\/silver\/ENV_TUNNEL_PHONE_HC_V3_590W/);
  const src = new r.Element("SOURCE"); src.setAttribute("srcset", "visual-assets/v10_1/plates-hc/ENV_TUNNEL_PLATE_HC_V3_1X.webp"); src.setAttribute("class", "plates-hc/ENV_X");
  assert.match(src.getAttribute("srcset"), /plates-hc\/silver\//); assert.equal(src.getAttribute("class"), "plates-hc/ENV_X", "only src and srcset are touched");
  // a room set through style.setProperty (the Touchline Gazette's --tgz-plate-desktop) is themed too
  const decl = new r.CSSStyleDeclaration(); decl.setProperty("--tgz-plate-phone", 'url("https://x/visual-assets/v10_1/plates-hc/ENV_BOARD_PHONE_HC_V3.webp")');
  assert.match(decl["--tgz-plate-phone"], /plates-hc\/silver\/ENV_BOARD_PHONE_HC_V3\.webp/);
  // switching: Metallic Black, then the current clubhouse; the pick is saved on this device
  assert.equal(api.set("black"), "black"); assert.equal(r.store.get("cmsClubhouseTheme"), "black");
  assert.match(r.rule.style.getPropertyValue("background-image"), /plates-hc\/black\/ENV_HOME_PLATE_HC_V3_1X/, "a loaded sheet follows the switch");
  // the colour round a room follows the clubhouse (no brown bars beside a silver or black room), with its own priority
  assert.equal(r.framed.style.getPropertyValue("background-color"), BASE.black); assert.equal(r.framed.style._prio, "important");
  assert.match(r.framed.style.getPropertyValue("background-image"), /plates-hc\/black\/ENV_BOARD/);
  assert.equal(r.panel.style.getPropertyValue("background-color"), "rgb(40, 33, 24)", "a marble panel keeps its colour");
  assert.equal(r.pack.style.getPropertyValue("background-color"), "rgb(13, 11, 9)", "a club pack is not a room: its colour stays");
  assert.equal(api.set("silver"), "silver"); assert.equal(r.framed.style.getPropertyValue("background-color"), BASE.silver);
  assert.equal(api.set("matte"), "matte"); assert.equal(r.store.get("cmsClubhouseTheme"), "matte");
  assert.equal(r.docEl.getAttribute("data-clubhouse"), "matte");
  assert.match(r.rule.style.getPropertyValue("background-image"), /plates-hc\/matte\/ENV_HOME_PLATE_HC_V3_1X/);
  assert.equal(r.framed.style.getPropertyValue("background-color"), BASE.matte);
  assert.equal(api.fix('url("r78-marble-tile.webp")'), 'url("r78-marble-tile-metal.webp")');
  assert.equal(api.set("black"), "black");
  assert.equal(api.fix(plate.replace("plates-hc/", "plates-hc/matte/")), plate.replace("plates-hc/", "plates-hc/black/"));
  assert.equal(api.set("current"), "current"); assert.equal(r.store.has("cmsClubhouseTheme"), false);
  assert.equal(r.docEl.getAttribute("data-clubhouse"), null);
  assert.match(r.rule.style.getPropertyValue("background-image"), /plates-hc\/ENV_HOME_PLATE_HC_V3_1X/, "back to the plain room");
  assert.equal(r.framed.style.getPropertyValue("background-color"), "rgb(29, 26, 22)", "and its own colour round it");
});

check("Settings offers the clubhouse on this device, beside nothing it moves", () => {
  const s = read("js/settings.js");
  const fn = (s.match(/function createClubhouseControl\(\)\{[^]*?\n\}/) || [])[0] || "";
  assert.ok(fn, "the Clubhouse row");
  const names = [...s.slice(s.indexOf("const SETTINGS_CLUBHOUSE_THEMES"), s.indexOf("];", s.indexOf("const SETTINGS_CLUBHOUSE_THEMES"))).matchAll(/\["(\w+)", "([^"]+)", "([^"]+)"\]/g)];
  assert.deepEqual(names.map(m => [m[1], m[2]]), [["current", "Wooden Clubhouse"], ["silver", "Silver Clubhouse"], ["black", "Metallic Black Clubhouse"], ["matte", "Premium Matte Black Clubhouse"]], "Nik's four names, the Wooden Clubhouse (as painted) first");
  for(const m of names) assert.ok(m[3].length > 20 && m[3].length < 80, `${m[2]} has one short line on what the room is made of`);
  assert.match(fn, /hint\.textContent = settingsClubhouseHintText\(select\.value\)/, "the line follows the pick");
  assert.match(fn, /window\.cmsClubhouse\.set\(select\.value\)/);
  assert.doesNotMatch(fn, /firestore|Firestore|fetch\(/, "no network");
  assert.match(s, /panel\.append\(createClubhouseControl\(\)\);\n    return panel;/, "at the end of the Showdown data card");
});

check("the service worker precaches the metal marble the panels ask for by a relative url", () => {
  const sw = read("service-worker.js");
  const list = name => (sw.match(new RegExp(`const ${name} = (?:Object\\.freeze\\(\\[|new Set\\(\\[)([^]*?)\\]\\)`)) || [])[1] || "";
  for(const name of ["SHELL_PATHS", "UNVERSIONED_SHELL_ASSET_PATHS", "SHELL_PATHS_ADDED_SINCE_PREVIOUS"]) assert.match(list(name), /"css\/r78-marble-tile-metal\.webp"/, `${name} names the metal marble`);
  assert.match(sw, /THEMED_LOADING_PATH = \/\^assets\\\/loading\\\/\(\?:silver\|black\|matte\)/, "the themed loading rooms are runtime-cached");
  assert.ok(!/"assets\/loading\/(?:silver|black|matte)\//.test(sw), "and never precached");
  assert.match(sw, /V10_IMAGE_PATH = \/\^visual-assets\\\/v10_1\\\/\.\+\\\./, "the themed rooms are runtime-cached like every plate");
});

console.log(`PASS R99-01 clubhouse themes: ${passed} checks.`);
