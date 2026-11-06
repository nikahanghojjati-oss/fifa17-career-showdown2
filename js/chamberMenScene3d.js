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

  // ---------- r89 broadcast: the FIFA 17 penalty (Nik 2026-11-04) ----------
  // The camera sits behind and above the taker, as on TV; the taker (in his manager's club kit, js/kits17.js) runs up and
  // strikes, the keeper (his rival's club keeper kit, never clashing) dives; the stadium kit (js/chamberMenStadium3d.js)
  // gives the goal, net, pitch, stands and crowd. Players: the rigged Mixamo body with its own clips
  // (visual-assets/v10_1/chamber-men/players, tools/chamber-men-players). Everything is a function of the time since the
  // strike, so a frame can be drawn at any moment, and both phones show the same kick.
  const STADIUM_JS="js/chamberMenStadium3d.js",KITS_JS="js/kits17.js",CREST_JS="js/visualIdentity.js";
  const PLAYER_PATH="visual-assets/v10_1/chamber-men/players/";
  // Bodies (tools/chamber-men-players): one shared clip file, then a light file per body. A body plays only once kits17
  // can paint its kit (its name is in K.layouts). Ch42's toes dip up to 3 cm into the grass, so it stands 2 cm higher.
  const BODIES=["remy","ch38","ch42"],BODY_LIFT={ch42:.02};
  // Skin and hair go together, only in the pairs checked to look natural on each body (Nik 2026-11-04: never an unnatural
  // mix). Ch38's hair is black, so it keeps its own.
  const BODY_LOOKS={
    remy:[[[1,1,1],[1,1,1]],[[1,1,1],[.55,.42,.3]],[[.92,.84,.78],[.32,.22,.13]],[[.86,.76,.68],[.16,.11,.07]],[[.7,.56,.46],[.07,.05,.04]],[[.52,.39,.31],[.05,.04,.035]]],
    ch38:[[[1,1,1],[1,1,1]],[[1.12,1.05,1],[1,1,1]],[[.88,.84,.82],[1,1,1]],[[.75,.7,.68],[1,1,1]]],
    ch42:[[[1,1,1],[1,1,1]],[[.92,.84,.78],[1,1,1]],[[.86,.76,.68],[.6,.6,.6]],[[.7,.56,.46],[.5,.5,.5]],[[.52,.39,.31],[.4,.4,.4]],[[1,1,1],[1.6,1.3,1]]]
  };
  // Seconds from kick() to the strike. The step waits for it before it shows the result words.
  const RUNUP=2.15,EXTRAS_WAIT_MS=4200,DISSOLVE=.55;
  // penaltyKick's strike is measured on the boot when the scene is built (strikeOf); these are only the fallback.
  const KICK_HIT_GUESS=.74,KICK_BALL_GUESS=[-.99,BALL_R,2.42];
  // jog: the frame whose feet match the first frame of penaltyKick (left foot down, right foot pushing off).
  const JOG_JOIN=1.933;
  // Run-ups, one per kick in turn: a jog, a longer, slower jog, and two steps from a standstill (FIFA 17's "still").
  const RUNUPS=[{jog:1.1,rate:1},{jog:1.3,rate:.82},{jog:0,rate:1}];
  // Keeper moves by the side he goes to (world -x is the keeper's right; "m" mirrors a clip to the other side). tc is the
  // clip time of full stretch (the glove meets the ball there), s the speed it plays at so the dive starts on the strike.
  const KEEPS={
    L:[{c:"gkDive1",m:0,tc:.9,s:1.35},{c:"gkDive",m:1,tc:1.1,s:1.6},{c:"gkBlock1",m:0,tc:.7,s:1.15},{c:"gkBlock",m:1,tc:.8,s:1.25},{c:"gkBlock2",m:1,tc:.7,s:1.15}],
    R:[{c:"gkDive",m:0,tc:1.1,s:1.6},{c:"gkDive1",m:1,tc:.9,s:1.35},{c:"gkBlock",m:0,tc:.8,s:1.25},{c:"gkBlock1",m:1,tc:.7,s:1.15},{c:"gkBlock2",m:0,tc:.7,s:1.15}],
    M:[{c:"gkCatch1",m:0,tc:.4,s:1,hold:1},{c:"gkCatch2",m:0,tc:.8,s:1.2,hold:1}]
  };
  // Goals: where in the zone the ball goes (heights), by kick.
  const GOAL_SPOTS={side:[[2.75,.32],[2.6,1.05],[2.85,1.85],[2.95,.6]],mid:[[.35,1.55],[-.3,.95],[.15,1.95]]};

  function cm3Script(key,path,ready){
    if(ready())return Promise.resolve(true);
    if(typeof root.loadRuntimeScript==="function")return Promise.resolve(root.loadRuntimeScript(key,path,ready)).then(()=>Boolean(ready()),()=>false);
    return new Promise(resolve=>{const s=doc().createElement("script");s.src=path;s.async=true;s.onload=()=>resolve(Boolean(ready()));s.onerror=()=>resolve(false);doc().head.append(s);});
  }
  // The stadium textures, the kits, the shared clips and each club's body (taker and keeper: one file per body, parsed
  // twice). null when any part cannot come in time: the hall scene plays instead.
  // Started before the engine arrives: the scripts, the clips and the bodies come down while three.js loads.
  function cm3Hash(s){let h=2166136261;for(const ch of String(s))h=Math.imul(h^ch.charCodeAt(0),16777619)>>>0;return h;}
  // The bodies kits17 can dress (a proof run may force one with CMS_CHAMBER_MEN_BODY).
  function cm3BodyList(K){
    const forced=root.CMS_CHAMBER_MEN_BODY;if(BODIES.includes(forced))return [forced];
    const ok=K&&Array.isArray(K.layouts)?K.layouts:["remy"];const list=BODIES.filter(b=>ok.includes(b));return list.length?list:["remy"];
  }
  // One body per club for the whole Showdown (its taker and its keeper), from the club's name: nothing random.
  function cm3BodyOf(club,list){return list[cm3Hash(`body|${club||""}`)%list.length];}
  function cm3Prefetch(phone,clubs){
    const scripts=Promise.all([cm3Script("chamber-men-stadium",STADIUM_JS,()=>Boolean(root.CareerModeChamberMenStadium)),cm3Script("kits17",KITS_JS,()=>Boolean(root.CareerModeKits17)),
      cm3Script("visual-identity",CREST_JS,()=>typeof root.getClubCrestSvg==="function").catch(()=>false)]).then(([okS,okK])=>Boolean(okS&&okK),()=>false);
    const tier=phone?"phone":"desktop";
    const get=file=>typeof root.fetch!=="function"?Promise.resolve(null):root.fetch(PLAYER_PATH+file).then(r=>r.ok?r.arrayBuffer():null).catch(()=>null);
    const anims=get(`anims_${tier}.glb`);
    const bodies=scripts.then(ok=>{
      if(!ok)return null;
      const list=cm3BodyList(root.CareerModeKits17),c=clubs||{};
      const names=[...new Set([cm3BodyOf(c.playerOne,list),cm3BodyOf(c.playerTwo,list)])];
      return Promise.all(names.map(n=>get(`body_${n}_${tier}.glb`))).then(bufs=>bufs.every(Boolean)?Object.fromEntries(names.map((n,i)=>[n,bufs[i]])):null);
    });
    return {scripts,anims,bodies};
  }
  function cm3Extras(T,phone,pre){
    if(typeof T.GLTFLoader!=="function"||typeof T.AnimationMixer!=="function"||!pre)return Promise.resolve(null);
    let late=false;
    const work=(async()=>{
      if(!await pre.scripts)return null;
      const S=root.CareerModeChamberMenStadium;
      const [tex,anims,bufs]=await Promise.all([S.load(T,{phone}),pre.anims,pre.bodies]);
      if(!anims||!bufs){for(const t of Object.values(tex||{}))t.dispose?.();return null;}
      const parse=buf=>new T.GLTFLoader().parseAsync(buf.slice(0),PLAYER_PATH);
      const clips=await parse(anims);
      const bodies={};
      await Promise.all(Object.entries(bufs).map(async([n,buf])=>{const [taker,keeper]=await Promise.all([parse(buf),parse(buf)]);bodies[n]={taker,keeper};}));
      // Warm each body's kit map (kits17 caches it), so the first kit goes on with the first frame.
      const K=root.CareerModeKits17;
      await Promise.all(Object.keys(bufs).map(n=>{try{return Promise.resolve(K.textures("",{layout:n,size:"small"}).ready).catch(()=>null);}catch(_error){return null;}}));
      const out={S,tex,K,clips,bodies};
      if(late){cm3FreeExtras(out);return null;}
      return out;
    })().catch(error=>{try{root.console?.warn?.("Chamber Men 3D: no stadium or players; the hall plays.",error);}catch(_error){}return null;});
    return Promise.race([work,new Promise(resolve=>root.setTimeout(()=>{late=true;resolve(null);},EXTRAS_WAIT_MS))]);
  }
  function cm3FreeExtras(x){
    try{for(const t of Object.values(x.tex||{}))t.dispose?.();}catch(_error){}
    const all=[x.clips];for(const b of Object.values(x.bodies||{}))all.push(b.taker,b.keeper);
    for(const g of all)try{g?.scene?.traverse(o=>{o.geometry?.dispose?.();for(const m of [].concat(o.material||[])){for(const v of Object.values(m))if(v&&v.isTexture)v.dispose();m.dispose?.();}});}catch(_error){}
  }

  function buildBroadcast(T,svg,x,opts){
    const d=doc(),canvas=d.createElement("canvas");
    canvas.className="cmGoal3d";canvas.setAttribute("aria-hidden","true");
    const renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:"high-performance"});
    const phone=Math.min(root.screen?.width||1e4,root.screen?.height||1e4)<700;
    // Sharpness steps: the scene starts at the screen's own pixel ratio (capped) and steps down when frames run long.
    const prMax=Math.min(root.devicePixelRatio||1,phone?2:2.25),prSteps=[prMax,Math.max(1,prMax*.85),Math.max(1,prMax*.72),Math.max(1,prMax*.6),1].filter((v,i,a)=>i===0||v<a[i-1]-.01);
    let prStep=0;renderer.setPixelRatio(prSteps[0]);
    renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.0;
    renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;
    const aniso=Math.min(8,renderer.capabilities.getMaxAnisotropy());
    const scene=new T.Scene();scene.background=new T.Color(0x05070b);scene.fog=new T.FogExp2(0x0a0d14,.0045);
    const own=[];const keep=v=>{own.push(v);return v;};
    const clubs=(opts&&opts.clubs)||{};
    const K=x.K,colourOf=club=>{try{return parseInt(String(K.kit(club).dominant).replace("#",""),16);}catch(_error){return 0x888888;}};
    // Stadium: white posts like FIFA 17, the crowd in each club's colour.
    const S=x.S.build(T,x.tex,{phone,posts:"white",home:colourOf(clubs.playerOne),away:colourOf(clubs.playerTwo),aniso});
    scene.add(S.group);
    const ball=S.ball;
    // Night match light: floodlights from high over both corners of the box, a cool sky, a soft rim behind the goal.
    scene.add(new T.HemisphereLight(0xdde6ff,0x15200f,.55));
    const key=new T.DirectionalLight(0xfff3e2,2.7);key.position.set(9,30,24);key.target.position.set(0,0,6);
    key.castShadow=true;key.shadow.mapSize.set(phone?1024:2048,phone?1024:2048);key.shadow.bias=-.0004;key.shadow.normalBias=.03;key.shadow.radius=2;
    Object.assign(key.shadow.camera,{left:-11,right:11,top:13,bottom:-11,near:10,far:70});key.shadow.camera.updateProjectionMatrix();
    scene.add(key,key.target);
    const fill=new T.DirectionalLight(0xe4ecff,.75);fill.position.set(-14,20,18);scene.add(fill);
    const rim=new T.DirectionalLight(0xfff0d0,.9);rim.position.set(-4,12,-24);scene.add(rim);
    // Reflections: the stadium itself, once (the ball and posts see the stands and lights).
    {const pm=new T.PMREMGenerator(renderer);scene.environment=keep(pm.fromScene(scene,.04,.1,300).texture);pm.dispose();scene.environmentIntensity=.55;}

    // ---------- players ----------
    const sample=new T.Vector3(),sampleQ=new T.Quaternion(),fwd=new T.Vector3();
    // A body plays the shared clips: each clip cloned with its hips travel scaled to the body (cmHipsScale, from the
    // converter: the body's hips height over Remy's). Rotations fit every body as they are.
    const scaleOf=g=>{const u=g.scene.userData?.cmHipsScale??g.scene.children[0]?.userData?.cmHipsScale;return Number.isFinite(u)&&u>0?u:1;};
    const retarget=scale=>{const out={};for(const c of x.clips.animations){
      if(scale===1){out[c.name]=c;continue;}
      const k=c.clone();for(const t of k.tracks)if(t.name.endsWith(".position")){const v=t.values;for(let i=0;i<v.length;i+=1)v[i]*=scale;}out[c.name]=k;}return out;};
    const actor=(gltf,name,body)=>{
      const model=gltf.scene,holder=new T.Group();holder.name=name;holder.add(model);holder.visible=false;scene.add(holder);
      model.position.y=BODY_LIFT[body]||0;
      const mats={},bones={};
      model.traverse(o=>{
        if(o.isMesh){o.castShadow=true;o.receiveShadow=true;o.frustumCulled=false;for(const m of [].concat(o.material)){if(m&&m.name)mats[m.name]=m;keep(m);}}
        if(o.isBone&&!bones[o.name])bones[o.name]=o;
      });
      const clips=retarget(scaleOf(gltf));
      const mixer=new T.AnimationMixer(model),actions=new Map();
      const act=clip=>{let a=actions.get(clip);if(!a){a=mixer.clipAction(clip);a.setLoop(T.LoopRepeat,Infinity);a.play();a.enabled=false;actions.set(clip,a);}return a;};
      // layers: [{clip, time, w}] (weights are normalised, so a blend never shows the bind pose).
      const pose=layers=>{
        for(const a of actions.values())a.enabled=false;
        let sum=0;for(const l of layers)if(l.clip&&l.w>0)sum+=l.w;
        for(const l of layers){if(!l.clip||l.w<=0)continue;const a=act(l.clip);a.enabled=true;a.setEffectiveWeight(l.w/sum);a.time=Math.max(0,Math.min(l.clip.duration-1e-3,l.time));}
        mixer.update(0);holder.updateMatrixWorld(true);
      };
      return {holder,model,mats,bones,clips,mixer,pose,hips:bones.mixamorigHips,body};
    };
    // Root motion. A clip's hips track is in the hips' parent space; we move it in world space (the model at rest at the
    // origin): optionally drop its travel along x/z, then turn it by yaw about `from` and carry `from` to `to`.
    const hipsOf=(a,clip,time)=>{a.pose([{clip,time,w:1}]);a.hips.getWorldPosition(sample);a.hips.getWorldQuaternion(sampleQ);fwd.set(0,0,1).applyQuaternion(sampleQ);return {x:sample.x,z:sample.z,face:Math.atan2(fwd.x,fwd.z)};};
    const rebase=(a,clip,name,{zero,from,to})=>{
      const P=a.hips.parent;a.holder.updateMatrixWorld(true);
      const M=P.matrixWorld.clone(),Mi=M.clone().invert(),Pq=new T.Quaternion(),Ps=new T.Vector3(),Pp=new T.Vector3();M.decompose(Pp,Pq,Ps);
      const yaw=to&&from?to.face-from.face:0,Q=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),yaw);
      const Lq=Pq.clone().invert().multiply(Q).multiply(Pq);
      const tracks=clip.tracks.map(t=>{
        const n=t.name;if(!n.startsWith(`${a.hips.name}.`))return t.clone();
        const c=t.clone(),v=c.values;
        if(n.endsWith(".position")){
          const w0=new T.Vector3(v[0],v[1],v[2]).applyMatrix4(M),w=new T.Vector3();
          for(let i=0;i<v.length;i+=3){
            w.set(v[i],v[i+1],v[i+2]).applyMatrix4(M);
            if(zero&&zero.includes("x"))w.x=w0.x;if(zero&&zero.includes("z"))w.z=w0.z;
            if(from&&to){w.x-=from.x;w.z-=from.z;w.applyAxisAngle(new T.Vector3(0,1,0),yaw);w.x+=to.x;w.z+=to.z;}
            w.applyMatrix4(Mi);v[i]=w.x;v[i+1]=w.y;v[i+2]=w.z;
          }
        }else if(n.endsWith(".quaternion")&&yaw){
          const q=new T.Quaternion();
          for(let i=0;i<v.length;i+=4){q.fromArray(v,i).premultiply(Lq);q.toArray(v,i);}
        }
        return c;
      });
      return new T.AnimationClip(name,clip.duration,tracks);
    };
    const need=(a,names)=>{if(!names.every(n=>a.clips[n]))throw new Error("player clips missing");};
    // A taker on one body: his clips, all in penaltyKick's frame; his strike measured on his own boot; placed so that
    // boot meets the ball on the spot.
    const takerRig=taker=>{
      need(taker,["penaltyKick","jog","offensiveIdle","victory","disappointed"]);
      const TK=taker.clips,kick0=hipsOf(taker,TK.penaltyKick,0),kickEnd=hipsOf(taker,TK.penaltyKick,TK.penaltyKick.duration-.034);
      const jogJoin=hipsOf(taker,TK.jog,JOG_JOIN);
      const jog=rebase(taker,TK.jog,"cmJog",{from:jogJoin,to:kick0});
      const styles=RUNUPS.map((r,i)=>{
        let start=kick0;
        if(r.jog){const h=hipsOf(taker,jog,JOG_JOIN-r.jog*r.rate);start=h;}
        const idle0=hipsOf(taker,TK.offensiveIdle,0);
        return {...r,start,idle:rebase(taker,TK.offensiveIdle,`cmIdle${i}`,{zero:"xz",from:idle0,to:start})};
      });
      const react={victory:rebase(taker,TK.victory,"cmVictory",{zero:"xz",from:hipsOf(taker,TK.victory,0),to:kickEnd}),
        disappointed:rebase(taker,TK.disappointed,"cmDown",{zero:"xz",from:hipsOf(taker,TK.disappointed,0),to:kickEnd})};
      const struck=strikeOf(taker,TK);
      const hit=struck?struck.hit:KICK_HIT_GUESS,at=struck?struck.ball:KICK_BALL_GUESS;
      taker.holder.rotation.y=TAKER_YAW;
      taker.holder.position.set(0-(at[0]*cosY+at[2]*sinY),0,SPOT_Z-(-at[0]*sinY+at[2]*cosY));
      return {a:taker,TK,jog,styles,react,struck,hit,ball:at};
    };
    // A keeper on one body: his clips stay on his line (no travel toward the taker).
    const keeperRig=keeper=>{
      need(keeper,["gkIdle","gkDive","gkDive1","gkBlock","gkBlock1","gkBlock2","gkCatch1","gkCatch2"]);
      const KC={gkIdle:rebase(keeper,keeper.clips.gkIdle,"cmGkIdle",{zero:"xz"})};
      for(const n of ["gkDive","gkDive1","gkBlock","gkBlock1","gkBlock2","gkCatch1","gkCatch2"])KC[n]=rebase(keeper,keeper.clips[n],`cm_${n}`,{zero:"z"});
      keeper.holder.position.set(0,0,.25);
      return {a:keeper,KC};
    };
    // Where they stand: the taker so that his foot meets the ball on the spot; the keeper on his line facing out.
    const TAKER_YAW=Math.PI,cosY=Math.cos(TAKER_YAW),sinY=Math.sin(TAKER_YAW);
    // The strike, measured on the boot itself (Nik 2026-11-04: the foot must really meet the ball, never pass through it).
    // At the fastest point of the swing the front of the kicking boot (its skinned vertices, not a bone) sets where the
    // ball sits, with the ball's centre at its own height on the grass; the strike is the first moment any part of that
    // boot touches the ball, found to under a millimetre. Before it nothing of either boot is inside the ball; after it the
    // ball is gone at ~25 m/s while the foot follows at ~12 m/s.
    const strikeOf=(taker,TK)=>{
      const meshes=[];taker.model.traverse(o=>{if(o.isSkinnedMesh&&/^Boots/.test(o.name||o.parent?.name||""))meshes.push(o);});
      if(!meshes.length)return null;
      const kick=TK.penaltyKick,toe=taker.bones.mixamorigRightToeBase,ltoe=taker.bones.mixamorigLeftToeBase;if(!toe||!ltoe)return null;
      const at=time=>{taker.pose([{clip:kick,time,w:1}]);};
      const v=new T.Vector3(),pts=[];
      const bootPts=()=>{pts.length=0;for(const m of meshes){const n=m.geometry.attributes.position.count;for(let i=0;i<n;i+=1){m.getVertexPosition(i,v);v.applyMatrix4(m.matrixWorld);pts.push(v.x,v.y,v.z);}}return pts;};
      // The fastest moment of the right toe in the swing.
      let tPeak=KICK_HIT_GUESS,best=0;const a=new T.Vector3(),b=new T.Vector3(),dir=new T.Vector3();
      for(let t=.55;t<.95;t+=1/120){at(t);toe.getWorldPosition(a);at(t+1/240);toe.getWorldPosition(b);const sp=b.distanceTo(a)*240;if(sp>best){best=sp;tPeak=t;dir.copy(b).sub(a);}}
      dir.y=0;if(dir.lengthSq()<1e-6)return null;dir.normalize();
      at(tPeak);toe.getWorldPosition(a);ltoe.getWorldPosition(b);
      // The kicking boot's points: nearer the right toe than the left. Its front at the ball's centre height.
      const p=bootPts();let front=-1e9,F=null;
      for(let i=0;i<p.length;i+=3){v.set(p[i],p[i+1],p[i+2]);if(v.distanceToSquared(a)>v.distanceToSquared(b))continue;if(Math.abs(v.y-BALL_R)>.045)continue;const d=v.dot(dir);if(d>front){front=d;F=v.clone();}}
      if(!F)return null;
      const C=F.addScaledVector(dir,BALL_R);C.y=BALL_R;
      const gap=time=>{at(time);const q=bootPts();let m=1e9;for(let i=0;i<q.length;i+=3){const dx=q[i]-C.x,dy=q[i+1]-C.y,dz=q[i+2]-C.z;const d=dx*dx+dy*dy+dz*dz;if(d<m)m=d;}return Math.sqrt(m)-BALL_R;};
      let lo=.3,hi=tPeak+.05;
      for(let t=.3;t<=tPeak+.05;t+=1/60){if(gap(t)<=0){hi=t;break;}lo=t;}
      for(let i=0;i<10;i+=1){const mid=(lo+hi)/2;if(gap(mid)<=0)hi=mid;else lo=mid;}
      return {hit:lo,ball:[C.x,C.y,C.z],gap:gap(lo),peak:tPeak,speed:best};
    };
    // Each club has one body for the Showdown (its taker and its keeper); a kick shows the taker's club's taker and the
    // keeper's club's keeper, the others hidden.
    const rigs={};
    for(const [n,g] of Object.entries(x.bodies))rigs[n]={taker:takerRig(actor(g.taker,`cmTaker_${n}`,n)),keeper:keeperRig(actor(g.keeper,`cmKeeper_${n}`,n))};
    const loaded=Object.keys(rigs);if(!loaded.length)throw new Error("no player body");
    const bodyFor=club=>{const b=cm3BodyOf(club,cm3BodyList(K));return rigs[b]?b:cm3BodyOf(club,loaded);};
    let taker,keeper,TK,jog,styles,react,KC,KICK_HIT,KICK_BALL,struck;
    const useRigs=(takerClub,keeperClub)=>{
      const tr=rigs[bodyFor(takerClub)].taker,kr=rigs[bodyFor(keeperClub)].keeper;
      for(const r of Object.values(rigs)){r.taker.a.holder.visible=r.taker===tr;r.keeper.a.holder.visible=r.keeper===kr;}
      ({TK,jog,styles,react,struck}=tr);taker=tr.a;KICK_HIT=tr.hit;KICK_BALL=tr.ball;keeper=kr.a;KC=kr.KC;
    };
    useRigs(clubs.playerOne,clubs.playerTwo);

    // Kits: the taker in his club's home kit, the keeper in his own club's keeper kit picked against the taker's.
    let lineup={taker:null,keeper:null,round:1};
    const kitSize=phone?"phone":"full";
    // Looks: skin tone and hair come from the club and role (the same man for a club's kicks, another for its keeps), from
    // the body's own natural pairs (BODY_LOOKS); nothing random.
    const look=(a,club,role)=>{
      const pairs=BODY_LOOKS[a.body]||BODY_LOOKS.remy,[sk,hr]=pairs[cm3Hash(`${club}|${role}`)%pairs.length];
      a.model.traverse(o=>{if(!o.isMesh)return;const m=o.material;if(!m||Array.isArray(m))return;
        if(o.name==="Body"&&m.name==="Bodymat")m.color.setRGB(sk[0],sk[1],sk[2]);
        if(o.name==="Hair"||m.name==="Hairmat")m.color.setRGB(hr[0],hr[1],hr[2]);});
    };
    const dress=(a,club,role,vs)=>{
      look(a,club,role);
      let t;try{t=K.textures(club,{layout:a.body,role,vsClub:vs,size:kitSize});}catch(_error){return;}
      // One texture per canvas: on Ch38 and Ch42 the shirt, shorts (and Ch38's socks) share one atlas.
      const put=()=>{const made=new Map(),olds=new Set();for(const [m,k] of [["kitShirt","shirt"],["kitShorts","shorts"],["kitSocks","socks"]]){
        const mat=a.mats[m],c=t[k];if(!mat||!c)continue;
        let tex=made.get(c);if(!tex){tex=new T.CanvasTexture(c);tex.flipY=false;tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=aniso;tex.userData.cmKit=true;made.set(c,tex);}
        if(mat.map&&mat.map.userData?.cmKit&&mat.map!==tex)olds.add(mat.map);mat.map=tex;mat.color.setRGB(1,1,1);mat.roughness=.72;mat.needsUpdate=true;
      }for(const o of olds)o.dispose();};
      const token=a.kitToken=(a.kitToken||0)+1;
      // A body-mapped kit is blank until its kit map has loaded: it goes on only when painted (the last kit stays meanwhile).
      if(t.shirt===t.shorts){Promise.resolve(t.ready).then(()=>{if(!disposed&&a.kitToken===token)put();},()=>{});return;}
      put();Promise.resolve(t.ready).then(()=>{if(disposed||a.kitToken!==token)return;for(const m of ["kitShirt","kitShorts","kitSocks"])if(a.mats[m]?.map)a.mats[m].map.needsUpdate=true;},()=>{});
    };

    // ---------- the kick ----------
    let plan=null,frozenAt=null,frozenClock=null,raf=0,alive=true,disposed=false;
    const clockNow=()=>frozenClock!==null?frozenClock:cm3Clock();
    const t0=cm3Clock();
    const ballFree={p:new T.Vector3(),v:new T.Vector3(),t:0,on:false};
    const v3=(a,b,c)=>new T.Vector3(a,b,c);
    const pick=(list,n)=>list[((n%list.length)+list.length)%list.length];
    // The palms: between the wrist and the middle knuckle of each glove.
    const gloveL=new T.Vector3(),gloveR=new T.Vector3(),knuckle=new T.Vector3();
    const palms=()=>{const B=keeper.bones;
      B.mixamorigLeftHand.getWorldPosition(gloveL);B.mixamorigLeftHandMiddle1.getWorldPosition(knuckle);gloveL.lerp(knuckle,.55);
      B.mixamorigRightHand.getWorldPosition(gloveR);B.mixamorigRightHandMiddle1.getWorldPosition(knuckle);gloveR.lerp(knuckle,.55);};
    const keeperAt=(move,time)=>{keeper.holder.scale.x=move.m?-1:1;keeper.pose([{clip:KC[move.c],time,w:1}]);palms();};
    const G=v3(0,GRAVITY,0);
    const makePlan=k=>{
      const round=k.round||1,side=k.dive||"M",move=pick(KEEPS[side]||KEEPS.M,round*3+(k.shot==="R"?1:0));
      const start=v3(0,BALL_R,SPOT_Z);let target,after,hold=false;
      // Where the keeper's gloves are at full stretch: a save meets them there.
      keeperAt(move,move.tc);
      if(!k.shot){target=v3(.7,GOAL_H+1.05,-.3);after={kind:"over"};}
      else if(k.goal){
        const s=k.shot==="M"?pick(GOAL_SPOTS.mid,round):pick(GOAL_SPOTS.side,round),sx=k.shot==="L"?-1:k.shot==="R"?1:1;
        target=v3(k.shot==="M"?s[0]:sx*s[0],s[1],0);after={kind:"net"};
      }else{
        // A save: the ball's surface meets the leading palm (both palms on a catch), on the side the shot comes from.
        hold=Boolean(move.hold);
        const palm=hold?gloveL.clone().add(gloveR).multiplyScalar(.5):(side==="L"?(gloveL.x<gloveR.x?gloveL:gloveR):side==="R"?(gloveL.x>gloveR.x?gloveL:gloveR):(gloveL.y>gloveR.y?gloveL:gloveR)).clone();
        const toShot=start.clone().sub(palm).normalize();
        target=palm.clone().addScaledVector(toShot,BALL_R+(hold?.0:.02));target.y=Math.max(BALL_R,target.y);
        after={kind:hold?"held":"parry",palm};
      }
      // Real flight: one launch velocity under gravity that reaches the target at the arrival time (about 90 km/h).
      const v0=target.clone().sub(start).addScaledVector(G,-.5*FLIGHT*FLIGHT).multiplyScalar(1/FLIGHT);
      const spinAxis=v3(0,1,0).cross(v0).normalize(),spinRate=v0.length()/BALL_R*.18;
      return {...k,round,move,style:pick(RUNUPS.map((_r,i)=>i),round),start,target,v0,spinAxis,spinRate,after,hold,kStart:FLIGHT-move.tc/move.s,netHit:false};
    };
    const cm3Easy=u=>u<=0?0:u>=1?1:u*u*(3-2*u);
    // The taker at time t (seconds from the strike); idle while waiting.
    const takerAt=(t,live)=>{
      const st=styles[plan?plan.style:lineup.style||0];
      if(!plan){taker.pose([{clip:st.idle,time:live%st.idle.duration,w:1}]);return;}
      const kickT=t+KICK_HIT,jogLen=st.jog,runStart=-KICK_HIT-jogLen;
      const idle={clip:st.idle,time:(live)%st.idle.duration,w:1};
      if(kickT>=0){
        const end=TK.penaltyKick.duration-.034;
        if(kickT<end){
          const k={clip:TK.penaltyKick,time:kickT,w:1};
          if(st.jog&&kickT<.12){const j=cm3Easy(kickT/.12);taker.pose([{clip:jog,time:JOG_JOIN+kickT*st.rate,w:1-j},{...k,w:j}]);return;}
          if(!st.jog&&kickT<.001){taker.pose([idle]);return;}
          taker.pose([k]);return;
        }
        const r=plan.goal&&plan.shot?react.victory:react.disappointed,rt=kickT-end,b=cm3Easy(rt/.4);
        taker.pose([{clip:TK.penaltyKick,time:end,w:1-b},{clip:r,time:rt,w:b}]);return;
      }
      if(!st.jog){
        // Two steps from a standstill: he waits, then goes.
        const b=cm3Easy((kickT+.28)/.28);taker.pose([idle,{clip:TK.penaltyKick,time:0,w:b}]);return;
      }
      if(t<runStart){taker.pose([idle]);return;}
      const jt=JOG_JOIN-(-KICK_HIT-t)*st.rate,b=cm3Easy((t-runStart)/.3);
      taker.pose([{...idle,w:1-b},{clip:jog,time:jt,w:b}]);
    };
    const keeperPose=(t,live)=>{
      const idle={clip:KC.gkIdle,time:live%KC.gkIdle.duration,w:1};
      if(!plan||t<plan.kStart){keeper.holder.scale.x=1;keeper.pose([idle]);return;}
      const m=plan.move,ct=(t-plan.kStart)*m.s,b=cm3Easy(ct/(m.s*.12));
      keeper.holder.scale.x=m.m?-1:1;keeper.pose([{...idle,w:1-b},{clip:KC[m.c],time:ct,w:b}]);
    };
    // The loose ball: gravity, air drag, bounces that lose speed, grass friction while it rolls, and inside the goal the
    // net (back, sides and roof) takes its pace; it rolls the way it moves.
    const roll=new T.Vector3(),spinQ=new T.Quaternion(),UP=v3(0,1,0);
    const stepFree=dt=>{
      const s=ballFree,sp=s.v.length();
      s.v.y+=GRAVITY*dt;if(sp>0)s.v.multiplyScalar(Math.max(0,1-.012*sp*dt));
      s.p.addScaledVector(s.v,dt);
      if(s.p.y<BALL_R){s.p.y=BALL_R;if(s.v.y<0){s.v.y=-s.v.y*.55;s.v.x*=.86;s.v.z*=.86;}if(Math.abs(s.v.y)<.35)s.v.y=0;}
      if(s.p.y<=BALL_R+1e-4&&s.v.y===0){const h=Math.hypot(s.v.x,s.v.z),dec=Math.min(h,1.3*dt);if(h>0){s.v.x-=s.v.x/h*dec;s.v.z-=s.v.z/h*dec;}}
      if(plan&&plan.after.kind==="net"&&s.p.z<.05){
        const back=-2.08+Math.max(0,s.p.y-1.5)*1.1,side=HALF-.08-BALL_R,roof=GOAL_H-.06-BALL_R;
        if(s.p.z<back+BALL_R){s.p.z=back+BALL_R;if(s.v.z<0)s.v.z=-s.v.z*.08;s.v.x*=.35;s.v.y*=.35;}
        if(Math.abs(s.p.x)>side){s.p.x=Math.sign(s.p.x)*side;s.v.x*=-.1;s.v.z*=.5;}
        if(s.p.y>roof){s.p.y=roof;if(s.v.y>0)s.v.y*=-.1;}
      }
      ball.position.copy(s.p);
      roll.crossVectors(UP,s.v);const rs=roll.length();if(rs>1e-5){spinQ.setFromAxisAngle(roll.multiplyScalar(1/rs),rs*dt/BALL_R);ball.quaternion.premultiply(spinQ);}
    };
    const ballAt=t=>{
      if(!plan||t<=0){ball.position.set(0,BALL_R,SPOT_Z);ball.rotation.set(.3,.6,0);ballFree.on=false;return;}
      if(t<FLIGHT){
        ball.position.copy(plan.start).addScaledVector(plan.v0,t).addScaledVector(G,.5*t*t);
        ball.rotation.set(.3,.6,0);spinQ.setFromAxisAngle(plan.spinAxis,plan.spinRate*t);ball.quaternion.premultiply(spinQ);ballFree.on=false;return;}
      if(plan.hold){// caught: the ball stays between his palms
        palms();ball.position.copy(gloveL).add(gloveR).multiplyScalar(.5);ball.position.y=Math.max(BALL_R,ball.position.y);return;}
      if(!ballFree.on||ballFree.t>t+1e-6){
        ballFree.on=true;ballFree.t=FLIGHT;ballFree.p.copy(plan.target);
        const vA=plan.v0.clone().addScaledVector(G,FLIGHT);
        if(plan.after.kind==="parry"){
          // Off the glove: away from the palm (never back through the hand or body), out toward the pitch and wide.
          const n=plan.target.clone().sub(plan.after.palm).normalize();n.z=Math.max(n.z,.45);n.x+=Math.sign(plan.target.x||1)*.6;n.y=Math.max(n.y,.25);n.normalize();
          ballFree.v.copy(n).multiplyScalar(vA.length()*.32);
        }else ballFree.v.copy(vA);
      }
      while(ballFree.t<t){const dt=Math.min(1/120,t-ballFree.t);stepFree(dt);ballFree.t+=dt;}
      ball.position.copy(ballFree.p);
    };
    // Camera: behind and above the taker. Waiting: a slow drift; run-up: a push-in; after the strike it leans after the ball.
    const camera=new T.PerspectiveCamera(30,16/9,.1,400);
    const CAMB={pos:v3(0,3.9,SPOT_Z+17),look:v3(0,.5,5.5),hfov:40,vmin:21};
    const CAMP={pos:v3(.3,3.2,SPOT_Z+13),look:v3(0,.75,3)};
    const camLook=new T.Vector3();
    const cameraAt=(t,live)=>{
      const drift=reducedMotion()?0:1;
      const w=live*.22;let p=CAMB.pos.clone(),l=CAMB.look.clone();
      p.x+=Math.sin(w)*.18*drift;p.y+=Math.sin(w*.7)*.05*drift;
      if(plan&&!reducedMotion()){
        const k=cm3Easy((t+RUNUP)/(RUNUP+.4));p.lerp(CAMP.pos,k);l.lerp(CAMP.look,k);
        if(t>0){const f=cm3Easy(t/1.1);l.x+=ball.position.x*.22*f;l.y+=Math.max(-.2,ball.position.y-1)*.12*f;}
      }
      camera.position.copy(p);camLook.copy(l);
      // Proofs only: a close camera on the foot or the gloves ({pos, look, fov}); the game never sets it.
      const cu=api.closeup;if(cu){camera.position.fromArray(cu.pos);camLook.fromArray(cu.look);camera.fov=cu.fov||20;camera.updateProjectionMatrix();}
      camera.lookAt(camLook);camera.updateMatrixWorld();
    };
    const excitement=t=>{if(!plan)return .2;if(t<0)return .2+.4*cm3Easy((t+RUNUP)/RUNUP);if(t<FLIGHT)return .6;
      if(plan.goal&&plan.shot)return Math.max(.45,1-Math.max(0,t-1.6)*.2);return Math.max(.3,.7-(t-FLIGHT)*.35);};

    // ---------- the dissolve between kicks ----------
    // A new taker and keeper come in under a short broadcast dissolve: the last frame fades out over the new one (never
    // to black, never dimmed).
    let snap=null,snapAt=-1e9;
    const overlay=new T.Scene(),overlayCam=new T.OrthographicCamera(-1,1,1,-1,0,1);
    const overlayMat=keep(new T.MeshBasicMaterial({transparent:true,depthTest:false,depthWrite:false,toneMapped:true}));
    const overlayGeo=keep(new T.PlaneGeometry(2,2));overlay.add(new T.Mesh(overlayGeo,overlayMat));
    const dissolveFrom=()=>{
      if(!cssW)return;
      const size=renderer.getDrawingBufferSize(new T.Vector2());
      if(!snap||snap.width!==size.x||snap.height!==size.y){snap?.dispose();snap=new T.WebGLRenderTarget(size.x,size.y,{type:T.HalfFloatType,samples:phone?0:4});}
      renderer.setRenderTarget(snap);renderer.render(scene,camera);renderer.setRenderTarget(null);
      overlayMat.map=snap.texture;overlayMat.needsUpdate=true;snapAt=clockNow();
    };

    // ---------- size, labels, drawing ----------
    let cssW=0,cssH=0;
    const fit=()=>{
      const box=svg.parentNode;if(!box||!box.getBoundingClientRect)return;
      const r=svg.getBoundingClientRect(),o=box.getBoundingClientRect(),w=Math.round(r.width),h=Math.round(r.height);if(!w||!h)return;
      canvas.style.left=`${(r.left-o.left).toFixed(2)}px`;canvas.style.top=`${(r.top-o.top).toFixed(2)}px`;canvas.style.width=`${w}px`;canvas.style.height=`${h}px`;
      if(w!==cssW||h!==cssH){cssW=w;cssH=h;renderer.setSize(w,h,false);}
      // The goal's width sets the lens; a very wide box keeps at least vmin degrees of height, so the taker stays whole.
      camera.aspect=w/h;
      camera.fov=Math.max(CAMB.vmin,T.MathUtils.radToDeg(2*Math.atan(Math.tan(T.MathUtils.degToRad(CAMB.hfov)/2)/camera.aspect)));
      camera.updateProjectionMatrix();
      try{
        const ctm=svg.getScreenCTM(),rect=svg.getBoundingClientRect();
        if(ctm){const inv=ctm.inverse(),pt=svg.createSVGPoint(),sides=["L","M","R"];
          camera.position.copy(CAMB.pos);camera.lookAt(CAMB.look);camera.updateMatrixWorld();
          // Over the three zones of the goal, spread so the words never touch on a small goal.
          const nodes=[...svg.querySelectorAll(".cmZone")].slice(0,3),xs=nodes.map((node,i)=>{if(!node.dataset.cm2d)node.dataset.cm2d=`${node.getAttribute("x")} ${node.getAttribute("y")}`;const v=v3(ZONE[sides[i]],1.2,0).project(camera);pt.x=rect.left+(v.x+1)/2*rect.width;pt.y=rect.top;return pt.matrixTransform(inv).x;});
          if(nodes.length===3){const wd=nodes.map(n=>{try{return n.getComputedTextLength();}catch(_error){return 40;}}),gap=Math.max(xs[1]-xs[0],xs[2]-xs[1],(wd[0]+wd[1])/2+14,(wd[1]+wd[2])/2+14);
            [xs[1]-gap,xs[1],xs[1]+gap].forEach((xv,i)=>{nodes[i].setAttribute("x",xv.toFixed(1));nodes[i].setAttribute("y","20");});}
        }
      }catch(_error){}
    };
    const paint=()=>{
      const now=clockNow(),live=(now-t0)/1000;
      const t=frozenAt!==null?frozenAt:plan?(now-plan.startAt)/1000:0;
      keeperPose(t,live);takerAt(t,live);ballAt(t);
      // The net takes the ball (the stadium kit times its bulge on its own clock: ours).
      const stadiumT=plan?(plan.startAt-t0)/1000+t:live;
      if(plan&&plan.after.kind==="net"&&!plan.netHit&&t>=FLIGHT+.07){plan.netHit=true;S.update((plan.startAt-t0)/1000+FLIGHT+.07,1);S.hitNet(plan.target.x,plan.target.y*.9,plan.v0.length());}
      S.update(stadiumT,excitement(t));
      cameraAt(t,live);
      renderer.render(scene,camera);
      const fade=1-(now-snapAt)/(DISSOLVE*1000);
      if(fade>0&&snap){overlayMat.opacity=cm3Easy(fade);renderer.autoClear=false;renderer.render(overlay,overlayCam);renderer.autoClear=true;}
    };
    // Smoothness first (Nik 2026-11-04): frame times are watched; when the average runs past ~20 ms (under 50 fps) for a
    // second, sharpness steps down, then the shadow map; a step that ran slow is never taken again on this screen, so the
    // picture never pumps. Motion never depends on the frame rate: every pose is read from the clock.
    let lastFrame=0,avg=16.7,slowFor=0;
    const govern=time=>{
      const dt=lastFrame?Math.min(100,time-lastFrame):16.7;lastFrame=time;avg+=(dt-avg)*.08;
      slowFor=avg>20.5?slowFor+dt:0;
      if(slowFor<1000)return;
      slowFor=0;avg=16.7;
      if(prStep<prSteps.length-1){prStep+=1;renderer.setPixelRatio(prSteps[prStep]);cssW=0;fit();}
      else if(key.shadow.mapSize.x>512){key.shadow.mapSize.set(512,512);key.shadow.map?.dispose();key.shadow.map=null;}
    };
    const tick=time=>{
      raf=0;if(disposed)return;
      if(!canvas.isConnected||!svg.isConnected){free();return;}
      if(d.visibilityState!=="hidden"){govern(time);fit();paint();}else lastFrame=0;
      raf=root.requestAnimationFrame(tick);
    };
    const ro=typeof root.ResizeObserver==="function"?new root.ResizeObserver(()=>{if(!disposed)fit();}):null;
    const free=()=>{
      if(disposed)return;disposed=true;alive=false;if(raf)root.cancelAnimationFrame(raf);ro?.disconnect();
      for(const r of Object.values(rigs))for(const a of [r.taker.a,r.keeper.a])try{a.mixer.stopAllAction();a.mixer.uncacheRoot(a.model);}catch(_error){}
      scene.traverse(o=>{if(o.geometry)o.geometry.dispose();for(const m of [].concat(o.material||[]))for(const v of Object.values(m))if(v&&v.isTexture)v.dispose();});
      try{S.dispose();}catch(_error){}
      for(const v of own)try{v.dispose&&v.dispose();}catch(_error){}
      snap?.dispose();
      renderer.dispose();try{renderer.forceContextLoss();}catch(_error){}
      canvas.remove();svg.classList.remove("cm3d-on");
      svg.querySelectorAll(".cmZone").forEach(node=>{const xy=(node.dataset.cm2d||"").split(" ");if(xy.length===2){node.setAttribute("x",xy[0]);node.setAttribute("y",xy[1]);}delete node.dataset.cm2d;});
    };
    const setLineup=(takerClub,keeperClub,round)=>{
      const next={taker:String(takerClub||""),keeper:String(keeperClub||""),round:round||1};
      next.style=pick(RUNUPS.map((_r,i)=>i),next.round);
      if(next.taker===lineup.taker&&next.keeper===lineup.keeper&&next.style===lineup.style)return false;
      lineup=next;useRigs(next.taker,next.keeper);dress(taker,next.taker,"outfield",next.keeper);dress(keeper,next.keeper,"gk",next.taker);
      return true;
    };
    const api={
      mode:"broadcast",
      reset(){if(plan&&clockNow()-snapAt>120)dissolveFrom();plan=null;frozenAt=null;ballFree.on=false;},
      // Who is on the pitch for the coming kick: the shooter's club takes it, the other club keeps goal.
      lineup(k){const fresh=k&&(String(k.taker||"")!==lineup.taker||String(k.keeper||"")!==lineup.keeper||pick(RUNUPS.map((_r,i)=>i),k.round||1)!==lineup.style);
        if(fresh&&!plan&&clockNow()-snapAt>120&&lineup.taker!==null)dissolveFrom();if(k)setLineup(k.taker,k.keeper,k.round);},
      // k = {shot: "L"|"M"|"R"|null (clock ran out), dive: "L"|"M"|"R", goal: boolean, animate: boolean, round}
      kick(k){
        plan=makePlan({shot:k.shot||null,dive:k.dive||"M",goal:Boolean(k.goal),round:k.round||1});
        ballFree.on=false;
        const still=!k.animate||reducedMotion();
        plan.startAt=clockNow()+(still?-SETTLE*1000:RUNUP*1000);frozenAt=null;
      },
      runUpMs:RUNUP*1000,
      // clock (ms, optional) also freezes the scene clock, so a proof can step through a dissolve frame by frame.
      at(t,clock){frozenAt=typeof t==="number"?t:null;frozenClock=typeof clock==="number"?clock:null;fit();paint();},
      dispose:free,
      lit:Boolean(scene.environment),
      probe(){return {mode:"broadcast",pixelRatio:renderer.getPixelRatio(),frameMs:+avg.toFixed(1),kicking:Boolean(plan),keeper:keeper.holder.position.toArray(),ball:ball.position.toArray(),taker:taker.hips.getWorldPosition(new T.Vector3()).toArray(),lineup:{...lineup},move:plan?plan.move.c:null,strike:struck,bodies:{taker:taker.body,keeper:keeper.body},palms:[gloveL.toArray(),gloveR.toArray()]};},
      get alive(){return alive;}
    };
    setLineup(clubs.playerOne,clubs.playerTwo,1);
    svg.parentNode.insertBefore(canvas,svg);
    svg.classList.add("cm3d-on");
    fit();cameraAt(0,0);renderer.compile(scene,camera);paint();
    ro?.observe(svg);
    raf=root.requestAnimationFrame(tick);
    return api;
  }
  function cm3Clock(){return root.performance?.now?.()??Date.now();}

  function loadImage(src){
    return new Promise(resolve=>{const img=new root.Image();img.decoding="async";img.onload=()=>resolve(img);img.onerror=()=>resolve(null);img.src=src;});
  }
  function loadEnv(T){
    if(typeof T.EXRLoader!=="function")return Promise.resolve(null);
    return new T.EXRLoader().setDataType(T.HalfFloatType).loadAsync(ENV_PATH).then(tex=>{tex.mapping=T.EquirectangularReflectionMapping;return tex;},error=>{try{root.console?.warn?.("Chamber Men 3D: no hall light",error);}catch(_error){}return null;});
  }
  // mount(svg) (cm3Mount): the 3D goal in place of the SVG art, resolved once its first frame is drawn; null when it cannot run here.
  // opts = {clubs:{playerOne, playerTwo}}: with the stadium and players it is the broadcast scene, else the hall.
  async function cm3Mount(svg,opts){
    if(!svg||!svg.parentNode||root.CMS_CHAMBER_MEN_3D==="off"||!hasWebgl2())return null;
    try{
      const phone=Math.min(root.screen?.width||1e4,root.screen?.height||1e4)<700;
      const broadcast=root.CMS_CHAMBER_MEN_BROADCAST!=="off",pre=broadcast?cm3Prefetch(phone,opts&&opts.clubs):null;
      const T=await loadEngine();
      const [env,marble,extras]=await Promise.all([loadEnv(T),loadImage(MARBLE_PATH),broadcast?cm3Extras(T,phone,pre):null]);
      if(!svg.isConnected){env?.dispose();if(extras)cm3FreeExtras(extras);return null;}
      let api=null;
      if(extras){
        try{api=buildBroadcast(T,svg,extras,opts);env?.dispose();}
        catch(error){try{root.console?.warn?.("Chamber Men broadcast scene failed; the hall plays.",error);}catch(_error){}cm3FreeExtras(extras);svg.parentNode?.querySelector?.(":scope > canvas.cmGoal3d")?.remove();svg.classList.remove("cm3d-on");api=null;}
      }
      if(!api)api=build(T,svg,env,marble);
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
