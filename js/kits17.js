(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeKits17=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  // r89 Kits 17 (Nik 2026-11-04: "the player wears the penalty taker's team's kit ... high fidelity ... for all 98 teams ... the same
  // kit can be used in Russian Roulette as well"). Every club's 2016-17 HOME kit as FIFA 17 shows it, and a keeper kit that never
  // clashes, painted in canvas at runtime (no image files, any size). Club crests come from getClubCrestSvg (js/visualIdentity.js):
  // our own drawings, never lettering. No sponsor words, no maker logos.
  //
  // UV layout ("wrap", the same as a LatheGeometry body): u runs around the body, front centre at u=0.5, back centre at u=0 and 1;
  // u rises toward the wearer's LEFT (viewed from the front the texture reads left to right). v=0 is the hem, v=1 the neck.
  // Sleeves: u around the arm (u=0.5 the front of the arm), v=0 cuff, v=1 shoulder. Shorts: one wrap around the hips, v=0 hem,
  // v=1 waistband. Socks: v=0 ankle, v=1 top. Normal map: one tileable knit (repeat it ~24 x 12 on the shirt).
  //
  // API: kit(club) -> data (shirt, shorts, socks, collar, dominant); keeperKit(club,vsClub) -> the keeper's kit;
  // textures(club,{role:"outfield"|"gk",vsClub,size:"full"|"phone"|"small",number,name}) -> {shirt,sleeveL,sleeveR,shorts,socks,
  // normal,material,ready}; await ready before uploading (the crest is an SVG image); drawFlat(ctx,club,x,y,s,opts) draws a
  // front-view (or back-view, opts.back) shirt for 2D boards; prepare(clubs) preloads crests for drawFlat.

  // [pattern, body, second colour, sleeves (null: the pattern runs over the sleeves), trim] (the KIT17 table from the roulette)
  // + [shorts, socks, sock top, collar]. Colour tokens: p body, s second, t trim, w white, k black, or a hex.
  const SHIRT={
    "Arsenal":["solid","#db0007",null,"#ffffff","#ffffff"], "Bournemouth":["stripes","#d71920","#141414","#141414","#141414"], "Burnley":["solid","#6c1d45",null,"#99d6ea","#99d6ea"],
    "Chelsea":["solid","#034694",null,null,"#ffffff"], "Crystal Palace":["stripes","#1b458f","#c4122e","#1b458f","#ffffff"], "Everton":["solid","#003399",null,null,"#ffffff"],
    "Hull City":["stripes","#f5a12d","#141414","#f5a12d","#141414"], "Leicester City":["solid","#003090",null,null,"#fdbe11"], "Liverpool":["solid","#c8102e",null,null,"#ffffff"],
    "Manchester City":["solid","#6cabdd",null,null,"#1c2c5b"], "Manchester United":["solid","#da291c",null,null,"#141414"], "Middlesbrough":["band","#e2001a","#ffffff",null,"#ffffff"],
    "Southampton":["stripes","#d71920","#ffffff","#d71920","#141414"], "Stoke City":["stripes","#e03a3e","#ffffff",null,"#ffffff"], "Sunderland":["stripes","#eb172b","#ffffff",null,"#141414"],
    "Swansea City":["solid","#ffffff",null,null,"#141414"], "Tottenham Hotspur":["solid","#ffffff",null,null,"#132257"], "Watford":["solid","#fbee23",null,null,"#141414"],
    "West Bromwich Albion":["stripes","#122f67","#ffffff","#122f67","#ffffff"], "West Ham United":["solid","#7a263a",null,"#4fb4e0","#4fb4e0"],
    "Alavés":["stripes","#0761af","#ffffff",null,"#0761af"], "Athletic Club":["stripes","#ee2523","#ffffff",null,"#141414"], "Atlético Madrid":["stripes","#cb3524","#ffffff",null,"#272e61"],
    "Barcelona":["stripes","#a50044","#004d98",null,"#edbb00"], "Celta Vigo":["solid","#8ac3ee",null,null,"#c8102e"], "Deportivo La Coruña":["stripes","#1a5aa8","#ffffff","#1a5aa8","#ffffff"],
    "Eibar":["stripes","#0c3b8c","#8a1538",null,"#ffffff"], "Espanyol":["stripes","#007fc8","#ffffff","#007fc8","#ffffff"], "Granada":["hoops","#c8102e","#ffffff",null,"#ffffff"],
    "Las Palmas":["solid","#ffe400",null,null,"#0060a8"], "Leganés":["stripes","#ffffff","#0049a0","#0049a0","#0049a0"], "Málaga":["stripes","#6cace4","#ffffff",null,"#1d3c6e"],
    "Osasuna":["solid","#d91a21",null,null,"#0a346f"], "Real Betis":["stripes","#00954c","#ffffff",null,"#ffffff"], "Real Madrid":["solid","#ffffff",null,null,"#3a2f6b"],
    "Real Sociedad":["stripes","#0067b1","#ffffff",null,"#ffffff"], "Sevilla":["solid","#ffffff",null,null,"#d8002f"], "Sporting Gijón":["stripes","#d9282f","#ffffff",null,"#141414"],
    "Valencia":["solid","#ffffff",null,null,"#141414"], "Villarreal":["solid","#ffe667",null,null,"#005187"],
    "Bayern Munich":["solid","#dc052d",null,null,"#ffffff"], "Borussia Dortmund":["solid","#fde100",null,null,"#141414"], "Bayer Leverkusen":["solid","#141414",null,null,"#e32221"],
    "Borussia Mönchengladbach":["hoops","#ffffff","#141414","#ffffff","#141414"], "Schalke 04":["solid","#004d9d",null,null,"#ffffff"], "Mainz 05":["solid","#c3141e",null,null,"#ffffff"],
    "Hertha BSC":["twin","#ffffff","#004d9e","#004d9e","#004d9e"], "Wolfsburg":["solid","#65b32e",null,null,"#ffffff"], "Hoffenheim":["solid","#1961b5",null,null,"#ffffff"],
    "Eintracht Frankfurt":["stripes","#141414","#ffffff","#141414","#e1000f"], "Werder Bremen":["hoops","#1d9053","#e9f5ee","#1d9053","#f18400"], "Hamburg":["solid","#ffffff",null,null,"#e2001a"],
    "FC Augsburg":["solid","#ffffff",null,null,"#ba3733"], "SC Freiburg":["solid","#e2001a",null,null,"#141414"], "RB Leipzig":["solid","#ffffff",null,null,"#dd0741"],
    "FC Ingolstadt":["solid","#c8102e",null,null,"#ffffff"], "Darmstadt 98":["solid","#004e9f",null,null,"#ffffff"], "1. FC Köln":["solid","#ffffff",null,null,"#ed1c24"],
    "Atalanta":["stripes","#1e71b8","#141414",null,"#141414"], "Bologna":["stripes","#a21c26","#1a2f48",null,"#ffffff"], "Cagliari":["halves","#a6192e","#002350",null,"#ffffff"],
    "Chievo":["solid","#ffe500",null,"#00427f","#00427f"], "Crotone":["stripes","#e2001a","#0b3c8c",null,"#ffffff"], "Empoli":["solid","#005bab",null,null,"#ffffff"],
    "Fiorentina":["solid","#5b2d8e",null,null,"#ffffff"], "Genoa":["halves","#b0102c","#001e43",null,"#ffffff"], "Inter Milan":["stripes","#0068a8","#141414",null,"#d7b536"],
    "Juventus":["stripes","#ffffff","#141414",null,"#141414"], "Lazio":["solid","#87d8f7",null,null,"#ffffff"], "Milan":["stripes","#fb090b","#141414",null,"#141414"],
    "Napoli":["solid","#12a0d7",null,null,"#ffffff"], "Palermo":["solid","#f5a9c8",null,null,"#141414"], "Pescara":["stripes","#ffffff","#3d8fd6",null,"#3d8fd6"],
    "Roma":["solid","#8e1f2f",null,null,"#f0bc42"], "Sampdoria":["band","#1b5497",["#ffffff","#d6001c","#141414","#ffffff"],null,"#ffffff"], "Sassuolo":["stripes","#00a752","#141414",null,"#141414"],
    "Torino":["solid","#881f19",null,null,"#ffffff"], "Udinese":["stripes","#ffffff","#141414",null,"#141414"],
    "Angers":["stripes","#ffffff","#141414",null,"#141414"], "Bastia":["solid","#00529f",null,null,"#ffffff"], "Bordeaux":["vee","#001c50","#ffffff",null,"#ffffff"],
    "Caen":["stripes","#0b4ea2","#da291c",null,"#ffffff"], "Dijon":["solid","#d7172f",null,null,"#ffffff"], "Guingamp":["halves","#c8102e","#141414",null,"#ffffff"],
    "Lille":["solid","#e01e13",null,null,"#20325f"], "Lorient":["solid","#f58113",null,null,"#141414"], "Lyon":["solid","#ffffff",null,null,"#da291c"],
    "Marseille":["solid","#ffffff",null,null,"#2faee0"], "Metz":["solid","#7a1b2c",null,null,"#ffffff"], "Monaco":["diag","#e51b24","#ffffff",null,"#ffffff"],
    "Montpellier":["solid","#00214e",null,null,"#f37021"], "Nancy":["stripes","#e2001a","#ffffff","#e2001a","#ffffff"], "Nantes":["solid","#fce300",null,null,"#00733d"],
    "Nice":["stripes","#e3001b","#141414",null,"#141414"], "Paris Saint-Germain":["centre","#0d1b45","#e30613",null,"#ffffff"], "Rennes":["solid","#e30613",null,null,"#141414"],
    "Saint-Étienne":["solid","#009a44",null,null,"#ffffff"], "Toulouse":["solid","#4b2a85",null,null,"#ffffff"] };

  // [shorts, socks, sock top, collar ("crew" | "vee" | "polo")]: the 2016-17 home shorts and socks as best known; any club can be
  // corrected here alone.
  const LOWER={
    "Arsenal":["w","w","p","crew"], "Bournemouth":["k","k","p","vee"], "Burnley":["w","p","#99d6ea","crew"], "Chelsea":["p","w","p","crew"],
    "Crystal Palace":["p","p","s","crew"], "Everton":["w","w","p","crew"], "Hull City":["k","p","k","vee"], "Leicester City":["p","p","t","crew"],
    "Liverpool":["p","p","w","crew"], "Manchester City":["w","p","t","crew"], "Manchester United":["w","k","p","vee"], "Middlesbrough":["w","p","w","crew"],
    "Southampton":["k","w","p","crew"], "Stoke City":["w","w","p","crew"], "Sunderland":["k","p","w","crew"], "Swansea City":["w","w","k","polo"],
    "Tottenham Hotspur":["t","w","t","crew"], "Watford":["k","p","k","crew"], "West Bromwich Albion":["w","w","p","crew"], "West Ham United":["w","w","p","crew"],
    "Alavés":["p","p","w","crew"], "Athletic Club":["k","k","p","crew"], "Atlético Madrid":["t","p","t","vee"], "Barcelona":["s","s","p","vee"],
    "Celta Vigo":["w","w","p","crew"], "Deportivo La Coruña":["p","p","w","crew"], "Eibar":["p","p","s","crew"], "Espanyol":["p","p","w","crew"],
    "Granada":["#1c3f94","w","p","crew"], "Las Palmas":["t","t","p","crew"], "Leganés":["s","s","w","crew"], "Málaga":["t","w","t","crew"],
    "Osasuna":["t","t","p","crew"], "Real Betis":["w","p","w","crew"], "Real Madrid":["w","w","t","crew"], "Real Sociedad":["w","p","w","polo"],
    "Sevilla":["w","w","t","crew"], "Sporting Gijón":["#1c3f94","p","w","crew"], "Valencia":["k","w","k","crew"], "Villarreal":["p","p","t","crew"],
    "Bayern Munich":["p","p","w","crew"], "Borussia Dortmund":["k","p","k","crew"], "Bayer Leverkusen":["k","k","t","crew"], "Borussia Mönchengladbach":["w","w","k","vee"],
    "Schalke 04":["w","p","w","crew"], "Mainz 05":["w","p","w","crew"], "Hertha BSC":["s","w","s","crew"], "Wolfsburg":["w","p","w","crew"],
    "Hoffenheim":["p","p","w","crew"], "Eintracht Frankfurt":["k","k","t","crew"], "Werder Bremen":["w","p","w","crew"], "Hamburg":["t","w","t","crew"],
    "FC Augsburg":["w","w","t","crew"], "SC Freiburg":["k","p","k","crew"], "RB Leipzig":["w","t","w","crew"], "FC Ingolstadt":["k","p","k","crew"],
    "Darmstadt 98":["w","p","w","crew"], "1. FC Köln":["w","t","w","crew"],
    "Atalanta":["k","k","p","crew"], "Bologna":["w","s","p","crew"], "Cagliari":["s","s","p","crew"], "Chievo":["s","s","p","crew"],
    "Crotone":["s","p","s","crew"], "Empoli":["w","p","w","crew"], "Fiorentina":["w","p","w","vee"], "Genoa":["s","s","p","crew"],
    "Inter Milan":["k","k","p","crew"], "Juventus":["w","w","k","polo"], "Lazio":["w","w","p","crew"], "Milan":["w","k","p","crew"],
    "Napoli":["w","p","w","crew"], "Palermo":["k","p","k","crew"], "Pescara":["w","w","s","crew"], "Roma":["w","p","t","crew"],
    "Sampdoria":["w","p","w","crew"], "Sassuolo":["k","p","k","crew"], "Torino":["w","p","w","crew"], "Udinese":["w","w","k","crew"],
    "Angers":["k","k","w","crew"], "Bastia":["w","p","w","crew"], "Bordeaux":["p","p","w","crew"], "Caen":["p","p","s","crew"],
    "Dijon":["p","p","w","crew"], "Guingamp":["k","p","k","crew"], "Lille":["t","p","t","crew"], "Lorient":["k","p","k","crew"],
    "Lyon":["w","w","t","crew"], "Marseille":["w","w","t","vee"], "Metz":["p","p","w","crew"], "Monaco":["w","w","p","crew"],
    "Montpellier":["p","p","t","crew"], "Nancy":["w","p","w","crew"], "Nantes":["p","p","t","crew"], "Nice":["k","k","p","crew"],
    "Paris Saint-Germain":["p","p","s","crew"], "Rennes":["k","p","k","crew"], "Saint-Étienne":["w","p","w","crew"], "Toulouse":["w","p","w","crew"] };

  // Keeper colours to choose from (FIFA 17-era keeper shades); the pick is the one furthest (CIE76 in Lab) from every colour on
  // both outfield kits, so it never clashes with his team-mates or the taker.
  const GK_SHADES=[["#c6f432","#7da11a"],["#ff7a1a","#b3500c"],["#ff4fa3","#b3286d"],["#7b2fd0","#4a1a82"],["#18b8a6","#0e746a"],
    ["#ffd60a","#b39400"],["#1b1b1f","#3a3a42"],["#8c96a3","#5b636d"],["#3cc4ff","#1a7fb3"],["#16a34a","#0c6a2f"],["#f5f0e6","#b9b2a4"]];

  const FALLBACK=["solid","#8a8f98",null,null,"#ffffff"];
  const hex=(h)=>{const n=parseInt(String(h).slice(1),16);return [n>>16&255,n>>8&255,n&255];};
  const toHex=(c)=>"#"+c.map(x=>Math.max(0,Math.min(255,Math.round(x))).toString(16).padStart(2,"0")).join("");
  const mix=(a,b,t)=>{const x=hex(a),y=hex(b);return toHex(x.map((v,i)=>v+(y[i]-v)*t));};
  const shade=(a,t)=>t<0?mix(a,"#000000",-t):mix(a,"#ffffff",t);
  const lum=(h)=>{const c=hex(h).map(v=>{v/=255;return v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4);});return .2126*c[0]+.7152*c[1]+.0722*c[2];};
  function lab(h){
    const c=hex(h).map(v=>{v/=255;return v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4);});
    const X=(c[0]*.4124+c[1]*.3576+c[2]*.1805)/.95047,Y=c[0]*.2126+c[1]*.7152+c[2]*.0722,Z=(c[0]*.0193+c[1]*.1192+c[2]*.9505)/1.08883;
    const f=(t)=>t>.008856?Math.cbrt(t):7.787*t+16/116;
    return [116*f(Y)-16,500*(f(X)-f(Y)),200*(f(Y)-f(Z))];
  }
  const deltaE=(a,b)=>{const x=lab(a),y=lab(b);return Math.hypot(x[0]-y[0],x[1]-y[1],x[2]-y[2]);};

  const cache=new Map();
  function kit(club){
    const name=String(club&&club.club||club||"");
    if(cache.has(name))return cache.get(name);
    const k=SHIRT[name]||FALLBACK,l=LOWER[name]||["w","p","t","crew"];
    const second=Array.isArray(k[2])?k[2]:(k[2]?[k[2]]:[]);
    const tok=(t)=>t==="p"?k[1]:t==="s"?(second[0]||k[4]):t==="t"?k[4]:t==="w"?"#f4f4f2":t==="k"?"#141414":t;
    // dominant: the colour a crowd and a grade should follow (the body, unless a stripe pattern is mostly the second colour).
    const dominant=(k[0]==="stripes"||k[0]==="halves")&&second[0]&&lum(k[1])>.8?second[0]:k[1];
    const out=Object.freeze({club:name,known:Boolean(SHIRT[name]),pattern:k[0],body:k[1],second:Object.freeze(second),sleeves:k[3],trim:k[4],
      shorts:tok(l[0]),socks:tok(l[1]),sockTop:tok(l[2]),collar:l[3],dominant,role:"outfield"});
    cache.set(name,out);return out;
  }
  function kitColours(k){return [k.body].concat(k.second,k.sleeves?[k.sleeves]:[],[k.shorts,k.socks]);}
  function keeperKit(club,vsClub){
    const own=kit(club),avoid=kitColours(own).concat(vsClub?kitColours(kit(vsClub)):[]);
    // Every shade at least 45 away from all those colours is safe; among the safe ones the club's own hash picks, so keepers vary
    // from club to club but stay the same for a club and opponent. With none safe, the furthest wins.
    const scored=GK_SHADES.map(g=>[g,Math.min(...avoid.map(c=>deltaE(g[0],c)))]);
    const safe=scored.filter(x=>x[1]>=45);
    let best,bestScore;
    if(safe.length){const pick=safe[hashOf(own.club)%safe.length];best=pick[0];bestScore=pick[1];}
    else {scored.sort((a,b)=>b[1]-a[1]);best=scored[0][0];bestScore=scored[0][1];}
    const trim=lum(best[0])>.45?"#141414":"#f4f4f2";
    return Object.freeze({club:own.club,known:own.known,pattern:"gk",body:best[0],second:Object.freeze([best[1]]),sleeves:null,trim,
      shorts:best[0],socks:best[0],sockTop:best[1],collar:"crew",dominant:best[0],role:"gk",clearance:Math.round(bestScore)});
  }

  // ---------- painting (browser only) ----------
  const SIZES={full:{shirt:[2048,1024],sleeve:[1024,512],shorts:[1024,512],socks:[512,512],normal:512},
    phone:{shirt:[1024,512],sleeve:[512,256],shorts:[512,256],socks:[256,256],normal:256},
    small:{shirt:[512,256],sleeve:[256,128],shorts:[256,128],socks:[128,128],normal:128}};
  function canvas(w,h){
    if(typeof OffscreenCanvas!=="undefined"&&!(root.document))return new OffscreenCanvas(w,h);
    const c=root.document.createElement("canvas");c.width=w;c.height=h;return c;
  }
  function kitRandom(seed){let s=seed>>>0||1;return ()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return (s>>>0)/4294967296;};}
  const hashOf=(t)=>{let h=2166136261;for(const ch of String(t)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;};

  // A tiny knit tile, painted once, laid over every albedo at low strength so a flat colour reads as cloth in close-up.
  let knitTile=null;
  function knit(){
    if(knitTile)return knitTile;
    const c=canvas(64,64),g=c.getContext("2d"),img=g.createImageData(64,64),d=img.data,rnd=kitRandom(17);
    for(let y=0;y<64;y++)for(let x=0;x<64;x++){
      const cx=(x%8)-3.5,cy=(y%8)-3.5,row=(Math.floor(y/8)%2)*4,cx2=((x+row)%8)-3.5;
      const hole=Math.hypot(cx2,cy)<1.6?1:0,rib=Math.abs(cx)<.6?.4:0,n=(rnd()-.5)*.6;
      const v=Math.round(128+(-hole*70+rib*20+n*30)),i=(y*64+x)*4;d[i]=d[i+1]=d[i+2]=Math.max(0,Math.min(255,v));d[i+3]=255;
    }
    g.putImageData(img,0,0);knitTile=c;return c;
  }
  function overlayKnit(g,w,h,strength,scale){
    const pat=g.createPattern(knit(),"repeat");if(!pat)return;
    if(pat.setTransform&&typeof DOMMatrix!=="undefined")pat.setTransform(new DOMMatrix().scale(scale,scale));
    g.save();g.globalCompositeOperation="overlay";g.globalAlpha=strength;g.fillStyle=pat;g.fillRect(0,0,w,h);g.restore();
  }

  // The shirt body pattern in wrap space. x(u) and y(v) map [0,1] onto the canvas, v up.
  function paintPattern(g,W,H,k,side){
    const X=(u)=>u*W,Y=(v)=>(1-v)*H,s0=k.second[0]||k.trim;
    g.fillStyle=k.body;g.fillRect(0,0,W,H);
    g.fillStyle=s0;
    if(k.pattern==="stripes"){const w=1/14;for(let i=-8;i<=8;i++){if(Math.abs(i)%2===1)g.fillRect(X(.5+i*w-w/2),0,X(w)+1,H);}}
    else if(k.pattern==="twin"){for(const c of [.5,0,1])for(const d of [-.075,.075])g.fillRect(X(c+d-.0225),0,X(.045),H);}
    else if(k.pattern==="hoops"){const n=9,hh=H/n;for(let i=0;i<n;i++)if(i%2===1)g.fillRect(0,H-(i+1)*hh,W,hh+1);}
    else if(k.pattern==="halves"){g.fillRect(X(.5),0,X(.5),H);}
    else if(k.pattern==="band"){const bs=k.second.length?k.second:[s0],h=bs.length>1?.05:.14,top=.74;bs.forEach((c,i)=>{g.fillStyle=c;g.fillRect(0,Y(top-i*h),W,X(0)+h*H+1);});}
    else if(k.pattern==="centre"){for(const c of [.5,0,1]){g.fillStyle=k.trim;g.fillRect(X(c-.055),0,X(.11),H);g.fillStyle=s0;g.fillRect(X(c-.04),0,X(.08),H);}}
    else if(k.pattern==="diag"){
      // Monaco: red above, white below a diagonal that rises from the viewer's left hip to the right shoulder, mirrored on the back.
      g.beginPath();g.moveTo(X(0),Y(.95));for(const [u,v] of [[.25,.05],[.75,.95],[1,.5]])g.lineTo(X(u),Y(v));
      g.lineTo(X(1),Y(0)+1);g.lineTo(X(0),Y(0)+1);g.closePath();g.fill();
      g.beginPath();g.moveTo(X(0),Y(.5));g.lineTo(X(.25),Y(.05));g.lineTo(X(0),Y(.05));g.closePath();g.fill();
    }
    else if(k.pattern==="vee"){
      // Bordeaux's white scapular: a V on the chest and the same V across the back.
      g.lineWidth=H*.085;g.strokeStyle=s0;g.lineJoin="miter";
      for(const c of [.5,0,1]){g.beginPath();g.moveTo(X(c-.24),Y(1.04));g.lineTo(X(c),Y(.5));g.lineTo(X(c+.24),Y(1.04));g.stroke();}
    }
    else if(k.pattern==="gk"){
      // Keeper: a tonal gradient from the shoulders and fine tonal chevrons, the FIFA 17-era keeper look.
      const gr=g.createLinearGradient(0,0,0,H);gr.addColorStop(0,s0);gr.addColorStop(.45,k.body);gr.addColorStop(1,k.body);g.fillStyle=gr;g.fillRect(0,0,W,H);
      g.globalAlpha=.12;g.strokeStyle=s0;g.lineWidth=H*.012;
      for(let i=0;i<22;i++){const v=.08+i*.04;for(const c of [.5,0,1]){g.beginPath();g.moveTo(X(c-.25),Y(v+.05));g.lineTo(X(c),Y(v));g.lineTo(X(c+.25),Y(v+.05));g.stroke();}}
      g.globalAlpha=1;
    }
  }
  function sleeveColour(k,side){
    if(k.sleeves)return k.sleeves;
    if(k.pattern==="halves")return side==="L"?(k.second[0]||k.trim):k.body;
    if(k.pattern==="diag")return side==="L"?k.body:(k.second[0]||k.trim);
    return null;
  }

  function seams(g,W,H){
    // Side panels and seams under the arms (u .25 and .75), a stitched hem, all tonal so they work on any colour.
    g.save();
    for(const c of [.25,.75]){
      const gr=g.createLinearGradient((c-.05)*W,0,(c+.05)*W,0);gr.addColorStop(0,"rgba(0,0,0,0)");gr.addColorStop(.5,"rgba(0,0,0,.09)");gr.addColorStop(1,"rgba(0,0,0,0)");
      g.fillStyle=gr;g.fillRect((c-.05)*W,0,.1*W,H);
      g.strokeStyle="rgba(0,0,0,.22)";g.lineWidth=Math.max(1,W/1024);g.setLineDash([W/400,W/600]);g.beginPath();g.moveTo(c*W,0);g.lineTo(c*W,H);g.stroke();
    }
    g.setLineDash([W/400,W/600]);g.strokeStyle="rgba(0,0,0,.25)";g.beginPath();g.moveTo(0,H*.975);g.lineTo(W,H*.975);g.stroke();
    g.setLineDash([]);g.fillStyle="rgba(0,0,0,.08)";g.fillRect(0,H*.96,W,H*.04);
    g.restore();
  }
  function collar(g,W,H,k){
    const t=k.trim,band=H*.035;
    g.fillStyle=t;g.fillRect(0,0,W,band);
    g.fillStyle=shade(t,lum(t)>.5?-.25:.25);g.fillRect(0,band*.62,W,band*.14);
    if(k.collar==="vee"){
      // The V: trim edges down to the chest, the body showing inside.
      g.fillStyle=t;g.beginPath();g.moveTo(W*.43,0);g.lineTo(W*.5,H*.16);g.lineTo(W*.57,0);g.closePath();g.fill();
      g.fillStyle=k.pattern==="stripes"?k.body:shade(k.body,-.35);g.beginPath();g.moveTo(W*.447,0);g.lineTo(W*.5,H*.13);g.lineTo(W*.553,0);g.closePath();g.fill();
    } else if(k.collar==="polo"){
      g.fillStyle=t;g.fillRect(W*.485,0,W*.03,H*.14);
      g.fillStyle=shade(t,-.3);for(const y of [.05,.1])g.fillRect(W*.497,H*y,W*.006,H*.012);
      g.fillStyle=t;g.beginPath();g.moveTo(W*.36,0);g.lineTo(W*.47,H*.09);g.lineTo(W*.5,0);g.lineTo(W*.53,H*.09);g.lineTo(W*.64,0);g.closePath();g.fill();
    } else {
      g.fillStyle=t;g.beginPath();g.ellipse(W*.5,0,W*.05,H*.06,0,0,Math.PI);g.fill();
      g.fillStyle=shade(k.body,-.4);g.beginPath();g.ellipse(W*.5,0,W*.043,H*.045,0,0,Math.PI);g.fill();
    }
  }
  function backPrint(g,W,H,k,number,name){
    // Number and surname on the back (back centre is u=0 and u=1, so each is drawn at both edges and the seam meets in the middle).
    const solidBack=k.pattern==="solid"||k.pattern==="gk";
    // Striped and hooped backs carry a plain panel in the body colour behind the name and number, as the real shirts do.
    const panel=!solidBack;
    const ratio=(a,b)=>{const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
    const plain=ratio("#141414",k.body)>=ratio("#f4f4f2",k.body)?"#141414":"#f4f4f2";
    const ink=solidBack&&ratio(k.trim,k.body)>=4?k.trim:plain;
    if(panel){g.fillStyle=k.body;for(const cx of [0,W]){g.beginPath();const pw=W*.13,top=H*.13,bot=H*.7,r=W*.012;
      g.moveTo(cx-pw+r,top);g.lineTo(cx+pw-r,top);g.quadraticCurveTo(cx+pw,top,cx+pw,top+r);g.lineTo(cx+pw,bot-r);g.quadraticCurveTo(cx+pw,bot,cx+pw-r,bot);
      g.lineTo(cx-pw+r,bot);g.quadraticCurveTo(cx-pw,bot,cx-pw,bot-r);g.lineTo(cx-pw,top+r);g.quadraticCurveTo(cx-pw,top,cx-pw+r,top);g.fill();}}
    const edge=lum(ink)>.5?"rgba(0,0,0,.55)":"rgba(255,255,255,.35)";
    const font=(px)=>`800 ${px}px 'Barlow Condensed', 'Arial Narrow', sans-serif`;
    for(const cx of [0,W]){
      g.textAlign="center";g.textBaseline="middle";g.lineJoin="round";
      if(name){
        let px=Math.round(H*.07);g.font=font(px);const label=String(name).toUpperCase();
        while(px>H*.035&&g.measureText(label).width>W*.18){px--;g.font=font(px);}
        g.lineWidth=px*.12;g.strokeStyle=edge;g.strokeText(label,cx,H*.2);g.fillStyle=ink;g.fillText(label,cx,H*.2);
      }
      if(number!=null&&number!==""){
        const px=Math.round(H*.38);g.font=font(px);
        g.lineWidth=px*.07;g.strokeStyle=edge;g.strokeText(String(number),cx,H*.47);g.fillStyle=ink;g.fillText(String(number),cx,H*.47);
      }
    }
  }
  function crestImage(club){
    const fn=root.getClubCrestSvg;
    if(typeof fn!=="function"||typeof Image==="undefined")return Promise.resolve(null);
    let svg;try{svg=fn(club);}catch(e){return Promise.resolve(null);}
    if(!svg)return Promise.resolve(null);
    if(!/xmlns=/.test(svg))svg=svg.replace("<svg","<svg xmlns=\"http://www.w3.org/2000/svg\"");
    return new Promise(res=>{const im=new Image();im.onload=()=>res(im);im.onerror=()=>res(null);im.src="data:image/svg+xml;charset=utf-8,"+encodeURIComponent(svg);});
  }
  const crestCache=new Map();
  const crestFor=(club)=>{if(!crestCache.has(club))crestCache.set(club,crestImage(club).then(im=>{crestCache.set(club,Promise.resolve(im));crestCache.ready=crestCache.ready||new Map();crestCache.ready.set(club,im);return im;}));return crestCache.get(club);};
  const crestNow=(club)=>crestCache.ready&&crestCache.ready.get(club)||null;
  function drawCrest(g,im,x,y,s,k){
    if(im){g.drawImage(im,x-s/2,y-s/2,s,s);return;}
    // No crest drawer on this page: a plain shield in the trim, never lettering.
    g.fillStyle=k.trim;g.beginPath();g.moveTo(x-s*.36,y-s*.42);g.lineTo(x+s*.36,y-s*.42);g.lineTo(x+s*.36,y);g.quadraticCurveTo(x+s*.3,y+s*.36,x,y+s*.46);g.quadraticCurveTo(x-s*.3,y+s*.36,x-s*.36,y);g.closePath();g.fill();
    g.fillStyle=k.body;g.beginPath();g.arc(x,y-s*.02,s*.15,0,Math.PI*2);g.fill();
  }

  function paintShirt(c,k,im,opts){
    const W=c.width,H=c.height,g=c.getContext("2d");
    paintPattern(g,W,H,k);
    seams(g,W,H);collar(g,W,H,k);
    if(k.role!=="gk"&&opts.badge!==false)drawCrest(g,im,W*.575,H*.25,H*.15,k);
    if(k.role==="gk"&&opts.badge!==false)drawCrest(g,im,W*.575,H*.25,H*.13,k);
    if(opts.number!=null||opts.name)backPrint(g,W,H,k,opts.number,opts.name);
    overlayKnit(g,W,H,.22,Math.max(1,W/1024));
  }
  function paintSleeve(c,k,side){
    const W=c.width,H=c.height,g=c.getContext("2d"),col=sleeveColour(k,side);
    if(col){g.fillStyle=col;g.fillRect(0,0,W,H);}
    else if(k.pattern==="stripes"){g.fillStyle=k.body;g.fillRect(0,0,W,H);g.fillStyle=k.second[0];const w=1/6;for(let i=-4;i<=4;i++)if(Math.abs(i)%2===1)g.fillRect((.5+i*w-w/2)*W,0,w*W+1,H);}
    else if(k.pattern==="hoops"){g.fillStyle=k.body;g.fillRect(0,0,W,H);g.fillStyle=k.second[0];const n=4,hh=H/n;for(let i=0;i<n;i++)if(i%2===1)g.fillRect(0,H-(i+1)*hh,W,hh+1);}
    else if(k.pattern==="gk"){const gr=g.createLinearGradient(0,0,0,H);gr.addColorStop(0,k.second[0]);gr.addColorStop(1,k.body);g.fillStyle=gr;g.fillRect(0,0,W,H);}
    else {g.fillStyle=k.body;g.fillRect(0,0,W,H);}
    // Cuff in the trim with a tonal rib, and a seam along the underside of the arm (u=0).
    g.fillStyle=k.trim;g.fillRect(0,H*.9,W,H*.1);g.fillStyle=shade(k.trim,lum(k.trim)>.5?-.2:.2);g.fillRect(0,H*.93,W,H*.012);
    g.strokeStyle="rgba(0,0,0,.22)";g.lineWidth=Math.max(1,W/512);g.setLineDash([W/200,W/300]);g.beginPath();g.moveTo(1,0);g.lineTo(1,H);g.moveTo(W-1,0);g.lineTo(W-1,H);g.stroke();g.setLineDash([]);
    overlayKnit(g,W,H,.22,Math.max(1,W/512));
  }
  function paintShorts(c,k,im){
    const W=c.width,H=c.height,g=c.getContext("2d");
    g.fillStyle=k.shorts;g.fillRect(0,0,W,H);
    const accent=deltaE(k.shorts,k.trim)>20?k.trim:(deltaE(k.shorts,k.body)>20?k.body:shade(k.shorts,lum(k.shorts)>.5?-.3:.3));
    g.fillStyle=accent;for(const c0 of [.25,.75])g.fillRect((c0-.012)*W,H*.12,W*.024,H*.88);
    g.fillStyle=shade(k.shorts,-.12);g.fillRect(0,0,W,H*.12);
    g.strokeStyle="rgba(0,0,0,.25)";g.lineWidth=Math.max(1,W/512);g.setLineDash([W/200,W/300]);g.beginPath();g.moveTo(0,H*.12);g.lineTo(W,H*.12);g.moveTo(0,H*.95);g.lineTo(W,H*.95);g.stroke();g.setLineDash([]);
    if(k.role!=="gk")drawCrest(g,im,W*.6,H*.72,H*.16,k);
    overlayKnit(g,W,H,.18,Math.max(1,W/512));
  }
  function paintSocks(c,k){
    const W=c.width,H=c.height,g=c.getContext("2d");
    g.fillStyle=k.socks;g.fillRect(0,0,W,H);
    const top=deltaE(k.sockTop,k.socks)>12?k.sockTop:shade(k.socks,lum(k.socks)>.5?-.3:.3);
    g.fillStyle=top;g.fillRect(0,H*.08,W,H*.07);g.fillRect(0,H*.19,W,H*.025);
    g.fillStyle=shade(k.socks,-.1);g.fillRect(0,0,W,H*.05);
    // Ribbing from the top band down: fine vertical tonal lines.
    g.fillStyle="rgba(0,0,0,.07)";for(let x=0;x<W;x+=Math.max(2,W/96))g.fillRect(x,0,Math.max(1,W/256),H*.3);
    overlayKnit(g,W,H,.2,Math.max(1,W/256));
  }
  const normalCache=new Map();
  function normalMap(n){
    if(normalCache.has(n))return normalCache.get(n);
    // Height: a polyester mesh (offset rows of small holes over vertical ribs); normals by central differences, tileable.
    const c=canvas(n,n),g=c.getContext("2d"),img=g.createImageData(n,n),d=img.data,cell=n/32,hgt=new Float32Array(n*n);
    for(let y=0;y<n;y++)for(let x=0;x<n;x++){
      const row=Math.floor(y/cell)%2,cx=((x+row*cell/2)%cell)/cell-.5,cy=(y%cell)/cell-.5;
      hgt[y*n+x]=Math.max(0,1-Math.hypot(cx,cy)*3.2)*-1+Math.cos((x/cell)*Math.PI*2)*.25;
    }
    const at=(x,y)=>hgt[((y+n)%n)*n+((x+n)%n)];
    for(let y=0;y<n;y++)for(let x=0;x<n;x++){
      const dx=(at(x+1,y)-at(x-1,y))*1.2,dy=(at(x,y+1)-at(x,y-1))*1.2,l=Math.hypot(dx,dy,1),i=(y*n+x)*4;
      d[i]=(-dx/l*.5+.5)*255;d[i+1]=(dy/l*.5+.5)*255;d[i+2]=(1/l*.5+.5)*255;d[i+3]=255;
    }
    g.putImageData(img,0,0);normalCache.set(n,c);return c;
  }

  function textures(club,opts){
    opts=opts||{};
    const size=SIZES[opts.size]||SIZES.full,name=String(club&&club.club||club||"");
    const k=opts.role==="gk"?keeperKit(name,opts.vsClub):kit(name);
    const out={kit:k,shirt:canvas(...size.shirt),sleeveL:canvas(...size.sleeve),sleeveR:canvas(...size.sleeve),shorts:canvas(...size.shorts),socks:canvas(...size.socks),
      normal:normalMap(size.normal),normalRepeat:[24,12],
      material:{roughness:k.role==="gk"?.7:.62,metalness:0,sheen:.5,sheenRoughness:.5,normalScale:.35}};
    const paint=(im)=>{paintShirt(out.shirt,k,im,opts);paintSleeve(out.sleeveL,k,"L");paintSleeve(out.sleeveR,k,"R");paintShorts(out.shorts,k,im);paintSocks(out.socks,k);};
    const now=crestNow(name);
    if(now||typeof root.getClubCrestSvg!=="function"){paint(now);out.ready=Promise.resolve(out);}
    else {paint(null);out.ready=crestFor(name).then(im=>{if(im)paint(im);return out;});}
    return out;
  }

  // ---------- flat views for 2D boards ----------
  const flatCache=new Map();
  function prepareCrests(clubs){return Promise.all([].concat(clubs||[]).map(c=>crestFor(String(c&&c.club||c))));}
  function drawFlat(ctx,club,x,y,s,opts){
    // A front (or back) view of the shirt from the same painted textures: body from the wrap's front (or back) half, sleeves from
    // the sleeve wraps, then cloth shading. s is the shirt's height in px; (x,y) its centre.
    opts=opts||{};const name=String(club&&club.club||club||""),role=opts.role==="gk"?"gk":"outfield";
    const key=name+"|"+role+"|"+(opts.vsClub||"")+"|"+(opts.number||"")+"|"+(opts.name||"")+"|"+Boolean(crestNow(name));
    let t=flatCache.get(key);if(!t){t=textures(name,{role,vsClub:opts.vsClub,size:s>160?"phone":"small",number:opts.number,name:opts.name});flatCache.set(key,t);}
    ctx.save();ctx.translate(x,y);ctx.scale(s,s);
    const body=new Path2D();body.moveTo(-.2,-.5);body.quadraticCurveTo(0,-.42,.2,-.5);body.lineTo(.46,-.42);body.lineTo(.41,0);body.lineTo(.39,.5);body.quadraticCurveTo(0,.55,-.39,.5);body.lineTo(-.41,0);body.lineTo(-.46,-.42);body.closePath();
    const sleeve=(sx)=>{const p=new Path2D();p.moveTo(sx*.44,-.43);p.lineTo(sx*.7,-.1);p.lineTo(sx*.47,.02);p.lineTo(sx*.38,-.22);p.closePath();return p;};
    const S=t.shirt,SW=S.width,SH=S.height,back=Boolean(opts.back);
    // Sleeves: viewed from the front, the wearer's right arm is on the viewer's left.
    for(const [sx,tex] of [[-1,back?t.sleeveL:t.sleeveR],[1,back?t.sleeveR:t.sleeveL]]){
      const p=sleeve(sx);ctx.save();ctx.clip(p);ctx.drawImage(tex,tex.width*.25,0,tex.width*.5,tex.height,sx<0?-.72:.36,-.46,.36,.5);ctx.restore();
      ctx.lineWidth=.03;ctx.strokeStyle="rgba(0,0,0,.55)";ctx.stroke(p);
    }
    ctx.save();ctx.clip(body);
    if(back){ctx.drawImage(S,SW*.75,0,SW*.25,SH,-.5,-.52,.5,1.08);ctx.drawImage(S,0,0,SW*.25,SH,0,-.52,.5,1.08);}
    else ctx.drawImage(S,SW*.25,0,SW*.5,SH,-.5,-.52,1,1.08);
    const gx=ctx.createLinearGradient(-.5,0,.5,0);gx.addColorStop(0,"rgba(0,0,0,.34)");gx.addColorStop(.3,"rgba(255,255,255,.1)");gx.addColorStop(.55,"rgba(255,255,255,.02)");gx.addColorStop(1,"rgba(0,0,0,.38)");
    ctx.fillStyle=gx;ctx.fillRect(-.6,-.6,1.2,1.2);
    const gy=ctx.createLinearGradient(0,-.5,0,.55);gy.addColorStop(0,"rgba(255,255,255,.12)");gy.addColorStop(1,"rgba(0,0,0,.24)");ctx.fillStyle=gy;ctx.fillRect(-.6,-.6,1.2,1.2);
    ctx.strokeStyle="rgba(0,0,0,.12)";ctx.lineWidth=.022;ctx.beginPath();ctx.moveTo(-.3,-.28);ctx.quadraticCurveTo(-.25,.1,-.31,.46);ctx.moveTo(.3,-.28);ctx.quadraticCurveTo(.25,.1,.31,.46);ctx.moveTo(-.12,.2);ctx.quadraticCurveTo(0,.26,.14,.18);ctx.stroke();
    ctx.restore();
    ctx.lineWidth=.03;ctx.strokeStyle="rgba(0,0,0,.6)";ctx.stroke(body);
    ctx.restore();
    return t.ready;
  }

  return Object.freeze({version:"r89-kits17-1",clubs:Object.freeze(Object.keys(SHIRT)),kit,keeperKit,textures,drawFlat,prepare:prepareCrests,deltaE,
    layout:Object.freeze({uv:"wrap",frontU:.5,backU:0,leftOfWearer:"u rises",vHem:0,vNeck:1,crestU:.575,crestV:.75})});
});
