(() => {
  'use strict';
  const data = window.CHRONICLE_RESEARCH;
  if (!data) return;
  const escape = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const fmt = value => Number(value).toLocaleString('en-US');
  const link = (url, text) => `<a class="source-link" href="${escape(url)}" target="_blank" rel="noopener">${escape(text)} ↗</a>`;
  const r = data.repository;
  const metrics = [
    [r.reachableCommits,'COMMITS REACHABLE FROM MAIN','Merged branch history and merge commits included.'],
    [r.firstParentCommits,'FIRST-PARENT MAIN COMMITS','The main integration spine, including documentation.'],
    [r.contractPaths,'REGISTERED PRODUCT TEST PATHS','Unique manifest + supplemental registry paths.'],
    [r.heavyProofIds,'HEAVY PROOF IDENTIFIERS','Unique IDs in the inherited impact graph.'],
    [r.javascriptModules,'JAVASCRIPT FILES UNDER JS/','A file-path count, not a feature count.'],
    [r.releaseRecords,'ROOT RELEASE RECORD FILES','Historical documents, not distinct shipped releases.']
  ];
  document.querySelector('#research-metrics').innerHTML = metrics.map(([value,label,scope]) => `<article><strong>${fmt(value)}</strong><span>${label}</span><p>${scope}</p></article>`).join('');
  const max = Math.max(...r.months.map(month => month.commits));
  document.querySelector('#cadence-chart').innerHTML = r.months.map(month => {
    const name = new Date(`${month.month}-01T12:00:00Z`).toLocaleDateString('en-US',{month:'short',timeZone:'UTC'});
    return `<div class="cadence-row"><span>${name}</span><div><i style="width:${Math.max(2,month.commits/max*100).toFixed(2)}%" aria-hidden="true"></i></div><strong>${fmt(month.commits)}</strong></div>`;
  }).join('');
  document.querySelector('#research-methodology').innerHTML = `<ul><li><strong>History:</strong> 3,097 commit objects reachable from pinned main; 787 first-parent commits. The four monthly counts sum to 787. Recorded author dates determine the month.</li><li><strong>Tests:</strong> the union of the current product manifest and supplemental registry contains ${r.contractPaths} unique paths. The graph contains ${r.heavyProofIds} unique heavy proof IDs across ${r.invariants} invariant owners. Counting their definitions does not report a new execution or passing run.</li><li><strong>Files:</strong> main contains ${fmt(r.trackedFiles)} tracked file paths, ${r.javascriptModules} JavaScript files under <code>js/</code>, ${r.workflowFiles} YAML workflow files under <code>.github/workflows/</code>, and ${r.releaseRecords} root <code>RELEASE_*.md</code> records. The 16 legacy gate entries in the coverage map are a different unit from workflow files.</li><li><strong>Factories:</strong> per-job status files are counted on separate pinned branches. Prefixes such as “DONE (merged…)” normalize to DONE; superseded labels normalize to SUPERSEDED. The original text is retained in the ledger.</li><li><strong>Reviews:</strong> a current intake marker is a retained line in a file. Historical first-pass and fix-round results come from the published scorecard. These are different measures, with different denominators.</li></ul><p class="scope-note">Collection: ${escape(data.collectedAt.slice(0,16).replace('T',' '))} UTC. Main: ${escape(data.refs.main.slice(0,7))}; Team G: ${escape(data.refs['factory/gameplay-v1'].slice(0,7))}; Team V: ${escape(data.refs['factory/v1-wtt5ye'].slice(0,7))}.</p><div class="research-source-row">${data.sources.slice(0,3).map(s=>link(s.url,s.title)).join('')}</div>`;

  const filters = document.querySelector('.ledger-filters');
  function renderLedger(category='All') {
    const records = data.milestones.filter(row => category==='All'||row.category===category);
    document.querySelector('#milestone-ledger').innerHTML = records.map(row => `<article><time datetime="${row.date}">${new Date(`${row.date}T12:00:00Z`).toLocaleDateString('en-US',{month:'short',day:'numeric',timeZone:'UTC'})}<span>2026</span></time><div><span class="milestone-category">${escape(row.category)}</span><h3>${escape(row.title)}</h3><p>${escape(row.description)}</p></div><a href="${escape(row.source)}" target="_blank" rel="noopener" aria-label="Inspect commit for ${escape(row.title)}">${row.sha.slice(0,7)} ↗</a></article>`).join('');
    filters.querySelectorAll('button').forEach(b => {const active=b.dataset.ledger===category;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
  }
  filters.addEventListener('click',e=>{const button=e.target.closest('[data-ledger]');if(button)renderLedger(button.dataset.ledger);});
  renderLedger();

  document.querySelector('#factory-snapshot').innerHTML = ['v','g'].map(key => {
    const team=data.factories[key];
    const completed=(team.states.DONE||0)+(team.states.MERGED||0);
    return `<article><span class="eyebrow">TEAM ${key.toUpperCase()} / ${key==='v'?'VISUAL':'GAMEPLAY'} FACTORY</span><div class="snapshot-total">${team.jobs.length}<span>STATUS FILES</span></div><div class="snapshot-states">${Object.entries(team.states).map(([state,count])=>`<span><b>${count}</b> ${escape(state.toLowerCase())}</span>`).join('')}</div><p>${key==='v'?`${team.intakePass} records contain a retained Claude intake PASS marker. This is a status snapshot, not an independent re-review.`:`${completed} records carry DONE or MERGED labels. That does not establish that every item is deployed to main.`}</p>${link(data.sources[key==='v'?4:3].url,'Inspect the pinned status directory')}</article>`;
  }).join('');
  document.querySelector('#worker-table-body').innerHTML = data.visualScorecard.rows.map(row => `<tr><th scope="row">${escape(row.worker)}</th><td>${row.jobs}</td><td><span class="worker-pass">${row.firstPass} / ${row.jobs}</span><span class="worker-rate">${(row.firstPass/row.jobs*100).toFixed(1)}%</span></td><td>${row.fixRounds}</td><td>${escape(row.firstScore)}</td></tr>`).join('');
  document.querySelector('#visual-scorecard-source').href=data.visualScorecard.source;
  const factSheet=document.querySelector('.fact-sheet dl');
  if(factSheet)factSheet.insertAdjacentHTML('beforeend',`<div><dt>Repository history</dt><dd>${fmt(r.reachableCommits)} reachable commits · ${r.firstParentCommits} first-parent main commits</dd></div><div><dt>Registered proof definitions</dt><dd>${r.contractPaths} product test paths · ${r.heavyProofIds} heavy proof IDs · counts, not a new passing run</dd></div><div><dt>Pinned factory records</dt><dd>Team V ${data.factories.v.jobs.length} status files · Team G ${data.factories.g.jobs.length} status files</dd></div><div><dt>Historical visual cohort</dt><dd>4 October: ${data.visualScorecard.firstPass} first passes / ${data.visualScorecard.jobs} jobs · ${data.visualScorecard.fixRounds} fix rounds</dd></div>`);
  const gScore=data.gameplayScorecard;
  const gCounts=gScore.firstTimeStates;
  document.querySelector('#gameplay-scorecard-note').innerHTML=`<span class="small-label">THE GAMEPLAY SCORECARD USES A DIFFERENT COHORT</span><p>Its ${gScore.rows.length} rows record <strong>${gCounts.yes||0} first-time successes</strong>, <strong>${gCounts.no||0} requiring correction</strong>, and <strong>${gCounts.unknown||0} unknown outcomes</strong>. The table preserves unknown model details, ambiguous fix-round counts and unmeasured costs. It also records what the checks caught, including identity, registry, Rules-budget and whole-journey defects.</p><p>The visual cohort and this gameplay cohort cover different work and acceptance conventions. Their pass rates should not be combined.</p>${link(gScore.source,'Read the gameplay worker scorecard')}`;

  let page=0;
  const pageSize=8;
  const teamSelect=document.querySelector('#job-team');
  const stateSelect=document.querySelector('#job-state');
  const search=document.querySelector('#job-search');
  function setStates() {
    const states=Object.keys(data.factories[teamSelect.value].states);
    stateSelect.innerHTML='<option value="All">All states</option>'+states.map(state=>`<option value="${escape(state)}">${escape(state)}</option>`).join('');
  }
  function renderJobs() {
    const team=data.factories[teamSelect.value];
    const query=search.value.toLowerCase().trim();
    const jobs=team.jobs.filter(row=>(stateSelect.value==='All'||row.state===stateSelect.value)&&`${row.job} ${row.title} ${row.rawState}`.toLowerCase().includes(query));
    const pages=Math.max(1,Math.ceil(jobs.length/pageSize));
    page=Math.min(page,pages-1);
    const shown=jobs.slice(page*pageSize,(page+1)*pageSize);
    document.querySelector('#job-count').textContent=`${jobs.length} / ${team.jobs.length} RECORDS`;
    document.querySelector('#job-records').innerHTML=shown.length?shown.map(row=>`<a class="job-record" href="${escape(row.source)}" target="_blank" rel="noopener"><span class="job-id">${escape(row.job)}</span><div><strong>${escape(row.title.replace(/^Status\s*[·:]\s*JOB-[\w.-]+\s*[·:]\s*/,''))}</strong><small>Step: ${escape(row.step)}${row.intakePass?' · Retained intake PASS':''}</small></div><span class="job-state ${row.state==='DONE'||row.state==='MERGED'?'complete':''}">${escape(row.rawState)}</span><span aria-hidden="true">↗</span></a>`).join(''):'<p class="empty-sources">No status records match. Try another team, state or search.</p>';
    document.querySelector('#job-page').textContent=`Page ${page+1} of ${pages}`;
    document.querySelector('#jobs-prev').disabled=page===0;
    document.querySelector('#jobs-next').disabled=page===pages-1;
  }
  teamSelect.addEventListener('change',()=>{page=0;setStates();renderJobs();});
  stateSelect.addEventListener('change',()=>{page=0;renderJobs();});
  search.addEventListener('input',()=>{page=0;renderJobs();});
  document.querySelector('#jobs-prev').addEventListener('click',()=>{if(page>0)page--;renderJobs();});
  document.querySelector('#jobs-next').addEventListener('click',()=>{page++;renderJobs();});
  setStates();renderJobs();

  if (typeof sources!=='undefined'&&typeof renderSources==='function') {
    data.sources.forEach(s=>sources.push([s.title,'Edition 03 · pinned research source',s.url]));
    const extraTitles=['v1.0.0 stable release','Candidate A: protected export','Candidate B: import analysis','Candidate C: atomic restore','An installable offline app','Profiles and Save Library','Explicit manager identity linkage','Multi-save portability','A richer Save Library','Connected Rivalry'];
    extraTitles.forEach(title=>{const row=data.milestones.find(m=>m.title===title);if(row)sources.push([row.title,`${row.date} · ${row.category} · source milestone`,row.source]);});
    renderSources(document.querySelector('#source-search').value);
  }
})();
