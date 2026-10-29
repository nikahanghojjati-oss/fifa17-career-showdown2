#!/usr/bin/env node
"use strict";

const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const baseArg = process.argv[2];
const screenArg = process.argv[3];
const frameArg = process.argv[4];
if (!baseArg || !screenArg || !frameArg) {
  console.error("Usage: factory-qa.cjs <base-url> <screen-folder> <frame1,frame2,...>");
  process.exit(2);
}

const screen = path.resolve(process.cwd(), screenArg);
const fixturePath = path.join(screen, "fixtures.json");
if (!fs.existsSync(fixturePath)) throw new Error("fixtures.json not found: " + fixturePath);
const fixtures = JSON.parse(fs.readFileSync(fixturePath, "utf8"));
const frames = frameArg.split(",").map(x => x.trim()).filter(Boolean);
for (const frame of frames) {
  if (!fixtures.frames || !Object.prototype.hasOwnProperty.call(fixtures.frames, frame)) {
    throw new Error("Unknown frame " + frame);
  }
}
const base = baseArg.endsWith("/") ? baseArg : baseArg + "/";
const outDir = path.resolve(process.env.FACTORY_QA_OUT || path.join(screen, "evidence"));
fs.mkdirSync(outDir, { recursive: true });

const VIEWS = [
  {w:1366,h:768,dpr:1,label:"1366x768"},
  {w:1440,h:900,dpr:1,label:"1440x900"},
  {w:1920,h:1080,dpr:1,label:"1920x1080"},
  {w:1366,h:640,dpr:1,label:"1366x640"},
  {w:393,h:660,dpr:3,label:"393x660@3x",phone:true},
  {w:360,h:640,dpr:2,label:"360x640",phone:true},
  {w:375,h:553,dpr:2,label:"375x553",phone:true},
  {w:390,h:844,dpr:2,label:"390x844",phone:true},
  {w:430,h:932,dpr:2,label:"430x932",phone:true}
];

function flatten(v, out) {
  if (typeof v === "string") out.push(v);
  else if (Array.isArray(v)) v.forEach(x => flatten(x, out));
  else if (v && typeof v === "object") Object.values(v).forEach(x => flatten(x, out));
}
function expectedStrings(frame) {
  const out = [];
  const f = fixtures.frames[frame] || {};
  const variantRefs = new Set();
  if (fixtures.frames) {
    Object.values(fixtures.frames).forEach(fr => {
      if (!fr || typeof fr !== "object") return;
      Object.entries(fr).forEach(([k, v]) => {
        if (typeof v === "string" && /(?:tile|variant|stateKey|choiceKey)$/i.test(k)) variantRefs.add(v);
      });
    });
  }

  function collect(v, key) {
    if (typeof v === "string") {
      if (!/^https?:\/\//i.test(v) && !/\{[^}]+\}/.test(v)) out.push(v);
      return;
    }
    if (Array.isArray(v)) { v.forEach(x => collect(x)); return; }
    if (!v || typeof v !== "object") return;
    for (const [childKey, child] of Object.entries(v)) {
      if (variantRefs.has(childKey) && childKey !== f.newTile && childKey !== f.variant && childKey !== f.choiceKey) continue;
      collect(child, childKey);
    }
  }

  ["strings","chrome","leagues","decorative"].forEach(k => { if (fixtures[k]) collect(fixtures[k], k); });
  collect(f, "frame");

  const nonUi = new Set([f.tier,f.note,f.primary,f.newTile,f.variant,f.choiceKey,f.mode,f.state].filter(x => typeof x === "string"));
  const keys = new Set();
  const media = fixtures.strings && fixtures.strings.media;
  if (media && Array.isArray(media.tracks)) media.tracks.forEach(t => { if (t && t.key) keys.add(t.key); });
  if (media && media.defaultTrack) keys.add(media.defaultTrack);
  return [...new Set(out.filter(s => s && !nonUi.has(s) && !keys.has(s)))];
}
function safeName(s) { return String(s).replace(/[^a-z0-9_.@-]+/gi, "-"); }

function gateRecord(result) {
  const s=result.scroll;
  const noScroll=![s.html.horizontal,s.html.vertical,s.body.horizontal,s.body.vertical,s.stage.horizontal,s.stage.vertical].some(Boolean);
  const v=result.viewport;
  const is375=v.w===375 && v.h===553;
  const H5pass=is375 ? !!(result.primary && result.primary.visibleInViewport) :
    (noScroll && !!(result.primary && result.primary.visibleInViewport));
  return {
    H1:{pass:!!(result.hardGates && result.hardGates.H1 && result.hardGates.H1.pass),details:result.hardGates.H1},
    H5:{pass:H5pass,details:{noScroll,primary:result.primary,rule:is375?"primary visible at 375x553":"no page/stage scroll and primary visible"}},
    H6:{pass:result.inputsBelow16px.length===0,details:{inputsBelow16px:result.inputsBelow16px,inputFonts:result.inputFonts}},
    H7:{pass:!!(result.hardGates && result.hardGates.H7 && result.hardGates.H7.pass),details:result.hardGates.H7},
    CONTROL_BOUNDS:{pass:result.controlsOutsideViewport.length===0,details:result.controlsOutsideViewport},
    CONSOLE:{pass:result.consoleErrors.length===0,details:result.consoleErrors},
    REQUESTS:{pass:result.failedRequests.length===0,details:result.failedRequests},
    FIXTURE_STRINGS:{pass:result.fixtureStrings.missing.length===0,details:result.fixtureStrings.missing}
  };
}

function summaryMarkdown(report) {
  const rows = [
    "# Factory QA summary",
    "",
    "Screen: " + report.screenFolder,
    "Frames: " + report.frames.join(", "),
    "Generated: " + report.generatedAt,
    "",
    "| Frame | Viewport | Result | Failing gates |",
    "| --- | --- | --- | --- |"
  ];
  for (const r of report.results) {
    const failing = Object.entries(r.gates).filter(([, g]) => !g.pass).map(([k]) => k);
    rows.push("| " + r.frame + " | " + r.viewport.label + " | " + (failing.length ? "FAIL" : "PASS") + " | " + (failing.join(", ") || "none") + " |");
  }

  rows.push("", "## Gate rollup", "", "| Gate | Result | Runs | Details |", "| --- | --- | --- | --- |");
  const gateNames = [...new Set(report.results.flatMap(r => Object.keys(r.gates)))];
  for (const name of gateNames) {
    const runs = report.results.map(r => r.gates[name]).filter(Boolean);
    const fails = runs.filter(g => !g.pass);
    const detail = fails.length
      ? JSON.stringify(fails[0].details).replace(/\|/g, "\\|").slice(0, 360)
      : "all checks passed";
    rows.push("| " + name + " | " + (fails.length ? "FAIL" : "PASS") + " | " + (runs.length - fails.length) + "/" + runs.length + " pass | " + detail + " |");
  }
  return rows.join("\n") + "\n";
}

async function visibleText(page) {
  return page.evaluate(() => {
    function vis(el) {
      if (!el) return false;
      for (let n=el; n && n.nodeType===1; n=n.parentElement) {
        const cs=getComputedStyle(n);
        if (cs.display==="none" || cs.visibility==="hidden" || Number(cs.opacity)===0) return false;
        if (n.matches("[hidden],[aria-hidden='true']")) return false;
        if (n.classList.contains("vh") || n.classList.contains("visually-hidden") || n.classList.contains("sr-only")) return false;
      }
      const r=el.getBoundingClientRect();
      return r.width>0 && r.height>0;
    }
    const out=[];
    const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
    let n;
    while ((n=w.nextNode())) {
      const p=n.parentElement;
      if (!p || p.closest("script,style,svg,template") || !vis(p)) continue;
      const t=n.textContent.replace(/\s+/g," ").trim();
      if (t) out.push(t);
    }
    return out;
  });
}

async function measure(page, frame, view) {
  const got = await page.evaluate(() => {
    const parts = [document.body ? document.body.textContent : ""];
    document.querySelectorAll("*").forEach(el => {
      for (const name of ["aria-label","alt","title","value","placeholder"]) {
        const v = el.getAttribute && el.getAttribute(name);
        if (v) parts.push(v);
      }
    });
    return parts.join("\n").replace(/\s+/g, " ");
  });
  const missing = expectedStrings(frame).filter(s => !got.includes(String(s).replace(/\s+/g, " ").trim()));
  return page.evaluate(({frame,view,missing}) => {
    function vis(el) {
      if (!el) return false;
      for (let n=el; n && n.nodeType===1; n=n.parentElement) {
        const cs=getComputedStyle(n);
        if (cs.display==="none" || cs.visibility==="hidden" || Number(cs.opacity)===0) return false;
        if (n.matches("[hidden],[aria-hidden='true']")) return false;
      }
      const r=el.getBoundingClientRect();
      return r.width>0 && r.height>0;
    }
    function box(el) {
      const r=el.getBoundingClientRect();
      return {left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height};
    }
    function inside(r) {
      return r.left>=-0.5 && r.top>=-0.5 && r.right<=innerWidth+0.5 && r.bottom<=innerHeight+0.5;
    }
    const html=document.documentElement, body=document.body;
    const stage=document.querySelector("#stage-root,[data-stage],.stage") || document.querySelector("main") || body;
    const controls=[...document.querySelectorAll("button,a[href],input,select,textarea")].filter(vis).map(el => {
      const r=box(el);
      return {
        tag:el.tagName.toLowerCase(),
        id:el.id || null,
        label:(el.getAttribute("aria-label") || el.textContent || "").replace(/\s+/g," ").trim().slice(0,120),
        rect:r,
        fullyInsideViewport:inside(r)
      };
    });
    const inputFonts=[...document.querySelectorAll("input,select,textarea")].filter(vis).map(el => ({
      id:el.id || null,
      tag:el.tagName.toLowerCase(),
      fontSizePx:parseFloat(getComputedStyle(el).fontSize)
    }));
    const managerBoxes = {
      daniel:[...document.querySelectorAll('[data-manager="daniel"]')].filter(vis).map(box),
      nik:[...document.querySelectorAll('[data-manager="nik"]')].filter(vis).map(box)
    };
    const centerX = r => (r.left + r.right) / 2;
    const H1 = {
      pass:managerBoxes.daniel.length>0 && managerBoxes.nik.length>0 &&
        centerX(managerBoxes.daniel[0]) < centerX(managerBoxes.nik[0]),
      daniel:managerBoxes.daniel,
      nik:managerBoxes.nik,
      rule:'data-manager="daniel" must be left of data-manager="nik"'
    };

    const frameFx=window.__factoryFrame || {};
    const stageRoot=document.getElementById("stage-root") || body;
    const primaryId=stageRoot.dataset.primary || frameFx.primary || null;
    const primary=primaryId ? document.getElementById(primaryId) :
      document.querySelector("[data-primary-action],[data-primary='true'],.primary-action,button.primary,.is-primary");
    const pr=primary && vis(primary) ? box(primary) : null;
    return {
      frame,
      viewport:view,
      scroll:{
        html:{width:html.scrollWidth,height:html.scrollHeight,clientWidth:html.clientWidth,clientHeight:html.clientHeight,
          horizontal:html.scrollWidth>innerWidth+1,vertical:html.scrollHeight>innerHeight+1},
        body:{width:body.scrollWidth,height:body.scrollHeight,clientWidth:body.clientWidth,clientHeight:body.clientHeight,
          horizontal:body.scrollWidth>innerWidth+1,vertical:body.scrollHeight>innerHeight+1},
        stage:{selector:stage.id ? "#"+stage.id : String(stage.className || stage.tagName),
          width:stage.scrollWidth,height:stage.scrollHeight,clientWidth:stage.clientWidth,clientHeight:stage.clientHeight,
          horizontal:stage.scrollWidth>stage.clientWidth+1,vertical:stage.scrollHeight>stage.clientHeight+1}
      },
      controls,
      controlsOutsideViewport:controls.filter(x => !x.fullyInsideViewport),
      primary:primary ? {id:primary.id || null,label:(primary.getAttribute("aria-label") || primary.textContent || "").replace(/\s+/g," ").trim().slice(0,120),
        rect:pr,visibleInViewport:pr ? inside(pr) : false} : null,
      inputFonts,
      inputsBelow16px:inputFonts.filter(x => x.fontSizePx<16),
      fixtureStrings:{missing},
      hardGates:{H1}
    };
  }, {frame,view,missing});
}

(async () => {
  const browser=await chromium.launch({headless:true});
  const results=[];
  try {
    for (const frame of frames) for (const view of VIEWS) {
      const context=await browser.newContext({
        viewport:{width:view.w,height:view.h},
        deviceScaleFactor:view.dpr,
        isMobile:!!view.phone,
        hasTouch:!!view.phone
      });
      const page=await context.newPage();
      const consoleErrors=[], failedRequests=[];
      page.on("pageerror", e => consoleErrors.push("pageerror: "+String(e)));
      page.on("console", m => { if (m.type()==="error") consoleErrors.push("console: "+m.text()); });
      page.on("requestfailed", r => {
        const f=r.failure();
        failedRequests.push(r.url()+(f && f.errorText ? " :: "+f.errorText : ""));
      });
      page.on("response", r => { if (r.status()>=400) failedRequests.push(r.status()+" "+r.url()); });
      await page.addInitScript(frameFx => { window.__factoryFrame=frameFx; }, fixtures.frames[frame]);
      const url=new URL("index.html",base);
      url.searchParams.set("frame",frame);
      await page.goto(url.href,{waitUntil:"domcontentloaded",timeout:15000});
      await page.waitForLoadState("load",{timeout:15000}).catch(() => {});
      await page.waitForTimeout(350);
      const shot=safeName(frame)+"__"+safeName(view.label)+".png";
      await page.screenshot({path:path.join(outDir,shot),type:"png"});
      const r=await measure(page,frame,view);
      r.consoleErrors=consoleErrors;
      r.failedRequests=[...new Set(failedRequests)];
      r.screenshot=shot;

      const reduced=await browser.newContext({
        viewport:{width:view.w,height:view.h},
        deviceScaleFactor:view.dpr,
        isMobile:!!view.phone,
        hasTouch:!!view.phone,
        reducedMotion:"reduce"
      });
      const reducedPage=await reduced.newPage();
      await reducedPage.addInitScript(frameFx => { window.__factoryFrame=frameFx; }, fixtures.frames[frame]);
      await reducedPage.goto(url.href,{waitUntil:"domcontentloaded",timeout:15000});
      await reducedPage.waitForLoadState("load",{timeout:15000}).catch(() => {});
      await reducedPage.waitForTimeout(300);
      const runningAnimations=await reducedPage.evaluate(() => document.getAnimations({subtree:true})
        .filter(a => a.playState==="running")
        .map(a => {
          const effect=a.effect;
          const target=effect && effect.target;
          const timing=effect && effect.getComputedTiming ? effect.getComputedTiming() : {};
          return {
            target:target ? (target.id ? "#"+target.id : target.className || target.tagName) : null,
            animationName:a.animationName || null,
            currentTime:a.currentTime,
            duration:timing.duration
          };
        }));
      r.hardGates.H7={
        pass:runningAnimations.length===0,
        reducedMotion:"reduce",
        checkedAfterMs:300,
        runningAnimations
      };
      await reduced.close();

      results.push(r);
      console.log(frame+" "+view.label+": captured H1="+(r.hardGates.H1.pass?"PASS":"FAIL")+" H7="+(r.hardGates.H7.pass?"PASS":"FAIL"));
      await context.close();
    }
  } finally {
    await browser.close();
  }
  const report={
    schema:"SHOWDOWN_FACTORY_QA_V1",
    generatedAt:new Date().toISOString(),
    base,
    screenFolder:screenArg,
    frames,
    viewports:VIEWS,
    results:results.map(r => Object.assign(r,{gates:gateRecord(r)}))
  };
  report.pass=report.results.every(r => Object.values(r.gates).every(g => g.pass));
  report.failingRuns=report.results.filter(r => !Object.values(r.gates).every(g => g.pass))
    .map(r => ({frame:r.frame,viewport:r.viewport.label,failingGates:Object.entries(r.gates).filter(([,g])=>!g.pass).map(([k])=>k)}));
  fs.writeFileSync(path.join(outDir,"qa_report.json"),JSON.stringify(report,null,2)+"\n");
  fs.writeFileSync(path.join(outDir,"QA_SUMMARY.md"),summaryMarkdown(report));
  console.log("QA report: "+(report.pass?"PASS":"FAIL")+" · "+path.join(outDir,"qa_report.json"));
  if (process.env.FACTORY_QA_STDOUT_JSON==="1") process.stdout.write(JSON.stringify(report,null,2)+"\n");
})().catch(error => {
  console.error(error && error.stack ? error.stack : String(error));
  process.exit(1);
});
