(function(root){
  "use strict";

  // r89 Chamber Men stadium kit (Nik 2026-11-04: "it should look like what it looks like in FIFA 17"). Builds, in three.js r187,
  // everything around the penalty except the players: the Showdown match ball, the goal (posts, bar, stanchions, a knotted
  // net), the pitch (mown stripes, chalk lines), LED ad boards (our own marks only), a two-tier stand behind the goal and two
  // side stands with a moving card crowd, the roof with its floodlights, and a night sky.
  //
  // Every texture is drawn by code in tools/chamber-men-assets (numpy + Pillow, rebuilt with `python3 build_all.py`), so the
  // whole kit is ours: no third-party licence, no real brand. Files: visual-assets/v10_1/chamber-men/assets/ (licences: tools/chamber-men-assets/LICENSES.md).
  //
  // Units and axes match js/chamberMenScene3d.js: metres, Y up, goal line on z 0, goal centred on x 0, posts 7.32 apart,
  // bar 2.44 high, ball radius .11, penalty spot at z +11, the pitch runs toward +z.
  //
  // Use:
  //   const kit=await CareerModeChamberMenStadium.load(THREE,{phone});           // textures (about 1.3 MB phone, 2.6 MB desktop)
  //   const s=CareerModeChamberMenStadium.build(THREE,kit,{phone,posts:"white",home:0x7a1f3d,away:0x6cabdd,aniso});
  //   scene.add(s.group);  s.ball (mesh), s.goal.back (net sheet that bulges), s.update(seconds,excitement 0..1), s.dispose()
  // Only names already in the vendor build are used (no loaders beyond TextureLoader).
  const BASE="visual-assets/v10_1/chamber-men/assets/";
  const GOAL_W=7.32,GOAL_H=2.44,HALF=GOAL_W/2,BALL_R=.11;
  const PITCH_HALF_W=34,PITCH_L=105,BOX_D=16.5,BOX_HALF_W=20.16,SIX_D=5.5,SIX_HALF_W=9.16,SPOT_Z=11,ARC_R=9.15;

  const FILES={
    desktop:{crowd:"crowd_atlas_2k.webp"},
    phone:{crowd:"crowd_atlas_1k.webp"},
    both:{crowdTint:"crowd_tint_1k.webp",net:"net_cell_512.webp",seats:"seats_512.webp",concrete:"concrete_512.webp",flare:"flare_256.webp"}
  };
  // r90 grass: TextureCan "Ground 0040" (CC0, mown football turf, Nik's download 2026-11-07), one size per device level
  // (js/gfxTier.js): light 1k colour + 512 normal, medium/high 2k + 1k, extra/ultra 4k + 2k.
  const GRASS=[["grass_color_V2_1k.webp","grass_normal_V2_512.webp"],["grass_color_V2_2k.webp","grass_normal_V2_1k.webp"],["grass_color_V2_2k.webp","grass_normal_V2_1k.webp"],
    ["grass_color_V2_4k.webp","grass_normal_V2_2k.webp"],["grass_color_V2_4k.webp","grass_normal_V2_2k.webp"]];
  // r90 ball: Innerscene "Soccer ball" (CC0), a classic 32-panel cover with match wear (tools/chamber-men-assets/gen_ball_v3.py).
  // It is 20 to 80 px tall on screen, so light draws it at 512, medium/high at 1k, extra/ultra at 2k (the old 4k set cost
  // ~250 MB of GPU memory for a ball).
  const BALL_MESH="ball_mesh_V3.glb",BALL=["512","1k","1k","2k","2k"];
  // r90 big stadium: Innerscene "Football stadium" (CC0), trimmed and re-packed by tools/chamber-men-assets/gen_bowl.py.
  // High, Extra and Ultra draw it with 1k textures (a 2k set cost ~370 MB of GPU memory more for a bowl that fills a band at
  // the top of the penalty framing, with no visible gain); Light and Balanced never load it (they keep the built stands),
  // and a bowl that fails to load leaves the built stands in place. Its goals lie on the source's x axis: turned a quarter
  // turn and moved 52.5 m, its near goal line lands on ours.
  const BOWL={2:"stadium_bowl_V1_1k.glb",3:"stadium_bowl_V1_1k.glb",4:"stadium_bowl_V1_1k.glb"},BOWL_YAW=Math.PI/2,BOWL_Z=52.5;
  // Colour maps are sRGB; normal, roughness/metal and masks are linear data.
  const SRGB=new Set(["ballColor","crowd","grass","seats","concrete","flare"]);

  // The files a level loads: textures by role, and the big stadium (High and above on a computer or a strong phone).
  function pick(opts){
    const o=opts||{},level=Number.isInteger(o.level)?Math.max(0,Math.min(4,o.level)):(o.phone?0:2),[grass,grassNormal]=GRASS[level];
    const b=BALL[level],ballSet={ballColor:`ball_color_V3_${b}.webp`,ballNormal:`ball_normal_V3_${b}.webp`,ballOrm:`ball_orm_V3_${b}.webp`};
    const set={...(o.phone?FILES.phone:FILES.desktop),...FILES.both,...ballSet,grass,grassNormal};
    return {set,base:o.base||BASE,bowlFile:o.bowl===false||o.phone&&level<2?null:BOWL[level]};
  }
  // r90 M1: every URL load() fetches at this level, for the season page to warm ahead (js/chamberMenScene3d.js warm()).
  function urls(opts){const p=pick(opts);return [BALL_MESH,...(p.bowlFile?[p.bowlFile]:[]),...Object.values(p.set)].map(f=>p.base+f);}
  function load(T,opts){
    const o=opts||{},{set,base,bowlFile}=pick(o),loader=new T.TextureLoader();
    const keys=Object.keys(set);
    // The ball and bowl are meshopt-compressed (o.meshopt: the decoder the scene loaded).
    const gltf=()=>{const l=new T.GLTFLoader();if(o.meshopt&&typeof l.setMeshoptDecoder==="function")l.setMeshoptDecoder(o.meshopt);return l;};
    const mesh=gltf().loadAsync(base+BALL_MESH).then(g=>{let geo=null;g.scene.traverse(x=>{if(!geo&&x.isMesh)geo=x.geometry;});if(!geo)throw new Error("ball mesh");return geo;});
    const bowl=bowlFile?gltf().loadAsync(base+bowlFile).then(g=>g.scene,error=>{try{root.console?.warn?.("Chamber Men: no big stadium; the built stands stay.",error);}catch(_error){}return null;}):Promise.resolve(null);
    return Promise.all([mesh,bowl,...keys.map(k=>loader.loadAsync(base+set[k]).then(t=>{t.colorSpace=SRGB.has(k)?T.SRGBColorSpace:T.NoColorSpace;return t;}))]).then(([geo,bowlScene,...list])=>{
      // glTF UVs: no vertical flip.
      const tex={};keys.forEach((k,i)=>{tex[k]=list[i];if(k.startsWith("ball"))list[i].flipY=false;});tex.ballGeo=geo;tex.bowl=bowlScene;return tex;
    });
  }

  // r90 LOOK (L02): the crowd atlas cells whose shirt carries the tint mask (crowd_tint_1k.webp, 16x12 cells, an arms-down /
  // arms-up pair per cell). Club fans wear only these, so every shirt in a club block is the club's colour; the other cells
  // (fixed jackets) are the few neutral fans, darkened for a night game.
  const TINT_CELLS=[0,1,3,4,5,6,11,13,14,15,17,18,20,21,22,23,25,26,27,28,30,32,33,34,35,36,37,38,39,40,47,49,50,51,53,55,56,57,58,59,60,61,62,
    65,66,67,68,69,71,76,77,78,79,80,81,83,86,89,91,92,93];
  const PLAIN_CELLS=Array.from({length:96},(_v,i)=>i).filter(i=>!TINT_CELLS.includes(i));

  // r90 LOOK (L03): the LED boards, drawn at run time on canvases (no image files): our CM17 wordmark, each club's crest and
  // name, and a plain gold pattern, black and gold like the rest of the game. Each board holds its whole message inside its
  // own 8 m with room to spare, and a gold hairline runs along the top and bottom of every board, so a run reads as one
  // continuous LED strip and no word ever crosses a join. Crests come from visualIdentity's getClubCrestSvg (drawn by
  // code, no lettering); until a crest image decodes, the board shows the name alone.
  const BOARD_GOLD="#f2c45b",BOARD_INK="#0a0806",BOARD_TEXT="#efe4c8";
  function boardArt(T,o){
    const d=root.document;if(!d||typeof d.createElement!=="function")return null;
    const W=o.px||1024,H=Math.round(W/8.9),list=[];
    const font=px=>`700 ${px}px "Barlow Condensed","Arial Narrow",Arial,sans-serif`;
    // The biggest size up to maxH whose width fits maxW.
    const fit=(g,text,maxW,maxH)=>{let px=Math.max(8,Math.round(maxH));g.font=font(px);const w=g.measureText(text).width;if(w>maxW){px=Math.max(8,Math.floor(px*maxW/w));g.font=font(px);}return g.measureText(text).width;};
    const base=g=>{
      const gr=g.createLinearGradient(0,0,0,H);gr.addColorStop(0,"#17130d");gr.addColorStop(.5,BOARD_INK);gr.addColorStop(1,"#050403");
      g.fillStyle=gr;g.fillRect(0,0,W,H);
      // LED rows: a faint dark line every few pixels, so up close it reads as a screen, not a printed sheet.
      g.fillStyle="rgba(0,0,0,.28)";const step=Math.max(3,Math.round(H/36));for(let y=0;y<H;y+=step)g.fillRect(0,y,W,1);
      g.fillStyle=BOARD_GOLD;const hl=Math.max(2,Math.round(H*.035));g.fillRect(0,Math.round(H*.06),W,hl);g.fillRect(0,H-Math.round(H*.06)-hl,W,hl);
    };
    const chevrons=(g,y0,y1,alpha)=>{
      const h=y1-y0,pitch=W/32;g.strokeStyle=`rgba(242,196,91,${alpha})`;g.lineWidth=Math.max(2,h*.12);
      for(let x=-pitch;x<W+pitch;x+=pitch){g.beginPath();g.moveTo(x,y0);g.lineTo(x+pitch*.45,(y0+y1)/2);g.lineTo(x,y1);g.stroke();}
    };
    const crestImg={};
    const crestOf=club=>{
      if(!club||typeof o.crest!=="function"||typeof root.Image!=="function")return null;
      if(crestImg[club]!==undefined)return crestImg[club];
      crestImg[club]=null;
      try{const svg=String(o.crest(club)||"");if(!svg.startsWith("<svg"))return null;
        const img=new root.Image();img.decoding="async";
        // Only a crest that leaves the canvas clean goes on (a tainted canvas cannot be uploaded to WebGL).
        img.onload=()=>{try{const c=d.createElement("canvas");c.width=c.height=2;const g=c.getContext("2d");g.drawImage(img,0,0,2,2);g.getImageData(0,0,1,1);}catch(_error){return;}
          crestImg[club]=img;for(const b of list)b.paint();};
        img.src="data:image/svg+xml;charset=utf-8,"+encodeURIComponent(svg.replace("<svg ",`<svg width="240" height="288" `));}catch(_error){}
      return null;
    };
    const make=draw=>{
      const c=d.createElement("canvas");c.width=W;c.height=H;const g=c.getContext("2d");if(!g)return null;
      const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.wrapS=T.RepeatWrapping;t.anisotropy=o.aniso||4;
      const b={t,paint(){base(g);draw(g);t.needsUpdate=true;}};b.paint();list.push(b);return t;
    };
    // The wordmark: CM17 in the middle, gold rules out to the board's ends.
    const word=make(g=>{
      const w=fit(g,"CM17",W*.4,H*.6);g.fillStyle=BOARD_GOLD;g.textAlign="center";g.textBaseline="middle";g.fillText("CM17",W/2,H*.53);
      const r=Math.max(2,Math.round(H*.03)),gap=H*.35;g.fillRect(W*.1,H/2-r/2,W/2-w/2-gap-W*.1,r);g.fillRect(W/2+w/2+gap,H/2-r/2,W*.4-w/2-gap,r);
    });
    // Matchday: both crests either side of the wordmark.
    const duo=make(g=>{
      const w=fit(g,"CM17",W*.22,H*.56);g.fillStyle=BOARD_GOLD;g.textAlign="center";g.textBaseline="middle";g.fillText("CM17",W/2,H*.53);
      const ch=H*.72,cw=ch*120/144,y=(H-ch)/2;
      for(const [club,x] of [[o.home,W/2-w/2-H*.5-cw],[o.away,W/2+w/2+H*.5]]){const img=crestOf(club);if(img)g.drawImage(img,x,y,cw,ch);}
    });
    // A club: its crest at the end nearest the goal, its name beside it, the pair inside 60% of the board.
    const club=(name,inner)=>make(g=>{
      const label=String(name||"").toUpperCase(),ch=H*.72,cw=ch*120/144,pad=W*.07,gap=H*.3,img=crestOf(name);
      const room=W*.6-(img?cw+gap:0);g.fillStyle=BOARD_TEXT;g.textBaseline="middle";
      const tw=label?fit(g,label,room,H*.48):0;
      const x0=inner==="left"?pad:W-pad-(img?cw+gap:0)-tw;
      if(inner==="left"){if(img)g.drawImage(img,x0,(H-ch)/2,cw,ch);g.textAlign="left";if(label)g.fillText(label,x0+(img?cw+gap:0),H*.54);}
      else{g.textAlign="left";if(label)g.fillText(label,x0,H*.54);if(img)g.drawImage(img,x0+tw+gap,(H-ch)/2,cw,ch);}
    });
    const homeL=club(o.home,"left"),homeR=club(o.home,"right"),awayL=club(o.away,"left"),awayR=club(o.away,"right");
    const pattern=make(g=>chevrons(g,H*.22,H*.78,.42));
    // The fascia ribbon between the tiers: the same strip, chevrons only, repeated along the stand.
    const ribbon=make(g=>chevrons(g,H*.3,H*.7,.3));
    // The page's condensed face may still be loading: draw again once it is in.
    try{d.fonts?.load?.(font(40)).then(()=>{for(const b of list)b.paint();},()=>{});}catch(_error){}
    return {word,duo,homeL,homeR,awayL,awayR,pattern,ribbon,textures:list.map(b=>b.t)};
  }

  // A small deterministic random, so the crowd is the same every load.
  function stadiumSeeded(seed){let s=seed>>>0;return ()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};}

  function stadiumBuild(T,tex,opts){
    const o=opts||{},phone=Boolean(o.phone),aniso=o.aniso||4,own=[],keep=x=>{own.push(x);return x;};
    const group=new T.Group();group.name="cmStadium";
    const add=(g,m,parent)=>{const x=new T.Mesh(keep(g),m);(parent||group).add(x);return x;};
    for(const t of Object.values(tex))if(t&&t.isTexture)t.anisotropy=aniso;

    // ---------- ball ----------
    const ballMat=keep(new T.MeshPhysicalMaterial({map:tex.ballColor,normalMap:tex.ballNormal,roughnessMap:tex.ballOrm,metalnessMap:tex.ballOrm,
      roughness:1,metalness:1,clearcoat:.3,clearcoatRoughness:.35}));
    // The source mesh has radius 0.1098 m: scaled to ours once.
    const ballGeo=tex.ballGeo.clone();ballGeo.computeBoundingSphere();ballGeo.scale(BALL_R/ballGeo.boundingSphere.radius,BALL_R/ballGeo.boundingSphere.radius,BALL_R/ballGeo.boundingSphere.radius);
    const ball=add(ballGeo,ballMat);ball.castShadow=true;ball.position.set(0,BALL_R,SPOT_Z);ball.name="cmBall";

    // ---------- pitch ----------
    const grass=tex.grass;grass.wrapS=grass.wrapT=T.RepeatWrapping;grass.repeat.set(130/3.5,150/3.5);// one 3.5 m tile
    const gn=tex.grassNormal;gn.wrapS=gn.wrapT=T.RepeatWrapping;gn.repeat.copy(grass.repeat);
    // The turf photo is a sunny yellow-green; under floodlights a TV pitch reads cooler and deeper.
    const pitchMat=keep(new T.MeshStandardMaterial({map:grass,color:new T.Color(.74,.9,.78),normalMap:gn,normalScale:new T.Vector2(.6,.6),roughness:.92,metalness:0}));
    // Mown stripes: bands 5.5 m deep parallel to the goal line, light and dark (direction of the cut), plus a soft wear patch
    // around the spot and in the six-yard box. Done in the shader so the grass detail stays one small tiling texture.
    pitchMat.onBeforeCompile=sh=>{
      sh.vertexShader=sh.vertexShader.replace("#include <common>","#include <common>\nvarying vec3 vCmWorld;").replace("#include <worldpos_vertex>","#include <worldpos_vertex>\nvCmWorld=(modelMatrix*vec4(transformed,1.0)).xyz;");
      sh.fragmentShader=sh.fragmentShader.replace("#include <common>","#include <common>\nvarying vec3 vCmWorld;").replace("#include <map_fragment>",
        "#include <map_fragment>\n{float band=step(.5,fract(vCmWorld.z/11.0+.25));float edge=smoothstep(.0,.04,abs(fract(vCmWorld.z/5.5)-.5)*2.0-.0);"+
        "diffuseColor.rgb*=mix(.78,1.12,band);"+
        "float wear=exp(-pow(length(vCmWorld.xz-vec2(0.0,11.0))/1.3,2.0))*.45+exp(-pow(length((vCmWorld.xz-vec2(0.0,2.2))*vec2(.35,1.0))/1.6,2.0))*.25;"+
        "diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(1.05,.92,.7),wear);"+
        // r90 (Nik 2026-11-08, lighting that makes sense): a floodlit pitch is lit evenly (broadcast lighting holds the
        // whole field within about 0.7 to 1 of its brightest point), the banks overlapping a little more on the box than far
        // out; the light falls away only past the touchlines and the goal line, where no bank is aimed.
        "float cmOut=max(abs(vCmWorld.x)-35.0,0.0)+max(-1.5-vCmWorld.z,0.0);"+
        "diffuseColor.rgb*=mix(1.04,.86,smoothstep(8.0,45.0,length(vCmWorld.xz-vec2(0.0,9.0))))*mix(1.0,.5,smoothstep(0.0,8.0,cmOut));}");
    };
    const pitch=add(new T.PlaneGeometry(130,150),pitchMat);pitch.rotation.x=-Math.PI/2;pitch.position.set(0,0,PITCH_L/2);pitch.receiveShadow=true;
    // Chalk lines for the whole 105 x 68 pitch: one merged geometry a few mm over the grass.
    const chalk=keep(new T.MeshStandardMaterial({color:new T.Color(.93,.93,.9),roughness:.9,polygonOffset:true,polygonOffsetFactor:-2}));
    {const W=.12,pos=[],idx=[];let n=0;
      const quad=(a,b,c,d)=>{// counter-clockwise seen from above, so the face (and its normal) points up
        if((b[1]-a[1])*(c[0]-a[0])-(b[0]-a[0])*(c[1]-a[1])<0){const t=b;b=d;d=t;}
        for(const q of [a,b,c,d])pos.push(q[0],.006,q[1]);idx.push(n,n+1,n+2,n,n+2,n+3);n+=4;};
      const rect=(x0,z0,x1,z1)=>quad([x0,z0],[x1,z0],[x1,z1],[x0,z1]);
      const arc=(cx,cz,r,a0,a1,seg)=>{for(let i=0;i<seg;i+=1){const a=a0+(a1-a0)*i/seg,b=a0+(a1-a0)*(i+1)/seg,p=(t,rr)=>[cx+Math.sin(t)*rr,cz+Math.cos(t)*rr];
        quad(p(a,r-W/2),p(b,r-W/2),p(b,r+W/2),p(a,r+W/2));}};
      // One end: goal line at zl, the pitch runs toward zl+dir*... (dir +1 for the near end, -1 for the far end).
      const end=(zl,dir)=>{const z=d=>zl+dir*d;
        rect(-SIX_HALF_W,z(SIX_D-W),SIX_HALF_W,z(SIX_D));rect(-SIX_HALF_W,zl,-SIX_HALF_W+W,z(SIX_D));rect(SIX_HALF_W-W,zl,SIX_HALF_W,z(SIX_D));
        rect(-BOX_HALF_W,z(BOX_D-W),BOX_HALF_W,z(BOX_D));rect(-BOX_HALF_W,zl,-BOX_HALF_W+W,z(BOX_D));rect(BOX_HALF_W-W,zl,BOX_HALF_W,z(BOX_D));
        // The D: the part of the 9.15 m circle round the spot outside the box.
        const a0=Math.acos((BOX_D-SPOT_Z)/ARC_R);arc(0,z(SPOT_Z),ARC_R,(dir>0?0:Math.PI)-a0,(dir>0?0:Math.PI)+a0,40);
        for(const cx of [-PITCH_HALF_W,PITCH_HALF_W])arc(cx,zl,1,cx<0?(dir>0?0:Math.PI/2):(dir>0?-Math.PI/2:Math.PI),cx<0?(dir>0?Math.PI/2:Math.PI):(dir>0?0:Math.PI*1.5),12);
      };
      rect(-PITCH_HALF_W,0,PITCH_HALF_W,W);rect(-PITCH_HALF_W,PITCH_L-W,PITCH_HALF_W,PITCH_L);// goal lines (their outer edge is the line)
      rect(-PITCH_HALF_W,0,-PITCH_HALF_W+W,PITCH_L);rect(PITCH_HALF_W-W,0,PITCH_HALF_W,PITCH_L);// touchlines
      rect(-PITCH_HALF_W,PITCH_L/2-W/2,PITCH_HALF_W,PITCH_L/2+W/2);arc(0,PITCH_L/2,ARC_R,0,Math.PI*2,72);// halfway line, centre circle
      end(0,1);end(PITCH_L,-1);
      const g=new T.BufferGeometry();g.setAttribute("position",new T.Float32BufferAttribute(pos,3));g.setIndex(idx);
      const nrm=new Float32Array(pos.length);for(let i=1;i<nrm.length;i+=3)nrm[i]=1;g.setAttribute("normal",new T.BufferAttribute(nrm,3));
      const lines=add(g,chalk);lines.receiveShadow=true;}
    for(const z of [SPOT_Z,PITCH_L-SPOT_Z,PITCH_L/2]){const spot=add(new T.CircleGeometry(z===SPOT_Z?.1:.15,28),chalk);spot.rotation.x=-Math.PI/2;spot.position.set(0,.007,z);spot.receiveShadow=true;}

    // ---------- goal ----------
    const white=o.posts!=="gold";
    const postMat=keep(white
      ?new T.MeshPhysicalMaterial({color:new T.Color(.95,.95,.94),roughness:.32,clearcoat:.6,clearcoatRoughness:.15})
      :new T.MeshPhysicalMaterial({color:new T.Color(1,.77,.36),metalness:1,roughness:.17,clearcoat:.5,clearcoatRoughness:.08}));
    const frameMat=keep(new T.MeshStandardMaterial({color:white?new T.Color(.8,.8,.8):new T.Color(.36,.25,.09),metalness:white?.2:1,roughness:.45}));
    const goal=new T.Group();goal.name="cmGoal";group.add(goal);
    // Posts and bar: 12 cm round (Law 1 allows round or elliptical; FIFA 17 draws them round and white).
    const PR=.06;
    for(const x of [-HALF,HALF]){const p=add(new T.CylinderGeometry(PR,PR,GOAL_H+PR,32),postMat,goal);p.position.set(x,(GOAL_H+PR)/2,0);p.castShadow=true;}
    {const b=add(new T.CylinderGeometry(PR,PR,GOAL_W+PR*2,32),postMat,goal);b.rotation.z=Math.PI/2;b.position.set(0,GOAL_H+PR/2,0);b.castShadow=true;}
    // The far goal, 105 m away: posts and bar only (a dot on screen, seen on the keeper's-eye and reverse shots).
    {const far=new T.Group();far.position.z=PITCH_L;group.add(far);
      for(const x of [-HALF,HALF]){const p=add(new T.CylinderGeometry(PR,PR,GOAL_H,12),postMat,far);p.position.set(x,GOAL_H/2,0);}
      const b=add(new T.CylinderGeometry(PR,PR,GOAL_W,12),postMat,far);b.rotation.z=Math.PI/2;b.position.set(0,GOAL_H,0);}
    // Box net frame: a stanchion curving back from each top corner to a ground bar 2.2 m behind the line.
    const DEPTH=2.2,TOP_BACK=1.0,ROOF_H=GOAL_H-.04;
    for(const x of [-HALF,HALF]){
      const c=new T.CatmullRomCurve3([new T.Vector3(x,ROOF_H,-.06),new T.Vector3(x,ROOF_H-.02,-TOP_BACK),new T.Vector3(x,ROOF_H*.62,-DEPTH+.12),new T.Vector3(x,.02,-DEPTH)]);
      add(new T.TubeGeometry(c,32,.025,10,false),frameMat,goal).castShadow=true;
      const g=add(new T.CylinderGeometry(.022,.022,DEPTH,10),frameMat,goal);g.rotation.x=Math.PI/2;g.position.set(x,.022,-DEPTH/2);
    }
    {const g=add(new T.CylinderGeometry(.022,.022,GOAL_W,12),frameMat,goal);g.rotation.z=Math.PI/2;g.position.set(0,.022,-DEPTH);}
    // Net: 12 cm square knotted cells (tex.net is one cell). alphaTest keeps it crisp and cheap; with MSAA on it uses
    // alpha-to-coverage for soft edges. The back sheet has many vertices so it can bulge where the ball hits.
    const CELL=.12;
    const netTex=tex.net;netTex.wrapS=netTex.wrapT=T.RepeatWrapping;
    // Blended, not alpha-tested: far away the mipmapped cells average into the soft white veil a real net shows on TV,
    // close up every cord and knot is sharp. depthWrite off so the net never hides the ball or the keeper behind it.
    const netMat=keep(new T.MeshStandardMaterial({map:netTex,transparent:true,opacity:1,depthWrite:false,side:T.DoubleSide,roughness:.85,color:new T.Color(1.6,1.6,1.6)}));
    const sheet=(pts,nu,nv)=>{// pts: function(u,v)->[x,y,z]
      const pos=[],uv=[],idx=[];
      for(let j=0;j<=nv;j+=1)for(let i=0;i<=nu;i+=1){const p=pts(i/nu,j/nv);pos.push(p[0],p[1],p[2]);uv.push(p[3],p[4]);}
      for(let j=0;j<nv;j+=1)for(let i=0;i<nu;i+=1){const k=j*(nu+1)+i;idx.push(k,k+nu+1,k+1,k+1,k+nu+1,k+nu+2);}
      const g=new T.BufferGeometry();g.setAttribute("position",new T.Float32BufferAttribute(pos,3));g.setAttribute("uv",new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g;
    };
    // The back-and-roof profile (same curve as the stanchions), as a function of s 0..1 from the bar down to the ground.
    const prof=new T.CatmullRomCurve3([new T.Vector3(0,ROOF_H,-.06),new T.Vector3(0,ROOF_H-.02,-TOP_BACK),new T.Vector3(0,ROOF_H*.62,-DEPTH+.12),new T.Vector3(0,.02,-DEPTH)]);
    const profLen=prof.getLength(),sag=(u)=>Math.sin(Math.PI*u);
    const backGeo=sheet((u,v)=>{const p=prof.getPointAt(v),x=-HALF+GOAL_W*u,s=sag(u)*Math.sin(Math.PI*v);return [x,p.y-.05*s,p.z-.06*s,GOAL_W*u/CELL,profLen*(1-v)/CELL];},phone?40:61,phone?24:36);
    backGeo.attributes.position.setUsage(T.DynamicDrawUsage);
    const back=add(backGeo,netMat,goal);back.name="cmNetBack";
    // Side nets: the panel under the profile, from the stanchion curve down to the ground, in the plane of each post.
    for(const x of [-HALF,HALF]){
      const g=sheet((u,v)=>{const p=prof.getPointAt(v);return [x,p.y*(1-u)+.02*u,p.z,-p.z/CELL,p.y*(1-u)/CELL];},8,phone?14:20);
      add(g,netMat,goal);
    }
    const backBase=Float32Array.from(backGeo.attributes.position.array);

    // ---------- ad boards ----------
    // LED boards: unlit (they are lights), just bright enough to bloom a little at threshold 1. r90 LOOK (L03): drawn here
    // (boardArt), the run behind the goal centred on it: the wordmark right behind the goal, a club either side (home on the
    // left, away on the right, the crest at the end nearest the goal, swapping sides with the matchday board every 9 s), the
    // pattern further out. At the penalty framing every word on screen sits whole inside its board on any window.
    const art=boardArt(T,{px:o.boardPx||1024,home:o.homeName,away:o.awayName,crest:o.crest,aniso});
    if(art)for(const t of art.textures)keep(t);
    const boardMat=t=>keep(new T.MeshBasicMaterial({map:t||null,color:t?new T.Color(1.15,1.15,1.15):new T.Color(.04,.035,.03),toneMapped:true}));
    const mWord=boardMat(art&&art.word),mLeft=boardMat(art&&art.homeR),mRight=boardMat(art&&art.awayL),mPattern=boardMat(art&&art.pattern),mRibbon=boardMat(art&&art.ribbon);
    let boardStep=-1;
    const backBoardMat=keep(new T.MeshStandardMaterial({color:new T.Color(.05,.05,.055),roughness:.6}));
    // A run of 8 m boards along local x, facing local +z, leaning back a little; parent places and turns the run. The first
    // board may be shorter (first), so a whole board sits where the run wants it; a short board always carries the pattern.
    const boardRun=(parent,x0,x1,pick,first)=>{
      const BW=8,BH=.9;let i=0;
      for(let x=x0;x<x1-.01;i+=1){const w=Math.min(i===0&&first?first:BW,x1-x),m=w<BW-.01?mPattern:pick(i,x+w/2);
        const g=new T.PlaneGeometry(w,BH);const uv=g.attributes.uv;for(let k=0;k<uv.count;k+=1)uv.setX(k,uv.getX(k)*w/BW);
        const p=add(g,m,parent);p.position.set(x+w/2,BH/2+.02,0);p.rotation.x=-.12;p.userData.bake=true;
        const bk=add(new T.BoxGeometry(w,BH,.18),backBoardMat,parent);bk.position.set(x+w/2,BH/2,-.1);bk.rotation.x=-.12;bk.receiveShadow=true;bk.userData.bake=true;
        x+=w;}
    };
    // Behind the goal: wordmark at the middle (centre x 0), the clubs either side, pattern beyond. Elsewhere (never in the
    // penalty framing): wordmark and pattern in turn.
    const behind=(_i,xc)=>Math.abs(xc)<.5?mWord:Math.abs(xc+8)<.5?mLeft:Math.abs(xc-8)<.5?mRight:mPattern;
    const around=i=>i%2?mPattern:mWord;
    const runs=[{x:0,z:-4.6,yaw:0,x0:-PITCH_HALF_W-6,x1:PITCH_HALF_W+6,pick:behind,first:4},
      {x:0,z:PITCH_L+4.6,yaw:Math.PI,x0:-PITCH_HALF_W-6,x1:PITCH_HALF_W+6,pick:around,first:4},
      {x:-(PITCH_HALF_W+4),z:0,yaw:Math.PI/2,x0:-PITCH_L-2,x1:2,pick:around},
      {x:PITCH_HALF_W+4,z:0,yaw:-Math.PI/2,x0:-2,x1:PITCH_L+2,pick:around}];
    for(const r of runs){const g=new T.Group();g.position.set(r.x,0,r.z);g.rotation.y=r.yaw;group.add(g);boardRun(g,r.x0,r.x1,r.pick,r.first);}

    // ---------- stands ----------
    const concrete=tex.concrete;concrete.wrapS=concrete.wrapT=T.RepeatWrapping;
    // r90 LOOK (L01): a night stand. The floodlights catch the front rows and the rows fall away into the dark under the
    // roof (the stands are lit by the same directional lights as the pitch, so without this they read flat and evenly lit).
    const nightStand=m=>{m.onBeforeCompile=sh=>{
      sh.vertexShader=sh.vertexShader.replace("#include <common>","#include <common>\nvarying float vCmY;").replace("#include <worldpos_vertex>","#include <worldpos_vertex>\nvCmY=(modelMatrix*vec4(transformed,1.0)).y;");
      sh.fragmentShader=sh.fragmentShader.replace("#include <common>","#include <common>\nvarying float vCmY;").replace("#include <map_fragment>","#include <map_fragment>\ndiffuseColor.rgb*=mix(vec3(1.0),vec3(.14,.16,.25),smoothstep(.5,12.0,vCmY));");};
      m.customProgramCacheKey=()=>"cmNightStand";return m;};
    const concMat=keep(nightStand(new T.MeshStandardMaterial({map:concrete,roughness:.9,color:new T.Color(.34,.34,.37)})));
    const seatsTex=tex.seats;seatsTex.wrapS=T.RepeatWrapping;seatsTex.wrapT=T.ClampToEdgeWrapping;
    const stepMat=keep(nightStand(new T.MeshStandardMaterial({map:seatsTex,roughness:.75,color:new T.Color(.62,.62,.66)})));
    const darkMat=keep(new T.MeshStandardMaterial({color:new T.Color(.025,.025,.03),roughness:.8}));
    const seatsAll=[];// [x,y,z,yaw] for the crowd
    // One tier: rows of steps (tread + riser), each row one v of the seat texture, u = 1 m.
    function tier(x0,x1,zFront,yFront,rows,depth,rise,si){
      const pos=[],uv=[],idx=[];let n=0;const len=x1-x0;
      for(let r=0;r<rows;r+=1){
        const z=zFront-r*depth,y=yFront+r*rise;
        // riser (faces +z), then tread
        const quad=(a,b,c,d,v0,v1)=>{pos.push(...a,...b,...c,...d);uv.push(0,v0,len,v0,len,v1,0,v1);idx.push(n,n+1,n+2,n,n+2,n+3);n+=4;};
        quad([x0,y,z],[x1,y,z],[x1,y+rise,z],[x0,y+rise,z],0,.41);
        quad([x0,y+rise,z],[x1,y+rise,z],[x1,y+rise,z-depth],[x0,y+rise,z-depth],.41,1);
        for(let x=x0+.25;x<x1-.2;x+=.5)seatsAll.push({x,y:y+rise,z:z-depth*.55,si});
      }
      const g=new T.BufferGeometry();g.setAttribute("position",new T.Float32BufferAttribute(pos,3));g.setAttribute("uv",new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();
      return g;
    }
    function stand(si,x0,x1,yaw,origin,big){
      // Lower tier, a lit fascia with a gold line, the upper tier, back wall, roof with floodlights. Built facing +z with
      // its front at z 0, then turned and placed (origin {x,z}).
      const st=new T.Group();
      const lowerRows=big?22:18,upperRows=big?18:0;
      const lower=add(tier(x0,x1,0,1.2,lowerRows,.82,.42,si),stepMat,st);lower.receiveShadow=true;
      const front=add(new T.BoxGeometry(x1-x0,1.2,.4),concMat,st);front.position.set((x0+x1)/2,.6,.2);
      const topLow=1.2+lowerRows*.42,backLow=-lowerRows*.82;
      // Concourse band between tiers: dark with a gold LED ribbon (the FIFA 17 stadiums all have one).
      const fg=new T.PlaneGeometry(x1-x0,1.3),fu=fg.attributes.uv;for(let k=0;k<fu.count;k+=1)fu.setX(k,fu.getX(k)*(x1-x0)/8);
      const fascia=add(fg,mRibbon,st);fascia.position.set((x0+x1)/2,topLow+1.6,backLow-.3);
      let topY=topLow+2.4,backZ=backLow-.6;
      if(upperRows){
        const upper=add(tier(x0,x1,backLow-1.2,topLow+2.3,upperRows,.8,.58,si),stepMat,st);upper.receiveShadow=true;
        topY=topLow+2.3+upperRows*.58;backZ=backLow-1.2-upperRows*.8;
      }
      // Back wall and the void under the steps (never seen from the pitch, but closes the silhouette against the sky).
      const wall=add(new T.PlaneGeometry(x1-x0,topY+6),darkMat,st);wall.position.set((x0+x1)/2,(topY+6)/2,backZ-.3);
      // Roof: a thin slab overhanging the stand, light truss edge, a row of floodlight panels on its front edge.
      const roofY=topY+5,roofFront=big?-2:0,roofBack=backZ-1,roofD=roofFront-roofBack;
      const roof=add(new T.BoxGeometry(x1-x0+2,.5,roofD),darkMat,st);roof.position.set((x0+x1)/2,roofY,(roofFront+roofBack)/2);
      const edge=add(new T.BoxGeometry(x1-x0+2,.9,.3),concMat,st);edge.position.set((x0+x1)/2,roofY-.2,roofFront);
      const lamps=[];for(let x=x0+3;x<x1-2;x+=6)lamps.push(x);
      st.userData.lamps=lamps.map(x=>new T.Vector3(x,roofY-.75,roofFront+.2));
      const lampMat=keep(new T.MeshBasicMaterial({color:new T.Color(2.2,2.1,1.9)}));
      for(const v of st.userData.lamps){const l=add(new T.PlaneGeometry(2.2,.5),lampMat,st);l.position.copy(v);l.rotation.x=.5;l.userData.bake=true;}
      st.rotation.y=yaw;st.position.set(origin.x,0,origin.z);group.add(st);
      return st;
    }
    // Behind the goal: the big two-tier home end. Each side: one tier along the touchline, turned to face the pitch
    // (yaw +90 turns local +z to world +x, so the left stand's rows run from local x -132..27 = world z 132..-27; the part behind
    // the goal line closes the corner beside the end stand).
    const stands=[stand(0,-(PITCH_HALF_W+9),PITCH_HALF_W+9,0,{x:0,z:-8.5},true),stand(1,-(PITCH_L+27),27,Math.PI/2,{x:-(PITCH_HALF_W+9),z:0},false),
      stand(2,-27,PITCH_L+27,-Math.PI/2,{x:PITCH_HALF_W+9,z:0},false),stand(3,-(PITCH_HALF_W+9),PITCH_HALF_W+9,Math.PI,{x:0,z:PITCH_L+8.5},false)];
    for(const st of stands)st.updateMatrixWorld(true);

    // ---------- r90 big stadium (High and above) ----------
    // The bowl takes the built stands' place (they stay built for the crowd's fallback and are hidden); its concrete and
    // seats get the same night fall-off; its glass stays a plain tint. The crowd sits on its seat rows (cmRows).
    const bowl=tex.bowl&&tex.bowl.isObject3D?tex.bowl:null;
    const bowlSeats=[];
    if(bowl){
      bowl.rotation.y=BOWL_YAW;bowl.position.set(0,0,BOWL_Z);bowl.name="cmBowl";group.add(bowl);bowl.updateMatrixWorld(true);
      const seen=new Set();
      bowl.traverse(x=>{if(!x.isMesh)return;x.receiveShadow=true;x.castShadow=false;keep(x.geometry);
        for(const m of [].concat(x.material)){if(!m||seen.has(m))continue;seen.add(m);keep(m);
          for(const k of ["map","normalMap","roughnessMap","metalnessMap","emissiveMap","aoMap"])if(m[k]){m[k].anisotropy=aniso;keep(m[k]);}
          if(m.isMeshStandardMaterial&&!m.transparent&&!/lamp/i.test(m.name)){nightStand(m);
            // The source is lit for day: its pale concrete and paint read as floodlit plaster at night, so they go down to
            // the built stands' tone.
            if(/concrete|paint|steel|aluminium/i.test(m.name))m.color.multiplyScalar(.3);}
          if(/lamp/i.test(m.name)&&m.emissive)m.emissive.setRGB(2.2,2.1,1.9);}});
      for(const st of stands)st.visible=false;
      // Seats every half metre along each row's centre line, in our axes, facing the pitch centre; rows behind the camera
      // (more than 30 m down the pitch) never show and are skipped.
      const rowsIn=(bowl.userData&&bowl.userData.cmRows)||[],v=new T.Vector3(),c=new T.Vector3(0,0,PITCH_L/2);
      for(const row of rowsIn){const y=row[0],pts=[];for(let i=1;i+1<row.length;i+=2){v.set(row[i],y,row[i+1]);bowl.localToWorld(v);pts.push(v.clone());}
        for(let i=0;i<pts.length;i+=1){const a=pts[i],b=pts[(i+1)%pts.length],len=a.distanceTo(b);
          for(let s=.25;s<len;s+=.5){const p=a.clone().lerp(b,s/len);if(p.z>30)continue;
            const si=p.z<-4?0:p.z>PITCH_L?3:p.x<0?1:2,yaw=Math.atan2(c.x-p.x,c.z-p.z);
            bowlSeats.push({p:new T.Vector3(p.x,p.y+.02,p.z),yaw:si===0?0:si===1?Math.PI/2:si===2?-Math.PI/2:yaw,si});}}}
    }

    // ---------- crowd ----------
    // One InstancedMesh of cards. Each fan: an atlas pair (arms down / arms up), a phase, a shirt colour (home, away or the
    // drawn colour), and an empty seat now and then. update(t,excitement) moves them: a gentle sway always, bouncing and arms
    // up as excitement rises (0 waiting, .5 run-up, 1 goal).
    const crowdTex=tex.crowd,tintTex=tex.crowdTint;
    for(const t of [crowdTex,tintTex]){t.generateMipmaps=true;t.minFilter=T.LinearMipmapLinearFilter;}
    const rnd=stadiumSeeded(17);
    const fans=[];
    // r90 LOOK round 2 (L02, L30): a stand, not a wall of cards. Every stand has stair aisles (1.1 m every 12 m, none right
    // behind the goal); the side and far stands have a few patches of empty seats (fewer on a sold-out level).
    const along=(p,si)=>si===0||si===3?p.x:p.z;
    const aisle=(p,si)=>(((along(p,si)+6.55)%12)+12)%12<1.1;
    const patch=(p,si)=>{if(si===0)return false;const h=Math.imul((Math.floor(along(p,si)/4)*73856093)^(Math.floor(p.y/1.6)*19349663)^(si*83492791),2654435761)>>>0;return h%100<(o.full?5:12);};
    if(bowlSeats.length){
      // The bowl: a full house behind the goal, the sides a little thinner on lower levels.
      for(const s of bowlSeats){const keepRate=(s.si===0?.95:o.full?.9:.75)*(o.density>0&&o.density<1?.4+.6*o.density:1);if(rnd()>keepRate)continue;
        if(s.si===0&&Math.abs(s.p.x-(PITCH_HALF_W-14))<1.3)continue;
        if(aisle(s.p,s.si)||patch(s.p,s.si))continue;
        fans.push({p:s.p,yaw:s.yaw,si:s.si});}
    }
    for(const s of bowlSeats.length?[]:seatsAll){
      // Extra and Ultra fill the far stands too (a sold-out night); lower levels keep them thinner.
      const keepRate=(s.si===0?(phone?.82:.93):s.si===3?(phone?.3:o.full?.86:.6):(phone?.35:o.full?.9:.7))*(o.density>0&&o.density<1?.4+.6*o.density:1);// a few empty seats; thinner far stands on phones and light devices
      if(rnd()>keepRate)continue;
      const v=new T.Vector3(s.x,s.y,s.z);stands[s.si].localToWorld(v);
      if(s.si===0&&Math.abs(v.x-(PITCH_HALF_W-14))<1.3)continue;// the empty strip between home and away fans
      if(aisle(v,s.si)||patch(v,s.si))continue;
      fans.push({p:v,yaw:stands[s.si].rotation.y,si:s.si});
    }
    const N=fans.length;
    const cardGeo=new T.PlaneGeometry(.62,.78);cardGeo.translate(0,.39-.12,0);
    const aCell=new Float32Array(N),aPhase=new Float32Array(N),aTint=new Float32Array(N*3),aOff=new Float32Array(N*4);
    const home=new T.Color(o.home!=null?o.home:0xb81d24),away=new T.Color(o.away!=null?o.away:0x1d4fb8);
    // r90 LOOK (L02): each club's block wears its colours: mostly the dominant colour, some the second kit colour, and a few
    // neutral fans in dark jackets. The away fans have the corner of the end behind the goal (seen on every penalty) and the
    // far end, with an empty strip of seats between them and the home fans, like a real segregation line.
    const homeAlt=new T.Color(o.homeAlt!=null?o.homeAlt:0xf2f2ee),awayAlt=new T.Color(o.awayAlt!=null?o.awayAlt:0xf2f2ee);
    const AWAY_X=PITCH_HALF_W-14;
    const pickCell=list=>list[Math.floor(rnd()*list.length)]||0;
    const dummy=new T.Object3D();
    for(let i=0;i<N;i+=1){const f=fans[i];
      aPhase[i]=rnd()*6.283;
      const awayEnd=f.si===3||(f.si===0&&f.p.x>AWAY_X);
      const r=rnd(),plain=r<.1;
      aCell[i]=plain?pickCell(PLAIN_CELLS):pickCell(TINT_CELLS);
      const c=plain?new T.Color(.42,.42,.44):awayEnd?(r<.8?away:awayAlt):(r<.8?home:homeAlt);
      // Vary the shade a little so the shirts do not read as one flat block.
      const k=.8+rnd()*.3;aTint[i*3]=c.r*k;aTint[i*3+1]=c.g*k;aTint[i*3+2]=c.b*k;
      aOff[i*4]=f.p.x;aOff[i*4+1]=f.p.y;aOff[i*4+2]=f.p.z;aOff[i*4+3]=f.yaw;
      // Each fan his own build, and some on their feet: most of the away end, a few of the home fans.
      const sc=.9+rnd()*.2,up=rnd()<(awayEnd?.55:.12);f.sx=sc*(.94+rnd()*.12);f.sy=sc*(up?1.1:1);f.lift=up?.16:0;
    }
    const inst=new T.InstancedMesh(keep(cardGeo),null,N);
    // The vendor build has no InstancedBufferAttribute, so the card data rides in the instance matrix: translation = seat, and the free row (elements 3, 7, 11) = cell,
    // phase, yaw; instanceColor = shirt tint.
    for(let i=0;i<N;i+=1){const f=fans[i];dummy.position.set(aOff[i*4],aOff[i*4+1]+f.lift,aOff[i*4+2]);dummy.rotation.set(0,aOff[i*4+3],0);dummy.scale.set(f.sx,f.sy,1);dummy.updateMatrix();
      const e=dummy.matrix.elements;e[3]=aCell[i];e[7]=aPhase[i];e[11]=0;inst.setMatrixAt(i,dummy.matrix);
      inst.setColorAt(i,new T.Color(aTint[i*3],aTint[i*3+1],aTint[i*3+2]));}
    const crowdUniforms={uAtlas:{value:crowdTex},uTint:{value:tintTex},uTime:{value:0},uExcite:{value:0},uLight:{value:new T.Color(1,1,1)},uHaze:{value:new T.Color(.02,.028,.05)}};
    const crowdMat=keep(new T.ShaderMaterial({
      uniforms:{...crowdUniforms,fogColor:{value:new T.Color(0,0,0)},fogNear:{value:1},fogFar:{value:2000},fogDensity:{value:.00025}},fog:true,
      vertexShader:[
        "uniform float uTime;uniform float uExcite;varying vec2 vUv;varying vec3 vTint;varying float vShade;varying float vDist;",
        "#include <fog_pars_vertex>",
        "void main(){",
        " mat4 m=instanceMatrix;float cell=m[0][3],phase=m[1][3];m[0][3]=0.0;m[1][3]=0.0;m[2][3]=0.0;",
        " float h=fract(sin(phase*91.7)*4375.85);",
        // Arms up when excitement passes this fan's own threshold; jumps grow with excitement.
        " float up=step(h,uExcite*1.1-.08);",
        " float bob=sin(uTime*(2.0+3.5*uExcite)+phase)*(.015+.11*uExcite*uExcite)*(.5+.5*h);",
        " float sway=sin(uTime*.9+phase*1.7)*.025;",
        " vec3 p=position;p.x+=sway*(p.y+.12);p.y+=max(bob,-.01);",
        " float col=mod(cell,8.0)*2.0+up,row=floor(cell/8.0);",
        " vUv=vec2((col+uv.x)/16.0,1.0-(row+1.0-uv.y)/12.0);",
        " vTint=instanceColor;",
        // Floodlit at the front, darker toward the back under the roof; a little light-to-light variation per fan.
        " vec3 wp=(m*vec4(0.0,0.0,0.0,1.0)).xyz;float back=length(wp.xz-vec2(0.0,52.5))-50.0;",
        " vShade=mix(.92,.4,smoothstep(0.0,30.0,back+wp.y*.6))*mix(1.0,.34,smoothstep(3.0,16.0,wp.y))*(.85+.3*h);",
        " vec4 mvPosition=modelViewMatrix*m*vec4(p,1.0);gl_Position=projectionMatrix*mvPosition;vDist=-mvPosition.z;",
        " #include <fog_vertex>",
        "}"].join("\n"),
      fragmentShader:[
        "uniform sampler2D uAtlas;uniform sampler2D uTint;uniform vec3 uLight;uniform vec3 uHaze;varying vec2 vUv;varying vec3 vTint;varying float vShade;varying float vDist;",
        "#include <fog_pars_fragment>",
        // A slightly softer mip (bias .7): a TV stand reads as soft texture, not sharp speckle.
        "void main(){vec4 c=texture2D(uAtlas,vUv,.7);if(c.a<.5)discard;float k=texture2D(uTint,vUv,.7).r;",
        " vec3 rgb=mix(c.rgb,c.rgb*vTint*1.15,k)*uLight*vShade;",
        // FIFA 17 stands are soft: less saturation and contrast, highlights held down, and a floodlight haze that grows with
        // distance so the back rows melt into the stand.
        " float l=dot(rgb,vec3(.2126,.7152,.0722));rgb=mix(vec3(l),rgb,.55+.3*k);rgb=rgb*.8/(1.0+rgb*.6);",
        " rgb*=mix(vec3(1.0),vec3(.74,.82,1.06),clamp(1.0-vShade,0.0,.8));",
        " rgb=mix(rgb,uHaze,smoothstep(20.0,95.0,vDist)*.6);gl_FragColor=vec4(rgb,1.0);",
        " #include <tonemapping_fragment>",
        " #include <colorspace_fragment>",
        " #include <fog_fragment>",
        "}"].join("\n")
    }));
    inst.material=crowdMat;inst.frustumCulled=false;inst.name="cmCrowd";group.add(inst);

    // ---------- banners ----------
    // r90 LOOK round 2 (L02): supporters' flags hung over the front rail behind the goal, in the home club's colours (cloth,
    // no lettering): stripes, bands and a sash, one canvas for all of them, lit by the floodlights like the stand.
    const banners=[];
    {
      let fz=-Infinity,fy=0;for(const f of fans)if(f.si===0&&f.p.z>fz){fz=f.p.z;fy=f.p.y;}
      for(const f of fans)if(f.si===0&&f.p.z>fz-.3)fy=Math.min(fy,f.p.y);
      const d=root.document;const cv=Number.isFinite(fz)&&d&&d.createElement?d.createElement("canvas"):null;
      if(cv){
        cv.width=512;cv.height=512;const g=cv.getContext("2d");
        const css=c=>`#${new T.Color(c).getHexString()}`,H1=css(home),H2=css(homeAlt),A1=css(away),A2=css(awayAlt);
        const draw=(row,fn)=>{g.save();g.translate(0,row*128);g.beginPath();g.rect(0,0,512,128);g.clip();fn();
          // Cloth: soft vertical folds and a darker hem.
          for(let x=0;x<512;x+=1){const k=.5+.5*Math.sin(x/512*Math.PI*9+row);g.fillStyle=`rgba(0,0,0,${(.05+.12*k).toFixed(3)})`;g.fillRect(x,0,1,128);}
          g.fillStyle="rgba(0,0,0,.25)";g.fillRect(0,120,512,8);g.restore();};
        draw(0,()=>{for(let i=0;i<8;i+=1){g.fillStyle=i%2?H2:H1;g.fillRect(i*64,0,64,128);}});
        draw(1,()=>{g.fillStyle=H1;g.fillRect(0,0,512,128);g.fillStyle=H2;g.fillRect(0,43,512,42);});
        draw(2,()=>{g.fillStyle=H2;g.fillRect(0,0,512,128);g.fillStyle=H1;g.beginPath();g.moveTo(120,0);g.lineTo(260,0);g.lineTo(392,128);g.lineTo(252,128);g.fill();});
        draw(3,()=>{g.fillStyle=A1;g.fillRect(0,0,256,128);g.fillStyle=A2;g.fillRect(256,0,256,128);});
        const t=keep(new T.CanvasTexture(cv));t.colorSpace=T.SRGBColorSpace;t.anisotropy=aniso;
        const mat=keep(new T.MeshStandardMaterial({map:t,roughness:.88,metalness:0,side:T.DoubleSide}));
        // [centre x, width, art row]: either side of the goal (never behind the keeper), clear of the aisles; the away
        // flag hangs in the away corner.
        for(const [x,w,row] of [[-12.5,4.6,0],[-24.5,4.4,1],[10,4.6,2],[AWAY_X+5,4.4,3]]){
          const geo=new T.PlaneGeometry(w,.9,16,1),P=geo.attributes.position,uv=geo.attributes.uv;
          for(let k=0;k<P.count;k+=1){const u=uv.getX(k),y=P.getY(k);uv.setY(k,1-(row+(y>0?0:1))/4+(y>0?-.002:.002));
            // Hung from the rail: the bottom edge sags a little and the cloth ripples.
            if(y<0)P.setY(k,y-.08*Math.sin(Math.PI*u));P.setZ(k,.04*Math.sin(u*Math.PI*7+x));}
          geo.computeVertexNormals();
          const m=add(geo,mat);m.position.set(x,fy,fz+.42);m.receiveShadow=true;m.name="cmBanner";m.userData.bake=true;banners.push(m);
        }
      }
    }

    // ---------- floodlight flares and sky ----------
    // All flares in one Points draw (a sprite each would cost a draw call per lamp).
    const fp=[];for(const st of stands)for(const v0 of st.userData.lamps){const v=v0.clone();st.localToWorld(v);fp.push(v.x,v.y,v.z);}
    // With the bowl: its floodlight ring under the roof edge (source lamps at y 37.5 round x 62.7 / z 42.7).
    if(bowl){fp.length=0;const v=new T.Vector3();
      for(let t=-1;t<=1.001;t+=1/10)for(const [x,z] of [[62.4,t*42.4],[-62.4,t*42.4],[t*62.4,42.4],[t*62.4,-42.4]]){v.set(x,37.3,z);bowl.localToWorld(v);fp.push(v.x,v.y,v.z);}}
    const flareGeo=new T.BufferGeometry();flareGeo.setAttribute("position",new T.Float32BufferAttribute(fp,3));
    const flareMat=keep(new T.PointsMaterial({map:tex.flare,size:9,sizeAttenuation:true,color:new T.Color(1,.97,.9),blending:T.AdditiveBlending,depthWrite:false,transparent:true,fog:false}));
    const flares=new T.Points(keep(flareGeo),flareMat);flares.frustumCulled=false;group.add(flares);
    // r90 LOOK (L01): a wide soft halo round each bank, the glow a floodlight throws into the night air (one more draw).
    const haloMat=keep(new T.PointsMaterial({map:tex.flare,size:38,sizeAttenuation:true,color:new T.Color(.2,.18,.14),blending:T.AdditiveBlending,depthWrite:false,transparent:true,fog:false}));
    const halo=new T.Points(flareGeo,haloMat);halo.frustumCulled=false;group.add(halo);
    // Night sky: a big inverted sphere with a gradient (deep navy up high, a warm haze over the roofs from the floodlights).
    const skyMat=keep(new T.ShaderMaterial({side:T.BackSide,depthWrite:false,fog:false,uniforms:{},
      vertexShader:"varying vec3 vDir;void main(){vDir=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}",
      fragmentShader:"varying vec3 vDir;void main(){float h=clamp(vDir.y,0.0,1.0);vec3 top=vec3(.003,.007,.03),mid=vec3(.016,.026,.062),haze=vec3(.15,.12,.085);"+
        "vec3 c=mix(mid,top,smoothstep(.12,.6,h));c=mix(c,haze,exp(-h*11.0)*.6);gl_FragColor=vec4(c,1.0);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}"}));
    const sky=add(new T.SphereGeometry(300,32,16),skyMat);sky.renderOrder=-1;sky.frustumCulled=false;

    // ---------- bake ----------
    // Boards and lamps are many small static meshes: merge them per material so the whole kit draws in a few dozen calls.
    {group.updateMatrixWorld(true);const buckets=new Map(),drop=[];
      // Only what shows: with the bowl the built stands are hidden, and their lamps must not come back merged (Codex on #1288).
      group.traverseVisible(x=>{if(x.isMesh&&x.userData.bake){if(!buckets.has(x.material))buckets.set(x.material,[]);buckets.get(x.material).push(x);drop.push(x);}});
      const v=new T.Vector3();
      for(const [mat,list] of buckets){
        let count=0;for(const m of list){const g=m.geometry;count+=g.index?g.index.count:g.attributes.position.count;}
        const P=new Float32Array(count*3),N=new Float32Array(count*3),U=new Float32Array(count*2);let o=0;
        for(const m of list){const g=m.geometry,pa=g.attributes.position,na=g.attributes.normal,ua=g.attributes.uv,ix=g.index;
          const n=ix?ix.count:pa.count;
          for(let i=0;i<n;i+=1){const k=ix?ix.getX(i):i;
            v.fromBufferAttribute(pa,k).applyMatrix4(m.matrixWorld);P[o*3]=v.x;P[o*3+1]=v.y;P[o*3+2]=v.z;
            v.fromBufferAttribute(na,k).transformDirection(m.matrixWorld);N[o*3]=v.x;N[o*3+1]=v.y;N[o*3+2]=v.z;
            U[o*2]=ua?ua.getX(k):0;U[o*2+1]=ua?ua.getY(k):0;o+=1;}}
        const g=new T.BufferGeometry();g.setAttribute("position",new T.BufferAttribute(P,3));g.setAttribute("normal",new T.BufferAttribute(N,3));g.setAttribute("uv",new T.BufferAttribute(U,2));
        const merged=add(g,mat);merged.receiveShadow=true;}
      for(const m of drop){m.removeFromParent();m.geometry.dispose();}}

    // ---------- live ----------
    const net={x:0,y:1.2,t0:-1,amp:0};
    function hitNet(x,y,speed){net.x=x;net.y=y;net.t0=crowdUniforms.uTime.value;net.amp=Math.min(1,(speed||20)/25);}
    function update(t,excite){
      crowdUniforms.uTime.value=t;crowdUniforms.uExcite.value=Math.max(0,Math.min(1,excite||0));
      // LED boards change picture together every 9 s (a hard cut, the way real ones flip), never scroll: scrolling slid
      // the words across the joins between boards.
      // r90: the boards behind the goal swap together: wordmark with the clubs either side, then the matchday board with
      // the clubs swapped (home right, away left).
      const step=Math.floor(t/9);if(art&&step!==boardStep){boardStep=step;const odd=step%2===1;
        mWord.map=odd?art.duo:art.word;mLeft.map=odd?art.awayR:art.homeR;mRight.map=odd?art.homeL:art.awayL;}
      // Net bulge: a damped push at the hit point. A clock before the hit (Reduce Motion turned on after a goal sets the
      // scene clock to 0) restores the flat net, never an inverted bulge.
      const pos=backGeo.attributes.position,arr=pos.array;const e=t-net.t0;
      if(net.t0<0||e<0||e>2.5){if(arr.__moved){arr.set(backBase);pos.needsUpdate=true;arr.__moved=false;}return;}
      const amp=(e<.08?e/.08:Math.exp(-(e-.08)*3.4)*Math.cos((e-.08)*12))*net.amp;
      for(let i=0;i<arr.length;i+=3){const dx=backBase[i]-net.x,dy=backBase[i+1]-net.y,w=Math.exp(-(dx*dx+dy*dy)/.5);
        arr[i]=backBase[i];arr[i+1]=backBase[i+1]-w*amp*.06;arr[i+2]=backBase[i+2]-w*amp*.5;}
      arr.__moved=true;pos.needsUpdate=true;
    }
    function stadiumDispose(){
      group.traverse(x=>{if(x.geometry)x.geometry.dispose();});
      for(const x of own)try{x.dispose&&x.dispose();}catch(_error){}
      for(const t of Object.values(tex))try{t.dispose();}catch(_error){}
      group.removeFromParent();
    }
    update(0,0);
    return {group,ball,ballMaterial:ballMat,goal:{group:goal,back,postMaterial:postMat,netMaterial:netMat},crowd:inst,crowdCount:N,flares,stands,update,hitNet,dispose:stadiumDispose,
      dims:{GOAL_W,GOAL_H,BALL_R,SPOT_Z,DEPTH}};
  }

  root.CareerModeChamberMenStadium={contractVersion:1,base:BASE,files:FILES,grass:GRASS,load,urls,build:stadiumBuild};
})(typeof globalThis!=="undefined"?globalThis:this);
