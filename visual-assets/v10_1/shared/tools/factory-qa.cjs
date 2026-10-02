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
  ["strings","chrome","leagues","decorative"].forEach(k => { if (fixtures[k]) flatten(fixtures[k], out); });
  flatten(fixtures.frames[frame], out);
  const f = fixtures.frames[frame] || {};
  const nonUi = new Set([f.tier,f.note,f.primary,f.newTile,f.mode,f.state].filter(x => typeof x === "string"));
  const keys = new Set();
  const media = fixtures.strings && fixtures.strings.media;
  if (media && Array.isArray(media.tracks)) media.tracks.forEach(t => { if (t && t.key) keys.add(t.key); });
  if (media && media.defaultTrack) keys.add(media.defaultTrack);
  return [...new Set(out.filter(s => s && !nonUi.has(s) && !keys.has(s) && !/^https?:\/\//i.test(s)))];
}
function safeName(s) { return String(s).replace(/[^a-z0-9_.@-]+/gi, "-"); }

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
  const got = (await visibleText(page)).join("\n");
  const missing = expectedStrings(frame).filter(s => !got.includes(s));
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
      fixtureStrings:{missing}
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
      results.push(r);
      console.log(frame+" "+view.label+": captured");
      await context.close();
    }
  } finally {
    await browser.close();
  }
  if (process.env.FACTORY_QA_STDOUT_JSON==="1") {
    process.stdout.write(JSON.stringify({base,screenFolder:screenArg,frames,results},null,2)+"\n");
  }
})().catch(error => {
  console.error(error && error.stack ? error.stack : String(error));
  process.exit(1);
});
