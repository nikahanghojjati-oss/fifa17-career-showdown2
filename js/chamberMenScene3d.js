(function(root){
  "use strict";

  // r89 Chamber Men in real 3D (Nik 2026-11-03: "Chamber men needs most important"), the broadcast penalty since 2026-11-04:
  // a three.js r187 scene drawn in place of the marble goal art of js/chamberMenStep.js (cmsGoal). r90 (Nik 2026-11-07, cut
  // the waste): one look only. The gold statue hall and its lounge light are gone; no stadium or players means the SVG goal.
  //
  // The step stays the one owner of the game: it still builds the SVG goal, keeps its classes and poses, and calls
  // scene.reset() and scene.kick() next to its own drawing. The SVG stays in the page on top of the canvas with its art
  // hidden (.cmGoal.cm3d-on), so its gold border stays (r90: no LEFT / MIDDLE / RIGHT words over the goal; the choice
  // buttons name the sides). No WebGL2, a load fault or a slow load: mount() gives null and the SVG goal plays as before.
  //
  // Loads the shared engine (visual-assets/v10_1/roulette/vendor/three-r187.min.js) with its plain path, the one the
  // service worker keeps for offline play and the roulette's own page asks for. Draws only while the canvas is in the page;
  // when the step removes its stage, the scene frees its WebGL context for the roulette that comes next.
  const ENGINE_PATH="visual-assets/v10_1/roulette/vendor/three-r187.min.js";
  // Goal and pitch in metres (a real goal: 7.32 x 2.44). The goal line is z 0, the camera looks from the penalty spot side (+z).
  const GOAL_W=7.32,GOAL_H=2.44,HALF=GOAL_W/2,BALL_R=.11,SPOT_Z=11;
  // The stadium kit's 12 cm round posts and bar (js/chamberMenStadium3d.js): bar centre just over the goal height.
  const WOOD_R=.06,BAR_Y=GOAL_H+WOOD_R/2;
  const FLIGHT=.46,SETTLE=2.0,GRAVITY=-9.8;
  let enginePromise=null;

  function doc(){return root.document||null;}
  function cm3Easy(u){return u<=0?0:u>=1?1:u*u*(3-2*u);}
  // The Device check's frame (mount(..., {fullFiles:true})) plays the kick in full under Reduce Motion too: it times the
  // level, it is not the player's view (review on #1389: a still scene gave too few frames to time).
  let benchMount=false;
  function reducedMotion(){if(benchMount)return false;try{return Boolean(root.matchMedia&&root.matchMedia("(prefers-reduced-motion: reduce)").matches);}catch(_error){return false;}}
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
  // ---------- r89 broadcast: the FIFA 17 penalty (Nik 2026-11-04) ----------
  // The camera sits behind and above the taker, as on TV; the taker (in his manager's club kit, js/kits17.js) runs up and
  // strikes, the keeper (his rival's club keeper kit, never clashing) dives; the stadium kit (js/chamberMenStadium3d.js)
  // gives the goal, net, pitch, stands and crowd. Players: the rigged Mixamo body with its own clips
  // (visual-assets/v10_1/chamber-men/players, tools/chamber-men-players). Everything is a function of the time since the
  // strike, so a frame can be drawn at any moment, and both phones show the same kick.
  const STADIUM_JS="js/chamberMenStadium3d.js",KITS_JS="js/kits17.js",CREST_JS="js/visualIdentity.js";
  const PLAYER_PATH="visual-assets/v10_1/chamber-men/players/";
  // r90 M1: the players, clips, ball and bowl are meshopt-compressed (EXT_meshopt_compression, tools/chamber-men-players
  // pack-meshopt.mjs), about 45% smaller; this decoder (meshoptimizer 0.22, MIT, its licence at the top of the file) unpacks them.
  const MESHOPT_JS="visual-assets/v10_1/chamber-men/vendor/meshopt_decoder-0.22.0.js";
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
  const RUNUP=2.15,DISSOLVE=.55;
  // penaltyKick's strike is measured on the boot when the scene is built (strikeOf); these are only the fallback.
  const KICK_HIT_GUESS=.74,KICK_BALL_GUESS=[-.99,BALL_R,2.42];
  // jog: the frame whose feet match the first frame of penaltyKick (left foot down, right foot pushing off).
  const JOG_JOIN=1.933;
  // Run-ups, one per kick in turn: a jog, a longer, slower jog, and two steps from a standstill (FIFA 17's "still").
  // r90 (Nik 2026-11-07: "the way that player run up"): six run-ups, picked per taker and kick (both phones pick the same).
  // jog = seconds of running before the plant foot, rate = how fast the stride plays (feet never slide: the travel comes
  // from the clip), stutter = a check in the stride (at seconds into the run, len seconds, stride down to k).
  const RUNUPS=[{jog:1.1,rate:1},{jog:1.3,rate:.82},{jog:0,rate:1},{jog:.72,rate:1.14},{jog:1.25,rate:.96,stutter:{at:.42,len:.42,k:.22}},{jog:1.35,rate:.74}];
  // Keeper moves by the side he goes to (world -x is the keeper's right; "m" mirrors a clip to the other side). tc is the
  // clip time of full stretch (the glove meets the ball there), s the speed it plays at so the dive starts on the strike.
  const KEEPS={
    L:[{c:"gkDive1",m:0,tc:.9,s:1.35},{c:"gkDive",m:1,tc:1.1,s:1.6},{c:"gkBlock1",m:0,tc:.7,s:1.15},{c:"gkBlock",m:1,tc:.8,s:1.25},{c:"gkBlock2",m:1,tc:.7,s:1.15}],
    R:[{c:"gkDive",m:0,tc:1.1,s:1.6},{c:"gkDive1",m:1,tc:.9,s:1.35},{c:"gkBlock",m:0,tc:.8,s:1.25},{c:"gkBlock1",m:1,tc:.7,s:1.15},{c:"gkBlock2",m:0,tc:.7,s:1.15}],
    M:[{c:"gkCatch1",m:0,tc:.4,s:1,hold:1},{c:"gkCatch2",m:0,tc:.8,s:1.2,hold:1}]
  };
  // A keeper who stayed in the middle while the ball went to a corner: set until it is past him, then hands to knees.
  const ROOTED={c:"defeated",m:0,tc:-.15,s:1,rooted:1};
  // The taker's reaction after the follow-through, one per kick from these (both phones pick the same).
  const REACTIONS={goal:["victory","victory2","cheer","salute"],miss:["disappointed","defeated"]};
  // Goals: where in the zone the ball goes (heights), by kick.
  const GOAL_SPOTS={side:[[2.75,.32],[2.6,1.05],[2.85,1.85],[2.95,.6]],mid:[[.35,1.55],[-.3,.95],[.15,1.95]]};

  function cm3Script(key,path,ready){
    if(ready())return Promise.resolve(true);
    if(typeof root.loadRuntimeScript==="function")return Promise.resolve(root.loadRuntimeScript(key,path,ready)).then(()=>Boolean(ready()),()=>false);
    return new Promise(resolve=>{const s=doc().createElement("script");s.src=path;s.async=true;s.onload=()=>resolve(Boolean(ready()));s.onerror=()=>resolve(false);doc().head.append(s);});
  }
  // The stadium textures, the kits, the shared clips and each club's body (taker and keeper: one file per body, parsed
  // twice). null when any part cannot come in time: the SVG goal plays instead.
  // Started before the engine arrives: the scripts, the clips and the bodies come down while three.js loads.
  function cm3Hash(s){let h=2166136261;for(const ch of String(s))h=Math.imul(h^ch.charCodeAt(0),16777619)>>>0;return h;}
  // The bodies kits17 can dress (a proof run may force one with CMS_CHAMBER_MEN_BODY).
  function cm3BodyList(K){
    const forced=root.CMS_CHAMBER_MEN_BODY;if(BODIES.includes(forced))return [forced];
    const ok=K&&Array.isArray(K.layouts)?K.layouts:["remy"];const list=BODIES.filter(b=>ok.includes(b));return list.length?list:["remy"];
  }
  // One body per club for the whole Showdown (its taker and its keeper), from the club's name: nothing random.
  function cm3BodyOf(club,list){return list[cm3Hash(`body|${club||""}`)%list.length];}
  // r90 M1 (MOTION hunt): one download per file, shared by warm() and the mount, and never aborted. What comes down is kept
  // by the browser and the app's worker (visual-assets are cache-first), so it serves every later open; a mount that starts
  // while warm() is still fetching a file waits for that same download. A stopped mount (BUG-05) stops parsing and building only.
  const cm3Downloads=new Map();let cm3Mounting=0;
  // A file warm() is still fetching that the mount loads its own way (the engine script, the stadium images): the mount waits
  // for that download and then reads it from the cache, instead of fetching it a second time alongside.
  function cm3Settle(urls){return Promise.all(urls.map(u=>cm3Downloads.get(u)).filter(Boolean));}
  function cm3Blob(url,low){
    if(typeof root.fetch!=="function")return Promise.resolve(null);
    let p=cm3Downloads.get(url);
    if(!p){p=root.fetch(url,low?{priority:"low"}:undefined).then(r=>r.ok?r.blob():null).catch(()=>null);cm3Downloads.set(url,p);p.then(()=>{if(cm3Downloads.get(url)===p)cm3Downloads.delete(url);});}
    return p;
  }
  function cm3Scripts(){
    return Promise.all([cm3Script("chamber-men-stadium",STADIUM_JS,()=>Boolean(root.CareerModeChamberMenStadium)),cm3Script("kits17",KITS_JS,()=>Boolean(root.CareerModeKits17)),
      cm3Script("meshopt-decoder",MESHOPT_JS,()=>Boolean(root.MeshoptDecoder))]).then(list=>list.every(Boolean),()=>false);
  }
  // The two body files this Showdown's clubs wear (one when both clubs share a body).
  function cm3BodyFiles(tier,clubs){
    const list=cm3BodyList(root.CareerModeKits17),c=clubs||{};
    return [...new Set([cm3BodyOf(c.playerOne,list),cm3BodyOf(c.playerTwo,list)])].map(n=>[n,`body_${n}_${tier}.glb`]);
  }
  function cm3Prefetch(tier,clubs){
    const scripts=Promise.all([cm3Scripts(),cm3Script("visual-identity",CREST_JS,()=>typeof root.getClubCrestSvg==="function").catch(()=>false)]).then(([ok])=>ok,()=>false);
    const get=file=>cm3Blob(PLAYER_PATH+file).then(b=>b?b.arrayBuffer():null).catch(()=>null);
    const anims=get(`anims_${tier}.glb`);
    const bodies=scripts.then(ok=>{
      if(!ok)return null;
      const files=cm3BodyFiles(tier,clubs);
      return Promise.all(files.map(([_n,f])=>get(f))).then(bufs=>bufs.every(Boolean)?Object.fromEntries(files.map(([n],i)=>[n,bufs[i]])):null);
    });
    return {scripts,anims,bodies};
  }
  // warm({clubs}): the files this device's level will ask for, fetched one at a time at low priority while the season page
  // waits for the tap (js/productionSharedTransferChallenge.js). Nothing is parsed or drawn; true once all came down. Once a
  // mount starts it starts no new file (the mount asks for the rest itself, all at once).
  async function cm3Warm(opts){
    // Data Saver on: nothing ahead (the screen still loads what it needs when it opens).
    if(root.CMS_CHAMBER_MEN_3D==="off"||!root.WebGL2RenderingContext||root.navigator?.connection?.saveData===true)return false;
    const Q=await cm3Quality(opts&&opts.clubs);
    if(!await cm3Scripts())return false;
    const urls=cm3Urls(Q,opts&&opts.clubs);
    let next=0,ok=true;
    // One file at a time, so the season page's own reads never wait behind the warm-up.
    while(next<urls.length&&!cm3Mounting){const u=urls[next];next+=1;if(!await cm3Blob(u,true))ok=false;}
    // r90 Light (lead 2026-11-08: everything ready before the season page hands over): with the files down, the season page
    // also runs three.js and parses the stadium and the players, one step per idle moment, and keeps the result for this
    // level and these clubs. The mount takes it instead of parsing again (7.4 s of a 2-core, 4x-throttled CPU). Nothing is
    // drawn and no GPU memory is taken until the screen opens.
    if(ok&&!cm3Mounting&&!cm3Parsed){
      const work=(async()=>{await cm3Idle();if(cm3Mounting)return null;const T=await loadEngine();await cm3Idle();
        const x=await cm3Extras(T,Q,cm3Prefetch(Q.assets,opts&&opts.clubs));
        // The four kits (each club taking and keeping): painted here, one per idle moment (each cost 1.1-2.2 s of main thread
        // when it was painted at the kick, MOTION M2; 12 s of the 2-core 4x open when all four were painted at mount).
        if(x)for(const k of cm3KitPlan(x.K,Q,opts&&opts.clubs)){if(cm3Mounting)break;await cm3Idle();if(cm3Kits.has(k.memo))continue;
          try{const t=x.K.textures(k.club,k.opts);cm3Kits.set(k.memo,t);await Promise.resolve(t.ready).catch(()=>{});}catch(_error){}}
        return x;})().catch(()=>null);
      cm3Parsed={key:cm3ParseKey(Q,opts&&opts.clubs),work,lite:Boolean(Q.full)};
      await work;
    }
    // M36: a high level opened on the lighter set on a slow line: its own set comes down now, one file at a time at low
    // priority, for the next open (never parsed here).
    if(Q.full){const full=cm3Urls({...Q,assets:"desktop",textureLevel:Q.full.textureLevel},opts&&opts.clubs);
      for(const u of full){if(cm3Mounting)break;await cm3Blob(u,true);}}
    return ok;
  }
  let cm3Parsed=null;const cm3Kits=new Map();
  // A kit's key and its kits17 options: one per body, club, role, rival and squad number (dress() paints by the same key).
  function cm3KitMemo(body,club,role,vs,number){return `${body}|${club}|${role}|${vs}|${number}`;}
  function cm3KitNumber(club,role){return role==="gk"?1:SHIRT_NUMBERS[cm3Hash(`number|${club}`)%SHIRT_NUMBERS.length];}
  function cm3KitPlan(K,Q,clubs){
    const c=clubs||{},one=String(c.playerOne||""),two=String(c.playerTwo||""),list=cm3BodyList(K),size=Q.assets==="phone"?"phone":"full",out=[];
    for(const [club,vs] of [[one,two],[two,one]])for(const role of ["outfield","gk"]){const body=cm3BodyOf(club,list),number=cm3KitNumber(club,role);
      out.push({memo:cm3KitMemo(body,club,role,vs,number),club,opts:{layout:body,role,vsClub:vs,size,number}});}
    return out;
  }
  function cm3ParseKey(Q,clubs){return [Q.assets,Q.level,Q.textureLevel??"",clubs?.playerOne||"",clubs?.playerTwo||""].join("|");}
  function cm3Idle(){return new Promise(resolve=>{if(typeof root.requestIdleCallback==="function")root.requestIdleCallback(()=>resolve(),{timeout:3000});else root.setTimeout(resolve,50);});}
  function cm3Extras(T,Q,pre){
    if(typeof T.GLTFLoader!=="function"||typeof T.AnimationMixer!=="function"||!pre)return Promise.resolve(null);
    const work=(async()=>{
      if(!await pre.scripts)return null;
      const S=root.CareerModeChamberMenStadium;
      const meshopt=root.MeshoptDecoder,look={phone:Q.assets==="phone",level:Q.textureLevel??Q.level,meshopt};
      if(typeof S.urls==="function")await cm3Settle(S.urls(look));
      const [tex,anims,bufs]=await Promise.all([S.load(T,look),pre.anims,pre.bodies]);
      if(!anims||!bufs){for(const t of Object.values(tex||{}))t.dispose?.();return null;}
      const parse=buf=>new T.GLTFLoader().setMeshoptDecoder(meshopt).parseAsync(buf.slice(0),PLAYER_PATH);
      const clips=await parse(anims);
      const bodies={};
      // Each body file is parsed once; the keeper is a copy with its own bones and materials (r90 M1: a second parse cost a
      // cold Light open about as much CPU again as the first).
      await Promise.all(Object.entries(bufs).map(async([n,buf])=>{const taker=await parse(buf);bodies[n]={taker,keeper:cm3CloneBody(taker)};}));
      // Warm each body's kit map (kits17 caches it), so the first kit goes on with the first frame.
      const K=root.CareerModeKits17;
      await Promise.all(Object.keys(bufs).map(n=>{try{return Promise.resolve(K.textures("",{layout:n,size:"small"}).ready).catch(()=>null);}catch(_error){return null;}}));
      return {S,tex,K,clips,bodies};
    })().catch(error=>{try{root.console?.warn?.("Chamber Men 3D: no stadium or players; the drawn goal plays.",error);}catch(_error){}return null;});
    // r90 Light (Nik 2026-11-08, "3D light for Chamber Men is a guarantee"): no deadline here any more. The step keeps the
    // loading screen up while this comes in (js/chamberMenStep.js), and a mount it gives up on stops through its signal.
    return work;
  }
  // A parsed body copied for a second actor (three.js SkeletonUtils.clone, which the vendor build leaves out): the copy's
  // skinned meshes are bound to the copy's own bones, and every material is its own (kits and skin tones are set per actor).
  // Geometry and the body textures are shared.
  function cm3CloneBody(gltf){
    const src=gltf.scene,copy=src.clone(),toCopy=new Map(),fromCopy=new Map();
    const walk=(a,b)=>{toCopy.set(a,b);fromCopy.set(b,a);for(let i=0;i<a.children.length;i+=1)walk(a.children[i],b.children[i]);};
    walk(src,copy);
    copy.traverse(o=>{
      if(o.isMesh)o.material=Array.isArray(o.material)?o.material.map(m=>m.clone()):o.material.clone();
      if(!o.isSkinnedMesh)return;
      const from=fromCopy.get(o),skeleton=from.skeleton.clone();
      skeleton.bones=from.skeleton.bones.map(b=>toCopy.get(b));
      o.bind(skeleton,from.bindMatrix);
    });
    return {scene:copy,animations:gltf.animations};
  }
  function cm3FreeExtras(x){
    try{for(const t of Object.values(x.tex||{}))t.dispose?.();}catch(_error){}
    const all=[x.clips];for(const b of Object.values(x.bodies||{}))all.push(b.taker,b.keeper);
    for(const g of all)try{g?.scene?.traverse(o=>{o.geometry?.dispose?.();for(const m of [].concat(o.material||[])){for(const v of Object.values(m))if(v&&v.isTexture)v.dispose();m.dispose?.();}});}catch(_error){}
  }

  // Scene extras per level (light .. ultra): texture filtering, shadow softness (PCF radius), a second shadow-casting
  // floodlight, and fuller far stands. Pixel ratio, MSAA, shadow size and crowd density come from js/gfxTier.js.
  // r90 L04: the squad numbers a club's penalty taker wears (one per club for the Showdown, from its name).
  const SHIRT_NUMBERS=[7,8,9,10,11,14,17,19,20,23];
  // r91 shells: the layers of real grass blades in front of the camera (js/chamberMenStadium3d.js), Extra and Ultra only.
  const CM3_LEVEL_EXTRAS=[
    {aniso:4,softness:1.5,fullCrowd:false,shells:0},
    {aniso:8,softness:2,fullCrowd:false,shells:0},
    {aniso:16,softness:3,fullCrowd:false,shells:0},
    {aniso:16,softness:3.5,fullCrowd:true,shells:10},
    {aniso:16,softness:4,fullCrowd:true,shells:14}
  ];
  // r90 floodlight banks (metres; goal line z 0, pitch toward +z), on the roof ring 37 m up where both stadiums carry their
  // lamps, and how much of the box's light each throws (w).
  const FLOOD_BANKS=[
    // Broadcast lighting (UEFA and FIFA guides) asks for more vertical light toward the main camera than away from it, so
    // the banks on the camera's side and behind it throw more than the far ones.
    {p:[40,37,16],w:1.5},     // right side, level with the box: the key
    {p:[-40,37,16],w:.4},   // left side, level with the box
    {p:[40,37,46],w:1.4},     // right side toward halfway, behind the camera: lights the taker's back
    {p:[-40,37,46],w:.4},   // left side toward halfway
    {p:[20,37,-12],w:.25},  // behind the goal, right: the rim on the players' heads and shoulders
    {p:[-20,37,-12],w:.25}  // behind the goal, left
  ];
  const FLOOD_COLOR=0xfff4e8,FLOOD_UNIT=1.05;
  // Per level: which banks each light carries (merged banks light from their weighted middle) and which cast shadows.
  // Light: one light with the shadow (r90, Nik's Chromebook: the fill and rim are folded into it, see LIGHT_ONE).
  // Balanced: three lights, one shadow. High: four, two shadows. Extra: all six,
  // three shadows. Ultra and 8K: all six, four shadows (the soft star of shadows under a player in a real stadium).
  const FLOOD_RIGS=[
    [[[0,2],1]],
    [[[0,2],1],[[1,3],0],[[4,5],0]],
    [[[0,2],1],[[1,3],1],[[4],0],[[5],0]],
    [[[0],1],[[1],1],[[2],1],[[3],0],[[4],0],[[5],0]],
    [[[0],1],[[1],1],[[2],1],[[3],1],[[4],0],[[5],0]]
  ];
  function cm3FloodRig(level,banks){
    return FLOOD_RIGS[Math.max(0,Math.min(4,level))].map(([ids,shadow])=>{
      let w=0;const p=[0,0,0];for(const i of ids){const b=banks[i];w+=b.w;for(let k=0;k<3;k+=1)p[k]+=b.p[k]*b.w;}
      return {p:p.map(v=>v/w),w,shadow:Boolean(shadow)};
    });
  }
  // Reflections from the same banks: a small stadium-at-night environment seen from the box (the night sky, the roof
  // line, the lit stands, the floodlit turf below) with each bank as a bright panel where the lights are and the lamp
  // ring round the roof, filtered once (PMREM) when the scene is built. So the ball, the posts, the boots and the kits
  // catch highlights exactly where the light comes from, and the players pick up the green bounce off the pitch. It
  // replaces filtering the whole stadium (six renders of every stand at load) and costs the same at every level.
  function cm3FloodEnv(T,renderer,level,banks){
    try{
      const es=new T.Scene(),own=[],at=new T.Vector3(0,1.2,9);
      const add=(g,m)=>{own.push(g,m);const x=new T.Mesh(g,m);es.add(x);return x;};
      add(new T.SphereGeometry(90,48,24),new T.ShaderMaterial({side:T.BackSide,depthWrite:false,
        vertexShader:"varying vec3 vD;void main(){vD=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}",
        fragmentShader:["varying vec3 vD;void main(){float h=vD.y;",
          // the night sky over the roof, a shade lighter low down where the floodlights light the air
          " vec3 c=mix(vec3(.016,.022,.045),vec3(.002,.004,.012),smoothstep(.62,.95,h));",
          // under the roof (dark steel), then the lit stands and crowd down to the pitch
          " c=mix(c,vec3(.01,.011,.014),step(h,.6));",
          " c=mix(c,vec3(.026,.025,.028)*(1.1-h),step(h,.42));",
          // the floodlit turf: a green bounce under the players
          " c=mix(c,vec3(.032,.055,.024),smoothstep(-.01,-.12,h));",
          " gl_FragColor=vec4(c,1.0);}"].join("\n")}));
      // The lamp ring under the roof edge, all round.
      const ring=add(new T.CylinderGeometry(52,52,1.6,64,1,true),new T.MeshBasicMaterial({color:new T.Color(.6,.58,.56),side:T.DoubleSide}));ring.position.y=36-at.y;
      // The banks: 18 x 4 m lamp arrays facing the box.
      const panel=new T.PlaneGeometry(18,4),hot=new T.MeshBasicMaterial({color:new T.Color(1,.97,.93),side:T.DoubleSide});own.push(panel,hot);
      for(const b of banks){const m=new T.Mesh(panel,hot.clone());own.push(m.material);m.material.color.multiplyScalar(4*b.w);
        m.position.set(b.p[0]-at.x,b.p[1]-at.y,b.p[2]-at.z);m.lookAt(0,0,0);es.add(m);}
      const pm=new T.PMREMGenerator(renderer);const rt=pm.fromScene(es,.015,.1,200);pm.dispose();
      for(const x of own)x.dispose?.();
      return rt;
    }catch(_error){return null;}
  }
  function buildBroadcast(T,svg,x,opts,Q){
    const d=doc(),canvas=d.createElement("canvas");
    canvas.className="cmGoal3d";canvas.setAttribute("aria-hidden","true");
    // r90 quality from the device (js/gfxTier.js): MSAA, pixel ratio, shadow size and crowd density by level.
    const renderer=new T.WebGLRenderer({canvas,antialias:Q.antialias,alpha:false,powerPreference:"high-performance"});
    const phone=Q.assets==="phone";
    renderer.setPixelRatio(Q.pixelRatio);
    renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.0;
    renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;
    // r90 quality pass (Nik 2026-11-07: "hugely improve" the top levels, Light and Balanced better at no extra load): every
    // extra below is gated on the level, so a Chromebook or a phone never pays for what only a strong GPU draws.
    const L=Number.isInteger(Q.level)?Q.level:1,QX=CM3_LEVEL_EXTRAS[Math.max(0,Math.min(4,L))];
    const aniso=Math.min(QX.aniso,renderer.capabilities.getMaxAnisotropy());
    const scene=new T.Scene();scene.background=new T.Color(0x05070b);scene.fog=new T.FogExp2(0x0a0d14,.0045);
    const own=[];const keep=v=>{own.push(v);return v;};let flatNormal=null;
    const clubs=(opts&&opts.clubs)||{};
    const K=x.K,hex=v=>{const n=parseInt(String(v||"").replace("#",""),16);return Number.isFinite(n)?n:null;};
    const colourOf=club=>{try{return hex(K.kit(club).dominant)??0x888888;}catch(_error){return 0x888888;}};
    // The crowd's second colour: the kit's other colour (second, else trim), unless it is the dominant one again.
    const altOf=club=>{try{const k=K.kit(club),d=String(k.dominant).toLowerCase();const c=[...(k.second||[]),k.body,k.trim].find(v=>v&&String(v).toLowerCase()!==d);return hex(c);}catch(_error){return null;}};
    // Stadium: white posts like FIFA 17, the crowd in each club's colours, the boards with each club's crest and name.
    const crest=typeof root.getClubCrestSvg==="function"?name=>root.getClubCrestSvg(name):null;
    const S=x.S.build(T,x.tex,{phone,density:Q.density,full:QX.fullCrowd,posts:"white",home:colourOf(clubs.playerOne),away:colourOf(clubs.playerTwo),
      homeAlt:altOf(clubs.playerOne),awayAlt:altOf(clubs.playerTwo),homeName:clubs.playerOne,awayName:clubs.playerTwo,crest,boardPx:L>=3?2048:1024,aniso,lean:L===0,shells:QX.shells});
    scene.add(S.group);
    const ball=S.ball;
    // ---------- floodlights ----------
    // r90 (Nik 2026-11-08: "proper lighting ... that makes sense", "lighting reflection on the stuff ... actually look
    // better"): every light in the frame comes from a floodlight bank where the stadium has one, on the roof ring 37 m up.
    // Banks are aimed at the box: one each side level with it, one each side toward halfway (behind the camera), and two
    // on the roof behind the goal (the rim on the players' shoulders). The rig is the same at every level; a higher level
    // only resolves more banks one by one and lets more of them cast, so the light never changes direction between devices,
    // it only gets the multi-shadow look of a real stadium. LED floodlights (about 5700 K): a near-neutral white.
    const env=cm3FloodEnv(T,renderer,L,FLOOD_BANKS);// r90 Light (Nik's Chromebook): one real-time light. The key carries the fill's and rim's share of the light (x1.5),
    // the reflections a little more (x1.1) and the sky a little more (.22), so the pitch, the players and the goal read as
    // bright as under the three-light rig (frame check at 1920x866: the taker 78.4 against 78.2, the pitch 77-78 both).
    const LIGHT_ONE=L===0?{key:1.5,env:1.1,hemi:.22}:{key:1,env:1,hemi:.08};
    let envNow=env;if(env){scene.environment=env.texture;scene.environmentIntensity=LIGHT_ONE.env;}
    // A lost context empties every render target, the filtered reflections with them: they are filtered again on restore.
    const refilter=()=>{const next=cm3FloodEnv(T,renderer,L,FLOOD_BANKS);if(!next)return;envNow?.dispose();envNow=next;scene.environment=next.texture;};
    scene.add(new T.HemisphereLight(0x9fb4e8,0x14200f,LIGHT_ONE.hemi));
    const flood=cm3FloodRig(L,FLOOD_BANKS),FLOOD_AIM=new T.Vector3(0,0,9),lights=[];
    flood.forEach((f,i)=>{
      const l=new T.DirectionalLight(FLOOD_COLOR,f.w*FLOOD_UNIT*LIGHT_ONE.key);l.position.set(...f.p);l.target.position.copy(FLOOD_AIM);l.name=`cmFlood${i}`;
      if(f.shadow){const size=i===0?Q.shadowSize:Math.max(512,Q.shadowSize/2);l.castShadow=true;l.shadow.mapSize.set(size,size);l.shadow.bias=-.0004;l.shadow.normalBias=.03;
        l.shadow.radius=QX.softness;
        // The box, the goal and both players: from a 37 m bank a player's shadow runs 2-3 m, so the frustum is the box plus that.
        Object.assign(l.shadow.camera,{left:-13,right:13,top:13,bottom:-13,near:20,far:110});l.shadow.camera.updateProjectionMatrix();}
      scene.add(l,l.target);lights.push(l);
    });

    // ---------- players ----------
    const sample=new T.Vector3(),sampleQ=new T.Quaternion(),fwd=new T.Vector3();
    // A body plays the shared clips: each clip cloned with its hips travel scaled to the body (cmHipsScale, from the
    // converter: the body's hips height over Remy's). Rotations fit every body as they are.
    const scaleOf=g=>{const u=g.scene.userData?.cmHipsScale??g.scene.children[0]?.userData?.cmHipsScale;return Number.isFinite(u)&&u>0?u:1;};
    const retarget=scale=>{const out={};for(const c of x.clips.animations){
      if(scale===1){out[c.name]=c;continue;}
      const k=c.clone();for(const t of k.tracks)if(t.name.endsWith(".position")){const v=t.values;for(let i=0;i<v.length;i+=1)v[i]*=scale;}out[c.name]=k;}return out;};
    // r90 draw calls: one shadow draw per player body instead of one per piece. The opaque pieces (skin, shirt, shorts,
    // socks, boots, eyes) are copied once into a shadow-only mesh on the same bones, posed exactly as they are; it shows only
    // while the shadow maps render, so the picture never draws it. Hair (alpha-cut) keeps its own shadow. A body whose
    // pieces disagree on a bone's bind pose keeps the per-piece shadows.
    const shadowBodies=[];
    // (A restored WebGL context brings a new shadowMap object: wrapShadow runs again then.)
    const wrapShadow=()=>{const sm=renderer.shadowMap;if(sm.cmWrapped)return;const draw=sm.render.bind(sm);sm.cmWrapped=true;
      sm.render=(...args)=>{for(const p of shadowBodies){p.visible=true;p.skeleton.update();}
        try{return draw(...args);}finally{for(const p of shadowBodies)p.visible=false;}};};
    wrapShadow();
    const shadowBody=model=>{
      const parts=[];model.updateMatrixWorld(true);
      model.traverse(o=>{if(o.isSkinnedMesh&&o.castShadow&&!Array.isArray(o.material)&&!(o.material.alphaTest>0)&&!o.material.alphaMap&&!o.material.transparent)parts.push(o);});
      if(parts.length<2||parts.some(o=>o.material.side!==parts[0].material.side||o.material.shadowSide!==parts[0].material.shadowSide))return;
      const bones=[],inv=[],at=new Map();
      for(const o of parts)for(let i=0;i<o.skeleton.bones.length;i+=1){const b=o.skeleton.bones[i],m=o.skeleton.boneInverses[i];
        if(!at.has(b)){at.set(b,bones.length);bones.push(b);inv.push(m.clone());}
        else{const e=inv[at.get(b)].elements;if(m.elements.some((x,k)=>Math.abs(x-e[k])>1e-4))return;}}
      let nv=0,ni=0;for(const o of parts){const g=o.geometry;nv+=g.attributes.position.count;ni+=g.index?g.index.count:g.attributes.position.count;}
      // Every piece in the same bind space as the first (they normally share one, so the positions copy over bit for bit).
      const P=new Float32Array(nv*3),SI=new Uint16Array(nv*4),SW=new Float32Array(nv*4),I=nv>65535?new Uint32Array(ni):new Uint16Array(ni),v=new T.Vector3();
      const bind=parts[0].bindMatrix.clone(),toBind=new T.Matrix4().copy(bind).invert(),m=new T.Matrix4();
      let o0=0,k=0;
      for(const o of parts){const g=o.geometry,pa=g.attributes.position,si=g.attributes.skinIndex,sw=g.attributes.skinWeight,ix=g.index,map=o.skeleton.bones.map(b=>at.get(b));
        const same=o.bindMatrix.equals(bind);m.multiplyMatrices(toBind,o.bindMatrix);
        for(let i=0;i<pa.count;i+=1){const j=o0+i;v.fromBufferAttribute(pa,i);if(!same)v.applyMatrix4(m);P[j*3]=v.x;P[j*3+1]=v.y;P[j*3+2]=v.z;
          SI[j*4]=map[si.getX(i)];SI[j*4+1]=map[si.getY(i)];SI[j*4+2]=map[si.getZ(i)];SI[j*4+3]=map[si.getW(i)];
          SW[j*4]=sw.getX(i);SW[j*4+1]=sw.getY(i);SW[j*4+2]=sw.getZ(i);SW[j*4+3]=sw.getW(i);}
        if(ix)for(let i=0;i<ix.count;i+=1)I[k++]=ix.getX(i)+o0;else for(let i=0;i<pa.count;i+=1)I[k++]=i+o0;
        o0+=pa.count;}
      const g=keep(new T.BufferGeometry());g.setAttribute("position",new T.BufferAttribute(P,3));g.setAttribute("skinIndex",new T.BufferAttribute(SI,4));
      g.setAttribute("skinWeight",new T.BufferAttribute(SW,4));g.setIndex(new T.BufferAttribute(I,1));
      const mat=keep(new T.MeshBasicMaterial({side:parts[0].material.side}));mat.shadowSide=parts[0].material.shadowSide;
      const proxy=new T.SkinnedMesh(g,mat);proxy.name="cmShadowBody";proxy.castShadow=true;proxy.frustumCulled=false;proxy.visible=false;
      model.add(proxy);proxy.bind(keep(new T.Skeleton(bones,inv)),bind);
      for(const o of parts)o.castShadow=false;
      shadowBodies.push(proxy);
    };
    // r91 High, Extra and Ultra: the kit is cloth. Shirt, shorts and socks take a fabric sheen (the soft rim a woven shirt shows
    // where it turns away from a floodlight, tinted by the kit's own colours), so the kit reads as fabric, not painted
    // plastic. One more shader for the two players; Light and Balanced (the Chromebook and lighter phones) keep the plain kit.
    const toCloth=m=>{const p=new T.MeshPhysicalMaterial();T.MeshStandardMaterial.prototype.copy.call(p,m);p.defines={STANDARD:"",PHYSICAL:""};
      p.sheen=1;p.sheenRoughness=.45;p.sheenColor.setRGB(.55,.55,.55);return p;};
    const actor=(gltf,name,body)=>{
      const model=gltf.scene,holder=new T.Group();holder.name=name;holder.add(model);holder.visible=false;scene.add(holder);
      model.position.y=BODY_LIFT[body]||0;
      const mats={},bones={};
      model.traverse(o=>{
        // Eyelashes cast no shadow (r90 draw calls): a lash is far under one shadow texel, so its shadow was a draw per light
        // that changed no pixel.
        // r90 Light draw budget: no eyelashes at Light (the taker shows his back, the keeper's face is about 10 px high at
        // 1920x866): two draws that changed no pixel a viewer can find.
        if(o.isMesh&&L>=2&&!Array.isArray(o.material)&&o.material?.isMeshStandardMaterial&&!o.material.isMeshPhysicalMaterial&&/^kit(Shirt|Shorts|Socks)$/.test(o.material.name)){
          const was=o.material;o.material=toCloth(was);was.dispose();}
        if(o.isMesh){const lash=/lash/i.test(`${o.name} ${[].concat(o.material).map(m=>m&&m.name).join(" ")}`);o.castShadow=!lash;if(lash&&L===0)o.visible=false;o.receiveShadow=true;o.frustumCulled=false;for(const m of [].concat(o.material)){if(m&&m.name)mats[m.name]=m;keep(m);}}
        if(o.isBone&&!bones[o.name])bones[o.name]=o;
      });
      // r90 Light program budget: a kit piece the model ships without a normal map reads a flat one (no change on screen),
      // so every opaque kit piece of both players shares one shader instead of two.
      if(L===0)for(const m of Object.values(mats))if(m.isMeshStandardMaterial&&(m.map||/^kit/.test(m.name))&&!m.normalMap&&!m.transparent&&!(m.alphaTest>0)&&!m.alphaMap){
        if(!flatNormal){flatNormal=keep(new T.DataTexture(new Uint8Array([128,128,255,255]),1,1));flatNormal.needsUpdate=true;}
        m.normalMap=flatNormal;m.needsUpdate=true;}
      // r91 keeper gloves: the keeper's hands were bare skin. His body's skin shader now covers every vertex the hand and finger
      // bones carry with a padded glove (a little fuller than the hand, a light latex palm and back, a dark wrist strap). The
      // hook goes on every piece of both players with the same key, so the pieces that shared a shader still share one (no new
      // program at any level); only the keeper's body switches it on. A body whose hand bones are not in two runs keeps bare hands.
      const glove=role=>{let body=null;model.traverse(o=>{if(o.isSkinnedMesh&&o.name==="Body")body=o;});
        const runs=[];if(body){let s=-1;body.skeleton.bones.forEach((b,i,all)=>{const h=/Hand/.test(b.name);if(h&&s<0)s=i;if(s>=0&&(!h||i===all.length-1)){runs.push([s,h?i:i-1]);s=-1;}});}
        const on=role==="keeper"&&runs.length===2,ws=body?body.getWorldScale(new T.Vector3()).x:1;
        model.traverse(o=>{if(!o.isSkinnedMesh)return;for(const m of [].concat(o.material)){if(!m?.isMeshStandardMaterial)continue;
          const u={uCmHand:{value:new T.Vector4(...(runs.length===2?[...runs[0],...runs[1]]:[-9,-9,-9,-9]))},uCmGlove:{value:on&&o===body?1:0},uCmInflate:{value:.004/(ws||1)}};
          m.onBeforeCompile=sh=>{Object.assign(sh.uniforms,u);
            sh.vertexShader=sh.vertexShader.replace("#include <common>","#include <common>\nuniform vec4 uCmHand;uniform float uCmGlove,uCmInflate;varying float vCmGlove;").replace("#include <begin_vertex>",
              "#include <begin_vertex>\nfloat cmG=0.0;\n#ifdef USE_SKINNING\nfor(int k=0;k<4;k++){float i=skinIndex[k];cmG+=skinWeight[k]*(step(uCmHand.x-.5,i)*step(i,uCmHand.y+.5)+step(uCmHand.z-.5,i)*step(i,uCmHand.w+.5));}\n#endif\n"+
              "vCmGlove=cmG*uCmGlove;transformed+=normal*(uCmInflate*smoothstep(.35,.8,vCmGlove));");
            sh.fragmentShader=sh.fragmentShader.replace("#include <common>","#include <common>\nvarying float vCmGlove;").replace("#include <map_fragment>",
              "#include <map_fragment>\n{float g=smoothstep(.42,.62,vCmGlove),strap=g*(1.0-smoothstep(.72,.86,vCmGlove));"+
              // the skin map's own creases and knuckles kept as folds in the glove
              "float fold=1.0;\n#ifdef USE_MAP\nfold=clamp(dot(sampledDiffuseColor.rgb,vec3(.3,.59,.11))*2.2,.72,1.12);\n#endif\n"+
              "diffuseColor.rgb=mix(diffuseColor.rgb,mix(vec3(.46,.48,.5)*fold,vec3(.04,.05,.06),strap),g);}");};
          m.customProgramCacheKey=()=>"cmGlove";m.needsUpdate=true;}});};
      glove(name.startsWith("cmKeeper")?"keeper":"taker");
      shadowBody(model);
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
    // Where a pose stands: the middle of its two toes on the grass (with the hips' facing).
    const feetOf=(a,clip,time)=>{const h=hipsOf(a,clip,time),l=a.bones.mixamorigLeftToeBase,r=a.bones.mixamorigRightToeBase;if(!l||!r)return h;
      l.getWorldPosition(sample);const x=sample.x,z=sample.z;r.getWorldPosition(sample);return {x:(x+sample.x)/2,z:(z+sample.z)/2,face:h.face};};
    const rebase=(a,clip,name,{zero,from,to,share})=>{
      const P=a.hips.parent;a.holder.updateMatrixWorld(true);
      const M=P.matrixWorld.clone(),Mi=M.clone().invert(),Pq=new T.Quaternion(),Ps=new T.Vector3(),Pp=new T.Vector3();M.decompose(Pp,Pq,Ps);
      const yaw=to&&from?to.face-from.face:0,Q=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),yaw);
      const Lq=Pq.clone().invert().multiply(Q).multiply(Pq);
      const tracks=clip.tracks.map(t=>{
        const n=t.name;if(!n.startsWith(`${a.hips.name}.`))return share&&!yaw?t:t.clone();
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
        // Clip seconds used after u seconds of running (a stutter slows the stride, so the run covers less ground).
        const N=48,cum=[0];for(let j=1;j<=N;j+=1){const u=(j-.5)*r.jog/N;let f=1;if(r.stutter){const {at,len,k}=r.stutter,e=Math.min(.12,len/3);f=1-(1-k)*cm3Easy((u-at)/e)*cm3Easy((at+len-u)/e);}cum.push(cum[j-1]+f*r.rate*r.jog/N);}
        const total=cum[N],clipAt=u=>{const x=Math.max(0,Math.min(N,u/(r.jog||1)*N)),j=Math.min(N-1,Math.floor(x));return cum[j]+(cum[j+1]-cum[j])*(x-j);};
        if(r.jog){const h=hipsOf(taker,jog,JOG_JOIN-total);start=h;}
        const idle0=hipsOf(taker,TK.offensiveIdle,0);
        return {...r,total,clipAt,start,idle:rebase(taker,TK.offensiveIdle,`cmIdle${i}`,{zero:"xz",from:idle0,to:start})};
      });
      // r90 (Nik's Mixamo uploads 2026-11-08): a few reactions each way, picked per kick (REACTIONS); a clip file without
      // the newer ones still plays the first of each.
      // r91: a reaction joins the follow-through on the foot he stands on. The kick ends with the kicking (right) foot down
      // and the left one lifting (toe 10 cm up), so the right toe stays where the kick left it (turned with the hips) and
      // the lifting foot steps into the reaction's stance; carrying the hips over slid a standing foot 20-40 cm.
      const plant=(clip,time)=>{const h=hipsOf(taker,clip,time),f=taker.bones.mixamorigRightToeBase;if(!f)return h;f.getWorldPosition(sample);return {x:sample.x,z:sample.z,face:h.face};};
      const kickPlant=plant(TK.penaltyKick,TK.penaltyKick.duration-.034);
      const reaction=n=>rebase(taker,TK[n],`cmReact_${n}`,{zero:"xz",from:plant(TK[n],0),to:kickPlant});
      const react={};for(const [k,list] of Object.entries(REACTIONS))react[k]=list.filter(n=>TK[n]).map(reaction);
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
      if(keeper.clips.defeated)KC.defeated=rebase(keeper,keeper.clips.defeated,"cm_gkDefeated",{zero:"xz"});
      // r91: a keeper's shuffle along his line during the run-up (Nik's Soccer Game Pack, Mixamo "Goalkeeper Sidestep", both
      // ways): the step keeps its sideways travel, so the feet never slide.
      for(const n of ["gkStepL","gkStepR"])if(keeper.clips[n])KC[n]=rebase(keeper,keeper.clips[n],`cm_${n}`,{zero:"z"});
      // r91: a dive or block the other way is the same clip with the keeper flipped (holder scale.x -1). Flipped only when
      // the move began, his stance, arms and head swapped sides in one frame (a hand jumped 74 cm). His waiting clips are
      // also kept mirrored (left and right tracks swapped, the side-to-side parts negated): for a flipped move he is
      // flipped from the kick's start and plays them mirrored, which shows exactly the plain clip, so nothing jumps.
      const flipName=n=>n.replace(/^mixamorig(Left|Right)/,(_m,s)=>`mixamorig${s==="Left"?"Right":"Left"}`);
      const mirror=c=>new T.AnimationClip(`${c.name}_m`,c.duration,c.tracks.map(t=>{const k=t.clone(),v=k.values;k.name=flipName(t.name);
        if(t.name.endsWith(".quaternion"))for(let i=0;i<v.length;i+=4){v[i+1]=-v[i+1];v[i+2]=-v[i+2];}
        else if(t.name.endsWith(".position"))for(let i=0;i<v.length;i+=3)v[i]=-v[i];
        return k;}));
      KC.mirror={};for(const n of ["gkIdle","gkStepL","gkStepR"])if(KC[n])KC.mirror[n]=mirror(KC[n]);
      // r91: once his dive or block is over and he is back on his feet, the keeper reacts: a fist pump when the ball stayed
      // out, head down when it went in. Each reaction starts where that move ends: the middle of his feet is carried there
      // (no turn), so going into it each foot moves only by the change of stance (10-14 cm, both feet alike), never a
      // slide. Only the hips track is new, the other tracks are shared with the clip. Reduce Motion shows the move's
      // settled end, without a reaction.
      KC.after={};
      for(const [k,n] of [["save","cheer"],["goal","disappointed"]])if(keeper.clips[n]){
        const c=keeper.clips[n],from=feetOf(keeper,c,0),by={};
        for(const m of new Set([...KEEPS.L,...KEEPS.R].filter(m=>!m.hold).map(m=>m.c))){
          const to=feetOf(keeper,KC[m],KC[m].duration-1e-3);
          by[m]=rebase(keeper,c,`cm_gk_${k}_${m}`,{zero:"xz",from,to:{x:to.x,z:to.z,face:from.face},share:true});}
        KC.after[k]=by;}
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

    // r90 L04: breathing on top of the idle clips while a player waits: the chest rises and the shoulders lift a little on a
    // slow breath (about 15 a minute, each man on his own phase), the head held level. Bones are posed fresh every frame, so
    // this never builds up; Reduce Motion stops the clock and with it the breath.
    const breathe=(a,live,amt)=>{
      const b=a.bones,ph=a.holder.name.length*.7,s=Math.sin(live*1.65+ph),k=.022*amt*s;
      b.mixamorigSpine2?.rotateX(-k);b.mixamorigNeck?.rotateX(k*.8);
      b.mixamorigLeftShoulder?.rotateZ(k*.35);b.mixamorigRightShoulder?.rotateZ(-k*.35);
    };

    // r90 LOOK: contact shadows. A soft dark patch on the turf under the taker, the keeper and the ball, at every level: it
    // is what plants them on the grass (Light's shadow map is small and soft). Higher levels keep their real shadows and
    // the patch goes lighter. r91: drawn by the turf itself (S.contact, no draw of its own), each player as a capsule from
    // between his feet to under his head, so a keeper down after a dive shades the grass along his whole length; the
    // patch widens and fades as a body leaves the ground (the hips' height over its standing height).
    const contactK=L<=0?.62:.5,CONTACT={taker:1.15,keeper:1.25,ball:.36},cFeet=new T.Vector3(),cHead=new T.Vector3();
    const contactOf=(a,w,lift)=>{
      if(a&&!a.holder.visible)return null;
      if(a){a.hips.getWorldPosition(sample);const lf=a.bones.mixamorigLeftFoot,rf=a.bones.mixamorigRightFoot,hd=a.bones.mixamorigHead;
        if(lf&&rf){lf.getWorldPosition(cFeet);rf.getWorldPosition(cHead);cFeet.add(cHead).multiplyScalar(.5);}else cFeet.copy(sample);
        if(hd)hd.getWorldPosition(cHead);else cHead.copy(sample);}
      else{sample.copy(ball.position);cFeet.copy(sample);cHead.copy(sample);}
      const h=Math.max(0,sample.y-lift),k=Math.max(0,1-h/2.2);
      return [cFeet.x,cFeet.z,cHead.x,cHead.z,w*(1+h*.5)/2,contactK*k];
    };
    const contactAt=()=>S.contact?.([contactOf(taker,CONTACT.taker,1),contactOf(keeper,CONTACT.keeper,1),contactOf(null,CONTACT.ball,BALL_R)]);

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
    const kitMemo=new Map(),kitTex=new Map();
    const dress=(a,club,role,vs)=>{
      look(a,club,role);
      // r90 L04: a squad number on the back (the camera is behind the taker): one per club for the Showdown, 1 for keepers.
      const number=cm3KitNumber(club,role);
      // r90 MOTION M2: a Showdown has four kits at most (each club taking and keeping, against the other), so each is painted
      // once and its textures stay uploaded: a new kick only swaps maps (painting one cost 1.1-2.2 s of main thread).
      const memo=cm3KitMemo(a.body,club,role,vs,number);
      // Painted on the season page already (cm3Warm): taken over, never painted twice.
      if(!kitMemo.has(memo)&&cm3Kits.has(memo)){kitMemo.set(memo,cm3Kits.get(memo));cm3Kits.delete(memo);}
      let t=kitMemo.get(memo);if(!t){try{t=K.textures(club,{layout:a.body,role,vsClub:vs,size:kitSize,number});}catch(_error){return;}kitMemo.set(memo,t);}
      // One texture per canvas: on Ch38 and Ch42 the shirt, shorts (and Ch38's socks) share one atlas.
      const put=()=>{const made=new Map();for(const [m,k] of [["kitShirt","shirt"],["kitShorts","shorts"],["kitSocks","socks"]]){
        const mat=a.mats[m],c=t[k];if(!mat||!c)continue;
        let tex=made.get(c)||kitTex.get(c);if(!tex){tex=new T.CanvasTexture(c);tex.flipY=false;tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=aniso;tex.userData.cmKit=true;kitTex.set(c,tex);}made.set(c,tex);
        if(mat.map!==tex){mat.map=tex;if(mat.isMeshPhysicalMaterial)mat.sheenColorMap=tex;mat.color.setRGB(1,1,1);mat.roughness=.72;mat.needsUpdate=true;}
      }};
      const token=a.kitToken=(a.kitToken||0)+1;
      // A body-mapped kit is blank until its kit map has loaded: it goes on only when painted (the last kit stays meanwhile).
      if(t.shirt===t.shorts){Promise.resolve(t.ready).then(()=>{if(!disposed&&a.kitToken===token)put();},()=>{});return;}
      // A kit painted in full already went up to the GPU: no second upload.
      put();if(t.cmUploaded)return;Promise.resolve(t.ready).then(()=>{if(disposed||a.kitToken!==token)return;t.cmUploaded=true;for(const m of ["kitShirt","kitShorts","kitSocks"])if(a.mats[m]?.map)a.mats[m].map.needsUpdate=true;},()=>{});
    };

    // ---------- the kick ----------
    let plan=null,frozenAt=null,frozenClock=null,raf=0,alive=true,disposed=false;
    const clockNow=()=>frozenClock!==null?frozenClock:cm3Clock();
    const t0=cm3Clock();
    const ballFree={p:new T.Vector3(),v:new T.Vector3(),t:0,on:false};
    // The back net's plane at a height (z): upright to 1.5 m, then sloping forward to the roof.
    const netBack=y=>-2.08+Math.max(0,y-1.5)*1.1;
    // The ball in the back net: S.netPush moves the cords behind it, so they always wrap the ball as it stretches them.
    const netPushAt=still=>{if(!S.netPush)return;const on=Boolean(!still&&plan&&plan.after.kind==="net"&&ballFree.on);
      const b=ball.position;S.netPush(b.x,b.y,on?b.z-BALL_R:null,on?b.x+Math.sign(b.x||1)*BALL_R:null,b.z);};
    const v3=(a,b,c)=>new T.Vector3(a,b,c);
    const pick=(list,n)=>list[((n%list.length)+list.length)%list.length];
    const styleOf=(takerClub,round)=>cm3Hash(`run|${takerClub||""}|${round||1}`)%RUNUPS.length;
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
      // One number per kick for its small variations (curl, woodwork): the same on both phones.
      const luck=cm3Hash(`ball|${lineup.taker}|${round}|${k.shot||"-"}|${k.dive||"M"}|${k.goal?1:0}`);
      // Where the keeper's gloves are at full stretch: a save meets them there.
      keeperAt(move,move.tc);
      if(!k.shot){target=v3(.7,GOAL_H+1.05,-.3);after={kind:"over"};}
      else if(k.goal){
        const s=k.shot==="M"?pick(GOAL_SPOTS.mid,round):pick(GOAL_SPOTS.side,round),sx=k.shot==="L"?-1:k.shot==="R"?1:1;
        target=v3(k.shot==="M"?s[0]:sx*s[0],s[1],0);after={kind:"net"};
        // r90 woodwork: now and then a goal goes in off the inside of the post, or a high one down off the bar. The ball
        // arrives touching the wood (centres 17 cm apart) and glances in; nothing changes the result.
        const touch=WOOD_R+BALL_R,phi=.17;
        if(k.shot!=="M"&&luck%4===0){const y=.55+(luck>>>3)%9*.12;target=v3(sx*(HALF-touch*Math.cos(phi)),y,touch*Math.sin(phi));after={kind:"net",wood:v3(-sx*Math.cos(phi),0,Math.sin(phi))};}
        else if(k.shot==="M"&&s[1]>1.8&&luck%3===0){target=v3(s[0],BAR_Y-touch*Math.cos(phi),touch*Math.sin(phi));after={kind:"net",wood:v3(0,-Math.cos(phi),Math.sin(phi))};}
      }else{
        // A save: the ball's surface meets the leading palm (both palms on a catch), on the side the shot comes from.
        hold=Boolean(move.hold);
        const palm=hold?gloveL.clone().add(gloveR).multiplyScalar(.5):(side==="L"?(gloveL.x<gloveR.x?gloveL:gloveR):side==="R"?(gloveL.x>gloveR.x?gloveL:gloveR):(gloveL.y>gloveR.y?gloveL:gloveR)).clone();
        const toShot=start.clone().sub(palm).normalize();
        target=palm.clone().addScaledVector(toShot,BALL_R+(hold?.0:.02));target.y=Math.max(BALL_R,target.y);
        after={kind:hold?"held":"parry",palm};
      }
      // Real flight (about 90 km/h): gravity plus the side spin's Magnus pull. A placed side shot curls out toward its corner,
      // a middle one barely bends; one launch velocity is solved so the ball still reaches its target at the arrival time.
      const sideSign=target.x<-.3?-1:target.x>.3?1:(luck&1?1:-1);
      const curl=v3(sideSign*(Math.abs(target.x)>.3?1.4+(luck>>>4)%7*.35:.25+(luck>>>4)%3*.15),0,0);
      const acc=G.clone().add(curl);
      const v0=target.clone().sub(start).addScaledVector(acc,-.5*FLIGHT*FLIGHT).multiplyScalar(1/FLIGHT);
      // The ball turns the way that makes the curl (v x a) with a little topspin, ~10 turns a second.
      const spinSide=v0.clone().cross(curl).normalize(),top=v3(0,1,0).cross(v0).normalize();
      const spinAxis=spinSide.multiplyScalar(.85).addScaledVector(top,.4).normalize(),spinRate=v0.length()/BALL_R*.18;
      const scored=Boolean(k.goal&&k.shot),pool=scored?react.goal:react.miss;
      // Beaten standing still (he stayed in the middle, the ball went to a corner): no catch at thin air; he watches it in.
      const rooted=k.goal&&k.shot&&side==="M"&&KC.defeated?ROOTED:null;
      // r91: two kicks in three the keeper shuffles one step along his line during the run-up and back (the same step played
      // backwards, so he lands where he started and every save still meets the ball), done before he sets for the strike.
      // It always ends before he sets for the dive: an early dive moves it earlier, and one too early for it leaves it out.
      const kStart=FLIGHT-(rooted||move).tc/(rooted||move).s;
      let shuffle=null;
      if(KC.gkStepL&&KC.gkStepR&&(luck>>>12)%3){const c=(luck>>>14)%2?"gkStepL":"gkStepR",len=2*(KC[c].duration-1e-3)+.12+.22;
        const at=Math.min(-1.95+((luck>>>16)%5)*.06,kStart-.05-len);if(at>=-RUNUP+.1)shuffle={c,at};}
      return {...k,round,shuffle,move:rooted||move,react:pool[(luck>>>8)%pool.length],style:styleOf(lineup.taker,round),start,target,v0,acc,spinAxis,spinRate,after,hold,kStart,netHit:false};
    };
    // The taker at time t (seconds from the strike); idle while waiting.
    const takerAt=(t,live)=>{
      const st=styles[plan?plan.style:lineup.style||0];
      if(!plan){taker.pose([{clip:st.idle,time:live%st.idle.duration,w:1}]);breathe(taker,live,1);return;}
      const kickT=t+KICK_HIT,jogLen=st.jog,runStart=-KICK_HIT-jogLen;
      const idle={clip:st.idle,time:(live)%st.idle.duration,w:1};
      if(kickT>=0){
        const end=TK.penaltyKick.duration-.034;
        if(kickT<end){
          const k={clip:TK.penaltyKick,time:kickT,w:1};
          if(st.jog&&kickT<.12){const j=cm3Easy(kickT/.12);taker.pose([{clip:jog,time:JOG_JOIN+kickT*st.rate,w:1-j},{...k,w:j}]);return;}
          taker.pose([k]);return;
        }
        const r=plan.react,rt=kickT-end,b=cm3Easy(rt/.4);
        taker.pose([{clip:TK.penaltyKick,time:end,w:1-b},{clip:r,time:rt,w:b}]);return;
      }
      if(!st.jog){
        // Two steps from a standstill: he waits, then goes.
        const b=cm3Easy((kickT+.28)/.28);taker.pose([{...idle,w:1-b},{clip:TK.penaltyKick,time:0,w:b}]);return;
      }
      if(t<runStart){taker.pose([idle]);return;}
      const jt=JOG_JOIN-st.total+st.clipAt(t-runStart),b=cm3Easy((t-runStart)/.3);
      taker.pose([{...idle,w:1-b},{clip:jog,time:jt,w:b}]);
    };
    const keeperPose=(t,live,still)=>{
      const flip=Boolean(plan&&plan.move.m),W=flip?KC.mirror:KC,idle={clip:W.gkIdle,time:live%W.gkIdle.duration,w:1};
      if(!plan||t<plan.kStart){keeper.holder.scale.x=flip?-1:1;
        const sh=plan&&plan.shuffle,c=sh&&W[sh.c];
        if(c){const D=c.duration-1e-3,H=.12,u=t-sh.at;
          // out, a beat on the far foot, back (the step backwards), then into his stance again
          if(u>0&&u<2*D+H+.22){const ct=u<D?u:u<D+H?D:Math.max(0,2*D+H-u),w=u<.3?cm3Easy(u/.3):u>2*D+H?1-cm3Easy((u-2*D-H)/.22):1;
            keeper.pose([{...idle,w:1-w},{clip:c,time:ct,w}]);return;}}
        keeper.pose([idle]);breathe(keeper,live,.8);return;}
      const m=plan.move,ct=(t-plan.kStart)*m.s,b=cm3Easy(ct/(m.s*(m.rooted?.45:.12)));
      keeper.holder.scale.x=m.m?-1:1;
      const D=KC[m.c].duration-1e-3,r=!still&&!m.rooted&&!m.hold&&KC.after[plan.goal&&plan.shot?"goal":"save"]?.[m.c];
      if(r&&ct>D){const rt=(ct-D)/m.s,w=cm3Easy(rt/.5);keeper.pose([{clip:KC[m.c],time:D,w:1-w},{clip:r,time:rt,w}]);return;}
      keeper.pose([{...idle,w:1-b},{clip:KC[m.c],time:ct,w:b}]);
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
        const back=netBack(s.p.y),side=HALF-.04-BALL_R,roof=GOAL_H-.06-BALL_R;
        // r91: the back net gives. It stretches round the ball like a stiff, heavily damped spring (about 0.4 m for a
        // 20 m/s strike), grips it (the cords drag on its sideways and falling pace), and lets it go with almost nothing,
        // so the ball sinks into the net and drops down inside it instead of stopping dead on the cords.
        const pen=back-.06+BALL_R-s.p.z;// the cords hang a few cm behind the frame's line (their sag)
        if(pen>0){s.v.z+=(1100*pen-50*s.v.z)*dt;const grip=Math.exp(-7*dt);s.v.x*=grip;s.v.y*=grip;}
        // the side netting the same way (it hangs on the posts' line)
        const ps=Math.abs(s.p.x)-side;
        if(ps>0){const sg=Math.sign(s.p.x);s.v.x-=(sg*1100*ps+50*s.v.x)*dt;const grip=Math.exp(-7*dt);s.v.z*=grip;s.v.y*=grip;}
        if(s.p.y>roof){s.p.y=roof;if(s.v.y>0)s.v.y*=-.1;}
      }
      ball.position.copy(s.p);
      roll.crossVectors(UP,s.v);const rs=roll.length();if(rs>1e-5){spinQ.setFromAxisAngle(roll.multiplyScalar(1/rs),rs*dt/BALL_R);ball.quaternion.premultiply(spinQ);}
    };
    const ballAt=t=>{
      if(!plan||t<=0){ball.position.set(0,BALL_R,SPOT_Z);ball.rotation.set(.3,.6,0);ballFree.on=false;return;}
      if(t<FLIGHT){
        ball.position.copy(plan.start).addScaledVector(plan.v0,t).addScaledVector(plan.acc,.5*t*t);
        ball.rotation.set(.3,.6,0);spinQ.setFromAxisAngle(plan.spinAxis,plan.spinRate*t);ball.quaternion.premultiply(spinQ);ballFree.on=false;return;}
      if(plan.hold){// caught: the ball stays between his palms
        palms();ball.position.copy(gloveL).add(gloveR).multiplyScalar(.5);ball.position.y=Math.max(BALL_R,ball.position.y);return;}
      if(!ballFree.on||ballFree.t>t+1e-6){
        ballFree.on=true;ballFree.t=FLIGHT;ballFree.p.copy(plan.target);
        const vA=plan.v0.clone().addScaledVector(plan.acc,FLIGHT);
        // Off the wood: the glancing part of the speed turns about the contact normal and loses some pace.
        const n=plan.after.wood;if(n){const vn=vA.dot(n);if(vn<0)vA.addScaledVector(n,-(1+.55)*vn);vA.multiplyScalar(.9);}
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
    // r90 L04: a low broadcast camera behind and to the left of the taker (ball, taker and keeper in one frame, the stand
    // rising behind the goal), the way a TV penalty is shot; it eases in toward the spot for the kick. It looks straight down
    // the pitch (no yaw), so the goal line and the box lines stay level on screen: a turned camera slants them, and on a small
    // screen a slanted 12 cm line breaks into dashes.
    const CAMB={pos:v3(-1.3,3.05,SPOT_Z+15),look:v3(-1.3,.85,5),hfov:40,vmin:21};
    const CAMP={pos:v3(-.4,2.75,SPOT_Z+11.5),look:v3(0,.85,3)};
    const CAMSLIDE=1.5;
    const camLook=new T.Vector3();
    const cameraAt=(t,live)=>{
      const drift=reducedMotion()?0:1;
      const w=live*.22;let p=CAMB.pos.clone(),l=CAMB.look.clone();
      p.x+=Math.sin(w)*.18*drift;p.y+=Math.sin(w*.7)*.05*drift;
      if(plan&&!reducedMotion()){
        const k=cm3Easy((t+RUNUP)/(RUNUP+.4));p.lerp(CAMP.pos,k);l.lerp(CAMP.look,k);
        if(t>0){const f=cm3Easy(t/1.1);l.x+=ball.position.x*.22*f;l.y+=Math.max(-.2,ball.position.y-1)*.12*f;
          // r91: once the ball is struck the camera slides a little to the right (no turn, so the lines stay level), so the
          // taker standing on the spot no longer hides the keeper and both reactions read.
          const sl=cm3Easy((t-.35)/1.4);p.x+=CAMSLIDE*sl;l.x+=CAMSLIDE*.55*sl;}
      }
      // r91: the next lineup's shot starts exactly where the last kick's shot ended (the camera has slid aside and pushed
      // in by then) and eases back to the waiting shot, so the dissolve between them never shows two goals side by side.
      if(carry.at>-1e8){const k=cm3Easy((clockNow()-carry.at)/1400);if(k<1&&!reducedMotion()){p.lerpVectors(carry.p,p,k);l.lerpVectors(carry.l,l,k);}else carry.at=-1e9;}
      camera.position.copy(p);camLook.copy(l);
      // Proofs only: a close camera on the foot or the gloves ({pos, look, fov}); the game never sets it.
      const cu=api.closeup;if(cu){camera.position.fromArray(cu.pos);camLook.fromArray(cu.look);camera.fov=cu.fov||20;camera.updateProjectionMatrix();}
      camera.lookAt(camLook);camera.updateMatrixWorld();
    };
    const crowdMood=(t,still)=>{
      if(!plan||still||t<FLIGHT)return [null,null];
      const won=plan.goal&&plan.shot?lineup.taker:lineup.keeper,home=String(clubs.playerOne??""),away=String(clubs.playerTwo??"");
      if(home===away)return [null,null];
      const k=cm3Easy((t-FLIGHT)/.35),base=excitement(t),joy=Math.max(.55,1-Math.max(0,t-2.4)*.12),hush=.1;
      return [base+((won===home?joy:hush)-base)*k,base+((won===away?joy:hush)-base)*k];
    };
    const excitement=t=>{if(!plan)return .2;if(t<0)return .2+.4*cm3Easy((t+RUNUP)/RUNUP);if(t<FLIGHT)return .6;
      if(plan.goal&&plan.shot)return Math.max(.45,1-Math.max(0,t-1.6)*.2);return Math.max(.3,.7-(t-FLIGHT)*.35);};

    // ---------- the dissolve between kicks ----------
    // A new taker and keeper come in under a short broadcast dissolve: the last frame fades out over the new one (never
    // to black, never dimmed).
    let snap=null,snapAt=-1e9;const carry={p:new T.Vector3(),l:new T.Vector3(),at:-1e9};
    // Proof numbers for the quality gallery (probe only): draw calls, triangles and the textures' GPU size (mips included).
    const gpuFootprint=()=>{
      const seen=new Set();let bytes=0;
      scene.traverse(o=>{for(const m of [].concat(o.material||[]))for(const v of Object.values(m||{}))if(v&&v.isTexture&&!seen.has(v)){seen.add(v);
        const im=v.image,w=im?.width||0,h=im?.height||0;bytes+=w*h*4*(v.generateMipmaps===false?1:4/3);}});
      const r=renderer.info;return {calls:r.render.calls,tris:r.render.triangles,geometries:r.memory.geometries,textures:r.memory.textures,texMB:+(bytes/1048576).toFixed(1),
        shadowMB:+(lights.reduce((n,l)=>n+(l.castShadow?l.shadow.mapSize.x*l.shadow.mapSize.y*4:0),0)/1048576).toFixed(1),
        lights:lights.length,shadows:lights.filter(l=>l.castShadow).length};
    };
    const overlay=new T.Scene(),overlayCam=new T.OrthographicCamera(-1,1,1,-1,0,1);
    // r90 Light: the snap is a copy of the frame on screen (copyTexSubImage from the canvas), not a second render of the
    // scene into a half-float target: that render built a second shader for every material (19 more programs at Light)
    // and held 13-53 MB at 1920x866. The overlay writes the copied pixels back untouched (no tone mapping, no colour
    // conversion: they are screen pixels already).
    const overlayU={map:{value:null},opacity:{value:0}};
    const overlayMat=keep(new T.ShaderMaterial({uniforms:overlayU,transparent:true,depthTest:false,depthWrite:false,toneMapped:false,
      vertexShader:"varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}",
      fragmentShader:"uniform sampler2D map;uniform float opacity;varying vec2 vUv;void main(){gl_FragColor=vec4(texture2D(map,vUv).rgb,opacity);}"}));
    const overlayGeo=keep(new T.PlaneGeometry(2,2));overlay.add(new T.Mesh(overlayGeo,overlayMat));
    const snapTexture=()=>{
      const size=renderer.getDrawingBufferSize(new T.Vector2());
      if(!snap||snap.image.width!==size.x||snap.image.height!==size.y){snap?.dispose();
        // three's FramebufferTexture (not in our build): storage only, filled by copyFramebufferToTexture.
        snap=new T.Texture({width:size.x,height:size.y});snap.isFramebufferTexture=true;snap.magFilter=snap.minFilter=T.NearestFilter;snap.generateMipmaps=false;snap.needsUpdate=true;overlayU.map.value=snap;}
      return snap;
    };
    const dissolveFrom=()=>{
      if(!cssW||(frozenClock===null&&reducedMotion()))return;
      snapTexture();renderer.setRenderTarget(null);renderer.render(scene,camera);renderer.copyFramebufferToTexture(snap);snapAt=clockNow();
      carry.p.copy(camera.position);carry.l.copy(camLook);carry.at=snapAt;
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
    };
    const paint=()=>{
      // Reduce Motion (Codex on #1254): every clock stands still. The players hold their pose, the crowd stops swaying, the
      // net never bulges and a kick shows only its settled end (kick() already skips the run-up); the lineup and the
      // result still change. Proofs that freeze the scene clock keep their own clocks.
      const still=frozenClock===null&&reducedMotion();
      const now=clockNow(),live=still?0:(now-t0)/1000;
      const t=frozenAt!==null?frozenAt:plan?(still?SETTLE:(now-plan.startAt)/1000):0;
      keeperPose(t,live,still);takerAt(t,live);ballAt(t);
      contactAt();netPushAt(still);
      // The net takes the ball (the stadium kit times its bulge on its own clock: ours).
      const stadiumT=still?0:plan?(plan.startAt-t0)/1000+t:live;
      const netAt=FLIGHT+(plan&&plan.after.wood?.16:.07);
      if(!still&&plan&&plan.after.kind==="net"&&!plan.netHit&&t>=netAt){plan.netHit=true;S.update((plan.startAt-t0)/1000+netAt,1);S.hitNet(plan.target.x*(plan.after.wood?.8:1),plan.target.y*(plan.after.wood&&plan.after.wood.y<0?.4:.9),plan.v0.length());}
      S.update(stadiumT,still?.2:excitement(t));
      // r91: once the ball is in or kept out, the club that won the kick erupts and the other end falls quiet.
      S.mood?.(...crowdMood(t,still));
      cameraAt(t,live);
      renderer.render(scene,camera);
      const fade=still?0:1-(now-snapAt)/(DISSOLVE*1000);
      if(fade>0&&snap){overlayU.opacity.value=cm3Easy(fade);renderer.autoClear=false;renderer.render(overlay,overlayCam);renderer.autoClear=true;}
    };
    // Smoothness first (Nik 2026-11-04, 2026-11-07): the shared governor (js/gfxTier.js) moves the pixel ratio: down after a
    // second of slow frames, up only when a timed frame shows room, never back to a step that ran slow, and never during a
    // kick (held from kick() to the next reset). Motion never depends on the frame rate: every pose is read from the clock.
    const GFX=root.CareerModeGfxTier;
    // info: what the Device check records beside the frame times (the file set drawn, and whether it is the lighter stand-in).
    const gov=GFX?GFX.governor(renderer,{key:"chamber-men",draw:paint,onChange:()=>{cssW=0;layoutDirty=true;},info:()=>({assets:Q.assets,lite:Boolean(Q.full),crowd:S.crowdCount})}):null;
    const fps=GFX?GFX.overlay(()=>({calls:renderer.info.render.calls,tris:renderer.info.render.triangles,extra:`crowd ${S.crowdCount}`})):null;
    // The box is measured only when it changes (a ResizeObserver, a window resize), never every frame.
    let layoutDirty=true;
    const tick=time=>{
      raf=0;if(disposed)return;
      if(!canvas.isConnected||!svg.isConnected){free();return;}
      if(d.visibilityState!=="hidden"&&!warming){gov?.frame(time);if(layoutDirty){layoutDirty=false;fit();}paint();}
      raf=root.requestAnimationFrame(tick);
    };
    const relayout=()=>{layoutDirty=true;};
    const ro=typeof root.ResizeObserver==="function"?new root.ResizeObserver(relayout):null;
    const free=()=>{
      if(disposed)return;disposed=true;alive=false;if(raf)root.cancelAnimationFrame(raf);ro?.disconnect();root.removeEventListener?.("resize",relayout);
      canvas.removeEventListener("webglcontextrestored",restored);
      gov?.end();fps?.stop();
      for(const r of Object.values(rigs))for(const a of [r.taker.a,r.keeper.a])try{a.mixer.stopAllAction();a.mixer.uncacheRoot(a.model);}catch(_error){}
      scene.traverse(o=>{if(o.geometry)o.geometry.dispose();for(const m of [].concat(o.material||[]))for(const v of Object.values(m))if(v&&v.isTexture)v.dispose();});
      for(const t of kitTex.values())t.dispose();kitTex.clear();kitMemo.clear();
      try{S.dispose();}catch(_error){}
      for(const v of own)try{v.dispose&&v.dispose();}catch(_error){}
      snap?.dispose();envNow?.dispose();
      renderer.dispose();try{renderer.forceContextLoss();}catch(_error){}
      canvas.remove();svg.classList.remove("cm3d-on");
    };
    const setLineup=(takerClub,keeperClub,round)=>{
      const next={taker:String(takerClub||""),keeper:String(keeperClub||""),round:round||1};
      next.style=styleOf(next.taker,next.round);
      if(next.taker===lineup.taker&&next.keeper===lineup.keeper&&next.style===lineup.style)return false;
      lineup=next;useRigs(next.taker,next.keeper);dress(taker,next.taker,"outfield",next.keeper);dress(keeper,next.keeper,"gk",next.taker);
      return true;
    };
    // r90 Light (Nik 2026-11-08: smooth on his Chromebook, 2 CPU threads): everything a Showdown can show is compiled and
    // uploaded behind the loading screen. Both lineups (each club taking and keeping) are dressed, every rig is drawn once
    // with its shadow, and the dissolve snap is made and drawn, so no shader compile or texture upload lands in play (the
    // other club's first kick cost 2-7 s of long tasks on a 2-thread 4x-throttled CPU). Shaders compile in parallel where
    // the GPU driver can (KHR_parallel_shader_compile through compileAsync).
    let warming=null;
    const compileAll=async()=>{
      try{if(typeof renderer.compileAsync==="function")await renderer.compileAsync(scene,camera);else renderer.compile(scene,camera);}catch(_error){}
    };
    const prewarm=async()=>{
      const one=clubs.playerOne,two=clubs.playerTwo,back={...lineup};
      const kits=()=>Promise.all([...kitMemo.values()].map(t=>Promise.resolve(t&&t.ready).catch(()=>{})));
      if(two!==undefined&&String(two)!==String(one)){setLineup(two,one,1);await kits();if(disposed)return;}
      setLineup(one,two,1);await kits();cm3Kits.clear();if(disposed)return;
      const shown=[];for(const r of Object.values(rigs))for(const a of [r.taker.a,r.keeper.a]){shown.push([a.holder,a.holder.visible]);a.holder.visible=true;}
      try{
        await compileAll();if(disposed)return;
        const seen=new Set(),up=v=>{if(v&&v.isTexture&&!seen.has(v)){seen.add(v);try{renderer.initTexture(v);}catch(_error){}}};
        scene.traverse(o=>{for(const m of [].concat(o.material||[]))for(const v of Object.values(m||{}))up(v);});
        for(const t of kitTex.values())up(t);
        paint();
        if(cssW&&!reducedMotion()){dissolveFrom();overlayU.opacity.value=0;renderer.autoClear=false;renderer.render(overlay,overlayCam);renderer.autoClear=true;}
      }finally{for(const [h,v] of shown)h.visible=v;snapAt=-1e9;}
      // Back to the lineup on screen (a rebuild after a lost context runs this mid-Showdown).
      if(back.taker!==null&&back.taker!==undefined)setLineup(back.taker,back.keeper,back.round);
      if(!disposed)paint();
    };
    const api={
      mode:"broadcast",
      reset(){if(plan&&clockNow()-snapAt>120)dissolveFrom();plan=null;frozenAt=null;ballFree.on=false;gov?.hold(false);},
      // Who is on the pitch for the coming kick: the shooter's club takes it, the other club keeps goal.
      lineup(k){const fresh=k&&(String(k.taker||"")!==lineup.taker||String(k.keeper||"")!==lineup.keeper||styleOf(String(k.taker||""),k.round||1)!==lineup.style);
        if(fresh&&!plan&&clockNow()-snapAt>120&&lineup.taker!==null)dissolveFrom();if(k)setLineup(k.taker,k.keeper,k.round);},
      // k = {shot: "L"|"M"|"R"|null (clock ran out), dive: "L"|"M"|"R", goal: boolean, animate: boolean, round}
      kick(k){
        plan=makePlan({shot:k.shot||null,dive:k.dive||"M",goal:Boolean(k.goal),round:k.round||1});
        ballFree.on=false;
        const still=!k.animate||reducedMotion();
        plan.startAt=clockNow()+(still?-SETTLE*1000:RUNUP*1000);frozenAt=null;gov?.hold(true);
      },
      runUpMs:RUNUP*1000,
      // clock (ms, optional) also freezes the scene clock, so a proof can step through a dissolve frame by frame.
      at(t,clock){frozenAt=typeof t==="number"?t:null;frozenClock=typeof clock==="number"?clock:null;fit();paint();},
      // Behind the loading screen: a few timed frames pick the level for this device (they also compile every shader).
      async warm(){if(warming)await warming;if(!GFX||disposed)return;const before=renderer.getPixelRatio();await GFX.calibrate(renderer,paint,{frames:6});if(renderer.getPixelRatio()!==before){cssW=0;fit();}gov?.resize();paint();},
      dispose:free,
      lit:Boolean(scene.environment),
      probe(){return {mode:"broadcast",pixelRatio:renderer.getPixelRatio(),frameMs:gov?gov.frameMs():null,level:Q.name,kicking:Boolean(plan),keeper:keeper.holder.position.toArray(),ball:ball.position.toArray(),taker:taker.hips.getWorldPosition(new T.Vector3()).toArray(),lineup:{...lineup},move:plan?plan.move.c:null,react:plan&&plan.react?plan.react.name:null,strike:struck,bodies:{taker:taker.body,keeper:keeper.body},palms:[gloveL.toArray(),gloveR.toArray()],gpu:gpuFootprint()};},
      get alive(){return alive;}
    };
    setLineup(clubs.playerOne,clubs.playerTwo,1);
    svg.parentNode.insertBefore(canvas,svg);
    svg.classList.add("cm3d-on");
    fit();cameraAt(0,0);
    warming=prewarm().catch(()=>{}).finally(()=>{warming=null;});
    ro?.observe(svg);if(svg.parentNode)ro?.observe(svg.parentNode);root.addEventListener?.("resize",relayout);
    // r90 Light (C7): a lost WebGL context keeps the screen. three.js holds the canvas through the loss and rebuilds its GPU
    // state when the context comes back; then everything is compiled and uploaded again before the next frame, as at
    // mount, so the return is one step, not a run of stalls. The drawn goal never replaces it.
    const restored=()=>{if(disposed)return;wrapShadow();try{refilter();}catch(_error){}cssW=0;layoutDirty=true;fit();warming=prewarm().catch(()=>{}).finally(()=>{warming=null;});};
    canvas.addEventListener("webglcontextrestored",restored);
    raf=root.requestAnimationFrame(tick);
    return api;
  }
  function cm3Clock(){return root.performance?.now?.()??Date.now();}

  // mount(svg) (cm3Mount): the 3D goal in place of the SVG art, resolved once its first frame is drawn; null when it cannot run here.
  // opts = {clubs:{playerOne, playerTwo}}: the taker and keeper clubs for the first kick.
  // The device's level (js/gfxTier.js, in the shell); light and phone screens take the lighter player and ball files.
  const GFX_JS="js/gfxTier.js";
  const GFX_FALLBACK={level:1,name:"medium",pixelRatio:1,antialias:true,shadowSize:1024,density:.7,bloom:false};
  // full (r91, the Device check): the level's own file set is waited for even on a slow line, so the level is timed on what it
  // really draws.
  async function cm3Quality(clubs,full){
    const ok=await cm3Script("gfx-tier",GFX_JS,()=>Boolean(root.CareerModeGfxTier)).catch(()=>false);
    let p=GFX_FALLBACK;try{if(ok)p=root.CareerModeGfxTier.profile();}catch(_error){}
    // Asset size follows the texture level (a phone below High is one size down; a strong phone at High+ gets the full set).
    const q={...p,assets:(p.textureLevel??p.level)<=1?"phone":"desktop"};
    // r90 MOTION M36 (Nik: never flat on his Chromebook): on a slow line (under 10 Mbps) a high level's full set (9.9-14 MB)
    // cannot come in a screen's wait. It opens on the Balanced file set (5.2 MB; same lights, shadows and pixel ratio for its
    // level) until its own set is in the cache: the season page fetches that at low priority after the lighter set, so a
    // later open has it.
    // A light set the season page already parsed is used before a full set that came in since (no parse at the tap).
    if(!full&&q.assets==="desktop"&&cm3SlowLink()&&(cm3Parsed?.lite||!await cm3Scripts()||!(await Promise.all(cm3Urls(q,clubs).map(cm3Cached))).every(Boolean))){
      q.full={textureLevel:q.textureLevel??q.level};q.assets="phone";q.textureLevel=1;}
    return q;
  }
  function cm3SlowLink(){const c=root.navigator?.connection;return Boolean(c&&Number.isFinite(c.downlink)&&c.downlink>0&&c.downlink<10);}
  // The service worker keeps every game file under its versioned key (the path with v set to the page's app-asset-revision), so
  // that key is the one looked up; the plain URL is checked first for a cache without the worker (Codex on #1327).
  async function cm3Cached(path){try{if(!root.caches||typeof root.caches.match!=="function")return false;const u=new URL(path,root.location.href);
    if(await root.caches.match(u.href))return true;const rev=root.document?.querySelector?.('meta[name="app-asset-revision"]')?.content;if(!rev)return false;
    u.searchParams.set("v",rev);return Boolean(await root.caches.match(u.href));}catch(_error){return false;}}
  function cm3Urls(Q,clubs){
    const S=root.CareerModeChamberMenStadium,level=Q.textureLevel??Q.level;
    return [ENGINE_PATH,PLAYER_PATH+`anims_${Q.assets}.glb`,...cm3BodyFiles(Q.assets,clubs).map(([_n,f])=>PLAYER_PATH+f),
      ...(S&&typeof S.urls==="function"?S.urls({phone:Q.assets==="phone",level}):[])];
  }
  async function cm3Mount(svg,opts){
    // opts.signal (BUGS hunt BUG-05): the step gave up on the scene; nothing more is parsed or built (r90 M1: the downloads
    // finish into the cache, for the next open).
    const off=()=>Boolean(opts&&opts.signal&&opts.signal.aborted);
    if(!svg||!svg.parentNode||root.CMS_CHAMBER_MEN_3D==="off"||!hasWebgl2()||off())return null;
    cm3Mounting+=1;let opened=false;
    try{
      benchMount=Boolean(opts&&opts.fullFiles);
      const Q=await cm3Quality(opts&&opts.clubs,Boolean(opts&&opts.fullFiles));if(off())return null;
      // r91 tab-crash guard: the scene is opening from here (the load and the texture upload are its heaviest moment, long
      // before its governor exists). Every way out without a scene takes the mark off again (finally).
      try{root.CareerModeGfxTier?.sceneOpening?.("chamber-men");}catch(_error){}
      // r90 Light: a file that fails to come in (a dropped connection on a slow line) is fetched once more before the
      // drawn goal is used: a failed download is not a missing GPU.
      // The season page's parse for this level and these clubs, when it made one (a parse for others is let go).
      const key=cm3ParseKey(Q,opts&&opts.clubs),held=cm3Parsed&&cm3Parsed.key===key?cm3Parsed.work:null;
      if(cm3Parsed&&!held)cm3Parsed.work.then(x=>{if(x)cm3FreeExtras(x);},()=>{});
      cm3Parsed=null;
      let pre=held?null:cm3Prefetch(Q.assets,opts&&opts.clubs);
      await cm3Settle([ENGINE_PATH]);
      const T=await loadEngine().catch(()=>off()?null:loadEngine());if(!T||off())return null;
      let extras=held?await held:await cm3Extras(T,Q,pre);
      if(!extras&&!off()){pre=cm3Prefetch(Q.assets,opts&&opts.clubs);extras=await cm3Extras(T,Q,pre);}
      if(off()){if(extras)cm3FreeExtras(extras);return null;}
      // r90: no stadium or players in time is the SVG goal, never a second look (the gold hall and its lounge light are gone).
      if(!extras)return null;
      if(!svg.isConnected||off()){cm3FreeExtras(extras);return null;}
      let api=null;
      try{api=buildBroadcast(T,svg,extras,opts,Q);await api.warm();if(off()){api.dispose();return null;}}
      catch(error){try{root.console?.warn?.("Chamber Men 3D scene failed; the drawn goal plays.",error);}catch(_error){}cm3FreeExtras(extras);svg.parentNode?.querySelector?.(":scope > canvas.cmGoal3d")?.remove();svg.classList.remove("cm3d-on");return null;}
      CareerModeChamberMen3d.last=api;opened=true;
      return api;
    }catch(error){
      try{root.console?.warn?.("Chamber Men 3D goal unavailable; the drawn goal plays instead.",error);}catch(_error){}
      return null;
    }finally{cm3Mounting-=1;if(!opened){try{root.CareerModeGfxTier?.sceneOpened?.();}catch(_error){}}}
  }
  const CareerModeChamberMen3d={contractVersion:1,feature:"cms-chamber-men-3d",enginePath:ENGINE_PATH,mount:cm3Mount,warm:cm3Warm,last:null};
  root.CareerModeChamberMen3d=CareerModeChamberMen3d;
})(typeof globalThis!=="undefined"?globalThis:this);
