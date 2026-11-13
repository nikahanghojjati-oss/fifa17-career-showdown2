"use strict";
// r91 (Sol 6.1 review of 2.3.0, Nik 2026-11-11: "auto check of device seems completely broken"): in 2.3.0 the Device check
// was a 404 online, because the Pages workflow never staged device-check.html or device-check-chamber.html, and in a
// session the service worker controlled it showed Home, because the worker answered the navigation with the shell's
// index.html. This contract keeps both halves fixed, for these pages and for any root page added later.
//   P1 every page at the repository root is staged by the Pages workflow (the staging step's own cp lines decide)
//   P2 everything the Device check pages load is in the staged site
//   P3 every page a game script navigates to is staged and is a page of its own under the worker
//   P4 the worker (run in a sandbox, with a complete shell in its cache): a navigation to either Device check page gets
//      that page from the network, with or without a query, never index.html; offline it gets a short page with the way
//      back, never Home; Home and the framed 3D pages are answered as before
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const {stagedNames, WORKFLOW} = require("../support/stage-pages-artifact.cjs");

const ROOT = path.resolve(__dirname, "../..");
const read = p => fs.readFileSync(path.join(ROOT, p), "utf8");
const exists = p => fs.existsSync(path.join(ROOT, p));
let checks = 0;
const ok = (id, text) => { checks += 1; console.log(`ok ${checks} ${id} ${text}`); };

const staged = new Set(stagedNames());
const isStaged = p => staged.has(p.split("/")[0]) && exists(p);
const DEVICE_CHECK = ["device-check.html", "device-check-chamber.html"];
// Root pages that are deliberately not part of the published game. Empty: a new root page is staged or listed here.
const NOT_PUBLISHED = new Set([]);
const worker = read("service-worker.js");
const setOf = name => { const m = new RegExp(`const ${name} = new Set\\(\\[([\\s\\S]*?)\\]\\);`).exec(worker); assert.ok(m, `service-worker.js declares ${name}`); return new Set([...m[1].matchAll(/"([^"]+)"/g)].map(x => x[1])); };
// r91 cut step 5 removed NETWORK_ONLY_NAVIGATION_PATHS with the old update page, its only entry.
const OWN_PAGES = new Set([...setOf("STANDALONE_PAGE_NAVIGATION_PATHS"), ...setOf("SHELL_FRAME_NAVIGATION_PATHS")]);

// P1
{
  const pages = fs.readdirSync(ROOT).filter(name => name.endsWith(".html"));
  assert.ok(pages.includes("index.html") && DEVICE_CHECK.every(p => pages.includes(p)), "the game and both Device check pages are root pages");
  for(const page of pages){
    if(NOT_PUBLISHED.has(page)) continue;
    assert.ok(staged.has(page), `${page} is a page at the repository root but ${WORKFLOW} never copies it into the published site (2.3.0: device-check.html was a 404)`);
  }
  for(const name of staged) assert.ok(exists(name), `the staging step copies ${name}, which does not exist`);
  ok("P1", `every root page is staged by the Pages workflow (${pages.join(", ")})`);
}

// P2
{
  const local = ref => !/^(?:[a-z]+:|\/\/|#|data:)/i.test(ref);
  let seen = 0;
  for(const page of DEVICE_CHECK){
    const html = read(page).replace(/<!--[\s\S]*?-->/g, "");
    const refs = [
      ...[...html.matchAll(/<script[^>]*\bsrc="([^"]+)"/g)].map(m => m[1]),
      ...[...html.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)].map(m => m[1]),
      ...[...html.matchAll(/path:"([^"]+\.html)"/g)].map(m => m[1])
    ].filter(local).map(ref => ref.split(/[?#]/)[0]);
    assert.ok(refs.length, `${page} loads something`);
    for(const ref of refs){ seen += 1; assert.ok(isStaged(ref), `${page} loads ${ref}, which the published site does not carry`); }
  }
  const check = read("device-check.html");
  assert.ok(/<h1>DEVICE CHECK<\/h1>/.test(check) && check.includes('<a class="btn" href="./">Back to the game</a>'), "the page carries its heading and the way back");
  // HO-078: the heading wears Team V's V3 title lettering at the family height; the words stay in the heading.
  assert.ok(check.includes('h1{position:relative;margin:0 0 8px;--hc-h:clamp(40px,3.08vw,59px);height:var(--hc-h);') && /h1::after\{[^}]*TITLE_DEVICE_CHECK_V3_960\.webp"\) center\/contain no-repeat;[^}]*image-set\([^}]*TITLE_DEVICE_CHECK_V3_1920\.webp"\) 2x\)\}/.test(check), "the heading is the V3 DEVICE CHECK lettering");
  for (const n of [480, 960, 1920, 3840]) assert.ok(fs.existsSync(path.join(ROOT, `visual-assets/v10_1/shared/wordmarks/TITLE_DEVICE_CHECK_V3_${n}.webp`)), `TITLE_DEVICE_CHECK_V3_${n}`);
  for(const framed of [...read("device-check.html").matchAll(/path:"([^"]+\.html)"/g)].map(m => m[1])) assert.ok(OWN_PAGES.has(framed), `the worker answers the framed page ${framed} with that page`);
  ok("P2", `everything the Device check pages load is in the published site (${seen} files), and each framed scene is a page of its own`);
}

// P3
{
  const targets = new Map();
  const scripts = fs.readdirSync(path.join(ROOT, "js")).filter(name => name.endsWith(".js")).map(name => `js/${name}`);
  for(const file of scripts.concat(["index.html"])){
    const s = read(file);
    for(const m of s.matchAll(/location\.(?:assign|replace)\(\s*["'`]([^"'`?#]+\.html)[^"'`]*["'`]\s*\)|location(?:\.href)?\s*=\s*["'`]([^"'`?#]+\.html)[^"'`]*["'`]|window\.open\(\s*["'`]([^"'`?#]+\.html)/g)){
      const page = (m[1] || m[2] || m[3]).replace(/^\.\//, "");
      if(/^(?:[a-z]+:|\/\/)/i.test(page)) continue;
      targets.set(page, file);
    }
  }
  assert.equal(targets.get("device-check.html"), "js/settings.js", "Settings > 3D QUALITY > Device check… opens device-check.html");
  for(const [page, file] of targets){
    assert.ok(isStaged(page), `${file} navigates to ${page}, which the published site does not carry`);
    assert.ok(page === "index.html" || OWN_PAGES.has(page), `${file} navigates to ${page}, which the service worker would answer with index.html (list it as a page of its own)`);
  }
  ok("P3", `every page a game script navigates to is staged and a page of its own under the worker (${[...targets.keys()].join(", ")})`);
}

// P4: the real worker in a sandbox. Its cache holds a complete shell (the worst case: there is an index.html to hand out).
(async () => {
  const SCOPE = "https://example.test/fifa17-career-showdown2/";
  const listeners = {};
  let online = true; const fetched = [];
  class FakeResponse{ constructor(body, init){ this.body = String(body); this.status = (init && init.status) || 200; this.ok = this.status >= 200 && this.status < 300; this.type = "basic"; this.headers = new Map(Object.entries((init && init.headers) || {})); } clone(){ return this; } async text(){ return this.body; } }
  class FakeRequest{ constructor(input, init){ const from = typeof input === "string" ? {url: input, method: "GET"} : input; this.url = from.url; this.method = from.method || "GET"; this.mode = from.mode; this.cache = (init && init.cache) || from.cache || "default"; } }
  const shell = {async match(url){ return new FakeResponse(`SHELL ${new URL(url).pathname.slice(new URL(SCOPE).pathname.length)}`); }, async put(){}, async keys(){ return []; }};
  const revision = /const RUNTIME_REVISION = "([^"]+)"/.exec(worker)[1];
  const cacheNames = [`career-mode-showdown-shell-${revision}`];
  const sandbox = {
    self: {registration: {scope: SCOPE}, addEventListener: (type, f) => { listeners[type] = f; }, clients: {claim: async () => {}}, skipWaiting: async () => {}},
    caches: {keys: async () => cacheNames.slice(), open: async () => shell, delete: async () => true, match: async () => null},
    fetch: async request => { const url = typeof request === "string" ? request : request.url; fetched.push({url, cache: request.cache});
      if(!online) throw new TypeError("Failed to fetch");
      return new FakeResponse(`NETWORK ${new URL(url).pathname.slice(new URL(SCOPE).pathname.length)}`); },
    Request: FakeRequest, Response: FakeResponse, URL, URLSearchParams, Headers: Map, AbortController, setTimeout, clearTimeout, console, Promise, Date, Math, JSON, Object, Set, Map, Array, String, Number, Boolean, Error, TypeError, RegExp
  };
  vm.createContext(sandbox); vm.runInContext(worker, sandbox, {filename: "service-worker.js"});
  assert.equal(typeof listeners.fetch, "function", "the worker listens for fetches");
  const navigate = async relative => {
    let answer = null; const waits = [];
    listeners.fetch({request: new FakeRequest({url: SCOPE + relative, method: "GET", mode: "navigate"}), respondWith: p => { answer = Promise.resolve(p); }, waitUntil: p => waits.push(p)});
    assert.ok(answer, `the worker answers the navigation to ${relative || "the scope"}`);
    const response = await answer; return {status: response.status, body: await response.text()};
  };
  // Home is the shell's own index.html, as before.
  assert.equal((await navigate("")).body, "SHELL index.html", "Home comes from the shell");
  assert.equal((await navigate("some-old-link")).body, "SHELL index.html", "an unknown path is still the game");
  for(const page of DEVICE_CHECK){
    for(const query of ["", "?gfx=3&bench=1"]){
      fetched.length = 0;
      const got = await navigate(page + query);
      assert.equal(got.body, `NETWORK ${page}`, `${page}${query} is answered with that page from the network, never the shell's index.html`);
      assert.equal(got.status, 200);
      assert.deepEqual(fetched.map(f => f.cache), ["reload"], `${page} is fetched fresh, once`);
    }
  }
  // Offline: a short page of its own with the way back to the game; never Home under the Device check's address.
  online = false;
  for(const page of DEVICE_CHECK){
    const got = await navigate(page);
    assert.equal(got.status, 503);
    assert.ok(/DEVICE CHECK/.test(got.body) && /needs a connection/.test(got.body) && /<a href="\.\/"[^>]*>Back to the game<\/a>/.test(got.body), `offline, ${page} says so and links back`);
    assert.ok(!/SHELL/.test(got.body), "never the shell's index.html");
  }
  online = true;
  // The framed 3D pages the check plays still come from the shell the app runs.
  for(const framed of ["visual-assets/v10_1/roulette/index.html?gfx=0&bench=1", "visual-assets/v10_1/special-player/index.html?gfx=0&bench=1"]){
    assert.equal((await navigate(framed)).body, `SHELL ${framed.split("?")[0]}`, `${framed} comes from the shell`);
  }
  ok("P4", "the worker answers both Device check pages with the page itself (network, any query), a short offline page without a connection, and Home and the framed 3D pages as before");
  console.log(`PASS r91 device check published contracts (${checks} checks)`);
})().catch(error => { console.error(error); process.exitCode = 1; });
