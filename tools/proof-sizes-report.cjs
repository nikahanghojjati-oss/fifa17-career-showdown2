"use strict";
// Reads <dir>/findings.jsonl files written by tools/proof-sizes-hook.cjs and prints the real layout findings, with the known noise
// removed:
//   - a button "covered" while an overlay is open is expected when the button sits under that overlay (only buttons INSIDE an
//     open overlay are checked then);
//   - anything covered by the startup athlete picture is the loading screen fading out, not a layout fault;
//   - brush titles (h1/h2) draw wider than their box on purpose, so "clipped" counts for buttons and tiles only.
//   node tools/proof-sizes-report.cjs test-results/proof-sizes/a test-results/proof-sizes/b ... [--json out.json]
const fs=require("node:fs");
const path=require("node:path");
const args=process.argv.slice(2);
const jsonOut=args.includes("--json")?args[args.indexOf("--json")+1]:null;
const dirs=args.filter((a,i)=>a!=="--json"&&args[i-1]!=="--json");
const rows=[];
for(const dir of dirs){
  const file=path.join(dir,"findings.jsonl");
  if(!fs.existsSync(file))continue;
  for(const line of fs.readFileSync(file,"utf8").split("\n").filter(Boolean)){
    const o=JSON.parse(line);o.dir=dir;
    const overlayIds=o.overlays.map(x=>x.replace(/^#/,""));
    o.real=o.issues.filter(i=>{
      if(o.loading)return false;
      if(i.kind==="clipped"&&/^h[123]/.test(i.what))return false;
      // the Settings sheet scrolls inside its own <main>, the music sheet's track list is a scrollable list by design (Nik)
      if(i.kind==="scroller"&&/^main\b|cmsMusicSheetList/.test(i.what))return false;
      if(i.kind==="covered"){
        // the top-bar account badge sits under full-screen pages (career pages, results) on purpose
        if(/onlinePlayerIdentityBadge/.test(i.what))return false;
        // a sheet or dialog is open: only its own controls count
        const sheetOpen=o.overlays.length||o.screens.length>1;
        if(sheetOpen&&/menuTile|sd-nav|menuMusic|menuMedia|#continueCareer|#newShowdown/.test(i.what))return false;
        if(/startupAthlete|loadingScreen/.test(i.detail))return false;
        if(overlayIds.length&&overlayIds.some(id=>i.detail.includes(`#${id}`)||i.detail.includes(id)))return false;
        if(overlayIds.length&&/remoteJoining|connectPlayers|Overlay/.test(i.detail)&&!overlayIds.some(id=>i.what.includes(id)))return false;
      }
      return true;
    });
    rows.push(o);
  }
}
const byKey=new Map();
for(const o of rows)for(const i of o.real){
  const k=`${o.size}|${o.screens.join("+")}${o.overlays.length?"+"+o.overlays.join("+"):""}|${i.kind}|${i.what}|${i.text||""}`;
  if(!byKey.has(k))byKey.set(k,{size:o.size,screen:o.screens.join("+")+(o.overlays.length?" + "+o.overlays.join("+"):""),head:o.head,kind:i.kind,what:i.what,text:i.text||"",detail:i.detail,at:i.at||"top",shot:path.join(o.dir,o.shots[i.at==="bottom"?1:0]||o.shots[0])});
}
const findings=[...byKey.values()];
console.log(`${rows.length} screen states shot; ${findings.length} findings after noise filter`);
for(const f of findings)console.log(`${f.kind.padEnd(9)} ${f.size.padEnd(9)} ${f.screen.slice(0,48).padEnd(48)} ${f.what} ${f.text?`"${f.text}"`:""} ${f.detail} [${f.at}] ${f.shot}`);
if(jsonOut)fs.writeFileSync(jsonOut,JSON.stringify({states:rows.map(o=>({n:o.n,who:o.who,size:o.size,screens:o.screens,overlays:o.overlays,head:o.head,shots:o.shots.map(s=>path.join(o.dir,s)),real:o.real})),findings},null,1));
