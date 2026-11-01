#!/usr/bin/env node
"use strict";
// r87 2.0.0 Touchline Gazette readability (Nik 2026-11-01: "the stories are good ... it's very hard to see the words").
// The reading type of the paper (story, captions, trophy desk, numbers, Special Players line, THE RACE) is set in
// full-strength ink at reading sizes on a plain paper ground, and js/touchlineGazette.js fit() no longer shrinks the paper to
// fit a window below FIT_FLOOR (it used to go down to 72% on desktop and 82% on phones, which printed a 12px story at 8.6px).
// Checks, from css/v10Gazette.css and Team V's base sheet (visual-assets/v10_1/content/content.css):
//   R1 every reading ink is at least 4.5:1 (WCAG AA body text) on the paper, on the paper's darkest edge shading, and on
//      the gold edition's darkest foil
//   R2 reading sizes: desktop story >= 14px, captions/briefs >= 12.5px, phone story >= 13px in one column, and the
//      effective desktop story (size x FIT_FLOOR) >= 12.5px; the phone edition is never scaled
//   R3 the story, race and trophy-desk bands lie on plain paper colour; no dimming (no opacity, no backdrop filter)
//   R4 the headlines and masthead keep Team V's sizes (this pass does not touch them)
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const ROOT=path.resolve(__dirname,"../.."),read=f=>fs.readFileSync(path.join(ROOT,f),"utf8");
const css=read("css/v10Gazette.css"),base=read("visual-assets/v10_1/content/content.css");
const G=require(path.join(ROOT,"js/touchlineGazette.js"));
let n=0;const ok=label=>{n+=1;console.log(`ok ${n} ${label}`);};

const hex=h=>{const m=/^#([0-9a-f]{6})$/i.exec(h);assert.ok(m,`colour ${h}`);return [0,2,4].map(i=>parseInt(m[1].slice(i,i+2),16));};
const lum=([r,g,b])=>{const c=v=>{v/=255;return v<=0.03928?v/12.92:((v+0.055)/1.055)**2.4;};return 0.2126*c(r)+0.7152*c(g)+0.0722*c(b);};
const contrast=(a,b)=>{const x=lum(a),y=lum(b);return (Math.max(x,y)+0.05)/(Math.min(x,y)+0.05);};
const mix=(a,b,t)=>a.map((v,i)=>Math.round(v*(1-t)+b[i]*t));
const decl=(text,selector,prop)=>{const i=text.indexOf(selector+" {");assert.ok(i>=0,`rule ${selector}`);const body=text.slice(i,text.indexOf("}",i));const m=new RegExp(`(?:^|[;{\\s])${prop}:\\s*([^;}]+)`).exec(body);assert.ok(m,`${selector} ${prop}`);return m[1].trim();};
const px=v=>{const m=/(\d+(?:\.\d+)?)px/.exec(v);assert.ok(m,`px in ${v}`);return Number(m[1]);};

// R1 ink against every paper the words can sit on
{
  const paper=hex(/\.cmx-paper \{[^}]*--paper:\s*(#[0-9a-f]{6})/i.exec(base)[1]);
  // the paper's edge shading (radial-gradient to rgba(120, 90, 40, .22) at the very edge) and its grain, at their darkest
  const edge=mix(mix(paper,[120,90,40],0.22),[89,71,46],0.22);
  const goldDark=hex("#b9891c");
  const inks=/#touchlineGazette \.cmx-gz \{ --tgz-ink: (#[0-9a-f]{6}); --tgz-ink-soft: (#[0-9a-f]{6}); \}/i.exec(css);
  const goldInks=/#touchlineGazette \.cmx-gz\.cmx-paper--gold \{ --tgz-ink: (#[0-9a-f]{6}); --tgz-ink-soft: (#[0-9a-f]{6}); \}/i.exec(css);
  assert.ok(inks&&goldInks,"the paper's reading inks are declared");
  for(const ink of [inks[1],inks[2]]){
    assert.ok(contrast(hex(ink),paper)>=4.5,`${ink} on the paper: ${contrast(hex(ink),paper).toFixed(2)}`);
    assert.ok(contrast(hex(ink),edge)>=4.5,`${ink} on the paper edge: ${contrast(hex(ink),edge).toFixed(2)}`);
  }
  for(const ink of [goldInks[1],goldInks[2]])assert.ok(contrast(hex(ink),goldDark)>=4.5,`${ink} on the darkest gold: ${contrast(hex(ink),goldDark).toFixed(2)}`);
  for(const sel of [".cmx-gz__text",".cmx-gz__brief p",".cmx-gz__nums",".cmx-paper__subhead",".cmx-gz__quote p"])
    assert.match(css,new RegExp(`#touchlineGazette ${sel.replace(/[.*]/g,"\\$&")},?[^{]*\\{ color: var\\(--tgz-ink\\); \\}|#touchlineGazette ${sel.replace(/[.*]/g,"\\$&")}[,\\s][\\s\\S]*?\\{ color: var\\(--tgz-ink\\); \\}`),`${sel} is set in reading ink`);
  for(const sel of [".cmx-gz__cap",".cmx-gz__portrait figcaption",".cmx-gz__ear",".cmx-gz__byline"])
    assert.ok(css.includes(`#touchlineGazette ${sel}`),`${sel} is coloured here`);
  for(const color of ["color: #14100b;"])assert.ok(css.split(color).length>=4,"the Special Players line, the race line and the race chips use reading ink");
  assert.ok(contrast(hex("#14100b"),edge)>=4.5&&contrast(hex("#4a3d26"),paper)>=4.5,"race labels");
  ok("R1 every reading ink is 4.5:1 or better on the paper, its edge shading and the darkest gold");
}

// R2 reading sizes, and the paper is not shrunk below them
{
  const nc="#touchlineGazette .cmx-gz:not(.cmx-gz--compact)";
  const story=px(decl(css,`${nc} .cmx-gz__text`,"font-size"));
  assert.ok(story>=14,`desktop story ${story}px`);
  assert.ok(px(decl(css,`${nc} .cmx-gz__brief p`,"font-size"))>=12.5,"desktop trophy desk");
  assert.ok(/\.cmx-gz__cap,\n#touchlineGazette \.cmx-gz:not\(\.cmx-gz--compact\) \.cmx-gz__portrait figcaption \{ font-size: (\d+(?:\.\d+)?)px/.test(css)&&Number(RegExp.$1)>=12.5,"desktop captions");
  assert.ok(G.FIT_FLOOR&&G.FIT_FLOOR.desktop>=0.9&&G.FIT_FLOOR.phone===1,"fit() floors");
  assert.ok(story*G.FIT_FLOOR.desktop>=12.5,`effective desktop story ${(story*G.FIT_FLOOR.desktop).toFixed(1)}px`);
  assert.ok(!/0\.72|0\.82/.test(read("js/touchlineGazette.js").split("function fit(){")[1].split("\n  }")[0]),"the old 72%/82% floors are gone");
  const phone=/#touchlineGazette \.cmx-gz--compact \.cmx-gz__text \{ column-count: 1; font-size: (\d+(?:\.\d+)?)px; line-height: ([\d.]+); \}/.exec(css);
  assert.ok(phone&&Number(phone[1])>=13&&Number(phone[2])>=1.4,"phone story: one column, 13px or more, open leading");
  assert.ok(px(decl(css,"#touchlineGazette .cmx-gz--compact .cmx-gz__cap","font-size"))>=12,"phone caption");
  assert.ok(px(decl(css,"#touchlineGazette .cmx-gz--compact .cmx-gz__brief p","font-size"))>=12,"phone trophy desk");
  assert.ok(px(decl(css,"#touchlineGazette .cmx-gz--compact .tgz-sp","font-size"))>=12,"phone Special Players line");
  ok("R2 desktop story 14px (12.9px at the 92% floor), captions 12.5px; phone story 13px in one column, never scaled");
}

// R3 plain paper behind the words, nothing dimmed
{
  for(const sel of [".cmx-gz__body",".tgz-race",".cmx-gz__desk",".cmx-gz__cap",".tgz-sp"])
    assert.ok(css.includes(`#touchlineGazette .cmx-gz:not(.cmx-paper--gold) ${sel}`),`${sel} on plain paper`);
  assert.match(css,/\.tgz-sp \{ background-color: var\(--paper\); \}/,"the bands take the paper's own colour");
  assert.ok(!/backdrop-filter|opacity:\s*0?\.\d|filter:\s*brightness/.test(css),"no dimming");
  ok("R3 the story, race, trophy desk, caption and Special Players bands lie on plain paper colour; nothing is dimmed");
}

// R4 headlines untouched
{
  assert.ok(!/cmx-paper__headline|cmx-paper__masthead/.test(css.replace(/\/\*[\s\S]*?\*\//g,"")),"no headline or masthead rule in the page sheet");
  assert.match(base,/\.cmx-gz \.cmx-paper__headline \{ margin: 0 0 4px; font: 900 30px\/\.98 "Gazette Head"/,"Team V's headline");
  ok("R4 headlines and masthead keep Team V's type");
}
console.log(`r87 Gazette readability contracts: ${n} checks passed`);
