(function(root,factory){
  const api=factory();
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.ShowdownClubIdentityV21Renderer=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";

  const VERSION="2.1.0";

  function hash(value){
    let h=2166136261;
    const text=String(value||"").normalize("NFKD");
    for(let i=0;i<text.length;i+=1){h^=text.charCodeAt(i);h=Math.imul(h,16777619);}
    return h>>>0;
  }
  function esc(value){return String(value||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\"/g,"&quot;").replace(/'/g,"&apos;");}
  function initials(name){
    const clean=String(name||"").replace(/\b(fc|cf|afc|sc|ac|ss|calcio|club|football)\b/gi," ").replace(/[^\p{L}\p{N}\s-]/gu," ").trim();
    if(!clean)return "--";
    const words=clean.split(/[\s-]+/).filter(Boolean);
    return words.length===1?words[0].slice(0,3).toUpperCase():words.slice(0,3).map(w=>w[0]).join("").toUpperCase();
  }
  function silhouette(family,variant){
    const n=hash(variant)%4;
    const paths={
      "shield-tall":["M12 7H88V55C88 82 70 101 50 108C30 101 12 82 12 55Z","M16 6H84L91 25V58C91 83 70 101 50 108C30 101 9 83 9 58V25Z","M13 9H87V49C87 80 70 101 50 108C30 101 13 80 13 49Z","M10 9H90L86 66L50 108L14 66Z"],
      "shield-wide":["M7 15Q50 3 93 15V60Q87 91 50 108Q13 91 7 60Z","M8 12H92V63L79 88L50 108L21 88L8 63Z","M6 18L20 8H80L94 18L87 69L50 108L13 69Z","M8 14H92V53C92 80 71 99 50 108C29 99 8 80 8 53Z"],
      "shield-compact":["M15 12H85L90 27V64L50 105L10 64V27Z","M13 11H87V71L50 105L13 71Z","M16 8H84L92 30L81 82L50 105L19 82L8 30Z","M11 14Q50 5 89 14V61Q82 87 50 105Q18 87 11 61Z"],
      "roundel":["M50 7A43 43 0 1 1 50 93A43 43 0 1 1 50 7Z","M50 6C76 6 94 25 94 50S76 94 50 106C24 94 6 75 6 50S24 6 50 6Z","M50 5L86 18L96 54L78 91L50 107L22 91L4 54L14 18Z","M50 8A42 42 0 1 1 50 92A42 42 0 1 1 50 8Z"],
      "pennant":["M10 9H90V38L50 108L10 38Z","M13 8H87V46L50 108L13 46Z","M8 12H92L78 56L50 108L22 56Z","M12 8L88 16L75 63L50 108L25 63Z"],
      "hex-shield":["M50 5L91 28L82 83L50 108L18 83L9 28Z","M50 5L88 20L95 60L72 96L50 108L28 96L5 60L12 20Z","M18 7H82L94 43L78 88L50 108L22 88L6 43Z","M50 4L92 31L82 88L50 108L18 88L8 31Z"],
      "split-panel":["M9 10H91V64L74 91L50 108L26 91L9 64Z","M12 7H88L94 29L82 78L50 108L18 78L6 29Z","M8 13H92V58L83 80L50 108L17 80L8 58Z","M14 7H86L93 39L78 87L50 108L22 87L7 39Z"],
      "crest-oval":["M50 5C76 5 91 22 91 48C91 79 71 99 50 108C29 99 9 79 9 48C9 22 24 5 50 5Z","M50 6C79 6 94 27 90 56C86 84 69 100 50 108C31 100 14 84 10 56C6 27 21 6 50 6Z","M50 5C72 5 89 17 94 40C98 67 78 94 50 108C22 94 2 67 6 40C11 17 28 5 50 5Z","M50 5C78 5 92 24 92 52C92 81 70 101 50 108C30 101 8 81 8 52C8 24 22 5 50 5Z"]
    };
    return (paths[family]||paths["shield-tall"])[n];
  }
  function field(layout,p,s,a,variant){
    const n=hash(variant)%5;
    switch(layout){
      case "vertical-stripes": {const count=3+(n%3);let out=`<rect width="100" height="112" fill="${p}"/>`;const w=100/(count*2);for(let i=0;i<count;i++)out+=`<rect x="${(2*i+1)*w}" width="${w}" height="112" fill="${s}"/>`;return out;}
      case "horizontal-hoops": {let out=`<rect width="100" height="112" fill="${p}"/>`;for(let y=18;y<104;y+=28)out+=`<rect y="${y}" width="100" height="10" fill="${s}"/>`;return out;}
      case "center-lane": return `<rect width="100" height="112" fill="${p}"/><rect x="${34+n}" width="${32-n*2}" height="112" fill="${s}"/><rect x="48" width="4" height="112" fill="${a}" fill-opacity=".45"/>`;
      case "split-vertical": return `<rect width="50" height="112" fill="${p}"/><rect x="50" width="50" height="112" fill="${s}"/><rect x="47" width="6" height="112" fill="${a}" fill-opacity=".32"/>`;
      case "split-horizontal": return `<rect width="100" height="56" fill="${p}"/><rect y="56" width="100" height="56" fill="${s}"/><rect y="53" width="100" height="6" fill="${a}" fill-opacity=".28"/>`;
      case "diagonal": return `<rect width="100" height="112" fill="${p}"/><path d="M-${15+n*2} 112L${86+n*2} 0H118L17 112Z" fill="${s}"/><path d="M7 112L108 0" stroke="${a}" stroke-width="5" stroke-opacity=".35"/>`;
      case "quarters": return `<rect width="100" height="112" fill="${p}"/><rect x="50" width="50" height="56" fill="${s}"/><rect y="56" width="50" height="56" fill="${s}"/><path d="M50 0V112M0 56H100" stroke="${a}" stroke-width="3" stroke-opacity=".32"/>`;
      case "chevron": return `<rect width="100" height="112" fill="${p}"/><path d="M0 ${27+n*3}L50 ${55+n*2}L100 ${27+n*3}V51L50 79L0 51Z" fill="${s}"/><path d="M0 ${34+n*3}L50 ${62+n*2}L100 ${34+n*3}" fill="none" stroke="${a}" stroke-width="4" stroke-opacity=".45"/>`;
      case "radial": return `<rect width="100" height="112" fill="${p}"/><path d="M50 56L0 9V0H18ZM50 56L100 7V0H82ZM50 56L100 103V112H80ZM50 56L0 104V112H20Z" fill="${s}"/><circle cx="50" cy="56" r="${26+n*2}" fill="none" stroke="${a}" stroke-width="5" stroke-opacity=".35"/>`;
      case "framed-field": return `<rect width="100" height="112" fill="${p}"/><rect x="${11+n}" y="${12+n}" width="${78-n*2}" height="${88-n*2}" rx="8" fill="${s}"/><rect x="${18+n}" y="${19+n}" width="${64-n*2}" height="${74-n*2}" rx="5" fill="${p}" fill-opacity=".78"/>`;
      default:return `<rect width="100" height="112" fill="${p}"/>`;
    }
  }
  function texture(kind,color){
    if(kind==="flat")return "";
    if(kind==="rib")return `<g stroke="${color}" stroke-opacity=".13" stroke-width="1">${Array.from({length:10},(_,i)=>`<path d="M${8+i*10} 0V112"/>`).join("")}</g>`;
    if(kind==="micro-grid")return `<g stroke="${color}" stroke-opacity=".12" stroke-width="1">${[20,40,60,80].map(v=>`<path d="M${v} 0V112M0 ${v}H100"/>`).join("")}</g>`;
    if(kind==="stitch-line")return `<path d="M10 18H90M12 91H88" stroke="${color}" stroke-opacity=".35" stroke-width="2" stroke-dasharray="3 4" fill="none"/>`;
    if(kind==="pinstripe")return `<g stroke="${color}" stroke-opacity=".16" stroke-width="1">${[14,28,42,56,70,84].map(v=>`<path d="M${v} 0V112"/>`).join("")}</g>`;
    if(kind==="micro-chevron")return `<g fill="none" stroke="${color}" stroke-opacity=".15" stroke-width="2"><path d="M5 34L25 46L45 34L65 46L85 34"/><path d="M5 68L25 80L45 68L65 80L85 68"/></g>`;
    return `<g fill="${color}" fill-opacity=".08">${[[18,22],[43,18],[70,28],[28,62],[62,68],[82,84]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="3"/>`).join("")}</g>`;
  }
  function device(kind,variant,color){
    const n=hash(variant)%4;
    const y=45+n;
    switch(kind){
      case "ring": return `<circle cx="50" cy="45" r="17" fill="none" stroke="${color}" stroke-width="6"/><path d="M35 45H65" stroke="${color}" stroke-width="4"/>`;
      case "starburst-abstract": return `<path d="M50 25L56 37L71 34L64 47L75 57L59 58L55 73L46 61L32 68L35 51L24 42L40 39Z" fill="${color}"/>`;
      case "bridge-grid-abstract": return `<g fill="none" stroke="${color}" stroke-width="5" stroke-linecap="round"><path d="M27 ${y+10}H73"/><path d="M32 ${y+10}V${y-5}M50 ${y+10}V${y-11}M68 ${y+10}V${y-5}"/><path d="M27 ${y-1}Q50 ${y-19} 73 ${y-1}"/></g>`;
      case "wave-abstract": return `<g fill="none" stroke="${color}" stroke-width="5" stroke-linecap="round"><path d="M24 38Q35 28 46 38T68 38T80 38"/><path d="M20 54Q31 44 42 54T64 54T86 54"/></g>`;
      case "ridge-abstract": return `<path d="M22 59L36 35L48 48L59 29L78 59Z" fill="${color}"/><path d="M29 63H72" stroke="${color}" stroke-width="4"/>`;
      case "tower-grid-abstract": return `<g fill="${color}"><rect x="30" y="35" width="11" height="27"/><rect x="45" y="27" width="11" height="35"/><rect x="60" y="39" width="11" height="23"/><rect x="26" y="60" width="49" height="5"/></g>`;
      case "industrial-beam-abstract": return `<g fill="none" stroke="${color}" stroke-width="5" stroke-linecap="square"><path d="M27 62L42 30L58 62L73 30"/><path d="M25 62H75"/><path d="M36 44H66"/></g>`;
      case "leaf-geometry-abstract": return `<g fill="none" stroke="${color}" stroke-width="5" stroke-linecap="round"><path d="M50 66V31"/><path d="M50 48Q35 35 28 39Q33 55 50 56"/><path d="M50 43Q64 30 72 34Q68 50 50 53"/></g>`;
      case "wing-geometry-abstract": return `<path d="M50 58L24 32L38 59L50 68L62 59L76 32Z" fill="${color}"/><path d="M31 43H69" stroke="${color}" stroke-width="4"/>`;
      case "ball-grid-abstract": return `<g fill="none" stroke="${color}" stroke-width="4"><circle cx="50" cy="47" r="20"/><path d="M35 35L50 47L65 35M34 56L50 47L66 56M50 27V47M50 47V67"/></g>`;
      case "crownline-bar-abstract": return `<g fill="${color}"><rect x="25" y="53" width="50" height="7"/><rect x="30" y="39" width="8" height="16"/><rect x="46" y="31" width="8" height="24"/><rect x="62" y="42" width="8" height="13"/></g>`;
      case "none": return "";
      default:return "";
    }
  }
  function placeAccent(kind,color){
    const base=`stroke="${color}" stroke-width="3" fill="none" stroke-linecap="round" opacity=".8"`;
    if(kind==="coast")return `<path d="M22 87Q32 80 42 87T62 87T82 87" ${base}/>`;
    if(kind==="river")return `<path d="M36 80Q46 87 39 96M61 80Q51 87 58 96" ${base}/>`;
    if(kind==="port")return `<path d="M24 92H76M30 81V92M45 84V92M60 79V92M72 85V92" ${base}/>`;
    if(kind==="industrial")return `<path d="M24 93V83H34V74H45V86H56V78H68V93Z" ${base}/>`;
    if(kind==="metropolitan-grid")return `<path d="M28 79V95M42 79V95M56 79V95M70 79V95M22 84H78M22 91H78" ${base}/>`;
    if(kind==="island")return `<ellipse cx="50" cy="88" rx="25" ry="8" ${base}/>`;
    if(kind==="hills")return `<path d="M22 94L35 82L45 90L59 77L78 94" ${base}/>`;
    if(kind==="masonry")return `<path d="M23 81H77V95H23ZM38 81V88M58 81V88M30 88V95M48 88V95M68 88V95" ${base}/>`;
    if(kind==="modernist")return `<path d="M26 94V80H40V94M46 94V73H58V94M64 94V84H76V94" ${base}/>`;
    return `<path d="M27 91H73" ${base}/>`;
  }
  function heritage(kind,color){
    if(kind==="traditional")return `<path d="M27 20H73M34 25H66" stroke="${color}" stroke-width="2" opacity=".65"/>`;
    if(kind==="early-modern")return `<path d="M25 18H40M60 18H75" stroke="${color}" stroke-width="3" opacity=".65"/>`;
    if(kind==="mid-century")return `<rect x="34" y="16" width="32" height="4" fill="${color}" opacity=".65"/>`;
    if(kind==="modern")return `<g fill="${color}" opacity=".65"><rect x="31" y="15" width="9" height="5"/><rect x="45" y="15" width="24" height="5"/></g>`;
    return "";
  }
  function monogram(style,name,color){
    if(style==="none")return "";
    const text=esc(initials(name));
    const size=style==="single-initial"?20:style==="narrow"?14:15;
    const spacing=style==="geometric"?"1.5":".6";
    const value=style==="single-initial"?text.slice(0,1):text;
    return `<text x="50" y="78" text-anchor="middle" fill="${color}" font-family="Arial,sans-serif" font-size="${size}" font-weight="800" letter-spacing="${spacing}">${value}</text>`;
  }
  function renderSvg(clubName,descriptor,options={}){
    if(!descriptor)throw new Error("Club identity descriptor is required.");
    const id=`ci-${hash(`${clubName}|${descriptor.visualSignature}`).toString(16)}`;
    const shape=silhouette(descriptor.silhouetteFamily,descriptor.outerContourVariant);
    const p=descriptor.primary,s=descriptor.secondary,a=descriptor.accent;
    const title=esc(clubName);
    const aria=options.decorative===true?`aria-hidden="true"`:`role="img" aria-label="${title} original Showdown club identity"`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 112" ${aria}><title>${title}</title><defs><clipPath id="${id}"><path d="${shape}"/></clipPath></defs><path d="${shape}" fill="${p}" stroke="${a}" stroke-width="3"/><g clip-path="url(#${id})">${field(descriptor.fieldLayout,p,s,a,descriptor.fieldVariant)}${texture(descriptor.textureLanguage,a)}<path d="M0 96L100 72V112H0Z" fill="#090d11" opacity=".16"/></g><path d="${shape}" fill="none" stroke="#f7f8f8" stroke-opacity=".42" stroke-width="1.2"/>${heritage(descriptor.heritageAccent,a)}${device(descriptor.centerDevice,descriptor.centerDeviceVariant,a)}${monogram(descriptor.monogramStyle,clubName,"#ffffff")}${placeAccent(descriptor.placeAccent,a)}</svg>`;
  }
  function renderDataUrl(clubName,descriptor){return `url("data:image/svg+xml,${encodeURIComponent(renderSvg(clubName,descriptor,{decorative:true}))}")`;}
  return Object.freeze({version:VERSION,renderSvg,renderDataUrl,hash,initials});
});
