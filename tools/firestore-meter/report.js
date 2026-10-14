const fs=require("fs");const d=JSON.parse(fs.readFileSync(process.argv[2]));
const pick=c=>{const p=[...(c||[])].reverse().find(x=>/^js\/production/.test(x));return(p||(c||[])[(c||[]).length-1]||"?").replace(/^js\//,"")};
const txOwner={};for(const e of d.events){if(e.k==="txstart")txOwner[e.user+":"+e.tx]=pick(e.chain);e.owner=(e.tx&&txOwner[e.user+":"+e.tx])||pick(e.chain);}
const wins=d.windows.filter(w=>!/closed|Closed|PostCommit/.test(w.label)); // steady parked screens of an ACTIVE showdown
const secs=wins.reduce((a,w)=>a+(w.end-w.start)/1000,0);
const inW=e=>wins.some(w=>e.t>=w.start&&e.t<w.end);
const g={};
for(const e of d.events){if(!inW(e))continue;const o=e.owner;g[o]=g[o]||{r:0,t:0,ts:{}};if(e.k==="read")g[o].r+=e.n;if(e.k==="txstart"){g[o].t++;(g[o].ts[e.user]=g[o].ts[e.user]||[]).push(e.t);}}
console.log(`active-showdown parked time: ${Math.round(secs)}s (${wins.length} windows x2 devices)`);
let tot=0;for(const v of Object.values(g))tot+=v.r;
console.log("TOTAL reads/min both devices:",(tot/secs*60).toFixed(0),"=> per hour",(tot/secs*3600).toFixed(0),"=> hours to 50,000:",(50000/(tot/secs*3600)).toFixed(2));
for(const [o,v] of Object.entries(g).sort((a,b)=>b[1].r-a[1].r).slice(0,12)){
  // distribution of gaps between consecutive tx starts on the same device
  const gaps=[];for(const a of Object.values(v.ts)){a.sort((x,y)=>x-y);for(let i=1;i<a.length;i++)gaps.push(a[i]-a[i-1]);}gaps.sort((x,y)=>x-y);
  const q=p=>gaps.length?(gaps[Math.floor(gaps.length*p)]/1000).toFixed(2):"-";
  console.log(o.padEnd(44),"reads/min(2dev)",(v.r/secs*60).toFixed(0).padStart(4),"share",(100*v.r/tot).toFixed(0).padStart(3)+"%","tx/min(2dev)",(v.t/secs*60).toFixed(1).padStart(5),"reads/tx",(v.r/Math.max(1,v.t)).toFixed(1).padStart(5),"gap p25/p50/p75 s",q(.25),q(.5),q(.75));
}
// per-screen mean for the estimate
const per={};for(const w of wins){const s=(w.end-w.start)/1000;let r=0;for(const e of d.events)if(e.k==="read"&&e.t>=w.start&&e.t<w.end)r+=e.n;per[w.label]=r/s*60;}
console.log("reads/min both devices per screen:",JSON.stringify(Object.fromEntries(Object.entries(per).map(([k,v])=>[k,Math.round(v)]))));
const vals=Object.values(per);console.log("min/mean/max reads/min:",Math.min(...vals).toFixed(0),(vals.reduce((a,b)=>a+b,0)/vals.length).toFixed(0),Math.max(...vals).toFixed(0),"=> hours to 50k:",(50000/(Math.max(...vals)*60)).toFixed(2),(50000/(vals.reduce((a,b)=>a+b,0)/vals.length*60)).toFixed(2),(50000/(Math.min(...vals)*60)).toFixed(2));
