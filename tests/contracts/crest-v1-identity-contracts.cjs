/* CREST-V1 additive contracts: recipes, league marks, SVG id discipline, no badge text. */
const A=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..','..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
function load(f,e){const c={console};c.window=c;vm.createContext(c);vm.runInContext(`${read(f)}\n;globalThis.__x=${e};`,c);return c.__x}
const byLeague=load('data/clubs.js','clubsByLeague'),clubs=Object.values(byLeague).flat();
const id=load('js/visualIdentity.js','{getClubIdentity,getClubCrestSvg,getLeagueMark,applyLeagueMark,CLUB_CREST_RECIPES,LEAGUE_MARK_RECIPES,CLUB_IDENTITY_PALETTES}');
const leagueIds=['premier_league','laliga','bundesliga','serie_a','ligue_1'];
A.equal(clubs.length,98);
A.deepEqual(Object.keys(id.CLUB_CREST_RECIPES).sort(),[...clubs].sort(),'every exact club name has a recipe and no extra keys');
for(const n of clubs){const r=id.CLUB_CREST_RECIPES[n];A.ok(Object.isFrozen(r)&&r.shape&&typeof r.pattern==='string'&&typeof r.motif==='string'&&r.keep&&r.change,n);}
const normal=s=>s.replace(/cmsc[0-9a-z]+x/g,'ID');
const crests=clubs.map(n=>{const x=id.getClubIdentity(n);A.ok(x.crest.startsWith('url("data:image/svg+xml,'),n);A.equal(x.recipe,id.CLUB_CREST_RECIPES[n]);const svg=id.getClubCrestSvg(n);A.ok(svg.startsWith('<svg')&&!/<image\b/i.test(svg)&&!/<text\b/i.test(svg),n);A.ok(!svg.includes(n)&&!decodeURIComponent(x.crest).includes(n),`${n} name not baked in`);return normal(svg)});
A.equal(new Set(crests).size,98,'98 unique crest drawings (ids normalised)');
A.equal(new Set(clubs.map(n=>id.getClubIdentity(n).crest)).size,98);
const idsOf=s=>[...s.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
const refsOf=s=>[...s.matchAll(/url\(#([^)]+)\)/g)].map(m=>m[1]);
const page=[id.getClubCrestSvg('Arsenal'),id.getClubCrestSvg('Arsenal'),id.getClubIdentity('Arsenal').crestSvg,id.getClubCrestSvg('Bayern Munich'),id.getClubCrestSvg('Bayern Munich'),id.getClubCrestSvg('Bayern Munich'),id.getLeagueMark('premier_league').svg,id.getLeagueMark('premier_league').svg,id.getLeagueMark('premier_league').svg,id.getLeagueMark('ligue_1').svg].join('');
const pageIds=idsOf(page);A.equal(new Set(pageIds).size,pageIds.length,'unique ids across repeated instances');A.ok(refsOf(page).every(r=>pageIds.includes(r)),'every url(#) ref resolves');
A.deepEqual(Object.keys(id.LEAGUE_MARK_RECIPES).sort(),[...leagueIds].sort());
for(const l of leagueIds){const m=id.getLeagueMark(l);A.deepEqual(Object.keys(m).sort(),['code','id','image','primary','svg']);A.equal(m.id,l);A.ok(m.image.startsWith('url("data:image/svg+xml,')&&!/<image\b/i.test(m.svg));A.match(m.code,/^[A-Z]{3} · I$/);A.ok(!/premier|liga|bundes|serie|ligue/i.test(m.svg.replace(/id="[^"]+"/g,'')));}
const el={dataset:{},style:{p:{},setProperty(k,v){this.p[k]=v},removeProperty(k){delete this.p[k]}}};id.applyLeagueMark(el,'serie_a');A.equal(el.dataset.leagueMark,'original');A.ok(el.style.p['--league-mark-image'].startsWith('url("data:image/svg+xml,'));
const u=id.getClubIdentity('Unknown Test FC');A.ok(u.primary&&u.secondary&&u.accent&&u.crest.startsWith('url("data:image/svg+xml,')&&u.recipe&&u.initials);A.ok(!/<image\b/i.test(id.getClubCrestSvg('Unknown Test FC')));
const hostile=['constructor','__proto__','toString','hasOwnProperty','valueOf','','!!!---...???','Ünïcødé Ψ 足球 FC'];
for(const n of hostile){const x=id.getClubIdentity(n);A.ok(!Object.prototype.hasOwnProperty.call(id.CLUB_IDENTITY_PALETTES,n)&&!Object.prototype.hasOwnProperty.call(id.CLUB_CREST_RECIPES,n),`${JSON.stringify(n)} is unknown`);
for(const k of ['primary','secondary','accent'])A.ok(typeof x[k]==='string'&&/^#[0-9a-f]{3,8}$/i.test(x[k]),`${JSON.stringify(n)} ${k}=${x[k]}`);
A.ok(x.crest.startsWith('url("data:image/svg+xml,')&&!/undefined/.test(decodeURIComponent(x.crest))&&!/<image\b/i.test(decodeURIComponent(x.crest)),`${JSON.stringify(n)} crest`);
const svg=id.getClubCrestSvg(n);A.ok(svg.startsWith('<svg')&&!/undefined/.test(svg)&&!/<image\b/i.test(svg),`${JSON.stringify(n)} svg`);A.equal(x.recipe.change,'generated fallback crest',`${JSON.stringify(n)} uses fallback recipe`);}
for(const n of ['constructor','__proto__','toString','hasOwnProperty',''])A.equal(id.getLeagueMark(n),null,`league ${JSON.stringify(n)}`);
A.equal(Object.keys(id.CLUB_CREST_RECIPES).length,98,'known recipe count unchanged');for(const n of clubs)A.equal(id.getClubIdentity(n).recipe,id.CLUB_CREST_RECIPES[n],n);
for(const p of ['visual-assets/crests/CREST_REVIEW.html','visual-assets/crests/CREST_REVIEW_STANDALONE.html']){const h=read(p),ln=h.match(/const LEAGUE_NOTES=(\{.*?\});/);A.ok(ln,`${p} league notes`);const notes=vm.runInNewContext(`(${ln[1]})`);A.deepEqual(Object.keys(notes).sort(),[...leagueIds].sort(),p);for(const l of leagueIds)A.ok(notes[l].length===2&&notes[l].every(t=>typeof t==='string'&&t.length>10),`${p} ${l}`);A.ok(/<b>Keeps<\/b> \$\{esc\(LEAGUE_NOTES\[id\]\[0\]\)\}<br><b>Changes<\/b> \$\{esc\(LEAGUE_NOTES\[id\]\[1\]\)\}/.test(h),`${p} league card renders Keeps/Changes`);A.ok(/<b>Keeps<\/b> \$\{esc\(x\.recipe\.keep\)\}<br><b>Changes<\/b> \$\{esc\(x\.recipe\.change\)\}/.test(h),`${p} club card renders Keeps/Changes`);}
A.equal(id.getLeagueMark('nope'),null);
const src=read('js/visualIdentity.js');A.ok(!/<image\b/i.test(src)&&!/assets\/logos\//i.test(src));
console.log(`PASS CREST-V1 identity contracts: ${clubs.length} recipes, ${new Set(crests).size} unique crests, ${leagueIds.length} league marks, ${pageIds.length} ids unique on shared page, ${hostile.length} hostile/edge unknown names fall back cleanly, league Keeps/Changes in both review pages.`);
