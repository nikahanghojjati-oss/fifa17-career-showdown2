(function(root){
  "use strict";

  // r89 Chamber Men in real 3D (Nik 2026-11-03: "Chamber men needs most important"). A three.js r187 scene drawn in place of
  // the marble goal art of js/chamberMenStep.js (cmsGoal): a gold-framed goal with a real net, a faceless polished-gold
  // statue keeper who dives LEFT, MIDDLE or RIGHT, and a stitched ball, under a CC0 Poly Haven light (the roulette's
  // ENV_LOUNGE_V1.exr) in a dark marble hall.
  //
  // The step stays the one owner of the game: it still builds the SVG goal, keeps its classes and poses, and calls
  // scene.reset() and scene.kick() next to its own drawing. The SVG stays in the page on top of the canvas with its art
  // hidden (.cmGoal.cm3d-on), so its gold border and the LEFT / MIDDLE / RIGHT words stay; the words are moved over the
  // three zones of the 3D goal. No WebGL2, a load fault or a slow load: mount() gives null and the SVG goal plays as before.
  //
  // Loads the shared engine (visual-assets/v10_1/roulette/vendor/three-r187.min.js) with its plain path, the one the
  // service worker keeps for offline play and the roulette's own page asks for. Draws only while the canvas is in the page;
  // when the step removes its stage, the scene frees its WebGL context for the roulette that comes next.
  const ENGINE_PATH="visual-assets/v10_1/roulette/vendor/three-r187.min.js";
  const ENV_PATH="visual-assets/v10_1/roulette/assets/ENV_LOUNGE_V1.exr";
  const MARBLE_PATH="css/r78-marble-tile.webp";
  // Goal and pitch in metres (a real goal: 7.32 x 2.44). The goal line is z 0, the camera looks from the penalty spot side (+z).
  const GOAL_W=7.32,GOAL_H=2.44,POST_R=.062,HALF=GOAL_W/2,BALL_R=.11,SPOT_Z=11,KEEPER_Z=.32;
  const ZONE=Object.freeze({L:-2.45,M:0,R:2.45});
  const FLIGHT=.46,SETTLE=2.0,GRAVITY=-9.8;
  let enginePromise=null;

  function doc(){return root.document||null;}
  function reducedMotion(){try{return Boolean(root.matchMedia&&root.matchMedia("(prefers-reduced-motion: reduce)").matches);}catch(_error){return false;}}
  function hasWebgl2(){
    try{
      if(!root.WebGL2RenderingContext)return false;
      const c=doc().createElement("canvas"),gl=c.getContext("webgl2");
      if(!gl)return false;
      gl.getExtension("WEBGL_lose_context")?.loseContext();
      return true;
    }catch(_error){return false;}
  }
  function loadEngine(){
    const ready=()=>root.THREE&&typeof root.THREE.WebGLRenderer==="function"&&typeof root.THREE.CapsuleGeometry==="function";
    if(ready())return Promise.resolve(root.THREE);
    if(enginePromise)return enginePromise;
    enginePromise=new Promise((resolve,reject)=>{
      const script=doc().createElement("script");
      script.src=ENGINE_PATH;script.async=true;script.dataset.runtimeScript="three-r187";
      script.addEventListener("load",()=>ready()?resolve(root.THREE):reject(new Error("three-r187 loaded without THREE")));
      script.addEventListener("error",()=>{script.remove();enginePromise=null;reject(new Error("three-r187 did not load"));});
      doc().head.append(script);
    });
    return enginePromise;
  }
  const ease={
    outCubic:t=>1-Math.pow(1-t,3),
    inOut:t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2,
    outBack:t=>{const c=1.4;return 1+(c+1)*Math.pow(t-1,3)+c*Math.pow(t-1,2);}
  };
  const clamp01=t=>t<0?0:t>1?1:t;

  // ---------- textures drawn in code (nothing to download) ----------
  function canvasOf(w,h){const c=doc().createElement("canvas");c.width=w;c.height=h;return c;}
  function seeded(seed){let s=seed>>>0;return ()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};}
  function turfTexture(T,maxAniso){
    const c=canvasOf(512,512),g=c.getContext("2d"),rnd=seeded(17);
    // Mown bands across the pitch, the way a stadium groundsman cuts it.
    for(let i=0;i<8;i+=1){g.fillStyle=i%2?"#0e3a16":"#13471d";g.fillRect(0,i*64,512,64);}
    const img=g.getImageData(0,0,512,512),d=img.data;
    for(let i=0;i<d.length;i+=4){const n=(rnd()-.5)*26,blade=rnd()<.06?18:0;d[i]+=n*.5;d[i+1]+=n+blade;d[i+2]+=n*.4;}
    g.putImageData(img,0,0);
    const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=maxAniso;return t;
  }
  function netTexture(T,maxAniso){
    // One diamond mesh cell, tiled: knotted cord on a clear ground.
    const c=canvasOf(128,128),g=c.getContext("2d");
    g.clearRect(0,0,128,128);g.strokeStyle="rgba(244,238,224,1)";g.lineWidth=9;g.lineCap="round";
    g.beginPath();g.moveTo(-8,-8);g.lineTo(136,136);g.moveTo(136,-8);g.lineTo(-8,136);g.stroke();
    g.fillStyle="rgba(255,250,236,1)";for(const [x,y] of [[0,0],[128,0],[0,128],[128,128],[64,64]]){g.beginPath();g.arc(x,y,7,0,Math.PI*2);g.fill();}
    const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=maxAniso;return t;
  }
  // The keeper's jersey: black with a faint gold pinstripe and a gold yoke across the chest (the lathe's v runs up the body).
  function kitTexture(T,maxAniso){
    const c=canvasOf(256,256),g=c.getContext("2d"),rnd=seeded(5);
    g.fillStyle="#0c0c0d";g.fillRect(0,0,256,256);
    const img=g.getImageData(0,0,256,256),d=img.data;for(let i=0;i<d.length;i+=4){const n=(rnd()-.5)*9;d[i]+=n;d[i+1]+=n;d[i+2]+=n;}g.putImageData(img,0,0);
    g.fillStyle="rgba(212,160,23,.28)";for(let x=0;x<256;x+=16)g.fillRect(x,40,1.4,216);
    const band=(v,h,a)=>{g.fillStyle=`rgba(242,196,91,${a})`;g.fillRect(0,(1-v)*256-h/2,256,h);};
    band(.735,7,1);band(.69,2.4,.9);band(.25,3,.85);
    const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.anisotropy=maxAniso;return t;
  }
  // The light boards behind the goal: black with fine gold light lines and diamonds, never a word or a logo.
  function ledTexture(T,maxAniso){
    const c=canvasOf(512,64),g=c.getContext("2d");
    g.fillStyle="#000";g.fillRect(0,0,512,64);
    g.fillStyle="#7a5a1c";g.fillRect(0,6,512,2);g.fillRect(0,56,512,2);
    g.strokeStyle="#f2c45b";g.lineWidth=2.2;
    for(let x=0;x<512;x+=64){g.beginPath();g.moveTo(x+32,16);g.lineTo(x+46,32);g.lineTo(x+32,48);g.lineTo(x+18,32);g.closePath();g.stroke();}
    g.fillStyle="#ffe7a8";for(let x=0;x<512;x+=64)g.fillRect(x+31,31,3,3);
    g.fillStyle="#b8861f";for(let x=0;x<512;x+=8)g.fillRect(x,30,3,1.5);
    const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.wrapS=T.RepeatWrapping;t.anisotropy=maxAniso;return t;
  }
  // The classic 32-panel ball: 12 black pentagons on the icosahedron's corners, white hexagons, dark seams between panels.
  function ballTexture(T,maxAniso){
    const W=512,H=256,c=canvasOf(W,H),g=c.getContext("2d"),img=g.createImageData(W,H),d=img.data;
    const p=(1+Math.sqrt(5))/2,ico=[[0,1,p],[0,-1,p],[0,1,-p],[0,-1,-p],[1,p,0],[-1,p,0],[1,-p,0],[-1,-p,0],[p,0,1],[-p,0,1],[p,0,-1],[-p,0,-1]].map(n);
    function n(v){const l=Math.hypot(v[0],v[1],v[2]);return [v[0]/l,v[1]/l,v[2]/l];}
    // The 20 hexagon centres sit on the icosahedron's faces.
    const faces=[];for(let a=0;a<12;a+=1)for(let b=a+1;b<12;b+=1)for(let k=b+1;k<12;k+=1){
      const dot=(u,v)=>u[0]*v[0]+u[1]*v[1]+u[2]*v[2];
      if(dot(ico[a],ico[b])>.4&&dot(ico[a],ico[k])>.4&&dot(ico[b],ico[k])>.4)faces.push(n([ico[a][0]+ico[b][0]+ico[k][0],ico[a][1]+ico[b][1]+ico[k][1],ico[a][2]+ico[b][2]+ico[k][2]]));
    }
    const centres=ico.map(v=>({v,pent:true})).concat(faces.map(v=>({v,pent:false})));
    // A pentagon is slightly smaller than a hexagon in angle; weight it so the Voronoi edges land on the real seams.
    for(let y=0;y<H;y+=1){
      const th=(y+.5)/H*Math.PI,st=Math.sin(th),ct=Math.cos(th);
      for(let x=0;x<W;x+=1){
        const ph=(x+.5)/W*Math.PI*2,v=[-Math.cos(ph)*st,ct,Math.sin(ph)*st];
        let best=-9,second=-9,bestPent=false;
        for(const c0 of centres){const s=(c0.v[0]*v[0]+c0.v[1]*v[1]+c0.v[2]*v[2])+(c0.pent?-.035:0);if(s>best){second=best;best=s;bestPent=c0.pent;}else if(s>second)second=s;}
        const edge=best-second,seam=edge<.012?1-edge/.012:0,i=(y*W+x)*4;
        const base=bestPent?[22,20,18]:[246,242,232];
        const shade=1-seam*.78;
        d[i]=base[0]*shade+(bestPent?0:-6*seam);d[i+1]=base[1]*shade;d[i+2]=base[2]*shade;d[i+3]=255;
      }
    }
    g.putImageData(img,0,0);
    const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.anisotropy=maxAniso;return t;
  }

  // ---------- the scene ----------
  function netSheet(T,a,b,c,d,nu,nv,cellM){
    // A bilinear patch: a (top left), b (top right), c (bottom right), d (bottom left). uv in mesh cells.
    const pos=[],uv=[],idx=[];const lerp=(p,q,t)=>[p[0]+(q[0]-p[0])*t,p[1]+(q[1]-p[1])*t,p[2]+(q[2]-p[2])*t];
    const wTop=Math.hypot(b[0]-a[0],b[1]-a[1],b[2]-a[2]),hLeft=Math.hypot(d[0]-a[0],d[1]-a[1],d[2]-a[2]);
    for(let j=0;j<=nv;j+=1)for(let i=0;i<=nu;i+=1){
      const u=i/nu,v=j/nv,top=lerp(a,b,u),bottom=lerp(d,c,u),p=lerp(top,bottom,v);
      pos.push(p[0],p[1],p[2]);uv.push(u*wTop/cellM,(1-v)*hLeft/cellM);
    }
    for(let j=0;j<nv;j+=1)for(let i=0;i<nu;i+=1){const k=j*(nu+1)+i;idx.push(k,k+nu+1,k+1,k+1,k+nu+1,k+nu+2);}
    const geo=new T.BufferGeometry();
    geo.setAttribute("position",new T.Float32BufferAttribute(pos,3));geo.setAttribute("uv",new T.Float32BufferAttribute(uv,2));
    geo.setIndex(idx);geo.computeVertexNormals();
    // The cords: diamonds across each pair of rows (both diagonals of every cell), on the same moving points.
    const cords=[];for(let j=0;j<nv;j+=1)for(let i=0;i<nu;i+=1){const k=j*(nu+1)+i;cords.push(k,k+nu+2,k+1,k+nu+1);}
    const lines=new T.BufferGeometry();lines.setAttribute("position",geo.attributes.position);lines.setIndex(cords);
    geo.userData.cords=lines;
    return geo;
  }

  // The keeper: a real goalkeeper's build (1.88 m) in a black-and-gold kit, ivory gloves, black boots with gold soles.
  // No face is drawn (a smooth head under short dark hair), so no real person is shown. Joints: root (at the hips) > spine >
  // head; shoulders > elbows > hands; hips > knees > feet.
  function buildKeeper(T,M){
    const root=new T.Group(),spine=new T.Group(),head=new T.Group();
    const add=(parent,geo,mat,x,y,z)=>{const m=new T.Mesh(geo,mat);m.position.set(x||0,y||0,z||0);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;};
    // A limb: a tapered tube with round ends, hanging down from its joint.
    const seg=(len,r0,r1,mat)=>{const pivot=new T.Group();add(pivot,new T.CylinderGeometry(r0,r1,len,20,1,true),mat,0,-len/2);add(pivot,new T.SphereGeometry(r0,20,12),mat);add(pivot,new T.SphereGeometry(r1,20,12),mat,0,-len);return pivot;};
    const v2=pts=>pts.map(([x,y])=>new T.Vector2(x,y));
    root.add(spine);
    // Jersey (the lathe's v runs up the body; the kit texture puts the gold yoke across the chest), shorts, collar, neck.
    const torso=add(spine,new T.LatheGeometry(v2([[.001,-.03],[.15,-.02],[.146,.06],[.14,.16],[.152,.26],[.178,.36],[.205,.44],[.212,.48],[.192,.52],[.13,.555],[.07,.57],[.001,.575]]),32),M.kit);torso.scale.set(1,1,.6);
    const shorts=add(root,new T.LatheGeometry(v2([[.001,-.13],[.16,-.13],[.178,-.06],[.18,.02],[.165,.08],[.001,.08]]),28),M.plain);shorts.scale.set(1,1,.72);
    const collar=add(spine,new T.TorusGeometry(.064,.012,8,28),M.trim,0,.566);collar.rotation.x=Math.PI/2;
    add(spine,new T.CylinderGeometry(.052,.058,.12,18),M.skin,0,.62);
    for(const s of [-1,1])add(spine,new T.SphereGeometry(.078,20,14),M.kit,s*.198,.465).scale.set(1,.9,.85);
    // Head: skull, jaw, ears, short hair. Smooth: no features.
    head.position.y=.74;spine.add(head);
    add(head,new T.SphereGeometry(.104,30,22),M.skin).scale.set(.9,1.06,1);
    add(head,new T.SphereGeometry(.072,24,16),M.skin,0,-.058,.022).scale.set(1.02,.82,1);
    for(const s of [-1,1])add(head,new T.SphereGeometry(.022,12,10),M.skin,s*.092,-.005,0).scale.set(.45,1,.75);
    const hair=add(head,new T.SphereGeometry(.11,30,16,0,Math.PI*2,0,Math.PI*.5),M.hair,0,.008,-.008);hair.scale.set(.93,1.08,1.04);hair.rotation.x=-.32;
    // Arms: sleeves to the wrist with gold cuffs; big ivory gloves with a gold strap.
    const arm=side=>{
      const sh=seg(.29,.058,.047,M.kit);sh.position.set(side*.205,.47,0);spine.add(sh);
      const el=seg(.27,.046,.038,M.kit);el.position.y=-.29;sh.add(el);
      const cuff=add(el,new T.TorusGeometry(.04,.009,8,20),M.trim,0,-.245);cuff.rotation.x=Math.PI/2;
      const hand=new T.Group();hand.position.y=-.3;el.add(hand);
      add(hand,new T.SphereGeometry(.082,24,16),M.glove,0,-.03,0).scale.set(.95,1.3,.52);
      add(hand,new T.CylinderGeometry(.05,.054,.045,20),M.trim,0,.045);
      const thumb=add(hand,new T.CapsuleGeometry(.019,.05,4,10),M.glove,-side*.07,-.005,.02);thumb.rotation.z=side*.6;
      return {sh,el,hand};
    };
    // Legs: bare knees between the shorts and black socks with a gold band; black boots on gold soles.
    const leg=side=>{
      const hip=seg(.44,.085,.058,M.skin);hip.position.set(side*.095,-.04,0);root.add(hip);
      add(hip,new T.CylinderGeometry(.098,.11,.2,22,1,true),M.plain,0,-.08);
      const kn=seg(.42,.06,.04,M.plain);kn.position.y=-.44;hip.add(kn);
      const band=add(kn,new T.TorusGeometry(.06,.01,8,22),M.trim,0,-.06);band.rotation.x=Math.PI/2;
      const foot=new T.Group();foot.position.y=-.43;kn.add(foot);
      const boot=add(foot,new T.CapsuleGeometry(.046,.15,5,14),M.boot,0,0,.05);boot.rotation.x=Math.PI/2;
      add(foot,new T.BoxGeometry(.09,.018,.27),M.trim,0,-.042,.05);
      return {hip,kn};
    };
    const L=arm(-1),R=arm(1),LL=leg(-1),RL=leg(1);
    return {root,spine,head,shL:L.sh,elL:L.el,handL:L.hand,shR:R.sh,elR:R.el,handR:R.hand,hipL:LL.hip,knL:LL.kn,hipR:RL.hip,knR:RL.kn};
  }
  // Poses: root {x, y (hip height), rz (whole body roll)}; joint angles in radians.
  const POSES={
    ready:{x:0,y:.83,rz:0,sp:.26,hd:-.2,shLx:-.62,shLz:-.55,elLz:-.4,shRx:-.62,shRz:.55,elRz:.4,hipLx:-.62,hipLz:-.2,knLx:1.05,hipRx:-.62,hipRz:.2,knRx:1.05},
    // MIDDLE: he stays big and takes it into his chest, both hands behind the ball.
    M:{x:0,y:1.02,rz:0,sp:.12,hd:-.05,shLx:-1.05,shLz:-.32,elLz:.25,elLx:-1.0,shRx:-1.05,shRz:.32,elRz:-.25,elRx:-1.0,hipLx:-.35,hipLz:-.14,knLx:.55,hipRx:-.35,hipRz:.14,knRx:.55},
    L:{x:-1.38,y:1,rz:1.38,sp:.05,hd:.1,shLx:-.1,shLz:-2.95,elLz:-.05,shRx:-.3,shRz:2.55,elRz:.3,hipLx:-.12,hipLz:-.1,knLx:.3,hipRx:.2,hipRz:.28,knRx:.6},
    R:{x:1.38,y:1,rz:-1.38,sp:.05,hd:.1,shLx:-.3,shLz:-2.55,elLz:-.3,shRx:-.1,shRz:2.95,elRz:.05,hipLx:.2,hipLz:-.28,knLx:.6,hipRx:-.12,hipRz:.1,knRx:.3}
  };
  // After the dive the keeper comes down: on the turf for a side dive, back on his feet for a middle jump.
  const LANDED={L:{...POSES.L,x:-1.6,y:.19,rz:1.52},R:{...POSES.R,x:1.6,y:.19,rz:-1.52},M:{...POSES.M,y:.9,sp:.2,hipLx:-.55,knLx:.95,hipRx:-.55,knRx:.95}};
  for(const p of Object.values(POSES)){p.elLx=p.elLx||0;p.elRx=p.elRx||0;}
  function mix(a,b,t){const out={};for(const k of Object.keys(a))out[k]=a[k]+((b[k]||0)-a[k])*t;return out;}
  function applyPose(k,p){
    k.root.position.set(p.x,p.y,KEEPER_Z);k.root.rotation.set(0,0,p.rz);
    k.spine.rotation.x=p.sp;k.head.rotation.x=p.hd;
    k.shL.rotation.set(p.shLx,0,p.shLz);k.elL.rotation.set(p.elLx||0,0,p.elLz);k.shR.rotation.set(p.shRx,0,p.shRz);k.elR.rotation.set(p.elRx||0,0,p.elRz);
    k.hipL.rotation.set(p.hipLx,0,p.hipLz);k.knL.rotation.x=p.knLx;k.hipR.rotation.set(p.hipRx,0,p.hipRz);k.knR.rotation.x=p.knRx;
  }

  function build(T,svg,env,marbleImage){
    const d=doc(),canvas=d.createElement("canvas");
    canvas.className="cmGoal3d";canvas.setAttribute("aria-hidden","true");
    const renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:"high-performance"});
    const phone=Math.min(root.screen?.width||1e4,root.screen?.height||1e4)<700;
    renderer.setPixelRatio(Math.min(root.devicePixelRatio||1,phone?2:2.25));
    renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
    renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;
    const aniso=Math.min(8,renderer.capabilities.getMaxAnisotropy());
    const scene=new T.Scene();scene.background=new T.Color(0x060504);scene.fog=new T.FogExp2(0x060504,.022);
    const own=[];const keep=x=>{own.push(x);return x;};
    // Light: a night stadium in black and gold. One warm floodlight from high over the penalty spot (soft shadows), a cool
    // rim from behind the goal, a low fill, and the CC0 hall for reflections on the gold and the gloss of the kit.
    const pm=new T.PMREMGenerator(renderer);
    if(env){scene.environment=keep(pm.fromEquirectangular(env).texture);env.dispose();}
    pm.dispose();
    scene.environmentIntensity=.45;
    scene.add(new T.HemisphereLight(0xfff1d6,0x0c100a,.28));
    const key=new T.SpotLight(0xffe6bf,620,48,.46,.62,2);key.position.set(2.6,13,9.5);key.target.position.set(0,.9,.6);
    key.castShadow=true;key.shadow.mapSize.set(phone?1024:2048,phone?1024:2048);key.shadow.radius=3;key.shadow.bias=-.0003;key.shadow.normalBias=.025;
    key.shadow.camera.near=6;key.shadow.camera.far=30;
    scene.add(key,key.target);
    const wash=new T.DirectionalLight(0xffdcae,.55);wash.position.set(-6,9,12);scene.add(wash);
    const rim=new T.DirectionalLight(0xbcd0ff,1.7);rim.position.set(-3,5,-10);scene.add(rim);
    const rim2=new T.DirectionalLight(0xffd28a,1.1);rim2.position.set(5,3,-8);scene.add(rim2);
    // Materials.
    const goldFrame=keep(new T.MeshPhysicalMaterial({color:new T.Color(1,.77,.36),metalness:1,roughness:.17,clearcoat:.5,clearcoatRoughness:.08}));
    const darkGold=keep(new T.MeshStandardMaterial({color:new T.Color(.36,.25,.09),metalness:1,roughness:.38}));
    const kitMap=keep(kitTexture(T,aniso));
    const M={
      kit:keep(new T.MeshPhysicalMaterial({map:kitMap,roughness:.6,metalness:0,sheen:.9,sheenRoughness:.34,sheenColor:new T.Color(.42,.3,.1)})),
      plain:keep(new T.MeshPhysicalMaterial({color:new T.Color(.016,.015,.017),roughness:.66,sheen:.7,sheenRoughness:.4,sheenColor:new T.Color(.32,.23,.08)})),
      trim:goldFrame,
      skin:keep(new T.MeshPhysicalMaterial({color:new T.Color(.43,.25,.155),roughness:.52,sheen:.25,sheenRoughness:.5,sheenColor:new T.Color(.6,.36,.24)})),
      hair:keep(new T.MeshStandardMaterial({color:new T.Color(.018,.012,.008),roughness:.78})),
      glove:keep(new T.MeshPhysicalMaterial({color:new T.Color(.9,.84,.68),roughness:.5,clearcoat:.25,clearcoatRoughness:.4})),
      boot:keep(new T.MeshPhysicalMaterial({color:new T.Color(.012,.012,.013),roughness:.28,clearcoat:.9,clearcoatRoughness:.12}))
    };
    const turfMap=keep(turfTexture(T,aniso));turfMap.repeat.set(1,4.5);
    // Grass is a poor mirror: little specular, so the low camera does not see a grey sheen across the pitch.
    const turf=keep(new T.MeshPhysicalMaterial({map:turfMap,roughness:1,metalness:0,specularIntensity:.18,envMapIntensity:.3,sheen:.5,sheenRoughness:.6,sheenColor:new T.Color(.05,.16,.05)}));
    const chalk=keep(new T.MeshStandardMaterial({color:new T.Color(.8,.78,.72),roughness:.85}));
    const netMap=keep(netTexture(T,aniso));
    void netMap;
    // Cords drawn as fine lines (crisp on a phone at any distance), plus a faint veil so the net has body against the dark.
    const cord=keep(new T.LineBasicMaterial({color:new T.Color(.86,.82,.72),transparent:true,opacity:.62,fog:true}));
    const net=keep(new T.MeshBasicMaterial({color:new T.Color(.9,.85,.72),transparent:true,opacity:.035,side:T.DoubleSide,depthWrite:false}));
    let marbleMap=null;
    if(marbleImage){marbleMap=keep(new T.Texture(marbleImage));marbleMap.colorSpace=T.SRGBColorSpace;marbleMap.wrapS=marbleMap.wrapT=T.RepeatWrapping;marbleMap.anisotropy=aniso;marbleMap.repeat.set(10,3);marbleMap.needsUpdate=true;}
    const marble=keep(new T.MeshPhysicalMaterial({color:new T.Color(1,1,1),map:marbleMap,roughness:.36,metalness:0,clearcoat:.55,clearcoatRoughness:.16,envMapIntensity:.5}));
    const marbleDark=keep(new T.MeshStandardMaterial({color:new T.Color(.55,.52,.5),map:marbleMap,roughness:.42,envMapIntensity:.4}));
    const ledMap=keep(ledTexture(T,aniso));ledMap.repeat.set(6,1);
    const led=keep(new T.MeshStandardMaterial({color:new T.Color(.01,.01,.01),roughness:.35,emissive:new T.Color(1,.72,.3),emissiveMap:ledMap,emissiveIntensity:1.25}));
    const geo=g=>keep(g);
    const mesh=(g,m,shadow)=>{const x=new T.Mesh(geo(g),m);if(m===net){x.castShadow=false;x.receiveShadow=false;if(g.userData.cords){keep(g.userData.cords);x.add(new T.LineSegments(g.userData.cords,cord));}}else if(shadow!==false){x.castShadow=true;x.receiveShadow=true;}scene.add(x);return x;};

    // Pitch: turf from behind the goal to past the spot, chalk lines on it, black marble beyond.
    const pitch=mesh(new T.PlaneGeometry(30,28),turf);pitch.rotation.x=-Math.PI/2;pitch.position.set(0,0,11);pitch.castShadow=false;
    const floor=mesh(new T.PlaneGeometry(60,40),marbleDark);floor.rotation.x=-Math.PI/2;floor.position.set(0,-.01,0);floor.castShadow=false;
    const line=(w,dz,x,z)=>{const m=mesh(new T.PlaneGeometry(w,dz),chalk,false);m.rotation.x=-Math.PI/2;m.position.set(x,.004,z);m.receiveShadow=true;return m;};
    line(30,.12,0,.06);// goal line
    line(.12,5.5,-9.16,2.75);line(.12,5.5,9.16,2.75);line(18.44,.12,0,5.5);// goal area
    const spot=mesh(new T.CircleGeometry(.11,24),chalk,false);spot.rotation.x=-Math.PI/2;spot.position.set(0,.005,SPOT_Z);spot.receiveShadow=true;
    // Behind the goal: a band of gold light boards (no words), then a black marble wall with gold-capped pilasters.
    mesh(new T.BoxGeometry(32,.86,.12),led,false).position.set(0,.46,-3.4);
    mesh(new T.BoxGeometry(32,.05,.16),goldFrame,false).position.set(0,.91,-3.4);
    const wall=mesh(new T.PlaneGeometry(52,14),marble);wall.position.set(0,7,-7.5);wall.castShadow=false;
    for(let i=-5;i<=5;i+=1){const px=i*4.4;
      mesh(new T.BoxGeometry(.56,6.4,.34),marbleDark).position.set(px,3.2,-7.3);
      mesh(new T.BoxGeometry(.7,.16,.44),goldFrame).position.set(px,6.46,-7.26);
      mesh(new T.BoxGeometry(.7,.12,.44),goldFrame).position.set(px,.06,-7.26);
    }
    mesh(new T.BoxGeometry(52,.12,.38),goldFrame).position.set(0,6.6,-7.32);

    // The goal: round gold posts and bar, rounded corners, dark-gold back stanchions and ground bars.
    const post=x=>mesh(new T.CylinderGeometry(POST_R,POST_R,GOAL_H,32),goldFrame).position.set(x,GOAL_H/2,0);
    post(-HALF);post(HALF);
    const bar=mesh(new T.CylinderGeometry(POST_R,POST_R,GOAL_W,40),goldFrame);bar.rotation.z=Math.PI/2;bar.position.set(0,GOAL_H,0);
    for(const x of [-HALF,HALF]){mesh(new T.SphereGeometry(POST_R,24,16),goldFrame).position.set(x,GOAL_H,0);mesh(new T.CylinderGeometry(POST_R*1.5,POST_R*1.7,.04,24),darkGold).position.set(x,.02,0);}
    const BACK_TOP=[2.2,-1.3],BACK_BOT=-2.0;
    for(const x of [-HALF,HALF]){
      const s=new T.CatmullRomCurve3([new T.Vector3(x,GOAL_H-.02,-.05),new T.Vector3(x,BACK_TOP[0]+.08,BACK_TOP[1]*.55),new T.Vector3(x,BACK_TOP[0],BACK_TOP[1]),new T.Vector3(x,BACK_TOP[0]*.55,(BACK_TOP[1]+BACK_BOT)/2-.08),new T.Vector3(x,.03,BACK_BOT)]);
      mesh(new T.TubeGeometry(s,40,.022,10,false),darkGold);
      const g=mesh(new T.CylinderGeometry(.02,.02,-BACK_BOT,10),darkGold);g.rotation.x=Math.PI/2;g.position.set(x,.02,BACK_BOT/2);
    }
    const backBar=mesh(new T.CylinderGeometry(.02,.02,GOAL_W,12),darkGold);backBar.rotation.z=Math.PI/2;backBar.position.set(0,.02,BACK_BOT);
    // Net: roof, back and the two sides, with a little sag. The back sheet moves: it takes the ball on a goal.
    const CELL=.15;// a real goal net's mesh is about 12-15 cm
    const sag=(g,amount)=>{const a=g.attributes.position.array,uv=g.attributes.uv.array,n=a.length/3;let umax=0,vmax=0;for(let i=0;i<n;i+=1){umax=Math.max(umax,uv[i*2]);vmax=Math.max(vmax,uv[i*2+1]);}
      for(let i=0;i<n;i+=1){const u=uv[i*2]/umax,v=uv[i*2+1]/vmax;a[i*3+1]-=amount*Math.sin(Math.PI*u)*Math.sin(Math.PI*v);}g.computeVertexNormals();return g;};
    const back=mesh(netSheet(T,[-HALF,BACK_TOP[0],BACK_TOP[1]],[HALF,BACK_TOP[0],BACK_TOP[1]],[HALF,0,BACK_BOT],[-HALF,0,BACK_BOT],48,16,CELL),net);
    const backBase=Float32Array.from(back.geometry.attributes.position.array);back.geometry.attributes.position.setUsage(T.DynamicDrawUsage);
    mesh(sag(netSheet(T,[-HALF,GOAL_H,0],[HALF,GOAL_H,0],[HALF,BACK_TOP[0],BACK_TOP[1]],[-HALF,BACK_TOP[0],BACK_TOP[1]],48,9,CELL),.14),net);
    for(const x of [-HALF,HALF])mesh(netSheet(T,[x,GOAL_H,0],[x,BACK_TOP[0],BACK_TOP[1]],[x,0,BACK_BOT],[x,0,0],12,16,CELL),net);

    // The keeper and the ball.
    const keeper=buildKeeper(T,M);scene.add(keeper.root);
    const ballMap=keep(ballTexture(T,aniso));
    const ball=mesh(new T.SphereGeometry(BALL_R,40,28),keep(new T.MeshPhysicalMaterial({map:ballMap,roughness:.38,clearcoat:.6,clearcoatRoughness:.25})));

    // Where the gloves end each dive, for the ball to meet them on a save.
    const gloveAt={};
    for(const side of ["L","M","R"]){applyPose(keeper,POSES[side]);keeper.root.updateMatrixWorld(true);const h=side==="R"?keeper.handR:keeper.handL;const v=new T.Vector3();h.getWorldPosition(v);gloveAt[side]=v;}
    {applyPose(keeper,POSES.M);keeper.root.updateMatrixWorld(true);const a=new T.Vector3(),b=new T.Vector3();keeper.handL.getWorldPosition(a);keeper.handR.getWorldPosition(b);gloveAt.M=a.add(b).multiplyScalar(.5);}
    applyPose(keeper,POSES.ready);

    const camera=new T.PerspectiveCamera(30,300/160,.05,80);
    const CAM={pos:new T.Vector3(0,.5,13.15),look:new T.Vector3(0,1.02,0),hfov:47};

    // ---------- state ----------
    // plan: null (keeper ready, ball on the spot) or one kick {shot, dive, goal, start} timed from the strike.
    let plan=null,frozenAt=null,raf=0,last=0,alive=true,disposed=false;
    const ballState={p:new T.Vector3(),v:new T.Vector3(),t:0,free:false,spin:new T.Vector3()};
    const netHit={on:false,x:0,y:0,t0:0};
    const v3=(x,y,z)=>new T.Vector3(x,y,z);
    function placeBallOnSpot(){ball.position.set(0,BALL_R,SPOT_Z);ball.rotation.set(.3,.6,0);}
    function bezier(a,b,c,t){const u=1-t;return v3(u*u*a.x+2*u*t*b.x+t*t*c.x,u*u*a.y+2*u*t*b.y+t*t*c.y,u*u*a.z+2*u*t*b.z+t*t*c.z);}
    function makePlan(k){
      const start=v3(0,BALL_R,SPOT_Z);let target,ctrl,after;
      if(!k.shot){// clock ran out: skied over the bar
        target=v3(.6,GOAL_H+1.3,-.4);ctrl=v3(.3,1.6,5.5);after={v:v3(.4,1.2,-9)};
      }else if(k.goal){
        const x=ZONE[k.shot],y=k.shot==="M"?1.62:1.5,ny=y*.82;
        // Into the back of the net, where the back sheet is at that height.
        target=v3(x,y,0);ctrl=v3(x*.5,y*.9+.25,5.5);after={net:v3(x*1.04,ny,BACK_BOT+(ny/BACK_TOP[0])*(BACK_TOP[1]-BACK_BOT)+.05)};
      }else{
        const glove=gloveAt[k.dive]||gloveAt.M;
        target=glove.clone().add(v3(0,0,.12));ctrl=v3(target.x*.5,target.y*.9+.25,5.5);
        const side=Math.sign(target.x)||(k.round%2?1:-1);
        // Parried: out to the side and down in front of the goal, still in the picture.
        after={v:v3(side*.9,1.5,2.1)};
      }
      return {...k,start,ctrl,target,after};
    }
    function stepFree(dt){
      const s=ballState;s.v.y+=GRAVITY*dt;s.p.addScaledVector(s.v,dt);
      if(s.p.y<BALL_R){s.p.y=BALL_R;if(s.v.y<0)s.v.y=-s.v.y*.42;s.v.x*=.82;s.v.z*=.82;if(Math.abs(s.v.y)<.35)s.v.y=0;}
      if(s.p.y<=BALL_R+1e-4&&s.v.y===0){const f=Math.max(0,1-1.6*dt);s.v.x*=f;s.v.z*=f;}
      // Inside the net: the back sheet holds it.
      if(plan&&plan.goal){const zBack=BACK_BOT+.12;if(s.p.z<zBack){s.p.z=zBack;s.v.z=Math.abs(s.v.z)*.15;}}
      ball.position.copy(s.p);
      ball.rotation.x+=s.v.z*dt/BALL_R;ball.rotation.z-=s.v.x*dt/BALL_R;
    }
    // Everything at time t (seconds since the strike), so a frame can be drawn at any moment.
    function poseAt(t){
      if(!plan){
        // Waiting: the keeper on his toes, weight moving from foot to foot.
        const w=cm3Now()/1000,p={...POSES.ready};p.x+=Math.sin(w*1.6)*.05;p.y+=Math.abs(Math.sin(w*3.2))*.018;p.rz=Math.sin(w*1.6)*.025;p.sp+=Math.sin(w*.9)*.02;
        applyPose(keeper,p);placeBallOnSpot();netHit.on=false;return;
      }
      const dive=plan.dive,diveT=.5;
      if(t<=0){applyPose(keeper,POSES.ready);placeBallOnSpot();netHit.on=false;return;}
      // Keeper: a short load, the spring, full stretch at the ball's arrival, then down.
      const reach=clamp01(t/diveT),fall=clamp01((t-.62)/.4);
      let p=mix(POSES.ready,POSES[dive],ease.outCubic(reach));
      if(dive!=="M"){p.y+=Math.sin(Math.PI*reach)*.22;}
      if(fall>0)p=mix(p,LANDED[dive],ease.inOut(fall));
      applyPose(keeper,p);
      // Ball.
      if(t<FLIGHT){
        const u=t/FLIGHT;ball.position.copy(bezier(plan.start,plan.ctrl,plan.target,ease.outCubic(u)*.35+u*.65));
        ball.rotation.set(-t*38,t*9,0);ballState.free=false;netHit.on=false;return;
      }
      if(!ballState.free||ballState.t>t+1e-6){
        // Start the free ball at the arrival (also when time jumps back).
        ballState.free=true;ballState.t=FLIGHT;ballState.p.copy(plan.target);
        if(plan.after.net){ballState.v.copy(plan.after.net.clone().sub(plan.target).multiplyScalar(1/.12));netHit.on=true;netHit.x=plan.after.net.x;netHit.y=plan.after.net.y;netHit.t0=FLIGHT+.1;}
        else{ballState.v.copy(plan.after.v);netHit.on=false;}
      }
      while(ballState.t<t){const dt=Math.min(1/120,t-ballState.t);stepFree(dt);ballState.t+=dt;}
    }
    function netAt(t){
      const pos=back.geometry.attributes.position,arr=pos.array;
      if(!netHit.on||t<netHit.t0){if(arr.__moved){arr.set(backBase);pos.needsUpdate=true;arr.__moved=false;}return;}
      const e=t-netHit.t0,amp=e<.09?e/.09:Math.exp(-(e-.09)*3.2)*Math.cos((e-.09)*11);
      for(let i=0;i<arr.length;i+=3){
        const dx=backBase[i]-netHit.x,dy=backBase[i+1]-netHit.y,w=Math.exp(-(dx*dx+dy*dy)/.55);
        arr[i]=backBase[i];arr[i+1]=backBase[i+1]-w*amp*.08;arr[i+2]=backBase[i+2]-w*amp*.55;
      }
      arr.__moved=true;pos.needsUpdate=true;
    }

    // ---------- size, labels, drawing ----------
    let cssW=0,cssH=0;
    function layout(){
      // An SVG element has no offset box: place the canvas from both client rects (the box is the canvas's positioned parent).
      const box=svg.parentNode;if(!box||!box.getBoundingClientRect)return;
      const r=svg.getBoundingClientRect(),o=box.getBoundingClientRect(),w=Math.round(r.width),h=Math.round(r.height);if(!w||!h)return;
      canvas.style.left=`${(r.left-o.left).toFixed(2)}px`;canvas.style.top=`${(r.top-o.top).toFixed(2)}px`;canvas.style.width=`${w}px`;canvas.style.height=`${h}px`;
      if(w!==cssW||h!==cssH){cssW=w;cssH=h;renderer.setSize(w,h,false);}
      camera.aspect=w/h;
      camera.fov=T.MathUtils.radToDeg(2*Math.atan(Math.tan(T.MathUtils.degToRad(CAM.hfov)/2)/camera.aspect));
      camera.position.copy(CAM.pos);camera.lookAt(CAM.look);camera.updateProjectionMatrix();camera.updateMatrixWorld();
      // The LEFT / MIDDLE / RIGHT words over the three zones of the goal mouth.
      try{
        const ctm=svg.getScreenCTM(),rect=svg.getBoundingClientRect();
        if(ctm){const inv=ctm.inverse(),pt=svg.createSVGPoint();
          const words=svg.querySelectorAll(".cmZone"),sides=["L","M","R"];
          // Over the dark hall at the top, clear of the ball on the spot at the bottom.
          words.forEach((node,i)=>{const s=sides[i];if(!s)return;if(!node.dataset.cm2d)node.dataset.cm2d=`${node.getAttribute("x")} ${node.getAttribute("y")}`;const v=v3(ZONE[s],1.2,0).project(camera);pt.x=rect.left+(v.x+1)/2*rect.width;pt.y=rect.top;const p=pt.matrixTransform(inv);node.setAttribute("x",p.x.toFixed(1));node.setAttribute("y","20");});
        }
      }catch(_error){}
    }
    function cm3Draw(){
      const t=frozenAt!==null?frozenAt:plan?(cm3Now()-plan.startAt)/1000:0;
      poseAt(t);netAt(t);
      // The camera eases in behind the ball as it flies (back to its place on the next reset).
      if(plan){const k=ease.inOut(clamp01(t/.9)),side=plan.shot?ZONE[plan.shot]:0;
        camera.position.set(CAM.pos.x+side*.06*k,CAM.pos.y+.14*k,CAM.pos.z-1.25*k);camera.lookAt(CAM.look.x+side*.08*k,CAM.look.y,CAM.look.z);camera.updateMatrixWorld();}
      renderer.render(scene,camera);
    }
    function cm3Now(){return root.performance?.now?.()??Date.cm3Now();}
    function frame(time){
      raf=0;if(disposed)return;
      if(!canvas.isConnected||!svg.isConnected){dispose();return;}
      if(doc().visibilityState!=="hidden"){layout();cm3Draw();}
      last=time;raf=root.requestAnimationFrame(frame);
    }
    const ro=typeof root.ResizeObserver==="function"?new root.ResizeObserver(()=>{if(!disposed)layout();}):null;
    function dispose(){
      if(disposed)return;disposed=true;alive=false;if(raf)root.cancelAnimationFrame(raf);ro?.disconnect();
      scene.traverse(o=>{if(o.geometry)o.geometry.dispose();});
      for(const x of own)try{x.dispose&&x.dispose();}catch(_error){}
      renderer.dispose();try{renderer.forceContextLoss();}catch(_error){}
      canvas.remove();svg.classList.remove("cm3d-on");
      svg.querySelectorAll(".cmZone").forEach(node=>{const xy=(node.dataset.cm2d||"").split(" ");if(xy.length===2){node.setAttribute("x",xy[0]);node.setAttribute("y",xy[1]);}delete node.dataset.cm2d;});
    }
    const api={
      reset(){plan=null;frozenAt=null;ballState.free=false;},
      // k = {shot: "L"|"M"|"R"|null (clock ran out), dive: "L"|"M"|"R", goal: boolean, animate: boolean}
      kick(k){
        plan=makePlan({shot:k.shot||null,dive:k.dive||"M",goal:Boolean(k.goal),round:k.round||1});
        ballState.free=false;
        const still=!k.animate||reducedMotion();
        plan.startAt=cm3Now()-(still?SETTLE*1000:0);frozenAt=null;
      },
      // Tests and render proofs: draw the kick at t seconds after the strike (null goes back to live time).
      at(t){frozenAt=typeof t==="number"?t:null;layout();cm3Draw();},
      dispose,
      lit:Boolean(scene.environment),
      probe(){return {kicking:Boolean(plan),keeper:keeper.root.position.toArray(),roll:keeper.root.rotation.z,ball:ball.position.toArray()};},
      get alive(){return alive;}
    };
    // First frame now, so the caller can show the stage with the goal already drawn.
    svg.parentNode.insertBefore(canvas,svg);
    svg.classList.add("cm3d-on");
    layout();renderer.compile(scene,camera);cm3Draw();
    ro?.observe(svg);
    raf=root.requestAnimationFrame(frame);
    return api;
  }

  function loadImage(src){
    return new Promise(resolve=>{const img=new root.Image();img.decoding="async";img.onload=()=>resolve(img);img.onerror=()=>resolve(null);img.src=src;});
  }
  function loadEnv(T){
    if(typeof T.EXRLoader!=="function")return Promise.resolve(null);
    return new T.EXRLoader().setDataType(T.HalfFloatType).loadAsync(ENV_PATH).then(tex=>{tex.mapping=T.EquirectangularReflectionMapping;return tex;},error=>{try{root.console?.warn?.("Chamber Men 3D: no hall light",error);}catch(_error){}return null;});
  }
  // mount(svg) (cm3Mount): the 3D goal in place of the SVG art, resolved once its first frame is drawn; null when it cannot run here.
  async function cm3Mount(svg){
    if(!svg||!svg.parentNode||root.CMS_CHAMBER_MEN_3D==="off"||!hasWebgl2())return null;
    try{
      const T=await loadEngine();
      const [env,marble]=await Promise.all([loadEnv(T),loadImage(MARBLE_PATH)]);
      if(!svg.isConnected){env?.dispose();return null;}
      const api=build(T,svg,env,marble);
      CareerModeChamberMen3d.last=api;
      return api;
    }catch(error){
      try{root.console?.warn?.("Chamber Men 3D goal unavailable; the drawn goal plays instead.",error);}catch(_error){}
      return null;
    }
  }
  const CareerModeChamberMen3d={contractVersion:1,feature:"cms-chamber-men-3d",enginePath:ENGINE_PATH,envPath:ENV_PATH,mount:cm3Mount,last:null};
  root.CareerModeChamberMen3d=CareerModeChamberMen3d;
})(typeof globalThis!=="undefined"?globalThis:this);
