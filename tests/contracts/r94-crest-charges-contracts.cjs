"use strict";
/* R94-01 (Nik 2026-11-15): premium hand-drawn crests. Every club's crest renders from the one charge library, carries no
   lettering, keeps its size, and the library stays small and clean. */
const assert=require("assert"),fs=require("fs"),path=require("path"),vm=require("vm");
const root=path.join(__dirname,"..","..");
const src=fs.readFileSync(path.join(root,"js/visualIdentity.js"),"utf8");
const ctx={console};ctx.window=ctx;ctx.globalThis=ctx;vm.createContext(ctx);
vm.runInContext(src+";this.__charges=CREST_CHARGES;this.__recipes=CLUB_CREST_RECIPES;",ctx,{filename:"visualIdentity.js"});
const clubsSrc=fs.readFileSync(path.join(root,"data/clubs.js"),"utf8");
vm.runInContext(clubsSrc+";this.__clubs=clubsByLeague;",ctx,{filename:"clubs.js"});
let n=0;const ok=(name,fn)=>{fn();n+=1;console.log("ok",n,name);};
const clubs=[].concat(...Object.values(ctx.__clubs));

ok("C1 all 98 league clubs have a recipe and render one 120 x 144 crest",()=>{
  assert.strictEqual(clubs.length,98);
  for(const club of clubs){
    assert.ok(ctx.__recipes[club],`recipe for ${club}`);
    const svg=ctx.getClubCrestSvg(club);
    assert.ok(/^<svg [^>]*viewBox="0 0 120 144"/.test(svg),`${club} viewBox`);
    assert.ok(svg.length<60000,`${club} crest stays light (${svg.length})`);
  }
});
ok("C2 no lettering anywhere: no text, font or glyph in any crest",()=>{
  for(const club of clubs){const svg=ctx.getClubCrestSvg(club);assert.ok(!/<text|<tspan|font-|<glyph|&#/.test(svg),`${club} has no text`);}
});
ok("C3 every charge a recipe names exists, and every placement is well formed",()=>{
  for(const [club,r] of Object.entries(ctx.__recipes)){
    for(const tok of String(r.motif||"").split(/\s+/).filter(t=>t.startsWith("ch."))){
      const [head]=tok.split(":"),[name,place]=head.slice(3).split("@");
      assert.ok(ctx.__charges[name],`${club}: charge ${name}`);
      assert.ok(/^-?[\d.]+,-?[\d.]+,[\d.]+(,m)?$/.test(place||""),`${club}: placement ${place}`);
    }
  }
});
ok("C4 charges are plain paths: only move/line/close commands and numbers, no scripts or links",()=>{
  for(const [name,c] of Object.entries(ctx.__charges)){
    assert.ok(Array.isArray(c)&&c.length===5,name);
    for(const d of [c[0],c[1],c[3]])assert.ok(/^[MmLlZz0-9.\s-]*$/.test(d),`${name} path`);
    assert.ok(c[0].length>100,`${name} has a body`);
  }
});
ok("C5 the charge library stays small (startup weight): under 40 KB",()=>{
  const a=src.indexOf("CREST-CHARGES:BEGIN"),b=src.indexOf("CREST-CHARGES:END");
  assert.ok(a>0&&b>a);assert.ok(b-a<40000,`library ${b-a} bytes`);
});
ok("C6 Squad Management never keeps a failed shirt and paints its stand-in in the club's own kit colour",()=>{
  const sq=fs.readFileSync(path.join(root,"js/squadScreen.js"),"utf8");
  assert.ok(/if\(url\)shirtCache\.set\(key,url\);else shirtMissed=true;/.test(sq),"failed shirts are not cached");
  assert.ok(/standInColour\(club,role,vsClub\)/.test(sq)&&/retryShirts\(0\)/.test(sq),"stand-in colour and retries");
});
console.log(`PASS r94 crest charges contracts (${n} checks)`);
