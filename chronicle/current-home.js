(() => {
  const d=window.CHRONICLE_SUMMARY;
  if(!d)return;
  const e=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const kind=document.getElementById('home-worker-kind'),chart=document.getElementById('home-worker-chart');
  if(!kind||!chart)return;
  function render(){const k=kind.value;chart.innerHTML=Object.entries(d.workers).map(([name,w])=>{const a=k==='All'?[w.jobs,w.first_try]:w.by_kind[k];if(!a?.[0])return '';const percent=100*a[1]/a[0];return `<div class="home-worker-row"><div><span>${e(name)}</span><b>${a[1]} / ${a[0]} · ${percent.toFixed(1)}%</b></div><i><em style="width:${percent}%"></em></i></div>`;}).join('');}
  kind.addEventListener('change',render);render();
})();
