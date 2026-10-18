/* Report Studio — inert, escaped, print-ready reports for the seven existing demo labs.
 * Pure browser/Node formatter. No API calls, remote assets, or client-side execution.
 */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.BKReportEngine=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const clean=value=>String(value??'').trim().slice(0,5000);
  function normalize(m){
    if(!m||typeof m!=='object'||!m.title)throw Error('Report title required.');
    if(!Array.isArray(m.metrics)||!Array.isArray(m.findings)||!Array.isArray(m.recommendations))throw Error('Report sections missing.');
    const bounded=(arr,max)=>arr.slice(0,max);
    return {
      title:clean(m.title),area:clean(m.area||'SECURITY ENGINEERING'),subtitle:clean(m.subtitle||'Independent educational demonstration'),
      generated:clean(m.generated||new Date().toISOString()),scope:clean(m.scope||'Synthetic example data, browser-only review'),
      metrics:bounded(m.metrics,12).map(x=>({label:clean(x.label),value:clean(x.value),note:clean(x.note)})),
      findings:bounded(m.findings,300).map(x=>({id:clean(x.id),finding:clean(x.finding),status:clean(x.status),evidence:clean(x.evidence),action:clean(x.action)})),
      recommendations:bounded(m.recommendations,35).map(clean),
      limitations:bounded(Array.isArray(m.limitations)?m.limitations:[],15).map(clean),
      methodology:clean(m.methodology||'Rule-based illustrative evaluation of the data shown in this browser.'),
      version:'BK-RPT-1.0'
    };
  }
  function html(model){
    const m=normalize(model);
    const metricCards=m.metrics.map(x=>'<div class="metric"><small>'+esc(x.label)+'</small><strong>'+esc(x.value)+'</strong><span>'+esc(x.note)+'</span></div>').join('');
    const rows=m.findings.map((f,i)=>'<tr><td class="rowid">'+esc(f.id||String(i+1))+'</td><td><b>'+esc(f.finding)+'</b></td><td><span class="status">'+esc(f.status)+'</span></td><td>'+esc(f.evidence)+'</td><td>'+esc(f.action)+'</td></tr>').join('');
    const list=arr=>'<ol>'+arr.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ol>';
    return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'+
    '<meta name="color-scheme" content="light"><title>'+esc(m.title)+' | Brandon Keesecker</title><style>'+
    ':root{font:14px/1.6 Inter,system-ui,Arial,sans-serif;color:#173047;background:#f2f7fb}*{box-sizing:border-box}body{margin:0}'+
    '.sheet{max-width:1060px;margin:30px auto;background:white;padding:58px 63px;box-shadow:0 15px 55px #20304419}header{display:flex;justify-content:space-between;gap:20px;border-bottom:3px solid #168f91;padding-bottom:22px;margin-bottom:34px}.eyebrow{color:#138d8e;letter-spacing:.17em;font-size:10px;font-weight:900}.brand{font-weight:900;color:#0a3442;font-size:14px}h1{font-size:42px;letter-spacing:-.05em;line-height:1.12;margin:14px 0}.lead{font-size:16px;color:#546679;margin:10px 0 25px;max-width:760px}.meta{font-size:11px;color:#62758a;text-align:right}.notice{padding:15px 19px;background:#edf6f5;border-left:4px solid #148c8e;color:#284b53;font-size:12px;margin:26px 0}h2{font-size:19px;margin:36px 0 14px;padding-bottom:9px;border-bottom:1px solid #dce6ed;letter-spacing:-.025em}.kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.metric{background:#eff5f8;border:1px solid #dbe6eb;border-radius:9px;padding:15px;min-height:115px}.metric small{font-size:10px;display:block;color:#546d7a;letter-spacing:.04em;text-transform:uppercase;font-weight:750}.metric strong{font-size:27px;line-height:1.5;display:block;color:#086b74;overflow-wrap:anywhere}.metric span{font-size:10px;color:#65798c;display:block}table{width:100%;border-collapse:collapse;font-size:11px;table-layout:fixed}th{color:#496171;background:#eaf2f5;text-align:left;text-transform:uppercase;font-size:9px;letter-spacing:.06em}th,td{border-bottom:1px solid #dfe8ee;padding:10px 8px;vertical-align:top;overflow-wrap:anywhere}th:nth-child(1){width:11%}th:nth-child(2){width:25%}th:nth-child(3){width:15%}th:nth-child(4){width:24%}th:nth-child(5){width:25%}.rowid{font-weight:800;color:#126d78}.status{border-radius:4px;background:#eaf2f8;font-weight:700;font-size:10px;padding:3px 5px}li{margin:8px 0}p{margin:8px 0}footer{font-size:10px;color:#718392;border-top:1px solid #dce6ed;padding-top:20px;margin-top:46px;display:flex;justify-content:space-between;gap:15px}.actions{max-width:1060px;margin:20px auto 0;display:flex;gap:9px}.actions button{background:#086b74;border:0;border-radius:8px;color:#fff;padding:11px 17px;font-weight:750;cursor:pointer}'+
    '@media(max-width:730px){.sheet{padding:26px 18px;margin:0}.kpis{grid-template-columns:repeat(2,1fr)}header{flex-direction:column}.meta{text-align:left}h1{font-size:32px}table{min-width:730px}.tablewrap{overflow-x:auto}.actions{padding:0 18px}}'+
    '@media print{@page{size:A4;margin:14mm}body{background:white}.sheet{max-width:none;margin:0;padding:0;box-shadow:none}.actions{display:none}.metric{break-inside:avoid}h2{break-after:avoid}tr{break-inside:avoid}table{font-size:9px}}'+
    '</style></head><body><div class="actions"><button type="button" onclick="window.print()">Print / Save as PDF</button></div><main class="sheet"><header><div><div class="eyebrow">INDEPENDENT SECURITY ENGINEERING · PROJECT REPORT</div><div class="brand">BK // BRANDON KEESECKER</div></div><div class="meta">Report '+esc(m.version)+'<br>'+esc(m.generated)+'<br>Locally generated</div></header>'+
    '<div class="eyebrow">'+esc(m.area)+'</div><h1>'+esc(m.title)+'</h1><p class="lead">'+esc(m.subtitle)+'</p>'+
    '<div class="notice"><b>Demonstration boundary.</b> All preloaded data is fictional. User-provided data is reviewed only in this browser. This is not a formal security assessment, SOC conclusion, certification, FedRAMP authorization, DoD impact-level determination, or regulatory audit.</div>'+
    '<h2>Executive overview</h2><div class="kpis">'+metricCards+'</div>'+
    '<h2>Review scope</h2><p>'+esc(m.scope)+'</p><h2>Observations and evidence</h2>'+
    (rows?'<div class="tablewrap"><table><thead><tr><th>ID</th><th>Observation</th><th>Status</th><th>Evidence / context</th><th>Next action</th></tr></thead><tbody>'+rows+'</tbody></table></div>':'<p>No findings or review records were generated for the selected example.</p>')+
    '<h2>Recommended verification</h2>'+(m.recommendations.length?list(m.recommendations):'<p>Verify the model assumptions and collect additional evidence before making a decision.</p>')+
    '<h2>Methodology and limitations</h2><p>'+esc(m.methodology)+'</p>'+list(m.limitations.length?m.limitations:['Educational model only; results require independent validation.'])+
    '<footer><span>Brandon Keesecker · Security engineering portfolio</span><span>Fictional demonstration · No production assurance implied</span></footer></main></body></html>';
  }
  function markdown(model){
    const m=normalize(model);
    const arr=['# '+m.title,'',m.subtitle,'','> Independent educational demonstration — not an official assessment.','','## Metrics'];
    for(const v of m.metrics)arr.push('- '+v.label+': '+v.value+(v.note?' ('+v.note+')':''));
    arr.push('','## Findings');
    for(const f of m.findings)arr.push('### '+f.id+' — '+f.finding,'Status: '+f.status,'Evidence: '+f.evidence,'Next action: '+f.action,'');
    arr.push('## Recommended verification',...m.recommendations.map(x=>'- '+x),'','## Methodology',m.methodology,'','## Limitations',...m.limitations.map(x=>'- '+x));
    return arr.join('\n')+'\n';
  }
  return Object.freeze({escape:esc,normalize,html,markdown});
});
