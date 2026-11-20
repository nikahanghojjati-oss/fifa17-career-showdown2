(function(root){
  "use strict";

  // R98-01 League Roulette (Nik 2026-11-20 20:24/20:25 UTC): the league screen becomes a real casino roulette. One round
  // wheel head of 40 pockets in five even league sections (8 pockets each: name, mark and the league's colour), a bowl with
  // a ball track, deflectors and a gold turret. Nik and Daniel each drop two glossy white roulette balls. A ball is
  // launched round the track, slows, falls down the apron, hops across the frets and settles in a pocket. That league is
  // out: its section splits in two and each half joins the section next to it, until the whole wheel is one league.
  //
  // This module only draws. It never decides the league: plan(seed, winner) turns the league the shared draw already gave
  // (js/sharedShowdownSetup.js) and a seed both phones share into the four drops (which league goes out, in which order,
  // into which pocket). It is a pure function, so both phones show the same four drops, also after a reload.
  //
  // ONE quality system (js/gfxTier.js): profile() before the renderer, calibrate behind the loading screen, the shared
  // governor in play (held while a ball moves), gov.end() before the context is let go.
  // Engine: the vendored three r187 the other 3D screens use.
  const ENGINE_PATH="visual-assets/v10_1/roulette/vendor/three-r187.min.js";
  const GFX_JS="js/gfxTier.js";
  const MARBLE_PATH="css/r78-marble-tile.webp";
  // The quality key this screen shares with the Ball Game (the next screen, the same light class of scene): gfxTier knows
  // it ("club-draw"), so a crash here never holds every screen. A name with "roulette" in it would hold Russian Roulette.
  const GFX_KEY="club-draw";

  // The five leagues round the wheel, so no two neighbours look alike (purple, red, navy, orange, azure). The protocol order
  // (js/sharedShowdownSetup.js LEAGUES) is a different list and is not changed.
  const WHEEL=Object.freeze(["premier_league","bundesliga","ligue_1","laliga","serie_a"]);
  const LEAGUE_LOOK=Object.freeze({
    premier_league:Object.freeze({name:"Premier League",colour:"#3d195b",accent:"#00ff85"}),
    bundesliga:Object.freeze({name:"Bundesliga",colour:"#d20515",accent:"#ffffff"}),
    ligue_1:Object.freeze({name:"Ligue 1",colour:"#13265c",accent:"#d7e600"}),
    laliga:Object.freeze({name:"LaLiga",colour:"#ee7a12",accent:"#fff1c9"}),
    serie_a:Object.freeze({name:"Serie A",colour:"#0b7ad1",accent:"#d4f1ff"})
  });
  const POCKETS=40,PER=POCKETS/WHEEL.length,DROPS=4;
  const STEP=Math.PI*2/POCKETS;

  // ---------- pure plan (no THREE; the contract test runs these in node) ----------
  // xmur3 + sfc32: a small seeded generator. Same seed, same numbers on every phone.
  function seedRng(text){
    let h=1779033703^text.length;
    for(let i=0;i<text.length;i++){h=Math.imul(h^text.charCodeAt(i),3432918353);h=(h<<13)|(h>>>19);}
    const next=()=>{h=Math.imul(h^(h>>>16),2246822507);h=Math.imul(h^(h>>>13),3266489909);return (h^=h>>>16)>>>0;};
    let a=next(),b=next(),c=next(),d=next();
    return ()=>{a>>>=0;b>>>=0;c>>>=0;d>>>=0;let t=(a+b)|0;a=b^(b>>>9);b=(c+(c<<3))|0;c=(c<<21)|(c>>>11);d=(d+1)|0;t=(t+d)|0;c=(c+t)|0;return (t>>>0)/4294967296;};
  }
  function startOwners(){return Array.from({length:POCKETS},(_,p)=>WHEEL[Math.floor(p/PER)]);}
  const wrap=p=>((p%POCKETS)+POCKETS)%POCKETS;
  // The contiguous runs of the wheel, each {league,start,len}. One league everywhere: one run from 0.
  function runsOf(owners){
    let b=-1;for(let p=0;p<POCKETS;p++)if(owners[p]!==owners[wrap(p-1)]){b=p;break;}
    if(b<0)return [{league:owners[0],start:0,len:POCKETS}];
    const out=[];let s=b;
    for(let i=1;i<=POCKETS;i++){const p=wrap(b+i);if(i===POCKETS||owners[p]!==owners[s]){out.push({league:owners[s],start:s,len:wrap(p-s)||POCKETS});s=p;}}
    return out;
  }
  // League `out` leaves: the first half of its run joins the section before it, the second half the section after it
  // (an odd run gives the extra pocket to the section before). The last two: the survivor takes it all.
  function mergeInfo(owners,out){
    const run=runsOf(owners).find(r=>r.league===out);if(!run)return null;
    const left=owners[wrap(run.start-1)],right=owners[wrap(run.start+run.len)];
    const half=left===right?run.len:Math.ceil(run.len/2);
    return {league:out,start:run.start,len:run.len,left,right,half};
  }
  function mergeOwners(owners,out){
    const m=mergeInfo(owners,out);if(!m)return owners.slice();
    const next=owners.slice();for(let j=0;j<m.len;j++)next[wrap(m.start+j)]=j<m.half?m.left:m.right;return next;
  }
  // plan(seed, winner): the four drops that leave `winner`. Drops alternate Daniel, Nik, Daniel, Nik (Daniel starts the
  // Showdown). Each ball lands in a pocket of the league it removes, never on that section's two edge pockets.
  function plan(seed,winner){
    if(!WHEEL.includes(winner))throw new Error("LEAGUE_ROULETTE_WINNER_INVALID");
    const rng=seedRng(`league-roulette-v1|${String(seed)}|${winner}`);
    const losers=WHEEL.filter(id=>id!==winner);
    for(let i=losers.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[losers[i],losers[j]]=[losers[j],losers[i]];}
    let owners=startOwners();const drops=[];
    for(let k=0;k<DROPS;k++){
      const run=runsOf(owners).find(r=>r.league===losers[k]);
      const inner=run.len>=3?1+Math.floor(rng()*(run.len-2)):Math.floor(rng()*run.len);
      drops.push({index:k,by:k%2===0?"daniel":"nik",league:losers[k],pocket:wrap(run.start+inner),
        launch:(rng()*2-1)*.35,orbit:3.3+rng()*.9,bounce:1.45+rng()*.4,hops:3+Math.floor(rng()*2),before:owners.slice()});
      owners=mergeOwners(owners,losers[k]);
    }
    return {winner,order:losers.slice(),drops,after:owners};
  }
  function ownersAt(p,k){const n=Math.max(0,Math.min(DROPS,k|0));return n<DROPS?p.drops[n].before.slice():p.after.slice();}

  // ---------- loading ----------
  let enginePromise=null;
  const lrDoc=()=>root.document;
  function lrHasWebgl(){try{const c=lrDoc().createElement("canvas"),gl=c.getContext("webgl2");if(!gl)return false;gl.getExtension("WEBGL_lose_context")?.loseContext();return true;}catch(_error){return false;}}
  function lrScript(path,ready){
    if(ready())return Promise.resolve(true);
    return new Promise((resolve,reject)=>{const s=lrDoc().createElement("script");s.src=path;s.async=true;
      s.addEventListener("load",()=>ready()?resolve(true):reject(new Error(path+" loaded empty")));
      s.addEventListener("error",()=>{s.remove();reject(new Error(path+" did not load"));});lrDoc().head.append(s);});
  }
  function lrLoadEngine(){
    const ready=()=>root.THREE&&typeof root.THREE.WebGLRenderer==="function";
    if(ready())return Promise.resolve(root.THREE);
    if(!enginePromise)enginePromise=lrScript(ENGINE_PATH,ready).then(()=>root.THREE,error=>{enginePromise=null;throw error;});
    return enginePromise;
  }
  const GFX_FALLBACK={level:0,name:"light",pixelRatio:1,antialias:true};
  async function lrQuality(){
    const ok=await lrScript(GFX_JS,()=>Boolean(root.CareerModeGfxTier)).catch(()=>false);
    try{if(ok)return root.CareerModeGfxTier.profile(GFX_KEY);}catch(_error){}
    return GFX_FALLBACK;
  }
  function lrImage(src){
    return new Promise(resolve=>{if(!src){resolve(null);return;}const im=new root.Image();im.decoding="async";
      im.onload=()=>{(im.decode?im.decode().catch(()=>{}):Promise.resolve()).then(()=>resolve(im));};im.onerror=()=>resolve(null);im.src=src;});
  }
  // The league's own mark (js/visualIdentity.js, original drawings), in cream so it reads on every colour.
  function lrMarkSrc(id){
    try{const m=typeof root.getLeagueMark==="function"?root.getLeagueMark(id):null;if(!m||!m.svg)return null;
      return "data:image/svg+xml;charset=utf-8,"+encodeURIComponent(m.svg.replace(/fill="#[0-9a-fA-F]{3,8}"/,'fill="#fbf3dc"'));}catch(_error){return null;}
  }
  function lrReducedMotion(){
    try{if(typeof root.isReducedMotionPreferred==="function")return Boolean(root.isReducedMotionPreferred());
      return Boolean(root.matchMedia&&root.matchMedia("(prefers-reduced-motion: reduce)").matches);}catch(_error){return false;}
  }

  // What each level draws (ONE system). Light (Nik's Chromebook, 2 CPU threads) stays light: one 1024 board texture,
  // standard materials, about a dozen draws.
  function knobs(level){
    const l=Math.max(0,Math.min(5,Math.round(Number(level))||0));
    return {level:l,board:l<=1?1024:2048,seg:l<=0?96:l<=2?128:192,ballSeg:l<=1?[28,18]:[40,26],
      clearcoat:l>=2,envSize:l<=1?256:512,sheen:l>=3};
  }

  // ---------- geometry helpers ----------
  const V2=(T,r,y)=>new T.Vector2(r,y);
  function lathe(T,pts,seg){return new T.LatheGeometry(pts.map(([r,y])=>V2(T,r,y)),seg);}
  // Several geometries as one draw (non-indexed, position + normal only).
  function mergeGeo(T,parts){
    const pos=[],nor=[];
    for(const [g,m] of parts){const x=g.index?g.toNonIndexed():g;x.applyMatrix4(m);x.computeVertexNormals();
      pos.push(...x.attributes.position.array);nor.push(...x.attributes.normal.array);if(x!==g)x.dispose();g.dispose();}
    const out=new T.BufferGeometry();out.setAttribute("position",new T.Float32BufferAttribute(pos,3));out.setAttribute("normal",new T.Float32BufferAttribute(nor,3));return out;
  }

  // Board dimensions (wheel radius RW = 1.06; the ball is a real roulette ball, about 1/30 of the wheel).
  const D={RW:1.06,POCKET_IN:.80,POCKET_OUT:1.02,POCKET_Y:-.10,CONE_IN:.30,CONE_OUT:.78,BR:.038,TRACK_R:1.300,TRACK_Y:.053,
    APRON_IN:1.075,APRON_OUT:1.27,APRON_YIN:-.07,APRON_YOUT:.05,REST_R:.91,WALL:1.336,RIM_IN:1.365,RIM_OUT:1.58};
  const apronY=r=>D.APRON_YIN+(r-D.APRON_IN)*(D.APRON_YOUT-D.APRON_YIN)/(D.APRON_OUT-D.APRON_IN);
  const smooth=x=>{const t=Math.max(0,Math.min(1,x));return t*t*(3-2*t);};
  const wrapPi=a=>{a=(a+Math.PI)%(Math.PI*2);if(a<0)a+=Math.PI*2;return a-Math.PI;};

  // ---------- the board canvas (pockets, sections, names, marks), drawn top-down in the wheel's own frame ----------
  function boardPainter(size,marks){
    const d=lrDoc(),cv=d.createElement("canvas");cv.width=cv.height=size;const cx=cv.getContext("2d"),c=size/2,S=size/2/D.RW;
    const shade=(hex,k)=>{const n=parseInt(hex.slice(1),16),f=v=>Math.max(0,Math.min(255,Math.round(k<0?v*(1+k):v+(255-v)*k)));return `rgb(${f(n>>16)},${f((n>>8)&255)},${f(n&255)})`;};
    // Board angle a (radians, counter-clockwise seen from above, 0 = +x) -> canvas angle -a.
    function sector(rIn,rOut,a0,a1){cx.beginPath();cx.arc(c,c,rOut*S,-a0,-a1,true);cx.arc(c,c,rIn*S,-a1,-a0,false);cx.closePath();}
    function paintRun(league,p0,p1){
      const L=LEAGUE_LOOK[league],a0=p0*STEP,a1=p1*STEP;
      sector(D.POCKET_IN,D.POCKET_OUT,a0,a1);cx.fillStyle=shade(L.colour,-.18);cx.fill();
      const g=cx.createRadialGradient(c,c,D.CONE_IN*S,c,c,D.CONE_OUT*S);g.addColorStop(0,shade(L.colour,.16));g.addColorStop(.55,L.colour);g.addColorStop(1,shade(L.colour,-.22));
      sector(D.CONE_IN,D.CONE_OUT,a0,a1);cx.fillStyle=g;cx.fill();
      // the league's accent: a thin band at the cone's foot
      sector(D.CONE_OUT-.035,D.CONE_OUT-.02,a0,a1);cx.fillStyle=L.accent;cx.globalAlpha=.85;cx.fill();cx.globalAlpha=1;
    }
    function goldLine(a,rIn,rOut,w){cx.beginPath();cx.moveTo(c+Math.cos(a)*rIn*S,c-Math.sin(a)*rIn*S);cx.lineTo(c+Math.cos(a)*rOut*S,c-Math.sin(a)*rOut*S);cx.lineWidth=w*S;cx.strokeStyle="#e9c46a";cx.stroke();}
    function ring(r,w,col){cx.beginPath();cx.arc(c,c,r*S,0,Math.PI*2);cx.lineWidth=w*S;cx.strokeStyle=col;cx.stroke();}
    // Name round the arc, letter tops toward the hub (upright where the wheel faces the camera), and the mark above it.
    function label(league,mid,alpha){
      if(alpha<=.01)return;const L=LEAGUE_LOOK[league],name=L.name.toUpperCase(),fs=.068*S,rr=.50*S;
      cx.save();cx.globalAlpha=alpha;cx.font=`700 ${fs}px "Instrument Sans Narrow","Arial Narrow",Arial,sans-serif`;cx.textAlign="center";cx.textBaseline="middle";
      const track=fs*.08,widths=[...name].map(ch=>cx.measureText(ch).width+track),W=widths.reduce((s,w)=>s+w,0)-track;
      let a=mid-W/rr/2;cx.fillStyle="#fbf3dc";cx.shadowColor="rgba(0,0,0,.55)";cx.shadowBlur=fs*.12;cx.shadowOffsetY=fs*.04;
      [...name].forEach((ch,i)=>{const at=a+widths[i]/2/rr;cx.save();cx.translate(c+Math.cos(at)*rr,c-Math.sin(at)*rr);cx.rotate(Math.atan2(-Math.cos(at),-Math.sin(at)));cx.fillText(ch,0,0);cx.restore();a+=widths[i]/rr;});
      const im=marks[league];
      if(im){const rm=.645*S,sz=.15*S;cx.save();cx.translate(c+Math.cos(mid)*rm,c-Math.sin(mid)*rm);cx.rotate(Math.atan2(-Math.cos(mid),-Math.sin(mid)));cx.drawImage(im,-sz/2,-sz/2,sz,sz);cx.restore();}
      cx.restore();
    }
    // owners: the wheel before this beat; anim: {league,start,len,left,right,half,f} while a section splits (f 0..1).
    function paint(owners,anim){
      cx.clearRect(0,0,size,size);
      // polished dark wood under everything (lip, gaps, hub)
      const wood=cx.createRadialGradient(c,c,0,c,c,D.RW*S);wood.addColorStop(0,"#2b1a10");wood.addColorStop(.7,"#3a2414");wood.addColorStop(1,"#1d110a");
      cx.fillStyle=wood;cx.beginPath();cx.arc(c,c,D.RW*S,0,Math.PI*2);cx.fill();
      const runs=runsOf(owners);
      for(const r of runs)paintRun(r.league,r.start,r.start+r.len);
      const f=anim?Math.max(0,Math.min(1,anim.f)):0;
      if(anim&&f>0){
        const rightLen=anim.len-anim.half;
        paintRun(anim.left,anim.start,anim.start+anim.half*f);
        if(rightLen>0)paintRun(anim.right,anim.start+anim.len-rightLen*f,anim.start+anim.len);
      }
      // pocket separators under the 3D frets
      for(let p=0;p<POCKETS;p++){const a=p*STEP;cx.beginPath();cx.moveTo(c+Math.cos(a)*D.POCKET_IN*S,c-Math.sin(a)*D.POCKET_IN*S);cx.lineTo(c+Math.cos(a)*D.POCKET_OUT*S,c-Math.sin(a)*D.POCKET_OUT*S);cx.lineWidth=.006*S;cx.strokeStyle="rgba(10,6,3,.7)";cx.stroke();}
      // section borders across the cone; while a section splits, its centre line and the two moving fronts
      const edges=new Set();
      if(runs.length>1)for(const r of runs)edges.add(r.start);
      if(anim&&f>0){edges.delete(anim.start);edges.delete(wrap(anim.start+anim.len));}
      for(const p of edges)goldLine(p*STEP,D.CONE_IN,D.CONE_OUT,.008);
      if(anim&&f>0&&anim.left!==anim.right){
        goldLine((anim.start+anim.half)*STEP,D.CONE_IN,D.CONE_OUT,.008*Math.min(1,f*4));
        goldLine((anim.start+anim.half*f)*STEP,D.CONE_IN,D.CONE_OUT,.006);
        goldLine((anim.start+anim.len-(anim.len-anim.half)*f)*STEP,D.CONE_IN,D.CONE_OUT,.006);
      }
      ring(D.CONE_OUT,.012,"#e9c46a");ring(D.CONE_IN,.012,"#e9c46a");ring(D.POCKET_OUT,.008,"#c9a24a");ring(D.POCKET_IN,.006,"#c9a24a");
      // names and marks: a section's label rides at the middle of its visible span; the leaving league's fades
      const spans=runs.map(r=>({league:r.league,a0:r.start,a1:r.start+r.len}));
      if(anim&&f>0)for(const s of spans){
        if(s.league===anim.left&&wrap(s.a1)===anim.start)s.a1+=anim.half*f;
        if(s.league===anim.right&&s.a0===wrap(anim.start+anim.len))s.a0-=(anim.len-anim.half)*f;
        if(anim.left===anim.right&&s.league===anim.left){if(wrap(s.a1)===anim.start)s.a1+=anim.len*f;}
      }
      for(const s of spans){
        const whole=s.a1-s.a0>=POCKETS-1e-6||runs.length===1,mid=(s.a0+s.a1)/2*STEP;
        const alpha=anim&&s.league===anim.league?1-smooth(f*1.6):1;
        if(whole){for(let i=0;i<3;i++)label(s.league,-Math.PI/2+i*Math.PI*2/3,alpha);}else label(s.league,mid,alpha);
      }
    }
    return {canvas:cv,paint};
  }

  // The ball track and apron, laid top-down: a light polished maple track, then dark mahogany turned on a lathe (fine rings).
  function woodCanvas(size){
    const cv=lrDoc().createElement("canvas");cv.width=cv.height=size;const x=cv.getContext("2d"),c=size/2,S=size/2/D.RIM_IN;
    x.fillStyle="#1a0d06";x.fillRect(0,0,size,size);const rnd=seedRng("wood");
    const g=x.createRadialGradient(c,c,D.APRON_IN*S,c,c,D.RIM_IN*S);
    g.addColorStop(0,"#2a140a");g.addColorStop(.55,"#4a2511");g.addColorStop(.86,"#5c3216");g.addColorStop(.875,"#a8743e");g.addColorStop(.95,"#c48a4a");g.addColorStop(1,"#8a5a2b");
    x.fillStyle=g;x.beginPath();x.arc(c,c,D.RIM_IN*S,0,Math.PI*2);x.fill();
    for(let r=D.APRON_IN*S;r<D.APRON_OUT*S;r+=Math.max(1.5,size/400)){x.beginPath();x.arc(c,c,r,0,Math.PI*2);x.strokeStyle=`rgba(${rnd()<.5?"0,0,0":"255,210,160"},${.03+rnd()*.05})`;x.lineWidth=1;x.stroke();}
    return cv;
  }
  // A small warm studio for reflections (two soft boxes above, a dim room), filtered once.
  function studioEnv(T,renderer,size){
    try{
      const d=lrDoc(),cv=d.createElement("canvas");cv.width=size;cv.height=size/2;const x=cv.getContext("2d");
      const g=x.createLinearGradient(0,0,0,cv.height);g.addColorStop(0,"#5d5246");g.addColorStop(.45,"#2c241d");g.addColorStop(.55,"#17120e");g.addColorStop(1,"#070504");
      x.fillStyle=g;x.fillRect(0,0,cv.width,cv.height);
      const box=(u,v,w,h,a)=>{const gx=x.createRadialGradient(u*cv.width,v*cv.height,0,u*cv.width,v*cv.height,w*cv.width);gx.addColorStop(0,`rgba(255,247,232,${a})`);gx.addColorStop(1,"rgba(255,247,232,0)");x.fillStyle=gx;x.save();x.translate(u*cv.width,v*cv.height);x.scale(1,h/w);x.translate(-u*cv.width,-v*cv.height);x.fillRect(0,0,cv.width,cv.height);x.restore();};
      box(.30,.16,.16,.06,1);box(.72,.20,.12,.05,.8);box(.5,.03,.3,.04,.5);
      const t=new T.CanvasTexture(cv);t.mapping=T.EquirectangularReflectionMapping;t.colorSpace=T.SRGBColorSpace;
      const pm=new T.PMREMGenerator(renderer),rt=pm.fromEquirectangular(t);pm.dispose();t.dispose();return rt;
    }catch(_error){return null;}
  }

  // ---------- the scene ----------
  function build(T,host,opts,P,assets){
    const K=knobs(P.level),d=lrDoc(),reduced=opts.reducedMotion===undefined?lrReducedMotion():Boolean(opts.reducedMotion);
    const thePlan=opts.plan;
    const canvas=d.createElement("canvas");canvas.className="leagueRoulette3d";canvas.setAttribute("aria-hidden","true");
    canvas.style.cssText="position:absolute;inset:0;width:100%;height:100%;display:block";
    const renderer=new T.WebGLRenderer({canvas,antialias:P.antialias!==false,alpha:true,powerPreference:"high-performance"});
    renderer.setClearColor(0x000000,0);renderer.setPixelRatio(P.pixelRatio);
    renderer.toneMapping=T.NeutralToneMapping;renderer.toneMappingExposure=1.0;renderer.outputColorSpace=T.SRGBColorSpace;
    const scene=new T.Scene(),cam=new T.PerspectiveCamera(30,2,.1,60),own=[];
    const geo=g=>{own.push(g);return g;},mat=m=>{own.push(m);return m;},tex=t=>{own.push(t);return t;};
    const envRT=studioEnv(T,renderer,K.envSize);if(envRT){own.push(envRT);scene.environment=envRT.texture;}
    scene.add(new T.HemisphereLight(0xfff4e2,0x1a120c,.55));
    const key=new T.DirectionalLight(0xfff1dc,1.5);key.position.set(-2.2,4.5,2.6);scene.add(key);
    const fill=new T.DirectionalLight(0xdfe8ff,.35);fill.position.set(3,2.2,-1.5);scene.add(fill);

    // bowl: marble body and rim, the polished wood ball track and apron, gold beads, eight gold deflectors
    const marbleTex=assets.marble?tex(new T.Texture(assets.marble)):null;
    if(marbleTex){marbleTex.needsUpdate=true;marbleTex.wrapS=marbleTex.wrapT=T.RepeatWrapping;marbleTex.repeat.set(8,1);marbleTex.colorSpace=T.SRGBColorSpace;marbleTex.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());}
    const marble=mat(new T.MeshStandardMaterial({color:marbleTex?0xffffff:0x15130f,map:marbleTex,roughness:.28,metalness:0,envMapIntensity:.9}));
    const woodM=mat(new T.MeshStandardMaterial({color:0x4a2a16,roughness:.32,metalness:0,envMapIntensity:.8}));
    const gold=mat(new T.MeshStandardMaterial({color:0xe2b552,roughness:.22,metalness:1,envMapIntensity:1.25}));
    const body=new T.Mesh(geo(lathe(T,[[1.46,-.34],[1.56,-.22],[D.RIM_OUT,-.02],[1.555,.13],[1.49,.185],[D.RIM_IN+.005,.19]],K.seg)),marble);scene.add(body);
    const trackG=geo(lathe(T,[[D.RIM_IN,.19],[1.344,.16],[D.WALL,.085],[1.325,.06],[1.295,.053],[D.APRON_OUT,D.APRON_YOUT],[D.APRON_IN,D.APRON_YIN],[1.068,-.085],[1.064,-.3]],K.seg));
    {const p=trackG.attributes.position,uv=trackG.attributes.uv;for(let i=0;i<p.count;i++)uv.setXY(i,.5+p.getX(i)/(2*D.RIM_IN),.5-p.getZ(i)/(2*D.RIM_IN));uv.needsUpdate=true;}
    const woodTex=tex(new T.CanvasTexture(woodCanvas(K.board/2)));woodTex.colorSpace=T.SRGBColorSpace;woodTex.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
    woodM.map=woodTex;woodM.color.set(0xffffff);woodM.needsUpdate=true;
    const track=new T.Mesh(trackG,woodM);scene.add(track);
    const beadG=mergeGeo(T,[[new T.TorusGeometry(D.RIM_IN,.011,10,K.seg),new T.Matrix4().makeRotationX(Math.PI/2).setPosition(0,.192,0)],
      [new T.TorusGeometry(1.535,.009,10,K.seg),new T.Matrix4().makeRotationX(Math.PI/2).setPosition(0,.15,0)]]);
    scene.add(new T.Mesh(geo(beadG),gold));
    const dia=new T.InstancedMesh(geo(new T.IcosahedronGeometry(.032,0)),gold,8),m4=new T.Matrix4(),q=new T.Quaternion(),sc=new T.Vector3(),ps=new T.Vector3();
    for(let j=0;j<8;j++){const a=(j+.5)*Math.PI/4,r=1.175,vert=j%2===0;q.setFromEuler(new T.Euler(0,a,0));sc.set(vert?.55:1.7,.45,vert?1.7:.55);ps.set(Math.cos(a)*r,apronY(r)+.012,-Math.sin(a)*r);m4.compose(ps,q,sc);dia.setMatrixAt(j,m4);}
    scene.add(dia);
    // bowl shadow on the page
    const shCv=d.createElement("canvas");shCv.width=shCv.height=128;{const x=shCv.getContext("2d"),g=x.createRadialGradient(64,64,20,64,64,64);g.addColorStop(0,"rgba(0,0,0,.75)");g.addColorStop(.62,"rgba(0,0,0,.45)");g.addColorStop(1,"rgba(0,0,0,0)");x.fillStyle=g;x.fillRect(0,0,128,128);}
    const shTex=tex(new T.CanvasTexture(shCv));
    const bowlShadow=new T.Mesh(geo(new T.PlaneGeometry(4.1,4.1)),mat(new T.MeshBasicMaterial({map:shTex,transparent:true,depthWrite:false})));bowlShadow.rotation.x=-Math.PI/2;bowlShadow.position.y=-.345;scene.add(bowlShadow);

    // wheel head (turns): one lathe with the board texture laid top-down, the 40 frets, the gold turret
    const head=new T.Group();scene.add(head);
    const headG=geo(lathe(T,[[1.06,-.3],[1.06,-.075],[1.035,-.066],[D.POCKET_OUT,D.POCKET_Y+.004],[D.POCKET_OUT-.01,D.POCKET_Y],[D.POCKET_IN+.01,D.POCKET_Y],[D.POCKET_IN,D.POCKET_Y+.006],[D.CONE_OUT,-.05],[D.CONE_IN,.10],[.28,.115],[0,.118]],K.seg));
    {const p=headG.attributes.position,uv=headG.attributes.uv;for(let i=0;i<p.count;i++)uv.setXY(i,.5+p.getX(i)/(2*D.RW),.5-p.getZ(i)/(2*D.RW));uv.needsUpdate=true;}
    const painter=boardPainter(K.board,assets.marks);
    const boardTex=tex(new T.CanvasTexture(painter.canvas));boardTex.colorSpace=T.SRGBColorSpace;boardTex.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());boardTex.minFilter=T.LinearMipmapLinearFilter;
    const headM=mat(new T.MeshStandardMaterial({map:boardTex,roughness:.36,metalness:0,envMapIntensity:.75}));
    head.add(new T.Mesh(headG,headM));
    const fretG=geo(new T.BoxGeometry(D.POCKET_OUT-D.POCKET_IN,.032,.009));
    const frets=new T.InstancedMesh(fretG,gold,POCKETS);
    for(let p=0;p<POCKETS;p++){const a=p*STEP,r=(D.POCKET_IN+D.POCKET_OUT)/2;q.setFromEuler(new T.Euler(0,a,0));sc.set(1,1,1);ps.set(Math.cos(a)*r,D.POCKET_Y+.016,-Math.sin(a)*r);m4.compose(ps,q,sc);frets.setMatrixAt(p,m4);}
    head.add(frets);
    const tparts=[[new T.CylinderGeometry(.05,.085,.11,32),new T.Matrix4().setPosition(0,.17,0)],[new T.SphereGeometry(.05,24,16),new T.Matrix4().setPosition(0,.25,0)],
      [new T.CylinderGeometry(.018,.03,.06,20),new T.Matrix4().setPosition(0,.21,0)]];
    for(let i=0;i<4;i++){const a=i*Math.PI/2;tparts.push([new T.CylinderGeometry(.011,.011,.34,12),new T.Matrix4().makeRotationZ(Math.PI/2).premultiply(new T.Matrix4().makeRotationY(a)).setPosition(Math.cos(a)*.17,.205,-Math.sin(a)*.17)]);
      tparts.push([new T.SphereGeometry(.022,16,12),new T.Matrix4().setPosition(Math.cos(a)*.34,.205,-Math.sin(a)*.34)]);}
    head.add(new T.Mesh(geo(mergeGeo(T,tparts)),gold));

    // balls: glossy ivory-white, one in play at a time, with a contact shadow
    const ballM=mat(K.clearcoat?new T.MeshPhysicalMaterial({color:0xf6f3ec,roughness:.18,metalness:0,clearcoat:1,clearcoatRoughness:.04,envMapIntensity:1.3})
      :new T.MeshStandardMaterial({color:0xf6f3ec,roughness:.14,metalness:0,envMapIntensity:1.35}));
    const ballG=geo(new T.SphereGeometry(D.BR,K.ballSeg[0],K.ballSeg[1]));
    const ball=new T.Mesh(ballG,ballM);ball.visible=false;scene.add(ball);
    const bsCv=d.createElement("canvas");bsCv.width=bsCv.height=64;{const x=bsCv.getContext("2d"),g=x.createRadialGradient(32,32,2,32,32,32);g.addColorStop(0,"rgba(0,0,0,.65)");g.addColorStop(1,"rgba(0,0,0,0)");x.fillStyle=g;x.fillRect(0,0,64,64);}
    const bsM=mat(new T.MeshBasicMaterial({map:tex(new T.CanvasTexture(bsCv)),transparent:true,depthWrite:false}));
    const ballShadow=new T.Mesh(geo(new T.PlaneGeometry(D.BR*3.2,D.BR*3.2)),bsM);ballShadow.rotation.x=-Math.PI/2;ballShadow.visible=false;scene.add(ballShadow);

    // ---- state ----
    const W_WHEEL=reduced?.25:1.25;         // wheel head rad/s, counter-clockwise from above (calm, about 12 s a turn)
    const LAUNCH=-Math.PI*.28;              // the croupier's side: right of the camera
    let phi=0,stage=0,owners=ownersAt(thePlan,0),anim=null,beat=null,boardDirty=true;
    const listeners=new Set();const emit=(type,data)=>{for(const fn of listeners){try{fn(type,data);}catch(_error){}}};
    function ballAtWorld(r,y,theta){ball.position.set(Math.cos(theta)*r,y,-Math.sin(theta)*r);}
    function shadowAt(r,ground,theta,h){ballShadow.visible=ball.visible;ballShadow.position.set(Math.cos(theta)*r,ground+.002,-Math.sin(theta)*r);const s=1+h*6;ballShadow.scale.set(s,s,s);bsM.opacity=Math.max(.15,.9-h*10);}
    function waitingBall(){
      if(stage>=DROPS){ball.visible=false;ballShadow.visible=false;return;}
      ball.visible=true;ball.scale.setScalar(1);ballAtWorld(D.TRACK_R,D.TRACK_Y+D.BR,LAUNCH+thePlan.drops[stage].launch);
      shadowAt(D.TRACK_R,D.TRACK_Y,LAUNCH+thePlan.drops[stage].launch,0);
    }
    // One drop, planned so it rests in its pocket. Orbit: the ball runs clockwise round the track and slows; a correction
    // spread over the whole orbit (never more than half a turn in about 6 turns) brings it down where the bounce must start.
    // Fall: it leaves the track and runs down the apron, hopping once on a deflector. Bounce: in the wheel's own frame it
    // hops across the frets ((1-s)^3, starting at the speed it fell with) and settles in the planned pocket.
    function planBeat(k){
      const dr=thePlan.drops[k],T1=dr.orbit,T2=T1+.75,T3=T2+dr.bounce;
      const w0=-11.5,w1=-5.2,w2=-4.2;                 // ball rad/s: launch, leaving the track, reaching the wheel
      const theta0=LAUNCH+dr.launch;
      const orbitTravel=(w0+w1)/2*T1,fallTravel=(w1+w2)/2*(T2-T1);
      const phiAt=t=>phi+W_WHEEL*t;
      const target=(dr.pocket+.5)*STEP;
      const rel=w2-W_WHEEL,Db=-rel*dr.bounce/3;      // the bounce travel (wheel frame) that starts at the fall's speed
      const wantEntry=phiAt(T2)+target+Db;            // world angle when the ball reaches the wheel
      const corr=wrapPi(wantEntry-(theta0+orbitTravel+fallTravel));
      return {k,dr,T1,T2,T3,w0,w1,w2,theta0,orbitTravel,target,Db,corr,t:0,phi0:phi,landed:false};
    }
    function stepBeat(b,dt){
      b.t+=dt;const t=b.t;
      if(t<b.T1){
        const s=t/b.T1,theta=b.theta0+(b.w0*t+(b.w1-b.w0)*t*s/2)+b.corr*smooth(s);
        const wob=.004*Math.sin(t*23)*(1-s);
        ballAtWorld(D.TRACK_R+wob,D.TRACK_Y+D.BR,theta);shadowAt(D.TRACK_R,D.TRACK_Y,theta,0);return;
      }
      if(t<b.T2){
        const u=(t-b.T1)/(b.T2-b.T1),tt=t-b.T1,theta=b.theta0+b.orbitTravel+b.corr+(b.w1*tt+(b.w2-b.w1)*tt*u/2);
        const r=D.TRACK_R+(D.APRON_IN-.03-D.TRACK_R)*(u*u*(1.4-.4*u));
        const ground=r>D.APRON_OUT?D.TRACK_Y:apronY(Math.max(D.APRON_IN,r));
        const hop=u>.42&&u<.82?.03*Math.sin(Math.PI*(u-.42)/.4):0;
        ballAtWorld(r,ground+D.BR+hop,theta);shadowAt(r,ground,theta,hop);return;
      }
      const s=Math.min(1,(t-b.T2)/(b.T3-b.T2)),phiNow=b.phi0+W_WHEEL*t;
      const alpha=b.target+b.Db*Math.pow(1-s,3);
      const r=D.REST_R+(D.APRON_IN-.03-D.REST_R)*Math.pow(1-s,2.2)+.012*Math.sin(s*19)*(1-s)*(1-s);
      const n=b.dr.hops,edges=[0,.2,.37,.5,.6,.67].slice(0,n+1),amps=[.055,.032,.016,.007,.003];
      let hop=0;for(let i=0;i<n;i++){const a0=edges[i],a1=edges[i+1];if(s>=a0&&s<a1){hop=amps[i]*Math.sin(Math.PI*(s-a0)/(a1-a0));break;}}
      const restY=D.POCKET_Y+D.BR,ground=restY-D.BR+(.03*(1-smooth(s*1.6)));
      ballAtWorld(r,restY+(.03*(1-smooth(s*1.6)))+hop,phiNow+alpha);shadowAt(r,ground,phiNow+alpha,hop);
      if(s>=1&&!b.landed){b.landed=true;emit("landed",{index:b.k,league:b.dr.league,pocket:b.dr.pocket,by:b.dr.by});}
    }
    // After the ball rests: a beat to read it, the section splits and joins its neighbours, the ball is lifted away.
    const HOLD=reduced?.35:.7,MERGE=reduced?.25:1.5,LIFT=reduced?.15:.45;
    function startMerge(k){const info=mergeInfo(owners,thePlan.drops[k].league);anim={...info,f:0,t:0,k};boardDirty=true;}
    function finishStage(k){owners=mergeOwners(owners,thePlan.drops[k].league);anim=null;stage=k+1;boardDirty=true;emit("merged",{index:k,stage,leagues:[...new Set(owners)]});
      if(stage>=DROPS)emit("done",{league:owners[0]});}

    let resolveDrop=null;
    function frame(dt){
      phi+=W_WHEEL*dt;head.rotation.y=phi;
      if(beat){
        if(reduced&&!beat.reducedDone){
          beat.t+=dt;const s=Math.min(1,beat.t/.3),a=(thePlan.drops[beat.k].pocket+.5)*STEP+phi;
          ball.visible=true;ball.scale.setScalar(.6+.4*s);ballAtWorld(D.REST_R,D.POCKET_Y+D.BR,a);shadowAt(D.REST_R,D.POCKET_Y,a,0);
          if(s>=1){beat.reducedDone=true;beat.landed=true;beat.after=0;emit("landed",{index:beat.k,league:thePlan.drops[beat.k].league,pocket:thePlan.drops[beat.k].pocket,by:thePlan.drops[beat.k].by});}
        }else if(!beat.landed)stepBeat(beat,dt);
        if(beat.landed){
          beat.after=(beat.after||0)+dt;
          const a=(thePlan.drops[beat.k].pocket+.5)*STEP+phi;
          if(beat.after<HOLD+MERGE){ballAtWorld(D.REST_R,D.POCKET_Y+D.BR,a);shadowAt(D.REST_R,D.POCKET_Y,a,0);}
          if(beat.after>=HOLD&&!anim&&stage===beat.k)startMerge(beat.k);
          if(anim){anim.f=smooth((beat.after-HOLD)/MERGE);boardDirty=true;}
          if(beat.after>=HOLD+MERGE){
            const l=Math.min(1,(beat.after-HOLD-MERGE)/LIFT);
            if(stage===beat.k)finishStage(beat.k);
            ball.scale.setScalar(Math.max(.001,1-l));ballAtWorld(D.REST_R,D.POCKET_Y+D.BR+l*.12,a);bsM.opacity=.6*(1-l);
            if(l>=1){const k=beat.k;beat=null;waitingBall();held(false);const r=resolveDrop;resolveDrop=null;if(r)r({index:k,stage});}
          }
        }
      }
      if(boardDirty){boardDirty=false;painter.paint(owners,anim);boardTex.needsUpdate=true;}
    }

    // ---- layout: the whole bowl in view, a little above centre, tilted like a player standing at the table ----
    let size={w:2,h:1},layoutKey="";
    function layout(){
      const w=Math.max(1,host.clientWidth||opts.size?.().w||1),h=Math.max(1,host.clientHeight||opts.size?.().h||1),k=`${w}x${h}`;
      if(k===layoutKey)return;layoutKey=k;size={w,h};
      renderer.setSize(w,h,false);cam.aspect=w/h;
      const tall=w/h<1,elev=(tall?64:54)*Math.PI/180,Rb=1.62,fill=tall?.97:.94;
      const tv=Math.tan(cam.fov*Math.PI/360),th=tv*cam.aspect;
      const dist=Math.max(Rb/(th*fill),(Rb*Math.sin(elev)+.35*Math.cos(elev))/(tv*fill));
      cam.position.set(0,Math.sin(elev)*dist,Math.cos(elev)*dist);cam.lookAt(0,-.02,0);cam.updateProjectionMatrix();
    }

    // ---- quality: the shared governor (held while a ball moves) ----
    const GFX=root.CareerModeGfxTier;
    const paint=()=>renderer.render(scene,cam);
    const gov=GFX&&typeof GFX.governor==="function"?GFX.governor(renderer,{key:GFX_KEY,draw:paint,beats:true,before:()=>GFX.softCut?.(canvas,paint),onChange:()=>{layoutKey="";layout();}}):null;
    const fps=GFX&&typeof GFX.overlay==="function"?GFX.overlay(()=>({calls:renderer.info.render.calls,tris:renderer.info.render.triangles,extra:`programs ${renderer.info.programs?renderer.info.programs.length:0}`})):null;
    let isHeld=false;function held(v){if(v!==isHeld){isHeld=v;gov?.hold(v);}}

    function clock(){return root.performance?.now?.()??Date.now();}
    let raf=0,last=clock(),disposed=false,dirty=true;
    const tick=now=>{
      raf=0;if(disposed)return;
      if(!canvas.isConnected){free();return;}
      const dt=Math.min(.05,Math.max(0,(now-last)/1000));last=now;
      if(d.visibilityState!=="hidden"&&host.clientWidth>0){gov?.frame(now);if(dirty){dirty=false;layout();}frame(dt);paint();}
      raf=root.requestAnimationFrame(tick);
    };
    const relayout=()=>{dirty=true;};
    const ro=typeof root.ResizeObserver==="function"?new root.ResizeObserver(relayout):null;
    function free(){
      if(disposed)return;disposed=true;if(raf)root.cancelAnimationFrame(raf);ro?.disconnect();root.removeEventListener?.("resize",relayout);
      gov?.end();fps?.stop();
      for(const v of own)try{v.dispose&&v.dispose();}catch(_error){}
      renderer.dispose();try{renderer.forceContextLoss();}catch(_error){}
      canvas.remove();listeners.clear();
    }
    if(lrPosition(host)==="static")host.style.position="relative";
    host.prepend(canvas);layout();waitingBall();
    ro?.observe(host);root.addEventListener?.("resize",relayout);

    const api={
      contractVersion:1,level:K.level,reduced,plan:thePlan,
      get stage(){return stage;},
      get busy(){return Boolean(beat);},
      // The wheel as it stands after `k` drops, at once (a reload, a late join, Reduce Motion catching up). Never replays.
      showStage(k){const n=Math.max(0,Math.min(DROPS,k|0));if(beat&&n>beat.k){const r=resolveDrop;resolveDrop=null;beat=null;held(false);if(r)r({index:n-1,stage:n});}
        if(n<stage&&beat)return stage;owners=ownersAt(thePlan,n);stage=n;anim=null;boardDirty=true;waitingBall();return stage;},
      // Drop ball k (the next one). Resolves once the ball has rested, its section has joined its neighbours and the
      // ball has been lifted away. A second call for the same ball returns the same promise (a double tap drops once).
      drop(k){
        if(k!==stage||k>=DROPS)return Promise.resolve({index:k,stage,skipped:true});
        if(beat&&beat.k===k)return beat.promise;
        beat=reduced?{k,t:0,landed:false}:planBeat(k);held(true);
        beat.promise=new Promise(resolve=>{resolveDrop=resolve;});emit("drop",{index:k,league:thePlan.drops[k].league,by:thePlan.drops[k].by});
        return beat.promise;
      },
      on(fn){listeners.add(fn);return ()=>listeners.delete(fn);},
      // Where the waiting ball, or the ball in play, is on screen (CSS px in the host).
      anchor(){const v=ball.position.clone().project(cam);return {x:(v.x*.5+.5)*size.w,y:(-v.y*.5+.5)*size.h,visible:ball.visible};},
      // Behind the loading screen: every shader compiled and every texture uploaded, then a few timed frames pick the level.
      async warm(){
        painter.paint(owners,null);boardTex.needsUpdate=true;boardDirty=false;
        const was=ball.visible;ball.visible=true;ballShadow.visible=true;
        try{if(typeof renderer.compileAsync==="function")await renderer.compileAsync(scene,cam);else renderer.compile(scene,cam);}catch(_error){}
        if(disposed)return;paint();ball.visible=was;ballShadow.visible=was;
        if(GFX&&typeof GFX.calibrate==="function"){try{await GFX.calibrate(renderer,paint,{frames:5});}catch(_error){}gov?.resize();}
        if(!disposed){dirty=true;layout();paint();}
      },
      // Test page and proofs: step the clock by hand (seconds), no frame loop needed.
      advance(seconds){let n=Math.round(seconds*60);while(n-->0)frame(1/60);layout();paint();},
      probe(){return {level:K.level,draws:renderer.info.render.calls,programs:renderer.info.programs?renderer.info.programs.length:0,triangles:renderer.info.render.triangles,
        pixelRatio:renderer.getPixelRatio(),frameMs:gov?gov.frameMs():null,stage,busy:Boolean(beat),leagues:[...new Set(owners)],board:K.board};},
      dispose:free,
      get alive(){return !disposed;}
    };
    raf=root.requestAnimationFrame(tick);
    return api;
  }
  function lrPosition(el){try{return root.getComputedStyle(el).position;}catch(_error){return "";}}

  // mount(host, opts): the roulette inside `host` (a positioned box), resolved once the marks and marble are decoded, every
  // shader compiled and the first frame drawn (the Reus Gate). null where it cannot run.
  // opts = {seed (string both phones share), winner (league id the shared draw gave), stage (drops already shown, 0..4),
  //         reducedMotion (default: the system setting), signal (AbortSignal), size () -> {w, h}}
  async function mount(host,opts){
    const o=opts||{},off=()=>Boolean(o.signal&&o.signal.aborted);
    if(!host||!WHEEL.includes(o.winner)||!lrHasWebgl()||off())return null;
    let opened=false;
    try{
      const thePlan=plan(String(o.seed||""),o.winner);
      const P=await lrQuality();if(off())return null;
      try{root.CareerModeGfxTier?.sceneOpening?.(GFX_KEY);}catch(_error){}
      const marks={};
      const [T,marble]=await Promise.all([lrLoadEngine(),lrImage(MARBLE_PATH),...WHEEL.map(async id=>{marks[id]=await lrImage(lrMarkSrc(id));}),
        root.document?.fonts?.load?root.document.fonts.load('700 40px "Instrument Sans Narrow"').catch(()=>null):null]);
      if(!T||off()||!host.isConnected)return null;
      const api=build(T,host,{...o,plan:thePlan},P,{marks,marble});
      if(o.stage)api.showStage(o.stage);
      await api.warm();
      if(off()){api.dispose();return null;}
      opened=true;mount.last=api;
      return api;
    }catch(error){
      try{root.console?.warn?.("League roulette 3D scene unavailable.",error);}catch(_error){}
      return null;
    }finally{if(!opened){try{root.CareerModeGfxTier?.sceneOpened?.();}catch(_error){}}}
  }
  function preload(){return lrLoadEngine().then(()=>true,()=>false);}

  const api={contractVersion:1,feature:"cms-league-roulette-3d",enginePath:ENGINE_PATH,wheel:WHEEL,looks:LEAGUE_LOOK,pockets:POCKETS,drops:DROPS,
    seedRng,startOwners,runsOf,mergeInfo,mergeOwners,plan,ownersAt,knobs,mount,preload};
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  root.CareerModeLeagueRoulette3d=api;
})(typeof globalThis!=="undefined"?globalThis:this);
