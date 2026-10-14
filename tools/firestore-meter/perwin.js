const fs=require("fs");const d=JSON.parse(fs.readFileSync(process.argv[2]));const pat=process.argv[3]||"";
const pick=c=>{const p=[...(c||[])].reverse().find(x=>/^js\/production/.test(x));return(p||(c||[])[(c||[]).length-1]||"?").replace(/^js\//,"")};
const txOwner={};for(const e of d.events){if(e.k==="txstart")txOwner[e.user+":"+e.tx]=pick(e.chain);e.owner=(e.tx&&txOwner[e.user+":"+e.tx])||pick(e.chain);}
for(const w of d.windows.filter(w=>w.label.includes(pat))){
  const secs=(w.end-w.start)/1000;console.log(`-- ${w.label} ${Math.round(secs)}s  (per device avg; D=daniel N=nik)`);
  const g={};
  for(const e of d.events){if(e.t<w.start||e.t>=w.end)continue;const o=e.owner;g[o]=g[o]||{D:{r:0,t:0},N:{r:0,t:0}};const u=e.user==="daniel"?"D":"N";if(e.k==="read")g[o][u].r+=e.n;if(e.k==="txstart")g[o][u].t++;}
  for(const [o,v] of Object.entries(g).sort((a,b)=>(b[1].D.r+b[1].N.r)-(a[1].D.r+a[1].N.r))){
    const f=x=>(x/secs).toFixed(2);
    console.log("  ",o.padEnd(42),`reads/s D ${f(v.D.r)} N ${f(v.N.r)} | tx/s D ${f(v.D.t)} N ${f(v.N.t)} | reads/tx ${((v.D.r+v.N.r)/Math.max(1,v.D.t+v.N.t)).toFixed(1)}`);
  }
  const evs={};for(const e of d.events){if(e.k==="evt"&&e.t>=w.start&&e.t<w.end){const k=e.user+" "+e.name;evs[k]=(evs[k]||0)+1}}
  if(Object.keys(evs).length)console.log("   career-mode-* events/s:",Object.entries(evs).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([k,n])=>`${k} ${(n/secs).toFixed(2)}`).join("; "));
}
